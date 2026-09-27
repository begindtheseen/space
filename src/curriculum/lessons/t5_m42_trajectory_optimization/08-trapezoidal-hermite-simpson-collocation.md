---
id: l08-trapezoidal-hermite-simpson-collocation
title: "Direct collocation: trapezoidal and Hermite-Simpson defects"
minutes: 23
covers:
  - "Direct collocation: trapezoidal and Hermite-Simpson defect constraints"
---

Suppose your car's odometer is broken, and you want to know how far you drove in one minute. You glance at the speedometer at the start of the minute: $20\,\mathrm{m/s}$. You glance again at the end: $30\,\mathrm{m/s}$. A good guess is the average speed, $25\,\mathrm{m/s}$, times $60\,\mathrm{s}$, which is $1500\,\mathrm{m}$. If you also glanced once in the middle of the minute, you could make a better guess, because you would know how the speed bent along the way.

That is the whole trick of this lesson, turned around. Instead of using the speedometer to *compute* the distance, we write down a rule that the distance *must obey*: "the change in position across this minute equals the average of the speeds at its ends, times the minute". The computer then searches for a trajectory where that rule holds on every step. A rule like this, which estimates an integral from a few sampled values, is called a **[[quadrature rule|quadrature]]**. Promoted to an equality constraint, it becomes a **defect constraint** — and **direct collocation** is the method built from them.

Two lessons ago, the defect was left as a placeholder: some formula, built from a quadrature rule, that is zero when a step agrees with the dynamics. This lesson builds the two defects that matter most in practice, the **trapezoidal** and the **Hermite-Simpson** defects. It derives each from the rule underneath it, rather than handing you a formula to memorize. It measures how accurate each one is. And then it solves the orbit transfer that the shooting lessons struggled with, starting from nothing but straight lines. Tools that plan real flights — NASA's open-source Dymos, and the collocation modes of commercial trajectory software — are built on exactly these two formulas.

## A quadrature rule becomes a constraint

Start with a fact that is always true. Across one step of the mesh, from time $t_k$ to $t_{k+1}$, the change in the state is the dynamics added up over the step:

$$
\mathbf{x}_{k+1}-\mathbf{x}_k = \int_{t_k}^{t_{k+1}}\mathbf{f}\big(\mathbf{x}(t),\mathbf{u}(t),t\big)\,dt.
$$

That is the fundamental theorem of calculus from the first lesson: add up a rate and you get the total change. The trouble is the right-hand side. It needs $\mathbf{x}(t)$ at *every* instant of the step, and the computer only holds the values at the mesh points.

So replace the exact integral with a quadrature rule that uses only a few sampled values. Move everything to one side, and call what is left the **defect** $\mathbf{d}_k$:

$$
\mathbf{d}_k = \mathbf{x}_{k+1} - \mathbf{x}_k - (\text{quadrature of } \mathbf{f} \text{ over the step}).
$$

The optimizer treats every $\mathbf{x}_k$ and $\mathbf{u}_k$ as an unknown and is told: make every $\mathbf{d}_k$ zero. Here is why that solves the differential equation. A trajectory with every defect at zero changes, on every step, by exactly the amount the dynamics say it should, up to the error of the quadrature rule. Shrink the steps and that error shrinks too, so the discrete trajectory closes in on the true solution. The only question left is which quadrature rule to use.

## Trapezoidal collocation

The simplest rule that uses both ends of the step is the **[[trapezoidal rule|trapezoid-picture]]**: average the values at the two ends and multiply by the width of the step, $h$. In symbols, for any function $g$,

$$
\int_{t_k}^{t_{k+1}}g\,dt \approx \tfrac{h}{2}\big(g(t_k)+g(t_{k+1})\big).
$$

That is the speedometer guess from the opening. Apply it with $g = \mathbf{f}$ and rearrange into a residual that should vanish:

$$
\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k - \frac{h}{2}\big(\mathbf{f}_k+\mathbf{f}_{k+1}\big), \qquad \mathbf{f}_k \equiv \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k,t_k).
$$

