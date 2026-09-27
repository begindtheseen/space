---
id: l04-fixed-step-solvers
title: 'Fixed-step solvers: ode1 to ode8, and the step that keeps a loop stable'
minutes: 24
covers:
  - 'Fixed-step solvers: ode1 (Euler), ode2, ode4 (classic RK4), ode5, ode8, ode14x, ode1be'
---

Think of a drummer keeping time for a band. A jazz drummer can speed up and slow down with the music. A drummer in a marching band cannot: every step lands on the beat, because a hundred people are walking in step behind them. The marching drummer gives up flexibility and gets something more valuable in return — everyone knows exactly when the next beat comes.

Lesson 1 showed that a variable-step solver is the jazz drummer. It stretches and shrinks its step to keep an error estimate inside tolerance, and lessons 2 and 3 met the members of that band: ode45, ode23, ode113 and the stiff solvers. A **fixed-step solver** is the marching drummer: it advances time by the same step $h$ every time, with no error control and no stretching. That is what a flight computer does. Its control loop runs every 20 ms, forever, and the code inside must finish in that slot every time.

This lesson meets the fixed-step family by name, then answers the question that decides whether a fixed-step model is any good: how large can the step be before the simulation blows up? You will see the same model explode under one solver and settle under another, and find the largest step a 50 Hz control loop can live with.

## The family by name

Every fixed-step solver in Simulink has the same job. Given the state now, it takes one step of length $h$ and returns the state at the next beat. They differ in how many times per step they ask the model for its derivatives, and how cleverly they combine the answers.

One call to the model for its derivatives is called a **[[stage|stage]]** (or a derivative evaluation). More stages cost more computer time per step, but buy a higher **order** — a number $p$ that says how fast the error shrinks as the step shrinks. The error of an order-$p$ method grows roughly like $h^p$. Halve the step and ode1's error halves, while ode4's error falls by $2^4 = 16$ times.

| Solver | Method | Order | Stages per step | Explicit or implicit |
|---|---|---|---|---|
| ode1 | Euler | 1 | 1 | explicit |
| ode2 | Heun | 2 | 2 | explicit |
| ode3 | Bogacki–Shampine | 3 | 3 | explicit |
| ode4 | classic Runge–Kutta (RK4) | 4 | 4 | explicit |
| ode5 | Dormand–Prince | 5 | 6 | explicit |
| ode8 | Dormand–Prince 8th order | 8 | 13 | explicit |
| ode14x | extrapolation with Newton's method | you choose | varies | implicit |
| ode1be | backward Euler | 1 | Newton iterations | implicit |

**Explicit** means the next state is computed directly from things already known. **Implicit** means the next state appears on both sides of the equation, so the solver must solve for it, usually with Newton's method. You met this split in lesson 3; it comes back at the end of this lesson.

A few facts to carry. **ode3** is the default fixed-step solver. A model with no continuous states at all needs none of these and runs on the solver called `discrete`. **ode5** uses the same [[Dormand–Prince|history]] formula as ode45, minus the error estimate that lets ode45 vary its step. **ode8** uses Dormand and Prince's eighth-order formula, for problems where you want very high accuracy from a coarse step.

You met Euler and RK4 already in Python, in the integration module. Euler takes the slope at the start of the step and walks along it:

$$
y_{n+1} = y_n + h\, f(t_n, y_n).
$$

Read it as "the next y equals this y plus h times the slope here". RK4 samples the slope four times — once at the start, twice at the middle, once at the end — and averages them with weights $1, 2, 2, 1$ over $6$.

::: key
Fixed-step solvers: ode1 (Euler), ode2 (Heun), ode3 (Bogacki–Shampine, the default fixed-step solver), ode4 (classic RK4), ode5 (Dormand–Prince), ode8 (Dormand–Prince 8th order) are explicit. ode14x (implicit extrapolation) and ode1be (backward Euler) are implicit, for stiff models that must still run at a fixed step. None of them controls error or locates events exactly; all of them have a deterministic, bounded cost per step.
:::

