---
id: l06-finite-versus-infinite-horizon
title: Infinite-horizon and finite-horizon LQR
minutes: 19
covers:
  - Infinite-horizon vs finite-horizon LQR
---

Think about two kinds of homework. One is "keep your room tidy" — a job with no end date. The other is "finish the science project by Friday" — a job with a deadline. You plan them differently. With no deadline, you do a little every day in the same steady way. With a deadline, how hard you work depends on how many days are left, and on Thursday night you work very hard indeed.

Control jobs split the same way. An attitude-hold controller runs for years. A docking approach runs for four minutes and then the two vehicles either latch or they do not. A terminal descent runs for forty seconds and ends on one particular patch of ground. The first is an **infinite-horizon** problem — the cost adds up forever. The other two are **finite-horizon** problems — the cost stops at a final time $t_f$. The word **[[horizon|horizon-word]]** means how far ahead the controller is planning. Treating a deadline job as if it had no deadline throws away the one thing that matters about it: the value of a state depends on how much time is left.

In the mathematics the change is small. $\mathbf{P}$ becomes a function of time, and the algebraic Riccati equation becomes a differential one. In practice the change is large. A finite-horizon controller has a *schedule* of gains instead of one gain, which must be stored or recomputed. And it has a terminal weight $\mathbf{Q}_f$ — a real design choice with no infinite-horizon counterpart. This lesson works through what changes, how long a horizon must be before the difference stops mattering, and what happens at the far extreme, where the terminal condition is a hard requirement rather than a weight.

## What differs

Recall the finite-horizon cost from the first lesson:

$$
J = \mathbf{x}(t_f)^\top\mathbf{Q}_f\,\mathbf{x}(t_f) + \int_0^{t_f}\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)\,dt .
$$

Its solution comes from the **differential Riccati equation**, the DRE, integrated backward in time from the end:

$$
-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(t_f) = \mathbf{Q}_f .
$$

It is convenient to count **time-to-go**, $s = t_f - t$ — the time left on the clock — so the backward march becomes a forward one in $s$. Side by side:

| | Infinite horizon | Finite horizon |
| --- | --- | --- |
| Equation | CARE, algebraic | DRE, integrated backward from $t_f$ |
| $\mathbf{P}$ | constant | $\mathbf{P}(t)$, a schedule |
| $\mathbf{K}$ | constant | $\mathbf{K}(t) = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)$ |
| Extra design freedom | none | $\mathbf{Q}_f$ |
| Closed loop | poles, stable by construction | time-varying; "poles" are not defined |
| Guaranteed margins | yes (previous lesson) | not as stated; the identity assumed constant $\mathbf{K}$ |
| Storage onboard | $m \times n$ numbers | a table, or a re-solve each cycle |

The margins row deserves a sentence. The return-difference identity was built from the *algebraic* Riccati equation with a constant $\mathbf{K}$. A gain that changes with time has no transfer function, so the statement does not even make sense for it. In practice, a finite-horizon design whose gain is nearly constant over most of the horizon behaves like the constant-gain loop over that stretch. The part to check is the end, where $\mathbf{K}(t)$ moves fast.

## How long is long enough

Here is the everyday version. If a job lasts much longer than it takes the controller to settle, the deadline is so far off that the controller behaves as if there were none — until the very end.

The Riccati lesson made that precise. The gap between $\mathbf{P}(s)$ and its steady value $\mathbf{P}_\infty$ ("P infinity") shrinks like

$$
\|\mathbf{P}(s) - \mathbf{P}_\infty\| \sim e^{-2|\mathrm{Re}\,\mu_{\min}|\,s},
$$

where $\mu_{\min}$ ("mu min") is the slowest closed-loop pole. Call $\tau = 1/|\mathrm{Re}\,\mu_{\min}|$ the slowest closed-loop time constant. Because of the factor of $2$ in the exponent, the gap falls by $e^{-2}$ per time constant of horizon:

- two time constants of horizon leave $e^{-4} \approx 1.8\,\%$ of the starting gap;
- four time constants leave $e^{-8} \approx 0.03\,\%$.

So a horizon of about **four closed-loop time constants** makes finite and infinite horizon practically the same.

::: example How much horizon the wheel axis needs
The reaction-wheel axis with Bryson weights has $\mathbf{K}_\infty = (916.73,\ 522.05)$, $\mathbf{P}_\infty$ with $P_{11} = 7477.88$, and closed-loop poles $-2.1752 \pm 1.7052j\,\mathrm{s^{-1}}$. So the slowest time constant is $\tau = 1/2.1752 = 0.460\,\mathrm{s}$, and four of them is $1.84\,\mathrm{s}$.

