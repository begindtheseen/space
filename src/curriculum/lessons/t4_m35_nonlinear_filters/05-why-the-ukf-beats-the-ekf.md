---
id: l05-why-the-ukf-beats-the-ekf
title: Why the UKF beats the EKF for strong nonlinearity, and the cost
minutes: 21
covers:
  - Why the UKF beats the EKF for strong nonlinearity, and the cost comparison
---

Two climbers go up the same easy wall, one tied to a rope and one not. On most days you could not tell them apart: same speed, same route, both reach the top. The rope only matters on the rare day someone slips. Judged on an ordinary day, the rope looks like extra weight. Judged on the bad day, it is the only thing that matters.

The EKF and the UKF are like that on a hard tracking problem. On a typical run they look similar. On the rare run where things go wrong, one of them collapses and the other does not. The EKF-diverges lesson left an EKF in exactly that state: tuned correctly in every way, it jumped past a bearing sensor and then reported a covariance hundreds of times too small for the rest of the run. This lesson takes the identical scenario — same true path, same measurements, same noise, same starting point — and runs the UKF from the last lesson beside it, step for step. Then it puts a price on the difference, because the UKF's extra points are not free, and an engineer has to choose between the two on evidence rather than reputation.

## The same collapse, replayed with the UKF

Here is the setup again. A target drives at nearly constant velocity past a sensor at the origin that measures only **bearing**, the direction to the target, with noise $\sigma_\theta = 2^\circ$ (read "sigma theta"). The state has $n = 4$ numbers: east and north position, east and north velocity. Both filters start exactly at the truth, with the same honest starting uncertainty, and $\mathbf Q$ and $\mathbf R$ match the simulation exactly. The UKF uses the scaled unscented transform with $\alpha = 10^{-3}$, $\beta = 2$, $\kappa = 0$, the settings in this module's exercise.

To judge a filter you need more than its error. You need to know whether its *reported* uncertainty matches its *real* error. That is what **[[NEES|nees]]** measures, the normalized estimation error squared: the error, measured in units of the filter's own claimed standard deviations, squared and summed over the state. For an honest four-state filter it averages about $4$. Far above $4$ means the filter is **overconfident**: it claims to know more than it does.

::: example Same data, two filters, at the moment that mattered
Recall the mechanism. At step 26 the EKF's predicted position was $57.95\,\mathrm m$ from the sensor when the target was really $25.53\,\mathrm m$ away. Its update overshot, and step 27's prediction landed only $6.76\,\mathrm m$ from the sensor, on the far side. The bearing's sensitivity grows like $1/r$, so there the Jacobian $\mathbf H$ was $57.95 / 6.76 \approx 8.6$ times larger than one step earlier. Now run both filters through the identical measurements. Errors are position errors; $\operatorname{tr}\mathbf P$ ("trace of P") is the sum of the two position variances, the filter's own [[claimed uncertainty|trace]], a measure of how uncertain the filter says it is.

| step | $r_{\text{true}}\,(\mathrm m)$ | EKF error $(\mathrm m)$ | UKF error $(\mathrm m)$ | EKF NEES | UKF NEES | EKF $\operatorname{tr}\mathbf P$ | UKF $\operatorname{tr}\mathbf P$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | 35.88 | 31.74 | 48.90 | 1.13 | 1.42 | 1587.1 | 2696.2 |
| 26 | 25.53 | 16.50 | 2.63 | 3.94 | 2.73 | 965.5 | 2087.7 |
| 27 | 15.53 | 6.44 | 11.48 | **519.29** | **1.96** | **2.50** | 1985.0 |
| 30 | 19.64 | 4.33 | 29.69 | 184.56 | 1.53 | 0.72 | 1559.8 |
| 35 | 71.66 | 15.94 | 2.13 | 137.98 | 2.63 | 3.31 | 108.6 |
| 40 | 122.70 | 26.42 | 1.84 | 97.38 | 1.99 | 11.70 | 230.7 |

Read step 27 first. The EKF's error is $6.44\,\mathrm m$, which looks good, but its covariance trace has crashed to $2.50\,\mathrm{m^2}$, so it claims an uncertainty of about a meter. Its NEES is $519.29$: its real error is more than twenty times its claimed standard deviation. The UKF's error is larger, $11.48\,\mathrm m$, but it says so: its trace is still $1985\,\mathrm{m^2}$ and its NEES is $1.96$.

