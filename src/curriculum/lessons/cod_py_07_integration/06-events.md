---
id: l06-events
title: Events: apogee, impact and other moments
minutes: 22
covers:
  - 'Events: terminal, direction, apogee and impact detection'
---

Throw a ball straight up and watch it. There is one moment when it stops rising and starts to fall — the top. You never see the ball "at" that moment for long; it passes in an instant. But you know it happened, because a moment ago it was going up and now it is coming down. Its speed changed sign. The instant it was zero is the top.

A smoke alarm works on the same idea. It does not report the smoke level every second. It stays quiet until one number crosses a threshold, and then it acts. A lot of spacecraft software is like this. A sounding rocket fires its parachute at the top of its climb, which engineers call **[[apogee|apsis-words]]**. A lander cuts its engine at touchdown. A trajectory tool reports the moment a returning capsule drops through the top of the atmosphere, and a mission planner wants the exact time of every closest approach to Earth.

`solve_ivp` has a tool for all of these, called **events**. You write a small function that is zero at the moment you care about, and the solver finds that moment for you — not to the nearest step, but to the accuracy of the solution itself, even when its steps are minutes long. This lesson shows how to write event functions, how to make them stop the run or only fire in one direction, and where they go wrong.

## A moment as a zero crossing

The trick is to turn "the moment something happens" into "the moment a number passes through zero". That number is the **event function**, $g(t, \mathbf{y})$ — read "g of t and y" — a function of the time and the state that is positive on one side of the moment and negative on the other.

| Moment | Event function $g(t, \mathbf{y})$ | Sign change at the moment |
| --- | --- | --- |
| Apogee of a vertical flight | vertical velocity $v$ | $+$ to $-$ |
| Impact on the ground | altitude $h$ | $+$ to $-$ |
| Passing $100\,\mathrm{km}$ on the way down | $h - 100{,}000$ | $+$ to $-$ |
| Apogee of an orbit | radial rate, $\mathbf{r}\cdot\mathbf{v}$ | $+$ to $-$ |
| Perigee of an orbit | radial rate, $\mathbf{r}\cdot\mathbf{v}$ | $-$ to $+$ |
| A fixed clock time $t_c$ | $t - t_c$ | $-$ to $+$ |

The third row shows the general pattern: to catch the moment some quantity reaches a level, subtract the level. The value $100\,\mathrm{km}$ is the **[[Kármán line|karman-line]]**, the usual boundary of space.

Two rules make an event function work well.

- **It must be continuous** in time along the trajectory. The solver looks for a *change of sign*, so the function must slide through zero, not jump.
- **It should cross, not touch.** A function that comes down to exactly zero and goes back up without changing sign has no sign change to find.

So a function that returns `True`/`False`, or `1`/`0`, is a poor event function even though it "changes" at the right moment: its value jumps and never passes through zero smoothly. Return the continuous quantity itself.

## Wiring an event into solve_ivp

An event function has the same signature as the right-hand side: `g(t, y)`, plus any `args`. You pass it, or a list of them, with `events=`. Two optional settings are attached to the function itself, as attributes:

- **`terminal`**: if `True`, the integration **stops** at the first crossing. If left out, it is `False`: the crossing is recorded and the run continues.
- **`direction`**: which way the sign change must go. `+1` fires only when $g$ goes from negative to positive, `-1` only when it goes from positive to negative, and `0` (the default) fires either way.

A Python function is an object, so you can hang **[[attributes on it|function-attributes]]** with a dot, as in `apogee.direction = -1`. That is exactly how SciPy reads them.

::: example A sounding rocket's coast: apogee and impact
A small sounding rocket burns out at $h_0 = 3000\,\mathrm{m}$ going straight up at $v_0 = 250\,\mathrm{m/s}$. Ignore air drag, so only gravity $g_0 = 9.80665\,\mathrm{m/s^2}$ acts. Find the apogee and the moment of impact, and stop the run at impact.

