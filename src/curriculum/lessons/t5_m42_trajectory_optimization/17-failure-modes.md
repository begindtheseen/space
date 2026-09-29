---
id: l17-failure-modes
title: "Failure modes: infeasibility, multipliers, ringing and bad constraints"
minutes: 26
covers:
  - "Failure modes: infeasible restoration, unbounded multipliers, mesh-induced control ringing, badly posed terminal constraints"
---

A car can go wrong in two very different ways. Some problems are loud: a red light on the dashboard, a grinding noise, a car that will not start. You know something is wrong, even if you do not yet know what. Other problems are quiet. The map app confidently sends you to Springfield — the wrong Springfield, three states away — and the drive is smooth the whole time. No light comes on. You only find out when you arrive.

A trajectory optimizer fails in both ways. Earlier lessons built the diagnostic tools — shadow prices, the covector mapping, the interpolated-defect estimate, the condition number. This lesson is the catalog they exist for. It names five specific ways a trajectory optimization goes wrong: a quiet wrong answer, **badly posed terminal constraints**, **unbounded multipliers**, **infeasible restoration** and **mesh-induced control ringing**. For each one it gives the symptom, the cause and the check that catches it.

## A wrong answer that looks right

The most dangerous failure on the list produces no error message at all. The cost goes down every iteration. The solver stops and reports success. The end state lands close to the target. Nothing in the log separates it from a correct answer.

Picture hiking downhill in thick fog to find the lowest point in a valley. You stop when every direction around you goes up. You are in *a* low spot — but it might be a small hollow halfway down the mountain, not the valley floor. From inside the fog, the two feel the same. That hollow is a **[[local minimum|local-min]]**: a point lower than everything right around it, but not the lowest point overall.

Every method in this module — shooting, collocation, pseudospectral, iLQR — is a local method. It walks downhill from where you start it and stops in the first low spot it reaches.

::: example Two clean solves, one a hundred times worse
Lesson 12 steered an ascent by iLQR: a $1000\,\mathrm{kg}$ vehicle with $15\,000\,\mathrm{N}$ of thrust, pitch angle $\theta$ measured from vertical, $50\,\mathrm{s}$ of burn, aiming for $h = 6000\,\mathrm{m}$, $v_x = 480\,\mathrm{m/s}$, $v_h = 170\,\mathrm{m/s}$. The cost is a soft quadratic penalty on missing those three numbers plus a running penalty $\tfrac12\theta^2$ on the pitch. Call it run A: from a constant $30^\circ$ guess, the cost fell from $67.29$ to $11.7399$ in $14$ iterations, ending at $(h, v_x, v_h) = (5989.6,\ 478.7,\ 176.3)$.

**Run B.** Same problem, same code, same settings. The only change: the guess is a constant $390^\circ$ instead of $30^\circ$. That is one [[full extra turn|angle-wrap]] — the thrust points in *exactly* the same direction. So the first rollout flies the identical trajectory. Its cost, $1218.74$, is higher only because the pitch penalty sees a bigger number.

**Check that difference.** $390^\circ$ is $6.807\,\mathrm{rad}$ and $30^\circ$ is $0.524\,\mathrm{rad}$. The penalty over $50\,\mathrm{s}$ differs by $\tfrac12 \times 50 \times (6.807^2 - 0.524^2) = 25 \times 46.06 = 1151.5$, and $1218.74 - 67.29 = 1151.45$. It matches.

**The run.** The iteration behaves perfectly. The cost falls to $1186.33$ after the first step and $1176.99$ by iteration $10$, and settles at $1176.75$ after $46$ iterations. The end state is $(5933.8,\ 436.7,\ 190.7)$. That is not run A's end state. The altitude agrees to within $1\,\%$, but $v_x$ is $42\,\mathrm{m/s}$ slower and $v_h$ is $14\,\mathrm{m/s}$ faster. Against the target, run B misses by $66\,\mathrm{m}$, $43\,\mathrm{m/s}$ and $21\,\mathrm{m/s}$, where run A missed by $10\,\mathrm{m}$, $1\,\mathrm{m/s}$ and $6\,\mathrm{m/s}$. Still, nothing about it looks broken: a soft target is allowed to miss, and nothing in run B's log says by how much it should.

