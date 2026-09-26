---
id: l02-open-loop-vs-closed-loop-guidance
title: Open-loop, reference-following and explicit guidance
minutes: 22
covers:
  - Open-loop vs closed-loop guidance; reference-trajectory following vs explicit guidance
---

Throw a paper airplane. Once it leaves your hand, you cannot fix anything. If a draft from the window pushes it sideways, it just drifts. All the "guidance" happened before the throw.

Now carry a full cup of water across a room. You watch the cup the whole way. The moment it tips, you tilt it back. You are using what you see to decide what to do next.

There are two different ways to do the watching, too. You could follow a line of tape stuck on the floor, and whenever you step off it, step back on. Or you could skip the tape and, at every step, look at the table you are heading for and walk straight toward it from wherever you happen to be. If someone moves the table, the tape leads you to the old spot. Looking at the table takes you to the new one.

Those three pictures are the three kinds of guidance in this lesson. Guidance laws differ along **two separate questions**, and mixing the two up is the most common source of muddled thinking about how real vehicles are guided:

1. **Does the law look at the vehicle at all while it flies?** If not, it is **open-loop**, like the paper airplane. If it does, it is **closed-loop**, like the cup.
2. **If it looks, what does it compare against?** A path worked out in advance, like the tape (**reference-trajectory following**), or a fresh answer worked out from where the vehicle is right now, like walking toward the table (**explicit guidance**).

One rocket climb shows all three. Low in the thick atmosphere, the rocket usually flies a **[[pitch program|pitch-program]]** — a schedule of tilt angle against time, chosen before liftoff and flown without looking at where the rocket actually is. That is open-loop. Once the air is thin enough that steering is safe, older rockets followed a stored path and corrected any drift away from it. Modern rockets use explicit guidance instead: every cycle they recompute the steering needed to reach the target orbit from wherever they actually are. The same three choices show up when a capsule docks and when a lander descends. So this lesson works them out once, in general. The rest of the module then builds specific laws on top.

## Open-loop guidance: decide everything in advance

**Open-loop guidance** commands $\mathbf{u}(t)$ — read "u of t", the command as a function of time — from a schedule fixed before the maneuver starts. It never checks the schedule against the vehicle's actual state.

That has one big strength. It needs no navigation input during the maneuver, so it cannot react badly to anything. That matters when reacting could do harm. Near **[[maximum dynamic pressure|max-q]]**, the moment in a climb when the air pushes hardest on the rocket, steering hard into a gust could bend the vehicle.

It also has one big weakness. Anything the schedule did not expect goes completely uncorrected, because nothing in the law is watching.

::: example A crosswind under open-loop guidance
A vehicle is flying a planned path with zero commanded sideways acceleration. A crosswind pushes it sideways with a steady **disturbance acceleration** $a_d = 0.5\,\mathrm{m/s^2}$ for $T = 20\,\mathrm{s}$. The open-loop schedule cannot sense it.

Call the sideways position $y$. Its acceleration is $\ddot{y}$, read "y double dot". With nothing fighting the wind, $\ddot{y} = a_d$, starting from $y = 0$ and sideways speed $\dot{y} = 0$ ("y dot").

**Sideways speed.** A steady acceleration adds $a_d$ meters per second of speed every second: $\dot{y}(T) = a_d T = 0.5 \times 20 = 10.0\,\mathrm{m/s}$.

**Sideways drift.** Starting from rest under steady acceleration, the distance is $\tfrac12 a_d T^2$:

$$
y(T) = \tfrac12 a_d T^2 = \tfrac12 \times 0.5 \times 20^2 = 100.0\,\mathrm{m}.
$$

**Sanity check.** The sideways speed grew evenly from $0$ to $10\,\mathrm{m/s}$, so it averaged $5\,\mathrm{m/s}$ over $20\,\mathrm{s}$: $5 \times 20 = 100\,\mathrm{m}$. It matches.

A hundred meters of drift, and still drifting at ten meters per second. That is not because open-loop guidance is badly designed. It was never designed for this job. It is designed for moments when steering is the bigger risk. The cure for a disturbance like this one is not a smarter schedule. It is feedback.
:::

