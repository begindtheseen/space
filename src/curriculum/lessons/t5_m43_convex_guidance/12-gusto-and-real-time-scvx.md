---
id: l12-gusto-real-time-scvx
title: GuSTO, and running SCvx in real time
minutes: 26
covers:
  - GuSTO and the broader sequential convex programming convergence theory
  - "Real-time implementation: solver code generation, iteration bounds, warm starting, and fixed-point considerations"
---

Think about two promises a friend could make about a big jigsaw puzzle. The first: "I will finish it eventually." The second: "I will finish it before dinner." The first is worth something: your friend will not give up halfway. But if guests arrive at seven and the puzzle is on the dining table, only the second one matters.

A landing rocket needs both from its guidance. Lesson 1 showed that one convex solve gives both: the global optimum, in an iteration count bounded before flight. Lessons 7 to 11 built **successive convexification** (SCvx), the loop that handles attitude and logic, and admitted that it gives up that clean pair.

This lesson takes the two promises in turn. First, what can be *proven* about the loop: the convergence theory of **sequential convex programming** — the family name for "solve a convex model, update it, repeat" — including one member built around a proof, **GuSTO**. Second, what it takes to answer *before the deadline* on a flight computer: counting the cost, exploiting structure, generating solver code, capping iterations, warm starting, and fixed-point numbers.

## What the convergence theory proves

Picture a marble nudged around a hilly landscape, with one rule: a nudge only counts if it lowers the marble by a real amount. The ground has a bottom, so the total drop is limited, and sooner or later the nudges must get tiny. A marble that can no longer find a way down is sitting on a flat spot.

That is the logic of the convergence proofs for SCvx-type methods. The $\rho$ test of lessons 8 and 9 makes every accepted step lower the cost by a real amount, the cost cannot fall forever, so the loop must settle on a flat spot. Notice what the picture does *not* say: that the flat spot is the lowest point on the map (it might be a hollow halfway up a hill, the danger lesson 1 opened with), or how many nudges it takes.

### The precise words

A **[[stationary point|stationary-point]]** is a point where the **first-order necessary conditions** hold: no small move that keeps the constraints satisfied lowers the cost, to first order. With constraints, these are the **KKT conditions** (read "K-K-T", after Karush, Kuhn and Tucker). Every optimum is a stationary point; not every stationary point is an optimum.

Two results matter here.

- **SCvx itself has a proof.** Yuanqi Mao, Michael Szmuk and Behçet Açıkmeşe showed in 2016 that, under stated assumptions (smooth dynamics and constraints, and a penalty weight $w$ large enough that the $\ell_1$ penalty is exact), the accepted iterates converge to a stationary point of the *original* non-convex problem, from any starting reference. Near such a point, the convergence is fast.
- **[[GuSTO|gusto-origin]]** — Guaranteed Sequential Trajectory Optimization — is a close cousin, published in 2019 by Riccardo Bonalli, Abhishek Cauligi, Andrew Bylard and Marco Pavone at Stanford. It runs the same loop — linearize, solve a convex subproblem, test the step, update — with different bookkeeping. State constraints (a keep-out zone, say) move into the cost as penalties whose weight is raised when they are violated; the trust region is still resized by an accept-or-reject test; and the analysis is done in continuous time with **Pontryagin's principle** from lesson 2 (called the maximum or the minimum principle, depending on the sign convention). Its theorem: under stated assumptions — among them that the control enters the dynamics linearly, as thrust does — the iterates converge to a trajectory satisfying that principle's necessary conditions for the original problem.

Both methods judge steps with a **merit function**: one number combining the true cost with penalties for every broken rule — lesson 9's penalized true cost $J$. The proofs are careful versions of the marble argument applied to that number. GuSTO's continuous-time view adds a bonus: the multipliers (dual variables) a convex solver returns approximate the costates, so they can seed an **indirect** (shooting) method, which then polishes the answer quickly.

::: key What the convergence theory buys, precisely
SCvx (Mao, Szmuk and Açıkmeşe, 2016) and GuSTO (Bonalli, Cauligi, Bylard and Pavone, 2019) both carry proofs: under stated regularity assumptions, the iterates converge to a stationary point — a KKT point, or a point satisfying the maximum principle — of the original non-convex problem. Not the global optimum, and with no count of iterations for a given problem: "I will finish eventually", not "before dinner".
:::

