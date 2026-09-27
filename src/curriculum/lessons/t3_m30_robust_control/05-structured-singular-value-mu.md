---
id: l05-structured-singular-value-mu
title: The structured singular value and D-K iteration
minutes: 20
covers:
  - The structured singular value mu and mu-synthesis by D-K iteration
---

Suppose you are testing a bike lock with three dials. A worried friend says: "A thief could have *any* tool at all — a saw, a magnet, a key copied from yours." That is a much scarier question than the real one. The real question is: "Can someone turning these three dials, each on its own, open it?" Ask the scary question and the lock always looks weak. Ask the right one and you might find it is fine.

The small gain theorem asked the scary question. It asked whether *any* norm-bounded perturbation can destabilise the loop. What you wanted to know was whether any perturbation *your hardware can actually produce* can destabilise the loop. The two questions have the same answer only when the uncertainty is one single full complex block. As soon as the description is three independent actuator scale factors, or one real parameter that appears in four places, or an error at the input plus a separate error at the output, the theorem answers something harder than you asked. Its verdict comes back too gloomy.

The **structured singular value**, written $\mu$ (the Greek letter "mu"), is the fix. It is defined as the answer to the right question: how small can an *allowed* perturbation be and still destabilise the loop? Take one over that size and you get a number that plays the role $\bar{\sigma}$ played in the small gain test, with the same "peak below one" pass mark, but without the needless gloom. The price is that $\mu$ is [[NP-hard|np-hard]] to compute, so in practice you compute an upper and a lower bound and report both.

This lesson defines $\mu$, works out the special cases where it becomes something familiar, derives the scaling bound every tool uses, and describes D-K iteration — the back-and-forth procedure that turns $\mu$ from a test into a design method.

## The definition

First fix the **block structure**: the pattern your uncertainty is allowed to have. Think of it as a mostly empty grid. Each uncertain piece of hardware gets its own square on the diagonal. Every square off the diagonal is forced to be zero, because one actuator's error does not reach inside another actuator. That picture is the [[structure|block-structure]].

In symbols, the allowed set $\boldsymbol{\Delta}$ is all block-diagonal matrices of a given pattern, for example $\operatorname{diag}(\delta_1\mathbf{I}_{r_1}, \dots, \delta_S\mathbf{I}_{r_S}, \boldsymbol{\Delta}_1, \dots, \boldsymbol{\Delta}_F)$. There are $S$ **repeated scalar blocks** — one number $\delta_i$ ("delta i") copied down a stretch of the diagonal — and $F$ **full blocks** $\boldsymbol{\Delta}_j$, each a whole unknown matrix. The scalars may be complex, or real, which is harder.

::: key Structured singular value
For a complex matrix $\mathbf{M}$ and a block structure $\boldsymbol{\Delta}$,

$$\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \frac{1}{\min\{\bar{\sigma}(\boldsymbol{\Delta}) : \boldsymbol{\Delta}\in\boldsymbol{\Delta},\ \det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 0\}},$$

and $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = 0$ if no allowed $\boldsymbol{\Delta}$ makes $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ singular. Robust stability of the $\mathbf{M}$–$\boldsymbol{\Delta}$ loop against the normalised set $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ holds if and only if $\sup_\omega\mu_{\boldsymbol{\Delta}}(\mathbf{M}(j\omega)) < 1$ — the peak of $\mu$ over frequency is below one. Computing $\mu$ exactly is NP-hard; tools give upper and lower bounds.
:::

Read it from the inside out.

- $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 0$ ("the determinant of I minus M Delta is zero") is exactly the condition for the closed loop to have a pole at that frequency. The [[determinant becomes zero|singular-means-pole]] when a signal can travel round the loop and come back exactly as big as it started.
- So the bottom of the fraction is the size of the smallest *allowed* perturbation that destabilises the loop.
- $\mu$ is one over that size.

So $\mu = 2$ means a perturbation of size $0.5$ is enough to destabilise. $\mu = 0.4$ means you survive perturbations two and a half times larger than modelled. The number $1/\sup_\omega\mu$ is the **robustness margin**, in the same units the uncertainty weight was written in. That is what a $\mu$ analysis is really reporting.