## Closed-loop guidance: watch and react

**Closed-loop guidance** computes its command from the current **[[state estimate|x-hat]]** $\hat{\mathbf{x}}(t)$ — read "x hat of t", the navigation system's best guess of the state. Any disturbance the vehicle really feels shows up in the state, so it gets corrected. Using the measured result to adjust the input is called **[[feedback|feedback]]**.

Take the same crosswind. Add a simple correction on top of the planned path: push back in proportion to how far off you are, and in proportion to how fast you are drifting.

$$
u = -k_p\, y - k_d\, \dot{y}.
$$

Here $k_p$ ("k sub p", the **proportional gain**) sets how hard to push back per meter of error, and $k_d$ ("k sub d", the **derivative gain**) sets how hard to push back per meter per second of drift. This is a **PD** (proportional–derivative) law, which the classical control module built in full.

How do we pick the gains? With the correction on, the sideways motion obeys

$$
\ddot{y} = a_d + u = a_d - k_p\, y - k_d\, \dot{y}.
$$

Move the $y$ terms to the left: $\ddot{y} + k_d\,\dot{y} + k_p\, y = a_d$. That has the standard spring-and-damper form, $\ddot{y} + 2\zeta\omega_n\,\dot{y} + \omega_n^2\, y$, with a **[[natural frequency and damping ratio|wn-zeta]]** you can choose. Matching the two term by term gives

$$
k_p = \omega_n^2, \qquad k_d = 2\zeta\omega_n.
$$

::: example The same crosswind, closed-loop
Choose a natural frequency $\omega_n = 0.5\,\mathrm{rad/s}$ ("omega sub n") and a damping ratio $\zeta = 0.7$ ("zeta"). Then

$$
k_p = 0.5^2 = 0.25\,\mathrm{s^{-2}}, \qquad k_d = 2 \times 0.7 \times 0.5 = 0.70\,\mathrm{s^{-1}}.
$$

Step the motion forward in time for the same $20\,\mathrm{s}$, $1\,\mathrm{ms}$ at a time, with a standard Runge–Kutta step:

```python
a_d, kp, kd = 0.5, 0.25, 0.70

def accel(y, ydot):
    return a_d - kp * y - kd * ydot

y, ydot, dt = 0.0, 0.0, 0.001
for step in range(20000):          # 20 000 steps of 1 ms = 20 s
    # one Runge-Kutta step for the pair (y, ydot)
    k1y, k1v = ydot, accel(y, ydot)
    k2y, k2v = ydot + dt/2*k1v, accel(y + dt/2*k1y, ydot + dt/2*k1v)
    k3y, k3v = ydot + dt/2*k2v, accel(y + dt/2*k2y, ydot + dt/2*k2v)
    k4y, k4v = ydot + dt*k3v, accel(y + dt*k3y, ydot + dt*k3v)
    y += dt/6*(k1y + 2*k2y + 2*k3y + k4y)
    ydot += dt/6*(k1v + 2*k2v + 2*k3v + k4v)
print(round(y, 4), round(ydot, 5))
# 1.9975 0.00097
```

After $20\,\mathrm{s}$ the vehicle is $1.997\,\mathrm{m}$ off, and barely moving sideways any more. That is almost exactly the resting value a steady push settles to under this kind of feedback:

$$
y_{ss} = \frac{a_d}{k_p} = \frac{0.5}{0.25} = 2.000\,\mathrm{m}.
$$

($y_{ss}$ is read "y sub s s", the **steady-state** offset.) Compare $100\,\mathrm{m}$ open-loop with $2\,\mathrm{m}$ closed-loop: a fiftyfold improvement, from nothing more than looking at the state and reacting. That one number is the whole case for feedback.
:::

::: note Why the offset settles at a_d / k_p
Once the motion has settled, nothing is changing: $\dot{y} = 0$ and $\ddot{y} = 0$. Put those into $\ddot{y} = a_d - k_p y - k_d \dot{y}$:

$$
0 = a_d - k_p\, y_{ss} - 0 \quad\Longrightarrow\quad y_{ss} = \frac{a_d}{k_p}.
$$

