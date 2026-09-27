---
id: l13-the-rauch-tung-striebel-smoother
title: The Rauch-Tung-Striebel smoother
minutes: 19
covers:
  - The Rauch-Tung-Striebel smoother
---

Think about watching a soccer match live. In the tenth minute a player goes down near the goal, and from the stands you cannot tell whether it was a foul. You make your best guess and keep watching. After the match you watch the replay. Now you know how the play developed, where the ball went next, and how the players reacted. Your judgment about the tenth minute is much better, because you are using what happened *after* it.

A Kalman filter is the fan in the stands. Every estimate this module has built so far, $\hat{\mathbf{x}}_k^+$, uses only the measurements $\mathbf{z}_1, \ldots, \mathbf{z}_k$ that had arrived by step $k$. On board a vehicle that is the only choice: the future has not happened yet. But a lot of estimation happens after the fact. Engineers rebuild a test flight's trajectory from its recorded data. They run **[[orbit determination|orbit-determination]]** from a tracking pass that has already ended. They calibrate sensors from a finished test. In every one of those jobs, all the measurements are sitting in a file. Refusing to use $\mathbf{z}_{k+1}, \ldots, \mathbf{z}_N$ to improve the estimate at step $k$ would be throwing information away.

**Smoothing** means estimating the state at each moment using the data from both before *and* after it. The **[[Rauch-Tung-Striebel|rts-names]] (RTS) smoother** is the standard way to do it for a linear Kalman filter: one extra pass that runs *backward* over the stored output of the ordinary forward filter. It costs little, it never makes an estimate worse, and it is the replay analyst to the filter's live commentator.

## Filtering versus smoothing

Let the whole recorded run have $N$ steps. Write $\mathbf{z}_{1:N}$ for "all the measurements, from $\mathbf{z}_1$ through $\mathbf{z}_N$". Read it "z one through N".

The **smoothed estimate** at step $k$ is the average value of the state, given *every* measurement in the run:

$$
\hat{\mathbf{x}}_k^s = \mathbb{E}[\mathbf{x}_k \mid \mathbf{z}_{1:N}].
$$

Read $\hat{\mathbf{x}}_k^s$ as "x hat k, s" — the little $s$ stands for smoothed. Its covariance, $\mathbf{P}_k^s$, says how uncertain that estimate still is. Compare it with the filtered estimate $\hat{\mathbf{x}}_k^+ = \mathbb{E}[\mathbf{x}_k \mid \mathbf{z}_{1:k}]$, which conditions on the data only up to step $k$.

Two facts fall straight out of the definitions.

- **At the last step they are the same.** At $k = N$ there is no future left. Both estimates condition on exactly $\mathbf{z}_1$ through $\mathbf{z}_N$, so $\hat{\mathbf{x}}_N^s = \hat{\mathbf{x}}_N^+$ and $\mathbf{P}_N^s = \mathbf{P}_N^+$. This is the starting point of the backward pass.
- **The smoother is offline only.** It needs data from after the moment it is correcting. It cannot run in real time on a vehicle making decisions now.

## The future reaches the past only through the present

Here is the one structural fact that makes a quick backward pass possible.

Picture a line of people passing buckets of water from a well to a fire. The person at position $k$ hands a bucket to the person at $k+1$, who hands it on. If you want to know what happened at position $k$, and you already know exactly what the person at $k+1$ received, then watching the people further down the line tells you nothing new. Everything that flowed from $k$ to the end had to pass through $k+1$.

The state of a Kalman model behaves the same way. The model is $\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{w}_k$ with white process noise $\mathbf{w}_k$. Each new state depends only on the one before it plus fresh, independent noise. A process like this is called **[[Markov|markov-chain]]**: the present holds everything the past can pass on to the future. So the state $\mathbf{x}_k$ and the later measurements $\mathbf{z}_{k+1}, \ldots, \mathbf{z}_N$ are **conditionally independent given $\mathbf{x}_{k+1}$**. Once you know $\mathbf{x}_{k+1}$ exactly, the later data cannot teach you anything more about $\mathbf{x}_k$. In symbols:

$$
p(\mathbf{x}_k \mid \mathbf{x}_{k+1}, \mathbf{z}_{1:N}) = p(\mathbf{x}_k \mid \mathbf{x}_{k+1}, \mathbf{z}_{1:k}).
$$

