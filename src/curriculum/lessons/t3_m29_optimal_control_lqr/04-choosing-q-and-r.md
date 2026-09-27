---
id: l04-choosing-q-and-r
title: "Choosing Q and R: Bryson's rule, scaling, and the effort budget"
minutes: 19
covers:
  - "Choosing Q and R: Bryson rule, physical scaling, iterating against an effort budget"
---

Imagine two test scores: $45$ on a test out of $50$, and $8$ on a quiz out of $10$. Which went better? You cannot compare $45$ with $8$ directly. You divide each by its total first: $0.90$ against $0.80$. Only then do the two numbers speak the same language.

Choosing $\mathbf{Q}$ and $\mathbf{R}$ for an LQR design is the same problem. The Riccati solver from the last lesson is not the hard part. The hard part is the two matrices you hand it, because nothing in the mathematics tells you what they should be. And a reviewer who asks "why is $Q_{22}$ four hundred?" deserves a better answer than "it worked".

There is a good answer, and it starts from the **[[requirements document|requirements]]** — the agreed list of what the vehicle must do — rather than from gut feeling. Every vehicle program already has numbers written down: a pointing budget in **[[arcseconds|arcsecond]]**, a slew-rate limit, a gimbal deflection limit, a wheel torque rating, a structural load limit. Those numbers are exactly what $\mathbf{Q}$ and $\mathbf{R}$ need, because a quadratic weight is nothing more than a statement of how much of each signal is acceptable.

This lesson is about a three-step loop. **Bryson's rule** turns the requirements into a first pair of matrices. The **frontier** tells you which direction to move from there. And the **fourth-root law** tells you how far to move in one step. This is the part of LQR that is engineering rather than mathematics, and it is what a design review will actually probe.

## Bryson's rule

Take each state and each input. Decide the largest value you are willing to see in normal operation. Then weight it by one over that value squared:

$$
Q_{ii} = \frac{1}{x_{i,\max}^2}, \qquad R_{jj} = \frac{1}{u_{j,\max}^2}, \qquad \text{off-diagonal entries zero}.
$$

Read $x_{i,\max}$ as "x sub i max", the largest acceptable value of state number $i$. Read $Q_{ii}$ as "Q i i", the entry on the diagonal of $\mathbf{Q}$ in row $i$, column $i$. The rule is named after **[[Arthur Bryson|bryson]]**, who made it standard teaching.

::: key Bryson's rule
$Q_{ii} = 1/(\text{max acceptable } x_i)^2$ and $R_{jj} = 1/(\text{max acceptable } u_j)^2$. A scaling heuristic to start tuning from requirements, not an optimality claim.
:::

Why does it work? Because of scaling, not optimality. With these weights, each term in the cost becomes

$$
Q_{ii}\,x_i^2 = \left(\frac{x_i}{x_{i,\max}}\right)^2 ,
$$

a **dimensionless** number — a plain number with no units — that equals exactly $1$ when that signal sits right at its limit. That is the test-score trick: every signal is now graded "out of its own total". A meter, a radian and a newton-meter become comparable. The integrand has no units, so the cost $J$, being an integral over time, comes out in seconds. And as a bonus, the entries of $\mathbf{Q}$ and $\mathbf{R}$ end up of similar size, so the Riccati solve is numerically well behaved.

### The reaction-wheel axis

Take the reaction-wheel axis used throughout this module: one axis of a spacecraft with inertia $J = 120\,\mathrm{kg\,m^2}$, states $\theta$ (angle, "theta") and $\omega$ (rate, "omega"), and the wheel torque as input. Suppose the requirements say $0.5^\circ$ pointing, $2^\circ/\mathrm{s}$ slew rate and $8\,\mathrm{N\,m}$ torque.

Convert to radians first ($0.5^\circ = 8.727\times10^{-3}\,\mathrm{rad}$, $2^\circ/\mathrm{s} = 3.491\times10^{-2}\,\mathrm{rad/s}$). Then square and flip each one:

$$
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^{4},\ 820.70\big),\qquad R = \frac{1}{8^2} = 1.5625\times10^{-2}.
$$

The Riccati solution gives

$$
\mathbf{K} = (916.73,\ 522.05), \qquad \text{closed-loop poles } -2.175 \pm 1.705j\,\mathrm{s^{-1}}, \qquad \omega_n = 2.764\,\mathrm{rad/s}.
$$

