---
id: l04-solve-ivp-methods
title: "solve_ivp and its six methods"
minutes: 21
covers:
  - 'solve_ivp methods: RK45, RK23, DOP853, Radau, BDF, LSODA'
---

Think about getting across town. A bicycle is cheap and fine for a short trip. A car costs more per mile but covers a long distance fast. A delivery truck is slow to start and awkward to park, but it is the only thing that can carry a piano. None of them is "the best". Each is best for a kind of trip.

ODE solvers are like that. In the last three lessons you built Euler, RK2 and RK4 by hand, then added an error estimate that lets the step size grow and shrink. SciPy packages all of that, done carefully, behind one function: **`scipy.integrate.solve_ivp`** — "solve an initial value problem". You hand it the right-hand side $f(t, \mathbf{y})$, a time span and a starting state. It hands back the trajectory. One argument, `method`, picks which of six engines does the work: `"RK23"`, `"RK45"`, `"DOP853"`, `"Radau"`, `"BDF"` and `"LSODA"`.

On a real GNC team this choice is made every day. The same trajectory tool propagates an orbit for thirty days, flies a rocket through ascent, and simulates a fast valve or a thermal model. Picking the wrong engine does not usually give a wrong answer. It gives a run that takes an hour instead of a second, or one that quietly stops early. This lesson teaches you to read what each method is good at, and to prove it with numbers instead of trusting a rule of thumb.

## The call and what comes back

Every method is driven the same way. You write a function `f(t, y)` that returns $\dot{\mathbf{y}}$ (read "y dot", the rate of change of the state), and you pass it with the time span and the initial state.

```python
import numpy as np
from scipy.integrate import solve_ivp

def decay(t, y, k):
    return -k * y                                 # dy/dt = -k y

sol = solve_ivp(decay, (0.0, 2.0), [1.0, 5.0], args=(2.0,))
print(sol.success, sol.status, sol.message)
print(sol.t.shape, sol.y.shape)                   # times, then (states, times)
print(np.round(sol.y[:, -1], 5))                  # final state
print(np.round(np.array([1.0, 5.0]) * np.exp(-4.0), 5))   # exact
print(sol.nfev)
# True 0 The solver successfully reached the end of the integration interval.
# (7,) (2, 7)
# [0.01836 0.09178]
# [0.01832 0.09158]
# 38
```

Walk through it line by line.

- **`fun(t, y)`** takes time first, then the state as a 1-D array, and returns the derivative with the same length.
- **`t_span=(0.0, 2.0)`** is a pair: start time and end time.
- **`y0`** is the state at the start. Here there are two independent decays, one starting at $1$ and one at $5$.
- **`args=(2.0,)`** passes extra constants to `fun` after `t` and `y`. Here that is the rate $k = 2\,\mathrm{s^{-1}}$. It saves you from writing a new function for every value of $k$.

The answer is an object with named fields. `sol.t` holds the times of the steps the solver took: seven times means six steps. `sol.y` holds the states, **one row per state, one column per time**, so `sol.y[:, -1]` is the final state and `sol.y[0]` is the whole history of the first component. `sol.success` is `True` when it reached the end; `sol.status` is `0` for "reached the end", `1` for "stopped by an event" (lesson 6), and `-1` for failure, with the reason in `sol.message`.

The last field, **`sol.nfev`**, is the number of **function evaluations** — how many times the solver called your `fun`. That is the honest measure of cost. In a real simulation, `fun` might interpolate aerodynamic tables and sum a dozen forces, so it is almost all of the run time.

::: warning The result is transposed from what you might expect
`sol.y` has shape `(number of states, number of times)`. The hand-built `integrate` from the RK4 lesson returned `(times, states)`, and so does the older `scipy.integrate.odeint`. Mixing them up gives arrays that broadcast without error and plot nonsense. Also, `odeint` wants `f(y, t)` with the state first; `solve_ivp` wants `f(t, y)`. Say "time first" out loud when you write the function.
:::

Notice the answer is only good to about three digits: $0.01836$ against the exact $0.01832$. That is not a bug. The default tolerances are loose ($10^{-3}$ relative), and the next lesson is all about setting them. For now, keep in mind that every method below is asked to meet the same tolerance, and the question is how much work it spends doing so.

## The explicit Runge–Kutta family: RK23, RK45, DOP853