It is a balance point. The push back from the feedback, $k_p y_{ss}$, exactly equals the wind's push, $a_d$. Like a weight hanging on a spring, it depends only on the two forces in balance, not on how long it took to get there. The derivative gain $k_d$ affects how the vehicle gets there (how much it overshoots, how fast it settles) but not where it ends up.
:::

The fiftyfold improvement comes from measuring the state and reacting to it. What the law *does* with that measurement is the second question.

## Reference-trajectory following: stay on the planned path

**Reference-trajectory following** works out a planned state history $\mathbf{x}^\star(t)$ ("x star of t") ahead of time, on the ground. Along with it comes a planned command $\mathbf{u}^\star(t)$ ("u star"). In flight, it feeds back only the difference between the plan and the estimate:

$$
\mathbf{u}(t) = \mathbf{u}^\star(t) + \mathbf{K}(t)\big(\mathbf{x}^\star(t) - \hat{\mathbf{x}}(t)\big).
$$

Read it left to right: fly the planned command, plus a correction. The correction is a **gain matrix** $\mathbf{K}(t)$ times how far the estimate is from the plan. The difference $\mathbf{x}^\star - \hat{\mathbf{x}}$ is the **deviation**.

$\mathbf{K}(t)$ is often exactly the time-varying **[[LQR|lqr]]** gain from the optimal control module. Here is why. Linearize the vehicle's motion about $\mathbf{x}^\star(t)$ — treat small deviations as obeying straight-line (linear) equations — and "drive the deviation to zero" becomes an ordinary linear-quadratic regulator problem, with all the margin and tuning tools that module built. The closed-loop crosswind example above was exactly this, with the planned path "zero sideways offset".

**The strength.** The hard work — finding a good, safe, efficient path — happens once, on the ground, with all the time and computing power you like. Engineers inspect and check the path before it ever flies. What flies is a small linear correction around a known-good path, and the stability and margin tools from the control tier apply to it directly.

**The weakness.** Everything depends on the path staying relevant. $\mathbf{x}^\star(t)$ was computed for one specific start and one specific finish. The correction law has no way to notice if the finish changes. It keeps steering back toward the old path's end, $\mathbf{x}^\star(t_f)$, because that is the only target it has ever been given.

A small **[[dispersion|dispersion]]** — a small difference between the real flight and the plan — gets corrected well, as long as the straight-line approximation around $\mathbf{x}^\star(t)$ still holds. A big one that makes the plan itself wrong — an engine failure that changes what paths are even possible, or a new target — is not corrected at all. It needs a new reference, computed and checked before it can be flown. There is rarely time for that in flight.

## Explicit guidance: re-solve from where you are

**Explicit guidance** keeps no stored path. Every cycle, it takes the current state and the goal and works out directly what remains to be done. It solves a **[[boundary value problem|bvp]]** — find the motion that starts at *this* state and ends at *that* goal — from scratch, instead of tracking a deviation from an answer computed earlier.

The simplest example is **required-velocity targeting**. Suppose there is no gravity and no thrust after one quick burn, so the vehicle coasts in a straight line at constant velocity. Where should it be heading?

1. Let $\mathbf{r}$ be where it is now, $\mathbf{r}_{aim}$ ("r sub aim") the **aimpoint** where it must arrive, and $t_{go}$ the time left.
2. Coasting at a new velocity $\mathbf{v}_{new}$ for time $t_{go}$ carries it to $\mathbf{r} + \mathbf{v}_{new}\,t_{go}$. Set that equal to the aimpoint: $\mathbf{r} + \mathbf{v}_{new}\,t_{go} = \mathbf{r}_{aim}$.
3. Subtract $\mathbf{r}$ from both sides and divide by $t_{go}$: $\mathbf{v}_{new} = (\mathbf{r}_{aim} - \mathbf{r})/t_{go}$.
4. The burn needed is the new velocity minus the current one, $\mathbf{v}$:

$$
\Delta\mathbf{v}_{req} = \frac{\mathbf{r}_{aim} - \mathbf{r}}{t_{go}} - \mathbf{v}.
$$

