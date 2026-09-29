---
id: l06-variants
title: 'Variants: one model, flight and test builds'
minutes: 21
covers:
  - Variant subsystems, variant models and variant source/sink for flight versus test builds
---

Think about a car sold in two versions: one with a gasoline engine, one electric. The factory does not build two different car bodies. It builds one body with the same mounting points, the same wiring plug, the same dashboard. On the line, a worker bolts in either the engine or the battery pack. Nobody drives an electric car with a gasoline engine sitting unused in the trunk.

A spacecraft's software has the same need. On the real vehicle, the navigation code reads angular rates from a real **[[IMU|imu]]** (inertial measurement unit) through a **[[device driver|driver]]**, the piece of code that talks to the hardware. On the test bench, there is no IMU, so the same navigation code must get its rates from a simulated sensor, computed from the simulation's true motion plus some realistic noise. Same slot, same plug, different part.

Simulink's name for "same slot, different part" is a **variant**: one of several interchangeable versions of a piece of a model, of which exactly one is active in a given build. The last lesson split the vehicle into referenced models with checked interfaces. This lesson lets one of those slots hold a flight part or a test part, chosen when you build, without copying the model.

## Build-time choice versus run-time choice

There are two very different kinds of "either this or that" in a model.

A **run-time decision** changes while the vehicle flies. "If the altitude is below 50 m, use the radar altimeter." Both branches must be in the flight code, because the software has to be able to take either one at any moment. An If block, a Switch block, or an `if` inside a MATLAB Function block is the right tool.

A **build-time configuration** is fixed before the code ever runs. "This build is for the flight computer; that one is for the bench." A flight computer never needs the simulated IMU. If the simulated IMU's code is in the flight image anyway, three bad things follow:

- It takes memory on a processor that has little to spare.
- It is **[[dead code|dead-code]]**: code that can never run in flight. Coverage tools report it as never executed, and flight software standards require it to be removed or justified.
- It can run by mistake. One wrong flag, and the flight computer navigates on made-up rates.

A variant is the tool for the second kind. The inactive choice is left out of the build, so it cannot take memory and it cannot run.

::: key
When do you choose a variant subsystem over an if inside a MATLAB Function block? When the difference is a build-time configuration rather than a run-time decision: flight versus test sensors, a stubbed versus a full environment. Variants can compile only the active choice, so the inactive code never reaches the target.
:::

::: example How much bench code reaches the flight computer?
The IMU slot has three versions. The real IMU driver compiles to 14 KB of code. A simulated IMU with a noise model compiles to 9 KB. A fault injector, used on the bench to make the IMU misbehave on purpose, compiles to 6 KB. (KB means kilobytes, thousands of bytes.)

**Step 1: the "if" design.** All three sit behind an `if` in a MATLAB Function block, chosen by a flag. All three compile into every build: $14 + 9 + 6 = 29\,\mathrm{KB}$.

**Step 2: how much of that can run in flight?** Only the driver: 14 KB. The other $9 + 6 = 15\,\mathrm{KB}$ is bench-only. As a fraction of the flight image's IMU code: $15 / 29 \approx 0.52$, so more than half of it can never legitimately run.

**Step 3: the variant design.** The three versions become the choices of a Variant Subsystem. With the flight choice active, only the driver is built: 14 KB. The bench build holds only what the bench needs.

**Sanity check.** $14 + 15 = 29$, so the two parts add back to the whole. The saving, 15 KB, is exactly the code the flight computer could only ever run by mistake. On a flight processor with a few hundred kilobytes of program memory, that is a real share of the budget.
:::

## The Variant Subsystem

A **Variant Subsystem** is a container block. Inside it, instead of ordinary blocks wired together, sit two or more subsystems side by side, not connected to anything. Each one is a **choice**. The container's own Inport and Outport blocks define the slot's interface, and every choice connects to those same ports. In any one build, exactly one choice is **active**: its blocks are wired in, and the others are ignored as if they were not there.

Which one? Each choice carries a **variant control**, a condition that says when it is active. The most common kind is a **variant control expression**, a true-or-false condition written in terms of **[[variant control variables|control-variable]]**: ordinary MATLAB variables that describe the build. For example, with a variable `SENSOR_SRC` that is 1 for flight and 2 for the bench:

| Choice | Variant control expression | Active when |
|---|---|---|
| IMU_Driver | `SENSOR_SRC == 1` | building for flight |
| IMU_Sim | `SENSOR_SRC == 2` | building for the bench |

