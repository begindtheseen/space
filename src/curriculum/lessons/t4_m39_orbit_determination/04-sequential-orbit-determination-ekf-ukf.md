---
id: l04-sequential-orbit-determination-ekf-ukf
title: Sequential orbit determination with EKF and UKF
minutes: 16
covers:
  - Sequential orbit determination with EKF and UKF
---

Batch orbit determination waits: it collects an entire arc, then produces one answer. Real operations often cannot wait — a collision-avoidance screen needs the latest state the moment new tracking data lands, and an onboard navigation computer has no arc to wait for at all, only a stream of measurements arriving one at a time. Sequential orbit determination answers each new observation as it arrives, updating a running state and covariance rather than re-fitting everything from scratch.

The filter itself is not new: it is the Extended Kalman Filter (EKF) the nonlinear-filters module already built in full — the predict step propagating the state and covariance through the dynamics, the update step correcting them against a new measurement, both linearized about the current estimate. That derivation is not repeated here. What is specific to orbit determination is the state-space model those steps operate on, how the resulting sequential estimate relates to the batch estimate of the previous lessons, and where a sequential filter can fail in a way that batch, iterating the whole arc together, does not.

## The state-space model, restated for OD

The state is the same epoch-relative object as the batch lessons: position and velocity (and, when needed, solve-for parameters), propagated between measurements by the same nonlinear dynamics and the same state transition matrix $\boldsymbol\Phi$ from two lessons ago. The predict step advances both the state estimate and its covariance one step — from the last processed time to the next measurement's time, however far apart that is — and the update step is the same weighted correction the batch normal equations were built from, applied to a single new measurement (or a small batch of simultaneous ones, such as a range and range-rate pair from the same look) instead of accumulated across an entire arc:

::: key EKF predict/update for orbit determination (recap; derived in full in the nonlinear-filters module)
Predict: $\hat{\mathbf x}^-=\mathbf x(\text{propagated})$, $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$. Update: $\mathbf y=\mathbf z-\mathbf h(\hat{\mathbf x}^-)$, $\mathbf S=\mathbf H\mathbf P^-\mathbf H^\mathsf T+\mathbf R$, $\mathbf K=\mathbf P^-\mathbf H^\mathsf T\mathbf S^{-1}$, $\hat{\mathbf x}^+=\hat{\mathbf x}^-+\mathbf K\mathbf y$, $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-(\mathbf I-\mathbf K\mathbf H)^\mathsf T+\mathbf K\mathbf R\mathbf K^\mathsf T$ (Joseph form). $\mathbf H$ is evaluated at the current estimate, exactly as $\mathbf H_i(t_i)$ was in the batch lesson; $\boldsymbol\Phi$ comes from the same variational equations.
:::

The one genuine OD-specific choice is $\mathbf Q$: two-body (and J2) dynamics have no random forcing of their own, so a filter that trusts its dynamics completely would run with $\mathbf Q=\mathbf 0$. Real filters rarely do — unmodelled forces are always present to some degree — but tuning $\mathbf Q$ properly is the subject of the next lesson; here $\mathbf Q$ is kept small and the dynamics genuinely match the simulated truth, so its role stays in the background while the comparison to batch is the focus.

## A sequential fit that matches the batch answer

::: example Recursion, watched directly
The same $420\,\mathrm{km}$ orbit and three-pass, twelve-hour tracking scenario as the batch lesson, started this time from a starting error of $105\,\mathrm m$ in position and $58\,\mathrm{mm/s}$ in velocity — the quality of fit a short preliminary arc might already provide, not the raw multi-kilometre output of Gibbs or Gauss. Processing range and range-rate one scalar measurement at a time:

```python
# idx    t (s)     |pos error| (m)   sigma_pos (m)
#   0   11120.0        130.0             90.4
#   1   11130.0       4282.8             39.8   <- linearization catches up after the big first step
#   5   11170.0       1883.5             21.5
#  20   11320.0        647.9             10.1
#  36   11480.0         46.5             20.8   <- end of pass 1
#  50   17070.0         43.0              0.8   <- deep into pass 2, well converged
#  72   34500.0        107.3              2.5   <- right after the ~4.8-hour blind coast to pass 3
# 100   34780.0          2.1              0.6
# 110   34880.0          0.9              0.5   <- last observation
```

Both the actual error and the filter's own reported uncertainty fall by roughly three orders of magnitude over the run, with a visible bump immediately after each gap (the propagated uncertainty grows during a blind coast, exactly as it must) followed by rapid tightening once new data arrives. Mapped back to the epoch with the same $\boldsymbol\Phi$ used throughout, the final state disagrees with the batch fit of the previous lessons by $5.0\,\mathrm m$ in position and $6.7\,\mathrm{mm/s}$ in velocity — both estimators processing the identical data, arriving at the same orbit to within a few metres, using unrelated computational paths. Even the *reported* uncertainties agree closely: EKF epoch sigma $(0.205,\,0.114,\,0.097)\,\mathrm m$ against batch's $(0.204,\,0.114,\,0.096)\,\mathrm m$ in position, and comparably close in velocity — strong evidence that both are extracting the same information from the same measurements, not merely landing near the same answer by chance.
:::

