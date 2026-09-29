---
id: l10-filter-divergence-causes-and-remedies
title: 'Filter divergence: causes and remedies'
minutes: 24
covers:
  - 'Filter divergence: causes and remedies (fading memory, Q inflation, covariance symmetrization)'
---

Picture a friend giving you directions in a strange city. At first he checks the street signs at every corner. After a while he feels sure of himself and stops looking. Then he takes one wrong turn. Now every sign you pass disagrees with him, but he is so certain that he waves each one away. The longer you walk, the more lost you both get, and the more confident he sounds.

A Kalman filter can fail in exactly that way. The last few lessons each showed one version of it. A process noise $\mathbf{Q}$ set too small made the filter report an error far smaller than its real error. An unobservable state drifted forever while every printed number looked ordinary. A slightly wrong gain turned a variance negative on the very first update. Each was studied on its own, with its own fix.

This lesson puts them side by side, adds the one cause not yet seen (a single bad measurement) and the blunt tools not yet built (fading memory and symmetrization). Then it answers the question a working engineer faces: a filter has gone wrong, so which cause is it, and what do you do about it today?

The failure has a name. **[[Divergence|divergence-word]]** means the filter's reported covariance and its actual error drift apart, usually with the covariance shrinking while the error grows. The filter gets worse and more confident at the same time. A noisy filter is an annoyance. A diverging filter is dangerous, because nothing in its own output says anything is wrong.

## Five ways a filter goes wrong

Here is the whole list, with the usual remedy for each. The rest of the lesson fills it in.

::: key The five causes of filter divergence
Underestimated $\mathbf{Q}$; unmodelled dynamics or biases; unobservable states; numerical loss of symmetry or positive definiteness; and unrejected measurement outliers. Remedies: augment the state, inflate $\mathbf{Q}$ or fade memory, symmetrize, use Joseph or square-root forms, and gate measurements.
:::

- **Underestimated $\mathbf{Q}$.** The process-noise lesson showed it. A filter tuned a hundred times too tight ends up reporting a position standard deviation of about $0.43\,\mathrm{m}$ while its real error grows past $25\,\mathrm{m}$ — around sixty of its own standard deviations. The covariance shrinks the whole time.
- **Unmodelled dynamics or biases.** Something real is pushing the vehicle, and the model has no term for it. In the same process-noise example, the truth had a steady deceleration the constant-velocity model did not contain. "Make $\mathbf{Q}$ bigger" is one answer. This lesson shows a better one.
- **Unobservable states.** The observability lesson showed a state the sensor cannot see at all. Its covariance grows forever if $\mathbf{Q}$ is not zero, or sits frozen at its starting value if $\mathbf{Q}$ is zero. Either way, its error is never corrected.
- **Numerical loss of symmetry or positive definiteness.** The numerically-stable-forms lesson showed a gain a few percent too large turning the simplified covariance update negative. A negative variance has no [[meaning|negative-variance]], and every number after it is garbage.
- **Unrejected measurement outliers.** Not seen yet, and the cause most directly in the designer's hands.

## A cause not yet seen: one bad measurement

Every example so far fed the filter honest measurements: $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$, with $\mathbf{v}$ drawn from the assumed $\mathbf{R}$. Real sensors sometimes hand back something else. A radar echo takes a detour off a nearby hillside before it comes home (**[[multipath|multipath]]**). A star tracker is fooled by a **[[cosmic ray|cosmic-ray]]** hitting its detector. A data word loses a bit on the way down the wire. A measurement far more wrong than its noise level allows is an **outlier**.

Nothing in the filter we have built can tell an honest large innovation from a corrupted one. Both move the estimate by $\mathbf{K}\boldsymbol{\nu}$ in exactly the same way. That is the whole problem.

::: example One bad radar return
Use the descending booster from earlier lessons: a constant-velocity model, a step of $\Delta t = 0.1\,\mathrm{s}$, process noise $q = 0.5\,\mathrm{m^2/s^3}$, and a radar altimeter with noise $\sigma = 2\,\mathrm{m}$, so $R = 4\,\mathrm{m^2}$. Run it for $30$ steps until it settles. Its covariance is now about

