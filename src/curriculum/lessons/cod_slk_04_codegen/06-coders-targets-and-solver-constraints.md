---
id: l06-coders-targets-and-solver-constraints
title: 'Coders, targets and the rules a model must meet'
minutes: 23
covers:
  - Simulink Coder versus Embedded Coder; the ert.tlc system target file
  - 'Hardware implementation settings: word sizes, endianness, target CPU'
  - 'Solver constraints for code generation: fixed-step, discrete, no algebraic loops'
---

Think about a recipe translated for a different country. The dish is the same, but the translator has to know things about the kitchen at the other end. Are the cups the same size? Is the oven in Celsius or Fahrenheit? Does "a stick of butter" mean anything there? A translator who ignores the kitchen produces a recipe that reads fine and burns the cake.

A code generator is that translator. It takes a Simulink model, which is a recipe for computing numbers, and writes C code for a particular processor. To do that well it must know three things. Which translator are we using: a quick one for trying things out, or a careful one for food that will be served to the public? What is the kitchen like at the other end: how big are its measuring cups, meaning its integer types, and in which order does it store the bytes of a number? And is the recipe itself translatable at all: does it only use steps that a real kitchen can carry out, on a fixed schedule, every time?

This lesson answers those three questions in order. Lesson 5 showed that Polyspace needs to know the target's word sizes to analyze code correctly. The code generator needs the same facts, for the same reason.

## Two code generators

MathWorks sells two products that turn Simulink models into C and C++.

**Simulink Coder** (called Real-Time Workshop in older releases) generates code from any model it supports. It is built for **[[rapid prototyping|rapid-prototyping]]**: getting a model running quickly as compiled code, on your PC, on a real-time test computer, or as a fast standalone simulation. Its code is correct and readable enough, but you get few choices about how it looks.

**Embedded Coder** is an add-on on top of Simulink Coder (it needs licenses for both Simulink Coder and MATLAB Coder). It is built for **production code**: code that ships on a flight computer or a car's engine controller. It gives you control over almost everything a flight software team cares about:

- the names of generated functions and variables, and how model data appears in C (the next lesson covers storage classes and code mappings);
- how efficient the code is in memory and time, with features such as code replacement libraries;
- the SIL and PIL testing from lesson 1, run directly from the model;
- a code generation report that traces each line back to its block.

### The system target file

Which of the two you use is chosen by one setting, the **system target file**, found in the model's Configuration Parameters under Code Generation. A system target file ends in `.tlc`, for the **[[Target Language Compiler|tlc]]**, the MathWorks program that writes the actual C. Two matter here:

| System target file | Name | Product needed | Built for |
|---|---|---|---|
| `grt.tlc` | Generic Real-Time target | Simulink Coder | rapid prototyping, running on a PC or real-time computer |
| `ert.tlc` | Embedded Real-Time target | Embedded Coder | production code for embedded processors |

Read "ert.tlc" as "E R T dot T L C". When people on a flight software team say "ERT code", they mean code generated with `ert.tlc`, which is to say production code from Embedded Coder.

Whichever target you pick, the generated code has the same basic shape, as the golden-rule lesson of the solvers module sketched. For a model named `pitch_ctrl`, `pitch_ctrl_initialize()` sets the states to their starting values, and `pitch_ctrl_step()` computes one sample of every block. Hand-written code calls the step function once per base period. The ERT target leaves out extras a small processor does not need, such as logging results to a file, and it can generate an example `main` that you then replace with your own scheduler.

::: key
Simulink Coder (system target file grt.tlc) generates code for rapid prototyping on PCs and real-time computers. Embedded Coder (system target file ert.tlc) generates production code for embedded processors, with control over naming, data interfaces, efficiency, SIL/PIL and traceability, and needs its own license on top of Simulink Coder.
:::

## Hardware implementation settings

Here is a fact that surprises people who learned C on a PC: the C language does not fix how big an `int` is. The standard only sets minimums. An `int` must hold at least $-32{,}767$ to $32{,}767$, so at least 16 bits. On your PC it is 32 bits. On many small microcontrollers it is 16. A `long` is 64 bits on 64-bit Linux, but 32 bits on 64-bit Windows and on most microcontrollers.

This matters because C does its arithmetic in `int` or wider. Two small integers are first **[[promoted|integer-promotion]]** to `int`, then multiplied. If `int` is 32 bits, a product of two 16-bit numbers always fits. If `int` is 16 bits, it may not.

