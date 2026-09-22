---
id: l12-ilqr-shooting-flavoured
title: iLQR and DDP as the shooting-flavoured alternative
minutes: 18
covers:
  - Differential dynamic programming and iLQR as the shooting-flavoured alternative
---

The optimal control module derived iLQR and DDP in full — the backward Riccati-flavoured pass, the forward line search, the regularisation, a planar lander solved from a guess that started by crashing. None of that is repeated here; this lesson's job is to place the algorithm on the map this module has been drawing. iLQR never writes a defect constraint, never builds a sparse NLP, never asks a general-purpose solver for anything — every iteration simulates the nonlinear dynamics forward from a control sequence, exactly the definition of a shooting method three lessons ago. And yet it does not inherit the brittleness that made indirect shooting so hard to guess into. Understanding why is the payoff of putting every method side by side instead of learning each in isolation.

## Shooting in spirit, stable in practice

Indirect shooting's fragility, several lessons ago, came down to one structural fact: a costate error at $t_0$ propagates *forward* along the monodromy matrix's growing eigenvectors, amplifying by whatever the dynamics' least-stable direction does over the horizon. iLQR never propagates an error forward through the full horizon at all. Its backward pass computes the value derivatives $V_x,V_{xx}$ by recursion from $t_f$ back to $t_0$ — the same direction dynamic programming always runs, the *stable* direction, because the reciprocal-eigenvalue pairing of a Hamiltonian system means whichever direction the forward flow amplifies, the backward flow contracts. The forward pass that follows only ever rolls the *current best estimate* forward, corrected at every single step by the feedback gain $\mathbf{K}_k$ computed in that stable backward sweep — so a small model or initial-condition error at step $k$ is damped by $\mathbf{K}_k$ before it has any chance to compound into step $k+1$, rather than being carried, unopposed, all the way to $t_f$ the way a raw single-shooting rollout carries an error in its initial costate guess.

::: key Why iLQR sidesteps the shooting brittleness of indirect methods
It is shooting — every iterate is a forward-simulated, dynamically feasible trajectory, exactly like direct single shooting. It avoids single shooting's ill-conditioning because the correction at every step comes from a *backward* recursion (the contracting direction of the same Hamiltonian structure that makes forward-only shooting brittle) rather than from a single costate guessed once at $t_0$ and never corrected until the whole horizon has played out.
:::

::: example An ascent, converged without ever guessing a costate
A vehicle ascending from rest, $m_0=1000\,\mathrm{kg}$, constant thrust $T_{\max}=15\,000\,\mathrm{N}$ ($I_{sp}=300\,\mathrm{s}$, so $c=2942.0\,\mathrm{m/s}$), steered by pitch angle $\theta(t)$ over a fixed $50\,\mathrm{s}$ burn, must approach a burnout state near $h=7000\,\mathrm{m}$, $v_x=400\,\mathrm{m/s}$, $v_h=120\,\mathrm{m/s}$ — a soft (quadratic) terminal cost on those three quantities plus a small running penalty on $\theta^2$ to keep the problem well posed, exactly iLQR's native problem shape from the optimal control module.

Starting from the laziest guess available — constant $30^\circ$ pitch for the entire burn, no shooting, no costate, no insight into the necessary conditions — the rollout alone lands at $h=5568\,\mathrm{m}$, $v_x=432.9\,\mathrm{m/s}$, $v_h=259.4\,\mathrm{m/s}$, cost $53\,332$. The backward-forward iteration needs no retries and no alternate starting guesses: cost falls to $1018$ after the first accepted step, to $376$ by iteration $5$, and settles at $290.58$ by iteration $115$, with the terminal state converging to $h=6973.5\,\mathrm{m}$, $v_x=362.5\,\mathrm{m/s}$, $v_h=151.8\,\mathrm{m/s}$ — close to, not exactly on, the target, because a soft quadratic terminal cost trades target accuracy against control effort rather than enforcing an exact terminal constraint, precisely as the optimal control module's own formulation does. Every one of those $115$ iterates is a complete, flyable trajectory; nothing about the process ever produced a state that could not be plotted on a map.
:::

## The value gradient really is the costate

