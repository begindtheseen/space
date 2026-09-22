---
id: l08-zem-zev-guidance
title: Zero-effort-miss and zero-effort-velocity guidance
minutes: 23
covers:
  - Zero-effort-miss and zero-effort-velocity guidance; the ZEM/ZEV feedback law for landing
---

A soft landing asks for something proportional navigation never had to deliver: arriving not merely *at* the target but *at rest* there. A lander that reaches zero altitude at forty metres per second has not landed; it has crashed precisely on target. This lesson derives the guidance law built for exactly that harder requirement — both terminal position and terminal velocity pinned — and the two quantities, zero-effort miss and zero-effort velocity, that make the law as easy to compute in flight as proportional navigation's line-of-sight rate was.

The name answers the question the law is built around: if I stopped commanding thrust *right now* and simply coasted under gravity alone for the time remaining, where would I end up, and how fast would I be going? Those two predictions — the zero-effort miss and the zero-effort velocity — are cheap to compute from the current state alone, and the feedback law this lesson derives is nothing more than the minimum-energy correction that drives both of them to zero by touchdown.

## Zero-effort miss and zero-effort velocity, defined

Propagate the *uncontrolled* dynamics — thrust off, gravity only — from the current state $(\mathbf{r},\mathbf{v})$ forward by the remaining time $t_{go}$:

$$
\mathbf{r}_{coast} = \mathbf{r} + \mathbf{v}\,t_{go} + \tfrac12\mathbf{g}\,t_{go}^2, \qquad \mathbf{v}_{coast} = \mathbf{v} + \mathbf{g}\,t_{go}.
$$

The **zero-effort miss** and **zero-effort velocity** are how far those coast predictions fall short of the target state $(\mathbf{r}_f,\mathbf{v}_f)$:

$$
ZEM = \mathbf{r}_f - \mathbf{r}_{coast} = \mathbf{r}_f - \big(\mathbf{r}+\mathbf{v}t_{go}+\tfrac12\mathbf{g}t_{go}^2\big), \qquad ZEV = \mathbf{v}_f - \mathbf{v}_{coast} = \mathbf{v}_f - \big(\mathbf{v}+\mathbf{g}t_{go}\big).
$$

Both are computed from the current state alone — no stored reference trajectory, exactly the explicit-guidance pattern from earlier in this module — and both vanish exactly when the vehicle is already, unpowered, on a trajectory that lands it softly on time: a direct, checkable statement of "no further effort is required."

The closed form above is specific to constant gravity, but the *principle* is not: $\mathbf{r}_{coast},\mathbf{v}_{coast}$ are nothing but the state that propagating the true uncontrolled dynamics — whatever they are — produces after $t_{go}$. With drag, a varying gravity field, or any other force the vehicle cannot simply switch off, the same definitions still make sense; only the closed form changes to a numerical propagation. That is why zero-effort miss and velocity, not a fixed formula, are the quantities every powered-descent guidance implementation actually carries forward — the formula above is the special case dense enough to derive a feedback law from in closed form.

## The feedback law, derived

Pose the same minimum-energy problem two lessons derived a piece of already, now with *both* terminal conditions pinned: minimize $\tfrac12\int_0^{t_{go}} u^2\,d\tau$ subject to $x_1(t_{go}) = r_f$ **and** $x_2(t_{go}) = v_f$, with $\dot x_1 = x_2$, $\dot x_2 = g + u$ (one axis; gravity and thrust acceleration both act directly on the velocity state). Both terminal states are now fixed rather than one being free, so transversality no longer pins $\lambda_2(t_{go})=0$ the way it did for proportional navigation — instead, both $\lambda_1(t_{go})$ and $\lambda_2(t_{go})$ are determined by the two terminal equations themselves, a genuine two-point boundary value problem.

