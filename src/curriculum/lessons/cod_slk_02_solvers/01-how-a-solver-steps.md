---
id: l01-how-a-solver-steps
title: 'How a solver steps: fixed or variable'
minutes: 24
covers:
  - 'Variable-step versus fixed-step: error control and zero-crossing detection versus determinism'
---

Picture two people walking the same rocky trail. The first walks to a metronome: one stride every second, each stride the same length, whether the ground is flat pavement or loose rocks. The second is a careful hiker. On the pavement she takes long strides. At the rocks she slows down, tests each foothold, and if a foot slips she pulls it back and tries a shorter step.

The careful hiker is much less likely to fall. But ask her before she starts, "How many steps will this take?", and she cannot tell you. It depends on the rocks. The metronome walker can tell you to the step, because she never changes. Neither one is the better walker. They are good at different things.

A Simulink model has a walker too. It is the **solver**, the numerical method that moves the model forward in time. In the Python integration module you wrote Euler and RK4 loops and called `solve_ivp`. Simulink's solvers are the same kind of machine, and they come in the same two families as the walkers: **fixed-step** solvers, which march with a constant step, and **variable-step** solvers, which choose each step to meet an accuracy target. Which family you pick is the most important setting in a model, and "fixed-step or variable-step, and why?" is a favorite GNC interview question. This lesson shows what each family does inside one step, and what it buys and costs.

## What one step does

A Simulink model remembers some numbers from one moment to the next. Each Integrator block's output is one of them, and so is each state inside a Transfer Fcn or State-Space block. These remembered numbers are the model's **[[states|state]]**, written together as $x$. The rest of the diagram is a recipe that says how fast each state is changing right now. Written as math:

$$
\dot{x} = f(t, x)
$$

Read it as "x dot equals f of t and x": the rate of change of the states is some function of the time and the states themselves. For a first-order lag with time constant $\tau$ ("tau") chasing a command $r$, the recipe is $f = (r - x)/\tau$.

The solver's job is to turn "how fast is it changing now" into "where will it be a little later". A **step** moves the clock from $t_n$ to $t_{n+1} = t_n + h$, where $h$ is the **step size**, measured in seconds. The simplest rule is Euler's, which you met in Python:

$$
x_{n+1} = x_n + h\, f(t_n, x_n)
$$

Take the slope at the start of the step and walk along it for $h$ seconds. RK4 is smarter. It asks for the slope four times inside the step and blends the four answers.

Every time the solver asks for a slope, Simulink runs through the blocks in order and works out $f$. That pass through the diagram is a **derivative evaluation**, and it is the unit of cost for a solver. So "RK4 does four evaluations per step" means four trips through the whole diagram.

Those in-between visits have a name. The moments where the solver asks for slopes inside a step are **[[minor time steps|minor-steps]]**. The moment the step is finished and the new state is kept is a **major time step**. Only major time steps count as "the simulation was here": a Scope or To Workspace block records at major steps, and discrete blocks update their values only at major steps.

::: key
A solver advances the states $x$ of $\dot{x} = f(t, x)$ from one major time step to the next. Its cost is counted in derivative evaluations, each one a pass through the whole diagram.
:::

## Fixed-step: the metronome

A **fixed-step solver** uses the same step size $h$ from start to finish. You choose it. In Simulink it is the **Fixed-step size** box on the Solver pane of Configuration Parameters, and the same settings can be made from a script:

```matlab
set_param(mdl, 'SolverType', 'Fixed-step', 'Solver', 'ode4', ...
               'FixedStep', '0.001', 'StopTime', '60');
```

Here `mdl` holds the model's name. `ode4` is Simulink's fixed-step version of the classic RK4 method, and `ode1` is Euler. The whole family, from `ode1` to `ode14x`, is the subject of lesson 4.

Three things follow from a constant step.

