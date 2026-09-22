---
id: l07-optimal-guidance-lq-formulation
title: Optimal guidance from a linear-quadratic formulation
minutes: 22
covers:
  - Optimal guidance from an LQ formulation and how PN emerges from it
---

The derivation that produced $N=3$ solved one specific problem: given a fixed starting position and velocity, find the control history that hits the target exactly while spending the least energy. That is a calculus-of-variations problem for one initial condition, not a guidance *law* — the general machinery the optimal control module built for exactly this situation is the finite-horizon linear-quadratic regulator, which produces a feedback law valid from any state at any remaining time, not an answer tied to one starting point. Posing terminal guidance the way that module poses every tracking problem does something the earlier derivation could not: it reveals $N=3$ as one extreme of a whole family of guidance laws, reached by pushing one weight in a quadratic cost to infinity.

## The general problem

Let $\mathbf{x} = (x_1, x_2)$ be relative position and velocity (the same double integrator as before, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$ with $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = \begin{pmatrix}0\\1\end{pmatrix}$), and pose the cost the optimal control module's own finite-horizon problem uses, with no running state cost and a *soft*, tunable terminal penalty on the miss alone:

$$
J = \frac12\int_0^{t_{go}} u^2\,d\tau + \frac12\,q_f\,x_1(t_{go})^2 .
$$

$q_f$ is a single number the designer chooses: how much a unit of terminal miss is worth, in the same units as control effort. This is the optimal control module's $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{Q}_f,\mathbf{R})$ machinery with $\mathbf{Q}=\mathbf{0}$, $R=1$, and $\mathbf{Q}_f = \operatorname{diag}(q_f, 0)$ — terminal velocity carries no weight at all, because this is still the intercept problem, not the soft-landing one two lessons ahead. Solving it the way that module solves any such problem gives a **state feedback law**, $u^\star(\tau) = -k_1(\tau)x_1 - k_2(\tau)x_2$, valid at every instant from whatever state the vehicle actually occupies — a genuinely different, more general object than a control history computed once for one starting point.

## Solving it in closed form

The same Pontryagin argument as the minimum-energy derivation applies, with one change: the terminal condition on $\lambda_1$. Before, $x_1(t_{go})$ was pinned exactly and $\lambda_1$ was determined by that hard constraint. Now $x_1(t_{go})$ is free but penalized, so the terminal condition becomes $\lambda_1(t_{go}) = q_f\,x_1(t_{go})$ — the costate at the end must equal the marginal cost of the penalty there — while $\lambda_2(t_{go}) = 0$ still holds, terminal velocity being unweighted exactly as before. Since $\lambda_1 = c_1$ is constant throughout (as in the earlier derivation), this gives $c_1 = q_f\,x_1(t_{go})$, and using $x_1(t_{go}) = x_1(0) + x_2(0)t_{go} - c_1t_{go}^3/3$ (the same integrated dynamics as before) to eliminate $x_1(t_{go})$:

$$
c_1\left(\frac{1}{q_f} + \frac{t_{go}^3}{3}\right) = x_1(0) + x_2(0)t_{go} = -ZEM,
$$

so $c_1 = -ZEM/(1/q_f + t_{go}^3/3)$, and the command at the current instant, $u^\star(0) = -c_1 t_{go}$, works out to the feedback gains

$$
k_1(\tau) = \frac{3q_f\tau}{3+q_f\tau^3}, \qquad k_2(\tau) = \frac{3q_f\tau^2}{3+q_f\tau^3}, \qquad u^\star = -k_1(\tau)x_1 - k_2(\tau)x_2 .
$$

::: key The LQ guidance gain
$$
k_1(\tau) = \frac{3q_f\tau}{3+q_f\tau^3}, \qquad k_2(\tau) = \frac{3q_f\tau^2}{3+q_f\tau^3},
$$
valid from any current state $(x_1,x_2)$ with $\tau = t_{go}$ remaining. $q_f$ prices a unit of terminal miss against a unit of control effort; it is the single knob that moves the whole family of guidance laws this problem produces.
:::

## PN as the infinite-weight limit

Push $q_f \to \infty$ — an infinitely expensive miss is exactly a hard constraint, "hit the target, whatever the cost." Dividing numerator and denominator by $q_f$:

$$
k_1(\tau) = \frac{3\tau}{3/q_f+\tau^3} \xrightarrow{q_f\to\infty} \frac{3}{\tau^2}, \qquad k_2(\tau) = \frac{3\tau^2}{3/q_f+\tau^3} \xrightarrow{q_f\to\infty} \frac{3}{\tau}.
$$

