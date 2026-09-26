---
id: l02-fixed-step-vs-variable-step-integration
title: Fixed-step vs. variable-step integration
minutes: 19
covers:
  - Fixed-step vs variable-step integration, and why a closed loop with a digital controller wants a fixed step
---

Imagine a cook making a big pot of soup with a simple rule: every minute, taste it, and if it is not sweet enough, add one spoon of sugar. The rule was worked out for a one-minute rhythm. Now suppose someone rings a bell at random, sometimes thirteen times in a minute, sometimes going back and ringing for a minute that already passed, and the cook tastes and adds a spoon at every ring. Her rule has not changed a single word. But the soup is a different soup.

That is this lesson in one picture. A digital controller is the cook. Its "rule" was designed for one steady rhythm. The thing ringing the bell is the integrator that moves the simulation forward in time — and one popular kind of integrator rings the bell at irregular, even backward, moments.

The Numerical Methods module gave you two families of integrator. A **fixed-step** method, such as RK4, uses one step size $h$ for the whole run; you pick it and defend it with a **refinement study** (halve $h$ and check the answer barely moves). A **variable-step** or **[[adaptive|adaptive-step]]** method, such as RK45 (**Dormand–Prince**), picks its own step each time from a built-in error estimate. It takes big steps where the motion is smooth and small ones where it bends sharply. Both are correct ways to solve an initial value problem.

For a trajectory with nobody reacting to it along the way — a coast arc, a high-accuracy **[[truth ephemeris|truth-ephemeris]]** — the adaptive method is usually the better choice. It needs fewer derivative evaluations for the same accuracy, and its step follows the motion instead of being fixed in advance to the worst case.

Put a digital controller in the loop, and that choice changes completely. The physics did not change: the plant box from the previous lesson can still be integrated as accurately as you like. What changed is the GNC box. It is not a math function you can call whenever it suits the integrator. It is software designed, analyzed and tuned for one specific sample period. Calling it on any other rhythm does not make the simulation *more* accurate. It makes the simulation test a controller that does not exist. This lesson shows that with two measurements: what an adaptive integrator's calls really look like from the inside, and what they do to a real controller.

## A digital controller has its sample period built in

A digital controller does not see the world continuously. It wakes up, reads its sensors, computes, sends a command, and sleeps. The time between wake-ups is the **sample period** $T$ — for example $T = 0.05\,\mathrm{s}$, which is $20$ wake-ups a second, or $20\,\mathrm{Hz}$.

The controller's rule is a **[[difference equation|difference-equation]]**: a formula for the next command in terms of the last one and the newest measurement. Here is the integral part of a typical controller:

$$
u_k = u_{k-1} + K_i T\,e_k .
$$

Read $u_k$ as "u sub k", the command at wake-up number $k$. $u_{k-1}$ is the command from the wake-up before. $e_k$ is the **error** at wake-up $k$ — how far the output is from where you want it. $K_i$ is the **integral gain**.

In words: each wake-up, add $K_i T$ times the error to the command. That is the cook's "one spoon per taste". The **[[integral term|integral-term]]** keeps adding a little push for as long as any error remains, which is how a controller wipes out a steady offset.

Now look at the product $K_i T$. It is not an approximation to some smooth rate of change. It is a decision made at design time: *this much* action per wake-up, *given this* $T$. Everything the control tier taught you about a digital controller — its gains, its filter poles and zeros, the phase lag from holding its output between samples — is worked out assuming updates come exactly $T$ apart.

So call the same line of code with a different, and changing, gap between calls, and $K_i T$ quietly stops being the gain it was designed with. The controller's code has not changed. The controller it implements has.

::: key Why the loop wants a fixed step
A digital controller's gains, filter dynamics and hold-induced phase lag are all defined relative to its designed sample period $T$. Evaluating it at varying intervals — whether by design or by accident, such as calling it from inside an adaptive integrator's derivative function — changes its effective gains and phase without changing a line of its code, because the difference equation no longer means what it was designed to mean. The fix is architectural, not numerical: drive the integrator to each controller tick as a hard step boundary, hold the control constant across the step, and never let the controller run inside a stage evaluation.
:::

## How an adaptive integrator really calls your function