Here $p(\cdot \mid \cdot)$ is a probability density: "the chance of the thing on the left, given the things on the right". The future measurements drop out of the right-hand side. That is the entire reason one backward sweep works. Without it, you would need a separate batch solve for every single $k$.

::: warning The shortcut needs white process noise
The screening-off step only holds when the process is Markov, which needs white $\mathbf{w}_k$. If the disturbances have memory (a slowly wandering wind, a drifting bias), some of that memory skips past $\mathbf{x}_{k+1}$, and the later data *can* tell you more about $\mathbf{x}_k$. The fix is the stochastic-model lesson's rule: give the wandering quantity its own state, so the enlarged state is Markov again.
:::

## Deriving the backward recursion

The right-hand side, $p(\mathbf{x}_k \mid \mathbf{x}_{k+1}, \mathbf{z}_{1:k})$, only involves data through step $k$. The forward filter has already computed everything we need for it.

**Step 1: the joint picture.** Given $\mathbf{z}_{1:k}$, the state $\mathbf{x}_k$ is Gaussian with mean $\hat{\mathbf{x}}_k^+$ and covariance $\mathbf{P}_k^+$. The next state is $\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{w}_k$, a linear function of $\mathbf{x}_k$ plus independent Gaussian noise. So the pair $(\mathbf{x}_k, \mathbf{x}_{k+1})$ is jointly Gaussian. Its mean is $(\hat{\mathbf{x}}_k^+, \hat{\mathbf{x}}_{k+1}^-)$, and its covariance comes in four blocks:

$$
\begin{pmatrix}\mathbf{P}_k^+ & \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}\\ \mathbf{F}\mathbf{P}_k^+ & \mathbf{P}_{k+1}^-\end{pmatrix}.
$$

The top-left and bottom-right blocks are the filter's own covariances. The off-diagonal block is the **cross-covariance**, how much errors in $\mathbf{x}_k$ and $\mathbf{x}_{k+1}$ move together. Expand it: $\operatorname{Cov}(\mathbf{x}_k, \mathbf{F}\mathbf{x}_k + \mathbf{w}_k) = \operatorname{Cov}(\mathbf{x}_k, \mathbf{x}_k)\mathbf{F}^{\mathsf{T}} + \operatorname{Cov}(\mathbf{x}_k, \mathbf{w}_k) = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}} + \mathbf{0}$. The noise term vanishes because $\mathbf{w}_k$ is independent of everything up to step $k$.

**Step 2: condition on the next state.** The probability module's **[[Gaussian conditioning|gaussian-conditioning]]** rule tells you what happens to one part of a jointly Gaussian pair when you learn the other part exactly. The mean shifts by (cross-covariance) × (inverse variance of what you learned) × (surprise). Here that gives

$$
\mathbb{E}[\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:k}] = \hat{\mathbf{x}}_k^+ + \mathbf{C}_k(\mathbf{x}_{k+1}-\hat{\mathbf{x}}_{k+1}^-), \qquad \mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}.
$$

Read $\mathbf{C}_k$ as "C sub k", the **smoother gain**. It plays the same part as the Kalman gain: it says how much a surprise at step $k+1$ should move the estimate at step $k$.

**Step 3: add the future back.** By the screening-off fact, this is *also* the mean given all the data, $\mathbf{z}_{1:N}$, as long as $\mathbf{x}_{k+1}$ is in the conditioning. But we do not know $\mathbf{x}_{k+1}$ exactly. What we do know, if we work backward, is its smoothed estimate $\hat{\mathbf{x}}_{k+1}^s$, computed one step earlier in the backward pass. The formula is a straight line in $\mathbf{x}_{k+1}$, and the average of a straight line is the straight line of the average. So replace $\mathbf{x}_{k+1}$ by $\hat{\mathbf{x}}_{k+1}^s$. That gives the whole smoother:

::: key The RTS smoother
Running backward from $k=N-1$ down to $k=1$, with $\hat{\mathbf{x}}_N^s = \hat{\mathbf{x}}_N^+$, $\mathbf{P}_N^s = \mathbf{P}_N^+$:
$$
\mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}, \qquad
\hat{\mathbf{x}}_k^s = \hat{\mathbf{x}}_k^+ + \mathbf{C}_k\big(\hat{\mathbf{x}}_{k+1}^s - \hat{\mathbf{x}}_{k+1}^-\big), \qquad
\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k\big(\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-\big)\mathbf{C}_k^{\mathsf{T}}.
$$
Every quantity on the right except $\hat{\mathbf{x}}_{k+1}^s$ and $\mathbf{P}_{k+1}^s$ comes straight from the stored forward pass — no re-filtering, one backward sweep. It is offline only, but strictly better than the filter estimate everywhere except the last sample.
:::

Read the mean update in words. The term $\hat{\mathbf{x}}_{k+1}^s - \hat{\mathbf{x}}_{k+1}^-$ is how much the whole run changed our mind about step $k+1$, compared with what the filter predicted for it from data through step $k$. The smoother gain carries that change back one step. If the future agreed with the prediction, the difference is zero and the filtered estimate stands.

In practice the forward filter must save four things at every step: $\hat{\mathbf{x}}_k^-$, $\mathbf{P}_k^-$, $\hat{\mathbf{x}}_k^+$ and $\mathbf{P}_k^+$. The backward pass reads them in reverse order.

::: note Why it has to be true: the covariance recursion
Start from the conditional distribution in step 2. Its covariance is the ordinary Gaussian-conditioning leftover, $\mathbf{P}_k^+ - \mathbf{C}_k\mathbf{P}_{k+1}^-\mathbf{C}_k^{\mathsf{T}}$. That is how uncertain $\mathbf{x}_k$ would be if $\mathbf{x}_{k+1}$ were known exactly.

But $\mathbf{x}_{k+1}$ is not known exactly. Given all the data it still has covariance $\mathbf{P}_{k+1}^s$. The **[[law of total variance|total-variance]]** says the total uncertainty is the leftover uncertainty plus the spread of the conditional mean. The conditional mean is $\hat{\mathbf{x}}_k^+ + \mathbf{C}_k(\mathbf{x}_{k+1}-\hat{\mathbf{x}}_{k+1}^-)$, and its spread, as $\mathbf{x}_{k+1}$ varies with covariance $\mathbf{P}_{k+1}^s$, is $\mathbf{C}_k\mathbf{P}_{k+1}^s\mathbf{C}_k^{\mathsf{T}}$. Add the two pieces:

$$
\mathbf{P}_k^s = \mathbf{P}_k^+ - \mathbf{C}_k\mathbf{P}_{k+1}^-\mathbf{C}_k^{\mathsf{T}} + \mathbf{C}_k\mathbf{P}_{k+1}^s\mathbf{C}_k^{\mathsf{T}} = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}}.
$$

That is the covariance line of the key block.
:::

::: example A three-step run, traced by hand
Use the constant-velocity model of this module: position and velocity, a step of $\Delta t = 0.1\,\mathrm{s}$, process noise $q = 0.5\,\mathrm{m^2/s^3}$, and a position sensor with $R = 4\,\mathrm{m^2}$ (a $2\,\mathrm{m}$ standard deviation). Picture a small test hopper rising off its pad. Start from $\hat{\mathbf{x}}_0^+ = (100\,\mathrm{m},\ 0\,\mathrm{m/s})$ and $\mathbf{P}_0^+ = \operatorname{diag}(4, 1)$. Three measurements arrive, one per step: $z = 101,\ 103,\ 108\,\mathrm{m}$.

**Forward pass.** Each step predicts, then updates with the new reading.

| $k$ | $\hat{\mathbf{x}}_k^-$ | $\mathbf{P}_k^-$ (entries 11, 12, 22) | $z_k$ | $\hat{\mathbf{x}}_k^+$ | $\mathbf{P}_k^+$ (entries 11, 12, 22) |
| --- | --- | --- | --- | --- | --- |
| $1$ | $(100.00,\ 0)$ | $4.010,\ 0.103,\ 1.050$ | $101$ | $(100.50,\ 0.0128)$ | $2.003,\ 0.051,\ 1.049$ |
| $2$ | $(100.50,\ 0.0128)$ | $2.023,\ 0.159,\ 1.099$ | $103$ | $(101.34,\ 0.0786)$ | $1.344,\ 0.105,\ 1.095$ |
| $3$ | $(101.35,\ 0.0786)$ | $1.376,\ 0.217,\ 1.145$ | $108$ | $(103.05,\ 0.347)$ | $1.024,\ 0.162,\ 1.136$ |

