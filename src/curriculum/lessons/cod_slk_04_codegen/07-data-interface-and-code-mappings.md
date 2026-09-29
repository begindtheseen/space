---
id: l07-data-interface-and-code-mappings
title: The data interface, entry points and code mappings
minutes: 24
covers:
  - 'Storage classes and the data interface: ExportedGlobal, ImportedExtern, Volatile, custom classes'
  - 'Code mappings: step, initialize and terminate entry points; reusable and reentrant code'
---

Think of a new dishwasher going into a kitchen. The factory builds the machine. A plumber builds the kitchen. The two never meet, yet on installation day the hose fits the tap, the plug fits the socket and the machine slides into the gap under the counter. That works because both sides agreed on the connections beforehand: this size of hose, this plug, this width.

Generated code goes into flight software the same way. Embedded Coder builds the control law. Hand-written flight software, the scheduler, the drivers, the telemetry, is the kitchen. They meet at a set of agreed connections: which functions the flight software calls, and which variables each side reads and writes. Together those connections are called the **data interface** of the generated code (plus its function interface).

Lesson 6 made code generation possible. This lesson decides what the code looks like from the outside. You met storage classes in lesson 7 of the architecture module, as one property on a Simulink.Parameter. Here they become a full contract, alongside the three functions every generated model offers, the **Code Mappings editor** that sets it all in one table, and the choice between code that runs once and code you can stamp out many times.

## Three functions: initialize, step, terminate

A generated model is not a program. It has no `main`, no loop and no clock. It is a small library that offers a few functions, and something else decides when to call them. Those functions are the **entry points**: the places where outside code enters the generated code.

For a model named `rate_pi`, an ERT build gives three of them by default.

- **`rate_pi_initialize()`** runs once, before anything else. It puts every state (the integrators, delays and filters) at its initial value and sets up the model's data.
- **`rate_pi_step()`** runs once per sample. It reads the inputs, computes the outputs and updates the states for the next sample. If the model's fixed step is 0.01 s, the flight software must call it every 10 ms.
- **`rate_pi_terminate()`** runs once at shutdown. For most control laws it does little or nothing, but it is there so the caller has a place to clean up.

Who calls `step` on time? The flight software's **[[scheduler|scheduler]]**: a timer interrupt, or a periodic task in a real-time operating system. The generated code trusts that it will be called at the rate it was designed for. It cannot check the clock itself.

::: key
Entry points: model_initialize runs once at start-up, model_step runs once per base sample time (one control cycle), model_terminate runs once at shutdown. The generated code has no loop or timer of its own; the hand-written scheduler calls the step function at the model's rate.
:::

A multirate model can be packaged two ways. In **single-tasking** mode there is still one step function; inside it, counters decide which rates are due this tick. In **multitasking** mode Embedded Coder generates one step function per rate, named `rate_pi_step0`, `rate_pi_step1` and so on, so the operating system can run the fast rate in a higher-priority task than the slow one. The solvers module's lesson on rate transitions explained why that needs care.

If you ask for it, Embedded Coder also writes an example `ert_main.c`. Its function `rt_OneStep` shows the intended pattern: a timer interrupt calls it, it checks a flag to catch an **[[overrun|overrun]]** (a step that has not finished when the next one is due), and it calls the model's step function. A flight program replaces it with its own scheduler (lesson 10).

### What surrounds the functions

The entry points read and write data that also lives in the generated files. In a default ERT build for `rate_pi`, the code keeps each kind of data in its own global structure, with names that follow a fixed pattern:

