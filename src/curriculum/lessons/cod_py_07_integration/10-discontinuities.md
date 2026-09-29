---
id: l10-discontinuities
title: Staging, engine cutoff and restarting the solver
minutes: 22
covers:
  - 'Discontinuities: staging, thrust cutoff and why you restart the solver'
---

Roll a marble across a table and watch it for a second. You can now guess where it will be a moment later, because its motion is smooth: what it did a moment ago is a good guide to what it does next. Then the marble reaches the edge of the table and drops. Everything you learned by watching it roll is suddenly useless. The rules changed at one exact spot, and no amount of careful watching before the edge could have told you about the fall.

A rocket's flight is full of table edges. The first-stage engines shut off. The empty stage is thrown away and the vehicle is suddenly many metric tons lighter. The second-stage engine lights. The nose fairing comes off. A parachute opens. Landing legs touch the ground. At each of these moments some quantity jumps from one value to another with nothing in between. A jump like that is a **[[discontinuity|discontinuity-word]]** — a place where a quantity, or its rate of change, changes value in zero time.

Every solver in this module quietly assumes there are no table edges. This lesson shows what goes wrong when that assumption breaks, why the fix is to stop at the edge and start a brand-new integration, and how to write a multi-phase flight — burn, stage, burn, coast — the way flight-dynamics engineers do.

## What the solver assumes

Every Runge–Kutta method is built to match the first few terms of the solution's **[[Taylor series|taylor-picture]]** — the recipe that predicts a smooth curve near a point from its value, its slope, its curvature, and so on. RK4 matches the terms up to $h^4$ (read "h to the fourth"), which is why its error per step is about $C h^5$. The number $C$ is built from the fifth derivative of the solution.

That promise holds only if those derivatives exist and stay reasonable across the whole step. At a jump they do not. If the acceleration jumps from $+53\,\mathrm{m/s^2}$ to $-9.8\,\mathrm{m/s^2}$ in zero time, the rate of change of acceleration at that instant is infinite. A step that straddles the jump samples the old rule at some stages and the new rule at others, and blends them as if they all came from one smooth curve. The blend is wrong by an amount proportional to $h$ itself, not to $h^5$. For that one step, the method has dropped to first order.

You can watch this happen with the step-halving test from the RK4 lesson. Take a toy sounding rocket flying straight up, with constant gravity and no air. It weighs $1000\,\mathrm{kg}$ at liftoff and burns $10\,\mathrm{kg/s}$ of propellant with an **exhaust velocity** (the speed the gas leaves the nozzle) of $2500\,\mathrm{m/s}$. The engine runs for $60\,\mathrm{s}$, and then the rocket coasts until $t = 150\,\mathrm{s}$. The state is altitude, vertical speed and mass. The exact speed is known from the rocket equation, so we can measure the error exactly.

```python
import numpy as np

G0, M0, MDOT, VE, T_BO = 9.80665, 1000.0, 10.0, 2500.0, 60.0

def rocket(t, y):                                # engine on before 60 s, off after
    mdot = MDOT if t < T_BO else 0.0
    return np.array([y[1], VE * mdot / y[2] - G0, -mdot])

def rk4(f, t0, t1, y, n):
    h = (t1 - t0) / n
    for i in range(n):
        t = t0 + i * h
        k1 = f(t, y)
        k2 = f(t + h / 2, y + h / 2 * k1)
        k3 = f(t + h / 2, y + h / 2 * k2)
        k4 = f(t + h, y + h * k3)
        y = y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return y

v_exact = VE * np.log(M0 / (M0 - MDOT * T_BO)) - G0 * 150.0
prev = None
for n in [31, 61, 121, 241]:                     # 60 s never lands on a step boundary
    err = abs(rk4(rocket, 0.0, 150.0, np.array([0.0, 0.0, M0]), n)[1] - v_exact)
    print(n, f"{err:.2e}", "" if prev is None else round(prev / err, 1))
    prev = err
# 31 7.01e+01
# 61 3.57e+01 2.0
# 121 1.80e+01 2.0
# 241 9.07e+00 2.0
```