Three properties follow at once.

- $\mu$ scales: $\mu(\alpha\mathbf{M}) = \lvert\alpha\rvert\,\mu(\mathbf{M})$ for any number $\alpha$ ("alpha"). Double the uncertainty weight and $\mu$ doubles. That is what makes "peak below one" a meaningful pass mark.
- It is not a norm: the triangle inequality ($\mu(\mathbf{A} + \mathbf{B}) \le \mu(\mathbf{A}) + \mu(\mathbf{B})$) can fail.
- It depends on the structure as much as on the matrix. A $\mu$ quoted without its block structure is meaningless.

## Special cases and bounds

Two extreme structures pin $\mu$ down.

**One full complex block.** If every complex matrix of the right size is allowed, the smallest destabilising perturbation has size $1/\bar{\sigma}(\mathbf{M})$, by the singular-vector construction of the small gain lesson. So $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \bar{\sigma}(\mathbf{M})$, and $\mu$ analysis becomes exactly the small gain test.

**One repeated complex scalar**, $\boldsymbol{\Delta} = \delta\mathbf{I}$. Now $\det(\mathbf{I} - \delta\mathbf{M}) = 0$ needs $1/\delta$ to be an eigenvalue of $\mathbf{M}$. The smallest $\lvert\delta\rvert$ is then $1/\rho(\mathbf{M})$, where $\rho$ ("rho") is the **spectral radius** — the largest eigenvalue magnitude. So $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \rho(\mathbf{M})$.

Every other structure sits between these two. Allowing more perturbations can only make the smallest destabilising one smaller, so $\mu$ can only grow as the allowed set grows:

$$\rho(\mathbf{M})\ \le\ \mu_{\boldsymbol{\Delta}}(\mathbf{M})\ \le\ \bar{\sigma}(\mathbf{M}).$$

Both inequalities can be arbitrarily loose, so neither replaces $\mu$. What tightens them is using changes that leave $\mu$ alone. Take two families of matrices that fit the structure:

- unitary matrices $\mathbf{U}$ (pure rotations, which change no sizes) with the same block pattern;
- invertible **scaling matrices** $\mathbf{D}$ that are a plain number times the identity where $\boldsymbol{\Delta}$ has a full block, and may be a full matrix where $\boldsymbol{\Delta}$ has a repeated scalar.

These are chosen so that $\mathbf{U}\boldsymbol{\Delta}$ is still allowed and $\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1} = \boldsymbol{\Delta}$. That gives a tighter sandwich:

$$\max_{\mathbf{U}}\ \rho(\mathbf{U}\mathbf{M})\ \le\ \mu_{\boldsymbol{\Delta}}(\mathbf{M})\ \le\ \inf_{\mathbf{D}}\ \bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1}).$$

In fact the left side is *equal* to $\mu$ for complex structures, but that maximisation is bumpy, with many false peaks, so a search can get stuck below the true value.

::: note Why it has to be true: the scaling bound
Suppose an allowed $\boldsymbol{\Delta}$ makes $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ singular. Multiply by $\mathbf{D}$ on the left and $\mathbf{D}^{-1}$ on the right; a singular matrix stays singular. Since $\mathbf{D}\mathbf{D}^{-1} = \mathbf{I}$,

$$\mathbf{D}(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})\mathbf{D}^{-1} = \mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})(\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1}) = \mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})\boldsymbol{\Delta}.$$

So the *same* $\boldsymbol{\Delta}$ also breaks the scaled matrix. The ordinary small gain bound on the scaled matrix says $\bar{\sigma}(\boldsymbol{\Delta}) \ge 1/\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$. This holds for every allowed $\mathbf{D}$, so it holds for the best one. Taking reciprocals gives the upper bound.
:::

The upper bound is the workhorse. It is a [[convex|convex]] problem in $\mathbf{D}$, so it can be solved reliably. And here is the fact that makes $\mu$ usable in aerospace at all:

::: key When the scaling bound is exact
The upper bound $\inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$ equals $\mu$ exactly whenever $2S + F \le 3$ (complex blocks). Three independent actuator uncertainties, or two blocks plus a performance block, fall inside that limit.
:::