Read `==` aloud as "is equal to", `&&` as "and", `||` as "or" and `~=` as "is not equal to". These are the operators variant expressions use.

When you update the diagram, Simulink evaluates every choice's expression with the current values of the control variables. The choice whose expression is true becomes active. If none is true, or more than one is, Simulink reports an error, because a slot must hold exactly one part. You can also mark one choice with the special control `(default)`, which makes it active whenever none of the others is.

### Naming the conditions: Simulink.Variant objects

Writing `SENSOR_SRC == 1` on a block works, but the same condition often appears in several places: the IMU slot, the star tracker slot, the telemetry format. A **Simulink.Variant** object gives the condition a name, so each block refers to the name and the condition lives in one place.

```matlab
% The build setting: 1 = flight hardware, 2 = bench simulation
SENSOR_SRC = 1;

% Named conditions, used as variant controls on the choices
FLIGHT = Simulink.Variant('SENSOR_SRC == 1');
BENCH  = Simulink.Variant('SENSOR_SRC == 2');
```

Now the IMU_Driver choice's variant control is `FLIGHT`, and IMU_Sim's is `BENCH`. To make a bench build, set `SENSOR_SRC = 2` and update the diagram. The expression lives in the object's Condition property, so changing what "flight" means is a one-line edit. In a real project these definitions live in a data dictionary (next lesson), not in a script someone must remember to run.

::: warning Two choices true at once is a design error, not bad luck
If one choice says `SENSOR_SRC == 1` and another says `SENSOR_SRC ~= 2`, then setting `SENSOR_SRC = 1` makes both true, and the update fails. Write the conditions so that each value of the control variables makes exactly one of them true. The easiest way is to partition one variable into separate values, as `FLIGHT` and `BENCH` do. You will meet the same rule again, for transitions out of a Stateflow state, later in this module.
:::

::: example Which choice is active?
A Variant Subsystem for the IMU has three choices, controlled by two variables: `SENSOR_SRC` and `FAULT_INJ` (1 to make the simulated IMU misbehave, 0 for a clean one).

| Choice | Variant control expression |
|---|---|
| IMU_Driver | `SENSOR_SRC == 1` |
| IMU_Sim | `SENSOR_SRC == 2 && FAULT_INJ == 0` |
| IMU_Faulty | `SENSOR_SRC == 2 && FAULT_INJ == 1` |

**Case 1: `SENSOR_SRC = 1`, `FAULT_INJ = 0`.** IMU_Driver: `1 == 1`, true. IMU_Sim: `1 == 2` is false, so the whole "and" is false. IMU_Faulty: false for the same reason. Exactly one is true: the flight build uses the real driver.

**Case 2: `SENSOR_SRC = 2`, `FAULT_INJ = 1`.** IMU_Driver: false. IMU_Sim: `2 == 2` is true, but `1 == 0` is false, so false. IMU_Faulty: both parts true, so true. The bench build with fault injection.

**Case 3: `SENSOR_SRC = 1`, `FAULT_INJ = 1`.** IMU_Driver: true. The other two both need `SENSOR_SRC == 2`, so both false. The flight driver is active, and the fault flag has no effect. That is a good property: no setting of the fault flag can put a faulty sensor into a flight build.

**Case 4: `SENSOR_SRC = 3`.** All three are false. Updating the diagram reports that no choice is active. Nobody defined what 3 means, and the tool says so instead of guessing.

**Sanity check.** The legal settings are `SENSOR_SRC` of 1 or 2 with `FAULT_INJ` of 0 or 1: four pairs. Cases 1 to 3 covered three of them, and the fourth, 2 with 0, makes only IMU_Sim true. Each legal pair makes exactly one expression true, so the three conditions partition the legal settings. Case 4 shows why a `(default)` choice is a decision to make on purpose: it would quietly turn an undefined setting into a working build.
:::

## When the choice is made: activation time

A variant's choice has to be made at some point between drawing the model and running the code. The **variant activation time**, a parameter of the Variant Subsystem, says when. The main settings:

| Activation time | When the choice is made | What reaches the generated code |
|---|---|---|
| update diagram | When Simulink updates the diagram, before simulating or generating code | Only the active choice. Inactive choices are not even checked. |
| update diagram analyze all choices | Same moment, but every choice is checked for consistency first | Only the active choice |
| code compile | When the generated C code is compiled | Every choice, each wrapped in a C **[[preprocessor|preprocessor]]** condition |
| startup | When the compiled program starts | Every choice, with the choice made once at startup |