Halving the step halves the error: a ratio of $2$, the signature of a first-order method. A correct RK4 on a smooth problem gives $16$. Nothing is wrong with the RK4 code. The problem is the one step that straddles $t = 60\,\mathrm{s}$, and its error rides along to the end of the run.

::: key
A step that straddles a jump in the right-hand side makes an error proportional to $h$, so a fixed-step method of any order becomes first order: halving the step only halves the error.
:::

::: note Why it has to be true
Suppose the acceleration jumps by $\Delta a$ (read "delta a") at a moment a fraction $\theta$ (read "theta") of the way through a step of length $h$, so $0 < \theta < 1$. The true speed gained includes $\Delta a$ times the time spent after the jump, which is $(1 - \theta) h$.

RK4 does not know where the jump is. It samples at the start, twice at the middle and at the end, with weights $\tfrac{1}{6}, \tfrac{2}{6}, \tfrac{2}{6}, \tfrac{1}{6}$. It sees the new rule only at the samples that land after the jump. So, to a first approximation, it credits the jump with $\Delta a \cdot w h$, where $w$ is the total weight of those samples: $w = \tfrac{5}{6}$ if the jump is in the first half of the step and $w = \tfrac{1}{6}$ if it is in the second half. The step's error is

$$
\Delta a\,h\,\lvert (1 - \theta) - w \rvert .
$$

For almost every $\theta$ that is a fixed fraction of $\Delta a\,h$. It shrinks like $h$, not like $h^5$. Only one step straddles the jump, so at small $h$ this single term dominates the final error, and the final error falls like $h$.
:::

## Four ways a straddled jump goes wrong

An adaptive solver has an error estimate, so you might hope it notices the jump and copes. Sometimes it does, at a price. Sometimes it is fooled. There are four ways it plays out.

**It spends a burst of rejected steps.** Near the jump the two answers of the embedded pair disagree badly. The controller rejects the step and shrinks it, again and again, until the straddling step is short enough that the damage fits under the tolerance. On the toy rocket at `rtol=1e-6`, RK45's steps shrink from about $11\,\mathrm{s}$ to $0.03\,\mathrm{s}$ around $t = 60\,\mathrm{s}$, then grow back.

**It quietly smears the jump.** The straddling step that finally gets accepted still carries a first-order error. The controller's estimate of that error is not reliable, because both answers of the pair were built from the same mixed-up samples. The run reports success. Only the answer is off.

**It steps over the jump entirely.** A thruster fires for one second in the middle of a long coast, while the solver is taking long steps. If none of its sample times lands inside the firing, it never sees the thrust.

**It [[chatters|chattering]].** Suppose the rule flips with the state — a thruster that pushes left whenever you are right of center, and right whenever you are left. Once the state reaches the switch, every step straddles it, and the solver gets stuck taking microscopic steps.

Here are the last two, measured.

```python
import numpy as np
from scipy.integrate import solve_ivp

def pulse(t, y):                          # a 1 s firing at 1 m/s^2, from 500 s to 501 s
    a = 1.0 if 500.0 <= t < 501.0 else 0.0
    return [y[1], a]

sol = solve_ivp(pulse, (0.0, 1000.0), [0.0, 0.0])
print(sol.nfev, np.round(sol.t[-4:], 1), sol.y[1, -1])
sol = solve_ivp(pulse, (0.0, 1000.0), [0.0, 0.0], max_step=0.5)
print(sol.nfev, round(sol.y[1, -1], 3))

def deadband(t, y):                       # push toward zero at 1 m/s, from either side
    return [-np.sign(y[0])]

sol = solve_ivp(deadband, (0.0, 10.0), [1.0], rtol=1e-6, atol=1e-6)
print(sol.success, sol.nfev, sol.t.size - 1)
# 62 [   1.1   11.1  111.1 1000. ] 0.0
# 12206 1.037
# True 552608 92082
```

::: example The burn that never happened
**What should happen.** A $1\,\mathrm{s}$ firing at $1\,\mathrm{m/s^2}$ adds $1 \times 1 = 1\,\mathrm{m/s}$. Starting from rest, the final speed must be $1\,\mathrm{m/s}$.