Read $\mathbf{f}_k$ as "f sub k": the dynamics evaluated at node $k$, using that node's state, control and time. The triple bar $\equiv$ here means "is defined as".

What does the scheme assume about the control between nodes? It only ever looks at $\mathbf{u}_k$ and $\mathbf{u}_{k+1}$, so the natural picture is a straight line between them: the control is **piecewise linear** — straight pieces joined at the nodes. That is the coarsest control model this module uses. It is also why trapezoidal collocation is the cheapest scheme to set up, and the least accurate per node.

::: key Trapezoidal collocation defect
$\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{2}(\mathbf{f}_k+\mathbf{f}_{k+1})$. Second-order accurate globally; control is piecewise linear. The rule is exact when $\mathbf{f}$ is constant or linear across the step.
:::

::: example One trapezoidal defect by hand
Take $\dot x = -x$, whose exact solution from $x(0) = 1$ is $x(t) = e^{-t}$. Use one step of $h = 0.5$, from $t_0 = 0$ to $t_1 = 0.5$, and plug the *exact* solution into the defect to see how close it comes to zero.

**Step 1: the states.** $x_0 = e^{0} = 1$ and $x_1 = e^{-0.5} = 0.60653$.

**Step 2: the dynamics.** Here $f = -x$, so $f_0 = -1$ and $f_1 = -0.60653$.

**Step 3: the quadrature.** $\tfrac{h}{2}(f_0 + f_1) = 0.25 \times (-1.60653) = -0.40163$.

**Step 4: the defect.** $d_0 = x_1 - x_0 - (-0.40163) = 0.60653 - 1 + 0.40163 = 0.00816$.

**Sanity check.** It is small but not zero. The true change is $e^{-0.5} - 1 = -0.39347$, but the trapezoid predicts $-0.40163$. The rate $f = -e^{-t}$ bows upward above the straight line joining its two ends, so the area under that straight line comes out a little too negative, and the defect is positive. The note below shows that for small steps the defect is close to $h^3/12$ times $x_0$; here that is $0.125/12 = 0.0104$, in the same neighborhood as $0.00816$ at this fairly large step.
:::

::: note Why it has to be true: the trapezoid's error
Expand the exact solution in a **Taylor series** about $t_k$ — a way of writing a smooth curve near one point as a sum of its value, slope, curvature and so on. For $x = e^{-t}$ starting at $x_k = 1$, $e^{-h} = 1 - h + \tfrac{h^2}{2} - \tfrac{h^3}{6} + \dots$ Then

$$
\tfrac{h}{2}(f_k + f_{k+1}) = -\tfrac{h}{2}\big(1 + e^{-h}\big) = -h + \tfrac{h^2}{2} - \tfrac{h^3}{4} + \dots
$$

Subtract: $d_k = (e^{-h} - 1) + h - \tfrac{h^2}{2} + \tfrac{h^3}{4} - \dots = -\tfrac{h^3}{6} + \tfrac{h^3}{4} + \dots = \tfrac{h^3}{12} + \dots$ The terms in $h$ and $h^2$ cancel exactly, and the first survivor is proportional to $h^3$. For a general smooth solution the same bookkeeping gives $d_k = -\tfrac{h^3}{12}\dddot{x} + \dots$, where $\dddot{x}$ is the third derivative. That $h^3$ is the **local order** of the trapezoidal defect.
:::

## Hermite-Simpson collocation

To do better, sample the middle of the step too, as the second glance at the speedometer did. But there is a catch: the midpoint state $\mathbf{x}_{\text{mid}}$ is not one of the unknowns. We need a way to estimate it from what we have.

Here is the key observation. At each end of the step we know *two* things: the state, and its rate of change, because the dynamics hand us $\dot{\mathbf{x}} = \mathbf{f}$ for free. Four facts — two values and two slopes — are exactly enough to pin down a **cubic** (a polynomial of degree three, like $a + bt + ct^2 + dt^3$, which has four coefficients). The cubic that matches given values and slopes at both ends is called a **[[Hermite interpolant|hermite]]**.

