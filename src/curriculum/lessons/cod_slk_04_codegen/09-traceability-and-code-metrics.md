---
id: l09-traceability-and-code-metrics
title: Reading generated code, tracing it and measuring it
minutes: 23
covers:
  - 'Traceability: generated C comments and the HTML report linking back to blocks'
  - 'Code metrics: RAM, ROM and stack; the Code Profile Analyzer'
---

Some translated books print the original page numbers in the margin. You read the English, and whenever a sentence puzzles you, the margin says "page 212 of the original", so you can go and check what the author really wrote. A reviewer comparing the two versions can go line by line in either direction. Nothing is lost between the languages without someone noticing.

Generated C carries the same margin notes. Every statement says which block of the model it came from, and a report lets you jump from a block to its code and back. That is **traceability**: being able to follow any piece of the flight code back to the design element that caused it, and forward again. The previous two lessons shaped what the code looks like from outside: the data interface, the parameters, the number types. This lesson opens the code and reads it, then asks the two questions every flight processor forces on you: how much memory does it take, and how long does it take to run?

The requirements links of lesson 4 connect requirements to blocks and tests. This lesson adds the last link in that chain, from block to line of C.

## Comments that name blocks

Turn on Embedded Coder's comment options and each group of generated statements is preceded by a comment in a fixed form: the **block type**, a colon, and the block's path in quotes. For a Gain block named `Kp` at the top level of a model, the comment reads `Gain: '<Root>/Kp'`.

The path is written with a short tag in angle brackets instead of the full model path:

- `<Root>` means the top level of the model.
- `<S1>`, `<S2>` and so on name the subsystems, numbered by the code generator. A block inside the second subsystem is tagged like `'<S2>/Kp'`.

The key to the numbers is at the bottom of the model's header file, in a comment that starts with the words "Here is the system hierarchy for this model" and lists each tag with its full path, such as `'<S2>' : 'pid/Controller'`. If you have the model open in MATLAB, `hilite_system('<S2>/Kp')` highlights the block that tag names.

Here is a **sketch in the style of ERT output** for a discrete PI controller named `pid`. The comment layout follows what Embedded Coder writes; the rest is simplified, and the real file has more.

```c
/* pid.c -- hand-written sketch in the style of ERT output (illustrative) */
typedef struct { double ref; double meas; } ExtU_pid_T;
typedef struct { double u; } ExtY_pid_T;
typedef struct { double Integrator_DSTATE; } DW_pid_T;
typedef struct { double Kp_Gain; double Ki_Gain; } P_pid_T;

ExtU_pid_T pid_U;
ExtY_pid_T pid_Y;
DW_pid_T   pid_DW;
P_pid_T    pid_P = { 2.5, 0.4 };

/* Model step function */
void pid_step(void)
{
  double rtb_Sum;

  /* Sum: '<Root>/Sum' incorporates:
   *  Inport: '<Root>/meas'
   *  Inport: '<Root>/ref'
   */
  rtb_Sum = pid_U.ref - pid_U.meas;

  /* Outport: '<Root>/u' incorporates:
   *  DiscreteIntegrator: '<Root>/Integrator'
   *  Gain: '<Root>/Kp'
   *  Sum: '<Root>/Sum1'
   */
  pid_Y.u = pid_P.Kp_Gain * rtb_Sum + pid_DW.Integrator_DSTATE;

  /* Update for DiscreteIntegrator: '<Root>/Integrator' incorporates:
   *  Gain: '<Root>/Ki'
   */
  pid_DW.Integrator_DSTATE += 0.01 * (pid_P.Ki_Gain * rtb_Sum);
}

/* Model initialize function */
void pid_initialize(void)
{
  pid_DW.Integrator_DSTATE = 0.1;   /* InitialCondition, for the example */
}
```

Notice the word **incorporates**. The code generator does not write one line per block. It merges a chain of simple blocks into one expression, which is called **[[expression folding|expression-folding]]**. The Sum, the Kp gain, the second Sum and the integrator's output all became one assignment, so the comment above it lists every block that assignment contains. When you look for a block, search the comments, not only the first word of each comment.

Some blocks produce no code at all. An Inport, a Mux or the boundary of a plain subsystem only routes signals; these are **[[virtual blocks|virtual-blocks]]**. Others are removed because their output is never used, or because a computation on constants was folded into a single number. With the option **Show eliminated blocks** turned on, the generated code lists each removed block with the reason. So every block is accounted for: it is in the code, it is marked virtual, or it is listed as eliminated.