$u^\star = -3x_1/\tau^2 - 3x_2/\tau = -3(x_1+x_2\tau)/\tau^2 = 3\,ZEM/\tau^2 = 3V_c\dot\lambda$ — exactly the $N=3$ law two lessons derived by an entirely different route. **Proportional navigation with $N=3$ is the infinite-terminal-weight limit of the general linear-quadratic guidance problem** — not a separate result that happens to agree with the earlier one, but the same optimization, posed more generally, specialized back down by taking a hard constraint as the limit of an infinitely expensive soft one.

::: example The gain converging to PN as q_f grows
$$
\begin{aligned}
q_f = 10:&\quad k_1(3) = \frac{3(10)(3)}{3+10(27)} = 0.32967, \quad \text{vs. } 3/3^2 = 0.33333\\
q_f = 10^3:&\quad k_1(3) = \frac{3(10^3)(3)}{3+10^3(27)} = 0.33330, \quad \text{vs. } 0.33333\\
q_f = 10^6:&\quad k_1(3) = 0.333333, \quad \text{agreeing with } 1/3 \text{ to six figures}
\end{aligned}
$$

```python
def k1(qf, tau):
    return 3*qf*tau / (3 + qf*tau**3)
for qf in (10, 1e3, 1e6, 1e10):
    print(qf, k1(qf, 3.0), 3/3.0**2)
# 10 0.32967032967032966      0.3333333333333333
# 1000.0 0.33329630...        0.3333333333333333
# 1000000.0 0.333333...       0.3333333333333333
# 10000000000.0 0.333333...   0.3333333333333333
```

The same convergence holds at every $\tau$, not only this one — this problem's Riccati equation, solved directly as a matrix differential equation the way the optimal control module solves any finite-horizon LQR problem, reproduces this exact closed form and the exact same $q_f\to\infty$ limit, confirming the algebra above two independent ways.
:::

## What a finite weight buys

PN's "hit exactly, at any control cost" is not always the right question. A designer who knows the seeker, autopilot lag or actuator limits already put a floor under the achievable miss gains nothing from a law that keeps demanding more effort to shave that floor arbitrarily thin — and the general LQ formulation, unlike PN itself, has a dial for exactly this.

::: example Softening the terminal weight
Starting from $x_1(0) = 200\,\mathrm{m}$, $x_2(0) = -3\,\mathrm{m/s}$, $t_{go} = 12\,\mathrm{s}$ (so $ZEM = -164\,\mathrm{m}$ — a large predicted miss, deliberately far from a free hit), integrate the closed-loop system under each gain schedule and measure the achieved miss and total control effort:

| $q_f$ | Final miss $\lvert x_1\rvert$ | Control effort $\int u^2\,d\tau$ |
| --- | --- | --- |
| $0.01$ | $24.253\,\mathrm{m}$ | $33.905$ |
| $0.1$ | $2.796\,\mathrm{m}$ | $45.116$ |
| $1$ | $0.284\,\mathrm{m}$ | $46.533$ |
| $10$ | $0.028\,\mathrm{m}$ | $46.678$ |
| $\infty$ (PN) | $0.000\,\mathrm{m}$ | $46.694$ |

The hard-constraint effort matches the closed form exactly: $3\,ZEM^2/t_{go}^3 = 3(164)^2/12^3 = 46.694$. The shape of the trade is the point: going from $q_f=1$ to $q_f=\infty$ buys the *last* $0.284\,\mathrm{m}$ of accuracy for barely $0.16$ more units of effort — under half a percent — while going from $q_f=0.01$ to $q_f=1$ buys most of the accuracy improvement (from $24\,\mathrm{m}$ down to under a third of a metre) for $37\%$ more effort. Once $q_f$ is large enough that the terminal weight already dominates the trade, pushing it the rest of the way to "PN exactly" is nearly free; the real decision is whether $q_f$ is anywhere near that regime at all.
:::

::: warning PN is not "wrong" to demand a hard hit — it is a specific choice
Nothing about the LQ formulation says $q_f=\infty$ is a mistake. Where a genuine, uncompromising intercept is the requirement, the infinite-weight limit is exactly the right model and PN is exactly its guidance law. The formulation matters when that assumption should be questioned — when sensor noise or actuator limits mean "hit exactly" was never achievable anyway, and a finite $q_f$ can be chosen deliberately rather than discovering the trade-off by accident after the fact.
:::

## Check yourself

::: check
Write the general LQ guidance cost this lesson poses, and explain what the two limits $q_f \to 0$ and $q_f \to \infty$ mean physically.
:::