Start from $\mathbf{x}_0 = (5^\circ, 0)$ with $\mathbf{Q}_f = \mathbf{0}$, and try several horizons. The cost $J$ is in seconds, because the Bryson weights made the integrand dimensionless.

| $t_f$ (s) | $J$ (s) | fraction of $J_\infty$ | $\mathbf{K}(0)$ | $\|\mathbf{P}(0)-\mathbf{P}_\infty\|_{\max}$ |
| --- | --- | --- | --- | --- |
| $0.25$ | $24.74$ | $43.4\,\%$ | $(204.3,\ 133.7)$ | $4.23\times10^{3}$ |
| $0.50$ | $44.30$ | $77.8\,\%$ | $(611.9,\ 330.4)$ | $1.66\times10^{3}$ |
| $1.00$ | $55.02$ | $96.6\,\%$ | $(891.7,\ 507.5)$ | $2.54\times10^{2}$ |
| $2.00$ | $56.909$ | $99.93\,\%$ | $(915.8,\ 521.6)$ | $5.08$ |
| $3.00$ | $56.9469$ | $99.999\,\%$ | $(916.73,\ 522.05)$ | $5.5\times10^{-2}$ |
| $4.00$ | $56.9473$ | $100.000\,\%$ | $(916.73,\ 522.05)$ | $6.9\times10^{-4}$ |

The infinite-horizon cost is $J_\infty = \mathbf{x}_0^\top\mathbf{P}_\infty\mathbf{x}_0 = 56.947\,\mathrm{s}$.

**The costs are always smaller.** The controller stops being charged at $t_f$, so short horizons *look* cheap while leaving the vehicle in a worse state. At $t_f = 0.25\,\mathrm{s}$ the cost is under half of $J_\infty$, and the axis has barely moved. Comparing costs across different horizons means nothing unless $\mathbf{Q}_f$ puts a price on what is left over.

**The rule of thumb works.** Four time constants is $1.84\,\mathrm{s}$, and the table shows the gain matching steady state to within $0.1\,\%$ by $t_f = 2\,\mathrm{s}$: $915.8$ against $916.73$.
:::

## The terminal weight

$\mathbf{Q}_f$ is the price tag on the state you are left holding at $t_f$. Three choices cover almost everything. The **[[gain schedules they produce|schedules]]** look quite different.

### Charge nothing: $\mathbf{Q}_f = \mathbf{0}$

Nothing is charged at the end. The gain fades to zero as $t \to t_f$: with no time left and nothing to protect, control effort buys nothing. This is right when the horizon is an accident — a simulation you cut short — and wrong when the final state is the whole point.

### Charge the true future: $\mathbf{Q}_f = \mathbf{P}_\infty$

Now the DRE has a **fixed point** — a value where it stops changing. Put $\mathbf{P}(t) = \mathbf{P}_\infty$ into the right side of the DRE. By the CARE, that right side is zero, so $\dot{\mathbf{P}} = \mathbf{0}$ and

$$
\mathbf{P}(t) = \mathbf{P}_\infty \quad\text{for all } t \in [0, t_f].
$$

The finite-horizon controller *is* the infinite-horizon controller, and the finite-horizon cost is exactly $\mathbf{x}_0^\top\mathbf{P}_\infty\mathbf{x}_0$. Integrating the DRE backward from $\mathbf{Q}_f = \mathbf{P}_\infty$ over four seconds on the wheel axis reproduces $\mathbf{P}_\infty$ to within the integrator's rounding error (about $5\times10^{-10}$ in an entry of size $7478$).

Here is the meaning. $\mathbf{x}^\top\mathbf{P}_\infty\mathbf{x}$ is the true cost of everything that would happen after $t_f$. Charging it as the terminal penalty makes cutting the horizon free. This is the standard terminal cost in **[[model predictive control|mpc]]**, and it is why an MPC scheme with that terminal weight inherits the infinite-horizon design's stability.

### Charge a lot: $\mathbf{Q}_f \gg \mathbf{P}_\infty$

The controller is told the final state is expensive, so it works harder near the end. With $\mathbf{Q}_f = 10\mathbf{P}_\infty$ on the wheel axis:

