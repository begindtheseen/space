---
id: l02-signals-and-basic-blocks
title: Signals, lines and the five blocks in every model
minutes: 23
covers:
  - 'Signals and lines; Constant, Gain, Sum, Product, Integrator'
---

Think about the water pipes in a house. Water enters at the street, runs through pipes, splits at a T-joint to feed the kitchen and the bathroom, passes through a heater that changes it, and comes out of a tap. Nobody has to tell the water where to go at each moment. The pipes decide.

A Simulink model works the same way, except that numbers flow instead of water. The last lesson placed blocks on the canvas, joined them, and pressed Run. This lesson looks closely at what flows along those lines, and at the five blocks you will use in almost every model you ever build: **Constant**, **Gain**, **Sum**, **Product** and **Integrator**. With only these five you can build a first-order lag and a mass-spring-damper, two models whose answers you already know from the last module. That makes them perfect for checking that a drawing means what you think it means.

## What a line carries

A **signal** is a value that changes over time. The line on the canvas is the pipe that carries it, from one block's output port to other blocks' input ports. At every moment of simulation time, each line holds exactly one value (or one set of values). Think of a signal as a number written on the pipe that keeps being rubbed out and rewritten as the clock ticks.

A few facts about lines that you will lean on every day:

- **Direction.** A line has an arrowhead. The value flows from the output port at the tail to the input port at the head, never backward.
- **Branching.** One output can feed many inputs. To add a **[[branch|branch-line]]**, right-click an existing line and drag to the new destination. Every branch carries the same value; a branch is a copy, not a split of the flow.
- **One source per input.** An input port accepts exactly one line. Two lines can never meet head to head.
- **Names.** Double-click a line and type to give the signal a name, such as `altitude` or `pitch_rate`. The name travels with the signal into logged data, so name the signals you care about.
- **Size.** A line can carry a single number (a **scalar**) or several numbers at once (a **vector** or **matrix**). A position in three dimensions, $[x, y, z]$, can travel on one line as a vector of 3 elements. The DEBUG tab's Information Overlays menu can label every line with its size.
- **Type.** Unless you ask for something else, every signal is a **[[double|double-type]]**: an ordinary MATLAB floating-point number with about 16 significant digits.

::: key
A signal line carries one value (scalar, vector or matrix) at each moment of simulation time, from exactly one output port to one or more input ports. Branches carry copies of the same value. By default a signal is a double.
:::

How does Simulink know what order to compute things in? It reads the arrows. A block cannot compute its output until the blocks feeding it have computed theirs, so Simulink sorts the blocks into an order that respects every arrow. The wiring is the order.

That raises a puzzle. What about a loop, where a signal flows out of a block and eventually comes back into it? Hold that thought. The Integrator answers it at the end of this lesson.

## Constant: a value that never changes

The **Constant** block outputs the same value for the whole run. Its one important parameter is **Constant value**. Type `9.80665` and the block outputs standard gravity at every moment. Type `[0 0 -9.80665]` and it outputs a 3-element vector.

Use a Constant for anything that holds still during one run: a setpoint, a mass, a gravity vector. In a script, the parameter's name is `Value`, as in the last lesson's tank example.

## Gain: multiply by a fixed number

The **Gain** block is drawn as a triangle pointing the way the signal flows, like an amplifier symbol. It multiplies its input by a fixed number, set in its **Gain** parameter. If the input is $u$ and the gain is $K$, the output is $y = Ku$.

Gain has a second parameter that matters as soon as signals are vectors: **Multiplication**. The default, **Element-wise(K.*u)**, multiplies each element of $u$ by the matching element of $K$ (or by $K$ itself, if $K$ is one number). This is MATLAB's `.*`, which you met in the core MATLAB module. The option **Matrix(K*u)** does true matrix multiplication, MATLAB's `*`: $K$ is a matrix, $u$ is a column vector, and the output is the matrix product.

That second option is how you rotate a vector from one frame to another with a **[[direction cosine matrix|dcm]]**. Put the 3-by-3 matrix in the Gain, choose Matrix(K*u), and a 3-element velocity goes in and the rotated 3-element velocity comes out.

