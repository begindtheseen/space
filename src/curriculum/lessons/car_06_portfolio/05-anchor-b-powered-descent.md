---
id: l05-anchor-b-powered-descent
title: "Anchor B: powered-descent guidance and its Monte Carlo"
minutes: 20
covers:
  - "anchor project B — powered descent guidance with a landing accuracy Monte Carlo"
---

Imagine a friend shows you a video of a paper airplane landing perfectly on a desk across the room. Impressive. But you would want to know a few things before you believed they could do it again. How many throws did they film before this one? Would it still land if the window were open? Did they use a rule, or did they get lucky?

A **powered-descent guidance** project raises the same questions. **Powered descent** is the last phase of a rocket landing, when the engine fires to slow the vehicle and put it down on a chosen spot. **Guidance** is the software that decides, moment by moment, how hard and in which direction to push. A smooth animation of the vehicle touching down shows almost nothing an interviewer cares about. What they probe is the **formulation** (the exact problem you told the computer to solve), the **constraints** you actually enforced (the rules the answer must obey), and how the method behaves across many uncertain starting conditions. All three are invisible in a pretty trajectory plot.

This lesson covers what the project needs to answer that probing. It builds on the **[[convex|convex]]**-guidance formulation this course develops in full elsewhere. It closes with a worked checking exercise on a simpler stand-in problem, because the habit of checking a solver's answer, rather than trusting it, is exactly the skill this anchor project must show.

## What the project has to contain

The credible version of this project follows the formulation from the course's convex-guidance material. It is a **minimum-fuel** or **minimum-landing-error** problem with:

- a **thrust lower bound** — a real engine cannot throttle all the way down to zero while still burning — made convex by **[[lossless convexification|lossless-convexification]]**, not dropped;
- a **[[glide-slope constraint|glide-slope]]**, which keeps the vehicle above a cone rising from the landing site so it never skims the ground;
- a **pointing constraint**, which keeps the thrust direction within some angle of vertical;
- and, for when the target may be out of reach, the two-stage **[[G-FOLD|g-fold]]** structure: first find the closest landing point that can be reached, then find the least fuel to get there.

Reimplementing this formulation and reporting real numbers from it is one of the strongest anchor projects in this module. The paper this module cites, by Açıkmeşe, Carson and Blackmore, is the basis of modern powered-descent guidance. Reproducing its central result yourself is direct evidence you understand it, not only that you have read about it.

Three things separate a credible project from an animation of a trajectory that happens to reach the ground.

1. **A stated formulation.** Which cost, which constraints, and which of them were relaxed rather than dropped. A thrust lower bound handled by lossless convexification is a solved problem. A thrust lower bound quietly ignored is a different, much weaker project wearing the same plot.
2. **Verified constraint satisfaction.** After solving, check every reported trajectory against the original limits — thrust size, glide slope, pointing. Do not trust it because the solver returned an "optimal" status.
3. **A landing-accuracy Monte Carlo.** Run it over dispersed (randomly varied) starting conditions, and report a *distribution* of results, not a single case.

::: key
A powered-descent guidance project is credible when it states its formulation precisely — cost, constraints, and which constraints were convexified rather than dropped — verifies constraint satisfaction on the returned trajectory rather than trusting the solver's status flag, and reports a landing-accuracy distribution over a dispersion set rather than one nominal run.
:::

## Checking a solver's answer: a case where face value would mislead

The most valuable habit this project can show is not accepting a **[[solver|solver-status]]**'s answer at face value. A solver is the ready-made program that takes your optimization problem and returns the best answer it can find.

To make the point in full, use a deliberately simple problem. The rocket moves only straight up and down, its mass stays fixed, and the problem is solved as a **[[linear program|linear-program]]** — an optimization in which the cost and every rule are straight-line (linear) sums of the unknowns. The real problem is a **second-order cone program**, a richer convex type that allows rules like "the length of the thrust vector is at most this much". The simple version can be shown completely and solved with tools available anywhere. The lesson it teaches applies with equal force to the real one: know what your solver actually computed, not what you expected it to.

### The setup

- Start at altitude $h_0 = 500\,\mathrm{m}$, falling at $v_0 = -60\,\mathrm{m/s}$ (negative means downward).
- Arrive at $h_f = 0$ with $v_f = 0$ — on the ground, stopped — at a fixed final time $t_f = 20\,\mathrm{s}$.
- The control $u$ is the engine's upward acceleration (thrust divided by mass), limited to $6 \le u \le 14\,\mathrm{m/s^2}$.
- The motion is $\dot h = v$ and $\dot v = u - g$, with $g = 9.81\,\mathrm{m/s^2}$. Read $\dot v$ as "v dot": the rate at which $v$ changes.
- The cost to minimize is $\int u\,dt$ (read "the integral of u, d t" — the total of $u$ over the whole descent), a **[[fuel proxy|fuel-proxy]]**: a stand-in for propellant used.
- Time is chopped into 40 steps of $0.5\,\mathrm{s}$, with $u$ held constant within each step.

