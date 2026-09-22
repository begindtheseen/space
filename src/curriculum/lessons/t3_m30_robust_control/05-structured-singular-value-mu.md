---
id: l05-structured-singular-value-mu
title: The structured singular value and D-K iteration
minutes: 18
covers:
  - The structured singular value mu and mu-synthesis by D-K iteration
---

The small gain theorem answered the wrong question. It asked whether *any* norm-bounded perturbation can destabilise the loop, when what you wanted to know was whether any perturbation *your hardware can produce* can destabilise the loop. Those two questions have the same answer only when the uncertainty is a single full complex block. As soon as the description is three independent actuator scale factors, or a real parameter appearing in four places, or an error at the input plus a separate error at the output, the theorem is answering something harder than you asked and the verdict comes back pessimistic.

The structured singular value, written $\mu$, is the repair. It is defined directly as the answer to the right question: how small can an *admissible* perturbation be and still destabilise the loop? Take the reciprocal and you get a number that plays the role $\bar{\sigma}$ played in the small gain test, with the same "peak below one" criterion, but without the conservatism. The price is that $\mu$ is NP-hard to compute, so in practice you compute upper and lower bounds and report both.

This lesson defines $\mu$, works out the special cases where it collapses to something familiar, derives the scaling bounds that every tool uses, and describes D-K iteration — the alternating procedure that turns $\mu$ from an analysis tool into a synthesis method. Two of the examples are checkable by exact formula, which is the only honest way to trust a $\mu$ computation.

## The definition

Fix a block structure: a set $\boldsymbol{\Delta}$ of block-diagonal matrices of a given pattern, for example $\operatorname{diag}(\delta_1\mathbf{I}_{r_1}, \dots, \delta_S\mathbf{I}_{r_S}, \boldsymbol{\Delta}_1, \dots, \boldsymbol{\Delta}_F)$ with $S$ repeated scalar blocks and $F$ full blocks, the scalars complex (or real, which is harder). Then:

::: key Structured singular value
For a complex matrix $\mathbf{M}$ and a block structure $\boldsymbol{\Delta}$,

$$\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \frac{1}{\min\{\bar{\sigma}(\boldsymbol{\Delta}) : \boldsymbol{\Delta}\in\boldsymbol{\Delta},\ \det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 0\}},$$

and $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = 0$ if no admissible $\boldsymbol{\Delta}$ makes $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ singular. Robust stability of the $\mathbf{M}$–$\boldsymbol{\Delta}$ loop against the normalised set $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ holds if and only if $\sup_\omega\mu_{\boldsymbol{\Delta}}(\mathbf{M}(j\omega)) < 1$.
:::

Read the definition backwards and it is obvious what it means. $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 0$ is precisely the condition for the closed loop to have a pole at that frequency. So the denominator is the size of the smallest destabilising admissible perturbation, and $\mu$ is its reciprocal: $\mu = 2$ means a perturbation of size $0.5$ suffices to destabilise, $\mu = 0.4$ means you can survive perturbations two and a half times larger than modelled. The quantity $1/\sup_\omega\mu$ is the robustness margin in the same units the weight was written in, and it is what a $\mu$ analysis is really reporting.

Three immediate properties. $\mu$ is a *scaled* quantity, $\mu(\alpha\mathbf{M}) = \lvert\alpha\rvert\,\mu(\mathbf{M})$, so doubling the uncertainty weight doubles $\mu$ — which is what makes "peak below one" a meaningful normalisation. It is not a norm: the triangle inequality fails. And it depends on the structure as much as on the matrix, so $\mu$ quoted without its block structure is meaningless.

## Special cases and bounds

Two extremes pin $\mu$ down.

**One full complex block.** If $\boldsymbol{\Delta}$ is the set of all complex matrices of the right size, then the smallest destabilising perturbation is $\bar{\sigma}(\mathbf{M})^{-1}$, by the singular-vector construction of the small gain lesson. So $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \bar{\sigma}(\mathbf{M})$, and $\mu$ analysis reduces exactly to the small gain test.