Here $\omega_n$ ("omega sub n") is the natural frequency — the distance of the poles from the origin, and a good measure of how fast the loop responds. Is this the right controller? That is the next question. That it is a defensible **starting point** is the whole claim.

::: warning Bryson's rule is a starting point, not an answer
There are three things it does not do.

First, it is not optimal in any sense. It optimizes nothing; it scales.

Second, it says nothing about states that matter only in combination. If the requirement is on a combination $\mathbf{z} = \mathbf{C}_z\mathbf{x}$, the right weight is $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, with off-diagonal entries.

Third, its "maximum acceptable value" is a *steady-state* budget. It says nothing about the transient from a large upset. The design above draws $80\,\mathrm{N\,m}$ from a $5^\circ$ initial offset — ten times the torque rating — because $5^\circ$ is ten times the pointing budget the weights were scaled for. Bryson gets you onto the frontier. It does not tell you where on the frontier to stand.
:::

## The frontier

Think of a car. A faster zero-to-sixty burns more fuel. You can have a quick car or a thrifty one, and every real car sits somewhere on that trade. An LQR design has the same kind of trade between speed of response and control effort.

To see it, hold $\mathbf{Q}$ fixed and sweep $\mathbf{R}$. Because only the ratio of $\mathbf{Q}$ to $\mathbf{R}$ matters, this single sweep traces every design the weights can produce. And it traces them in order: no value of $R$ gives a design that is both faster *and* cheaper than another. A curve with that property — every point is the best you can do for its cost — is called a **[[frontier|frontier]]**. That ordering is what makes the sweep a frontier rather than a random search.

::: example Six decades of R on the wheel axis
Use $\mathbf{Q} = \mathbf{I}$ — deliberately unscaled, to see what the sweep alone does — and let $R$ run from $10^{-3}$ to $10^{3}$. Simulate a $5^\circ$ initial offset each time. Here $\zeta$ ("zeta") is the damping ratio.

| $R$ | $k_1$ | $k_2$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\zeta$ | 2 % settling (s) | peak $|u|$ (N m) |
| --- | --- | --- | --- | --- | --- | --- |
| $10^{-3}$ | $31.62$ | $92.68$ | $-0.386 \pm 0.338j$ | $0.752$ | $11.1$ | $2.760$ |
| $10^{-2}$ | $10.00$ | $50.00$ | $-0.208 \pm 0.200j$ | $0.722$ | $20.5$ | $0.873$ |
| $10^{-1}$ | $3.162$ | $27.73$ | $-0.116 \pm 0.114j$ | $0.712$ | $36.7$ | $0.276$ |
| $1$ | $1.000$ | $15.52$ | $-0.0647 \pm 0.0644j$ | $0.709$ | $65.3$ | $0.087$ |
| $10$ | $0.316$ | $8.718$ | $-0.0363 \pm 0.0363j$ | $0.708$ | $116$ | $0.028$ |
| $10^{2}$ | $0.100$ | $4.900$ | $-0.0204 \pm 0.0204j$ | $0.707$ | $207$ | $0.009$ |
| $10^{3}$ | $0.0316$ | $2.755$ | $-0.0115 \pm 0.0115j$ | $0.707$ | $367$ | $0.003$ |

**Read the trade.** Every column moves in one direction only. Going down the table, settling time grows and peak torque shrinks — across six decades of $R$ and three decades of peak effort — and no design on the list beats another on both. That is the trade, drawn as a table.

**Read the gains.** With $q_1 = 1$, the angle gain is $k_1 = \sqrt{q_1/R} = R^{-1/2}$ exactly. So it drops by $\sqrt{10} = 3.16$ per decade of $R$: from $31.62$ to $10.00$ to $3.162$. The natural frequency is $\omega_n = (q_1/R)^{1/4}/\sqrt{J}$, which drops by $10^{1/4} = 1.78$ per decade. Check one: at $R = 1$, $\omega_n = 1/\sqrt{120} = 0.0913\,\mathrm{rad/s}$, and $\sqrt{0.0647^2 + 0.0644^2} = 0.0913$. It matches.