$$
\mathbf{P}^+ \approx \begin{pmatrix} 0.597 & 0.440 \\ 0.440 & 0.664 \end{pmatrix},
$$

so it believes its altitude to about $\sqrt{0.597} \approx 0.77\,\mathrm{m}$.

On step $31$, feed it one reading that is $100\,\mathrm{m}$ too high — fifty times the sensor's $\sigma$. No checking at all. The innovation is $\nu = 99.7\,\mathrm{m}$, against a predicted innovation variance of $S = 4.69\,\mathrm{m^2}$. The gain is ordinary, $\mathbf{K} = (0.147,\ 0.108)^{\mathsf{T}}$, so the update moves the altitude by $0.147 \times 99.7 \approx 14.7\,\mathrm{m}$ and the velocity by $0.108 \times 99.7 \approx 10.8\,\mathrm{m/s}$.

To see only the damage the outlier did, compare with the same run fed the honest reading:

| Steps after the bad reading | Extra altitude error | Reported $\sigma_p$ |
| --- | --- | --- |
| $0$ | $14.9\,\mathrm{m}$ | $0.77\,\mathrm{m}$ |
| $1$ | $13.6\,\mathrm{m}$ | $0.76\,\mathrm{m}$ |
| $5$ | $9.2\,\mathrm{m}$ | $0.75\,\mathrm{m}$ |
| $10$ | $4.9\,\mathrm{m}$ | $0.75\,\mathrm{m}$ |
| $20$ | $0.2\,\mathrm{m}$ | $0.75\,\mathrm{m}$ |

Read the two columns together. For about two seconds the filter is wrong by up to twenty times its own reported $\sigma_p$, and the $\sigma_p$ column never twitches. That is not an accident. The covariance update $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ never looks at $\mathbf{z}$, so a mad measurement shrinks $\mathbf{P}$ exactly as much as a good one. Recovery is slow for two reasons. The gain is small, so each honest reading removes only about $14\%$ of the altitude error. And the outlier also kicked the velocity by $10.8\,\mathrm{m/s}$, which keeps dragging the altitude off for several more steps.

Sanity check: the table compares against the honest reading, which happened to be $0.75\,\mathrm{m}$ low, so the two readings differ by $100.75\,\mathrm{m}$. With the position gain to four places, $0.1475 \times 100.75 \approx 14.9\,\mathrm{m}$. The numbers hang together.
:::

The size of that innovation should have been a giveaway. The quantity $\nu^2/S = 99.7^2 / 4.69 \approx 2120$ compares the innovation with its own predicted spread, and for an honest measurement it is almost never above about $9$. Checking that before accepting a measurement is called **gating**. The point here is the failure itself: an outlier leaves the filter confidently wrong, with a covariance that says nothing happened.

## Remedy: give the missing physics a state

Go back to the booster with a real deceleration of $3\,\mathrm{m/s^2}$ that the constant-velocity model does not know about. The process-noise lesson's fix was to make $\mathbf{Q}$ bigger, so the filter stays humble enough to keep chasing the data. A better fix is to stop calling the missing physics "noise" and give it a state of its own.

That is **state augmentation**: add the missing quantity to the state vector so the filter estimates it. Here, add the acceleration $a$, so $\mathbf{x} = (p,\ v,\ a)^{\mathsf{T}}$ ("p, v, a": position, velocity, acceleration). Let $a$ wander slowly, as a random walk driven by a small **[[jerk|jerk]]** noise of spectral density $q_a$. The filter now carries a constant-acceleration model.

::: example Augmenting beats inflating, on the same flights
Fly $50$ simulated descents, each $150$ steps ($15\,\mathrm{s}$) long, all with the hidden $-3\,\mathrm{m/s^2}$ deceleration. Run each filter on every flight, and average the results. "RMS error" is the root-mean-square altitude error over the last $50$ steps.