**What the solver did.** With nothing happening, the error estimate was zero, so the controller grew each step tenfold, the most it allows: the steps ended at $1.1$, $11.1$, $111.1$ and then $1000\,\mathrm{s}$. The sample times of that last long step all missed the window from $500$ to $501\,\mathrm{s}$. The final speed is $0.0$, the run reports success, and the burn is gone.

**The tempting patch.** Capping the step at `max_step=0.5` forces the solver to look inside the window. It now costs $12{,}206$ evaluations instead of $62$, about $200$ times more, and the answer is $1.037\,\mathrm{m/s}$: still wrong by almost $4\%$, because the steps still straddle the start and the end of the firing.

**Sanity check.** A cap of $0.5\,\mathrm{s}$ over $1000\,\mathrm{s}$ means at least $2000$ steps, at six evaluations each about $12{,}000$. The count is right. The patch pays full price and still smears.
:::

The deadband run is the other failure. The true position slides to zero at $t = 1\,\mathrm{s}$ and stays there. RK45 spends $552{,}608$ evaluations and $92{,}082$ steps on a $10\,\mathrm{s}$ run, an average step of about $0.1\,\mathrm{ms}$. It still reports success.

::: key
Why restart the solver at staging? Mass and thrust change discontinuously, which invalidates the smoothness the error estimator assumes. Integrate up to the event, apply the discrete change, and start a new integration; otherwise the controller either rejects steps endlessly or quietly smears the discontinuity.
:::

## The fix: stop, change, restart

The cure is to never let a step straddle a jump. You break the flight into **phases** — stretches of time in which the equations are smooth — and integrate each phase with its own call to the solver. The recipe has four steps.

1. **Find the moment.** If you know the time in advance (the engine burns for exactly $60\,\mathrm{s}$), make it the end of the phase's time span. If it depends on the state (cut the engine when the speed reaches a target, or when the propellant runs out), use a terminal event, as in the events lesson.
2. **Stop exactly there.** The solver ends the phase with its last step landing on the moment, or with the event located to the solver's tolerance.
3. **Apply the change.** Change the state (drop the mass of the empty stage) or change the model (engine off), or both.
4. **Start fresh.** Call the solver again from the new state. A new call picks a new first step and assumes nothing about what came before, so it never sees the jump.

Here is the pulse done that way. The same right-hand side serves all three phases; only the acceleration passed in `args` changes.

```python
import numpy as np
from scipy.integrate import solve_ivp

def coast_or_burn(t, y, a):
    return [y[1], a]

t, y = 0.0, np.array([0.0, 0.0])
for t_end, a in [(500.0, 0.0), (501.0, 1.0), (1000.0, 0.0)]:
    sol = solve_ivp(coast_or_burn, (t, t_end), y, args=(a,))
    t, y = sol.t[-1], sol.y[:, -1]
    print(f"t={t:6.1f} s  x={y[0]:7.3f} m  v={y[1]:.6f} m/s  nfev={sol.nfev}")
# t= 500.0 s  x=  0.000 m  v=0.000000 m/s  nfev=62
# t= 501.0 s  x=  0.500 m  v=1.000000 m/s  nfev=32
# t=1000.0 s  x=499.500 m  v=1.000000 m/s  nfev=32
```

Exact, and cheap: $126$ evaluations in all. The final position checks out by hand: $\tfrac{1}{2} \cdot 1 \cdot 1^2 = 0.5\,\mathrm{m}$ during the firing, then $499\,\mathrm{s}$ at $1\,\mathrm{m/s}$, for $499.5\,\mathrm{m}$.

Discontinuities come in three kinds, each cured in a slightly different way.

- **A jump in the state.** Staging drops mass; an [[impulsive burn|impulsive-burn]] changes velocity in an instant. No right-hand side can do that. You stop and edit `y` by hand.
- **A jump in the right-hand side.** Cutoff, ignition, a parachute opening: the state is continuous but its rate is not. You stop and switch the model's parameters.
- **A kink.** The rate is continuous but its slope is not, as when a value hits a limit. Milder; see the end of this lesson.

