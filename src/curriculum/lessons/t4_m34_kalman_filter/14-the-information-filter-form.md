---
id: l14-the-information-filter-form
title: The information filter form and its use in sensor fusion
minutes: 21
covers:
  - The information filter form and its use in sensor fusion
---

Picture a class election where every student drops a paper vote into a jar. To find the result, you count. It does not matter who voted first, whether votes came in one at a time or in handfuls, or whether one student was absent. Counting is adding, and adding does not care about order.

Now picture a navigation computer with a dozen sensors: a radar altimeter, a barometer, GPS, star trackers, each reporting whenever it is ready. It would be lovely if fusing their evidence were as easy as counting votes. With the right bookkeeping, it is. The trick is to stop tracking *uncertainty* and start tracking its opposite, **information**: how sharply you know something.

The three-derivations lesson already met this idea. Its Bayesian derivation showed inverse covariances adding: $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$. That was set aside as another way to write one update. This lesson builds it into a complete filter, the **information filter**, with its own predict step and its own reasons to use it. The rewards are specific. Combining any number of sensors, in any order, becomes plain addition. And the filter can write down *total ignorance* exactly, which the ordinary covariance form cannot write down at all.

## Information is the inverse of uncertainty

Start with one number. A radar altimeter reads your altitude with a standard deviation of $2\,\mathrm{m}$, so its variance is $4\,\mathrm{m^2}$. Define its **information** as one over the variance: $1/4 = 0.25\,\mathrm{m^{-2}}$. A barometer with a $1\,\mathrm{m}$ standard deviation has variance $1\,\mathrm{m^2}$ and information $1\,\mathrm{m^{-2}}$. The better sensor carries more information. A sensor that knows nothing has variance "infinity" and information zero.

The scalar rule for combining two independent readings is the one you may have met as a **[[weighted average|fusion-picture]]**: information adds, and each reading is weighted by its information.

$$
\frac{1}{\sigma^2} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}, \qquad
\hat{x} = \sigma^2\left(\frac{z_1}{\sigma_1^2} + \frac{z_2}{\sigma_2^2}\right).
$$

Say the radar reads $1000\,\mathrm{m}$ and the barometer reads $1003\,\mathrm{m}$. The combined information is $0.25 + 1 = 1.25\,\mathrm{m^{-2}}$, so the combined variance is $1/1.25 = 0.8\,\mathrm{m^2}$, a standard deviation of about $0.894\,\mathrm{m}$. The combined estimate is $0.8 \times (1000 \times 0.25 + 1003 \times 1) = 0.8 \times 1253 = 1002.4\,\mathrm{m}$. It sits closer to the barometer, the sharper sensor, and it is sharper than either one alone. Both make sense.

Notice what got added: the informations, and the readings *multiplied by* their informations. Those two running sums are the whole filter. The matrix version keeps the same two sums.

The **information matrix** is $\mathbf{Y} = \mathbf{P}^{-1}$, the inverse of the covariance. The **information vector** is $\mathbf{y} = \mathbf{Y}\hat{\mathbf{x}}$, the estimate weighted by its information. Read them "capital Y" and "little y". The information filter carries $\mathbf{Y}$ and $\mathbf{y}$ from step to step instead of $\hat{\mathbf{x}}$ and $\mathbf{P}$. Whenever you want the estimate itself, solve $\mathbf{Y}\hat{\mathbf{x}} = \mathbf{y}$.

::: key Information filter form
Propagate $\mathbf{Y} = \mathbf{P}^{-1}$ and $\mathbf{y} = \mathbf{Y}\hat{\mathbf{x}}$. Updates become simple additions: $\mathbf{Y}^+ = \mathbf{Y}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$. Ideal for fusing many sensors and for expressing no prior information at all ($\mathbf{Y} = \mathbf{0}$).
:::

## The update: many sensors, one sum