::: example A solver's answer, checked two independent ways
The solver reports a feasible trajectory with cost $256.200\,\mathrm{m/s}$, every thrust limit respected. The control history is mostly at the $14\,\mathrm{m/s^2}$ upper limit, with a few steps at the $6\,\mathrm{m/s^2}$ lower limit and a couple of isolated steps in between, near $10\,\mathrm{m/s^2}$. (The exact pattern depends on which solver you use — which is itself a clue.) It does not look like the clean **[[bang-bang|bang-bang]]** shape — full on, then full off — a minimum-effort problem is often expected to have.

**Check one: re-simulate.** Take the returned control sequence and step the motion forward yourself, outside the solver:

$$
h_{k+1} = h_k + v_k\,\Delta t + \tfrac12 (u_k - g)\,\Delta t^2, \qquad v_{k+1} = v_k + (u_k - g)\,\Delta t,
$$

with $\Delta t = 0.5\,\mathrm{s}$. The final altitude and speed come out zero to about $10^{-12}\,\mathrm{m}$ — computer rounding, nothing more. That confirms the dynamics constraints were truly satisfied, not merely reported as satisfied.

**Check two: a closed-form check on the cost.** The speed obeys $\dot v = u - g$, and $u$ appears nowhere else. Add up both sides over the whole descent:

$$
\int_0^{t_f} u\,dt = (v_f - v_0) + g\,t_f = (0 - (-60)) + 9.81 \times 20 = 60 + 196.2 = 256.200\,\mathrm{m/s}.
$$

That matches the solver's cost to every digit it reported. And it reveals something the odd control history alone would not. In this particular formulation, the cost is fixed by the speed at the start and end alone. It does not depend on the trajectory's shape at all. Every feasible trajectory costs exactly the same. So the solver had a huge tie to choose from, and it returned one of them, arbitrarily — which is why it looks unremarkable instead of bang-bang.

Sanity check: the average thrust acceleration is $256.2 / 20 = 12.81\,\mathrm{m/s^2}$, inside the $[6, 14]$ limits and above $g$, as it must be to stop a falling vehicle.
:::

::: note Why the cost cannot depend on the path
Integrate $\dot v = u - g$ from $0$ to $t_f$. The left side, $\int_0^{t_f} \dot v\,dt$, is the total change in speed, $v_f - v_0$. The right side is $\int_0^{t_f} u\,dt - g\,t_f$, since $g$ is constant. Rearranging gives $\int u\,dt = (v_f - v_0) + g\,t_f$. Nothing on the right mentions $h$ or when the thrust happened. Any control that meets the speed boundary conditions has this same total. The chopped-up version obeys it exactly too: $v_{40} - v_0 = \sum_k (u_k - g)\,\Delta t$.
:::

The lesson is not that the solver was wrong — it was right. The lesson is that an odd-looking result, taken at face value, could easily have been written up as "the optimizer found an interesting bang-off-bang strategy". That is a specific, confident and wrong explanation. The real explanation was a property of the simplified formulation's own structure.

The real coupled problem does not have this particular tie. There, thrust is limited in *size* (the length of the thrust vector), not axis by axis, and sideways and vertical motion share one thrust vector. That is one more reason the real formulation, not this toy, belongs in the anchor project. This exercise is about the checking habit, not the formulation.

::: warning
"The solver returned status optimal" is not verification. The status only says the solver's internal stopping rule was met. It does not say the formulation correctly represents your problem, or that the result means what you assume. Re-simulate the returned trajectory independently, and wherever a closed-form check on part of the answer exists — as the speed identity above did — use it.
:::

## The landing-accuracy Monte Carlo

One nominal descent shows the formulation can be implemented. A dispersion campaign — the same solve run many times, with the starting altitude and speed drawn at random — turns the project into evidence about performance under uncertainty.

Randomness is described with a **normal distribution**, the bell curve. $\mathcal{N}(500, 15^2)$, read "normal with mean 500 and standard deviation 15", means values cluster around $500$, and about two thirds land within $15$ of it.