1. **The work is known in advance.** The number of steps is (stop time − start time) / $h$. Each step of an explicit method like `ode4` does the same number of derivative evaluations. Multiply, and you have the total before the run starts.
2. **There is no error check.** The solver never asks whether a step was accurate. If $h$ is too big for the fastest thing in the model, the answer is quietly wrong, or it grows without limit. Nothing warns you. Lesson 4 shows how to find the largest safe $h$.
3. **The clock only stops on the grid.** The solver visits $0, h, 2h, 3h, \ldots$ and nothing in between. Something that happens between two grid points is noticed at the next one, up to one whole step late.

The prize for putting up with 2 and 3 is **[[determinism|determinism]]**: run the model a thousand times, with any inputs, and it takes the same steps in the same order with the same amount of work each time.

::: example Counting the work of a fixed-step run
A 60 s simulation of a spacecraft's attitude loop runs with `ode4` at $h = 1\,\mathrm{ms}$. How much work is that?

**Step 1: count the steps.** $60 / 0.001 = 60{,}000$ steps.

**Step 2: count the evaluations.** `ode4` asks for four slopes per step, so $4 \times 60{,}000 = 240{,}000$ derivative evaluations.

**Step 3: the work per step.** Every step is four evaluations. No step is ever more.

**Sanity check.** Change the command, add a disturbance, start from a different attitude: the numbers stay 60,000 and 240,000. They depend only on the stop time and $h$, never on what the signals do. That is the property the next sections keep coming back to.
:::

## Variable-step: the careful hiker

A **variable-step solver** picks every step itself. Its goal is to keep the error made in each step below a limit you set, called the **tolerance**, and to use the biggest step that does so.

It needs to know the error of a step it has not checked against any right answer. The trick is to compute the step twice, with two methods of different accuracy, from the same slope evaluations. The more accurate answer is close to the truth, so the gap between the two answers is a good estimate of the error in the less accurate one. This is an **[[embedded pair|embedded-pair]]**. The steps of the loop are:

1. Try a step of size $h$ and compute both answers.
2. Their difference is the **error estimate**.
3. If the estimate is at or below the tolerance, **accept**: keep the better answer and move the clock forward.
4. If it is above, **reject**: throw the step away, stay at the same time, and try again with a smaller $h$.
5. Either way, pick the next $h$ from how the estimate compared with the tolerance.

Here is the whole idea in about twenty lines of Python. The pair is Euler (order 1) inside Heun's method (order 2), which shares Euler's first slope. It solves a lag with $\tau = 0.5\,\mathrm{s}$ chasing a command of 1, for 5 s, with a tolerance of $10^{-3}$, and it starts by rashly trying a 1 s step.

```python
import math

def f(t, x):
    return (1.0 - x) / 0.5        # a lag with time constant 0.5 s, chasing 1

t, x, h, tol = 0.0, 0.0, 1.0, 1e-3
accepted, rejected, steps = 0, 0, []
while t < 5.0:
    h = min(h, 5.0 - t)                # never step past the stop time
    k1 = f(t, x)                       # slope at the start
    k2 = f(t + h, x + h * k1)          # slope at the Euler guess
    x_euler = x + h * k1               # order-1 answer
    x_heun = x + h * (k1 + k2) / 2     # order-2 answer
    err = abs(x_heun - x_euler)        # the error estimate
    if err <= tol:
        t, x = t + h, x_heun           # accept: move forward
        accepted += 1
        steps.append(h)
    else:
        rejected += 1                  # reject: stay put, retry smaller
    h = 0.9 * h * math.sqrt(tol / max(err, 1e-16))

print(accepted, rejected)                  # 56 1
print(round(steps[0], 4), round(max(steps), 4))   # 0.0201 0.6495
print(round(x, 5), round(1 - math.exp(-10), 5))  # 0.99984 0.99995
```

Read the output line by line. The first 1 s step was rejected, and the solver retried at about 0.020 s. At the start the lag is changing fastest, so the steps are small. As the output settles toward 1, the curve flattens and the steps stretch out, up to 0.65 s, about 32 times the first one. The finished run took 56 accepted steps and one rejection, and it ends within about $10^{-4}$ of the exact answer $1 - e^{-10}$.

