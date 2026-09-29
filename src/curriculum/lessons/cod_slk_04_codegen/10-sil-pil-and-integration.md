---
id: l10-sil-pil-and-integration
title: 'SIL, PIL and plugging generated code into a real program'
minutes: 22
covers:
  - SIL and PIL as Model block simulation modes; equivalence testing against the model
  - Integrating generated code with a hand-written C++ application
---

Think of a new engine for a car. The engine maker tests it on a stand in the factory, with fuel lines and sensors bolted on, and checks that it makes the power the drawings promised. But a car is more than an engine. Somebody has to mount it in the body, connect it to the gearbox and the pedals, and make sure the whole car drives. The engine test says the engine is right. Only the finished car says the engine is *used* right.

Generated code lives the same two lives. First you prove the code does what the model did. Then you mount it inside a real program that feeds it sensor data, calls it on time, and passes its commands to the actuators. Lessons 1 and 2 named SIL and PIL and built the equivalence tests; lessons 6 to 9 set up the code itself. This lesson shows how SIL and PIL are switched on, and what it means when the numbers differ by a hair. Then it writes, compiles and runs a C++ program that calls the controller's step function on a real clock, the way a flight computer does.

## Switching a component into SIL or PIL

In Simulink you do not build a separate test program for SIL. You flip a setting, and Simulink swaps the model for its code.

The switch lives in two places. The first is the **[[Model block|model-block]]**, the block that places one model inside another. It has a parameter called **Simulation mode**. Its choices include:

- **Normal**: simulate the referenced model as blocks, the MIL case.
- **Accelerator**: compile the referenced model into fast simulation code. This is for speed, not for verification.
- **Software-in-the-loop (SIL)**: generate production code for the referenced model with Embedded Coder, compile it for your PC, and run that compiled code each step.
- **Processor-in-the-loop (PIL)**: generate the same code, cross-compile it for the target chip, download it, and run it there each step.

The second place is the top model itself. Its simulation mode can also be set to SIL or PIL, and then the whole top model runs as code. Use the Model block when the controller is one component inside a bigger test model, with the plant around it. Use top-model SIL when the controller model *is* the thing you are testing, driven by a harness.

From MATLAB, the Model block's switch is one line. Here `ctrl_ref` is a Model block in a test model called `pitch_test`:

```matlab
set_param('pitch_test/ctrl_ref', 'SimulationMode', 'Software-in-the-loop (SIL)');
sim('pitch_test');   % the plant simulates; the controller runs as compiled C
```

Both modes need Embedded Coder, because they test the production code it generates. A Model block in SIL mode also has a **Code interface** setting. Choose **Top model** to test the code exactly as it will be called when this model is built on its own for the flight computer. Choose **Model reference** to test the code form used when it sits inside a bigger model's build.

::: key
SIL and PIL are simulation modes. Set a Model block's Simulation mode (or the top model's) to Software-in-the-loop (SIL) or Processor-in-the-loop (PIL), and the same test runs against the generated code instead of the blocks, with no change to the harness or the inputs.
:::

### What PIL adds

PIL needs one more thing that SIL does not: a way to reach the board. Simulink must know how to build for the target, how to download the program, how to start it, and how to pass data back and forth each step. That recipe is called a **[[connectivity|pil-connectivity]] configuration**. For popular boards it comes in a MathWorks hardware support package. For a custom flight processor, the team writes one that uses the chip vendor's compiler, loader and a serial or Ethernet link.

Everything else is the same. One test suite, three answers: blocks, host code, target code.

::: key
What is the difference between SIL and PIL, and what does each catch? SIL compiles the generated code for the host, catching code-generation and algorithm mismatches. PIL cross-compiles and runs on the actual target, catching target-specific integer width, endianness, floating-point behaviour and execution-time issues that the host cannot show.
:::

PIL runs can also time each step on the real chip, the first honest estimate of its cost (lesson 9).