Since $N = 3$, the last row is also the smoothed answer at step $3$: $\hat{\mathbf{x}}_3^s = (103.05,\ 0.347)$.

**Backward pass, step 2.** The smoother gain is

$$
\mathbf{C}_2 = \mathbf{P}_2^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_3^-)^{-1} \approx \begin{pmatrix}0.9997 & -0.0978\\ 0.0052 & 0.9553\end{pmatrix}.
$$

The surprise at step 3 is $\hat{\mathbf{x}}_3^s - \hat{\mathbf{x}}_3^- = (103.05 - 101.35,\ 0.347 - 0.0786) = (1.70,\ 0.269)$. Multiply by $\mathbf{C}_2$ and add to $\hat{\mathbf{x}}_2^+$: $\hat{\mathbf{x}}_2^s \approx (103.02,\ 0.344)$.

**Backward pass, step 1.** In the same way, $\mathbf{C}_1 \approx \begin{pmatrix}0.9999 & -0.0977\\ 0.0024 & 0.9542\end{pmatrix}$ and $\hat{\mathbf{x}}_1^s \approx (102.98,\ 0.335)$, with $\mathbf{P}_1^s$ having diagonal entries $1.003$ and $1.037$.

**What happened.** The step-1 position moved from $100.50\,\mathrm{m}$ to $102.98\,\mathrm{m}$. At the time, only the first, modest reading of $101\,\mathrm{m}$ was known. Once the later readings, climbing toward $108\,\mathrm{m}$, are allowed in, the smoother decides the hopper was higher than the filter thought. The position variance also fell, from $2.003$ to $1.003\,\mathrm{m^2}$, and the velocity variance from $1.049$ to $1.037\,\mathrm{m^2/s^2}$.

Sanity check: the smoothed variances are smaller than the filtered ones in both entries, as the next section proves they must be.
:::

The whole backward pass is a few lines of code. This reproduces the example:

```python
import numpy as np

dt, q, R = 0.1, 0.5, 4.0
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])

def rts(xp, Pp, xm, Pm):
    """Backward pass over stored filter output (lists indexed 0..N-1)."""
    xs, Ps = list(xp), list(Pp)          # the last sample is already done
    for k in range(len(xp) - 2, -1, -1):
        C = Pp[k] @ F.T @ np.linalg.inv(Pm[k + 1])
        xs[k] = xp[k] + C @ (xs[k + 1] - xm[k + 1])
        Ps[k] = Pp[k] + C @ (Ps[k + 1] - Pm[k + 1]) @ C.T
    return xs, Ps

# forward filter on the three-step run from the example
x, P = np.array([100.0, 0.0]), np.diag([4.0, 1.0])
xm, Pm, xp, Pp = [], [], [], []
for z in [101.0, 103.0, 108.0]:
    x, P = F @ x, F @ P @ F.T + Q                 # predict
    xm.append(x); Pm.append(P)
    K = P[:, 0] / (P[0, 0] + R)                   # update (H = [1, 0])
    x, P = x + K * (z - x[0]), P - np.outer(K, P[0, :])
    xp.append(x); Pp.append(P)

xs, Ps = rts(xp, Pp, xm, Pm)
print(np.round(xs[0], 2), np.round(np.diag(Ps[0]), 3))
# [102.98   0.33] [1.003 1.037]
```

## Why smoothing can only help

Intuition first. The smoother uses every measurement the filter used, plus more. Extra honest information can never leave you more confused on average. At worst it tells you nothing new, and then the smoothed and filtered answers agree.

The formula shows this directly. Look at the covariance line: $\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}}$. The bracket compares the smoothed uncertainty at step $k+1$ with the *predicted* uncertainty there. If the bracket is "negative" in the matrix sense, then $\mathbf{P}_k^s$ ends up no bigger than $\mathbf{P}_k^+$.

Comparing matrices needs a rule. Say $\mathbf{A} \preceq \mathbf{B}$ ("A is below B in the **[[Loewner order|loewner]]**") when $\mathbf{B} - \mathbf{A}$ is positive semi-definite: then $\mathbf{A}$ is no more uncertain than $\mathbf{B}$ in any direction you pick.

