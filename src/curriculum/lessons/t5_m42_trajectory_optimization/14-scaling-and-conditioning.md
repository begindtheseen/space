---
id: l14-scaling-and-conditioning
title: "Scaling and conditioning: non-dimensionalise before you solve anything"
minutes: 18
covers:
  - "Scaling and conditioning: non-dimensionalising states, controls and constraints before you solve anything"
---

Every orbit-transfer example in this module has been solved in units where the radius sits near $1.0$, the velocities near $0.9$ to $1.0$, and the flight time near $12$. That was never cosmetic. This lesson makes explicit what every earlier one quietly assumed and shows, on the identical problem, what happens the moment that assumption is dropped.

## Why the units a solver sees are not a formality

An NLP solver's internal machinery — line searches, trust-region radii, quasi-Newton Hessian updates, convergence tests on the gradient norm — implicitly treats every decision variable and every constraint residual as comparable in scale. A radius in metres ($\sim10^7$), a steering angle in radians ($\sim1$), and a flight time in seconds ($\sim10^4$), packed into the same decision vector, force a single step-size and a single convergence tolerance to serve wildly different physical quantities at once: a step small enough not to overshoot the angle is invisible to the radius, and a step large enough to move the radius meaningfully sends the angle spinning. The constraint Jacobian inherits the same problem — its entries mix derivatives with respect to metres against derivatives with respect to radians — and a matrix whose entries span many orders of magnitude is, by the standard definition, ill-conditioned: small numerical errors in one direction get amplified far more than in another, and the linear solves at the heart of every Newton-type step degrade accordingly.

::: key The fix, in one line
Non-dimensionalise: choose a characteristic length, time, mass (and, from those, velocity, acceleration, force) so that every state, control and constraint residual the solver actually sees sits at order unity — not because the physics cares about units, but because the solver's numerical linear algebra does.
:::

::: example The same transfer, only the units changed
The minimum-time orbit transfer solved by Hermite-Simpson collocation several lessons ago — $r_0=7000\,\mathrm{km}\to r_1=9000\,\mathrm{km}$, $T_{\max}=100\,\mathrm{N}$, converging from a naive guess in under two seconds — used units nondimensionalised by $L=r_0$ and $T_U=\sqrt{r_0^3/\mu}=927.64\,\mathrm{s}$, giving $r\sim1.0$–$1.29$, $v\sim0.88$–$1.0$, $t_f\sim12.37$. Transcribing the **identical physical problem**, same dynamics, same targets, same solver, in raw SI units — $r$ in metres ($7\times10^6$ to $9\times10^6$), $v$ in metres per second ($\sim6655$ to $7546$), $t_f$ in seconds ($\sim11\,475$) — and starting from the equivalent straight-line guess:

| | Nondimensional | Raw SI |
| --- | --- | --- |
| Converged? | Yes | No — iteration limit reached |
| Final constraint violation | $\sim10^{-13}$ | $2.6\times10^{-5}$ |
| Wall time | $\approx1.7\,\mathrm{s}$ | $57.4\,\mathrm{s}$ (300 iterations, still not converged) |
| Reported $t_f$ | $12.372090$ (correct, to the digits shown) | $31\,941.5\,\mathrm{s}$ — wrong by nearly $3\times$ |

Nothing about the physics changed. The Jacobian of the constraints, evaluated at the matching initial guess in each case, has condition number $1360$ in the nondimensional units and $251\,820$ in raw SI — a factor of $185$ worse from unit choice alone, on the very first evaluation, before the solver has taken a single step. The same solver, the same tolerances, the same problem, and one of the two never gets anywhere near an answer.
:::

