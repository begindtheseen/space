---
id: l02-open-loop-vs-closed-loop-guidance
title: Open-loop, reference-following and explicit guidance
minutes: 20
covers:
  - Open-loop vs closed-loop guidance; reference-trajectory following vs explicit guidance
---

Guidance laws split along two independent axes, and conflating them is the single most common source of confused thinking about how a real vehicle is guided. The first axis is whether the law uses feedback at all: open-loop guidance commands a predetermined sequence regardless of what the vehicle actually does, while closed-loop guidance commands from the current state estimate. The second axis applies only within closed-loop guidance, and asks what that command is computed *against*: reference-trajectory following measures a deviation from a path computed in advance and drives the deviation to zero, while explicit guidance keeps no stored path at all and instead re-solves, from the current state, exactly what remains to be done.

A single ascent shows all three. In dense atmosphere, where a wrong angle of attack for even a second can overload the airframe, the vehicle typically flies an open-loop pitch program — a pitch-versus-time schedule chosen before liftoff and executed blind to the vehicle's actual position. Once the dynamic pressure has dropped enough that closing a guidance loop is safe, older systems tracked a precomputed reference trajectory and nulled the deviation from it; modern systems instead run explicit guidance, recomputing the exact steering needed to reach the target orbit from wherever the vehicle actually is. The same three choices show up in a chaser's approach to a target for docking and in a lander's descent, which is why this lesson works them out once, in general, before the rest of the module builds specific guidance laws on top.

## Open-loop guidance

Open-loop guidance commands $\mathbf{u}(t)$ as a function of time alone, fixed before the maneuver begins and never revisited against the vehicle's actual state during it. It needs no navigation input during execution — which is exactly its appeal in a regime where a closed loop could do active harm, such as steering hard into a gust near maximum dynamic pressure — and exactly its limitation everywhere else: any disturbance the schedule did not anticipate goes entirely uncorrected, because nothing in the law is looking at the vehicle to notice.

::: example A crosswind under open-loop guidance
Take a vehicle flying a nominal path with zero commanded lateral acceleration, hit by a crosswind-induced lateral disturbance $a_d = 0.5\,\mathrm{m/s^2}$ that the open-loop schedule has no way to sense or respond to, for $T = 20\,\mathrm{s}$. With $\ddot{y} = a_d$ and zero initial lateral position and rate,

$$
y(T) = \tfrac12 a_d T^2 = \tfrac12 (0.5)(20)^2 = 100.0\,\mathrm{m}, \qquad \dot{y}(T) = a_d T = 0.5 \times 20 = 10.0\,\mathrm{m/s}.
$$

One hundred metres of lateral drift and ten metres per second of lateral rate, from a disturbance the law never had a chance to see — not because open-loop guidance is a poor design, but because it is not designed to do this job. It is designed for the regime where closing a loop is the greater risk, and the fix for a disturbance like this one is not a smarter open-loop schedule; it is feedback.
:::

## Closed-loop guidance

Closed-loop guidance commands $\mathbf{u}$ as a function of the current state estimate $\hat{\mathbf{x}}(t)$, so a disturbance the vehicle actually experiences shows up in the state and gets corrected. Continue the same disturbance with a simple proportional–derivative trim, $u = -k_p y - k_d \dot y$, added to the same nominal path:

::: example The same crosswind, closed-loop
With $\ddot y = a_d + u = a_d - k_p y - k_d \dot y$, choose gains from a target natural frequency and damping ratio, $\omega_n = 0.5\,\mathrm{rad/s}$, $\zeta = 0.7$: $k_p = \omega_n^2 = 0.25\,\mathrm{s^{-2}}$, $k_d = 2\zeta\omega_n = 0.70\,\mathrm{s^{-1}}$. Integrating the same $20\,\mathrm{s}$ numerically,

```python
from scipy.integrate import solve_ivp

a_d, kp, kd = 0.5, 0.25, 0.70

def rhs(t, s):
    y, ydot = s
    return [ydot, a_d - kp * y - kd * ydot]

sol = solve_ivp(rhs, [0, 20], [0.0, 0.0], max_step=0.01, rtol=1e-10, atol=1e-12)
print(sol.y[0, -1], sol.y[1, -1])
# 1.9974479... 0.0009749...
```