::: key
Gain: $y = Ku$. The Multiplication setting chooses Element-wise(K.*u), the default, or Matrix(K*u) for a true matrix times a vector.
:::

## Sum: add and subtract

The **Sum** block adds and subtracts its inputs. It is usually drawn as a small circle, the summing junction of every textbook block diagram, though it can also be a rectangle.

Its key parameter is the **List of signs**. It is a short string with one character per input port, in port order: `+` adds that input and `-` subtracts it. So `+-` means "input 1 minus input 2", which is exactly the error signal of a feedback loop: command minus measurement. `+--` means "input 1 minus input 2 minus input 3". A `|` character is a spacer. It takes up a position around the circle without making a port, so `|+-` has two ports, placed so the lines look tidy. If you type a plain number instead, such as `3`, you get that many `+` inputs.

One special case: with a single `+`, the Sum block adds up the elements of a vector input. Feed it `[2 5 1]` and it outputs 8.

::: key
Sum: the List of signs has one + or - per input, in port order ("+-" gives input 1 minus input 2), and "|" is a spacer that makes no port. A feedback error is a Sum with "+-".
:::

::: warning The sign is on the port, not on the wire
When a Sum has `+-`, it is the **second port** that gets subtracted, whatever line you plug into it. If you wire the measurement into port 1 and the command into port 2, your loop computes measurement minus command and the controller pushes the wrong way. A loop that runs away instead of settling is very often a swapped sign on a Sum. Look at the little + and - marks the Sum draws next to each port before you trust a loop.
:::

## Product: multiply and divide signals

A Gain multiplies by a fixed number. The **Product** block multiplies two or more **signals** together, all of which can change during the run.

Its parameter **Number of inputs** does double duty, like Sum's List of signs. A number, such as `2` (the default) or `3`, gives that many inputs, all multiplied. A string of `*` and `/` characters gives one input per character, and each `/` input is divided by instead of multiplied. So `*/` means "input 1 divided by input 2".

Its second parameter, **Multiplication**, has two choices, the same pair you met in MATLAB:

| Choice | MATLAB equivalent | What happens to $[1\ 2; 3\ 4]$ and $[5\ 6; 7\ 8]$ |
|---|---|---|
| Element-wise(.*), the default | `A .* B` | $[5\ 12; 21\ 32]$: each element times its partner |
| Matrix(*) | `A * B` | $[19\ 22; 43\ 50]$: rows times columns |

For scalar signals the two choices give the same answer. They only part ways once signals are vectors or matrices, and that is exactly when a wrong choice gives a plausible-looking wrong answer.

::: key
Product: Number of inputs is a count ("2", "3") or a string of * and / ("*/" divides input 1 by input 2). Multiplication is Element-wise(.*) by default, or Matrix(*) for a true matrix product.
:::

::: example Thrust over mass with a Product block
A stage produces 900 kN of thrust and has a mass of 60,000 kg right now. Build its acceleration from signals, so that both can change during a run.

**Step 1: the equation.** Newton's second law gives acceleration $a = F/m$, read "a equals F over m".

**Step 2: the block.** Place a Product block and set Number of inputs to `*/`. Wire the thrust signal into port 1 and the mass signal into port 2.

**Step 3: the arithmetic.** The block computes $900{,}000\ \mathrm{N} \div 60{,}000\ \mathrm{kg} = 15\ \mathrm{m/s^2}$.

**Step 4: why not a Gain?** A Gain of `1/60000` would give 15 at this instant. But the mass falls as propellant burns, so the divisor must be a signal. That is the reason Product exists.

**Sanity check.** $15\ \mathrm{m/s^2}$ is about 1.5 times gravity, a typical thrust-to-weight for a stage early in its burn. If the ports were swapped you would get $60{,}000/900{,}000 \approx 0.067$, a number with the wrong units and a warning sign in itself.
:::

## Integrator: the block that remembers