**The verdict.** Read on its own, run B looks completely trustworthy: smooth convergence, an end state in the right neighborhood, no warnings. Its cost is $1176.75/11.7399 \approx 100.2$ times the cost run A found. The solver cannot unwind the extra turn, because turning the pitch back through $360^\circ$ a little at a time would mean pointing the engine sideways and down along the way, which costs far more than it saves. It is stuck in a hollow. Lesson 12 found the same trap from other starts: $-30^\circ$ ends at $127.74$ ($10.9$ times run A) and $150^\circ$ at $749.70$ ($63.9$ times).

**Sanity check.** A guess that flies the identical trajectory led to a different answer. Nothing about the physics changed; only where the solver started.
:::

::: warning A converged log shows a stationary point, not the best one
A clean log certifies that the necessary conditions hold near the returned answer. It certifies nothing about whether a different trajectory, reachable only from a different start, does better. The defense used across this field is redundancy: solve from several *physically different* starting guesses — a different pitch program, a different coast-and-burn split, a continuation path from another direction (lesson 15) — and compare the costs. Also look at the answer, not only the log: run B's pitch starts at $307^\circ$, then climbs from $365^\circ$ to $425^\circ$. A pitch above $360^\circ$ is a red flag that no convergence test will raise for you.
:::

## Badly posed terminal constraints

A terminal constraint says where the trajectory must end. Writing one down seems simple. But it is easy to say the same thing twice.

Suppose you tell a friend "meet me at the library" and also "meet me at 400 Main Street" — which is the library's address. You have not given two instructions. You have given one instruction in two ways. Your friend is fine. A solver is not, as you will see.

Two constraints are **redundant** when one follows from the other. In a solver's language, their gradients — the direction each constraint pushes — are **linearly dependent**: one is a multiple of the other, or a mix of others.

It happens on real problems. This module's orbit transfer ends on a circular orbit with radial velocity $v_r = 0$. At any nonzero speed, "radial velocity zero" and "**[[flight path angle|fpa]]** zero" say the same thing. Writing both, believing they pin down two different things about the arrival, hands the solver a dependent pair. So does a rendezvous written with a velocity-matching condition *and* orbital-element conditions that imply the same three numbers. So does a landing that asks for both velocity components to be zero *and* for the speed $\sqrt{v_x^2+v_h^2}$ to be zero. That last one is worse still: the speed has no defined slope at zero, so its gradient is garbage exactly where it is enforced.

::: example Why the multipliers on a redundant pair are not unique
Each constraint gets a **[[multiplier|multiplier-price]]**, written $\mu$ ("mew"): the price the solver pays per unit of that constraint, like the costate's shadow price in lesson 2. At the answer, the cost's gradient must be balanced exactly by the constraint gradients times their multipliers. That balance is the KKT **stationarity condition** from lesson 13.

Minimize $(x-1)^2$ subject to $g_1: x - 1 = 0$ and $g_2: 2x - 2 = 0$. The second constraint is exactly twice the first.

**Step 1: the answer.** Both constraints say $x = 1$. So $x^\star = 1$, exactly as if only one had been written.

**Step 2: the balance.** The slope of the cost is $2(x-1)$. The slopes of $g_1$ and $g_2$ are $1$ and $2$. Stationarity says $2(x^\star - 1) + \mu_1 \cdot 1 + \mu_2 \cdot 2 = 0$. At $x^\star = 1$ the first term is zero, leaving

$$
\mu_1 + 2\mu_2 = 0.
$$

**Step 3: count.** That is one equation in two unknowns. Every pair on that line works: $(\mu_1, \mu_2) = (0, 0)$, $(-2, 1)$, $(-10, 5)$, $(2\times10^6, -10^6)$. Check the last: $2\times10^6 + 2(-10^6) = 0$. All balance equally well.

**What it means.** The multiplier a solver reports for $g_1$ or $g_2$ alone is an accident of its internal path — whichever point on the line it happened to land near. It is not a meaningful number. The primal answer, $x^\star = 1$, is fine. The prices are not.
:::

On a vehicle problem, the covector mapping of lesson 10 turns multipliers into costates. With redundant terminal conditions the terminal costate has no unique value, so the reconstructed costate history — and checks built on it, like the switching function — cannot be trusted. Where the vehicle ends up is unaffected.

## Unbounded multipliers

Exact redundancy is easy to spot once you look. *Near* redundancy is sneakier, and it is where **unbounded multipliers** come from: a multiplier that keeps growing as the iterations go on, or that comes out wildly different in two runs that reach the same trajectory.

Picture holding a heavy door shut. Push near the handle and it takes little force. Push [[an inch from the hinge|door-hinge]] and it takes an enormous force, because your lever is tiny. A near-redundant constraint pair is that inch-from-the-hinge push.

