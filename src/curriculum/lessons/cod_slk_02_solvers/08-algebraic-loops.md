---
id: l08-algebraic-loops
title: 'Algebraic loops: finding them, breaking them, paying for it'
minutes: 23
covers:
  - 'Algebraic loops: what creates them, the Algebraic Constraint block, breaking them with a unit delay and its phase cost'
---

Two friends are deciding where to eat. Sam says, "I'll pick once I know what Alex wants." Alex says, "I'll pick once I know what Sam wants." Nobody is being difficult, yet nothing can happen: each answer is waiting on the other, at the same moment. The only ways out are for someone to guess and adjust ("How about pizza? No? Tacos?") or for one of them to go by what the other said *yesterday*.

A spreadsheet has the same trap. If cell A1 adds something to B1, and B1 is computed from A1, the spreadsheet warns you about a **[[circular reference|circular-reference]]**. It cannot fill in either cell first.

Simulink calls this an **algebraic loop**: a feedback path in which a block's output, at this instant, depends on itself. Lesson 7 put one deliberate delay into a model, where a slow rate hands data to a fast one. This lesson is about a delay you may choose to add yourself. You will learn what creates an algebraic loop, how Simulink copes with one, why a model headed for flight code must not keep one, the three ways to break it, and how to put a number, in degrees, on what the easiest fix costs.

## Direct feedthrough

Every block turns inputs into outputs. The question that matters here is *when*. Some blocks need their input at this instant to produce their output at this instant. Others can produce this instant's output from what they remember.

A block has **direct feedthrough** when its output at time $t$ depends on its input at the same time $t$. A Gain block is the plainest example: $y = K u$. You cannot know $y$ now without knowing $u$ now. A Sum block, a Product, a Saturation and most MATLAB Function blocks are the same.

A block *without* direct feedthrough computes its output from its **state**, the numbers it remembers. An Integrator's output is its state, the running total so far, which does not depend on the input at this instant; the input only changes how the state will grow. A Unit Delay outputs the value its input had one sample ago. A Transfer Fcn whose denominator has a higher degree than its numerator, such as $\frac{1}{s+1}$, also has no direct feedthrough.

For a transfer function, the test is the degrees. If the numerator and denominator have the same degree, like the **[[lead filter|lead-filter]]** $\frac{s+1}{0.1s+1}$, a sudden jump in the input shows up in the output at once, so it has direct feedthrough. In state-space form, $\dot{x} = Ax + Bu$, $y = Cx + Du$, the block has direct feedthrough exactly when the matrix $D$ is not zero.

### What makes a loop algebraic

Now join blocks in a ring. Simulink works out the blocks in an order, so that every block's inputs are ready before it runs. A block with no direct feedthrough can go first in a ring, because its output comes from memory. But if *every* block on the ring has direct feedthrough, there is no place to start. Each one's output needs the next one's, all at the same instant.

::: key
What is an algebraic loop? A feedback path in which a block output depends on its own input within the same time step, because every block on the loop has direct feedthrough. Simulink must solve an implicit equation at each step, which is slow, may not converge, and cannot be code-generated cleanly.
:::

The smallest example is a Gain in a negative-feedback ring with a Sum block. The Sum computes $e = u - y$, and the Gain computes $y = K e$. Put together:

$$
y = K(u - y).
$$

Here $y$ appears on both sides. That is an **implicit equation**: it says what $y$ must satisfy, not how to compute it. For this one you can do the algebra by hand. Add $Ky$ to both sides, so $y + Ky = Ku$. Factor out $y$: $y(1 + K) = Ku$. Divide by $1 + K$:

$$
y = \frac{K}{1+K}\,u.
$$

With $K = 2$ and $u = 1$, $y = 2/3$. Check it: $2 \times (1 - 2/3) = 2 \times 1/3 = 2/3$. Both sides agree.

Real loops are rarely this tidy. They contain saturations, lookup tables and functions that cannot be solved by hand. That is where Simulink's iterative solver comes in.

## How Simulink solves a loop

When Simulink finds an algebraic loop, it does not refuse to run. At every time step it picks one signal on the loop, guesses its value, runs the loop once to see what value comes back, and adjusts the guess until the value that comes back matches the value that went in. It does this with a **[[Newton-type method|newton]]**, a way of using the slope of the mismatch to make each new guess much better than the last. In the Configuration Parameters you can choose between two versions of it, a trust-region method and a line-search method.