::: note Why it has to be true: the descent argument
Here is the skeleton of the proof, using lesson 9's notation. Let $J$ be the penalized true cost, and suppose it can never go below some floor $J_{\text{low}}$ (propellant cannot be negative, and penalties are never negative). Accept a step only when $\rho \ge \rho_0$ for some threshold $\rho_0 > 0$. Since $\rho$ is actual reduction over predicted reduction, every accepted step satisfies

$$
\text{actual reduction} \;\ge\; \rho_0 \times \text{predicted reduction}.
$$

Add up all the accepted steps. The actual reductions add to at most $J_{\text{start}} - J_{\text{low}}$, a finite number. So the predicted reductions also add to a finite number, which forces them to shrink toward zero.

Could the loop stall by rejecting forever? No: as the trust region shrinks, the linear model gets more accurate (its error falls with the square of the step, lesson 7), so $\rho$ climbs toward $1$ and a step is eventually accepted.

Finally, a predicted reduction near zero means the convex model, which matches the true problem's slopes at the reference, finds no direction that lowers the cost: the first-order condition, a stationary point. The full proofs handle the fine print (limits, subsequences, the exact penalty), but this is their engine.
:::

## Why lesson 1's certificate does not carry over whole

Lesson 1's case for convexity rested on two guarantees from one SOCP solve: a global optimum, and an iteration count bounded before flight. SCvx — GuSTO included — keeps neither in that strong form. Each *subproblem* still has the full SOCP guarantee; the *loop* does not. Nothing bounds, before flight, how many outer passes a given dispersed starting state will need, and the convergence proofs do not supply that bound. The answer is the one model predictive control uses for a re-solved optimization that might not finish in time, applied one level up:

1. **An iteration cap, sized from data.** Run a **dispersion campaign**: thousands of simulated landings with scattered starting states, winds and engine performance. Record the outer passes each case needs to bring virtual control below a threshold and pass the true-dynamics check. Take the worst case, not the average, times a safety factor.
2. **A certified fallback** for any case that would exceed the cap. Hold the last *accepted* trajectory (it already passed the true-dynamics check) and re-plan next cycle, or drop to a simpler law the mode logic trusts: a 3-DoF lossless-convexification solve that ignores attitude, or a closed-form polynomial law. Whichever it is, it must be written down and tested.

::: example Sizing a cap, and finding it does not fit
The numbers are made up; the steps are real. Suppose $1000$ cold-started cases (each from a straight-line guess) show a worst case of $12$ outer passes, counting rejected passes, which cost a full solve too. With a safety factor of $1.5$, the cap is

$$
12 \times 1.5 = 18 \text{ passes}.
$$

Suppose one subproblem takes $69\,\mathrm{ms}$ on the flight computer (the next section shows where a number like that comes from). The worst-case loop then takes

$$
18 \times 69\,\mathrm{ms} = 1242\,\mathrm{ms} \approx 1.24\,\mathrm{s}.
$$

That misses a $1\,\mathrm{s}$ re-plan budget. Now let in-flight re-plans start from the previous cycle's answer, and suppose a second campaign finds a worst case of $3$ passes. The cap becomes $3 \times 1.5 = 4.5$, rounded up to $5$, and the worst case is $5 \times 69 = 345\,\mathrm{ms}$ — inside the budget with room to spare.

**Sanity check.** The cold start did not vanish; it moved to once before ignition, where there is more time. The cap and the warm-start policy have to be designed together.
:::

## What one subproblem really costs

To know whether the loop fits, count the arithmetic in **[[flops|flop]]** — floating-point operations, one multiply or add of two decimal numbers each.

Take the 6-DoF subproblem of lesson 10, with $N$ time steps ($N+1$ nodes). Count its unknowns, $n$:

- $14(N+1)$ state numbers ($14$ per node);
- $4N$ controls ($4$ per step);
- $14N$ virtual controls, and $14N$ more helper variables that turn $\|\boldsymbol{\nu}_k\|_1$ into linear inequalities (the epigraph trick of lesson 3).

