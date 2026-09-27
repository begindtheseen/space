---
id: l10-staging-events-and-zero-crossing-detection
title: Staging events and zero-crossing detection
minutes: 24
covers:
  - Staging and other discontinuous events; zero-crossing detection and bisection to the event time
---

Picture yourself on a train at night, trying to get off at the right stop. You are reading a book, and you only look up once a minute. The stop comes and goes while your nose is in the book. When you next look up, you are already past it. The trouble was *when* you looked.

A simulation can make exactly that mistake. Almost everything in this module so far changes smoothly: mass drains, the center of mass slides, a slosh frequency drifts. But some things do not change gently at all. A stage separates. An engine cuts off. A parachute opens. A fairing — the nose cover that protects the payload — falls away. At each of these moments some part of the vehicle, or the rules it obeys, jumps. And the simulation does not know in advance *when* the jump will happen. It has to find out.

This lesson is about finding that moment precisely. It also explains why an integrator that steps straight past it makes a new kind of error — not the small, shrinking truncation error you already know, but a fixed error that does not go away when you make the step smaller. On a real rocket, the most important of these moments is **[[staging|staging-word]]**, the instant one stage's job ends and the next begins.

## What an event is

An **event** is a moment that you cannot write down before the run starts. You only know the *condition* that defines it. "When the propellant runs out." "When the altitude reaches 80 km." "When the vehicle hits the ground." The time depends on everything that happened earlier in the flight, so the simulation must discover it as it goes.

A jump like this is called a **discontinuity** — a place where a quantity changes all at once instead of smoothly. At burnout, thrust drops from full to zero in an instant. At separation, mass drops by the whole weight of the spent stage.

To find an event, you build an **event function**, written $g(t)$ and read "g of t". It is a single number, computed from the state, that is designed to **change sign** exactly at the moment you care about:

- burnout: $g(t) = m_{\text{prop}}(t)$, the propellant left. Positive while there is fuel, zero at burnout, and it would go negative after.
- reaching a target altitude $h^*$ ("h star"): $g(t) = h(t) - h^*$. Negative below, positive above.
- ground impact: $g(t) = h(t)$, the height above the ground.

The trick is that you never have to predict the event. You compute $g$ alongside the state at every step, which costs almost nothing, and you watch for the step where its sign flips. A flip from plus to minus (or minus to plus) between two steps means the event happened **[[somewhere in between|sign-change]]**. That is called a **zero crossing**, because $g$ passed through zero.

::: example Choosing event functions
A booster burns its $25{,}000\,\mathrm{kg}$ of propellant at a constant $\dot m = 254.93\,\mathrm{kg/s}$ (read $\dot m$ as "m dot", the mass flow rate). Write the burnout event function and find where it crosses zero.

Propellant left at time $t$ is the starting load minus what has flowed out:

$$
g(t) = m_{\text{prop}}(t) = 25{,}000 - 254.93\,t.
$$

It is zero when $254.93\,t = 25{,}000$, so $t = 25{,}000 / 254.93 \approx 98.07\,\mathrm{s}$.

Check the signs. At $t = 98\,\mathrm{s}$, $g = 25{,}000 - 24{,}983 = +17\,\mathrm{kg}$: a little fuel left. At $t = 98.1\,\mathrm{s}$, $g = 25{,}000 - 25{,}009 = -9\,\mathrm{kg}$: less than nothing, which is how you know you have passed the moment. The sign flipped between those two times, so the event lies in that tenth of a second — about a minute and a half into the flight, a normal first-stage burn time.

In a real simulation $g$ comes out of the whole 6-DOF state, with no formula to solve. So we need a method that only asks "what is the sign of $g$ right now?"
:::

## Why a step must not straddle an event

Recall how RK4 takes one step. It does not look at the vehicle only once. It measures the slope — the derivative — four times: at the start of the step, twice at the middle, and once at the end. Then it blends those four samples into one weighted average. The whole method, and its famous accuracy, rests on one assumption: all four samples describe the *same* smooth physics across the step.