| time-to-go (s) | $P_{11}$ | $\mathbf{K}$ |
| --- | --- | --- |
| $0$ | $74779$ | $(9167,\ 5221)$ |
| $0.25$ | $29312$ | $(2491,\ 867)$ |
| $0.50$ | $14701$ | $(1751,\ 729)$ |
| $1.00$ | $7978$ | $(1017,\ 563)$ |
| $2.00$ | $7481$ | $(916.9,\ 522.1)$ |
| $4.00$ | $7477.9$ | $(916.73,\ 522.05)$ |

**Sanity check:** at zero time-to-go, $P_{11} = 10 \times 7477.9 = 74779$, as the terminal condition says.

$\mathbf{P}$ now approaches $\mathbf{P}_\infty$ from **above**, and at the final instant the gain is ten times its steady value. The general rule: $\mathbf{P}(s)$ changes in one direction only as time-to-go grows, and it converges to $\mathbf{P}_\infty$ from whichever side $\mathbf{Q}_f$ sits on. So a large $\mathbf{Q}_f$ buys terminal accuracy at the price of a gain spike at the end of the maneuver — right where the actuator is least able to deliver it, and right where a saturation check belongs.

::: warning A terminal gain spike is real, not a numerical glitch
When a gain schedule shoots up as $t \to t_f$, the instinct is to blame the integrator. Usually the behavior is correct. The controller has been told that final error is very expensive and that little time is left, and the only way to buy accuracy in little time is authority. What to do about it is an engineering choice: cap $\mathbf{Q}_f$, stop the schedule a fraction of a second early and hold the last gain, or accept the spike if the actuator can supply it. But quietly smoothing it away changes the problem you solved.
:::

## Hard terminal constraints

Now push $\mathbf{Q}_f$ all the way to infinity. The terminal weight becomes a terminal *constraint*: $\mathbf{x}(t_f) = \mathbf{0}$ exactly. This is what docking needs — "close" is not good enough.

There is a snag. $\mathbf{P}(t_f) = \mathbf{Q}_f$ is now infinite, and you cannot start an integration from infinity. The cure is to work with the **[[inverse|inverse-sweep]]** instead. Let $\mathbf{S} = \mathbf{P}^{-1}$. An infinite $\mathbf{P}$ has inverse $\mathbf{0}$, which is a perfectly good place to start.

To get the equation for $\mathbf{S}$, differentiate $\mathbf{P}\mathbf{S} = \mathbf{I}$. The product rule gives $\dot{\mathbf{P}}\mathbf{S} + \mathbf{P}\dot{\mathbf{S}} = \mathbf{0}$, so $\dot{\mathbf{P}} = -\mathbf{P}\dot{\mathbf{S}}\mathbf{P}$. Substitute that into the DRE, then multiply on both sides by $\mathbf{S}$:

$$
\frac{d\mathbf{S}}{dt} = \mathbf{A}\mathbf{S} + \mathbf{S}\mathbf{A}^\top - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top + \mathbf{S}\mathbf{Q}\mathbf{S}, \qquad \mathbf{S}(t_f) = \mathbf{Q}_f^{-1} = \mathbf{0}.
$$

The terminal condition is finite now. Integrate $\mathbf{S}$ backward, and invert it whenever you need the gain.

::: note Why the inverse equation looks like that
Start from $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$ and put in $-\dot{\mathbf{P}} = \mathbf{P}\dot{\mathbf{S}}\mathbf{P}$:

$$
\mathbf{P}\dot{\mathbf{S}}\mathbf{P} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}.
$$

Multiply by $\mathbf{S}$ on the left and on the right. Since $\mathbf{S}\mathbf{P} = \mathbf{P}\mathbf{S} = \mathbf{I}$, each term loses a $\mathbf{P}$: $\mathbf{S}\mathbf{A}^\top\mathbf{P}\mathbf{S} = \mathbf{S}\mathbf{A}^\top$, $\mathbf{S}\mathbf{P}\mathbf{A}\mathbf{S} = \mathbf{A}\mathbf{S}$, the middle term becomes $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$, and $\mathbf{Q}$ becomes $\mathbf{S}\mathbf{Q}\mathbf{S}$. That gives $\dot{\mathbf{S}} = \mathbf{S}\mathbf{A}^\top + \mathbf{A}\mathbf{S} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top + \mathbf{S}\mathbf{Q}\mathbf{S}$. The troublesome quadratic term moved from the input side ($\mathbf{B}$) to the state side ($\mathbf{Q}$) — and when $\mathbf{Q} = \mathbf{0}$ it vanishes altogether, which is what makes the next example solvable by hand.
:::

