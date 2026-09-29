---
id: l06-flight-time-and-discretization
title: Flight time and what discretization preserves
minutes: 18
covers:
  - Flight time as the one non-convex parameter, and solving it by a line search over an inner SOCP
  - Discrete-time lossless convexification and what survives discretisation
---

Carry a heavy bag of groceries up three flights of stairs. If you try to do it in five seconds, you cannot: your legs are not strong enough, however hard you push. If you take five minutes, stopping on every step, your arms ache from holding the bag the whole time. Somewhere in between is the least tiring pace — quick enough that you are not holding the bag forever, slow enough that you are not straining.

A landing has the same shape. Every solve in this module so far has been handed the flight time $t_f$ ("t sub f") as a fixed number, alongside $\rho_{\min}$ and $I_{sp}$. The optimizer was never asked to choose it. That was a deliberate decision, and this lesson explains why: flight time is the one number in the whole 3-DoF problem that resists everything this module did to make the problem convex. The fix is not a new relaxation. It is a simple search wrapped around the solver we already have.

The lesson then closes a question left open since lesson three first chopped the flight into nodes: does chopping a continuous-time guarantee into a finite set of steps keep the guarantee, or only approximate it?

## Why flight time cannot join the unknowns

Here are the **[[zero-order-hold|zero-order-hold]]** dynamics this module has been solving all along — the control held constant over each step:

$$
\mathbf{r}_{k+1} = \mathbf{r}_k + \mathbf{v}_k\,\Delta t + \tfrac12(\mathbf{g}+\mathbf{u}_k)\,\Delta t^2, \qquad \mathbf{v}_{k+1} = \mathbf{v}_k + (\mathbf{g}+\mathbf{u}_k)\,\Delta t, \qquad z_{k+1} = z_k - \alpha\sigma_k\,\Delta t,
$$

with $\Delta t = t_f/N$ for a fixed number of steps $N$.

Every one of these equations is linear in the unknowns $(\mathbf{r}_k,\mathbf{v}_k,z_k,\mathbf{u}_k,\sigma_k)$ *only because $\Delta t$ is a fixed number*. It sits in the coefficients, baked in before the solver ever sees the problem.

Now let $t_f$, and with it $\Delta t$, become an unknown. Every term with $\Delta t$ in front turns into a product of two unknowns: $\Delta t\,\mathbf{u}_k$, $\Delta t^2\,\mathbf{u}_k$, $\Delta t\,\sigma_k$, $\Delta t\,\mathbf{v}_k$. A product of two unknowns is **[[bilinear|bilinear]]** — straight-line in each one alone, but not in the pair. That is the same trouble lesson three cured for $\mathbf{T}/m$.

Here, though, no single substitution cures it. Lesson three's trick worked because $\mathbf{T}/m$ appeared in one place, one way. $\Delta t$ multiplies *every* step's contribution, and through the recursion each state depends on every earlier step. Substitutions such as $s=1/\Delta t$ move the products around without removing them. So flight time earns its title of "the one non-convex parameter" honestly: not because nobody found the right trick, but because a number that stretches the whole time grid at once has none.

## The line search

What rescues us is that $t_f$ is a single number. And *for any fixed value of it*, everything else — dynamics, thrust cone, mass bounds, glideslope, pointing — is exactly the convex problem this module already solves.

So treat $t_f$ as a dial turned from *outside* the solver:

1. Pick a candidate $t_f$.
2. Solve the convex problem at that $t_f$ to its global optimum, with the guarantee that brings.
3. Read off the optimal propellant, $J(t_f)$ ("J of t f").
4. Choose a better candidate and repeat.

Each evaluation of $J$ is exact and certified. Only the search *over* $t_f$ gives up the guarantees, and it gives up as little as possible, because searching along a single line is about the smallest non-convex problem there is.

What does $J(t_f)$ look like? The grocery bag tells you. Too short, and no trajectory exists at all: the engine cannot brake hard enough. A bit longer, and the vehicle can land, but only by braking hard. Longer still, and the **[[gravity loss|gravity-loss]]** takes over: every extra second in the air is a second of thrust spent holding the vehicle up against gravity instead of steering it. So $J$ falls, bottoms out, and rises. A curve with one dip and no others is called **[[unimodal|unimodal]]**.

