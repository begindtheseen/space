---
id: l03-stiffness
title: Stiff models and the implicit solvers
minutes: 23
covers:
  - 'Stiff solvers: ode15s, ode23s, ode23t, ode23tb; daessc'
---

Think about a shower with a fast-reacting tap. You want warm water. Suppose you are only allowed to look at the temperature once every ten seconds, and each time you must turn the tap by however much the water feels off. The tap reacts in a second, so by the time you look again, your last big correction has fully arrived. Too cold becomes scalding. You turn it hard the other way, and scalding becomes freezing. The swings get bigger every time, even though the water you want never changes.

There are two ways out. You can look much more often, every half second, and make small corrections. That works, but it is exhausting, and you have to keep it up forever, even after the water has settled. Or you can be smarter: instead of reacting to where the temperature is now, work out where your correction will leave it once it settles, and aim for that. Then one look every ten seconds is plenty.

Simulation has exactly this problem, and it has a name: **stiffness**. A model is stiff when it contains a motion that dies out very much faster than everything else you care about. The explicit solvers of lesson 2 behave like the first shower-taker: they must keep their steps tiny for as long as the fast motion exists in the model, even after it has faded to nothing. The **implicit** solvers behave like the second. This lesson shows how to recognize stiffness, why it happens, and which of Simulink's five stiff solvers to reach for.

## The symptom: a model that suddenly crawls

The classic story goes like this. An attitude-control model runs in a blink. Someone adds a realistic model of the actuator, the motor that turns the controller's command into a real deflection. Nothing else changes. Now the model runs a hundred times slower, and the plots look exactly the same as before.

::: example A model that got 100 times slower
A vehicle's attitude loop is tuned to a natural frequency of $2\,\mathrm{rad/s}$ and a damping ratio of 0.7, and follows a 1 rad step command for 10 s. First the actuator is ideal: it delivers whatever is commanded, instantly. Then it is modeled as a first-order lag with a bandwidth of $2000\,\mathrm{rad/s}$, meaning a time constant of $\tau = 1/2000 = 0.5\,\mathrm{ms}$. Both runs use a Dormand–Prince solver (the method inside `ode45`) in Python, at RelTol $10^{-3}$, AbsTol $10^{-6}$ and a 0.2 s step cap.

**Step 1: ideal actuator.** 54 steps, 326 derivative evaluations.

**Step 2: with the actuator lag.** 6039 steps, 42,164 evaluations. That is $6039/54 = 112$ times as many steps.

**Step 3: did the answer change?** The largest difference in attitude between the two models, over the whole 10 s, is $2.2 \times 10^{-4}\,\mathrm{rad}$ on a 1 rad command. Both overshoot to 1.046 rad. You could not tell the plots apart.

**Step 4: the step size.** In the second run the median step is $1.63\,\mathrm{ms}$, from start to finish, including the last 9 s when the vehicle is sitting still at its target.

**Sanity check.** The solver is working 112 times harder to produce the same curve. Something other than accuracy is setting its step. The rest of this lesson finds out what.
:::

A second test makes the cause stand out. Rerun the stiff model at RelTol $10^{-2}$ and at $10^{-6}$. For a normal model, lesson 2 showed that a looser tolerance means fewer steps. Here the Dormand–Prince solver takes 6038 steps at $10^{-2}$, 6039 at $10^{-3}$ and 6051 at $10^{-6}$. The tolerance hardly matters. When loosening the tolerance does not buy bigger steps, the step is being limited by something other than accuracy.

## Why: a fast mode and a stability limit

A linear model's motion can be split into **[[modes|modes]]**, simple motions that each decay (or grow) at their own rate. Each mode behaves like the one-line equation

$$
\dot{x} = \lambda x
$$

where $\lambda$ ("lambda") is that mode's **eigenvalue**, in units of 1/s. A negative $\lambda$ means the mode decays like $e^{\lambda t}$. The bigger $|\lambda|$, the faster it dies: after a time $1/|\lambda|$ it has shrunk to about 37%.

The attitude model with the actuator has three eigenvalues. Two describe the attitude motion we care about: $-1.40 \pm 1.43j$, a pair of size about 2. (The $j$ is the imaginary unit, $\sqrt{-1}$; a complex pair like this is a mode that oscillates while it decays.) The third is the actuator: $-1997$. It dies out in a few milliseconds. The ratio of the fastest to the slowest rates, here about $1997/2 \approx 1000$, is called the **stiffness ratio**. The larger it is, the stiffer the model.