gives $y(T) = 1.997\,\mathrm{m}$, essentially the closed-loop steady-state offset $a_d/k_p = 0.5/0.25 = 2.000\,\mathrm{m}$ that a constant disturbance settles a proportional loop to — a fiftyfold reduction from the open-loop $100\,\mathrm{m}$, from nothing more than looking at the state and reacting to it. This is the entire case for feedback in one number.
:::

That fiftyfold reduction is bought by measuring the state and reacting to it — closing the loop is what makes it possible, whatever the loop then does with the measurement. What it does with the measurement is the second axis.

## Reference-trajectory following

Reference-trajectory following precomputes a nominal state history $\mathbf{x}^\star(t)$ offline — from the optimal control module's machinery, from an explicit trajectory-optimization run, or from an analytically chosen profile — and, in flight, feeds back only the deviation from it:

$$
\mathbf{u}(t) = \mathbf{u}^\star(t) + \mathbf{K}(t)\big(\mathbf{x}^\star(t) - \hat{\mathbf{x}}(t)\big).
$$

$\mathbf{K}(t)$ is frequently exactly the time-varying LQR gain the optimal control module built around a nominal trajectory: linearize the dynamics about $\mathbf{x}^\star(t)$, and the deviation-nulling problem becomes an ordinary linear-quadratic regulator problem with all the margin and tuning guidance that module derived. This is precisely the closed-loop example above, generalized from "the nominal path is zero" to "the nominal path is some precomputed $\mathbf{x}^\star(t)$."

The appeal is that the hard work — finding a good, feasible, efficient trajectory — happens once, offline, with all the time and computation in the world, and the reference is then inspected and verified before it ever flies. What flies is a small linear feedback around a known-good path, and the closed-loop stability and margin analysis the control tier built applies directly to it.

The weakness is exactly that dependence on the path staying relevant. $\mathbf{x}^\star(t)$ was computed for one specific set of boundary conditions, and the deviation-nulling law has no mechanism to notice that those boundary conditions have changed — it keeps driving toward the old $\mathbf{x}^\star(t_f)$ because that is the only target it has ever been given. A dispersion small enough that the linearization around $\mathbf{x}^\star(t)$ still holds gets corrected well. A dispersion that invalidates the reference itself — an engine-out that changes the achievable trajectory shape, or a retargeted aimpoint — is not corrected at all; it needs a new reference, computed and validated before it can be flown, which is rarely possible in the time available.

## Explicit guidance

Explicit guidance keeps no stored trajectory. Each cycle, it takes the current state and the terminal objective and directly computes what remains to be done — re-solving the boundary value problem from scratch rather than tracking a deviation from a precomputed answer to it. The simplest version of this idea is required-velocity targeting: given the current position $\mathbf{r}$, the aimpoint $\mathbf{r}_{aim}$, and the time remaining $t_{go}$,

$$
\Delta\mathbf{v}_{req} = \frac{\mathbf{r}_{aim} - \mathbf{r}}{t_{go}} - \mathbf{v}
$$

is the velocity change that gets the vehicle from where it is, coasting, to the aimpoint exactly at $t_{go}$. It uses nothing but the current state and the target — no stored path — and if the aimpoint changes, the very next evaluation reflects the change automatically.

::: example Retargeting mid-approach
A chaser at $\mathbf{r} = (-1200,\ 300,\ 0)\,\mathrm{m}$ relative to a target, moving at $\mathbf{v} = (0.8,\ -0.05,\ 0)\,\mathrm{m/s}$, was aiming at port A, $\mathbf{r}_{aim,old} = (0,0,0)$, with $t_{go} = 1500\,\mathrm{s}$ remaining. Mission control reassigns it to port B, $\mathbf{r}_{aim,new} = (0,\ 12,\ 0)\,\mathrm{m}$.

```python
import numpy as np
r = np.array([-1200.0, 300.0, 0.0]); v = np.array([0.8, -0.05, 0.0]); t_go = 1500.0
r_old = np.array([0.0, 0.0, 0.0]); r_new = np.array([0.0, 12.0, 0.0])
v_req_old = (r_old - r) / t_go
v_req_new = (r_new - r) / t_go
print(v_req_new - v_req_old)
# [0.    0.008 0.   ]
```