**Read the damping.** $\zeta$ sits at $0.707$ over most of the sweep and creeps up only at the cheap end, where the rate weight starts to matter. With the angle weighted alone, an LQR on a double integrator puts its poles on the $45^\circ$ lines — a **[[Butterworth|butterworth]]** pair — and the lesson on cheap control explains the pattern in general.

**Read the starting point.** Even at $R = 10^{-3}$ the axis takes eleven seconds to settle while drawing under $3\,\mathrm{N\,m}$ of an available $8$. The sweep is doing its job. The starting point is poor, because $\mathbf{Q} = \mathbf{I}$ on one state measured in radians beside another in radians per second encodes a trade nobody chose.
:::

## Iterating to a budget

The sweep has a shortcut that saves most of the trial and error. Replace $R$ by $\alpha R$, where $\alpha$ ("alpha") is a scale factor. Then:

1. The angle gain $k_1 = \sqrt{q_1/(\alpha R)}$ falls as $\alpha^{-1/2}$.
2. For a plant whose first state is a pure integral of the second — angle is the integral of rate — the biggest command from a step offset $\theta_0$ happens at the very first instant, and it is $|u(0)| = k_1\theta_0$.
3. So the peak effort falls as $\alpha^{-1/2}$ too.

Turn that around and you get the factor you need in one line:

$$
\text{peak effort} \propto \alpha^{-1/2}
\qquad\Longrightarrow\qquad
\alpha = \left(\frac{\text{peak you got}}{\text{peak you can afford}}\right)^{2}.
$$

The bandwidth follows the **[[fourth-root law|fourth-root]]**, $\omega_n \propto \alpha^{-1/4}$. One simulation, one division, one re-solve.

::: example Sizing the wheel axis to its torque rating
Start from the Bryson design, $\mathbf{K} = (916.73,\ 522.05)$. The requirement: a $5^\circ$ off-nominal attitude — the worst case coming out of a safe-mode recovery — must be corrected without saturating the $8\,\mathrm{N\,m}$ wheels.

**Step 1: simulate.** The peak torque is $80.0\,\mathrm{N\,m}$.

**Step 2: divide and square.** $\alpha = (80/8)^2 = 10^2 = 100$.

**Step 3: re-solve with $R \to 100R$.** Here is that design among its neighbors:

| $\alpha$ | $\mathbf{K}$ | $\omega_n\,(\mathrm{rad/s})$ | 2 % settling (s) | peak $|u|$ from $5^\circ$ (N m) |
| --- | --- | --- | --- | --- |
| $1$ | $(916.7,\ 522.1)$ | $2.764$ | $1.32$ | $80.0$ |
| $10$ | $(289.9,\ 273.5)$ | $1.554$ | $3.77$ | $25.3$ |
| $100$ | $(91.67,\ 150.1)$ | $0.874$ | $6.79$ | $8.00$ |
| $10^{3}$ | $(28.99,\ 83.73)$ | $0.492$ | $12.1$ | $2.53$ |
| $10^{4}$ | $(9.17,\ 46.96)$ | $0.276$ | $21.6$ | $0.80$ |

**Sanity check.** $\alpha = 100$ lands the peak on $8.00\,\mathrm{N\,m}$ on the first try, as the $\alpha^{-1/2}$ law predicts: $80/\sqrt{100} = 8$. The price is bandwidth. $\omega_n$ falls from $2.764$ to $0.874\,\mathrm{rad/s}$, a factor of $\sqrt[4]{100} = 3.16$, and settling stretches from $1.32$ to $6.79\,\mathrm{s}$.

That is the honest trade, and it is worth saying out loud in a review: *a $5^\circ$ recovery slew within the torque rating costs a factor of three in attitude bandwidth compared with the Bryson design.* The alternative is to keep the fast gains and shape the reference command so the controller never sees a $5^\circ$ error all at once. That is a different architecture, not a different $\mathbf{R}$ — and for large slews it is usually the better answer.
:::

## The shape of Q, not only its size

Think of pocket money. Spending more buys more, but so does spending the same amount more wisely. Scaling $\mathbf{R}$ changes how much you spend: it walks you along the frontier. Changing the *shape* of $\mathbf{Q}$ — the balance between its entries — spends the same effort differently, and can move the frontier itself. This is the move that answers "tighter pointing without more actuator authority".

Here is how to see it. Pin the peak torque. Since $|u(0)| = k_1\theta_0$ and $k_1 = \sqrt{q_1/R}$, choosing