It also tells you. The Diagnostics settings include one called "Algebraic loop", which you can set to report nothing, a warning or an error. The function `Simulink.BlockDiagram.getAlgebraicLoops`, called with the model's name, lists the loops and highlights them in the diagram.

::: example Counting the guesses
Take a slightly nonlinear loop: a Sum block outputs $y$, a block on the feedback path cubes it, and the cube comes back to the Sum's minus input. Both blocks have direct feedthrough, so the loop says

$$
y = u - y^3.
$$

At each step the solver must find the $y$ that satisfies $f(y) = y + y^3 - u = 0$. Newton's method, started from $y = 0$ and stopped when $|f(y)| < 10^{-10}$, needed this many updates (computed in Python):

| Input $u$ | Answer $y$ | Newton updates |
|---|---|---|
| 0.1 | 0.0990 | 3 |
| 2 | 1.0000 | 7 |
| 20 | 2.5917 | 10 |
| 200 | 5.7910 | 14 |

**Read the table.** The work per time step depends on the input. A small input needs 3 updates; a large one needs 14, nearly five times as many. Each update means running every block on the loop again.

**Sanity check on one row.** For $u = 2$: $1 + 1^3 = 2$. Correct.

**What it means.** The step's cost is not fixed. It depends on the data, like the variable-step solver in lesson 1. And for an awkward function or a bad starting guess, Newton's method can fail to converge at all, and the simulation stops with an error.
:::

### Why that is bad for flight code

On the desktop, an algebraic loop costs speed and some risk. On a flight computer it breaks the rules. Flight code must do a fixed, bounded amount of work every frame, so its **worst-case execution time** can be stated and checked against the schedule. An iteration whose count depends on the data has no such bound, and an iteration that might not converge could leave the controller without an answer in the middle of flight. So flight teams treat an algebraic loop in a deployable model as a defect to be removed, not a warning to be ignored.

::: warning A loop you did not draw
An algebraic loop can hide inside a subsystem. If an atomic subsystem (the next module explains them) has direct feedthrough from any input to any output, Simulink treats it as a single block with feedthrough, and wiring its output back to one of its inputs creates a loop even if the inside path you care about has an Integrator on it. When Simulink reports a loop you cannot see, look for atomic subsystems and model references on the ring.
:::

## Three ways to break a loop

A loop needs *every* block on the ring to have direct feedthrough. So to break it, give one block on the ring a state. There are three ways to do that, and they cost different things.

### 1. Restructure so one path has a state

Often the loop exists because the model is too ideal. A controller commands an actuator, the actuator's output feeds a sensor model, and the sensor feeds the controller, all as pure gains. In reality the actuator takes time to respond. Modeling it as a **[[first-order lag|first-order-lag]]**, $\frac{1}{\tau s + 1}$, where $\tau$ (read "tau") is its time constant, adds an honest state to the loop, and the loop is gone.

Other times the algebra can be done by hand, as with $y = \frac{K}{1+K}u$ above, and the loop replaced by the block that computes the answer directly. Either way the model becomes more correct or stays exact, with no extra cost. This is the best fix whenever it is possible.

### 2. Insert a Unit Delay or a Memory block

The quick fix is to put a **Unit Delay** block on the loop. Its output at step $k$ is its input at step $k - 1$, so the loop now uses last step's value, the way one friend goes by what the other said yesterday. In a discrete model this is written with $z^{-1}$, read "z to the minus one", the symbol for a one-sample delay.

The **Memory** block does the same job, but it holds its input from the previous time step of the solver, whatever that step was, rather than one fixed sample period. In a variable-step model that delay changes from step to step, so a Unit Delay at a chosen sample time is the more predictable choice.

The delay is easy to insert. It is also not free, in two ways.

::: example A delay that changes the answer
Go back to the loop $y = K(u - y)$ with $K = 2$ and $u = 1$. The exact answer is $y = 2/3$. Now break the loop with a Unit Delay, so each step uses last step's output:

$$
y_k = K\,(u - y_{k-1}), \qquad y_{-1} = 0.
$$

**Step 1: iterate by hand.** $y_0 = 2(1 - 0) = 2$. Then $y_1 = 2(1 - 2) = -2$. Then $y_2 = 2(1 + 2) = 6$. Then $y_3 = 2(1 - 6) = -10$, then $22$, then $-42$.

