---
id: l07-robust-mpc-tubes-and-min-max
title: Robust MPC, tubes and min-max
minutes: 22
covers:
  - 'Robust MPC: tube MPC and min-max formulations'
---

Every guarantee so far has been nominal. The stability proof assumed the vehicle arrives at the state the model predicted; recursive feasibility assumed the same. A vehicle does not. Thrusters deliver a few percent off their commanded value, plume impingement pushes on a solar array, the gravity gradient is a torque the model may not carry, the atmosphere is not the atmosphere in the table, and the navigation filter hands over an estimate rather than the truth.

Robust MPC restores the guarantees in the presence of a *bounded* disturbance. The two main families are min-max — optimise against the worst disturbance sequence — and tube MPC, which separates the problem into a nominal plan and a feedback law that keeps the truth near the plan. Tube MPC is the one that flies, and the reason is the subject of this lesson: without feedback inside the prediction, uncertainty compounds over the horizon until the formulation strangles itself.

The setup throughout is

$$
\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k + \mathbf{w}_k, \qquad \mathbf{w}_k \in \mathbb{W},
$$

with $\mathbb{W}$ a known, bounded, convex set containing the origin — typically a polytope, so that everything stays polyhedral. $\mathbb{W}$ is a *bound*, not a distribution: the guarantees hold for every disturbance sequence inside it and say nothing about one outside it.

## Uncertainty compounds

Start by seeing why a plan made once cannot stay accurate. With no feedback, the deviation between the true state and the nominal plan after $k$ steps is $\mathbf{e}_k = \sum_{i=0}^{k-1}\mathbf{A}^{i}\mathbf{w}_{k-1-i}$, whose reachable set is the Minkowski sum $\mathbb{W} \oplus \mathbf{A}\mathbb{W} \oplus \cdots \oplus \mathbf{A}^{k-1}\mathbb{W}$ — and if $\mathbf{A}$ is not stable, the terms do not shrink.

::: example How far the truth drifts from an open-loop plan
Take the running vehicle with an unmodelled acceleration bounded by $|d| \le 0.05\,\mathrm{m/s^2}$, so $\mathbb{W} = \{\mathbf{B}d : |d| \le 0.05\}$ — a segment with endpoints $\pm(0.25\,\mathrm{mm},\ 5\,\mathrm{mm/s})$. Propagating it through the open-loop dynamics:

| steps | horizon (s) | worst-case $\lvert e_1\rvert$ | worst-case $\lvert e_2\rvert$ |
| --- | --- | --- | --- |
| $5$ | $0.5$ | $6.3\,\mathrm{mm}$ | $25\,\mathrm{mm/s}$ |
| $10$ | $1.0$ | $25\,\mathrm{mm}$ | $50\,\mathrm{mm/s}$ |
| $20$ | $2.0$ | $100\,\mathrm{mm}$ | $100\,\mathrm{mm/s}$ |
| $40$ | $4.0$ | $400\,\mathrm{mm}$ | $200\,\mathrm{mm/s}$ |

The velocity error grows linearly and the position error quadratically, because the double integrator integrates the disturbance twice and nothing pulls it back. By the end of a four-second horizon the worst case is $0.4\,\mathrm{m}$ — a fifth of the $2\,\mathrm{m}$ manoeuvre the earlier lessons flew. A formulation that has to satisfy every constraint for every disturbance sequence would have to give away that much margin at the end of the horizon, and would be infeasible from most useful states.

The flaw is not the disturbance, it is the assumption that no one will react to it. The real vehicle re-solves every $0.1\,\mathrm{s}$; the prediction should say so.
:::

## Min-max MPC

The direct formulation optimises against the worst case:

$$
\min_{\mathbf{U}}\ \max_{\mathbf{w}_0,\dots,\mathbf{w}_{N-1} \in \mathbb{W}}\ \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)
\quad\text{s.t. constraints for every } \mathbf{w}\text{-sequence}.
$$

In **open-loop min-max**, $\mathbf{U}$ is a single sequence that must work for every disturbance realisation. Constraint satisfaction for all $\mathbf{w}$ in a polytope reduces to satisfaction at its vertices, so the constraints stay finite in number — but the spread in the table above is exactly what they must absorb, and the result is crushingly conservative for any horizon worth having.