$$
\frac{q_1}{R} = \left(\frac{8}{0.0873}\right)^2
$$

fixes $k_1 = 91.67$ and so pins the peak at $8.00\,\mathrm{N\,m}$ for a $5^\circ$ offset ($5^\circ = 0.0873\,\mathrm{rad}$), whatever the rate weight $q_2$ does. Now sweep $q_2$ alone:

| $q_2$ | $k_2$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\zeta$ | 2 % settling (s) | peak $|u|$ (N m) |
| --- | --- | --- | --- | --- | --- |
| $0$ | $148.3$ | $-0.618 \pm 0.618j$ | $0.707$ | $6.82$ | $8.00$ |
| $80$ | $164.7$ | $-0.686 \pm 0.541j$ | $0.785$ | $4.17$ | $8.00$ |
| $300$ | $203.0$ | $-0.846 \pm 0.221j$ | $0.968$ | $6.25$ | $8.00$ |
| $820.7$ | $273.0$ | $-0.410,\ -1.865$ | — | $10.2$ | $8.00$ |
| $2\times10^{4}$ | $1141$ | $-0.081,\ -9.428$ | — | $48.4$ | $8.00$ |

Same peak effort in every row, yet settling times span a factor of twelve. The best of these, $q_2 = 80$, settles in $4.17\,\mathrm{s}$ against $10.2\,\mathrm{s}$ for the Bryson shape ($q_2 = 820.7$). That is a real improvement bought with no extra torque — by spending the weight where it does the most good, rather than where the requirements document happened to put it.

Push $q_2$ further and the rate penalty takes over. The loop becomes **[[overdamped|pole-walk]]** — it creeps in without overshooting — and one pole crawls in toward the origin. At $q_2 = 2\times10^4$ the axis takes most of a minute to settle while still drawing its full $8\,\mathrm{N\,m}$ at the start.

Two cautions on that table.

- **Settling time jumps.** The 2 % settling time is a **[[discontinuous|settling-jump]]** function of the gains: it jumps whenever an overshoot peak crosses the edge of the band. That is why it falls from $6.09\,\mathrm{s}$ at $q_2 = 70$ to $4.17\,\mathrm{s}$ at $q_2 = 80$. It is a reporting number, not something to optimize directly.
- **Reshaping has limits.** The improvement here is real but bounded. You cannot reshape your way out of a genuine shortage of authority. If the frontier at your available torque does not reach the requirement, the answer is a bigger wheel, a better sensor or a relaxed requirement.

## Practical rules

- **Fix one matrix.** Set $\mathbf{R} = \mathrm{diag}(1/u_{j,\max}^2)$ and leave it alone; do all the tuning in $\mathbf{Q}$. Two knobs for one degree of freedom wastes an afternoon.
- **Move in decades.** Bandwidth goes as the fourth root of the weight ratio, so doubling $\omega_n$ takes a factor of $2^4 = 16$ in weight. A change smaller than about a factor of three in a weight is not one you will see.
- **Weight outputs, not states, when that is what you mean.** If the requirement is on a line-of-sight error that mixes several states, use $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$ with the mix in $\mathbf{C}_z$, and accept the off-diagonal terms. A diagonal $\mathbf{Q}$ is a convenience, not a law.
- **Check saturation against the real set of upsets**, not against the budget in the requirements document. The two differ by a factor of ten often enough that it belongs on a checklist.
- **Re-check the loop at the extremes of the sweep.** As $\mathbf{R}$ shrinks, the gains and bandwidth grow into the dynamics the model left out — the **[[flexible modes|flex-modes]]**, the sensor bandwidth, the sample rate. A design that is excellent against the rigid-body model can be unflyable on the real vehicle. The frontier is computed from the model you gave it.

::: warning Weighting a state you did not intend to regulate
Some states have no acceptable maximum: a wheel speed that may sit anywhere in its range, or an integrator you added on purpose. Giving such a state a Bryson weight quietly adds a requirement nobody wrote. A wheel-speed weight pulls stored momentum toward zero and fights the **[[momentum-management|momentum-dumping]]** logic. An integrator weight undoes the integrator. The correct weight for such a state is zero — and zero is allowed, provided the state is still detectable through the remaining weights, meaning any motion it has still shows up in the weighted states. Check that before putting a reciprocal square on every diagonal entry.
:::