Here is an everyday version. Suppose you want your average speed on a ten-minute drive. You check the speedometer four times and average the readings. That works if you drove steadily. But suppose you parked halfway through. Now two readings are from driving and two are from sitting still — or worse, if the car did not know it had parked, some readings describe a car still driving after it stopped. The "average" describes a trip nobody took.

That is what happens when an RK4 step **[[straddles a discontinuity|rk4-straddle]]**. Suppose thrust cuts off partway through the step. Some slope samples describe the vehicle before cutoff. Others describe the old, thrusting equations of motion evaluated at times after they stopped being true. The weighted blend is not an approximation to any real motion. It is an answer to a question nobody asked.

This is a different failure from **truncation error**, the small error every integrator makes because it takes finite steps. Truncation error shrinks in a predictable way when you shrink the step: halve the step and RK4's error falls by about $2^4 = 16$. The straddling error does not behave like that. It goes away only when a step ends *exactly* on the event, every time.

## Closing in: bisection

Once you have seen the sign flip, you know the event lies between two times: the last step where $g$ had its old sign, call it $t_{\text{lo}}$ ("t low"), and the first step where it had the new sign, $t_{\text{hi}}$ ("t high"). That pair of times is a **bracket** — a window you know contains the answer.

Now play the number-guessing game. "I am thinking of a number from 1 to 100." You guess 50. "Lower." You guess 25. "Higher." Every guess cuts the range in half, so you **[[close in very fast|guessing-game]]**. That is **bisection**:

1. Find the middle of the bracket, $t_{\text{mid}} = \tfrac12(t_{\text{lo}} + t_{\text{hi}})$.
2. Compute $g(t_{\text{mid}})$ and look only at its sign.
3. If it has the same sign as $g(t_{\text{lo}})$, the crossing is in the upper half, so move $t_{\text{lo}}$ up to $t_{\text{mid}}$. Otherwise the crossing is in the lower half, so move $t_{\text{hi}}$ down to $t_{\text{mid}}$.
4. Repeat until the bracket is narrower than your tolerance.

After $n$ halvings the bracket width is the starting width divided by $2^n$. To shrink a $200\,\mathrm{s}$ bracket below $10^{-10}\,\mathrm{s}$ you need $200 / 2^n < 10^{-10}$, which means $2^n > 2 \times 10^{12}$, so $n > \log_2(2\times 10^{12}) \approx 40.9$. Forty-one halvings. That is all.

### Why bisection and not Newton's method

Newton's method finds a zero faster once it is close: it follows the slope of $g$ down to where it hits zero. But it needs that slope, $\dot g$, and when the slope is small or $g$ bends oddly, a Newton step can **[[shoot right out of the bracket|newton-wander]]** or fail to converge at all. An event function built from a simulation's own state is rarely a clean formula, so that risk is real.

Bisection needs only two things: a valid bracket and the sign of $g$. You already have both the moment you see the flip. And it is **guaranteed to converge** — every step halves the bracket, no matter how badly $g$ behaves inside it. The function is cheap to evaluate and you only need a small, fixed tolerance, so a guarantee is worth more here than raw speed.

::: example Bisecting to machine precision
The mass-properties lesson found the exact burnout time of this booster by hand: $t_{\text{burn}} = 98.0665\,\mathrm{s}$. Use it as the right answer, and see how close bisection gets starting from a wide bracket of $0$ to $200\,\mathrm{s}$.

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

Read the code step by step. `mdot` is the flow rate, $F/(I_{sp}\,g_0) \approx 254.93\,\mathrm{kg/s}$. `event_fn` is the propellant left. The loop is the four-step recipe above: halve, check the sign, keep the half that still holds the flip.

After 41 halvings the answer is off by $4.1 \times 10^{-11}\,\mathrm{s}$ — forty trillionths of a second. The ordinary integration step in a simulation like this is tens of milliseconds, hundreds of millions of times coarser. The price was 41 extra evaluations of a function that costs one multiplication and one subtraction.