**Step 2: see the pattern.** Each new value is $2 - 2y_{k-1}$, so the difference from $2/3$ is multiplied by $-2$ every step. It flips sign and doubles. The delayed loop is **[[unstable|discrete-pole]]**, although the loop without a delay was perfectly fine.

**Step 3: try a smaller gain.** With $K = 0.5$ the exact answer is $0.5/1.5 = 0.333$. The delayed loop gives $0.5, 0.25, 0.375, 0.3125, 0.344, 0.328, \ldots$: it wobbles and settles on $0.333$, because the difference is multiplied by $-0.5$ each step and shrinks.

**Sanity check.** The delayed loop is a discrete system with the single pole $-K$. It is stable only when $|K| < 1$. So the "harmless" delay turned a loop that works for any positive $K$ into one that works only for $K$ below 1.
:::

That example is extreme on purpose: the delay sits on a loop that was pure algebra, with nothing slow in it. In a real control loop, the delay is small compared with how fast the signals change, and its cost is a loss of **phase**. The next section puts a number on it.

### 3. Keep the loop, and state it: the Algebraic Constraint block

Sometimes the equation really is implicit and must stay exact, as in a model of a physical constraint. The **Algebraic Constraint** block, in the Math Operations library, makes this explicit. Its output is an unknown $z$. Its input is some function $f(z)$ that you build from $z$ with other blocks. Simulink adjusts $z$ until $f(z) = 0$. The block has an **Initial guess** parameter, the value the search starts from.

This keeps the mathematics exact and makes the loop visible and deliberate. It does not remove the iteration: every step is still an implicit solve, with the same cost and convergence risk as before. It belongs in a desktop model of the physics, not in the path that becomes flight code.

::: key
Three ways to break an algebraic loop, and their costs: restructure so one path has a state (best, free); insert a Unit Delay (easy, costs about omega times Ts of phase at frequency omega); or use an Algebraic Constraint block with a solver (keeps the mathematics exact, keeps the iteration cost).
:::

## The phase cost of one sample

Picture a swing. You push it every time it comes back to you. Now suppose you push a moment late, every time. At a slow swing a tiny lateness hardly matters. At a fast swing the same lateness means you push when the swing has already started away from you, and your push starts to fight it. A fixed delay in time is a bigger and bigger fraction of each cycle as the cycle gets faster.

That fraction of a cycle is **phase**. One full cycle is $2\pi$ radians, or $360^\circ$. A sine wave of angular frequency $\omega$ (read "omega", in radians per second) moves through $\omega$ radians of phase every second. So if it arrives $T$ seconds late, it has fallen behind by

$$
\Delta\phi = \omega\, T \ \text{radians}.
$$

Read $\Delta\phi$ as "delta phi", the change in phase. For a Unit Delay at sample time $T_s$, the delay is one sample, $T = T_s$, and the phase cost is $\omega T_s$ radians. Multiply by $180/\pi$ for degrees. The delay does not change the size of the signal at all, only its timing.

::: key
A one-sample delay (Unit Delay, $z^{-1}$) at sample time $T_s$ costs $\omega T_s$ radians of phase at frequency $\omega$, with no change in gain. In degrees: $\omega T_s \times 180/\pi$.
:::

::: note Why the phase lag is exactly omega times T
Write the sine wave as the real part of $e^{j\omega t}$, where $j$ is the square root of $-1$ (engineers write $j$, not $i$). Delaying it by $T$ gives $e^{j\omega (t - T)} = e^{j\omega t}\, e^{-j\omega T}$. The delay multiplies the signal by $e^{-j\omega T} = \cos(\omega T) - j \sin(\omega T)$. That number has size $\sqrt{\cos^2 + \sin^2} = 1$, so the gain is unchanged, and angle $-\omega T$, so the phase drops by $\omega T$. For a discrete delay, $z = e^{j\omega T_s}$ on the frequency axis, so $z^{-1} = e^{-j\omega T_s}$: the same result with $T = T_s$.
:::

### Where the cost matters: crossover

A feedback loop cares most about one frequency: its **crossover frequency** $\omega_c$, where the loop's gain falls through 1. Its **[[phase margin|phase-margin]]** is how much extra lag the loop could take at that frequency before it would oscillate forever. Because a delay changes only the phase, not the gain, the crossover frequency stays where it was, and the delay's cost comes straight off the margin:

