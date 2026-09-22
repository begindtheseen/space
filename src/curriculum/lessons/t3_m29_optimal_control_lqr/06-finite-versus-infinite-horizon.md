---
id: l06-finite-versus-infinite-horizon
title: Infinite-horizon and finite-horizon LQR
minutes: 19
covers:
  - Infinite-horizon vs finite-horizon LQR
---

An attitude-hold controller runs for years. A docking approach runs for four minutes and then something either mates or does not. A terminal descent runs for forty seconds and ends on a specific patch of ground. The first is an infinite-horizon problem; the other two are not, and treating them as though they were throws away the one thing that matters about them — that there is a deadline, and the value of a state depends on how much time is left.

Mathematically the difference is small: $\mathbf{P}$ becomes a function of time and the algebraic Riccati equation becomes a differential one. Operationally the difference is large. A finite-horizon controller has a gain schedule instead of a gain, must be stored or recomputed, and has a terminal weight $\mathbf{Q}_f$ that is a genuine design choice with no infinite-horizon counterpart. This lesson works through what changes, how long a horizon has to be before the distinction stops mattering, and what happens at the other extreme where the terminal condition is a hard constraint rather than a weight.

## What differs

| | Infinite horizon | Finite horizon |
| --- | --- | --- |
| Equation | CARE, algebraic | DRE, integrated backward from $t_f$ |
| $\mathbf{P}$ | constant | $\mathbf{P}(t)$, a schedule |
| $\mathbf{K}$ | constant | $\mathbf{K}(t) = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)$ |
| Extra design freedom | none | $\mathbf{Q}_f$ |
| Closed loop | poles, stable by construction | time-varying; "poles" are not defined |
| Guaranteed margins | yes (previous lesson) | not as stated; the identity assumed constant $\mathbf{K}$ |
| Storage onboard | $n \times m$ numbers | a table, or a re-solve each cycle |

The loss of the margin guarantee deserves a sentence. The return-difference identity was derived from the *algebraic* Riccati equation with a constant $\mathbf{K}$, and a time-varying gain has no transfer function, so the statement does not even typecheck. In practice, a finite-horizon design whose gain is nearly constant over most of the horizon inherits the margins over that stretch, and the part to check is the end, where $\mathbf{K}(t)$ moves fast.

## How long is long enough

The previous lessons established that $\mathbf{P}$ approaches its steady-state value with an error decaying like $e^{-2|\mathrm{Re}\,\mu_{\min}|s}$ in time-to-go $s$, where $\mu_{\min}$ is the slowest closed-loop pole. Four of those time constants — that is, $s \approx 2/|\mathrm{Re}\,\mu_{\min}|$, since the error decays at twice the rate — puts the error at $e^{-4} \approx 1.8\,\%$ of its initial value, and eight puts it at $0.03\,\%$.

::: example How much horizon the wheel axis needs
The reaction-wheel axis with Bryson weights has $\mathbf{K}_\infty = (916.73,\ 522.05)$, $\mathbf{P}_\infty$ with $P_{11} = 7477.88$, and closed-loop poles $-2.1752 \pm 1.7052j\,\mathrm{s^{-1}}$, so the slowest decay is $1/2.1752 = 0.460\,\mathrm{s}$. Starting from $\mathbf{x}_0 = (5^\circ, 0)$ and $\mathbf{Q}_f = \mathbf{0}$:

| $t_f$ (s) | $J$ (s) | fraction of $J_\infty$ | $\mathbf{K}(0)$ | $\|\mathbf{P}(0)-\mathbf{P}_\infty\|_{\max}$ |
| --- | --- | --- | --- | --- |
| $0.25$ | $24.74$ | $43.4\,\%$ | $(204.3,\ 133.7)$ | $4.23\times10^{3}$ |
| $0.50$ | $44.30$ | $77.8\,\%$ | $(611.9,\ 330.4)$ | $1.66\times10^{3}$ |
| $1.00$ | $55.02$ | $96.6\,\%$ | $(891.7,\ 507.5)$ | $2.54\times10^{2}$ |
| $2.00$ | $56.909$ | $99.93\,\%$ | $(915.8,\ 521.6)$ | $5.08$ |
| $3.00$ | $56.9469$ | $99.999\,\%$ | $(916.73,\ 522.05)$ | $5.5\times10^{-2}$ |
| $4.00$ | $56.9473$ | $100.000\,\%$ | $(916.73,\ 522.05)$ | $6.9\times10^{-4}$ |