Read $\Delta\mathbf{v}_{req}$ as "delta v required". It uses only the current state and the target. There is no stored path. If the aimpoint changes, the very next calculation uses the new one automatically.

::: example Retargeting mid-approach
A chaser spacecraft is at $\mathbf{r} = (-1200,\ 300,\ 0)\,\mathrm{m}$ relative to a space station, moving at $\mathbf{v} = (0.8,\ -0.05,\ 0)\,\mathrm{m/s}$. It is aiming at docking port A, $\mathbf{r}_{aim} = (0,\ 0,\ 0)$, with $t_{go} = 1500\,\mathrm{s}$ left. Mission control reassigns it to port B, at $(0,\ 12,\ 0)\,\mathrm{m}$.

```python
import numpy as np
r = np.array([-1200.0, 300.0, 0.0]); v = np.array([0.8, -0.05, 0.0]); t_go = 1500.0
r_old = np.array([0.0, 0.0, 0.0]); r_new = np.array([0.0, 12.0, 0.0])
dv_old = (r_old - r) / t_go - v
dv_new = (r_new - r) / t_go - v
print(dv_old, dv_new, dv_new - dv_old)
# [ 0.   -0.15  0.  ] [ 0.    -0.142  0.   ] [0.    0.008 0.   ]
```

**Toward port A.** $(\mathbf{r}_{aim} - \mathbf{r})/t_{go} = (1200,\ -300,\ 0)/1500 = (0.8,\ -0.2,\ 0)\,\mathrm{m/s}$. Subtract $\mathbf{v}$: $\Delta\mathbf{v}_{req} = (0,\ -0.15,\ 0)\,\mathrm{m/s}$.

**Toward port B.** $(1200,\ -288,\ 0)/1500 = (0.8,\ -0.192,\ 0)\,\mathrm{m/s}$, so $\Delta\mathbf{v}_{req} = (0,\ -0.142,\ 0)\,\mathrm{m/s}$.

**The change.** Only $(0,\ 0.008,\ 0)\,\mathrm{m/s}$ — $8$ millimeters per second, applied on the very next cycle. The law never computed anything special about port A. It always computed "the velocity that gets me from here to the current aimpoint", and the aimpoint is only an input.

A reference-following law built around a path ending at port A has no such input. It keeps steering toward port A. Left unreplanned, it misses the new port by the full distance between the ports, $\lVert\mathbf{r}_{aim,new} - \mathbf{r}_{aim,old}\rVert = 12.0\,\mathrm{m}$. That is not because its feedback is weak. It is correcting toward the wrong thing.
:::

That quick response is not free. Required-velocity targeting is the simplest possible explicit law: it only works for coasting in a straight line with no forces. A real law has to solve the remaining problem under the vehicle's real motion — gravity, thrust limits, a target that moves — every single cycle, in the time the guidance rate allows. That is only practical when the remaining problem has a **closed-form** answer (a formula you can evaluate directly) or one that converges quickly. That is exactly why so much of this module derives such answers. Proportional navigation is the closed form for driving an intercept's miss to zero. Zero-effort-miss and zero-effort-velocity guidance are the closed form for a soft landing. **[[Powered Explicit Guidance|peg]]**, built in the ascent guidance module on top of this one, is the closed form for reaching a target orbit.

Explicit guidance also gives up the "checked path" advantage. What actually flies is a different path every flight, made up on board. So proving it safe means checking the *law* across every state it might meet, not inspecting one fixed path.

::: key Two axes, not one
Open-loop vs closed-loop asks whether the command depends on the current state at all. Reference-trajectory following vs explicit guidance asks, given that it does, what the command is computed against. Reference-following tracks a precomputed trajectory, so it is simple but brittle to large dispersions. Explicit guidance solves the boundary-value problem onboard each cycle from the current state, so it retargets naturally — PEG and convex powered descent are both explicit. A pitch program is open-loop. An ascent tracking a stored profile is closed-loop reference-following. Proportional navigation, zero-effort-miss/velocity guidance and Powered Explicit Guidance are all closed-loop and explicit.
:::