There is a second, separate problem. Even if you could live with a changing sample period, an adaptive integrator does not call the **derivative function** — the function that returns "how fast is everything changing right now", the right-hand side of $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ — once per step.

It calls it several times per step, at in-between times called **[[stages|rk-stages]]**, and it mixes those slopes into one good step. It also makes a few calls before the first step to guess a sensible step size. And if an error estimate comes out too large, it throws the step away and **retries** from the same start time with a smaller step. So the sequence of call times is uneven, and it can even go *backward*.

A controller with any memory — an integral term, a filter state, a rate limiter's last output — that updates itself on every call, rather than once per real tick, gets driven by that sequence. It is neither evenly spaced nor always moving forward in time.

::: example What the derivative function actually sees
Take the torque-free tumbling motion of the bus from the previous lesson, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, starting at $\boldsymbol{\omega}_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$. Integrate it for one second with SciPy's `RK45`, and make the derivative function write down the time of every call.

```python
import numpy as np
from scipy.integrate import solve_ivp

I = np.array([1200.0, 1500.0, 2000.0])   # kg m^2, the bus
calls = []

def rhs(t, w):
    calls.append(t)
    M = np.array([(I[1]-I[2])*w[1]*w[2], (I[2]-I[0])*w[2]*w[0], (I[0]-I[1])*w[0]*w[1]])
    return M / I

sol = solve_ivp(rhs, (0.0, 1.0), [0.02, 0.0, 0.10], method='RK45', rtol=1e-6, atol=1e-9)
calls = np.array(calls)
print(np.round(calls[:8], 5))
print("backward calls:", int(np.sum(np.diff(calls) < 0)), "of", len(calls) - 1, "total calls:", len(calls))
# [0.      0.01288 0.00554 0.0083  0.02214 0.0246  0.02768 0.02768]
# backward calls: 1 of 19 total calls: 20
```

Read the list of times one at a time.

1. The first two calls, at $t = 0$ and $t = 0.01288\,\mathrm{s}$, are the solver's own **[[first-step guess|initial-step]]**. They are not part of any step.
2. The third call is at $t = 0.00554\,\mathrm{s}$ — *earlier* than the one before it. The real first step, of size $h = 0.02768\,\mathrm{s}$, has started back at $t = 0$.
3. That step's stages sit at the fractions $(0,\ \tfrac15,\ \tfrac{3}{10},\ \tfrac45,\ \tfrac89,\ 1,\ 1)$ of the step. These are Dormand–Prince's seven stages; the last two fall at the same time. Multiply each fraction by $0.02768$: $0$, $0.00554$, $0.00830$, $0.02214$, $0.02460$, $0.02768$, $0.02768\,\mathrm{s}$. The stage at $0$ reuses the very first call, so it does not show up twice.

The whole one-second run takes only three accepted steps and $20$ calls. Only three of those calls land inside what would be a single $100\,\mathrm{Hz}$ control period, $[0, 0.01)\,\mathrm{s}$. And no step was rejected. This is what a perfectly healthy, successful adaptive integration looks like from inside the function it calls.
:::

## What scrambled timing does to a real controller

That pattern is not a rare edge case. It is how every adaptive Runge–Kutta method works, on every problem. What matters is the result, and it is easy to measure. Take a controller with one line of memory, run it two ways with everything else the same, and compare.

::: example The same controller, two different closed loops
The plant is a simple first-order system, $\dot y = -y + u$: left alone, $y$ decays toward zero, and the command $u$ pushes it. Read $\dot y$ as "y dot", the rate of change of $y$. A discrete integral controller designed for $T = 0.05\,\mathrm{s}$ ($20\,\mathrm{Hz}$) drives it:

$$
u_k = u_{k-1} + K_i T\,(r - y_k), \qquad K_i = 20,\quad r = 1 .
$$

Here $r$ is the **reference**, the value you want $y$ to reach, so $r - y_k$ is the error.

