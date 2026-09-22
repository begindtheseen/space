---
id: l13-consider-states-and-bias-augmentation
title: Consider states and bias augmentation
minutes: 18
covers:
  - Consider states and bias augmentation
---

The Kalman filter module's Schmidt-Kalman lesson introduced the basic idea of a **consider state**: carry a nuisance parameter's uncertainty in the covariance so it correctly inflates the estimate's reported spread, without ever letting the filter update that parameter. This lesson gives that idea a full, quantitative comparison against the two alternatives a real design always has available — ignore the parameter's uncertainty entirely, or fully estimate it by adding it to the state (**augmentation**) — and asks, with real numbers, which choice actually produces the most honest filter for a given problem. The nonlinear-filtering module's own worked examples are the natural setting for this: gyro bias, sensor scale factors, and misalignments are exactly the kind of slowly-varying, sometimes-poorly-observable nuisance parameters this lesson is about, and the Multiplicative EKF lesson's gyro-bias state was, without saying so at the time, already an example of the *augment* strategy in the specific case where augmenting was the right call.

## Three strategies, stated precisely

Take a state $r$ with ordinary dynamics, measured through a sensor with an unknown constant bias $c$: $z_k=r_k+c+v_k$. The bias has some genuine prior uncertainty $\sigma_c^2$ that a real filter has to do *something* with.

::: key Ignore, consider, or augment
**Ignore**: filter state is $r$ alone; $c$ is assumed exactly zero, and its uncertainty never enters $\mathbf S$ or $\mathbf P$ at all. **Consider (Schmidt-Kalman)**: filter state is $(r,c)$ jointly, propagated and folded into $\mathbf S$ normally, but the Kalman **gain's row for $c$ is forced to zero** every cycle — $c$'s own estimate never moves, while its correlation with $r$ still correctly shapes how much $r$'s own uncertainty shrinks. **Augment**: filter state is $(r,c)$ jointly, with an ordinary, unconstrained gain on both rows — $c$ is actively estimated, exactly like any other state.
:::

::: example Three strategies on an identical, weakly-observable bias
A range sensor drifts by a known, deterministic $2\,\mathrm{m/s}$ (representing an unambiguous, separately-known dynamic signature) while carrying a genuinely unknown constant bias, $c_{\text{true}}=6\,\mathrm m$, prior $\sigma_c=8\,\mathrm m$; measurement noise $\sigma_v=3\,\mathrm m$. After $40$ measurements (true final range $580\,\mathrm m$):

| strategy | $\hat r$ | error | $P_{rr}$ | $|\text{error}|/\sigma_r$ | $\hat c$ |
| --- | --- | --- | --- | --- | --- |
| ignore | $586.69\,\mathrm m$ | $+6.69\,\mathrm m$ | $0.34\,\mathrm{m^2}$ | $11.5$ | (n/a) |
| consider | $582.77\,\mathrm m$ | $+2.77\,\mathrm m$ | $18.93\,\mathrm{m^2}$ | $0.64$ | $0.00$ |
| augment | $581.85\,\mathrm m$ | $+1.85\,\mathrm m$ | $18.25\,\mathrm{m^2}$ | $0.43$ | $4.87\,\mathrm m$ |

Ignoring the bias absorbs essentially all of it into $\hat r$'s own error and reports a covariance far too small to admit it — $11.5$ standard deviations off, a badly inconsistent filter by the Kalman filter module's own NEES-style standard. Considering it fixes the consistency completely ($0.64\sigma$) without ever pretending to know $c$. Augmenting does slightly better still ($0.43\sigma$, and a real, if incomplete, bias estimate $4.87\,\mathrm m$ against the true $6\,\mathrm m$) — but notice the price: $\hat r$ and $\hat c$ end up correlated at $-0.991$, nearly total confounding, because a single range-plus-constant-offset measurement genuinely cannot fully separate "the target is $1\,\mathrm m$ farther away" from "the sensor reads $1\,\mathrm m$ short."
:::

```python
import numpy as np

rng = np.random.default_rng(13)
dt, a = 1.0, 2.0
sigma_v, sigma_c_prior, c_true, r0_true = 3.0, 8.0, 6.0, 500.0

r = r0_true; zs = []
for k in range(40):
    r += a*dt
    zs.append(r + c_true + rng.normal(0, sigma_v))
zs = np.array(zs)

r_hat, P = r0_true, 5.0**2
for z in zs:
    r_hat += a*dt; P += 0.01
    S = P + sigma_v**2; K = P/S
    r_hat += K*(z-r_hat); P = (1-K)*P
print('ignore  ', r_hat, P)

x, Pj = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
for z in zs:
    x = x + np.array([a*dt, 0.0]); Pj = Pj + np.diag([0.01, 0.0])
    H = np.array([1.0, 1.0]); S = H@Pj@H.T + sigma_v**2
    Kfull = Pj@H.T/S; K = np.array([Kfull[0], 0.0])
    x = x + K*(z - H@x)
    Pj = Pj - np.outer(K, H@Pj) - np.outer(Pj@H, K) + np.outer(K, K)*S
print('consider', x, Pj[0, 0])

x2, Pj2 = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
for z in zs:
    x2 = x2 + np.array([a*dt, 0.0]); Pj2 = Pj2 + np.diag([0.01, 0.0])
    H = np.array([1.0, 1.0]); S = H@Pj2@H.T + sigma_v**2
    K = Pj2@H.T/S
    x2 = x2 + K*(z - H@x2); Pj2 = (np.eye(2)-np.outer(K, H))@Pj2
print('augment ', x2, Pj2[0, 0], Pj2[1, 1], Pj2[0, 1]/np.sqrt(Pj2[0, 0]*Pj2[1, 1]))
# ignore   586.686... 0.3387...
# consider [582.768...   0.        ] 18.925...
# augment  [581.845...   4.874...] 18.254... 18.158... -0.991...
```

