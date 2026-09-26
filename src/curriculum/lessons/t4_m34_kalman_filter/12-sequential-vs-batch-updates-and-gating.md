---
id: l12-sequential-vs-batch-updates-and-gating
title: 'Sequential vs batch measurement updates; measurement editing and gating'
minutes: 19
covers:
  - Sequential vs batch measurement updates; measurement editing and gating
---

A teacher has a stack of thirty quizzes to grade. She can spread them all across a big table and grade them together, or pick them up one at a time. Either way, the class average at the end is the same. Picking them up one by one just needs less table.

Now picture a bouncer at a club door. He looks at each ID before letting anyone in. Most are fine. Once in a while one is plainly fake, and he turns it away. A good bouncer keeps count of how many he refuses. If one night he is suddenly refusing half the line, the problem is probably not the IDs. Maybe his list of what a real ID looks like has gone out of date.

This lesson is about those two pictures. So far every update has treated the measurement $\mathbf{z}_k$ as one vector, processed in one matrix formula, and has trusted every entry in it. Real vehicles break both habits. Several measurements often arrive in the same instant — several stars from a **[[star tracker|star-tracker]]**, hundreds of ranges from a **[[lidar|lidar]]**, a GPS fix and a barometer reading in the same cycle. And any one of them might be wrong, like the outlier that the divergence lesson watched corrupt a filter. So: how do you process many measurements cheaply, and how do you decide whether to process one at all?

## Many measurements, one at a time

Suppose $m$ measurements arrive together. Measurement $i$ has its own row $\mathbf{H}_i$ and noise variance $R_i$, and their noises are **mutually independent**: no shared error source. Then the full noise covariance is diagonal, $\mathbf{R} = \operatorname{diag}(R_1, \ldots, R_m)$.

The **batch update** stacks them into one $m$-vector $\mathbf{z}$ and applies the predict-and-update lesson's formula once. That needs the inverse of the $m \times m$ matrix $\mathbf{S}$.

**Sequential processing** does something that looks different: $m$ ordinary *scalar* updates, one measurement at a time. Each one's output, $(\hat{\mathbf{x}}^+, \mathbf{P}^+)$, becomes the next one's input. No matrix bigger than $1 \times 1$ is ever inverted.

They give exactly the same answer. The information form from the three-derivations lesson shows why most clearly. There, an update *adds* information: each scalar measurement adds $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ to the running information matrix $\mathbf{P}^{-1}$, and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ to the running information vector. Adding is the same in any order, like dropping coins in a jar. After all $m$ updates,

$$
(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}.
$$

The last step holds because $\mathbf{R}^{-1} = \operatorname{diag}(R_1^{-1}, \ldots, R_m^{-1})$, so multiplying out $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ row by row gives exactly the sum. That right-hand side is the batch update's information matrix. The same argument on the information vector gives the same $\hat{\mathbf{x}}^+$.

::: key Sequential processing equals batch processing, for independent measurements
For $\mathbf{R} = \operatorname{diag}(R_1, \ldots, R_m)$, processing $m$ scalar measurements one at a time — in *any* order — gives exactly the same $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$ as one batch update with the full $\mathbf{H}$ and $\mathbf{R}$. Information adds, and addition does not care about order.
:::

::: example Three measurements, three orders, one answer
Take a random three-state prior and three independent scalar measurements with $\mathbf{R} = \operatorname{diag}(0.5,\ 1.2,\ 0.8)$. Do the batch update, then do sequential updates in three different orders:

```python
import numpy as np

rng = np.random.default_rng(12)
A = rng.normal(size=(3, 3))
P_prior = A @ A.T + np.eye(3)          # a random valid 3x3 covariance
x_prior = rng.normal(size=3)
H = rng.normal(size=(3, 3))            # three measurement rows
R = np.diag([0.5, 1.2, 0.8])           # independent noise
z = rng.normal(size=3)

def update(x, P, z, H, R):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    return x + K @ (z - H @ x), (np.eye(len(x)) - K @ H) @ P

xb, Pb = update(x_prior, P_prior, z, H, R)          # batch: all three at once
print("batch     ", xb.round(4))
for order in ([0, 1, 2], [2, 0, 1], [1, 2, 0]):
    x, P = x_prior, P_prior
    for i in order:                                  # one scalar at a time
        x, P = update(x, P, z[i:i+1], H[i:i+1], R[i:i+1, i:i+1])
    print("sequential", order, x.round(4), f"max|dP| = {np.abs(P - Pb).max():.1e}")
# batch      [-0.1482 -0.7304  0.6548]
# sequential [0, 1, 2] [-0.1482 -0.7304  0.6548] max|dP| = 2.4e-15
# sequential [2, 0, 1] [-0.1482 -0.7304  0.6548] max|dP| = 2.2e-15
# sequential [1, 2, 0] [-0.1482 -0.7304  0.6548] max|dP| = 5.6e-16
```