For a unimodal function that is expensive to evaluate — each point here is a whole SOCP solve — the classic tool is **golden-section search**. It keeps a bracket $[a,b]$ that contains the minimum, and each new evaluation shrinks the bracket by [[the same factor|golden-ratio]], $\varphi = (\sqrt5-1)/2\approx0.618$ ("phi"). It uses only function values, never slopes.

::: key How flight time is handled in the convex 3-DoF formulation
Flight time is not a convex variable: the discretization matrices depend on it. Fix $t_f$, solve the SOCP, and run a golden-section search on $t_f$ outside. The cost is unimodal in $t_f$, so a dozen inner solves suffice. Each inner solve is certified; the outer search is not.
:::

::: example Golden-section search on a function whose answer is known
Before trusting a search on an expensive cost, test it on one whose minimum you already know: $f(x) = (x-27)^2+5$, smallest at $x = 27$.

```python
import numpy as np

def golden_section(f, a, b, tol=1e-3):
    gr = (np.sqrt(5) - 1) / 2
    c, d = b - gr * (b - a), a + gr * (b - a)
    fc, fd = f(c), f(d)
    n_evals = 2
    while (b - a) > tol:
        if fc < fd:
            b, d, fd = d, c, fc
            c = b - gr * (b - a)
            fc = f(c)
        else:
            a, c, fc = c, d, fd
            d = a + gr * (b - a)
            fd = f(d)
        n_evals += 1
    return (a + b) / 2, n_evals

f = lambda x: (x - 27.0)**2 + 5.0
xstar, n = golden_section(f, 0.0, 60.0, tol=0.5)
print(xstar, n, f(xstar))
# 26.993401763077287 12 5.000043536730488
```

**Step 1: read the loop.** Two interior points $c$ and $d$ sit at $0.382$ and $0.618$ of the way across the bracket. Whichever has the larger value, the minimum cannot lie beyond it, so that end of the bracket is thrown away. The surviving interior point is reused, so each round costs only one new evaluation.

**Step 2: count.** The bracket starts $60$ wide and must shrink below $0.5$, a factor of $120$. Each evaluation shrinks it by $0.618$, and $0.618^{10} = 0.0081 < 1/120 = 0.0083$, so $10$ shrinks do it. Add the $2$ starting evaluations: $12$.

**Step 3: the answer.** $x^\star = 26.99$ against the true $27$ — off by less than the $0.5$ tolerance that was asked for.

**Sanity check.** Replace `f` with a function that builds and solves the landing SOCP at a given $t_f$ and returns the propellant, and these same lines are the entire outer loop this lesson needs.
:::

::: example Running the search on a real landing
Take a small landing: $\mathbf{r}_0=(400,0,600)\,\mathrm{m}$, $\mathbf{v}_0=(-20,5,-30)\,\mathrm{m/s}$, $N=6$ steps, with this module's usual Mars-lander numbers. First, scan $J(t_f)$ to see its shape:

| $t_f\,(\mathrm{s})$ | $20.2$ | $20.4$ | $21.0$ | $22.0$ | $22.5$ | $24$ | $28$ | $32$ | $40$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| propellant $(\mathrm{kg})$ | none | $115.07$ | $104.97$ | $99.89$ | $99.49$ | $102.92$ | $114.00$ | $125.63$ | $149.08$ |

**Step 1: read the shape.** Below about $20.3\,\mathrm{s}$ there is no trajectory at all — "none" means the solver proved the problem infeasible. Just above that edge the cost is high and falls steeply. It bottoms out near $22.5\,\mathrm{s}$, then climbs steadily.

**Step 2: check the right side against physics.** From $32$ to $40\,\mathrm{s}$ the cost rises $149.08-125.63 = 23.45\,\mathrm{kg}$ in $8\,\mathrm{s}$: about $2.9\,\mathrm{kg}$ per extra second. Simply hovering the $1905\,\mathrm{kg}$ vehicle on Mars burns $1905\times3.7114/(225\times9.80665) = 3.2\,\mathrm{kg/s}$, and a bit less as it gets lighter. So each extra second costs roughly one second of hovering. That is the gravity loss, in numbers.

