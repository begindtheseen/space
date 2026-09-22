---
id: l03-when-and-why-the-ekf-diverges
title: When and why the EKF diverges
minutes: 19
covers:
  - When and why the EKF diverges
---

The Kalman filter module's filter-divergence lesson already showed a *linear* filter diverging, and the cause there was entirely about tuning: $\mathbf Q$ set too small relative to the truth, or an unmodeled acceleration the filter's dynamics model never accounted for. Fix the tuning, and that filter's divergence goes away completely — the update equations themselves were never at fault. This lesson is about a different, and in some ways more unsettling, kind of divergence: one that can occur even when $\mathbf Q$ and $\mathbf R$ are exactly right, the dynamics model is exact, and the only thing "wrong" is that the Extended Kalman Filter has to linearize $\mathbf H$ at its own current estimate, and that estimate is not yet the truth.

The mechanism is precise enough to demonstrate with real numbers, not just describe qualitatively, and that is what this lesson does: one bearings-only tracking run, correctly tuned in every respect the Kalman filter module would check, in which the EKF's covariance collapses by more than two orders of magnitude in a single update and never recovers — reporting, for the rest of the run, that it knows its position to within a couple of meters while it is actually wrong by twenty. The unscented Kalman filter lesson later in this module returns to this exact scenario and shows what changes when the linearization is replaced.

## The mechanism, precisely

Recall the EKF fundamentals lesson's warning: $\mathbf H_k$ is evaluated at $\hat{\mathbf x}_k^-$, the filter's own prediction, never at the unknown true state $\mathbf x_k$. Ordinarily this is a harmless approximation — $\hat{\mathbf x}_k^-$ is usually close enough to $\mathbf x_k$ that the local sensitivity computed at one is a fine stand-in for the other. Divergence of the kind this lesson studies happens when a single bad update pushes $\hat{\mathbf x}_k^-$ somewhere the *local* curvature of $\mathbf h$ is severe and unrepresentative of the region the true state actually occupies — and the filter, having no way to know this, computes $\mathbf S_k$ and $\mathbf K_k$ from that unrepresentative $\mathbf H_k$ as though it were perfectly trustworthy.

::: key The EKF divergence mechanism
An update evaluated at a poor estimate can produce a covariance collapse — $\mathbf P_k^+$ shrinking far more than the *true* uncertainty warrants — because $(\mathbf I-\mathbf K_k\mathbf H_k)\mathbf P_k^-$ is entirely a function of the linearized $\mathbf H_k$, which does not know it was evaluated somewhere unrepresentative. Once $\mathbf P^+$ is too small, every subsequent $\mathbf K$ is too small to correct it: the filter becomes closed to the very measurements that could fix the mistake. This is a positive-feedback loop the linear Kalman filter cannot exhibit, because a linear filter's $\mathbf H$ never depends on the estimate in the first place.
:::

Bearing-only tracking is a standard, hard test of exactly this failure, because its measurement Jacobian is not merely nonlinear — it is *unbounded*. With a bearing sensor at the origin and target position $(x,y)$, $\mathbf H = (-y/r^2,\ x/r^2,\ 0,\ 0)$ grows like $1/r$ as the target approaches the sensor, so any error that lands the filter's estimate near $r=0$ is an error landing exactly where a small position uncertainty maps, under the linearized model, to an enormous — and false — claim about how much the bearing measurement constrains position.

::: example A single run, correctly tuned, that still diverges
Track a target with true initial state $\mathbf x_0=(300,\,50,\,-11,\,-1)\,\mathrm{m,\,m,\,m/s,\,m/s}$ (constant velocity, mild process noise) using a stationary bearing sensor at the origin, $\sigma_\theta=2^\circ$, $\Delta t=1\,\mathrm s$, for 40 steps. Start the filter *exactly* at the truth, $\hat{\mathbf x}_0^+=\mathbf x_0$, with an honestly-sized (not overconfident) prior $\mathbf P_0^+=\operatorname{diag}(60^2,60^2,2^2,2^2)$. $\mathbf Q$ and $\mathbf R$ match the simulation exactly — there is no tuning error anywhere in this filter.

