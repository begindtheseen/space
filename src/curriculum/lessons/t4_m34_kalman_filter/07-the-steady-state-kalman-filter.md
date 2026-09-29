---
id: l07-the-steady-state-kalman-filter
title: The steady-state Kalman filter
minutes: 23
covers:
  - The steady-state Kalman filter
---

Fill a bathtub with the drain open. At first the water rises fast, because the drain hardly lets anything out when the tub is nearly empty. As the water gets deeper, the drain lets out more and more. Eventually the water level stops moving. It has not stopped because the tap is off — the tap is still running. It has stopped because the water going out through the drain now exactly matches the water coming in from the tap. That level is a **[[balance point|fixed-point]]**: a level the tub sends back to itself.

A Kalman filter's uncertainty behaves the same way. Every predict step pours uncertainty in — that is $\mathbf{Q}$, the tap. Every update step drains a fraction of it out — that is the measurement, the drain. Run the filter long enough and the covariance settles at the level where the two balance. That settled filter is the **steady-state Kalman filter**: the filter whose covariance, and therefore whose gain, no longer changes from step to step.

The Riccati lesson left a question open on purpose. In the descending-booster example, the predicted position variance fell from about $100$ at step 1 to $2.22\,\mathrm{m^2}$ at step 4, then barely moved. "Barely moving" is not the same as "arrived". This lesson answers three questions in order. Does the recursion settle at all, and when? What exactly does it settle to, and how do you compute that directly instead of iterating toward it? And what is it good for? The last answer is practical: once the gain stops changing, a flight computer can store it as a constant and skip a large part of its work every cycle.

## The scalar steady state, solved exactly

Start where you can get an exact answer by hand: one state, a random walk, measured directly. Here $F = 1$ and $H = 1$, and everything is an ordinary number. Read $P^-_k$ as "P minus sub k", the predicted variance before the $k$-th measurement.

The update step makes the gain $K = P^-/(P^- + R)$ and the new variance $P^+ = (1 - K)P^-$. Since $1 - K = R/(P^- + R)$, that is

$$
P^+_k = \frac{P^-_k R}{P^-_k + R}.
$$

The predict step then adds the process noise: $P^-_{k+1} = P^+_k + Q$. Put the two together and you get one rule that takes one predicted variance to the next:

$$
P^-_{k+1} = Q + \frac{P^-_k R}{P^-_k + R}.
$$

The first term is the tap. The fraction is what survives the drain.

A **steady state** is a variance $y \geq 0$ that this rule sends back to itself, so $y = Q + yR/(y + R)$. Multiply both sides by $(y + R)$ to clear the fraction, expand, and cancel the $yR$ that appears on both sides:

$$
y(y+R) = Q(y+R) + yR \implies y^2 + yR = Qy + QR + yR \implies y^2 - Qy - QR = 0.
$$

That is a quadratic in $y$. The quadratic formula gives $y = \big(Q \pm \sqrt{Q^2 + 4QR}\big)/2$. When $R > 0$, the square root $\sqrt{Q^2 + 4QR}$ is bigger than $Q$, so the minus sign gives a negative number. A variance can never be negative, so only the plus sign survives. Subtract $Q$ to get the variance just after an update, and form the gain from it:

::: key The scalar steady-state covariance, in closed form
$$
P^-_{ss} = \frac{Q + \sqrt{Q^2 + 4QR}}{2}, \qquad
P^+_{ss} = P^-_{ss} - Q = \frac{-Q + \sqrt{Q^2+4QR}}{2}, \qquad
K_{ss} = \frac{P^-_{ss}}{P^-_{ss}+R}.
$$
:::

The little "ss" means steady state. Check the units: $Q$ and $R$ are both variances, so $\sqrt{Q^2 + 4QR}$ is a variance too, and the gain is a plain number between $0$ and $1$.

Finding a balance point does not yet prove the filter *reaches* it from any start. For the bathtub, experience tells you. For the filter it needs an argument, and in the scalar case the argument is short enough to give in full.

::: note Why it has to be true: the scalar recursion always converges
Call the rule $f(y) = Q + yR/(y+R)$, so the filter does $y_{k+1} = f(y_k)$. Two facts about $f$, for every $y \geq 0$:

- Its slope is $f'(y) = R^2/(y+R)^2$, which is positive. So $f$ is **increasing**: a bigger variance in gives a bigger variance out.
- Its second derivative is $f''(y) = -2R^3/(y+R)^3$, which is negative. So $f$ is **[[concave|concave]]**: its graph bends downward, flattening as $y$ grows.

At $y = 0$, $f(0) = Q > 0$, so the graph of $f$ starts *above* the diagonal line "output = input". A curve that starts above that line and keeps flattening crosses it exactly once, at $P^-_{ss}$, and stays below it afterwards. So $f(y) > y$ when $y$ is below $P^-_{ss}$ (the variance grows toward it), and $f(y) < y$ when $y$ is above $P^-_{ss}$ (the variance shrinks toward it). Because $f$ is increasing, a start below $P^-_{ss}$ can never jump past it: if $y < P^-_{ss}$ then $f(y) < f(P^-_{ss}) = P^-_{ss}$. The same holds from above. The sequence therefore creeps toward $P^-_{ss}$ from one side, never overshooting and never oscillating. That is a complete proof that the scalar recursion converges to its one positive balance point from *any* non-negative start.
:::

::: example The scalar steady state against the sawtooth
The predict-and-update lesson ran a scalar filter with $P^+_0 = 25$, $Q = 0.2$ and $R = 1$, and stopped after six rows. Now find where it is heading.

**Closed form.** $Q^2 + 4QR = 0.04 + 0.8 = 0.84$, and $\sqrt{0.84} = 0.916515$. So

$$
P^-_{ss} = \frac{0.2 + 0.916515}{2} = 0.558258, \qquad P^+_{ss} = 0.558258 - 0.2 = 0.358258.
$$

The gain is $K_{ss} = 0.558258/1.558258 = 0.358258$. (It equals $P^+_{ss}$ here only because $R = 1$: in general $P^+_{ss} = K_{ss}R$.)

**Carry on the table.** Continuing the sawtooth past its sixth row, the variances just after each update are

$$
P^+_k = 0.3844,\ 0.3688,\ 0.3626,\ 0.3600,\ 0.3590,\ 0.3586,\ 0.3584,\ 0.3583,\ 0.3583 \quad (k = 4, \ldots, 12).
$$

By $k = 11$ they match $P^+_{ss} = 0.3583$ to four decimal places. Starting instead from $y_0 = 0$ and applying $f$ thirty times gives $0.5582576$, the same as the formula to seven digits.

**How fast?** The slope of $f$ at the balance point is $f'(P^-_{ss}) = 1/1.558258^2 = 0.411833$. Separately, $(1 - K_{ss})^2 = 0.641742^2 = 0.411833$ — the same number. That is no accident: $1 - K_{ss} = R/(P^-_{ss} + R)$, and squaring it gives exactly $R^2/(P^-_{ss}+R)^2 = f'(P^-_{ss})$. Near the balance point, each step multiplies the leftover gap by about $0.41$, so the gap shrinks by more than half per step.

Sanity check: the table's gaps to $0.3583$ are $0.0261$, $0.0105$, $0.0043$, $0.0017$ — each about $0.4$ times the one before. It fits.
:::

That last fact is worth remembering in words. The estimation *error* shrinks by a factor $(1 - K_{ss})$ each step, but the *covariance's* distance to its steady state shrinks by the square of that factor. You will see the same squaring in the matrix case.

## When the matrix recursion is sure to settle

The scalar proof does not carry over to matrices line by line. But the conditions under which the matrix Riccati recursion settles to one unique answer, whatever $\mathbf{P}_0$ you start from, are a classical result of Kalman filtering theory. They use two words from the state-space module.

- The pair $(\mathbf{F}, \mathbf{H})$ must be **[[detectable|detectable-stabilizable]]**: every part of the state that would grow, or at least not die out, on its own must show up in the measurements, directly or through the dynamics.
- Write $\mathbf{Q} = \mathbf{G}_w\mathbf{G}_w^{\mathsf{T}}$ for some matrix $\mathbf{G}_w$ (read "G sub w": the way process noise enters the state). The pair $(\mathbf{F}, \mathbf{G}_w)$ must be **stabilizable**: every part of the state that would not die out on its own must receive some process noise.