**Step 3: run the search.** Golden section on the bracket $[16, 32]$ with tolerance $0.1\,\mathrm{s}$, where "no trajectory" counts as a cost of $+\infty$ (infinitely bad). Its first evaluations:

| evaluation | $1$ | $2$ | $3$ | $4$ | $5$ | $6$ |
| --- | --- | --- | --- | --- | --- | --- |
| $t_f\,(\mathrm{s})$ | $22.111$ | $25.889$ | $19.777$ | $23.554$ | $21.220$ | $22.663$ |
| propellant $(\mathrm{kg})$ | $99.72$ | $108.04$ | none | $101.77$ | $102.60$ | $99.70$ |

It ends after $13$ evaluations at $t_f^\star = 22.44\,\mathrm{s}$ and $99.47\,\mathrm{kg}$.

**Step 4: why "none" did no harm.** The infeasible times all lie to the left of the dip. Scoring them as $+\infty$ makes the curve "infinitely high, then the dip, then rising" — still one dip, so golden section throws away the left end and carries on.

**Sanity check.** The count matches the formula from the first example: the bracket shrinks from $16$ to $0.1$, a factor of $160$; $0.618^{11} = 0.005 < 1/160$, so $11$ shrinks plus $2$ starting points is $13$. And $99.47\,\mathrm{kg}$ sits just below the best value in the scan table, $99.49\,\mathrm{kg}$ at $22.5\,\mathrm{s}$, as the true minimum should.
:::

::: warning Every evaluation must be checked before the search trusts it
Golden section believes whatever number it is handed. If an inner solve stops early and returns a propellant from a trajectory that does not actually land — a large terminal residual — the search will treat that wrong number as real and can throw away the part of the bracket holding the true minimum. So wrap the inner solve: check its status and its terminal-state residual every time, and report anything infeasible or unconverged as $+\infty$, never as a number.
:::

::: warning The inner solve's guarantee does not carry over to the outer search
It is tempting to call the whole two-level procedure "convex", because every inner call is. It is not, and saying so repeats the certification mistake lesson one warned about. That $J(t_f)$ is unimodal is a physical argument and an observation across many cases, not a proof with the weight of the interior-point iteration bound. An odd starting condition could in principle give a curve with a second dip. So a flight program treats the outer search as a cheap, bounded, well-tested heuristic riding on a certified inner solve, and sets its evaluation budget from measurements across the whole range of expected starting conditions.
:::

## What discretization actually keeps

Lesson two proved the relaxation tight in **continuous time**, with the minimum principle applied to differential equations. But every SOCP this module has actually solved is a **discrete-time** version: a finite set of nodes, controls held constant between them, a solver working on matrices.

Does the proof simply carry over? Not automatically. Chopping the problem into steps and then relaxing the thrust bound is not obviously the same as relaxing first and chopping afterwards. Nothing proved so far rules out a gap opening between $\sigma_k$ and $\|\mathbf{u}_k\|$ purely because the steps are finite. Discrete-time versions of lossless convexification are a research topic with their own conditions, treated in the tutorial on this module's resource list, and not something to wave away.

What we can do — and what a flight computer, which never runs at $N=\infty$, needs — is check. Take lesson two's lander ($t_f=60\,\mathrm{s}$) and solve it with coarser and finer grids:

| steps $N$ | $5$ | $10$ | $15$ | $20$ | $30$ | $60$ |
| --- | --- | --- | --- | --- | --- | --- |
| propellant $(\mathrm{kg})$ | $240.513$ | $240.447$ | $240.390$ | $240.387$ | $240.382$ | $240.379$ |
| largest $\sigma_k-\|\mathbf{u}_k\|$ | $7\times10^{-12}$ | $7\times10^{-12}$ | $2\times10^{-11}$ | $8\times10^{-12}$ | $8\times10^{-12}$ | $2\times10^{-12}$ |

Two separate things are happening, and it pays to keep them apart.

