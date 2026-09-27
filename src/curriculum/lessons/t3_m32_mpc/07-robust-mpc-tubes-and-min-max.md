---
id: l07-robust-mpc-tubes-and-min-max
title: Robust MPC, tubes and min-max
minutes: 24
covers:
  - 'Robust MPC: tube MPC and min-max formulations'
---

Imagine walking across a dark room toward a door. You plan your path while the light is on. Then the light goes off. If you walk the plan with your eyes shut, every small wobble in your step adds up, and after twenty steps you could be a meter off. If instead you keep one hand on the wall and correct as you go, your wobbles never add up. You stay close to the plan the whole way.

Every guarantee in this module so far has assumed the lights stay on. The stability proof assumed the vehicle lands exactly where the model predicted. So did recursive feasibility. A real vehicle does not. Thrusters deliver a few percent more or less than commanded. The exhaust plume pushes on a solar array. The **[[gravity gradient|gravity-gradient]]** makes a torque the model may not include. The atmosphere is not the one in the table. And the navigation filter hands over an estimate, not the truth.

**Robust MPC** brings the guarantees back when there is a disturbance whose size has a known limit. There are two families. **Min-max MPC** plans against the worst disturbance that could happen. **Tube MPC** splits the job in two: a nominal plan, and a feedback law that keeps the real vehicle near that plan — the hand on the wall. Tube MPC is the one that flies. This lesson shows why: if the prediction pretends nobody will react to the disturbance, the uncertainty piles up over the horizon until the problem strangles itself.

## The disturbed model

The model now has one extra term:

$$
\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k + \mathbf{w}_k, \qquad \mathbf{w}_k \in \mathbb{W}.
$$

Here $\mathbf{w}_k$ ("w sub k") is the **disturbance** at step $k$ — whatever pushes the state that the model did not predict. $\mathbb{W}$ (a blackboard-bold W) is the set it must lie in. Read $\mathbf{w}_k \in \mathbb{W}$ as "w sub k is somewhere in the set W".

$\mathbb{W}$ is known, bounded, **convex** (no dents or holes — the straight line between any two of its points stays inside), and contains the origin. Usually it is a **[[polytope|polytope-word]]**, a shape with flat sides, so that every set we build from it also has flat sides.

Above all, $\mathbb{W}$ is a *bound*, not a probability distribution. It says "the disturbance is never bigger than this". The guarantees hold for every disturbance sequence inside it. They say nothing at all about one outside it.

## Uncertainty compounds

First, see why a plan made once cannot stay accurate. Let $\mathbf{e}_k$ be the **error**: the gap between the true state and the plan after $k$ steps. With no feedback, each disturbance gets carried forward by the dynamics, so

$$
\mathbf{e}_k = \sum_{i=0}^{k-1}\mathbf{A}^{i}\mathbf{w}_{k-1-i}.
$$

The newest disturbance arrives untouched, the one before has been through $\mathbf{A}$ once, and so on back to the first.

Each $\mathbf{w}$ could be anywhere in $\mathbb{W}$, so the error could be anywhere in a set. To describe that set we need one new operation. The **[[Minkowski sum|minkowski-sum]]** of two sets, written $\mathbb{S} \oplus \mathbb{T}$ ("S plus T", with a circled plus), is every point you can reach by adding one point of $\mathbb{S}$ to one point of $\mathbb{T}$. Think of sliding the shape $\mathbb{T}$ all over $\mathbb{S}$ and painting everything it touches.

The set of all possible errors after $k$ steps is then

$$
\mathbb{W} \oplus \mathbf{A}\mathbb{W} \oplus \cdots \oplus \mathbf{A}^{k-1}\mathbb{W},
$$

where $\mathbf{A}\mathbb{W}$ means every point of $\mathbb{W}$ multiplied by $\mathbf{A}$. If $\mathbf{A}$ is not stable, the pieces do not shrink as $i$ grows, and the set keeps getting bigger.

::: example How far the truth drifts from an open-loop plan
Take the running vehicle — one axis of a spacecraft doing proximity operations, with $\mathbf{A} = \begin{bmatrix}1 & 0.1\\ 0 & 1\end{bmatrix}$ and $\mathbf{B} = \begin{bmatrix}0.005\\ 0.1\end{bmatrix}$ at $T_s = 0.1\,\mathrm{s}$. Add an unmodeled acceleration $d$ with $|d| \le 0.05\,\mathrm{m/s^2}$. Then $\mathbb{W} = \{\mathbf{B}d : |d| \le 0.05\}$. That is a line segment with endpoints $\pm(0.25\,\mathrm{mm},\ 5\,\mathrm{mm/s})$: multiply $\mathbf{B}$ by $0.05$ and you get $0.00025\,\mathrm{m}$ and $0.005\,\mathrm{m/s}$.