The optimal control module's note on this algorithm asserted that the backward-propagated value gradient $V_x$ satisfies the Pontryagin conditions at convergence. That claim is checkable the same way the covector mapping theorem was checked for a direct transcription: compute $V_x$ at $k=0$ from the converged backward pass, and separately measure $\partial J^\star/\partial\mathbf{x}_0$ by re-running the entire iLQR solve at a perturbed initial condition and taking the finite difference — two calculations from completely different mechanics, one a value-derivative recursion, one a black-box re-optimisation.

::: example The value gradient, checked against a re-solved perturbation
For the ascent above, the converged backward pass gives $V_x(0) = (0,\ -1.34690,\ -7.4734,\ -60.976,\ 27.091)$ in the $(x,h,v_x,v_h,m)$ ordering — a genuine costate, with the same shadow-price reading as every costate in this module: the $h$-component says a metre of extra starting altitude changes the optimal cost by about $-1.347$. Re-running the full $115$-iteration iLQR solve twice more, once from $h_0=+1\,\mathrm{m}$ and once from $h_0=-1\,\mathrm{m}$, and taking the central difference of the converged cost,

$$
\frac{\Delta J^\star}{\Delta h_0} = -1.346633 \qquad\text{against}\qquad V_x(0)_{[h]} = -1.346901,
$$

agreement to four significant figures, obtained without either calculation knowing about the other. The value gradient an iLQR backward pass produces as a by-product of finding the control is not merely *analogous* to a costate; re-optimising from a perturbed starting point and comparing the resulting cost change is the most direct possible test of the shadow-price identity from an earlier lesson, and it passes.
:::

## What collocation still buys over this

Nothing above makes iLQR a replacement for direct transcription — it makes it the shooting-flavoured branch's genuinely useful member, not the exception to shooting's problems. Two structural gaps remain, both already named when the algorithm was first derived: hard constraints are not native to the backward pass — a throttle limit, a glide slope, a dynamic-pressure ceiling needs the box-constrained quadratic program, augmented-Lagrangian wrapper, or squashing function the optimal control module listed as extensions, each adding its own iteration or its own distortion near the bound. A collocation NLP handles exactly the same limit by adding one more inequality constraint at each node — declarative, not a change to the algorithm's structure, which is the concrete version of the advantage this module's exercises ask you to state in your own words. Second, iLQR's cost per iteration is linear in horizon length because it exploits the same banded, sequential structure a sparse NLP solver has to discover on its own — an advantage for iLQR, not a mark against it, and precisely why this family remains the standard choice for anything running inside a real-time loop, taken up directly in a later lesson.

::: warning A converged iLQR solve is a local answer on a nonconvex problem, same as every other method here
The ascent example converged cleanly from one lazy guess, which says this particular problem's cost landscape was forgiving from that starting point — it does not say every ascent problem is. iLQR carries every caveat the optimal control module attached to it: no certificate, no global optimum, a result that depends on the initial guess exactly as much as direct single shooting's does, only with a much larger basin of guesses that happen to work because the backward pass corrects a bad guess iteration by iteration rather than requiring it to be right from the start. A different lazy guess — pitched the wrong way entirely — can converge to a qualitatively different, and possibly worse, local answer, with nothing in the convergence log to flag it.
:::

## Check yourself

::: check
Both direct single shooting and iLQR simulate the nonlinear dynamics forward from a control sequence. Why does only one of them inherit single shooting's ill-conditioning?
:::

::: answer
Direct single shooting computes a Jacobian by chaining the effect of an early control all the way to $t_f$ with no intermediate correction — the sensitivity of the terminal state to $\mathbf{u}_0$ is whatever the raw forward propagation says it is, amplified over the entire horizon. iLQR's forward rollout applies a feedback correction $\mathbf{K}_k(\hat{\mathbf{x}}_k-\bar{\mathbf{x}}_k)$ at *every* step, computed from a backward pass that has already accounted for how the rest of the trajectory should respond — so a deviation introduced at step $k$ is actively pulled back toward the nominal trajectory at step $k+1$, rather than being left to compound. The forward simulation is the same mechanism in both cases; the presence or absence of a stabilising backward correction along the way is the entire difference.
:::

::: check
The ascent example's converged terminal state, $h=6973.5\,\mathrm{m}$, did not land exactly on the $7000\,\mathrm{m}$ target. Is that a sign iLQR failed to converge?
:::