## Does more data resolve the bias fully?

::: example Five times the data, essentially the same bias uncertainty
Extend the identical scenario to $200$ measurements instead of $40$, everything else unchanged. If the bias were merely *slow* to resolve — a matter of needing more data — a much longer run should shrink $P_{cc}$ substantially.

| measurements | augmented $P_{cc}$ | augmented $\hat c$ error |
| --- | --- | --- |
| $40$ | $18.16\,\mathrm{m^2}$ | $-1.13\,\mathrm m$ |
| $100$ | $18.14\,\mathrm{m^2}$ | $-1.67\,\mathrm m$ |
| $200$ | $18.13\,\mathrm{m^2}$ | $-1.33\,\mathrm m$ |
| $400$ | $18.13\,\mathrm{m^2}$ | $-1.43\,\mathrm m$ |

$P_{cc}$ has essentially stopped moving by $100$ measurements and stays there through $400$ — a tenfold increase in data beyond that point buys no further reduction at all, and $\hat c$'s error wanders around roughly the same $1$–$1.7\,\mathrm m$ band rather than shrinking toward zero. This is not a filter that needs more patience; the bias and the range genuinely cannot be fully separated by this measurement geometry, at *any* amount of data, and the covariance has correctly converged to a steady state that reflects exactly how much residual ambiguity a constant-offset-plus-drifting-range problem actually leaves. Consistently, at $200$ steps, ignore is still badly overconfident ($10.98\sigma$ off), while consider ($0.64\sigma$) and augment ($0.28\sigma$) both remain honest — augment's point estimate is again somewhat better, at the cost of the same near-total $r$–$c$ correlation.
:::

```python
import numpy as np

dt, a = 1.0, 2.0
sigma_v, sigma_c_prior, c_true, r0_true = 3.0, 8.0, 6.0, 500.0
rng2 = np.random.default_rng(13)   # one continuing generator, reused (not reset) across the four runs below

for nsteps in [40, 100, 200, 400]:
    r = r0_true; zs2 = []
    for k in range(nsteps):
        r += a*dt
        zs2.append(r + c_true + rng2.normal(0, sigma_v))
    x3, Pj3 = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
    for z in zs2:
        x3 = x3 + np.array([a*dt, 0.0]); Pj3 = Pj3 + np.diag([0.01, 0.0])
        H = np.array([1.0, 1.0]); S = H@Pj3@H.T + sigma_v**2
        K = Pj3@H.T/S
        x3 = x3 + K*(z - H@x3); Pj3 = (np.eye(2)-np.outer(K, H))@Pj3
    print(nsteps, x3[1]-c_true, Pj3[1, 1])
# 40  -1.126 18.158
# 100 -1.666 18.135
# 200 -1.328 18.135
# 400 -1.432 18.135
```

::: key When to consider, and when to augment
Consider when a parameter is poorly observable and estimating it risks **windup** — the filter chasing noise into a direction the data cannot actually pin down, and in doing so distorting the states that matter. Augment when the parameter is genuinely observable enough that the filter's estimate will converge to something useful, as the Multiplicative EKF's gyro bias did with two vector sensors. The correlation between the parameter and the states it is confounded with — $-0.991$ here — is the single most direct warning sign of the first case.
:::

::: warning A converged-looking bias estimate is not proof the bias is well observed
The augmented filter's $\hat c=4.87\,\mathrm m$ after $40$ measurements looks like a converged, useful estimate — it is a real number, well inside the prior's range, that did not move much by $200$ measurements. The $P_{cc}$ plateau in this lesson's second example shows why that stability is not the same as accuracy: the estimate has stopped moving because the filter has extracted essentially everything the geometry allows, not because it has found the true value. Reading "the number changed little over hundreds of cycles" as "the number is now correct" is exactly the mistake a consider strategy's explicit refusal to update $c$ at all makes structurally impossible.
:::