## Where a sequential filter can fail and batch does not

Batch least squares can start from a genuinely rough guess — the previous lessons started three kilometres and $2.7\,\mathrm{m/s}$ off — because it iterates the *entire* arc together: a bad first linearization only produces a large correction, and the next iteration re-propagates and re-linearizes from a better point. A sequential filter gets no such second chance at each step; it commits to a correction based on the linearization available *at that instant* and moves on.

::: example The same rough starting guess can break a plain EKF
Feeding the identical EKF above the batch lesson's actual starting error — three kilometres in position, $2.7\,\mathrm{m/s}$ in velocity, uncorrected across the nearly two full orbits of blind coast before the first observation — does not converge to a rough-but-usable answer the way it did with a $105\,\mathrm m$ start:

```python
# same EKF code, only the starting error changed:
#   dx0 (good, above):  |dr0| = 105 m,    |dv0| = 0.058 m/s -> converges to a few metres
#   dx0 (rough, batch's own starting guess): |dr0| = 3905 m, |dv0| = 2.693 m/s
#   final epoch state error: thousands of kilometres in every component
#   final formal sigma: centimetres -- confidently wrong, not honestly uncertain
```

The batch fit, given the exact same rough start and the exact same data, still converges to sub-metre accuracy (the previous lessons showed it explicitly), because six iterations of Gauss-Newton over the whole arc can recover from a poor first linearization in a way that one forward pass through an EKF cannot. This result is reproducible on this exact scenario, not a one-off fluke of a particular noise draw: the starting error, not the random measurement noise, is what breaks the filter.
:::

This is not a flaw in the Kalman filter's derivation — it is a mismatch between what plain EKF linearization can be asked to survive and what was asked of it. A perturbation large enough, propagated across enough of the nonlinear dynamics before any measurement corrects it, can leave the reference trajectory the filter is linearizing about too far from the truth for a single first-order correction to recover; each subsequent step then linearizes about a still-biased state and reinforces the error rather than removing it. The remedy used operationally is exactly what the recursion example above already assumed: seed a sequential filter from a state good enough for local linearization to be trustworthy — typically a short batch fit of the first available data, or the tail end of a longer batch solution — and reserve raw IOD output, with all its roughness, as the batch lesson's starting point instead. A more aggressively nonlinear-robust option, the iterated EKF, re-linearizes within a single update until the correction stabilizes (the nonlinear-filters module covers it); it helps with a stale linearization *at one instant*, but it does not replace re-examining the whole arc together the way batch iteration does.

::: warning Numerical conditioning bites sequential filters too
Processing many highly precise measurements from a single fixed geometry in quick succession can, over enough updates, shrink the covariance's smallest eigenvalue toward the edge of double-precision representation — the same kilometres-and-seconds sensitivity the batch lesson met in $\boldsymbol\Lambda$, now affecting $\mathbf P$ update by update instead of once. Joseph form (used above) is more forgiving than the naive $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-$ update, but it is not immune. This is precisely why the Kalman filter module built square-root and UD-factorized forms: they propagate a factor of $\mathbf P$ that cannot represent a negative eigenvalue at all, however small the true uncertainty in some direction becomes. A sequential OD filter processing dense, high-precision tracking is exactly the setting those forms exist for.
:::

## The unscented alternative

Nothing about orbit determination requires the EKF's linearization specifically. The Unscented Kalman Filter propagates a small set of deterministically chosen sigma points through the *exact* nonlinear dynamics and measurement functions instead of through a linearized $\boldsymbol\Phi$ and $\mathbf H$, capturing the mean and covariance to second order without ever forming a Jacobian — the full construction, and why it typically outperforms the EKF under strong nonlinearity, is the nonlinear-filters module's own subject. For orbit determination specifically, the UKF's appeal shows up precisely in the failure mode above: a poorly known state propagated across a long, nonlinear coast is exactly the regime where sigma points — which sample the *actual* spread of plausible states rather than trust a single linearization of it — degrade more gracefully than the EKF does. The cost is proportional to propagating $2n+1$ trajectories instead of one reference trajectory plus its STM, which matters more for a large solve-for state (many consider or bias parameters) than for the six-to-ten states typical of a single-object OD filter.

::: key Batch versus sequential
Batch: every measurement in the arc at once, iterated with Gauss-Newton, tolerant of a rough starting guess because it can re-linearize the whole arc; the natural choice for definitive, offline orbit determination. Sequential (EKF/UKF): one measurement (or one look) at a time, real-time and onboard-capable, but each step commits to its local linearization — it needs a trustworthy starting point and careful process-noise and numerical-conditioning treatment to stay that way. Operational systems routinely run both: a periodic batch solution to anchor accuracy, a sequential filter to stay current between batch runs.
:::