::: answer
No — the formulation used a soft quadratic terminal cost, not a hard equality constraint, so the converged answer is the point where the marginal cost of closing the remaining $26.5\,\mathrm{m}$ gap in $h$ is exactly balanced against the marginal control effort spent doing so, given the specific weights $\mathbf{Q}_f$ and $R$ chosen. The iteration log shows cost decreasing monotonically and the terminal state settling to a fixed point over the last several dozen iterations (movement of well under a metre per five iterations by the end), which is exactly what convergence of a soft-cost problem looks like — a hard constraint would need the terminal weight driven to infinity, or an explicit equality constraint added the way the direct methods in this module do it, to land exactly on target.
:::

::: check
Suppose the ascent problem needed a hard limit on $\lvert\theta\rvert$ — the pitch cannot exceed some gimbal angle. State, without redoing the algebra, what changes in the iLQR backward pass versus what changes in a collocation transcription of the same problem.
:::

::: answer
In collocation, the change is one line: add $\theta_k \in[-\theta_{\max},\theta_{\max}]$ as a bound constraint at every node, handled by the same general-purpose NLP solver that was already handling every other constraint, with no change to the defect equations at all. In iLQR, the unconstrained minimisation $\mathbf{k}=-\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u$ inside the backward pass is no longer valid whenever it would push $\theta$ past the bound — the fix (control-limited DDP, from the optimal control module) replaces that closed-form step with a small box-constrained quadratic program solved at every single knot of every single backward pass, and any row of the feedback gain corresponding to a clamped input has to be zeroed out by hand. The constraint is native to one formulation and bolted onto the other, which is exactly the trade-off this lesson's discussion of collocation names directly.
:::

::: check
The value-gradient check found $V_x(0)$ and the finite-difference $\Delta J^\star/\Delta h_0$ agreeing to four significant figures using two full $115$-iteration re-optimisations. Why is this check more convincing than trusting the theoretical claim that $V_x$ is the costate on its own?
:::

::: answer
The theoretical claim follows from the backward-pass algebra at convergence, where $\mathbf{Q}_u=\mathbf{0}$ makes the recursion collapse to a pure value-propagation with no further approximation — correct, but it is a statement about the algorithm's internal bookkeeping, not an independent measurement. The finite-difference calculation treats the entire $115$-iteration iLQR solve as a black box, perturbs only its input ($h_0$) and measures only its output (the converged cost), with no access to $V_x$, $\mathbf{K}_k$ or any other internal quantity — if the two numbers agree, it is because the *actual optimised cost*, not merely the algorithm's self-reported derivative, responds to the perturbation exactly as $V_x(0)$ predicts. That is a check against reality (re-solving the problem) rather than a check against the algorithm's own internal consistency, which is the stronger of the two kinds of verification this module has used throughout.
:::

## Summary

| Object | Statement |
| --- | --- |
| iLQR's shooting character | Every iterate is a forward-simulated, dynamically feasible trajectory — the same definition as direct single shooting |
| Why it avoids brittleness | Backward Riccati-flavoured pass runs along the *contracting* direction of the Hamiltonian system; forward rollout is corrected by $\mathbf{K}_k$ at every step, not left to compound |
| Ascent example | Constant-$30^\circ$ guess, cost $53\,332\to290.58$ over $115$ iterations; terminal state converges to a fixed point, not exactly on target (soft cost) |
| Value gradient = costate | $V_x(0)_{[h]}=-1.34690$ vs. re-solved finite difference $-1.34663$: agreement to four significant figures |
| Constraints | Native and declarative in collocation (one bound per node); require control-limited DDP, augmented Lagrangian, or squashing in iLQR |
| Cost structure | iLQR: linear in horizon length, exploiting sequential structure directly. NLP solver: has to discover the same sparsity |
| Still true here | No certificate, no global optimum, guess-dependent — every caveat from the optimal control module carries over unchanged |

Everything so far has assumed the problem, once transcribed, is easy for a general solver to actually chew through. The next three lessons take that assumption apart: the sparsity structure a solver depends on, the scaling that decides whether it converges at all, and the warm-starting that gets it moving fast when the answer is already almost known.