Now read steps 30 to 40. The UKF is not more accurate at every instant — at step 30 its error is $29.69\,\mathrm m$ against the EKF's $4.33\,\mathrm m$. But it never collapses. From step 26 on, its NEES stays between about $1$ and $3$, a little under the ideal $4$, which means slightly cautious. As the target moves away and the geometry improves, the UKF keeps learning and reaches $1.84\,\mathrm m$ by step 40. The EKF is stuck at $26.42\,\mathrm m$: its tiny covariance makes its gain tiny, so it can no longer listen to the very measurements that would fix it.

Sanity check: a filter that says "I am within a meter" while $26\,\mathrm m$ off must have a NEES in the hundreds, and $97.38$ at step 40 is in that range.
:::

```python
import numpy as np

def wrap(a): return (a + np.pi) % (2*np.pi) - np.pi
def h(x): return np.arctan2(x[1], x[0])            # bearing from the sensor at the origin
def Hjac(x):
    r2 = x[0]**2 + x[1]**2
    return np.array([-x[1]/r2, x[0]/r2, 0.0, 0.0])

dt, q = 1.0, 0.01
F = np.array([[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]], float)
Q = q*np.array([[dt**3/3, 0, dt**2/2, 0], [0, dt**3/3, 0, dt**2/2],
                [dt**2/2, 0, dt, 0], [0, dt**2/2, 0, dt]])
sig = np.radians(2.0); R = sig**2

def sigma_points(x, P, alpha=1e-3, beta=2.0, kappa=0.0):
    n = len(x); lam = alpha**2*(n + kappa) - n
    S = np.linalg.cholesky((n + lam)*P)
    chi = np.vstack([x, x + S.T, x - S.T])          # rows: centre, +columns, -columns
    Wm = np.full(2*n + 1, 1/(2*(n + lam))); Wc = Wm.copy()
    Wm[0] = lam/(n + lam); Wc[0] = lam/(n + lam) + 1 - alpha**2 + beta
    return chi, Wm, Wc

def ekf_step(x, P, z):
    xm = F@x; Pm = F@P@F.T + Q
    H = Hjac(xm); S = H@Pm@H + R; K = Pm@H/S
    return xm + K*wrap(z - h(xm)), (np.eye(4) - np.outer(K, H))@Pm

def ukf_step(x, P, z):
    chi, Wm, Wc = sigma_points(x, P)
    X = chi@F.T; xm = Wm@X; D = X - xm
    Pm = (Wc*D.T)@D + Q                              # predict
    chi, Wm, Wc = sigma_points(xm, Pm)               # fresh points for the update
    Z = np.array([h(c) for c in chi])
    zm = h(xm) + Wm@wrap(Z - h(xm)); dz = wrap(Z - zm)
    Pzz = Wc@dz**2 + R; Pxz = (Wc*dz)@(chi - xm)
    K = Pxz/Pzz
    return xm + K*wrap(z - zm), Pm - np.outer(K, K)*Pzz

def trial(seed, steps=40):
    rng = np.random.default_rng(seed)
    xt = np.array([300.0, 50.0, -11.0, -1.0])
    P0 = np.diag([60.0**2, 60.0**2, 2.0**2, 2.0**2])
    xe, Pe, xu, Pu = xt.copy(), P0.copy(), xt.copy(), P0.copy()
    rows = []
    for k in range(1, steps + 1):
        xt = F@xt + rng.multivariate_normal(np.zeros(4), Q)
        z = h(xt) + rng.normal(0, sig)
        xe, Pe = ekf_step(xe, Pe, z); xu, Pu = ukf_step(xu, Pu, z)
        ee, eu = xe - xt, xu - xt
        rows.append((k, np.hypot(*ee[:2]), np.hypot(*eu[:2]),
                     ee@np.linalg.solve(Pe, ee), eu@np.linalg.solve(Pu, eu)))
    return rows

for r in trial(7):
    if r[0] in (27, 40):
        print(np.round(r, 2))
# [ 27.     6.44  11.48 519.29   1.96]
# [40.   26.42  1.84 97.38  1.99]

runs = [trial(s) for s in range(50)]
late_e = np.array([np.mean([r[3] for r in t[-10:]]) for t in runs])
late_u = np.array([np.mean([r[4] for r in t[-10:]]) for t in runs])
fin_e = np.array([t[-1][1] for t in runs]); fin_u = np.array([t[-1][2] for t in runs])
print(np.median(late_e).round(2), late_e.mean().round(2), late_e.max().round(2), (late_e > 20).sum())
print(np.median(late_u).round(2), late_u.mean().round(2), late_u.max().round(2), (late_u > 20).sum())
print(np.sqrt(np.mean(fin_e**2)).round(2), np.sqrt(np.mean(fin_u**2)).round(2),
      np.median(fin_e).round(2), np.median(fin_u).round(2))
# 3.97 52.93 1099.09 4
# 3.27 3.76 11.75 0
# 49.74 12.28 15.73 7.79
```

