---
id: l05-transfer-fcn-state-space-and-the-derivative-trap
title: Transfer Fcn, State-Space, and the Derivative trap
minutes: 22
covers:
  - Transfer Fcn and State-Space blocks
  - Why the Derivative block is a trap in a feedback loop
---

Try to work out how fast a car is going by watching its position on a phone map. The dot jumps around by a few meters every time it updates, even when the car sits still. If you divide a 3 m jump by the 0.1 s between updates, you get 30 m/s: highway speed, for a parked car. Positions that are almost right can give speeds that are wildly wrong. That is why a car has a speedometer that measures speed directly, instead of computing it from where the car is.

This lesson has two halves that meet at that idea. First, you will meet two blocks that hold a whole linear system in one box: **Transfer Fcn** and **State-Space**. They are the Simulink versions of the `tf` and `ss` objects from the last module. You will put last lesson's mass-spring-damper into each of them and check the answers against the primitive-block model and the exact formula from lesson 4.

Then you will meet the **Derivative** block. It sits in the same Continuous library, right next to the Integrator, and it looks like its twin. In a feedback loop it is the parked car doing 30 m/s. You will see exactly why, with numbers, and what flight control engineers use instead: a **filtered derivative** in a Transfer Fcn block, or a rate that is **measured** directly, the way a speedometer does it.

## Transfer Fcn: a whole system in one block

In lesson 2 you built a mass-spring-damper from a Sum, three Gains and two Integrators. In the last module you described the same system in one line, `tf(1, [1 0.4 4])`. The **Transfer Fcn** block, in the Continuous library, is that one line as a block.

A **[[transfer function|tf-reminder]]** is a ratio of two polynomials in $s$ that says how a linear system turns an input into an output. The block has two main parameters:

| Parameter | What you type | Meaning |
|---|---|---|
| Numerator coefficients | A row vector, such as `[1]` | Top polynomial, highest power of $s$ first |
| Denominator coefficients | A row vector, such as `[1 0.4 4]` | Bottom polynomial, highest power of $s$ first |

These are the same vectors you would give to `tf(num, den)`. The mass-spring-damper $\frac{1}{s^2 + 0.4s + 4}$ is Numerator `[1]`, Denominator `[1 0.4 4]`. The first-order lag from lesson 4, $\frac{2}{0.5s + 1}$, is Numerator `[2]`, Denominator `[0.5 1]`. The block draws the fraction on its face, so you can read the system off the diagram.

Two rules come with the block.

- **The states start at zero.** The Transfer Fcn block has no initial-condition setting. A system that must start away from rest belongs in a State-Space block, below.
- **It must be [[proper|proper]].** The numerator's highest power of $s$ may not be larger than the denominator's. Simulink rejects a Transfer Fcn whose top outranks its bottom. That rule will matter for derivatives.

::: key
The Transfer Fcn block holds a linear system as numerator and denominator coefficient vectors, in descending powers of $s$, exactly as in `tf(num, den)`. Its states start at zero, and the numerator's order may not exceed the denominator's.
:::

There is a cost to the single box. In the primitive-block model, the velocity $\dot{x}$ was a real signal leaving the first Integrator. You could log it, plot it, or feed it back. Inside a Transfer Fcn it is hidden: only the output comes out. Keep that in mind for the second half of the lesson.

## State-Space: the matrices as a block

The **State-Space** block holds the same kind of system in the matrix form you met as `ss(A, B, C, D)`:

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u, \qquad y = \mathbf{C}\mathbf{x} + \mathbf{D}u.
$$

Here $\mathbf{x}$ (bold x, "the state vector") lists the numbers the system remembers, $u$ is the input and $y$ the output. The block's parameters are named **A**, **B**, **C**, **D** and **Initial conditions**. Each field takes a matrix, an expression, or the name of a workspace variable.

For the mass-spring-damper, choose the state as position and velocity, $\mathbf{x} = [x;\ \dot{x}]$. Then read the matrices straight off the physics.