**One repeated complex scalar**, $\boldsymbol{\Delta} = \delta\mathbf{I}$. Then $\det(\mathbf{I} - \delta\mathbf{M}) = 0$ requires $1/\delta$ to be an eigenvalue of $\mathbf{M}$, so the smallest $\lvert\delta\rvert$ is $1/\rho(\mathbf{M})$ with $\rho$ the spectral radius, and $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \rho(\mathbf{M})$.

Every other structure lies between, because enlarging the admissible set can only make the smallest destabilising perturbation smaller:

$$\rho(\mathbf{M})\ \le\ \mu_{\boldsymbol{\Delta}}(\mathbf{M})\ \le\ \bar{\sigma}(\mathbf{M}).$$

Both inequalities can be arbitrarily loose, which is why neither substitutes for $\mu$. What tightens them is exploiting transformations that leave $\mu$ alone. Define two sets that commute with the structure: unitary matrices $\mathbf{U}$ of the same block pattern, and invertible $\mathbf{D}$ that are block-scalar where $\boldsymbol{\Delta}$ has full blocks and full where $\boldsymbol{\Delta}$ has repeated scalars. Then $\mathbf{U}\boldsymbol{\Delta}$ and $\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1} = \boldsymbol{\Delta}$ stay admissible, giving

$$\max_{\mathbf{U}}\ \rho(\mathbf{U}\mathbf{M})\ \le\ \mu_{\boldsymbol{\Delta}}(\mathbf{M})\ \le\ \inf_{\mathbf{D}}\ \bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1}).$$

The upper bound is the workhorse. It is a convex problem in $\mathbf{D}$, so it can be solved reliably, and — the fact that makes $\mu$ usable at all in aerospace — **it is exact whenever $2S + F \le 3$**. Three independent actuator uncertainties, or two blocks plus a performance block, fall inside that limit. Beyond it the bound can be loose, though in practice rarely by more than a few percent for complex structures. The lower bound is a non-convex power iteration and can get stuck, so tools report the pair and you worry when they separate.

$\mu$ is NP-hard in general, and real (parametric) $\mu$ is worse: the exact value is a discontinuous function of the data, so a tiny change in a coefficient can change the answer by a finite amount. Mixed real-and-complex $\mu$ algorithms handle this by inflating each real block with a small complex part, which restores continuity at the cost of a little conservatism, and this is what production tools do.

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

The two printed checks are exact results, and running them is how you convince yourself a $\mu$ routine works. For the rank-one matrix $\mathbf{M} = \mathbf{u}\mathbf{v}^\mathsf{H}$ with a diagonal complex structure, $\mu = \sum_i\lvert u_i\bar{v}_i\rvert$ exactly, here $0.3 + 0.2 + 0.2 = 0.7$ against $\bar{\sigma} = 1.168$. For the one-way coupling matrix, $\mathbf{M}\boldsymbol{\Delta}$ is strictly upper triangular for every diagonal $\boldsymbol{\Delta}$, so $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 1$ always and $\mu = 0$: *no* diagonal perturbation, of any size, can close that loop, while the small gain test insists the design tolerates no more than one percent.

::: example Adverse yaw, or why one-way coupling is free
Model a lateral axis pair — roll and yaw — where aileron deflection produces a large adverse yawing moment but the rudder produces almost no roll. With integrator-like axes and a diagonal controller, the input complementary sensitivity is lower triangular:

$$\mathbf{T}_I(s) = \begin{pmatrix}\dfrac{k_1}{s + k_1} & 0 \\[2mm] \dfrac{k\,k_2\,s}{(s+k_1)(s+k_2)} & \dfrac{k_2}{s + k_2}\end{pmatrix}, \qquad k_1 = 2,\ k_2 = 3\ \mathrm{rad/s},\ k = 8 .$$

Both actuators carry an independent $\pm 20\,\%$ scale-factor uncertainty, so the structure is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2)$ complex, the weight is $W = 0.2$, and $\mathbf{M} = -0.2\,\mathbf{T}_I$.