Sanity check: the bracket after 41 halvings is $200 / 2^{41} \approx 9.1 \times 10^{-11}\,\mathrm{s}$ wide, and the answer is its midpoint, so the error must be under half of that, about $4.5 \times 10^{-11}\,\mathrm{s}$. It is.
:::

## The full protocol

Finding the time is only part of the job. Here is the whole recipe, in order:

1. **Watch.** Compute $g$ at every accepted step. Keep going as normal until its sign flips.
2. **Bisect.** Close the bracket to a tight tolerance — far tighter than anything that matters physically, such as microseconds against a step of tens of milliseconds.
3. **Step exactly to the event.** Take one special integration step from the last good state to exactly $t_{\text{event}}$, using whatever step size gets there, not the usual fixed step. Every step up to the event now describes one consistent set of physics.
4. **Apply the discontinuity.** Change the state the way the event says: drop the spent stage's mass, switch thrust off, switch on the next engine.
5. **Restart cleanly.** Begin integrating again from the post-event state as if this were the start of a brand-new run, with no memory carried across.

What jumps and what does not matters. At separation, position and velocity are **continuous** — the vehicle does not teleport or suddenly change speed. Mass, thrust and the inertia tensor are **discontinuous**: they jump. A good test of your event handling is to check exactly that pattern in the logged state on either side of the event.

Why restart? RK4 itself carries nothing from one step to the next. But many integrators do carry **[[memory|integrator-memory]]**. An adaptive method remembers the step size that worked last time. A multistep method reuses the derivatives from several earlier steps. All of that describes the old, pre-event physics. If you do not throw it away, the first few steps after the event quietly lean on a vehicle that no longer exists.

::: key Correct handling of a discrete event
Detect the sign change of an event function, bisect to the crossing time, step exactly to it, apply the discontinuity, then restart the integrator on the far side. Never integrate a multi-stage step across a discontinuity.
:::

Skip bisection and you inherit the grid error in the next section. Skip the exact final step and the discontinuity is applied to the wrong state. Skip the restart and a multi-stage method's next steps are contaminated by information from the old dynamics.

::: warning Interpolating across the step instead of restarting
Once a step has overshot an event, it is tempting to use that step's **[[dense output|dense-output]]** — a smooth curve the integrator can draw through its own step — to estimate the state at the event, apply the jump there, and carry on from the next usual grid time. That curve is a fine way to *locate* the crossing cheaply. But it is only trustworthy if the whole step was integrated under one set of physics — which is exactly what fails when the event lies inside the step. The safe version still steps the integrator exactly to the event and restarts from there. What the shortcut saves is the search for the time, not the restart.
:::

## What skipping bisection costs

A common shortcut is to check $g$ only at each fixed step, and apply the event at the first grid time after the sign flips. "The step is small, so that is close enough." Let us measure how close.

The time error is the gap between the true event and the next grid point. That gap can be anything from zero up to one whole step. During that gap the naive simulation keeps doing the old thing. Here, it keeps thrusting after the tank is empty — the simplest simulations **[[clamp the mass|mass-clamp]]** at the dry mass and let the thrust run on until someone notices.

::: example What grid quantization actually costs
Take the same booster. After the propellant is gone, the naive run keeps pushing $F = 800{,}000\,\mathrm{N}$ on the $4{,}000\,\mathrm{kg}$ dry stage. That is an extra acceleration of

$$
\frac{F}{m_{\text{dry}}} = \frac{800{,}000}{4{,}000} = 200\,\mathrm{m/s^2}
$$

on top of what the coasting stage should feel. (Gravity acts the same in both cases, so it cancels out of the difference.) The velocity error is that extra acceleration times the extra thrusting time.