## Equivalence: how equal is equal?

An equivalence test runs the same inputs through the model in Normal mode and through the code in SIL or PIL, logs the outputs, and compares them sample by sample within a tolerance. Lesson 2 set up the test in the Test Manager and showed how absolute and relative tolerances combine. The question here is what the differences mean.

There are three kinds of result.

- **Bit-for-bit equal.** Common for fixed-point and integer code, and often for double-precision code too.
- **Different in the last bit or two**, around $10^{-16}$ times the signal's size. This is rounding, not a bug.
- **Different by a real amount**, near the signal's size or growing over time. This is a defect, and the test must fail.

Why would correct code differ in the last bit at all? A computer stores a double-precision number with 53 binary digits. Every addition and multiplication is rounded to the nearest number it can hold. If two programs do the same arithmetic in a different order, or round at different moments, their answers can land on neighboring numbers. The gap between neighbors is called one **[[unit in the last place|ulp]]**, or ulp. Near 1 it is $2^{-52} \approx 2.2 \times 10^{-16}$; near 2 it is twice that.

Three things commonly change the rounding between a simulation and compiled code:

1. **Order of operations.** Floating-point addition is not associative: $(a + b) + c$ can differ from $a + (b + c)$ in the last bit. A compiler allowed to reorder sums, or code that sums a vector in a different order, moves the rounding.
2. **[[Fused multiply-add|fma]].** Many processors can compute $a \times b + c$ in one instruction that rounds once instead of twice. A compiler may use it on the target and not on the host.
3. **Math libraries.** Functions such as `sin`, `exp` and `pow` come from the C library on the target, not from MATLAB. Two libraries can round `sin` differently in the last bit.

::: key
Equivalence testing: log the model and the generated code on the same inputs, compare sample by sample within a stated tolerance. Differences of a few ulps are rounding (operation order, fused multiply-add, math libraries). Differences near the signal's size, or growing with time, are defects.
:::

::: example Two compiles, one controller
A PI controller runs for 200 steps of 0.01 s against a simple plant. Its output $u$, the command, is logged as 17-digit text. A Python script computes the same equations and serves as the reference (the "model"). The C is compiled twice with gcc on the same PC: once plainly, and once with the options `-mfma -ffp-contract=fast`, which let the compiler fuse multiplies and adds.

**Step 1: the plain compile.** The largest difference over all 200 samples is exactly $0$. Every sample matches bit for bit. Both programs did the same roundings in the same order.

**Step 2: the fused compile.** Now 43 of the 200 samples differ. The largest difference in $u$ is $8.88 \times 10^{-16}$, at step 84, where $u$ is about 2.36. The two values printed there are 2.3623776613004104 and 2.3623776613004113.

**Step 3: compare with the ulp.** Between 2 and 4, neighboring doubles are $2^{-51} \approx 4.44 \times 10^{-16}$ apart. So the difference is $8.88 / 4.44 = 2$ ulps. The fused instruction rounded once where the plain code rounded twice, and the tiny change fed through the integrator for a few steps.

**Step 4: the verdict.** A typical tolerance for a double-precision control law is $10^{-12}$ absolute. The worst difference is over a thousand times smaller. Pass.

**Sanity check.** Nothing about the controller changed except how the compiler rounds, and the difference is a couple of steps on the number ladder, not a fraction of the signal. If the fused build had shown $0.05$, that would be a real difference, and "it's only floating point" would be the wrong excuse.
:::

::: warning Do not widen the tolerance to make a test pass
When an equivalence test fails, first find out *why*. Plot the difference over time. Rounding noise stays tiny and wanders. A real defect usually starts at a particular event, such as a saturation, a mode switch or a table edge, and is signal-sized. Set tolerances from the arithmetic before you run the test, and write down the reason.
:::

## Calling generated code from a hand-written program

SIL proves the code is right when Simulink calls it. On the vehicle, Simulink is gone. Somebody else has to call it. Here is how flight software built this way is really organized.