| Structure | Type name | What it holds |
|---|---|---|
| `rate_pi_U` | `ExtU_rate_pi_T` | root-level inputs (the model's Inport blocks) |
| `rate_pi_Y` | `ExtY_rate_pi_T` | root-level outputs (the Outport blocks) |
| `rate_pi_DW` | `DW_rate_pi_T` | states and other work data kept between steps |
| `rate_pi_B` | `B_rate_pi_T` | block output signals that must be kept in memory |
| `rate_pi_P` | `P_rate_pi_T` | tunable parameters (lesson 8) |

"Ext" is short for external: the U structure is what the outside world writes in, and the Y structure is what it reads out. The files have a pattern too: `rate_pi.c` holds the entry points, `rate_pi.h` declares everything a caller needs, and `rate_pi_types.h`, `rate_pi_private.h` and a shared header, [[rtwtypes.h|rtwtypes]], hold types and helpers. The C you see below is a **hand-written sketch of the pattern**, trimmed to the lines that matter. It is not exact generated code; real generated code has more comments, other type names such as `real_T`, and extra fields.

::: example A PI rate loop called three times
The model `rate_pi` is a proportional-integral controller: $u = K_p e + I$, read "u equals K p times e plus I", where $e$ is the rate error in deg/s and $I$ is the integrator state. After each output, the integrator grows by $K_i T_s e$, with $K_p = 0.5$, $K_i = 0.2$ and step $T_s = 0.01\,\mathrm{s}$.

```c
#include <stdio.h>
/* Hand-written sketch of NONREUSABLE generated code for a model "rate_pi". */
typedef struct { double err; } ExtU_rate_pi_T;             /* root inputs  */
typedef struct { double cmd; } ExtY_rate_pi_T;             /* root outputs */
typedef struct { double Integrator_DSTATE; } DW_rate_pi_T; /* states       */

ExtU_rate_pi_T rate_pi_U;   /* one global copy of each */
ExtY_rate_pi_T rate_pi_Y;
DW_rate_pi_T   rate_pi_DW;

void rate_pi_initialize(void) { rate_pi_DW.Integrator_DSTATE = 0.0; }
void rate_pi_step(void) {
    rate_pi_Y.cmd = 0.5 * rate_pi_U.err + rate_pi_DW.Integrator_DSTATE;
    rate_pi_DW.Integrator_DSTATE += 0.2 * 0.01 * rate_pi_U.err;  /* Ki*Ts*err */
}
void rate_pi_terminate(void) { }

int main(void) {          /* stands in for the flight software's scheduler */
    rate_pi_initialize();
    for (int k = 0; k < 3; ++k) {
        rate_pi_U.err = 2.0;
        rate_pi_step();
        printf("step %d: cmd = %.4f\n", k, rate_pi_Y.cmd);
    }
    rate_pi_terminate();
    return 0;
}
/* Output (gcc -std=c99 -Wall):
   step 0: cmd = 1.0000
   step 1: cmd = 1.0040
   step 2: cmd = 1.0080   */
```

**Step 1: the first call.** Initialize set $I = 0$. With $e = 2.0$, the output is $0.5 \times 2.0 + 0 = 1.0$ deg/s. Then the integrator grows by $0.2 \times 0.01 \times 2.0 = 0.004$.

**Step 2: the next calls.** Step 1 gives $1.0 + 0.004 = 1.004$, and step 2 gives $1.0 + 0.008 = 1.008$. Each call is one 10 ms cycle.

**Step 3: the pattern.** The caller writes the input into `rate_pi_U`, calls `rate_pi_step()`, and reads the output from `rate_pi_Y`. That is the whole interface.

**Sanity check.** A constant error should make an integrator ramp in a straight line. It does: 0.004 more every step, which is $0.4$ deg/s per second of steady error, equal to $K_i e = 0.2 \times 2.0$.
:::

## Storage classes: who defines what

The global structures above are the default, and often not what the rest of the flight software wants. Telemetry may expect a variable called `att_rate_limit`, not a field buried in `rate_pi_P`. The navigation code may already own a variable called `nav_mode` that the model must read. The **storage class** of each signal, state or parameter settles this.

Recall from the architecture module that a C global is *defined* once (that creates the memory) and *declared* with `extern` wherever else it is used (a promise that it exists somewhere). The storage classes you need most differ exactly in who does the defining.

- **ExportedGlobal.** The model defines and exports a global. The generated `.c` file creates the variable, and the generated `.h` file declares it `extern`, so any hand-written file that includes the header can read or write it by name.
- **ImportedExtern.** The model declares an `extern` and your code defines it. The generated code uses the variable but never creates it. If no hand-written file defines it, the program will not link.
- **Volatile.** The variable is marked `volatile`, so the compiler must read it from memory at every use and write it at every assignment. That is right for data that something outside the current code can change at any time: a hardware register, or a value written by an interrupt or another task.

::: key
What is a storage class, in code-generation terms? A declaration of how a model signal or parameter appears in the generated C: a local, an exported global, a volatile, an imported extern supplied by hand-written code, or a member of a custom structure. It is the interface contract between generated and hand-written code.
:::

Here is the pattern in three small files: the model's header and source, and a hand-written file around them. Again, this is a sketch of what the storage classes produce, not literal Embedded Coder output.

```c
/* att.h -- sketch of the header the model's code exports */
#ifndef ATT_H
#define ATT_H
#include <stdint.h>
extern float   att_rate_limit;        /* ExportedGlobal: defined in att.c */
extern uint8_t nav_mode;              /* ImportedExtern: YOU define it    */
extern volatile uint16_t imu_status;  /* Volatile: re-read every access   */
extern float   att_cmd;
void att_initialize(void);
void att_step(void);
void att_terminate(void);
#endif

/* att.c -- sketch of the model's code */
#include "att.h"
float att_rate_limit = 5.0F;          /* ExportedGlobal: defined here */
volatile uint16_t imu_status;         /* Volatile */
float att_cmd;
void att_initialize(void) { att_cmd = 0.0F; }
void att_step(void) {
    float c = (nav_mode == 2U) ? 8.0F : 2.0F;  /* reads the imported global */
    if (imu_status != 0U) c = 0.0F;
    att_cmd = (c > att_rate_limit) ? att_rate_limit : c;
}
void att_terminate(void) { }

/* fsw.c -- hand-written flight software around the model */
#include <stdio.h>
#include "att.h"
uint8_t nav_mode = 2U;                /* the definition ImportedExtern expects */
int main(void) {
    att_initialize();
    att_step();
    printf("limit %.1f, cmd %.1f\n", att_rate_limit, att_cmd);
    att_rate_limit = 10.0F;           /* tune the exported global */
    att_step();
    printf("limit %.1f, cmd %.1f\n", att_rate_limit, att_cmd);
    att_terminate();
    return 0;
}
/* Output (gcc -std=c99 -Wall att.c fsw.c):
   limit 5.0, cmd 5.0
   limit 10.0, cmd 8.0   */
```

::: example Reading the linker's complaints
The three files above build and run. With the navigation mode at 2, the model wants 8 deg/s, and the exported limit of 5 clips it to 5. When `fsw.c` raises `att_rate_limit` to 10, the next step lets 8 through.

**Step 1: forget the definition.** Delete the line `uint8_t nav_mode = 2U;` from `fsw.c` and build again. gcc compiles both files happily, because the header promised `nav_mode` exists. The **[[linker|linker]]**, which joins the compiled files, then finds no one who made it:

```text
att.c:(.text+0x22): undefined reference to `nav_mode'
collect2: error: ld returned 1 exit status
```

That is an ImportedExtern with nobody to import from.

**Step 2: define it twice.** Put the line back, and add a third file that also contains `float att_rate_limit = 5.0F;`. Now there are two definitions:

```text
multiple definition of `att_rate_limit'; ... first defined here
collect2: error: ld returned 1 exit status
```

It is the classic sign that one side should have been ImportedExtern.

**Sanity check.** Both errors come from the link step, not the compile step. Storage classes are a promise about *where* memory is created, and only the linker sees the whole program, so only the linker can tell you a promise was broken.
:::

::: warning Volatile does not make data safe to share
`volatile` stops the compiler caching a value. It does not stop another task from changing a 64-bit value halfway through reading it, and it does not order reads and writes between two processors. For data shared between tasks, the flight software still needs a proper mechanism: a rate transition, a lock, or double buffering. Use Volatile for hardware registers and interrupt flags, not as a cure for a race.
:::

### Custom storage classes and the Embedded Coder Dictionary

Real programs want more than the built-in classes: every calibration value in one named region of flash memory, every telemetry signal packed into one structure, every sensor value read through a function. These are **custom storage classes**, and Embedded Coder ships several ready-made ones, among them **Const**, **ConstVolatile**, **Struct** (members of one named structure), **GetSet** (access through functions you write), **Define** (a `#define` macro) and **ExportToFile** / **ImportFromFile** (which name the header or definition file to use).

A team defines its own classes in the **Embedded Coder Dictionary**. That is a panel on a data dictionary, the `.sldd` file from the architecture module, where you describe a class once: which header declares it, which `.c` file defines it, whether it is exported or imported, and which **[[memory section|memory-section]]** it goes in. Every model linked to that dictionary can then use the class, so the whole vehicle's code follows one set of rules.

## The Code Mappings editor

You can set a storage class on a Simulink.Parameter or Simulink.Signal object, as you did in the architecture module. For everything else, and to see the whole interface in one place, Embedded Coder gives you the **Code Mappings editor**. It is a table that opens below the model canvas when you work in the Embedded Coder app, with a tab for each kind of thing the code has.

- **Data Defaults** sets the default storage class per category: all root inports, all root outports, all model parameters, all signals and states, and so on. One row can say "every root inport is ExportedGlobal".
- **Function Defaults** sets rules for the entry points as a group, such as which memory section they go in.
- **Functions** lists each entry point, initialize, step (one per rate when multitasking) and terminate, and lets you rename it. A flight program might need `rate_pi_step` to be called `gnc_rate_loop_run`, and this is where that happens. A preview shows the resulting C prototype.
- **Inports, Outports, Parameters, Signals/States, Data Stores** list individual elements, so one inport can be ImportedExtern while the rest follow the default.

The mappings are saved inside the model, so the interface is part of the design under review. You can also script them. The call below fetches a model's code mappings and gives one inport its own class:

```matlab
cm = coder.mapping.api.get('rate_pi');
setInport(cm, 'err', 'StorageClass', 'ExportedGlobal');
```

::: key
Code Mappings editor: one table that maps the model's data (inports, outports, parameters, signals, states, data stores) to storage classes and its entry points (initialize, step, terminate) to C function names. Category defaults apply unless an individual element overrides them.
:::

## Reusable versus nonreusable code

Picture a class where every student writes in one shared notebook on the teacher's desk. It works while one student uses it. The day two students need it at once, their notes get mixed up. The fix is to give each student their own notebook and keep the one set of instructions on the board.

The code you saw first is the shared-notebook kind. The states live in one global structure, `rate_pi_DW`. That is **nonreusable** code: there is exactly one copy of the model's data, so there can be only one copy of the controller. If the flight software wanted the same rate loop for pitch and for yaw, calling `rate_pi_step()` for both would mix their integrators into one.

**Reusable** code keeps one copy of the instructions and lets the caller supply as many copies of the data as it needs. You pick it with the configuration setting **Code interface packaging**, choosing **Reusable function** instead of **Nonreusable function**. Now every entry point takes a pointer to a **real-time model data structure** (its type is named like `RT_MODEL_rate_pi_T`), which points in turn to that instance's states and signals. The inputs and outputs are passed as arguments or kept in the structure too, depending on another setting. The caller creates one structure per instance.

::: example Two axes, one controller
Here is the same PI loop as a hand-written sketch of the reusable pattern, running pitch and yaw at once.

```c
#include <stdio.h>
/* Hand-written sketch of REUSABLE generated code for the same model. */
typedef struct { double Integrator_DSTATE; } DW_rate_pi_T;
typedef struct {
    DW_rate_pi_T *dwork;       /* this instance's states */
} RT_MODEL_rate_pi_T;

void rate_pi_initialize(RT_MODEL_rate_pi_T *const M) {
    M->dwork->Integrator_DSTATE = 0.0;
}
void rate_pi_step(RT_MODEL_rate_pi_T *const M, double err, double *cmd) {
    DW_rate_pi_T *dw = M->dwork;
    *cmd = 0.5 * err + dw->Integrator_DSTATE;
    dw->Integrator_DSTATE += 0.2 * 0.01 * err;
}

int main(void) {
    DW_rate_pi_T dw_pitch, dw_yaw;               /* the caller owns the memory */
    RT_MODEL_rate_pi_T pitch = { &dw_pitch }, yaw = { &dw_yaw };
    rate_pi_initialize(&pitch);
    rate_pi_initialize(&yaw);
    double cmd_p, cmd_y;
    for (int k = 0; k < 3; ++k) {
        rate_pi_step(&pitch, 2.0, &cmd_p);       /* pitch error 2.0 deg/s */
        rate_pi_step(&yaw, -1.0, &cmd_y);        /* yaw error -1.0 deg/s  */
        printf("step %d: pitch cmd = %.4f, yaw cmd = %.4f\n", k, cmd_p, cmd_y);
    }
    return 0;
}
/* Output (gcc -std=c99 -Wall):
   step 0: pitch cmd = 1.0000, yaw cmd = -0.5000
   step 1: pitch cmd = 1.0040, yaw cmd = -0.5020
   step 2: pitch cmd = 1.0080, yaw cmd = -0.5040   */
```

**Step 1: pitch.** Its numbers are the same as before: 1.0000, 1.0040, 1.0080. The pitch instance behaves exactly like the nonreusable controller.

**Step 2: yaw.** With $e = -1.0$, the first output is $0.5 \times (-1.0) = -0.5$, and the integrator moves by $0.2 \times 0.01 \times (-1.0) = -0.002$ each step: $-0.5020$, then $-0.5040$.

**Step 3: independence.** The two calls share every instruction but no state. Pitch's integrator never sees yaw's error.

**Sanity check.** The yaw error is $-\tfrac{1}{2}$ of the pitch error, and every yaw output is $-\tfrac{1}{2}$ of the matching pitch output ($-0.5040 = -\tfrac12 \times 1.0080$). For a linear controller starting from zero, that is exactly what should happen.
:::

Reusable code is usually also **[[reentrant|reentrant]]**: safe to call again while an earlier call is still running, for example when an interrupt calls the pitch instance while the main loop is halfway through the yaw one. That works because the function touches only its arguments and its local variables, never shared static data. **Multi-instance** means the same code serves many sets of data; **reentrant** means overlapping calls cannot corrupt each other. Reusable code gives you both.

::: key
Reusable (multi-instance, reentrant) code: Code interface packaging = Reusable function. Each instance's states and signals live in a structure the caller owns, passed to every entry point through a pointer to the real-time model data structure. Nonreusable code keeps one global copy of the data, so only one instance can exist.
:::

A model referenced twice in a vehicle model, say one valve driver per engine, must allow multiple instances, so its code must be reusable. There is a third packaging choice, **C++ class**, where the model becomes a class and each instance is an object that **[[owns its own data|raii-bridge]]**.

Nonreusable code is not wrong. For a single control law it is common: a global at a fixed address is a little faster to reach than data behind a pointer, and easy to find in a debugger.

::: warning A global breaks reusability
If a reusable model also has a signal with the ExportedGlobal or ImportedExtern storage class, that one variable is shared by every instance, and the instances are no longer independent. Embedded Coder can report this with the **Multi-instance code error diagnostic**, set to warn or to stop the build. Treat the report as a real defect, not noise.
:::

## Check yourself

::: check
A 50 Hz attitude controller model is flown for a 120 s ascent. How many times is each of its three entry points called, and what calls them?
:::

::: answer
At 50 Hz the step is $1/50 = 0.02$ s, so `step` is called $120 / 0.02 = 6000$ times. `initialize` is called once before the first step and `terminate` once at the end. The generated code calls none of them itself; the hand-written scheduler (a timer interrupt or a periodic real-time task) does, and it is responsible for calling `step` every 20 ms.
:::

::: check
The telemetry code, written by hand, defines `float tlm_pitch_err;` and the model must write its pitch error into that variable every step. Which storage class do you give the model's signal? What does the linker say if you choose ExportedGlobal instead?
:::

::: answer
ImportedExtern: the model's code declares `extern float tlm_pitch_err;` and writes to it, while the telemetry code keeps the one definition. With ExportedGlobal, the generated `.c` file would define it as well, so the linker would find two definitions and stop with a "multiple definition of `tlm_pitch_err`" error.
:::

::: check
A signal holds a status word that a DMA controller (hardware that copies data into memory without the processor) updates at any moment. Which storage class fits, and what could go wrong without it?
:::

::: answer
Volatile. Without it, the compiler may read the value once and keep it in a register, for example across a loop that waits for a bit to change, so the code never sees the hardware's update. Volatile forces a fresh read from memory at every use. It does not make multi-word reads atomic, so if the status word is wider than the processor reads in one go, a proper handshake is still needed.
:::

::: check
In the Code Mappings editor, the Data Defaults row for Inports says ExportedGlobal, and the inport `baro_alt` is set individually to ImportedExtern. What does the generated code do for `baro_alt` and for the other inports?
:::

::: answer
The individual setting overrides the category default. `baro_alt` is declared `extern` and used, and hand-written code must define it. Every other root inport, which has no individual setting, follows the default and becomes a global that the generated code defines and exports in its header.
:::

::: check
A team wants one generated Kalman-filter model to run three times, once for each of three redundant IMUs, from the same task. What setting do they need, and what does each call receive?
:::

::: answer
They set Code interface packaging to Reusable function (or C++ class), and if the filter is a referenced model, allow multiple instances. The flight software then creates three instance data structures, one per IMU, and passes a pointer to the right real-time model data structure to every initialize and step call. The three filters share the code but keep separate states. With nonreusable code, the three calls would all update the same global states.
:::

## Summary

| Idea | Meaning | What to remember |
|---|---|---|
| Entry points | Functions outside code calls | `model_initialize` once, `model_step` every sample, `model_terminate` at shutdown |
| Multitasking | One step function per rate | `model_step0`, `model_step1`, … run in separate tasks |
| Default data structures | Globals `model_U`, `model_Y`, `model_DW`, `model_B`, `model_P` | Inputs, outputs, states, signals, tunable parameters |
| ExportedGlobal | Model defines and exports a global | `.c` defines, `.h` declares `extern` |
| ImportedExtern | Model declares `extern`, your code defines | Missing definition: "undefined reference" |
| Volatile | Compiler re-reads and re-writes every access | For hardware and interrupt data; not a lock |
| Custom storage classes | Const, Struct, GetSet, Define, … or your own | Defined once in the Embedded Coder Dictionary |
| Code Mappings editor | Table of data and function mappings | Category defaults, per-element overrides, entry point names |
| Reusable code | Caller owns each instance's data | Pointer to the real-time model data structure; reentrant |
| Nonreusable code | One global copy of the data | One instance only; simple and fast |

The next lesson looks inside one row of that table, the parameters: whether a gain is a variable you can tune or a number folded into the code, how a controller runs on a processor with no floating-point unit, and how the code can call a chip's own fast instructions.

::: context scheduler What actually calls the step function
On a flight computer, a hardware timer fires an interrupt every 10 ms, or a real-time operating system such as VxWorks or RTEMS wakes a periodic task. That code reads the sensors, writes the model's inputs, calls the step function, and sends the outputs to the actuators. The step must finish well before the next tick. Everything in this picture except the step itself is hand-written.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="345" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="140" y1="30" x2="140" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="240" y1="30" x2="240" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="340" y1="30" x2="340" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="40" y="55" width="35" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="140" y="55" width="35" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="240" y="55" width="35" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="57" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">step</text>
  <text x="157" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">step</text>
  <text x="257" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">step</text>
  <text x="40" y="22" font-size="11" text-anchor="middle" fill="#b4232c">tick</text>
  <text x="140" y="22" font-size="11" text-anchor="middle" fill="#b4232c">tick</text>
  <text x="240" y="22" font-size="11" text-anchor="middle" fill="#b4232c">tick</text>
  <text x="40" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">0 ms</text>
  <text x="140" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">10 ms</text>
  <text x="240" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">20 ms</text>
  <text x="340" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">30 ms</text>
  <text x="190" y="115" font-size="11" text-anchor="middle" fill="#6c7a93">idle time between steps is the margin</text>
</svg>
```
:::

::: context overrun When a step runs late
An overrun means the timer ticked again while the previous step was still running. The example `rt_OneStep` sets a flag when it starts a step and clears it when it finishes; if the flag is still set at the next tick, the step overran. A flight scheduler treats that as a fault to count, report and act on, because a control law that silently skips or delays cycles no longer has the stability margins it was designed with. Lesson 9 shows how to measure how close to the limit a step runs.
:::

::: context rtwtypes Where the names come from
Simulink Coder was called Real-Time Workshop until MathWorks renamed it in 2011, and the old initials survive in file and type names: `rtwtypes.h`, and prefixes like `rt_` and `RT_MODEL`. That header defines fixed-size names such as `real_T` (a double), `real32_T` (a single), `int16_T` and `boolean_T`, sized from the hardware implementation settings of lesson 6, so the rest of the generated code never depends on how big an `int` is on a given chip.
:::

::: context linker The tool that joins the pieces
The compiler turns each `.c` file into an object file on its own, trusting every `extern` promise. The linker then joins all object files into one program and matches every use of a name to exactly one definition. That is why a missing definition or a duplicate one is a link error, not a compile error. In a flight build, the generated files and the hand-written files meet for the first time here.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="15" width="90" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">att.c</text>
  <rect x="15" y="65" width="90" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="60" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">fsw.c</text>
  <rect x="135" y="15" width="80" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="175" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">att.o</text>
  <rect x="135" y="65" width="80" height="30" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="175" y="85" font-size="11" text-anchor="middle" fill="#1f2a44">fsw.o</text>
  <rect x="255" y="40" width="90" height="30" rx="4" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="300" y="60" font-size="11" text-anchor="middle" fill="#ffffff">program</text>
  <line x1="105" y1="30" x2="135" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="105" y1="80" x2="135" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="215" y1="30" x2="255" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="215" y1="80" x2="255" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="125" font-size="11" text-anchor="middle" fill="#6c7a93">compile each file</text>
  <text x="255" y="125" font-size="11" text-anchor="middle" fill="#6c7a93">link: match names</text>
</svg>
```
:::

::: context memory-section Putting data where it belongs
A flight processor's memory is not one uniform space. There is fast RAM close to the core, slower external RAM, and flash memory that keeps its contents with the power off. A memory section is a named region, and the linker script says which physical memory each section occupies. A custom storage class can wrap its variables in the compiler's section directive, such as a `#pragma` or an attribute, so that, for example, every calibration table lands in one flash region that a ground tool knows how to rewrite.
:::

::: context reentrant Two calls at once
Reentrant comes from "re-enter": can a second call enter the function before the first has left? Below, the main loop is inside the step for instance A when an interrupt arrives and runs the step for instance B. If the function kept its state in one global, B's call would overwrite A's half-finished work. With each instance's data behind its own pointer, the two calls never touch the same memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="15" y="40" font-size="11" fill="#1f2a44">main loop</text>
  <text x="15" y="95" font-size="11" fill="#1f2a44">interrupt</text>
  <rect x="85" y="25" width="70" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="245" y="25" width="70" height="22" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="120" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">step(A)</text>
  <text x="280" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">step(A)</text>
  <rect x="160" y="80" width="80" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="200" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">step(B)</text>
  <line x1="157" y1="47" x2="160" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="240" y1="80" x2="244" y2="47" stroke="#b4232c" stroke-width="1.5"/>
  <text x="200" y="122" font-size="11" text-anchor="middle" fill="#6c7a93">A is paused mid-step while B runs</text>
</svg>
```
:::

::: context raii-bridge The C++ class version
With the C++ class packaging, the model becomes a class whose data members hold the states and signals, and whose member functions are `initialize`, `step` and `terminate`. Each instance is an object, and it owns its data for its whole lifetime, the same idea as the RAII classes in the C++ module: the object is the resource. Two objects are two independent controllers, with no pointer passing written by hand. Lesson 10 integrates generated code into a C++ application.
:::