Measure time inside the step with $\tau = (t - t_k)/h$ (read "tau"), which runs from $0$ at the start of the step to $1$ at the end. The Hermite cubic is built from four fixed **basis functions**:

$$
H_{00}=2\tau^3-3\tau^2+1,\quad H_{10}=\tau^3-2\tau^2+\tau,\quad H_{01}=-2\tau^3+3\tau^2,\quad H_{11}=\tau^3-\tau^2.
$$

Each one does one job. $H_{00}$ is $1$ at the start, $0$ at the end, and flat at both ends: it carries the starting value. $H_{01}$ carries the ending value. $H_{10}$ and $H_{11}$ are zero at both ends but have slope $1$ at one end: they carry the two slopes. Combine them:

$$
\mathbf{p}(\tau) = \mathbf{x}_kH_{00}+h\mathbf{f}_kH_{10}+\mathbf{x}_{k+1}H_{01}+h\mathbf{f}_{k+1}H_{11}.
$$

The factor $h$ on the slope terms converts "per second" into "per step", since $\tau$ is measured in steps.

**Evaluate at the midpoint.** Put $\tau = \tfrac12$ into each basis function:

- $H_{00}(\tfrac12) = \tfrac{2}{8} - \tfrac{3}{4} + 1 = \tfrac12$, and $H_{01}(\tfrac12) = -\tfrac{2}{8} + \tfrac34 = \tfrac12$.
- $H_{10}(\tfrac12) = \tfrac18 - \tfrac12 + \tfrac12 = \tfrac18$, and $H_{11}(\tfrac12) = \tfrac18 - \tfrac14 = -\tfrac18$.

Substitute those four numbers:

$$
\mathbf{x}_{\text{mid}} = \mathbf{p}(\tfrac12) = \frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2} + \frac{h}{8}\big(\mathbf{f}_k-\mathbf{f}_{k+1}\big).
$$

In words: start from the plain average of the two end states, then correct it for the bend. If the slope is falling across the step ($\mathbf{f}_k > \mathbf{f}_{k+1}$), the curve bulges above the straight line, and the correction is positive.

**The midpoint control and dynamics.** Take the control at the midpoint by the simplest consistent choice, the average $\mathbf{u}_{\text{mid}} = \tfrac12(\mathbf{u}_k+\mathbf{u}_{k+1})$. Then evaluate the dynamics there: $\mathbf{f}_{\text{mid}} = \mathbf{f}(\mathbf{x}_{\text{mid}},\mathbf{u}_{\text{mid}},t_{\text{mid}})$, with $t_{\text{mid}} = t_k + h/2$.

**The quadrature.** Now use **[[Simpson's rule|simpson]]**, which weighs the middle sample four times as heavily as each end:

$$
\int_{t_k}^{t_{k+1}}g\,dt \approx \tfrac{h}{6}\big(g(t_k)+4g(t_{\text{mid}})+g(t_{k+1})\big).
$$

Simpson's rule is exact for any cubic $g$. Apply it to the same integral as before, and the defect is

$$
\mathbf{d}_k = \mathbf{x}_{k+1}-\mathbf{x}_k - \frac{h}{6}\big(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1}\big).
$$

This is the **compressed** form: $\mathbf{x}_{\text{mid}}$ is computed from the formula above instead of being an extra unknown. The price over trapezoidal is one more evaluation of the dynamics per step, $\mathbf{f}_{\text{mid}}$. The next section measures what that buys.

::: key Hermite-Simpson defect (compressed form)
$\mathbf{x}_{\text{mid}}=\frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2}+\frac{h}{8}(\mathbf{f}_k-\mathbf{f}_{k+1})$, $\mathbf{u}_{\text{mid}} = \frac{\mathbf{u}_k+\mathbf{u}_{k+1}}{2}$, $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{6}(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1})$. Fourth-order accurate globally. Both schemes apply a quadrature of $\int\mathbf{f}\,dt$ to a polynomial model of the step: trapezoidal treats $\mathbf{f}$ as a straight line (exact when $\mathbf{x}(t)$ is a parabola or simpler), Hermite-Simpson treats $\mathbf{x}(t)$ as a cubic.
:::