The infinite-horizon cost is $J_\infty = 56.947\,\mathrm{s}$. Note the finite-horizon cost is always **smaller**: the controller stops being charged at $t_f$, so shorter horizons look cheaper while leaving the vehicle in a worse state — at $t_f = 0.25\,\mathrm{s}$ the cost is under half of $J_\infty$ and the axis has barely moved. Comparing costs across different horizons is meaningless unless $\mathbf{Q}_f$ prices what is left.

Four closed-loop time constants is $1.84\,\mathrm{s}$, and the table shows the design converged to three digits by $t_f = 2\,\mathrm{s}$. The rule of thumb earns its keep.
:::

## The terminal weight

$\mathbf{Q}_f$ prices the state you are left holding at $t_f$. Three choices cover almost everything.

**$\mathbf{Q}_f = \mathbf{0}$.** Nothing is charged at the end. The gain decays to zero as $t \to t_f$, because with no time left and nothing to protect, control effort buys nothing. This is right when the horizon is an artefact — a simulation you truncated — and wrong when the terminal state is the whole point.

**$\mathbf{Q}_f = \mathbf{P}_\infty$.** Then the DRE has a fixed point: substituting $\mathbf{P}(t) = \mathbf{P}_\infty$ gives $\dot{\mathbf{P}} = \mathbf{0}$ by the CARE, so

$$
\mathbf{P}(t) = \mathbf{P}_\infty \quad\text{for all } t \in [0, t_f],
$$

and the finite-horizon controller *is* the infinite-horizon controller, with the finite-horizon cost equal to $\mathbf{x}_0^\top\mathbf{P}_\infty\mathbf{x}_0$ exactly. Numerically, integrating the DRE backwards from $\mathbf{Q}_f = \mathbf{P}_\infty$ over four seconds reproduces $\mathbf{P}_\infty$ with an error of exactly zero. The reading is that $\mathbf{x}^\top\mathbf{P}_\infty\mathbf{x}$ is the true cost of everything after $t_f$, so charging it as a terminal penalty makes the truncation free. This is the standard terminal cost in model predictive control, and it is why an MPC scheme with that terminal weight inherits the infinite-horizon design's stability.

**$\mathbf{Q}_f \gg \mathbf{P}_\infty$.** The controller is told the terminal state is expensive and works harder near the end. With $\mathbf{Q}_f = 10\mathbf{P}_\infty$ on the wheel axis:

| time-to-go (s) | $P_{11}$ | $\mathbf{K}$ |
| --- | --- | --- |
| $0$ | $74779$ | $(9167,\ 5221)$ |
| $0.25$ | $29312$ | $(2491,\ 867)$ |
| $0.50$ | $14701$ | $(1751,\ 729)$ |
| $1.00$ | $7978$ | $(1017,\ 563)$ |
| $2.00$ | $7481$ | $(916.9,\ 522.1)$ |
| $4.00$ | $7477.9$ | $(916.73,\ 522.05)$ |

$\mathbf{P}$ now approaches $\mathbf{P}_\infty$ from **above**, and the gain is ten times the steady-state value at the terminal instant. The general statement is that $\mathbf{P}(t)$ is monotone in time-to-go and converges to $\mathbf{P}_\infty$ from whichever side $\mathbf{Q}_f$ sits on. A large $\mathbf{Q}_f$ therefore buys terminal accuracy at the price of a gain spike at the end of the manoeuvre — which is where the actuator is least able to deliver it, and where a saturation check belongs.

::: warning A terminal gain spike is a real thing, not a numerical artefact
When a gain schedule blows up as $t \to t_f$, the instinct is to suspect the integrator. Usually it is correct behaviour: the controller is being told that terminal error is very expensive and it has very little time left, so the only way to buy accuracy is authority. What to do about it is an engineering choice — cap $\mathbf{Q}_f$, stop the schedule a fraction of a second early and hold the last gain, or accept the spike if the actuator can supply it — but silently smoothing it away changes the problem you solved.
:::

## Hard terminal constraints

Push $\mathbf{Q}_f$ to infinity and the terminal weight becomes a terminal *constraint*: $\mathbf{x}(t_f) = \mathbf{0}$ exactly. $\mathbf{P}$ is then unbounded at $t_f$ and the DRE cannot be integrated from that end at all. The cure is to sweep the inverse. Let $\mathbf{S} = \mathbf{P}^{-1}$; differentiating $\mathbf{P}\mathbf{S} = \mathbf{I}$ gives $\dot{\mathbf{P}} = -\mathbf{P}\dot{\mathbf{S}}\mathbf{P}$, and substituting the DRE yields