Suppose $m$ independent sensors report. Sensor $i$ has measurement row $\mathbf{H}_i$, noise variance $R_i$ and reading $z_i$. Each one adds its own piece of information, $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ to the matrix and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ to the vector. Matrix addition, like counting votes, does not care about order or grouping. This is the same equivalence the sequential-updates lesson proved for batch and one-at-a-time processing, but here it is not a result you have to prove: it is the operation itself.

::: key The information-form update
$$
\mathbf{Y}^+ = \mathbf{Y}^- + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i, \qquad
\mathbf{y}^+ = \mathbf{y}^- + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i.
$$
No matrix inverse appears anywhere in the update itself — only in recovering $\hat{\mathbf{x}}^+ = (\mathbf{Y}^+)^{-1}\mathbf{y}^+$ when an actual state estimate is needed.
:::

The $\Sigma$ ("sigma", a capital Greek S) means "add up the terms for $i = 1$ to $m$". Each term $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ is a small matrix that says *which direction* of the state the sensor informs, and how strongly. A position sensor, $\mathbf{H} = (1,\ 0)$, only adds to the position-position entry. A velocity sensor only adds to the velocity-velocity entry.

::: note Why it has to be true: the vector update
The matrix line is the Bayesian result from the three-derivations lesson. For the vector line, first check a handy identity: the Kalman gain equals $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$. Start from $\mathbf{P}^+ = (\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ and use $\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{K}\mathbf{S}$ (which is the definition of $\mathbf{K}$, rearranged), with $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$:

$$
\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = (\mathbf{K}\mathbf{S} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}})\mathbf{R}^{-1} = \mathbf{K}(\mathbf{S} - \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}})\mathbf{R}^{-1} = \mathbf{K}\mathbf{R}\mathbf{R}^{-1} = \mathbf{K}.
$$

Now take the ordinary update $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}(\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-)$, put in that $\mathbf{K}$, and multiply both sides by $\mathbf{Y}^+ = (\mathbf{P}^+)^{-1}$:

$$
\mathbf{Y}^+\hat{\mathbf{x}}^+ = \mathbf{Y}^+\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z} - \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\hat{\mathbf{x}}^- = \mathbf{Y}^-\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}.
$$

The last step used $\mathbf{Y}^+ - \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H} = \mathbf{Y}^-$. The left side is $\mathbf{y}^+$ and the first term on the right is $\mathbf{y}^-$. For independent sensors, $\mathbf{R}$ is block-diagonal, so the $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ and $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}$ terms split into one piece per sensor: the sums in the key block.
:::

::: example Three sensors, six orders, one fused estimate
A descending booster has state (altitude, vertical velocity). The prior is $\hat{\mathbf{x}}^- = (2450\,\mathrm{m},\ -70\,\mathrm{m/s})$ with $\mathbf{P}^- = \operatorname{diag}(2.0,\ 0.5)$. So the prior information is

$$
\mathbf{Y}^- = \operatorname{diag}(0.5,\ 2.0), \qquad \mathbf{y}^- = \mathbf{Y}^-\hat{\mathbf{x}}^- = (0.5 \times 2450,\ 2.0 \times (-70)) = (1225,\ -140).
$$

Three independent sensors report:

| Sensor | $\mathbf{H}$ | $R$ | $z$ | adds to $\mathbf{Y}$ | adds to $\mathbf{y}$ |
| --- | --- | --- | --- | --- | --- |
| Coarse altimeter | $(1,\ 0)$ | $4.0$ | $2450.3$ | $0.25$ in the altitude slot | $612.575$ in the altitude slot |
| Fine altimeter | $(1,\ 0)$ | $0.25$ | $2449.8$ | $4.0$ in the altitude slot | $9799.2$ in the altitude slot |
| Velocity sensor | $(0,\ 1)$ | $0.01$ | $-68.2$ | $100$ in the velocity slot | $-6820$ in the velocity slot |

Add everything up:

$$
\mathbf{Y}^+ = \operatorname{diag}(0.5 + 0.25 + 4.0,\ 2.0 + 100) = \operatorname{diag}(4.75,\ 102), \qquad
\mathbf{y}^+ = (1225 + 612.575 + 9799.2,\ -140 - 6820) = (11636.775,\ -6960).
$$

Since $\mathbf{Y}^+$ is diagonal, solving $\mathbf{Y}^+\hat{\mathbf{x}}^+ = \mathbf{y}^+$ is two divisions: $11636.775 / 4.75 = 2449.847\,\mathrm{m}$ and $-6960 / 102 = -68.235\,\mathrm{m/s}$. The fused covariance is $\mathbf{P}^+ = \operatorname{diag}(1/4.75,\ 1/102) = \operatorname{diag}(0.211,\ 0.0098)$.

Sanity check: the altitude landed between the two altimeter readings and close to the fine one, $2449.8$, as the weights $0.25$ versus $4.0$ say it should. The velocity landed very near the sharp velocity sensor's $-68.2$. The ordinary covariance-form filter, run one sensor at a time, gives the same $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$ to every digit printed.
:::

The code below adds the three sensors in all six possible orders:

```python
import numpy as np
from itertools import permutations

Y = np.diag([0.5, 2.0])                  # prior information matrix
y = Y @ np.array([2450.0, -70.0])        # prior information vector
sensors = [(np.array([1.0, 0.0]), 4.0, 2450.3),    # (H row, R, z)
           (np.array([1.0, 0.0]), 0.25, 2449.8),
           (np.array([0.0, 1.0]), 0.01, -68.2)]

for order in permutations(range(3)):
    Yp, yp = Y.copy(), y.copy()
    for i in order:
        H, R, z = sensors[i]
        Yp += np.outer(H, H) / R          # add information
        yp += H * z / R
    print(order, np.round(np.linalg.solve(Yp, yp), 3))
# every one of the six orders prints [2449.847  -68.235]
```

This is why the information form suits **distributed sensor fusion**. Several sensors, maybe on different parts of a vehicle, maybe unaware of each other, each compute their own two contributions. They ship them to a **[[fusion node|fusion-node]]** that only ever adds. Nothing in that design needs to know in advance how many sensors will report, in what order, or how often. A late sensor adds its term late. A missing sensor adds nothing.

::: warning Only independent evidence may be added
Adding assumes each contribution is *new*, independent evidence. If the same measurement reaches the fusion node twice — say, by two different network paths — its information is counted twice, and the filter becomes twice as sure as it has any right to be. The same happens if two sensors share an error source that you have treated as independent. The sum has no way to spot it. Guarding against **[[double counting|double-counting]]** is part of designing any fusion network.
:::

## The predict step: possible, but not cheap

The update got easier. The predict step gets harder. The ordinary predict step is $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. In information form that reads

$$
\mathbf{Y}^- = \big(\mathbf{F}(\mathbf{Y}^+)^{-1}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}\big)^{-1}.
$$

At first glance this needs $\mathbf{Y}^+$ turned back into $\mathbf{P}^+$, which defeats the point. The **[[matrix inversion lemma|inversion-lemma]]**, proved in the three-derivations lesson, rearranges it so that $\mathbf{Y}^+$ is never inverted on its own, as long as $\mathbf{Q}$ can be inverted:

::: key The information-form predict step
$$
\mathbf{Y}^- = \mathbf{Q}^{-1} - \mathbf{Q}^{-1}\mathbf{F}\big(\mathbf{Y}^+ + \mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}\mathbf{F}\big)^{-1}\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}.
$$
Recovering $\hat{\mathbf{x}}^-$ needs $\mathbf{y}^- = \mathbf{Y}^-\mathbf{F}\hat{\mathbf{x}}^+$, with $\hat{\mathbf{x}}^+$ obtained by solving $\mathbf{Y}^+\hat{\mathbf{x}}^+ = \mathbf{y}^+$ (a linear solve, not an explicit inverse) rather than tracked separately.
:::