::: warning Signs and factors that break everything
The two most common bugs are both one character long. The midpoint correction is $\tfrac{h}{8}(\mathbf{f}_k - \mathbf{f}_{k+1})$, with a *minus*; write a plus and the midpoint is pushed the wrong way. The Simpson weights are $1, 4, 1$ over $6$, and the trapezoid's are $1, 1$ over $2$; mixing them up gives a defect that is off by a factor. Test your code on a case with a known answer. A ramp $x = 3t$ has $f = 3$ everywhere, and both defects must come out zero to machine precision. If they do not, fix that before anything else.
:::

## Measuring the order, not assuming it

How much better is Hermite-Simpson? Do not take it on faith; measure it. Sample the exact solution $x(t) = e^{-t}$ of $\dot x = -x$ on a uniform mesh over $[0, 2]$, and evaluate every defect. A converged solver drives the defects to zero. So how close the *exact* trajectory already comes to zero is a direct probe of the scheme's accuracy, with no solver involved at all.

::: example The two schemes, head to head
The table lists the largest defect on the mesh, $\max\lvert d_k\rvert$, as the step size $h$ is halved again and again.

| $h$ | trapezoidal $\max\lvert d_k\rvert$ | Hermite-Simpson $\max\lvert d_k\rvert$ |
| --- | --- | --- |
| $0.400$ | $4.384\times10^{-3}$ | $1.168\times10^{-5}$ |
| $0.200$ | $6.038\times10^{-4}$ | $4.024\times10^{-7}$ |
| $0.100$ | $7.929\times10^{-5}$ | $1.321\times10^{-8}$ |
| $0.050$ | $1.016\times10^{-5}$ | $4.233\times10^{-10}$ |
| $0.025$ | $1.286\times10^{-6}$ | $1.340\times10^{-11}$ |

**Step 1: look at the ratios.** Divide each row by the next. For the finest pair, trapezoidal gives $1.016\times10^{-5} / 1.286\times10^{-6} = 7.90$, and Hermite-Simpson gives $4.233\times10^{-10} / 1.340\times10^{-11} = 31.6$. The ratios climb toward $2^3 = 8$ and $2^5 = 32$ as $h$ shrinks.

**Step 2: fit the slope.** Plot $\log\max\lvert d_k\rvert$ against $\log h$ and fit a straight line through all five points. The **[[slope on a log-log plot|log-log]]** is the order: $2.94$ for trapezoidal and $4.94$ for Hermite-Simpson.

**Step 3: compare with theory.** The theory says $3$ and $5$. The small gap comes from the largest steps, where the higher-order terms the theory drops are not yet negligible — not from a mistake in either scheme.

**Sanity check.** At the coarsest step, Hermite-Simpson's defect is already about $375$ times smaller than trapezoidal's, for one extra evaluation of $f$ per step. At the finest, it is about $96\,000$ times smaller.
:::

That is the **local** order: how the error on *one* step shrinks with $h$. What you care about in the end is the **global** error, how far the whole converged trajectory sits from the truth. The global order is one less than the local order. So trapezoidal collocation is second-order globally, and Hermite-Simpson is fourth-order. Halving $h$ cuts the trajectory error by about $2^2 = 4$ with trapezoidal, and by about $2^4 = 16$ with Hermite-Simpson.

::: note Why it has to be true: one order is lost along the way
Cover a flight of fixed length $T$ with steps of size $h$. There are $T/h$ steps. Each step makes a local error of about $C h^p$ for some constant $C$. In the worst case those errors add up, so the total is about $(T/h) \times C h^p = C\,T\,h^{p-1}$. Dividing by $h$ once is where the order drops by one: local $h^3$ becomes global $h^2$ for trapezoidal, and local $h^5$ becomes global $h^4$ for Hermite-Simpson.
:::