::: warning Do not decide the phase from `t` inside the right-hand side
It looks harmless to keep `if t < T_BO` in the right-hand side and merely split the time span at $60\,\mathrm{s}$. But the last stage of the burn phase evaluates the right-hand side at exactly $t = 60$, where `t < T_BO` is false, so the burn's final stage already sees the engine off. On the toy rocket at `rtol=1e-6`, splitting that way gives an error of $4.1 \times 10^{-3}\,\mathrm{m/s}$, while passing the phase in `args` gives $2.8 \times 10^{-5}\,\mathrm{m/s}$ — about $150$ times smaller, with $106$ evaluations instead of $262$. For comparison, one run straight through the jump costs $212$ evaluations and is off by $0.17\,\mathrm{m/s}$. Let the phase, not the clock, choose the model.
:::

## A two-stage ascent, phase by phase

Now a whole flight. It is still a toy — straight up, constant gravity, no air — so its heights come out far larger than a real rocket's. But a real ascent simulation has exactly this structure.

- **Stage 1** burns $20{,}000\,\mathrm{kg}$ of propellant at $200\,\mathrm{kg/s}$, exhaust velocity $2800\,\mathrm{m/s}$. Liftoff mass $28{,}000\,\mathrm{kg}$. Burn time $20{,}000 / 200 = 100\,\mathrm{s}$: a known time.
- **Staging** throws away the $2000\,\mathrm{kg}$ empty first stage: a jump in the mass state.
- **Stage 2** burns at $20\,\mathrm{kg/s}$, exhaust velocity $3300\,\mathrm{m/s}$, until the speed reaches $3500\,\mathrm{m/s}$: a state-dependent cutoff, found with an event. It carries $4500\,\mathrm{kg}$ of propellant, which would last $225\,\mathrm{s}$, so that is the longest the phase can run.
- **Coast** with the engine off until **apogee**, the highest point, where the vertical speed crosses zero going down: another event.

```python
import numpy as np
from scipy.integrate import solve_ivp

G0 = 9.80665

def ascent(t, y, mdot, ve):
    h, v, m = y
    return [v, ve * mdot / m - G0, -mdot]

def cutoff(t, y, mdot, ve):          # stage 2 shuts down at 3500 m/s
    return y[1] - 3500.0
cutoff.terminal = True
cutoff.direction = 1

def apogee(t, y, mdot, ve):          # vertical speed crosses zero going down
    return y[1]
apogee.terminal = True
apogee.direction = -1

opts = dict(method="DOP853", rtol=1e-10, atol=[1e-4, 1e-7, 1e-6])
t, y = 0.0, np.array([0.0, 0.0, 28000.0])      # h (m), v (m/s), m (kg)
segments = []

# Phase 1: stage 1 burns 20,000 kg at 200 kg/s -> ends at a known time
sol = solve_ivp(ascent, (t, t + 100.0), y, args=(200.0, 2800.0), **opts)
segments.append(sol)
t, y = sol.t[-1], sol.y[:, -1].copy()
y[2] -= 2000.0                                  # drop the empty stage 1
print(f"staging  t={t:6.1f} s  h={y[0]/1e3:7.2f} km  v={y[1]:7.1f} m/s  m={y[2]:.0f} kg")

# Phase 2: stage 2 burns until v = 3500 m/s (or its 4,500 kg run out)
sol = solve_ivp(ascent, (t, t + 225.0), y, args=(20.0, 3300.0), events=cutoff, **opts)
segments.append(sol)
t, y = sol.t[-1], sol.y[:, -1].copy()
print(f"cutoff   t={t:6.1f} s  h={y[0]/1e3:7.2f} km  v={y[1]:7.1f} m/s  m={y[2]:.0f} kg  status={sol.status}")

# Phase 3: coast with the engine off until apogee
sol = solve_ivp(ascent, (t, t + 1000.0), y, args=(0.0, 3300.0), events=apogee, **opts)
segments.append(sol)
t, y = sol.t[-1], sol.y[:, -1].copy()
print(f"apogee   t={t:8.3f} s  h={y[0]/1e3:9.4f} km  v={y[1]:7.1f} m/s")

ts = np.concatenate([s.t for s in segments])
ys = np.hstack([s.y for s in segments])
print(ts.shape, ys.shape, sum(s.nfev for s in segments))
# staging  t= 100.0 s  h=  90.66 km  v= 2527.1 m/s  m=6000 kg
# cutoff   t= 261.9 s  h= 552.10 km  v= 3500.0 m/s  m=2761 kg  status=1
# apogee   t= 618.834 s  h=1176.6718 km  v=    0.0 m/s
# (26,) (3, 26) 408
```