::: key
Traceability comments: each generated statement is preceded by a comment naming its source block, in the form BlockType: 'path', where `<Root>` is the model's top level and `<S1>`, `<S2>`, … are subsystems listed in the header's system hierarchy. "incorporates:" lists further blocks folded into the same statement.
:::

The **Comments** settings for code generation decide what goes in: **Include comments** is the master switch, **Simulink block comments** adds the block-path comments above, **Show eliminated blocks** lists removed blocks, and **Requirements in block comments** copies the text of requirements linked to a block into its comment, so a reviewer reading the C sees the requirement without leaving the file.

## The HTML code generation report

Comments work in any text editor. The **code generation report** is better: an HTML page that Embedded Coder writes beside the code when **Create code generation report** is on. It shows every generated file with syntax coloring, plus a set of summary pages. Two options turn its links on:

- **Code-to-model**: every block path in a comment becomes a hyperlink. Click `'<Root>/Kp'` and Simulink opens the model and highlights the Kp block.
- **Model-to-code**: in the model, right-click a block and choose **C/C++ Code**, then **Navigate to C/C++ Code**. The report highlights every line that block produced. In the Embedded Coder app, the **Code** view beside the canvas does the same: select a block and its lines light up.

Inside the report you will find, among others:

- the **Code Interface Report**: the entry points and their arguments, the inports, outports and tunable parameters, with the C names that the storage classes and code mappings of lesson 7 gave them;
- the **Traceability Report**: a table of every block in the model with links to its code, plus the lists of virtual and eliminated blocks;
- the **Static Code Metrics Report**, which the next section uses;
- the **Code Replacements Report**, listing each replacement a code replacement library made (lesson 8).

This is what a certification reviewer uses. Under **[[DO-178C|do-178c]]**, the standard for airborne software, each level of the design must trace to the level above and below. Generated code with block comments, linked to a model whose blocks link to requirements, gives the reviewer the whole chain.

::: key
How does generated code satisfy a DO-178C traceability objective? Every generated statement carries a comment naming the originating block, and the HTML code-generation report links code to model to requirement, so a reviewer can trace requirement to model element to source line to test.
:::

### Finding the line for one block

This module's first objective is to find the line of generated code for a specific gain block. Here is the routine, which works for any block.

1. Generate code with Simulink block comments on and the report's model-to-code tracing on.
2. In the model, right-click the Gain block and navigate to its C code. The report opens and highlights its lines.
3. Or, without the report: open the model's `.c` file and search for the block's path, such as `'<Root>/Kp'`. For a block inside a subsystem, first read its `<S…>` tag from the system hierarchy in the header.
4. Read the highlighted statement and find the gain in it. If the parameter is tunable, you will see a field of the parameter structure, such as `pid_P.Kp_Gain`. If it is inlined, you will see a literal number.
5. If the comment says "incorporates", the gain is one factor inside a larger expression. Find the multiplication that belongs to it.

::: example Tracing Kp in the sketch
Use the sketch above, with `ref` = 1.0, `meas` = 0.2 and the integrator starting at 0.1. Find Kp's line, name its symbol, and predict the first output.

**Step 1: search for the path.** `'<Root>/Kp'` appears once, in the comment above `pid_Y.u = ...`, under "incorporates". So Kp was folded into the output statement.

**Step 2: find its factor.** In that statement the only gain multiplication is `pid_P.Kp_Gain * rtb_Sum`. The symbol for the proportional gain is `pid_P.Kp_Gain`, a field of the parameter structure `pid_P` of type `P_pid_T`, so this parameter is tunable. Its value, from the initializer, is 2.5.

**Step 3: the error.** The Sum line computes `rtb_Sum` as $1.0 - 0.2 = 0.8$.

**Step 4: the output.** $u = 2.5 \times 0.8 + 0.1 = 2.1$.

**Step 5: the next step.** The integrator update adds $0.01 \times 0.4 \times 0.8 = 0.0032$, so with the same inputs the second output is $2.1032$. Running the sketch with a small `main` prints `u = 2.1000` and then `u = 2.1032`.

**Sanity check.** The proportional part, $2.5 \times 0.8 = 2.0$, is most of the output, as it should be at the first step, when the integrator has barely moved.
:::

::: warning A comment is not a proof
A block comment says where a statement came from. It does not say the statement is right. That is why traceability is paired with SIL equivalence tests (lesson 1) and code review. And if someone edits the generated file by hand, the comments still point to blocks that no longer match the code. Never edit generated code; change the model and regenerate.
:::

## Code metrics: RAM, ROM and stack