The Hamiltonian and costate equations are unchanged in form — $u^\star(\tau) = -\lambda_2(\tau)$, $\lambda_1 = c_1$ constant, $\lambda_2(\tau) = A - c_1\tau$ for constants $A, c_1$ fixed by the two boundary conditions instead of one. Writing $T = t_{go}$ for brevity and integrating the dynamics forward, the two terminal equations $x_2(T)=v_f$ and $x_1(T)=r_f$ become two linear equations in $A$ and $c_1$. Solving them (the algebra is mechanical, not shown here) gives

$$
c_1 = -\frac{12}{T^3}\left(ZEM - \frac{T\cdot ZEV}{2}\right), \qquad A = -\frac{6}{T^2}ZEM+\frac{2}{T}ZEV,
$$

and the command at the current instant, $u^\star(0) = -A$, is

$$
u^\star(0) = \frac{6}{T^2}\,ZEM - \frac{2}{T}\,ZEV .
$$

::: key The ZEM/ZEV feedback law
$$
\mathbf{a} = \frac{6}{t_{go}^2}\,ZEM - \frac{2}{t_{go}}\,ZEV .
$$
The minimum-energy solution for a double integrator with both terminal position and velocity constrained. $\mathbf{a}$ is the total thrust acceleration to command right now — it already accounts for gravity, because $ZEM$ and $ZEV$ were built by coasting under the true gravity, not by ignoring it.
:::

::: example A coasting trajectory that already lands needs no command
$\mathbf{g} = (0,0,-1.62)\,\mathrm{m/s^2}$ (lunar gravity), $\mathbf{r} = (0,0,1000)\,\mathrm{m}$, $\mathbf{v} = (5,0,0)\,\mathrm{m/s}$, $t_{go} = 20\,\mathrm{s}$. Set the target state to exactly what unpowered coasting would produce:

```python
import numpy as np
g = np.array([0.0, 0.0, -1.62])
r = np.array([0.0, 0.0, 1000.0]); v = np.array([5.0, 0.0, 0.0]); tgo = 20.0
r_f = r + v*tgo + 0.5*g*tgo**2
v_f = v + g*tgo
zem = r_f - (r + v*tgo + 0.5*g*tgo**2)
zev = v_f - (v + g*tgo)
print(zem, zev, (6/tgo**2)*zem - (2/tgo)*zev)
# [0. 0. 0.]  [0. 0. 0.]  [0. 0. 0.]
```

Exactly zero, to the last floating-point digit — a direct check that the law commands nothing whenever nothing is needed, the same reassurance the collision-course principle gave proportional navigation.
:::

## Flying it: two landings

::: example A lunar descent, flown to touchdown
Downrange offset and altitude $\mathbf{r}_0 = (300,\ 1500)\,\mathrm{m}$, velocity $\mathbf{v}_0 = (-8,\ -40)\,\mathrm{m/s}$, target $\mathbf{r}_f=\mathbf{v}_f=(0,0)$, $t_{go}=45\,\mathrm{s}$, $\mathbf{g}=(0,-1.62)\,\mathrm{m/s^2}$. At this instant,

$$
ZEM = (60.0,\ 1940.25)\,\mathrm{m}, \qquad ZEV = (8.0,\ 112.9)\,\mathrm{m/s}, \qquad \mathbf{a} = (-0.178,\ 0.731)\,\mathrm{m/s^2},
$$

a modest total thrust acceleration this early, with $45\,\mathrm{s}$ still to correct. Flying the law in closed loop — recomputing $ZEM$, $ZEV$ and $\mathbf{a}$ from the current state every step, exactly as real powered-descent guidance does — to touchdown:

```python
# closed-loop integration, ZEM/ZEV recomputed every step, tgo counting down to 0
print(final_position_error, final_velocity_error, peak_accel)
# 1.263e-18 m   5.126e-11 m/s   4.318 m/s^2 (peak, reached late in the descent)
```

Touchdown lands within $10^{-18}\,\mathrm{m}$ and $10^{-11}\,\mathrm{m/s}$ of dead-on — floating-point precision, not merely "close" — confirming the closed-loop law does exactly what the open-loop derivation promised. The commanded acceleration grows from $0.75\,\mathrm{m/s^2}$ magnitude at the start to a peak of $4.32\,\mathrm{m/s^2}$ later in the descent, as $t_{go}$ shrinks and the $6/t_{go}^2$ and $2/t_{go}$ gains both grow — the braking burn a real lunar landing is recognizably built from.
:::