```python
import numpy as np

g0, F, Isp = 9.80665, 800000.0, 320.0
mdot = F/(Isp*g0)
m_dry, m_prop0 = 4000.0, 25000.0
t_burn_true = m_prop0/mdot

print("naive fixed-step grid quantization:")
for dt in [0.5, 0.2, 0.1, 0.05]:
    t_detected = np.ceil(t_burn_true/dt)*dt
    err = t_detected - t_burn_true
    dv_error = (F/m_dry)*err          # extra thrust-on time at the post-clamp dry-mass acceleration
    print(f"  dt={dt:.2f} s  timing error={err:.4f} s  velocity error={dv_error:.3f} m/s")
# naive fixed-step grid quantization:
#   dt=0.50 s  timing error=0.4335 s  velocity error=86.700 m/s
#   dt=0.20 s  timing error=0.1335 s  velocity error=26.700 m/s
#   dt=0.10 s  timing error=0.0335 s  velocity error=6.700 m/s
#   dt=0.05 s  timing error=0.0335 s  velocity error=6.700 m/s
```

Walk through the first line. With $\Delta t = 0.5\,\mathrm{s}$ the grid times are $98.0, 98.5, \ldots$ The first one after $98.0665$ is $98.5$. The time error is $98.5 - 98.0665 = 0.4335\,\mathrm{s}$, and the velocity error is $200 \times 0.4335 = 86.7\,\mathrm{m/s}$. For a launch vehicle, where burnout speed matters to a few meters per second, that is enormous.

Now look at the last two lines. Halving the step from $0.10\,\mathrm{s}$ to $0.05\,\mathrm{s}$ changed *nothing*: $6.7\,\mathrm{m/s}$ both times. Why? Both grids happen to have a point at $98.1\,\mathrm{s}$, and it is the first point after the event in both. The event sits $0.335$ of the way back from the end of a $0.1\,\mathrm{s}$ step, and $0.67$ of the way back from the end of a $0.05\,\mathrm{s}$ step — different fractions, same absolute gap.

That is the whole point. The error does not depend smoothly on the step size. It depends on **[[where the event happens to land|grid-landing]]** inside the step, and that is different for every combination of thrust, mass and timing.
:::

In a **dispersion campaign** — a Monte Carlo run that flies the vehicle hundreds or thousands of times with slightly different thrust, propellant load and so on — each case's burnout falls at a different, effectively random spot inside its step. So each case picks up a different error between zero and one step's worth. The result is extra **scatter** in burnout velocity: a spread that belongs to the simulation's clock, not to the vehicle. It often shows up as a suspiciously **[[fat tail|fat-tail]]** in the results.

::: warning "The step is already small, so quantization must be negligible"
The error can be as large as (the jump in acceleration) $\times$ (the step size) — not some small fraction of that. There is no step size at which it becomes negligible because the step feels small. Making it small by brute force means using a step far finer than accuracy needs, everywhere, for the whole run, to protect one moment. Bisection removes the error for a few dozen cheap function calls, spent only when an event actually happens. The quantization floor scales with the step used for the *entire* simulation. Bisection's cost scales only with how precisely you ask for one event.
:::

## Check yourself

::: check
What makes an event's timing error different from ordinary truncation error, and why does shrinking the step not reliably fix it?
:::

::: answer
Truncation error is a smooth, predictable function of step size: halve the step and RK4's error falls by about a factor of $16$, as the convergence analysis in the Numerical Methods module showed.

Grid quantization error depends on *where inside the step* the true event happens to fall. That is not predictable from the step size. In the worked example, going from $\Delta t = 0.10\,\mathrm{s}$ to $0.05\,\mathrm{s}$ left the error unchanged at $0.0335\,\mathrm{s}$ (and $6.7\,\mathrm{m/s}$), because both grids shared the point $98.1\,\mathrm{s}$. A smaller step lowers the *upper limit* on the error, but the error does not behave like truncation error, and it still varies from case to case with the event's position on the grid.
:::

::: check
Why must the integrator be restarted cleanly after an event, instead of carrying on with its normal sequence once the jump has been applied?
:::

::: answer
Some integrators remember things between steps: an adaptive method's recent step sizes, a multistep method's stored derivatives from earlier steps. All of that describes the pre-event dynamics. If you apply the jump to the state but keep that memory, the next several steps are built partly from physics that no longer applies, even though the state itself was updated correctly.