This is why doubling the node count on a Hermite-Simpson mesh is usually cheaper than switching to a much finer trapezoidal mesh for the same accuracy. The NLP grows only in proportion to the number of nodes, while the error falls as the fourth power of the step.

## The orbit transfer, this time without a costate

::: example The minimum-time transfer, solved from straight lines
The shooting lesson's transfer: $r_0 = 7000\,\mathrm{km}$ to $r_1 = 9000\,\mathrm{km}$, $T_{\max} = 100\,\mathrm{N}$, $I_{sp} = 1800\,\mathrm{s}$, minimum time. Indirect shooting needed a converged costate before it could even take a step, and only $5$ of $25$ random costate guesses led anywhere.

**Step 1: transcribe.** Three states $(r, v_r, v_t)$ at each node, one control (the steering angle $\beta$) at each node, and the free final time $t_f$ as one more unknown. Hermite-Simpson defects on $N$ equal segments, plus the known start and end states as boundary constraints. With $N = 20$ that is $63 + 21 + 1 = 85$ unknowns and $60 + 6 = 66$ equality constraints.

**Step 2: guess naively.** No costate, no **[[primer vector|primer]]**, no thought about the necessary conditions. Draw $r$ and $v_t$ as straight lines between their known start and end values, set $v_r = 0$ everywhere, and set $\beta = 0$ everywhere — thrust pointing straight along the direction of travel, the guess a person writes without thinking. Guess $t_f = 12$ nondimensional time units.

**Step 3: solve.** Hand it to a general-purpose constrained optimizer, **[[sequential quadratic programming|sqp]]**, the same family the optimization module covers. It converges from that one naive guess, with no retries. Starting instead from $t_f = 6$ or $t_f = 20$ lands on the same answer.

**Step 4: read the answers.**

- $N = 20$: $t_f = 12.372081$, which is $11\,476.81\,\mathrm{s}$.
- $N = 40$: $t_f = 12.370376$, which is $11\,475.23\,\mathrm{s}$.
- Indirect shooting's exact answer: $t_f = 12.370316$, which is $11\,475.17\,\mathrm{s}$.

(One nondimensional time unit here is $927.64\,\mathrm{s}$.)

**Sanity check.** The $N = 20$ error is $1.64\,\mathrm{s}$ out of more than three hours. Doubling to $N = 40$ shrinks it to $0.056\,\mathrm{s}$, about $29$ times smaller. That is at least the $16$ the global order promises; the cost is a smooth quantity and often converges a little faster than the trajectory itself.
:::

Notice what never came up: the costate. The optimizer does have **Lagrange multipliers** on the defect constraints — every constrained NLP has them. A later lesson shows how those multipliers rebuild the costate history that the indirect method had to guess its way toward. That turns the costate into a check you can run *after* solving, instead of a prerequisite you need *before* you can start.

Why did such a crude guess work? The guess only had to be roughly plausible, not close to optimal. In collocation every node's state is its own unknown, so an error at one node is corrected right there by the solver. It is not carried forward and grown through the whole flight, the way an early error is in shooting.

::: warning A converged solve can still be lying about the control between nodes
The defects only see $\mathbf{u}_k$ and $\mathbf{u}_{k+1}$ (trapezoidal), or those two plus their average (Hermite-Simpson). Nothing constrains what the true optimal control does strictly between mesh points. If the true control has structure finer than the mesh can show — a bang-bang switch inside a segment, a singular arc thinner than $h$ — the defects can be satisfied to tight tolerance by a smoothed-over control that never visits the real one. The Mars descent is a real case: its engine switches on at $1.8546\,\mathrm{s}$. On $40$ equal segments of $33.7597/40 = 0.844\,\mathrm{s}$, the nodes sit at $1.688\,\mathrm{s}$ and $2.532\,\mathrm{s}$, and the switch falls between them. The solver will blur it into a ramp. A smooth-looking control where physics says there should be a sharp corner is a question about the mesh, taken up in the **[[mesh refinement lesson|mesh-bridge]]**, not a reason to trust the smooth answer.
:::

## Check yourself