- The first row says "the rate of change of position is the velocity": $\dot{x} = 0 \cdot x + 1 \cdot \dot{x}$.
- The second row is Newton's law solved for acceleration: $\ddot{x} = -\frac{k}{m}x - \frac{c}{m}\dot{x} + \frac{1}{m}F$.

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -k/m & -c/m \end{bmatrix}, \quad
\mathbf{B} = \begin{bmatrix} 0 \\ 1/m \end{bmatrix}, \quad
\mathbf{C} = \begin{bmatrix} 1 & 0 \end{bmatrix}, \quad
\mathbf{D} = 0.
$$

With $m = 1$, $c = 0.4$ and $k = 4$, you type `[0 1; -4 -0.4]` for A, `[0; 1]` for B, `[1 0]` for C and `0` for D.

Two things the State-Space block can do that the Transfer Fcn cannot:

- **Start away from rest.** Initial conditions `[0.1; 0]` means the mass starts pulled out 0.1 m and held still.
- **Show its states.** Set C to `eye(2)` (the 2-by-2 identity matrix) and D to `[0; 0]`, and the output becomes a two-element vector: position and velocity, side by side on one line. The next lesson shows how to pull such a vector apart.

::: key
The State-Space block holds $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + \mathbf{D}u$ with parameters A, B, C, D and Initial conditions. Use it when the system needs nonzero initial states, several inputs or outputs, or states you want to see.
:::

::: example One spring, three models
Build the lesson 2 primitive model, a Transfer Fcn with `[1]` over `[1 0.4 4]`, and a State-Space block with the matrices above and zero initial conditions. Drive all three from the same Step block (Step time 0) and log each output.

**Step 1: what they should share.** All three describe $\ddot{x} + 0.4\dot{x} + 4x = F$. From lesson 4, the step response settles at 0.25 m and peaks at 0.4323 m at $t = 1.579$ s.

**Step 2: compare pairs.** Compute the largest difference between each pair and against the exact formula at the logged times, with RelTol $10^{-10}$ and AbsTol $10^{-12}$. All of them should agree to well under $10^{-6}$.

**Step 3: now start it pulled out.** Set the State-Space initial conditions to `[0.1; 0]` and the step's final value to 0, so there is no force. The mass is released from 0.1 m and rings down. The exact answer is the step formula's ringing part scaled by 0.1: $x(t) = 0.1\,e^{-0.2t}\left(\cos\omega_d t + \frac{0.1}{\sqrt{0.99}}\sin\omega_d t\right)$, with $\omega_d = 1.990\,\mathrm{rad/s}$.

**Step 4: the first swing.** At $t = \pi/\omega_d = 1.579$ s, the cosine is $-1$ and the sine is 0, so $x = 0.1 \times e^{-0.3157} \times (-1) = -0.0729\,\mathrm{m}$.

**Sanity check.** The mass swings through zero to the other side, reaching 73% of where it started, the same overshoot fraction as the step response. That fits: same spring, same damping ratio of 0.1. There is no way to run Step 3 in a Transfer Fcn block, because its states always start at zero.
:::

::: warning Same system, different states
If you convert a transfer function to state space in MATLAB with `ss(tf(1, [1 0.4 4]))`, the A, B, C, D you get may not be the position-and-velocity matrices above. Many different sets of matrices give the same input-output behavior, and the conversion picks one by its own rules, so its states may be scaled or reordered. The output $y$ will match. The individual states, and so the meaning of any initial conditions you type, may not. When the states must mean something physical, write the matrices yourself.
:::

## The Derivative block

The **Derivative** block, also in the Continuous library, outputs the rate of change of its input: $\frac{du}{dt}$, read "d u d t". It looks like the natural partner of the Integrator. It is not.

An Integrator has a state. The solver advances that state with all its error control. A Derivative has no state. It works out a slope by looking backward: it takes the change in its input since the solver's previous time step and divides by the time between them,

$$
\text{output} \approx \frac{\Delta u}{\Delta t} = \frac{u(t_k) - u(t_{k-1})}{t_k - t_{k-1}}.
$$

Read $\Delta u$ as "delta u", the change in $u$. This is a **[[finite difference|finite-difference]]**: the slope of a straight line between two nearby points. For a smooth signal and a small step, it is a fine estimate. Feedback loops rarely give it a smooth signal.

### Problem 1: noise gets bigger, and faster noise gets bigger still