| step | $r_{\text{true}}\,(\mathrm m)$ | position error $(\mathrm m)$ | NEES | $\operatorname{tr}\mathbf P$ (position block) |
| --- | --- | --- | --- | --- |
| 20 | 88.90 | 42.28 | 0.91 | 3340.2 |
| 24 | 46.31 | 26.91 | 0.34 | 3271.0 |
| 25 | 35.88 | 31.74 | 1.13 | 1587.1 |
| 26 | 25.53 | 16.50 | 3.94 | 965.5 |
| 27 | 15.53 | 6.44 | **519.29** | **2.50** |
| 28 | 7.58 | 2.13 | 510.73 | 2.95 |
| 29 | 10.24 | 9.38 | 432.52 | 1.08 |
| 30 | 19.64 | 4.33 | 184.56 | 0.72 |
| 35 | 71.66 | 15.94 | 137.98 | 3.31 |
| 40 | 122.70 | 26.42 | 97.38 | 11.70 |

Look at the transition from step 26 to step 27. At step 26 the filter's *predicted* position was $(53.96,\,21.14)$, giving $\hat r=57.95\,\mathrm m$ against a true range of only $25.53\,\mathrm m$ — the estimate is roughly twice as far out as the target actually is, a real but not extreme error given $\operatorname{tr}\mathbf P\approx1643$ (position standard deviation around $29\,\mathrm m$ per axis) at that point. The measurement update at step 26, using $\mathbf H$ evaluated at that still-moderate $\hat r$, applies a large but plausible correction — and **overshoots**, landing the new predicted position for step 27 at $(-3.94,\,5.49)$: past the observer entirely, at $\hat r=6.76\,\mathrm m$. $\mathbf H$ evaluated there has magnitude $0.148\,\mathrm{rad/m}$, roughly nine times larger than at step 26. The filter's own math now says a modest remaining position uncertainty implies an enormous predicted spread in bearing — $\mathbf S=20.1\,\mathrm{rad^2}$, larger than the entire physically possible range of a bearing angle — which makes the actual $-86.3^\circ$ innovation look, to the linearized model, like an unsurprising draw from a wide distribution rather than the glaring geometric impossibility ("the observer is not where I placed it") that it actually is. The update responds with a *small*, confident correction and a **99.7% collapse** in reported position covariance, from $994.1$ to $2.5$. From that point on $\mathbf K$ is too small to undo the mistake: true position error stabilizes around $15$–$26\,\mathrm m$ for the rest of the run while the filter insists, via a covariance trace under $12$, that it knows its position to within a few meters.
:::

```python
import numpy as np

def wrap(a): return (a+np.pi) % (2*np.pi) - np.pi
def h(x): return np.arctan2(x[1], x[0])
def Hjac(x):
    r2 = x[0]**2+x[1]**2
    return np.array([-x[1]/r2, x[0]/r2, 0.0, 0.0])

dt = 1.0
F = np.array([[1,0,dt,0],[0,1,0,dt],[0,0,1,0],[0,0,0,1]])
q = 0.01
Q = q*np.array([[dt**3/3,0,dt**2/2,0],[0,dt**3/3,0,dt**2/2],
                [dt**2/2,0,dt,0],[0,dt**2/2,0,dt]])
sigma_th = np.radians(2.0); R = sigma_th**2

rng = np.random.default_rng(7)
x_true = np.array([300.0, 50.0, -11.0, -1.0])
x = x_true.copy(); P = np.diag([60.0**2,60.0**2,2.0**2,2.0**2])
for k in range(40):
    x_true = F@x_true + rng.multivariate_normal(np.zeros(4), Q)
    z = h(x_true) + rng.normal(0, sigma_th)
    xm = F@x; Pm = F@P@F.T + Q
    Hm = Hjac(xm)
    S = Hm@Pm@Hm.T + R
    K = Pm@Hm.T/S
    x = xm + K*wrap(z-h(xm))
    P = (np.eye(4)-np.outer(K,Hm))@Pm
    if k+1 in (26, 27):
        print(k+1, np.round(xm[:2],2), np.hypot(*xm[:2]), np.trace(P[:2,:2]))
# 26 [53.96 21.14] 57.95... 965.54...
# 27 [-3.94  5.49] 6.76...  2.50...
```

## It is not always this dramatic — and that is the point