::: example Minimum-energy docking with a hard terminal condition
A visiting vehicle of mass $m = 8000\,\mathrm{kg}$ flies the **[[last stretch of a docking axis|docking]]**. The state is $\mathbf{x} = (r, v)$ — distance to the port and closing speed — and the thrust $u$ is in newtons:

$$
\dot{\mathbf{x}} = \begin{bmatrix}0&1\\0&0\end{bmatrix}\mathbf{x} + \begin{bmatrix}0\\1/m\end{bmatrix}u .
$$

The cost is $J = \int_0^{t_f}u^2\,dt$ — pure effort, a stand-in for propellant — so $\mathbf{Q} = \mathbf{0}$ and $R = 1$. The hard requirement is $r(t_f) = 0$ and $v(t_f) = 0$: arrive at the port, at rest.

**Step 1: solve for $\mathbf{S}$.** With $\mathbf{Q} = \mathbf{0}$ the inverse equation has no quadratic term, and it integrates in closed form. Using $e^{-\mathbf{A}\sigma} = \begin{bmatrix}1 & -\sigma\\ 0 & 1\end{bmatrix}$ (with $\sigma$ as the integration variable) and time-to-go $s$:

$$
\mathbf{S}(s) = \int_0^{s}e^{-\mathbf{A}\sigma}\mathbf{B}\mathbf{B}^\top e^{-\mathbf{A}^\top\sigma}d\sigma
= \frac{1}{m^2}\begin{bmatrix}s^3/3 & -s^2/2\\ -s^2/2 & s\end{bmatrix}.
$$

**Step 2: invert.** The determinant is $\frac{1}{m^4}\big(\frac{s^4}{3} - \frac{s^4}{4}\big) = \frac{s^4}{12m^4}$. Swapping the diagonal, negating the off-diagonal and dividing by the determinant:

$$
\mathbf{P}(s) = \mathbf{S}(s)^{-1} = m^2\begin{bmatrix}12/s^3 & 6/s^2\\ 6/s^2 & 4/s\end{bmatrix}.
$$

**Step 3: the gain.** Since $\mathbf{B}^\top = [\,0 \quad 1/m\,]$ picks out the bottom row of $\mathbf{P}$ and divides by $m$:

$$
\mathbf{K}(s) = R^{-1}\mathbf{B}^\top\mathbf{P}(s) = m\left[\frac{6}{s^2}\quad \frac{4}{s}\right].
$$

That gain law — $6/s^2$ on position, $4/s$ on speed — is the **minimum-energy terminal guidance law**, and it is worth memorizing. The cost kernel $\mathbf{P}$ blows up as $s^{-3}$ and the gain as $s^{-2}$ as time runs out. That is the price of an exact terminal condition.

**Step 4: numbers.** Start at $r_0 = 10\,\mathrm{m}$, closing at $v_0 = -0.05\,\mathrm{m/s}$, with $t_f = 120\,\mathrm{s}$. The first command is

$$
u(0) = -m\left(\frac{6 r_0}{t_f^2} + \frac{4v_0}{t_f}\right) = -8000\big(4.1667\times10^{-3} - 1.6667\times10^{-3}\big) = -20.0\,\mathrm{N}.
$$

Negative means pushing *toward* the port, speeding up. That makes sense: at $0.05\,\mathrm{m/s}$ the vehicle would cover only $6\,\mathrm{m}$ in two minutes, not $10$. The optimal thrust changes in a straight line with time (it is **affine** in $t$), rising to $+26.67\,\mathrm{N}$ at contact as the vehicle brakes. The **[[thrust profile|thrust-profile]]** is worth a look.

**Step 5: cost.**

$$
J = \mathbf{x}_0^\top\mathbf{P}(t_f)\mathbf{x}_0 = m^2\left(\frac{12r_0^2}{t_f^3} + \frac{12 r_0 v_0}{t_f^2} + \frac{4v_0^2}{t_f}\right) = 23111\,\mathrm{N^2\,s}.
$$

The total velocity change is $\int|u|\,dt/m = 0.179\,\mathrm{m/s}$. Propagating the thrust profile lands the vehicle at the port with position and speed errors at the level of rounding error — below $10^{-9}\,\mathrm{m}$. The constraint is met, not approximated.

**Step 6: hurry up and see.** With $t_f = 60\,\mathrm{s}$, the $12r_0^2/t_f^3$ term grows eightfold, and the total cost becomes $259556\,\mathrm{N^2\,s}$ — about eleven times as much. Doing the approach twice as fast costs roughly ten times the energy. That **[[steep inverse-cube curve|cubic-cost]]** is why terminal maneuvers are given generous time.
:::