::: note Why it has to be true: the predict formula
The matrix inversion lemma says that for matrices of matching sizes,

$$
(\mathbf{A} + \mathbf{U}\mathbf{C}\mathbf{V})^{-1} = \mathbf{A}^{-1} - \mathbf{A}^{-1}\mathbf{U}\big(\mathbf{C}^{-1} + \mathbf{V}\mathbf{A}^{-1}\mathbf{U}\big)^{-1}\mathbf{V}\mathbf{A}^{-1}.
$$

Match it to $\big(\mathbf{Q} + \mathbf{F}(\mathbf{Y}^+)^{-1}\mathbf{F}^{\mathsf{T}}\big)^{-1}$ with $\mathbf{A} = \mathbf{Q}$, $\mathbf{U} = \mathbf{F}$, $\mathbf{C} = (\mathbf{Y}^+)^{-1}$ and $\mathbf{V} = \mathbf{F}^{\mathsf{T}}$. Then $\mathbf{C}^{-1} = \mathbf{Y}^+$, and the lemma gives the key formula line for line. The information vector follows from its definition: $\mathbf{y}^- = \mathbf{Y}^-\hat{\mathbf{x}}^-$, and the predicted estimate is $\hat{\mathbf{x}}^- = \mathbf{F}\hat{\mathbf{x}}^+$.
:::

::: example Checked against the ordinary filter, fifty steps running
Use the constant-velocity model of this module: $\Delta t = 0.1\,\mathrm{s}$, $q = 0.5\,\mathrm{m^2/s^3}$, a position sensor with $R = 4\,\mathrm{m^2}$, and a start of $\hat{\mathbf{x}}_0 = (1000\,\mathrm{m},\ -50\,\mathrm{m/s})$ with $\mathbf{P}_0 = \operatorname{diag}(100,\ 25)$. The exact $\mathbf{Q}$ is invertible here:

$$
\mathbf{Q} = \begin{pmatrix}0.000167 & 0.0025\\ 0.0025 & 0.05\end{pmatrix}, \qquad
\mathbf{Q}^{-1} = \begin{pmatrix}24000 & -1200\\ -1200 & 80\end{pmatrix}.
$$

Run two filters on the same simulated readings for $50$ steps: the ordinary covariance form, and the information form (predict with the formula above, update by addition). After every step, convert the information filter's $\mathbf{Y}$ and $\mathbf{y}$ back to an estimate and a covariance and compare. The largest difference in any estimate entry is about $8\times10^{-11}$, and in any covariance entry about $1\times10^{-10}$.

Those differences are round-off, the last few digits a computer cannot hold. The two filters compute the same thing. Only the bookkeeping in between differs.

Look at the size of $\mathbf{Q}^{-1}$, though: $24000$ in one corner. A small $\mathbf{Q}$ has a huge inverse. That hints at the cost and fragility this form carries.
:::

So be honest about the predict step: it is **not** cheaper than the ordinary one. The ordinary predict step inverts nothing. The information-form predict step needs $\mathbf{Q}^{-1}$ and the inverse of the bracketed matrix, two $n \times n$ inverses, where $n$ is the number of states. And it fails outright if $\mathbf{Q}$ is **singular** (has no inverse). That happens, for instance, with the crude short-step process-noise approximation the stochastic-model and numerically-stable-forms lessons both warned against. Everything this lesson recommends the information form *for* lives in the update and in starting up. The predict step is the price of keeping the whole recursion in information form.