| Filter | RMS altitude error | Reported $\sigma_p$ at the end | Acceleration estimate (truth $-3.00$) |
| --- | --- | --- | --- |
| Constant velocity, $q = 0.005$ (too small) | $24.6\,\mathrm{m}$ | $0.43\,\mathrm{m}$ | not modeled |
| Constant velocity, $q = 0.5$ | $2.56\,\mathrm{m}$ | $0.75\,\mathrm{m}$ | not modeled |
| Augmented, $q_a = 0.01$ | $0.82\,\mathrm{m}$ | $0.64\,\mathrm{m}$ | $-2.97\,\mathrm{m/s^2}$ |
| Augmented, $q_a = 1$ | $0.79\,\mathrm{m}$ | $0.91\,\mathrm{m}$ | $-2.99\,\mathrm{m/s^2}$ |

The augmented filter is about three times more accurate than the best constant-velocity filter ($2.56 / 0.82 \approx 3.1$). It also hands you the acceleration itself, within about $1\%$ on average. The constant-velocity filter never had that number at all. Changing $q_a$ a hundredfold barely changes the accuracy, because now the state, not the noise budget, is doing the work of tracking the acceleration.

Look at the second row again: it reports $\sigma_p = 0.75\,\mathrm{m}$ with a real RMS error of $2.56\,\mathrm{m}$. A bigger $\mathbf{Q}$ stopped the runaway but did not make the filter honest. The augmented filter's claim and reality are close.
:::

Augmentation is listed first among the remedies because it is the only one that fixes the defect instead of covering for it. It needs you to know *what* is missing, which an outlier or a round-off error never tells you. But when a nameable effect — a drag term, a sensor bias, a thrust misalignment — is driving the divergence, adding it as a state beats every other remedy here.

## Remedy: inflate Q, or fade the memory

Sometimes you cannot name what is missing, or there is no time to find out. Then you use a blunt tool. The simplest is **$\mathbf{Q}$ inflation**: raise $\mathbf{Q}$ until the filter stops ignoring its data. The second row of the last table is exactly that.

A close cousin is **fading memory**, the **[[forgetting factor|forgetting-factor]]** of the three-derivations lesson's recursive least squares. There it was a number a little below one multiplying old information. Here it is written the other way round, as a number $\lambda$ a little above one that blows up the propagated covariance each predict step. Old information then counts a little less each cycle, and the filter never gets too sure of a model it has reason to doubt.

::: key Fading-memory prediction
$$
\mathbf{P}_k^- = \lambda^2\,\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}, \qquad \lambda \geq 1.
$$
$\lambda = 1$ gives the ordinary predict step. $\lambda > 1$ inflates the propagated covariance every cycle, which raises every gain and keeps the filter listening to new data even when its dynamics model is known to be incomplete.
:::

Read $\lambda$ as "lambda". Typical values, like $1.01$ or $1.02$, look tiny, but they act every step, so they add up fast.

::: note Why it has to be true: fading memory down-weights old data
Take the simplest case, with $\mathbf{Q} = \mathbf{0}$. Write the covariance in information form, $\mathbf{Y} = \mathbf{P}^{-1}$. The update adds $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ for each measurement. The fading predict step multiplies $\mathbf{P}$ by $\lambda^2$, so it multiplies the information by $1/\lambda^2$ (and moves it through $\mathbf{F}$). A measurement taken $j$ steps ago has been through $j$ such predict steps, so its information now carries a factor $\lambda^{-2j}$.

That is exactly what you would get from ordinary weighted least squares with the old measurement's noise variance inflated to $\lambda^{2j}R$. So a fading-memory filter is an honest least-squares fit in which each measurement's weight shrinks geometrically with age. With $\lambda = 1.02$, each step multiplies old weights by $1/1.02^2 \approx 0.961$, and a measurement's weight halves every $\ln 2 / \ln(1.0404) \approx 17.5$ steps.
:::