## Why a step can blow up

Here is the surprise that trips up new Simulink users. You pick a step that looks small, the model is perfectly stable in real life, and the plot shoots off to $10^{17}$. Nothing is wrong with the physics. The solver itself went unstable.

To see why, test each solver on the simplest possible system, one that decays:

$$
\dot{y} = \lambda y, \qquad \lambda < 0.
$$

Read $\dot{y}$ as "y dot", the rate of change of $y$, and $\lambda$ as "lambda". The true answer is $y = y_0 e^{\lambda t}$, which dies away. The number $\lambda$ is the system's **[[eigenvalue|eigenvalue]]**, its natural rate. A first-order lag with time constant $\tau$ has $\lambda = -1/\tau$: an actuator that responds in 4 ms has $\lambda = -1/0.004 = -250\,\mathrm{rad/s}$.

Apply Euler to this equation. The slope is $\lambda y_n$, so

$$
y_{n+1} = y_n + h \lambda y_n = (1 + h\lambda)\, y_n.
$$

Every step multiplies $y$ by the same number, $1 + h\lambda$. Call it the **growth factor**. After $n$ steps, $y_n = (1 + h\lambda)^n y_0$. If the growth factor's size is below 1, $y$ shrinks, as the real system does. If it is above 1, $y$ grows without limit, no matter what the real system does.

So Euler is stable only while

$$
|1 + h\lambda| < 1.
$$

For a negative $\lambda$, write $h\lambda = -x$ with $x > 0$. The condition $|1 - x| < 1$ holds for $0 < x < 2$. So the rule is

$$
h < \frac{2}{|\lambda|}.
$$

Between $x = 1$ and $x = 2$ something odd happens: the growth factor is negative, so the numerical answer flips sign every step while it shrinks. The real system never oscillates. That flip-flop is the first warning sign of a step that is too large.

RK4 does the same thing with a better growth factor. Work its four stages through $\dot{y} = \lambda y$ and they collapse to one polynomial in $z = h\lambda$:

$$
R(z) = 1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}.
$$

Solving $|R(z)| = 1$ numerically on the negative real axis gives $z \approx -2.785$. So RK4 is stable on real, decaying modes while $h|\lambda| < 2.785$.

::: key
Stability limit on a real eigenvalue $\lambda$: explicit Euler (ode1) needs $|1 + h\lambda| < 1$, so $h < 2/|\lambda|$. RK4 (ode4) needs $h|\lambda| \lesssim 2.785$, so $h < 2.785/|\lambda|$. The fastest eigenvalue in the model sets the limit, even if its mode is too fast to matter to you.
:::

The same calculation for the others, done in Python, gives this ladder of real-axis limits on $h|\lambda|$:

| Solver | Real-axis limit on $h\lvert\lambda\rvert$ |
|---|---|
| ode1 | 2 |
| ode2 | 2 |
| ode3 | about 2.51 |
| ode4 | about 2.785 |
| ode5 | about 3.31 |

Higher order buys a somewhat longer leash, not a huge one. That is why the explicit solvers all struggle with stiff models, exactly as lesson 3 described.

::: note Why RK4's growth factor is that polynomial
The exact answer to $\dot{y} = \lambda y$ after one step is $y_{n+1} = e^{h\lambda} y_n$. Its Taylor series is $e^{z} = 1 + z + z^2/2 + z^3/6 + z^4/24 + \dots$. A method of order $p$ must match this series up to the $z^p$ term, or its error per step would be bigger than $h^{p+1}$. RK4 has four stages, and a four-stage explicit method cannot produce any power beyond $z^4$, so its growth factor is the series cut off after $z^4/24$. The same argument gives Euler $1 + z$ and gives ode2 $1 + z + z^2/2$, whose real-axis limit is also 2. On the negative axis, $e^z$ is always between 0 and 1, but a polynomial eventually grows huge, and the point where it passes $-1$ or $+1$ is the stability limit.
:::