Every real measurement carries **[[noise|sensor-noise]]**: small, fast, random wiggles on top of the true value. Differentiating a wiggle makes it bigger in proportion to how fast it wiggles. For a sine wave,

$$
\frac{d}{dt}\left(A\sin\omega t\right) = A\omega\cos\omega t.
$$

The height went from $A$ to $A\omega$. In transfer-function terms, a derivative is $s$, and its gain at frequency $\omega$ is $|j\omega| = \omega$. Double the frequency, double the gain, with no upper limit. A slow signal is shrunk or barely touched. Fast noise is blown up.

::: example A good attitude sensor, a bad rate
A vehicle's pitch angle swings slowly: amplitude 0.1 rad at 0.2 Hz. The attitude sensor adds noise with amplitude 0.001 rad at 50 Hz, a hundred times smaller than the signal.

**Step 1: turn hertz into rad/s.** Multiply by $2\pi$. The signal is at $\omega = 2\pi \times 0.2 = 1.257\,\mathrm{rad/s}$. The noise is at $2\pi \times 50 = 314.2\,\mathrm{rad/s}$.

**Step 2: the signal's rate.** $A\omega = 0.1 \times 1.257 = 0.126\,\mathrm{rad/s}$.

**Step 3: the noise's rate.** $A\omega = 0.001 \times 314.2 = 0.314\,\mathrm{rad/s}$.

**Step 4: compare.** In the angle, the noise was 1% of the signal. In the derivative, the noise is $0.314 / 0.126 = 2.5$ times the signal.

**Sanity check.** The noise is 250 times faster than the signal, so differentiating multiplies it 250 times more. $1\% \times 250 = 2.5$, which matches Step 4. A controller fed this "rate" would spend most of its effort chasing noise, and the actuator would buzz.
:::

### Problem 2: steps and jumps

A **discontinuity** is a sudden jump in a signal: a step command, a switch changing position, a sensor that resets. The true derivative of a jump is infinite for an instant. The Derivative block cannot output infinity. It outputs the jump divided by whatever time step the solver happened to take.

A jump of 1 over a step of 0.01 s gives a spike of 100. Over $10^{-4}$ s it gives $10^{4}$. Over $10^{-6}$ s it gives $10^{6}$. **The size of the spike depends on the solver, not on the physics.** A variable-step solver usually restarts with very small steps right after a jump, so it makes the spike especially big. In a loop, that spike goes straight to an actuator command.

### Problem 3: a variable-step solver with no state to control

A variable-step solver keeps each step's error small by checking its states. The Derivative block has no state for it to check. Its output depends on the size of the last step, and in a loop the next step size depends on signals the derivative drives. The two can chase each other: the solver takes a tiny step, the derivative jumps, the solver sees a fast change and takes another tiny step. Runs slow down, outputs get jagged, and two runs with different tolerances disagree for reasons that have nothing to do with the vehicle. That breaks the lesson 4 habit, where tightening the tolerance was supposed to make the answer settle down.

::: key
Avoid the Derivative block in a feedback loop. It differentiates numerically, amplifying high-frequency noise and behaving badly under variable-step solvers and at discontinuities. Use a filtered derivative, a state available from the model, or a state-space formulation instead.
:::

::: warning It looks harmless in a clean model
In a model with no noise, smooth inputs and a loose tolerance, a Derivative block can seem to work fine. The trouble shows up when you add sensor noise, a step command or a saturation, which is exactly when you start trusting the model. If a controller needs $\frac{du}{dt}$, design the rate in from the start.
:::

## What to use instead

### A filtered derivative in a Transfer Fcn

The fix for Problem 1 is a derivative that behaves like $s$ for slow signals and stops growing for fast ones:

$$
D(s) = \frac{s}{\tau s + 1}.
$$

Here $\tau$ ("tau") is a small **filter time constant** in seconds. At low frequency the $\tau s$ in the bottom is tiny, so $D(s) \approx s$: a true derivative. At high frequency $\tau s$ dominates, so $D(s) \approx \frac{s}{\tau s} = \frac{1}{\tau}$: a flat gain that stops growing. The **[[corner frequency|corner]]** where the change happens is $\omega = 1/\tau$.