::: key
What is the realistic architecture of flight software built this way? Generated control-law code from the model, integrated with a hand-written scheduler, I/O drivers, middleware and fault management. Model-based design owns the algorithm; humans own the infrastructure.
:::

Lesson 7 showed what Embedded Coder hands you: a header, `model.h`, and three entry points. `model_initialize()` sets every state and output to its starting value. `model_step()` runs one step at the model's base rate. `model_terminate()` runs any shutdown code. The inputs and outputs travel through the data interface you configured, by default the global structures `model_U` (inputs) and `model_Y` (outputs).

The caller includes `model.h`, initializes once, steps on every tick, and terminates once. The part people get wrong is the beat. The model's integrators, filters and delays all assume a fixed sample time $T_s$ (read "T sub s"). The step function has no clock inside it. If you call a 100 Hz controller every 12 ms, it still believes each call is 10 ms apart, and every integral and derivative it computes is off by that ratio.

::: key
Integrating generated code: include model.h; call model_initialize once; each base-rate tick write inputs, call model_step, read outputs; call model_terminate at shutdown. The step function has no clock, so the scheduler must call it at exactly the sample time the model was built for.
:::

A model with several rates can generate one step function per rate, such as `model_step0()` and `model_step1()`, when each rate is treated as a separate task. The scheduler then calls each at its own rate, the fast one at a higher priority. This lesson's example has one rate.

### The generated side (a stand-in)

The files below are a **hand-written stand-in for generated code**. They are shaped like Embedded Coder output for a PI controller model named `pid`, but a person wrote them so you can compile the example without MATLAB. Real generated code has more comments and its names depend on your identifier settings and code mappings.

```c
/* pid.h -- hand-written stand-in for Embedded Coder output (not real generated code) */
#ifndef PID_H
#define PID_H

typedef double real_T;             /* normally comes from rtwtypes.h */

typedef struct { real_T ref; real_T meas; } ExtU_pid_T;   /* root inports  */
typedef struct { real_T u; } ExtY_pid_T;                  /* root outports */
typedef struct { real_T Kp_Gain; real_T Ki_Gain; real_T uMax; } P_pid_T; /* tunable */
typedef struct { real_T Integrator_DSTATE; } DW_pid_T;    /* states */

#ifdef __cplusplus
extern "C" {                       /* C linkage when included from C++ */
#endif
extern ExtU_pid_T pid_U;           /* inputs, written by the caller   */
extern ExtY_pid_T pid_Y;           /* outputs, read by the caller     */
extern P_pid_T    pid_P;           /* tunable parameters              */
extern DW_pid_T   pid_DW;          /* internal state                  */

void pid_initialize(void);
void pid_step(void);
void pid_terminate(void);
#ifdef __cplusplus
}
#endif
#endif
```

```c
/* pid.c -- hand-written stand-in for Embedded Coder output (not real generated code) */
#include "pid.h"

ExtU_pid_T pid_U;
ExtY_pid_T pid_Y;
DW_pid_T   pid_DW;
P_pid_T    pid_P = { 3.0, 8.0, 2.5 };   /* Kp, Ki, output limit */

void pid_step(void)          /* base rate: 0.01 s */
{
  real_T e = pid_U.ref - pid_U.meas;                       /* '<Root>/Sum' */
  real_T u = pid_P.Kp_Gain * e + pid_DW.Integrator_DSTATE;  /* '<Root>/Kp', '<Root>/Add' */
  if (u > pid_P.uMax) {                                     /* '<Root>/Saturation' */
    u = pid_P.uMax;
  } else if (u < -pid_P.uMax) {
    u = -pid_P.uMax;
  }
  pid_Y.u = u;
  pid_DW.Integrator_DSTATE += 0.01 * (pid_P.Ki_Gain * e);   /* '<Root>/Integrator' */
}

void pid_initialize(void)
{
  pid_DW.Integrator_DSTATE = 0.0;
  pid_U.ref = 0.0;
  pid_U.meas = 0.0;
  pid_Y.u = 0.0;
}

void pid_terminate(void)
{
  /* (no terminate code required) */
}
```

