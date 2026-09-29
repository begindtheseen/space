---
id: l01-mil-sil-pil-hil
title: 'MIL, SIL, PIL and HIL: four questions on the way to flight'
minutes: 23
covers:
  - The MIL to SIL to PIL to HIL progression and what each step proves
---

Picture a chef inventing a new dish. First she cooks it in her own kitchen, tasting as she goes, until the dish itself is right. Then she writes the recipe on a card and has a friend cook from the card in the same kitchen. If the friend's dish tastes different, the card is wrong, not the idea. Next the card goes to the restaurant, where a different cook uses a different oven that runs hot. Finally comes opening night: real waiters, real customers, orders arriving all at once, a stove that must deliver twelve plates in ten minutes.

Each stage asks a different question. Is the dish good? Does the card say what I did? Does it survive a different oven? Does it survive a real service? A dish can pass one stage and fail the next, and a failure at each stage points to a different fix.

Flight software built from Simulink models goes through the same four stages. They are called **MIL**, **SIL**, **PIL** and **HIL**, and this lesson is about exactly what each one proves, what it cannot prove, and why a flight program runs all four. The previous module ended with a controller model that follows the golden rule: fixed-step, discrete, cleanly multirate, no algebraic loops. This module turns that model into C code and builds the evidence that the code is right. The four stages are the backbone of that evidence.

## The chain in one picture

All four stages share one shape. There is a **controller**, the part that will fly, and a **plant**, everything the controller acts on: the vehicle's motion, its engines, its sensors, the air around it. The plant is always simulated on the ground, because nobody wants to test a new control law on a real rocket. What changes from stage to stage is *what form the controller is in* and *what it runs on*.

| Stage | Controller is | Runs on | Plant is | Real time? |
|---|---|---|---|---|
| MIL | the Simulink model | your desktop PC | a Simulink model | no |
| SIL | generated C, compiled for the PC | your desktop PC | a Simulink model | no |
| PIL | generated C, compiled for the flight processor | the flight processor (or a board with the same chip) | a Simulink model on the PC | no |
| HIL | the real flight computer with its flight software | the flight computer, through its real connectors | a simulation on a real-time computer | yes |

Read the table down one column at a time. Each row changes one or two things from the row above and keeps the rest. That is the whole trick: when a test that passed at one stage fails at the next, the fault is in whatever changed. Systems engineers draw these stages on the right-hand arm of **[[the V-model|v-model]]**, a picture of development in which each level of design is checked by a matching level of test.

::: key
MIL, SIL, PIL, HIL: what does each prove? MIL: the model behaves as specified. SIL: the generated code, compiled on the host, matches the model. PIL: the code behaves correctly when cross-compiled and run on the target processor, including its arithmetic and timing. HIL: the real controller hardware behaves correctly against a simulated plant over real interfaces.
:::

A word you will meet at every step is **host**: the desktop or laptop PC where you run MATLAB and Simulink. The **target** is the processor that will fly.

## MIL: is the design right?

**Model-in-the-loop (MIL)** testing runs the controller model against the plant model, both in Simulink on your PC. It is what you have been doing all along in the earlier Simulink modules. Nothing is generated or compiled. The solver steps both models together, and you compare the results to the requirements: does the pitch angle settle within 3 seconds, does the mode sequencer switch to abort when the engine pressure drops, does the rate limiter hold the actuator below 20 degrees per second.

MIL proves the *design*: if the flight computer did exactly what the model says, would the vehicle fly correctly? It is cheap and fast. You can run thousands of cases overnight, including ones you would never dare fly, like a stuck actuator at maximum dynamic pressure.

MIL has one more job that is easy to overlook. Its results become the **reference** for every later stage. Once the model passes, SIL, PIL and HIL are all compared against what the model did.

::: warning MIL cannot find a bug in the code
MIL tests the model, and the model is not what flies. A MIL pass says nothing about the C code, the compiler, the processor or the wiring. A team that stops at MIL has proven its idea and nothing else.
:::

## SIL: does the code say what the model says?

**Software-in-the-loop (SIL)** testing generates C code from the controller model, compiles it with an ordinary compiler for your PC, and runs that compiled code in place of the model. The plant is still the same Simulink model. The inputs are the same test inputs as in MIL. Then you compare, sample by sample, the SIL outputs with the MIL outputs.