```python
import numpy as np
from scipy.integrate import solve_ivp

a, Ki, T, r, t_end = 1.0, 20.0, 0.05, 1.0, 2.0

# Scenario A: controller on its own fixed 20 Hz grid, ZOH over 5 RK4 substeps
def plant_rk4(y, u, dt):
    f = lambda yy: -a * yy + u
    k1 = f(y); k2 = f(y + 0.5*dt*k1); k3 = f(y + 0.5*dt*k2); k4 = f(y + dt*k3)
    return y + dt/6.0*(k1 + 2*k2 + 2*k3 + k4)

y, u = 0.0, 0.0
tA, yA = [0.0], [0.0]
for k in range(int(round(t_end/T))):
    u = u + Ki*T*(r - y)                 # discrete integral update at the design period T
    for _ in range(5):
        y = plant_rk4(y, u, T/5)
    tA.append(round((k+1)*T, 10)); yA.append(y)
tA, yA = np.array(tA), np.array(yA)

# Scenario B: the same integral update, but triggered from inside the adaptive RHS
state = {"u": 0.0, "last_t": 0.0}
def rhs(t, yvec):
    dt = t - state["last_t"]
    state["u"] += Ki*dt*(r - yvec[0])    # uses elapsed *call* time, not the design period
    state["last_t"] = t
    return [-a*yvec[0] + state["u"]]

sol = solve_ivp(rhs, (0.0, t_end), [0.0], method='RK45', t_eval=tA, rtol=1e-6, atol=1e-9)
yB = sol.y[0]

print("RMS(y_A - y_B):", np.sqrt(np.mean((yA - yB)**2)))
print("max |y_A - y_B|:", np.max(np.abs(yA - yB)))
print("y_A at t=2.0:", yA[-1], " y_B at t=2.0:", yB[-1])
# RMS(y_A - y_B): 0.07408421536780532
# max |y_A - y_B|: 0.10712991612844691
# y_A at t=2.0: 1.3196675231822677  y_B at t=2.0: 1.2405066793323216
```

**Scenario A** calls the controller exactly once every $T = 0.05\,\mathrm{s}$: $2 / 0.05 = 40$ times over the run. Between calls it holds $u$ fixed and integrates the plant with five RK4 substeps. That is the two-rate setup the next lesson builds properly.

**Scenario B** updates the very same integral term every time the adaptive solver calls the derivative function. That happens $536$ times over the same $2\,\mathrm{s}$ — on average $536 / 40 = 13.4$ calls per intended tick. $20$ of those calls have a gap $\Delta t$ ("delta t", the time since the previous call) that is *negative*. And $\Delta t$ ranges from $-0.057$ to $+0.034\,\mathrm{s}$, instead of a steady $0.05\,\mathrm{s}$.

The two answers disagree. The **[[RMS|rms]]** (root-mean-square) difference is $0.0741$, against a target of $1$ — that is $7.4\%$. The worst single moment differs by $0.107$. Even the swinging of the response is on a different beat. At $t = 0.5,\ 1.0,\ 1.5,\ 2.0\,\mathrm{s}$:

- $y_A$ goes $1.475 \to 1.155 \to 0.564 \to 1.320$;
- $y_B$ goes $1.389 \to 1.248 \to 0.571 \to 1.241$.

The [[same shape|two-responses]], plainly related — but a measurably different closed loop. Not one line of the controller's arithmetic changed between the two runs. Only the times at which it was allowed to run did.

**Sanity check.** Why doesn't Scenario B come out wildly worse, with $13.4$ times as many updates? Because B scales each update by the actual gap $\Delta t$, and the gaps add up (with the backward ones cancelling some forward ones) to roughly the right total time. The *amount* of integral action is about right. Its *timing* is scrambled — so the loop is close, but not the one you designed.
:::

That last point is the whole lesson. A controller is a function of its state and a fixed interval since it last ran. Scramble the interval and you have simulated a different controller while believing you tested the real one.