## Check yourself

::: check
State Bryson's rule from memory and apply it: a launch vehicle must hold angle of attack below $3^\circ$ and pitch rate below $4^\circ/\mathrm{s}$, with gimbal deflection limited to $5^\circ$. Write $\mathbf{Q}$ and $R$.
:::

::: answer
Weight each term by one over the square of its budget. First convert to radians: $3^\circ = 0.05236$, $4^\circ/\mathrm{s} = 0.06981$ per second, $5^\circ = 0.08727$. Then

$$
\mathbf{Q} = \mathrm{diag}\left(\frac{1}{0.05236^2},\ \frac{1}{0.06981^2}\right) = \mathrm{diag}(364.8,\ 205.2)\ \mathrm{rad^{-2}},
\qquad R = \frac{1}{0.08727^2} = 131.3\ \mathrm{rad^{-2}} .
$$

Two remarks belong in the same breath. First, the units must match. Mixing degrees in $\mathbf{Q}$ with radians in $R$ changes the ratio by $(180/\pi)^2 = 3283$, and gives a controller that is off by a factor of $\sqrt[4]{3283} = 7.6$ in bandwidth. Second, these three limits are not independent: the gimbal makes the pitch rate, which makes the angle of attack. So the resulting design should be checked against the actual wind profile, not assumed to respect all three limits at once.
:::

::: check
A design draws a peak of $26\,\mathrm{N\,m}$ and you can afford $9\,\mathrm{N\,m}$. By what factor do you change $R$, and what happens to the closed-loop bandwidth?
:::

::: answer
Peak effort scales as $\alpha^{-1/2}$ when $R \to \alpha R$, so $\alpha = (26/9)^2 = 8.35$. Multiply $R$ by $8.35$ — or divide every entry of $\mathbf{Q}$ by $8.35$, which is the same move.

The bandwidth scales as $\alpha^{-1/4} = 8.35^{-1/4} = 0.588$. So $\omega_n$ falls by about $41\,\%$, and the settling time grows by roughly the inverse factor, $1/0.588 = 1.70$.

The prediction is exact for a plant whose peak command comes at $t = 0$ and whose first state is a pure integral of the second. For a general plant it is a good first step, and one more simulate-and-scale round lands on the budget. Verify rather than assume: the worked example hit $8.00\,\mathrm{N\,m}$ from $80.0$ at $\alpha = 100$ exactly, but a plant whose peak comes mid-transient will need the second round.
:::

::: check
Your reviewer asks why the rate weight is $820.7$ and not $82.07$. Answer in terms of what changes and what does not.
:::

::: answer
$820.7 = 1/(2^\circ/\mathrm{s})^2$ in radians — it is the slew rate the requirements document allows. $82.07$ would correspond to a budget of $1/\sqrt{82.07} = 0.110\,\mathrm{rad/s} = 6.3^\circ/\mathrm{s}$, which no document contains.

**What changes if you use it:** the rate penalty falls tenfold relative to the angle penalty. The damping changes, the pole pattern moves, and the axis overshoots more, settling faster or slower depending on where on the shape curve you land. The $q_2$ table in this lesson is exactly that sensitivity.

**What does not change:** the peak command from a step, because that is set by $k_1 = \sqrt{q_1/R}$, and neither $q_1$ nor $R$ was touched.

So the honest answer is: "the rate weight is the slew budget, and changing it trades damping against settling at constant peak torque". Then show the table, because a reviewer who asks this wants the sensitivity, not only where the number came from.
:::

::: check
Two engineers produce controllers for the same plant. One used $\mathbf{Q} = \mathrm{diag}(100, 4)$, $R = 1$; the other $\mathbf{Q} = \mathrm{diag}(2500, 100)$, $R = 25$. Compare their gains without solving anything.
:::

::: answer
They are the same controller. The second pair is the first multiplied by $25$ throughout. Scaling $\mathbf{Q}$ and $\mathbf{R}$ by a common positive factor multiplies every trajectory's cost by that factor. That leaves the ranking of trajectories unchanged, and so the best one is unchanged. In the equations, $\mathbf{P}$ scales by $25$, and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ has the $25$ on top and bottom, so it does not move.