$$
\text{new margin} = \text{old margin} - \omega_c T_s \times \frac{180^\circ}{\pi}.
$$

::: example The margin a 50 Hz Unit Delay eats
An attitude loop crosses over at $\omega_c = 10\,\mathrm{rad/s}$ with a phase margin of $45^\circ$. An algebraic loop in the model is broken with a Unit Delay at 50 Hz, so $T_s = 1/50 = 0.02\,\mathrm{s}$.

**Step 1: the phase cost in radians.** $\omega_c T_s = 10 \times 0.02 = 0.2\,\mathrm{rad}$.

**Step 2: in degrees.** $0.2 \times 180/\pi = 11.46^\circ$, about $11.5^\circ$.

**Step 3: the new margin.** $45^\circ - 11.46^\circ = 33.5^\circ$. A Python check of the loop $L(s) = \frac{141.4}{s(s+10)}$, which crosses over at exactly 10 rad/s with $45^\circ$ of margin, gives $33.54^\circ$ with the delay added.

**Step 4: against the requirement.** Many flight programs require at least $30^\circ$ to $45^\circ$ of phase margin. Against a $30^\circ$ requirement this passes, with $3.5^\circ$ to spare. Against a $45^\circ$ requirement it fails, and the delay cannot stay.

**Sanity check.** How long a delay would eat the entire margin? $45^\circ$ is $0.785\,\mathrm{rad}$, and $0.785 / 10 = 0.0785\,\mathrm{s}$, about four samples at 50 Hz. So one sample eating about a quarter of the margin is the right size.
:::

The same calculation in Python, with a check against the frequency response of $z^{-1}$ itself:

```python
import numpy as np
from scipy import signal

Ts = 0.02      # sample time of the Unit Delay, s
w = 10.0       # frequency of interest (the loop crossover), rad/s

lag = w * Ts                       # phase cost in radians
print(lag, np.degrees(lag))
# 0.2 11.459155902616466

# Check: frequency response of z^-1 at the same frequency
_, h = signal.freqz([0, 1], [1], worN=[w * Ts])
print(abs(h[0]), np.degrees(np.angle(h[0])))
# 1.0 -11.459155902616466
```

`freqz` takes the frequency in radians per sample, which is why it gets $\omega T_s$. The magnitude of 1.0 confirms the delay changes no gain; the angle is the lag.

::: warning The cost grows with frequency
$\omega T_s$ is a straight line in $\omega$. Double the crossover and the same delay costs twice the phase. At **[[half the sample rate|nyquist]]**, the highest frequency a sampled signal can carry, it reaches $\pi$ radians, a full $180^\circ$. So a Unit Delay that is harmless in a slow outer loop can wreck a fast inner loop. Always compute it at the crossover of the loop it sits in.
:::

To make the delay cheaper, make $T_s$ smaller: the same loop at 200 Hz pays a quarter as much. Better still, go back to fix 1 and find the state the model was missing.

## Check yourself

::: check
Which of these blocks have direct feedthrough: a Gain, an Integrator, a Transfer Fcn $\frac{2s+1}{s+3}$, a Transfer Fcn $\frac{5}{s^2 + 2s + 5}$, a Unit Delay? Could a loop made of the first and third be algebraic?
:::

::: answer
The Gain has direct feedthrough ($y = Ku$). The Integrator does not: its output is its state. $\frac{2s+1}{s+3}$ has numerator and denominator of the same degree (1), so it does. $\frac{5}{s^2+2s+5}$ has a higher-degree denominator, so it does not. The Unit Delay does not: it outputs last sample's input. A loop of the Gain and $\frac{2s+1}{s+3}$ has feedthrough in every block, so yes, it is an algebraic loop.
:::

::: check
Solve the loop $y = 3(u - y)$ by hand for $u = 4$. Then say what happens if you break it with a Unit Delay.
:::

::: answer
Add $3y$ to both sides: $4y = 3u$, so $y = 3u/4 = 3$. Check: $3 \times (4 - 3) = 3$. With a Unit Delay the loop becomes $y_k = 3(u - y_{k-1})$, a discrete system with pole $-3$. Since $|-3| > 1$, it is unstable: starting from 0 it gives $12, -24, 84, \ldots$, swinging wider every step. This loop needs fix 1, not a delay.
:::

