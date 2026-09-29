---
id: l02-conditional-subsystems
title: 'Conditional subsystems: enabled, triggered, function-call, If, Switch Case and For Each'
minutes: 26
covers:
  - Enabled, triggered and function-call subsystems; If and Switch Case action subsystems; For Each
---

A house has lights that behave in different ways. The kitchen light stays on as long as the switch is up. The porch light flicks on for one moment each time the motion sensor sees something. The doorbell rings once each time a person presses it. And the hallway uses a three-way switch: exactly one of two lamps is lit, never both.

A launch vehicle's software is full of the same patterns. The landing-burn controller should run only while the engine is lit. A telemetry snapshot should be taken once at each frame pulse. A pyrotechnic separation routine should run exactly when the sequencer calls it. Guidance should use exactly one of several steering laws, depending on the flight phase. And the same valve model should run once for each of nine engines.

The last lesson showed that an atomic subsystem runs as one unit. This lesson meets the atomic subsystems that run *only sometimes*. They are called **conditionally executed subsystems**, or **conditional subsystems**: subsystems whose blocks run only when a control signal or a caller says so. All of them are nonvirtual, which is why they draw a bold border.

## Enabled subsystems: on while the switch is up

An **enabled subsystem** runs on every time step while its control signal is positive, and does nothing while it is zero or negative. You make one by placing an **Enable** block (from the Ports & Subsystems library) inside a subsystem. A new input appears on the top of the box. That is the **enable port**, and the signal wired to it is the **control signal**.

The interesting question is what happens at the edges: when the subsystem switches off, and when it switches back on. Simulink gives you two separate choices.

**States when enabling**, on the Enable block, says what the blocks inside remember when the subsystem turns back on:

- **held**: the states keep the values they had when it switched off, and carry on from there;
- **reset**: the states go back to their initial conditions, as if starting fresh.

**Output when disabled**, on each Outport block inside, says what the subsystem's output shows while it is switched off:

- **held**: the output keeps its last value;
- **reset**: the output goes to the value in the Outport's **Initial output** parameter.

These are independent. You can hold the states and reset the output, or any other combination.

::: key
Enabled subsystem: runs each step while the enable signal is positive. On disable, outputs are held or reset (Outport "Output when disabled", with "Initial output"). On re-enable, states are held or reset (Enable block "States when enabling").
:::

::: example Two burn timers
An engine fires twice: burn 1 from $t = 10\,\mathrm{s}$ to $70\,\mathrm{s}$, then a coast, then burn 2 from $t = 300\,\mathrm{s}$ to $345\,\mathrm{s}$. The engine-on signal (1 when lit, 0 when not) enables a subsystem that integrates the constant 1, so its state grows by one each second it runs: a timer.

**Step 1: states held.** The timer counts $70 - 10 = 60\,\mathrm{s}$ in burn 1, freezes during the coast, then continues from 60. At the end of burn 2 it reads $60 + (345 - 300) = 60 + 45 = 105\,\mathrm{s}$. That is the engine's **[[total firing time|two-timers]]**, which the engine team tracks against its rated life.

**Step 2: states reset.** On re-enable at $t = 300\,\mathrm{s}$ the timer restarts from 0. At $t = 345\,\mathrm{s}$ it reads $45\,\mathrm{s}$. That is the **current burn duration**, which guidance might compare against a planned 46 s burn.

**Step 3: the output during the coast.** With output held, both timers show their last value while disabled: 60 s from $t = 70$ to $300\,\mathrm{s}$. With output reset and an Initial output of 0, they show 0 during the coast.

**Sanity check.** Same blocks, same input; one checkbox-like choice turned a lifetime counter into a per-burn counter. Both are real quantities an engine team wants. The choice is not a detail; it is the requirement.
:::

::: warning A held output can look alive
With output held, a disabled subsystem's output sits at its last value forever. Downstream blocks cannot tell "still computing, value unchanged" from "switched off an hour ago". If a consumer must know, route the enable signal to it as well, or reset the output to a value that plainly means "inactive".
:::

## Triggered subsystems: once per edge

A **triggered subsystem** runs once each time its control signal crosses zero in a chosen direction, and holds its outputs between those moments. You make one with a **Trigger** block inside the subsystem. Its **Trigger type** parameter picks the edge:

- **rising**: the signal goes up from zero or below to above zero;
- **falling**: the signal goes down from above zero to zero or below;
- **either**: both.