A clean restart throws all of it away and starts the post-event dynamics exactly as if it were the beginning of a new integration. (Plain RK4 carries no memory between steps, so for RK4 the restart costs nothing — but the rule is the same for every method, so you never have to remember which ones need it.)
:::

::: check
The bisection example found the event to about $4 \times 10^{-11}\,\mathrm{s}$. Does a launch simulation really need that, or is it wasted effort?
:::

::: answer
It does not need that exact number. A microsecond would almost certainly be just as good physically. The point of bisection is to push event timing so far below every other error in the simulation that you can stop thinking about it.

The cost is tiny either way. Going from a $1\,\mathrm{\mu s}$ tolerance to $10^{-10}\,\mathrm{s}$ adds only about $\log_2(10^{-6}/10^{-10}) \approx 13$ more halvings of a very cheap function. Compare that with the fixed-step shortcut, where the error was $86.7\,\mathrm{m/s}$ at a $0.5\,\mathrm{s}$ step and still $6.7\,\mathrm{m/s}$ at $0.05\,\mathrm{s}$. The debate worth having is about the shortcut, not about the tolerance.
:::

::: check
A dispersion campaign flies the same booster 200 times with different draws of thrust and propellant load, using a fixed-step integrator that applies burnout at the first grid point past the event. Beyond an overall bias, what would you expect to see in the spread of burnout velocities?
:::

::: answer
Extra scatter that the real dispersions in thrust and propellant do not explain. Each case's true burnout falls at a different, effectively unpredictable point in its fixed step, so each case collects a different quantization error, anywhere from zero up to a whole step of extra thrusting. That adds a false spread to burnout velocity that comes from the simulation's timing, not the vehicle. It is the "artificial spread in burnout conditions" and the fat tail this module's exercises warn about. With bisection, each case lands on its own true event time, and the extra scatter disappears.
:::

::: check
Newton's method converges faster than bisection once it is close to a root. Why is bisection still the preferred choice for finding an event's crossing time?
:::

::: answer
Bisection needs only the sign of $g$ at the two ends of a valid bracket, and it is guaranteed to converge, because each step halves the bracket no matter how $g$ behaves. That is exactly the situation after a sign flip has been seen: you already have the bracket.

Newton's method needs the derivative of $g$, and it can diverge or jump outside the bracket when that derivative is small or $g$ is badly behaved near the root. An event function built from a simulation's state is often like that, not a clean formula. Since the crossing only has to be found to a small, fixed tolerance and $g$ is cheap, a guarantee is worth more than a faster rate.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Event | A moment defined by a condition, not known before the run: burnout, separation, a target altitude, impact |
| Event function | $g(t)$, built to change sign exactly at the event; checked at every step |
| Why not step over it | An RK4 step's four slope samples would mix pre- and post-event physics; the blend matches no real motion |
| Bisection | Halve the bracket $[t_{\text{lo}}, t_{\text{hi}}]$ by sign until it is narrower than the tolerance; $n$ halvings shrink it by $2^n$; guaranteed to converge |
| Protocol | Detect the sign change $\to$ bisect $\to$ step exactly to the event $\to$ apply the discontinuity $\to$ restart cleanly |
| At separation | Position and velocity continuous; mass, thrust and inertia jump |
| Bisection result | $4.1\times10^{-11}\,\mathrm{s}$ error on a $98.0665\,\mathrm{s}$ burnout, for 41 cheap evaluations |
| Grid shortcut cost | $86.7\,\mathrm{m/s}$ at $\Delta t = 0.5\,\mathrm{s}$; still $6.7\,\mathrm{m/s}$ at $0.05\,\mathrm{s}$ — does not shrink smoothly |
| Monte Carlo effect | Case-dependent timing error adds false scatter and a fat tail to everything computed after the event |

With staging handled exactly, the plant is complete. The next lesson turns to the GNC box: how to make sure the flight software running inside the simulation is the software that will really fly, and not a copy of it.