- **The propellant changes with $N$.** Going from $5$ steps to $60$ lowers it by $0.134\,\mathrm{kg}$, settling toward about $240.38\,\mathrm{kg}$. That is ordinary **[[discretization error|discretization-error]]**: a coarse grid forces the thrust to stay constant over long stretches, so it cannot follow the ideal thrust history exactly and pays a little extra.
- **The relaxation gap does not.** At every $N$, even $5$ steps of $12\,\mathrm{s}$, the largest gap is around $10^{-11}$ — the solver's own precision. The same holds for the other solves in this module: a $100\,\mathrm{s}$ flight on $30$ steps, and the glideslope-and-pointing landing of the last lesson.

So coarsening the grid changed *how good* the answer is, not *whether it is real*. Every one of these discrete solutions is a thrust history the engine can actually fly.

::: key What survives discretization
The continuous-time tightness proof is not automatically a discrete-time theorem. Checked on this module's problems, from $N=5$ to $N=60$, the relaxation gap $\sigma_k-\|\mathbf{u}_k\|$ stays at solver precision, about $10^{-11}$, while the propellant shows ordinary discretization error. This is an empirical statement at these grid sizes, not a proof for every grid — so a flight implementation checks the gap on every solve.
:::

Where does that leave the question of grid size? A single step spanning a whole burn would be too coarse for the held-constant thrust to resemble real physics at all, tight relaxation or not. The practical question is the one the real-time lesson later in this module answers: at the node counts a guidance cycle can afford, is the discretization error small enough? The gap check is the separate safety net that says the answer is flyable.

## Check yourself

::: check
Why does a single rescaling such as $s=1/\Delta t$ fail to remove the bilinearity a free $t_f$ causes, when $\mathbf{u}=\mathbf{T}/m$ removed the mass bilinearity so neatly?
:::

::: answer
The mass fix worked because $\mathbf{T}/m$ appears in one place with one structure, and one substitution absorbed it everywhere. A free $\Delta t$ multiplies *every* coefficient at *every* step: $\Delta t\,\mathbf{v}_k$ and $\Delta t^2\,\mathbf{u}_k$ in the position update, $\Delta t\,\mathbf{u}_k$ in the velocity update, $\Delta t\,\sigma_k$ in the mass update. And because each state depends on all the earlier ones, its effect compounds through the whole recursion. Any single new variable would have to turn all of $\Delta t\,\mathbf{u}_k$, $\Delta t^2\,\mathbf{u}_k$ and $\Delta t\,\sigma_k$ into linear terms at once, for every $k$. There is no "divide through by $m$" that clears them all, which is why this lesson uses a search instead of an algebraic fix.
:::

::: check
A colleague proposes replacing golden section with a grid search over ten evenly spaced values of $t_f$, because it is simpler to code. What does this module's certification standard say about that trade?
:::

::: answer
It is a legitimate engineering choice, not a certification failure — the outer search never inherited the inner solve's guarantee, whichever method is used — provided its cost and behavior are measured the same way. The real trade is efficiency. Golden section shrinks the bracket by $0.618$ per evaluation, so the evaluations needed grow only with the logarithm of (bracket width ÷ tolerance): $13$ evaluations took a $16\,\mathrm{s}$ bracket down to $0.1\,\mathrm{s}$ in the example. A ten-point grid on the same bracket gives a spacing of $16/9 \approx 1.8\,\mathrm{s}$, and reaching $0.1\,\mathrm{s}$ that way would take about $160$ points. When each evaluation is a full SOCP solve costing tens of milliseconds, that difference is exactly what the real-time lesson turns into a hard budget.
:::

::: check
Suppose a future engine made the mass loss exactly $\dot m = -\beta$, a fixed flow rate that does not depend on thrust. Would flight time still resist joining the convex unknowns?
:::

::: answer
Yes, for a reason that has nothing to do with mass. The main bilinearity comes from $\Delta t$ multiplying the control in the *motion* equations — $\Delta t\,\mathbf{u}_k$ and $\Delta t^2\,\mathbf{u}_k$ in the velocity and position updates — and that is there however the mass behaves. A fixed flow rate would change the mass equation, but the motion recursion's dependence on $\Delta t$ as a multiplier of the control belongs to the discretization itself, not to this propulsion model.
:::