Think of a camera shutter. The scene changes continuously, but a photo is taken only when the button goes down, and the photo shows that instant until the next click. A triggered subsystem that passes its input straight to its output is exactly that: a **[[sample-and-hold|sample-hold]]**.

A triggered subsystem runs only at isolated moments, with no regular spacing, so there is no time step inside it for a solver to integrate over. That is why a triggered subsystem cannot contain **[[continuous states|no-continuous]]**, the smoothly integrated states of blocks like Integrator or Transfer Fcn. Blocks inside must use an inherited sample time (-1) or be constant. A Unit Delay inside is fine: it remembers the value from the previous *trigger*, not the previous time step.

::: key
Triggered subsystem: runs once per trigger edge (Trigger type rising, falling or either); outputs are held between triggers; it cannot contain continuous states, and its blocks inherit their timing from the trigger.
:::

::: example Counting edges of a pulse train
A pulse signal is 0 for $0 \le t < 0.25\,\mathrm{s}$, then alternates between 1 and 0 every $0.25\,\mathrm{s}$, so its period is $0.5\,\mathrm{s}$. A triggered subsystem adds 1 to a count each time it runs. How many times does it run between $t = 0$ and $t = 2.9\,\mathrm{s}$, for each trigger type?

**Step 1: list the rising edges.** The signal goes up at $0.25, 0.75, 1.25, 1.75, 2.25, 2.75\,\mathrm{s}$: 6 edges.

**Step 2: list the falling edges.** It goes down at $0.5, 1.0, 1.5, 2.0, 2.5\,\mathrm{s}$. The next one, at $3.0\,\mathrm{s}$, is after the stop time: 5 edges.

**Step 3: either.** $6 + 5 = 11$ runs.

**Sanity check.** Over about six periods, rising and falling should each happen about six times, and "either" about twice that. We got 6, 5 and 11; the missing falling edge is the one just past $2.9\,\mathrm{s}$. The count is the number of runs, not the time elapsed: a triggered counter measures events.
:::

## Function-call subsystems: run when called

Enabled and triggered subsystems watch a signal. A **function-call subsystem** watches nothing. It runs when something *calls* it, exactly like a function in C or Python. Make one by setting the Trigger block's Trigger type to **function-call**. The control input then accepts a **function-call signal**, drawn as a dash-dot line, which can come from:

- a **Function-Call Generator** block, which calls on a fixed period;
- a **Stateflow** chart, which can call a subsystem from inside its logic (the Stateflow lessons later in this module);
- an **[[S-function|s-function]]**, a block written in C that can call subsystems from its code.

The point is **explicit scheduling**. With ordinary blocks, Simulink decides the order through sorting. With function calls, *you* decide: the caller runs subsystem A, then B, then C, in the order it issues the calls, and only when it issues them. That is how flight software works. A **[[scheduler|scheduler]]** calls the navigation filter, then guidance, then control, every cycle, in a fixed order. Function-call subsystems let the model say the same thing out loud, and the next module's code generation turns each one into a C function the flight scheduler can call.

::: key
Function-call subsystem: a Trigger block with Trigger type function-call. It runs each time it is called by a Function-Call Generator, a Stateflow chart, or an S-function, so the caller schedules it explicitly: when, how often, and in what order relative to other calls.
:::

::: warning Do not hide timing in the caller
A function-call subsystem runs at whatever moments its caller chooses, so the subsystem alone does not tell you its rate. A discrete filter inside that assumes 20 ms steps gives wrong answers if the caller fires at 10 ms. Put the expected call rate in the subsystem's name or documentation, and check it in tests.
:::

## If and Switch Case: exactly one branch runs

Now the three-way hallway switch. Some logic has to pick one of several computations. In code you write `if`/`elseif`/`else` or `switch`/`case`. Simulink has the same two, built from blocks.

An **If block** takes one or more inputs, named `u1`, `u2` and so on. You type an **If expression**, such as `u1 > 0`, optional **Elseif expressions**, and choose whether to **Show else condition**. It has one output port for each condition. Each port connects to an **If Action Subsystem**: a subsystem containing an **Action Port** block. Exactly one action subsystem runs on each step, the first whose condition is true, or the else branch.

A **Switch Case block** takes one input, normally an integer such as a flight-mode number. Its **Case conditions** list values, for example `{1, 2, [3 4]}` for "case 1, case 2, case 3 or 4", and **Show default case** adds a branch for everything else. Each output drives a **Switch Case Action Subsystem**. Again, exactly one runs.