Beyond that limit the bound can be loose, though in practice rarely by more than a few percent for complex structures. The lower bound is computed by a non-convex power iteration that can get stuck, so tools report the pair, and you start to worry when they separate. This [[exactness result|mu-history]] is part of why $\mu$ spread so quickly into flight control.

Real (parametric) $\mu$ is worse still. Its exact value can jump discontinuously as the data change, so a tiny change in one coefficient can change the answer by a finite amount. Mixed real-and-complex $\mu$ algorithms handle this by giving each real block a small complex part, which smooths the jumps at the cost of a little extra caution. This is what production tools do.

Here is a small upper-bound routine. It scales the rows and columns of $\mathbf{M}$ by positive numbers $d_i$, and walks downhill on $\log d_i$ one coordinate at a time:

```python
import numpy as np


def mu_upper(M, iters=400):
    """inf over diagonal D of sigma_max(D M D^-1) -- the standard mu upper bound.
    Exact for three or fewer complex blocks. Coordinate descent on log d."""
    n = M.shape[0]

    def val(ld):
        d = np.exp(ld)
        return np.linalg.svd(M * d[:, None] / d[None, :], compute_uv=False)[0]

    logd, cur, step = np.zeros(n), val(np.zeros(n)), 0.5
    for _ in range(iters):
        improved = False
        for i in range(n - 1):                  # only the ratios matter, so fix d_n = 1
            for sgn in (1.0, -1.0):
                trial = logd.copy()
                trial[i] += sgn * step
                if val(trial) < cur - 1e-14:
                    logd, cur, improved = trial, val(trial), True
                    break
            if improved:
                break
        if not improved:
            step *= 0.5
    return float(cur)


M = np.array([[0.0, 100.0], [0.0, 0.0]])
print(f"one-way coupling: sigma_max = {np.linalg.svd(M, compute_uv=False)[0]:.1f}, mu = {mu_upper(M):.1e}")
u, v = np.array([1.0, 2.0, -0.5]), np.array([0.3, -0.1, 0.4])
R = np.outer(u, v)
print(f"rank one:         mu = {mu_upper(R):.6f}, exact sum|u_i v_i| = {np.sum(abs(u * v)):.6f}")
# one-way coupling: sigma_max = 100.0, mu = 2.3e-14
# rank one:         mu = 0.700000, exact sum|u_i v_i| = 0.700000
```

The two printed lines are checks against exact answers. Running checks like these is how you convince yourself a $\mu$ routine works.

- **Rank one.** For a matrix built from one column times one row, $\mathbf{M} = \mathbf{u}\mathbf{v}^\mathsf{H}$ (the H means conjugate transpose), with a diagonal complex structure, $\mu = \sum_i\lvert u_i\bar{v}_i\rvert$ exactly. Here that is $0.3 + 0.2 + 0.2 = 0.7$, against $\bar{\sigma} = 1.168$.
- **One-way coupling.** For $\mathbf{M} = \begin{pmatrix}0 & 100 \\ 0 & 0\end{pmatrix}$, the product $\mathbf{M}\boldsymbol{\Delta}$ has zeros on and below the diagonal for every diagonal $\boldsymbol{\Delta}$. So $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 1$ always, and $\mu = 0$ (the printed $2.3\times 10^{-14}$ is rounding). *No* diagonal perturbation, of any size, can close that loop — while the small gain test, reading $\bar{\sigma} = 100$, insists the design tolerates no more than one percent.

::: example Adverse yaw, or why one-way coupling is free
**The setup.** Model a lateral axis pair — roll and yaw — where aileron deflection makes a large [[adverse yawing moment|adverse-yaw]] but the rudder makes almost no roll. With integrator-like axes and a diagonal controller, the **input complementary sensitivity** $\mathbf{T}_I$ (the map seen at the actuators) is lower triangular — zero above the diagonal:

$$\mathbf{T}_I(s) = \begin{pmatrix}\dfrac{k_1}{s + k_1} & 0 \\[2mm] \dfrac{k\,k_2\,s}{(s+k_1)(s+k_2)} & \dfrac{k_2}{s + k_2}\end{pmatrix}, \qquad k_1 = 2,\ k_2 = 3\ \mathrm{rad/s},\ k = 8 .$$