Push that segment through the open-loop dynamics and add up the worst cases:

| steps | horizon (s) | worst-case $\lvert e_1\rvert$ | worst-case $\lvert e_2\rvert$ |
| --- | --- | --- | --- |
| $5$ | $0.5$ | $6.3\,\mathrm{mm}$ | $25\,\mathrm{mm/s}$ |
| $10$ | $1.0$ | $25\,\mathrm{mm}$ | $50\,\mathrm{mm/s}$ |
| $20$ | $2.0$ | $100\,\mathrm{mm}$ | $100\,\mathrm{mm/s}$ |
| $40$ | $4.0$ | $400\,\mathrm{mm}$ | $200\,\mathrm{mm/s}$ |

The velocity error $e_2$ doubles when the horizon doubles: it grows in a straight line, $5\,\mathrm{mm/s}$ per step. The position error $e_1$ goes up four times when the horizon doubles: it grows as the square. That is because the double integrator integrates the disturbance twice, and nothing pulls it back.

Sanity check at $40$ steps: a steady $0.05\,\mathrm{m/s^2}$ push for $4\,\mathrm{s}$ moves you $\tfrac{1}{2}(0.05)(4^2) = 0.4\,\mathrm{m}$. That matches the $400\,\mathrm{mm}$ in the table.

So by the end of a four-second horizon the worst case is $0.4\,\mathrm{m}$ — a fifth of the $2\,\mathrm{m}$ maneuver the earlier lessons flew. A formulation that must meet every constraint for every disturbance sequence would have to give away that much margin at the end of the horizon. From most useful states it would have no solution at all.

The flaw is not the disturbance. It is the assumption that nobody will react to it. The real vehicle re-solves every $0.1\,\mathrm{s}$, and the prediction should say so.
:::

## Min-max MPC

The direct approach plans against the worst case:

$$
\min_{\mathbf{U}}\ \max_{\mathbf{w}_0,\dots,\mathbf{w}_{N-1} \in \mathbb{W}}\ \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)
\quad\text{s.t. constraints for every } \mathbf{w}\text{-sequence}.
$$

Read it inside out. The inner "max" is an opponent who picks the disturbances to make your cost as large as possible. The outer "min" is you, picking the inputs $\mathbf{U}$ to make that worst case as small as possible. $\ell$ is the stage cost and $V_f$ the terminal cost, as before.

The two versions differ in what "you" may pick.

In **open-loop min-max**, $\mathbf{U}$ is one fixed sequence of inputs that must work for every possible disturbance. A useful fact keeps this finite: if a linear constraint holds at every corner (**vertex**) of a polytope, it holds everywhere inside it. So you only need to check the vertices of $\mathbb{W}$. But the single sequence has to absorb the whole spread in the table above. For any horizon worth having, the result is crushingly conservative.

In **feedback min-max**, you pick a **policy**: a rule that gives a different input for each disturbance history you might see. That removes the conservatism, and the solvability with it. If $\mathbb{W}$ has $v$ vertices, the **[[scenario tree|scenario-tree]]** of possible histories has $v^N$ branches at the end. Our segment has $v = 2$, so there are

- $2^5 = 32$ sequences at $N = 5$,
- $2^{10} = 1024$ at $N = 10$,
- $2^{20} = 1{,}048{,}576$ at $N = 20$.

For small problems, exact dynamic-programming solutions exist, and they produce a piecewise-affine law. Restricted families of policies — **[[affine disturbance feedback|affine-disturbance-feedback]]** is the best known — turn it back into a convex problem of moderate size. These are valuable analysis tools. They are not what a flight computer runs at $10\,\mathrm{Hz}$.

## Tube MPC

Tube MPC gets the benefit of feedback inside the prediction at almost no cost. The trick is to fix the feedback law in advance, instead of optimizing over it.

Split the true state into two parts. The **nominal state** $\mathbf{z}$ is where the plan says you should be; it moves with no disturbance. The **error** $\mathbf{e} = \mathbf{x} - \mathbf{z}$ is how far the truth has wandered from the plan. The nominal state and the real input follow

$$
\mathbf{z}_{k+1} = \mathbf{A}\mathbf{z}_k + \mathbf{B}\mathbf{v}_k, \qquad
\mathbf{u}_k = \mathbf{v}_k + \mathbf{K}(\mathbf{x}_k - \mathbf{z}_k) .
$$