An action subsystem that is not chosen does not run at all. Its blocks are not computed and its states do not move. The Action Port block's **States when execution is resumed** option says whether its states are held or reset when it is chosen again, the same idea as the Enable block's setting.

### Merge: one wire out of many branches

Each action subsystem produces its own output, but downstream you want one signal: "the pitch command", not three candidates. The **[[Merge|merge-picture]]** block combines several inputs into one output that always carries the value most recently written by whichever input ran. Since only one action subsystem runs per step, the Merge output is that branch's answer.

Two rules keep Merge honest. Its inputs should come from subsystems that never run on the same step, which If and Switch Case guarantee. And each Outport feeding the Merge must have Output when disabled set to held, since a branch that is not running must not overwrite the one that is. Merge's **Initial output** sets the value before any branch has run.

::: key
If and Switch Case blocks drive action subsystems (each containing an Action Port); exactly one runs per step, like if/elseif/else or switch/case in C. A Merge block combines their outputs into one signal carrying the value of whichever branch last ran.
:::

::: example A pitch command from three steering laws
A launch vehicle's guidance mode is an integer: 1 for vertical rise, 2 for pitch-over, 3 for gravity turn. A Switch Case block on the mode drives three action subsystems, whose outputs go into one Merge:

- case 1: pitch command $90°$ (straight up);
- case 2: pitch command $90° - 0.5\,(t - 10)$ degrees, a slow tip-over that started at $t = 10\,\mathrm{s}$;
- case 3: pitch command equal to the [[flight path angle|flight-path-angle]] $\gamma$ ("gamma"), the angle of the velocity above the horizon.

**Step 1: $t = 8\,\mathrm{s}$, mode 1.** Only case 1 runs. Merge output: $90°$.

**Step 2: $t = 12\,\mathrm{s}$, mode 2.** Only case 2 runs: $90 - 0.5 \times (12 - 10) = 90 - 1 = 89°$. Merge output: $89°$.

**Step 3: $t = 30\,\mathrm{s}$, mode 3, with $\gamma = 75°$.** Only case 3 runs. Merge output: $75°$.

**Sanity check.** The command steps down, $90 \to 89 \to 75$, as a real ascent tips over toward the horizon. At $t = 30\,\mathrm{s}$ the case 2 formula would give $80°$, but case 2 did not run, so that number is never computed: an action subsystem that is not chosen costs no time. In the generated C, this whole structure becomes a real `switch` statement.
:::

::: warning Switch block versus Switch Case block
The plain Switch block from the first module picks one of two *signals*, and in the diagram both input paths are part of the model's ordinary dataflow. The Switch Case block picks which *subsystem runs*. If one branch is expensive, divides by something that can be zero, or has states that must freeze while unused, you want the action-subsystem version, where the unchosen branch does not execute.
:::

## For Each: one design, many copies

A launch vehicle's first stage may have nine engines; a spacecraft may have twelve thrusters or four reaction wheels. Each one needs the same model, with its own state and often its own parameters. Copying the subsystem nine times works until someone fixes a bug in copy three and forgets the other eight.

A **For Each subsystem** runs one algorithm once per element, or per slice, of its input. Put a **For Each** block inside a subsystem. On its **Input Partition** settings, choose which inputs to cut up, along which dimension, and how wide each piece is. A 9-element vector cut into pieces of width 1 gives nine **iterations**, one per engine. The results are joined back together (**concatenated**) into the output, so nine answers come out as one 9-element vector.

Three facts make it the right tool:

- **Each iteration has its own states.** Engine 4's filter memory is separate from engine 5's, as if there were nine copies.
- **Parameters can be partitioned too.** If the subsystem is masked, a mask parameter such as a vector of time constants can be split so each iteration gets its own value.
- **Iterations are independent.** Nothing passes from one iteration to the next. (If you need that, a [[For Iterator subsystem|for-iterator]] is the loop that carries data along.)

In generated code, a For Each subsystem becomes a loop over one body of code, with each iteration's data indexed. One fix to the body fixes every engine.

::: key
For Each subsystem: applies the same algorithm to each element or slice of its inputs (for example per thruster or per engine), with separate states per iteration, optional per-iteration parameters, and outputs concatenated back into one signal.
:::