Only the ratio matters. The practical lesson: comparing two designs by their weights means nothing until both are normalized — divide each by its $R$, or by its largest entry. An argument about whether $\mathbf{Q}$ should be "bigger" is an argument about nothing unless $\mathbf{R}$ is held fixed.
:::

::: check
The frontier table shows the damping ratio approaching $0.707$ from above as $R$ grows. Why $0.707$, and what does it mean for tuning?
:::

::: answer
For this plant, $\omega_n = (q_1/R)^{1/4}/\sqrt{J}$ and $2\zeta\omega_n = k_2/J$, with

$$
k_2 = \sqrt{\frac{q_2 + 2J\sqrt{q_1R}}{R}} = \sqrt{\frac{q_2}{R} + 2J\sqrt{\frac{q_1}{R}}}.
$$

As $R$ grows, the $q_2/R$ term shrinks faster than the $2J\sqrt{q_1/R}$ term. So $k_2 \to \sqrt{2J}\,(q_1/R)^{1/4}$, and

$$
\zeta = \frac{k_2}{2J\omega_n} \to \frac{\sqrt{2J}\,(q_1/R)^{1/4}}{2J\,(q_1/R)^{1/4}/\sqrt{J}} = \frac{\sqrt{2J}\sqrt{J}}{2J} = \frac{1}{\sqrt2} = 0.707 .
$$

That is the Butterworth pattern: when control is expensive, an LQR on a double integrator puts its two poles on the lines at $45^\circ$ to the axes.

For tuning, it means the damping is largely **not** yours to choose on this plant. The optimizer picks something close to $0.707$ over most of the useful range. If you need a different damping, either reshape $\mathbf{Q}$, as the $q_2$ table does, or accept that LQR has chosen a defensible answer and stop fighting it.
:::

## Summary

| Rule / result | Statement |
| --- | --- |
| Bryson's rule | $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$; scaling from requirements, not optimality |
| Effect of scaling | Each term becomes dimensionless and equals one at its limit; $J$ is in seconds |
| Only the ratio | $(\alpha\mathbf{Q}, \alpha\mathbf{R})$ gives the same $\mathbf{K}$; fix $\mathbf{R}$ and tune $\mathbf{Q}$ |
| Frontier | Sweeping $R$ traces a one-way trade between settling time and peak effort |
| Fourth-root law | $\omega_n \propto (q_1/R)^{1/4}$: a factor $16$ in weight for a factor $2$ in bandwidth |
| Budget iteration | Peak effort $\propto \alpha^{-1/2}$, so $\alpha = (\text{peak obtained}/\text{peak affordable})^2$ |
| Shape versus size | At fixed peak torque, varying $q_2$ moved settling from $4.17$ to $48.4\,\mathrm{s}$ |
| Output weighting | $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$ when the requirement is on a combination of states |
| Zero weights | Allowed and often correct, provided $(\mathbf{A}, \mathbf{Q}^{1/2})$ stays detectable |
| Wheel axis, Bryson | $\mathbf{Q} = \mathrm{diag}(1.3131\times10^4, 820.70)$, $R = 1.5625\times10^{-2}$, $\mathbf{K} = (916.7, 522.1)$, $\omega_n = 2.764\,\mathrm{rad/s}$ |
| Same axis, sized to $8\,\mathrm{N\,m}$ | $\alpha = 100$, $\mathbf{K} = (91.67, 150.1)$, $\omega_n = 0.874\,\mathrm{rad/s}$, settling $6.79\,\mathrm{s}$ |

You can now produce a controller and defend its weights. The next lesson asks a different question about the same controller: how wrong can the plant model be before the controller stops working — and why the answer for full state feedback is unusually generous.

::: context requirements The document everything traces back to
Before a vehicle is designed, the program writes down what it must do, as numbers: "point the telescope to within $0.5^\circ$", "never exceed $8\,\mathrm{N\,m}$ of wheel torque". Each engineering team inherits its share of those numbers as a **budget**. At every design review, each choice is traced back to a line in that document. That is why Bryson's rule is so popular in industry: every weight in $\mathbf{Q}$ and $\mathbf{R}$ points to a requirement someone already signed.
:::

::: context arcsecond A very small angle
A degree is split into $60$ arcminutes, and each arcminute into $60$ arcseconds, so one arcsecond is $1/3600$ of a degree, about $4.85\times10^{-6}\,\mathrm{rad}$. That is roughly the width of a coin seen from four kilometers away. Space telescopes are specified in arcseconds or finer: the Hubble Space Telescope holds its pointing steady to about $0.007$ arcseconds over long exposures.
:::

