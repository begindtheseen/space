---
id: l02-fixed-step-vs-variable-step-integration
title: Fixed-step vs. variable-step integration
minutes: 19
covers:
  - Fixed-step vs variable-step integration, and why a closed loop with a digital controller wants a fixed step
---

The Numerical Methods module gave you two families of integrator and the theory to choose between them on accuracy and cost alone: fixed-step methods such as RK4, where you pick one step size and defend it with a refinement study, and variable-step methods such as adaptive RK45 or Dormand–Prince, which choose their own step from an embedded error estimate and spend effort only where the dynamics demand it. Both are correct ways to solve an initial value problem, and for a standalone trajectory — a coast arc, a truth ephemeris, anything with no controller reading the state as it goes — the adaptive method is usually the better engineering choice: fewer function evaluations for the same accuracy, and a step size that tracks the dynamics instead of being fixed to the worst case ahead of time.

Put a digital controller in the loop and that calculus changes completely, and not because the physics changed. The plant box from the previous lesson can still be integrated as accurately as you like. What changes is the GNC box: it is not a mathematical function you get to call whenever it is convenient. It is a piece of software designed, analysed and gain-tuned for one specific sample period, and calling it at any other cadence does not make the simulation *more* accurate — it makes the simulation test a controller that does not exist. This lesson makes that case with two measurements: what an adaptive integrator's calls actually look like from the inside, and what happens to a real controller's output when it is exposed to them.

## Why a discrete controller has a sample period baked in

Everything the control tier taught you about a digital controller — its gains, its filter poles and zeros, the phase lag its zero-order hold contributes at crossover — is a property of its difference equation, and a difference equation is written in terms of a fixed interval $T$ between samples. A discrete integral term such as $u_k = u_{k-1} + K_i T\,e_k$ is not an approximation to "the plant's rate of change of $u$"; it is a decision, made at design time, about how much control action to add per sample, given a *specific* $T$. Call that same line of code with a different, and varying, interval between calls, and $K_i T$ silently stops being the gain the controller was designed with. The controller's code has not changed. The controller it implements has.