A flight processor has fixed amounts of memory, and there is no swapping to disk. Before code ships, you need three numbers.

- **ROM** (in practice, **flash**): the memory that keeps its contents with the power off. It holds the program's instructions, its constant data, and the starting values of initialized variables. Lines of code are a rough proxy for it.
- **RAM**: the working memory. It holds the global variables, including the model's signal, state and tunable-parameter structures, and the stack.
- **Stack**: the part of RAM that holds each function call's local variables and return address while it runs. It grows with every nested call. Its size must be set in advance, and if the deepest chain of calls needs more, the program overwrites whatever lies next to the stack. The number that matters is the worst case along the call tree.

::: key
Code metrics: RAM (global variables and stack), ROM (code, constants and initial values in flash) and stack (worst-case depth along the call tree) must each fit the target with margin. The Static Code Metrics Report estimates them from the generated C.
:::

The **Static Code Metrics Report** in the code generation report gives an early estimate from the C source alone. It lists the files with their lines of code and comment lines; the **global variables** with their size in bytes; and each function with its lines, its **[[cyclomatic complexity|cyclomatic]]**, and its **stack size**, both for the function alone and accumulated through everything it calls. Because it reads source, not machine code, it is an estimate. The final numbers come from the target compiler and linker.

::: example Measuring the sketch with gcc
Compile the `pid.c` sketch on a PC with `gcc -O2 -fstack-usage -c pid.c`, then run the standard `size` tool on the result.

```text
   text    data     bss     dec     hex filename
    227      16      32     275     113 pid.o
```

The `-fstack-usage` option writes a `.su` file with each function's stack frame:

```text
pid.c:13:6:pid_step        8   static
pid.c:37:6:pid_initialize  8   static
```

**Step 1: read `data`.** The **data** section holds initialized globals: `pid_P` with two doubles, $2 \times 8 = 16$ bytes. It matches.

**Step 2: read `bss`.** The **bss** section holds globals that start at zero: `pid_U` (two doubles, 16 bytes), `pid_Y` (8) and `pid_DW` (8), so $16 + 8 + 8 = 32$ bytes. It matches.

**Step 3: RAM.** $16 + 32 = 48$ bytes of globals, plus the stack.

**Step 4: flash.** The **text** section (instructions and constants) is 227 bytes. The 16 bytes of starting values for `pid_P` must also be stored in flash, to be copied into RAM at start-up: $227 + 16 = 243$ bytes.

**Step 5: stack.** Each function uses 8 bytes of stack on this PC, the return address, because the optimizer kept `rtb_Sum` in a register. Neither function calls another, so the worst case is 8 bytes.

**Sanity check.** These numbers are for an x86-64 PC. The same code built by the cross-compiler for a 32-bit flight processor will give different text and stack sizes. The data and bss sizes are set by the types (a double is 8 bytes on both), so those should agree. Always take the real numbers from the target build and its **[[memory map|memory-map]]**.
:::

## Execution time and the Code Profile Analyzer

Memory is only half the budget. A step called at 100 Hz must finish well within 10 ms, every time, with room left for everything else the processor runs. So you measure it.

Embedded Coder can **profile** the code during a SIL or PIL run. Turn on **Measure task execution time**, and optionally **Measure function execution times**, and the build adds timer reads at the start and end of each step function (and each instrumented function). After the run, the timings land in a MATLAB workspace variable, by default named `executionProfile`. The **Code Profile Analyzer** app opens those results. It shows, for each task and function, how many times it ran, its average and maximum execution time, and a plot of the time taken at every step, so you can see a rare slow step instead of only an average. It can also report how much of the processor's time the code used.

Where you run the profile matters. In SIL, the code runs on your PC, which is much faster and has a different cache and compiler, so the times are good only for comparing one version of the code with another. In PIL, the timer is on the real processor, and the numbers are real cycles on the real chip. That is the first execution time you can put in a timing budget, with the caution from lesson 1 that the PIL setup is not the full flight load.

::: example A timing budget from PIL
A PIL run of an attitude controller with two rates gives these maximum execution times on the flight processor:

| Task | Period | Average | Maximum |
|---|---|---|---|
| Inner rate loop | 1 ms (1 kHz) | 0.14 ms | 0.21 ms |
| Outer attitude loop | 10 ms (100 Hz) | 1.1 ms | 1.8 ms |

The program's rule is that the control software may use at most 50 percent of the processor, leaving the rest for I/O, telemetry and fault management. Does it pass?