::: check
Using the Hermite basis functions, show that $H_{10}(\tfrac12) = -H_{11}(\tfrac12)$. This is the reason the midpoint formula has $\mathbf{f}_k - \mathbf{f}_{k+1}$ rather than $\mathbf{f}_k + \mathbf{f}_{k+1}$.
:::

::: answer
$H_{10}(\tau) = \tau^3 - 2\tau^2 + \tau$. At $\tau = \tfrac12$: $\tfrac18 - \tfrac12 + \tfrac12 = \tfrac18$. $H_{11}(\tau) = \tau^3 - \tau^2$. At $\tau = \tfrac12$: $\tfrac18 - \tfrac14 = -\tfrac18$. So $H_{10}(\tfrac12) = \tfrac18 = -H_{11}(\tfrac12)$. The slope terms at the midpoint are then $h\mathbf{f}_k \cdot \tfrac18 + h\mathbf{f}_{k+1} \cdot (-\tfrac18) = \tfrac{h}{8}(\mathbf{f}_k - \mathbf{f}_{k+1})$. The minus sign is not a separate assumption: it comes from where the midpoint sits relative to the two slope-carrying basis functions. A slope at the start pushes the middle of the curve up; the same slope at the end pulls it down.
:::

::: check
Why does measuring the defect of the *exact* solution, as the head-to-head example did, tell you the scheme's convergence order without ever solving an NLP?
:::

::: answer
The defect measures how well a trajectory satisfies the discretized dynamics. Evaluating it on the exact solution isolates the quadrature rule's own error from anything a solver might add while searching. If the exact solution already misses the discrete equations by an amount that shrinks like $h^p$, then a converged NLP — which makes the defects zero whatever the scheme — must be finding a trajectory that differs from the true one by an amount set by that same $h^p$ error, accumulated across the mesh. Solving the NLP tells you the scheme found *a* feasible, optimal-looking trajectory. Measuring the exact solution's defect tells you how good that trajectory can possibly be for a given $h$, independent of how the solver behaves.
:::

::: check
The orbit-transfer collocation converged from $\beta \equiv 0$ — thrust pointed along the direction of travel the whole way, which is not the true steering law. Why did such a crude guess work, when the shooting lesson's plausible-looking costate guesses mostly failed?
:::

::: answer
The guess only had to be roughly plausible, not close to optimal. Collocation does not carry a small error through the whole horizon the way single shooting does: every node's state is its own unknown, corrected locally by the solver, rather than inherited by growing an early mistake forward. A poor control guess produces large *initial* defects, and a Newton-type NLP solver is built to shrink those step by step from a badly infeasible start. A poor costate guess in indirect shooting produces a trajectory that may not look like anything physical by the time it reaches $t_f$, because nothing corrects it along the way. This is exactly the point of solving the same problem twice: tolerance for a bad first guess comes from having many local unknowns instead of a few global ones. It is not luck of this particular transfer.
:::

::: check
Suppose that on a certain problem the two schemes happen to give the same trajectory error at $N = 20$ segments. Hermite-Simpson at $N = 40$ then cuts that error by about $16$. How many trapezoidal segments would you need to reach the same accuracy?
:::

::: answer
Trapezoidal's global error falls as $h^2$, which is as $1/N^2$. To cut the error by $16$, you need $(N/20)^2 = 16$, so $N/20 = \sqrt{16} = 4$ and $N = 80$. Hermite-Simpson got there with $40$ segments; trapezoidal needs $80$, twice as many. Each Hermite-Simpson segment costs one extra dynamics evaluation, so the costs are similar here. But the gap widens with every further halving: another factor of $16$ costs Hermite-Simpson one doubling ($N = 80$) and trapezoidal two ($N = 320$). The NLP grows with the node count, which is why a Hermite-Simpson mesh is usually the cheaper way to hit a tight accuracy target.
:::

::: check
The trapezoidal rule treats $\mathbf{f}$ as a straight line across the step. Give one kind of motion for which the trapezoidal defect of the exact solution is exactly zero, and one kind for which it is not.
:::