Three of the six methods are the same idea you built by hand: an **explicit Runge–Kutta** method. "Explicit" means each new state is computed directly from slopes you can already evaluate — no equation to solve. Each step samples $f$ at a few points inside the step (the **stages**), blends them, and also forms a second, lower-order answer from the same samples. The gap between the two is the error estimate that drives the step size, exactly as in the adaptive-step lesson. That trick of two answers from one set of stages is called an **[[embedded pair|embedded-pair-names]]**.

The three differ in **order** — the power $p$ in "global error shrinks like $h^p$":

| Method | Order of the answer | Error estimate from | New evaluations per step |
| --- | --- | --- | --- |
| `RK23` (Bogacki–Shampine) | 3 | order 2 | 3 |
| `RK45` (Dormand–Prince) | 5 | order 4 | 6 |
| `DOP853` (Dormand–Prince 8) | 8 | orders 5 and 3 | 12 |

`RK45` is the default when you leave `method` out. The counts are "new" evaluations because each of these pairs reuses its last stage as the next step's first stage, a trick called **[[first same as last|fsal]]**.

Higher order costs more per step. What does it buy? Here is the test that settles it: a circular orbit $7000\,\mathrm{km}$ from Earth's center, flown for one full revolution with each method at three tolerances. After one period the spacecraft should be exactly back where it started, so the distance it misses by is the error. (The `atol` here is set a thousand times below `rtol` so that `rtol` alone is in charge; lesson 5 explains both.)

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14                      # Earth, m^3/s^2

def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6                                # circular orbit radius, m
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)       # one revolution, s

for rtol in [1e-6, 1e-9, 1e-12]:
    for method in ["RK23", "RK45", "DOP853"]:
        sol = solve_ivp(two_body, (0.0, T), y0, args=(MU,),
                        method=method, rtol=rtol, atol=1e-3 * rtol)
        miss = np.linalg.norm(sol.y[:3, -1] - y0[:3])
        print(f"{rtol:.0e} {method:6s} nfev={sol.nfev:6d} steps={sol.t.size - 1:5d} miss={miss:.1e} m")
# 1e-06 RK23   nfev=   827 steps=  260 miss=1.1e+02 m
# 1e-06 RK45   nfev=   254 steps=   37 miss=3.0e+02 m
# 1e-06 DOP853 nfev=   230 steps=   19 miss=2.0e+01 m
# 1e-09 RK23   nfev=  7802 steps= 2585 miss=1.1e-01 m
# 1e-09 RK45   nfev=   770 steps=  123 miss=2.6e-02 m
# 1e-09 DOP853 nfev=   374 steps=   31 miss=1.7e-02 m
# 1e-12 RK23   nfev= 77711 steps=25888 miss=1.1e-04 m
# 1e-12 RK45   nfev=  2864 steps=  473 miss=6.6e-05 m
# 1e-12 DOP853 nfev=   782 steps=   65 miss=1.7e-05 m
```

::: example Reading the table
**At loose tolerance ($10^{-6}$).** All three land within a few hundred meters, and their costs are close: 827, 254 and 230 evaluations. RK23 takes many cheap steps. DOP853 takes few expensive ones. Nothing much separates them.

**At tight tolerance ($10^{-12}$).** Now they split apart. RK23 needs $77{,}711$ evaluations. RK45 needs $2{,}864$. DOP853 needs $782$ and misses by the smallest amount, $17\,\mu\mathrm{m}$ (read $\mu\mathrm{m}$ as "micrometers", millionths of a meter).

**How the step counts grew.** Going from $10^{-6}$ to $10^{-12}$ is a factor of a million in tolerance. RK23's steps went from $260$ to $25{,}888$ — about $100$ times more. RK45's went from $37$ to $473$ — about $13$ times. DOP853's went from $19$ to $65$ — about $3.4$ times.

**The cost ratio.** At $10^{-12}$, RK45 spends $2864 / 782 \approx 3.7$ times the work of DOP853, and RK23 spends about $99$ times the work.

**Sanity check.** Divide evaluations by steps: $77711 / 25888 \approx 3.0$, $2864 / 473 \approx 6.1$, $782 / 65 \approx 12$. Those match the "new evaluations per step" column (plus a few rejected steps and the start-up), so the table is telling the truth.
:::

The pattern has a simple cause. To meet a tolerance $\varepsilon$ (read "epsilon", a small allowed error), a method of higher order can take much bigger steps, and as $\varepsilon$ shrinks its steps shrink more slowly. The **[[work-precision|work-precision-plot]]** picture is the one engineers draw to compare solvers: cost on one axis, error on the other.

::: key
Choose DOP853 over RK45 when you need tight tolerances. DOP853 is eighth order, so near rtol of 1e-12 it reaches the same accuracy in far fewer, larger steps than the fifth-order RK45, which is why it is the default choice for high-accuracy orbit propagation.
:::

::: note Why higher order wins as the tolerance tightens
A method whose error estimate is of order $q$ makes a local error of about $C h^{q+1}$ per step, where $C$ depends on how curvy the solution is. The controller picks $h$ so that this equals the tolerance: $C h^{q+1} = \varepsilon$, which gives

$$
h = \left(\frac{\varepsilon}{C}\right)^{1/(q+1)}.
$$

The number of steps over a fixed span is the span divided by $h$, so it grows like $\varepsilon^{-1/(q+1)}$. Tighten $\varepsilon$ by $10^6$ and the step count grows by $10^{6/(q+1)}$. For RK23, whose estimate is order $q = 2$, that is $10^{6/3} = 100$ — exactly what we saw. For RK45, $q = 4$, it is $10^{6/5} \approx 16$; we saw $13$. For DOP853 the growth is smaller still. The cost per step is a fixed constant for each method, so at tight tolerances the method with the gentlest growth wins, however expensive its steps.
:::

When is RK23 the right pick? When you only want two or three digits — a quick look, a plot for a meeting — or when the right-hand side is rough (tables with kinks, switching logic), where a high-order method's extra accuracy is wasted because the solution is not smooth enough to use it.

## The implicit methods: Radau and BDF

Some problems break explicit methods entirely. Here is a small one that looks harmless. A fin actuator follows a slow steering command with a time constant $\tau = 1\,\mathrm{ms}$ (read "tau"). The fin angle then slowly turns the vehicle's heading. The command changes over seconds; the fin settles in milliseconds.

```python
import numpy as np
from scipy.integrate import solve_ivp