::: context bryson Who Bryson was
Arthur E. Bryson Jr. was a Stanford professor of aeronautics and one of the founders of modern optimal control. His book with Yu-Chi Ho, *Applied Optimal Control* (1969), taught a generation of engineers how to use these methods on real aircraft and spacecraft, and the weighting rule named after him comes from that tradition. Bryson himself presented it as a practical way to begin, not as a theorem — exactly the spirit of the key block in this lesson.
:::

::: context frontier The frontier, drawn
Each dot is one design from the sweep table, from $R = 10^{-3}$ (bottom right: fast settling, big torque) to $R = 10^{3}$ (top left: slow settling, tiny torque). Both axes are logarithmic.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="335" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="120" y1="180" x2="120" y2="185"/><line x1="190" y1="180" x2="190" y2="185"/><line x1="260" y1="180" x2="260" y2="185"/><line x1="330" y1="180" x2="330" y2="185"/><line x1="45" y1="105" x2="50" y2="105"/><line x1="45" y1="30" x2="50" y2="30"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="197">0.001</text><text x="120" y="197">0.01</text><text x="190" y="197">0.1</text><text x="260" y="197">1</text><text x="330" y="197">10</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="42" y="184">10</text><text x="42" y="109">100</text><text x="42" y="34">1000</text></g>
  <text x="190" y="212" font-size="11" fill="#1f2a44" text-anchor="middle">peak torque (N m)</text>
  <text x="58" y="20" font-size="11" fill="#1f2a44">settling time (s)</text>
  <polyline points="290.9,176.6 255.9,156.6 220.9,137.7 185.8,118.9 151.3,100.2 116.8,81.3 83.4,62.7" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#1d6fd1"><circle cx="290.9" cy="176.6" r="4"/><circle cx="255.9" cy="156.6" r="4"/><circle cx="220.9" cy="137.7" r="4"/><circle cx="185.8" cy="118.9" r="4"/><circle cx="151.3" cy="100.2" r="4"/><circle cx="116.8" cy="81.3" r="4"/><circle cx="83.4" cy="62.7" r="4"/></g>
  <text x="296" y="166" font-size="11" fill="#b4232c">R = 0.001</text>
  <text x="92" y="55" font-size="11" fill="#b4232c">R = 1000</text>
</svg>
```

Each step down-left is one decade of $R$: settling time grows by $10^{1/4} \approx 1.78$ and peak torque shrinks by $10^{1/2} \approx 3.16$. No dot is both lower and further left than another — that is what "frontier" means.
:::

::: context butterworth Why the name Butterworth
In 1930 the British engineer Stephen Butterworth described a family of electronic filters whose poles sit evenly spaced on a circle. The two-pole version has its poles at $45^\circ$ on either side of the negative real axis, which gives a damping ratio of exactly $\cos 45^\circ = 1/\sqrt2 = 0.707$ — the flattest response you can get without a bump.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="15" x2="300" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M300,20 A80,80 0 0,0 300,180" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="300" y1="100" x2="243.4" y2="43.4" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="300" y1="100" x2="243.4" y2="156.6" stroke="#6c7a93" stroke-width="1.2"/>
  <path d="M277,100 A23,23 0 0,1 283.7,83.7" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="252" y="92" font-size="11" fill="#b4232c">45°</text>
  <g stroke="#1d6fd1" stroke-width="2.5"><path d="M238.4,38.4 l10,10 m0,-10 l-10,10"/><path d="M238.4,151.6 l10,10 m0,-10 l-10,10"/></g>
  <text x="205" y="38" font-size="11" fill="#1f2a44">pole</text>
  <text x="205" y="172" font-size="11" fill="#1f2a44">pole</text>
  <text x="306" y="30" font-size="11" fill="#1f2a44">Im</text>
  <text x="318" y="94" font-size="11" fill="#1f2a44">Re</text>
  <text x="20" y="190" font-size="11" fill="#1f2a44">ζ = cos 45° = 0.707</text>
</svg>
```

LQR lands on the same pattern by itself, which is a sign that the optimizer and the filter designer were solving closely related problems.
:::