Both actuators carry an independent $\pm 20\,\%$ scale-factor error. So the structure is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2)$, complex; the weight is $W = 0.2$; and $\mathbf{M} = -0.2\,\mathbf{T}_I$.

**The unstructured test.** The off-diagonal term peaks at $\omega = \sqrt{k_1k_2} = \sqrt{6} = 2.449\,\mathrm{rad/s}$. Its size there is

$$\frac{kk_2\omega}{\sqrt{\omega^2+k_1^2}\sqrt{\omega^2+k_2^2}} = \frac{8\times 3\times 2.449}{\sqrt{10}\,\sqrt{15}} = \frac{58.79}{12.25} = 4.800.$$

Times the weight $0.2$, that entry of $\mathbf{M}$ is $0.960$, and it dominates the matrix. The unstructured test reads $\sup_\omega\bar{\sigma}(\mathbf{M}) = 0.981$ at $2.40\,\mathrm{rad/s}$. That is a pass, but only barely. A $25\,\%$ tolerance instead of $20\,\%$ would give $1.226$ and fail.

**The structured test.** For a triangular $\mathbf{M}$ and diagonal $\boldsymbol{\Delta}$, $\mathbf{M}\boldsymbol{\Delta}$ is triangular too. The determinant of a triangular matrix is the product of its diagonal, so

$$\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = (1 - m_{11}\delta_1)(1 - m_{22}\delta_2).$$

That is zero only when some $\lvert\delta_i\rvert = 1/\lvert m_{ii}\rvert$. Hence $\mu = \max_i\lvert m_{ii}\rvert$ exactly, whatever the coupling term is. Numerically the scaling bound matches this identity to better than $10^{-13}$ across the frequency grid. The peak is $\mu = 0.200$, reached at low frequency where both diagonal entries of $\mathbf{T}_I$ approach one.

**What it means.** The honest robustness margin is $1/0.200 = 5.0$. Five times $20\,\%$ is $100\,\%$: the actuators could be a hundred percent off and the loop would still be stable. The small gain theorem said the margin was $1/0.981 = 1.02$.

**Sanity check.** Why is the coupling free? A perturbation at the roll actuator can send a signal into the yaw channel, but nothing in the yaw channel comes back to roll. The two errors cannot form a loop between them. A full complex block would have supplied the missing return path — and no aircraft does.
:::

::: example A two-by-two case with no shortcuts
Take

$$\mathbf{M} = \begin{pmatrix}0.5 + 0.2j & 1 \\ 0.3 & -0.4\end{pmatrix}, \qquad \boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2)\ \text{complex}.$$

The three numbers are

$$\rho(\mathbf{M}) = 0.772, \qquad \mu_{\boldsymbol{\Delta}}(\mathbf{M}) = 0.815, \qquad \bar{\sigma}(\mathbf{M}) = 1.162.$$

**Is the middle number exact?** This structure has $S = 0$ and $F = 2$ blocks (two $1\times 1$ full blocks), so $2S + F = 2 \le 3$. The scaling bound is exact: $0.815$ is $\mu$, not merely a bound on it.

**The spread.** The spectral radius understates $\mu$ by about $5\,\%$ ($0.772/0.815 = 0.947$). The largest singular value overstates it by $43\,\%$ ($1.162/0.815 = 1.43$).

**As margins.** The small gain test says the loop tolerates $1/1.162 = 0.861$ times the modelled uncertainty — below one, a fail. $\mu$ says it tolerates $1/0.815 = 1.23$ times it — a pass. Same matrix, same hardware, opposite verdicts, and the $\mu$ verdict is the true one.

**Sanity check.** The order $0.772 \le 0.815 \le 1.162$ is the sandwich, as it must be.

This is the routine situation on a three-axis vehicle, and it is why programmes that run only the unstructured test end up detuning loops that never needed it.
:::

::: warning Report the structure, the bounds and the frequency
A $\mu$ plot is two curves against frequency: the upper bound and the lower bound. If they separate by more than a few percent, the analysis is incomplete. If they separate a lot, the structure probably has too many blocks for the scaling bound to be exact. Quote the peak value, the frequency where it occurs, and the block structure assumed. A bare "$\mu = 0.8$" cannot be checked by anyone.
:::