::: context staging-word What staging is, and why rockets do it
A **stage** is a complete rocket section with its own tanks and engines. When its propellant is spent, its empty tanks and engines are dead weight, so the vehicle drops them and lights the next stage. That drop is **staging**.

Carrying less dead weight is the whole reason for it: a rocket's speed gain depends on its mass ratio, and throwing away empty tanks raises the mass ratio of what is left. The Saturn V moon rocket had three stages; most orbital launchers today have two.

For the simulation, a staging sequence is a cluster of events close together: engine cutoff, a short coast, separation, the next engine's start. Each one needs its own event function.
:::

::: context sign-change Seeing the flip between two samples
The simulation only sees $g$ at the step times (the dots). It never sees the exact crossing. But when one dot is above zero and the next is below, the crossing must lie between them — as long as $g$ is continuous, it cannot get from plus to minus without passing through zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="345" y2="80" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="345" y="72" font-size="12" text-anchor="end" fill="#6c7a93">g = 0</text>
  <line x1="30" y1="30" x2="330" y2="130" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="36" y="22" font-size="12" fill="#1d6fd1">g(t)</text>
  <g fill="#1f2a44">
    <circle cx="50" cy="36.7" r="4"/><circle cx="110" cy="56.7" r="4"/><circle cx="170" cy="76.7" r="4"/>
    <circle cx="230" cy="96.7" r="4"/><circle cx="290" cy="116.7" r="4"/>
  </g>
  <circle cx="180" cy="80" r="5" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="170" y1="145" x2="230" y2="145" stroke="#f2b880" stroke-width="6"/>
  <text x="170" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">t_lo</text>
  <text x="230" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">t_hi</text>
  <text x="200" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">bracket</text>
  <text x="190" y="104" font-size="12" fill="#b4232c" text-anchor="end">crossing</text>
</svg>
```

The orange bar is the bracket: two known times with opposite signs.
:::

::: context rk4-straddle Four samples, two kinds of physics
Inside one RK4 step, the slope is sampled at the start, twice at the midpoint and at the end. If thrust cuts off (red line) partway through, the first sample is from the thrusting vehicle and the rest are taken after cutoff — some from a model that no longer applies.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="70" x2="320" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="60" x2="40" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="60" x2="320" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">t</text>
  <text x="320" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">t + h</text>
  <text x="180" y="98" font-size="12" text-anchor="middle" fill="#1f2a44">t + h/2</text>
  <circle cx="40" cy="70" r="6" fill="#1d6fd1"/>
  <circle cx="180" cy="62" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="180" cy="78" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="320" cy="70" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="40" y="50" font-size="12" text-anchor="middle" fill="#1d6fd1">k1</text>
  <text x="200" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">k2, k3</text>
  <text x="320" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">k4</text>
  <line x1="124" y1="30" x2="124" y2="110" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,4"/>
  <text x="124" y="124" font-size="12" text-anchor="middle" fill="#b4232c">cutoff</text>
  <text x="80" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">thrusting</text>
  <text x="240" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">after cutoff</text>
</svg>
```

Blending those four into one average gives a step that matches neither the thrusting flight nor the coast.
:::

::: context guessing-game Why halving is so fast
Each halving throws away half of what is left. After 10 halvings you have $1/1024$ of the start — about a thousandth. After 20, about a millionth. After 30, about a billionth. So finding a number from 1 to 100 never takes more than 7 guesses, because $2^7 = 128$ is more than 100.

For events, the same arithmetic means going from a bracket of a whole step down to a microsecond is only a few tens of halvings, whatever the step size. The count grows with the *logarithm* of how much precision you want, which is why asking for a lot more precision costs only a little more work.
:::

::: context newton-wander How Newton's method can escape
Newton's method draws the tangent line at the current guess and jumps to where that line hits zero. When the curve is nearly flat at the guess, the tangent is nearly flat too, and it hits zero very far away — possibly far outside the bracket, where the event function might not even mean anything (a negative altitude, a time after the run ends).