::: warning Stable is not the same as accurate
A step just inside the limit gives a bounded answer, but not a good one. At $h|\lambda| = 1.9$ Euler's growth factor is $-0.9$: the fast mode flips sign every step and takes dozens of steps to fade, while the real mode would be gone in two. For accuracy you want $h|\lambda|$ well below 1 on every mode you care about. The stability limit tells you where the floor falls away, not where good results start.
:::

## One model, two solvers

Now put the rule to work on a model with a real job.

::: example The same pitch loop, under ode1 and ode4
A vehicle's pitch angle $\theta$ ("theta") obeys $\ddot{\theta} = 10\,\delta$, where $\delta$ ("delta") is the engine gimbal angle in radians. The gimbal is an **[[actuator lag|actuator-lag]]** with a 4 ms time constant, $\dot{\delta} = 250\,(\delta_c - \delta)$, where $\delta_c$ is the commanded angle. A discrete PD controller runs at 50 Hz (every 0.02 s) and commands $\delta_c = 2.5\,(0.1 - \theta) - 0.7\,\dot{\theta}$, holding it between samples. The goal is to turn to $\theta = 0.1\,\mathrm{rad}$. Run it in Simulink with a fixed step $h = 0.01$ s, first with ode1, then ode4.

**Step 1: find the fastest eigenvalue.** The rigid-body part moves at a few radians per second. The gimbal lag has $\lambda = -250\,\mathrm{rad/s}$. That is the fastest by far, so it sets the limit.

**Step 2: ode1.** Here $h\lambda = 0.01 \times (-250) = -2.5$. The growth factor is $1 + h\lambda = 1 - 2.5 = -1.5$. Its size is above 1. Every step, any error in the gimbal angle flips sign and grows by half. A Python run of the loop shows exactly that: the gimbal state goes $0.625, -0.313, 0.984, -0.961, 1.83, -2.36$ radians in the first six steps. The pitch angle passes 1 rad (about 57°) at $t = 0.26$ s, and by 1 s it is in the millions.

**Step 3: ode4.** The same $z = -2.5$ goes into RK4's polynomial:

$$
R(-2.5) = 1 - 2.5 + 3.125 - 2.6042 + 1.6276 = 0.6484.
$$

Its size is below 1, so the gimbal mode decays. The simulation settles at $\theta = 0.1\,\mathrm{rad}$ with a peak of $0.1046\,\mathrm{rad}$, matching a reference run at $h = 10^{-5}$ s to four figures.

**Sanity check.** Nothing about the vehicle changed between the two runs — only the solver. A real 4 ms gimbal cannot flip sign every 10 ms and grow. The explosion is the ode1 solver's, not the rocket's. And $0.01$ s sits between Euler's limit $2/250 = 0.008$ s and RK4's limit $2.785/250 \approx 0.0111$ s, so this is exactly the step where one solver fails and the other does not.
:::

When you see a fixed-step result that flips sign every step and grows, suspect the solver first. Halve the step. If the blow-up moves or vanishes, it was numerical.

## The largest step for a 50 Hz loop