::: example Fading memory rescues a badly tuned filter, partly
Take the same $50$ decelerating flights and the badly under-tuned filter ($q = 0.005$, a hundred times too small). Change nothing but $\lambda$:

| Setting | RMS altitude error | Reported $\sigma_p$ at the end |
| --- | --- | --- |
| $q = 0.005$, $\lambda = 1$ (the original divergence) | $24.6\,\mathrm{m}$ | $0.43\,\mathrm{m}$ |
| $q = 0.005$, $\lambda = 1.01$ | $15.7\,\mathrm{m}$ | $0.52\,\mathrm{m}$ |
| $q = 0.005$, $\lambda = 1.02$ | $10.0\,\mathrm{m}$ | $0.60\,\mathrm{m}$ |
| $q = 0.005$, $\lambda = 1.05$ | $2.81\,\mathrm{m}$ | $0.85\,\mathrm{m}$ |
| Augmented state, $q_a = 0.01$ (for comparison) | $0.82\,\mathrm{m}$ | $0.64\,\mathrm{m}$ |

Fading memory clearly helps. At $\lambda = 1.05$ the RMS error drops by a factor of about nine ($24.6 / 2.81 \approx 8.8$), to roughly what a correctly sized $\mathbf{Q}$ gave. And it needed no diagnosis of *why* the filter was diverging.

It still falls well short of augmentation, and at $\lambda = 1.05$ the real error is still more than three times the reported $\sigma_p$. Fading memory inflates the uncertainty in every direction at once, whether or not that direction has missing physics. It is the remedy of last resort: a filter running it forever is admitting it does not know what is wrong with its own model.
:::

::: warning Bigger lambda is not free
Every increase in $\lambda$ raises every gain, including the gains on states whose dynamics were modeled perfectly well. Push it far enough to fix the one badly modeled direction and you have over-inflated all the good ones, so the estimate starts chasing measurement noise — the "$\mathbf{Q}$ too large" failure of the process-noise lesson, reached by a different road.
:::

A related trick guards against the covariance collapsing: put a **floor on $\mathbf{P}$**, a smallest variance each state is never allowed to go below. Like fading memory, it keeps the gain from sinking to zero. Like fading memory, it hides a modeling problem rather than fixing it.

## Remedy: symmetrize — needed, but not enough

A covariance matrix must be symmetric: the entry in row $i$, column $j$ must equal the entry in row $j$, column $i$. Round-off in the computer can make the two drift apart by a hair. **Covariance symmetrization** forces them back together after every update:

$$
\mathbf{P} \leftarrow \tfrac12\left(\mathbf{P} + \mathbf{P}^{\mathsf{T}}\right).
$$

Read the arrow as "is replaced by": each off-diagonal pair becomes its average. It costs almost nothing and can only remove asymmetry, never add it, which makes it tempting to treat as a universal safety net. It is not one.

::: warning Symmetrizing a broken update does not fix it
Replay the numerically-stable-forms lesson's failure in single-precision arithmetic: start from $\mathbf{P}_0 = \operatorname{diag}(100, 100)$, predict once, and update with a gain $4\%$ too large. The correct position gain is $0.962$, so the used gain is $1.04 \times 0.962 \approx 1.0004$ — slightly more than all of the position variance gets subtracted. The simplified update gives a smallest eigenvalue of $-0.0385$. Its raw asymmetry is only about $10^{-6}$. Symmetrize it, and the smallest eigenvalue is still $-0.0385$. The matrix was already symmetric in every way that matters; it was *indefinite* (it has a negative direction), and averaging two nearly equal numbers cannot change that. The Joseph form, fed the same wrong gain, gives a smallest eigenvalue of $+4.00$.
:::

So what does symmetrization buy? Cheap insurance against a slower failure: **[[round-off|round-off]]** piling up asymmetry over a very long run. That confuses later routines that assume exact symmetry. An eigenvalue routine that reads only one triangle of $\mathbf{P}$ silently ignores the other, and a **[[Cholesky factorization|cholesky]]**, which the square-root form needs, may refuse to run.