Each condition has a plain reason. Suppose some growing direction were invisible to $\mathbf{H}$. Then no measurement could ever stop the error growing along it, and no finite steady state could exist. Detectability rules that out. Now suppose some growing direction received no process noise at all. Then nothing in the model would ever add to its uncertainty or reveal it independently, and where the recursion ended up could depend on how much of that direction happened to be in $\mathbf{P}_0$. Stabilizability rules that out too.

::: key Conditions for a unique steady state
If $(\mathbf{F}, \mathbf{H})$ is detectable and $(\mathbf{F}, \mathbf{G}_w)$ is stabilizable, with $\mathbf{Q} = \mathbf{G}_w\mathbf{G}_w^{\mathsf{T}}$, the Riccati recursion converges to one positive semi-definite $\mathbf{P}_{ss}$ from *every* starting $\mathbf{P}_0 \succeq \mathbf{0}$, and the resulting fixed-gain filter is stable.
:::

The symbol $\succeq \mathbf{0}$, read "is positive semi-definite", means the matrix is a valid covariance: no direction has negative variance. This module does not prove the matrix case in full. It is a genuinely deep result. The scalar proof above is its complete argument in one dimension, and the numerical check below tests the two-dimensional case directly instead of taking it on faith.

For the running constant-velocity model with position-only measurements, both conditions hold easily. The observability matrix is

$$
\begin{pmatrix}\mathbf{H}\\ \mathbf{H}\mathbf{F}\end{pmatrix} = \begin{pmatrix}1 & 0\\ 1 & \Delta t\end{pmatrix},
$$

with determinant $\Delta t \neq 0$. So $(\mathbf{F}, \mathbf{H})$ is not merely detectable but fully **observable** — the state-space module's rank test. The stochastic-model lesson showed $\mathbf{Q}$ has determinant $q^2\Delta t^4/12 > 0$, so it has full rank. That lets $\mathbf{G}_w$ be square and invertible, which makes $(\mathbf{F}, \mathbf{G}_w)$ controllable and certainly stabilizable. A unique steady state is guaranteed before a single number is computed.

## The matrix steady state, computed and confirmed

You do not have to iterate to find $\mathbf{P}_{ss}$. Setting $\mathbf{P}^-_{k+1} = \mathbf{P}^-_k = \mathbf{P}_{ss}$ in the Riccati recursion turns it into one matrix equation, the **discrete algebraic Riccati equation**. It is the same equation the optimal-control module solves for LQR, with the matrices swapped.