Read the pattern before the numbers. One right-hand side, `ascent`, serves every phase; `args` picks the phase. Each phase starts from the last column of the previous `sol.y`, copied before editing so phase 1's stored history keeps the mass it really had. `sol.status` is `1` when an event stopped the phase, as it did at cutoff. The event functions take the same extra arguments as the right-hand side, because `solve_ivp` passes `args` to both.

At the end the segments are joined into one history. Each boundary time appears twice, as the end of one phase and the start of the next. At staging those two columns hold $8000\,\mathrm{kg}$ and then $6000\,\mathrm{kg}$. That is correct: a plot draws the jump as a vertical line, which is what really happened.

::: example Checking the ascent against the exact answer
Because gravity is constant and there is no air, each burn has an exact solution. For a burn starting at mass $m_0$ with flow $\dot{m}$ and exhaust velocity $v_e$, after time $s$ the mass is $m = m_0 - \dot{m} s$ and the speed gained is

$$
\Delta v = v_e \ln\frac{m_0}{m} - g_0 s .
$$

**Stage 1.** $m_0 = 28{,}000\,\mathrm{kg}$ and after $100\,\mathrm{s}$, $m = 8000\,\mathrm{kg}$. So $\Delta v = 2800 \ln 3.5 - 9.80665 \times 100 = 3507.7 - 980.7 = 2527.1\,\mathrm{m/s}$. That matches the staging line.

**Stage 2.** Starting from $6000\,\mathrm{kg}$, the speed reaches $3500\,\mathrm{m/s}$ when $2527.07 + 3300 \ln\frac{6000}{6000 - 20 s} - 9.80665\,s = 3500$. Solving that with `brentq` gives $s = 161.9334\,\mathrm{s}$, so cutoff at $t = 261.9334\,\mathrm{s}$ with $6000 - 20 \times 161.9334 = 2761.3\,\mathrm{kg}$ left. Matches.

**Coast.** At cutoff the rocket is at $552{,}095.67\,\mathrm{m}$ going up at $3500\,\mathrm{m/s}$. It climbs for $3500 / 9.80665 = 356.9\,\mathrm{s}$ more, and gains $3500^2 / (2 \times 9.80665) = 624{,}576.2\,\mathrm{m}$. Apogee at $t = 618.834081\,\mathrm{s}$ and $1{,}176{,}671.848\,\mathrm{m}$.

**How close.** The solver's apogee time differs from the exact one by about $8 \times 10^{-9}\,\mathrm{s}$, and its apogee height by about $2 \times 10^{-5}\,\mathrm{m}$ — a fiftieth of a millimeter, after $1177\,\mathrm{km}$ of climbing, for $408$ evaluations. Each phase is smooth, so DOP853 delivers its full eighth-order accuracy.
:::

## Jumps you did not put there on purpose

Staging and cutoff are easy to spot, because you wrote them. Others hide inside ordinary-looking code.

- **Saturation.** `np.clip(cmd, -5, 5)` limits a fin angle to $\pm 5°$. When the command crosses the limit, the output stops following it: a kink.
- **Table lookups.** `np.interp` draws straight lines between the points of an [[aerodynamic table|table-kinks]]. At every table point the slope changes: a kink. At the table's last point, the value freezes: another kink.
- **`abs`, `min`, `max` and `if`.** Each one is a switch, and each switch is a potential jump or kink.
- **Near-singularities.** Not a jump, but it behaves like one: a gravity term $\mu / r^2$ as the radius $r$ heads toward zero, or a division by a speed that passes through zero.