```python
import numpy as np
from scipy.integrate import solve_ivp

g0 = 9.80665                                      # m/s^2

def coast(t, y):
    h, v = y                                      # altitude m, vertical speed m/s
    return [v, -g0]

def apogee(t, y):
    return y[1]                                   # vertical speed is zero at the top
apogee.direction = -1                             # + to - : going up, then down

def impact(t, y):
    return y[0]                                   # altitude is zero at the ground
impact.terminal = True
impact.direction = -1

sol = solve_ivp(coast, (0.0, 300.0), [3000.0, 250.0],
                events=[apogee, impact], rtol=1e-10, atol=1e-8)
print(sol.status, sol.message)
print(f"apogee t = {sol.t_events[0][0]:.3f} s, h = {sol.y_events[0][0][0]:.1f} m")
print(f"impact t = {sol.t_events[1][0]:.3f} s, v = {sol.y_events[1][0][1]:.1f} m/s")
print(f"integration stopped at t = {sol.t[-1]:.3f} s")
# 1 A termination event occurred.
# apogee t = 25.493 s, h = 6186.6 m
# impact t = 61.014 s, v = -348.3 m/s
# integration stopped at t = 61.014 s
```

**Reading the output.** `sol.status` is `1`, "stopped by a terminal event". `sol.t_events` is a list with one array per event function, in the order you passed them: `sol.t_events[0]` holds the apogee times, `sol.t_events[1]` the impact times. `sol.y_events` holds the full state at each of those times in the same layout, so `sol.y_events[0][0]` is the state at the first apogee and `[0]` of that is the altitude.

**Check the apogee by hand.** With constant deceleration $g_0$, the speed reaches zero after $t = v_0 / g_0 = 250 / 9.80665 = 25.493\,\mathrm{s}$. The height gained is $v_0^2 / (2 g_0) = 62500 / 19.613 = 3186.6\,\mathrm{m}$, so apogee is $3000 + 3186.6 = 6186.6\,\mathrm{m}$. Both match.

**Check the impact by hand.** Falling from $6186.6\,\mathrm{m}$ takes $\sqrt{2 \times 6186.6 / 9.80665} = 35.521\,\mathrm{s}$, so impact is at $25.493 + 35.521 = 61.014\,\mathrm{s}$. The speed then is $-\sqrt{2 g_0 \times 6186.6} = -348.3\,\mathrm{m/s}$. Both match.

**Sanity check.** The rocket spends longer falling ($35.5\,\mathrm{s}$) than climbing ($25.5\,\mathrm{s}$), because it falls $3000\,\mathrm{m}$ further than it climbed. And it hits faster than it burned out, $348\,\mathrm{m/s}$ against $250\,\mathrm{m/s}$, for the same reason. The run ends at $61.014\,\mathrm{s}$, not at the $300\,\mathrm{s}$ we allowed, because impact is terminal.
:::

Why `direction=-1` on the impact? The altitude starts positive and passes through zero going down. If the rocket were launched from the pad, $h$ would start at zero and go *up* — a crossing from zero to positive that a `direction=0` event would happily report as "impact" at $t = 0$. The warning at the end of this lesson shows exactly that.

::: key
terminal stops the integration at the crossing; direction=-1 only triggers on a zero crossing where the event function is decreasing. For apogee, the event is the radial rate and you want the positive-to-negative crossing.
:::

## How the solver pins down the crossing

The solver does not watch the event function continuously. After each accepted step, it evaluates $g$ at the new point and compares its sign with the sign at the old point. If the sign changed (in the allowed direction), the moment must lie somewhere inside that step.

Then it does something clever. Every accepted step carries an interpolant — the smooth polynomial through the step that the last lesson used for `t_eval` and `dense_output`. The solver runs a **[[bracketing root finder|bracketing-root]]** (`brentq`, the one from the root-finding lesson of the SciPy module) on $g(t, \mathbf{y}_{\text{interp}}(t))$ between the two ends of the step. That solve is pushed to about machine precision in $t$, and it needs no new calls to your right-hand side, only to the interpolant.

So the only error left in the event time is the error of the interpolated trajectory itself. And that is set by the tolerances, not by how long the step was. A step of four minutes that is accurate to a millimeter everywhere gives an event time accurate to the time it takes to travel a millimeter.