::: key The Riccati recursion and its steady state
$$
\mathbf{P}^-_{k+1} = \mathbf{F}\Big(\mathbf{P}^-_k - \mathbf{P}^-_k\mathbf{H}^{\mathsf{T}}\big(\mathbf{H}\mathbf{P}^-_k\mathbf{H}^{\mathsf{T}} + \mathbf{R}\big)^{-1}\mathbf{H}\mathbf{P}^-_k\Big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$
Its steady state is the dual of the LQR discrete algebraic Riccati equation (DARE) — the same equation with $\mathbf{A}^{\mathsf{T}}$, $\mathbf{C}^{\mathsf{T}}$, $\mathbf{Q}$ and $\mathbf{R}$ exchanged in.
:::

That duality is practical, not only pretty. Any solver written for LQR solves the filter too, if you hand it $\mathbf{F}^{\mathsf{T}}$ where it expects $\mathbf{A}$ and $\mathbf{H}^{\mathsf{T}}$ where it expects $\mathbf{B}$. SciPy's `solve_discrete_are` uses a **[[Schur-decomposition method|schur-solver]]** to get the answer in one shot.

```python
import numpy as np
from scipy.linalg import solve_discrete_are

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])

# The LQR solver, handed F.T and H.T: this is the duality at work.
P_ss = solve_discrete_are(F.T, H.T, Q, R)
print(P_ss)
# [[0.64517587 0.48193235]
#  [0.48193235 0.69436351]]
```

::: example Three wildly different starts, one destination
Use the descending-booster model: $\Delta t = 0.1\,\mathrm{s}$, $q = 0.5$, $R = 4\,\mathrm{m^2}$. Run the Riccati recursion from three very different starting covariances until you reach $\mathbf{P}^-_{60}$, and compare each with the direct solution:

$$
\mathbf{P}_{ss} = \begin{pmatrix}0.645176 & 0.481932\\ 0.481932 & 0.694364\end{pmatrix}.
$$

| Starting $\mathbf{P}_0$ | What it says | $P^-_{pp}$ at step 60 | Largest gap to $\mathbf{P}_{ss}$ |
| --- | --- | --- | --- |
| $\operatorname{diag}(10^{-6}, 10^{-6})$ | almost perfect knowledge | $0.644904$ | $2.72\times10^{-4}$ |
| $\operatorname{diag}(10^8, 10^8)$ | almost no knowledge | $0.645626$ | $6.71\times10^{-4}$ |
| $\operatorname{diag}(100, 25)$ | the module's usual start | $0.645606$ | $6.50\times10^{-4}$ |

The starts differ by fourteen powers of ten. After sixty steps all three are within about seven parts in ten thousand of the direct answer. Running the usual start on to step $200$ closes the gap to about $5\times10^{-13}$, which is the limit of double-precision arithmetic.

Sanity check: the near-perfect start approaches from *below* ($0.6449 < 0.6452$) and the other two from *above*. Too little knowledge fills up; too much drains down. That is the bathtub again.
:::

## How fast it settles, and what the eigenvalues say

Once the covariance has settled, so has the gain. Here $\mathbf{K}_{ss} = \mathbf{P}_{ss}\mathbf{H}^{\mathsf{T}}\mathbf{S}_{ss}^{-1} = (0.138892,\ 0.103749)^{\mathsf{T}}$, where $\mathbf{S}_{ss}$ is the settled innovation covariance.

A fixed gain defines a fixed matrix,

$$
\mathbf{A}_{cl} = (\mathbf{I} - \mathbf{K}_{ss}\mathbf{H})\mathbf{F}.
$$

It carries the estimation error after one update, $\mathbf{e}^+_{k-1}$, to the error after the next, $\mathbf{e}^+_k$, if you ignore the fresh noise that keeps nudging it. ("cl" stands for closed loop.) This is exactly the state-space module's **[[Luenberger observer|luenberger]]** error matrix, $\mathbf{A} - \mathbf{L}\mathbf{C}$, with the gain set to $\mathbf{K}_{ss}$ instead of placed by hand. So a steady-state Kalman filter *is* a Luenberger observer: the particular one whose gain gives the smallest steady-state error covariance, instead of one chosen for its poles.

The eigenvalues of $\mathbf{A}_{cl}$ say how fast errors die away. Here they are a **[[complex pair|eigen-circle]]**, $0.92537 \pm 0.06932i$, both of size $|\lambda| = 0.92796$ (read $|\lambda|$ as "the size of lambda"). Both sit inside the unit circle, so errors shrink every step and the filter is stable, exactly as the state-space module's test requires.

That size also answers "how fast?" Just as in the scalar case, the covariance's gap to its steady state shrinks at about the *square* of that rate: $0.92796^2 = 0.86111$ per step. So each step removes only about $14\%$ of the remaining gap, since $1 - 0.861 = 0.139$.

Measuring it confirms this, but not smoothly. Because the eigenvalues are complex, the error spirals as it shrinks, so the ratio between one step's gap and the next wobbles — anywhere from $0.74$ to almost $1$. Averaged over a long stretch the wobble cancels: from step $50$ to step $200$, the largest-entry gap shrinks by a factor of $0.862$ per step on average, matching the predicted $0.861$.

::: warning A slowing sequence is not a settled one
Go back to the number that opened this lesson. By step $4$ the predicted position variance was $2.224\,\mathrm{m^2}$ and changing only slightly. But the true destination is $0.645\,\mathrm{m^2}$. At step $4$ the variance was still $1.58\,\mathrm{m^2}$ above it — more than twice the destination itself. Closing that gap to within $0.001$ takes until about step $58$, because each step only removes $14\%$ of what is left. A sequence that is slowing down is not evidence that it has nearly arrived. Only a computed $\mathbf{P}_{ss}$, or an eigenvalue size that tells you how many steps a given tolerance needs, is evidence of that.
:::

::: note Why the covariance rate is the square of the error rate
Near the steady state, write $\mathbf{P}^-_k = \mathbf{P}_{ss} + \boldsymbol{\Delta}_k$ with $\boldsymbol{\Delta}_k$ small. Put this into the Riccati recursion and keep only the terms that are first order in $\boldsymbol{\Delta}_k$. The result is $\boldsymbol{\Delta}_{k+1} \approx \mathbf{A}\boldsymbol{\Delta}_k\mathbf{A}^{\mathsf{T}}$ with $\mathbf{A} = \mathbf{F}(\mathbf{I} - \mathbf{K}_{ss}\mathbf{H})$. That matrix has the same eigenvalues as $\mathbf{A}_{cl}$ (swapping the order of two factors never changes eigenvalues). The gap is multiplied by $\mathbf{A}$ on the left *and* on the right, so each step shrinks it by about $|\lambda|$ twice: $|\lambda|^2$. In the scalar case $\mathbf{A}$ is the number $1 - K_{ss}$, and the rule becomes the $(1-K_{ss})^2$ found earlier.
:::

## The payoff: a gain you can store, once it has settled

Here is why engineers compute all this offline. $\mathbf{K}_{ss}$ never changes. So a flight computer can skip forming $\mathbf{S}_k$, inverting it and updating $\mathbf{P}$ every cycle. It multiplies each innovation by a stored constant instead. That saves a lot of arithmetic on a small processor.

Notice what $\mathbf{K}_{ss}$ depends on: only $\mathbf{F}$, $\mathbf{H}$, $\mathbf{Q}$ and $\mathbf{R}$. It does not depend on $\mathbf{P}_0$, because every start ends in the same place. It does not depend on the measurements either, because the Riccati recursion never reads them.

::: key What the steady-state gain depends on
$\mathbf{K}_{ss} = \mathbf{P}_{ss}\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_{ss}\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ is set by $\mathbf{F}$, $\mathbf{H}$, $\mathbf{Q}$ and $\mathbf{R}$ alone — not by $\mathbf{P}_0$ and not by the data. A bigger $\mathbf{Q}$ raises it (trust the measurements more); a bigger $\mathbf{R}$ lowers it (trust the prediction more).
:::

Is it safe to use the stored gain from the very first measurement? The answer is a clean no.

::: example Using the settled gain from the start costs accuracy early
Run the descending-booster filter two ways against the same simulated flight — the same seed as the predict-and-update lesson, so step 1 matches that lesson's table. Filter A is the ordinary time-varying filter. Filter B uses the constant $\mathbf{K}_{ss}$ from step 1 onward and never touches $\mathbf{P}$. Both start from $\hat{\mathbf{x}}_0 = (2400, -60)$, while the truth starts at $(2500, -70)$.

| Step | True position (m) | Filter A estimate (m) | Filter B estimate (m) | A minus B (m) |
| --- | --- | --- | --- | --- |
| $1$ | $2493.01$ | $2494.16$ | $2408.47$ | $85.69$ |
| $2$ | $2486.00$ | $2486.98$ | $2414.94$ | $72.04$ |
| $5$ | $2464.99$ | $2466.25$ | $2427.74$ | $38.50$ |
| $10$ | $2430.04$ | $2432.01$ | $2430.02$ | $2.00$ |
| $20$ | $2360.26$ | $2360.16$ | $2381.95$ | $-21.78$ |
| $50$ | $2149.20$ | $2150.32$ | $2150.88$ | $-0.56$ |
| $100$ | $1801.55$ | $1801.12$ | $1801.16$ | $-0.03$ |
| $200$ | $1116.25$ | $1115.67$ | $1115.67$ | $-0.00005$ |

**Step 1.** Filter A starts with $P^-_{pp} = 100.25$, so its gain is $0.962$: it trusts the first measurement almost completely and lands $1.2\,\mathrm{m}$ from the truth. Filter B uses $K_{ss,p} = 0.139$, the trust level of a filter that already knows the position to under a meter. It moves only $14\%$ of the way to a measurement that was about $104\,\mathrm{m}$ from its prediction, and ends $85\,\mathrm{m}$ off.

**Steps 10 to 20.** Filter B's error does not shrink steadily. It swings past zero and comes back, about $22\,\mathrm{m}$ off the other way at step $20$ — the spiral of the complex eigenvalues, seen in real numbers.

**Late on.** By step $100$ the two agree to $3\,\mathrm{cm}$, and by step $200$ to a twentieth of a millimeter. Over the last hundred steps their root-mean-square position errors are $0.862\,\mathrm{m}$ for A and $0.856\,\mathrm{m}$ for B: no real difference. (The tiny edge for B is luck of this one noise sequence.) Over the first twenty steps it is $1.31\,\mathrm{m}$ for A against $34.3\,\mathrm{m}$ for B.

Sanity check: the filter's own steady-state standard deviation is $\sqrt{P^+_{ss,pp}} = 0.745\,\mathrm{m}$, and the measured errors near $0.86\,\mathrm{m}$ are the same size. Nothing is broken.
:::

That gives the standard way to fly it. Run the full time-varying filter through **[[acquisition|acquisition]]**, the opening stretch when the filter first locks on. Switch to the stored gain only once $\mathbf{P}^-_k$ has truly converged — checked against the precomputed $\mathbf{P}_{ss}$, not against how flat the last few steps looked.

## Check yourself

::: check
Why is the negative root of $y^2 - Qy - QR = 0$ thrown away? What would it mean if a real filter ever printed a negative variance?
:::

::: answer
$y$ stands for a variance, and a variance is an average of squares, so it can never be negative. The negative root solves the *equation* but not the *problem* the equation was built to describe.

If a running filter ever printed a negative variance, the filter would not have "found the other root". It would mean the arithmetic that produced the number had broken down — most likely the simplified covariance update $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ used with an imperfect gain. The numerically-stable-formulations lesson later in this module studies exactly that failure.
:::

::: check
A filter's model has a mode that neither grows nor shrinks on its own (an eigenvalue of $\mathbf{F}$ exactly on the unit circle, as in the constant-velocity model). But that mode is never measured, directly or through correlation with anything that is. What does the detectability condition say about the steady state, and why?
:::

::: answer
Detectability of $(\mathbf{F}, \mathbf{H})$ requires every mode that does not die out on its own to be observable. A marginal mode with no path to any measurement breaks that rule, so the guarantee of a finite $\mathbf{P}_{ss}$ no longer holds.

Concretely, that mode's variance is handled only by the predict step. Its eigenvalue has size $1$, so prediction does not shrink it, and no update ever corrects it. If $\mathbf{Q}$ puts any noise along it, its variance grows by that much every step, without limit, and no steady state exists. The next lesson studies this situation directly.
:::

::: check
Use the identity $(1 - K_{ss})^2 = f'(P^-_{ss})$ to explain, without new numbers, why a sensor with a much larger $R$ gives a filter that settles more *slowly*.
:::

::: answer
$f'(P^-_{ss}) = R^2/(P^-_{ss} + R)^2$. As $R$ grows much larger than $P^-_{ss}$, the fraction $R/(P^-_{ss} + R)$ gets close to $1$, so $(1 - K_{ss})^2$ gets close to $1$ too. Each step then removes only a tiny part of the gap to steady state.

In trust-ratio terms: a large $R$ means a small $K_{ss}$, and a small gain means the filter closes only a small fraction of any error each cycle — whether that error is uncertainty that built up between updates or the leftover distance to steady state. A noisier sensor makes a slower-settling filter.
:::

::: check
Why does using $\mathbf{K}_{ss}$ from the first measurement give an estimate that is *worse* early on than the time-varying filter's, and not merely different?
:::

::: answer
The best gain at any step depends on the actual $\mathbf{P}^-_k$ at that step, as the trust-ratio lesson showed. $\mathbf{K}_{ss}$ is the best gain only for the settled covariance $\mathbf{P}_{ss}$. At step 1 the real $\mathbf{P}^-_1$ is far larger than $\mathbf{P}_{ss}$ — the filter genuinely knows much less than it eventually will.

Using the small, settled gain on that large uncertainty **under-corrects**: the estimate moves toward each early measurement by less than the best amount. In the example the fixed-gain filter moved $14\%$ of the way toward a first measurement it should have trusted $96\%$, and ended $85\,\mathrm{m}$ off. Since the time-varying filter is the minimum-variance filter at every step, any other gain — including $\mathbf{K}_{ss}$ — can only do worse on average there.
:::

::: check
Without computing anything new, describe how the comparison table would change if $\mathbf{P}_0$ had been very close to $\mathbf{P}_{ss}$ from the start. Assume the initial estimate is also correspondingly good.
:::

::: answer
The time-varying gain at step 1 comes from $\mathbf{P}^-_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. If $\mathbf{P}_0 \approx \mathbf{P}_{ss}$, this is already close to the settled value, so the time-varying gain starts close to $\mathbf{K}_{ss}$ and stays close.

The big early gaps in the table — tens of meters at steps 1 to 20 — would shrink to almost nothing at every step. There would be no large start-up uncertainty for the fixed-gain filter to under-correct. The two filters would track closely from the first measurement, and using $\mathbf{K}_{ss}$ immediately would cost very little.
:::

## Summary

| Item | Statement |
| --- | --- |
| Scalar steady state | $P^-_{ss} = (Q+\sqrt{Q^2+4QR})/2$, $P^+_{ss}=P^-_{ss}-Q$, $K_{ss}=P^-_{ss}/(P^-_{ss}+R)$ |
| Scalar convergence | $f(y)=Q+yR/(y+R)$ is increasing and concave, so the recursion reaches $P^-_{ss}$ from any $y_0\geq0$ without overshoot; near it the gap shrinks by $f'(P^-_{ss}) = (1-K_{ss})^2$ per step |
| Matrix conditions | $(\mathbf{F},\mathbf{H})$ detectable and $(\mathbf{F},\mathbf{G}_w)$ stabilizable, $\mathbf{Q}=\mathbf{G}_w\mathbf{G}_w^{\mathsf{T}}$, give one $\mathbf{P}_{ss}\succeq\mathbf{0}$ from every $\mathbf{P}_0\succeq\mathbf{0}$ |
| Solving directly | The steady state is the dual of the LQR DARE: `solve_discrete_are(F.T, H.T, Q, R)` |
| Luenberger link | $\mathbf{A}_{cl}=(\mathbf{I}-\mathbf{K}_{ss}\mathbf{H})\mathbf{F}$ is the observer error matrix; its eigenvalues must lie inside the unit circle, and the covariance gap shrinks at about $\lvert\lambda\rvert^2$ per step |
| What $\mathbf{K}_{ss}$ depends on | $\mathbf{F}$, $\mathbf{H}$, $\mathbf{Q}$, $\mathbf{R}$ only — not $\mathbf{P}_0$, not the data |
| Practical use | Store $\mathbf{K}_{ss}$; run the full filter through acquisition and switch only once $\mathbf{P}^-_k$ has truly reached $\mathbf{P}_{ss}$ |

Convergence here rested on the model being fully observable. The next lesson looks at the other side: what the covariance and the gain do, instead of settling, when part of the state genuinely cannot be seen.

::: context fixed-point A number a rule sends back to itself
A **fixed point** of a rule is an input the rule returns unchanged. Type any number into a calculator and press the cosine key over and over (in radians): you end up stuck at $0.739085$, because $\cos(0.739085) = 0.739085$. The steady-state covariance is a fixed point of the Riccati rule. Finding one is algebra — set output equal to input and solve. Proving you *reach* it from any start is a separate, harder question, and it is the one this lesson spends most of its time on.
:::

::: context concave Why "bending downward" forces one crossing
Here is the scalar rule $f(y) = 0.2 + y/(y+1)$ (blue curve) against the diagonal "output = input" (gray), with the filter's steps drawn as a staircase from $y_0 = 0$. The curve starts above the diagonal and flattens, so it can cross it only once. Each stair lands closer to the crossing at $0.558$, and none can jump past it. This staircase drawing is called a **cobweb plot**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="190" y2="15" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,162.0 52.5,155.3 65.0,149.3 77.5,143.7 90.0,138.7 102.5,134.0 115.0,129.7 127.5,125.7 140.0,122.0 152.5,118.6 165.0,115.3 177.5,112.3 190.0,109.5 202.5,106.8 215.0,104.4 227.5,102.0 240.0,99.8 252.5,97.7 265.0,95.7 277.5,93.8 290.0,92.0 302.5,90.3 315.0,88.7 327.5,87.1 340.0,85.6"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="40.0,190.0 40.0,162.0 90.0,162.0 90.0,138.7 131.7,138.7 131.7,124.4 157.1,124.4 157.1,117.3 169.7,117.3 169.7,114.2 175.4,114.2"/>
  <circle cx="179.6" cy="111.8" r="4" fill="#1f2a44"/>
  <line x1="179.6" y1="111.8" x2="179.6" y2="190" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="179.6" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">0.558</text>
  <text x="40" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="340" y="80" font-size="12" fill="#1d6fd1" text-anchor="end">f(y)</text>
  <text x="196" y="24" font-size="12" fill="#6c7a93">output = input</text>
  <text x="96" y="178" font-size="11" fill="#b4232c">filter steps</text>
  <text x="345" y="204" font-size="11" fill="#1f2a44" text-anchor="end">y</text>
</svg>
```
:::

::: context detectable-stabilizable Two weaker cousins of observable and controllable
**Observable** means you can see *every* part of the state through the measurements. **Detectable** asks less: you only need to see the parts that would not fade away on their own. A part that decays by itself can stay hidden, because its error dies out anyway. **Stabilizable** is the matching relaxation of controllable: every part that would not fade on its own must be reachable — here, reachable by process noise. The filter theorem needs only these weaker versions, which is why they are the ones in the statement.
:::

::: context schur-solver How a computer solves the Riccati equation in one go
Iterating the recursion works but can take hundreds of steps when the filter settles slowly. Direct solvers instead build a larger matrix, twice the state's size, whose structure encodes the whole Riccati equation. They then split it with a **Schur decomposition** (SciPy uses a generalized version called QZ) — a numerically safe way of rearranging a matrix so its eigenvalues sit in order along the diagonal — and read $\mathbf{P}_{ss}$ off the half that belongs to the stable eigenvalues. The method dates from Alan Laub's work around 1979, and it is what `solve_discrete_are` and MATLAB's `idare` use today.
:::

::: context luenberger Two routes to the same machine
The state-space module built an observer by picking the gain $\mathbf{L}$ so the error matrix $\mathbf{A} - \mathbf{L}\mathbf{C}$ had poles you liked — say, a few times faster than the controller. That choice ignored the noise. The steady-state Kalman filter reaches the same kind of machine from the other side: it starts from the noise levels $\mathbf{Q}$ and $\mathbf{R}$ and asks which gain leaves the smallest error. The answer happens to be a Luenberger gain. So the pole placement you did by hand has an "optimal" setting, and $\mathbf{Q}$ and $\mathbf{R}$ are the knobs that choose it.
:::

::: context eigen-circle Where the booster filter's eigenvalues sit
An error multiplied by a number of size less than $1$ every step shrinks toward zero. For a matrix, the numbers that matter are its eigenvalues, drawn as points in the plane. Inside the unit circle means stable. The booster filter's two eigenvalues sit at $0.925 \pm 0.069i$ (red): inside, but close to the edge, which is why it settles slowly. The small angle off the horizontal axis, about $4.3^\circ$, is what makes the error spiral as it shrinks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="100" x2="290" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="100" r="80" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="254.0" cy="94.5" r="4" fill="#b4232c"/>
  <circle cx="254.0" cy="105.5" r="4" fill="#b4232c"/>
  <text x="264" y="92" font-size="12" fill="#b4232c">0.925 ± 0.069i</text>
  <text x="264" y="118" font-size="11" fill="#1f2a44">size 0.928</text>
  <text x="180" y="12" font-size="11" fill="#1f2a44" text-anchor="middle">imaginary</text>
  <text x="300" y="104" font-size="11" fill="#1f2a44">real</text>
  <text x="112" y="45" font-size="12" fill="#1d6fd1">unit circle</text>
  <text x="176" y="114" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="262" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <line x1="260" y1="100" x2="260" y2="176" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 3"/>
</svg>
```
:::

::: context acquisition The noisy first moments of a filter's life
**Acquisition** is the period right after a filter starts, or restarts after losing its sensor, while its covariance is still far above steady state. It is when the filter learns the most per measurement — and when a fixed steady-state gain would learn the least. Real navigation software often runs in modes: a full time-varying filter during acquisition and after any big disturbance, and a lighter fixed-gain mode during long quiet cruise. The switch-over test compares the live covariance with the stored $\mathbf{P}_{ss}$.
:::