So the code generator must know the target's sizes, and you tell it in the **Hardware Implementation** pane of Configuration Parameters. The main settings are:

- **Device vendor** and **device type**: the processor family, such as ARM Compatible with ARM Cortex-M, or Texas Instruments with C2000. Picking one fills in the rest with that device's usual values.
- **Number of bits** for `char`, `short`, `int`, `long` and `long long`, plus the native word size and pointer size.
- **Byte ordering**: little endian or big endian, the order of a number's bytes in memory, met in lesson 1.
- **Signed integer division rounds to**: Zero or Floor, which way the target's compiler rounds a negative quotient.
- **Shift right on a signed integer as arithmetic shift**: whether shifting a negative number right keeps it negative.

Here are typical values for three processors a GNC engineer may meet:

| Setting | x86-64 PC (Linux) | ARM Cortex-M | TI C2000 (C28x) |
|---|---|---|---|
| char | 8 | 8 | 16 |
| short | 16 | 16 | 16 |
| int | 32 | 32 | 16 |
| long | 64 | 32 | 32 |
| Byte ordering | little endian | little endian (usual) | little endian |

The C2000 column is not a typo. On that family of **[[digital signal processors|c2000]]**, even a `char` is 16 bits.

::: key
Hardware implementation settings tell the code generator the target's device vendor and type, the number of bits in char, short, int and long, the byte ordering (endianness), and how signed integer division rounds. The generated code is only right for the target these settings describe.
:::

Your own PC reports its sizes if you ask:

```c
#include <stdio.h>
#include <limits.h>
int main(void) {
    printf("char %d, short %zu, int %zu, long %zu, long long %zu, pointer %zu bits\n",
           CHAR_BIT, sizeof(short) * CHAR_BIT, sizeof(int) * CHAR_BIT,
           sizeof(long) * CHAR_BIT, sizeof(long long) * CHAR_BIT,
           sizeof(void *) * CHAR_BIT);
    return 0;
}
/* Output (gcc, x86-64 Linux):
   char 8, short 16, int 32, long 64, long long 64, pointer 64 bits */
```

::: example A gain that overflows on a 16-bit int
A pitch controller works in integer counts to save time on a small processor: the error is in units of 0.01 degree, and the gain is an integer. The error is 3.00 degrees, so 300 counts, and the gain is 200. The C below computes the product three ways on a PC.

```c
#include <stdio.h>
#include <stdint.h>
int main(void) {
    int16_t err = 300;   /* pitch error, 0.01 deg per count: 3.00 deg */
    int16_t kp  = 200;   /* proportional gain in counts               */

    int32_t on_pc  = err * kp;             /* PC: both promoted to 32-bit int */
    int32_t on_mcu = (int16_t)(err * kp);  /* what a 16-bit int would keep    */
    int32_t fixed  = (int32_t)err * kp;    /* widen one side first            */

    printf("on_pc  = %ld\n", (long)on_pc);
    printf("on_mcu = %ld\n", (long)on_mcu);
    printf("fixed  = %ld\n", (long)fixed);
    return 0;
}
/* Output (gcc, x86-64 Linux):
   on_pc  = 60000
   on_mcu = -5536
   fixed  = 60000   */
```

**Step 1: on the PC.** Both 16-bit values are promoted to 32-bit `int`, and $300 \times 200 = 60{,}000$. That fits easily. Correct.

**Step 2: on a 16-bit-int processor.** Promotion only reaches `int`, which there is 16 bits. The largest value is $32{,}767$. The product $60{,}000$ does not fit. Signed overflow is undefined behavior; on typical hardware it wraps, giving $60{,}000 - 65{,}536 = -5{,}536$. The line marked `on_mcu` imitates that wrap on the PC. A pitch-up error produces a pitch-*down* command.

**Step 3: the fix.** Cast one side to 32 bits *before* multiplying, as the `fixed` line does. Then the multiply happens in 32 bits on both machines.

**Sanity check.** This is the reason the hardware settings exist. If they say `int` is 16 bits, the code generator knows the product needs a wider type and writes the cast into the generated code for you. If they wrongly say 32 bits, it leaves the cast out, SIL on the PC passes, and the bug waits for PIL.
:::

