---
id: l05-anchor-b-powered-descent
title: "Anchor B: powered-descent guidance and its Monte Carlo"
minutes: 20
covers:
  - "anchor project B — powered descent guidance with a landing accuracy Monte Carlo"
---

A powered-descent guidance project is judged on almost nothing a rendered landing animation can show. The formulation, the constraints actually enforced, and the behavior across a dispersion set are what an interviewer probes, and all three are invisible in a smooth trajectory plot. This lesson covers what the project needs to contain to answer that probing, using the convex-guidance formulation this curriculum develops in full elsewhere, and closes with a worked verification exercise built from a simpler stand-in problem — because the exercise of checking a solver's output, rather than trusting it, is exactly the skill this anchor project has to demonstrate.

## What the project has to contain

The credible version of this project follows the formulation the convex-guidance material in this curriculum develops: a minimum-fuel or minimum-landing-error problem with a thrust lower bound (made convex by lossless convexification, not dropped), a glide-slope constraint, a pointing constraint, and — for the case where the target may not be reachable at all — the two-stage G-FOLD structure that first finds a feasible landing point before minimizing fuel to it. Reimplementing this formulation and reporting real numbers from it is a stronger anchor project than almost anything else in this module, precisely because the reference paper this module cites is the actual basis of flown descent guidance, and reproducing its central result yourself is direct evidence you understand it rather than having read about it.

Three things separate a credible version of this project from an animation with a trajectory that happens to reach the ground. First, a stated formulation: which cost, which constraints, and which of them were relaxed rather than dropped — a thrust lower bound handled by lossless convexification is a solved problem; a thrust lower bound quietly ignored is a different, much weaker project wearing the same plot. Second, verified constraint satisfaction: every reported trajectory should be checked, after solving, against the original bounds — thrust magnitude, glide slope, pointing — not merely trusted because the solver returned an "optimal" status. Third, a landing-accuracy Monte Carlo over dispersed initial conditions, reporting a distribution, not a single case.

::: key
A powered-descent guidance project is credible when it states its formulation precisely — cost, constraints, and which constraints were convexified rather than dropped — verifies constraint satisfaction on the returned trajectory rather than trusting the solver's status flag, and reports a landing-accuracy distribution over a dispersion set rather than one nominal run.
:::

## Verifying a solver's output: a worked case where trusting it would have been wrong

The single most valuable habit this project can demonstrate is not accepting a solver's answer at face value. The following uses a deliberately simplified problem — a one-dimensional, vertical-only, fixed-mass minimum-fuel landing, solved as a linear program rather than the real second-order-cone problem, because it can be shown in full and solved with tools available anywhere — to make a point that applies just as much to the real formulation: know what your solver actually computed, not what you expected it to.

The setup: null altitude and velocity from $h_0=500\,\mathrm{m}$, $v_0=-60\,\mathrm{m/s}$ to $h_f=v_f=0$ in a fixed $t_f=20\,\mathrm{s}$, with net vertical acceleration (thrust-to-mass minus gravity) bounded $u\in[6,14]\,\mathrm{m/s^2}$, minimizing $\int u\,dt$ as a fuel proxy, discretized into 40 steps and solved as a linear program.

::: example A solver's answer, checked two independent ways
The solver returns a feasible trajectory with objective value $256.200\,\mathrm{m/s}$, thrust bounds respected throughout, and a control history that is mostly saturated at the $14\,\mathrm{m/s^2}$ upper bound — but with two isolated interior values (about $9.7$ and $10.7\,\mathrm{m/s^2}$) that do not look like the clean bang-bang shape a minimum-effort problem is often expected to have.

**Check one, re-simulation.** Forward-propagating the returned control sequence independently, outside the solver, reproduces the solver's own state trajectory to $4\times10^{-12}\,\mathrm{m}$ — confirming the dynamics constraints were actually satisfied as claimed, not merely reported as satisfied.

