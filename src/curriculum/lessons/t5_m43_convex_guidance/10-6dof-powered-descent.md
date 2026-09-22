---
id: l10-6dof-powered-descent
title: A 6-DoF powered descent, run end to end
minutes: 24
covers:
  - 6-DoF powered descent with quaternion attitude inside the optimization
---

Every piece this module's second half built — linearisation, zero-order-hold discretisation of a time-varying system, virtual control, the trust region, the $\rho$ test — exists to be assembled once into a real solve. This lesson does that: a genuinely 6-DoF vehicle, attitude and angular rate as part of the state, run from a naive straight-line guess toward a soft, upright landing. It reports what actually happened, including the parts that did not go cleanly on the first attempt, because a module that has spent this long insisting on honest numbers over reassuring ones should not stop at the one lesson where the numbers are hardest to get.

## The model

The state carries fourteen numbers — position $\mathbf{r}$, velocity $\mathbf{v}$, log-mass $z$, attitude quaternion $\mathbf{q}$, body angular rate $\boldsymbol{\omega}$ — and the control carries four: mass-normalised thrust $\sigma$ and a commanded angular acceleration $\boldsymbol{\alpha}_{\text{cmd}}$. The dynamics, exactly as the successive-convexification introduction set them up:

$$
\dot{\mathbf{r}} = \mathbf{v}, \quad \dot{\mathbf{v}} = \mathbf{R}(\mathbf{q})(0,0,\sigma)^\top + \mathbf{g}, \quad \dot z = -\alpha\sigma, \quad \dot{\mathbf{q}} = \tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}, \quad \dot{\boldsymbol{\omega}} = \boldsymbol{\alpha}_{\text{cmd}}.
$$

Two simplifications are worth stating outright rather than discovering by surprise later. The engine is fixed along the body $+\hat{\mathbf{z}}$ axis — no separate gimbal deflection on top of the attitude itself — so attitude alone steers thrust; a real vehicle typically layers a few degrees of gimbal authority on top of this, which changes the control dimension but not the structure of the problem. And angular acceleration is commanded directly, bypassing the torque-through-an-inertia-tensor mapping a real actuator (thrusters, or gimbal-induced torque) would need. Both choices exist for the same reason: they keep the model honestly 6-DoF — attitude and rate are genuine states, thrust direction genuinely depends on attitude through the nonlinear $\mathbf{R}(\mathbf{q})$ this module's introduction to successive convexification measured directly — while keeping the bookkeeping to what this lesson's point actually needs. A flight-grade model adds the inertia tensor and gimbal kinematics on top of exactly this skeleton, not in place of it.

The vehicle starts tilted, translating and rotating: $\mathbf{r}_0=(12,0,28)\,\mathrm{m}$, $\mathbf{v}_0=(-2,0,-4)\,\mathrm{m/s}$, a $6°$ tilt about the pitch axis, body rate $\boldsymbol{\omega}_0=(0.015,0,0)\,\mathrm{rad/s}$, wet mass $1905\,\mathrm{kg}$. It must reach the origin at rest, upright, with zero body rate — $\mathbf{r}_N=\mathbf{0}$, $\mathbf{v}_N=\mathbf{0}$, $\mathbf{q}_N=(1,0,0,0)$, $\boldsymbol{\omega}_N=\mathbf{0}$ — over $N=4$ to $6$ steps of $2\,\mathrm{s}$, with the thrust magnitude bounds of every earlier lesson convexified exactly as before and a bound on commanded angular acceleration. The initial reference for the first SCvx iteration is the simplest one that has no right to be good: position, velocity and body rate interpolated linearly from start to target, attitude interpolated toward level and renormalised, thrust held at a constant hover-ish value the whole way.

## What the first iterations actually do