::: example A constraint pair that is almost the same
Take two unknowns, $x$ and $y$. Minimize $(x-1)^2 + (y - a)^2$ with $a = 0.001$, subject to

$$
g_1: x - 1 = 0, \qquad g_2: 2x + \delta\,y - 2 = 0.
$$

For $\delta = 0$ the second constraint is twice the first. For a small $\delta$ it is *almost* twice the first.

**Step 1: the answer.** $g_1$ gives $x = 1$. Put that into $g_2$: $2 + \delta y - 2 = 0$, so $\delta y = 0$, so $y = 0$. The answer is $(1, 0)$ for every nonzero $\delta$.

**Step 2: the balance, in $y$.** The cost's slope in $y$ is $2(y - a) = -2a$ at $y = 0$. Only $g_2$ has a slope in $y$, and that slope is $\delta$. Stationarity in $y$ says $-2a + \delta\mu_2 = 0$, so

$$
\mu_2 = \frac{2a}{\delta}.
$$

**Step 3: the balance, in $x$.** The cost's slope in $x$ is $0$ at $x = 1$. So $\mu_1 + 2\mu_2 = 0$, giving $\mu_1 = -4a/\delta$.

**Step 4: shrink $\delta$.**

| $\delta$ | $\mu_1$ | $\mu_2$ | condition number of the constraint Jacobian |
| --- | --- | --- | --- |
| $10^{-2}$ | $-0.4$ | $0.2$ | $500$ |
| $10^{-4}$ | $-40$ | $20$ | $5\times10^{4}$ |
| $10^{-6}$ | $-4000$ | $2000$ | $5\times10^{6}$ |

**Read the table.** The answer, $(1, 0)$, never moves. The multipliers grow in proportion to $1/\delta$, without limit. The cost is gently pulling $y$ toward $0.001$, and the only thing holding $y$ at zero is $g_2$ — through a lever of length $\delta$. A tiny lever needs a huge force. Notice too that the constraint pair's condition number, lesson 14's $\kappa$, grows just as fast.

**Sanity check.** The pair is never exactly redundant here, so the multipliers are unique for every $\delta$. Being unique is not the same as being sensible.
:::

The same numbers, computed by a least-squares solve of the stationarity conditions:

```python
import numpy as np

a = 0.001
for delta in (1e-2, 1e-4, 1e-6):
    J = np.array([[1.0, 0.0],         # slopes of g1 in (x, y)
                  [2.0, delta]])      # slopes of g2 in (x, y)
    grad_cost = np.array([0.0, -2 * a])   # slope of the cost at the answer (1, 0)
    mu = np.linalg.solve(J.T, -grad_cost) # stationarity: grad_cost + J^T mu = 0
    print(f"delta={delta:.0e}  mu1={mu[0]:.4g}  mu2={mu[1]:.4g}  cond={np.linalg.cond(J):.3g}")
# delta=1e-02  mu1=-0.4  mu2=0.2  cond=500
# delta=1e-04  mu1=-40  mu2=20  cond=5e+04
# delta=1e-06  mu1=-4000  mu2=2000  cond=5e+06
```

::: key Reading unbounded multipliers
A multiplier that keeps growing without settling, or that differs wildly between two runs converging to the same trajectory, points to a **linear dependence** — exact or nearly exact — among the active constraint gradients. Check the terminal and path constraints for a pair that says the same thing, and check the smallest singular value (the [[rank|rank]]) of the active constraint Jacobian, before suspecting the solver's numerics. The trajectory can be fine while the multipliers, and every costate built from them, are nonsense.
:::

## Infeasible restoration

Now a loud failure. Suppose you ask a map app for a route that gets you 500 km away in 30 minutes by car. No route exists. A good app does not invent one. It says so.

A **feasible** point is one that satisfies every constraint. An interior-point solver like IPOPT normally takes steps that balance two goals: lower the cost, and shrink the **constraint violation** — how far the constraints are from being met. When it can no longer make an acceptable step, it switches into a **[[restoration phase|filter]]**. In restoration it sets the cost aside completely and minimizes the constraint violation alone, trying to find *any* nearby point that is closer to feasible, so it can pick up the normal iterations from there.