## The characteristic that decides

First, what the UKF does *not* change. Both filters describe their belief as one Gaussian — one mean and one covariance. The UKF is not a filter for lumpy, many-peaked, non-Gaussian beliefs; the [[particle filters|particle-bridge]] later in this module are. The only difference is **how a Gaussian is pushed through a curved function**.

The EKF asks: what does $\mathbf h$ look like at one point, to first order? Then it applies that one answer to the whole uncertainty ellipse. The UKF asks: what does $\mathbf h$ really do at several points spread across the ellipse? Then it uses whatever the answer really is at each.

So the question to ask of any problem is this. Draw the current uncertainty ellipse, a few standard deviations across. Over that whole region, does the function look like one straight line? At step 26 of the replay the answer was plainly no. The EKF's predicted position ellipse was long and thin, pointing almost straight at the sensor: about $40\,\mathrm m$ of standard deviation along the line of sight, around an estimate $58\,\mathrm m$ away. Less than one and a half standard deviations along that axis reached the sensor itself, where the bearing's sensitivity $1/r$ blows up. Across that one ellipse the slope of $\mathbf h$ changed by far more than a factor of ten. No single tangent line can describe a function like that, however carefully it is computed.

::: key What decides between the EKF and the UKF
The deciding question is how well a single linear approximation, taken at the current estimate, represents $\mathbf h$ (or $\mathbf f$) across the *whole spread* the current covariance describes — not only at the estimate itself. When the function bends noticeably within a few standard deviations, the EKF's mean is biased and its covariance too small, and the UKF, accurate to second order for any nonlinearity, does better. When the function is nearly straight across the spread, the two agree.
:::

::: warning Both are Gaussian filters
"The UKF handles non-Gaussian noise" is a common mix-up. It does not. Both filters carry exactly one mean and one covariance. If the true belief has two separate peaks — "the target is either here or over there" — both will average them into one blob that sits where neither peak is.
:::

## What the statistics say across many trials

One run is an anecdote. Run the same scenario [[fifty times|monte-carlo-campaign]] with fresh random noise each time (random seeds $0$ to $49$ in the code above). For each run, average the NEES over the last ten steps. For an honest filter that number should sit near $4$; call a run **diverged** if it is above $20$, five times the ideal.

::: example Fifty trials, and an honest reading of the advantage
| | EKF | UKF |
| --- | --- | --- |
| median late NEES | $3.97$ | $3.27$ |
| mean late NEES | $52.93$ | $3.76$ |
| worst late NEES | $1099.09$ | $11.75$ |
| runs diverged (late NEES above $20$) | $4/50$ | $0/50$ |
| final position error, RMS over runs | $49.74\,\mathrm m$ | $12.28\,\mathrm m$ |
| final position error, median | $15.73\,\mathrm m$ | $7.79\,\mathrm m$ |

Read the **[[median|median-mean]]** first: the middle run, half above and half below. The median NEES is $3.97$ for the EKF and $3.27$ for the UKF. On a typical run, both filters are honest about their uncertainty. The UKF's typical error is smaller, $7.79$ against $15.73\,\mathrm m$, so it is also more accurate on an ordinary day, by about a factor of two.

Then read the **worst** row: $1099.09$ against $11.75$. On the bad runs, the two filters are not in the same league. Four EKF runs in fifty ($8\%$) diverged; no UKF run did.

Finally, read the **mean** row, and notice how it lies. The EKF's mean NEES is $52.93$ — but no typical EKF run looks like that. The mean is dragged up by four runs with late NEES of $135$, $559$, $643$ and $1099$. The same thing inflates the EKF's RMS error to $49.74\,\mathrm m$. The EKF's real problem is not that it is bad every day; it is that it is occasionally, badly, silently wrong. The UKF removes that failure on this problem.
:::

These are the same kind of numbers the EKF-diverges lesson found with its own fifty runs, with the same shape: a healthy median and a mean wrecked by a few collapses.

## Pricing the difference

Now the cost. Count what each filter evaluates per cycle, for a state of size $n$.

- **EKF:** $\mathbf f$ once and $\mathbf h$ once, plus the Jacobians $\mathbf F$ and $\mathbf H$, worked out by hand or by finite differences.
- **UKF:** $\mathbf f$ at $2n+1$ sigma points for the predict step, and $\mathbf h$ at $2n+1$ points for the update. No Jacobians at all. Plus one matrix square root (a Cholesky factorization, about $n^3/3$ multiply-adds) to place the points.