Every block so far is **memoryless**: its output right now depends only on its inputs right now. The **Integrator** is different. It keeps a running total of its input over time, the way a car's odometer adds up speed into distance. Its output right now depends on everything that has come in since the start.

In symbols, if the input is $u$ and the output is $y$,

$$
y(t) = y(t_0) + \int_{t_0}^{t} u(t')\, dt' .
$$

Read this as "y at time t equals y at the start time plus the integral of u from the start time to t". The long S is the integral sign, meaning "add up over time", and $t'$ (read "t prime") is only a placeholder for time inside the sum. The same fact, turned around, says the Integrator's input is the rate of change of its output: $\dot{y} = u$, read "y dot equals u".

The Integrator's icon shows $\frac{1}{s}$. That is its **[[transfer function|one-over-s]]**, the same notation `tf` used in the last module. The number the Integrator holds between time steps is a **state** of the model. Each Integrator adds one state.

The first-model example in lesson 1 left every Integrator setting at its default. Here are the settings that matter.

- **Initial condition** is $y(t_0)$: where the running total starts. The default is 0.
- **Initial condition source** chooses whether that value is typed into the dialog (**internal**, the default) or arrives on an extra input port (**external**), so another part of the model can compute it.
- **Limit output**, with an **Upper saturation limit** and a **Lower saturation limit**, stops the total from going beyond those bounds. When the output sits at a limit, the Integrator stops accumulating in that direction, which prevents **[[windup|windup]]**.
- **State name** gives the state a name, such as `'altitude'`, so it can be found in logged states and in the results of **[[linearization|linearisation]]**.
- **External reset** adds a port that sends the total back to its initial condition when a trigger arrives.

::: key
Integrator block: which settings matter most? Initial condition (and whether it is an external input), saturation limits with the anti-windup behavior, and state name for logging and for linearization. Getting the initial condition wrong is the single most common cause of a model that will not **[[trim|trim]]**.
:::

::: warning A wrong initial condition looks like a real transient
Suppose a lander's altitude Integrator should start at 1,000 m but you left it at 0. The model runs without a single error. It shows the lander "at the ground" at $t = 0$, and your controller reacts to that. The plot looks like physics, because it is physics, with the wrong starting point. Before every run, check each Integrator's Initial condition against the situation you mean to simulate.
:::

## Closing the loop: the first-order lag

Now the puzzle from the start of the lesson. A loop feeds a block's output back into its own input. If every block in the loop were memoryless, each one would need the others' answer before it could produce its own, and nobody could go first. Simulink calls that an **[[algebraic loop|algebraic-loop]]** and has to solve it by iteration, slowly and sometimes not at all.

An Integrator breaks the deadlock. Its output at this moment is the stored total, which is already known before its input is computed. So the Integrator goes first, the rest of the loop computes from its output, and the loop's result becomes the Integrator's input for the next step. **Every loop in a continuous model should pass through at least one Integrator**, or another block with state.

The simplest loop is the **first-order lag**, the system $G(s) = \frac{1}{\tau s + 1}$ from the last module, where $\tau$ (read "tau") is the time constant in seconds. As a differential equation it reads

$$
\tau \dot{y} = u - y \quad\Longrightarrow\quad \dot{y} = \frac{1}{\tau}(u - y).
$$

That equation is a wiring diagram in disguise. Read it right to left: take $u$, subtract $y$ (a Sum with `+-`), multiply by $\frac{1}{\tau}$ (a Gain), and the result is $\dot{y}$. Feed $\dot{y}$ into an Integrator and out comes $y$. Branch $y$ back to the Sum's minus port, and the loop is closed. The **[[picture of this loop|lag-diagram]]** is in the notes.

::: example A first-order lag with a 2-second time constant
Build the lag with $\tau = 2$ s: a Step block with Step time `0`, a Sum with List of signs `+-`, a Gain of `1/2`, an Integrator with Initial condition `0`, and a Scope. Branch the Integrator's output back into the Sum's second port. Run for 10 s.

**Step 1: the exact answer.** For a unit step into $\frac{1}{\tau s+1}$ starting from rest, $y(t) = 1 - e^{-t/\tau}$, where $e \approx 2.718$ is the base of natural logarithms.

**Step 2: one time constant.** At $t = 2$ s, $y = 1 - e^{-1} = 1 - 0.368 = 0.632$.

**Step 3: more time constants.** At $t = 4$ s, $y = 1 - e^{-2} = 0.865$. At $t = 10$ s, $y = 1 - e^{-5} = 0.993$.

**Step 4: what the Scope shows.** A curve that starts at 0 with slope $\frac{1}{2}$ per second (the input 1, minus the output 0, times $\frac{1}{2}$), bends over, and creeps up toward 1.

**Sanity check.** After one time constant a lag is about 63 percent of the way there, and after five it is within 1 percent. Both match. If your curve runs away upward instead, the Sum's signs are swapped: the loop is adding $y$ instead of subtracting it.
:::

## Two Integrators: the mass-spring-damper

A mass on a spring, with a damper like a car's shock absorber, obeys

$$
m\ddot{x} + c\dot{x} + kx = u .
$$

Here $x$ is the position, $\dot{x}$ (read "x dot") is the velocity, $\ddot{x}$ (read "x double dot") is the acceleration, $m$ is the mass in kg, $c$ is the damping in N·s/m, $k$ is the spring stiffness in N/m, and $u$ is the applied force in N.

The trick for turning any such equation into blocks is to **solve for the highest derivative**:

$$
\ddot{x} = \frac{1}{m}\left(u - c\dot{x} - kx\right).
$$

Now build it in four moves.

1. Place two Integrators in a row. If the first one's input is $\ddot{x}$, its output is $\dot{x}$. That feeds the second, whose output is $x$.
2. Branch $\dot{x}$ into a Gain of $c$, and branch $x$ into a Gain of $k$.
3. Place a Sum with List of signs `+--`. Wire $u$ into port 1, $c\dot{x}$ into port 2, and $kx$ into port 3.
4. Pass the Sum's output through a Gain of `1/m` and into the first Integrator. The loops are closed.

The first Integrator's Initial condition is the starting velocity, and the second's is the starting position. The **[[finished diagram|msd-diagram]]** is in the notes.

::: example A lightly damped mass-spring-damper
Use $m = 1$ kg, $c = 0.4$ N·s/m, $k = 4$ N/m, a unit step force at $t = 0$, both Initial conditions 0, and a stop time of 20 s. What should the Scope show?

**Step 1: the natural frequency.** $\omega_n = \sqrt{k/m} = \sqrt{4} = 2$ rad/s. Read $\omega_n$ as "omega n".

**Step 2: the damping ratio.** $\zeta = \frac{c}{2\sqrt{km}} = \frac{0.4}{2 \times 2} = 0.1$. Read $\zeta$ as "zeta". A value this small means the mass will bounce many times before settling.

**Step 3: the frequency of the wiggles.** $\omega_d = \omega_n\sqrt{1 - \zeta^2} = 2\sqrt{0.99} = 1.99$ rad/s.

**Step 4: where it settles.** When everything stops moving, $\dot{x} = \ddot{x} = 0$, so $kx = u$ and $x = 1/4 = 0.25$ m.

**Step 5: the first peak.** It comes at $t = \pi/\omega_d = 1.58$ s. The overshoot is $e^{-\zeta\pi/\sqrt{1-\zeta^2}} = 0.729$, so the peak is $0.25 \times (1 + 0.729) = 0.432$ m. Divided by the final value, that peak is 1.73 times the steady position.

**Sanity check.** The mass swings to about 73 percent past its resting point, then rings down at about 2 rad/s, a period of about 3.2 s. At $t = 20$ s it reads 0.252 m, very close to 0.25. A simulation with a tight tolerance matches these exact numbers to better than a millionth, and lesson 4 shows how to prove it.
:::

## Check yourself

::: check
A Sum block has List of signs `|-+`. How many input ports does it have, and what does it compute?
:::

::: answer
The `|` is a spacer and makes no port, so there are two ports. Port 1 carries a minus and port 2 a plus, so the output is input 2 minus input 1. Written with the inputs in order, that is $-u_1 + u_2$.
:::

::: check
A Gain block holds the matrix $K = \begin{bmatrix} 0.866 & 0.5 & 0 \\ -0.5 & 0.866 & 0 \\ 0 & 0 & 1 \end{bmatrix}$ and its input is the vector $[100, 0, 0]$. What comes out with Multiplication set to Matrix(K*u)? Why would Element-wise(K.*u) be wrong here?
:::

::: answer
Matrix(K*u) multiplies each row of $K$ by the column $[100, 0, 0]$: row 1 gives $0.866 \times 100 = 86.6$, row 2 gives $-0.5 \times 100 = -50$, row 3 gives 0. The output is $[86.6, -50, 0]$, the same vector turned by 30 degrees. Element-wise multiplication only multiplies partners one by one. It never mixes the $x$, $y$ and $z$ parts of the vector, and a rotation must mix them. A rotation needs the true matrix product.
:::

::: check
A falling probe's model has a velocity Integrator and a position Integrator. The probe starts 3,000 m up, falling at 40 m/s, with up positive. What Initial conditions go in each Integrator? What goes wrong if both are left at 0?
:::

::: answer
The velocity Integrator starts at $-40$ (m/s, negative because the probe falls and up is positive). The position Integrator starts at $3000$ (m). Left at 0, the model simulates a probe at rest on the ground at $t = 0$. It runs without an error, and it answers a completely different question.
:::

::: check
In the first-order lag example you change the Gain from `1/2` to `1/5`. What is the new time constant, and what value does the Scope show at $t = 10$ s?
:::

::: answer
The Gain is $\frac{1}{\tau}$, so $\tau = 5$ s. At $t = 10$ s that is two time constants: $y = 1 - e^{-2} = 0.865$. The response is slower. At 10 s it is where the 2-second lag was at 4 s.
:::

## Summary

| Block or idea | What it does | Parameter to know |
|---|---|---|
| Signal line | Carries one value per moment, output to input; branches copy it | Name it by double-clicking the line |
| Constant | Outputs a fixed value | Constant value |
| Gain | $y = Ku$ | Gain; Multiplication: Element-wise(K.*u) or Matrix(K*u) |
| Sum | Adds and subtracts inputs | List of signs, e.g. `+-`, with a bar as a spacer |
| Product | Multiplies and divides signals | Number of inputs, e.g. `2` or `*/`; Element-wise(.*) or Matrix(*) |
| Integrator | $y(t) = y(t_0) + \int u\,dt'$, icon $\frac{1}{s}$ | Initial condition and its source; saturation limits; state name |
| Loop rule | Every loop needs a block with state | Otherwise an algebraic loop |
| Building from an ODE | Solve for the highest derivative, chain Integrators | One Integrator per state |

These five blocks compute the model. The next lesson adds the blocks at the edges: sources that feed a model its inputs, from steps and ramps to sine waves and hand-drawn signals, and sinks that show and save what comes out, including the Simulation Data Inspector.

::: context branch-line A branch is a copy
When you branch a line, a small dot marks the branch point, and both paths leave it carrying the same value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="45" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="49" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">Integrator</text>
  <line x1="84" y1="65" x2="244" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="250,65 242,61 242,69" fill="#1f2a44"/>
  <rect x="250" y="45" width="70" height="40" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="285" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">Scope</text>
  <circle cx="150" cy="65" r="4" fill="#b4232c"/>
  <line x1="150" y1="65" x2="150" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="115" x2="244" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="250,115 242,111 242,119" fill="#1f2a44"/>
  <text x="256" y="119" font-size="12" fill="#1f2a44">to the Sum</text>
  <text x="160" y="56" font-size="11" fill="#b4232c">branch point</text>
  <text x="120" y="30" font-size="11" fill="#6c7a93">both paths carry the same value</text>
</svg>
```

Unlike water in a pipe, nothing is divided: if the Integrator outputs 0.632, the Scope and the Sum each receive 0.632.
:::

::: context double-type What "double" means
A **double** is a double-precision floating-point number, the standard 64-bit number format that MATLAB, Python and most engineering software use by default. It holds about 15 to 16 significant decimal digits and numbers as large as about $1.8 \times 10^{308}$. Simulink can also carry single-precision numbers, integers, booleans and fixed-point types. Those matter later, when a model becomes code for a small flight processor with limited memory. For modeling and checking physics, stay with double.
:::

::: context dcm A matrix that turns a vector
A direction cosine matrix is a 3-by-3 matrix that rewrites a vector from one set of axes into another, such as from a local navigation frame into the vehicle's body frame. You built them with `angle2dcm` in the rotations lesson of the last module. Multiplying it by a vector must be a true matrix product. Doing it element by element is a mistake that produces numbers of the right size and the wrong meaning, which is why the Gain's Multiplication setting deserves a glance every time.
:::

::: context one-over-s Why the icon says 1/s
In the Laplace notation of the last module, multiplying by $s$ means "take the derivative" and dividing by $s$ means "integrate". An Integrator block is the transfer function $\frac{1}{s}$. That is why a first-order lag drawn as a loop and the single block `tf(1, [2 1])` describe the same system: the loop's algebra, $Y = \frac{1}{s}\cdot\frac{1}{2}(U - Y)$, rearranges to $Y = \frac{1}{2s+1}U$. Lesson 5 introduces the Transfer Fcn block that packs the whole loop into one box.
:::

::: context windup When a total keeps growing uselessly
**Integrator windup** happens when a controller's integrator keeps adding up error while the actuator is already pushed as far as it can go. The total grows and grows. When the error finally changes sign, the controller has to "unwind" all that stored total before the actuator moves back, and the vehicle overshoots badly. Limiting the Integrator's output stops the growth at the bound, which is the simplest cure. Lesson 7 comes back to this with the Saturation and Rate Limiter blocks.
:::

::: context linearisation Turning a model into a tf or ss
**Linearization** finds the straight-line approximation of a model near one operating point and returns it as a state-space model, the same `ss` object you used in the last module. Each Integrator becomes one state. Named states show up by name in the result, so you can tell which row of the $\mathbf{A}$ matrix is altitude and which is pitch rate, instead of guessing from numbers.
:::

::: context trim Finding the steady flight condition
To **trim** a model is to find the inputs and states at which nothing is changing: every Integrator's input is zero. For an aircraft it is the throttle and elevator setting that holds steady level flight. Trim is the starting point for linearization and for most control design. A search for trim starts from the Integrators' initial conditions, so a wildly wrong one can send it somewhere meaningless or stop it from converging at all.
:::

::: context algebraic-loop A loop with no memory
Wire a Sum's output into a Gain and the Gain back into the same Sum, with nothing else in between. The Sum needs the Gain's output, and the Gain needs the Sum's. At every time step the value must satisfy $y = K(u - y)$, an equation to be solved rather than a formula to evaluate. Simulink detects this, reports an algebraic loop, and solves it iteratively where it can. That is slow and fragile, and it is a warning sign in any model headed for flight code. The fix is almost always a missing state: a real system has a lag, a filter or a sensor delay that belongs in the loop.
:::

::: context lag-diagram The lag as blocks
The equation $\dot{y} = \frac{1}{\tau}(u - y)$ drawn left to right. The Integrator's output is branched back to the minus port of the Sum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="35" width="44" height="30" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">Step</text>
  <line x1="52" y1="50" x2="76" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="82,50 74,46 74,54" fill="#1f2a44"/>
  <circle cx="94" cy="50" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="74" y="42" font-size="12" fill="#1f2a44">+</text>
  <text x="98" y="78" font-size="13" fill="#b4232c">−</text>
  <line x1="106" y1="50" x2="130" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="136,50 128,46 128,54" fill="#1f2a44"/>
  <polygon points="136,32 136,68 176,50" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="150" y="54" font-size="11" fill="#1f2a44" text-anchor="middle">1/τ</text>
  <line x1="176" y1="50" x2="200" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="206,50 198,46 198,54" fill="#1f2a44"/>
  <text x="190" y="42" font-size="11" fill="#1d6fd1" text-anchor="middle">ẏ</text>
  <rect x="206" y="32" width="44" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="228" y="55" font-size="12" fill="#1f2a44" text-anchor="middle">1/s</text>
  <line x1="250" y1="50" x2="306" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="312,50 304,46 304,54" fill="#1f2a44"/>
  <text x="322" y="54" font-size="12" fill="#1d6fd1">y</text>
  <circle cx="278" cy="50" r="3.5" fill="#1f2a44"/>
  <line x1="278" y1="50" x2="278" y2="110" stroke="#1f2a44" stroke-width="2"/>
  <line x1="278" y1="110" x2="94" y2="110" stroke="#1f2a44" stroke-width="2"/>
  <line x1="94" y1="110" x2="94" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="94,62 90,70 98,70" fill="#1f2a44"/>
  <text x="186" y="128" font-size="11" fill="#6c7a93" text-anchor="middle">Sum "+-": u minus y</text>
</svg>
```
:::

::: context msd-diagram Two Integrators in a chain
The mass-spring-damper built from $\ddot{x} = \frac{1}{m}(u - c\dot{x} - kx)$. Velocity and position are each branched back through a Gain to the Sum's minus ports.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="8" y="44" font-size="12" fill="#1d6fd1">u</text>
  <line x1="18" y1="40" x2="40" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="46,40 38,36 38,44" fill="#1f2a44"/>
  <circle cx="58" cy="40" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="38" y="32" font-size="12" fill="#1f2a44">+</text>
  <text x="44" y="70" font-size="13" fill="#b4232c">−</text>
  <text x="64" y="70" font-size="13" fill="#b4232c">−</text>
  <line x1="70" y1="40" x2="88" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="94,40 86,36 86,44" fill="#1f2a44"/>
  <polygon points="94,24 94,56 130,40" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="106" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">1/m</text>
  <line x1="130" y1="40" x2="150" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="156,40 148,36 148,44" fill="#1f2a44"/>
  <text x="143" y="32" font-size="11" fill="#1d6fd1" text-anchor="middle">ẍ</text>
  <rect x="156" y="24" width="40" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="176" y="45" font-size="12" fill="#1f2a44" text-anchor="middle">1/s</text>
  <line x1="196" y1="40" x2="240" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="246,40 238,36 238,44" fill="#1f2a44"/>
  <text x="228" y="32" font-size="11" fill="#1d6fd1" text-anchor="middle">ẋ</text>
  <rect x="246" y="24" width="40" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="266" y="45" font-size="12" fill="#1f2a44" text-anchor="middle">1/s</text>
  <line x1="286" y1="40" x2="336" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="342,40 334,36 334,44" fill="#1f2a44"/>
  <text x="346" y="44" font-size="12" fill="#1d6fd1">x</text>
  <circle cx="216" cy="40" r="3.5" fill="#1f2a44"/>
  <line x1="216" y1="40" x2="216" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="216" y1="100" x2="186" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,100 188,96 188,104" fill="#1f2a44"/>
  <polygon points="180,86 180,114 146,100" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="168" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">c</text>
  <line x1="146" y1="100" x2="52" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="52" y1="100" x2="52" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="52,52 48,60 56,60" fill="#1f2a44"/>
  <circle cx="310" cy="40" r="3.5" fill="#1f2a44"/>
  <line x1="310" y1="40" x2="310" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="310" y1="150" x2="186" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,150 188,146 188,154" fill="#1f2a44"/>
  <polygon points="180,136 180,164 146,150" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="168" y="154" font-size="11" fill="#1f2a44" text-anchor="middle">k</text>
  <line x1="146" y1="150" x2="64" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="64" y1="150" x2="64" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="64,52 60,60 68,60" fill="#1f2a44"/>
  <text x="250" y="172" font-size="11" fill="#6c7a93" text-anchor="middle">Sum "+--": u − cẋ − kx</text>
</svg>
```

Gains pointing left are the same Gain block, flipped so the triangle faces the way the signal flows.
:::