::: warning The settings must match the real compiler, not just the chip
The hardware settings describe what the *target compiler* does, and two compilers for one chip can differ. Take the numbers from the compiler's manual for your exact compiler and options, not from memory, and confirm them in PIL. A mismatch here produces code that is correct for a processor you are not using.
:::

### Byte order and division rounding

**Byte ordering** matters whenever code looks at the raw bytes of a number: packing a telemetry frame, reading a sensor message, or sharing memory with another processor. The same bytes mean different numbers on the two kinds of machine:

```c
#include <stdio.h>
#include <stdint.h>
#include <string.h>
int main(void) {
    uint32_t word = 0x0A0B0C0D;
    uint8_t bytes[4];
    memcpy(bytes, &word, sizeof word);   /* copy the raw memory */
    printf("%02X %02X %02X %02X\n", bytes[0], bytes[1], bytes[2], bytes[3]);
    return 0;
}
/* Output (gcc, x86-64 Linux, little endian):
   0D 0C 0B 0A
   A big-endian processor would print 0A 0B 0C 0D. */
```

**Signed integer division rounding** matters because "$-7$ divided by 2" has two reasonable integer answers. Rounding toward zero gives $-3$. Rounding toward minus infinity, called **floor**, gives $-4$. C has rounded toward zero since the **[[C99 standard|c99-division]]**. Python's `//` floors. You can see both on your own machine: in C, `-7 / 2` is `-3`; in Python, `-7 // 2` is `-4`.

A Simulink block that does integer division has its own rounding mode setting. If the block asks for Floor and the hardware settings say the target rounds toward Zero, the code generator must add a few extra operations to correct the result. If the settings say Undefined, it must add the correction wherever the rounding matters. So correct settings give both right answers and smaller code.