Bisection never leaves the bracket, because every new guess is the middle of the old one. Some production solvers combine the two, taking a Newton or secant step when it lands safely inside the bracket and falling back to bisection when it does not. That keeps the guarantee and gains speed.
:::

::: context integrator-memory Which integrators remember
A **single-step** method like RK4 computes each step only from the current state, so it carries nothing forward. A **multistep** method, such as the Adams–Bashforth family, saves work by reusing derivatives from several previous steps — so after an event, those remembered derivatives come from the old physics. An **adaptive** method remembers its recent error estimates and step sizes, which were tuned to the smooth pre-event motion and may be badly wrong for what follows.

Restarting means clearing all of that and starting fresh, as at the beginning of a run.
:::

::: context dense-output What dense output is
Many adaptive integrators can give you the state at *any* time inside a step they have taken, not only at its end. They do it by fitting a smooth curve (a polynomial) through the information the step already computed. That is called **dense output**, and it is handy for plotting or for finding an event's time without re-integrating.

The catch is in the fit: it is only as good as the step it came from. If the step straddled a discontinuity, the curve smoothly joins two kinds of physics that should have met at a sharp corner.
:::

::: context mass-clamp Why a naive simulation keeps thrusting
A simple plant computes mass as $m(t) = m_0 - \dot m\,t$ and stops it from going below the dry mass with a "clamp": if the result is too small, use $m_{\text{dry}}$ instead. That avoids a nonsense negative mass, but nothing in the clamp switches the thrust off. So between the true burnout and the next time anyone checks, the model pushes full thrust on the empty stage — a rocket running on no fuel. The event protocol exists so the thrust switch-off and the mass limit happen together, at the right instant.
:::

::: context grid-landing Where the event falls on the grid
The grids for $\Delta t = 0.1\,\mathrm{s}$ (ticks) and $\Delta t = 0.5\,\mathrm{s}$ (big ticks). The true burnout (red) is at $98.0665\,\mathrm{s}$. The fine grid first notices it at $98.1$; the coarse grid not until $98.5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 145" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="345" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="90" y1="53" x2="90" y2="67"/><line x1="150" y1="53" x2="150" y2="67"/>
    <line x1="210" y1="53" x2="210" y2="67"/><line x1="270" y1="53" x2="270" y2="67"/>
  </g>
  <g stroke="#1f2a44" stroke-width="3">
    <line x1="30" y1="46" x2="30" y2="74"/><line x1="330" y1="46" x2="330" y2="74"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="90">98.0</text><text x="90" y="90">98.1</text><text x="150" y="90">98.2</text>
    <text x="210" y="90">98.3</text><text x="270" y="90">98.4</text><text x="330" y="90">98.5</text>
  </g>
  <line x1="69.9" y1="30" x2="69.9" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <text x="62" y="24" font-size="12" text-anchor="middle" fill="#b4232c">true 98.0665</text>
  <line x1="69.9" y1="104" x2="90" y2="104" stroke="#1d6fd1" stroke-width="5"/>
  <text x="96" y="108" font-size="11" fill="#1d6fd1">fine grid late by 0.0335 s</text>
  <line x1="69.9" y1="122" x2="330" y2="122" stroke="#f2b880" stroke-width="5"/>
  <text x="200" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">coarse grid late by 0.4335 s</text>
</svg>
```

Nudge the burnout time by a few hundredths of a second and both gaps change, in no smooth way. That is why quantization error looks like noise across a Monte Carlo.
:::

::: context fat-tail Fat tails, and where you will meet them again
A distribution has a **fat tail** when extreme values turn up more often than a bell curve predicts. In a Monte Carlo, the tail is exactly what you care about: the one case in a thousand that misses the orbit or runs out of margin. A false fat tail from event quantization can make a good vehicle look risky — or, worse, teach you to ignore tails. The Monte Carlo module later in the course builds on this simulation, and clean event handling is one of the things that makes its tail statistics believable.
:::