How fast does it pile up? Run the correctly tuned booster filter for $300{,}000$ steps in single precision, with no symmetrizing. The worst asymmetry over the whole run is $2.4 \times 10^{-7}$, and it does not grow — for this small two-state filter. More states, a worse-conditioned $\mathbf{P}$ or a months-long mission give round-off more room, so symmetrize every cycle anyway. But it is hygiene. The Joseph, square-root and UD forms are what make an indefinite $\mathbf{P}$ impossible by construction.

## Remedy: gate the measurements

The fifth remedy answers the fifth cause: compare each innovation with the size the filter predicts, and reject the ones wildly too big. The outlier above, at $\nu^2/S \approx 2120$, would have been thrown out at once. Gating has its own trap — it can blind a filter that is already diverging — and the lesson after next covers both.

## Reading the innovations: the common thread

All five causes, for all their differences, leave marks on the same evidence: the innovation sequence $\boldsymbol{\nu}_k$ and its predicted covariance $\mathbf{S}_k$. For a healthy filter the innovations have zero mean, no pattern from one step to the next, and a typical size of $\sqrt{S_k}$. Here is how each cause bends that picture:

| Cause | Mean of $\nu$ | Pattern step to step | Size compared with $\sqrt{S}$ | Remedy |
| --- | --- | --- | --- | --- |
| Underestimated $\mathbf{Q}$ | drifts away from zero | strong, slowly fading | grows far beyond $\sqrt{S}$ | inflate $\mathbf{Q}$, fade memory |
| Unmodelled dynamics or bias | steady offset | strong, slowly fading | too large | augment the state |
| Unobservable state | looks normal | looks normal | looks normal | check observability; watch $\mathbf{P}$ itself |
| Numerical failure | nonsense once $\mathbf{P}$ breaks | nonsense | $S$ may even go negative | Joseph, square-root, UD; symmetrize |
| Outlier | one huge spike | a slow tail after the spike | one value tens of $\sqrt{S}$ | gate |

The unobservable state is the odd one out: the sensor never sees that direction, so the innovations cannot show it. Every other cause is a statistical signature, not a crash, and none produces an error message. That is why the next lesson turns the innovation sequence into formal tests instead of something to eyeball.

## Check yourself

::: check
A filter has been running for months with no obvious problems. Then a single bad measurement arrives. Explain, in the trust-ratio language of the gain lesson, why the estimate takes many cycles to recover rather than one.
:::

::: answer
A long-settled filter has a small $\mathbf{P}^-$, so its trust ratio $P^-/R$ and its gain are small — correctly, since it really has converged. The outlier is absorbed with that small gain, but it still moves the estimate ($14.7\,\mathrm{m}$ of altitude and $10.8\,\mathrm{m/s}$ of velocity in the example). The covariance update never looks at the measurement, so $\mathbf{P}$ and the gain stay just as small afterward. Each honest measurement then pulls back only a small fraction of the remaining error — about $14\%$ of the altitude error per cycle in the example — so recovery is geometric, the same $(1 - K)$ shrinking the steady-state lesson described. It is ordinary convergence, but back from a wrong answer, while reporting a small $\sigma$ the whole time.
:::

::: check
State augmentation beat $\mathbf{Q}$ inflation in the deceleration example, even though both "give the filter more freedom". Why?
:::

::: answer
$\mathbf{Q}$ inflation adds freedom everywhere, evenly, as an admission of ignorance. It never learns the acceleration; it only tolerates its effect by staying less certain about everything. Augmentation adds freedom in exactly the one direction the physics needs: a new state whose correlation with velocity lets the ordinary update estimate the acceleration from the same data. It ends with about $-2.97\,\mathrm{m/s^2}$ — a real estimate of the missing physics — and an RMS error about three times smaller. Inflating $\mathbf{Q}$ never asked the model to explain the disagreement, only to shrug at it.
:::