**Step 1: the inner loop's share.** It uses up to 0.21 ms of every 1 ms: $0.21 / 1 = 0.21$, or 21 percent.

**Step 2: the outer loop's share.** Up to 1.8 ms of every 10 ms: $1.8 / 10 = 0.18$, or 18 percent.

**Step 3: add them.** $21 + 18 = 39$ percent, below the 50 percent limit, with 11 percentage points to spare.

**Sanity check.** Using the averages would give $14 + 11 = 25$ percent, which looks much healthier. But a controller must meet its deadline on its slowest step, not its typical one, so the budget is built from the maximums, and even those are only the largest values seen in this test, not a guaranteed **[[worst case|wcet]]**.
:::

::: warning SIL timings are not flight timings
It is tempting to profile in SIL because it is quick. A step that takes 20 microseconds on a desktop PC may take a millisecond on a radiation-hardened flight processor. Use SIL profiles only to compare versions; use PIL, and finally the flight hardware, for the budget.
:::

## Check yourself

::: check
A generated file contains the comment `/* Gain: '<S3>/Kd' */`. What do you need to find the block in the model, and where is it?
:::

::: answer
`<S3>` is a subsystem tag, not a path. The system hierarchy comment at the bottom of the model's header file maps it to a full path, for example `'<S3>' : 'pid/Derivative'`, so the block is the Gain named `Kd` inside that subsystem. With the report's code-to-model links on, clicking the path in the comment opens the model and highlights it; at the MATLAB prompt, `hilite_system('<S3>/Kd')` does the same while the model is open.
:::

::: check
You search a generated `.c` file for `'<Root>/Kp'` and it does not appear at the start of any comment, yet the model has a Kp block. Give two possible reasons, and how to tell which is true.
:::

::: answer
First, expression folding: Kp may be listed under "incorporates:" in the comment of a statement named after another block, so search the whole comment text. Second, it may have been eliminated, for example because its output is unused, or folded away as a constant. With Show eliminated blocks on, the code lists it with the reason, and the report's Traceability Report shows whether the block has code, is virtual, or was eliminated.
:::

::: check
A reviewer asks you to show that requirement GNC-114, "pitch rate command shall not exceed 5 deg/s", is implemented in the flight code. Describe the chain you would walk.
:::

::: answer
From the requirement in Requirements Toolbox, follow its link to the Saturation block that implements it (lesson 4). From the block, use model-to-code navigation to reach the generated statement, whose comment names that block and, with Requirements in block comments on, repeats the requirement. Then show the test linked to the requirement and its SIL result, so the chain runs requirement, model element, source line, test.
:::

::: check
The Static Code Metrics Report shows 3.1 KB of global variables and an accumulated stack of 420 bytes for the step function. The target has 8 KB of RAM, and the flight software around the model needs 3 KB of globals and 1 KB of stack. Is there room, and what would you check next?
:::

::: answer
Add it up: $3.1 + 0.42 + 3 + 1 = 7.52$ KB against 8 KB, leaving about 0.48 KB, 6 percent. It fits, but with a thin margin. Next, check the real numbers from the target compiler and linker map, since the report's stack figure is an estimate from source, and look for large tunable tables that could be inlined or made Const to move them into flash.
:::

::: check
Why can a step's average execution time in PIL look fine while the controller still misses deadlines in flight?
:::

::: answer
A deadline is missed by the slowest step, not the average. Some steps do more work: a mode change, a table search at an edge, a rare branch. The Code Profile Analyzer's per-step plot and maximum show those. Beyond that, PIL runs without the rest of the flight software competing for the processor and caches, so the flight maximum can be larger still, which is why the budget keeps margin and the final numbers come from the real flight computer.
:::

## Summary

| Idea | Meaning | Fact to remember |
|---|---|---|
| Block comment | `BlockType: 'path'` above generated statements | `<Root>` top level; `<S1>`, `<S2>` subsystems |
| System hierarchy | Map from tags to full paths | Comment at the end of the model header |
| incorporates | Blocks folded into one statement | Search the whole comment |
| Eliminated / virtual blocks | Blocks with no code | Listed with a reason in the code and report |
| Code-to-model | Click a path in the report, see the block | Report option |
| Model-to-code | Right-click a block, see its lines | Report option; also the Code view |
| Traceability chain | Requirement → block → C line → test | DO-178C traceability evidence |
| RAM | Globals (data, bss) plus stack | Signals, states, tunable parameters |
| ROM / flash | Code, constants, initial values | Text plus data's starting values |
| Stack | Worst case along the call tree | Estimate in report; confirm on target |
| Code Profile Analyzer | Views SIL/PIL execution profiles | Average, maximum, per-step plot; PIL for real timing |