The last line of the loop is the **[[step-size rule|step-size-rule]]**. For an estimate that behaves like $h^{p+1}$, where $p$ is the order of the lower method, it reads

$$
h_{\text{new}} = 0.9\, h \left( \frac{\text{tol}}{\text{err}} \right)^{1/(p+1)}
$$

Read it as "the new step is 0.9 times the old step times the tolerance-over-error ratio, to the power one over p plus one". Here $p = 1$, so the power is $\tfrac{1}{2}$, a square root. If the error came out four times too big, the step shrinks by $\sqrt{4} = 2$ (and then by the 0.9 safety factor). If it came out four times smaller than allowed, the step grows by 2. The 0.9 aims a little under the limit so that the next step is less likely to be rejected, since a rejection wastes every evaluation it made.

Simulink's default solver, `ode45`, runs exactly this loop with a fourth-order and a fifth-order method in place of Euler and Heun. Its tolerance is set by two numbers, **RelTol** and **AbsTol**. Lesson 2 opens up `ode45` and its cousins and shows how to set those two numbers. There is one more rule: when a model has discrete blocks, a variable-step solver makes sure it takes a major step at every moment they are due to update.

::: warning Rejected steps cost real time
Every derivative evaluation a rejected step made is thrown away. A model that rejects many steps, for example because a signal keeps jumping, can be slow even when its accepted step count looks modest. Lesson 9's Solver Profiler shows where rejections happen.
:::

## Events: landing on the corner

Some things in a model happen at an instant: a landing leg touches the ground, a valve slams shut, a signal hits a Saturation limit. At that instant the recipe $f$ changes abruptly. A solver that steps over the instant blends "before" and "after" into one smeared step.

A variable-step solver can do better. Simulink gives it a **[[zero-crossing|zero-crossing]]** signal for each such event, a number that changes sign exactly when the event happens (for a landing leg, its height above the ground). After each step the solver checks whether any of these signals changed sign. If one did, it searches back inside the step for the moment of the crossing, ends the step exactly there, and restarts from the new situation. This is **zero-crossing detection**. Lesson 5 covers how the search works and how it can go wrong.

A fixed-step solver cannot shorten a step to land on the crossing. It finds out at the next grid point, when the leg is already below the ground.

::: example A landing-leg drop test
A landing leg is dropped from $2\,\mathrm{m}$ with $g = 9.80665\,\mathrm{m/s^2}$. When does it touch the ground, and how well does each kind of solver find that moment?

**Step 1: the exact answer.** Falling from rest, the height is $y = 2 - \tfrac{1}{2} g t^2$. Setting $y = 0$ gives $t = \sqrt{2 \times 2 / 9.80665} = 0.63866\,\mathrm{s}$, at a speed of $g t = 6.26\,\mathrm{m/s}$.

**Step 2: variable-step without event detection.** A Python run with a Dormand–Prince pair (the `ode45` method) and a tolerance of $10^{-3}$ took steps at 0.0001, 0.0011, 0.011, 0.113 and then 1.132 s. The motion is a parabola, which the method follows exactly, so the error estimate stays tiny and the steps grow tenfold each time. The step from 0.113 s to 1.132 s jumps straight over the touchdown. At 1.132 s the model thinks the leg is at $2 - \tfrac{1}{2}(9.80665)(1.132)^2 = -4.28\,\mathrm{m}$, deep underground, with no bounce ever happening.

**Step 3: variable-step with event detection.** Same solver, same tolerance, now watching $y$ for a sign change. It stopped at $t = 0.63866\,\mathrm{s}$, matching the exact answer to about $10^{-16}$ s, the limit of double precision, in 5 steps.