If even that fails — the violation cannot be driven to zero, because no feasible point is anywhere nearby — IPOPT stops and says so. Depending on how restoration ended, the message is "Restoration Failed!" or "Converged to a point of local infeasibility. Problem may be infeasible." In the iteration log, restoration iterations are the ones with an "r" after the iteration number, and the column to watch is **[[inf_pr|ipopt-log]]**, the largest constraint violation. If inf_pr stalls well above zero while the "r" lines pile up, the solver is telling you it cannot find a feasible point.

::: example An unreachable target, honestly refused
Take this module's minimum-time orbit raise: $1200\,\mathrm{kg}$, $100\,\mathrm{N}$ of thrust, $c = 17\,652\,\mathrm{m/s}$, from a circular orbit at $7000\,\mathrm{km}$ to one at $9000\,\mathrm{km}$. In canonical units (time unit $927.64\,\mathrm{s}$) the true minimum flight time is $12.37$, about $11\,477\,\mathrm{s}$ or $3.2$ hours. Now fix the flight time at $t_f = 2$ units instead, and ask for the transfer anyway.

**Step 1: how long is that?** $2 \times 927.64 = 1855\,\mathrm{s}$, about $31$ minutes.

**Step 2: how much speed change can the engine give in that time?** Mass flow is $T/c = 100/17\,652 = 0.005665\,\mathrm{kg/s}$, so in $1855\,\mathrm{s}$ the craft burns $10.5\,\mathrm{kg}$ and drops to $1189.5\,\mathrm{kg}$. The rocket equation gives $\Delta v = c\ln(m_0/m_f) = 17\,652 \times \ln(1200/1189.5) = 155\,\mathrm{m/s}$.

**Step 3: how much is needed?** A slow spiral between circular orbits costs about the [[difference of the two circular speeds|edelbaum]]: $7546 - 6655 = 891\,\mathrm{m/s}$.

**Step 4: compare.** $155\,\mathrm{m/s}$ available against $891\,\mathrm{m/s}$ needed. The engine can supply less than a fifth of what the trip requires. Thrusting straight ahead the entire time only raises the orbit to about $7156\,\mathrm{km}$ — still $1844\,\mathrm{km}$ short of $9000\,\mathrm{km}$. No steering program can close that gap.

**Step 5: what restoration finds.** Transcribe it with Hermite-Simpson on $20$ segments and minimize the constraint violation alone — exactly restoration's job. The smallest the whole violation vector can be made has length $0.0468$ in canonical units, spread over all $66$ constraints; the largest single violation is about $0.0098$. It is not zero, and no amount of iterating makes it zero. The same transcription with $t_f = 12.5$ drives the violation to about $4\times10^{-12}$.

**The verdict.** A solver that refuses to answer a question with no answer, and says so in its exit status, is doing its job.
:::

::: key Reading a restoration failure correctly
Restoration failure means "no feasible point was found nearby". That fits two very different diagnoses. The problem may be *structurally* infeasible: the mission as written cannot be flown, because the vehicle lacks the propellant, thrust or time — as in the example. Or the problem may be feasible but *badly scaled or badly started*, so the solver cannot locate the feasible region numerically. Telling these apart is the job of lesson 14's checklist: non-dimensionalize states, controls and residuals to order one; check that the initial guess is dynamically plausible; drop or relax the tightest constraints and confirm that *something* feasible exists; then add the constraints back one at a time, warm-starting each solve from the last (lesson 15). Only after that do you conclude the mission itself is impossible.
:::

::: warning Two tempting moves that make it worse
Loosening the convergence tolerance until the solver reports success does not create a feasible trajectory; it only hides the failure. Refining the mesh first makes a badly scaled problem bigger without making it any better scaled. A back-of-the-envelope budget like the $155$-versus-$891\,\mathrm{m/s}$ check above costs a minute and often settles the question outright.
:::

## Mesh-induced control ringing

Try drawing a sharp staircase using only a few long, smooth brush strokes. You cannot. Either the corner gets rounded off into a ramp, or, if your brush is a wiggly high-degree curve, it overshoots and wobbles on both sides of the corner. That wobble is **[[ringing|gibbs]]**.

Lesson 11 showed the ramp. A uniform $10$-segment Hermite-Simpson mesh on the Mars descent smeared the true switch at $1.85\,\mathrm{s}$ into a ramp across the whole first segment, $3.38\,\mathrm{s}$ long. The interpolated-defect estimate flagged that one segment at $828$ times the error of the best segment. Lesson 5 showed the other face: a control flipping between its bounds every node or two over a long stretch is often a **singular arc** that the mesh cannot draw as the steady in-between value it really is, so the solver fakes it by rapid switching, like dimming a light by flicking it on and off.