::: warning A barely-invertible Y gives crisp-looking nonsense
A $\mathbf{Y}$ that is technically invertible but barely — close to the zero-information case of the next section — is dangerous to turn back into an estimate. Try it. Start with almost no information, $\mathbf{Y}_0 = 10^{-15}\,\mathbf{I}$ and $\mathbf{y}_0 = \mathbf{0}$ (a prior with a mean of zero and a standard deviation of about 30 million). Add one position reading of $3000\,\mathrm{m}$, then predict one step. The exact answer for the predicted velocity is the prior's $0\,\mathrm{m/s}$, because no measurement has said anything about velocity. The computed answer, from solving $\mathbf{Y}^-\hat{\mathbf{x}}^- = \mathbf{y}^-$, is $-0.94\,\mathrm{m/s}$, and the altitude is off by about $9\,\mathrm{cm}$. With $10^{-12}$ instead of $10^{-15}$, the velocity comes out as $+0.013\,\mathrm{m/s}$.

Each answer looks like a real number. Each is round-off noise. The **[[condition number|condition-number]]** of $\mathbf{Y}^-$ here is about $2.5\times10^{13}$, so about thirteen of the sixteen digits a computer carries are lost in the solve. The remedy is the numerically-stable-forms lesson's rule: never trust an inverse or a solve without checking the conditioning of what you are inverting.
:::

## Representing total ignorance: Y = 0

Here is the information form's second superpower. The covariance form has no way to write "I know nothing at all". That would need $\mathbf{P} = \infty$, and infinity is not a matrix entry. The information form writes it exactly: $\mathbf{Y} = \mathbf{0}$ and $\mathbf{y} = \mathbf{0}$. That is a perfectly finite starting point that says every direction of the state is completely unknown. Statisticians call it a **[[diffuse prior|diffuse-prior]]**.

::: example From zero information to a fully known state
A state has two parts, $a$ and $b$. One sensor measures $a$ ($\mathbf{H} = (1,\ 0)$, $R = 4$). Another measures $b$ ($\mathbf{H} = (0,\ 1)$, $R = 0.25$). Start from $\mathbf{Y} = \mathbf{0}$.

**After the $a$-sensor.** Add its information: $\mathbf{Y} = \operatorname{diag}(0.25,\ 0)$ and $\mathbf{y} = (z_a/4,\ 0)$. This matrix has **rank** $1$ — only one direction carries any information. That is exactly right: $a$ is now known, $b$ is still completely unknown. The covariance form could only express this state of partial knowledge with an infinite entry. Here it is an honest zero. The matrix cannot be inverted yet, and it should not be: there is no estimate of $b$ to report.

**After the $b$-sensor.** Add its information: $\mathbf{Y} = \operatorname{diag}(0.25,\ 4.0)$, now full rank. Solving gives $\hat{\mathbf{x}} = (z_a/4 \div 0.25,\ 4z_b \div 4) = (z_a,\ z_b)$, and $\mathbf{P} = \operatorname{diag}(4,\ 0.25)$.

Sanity check: with no prior at all, each estimate should be exactly its sensor's reading, with exactly its sensor's variance, $R_a = 4$ and $R_b = 0.25$. It is.
:::

This is also the least-squares module's way of saying "no prior", and it is why the link to recursive least squares from the three-derivations lesson runs both ways. Set $\mathbf{Y}_0 = \mathbf{0}$ and run the information update with no predict steps: that *is* ordinary batch least squares, one measurement's information added at a time. The moment you need dynamics and process noise, the predict step is there. When you do not, nothing in the least-squares answer is disturbed.

## When to reach for which form

The **covariance form** is the right default. Its predict step is cheap and needs no invertible $\mathbf{Q}$. It reports $\mathbf{P}$ directly, which is what every consistency test in this module reads.

Reach for the **information form** when the update side dominates:

- fusing many independent, possibly out-of-step sensors into one estimate;
- starting with no prior knowledge at all;
- building a batch or recursive least-squares solution where the dynamics step is rare or missing.

A filter with a fast predict step and one or two sensors gains nothing from the information form and pays its extra predict cost for no reason. A fusion center adding up reports from a dozen independent instruments gains everything. Large mapping problems, where thousands of landmarks are each seen by only a few measurements, also favor it: most entries of $\mathbf{Y}$ stay exactly zero, and a computer can skip them.