In a fixed-step model with a discrete controller, the step cannot be any number you like. Simulink requires every discrete **[[sample time|sample-time]]** in the model to be a whole-number multiple of the fixed step. The controller above runs every 0.02 s, so the fixed step must be $0.02/n$ for a whole number $n$: 0.02 s, 0.01 s, 0.00667 s, 0.005 s, 0.004 s, and so on. (Leave the step size on `auto` and Simulink picks the largest step that divides all the model's sample times, called the **fundamental sample time**.)

So "the largest stable step" means: the largest $0.02/n$ that is below the solver's stability limit for the fastest eigenvalue.

::: example Largest fixed step for the 50 Hz pitch loop
Same model: fastest eigenvalue $-250\,\mathrm{rad/s}$, controller at 50 Hz.

**Step 1: the limits.** Euler: $2/250 = 0.008$ s. RK4: $2.785/250 \approx 0.0111$ s.

**Step 2: list the allowed steps and their growth factors.** For each $n$, $h = 0.02/n$ and $z = -250\,h$:

| $n$ | $h$ (s) | $z = h\lambda$ | ode1 factor $1+z$ | ode4 factor $R(z)$ |
|---|---|---|---|---|
| 1 | 0.02 | −5.0 | −4.0 | 13.7 |
| 2 | 0.01 | −2.5 | −1.5 | 0.648 |
| 3 | 0.00667 | −1.67 | −0.667 | 0.272 |
| 4 | 0.005 | −1.25 | −0.25 | 0.308 |

**Step 3: read off the answers.** For ode4 the first stable row is $n = 2$: the largest stable step is $0.01$ s, two solver steps per control cycle. For ode1 the first stable row is $n = 3$: $h = 0.02/3 \approx 0.00667$ s, three steps per cycle. At $h = 0.02$ s both solvers explode, because one step per cycle is far past either limit.

**Step 4: check it by simulation.** A Python sweep over $h = 0.02, 0.01, 0.00667, 0.005, 0.004, 0.002, 0.001, 0.0005$ s agrees row for row: ode1 diverges at 0.02 and 0.01 and converges from 0.00667 down; ode4 diverges only at 0.02.

**Step 5: explain the limit.** The 50 Hz controller is not what limits the step. The controller itself is fine at 50 Hz: computed exactly, with no solver involved, every mode of the sampled loop shrinks each cycle, the slowest by a factor of 0.929. The limit comes from the continuous plant, and within the plant from its fastest mode, the 4 ms gimbal lag. The solver must take steps short enough to follow that mode stably, whether or not you care about it.

**Sanity check.** Both answers sit below the limits from Step 1: $0.00667 < 0.008$ and $0.01 < 0.0111$. And both are well above what an accuracy rule would pick, so they are the ceiling, not a recommendation.
:::

Two more facts from that sweep are worth knowing. First, accuracy. At their largest stable steps, ode1 at 0.00667 s misses the true pitch angle by up to 0.69 milliradians; ode4 at 0.01 s misses it by only 0.047 milliradians, about 15 times less. To match ode4's accuracy, Euler needs a step near 0.0005 s: 40 derivative evaluations per control cycle against ode4's 8.

Second, cost. For stability alone, Euler is the cheap one. It buys a limit of 2 with one stage; RK4 buys 2.785 with four stages. If the fast mode is one you do not care about, you are paying for stability, and that is the signal to reach for an implicit solver or to simplify the fast mode, as the next section shows.

You can check a step before ever opening Simulink:

```python
import numpy as np
from math import factorial

lam = -250.0                       # fastest eigenvalue, rad/s
R = lambda z, p: sum(z**k / factorial(k) for k in range(p + 1))
for n in [1, 2, 3, 4]:
    h = 0.02 / n
    z = h * lam
    print(f"h={h:.5f}  ode1 {R(z, 1):+.3f}  ode4 {R(z, 4):+.3f}")
# h=0.02000  ode1 -4.000  ode4 +13.708
# h=0.01000  ode1 -1.500  ode4 +0.648
# h=0.00667  ode1 -0.667  ode4 +0.272
# h=0.00500  ode1 -0.250  ode4 +0.308
```

And in MATLAB, choosing the solver and step is one call on the model:

```matlab
set_param(mdl, "SolverType", "Fixed-step", "Solver", "ode4", "FixedStep", "0.01");
out = sim(mdl);
```

::: warning Finding the fastest eigenvalue
The mode that limits the step is often one nobody thinks about: a sensor filter, an actuator lag, a structural bending mode, a tiny time constant typed in "to be realistic". For a linear model, `eig` of the state matrix lists every eigenvalue; take the largest magnitude. For a nonlinear model, linearize at a few operating points. A model that was fine at 0.01 s and diverges after someone adds a 1 ms filter has not broken. Its fastest eigenvalue moved.
:::

## Implicit fixed-step: ode14x and ode1be

Sometimes the fast mode is real and must stay, and the model must still run at a fixed step — typically a plant model running in real time on a **[[hardware-in-the-loop|hil]]** rig, where a flight computer is connected to a simulated vehicle. An explicit solver would need a tiny step. Implicit solvers get around this.

**Backward Euler** evaluates the slope at the end of the step instead of the start:

$$
y_{n+1} = y_n + h\, f(t_{n+1}, y_{n+1}).
$$

On $\dot{y} = \lambda y$ this gives $y_{n+1} = y_n + h\lambda y_{n+1}$, so

$$
y_{n+1} = \frac{1}{1 - h\lambda}\, y_n.
$$

For any negative $\lambda$ and any positive $h$, the bottom is bigger than 1, so the growth factor is between 0 and 1. It is stable at every step size. With $h = 0.01$ s and $\lambda = -250$, the factor is $1/3.5 \approx 0.286$ — no flip, no blow-up.

The price is that $y_{n+1}$ is on both sides. For a nonlinear model the solver must solve an equation each step with **[[Newton's method|newton]]**, which needs the model's Jacobian (the matrix of how each derivative depends on each state). Variable-step implicit solvers iterate until the answer converges, which takes an unknown number of passes. The fixed-step implicit solvers cap it:

- **ode1be** is backward Euler with a fixed number of Newton iterations per step. The cost of every step is the same, so it fits a real-time budget.
- **ode14x** combines Newton's method with **extrapolation**: it takes the step several ways with finer sub-steps and combines the results to cancel error terms. You set its **Extrapolation order** and **Number of Newton's iterations** in the solver settings. Higher settings buy accuracy and cost time, but the cost is still fixed per step.

::: key
ode14x and ode1be are the fixed-step choices for stiff models: implicit, so a fast decaying mode does not force a tiny step, and with a fixed number of Newton iterations, so the cost per step stays bounded and deterministic.
:::

## Choosing a fixed-step solver

A short recipe, in the order a GNC engineer tries it:

1. **Is there any continuous state in the path you will deploy?** A flight controller should be all discrete, and then the `discrete` solver is all you need. The fixed-step continuous solvers are for plant models and real-time simulation. (Lesson 9 turns this into the golden rule.)
2. **Start with ode3 or ode4** at a step that divides every sample time. Find the fastest eigenvalue and check $h|\lambda|$ against the ladder.
3. **Check accuracy** against a variable-step run: simulate the same model with ode45 at tight tolerances and compare. If the fixed-step answer is off, halve the step and look again.
4. **If a fast mode forces a tiny step** and you cannot remove it, switch to ode14x or ode1be.
5. **Mind the events.** A fixed step does not land on the moment a saturation hits its limit or a ball touches the floor. Lesson 5 shows what goes wrong and what Simulink offers for it.

## Check yourself

::: check
A model has a fastest eigenvalue of $-400\,\mathrm{rad/s}$. What is the largest step that keeps ode1 stable, and the largest for ode4?
:::

::: answer
Euler needs $h < 2/|\lambda| = 2/400 = 0.005$ s. RK4 needs $h < 2.785/400 \approx 0.00696$ s. Both are strict limits: at exactly $h = 0.005$ s, Euler's growth factor is $1 - 2 = -1$, which neither grows nor decays, so any error rings forever.
:::

::: check
You run a model under ode1 at $h = 0.002$ s and the output alternates in sign every step while growing. At $h = 0.0005$ s it is smooth, with no flip-flop. Estimate the size of the fastest eigenvalue.
:::

::: answer
Growing with alternating sign means Euler's growth factor $1 + h\lambda$ is below $-1$, so $h|\lambda| > 2$ at $h = 0.002$ s. That gives $|\lambda| > 2/0.002 = 1000\,\mathrm{rad/s}$. Smooth with no flip means the growth factor is positive at $h = 0.0005$ s, so $h|\lambda| < 1$ there. That gives $|\lambda| < 1/0.0005 = 2000\,\mathrm{rad/s}$. The fastest eigenvalue is somewhere between 1000 and 2000 rad/s — a mode with a time constant between 0.5 ms and 1 ms. Go and find which block has it.
:::

::: check
A control loop runs at 100 Hz. Which fixed steps are allowed? The fastest eigenvalue is $-300\,\mathrm{rad/s}$: which is the largest allowed step for ode4?
:::

::: answer
The step must divide 0.01 s: 0.01, 0.005, 0.00333, 0.0025 s and so on. RK4's limit is $2.785/300 \approx 0.00928$ s. The step 0.01 s is above that, so it fails. The next one, 0.005 s, is below, so the largest allowed stable step for ode4 is 0.005 s.
:::

::: check
Why does backward Euler stay stable at any step size on a decaying mode, while forward Euler does not? Answer with the two growth factors.
:::

::: answer
Forward Euler multiplies by $1 + h\lambda$. For negative $\lambda$ this falls below $-1$ once $h|\lambda| > 2$, and the size grows every step. Backward Euler multiplies by $1/(1 - h\lambda)$. For negative $\lambda$ the bottom is $1 + h|\lambda|$, which is always above 1, so the factor is always between 0 and 1. The cost is solving for the new state each step, which ode1be does with a fixed number of Newton iterations.
:::

::: check
A colleague says "ode4 is always better than ode1 because it is fourth order". When is ode1 the better choice?
:::

::: answer
When stability, not accuracy, sets the step and you can accept first-order accuracy. Per stage, Euler buys more stability: a limit of 2 from one derivative evaluation, against RK4's 2.785 from four. And when the model has no continuous states at all, neither is needed. For accuracy on smooth dynamics, ode4 wins by a wide margin.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Fixed-step solver | Advances time by the same $h$ every step | No error control, no exact events, bounded cost |
| Order $p$ | How fast error shrinks with step | Error $\propto h^p$ |
| Explicit family | ode1, ode2, ode3, ode4, ode5, ode8 | Euler, Heun, Bogacki–Shampine (default), RK4, Dormand–Prince, DP 8th order |
| Implicit family | ode14x, ode1be | Stiff models at a fixed, bounded cost |
| Euler growth factor | Multiplier per step on $\dot{y} = \lambda y$ | $1 + h\lambda$; stable if $h < 2/\lvert\lambda\rvert$ |
| RK4 limit | Real-axis stability | $h\lvert\lambda\rvert < 2.785$ |
| Backward Euler | Slope at end of step | Factor $1/(1 - h\lambda)$, stable for any $h$ |
| Step with a discrete rate $T_s$ | Must divide it evenly | $h = T_s/n$ |

A fixed step marches past events as blindly as it marches past a fast mode. The next lesson is about events: how a variable-step solver finds the exact instant a ball hits the floor or a saturation engages, what happens when events pile up, and what a real-time fixed-step model can do instead.

::: context stage What one "stage" costs
A stage is one full pass through the model's continuous blocks to compute every state derivative at one trial point. In a big 6-degree-of-freedom model that pass evaluates the gravity model, aerodynamic tables, engine model and actuators — thousands of operations. So stages, not steps, are the real currency of solver cost. ode4 at a 0.01 s step does 400 passes per simulated second; ode1 at 0.005 s does 200.
:::

::: context history Who the solvers are named after
Carl Runge (1895) and Martin Kutta (1901) built the family of step-by-step methods that RK4 comes from. Karl Heun gave his name to the two-stage method around 1900. Przemysław Bogacki and Lawrence Shampine published ode3's formula in 1989. John Dormand and Peter Prince published the fifth-order pair behind ode45 and ode5 in 1980, and the eighth-order pair behind ode8 in 1981. Shampine also co-wrote the MATLAB ODE suite, so his name runs through all of these lessons.
:::

::: context eigenvalue A natural rate, in plain words
Every linear system can be split into independent **modes**, each behaving like $e^{\lambda t}$. The eigenvalue $\lambda$ says how fast that mode decays (the real part) and how fast it wiggles (the imaginary part). A mode with $\lambda = -250\,\mathrm{rad/s}$ shrinks to 37% of its size every 4 ms. In control engineering the same numbers are called the system's **poles**, which the control modules later in the course use constantly. For a solver, only one question matters: which is the largest in size?
:::

::: context actuator-lag Why a gimbal is a first-order lag
A gimbal actuator is a motor or hydraulic ram with its own small control loop. Commanded to a new angle, it gets most of the way there in a few time constants, not instantly. The simplest model of that is $\dot{\delta} = (\delta_c - \delta)/\tau$, the same equation as a cup of coffee cooling toward room temperature. It is a good model for control design at low frequencies, and its short $\tau$ is exactly the kind of fast mode that sets a solver's step.
:::

::: context sample-time The beat a block runs on
A block's sample time says how often it computes a new output. A discrete controller at 50 Hz has a sample time of 0.02 s. The fixed step is the solver's beat, and every block's beat must land on it, the way every note in a bar lands on the drummer's count. Lesson 6 covers sample times in full, including the colors Simulink uses to show them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="40" y1="60" x2="40" y2="80"/><line x1="140" y1="60" x2="140" y2="80"/><line x1="240" y1="60" x2="240" y2="80"/><line x1="340" y1="60" x2="340" y2="80"/>
    <line x1="73" y1="63" x2="73" y2="77"/><line x1="107" y1="63" x2="107" y2="77"/><line x1="173" y1="63" x2="173" y2="77"/><line x1="207" y1="63" x2="207" y2="77"/><line x1="273" y1="63" x2="273" y2="77"/><line x1="307" y1="63" x2="307" y2="77"/>
  </g>
  <g fill="#b4232c">
    <circle cx="40" cy="45" r="5"/><circle cx="140" cy="45" r="5"/><circle cx="240" cy="45" r="5"/><circle cx="340" cy="45" r="5"/>
  </g>
  <text x="40" y="30" font-size="11" fill="#b4232c">controller, every 0.02 s</text>
  <text x="40" y="98" font-size="11" fill="#1d6fd1">solver steps, h = 0.02/3 s</text>
</svg>
```
:::

::: context hil A simulated rocket for a real computer
In **hardware-in-the-loop** testing, the real flight computer runs its real software, but its sensors and actuators are wired to a real-time computer that simulates the vehicle. Companies such as Speedgoat, dSPACE and OPAL-RT sell those real-time computers. The plant model on them must finish every step within its time slot, say 1 ms, or the test is invalid — which is why implicit solvers with a fixed number of iterations exist. The code-generation module later covers HIL rigs in depth.
:::

::: context newton Newton's method in one picture
To solve $g(y) = 0$, Newton's method starts from a guess, draws the tangent line there, and jumps to where the tangent crosses zero. Repeat, and the guesses close in fast. For backward Euler, $g(y) = y - y_n - h f(y)$, and a good first guess is the old state.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,150 C120,140 200,100 320,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="290" cy="39" r="4" fill="#b4232c"/>
  <line x1="290" y1="39" x2="215" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="290" y1="39" x2="290" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="215" cy="120" r="4" fill="#b4232c"/>
  <text x="275" y="136" font-size="11" fill="#1f2a44">guess 1</text>
  <text x="190" y="136" font-size="11" fill="#1f2a44">guess 2</text>
  <text x="120" y="112" font-size="11" fill="#1d6fd1">g(y)</text>
  <text x="228" y="80" font-size="11" fill="#b4232c">tangent</text>
</svg>
```

Each iteration needs the Jacobian, which is why the Solver reset method in the next lesson talks about recomputing it.
:::