::: warning "Consider" does not mean "ignore, but honest" — it uses the correlation actively
The consider filter's $r$-update still benefits from the joint covariance's cross-term with $c$ even though $c$ itself is never updated — the gain on $r$ in the worked example ($K_r\approx0.36$ by the later steps, larger than the ignore filter's would be) reflects the full joint uncertainty, not merely $r$'s own marginal variance. This is why consider outperforms ignore substantially on the point estimate too ($2.77\,\mathrm m$ against $6.69\,\mathrm m$ final error), not only on consistency — treating a nuisance parameter's uncertainty honestly changes how much the filter should trust each measurement, even before deciding whether to estimate that parameter directly.
:::

## Check yourself

::: check
State the one difference between the consider filter's update equations and the augmented filter's, given that both carry the identical joint state and covariance.
:::

::: answer
The only difference is the gain: the augmented filter uses the ordinary, unconstrained gain $\mathbf K=\mathbf P\mathbf H^{\mathsf T}\mathbf S^{-1}$ on every row of the joint state, while the consider filter computes the same joint gain but then forces the row corresponding to the nuisance parameter to zero before applying it — that parameter's own estimate never moves, even though its covariance and its cross-covariance with the other states continue to propagate and to shape how the *other* rows' gains are computed.
:::

::: check
In the first worked example, the ignore strategy's point estimate ($586.69\,\mathrm m$, error $+6.69\,\mathrm m$) was the *worst* of the three, while its reported uncertainty ($P_{rr}=0.34$) was the *smallest*. Explain why both of these are consequences of the same modeling choice.
:::

::: answer
Treating $c$ as exactly zero forces the filter to explain every measurement using $r$ alone, so the entire true bias gets folded into $\hat r$'s own error — exactly the worst-point-estimate result. The same modeling choice also removes $c$'s uncertainty from $\mathbf S$ entirely, so the filter's own gain computation believes the measurements are far more informative about $r$ than they actually are (since none of that information is being "spent" accounting for an unknown offset), producing an artificially small $P_{rr}$. Both symptoms trace back to the same root cause: a real source of measurement disagreement has been assumed away rather than modeled.
:::

::: check
A design team observes that their augmented filter's nuisance-parameter estimate has been essentially unchanged for the last several hundred cycles and concludes the parameter must now be well known. What check from this lesson would you recommend before accepting that conclusion?
:::

::: answer
Check whether the parameter's own reported variance ($P_{cc}$ in this lesson's notation) has actually shrunk over that same period, and check its correlation with the states it might be confounded with. The second worked example showed a case where the estimate stopped moving by $100$ measurements while $P_{cc}$ had already plateaued at a value far from zero — the estimate's stability reflected a converged, but incomplete, amount of information, not a well-determined parameter; only a shrinking, small $P_{cc}$ (and a correlation well away from $\pm1$) would support the "now well known" conclusion.
:::

::: check
Why might a filter designer choose "consider" over "augment" even for a parameter that is, in principle, fully observable given enough time?
:::

::: answer
Observability in principle does not guarantee good behavior during the transient before enough data has accumulated — an augmented filter can, in the short run, chase a poorly-constrained early estimate of the parameter in a way that temporarily distorts the states that matter more, an effect sometimes called estimator windup. A designer who cares more about the other states' behavior during that transient than about eventually recovering the parameter's true value might reasonably choose to consider it (or augment it only after enough data has arrived to make the early transient less risky), trading a fully accurate long-run bias estimate for protection against short-run misbehavior in the states the mission actually depends on.
:::

::: check
Suppose a second, independent sensor were added to this lesson's scenario — one with no bias of its own, measuring $r$ directly. Would you expect the $r$–$c$ correlation of $-0.991$ to persist under augmentation?
:::

::: answer
No — an unbiased, independent measurement of $r$ gives the filter a way to pin down $r$ without relying on the confounded sensor at all, which breaks the near-total degeneracy that produced the $-0.991$ correlation in the single-sensor scenario. With $r$ constrained from an independent source, the confounded sensor's residual disagreement can then be attributed to $c$ specifically, rather than being inherently ambiguous between the two; augmenting would become a substantially safer and more effective choice in that modified scenario than the near-total confounding this lesson's example demonstrated.
:::

## Summary

| Item | Statement |
| --- | --- |
| Ignore | No nuisance state; badly overconfident when the nuisance is real — $11.5\sigma$ off in this lesson's example |
| Consider | Joint state and covariance, gain forced to zero on the nuisance row; consistent ($0.64\sigma$), never claims to know the nuisance parameter |
| Augment | Joint state, ordinary gain on every row; best point estimate here ($0.43\sigma$), at the cost of near-total correlation ($-0.991$) with the confounded state |
| Structural vs data-limited | $200\to400$ measurements did not shrink $P_{cc}$ further (plateaued near $18.13\,\mathrm{m^2}$) — the ambiguity here is geometric, not a matter of insufficient data |
| Choosing between them | Check the correlation between the candidate parameter and the states it might be confounded with; strong correlation favors considering, weak correlation favors augmenting |

The next and final lesson in this module turns from a single filter's internal choices to a different kind of decision: when the dynamics themselves are not known in advance to follow one model, and a filter has to weigh several candidate models against each other in real time.