::: answer
Exactly zero: any motion whose rate $\mathbf{f}$ is a straight-line function of time across the step. For example, a cart speeding up at a constant $2\,\mathrm{m/s^2}$: its velocity $v = 2t$ is linear, so the trapezoid computes the distance traveled exactly, and its position $x = t^2$ is a parabola. The same goes for a constant rate (a ramp). Not zero: $\dot x = -x$, whose rate $-e^{-t}$ is curved, as the worked example showed ($d_0 = 0.00816$ at $h = 0.5$). Any rate with curvature leaves a defect of order $h^3$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Defect | $\mathbf{d}_k = \mathbf{x}_{k+1} - \mathbf{x}_k - (\text{quadrature of } \mathbf{f})$; all zero means the discrete trajectory obeys the dynamics to the rule's accuracy |
| Trapezoidal defect | $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{2}(\mathbf{f}_k+\mathbf{f}_{k+1})$; piecewise-linear control; local $O(h^3)$, global $O(h^2)$ |
| Hermite-Simpson midpoint | $\mathbf{x}_{\text{mid}}=\frac{\mathbf{x}_k+\mathbf{x}_{k+1}}{2}+\frac{h}{8}(\mathbf{f}_k-\mathbf{f}_{k+1})$, from the cubic Hermite interpolant at $\tau=\tfrac12$; $\mathbf{u}_{\text{mid}}$ is the average |
| Hermite-Simpson defect | $\mathbf{d}_k=\mathbf{x}_{k+1}-\mathbf{x}_k-\frac{h}{6}(\mathbf{f}_k+4\mathbf{f}_{\text{mid}}+\mathbf{f}_{k+1})$; local $O(h^5)$, global $O(h^4)$ |
| Measured local order | Trapezoidal $2.94$, Hermite-Simpson $4.94$ (theory $3$ and $5$) |
| Per halving of $h$ | Defects: $\times 8$ and $\times 32$ smaller. Trajectory error: $\times 4$ and $\times 16$ smaller |
| Orbit transfer, direct | From straight lines and $\beta \equiv 0$: $t_f = 12.372081$ ($N=20$), $12.370376$ ($N=40$), against shooting's $12.370316$ |
| Why the naive guess works | Every node is a locally corrected unknown; errors do not compound across the whole horizon |
| Mesh caveat | Control structure finer than $h$ (a switch, a thin singular arc) can hide inside a converged, tight-tolerance solve |

Trapezoidal and Hermite-Simpson are both fixed-degree, local schemes: add nodes, and accuracy improves at a fixed polynomial rate. The next two lessons take the opposite strategy — fit one high-degree polynomial to the whole flight at once — and see accuracy improve faster than any fixed order can match, as long as the solution stays smooth enough to deserve it.

::: context quadrature Squaring the area
**Quadrature** is the old word for computing an area, and so an integral. It comes from the Latin for "making square": ancient Greek geometers asked whether a curved shape, like a circle, could be turned into a square of exactly the same area using only a ruler and compass. Today it means any rule that estimates an integral from a handful of sampled values, each multiplied by a fixed weight and added up. The trapezoidal rule, Simpson's rule and the Gauss rules of the next lesson are all quadrature rules.
:::

::: context trapezoid-picture Why it is called trapezoidal
Join the two end values of $g$ with a straight line and shade underneath. The shaded shape is a trapezoid, with two parallel vertical sides of heights $g(t_k)$ and $g(t_{k+1})$ and width $h$. Its area is the average height times the width, $\tfrac{h}{2}(g(t_k) + g(t_{k+1}))$. The sliver between the true curve and the straight top is the rule's error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M100,140 L100,90 L260,50 L260,140 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M100,90 Q180,40 260,50" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="100" y1="90" x2="260" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <text x="100" y="156" font-size="12" text-anchor="middle" fill="#1f2a44">t_k</text>
  <text x="260" y="156" font-size="12" text-anchor="middle" fill="#1f2a44">t_k+1</text>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">trapezoid area</text>
  <text x="250" y="38" font-size="12" text-anchor="middle" fill="#b4232c">true g(t)</text>