::: warning "Closed-loop" does not mean "explicit"
Reference-trajectory following is closed-loop — it uses the state estimate every cycle — and it is still not explicit. What it does with the estimate is correct toward a fixed path, not re-derive the path. The two questions really are separate. You can build a closed-loop law that handles large dispersions badly. You can also, more rarely, build an explicit law around a badly chosen goal. Ask both questions — does it use feedback, and what does it use the feedback *for*? — before you trust a guidance law with whatever your mission will throw at it.
:::

::: note Explicit guidance needs a computer that can keep up
Explicit guidance was not even an option until flight computers could solve the remaining problem every guidance cycle. Early rockets flew open-loop through the atmosphere and followed a stored reference above it for exactly that reason. Explicit schemes — the Saturn V's iterative guidance, then the Space Shuttle's Powered Explicit Guidance — spread as onboard computers grew fast enough to re-solve the problem every cycle instead of looking up a stored gain. The ascent guidance module picks up from here and builds that explicit scheme in full.
:::

## Check yourself

::: check
A vehicle feels a steady disturbance acceleration $a_d = 0.2\,\mathrm{m/s^2}$ for $T = 12\,\mathrm{s}$ under pure open-loop guidance, starting with no sideways motion. How far does it drift?
:::

::: answer
Nothing corrects it, so $\ddot{y} = a_d$ from rest, and

$$
y(T) = \tfrac12 a_d T^2 = \tfrac12 \times 0.2 \times 12^2 = 14.4\,\mathrm{m}.
$$

Nothing in an open-loop law senses this drift or shrinks it. The number is the vehicle's free response to the disturbance over the whole time it acts.
:::

::: check
The same disturbance is instead corrected by a proportional-only closed loop, $u = -k_p\, y$, with $k_p = 0.16\,\mathrm{s^{-2}}$. Where does the offset settle? Why does that settled value depend only on $a_d$ and $k_p$, and not on how long the disturbance has been acting?
:::

::: answer
When it has settled, $\ddot{y} = \dot{y} = 0$, so $0 = a_d - k_p\, y_{ss}$. That gives

$$
y_{ss} = \frac{a_d}{k_p} = \frac{0.2}{0.16} = 1.25\,\mathrm{m}.
$$

It depends only on $a_d$ and $k_p$ because it is a balance point: the feedback's push back exactly equals the disturbance's push. Once reached, a balance point does not remember the path that led there or how long it has lasted. Only the two things holding it in balance matter.
:::

::: check
Why can reference-trajectory following use the control tier's ordinary stability and margin tools, while explicit guidance generally cannot be checked the same way?
:::

::: answer
Linearized about $\mathbf{x}^\star(t)$, reference-trajectory following is literally a feedback control problem: drive the deviation $\delta\mathbf{x} = \mathbf{x} - \mathbf{x}^\star(t)$ to zero. So every tool the control tier built for a regulator's stability and margins — root locus, gain and phase margins, Lyapunov arguments, LQR's guaranteed margins — applies directly, evaluated along the one fixed, known reference.

Explicit guidance is not correcting toward a fixed path. It recomputes a new answer to a boundary value problem from whatever state it is in. There is no single operating point to measure margins around. The law has to be shown to behave well across the whole region of states it might meet. That is a harder, less standard kind of analysis than reading off a gain and phase margin at one point.
:::

::: check
A chaser at $\mathbf{r} = (-500,\ 0,\ 0)\,\mathrm{m}$ moving at $\mathbf{v} = (0.5,\ 0,\ 0)\,\mathrm{m/s}$, with $t_{go} = 600\,\mathrm{s}$ left, is retargeted from aimpoint $(0,\ 0,\ 0)$ to $(0,\ 5,\ 0)\,\mathrm{m}$. By how much does the required-velocity command change?
:::

::: answer
Write $\Delta\mathbf{v}_{req} = (\mathbf{r}_{aim} - \mathbf{r})/t_{go} - \mathbf{v}$ for each aimpoint and subtract. The $\mathbf{r}$ and $\mathbf{v}$ terms are the same in both, so they cancel. What is left is