## Receding horizon

There is a third option that behaves like an infinite-horizon controller while being computed as a finite-horizon one. Think of headlights on a night drive: you can always see the same distance ahead, and as you drive, the view moves with you.

At each control cycle:

1. Solve the finite-horizon problem over $[t,\ t+T]$, starting from the current state.
2. Apply only the first instant of the resulting control.
3. Throw the rest away, and repeat next cycle.

This is **receding-horizon control**. Add constraints to the finite-horizon problem and it is model predictive control.

For the unconstrained linear-quadratic case, the receding-horizon law is exactly $\mathbf{u} = -\mathbf{K}(0)\mathbf{x}$, with $\mathbf{K}(0)$ read from a horizon of length $T$. That is a constant gain, and it approaches the infinite-horizon gain as $T$ grows, as the first table shows. Two facts carry over to the constrained case, where receding horizon earns its keep:

- Choosing $\mathbf{Q}_f = \mathbf{P}_\infty$ makes the truncation exact for the unconstrained problem, and it is the standard route to proving stability for the constrained one.
- A horizon shorter than a few closed-loop time constants gives a genuinely different, more sluggish controller. At $T = 0.25\,\mathrm{s}$ the wheel-axis gain was $(204,\ 134)$ against a steady-state $(917,\ 522)$ — a factor of about four too low.

## Which to use

- **Holding a fixed setpoint with no deadline** — attitude hold, station keeping, cruise. Infinite horizon: one gain, guaranteed margins, nothing to store.
- **A maneuver with a deadline and a terminal condition** — docking, landing, orbit insertion, intercept. Finite horizon, with $\mathbf{Q}_f$ or a hard constraint saying what "arriving" means.
- **A long maneuver along a reference you already computed** — ascent, reentry. Finite horizon with a time-varying plant. That is the trajectory-stabilization case treated later in this module.
- **Constraints that matter** — thrust limits, keep-out zones, glide slopes. Receding horizon with an optimizer inside, which is where this module hands off to convex optimization.

## Check yourself

::: check
Show that $\mathbf{Q}_f = \mathbf{P}_\infty$ makes $\mathbf{P}(t)$ constant, and say what that means for the cost.
:::

::: answer
Put $\mathbf{P}(t) = \mathbf{P}_\infty$ into the differential Riccati equation. The right side is $\mathbf{A}^\top\mathbf{P}_\infty + \mathbf{P}_\infty\mathbf{A} - \mathbf{P}_\infty\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_\infty + \mathbf{Q}$, which is zero by the CARE. So $\dot{\mathbf{P}} = \mathbf{0}$, and the constant function satisfies the equation. It also satisfies the terminal condition, by assumption. An ordinary differential equation with a given terminal value has only one solution, so $\mathbf{P}(t) \equiv \mathbf{P}_\infty$.

For the cost: the finite-horizon cost from $\mathbf{x}_0$ is $\mathbf{x}_0^\top\mathbf{P}_\infty\mathbf{x}_0$, the same as the infinite-horizon cost. That is because $\mathbf{x}(t_f)^\top\mathbf{P}_\infty\mathbf{x}(t_f)$ is exactly the cost of the tail you cut off. Cutting the horizon and charging the true cost-to-go for the rest is not an approximation at all.
:::

::: check
Why is the finite-horizon cost in the first table always less than the infinite-horizon cost, even though the finite-horizon controller is worse for the infinite-horizon problem?
:::

::: answer
The two numbers measure different things. $J(t_f)$ with $\mathbf{Q}_f = \mathbf{0}$ adds up the running cost only over $[0, t_f]$ and charges nothing afterward. It covers only part of what $J_\infty$ adds up, so it must be smaller.

There is no contradiction with optimality, because the finite-horizon controller is not being scored on the infinite-horizon objective. Score it properly and the ranking flips. Fly the $t_f = 0.25\,\mathrm{s}$ schedule, then switch to the infinite-horizon gain: the total infinite-horizon cost comes to about $75.5\,\mathrm{s}$, well above $56.947\,\mathrm{s}$. The first quarter-second was spent under a gain that was too low, and the angle was still $4.87^\circ$ when it ended.

The practical lesson: a cost number without its horizon and terminal weight attached cannot be compared with anything.
:::