Explicit guidance's required velocity changes by only $(0,\ 0.008,\ 0)\,\mathrm{m/s}$ — a trivial correction, applied on the very next cycle, because the law was never computing anything about port A specifically; it was always computing "the velocity that gets me from here to the current aimpoint," and the aimpoint is just an input. Reference-trajectory following has no such input: a deviation-nulling law built around a path ending at port A keeps driving toward port A. Left unreplanned, it misses the reassignment by the full $\lVert\mathbf{r}_{aim,new} - \mathbf{r}_{aim,old}\rVert = 12.0\,\mathrm{m}$ — not because the feedback is weak, but because it is nulling a deviation from the wrong thing entirely.
:::

That responsiveness is not free. Required-velocity targeting is the simplest possible explicit law, valid only for unpowered coasting between two points in a straight line; a real terminal guidance law has to solve the remaining boundary value problem under the vehicle's actual dynamics — gravity, thrust limits, a maneuvering target — every single cycle, in whatever time the guidance loop rate allows. That is only practical when the remaining problem has a closed-form or fast-converging solution, which is exactly why so much of this module is the derivation of such solutions: proportional navigation is the closed form for driving an intercept's miss to zero, zero-effort-miss and zero-effort-velocity guidance are the closed form for a soft landing, and Powered Explicit Guidance, built in the ascent guidance module on top of this one, is the closed form for reaching a target orbit. Explicit guidance also forfeits the offline-verified-path property: what actually flies is a different realized trajectory on every flight, generated online, so certifying it means certifying the *law* across the whole space of states it might see rather than inspecting one fixed path.

::: key Two axes, not one
Open-loop vs. closed-loop asks whether the command depends on the current state at all. Reference-trajectory following vs. explicit guidance asks, given that it does, what it is computed against: a precomputed path (cheap, well-understood margins, but only as good as the reference) or a fresh solution of the remaining problem from the current state (adapts to dispersion and retargeting automatically, at the cost of solving a boundary value problem every cycle). A pitch program is open-loop. A perturbation-guidance ascent tracking a stored profile is closed-loop reference-following. Proportional navigation, zero-effort-miss/velocity guidance, and Powered Explicit Guidance are all closed-loop and explicit.
:::

::: warning "Closed-loop" does not mean "explicit"
Reference-trajectory following is closed-loop — it uses the state estimate every cycle — and it is still not explicit, because what it does with that estimate is null a deviation from a fixed precomputed path rather than re-derive the path itself. The two axes are genuinely independent: it is entirely possible to build a closed-loop law that handles large dispersions badly, and equally possible, though rarer, to build an explicit law around a badly chosen terminal objective. Ask both questions separately — does it use feedback, and what does it use the feedback for — before concluding a guidance law is robust to whatever your mission will actually throw at it.
:::

::: note Explicit guidance costs computation you have to have
None of this was free even conceptually available before onboard computers could solve a boundary value problem every guidance cycle. Early ascent guidance was open-loop through the atmosphere and reference-following above it for exactly that reason; explicit schemes became standard only once flight computers could afford to re-solve the remaining problem every cycle rather than look up a stored gain. The ascent guidance module picks up from here and builds that explicit scheme — Powered Explicit Guidance and its descendants — in full.
:::

## Check yourself

::: check
A vehicle experiences a constant disturbance acceleration $a_d = 0.2\,\mathrm{m/s^2}$ for $T = 12\,\mathrm{s}$ under pure open-loop guidance. How far has it drifted?
:::

::: answer
With no correction, $\ddot y = a_d$ from rest, so $y(T) = \tfrac12 a_d T^2 = \tfrac12 (0.2)(12)^2 = 14.4\,\mathrm{m}$. Nothing in an open-loop law senses this drift or reduces it — the number is simply the free response of the vehicle to the disturbance over the time it acts.
:::

::: check
The same disturbance is instead corrected by a proportional-only closed loop, $u = -k_p y$, with $k_p = 0.16\,\mathrm{s^{-2}}$. What does the deviation settle to, and why does that steady value depend only on $a_d$ and $k_p$ and not on how long the disturbance has been acting?
:::