A kink is gentler than a jump. The rate stays continuous, so a straddling step's error is about $h^2$ times the slope change instead of $h$ times a jump. It usually costs a few extra rejected steps per kink, and is worth fixing only when kinks are crossed often or accuracy must be very tight. The fixes are the same tools as before.

- If the kink is at a known time (a scheduled throttle change), split the time span there.
- If it depends on the state (a command reaching a limit), write an event on the switching quantity, such as `cmd - 5.0`, and restart with the other model.
- If a switch flips back and forth, as the deadband did, give it **[[hysteresis|hysteresis]]** — switch on at one threshold and off at a different one — which is also what real thruster logic does.
- Smooth a switch into a steep but continuous curve only if the physics really is smooth. Otherwise you have changed the vehicle, not the numerics.

::: key
Your integrator takes a million tiny steps over a 100-second span. Either the system is stiff and needs Radau or BDF, or there is a discontinuity or a near-singularity being stepped over (a saturation, a table edge, a division as a radius approaches zero), or atol is set far below the physical scale of a state.
:::

::: warning Event functions must not change anything
It is tempting to have an event function set a global flag, `stage = 2`, that the right-hand side reads. Do not. The solver calls the event function many times, at every step and again while it hunts for the exact crossing, and it calls the right-hand side at trial points it later throws away. A flag set inside those calls flips at the wrong time. Event functions only return a number. The change belongs in your own code, between two solver calls.
:::

Some tools do this for you. Simulink, for example, finds the switch points of blocks such as Saturation and lands a step on each, a feature called [[zero-crossing detection|zero-crossing]]. In Python you do it by hand, and the phase loop above is the whole trick.

## Check yourself

::: check
A colleague checks her fixed-step RK4 ascent code by step halving. On a coast-only test the error ratio is $16$. On a full flight with engine cutoff at $t = 172.35\,\mathrm{s}$, with steps of $0.4$, $0.2$ and $0.1\,\mathrm{s}$, the ratio is $2$. Is her RK4 broken? What should she change?
:::

::: answer
Her RK4 is not broken: a wrong coefficient would spoil the coast test too. The ratio of $2$ comes from the one step that straddles cutoff. With steps of $0.4$, $0.2$ and $0.1\,\mathrm{s}$, the time $172.35\,\mathrm{s}$ is never on a step boundary: $172.35 / 0.4 = 430.875$, $172.35 / 0.2 = 861.75$ and $172.35 / 0.1 = 1723.5$. That one step makes an error proportional to $h$, so the whole run is first order. She should end the burn phase exactly at $172.35\,\mathrm{s}$, switch to the engine-off model through a parameter, and start the coast phase there. Then the ratio should return to about $16$.
:::

::: check
Sort each of these into a jump in the state, a jump in the right-hand side, or a kink: (a) the payload fairing, $1900\,\mathrm{kg}$, is jettisoned; (b) the main engine shuts down; (c) the drag coefficient is read from a table with linear interpolation between Mach numbers; (d) a reaction wheel's commanded torque is limited to $0.2\,\mathrm{N\,m}$.
:::

::: answer
(a) A jump in the state: the mass drops by $1900\,\mathrm{kg}$ in an instant, so you stop and subtract it from `y` by hand.
(b) A jump in the right-hand side: position, velocity and mass are continuous, but thrust and mass-flow rate drop to zero, so the acceleration jumps.
(c) A kink at every table point: the drag coefficient is continuous, but its slope with Mach number changes at each point.
(d) A kink: the torque follows the command until it reaches $0.2\,\mathrm{N\,m}$ and then stays flat, so the torque is continuous but its slope is not.
:::

::: check
Write an event function that stops a burn when the propellant runs out. The state is `[h, v, m]` and the vehicle's mass with empty tanks is `m_dry`. Say what `terminal` and `direction` should be, and why.
:::

