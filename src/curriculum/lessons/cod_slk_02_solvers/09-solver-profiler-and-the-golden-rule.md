---
id: l09-solver-profiler-and-the-golden-rule
title: The Solver Profiler and the golden rule for flight models
minutes: 19
covers:
  - The Solver Profiler
  - 'The golden rule for deployable models: fixed-step, cleanly multirate, no algebraic loops'
---

When a car starts making a strange noise, "the car is slow and noisy" is not much help to a mechanic. What helps is a recording: at what speed the noise starts, whether it comes when you brake or when you turn, which wheel it comes from. A good mechanic plugs a scanner into the car, reads which sensor complained and when, and goes straight to the part.

Simulink has a scanner like that for its solvers. When a model that used to take ten seconds suddenly takes twenty minutes, or stalls at the same simulated time on every run, the **Solver Profiler** records what the solver did at every step and points at the block or state responsible. This lesson shows what it records and how to read it, using the problems from the earlier lessons: stiffness (lesson 3), zero crossings (lesson 5) and algebraic loops (lesson 8).

Then it pulls the whole module together into one rule. Every lesson so far has had a "but on the flight computer…" moment. The **golden rule** lists them in one place: what a model must look like before it can become flight code, and why each part of the rule is there.

## What the Solver Profiler records

The Solver Profiler runs your simulation for you, from a start time to a stop time you choose, and watches the solver the whole way. It opens from the Simulink toolstrip, and it can also be run from the MATLAB command line with the function `solverprofiler.profileModel`. When the run ends, it shows a picture and a set of counts and tables.

The picture is a **[[step-size plot|step-size-plot]]**: the size of each step the solver took, against simulated time, usually on a logarithmic scale so that a step of $10^{-6}$ s and a step of 1 s both fit. On a healthy variable-step model the line rises when nothing is happening and dips at events and maneuvers. Trouble has a shape, and you learn to recognize it.

On top of the plot, and counted in tables, the profiler marks the events that cost the solver work:

- **Zero-crossing events.** Each time the solver located a zero crossing, and which block's signal crossed. A block with thousands of crossings in a short time is chattering, as in lesson 5.
- **Solver resets.** Each time the solver had to throw away its history and restart, and what caused it: a zero crossing, a discrete signal changing a continuous part, or a block resetting a state.
- **Solver exceptions.** Each time a step failed. The most common kind is a **[[rejected step|rejected-step]]**: the error estimate exceeded the tolerance, so the step was thrown away and retried smaller. Implicit solvers can also fail when their Newton iteration does not converge.
- **Jacobian updates.** For implicit solvers such as `ode15s`, each time the solver rebuilt its **[[Jacobian|jacobian]]**, the table of how every state's rate depends on every other state. Frequent updates mean the implicit solver is working hard to keep its Newton iteration converging.

It also gives summary statistics: the number of steps, the average and largest step size, and the counts of each kind of event. And when you ask it to record the states, it can say which states caused the most rejected steps, which is usually the most useful single line in the whole report.

::: key
What does the Solver Profiler tell you? Where steps were rejected, which zero crossings fired, which states drove the step size and where the solver reset. It converts a vague model-is-slow complaint into a specific block.
:::

### Reading the shapes

A few shapes cover most slow models.

| What the profiler shows | What it usually means | Where to look |
|---|---|---|
| Step size pinned flat at a tiny value, many rejected steps from one state | Stiffness: a fast, stable mode limits an explicit solver | Lesson 3: implicit solver, or remove the fast mode |
| Step size collapsing at one time, zero crossings piling up on one block | Chattering | Lesson 5: hysteresis or a deadband |
| Resets at a regular beat | A discrete signal feeding a continuous part | Normal in a hybrid model, but each reset costs work |
| Many Newton failures and Jacobian updates | Implicit solver struggling, often a discontinuity or an algebraic loop | Lesson 8, and the blocks at that time |
| Step size capped exactly at one value, nothing rejected | The max step size setting is the limit | Lesson 2: is the cap needed? |