The off-diagonal term peaks at $\omega = \sqrt{k_1k_2} = 2.449\,\mathrm{rad/s}$, where its magnitude is $kk_2\omega/(\sqrt{\omega^2+k_1^2}\sqrt{\omega^2+k_2^2}) = 4.800$. That single entry dominates the matrix, and the unstructured test reads $\sup_\omega\bar{\sigma}(\mathbf{M}) = 0.981$ at $2.40\,\mathrm{rad/s}$ — a pass, but only barely, and a $25\,\%$ tolerance instead of $20\,\%$ would give $1.226$ and fail.

The structured answer is different in kind. For a triangular $\mathbf{M}$ and diagonal $\boldsymbol{\Delta}$, $\mathbf{M}\boldsymbol{\Delta}$ is triangular too, so $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = \prod_i(1 - m_{ii}\delta_i)$, which vanishes only when some $\lvert\delta_i\rvert = 1/\lvert m_{ii}\rvert$. Hence $\mu = \max_i\lvert m_{ii}\rvert$ exactly, independent of the coupling term. Numerically the D-scaling bound matches that identity to $1.2\times 10^{-15}$ across the whole frequency grid, and the peak is $\mu = 0.200$, reached at low frequency where both diagonal entries approach one.

So the honest robustness margin is $1/0.200 = 5.0$: the actuators could be a hundred percent off and the loop would still be stable. The small gain theorem said the margin was $1/0.981 = 1.02$. The factor of five is entirely the coupling term, and the reason it is free is structural: a perturbation at the roll actuator can send a signal into the yaw channel, but nothing in the yaw channel comes back to roll, so the two uncertainties cannot form a loop between them. A full complex block would have supplied the missing return path — and no aircraft does.
:::

::: example A two-by-two case with no shortcuts
Take $\mathbf{M} = \begin{pmatrix}0.5 + 0.2j & 1 \\ 0.3 & -0.4\end{pmatrix}$ with $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2)$ complex. The three quantities are

$$\rho(\mathbf{M}) = 0.772, \qquad \mu_{\boldsymbol{\Delta}}(\mathbf{M}) = 0.815, \qquad \bar{\sigma}(\mathbf{M}) = 1.162,$$

and since this structure has $F = 2$ full blocks, $2S + F = 2 \le 3$, the D-scaling upper bound is exact — the middle number is $\mu$, not a bound on it. The spread is instructive: the spectral radius understates by $5\,\%$ and the largest singular value overstates by $43\,\%$. Interpreted as margins, the small gain test says the loop tolerates $1/1.162 = 0.861$ times the modelled uncertainty (a fail, since that is below one), while $\mu$ says it tolerates $1/0.815 = 1.23$ times it (a pass). Same matrix, same hardware, opposite verdicts — and the $\mu$ verdict is the true one.

This is the routine situation on a three-axis vehicle, and it is why programmes that run only the unstructured test end up detuning loops that never needed detuning.
:::

::: warning Report the structure, the bounds and the frequency
A $\mu$ plot is three curves: the upper bound, the lower bound, and the frequency axis. If the bounds separate by more than a few percent the analysis is incomplete, and if they separate a lot the structure probably has too many blocks for the scaling bound to be exact. Quote the peak value, the frequency at which it occurs, and the block structure assumed; a bare number such as "$\mu = 0.8$" cannot be checked by anyone.
:::

## From analysis to synthesis: D-K iteration

$\mu$ measures a design. To *produce* a design that minimises $\mu$, the standard method exploits the upper bound. Robust stability needs

$$\sup_\omega\ \inf_{\mathbf{D}(\omega)}\ \bar{\sigma}\big(\mathbf{D}(\omega)\,\mathbf{N}(j\omega)\,\mathbf{D}(\omega)^{-1}\big) < 1, \qquad \mathbf{N} = \mathcal{F}_l(\mathbf{P}, \mathbf{K}),$$

which is a minimisation over two things at once — the controller $\mathbf{K}$ and the scalings $\mathbf{D}$ — and is not jointly convex in them. But it *is* tractable in each one separately: with $\mathbf{D}$ fixed it is an ordinary H-infinity synthesis on the scaled plant, and with $\mathbf{K}$ fixed it is the convex D-scaling problem at each frequency. So alternate.