::: answer
```python
def burnout(t, y, mdot, ve):
    return y[2] - m_dry
burnout.terminal = True
burnout.direction = -1
```

The function is zero exactly when the mass equals the empty mass. `direction = -1` picks the crossing where the function is decreasing, which is the only way mass moves during a burn. `terminal = True` stops the phase there, so your own code can switch the engine off and start the next phase. The function takes the same `args` as the right-hand side, because `solve_ivp` passes them to both.
:::

::: check
Why is `max_step` a poor fix for a short thruster pulse, and what does it cost? Use the numbers from the pulse example.
:::

::: answer
`max_step` forces small steps everywhere but does not say where the pulse starts and ends. Steps still straddle both edges, so the answer is still smeared: $1.037\,\mathrm{m/s}$ instead of $1\,\mathrm{m/s}$, almost $4\%$ off. And it pays for small steps over the whole $1000\,\mathrm{s}$: $12{,}206$ evaluations against $126$ for the three-phase restart, which is exact. Splitting the time span at $500$ and $501\,\mathrm{s}$ is cheaper and right.
:::

::: check
In the two-stage ascent, why does the code call `.copy()` on `sol.y[:, -1]` before subtracting the stage-1 mass? What would go wrong without it?
:::

::: answer
`sol.y[:, -1]` is a view into phase 1's result array, not a separate copy. Without `.copy()`, `y[2] -= 2000.0` would also change the last column of phase 1's stored history. The record would show the vehicle already $2000\,\mathrm{kg}$ lighter at the end of the first burn, and the joined history would lose its mass jump at staging. Copying keeps each phase's history as computed.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Discontinuity | a quantity or its rate changes value in zero time: staging, cutoff, ignition, touchdown |
| Why it hurts | methods assume smooth derivatives; a straddling step makes an error proportional to $h$ |
| Fixed-step symptom | step-halving ratio drops to $2$ whatever the method's order |
| Adaptive symptoms | bursts of rejected steps, a smeared answer, a pulse stepped over, chattering |
| The cure | stop at the moment, apply the change, start a new integration |
| Known time | end the phase's `t_span` there |
| State-dependent | terminal event with the right `direction` |
| Choosing the model | pass the phase in `args`; never decide it from `t` inside `fun` |
| Kinks | saturation, table edges, `abs`, `min`, `max`: milder; split or use events if they matter |
| A million tiny steps | stiffness, a discontinuity or near-singularity, or atol far too small |

Every phase in this lesson was integrated with an adaptive solver, free to choose its own steps. On a flight computer that freedom is not allowed: each cycle must finish in a fixed time. The next lesson, the last in this module, is about fixed-step integration for real-time code, and what it takes to trust a method that has no error estimate at all.

::: context discontinuity-word Jumps, and "almost jumps"
"Continuous" means you can draw the curve without lifting your pencil. A discontinuity is a spot where you must lift it. Real physics is rarely truly discontinuous: an engine's thrust takes a fraction of a second to die away as the valves close, and separation springs push a stage off over tens of milliseconds. But those times are far shorter than anything a trajectory cares about, so engineers model them as instant jumps. A modeled jump is still a jump to the solver.
:::

::: context taylor-picture Predicting a curve from one point
A Taylor series predicts a smooth curve near a point from its value, slope, curvature and higher derivatives there: $y(t + h) = y + h\dot{y} + \tfrac{h^2}{2}\ddot{y} + \dots$. It works beautifully for a smooth curve. For a curve with a corner, a prediction built on one side knows nothing about the other side, as the drawing shows: the dashed guess keeps climbing while the real speed has turned downward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <text x="336" y="174" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
  <text x="36" y="30" font-size="11" fill="#6c7a93">speed</text>
  <path d="M30,150 Q120,110 190,60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="60" x2="330" y2="110" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="60" x2="300" y2="18" stroke="#f2b880" stroke-width="2.5" stroke-dasharray="6 4"/>
  <line x1="190" y1="60" x2="190" y2="160" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="190" cy="60" r="4" fill="#b4232c"/>
  <text x="196" y="150" font-size="11" fill="#b4232c">engine cutoff</text>
  <text x="240" y="44" font-size="11" fill="#1f2a44">smooth guess</text>
  <text x="250" y="102" font-size="11" fill="#1f2a44">real: coasting</text>
  <text x="60" y="118" font-size="11" fill="#1f2a44">burning</text>