::: example Orbital apogee to a fraction of a microsecond
A spacecraft is at perigee, $r_p = 6678\,\mathrm{km}$ from Earth's center (about $300\,\mathrm{km}$ up), on an orbit of eccentricity $e = 0.1$. The first apogee should come exactly half a period later. For an orbit, apogee is where the distance $|\mathbf{r}|$ stops growing, which is where the **[[radial rate|radial-rate]]** $\mathbf{r}\cdot\mathbf{v}$ passes from positive to negative.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14

def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

def radial_rate(t, y, mu):                        # same extra argument as two_body
    return y[:3] @ y[3:]                          # r . v, in m^2/s
radial_rate.terminal = True
radial_rate.direction = -1

rp, ecc = 6.678e6, 0.1                            # perigee radius m, eccentricity
a = rp / (1 - ecc)
vp = np.sqrt(MU * (2 / rp - 1 / a))               # vis-viva speed at perigee
T = 2 * np.pi * np.sqrt(a**3 / MU)
y0 = np.array([rp, 0.0, 0.0, 0.0, vp, 0.0])

for rtol in [1e-6, 1e-8, 1e-11]:
    sol = solve_ivp(two_body, (0.0, 2 * T), y0, args=(MU,), method="DOP853",
                    rtol=rtol, atol=1e-6, events=radial_rate)
    t_apo = sol.t_events[0][0]
    steps = sol.t.size - 1
    print(f"rtol {rtol:.0e}: {steps:2d} steps, about {t_apo / steps:3.0f} s each, "
          f"apogee off by {(t_apo - T / 2) * 1e6:+.1f} us")
print(f"T/2 = {T / 2:.3f} s")
# rtol 1e-06: 12 steps, about 265 s each, apogee off by +7469.0 us
# rtol 1e-08: 13 steps, about 245 s each, apogee off by +94.1 us
# rtol 1e-11: 23 steps, about 138 s each, apogee off by +0.1 us
# T/2 = 3180.437 s
```

**The setup.** The semi-major axis is $a = r_p / (1 - e) = 6678 / 0.9 = 7420\,\mathrm{km}$. The period is $T = 2\pi\sqrt{a^3/\mu} = 6360.87\,\mathrm{s}$, so apogee should come at $T/2 = 3180.437\,\mathrm{s}$, at radius $a(1 + e) = 8162\,\mathrm{km}$.

**The extra argument.** Because `two_body` takes `mu` through `args=(MU,)`, SciPy passes the same `args` to every event function too. So `radial_rate` must accept `mu` even though it does not use it. Forgetting that gives a "takes 2 positional arguments but 3 were given" error.

**The result.** At `rtol=1e-11` the steps average $138\,\mathrm{s}$ — more than two minutes — yet the apogee time is off by only $0.1\,\mu\mathrm{s}$ (read "microseconds", millionths of a second). At `rtol=1e-8` it is off by $94\,\mu\mathrm{s}$, still under a tenth of a millisecond.

**What sets the accuracy.** Compare the rows. The average step shrinks only by a factor of two, from $265\,\mathrm{s}$ to $138\,\mathrm{s}$, while the error falls by a factor of about $75{,}000$, from $7.5\,\mathrm{ms}$ to $0.1\,\mu\mathrm{s}$. The event time is as good as the trajectory, whatever the step length.

**Sanity check.** At apogee the spacecraft moves sideways at about $6.63\,\mathrm{km/s}$, so the timing error of $7.5\,\mathrm{ms}$ at `rtol=1e-6` puts the reported apogee point about $6.63 \times 7.47 \approx 50\,\mathrm{m}$ along the orbit. Yet the reported apogee *radius* in that run is off by only about $3\,\mathrm{m}$, because $|\mathbf{r}|$ is flat at its maximum. That is typical of extremum events: the time is sensitive, the value is not.
:::

::: key
Solvers use the dense output of the accepted step and a bracketing root solve, so the crossing is found to the solver tolerance, effectively independent of the step size. That is how you get a sub-millisecond apogee time with 30-second steps.
:::

::: note Why r · v tells you whether the distance is growing
The distance is $r = |\mathbf{r}| = \sqrt{\mathbf{r}\cdot\mathbf{r}}$. Differentiate $r^2 = \mathbf{r}\cdot\mathbf{r}$ with respect to time, using the product rule on the dot product:

$$
\frac{d}{dt}\left(r^2\right) = 2\,\mathbf{r}\cdot\dot{\mathbf{r}} = 2\,\mathbf{r}\cdot\mathbf{v}.
$$

The left side is also $2 r \dot{r}$ by the chain rule. Setting the two equal and dividing by $2r$:

$$
\dot{r} = \frac{\mathbf{r}\cdot\mathbf{v}}{r}.
$$

Since $r > 0$ always, $\dot{r}$ and $\mathbf{r}\cdot\mathbf{v}$ have the same sign. Positive means climbing away from Earth, negative means falling toward it, and zero is an apsis: perigee or apogee. Using $\mathbf{r}\cdot\mathbf{v}$ instead of $\dot{r}$ skips a square root and a division, and changes nothing about where the zero is.
:::

## Recording many events, and stopping after a count

A non-terminal event records every crossing and lets the run continue. That is how you log all perigee passes of a long propagation, every time a satellite enters Earth's shadow, or each time a rocket passes through **[[maximum dynamic pressure|max-q]]** in a Monte Carlo batch.

`terminal` also accepts a whole number in recent SciPy versions: `terminal = 3` means "stop at the third crossing". Here is a run that logs perigees, then stops at the second one — and it shows a trap.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

def perigee(t, y, mu):
    return y[:3] @ y[3:]
perigee.direction = +1                            # r . v goes from - to +

rp, ecc = 6.678e6, 0.1
a = rp / (1 - ecc)
vp = np.sqrt(MU * (2 / rp - 1 / a))
T = 2 * np.pi * np.sqrt(a**3 / MU)
y0 = np.array([rp, 0.0, 0.0, 0.0, vp, 0.0])       # starts AT perigee

sol = solve_ivp(two_body, (0.0, 3.5 * T), y0, args=(MU,), method="DOP853",
                rtol=1e-11, atol=1e-6, events=perigee)
print(np.round(sol.t_events[0] / T, 6))           # in periods
print(np.round(np.linalg.norm(sol.y_events[0][:, :3], axis=1) / 1e3, 3))

perigee.terminal = 2                              # stop at the second perigee
sol = solve_ivp(two_body, (0.0, 3.5 * T), y0, args=(MU,), method="DOP853",
                rtol=1e-11, atol=1e-6, events=perigee)
print(sol.status, round(sol.t[-1] / T, 6))
# [0. 1. 2. 3.]
# [6678. 6678. 6678. 6678.]
# 1 1.0
```