Both are the same fact in different clothes. A mesh coarser than the shortest real feature of the optimal control — a switch, the start of a singular arc, a constraint becoming active — cannot represent it. The solver's best fit is then a smeared ramp (low-order collocation) or oscillation and chatter (high-degree polynomials). A pseudospectral polynomial stretched across a jump overshoots on both sides, which is why lesson 10's spectral convergence collapses at a switch.

The fix, from lesson 11, is the same for both: find the segment the interpolated-defect estimate flags, split it (or put a mesh breakpoint right at the junction, the hp-adaptive way), and solve again. Never add nodes uniformly and hope. And never take the ramp or the chatter for a real feature of the optimal control without checking the switching function first.

## Putting it together: a triage order

When a solve comes back, work down this list.

1. **Read the exit status.** Failure, iteration limit or restoration trouble means the loud branch: scaling, initial guess, feasibility budget, relaxed constraints — in that order.
2. **If it "succeeded", check the multipliers.** Are they settled and of sensible size? Growing or run-to-run-inconsistent multipliers point to redundant constraints.
3. **Check the mesh.** Run the interpolated-defect estimate. Any segment far above the rest hides a feature the mesh missed.
4. **Check the necessary conditions.** Map the multipliers to costates, rebuild the Hamiltonian and switching function, and confirm the switching structure the minimum principle predicts.
5. **Check the neighborhood.** Solve again from at least one physically different starting guess and compare costs.

Steps 1 to 4 look for loud problems and inconsistencies. Only step 5 can catch the quiet one.

## Check yourself

::: check
Runs A and B of the ascent both converged smoothly, and both ended near the target: the altitudes agree within $1\,\%$, though run B's speeds are off by $43$ and $21\,\mathrm{m/s}$. With only the logs and the end states, and no cost numbers, could you tell which was the better answer?
:::

::: answer
Not with confidence. Smooth convergence and a plausible end state are properties of having found *a* local optimum, not a *good* one, and both runs have them. Run A lands closer to the target, but with a soft target that proves little: a solver may trade a bigger miss for cheaper steering, so a closer end state can come with a higher total cost. The only way to tell them apart is what neither log shows on its own: the converged cost, compared against a second run from a different starting guess.
:::

::: check
In the near-redundant example, the constraint pair is never exactly redundant for $\delta \ne 0$, so the multipliers are unique. Why is that not good enough? Use the numbers.
:::

::: answer
Unique is not the same as well-conditioned. The multipliers are $\mu_1 = -4a/\delta$ and $\mu_2 = 2a/\delta$, which grow without limit as $\delta$ shrinks: $2000$ for $\mu_2$ at $\delta = 10^{-6}$, even though the cost's pull, $a = 0.001$, is tiny. The constraint Jacobian's condition number grows the same way, to $5\times10^6$ at $\delta = 10^{-6}$. The system that determines the multipliers is nearly singular, so a small change elsewhere — a different iterate, rounding, a small change in $a$ — swings them by a large amount. They carry almost no information, and any costate built from them inherits the problem.
:::

::: check
A restoration failure and a quiet local minimum are, in one sense, opposite problems. Say what makes them opposite, and why one checklist test cannot catch both.
:::

::: answer
Restoration failure is *loud*: the solver could not find any feasible point, and it says so. A poor local minimum is *quiet*: every optimality and feasibility test the solver runs is passed, and the log reports success. Tests built for loud failures — the exit status, the constraint violation — are passed by a quiet failure by construction. Catching it needs a different *kind* of test: comparing against a second, independently obtained answer.
:::

::: check
Why does this lesson call "restoration failed" an honest signal, when it is the least immediately useful message a solver can give?
:::

::: answer
It is honest because the solver reports exactly what it found — no feasible point nearby — instead of returning an infeasible or barely converged answer dressed up as a success, which is the far more dangerous kind of failure this lesson opened with. It does not say what to fix, but it sends you to the right place: the scaling, starting-guess and feasibility checks. A solver that quietly reported success would remove the cue to check anything at all.
:::

::: check
Repeat the budget check from the restoration example for a flight time of $t_f = 8$ canonical units. Is the transfer ruled out by the $\Delta v$ budget alone?
:::