::: example A Mars descent, same law, different gravity
$\mathbf{r}_0 = (650,\ 2200)\,\mathrm{m}$, $\mathbf{v}_0 = (-15,\ -60)\,\mathrm{m/s}$, $t_{go}=40\,\mathrm{s}$, $\mathbf{g}=(0,-3.71)\,\mathrm{m/s^2}$ — nothing in the law changes except the gravity vector fed into $ZEM$ and $ZEV$:

$$
ZEM = (-50.0,\ 3168.0)\,\mathrm{m}, \qquad ZEV = (15.0,\ 208.4)\,\mathrm{m/s}, \qquad \mathbf{a} = (-0.938,\ 1.460)\,\mathrm{m/s^2}.
$$

Flown closed-loop to touchdown, the result is the same story at Mars's roughly $2.3\times$ stronger gravity: final position and velocity errors again at floating-point precision, peak commanded acceleration $9.11\,\mathrm{m/s^2}$ — almost exactly double the lunar peak, tracking the roughly $2.3\times$ larger gravity and the somewhat faster initial closing rate this scenario starts from. Nothing about the *derivation* cared which body the lander was descending toward; only the number substituted for $\mathbf{g}$ did.
:::

## Why these particular gains

The $6/t_{go}^2$ and $-2/t_{go}$ coefficients are not a different idea from proportional navigation's $3/t_{go}^2$ — they are what the same infinite-terminal-weight construction from the last lesson produces once *both* terminal states are weighted instead of one. Posing the analogous soft-constraint problem with $\mathbf{Q}_f = \operatorname{diag}(q_f, q_f)$ (both position and velocity priced, not position alone) and solving its Riccati equation gives a two-parameter family of gains that converges, as $q_f\to\infty$, to exactly $6/t_{go}^2$ and $-2/t_{go}$ — the same limit construction as before, applied to a richer terminal cost. The extra constraint is what changes the numbers: pinning velocity as well as position removes a degree of freedom the earlier problem had left free, and the optimizer pays for closing it with larger gains close to $t_{go}=0$, which is exactly the steep late growth in commanded acceleration both worked examples above show.

::: warning ZEM/ZEV needs t_go from somewhere else
Every quantity in this law — $ZEM$, $ZEV$, the $1/t_{go}^2$ and $1/t_{go}$ gains — depends on knowing $t_{go}$, and nothing in this lesson derived where that number comes from. Both worked examples above simply specified it. A later lesson in this module takes on exactly that question, and it matters more here than almost anywhere else in this module: the gains blow up as $t_{go}\to0$, so a wrong $t_{go}$ near touchdown is not a small error.
:::

## Check yourself

::: check
Define zero-effort miss and zero-effort velocity in one sentence each, without reference to the constant-gravity formula.
:::

::: answer
Zero-effort miss is the position error you would have at the planned arrival time if you applied no further control from this instant on — the gap between the target position and where coasting under the true, uncontrolled dynamics would actually leave you. Zero-effort velocity is the same idea applied to velocity: the gap between the target velocity and the velocity coasting would leave you with. Neither definition mentions gravity specifically, because the idea is "propagate the uncontrolled dynamics, whatever they are" — the constant-gravity formula is just the closed form that particular propagation happens to have.
:::

::: check
For $\mathbf{r}=500\,\mathrm{m}$, $\mathbf{v}=-25\,\mathrm{m/s}$ (vertical only), $\mathbf{r}_f=\mathbf{v}_f=0$, $t_{go}=15\,\mathrm{s}$, $g=-3.71\,\mathrm{m/s^2}$ (Mars), find $ZEM$, $ZEV$, and the commanded acceleration.
:::