This comparison is called an **equivalence test** or **[[back-to-back test|back-to-back]]**: the same inputs go into two versions of the same thing, and the outputs must agree within a small tolerance. If they agree, the code generator translated the model faithfully, at least for these inputs.

SIL catches anything that went wrong between the diagram and the C: a setting that gave the code a different data type from the model, a block whose code handles an edge case differently, a hand-written C function that does not do what its simulation stand-in did.

::: example How close is "the same"?
A MIL run and a SIL run of a pitch controller each produce 1,000 samples of the fin command. The largest difference between them is $1.1 \times 10^{-16}$ rad. Is that a pass or a fail?

**Step 1: where could such a tiny difference come from?** Floating-point addition is not quite associative. In double precision, $(0.1 + 0.2) + 0.3 = 0.6000000000000001$, but $0.1 + (0.2 + 0.3) = 0.6$. The two differ by $1.1 \times 10^{-16}$. If the compiler adds three numbers in a different order from the simulation, the last bit can change.

**Step 2: compare with the number's own graininess.** The fin command is about 0.6 rad here. Near 0.6, neighboring double-precision numbers are $2^{-53} \approx 1.1 \times 10^{-16}$ apart. So the two runs differ by exactly one step on that ladder: one bit in the last place.

**Step 3: set the tolerance before looking.** A team typically allows something like $10^{-12}$ absolute for a double-precision controller. $1.1 \times 10^{-16}$ is ten thousand times smaller. Pass.

**Sanity check.** A real bug, such as a wrong gain or a missed saturation, shows up as a difference of the same size as the signal itself, around 0.01 to 1 rad, not $10^{-16}$. Differences near one bit mean rounding; differences near the signal's size mean a real problem.
:::

::: warning SIL runs on the wrong processor
Your PC's processor, compiler and number sizes are not the flight computer's. A SIL pass proves the code matches the model *when compiled for the PC*. Anything that depends on the target's word sizes, its floating-point hardware or its speed is still untested.
:::

## PIL: does the code survive the real processor?

**Processor-in-the-loop (PIL)** testing takes the same generated C and compiles it with the **[[cross-compiler|cross-compiler]]** for the flight processor: the compiler that runs on your PC but produces machine code for a different chip. The compiled code is loaded onto the real processor, usually on a development board with the same chip as the flight computer. The plant model stays in Simulink on the PC.

At every sample, Simulink sends the plant's outputs to the board over a link such as a serial cable, Ethernet or the chip's debug connection. The board runs one step of the controller and sends the controller's outputs back. Then the plant takes its next step. The board is really running the flight code, but the two sides take turns. That is why PIL is **not real time**: each step can take as long as the link needs.

Now the comparison is PIL against MIL (or against SIL), and what changed is exactly the processor and the compiler. So PIL catches the things that depend on them.

- **Word sizes.** On your PC, the C type `int` is 32 bits. On some microcontrollers and signal processors it is 16 bits. Code that silently relied on a 32-bit `int` can overflow on the target.
- **Floating point.** Some processors have no hardware for 64-bit `double`, and on some compilers `double` is only 32 bits wide. A calculation that was fine in 64 bits can lose precision.
- **Byte order.** The **[[endianness|endianness]]** of a processor is the order in which it stores the bytes of a multi-byte number. Code that packs a telemetry message by copying raw bytes gives different results on a processor with the other order.
- **Execution time.** Because the code runs on the real chip, PIL can measure how long each step takes, which is the first honest number for the timing budget from the previous module.

The hardware implementation settings in the model tell the code generator the target's word sizes and byte order. PIL is how you find out whether those settings match the real chip and its compiler. A later lesson in this module sets them up.

::: key
What is the difference between SIL and PIL, and what does each catch? SIL compiles the generated code for the host, catching code-generation and algorithm mismatches. PIL cross-compiles and runs on the actual target, catching target-specific integer width, endianness, floating-point behavior and execution-time issues that the host cannot show.
:::