In **feedback min-max**, the decision variable is a *policy*: a control action for each possible disturbance history. That removes the conservatism, and it removes the tractability with it. With $v$ vertices of $\mathbb{W}$, the scenario tree has $v^N$ leaves: with the two-vertex $\mathbb{W}$ above, $2^5 = 32$ sequences at $N = 5$, $2^{10} = 1024$ at $N = 10$, and $2^{20} = 1{,}048{,}576$ at $N = 20$. Exact dynamic-programming solutions exist for small problems and produce a piecewise-affine law, and various restricted policy classes — affine disturbance feedback is the best known — recover a convex problem of moderate size. They are valuable analysis tools. They are not what a flight computer runs at $10\,\mathrm{Hz}$.

## Tube MPC

Tube MPC gets the benefit of feedback-in-the-prediction at almost no cost, by fixing the feedback law in advance instead of optimising over it.

Split the true state into a **nominal state** $\mathbf{z}$, propagated with no disturbance, and an **error** $\mathbf{e} = \mathbf{x} - \mathbf{z}$:

$$
\mathbf{z}_{k+1} = \mathbf{A}\mathbf{z}_k + \mathbf{B}\mathbf{v}_k, \qquad
\mathbf{u}_k = \mathbf{v}_k + \mathbf{K}(\mathbf{x}_k - \mathbf{z}_k) .
$$

The optimiser chooses the nominal input sequence $\mathbf{v}$; the term $\mathbf{K}(\mathbf{x} - \mathbf{z})$ is the **ancillary controller**, a fixed gain that does not appear in the optimisation at all. Subtracting the two dynamics gives the error recursion