::: check
A loop crossing over at $4\,\mathrm{rad/s}$ runs at 250 Hz. How much phase does a Unit Delay cost? Compare it with the cost of the same Unit Delay in a loop at 25 Hz.
:::

::: answer
At 250 Hz, $T_s = 0.004\,\mathrm{s}$, so $\omega T_s = 4 \times 0.004 = 0.016\,\mathrm{rad} = 0.92^\circ$, under one degree. At 25 Hz, $T_s = 0.04\,\mathrm{s}$, so $\omega T_s = 0.16\,\mathrm{rad} = 9.17^\circ$, ten times more, because the sample time is ten times longer.
:::

::: check
Why does the Algebraic Constraint block not make a model suitable for flight code, even though it makes the loop explicit?
:::

::: answer
The block states the implicit equation openly, but Simulink still solves it by iteration at every step. The number of iterations depends on the data and the solve can fail to converge. Flight code needs a fixed, bounded amount of work each frame, so the iteration is the problem, and the block keeps it.
:::

::: check
Your loop has a $40^\circ$ phase margin at $\omega_c = 15\,\mathrm{rad/s}$, and the requirement is $35^\circ$. What is the largest sample time at which a Unit Delay could be added and still meet the requirement?
:::

::: answer
The delay may use up $40^\circ - 35^\circ = 5^\circ$, which is $5 \times \pi/180 = 0.0873\,\mathrm{rad}$. We need $\omega_c T_s \le 0.0873$, so $T_s \le 0.0873/15 = 0.00582\,\mathrm{s}$, about 5.8 ms. A 200 Hz rate (5 ms) would meet it: $15 \times 0.005 = 0.075\,\mathrm{rad} = 4.3^\circ$, leaving $35.7^\circ$.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Direct feedthrough | Output now depends on input now | Gain, Sum, $D \ne 0$, equal-degree transfer function |
| No feedthrough | Output comes from a state | Integrator, Unit Delay, Memory, strictly proper transfer function |
| Algebraic loop | Ring of blocks that all have feedthrough | Implicit equation solved by iteration every step |
| Why it is bad for flight code | Iteration count depends on data, may not converge | No bounded worst-case time |
| Fix 1: restructure | Give one path a real state, or solve the algebra | Best, free |
| Fix 2: Unit Delay | Use last sample's value | Costs $\omega T_s$ rad of phase; can destabilize a pure-algebra loop |
| Fix 3: Algebraic Constraint | Drive $f(z)$ to zero explicitly | Exact, keeps iteration cost |
| Margin after a delay | Crossover unchanged, phase drops | new margin = old margin $- \omega_c T_s \times 180/\pi$ |

The next lesson ties the module together. It shows how the Solver Profiler turns a slow or stalling simulation into a list of the blocks responsible, and it sets out the golden rule for a model headed to flight code: fixed-step, cleanly multirate, and free of algebraic loops.

::: context circular-reference The same trap in a spreadsheet
A spreadsheet recalculates by working out which cells depend on which, and computing them in order. A circular reference is a loop in that order: A1 needs B1, B1 needs A1. Excel warns about it, and it has an option to allow iterative calculation, where it repeats the loop until the numbers stop changing, up to a maximum count. That is the same idea as Simulink's algebraic loop solver, and it has the same weakness: the answer depends on how many rounds you allow and on where the guessing started.
:::

::: context lead-filter A block that reacts at once
A lead filter such as $\frac{s+1}{0.1s+1}$ is a common piece of a controller: it adds phase near crossover to make a loop more stable. Divide it out and it equals $10 - \frac{9}{0.1s+1}$ (check: at $s = 0$ it gives $10 - 9 = 1$, matching $\frac{1}{1}$). The constant 10 is a straight path from input to output with no memory in it. That is the direct feedthrough, and it is why a controller built from lead filters, placed in a ring with other feedthrough blocks, can form an algebraic loop.
:::

::: context newton Sliding down the tangent
Newton's method finds where a function crosses zero. At the current guess, it draws the straight tangent line to the curve and jumps to where that line hits zero. That point becomes the next guess. Near the answer each step roughly doubles the number of correct digits, which is why a few updates are usually enough. Far from the answer, or where the curve is flat, a tangent can shoot off in a bad direction, which is why solvers add safeguards like trust regions and line searches.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="345" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M60,150 Q200,130 320,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="290" cy="46" r="5" fill="#1f2a44"/>
  <line x1="290" y1="46" x2="198" y2="120" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="198" cy="120" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="168" cy="120" r="4" fill="#1d6fd1"/>
  <text x="298" y="42" font-size="11" fill="#1f2a44">guess</text>
  <text x="206" y="140" font-size="11" fill="#1f2a44">next guess</text>
  <text x="160" y="140" font-size="11" fill="#1d6fd1" text-anchor="end">root</text>
  <text x="340" y="112" font-size="11" fill="#6c7a93" text-anchor="end">f = 0</text>