::: example Fifty independent trials, correctly tuned, same geometry
Repeat the identical scenario across 50 independent noise realizations (same true trajectory statistics, independent measurement and process noise draws), and look at the last ten steps' mean NEES for each run: median $3.84$ — right where a healthy, consistent, four-state filter's NEES should sit — but a *mean* of $49.17$, dragged there entirely by a minority of runs. Flagging any run whose late-time mean NEES exceeds $20$ (five times the ideal value of $4$) as diverged catches $5$ of the $50$ runs — a $10\%$ rate — including one whose mean NEES over its last ten steps is $1813.6$: a filter confidently claiming a precision more than forty times better than its actual error.
:::

The median run in that batch is fine. A filter that happens to avoid landing near $r=0$ at a moment of large uncertainty tracks the target correctly and reports a covariance that matches its real performance, exactly as the linear Kalman filter module's consistency-testing lesson would want. That is the uncomfortable shape of this failure mode: it is not that the EKF is *usually* wrong on this problem, it is that it is *occasionally, catastrophically, and silently* wrong, in a way that a single test run — or a single flight — has a real chance of never encountering, and a real chance of walking straight into. A consistency campaign run over only a handful of trials could easily conclude this filter is fine.

::: key Divergence here is a tail-risk problem, not an average-case one
Across the fifty-trial batch, the *median* behavior looked perfectly healthy; the *mean* was dominated by rare, severe covariance collapses. A design review that checks only a few Monte Carlo runs, or only summary statistics like mean RMSE, can miss exactly the failure mode that matters most for a safety-critical system: the rare run where the filter is confidently, catastrophically wrong.
:::

::: warning This is a different mechanism from mistuned process noise
The Kalman filter module's process-noise-tuning and filter-divergence lessons showed divergence caused by $\mathbf Q$ or $\mathbf R$ not matching reality — fixable by better tuning, and detectable by exactly the kind of consistency testing that module built. Nothing here is mistuned: $\mathbf Q$ and $\mathbf R$ are exactly correct, and the dynamics model is exact. The cause is purely that $\mathbf H$ is evaluated at an estimate rather than the truth, and no amount of retuning $\mathbf Q$ or $\mathbf R$ removes that gap — the only real remedies are ones that change *how the transformation itself is approximated*, which is exactly where this module goes next.
:::

::: warning A covariance collapse looks, briefly, like great filter performance
Immediately after the step-27 update in the worked example, $\operatorname{tr}\mathbf P$ fell to $2.5$ — read in isolation, on a dashboard with no ground truth available, that looks like a filter that has just nailed down the target's position with unusual confidence. Distinguishing "the filter just got much better information" from "the filter just linearized somewhere it should not have" from telemetry alone is exactly why the consistency-testing lesson's NIS test — built entirely from quantities a real flight computer has, no truth required — exists; a sudden, large drop in reported covariance is a moment to check NIS, not a moment to celebrate.
:::

## Check yourself

::: check
Explain, using the specific numbers from the worked example, why the update at step 26 produced an *overshoot* rather than simply a correction of the right size.
:::

::: answer
At step 26 the predicted position was about twice as far from the observer as the truth, with $\operatorname{tr}\mathbf P\approx1643$ still fairly large; the resulting gain, computed from $\mathbf H$ at that still-moderate range, was large enough to move the estimate a long way in one step — and it moved it past the observer entirely, to a predicted range of only $6.76\,\mathrm m$ for the next step, rather than landing near the true range of $25.53\,\mathrm m$. The update was reacting correctly, in linear-model terms, to a real innovation; it simply had no way to know that the correction it computed, applied to a genuinely curved measurement function, would carry the estimate into a region where that same linear model becomes a much worse approximation than it was where the correction was computed.
:::

::: check
Why does a covariance collapse, once it happens, tend to persist rather than self-correct at the next update?
:::