In three and a half periods there are three perigees *after* the start, at $1$, $2$ and $3$ periods, each at radius $6678.000\,\mathrm{km}$, as they should be. But the solver reports four: it also counts $t = 0$. The run started exactly at perigee, where $\mathbf{r}\cdot\mathbf{v} = 0$, and on the first step the function went from zero to positive. SciPy counts "from zero to positive" as a rising crossing.

That is why the second run, asked to stop at the second perigee, stopped after one period instead of two: it had already counted the start.

::: warning An event function that is zero at the start
If $g(t_0, \mathbf{y}_0) = 0$ — a rocket starting on the ground with an altitude event, an orbit starting at perigee with a radial-rate event — the first step can register a crossing at $t_0$. With `terminal=True` the run then stops before it begins; the `ground` event below does exactly that. Guard against it: choose `direction` so the start does not count (an impact event with `direction=-1` ignores the climb off the pad), start the event a moment later, or drop event times equal to $t_0$ and raise any count by one.

```python
import numpy as np
from scipy.integrate import solve_ivp

g0 = 9.80665

def coast(t, y):
    return [y[1], -g0]

def ground(t, y):
    return y[0]
ground.terminal = True                            # direction left at 0: either way

sol = solve_ivp(coast, (0.0, 300.0), [0.0, 250.0], events=ground)   # from the pad
print(sol.t[-1], sol.t_events[0])

ground.direction = -1                             # only on the way down
sol = solve_ivp(coast, (0.0, 300.0), [0.0, 250.0], events=ground)
print(round(sol.t[-1], 3), np.round(sol.t_events[0], 3))
# 0.0 [0.]
# 50.986 [50.986]
```

The first run "lands" at $t = 0$. The second lands at $50.986\,\mathrm{s}$, which is $2 v_0 / g_0 = 500 / 9.80665$, the right answer for a throw from the ground.
:::