::: check
In the discretization table, the propellant changes by $0.134\,\mathrm{kg}$ between $N=5$ and $N=60$, but the relaxation gap stays near $10^{-11}$. A teammate reads the $0.134\,\mathrm{kg}$ as "the relaxation getting worse on coarse grids". What is wrong with that reading, and what number would actually show the relaxation failing?
:::

::: answer
The two numbers measure different things. The propellant change is discretization error: with only $5$ steps, the thrust must stay constant for $12\,\mathrm{s}$ at a time, so the best *flyable* thrust history costs a little more than the ideal smooth one. Every one of those solutions is still real, because $\sigma_k = \|\mathbf{u}_k\|$ at every node — the thrust the solver planned is thrust the engine can deliver. The relaxation failing would show up in the other row: a gap $\sigma_k - \|\mathbf{u}_k\|$ far above solver precision at some node, meaning the solver "paid for" more thrust than it pointed anywhere, possibly below the engine's minimum. Before blaming a large gap on the grid, re-run the solve to a tighter tolerance: a gap that shrinks with tolerance was under-convergence, not discretization.
:::

::: check
The golden-section run treated the infeasible time $19.777\,\mathrm{s}$ as a cost of $+\infty$. Would the same trick still work if the infeasible times were in the *middle* of the bracket, with feasible times on both sides?
:::

::: answer
Not safely. Golden section assumes one dip. Scoring infeasible points as $+\infty$ works when they sit together at one end, as here: the curve is "infinitely high, then the dip, then rising", which is still one dip. If an infeasible stretch sat in the middle, with a feasible region on each side, the curve would have two separate dips, and golden section could discard the one holding the better answer. A flight program would first need to establish where the feasible times lie — for a landing, the infeasible times are the too-short ones, which is why they gather at the left end.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Why $t_f$ resists convexity | $\Delta t=t_f/N$ multiplies $\mathbf{u}_k$, $\sigma_k$, $\mathbf{v}_k$ throughout the recursive dynamics; a free $t_f$ makes all of them bilinear, with no single substitution |
| The fix | Fix $t_f$, solve the certified SOCP, read $J(t_f)$; search over $t_f$ from outside using values only |
| Shape of $J(t_f)$ | Infeasible when too short; falls steeply, bottoms out, then rises about one hover-second of propellant per extra second (gravity loss) |
| Golden section | Shrinks the bracket by $\varphi\approx0.618$ per evaluation; test function: $12$ evaluations, $x^\star=26.99$ against $27$ |
| Real search | $[16,32]\,\mathrm{s}$, tolerance $0.1\,\mathrm{s}$: $13$ evaluations, $t_f^\star=22.44\,\mathrm{s}$, $99.47\,\mathrm{kg}$ |
| Evaluation hygiene | Infeasible or unconverged inner solves are scored $+\infty$, never as a number |
| Outer search | A tested heuristic on top of a certified inner solve, not convex itself |
| Discrete vs continuous | The continuous proof is not automatically a discrete theorem; check the gap on every solve |
| What was checked | $N=5$ to $60$: gap about $10^{-11}$; propellant $240.513 \to 240.379\,\mathrm{kg}$ (discretization error) |

The 3-DoF convex formulation is now complete end to end: dynamics, thrust bound, mass bounds, glideslope, speed, pointing and flight time, each either exactly convex or handled by a search around a certified inner solve. The next lesson turns to what this formulation cannot reach — a rotating, attitude-controlled 6-DoF vehicle — and introduces successive convexification, built for what lossless convexification cannot do.

::: context zero-order-hold Holding the control steady
A **zero-order hold** keeps a signal constant from one sample to the next, like a staircase. Real flight computers command the engine this way: a new thrust every cycle, held until the next. With the thrust held, the motion over a step can be written exactly — the $\tfrac12\Delta t^2$ term is the familiar distance formula for constant acceleration — which is why these update equations are exact for a held control, not approximations. The name comes from signal processing: "zero order" because the hold uses a polynomial of degree zero, a constant.
:::

::: context bilinear Straight in each, curved together
A function is **bilinear** when it is a straight line in each variable separately but not in both together. $f(a,b) = ab$ is the classic case. Hold $b=2$ and $f = 2a$, a line. Hold $a=3$ and $f=3b$, a line. But along the path from $(0,0)$ to $(2,2)$ the value goes $0$, $1$, $4$ — a curve. Convex solvers need constraints that are straight (or bowl-shaped) in all the unknowns at once, so a bilinear equality breaks convexity.
:::