::: key Cost comparison
The EKF evaluates $\mathbf f$ and $\mathbf h$ once each per cycle, plus a Jacobian of each. The UKF evaluates each at $2n+1$ sigma points and computes **no** Jacobian — for $n=4$, nine evaluations of each against the EKF's one. The UKF also needs a matrix square root, $O(n^3)$, at least once per cycle. The cost ratio is roughly $2n+1$ function evaluations against one evaluation plus a Jacobian, so within a small factor for moderate $n$.
:::

Whether nine calls instead of one matters depends entirely on what one call costs. For the bearing sensor here, $\mathbf h$ is one arctangent. Nine of them take a [[few microseconds|flight-cpu]], nothing next to everything else a flight computer does each cycle. The choice then rests only on accuracy and consistency.

It matters when $\mathbf f$ is expensive, like the orbit propagator in an **[[orbit determination|orbit-determination]]** filter, which integrates a detailed gravity and drag model for every call. Then the fair comparison is not "one call against $2n+1$". A hand-derived Jacobian of such a model is a big, error-prone job, so many teams compute it by **[[finite differences|finite-differences]]**, nudging each state in turn and re-running $\mathbf f$. That costs extra calls too.

::: example Fitting a filter into a time budget
An orbit-determination filter has $n = 6$ states (position and velocity). One call of its propagator takes $1.5\,\mathrm{ms}$ on the flight computer, and the filter must finish each cycle within $25\,\mathrm{ms}$.

**EKF with a forward-difference Jacobian.** One call at the estimate, plus one nudged call per state: $1 + n = 7$ calls, so $7 \times 1.5 = 10.5\,\mathrm{ms}$.

**EKF with central differences** (nudge each state both ways, more accurate): $2n + 1 = 13$ calls, so $13 \times 1.5 = 19.5\,\mathrm{ms}$.

**UKF.** $2n + 1 = 13$ sigma points: $19.5\,\mathrm{ms}$, the same as the central-difference EKF. The Cholesky factor of a $6 \times 6$ matrix is about $6^3/3 = 72$ multiply-adds, far below a microsecond.

So the UKF fits the budget, with $5.5\,\mathrm{ms}$ to spare. Against the forward-difference EKF it costs $19.5 / 10.5 \approx 1.86$ times as much. In general that ratio is $(2n+1)/(n+1)$, which is always below $2$, whatever $n$ is. Sanity check: for $n = 1$ it is $3/2$, and as $n$ grows it creeps up toward $2$ but never reaches it.

If the team had an analytic Jacobian that cost less than one propagator call, the EKF would be several times cheaper. If the model came as code from another group, with no Jacobian at all, the UKF is the one that needs no extra work.
:::

There is no universal winner on cost. There is only the cost of this $\mathbf f$ and this $\mathbf h$, weighed against how much the rare collapse would hurt on this vehicle.

::: warning "More accurate" is not the same as "always better"
On this problem the UKF's typical-day advantage is real but modest, and its big advantage is in the rare bad run. A design with a mild nonlinearity, a tight compute budget and a cheap analytic Jacobian may reasonably choose the EKF — and then prove, with many Monte Carlo runs and the consistency tests from the Kalman filter module, that the collapse never appears for its own geometry and noise. The UKF is the safer default when that proof is expensive or the failure is unacceptable. It is not a free upgrade.
:::

::: warning A UKF that does not diverge still has failure modes
The last lesson's negative-eigenvalue example came from a UKF on this very scenario: in two runs out of a thousand, the small-$\alpha$ weights near $\pm 10^6$ turned a close pass by the sensor into an invalid covariance. That is a different mechanism from the EKF's collapse, and a rarer one here, but it is real. Choosing the UKF trades one well-understood failure for another, which is why the square-root form and sensible weights come with it.
:::

## Check yourself

::: check
At step 27 of the replay, the UKF's position error was larger than the EKF's. Does that contradict the claim that the UKF handles this scenario better?
:::

::: answer
No. "Better" here means the filter's reported uncertainty matches its real error — consistency — not which point estimate happens to be closer at one instant.

At step 27 the UKF's error of $11.48\,\mathrm m$ came with an honestly large covariance and a NEES of $1.96$. The EKF's smaller $6.44\,\mathrm m$ came with a covariance trace of only $2.50\,\mathrm{m^2}$ and a NEES of $519.29$. The EKF was right by luck and sure of itself for no reason, and that false certainty is what locked it out of later corrections. One instant's raw error cannot tell you whether a filter's claims can be trusted; NEES (and NIS, which needs no truth) can.
:::