::: example Why the descent problem never seemed to need this lesson
Every powered-descent transcription in this module was solved in plain SI units — altitude in metres ($\sim1500$), velocity in metres per second ($\sim75$), mass in kilograms ($\sim1000$), thrust in newtons ($\sim6000$) — and converged without incident. Measuring its constraint Jacobian's condition number at a matching initial guess gives $3804$: worse than the orbit transfer's deliberately nondimensionalised $1360$, but nowhere near its raw-SI $251\,820$, because the descent problem's own physical quantities happen to span only about three orders of magnitude ($10^0$ to $10^{3.8}$) rather than the seven the orbit transfer's radius-versus-angle mismatch produces. Good conditioning was not earned by any scaling discipline in the descent examples — it was a coincidence of the specific numbers chosen, and a descent problem posed instead in millimetres of altitude and grams of propellant, or one starting from a much higher altitude, would not be so lucky. Relying on a problem happening to be well scaled is not a substitute for choosing scales deliberately; it is a bet that the next problem will be equally forgiving.
:::

## Choosing the scales

The recipe used silently throughout this module: a **length scale** $L$ set by a natural size in the problem (the initial orbit radius, an initial altitude), a **time scale** $T_U$ set by a natural dynamical rate (an orbital period, $\sqrt{L^3/\mu}$, or a mission-duration estimate), and a **mass scale** $M$ set by the vehicle's own mass ($m_0$). Every other unit follows by dimensional consistency: velocity by $L/T_U$, acceleration by $L/T_U^2$, force by $ML/T_U^2$, specific impulse's characteristic exhaust velocity $c$ by the same $L/T_U$. Divide every state, control and constraint by its matching scale before handing anything to the solver, and multiply back only when reporting a physical answer — exactly the bookkeeping every worked orbit-transfer example in this module has been doing without calling attention to it until now.

A second, related discipline: **constraint residuals should be order-unity too**, not merely the variables. A boundary condition written as $r(t_f) - r_1 = 0$ in metres is itself a quantity of order $10^6$ before it converges to zero — nondimensionalising the states automatically nondimensionalises this residual as well, which is part of why the fix above is a single, consistent choice rather than three independent ones for variables, constraints and objective separately.

::: warning Scaling has to be chosen once, up front, not tuned reactively after a failure
It is tempting to treat a non-converging solve as a signal to loosen tolerances or increase the iteration budget, as the unscaled run above would need many more iterations and a looser tolerance to eventually crawl toward an answer, if it gets there at all. That treats the symptom, not the cause, and it typically produces an answer that is less accurate for more compute, not a fix. The scaling decision belongs in the problem setup — before the first solve is attempted, not as a rescue operation after the fifth failed one — because a well-scaled problem does not merely converge faster, it converges to a tighter tolerance in fewer iterations at no extra cost, as the nondimensional column of the table shows directly.
:::

## What good scaling does not fix

Non-dimensionalising a badly *conditioned physical problem* — one with a genuine, structural sensitivity, such as the exponentially-amplifying costate dynamics of an indirect shooting method several lessons ago, or a state whose dynamics are naturally stiff — does not remove that sensitivity; it removes the *artificial*, unit-choice-driven conditioning on top of it, which is a different and unrelated source of difficulty. The Mars descent problem's own drag-and-mass-varying Goddard relative, referenced when singular arcs were introduced, is a case where getting the scaling right is necessary before the problem is even numerically approachable at all — an under-scaled formulation with altitude in metres (thousands), mass in kilograms (hundreds to a thousand) and thrust in newtons (tens of thousands) compounds the ordinary difficulty of a singular-arc problem with exactly the kind of conditioning failure demonstrated above, and separating "is this hard because of the physics" from "is this hard because of the units" is the first diagnostic step whenever a trajectory NLP refuses to behave, taken up directly as its own topic two lessons from now.

## Check yourself

::: check
Why does mixing a state in metres ($\sim10^7$) with a control in radians ($\sim1$) hurt a solver's *line search*, specifically, and not merely "the numbers being big"?
:::

::: answer
A line search picks a single step length $\alpha$ applied to a whole search direction, trading off improvement against constraint violation along that one direction. If the search direction has a component of size $10^7$ in the radius and a component of size $1$ in the angle, the same $\alpha$ that makes sense for the angle (say $\alpha\sim0.1$, a $10\%$ change) is utterly negligible for the radius, and an $\alpha$ that moves the radius meaningfully sends the angle far outside any region where the local quadratic model of the cost is trustworthy. There is no single step length that serves both scales well simultaneously, which is a structural problem with the line search itself, not merely an aesthetic complaint about large numbers appearing in the output.
:::