$$
\frac{d\mathbf{S}}{dt} = \mathbf{A}\mathbf{S} + \mathbf{S}\mathbf{A}^\top - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top + \mathbf{S}\mathbf{Q}\mathbf{S}, \qquad \mathbf{S}(t_f) = \mathbf{Q}_f^{-1} = \mathbf{0},
$$

a perfectly finite terminal condition. Integrate $\mathbf{S}$ backwards and invert when you need the gain.

::: example Minimum-energy docking with a hard terminal condition
A visiting vehicle of mass $m = 8000\,\mathrm{kg}$ closes the last stretch of a docking axis. State $\mathbf{x} = (r, v)$, thrust $u$ in newtons, $\dot{\mathbf{x}} = \begin{bmatrix}0&1\\0&0\end{bmatrix}\mathbf{x} + \begin{bmatrix}0\\1/m\end{bmatrix}u$. Cost $J = \int_0^{t_f}u^2\,dt$ — pure propellant-like effort, $\mathbf{Q} = \mathbf{0}$, $R = 1$ — with the hard requirement $r(t_f) = 0$ and $v(t_f) = 0$.

With $\mathbf{Q} = \mathbf{0}$ the inverse sweep integrates in closed form. Since $e^{-\mathbf{A}\sigma} = \begin{bmatrix}1 & -\sigma\\ 0 & 1\end{bmatrix}$,

$$
\mathbf{S}(s) = \int_0^{s}e^{-\mathbf{A}\sigma}\mathbf{B}\mathbf{B}^\top e^{-\mathbf{A}^\top\sigma}d\sigma
= \frac{1}{m^2}\begin{bmatrix}s^3/3 & -s^2/2\\ -s^2/2 & s\end{bmatrix},
$$

with $s$ the time-to-go. Its determinant is $s^4/(12m^4)$, so

$$
\mathbf{P}(s) = \mathbf{S}(s)^{-1} = m^2\begin{bmatrix}12/s^3 & 6/s^2\\ 6/s^2 & 4/s\end{bmatrix},
\qquad
\mathbf{K}(s) = R^{-1}\mathbf{B}^\top\mathbf{P}(s) = m\left[\frac{6}{s^2}\quad \frac{4}{s}\right].
$$

That gain law — $6/s^2$ on position, $4/s$ on rate — is the minimum-energy terminal guidance law, and it is worth memorising. It blows up as $s^{-3}$ in cost and $s^{-2}$ in gain, which is the price of an exact terminal condition.

Numbers: from $r_0 = 10\,\mathrm{m}$ closing at $v_0 = -0.05\,\mathrm{m/s}$ with $t_f = 120\,\mathrm{s}$, the initial command is

$$
u(0) = -m\left(\frac{6 r_0}{t_f^2} + \frac{4v_0}{t_f}\right) = -8000\big(4.1667\times10^{-3} - 1.6667\times10^{-3}\big) = -20.0\,\mathrm{N},
$$

pushing *towards* the port, because $-0.05\,\mathrm{m/s}$ is too slow to cover $10\,\mathrm{m}$ in two minutes. The optimal thrust is affine in time, rising to $+26.67\,\mathrm{N}$ at contact as the vehicle brakes. The cost is

$$
J = \mathbf{x}_0^\top\mathbf{P}(t_f)\mathbf{x}_0 = m^2\left(\frac{12r_0^2}{t_f^3} + \frac{12 r_0 v_0}{t_f^2} + \frac{4v_0^2}{t_f}\right) = 23111\,\mathrm{N^2\,s},
$$

the total impulse is $\int|u|dt/m = 0.179\,\mathrm{m/s}$ of delta-v, and propagating the resulting thrust profile lands the vehicle at $r(t_f) = 1.8\times10^{-10}\,\mathrm{m}$, $v(t_f) = -1.5\times10^{-16}\,\mathrm{m/s}$. The constraint is met, not approximated.

Halve the time: with $t_f = 60\,\mathrm{s}$ the $12r_0^2/t_f^3$ term grows eightfold, so an approach done twice as fast costs roughly eight times the energy. That cubic is the reason terminal manoeuvres are scheduled generously.
:::

## Receding horizon

There is a third option that behaves like an infinite-horizon controller while being computed as a finite-horizon one. At each control cycle, solve the finite-horizon problem over $[t,\ t+T]$ from the current state, apply the first instant of the resulting control, throw the rest away, and repeat next cycle. This is **receding-horizon control**, and with constraints added to the finite-horizon problem it is model predictive control.