Every order gives the batch estimate to every printed digit. The largest difference anywhere in $\mathbf{P}^+$ is a few times $10^{-15}$. That is rounding in about the sixteenth digit, not a real disagreement. The filter truly does not care which measurement it looks at first.
:::

Why bother, if the answer is the same? Cost. Inverting an $m \times m$ matrix takes work that grows like $m^3$, written $O(m^3)$ in **[[big-O notation|big-o]]**. Sequential processing does $m$ scalar divisions and $m$ small corrections of $\mathbf{P}$, each costing about $n^2$ operations for $n$ states. With three measurements the difference hardly matters. With a star tracker reporting dozens of stars, or a lidar with hundreds of ranges each cycle, avoiding a growing matrix inverse can decide whether the filter runs in real time at all. The square-root and UD algorithms of the numerically-stable-forms lesson do this inside: they process a vector measurement as a string of scalar updates, for the same reason.

::: warning Sequential processing needs independence, not just a diagonal-looking R
If the measurements share an error source — the same clock, the same reference frame, the same uncorrected atmospheric delay — the true $\mathbf{R}$ has off-diagonal terms, even if each measurement's own noise looks fine alone. Processing them one at a time as if $\mathbf{R}$ were diagonal counts the shared error as independent evidence from each, and the filter becomes overconfident. Here is how much. Two readings of one altitude, each with variance $1\,\mathrm{m^2}$ and a correlation of $0.8$ between their errors: treated as independent, the filter claims a variance of $1/2 = 0.5\,\mathrm{m^2}$. The truth is $(1 + 0.8)/2 = 0.9\,\mathrm{m^2}$ — nearly twice as big. The correlated-noise lesson fixes this properly by **[[decorrelating|decorrelate]]** the measurements first.
:::

## Gating: should this measurement get in?

Sequential or batch, every update so far has swallowed whatever arrived. The last lesson built the tool to ask first: is this measurement believable, given what the filter currently thinks?

For a genuine measurement and a correctly tuned filter, the normalized innovation squared $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$ follows a $\chi^2_m$ distribution. So a wildly large value is grounds to doubt the *measurement*. Setting a threshold and refusing measurements above it is called **[[gating|validation-gate]]**, or **measurement editing**. The threshold is written $\gamma$ ("gamma").

::: key Measurement gating
Accept a measurement only if $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} < \gamma$, with $\gamma$ from the chi-square table (about $9$ for $1$ degree of freedom at $3\sigma$). Always count and telemeter rejections — a rising rejection rate is an early warning.
:::

Where does "about $9$" come from? For one measurement, the innovation divided by its standard deviation, $\nu/\sqrt{S}$, is a standard normal number $Z$. The NIS is $Z^2$. The **[[three-sigma|three-sigma]]** rule says $|Z| < 3$ with probability $0.9973$. And $|Z| < 3$ is the same event as $Z^2 < 9$. So the $\chi^2_1$ value at probability $0.9973$ is exactly $3^2 = 9$. Nothing deep: a $\chi^2_1$ number *is* the square of a standard normal.

That shortcut works only for $m = 1$. With two measurements the NIS is the sum of two squared standard normals, and no single "sigma" squares to its threshold. At the same $99.73\%$ probability, the table gives:

| Measurements $m$ | $1$ | $2$ | $3$ | $4$ |
| --- | --- | --- | --- | --- |
| Gate $\gamma$ at $99.73\%$ | $9.00$ | $11.83$ | $14.16$ | $16.25$ |

Each is a genuinely different number, read from $\chi^2_m$, not a reuse of $9$.