::: example A model that got 260 times slower
A pitch-attitude model has a closed loop with natural frequency $2\,\mathrm{rad/s}$ and damping ratio 0.7. It is simulated for 10 s with a variable-step Dormand–Prince solver (the method inside `ode45`), relative tolerance $10^{-3}$. Then a colleague adds an actuator model: a first-order lag with a time constant of 0.5 ms, so its eigenvalue is $-1/0.0005 = -2000\,\mathrm{rad/s}$. The numbers below were computed in Python with `solve_ivp`, which uses the same method.

**Before the actuator.** 23 steps, 170 derivative evaluations, average step 0.43 s.

**After the actuator.** 6039 steps, 42,164 derivative evaluations, and 988 rejected steps. The average step is 1.66 ms.

**Step 1: what the profiler's plot would show.** After the first instant the step size rises to about 1.66 ms and stays pinned there for the whole run, flat as a table, even after the pitch response has settled and nothing is changing. The steps grew $6039 / 23 \approx 263$ times.

**Step 2: which state.** The rejected steps are charged to the actuator's state. The flat ceiling sits where an explicit method's stability runs out: for Dormand–Prince that is roughly $h \times |\lambda| \approx 3.3$, and $3.3 / 2000 = 1.65\,\mathrm{ms}$, a match. This is stiffness: the actuator's mode died out long ago, but it still sets the step.