## From analysis to synthesis: D-K iteration

$\mu$ grades a design. To *produce* a design that makes $\mu$ small, the standard method uses the upper bound. Robust stability needs

$$\sup_\omega\ \inf_{\mathbf{D}(\omega)}\ \bar{\sigma}\big(\mathbf{D}(\omega)\,\mathbf{N}(j\omega)\,\mathbf{D}(\omega)^{-1}\big) < 1, \qquad \mathbf{N} = \mathcal{F}_l(\mathbf{P}, \mathbf{K}),$$

where $\mathbf{N}$ is the closed loop from the last lesson. This is a search over two things at once: the controller $\mathbf{K}$ and the scalings $\mathbf{D}$. Together they are not convex, so there is no single bowl to roll down. But each one alone is manageable. With $\mathbf{D}$ fixed, it is an ordinary H-infinity synthesis on the scaled plant. With $\mathbf{K}$ fixed, it is the convex scaling problem at each frequency. So [[take turns|alternating-search]].

::: key D-K iteration
Alternate until $\gamma$ stops improving:

- **(K step)** with the current scalings $\hat{\mathbf{D}}(s)$ fixed, run H-infinity synthesis on the scaled plant $\hat{\mathbf{D}}\mathbf{P}\hat{\mathbf{D}}^{-1}$ to get a new $\mathbf{K}$;
- **(D step)** with $\mathbf{K}$ fixed, fit frequency-varying $\mathbf{D}(\omega)$ to reduce the $\mu$ upper bound frequency by frequency, then fit a stable, minimum-phase rational $\hat{\mathbf{D}}(s)$ to that magnitude curve.

It is not guaranteed to converge to a global optimum, but it is the workhorse of $\mu$-synthesis.
:::

Three practical points decide whether it works for you.

1. **The fit is the awkward part.** Too low an order and $\hat{\mathbf{D}}(s)$ is a poor copy of $\mathbf{D}(\omega)$. Too high and the controller order explodes, because the controller's order is the plant's plus the weights' plus *twice* the order of $\hat{\mathbf{D}}$ (it appears once on each side).
2. **The start matters.** The iteration is sensitive to its starting point, so it is normal to run it from several initial $\mathbf{D}$, including $\mathbf{D} = \mathbf{I}$, and keep the best.
3. **Real blocks need care.** D-K iteration handles complex blocks naturally. A real parametric block must be treated by mixed-$\mu$ methods, or covered by a complex block, with the extra caution that implies.

A rule of thumb from flight programmes: D-K iteration earns its complexity when the unstructured design misses by less than a factor of two. Beyond that, the problem is usually the plant or the specification, not the conservatism.

::: warning Structure does not make problems disappear
$\mu$ removes needless pessimism; it does not remove physics. If the unstructured test fails by a factor of five, a $\mu$ analysis will very likely still fail, and the answer is a different bandwidth, a better sensor or a tighter hardware tolerance. Using $\mu$ to talk a marginal design into passing is the structured version of shrinking the weight.
:::

## Check yourself

::: check
A $\mu$ analysis of an attitude loop against three independent actuator uncertainties returns a peak of $1.6$ at $18\,\mathrm{rad/s}$. Say precisely what that means. What would the unstructured number tell you if it were $2.4$?
:::

::: answer
A peak $\mu$ of $1.6$ means there is an allowed perturbation — diagonal, one block per actuator, each of size at most $1/1.6 = 0.625$ in normalised units — that puts a closed-loop pole at $18\,\mathrm{rad/s}$. Robust stability fails, and it fails against uncertainty only $62.5\,\%$ as large as modelled. If the weight said $\pm 20\,\%$ scale factor, the loop goes unstable at about $0.625\times 20 = 12.5\,\%$.

An unstructured figure of $2.4$ would say a *full complex* perturbation of size $1/2.4 = 0.417$ is enough. That is a weaker statement about a larger set of perturbations, most of which the hardware cannot produce. The gap between $2.4$ and $1.6$ is the pessimism the structure removes. The number to act on is $1.6$, and the action is to retune, because a $12.5\,\%$ actuator tolerance is not a tolerance anyone will sign.
:::