That gives $n = 14(N+1) + 32N$. Now count the equality constraints, $m$: $14N$ dynamics rows, $N+1$ linearized quaternion-length rows (one per node), and $27$ boundary rows ($14$ fixing the start, $13$ fixing the target — the final mass is left free). So $m = 14N + (N+1) + 27$.

Each Newton step of an interior-point solver solves one linear system of size $M = n + m$ (the **KKT system**). Solved as a dense matrix — what this module's teaching solver does — that costs about $\tfrac{2}{3}M^3$ flops.

| $N$ | $n$ | $m$ | $M=n+m$ | flops per Newton step |
| --- | --- | --- | --- | --- |
| $4$ | $198$ | $88$ | $286$ | $1.56\times10^7$ |
| $6$ | $290$ | $118$ | $408$ | $4.53\times10^7$ |
| $8$ | $382$ | $148$ | $530$ | $9.93\times10^7$ |
| $10$ | $474$ | $178$ | $652$ | $1.85\times10^8$ |
| $15$ | $704$ | $253$ | $957$ | $5.84\times10^8$ |
| $20$ | $934$ | $328$ | $1262$ | $1.34\times10^9$ |

The table comes from a few lines of numpy:

```python
import numpy as np

for N in [4, 6, 8, 10, 15, 20]:
    n = 14 * (N + 1) + 32 * N        # states, controls, virtual controls, epigraph helpers
    m = 14 * N + (N + 1) + 27        # dynamics, quaternion-length, boundary rows
    M = n + m
    print(N, n, m, M, f"{2 / 3 * M**3:.3g}")
# 4 198 88 286 1.56e+07
# ...
# 20 934 328 1262 1.34e+09
```

::: example What a dense subproblem costs, multiplied out
Take $N = 10$. Suppose the interior-point solve takes $25$ Newton steps, a typical planning figure for a well-scaled SOCP.

**One subproblem:** $25 \times 1.85\times10^8 = 4.62\times10^9$ flops.

**One SCvx run of $10$ passes:** $10 \times 4.62\times10^9 = 4.62\times10^{10}$ flops.

**Time.** Use $1\,\mathrm{GFLOP/s}$ ($10^9$ flops per second) as a round **[[planning figure|gflops]]** for a capable flight processor running this kind of linear algebra:

$$
\frac{4.62\times10^{10}}{10^9\,\mathrm{flop/s}} = 46.2\,\mathrm{s}.
$$

Even at $3\,\mathrm{GFLOP/s}$ it is $15.4\,\mathrm{s}$.

**Sanity check.** Powered-descent guidance typically re-plans once or twice a second, with a faster controller tracking the plan in between. So the dense approach is about $45$ to $90$ times too slow, before any margin.
:::

That number is not a verdict on SCvx. It is a verdict on solving it the way a teaching code does.

## The structure that saves it

A dense solve treats every unknown as if it might interact with every other. Here they do not. Picture a line of people passing buckets: each touches only the person on either side. The dynamics row for step $k$ involves only $\mathbf{x}_k$, $\mathbf{u}_k$, $\mathbf{x}_{k+1}$ and $\boldsymbol{\nu}_k$. Order the unknowns in time and the KKT matrix is almost all zeros — it is **sparse** — except for a **[[band|banded-matrix]]** of blocks along the diagonal: it is **banded**. A factorization that works only inside the band costs roughly $N b^3$, with $b$ the block size per node, instead of $M^3$ — *linear* in the number of nodes.

::: example How much the band buys
At $N = 10$, $M = 652$, so each node's block holds about $b = 652/10 \approx 65$ unknowns.

**Banded cost per Newton step (rough):** $N b^3 = 10 \times 65.2^3 \approx 2.77\times10^6$ flops. Compare the dense $1.85\times10^8$: about $67$ times less.

**One subproblem:** $25 \times 2.77\times10^6 = 6.93\times10^7$ flops, or about $69\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$.

**One cold-started run of $10$ passes:** about $0.69\,\mathrm{s}$. **A warm-started re-plan of $2$ passes:** about $0.14\,\mathrm{s}$.

**Sanity check.** At $N = 20$ the ratio grows to about $270$, since one cost grows like $N^3$ and the other like $N$. The constant in front of $N b^3$ depends on the factorization, so these are order-of-magnitude figures — and the order of magnitude is the difference between "nowhere near real time" and "fits".
:::