::: example A clock that runs slow on the target
A controller keeps a mission clock by adding its 1 ms step to a running total every step. In the model, and in SIL on the PC, the total is a 64-bit double. Suppose the target's compiler makes `double` only 32 bits wide. What does the clock read after one hour? The C below mimics both cases on a PC by using `float`, which is 32 bits.

```c
#include <stdio.h>
#include <stdint.h>
int main(void) {
    double t64 = 0.0;   /* the model and SIL: 64-bit */
    float  t32 = 0.0f;  /* the target in this story: 32-bit */
    for (long k = 1; k <= 3600000L; ++k) {  /* one hour of 1 ms steps */
        t64 += 0.001;
        t32 += 0.001f;
    }
    printf("64-bit clock after 1 h: %.6f s\n", t64);
    printf("32-bit clock after 1 h: %.6f s\n", (double)t32);

    int16_t a = 30000, b = 10000;
    int32_t pc_sum  = a + b;             /* PC: added in 32-bit int */
    int32_t t16_sum = (int16_t)(a + b);  /* what a 16-bit result keeps */
    printf("PC sum: %d, 16-bit sum: %d\n", pc_sum, t16_sum);
    return 0;
}
/* Output (gcc on a PC):
   64-bit clock after 1 h: 3600.000000 s
   32-bit clock after 1 h: 3530.204102 s
   PC sum: 40000, 16-bit sum: -25536   */
```

**Step 1: the 64-bit clock.** 3,600,000 steps of 0.001 s gives 3600.000000 s to six decimals. Correct.

**Step 2: the 32-bit clock.** It reads 3530.2 s, almost 70 s slow. A 32-bit float carries only [[about 7 significant digits|patriot]]. Once the total is in the thousands, each addition of 0.001 is rounded to the nearest number the float can hold, and those roundings pile up. After one minute the clock was only 21 ms off; after an hour, 70 s.

**Step 3: the integer case.** The last three lines show the other trap. On the PC, two 16-bit numbers are added as 32-bit `int`s, so $30000 + 10000 = 40000$. Where the result is held in 16 bits, the largest value is 32,767, and 40,000 wraps around to $40000 - 65536 = -25536$.

**Sanity check.** Neither problem can appear in MIL or SIL, because both use the PC's arithmetic: 64-bit doubles and 32-bit ints. They appear the first time the code runs on the target's arithmetic, which is PIL. That is the stage's whole reason to exist.
:::

::: warning PIL timing is only a first estimate
PIL measures the step's execution time on the real chip, but with the test link attached, possibly with a different memory setup and without the other flight tasks competing for the processor. Treat PIL times as a good early estimate. The final timing evidence comes from the real flight computer under load.
:::

## HIL: does the real box work in real time?

**Hardware-in-the-loop (HIL)** testing puts the real flight computer on the bench, running its real flight software, with the generated control code inside it. The plant now runs on a **[[real-time computer|real-time-computer]]**: a special machine that computes the plant model on a hard clock, step for step with the wall clock, and talks to the flight computer through the same connectors the vehicle will use. It produces the sensor signals, voltages and bus messages the flight computer would see in flight, and it reads back the flight computer's actuator commands.

For the first time, nothing waits. Sensor data arrives over the real data bus, through real drivers, with real delays. HIL tests the *whole unit* against a simulated world, including things no earlier stage had:

- **Real interfaces.** Wiring, connectors, bus protocols such as **[[CAN or MIL-STD-1553|data-buses]]**, driver buffering, analog-to-digital conversion.
- **Real time.** Every task must finish before its deadline while all the other flight software runs too.
- **Real hardware behavior.** Power-up, reset, watchdogs, and what happens when you [[inject a fault|fault-injection]]: a sensor wire cut, a bus message corrupted, a voltage sagging.

::: key
Your HIL rig shows a 4 ms delay that SIL did not. Where does it come from? The real interfaces: bus arbitration and framing on CAN or 1553, driver and DMA buffering, task scheduling and rate-transition latency, and analog conversion time. None of those exist in a host simulation, which is why HIL is not optional.
:::

::: example Adding up an interface delay
A HIL rig measures a 3 ms delay from a gyro changing to the flight computer's fin command changing, where SIL showed none. Break it down and find what it costs the pitch loop, whose crossover (the frequency where the loop's gain falls to one) is 20 rad/s.