::: example Gating stops the divergence lesson's outlier
Replay the divergence lesson's bad radar return: the booster filter, settled after $30$ steps, gets one reading $100\,\mathrm{m}$ too high on step $31$. This time a gate of $\gamma = 9$ is switched on from step $11$, once the filter has recovered from its poor starting guess.

The outlier's NIS is $99.7^2 / 4.69 \approx 2120$, more than two hundred times the gate. It is refused, and the filter skips the update for that cycle: it keeps its prediction and moves on. Right after, the estimate is $(2283.31\,\mathrm{m},\ -69.80\,\mathrm{m/s})$ against a true $(2282.99\,\mathrm{m},\ -70.47\,\mathrm{m/s})$ — an altitude error of $0.32\,\mathrm{m}$, just the ordinary one-step prediction error. The ungated filter was $15.0\,\mathrm{m}$ off at the same moment and took about two seconds to recover. The whole difference is one comparison with a precomputed number.

Sanity check on a long honest run: over $5000$ steps with no outliers, this gate refused $0.28\%$ of the readings. The chi-square table says an honest filter should lose $1 - 0.9973 = 0.27\%$. It matches.
:::

Why switch the gate on only after step $10$? The filter's starting guess was $100\,\mathrm{m}$ off with a claimed $\sigma$ of $10\,\mathrm{m}$ — a dishonest starting covariance. A gate active from step one would have refused the very first readings that were trying to fix that. A gate is only as good as the $\mathbf{S}$ it compares against, and the next section shows how badly that can go.

## When the gate is the problem

Gating protects a healthy filter from bad data. Put it on a filter that is *already* diverging and it can do the opposite. This is the most important idea in the lesson.

::: example A filter that gates itself blind
Take the under-tuned filter from the process-noise lesson ($q = 0.005$, a hundred times too small) flying through the hidden $-3\,\mathrm{m/s^2}$ deceleration. Add the same $\gamma = 9$ gate from step $11$. Every measurement in this run is **honest**. There are no outliers at all.

| Steps | Share of readings rejected |
| --- | --- |
| $1$–$20$ | $0\%$ |
| $21$–$40$ | $5\%$ |
| $41$–$60$ | $75\%$ |
| $61$–$150$ | $100\%$ |

The first rejection comes at step $22$. By step $61$ the filter refuses *every* measurement, for good, and every one of them was a perfectly honest reading.

Here is the mechanism, a true [[vicious cycle|vicious-cycle]]. The too-small $\mathbf{Q}$ makes $\mathbf{P}$ collapse, so $\mathbf{S}$ shrinks and the gate tightens around a prediction that is drifting away from the truth. Ordinary innovations start to look impossible and get refused. With no corrections, the error grows faster, which makes the next innovations even bigger, which gets them refused too. After step $60$ the filter is flying on its own model alone. At step $150$ its altitude is $229\,\mathrm{m}$ wrong while it claims $\sigma_p = 3.4\,\mathrm{m}$. Without the gate, the same filter was "only" $27\,\mathrm{m}$ wrong. The gate turned a recoverable bad tuning into a filter that is permanently blind.
:::

::: warning A rising rejection rate is a symptom, not a success
It is tempting to read a high rejection rate as the gate "doing its job". The example is the counter-case: not one rejected reading was bad. From inside the gate, "the filter is right and this measurement is an outlier" and "the filter is wrong and this measurement is correctly disagreeing" look identical — a large NIS. The only way to tell them apart is the rule on the card: count rejections, send the rate down in **[[telemetry|telemetry]]**, and treat a *rising* rate as a filter-health alarm to investigate with the last lesson's consistency tests. A gate with no rejection monitoring can fail silently and forever, with a perfectly clean log of accepted measurements.
:::

Two remedies follow from seeing the trap. First, soften the gate: instead of throwing a borderline measurement away, **[[down-weight|down-weight]]** it by inflating its $R$, so a mildly overconfident filter still gets some correction instead of none. Second, and more important, treat a climbing rejection rate as the trigger the divergence lesson's remedies were built for. It is evidence, visible without any simulated truth, that the filter's picture of its own uncertainty no longer matches reality. The fix belongs in $\mathbf{Q}$, in the state vector or in the arithmetic — never in loosening the gate until the alarm stops ringing.

## Check yourself

::: check
Using the information-form argument, explain why processing two independent measurements in a different order — say, a slightly older reading after a newer one taken in the same cycle — still gives the mathematically correct answer, as long as each uses the right $\mathbf{H}$ and $R$ for what it actually measured.
:::