Now take one Euler step on the fast mode. Euler's rule $x_{n+1} = x_n + h\lambda x_n$ gives

$$
x_{n+1} = (1 + h\lambda)\, x_n
$$

So every step multiplies the mode by the **amplification factor** $1 + h\lambda$. The true mode shrinks every step. Euler's copy shrinks only if $|1 + h\lambda| \le 1$. For a negative $\lambda$ that means

$$
h \le \frac{2}{|\lambda|}
$$

This is the **[[stability limit|stability-region]]**. Beyond it, each step flips the mode's sign and makes it bigger: the shower swinging from freezing to scalding. It does not matter that the mode has already decayed to $10^{-100}$. Round-off error in the last digits keeps a tiny copy of it alive, and an unstable step grows that copy until it swamps everything. So the limit applies for as long as the mode exists in the model, not for as long as it is visible.

Every explicit method has a limit like this. Higher-order methods push it a little further out. For the Dormand–Prince pair inside `ode45`, the amplification factor stays at or below 1 in size for $h|\lambda|$ up to about 3.3 on a decaying mode. For the actuator: $h \le 3.3 / 1997 = 1.66\,\mathrm{ms}$. The median step in the example was $1.63\,\mathrm{ms}$. The solver was not chasing accuracy at all. It was riding the edge of stability for the whole 10 s: its error control shrank the step each time the fast mode began to grow, and let it stretch again as the mode was damped. The fixed-step solvers of lesson 4 face the same limit with no error control to catch them, and the first exercise of this module maps that boundary.

::: example Forward and backward Euler on the actuator mode
Take the actuator's fast mode alone, $\lambda = -2000\,\mathrm{s^{-1}}$, starting at $x = 1$, with a step of $h = 0.01\,\mathrm{s}$. The truth: after one step it is $e^{-20} \approx 2 \times 10^{-9}$, effectively gone.

**Step 1: the stability limit for forward Euler.** $h \le 2/2000 = 0.001\,\mathrm{s}$. Our step is ten times too big.

**Step 2: forward Euler.** The factor is $1 + h\lambda = 1 + 0.01 \times (-2000) = 1 - 20 = -19$. Five steps give $-19$, $361$, $-6859$, $130{,}321$, $-2{,}476{,}099$. The mode that should be gone has grown to 2.5 million.

**Step 3: backward Euler.** Its rule (explained in the next section) gives the factor $1/(1 - h\lambda) = 1/(1 + 20) = 0.0476$. Five steps give $0.0476^5 = 2.4 \times 10^{-7}$. Not the exact $e^{-100}$, but decaying, which is all that matters for a mode nobody is looking at.

**Sanity check.** Both methods have the same accuracy on slow motion. Only the one that looks forward survives a big step on a fast mode.
:::

::: key
A model slows 100x after adding a fast actuator: the new dynamics are much faster than the rest, making the system stiff, so an explicit solver is limited by stability rather than accuracy and takes tiny steps. Switch to an implicit solver such as ode15s, or simplify the actuator if its fast mode does not matter.
:::

The two signs to look for in Simulink are the ones in the example: a huge step count with tiny steps even where every signal is smooth and slow, and a step count that barely changes when you loosen the tolerance. The Solver Profiler of lesson 9 will show you which state is holding the step down.

## The cure: implicit methods

Backward Euler changes one thing. Instead of the slope at the start of the step, it uses the slope at the end:

$$
x_{n+1} = x_n + h\, f(t_{n+1}, x_{n+1})
$$

The unknown $x_{n+1}$ now appears on both sides. The method is **implicit**: you cannot compute the new state directly; you have to solve an equation for it. Methods like Euler's, which compute the new state directly from what is already known, are **explicit**. Every solver in lessons 1 and 2 is explicit.

On the test mode, solving is easy: $x_{n+1} = x_n + h\lambda x_{n+1}$, so $x_{n+1}(1 - h\lambda) = x_n$, and

$$
x_{n+1} = \frac{1}{1 - h\lambda}\, x_n
$$

For any negative $\lambda$ and any positive $h$, the bottom is bigger than 1, so the factor is between 0 and 1. Every decaying mode decays, for every step size. The step is now set by accuracy on the modes you care about, and the fast mode stops mattering. A method with this property is called **[[A-stable|a-stable]]**.