**Step 4: fixed step.** With $h = 0.01\,\mathrm{s}$ the grid points are 0.63 and 0.64 s. The leg is still above ground at 0.63 s, so the contact is noticed at 0.64 s: 1.34 ms late, with the leg $8.4\,\mathrm{mm}$ below ground. With $h = 0.001\,\mathrm{s}$ it is noticed at 0.639 s: 0.34 ms late and 2.1 mm deep.

**Sanity check.** The fixed-step lateness is always less than one step, as it must be, and shrinks as $h$ shrinks. The depth is roughly speed × lateness: $6.26 \times 0.00134 = 0.0084\,\mathrm{m}$. The numbers agree.
:::

A few millimeters sound harmless, but a contact model pushes back with a stiff spring, so a leg that starts its push 8 mm deep gets far too much force. That is why desktop landing and staging simulations use event detection. Simulink also offers a bounded form of zero-crossing detection for fixed-step real-time runs, which lesson 5 explains.

## The tradeoff: error control versus determinism

Put the two walkers side by side.

| | Fixed-step | Variable-step |
|---|---|---|
| Step size | constant, chosen by you | chosen each step by the solver |
| Error control | none | error estimate checked against a tolerance |
| Events | noticed at the next grid point | located by zero-crossing detection |
| Work per run | known in advance | depends on what the signals do |
| Work per step | constant and bounded | varies, plus rejected steps |

::: key
Variable-step versus fixed-step, the defining difference: variable-step solvers adapt the step to keep an error estimate within tolerance and can locate zero crossings exactly. Fixed-step solvers take a constant step with no error control and no exact event location, but with deterministic, bounded per-step cost.
:::

On a desktop, the variable-step solver's habits are all good news. It spends effort where the model is busy, coasts where it is quiet, and lands on events. A launch simulation that tracks both position and attitude, or a detailed model of the real vehicle that a controller is tested against, is usually run variable-step.

On a flight computer, the same habits are a problem. Flight software runs in **frames**: every 10 ms, say, the computer reads the sensors, runs guidance, navigation and control, and sends commands to the actuators, and it must be finished before the next frame starts. The number that matters is the **[[worst-case execution time|wcet]]**, the longest a frame can ever take. A variable-step solver has no worst case you can write down, because the number of steps it takes, and so its running time, depends on the data.

::: example Same model, three different workloads
The attitude loop from the first example (natural frequency $2\,\mathrm{rad/s}$, damping ratio 0.7) was simulated for 60 s in Python with a Dormand–Prince solver, a tolerance of $10^{-3}$, and a 1.2 s step cap. Only the commands changed.

**Holding still.** No command. 57 steps, 344 derivative evaluations.

**One 0.1 rad slew at $t = 0$.** 62 steps, 398 evaluations.

**Ten slews, one every 6 s, alternating direction.** 161 steps, 1112 evaluations.

**Compare.** The busiest run did about 3.2 times the work of the quietest ($1112 / 344 = 3.2$). Someone else's inputs could make it more. The fixed-step `ode4` run from the first example does far more, 240,000 evaluations, but the same 240,000 every time, whatever the commands.

**Sanity check.** Each maneuver starts a transient that forces the solver down to small steps for a while. Work that grows with activity is the solver behaving as designed, and exactly what a frame budget cannot allow.
:::

::: key
Why can a variable-step model not be deployed to an embedded target? Because the number of steps and hence the execution time depends on the data, so no worst-case timing bound exists. Real-time execution needs a constant per-cycle budget, which is what fixed-step gives.
:::

This is also why the code generators that turn a Simulink model into flight software, such as Embedded Coder, insist on a fixed-step solver. Most real flight code goes one step further and has no continuous states at all: the controller is written in discrete time from the start. Lesson 9 turns that into a rule for deployable models, and the code-generation module comes back to it.

So a GNC team usually keeps both. A variable-step run with tight tolerances is the **reference**, the best answer the desktop can give. The fixed-step version, the one that will become flight code or run on a real-time test rig, is checked against it. If they disagree by more than the requirement allows, the fixed step is too big or an event is being missed.