::: answer
$8 \times 927.64 = 7421\,\mathrm{s}$. Propellant burned: $0.005665 \times 7421 \approx 42.0\,\mathrm{kg}$, so $m_f \approx 1158.0\,\mathrm{kg}$. Then $\Delta v = 17\,652 \times \ln(1200/1158.0) \approx 17\,652 \times 0.0357 \approx 630\,\mathrm{m/s}$. That is still less than the $891\,\mathrm{m/s}$ the spiral needs, so yes, $t_f = 8$ is ruled out too, before any solver runs. The budget only becomes big enough at about $t_f \approx 11.2$ units, just under the true minimum of $12.37$ — sensible, because the spiral also loses some efficiency to steering, so the real minimum time sits a little above where the budget first allows it.
:::

## Summary

| Failure mode | Symptom | Check |
| --- | --- | --- |
| Quiet local minimum | Clean convergence, sensible end state, no warnings | Solve from several physically different guesses; compare costs; look at the controls |
| Badly posed terminal constraints | Two conditions that say the same thing; dependent gradients | Look for redundant pairs; check the rank of the active constraint Jacobian |
| Unbounded multipliers | Multipliers grow, or differ between runs with the same trajectory | Usually near-redundant constraints: $\mu \propto 1/\delta$ with a lever of size $\delta$ |
| Infeasible restoration | "r" iterations, inf_pr stalls above zero; "Restoration Failed!" or "local infeasibility" | Scale, check the guess, relax constraints, do a budget check; then conclude infeasible |
| Mesh-induced ringing | A smeared ramp, bound-to-bound chatter or overshoot near a switch | Interpolated-defect estimate; refine or break the mesh at the junction; check the switching function |
| Ascent example | Cost $11.7399$ vs $1176.75$ from guesses $30^\circ$ and $390^\circ$ | A factor of about $100$ invisible in either log |
| Restoration example | $t_f = 2$: $155\,\mathrm{m/s}$ available vs $891\,\mathrm{m/s}$ needed; least violation $0.0468$ | Honestly reported failure, not a false success |

Every method this module built exists to get a real vehicle from where it is to where it needs to be, with its failures visible rather than hidden. The next module, convex guidance, takes the powered-descent problem this module kept returning to and rewrites it — by a trick called lossless convexification — as a [[convex problem|convex-bridge]]. There, the quiet failure disappears: a convex problem has no false hollows, the solver finishes in a predictable number of iterations, and when the problem is infeasible it proves it.

::: context local-min Hollows and valleys
A sketch of a cost landscape, not to scale. A solver started on the left walks downhill into the small hollow and stops, because every direction from there goes up. A solver started on the right reaches the deeper valley. Both report success. Only by starting from more than one place do you learn the deeper valley exists.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M 10 30 C 50 30 60 95 95 95 C 125 95 130 55 165 55 C 205 55 215 140 255 140 C 295 140 310 40 350 30" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="95" cy="87" r="7" fill="#b4232c"/>
  <circle cx="255" cy="132" r="7" fill="#1d6fd1"/>
  <text x="95" y="118" font-size="11" fill="#b4232c" text-anchor="middle">local minimum</text>
  <text x="255" y="156" font-size="11" fill="#1d6fd1" text-anchor="middle">deeper minimum</text>
  <text x="20" y="20" font-size="11" fill="#6c7a93">cost</text>
  <text x="300" y="20" font-size="11" fill="#6c7a93">(sketch)</text>
</svg>
```
:::

::: context angle-wrap Same direction, bigger number
An angle of $390^\circ$ is one full turn plus $30^\circ$, so it points exactly where $30^\circ$ does. The engine, the dynamics and the trajectory cannot tell them apart. The pitch penalty can: it squares the number, and $6.807^2 \approx 46.3$ while $0.524^2 \approx 0.27$. Angle variables that can wrap around are a classic source of false local minima; engineers often clamp them to one turn or steer with a sine and cosine pair instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="95" r="60" fill="#ffffff" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="90" y1="95" x2="90" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="90" y="24" font-size="11" fill="#6c7a93" text-anchor="middle">vertical</text>
  <line x1="90" y1="95" x2="120" y2="43" stroke="#b4232c" stroke-width="3"/>
  <path d="M 90 70 A 25 25 0 0 1 90 120 A 25 25 0 0 1 90 70 A 25 25 0 0 1 102.5 73.3" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="106.8,75.8 97.9,75.3 101.9,68.4" fill="#1d6fd1"/>
  <text x="180" y="60" font-size="12" fill="#1f2a44">30° and 390°:</text>
  <text x="180" y="78" font-size="12" fill="#1f2a44">same thrust direction</text>
  <text x="180" y="108" font-size="12" fill="#1f2a44">θ² = 0.27 vs 46.3</text>
  <text x="180" y="126" font-size="12" fill="#1f2a44">(θ in radians)</text>
</svg>
```
:::