::: example Four thruster valves
A cold-gas system has four thrusters. Each valve's opening lags its command, modeled as a discrete lag run every $T_s = 5\,\mathrm{ms}$: $y_{k+1} = y_k + \frac{T_s}{\tau}(u_k - y_k)$. Read $\tau$ as "tau", the valve's time constant. Valves 1 and 2 have $\tau = 20\,\mathrm{ms}$, valve 3 has $25\,\mathrm{ms}$, valve 4 is a slower spare with $30\,\mathrm{ms}$. All four are commanded fully open ($u = 1$) from rest ($y_0 = 0$). How open is each after 10 steps ($50\,\mathrm{ms}$)?

**Step 1: the pattern.** Rewrite the update as $1 - y_{k+1} = \left(1 - \frac{T_s}{\tau}\right)(1 - y_k)$. The gap to fully open shrinks by the same factor each step, so after 10 steps $y_{10} = 1 - \left(1 - \frac{T_s}{\tau}\right)^{10}$.

**Step 2: valves 1 and 2.** $T_s/\tau = 5/20 = 0.25$, so $y_{10} = 1 - 0.75^{10} = 1 - 0.0563 = 0.944$.

**Step 3: valve 3.** $5/25 = 0.2$, so $y_{10} = 1 - 0.8^{10} = 1 - 0.107 = 0.893$.

**Step 4: valve 4.** $5/30 \approx 0.167$, so $y_{10} = 1 - (5/6)^{10} = 1 - 0.162 = 0.838$.

The For Each subsystem takes the 4-element command vector and a partitioned 4-element $\tau$ parameter $[0.020, 0.020, 0.025, 0.030]$, and outputs $[0.944, 0.944, 0.893, 0.838]$.

**Sanity check.** The slowest valve is the least open, and valves 1 and 2, with identical settings, give identical answers even though their states are stored separately. A continuous lag would give $1 - e^{-50/20} = 0.918$ for valve 1; the discrete lag is a little faster, as [[forward-Euler|forward-euler]] lags are at this step size.
:::

## Check yourself

::: check
An engine-health monitor should run only while the engine is lit, and its fault counter must restart from zero at every new ignition. Which conditional subsystem, and which settings?
:::

::: answer
An enabled subsystem, with the engine-on signal on the enable port. Set States when enabling to reset, so the fault counter returns to its initial condition (zero) at each ignition. For the output while the engine is off, choose Output when disabled based on what consumers need: reset with an Initial output of 0 makes "engine off" read as "no faults", while held shows the last burn's count.
:::

::: check
A colleague puts a Transfer Fcn block inside a triggered subsystem that fires on each rising edge of a 10 Hz pulse. Simulink refuses. Why, and what could she use instead?
:::

::: answer
A Transfer Fcn has continuous states, and a triggered subsystem cannot contain continuous states: it runs only at isolated trigger moments, so there is no continuous time inside it to integrate over. She could use a discrete equivalent (a Discrete Transfer Fcn with inherited sample time, which then steps once per trigger), or, if the filter must run all the time, move it outside the triggered subsystem.
:::

::: check
What does a function-call subsystem give you that an enabled subsystem driven by a pulse does not?
:::

::: answer
Explicit scheduling. The enabled subsystem runs whenever its signal is positive, at times the sorted order and sample times decide. A function-call subsystem runs exactly when its caller (a Function-Call Generator, a Stateflow chart, or an S-function) calls it, and in the order the caller issues calls, so "navigation, then guidance, then control" is stated in the model and carried into the generated code.
:::

::: check
Three If Action Subsystems feed a Merge. One of their Outports is set to Output when disabled: reset. What goes wrong?
:::

::: answer
Merge carries whichever input was written most recently. A branch whose output resets when it is not running would write its initial value while another branch is the active one, fighting it for the Merge output. Outports feeding a Merge must be held, so that only the branch that actually runs writes a value (Simulink reports this as an error).
:::

::: check
A vehicle has nine engines. Give two reasons to model their actuators with one For Each subsystem instead of nine copied subsystems.
:::

::: answer
Any two of: there is one body to maintain, so a fix reaches all nine engines at once; each iteration still keeps its own states, so nothing is lost; per-engine parameters can be partitioned from one vector; the generated code is one loop over one body rather than nine copies, which is smaller and easier to review; and adding a tenth engine means widening the input, not copying blocks.
:::

## Summary