## When the solver cannot see the crossing

The sign test happens only at the ends of each step. If the event function crosses zero **twice** inside one step — down and back up, or up and back down — the signs at the two ends agree and nothing is reported. This is not a rare corner. It happens whenever the thing you are watching barely reaches the level: a trajectory that only grazes a keep-out altitude, a perigee that dips a few hundred meters into the drag-heavy part of the atmosphere, a rocket whose apogee barely clears a threshold.

::: example A crossing the solver steps over
Take the sounding rocket again and ask when it is above $6180\,\mathrm{m}$. Its apogee is $6186.6\,\mathrm{m}$, only $6.6\,\mathrm{m}$ higher, so it spends only a short time up there.

```python
import numpy as np
from scipy.integrate import solve_ivp

g0 = 9.80665

def coast(t, y):
    return [y[1], -g0]

def above_6180(t, y):
    return y[0] - 6180.0                          # altitude minus 6180 m

for max_step in [np.inf, 1.0]:
    sol = solve_ivp(coast, (0.0, 60.0), [3000.0, 250.0],
                    events=above_6180, max_step=max_step)
    print(f"max_step {max_step}: {sol.t.size - 1} steps, crossings {np.round(sol.t_events[0], 3)}")
# max_step inf: 4 steps, crossings []
# max_step 1.0: 61 steps, crossings [24.332 26.654]
```

**The time above the line, by hand.** Solving $3000 + 250t - \tfrac{1}{2} g_0 t^2 = 6180$ gives $t = \big(250 \mp \sqrt{250^2 - 2 g_0 \times 3180}\big) / g_0$, so $t = 24.332\,\mathrm{s}$ and $t = 26.654\,\mathrm{s}$. The rocket is above the line for only $2.32\,\mathrm{s}$.

**What went wrong.** Constant gravity makes the true path a parabola, which RK45 follows almost exactly, so the controller took only four steps of around fifteen seconds for the whole minute. Both crossings fell inside one step. At both ends of that step the rocket was below $6180\,\mathrm{m}$, so there was no sign change to find, and `t_events[0]` came back empty.

**The fix.** With `max_step=1.0`, no step can be longer than the $2.32\,\mathrm{s}$ window, and both crossings are found to the millisecond. The rule: cap the step below the shortest time the function can spend on one side of zero.

**Sanity check.** A step cap costs work everywhere (61 steps instead of 4). When you know where the danger is, a cheaper option is a second event that marks it — here, the apogee event, which always splits the climb from the fall — and a check of each half.
:::

::: warning Choosing direction by feel
Say the sign change out loud before you pick `direction`. "Altitude, from positive to negative" is `-1`. "Radial rate at perigee, from negative to positive" is `+1`. Guessing gives an event that silently never fires, and code that treats an empty `t_events[0]` as "nothing happened". Test every new event on a case whose answer you know, like the $T/2$ apogee above.
:::

## After a terminal event

When a terminal event stops the run, `sol.t[-1]` is the event time and `sol.y[:, -1]` is the state there. That is exactly what you need to start the next **[[phase of flight|flight-phases]]**: deploy a parachute and switch to a drag model, cut the engine and switch to a coast model, or separate a stage and drop its mass. You change the model, then call `solve_ivp` again from that state. Lesson 10 builds this into a pattern and shows why the restart is not optional.

## Check yourself

::: check
You want the time a returning capsule passes through **entry interface**, $122\,\mathrm{km}$ up, on the way down, and you want the run to continue afterward so you can study the whole entry. Write the event function and its settings.
:::

::: answer
The event function is altitude minus the level, `h - 122000.0` (in meters), which is positive above entry interface and negative below. On the way down it goes from positive to negative, so `direction = -1`. The run must continue, so leave `terminal` unset (or set it to `False`). The time is then `sol.t_events[i][0]` for that event's index `i`, and the full state at that moment is `sol.y_events[i][0]`.
:::

::: check
A teammate's event function for "engine burnout when the propellant mass reaches zero" returns `1.0 if m_prop > 0 else 0.0`. Why is this a poor event function, and what should it return?
:::