::: check
Using the fifty-trial table, explain why reporting only the mean NEES or the RMS error would give a misleading picture of the EKF.
:::

::: answer
The EKF's mean late NEES is $52.93$ and its RMS final error $49.74\,\mathrm m$. Both suggest a filter that is badly overconfident on a typical run. But the median late NEES is $3.97$, right at the ideal $4$: the typical EKF run is honest.

The mean is dominated by four runs (late NEES of $135$, $559$, $643$ and $1099$). Reporting only the mean would present a rare, severe failure as if it were everyday behavior — and would hide the real message, which is "usually fine, occasionally catastrophic". Reporting median, worst case and the count of diverged runs together tells the true story.
:::

::: check
For a bearing sensor whose value and Jacobian each cost a few floating-point operations, is the $2n+1$-against-one evaluation count likely to decide between the EKF and the UKF?
:::

::: answer
Not by itself. When $\mathbf h$ and its Jacobian are that cheap, nine evaluations instead of one cost a few microseconds, negligible next to the rest of the flight software each cycle. The decision then rests on accuracy and consistency, which the replay and the fifty trials measured directly.

The evaluation count becomes important only when $\mathbf f$ or $\mathbf h$ is itself expensive, such as a high-fidelity propagator, and even then the fair comparison includes what the EKF's Jacobian costs.
:::

::: check
A colleague says that since the UKF needs no Jacobian, it is strictly simpler to implement correctly than the EKF for any nonlinear model. Is that fair?
:::

::: answer
Partly. The UKF removes one whole class of bug — a wrong hand-derived or finite-differenced Jacobian, which is exactly what the EKF lesson's finite-difference check exists to catch.

But it brings its own: placing the sigma points correctly, keeping the $\alpha$, $\beta$, $\kappa$ weights and the square root consistent, averaging angles properly, and handling a covariance update that is not automatically guaranteed to stay valid. "No Jacobian" is a real simplification in one place, not a promise of fewer ways to go wrong overall.
:::

::: check
Suppose the bearing noise were $\sigma_\theta = 10^\circ$ instead of $2^\circ$, with everything else the same. Would you expect the EKF's collapse near the sensor to become more or less likely?
:::

::: answer
Less likely. The collapse started when a badly linearized $\mathbf H$ produced an overconfident, oversized update that threw the estimate close to the sensor. A larger $\sigma_\theta$ makes $\mathbf R$ bigger, and $\mathbf S = \mathbf H\mathbf P^-\mathbf H^{\mathsf T} + \mathbf R$ bigger with it. That shrinks the gain, so any single update moves the estimate less aggressively, and a big overshoot becomes rarer.

A simulation agrees: over $200$ runs of this scenario, $25$ EKF runs diverged at $2^\circ$ and $11$ at $10^\circ$. Note what did not change: the linearization is no more accurate than before. The filter is only less likely to jump into the region where the inaccuracy is severe.
:::

## Summary

| Item | Statement |
| --- | --- |
| Same-scenario replay | On the EKF-diverges trajectory the UKF never collapsed: NEES stayed between about $1$ and $3$ after step 26, and its error fell to $1.84\,\mathrm m$ while the EKF stayed stuck at $26.42\,\mathrm m$ |
| Deciding factor | How well one linearization at the estimate represents the function across the *whole* covariance spread |
| Both are Gaussian filters | The UKF changes how the Gaussian is pushed through $\mathbf h$ or $\mathbf f$, not whether one Gaussian is enough |
| Fifty trials | Median NEES close ($3.97$ vs $3.27$); worst case far apart ($1099$ vs $11.75$); $4/50$ EKF runs diverged, $0/50$ UKF |
| Cost | $2n+1$ evaluations of $\mathbf f$ and of $\mathbf h$ plus one Cholesky, and no Jacobian, against one evaluation plus a Jacobian |
| Against finite differences | UKF over forward-difference EKF is $(2n+1)/(n+1)$, always below $2$; equal to a central-difference EKF |

The EKF and the UKF both push one Gaussian through a curve; they differ only in how. The next lesson meets a third way of doing the same job, the cubature Kalman filter, built from numerical integration rather than sigma-point tuning — and finds it is a very close relative of the UKF.