In Simulink this is a Transfer Fcn block with Numerator `[1 0]` and Denominator `[tau 1]`. Top and bottom are both first order, so it is proper and the block accepts it. A pure $s$, Numerator `[1 0]` over Denominator `[1]`, is not proper, which is Simulink's way of telling you a pure derivative cannot be built as a transfer function.

With $\tau = 0.02$ s, so a corner at 50 rad/s, the gains compare like this:

| Frequency (rad/s) | Ideal derivative $\lvert j\omega \rvert$ | Filtered $\lvert D(j\omega) \rvert$ |
|---|---|---|
| 1 | 1 | 1.00 |
| 10 | 10 | 9.81 |
| 50 | 50 | 35.4 |
| 100 | 100 | 44.7 |
| 1000 | 1000 | 49.9 |

Slow signals get an honest derivative. Fast noise is capped at $1/\tau = 50$. In the attitude example, the 50 Hz noise's rate drops from 0.314 rad/s to 0.049 rad/s, while the 0.2 Hz signal's rate stays at 0.126 rad/s. The noise went from 2.5 times the signal to less than half of it.

The filter also has a state, so the solver's error control covers it. That fixes Problem 3. At a step it jumps to a large but finite value, $\Delta u/\tau$, set by $\tau$ and not by the solver's step size. That tames Problem 2.

::: note How to pick tau
Put the corner well above the frequencies the loop cares about and below the noise. A common rule is a corner 5 to 20 times the loop's **crossover frequency**, the frequency where the loop gain falls through 1, which you met with `margin` in the last module. The filter costs a little phase at crossover, about $\arctan(\omega_c \tau)$, where $\omega_c$ is the crossover frequency. For $\omega_c = 2.5\,\mathrm{rad/s}$ and $\tau = 0.02\,\mathrm{s}$, that is $\arctan(0.05) \approx 3°$, a small price. Simulink's PID Controller block builds this same filter into its derivative term; its filter coefficient N plays the role of $1/\tau$.
:::

### Measure the rate, or use a state you already have

The best derivative is one you never compute. A rocket's **[[rate gyro|rate-gyro]]** measures angular rate directly, the way a speedometer measures speed. In a model, the rate is often already there as a state: in the primitive mass-spring-damper, the velocity leaves the first Integrator as a clean signal. Feed that back instead of differentiating the position.

This also removes the **[[derivative kick|derivative-kick]]**. When the controller differentiates the error $e = r - \theta$ (reference minus angle), a step in the reference $r$ becomes a spike. When it uses the measured rate, $u = K_p(r - \theta) - K_d\,\omega$, a step in $r$ never passes through a derivative at all.

Last, a **state-space formulation** gets rates for free. If the controller or the estimator is written with rate as one of its states, as in the State-Space block above, the rate is an output of an integration, never of a differentiation.

::: example A pitch loop three ways
Model a vehicle's pitch as a pure inertia, $\theta = \frac{1}{s^2}\,u$ (angle is the double integral of the torque command, with the inertia scaled to 1). Close the loop with a proportional-derivative (PD) controller, $K_p = 4$, $K_d = 2$, and command a unit step in pitch.

**Step 1: ideal derivative on the error.** $u = K_p e + K_d \dot{e}$. The loop crosses over at $\omega_c = 2.54\,\mathrm{rad/s}$ with a **[[phase margin|phase-margin]]** of $51.8°$. The step response overshoots by 29.8%. But at the instant of the step, $\dot{e}$ is infinite in theory, and in Simulink it is $K_d$ times $1/\Delta t$, whatever the solver's step was.

**Step 2: filtered derivative, $\tau = 0.02\,\mathrm{s}$.** Replace $K_d s$ with $K_d \frac{s}{0.02s + 1}$. Crossover moves to 2.59 rad/s, the phase margin drops to $50.4°$, and the overshoot changes to 30.6%. The response differs from Step 1 by at most 0.033 rad. At the step, the derivative term jumps to $K_d/\tau = 2/0.02 = 100$: large, but finite and the same on every run.