## Check yourself

::: check
Explain why the information-form update needs no matrix inverse at all, while the ordinary covariance-form update needs one (to form $\mathbf{K}$).
:::

::: answer
The ordinary gain, $\mathbf{K}=\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}+R)^{-1}$, inverts the innovation covariance $\mathbf{S}$, an $m\times m$ matrix, at every update.

The information-form update never builds $\mathbf{S}$ or anything like it. It adds $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ straight onto $\mathbf{Y}$. Since $R$ is usually diagonal or block-diagonal across independent sensors, $R^{-1}$ is cheap, and it can be computed once per sensor ahead of time. The only inverse (really, a linear solve) in the whole update is recovering $\hat{\mathbf{x}}$ from $\mathbf{Y}$ and $\mathbf{y}$, and that is needed only when an estimate must be reported, not at every fusion step.
:::

::: check
A distributed fusion architecture has four sensors reporting at slightly different times within the same nominal cycle, and a fifth sensor that occasionally drops out entirely. Explain why the information form tolerates this more gracefully than accumulating a batch $\mathbf{H}$ matrix and running one covariance-form update.
:::

::: answer
The information-form update is a running sum, $\mathbf{Y}^+ = \mathbf{Y}^- + \sum_i \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$. Each term can be added the moment its sensor reports, in any order. A sensor that does not report contributes no term, and nothing else in the formula changes.

A batch update must first stack every expected sensor's row into one $\mathbf{H}$. That means either waiting for every sensor (losing the benefit of processing reports as they arrive) or rebuilding the stacked matrix with new dimensions each time a sensor is late or missing.
:::

::: check
Why does the information-form predict step require $\mathbf{Q}$ to be invertible, while the ordinary covariance-form predict step, $\mathbf{P}^-=\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}}+\mathbf{Q}$, does not?
:::

::: answer
The ordinary predict step only *adds* $\mathbf{Q}$ to something already computed. Adding a singular matrix is no problem.

The information-form predict step comes from the matrix inversion lemma with $\mathbf{A} = \mathbf{Q}$, and it uses $\mathbf{Q}^{-1}$ explicitly, twice. A singular $\mathbf{Q}$ (such as the crude short-step approximation from the stochastic-model lesson) makes that formula undefined. That is why using the exact, non-singular discrete $\mathbf{Q}$ matters even more in information form than in covariance form.
:::

::: check
After the $a$-sensor alone in the zero-information example, $\mathbf{Y}=\operatorname{diag}(0.25,0)$. What would `np.linalg.inv(Y)` do if called at that point, and why is checking rank first the right practice rather than calling it and handling the resulting error?
:::

::: answer
For this exactly singular matrix, `np.linalg.inv` raises a `LinAlgError` on a laptop; the browser's NumPy, on WebAssembly, returns a matrix of `nan` instead. But if round-off had left a tiny nonzero number where the $0$ is, it would *not* raise anything. It would silently return a matrix with enormous entries, and a solve would return crisp-looking nonsense, like the $-0.94\,\mathrm{m/s}$ velocity in the warning above.

Checking the rank of $\mathbf{Y}$ first (or, more robustly, its smallest eigenvalue or its condition number) separates two different situations: "there is genuinely no information about some direction yet, so handle that case on purpose" and "the matrix is technically invertible but so badly conditioned that its inverse is noise". An error handler cannot tell them apart, because the second case usually raises no error at all.
:::

::: check
Restate, in the information filter's own language, what the observability lesson's unobservable direction looks like.
:::

::: answer
An unobservable direction is a direction along which $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ contributes nothing, for every measurement the sensors can ever produce (after the dynamics have carried that direction into what the sensors see, too). The update sums in this lesson never add anything to $\mathbf{Y}$ along it. $\mathbf{Y}$ there stays exactly as informative, or uninformative, as the prior and the predict step leave it, forever.

