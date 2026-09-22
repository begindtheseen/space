---
id: l10-staging-events-and-zero-crossing-detection
title: Staging events and zero-crossing detection
minutes: 19
covers:
  - Staging and other discontinuous events; zero-crossing detection and bisection to the event time
---

Every model built so far in this module changes smoothly: mass depletes continuously, the centre of mass migrates continuously, even a slosh mode's frequency drifts continuously over a burn. Staging does not. A stage separates, an engine cuts off, a parachute deploys, a fairing releases — at each of these, some part of the state or the equations of motion themselves changes discontinuously, at a time the simulation does not know in advance and has to find. This lesson is about finding that time precisely, and about why an integrator that steps straight past it produces an error unlike any this module has discussed so far — not a truncation error that shrinks with the step, but a fixed, case-dependent error that does not.

## What an event is

An **event** is any instant defined implicitly by a condition on the state or time, rather than known ahead of the run: propellant depletion, an altitude or velocity threshold, a commanded shutdown time, ground impact. Every event has an **event function** $g(t)$, built so that $g$ changes sign exactly at the moment of interest — propellant remaining crossing zero, altitude crossing a target, velocity crossing a threshold — and the simulation's job during ordinary integration is only to watch for that sign change, at essentially no cost, by evaluating $g$ alongside the state at every step.

## Why a multi-stage step cannot be trusted across a discontinuity

RK4, and every other multi-stage method this curriculum has used, evaluates the derivative function several times *within* one step, at intermediate times the Numerical Methods module's own analysis depends on being genuinely representative of one consistent set of dynamics across the whole step. If the true physics changes partway through — thrust cuts off, mass jumps — some of those interior evaluations describe the vehicle before the change and some, if the step continues past the event before anyone notices, describe a regime that never actually existed: the old equations of motion evaluated at a time after they stopped applying. The resulting weighted combination is not a numerical approximation to anything physical; it is an answer to a question nobody asked. This is a different failure from truncation error, and it does not go away as the step shrinks in the way truncation error does — it goes away only when the step lands *exactly* on the event, every time.

## The protocol

Watching $g(t)$ at every accepted step gives a bracket, $t_{\text{lo}}$ and $t_{\text{hi}}$ with $g$ opposite in sign at the two ends, the moment a sign change is observed. From there, the Numerical Methods module's bisection method — chosen specifically because it only needs the bracket and a sign, never a derivative, and is guaranteed to converge — closes the bracket to a tight tolerance, well below anything that matters physically (microseconds, against a step measured in tens of milliseconds). The integrator is then stepped *exactly* to that time, using whatever step size gets there precisely rather than the nominal fixed step; the discontinuity — a mass jump, a thrust cutoff, a velocity or attitude change — is applied to the state; and the integrator restarts cleanly from the post-event state, with no stage history or internal memory carried across the discontinuity. Every one of those four actions matters: skip the bisection and you inherit the grid-quantisation error the second example below quantifies; skip the exact final step and the discontinuity is applied at the wrong state; skip the restart and a multi-stage method's next several steps are contaminated by stage evaluations that reach back across the discontinuity into the old dynamics.

::: example Bisecting to machine precision
Take the exact burnout time this module's mass-properties lesson already established analytically, $t_{\text{burn}} = 98.0665\,\mathrm{s}$, as ground truth, and find it by bisection on the event function $g(t) = m_{\text{prop}}(t)$ — remaining propellant, which crosses zero exactly there:

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F/(Isp*g0)
m_dry, m_prop0 = 4000.0, 25000.0
t_burn_true = m_prop0/mdot

def event_fn(t):
    return m_prop0 - mdot*t          # remaining propellant; crosses zero at burnout

def find_crossing(g, t_lo, t_hi, tol=1e-10, max_iter=200):
    sign_lo = g(t_lo) > 0
    for _ in range(max_iter):
        if t_hi - t_lo < tol:
            break
        t_mid = 0.5*(t_lo + t_hi)
        if (g(t_mid) > 0) == sign_lo:
            t_lo = t_mid
        else:
            t_hi = t_mid
    return 0.5*(t_lo + t_hi)