$$
\frac{\mathbf{r}_{aim,new} - \mathbf{r}_{aim,old}}{t_{go}} = \frac{(0,\ 5,\ 0)}{600} = (0,\ 0.00833,\ 0)\,\mathrm{m/s}.
$$

An $8.3$ millimeter-per-second sideways correction retargets five meters. It is applied on the very next cycle with no special logic, because the law never computed anything specific to the old aimpoint.
:::

::: check
Open-loop guidance handled the crosswind example badly. So why is it still the right choice for part of a rocket's climb?
:::

::: answer
In the thick lower atmosphere, an active closed loop brings its own risk. Reacting to a gust by steering can raise the angle between the rocket and the oncoming air right when dynamic pressure is highest and the structure's load margin is thinnest. That can be worse than the drift an open-loop schedule leaves uncorrected.

The crosswind example shows what open-loop guidance costs in accuracy. It does not show that it is a mistake. The choice is a deliberate trade: give up accuracy in exchange for a guarantee that guidance will not itself command a dangerous load in the one phase where that risk is least affordable. The drift gets fixed later, by closed-loop guidance in thin air. The gravity-turn lesson later in this module shows exactly why the pitch program is flown this way.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Open-loop guidance | Command fixed in advance; no feedback | $\mathbf{u}(t)$; disturbances go uncorrected ($y = \tfrac12 a_d T^2$) |
| Closed-loop guidance | Command computed from the state estimate | $\mathbf{u}(\hat{\mathbf{x}}(t))$; $100\,\mathrm{m} \to 2\,\mathrm{m}$ in the crosswind example |
| PD gains from $\omega_n$, $\zeta$ | Match $\ddot{y} + k_d\dot{y} + k_p y$ to the standard form | $k_p = \omega_n^2$, $k_d = 2\zeta\omega_n$ |
| Steady-state offset | Where a steady push settles under proportional feedback | $y_{ss} = a_d/k_p$ |
| Reference-trajectory following | Correct toward a precomputed path | $\mathbf{u} = \mathbf{u}^\star(t) + \mathbf{K}(t)(\mathbf{x}^\star(t) - \hat{\mathbf{x}})$; cheap, known margins, brittle to large dispersion |
| Explicit guidance | Re-solve the remaining problem from $\hat{\mathbf{x}}(t)$ every cycle | Retargets automatically; PEG, convex powered descent |
| Required-velocity targeting | The simplest explicit law | $\Delta\mathbf{v}_{req} = (\mathbf{r}_{aim} - \mathbf{r})/t_{go} - \mathbf{v}$ |

Almost everything else in this module is closed-loop, explicit guidance. The next lesson starts with the oldest and simplest ideas of that kind: steering by the line of sight to the target.

::: context pitch-program Tipping over on a timer
A rocket lifts off straight up to clear the tower. Then it has to tip over toward the horizon, because orbit is mostly about going sideways fast. The pitch program is a table of "at this many seconds, tilt this many degrees" loaded before launch.

In the thick air it is flown as written. On launch day, engineers may pick or adjust the table using the measured winds aloft, but once the rocket leaves the pad the table does not change. A later lesson on the gravity turn shows how a small, early tilt lets gravity do most of the turning.
:::

::: context max-q The moment the air pushes hardest
**Dynamic pressure**, written $q$, measures how hard the oncoming air presses on the vehicle: $q = \tfrac12 \rho v^2$, where $\rho$ is air density and $v$ is speed. Right after liftoff the rocket is slow, so $q$ is small. High up, the air is thin, so $q$ is small again. In between is a peak, called **max-Q** — for many rockets about a minute after liftoff, around $10$ to $14\,\mathrm{km}$ up.

At max-Q, even a few degrees of angle between the rocket and the airflow can put large bending loads on the structure. That is why nobody wants guidance steering hard there.
:::

::: context x-hat Why the little hat
In estimation, a hat over a letter means "our estimate of it". $\mathbf{x}$ is the true state, which nobody can know exactly. $\hat{\mathbf{x}}$ is the navigation system's best guess, built from noisy sensors.

Guidance only ever sees $\hat{\mathbf{x}}$. Writing the hat is a reminder that the command is only as good as the estimate. If navigation is off by a meter, a perfect guidance law steers perfectly to the wrong place.
:::