$$
\mathbf{e}_{k+1} = (\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{e}_k + \mathbf{w}_k = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k ,
$$

which is stable when $\mathbf{K}$ stabilises the plant. The error therefore does not accumulate: it lives in the set

$$
\mathbb{Z} = \bigoplus_{i=0}^{\infty}\mathbf{A}_K^{i}\,\mathbb{W},
$$

the **minimal robust positively invariant set** for the error dynamics — the smallest set satisfying $\mathbf{A}_K\mathbb{Z} \oplus \mathbb{W} \subseteq \mathbb{Z}$. Once $\mathbf{e}_0 \in \mathbb{Z}$, the error stays in $\mathbb{Z}$ for every admissible disturbance sequence, forever. That is the tube: the true state is guaranteed to lie in $\mathbf{z}_k \oplus \mathbb{Z}$, a fixed cross-section swept along the nominal trajectory.

What remains is to make the nominal plan leave room for the tube. **Tighten** the constraints by the tube cross-section, using the Pontryagin difference $\mathbb{X} \ominus \mathbb{Z} = \{\mathbf{x} : \mathbf{x} \oplus \mathbb{Z} \subseteq \mathbb{X}\}$:

$$
\mathbf{z}_k \in \mathbb{X} \ominus \mathbb{Z}, \qquad \mathbf{v}_k \in \mathbb{U} \ominus \mathbf{K}\mathbb{Z} ,
$$

so that whatever the disturbance does inside the tube, the true state satisfies $\mathbb{X}$ and the true input — nominal plus ancillary correction — satisfies $\mathbb{U}$. The MPC problem solved online is then the *nominal* problem with tightened constraints, which is the same quadratic program as before with different bounds. Robustness costs nothing at runtime; it is all paid offline, in margin.

::: key Tube MPC
Plan a nominal trajectory, then wrap it with an ancillary feedback law that keeps the true state inside a robust invariant tube. Tighten the nominal constraints by the tube cross-section so the true trajectory is always feasible.
:::

::: example The tube for the proximity-ops axis
Same disturbance bound $|d| \le 0.05\,\mathrm{m/s^2}$, ancillary gain the LQR gain $\mathbf{K} = [\,2.5857\ \ 3.4434\,]$, with $\mathbf{A}_K$ eigenvalues $0.8992$ and $0.7436$. Because $\mathbb{W}$ is a segment, each term $\mathbf{A}_K^i\mathbb{W}$ is a segment and the sum is a zonotope, whose support function in any direction $\mathbf{a}$ is $\sum_i |\mathbf{a}^\top\mathbf{A}_K^i\mathbf{g}|$ with $\mathbf{g}$ the generator. Summing:

| terms kept | $\max\lvert e_1\rvert$ | $\max\lvert e_2\rvert$ | $\max\lvert \mathbf{K}\mathbf{e}\rvert$ |
| --- | --- | --- | --- |
| $1$ | $0.250\,\mathrm{mm}$ | $5.00\,\mathrm{mm/s}$ | $0.0179\,\mathrm{m/s^2}$ |
| $5$ | $4.03\,\mathrm{mm}$ | $11.58\,\mathrm{mm/s}$ | $0.0503\,\mathrm{m/s^2}$ |
| $20$ | $15.76\,\mathrm{mm}$ | $19.42\,\mathrm{mm/s}$ | $0.0602\,\mathrm{m/s^2}$ |
| $60$ | $19.29\,\mathrm{mm}$ | $23.11\,\mathrm{mm/s}$ | $0.0638\,\mathrm{m/s^2}$ |

The sum converges because $\mathbf{A}_K^i$ decays at $0.899$ per step; everything past the sixtieth term is bounded by $\sum_{i\ge 60}\|\mathbf{A}_K^i\mathbf{g}\| = 7.5\times10^{-5}$, so the sixty-term zonotope is an outer bound on $\mathbb{Z}$ to within $0.075\,\mathrm{mm}$. Compare the numbers with the open-loop table: at a two-second horizon the open-loop spread is $100\,\mathrm{mm}$ and $100\,\mathrm{mm/s}$, while the tube is $19\,\mathrm{mm}$ and $23\,\mathrm{mm/s}$ *and does not grow* however long the horizon is. That bounded-versus-growing distinction, not the factor of five, is why tube MPC is usable.

The tightened constraints follow directly:

$$
|z_2| \le 0.5 - 0.0231 = 0.4769\,\mathrm{m/s}, \qquad
|v| \le 1 - 0.0638 = 0.9362\,\mathrm{m/s^2} .
$$

The ancillary controller is reserving $6.4\,\%$ of the thruster's authority to reject disturbances, and the nominal plan is not allowed to spend it. That reservation is the honest price of the guarantee, and it is the number to put in a control-authority budget.
:::

::: example What robustness costs in region of attraction
Recompute the previous lesson's sets with the tightened bounds. The terminal set — now the maximal admissible set for $\mathbf{A}_K$ under $|v| \le 0.9362$ and $|z_2| \le 0.4769$ — still closes after four propagations and still has $12$ facets, with area $0.637\,\mathrm{m^2/s}$ against $0.712$ nominal and a reach at rest of $0.362\,\mathrm{m}$ against $0.387$. Propagating twenty steps of $\mathrm{Pre}$ gives a robust $\mathcal{X}_{20}$ of area $2.941\,\mathrm{m^2/s}$ against $3.240$, reaching $1.583\,\mathrm{m}$ at rest against $1.663$.

So this level of robustness costs about $9\,\%$ of the feasible area and $5\,\%$ of the reach, and buys a guarantee that holds for every disturbance sequence inside the bound rather than for none. That is a trade most reviewers take without hesitation — and the numbers are what makes it a trade rather than an argument. Double the disturbance bound and the tube doubles, the tightening doubles, and the region shrinks further; at some disturbance level the tightened problem becomes infeasible everywhere, which is the formulation telling you the vehicle does not have the control authority for the environment you specified.
:::

## What the tube guarantees, and what it does not

With the ingredients above, the results are clean. **Robust feasibility**: if the nominal problem is feasible at the first cycle and $\mathbf{e}_0 \in \mathbb{Z}$, it is feasible at every cycle, for every disturbance sequence in $\mathbb{W}$. **Robust constraint satisfaction**: the true state and true input satisfy their original constraints at all times. **Convergence**: the nominal state converges to the origin and the true state converges to the set $\mathbb{Z}$ — not to the origin, which no controller can achieve against a persistent disturbance.

That last point is the one to be careful with in a requirements discussion. A tube controller does not deliver zero steady-state error; it delivers a bounded error with a number attached, here $19\,\mathrm{mm}$ and $23\,\mathrm{mm/s}$. If the requirement is $10\,\mathrm{mm}$, the answers are a smaller disturbance bound, a more aggressive ancillary gain (a larger $\mathbf{K}$ shrinks $\mathbb{Z}$ but spends more authority, which is a genuine optimisation), or a disturbance estimator that turns part of $\mathbb{W}$ into a known term the nominal plan can cancel.

::: warning An undersized disturbance set voids every guarantee
The tube guarantees are conditional on $\mathbf{w}_k \in \mathbb{W}$ for all $k$, and $\mathbb{W}$ is chosen by you. Two mistakes are common. The first is sizing $\mathbb{W}$ from a covariance — taking a three-sigma value from a Monte-Carlo campaign and calling it a bound. A Gaussian has no bound, so the guarantee becomes "robust unless the disturbance is large", which is a different and much weaker statement; if that is what you want, stochastic MPC with explicit violation probabilities is the honest formulation. The second is forgetting a disturbance source: $\mathbb{W}$ has to cover linearisation error, discretisation error, actuator mismatch, unmodelled flexible-mode response and the navigation error at once, and the union of those is usually several times the one everyone thinks of first. A sound practice is to derive $\mathbb{W}$ term by term, in a table with a line per source, and to compare the total against the residuals observed in a high-fidelity simulation.
:::

::: note Where the ancillary loop lives in the architecture
The tube decomposition is the formal version of an architecture that flight teams build anyway: a slow outer loop that plans and a fast inner loop that tracks the plan. Recognising it as tube MPC turns the split from a convention into a calculation — the inner gain sets the tube cross-section, the cross-section sets the constraint tightening, and the tightening sets the region of attraction. It also says where to spend effort: making the inner loop faster shrinks the tube and buys back margin, whereas making the outer loop faster does nothing for the tube at all.
:::

## Check yourself

::: check
Why does the error set $\mathbb{Z}$ not depend on the horizon $N$, while the open-loop spread does?
:::

::: answer
Because the two recursions have different dynamics. Without ancillary feedback the error propagates as $\mathbf{e}_{k+1} = \mathbf{A}\mathbf{e}_k + \mathbf{w}_k$, and for the double integrator $\mathbf{A}$ has both eigenvalues at $1$, so contributions accumulate and the reachable set grows without bound with the number of steps. With the ancillary law the error propagates as $\mathbf{e}_{k+1} = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k$ with $\rho(\mathbf{A}_K) = 0.899$, so old disturbances decay geometrically and the sum converges. $\mathbb{Z}$ is the limit of that convergent sum, a fixed set. The deeper point is that the prediction now includes the fact that a controller will be acting during the horizon, which is true and which open-loop min-max declines to model.
:::

::: check
The tube tightening reserves $6.4\,\%$ of the input authority. What happens to the tube and to the reserve if you double the ancillary gain?
:::

::: answer
A larger $\mathbf{K}$ makes $\mathbf{A}_K$ faster, so the terms $\mathbf{A}_K^i\mathbb{W}$ decay more quickly and the tube cross-section in the state shrinks. But the reserved input is $\mathbf{K}\mathbb{Z}$, the product of a bigger gain with a smaller set, and it does not shrink proportionally — it commonly grows, because rejecting the same disturbance faster takes more force. The trade has an interior optimum, and it is worth solving explicitly: sweep the ancillary gain, compute $\mathbb{Z}$ and $\mathbf{K}\mathbb{Z}$ for each, and choose the gain that meets the state-error requirement with the least reserved authority. Note also that the ancillary gain need not be the LQR gain used for the terminal cost; they serve different purposes and are separate design freedoms.
:::

::: check
A rendezvous MPC uses a $\mathbb{W}$ derived from a $3\sigma$ thruster dispersion. In a $10^5$-case campaign, two cases violate the keep-out constraint. Is the tube implementation wrong?
:::

::: answer
Not necessarily — more likely the guarantee was never the one being tested. A $3\sigma$ value is not a bound: for a Gaussian, about $0.3\,\%$ of samples fall outside $3\sigma$ per axis per sample, and with thousands of samples per run essentially every run contains excursions. The tube theorem then says nothing, because its hypothesis is violated. Two consistent positions exist. Either treat $\mathbb{W}$ as a hard bound and size it from physical limits — maximum thrust dispersion, maximum misalignment, saturation of the unmodelled effects — in which case the two violating cases indicate a source missing from the derivation. Or accept a probabilistic specification and use a stochastic formulation, where the constraint is required to hold with a stated probability and the two cases are compared against the budget. What is not defensible is quoting a deterministic robustness guarantee while sizing its central assumption from a distribution's tail.
:::

::: check
Sketch how you would compute $\mathbb{X} \ominus \mathbb{Z}$ for the state constraint $\mathbf{G}_x\mathbf{x} \le \mathbf{h}_x$, given a way to evaluate the support function of $\mathbb{Z}$.
:::

::: answer
Row by row. The constraint $\mathbf{g}^\top\mathbf{x} \le h$ must hold for every $\mathbf{x} = \mathbf{z} + \mathbf{e}$ with $\mathbf{e} \in \mathbb{Z}$, so it is equivalent to $\mathbf{g}^\top\mathbf{z} + \max_{\mathbf{e}\in\mathbb{Z}}\mathbf{g}^\top\mathbf{e} \le h$, that is $\mathbf{g}^\top\mathbf{z} \le h - h_{\mathbb{Z}}(\mathbf{g})$ where $h_{\mathbb{Z}}$ is the support function of $\mathbb{Z}$ in the direction $\mathbf{g}$. The tightened set has the same matrix $\mathbf{G}_x$ and a reduced right-hand side, which is why tightening changes nothing structural in the QP — the same sparsity pattern, the same solver, different numbers. For the zonotope of the worked example the support function is the sum $\sum_i|\mathbf{g}^\top\mathbf{A}_K^i\mathbf{g}_0|$, so each tightening is a few dozen multiply-adds computed once, offline. The input constraints tighten the same way with $\mathbf{K}\mathbb{Z}$, whose support in direction $\mathbf{a}$ is the support of $\mathbb{Z}$ in direction $\mathbf{K}^\top\mathbf{a}$.
:::

::: check
Your tube MPC is robustly feasible by construction, and a reviewer asks what happens if the disturbance exceeds $\mathbb{W}$ once, by a factor of three, for one sample. What do you say?
:::

::: answer
That the guarantee is suspended and then restored, and that the size of the excursion is computable. A single disturbance three times the bound puts the error outside $\mathbb{Z}$ — at worst at $\mathbf{A}_K\mathbb{Z} \oplus 3\mathbb{W}$ — and from there the error contracts back toward $\mathbb{Z}$ at the rate of $\mathbf{A}_K$, which for this design means a factor of $0.899$ per sample, so roughly $22$ samples, or $2.2\,\mathrm{s}$, to recover a factor of ten. During that interval the tightened constraints may be violated by the true state, and whether that matters depends on the margin between the tightened constraint and the real physical limit. The way to answer the question properly is to size $\mathbb{W}$ so that the excursion is the rare event it should be, and then to state the recovery behaviour explicitly — that is what an input-to-state stability argument gives: the error is bounded by a decaying function of the initial error plus a function of the disturbance magnitude, so an over-size disturbance produces a proportionate, temporary excursion rather than a loss of control.
:::

## Summary

| Object | Statement |
| --- | --- |
| Disturbed model | $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k + \mathbf{w}_k$, $\mathbf{w}_k \in \mathbb{W}$ bounded, a bound and not a covariance |
| Open-loop spread | $\bigoplus_i\mathbf{A}^i\mathbb{W}$: $100\,\mathrm{mm}$ and $100\,\mathrm{mm/s}$ at $N = 20$, growing without bound |
| Open-loop min-max | One sequence for all disturbances; finite via vertex enumeration, crushingly conservative |
| Feedback min-max | Optimise over policies; scenario tree $v^N$ — $2^{20} = 1{,}048{,}576$ at $N = 20$ |
| Tube decomposition | $\mathbf{u} = \mathbf{v} + \mathbf{K}(\mathbf{x} - \mathbf{z})$, nominal $\mathbf{z}_{k+1} = \mathbf{A}\mathbf{z}_k + \mathbf{B}\mathbf{v}_k$ |
| Error dynamics | $\mathbf{e}_{k+1} = \mathbf{A}_K\mathbf{e}_k + \mathbf{w}_k$, bounded in $\mathbb{Z} = \bigoplus_i\mathbf{A}_K^i\mathbb{W}$ |
| Computed tube | $\lvert e_1\rvert \le 19.3\,\mathrm{mm}$, $\lvert e_2\rvert \le 23.1\,\mathrm{mm/s}$, $\lvert \mathbf{K}\mathbf{e}\rvert \le 0.0638\,\mathrm{m/s^2}$ |
| Tightening | $\mathbf{z} \in \mathbb{X} \ominus \mathbb{Z}$, $\mathbf{v} \in \mathbb{U} \ominus \mathbf{K}\mathbb{Z}$: $\lvert z_2\rvert \le 0.4769$, $\lvert v\rvert \le 0.9362$ |
| Price | Terminal set area $0.637$ vs $0.712$; $\mathcal{X}_{20}$ reach $1.583\,\mathrm{m}$ vs $1.663\,\mathrm{m}$ |
| Guarantees | Robust feasibility and constraint satisfaction for every $\mathbf{w}$-sequence in $\mathbb{W}$; convergence to $\mathbb{Z}$, not to the origin |
| Runtime cost | None: the online problem is the nominal QP with tightened bounds |

The next lesson goes the other way — instead of adding robustness to the online problem, it removes the online problem entirely, by solving the quadratic program offline for every state at once.