::: example A reference the loop correctly refuses to accept
Run the $N=6$ case with a starting trust region of $\Delta_{\mathbf{x}}=40$, $\Delta_{\mathbf{u}}=6$ — deliberately generous, to see what happens when the trust region is not yet doing much restraining. The first subproblem solves in $70\,\mathrm{s}$ on this module's own teaching solver (a dense, uncompiled Python barrier method, on a shared machine — not a flight number, a baseline this lesson is explicit about), returning a candidate whose virtual control has fallen to a modest $0.10$ but whose *true* terminal error, found by re-simulating the candidate's controls through the actual nonlinear dynamics exactly as the $\rho$-test lesson specified, is $54.7\,\mathrm{m}$ combined position-and-velocity error — a real trajectory, but nowhere near the target. Computing $\rho$ against the reference confirms the linear model overpromised badly, and the step is rejected; the trust region shrinks. Tighten it to $\Delta_{\mathbf{x}}=15$, $\Delta_{\mathbf{u}}=3$ and solve again: this time the subproblem returns in under $3\,\mathrm{s}$ and $10$ Newton steps — far cheaper, because a tighter trust region is a smaller, better-conditioned feasible set — but the candidate is still rejected, $\rho<0$, true terminal error now $89.5\,\mathrm{m}$. Two iterations, two honest rejections, and a trust region that has fallen from $40$ to under $2$ before finding a step worth trusting.
:::

This is not a failure of the method; it is the method working exactly as designed on a genuinely hard first reference. A straight-line guess is a poor local model of $\mathbf{R}(\mathbf{q})$-coupled 6-DoF dynamics at $\Delta_{\mathbf{x}}=40$ — the earlier linearisation-error table showed the error growing quadratically with distance from the reference, and $40$ units of state deviation is a long way past where that table's numbers stayed small. The trust-region rule's entire job is to notice this and correct for it without a human in the loop, and on this run it did.

::: example Necessary, and visibly not sufficient
A separate, smaller run — $N=4$, a gentler start ($6°$ tilt scaled down, shorter reach) — accepts on its very first iteration: virtual control falls to $3.7\times10^{-4}$, essentially zero, the signal the successive-convexification and trust-region lessons both said to watch for. Re-simulate that same accepted candidate's controls through the true nonlinear dynamics anyway, exactly as the $\rho$-test lesson insisted must happen regardless of what virtual control reports, and the terminal position-and-velocity error is $74.8\,\mathrm{m}$ — not small. Near-zero virtual control said the *linearised* dynamics were satisfied almost exactly; it said nothing about whether that linearisation, valid at the reference, remained valid all the way out to where this particular trajectory actually travelled over four compounding steps. This is the trust-regions lesson's warning made concrete with a real number rather than left as a caution: **virtual control near zero is necessary for trusting an iterate, and this run is direct evidence it is not sufficient** — the true-dynamics check is not a formality this module added for rigour's sake, it is the check that catches exactly this case.
:::

::: warning What "the solve took 70 seconds" does and does not mean
Nothing in this lesson's numbers is a flight timing claim, and none should be read as one. This module's own solver is a dense barrier method written in Python for clarity, re-factorising a full KKT matrix from scratch every Newton step, running on shared, contended hardware — every design choice the real-time-implementation material later in this module explicitly rules out for flight software. What the numbers *do* establish honestly: the Newton-step counts within a single subproblem swing enormously with how well-posed that particular linearisation is — $10$ steps for an easy case, $758$ for a harder one in this lesson's own runs — which is itself worth knowing, because it means an SCvx implementation's per-subproblem cost is not the constant, near-data-independent quantity a single interior-point SOCP solve's cost is. A later lesson in this module works out what a sparse, code-generated version of exactly this subproblem costs, and multiplies it out against a real guidance cycle; the honest gap between that number and this lesson's raw wall-clock seconds is the entire argument for why the engineering in that lesson has to happen before any of this flies.
:::

## Reading the run as a whole

Put the pieces together the way a flight program would read a dispersion campaign's log rather than one lucky case. Two iterations of the $N=6$ run rejected a reference that was simply too far from any dynamically consistent trajectory to trust, at real, measured cost — tens of seconds and hundreds of Newton steps for the first, rejected, attempt. The $N=4$ run's first iteration was accepted with virtual control at machine-noise level, and still needed the independent true-dynamics check this module has insisted on since successive convexification was introduced, because that check is what caught a real, sizeable residual error the virtual-control number alone would have missed entirely. Neither run is a finished, polished landing; both are exactly the kind of evidence a certification argument for this method has to be built from — not "it worked," but a record of what each safeguard actually caught, with the numbers to show it.