The first setting gives the smallest, simplest code, and it is what the 14 KB in the first example assumed. Its weakness is that an inactive choice can quietly break: if nobody builds the bench configuration for a month, a change to the interface may leave the simulated IMU unable to compile, and nobody finds out until the next bench build. "Analyze all choices" closes that gap by checking every choice on every update.

**code compile** is for teams that want one set of generated C files for every configuration. Simulink generates all the choices and wraps each one in `#if` lines. The C compiler's preprocessor then keeps the active one and throws the others away before compiling. For this, the control variable is a Simulink.Parameter whose storage class makes it a C macro, a named constant the compiler reads; lesson 7 introduces storage classes. Here is a hand-written sketch of the shape of such code, not real generated code:

```c
#include <stdio.h>

#if SENSOR_SRC == 1
static double gyro_x(void) { return 0.010; }          /* flight: read device */
#elif SENSOR_SRC == 2
static double gyro_x(void) { return 0.010 + 0.001; }  /* bench: truth + bias */
#else
#error "SENSOR_SRC must be 1 or 2"
#endif

int main(void)
{
  printf("gyro x = %.3f rad/s\n", gyro_x());
  return 0;
}
/* gcc -std=c99 -DSENSOR_SRC=1 imu.c   prints  gyro x = 0.010 rad/s
   gcc -std=c99 -DSENSOR_SRC=2 imu.c   prints  gyro x = 0.011 rad/s
   gcc -std=c99 -DSENSOR_SRC=3 imu.c   fails:  SENSOR_SRC must be 1 or 2 */
```

The `-D` flag defines the macro on the compiler's command line. Only one `gyro_x` survives into the program either way, so the flight binary still holds only flight code, even though the source files hold both.

**startup** keeps every choice in the program and picks one when it starts. That suits a single test binary that must run in several configurations, but it puts every choice in memory, so it is not the usual choice for a flight build.