::: answer
$J = \tfrac12\int_0^{t_{go}}u^2\,d\tau + \tfrac12 q_f x_1(t_{go})^2$. As $q_f\to0$, a terminal miss costs nothing at all, so the minimum-energy answer is to apply no control whatsoever and coast unpowered — the gains $k_1,k_2\to0$ confirm this directly. As $q_f\to\infty$, any nonzero terminal miss is infinitely costly, which is exactly a hard constraint "hit the target regardless of effort," and the gains converge to $3/\tau^2,\ 3/\tau$ — proportional navigation with $N=3$.
:::

::: check
Using $k_1(\tau) = 3q_f\tau/(3+q_f\tau^3)$ and $k_2(\tau) = 3q_f\tau^2/(3+q_f\tau^3)$, find both gains for $q_f = 200$, $\tau = 4\,\mathrm{s}$.
:::

::: answer
Denominator: $3 + 200(4^3) = 3+12\,800 = 12\,803$. $k_1 = 3(200)(4)/12\,803 = 2400/12\,803 = 0.18746$. $k_2 = 3(200)(16)/12\,803 = 9600/12\,803 = 0.74982$.
:::

::: check
This lesson reproduces exactly the $N=3$ result the earlier minimum-energy lesson derived. In what precise sense is this lesson's derivation more general, given that the answer is identical?
:::

::: answer
The earlier derivation solved for the optimal control *history* $u^\star(\tau)$ for one specific, fixed starting state, by calculus of variations — a different history would need to be recomputed from scratch for any other starting state. This lesson instead derives a *feedback gain* $k_1(\tau), k_2(\tau)$ that depends only on how much time remains, not on the current state at all, and can be applied to *any* current $(x_1,x_2)$ to get the optimal command from there onward. The earlier result is recovered as this feedback law evaluated once, at one particular state, in the $q_f\to\infty$ limit — a special case of a law that also covers every other state and every finite $q_f$ in between.
:::

::: check
In the softening-weight worked example, why does control effort rise steeply between $q_f=0.01$ and $q_f=1$ but barely at all between $q_f=1$ and $q_f=\infty$?
:::

::: answer
At very small $q_f$, the terminal penalty is cheap relative to control effort, so the optimizer accepts a large miss and spends little — there is a great deal of "slack" to give up as $q_f$ grows from there, so effort rises quickly to buy back most of the accuracy. Once $q_f$ is large enough that the terminal penalty already dominates the trade (around $q_f=1$ here, where the miss is already under a third of a metre against a $164\,\mathrm{m}$ starting error), the optimizer is already committed to nearly the full-effort trajectory; increasing $q_f$ further can only ask it to close the last, already-small residual, which costs comparatively little extra energy. The shape is a general feature of a convex trade-off approaching a hard constraint, not specific to this particular problem.
:::

::: check
Map this lesson's problem onto the optimal control module's own $(\mathbf{A},\mathbf{B},\mathbf{Q},\mathbf{Q}_f,R)$ notation for a finite-horizon LQR problem.
:::

::: answer
$\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B}=\begin{pmatrix}0\\1\end{pmatrix}$ (the double integrator). $\mathbf{Q} = \mathbf{0}$ — no cost is charged for being off-target *during* the flight, only at the end, which is what makes this a terminal-guidance problem rather than a trajectory-tracking one. $R = 1$, a plain control-effort cost with no separate weighting. $\mathbf{Q}_f = \operatorname{diag}(q_f, 0)$ — the terminal weight falls entirely on miss (the first state) and not at all on terminal closing rate (the second), consistent with an intercept objective rather than the soft-landing problem two lessons ahead, where both would be weighted.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| General LQ guidance cost | $J = \tfrac12\int u^2\,d\tau + \tfrac12 q_f x_1(t_{go})^2$; $\mathbf{Q}=\mathbf{0}$, $R=1$, $\mathbf{Q}_f=\operatorname{diag}(q_f,0)$ |
| Feedback gains | $k_1(\tau) = 3q_f\tau/(3+q_f\tau^3)$, $k_2(\tau)=3q_f\tau^2/(3+q_f\tau^3)$ |
| $q_f \to 0$ | No control at all; coast |
| $q_f \to \infty$ | $k_1\to3/\tau^2$, $k_2\to3/\tau$: proportional navigation, $N=3$ exactly |
| Interpretation | PN is the hard-constraint (infinite-weight) limit of a general, tunable trade between terminal accuracy and control effort |

PN's law is fixed once the target is assumed non-maneuvering and the miss weighted infinitely. The next lesson turns to the guidance problem where the terminal condition is richer still — both position and velocity constrained, for a landing rather than an intercept — and derives the feedback law that results.