::: context feedback The same wind, with and without eyes
Feedback is any loop where the output is measured and used to change the input: a thermostat, cruise control, your hand steadying the cup. The picture plots the crosswind example to scale. Open-loop, the drift grows as a parabola to $100\,\mathrm{m}$ in $20\,\mathrm{s}$. With feedback, it never gets past about $2\,\mathrm{m}$ — on this scale, barely off the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,150.0 47.2,149.9 54.5,149.7 61.8,149.3 69.0,148.8 76.2,148.1 83.5,147.3 90.8,146.3 98.0,145.2 105.2,143.9 112.5,142.5 119.8,140.9 127.0,139.2 134.2,137.3 141.5,135.3 148.8,133.1 156.0,130.8 163.2,128.3 170.5,125.7 177.8,122.9 185.0,120.0 192.2,116.9 199.5,113.7 206.8,110.3 214.0,106.8 221.2,103.1 228.5,99.3 235.8,95.3 243.0,91.2 250.2,86.9 257.5,82.5 264.8,77.9 272.0,73.2 279.2,68.3 286.5,63.3 293.8,58.1 301.0,52.8 308.2,47.3 315.5,41.7 322.8,35.9 330.0,30.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,150.0 47.2,149.9 54.5,149.8 61.8,149.5 69.0,149.3 76.2,149.0 83.5,148.7 90.8,148.5 98.0,148.3 105.2,148.1 112.5,147.9 119.8,147.8 127.0,147.7 134.2,147.6 141.5,147.6 148.8,147.5 156.0,147.5 163.2,147.5 170.5,147.5 177.8,147.5 185.0,147.5 192.2,147.5 199.5,147.5 206.8,147.5 214.0,147.6 221.2,147.6 228.5,147.6 235.8,147.6 243.0,147.6 250.2,147.6 257.5,147.6 264.8,147.6 272.0,147.6 279.2,147.6 286.5,147.6 293.8,147.6 301.0,147.6 308.2,147.6 315.5,147.6 322.8,147.6 330.0,147.6"/>
  <text x="250" y="70" font-size="11" fill="#b4232c" text-anchor="end">open-loop: 100 m</text>
  <text x="330" y="140" font-size="11" fill="#1d6fd1" text-anchor="end">closed-loop: about 2 m</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="34" font-size="11" fill="#1f2a44" text-anchor="end">100</text>
  <text x="40" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="185" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="330" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">20 s</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">sideways drift y, m</text>
</svg>
```
:::

::: context wn-zeta Two dials for a spring
Any motion like $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \text{push}$ behaves like a mass on a spring with a damper. The **natural frequency** $\omega_n$ sets how fast it responds. The **damping ratio** $\zeta$ sets how much it overshoots: $\zeta = 1$ means no overshoot; $\zeta = 0.7$ allows a small one.

The picture is the crosswind example with feedback, zoomed in. The offset rises, overshoots slightly to about $2.09\,\mathrm{m}$ near $8.8\,\mathrm{s}$, then settles toward $2.0\,\mathrm{m}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="50" x2="330" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,150.0 43.6,149.3 47.2,147.2 50.9,144.1 54.5,140.2 58.1,135.6 61.8,130.5 65.4,125.0 69.0,119.4 72.6,113.7 76.2,108.0 79.9,102.3 83.5,96.9 87.1,91.6 90.8,86.6 94.4,81.9 98.0,77.4 101.6,73.3 105.2,69.5 108.9,66.1 112.5,62.9 116.1,60.1 119.8,57.6 123.4,55.4 127.0,53.5 130.6,51.8 134.2,50.4 137.9,49.2 141.5,48.2 145.1,47.3 148.8,46.7 152.4,46.2 156.0,45.8 159.6,45.6 163.2,45.5 166.9,45.4 170.5,45.4 174.1,45.5 177.8,45.6 181.4,45.8 185.0,46.0 188.6,46.3 192.2,46.5 195.9,46.8 199.5,47.0 203.1,47.3 206.8,47.5 210.4,47.8 214.0,48.0 217.6,48.3 221.2,48.5 224.9,48.7 228.5,48.9 232.1,49.1 235.8,49.2 239.4,49.4 243.0,49.5 246.6,49.6 250.2,49.7 253.9,49.8 257.5,49.9 261.1,50.0 264.8,50.0 268.4,50.1 272.0,50.1 275.6,50.1 279.2,50.2 282.9,50.2 286.5,50.2 290.1,50.2 293.8,50.2 297.4,50.2 301.0,50.2 304.6,50.2 308.2,50.2 311.9,50.2 315.5,50.2 319.1,50.2 322.8,50.2 326.4,50.1 330.0,50.1"/>
  <circle cx="167.6" cy="45.4" r="3" fill="#b4232c"/>
  <text x="167.6" y="36" font-size="11" fill="#b4232c" text-anchor="middle">2.09 m at 8.8 s</text>
  <text x="300" y="44" font-size="11" fill="#6c7a93" text-anchor="middle">2.0 m</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="54" font-size="11" fill="#1f2a44" text-anchor="end">2</text>
  <text x="40" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="185" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <text x="330" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">20 s</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">offset y, m</text>
</svg>
```
:::