::: context fourth-root Why a fourth root
Two square roots stack up. The angle gain is $k_1 = \sqrt{q_1/R}$ — one square root. The natural frequency of a spring-and-mass-like loop is $\omega_n = \sqrt{k_1/J}$ — a second square root. A square root of a square root is a fourth root, so $\omega_n = (q_1/R)^{1/4}/\sqrt{J}$. This is why weights feel so sluggish to tune: to double the speed of the loop, you must multiply the weight ratio by $2^4 = 16$.
:::

::: context pole-walk Where the poles go as the rate weight grows
Every design here has the same angle gain, $k_1 = 91.67$, so the product of the two poles stays fixed at $k_1/J = 0.764\,\mathrm{s^{-2}}$. As $q_2$ grows, the pair slides down toward the real axis, meets it, and then splits: one pole races left, the other crawls toward the origin and makes the response slow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="20" x2="330" y2="200" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="255" y1="106" x2="255" y2="114"/><line x1="180" y1="106" x2="180" y2="114"/><line x1="105" y1="106" x2="105" y2="114"/><line x1="30" y1="106" x2="30" y2="114"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="255" y="127">−0.5</text><text x="180" y="127">−1</text><text x="105" y="127">−1.5</text><text x="30" y="127">−2</text><text x="338" y="127">0</text></g>
  <text x="336" y="30" font-size="11" fill="#1f2a44">Im</text>
  <text x="340" y="104" font-size="11" fill="#1f2a44">Re</text>
  <g stroke="#1d6fd1" stroke-width="2"><path d="M233.3,44.2 l8,8 m0,-8 l-8,8"/><path d="M233.3,167.8 l8,8 m0,-8 l-8,8"/></g>
  <g stroke="#b4232c" stroke-width="2"><path d="M223.1,51.9 l8,8 m0,-8 l-8,8"/><path d="M223.1,160.1 l8,8 m0,-8 l-8,8"/></g>
  <g stroke="#f2b880" stroke-width="2.5"><path d="M199.1,83.9 l8,8 m0,-8 l-8,8"/><path d="M199.1,128.1 l8,8 m0,-8 l-8,8"/></g>
  <g stroke="#1f2a44" stroke-width="2"><path d="M264.5,106 l8,8 m0,-8 l-8,8"/><path d="M46.2,106 l8,8 m0,-8 l-8,8"/></g>
  <g font-size="11"><text x="246" y="46" fill="#1d6fd1">q₂ = 0</text><text x="168" y="64" fill="#b4232c">q₂ = 80</text><text x="212" y="80" fill="#1f2a44">q₂ = 300</text><text x="40" y="98" fill="#1f2a44">q₂ = 820.7</text><text x="258" y="98" fill="#1f2a44">q₂ = 820.7</text></g>
</svg>
```

The blue pair ($q_2 = 0$) sits on the $45^\circ$ lines; red ($q_2 = 80$) is the fastest-settling design; orange ($q_2 = 300$) is nearly critically damped; the two dark crosses on the axis are the Bryson shape.
:::

::: context settling-jump Why settling time jumps
The 2 % settling time is the last moment the response is outside a thin band around zero. A lightly damped response wiggles, and each wiggle's peak is a chance to poke outside the band. Nudge the gains so that one peak drops barely inside the band, and the "last time outside" suddenly moves back by a whole half-wiggle. The number leaps even though the motion barely changed. That is why engineers report it but rarely optimize it directly.
:::

::: context flex-modes The vehicle is not a rigid brick
The models in this module treat the vehicle as one rigid body. Real spacecraft have solar arrays, antennas and booms that flex like diving boards, and launch vehicles bend like long thin tubes. Each flexing shape has a natural frequency, often a few hertz or less for big arrays. If the control loop becomes fast enough to push on those frequencies, it can shake the structure instead of steering it. Keeping the bandwidth well below the first flexible mode is one of the oldest rules in spacecraft control.
:::

::: context momentum-dumping Emptying the wheels
Reaction wheels steer a spacecraft by spinning up and down. Steady outside torques — from sunlight pressure, gravity gradient or thin air — make the wheels slowly spin faster and faster, until they would reach their speed limit. So the spacecraft periodically "dumps" that stored momentum, using magnetic torquers or small thrusters to push against the outside world while the wheels spin back down. A controller that also tries to hold the wheel speed at zero fights this separate process.
:::