::: context nees A number that checks honesty
NEES takes the error vector $\mathbf e$ and computes $\mathbf e^{\mathsf T}\mathbf P^{-1}\mathbf e$: each error measured in the filter's own standard deviations, squared, then added up. If the filter is honest, each of the $n$ pieces is about one on average, so NEES averages $n$ — here $4$. It needs the true state, so it is a simulation tool. Its flight-time cousin, **NIS**, does the same with the measurement innovation and $\mathbf S$, which a flight computer does have. This plot shows NEES for the step-7 run on a log scale:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="24">1000</text><text x="45" y="76">10</text><text x="45" y="128">0.1</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.5"><line x1="50" y1="20" x2="345" y2="20"/><line x1="50" y1="72" x2="345" y2="72"/><line x1="50" y1="124" x2="345" y2="124"/></g>
  <line x1="50" y1="82.3" x2="345" y2="82.3" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="344" y="96" font-size="11" text-anchor="end" fill="#6c7a93">ideal 4</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,116.2 57.4,104.2 64.9,108.3 72.3,92.8 79.7,96.6 87.2,94.4 94.6,90.8 102.1,92.3 109.5,85.6 116.9,76.9 124.4,81.7 131.8,91.4 139.2,102.9 146.7,137.6 154.1,95.6 161.5,85.9 169.0,90.7 176.4,89.7 183.8,94.6 191.3,99.1 198.7,95.1 206.2,96.3 213.6,101.9 221.0,110.2 228.5,96.6 235.9,82.5 243.3,27.4 250.8,27.6 258.2,29.5 265.6,39.1 273.1,39.9 280.5,40.1 287.9,41.1 295.4,41.6 302.8,42.4 310.3,42.9 317.7,43.8 325.1,44.7 332.6,44.9 340.0,46.3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,116.2 57.4,104.5 64.9,108.9 72.3,93.0 79.7,96.8 87.2,94.4 94.6,91.1 102.1,92.8 109.5,86.4 116.9,78.0 124.4,83.4 131.8,93.6 139.2,104.0 146.7,131.8 154.1,93.6 161.5,85.0 169.0,90.2 176.4,89.6 183.8,95.0 191.3,97.4 198.7,94.2 206.2,95.7 213.6,100.8 221.0,106.1 228.5,94.0 235.9,86.7 243.3,90.4 250.8,92.3 258.2,90.7 265.6,93.2 273.1,86.4 280.5,87.7 287.9,97.0 295.4,89.7 302.8,87.1 310.3,92.5 317.7,91.8 325.1,90.1 332.6,90.3 340.0,90.2"/>
  <text x="150" y="36" font-size="12" fill="#b4232c">EKF: jumps at step 27</text>
  <text x="60" y="170" font-size="12" fill="#1d6fd1">UKF (blue) stays near the ideal · steps 1 to 40</text>
</svg>
```
:::

::: context trace Reading a covariance trace
The **trace** of a matrix is the sum of the numbers on its diagonal. For the position block of $\mathbf P$ that is the east variance plus the north variance, so it has units of $\mathrm{m^2}$. Divide by two and take the square root to get a typical standard deviation per axis. The EKF's $2.50\,\mathrm{m^2}$ at step 27 means about $\sqrt{1.25} \approx 1.1\,\mathrm m$ per axis; the UKF's $1985\,\mathrm{m^2}$ means about $31.5\,\mathrm m$. A sudden drop in the trace looks like good news on a dashboard. Without a check such as NIS you cannot tell real information from a collapse.
:::

::: context particle-bridge When one bell is the wrong shape
Sometimes the truth really has two peaks — say, a bearing that fits a target on either side of a ridge. Any Gaussian filter replaces the two peaks with one wide bell centered between them, right where the target is least likely to be. Lesson 7's particle filter keeps both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20,130.0 L28,130.0 L36,129.8 L44,129.4 L52,128.5 L60,126.2 L68,121.9 L76,114.9 L84,105.1 L92,94.2 L100,84.9 L108,80.2 L116,81.8 L124,89.2 L132,99.7 L140,110.3 L148,118.7 L156,124.4 L164,127.5 L172,129.0 L180,129.4 L188,129.0 L196,127.5 L204,124.4 L212,118.7 L220,110.3 L228,99.7 L236,89.2 L244,81.8 L252,80.2 L260,84.9 L268,94.2 L276,105.1 L284,114.9 L292,121.9 L300,126.2 L308,128.5 L316,129.4 L324,129.8 L332,130.0 L340,130.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M20,127.2 L28,126.5 L36,125.6 L44,124.6 L52,123.5 L60,122.1 L68,120.6 L76,119.0 L84,117.3 L92,115.4 L100,113.5 L108,111.5 L116,109.5 L124,107.6 L132,105.8 L140,104.2 L148,102.7 L156,101.6 L164,100.7 L172,100.2 L180,100.0 L188,100.2 L196,100.7 L204,101.6 L212,102.7 L220,104.2 L228,105.8 L236,107.6 L244,109.5 L252,111.5 L260,113.5 L268,115.4 L276,117.3 L284,119.0 L292,120.6 L300,122.1 L308,123.5 L316,124.6 L324,125.6 L332,126.5 L340,127.2" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="110" y="70" font-size="12" text-anchor="middle" fill="#1d6fd1">here</text>
  <text x="250" y="70" font-size="12" text-anchor="middle" fill="#1d6fd1">or here</text>
  <text x="180" y="90" font-size="12" text-anchor="middle" fill="#b4232c">one Gaussian</text>
  <text x="180" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">same mean and variance, very different belief</text>
</svg>
```
:::