::: answer
At steady state $\ddot y = \dot y = 0$, so $0 = a_d - k_p y_{ss}$, giving $y_{ss} = a_d/k_p = 0.2/0.16 = 1.25\,\mathrm{m}$. It depends only on $a_d$ and $k_p$ because it is an equilibrium condition — the point where the feedback's restoring "force" exactly balances the disturbance — and an equilibrium, once reached, no longer depends on the transient that got there or on how long it has persisted, only on the two things holding it in balance.
:::

::: check
Explain why reference-trajectory following can use the same closed-loop stability and margin analysis the control tier built for ordinary feedback control, while explicit guidance generally cannot be analyzed the same way.
:::

::: answer
Reference-trajectory following is, once linearized about $\mathbf{x}^\star(t)$, literally a feedback control problem — regulate a deviation $\delta\mathbf{x} = \mathbf{x} - \mathbf{x}^\star(t)$ to zero — so every tool the control tier built for analyzing a regulator's stability and margins (root locus, the four margins, Lyapunov arguments, LQR's own guaranteed margins) applies to it directly, evaluated along the one fixed, known reference. Explicit guidance is not regulating a deviation from a fixed path at all; it is recomputing a new answer to a boundary value problem from whatever state it happens to be in, so there is no single linearization point to analyze margins around — the law has to be shown well-behaved across the entire region of states it might see, which is a harder and less standardized kind of analysis than evaluating gain and phase margin at one operating point.
:::

::: check
A chaser at $\mathbf{r} = (-500,\ 0,\ 0)\,\mathrm{m}$, $\mathbf{v} = (0.5,\ 0,\ 0)\,\mathrm{m/s}$, with $t_{go} = 600\,\mathrm{s}$, is retargeted from aimpoint $(0,0,0)$ to $(0,\ 5,\ 0)\,\mathrm{m}$. By how much does the required-velocity command change?
:::

::: answer
$\Delta\mathbf{v}_{req} = (\mathbf{r}_{aim}-\mathbf{r})/t_{go} - \mathbf{v}$ for each aimpoint; the $\mathbf{v}$ and $\mathbf{r}$ terms are common to both and cancel in the difference, leaving $(\mathbf{r}_{aim,new}-\mathbf{r}_{aim,old})/t_{go} = (0,\ 5,\ 0)/600 = (0,\ 0.00833,\ 0)\,\mathrm{m/s}$ — an eight-millimetre-per-second lateral correction to retarget five metres, applied on the very next cycle with no special-case logic, because the law was never computing anything specific to the old aimpoint.
:::

::: check
Why is open-loop guidance still the right choice for part of an ascent, given how badly it handled the crosswind example above?
:::

::: answer
Because in dense atmosphere the risk an active closed loop introduces — reacting to a gust or a transient by pitching into a higher angle of attack, right when dynamic pressure is highest and the airframe's load margin is thinnest — can be worse than the drift an open-loop schedule leaves uncorrected. The crosswind example shows what open-loop guidance costs in accuracy, not that it is a mistake; the choice is a deliberate trade of accuracy for the guarantee that guidance will not itself command a structurally dangerous response during the one flight phase where that risk is least affordable. The gravity-turn lesson later in this module derives exactly why the pitch program is flown this way.
:::

## Summary

| Concept | Statement |
| --- | --- |
| Open-loop guidance | $\mathbf{u}(t)$ fixed in advance; no feedback; disturbances go uncorrected |
| Closed-loop guidance | $\mathbf{u}(\hat{\mathbf{x}}(t))$; feedback reduces disturbance response ($100\,\mathrm{m} \to 2\,\mathrm{m}$ in the worked example) |
| Reference-trajectory following | $\mathbf{u} = \mathbf{u}^\star(t) + \mathbf{K}(t)(\mathbf{x}^\star(t)-\hat{\mathbf{x}})$; cheap, well-understood margins, brittle to large dispersion |
| Explicit guidance | Re-solve the remaining boundary value problem from $\hat{\mathbf{x}}(t)$ every cycle; adapts to dispersion and retargeting automatically |
| Required-velocity targeting | $\Delta\mathbf{v}_{req} = (\mathbf{r}_{aim}-\mathbf{r})/t_{go} - \mathbf{v}$, the simplest explicit law |
| Steady-state deviation under proportional feedback | $y_{ss} = a_d/k_p$ |

The rest of this module is almost entirely explicit, closed-loop guidance laws — the next lesson starts with the oldest and simplest of them, steering by the line of sight to the target directly.
