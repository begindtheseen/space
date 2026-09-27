---
id: l15-warm-starting-homotopy-continuation
title: Warm starting, homotopy and continuation
minutes: 25
covers:
  - "Warm starting, homotopy and continuation from an easy problem to the real one"
---

You need to cross a wide, fast stream. You could try one enormous leap from the bank and probably land in the water. Or you could step onto a stone near the bank, then the next stone, then the next, each one a short, safe step from the last. You end up on the far side either way. Only one of the two plans works reliably.

Here is a second picture. Your phone's map app is taking you across town and you miss a turn. The app does not plan a brand-new trip from your house. It starts from where you are now and fixes the route from there. The old route was nearly right, so fixing it is quick.

Trajectory solvers use both tricks. Scaling, from the last lesson, removes one kind of trouble: bad units. It does not make every problem easy. A strongly nonlinear trajectory, well scaled and correctly transcribed, can still refuse to converge from a reasonable-looking guess. The ideas in this lesson do not change the problem at all. They change *where the solver starts*. **Warm starting** begins a solve from an answer you already know is close, like the map app. **Continuation**, also called **[[homotopy|homotopy-word]]**, lays down stepping stones: it walks to the real problem through a chain of easier ones.

## Cold starts and warm starts

Every solver in this module is a relative of **Newton's method** (lesson 4): make a guess, fit a straight-line model of the problem there, and jump to where that model says the answer is. Near the answer this is wonderfully fast: the number of correct digits roughly doubles every step. Far from the answer, the straight-line model can be badly wrong, and the jump can land anywhere.

The set of starting guesses from which the method reliably reaches a given answer is called that answer's **[[basin of attraction|basin]]**. Inside the basin, convergence is quick and dependable. Outside it, anything can happen: slow wandering, a different answer, or failure.

A **cold start** begins from a generic guess — a straight line, a constant control, a "typical" value — that knows nothing about the true answer except common sense. A **warm start** begins from the solution of a closely related problem. If the two problems are close, that solution sits inside, or very near, the new basin, and the solver only has to polish.