::: answer
Each update adds $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ to the information matrix and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ to the information vector. Adding matrices and vectors gives the same total in any order, so nothing in the final sum depends on which contribution went in first. What *does* matter is that each $\mathbf{H}_i$ correctly describes what its measurement saw and when. If "older" means the reading really belongs to an earlier true state, its $\mathbf{H}_i$ (or a time-tag correction before the filter) has to account for that. That is a timing problem this algebra does not fix; the order of processing is not.
:::

::: check
A designer wants to process every measurement sequentially by default, even when $\mathbf{R}$ is not diagonal, because it is cheaper. What goes wrong?
:::

::: answer
The equivalence in this lesson depends entirely on the measurements being independent — $\mathbf{R}$ diagonal. Sequential processing quietly assumes each measurement's noise is unrelated to every other's. When $\mathbf{R}$ has real off-diagonal terms, that is false, and the result is not just less efficient; it uses the wrong update. It counts correlated measurements as independent confirmations of each other and understates the true uncertainty — in the warning's example, claiming $0.5\,\mathrm{m^2}$ when the truth is $0.9\,\mathrm{m^2}$. That is the overconfidence failure this module keeps meeting. When the correlation is real, decorrelate first, then process sequentially.
:::

::: check
Why doesn't "$\gamma = 9$ for one measurement" become "$\gamma = 16$ for a two-dimensional measurement" by some four-sigma argument?
:::

::: answer
"Three sigma" is a statement about one normal number, $|Z| < 3$, and $\chi^2_1$ is by definition $Z^2$ for a single standard normal $Z$. So $9$ and the $\chi^2_1$ value at $P(|Z| < 3)$ are the same thing by definition. A two-dimensional NIS is $\chi^2_2$, the sum of *two* squared standard normals, and no single sigma squares to its threshold. The right gate is the $\chi^2_2$ value at whatever confidence you choose: $11.83$ at the same $99.73\%$ — not $9$, and not $16$.
:::

::: check
The vicious-cycle example gated an under-tuned filter and watched its rejection rate climb to $100\%$. Would gating the *over-tuned* filter from the consistency lesson ($q = 50$, a hundred times too large) show the same climb?
:::

::: answer
No — it leans the other way. An over-tuned filter's $\mathbf{S}$ is inflated, not shrunk: in the booster filter it is $6.42\,\mathrm{m^2}$ instead of $4.65\,\mathrm{m^2}$, so a $\gamma = 9$ gate lets innovations through up to $\sqrt{9 \times 6.42} \approx 7.6\,\mathrm{m}$ instead of $\sqrt{9 \times 4.65} \approx 6.5\,\mathrm{m}$. The gate becomes too loose: moderate outliers slip through, and the rejection rate sits at or below what the confidence level predicts. (On the decelerating flight, it refused nothing in $150$ steps.) So the rejection rate is a diagnostic in both directions. Far above the expected $0.27\%$ points to an overconfident filter, as in the example. Far below it — especially with NIS stuck under its band, as the consistency lesson found for this filter — points to a gate too loose to be protecting anything.
:::

::: check
Suggest one telemetry quantity, beyond the raw count of rejections, that would let a ground team tell "this filter just met one real outlier" from "this filter has fallen into the vicious cycle".
:::

::: answer
A rolling rejection rate over a fixed recent window, like the twenty-step blocks in the example, instead of a single all-time count. One real outlier makes a one-step blip that a twenty-step window absorbs, and the rate falls straight back to its usual level. The vicious cycle makes a rate that climbs and *stays* high, window after window, because its cause — a collapsed $\mathbf{S}$ — cannot fix itself once the filter stops accepting the measurements that could fix it. A cumulative count cannot tell those two shapes apart; a windowed rate, watched over time, can.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Sequential equals batch | For diagonal $\mathbf{R}$, $m$ scalar updates in any order give the same $\hat{\mathbf{x}}^+, \mathbf{P}^+$ as one batch update |
| Why sequential | No inverse bigger than $1 \times 1$; about $m n^2$ work instead of an $m^3$ inverse — decisive for large $m$ |
| Correlated measurements | Need decorrelating first; treated as independent, two readings with correlation $0.8$ claim $0.5$ instead of $0.9$ |
| Gating | Accept only if $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} < \gamma$; $\gamma = 9$ for $m = 1$ at $3\sigma$; $11.83$, $14.16$, $16.25$ for $m = 2, 3, 4$ |
| Honest rejection rate | About $0.27\%$ at the $3\sigma$ gate; measured $0.28\%$ in the example |
| Gating's trap | On an overconfident filter, the gate refuses honest data, deepening the divergence ($229\,\mathrm{m}$ instead of $27\,\mathrm{m}$) |
| Operational rule | Always telemeter a windowed rejection rate; a lasting rise is a health alarm, never a reason to loosen the gate |