::: context fpa Flight path angle
The flight path angle is the angle between the velocity and the local horizontal. Zero means flying level, as on a circular orbit; $+90^\circ$ means straight up. Its sine is the radial velocity divided by the speed, $\sin\gamma = v_r/v$. So at any nonzero speed, $\gamma = 0$ and $v_r = 0$ are the same condition — and at zero speed $\gamma$ is not defined at all.
:::

::: context multiplier-price What a multiplier is worth
A Lagrange multiplier is a price: how much the best cost would change if the constraint were loosened by one unit. Lesson 2 read the costate the same way, as the shadow price of the dynamics. When a price is well defined, it is a useful engineering number — it tells you which constraint is costing you the most. When two constraints say the same thing, the price is split between them in no particular way, like a bill shared between two people who each think the other paid.
:::

::: context door-hinge A short lever needs a big force
Torque is force times lever arm. To hold a door against a push at the handle, you must supply the same torque from wherever you push. Push at a tenth of the distance and you need ten times the force; push at a millionth and you need a million times. The multiplier $\mu_2 = 2a/\delta$ is exactly this: the pull $a$ from the cost, held back through a lever of length $\delta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="70" r="6" fill="#1f2a44"/>
  <text x="40" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">hinge</text>
  <line x1="40" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="6"/>
  <line x1="320" y1="30" x2="320" y2="62" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="320,66 315,56 325,56" fill="#1d6fd1"/>
  <text x="320" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">small pull</text>
  <line x1="55" y1="122" x2="55" y2="80" stroke="#b4232c" stroke-width="5"/>
  <polygon points="55,76 47,90 63,90" fill="#b4232c"/>
  <text x="70" y="118" font-size="11" fill="#b4232c">huge push, close to the hinge</text>
  <text x="185" y="56" font-size="11" fill="#6c7a93" text-anchor="middle">long lever</text>