::: example Kepler's equation, cold and warm
**[[Kepler's equation|kepler-equation]]** connects where a spacecraft is in an elliptical orbit to the time since it passed closest to the planet:

$$
E - e\sin E = M.
$$

Here $e$ is the orbit's eccentricity (how stretched it is), $M$ is the "mean anomaly" (a stand-in for elapsed time) and $E$ is the "eccentric anomaly" (a stand-in for position). Given $M$ and $e$, you solve for $E$. There is no formula, so flight software uses Newton's method:

$$
E_{\text{new}} = E - \frac{E - e\sin E - M}{1 - e\cos E}.
$$

Take a very stretched orbit, $e = 0.99$, and $M = 0.2$.

**Cold start.** The textbook guess is $E = M = 0.2$. The top of the fraction is $0.2 - 0.99\sin 0.2 - 0.2 = -0.19668$. The bottom, the slope, is $1 - 0.99\cos 0.2 = 0.029734$ — nearly flat. So the step is $0.19668/0.029734 = 6.61$, and the next guess is $E = 6.81$. The answer is near $1$, so that step [[overshot wildly|newton-overshoot]]. The following guesses wander all over, reaching $|E| \approx 1127$ at one point, before stumbling into the basin by luck. It takes $18$ steps to reach $E = 1.066997$.

**Warm start.** Suppose you solved the same orbit a moment earlier, at $M = 0.19$, and got $E = 1.04753$. Start there. The top of the fraction is $1.04753 - 0.99\sin(1.04753) - 0.2 = -0.0100$, the slope is $0.505$, and one step lands at $1.06732$ — already within $0.0003$ of the answer. It takes $3$ steps in all.

**Sanity check.** Both runs found the same $E = 1.066997$. Plug it back in: $1.066997 - 0.99 \times \sin(1.066997) = 0.2000$. The warm start did not find a different or better answer. It found the same answer six times faster, and it never left the neighborhood.
:::

This is the everyday use of warm starting on real vehicles. An onboard guidance system that re-plans every second, called a **[[receding-horizon controller|receding-horizon]]**, never solves from scratch. It takes last second's plan, slides it forward one second, and hands that to the solver as the starting guess. The problem barely changed in one second, so the old plan is almost right, and the solve is a few quick polishing steps.

## Continuation: stepping stones to the hard problem

A warm start needs a nearby answer. What if you do not have one? Then you build a path of them. That is **continuation**.

Here is the recipe:

1. Pick a **continuation parameter**, a single number, often written $\alpha$ ("alpha"), that turns an easy problem into the real one. At $\alpha = 0$ the problem is easy. At $\alpha = 1$ it is the mission you actually need.
2. Solve the easy problem from a cold start. Being easy, it converges.
3. Step $\alpha$ a little toward $1$. Solve again, starting from the answer you just found.
4. Repeat until $\alpha = 1$.

The parameter can be almost anything that slides from "easy" to "real": a thrust level, a constraint that starts loose and is tightened, an artificial helper term whose weight is taken to zero, or a literal blend of two costs,

$$
J_\alpha = (1 - \alpha)\,J_{\text{easy}} + \alpha\,J_{\text{real}},
$$

swept from $\alpha = 0$ to $\alpha = 1$. Read $J_\alpha$ as "J sub alpha": the cost you are using at stage $\alpha$.

::: key Why continuation helps, mechanically
A Newton-type solver converges reliably once its guess is inside the true solution's basin of attraction, and unreliably or not at all outside it. Continuation never asks the solver to find that basin from far away. Each step starts from the *previous* problem's converged answer, which, for a small enough change in the parameter, is already inside or very near the next problem's basin. The hard part — finding the basin at all — is done once, at the easy end, and never repeated.
:::

::: key Homotopy: the second standard fix
When a trajectory NLP will not converge, the two standard fixes are, first, to non-dimensionalize (states, controls, constraint residuals and cost all order one), and second, homotopy: solve an easy version (more thrust, no path constraints, shorter horizon) and sweep a parameter toward the real problem, warm starting each solve from the last.
:::

::: example Walking Kepler's equation up in eccentricity
Kepler's equation has a perfectly easy member: a circular orbit, $e = 0$. Then $E - 0 = M$, so $E = M = 0.2$ exactly, with no solving at all. Use $e$ itself as the continuation parameter.

**The stones.** Step $e$ from $0$ to $0.99$ in eleven equal steps of $0.09$: $0.09, 0.18, \dots, 0.90, 0.99$.

**The walk.** At each stone, run Newton's method starting from the previous stone's answer. The answers [[climb smoothly|kepler-path]]: $E = 0.2196$ at $e = 0.09$, $0.3574$ at $0.45$, $0.7552$ at $0.81$, and finally $1.066997$ at $0.99$. Each solve takes only $2$ to $4$ steps. The guess never leaves the neighborhood of the answer.

**The count.** That is $36$ steps in total, across $11$ solves — more than the cold start's $18$.

**What it bought.** Not speed, this time: reliability. The cold start reached the answer only after flinging its guess out past $1000$ and stumbling back by luck. Change $M$ or $e$ slightly and a cold start might wander somewhere else entirely. The continuation walk looks the same every time: short, safe steps. For a trajectory NLP, where each "wander" is a whole failed solve, reliability is the thing you need.

**Sanity check.** The walk ends on $E = 1.066997$, the same answer as before. Continuation changes the route, never the destination.
:::

The program below runs all three: the cold start, the warm start and the continuation walk.

```python
import numpy as np

def newton_kepler(M, e, E, tol=1e-12, max_iter=50):
    """Solve E - e sin E = M by Newton's method from the guess E.
    Returns the answer, the number of steps, and the largest |E| visited."""
    widest = abs(E)
    for steps in range(max_iter):
        F = E - e * np.sin(E) - M
        if abs(F) < tol:
            return E, steps, widest
        E = E - F / (1 - e * np.cos(E))
        widest = max(widest, abs(E))
    raise RuntimeError("no convergence")

M, e = 0.2, 0.99
E, n, w = newton_kepler(M, e, E=M)                 # cold start: the usual guess E = M
print(f"cold start        E = {E:.6f}  steps {n:2d}  widest |E| {w:7.1f}")

E_near, _, _ = newton_kepler(0.19, e, E=0.19)      # a moment ago: a nearby problem
E, n, w = newton_kepler(M, e, E=E_near)
print(f"warm start        E = {E:.6f}  steps {n:2d}  widest |E| {w:7.1f}")

E, total = M, 0                                    # continuation: e = 0 has answer E = M
for e_step in np.linspace(0, 0.99, 12)[1:]:        # 11 stepping stones up to e = 0.99
    E, n, w = newton_kepler(M, e_step, E=E)
    total += n
print(f"continuation      E = {E:.6f}  steps {total:2d}  (11 solves, 2 to 4 steps each)")
# cold start        E = 1.066997  steps 18  widest |E|  1126.7
# warm start        E = 1.066997  steps  3  widest |E|     1.1
# continuation      E = 1.066997  steps 36  (11 solves, 2 to 4 steps each)
```

::: note Why small steps stay inside the basin
Write the problem as equations $\mathbf{F}(\mathbf{z}, \alpha) = \mathbf{0}$, where $\mathbf{z}$ is every unknown and $\alpha$ the parameter. Suppose that at the current $\alpha$ you have a solution $\mathbf{z}^\star(\alpha)$, and the Jacobian $\partial\mathbf{F}/\partial\mathbf{z}$ there is not singular.

Nudge $\alpha$ by a small $\Delta\alpha$ and ask how far the solution moves. To first order, the equations must stay at zero:

$$
\frac{\partial\mathbf{F}}{\partial\mathbf{z}}\,\Delta\mathbf{z} + \frac{\partial\mathbf{F}}{\partial\alpha}\,\Delta\alpha = \mathbf{0}
\quad\Longrightarrow\quad
\Delta\mathbf{z} = -\left(\frac{\partial\mathbf{F}}{\partial\mathbf{z}}\right)^{-1}\frac{\partial\mathbf{F}}{\partial\alpha}\,\Delta\alpha.
$$

So the solution moves by an amount proportional to $\Delta\alpha$. (This is the **implicit function theorem**: a non-singular Jacobian guarantees the solution slides smoothly as $\alpha$ changes.) Newton's method has some basin of radius $\rho$ ("rho") around each solution. Choose $\Delta\alpha$ small enough that $\lVert\Delta\mathbf{z}\rVert < \rho$, and the old answer is guaranteed to start inside the new basin.

Two bonuses fall out. First, the formula gives a better starting guess than the old answer: $\mathbf{z}^\star(\alpha) + \Delta\mathbf{z}$, a straight-line forecast along the path. Solvers that use it are called **predictor-corrector** methods. Second, the argument shows exactly when continuation can fail: where $\partial\mathbf{F}/\partial\mathbf{z}$ becomes singular. That is where the warning at the end of this lesson lives.
:::

## Pushing the orbit transfer toward realistic thrust

Every orbit transfer in this module used $T_{\max} = 100\,\mathrm{N}$. That is strong enough to finish the climb in about two laps of the starting orbit, and it was chosen to keep the problem tractable. Real **[[electric propulsion|electric-thrust]]** pushes far more gently. Lower thrust means a longer transfer, many more laps, and a more strongly nonlinear problem. Does the direct method need continuation there? Measure, rather than assume.

::: example Cold starts hold up well — until they don't
Solve the identical transfer (same $r_0$, $r_1$, $m_0$ and $c$, in the canonical units of the last lesson) by Hermite-Simpson collocation. Use the same naive cold guess every time: straight-line $r$ and $v_t$, zero steering, and a flight time scaled up in proportion to the thrust cut. Lower the thrust step by step. "Laps" below means flight time divided by the starting orbit's period, $2\pi \times 927.64\,\mathrm{s} = 5828.5\,\mathrm{s}$. In one run:

| $T_{\max}$ | Converged? | Laps | Solve time |
| --- | --- | --- | --- |
| $20\,\mathrm{N}$ | Yes | $9.0$ | $2.0\,\mathrm{s}$ |
| $8\,\mathrm{N}$ | Yes | $23.4$ | $3.0\,\mathrm{s}$ |
| $5\,\mathrm{N}$ | Yes | $36.7$ | $22.7\,\mathrm{s}$ |
| $3\,\mathrm{N}$ | **No** | (had wandered to $81.1$) | $18.5\,\mathrm{s}$, constraint violation $5.1\times10^{-6}$ |

**Read the first three rows.** A well-scaled direct transcription with a naive guess is far sturdier than the indirect shooting of lesson 4. It cold-starts successfully through a twentyfold thrust cut ($100\,\mathrm{N}$ down to $5\,\mathrm{N}$) and a transfer of nearly $37$ laps — a regime where random costate guesses would almost never work.

**Read the last row.** It is not sturdy without limit. At $3\,\mathrm{N}$ the solver ran out of iterations still $5\times10^{-6}$ from feasible, with its flight time drifted to $81.1$ laps.

**Why the guess failed.** Not because of the flight time. The guess scaled it as $12.370307 \times 100/3 = 412.3$ canonical time units, which is $412.3/(2\pi) = 65.6$ laps — within a lap of the true answer. The problem is the *shape*. A straight line has none of the spiral's structure: none of the in-and-out breathing of $v_r$ each lap, none of the steering pattern repeated sixty-odd times. The more laps, the less the straight line resembles the real thing.
:::

::: example Continuation closes the gap
Re-solve the $3\,\mathrm{N}$ problem, but start from the *converged* $5\,\mathrm{N}$ solution instead of the straight line. It converges cleanly: constraint violation $2.8\times10^{-12}$, flight time $380\,332\,\mathrm{s}$, in $11.9\,\mathrm{s}$.

**Convert the answer.** $380\,332/5828.5 = 65.3$ laps, and $380\,332/86\,400 = 4.40$ days.

**What changed.** Nothing about the problem. Only the starting point: it reached $3\,\mathrm{N}$ by way of the $5\,\mathrm{N}$ answer instead of jumping there directly.

**Why the $5\,\mathrm{N}$ answer is the right stone.** It is itself a spiral, $36.7$ laps long, with the same steering pattern repeated each lap. It already has the right *shape*, and needs only stretching, not rediscovering. A straight line shares none of that structure at any thrust level. That is why continuation can succeed where a cleverer-looking cold guess might still fail: it supplies not only a numerically closer start, but a structurally correct one.

**Sanity check.** $65.3$ laps against the $5\,\mathrm{N}$ transfer's $36.7$ is a ratio of $1.78$; the thrust ratio is $5/3 = 1.67$. Three fifths of the thrust gives a trip $1.78$ times as long — close to, if a little more than, the $1.67$ you would expect if the same climb were bought with a gentler push.
:::

## Choosing the parameter

Thrust worked above because the family of problems changes *smoothly* with it. A $1\,\%$ change in $T_{\max}$ gives roughly a $1\,\%$-sized change in the best trajectory, not a sudden jump. That smooth path through the space of solutions is exactly what continuation walks along.

Other common choices work the same way:

- **Soft to hard constraints.** Replace a tight terminal constraint with a **[[penalty|penalty]]** — a cost for missing it — with a small weight. The first solve is nearly unconstrained. Raise the weight in stages, then switch to the hard constraint at the end.
- **No path constraints, then some.** Solve without a keep-out zone or a heating limit, then add it with a loose bound and tighten.
- **A shorter horizon.** Solve a short flight, then lengthen it stage by stage, warm-starting each from the last.
- **A physical knob.** For a Goddard-type singular-arc problem (lesson 5), start with an artificially high thrust bound. There the best flight is nearly bang-bang, with almost no singular arc. Sweep the bound down toward the true value, and the singular arc grows in from nothing, instead of having to be found whole.
- **A cost blend.** $J_\alpha = (1-\alpha)J_{\text{easy}} + \alpha J_{\text{real}}$, with $J_{\text{easy}}$ something smooth and forgiving, such as the sum of squared controls.

::: warning Continuation can fail too, and in a different way
A sweep can break because a step was too large: the previous answer was outside the next problem's basin. The fix is mechanical — take smaller steps (more stones), at the cost of more solves.

It can also break for a structural reason that no step size fixes. The family of solutions may have a **[[bifurcation|bifurcation]]**: a parameter value where the best trajectory changes character suddenly — for instance, where two different local optima swap places as the better one. There is no smooth path across that point to follow, so no amount of refining the steps walks across it.

Telling the two apart is a real diagnostic question. If shrinking the step keeps helping, the steps were too coarse. If the solve keeps failing at the *same* parameter value no matter how finely you approach it — or converges to a trajectory of a suddenly different shape — suspect a bifurcation.
:::

## Check yourself

::: check
Why does a $1\,\%$ step in a continuation parameter usually take far fewer solver iterations than the original cold start did, even though both are "solving an NLP from an initial guess"?
:::

::: answer
A cold start's guess is tied to the true solution only by general common sense (a straight line, a plausible constant control). The solver must travel an unknown distance through the space of trajectories before it enters the basin where Newton-type convergence is fast and reliable.

A $1\,\%$ step's guess is the converged solution of a problem only $1\,\%$ different. For a smoothly changing family, that guess is already very close to the new answer. The solver is doing local polishing — a few Newton-like corrections — instead of a global search. That is a far easier job, so it is much faster, exactly as the Kepler warm start needed $3$ steps against the cold start's $18$.
:::

::: check
In the cold-start table, $T_{\max} = 5\,\mathrm{N}$ converged in $22.7\,\mathrm{s}$ — slower than the easier thrust levels, but still successful. What does that trend suggest about how close the naive guess was to failing, even before it did at $3\,\mathrm{N}$?
:::

::: answer
Solve time is not the same thing as distance from the basin, but they are related. The jump from $3.0\,\mathrm{s}$ to $22.7\,\mathrm{s}$ suggests the straight-line guess was already much farther from the true $36.7$-lap answer than from the $9$-lap one, so the solver needed many more corrections to close the gap, even though it got there.

That kind of trend — solve times climbing steeply as the parameter moves away from where the guess is naturally good — is a warning sign in practice. A sweep whose solve times are shooting up, even while it still technically converges, is nearing the point where the next step fails outright. That is exactly what happened at $3\,\mathrm{N}$.
:::

::: check
A colleague suggests skipping the intermediate thrust levels and jumping straight from $T_{\max} = 100\,\mathrm{N}$ to $T_{\max} = 3\,\mathrm{N}$, warm-started from the $100\,\mathrm{N}$ solution. Why would this probably fail, even though warm-starting from $5\,\mathrm{N}$ to $3\,\mathrm{N}$ worked?
:::

::: answer
The $100\,\mathrm{N}$ solution is about a two-lap trajectory. The $3\,\mathrm{N}$ solution needs about $65$ laps. That is not only a longer flight time but a different *shape*: many more spiral turns, and a steering history that repeats its pattern every lap. So the $100\,\mathrm{N}$ answer is nowhere near the $3\,\mathrm{N}$ problem's basin, even though both belong to the same family.

The $5\,\mathrm{N} \to 3\,\mathrm{N}$ step worked because it was a small step in a smoothly changing family. Jumping from one end to the other is not continuation at all. It is one big, ungraded leap with no more structural advantage than the original cold start. The whole benefit of the technique comes from taking the change in pieces small enough that each one stays local.
:::

::: check
Why is "does a smaller step size fix the failed continuation step?" a genuine diagnostic, rather than one more thing to try?
:::

::: answer
It separates two different causes that look identical from outside — a solve that did not converge at some parameter value.

If the previous answer was only too far from the next problem's basin (an ordinary step-size problem), then inserting an intermediate value and solving in two smaller steps should succeed, because each smaller step stays inside the region where local convergence works.

If the failure is a bifurcation — the best trajectory genuinely changing character at that point — then smaller steps do not help, because there is no continuous path across it to trace. The solve keeps failing at the same value, or lands on a suddenly different kind of trajectory, however finely you subdivide. That persistence under refinement is the signature of a real structural break rather than an oversized step.
:::

::: check
In the Kepler cold start, the very first Newton step jumped from $E = 0.2$ to $E = 6.81$, far past the answer near $1.07$. Using the Newton formula, explain what made that step so large, and why a warm start avoids it.
:::

::: answer
The step is (top of the fraction) divided by (the slope). At $E = 0.2$ the top is $-0.19668$ and the slope is $1 - 0.99\cos 0.2 = 0.029734$. Dividing by a slope that small makes the step huge: $0.19668/0.029734 = 6.61$. The straight-line model says "the function is nearly flat here, so the zero must be far away", and that model is badly wrong a short distance later, where the curve bends up steeply.

A warm start from $E = 1.04753$ sits where the slope is $0.505$, about seventeen times steeper, and the top of the fraction is only $-0.0100$. The step is $0.0100/0.505 \approx 0.0198$ — short, accurate, and inside the basin. Close to the answer, the straight-line model is trustworthy; far from it, it can fling you anywhere.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Basin of attraction | The starting guesses from which Newton-type methods reliably reach an answer |
| Cold start | A generic guess that knows nothing about the answer; may wander or fail |
| Warm start | Start from the solution of a nearby problem; Kepler at $e = 0.99$: $3$ steps instead of $18$ |
| Receding horizon | Onboard re-planning warm-starts each solve from the last plan, shifted forward |
| Continuation / homotopy | A family of problems swept from easy ($\alpha = 0$) to real ($\alpha = 1$), each solve warm-started from the last |
| Why it works | Each step starts inside, or very near, the next problem's basin; small steps are guaranteed to by the implicit function theorem |
| Cold-start limit, measured | Naive-guess collocation succeeds to $36.7$ laps ($5\,\mathrm{N}$) and fails at $3\,\mathrm{N}$ |
| Continuation fix | From the $5\,\mathrm{N}$ answer, $3\,\mathrm{N}$ converges: violation $2.8\times10^{-12}$, $380\,332\,\mathrm{s}$ ($65.3$ laps) |
| Common parameters | Thrust or another physical knob; soft to hard constraints; added path constraints; horizon length; cost blend $(1-\alpha)J_{\text{easy}} + \alpha J_{\text{real}}$ |
| Step-size failure | Fixed by more, smaller steps |
| Bifurcation failure | Not fixed by smaller steps; there is no smooth path to follow |

Scaling fixes the numbers and continuation fixes the starting point. The next lesson turns to the software these techniques run inside — CasADi, IPOPT, GPOPS-II and the rest — and what each one does for you.

::: context homotopy-word Where the word comes from
"Homotopy" is built from Greek *homos*, "same", and *topos*, "place". In topology it means a smooth deformation of one shape or function into another, like slowly reshaping clay. In numerical work it means the same thing applied to a problem: $\alpha$ deforms the easy problem into the hard one, and the solution is carried along. Engineers use "homotopy" and "continuation" almost interchangeably.
:::

::: context basin Valleys that catch a ball
Think of every possible guess as a spot on a landscape, and the solver as a ball rolling downhill. Each answer sits at the bottom of a valley. The basin is every spot from which the ball ends up in that valley. A cold guess may start on a ridge or in the wrong valley. A warm guess starts on the valley's own slope.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="225" height="110" fill="#8fb8f0" opacity="0.35"/>
  <path d="M10,40 C40,40 60,120 135,120 C200,120 215,55 245,55 C275,55 290,95 315,95 C335,95 345,70 350,60" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="135" cy="120" r="4" fill="#1f2a44"/>
  <text x="135" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">the answer</text>
  <text x="135" y="33" font-size="11" text-anchor="middle" fill="#1d6fd1">its basin</text>
  <circle cx="170" cy="106" r="6" fill="#1d6fd1"/>
  <text x="160" y="92" font-size="11" fill="#1d6fd1">warm guess</text>
  <circle cx="298" cy="83" r="6" fill="#b4232c"/>
  <text x="300" y="118" font-size="11" text-anchor="middle" fill="#b4232c">cold guess</text>
</svg>
```

The red ball rolls into the wrong valley. The blue one cannot miss.
:::

::: context kepler-equation Back from orbital mechanics
Kepler's equation comes from the orbital maneuvers module, and Johannes Kepler wrote it down in 1609. It is the classic equation with no closed-form solution, so every orbit propagator solves it numerically, many thousands of times a second in a simulation. High-eccentricity orbits are the hard case, because the slope $1 - e\cos E$ becomes tiny near $E = 0$. That makes it a small, honest test bed for starting-guess strategies.
:::

::: context newton-overshoot A nearly flat slope throws you far
Here is $F(E) = E - 0.99\sin E - 0.2$ near its root, drawn to scale. At the cold guess $E = 0.2$ the curve is almost flat, so its tangent line (red) creeps along and does not reach zero until $E = 6.8$, far off the right edge. The true root is near $1.07$, where the curve has turned steeply upward.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="103.6" x2="345" y2="103.6" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="345" y="98" font-size="11" text-anchor="end" fill="#6c7a93">F = 0</text>
  <polyline points="40.0,140.7 49.4,140.6 58.8,140.5 68.1,140.3 77.5,140.1 86.9,139.8 96.2,139.3 105.6,138.8 115.0,138.0 124.4,137.1 133.8,136.0 143.1,134.7 152.5,133.1 161.9,131.3 171.2,129.2 180.6,126.8 190.0,124.0 199.4,121.0 208.8,117.6 218.1,113.8 227.5,109.7 236.9,105.2 246.2,100.3 255.6,95.0 265.0,89.2 274.4,83.0 283.8,76.4 293.1,69.4 302.5,61.9 311.9,53.9 321.2,45.5 330.6,36.7 340.0,27.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="77.5" y1="140.1" x2="340" y2="132.4" stroke="#b4232c" stroke-width="2"/>
  <polygon points="350,132.1 340,127.4 340,137.4" fill="#b4232c"/>
  <circle cx="77.5" cy="140.1" r="4" fill="#b4232c"/>
  <text x="77.5" y="160" font-size="11" text-anchor="middle" fill="#b4232c">guess 0.2</text>
  <circle cx="240.1" cy="103.6" r="4" fill="#1f2a44"/>
  <text x="240.1" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">root 1.07</text>
  <text x="290" y="152" font-size="11" text-anchor="middle" fill="#b4232c">tangent: zero at 6.8</text>
  <text x="40" y="20" font-size="11" fill="#1f2a44">E from 0 to 1.6</text>
</svg>
```
:::

::: context receding-horizon Re-planning every second
A receding-horizon controller, also called model predictive control, solves a trajectory optimization over the next stretch of flight, flies only the first moment of the answer, then re-solves from the new state. Because it runs over and over, the solver has a fresh warm start every time: the last answer, shifted. The next module, on convex guidance for powered descent, leans on this heavily, because an onboard solve must finish within a fixed time budget.
:::

::: context kepler-path The stepping stones, plotted
Each dot after the first is one converged solve (the first is the easy answer, $E = M$): eccentricity $e$ across, the answer $E$ up, for $M = 0.2$. The dots sit on one smooth curve, and each is a short hop from the one before, so every solve starts close to its answer. That smooth curve is what continuation needs; a sudden jump in it would be a bifurcation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,150.0 66.4,147.5 92.7,144.5 119.1,140.8 145.5,136.1 171.8,130.0 198.2,122.0 224.5,111.4 250.9,97.2 277.3,79.6 303.6,59.8 330.0,40.0" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="40.0" cy="150.0" r="4"/><circle cx="66.4" cy="147.5" r="4"/><circle cx="92.7" cy="144.5" r="4"/>
    <circle cx="119.1" cy="140.8" r="4"/><circle cx="145.5" cy="136.1" r="4"/><circle cx="171.8" cy="130.0" r="4"/>
    <circle cx="198.2" cy="122.0" r="4"/><circle cx="224.5" cy="111.4" r="4"/><circle cx="250.9" cy="97.2" r="4"/>
    <circle cx="277.3" cy="79.6" r="4"/><circle cx="303.6" cy="59.8" r="4"/>
  </g>
  <circle cx="330.0" cy="40.0" r="5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">e = 0</text><text x="330" y="166">0.99</text>
  </g>
  <text x="36" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0.2</text>
  <text x="36" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1.07</text>
  <text x="46" y="36" font-size="11" fill="#1f2a44">E</text>
  <text x="322" y="30" font-size="11" text-anchor="end" fill="#b4232c">the real problem</text>
  <text x="48" y="132" font-size="11" fill="#1d6fd1">easy: E = M</text>
</svg>
```
:::

::: context electric-thrust How gentle real thrusters are
Electric thrusters trade push for efficiency. NASA's Dawn spacecraft, which orbited Vesta and Ceres, had ion engines giving at most about $0.09\,\mathrm{N}$ — about the weight of two sheets of paper. Hall thrusters on communications satellites give a few hundredths to a few tenths of a newton. So even the $3\,\mathrm{N}$ in this lesson is generous. Transfers flown with such engines last months and spiral through hundreds of laps, which is why continuation is routine in low-thrust mission design.
:::

::: context penalty Paying for a miss instead of forbidding it
A hard constraint says "you must land exactly here". A penalty says "you may miss, but each meter of miss costs you" — a term like $w\,\lVert\mathbf{x}(t_f) - \mathbf{x}_{\text{target}}\rVert^2$ added to the cost, with weight $w$. A small $w$ makes the problem forgiving, so a rough guess can converge. Raising $w$ step by step pulls the miss toward zero, and the final solve can switch to the true hard constraint from a guess that already almost meets it.
:::

::: context bifurcation A fork in the road
"Bifurcation" means splitting in two, from the Latin for "two-pronged fork". Picture walking along a road of solutions as $\alpha$ grows. At a bifurcation the road forks, or two separate roads cross, and the best trajectory can jump from one road to the other. At that point the Jacobian $\partial\mathbf{F}/\partial\mathbf{z}$ typically becomes singular, which is exactly where the lesson's argument for why small steps stay inside the basin stops working. Specialized continuation software can detect such points and follow each branch.
:::