| Subsystem | Runs when | Settings to know |
|---|---|---|
| Enabled | Every step while the control signal is positive | States when enabling: held/reset; Output when disabled: held/reset, Initial output |
| Triggered | Once per edge | Trigger type: rising, falling, either; no continuous states; outputs held |
| Function-call | When called | Callers: Function-Call Generator, Stateflow chart, S-function; explicit scheduling |
| If / Switch Case action | Its condition or case is chosen | Exactly one branch per step; Action Port states held/reset |
| Merge (block) | Combines branch outputs | Output = most recently written input; feeding Outports held |
| For Each | Once per element or slice | Input partition, parameter partition, separate states, concatenated output |

The next lesson turns to making components that other people can use without opening them: masks that give a subsystem its own dialog, icon and help, libraries that keep one master copy of each block, and Projects that keep the whole set of files in order under Git.

::: context two-timers One integrator, two clocks
Held states make a clock like a car's odometer: it remembers every mile, across every trip. Reset states make a trip meter that you zero at the start of each drive. Rocket engines are tested and rated for a total firing time and a number of starts, so a team flying reusable engines keeps the odometer. Guidance cares about the trip meter: how long this burn has lasted.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="345" y2="120" stroke="#1f2a44"/>
  <line x1="40" y1="120" x2="40" y2="15" stroke="#1f2a44"/>
  <rect x="48" y="120" width="50" height="8" fill="#f2b880"/>
  <rect x="290" y="120" width="38" height="8" fill="#f2b880"/>
  <text x="73" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">burn 1</text>
  <text x="309" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">burn 2</text>
  <text x="194" y="145" font-size="11" text-anchor="middle" fill="#6c7a93">coast</text>
  <path d="M40,120 L48,120 L98,65 L290,65 L328,25 L345,25" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M290,65 L290,120 L328,79 L345,79" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="34" y="69" font-size="11" text-anchor="end" fill="#1f2a44">60</text>
  <text x="34" y="29" font-size="11" text-anchor="end" fill="#1f2a44">105</text>
  <text x="34" y="83" font-size="11" text-anchor="end" fill="#1f2a44">45</text>
  <text x="200" y="58" font-size="11" text-anchor="middle" fill="#1d6fd1">states held: 60, then 105 s</text>
  <text x="220" y="100" font-size="11" text-anchor="middle" fill="#b4232c">states reset: 45 s</text>
</svg>
```
:::

::: context sample-hold A photo of a signal
Sample-and-hold is the oldest trick in digital electronics. An analog-to-digital converter needs its input to stand still while it measures, so a circuit grabs the voltage at one instant and holds it. A triggered pass-through subsystem does the same to a signal in a model.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44"/>
  <text x="335" y="138" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <path d="M30,110 Q110,20 190,60 T340,40" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <path d="M90,120 L90,62 L170,62 L170,56 L250,56 L250,58 L330,58" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="90" y1="120" x2="90" y2="128" stroke="#1f2a44"/>
  <line x1="170" y1="120" x2="170" y2="128" stroke="#1f2a44"/>
  <line x1="250" y1="120" x2="250" y2="128" stroke="#1f2a44"/>
  <text x="170" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">trigger edges</text>
  <text x="40" y="30" font-size="11" fill="#1d6fd1">input</text>
  <text x="260" y="80" font-size="11" fill="#b4232c">held output</text>
</svg>
```
:::

::: context no-continuous Why an integrator needs a steady clock
An Integrator builds its state by adding up its input, slice after slice of time. The solver has to visit it on every step, and a variable-step solver also checks the slope between steps, to keep that sum honest. A triggered subsystem is visited only at its trigger moments, which may be seconds apart and unevenly spaced. Between visits nobody looks at the slope, so the "integral" would mean nothing. A Unit Delay only needs "the value from my last run", which a trigger supplies. An enabled subsystem, by contrast, may hold continuous states, because while enabled it runs on every step.
:::

::: context s-function The block you write yourself
S-function is short for "system function". It is a block whose behavior comes from code you write, most often in C or C++, following a set of routines Simulink calls at fixed moments: set up sizes, compute outputs (the routine named `mdlOutputs` in C), update states, and so on. Teams use S-functions to bring existing flight C code into a model. The code-generation module comes back to them with the Legacy Code Tool, which writes the S-function wrapper around an existing C function for you.
:::