The optimizer chooses the **nominal input** sequence $\mathbf{v}$. The extra term $\mathbf{K}(\mathbf{x} - \mathbf{z})$ is the **ancillary controller**: a fixed gain matrix that pushes the truth back toward the plan. It does not appear in the optimization at all.

Subtract the nominal equation from the true one. The $\mathbf{B}\mathbf{v}_k$ terms cancel, and what is left is the error recursion

$$
\mathbf{e}_{k+1} = (\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{e}_k + \mathbf{w}_k = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k .
$$

$\mathbf{A}_K$ ("A sub K") is the closed-loop matrix. It is stable whenever $\mathbf{K}$ stabilizes the plant, so every old disturbance fades away. The error no longer piles up. It lives inside the set

$$
\mathbb{Z} = \bigoplus_{i=0}^{\infty}\mathbf{A}_K^{i}\,\mathbb{W},
$$

the Minkowski sum of infinitely many shrinking copies of $\mathbb{W}$ (the big $\bigoplus$ is to $\oplus$ what $\sum$ is to $+$). This is the **[[minimal robust positively invariant set|rpi-name]]** for the error dynamics: the smallest set with $\mathbf{A}_K\mathbb{Z} \oplus \mathbb{W} \subseteq \mathbb{Z}$. ($\subseteq$ reads "is contained in".)

Once $\mathbf{e}_0 \in \mathbb{Z}$, the error stays in $\mathbb{Z}$ for every allowed disturbance sequence, forever. That is the **tube**: the true state is guaranteed to lie in $\mathbf{z}_k \oplus \mathbb{Z}$, a fixed cross-section swept along the nominal path, like a hose wrapped around a wire.

::: note Why the error can never leave the tube
Suppose $\mathbf{e}_k$ is in $\mathbb{Z}$. Then $\mathbf{A}_K\mathbf{e}_k$ is in $\mathbf{A}_K\mathbb{Z}$, and adding any $\mathbf{w}_k \in \mathbb{W}$ lands in $\mathbf{A}_K\mathbb{Z} \oplus \mathbb{W}$.

Now write that set out using the definition of $\mathbb{Z}$:

$$
\mathbf{A}_K\mathbb{Z} \oplus \mathbb{W} = \mathbf{A}_K\mathbb{W} \oplus \mathbf{A}_K^2\mathbb{W} \oplus \cdots \oplus \mathbb{W} = \mathbb{Z}.
$$

Multiplying by $\mathbf{A}_K$ shifted every term up one power, and $\mathbb{W}$ filled the empty first slot. So $\mathbf{e}_{k+1} \in \mathbb{Z}$ too, and by the same step at every later time. It is also the *smallest* such set: starting from $\mathbf{e}_0 = \mathbf{0}$, the disturbances alone can reach every point of every partial sum, so any set that traps the error must contain all of them.
:::

### Leaving room for the tube

Now make the nominal plan leave room for the tube. **Tighten** the constraints by the tube's cross-section. The tool is the **[[Pontryagin difference|pontryagin-difference]]**:

$$
\mathbb{X} \ominus \mathbb{Z} = \{\mathbf{x} : \mathbf{x} \oplus \mathbb{Z} \subseteq \mathbb{X}\}.
$$

Read $\ominus$ as "shrunk by". It is every point where you can center a copy of $\mathbb{Z}$ and still have the whole copy inside $\mathbb{X}$. The nominal plan must obey

$$
\mathbf{z}_k \in \mathbb{X} \ominus \mathbb{Z}, \qquad \mathbf{v}_k \in \mathbb{U} \ominus \mathbf{K}\mathbb{Z} .
$$

Then, whatever the disturbance does inside the tube, the true state satisfies $\mathbb{X}$. And the true input — nominal plus ancillary correction — satisfies $\mathbb{U}$.

The problem solved online is now the *nominal* problem with tightened constraints. That is the same quadratic program as before, with different numbers on the right-hand side. Robustness costs nothing at runtime. It is all paid offline, in margin.

::: key Tube MPC
Plan a nominal trajectory, then wrap it with an ancillary feedback law that keeps the true state inside a robust invariant tube. Tighten the nominal constraints by the tube cross-section so the true trajectory is always feasible.
:::

::: example The tube for the proximity-ops axis
Use the same disturbance bound, $|d| \le 0.05\,\mathrm{m/s^2}$. For the ancillary gain take the LQR gain, $\mathbf{K} = [\,2.5857\ \ 3.4434\,]$. The eigenvalues of $\mathbf{A}_K$ are $0.8992$ and $0.7436$, both inside the unit circle, so the loop is stable.

Because $\mathbb{W}$ is a segment, each term $\mathbf{A}_K^i\mathbb{W}$ is also a segment. A Minkowski sum of segments is a **[[zonotope|zonotope-word]]**. Zonotopes have a handy property. How far one reaches in a direction $\mathbf{a}$ — its **support function** — is the sum $\sum_i |\mathbf{a}^\top\mathbf{A}_K^i\mathbf{g}|$, where $\mathbf{g} = \mathbf{B}\cdot 0.05$ is the segment's half-length vector, the **generator**. Take $\mathbf{a}$ along each axis in turn and add up:

| terms kept | $\max\lvert e_1\rvert$ | $\max\lvert e_2\rvert$ | $\max\lvert \mathbf{K}\mathbf{e}\rvert$ |
| --- | --- | --- | --- |
| $1$ | $0.250\,\mathrm{mm}$ | $5.00\,\mathrm{mm/s}$ | $0.0179\,\mathrm{m/s^2}$ |
| $5$ | $4.03\,\mathrm{mm}$ | $11.58\,\mathrm{mm/s}$ | $0.0503\,\mathrm{m/s^2}$ |
| $20$ | $15.76\,\mathrm{mm}$ | $19.42\,\mathrm{mm/s}$ | $0.0602\,\mathrm{m/s^2}$ |
| $60$ | $19.29\,\mathrm{mm}$ | $23.11\,\mathrm{mm/s}$ | $0.0638\,\mathrm{m/s^2}$ |
| all (the limit) | $19.34\,\mathrm{mm}$ | $23.17\,\mathrm{mm/s}$ | $0.0639\,\mathrm{m/s^2}$ |

The sum settles down because $\mathbf{A}_K^i$ shrinks by a factor of about $0.899$ every step. Keeping only sixty terms slightly *under*-states $\mathbb{Z}$ — each dropped term only adds. Everything past the sixtieth term adds at most $\sum_{i\ge 60}\|\mathbf{A}_K^i\mathbf{g}\| = 7.5\times10^{-5}$ in meters and meters per second — that is $0.075\,\mathrm{mm}$ or $0.075\,\mathrm{mm/s}$. So a safe tightening uses the limit row, not the sixty-term row.

Now compare with the open-loop table. At a two-second horizon the open-loop spread is $100\,\mathrm{mm}$ and $100\,\mathrm{mm/s}$. The tube is $19\,\mathrm{mm}$ and $23\,\mathrm{mm/s}$ — *and it does not grow*, however long the horizon. That bounded-versus-growing difference, not the factor of five, is why tube MPC is usable.

The tightened constraints come straight from the last row. The velocity limit was $|x_2| \le 0.5\,\mathrm{m/s}$ and the input limit $|u| \le 1\,\mathrm{m/s^2}$:

$$
|z_2| \le 0.5 - 0.0232 = 0.4768\,\mathrm{m/s}, \qquad
|v| \le 1 - 0.0639 = 0.9361\,\mathrm{m/s^2} .
$$

Both are a little under the original limits, as they should be. The ancillary controller is reserving $6.4\,\%$ of the thruster's authority to reject disturbances, and the nominal plan is not allowed to spend it. That reservation is the honest price of the guarantee. It belongs in the control-authority budget.
:::

::: example What robustness costs in region of attraction
Recompute the previous lesson's sets with the tightened bounds. The terminal set is now the maximal admissible set for $\mathbf{A}_K$ under $|v| \le 0.9361$ and $|z_2| \le 0.4768$. It still closes after four propagations and still has $12$ facets. Then run twenty steps of $\mathrm{Pre}$, the predecessor-set operation, to get the robust $\mathcal{X}_{20}$:

| set | nominal | robust (tightened) | loss |
| --- | --- | --- | --- |
| terminal set, area | $0.712\,\mathrm{m^2/s}$ | $0.637\,\mathrm{m^2/s}$ | $11\,\%$ |
| terminal set, reach at rest | $0.387\,\mathrm{m}$ | $0.362\,\mathrm{m}$ | $6\,\%$ |
| $\mathcal{X}_{20}$, area | $3.240\,\mathrm{m^2/s}$ | $2.940\,\mathrm{m^2/s}$ | $9\,\%$ |
| $\mathcal{X}_{20}$, reach at rest | $1.663\,\mathrm{m}$ | $1.583\,\mathrm{m}$ | $5\,\%$ |

So this much robustness costs about $9\,\%$ of the feasible area and $5\,\%$ of the reach. In return you get a guarantee that holds for every disturbance sequence inside the bound, instead of for none. Most reviewers take that trade gladly, and the numbers are what make it a trade rather than an argument.

Double the disturbance bound and the tube doubles, the tightening doubles, and the region shrinks further. At some disturbance level the tightened problem has no solution anywhere. That is the formulation telling you the vehicle does not have the control authority for the environment you specified.
:::

## What the tube guarantees, and what it does not

With these ingredients the results are clean.

- **Robust feasibility.** If the nominal problem is feasible at the first cycle and $\mathbf{e}_0 \in \mathbb{Z}$, it is feasible at every cycle, for every disturbance sequence in $\mathbb{W}$.
- **Robust constraint satisfaction.** The true state and the true input meet their original constraints at all times.
- **Convergence.** The nominal state goes to the origin. The true state goes to the set $\mathbb{Z}$ — *not* to the origin. No controller can reach the origin exactly against a disturbance that never stops.

That last point is the one to be careful with when discussing requirements. A tube controller does not give zero steady-state error. It gives a bounded error with a number attached: here $19\,\mathrm{mm}$ and $23\,\mathrm{mm/s}$. If the requirement is $10\,\mathrm{mm}$, you have three honest options:

1. a smaller disturbance bound (better thrusters, better modeling);
2. a more aggressive ancillary gain — a larger $\mathbf{K}$ shrinks $\mathbb{Z}$ but spends more authority, which is a real optimization;
3. a **disturbance estimator** that turns part of $\mathbb{W}$ into a known term the nominal plan can cancel.

::: warning An undersized disturbance set voids every guarantee
The tube guarantees hold only if $\mathbf{w}_k \in \mathbb{W}$ for every $k$, and you are the one who chooses $\mathbb{W}$. Two mistakes are common.

The first is sizing $\mathbb{W}$ from a covariance: taking a **[[three-sigma|three-sigma]]** value from a Monte Carlo campaign and calling it a bound. A Gaussian has no bound. The guarantee becomes "robust unless the disturbance is large", which is a different and much weaker statement. If that is what you want, **[[stochastic MPC|stochastic-mpc]]**, with explicit violation probabilities, is the honest formulation.

The second is forgetting a disturbance source. $\mathbb{W}$ has to cover all of these at once: linearization error, discretization error, actuator mismatch, unmodeled flexible-mode response and navigation error. Together they are usually several times the one everyone thinks of first. Good practice is to build $\mathbb{W}$ term by term, in a table with one line per source, and compare the total against the leftover errors seen in a high-fidelity simulation.
:::

::: note Where the ancillary loop lives in the architecture
The tube split is the formal version of something flight teams build anyway: a slow **outer loop** that plans, and a fast **inner loop** that tracks the plan. Seeing it as tube MPC turns that split from a habit into a calculation. The inner gain sets the tube cross-section. The cross-section sets the constraint tightening. The tightening sets the region of attraction. It also tells you where to spend effort: a faster inner loop shrinks the tube and buys back margin, while a faster outer loop does nothing for the tube at all.
:::

## Check yourself

::: check
Why does the error set $\mathbb{Z}$ not depend on the horizon $N$, while the open-loop spread does?
:::

::: answer
Because the two errors follow different dynamics. Without ancillary feedback the error moves as $\mathbf{e}_{k+1} = \mathbf{A}\mathbf{e}_k + \mathbf{w}_k$. For the double integrator, $\mathbf{A}$ has both eigenvalues at $1$, so nothing decays: contributions pile up, and the reachable set grows without limit as the steps go on.

With the ancillary law the error moves as $\mathbf{e}_{k+1} = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k$, with spectral radius (largest eigenvalue size) $\rho(\mathbf{A}_K) = 0.899$. Old disturbances shrink by a fixed factor each step, so the sum converges. $\mathbb{Z}$ is the limit of that convergent sum, a fixed set.

The deeper point: the prediction now includes the fact that a controller will be acting during the horizon. That is true, and open-loop min-max refuses to model it.
:::

::: check
The tube tightening reserves $6.4\,\%$ of the input authority. What happens to the tube and to the reserve if you double the ancillary gain?
:::

::: answer
A larger $\mathbf{K}$ makes $\mathbf{A}_K$ faster. The terms $\mathbf{A}_K^i\mathbb{W}$ decay more quickly, so the tube's cross-section in the state shrinks.

But the reserved input is $\mathbf{K}\mathbb{Z}$: a bigger gain times a smaller set. It does not shrink in proportion. Often it grows, because rejecting the same disturbance faster takes more force.

So the trade has a best point somewhere in the middle, and it is worth finding on purpose. Sweep the ancillary gain, compute $\mathbb{Z}$ and $\mathbf{K}\mathbb{Z}$ for each value, and pick the gain that meets the state-error requirement with the least reserved authority. Note too that the ancillary gain does not have to be the LQR gain used for the terminal cost. They do different jobs and are separate design choices.
:::

::: check
A rendezvous MPC uses a $\mathbb{W}$ built from a $3\sigma$ thruster dispersion. In a $10^5$-case campaign, two cases violate the keep-out constraint. Is the tube implementation wrong?
:::

::: answer
Not necessarily. More likely the guarantee being tested was never the one on offer.

A $3\sigma$ value is not a bound. For a Gaussian, about $0.3\,\%$ of samples fall outside $3\sigma$, per axis, per sample. A run has thousands of samples, so essentially every run contains some excursions. The tube theorem then says nothing, because its starting assumption is broken.

There are two consistent positions.

- Treat $\mathbb{W}$ as a hard bound and size it from physical limits: maximum thrust dispersion, maximum misalignment, the saturation levels of the unmodeled effects. Then the two violating cases point to a disturbance source missing from the derivation.
- Accept a probabilistic requirement and use a stochastic formulation. The constraint must hold with a stated probability, and the two cases are compared against that budget.

What is not defensible is quoting a deterministic robustness guarantee while sizing its central assumption from the tail of a distribution.
:::

::: check
Sketch how you would compute $\mathbb{X} \ominus \mathbb{Z}$ for the state constraint $\mathbf{G}_x\mathbf{x} \le \mathbf{h}_x$, given a way to evaluate the support function of $\mathbb{Z}$.
:::

::: answer
Row by row. Take one row, $\mathbf{g}^\top\mathbf{x} \le h$. It must hold for every $\mathbf{x} = \mathbf{z} + \mathbf{e}$ with $\mathbf{e} \in \mathbb{Z}$. The worst $\mathbf{e}$ is the one that makes $\mathbf{g}^\top\mathbf{e}$ largest, so the row is equivalent to

$$
\mathbf{g}^\top\mathbf{z} + \max_{\mathbf{e}\in\mathbb{Z}}\mathbf{g}^\top\mathbf{e} \le h, \quad\text{that is}\quad \mathbf{g}^\top\mathbf{z} \le h - h_{\mathbb{Z}}(\mathbf{g}),
$$

where $h_{\mathbb{Z}}$ is the support function of $\mathbb{Z}$ in the direction $\mathbf{g}$.

The tightened set has the same matrix $\mathbf{G}_x$ and a smaller right-hand side. That is why tightening changes nothing structural in the QP: same sparsity pattern, same solver, different numbers.

For the zonotope of the worked example, the support function is the sum $\sum_i|\mathbf{g}^\top\mathbf{A}_K^i\mathbf{g}_0|$ ($\mathbf{g}_0$ is the generator), so each tightening is a few dozen multiply-adds, computed once, offline. The input constraints tighten the same way using $\mathbf{K}\mathbb{Z}$. Its support in direction $\mathbf{a}$ is the support of $\mathbb{Z}$ in direction $\mathbf{K}^\top\mathbf{a}$.
:::

::: check
Your tube MPC is robustly feasible by construction. A reviewer asks what happens if the disturbance exceeds $\mathbb{W}$ once, by a factor of three, for one sample. What do you say?
:::

::: answer
That the guarantee is suspended and then restored, and that the size of the excursion can be computed.

One disturbance three times the bound puts the error outside $\mathbb{Z}$ — at worst somewhere in $\mathbf{A}_K\mathbb{Z} \oplus 3\mathbb{W}$. From there the error shrinks back toward $\mathbb{Z}$ at the rate of $\mathbf{A}_K$: a factor of $0.899$ per sample for this design. Shrinking by a factor of ten takes $\ln 10 / \ln(1/0.899) \approx 22$ samples, or $2.2\,\mathrm{s}$.

During that time the true state may break the tightened constraints. Whether that matters depends on the gap between the tightened constraint and the real physical limit.

The proper answer has two parts. Size $\mathbb{W}$ so that such an excursion is the rare event it should be. Then state the recovery behavior explicitly. That is what an **[[input-to-state stability|iss]]** argument gives: the error is bounded by a decaying function of the starting error plus a function of the disturbance size. So an oversized disturbance produces a proportionate, temporary excursion — not a loss of control.
:::

## Summary

| Object | Statement |
| --- | --- |
| Disturbed model | $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k + \mathbf{w}_k$, $\mathbf{w}_k \in \mathbb{W}$ bounded — a bound, not a covariance |
| Minkowski sum | $\mathbb{S} \oplus \mathbb{T}$: every sum of one point from each set |
| Open-loop spread | $\bigoplus_i\mathbf{A}^i\mathbb{W}$: $100\,\mathrm{mm}$ and $100\,\mathrm{mm/s}$ at $N = 20$, growing without limit |
| Open-loop min-max | One sequence for all disturbances; finite via vertex checks, crushingly conservative |
| Feedback min-max | Optimize over policies; scenario tree $v^N$ — $2^{20} = 1{,}048{,}576$ at $N = 20$ |
| Tube decomposition | $\mathbf{u} = \mathbf{v} + \mathbf{K}(\mathbf{x} - \mathbf{z})$, nominal $\mathbf{z}_{k+1} = \mathbf{A}\mathbf{z}_k + \mathbf{B}\mathbf{v}_k$ |
| Error dynamics | $\mathbf{e}_{k+1} = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k$, trapped in $\mathbb{Z} = \bigoplus_i\mathbf{A}_K^i\mathbb{W}$ |
| Computed tube | $\lvert e_1\rvert \le 19.3\,\mathrm{mm}$, $\lvert e_2\rvert \le 23.2\,\mathrm{mm/s}$, $\lvert \mathbf{K}\mathbf{e}\rvert \le 0.0639\,\mathrm{m/s^2}$ |
| Tightening | $\mathbf{z} \in \mathbb{X} \ominus \mathbb{Z}$, $\mathbf{v} \in \mathbb{U} \ominus \mathbf{K}\mathbb{Z}$: $\lvert z_2\rvert \le 0.4768$, $\lvert v\rvert \le 0.9361$ |
| Price | Terminal set area $0.637$ vs $0.712$; $\mathcal{X}_{20}$ reach $1.583\,\mathrm{m}$ vs $1.663\,\mathrm{m}$ |
| Guarantees | Robust feasibility and constraint satisfaction for every $\mathbf{w}$-sequence in $\mathbb{W}$; convergence to $\mathbb{Z}$, not to the origin |
| Runtime cost | None: the online problem is the nominal QP with tightened bounds |

The next lesson goes the other way. Instead of adding robustness to the online problem, it removes the online problem entirely, by solving the quadratic program offline for every state at once.

::: context gravity-gradient A torque from uneven gravity
Gravity gets weaker with distance from Earth. A long spacecraft has one end slightly closer to Earth than the other, so that end is pulled a little harder. The difference is tiny, but it makes a steady twisting push — a torque — that tries to line the long axis up with the direction to Earth. On a big station it is one of the main torques the attitude system fights. A simple model might leave it out, and then it shows up as a disturbance.
:::

::: context polytope-word Flat-sided shapes
A **polytope** is a shape with flat sides and straight edges: a polygon in 2D (triangle, hexagon), a polyhedron in 3D (a box, a pyramid), and the same idea in more dimensions. Controllers like them because each flat side is one linear inequality, $\mathbf{a}^\top\mathbf{x} \le b$. A whole polytope is a list of such inequalities — exactly the kind of constraint a quadratic program can handle.
:::

::: context minkowski-sum Painting with a shape
To add two sets, slide one over every point of the other and paint everything it covers. A square plus a line segment becomes a hexagon: the square stretched along the segment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="50" width="60" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">square S</text>
  <text x="100" y="86" font-size="20" text-anchor="middle" fill="#1f2a44">⊕</text>
  <line x1="120" y1="95" x2="160" y2="65" stroke="#b4232c" stroke-width="3"/>
  <text x="140" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">segment T</text>
  <text x="185" y="86" font-size="20" text-anchor="middle" fill="#1f2a44">=</text>
  <polygon points="210,60 250,30 310,30 310,90 270,120 210,120" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="60" width="60" height="60" fill="none" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="250" y="30" width="60" height="60" fill="none" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="262" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">S ⊕ T, a hexagon</text>
</svg>
```

The dashed squares are the square placed at the two ends of the segment. In this lesson the "square" is the set of errors so far and the "segment" is the next disturbance.
:::

::: context scenario-tree Every branch the future could take
Each step, the disturbance might sit at either end of its segment, so the future splits in two. After three steps there are $2^3 = 8$ histories; after twenty, over a million. A feedback min-max policy must name an input at every fork.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="80" x2="120" y2="40"/><line x1="30" y1="80" x2="120" y2="120"/>
    <line x1="120" y1="40" x2="210" y2="20"/><line x1="120" y1="40" x2="210" y2="60"/>
    <line x1="120" y1="120" x2="210" y2="100"/><line x1="120" y1="120" x2="210" y2="140"/>
    <line x1="210" y1="20" x2="300" y2="12"/><line x1="210" y1="20" x2="300" y2="28"/>
    <line x1="210" y1="60" x2="300" y2="52"/><line x1="210" y1="60" x2="300" y2="68"/>
    <line x1="210" y1="100" x2="300" y2="92"/><line x1="210" y1="100" x2="300" y2="108"/>
    <line x1="210" y1="140" x2="300" y2="132"/><line x1="210" y1="140" x2="300" y2="148"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="30" cy="80" r="4"/><circle cx="120" cy="40" r="4"/><circle cx="120" cy="120" r="4"/>
    <circle cx="210" cy="20" r="4"/><circle cx="210" cy="60" r="4"/><circle cx="210" cy="100" r="4"/><circle cx="210" cy="140" r="4"/>
  </g>
  <text x="30" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">now</text>
  <text x="330" y="84" font-size="12" text-anchor="middle" fill="#b4232c">8 leaves</text>
</svg>
```

That doubling at each level is why exact feedback min-max is used for analysis, not onboard.
:::

::: context affine-disturbance-feedback A policy with a simple shape
Instead of allowing *any* rule from disturbance history to input, affine disturbance feedback allows only this kind: each future input is a fixed number plus a weighted sum of the disturbances already seen. The weights become decision variables. That is a much smaller menu than "any policy", but it keeps the problem convex. Löfberg, and Goulart, Kerrigan and Maciejowski, studied this parameterization in the 2000s and showed it is equivalent to optimizing over affine state feedback.
:::

::: context rpi-name Reading a long name
Take it one word at a time. **Invariant**: once inside, you stay inside. **Positively**: forward in time (the future, not the past). **Robust**: no matter which allowed disturbance happens. **Minimal**: the smallest such set — any smaller one, and some disturbance sequence could push you out. So the name is a complete description: the tightest trap for the error that no allowed disturbance can escape.
:::

::: context pontryagin-difference Shrinking a room by your own size
Picture pushing a sofa around a room. The points where the *center* of the sofa can go form a smaller room: the walls moved in by half the sofa's width. That smaller room is the Pontryagin difference. The name honors the Soviet mathematician Lev Pontryagin, who used it in the theory of pursuit games; image processing calls the same operation "erosion".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="280" height="110" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="60" y="35" width="240" height="80" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <rect x="40" y="20" width="40" height="30" fill="#f2b880" fill-opacity="0.8" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="60" cy="35" r="3" fill="#b4232c"/>
  <text x="180" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">X ⊖ Z: where the plan may go</text>
  <text x="180" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">outer box: the real limit X</text>
  <text x="100" y="42" font-size="11" fill="#1f2a44">tube Z at a corner</text>
</svg>
```

With the tube's center on the edge of the blue region, the whole tube still just fits inside the real limits.
:::

::: context zonotope-word Zonotopes
A **zonotope** is what you get by adding up line segments with the Minkowski sum. One segment is a segment. Two segments in different directions make a parallelogram. Three make a hexagon, and so on — always a shape that is symmetric about its center. They are popular in robust control because they are cheap to store (a center plus a list of generators) and their support function is a plain sum of absolute values.
:::

::: context three-sigma What three-sigma leaves out
For a normal (bell-curve) distribution with standard deviation $\sigma$, about $99.73\,\%$ of samples fall within $\pm 3\sigma$ of the mean, so about $0.27\,\%$ fall outside. That sounds rare. But a controller running at $10\,\mathrm{Hz}$ draws $36{,}000$ samples an hour, so it should expect roughly a hundred excursions past $3\sigma$ per axis every hour. A "three-sigma bound" is a statement about how often, not a wall.
:::

::: context stochastic-mpc Chance constraints
Stochastic MPC replaces "the constraint holds for every disturbance" with "the constraint holds with probability at least $1 - \epsilon$", say $99.9\,\%$. These are called **chance constraints**. They allow a smaller margin than a hard worst-case bound, and they match how many requirements are actually written. The price is a guarantee about frequency, not certainty — which is fine as long as everyone knows which one they are getting.
:::

::: context iss Input-to-state stability
Input-to-state stability, introduced by Eduardo Sontag in 1989, is a way of saying "small pushes cause small wobbles". A system is ISS if the size of its state is always below a term that fades with time from the starting point plus a term that grows with the biggest disturbance seen. It is the nonlinear-control cousin of a finite gain, and it is the natural language for "what happens when the bound is broken".
:::