::: example A dispersion campaign that finds its own limits
Run the same fixed-final-time landing problem 500 times, with $h_0 \sim \mathcal{N}(500, 15^2)\,\mathrm{m}$ and $v_0 \sim \mathcal{N}(-60, 3^2)\,\mathrm{m/s}$. In one such campaign, 20 cases — $20 / 500 = 4.0\%$ — come back **[[infeasible|infeasible]]**: no trajectory exists that meets both end conditions within the thrust limits in exactly $20\,\mathrm{s}$.

**The cost spread.** Among the 480 feasible cases, the fuel-proxy cost runs from $247.3$ to $262.2\,\mathrm{m/s}$, averaging $256.0\,\mathrm{m/s}$. The identity from the first example predicts every one of these exactly: each case costs $g\,t_f - v_0 = 196.2 - v_0$. So the whole spread in cost comes from the speed dispersion. The altitude dispersion does not move the cost at all.

**What drives infeasibility.** Every infeasible case started falling faster than $64\,\mathrm{m/s}$ ($v_0 \le -64.0\,\mathrm{m/s}$), and on average they started a little low (mean $h_0 \approx 488\,\mathrm{m}$). A faster start needs more total braking: at $v_0 = -66\,\mathrm{m/s}$ the average thrust must be $(196.2 + 66)/20 = 13.1\,\mathrm{m/s^2}$, close to the $14$ ceiling, leaving almost no freedom to shape the descent so it also reaches the ground at exactly $20\,\mathrm{s}$. A lower start tightens this further. Altitude alone never broke it: holding $v_0 = -60\,\mathrm{m/s}$ and varying only $h_0$ over the same spread gave no infeasible cases.

**Why this is the headline number.** A fixed-final-time formulation has no way to say "give me a little more time". It fails outright once the end conditions cannot be met in the time allowed. That is exactly the practical problem G-FOLD's first, feasibility-seeking stage exists to solve. A campaign that reports only the mean accuracy over the cases that happened to converge, and never mentions the ones that did not, is hiding its most informative result.

Sanity check: $4\%$ failures sits between the rarity of a $-64\,\mathrm{m/s}$ start (about $9\%$ of draws are that fast or faster, $4/3$ standard deviations out) and zero, as it should — some of those fast starts still succeed if they begin high enough.
:::

An interviewer will want the infeasible fraction as readily as the mean accuracy. They will also want to know whether the formulation used a **fixed** or **free final time**, and why. A fixed time is simpler to set up — and it is exactly the choice this exercise shows going wrong under dispersion. A free final time, or a two-stage architecture, is more robust and correspondingly more work. Either choice is defensible if you can say which one you made and what it costs.

::: key
In a dispersion campaign, report the infeasible-case fraction, the landing-accuracy distribution and the propellant margin — including the worst case, not only the mean over converged cases. Say whether the final time was fixed or free, and what that choice cost.
:::

## What the interviewer asks, and what the project needs ready

Four questions recur on this project.

1. **Why is the thrust lower bound handled the way it is?** Name lossless convexification. Ideally, show that the relaxation was *tight* on your own solved trajectories — the thrust never dipped below the real lower limit — not only that the theory says it should be.
2. **What happens when the target is unreachable?** A project with only a single-stage, fixed-time formulation should say so plainly as a limitation, exactly as the campaign above surfaced.
3. **What is the worst-case landing error and propellant margin?** Not only the mean. **Propellant margin** is the fuel left over at touchdown — the safety cushion.
4. **Which constraints were actually enforced in the code, and which only assumed?** A glide-slope or pointing constraint that appears in the write-up's equations but was never coded into the solver is a gap a reviewer will find by asking to see the constraint matrix.

## Check yourself

::: check
A powered-descent project's write-up states the cost, the dynamics and the thrust bounds, but does not say whether the thrust lower bound was convexified or dropped. Why does this omission matter more than it might first seem?
:::

::: answer
A dropped lower bound and a losslessly convexified one give similar-looking trajectories but represent very different engineering. Dropping the bound solves an easier, physically wrong problem — real engines cannot throttle to zero while still firing. Lossless convexification solves the real nonconvex problem exactly, with a theorem guaranteeing that the relaxation loses no fuel and no feasibility. A write-up that does not say which happened lets a reviewer assume the stronger claim by default, and the gap surfaces the moment they ask what enforces the lower bound — a question the project should already have answered in writing.
:::

::: check
In the worked linear-program example, re-simulating the solver's control sequence reproduced the solver's own trajectory to about $10^{-12}\,\mathrm{m}$. What does this check confirm, and what would it have caught if the solver's dynamics constraints had been coded with an error?
:::