### Generating the solver

The second saving comes from noticing that every SCvx subproblem has the *same shape*: the same variables and the same pattern of which constraint touches which variable, every pass and every cycle. Only the numbers change — the Jacobians, the reference, the current state. That is the situation **[[solver code generation|code-generation]]** is built for. Instead of a general-purpose solver that discovers the structure at run time, a tool reads the fixed shape once, on the ground, and writes a custom solver in plain C for that shape alone. The generated code:

- works out the sparsity pattern and the elimination order offline, once;
- adds a small fixed **regularization** (a tiny number on the diagonal) instead of searching for pivots at run time, so the steps taken are the same every time;
- uses memory laid out in advance — no memory requested while flying;
- runs loops with fixed lengths, so its worst-case time can be measured and bounded.

These apply to *each* SCvx subproblem exactly as to a 3-DoF landing SOCP. Real tools include CVXGEN (for quadratic programs) and ECOS (a small embedded SOCP solver).

## Warm starting means three different things

To **warm start** is to begin a computation from a previous answer instead of from scratch. In an SCvx guidance system the phrase gets used for three different things, and only two of them help.

1. **Pass to pass.** The accepted answer of pass $k$ becomes the reference for pass $k+1$ — the definition of SCvx, not an option.
2. **Cycle to cycle.** The previous cycle's trajectory, shifted forward in time, becomes the new cycle's first reference. The vehicle has barely left the plan in half a second, so the loop needs far fewer passes than from a straight-line guess. The cap example depended on this.
3. **Inside the solver.** Starting the interior-point method at the previous subproblem's optimum. This one disappoints.

::: warning Solver warm starts do not help interior-point methods much
It is tempting to start the interior-point solver at the previous pass's optimum. But an optimum sits on the boundary of its cones, where the barrier is infinite. Nudging it back inside typically lands far from the new problem's **central path** (the curve the method follows to the answer), and little is saved. (First-order methods such as ADMM warm start far better, one reason they are studied for onboard use.) What really carries over is meanings 1 and 2: a better *reference*, not a better solver starting point. Do not expect the solver to warm start well merely because the *algorithm* reuses the previous answer.
:::

## Fitting the numbers into fixed point

Some flight computers, especially older or low-power ones, use **[[fixed-point arithmetic|fixed-point]]**: every number is stored as a whole number of tiny equal steps, like a ruler marked only in millimeters. It measures a house fine, but a grain of sand rounds to zero or one millimeter.

An SCvx subproblem mixes very different sizes in one linear system: quaternion parts near $1$, body rates of hundredths of a radian per second, positions of tens to thousands of meters, and a *deliberately* huge penalty weight $w$. One shared format either wastes precision on the small numbers or overflows on the large ones.

::: example The range one subproblem spans
Lesson 10's landing has a body rate of $0.015\,\mathrm{rad/s}$, a position of $28\,\mathrm{m}$, $\sigma = 5\,\mathrm{m/s^2}$ and quaternion parts near $1$. Add a typical virtual-control weight, $w = 2\times10^4$.

**Largest over smallest:**

$$
\frac{2\times10^4}{0.015} \approx 1.33\times10^6.
$$

**In bits.** Each binary digit doubles the range, so the number of bits needed is $\log_2(1.33\times10^6) \approx 20.3$ — call it $21$ bits only to hold both ends of the range, before any arithmetic.

**Compare.** A $16$-bit signed format has $15$ bits ($2^{15} = 32768$ steps): nowhere near enough. A $32$-bit one has $31$; the spread eats two-thirds, leaving about $10$ bits — three decimal digits — for the smallest quantity.

**Sanity check.** That is steps of about $0.015/2^{10} \approx 1.5\times10^{-5}\,\mathrm{rad/s}$ on the body rate, before a single multiply has rounded anything.
:::

The standard fix is **[[non-dimensionalization|nondimensional]]**: divide each variable by a characteristic size (positions by a length, rates by a rate) so everything the solver sees is of order $1$, choose the penalty weight in the *scaled* units, and scale the answer back afterwards. It is not tidiness; it decides whether the hardware can represent the problem at all. And it needs revisiting whenever a new kind of state joins the problem, since each arrives with its own natural units.