::: check
Fading memory with $\lambda = 1.02$ helped a lot but left the filter well short of the augmented one. Why would raising $\lambda$ further not be a free improvement?
:::

::: answer
Fading memory inflates the entire predicted covariance every cycle, not only the direction that needs it. A higher $\lambda$ keeps raising every gain, including gains on states whose dynamics were captured correctly, so ordinary measurement noise starts moving states that did not need correcting. That is the "$\mathbf{Q}$ too large chases noise" failure of the process-noise lesson, reached by another route. Pushing a global inflation far enough to fully fix one badly modeled direction necessarily over-inflates every well-modeled one too. Even at $\lambda = 1.05$ the example's real error was still more than three times the reported $\sigma_p$.
:::

::: check
In the $4\%$ gain-error case, symmetrizing left the smallest eigenvalue at $-0.0385$, unchanged, because the raw asymmetry was only about $10^{-6}$. Suppose instead the asymmetry at that step had been large, say $0.5$. Would symmetrizing have been likely to rescue the filter?
:::

::: answer
Not in any reliable way. Symmetrizing replaces each off-diagonal pair with its average. Whether the result is positive definite depends on its eigenvalues, and averaging two off-diagonal numbers has no particular connection to those. The averaged matrix might happen to be positive definite, might reveal a negative eigenvalue the asymmetry had been masking, or might stay just as broken. A large asymmetry is itself a sign that something upstream is badly wrong. When the gain itself may be wrong, the dependable tool is the Joseph form, positive semi-definite for any gain by construction; symmetrization is for tidying tiny round-off.
:::

::: check
Of the five causes, which one can stay completely hidden from someone who is carefully watching the innovations?
:::

::: answer
An unobservable state. Every other cause leaves some mark on the innovations: a steady offset or slowly fading pattern from unmodelled dynamics or a too-small $\mathbf{Q}$, a single huge spike from an outlier, outright nonsense from a numerical failure. An unobservable state, by definition, has no effect on anything the sensor measures. The innovations can therefore look perfectly healthy forever while that one direction's true error grows or sits wrong. Finding it takes a check of the model itself — the observability lesson's rank test — or a look at the covariance growing in that direction, not a look at the data.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Divergence | Reported covariance and real error drift apart, usually covariance shrinking while error grows |
| Five causes | Underestimated $\mathbf{Q}$; unmodelled dynamics or bias; unobservable states; numerical loss of symmetry or positive definiteness; unrejected outliers |
| Outlier | One innovation far too big for its $S$ ($\nu^2/S \approx 2120$ in the example); $\mathbf{P}$ shrinks anyway, so the filter is confidently wrong for many steps |
| Augment the state | Add the missing physics as a state; best fix when the gap can be named; about $3\times$ better in the example, and it estimates the missing quantity |
| Inflate $\mathbf{Q}$ | Keeps the gain up; stops the runaway but leaves the covariance dishonest |
| Fade memory | $\mathbf{P}_k^- = \lambda^2\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, $\lambda \geq 1$; old data weighted by $\lambda^{-2j}$; global and crude |
| Symmetrize | $\mathbf{P} \leftarrow \tfrac12(\mathbf{P} + \mathbf{P}^{\mathsf{T}})$; cheap guard against round-off asymmetry; no help against a bad gain |
| Structural fix | Joseph, square-root or UD forms make an indefinite $\mathbf{P}$ impossible |
| Gate | Reject innovations far too large for $S$; the lesson after next |

Every cause here leaves a trace in numbers the filter already has: an innovation, a covariance, an eigenvalue. The next lesson turns those traces into formal statistical tests, run the way a flight team runs them — over many trials and against a precise threshold — so that "the filter looks fine" becomes a number you can defend.