::: answer
It confirms that the trajectory the solver reports as obeying the dynamics really does, when stepped forward independently outside the solver. That tests whether the optimization's constraint equations were the right ones, not only whether the solver stopped. Suppose the dynamics inside the linear program had a wrong sign, or a missing $\tfrac12 \Delta t^2$ term. The solver would still return "optimal" — for the wrong problem it was actually given. Only an independent re-simulation against the true dynamics would show that the returned controls do not bring the vehicle to the ground, stopped, under the real equations of motion.
:::

::: check
Explain why the fuel-proxy cost in the Monte Carlo followed the speed dispersion exactly but not the altitude dispersion, using the closed-form relation from the dynamics. Then say which variable mainly drove the infeasible cases.
:::

::: answer
The speed equation $\dot v = u - g$ does not contain altitude. Integrating it over the fixed time gives $\int u\,dt = (v_f - v_0) + g\,t_f$ for every feasible trajectory — only the starting speed and the fixed time appear, with no $h_0$ term. So altitude cannot move this cost in a feasible case. Infeasibility was driven mainly by the speed too: every failed case started faster than $64\,\mathrm{m/s}$, which demands an average thrust near the $14\,\mathrm{m/s^2}$ ceiling. Altitude played a supporting role — a lower start made a fast start worse — but altitude dispersion alone, at the nominal speed, caused no failures.
:::

::: check
A fixed-final-time campaign has 500 cases, of which 20 are infeasible. The 480 feasible ones land with a mean miss of $0.3\,\mathrm{m}$. The write-up reports "mean landing error $0.3\,\mathrm{m}$ over the Monte Carlo". What fraction of cases is left out, and why is the infeasible fraction the more important number to report?
:::

::: answer
$20 / 500 = 4\%$ of cases are left out, and the "mean over the Monte Carlo" is really the mean over the $96\%$ that worked. A fixed-final-time formulation fails outright, with no degraded answer, once the end conditions cannot be met in the time allowed. So the infeasible fraction directly measures how often the guidance law, as built, would have *no answer at all* for a real dispersed case. That is a more serious operational finding than how accurately it lands when it works. Reporting only the mean over converged cases silently throws away the cases most likely to be a real failure — the opposite of what a dispersion campaign is for.
:::

::: check
An interviewer asks whether your formulation uses a fixed or free final time, and why that matters. What should a well-prepared answer include?
:::

::: answer
Name which one you built. State the tradeoff honestly: a fixed final time is simpler to formulate and solve, but can go infeasible outright under dispersion in position or speed — as this lesson's own campaign did, at a 4% rate. A free final time, or a two-stage G-FOLD-style architecture, recovers a feasible answer across a wider range of conditions, at the cost of a more involved formulation. Then tie the choice to evidence already in your write-up, such as your own infeasible-case count, rather than stating the tradeoff in the abstract.
:::

## Summary

| Item | What it needs |
| --- | --- |
| Formulation | Stated cost and constraints; thrust lower bound convexified, not dropped, and said so explicitly |
| Constraint verification | Every returned trajectory re-checked against the original limits, not trusted from solver status |
| Solver-output check | Independent re-simulation (here, agreement to about $10^{-12}\,\mathrm{m}$), plus any closed-form identity available |
| Toy-problem identity | $\int u\,dt = (v_f - v_0) + g\,t_f = 256.2\,\mathrm{m/s}$ — the cost is the same for every feasible path |
| Monte Carlo | Landing-accuracy distribution and propellant margin over dispersed initial conditions |
| Most important number | The infeasible-case fraction (4% in the example), not only the mean over converged cases |
| Fixed vs free final time | Fixed is simpler but can fail outright; free or two-stage is more robust and more work |
| Role family | Entry, descent and landing guidance |

The next lesson turns to a different kind of correctness question — not whether a solver's output obeys its constraints, but whether an estimator's reported uncertainty can be trusted at all — in the third anchor project, the multiplicative quaternion EKF.

::: context convex Bowls, not egg cartons
A problem is **convex** when its shape is like a single bowl: roll a marble anywhere and it ends up at the one lowest point. A nonconvex problem is like an egg carton, full of dips; the marble can settle in a dip that is not the lowest. Convex problems can be solved reliably and fast, with a guarantee that the answer is the true best. That is why landing guidance, which must find an answer in a fraction of a second on a flight computer, is written in convex form whenever possible.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M 20 30 Q 90 170 160 30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="90" cy="92" r="7" fill="#b4232c"/>
  <path d="M 200 30 C 215 120, 235 120, 250 70 C 262 35, 272 35, 284 80 C 296 128, 322 128, 340 30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="230" cy="96" r="7" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="130">convex: one lowest point</text><text x="270" y="130">nonconvex: can get stuck</text>
  </g>