**Check two, an analytic cross-check on the objective itself.** Because this problem's velocity dynamics are $\dot v = u - g$ with no other appearance of $u$, integrating gives $\int u\,dt = (v_f - v_0) + g\,t_f$ exactly, for *any* trajectory meeting the velocity boundary conditions — here $(0-(-60)) + 9.81\times20 = 256.200\,\mathrm{m/s}$, matching the solver's reported objective to every reported digit. That match reveals something the odd-looking control history alone would not have: in this particular decoupled formulation, the fuel-proxy objective is fixed by the velocity boundary conditions alone, independent of the trajectory's shape — which is exactly why the solver returned an unremarkable-looking, non-unique interior segment rather than a clean bang-bang profile. Many different control histories achieve the identical cost here, and the solver simply returned one of them.
:::

The lesson is not that the solver was wrong — it was not. The lesson is that an odd-looking result taken at face value could easily have been reported as "the optimizer found an interesting bang-off-bang strategy," a specific, confident, and wrong explanation, when the real explanation was a property of this simplified formulation's own structure. The real coupled problem — thrust bounded in *magnitude*, not per-axis, with downrange and altitude linked through a shared thrust vector — does not have this particular degeneracy, which is itself a reason the real formulation, not this toy, belongs in the anchor project; this exercise is about the checking habit, not the formulation.

::: warning
"The solver returned status optimal" is not verification. A returned status confirms the solver's internal stopping criterion was met, not that the formulation correctly represents the problem or that the result means what you assume it means. Re-simulate the returned trajectory independently, and where a closed-form check on part of the answer exists — as the boundary-condition identity above did — use it.
:::

## The landing-accuracy Monte Carlo

A single nominal descent proves the formulation is implementable. A dispersion campaign over initial altitude and velocity error, run through the same solve, is what turns the project into evidence about performance under uncertainty rather than a demonstration that the solver runs once.

::: example A dispersion campaign that finds its own limits
Running the same fixed-final-time landing problem across 500 cases with $h_0\sim\mathcal N(500,15^2)\,\mathrm{m}$ and $v_0\sim\mathcal N(-60,3^2)\,\mathrm{m/s}$, 20 cases ($4.0\%$) return infeasible — no trajectory exists meeting both terminal conditions within the actuator bounds in exactly $20\,\mathrm{s}$. Among the 480 feasible cases, the fuel-proxy cost ranges from $248.2$ to $262.4\,\mathrm{m/s}$, with the mean tracking the closed-form $g\,t_f - v_0$ relation from the previous check almost exactly — meaning the spread in this particular metric is explained almost entirely by the velocity dispersion, not by the altitude dispersion, which instead governs *feasibility*.

That infeasible fraction is the campaign's most important number, not its footnote. A fixed-final-time formulation has no way to signal "give me a little more time" — it simply fails outright once the boundary conditions cannot be met in the time allotted, which is exactly the practical problem the G-FOLD architecture's first, feasibility-seeking stage exists to solve. A dispersion campaign that reports only the mean landing accuracy over the cases that happened to converge, with no mention of the ones that did not, is hiding its most informative result.
:::

An interviewer asking about this project will want the infeasible fraction as readily as the mean accuracy, and will want to know whether the formulation used a fixed or free final time and why — a fixed-time formulation is simpler to implement and exactly the kind of choice this exercise shows going wrong under dispersion, while a free-final-time or two-stage architecture is more robust and correspondingly more work. Either choice is defensible if you can say which one you made and what it costs.

## What the interviewer asks, and what the project needs ready

Four questions recur on this project specifically. Why is the thrust lower bound handled the way it is — the answer should name lossless convexification and, ideally, a check that the relaxation was tight on your own solved trajectories, not only cite that it exists in theory. What happens when the target is unreachable — a project with only a single-stage, fixed-time formulation should say so plainly as a limitation, exactly as the dispersion campaign above surfaced. What is the worst-case landing error and propellant margin, not only the mean. And which constraints were actually enforced in the implementation versus assumed — a glide-slope or pointing constraint that exists in the write-up's equations but was never actually coded into the solver is a gap a reviewer will find by asking for the constraint matrix.

## Check yourself

::: check
A powered-descent project's write-up states the cost, the dynamics, and the thrust bounds, but does not say whether the thrust lower bound was convexified or simply dropped from the formulation. Why does this omission matter more than it might first appear to?
:::