</svg>
```
:::

::: context chattering Stuck on the switch
Picture the deadband system near zero. A tiny step to the right of zero says "go left"; a tiny step to the left says "go right". The true solution sits at zero, but the rule never agrees with itself there. An adaptive solver keeps shrinking the step, hoping the two answers of its pair will agree, and they never quite do. In the extreme this is called Zeno behavior, after the Greek puzzle of a runner who must first cover half the distance, then half of what is left, and so on forever. Here it means infinitely many switches in a finite time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="345" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <text x="345" y="96" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
  <text x="24" y="76" font-size="11" fill="#6c7a93">0</text>
  <line x1="40" y1="20" x2="180" y2="80" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="180,80 188,76 196,84 204,77 212,83 220,78 228,82 236,79 244,81 252,79.5 260,80.5 268,79.8 276,80.2 284,80 340,80" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="60" y="20" font-size="11" fill="#1d6fd1">slides to zero</text>
  <text x="190" y="112" font-size="11" fill="#b4232c">tiny steps, flipping sign</text>
</svg>
```
:::

::: context impulsive-burn Burns treated as instant
In orbit design, a short engine burn is often modeled as an instant change in velocity, a delta-v, applied between two coasts. That is a jump in the state, and it is handled exactly like staging: propagate to the burn time, add the delta-v to the velocity part of the state, start a new propagation. The approximation is good when the burn lasts a small fraction of the orbit, such as a one-minute burn on a 90-minute orbit. Long, low-thrust burns are integrated as a burn phase instead.
:::

::: context table-kinks Straight lines between table points
Aerodynamic data usually arrives as a table: drag coefficient at Mach 0.5, 0.8, 1.0, 1.2 and so on. Linear interpolation joins the points with straight segments. The value is continuous, but the slope jumps at every point, and past the last point `np.interp` holds the last value flat. Each corner is a kink the solver must cross.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="20" x2="40" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="336" y="158" font-size="11" text-anchor="end" fill="#6c7a93">Mach number</text>
  <text x="46" y="30" font-size="11" fill="#6c7a93">drag coefficient</text>
  <polyline points="60,110 120,100 170,50 220,60 280,90 330,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="60" cy="110" r="4" fill="#1f2a44"/>
  <circle cx="120" cy="100" r="4" fill="#1f2a44"/>
  <circle cx="170" cy="50" r="4" fill="#1f2a44"/>
  <circle cx="220" cy="60" r="4" fill="#1f2a44"/>
  <circle cx="280" cy="90" r="4" fill="#b4232c"/>
  <text x="120" y="126" font-size="11" fill="#1f2a44">table points: slope jumps</text>
  <text x="252" y="112" font-size="11" fill="#b4232c">last point: held flat</text>
</svg>
```
:::

::: context hysteresis Two thresholds, not one
A home thermostat set to $20\,^\circ\mathrm{C}$ does not switch the heater on at $19.99$ and off at $20.01$, or it would click all day. It turns on at about $19.5$ and off at about $20.5$. That gap is hysteresis. Spacecraft attitude thrusters work the same way: they fire when the pointing error passes one limit and stop only when it has come back well inside. In a simulation, the gap means each switch happens once per swing, so you can stop the solver at each switch with an event and restart, instead of chattering.
:::

::: context zero-crossing The same idea, built in
Simulink's variable-step solvers watch the switching signals of blocks like Saturation, Switch and Abs. When a signal changes sign within a step, the solver hunts down the crossing time, lands a step exactly on it, and carries on from there with the new behavior. It is the stop, change, restart pattern of this lesson, done automatically. It can be switched off for speed, which brings back every problem shown here.
:::