::: check
For the docking example, how much does the energy change if the approach time is doubled from $120\,\mathrm{s}$ to $240\,\mathrm{s}$? Which term dominates?
:::

::: answer
Use $J = m^2\big(12r_0^2/t_f^3 + 12r_0v_0/t_f^2 + 4v_0^2/t_f\big)$, with $m^2 = 6.4\times10^{7}\,\mathrm{kg^2}$.

At $t_f = 120\,\mathrm{s}$ the three terms are $6.944\times10^{-4}$, $-4.167\times10^{-4}$ and $8.333\times10^{-5}$, in units of $\mathrm{(m/s^2)^2\,s}$. They total $3.611\times10^{-4}$, so $J = 6.4\times10^{7} \times 3.611\times10^{-4} = 23111\,\mathrm{N^2\,s}$.

At $t_f = 240\,\mathrm{s}$ they become $8.681\times10^{-5}$, $-1.042\times10^{-4}$ and $4.167\times10^{-5}$, totaling $2.431\times10^{-5}$, so $J = 1556\,\mathrm{N^2\,s}$ — about fifteen times less.

The $r_0^2/t_f^3$ term dominates at short times and falls fastest. That is why doubling the time is worth far more than any cleverness in the guidance law. The middle term is negative here because the vehicle starts out moving in the useful direction. If it were drifting away, that term would add instead of subtract, and a short approach would be even more expensive.
:::

::: check
A colleague implements a finite-horizon design by computing $\mathbf{K}(0)$ once and holding it for the whole maneuver. When is that harmless, and when is it not?
:::

::: answer
It is harmless when the maneuver is long compared with the closed-loop time constants and the terminal weight is modest. Then $\mathbf{K}(t)$ is essentially constant over all but the last sliver of the horizon. In the wheel-axis table, $\mathbf{K}$ is within $0.1\,\%$ of steady state for any time-to-go beyond two seconds, so holding $\mathbf{K}(0)$ over a thirty-second maneuver changes almost nothing.

It is not harmless when the terminal condition is the point of the exercise. In the docking example, $\mathbf{K}$ grows as $s^{-2}$. Holding the value from $s = 120\,\mathrm{s}$, which is $(3.33,\ 267)$, all the way to contact — instead of, say, the correct $(1.2\times10^6,\ 1.6\times10^5)$ at $s = 0.2\,\mathrm{s}$ — leaves a terminal error instead of zeroing it.

The test: does the schedule change by more than a few percent over the part of the horizon you actually fly?
:::

::: check
Do the guaranteed margins of the previous lesson apply to a finite-horizon design?
:::

::: answer
Not as stated. The return-difference identity was derived from the algebraic Riccati equation with a constant $\mathbf{K}$. It is a frequency-domain statement about $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$. A time-varying gain has no transfer function, so there is no Nyquist plot to keep out of a disk.

What survives in practice: over any stretch where $\mathbf{K}(t)$ is effectively constant, the loop frozen at that moment is an LQR loop and has its margins. That covers most of a long maneuver. The part that needs an explicit check is the terminal region, where the gain changes fast and can be far from any steady-state value. For a design with a hard terminal constraint, the honest statement is that robustness near the end must be shown by simulation with perturbed actuator gains and delays — not by citing $6\,\mathrm{dB}$ and $60^\circ$.
:::

## Summary

| Object | Statement |
| --- | --- |
| Finite horizon | $J = \mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_0^{t_f}(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$; $\mathbf{K}(t) = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)$ |
| DRE | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, integrated backward from $\mathbf{P}(t_f) = \mathbf{Q}_f$ |
| Convergence | $\mathbf{P}(s) \to \mathbf{P}_\infty$ with error $\sim e^{-2\lvert\mathrm{Re}\,\mu_{\min}\rvert s}$; four closed-loop time constants suffice |
| $\mathbf{Q}_f = \mathbf{0}$ | Gain fades to zero at $t_f$; cost underestimates the infinite-horizon cost |
| $\mathbf{Q}_f = \mathbf{P}_\infty$ | $\mathbf{P}(t) \equiv \mathbf{P}_\infty$ exactly; finite and infinite horizon coincide |
| $\mathbf{Q}_f$ large | $\mathbf{P}(t)$ approaches $\mathbf{P}_\infty$ from above; gain spike at $t_f$ |
| Inverse sweep | $\dot{\mathbf{S}} = \mathbf{A}\mathbf{S} + \mathbf{S}\mathbf{A}^\top - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top + \mathbf{S}\mathbf{Q}\mathbf{S}$, $\mathbf{S} = \mathbf{P}^{-1}$, $\mathbf{S}(t_f) = \mathbf{0}$ for a hard constraint |
| Minimum-energy terminal law | $\mathbf{K}(s) = m\,[\,6/s^2\quad 4/s\,]$ for a double integrator with $\mathbf{x}(t_f) = \mathbf{0}$ |
| Its cost | $J = m^2\big(12r_0^2/s^3 + 12r_0v_0/s^2 + 4v_0^2/s\big)$; steep in inverse time-to-go |
| Worked docking | $8000\,\mathrm{kg}$, $10\,\mathrm{m}$, $-0.05\,\mathrm{m/s}$, $120\,\mathrm{s}$: $u$ from $-20.0$ to $+26.7\,\mathrm{N}$, $J = 23111\,\mathrm{N^2s}$, $\Delta v = 0.179\,\mathrm{m/s}$ |
| Receding horizon | Re-solve each cycle, apply the first move; $\mathbf{Q}_f = \mathbf{P}_\infty$ makes the truncation exact |
| Margins | The $6\,\mathrm{dB}$ / $60^\circ$ guarantee is an infinite-horizon, constant-gain result |