**Step 3: measured rate.** $u = K_p(r - \theta) - K_d\,\omega$, with $\omega$ from a gyro (in the model, the output of the first Integrator). The closed loop becomes $\frac{4}{s^2 + 2s + 4}$: $\omega_n = 2$, $\zeta = 0.5$, and 16.3% overshoot. At the step, the torque command jumps only to $K_p \times 1 = 4$.

**Sanity check.** The filtered version is almost identical to the ideal one where it matters, costing 1.4° of margin. (The filter itself lags about 3° at crossover, as the "how to pick tau" note predicts; crossover also moved up a little, to where this loop has slightly more phase, so the net loss is smaller.) The rate-feedback version overshoots less because the reference no longer passes through the derivative, which is also why it asks the actuator for 4 instead of 100 or more at the step. That is the design most flight attitude loops use.
:::

## Check yourself

::: check
What do you type into a Transfer Fcn block for $G(s) = \frac{10}{s^2 + 3s + 10}$, and for $H(s) = \frac{5s + 1}{s + 4}$? Which one could not start from a nonzero state?
:::

::: answer
$G$: Numerator `[10]`, Denominator `[1 3 10]`. $H$: Numerator `[5 1]`, Denominator `[1 4]`, which is proper because both are first order. Neither can start from a nonzero state in a Transfer Fcn block, because its states always start at zero. To give either one initial conditions, write it as a State-Space block.
:::

::: check
Write A, B, C, D for a State-Space block holding $2\ddot{x} + 0.6\dot{x} + 8x = F$, with state $[x;\ \dot{x}]$, if you want both position and velocity out.
:::

::: answer
Divide by $m = 2$: $\ddot{x} = -4x - 0.3\dot{x} + 0.5F$. So A = `[0 1; -4 -0.3]`, B = `[0; 0.5]`. To output both states, C = `eye(2)` and D = `[0; 0]`. The output is a two-element vector, position first.
:::

::: check
A position sensor has noise of amplitude 0.002 m at 20 Hz. What amplitude does that noise have after an ideal derivative? After $\frac{s}{0.05s + 1}$?
:::

::: answer
$\omega = 2\pi \times 20 = 125.7\,\mathrm{rad/s}$. Ideal: $0.002 \times 125.7 = 0.251\,\mathrm{m/s}$. Filtered: $|D(j\omega)| = \frac{\omega}{\sqrt{1 + (\omega\tau)^2}} = \frac{125.7}{\sqrt{1 + 6.28^2}} = \frac{125.7}{6.36} = 19.8$, so $0.002 \times 19.8 = 0.040\,\mathrm{m/s}$. The filter cut the noise's rate by more than a factor of 6.
:::

::: check
Two runs of the same loop, one with RelTol $10^{-3}$ and one with $10^{-8}$, give very different torque spikes right after a step command. The loop contains a Derivative block. Explain what is happening.
:::

::: answer
The Derivative block outputs the change in its input divided by the solver's last time step. At a step, that is the jump divided by the step size. The tighter tolerance makes the solver take much smaller steps around the jump, so the same jump is divided by a smaller number and the spike is bigger. The spike measures the solver, not the vehicle. A filtered derivative or measured rate gives the same answer at any tolerance.
:::

::: check
Why can't you put a pure derivative, $s$, into a Transfer Fcn block, and what does that tell you?
:::

::: answer
As a Transfer Fcn it would be Numerator `[1 0]` over Denominator `[1]`: the top is first order and the bottom is zero order, so it is improper and the block rejects it. That reflects the physics: no real device has a gain that keeps growing with frequency forever. Adding a pole, $\frac{s}{\tau s + 1}$, makes it proper and caps the gain at $1/\tau$.
:::

## Summary

| Idea | Meaning | Formula or setting |
|---|---|---|
| Transfer Fcn block | A linear system as a ratio of polynomials | Numerator and Denominator coefficients, descending powers; zero initial states; must be proper |
| State-Space block | A linear system as matrices | A, B, C, D, Initial conditions; $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, $y = \mathbf{C}\mathbf{x} + \mathbf{D}u$ |
| Mass-spring-damper | State $[x;\ \dot{x}]$ | A = `[0 1; -k/m -c/m]`, B = `[0; 1/m]` |
| Derivative block | Finite difference between solver steps | $\Delta u / \Delta t$, no state |
| Noise gain of $s$ | Grows without limit | $\lvert j\omega \rvert = \omega$ |
| Filtered derivative | Derivative below $1/\tau$, flat above | $\frac{s}{\tau s + 1}$: Numerator `[1 0]`, Denominator `[tau 1]` |
| Measured rate | Feed back a gyro or a model state | $u = K_p(r - \theta) - K_d\,\omega$, no derivative kick |