::: check
Why is $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \rho(\mathbf{M})$ when $\boldsymbol{\Delta} = \delta\mathbf{I}$? Why does that make the repeated-scalar case the least pessimistic of all?
:::

::: answer
With $\boldsymbol{\Delta} = \delta\mathbf{I}$, $\det(\mathbf{I} - \delta\mathbf{M}) = 0$ means $\delta\mathbf{M}$ has an eigenvalue equal to one, so $1/\delta$ is an eigenvalue of $\mathbf{M}$. The smallest allowed $\lvert\delta\rvert$ is therefore $1/\max_i\lvert\lambda_i(\mathbf{M})\rvert = 1/\rho(\mathbf{M})$, and one over that is $\rho(\mathbf{M})$.

It is the smallest $\mu$ over all structures because $\delta\mathbf{I}$ is the most restricted allowed set — one complex number instead of a whole matrix — and shrinking the allowed set can only make the smallest destabilising perturbation larger. Since $\rho(\mathbf{M}) \le \bar{\sigma}(\mathbf{M})$ always, the gap between the repeated-scalar case and the full-block case is exactly the gap between the spectral radius and the largest singular value. That gap is zero for normal matrices (such as symmetric ones) and can be huge for strongly non-normal ones, like the one-way coupling matrix above ($\rho = 0$, $\bar{\sigma} = 100$).
:::

::: check
Explain why the upper bound $\inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$ is valid, using nothing more than the fact that $\mathbf{D}$ commutes with the structure. Then say, in one sentence, why the infimum is useful.
:::

::: answer
Suppose an allowed $\boldsymbol{\Delta}$ makes $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ singular. Sandwich it: $\mathbf{D}(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})\mathbf{D}^{-1} = \mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})(\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1})$. Because $\mathbf{D}$ commutes with the block structure, $\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1} = \boldsymbol{\Delta}$. So $\mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})\boldsymbol{\Delta}$ is singular with the *same* $\boldsymbol{\Delta}$, of the same size. The ordinary small gain bound on the scaled matrix gives $\bar{\sigma}(\boldsymbol{\Delta}) \ge 1/\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$. That holds for every allowed $\mathbf{D}$, so it holds for the best one: $\mu \le \inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$.

Why the infimum helps: scaling cannot change $\mu$ but it can change $\bar{\sigma}$, so searching over $\mathbf{D}$ squeezes the crude bound down toward the truth.
:::

::: check
In the adverse-yaw example, what would happen to $\mu$ if the rudder also produced a significant rolling moment, so that $\mathbf{T}_I$ were full rather than triangular?
:::

::: answer
The triangular shortcut $\mu = \max_i\lvert m_{ii}\rvert$ would no longer apply, because the determinant picks up a cross term. Written out,

$$\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 1 - m_{11}\delta_1 - m_{22}\delta_2 + (m_{11}m_{22} - m_{12}m_{21})\delta_1\delta_2 .$$

The product $m_{12}m_{21}$ of the two off-diagonal entries now gives the two perturbations a path to reinforce each other. With $\lvert m_{21}\rvert$ near $0.96$ (the adverse-yaw term) and a comparable $\lvert m_{12}\rvert$ from the new rudder-to-roll path, you can choose the phases of $\delta_1$ and $\delta_2$ so the last term adds to the others. That drives the determinant to zero at a much smaller size, and $\mu$ rises toward $\bar{\sigma}$. The physical statement is the same as before: two-way coupling lets two independent hardware errors close a loop around each other, and one-way coupling does not.
:::

::: check
A D-K iteration converges to $\gamma = 0.92$ after four passes, and the controller has fifty-two states for a six-state plant. What happened, and what do you do next?
:::

::: answer
The controller's order is plant plus weights plus twice the order of the fitted scalings, so a high-order rational fit of $\mathbf{D}(\omega)$ has bloated the controller.