## Check yourself

::: check
Explain, in terms of what each estimator re-linearizes and when, why batch least squares recovered a three-kilometre starting error on the same data that made the plain EKF above diverge.
:::

::: answer
Batch re-linearizes the *entire* reference trajectory at every iteration: after a bad first correction it re-propagates from the new epoch guess, recomputes $\boldsymbol\Phi$ along that new trajectory, and re-solves, so a poor first linearization only costs an extra iteration or two. The EKF linearizes once, locally, at each measurement time, using whatever state the filter currently holds; if the state is still far from the truth when the first measurement arrives, that single linearization is unreliable, and the correction it produces can move the filter to an even less trustworthy point for the *next* linearization, with no mechanism to go back and try again from a fresh whole-arc guess.
:::

::: check
The recursion example shows the reported position sigma jump from about $0.8\,\mathrm m$ (end of pass 2) to $2.5\,\mathrm m$ immediately after the gap into pass 3, before falling again. Is this growth a sign of a problem?
:::

::: answer
No — it is exactly what a correctly functioning predict step should do. With no new measurements during a $4.8$-hour blind coast, the covariance can only grow (through $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$, with $\boldsymbol\Phi$ over a long, uncorrected interval carrying real uncertainty forward, and $\mathbf Q$ adding a little more); a covariance that stayed at $0.8\,\mathrm m$ through a gap with no data would be the one to distrust, since nothing supports that much confidence with no new information. The point is that it shrinks rapidly again once pass 3's measurements arrive, exactly as the earlier gaps in pass 1 and pass 2 showed.
:::

::: check
Why does Joseph form help against the numerical conditioning problem described in this lesson, and why is it not a complete fix?
:::

::: answer
Joseph form, $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-(\mathbf I-\mathbf K\mathbf H)^\mathsf T+\mathbf K\mathbf R\mathbf K^\mathsf T$, writes the updated covariance as a sum of two terms that are each, by construction, positive semi-definite (a matrix congruent to $\mathbf P^-$, plus $\mathbf K\mathbf R\mathbf K^\mathsf T$), so it is far less prone to producing a covariance with a small negative eigenvalue from round-off than the algebraically equivalent but numerically fragile $\mathbf P^+=(\mathbf I-\mathbf K\mathbf H)\mathbf P^-$. It is not a complete fix because the two terms are still computed and added in finite precision: if the true uncertainty in some direction becomes small enough relative to the covariance's largest eigenvalue, the subtraction implicit in forming $\mathbf I-\mathbf K\mathbf H$ can still erode that direction's precision after enough updates. Square-root and UD forms avoid this by never forming $\mathbf P$ directly at all.
:::

::: check
An engineer proposes replacing the EKF in this lesson with a UKF, expecting it to converge even from the three-kilometre starting error that broke the EKF. Is that expectation well founded?
:::

::: answer
Partially, and it should not be assumed automatically. The UKF avoids linearizing $\boldsymbol\Phi$ and $\mathbf H$ by propagating sigma points through the true nonlinear functions, so it degrades more gracefully than a single-linearization EKF when the initial spread is large — a genuine advantage in exactly this situation. But the sigma points still have to be propagated across the same long, uncorrected coast before any measurement helps, and if the initial covariance badly under-represents how spread out the true state distribution has become, the UKF's second-order accuracy does not fix a fundamentally wrong prior. It is a real improvement over the EKF here, not a guarantee that any starting error can be survived.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Predict: $\mathbf P^-=\boldsymbol\Phi\mathbf P^+\boldsymbol\Phi^\mathsf T+\mathbf Q$ | Same $\boldsymbol\Phi$ as the batch and variational-equations lessons |
| Update: $\mathbf K=\mathbf P^-\mathbf H^\mathsf T\mathbf S^{-1}$, Joseph form for $\mathbf P^+$ | Recap only — full derivation in the nonlinear-filters module |
| Batch vs. sequential agreement | Same data, same information, a few metres/mm·s⁻¹ apart when both are well-posed |
| Large initial error + long blind coast | Can make a plain EKF diverge where iterated batch still converges |
| Covariance growth during a data gap | Expected and correct; collapse without new data would be the red flag |
| Joseph form | More robust than the naive update, not immune to eigenvalue collapse under many precise updates |
| UKF | Sigma points through the true nonlinear model; more graceful under large initial spread, not a cure-all |

Both estimators in this lesson assumed the measurement noise and the dynamics were exactly as specified. The next lesson removes that assumption on the dynamics side: what happens, and what to do, when the real spacecraft is not following the model the filter was told to trust.