::: warning A clean fixed-step plot is not a verified answer
A fixed-step solver never reports an error, so a smooth, sensible-looking plot proves nothing about accuracy. Always compare it with a variable-step run at tight tolerance (lesson 4 of the previous module showed how), and halve $h$ to see whether the answer moves. If halving $h$ changes the result, the step was too big.
:::

In Simulink, a new model starts as variable-step with the solver set to `auto`, and Simulink picks one for you when the model compiles. For most models with continuous states it picks `ode45`. To choose yourself:

```matlab
set_param(mdl, 'SolverType', 'Variable-step', 'Solver', 'ode45');
get_param(mdl, 'Solver')      % returns 'ode45'
```

## Check yourself

::: check
In your own words, what is the difference between a major time step and a minor time step? At which one does a To Workspace block record?
:::

::: answer
A minor time step is a point inside a step where the solver asks for the slope, like the extra slope samples of RK4. It is part of the arithmetic, not a place the simulation "stops". A major time step is where the step is finished and the new state is kept. To Workspace, Scopes and discrete blocks act only at major time steps, so the logged times are the major steps.
:::

::: check
A fixed-step `ode4` run covers 20 s with $h = 0.5\,\mathrm{ms}$. How many steps and derivative evaluations does it take? If a colleague adds a disturbance input, what happens to these numbers?
:::

::: answer
Steps: $20 / 0.0005 = 40{,}000$. `ode4` does four evaluations per step, so $4 \times 40{,}000 = 160{,}000$ evaluations. Adding a disturbance changes neither number. Fixed-step work depends only on the time span and the step size, not on the signals. (The disturbance might make the answer less accurate, but the solver would not know.)
:::

::: check
In the Python adaptive stepper, an attempted step gives an error estimate of $4 \times 10^{-3}$ with a tolerance of $10^{-3}$ and a step of 0.2 s. Is the step accepted? What step does the rule try next?
:::

::: answer
The estimate is four times the tolerance, so the step is rejected: the clock stays where it was. The rule gives $h_{\text{new}} = 0.9 \times 0.2 \times \sqrt{10^{-3} / (4 \times 10^{-3})} = 0.9 \times 0.2 \times 0.5 = 0.09\,\mathrm{s}$. The square root comes from the lower method being order 1, so the error grows like $h^2$: halving the step cuts the error by four, which is what was needed, and the 0.9 aims a little below that.
:::

::: check
A lander touches down at $t = 12.3456\,\mathrm{s}$ while descending at $2\,\mathrm{m/s}$. A fixed-step simulation uses $h = 4\,\mathrm{ms}$. What is the latest it could notice the touchdown, and about how deep below the surface could the foot be by then?
:::

::: answer
At most one step late: 4 ms. (The grid points are multiples of 0.004 s; the first one after 12.3456 s is 12.348 s, which is 2.4 ms late in this case.) The worst-case depth is speed times lateness, $2 \times 0.004 = 0.008\,\mathrm{m}$, or 8 mm. For this touchdown time it is $2 \times 0.0024 = 4.8\,\mathrm{mm}$. A variable-step solver with zero-crossing detection would stop at 12.3456 s itself.
:::

::: check
Your team lead says, "The variable-step model runs ten times faster than real time on my laptop, so let's run it on the flight computer." Give two reasons this is wrong.
:::