Next steps: refit $\hat{\mathbf{D}}$ at lower order — often second or third order per block is enough — and rerun, accepting a slightly worse $\gamma$. Then apply balanced truncation to the controller, and re-check $\mu$ with the *reduced* controller rather than trusting the reduction. That re-check is not optional. The reduced controller is a different controller, and its $\mu$ peak can be materially worse, especially near the frequency of the original peak. A fifty-two-state flight controller is also a real cost in computer time and in verification effort, so a design that needs one should be questioned before it is polished.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = 1/\min\{\bar\sigma(\boldsymbol{\Delta}) : \boldsymbol{\Delta}\in\boldsymbol{\Delta},\ \det(\mathbf{I}-\mathbf{M}\boldsymbol{\Delta}) = 0\}$; zero if none exists |
| Robust stability | holds if and only if $\sup_\omega\mu_{\boldsymbol{\Delta}}(\mathbf{M}(j\omega)) < 1$; margin $= 1/\sup_\omega\mu$ |
| Scaling | $\mu(\alpha\mathbf{M}) = \lvert\alpha\rvert\mu(\mathbf{M})$; not a norm; meaningless without its block structure |
| Full complex block | $\mu = \bar{\sigma}(\mathbf{M})$ — the small gain test |
| Repeated complex scalar | $\mu = \rho(\mathbf{M})$, the spectral radius |
| General bounds | $\max_{\mathbf{U}}\rho(\mathbf{U}\mathbf{M}) \le \mu \le \inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$ |
| Upper bound exactness | exact when $2S + F \le 3$; $\mu$ is NP-hard in general, real $\mu$ also discontinuous; tools report upper and lower bounds |
| Exact checks | rank-one $\mathbf{u}\mathbf{v}^\mathsf{H}$ with diagonal $\boldsymbol{\Delta}$: $\mu = \sum_i\lvert u_i\bar{v}_i\rvert$; triangular $\mathbf{M}$: $\mu = \max_i\lvert m_{ii}\rvert$ |
| Worked gap | adverse-yaw pair: $\sup\bar{\sigma} = 0.981$ but $\sup\mu = 0.200$, a factor of $4.9$ in allowed uncertainty |
| D-K iteration | alternate H-infinity synthesis on $\hat{\mathbf{D}}\mathbf{P}\hat{\mathbf{D}}^{-1}$ with a convex D-fit; no global guarantee; controller order grows with the fit |

The next lesson uses $\mu$ for the question the module has so far avoided: not whether the loop stays stable across the plant set, but whether it still *performs* across the plant set.

::: context np-hard What "NP-hard" means
Some problems get only a little harder as they grow: sorting a list twice as long takes about twice the work. **NP-hard** problems are in a class for which nobody knows any method that avoids, in the worst case, work that grows explosively — roughly doubling with each extra piece. Exact $\mu$ with many blocks is one of them. That does not stop engineers. It means they compute two quick bounds, one from above and one from below, and trust the answer when the two agree.
:::

::: context block-structure A picture of the structure
Three actuators, each with its own unknown gain error. The uncertainty matrix is allowed only on the diagonal; everything off the diagonal is zero, because one actuator's error cannot reach into another actuator. The small gain theorem instead lets every square be filled.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="30" y="20" width="36" height="36" fill="#8fb8f0"/><rect x="66" y="20" width="36" height="36" fill="#fff"/><rect x="102" y="20" width="36" height="36" fill="#fff"/>
    <rect x="30" y="56" width="36" height="36" fill="#fff"/><rect x="66" y="56" width="36" height="36" fill="#8fb8f0"/><rect x="102" y="56" width="36" height="36" fill="#fff"/>
    <rect x="30" y="92" width="36" height="36" fill="#fff"/><rect x="66" y="92" width="36" height="36" fill="#fff"/><rect x="102" y="92" width="36" height="36" fill="#8fb8f0"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="48" y="43">δ₁</text><text x="84" y="79">δ₂</text><text x="120" y="115">δ₃</text>
    <text x="84" y="43">0</text><text x="120" y="43">0</text><text x="48" y="79">0</text><text x="120" y="79">0</text><text x="48" y="115">0</text><text x="84" y="115">0</text>
  </g>
  <text x="84" y="145" font-size="12" fill="#1d6fd1" text-anchor="middle">structured: 3 numbers</text>
  <g stroke="#1f2a44" stroke-width="1.5" fill="#f2b880">
    <rect x="222" y="20" width="36" height="36"/><rect x="258" y="20" width="36" height="36"/><rect x="294" y="20" width="36" height="36"/>
    <rect x="222" y="56" width="36" height="36"/><rect x="258" y="56" width="36" height="36"/><rect x="294" y="56" width="36" height="36"/>
    <rect x="222" y="92" width="36" height="36"/><rect x="258" y="92" width="36" height="36"/><rect x="294" y="92" width="36" height="36"/>
  </g>
  <text x="276" y="145" font-size="12" fill="#b4232c" text-anchor="middle">full block: 9 numbers</text>