Gating decides, one cycle at a time, whether a measurement deserves trust. The next lesson looks back over a *whole run* at once: once later data exists, can the earlier estimates be improved in hindsight?

::: context star-tracker A camera that reads the sky
A **star tracker** is a small digital camera pointed at the sky, paired with a catalog of star positions. It photographs a patch of stars, matches the pattern to the catalog, and works out which way the spacecraft is pointing, often to a few arcseconds. Each star it recognizes is a separate direction measurement, so one picture can deliver ten, twenty or more measurements in the same instant — exactly the "many measurements at once" case of this lesson.
:::

::: context lidar Radar with light
**Lidar** (light detection and ranging) sends out laser pulses and times their echoes, the way radar does with radio waves. Because a laser beam is so narrow, a scanning lidar can measure hundreds or thousands of separate ranges every cycle, building a **point cloud** of the surface below. NASA's Morpheus test lander flew a lidar hazard-detection system in 2014 to pick safe landing spots. A navigation filter fed by such a sensor faces a flood of measurements every cycle.
:::

::: context big-o How the cost grows
**Big-O notation** describes how the work grows as a problem gets bigger, ignoring the fixed multipliers. $O(m^3)$ means "roughly proportional to $m^3$": double the number of measurements and an $m \times m$ matrix inverse takes about eight times as long. Sequential processing grows only in proportion to $m$ for a fixed number of states. With $m = 100$ measurements the inverse's $m^3$ is a million, while $m$ is a hundred — which is why the difference matters for big sensors and not for small ones.
:::

::: context decorrelate Making correlated noise independent
If two measurements share an error, you can build new combinations of them whose errors are independent. The trick uses a Cholesky factor $\mathbf{L}$ of the true $\mathbf{R} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$: multiply the measurements, and $\mathbf{H}$, by $\mathbf{L}^{-1}$. The new noise has covariance $\mathbf{L}^{-1}\mathbf{R}\mathbf{L}^{-\mathsf{T}} = \mathbf{I}$, so the new measurements are independent and can be processed one at a time. This is called **whitening**, the same idea used inside NEES. The correlated-noise lesson at the end of this module does it properly.
:::

::: context validation-gate A window around the prediction
The word comes from radar tracking, where a **validation gate** is the region around a target's predicted position inside which a new radar return is accepted as belonging to that target. The gate $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} < \gamma$ is an ellipse. Below, with standard deviations of $2$ and $1$ along the two axes and $\gamma = 11.83$: point A is $6$ away but along the loose direction (score $9$) and gets in; point B is only $4$ away but along the tight direction (score $16$) and is refused.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="8" x2="180" y2="192" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="100" rx="137.6" ry="68.8" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <text x="186" y="116" font-size="11" fill="#1f2a44">prediction</text>
  <circle cx="300" cy="100" r="5" fill="#1d6fd1"/>
  <text x="296" y="90" font-size="12" fill="#1d6fd1" text-anchor="end">A: in</text>
  <circle cx="180" cy="20" r="5" fill="#b4232c"/>
  <text x="190" y="24" font-size="12" fill="#b4232c">B: out</text>
  <text x="30" y="186" font-size="11" fill="#1d6fd1">gate: score below 11.83</text>