::: note Why it has to be true: smoothing never hurts
Work backward by **[[induction|induction]]**. At the end, $\mathbf{P}_N^s = \mathbf{P}_N^+$. An update never increases uncertainty, so $\mathbf{P}_N^+ \preceq \mathbf{P}_N^-$, which gives $\mathbf{P}_N^s \preceq \mathbf{P}_N^-$.

Now suppose $\mathbf{P}_{k+1}^s \preceq \mathbf{P}_{k+1}^-$. Then $\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-$ is negative semi-definite. Sandwiching a negative semi-definite matrix between $\mathbf{C}_k$ and $\mathbf{C}_k^{\mathsf{T}}$ keeps it negative semi-definite: for any vector $\mathbf{a}$, $\mathbf{a}^{\mathsf{T}}\mathbf{C}_k\mathbf{D}\mathbf{C}_k^{\mathsf{T}}\mathbf{a} = \mathbf{b}^{\mathsf{T}}\mathbf{D}\mathbf{b} \le 0$ with $\mathbf{b} = \mathbf{C}_k^{\mathsf{T}}\mathbf{a}$. So

$$
\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s-\mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}} \preceq \mathbf{P}_k^+ \preceq \mathbf{P}_k^-.
$$

The last step is the same "an update never increases uncertainty" fact. The step closes, and the chain runs all the way back to $k = 1$: $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$ at every step, with equality at $k = N$.
:::

How much better it gets depends on how much the future has to say about that moment. Early in a run, where the filter had seen almost nothing, the gain is large. In the middle it is steady. At the very end it shrinks to nothing.

::: example A hundred-step run, filtered and smoothed
Take the same model, now starting far less sure of itself: $\mathbf{P}_0^+ = \operatorname{diag}(100, 25)$, a $10\,\mathrm{m}$ position doubt and a $5\,\mathrm{m/s}$ velocity doubt. Simulate a true trajectory and its noisy readings for $N = 100$ steps ($10\,\mathrm{s}$), with the random generator seeded at $1$. Run the filter forward, store everything, then run the backward pass.

| $k$ | $\sigma_{\mathrm{filt}}$ (m) | $\sigma_{\mathrm{smooth}}$ (m) | error, filtered (m) | error, smoothed (m) |
| --- | --- | --- | --- | --- |
| $1$ | $1.961$ | $0.739$ | $1.593$ | $0.223$ |
| $10$ | $1.106$ | $0.437$ | $-1.506$ | $-0.020$ |
| $50$ | $0.746$ | $0.387$ | $0.237$ | $-0.085$ |
| $99$ | $0.745$ | $0.692$ | $1.433$ | $1.181$ |
| $100$ | $0.745$ | $0.745$ | $1.372$ | $1.372$ |

Here $\sigma$ is the square root of the position entry of the covariance: the error the estimator *claims*. The error columns are the actual estimate minus the truth.

Read it top to bottom.

- At $k = 100$ the two columns match exactly. That is the boundary condition, seen in the numbers.
- At $k = 1$ the claimed position uncertainty falls from $1.961\,\mathrm{m}$ to $0.739\,\mathrm{m}$, about $62\%$ lower. A moment the filter saw with almost no data is pinned down once the rest of the run is known.
- In the middle, $\sigma$ [[roughly halves|rms-picture]], from $0.746$ to $0.387\,\mathrm{m}$. A middle point has data on both sides.

Over the whole run, the RMS (root-mean-square) position error falls from $0.858\,\mathrm{m}$ to $0.395\,\mathrm{m}$, a $54\%$ cut. The RMS velocity error falls from $1.64\,\mathrm{m/s}$ to $0.63\,\mathrm{m/s}$, a $62\%$ cut, even though velocity is never measured at all. The filter can only infer velocity from how positions have changed so far. The smoother infers it from positions on both sides, which is the difference between guessing a car's speed from where it was and knowing both where it was and where it went next.

Sanity check: the $\sigma$ columns do not depend on the random seed, because covariances never look at the measurements. Rerun with another seed and the error columns change, but the $\sigma$ columns stay put. The error columns should mostly sit within a couple of $\sigma$ of zero, and they do.
:::