That is the observability lesson's fact — the update is blind along that direction — restated as: the information collected there is exactly zero, term after term, no matter how many measurements arrive.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Information matrix | How sharply the state is known | $\mathbf{Y}=\mathbf{P}^{-1}$ |
| Information vector | The estimate weighted by its information | $\mathbf{y}=\mathbf{Y}\hat{\mathbf{x}}$; recover $\hat{\mathbf{x}}$ by solving $\mathbf{Y}\hat{\mathbf{x}}=\mathbf{y}$ |
| Update | Pure addition, any order, any grouping | $\mathbf{Y}^+=\mathbf{Y}^-+\sum_i\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$, $\mathbf{y}^+=\mathbf{y}^-+\sum_i\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ |
| Predict | Needs invertible $\mathbf{Q}$; costs more than the ordinary one | $\mathbf{Y}^-=\mathbf{Q}^{-1}-\mathbf{Q}^{-1}\mathbf{F}(\mathbf{Y}^++\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}\mathbf{F})^{-1}\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}$ |
| Total ignorance | A diffuse prior, exact and finite | $\mathbf{Y}=\mathbf{0}$, $\mathbf{y}=\mathbf{0}$; $\mathbf{P}=\infty$ cannot be written |
| Best use | Where the update side dominates | Many independent sensors; no-prior start; least squares |
| Cautions | What can go wrong | Double-counted evidence; a barely invertible $\mathbf{Y}$ gives confident nonsense |

Every form this module has built — covariance, Joseph, square-root, UD, information — assumes the noises feeding the filter are exactly as independent and as white as the stochastic model first said. The final lesson drops those assumptions, and meets a filter built for the one kind of state you should neither ignore nor try to estimate.

::: context fusion-picture Two blurry guesses make one sharp one
Each sensor's belief is a bell curve. The radar's (wide, centered at $1000\,\mathrm{m}$) and the barometer's (narrow, at $1003\,\mathrm{m}$) combine into a curve that is narrower than both and sits nearer the barometer, at $1002.4\,\mathrm{m}$. Adding informations is what makes the new curve narrower.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="20.0,139.4 31.4,138.8 42.9,137.7 54.3,135.9 65.7,133.0 77.1,128.8 88.6,123.2 100.0,116.3 111.4,108.5 122.9,100.9 134.3,94.2 145.7,89.7 157.1,88.1 168.6,89.7 180.0,94.2 191.4,100.9 202.9,108.5 214.3,116.3 225.7,123.2 237.1,128.8 248.6,133.0 260.0,135.9 271.4,137.7 282.9,138.8 294.3,139.4 311.4,139.8 340.0,140.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="140.0,139.9 151.4,139.5 162.9,137.6 174.3,131.7 180.0,126.0 185.7,117.6 191.4,106.3 197.1,92.5 202.9,77.1 208.6,61.7 214.3,48.5 220.0,39.5 225.7,36.3 231.4,39.5 237.1,48.5 242.9,61.7 248.6,77.1 254.3,92.5 260.0,106.3 265.7,117.6 271.4,126.0 282.9,135.4 300.0,139.5 311.4,139.9"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="134.3,139.9 145.7,139.4 157.1,136.8 162.9,133.5 168.6,127.9 174.3,118.8 180.0,105.9 185.7,89.3 191.4,70.1 197.1,50.9 202.9,35.1 208.6,25.7 214.3,24.8 220.0,32.6 225.7,47.4 231.4,66.2 237.1,85.6 242.9,102.9 248.6,116.6 254.3,126.3 260.0,132.6 271.4,138.3 288.6,139.9"/>
  <line x1="157.1" y1="140" x2="157.1" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="212" y1="140" x2="212" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="225.7" y1="140" x2="225.7" y2="145" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="240" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">1003</text>
  <text x="70" y="115" font-size="11" text-anchor="middle" fill="#6c7a93">radar</text>
  <text x="290" y="60" font-size="11" text-anchor="middle" fill="#f2b880">barometer</text>
  <text x="140" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">fused</text>
  <text x="180" y="172" font-size="11" text-anchor="middle" fill="#6c7a93">altitude (m)</text>