::: example When the rounding direction decides where a filter settles
A simple integer filter halves a value each step: `x = x / 2`. Start at $x = -7$ and at $x = +7$, and compare the two rounding rules. (Python's `int(x/2)` rounds toward zero; `x // 2` floors.)

**Step 1: round toward zero.** From $-7$: $-3$, $-1$, $0$, $0$, and it stays at 0. From $+7$: $3$, $1$, $0$. Both sides decay to zero, like the real number would.

**Step 2: round toward floor.** From $+7$: $3$, $1$, $0$, the same as before. From $-7$: $-4$, $-2$, $-1$, then $-1 / 2 = -0.5$ floors to $-1$ again. It is stuck at $-1$ forever.

**Step 3: what this means.** With floor rounding, a negative value never fully decays. In a controller, a leftover $-1$ count is a small constant bias that never goes away.

**Sanity check.** Neither rule is "wrong"; they are different rules. The danger is the model assuming one and the target doing the other. Then MIL shows a clean decay to zero and the flight code settles at $-1$. The block's rounding mode and the target's hardware setting together decide which you get, which is why the setting is there.
:::

## What a model must be to become code

The solvers module ended with the golden rule: a model destined for flight code is fixed-step, discrete, cleanly multirate, with no algebraic loops. This is where that rule stops being advice. Some of it is enforced by the code generators themselves.

**Fixed-step.** In the Solver pane, the type must be **fixed-step**. A variable-step solver chooses its steps from the data, so the work per second changes from moment to moment. Generated code is called on a fixed clock, and it cannot take a data-dependent number of steps between ticks. The `grt.tlc` and `ert.tlc` targets refuse to build a model set to a variable-step solver.

**Discrete.** For a controller, choose the fixed-step solver called **discrete (no continuous states)**, and build the controller from discrete blocks such as Unit Delay, Discrete-Time Integrator and Discrete Transfer Fcn. A fixed-step continuous solver such as `ode4` can be compiled into code, but then the code contains the integration method too, and changing the step changes the answers. Flight teams keep the continuous parts, such as the vehicle dynamics, in the test harness, which never becomes flight code. The fixed-step size is usually left on `auto`, which sets it to the **[[fundamental sample time|base-rate]]**: the largest step that divides every rate in the model.

**No algebraic loops.** An algebraic loop is an equation that must be solved by iteration inside a single step, with a number of iterations that depends on the data and no guarantee it converges. Embedded Coder does not generate code for a model that contains one. Break every loop in the deployed path, by restructuring or with a Unit Delay whose phase cost you have checked, as the algebraic-loops lesson showed.

**Only blocks that support code generation.** Some blocks exist only for simulation. The **[[Interpreted MATLAB Function|interpreted-fcn]]** block calls MATLAB itself at each step, and there is no MATLAB on a flight computer, so it cannot become C. Signals whose size can change without a fixed upper bound cannot be given fixed memory. Viewing blocks such as Scopes usually just produce no code, but their settings are worth checking before a build.

::: key
Name three model constructs that block ERT code generation: continuous states with a variable-step solver; algebraic loops; and blocks with no code-generation support such as the Interpreted MATLAB Function, and unbounded variable-size signals.
:::

::: example Auditing a model before pressing Build
An attitude-control model arrives with these settings. Which stop an ERT build, which are poor practice, and what is the fixed-step size?

- Solver type: variable-step, `ode45`.
- A continuous Integrator in the controller for the integral term.
- A lead filter and a sensor gain form an algebraic loop.
- An Interpreted MATLAB Function block computes a lookup.
- Rates: 2 ms (sensor filter) and 5 ms (control law).

**Step 1: solver.** Variable-step stops the build. Change to fixed-step, solver discrete.

**Step 2: Integrator.** Once the solver is discrete, a continuous Integrator has no solver to integrate it, so the model will not run. Replace it with a Discrete-Time Integrator at the control rate.

**Step 3: algebraic loop.** Stops the build. Break it, for example with a Unit Delay after the sensor gain, and check the phase cost: a one-step delay of 5 ms at a 20 rad/s crossover costs $20 \times 0.005 = 0.1$ rad, about $5.7^\circ$.

**Step 4: Interpreted MATLAB Function.** Stops the build. Replace it with a MATLAB Function block, whose code can be generated, or with a lookup-table block.

**Step 5: step size.** The fundamental sample time must divide both 2 ms and 5 ms. The largest such step is their greatest common divisor, 1 ms. The step function is then called every 1 ms, and each rate runs on its own multiple of that tick.

**Sanity check.** A step of 1 ms fits both: $2 = 2 \times 1$ and $5 = 5 \times 1$. A 2 ms base could not serve the 5 ms rate, since 5 is not a multiple of 2. Choosing rates of 2 ms and 4 ms instead would allow a 2 ms base and half as many ticks.
:::

::: warning "It simulates" is not "it generates"
A model can simulate perfectly and still fail to build: a variable-step solver and an Interpreted MATLAB Function block both work fine on the desktop. Check the solver and block support early, before the model grows around a block that cannot be deployed. The Model Advisor from lesson 4 includes checks for code generation readiness, and the **Code Generation Advisor** reviews the configuration against goals you choose, such as execution efficiency, RAM use, traceability or safety precautions.
:::

## Check yourself

::: check
A colleague says, "We don't need Embedded Coder; Simulink Coder generates C too." When is she right, and when not?
:::

::: answer
She is right for rapid prototyping: `grt.tlc` code runs a model on a PC or a real-time test computer quickly, and that is often all a test rig needs. She is not right for flight code. Production code needs `ert.tlc`, which requires Embedded Coder, for control over names and data interfaces, efficient code for a small processor, SIL and PIL from the model, and traceability back to blocks for certification.
:::

::: check
The hardware settings say `int` is 32 bits, but the target is a 16-bit-int processor. Two `int16_t` values of 250 and 180 are multiplied into an `int32_t`. What happens in SIL and in PIL?
:::

::: answer
$250 \times 180 = 45{,}000$. In SIL, on the PC, `int` really is 32 bits, so the product is 45,000: correct. The code generator, believing `int` is 32 bits, did not add a cast. In PIL, on the target, the product is computed in a 16-bit `int`, which tops out at 32,767. It overflows and typically wraps to $45{,}000 - 65{,}536 = -20{,}536$. Fixing the hardware settings makes the generator add the cast, and the product comes out right on both.
:::

::: check
Why must a model that will become embedded code use a fixed-step solver? Answer in terms of what calls the generated step function.
:::

::: answer
A timer interrupt or the flight software's scheduler calls the step function at a fixed period, and each call must finish before the next. A variable-step solver chooses how many steps to take from the data, so there is no fixed amount of work per period and no worst-case time to budget. A fixed step gives exactly one known update per tick, which is what a scheduler needs.
:::

::: check
A model has rates of 4 ms, 10 ms and 20 ms. What fundamental sample time will `auto` choose, and how many base ticks pass between runs of each rate?
:::

::: answer
The greatest common divisor of 4, 10 and 20 is 2, so the base step is 2 ms. The 4 ms rate runs every 2 ticks, the 10 ms rate every 5 ticks, and the 20 ms rate every 10 ticks. Note that no rate in the model runs at 2 ms itself; the base tick exists only so that all three line up.
:::

::: check
A telemetry packer copies a `uint32_t` into four bytes with `memcpy` and sends them. The ground software, on a PC, reads the value as 0x0D0C0B0A instead of 0x0A0B0C0D. What happened?
:::

::: answer
The two ends disagree on byte order. The flight processor stored the bytes in one order and the ground software assumed the other, so the bytes came out reversed. The fix is to define the packet's byte order in the interface document and pack the bytes explicitly (shifting out the most significant byte first, for example) instead of copying raw memory. The hardware setting must also match the flight processor so any generated byte-handling code is right.
:::

## Summary

| Idea | Meaning | Key fact |
|---|---|---|
| Simulink Coder | code generation for rapid prototyping | system target file `grt.tlc` |
| Embedded Coder | production code for embedded processors | `ert.tlc`; separate license, needs Simulink Coder |
| System target file | the `.tlc` setting that picks the target | Code Generation pane |
| Device vendor, type | the target processor | fills in the defaults below |
| Number of bits | sizes of char, short, int, long | int may be 16 bits; C2000 char is 16 |
| Byte ordering | order of a number's bytes in memory | little or big endian |
| Division rounding | Zero or Floor for negative quotients | C99 rounds to zero; Python floors |
| Fixed-step, discrete | the solver generated code needs | variable-step will not build |
| No algebraic loops | no iterative solve inside a step | break with a Unit Delay |
| Fundamental sample time | largest step dividing every rate | gcd of the rates |

The next lesson opens the generated code's interface: storage classes that decide how each signal and parameter appears in C, and code mappings that set the names and shapes of the step, initialize and terminate functions.

::: context rapid-prototyping Trying the controller on real hardware, early
Rapid prototyping means running a control law on real-time hardware long before the flight computer exists, so it can be tried against a real actuator or a test rig. The model is compiled with Simulink Coder and loaded onto a real-time computer from a company such as Speedgoat or dSPACE. Engineers change gains, watch the results live, and iterate in hours rather than weeks. The code does not need to be small or pretty; it needs to run in real time, today. The last lesson of this module returns to it as rapid control prototyping.
:::

::: context tlc How a model becomes C
When you build, Simulink first compiles the model and writes a description of it to a file with the extension `.rtw`. The Target Language Compiler reads that description and, following the instructions in the system target file and the block templates, writes the `.c` and `.h` files. Then an ordinary C compiler, chosen by the toolchain setting, compiles them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="5" y="40" width="62" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="36" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">model</text>
  <rect x="97" y="40" width="62" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <text x="128" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">.rtw file</text>
  <rect x="189" y="40" width="62" height="36" fill="#f2b880" stroke="#1f2a44"/>
  <text x="220" y="62" font-size="11" fill="#1f2a44" text-anchor="middle">.c and .h</text>
  <rect x="281" y="40" width="74" height="36" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="318" y="62" font-size="11" fill="#ffffff" text-anchor="middle">executable</text>
  <line x1="67" y1="58" x2="97" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <line x1="159" y1="58" x2="189" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <line x1="251" y1="58" x2="281" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <text x="82" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">compile</text>
  <text x="174" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">TLC</text>
  <text x="174" y="113" font-size="11" fill="#6c7a93" text-anchor="middle">(ert.tlc)</text>
  <text x="266" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">C compiler</text>
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">one Build, four stages</text>
</svg>
```
:::

::: context integer-promotion Why small integers grow before arithmetic
C's rule is that any value of a type smaller than `int`, such as `char` or `short`, is converted to `int` before arithmetic. So `a * b` with two `int16_t` values is really `(int)a * (int)b`. On a 32-bit-int machine that hides many overflows, because the product has room. On a 16-bit-int machine there is no extra room, and the same line can overflow. Code that "worked for years" on one processor can fail on another with no change at all, which is why generated code states widths explicitly.
:::

::: context c2000 When a byte is not 8 bits
Texas Instruments' C2000 family is widely used for motor and power control, including electric actuators. Its C28x processor cores address memory in 16-bit words, not 8-bit bytes. So the smallest type, `char`, is 16 bits, and `sizeof(int)` is 1, because `sizeof` counts in chars. Code that assumes a byte is 8 bits, such as packing a message byte by byte, breaks there. The hardware settings let you tell the code generator this, and it adjusts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">bits in each type (bar length to scale)</text>
  <text x="10" y="50" font-size="11" fill="#1f2a44">x86-64</text>
  <rect x="90" y="38" width="16" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="112" y="38" width="32" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="150" y="38" width="64" height="16" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="98" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">char</text>
  <text x="128" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">short</text>
  <text x="182" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">int</text>
  <text x="10" y="100" font-size="11" fill="#1f2a44">C28x</text>
  <rect x="90" y="88" width="32" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="128" y="88" width="32" height="16" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="166" y="88" width="32" height="16" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="106" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">char</text>
  <text x="144" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">short</text>
  <text x="182" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">int</text>
  <text x="230" y="50" font-size="11" fill="#6c7a93">8, 16, 32</text>
  <text x="230" y="100" font-size="11" fill="#6c7a93">16, 16, 16</text>
</svg>
```
:::

::: context c99-division A rule that changed in 1999
The first C standard, from 1989, left the rounding of a negative integer quotient up to each compiler: $-7 / 2$ could legally be $-3$ or $-4$, as long as `%` agreed with it. The 1999 revision, C99, fixed it: division truncates toward zero, so $-7 / 2 = -3$ and $-7 \% 2 = -1$. Python chose the other rule, floor, so that `%` never returns a negative result for a positive divisor: in Python `-7 % 2` is `1`. Old embedded compilers and hand-written assembly libraries can still differ, which is why the setting exists.
:::

::: context base-rate One tick that serves every rate
The fundamental sample time is the tick every rate in the model can be built from. With rates of 2 ms and 5 ms, the tick is 1 ms: the 2 ms rate runs on every second tick, the 5 ms rate on every fifth, and both run together every 10 ms.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="95" x2="340" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="90" x2="30" y2="100" stroke="#1f2a44"/>
  <line x1="60" y1="90" x2="60" y2="100" stroke="#1f2a44"/>
  <line x1="90" y1="90" x2="90" y2="100" stroke="#1f2a44"/>
  <line x1="120" y1="90" x2="120" y2="100" stroke="#1f2a44"/>
  <line x1="150" y1="90" x2="150" y2="100" stroke="#1f2a44"/>
  <line x1="180" y1="90" x2="180" y2="100" stroke="#1f2a44"/>
  <line x1="210" y1="90" x2="210" y2="100" stroke="#1f2a44"/>
  <line x1="240" y1="90" x2="240" y2="100" stroke="#1f2a44"/>
  <line x1="270" y1="90" x2="270" y2="100" stroke="#1f2a44"/>
  <line x1="300" y1="90" x2="300" y2="100" stroke="#1f2a44"/>
  <line x1="330" y1="90" x2="330" y2="100" stroke="#1f2a44"/>
  <text x="30" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="180" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="330" y="113" font-size="11" fill="#1f2a44" text-anchor="middle">10 ms</text>
  <text x="5" y="54" font-size="11" fill="#1f2a44">2</text>
  <circle cx="30" cy="50" r="5" fill="#1d6fd1"/>
  <circle cx="90" cy="50" r="5" fill="#1d6fd1"/>
  <circle cx="150" cy="50" r="5" fill="#1d6fd1"/>
  <circle cx="210" cy="50" r="5" fill="#1d6fd1"/>
  <circle cx="270" cy="50" r="5" fill="#1d6fd1"/>
  <circle cx="330" cy="50" r="5" fill="#1d6fd1"/>
  <text x="5" y="76" font-size="11" fill="#1f2a44">5</text>
  <circle cx="30" cy="72" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="180" cy="72" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="330" cy="72" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="185" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">1 ms ticks: 2 ms rate (blue), 5 ms (orange)</text>
</svg>
```
:::

::: context interpreted-fcn Why one block can never fly
The Interpreted MATLAB Function block hands its input to the MATLAB interpreter at every step and takes back the answer. That is flexible on the desktop, and slow, and impossible on a flight computer, where there is no MATLAB to hand anything to. The MATLAB Function block looks similar but is different inside: its code is written in the subset of MATLAB that MATLAB Coder can translate, so it becomes C along with the rest of the model. The MATLAB Function block lesson of the first Simulink module described that subset.
:::