::: warning Smoothing improves the estimate; it does not create real-time information
Every smoothed number above used measurements that had not happened yet at the moment being estimated: $\hat{\mathbf{x}}_1^s$ used $\mathbf{z}_2$ through $\mathbf{z}_{100}$. So a smoother cannot steer a vehicle. Its home is post-processing: rebuilding a trajectory after a test flight, refining an orbit from a finished tracking arc, making the reference trajectory for a calibration study. There is also a real cost: the forward pass must store all four quantities at every step, which for a long run with a big state is a lot of memory.
:::

::: warning Invert the predicted covariance, not the updated one
$\mathbf{C}_k$ uses $(\mathbf{P}_{k+1}^-)^{-1}$, the *predicted* covariance at step $k+1$. Plugging in $\mathbf{P}_{k+1}^+$ is a common slip. It runs without error and gives estimates that look reasonable but are wrong. The Check yourself section explains why the predicted one is right.
:::

A smoother is also not a repair kit. It squeezes the most out of the data *given the filter's model*. If the forward filter was badly tuned or diverging, the smoother inherits the same wrong model and cannot tell you so.

## Check yourself

::: check
Explain, in one sentence, why $\hat{\mathbf{x}}_N^s = \hat{\mathbf{x}}_N^+$ exactly, with no approximation involved.
:::

::: answer
Both are defined as the average of $\mathbf{x}_N$ given exactly the same data, $\mathbf{z}_1$ through $\mathbf{z}_N$: there is no $\mathbf{z}_{N+1}$ in a run of length $N$, and smoothing only ever adds *future* data to what the filter already used, so at the last sample there is nothing left to add.
:::

::: check
Where, precisely, does the derivation use the Markov property of the state process, and what would break if the process noise $\mathbf{w}_k$ were not white?
:::

::: answer
It is used to claim $p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:N}) = p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:k})$: knowing $\mathbf{x}_{k+1}$ screens off every later measurement.

If $\mathbf{w}_k$ were not white, the process would not be Markov. Some memory of earlier disturbances would carry on past $\mathbf{x}_{k+1}$, so later measurements could carry information about $\mathbf{x}_k$ that $\mathbf{x}_{k+1}$ does not hold. The screening-off step fails, and with it the single backward recursion. A correct smoother would then have to condition on more than the next state, or the model would need the disturbance added as a state to make it Markov again.
:::

::: check
$\mathbf{C}_k$ requires $\mathbf{P}_{k+1}^-$, not $\mathbf{P}_{k+1}^+$. Explain why the *predicted*, not the *updated*, covariance is the correct one to invert.
:::

::: answer
$\mathbf{C}_k$ comes from conditioning the joint distribution of $(\mathbf{x}_k,\mathbf{x}_{k+1})$ given data through step $k$ only, before $\mathbf{z}_{k+1}$ has been used. That is the joint distribution the forward filter actually built when it produced $\hat{\mathbf{x}}_k^+$ and predicted forward. In that distribution the covariance of $\mathbf{x}_{k+1}$ is $\mathbf{P}_{k+1}^-$ by definition. $\mathbf{P}_{k+1}^+$ already includes $\mathbf{z}_{k+1}$, which is not part of the conditioning at this step of the derivation. (The later data, $\mathbf{z}_{k+1}$ included, enters through $\hat{\mathbf{x}}_{k+1}^s$ instead.)
:::

::: check
A colleague suggests approximating the smoother by averaging $\hat{\mathbf{x}}_k^+$ with a second filter run *backward* in time, rather than computing $\mathbf{C}_k$ properly. What is likely to go wrong with an unweighted average?
:::

::: answer
An unweighted average treats the forward and backward estimates as equally good at every step. They are not, and how good each is changes with $k$. Near the start, the forward filter has barely settled (large $\mathbf{P}_k^+$), while a backward filter coming from the end has had the rest of the data. Near the end the roles swap.

The RTS recursion weights the correction by $\mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}$, which adapts to how much each side knows at that step. A fixed 50–50 average over-trusts whichever direction is weaker at a given $k$, and in general it does not give the true average of the state given all the data. (Combining forward and backward filters *can* be done correctly: weight each by its inverse covariance, and make sure the prior is not counted twice.)
:::