**Step 1: the pieces.** The gyro message takes about 0.7 ms to cross the 1 Mbit/s data bus. It can then wait up to 1.0 ms for the driver's next 1 ms polling interrupt to hand it to the software. The control step itself takes 0.3 ms. The fin command then waits up to 1.0 ms for the next output frame. Worst case: $0.7 + 1.0 + 0.3 + 1.0 = 3.0$ ms.

**Step 2: phase cost.** From the algebraic-loop lesson of the previous module, a pure delay $\tau$ (read "tau") costs $\omega\tau$ radians of phase at frequency $\omega$. Here $20 \times 0.003 = 0.06$ rad.

**Step 3: to degrees.** $0.06 \times 180/\pi \approx 3.4^\circ$.

**Sanity check.** A 45° phase margin loses about 3.4°, leaving about 41.6°, still healthy. But if the design had been tuned to a bare 30° in MIL, this delay alone takes more than a tenth of it. HIL is where that shows up, and the fix is to model the delay in MIL and re-check the margin.
:::

HIL rigs are expensive and few, so by the time a build reaches one it should already pass MIL, SIL and PIL. The last lesson of this module goes deeper into HIL rigs.

## Why every stage is needed

Each stage closes a gap the one before it left open, and each is cheaper and faster than the one after it. MIL is the only stage that tests the design itself: if MIL is wrong, every later stage faithfully reproduces a wrong design. HIL also checks the simulation, because the rig's plant must behave like the real vehicle's sensors and actuators.

A failure also tells you where to look. Fails in SIL but not MIL: the code generation or the code settings. Fails in PIL but not SIL: the target's arithmetic, compiler or the hardware settings. Fails in HIL but not PIL: timing, interfaces, drivers or hardware. That is the payoff of changing one thing at a time.

::: warning Passing all four is not flying
The plant is a model at every stage, even HIL. If the model of the engine is wrong, all four stages can pass and the vehicle can still misbehave. Flight tests, and comparing flight data to the models afterwards, close that last gap.
:::

## Check yourself

::: check
A controller passes MIL, but in SIL one output differs from the model by 0.4 at one moment, while everywhere else the difference is about $10^{-16}$. Where would you look first?
:::

::: answer
In the code generation step, near the moment of the difference. The only thing that changed from MIL to SIL is that the model became C compiled for the PC, so a real difference (0.4 is signal-sized, not rounding-sized) means the code does something different from the simulation at that moment. Look for a block whose code handles an edge case differently, or a data type that differs from the model. The $10^{-16}$ elsewhere is only rounding.
:::

::: check
Why is PIL not real time, even though the code is running on the real processor?
:::

::: answer
Because the plant still runs in Simulink on the PC, and the two take turns. Each sample, the PC computes the plant, sends its outputs over the link, waits for the board to run one controller step, and receives the result. The link and the PC set the pace, not a hard clock. So PIL proves the arithmetic and gives a first measure of execution time, but it cannot show how the code behaves when data arrives on its own schedule. That needs HIL.
:::

::: check
The model's hardware settings say `int` is 32 bits, but the flight processor's compiler uses a 16-bit `int`. Which stage first shows the problem, and why do the earlier ones miss it?
:::

::: answer
PIL. MIL simulates the model, not C, so C's `int` never appears. SIL compiles the code for the PC, whose `int` really is 32 bits, so the code's assumption happens to be true there. Only when the code is cross-compiled and run on the target does a 16-bit `int` meet code that assumed 32 bits, and a sum like $30000 + 10000$ wraps to $-25536$.
:::

::: check
List two things a HIL rig can test that PIL cannot, and say why PIL misses each.
:::

::: answer
Any two of these. Real interface delays: PIL passes data over a test link, not the real bus and drivers, so framing, buffering and conversion times are absent. Deadlines under load: PIL takes turns with the PC and runs no other flight tasks, so it cannot show a missed deadline. Hardware faults: PIL has no real wiring to cut and no supply to sag, while a HIL rig can inject both.
:::

::: check
A delay of 5 ms appears in HIL. The loop's crossover is 10 rad/s. How much phase does it cost, in degrees?
:::