The next lesson turns SIL and PIL into routine tools, running generated code as a Model block simulation mode and comparing it with the model, and then puts the step function inside a hand-written C++ flight application.

::: context expression-folding Why several blocks share one line
If every block got its own statement, each intermediate result would need its own variable, and the code would be longer and slower. Expression folding lets the code generator build one expression from a chain of blocks, as long as the intermediate signals are not needed elsewhere, for example by a test point or a storage class that makes them visible. The price is that one line now belongs to several blocks, which is exactly what the "incorporates:" list records. A signal you must see in the code can be given a storage class so it keeps its own variable.
:::

::: context virtual-blocks Blocks that are only drawing
Some blocks exist to make the diagram readable: Inports and Outports inside subsystems, Mux and Demux, Goto and From, and the boundary of a virtual subsystem from the architecture module. They move signals around on the page without computing anything, so there is nothing for them to become in C. The Traceability Report marks them as virtual, so a reviewer can see they were not forgotten. Atomic and nonvirtual subsystems, in contrast, can become functions of their own.
:::

::: context do-178c The standard behind the paperwork
DO-178C, "Software Considerations in Airborne Systems and Equipment Certification", was published by RTCA in 2011 and is the standard by which aircraft software is approved. It defines five software levels, A (failure is catastrophic) to E (no safety effect), and for each level a set of objectives: requirements traced to design, design traced to code, code verified by tests, and at Level A, MC/DC coverage. Space programs are not bound by it, but many borrow its methods, and its supplement DO-331 covers model-based development like this module's.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="72" height="34" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="46" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">requirement</text>
  <rect x="100" y="35" width="72" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="136" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">block</text>
  <rect x="190" y="35" width="72" height="34" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="226" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">C line</text>
  <rect x="280" y="35" width="72" height="34" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="316" y="56" font-size="11" text-anchor="middle" fill="#1f2a44">test</text>
  <line x1="82" y1="52" x2="100" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="172" y1="52" x2="190" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="262" y1="52" x2="280" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="91" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">link</text>
  <text x="181" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">comment</text>
  <text x="271" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">link</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">traceable in both directions</text>
</svg>
```
:::

::: context cyclomatic Counting the paths
Cyclomatic complexity, introduced by Thomas McCabe in 1976, counts the independent paths through a function: one, plus one for each decision such as an `if`, a loop condition or a `case`. A straight-line function scores 1. A function with ten `if` statements scores 11. High numbers mean more paths to test and more places for bugs, so many coding standards set a limit per function, and the metrics report flags functions that exceed it.
:::

::: context memory-map Where each byte goes
The linker can write a map file listing every section and symbol with its address and size. That is where the real RAM and flash figures come from. Flash holds the instructions (text), the constants, and a copy of the starting values of initialized variables. At power-up, start-up code copies those values into the data section in RAM and fills the bss section with zeros. The stack takes what is left of RAM, so the metrics decide how much is left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="85" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">flash</text>
  <rect x="30" y="26" width="110" height="60" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="85" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">text + constants</text>
  <rect x="30" y="86" width="110" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="85" y="103" font-size="11" text-anchor="middle" fill="#1f2a44">data start values</text>
  <text x="265" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">RAM</text>
  <rect x="210" y="26" width="110" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="265" y="43" font-size="11" text-anchor="middle" fill="#1f2a44">data</text>
  <rect x="210" y="52" width="110" height="26" fill="#ffffff" stroke="#1f2a44"/>
  <text x="265" y="69" font-size="11" text-anchor="middle" fill="#1f2a44">bss (zeroed)</text>
  <rect x="210" y="78" width="110" height="44" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="265" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">free</text>
  <rect x="210" y="122" width="110" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="265" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">stack</text>
  <line x1="140" y1="99" x2="206" y2="39" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="206,39 197,41 202,47" fill="#b4232c"/>
  <text x="170" y="130" font-size="11" text-anchor="middle" fill="#b4232c">copied at boot</text>
</svg>
```
:::

::: context wcet The longest a step can take
The worst-case execution time, WCET, is the longest a piece of code can ever take on a given processor. Measuring gives you the longest time you happened to see, which may be shorter than the true worst case, because a test may never hit the slowest path with the slowest cache behavior. For the highest-criticality software, teams add static timing analysis tools, such as AbsInt's aiT, that compute a safe upper bound from the machine code and a model of the processor, and they keep a margin on top.
:::