::: context scheduler The flight software's conductor
A flight computer does not run "everything at once". A small piece of code, the scheduler, wakes up on a timer interrupt and calls each task in a fixed order: read sensors, run navigation, guidance, control, write actuator commands. Rate groups run some tasks every cycle and others every fifth cycle. Function-call subsystems let a Simulink model state that order explicitly, and export-function models, which appear in the code-generation module, hand each one to the real scheduler as a C function.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="70" height="30" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="59" font-size="11" text-anchor="middle" fill="#1f2a44">scheduler</text>
  <rect x="110" y="40" width="70" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="145" y="59" font-size="11" text-anchor="middle" fill="#1f2a44">1 nav</text>
  <rect x="195" y="40" width="70" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="230" y="59" font-size="11" text-anchor="middle" fill="#1f2a44">2 guidance</text>
  <rect x="280" y="40" width="70" height="30" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="315" y="59" font-size="11" text-anchor="middle" fill="#1f2a44">3 control</text>
  <line x1="80" y1="55" x2="106" y2="55" stroke="#1f2a44" stroke-dasharray="6,3,1,3"/>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">called in this order, every 20 ms</text>
</svg>
```
:::

::: context merge-picture One wire from three branches
The Switch Case block sends a "run now" to exactly one action subsystem each step. That branch writes its answer into the Merge; the other two stay silent, holding their outputs, so the Merge output is always the branch that ran. In C it is the same shape as a `switch` statement where every case assigns the same variable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="70" height="50" rx="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="67" font-size="11" text-anchor="middle" fill="#1f2a44">Switch</text>
  <text x="45" y="81" font-size="11" text-anchor="middle" fill="#1f2a44">Case</text>
  <rect x="130" y="15" width="80" height="28" fill="#fff" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="170" y="33" font-size="11" text-anchor="middle" fill="#1f2a44">case 1</text>
  <rect x="130" y="56" width="80" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="170" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">case 2 runs</text>
  <rect x="130" y="97" width="80" height="28" fill="#fff" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="170" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">case 3</text>
  <line x1="80" y1="55" x2="130" y2="29" stroke="#6c7a93" stroke-dasharray="6,3,1,3"/>
  <line x1="80" y1="70" x2="130" y2="70" stroke="#b4232c" stroke-width="2" stroke-dasharray="6,3,1,3"/>
  <line x1="80" y1="85" x2="130" y2="111" stroke="#6c7a93" stroke-dasharray="6,3,1,3"/>
  <rect x="260" y="40" width="50" height="60" rx="4" fill="#fff" stroke="#1f2a44"/>
  <text x="285" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">Merge</text>
  <line x1="210" y1="29" x2="260" y2="55" stroke="#6c7a93"/>
  <line x1="210" y1="70" x2="260" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="210" y1="111" x2="260" y2="85" stroke="#6c7a93"/>
  <line x1="310" y1="70" x2="350" y2="70" stroke="#b4232c" stroke-width="2"/>
  <text x="185" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">only the chosen branch writes the output</text>
</svg>
```
:::

::: context flight-path-angle Where the velocity points
The flight path angle is the angle between the vehicle's velocity and the local horizon: $90°$ when climbing straight up, $0°$ when flying level. In a gravity turn the vehicle keeps its nose pointed along its velocity, so the air hits it head-on and the sideways aerodynamic load stays small, while gravity slowly bends the path toward the horizon. Setting the pitch command equal to $\gamma$ is exactly "point where you are going".
:::

::: context for-iterator The loop that remembers
A For Iterator subsystem runs its contents several times inside one time step, like a `for` loop. It can output the iteration number, and a value computed on one pass can feed the next pass, so it can add up a sum or run a fixed number of refinement steps of an equation solver. A For Each subsystem cannot do that: its iterations are separate copies that never see each other. That independence is what lets For Each give every element its own states.
:::

::: context forward-euler Why the model runs slightly ahead
The update rule takes the slope at the start of a step and walks along it for the whole step: that is forward Euler, the simplest integration rule. The exact lag would shrink the gap by $e^{-T_s/\tau}$ each step, which is $e^{-0.25} \approx 0.779$ for valve 1. Forward Euler uses $1 - T_s/\tau = 0.75$, a bit smaller, so the gap closes a bit faster. Push $T_s/\tau$ above 1 and the factor turns negative: the valve would overshoot and ring. Above 2 it blows up, the stability limit from the solvers module.
:::