::: answer
A pure delay $\tau$ costs $\omega\tau$ radians at frequency $\omega$: $10 \times 0.005 = 0.05$ rad. In degrees, $0.05 \times 180/\pi \approx 2.9^\circ$. Check that against the loop's margin requirement, and add the delay to the MIL model so the design accounts for it.
:::

## Summary

| Stage | Controller form, where it runs | What it proves | What it cannot prove |
|---|---|---|---|
| MIL | model, on the PC | the design meets the requirements | anything about code or hardware |
| SIL | generated C compiled for the PC | the code matches the model | target arithmetic, timing, interfaces |
| PIL | generated C cross-compiled, on the target chip | the code matches on the real processor; first execution times | real-time behavior, interfaces |
| HIL | the real flight computer, real I/O, simulated plant in real time | the real unit works in real time over real interfaces, including faults | that the plant model matches the real vehicle |
| Equivalence test | same inputs into two versions, outputs compared | a later stage matches an earlier one | that the earlier one was right |

The next lesson builds the tools for running these stages again and again: Simulink Test's harnesses, test sequences and assessments, baseline and equivalence tests, and how to run them headless every time the model changes.

::: context v-model Design down one side, test up the other
Systems engineers often draw development as a V. Down the left arm, the work gets more detailed: vehicle requirements, then software requirements, then the design, then the code. Up the right arm, each level is tested against its partner on the left: the code against the design, the software against its requirements, the whole vehicle against the mission. MIL, SIL, PIL and HIL climb the right arm of that V for the flight software.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polyline points="40,25 180,145 320,25" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <text x="40" y="18" font-size="11" fill="#1f2a44">requirements</text>
  <text x="100" y="82" font-size="11" fill="#1f2a44" text-anchor="end">design</text>
  <text x="180" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">code</text>
  <circle cx="215" cy="115" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="224" y="119" font-size="11" fill="#1f2a44">SIL</text>
  <circle cx="250" cy="85" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="259" y="89" font-size="11" fill="#1f2a44">PIL</text>
  <circle cx="285" cy="55" r="5" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="294" y="59" font-size="11" fill="#1f2a44">HIL</text>
  <circle cx="110" cy="85" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="119" y="89" font-size="11" fill="#1f2a44">MIL</text>
  <text x="320" y="18" font-size="11" fill="#1f2a44" text-anchor="end">system test</text>
</svg>
```

MIL (orange) tests the design on the left arm itself, before any code exists. SIL, PIL and HIL climb the right arm.
:::

::: context back-to-back Two versions, one input
Back-to-back testing is an old idea from safety-critical software: if two versions of a program are supposed to do the same thing, feed both the same inputs and compare. It does not need anyone to know the right answer in advance, which is its great strength. Its weakness is the same fact turned around: if both versions share a mistake, they agree perfectly and the test passes. That is why the model must first be proven against the requirements in MIL before it is trusted as the reference.
:::

::: context cross-compiler A compiler for somebody else's chip
An ordinary compiler turns C into machine code for the processor it runs on. A cross-compiler runs on your PC but writes machine code for a different processor: an ARM Cortex-R in a flight computer, a PowerPC, a TI signal processor. Every processor family has its own instruction set, so the same C line becomes entirely different machine instructions. Cross-compilers also make their own choices where the C standard allows it, such as how wide `int` is, which is exactly the kind of difference PIL exists to catch.
:::

::: context endianness Which end comes first
A 32-bit number takes four bytes in memory. A **big-endian** processor stores the most significant byte first, the way you write the number 1,234 with the thousands first. A **little-endian** processor stores the least significant byte first. The x86 chips in most PCs are little-endian. Many older flight processors, such as PowerPC in its usual configuration, are big-endian. The names come from *Gulliver's Travels*, where two nations went to war over which end of a boiled egg to crack.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="12" fill="#1f2a44">the number 0x0A0B0C0D, in four bytes</text>
  <text x="10" y="55" font-size="11" fill="#1f2a44">big-endian</text>
  <rect x="100" y="40" width="50" height="24" fill="#1d6fd1"/>
  <rect x="150" y="40" width="50" height="24" fill="#8fb8f0"/>
  <rect x="200" y="40" width="50" height="24" fill="#8fb8f0"/>
  <rect x="250" y="40" width="50" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="125" y="57" font-size="12" fill="#ffffff" text-anchor="middle">0A</text>
  <text x="175" y="57" font-size="12" fill="#1f2a44" text-anchor="middle">0B</text>
  <text x="225" y="57" font-size="12" fill="#1f2a44" text-anchor="middle">0C</text>
  <text x="275" y="57" font-size="12" fill="#1f2a44" text-anchor="middle">0D</text>
  <text x="10" y="95" font-size="11" fill="#1f2a44">little-endian</text>
  <rect x="100" y="80" width="50" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="150" y="80" width="50" height="24" fill="#8fb8f0"/>
  <rect x="200" y="80" width="50" height="24" fill="#8fb8f0"/>
  <rect x="250" y="80" width="50" height="24" fill="#1d6fd1"/>
  <text x="125" y="97" font-size="12" fill="#1f2a44" text-anchor="middle">0D</text>
  <text x="175" y="97" font-size="12" fill="#1f2a44" text-anchor="middle">0C</text>
  <text x="225" y="97" font-size="12" fill="#1f2a44" text-anchor="middle">0B</text>
  <text x="275" y="97" font-size="12" fill="#ffffff" text-anchor="middle">0A</text>
  <text x="200" y="116" font-size="11" fill="#6c7a93" text-anchor="middle">lowest address on the left</text>
</svg>
```
:::