::: answer
It is a step function: it jumps from $1$ to $0$ and never takes the values in between. The solver notices the change only at the end of the step in which burnout happened, and by then the function is already exactly $0$, so the root search has nothing to refine and reports that step end — which can be seconds after the true burnout. Return the continuous quantity itself, `m_prop`, which slides through zero; the root search can then place burnout precisely, and `direction = -1` with `terminal = True` stops the run there.
:::

::: check
An orbit propagation uses DOP853 with steps of about three minutes. A colleague says the apogee time it reports "can only be good to about a minute, since that is the step size". Explain why that is wrong.
:::

::: answer
The solver does not report the step end nearest the crossing. Once it sees a sign change across a step, it root-finds on the step's interpolating polynomial, to about machine precision in time. So the event time is as accurate as the interpolated trajectory, and that is controlled by rtol and atol, not by the step length. In the example, steps of over two minutes gave apogee to $0.1\,\mu\mathrm{s}$ at `rtol=1e-11`.
:::

::: check
You propagate a slightly eccentric orbit for $30$ days and want to log every perigee. You start the run from an arbitrary point on the orbit, not at perigee. Which `direction` do you use, is the event terminal, and what does the start-at-zero trap mean for you here?
:::

::: answer
Perigee is where $\mathbf{r}\cdot\mathbf{v}$ goes from negative (falling toward Earth) to positive (climbing away), so `direction = +1`. The event is not terminal, because you want every one and the run should continue to day 30. Because the run does not start at perigee, $\mathbf{r}\cdot\mathbf{v}$ is not zero at $t_0$, so no false event is recorded at the start. If a later run *does* start at perigee, drop the event time at $t_0$ before counting.
:::

::: check
A trajectory's perigee is predicted to dip to $99.5\,\mathrm{km}$ altitude, slightly under a $100\,\mathrm{km}$ level you are watching with an event, and it stays below that level for about $40\,\mathrm{s}$. The solver's steps near perigee are about $60\,\mathrm{s}$. What might happen, and how do you make sure the crossings are found?
:::

::: answer
Both crossings, down through $100\,\mathrm{km}$ and back up, can fall inside a single $60\,\mathrm{s}$ step. Then the altitude minus $100\,\mathrm{km}$ is positive at both step ends, there is no sign change, and the event reports nothing — as if the orbit never dipped below the level.

To make sure: set `max_step` below the $40\,\mathrm{s}$ window, say $10\,\mathrm{s}$, or add a perigee event (radial rate, `direction=+1`) and check the altitude at each perigee directly, since a dip below the level must include the perigee.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Event function | `g(t, y, *args)`, continuous, zero at the moment you want |
| Levels | subtract the level: `h - 100000.0` crosses zero at $100\,\mathrm{km}$ |
| `terminal` | `True` stops at the first crossing; a whole number stops at that count |
| `direction` | `+1` for $-$ to $+$, `-1` for $+$ to $-$, `0` either way |
| Results | `sol.t_events[i]`, `sol.y_events[i]` per event; `sol.status == 1` when stopped |
| Apogee, impact | vertical flight: $v$ with $-1$; ground: $h$ with $-1$ and terminal |
| Orbital apsides | $\mathbf{r}\cdot\mathbf{v}$: apogee $+$ to $-$, perigee $-$ to $+$ |
| Accuracy | root solve on the step's interpolant: set by tolerances, not step length |
| Traps | zero at the start; two crossings inside one step; wrong direction |

The next lesson takes up a problem the actuator example of lesson 4 hinted at: why some models force an explicit solver into millions of tiny steps, how to recognize that from the solver's own behavior, and when to switch to an implicit method.

::: context apsis-words Near and far
Both words come from Greek. *Gē* means Earth; *apo* means "away from" and *peri* means "near". So apogee is the point of an orbit farthest from Earth and perigee the nearest. Together they are the orbit's two apsides. The same prefixes give aphelion and perihelion for orbits around the Sun. For a rocket flying straight up and down, apogee is the top of the climb, and that is the moment a sounding rocket usually opens its first parachute, when it is moving slowest.
:::