::: context monte-carlo-campaign Why engineers run thousands of cases
A single simulated flight can go well by luck. So guidance and navigation teams run **Monte Carlo campaigns**: the same scenario hundreds or thousands of times, each with fresh random noise and slightly different starting conditions, and then look at the whole spread of outcomes. Mars landing teams, for example, run thousands of dispersed entry cases before trusting their numbers. Fifty runs is small; it is enough to see a $10\%$-level failure, but a one-in-a-thousand failure needs thousands of runs to show up at all.
:::

::: context median-mean How four runs can move a mean
The mean adds everything up, so a few huge values pull it far. The median only asks which value sits in the middle, so it ignores how far out the extremes are. Here are the fifty late-NEES values for each filter on a log scale; the dashed line marks $20$, the divergence threshold.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="110" x2="350" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="93.3" y="126">1</text><text x="171.1" y="126">10</text><text x="248.9" y="126">100</text><text x="326.7" y="126">1000</text></g>
  <line x1="194.5" y1="25" x2="194.5" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="198" y="30" font-size="11" fill="#6c7a93">20</text>
  <text x="10" y="54" font-size="12" fill="#b4232c">EKF</text>
  <text x="10" y="89" font-size="12" fill="#1d6fd1">UKF</text>
  <g fill="#b4232c" fill-opacity="0.6">
    <circle cx="89.4" cy="50" r="3"/><circle cx="107.7" cy="50" r="3"/><circle cx="111.1" cy="50" r="3"/><circle cx="113.2" cy="50" r="3"/><circle cx="113.6" cy="50" r="3"/><circle cx="115.2" cy="50" r="3"/><circle cx="115.2" cy="50" r="3"/><circle cx="120.4" cy="50" r="3"/><circle cx="120.6" cy="50" r="3"/><circle cx="122.3" cy="50" r="3"/>
    <circle cx="122.6" cy="50" r="3"/><circle cx="123.2" cy="50" r="3"/><circle cx="123.6" cy="50" r="3"/><circle cx="126.0" cy="50" r="3"/><circle cx="127.9" cy="50" r="3"/><circle cx="129.1" cy="50" r="3"/><circle cx="129.6" cy="50" r="3"/><circle cx="130.9" cy="50" r="3"/><circle cx="131.9" cy="50" r="3"/><circle cx="132.3" cy="50" r="3"/>
    <circle cx="134.1" cy="50" r="3"/><circle cx="135.2" cy="50" r="3"/><circle cx="136.9" cy="50" r="3"/><circle cx="137.4" cy="50" r="3"/><circle cx="139.3" cy="50" r="3"/><circle cx="140.4" cy="50" r="3"/><circle cx="141.2" cy="50" r="3"/><circle cx="141.7" cy="50" r="3"/><circle cx="142.8" cy="50" r="3"/><circle cx="142.8" cy="50" r="3"/>
    <circle cx="149.2" cy="50" r="3"/><circle cx="149.5" cy="50" r="3"/><circle cx="151.8" cy="50" r="3"/><circle cx="152.1" cy="50" r="3"/><circle cx="152.4" cy="50" r="3"/><circle cx="152.8" cy="50" r="3"/><circle cx="161.8" cy="50" r="3"/><circle cx="164.6" cy="50" r="3"/><circle cx="164.8" cy="50" r="3"/><circle cx="164.8" cy="50" r="3"/>
    <circle cx="166.0" cy="50" r="3"/><circle cx="167.6" cy="50" r="3"/><circle cx="168.3" cy="50" r="3"/><circle cx="168.8" cy="50" r="3"/><circle cx="168.9" cy="50" r="3"/><circle cx="181.5" cy="50" r="3"/><circle cx="259.1" cy="50" r="3"/><circle cx="307.0" cy="50" r="3"/><circle cx="311.7" cy="50" r="3"/><circle cx="329.9" cy="50" r="3"/>
  </g>
  <g fill="#1d6fd1" fill-opacity="0.6">
    <circle cx="99.2" cy="85" r="3"/><circle cx="101.4" cy="85" r="3"/><circle cx="104.0" cy="85" r="3"/><circle cx="105.7" cy="85" r="3"/><circle cx="107.3" cy="85" r="3"/><circle cx="107.3" cy="85" r="3"/><circle cx="107.3" cy="85" r="3"/><circle cx="110.0" cy="85" r="3"/><circle cx="111.3" cy="85" r="3"/><circle cx="112.4" cy="85" r="3"/>
    <circle cx="116.7" cy="85" r="3"/><circle cx="117.4" cy="85" r="3"/><circle cx="118.1" cy="85" r="3"/><circle cx="120.6" cy="85" r="3"/><circle cx="122.2" cy="85" r="3"/><circle cx="123.9" cy="85" r="3"/><circle cx="125.1" cy="85" r="3"/><circle cx="126.4" cy="85" r="3"/><circle cx="126.9" cy="85" r="3"/><circle cx="126.9" cy="85" r="3"/>
    <circle cx="128.2" cy="85" r="3"/><circle cx="128.6" cy="85" r="3"/><circle cx="130.3" cy="85" r="3"/><circle cx="131.3" cy="85" r="3"/><circle cx="133.0" cy="85" r="3"/><circle cx="133.6" cy="85" r="3"/><circle cx="133.7" cy="85" r="3"/><circle cx="134.2" cy="85" r="3"/><circle cx="136.9" cy="85" r="3"/><circle cx="137.3" cy="85" r="3"/>
    <circle cx="137.4" cy="85" r="3"/><circle cx="138.1" cy="85" r="3"/><circle cx="138.6" cy="85" r="3"/><circle cx="139.0" cy="85" r="3"/><circle cx="139.1" cy="85" r="3"/><circle cx="142.2" cy="85" r="3"/><circle cx="142.2" cy="85" r="3"/><circle cx="143.8" cy="85" r="3"/><circle cx="145.2" cy="85" r="3"/><circle cx="146.7" cy="85" r="3"/>
    <circle cx="147.2" cy="85" r="3"/><circle cx="148.6" cy="85" r="3"/><circle cx="157.7" cy="85" r="3"/><circle cx="158.6" cy="85" r="3"/><circle cx="159.5" cy="85" r="3"/><circle cx="162.6" cy="85" r="3"/><circle cx="163.6" cy="85" r="3"/><circle cx="165.0" cy="85" r="3"/><circle cx="166.5" cy="85" r="3"/><circle cx="176.6" cy="85" r="3"/>
  </g>
  <line x1="139.9" y1="40" x2="139.9" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="227.4" y1="40" x2="227.4" y2="60" stroke="#1f2a44" stroke-width="2" stroke-dasharray="3 2"/>
  <line x1="133.4" y1="75" x2="133.4" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <text x="70" y="145" font-size="11" fill="#1f2a44">solid bar: median · dashed bar: EKF mean (52.9)</text>