::: context patriot A clock error that cost lives
A 32-bit float keeps 24 binary digits of precision, a little more than 7 decimal digits. Between 2048 and 4096, neighboring floats are $2^{-12} \approx 0.000244$ apart, so every addition of 0.001 is rounded by up to about an eighth of itself. The most famous clock-drift failure is real: in the 1991 Gulf War, a Patriot missile battery's clock counted tenths of a second and converted them with a slightly short binary value of 0.1. After 100 hours running, the error had grown to about 0.34 s. On February 25, 1991, the battery at Dhahran failed to intercept an incoming Scud, and 28 US soldiers were killed.
:::

::: context real-time-computer A simulator that keeps pace with the clock
A desktop simulation runs as fast as it can: a 10 s flight might take 2 s or 2 minutes. A real-time computer runs the plant model so that each simulated millisecond takes exactly one real millisecond, and it must never fall behind. It carries input and output cards that produce real voltages and real bus messages. Companies such as Speedgoat, dSPACE and OPAL-RT build these machines, and Simulink models can be compiled to run on them. The last lesson of this module covers them.
:::

::: context data-buses The wires flight computers talk over
A data bus is a shared set of wires that several boxes use to send messages to each other. **CAN** (Controller Area Network) came from cars in the 1980s and is common on small launch vehicles and satellites; it runs at up to 1 Mbit/s in its classic form. **MIL-STD-1553** is a US military standard from 1973, used on aircraft, the International Space Station and many spacecraft; it runs at 1 Mbit/s with 20-bit words, so each word takes 20 µs. Both deliver messages in frames on a schedule, which is where some of the delay in the HIL example comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="3"/>
  <text x="330" y="100" font-size="11" fill="#1f2a44" text-anchor="end">shared bus</text>
  <rect x="30" y="20" width="80" height="34" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">flight computer</text>
  <rect x="140" y="20" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">gyro unit</text>
  <rect x="250" y="20" width="80" height="34" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="290" y="41" font-size="11" fill="#1f2a44" text-anchor="middle">fin actuators</text>
  <line x1="70" y1="54" x2="70" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="54" x2="180" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="290" y1="54" x2="290" y2="80" stroke="#1f2a44" stroke-width="2"/>
</svg>
```
:::

::: context fault-injection Breaking things on purpose
Fault injection means deliberately making something go wrong to check that the software notices and responds. A HIL rig can open a sensor wire with a relay, corrupt or drop a bus message, freeze a gyro's output at its last value, or pull a supply voltage down. Each fault-management requirement ("if the gyro goes silent for 50 ms, switch to the backup") gets a test that causes exactly that fault. These tests are often impossible or dangerous on a real vehicle, which is one of the strongest reasons to build a HIL rig at all.
:::