The next lesson adds a skill neither version has so far: rejecting a constant disturbance with no steady-state error.

::: context horizon-word Why "horizon"
The horizon is as far as you can see. In planning, it means how far ahead in time the plan looks. An infinite horizon is a plan that looks forever ahead; a finite horizon stops at $t_f$. A controller with a short horizon is like a driver who only looks a few meters ahead: fine on a straight road, caught out by anything that needs planning.
:::

::: context schedules Three terminal weights, three schedules
Here is the angle gain $k_1$ against time-to-go for the wheel axis, drawn to scale. With $\mathbf{Q}_f = \mathbf{0}$ (blue) the gain starts at zero at the deadline and climbs. With $\mathbf{Q}_f = 10\mathbf{P}_\infty$ (red) it starts far above and falls — it is $9167$ at zero time-to-go, off the top of the chart. With $\mathbf{Q}_f = \mathbf{P}_\infty$ it would be the flat gray line the whole time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="196">0</text><text x="146.7" y="196">1</text><text x="243.3" y="196">2</text><text x="340" y="196">3</text></g>
  <text x="195" y="211" font-size="11" fill="#1f2a44" text-anchor="middle">time-to-go s (seconds)</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="45" y="184">0</text><text x="45" y="109">1500</text><text x="45" y="34">3000</text></g>
  <line x1="50" y1="134.2" x2="340" y2="134.2" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="300" y="150" font-size="11" fill="#6c7a93">k₁ = 916.7</text>
  <polyline points="50.0,180.0 54.8,179.6 59.7,178.3 64.5,176.1 69.3,173.3 74.2,169.8 79.0,165.8 83.8,161.6 88.7,157.3 93.5,153.2 98.3,149.4 103.2,146.1 108.0,143.4 112.8,141.1 117.7,139.4 122.5,138.1 127.3,137.2 132.2,136.5 137.0,136.0 146.7,135.4 156.3,135.1 170.8,134.8 190.2,134.6 214.3,134.3 243.3,134.2 340,134.2" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <polyline points="59.7,34.1 64.5,44.7 69.3,50.1 74.2,55.4 79.0,62.0 83.8,69.5 88.7,77.3 93.5,85.1 98.3,92.4 103.2,99.1 108.0,104.9 112.8,110.0 117.7,114.4 122.5,118.1 127.3,121.2 132.2,123.8 137.0,126.0 141.8,127.7 146.7,129.2 156.3,131.2 170.8,133.0 190.2,133.9 214.3,134.1 243.3,134.2 340,134.2" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <line x1="55" y1="30" x2="55" y2="14" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="55,10 51,18 59,18" fill="#b4232c"/>
  <text x="64" y="20" font-size="11" fill="#b4232c">to 9167 at s = 0</text>
  <text x="120" y="172" font-size="11" fill="#1d6fd1">Q_f = 0</text>
  <text x="112" y="92" font-size="11" fill="#b4232c">Q_f = 10 P∞</text>