</svg>
```

The red curve bulges above the blue straight top, so here the trapezoid slightly under-counts the area.
:::

::: context hermite Matching values and slopes
Charles Hermite (1822–1901) was a French mathematician who, among much else, studied polynomials that match a function's values *and* its derivatives at chosen points. In collocation this is a gift: the dynamics already tell you the slope $\dot{\mathbf{x}} = \mathbf{f}$ at every node, so a Hermite cubic uses information the solver computes anyway. Computer graphics uses the same curves (as "cubic Hermite splines") to draw smooth paths through keyframes in animation.
:::

::: context simpson Why the middle counts four times
Simpson's rule fits a parabola through three samples — the start, the middle and the end — and takes the exact area under it. Working out that area gives weights $1, 4, 1$, divided by $6$, times $h$. The middle sample counts most because it tells you how much the curve bows. A bonus: the rule turns out to be exact for cubics too, one degree more than it was built for. It is named for the English mathematician Thomas Simpson (1710–1761), though Johannes Kepler used a similar rule a century earlier to estimate the volumes of wine barrels.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M80,130 L80,90 Q180,10 280,70 L280,130 Z" fill="#8fb8f0" stroke="none"/>
  <path d="M80,90 Q180,10 280,70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="80" cy="90" r="4.5" fill="#b4232c"/>
  <circle cx="180" cy="45" r="4.5" fill="#b4232c"/>
  <circle cx="280" cy="70" r="4.5" fill="#b4232c"/>
  <text x="80" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">weight 1</text>
  <text x="180" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">weight 4</text>
  <text x="280" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">weight 1</text>
</svg>
```

The three red samples fix the blue parabola; the shaded area under it is the estimate.
:::

::: context log-log Reading the order off a slope
If the error behaves like $E = C h^p$, take logarithms of both sides: $\log E = \log C + p \log h$. That is a straight line in $\log h$, with slope $p$. So on a plot with logarithmic axes, the order is the steepness of the line. Each halving of $h$ moves one notch left and drops the line by a factor $2^p$: $8$ for slope $3$, $32$ for slope $5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="15" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="140" x2="310" y2="74" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="160" x2="310" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <text x="304" y="90" font-size="12" text-anchor="end" fill="#1d6fd1">slope 3</text>
  <text x="304" y="42" font-size="12" text-anchor="end" fill="#b4232c">slope 5</text>
  <text x="190" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">log h</text>
  <text x="44" y="30" font-size="12" text-anchor="end" fill="#1f2a44">log E</text>
</svg>
```

The steeper line falls faster as $h$ shrinks to the left: that is the higher-order scheme.
:::

::: context primer The costate's steering signal
The **primer vector** is the part of the costate that belongs to velocity, here $(\lambda_{v_r}, \lambda_{v_t})$. The minimum principle says optimal thrust points exactly opposite it, so knowing the primer vector at every instant means knowing how to steer. The name comes from Derek Lawden's work on optimal rocket trajectories in the 1950s and 1960s. Indirect shooting must guess its starting value; collocation never needs it.
:::

::: context sqp How the solver takes a step
**Sequential quadratic programming** solves a hard curved problem as a sequence of easier ones. At the current guess it replaces the cost with a bowl-shaped (quadratic) approximation and the constraints with straight-line (linear) approximations, solves that simpler problem exactly, and steps toward its answer. Then it repeats from the new point. Near the solution the steps get very accurate very fast. SNOPT, a solver widely used for trajectory design, is built on this idea; IPOPT, the other common choice, uses a different family called interior-point methods.
:::

::: context mesh-bridge Putting the nodes where the action is
A later lesson in this module, on **mesh refinement**, turns the warning here into an algorithm. The solver measures the defect error *between* nodes, finds the segments where it is large, and splits them or moves nodes onto the corners — such as the descent's engine switch at $1.8546\,\mathrm{s}$. Then it solves again, warm-started from the old answer, until the error is small everywhere.
:::