Two details matter for C++. The header wraps its declarations in a guard that gives them **[[C linkage|c-linkage]]** when a C++ file includes it, so the C++ linker can find the C functions. If a header you are given has no such guard, wrap the include line in `extern "C" { ... }` yourself. And the gain lives in `pid_P.Kp_Gain`, a field of the parameter structure, because it was made tunable (lesson 8). Each statement ends with a comment naming its block, as in the real thing (lesson 9).

### The hand-written side: a RAII wrapper and a scheduler

From the RAII module you know the pattern: a constructor acquires a resource, and a destructor gives it back, however the scope ends. A running controller is a resource. So the wrapper's constructor calls `pid_initialize()` and its destructor calls `pid_terminate()`. Nobody can forget either one.

This code has one global copy of its data, so there must be only one wrapper. Deleting the copy operations makes an accidental copy a compile error. (Reusable code from lesson 7, with its instance structure, would let each wrapper own its own data instead.)

The scheduler is a loop on `std::chrono::steady_clock`, the clock that never jumps backward. It keeps a variable `next`, the time of the next tick, and after each step it sleeps until that absolute time. Then it adds one period to `next`. Because it adds to the *schedule*, not to "now", small wake-up delays never pile up. That is the difference between `sleep_until(next)` and `sleep_for(period)`, and the next example puts a number on it.

```cpp
// main.cpp -- hand-written application around the generated controller
#include "pid.h"
#include <chrono>
#include <cstdio>
#include <thread>

class PidController {                 // RAII: initialize in, terminate out
public:
    PidController()  { pid_initialize(); }
    ~PidController() { pid_terminate(); }
    PidController(const PidController&) = delete;             // one global model:
    PidController& operator=(const PidController&) = delete;  // no copies

    double step(double ref, double meas) {
        pid_U.ref  = ref;              // write inputs
        pid_U.meas = meas;
        pid_step();                    // one base-rate step
        return pid_Y.u;                // read output
    }
};

int main() {
    using clock = std::chrono::steady_clock;
    constexpr auto period = std::chrono::milliseconds(10);   // 100 Hz base rate

    PidController ctrl;
    double y = 0.0;                    // simulated plant: dy/dt = -2y + u
    int overruns = 0;

    auto next = clock::now() + period;
    for (int k = 0; k < 200; ++k) {    // 2 s of flight
        const double u = ctrl.step(1.0, y);
        y += 0.01 * (-2.0 * y + u);    // plant, Euler, same 10 ms step
        if (k % 50 == 49)
            std::printf("t=%.2f s  u=%.6f  y=%.6f\n", (k + 1) * 0.01, u, y);

        if (clock::now() > next) ++overruns;   // finished after the deadline
        std::this_thread::sleep_until(next);   // wait for the next tick
        next += period;                        // absolute schedule: no drift
    }
    std::printf("overruns: %d\n", overruns);
}   // ctrl's destructor calls pid_terminate() here

/* Build and run:
   gcc -std=c99 -Wall -c pid.c
   g++ -std=c++17 -Wall main.cpp pid.o -o app
   ./app
Output (takes 2 s of real time):
   t=0.50 s  u=2.500000  y=0.794788
   t=1.00 s  u=2.221127  y=1.049554
   t=1.50 s  u=2.020933  y=1.042953
   t=2.00 s  u=1.991488  y=1.014972
   overruns: 0                                                   */
```

Read the output as a control engineer. At first the error is large, so the command hits its limit of 2.5. The measurement climbs, overshoots to about 1.06, and settles toward 1.0. The command settles toward 2.0, which is what this plant needs to hold 1.0, since $-2(1.0) + 2.0 = 0$. The overrun count is 0, no surprise for a few multiplications on a PC.