</svg>
```
:::

::: context rank Rank, and how to measure "almost"
The rank of a matrix is the number of independent directions among its rows. Two rows that are multiples of each other count once. A computer measures this with the singular values from lesson 14: an exactly dependent pair gives a singular value of zero, and a nearly dependent pair gives a tiny one. In the example the smallest singular value is $4.47\times10^{-7}$ at $\delta = 10^{-6}$, against a largest of $2.24$. That ratio is the condition number.
:::

::: context filter Why IPOPT needs a restoration phase
IPOPT decides whether to accept a step with a "filter": a step is accepted if it improves either the cost or the constraint violation enough, without making the other much worse. Wächter and Biegler built this into IPOPT in the early 2000s. Occasionally no step passes the filter, often because the iterate has wandered somewhere the constraints cannot be improved by a small move. Then IPOPT drops the cost and solves a separate problem — minimize the violation, staying close to the current point — to get back into acceptable territory.
:::

::: context ipopt-log Reading the columns
Each IPOPT iteration prints one line. The columns are the iteration number, the objective, **inf_pr** (the largest constraint violation, "primal infeasibility"), **inf_du** (how far from stationary, "dual infeasibility"), lg(mu) (the barrier parameter, as a power of ten), ||d|| (the step size), lg(rg) (regularization), the step fractions alpha_du and alpha_pr, and ls (line-search trials). A healthy solve drives inf_pr and inf_du toward zero together. Restoration lines carry an "r" after the iteration number.
:::

::: context edelbaum The low-thrust rule of thumb
For a very gentle thruster spiraling slowly between two circular orbits in the same plane, the total speed change needed is close to the difference of the two circular speeds. This result is often credited to Theodore Edelbaum, who worked out low-thrust transfers in the early 1960s. Here: $\sqrt{\mu/r}$ is $7546\,\mathrm{m/s}$ at $7000\,\mathrm{km}$ and $6655\,\mathrm{m/s}$ at $9000\,\mathrm{km}$, a difference of $891\,\mathrm{m/s}$.
:::

::: context gibbs A polynomial meeting a jump
A degree-$16$ polynomial through $17$ Legendre-Gauss-Lobatto nodes, fitted to a control that jumps from $0$ to $1$ at a switch. It passes through every node exactly (dots), yet between them it overshoots to about $1.14$ just after the jump and dips to about $-0.14$ just before it — roughly a seventh of the jump either way. More nodes squeeze the wiggles closer to the jump but do not remove the overshoot. Breaking the mesh at the switch does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="345" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30,130 231.5,130 231.5,30 340,30" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polyline points="30.0,130.0 32.5,130.8 35.1,129.5 37.8,128.7 40.2,128.8 42.9,129.6 45.5,130.7 48.0,131.5 50.6,131.8 53.2,131.6 55.7,131.0 58.4,130.1 61.0,129.1 63.5,128.3 66.1,127.8 68.8,127.7 71.2,128.0 73.9,128.6 76.5,129.5 79.0,130.4 81.6,131.4 84.3,132.2 86.7,132.7 89.4,132.9 92.0,132.8 94.5,132.3 97.1,131.5 99.8,130.5 102.2,129.5 104.9,128.5 107.5,127.5 110.0,126.8 112.6,126.4 115.2,126.3 117.7,126.5 120.4,127.1 123.0,128.0 125.5,129.1 128.1,130.4 130.8,131.7 133.2,132.9 135.9,133.9 138.5,134.6 141.0,135.0 143.6,135.0 146.2,134.6 148.7,133.8 151.4,132.5 154.0,131.0 156.5,129.4 159.1,127.7 161.8,126.0 164.2,124.6 166.9,123.4 169.5,122.6 172.0,122.5 174.6,122.8 177.2,123.8 179.7,125.3 182.4,127.5 185.0,130.0 187.5,132.7 190.1,135.6 192.8,138.4 195.2,140.7 197.9,142.7 200.5,143.8 203.0,144.0 205.6,143.1 208.3,140.8 210.7,137.3 213.4,132.3 216.0,125.9 218.5,118.6 221.1,109.8 223.8,100.0 226.2,90.2 228.9,79.4 231.5,68.6 234.0,58.7 236.6,48.8 239.2,39.9 241.7,32.5 244.4,26.1 247.0,21.2 249.5,18.1 252.1,16.3 254.8,16.0 257.2,17.0 259.9,19.0 262.5,21.9 265.0,25.0 267.6,28.4 270.2,31.6 272.7,34.1 275.4,36.2 278.0,37.3 280.5,37.5 283.1,36.8 285.8,35.3 288.2,33.4 290.9,31.1 293.5,28.8 296.0,27.0 298.6,25.6 301.2,25.0 303.7,25.3 306.4,26.4 309.0,28.2 311.5,30.0 314.1,31.9 316.8,33.2 319.2,33.5 321.9,32.9 324.5,31.3 327.0,29.4 329.6,27.8 332.2,27.6 334.7,29.0 337.4,31.3 340.0,30.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1f2a44">
    <circle cx="30.0" cy="130.0" r="2.5"/><circle cx="34.2" cy="130.0" r="2.5"/><circle cx="43.8" cy="130.0" r="2.5"/><circle cx="58.6" cy="130.0" r="2.5"/><circle cx="77.9" cy="130.0" r="2.5"/><circle cx="101.1" cy="130.0" r="2.5"/><circle cx="127.3" cy="130.0" r="2.5"/><circle cx="155.6" cy="130.0" r="2.5"/><circle cx="185.0" cy="130.0" r="2.5"/><circle cx="214.4" cy="130.0" r="2.5"/><circle cx="242.7" cy="30.0" r="2.5"/><circle cx="268.9" cy="30.0" r="2.5"/><circle cx="292.1" cy="30.0" r="2.5"/><circle cx="311.4" cy="30.0" r="2.5"/><circle cx="326.2" cy="30.0" r="2.5"/><circle cx="335.8" cy="30.0" r="2.5"/><circle cx="340.0" cy="30.0" r="2.5"/>
  </g>
  <text x="255" y="11" font-size="11" fill="#b4232c" text-anchor="middle">overshoot 1.14</text>
  <text x="203" y="162" font-size="11" fill="#b4232c" text-anchor="middle">dip −0.14</text>
  <text x="120" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">true control (dashed)</text>
</svg>
```
:::

::: context convex-bridge Where the quiet failure goes away
A convex problem has a bowl-shaped cost over a feasible region with no dents, so any local minimum is the global one. Behçet Açıkmeşe and colleagues showed in the 2000s that the powered-descent problem, which looks nonconvex because the thrust has a lower bound, can be relaxed into a convex one whose answer still obeys the real bounds — "lossless convexification". Interior-point solvers then solve it in a predictable number of iterations, and if it is infeasible, they return a certificate proving it. That is next module's subject.
:::
