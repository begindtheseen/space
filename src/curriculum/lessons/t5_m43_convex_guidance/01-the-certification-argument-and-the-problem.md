---
id: l01-certification-and-the-problem
title: Why powered-descent guidance must be convex
minutes: 22
covers:
  - "The certification argument: why onboard guidance demands a solver with a convergence guarantee and a bounded iteration count, and why a general NLP cannot give one"
  - "The minimum-fuel powered descent problem and its four non-convexities: the lower thrust bound, mass-depletion dynamics, thrust pointing, and logic-triggered constraints"
---

Imagine you are dropped into a valley on a foggy night and told to walk to the lowest point. You can only feel the slope under your feet. If the valley is one smooth bowl, you are fine: walk downhill until the ground is flat, and you are guaranteed to be at the bottom. You could even promise in advance how many steps it will take. But if the valley is a jumble of hills and dips, "walk downhill until it is flat" can leave you standing in a small hollow halfway up a hillside, with the real bottom a kilometer away. Nothing under your feet tells you which one you are in.

A rocket landing on its own engine faces the same choice, a few seconds before touchdown. Its flight computer knows the vehicle's position, velocity and remaining propellant. It does not know exactly what the wind did on the way down, how far the engine has drifted from its nominal thrust, or where a late hazard check moved the landing pad. From that state it must solve an optimization problem, act on the answer, and solve again a fraction of a second later, all the way to the ground. There is no second attempt.