</svg>
```

The red tangent from the current guess meets the axis at the next guess, much closer to the root than where it started.
:::

::: context first-order-lag The simplest honest actuator
A first-order lag $\frac{1}{\tau s + 1}$ describes anything that moves toward its command at a rate proportional to how far it still has to go: a valve, a motor, a heater. After one time constant $\tau$ it has covered 63% of a step, and after about $4\tau$ it has covered 98%. A thrust-vector actuator might have $\tau$ of about 20 to 50 ms. Adding that lag costs a little phase in the loop, but it is phase the real hardware costs anyway, so the model becomes more truthful, not less.
:::

::: context discrete-pole Multiplied by the same number every step
The delayed loop $y_k = K(u - y_{k-1})$ can be rewritten around its resting value $y^* = \frac{K}{1+K}u$. Call the error $e_k = y_k - y^*$. Subtracting the two equations gives $e_k = -K\,e_{k-1}$: each step multiplies the error by $-K$, the discrete pole. If $|K| < 1$ the error shrinks; if $|K| > 1$ it grows. The minus sign makes it flip sides every step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="345" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <text x="26" y="94" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <g fill="#b4232c">
    <circle cx="60" cy="82" r="4"/><circle cx="110" cy="106" r="4"/><circle cx="160" cy="58" r="4"/><circle cx="210" cy="154" r="4"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="72" cy="84" r="4"/><circle cx="122" cy="93" r="4"/><circle cx="172" cy="88.5" r="4"/><circle cx="222" cy="90.8" r="4"/><circle cx="272" cy="89.6" r="4"/><circle cx="322" cy="90.2" r="4"/>
  </g>
  <text x="220" y="40" font-size="11" fill="#b4232c">K = 2: error times -2 each step</text>
  <text x="220" y="130" font-size="11" fill="#1d6fd1">K = 0.5: error times -0.5</text>
  <text x="185" y="175" font-size="11" fill="#1f2a44" text-anchor="middle">step k: 0, 1, 2, 3, ...</text>
</svg>
```

Dots are the error $e_k$ (6 px per unit of error for the red dots, 36 px per unit for the blue ones so both fit; the blue dots sit a little to the right of their step). Red swings wider; blue closes in on zero.
:::

::: context phase-margin How much lateness a loop can take
A feedback loop turns unstable when a signal comes back around the loop the same size and exactly half a cycle ($180^\circ$) late, because then the correction arrives pushing the wrong way and keeps itself going. At the crossover frequency the size is already 1, so the only thing standing between the loop and that oscillation is how far its phase is from $-180^\circ$. That distance is the phase margin. You met it with the `margin` command in the MATLAB module. Every delay, filter and hold eats some of it.
:::

::: context nyquist The fastest wiggle a sampler can see
Sampling every $T_s$ seconds can represent sine waves only up to half the sample rate, called the Nyquist frequency: $\omega = \pi / T_s$ rad/s. At 50 Hz that is $\pi/0.02 = 157\,\mathrm{rad/s}$ (25 Hz). There, one sample is half a cycle, so a one-sample delay is exactly $\pi$ rad, $180^\circ$. The straight line $\omega T_s$ runs from zero lag at zero frequency to that half-cycle at Nyquist.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="130" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="130" x2="310" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="310" y1="30" x2="310" y2="130" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="50" y1="30" x2="310" y2="30" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="44" y="34" font-size="11" fill="#1f2a44" text-anchor="end">180°</text>
  <text x="44" y="134" font-size="11" fill="#1f2a44" text-anchor="end">0°</text>
  <text x="310" y="147" font-size="11" fill="#1f2a44" text-anchor="middle">π / Ts</text>
  <text x="180" y="147" font-size="11" fill="#1f2a44" text-anchor="middle">frequency ω</text>
  <text x="150" y="70" font-size="11" fill="#1d6fd1">lag = ω Ts</text>
</svg>
```
:::