::: key
Variant activation time: update diagram (only the active choice is analyzed and generated), update diagram analyze all choices (all checked, only the active one generated), code compile (all choices generated inside #if preprocessor conditions, chosen when the C code is compiled), startup (all choices in the program, chosen when it starts).
:::

## Variant models: the same idea for whole files

A Variant Subsystem swaps subsystems. On a team using model reference, the parts in the slot are often whole models: `IMU_Driver.slx` owned by the avionics engineer and `IMU_Sim.slx` owned by the simulation engineer. The **Variant Model** block handles this. It is a Variant Subsystem whose choices are Model blocks, each naming a different model file, and it works the same way: each choice has a variant control, and the activation time says when the choice is made.

The rule from the last lesson still holds: each referenced model's root ports are its contract. For the two files to swap, their root Inports and Outports must match the slot's interface. That is where the bus objects of lesson 4 help again: if both models take `Bus: TruthBus` in and give `Bus: ImuBus` out, the swap is checked at every update.

## Variant Source and Variant Sink: switching one signal

Sometimes the difference is not a whole component but one signal path. On the bench, the navigation filter's input should come from a recorded flight log; in flight, from the live driver. Wrapping each in its own choice would be heavy for so small a change.

The **[[Variant Source|variant-source]]** block, in the Signal Routing library, has several inputs and one output. Each input carries a variant condition, and the input whose condition is true passes through to the output. It works like a railway switch set before the train leaves. The **Variant Sink** block is the mirror image: one input, several outputs, and the signal goes to the output whose condition is true. On the bench, a Variant Sink might send navigation data to an extra logging block that the flight build does not have.

Simulink also carries the conditions backward and forward along the lines: blocks that only feed an inactive input of a Variant Source, or only hang off an inactive output of a Variant Sink, become inactive too. So the recorded-log reader disappears from the flight build along with its input to the Variant Source, with no extra work.

::: warning A Switch block is not a Variant Source
A Switch block driven by a Constant looks like the same thing, and the diagram even runs the same. It is not. Both inputs are part of the model and are built on every build, and in the code the choice is a test made at run time, unless an optimization happens to remove it. An optimization that might happen is not a way to keep bench code off a flight computer. That is exactly the "if" design of the first example, with bench code in the flight image. Use a Switch for decisions the vehicle makes while flying, and a variant for decisions you make before building.
:::

## Flight and test builds in practice

Put together, a typical GNC model has a handful of variant slots, all driven by one or two control variables:

| Slot | Flight choice | Bench choice |
|---|---|---|
| IMU | Real driver | Simulated IMU from true motion plus noise |
| Star tracker | Real driver | Simulated attitude measurements |
| Thruster commands | Output to valve drivers | Output to the simulated vehicle dynamics |
| Telemetry | Downlink packet | Downlink packet plus extra logging |

The navigation, guidance and control code in the middle is the same in both builds. That is the point. The code that will fly is the code that was tested on the **[[bench|bench]]**; only the edges, where software meets hardware, change. With the Variant Manager tool, a team can save each combination of control-variable values as a named configuration, such as `Flight` and `Bench`, and check that each one builds.

## Check yourself

::: check
For each difference, say whether it should be a variant or a run-time decision, and why: (a) the landing controller uses different gains above and below 1 km altitude; (b) the engineering-model build uses a simulated GPS receiver; (c) the thruster driver writes to either the real valves or a simulated plant.
:::

::: answer
(a) Run-time decision: altitude changes during the flight, so both gain sets must be in the flight code and the choice made each step, for example with a Switch or an If block. (b) Variant: which GPS source a build uses is fixed before the code runs, and the simulated receiver has no business in the flight image. (c) Variant: whether a real vehicle is attached is a property of the build, not something that changes in flight, so only one of the two outputs should be built.
:::

::: check
A Variant Subsystem has choices with controls `MODE == 1` and `MODE == 2`, activation time update diagram, and a MATLAB script sets `MODE = 0` by mistake. What happens? What would change if a third choice had the control `(default)`?
:::

::: answer
Both expressions are false, so no choice is active, and updating the diagram reports an error. With a `(default)` choice, that choice becomes active whenever no other expression is true, so the model would build with the default choice and no error. That is convenient, but it can hide a wrong setting, so a default should be chosen on purpose, usually as the safe or flight choice, never as a catch-all for typos.
:::

::: check
Explain why a team using activation time update diagram might switch to update diagram analyze all choices, even though the generated code is the same.
:::

::: answer
With update diagram, only the active choice is analyzed, so a change that breaks an inactive choice (a renamed bus element, say) goes unnoticed until someone builds that configuration. With analyze all choices, every choice is checked for consistency on every update, so the break is reported at once, by the person who caused it. The generated code still holds only the active choice.
:::

::: check
With activation time code compile, a reviewer opens the generated C files and finds the simulated IMU's code in them. She says bench code has reached the flight software. Is she right?
:::

::: answer
Not necessarily. With code compile, every choice is generated, each wrapped in `#if` conditions on the control macro. When the flight build is compiled with the macro set to the flight value, the preprocessor removes the simulated IMU's code before compiling, so the flight binary holds none of it. The source files hold it; the flight image does not. She is right to check the macro value used for the flight build.
:::

::: check
Why does a Variant Model block make the bus objects at a referenced model's root ports even more important?
:::

::: answer
Its choices are different model files, often owned by different engineers, that must plug into one slot. Each file's root Inports and Outports are its interface. If both files type their ports with the same bus objects, Simulink checks that both fit the slot every time the diagram is updated, so the bench model cannot drift away from the flight model's interface unnoticed.
:::

## Summary

| Idea | Meaning | Remember |
|---|---|---|
| Variant | One of several interchangeable versions of part of a model | Exactly one choice active per build |
| Variant Subsystem | Container whose choices are subsystems | Choices share the container's ports |
| Variant control expression | Condition that makes a choice active | Such as `SENSOR_SRC == 1`; none or two true is an error |
| Variant control variable | Variable describing the build | Flight or bench, fault injection on or off |
| Simulink.Variant | A named condition | `FLIGHT = Simulink.Variant('SENSOR_SRC == 1')` |
| (default) | Choice used when no other is true | Choose it on purpose |
| Activation time | When the choice is made | update diagram, analyze all choices, code compile, startup |
| Variant Model | Variant Subsystem whose choices are Model blocks | Each choice is its own .slx file |
| Variant Source / Variant Sink | Choose one signal path | Conditions spread to the blocks on inactive paths |
| Switch or if | Run-time decision | Both branches built into the code |

The next lesson moves every variable this lesson left in the base workspace, control variables included, into a data dictionary, and meets the Simulink.Parameter and Simulink.Signal objects and the storage classes that decide how they appear in code.

::: context imu What an IMU measures
An inertial measurement unit is a small box of sensors bolted to the vehicle. Three gyroscopes measure how fast the vehicle is rotating about each of its three axes, in radians per second. Three accelerometers measure its acceleration along those axes, apart from gravity. Navigation software adds these measurements up over time to track where the vehicle is pointing and where it is going. Every launch vehicle and nearly every spacecraft carries at least one, and usually more for redundancy.
:::

::: context driver Where software meets hardware
A device driver is the code that knows how to talk to one specific piece of hardware: which wires to use, which bytes to send, how to read the answer, what a fault looks like. The navigation filter above it only wants "the three rates, please". That split is what makes variants possible: the filter asks the same question in both builds, and only the part that answers it changes.
:::

::: context dead-code Code that can never run
Dead code is code in the program that no possible input can reach. Airborne software standards such as DO-178C, used for aircraft and borrowed by many space programs, require every piece of code to trace to a requirement and be exercised by tests. Code that cannot run in flight fails both, so it must be removed or specially justified. Leaving bench code out of the flight build with variants avoids the argument entirely.
:::

::: context control-variable A build's settings menu
Control variables work like the settings menu of a video game before you press Start: difficulty, map, number of players. Once the game starts, those choices are fixed. Here the settings are "which sensors", "fault injection on or off", "flight or bench telemetry". A handful of them, each with a few named values, can describe every build a program makes.
:::

::: context preprocessor The C preprocessor
Before a C compiler reads a source file, a first pass called the preprocessor edits it. Lines beginning with `#` are its instructions. `#include` pastes in another file; `#define` names a constant; `#if`, `#elif` and `#else` keep or delete whole blocks of lines depending on the constants. The compiler proper never sees the deleted lines, so they add nothing to the program.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">source file</text>
  <rect x="10" y="26" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="70" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">flight choice</text>
  <rect x="10" y="62" width="120" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="70" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">bench choice</text>
  <line x1="140" y1="60" x2="200" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="200,55 210,60 200,65" fill="#1f2a44"/>
  <text x="175" y="50" font-size="11" text-anchor="middle" fill="#1f2a44">SENSOR_SRC=1</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">flight binary</text>
  <rect x="220" y="26" width="120" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="280" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">flight choice</text>
  <rect x="220" y="62" width="120" height="30" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="280" y="81" font-size="11" text-anchor="middle" fill="#6c7a93">removed</text>
  <text x="180" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">both in the source, one in the program</text>
</svg>
```
:::

::: context variant-source A railway switch set before departure
A Variant Source is like the points on a railway line, set before the train leaves the station and never moved during the trip. Tracks that lead only to the unused branch are not needed on this trip, which is why Simulink grays out the blocks feeding an inactive input.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="100" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="60" y="39" font-size="11" text-anchor="middle" fill="#1f2a44">live IMU driver</text>
  <rect x="10" y="75" width="100" height="30" rx="4" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="60" y="94" font-size="11" text-anchor="middle" fill="#6c7a93">flight log reader</text>
  <line x1="110" y1="35" x2="170" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="90" x2="170" y2="90" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <rect x="170" y="20" width="60" height="85" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">Variant</text>
  <text x="200" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">Source</text>
  <line x1="178" y1="35" x2="222" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="230" y1="62" x2="270" y2="62" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="270,57 280,62 270,67" fill="#1f2a44"/>
  <text x="315" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">nav</text>
  <text x="315" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">filter</text>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">flight build: the log reader is inactive too</text>
</svg>
```
:::

::: context bench Benches, flatsats and test builds
A test bench is a table in a lab where the vehicle's flight computer, or a copy of it, runs connected to a simulation instead of a real vehicle. Spacecraft teams often lay out a full set of flight electronics on a table and call it a flatsat. A bench build of the software talks to simulated sensors and actuators, so the team can fly thousands of missions before the real one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="40" width="100" height="40" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">same GNC code</text>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">in both builds</text>
  <rect x="10" y="15" width="90" height="30" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="55" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">real IMU</text>
  <rect x="10" y="75" width="90" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="55" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">simulated IMU</text>
  <line x1="100" y1="30" x2="130" y2="52" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="90" x2="130" y2="68" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="15" width="90" height="30" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="305" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">real valves</text>
  <rect x="260" y="75" width="90" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="305" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">simulated plant</text>
  <line x1="230" y1="52" x2="260" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="68" x2="260" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="10" font-size="11" text-anchor="middle" fill="#6c7a93">white: flight</text>
  <text x="305" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">orange: bench</text>
</svg>
```
:::