::: answer
A dropped lower bound and a losslessly convexified one produce superficially similar-looking trajectories but represent entirely different levels of engineering: dropping the bound solves an easier, physically wrong problem (real engines cannot throttle to zero thrust while still firing), while lossless convexification solves the actual non-convex problem exactly, with a theorem guaranteeing no fuel or feasibility is lost in the relaxation. A write-up that does not distinguish which one happened lets a reviewer assume the stronger claim by default, and the gap surfaces the moment they ask what enforces the lower bound — exactly the kind of question this project should have already answered in writing.
:::

::: check
In the worked linear-program example, re-simulating the solver's returned control sequence independently matched the solver's own state trajectory to $4\times10^{-12}\,\mathrm{m}$. What specifically does this check confirm, and what would it have caught if the solver's internal dynamics constraints had been coded with an error?
:::

::: answer
It confirms that the trajectory the solver reports as satisfying the dynamics actually does, when propagated independently outside the solver's own machinery — a check on whether the optimization's constraint equations were the right ones, not merely whether the solver terminated. If the dynamics constraints inside the linear program had been coded with an error — a wrong sign, a missing $\Delta t^2/2$ term — the solver would still return a status of "optimal" for whatever (wrong) problem it was actually given, and only an independent re-simulation against the true dynamics would reveal that the returned trajectory does not actually reach the terminal state under the real equations of motion.
:::

::: check
Explain why the fuel-proxy cost in the Monte Carlo example tracked the velocity dispersion almost exactly but not the altitude dispersion, using the closed-form relation derived from the dynamics.
:::

::: answer
Because the velocity dynamics $\dot v = u - g$ contain no dependence on altitude, integrating over the fixed final time gives $\int u\,dt = (v_f-v_0)+g\,t_f$ for any feasible trajectory — a relation entirely in terms of the velocity boundary condition and the fixed time, with no $h_0$ term anywhere in it. Altitude dispersion therefore cannot move this particular cost metric at all in a feasible case; what it does instead is determine whether a feasible trajectory exists in the fixed time given the actuator bounds, which is why altitude dispersion showed up in the infeasible fraction rather than in the cost spread.
:::

::: check
Why does this lesson treat the dispersion campaign's infeasible-case fraction as more important to report than the mean landing accuracy among the cases that converged?
:::

::: answer
A fixed-final-time formulation fails outright, with no partial or degraded answer, once the boundary conditions cannot be met in the allotted time — so the infeasible fraction is a direct measurement of how often the guidance law as implemented would have no answer at all for a real dispersed case, which is a more operationally serious finding than how accurately it lands in the cases where it happens to work. Reporting only the mean over converged cases silently discards exactly the cases most likely to represent a real operational failure, which is the opposite of what a dispersion campaign is for.
:::

::: check
An interviewer asks whether your powered-descent project's formulation uses a fixed or free final time, and why that choice matters. What should a well-prepared answer include?
:::

::: answer
It should name which one was implemented, state the tradeoff honestly — a fixed final time is simpler to formulate and solve but can go infeasible outright under dispersion in position or velocity, exactly as this lesson's own campaign showed at a 4% rate, while a free-final-time or two-stage G-FOLD-style architecture recovers a feasible answer across a wider range of dispersed conditions at the cost of a more involved formulation — and connect the choice to evidence already in the write-up, such as the project's own infeasible-case count, rather than asserting the tradeoff abstractly.
:::

## Summary

| Item | What it needs |
| --- | --- |
| Formulation | Stated cost and constraints; thrust lower bound convexified, not dropped, and said so explicitly |
| Constraint verification | Every returned trajectory re-checked against the original bounds, not trusted from solver status alone |
| Solver-output check | Independent re-simulation, plus any closed-form identity available — this lesson's example matched to $10^{-12}$ and confirmed an objective value exactly |
| Monte Carlo | Landing-accuracy distribution and propellant margin over dispersed initial conditions |
| Most-important number | The infeasible-case fraction, not only the mean accuracy among converged cases |
| Role family | Entry, descent and landing guidance |

The next lesson turns to a different kind of correctness question — not whether a solver's output satisfies its constraints, but whether an estimator's reported uncertainty can be trusted at all — in the third anchor project, the multiplicative quaternion EKF.