::: check
The condition number of the constraint Jacobian was $185\times$ worse in raw SI units than in the nondimensional ones, measured at the *same* initial guess. Why does a worse-conditioned Jacobian translate into slower or failed convergence, mechanically?
:::

::: answer
Every Newton-type step in a constrained solver requires solving a linear system built from the constraint Jacobian (or its KKT augmentation) to find the search direction. A high condition number means that system is close to singular in a numerical sense — small errors in the right-hand side (round-off, or the finite-difference approximation the solver used to build the Jacobian in the first place) get amplified by a factor on the order of the condition number when solving for the step, here up to roughly $2\times10^5$ times. A step direction computed from a linear solve that unreliable is a poor approximation to the true Newton direction, and a solver taking poor steps either converges very slowly (many iterations spent correcting for a bad direction) or, past some point, fails to make progress at all — precisely the "iteration limit reached" outcome measured directly.
:::

::: check
A colleague argues that since modern solvers use adaptive step sizes and internal scaling heuristics, manual non-dimensionalisation should not matter much in practice. What does the worked example say about that argument?
:::

::: answer
The worked example used the identical solver, with its own internal heuristics, on the identical problem, changing only the units the problem was posed in — and the outcome was the difference between converging in $1.7\,\mathrm{s}$ and failing to converge at all after $57\,\mathrm{s}$. Internal solver heuristics can help at the margins, but they operate on the problem as handed to them; they cannot fully undo a genuine four-to-five-order-of-magnitude spread across a decision vector's components, because the heuristics themselves are typically simple diagonal rescalings that do not know the problem's structure the way a modeller choosing physically meaningful scales does. The argument is not wrong that solvers try to help — it is wrong that trying is the same as succeeding, and this problem is direct evidence it is not.
:::

::: check
Why does nondimensionalising the *states* automatically nondimensionalise the *constraint residuals* as well, rather than needing a separate scaling decision for each?
:::

::: answer
Every constraint in this module's transcriptions — a defect, a boundary condition — is built as an algebraic combination of state and control values (differences, weighted sums via a quadrature rule), so once every state and control entering that combination has been divided by its characteristic scale, the resulting residual is automatically expressed in those same consistent units rather than in the raw physical ones. A boundary condition $r(t_f)-r_1=0$ becomes $r_n(t_f)-r_{1,n}=0$ purely by substituting the already-scaled variables — there is no additional, independent choice to make for the constraint, which is exactly why one consistent set of length, time and mass scales, chosen once, propagates correctly through the whole transcription rather than needing to be re-derived constraint by constraint.
:::

## Summary

| Object | Statement |
| --- | --- |
| Why scaling matters | Solver line searches, Hessian updates and convergence tests implicitly assume order-unity, comparable quantities |
| The fix | Choose $L$, $T_U$, $M$ from the problem's own natural scales; derive velocity, acceleration, force, $c$ from them; divide every variable and residual before solving |
| Measured example | Orbit transfer: nondimensional converges in $1.7\,\mathrm{s}$; raw SI fails after $57.4\,\mathrm{s}$, $300$ iterations, $t_f$ wrong by $3\times$ |
| Condition number | $1360$ (nondimensional) vs. $251\,820$ (raw SI), same initial guess — a factor of $185$ from units alone |
| Constraint residuals | Automatically scaled correctly once states and controls are, since residuals are built from them |
| What scaling does not fix | Genuine physical sensitivity (shooting's exponential amplification, a stiff or singular-arc problem) — a separate, structural issue |
| Discipline | Choose scales before the first solve; do not treat non-convergence as a tolerance problem to loosen |

The next lesson takes the opposite kind of shortcut — not fixing the numbers, but fixing the starting point, by warming up from an easier version of the same problem instead of a cold guess.