::: answer
The gain $\mathbf K_k=\mathbf P_k^-\mathbf H_k^{\mathsf T}\mathbf S_k^{-1}$ scales with $\mathbf P_k^-$; once $\mathbf P^+$ has collapsed, the next cycle's $\mathbf P_k^- = \mathbf F\mathbf P_{k-1}^+\mathbf F^{\mathsf T}+\mathbf Q$ starts from that same small value (plus one cycle's modest $\mathbf Q$), so the next gain is also small, and the update can only make a small correction regardless of how large the actual innovation is. The filter has, in effect, locked its own door: it no longer trusts new measurements enough to let them move the estimate far, which is exactly why the true error in the worked example stabilizes around $15$–$26\,\mathrm m$ instead of shrinking back down after the bad step.
:::

::: check
A flight team runs this exact filter once before launch, on one Monte Carlo trial, and observes healthy-looking NEES throughout. Is this reasonable evidence that the filter is safe to fly?
:::

::: answer
No, not by itself. The fifty-trial batch in this lesson showed a $10\%$ rate of severe covariance collapse under identical tuning and geometry — a single trial has roughly a nine-in-ten chance of looking exactly like a healthy filter even though the underlying failure mode is real and present. This is precisely why the consistency-testing lesson insisted on many independent runs before drawing a conclusion, and it is a sharper illustration of why: a rare, catastrophic failure mode can be statistically invisible in a small sample while still being operationally unacceptable.
:::

::: check
Suppose the same tracking problem were run with a sensor measuring **range** instead of bearing, $h(\mathbf x)=\sqrt{x^2+y^2}$. Would you expect the same near-the-origin divergence mechanism to be as severe? Why or why not.
:::

::: answer
Less severe, on the evidence of how each Jacobian behaves near $r=0$: the bearing Jacobian's magnitude scales like $1/r$ and genuinely blows up as the target approaches the sensor, which is exactly the mechanism that made a modest position error near the origin translate into an enormous, false claim of information. The range Jacobian, $\mathbf H=(x/r,\,y/r,\,0,\,0)$, is a *unit* vector for every $r>0$ — its magnitude never grows without bound, so while range measurements are still nonlinear and can still be linearized at a poor estimate, the specific unbounded-sensitivity-near-the-origin mechanism that drove this lesson's example would not appear in the same form.
:::

::: check
The worked example's filter started with the estimate placed exactly at the truth. Does this mean a poor initial guess is not actually necessary for this kind of divergence?
:::

::: answer
Correct — and that is the more unsettling reading of the example. Divergence here did not require a bad prior; it required only that the filter's estimate, through ordinary prediction and correctly-computed updates, passed close enough to the sensor for the measurement's own curvature to overwhelm a single linearization. A perfect initial condition reduces how often this happens (fewer of the fifty trials would diverge with an even better-informed start), but it does not eliminate the underlying mechanism, since the estimate can still wander into a badly-curved region purely through the ordinary combination of process noise and measurement noise along the way.
:::

## Summary

| Item | Statement |
| --- | --- |
| Divergence mechanism | $\mathbf H_k$ evaluated at a poor $\hat{\mathbf x}_k^-$ can produce an update that collapses $\mathbf P_k^+$ far below the true uncertainty; the resulting small $\mathbf K$ then prevents later measurements from correcting the mistake |
| Contrast with linear-filter divergence | Not a tuning problem: $\mathbf Q$, $\mathbf R$, and the dynamics model can all be exactly correct and this mechanism still occurs, because it comes from linearizing about the estimate, not from misjudging noise levels |
| Worked case | Bearings-only tracking, correctly tuned; one update collapsed $\operatorname{tr}\mathbf P$ by $99.7\%$ (from $994.1$ to $2.5$) after the estimate overshot past the observer; late-time NEES reached $519$ against an ideal value of $4$ |
| Statistical character | $50$-trial batch: median NEES $3.84$ (healthy), mean $49.17$ (dominated by outliers), $10\%$ of runs exceeding five times the ideal NEES — a tail-risk failure, easy to miss in a small sample |
| Detecting it live | A sudden, large drop in reported covariance is exactly the moment to run the consistency-testing lesson's NIS check, which needs no ground truth |

Two remedies to this specific failure appear later in this module: the unscented Kalman filter, which replaces the single linearization with several actual evaluations of the true nonlinear $\mathbf h$ and is shown, on this identical scenario, not to exhibit this collapse; and the particle filter, for problems where even that is not enough because the posterior is not well described by one Gaussian at all. The next lesson builds the first of those two tools from the ground up.