tau = 1e-3                               # actuator time constant, s

def servo(t, y):
    cmd = 0.1 * np.sin(np.pi * t)        # slow command, rad
    fin, heading = y
    return [(cmd - fin) / tau, 2.0 * fin]

for method in ["RK45", "DOP853", "Radau", "BDF", "LSODA"]:
    sol = solve_ivp(servo, (0.0, 10.5), [0.0, 0.0], method=method,
                    rtol=1e-6, atol=1e-9)
    print(f"{method:6s} nfev={sol.nfev:6d} njev={sol.njev:3d} "
          f"steps={sol.t.size - 1:5d} heading={sol.y[1, -1]:.5f}")
# RK45   nfev= 29306 njev=  0 steps= 4873 heading=0.06346
# DOP853 nfev= 30086 njev=  0 steps= 2034 heading=0.06346
# Radau  nfev=  2828 njev=  1 steps=  378 heading=0.06346
# BDF    nfev=   875 njev=  8 steps=  417 heading=0.06346
# LSODA  nfev=  2321 njev= 73 steps= 1149 heading=0.06346
```

::: example A fast actuator on a slow vehicle
**Everyone agrees on the answer.** All five methods give a final heading of $0.06346\,\mathrm{rad}$, about $3.6°$. So this is a question of cost, not correctness.

**The explicit methods crawl.** RK45 takes $4873$ steps over $10.5\,\mathrm{s}$: an average step of $10.5 / 4873 \approx 2.2\,\mathrm{ms}$, about two actuator time constants. That is the solver's ceiling. Any bigger and the fin equation blows up numerically, even though after the first few milliseconds the fin is only drifting slowly with its command. DOP853 does no better: its higher order is useless when the limit is stability, not accuracy.

**The implicit methods stride.** BDF needs $875$ evaluations, about $1/33$ of RK45's $29{,}306$. Radau needs $2828$, about a tenth.

**Sanity check.** A step of $2.2\,\mathrm{ms}$ to follow a command whose period is $2\,\mathrm{s}$ means about $900$ steps per wiggle. Nothing in the answer needs that. When the step count is set by the fastest thing in the model rather than by what you are trying to see, suspect this kind of problem.
:::

This situation has a name, **stiffness**: a system with some very fast, well-damped parts alongside the slow parts you care about. Lesson 7 is devoted to recognizing it. Here the point is the cure: an **implicit** method.

An implicit method evaluates the slope at the *end* of the step, where the new state is still unknown. So each step becomes an equation to solve for the new state, and the solver solves it with **[[Newton's method|newton-inside]]** — the same root-finding idea as `scipy.optimize`, applied to a vector. Newton's method needs the **[[Jacobian|jacobian-matrix]]** $\partial \mathbf{f} / \partial \mathbf{y}$, the matrix of how each derivative changes with each state. That is what `sol.njev` counts. If you do not supply one with `jac=`, the solver builds it from extra calls to `fun`. The reward for all this machinery is **[[stability at large steps|explicit-vs-implicit]]**: the fast part can no longer blow up, so the step is set by accuracy on the slow motion.

- **`Radau`** is an implicit Runge–Kutta method of order 5 (from the Radau IIA family). Each step is self-contained and very accurate. It is a strong choice for stiff problems at tight tolerances.
- **`BDF`** stands for **backward differentiation formulas**. It is a *multistep* method: instead of sampling inside the step, it fits a polynomial through the last few computed points and demands that the polynomial's slope match $f$ at the new point. It changes its own order between 1 and 5 as it goes. It is usually the cheapest choice for large stiff systems at moderate tolerances.

::: warning Implicit is not "more accurate"
On a smooth, non-stiff problem like the orbit, Radau and BDF are slower than DOP853 — each step solves a system of equations, and BDF's order tops out at 5. Implicit methods buy stability, not accuracy. Use them when the step count is being set by a fast, damped part of the model, not as a general upgrade.
:::

## LSODA: the one that switches

The sixth method, **`LSODA`**, is a wrapper around a long-lived Fortran code from the **[[ODEPACK|odepack-history]]** library. It watches the problem as it runs. While the problem looks non-stiff, it uses the **Adams** family of multistep methods, which need no Jacobian and suit smooth problems. When it detects stiffness, it switches to BDF, and back again if the stiffness goes away.

That makes it a good first try when you do not know what you have — a new model, or one whose stiffness comes and goes, like a rocket whose engine valves are fast during startup and irrelevant in coast. In the servo run above it got through with $2321$ evaluations without being told the problem was stiff.

The trade-off is control. LSODA's switching is automatic and its internals are older and less transparent, so when you *do* know the problem's character, the dedicated method (DOP853 for smooth and demanding, Radau or BDF for stiff) is the better engineering choice. You can defend it in a review.

## Choosing, and proving the choice

Here is the whole menu in one place.

| Method | Kind | Best for |
| --- | --- | --- |
| `RK23` | explicit RK, order 3 | loose tolerances, rough right-hand sides, quick looks |
| `RK45` | explicit RK, order 5 | the default; moderate tolerances on smooth, non-stiff problems |
| `DOP853` | explicit RK, order 8 | tight tolerances on smooth problems: orbit propagation |
| `Radau` | implicit RK, order 5 | stiff problems, especially at tight tolerances |
| `BDF` | implicit multistep, order 1–5 | large stiff systems at moderate tolerances |
| `LSODA` | switches Adams ↔ BDF | unknown or changing stiffness |

::: key
Decision rule for `method=`: smooth and non-stiff at loose to moderate tolerance → RK45; smooth and non-stiff at tight tolerance (around $10^{-10}$ to $10^{-12}$) → DOP853; stiff → Radau or BDF; unsure → LSODA as a first look, then pick the dedicated method.
:::

A rule of thumb is where you start. The proof is a short experiment like the two above: run the candidates at your real tolerance on your real problem and compare `nfev` and the answer. If two methods agree to your required accuracy, the one with the smaller `nfev` wins. If they disagree, at least one of them is not meeting the tolerance, and you have learned something important before trusting either.

::: warning Check `success` every time
`solve_ivp` does not raise an error when it fails. If the step size collapses (a singularity, a state going to NaN), it returns early with `sol.success == False` and `sol.status == -1`, and `sol.y[:, -1]` is wherever it stopped. Code that takes the last column without checking will happily report a spacecraft state from the middle of the run. Test `sol.success` and raise with `sol.message` if it is false.
:::

## Check yourself

::: check
A colleague writes `sol = solve_ivp(f, (0, 100), y0)` for a six-state problem and then `x_final = sol.y[-1]`. What did they actually get, and what should they write?
:::

::: answer
`sol.y` has shape `(6, number of times)`, one row per state. So `sol.y[-1]` is the last *row*: the whole time history of the sixth state, not the final state. The final state is the last *column*, `sol.y[:, -1]`, a length-6 array. They should also check `sol.success` first, because on failure the last column is wherever the solver stopped.
:::

::: check
Using the orbit table, estimate how many function evaluations RK45 and DOP853 would need if you loosened the tolerance from $10^{-12}$ to $10^{-9}$, and compare with the table. Which method's cost fell by the larger factor, and why?
:::

::: answer
From the table: RK45 fell from $2864$ to $770$ evaluations, a factor of about $3.7$. DOP853 fell from $782$ to $374$, a factor of about $2.1$.

RK45's cost fell more because its step count depends more strongly on the tolerance: steps grow like $\varepsilon^{-1/(q+1)}$, and the lower the order, the bigger that exponent. A factor of $1000$ in tolerance changes RK45's steps by roughly $1000^{1/5} \approx 4$ but DOP853's by much less. That is the same reason DOP853's advantage shrinks at loose tolerance: at $10^{-6}$ the two cost about the same.
:::

::: check
Why is DOP853 no faster than RK45 on the servo problem, even though it is three orders higher?
:::

::: answer
On the servo problem the step size is not set by accuracy. It is set by stability: the fast fin equation, with time constant $1\,\mathrm{ms}$, blows up numerically if an explicit step is more than a few milliseconds long. Every explicit method has such a ceiling, and a higher order does not raise it much. So DOP853 takes fewer steps (2034 against 4873) but each costs twice as many evaluations, and the totals end up about the same (30,086 against 29,306). Only an implicit method removes the ceiling.
:::

::: check
What do `nfev`, `njev` and `nlu` count, and which of them are always zero for RK45?
:::

::: answer
`nfev` counts calls to your right-hand side `fun`. `njev` counts Jacobian evaluations, and `nlu` counts LU factorizations — the matrix work an implicit method does to solve its equation each step with Newton's method. RK45 is explicit: it never solves an equation, never needs a Jacobian and never factors a matrix, so `njev` and `nlu` are always $0$ for it (and for RK23 and DOP853).
:::

::: check
You are handed a new re-entry heating model: a trajectory coupled to a thin-skin temperature that responds in about $5\,\mathrm{ms}$, flown for $600\,\mathrm{s}$. You do not know whether it is stiff. Describe the experiment you would run to choose a method.
:::

::: answer
Run the same case, at the tolerance you actually need, with RK45, BDF (or Radau) and LSODA, and record `nfev`, the step count, and a few key outputs such as peak temperature and final velocity.

If RK45's step count is huge — average step of a few milliseconds, tied to the $5\,\mathrm{ms}$ skin response, so tens of thousands of steps for $600\,\mathrm{s}$ — while BDF or Radau finish in a few hundred or thousand steps with the same answers, the problem is stiff and the implicit method is the choice. If RK45 is as cheap as or cheaper than the implicit methods, it is not stiff, and RK45 (or DOP853 at tight tolerance) is the choice. In both cases, confirm the chosen method agrees with the others to the required accuracy before trusting it.
:::

## Summary

| Idea | In one line |
| --- | --- |
| The call | `solve_ivp(fun, (t0, t1), y0, method=..., args=...)` with `fun(t, y, *args)` |
| The result | `sol.t` times; `sol.y` shape (states, times); final state `sol.y[:, -1]` |
| Health check | `sol.success`, `sol.status` (0 end, 1 event, −1 failure), `sol.message` |
| Cost | `sol.nfev` calls to `fun`; `njev`, `nlu` for implicit methods |
| RK23, RK45, DOP853 | explicit embedded pairs of order 3, 5, 8; 3, 6, 12 evaluations per step |
| Tight tolerance | DOP853: steps grow slowest as rtol shrinks, so it wins near $10^{-12}$ |
| Radau, BDF | implicit, stable at large steps; for stiff problems, not for accuracy |
| LSODA | switches Adams ↔ BDF automatically; good first look at an unknown problem |
| Proof | compare `nfev` and answers at your real tolerance on your real problem |

Every run in this lesson leaned on `rtol` and `atol` without explaining them. The next lesson opens up the step controller's accept-or-reject test, shows how to choose both tolerances from the size of each state, and separates the tolerances from the output options `t_eval` and `dense_output`.

::: context embedded-pair-names Who the pairs are named after
Carl Runge published the first methods of this kind in 1895, and Martin Wilhelm Kutta extended them in 1901, which is where "Runge–Kutta" comes from. The pairs inside `solve_ivp` are much younger. John Dormand and Peter Prince published their order-5 pair with an order-4 estimate in 1980; it is the heart of `RK45` and of MATLAB's `ode45`. Przemysław Bogacki and Lawrence Shampine published the order-3 pair in 1989; it is `RK23`, and MATLAB's `ode23`. `DOP853` is the eighth-order Dormand–Prince method as coded by Ernst Hairer and Gerhard Wanner, the authors of the standard reference on these solvers.
:::

::: context fsal Reusing the last stage
In the Dormand–Prince and Bogacki–Shampine pairs, the last stage of a step is evaluated at the new time and the new state — exactly the point where the next step starts. So the next step's first slope is already known, and one evaluation per step is saved. RK45 has seven stages but pays for six; RK23 has four but pays for three.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="50" x2="40" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="50" x2="180" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="50" x2="320" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <text x="110" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">step n</text>
  <text x="250" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">step n + 1</text>
  <circle cx="40" cy="60" r="5" fill="#1d6fd1"/>
  <circle cx="75" cy="60" r="5" fill="#1d6fd1"/>
  <circle cx="110" cy="60" r="5" fill="#1d6fd1"/>
  <circle cx="145" cy="60" r="5" fill="#1d6fd1"/>
  <circle cx="180" cy="60" r="7" fill="#b4232c"/>
  <circle cx="215" cy="60" r="5" fill="#8fb8f0"/>
  <circle cx="250" cy="60" r="5" fill="#8fb8f0"/>
  <circle cx="285" cy="60" r="5" fill="#8fb8f0"/>
  <circle cx="320" cy="60" r="5" fill="#8fb8f0"/>
  <text x="180" y="95" font-size="12" text-anchor="middle" fill="#b4232c">last stage of n = first stage of n + 1</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#6c7a93">one slope computed once, used twice</text>
</svg>
```
:::