::: answer
First, running faster than real time on average says nothing about the worst frame. The step count depends on the data, so during a violent maneuver or a burst of events the solver could take many small steps and rejections and blow the frame deadline. Without a worst-case execution time there is nothing to check the schedule against. Second, the flight software toolchain will not accept it: code generators such as Embedded Coder require a fixed-step solver, because generated code must do a fixed, bounded amount of work each cycle.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Solver | Moves the states of $\dot{x} = f(t,x)$ forward in time | One derivative evaluation is one pass through the diagram |
| Major and minor steps | Kept results versus in-between slope samples | Logging and discrete updates happen at major steps |
| Fixed-step | Constant $h$ chosen by you | Steps = time span / $h$; no error control; events noticed up to one step late |
| Variable-step | Solver picks $h$ each step | Embedded pair gives an error estimate; accept or reject |
| Step-size rule | $h_{\text{new}} = 0.9\,h\,(\text{tol}/\text{err})^{1/(p+1)}$ | Shrinks after a big error, grows after a small one |
| Zero-crossing detection | Search for the instant a signal changes sign | Variable-step lands on the event; fixed-step cannot |
| Determinism | Same steps, same work, every run | Needed for a bounded worst-case execution time |
| Deployment | Flight code runs in fixed frames | Variable-step cannot be deployed; fixed-step can |

Next lesson: inside the variable-step family. You will meet `ode45`, `ode23` and `ode113`, see why their orders make them cheap or expensive at different accuracies, and learn to set RelTol, AbsTol and the maximum step size so the solver's error estimate measures what you actually care about.

::: context state What Simulink remembers
A state is a number the model must remember from one moment to the next because the future depends on it. A falling ball's height and speed are states: knowing them now tells you everything about the next instant. In a Simulink diagram, every Integrator block holds one state per signal element, and a Transfer Fcn block of order $n$ holds $n$. A Gain or Sum holds none: its output depends only on its inputs right now. Counting a model's continuous states tells you the size of the problem the solver faces.
:::

::: context minor-steps Inside one step of RK4
RK4 samples the slope four times per step: once at the start, twice at the middle (using two different guesses of the midpoint state), and once at the end. Those four samples are the minor time steps. The final state, a weighted blend of all four, is kept at the major time step. Simulink runs the blocks at every minor step, but a Scope only sees the major steps, so a spike that lives only between them never appears on a plot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="330" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="80" x2="60" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="300" y1="80" x2="300" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="118" font-size="12" fill="#1f2a44" text-anchor="middle">t_n (major)</text>
  <text x="300" y="118" font-size="12" fill="#1f2a44" text-anchor="middle">t_n + h (major)</text>
  <circle cx="60" cy="60" r="6" fill="#1d6fd1"/>
  <circle cx="176" cy="45" r="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <circle cx="184" cy="45" r="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <circle cx="300" cy="60" r="6" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="60" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">k1</text>
  <text x="180" y="28" font-size="11" fill="#1f2a44" text-anchor="middle">k2, k3</text>
  <text x="300" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">k4</text>
  <text x="180" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">minor steps: slope samples</text>