::: warning "A tight enough tolerance makes this negligible" is the wrong instinct
Tightening `rtol` and `atol` (the integrator's relative and absolute error tolerances) shrinks its *steps*. That looks like it should shrink the timing problem too. It does not fix the cause. A tighter tolerance still means several stage calls per step, still a first-step guess, and — on any problem whose dynamics change — still the occasional retry from the same start time with a smaller $h$. The scrambled loop above came from an ordinary, successful integration at fairly tight tolerances. It is not a symptom of a loose tolerance that a tighter one removes. The only fix is never to let code with memory run from inside a derivative-function call.
:::

::: warning It is not only controllers
Anything with memory that updates once per call is exposed: an integral term, a digital filter, a rate limiter comparing against "the last command", a data logger that assumes one entry per tick. If it can be reached from inside an adaptive integrator's derivative function, it has the same problem. A common way this sneaks in is a **[[logging hook|telemetry-hook]]** added for debugging. It runs every time the derivative function does, and produces a telemetry stream sampled at the integrator's stage times instead of at any sensible rate. Anything with memory belongs outside the derivative function, called only on a fixed, explicit schedule.
:::

## Check yourself

::: check
What exactly does a discrete controller's sample period $T$ decide? Why does calling the same controller code at an uneven rhythm change its behavior without changing any of its code?
:::

::: answer
$T$ sets the controller's effective gains, its discrete filter poles and zeros, and the phase lag from holding its output between updates. All of those were worked out at design time assuming updates arrive exactly $T$ apart.

A difference equation such as $u_k = u_{k-1} + K_iT\,e_k$ treats $T$ as a fixed number multiplying the gain. If the real gap between calls varies, then the product $K_i \times (\text{real gap})$ varies with it. The controller then produces a different command for the same error than it was designed to — even though every line of its code is the same.
:::

::: check
In the call trace for the tumbling bus, the third call landed at $t = 0.00554\,\mathrm{s}$, earlier than the second call at $t = 0.01288\,\mathrm{s}$. Was that caused by a rejected step? Does the timing problem need a rejected step to happen?
:::

::: answer
No step was rejected in that run. SciPy's `RK45` accepted its first step on the first try.

The "backward" call is the join between the solver's first-step guess (which probes ahead to $t = 0.01288\,\mathrm{s}$ to judge a sensible first step) and the real first step's stages, which start again at $t = 0$.

The timing problem does not need a rejection at all. An ordinary, successful adaptive step still calls the derivative function several times, at in-between and out-of-order times. That alone is enough to scramble any per-call timing a hooked-in controller depends on. A rejected-and-retried step makes things worse, but not different in kind.
:::

::: check
The closed-loop example made $536$ derivative calls over $2\,\mathrm{s}$, against $40$ proper controller ticks. Suppose the integral update used a *fixed* $T = 0.05\,\mathrm{s}$ on every one of those $536$ calls, ignoring the real elapsed time. Would that fix the problem?
:::

::: answer
No. With a fixed $T$ per call, the controller would add $K_iT\,e_k$ $536$ times instead of $40$ times, so the total control action would be roughly $536/40 \approx 13.4$ times too large.

Worse, the number of calls per second depends on the adaptive step size, which changes with the dynamics. The control design cannot predict it or allow for it. The problem is not "use the right gap for each call". The controller must be called exactly once per real tick, no more and no fewer — and an adaptive integrator's internal call pattern cannot give you that, however you compute the gap.
:::

::: check
A colleague says variable-step integration should be banned from every simulation in this module, since it scrambles a controller. Is that the right conclusion?
:::

::: answer
Not entirely. The damage comes specifically from calling code with memory from inside an adaptive integrator's derivative function. It says nothing against an adaptive integrator for a trajectory that no controller reads along the way. A high-accuracy truth run used to check the fixed-step plant is a good example, and a later lesson on validation relies on exactly that kind of run.

The right conclusion is about the architecture: keep the controller out of the integrator's internal calls. The next lesson does this by making each controller tick a hard step boundary, rather than banning adaptive methods everywhere.
:::

::: check
Why is it not enough to lower the adaptive integrator's `rtol` and `atol` until the damage gets small?
:::

::: answer
A tighter tolerance makes the accepted steps smaller. That means more calls per second, and each gap is smaller. But the calls are still not evenly spaced, still not always moving forward, and still not lined up with the controller's design period. Code with memory is still run many times where it should run once.

The closed-loop example already used a fairly tight tolerance ($\mathrm{rtol} = 10^{-6}$) and still produced a $7.4\%$ RMS error and $20$ backward-in-time calls. The cause is in the structure, not in a loose setting, so no tolerance removes it.
:::

::: check
Two engineers each integrate the bus's torque-free motion for $1\,\mathrm{s}$ with `RK45` at this lesson's tolerances. They get different total numbers of derivative calls, though both end with the same accepted step boundaries. Is that evidence of a bug?
:::

::: answer
Not necessarily. The number of calls depends on details of the first-step guess and on floating-point evaluation order, which can differ between library versions even when both give a correct, converged answer with the same accepted steps.

What *would* point to a bug is the accepted step boundaries or the solution values disagreeing by more than the tolerance. The raw call count is an implementation detail, not a test of correctness. That is also why a hook with memory inside the derivative function is doubly dangerous: it makes the *simulation's answer* depend on a detail that was never meant to be visible.
:::

## Summary

| Item | Statement |
| --- | --- |
| Fixed step | One step size $h$ throughout, chosen ahead of time and checked by a refinement study — used wherever the loop must see a controller on its designed grid |
| Variable step | Step chosen each time from a built-in error estimate, spending effort where the motion bends — right for a standalone trajectory that no controller reads |
| Why the loop wants a fixed step | A discrete controller's gains, filter dynamics and hold phase lag belong to its design period $T$; an uneven gap between calls quietly changes all of them |
| What the calls look like | An adaptive step calls the derivative several times (its stages, plus a first-step guess), at times that are uneven and not even always increasing |
| Measured cost | An integral controller run from inside an adaptive derivative function ($536$ calls, $20$ backward in time, against $40$ intended ticks) differed from the correctly timed one by $7.4\%$ RMS and $10.7\%$ at worst, with a visibly different swing |
| Not a tolerance problem | Tightening `rtol`/`atol` does not fix it; the damage is structural |
| The fix | Make each controller tick a hard step boundary the integrator is driven to, hold the control constant across it, and never call code with memory from inside a derivative evaluation |

The next lesson builds that fix: the plant integrated at a fine, accurate step while the flight software runs at its own true rate, with its command held constant between ticks by a zero-order hold. Every closed-loop 6-DOF simulation in this course is built on that two-rate structure.

::: context adaptive-step How an integrator grades its own work
An adaptive method computes each step two ways at once, one slightly more accurate than the other, using mostly the same derivative calls. The gap between the two answers is an estimate of the error. If the gap is under the tolerance, the step is accepted and the next one is made a bit longer. If not, the step is thrown away and retried shorter. It is like a hiker who checks the map rarely on an open trail and constantly in a maze of paths: the effort goes where it is needed.
:::

::: context truth-ephemeris A trajectory used as the answer key
An **ephemeris** (from the Greek for "daily", after old almanacs listing where the planets would be each day) is a table of an object's positions against time. A "truth" ephemeris is one computed as accurately as possible — tight tolerances, a detailed force model — to serve as the answer key other runs are checked against. Nothing reacts to it while it is being computed, which is exactly why an adaptive integrator is a fine choice for it.
:::

::: context difference-equation The digital cousin of a differential equation
A differential equation describes how something changes smoothly, moment to moment: $\dot u = K_i e$. A difference equation describes how it jumps from one sample to the next: $u_k = u_{k-1} + K_i T e_k$. The second is what a computer can actually run, one wake-up at a time. With $T$ fixed, the two describe nearly the same controller. The difference equation only stays faithful to the design because $T$ is baked into it — which is exactly what an irregular calling rhythm breaks.
:::

::: context integral-term Why keep adding?
A controller that pushes only in proportion to the error can get stuck a little short of its target, with a small leftover error forever. An integral term fixes that by adding up the error over time: as long as any error remains, the push keeps growing, until the error is gone. It is the cook adding one more spoon each time the soup still tastes flat. The same memory that makes it useful is what makes it sensitive to how often it is called.
:::

::: context rk-stages Where the calls land in one step
One Dormand–Prince step of size $h = 0.02768\,\mathrm{s}$, starting at $t = 0$. The numbers give the order of the calls. Call 2 is the first-step guess, reaching past calls 3 and 4 — so the time sequence runs backward between calls 2 and 3. The grey line is the end of a $100\,\mathrm{Hz}$ control period.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="40" x2="130" y2="90" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="130" y="105" font-size="11" text-anchor="middle" fill="#6c7a93">0.01 s</text>
  <text x="30" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="306.8" y="105" font-size="11" text-anchor="middle" fill="#1f2a44">0.0277 s</text>
  <circle cx="30" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="158.8" cy="70" r="5" fill="#b4232c"/>
  <circle cx="85.4" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="113" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="251.4" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="276" cy="70" r="5" fill="#1d6fd1"/>
  <circle cx="306.8" cy="70" r="5" fill="#1d6fd1"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="56">1</text><text x="158.8" y="56" fill="#b4232c">2</text><text x="85.4" y="56">3</text>
    <text x="113" y="56">4</text><text x="251.4" y="56">5</text><text x="276" y="56">6</text><text x="306.8" y="56">7, 8</text>
  </g>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">call order along the time axis</text>
</svg>
```
:::

::: context initial-step How the solver picks its first step
Before its first real step, an adaptive solver has no idea what step size suits the problem. So it evaluates the derivative at the start, takes a small trial move forward, evaluates again, and uses how fast the slope changed to guess a first $h$. SciPy's `RK45` does this, which is where the call at $t = 0.01288\,\mathrm{s}$ came from. Other libraries use slightly different rules — one reason two correct runs can make different numbers of calls.
:::

::: context rms One number for "how far apart on average"
RMS stands for root-mean-square: square each difference, take the mean of the squares, then the square root. Squaring makes every difference positive, so ups and downs cannot cancel, and it weights big misses more than small ones. For the $41$ sample times in the example, the RMS of $y_A - y_B$ is $0.0741$ — a typical gap of about $7\%$ of the target value of $1$.
:::

::: context two-responses The two runs, side by side
Blue is the controller on its designed $20\,\mathrm{Hz}$ grid (Scenario A); red is the same controller hooked into the adaptive solver (Scenario B). Both are plotted at the same $41$ sample times. The dashed line is the target, $r = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="84" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="164" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="190" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">1 s</text>
  <text x="340" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">2 s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,160.0 47.5,156.1 55.0,148.7 62.5,138.3 70.0,125.5 77.5,111.2 85.0,96.0 92.5,80.8 100.0,66.3 107.5,53.2 115.0,42.0 122.5,33.2 130.0,27.1 137.5,23.9 145.0,23.6 152.5,26.1 160.0,31.1 167.5,38.2 175.0,47.0 182.5,57.0 190.0,67.6 197.5,78.3 205.0,88.6 212.5,97.9 220.0,105.9 227.5,112.3 235.0,116.8 242.5,119.2 250.0,119.7 257.5,118.2 265.0,114.8 272.5,110.0 280.0,103.9 287.5,97.0 295.0,89.5 302.5,82.0 310.0,74.7 317.5,68.1 325.0,62.3 332.5,57.7 340.0,54.4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,160.0 47.5,158.0 55.0,152.4 62.5,143.5 70.0,132.0 77.5,118.6 85.0,104.0 92.5,89.1 100.0,74.4 107.5,60.8 115.0,48.9 122.5,39.1 130.0,31.9 137.5,27.3 145.0,25.6 152.5,26.6 160.0,29.7 167.5,34.9 175.0,42.0 182.5,50.6 190.0,60.1 197.5,70.1 205.0,80.0 212.5,89.3 220.0,97.7 227.5,104.8 235.0,110.3 242.5,114.1 250.0,116.0 257.5,116.0 265.0,114.4 272.5,111.3 280.0,106.9 287.5,101.5 295.0,95.3 302.5,88.7 310.0,82.0 317.5,75.6 325.0,69.8 332.5,64.8 340.0,60.8"/>
  <text x="250" y="30" font-size="12" fill="#1d6fd1">A: fixed 20 Hz</text>
  <text x="250" y="46" font-size="12" fill="#b4232c">B: inside the solver</text>
</svg>
```

Close enough to fool a glance at a plot, far enough apart to change every margin you would compute from it.
:::

::: context telemetry-hook The debugging print that changed the answer
Telemetry is the stream of numbers a vehicle, or a simulation, records about itself. A tempting shortcut is to put a "record this" line inside the derivative function, since every state passes through it. The recording then happens at stage times, including trial points from steps that were later thrown away, so the log contains moments the accepted trajectory never visited. If that hook also keeps a counter or a running average, it can even feed back into the answer. Record on the fixed tick schedule instead.
:::