## Check yourself

::: check
A flight-software review asks: "Does GuSTO give SCvx the same certification status as the 3-DoF lossless-convexification solve?" What is the accurate answer?
:::

::: answer
No. The 3-DoF solve's certification rests on convexity: any local optimum is global, and the iteration count is bounded by a theorem before the data is seen.

GuSTO's guarantee — like SCvx's own proof — is different in kind: the iterates converge to *a* stationary point of a still non-convex problem, with no bound on how many passes that takes and no promise that the point is the best one. That upgrades the loop from "works well in testing" to "proven to converge, at an unknown rate" — real progress, but not lesson 1's certificate. The missing bound comes instead from a data-sized iteration cap plus a fallback.
:::

::: check
The 6-DoF subproblem has virtual controls and their helper variables, which the 3-DoF landing problem never had. Why does the banded factorization still apply to it?
:::

::: answer
Sparsity comes from *which variables appear together in the same row*, not from how many kinds of variable exist.

The dynamics-with-virtual-control row at step $k$ still involves only $\mathbf{x}_k$, $\mathbf{u}_k$, $\mathbf{x}_{k+1}$ and $\boldsymbol{\nu}_k$ — a step-to-neighbor coupling, as banded as the 3-DoF dynamics row, only wider (the state has $14$ numbers instead of $7$, and virtual control adds a block). The epigraph and trust-region constraints are even more local, each touching one node or one step. More kinds of variable widened the band; they did not make the problem dense.
:::

::: check
The dense-cost example found $46.2\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$ for a $10$-pass SCvx run at $N=10$. A colleague proposes meeting the deadline by capping SCvx at one pass. What is wrong with that fix?
:::

::: answer
One pass from an arbitrary reference is one linearization, used once, with no chance for the trust region to shrink toward a trustworthy step or for the virtual control and true-dynamics check to show whether the linearization was any good. It is the naive one-shot linearization that lesson 7 showed going wrong with the square of the distance from the reference — fast, but untrustworthy. The honest fixes are this lesson's: sparse, code-generated subproblems; a node count and pass cap sized from dispersion data; warm starting between cycles; and a certified fallback.
:::

::: check
Explain why the virtual-control penalty weight being deliberately large makes the fixed-point problem worse, not merely present.
:::

::: answer
A large weight works by making the penalty term enormous compared with the fuel term whenever virtual control is not zero; that size gap is what forces virtual control toward zero. Carry the same gap into a fixed-point format with one shared scale, and either the small quantities (the fuel cost, or a nearly converged virtual control) lose their precision to rounding, or the large one overflows. The weight's whole purpose is to be large compared with everything else in the objective, so it widens exactly the range the format cannot hold.
:::

::: check
A dispersion campaign of warm-started re-plans finds a worst case of $4$ passes. With a safety factor of $1.5$ and $69\,\mathrm{ms}$ per subproblem, does the capped loop fit a $0.5\,\mathrm{s}$ re-plan budget? What else must the timing include?
:::

::: answer
The cap is $4 \times 1.5 = 6$ passes. The worst case is $6 \times 69 = 414\,\mathrm{ms}$, which is under $500\,\mathrm{ms}$, with $86\,\mathrm{ms}$ to spare.

That spare time is not all free. Every pass, rejected ones included, also rebuilds the Jacobians and runs the true re-simulation that computes $\rho$. The budget closes only if the measured worst case of the *whole* pass — linearize, solve, re-simulate, decide — fits.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Stationary (KKT) point | Where the first-order necessary conditions hold; every optimum is one, but not every one is an optimum |
| SCvx convergence (Mao, Szmuk, Açıkmeşe 2016) | Under stated assumptions, accepted iterates converge to a stationary point of the true non-convex problem |
| GuSTO (Bonalli, Cauligi, Bylard, Pavone 2019) | Same loop, with state constraints penalized and a continuous-time analysis; converges to a point satisfying the maximum principle's necessary conditions |
| What the proofs do not give | A global optimum, or a bound on the number of passes for a given case |
| The response | An iteration cap sized from a dispersion campaign (worst case times a safety factor), plus a certified fallback |
| Dense subproblem cost | $\tfrac23 M^3$ flops per Newton step; at $N=10$, $4.62\times10^{10}$ flops for $10$ passes, $46.2\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$ |
| Banded cost | Roughly $N b^3$ per Newton step; about $67$ times less at $N=10$, and linear in $N$ |
| Code generation | Fixed structure, offline ordering, static regularization, static memory, fixed loops — one custom solver per problem shape |
| Warm starting | Pass-to-pass reference (the algorithm) and cycle-to-cycle reference (large saving) help; interior-point solver warm starts help little |
| Fixed point | Rates, positions, quaternions and a large penalty weight span about $20$ bits; non-dimensionalize every variable, and revisit it whenever a new state type is added |