</svg>
```

The dark dot is the kept state at the start; the light dots are slope samples. The next dark dot will be placed at $t_n + h$ once the step is accepted.
:::

::: context determinism Same inputs, same bits
A deterministic program, given the same inputs, does the same operations in the same order and produces the same outputs, bit for bit, every time it runs on the same platform. Engineers value this for more than timing. When a hardware-in-the-loop test fails at 3 a.m., a deterministic model lets you replay the exact run and watch the failure again. When the generated flight code is compared with the model, a deterministic step means the two can be checked value by value. A fixed-step solver does its part by never letting the data change how many steps are taken or where they fall.
:::

::: context embedded-pair Two answers for the price of one
Running a step twice with two unrelated methods would double the cost. The clever part of an embedded pair is that the two methods share their slope evaluations and differ only in how they weight them at the end. So the second answer costs almost nothing. In the Python loop, Euler uses `k1` alone and Heun uses `k1` and `k2`: one extra evaluation buys both an order-2 answer and an error estimate. Keeping the more accurate answer while using the gap to judge the less accurate one is called **local extrapolation**, and `ode45` does the same with its fourth- and fifth-order results.
:::

::: context step-size-rule Where the power comes from
For a method of order $p$, the error made in one step grows like $C h^{p+1}$ for some number $C$ that depends on the curve. If a step of size $h$ produced error $\text{err}$, then $C \approx \text{err}/h^{p+1}$. The step that would produce exactly the tolerance satisfies $C h_{\text{new}}^{p+1} = \text{tol}$. Divide the two equations and take the $(p+1)$-th root: $h_{\text{new}} = h\,(\text{tol}/\text{err})^{1/(p+1)}$. The 0.9 in front is a safety margin, because $C$ changes a little from one step to the next. Real solvers also cap how much $h$ may grow or shrink at once, so one odd step cannot throw the step size wildly.
:::

::: context zero-crossing Stepping over the ground
Without event detection, a solver judges only the ends of each step. If the curve is smooth at both ends, it has no reason to suspect anything happened in between, even though the leg passed through the ground. The zero-crossing signal, here the height, gives it a sign to check: positive before, negative after, so a crossing lies inside the step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="95" x2="340" y2="95" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="336" y="88" font-size="11" fill="#6c7a93" text-anchor="end">ground, y = 0</text>
  <path d="M40,25 Q150,25 250,140" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="110" cy="37" r="5" fill="#1f2a44"/>
  <circle cx="250" cy="140" r="5" fill="#b4232c"/>
  <line x1="110" y1="37" x2="250" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="206" cy="95" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="110" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">step starts, y &gt; 0</text>
  <text x="244" y="128" font-size="11" fill="#b4232c" text-anchor="end">step ends, y &lt; 0</text>
  <text x="216" y="112" font-size="11" fill="#1f2a44">crossing found here</text>
</svg>
```

The sign change between the two dark and red dots tells the solver to search back for the orange point and end the step there.
:::

::: context wcet The number a flight computer is scheduled around
Worst-case execution time, or WCET, is the longest a piece of code can take on a given processor, over every possible input. Flight software is scheduled against it: if the control task's WCET is 3 ms and the frame is 10 ms, there is room for navigation and telemetry in the rest. Engineers estimate WCET by measurement and by analysis tools, and certification standards for flight software expect timing to be shown, not hoped for. A loop whose number of iterations depends on the data, like an adaptive solver's accept-and-reject loop, makes a WCET impossible to state.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="20" font-size="11" fill="#1f2a44">fixed-step: same work every 10 ms frame</text>
  <rect x="10" y="28" width="340" height="30" fill="none" stroke="#1f2a44"/>
  <line x1="95" y1="28" x2="95" y2="58" stroke="#1f2a44"/><line x1="180" y1="28" x2="180" y2="58" stroke="#1f2a44"/><line x1="265" y1="28" x2="265" y2="58" stroke="#1f2a44"/>
  <rect x="10" y="30" width="30" height="26" fill="#1d6fd1"/><rect x="95" y="30" width="30" height="26" fill="#1d6fd1"/><rect x="180" y="30" width="30" height="26" fill="#1d6fd1"/><rect x="265" y="30" width="30" height="26" fill="#1d6fd1"/>
  <text x="10" y="88" font-size="11" fill="#1f2a44">variable-step: work depends on the data</text>
  <rect x="10" y="96" width="340" height="30" fill="none" stroke="#1f2a44"/>
  <line x1="95" y1="96" x2="95" y2="126" stroke="#1f2a44"/><line x1="180" y1="96" x2="180" y2="126" stroke="#1f2a44"/><line x1="265" y1="96" x2="265" y2="126" stroke="#1f2a44"/>
  <rect x="10" y="98" width="14" height="26" fill="#8fb8f0"/><rect x="95" y="98" width="40" height="26" fill="#8fb8f0"/><rect x="180" y="98" width="100" height="26" fill="#b4232c"/><rect x="280" y="98" width="20" height="26" fill="#8fb8f0"/>
  <text x="230" y="143" font-size="11" fill="#b4232c" text-anchor="middle">overruns the frame</text>
</svg>
```

Each box is one frame; the colored bar is the time the solver used. In the lower row a busy frame spills into the next one.
:::