The **[[overrun|overrun-policy]]** check compares the time after the step with the deadline `next`, so it catches a slow step and a late wake-up alike. On a flight computer an overrun is a fault to count, report and act on, not a line in a log.

::: warning Initialize once, and before anything reads an output
Calling `model_initialize()` a second time in the middle of a run resets every integrator and filter. The vehicle feels it as a sudden jump in the command. Reading `model_Y` before the first step gives the initial value, not a computed command. The RAII wrapper makes the order automatic: construct once, step, destroy.
:::

::: example What sleep_for costs over a minute
A 100 Hz loop uses `sleep_for(10 ms)` after each step, instead of `sleep_until(next)`. Each step, with its I/O, takes 1.8 ms. How far behind is the controller's idea of time after one real minute?

**Step 1: the real period.** Each cycle is the step plus the sleep: $10 + 1.8 = 11.8$ ms. The loop really runs at $1 / 0.0118 \approx 84.7$ Hz, not 100 Hz.

**Step 2: steps in one minute.** $60 / 0.0118 \approx 5084.7$, so 5,084 complete steps, not 6,000. That is 916 missing steps.

**Step 3: the controller's clock.** The step function believes each call is 10 ms apart. After 5,084 calls it believes $5084 \times 0.01 = 50.84$ s have passed. The real answer is 60 s. It is 9.16 s behind.

**Step 4: with sleep_until.** The deadline sequence is fixed in advance: 10 ms, 20 ms, 30 ms and so on. A 1.8 ms step only shifts where inside each 10 ms slot the work happens. After one minute the loop has run 6,000 steps, give or take the one in progress.

**Sanity check.** Losing 15 percent of the steps is the same as the rate dropping by 15 percent, and $84.7 / 100$ is about 85 percent. Every integral in the controller would be about 15 percent weak per real second, which for a flight loop is a large, silent error.
:::

### On a real flight computer

The `sleep_until` loop runs on an ordinary operating system, so its wake-ups can be a millisecond late when the PC is busy. Flight software replaces it with an **[[RTOS|rtos]]** (real-time operating system), whose scheduler guarantees that the highest-priority ready task runs. The shape stays the same. A hardware timer interrupt fires every base period. The control task wakes on it, runs the step, and blocks until the next tick. In FreeRTOS, for example, the call `vTaskDelayUntil` gives the same absolute-time wake-up as `sleep_until`.

The rest of the hand-written software sits around that task: drivers that read the gyros and write the fin commands, a health monitor that watches for overruns and a watchdog, telemetry. For this module, the boundary is what matters. Generated code stops at `model_U` and `model_Y`. Everything outside is yours.

To check the finished program against the model, split timing from arithmetic. Build a test version of `main` with no sleeps that prints every sample with 17 digits, and compare it with the model's log for the same input. That is exactly what the first example of this lesson did: the plain build matched bit for bit. If the test version matches but the real-time version drifts, the problem is timing, such as a wrong period, a missed tick or a `sleep_for`, not arithmetic.

## Check yourself

::: check
A test model contains the controller as a Model block. You want to run the same 30 test cases against the code compiled for your PC, and later against the code on an evaluation board with the flight chip. What do you change each time, and what must exist before the second run can work?
:::

::: answer
Only the Model block's Simulation mode: first Software-in-the-loop (SIL), then Processor-in-the-loop (PIL). The harness and inputs stay the same. Before PIL can run, Simulink needs a connectivity configuration for the board: how to cross-compile with the target's compiler, download the program, start it and exchange data each step. For common boards that comes in a hardware support package; for a custom processor the team writes one.
:::

::: check
An equivalence test between Normal mode and SIL shows differences of about $3 \times 10^{-16}$ on a signal near 1.5, scattered through the run. Is this a defect? Name two causes that could produce it.
:::