</svg>
```
:::

::: context fusion-node A computer that only adds
In a fusion network, each sensor does its own small bit of math — turning its reading into an information contribution — and sends the result to one central computer. That computer never has to know how many sensors exist. It adds whatever arrives.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="62" width="90" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="112" width="90" height="26" rx="4" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="55" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">altimeter</text>
  <text x="55" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">GPS</text>
  <text x="55" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">late sensor</text>
  <line x1="100" y1="25" x2="200" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="75" x2="200" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="125" x2="200" y2="80" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="225" cy="75" r="25" fill="#1d6fd1" stroke="#1f2a44" stroke-width="2"/>
  <text x="225" y="81" font-size="18" text-anchor="middle" fill="#fff">+</text>
  <line x1="250" y1="75" x2="300" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="310,75 298,69 298,81" fill="#1f2a44"/>
  <text x="330" y="70" font-size="11" text-anchor="middle" fill="#1f2a44">Y, y</text>
  <text x="140" y="146" font-size="11" fill="#6c7a93">each arrow carries H'R⁻¹H and H'R⁻¹z</text>
</svg>
```
:::

::: context double-counting The rumor that sounds like two witnesses
If one friend tells you a rumor, and then a second friend repeats what the *first* friend said, you have not heard it twice. You have heard it once, from one source. Fusion networks have the same trap. Two filters that share a measurement and then share their estimates with each other can end up counting that measurement over and over, growing more confident each time. Engineers use methods such as **covariance intersection** when they cannot be sure which evidence two estimates have in common: it combines them safely without assuming they are independent.
:::

::: context inversion-lemma A shortcut you have already proved
The matrix inversion lemma, also called the Woodbury identity, turns the inverse of "a big matrix plus a correction" into the inverse of the big matrix plus a correction to *that*. The three-derivations lesson used it to show the covariance and information updates are the same thing. Here it is used once more, on the predict step. You can always check it the way that lesson did: multiply the claimed inverse by the original matrix and watch everything collapse to the identity.
:::

::: context condition-number How many digits a solve can lose
The condition number of a matrix is roughly its biggest "stretch" divided by its smallest. It tells you how much small errors can grow when you solve with that matrix. A computer carries about $16$ significant digits. A condition number of $10^{k}$ can wipe out about $k$ of them. With a condition number near $2.5\times10^{13}$, only about three trustworthy digits remain, which is why the example's answers changed from run to run while looking perfectly precise.
:::

::: context diffuse-prior Starting with an open mind
A prior is what you believe before any measurement. A *diffuse* prior spreads its belief so thin that it has no preference at all — like a detective who has not yet heard a single clue. In covariance form you can only imitate it with a huge $\mathbf{P}_0$, say $10^{6}$, and hope the number is big enough but not so big it causes round-off trouble. In information form it is exact: $\mathbf{Y}_0 = \mathbf{0}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="150" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="20" width="30" height="100" fill="#8fb8f0"/>
  <text x="95" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">after a-sensor</text>
  <text x="10" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="95" y="14" font-size="11" text-anchor="middle" fill="#1f2a44">a known, b anything</text>
  <rect x="190" y="20" width="150" height="100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="265" cy="70" rx="15" ry="4" fill="#1d6fd1"/>
  <text x="265" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">after b-sensor</text>
  <text x="265" y="14" font-size="11" text-anchor="middle" fill="#1f2a44">both known</text>
</svg>
```

The shaded regions show where the state could be: a band while $\mathbf{Y}$ has rank 1, a small ellipse once it has full rank.
:::