::: context work-precision-plot The work-precision picture
Plot error against cost on log-log axes, one line per method, and you get a work-precision diagram. Here are the orbit results from the table (one revolution, three tolerances each). Lower and further left is better. The steeper a line falls, the less extra work each extra digit costs. DOP853's line sits left of the others and the gap widens as the error shrinks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">100</text>
  <text x="147" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">1,000</text>
  <text x="243" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">10,000</text>
  <text x="330" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">100,000</text>
  <text x="195" y="202" font-size="12" text-anchor="middle" fill="#1f2a44">function evaluations</text>
  <text x="16" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 16 95)">miss</text>
  <text x="46" y="32" font-size="11" text-anchor="end" fill="#6c7a93">1 km</text>
  <text x="46" y="93" font-size="11" text-anchor="end" fill="#6c7a93">1 m</text>
  <text x="46" y="171" font-size="11" text-anchor="end" fill="#6c7a93">1 µm</text>
  <polyline points="139,43 233,90 329,136" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="139" cy="43" r="3.5" fill="#6c7a93"/><circle cx="233" cy="90" r="3.5" fill="#6c7a93"/><circle cx="329" cy="136" r="3.5" fill="#6c7a93"/>
  <text x="290" y="100" font-size="11" fill="#6c7a93">RK23</text>
  <polyline points="89,36 136,99 191,140" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="89" cy="36" r="3.5" fill="#1d6fd1"/><circle cx="136" cy="99" r="3.5" fill="#1d6fd1"/><circle cx="191" cy="140" r="3.5" fill="#1d6fd1"/>
  <text x="198" y="138" font-size="11" fill="#1d6fd1">RK45</text>
  <polyline points="85,54 105,102 136,149" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="85" cy="54" r="3.5" fill="#b4232c"/><circle cx="105" cy="102" r="3.5" fill="#b4232c"/><circle cx="136" cy="149" r="3.5" fill="#b4232c"/>
  <text x="70" y="164" font-size="11" fill="#b4232c">DOP853</text>