The price is the equation. For a real model, $f$ is the whole diagram, and $x$ may have hundreds of states. The solver finds $x_{n+1}$ with **[[Newton's method|newton]]**, which needs the **Jacobian**: the table of how much each state's derivative changes when each state changes a little, $\partial f_i / \partial x_j$ ("partial f i by partial x j"). Simulink works the Jacobian out for you, then factors a matrix built from it. So an implicit step costs much more than an explicit one. That is a bad trade on a model that is not stiff, and a spectacular one on a model that is.

::: key
Explicit methods compute the new state directly and are limited to $h \lesssim 2/|\lambda_{\text{fast}}|$ (about $3.3/|\lambda_{\text{fast}}|$ for `ode45`). Implicit methods solve an equation for the new state each step, using the Jacobian, and stay stable on decaying modes at any step size.
:::

Here is the stiff actuator model again, run with solvers of both kinds at the same tolerances.

| Solver (Python stand-in for) | Steps | Derivative evaluations | Notes |
|---|---|---|---|
| Dormand–Prince (`ode45`) | 6039 | 42,164 | explicit, stability-limited |
| Bogacki–Shampine (`ode23`) | 7958 | 23,894 | explicit, stability-limited |
| SciPy BDF (`ode15s`) | 113 | 246 | implicit, 2 Jacobians |
| Octave `ode23s` | 122 | | implicit, Rosenbrock |

SciPy's BDF solver is a close relative of `ode15s`: variable order from 1 to 5, built on the same design. The implicit solvers need about 50 times fewer steps than `ode45`, and the BDF solver needs about a 170th of the evaluations, plus two Jacobians. In the Python runs, that made the BDF solver about 20 times faster in wall-clock time. Octave's `ode45` on the same model took 6024 steps, confirming the explicit count.

## Simulink's stiff solvers

Simulink offers five variable-step solvers for stiff models. They differ in how they build the implicit step.

**`ode15s`** is the first one to try. It is a **multistep** method, like `ode113`, but implicit. It uses the **[[numerical differentiation formulas|ndf]]** (NDFs), close cousins of the classic **backward differentiation formulas** (BDFs), and varies its order from 1 to 5. Higher orders are more accurate but less stable on oscillating modes, so Simulink gives `ode15s` a **Maximum order** setting (default 5). If a stiff model with lightly damped oscillations misbehaves, lowering the maximum order to 2 makes it more stable, because order 2 is the highest order at which the formulas are A-stable. Being multistep, it has `ode113`'s weakness: after a discontinuity it must rebuild its history.

**`ode23s`** is a one-step method based on a **modified Rosenbrock formula of order 2**. A Rosenbrock method builds the Jacobian into the formula itself, so each step solves linear equations rather than iterating Newton's method. It forms a fresh Jacobian every step, which is expensive for large models, but it is efficient at crude tolerances and can handle some stiff problems where `ode15s` struggles.

**`ode23t`** is the **trapezoidal rule**, which averages the slopes at the start and the end of the step, $x_{n+1} = x_n + \tfrac{h}{2}\left(f(x_n) + f(x_{n+1})\right)$. It comes with a "free" interpolant, a way of filling in values between steps at no extra cost. Its virtue is that it adds no **numerical damping**: a lightly damped oscillation, like a flexible solar array or a spring-mass mechanism, keeps its true amplitude instead of fading artificially. It is meant for **moderately** stiff models, for a reason the next example shows.

**`ode23tb`** is **TR-BDF2**: each step is a trapezoidal stage followed by a second-order backward-differentiation stage. It keeps much of the trapezoidal rule's accuracy while strongly damping very fast modes. Like `ode23s`, it can be more efficient than `ode15s` at crude tolerances, and being one-step, it restarts cleanly after events.

::: example Ringing: the trapezoidal rule on a very fast mode
Take the fast mode again, $\lambda = -2000\,\mathrm{s^{-1}}$, now with $h = 0.01\,\mathrm{s}$, so $h\lambda = -20$.

**Step 1: the trapezoidal factor.** Solving the trapezoidal rule on $\dot{x} = \lambda x$ gives $x_{n+1} = \frac{1 + h\lambda/2}{1 - h\lambda/2} x_n$. Here $\frac{1 - 10}{1 + 10} = -0.818$.

**Step 2: ten steps.** The mode flips sign every step and shrinks only slowly: $0.818^{10} = 0.134$. After 0.1 s, when the true mode is $e^{-200}$, the trapezoidal copy is still 13% of its starting size, rattling back and forth. This is **[[ringing|ringing]]**.

**Step 3: TR-BDF2.** Its factor at the same $h\lambda$ works out to $-0.155$. Ten steps: $0.155^{10} = 7.9 \times 10^{-9}$. Gone.

**Step 4: backward Euler.** $1/21 = 0.0476$ per step, gone even faster.

**Sanity check.** All three are stable: none of them blows up. The difference is what happens as $h\lambda$ gets very large. The trapezoidal factor heads to $-1$, so a very fast mode is never damped; TR-BDF2 and backward Euler head to 0. That is why `ode23t` suits moderately stiff models, and `ode23tb` or `ode15s` very stiff ones.
:::

**`daessc`** is different again. Some models are not only differential equations. A **[[Simscape|simscape]]** model of an electrical, hydraulic or mechanical network is built from physical components joined at connections, and the connections add **algebraic equations**: relations with no derivative in them, which must hold at every instant. "The currents flowing into a junction add up to zero" is one. "Two rigidly joined parts have the same speed" is another. A system that mixes differential and algebraic equations is a **DAE** (differential-algebraic equation). `ode15s` and `ode23t` can handle the simpler kinds. **`daessc`**, the DAE solver for Simscape, is built for the equations Simscape generates and is the robust choice there. It is available only when a Simscape product is installed.

::: key
Stiff solvers: ode15s (variable-order NDF/BDF, orders 1–5, multistep; the first to try); ode23s (modified Rosenbrock, order 2, one-step; crude tolerances); ode23t (trapezoidal rule with a free interpolant; moderately stiff, no numerical damping); ode23tb (TR-BDF2, one-step; strongly damps fast modes, efficient at crude tolerances); daessc (for the DAEs of Simscape models).
:::

## Choosing, and the other cure

When a model is slow, go in this order.

1. **Confirm stiffness.** Tiny steps where the signals are smooth, and a step count that ignores the tolerance.
2. **Ask whether the fast mode matters.** In the first example the $2000\,\mathrm{rad/s}$ actuator changed the attitude by $2.2 \times 10^{-4}\,\mathrm{rad}$. For a study of a $2\,\mathrm{rad/s}$ loop, an ideal actuator, or a slower but still realistic one, gives the same answer with an explicit solver. Removing a mode you do not need is often better than solving it well.
3. **If it matters, switch to `ode15s`.** Keep the fast actuator, and let an implicit solver step over it.
4. **Try the others if `ode15s` struggles.** `ode23tb` or `ode23s` for crude tolerances or a model with many events; `ode23t` when numerical damping would hide an oscillation you need to see; `daessc` for Simscape.

```matlab
set_param(mdl, 'SolverType', 'Variable-step', 'Solver', 'ode15s', ...
               'MaxOrder', '5', 'RelTol', '1e-3');
```

::: warning Implicit is not faster by default
On a model that is not stiff, an implicit solver is usually slower: it pays for Jacobians and equation solving that buy nothing. The ideal-actuator model above took 54 steps with Dormand–Prince and 79 with the BDF solver, each BDF step being the more expensive kind. Use `ode15s` because the model is stiff, not because it sounds more powerful.
:::

::: warning Stiffness can appear halfway through a run
A model can be non-stiff for most of its run and stiff for part of it: a valve that closes and leaves a small, fast pressure volume, a landing leg's stiff spring that only acts after touchdown. If a run crawls only during one phase, look at what switches on in that phase.
:::

## Check yourself

::: check
A model contains modes with eigenvalues $-0.5$, $-3$ and $-8000\,\mathrm{s^{-1}}$. What is its stiffness ratio? About what step does forward Euler need for stability, and about what does `ode45`'s stability limit allow?
:::

::: answer
The stiffness ratio is fastest over slowest: $8000/0.5 = 16{,}000$, very stiff. Forward Euler needs $h \le 2/8000 = 0.25\,\mathrm{ms}$. `ode45`'s limit is about $3.3/8000 \approx 0.41\,\mathrm{ms}$. A 100 s run would need at least $100/0.00041 \approx 240{,}000$ `ode45` steps, although the slowest mode takes seconds to change.
:::

::: check
You loosen RelTol from $10^{-3}$ to $10^{-2}$ on a slow model, and the step count drops from 800,000 to 799,000. What does that tell you, and what do you try next?
:::

::: answer
A tenfold looser tolerance should allow noticeably bigger steps if accuracy were limiting them. Almost no change means the step is limited by stability, the signature of stiffness with an explicit solver. Next: find the fast dynamics (a recently added actuator, sensor filter or stiff spring), decide whether they matter for the question being asked, and either simplify them or switch to an implicit solver such as `ode15s`.
:::

::: check
Show that backward Euler's factor $1/(1 - h\lambda)$ is between 0 and 1 for every negative $\lambda$ and positive $h$. What does it become when $h\lambda$ is very large and negative?
:::

::: answer
With $\lambda < 0$ and $h > 0$, $h\lambda$ is negative, so $1 - h\lambda = 1 + h|\lambda|$ is greater than 1. One divided by a number greater than 1 is between 0 and 1. As $h|\lambda|$ grows, $1 + h|\lambda|$ grows without limit and the factor goes to 0: a very fast mode is wiped out in one step, which is exactly what you want for a mode that has physically died out.
:::

::: check
A team models a satellite's flexible solar array, a lightly damped mode at 0.3 Hz, together with a moderately fast reaction-wheel motor model. They want to study how long the array keeps vibrating after a slew. Which stiff solver fits, and why not `ode23tb`?
:::

::: answer
`ode23t`. The model is moderately stiff because of the motor, and the quantity of interest is the decay of a lightly damped oscillation. The trapezoidal rule adds no numerical damping, so the vibration decays at its true rate. `ode23tb`, and `ode15s` at high order, add some numerical damping, which could make the array appear to settle sooner than it really does. (A tight tolerance reduces that effect for any solver; checking the result against a run with a different solver is good practice.)
:::

::: check
A Simscape model of a hydraulic actuator runs slowly and sometimes fails at start-up with `ode45`. Which solver is designed for it, and what makes such a model different from a plain Simulink model?
:::

::: answer
`daessc`, the solver built for Simscape. A Simscape network produces differential-algebraic equations: besides derivatives, it has algebraic relations that must hold at every instant, such as the flows into a junction adding to zero. These need a solver that handles the constraints, and they are often stiff too, since fluid lines and small volumes create very fast dynamics. `ode15s` and `ode23t` can also handle many such models.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Stiffness | A mode much faster than the motion of interest | Stiffness ratio $= \lvert\lambda\rvert_{\max} / \lvert\lambda\rvert_{\min}$ |
| Amplification factor | Multiplier per step on $\dot{x} = \lambda x$ | Forward Euler $1 + h\lambda$; backward Euler $1/(1 - h\lambda)$ |
| Explicit stability limit | Step that keeps a decaying mode decaying | $h \le 2/\lvert\lambda\rvert$ for Euler, about $3.3/\lvert\lambda\rvert$ for `ode45` |
| Stiffness signature | How it shows in a run | Tiny steps on smooth signals; step count ignores tolerance |
| Implicit method | New state solved from an equation | Needs the Jacobian; stable on decaying modes at any step |
| `ode15s` | Variable-order NDF/BDF, orders 1–5 | First stiff solver to try; Maximum order setting |
| `ode23s` | Modified Rosenbrock, order 2 | One-step; crude tolerances |
| `ode23t` | Trapezoidal rule, free interpolant | Moderately stiff; no numerical damping |
| `ode23tb` | TR-BDF2 | One-step; damps fast modes; crude tolerances |
| `daessc` | DAE solver for Simscape | Algebraic constraints from physical networks |

Next lesson: the fixed-step solvers, from `ode1` to `ode8`, and the two implicit ones, `ode14x` and `ode1be`, that bring this lesson's stability to models that must run at a constant step on real-time hardware.

::: context modes Many motions in one
A linear model with $n$ states can be rewritten as $n$ independent simple motions added together, its modes. For a rocket's attitude loop, one mode might be the slow swing of the vehicle, another the actuator settling, another a sensor filter. Each has an eigenvalue that sets its speed. The picture shows why stiffness is strange: the fast mode is gone almost at once, yet it still sets the step for an explicit solver.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,30 C44,110 48,128 60,130 L340,130" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M40,30 C120,60 200,95 340,118" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="70" y="115" font-size="11" fill="#b4232c">fast mode: gone in ms</text>
  <text x="200" y="80" font-size="11" fill="#1d6fd1">slow mode: seconds</text>
  <text x="190" y="150" font-size="11" fill="#1f2a44" text-anchor="middle">time</text>
</svg>
```
:::

::: context stability-region A disc in the complex plane
Eigenvalues can be complex numbers, so the stability test is drawn in the complex plane. Forward Euler is stable when $z = h\lambda$ lands inside the disc $|1 + z| \le 1$: a circle of radius 1 centered at $-1$, reaching from 0 to $-2$ along the real axis. A decaying mode has $\lambda$ on the left, and shrinking $h$ slides $z$ toward 0 until it enters the disc. Higher-order explicit methods have bigger, lumpier regions, but every one of them is bounded. Implicit methods like backward Euler are stable on the whole left half of the plane.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="340" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="15" x2="260" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="190" cy="90" r="70" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="120" cy="90" r="3" fill="#1f2a44"/>
  <circle cx="260" cy="90" r="3" fill="#1f2a44"/>
  <text x="120" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">-2</text>
  <text x="190" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">-1</text>
  <text x="268" y="108" font-size="11" fill="#1f2a44">0</text>
  <circle cx="50" cy="90" r="5" fill="#b4232c"/>
  <text x="50" y="76" font-size="11" fill="#b4232c" text-anchor="middle">h too big</text>
  <text x="300" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">z = h times lambda</text>
</svg>
```

The shaded disc is where forward Euler keeps a mode from growing. The red point, $h\lambda = -3$, is outside it.
:::

::: context a-stable Stable everywhere on the left
A method is **A-stable** if its amplification factor has size at most 1 for every $h\lambda$ with a negative real part: every decaying mode decays, whatever the step. Backward Euler and the trapezoidal rule are A-stable. A stronger property, **L-stable**, also asks that the factor go to 0 as $h\lambda$ goes to minus infinity, so very fast modes are wiped out rather than left ringing. Backward Euler and TR-BDF2 are L-stable; the trapezoidal rule is not. A mathematical result called Dahlquist's barrier says no multistep method above order 2 can be A-stable, which is why `ode15s` offers a maximum-order setting.
:::

::: context newton Solving for the next state
Newton's method finds where a function is zero by repeatedly replacing it with its tangent line and jumping to where the tangent crosses zero. For an implicit step, the function is "the step equation, rearranged to equal zero", and the tangent is built from the Jacobian. Because the previous state is a good first guess, a step usually needs only one to a few iterations. Solvers save work by reusing the same Jacobian for many steps and recomputing it only when the iterations start to slow down, which is why the BDF run in the lesson needed only 2 Jacobians for 113 steps.
:::

::: context ndf A small tweak to a classic
Backward differentiation formulas fit a polynomial through the last few states and demand that its slope at the new point equal $f$ there. They have been the workhorse of stiff solvers since C. William Gear's programs around 1970. The numerical differentiation formulas add a small correction term to each formula, chosen to make it more accurate while giving up only a little stability. Lawrence Shampine and Mark Reichelt used them for MATLAB's `ode15s` when they rebuilt the MATLAB ODE suite in the late 1990s, and the name `ode15s` reflects orders 1 to 5, stiff.
:::

::: context ringing A mode that rattles instead of dying
Ringing is a numerical artifact: a fast mode that should vanish instead flips sign every step, shrinking slowly. On a plot it looks like a fine sawtooth riding on the real signal, for example on an actuator position or a current. It is a warning that the solver is not damping a fast mode, and switching from `ode23t` to `ode23tb` or `ode15s`, or shrinking the step, makes it disappear.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="40,15 70,124 100,35 130,108 160,48 190,97 220,56 250,90 280,62 310,85 340,67" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="40,15 70,84 100,74 130,75 160,75 190,75 220,75 250,75 280,75 310,75 340,75" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="200" y="138" font-size="11" fill="#b4232c">trapezoidal: factor -0.82 per step</text>
  <text x="200" y="20" font-size="11" fill="#1d6fd1">TR-BDF2: factor -0.15</text>
</svg>
```

Each corner is one step with $h\lambda = -20$; heights are drawn to scale from 60 px at the start.
:::

::: context simscape Models built from physical parts
Simscape is MathWorks' add-on for modeling physical systems by connecting components, such as resistors, pipes, pumps, springs and motors, the way the real parts are connected, instead of writing the equations as signal-flow blocks. Simscape derives the equations for you, including the algebraic ones that the connections imply. Spacecraft teams use it for electrical power systems, propellant feed and pressurization, and electromechanical actuators. Because these networks mix fast and slow physics and carry constraints, they are both stiff and differential-algebraic, which is the job `daessc` was built for.
:::