::: context karman-line Where space begins
The Kármán line is named after the engineer Theodore von Kármán, who reasoned about the height at which the air becomes so thin that a wing would need orbital speed to hold itself up. His own estimate was somewhat lower; the round $100\,\mathrm{km}$ is a convention adopted for record-keeping. It is not a physical wall: the atmosphere fades gradually, and the US Air Force has used $50$ miles, about $80\,\mathrm{km}$, for astronaut wings. For a solver, it is one more level to subtract.
:::

::: context function-attributes Settings stuck to a function
In Python, `def` creates an object, and objects can carry named values. Writing `impact.terminal = True` stores `True` on the function under the name `terminal`, and SciPy later reads it with `getattr(event, "terminal", False)`. If you build event functions in a loop, or use a `lambda`, give each its own function object before setting attributes; setting `direction` on one shared function changes it for every place that function is used.
:::

::: context bracketing-root Trapping a root between two signs
If a continuous function is positive at one end of an interval and negative at the other, it must be zero somewhere in between. A bracketing root finder keeps shrinking the interval while keeping the two ends of opposite sign, so it can never lose the root. SciPy's event locator uses `brentq`, which mixes safe halving with faster curve-fitting guesses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40,30 C120,40 180,80 320,125" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="30" r="5" fill="#1f2a44"/>
  <circle cx="320" cy="125" r="5" fill="#1f2a44"/>
  <text x="40" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">g &gt; 0 at step start</text>
  <text x="310" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">g &lt; 0 at step end</text>
  <line x1="40" y1="100" x2="320" y2="100" stroke="#8fb8f0" stroke-width="3"/>
  <line x1="180" y1="92" x2="180" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="112" x2="320" y2="112" stroke="#f2b880" stroke-width="3"/>
  <circle cx="184" cy="75" r="5" fill="#b4232c"/>
  <text x="194" y="66" font-size="11" fill="#b4232c">the crossing</text>
  <text x="44" y="116" font-size="11" fill="#6c7a93">bracket, then halves</text>
</svg>
```

The whole search runs on the step's interpolating polynomial, so it costs no extra evaluations of your dynamics.
:::

::: context radial-rate Toward or away from Earth
The radial rate is how fast the distance to Earth's center is changing. The velocity $\mathbf{v}$ can be split into a part along $\mathbf{r}$ (toward or away from Earth) and a part sideways. Only the part along $\mathbf{r}$ changes the distance, and the dot product $\mathbf{r}\cdot\mathbf{v}$ measures exactly that part, times $|\mathbf{r}|$. On a circular orbit the velocity is always sideways, so $\mathbf{r}\cdot\mathbf{v} = 0$ all the time and there is no apogee to find — a good case to remember when an apogee event on a nearly circular orbit behaves strangely.
:::

::: context max-q The hardest push of the air
Dynamic pressure is $q = \tfrac{1}{2}\rho v^2$ (read $\rho$ as "rho", the air density): the push of the oncoming air. On ascent the rocket speeds up while the air thins, so $q$ rises, peaks and falls. The peak, "max-q", is where aerodynamic loads are largest, and many vehicles throttle down through it. As an event, max-q is where $\dot{q}$ passes from positive to negative — the same "top of a hill" pattern as apogee.
:::

::: context flight-phases One model per phase
A real flight is a chain of phases, each with its own equations: powered ascent, coast, stage separation, entry, parachute descent, touchdown. Mission-analysis tools march through them one after another, each phase ending on an event — an altitude, a velocity, a time, a propellant level — and the next phase starting from the state where the last one stopped. The event machinery of this lesson is what joins the phases together.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">powered</text>
  <rect x="135" y="35" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">coast</text>
  <rect x="260" y="35" width="90" height="36" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="305" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">parachute</text>
  <line x1="100" y1="53" x2="129" y2="53" stroke="#b4232c" stroke-width="2"/>
  <polygon points="135,53 127,48 127,58" fill="#b4232c"/>
  <line x1="225" y1="53" x2="254" y2="53" stroke="#b4232c" stroke-width="2"/>
  <polygon points="260,53 252,48 252,58" fill="#b4232c"/>
  <text x="117" y="25" font-size="11" text-anchor="middle" fill="#b4232c">burnout</text>
  <text x="242" y="25" font-size="11" text-anchor="middle" fill="#b4232c">apogee</text>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#6c7a93">each arrow: a terminal event, then a fresh solve_ivp call</text>
</svg>
```
:::