</svg>
```
:::

::: context newton-inside Newton's method inside every step
An implicit step asks: which new state $\mathbf{y}_{n+1}$ makes the step formula balance? That is a root-finding problem, $\mathbf{g}(\mathbf{y}_{n+1}) = \mathbf{0}$. Newton's method guesses, measures how far off the balance is, uses the Jacobian to predict the correction, and repeats. Each correction needs a linear solve, done by factoring a matrix into lower and upper triangles — an LU factorization, the `nlu` count. The solvers keep one factorization for many steps when they can, which is why `nlu` is far smaller than the step count.
:::

::: context jacobian-matrix The matrix of sensitivities
For a state with $n$ components, the Jacobian is an $n \times n$ grid. The entry in row $i$, column $j$ is $\partial f_i / \partial y_j$: how much the rate of change of state $i$ moves when you nudge state $j$. For the servo it is

$$
\begin{bmatrix} -1/\tau & 0 \\ 2 & 0 \end{bmatrix}.
$$

The $-1/\tau = -1000\,\mathrm{s^{-1}}$ entry is the fast actuator, and its size is the fingerprint of stiffness. If you do not pass `jac=`, Radau and BDF estimate the matrix by nudging each state in turn, which costs $n$ extra calls to `fun`. For a large model that is worth avoiding.
:::

::: context explicit-vs-implicit Where the slope is taken
Take the fin equation alone, $\dot{y} = -y/\tau$, and one big step $h = 5\tau$. Explicit Euler uses the slope at the start and overshoots: $y_1 = (1 - 5)\,y_0 = -4\,y_0$, and each step multiplies by $-4$ again, so it explodes. Implicit Euler uses the slope at the end: $y_1 = y_0 / (1 + 5) = y_0/6$, a steady decay at any step size. The true answer, $e^{-5} y_0 \approx 0.0067\,y_0$, is near zero; implicit is not exact, but it stays sane.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="330" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <text x="336" y="114" font-size="11" fill="#6c7a93">t</text>
  <line x1="120" y1="104" x2="120" y2="116" stroke="#6c7a93" stroke-width="1"/>
  <text x="120" y="128" font-size="11" text-anchor="middle" fill="#6c7a93">h = 5τ</text>
  <polyline points="40,90.0 44,94.4 48,97.9 52,100.6 56,102.6 60,104.3 64,105.5 68,106.5 72,107.3 76,107.9 80,108.4 84,108.7 88,109.0 92,109.2 96,109.4 100,109.5 104,109.6 108,109.7 112,109.8 116,109.8 120,109.9 124,109.9 128,109.9 132,109.9 136,110.0 140,110.0 144,110.0 148,110.0 152,110.0 156,110.0 160,110.0 164,110.0 168,110.0 172,110.0 176,110.0 180,110.0 184,110.0 188,110.0 192,110.0 196,110.0 200,110.0 204,110.0 208,110.0 212,110.0 216,110.0 220,110.0 224,110.0 228,110.0 232,110.0 236,110.0 240,110.0 244,110.0 248,110.0 252,110.0 256,110.0 260,110.0 264,110.0 268,110.0 272,110.0 276,110.0 280,110.0 284,110.0 288,110.0 292,110.0 296,110.0 300,110.0 304,110.0 308,110.0 312,110.0 316,110.0 320,110.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="200" y="102" font-size="11" fill="#1f2a44">true decay</text>
  <circle cx="40" cy="90" r="4" fill="#1f2a44"/>
  <text x="36" y="80" font-size="11" fill="#1f2a44">y0</text>
  <line x1="40" y1="90" x2="120" y2="190" stroke="#b4232c" stroke-width="2"/>
  <circle cx="120" cy="190" r="4" fill="#b4232c"/>
  <text x="130" y="194" font-size="11" fill="#b4232c">explicit: −4 y0, flips and grows</text>
  <line x1="40" y1="90" x2="120" y2="106.7" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="120" cy="106.7" r="4" fill="#1d6fd1"/>
  <text x="130" y="150" font-size="11" fill="#1d6fd1">implicit: y0 / 6, a steady decay</text>
  <line x1="126" y1="143" x2="121" y2="112" stroke="#1d6fd1" stroke-width="1"/>
</svg>
```
:::

::: context odepack-history A Fortran veteran
LSODA was written by Linda Petzold and Alan Hindmarsh at Lawrence Livermore National Laboratory in the early 1980s, as part of the ODEPACK collection of Fortran solvers. Its name reads as "Livermore Solver for ODEs, with Automatic method switching". The same Fortran code has been called from Python, R and many engineering tools for about forty years. That long record is a reason to trust it; its age is why its options look different from the other five methods.
:::