The last lesson steps back from the machinery and asks where all of it flies: it maps each technique in this module onto the phases of a Falcon 9 booster's return and a Starship landing, and separates what is public record from what is inference.

::: context stationary-point Flat is not the same as lowest
A stationary point is anywhere the ground is flat, and flat ground comes in three kinds. At a **global minimum** it is the lowest point anywhere. At a **local minimum** it is lowest only nearby — a hollow on a hillside. At a **saddle** or a flat shelf, it goes down in some directions and up in others, or levels off before dropping again. The first-order test cannot tell them apart; it only feels the slope. That is why "converges to a stationary point" is a weaker promise than "finds the optimum".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <path d="M 10 30 C 40 110, 80 110, 110 70 C 130 45, 150 60, 170 60 C 190 60, 200 60, 215 80 C 240 120, 270 140, 300 138 C 325 136, 340 90, 350 40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="68" cy="96" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="50" y="125" font-size="11" fill="#1f2a44">local minimum</text>
  <circle cx="170" cy="60" r="5" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="160" y="45" font-size="11" fill="#1f2a44">flat shelf</text>
  <circle cx="298" cy="138" r="5" fill="#b4232c" stroke="#1f2a44"/>
  <text x="255" y="160" font-size="11" fill="#1f2a44">global minimum</text>
  <text x="10" y="170" font-size="11" fill="#6c7a93">all three pass the slope test</text>
</svg>
```
:::

::: context gusto-origin Where GuSTO comes from
GuSTO came out of Marco Pavone's Autonomous Systems Laboratory at Stanford and was presented at the IEEE International Conference on Robotics and Automation (ICRA) in 2019. It was aimed at robots and spacecraft in general — free-flying robots, for example — rather than at rockets alone. The name is a small joke: *gusto* means enthusiasm. It sits beside lossless convexification and SCvx as one of the three method families in the 2022 tutorial by Malyuta and co-authors listed in this module's resources, which is the best place to read all three side by side.
:::

::: context flop Counting the work
"Flop" stands for **floating-point operation**: one addition, subtraction, multiplication or division of two numbers stored in the computer's decimal-point format. Engineers count flops because they are the part of a numerical method you can predict with a pencil. Dense factorization of an $M \times M$ matrix takes about $\tfrac23 M^3$ of them, so doubling $M$ multiplies the work by eight. Flops are not the whole story — moving data in memory costs time too — but they set the floor.
:::

::: context gflops Why a round number
One GFLOP/s is a billion floating-point operations per second. It is used here as a round planning figure, not a measurement of any vehicle's computer: real flight processors range from far slower (older radiation-hardened chips) to far faster (modern commercial processors), and the speed actually reached on sparse linear algebra is usually well below a chip's advertised peak. The honest workflow is to plan with a round number like this, then measure the worst case on the real hardware.
:::

::: context banded-matrix What a banded matrix looks like
Order the unknowns in time — node 0, then node 1, then node 2 — and each dynamics row only links one node to the next. The nonzero entries then sit in blocks hugging the diagonal, and everything else is zero. A factorization that stays inside the band never creates new nonzeros far from it, so its work grows with the number of blocks, not with the cube of the matrix size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="150" height="150" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="10" width="30" height="30" fill="#1d6fd1"/>
  <rect x="50" y="10" width="30" height="30" fill="#8fb8f0"/>
  <rect x="20" y="40" width="30" height="30" fill="#8fb8f0"/>
  <rect x="50" y="40" width="30" height="30" fill="#1d6fd1"/>
  <rect x="80" y="40" width="30" height="30" fill="#8fb8f0"/>
  <rect x="50" y="70" width="30" height="30" fill="#8fb8f0"/>
  <rect x="80" y="70" width="30" height="30" fill="#1d6fd1"/>
  <rect x="110" y="70" width="30" height="30" fill="#8fb8f0"/>
  <rect x="80" y="100" width="30" height="30" fill="#8fb8f0"/>
  <rect x="110" y="100" width="30" height="30" fill="#1d6fd1"/>
  <rect x="140" y="100" width="30" height="30" fill="#8fb8f0"/>
  <rect x="110" y="130" width="30" height="30" fill="#8fb8f0"/>
  <rect x="140" y="130" width="30" height="30" fill="#1d6fd1"/>
  <text x="185" y="40" font-size="11" fill="#1f2a44">dark: one node's own block</text>
  <text x="185" y="70" font-size="11" fill="#1f2a44">light: links to the next node</text>
  <text x="185" y="100" font-size="11" fill="#1f2a44">white: always zero</text>
  <text x="185" y="130" font-size="11" fill="#6c7a93">5 nodes shown</text>
</svg>
```
:::