::: key What this run demonstrates, stated precisely
Successive convexification's safeguards are not decorative. In a real 6-DoF solve: the trust-region test rejected two genuinely bad steps from an intentionally naive reference, at a measured cost in Newton iterations and wall-clock time that varies by nearly two orders of magnitude between an easy and a hard subproblem; and a separately accepted step with near-zero virtual control still carried a $74.8\,\mathrm{m}$ true-dynamics error, confirming that virtual control is a necessary, not sufficient, signal — exactly the distinction this module's earlier lessons argued for on paper, now shown holding on a real trajectory.
:::

## Check yourself

::: check
The $N=6$ run's second iteration solved in under $3\,\mathrm{s}$ with only $10$ Newton steps — far cheaper than the first iteration's $70\,\mathrm{s}$ and $168$ steps — and was still rejected. Does the cheap solve time tell you anything about whether the answer was good?
:::

::: answer
No, and conflating the two is a real trap. Solve time and Newton-step count reflect how easy the *centering problem* was for that particular subproblem — here, a much smaller trust region made for a smaller, better-conditioned feasible set, which is genuinely why it solved faster. Whether the resulting candidate is a *good* step is a completely separate question, answered only by $\rho$: the ratio of true improvement to predicted improvement. A fast solve of a small, easy subproblem can still describe a trajectory the true dynamics reject just as firmly as a slow solve of a large one, which is exactly what happened here.
:::

::: check
Why does re-simulating only the *controls* of the accepted $N=4$ candidate — not reading off its states directly — matter for catching the $74.8\,\mathrm{m}$ discrepancy this lesson reported?
:::

::: answer
The candidate's *states*, as returned by the subproblem, satisfy the linearised dynamics essentially exactly by construction — that is what near-zero virtual control means, and reading them back would simply confirm the linear model agrees with itself. The candidate's *controls* are a genuine, physically applicable command sequence, and propagating them through the actual nonlinear $\mathbf{R}(\mathbf{q})$-coupled dynamics from the true initial condition is the only computation in this whole pipeline that ever consults the real vehicle physics rather than a local model of them. The $74.8\,\mathrm{m}$ gap exists entirely in the difference between those two things, and checking states instead of re-simulating controls would have hidden it completely.
:::

::: check
Suppose this module's teaching solver were replaced with a sparse, warm-start-free, flight-representative implementation of the identical subproblem structure, and the $N=6$ run's first two rejections still happened, just faster. Would that change anything about how a certification argument should treat this run?
:::

::: answer
The *speed* of the rejections would change — a flight-representative solver would produce the same reject decisions in milliseconds rather than tens of seconds, which is entirely the point of the engineering the real-time-implementation material describes. What would not change is the *substance*: two genuinely bad candidate steps were correctly identified and refused, from a reference chosen to be a hard case on purpose. A certification argument cares about whether the safeguards catch what they are supposed to catch, which this run demonstrates regardless of the clock speed of the hardware doing the catching; the timing numbers matter for whether the whole loop fits in a guidance cycle, not for whether the loop's logic is sound.
:::

## Summary

| Object | Statement |
| --- | --- |
| State / control | $14$ states ($\mathbf{r},\mathbf{v},z,\mathbf{q},\boldsymbol{\omega}$), $4$ controls ($\sigma,\boldsymbol{\alpha}_{\text{cmd}}$) |
| Simplifications, stated openly | Thrust fixed along the body axis (no separate gimbal); angular acceleration commanded directly (no inertia/torque mapping) |
| $N=6$, wide trust region | Iteration $1$: $70\,\mathrm{s}$, $168$ Newton steps, rejected, true error $54.7\,\mathrm{m}$. Iteration $2$: $2.8\,\mathrm{s}$, $10$ steps, still rejected, true error $89.5\,\mathrm{m}$ |
| $N=4$, gentler start | Iteration $1$ accepted: virtual control $3.7\times10^{-4}$, true terminal error nonetheless $74.8\,\mathrm{m}$ |
| The core finding | Small virtual control is necessary but not sufficient; only re-simulating the true nonlinear dynamics on the accepted controls catches the remaining gap |
| What varies wildly | Newton steps per subproblem: $10$ to $758$ across these runs — unlike a single certified SOCP's near-constant iteration count |
| What these numbers are not | A flight timing claim; this module's own solver is dense, uncompiled and unoptimised on purpose, for clarity |

The next lesson explains precisely why that last caveat matters as much as it does — what has to change between this teaching implementation and one a flight computer could run on a real guidance cycle, with the flop counts to show the size of the gap.