**Step 3: the fix, and the check.** Run the same model with an implicit solver (Python's `BDF`, the same family as `ode15s`): 109 steps and 238 evaluations. Or ask whether a 0.5 ms actuator matters to a 2 rad/s loop at all; if not, remove it.

**Sanity check.** A flat step size that does not grow when the model is quiet is the fingerprint of stability, not accuracy. An accuracy limit relaxes when nothing is happening; a stability limit never does.
:::

::: warning The profiler watches the run you gave it
The profiler only sees what happened in the run you profiled. A model that stalls only when a thruster fires will look healthy if the profiled run never fires it. Profile the scenario that is slow, over the time span where it is slow, and keep the stop time short enough that the recording stays manageable.
:::

## The golden rule

Now step back from the desktop. A GNC model has two lives. On the desktop it is a simulation, and everything in this module so far helps it run fast and give accurate answers. But the controller part of it will also become **[[flight code|flight-code]]**: C code, generated from the model by a tool such as Embedded Coder, running on a flight computer against a clock. That second life brings a strict rule.

::: key
The golden rule for a model destined for flight code: fixed-step, discrete, single-rate or cleanly multirate through rate transitions, with no algebraic loops and no continuous states left in the deployed path. Anything else either will not generate code or will not meet a timing budget.
:::

Each part of the rule comes from one lesson of this module.

### Fixed-step, never variable-step

Lesson 1 met this first. A variable-step solver chooses how many steps to take from what the signals are doing. Its accept-and-reject loop repeats until the error is small enough, and how often it repeats depends on the data.

::: key
Why can a variable-step model not be deployed to an embedded target? Because the number of steps and hence the execution time depends on the data, so no worst-case timing bound exists. Real-time execution needs a constant per-cycle budget, which is what fixed-step gives.
:::

The pitch model above shows why this matters. Adding one fast state multiplied the work by about 260. On a desktop that means waiting longer. On a flight computer with a 10 ms frame it means missing hundreds of [[deadlines|deadline]] in a row. A fixed-step solver would do exactly the same work in every frame, whatever the vehicle was doing, and that sameness is the property a flight computer is scheduled around. That is why the code generators for embedded targets require a fixed-step solver.

### Discrete, with no continuous states in the deployed path

Fixed-step is necessary, but not enough. A fixed-step model can still contain Integrators and continuous Transfer Fcn blocks, integrated by `ode4` or similar. Flight teams go further: the controller is [[written in discrete time|discrete-design]] from the start, with Discrete Transfer Fcn blocks, Unit Delays and discrete integrators. The model then runs on the fixed-step solver called `discrete`, which has no continuous states to integrate at all.

Discrete blocks say exactly what the code will compute, sample by sample. A continuous controller integrated by a solver adds a second approximation, the solver's, on top of the design, and its behavior changes if someone changes the step or the solver. The continuous parts, such as the vehicle's dynamics, the atmosphere and the sensors, stay in the **[[test harness|test-harness]]** around the controller. They are simulated on the desktop and are never turned into flight code.

### Cleanly multirate

Lesson 7 showed what goes wrong at a seam between rates: torn values and data of changing age. "Cleanly multirate" means every slower period is an integer multiple of the faster ones, every seam has a Rate Transition block, and each Rate Transition's options were chosen on purpose, with the delay it adds counted in the loop's margin. On the target, each rate becomes a [[task|task]], and the rates must fit the processor together.

### No algebraic loops

Lesson 8 showed that an algebraic loop is an equation solved by iteration at every step, with a data-dependent number of iterations and a chance of not converging. That is a variable-step solver's problem again, hidden inside one block. Every loop in the deployed path must be broken, by restructuring or with a Unit Delay whose phase cost has been checked. An Algebraic Constraint block does not count as broken.

::: example Auditing a model before code generation
A student's attitude-control model arrives for review with these settings:

- Solver: `ode45`, variable-step.
- Controller: a continuous PID with a derivative filter.
- Rates: sensor processing at 1 ms, control at 10 ms, guidance at 25 ms.
- Diagnostics report one algebraic loop, through a lead filter and a sensor gain.

**Step 1: solver.** Variable-step fails the rule. Change to fixed-step.

**Step 2: controller.** Continuous PID in the deployed path fails. Replace it with a discrete PID at the 10 ms rate. With no continuous states left in the controller, the solver can be `discrete`, with a 1 ms base step.

**Step 3: rates.** $10 / 1 = 10$ is a whole number, but $25 / 10 = 2.5$ is not. Change guidance to 50 ms ($50/10 = 5$) or 20 ms ($20/10 = 2$), and put Rate Transition blocks on every seam.

**Step 4: the loop.** Break it. If no honest state can be added, insert a Unit Delay at 10 ms. With a crossover of 3 rad/s, it costs $3 \times 0.01 = 0.03\,\mathrm{rad} = 1.7^\circ$ of margin, which must be checked against the requirement.

**Step 5: the timing budget.** The flight computer measures worst-case times of 0.3 ms for the 1 ms task, 2 ms for the 10 ms task and 15 ms for the 50 ms guidance task. The fraction of the processor they use together, the **[[utilization|utilization]]**, is the sum of each time divided by its period:

$$
U = \frac{0.3}{1} + \frac{2}{10} + \frac{15}{50} = 0.30 + 0.20 + 0.30 = 0.80.
$$

**Sanity check.** 80% is below 100%, so the work fits on average. It is slightly above the classic guarantee for three rate-monotonic tasks, about 78%, so the schedule must be checked in detail rather than assumed. Moving guidance to 100 ms would give $0.30 + 0.20 + 0.15 = 0.65$, comfortably below both.
:::

::: warning "It generates code" is not the same as "it meets the rule"
Some violations are caught at build time: a variable-step solver will not pass an embedded code generator. Others are not. A Unit Delay added to break a loop generates code happily, and nothing warns you that it ate a third of your phase margin. A Rate Transition with determinism switched off generates code too. The rule is about how the code behaves in flight, so each point has to be checked by the engineer, not only by the build.
:::

The code-generation module later in this track, where Embedded Coder turns these models into C, starts from exactly this rule and adds the target-specific settings on top.

## Check yourself

::: check
The Solver Profiler shows a variable-step model's step size collapsing to about $10^{-10}$ s at $t = 4.2$ s, with tens of thousands of zero crossings on a Relay block at that time. What is happening, and what fix would you try first?
:::

::: answer
The relay's input sits right at its switching point and keeps crossing back and forth, so the solver keeps shortening the step to land on each crossing: zero-crossing chattering (lesson 5). The real fix is in the model: give the relay a hysteresis band (separate on and off switch points) or add a small deadband, so tiny wiggles around the switching point stop causing crossings. Raising the consecutive-crossing limit or changing the zero-crossing algorithm only works around it.
:::

::: check
A profiled run shows no rejected steps and no zero crossings, but the step size is flat at exactly 1 ms for the whole run. What is limiting the solver, and how would you find out whether that is a problem?
:::

::: answer
A perfectly flat step with nothing rejected means neither accuracy nor stability is pushing the step down; the solver's maximum step size setting is holding it there (lesson 2). Check why the cap was set. If it was set to catch something fast, such as a short pulse, it is doing its job. If not, raise it or set it back to automatic and compare the answers.
:::

::: check
Give the two reasons, one about timing and one about tools, that a variable-step model cannot be run as flight code.
:::

::: answer
Timing: a variable-step solver takes a data-dependent number of steps, with rejected steps repeated, so the work in any one frame has no worst-case bound. A flight computer is scheduled around a fixed per-frame budget, and a model whose worst case cannot be stated cannot be shown to meet it. Tools: the code generators for embedded targets require a fixed-step solver, so the model would not build.
:::

::: check
A model is fixed-step, uses `ode4` at 1 ms, runs a single rate and has no algebraic loops. Its controller is a continuous Transfer Fcn block. Does it meet the golden rule? What would you change?
:::

::: answer
Not quite. It is fixed-step, single-rate and loop-free, but it has continuous states in the deployed path: the controller's Transfer Fcn is integrated by `ode4`. Replace it with a discrete equivalent at the controller's sample time (a Discrete Transfer Fcn, for example), keep the continuous plant in the test harness, and the controller can run on the `discrete` solver.
:::

::: check
Three tasks have periods 2 ms, 10 ms and 40 ms and worst-case times 0.5 ms, 3 ms and 8 ms. What is the utilization, and what does it tell you?
:::

::: answer
$U = 0.5/2 + 3/10 + 8/40 = 0.25 + 0.30 + 0.20 = 0.75$. The tasks use 75% of the processor. That is under 100%, and also under the three-task rate-monotonic guarantee of about 78%, so with fastest-first priorities every deadline is met. The periods are integer multiples of each other too ($10/2 = 5$, $40/10 = 4$), so the transfers between them can be made deterministic.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Solver Profiler | Records what the solver did during a run | Step-size plot plus zero crossings, resets, exceptions, Jacobian updates |
| Flat, tiny step size with rejections | Stability limit | Stiffness; try an implicit solver |
| Collapsing step, crossings on one block | Chattering | Hysteresis or deadband |
| Fixed-step | Same work every frame | Required for deployment; variable-step has no worst-case bound |
| Discrete, no continuous states | Controller written in discrete time | Plant stays in the test harness |
| Cleanly multirate | Integer-multiple periods, Rate Transitions at every seam | Delays counted in the margins |
| No algebraic loops | No iteration inside a step | Break with a state or a checked Unit Delay |
| Utilization | $U = \sum C_i / T_i$ | Must fit the processor with margin |

This lesson closes the module. The next module, Simulink Architecture and Stateflow, starts with how models are organized: virtual and atomic subsystems, the execution order they impose, and what each choice means for the code a golden-rule model will generate.

::: context step-size-plot The story a step-size plot tells
Each dot on the plot is one accepted step. The height is its size, on a log scale, and the position is when in simulated time it happened. Where the model is calm, the dots climb; at an event they drop sharply and climb back. A stiff model draws a flat, low shelf that never climbs. A chattering model draws a cliff that falls and keeps falling at one moment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="192" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">simulated time</text>
  <text x="34" y="24" font-size="11" fill="#1f2a44" text-anchor="end">big</text>
  <text x="34" y="138" font-size="11" fill="#1f2a44" text-anchor="end">tiny</text>
  <polyline points="45,80 70,60 95,45 120,35 140,90 150,70 170,50 195,38 220,32" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="140" y="104" font-size="11" fill="#1d6fd1" text-anchor="middle">event</text>
  <line x1="45" y1="120" x2="220" y2="120" stroke="#b4232c" stroke-width="2"/>
  <text x="225" y="124" font-size="11" fill="#b4232c">stiff: flat shelf</text>
  <text x="225" y="36" font-size="11" fill="#1d6fd1">healthy: climbs</text>
</svg>
```

The blue line climbs when nothing is happening and dips at an event. The red shelf is the stiff model from the example: low and flat, even when the model is quiet.
:::

::: context rejected-step A step thrown away
A variable-step solver takes a trial step and then checks its error estimate against the tolerance. If the error is too big, the trial is discarded and the state is not changed; the solver tries again with a smaller step. That discarded trial is a rejected step. The derivative evaluations it used are lost work. A few rejections are normal, since the solver is always probing for the largest step it can get away with. Hundreds charged to one state mean that state is fighting the solver.
:::

::: context jacobian A table of how states push on each other
For a model with states $x_1, x_2, \ldots$, the Jacobian is a square table whose entry in row $i$, column $j$ says how much the rate of change of $x_i$ changes when $x_j$ is nudged. Implicit solvers need it for Newton's method. Building it takes one model evaluation per state or more, so a solver that rebuilds it often, because the model's behavior keeps changing under it, slows down a lot. For a linear model the Jacobian is the constant matrix $A$ of $\dot{x} = Ax + Bu$, and it never needs rebuilding.
:::

::: context flight-code What the generator actually writes
Embedded Coder turns a model into a handful of plain C functions. For a model named `pitch_ctrl` the heart of it is `pitch_ctrl_step()`, which computes one sample of every block, plus `pitch_ctrl_initialize()`, which sets the states to their starting values. Nothing inside the generated code knows about time. A timer interrupt, or the flight software's scheduler, calls the step function once per base period, and each call must finish before the next tick. That is why everything in the golden rule is about making one call to the step function do the same bounded amount of work every time. The next Simulink modules build this up piece by piece.
:::

::: context deadline Late is the same as wrong
A **deadline** is the moment a piece of work must be finished. For a 10 ms control task, this frame's actuator command must be out before the next frame starts. An answer that arrives late is not a slightly worse answer: the actuator either gets nothing new or gets it at the wrong time, and the loop sees an extra delay it was never designed for.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="40" y2="118" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="110" y1="30" x2="110" y2="118" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="180" y1="30" x2="180" y2="118" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="250" y1="30" x2="250" y2="118" stroke="#b4232c" stroke-width="2"/>
  <line x1="320" y1="30" x2="320" y2="118" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="180" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">frame ticks, every 10 ms</text>
  <text x="36" y="56" font-size="11" fill="#1f2a44" text-anchor="end">fixed</text>
  <rect x="40" y="45" width="20" height="16" fill="#1d6fd1"/>
  <rect x="110" y="45" width="20" height="16" fill="#1d6fd1"/>
  <rect x="180" y="45" width="20" height="16" fill="#1d6fd1"/>
  <rect x="250" y="45" width="20" height="16" fill="#1d6fd1"/>
  <text x="36" y="98" font-size="11" fill="#1f2a44" text-anchor="end">variable</text>
  <rect x="40" y="87" width="14" height="16" fill="#f2b880"/>
  <rect x="110" y="87" width="30" height="16" fill="#f2b880"/>
  <rect x="180" y="87" width="100" height="16" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="136" font-size="11" fill="#b4232c" text-anchor="middle">missed deadline</text>
</svg>
```

Top row: fixed-step work, the same every frame. Bottom row: variable-step work grows with what the vehicle is doing, until one frame runs past the next tick.
:::

::: context discrete-design From a paper design to a difference equation
Control engineers often design on paper in continuous time, with transfer functions in $s$. To fly it, the design is converted to a **difference equation**: a rule that computes this sample's output from this sample's input and a few remembered values. A discrete integrator, for example, can be $x_{k+1} = x_k + T_s e_k$, read "x at step k plus one equals x at step k plus T sub s times e at step k". In MATLAB the conversion is one call, `c2d`, with a method such as `'tustin'`. After that, the model and the C code do the same arithmetic in the same order, sample by sample.
:::

::: context test-harness The world around the controller
A test harness is a model built around the component under test, supplying its inputs and checking its outputs. For a flight controller, the harness holds everything the real world will later provide: the rigid-body dynamics, the engines, the atmosphere, the sensors with their noise. Those parts are continuous, and on the desktop they run on whatever solver suits them. Only the controller inside is generated as flight code. Later in the track, the same harness is reused as the controller moves from model, to generated code on a PC, to the real processor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="130" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="5 3"/>
  <text x="20" y="28" font-size="11" fill="#6c7a93">test harness (continuous, desktop only)</text>
  <rect x="40" y="50" width="110" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="95" y="72" font-size="12" fill="#1f2a44" text-anchor="middle">vehicle and</text>
  <text x="95" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">sensors</text>
  <rect x="210" y="50" width="110" height="50" fill="#f2b880" stroke="#1f2a44"/>
  <text x="265" y="72" font-size="12" fill="#1f2a44" text-anchor="middle">controller</text>
  <text x="265" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">(discrete)</text>
  <line x1="150" y1="65" x2="202" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="202,60 202,70 210,65" fill="#1f2a44"/>
  <line x1="210" y1="88" x2="158" y2="88" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="158,83 158,93 150,88" fill="#1f2a44"/>
  <text x="265" y="124" font-size="11" fill="#b4232c" text-anchor="middle">becomes flight code</text>
</svg>
```
:::

::: context task One rate, one task
On a flight computer, each sample rate usually runs as its own **task**: a piece of work the real-time operating system starts every period. The fastest task gets the highest priority, so when its tick comes it interrupts, or **preempts**, the slower one, runs, and hands the processor back. With a 1 ms task that needs 0.3 ms and a 10 ms task that needs 2 ms, the slow task's work gets done in the gaps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="34" y="44" font-size="11" fill="#1f2a44" text-anchor="end">1 ms</text>
  <text x="34" y="80" font-size="11" fill="#1f2a44" text-anchor="end">10 ms</text>
  <rect x="40" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="70" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="100" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="130" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="160" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="190" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="220" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="250" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="280" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="310" y="32" width="9" height="16" fill="#1d6fd1"/>
  <rect x="49" y="68" width="21" height="16" fill="#f2b880"/>
  <rect x="79" y="68" width="21" height="16" fill="#f2b880"/>
  <rect x="109" y="68" width="18" height="16" fill="#f2b880"/>
  <line x1="40" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="190" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">5 ms</text>
  <text x="340" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">10 ms</text>
</svg>
```

Blue: the 1 ms task, 0.3 ms every millisecond. Orange: the 10 ms task's 2 ms of work, split into pieces of 0.7, 0.7 and 0.6 ms between the blue ones, finished well before its 10 ms deadline.
:::

::: context utilization How full the processor is
Utilization is the share of the processor's time a set of periodic tasks needs: each task's worst-case execution time divided by its period, added up. Above 1 the work cannot fit, whatever the schedule. Below 1 it might. In 1973, Liu and Layland proved that with fastest-first (rate-monotonic) priorities, $n$ tasks always meet every deadline if $U \le n(2^{1/n} - 1)$. For three tasks that is $3(2^{1/3} - 1) = 0.780$; for many tasks it approaches $\ln 2 \approx 0.693$. When the rates are integer multiples of each other, as the golden rule asks, rate-monotonic scheduling can in fact use the processor all the way to 100%.
:::