t_event = find_crossing(event_fn, 0.0, 200.0)
print("true burnout time:", t_burn_true)
print("bisected event time:", t_event, " error:", t_event - t_burn_true)
# true burnout time: 98.06649999999999
# bisected event time: 98.06649999995898  error: -4.101252670807298e-11
```

Forty-odd iterations of bisection find the event to $4.1\times10^{-11}\,\mathrm{s}$ — a timing precision no fixed step size used for the ordinary integration would ever deliver on its own, at a cost of a handful of extra evaluations of a function that is cheap to evaluate in the first place.
:::

::: example What grid quantisation actually costs
Contrast bisection with the common shortcut of only checking for the event at each fixed step and applying the discontinuity at the first grid point past it — "close enough for a step this small." Take the extra time the naive method spends still thrusting, at the post-depletion acceleration $F/m_{\text{dry}} = 800{,}000/4{,}000 = 200\,\mathrm{m/s^2}$, against the $-g_0$ it should have been coasting under:

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F/(Isp*g0)
m_dry, m_prop0 = 4000.0, 25000.0
t_burn_true = m_prop0/mdot

print("naive fixed-step grid quantisation:")
for dt in [0.5, 0.2, 0.1, 0.05]:
    t_detected = np.ceil(t_burn_true/dt)*dt
    err = t_detected - t_burn_true
    dv_error = (F/m_dry)*err          # extra thrust-on time at the post-clamp dry-mass acceleration
    print(f"  dt={dt:.2f} s  timing error={err:.4f} s  velocity error={dv_error:.3f} m/s")
# dt=0.50 s  timing error=0.4335 s  velocity error=86.700 m/s
# dt=0.20 s  timing error=0.1335 s  velocity error=26.700 m/s
# dt=0.10 s  timing error=0.0335 s  velocity error=6.700 m/s
# dt=0.05 s  timing error=0.0335 s  velocity error=6.700 m/s
```

At a half-second step, quantisation alone injects a $86.7\,\mathrm{m/s}$ burnout velocity error — enormous for a launch vehicle, where burnout velocity accuracy of metres per second matters. Even at a fine $50\,\mathrm{ms}$ step, the error is still $6.7\,\mathrm{m/s}$, and notice it did not shrink between $0.10\,\mathrm{s}$ and $0.05\,\mathrm{s}$: the true crossing happened to fall at almost the same *fraction* of both grids ($0.335$ and $0.670$ of a step respectively — different fractions, coincidentally similar absolute errors at these two step sizes), which is exactly the point. The quantisation error is not a smooth function of step size the way truncation error is; it depends on *where in the step the true event happens to fall*, which is different for every combination of thrust, mass and timing a dispersion campaign varies, and shows up as scatter in burnout conditions that is a property of the simulation's timing, not of the vehicle.
:::

::: key The event-detection protocol
Watch a scalar event function $g(t)$ at every step; on a sign change, bisect the bracket to a tight tolerance; step the integrator exactly to that time; apply the discontinuity to the state; restart the integrator cleanly on the far side, with no stage history carried across. Skipping any one of these steps reintroduces either a grid-quantisation error that does not shrink smoothly with step size, or a step whose interior evaluations mixed pre- and post-event physics — neither of which is truncation error, and neither of which a smaller nominal step size reliably fixes.
:::

::: warning "The step is already small, quantisation must be negligible"
The example above shows quantisation error is bounded by roughly (acceleration change) $\times$ (step size), not by some fraction of it — there is no regime where it becomes automatically negligible on the strength of the step feeling small. Making it small enough by brute force means using a step far finer than accuracy alone would ever require, everywhere in the simulation, for the entire run, purely to protect against an error that bisection removes for the cost of a few extra function evaluations exactly when needed. The quantisation floor scales with the step size used for the *entire* simulation; bisection's cost scales only with how precisely you ask it to find one event.
:::

::: warning Interpolating across the step instead of restarting
Once a step has been taken that overshoots an event, it is tempting to use the step's own dense-output interpolant to estimate the state at the event time, apply the discontinuity there, and carry on from the next nominal grid point — skipping a genuine restart. This can be a reasonable way to *locate* the crossing more cheaply than repeated bisection, but the interpolated trajectory up to that point is only trustworthy if the whole step it came from was integrated under one consistent set of dynamics — which is exactly what does not hold once the true event lies inside that step. The safe version of this shortcut still requires stepping the integrator to the event exactly and restarting fresh from there; what it saves is re-deriving the crossing time from scratch, not the restart itself.
:::

## Check yourself

::: check
What specifically distinguishes an event's timing error from ordinary integrator truncation error, and why does shrinking the nominal step size on its own not reliably fix it?
:::