</svg>
```
:::

::: context three-sigma Inside three standard deviations
For a normal distribution, $68.27\%$ of values fall within one standard deviation of the mean, $95.45\%$ within two, and $99.73\%$ within three. So a genuine measurement lands outside three sigma only about $27$ times in ten thousand. That is why "three sigma" is a common line between "unusual" and "almost certainly something else". The shaded area below is the $99.73\%$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon fill="#8fb8f0" points="60,150 60.0,148.8 65.0,148.3 70.0,147.6 75.0,146.7 80.0,145.4 85.0,143.8 90.0,141.7 95.0,139.2 100.0,136.0 105.0,132.1 110.0,127.6 115.0,122.3 120.0,116.3 125.0,109.7 130.0,102.5 135.0,94.9 140.0,87.1 145.0,79.3 150.0,71.7 155.0,64.7 160.0,58.5 165.0,53.3 170.0,49.5 175.0,47.1 180.0,46.3 185.0,47.1 190.0,49.5 195.0,53.3 200.0,58.5 205.0,64.7 210.0,71.7 215.0,79.3 220.0,87.1 225.0,94.9 230.0,102.5 235.0,109.7 240.0,116.3 245.0,122.3 250.0,127.6 255.0,132.1 260.0,136.0 265.0,139.2 270.0,141.7 275.0,143.8 280.0,145.4 285.0,146.7 290.0,147.6 295.0,148.3 300.0,148.8 300,150"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20.0,150.0 30.0,149.9 40.0,149.8 50.0,149.5 60.0,148.8 70.0,147.6 80.0,145.4 90.0,141.7 100.0,136.0 110.0,127.6 120.0,116.3 130.0,102.5 140.0,87.1 150.0,71.7 160.0,58.5 170.0,49.5 180.0,46.3 190.0,49.5 200.0,58.5 210.0,71.7 220.0,87.1 230.0,102.5 240.0,116.3 250.0,127.6 260.0,136.0 270.0,141.7 280.0,145.4 290.0,147.6 300.0,148.8 310.0,149.5 320.0,149.8 330.0,149.9 340.0,150.0"/>
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="165">−3σ</text><text x="100" y="165">−2σ</text><text x="140" y="165">−σ</text><text x="180" y="165">0</text><text x="220" y="165">σ</text><text x="260" y="165">2σ</text><text x="300" y="165">3σ</text>
  </g>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">99.73% inside ±3σ</text>
</svg>
```
:::

::: context vicious-cycle Each step makes the next one worse
A **vicious cycle** is a loop in which every step feeds the next and the whole thing keeps getting worse. The gated, under-tuned filter runs around this loop. Its collapsed $\mathbf{S}$ starts it: the prediction drifts, and the innovations look too big for the small $\mathbf{S}$. Nothing inside the loop can break it, because the only thing that could — an accepted measurement — is exactly what the loop shuts out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="105" y="8" width="150" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="31" font-size="12" fill="#1f2a44" text-anchor="middle">error grows</text>
  <rect x="215" y="82" width="140" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="105" font-size="12" fill="#1f2a44" text-anchor="middle">NIS above the gate</text>
  <rect x="95" y="156" width="170" height="36" rx="6" fill="#ffffff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="179" font-size="12" fill="#b4232c" text-anchor="middle">honest readings refused</text>
  <rect x="5" y="82" width="150" height="36" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="105" font-size="12" fill="#1f2a44" text-anchor="middle">no corrections</text>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <path d="M 255 30 Q 290 40 290 78"/>
    <path d="M 290 122 Q 290 165 269 172"/>
    <path d="M 91 172 Q 70 165 70 122"/>
    <path d="M 70 78 Q 70 40 101 30"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="290,82 285,72 295,72"/>
    <polygon points="265,174 274,167 275,178"/>
    <polygon points="70,118 65,128 75,128"/>
    <polygon points="105,28 95,23 96,34"/>
  </g>
</svg>
```
:::

::: context telemetry The vehicle reporting home
**Telemetry** is the stream of measurements a vehicle sends to the ground while it flies: temperatures, pressures, positions, and the internal health numbers of its software. Bandwidth is limited, so engineers choose carefully what goes in it. A filter's rejection count, its recent NIS values and the diagonal of $\mathbf{P}$ are cheap to send and let the ground team watch the navigation system's health without needing to know the true state.
:::

::: context down-weight Trusting a reading less, not zero
Rejecting a measurement is all-or-nothing. **Down-weighting** is gentler: keep the measurement but raise its $R$, so it moves the estimate less. It is the filter's version of the Huber loss from the least-squares module, which treats small residuals normally and big ones with a lighter touch, instead of either trusting or discarding them completely. One simple rule scales $R$ up by the factor by which the NIS exceeds the gate, so a reading just outside the gate still nudges the estimate a little.
:::