::: answer
$ZEM = 0 - \big(500 + (-25)(15) + \tfrac12(-3.71)(15)^2\big) = 0-(500-375-417.375) = 292.375\,\mathrm{m}$. $ZEV = 0-\big(-25+(-3.71)(15)\big) = 0-(-25-55.65) = 80.65\,\mathrm{m/s}$. $a = (6/15^2)(292.375) - (2/15)(80.65) = 7.797 - 10.753 = -2.957\,\mathrm{m/s^2}$ — a modest braking command, consistent with still having $15\,\mathrm{s}$ to correct a lander that, left alone, would overshoot the ground going far too fast.
:::

::: check
Why does ZEM/ZEV guidance use $6/t_{go}^2$ and $-2/t_{go}$ rather than proportional navigation's $3/t_{go}^2$, when both are described as "the minimum-energy feedback law"?
:::

::: answer
They solve genuinely different problems. Proportional navigation's derivation left terminal velocity free — hit the target, arrive however fast you like — which is a single terminal constraint. ZEM/ZEV's derivation pins both terminal position *and* terminal velocity, a two-point boundary value problem with one more constraint than PN's. The extra constraint is exactly what changes the gains: with less freedom left in how the trajectory can end, the optimizer needs a stronger, differently-shaped correction to satisfy both conditions at once, and $6/t_{go}^2,\,-2/t_{go}$ is what that specific, harder optimization produces. Both are still "the minimum-energy law" for their own problem; the problems are not the same problem.
:::

::: check
Why is it correct to say the acceleration command $\mathbf{a}$ from the ZEM/ZEV law is the *entire* thrust acceleration needed, rather than a correction to be added on top of a separate gravity-cancelling hover thrust?
:::

::: answer
Because gravity is already inside $ZEM$ and $ZEV$ — the coast prediction $\mathbf{r}+\mathbf{v}t_{go}+\tfrac12\mathbf{g}t_{go}^2$ used the true $\mathbf{g}$, not zero, so the miss and velocity errors the law reacts to are the errors *after* gravity has already been accounted for. The derivation itself confirms this: the dynamics were $\dot x_2 = g + u$, with $u$ the only control term, and solving for $u^\star$ produced the law directly — there was never a separate "hover" term split out. Adding a further gravity-cancellation term on top would double-count gravity's effect and produce the wrong command.
:::

::: check
In the Mars example, the peak commanded acceleration was roughly double the lunar example's, tracking gravity's roughly $2.3\times$ increase. Is that scaling a coincidence of these two particular scenarios, or does the law guarantee it?
:::

::: answer
It is not guaranteed in general — the law's gains depend on $t_{go}$ and the current $ZEM,ZEV$, which depend on the full initial state, not on gravity alone, so two scenarios with different starting ranges, speeds and flight times will not scale purely with $g$. In these two examples the initial conditions were chosen to be broadly comparable (similar descent geometry, similar $t_{go}$), which is why gravity's scaling dominated and showed through cleanly; a lunar and a Martian descent with very different starting dispersions could easily show peak accelerations that do not track the gravity ratio at all.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Zero-effort miss | $ZEM = \mathbf{r}_f - (\mathbf{r}+\mathbf{v}t_{go}+\tfrac12\mathbf{g}t_{go}^2)$: the position error if no further control is applied |
| Zero-effort velocity | $ZEV = \mathbf{v}_f - (\mathbf{v}+\mathbf{g}t_{go})$: the corresponding velocity error |
| ZEM/ZEV feedback law | $\mathbf{a} = (6/t_{go}^2)\,ZEM - (2/t_{go})\,ZEV$, the full commanded thrust acceleration |
| Origin | Minimum-energy solution for a double integrator with both terminal position and velocity constrained |
| Relation to PN | Same infinite-terminal-weight construction, applied to a terminal cost that weights both states instead of one |
| Generalizes beyond constant $g$ | Yes — propagate the true uncontrolled dynamics for $ZEM,ZEV$; only the closed form is gravity-specific |

Both worked landings above simply assumed a value for $t_{go}$. Every gain in this law depends on it, and getting it right — or handling it when it is wrong — is significant enough a question to earn its own lesson later in this module, after a look at how sensitive a guidance loop's miss is to disturbances in the first place.