::: answer
Truncation error is a smooth, predictable function of step size — it shrinks by a known factor when the step is halved, as the Numerical Methods module's convergence-order analysis showed. Grid-quantisation error from stepping over an event depends on where in the step the true event happens to fall, which is not predictable from the step size alone and can be nearly as large a *fraction* of a fine step as of a coarse one, as the worked example showed for $0.10\,\mathrm{s}$ versus $0.05\,\mathrm{s}$. Shrinking the step reduces the absolute size of the error's upper bound, but does not make the error behave like truncation error, and does not remove the case-to-case scatter that comes from the event's phase relative to the grid.
:::

::: check
Why must the integrator be restarted cleanly after an event, rather than continuing with its normal step sequence once the discontinuity has been applied?
:::

::: answer
A multi-stage method like RK4 computes each step from several interior derivative evaluations, and some methods additionally reuse information from previous steps. If the integrator is not explicitly restarted, any such carried-over information — stage values, an adaptive method's step-size history, a multistep method's remembered derivatives — still reflects the pre-event dynamics, contaminating steps taken after the discontinuity even though the state itself was updated correctly at the event. A clean restart discards all of that and begins the post-event dynamics exactly as if it were the start of a new integration.
:::

::: check
The bisection example converged to an event time accurate to about $4\times10^{-11}\,\mathrm{s}$. Is this level of precision actually necessary for a launch vehicle simulation, or is it wasted effort?
:::

::: answer
The precision itself costs very little — a few extra evaluations of a cheap scalar function — so there is little reason not to take it, but the *point* of bisection is not that this exact tolerance is required; it is that the achievable error is driven down to a level where it is negligible compared to every other error source in the simulation, removing event timing as a concern entirely. A tolerance of, say, a microsecond would very likely be equally adequate physically; the cost difference between a microsecond and $4\times10^{-11}\,\mathrm{s}$ is a handful of bisection iterations, not worth debating against the near-order-of-magnitude cost difference between quantisation at a coarse and a fine fixed step.
:::

::: check
A dispersion campaign runs the same booster with 200 different draws of thrust and propellant load, using a fixed-step integrator with grid-quantised event handling instead of bisection. What specific effect would you expect to see in the distribution of simulated burnout velocities, beyond an overall bias?
:::

::: answer
Scatter beyond what the physical dispersion in thrust and propellant load alone would produce: since each case's true burnout time falls at a different, effectively unpredictable fraction of the fixed step grid, each case accumulates a different quantisation error, adding a spurious contribution to the spread of burnout velocities that is an artefact of the simulation's timing rather than a property of the vehicle. This is exactly the "artificial spread in burnout conditions" and "fat tail" the exercises in this module warn about, and it would not appear, or would be negligible, if every case used bisection to land on its own true event time.
:::

::: check
Why is bisection preferred over Newton's method for finding an event's crossing time, given that Newton's method converges faster once it is close to the root?
:::

::: answer
Bisection only needs the event function's sign at the two bracket endpoints and is guaranteed to converge as long as the bracket is valid, which is exactly the situation event detection is in — a sign change has already been observed between two known times. Newton's method needs the event function's derivative and can diverge or jump outside the bracket entirely if that derivative is small or the function is not well-behaved near the root, which is a real risk for an event function built from a simulation's own state rather than a clean analytic expression. Since the crossing only needs to be found to a small, fixed tolerance and the function is cheap to evaluate, bisection's guaranteed convergence is worth more here than Newton's faster convergence rate.
:::

## Summary

| Item | Statement |
| --- | --- |
| Event function | $g(t)$, built to change sign exactly at the event of interest |
| Why not step over it | A multi-stage step's interior evaluations mix pre- and post-event dynamics; the result is not an approximation to anything physical |
| Protocol | Detect the sign change $\to$ bisect to a tight tolerance $\to$ step exactly to the event $\to$ apply the discontinuity $\to$ restart the integrator cleanly |
| Bisection precision | $4.1\times10^{-11}\,\mathrm{s}$ against an analytic burnout time of $98.0665\,\mathrm{s}$, at negligible extra cost |
| Grid-quantisation cost | Up to $86.7\,\mathrm{m/s}$ burnout velocity error at $\Delta t = 0.5\,\mathrm{s}$; still $6.7\,\mathrm{m/s}$ at $\Delta t = 0.05\,\mathrm{s}$ — does not shrink smoothly with step size |
| Monte Carlo consequence | Quantisation error's dependence on where the true event falls in the grid injects spurious, case-dependent scatter into any dispersed quantity computed after the event |

With staging handled exactly, the next lessons turn from what the plant computes to how faithfully the flight software running inside it represents what will actually fly — starting with the boundary between simulated flight code and the genuine article.