::: check
Why would running the RTS smoother on a filter that is already diverging (the previous two lessons' subject) fail to fix the underlying problem, even though the smoothed estimate is provably at least as good as the filtered one?
:::

::: answer
The guarantee $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$ compares two covariances that both come from the filter's own model: its $\mathbf{Q}$, $\mathbf{R}$ and dynamics. It says the smoother extracts the most the data can give *if that model is right*. It says nothing about whether the model is right.

A diverging filter's $\mathbf{P}_k^+$ already misdescribes its real error. The smoother is built entirely from the same stored $\hat{\mathbf{x}}^+$, $\mathbf{P}^+$ and $\mathbf{P}^-$, so it inherits the same miscalibration. It can polish a wrong answer with more of the same wrong model, but it cannot diagnose the model. That remains the job of the consistency tests.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Smoothed estimate | Best estimate at step $k$ using the whole stored run | $\hat{\mathbf{x}}_k^s = \mathbb{E}[\mathbf{x}_k\mid\mathbf{z}_{1:N}]$; offline only |
| Screening off | The future reaches $\mathbf{x}_k$ only through $\mathbf{x}_{k+1}$ | $\mathbf{x}_k$ and $\mathbf{z}_{k+1:N}$ independent given $\mathbf{x}_{k+1}$ (Markov) |
| Smoother gain | How far a surprise at $k+1$ moves step $k$ | $\mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}$ |
| Mean recursion | Backward from $N-1$ to $1$ | $\hat{\mathbf{x}}_k^s = \hat{\mathbf{x}}_k^+ + \mathbf{C}_k(\hat{\mathbf{x}}_{k+1}^s-\hat{\mathbf{x}}_{k+1}^-)$ |
| Covariance recursion | Uncertainty after smoothing | $\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s-\mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}}$ |
| Boundary | Starting point of the backward pass | $\hat{\mathbf{x}}_N^s=\hat{\mathbf{x}}_N^+$, $\mathbf{P}_N^s=\mathbf{P}_N^+$ |
| Guarantee | Smoothing never hurts | $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$ everywhere; in the example, $54\%$ less RMS position error and $62\%$ less RMS velocity error |

The smoother improved every estimate by using data the filter already had, but had not received yet at the time. The next lesson changes what the filter stores in the first place: it carries *information* instead of covariance, a form built for a different kind of plenty — not more time, but many sensors reporting at once.

::: context orbit-determination Working out an orbit from tracking
Orbit determination means finding a spacecraft's position and velocity from measurements taken by ground stations: range (how far), range-rate (how fast it is approaching or receding), and pointing angles. A tracking pass lasts minutes to hours. Once it ends, analysts fit the whole arc at once, and the estimate at the start of the pass benefits from data at the end. That is smoothing in all but name. Navigation teams for deep-space missions work this way, and the result is used to plan the next engine burn.
:::

::: context rts-names Three engineers, one paper
Herbert Rauch, Frank Tung and Charlotte Striebel published the smoother in 1965 in the *AIAA Journal*, only five years after Kalman's filter paper. They worked in the aerospace industry, and the problem they had in mind was the one in this lesson: making the best possible estimate of a trajectory once all the tracking data were in. Their backward pass is still the one engineers code today.
:::

::: context markov-chain A chain where each link only knows its neighbor
Draw the states as a row of beads. Each bead is joined only to the next one, and each measurement hangs off its own bead. To get from $\mathbf{z}_{k+1}$ back to $\mathbf{x}_k$, you have to go through $\mathbf{x}_{k+1}$. Pin that bead down, and the path is blocked.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="50" x2="160" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <line x1="200" y1="50" x2="290" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="160,50 150,45 150,55" fill="#1f2a44"/>
  <polygon points="290,50 280,45 280,55" fill="#1f2a44"/>
  <circle cx="50" cy="50" r="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="50" r="20" fill="#b4232c" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="310" cy="50" r="20" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="50" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">x_k</text>
  <text x="180" y="55" font-size="12" text-anchor="middle" fill="#fff">x_k+1</text>
  <text x="310" y="55" font-size="12" text-anchor="middle" fill="#1f2a44">x_k+2</text>
  <line x1="180" y1="70" x2="180" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="310" y1="70" x2="310" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="160" y="100" width="40" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="290" y="100" width="40" height="24" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="180" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">z_k+1</text>
  <text x="310" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">z_k+2</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#b4232c">known: blocks the path</text>
  <text x="20" y="143" font-size="11" fill="#6c7a93">later data reach x_k only through x_k+1</text>