::: context divergence-word Two curves pulling apart
In mathematics, two things **diverge** when the gap between them keeps growing instead of settling down. For a filter, the two things are the error it *claims* (its standard deviation from $\mathbf{P}$) and the error it really has. Here are both for the under-tuned booster filter ($q = 0.005$) flying through the hidden deceleration. The blue band is three reported standard deviations; the red curve is the real altitude error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="127">10</text><text x="45" y="81">20</text><text x="45" y="34">30</text>
  </g>
  <g stroke="#6c7a93" stroke-width="0.5"><line x1="50" y1="123.3" x2="330" y2="123.3"/><line x1="50" y1="76.7" x2="330" y2="76.7"/><line x1="50" y1="30" x2="330" y2="30"/></g>
  <polygon fill="#8fb8f0" points="50,170 50,142.5 59.4,153.4 68.8,155.0 78.2,156.9 87.6,158.3 97.0,159.4 106.4,160.2 115.8,160.9 125.2,161.4 134.6,161.8 144.0,162.2 153.4,162.5 162.8,162.8 172.1,163.0 181.5,163.2 190.9,163.4 200.3,163.5 209.7,163.6 219.1,163.7 228.5,163.8 237.9,163.8 247.3,163.9 256.7,163.9 266.1,163.9 275.5,163.9 284.9,164.0 294.3,164.0 303.7,164.0 313.1,164.0 322.5,164.0 330.0,164.0 330,170"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,164.6 55.6,160.3 61.3,162.7 66.9,159.4 72.6,161.9 78.2,164.3 83.8,165.6 89.5,167.8 95.1,166.1 100.7,163.3 106.4,159.1 112.0,157.9 117.7,154.2 123.3,151.5 128.9,147.0 134.6,144.5 140.2,140.3 145.8,133.4 151.5,132.3 157.1,131.1 162.8,128.2 168.4,125.5 174.0,123.0 179.7,119.3 185.3,114.1 190.9,110.5 196.6,105.8 202.2,103.1 207.9,99.6 213.5,96.6 219.1,93.7 224.8,91.0 230.4,88.7 236.0,86.7 241.7,83.9 247.3,82.1 253.0,80.1 258.6,77.1 264.2,76.7 269.9,75.7 275.5,73.3 281.1,69.4 286.8,68.4 292.4,64.9 298.1,61.1 303.7,58.2 309.3,55.5 315.0,52.8 320.6,49.8 326.2,47.7 330.0,45.5"/>
  <text x="200" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">time step (0 to 150)</text>
  <text x="14" y="100" font-size="11" fill="#1f2a44" transform="rotate(-90 14 100)" text-anchor="middle">metres</text>
  <text x="250" y="60" font-size="12" fill="#b4232c">real error</text>
  <text x="200" y="155" font-size="12" fill="#1d6fd1">claimed 3σ</text>
</svg>
```
:::

::: context negative-variance Why a variance can never be negative
A variance is an average of *squared* errors, and a square is never negative, so no variance can be below zero. For a covariance matrix the same rule says: pick any direction in the state, and the variance along that direction, $\mathbf{u}^{\mathsf{T}}\mathbf{P}\mathbf{u}$, must be zero or more. A matrix that passes for every direction is **positive semi-definite**; one that is strictly above zero for every direction is **positive definite**. Every eigenvalue of such a matrix is non-negative. A matrix with a negative eigenvalue — an **indefinite** one — claims a direction with negative spread, which no real uncertainty can have.
:::

::: context multipath Echoes that take the long way
A radar altimeter times how long its pulse takes to bounce off the ground and come back. Usually the first strong echo is the straight-down one. But part of the pulse can hit the ground at a slant, bounce off something else on the way back — a nearby hillside, or the vehicle's own landing leg — and arrive late. The receiver sees a longer trip and reports a bigger altitude. This is **multipath**: one signal reaching the receiver by more than one path. GPS receivers suffer the same thing near tall buildings, which is why phone positions jump around downtown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="130" x2="350" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <rect x="160" y="20" width="40" height="24" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">radar</text>
  <line x1="180" y1="44" x2="180" y2="130" stroke="#1d6fd1" stroke-width="2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="186,44 260,130 300,70 196,44"/>
  <rect x="292" y="60" width="18" height="20" fill="#6c7a93"/>
  <text x="70" y="90" font-size="12" fill="#1d6fd1">direct echo</text>
  <text x="236" y="148" font-size="12" fill="#b4232c" text-anchor="end">longer, bounced path</text>
</svg>
```
:::