</svg>
```
:::

::: context lossless-convexification The ring that becomes a disk
Thrust between a minimum and a maximum size fills a ring: every arrow whose length is between the inner and outer circle. A ring is not convex — a straight line between two allowed thrusts on opposite sides passes through the forbidden hole. Lossless convexification fills in the hole with the help of an extra variable, then proves that the best answer never actually uses the filled-in part. So the easy problem gives the answer to the hard one, with nothing lost.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="60" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="90" cy="75" r="25" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="44" y1="50" x2="136" y2="100" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="270" cy="75" r="60" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="270" cy="75" r="25" fill="#f2b880" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="152">allowed thrust: a ring</text><text x="270" y="152">relaxed: hole filled in</text>
  </g>
</svg>
```

The red line joins two allowed thrusts but crosses the hole, which shows the ring is not convex.
:::

::: context glide-slope Staying above the cone
Picture an upside-down ice-cream cone with its tip at the landing pad. The **glide-slope constraint** says the vehicle must stay inside that cone, above its sloping sides, all the way down. It stops the guidance from choosing a fuel-saving path that sweeps in low and fast across the ground, where a small error means hitting terrain. The cone's angle is a design choice; a steeper cone is safer and costs more fuel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="180,150 60,20 300,20" fill="#8fb8f0" fill-opacity="0.45" stroke="none"/>
  <line x1="180" y1="150" x2="60" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="150" x2="300" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 110 30 Q 150 70 180 148" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M 30 60 Q 120 150 176 148" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <rect x="166" y="148" width="28" height="5" fill="#1f2a44"/>
  <g font-size="11" text-anchor="middle">
    <text x="215" y="42" fill="#1f2a44">allowed: inside the cone</text>
    <text x="60" y="130" fill="#b4232c">too low: forbidden</text>
    <text x="180" y="166" fill="#1f2a44">landing pad</text>
  </g>
</svg>
```
:::

::: context g-fold A name for large diverts
**G-FOLD** stands for Guidance for Fuel-Optimal Large Diverts. It came from work at NASA's Jet Propulsion Laboratory built on the lossless-convexification papers. In 2012 and 2013 it was flight-tested on Masten Space Systems' Xombie, a small rocket-powered vertical-landing test vehicle, which flew diverts computed on board. Its two stages — first find the nearest reachable landing point, then minimize fuel to it — mean it always has an answer, even when the original target is out of reach.
:::

::: context solver-status What "optimal" really means
A solver works by repeatedly improving a guess and stopping when certain math tests say it cannot do better within a small tolerance. When those tests pass it reports "optimal". That word describes the problem you *typed in*, not the one you *meant*. A sign error in a constraint produces a perfectly optimal answer to the wrong question. Solvers also report "infeasible" (no answer satisfies the rules) or "inaccurate" (it stopped early). Always read the status, and never stop at it.
:::

::: context linear-program The oldest optimization workhorse
A **linear program** minimizes a straight-line cost, such as $2x + 3y$, subject to straight-line rules, such as $x + y \le 10$. George Dantzig published the simplex method for solving them in 1947, and they have run airline schedules, factories and refineries ever since. Our toy landing problem fits because both its cost and its motion equations are linear in the thrust values. The real landing problem needs the length of a thrust vector, which is not linear, so it moves up to a second-order cone program.
:::

::: context fuel-proxy Why the total of u stands for fuel
A rocket engine burns propellant at a rate proportional to its thrust. With mass held fixed, thrust is mass times $u$, so the total of $u$ over time is proportional to the propellant used. Its units are meters per second — it is a change in speed, the same "delta-v" that rocket budgets are written in. The real problem lets the mass fall as fuel burns and minimizes the fuel directly, but the proxy captures the idea in a form a linear program can hold.
:::

::: context bang-bang Full on, full off
A **bang-bang** control jumps between its two extremes with nothing in between, like a home thermostat that turns the furnace fully on or fully off. Many minimum-time and minimum-fuel problems have bang-bang best answers, which is why engineers learn to expect that shape. When a solver returns something in between, it is worth asking why — sometimes it is a real feature, and sometimes, as here, it is a sign that many different answers are equally good.
:::

::: context infeasible When no answer exists
**Infeasible** means no choice of controls satisfies every rule at once. It is different from "the solver failed": it is a statement that the problem, as written, has no solution. In landing guidance this happens when the vehicle is too fast, too low or too far away to reach the target in the time allowed with the thrust available. A good guidance design plans for it — by freeing the final time or moving the target — instead of hoping it never comes up.
:::