</svg>
```

By about two seconds of time-to-go all three have merged: the deadline no longer matters.
:::

::: context mpc Where receding horizon flies
Model predictive control re-solves a finite-horizon problem at every step, so it can respect limits such as maximum thrust or a keep-out zone. Its cousin, fast convex optimization, is used for powered-descent guidance: engineers at NASA's Jet Propulsion Laboratory flight-tested an onboard algorithm called G-FOLD on Masten Space Systems' Xombie rocket in 2012 and 2013, re-planning a divert to a new landing spot in flight. Choosing the terminal cost well is part of what lets such schemes be proven stable.
:::

::: context inverse-sweep Why flipping the problem helps
Near the deadline with a hard constraint, $\mathbf{P}$ races toward infinity, and a computer cannot hold infinity. Its inverse $\mathbf{S}$ races toward zero instead, which a computer handles perfectly well. It is like measuring how steep a hill is by "meters of height per meter along" versus "meters along per meter of height": at a vertical cliff one number is infinite and the other is plain zero.
:::

::: context docking How slowly docking happens
The last few meters of a spacecraft docking are flown very slowly — typically a few centimeters per second — so that the latches can capture without damaging either vehicle. The speed in this example, $5\,\mathrm{cm/s}$, is in that range. Real approaches also include hold points, where the visiting vehicle stops and waits for a "go" from the crew or ground before closing further. A guidance law that arrives exactly at rest at a set time is a natural fit for each leg between hold points.
:::

::: context thrust-profile The docking thrust, drawn
The optimal thrust is a straight line in time: $-20\,\mathrm{N}$ (speeding up toward the port) at the start, crossing zero at about $51.4\,\mathrm{s}$, and $+26.7\,\mathrm{N}$ (braking) at contact.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="30" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="45" y="104">0</text><text x="45" y="39">+30</text><text x="45" y="169">−30</text></g>
  <g stroke="#6c7a93" stroke-width="1"><line x1="46" y1="35" x2="50" y2="35"/><line x1="46" y1="165" x2="50" y2="165"/></g>
  <line x1="50" y1="143.3" x2="340" y2="42.2" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="50" cy="143.3" r="4" fill="#1d6fd1"/>
  <circle cx="340" cy="42.2" r="4" fill="#1d6fd1"/>
  <circle cx="174.3" cy="100" r="3.5" fill="#b4232c"/>
  <text x="60" y="160" font-size="11" fill="#1d6fd1">−20 N at t = 0</text>
  <text x="250" y="34" font-size="11" fill="#1d6fd1">+26.7 N at 120 s</text>
  <text x="180" y="118" font-size="11" fill="#b4232c">zero at 51.4 s</text>
  <text x="60" y="22" font-size="11" fill="#1f2a44">thrust u (N)</text>
  <text x="300" y="92" font-size="11" fill="#1f2a44">time</text>
</svg>
```

The closing speed peaks at about $0.114\,\mathrm{m/s}$ at the moment the thrust crosses zero, then the braking phase brings it smoothly to rest at the port.
:::

::: context cubic-cost Cost against approach time
The docking cost for the same start ($10\,\mathrm{m}$ out, $-0.05\,\mathrm{m/s}$), plotted against the approach time on a logarithmic vertical scale:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="45" y="194">10³</text><text x="45" y="141">10⁴</text><text x="45" y="87">10⁵</text><text x="45" y="34">10⁶</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="206">40</text><text x="195" y="206">140</text><text x="340" y="206">240</text></g>
  <polyline points="50.0,30.6 64.5,47.3 79.0,61.2 93.5,73.2 108.0,83.8 122.5,93.3 137.0,101.9 151.5,109.9 166.0,117.3 180.5,124.2 195.0,130.6 209.5,136.8 224.0,142.6 238.5,148.1 253.0,153.3 267.5,158.3 282.0,163.1 296.5,167.6 311.0,171.9 325.5,175.9 340.0,179.8" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <circle cx="79.0" cy="61.2" r="4" fill="#b4232c"/>
  <circle cx="166.0" cy="117.3" r="4" fill="#b4232c"/>
  <circle cx="340.0" cy="179.8" r="4" fill="#b4232c"/>
  <text x="88" y="56" font-size="11" fill="#b4232c">60 s: 259556</text>
  <text x="175" y="112" font-size="11" fill="#b4232c">120 s: 23111</text>
  <text x="250" y="172" font-size="11" fill="#b4232c">240 s: 1556</text>
  <text x="200" y="40" font-size="11" fill="#1f2a44">J (N² s)</text>
  <text x="300" y="206" font-size="11" fill="#1f2a44">t_f (s)</text>
</svg>
```

Each halving of the approach time multiplies the cost by roughly ten to fifteen here. For a vehicle starting at rest, the ratio would be exactly eight.
:::