::: context cosmic-ray Particles from deep space
**Cosmic rays** are fast charged particles — mostly protons — arriving from the Sun and from far outside the solar system. When one passes through a camera chip, it knocks loose electrons and leaves a bright dot or streak for a single frame. A star tracker looking for bright dots can mistake that hit for a star, or have a real star's position nudged. Above the atmosphere, and especially in the radiation belts, such hits are routine, so flight software is written to expect them.
:::

::: context jerk The rate of change of acceleration
Velocity is how fast position changes. Acceleration is how fast velocity changes. **Jerk** is how fast acceleration changes, measured in $\mathrm{m/s^3}$. You feel it when an elevator starts or stops abruptly: the acceleration switches on suddenly, and that sudden switch is a large jerk. In the augmented filter, the jerk noise $q_a$ plays the same role that the acceleration noise $q$ played in the constant-velocity model: it says how quickly the filter should expect the thing at the end of the chain to wander. A small $q_a$ says "the acceleration is nearly constant", which suits a steady drag or throttle setting.
:::

::: context forgetting-factor How fast the past fades
With $\lambda = 1.02$, a measurement's weight is multiplied by $1/1.02^2 \approx 0.961$ every step. After $17.5$ steps it counts half as much as a fresh one; after $50$ steps, about $14\%$. With $\lambda = 1$ (the ordinary filter, gray line) nothing is forgotten. The bars show how much a measurement of each age still counts at $\lambda = 1.02$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="345" y2="40" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="343" y="34" font-size="11" fill="#6c7a93" text-anchor="end">λ = 1: weight stays 1</text>
  <g fill="#1d6fd1">
    <rect x="52" y="40" width="16" height="110"/><rect x="78" y="59.8" width="16" height="90.2"/>
    <rect x="104" y="76" width="16" height="74"/><rect x="130" y="89.3" width="16" height="60.7"/>
    <rect x="156" y="100.2" width="16" height="49.8"/><rect x="182" y="109.1" width="16" height="40.9"/>
    <rect x="208" y="116.5" width="16" height="33.5"/><rect x="234" y="122.5" width="16" height="27.5"/>
    <rect x="260" y="127.4" width="16" height="22.6"/><rect x="286" y="131.5" width="16" height="18.5"/>
    <rect x="312" y="134.8" width="16" height="15.2"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="164">0</text><text x="112" y="164">10</text><text x="164" y="164">20</text><text x="216" y="164">30</text><text x="268" y="164">40</text><text x="320" y="164">50</text>
  </g>
  <text x="190" y="178" font-size="11" fill="#1f2a44" text-anchor="middle">age of the measurement (steps)</text>
  <text x="34" y="44" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
</svg>
```
:::

::: context round-off Seven digits and no more
A computer stores a number in a fixed number of binary digits. **Single precision** (32 bits, called float32) keeps 24 binary digits of the number, about seven decimal digits. Anything finer is rounded away, and each rounding error is up to about one part in $10^{7}$ of the number. Adding and multiplying thousands of times a second lets those tiny errors add up. Early flight computers had even shorter words, which is why the square-root and UD forms were invented for them. Modern flight code often uses double precision (about sixteen digits), but embedded processors and fixed-point hardware still bring the problem back.
:::

::: context cholesky A surveyor's square root
**Cholesky factorization** writes a symmetric, positive-definite matrix as $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, with $\mathbf{L}$ lower-triangular — a matrix version of a square root. It is named after André-Louis Cholesky, a French army officer who worked out the method while solving least-squares problems for map-making surveys. He was killed in the First World War in 1918, and the method was published by a fellow officer after his death. The algorithm only works on a positive-definite matrix, so it doubles as a test: if Cholesky fails, $\mathbf{P}$ is not a valid covariance.
:::