::: answer
Not a defect. Between 1 and 2 the gap between neighboring doubles is $2^{-52} \approx 2.2 \times 10^{-16}$, so $3 \times 10^{-16}$ is one or two ulps: rounding, not logic. Possible causes: a different order of additions in the compiled code, a fused multiply-add that rounds once instead of twice, or a math library whose `sin` or `exp` rounds differently in the last bit. The test passes with any sensible tolerance, such as $10^{-12}$.
:::

::: check
A teammate's integration calls `model_initialize()` at the top of the 100 Hz loop, before every `model_step()`. What does the controller do, and how does a RAII wrapper prevent it?
:::

::: answer
Every step starts from the initial state, so integrators, filters and delays are reset 100 times a second. An integrator never accumulates anything, so a PI controller behaves like a P controller, and any filter never gets past its first sample. With the wrapper, `model_initialize()` runs only in the constructor, which runs once when the object is created before the loop, and the loop can only call `step()`.
:::

::: check
A 50 Hz loop (20 ms period) is written with `sleep_for(20 ms)` after a step that takes 4 ms. How many steps run in 10 real seconds, and what time does the controller think it is?
:::

::: answer
Each cycle takes $20 + 4 = 24$ ms. In 10 s that is $10 / 0.024 \approx 416.7$, so 416 complete steps instead of 500. The controller assumes 20 ms per step, so it believes $416 \times 0.02 = 8.32$ s have passed, 1.68 s behind. With `sleep_until` and a schedule advanced by 20 ms each tick, it would run 500 steps.
:::

## Summary

| Idea | What it means | Where it lives |
|---|---|---|
| SIL mode | Model block or top model runs generated code compiled for the host | Simulation mode = Software-in-the-loop (SIL) |
| PIL mode | Same code cross-compiled, run on the target each step | Simulation mode = Processor-in-the-loop (PIL), plus a connectivity configuration |
| Equivalence test | Same inputs through model and code; compare within tolerance | Differences of a few ulps are rounding; signal-sized ones are defects |
| ulp | Gap between neighboring doubles | About $2.2 \times 10^{-16}$ near 1, $4.4 \times 10^{-16}$ near 2 |
| Entry points | `model_initialize`, `model_step`, `model_terminate` | Once, every base-rate tick, once |
| Data interface | Write `model_U`, read `model_Y` | Set by storage classes and code mappings |
| RAII wrapper | Constructor initializes, destructor terminates, no copies | Hand-written C++ |
| Scheduler | `sleep_until` on an absolute schedule; overrun check against the deadline | Hand-written; an RTOS task on the vehicle |
| Architecture | Generated algorithm inside hand-written infrastructure | Scheduler, drivers, middleware, fault management |

The next lesson goes the other way: instead of putting generated code inside hand-written software, it brings existing hand-written C into the model with S-functions, the Legacy Code Tool and the C Caller block, and then asks what it takes to trust the tools that do all this.

::: context model-block A model inside a model
The Model block came in the architecture module, as the way to reference one model from another. Each referenced model keeps its own file, its own tests and its own generated code. That separation is why SIL and PIL fit it so naturally: the referenced model already has a clean boundary of inputs and outputs, so Simulink can swap the blocks for their compiled code without disturbing anything around it. A test model often has a plant built from blocks and a controller in a Model block, so the same harness can test the controller in Normal, SIL and PIL modes in turn.
:::