The next lesson takes the two-element output of the State-Space block and asks what kind of line it is: a vector made by a Mux, or a bus with named parts, and why the difference matters the moment signals of different kinds share a wire.

::: context tf-reminder Where the s comes from
In the last module, $s$ stood for "take the derivative" after a Laplace transform turned calculus into algebra. A transfer function $\frac{1}{s^2 + 0.4s + 4}$ is the equation $\ddot{x} + 0.4\dot{x} + 4x = F$ rewritten as "output over input". Multiply out and each power of $s$ becomes a derivative again: $s^2$ is $\ddot{x}$, $s$ is $\dot{x}$. That is why an $s$ on top of the fraction means "differentiate the input" and an $s$ on the bottom means "integrate the output".
:::

::: context proper Why the top may not outrank the bottom
In a **proper** transfer function the numerator's degree is at most the denominator's, so as $\omega$ grows the gain settles to a constant or falls to zero. In an improper one, such as $s$ or $\frac{s^2}{s + 1}$, the gain grows forever with frequency. No physical device does that: every motor, sensor and amplifier runs out of speed somewhere. A block that promised it would need to know the future of its input, and a simulation only knows the past. So Simulink insists on proper transfer functions, and the filtered derivative is the smallest change that satisfies it.
:::

::: context finite-difference The slope of a chord
The Derivative block draws a straight line between the input at the last solver step and at this one and reports its slope. On a smooth curve with a small step, that line is nearly the tangent. Across a jump, the line is nearly vertical, and its slope is the jump divided by a tiny step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="170" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20,120 40,118 60,113 80,104 100,93 120,78 140,60 160,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="84" cy="101" r="4" fill="#b4232c"/>
  <circle cx="110" cy="83" r="4" fill="#b4232c"/>
  <line x1="60" y1="118" x2="140" y2="62" stroke="#b4232c" stroke-width="1.5"/>
  <text x="95" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">smooth: chord close to tangent</text>
  <line x1="200" y1="130" x2="350" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="200,110 272,110 272,40 350,40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="268" cy="110" r="4" fill="#b4232c"/>
  <circle cx="276" cy="40" r="4" fill="#b4232c"/>
  <line x1="266" y1="126" x2="278" y2="24" stroke="#b4232c" stroke-width="1.5"/>
  <text x="275" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">jump: slope = jump / tiny step</text>
</svg>
```
:::

::: context sensor-noise Where the wiggles come from
Sensor noise has many sources. Electronics add random thermal noise. A digital sensor rounds each reading to its smallest step, which adds a tiny staircase error. On a rocket, engine vibration shakes every sensor at tens to hundreds of hertz, and the structure bends at its own frequencies. All of these are fast compared with the vehicle's attitude motion, which is exactly the part of the spectrum a derivative amplifies most. A good model adds noise on purpose, so that a controller that only works on clean signals is caught on the desk, not in flight.
:::

::: context corner Reading the filtered derivative's gain
On a log-log plot of gain against frequency, a pure derivative is a straight line climbing forever. The filtered derivative follows it up to the corner at $1/\tau$, then bends over and flattens at $1/\tau$. Everything to the right of the corner, where sensor noise lives, gets a fixed gain instead of a growing one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="145" x2="340" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="145" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="163" font-size="11" fill="#1f2a44" text-anchor="middle">frequency (log): 1, 10, 100, 1000 rad/s</text>
  <text x="14" y="80" font-size="11" fill="#1f2a44" transform="rotate(-90 14 80)" text-anchor="middle">gain (log)</text>
  <line x1="40" y1="130" x2="310" y2="22" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline points="40,130 50,126 60,122 70,118 80,114 90,110 100,106 110,102 120,98 130,94 140,91 150,87 160,83 170,80 180,77 190,75 200,73 210,72 220,71 230,70 240,70 250,69 260,69 270,69 280,69 290,69 300,69 310,69" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="193" y1="145" x2="193" y2="75" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="193" y="56" font-size="11" fill="#b4232c" text-anchor="middle">1/tau = 50</text>
  <text x="300" y="18" font-size="11" fill="#6c7a93" text-anchor="end">pure s</text>
  <text x="310" y="86" font-size="11" fill="#1d6fd1" text-anchor="end">s/(tau s + 1)</text>
</svg>
```