</svg>
```
:::

::: context singular-means-pole Why a zero determinant means a pole
Imagine a signal $e$ leaving the uncertainty block. It goes through $\mathbf{M}$, through $\boldsymbol{\Delta}$, and comes back as $\mathbf{M}\boldsymbol{\Delta}e$. If it comes back *exactly* as it left, $\mathbf{M}\boldsymbol{\Delta}e = e$, then the loop can keep that signal going with no input at all — a sustained oscillation at that frequency, which is a closed-loop pole on the imaginary axis. $\mathbf{M}\boldsymbol{\Delta}e = e$ with $e \ne 0$ is the same as $(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})e = 0$, and that happens exactly when the determinant is zero.
:::

::: context convex Why convex problems are the good kind
A **convex** problem is shaped like a single bowl: from anywhere, walking downhill takes you to the one true bottom. A non-convex problem is a landscape with many dips, and walking downhill can leave you stuck in a shallow one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <path d="M20,20 Q90,190 160,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="90" cy="105" r="5" fill="#1d6fd1"/>
  <text x="90" y="124" font-size="12" fill="#1d6fd1" text-anchor="middle">convex: one bottom</text>
  <path d="M200,20 C215,90 235,90 250,60 C262,38 272,38 285,70 C298,110 318,110 340,20" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="230" cy="74" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="304" cy="90.6" r="5" fill="#b4232c"/>
  <text x="270" y="124" font-size="12" fill="#b4232c" text-anchor="middle">non-convex: can get stuck</text>
</svg>
```

The $\mu$ upper bound is a bowl in $\log\mathbf{D}$, which is why every tool computes it reliably. The lower bound, and the joint search over controller and scalings, are landscapes.
:::

::: context mu-history Where mu came from
John Doyle introduced the structured singular value in 1982, in a paper on feedback systems with structured uncertainty; in the same year Michael Safonov proposed an equivalent "multivariable stability margin". Doyle's paper already showed that the scaling bound is exact for up to three full blocks. Engineers could therefore trust the number on the small problems that matter most, which is a large part of why $\mu$ moved quickly from theory into aerospace practice.
:::

::: context adverse-yaw What adverse yaw is
Roll an airplane right with the ailerons. The left aileron goes down to lift the left wing, and that wing also gets more drag. The extra drag drags the nose *left*, away from the turn. That unwanted yaw is **adverse yaw**. The coupling runs one way: ailerons disturb yaw, but the rudder barely disturbs roll.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="110" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="57" font-size="13" text-anchor="middle" fill="#1f2a44">roll, error δ₁</text>
  <rect x="220" y="30" width="110" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="57" font-size="13" text-anchor="middle" fill="#1f2a44">yaw, error δ₂</text>
  <line x1="140" y1="45" x2="212" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="220,45 210,40 210,50" fill="#1f2a44"/>
  <text x="180" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">strong</text>
  <line x1="220" y1="64" x2="148" y2="64" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="180" y="88" font-size="11" text-anchor="middle" fill="#b4232c">no path back</text>
</svg>
```

With no return path, the two actuator errors cannot feed each other, so the big coupling term costs nothing in $\mu$.
:::

::: context alternating-search Taking turns on two knobs
Adjusting a shower with separate hot and cold taps works the same way: fix one, adjust the other, then swap. Each step is easy on its own, and each one aims to make things better, but you can end up at a setting that is good rather than best. D-K iteration has the same strength and the same weakness. Each K step and each D step tries to lower the bound, yet the pair can settle in a dip that is not the lowest one, which is why engineers restart it from several places.
:::