::: context code-generation Solvers written by a program
CVXGEN, written by Jacob Mattingley and Stephen Boyd at Stanford, generates custom C solvers for small quadratic programs. Lars Blackmore of SpaceX wrote in 2016 that SpaceX uses CVXGEN to generate customized flight code for onboard convex optimization in Falcon 9 landings, and Stanford Electrical Engineering reported in 2021 that CVXGEN helps guide Falcon 9 landings. ECOS (Domahidi, Chu and Boyd, 2013) is a compact interior-point solver for SOCPs designed for embedded use. What SpaceX's landing problem looks like in detail has not been published.
:::

::: context fixed-point A ruler with only one spacing
In fixed point, a number is an integer times a fixed step size chosen in advance. With $16$ bits and a step of $0.01$, you can store $-327.68$ to $327.67$, always to the nearest $0.01$. Anything smaller than half a step becomes zero; anything bigger than the top overflows. Floating point, by contrast, moves the decimal point for each number, like scientific notation, so small and large numbers both keep their significant digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="42" x2="20" y2="58" stroke="#1f2a44"/>
  <line x1="84" y1="42" x2="84" y2="58" stroke="#1f2a44"/>
  <line x1="148" y1="42" x2="148" y2="58" stroke="#1f2a44"/>
  <line x1="212" y1="42" x2="212" y2="58" stroke="#1f2a44"/>
  <line x1="276" y1="42" x2="276" y2="58" stroke="#1f2a44"/>
  <line x1="340" y1="42" x2="340" y2="58" stroke="#1f2a44"/>
  <text x="16" y="75" font-size="11" fill="#1f2a44">0</text>
  <text x="80" y="75" font-size="11" fill="#1f2a44">1</text>
  <text x="144" y="75" font-size="11" fill="#1f2a44">2</text>
  <text x="208" y="75" font-size="11" fill="#1f2a44">3</text>
  <text x="272" y="75" font-size="11" fill="#1f2a44">4</text>
  <text x="336" y="75" font-size="11" fill="#1f2a44">5</text>
  <circle cx="27" cy="50" r="4" fill="#b4232c"/>
  <text x="30" y="30" font-size="11" fill="#b4232c">0.1 rounds to 0</text>
  <circle cx="237" cy="50" r="4" fill="#1d6fd1"/>
  <text x="200" y="30" font-size="11" fill="#1d6fd1">3.4 rounds to 3</text>
  <text x="20" y="100" font-size="11" fill="#6c7a93">every step is the same size, whatever the number</text>
</svg>
```
:::

::: context nondimensional Measuring in the problem's own units
Non-dimensionalizing means choosing the units to suit the problem. Measure positions in units of the starting altitude, times in units of the expected flight time, masses in units of the wet mass. Then a position of $0.3$ means "30 percent of the way down", and every variable lands between about $-10$ and $10$. The physics is unchanged; only the ruler moved. Solvers of every kind — fixed point or floating point — converge more reliably on well-scaled problems, which is why the trajectory-optimization module listed scaling as its first fix for a stubborn solve.
:::