For the unconstrained linear quadratic case the receding-horizon law is exactly $\mathbf{u} = -\mathbf{K}(0)\mathbf{x}$ with $\mathbf{K}(0)$ read from a horizon of length $T$ — a constant gain, and one that approaches the infinite-horizon gain as $T$ grows, as the first table shows. Two design facts carry over to the constrained case where receding horizon earns its place. Choosing $\mathbf{Q}_f = \mathbf{P}_\infty$ makes the truncation exact for the unconstrained problem and is the standard route to proving stability for the constrained one. And a horizon shorter than a few closed-loop time constants gives a genuinely different, more sluggish controller — at $T = 0.25\,\mathrm{s}$ the wheel axis gain was $(204,\ 134)$ against a steady-state $(917,\ 522)$, a factor of four.

## Which to use

- **Regulation about a fixed setpoint, no deadline** — attitude hold, station keeping, cruise. Infinite horizon. One gain, guaranteed margins, nothing to store.
- **A manoeuvre with a deadline and a terminal condition** — docking, landing, orbit insertion, intercept. Finite horizon, with $\mathbf{Q}_f$ or a hard constraint expressing what "arriving" means.
- **A long manoeuvre along a reference you already computed** — ascent, reentry. Finite horizon with a time-varying plant, which is the trajectory-stabilization case treated later in this module.
- **Constraints that matter** — thrust limits, keep-out zones, glide slopes. Receding horizon with an optimiser inside, which is where this module hands off to the convex-optimisation machinery.

## Check yourself

::: check
Show that $\mathbf{Q}_f = \mathbf{P}_\infty$ makes $\mathbf{P}(t)$ constant, and say what that means for the cost.
:::

::: answer
Substitute $\mathbf{P}(t) = \mathbf{P}_\infty$ into the differential Riccati equation. The right-hand side is $\mathbf{A}^\top\mathbf{P}_\infty + \mathbf{P}_\infty\mathbf{A} - \mathbf{P}_\infty\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_\infty + \mathbf{Q}$, which is zero by the CARE, so $\dot{\mathbf{P}} = \mathbf{0}$ and the constant function satisfies the equation. It also satisfies the terminal condition by assumption, and the solution of an ordinary differential equation with a given terminal value is unique, so $\mathbf{P}(t) \equiv \mathbf{P}_\infty$. For the cost: the finite-horizon cost from $\mathbf{x}_0$ is $\mathbf{x}_0^\top\mathbf{P}_\infty\mathbf{x}_0$, identical to the infinite-horizon cost, because $\mathbf{x}(t_f)^\top\mathbf{P}_\infty\mathbf{x}(t_f)$ is precisely the cost of the tail you cut off. Truncating the horizon and charging the true cost-to-go for the remainder is not an approximation at all.
:::

::: check
Why is the finite-horizon cost in the first table always less than the infinite-horizon cost, even though the finite-horizon controller is suboptimal for the infinite-horizon problem?
:::

::: answer
The two numbers measure different things. $J(t_f)$ with $\mathbf{Q}_f = \mathbf{0}$ integrates the running cost only over $[0, t_f]$ and charges nothing afterwards, so it is a strict subset of what $J_\infty$ integrates — necessarily smaller. There is no contradiction with optimality because the finite-horizon controller is not being scored on the infinite-horizon objective. Score it properly and the ranking reverses: fly the $t_f = 0.25\,\mathrm{s}$ schedule, then switch to the infinite-horizon gain, and the total infinite-horizon cost exceeds $56.947\,\mathrm{s}$, because the first quarter-second was spent under a gain that was too low. The practical lesson is that a cost number without its horizon and terminal weight attached is not comparable with anything.
:::

::: check
For the docking example, how much does the energy change if the approach time is doubled from $120\,\mathrm{s}$ to $240\,\mathrm{s}$? Which term dominates?
:::

::: answer
$J = m^2\big(12r_0^2/t_f^3 + 12r_0v_0/t_f^2 + 4v_0^2/t_f\big)$. At $t_f = 120\,\mathrm{s}$ the three terms are $6.944\times10^{-4}$, $-4.167\times10^{-4}$ and $8.333\times10^{-5}$ in units of $\mathrm{(m/s^2)^2\,s}$, totalling $3.611\times10^{-4}$, so $J = 6.4\times10^{7} \times 3.611\times10^{-4} = 23111\,\mathrm{N^2\,s}$. At $t_f = 240\,\mathrm{s}$ they become $8.681\times10^{-5}$, $-1.042\times10^{-4}$ and $4.167\times10^{-5}$, totalling $2.431\times10^{-5}$, so $J = 1556\,\mathrm{N^2\,s}$ — about fifteen times less. The $r_0^2/t_f^3$ term dominates at short times and falls fastest, which is why doubling the time is worth far more than any amount of cleverness in the guidance law. Note the middle term is negative here because the vehicle starts moving in the useful direction; if it were drifting away, that term would add rather than subtract and the penalty for a short approach would be worse still.
:::