This is worth separating from a second, independent problem that variable-step integration creates: even if you were willing to accept a moving sample period, an adaptive integrator does not call the derivative function once per accepted step. It calls it several times per step, at fractional times inside the step, and — as the next section shows directly — sometimes at times *earlier* than the previous call. A controller with any internal memory (an integral term, a filter state, a rate limiter's last output) that updates itself every time it is invoked, rather than once per real control tick, is being driven by a sequence of calls that is neither evenly spaced nor even monotonic in time.

::: example What the derivative function actually sees
Instrument the right-hand side of an adaptive integration of the bus's torque-free motion — $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, the same vehicle as the previous lesson, tumbling at $\boldsymbol{\omega}_0 = (0.02, 0, 0.10)\,\mathrm{rad/s}$ — to log every time SciPy's `RK45` calls it.

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

Read the trace. The solver's first two calls, at $t = 0$ and $t = 0.01288\,\mathrm{s}$, are its own heuristic for sizing the first step — not part of any RK stage at all. The third call, at $t = 0.00554\,\mathrm{s}$, is *earlier* than the call before it: the real first step, of size $h = 0.02768\,\mathrm{s}$, has begun back at $t = 0$, and its stage fractions $(0,\ \tfrac15,\ \tfrac{3}{10},\ \tfrac45,\ \tfrac89,\ 1,\ 1)$ — Dormand–Prince's seven stages, the last two coincident — land at $0$, $0.00554$, $0.00830$, $0.02214$, $0.02460$, $0.02768$, $0.02768\,\mathrm{s}$. Twenty calls happen in this run before even three steps are accepted, and only three of them land inside what would be a single $100\,\mathrm{Hz}$ control period, $[0, 0.01)\,\mathrm{s}$. Nothing here required an outright rejected step — this is what a perfectly healthy, successful adaptive integration looks like from inside the function it calls.
:::

## What corrupted timing does to a real controller

The mechanism above is not an edge case reserved for pathological problems; it is how every adaptive Runge–Kutta method works, on every problem. The consequence is what matters, and it is straightforward to measure: take a controller with one line of internal memory, run it two ways with everything else held fixed, and compare.

::: example The same fourteen lines of controller, two different closed loops
A first-order plant $\dot y = -y + u$ is driven by a discrete integral controller designed for $T = 0.05\,\mathrm{s}$ ($20\,\mathrm{Hz}$), $u_k = u_{k-1} + K_i T\,(r - y_k)$ with $K_i = 20$ and reference $r = 1$.

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

Scenario A calls the controller exactly once every $T = 0.05\,\mathrm{s}$, 40 times over the run, and integrates the plant under a zero-order hold in between — the two-rate architecture the next lesson builds properly. Scenario B updates the identical integral term every time the adaptive solver calls the plant's derivative function: 536 times over the same 2 s, an average of 13.4 calls per nominal tick, 20 of them at a $\Delta t$ that is *negative* relative to the previous call, with $\Delta t$ itself ranging from $-0.057$ to $+0.034\,\mathrm{s}$ instead of a steady $0.05\,\mathrm{s}$.

The two trajectories disagree by an RMS of $0.0741$ against a reference of $1$ — 7.4% — and by as much as $0.107$ at their worst moment, with the response even oscillating on a different rhythm: $y_A$ swings $1.475 \to 1.155 \to 0.564 \to 1.320$ across $t = 0.5,\,1.0,\,1.5,\,2.0\,\mathrm{s}$ while $y_B$ swings $1.389 \to 1.248 \to 0.571 \to 1.241$ over the same instants — recognisably the same shape, measurably a different closed loop. No line of the controller's arithmetic changed between the two runs. Only the times at which it was allowed to run did.
:::

That last sentence is the whole lesson. A controller is a function of a state and a fixed interval since it last ran; corrupt the interval and you have simulated a different controller while believing you tested the real one.

::: key Why the loop wants a fixed step
A digital controller's gains, filter dynamics and hold-induced phase lag are all defined relative to its designed sample period $T$. Evaluating it at varying intervals — whether by design or by accident, such as calling it from inside an adaptive integrator's derivative function — changes its effective gains and phase without changing a line of its code, because the difference equation no longer means what it was designed to mean. The fix is architectural, not numerical: drive the integrator to each controller tick as a hard boundary, hold the control constant across the step, and never let the controller run inside a stage evaluation.
:::

::: warning "A small enough tolerance makes this negligible" is the wrong instinct
Tightening `rtol` and `atol` shrinks the adaptive integrator's *steps*, which looks like it should shrink the timing corruption too. It does not fix the mechanism: a tighter tolerance still produces multiple stage calls per step, an initial-step heuristic, and — on any problem with changing dynamics — still occasionally retries a step at the same starting time with a smaller $h$. The corruption in the closed-loop example above came from an ordinary, successful integration at reasonably tight tolerances; it is not a symptom of a loose tolerance that a tighter one removes. The only fix is to never let stateful code run from inside a derivative-function call in the first place.
:::

::: warning It is not only controllers
Anything with memory that updates itself once per call — an integral term, a digital filter, a rate limiter comparing against "the last command," a data logger assuming one entry per tick — is exposed to the same problem if it is reachable from inside an adaptive integrator's right-hand side. A common way this sneaks in is a logging or telemetry hook added for debugging, which runs every time the derivative function does and ends up producing a telemetry stream sampled at the integrator's internal stage times rather than at any sensible rate. Anything stateful belongs outside the integrator's derivative function, called only from a fixed, explicit schedule.
:::

## Check yourself

::: check
What specifically does a discrete controller's sample period $T$ determine, and why does calling the same controller code at a different, irregular cadence change its behaviour without changing any of its code?
:::

::: answer
$T$ sets the controller's effective gains, its discrete filter poles and zeros, and the phase lag contributed by the zero-order hold between updates — all of it derived at design time assuming updates arrive exactly $T$ apart. A difference equation like $u_k = u_{k-1} + K_iT\,e_k$ treats $T$ as a fixed constant multiplying the gain; if the actual interval between calls varies, the product $K_i \times (\text{actual interval})$ varies with it, so the controller computes a different control action for the same error than it was designed to, even though every line of its code is unchanged.
:::

::: check
In the derivative-call trace for the tumbling bus, the third call landed at $t = 0.00554\,\mathrm{s}$, earlier than the second call at $t = 0.01288\,\mathrm{s}$. Was this caused by a rejected step, and does the timing-corruption problem require a rejected step to occur?
:::

::: answer
No rejected step occurred in that run — SciPy's `RK45` accepted its first step on the first attempt. The "backward" call is the boundary between the solver's own initial-step-size heuristic (which probes ahead to $t = 0.01288\,\mathrm{s}$ to gauge a sensible first step) and the real first step's stages, which begin again at $t = 0$. The corruption problem does not require a rejection at all: an ordinary, fully successful adaptive step still calls the derivative function several times at fractional, non-monotonic times, which is already enough to scramble any per-call timing a hooked-in controller relies on. A rejected-and-retried step makes the same problem worse, not different in kind.
:::

::: check
The closed-loop example showed 536 derivative-function calls over 2 s against 40 proper controller ticks. If the controller's integral update had instead used a *fixed* $T = 0.05\,\mathrm{s}$ on every one of those 536 calls — ignoring the actual elapsed time entirely — would that fix the problem? Why or why not?
:::

::: answer
No. Using a fixed $T$ per call would make the controller add $K_iT\,e_k$ 536 times over 2 s instead of 40 times, so the total control effort would be roughly $536/40 \approx 13.4$ times too large, and the specific number of calls per real second is itself a property of the adaptive step size, which changes with the dynamics and is not something the control design can predict or account for. The problem is not merely "use the right interval per call" — it is that the controller must be called exactly once per real tick, no more and no fewer, which an adaptive integrator's internal call pattern does not provide no matter how the interval is computed.
:::

::: check
A colleague argues that variable-step integration should be banned from this module's simulations entirely, since it clearly corrupts a controller's behaviour. Is that the right conclusion?
:::

::: answer
Not entirely. The corruption is specific to calling stateful flight code from inside an adaptive integrator's derivative function; it says nothing against using an adaptive integrator for a trajectory that has no controller reading it as it goes — a high-accuracy truth propagation used to validate the fixed-step plant against, for instance, which is exactly the kind of run a later lesson on validation relies on. The right conclusion is architectural: keep the controller off the integrator's internal call graph entirely, which the next lesson does by making the controller tick a hard step boundary rather than banning adaptive methods everywhere in the module.
:::

::: check
Why is it not enough to reduce the adaptive integrator's `rtol` and `atol` until the corruption becomes small?
:::

::: answer
A tighter tolerance shrinks the accepted step size, which does increase the number of calls per real second and makes any one interval smaller — but it does not make the calls evenly spaced, monotonic, or aligned to the controller's design period, and it does not stop stateful code from being invoked many times where it should run once. The closed-loop example already used a fairly tight tolerance ($\mathrm{rtol} = 10^{-6}$) and still produced a 7.4% RMS error and 20 backward-time calls. The mechanism is structural, not a symptom of looseness, so no tolerance setting removes it.
:::

::: check
Two engineers each integrate the bus's torque-free motion for 1 s with `RK45` at the tolerances used in this lesson's first example, and each gets a different total number of derivative-function calls on their first attempt, though both end with the same accepted step boundaries. Is this evidence of a bug?
:::

::: answer
Not necessarily. The number of stage evaluations depends on implementation details of the initial-step-size heuristic and on floating-point evaluation order, which can differ across library versions even when both produce a correct, converged solution with the same accepted steps. What would be evidence of a bug is the accepted step boundaries or the solution values disagreeing beyond the stated tolerance — the raw call count by itself is an implementation detail, not a correctness criterion. This is also why a stateful hook into the derivative function is doubly dangerous: it makes the *simulation's answer* depend on an implementation detail that was never meant to be observable.
:::

## Summary

| Item | Statement |
| --- | --- |
| Fixed step | One step size $h$ throughout, chosen ahead of time, validated by a refinement study — used where the loop must see a controller on its designed grid |
| Variable step | Step chosen each time from an embedded error estimate, spends effort where curvature demands it — correct for a standalone trajectory with no controller reading it |
| Why the loop wants fixed step | A discrete controller's gains, filter dynamics and hold phase lag are properties of its design period $T$; a varying interval between calls silently changes all of them |
| What the calls look like | An adaptive step evaluates the derivative several times per step (stage fractions plus an initial-step heuristic), at times that are not evenly spaced and are not even guaranteed to increase monotonically |
| Measured cost | A discrete integral controller run from inside an adaptive RHS (536 calls, 20 of them backward in time, over 40 nominal ticks) diverged from the correctly clocked version by 7.4% RMS and 10.7% at worst, with a visibly different oscillation |
| Not a tolerance problem | Tightening `rtol`/`atol` does not fix it; the corruption is structural, not a symptom of a loose step |
| The fix | Architectural: make each controller tick a hard step boundary the integrator is driven to, hold the control constant across it, never call stateful code from inside a derivative evaluation |

The next lesson builds that architecture directly: the plant integrated at a fine, accurate step while the flight software runs at its own true rate, with the control held constant between ticks by a zero-order hold — the two-rate structure every closed-loop 6-DOF simulation in this curriculum is built on.