::: context gravity-loss Paying to fight gravity
**Gravity loss** is the part of a burn spent holding a vehicle up against gravity instead of changing its speed. A rocket hovering in place burns propellant and gains nothing. Lingering in the air is therefore expensive, which is why the cost curve rises for long flight times, and why real landing burns, such as a Falcon 9 booster's, are kept short and hard.
:::

::: context unimodal One dip only
A **unimodal** function has exactly one low point: it goes down, then up, with no second dip. Here is the landing's actual cost curve from the example, drawn to scale. Left of about $20.3\,\mathrm{s}$ there is no trajectory at all; the minimum sits near $22.4\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="15" width="4.2" height="145" fill="#f2b880"/>
  <line x1="50" y1="160" x2="335" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="55.6,108.9 58.4,118.1 61.2,126.8 64.0,134.6 66.8,140.2 69.6,144.4 72.4,145.6 75.2,146.6 78.0,147.6 85.0,148.6 92.0,146.1 106.0,139.9 134.0,126.0 162.0,111.6 218.0,82.0 274.0,52.2 330.0,22.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="84.2" cy="148.6" r="4" fill="#b4232c"/>
  <text x="90" y="170" font-size="11" fill="#b4232c">22.4 s, 99.5 kg</text>
  <text x="50" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="190" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="330" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">40 s</text>
  <text x="44" y="151" font-size="11" text-anchor="end" fill="#1f2a44">100</text>
  <text x="44" y="87" font-size="11" text-anchor="end" fill="#1f2a44">125</text>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">150</text>
  <text x="60" y="30" font-size="11" fill="#1f2a44">propellant (kg)</text>
  <text x="200" y="120" font-size="11" fill="#1d6fd1">J(tf)</text>
</svg>
```

The orange strip marks the times with no possible landing.
:::

::: context golden-ratio Why 0.618
Golden-section search places its two test points so that, whichever end is thrown away, the surviving test point sits exactly where a test point belongs in the new, smaller bracket. That only works for one shrink factor, $\varphi = (\sqrt5-1)/2 = 0.618\ldots$, which satisfies $\varphi^2 = 1-\varphi$. It is the reciprocal of the famous golden ratio $1.618$, the number Greek geometers studied in dividing a line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="3"/>
  <line x1="30" y1="32" x2="30" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <line x1="330" y1="32" x2="330" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="144.6" cy="40" r="5" fill="#1d6fd1"/>
  <circle cx="215.4" cy="40" r="5" fill="#b4232c"/>
  <text x="30" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="330" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="144.6" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">c</text>
  <text x="215.4" y="24" font-size="11" text-anchor="middle" fill="#b4232c">d</text>
  <line x1="30" y1="85" x2="215.4" y2="85" stroke="#1f2a44" stroke-width="3"/>
  <line x1="30" y1="77" x2="30" y2="93" stroke="#1f2a44" stroke-width="2"/>
  <line x1="215.4" y1="77" x2="215.4" y2="93" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="100.8" cy="85" r="5" fill="#8fb8f0"/>
  <circle cx="144.6" cy="85" r="5" fill="#1d6fd1"/>
  <text x="223" y="89" font-size="11" fill="#1f2a44">next bracket, if f(c) &lt; f(d)</text>
  <text x="144.6" y="108" font-size="11" text-anchor="middle" fill="#1d6fd1">old c reused</text>
</svg>
```

Drawn to scale: in the top bracket $c$ and $d$ sit at $0.382$ and $0.618$ of the width; in the next bracket the old $c$ lands exactly at its $0.618$ point.
:::

::: context discretization-error Coarse grids cost a little
**Discretization error** is the difference between the answer on a finite grid and the answer the continuous problem would give. With thrust held constant for $12\,\mathrm{s}$ at a time, the vehicle cannot follow the ideal thrust history exactly, so the best it can do costs slightly more. Refine the grid and the error shrinks, as in the table. It is a different kind of error from the relaxation gap: discretization error makes the answer slightly worse; a relaxation gap would make it not flyable at all.
:::