::: context pil-connectivity Taking turns over a cable
In PIL, the PC and the board take turns each sample. Simulink computes the plant and sends the controller's inputs down the link. The board runs one step and sends the outputs back. Only then does the plant take its next step. The link might be a serial port, Ethernet, or the chip's debug connection. Because of the turn-taking, a slow link makes the test slow but does not change the answers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="120" height="60" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">PC: Simulink</text>
  <text x="75" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">plant model</text>
  <rect x="225" y="30" width="120" height="60" fill="#f2b880" stroke="#1f2a44"/>
  <text x="285" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">target board</text>
  <text x="285" y="72" font-size="11" fill="#1f2a44" text-anchor="middle">model_step()</text>
  <line x1="135" y1="45" x2="222" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="222,45 214,41 214,49" fill="#1f2a44"/>
  <text x="180" y="38" font-size="11" fill="#1f2a44" text-anchor="middle">1. inputs</text>
  <line x1="225" y1="78" x2="138" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="138,78 146,74 146,82" fill="#1d6fd1"/>
  <text x="180" y="96" font-size="11" fill="#1d6fd1" text-anchor="middle">2. outputs</text>
  <text x="180" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">3. plant steps, repeat</text>
</svg>
```
:::

::: context ulp The rungs of the number ladder
Doubles are not spread evenly. Between 1 and 2 there are exactly $2^{52}$ of them, about 4.5 million billion, evenly spaced $2^{-52}$ apart. Between 2 and 4 there are the same number, so they are twice as far apart. Every doubling of size doubles the gap. That is why tolerances are often relative: an error of $10^{-15}$ is a few rungs for a number near 1 but less than one rung for a number near 100. Python shows the gap with `numpy.spacing(2.4)`, which prints $4.44 \times 10^{-16}$.
:::

::: context fma One rounding instead of two
Computing $a \times b + c$ normally takes two instructions: multiply and round, then add and round. A fused multiply-add does the whole thing exactly and rounds once at the end. It is faster and usually more accurate. It also gives a different last bit from the two-step version in some cases, which is exactly what the example saw. The C standard lets a compiler fuse a multiply and an add written in one expression unless told not to, and gcc's `-ffp-contract` option controls it. Flight teams often pin such options down so host and target round the same way.
:::

::: context c-linkage Why C++ needs to be told
C++ lets two functions share a name if their argument types differ. To keep them apart, the C++ compiler quietly changes each function's name in the object file to include its argument types. This is called name mangling. A C compiler does not do it. So if C++ code calls `pid_step` expecting the mangled name, the linker looks for a name the C file never made, and fails with an "undefined reference". Declaring the functions `extern "C"` tells the C++ compiler to use the plain C name.
:::

::: context overrun-policy What to do when a step is late
Detecting an overrun is easy; deciding what to do is a design choice written into the requirements. Common policies: skip the missed tick and keep the schedule, so the rate stays honest; run the late step and count the fault; after several overruns in a row, declare the task failed and hand control to a backup or a safe mode. The one thing never done is to quietly run two steps back to back to catch up, because the step function would then compute two samples 0 ms apart while believing they were 10 ms apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="140" y1="30" x2="140" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="240" y1="30" x2="240" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="340" y1="30" x2="340" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <rect x="40" y="50" width="40" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="140" y="50" width="125" height="20" fill="#b4232c" stroke="#1f2a44"/>
  <rect x="265" y="50" width="40" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="40" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="140" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">10 ms</text>
  <text x="240" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">20 ms</text>
  <text x="340" y="95" font-size="11" fill="#1f2a44" text-anchor="end">30 ms</text>
  <text x="200" y="40" font-size="11" fill="#b4232c" text-anchor="middle">step still running at 20 ms: overrun</text>
</svg>
```

Red: a step that is still running when the 20 ms tick arrives. Blue: normal steps well inside their slots.
:::

::: context rtos An operating system that keeps promises about time
An ordinary operating system shares the processor fairly and tries to be fast on average. A real-time operating system makes a narrower promise: the highest-priority task that is ready will run, within a bounded delay. VxWorks has flown on Mars rovers, RTEMS is an open-source RTOS used on many spacecraft, and FreeRTOS runs on small microcontrollers everywhere. Some flight software, including SpaceX's, runs on Linux configured for real-time work. The C++ real-time module treats scheduling, watchdogs and worst-case timing in depth.
:::