::: key D-K iteration
Repeat until $\gamma$ stops improving: **(K step)** with the current scalings $\hat{\mathbf{D}}(s)$ fixed, run H-infinity synthesis on the augmented plant $\hat{\mathbf{D}}\mathbf{P}\hat{\mathbf{D}}^{-1}$ to get a new $\mathbf{K}$; **(D step)** with $\mathbf{K}$ fixed, compute the optimal $\mathbf{D}(\omega)$ frequency by frequency, then fit a stable, minimum-phase rational $\hat{\mathbf{D}}(s)$ to the resulting magnitude curve. There is no guarantee of converging to a global optimum, but it is the workhorse of $\mu$-synthesis.
:::

Three practical points decide whether it works for you. The rational fit in the D step is the awkward part: too low an order and the scaling is a poor approximation, too high and the controller order explodes, because the synthesised controller inherits the order of the plant plus the weights plus twice the order of $\hat{\mathbf{D}}$. Second, the iteration is sensitive to its starting point, so it is normal to run it from several initial $\mathbf{D}$, including $\mathbf{D} = \mathbf{I}$, and keep the best. Third, D-K iteration handles complex blocks naturally; a real parametric block must be treated by mixed-$\mu$ methods or covered by a complex block with the conservatism that implies. A rule of thumb from flight programmes is that D-K iteration earns its complexity when the unstructured design misses by less than a factor of two — beyond that, the problem is usually the plant or the specification rather than the conservatism.

::: warning Structure does not make problems disappear
$\mu$ removes conservatism; it does not remove physics. If the unstructured test fails by a factor of five, a $\mu$ analysis will very likely still fail, and the answer is a different bandwidth, a better sensor or a tighter hardware tolerance. Treating $\mu$ as a way to talk a marginal design into passing is the structured version of shrinking the weight.
:::

## Check yourself

::: check
A $\mu$ analysis of an attitude loop against three independent actuator uncertainties returns a peak of $1.6$ at $18\,\mathrm{rad/s}$. State precisely what that means, and what the corresponding unstructured number would tell you if it were $2.4$.
:::

::: answer
A peak $\mu$ of $1.6$ means there exists an admissible perturbation — diagonal, one block per actuator, each of size at most $1/1.6 = 0.625$ in the normalised units — that puts a closed-loop pole at $18\,\mathrm{rad/s}$. Robust stability fails, and it fails against uncertainty only $62.5\,\%$ as large as modelled: if the weight said $\pm 20\,\%$ scale factor, the loop goes unstable at about $\pm 12.5\,\%$. The unstructured figure of $2.4$ would say a *full complex* perturbation of size $0.417$ suffices, which is a weaker statement about a larger set; the gap $2.4$ versus $1.6$ is the conservatism the structure removes. The actionable number is $1.6$, and the action is to retune, because a real actuator tolerance of $12.5\,\%$ is not a tolerance anyone will sign.
:::

::: check
Why is $\mu_{\boldsymbol{\Delta}}(\mathbf{M}) = \rho(\mathbf{M})$ when $\boldsymbol{\Delta} = \delta\mathbf{I}$, and why does that make the repeated-scalar case the least conservative of all?
:::

::: answer
With $\boldsymbol{\Delta} = \delta\mathbf{I}$, $\det(\mathbf{I} - \delta\mathbf{M}) = 0$ means $\delta\mathbf{M}$ has an eigenvalue equal to one, so $1/\delta$ is an eigenvalue of $\mathbf{M}$. The smallest admissible $\lvert\delta\rvert$ is therefore $1/\max_i\lvert\lambda_i(\mathbf{M})\rvert = 1/\rho(\mathbf{M})$, and the reciprocal is $\rho(\mathbf{M})$. It is the smallest possible value of $\mu$ over all structures because $\delta\mathbf{I}$ is the most restrictive admissible set — one complex number instead of a whole matrix — and shrinking the admissible set can only make the smallest destabilising perturbation larger. Since $\rho(\mathbf{M}) \le \bar{\sigma}(\mathbf{M})$ always, with equality only for normal matrices, the gap between the repeated-scalar case and the full-block case is exactly the gap between the spectral radius and the largest singular value.
:::