The picture uses $\tau = 0.02\,\mathrm{s}$. The dashed line climbs one decade of gain for every decade of frequency. The blue curve bends at 50 rad/s and flattens at a gain of 50.
:::

::: context rate-gyro Measuring rate instead of computing it
A rate gyro measures how fast the vehicle is rotating, in rad/s or deg/s, directly. Launch vehicles and spacecraft carry them in an inertial measurement unit alongside accelerometers. The attitude controller takes the angle from the navigation filter and the rate from the gyros, so it never has to differentiate a noisy angle. When a model has a gyro block, the rate feedback in the controller should come from it, not from a Derivative block on the angle.
:::

::: context derivative-kick The spike at every new command
Controllers that differentiate the error produce a huge output the instant the reference changes, because the error jumps. Control engineers call this derivative kick. On a real vehicle it slams the actuator to its limit at every new command, which wastes hydraulic power and can excite structural modes. The standard fix is "derivative on measurement": differentiate (or measure) only the vehicle's output, which moves smoothly, and leave the step in the reference to the proportional term.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="44" font-size="12" fill="#1f2a44">r</text>
  <line x1="22" y1="40" x2="62" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="68,40 60,36 60,44" fill="#1f2a44"/>
  <circle cx="78" cy="40" r="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="88" y1="40" x2="116" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <rect x="116" y="26" width="44" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="138" y="45" font-size="12" fill="#1f2a44" text-anchor="middle">Kp</text>
  <line x1="160" y1="40" x2="186" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="196" cy="40" r="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="206" y1="40" x2="236" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="242,40 234,36 234,44" fill="#1f2a44"/>
  <rect x="242" y="24" width="60" height="32" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="272" y="44" font-size="12" fill="#1f2a44" text-anchor="middle">vehicle</text>
  <line x1="302" y1="34" x2="344" y2="34" stroke="#1f2a44" stroke-width="2"/>
  <text x="330" y="28" font-size="11" fill="#1f2a44">angle</text>
  <line x1="302" y1="48" x2="330" y2="48" stroke="#1d6fd1" stroke-width="2"/>
  <text x="326" y="76" font-size="11" fill="#1d6fd1" text-anchor="end">gyro</text>
  <line x1="330" y1="48" x2="330" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="96" x2="236" y2="96" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="230,96 238,92 238,100" fill="#1d6fd1"/>
  <rect x="186" y="84" width="44" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="208" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">Kd</text>
  <line x1="196" y1="84" x2="196" y2="56" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="196,50 192,58 200,58" fill="#1d6fd1"/>
  <text x="202" y="72" font-size="13" fill="#b4232c">−</text>
  <line x1="344" y1="34" x2="352" y2="34" stroke="#1f2a44" stroke-width="2"/>
  <line x1="352" y1="34" x2="352" y2="126" stroke="#1f2a44" stroke-width="2"/>
  <line x1="352" y1="126" x2="78" y2="126" stroke="#1f2a44" stroke-width="2"/>
  <line x1="78" y1="126" x2="78" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="78,50 74,58 82,58" fill="#1f2a44"/>
  <text x="84" y="72" font-size="13" fill="#b4232c">−</text>
</svg>
```

The step in r reaches the torque only through Kp. The damping comes from the measured rate, which has no step in it.
:::

::: context phase-margin A reminder of what the margin measures
Phase margin, from the `margin` command in the last module, is how much extra phase lag the loop could take at its crossover frequency before it would oscillate without stopping. Flight control teams typically want at least about 30 to 45 degrees. Every filter, delay and sample-and-hold eats some of it, which is why the cost of the derivative filter is checked in degrees at crossover, not guessed.
:::