</svg>
```
:::

::: context gaussian-conditioning Learning one half of a pair
Suppose two quantities are jointly Gaussian: height and arm span, say. If you learn someone's arm span exactly, your best guess of their height moves toward what that arm span suggests. How far it moves is the cross-covariance divided by the arm span's variance. The same rule, written with matrices, gave the Kalman update in the three-derivations lesson. Here it is used again, with $\mathbf{x}_{k+1}$ playing the part of the arm span.
:::

::: context total-variance Two sources of doubt that add up
Guess a student's test score. First you learn which class they are in; each class has its own average and its own spread. Your total doubt is the typical spread *inside* a class plus how much the class averages differ from each other. That is the law of total variance: total variance equals the average of the conditional variance plus the variance of the conditional mean. In the smoother, "which class" is the unknown $\mathbf{x}_{k+1}$.
:::

::: context loewner Comparing two uncertainty ellipses
A covariance matrix can be drawn as an ellipse: the region where the error probably lies. $\mathbf{A} \preceq \mathbf{B}$ means the ellipse of $\mathbf{A}$ fits entirely inside the ellipse of $\mathbf{B}$. Being smaller in one direction but bigger in another does not count; the order needs "no bigger in every direction".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <ellipse cx="110" cy="70" rx="80" ry="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <ellipse cx="110" cy="70" rx="45" ry="25" fill="#1d6fd1" stroke="#1f2a44" stroke-width="2"/>
  <text x="110" y="75" font-size="12" text-anchor="middle" fill="#fff">P smoothed</text>
  <text x="110" y="135" font-size="12" text-anchor="middle" fill="#1f2a44">P filtered (outer)</text>
  <line x1="230" y1="20" x2="230" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <text x="295" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">inner ellipse</text>
  <text x="295" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">fits inside:</text>
  <text x="295" y="96" font-size="12" text-anchor="middle" fill="#1d6fd1">P_s ≤ P_+</text>
</svg>
```
:::

::: context induction Climbing down the ladder
Proof by induction usually climbs up: show a claim for the first rung, then show that holding on one rung means holding on the next. The smoother proof climbs *down*. The bottom rung is the last sample, $k = N$, where the claim is true by definition. Each step shows that if it holds at $k+1$, it holds at $k$. So it holds all the way back to the start of the run.
:::

::: context rms-picture Where the smoother gains most
The claimed position uncertainty from the hundred-step example, drawn for every step. The filter (top curve) starts high and settles. The smoother (bottom curve) is lowest in the middle, where data lies on both sides, and rises to meet the filter at the last step, where there is no future left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="85" x2="50" y2="85" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="20" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="42" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="42" y="89" font-size="11" text-anchor="end" fill="#1f2a44">1 m</text>
  <text x="42" y="24" font-size="11" text-anchor="end" fill="#1f2a44">2 m</text>
  <text x="50" y="167" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="193" y="167" font-size="11" text-anchor="middle" fill="#1f2a44">50</text>
  <text x="340" y="167" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="195" y="184" font-size="11" text-anchor="middle" fill="#6c7a93">step k</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,22.5 52.9,57.4 55.9,69.1 58.8,72.3 67.6,73.3 76.4,78.1 85.2,83.7 93.9,88.5 102.7,92.3 111.5,95.2 120.3,97.4 129.1,99.0 137.9,100.1 146.7,100.8 155.5,101.2 164.2,101.4 173.0,101.5 208.2,101.5 243.3,101.5 278.5,101.6 340.0,101.6"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,102.0 58.8,111.3 67.6,117.7 76.4,121.6 85.2,123.5 93.9,124.2 102.7,124.3 129.1,124.4 164.2,124.8 208.2,124.8 243.3,124.6 269.7,124.3 296.1,124.1 304.8,123.5 313.6,121.6 322.4,117.6 328.3,113.6 331.2,111.0 334.1,108.2 337.1,105.0 340.0,101.6"/>
  <text x="250" y="94" font-size="11" text-anchor="middle" fill="#b4232c">filtered</text>
  <text x="200" y="141" font-size="11" text-anchor="middle" fill="#1d6fd1">smoothed</text>
</svg>
```
:::