::: check
Explain why the upper bound $\inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$ is valid, using nothing more than the fact that $\mathbf{D}$ commutes with the structure.
:::

::: answer
Suppose an admissible $\boldsymbol{\Delta}$ makes $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ singular. Insert the scaling: $\mathbf{D}(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})\mathbf{D}^{-1} = \mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})(\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1})$, and because $\mathbf{D}$ is chosen to commute with the block structure, $\mathbf{D}\boldsymbol{\Delta}\mathbf{D}^{-1} = \boldsymbol{\Delta}$. So $\mathbf{I} - (\mathbf{D}\mathbf{M}\mathbf{D}^{-1})\boldsymbol{\Delta}$ is singular with the *same* $\boldsymbol{\Delta}$, of the same size. Applying the ordinary small gain bound to the scaled matrix, $\bar{\sigma}(\boldsymbol{\Delta}) \ge 1/\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$. This holds for every admissible $\mathbf{D}$, so it holds for the best one, giving $\mu \le \inf_{\mathbf{D}}\bar{\sigma}(\mathbf{D}\mathbf{M}\mathbf{D}^{-1})$. Scaling cannot change $\mu$ but it can change $\bar{\sigma}$, and the infimum squeezes the crude bound down toward the truth.
:::

::: check
For the adverse-yaw example, what would $\mu$ become if the rudder also produced a significant rolling moment, making $\mathbf{T}_I$ full rather than triangular?
:::

::: answer
The triangular identity $\mu = \max_i\lvert m_{ii}\rvert$ would no longer apply, because $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})$ picks up the cross term $m_{12}m_{21}\delta_1\delta_2$. Writing it out, $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 1 - m_{11}\delta_1 - m_{22}\delta_2 + (m_{11}m_{22} - m_{12}m_{21})\delta_1\delta_2$, and the product of the off-diagonal entries now gives the two perturbations a path to reinforce each other. With $\lvert m_{12}\rvert$ near $0.96$ and a comparable $\lvert m_{21}\rvert$, choosing $\delta_1$ and $\delta_2$ with phases that make the last term add to the first two brings the determinant to zero at a much smaller size, and $\mu$ rises toward $\bar{\sigma}$. The physical statement is the same one: two-way coupling lets two independent hardware errors close a loop around each other, and one-way coupling does not.
:::

::: check
A D-K iteration converges to $\gamma = 0.92$ after four passes, and the controller has fifty-two states for a six-state plant. What happened, and what do you do next?
:::

::: answer
The order is plant plus weights plus twice the order of the fitted scalings, so a high-order rational fit of $\mathbf{D}(\omega)$ has inflated the controller. The fix is to refit $\hat{\mathbf{D}}$ with a lower order — often second or third order per block is enough — and rerun, accepting a slightly worse $\gamma$; then apply balanced truncation to the resulting controller and re-verify $\mu$ on the reduced controller rather than trusting the reduction. Verification after reduction is not optional: the reduced controller is a different controller, and its $\mu$ peak can be materially worse, especially near the frequency where the original peak occurred. A flight-software controller of fifty-two states is also a real cost in throughput and in verification effort, and a design that needs it should be questioned before it is optimised.
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
| Upper bound exactness | exact when $2S + F \le 3$; $\mu$ is NP-hard in general, real $\mu$ also discontinuous |
| Exact checks | rank-one $\mathbf{u}\mathbf{v}^\mathsf{H}$ with diagonal $\boldsymbol{\Delta}$: $\mu = \sum_i\lvert u_i\bar{v}_i\rvert$; triangular $\mathbf{M}$: $\mu = \max_i\lvert m_{ii}\rvert$ |
| Worked gap | adverse-yaw pair: $\sup\bar{\sigma} = 0.981$ but $\sup\mu = 0.200$, a factor of $4.9$ in allowed uncertainty |
| D-K iteration | alternate H-infinity synthesis on $\hat{\mathbf{D}}\mathbf{P}\hat{\mathbf{D}}^{-1}$ with a convex D-fit; no global guarantee; controller order grows with the fit |

The next lesson uses $\mu$ for the question the module has so far avoided: not whether the loop stays stable across the plant set, but whether it still *performs* across the plant set.