This is **powered-descent guidance** — computing, onboard and in real time, the thrust commands that bring a vehicle to a soft landing. It is the one problem this module exists to solve. The algorithm that flew [[Masten's Xombie|xombie]] through divert maneuvers for JPL in 2012 and 2013, and the family of methods publicly described as behind Falcon 9's landing burns, all trace back to one 2007 paper and one idea in it: stated the right way, the landing problem is a bowl, not a mountain range. This lesson states the problem precisely and finds the four places where it first looks like a mountain range.

## Bowls and mountain ranges

The math word for "bowl-shaped" is **convex**. It applies to two kinds of things.

- A **convex set** is a region where the straight line between any two points stays inside. A solid ball is convex. A bagel is not: pick points on opposite sides of the hole and the line between them passes through the hole.
- A **convex function** is one whose graph curves up like a bowl, never down. A line drawn between two points on its graph always sits on or above the graph.

A **convex optimization problem** asks for the lowest value of a convex function over a convex set. Two facts about such problems were proved in the optimization module, and this whole module leans on them.

First, every **local optimum** — a point with nothing better nearby — is also a **[[global optimum|local-global]]**, the best point anywhere. In fog-and-valley terms, a bowl has no hollows on the hillside. A convex problem's solver cannot get stuck on a plausible-looking wrong answer.

Second, an **[[interior-point method|interior-point-bound]]** — the solver family that walks through the inside of the feasible region, using Newton steps on a "barrier" function that blows up at the edges — reaches a chosen accuracy in a number of **Newton steps** (one solve of a linear system each) that can be bounded *before* the flight. That bound comes from the shape of the barrier itself, not from the particular numbers the vehicle finds itself with on landing day.

Put the two together and a flight program can state a worst-case iteration count, multiply by the time one iteration takes on the flight computer, and get a provable ceiling on solve time. Not a hopeful average — a ceiling.

::: key The one-sentence case for convex onboard guidance
Any local optimum is global, and an interior-point method reaches a prescribed accuracy in an iteration count that can be bounded a priori — so worst-case execution time and convergence are provable, not merely tested.
:::

::: note Why it has to be true: in a convex problem, local means global
Suppose $\mathbf{x}$ is a local optimum of a convex function $f$ over a convex set, and suppose some other feasible point $\mathbf{y}$ is strictly better: $f(\mathbf{y}) < f(\mathbf{x})$. Walk from $\mathbf{x}$ toward $\mathbf{y}$ along the straight line $\mathbf{x} + \theta(\mathbf{y}-\mathbf{x})$, with $\theta$ (read "theta") between $0$ and $1$. Every point on it is feasible, because the set is convex. And because $f$ is convex,

$$
f\big(\mathbf{x}+\theta(\mathbf{y}-\mathbf{x})\big) \le (1-\theta)f(\mathbf{x}) + \theta f(\mathbf{y}) < f(\mathbf{x}) \quad \text{for every } \theta>0.
$$

Take $\theta$ tiny and you have a feasible point as close to $\mathbf{x}$ as you like that is strictly better than $\mathbf{x}$. That contradicts "$\mathbf{x}$ is a local optimum". So no better $\mathbf{y}$ exists: the local optimum is global.
:::

## Why "it worked in every test" is not a certification

**Certification** is the formal process by which a flight program convinces its reviewers that software will do its job in every case it can meet, not only the ones someone tried. For guidance, that means two promises: the solver returns a usable answer, and it returns it in time.

A general **nonlinear program** (NLP) — an optimization problem with curved constraints and no convexity — can make neither promise. The trajectory optimization module built the tools for such problems: **direct transcription** (chop the trajectory into a list of numbers) followed by a sequential quadratic programming or interior-point NLP solver. But when such a solver converges, it lands on a point that satisfies only the **first-order necessary conditions** — the "ground is flat here" test. That might be a local optimum, or even a saddle, with no certificate that a better trajectory is not sitting elsewhere. Worse for certification, *whether* it converges, and how many iterations it takes, depends on the starting guess in a way no advance bound covers.

**Indirect methods** have the same gap from a different direction. They solve the necessary conditions of the minimum principle directly, by root-finding on the unknown costates — **[[shooting|shooting-method]]**. That is a Newton method on a handful of unknowns: blazingly fast when it converges, but with no global convergence guarantee. It also assumes you already know the pattern of the thrust arcs (say, "coast, then burn").

Guidance runs every cycle, on whatever off-nominal state the vehicle is in, with nobody watching the log. "It converged on every case we tried" is evidence. It is not a proof, and a vehicle with its engine lit cannot fall back on evidence.

::: example Five starting guesses, one non-convex solver, five different answers
Take a small landing problem in two dimensions (downrange and altitude). A Mars lander of mass $1905\,\mathrm{kg}$ starts at $\mathbf{r}_0 = (300, 900)\,\mathrm{m}$ with velocity $\mathbf{v}_0 = (-20, -40)\,\mathrm{m/s}$. Gravity is $g = 3.7114\,\mathrm{m/s^2}$, the engine's specific impulse is $I_{sp}=225\,\mathrm{s}$, and it must land at rest at the origin after $t_f = 24\,\mathrm{s}$. The thrust vector $\mathbf{T}_k$ is held fixed over each of eight $3\,\mathrm{s}$ steps. Its size must stay in the band $\rho_{\min} = 4972\,\mathrm{N} \le \|\mathbf{T}_k\| \le \rho_{\max} = 13260\,\mathrm{N}$ (read these "rho min" and "rho max"), written exactly as the non-convex constraint it is — nothing relaxed.

Hand this to SciPy's SLSQP, a standard constrained NLP solver, from five physically sensible starting guesses, each allowed up to $300$ iterations:

| starting guess | SciPy reports success | iterations used | propellant burned |
| --- | --- | --- | --- |
| A: hover ($7070\,\mathrm{N}$ straight up) | Yes | 42 | $135.962\,\mathrm{kg}$ |
| B: near minimum throttle ($5000\,\mathrm{N}$) | Yes | 128 | $142.545\,\mathrm{kg}$ |
| C: near maximum throttle ($13000\,\mathrm{N}$) | Yes | 43 | $138.792\,\mathrm{kg}$ |
| D: mid-throttle ($9116\,\mathrm{N}$), tilted $+10°$ | Yes | 45 | $143.435\,\mathrm{kg}$ |
| E: mid-throttle ($9116\,\mathrm{N}$), tilted $-10°$ | Yes | 191 | $129.609\,\mathrm{kg}$ |

**Step 1: read the success column.** Every run reports success, and every run lands at rest on the target to within $10^{-9}\,\mathrm{m}$.

**Step 2: read the propellant column.** Five "successful" answers, from $129.6$ to $143.4\,\mathrm{kg}$. The worst is $10.7\%$ more than the best, and the only thing that changed was the starting guess.

**Step 3: ask whether any of them is the true best.** None is. Now take the same physical problem after this module's **lossless convexification** (the next two lessons build it: the thrust band becomes a cone, by a proof, not a trick) and solve it with a barrier-method interior-point solver from three unrelated starting points. All three return $126.463\,\mathrm{kg}$, agreeing to nine figures, each after $10$ outer barrier rounds.

**Step 4: sanity check the convex answer.** Restart SLSQP *from* the convex solution, with the exact non-convex band, and it creeps down to $126.439\,\mathrm{kg}$. So the convex answer is within $0.024\,\mathrm{kg}$ — $0.02\%$ — of the true best. The tiny gap is a deliberately cautious mass-bound approximation from lesson three. Meanwhile SLSQP's own best guess, E, burned $2.5\%$ more than necessary, and its worst, D, $13.4\%$ more.
:::

::: warning A fast solve on the nominal trajectory is not evidence
It is tempting to point at the solver's behavior on the expected starting state and call the guidance validated. That is the case a solver is least likely to struggle on, because someone tuned the initial guess against it. The cases that matter are the ones nobody tuned for: a dispersed starting position, a lighter-than-planned propellant load, a target moved late by hazard avoidance. A non-convex solver's behavior there is not implied by its behavior on the nominal case. A convex solver's worst case is implied by the bound. That is the whole point.
:::

## The minimum-fuel powered-descent problem

Strip away everything but the physics and the goal, and the problem this module keeps returning to is short. Treat the vehicle as a point with position $\mathbf{r}$, velocity $\mathbf{v}$ and mass $m$, flying over flat ground in constant gravity $\mathbf{g}$. The engine pushes with a thrust vector $\mathbf{T}$. Then

$$
\dot{\mathbf{r}} = \mathbf{v}, \qquad \dot{\mathbf{v}} = \frac{\mathbf{T}}{m} + \mathbf{g}, \qquad \dot m = -\alpha\|\mathbf{T}\|_2, \qquad \alpha = \frac{1}{I_{sp}\,g_0}.
$$

Read $\dot{\mathbf{r}}$ as "r dot", the rate of change of position. Read $\|\mathbf{T}\|_2$ as "the norm of T" — its length, the thrust magnitude in newtons. The second equation is Newton's second law plus gravity; the third says propellant burns in proportion to thrust.

In the third, $I_{sp}$ is the **[[specific impulse|isp-g0]]**, a measure of engine efficiency in seconds, and $g_0 = 9.80665\,\mathrm{m/s^2}$ ("g nought") is standard Earth gravity. It is there only to convert seconds into a mass-flow coefficient, so it stays $9.80665$ even when landing on Mars. The Greek letter $\alpha$ ("alpha") is that coefficient, in seconds per meter: kilograms burned per second, per newton of thrust. For $I_{sp}=225\,\mathrm{s}$, $\alpha = 1/(225\times9.80665) = 4.532\times10^{-4}\,\mathrm{s/m}$.

The rules of the game:

- start from the known $\mathbf{r}(0)$, $\mathbf{v}(0)$, $m(0)$;
- touch down on target at rest: $\mathbf{r}(t_f) = \mathbf{r}_{\text{target}}$ and $\mathbf{v}(t_f) = \mathbf{0}$;
- keep thrust in a band, $\rho_{\min} \le \|\mathbf{T}\|_2 \le \rho_{\max}$, with $\rho_{\min} > 0$;
- keep the thrust within some angle of a reference direction (a pointing limit).

The goal: land with as much propellant left as possible. That is, maximize $m(t_f)$, which is the same as minimizing $\int_0^{t_f}\|\mathbf{T}\|_2\,dt$, the total thrust used.

## Four places the bowl turns into mountains

Read that problem looking for convexity, and four things resist it.

**1. The lower thrust bound.** $\|\mathbf{T}\|_2 \ge \rho_{\min}$ cuts a ball-shaped hole out of the middle of the allowed thrusts. A liquid engine has a minimum stable throttle setting, and on most vehicles it cannot be shut off and relit at will during the landing burn. So $\rho_{\min}$ is strictly positive and unavoidable. The allowed set is a hollow shell — an **annulus**, a ring with the middle removed, like a bagel — and a bagel is not convex. It gets the whole next lesson.

**2. Mass-depletion dynamics.** $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ divides one unknown by another. Equality constraints that are not straight-line (affine) are never convex, and this one is **[[bilinear|bilinear]]**: fix either $\mathbf{T}$ or $m$ and it is a straight-line relationship in the other, but let both move and it curves. Doubling $m$ at fixed $\mathbf{T}$ halves the acceleration. This is fixed not by a relaxation but by a change of variables, in lesson three.

**3. Thrust pointing.** A limit on how far from vertical the thrust may point is naturally written on its *direction*, $\hat{\mathbf{T}} = \mathbf{T}/\|\mathbf{T}\|_2$ (read "T hat", the thrust scaled to length one). A constraint on a scaled-to-length-one vector looks suspicious for the same reason division did. It belongs on this list as a real worry, and the example below settles it.

**4. Logic-triggered constraints.** Some limits apply only sometimes: a plume keep-out only below some altitude, an angle-of-attack cap only above some dynamic pressure. "If this, then that" splits the possible trajectories into a **[[union|union-of-convex]]** — the ones that never trip the condition, plus the ones that trip it and obey the extra limit. A union of convex sets is almost never convex.

::: example Each non-convexity, in the numbers of one vehicle
Use the $1905\,\mathrm{kg}$ lander again: $\rho_{\min} = 4972\,\mathrm{N}$, $\rho_{\max} = 13260\,\mathrm{N}$, $\alpha = 4.532\times10^{-4}\,\mathrm{s/m}$. These are the classic numbers from the [[2007 paper|acikmese-ploen]] this module grew from.

**The annulus.** Take $\mathbf{T}_1 = (4972, 0, 0)\,\mathrm{N}$ and $\mathbf{T}_2 = (-4972, 0, 0)\,\mathrm{N}$. Both have length exactly $\rho_{\min}$, so both are allowed. Their midpoint is $\tfrac12(\mathbf{T}_1+\mathbf{T}_2) = (0,0,0)$, and $\|\mathbf{0}\| = 0 < \rho_{\min}$: not allowed. A convex set contains the whole segment between two of its points. This one does not, so it is not convex — shown by arithmetic, not by assertion.

**Mass depletion.** The same thrust $\mathbf{T} = (0,0,13260)\,\mathrm{N}$ gives $\mathbf{T}/m = (0,0,6.961)\,\mathrm{m/s^2}$ at the full $1905\,\mathrm{kg}$. After $405\,\mathrm{kg}$ has burned, leaving $1500\,\mathrm{kg}$, it gives $(0,0,8.840)\,\mathrm{m/s^2}$. Divide: $8.840/6.961 = 1.27$, a $27\%$ jump in acceleration from the same force, entirely from the division.

**Pointing.** Take $\mathbf{T} = (3000, 0, 9000)\,\mathrm{N}$ and a limit $\theta_{\max} = 35°$ from vertical. Its length is $\sqrt{3000^2+9000^2} = 9487\,\mathrm{N}$, and its angle from vertical is $\arccos(9000/9487) = 18.43°$. Written on the direction, the limit reads $\hat T_z \ge \cos\theta_{\max}$ — the suspicious shape. Now multiply both sides by $\|\mathbf{T}\| > 0$:

$$
T_z \ge \|\mathbf{T}\|_2\cos\theta_{\max}.
$$

Check the numbers: $\cos 35° = 0.81915$, so the right side is $9486.8\times0.81915 = 7771\,\mathrm{N}$, and $9000 \ge 7771$ holds. Now the shape. The left side is affine (a straight-line function of $\mathbf{T}$). The right side is a norm times a positive constant, which is convex. "Affine $\ge$ convex" is a convex constraint: a second-order cone, worked out in full with the glideslope and speed limits in lesson five. So this pointing limit turns out fine. The lesson is to check, not to assume — a [[keep-out cone|keep-in-keep-out]] would not turn out fine at all.

**Logic-triggered.** A constraint enforced only below $50\,\mathrm{m}$ altitude applies to the part of the trajectory in the region $r_z < 50$ and not to the part above. The set of trajectories that satisfy "either stay above $50\,\mathrm{m}$ the whole way, or obey the extra limit below $50\,\mathrm{m}$" is two differently shaped sets glued along the altitude line. It is not convex in general.
:::

::: key Why rho_min <= ||T|| <= rho_max is non-convex
The set is a spherical annulus. The upper bound is a ball (convex); the lower bound removes an interior region, so the average of two opposed feasible thrusts is infeasible. It exists because a liquid engine has a minimum throttle and often cannot be restarted.
:::

::: key The four non-convexities, and what happens to each
- **Lower thrust bound:** fixed by an exact relaxation whose optimum is provably the true optimum (lossless convexification, lesson two).
- **Mass-depletion dynamics:** fixed by an exact change of variables that makes the translational dynamics linear (lesson three).
- **Thrust pointing**, with glideslope and speed limits: already convex cones when written correctly — no relaxation needed (lesson five).
- **Logic-triggered constraints:** handled by state-triggered constraints, which encode "if–then" continuously instead of with an integer variable (lesson eleven).

What is left after all four — the truly nonlinear rotational dynamics of a 6-DoF landing — is what the second half of the module builds **successive convexification** to handle, with no exactness guarantee and an honest account of when it fails to converge.
:::

## Check yourself

::: check
A colleague points out that IPOPT — an interior-point NLP solver — and a convex interior-point solver both use a log-barrier and Newton's method. Why does one get a provable iteration bound and the other not?
:::

::: answer
The bound comes from analyzing the barrier on a *convex* feasible set. There, the path the solver follows (the **central path**) is a well-behaved curve leading to the single global optimum, and Newton's method along it converges at a rate set by the barrier's own geometry, not by the problem's numbers. Remove convexity and you can still build a barrier and still take Newton steps. But the path no longer leads to a global optimum. It leads to whatever stationary point is nearest the current iterate, and nothing in the analysis bounds how many steps that takes from an arbitrary start, or promises the destination is any good. The guarantee lives entirely in the shape of the set.
:::

::: check
In the five-start SLSQP table, the fastest runs (A in 42 iterations, C in 43) were not the best, and the slowest (E, 191 iterations) was the best of the five. Is "the run that converges fastest gives the best answer" — or its opposite — a rule you can rely on for a non-convex solve?
:::

::: answer
Neither. How fast a local method converges reflects the local curvature near whatever point the iteration happened to approach. How good that point is depends on the whole feasible set, which a local method never examines. A non-convex solver can converge quickly to a poor local optimum because it started near a place where the slope vanishes, and that says nothing about global quality. Here the slowest run happened to be the best; on another problem it could be the reverse.
:::

::: check
An engine has $\rho_{\min} = 2200\,\mathrm{N}$ and $\rho_{\max} = 9000\,\mathrm{N}$. Give two allowed thrust vectors whose midpoint is not allowed, and say which bound the midpoint breaks.
:::

::: answer
Any pair of opposite vectors on the lower bound works, for instance $\mathbf{T}_1 = (2200, 0, 0)\,\mathrm{N}$ and $\mathbf{T}_2 = (-2200, 0, 0)\,\mathrm{N}$. Both have length $2200\,\mathrm{N} = \rho_{\min}$, inside $[\rho_{\min},\rho_{\max}]$. Their midpoint is $(0,0,0)$, with length $0$. That breaks the *lower* bound ($0 < 2200$) while easily meeting the upper one. The upper bound alone, $\|\mathbf{T}\|\le\rho_{\max}$, is a solid ball and is convex. It is the lower bound alone that breaks convexity, which is why lossless convexification targets that one inequality and leaves the upper bound untouched.
:::

::: check
Why does $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ count as a non-convexity? It is only a division, not a norm bound like the thrust annulus.
:::

::: answer
The trouble is that *both* $\mathbf{T}$ and $m$ are unknowns here, so $\mathbf{T}/m$ is a ratio of two unknowns. It is bilinear: fix either one and the relationship in the other is a straight line, but vary both and it curves. The set of triples $(\mathbf{T}, m, \mathbf{a})$ with $\mathbf{a} = \mathbf{T}/m$ is a curved surface, not a flat one, and an equality constraint on a curved surface is never convex, whichever way it bends. So the fix is not a relaxation like the thrust bound gets. It is an exact change of variables — make $\mathbf{u} = \mathbf{T}/m$ an unknown in its own right — that removes the division altogether.
:::

::: check
A vehicle needs to keep its plume away from a piece of ground equipment: the thrust must point at least $60°$ away from one particular horizontal direction. Is this the same convex cone as the pointing example, relabeled?
:::

::: answer
No. "Point within $\theta_{\max}$ of a direction" keeps $\mathbf{T}$ *inside* a solid cone, which is convex, as the example showed. "Point at least $60°$ *away* from a direction" keeps $\mathbf{T}$ *outside* a solid cone — the complement of a convex set, which is almost never convex. Two allowed thrusts on opposite sides of the forbidden cone can average to one pointing straight into it. A keep-out pointing constraint is a real, unresolved non-convexity, like the logic-triggered case. It is handled with a cautious convex approximation, or with the state-triggered and successive-convexification tools later in this module — never with the keep-in algebra.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Convex problem | Convex function over a convex set; every local optimum is global |
| Certification argument | Convex: global optimum, iteration count bounded before flight. Non-convex NLP or indirect shooting: local optimum only, no advance bound, outcome depends on the starting guess |
| Five-start example | SLSQP on a $24\,\mathrm{s}$ planar descent: all $5$ report success; propellant $129.6$–$143.4\,\mathrm{kg}$; true best $126.439\,\mathrm{kg}$ |
| Convex contrast | Same problem convexified, $3$ starts: $126.463\,\mathrm{kg}$ every time, $10$ outer rounds each |
| Dynamics | $\dot{\mathbf{r}}=\mathbf{v}$, $\dot{\mathbf{v}}=\mathbf{T}/m+\mathbf{g}$, $\dot m = -\alpha\|\mathbf{T}\|$, $\alpha = 1/(I_{sp}g_0)$; $\alpha=4.532\times10^{-4}\,\mathrm{s/m}$ at $I_{sp}=225\,\mathrm{s}$ |
| Non-convexity 1 | $\|\mathbf{T}\|\ge\rho_{\min}$: an annulus; the midpoint of opposite boundary points is infeasible |
| Non-convexity 2 | $\mathbf{T}/m$: bilinear in two unknowns, a curved equality |
| Non-convexity 3 | Thrust pointing: suspicious, but as a keep-in cone $T_z \ge \|\mathbf{T}\|\cos\theta_{\max}$ it is convex; a keep-out cone is not |
| Non-convexity 4 | Logic-triggered limits: a union of regions, not convex |
| Fixes ahead | Lossless convexification (1); change of variables (2); cone constraints (3); state-triggered constraints (4); successive convexification for 6-DoF |

The next lesson takes the first non-convexity — the bagel-shaped thrust band — and builds the relaxation this lesson only promised: it proves the relaxation gives back the exact original optimum, not an approximation of it, and checks that claim number by number on a real solve.

::: context xombie A rocket that flew the math
Xombie was a small vertical-takeoff, vertical-landing rocket built by Masten Space Systems in Mojave, California. In 2012 and 2013 JPL used it as a flying testbed for G-FOLD, the convex landing guidance this module builds. On those flights the vehicle took off, then — partway through a descent — computed a new, fuel-optimal path onboard and diverted hundreds of meters sideways to a different pad, the kind of maneuver a Mars lander would need to dodge a boulder field. Lesson four tells that story in detail.
:::

::: context local-global One bowl, or many hollows
On the left, a convex function: walk downhill from anywhere and you reach the one bottom. On the right, a non-convex one: a ball rolling downhill from the left stops in the shallow hollow and never learns that the deeper one exists. A local solver only feels the slope where it stands, so it cannot tell these two situations apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polyline points="25.0,40.0 35.0,62.7 45.0,81.7 55.0,96.8 65.0,108.2 75.0,115.7 85.0,119.5 90.0,120.0 95.0,119.5 105.0,115.7 115.0,108.2 125.0,96.8 135.0,81.7 145.0,62.7 155.0,40.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="90" cy="113" r="6" fill="#1f2a44"/>
  <text x="90" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">convex: one bottom</text>
  <polyline points="195,48.4 200,53.0 205,61.0 210,72.5 215,85.4 220,95.9 225,100.0 230,95.9 235,85.4 240,72.5 245,61.0 250,53.0 255,48.5 260,46.4 265,45.9 270,46.6 275,48.8 280,53.4 285,61.8 290,74.4 295,90.6 300,107.3 305,120.2 310,125.0 315,120.2 320,107.3 325,90.6 330,74.4 335,61.8 340,53.4 345,48.7 350,46.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="225" cy="93" r="6" fill="#b4232c"/>
  <circle cx="310" cy="118" r="6" fill="#1f2a44"/>
  <text x="225" y="120" font-size="11" text-anchor="middle" fill="#b4232c">stuck here</text>
  <text x="310" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">true best</text>
  <text x="272" y="165" font-size="12" text-anchor="middle" fill="#1f2a44">non-convex: many hollows</text>
</svg>
```
:::

::: context interior-point-bound Where the iteration bound comes from
An interior-point method replaces "stay inside the constraints" with a **barrier**, a function that rises to infinity at the edges, like $-\log$ of the distance to a wall. For the barriers used on cone constraints, a property called **self-concordance** lets you prove that each round shrinks the gap to the optimum by a fixed factor. The theory gives a bound of order $\sqrt{\nu}\,\log(1/\varepsilon)$ Newton steps, where $\nu$ ("nu") counts the barrier's size (about two per cone) and $\varepsilon$ ("epsilon") is the accuracy wanted. In practice solvers finish in tens of iterations, almost regardless of the data.
:::

::: context shooting-method Why it is called shooting
Picture aiming a cannon at a target. You guess an angle, fire, see where the ball lands, adjust, and fire again. Indirect trajectory methods do the same: guess the unknown starting costates, integrate the equations forward, see how far the end misses, and correct with Newton's method. When the guess is close, it hits in a few shots. When it is far off, it can fly wildly away, and nothing tells you in advance which will happen.
:::

::: context isp-g0 Specific impulse, and why Earth's gravity sneaks in
Specific impulse, $I_{sp}$, says how long one kilogram-weight of propellant can produce one kilogram-weight of thrust. The "weight" part is measured in Earth gravity, so $g_0 = 9.80665\,\mathrm{m/s^2}$ appears in the formula even on Mars. Multiply the two and you get the exhaust speed: $225 \times 9.80665 = 2206.5\,\mathrm{m/s}$ for this lander. The mass flow is thrust divided by exhaust speed, which is why $\alpha = 1/(I_{sp}g_0)$.
:::

::: context bilinear What bilinear means
A function of two variables is **bilinear** when it is linear in each one separately. The simplest example is a product, $x\,y$: hold $y = 3$ and $3x$ is a straight line; hold $x = 2$ and $2y$ is a straight line. But $x\,y$ as a surface is a saddle, curving up in one diagonal direction and down in the other. That curve is what breaks convexity. Dividing $\mathbf{T}$ by $m$ has the same character, because it is $\mathbf{T}$ times $1/m$.
:::

::: context union-of-convex Why gluing two convex pieces fails
Each rectangle below is convex. Their union, an L shape, is not: the segment between the two dots leaves the shape at its midpoint. An "if–then" constraint builds exactly this kind of shape out of trajectories. Mixed-integer programming can model it with a yes-or-no variable, but that loses the bounded-time guarantee, which is why lesson eleven encodes it continuously instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="20" width="160" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="100" y="20" width="50" height="130" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="250" y1="30" x2="120" y2="140" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="250" cy="30" r="5" fill="#1f2a44"/>
  <circle cx="120" cy="140" r="5" fill="#1f2a44"/>
  <circle cx="185" cy="85" r="6" fill="#b4232c"/>
  <text x="196" y="102" font-size="12" fill="#b4232c">midpoint is outside</text>
  <text x="270" y="50" font-size="12" fill="#1f2a44">piece A</text>
  <text x="40" y="120" font-size="12" fill="#1f2a44">piece B</text>
</svg>
```
:::

::: context acikmese-ploen The paper everything descends from
Behçet Açıkmeşe and Scott Ploen, both at JPL, published "Convex Programming Approach to Powered Descent Guidance for Mars Landing" in the *Journal of Guidance, Control, and Dynamics* in 2007. Their example lander used six $3.1\,\mathrm{kN}$ engines canted $27°$ and throttled between $30\%$ and $80\%$. The upward share is $\cos27° = 0.891$, so the band is $0.3\times6\times3100\times0.891 \approx 4972\,\mathrm{N}$ to $0.8\times6\times3100\times0.891 \approx 13258\,\mathrm{N}$, rounded to $13260\,\mathrm{N}$ in the numbers used here.
:::

::: context keep-in-keep-out Staying inside a cone versus staying out of one
On the left, the allowed thrusts lie inside a cone about vertical: two allowed arrows, and their average (red) is still inside. On the right, the cone is forbidden: two allowed arrows, one on each side, and their average points straight into the forbidden zone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M90,140 L26.9,49.9 L153.1,49.9 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <line x1="90" y1="140" x2="132.3" y2="49.4" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="140" x2="72.6" y2="41.5" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="140" x2="102.4" y2="45.5" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="90" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">keep-in: convex</text>
  <path d="M270,140 L206.9,49.9 L333.1,49.9 Z" fill="#f2b880" stroke="#b4232c" stroke-width="1"/>
  <line x1="270" y1="140" x2="339.3" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="270" y1="140" x2="200.7" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="270" y1="140" x2="270" y2="100" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="270" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">forbidden</text>
  <text x="270" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">keep-out: not convex</text>
</svg>
```
:::