::: check
A colleague implements a finite-horizon design by computing $\mathbf{K}(0)$ once and holding it for the whole manoeuvre. When is that harmless, and when is it not?
:::

::: answer
It is harmless when the manoeuvre is long compared with the closed-loop time constants and the terminal weight is modest, because $\mathbf{K}(t)$ is then essentially constant over all but the last fraction of the horizon — in the wheel-axis table, $\mathbf{K}$ is within $0.1\,\%$ of steady state for any time-to-go beyond two seconds, so holding $\mathbf{K}(0)$ over a thirty-second manoeuvre changes almost nothing. It is not harmless when the terminal condition is the point of the exercise. In the docking example $\mathbf{K}$ rises as $s^{-2}$; holding the value from $s = 120\,\mathrm{s}$, namely $(3.33,\ 267)$, all the way to contact instead of the correct $(1.2\times10^6,\ 1.6\times10^5)$ at $s = 0.2\,\mathrm{s}$ leaves a terminal error rather than zeroing it. The test is whether the schedule varies by more than a few percent over the part of the horizon you actually fly.
:::

::: check
Do the guaranteed margins of the previous lesson apply to a finite-horizon design?
:::

::: answer
Not as stated. The return-difference identity was derived from the algebraic Riccati equation with a constant $\mathbf{K}$, and it is a frequency-domain statement about $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$; a time-varying gain has no transfer function, so there is no Nyquist plot to keep out of a disk. What survives in practice is the observation that over any stretch of the horizon where $\mathbf{K}(t)$ is effectively constant, the frozen-time loop is an LQR loop and inherits its margins — which covers most of a long manoeuvre. The part that needs an explicit check is the terminal region, where the gain changes fast and can be far from any steady-state value. For a finite-horizon design with a hard terminal constraint, the honest statement is that robustness near the end has to be established by simulation with perturbed actuator gains and delays, not by citing $6\,\mathrm{dB}$ and $60^\circ$.
:::

## Summary

| Object | Statement |
| --- | --- |
| Finite horizon | $J = \mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_0^{t_f}(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$; $\mathbf{K}(t) = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)$ |
| Convergence | $\mathbf{P}(s) \to \mathbf{P}_\infty$ with error $\sim e^{-2\lvert\mathrm{Re}\,\mu_{\min}\rvert s}$; four closed-loop time constants suffices |
| $\mathbf{Q}_f = \mathbf{0}$ | Gain decays to zero at $t_f$; cost is an underestimate of the infinite-horizon cost |
| $\mathbf{Q}_f = \mathbf{P}_\infty$ | $\mathbf{P}(t) \equiv \mathbf{P}_\infty$ exactly; finite and infinite horizon coincide |
| $\mathbf{Q}_f$ large | $\mathbf{P}(t)$ approaches $\mathbf{P}_\infty$ from above; gain spike at $t_f$ |
| Inverse sweep | $\dot{\mathbf{S}} = \mathbf{A}\mathbf{S} + \mathbf{S}\mathbf{A}^\top - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top + \mathbf{S}\mathbf{Q}\mathbf{S}$, $\mathbf{S} = \mathbf{P}^{-1}$, $\mathbf{S}(t_f) = \mathbf{0}$ for a hard constraint |
| Minimum-energy terminal law | $\mathbf{K}(s) = m\,[\,6/s^2\quad 4/s\,]$ for a double integrator with $\mathbf{x}(t_f) = \mathbf{0}$ |
| Its cost | $J = m^2\big(12r_0^2/s^3 + 12r_0v_0/s^2 + 4v_0^2/s\big)$; cubic in inverse time-to-go |
| Worked docking | $8000\,\mathrm{kg}$, $10\,\mathrm{m}$, $-0.05\,\mathrm{m/s}$, $120\,\mathrm{s}$: $u$ from $-20.0$ to $+26.7\,\mathrm{N}$, $J = 23111\,\mathrm{N^2s}$, $\Delta v = 0.179\,\mathrm{m/s}$ |
| Receding horizon | Re-solve each cycle, apply the first move; $\mathbf{Q}_f = \mathbf{P}_\infty$ makes the truncation exact |
| Margins | The $6\,\mathrm{dB}$ / $60^\circ$ guarantee is an infinite-horizon, constant-gain result |

The next lesson adds a capability neither version has so far: rejecting a constant disturbance with no steady-state error.