::: context lqr The regulator with a built-in trade-off
LQR stands for **linear-quadratic regulator**. You give it a linear model and a cost that adds up squared deviation and squared control effort, weighted by how much you care about each. It returns the gain $\mathbf{K}$ that makes that total cost as small as possible.

For reference following, the model is the linearized motion around the planned path, so the gain changes along the path: $\mathbf{K}(t)$. It can be computed on the ground and stored as a table, which is why the flight computer's job stays cheap.
:::

::: context dispersion When the real flight differs from the plan
A **dispersion** is how far the real flight ends up from the nominal plan. Engines push a little more or less than rated, the wind differs from the forecast, the vehicle weighs slightly more than planned.

Engineers study dispersions with **Monte Carlo** runs: thousands of simulated flights, each with randomly chosen errors, to see how far off the vehicle can end up. A guidance law is judged by how well it handles the whole spread, not just the one perfect flight. Big dispersions are where reference following struggles and explicit guidance earns its cost.
:::

::: context bvp Fixed at both ends
Most physics problems you have met are **initial value problems**: you know where something starts and how it moves, so you work out where it goes. A **boundary value problem** fixes both ends instead: start *here*, finish *there*, now find the motion in between.

Guidance is naturally a boundary value problem, because the mission fixes the finish. The picture shows the retargeting example. The stored path (dashed) ends at port A. Reference following keeps heading there. Explicit guidance re-solves from the current state and heads for port B.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="bv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <line x1="40" y1="110" x2="310" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <circle cx="40" cy="110" r="5" fill="#1f2a44"/>
  <text x="40" y="132" font-size="11" fill="#1f2a44" text-anchor="middle">chaser now</text>
  <line x1="45" y1="104" x2="300" y2="110" stroke="#1d6fd1" stroke-width="2" marker-end="url(#bv)"/>
  <line x1="45" y1="100" x2="300" y2="52" stroke="#b4232c" stroke-width="2" marker-end="url(#bv)"/>
  <rect x="306" y="102" width="16" height="16" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="132" font-size="11" fill="#1f2a44" text-anchor="middle">port A</text>
  <rect x="306" y="42" width="16" height="16" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="330" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">port B</text>
  <text x="170" y="128" font-size="11" fill="#1d6fd1" text-anchor="middle">reference following: still to A</text>
  <text x="150" y="62" font-size="11" fill="#b4232c" text-anchor="middle">explicit: re-solved to B</text>
  <text x="200" y="150" font-size="11" fill="#6c7a93" text-anchor="middle">dashed: stored path, planned for A</text>
</svg>
```
:::

::: context peg The Shuttle's way to orbit
**Powered Explicit Guidance**, or PEG, was developed for the Space Shuttle. Every couple of seconds during powered flight it re-solved, from the current state, the steering and burn time needed to reach the target orbit, using a steering law in closed form.

Descendants of it still guide rockets today. You will build it yourself in the ascent guidance module, starting from the optimal steering law it rests on.
:::