</svg>
```

The EKF's mean sits out where not a single one of its runs is.
:::

::: context flight-cpu Flight computers are slow on purpose
Space-grade processors trade speed for survival in radiation. The RAD750, which has flown on many NASA missions including the Curiosity and Perseverance rovers, runs at up to about $200\,\mathrm{MHz}$ — far slower than a phone. Even so, an arctangent takes well under a microsecond, so nine of them are nothing. A detailed orbit propagator is a different story, which is why cost is counted in calls of $\mathbf f$.
:::

::: context orbit-determination Working out where a satellite is
**Orbit determination** is the job of turning tracking data — ranges, range rates, angles, GPS fixes — into a best estimate of a spacecraft's position and velocity. Its $\mathbf f$ is an orbit propagator: it integrates Earth's lumpy gravity field, air drag, the pull of the Sun and Moon and sunlight pressure over each time step. One call can be the most expensive thing in the whole filter, which is exactly when counting calls starts to matter.
:::

::: context finite-differences Slopes without calculus
To get a slope from a program you cannot differentiate, nudge the input a little and see how much the output moves: $\partial f/\partial x_j \approx (f(\mathbf x + \delta\mathbf e_j) - f(\mathbf x))/\delta$, where $\mathbf e_j$ points along state $j$ and $\delta$ is the small nudge. That is a **forward difference**: one extra call per state. A **central difference** nudges both ways, $(f(\mathbf x + \delta\mathbf e_j) - f(\mathbf x - \delta\mathbf e_j))/(2\delta)$, which is more accurate but costs two calls per state. Picking $\delta$ is its own art: too big and the curve bends within the nudge, too small and rounding error wins.
:::
