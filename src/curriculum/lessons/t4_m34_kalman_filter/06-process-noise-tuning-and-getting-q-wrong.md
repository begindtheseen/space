---
id: l06-process-noise-tuning-and-getting-q-wrong
title: Process noise tuning and the consequences of getting Q wrong
minutes: 22
covers:
  - Process noise tuning and the consequences of getting Q wrong
---

Imagine following a friend on a bike through a busy park, keeping track of them out of the corner of your eye. Between glances you predict: "same speed, same direction, so they are about *there* now." But you also know bikes speed up, slow down and swerve. So you keep some wiggle room in your guess. How much wiggle room is the whole game. Allow too little — "they never change speed" — and you stop looking properly: when they turn, you keep staring at where they *should* have been. Allow too much — "they could be anywhere" — and every glance yanks your guess around, even when a tree was blocking your view and you only half-saw them.

In a Kalman filter that wiggle room is the **process noise covariance** $\mathbf{Q}$: how much the true state is allowed to wander away from what the model predicts in one step. Every other matrix in the filter has a source you can point to. $\mathbf{F}$ comes from the physics of motion. $\mathbf{H}$ comes from where the sensor points. $\mathbf{R}$ comes from a **[[bench test|bench-test]]** of the sensor. But $\mathbf{Q}$, as the stochastic-model lesson put it, stands for *everything the dynamics model leaves out* — and there is no bench test for what you forgot to model.

In practice $\mathbf{Q}$ is set partly by physical reasoning (the stochastic-model lesson showed how) and partly by trial against real data. Of all the numbers in a flying filter, it is the one engineers spend the most time adjusting. This lesson shows what happens when it is wrong in each direction, and how to choose it from data rather than by guessing. The two failures are not mirror images. One is quiet and dangerous; the other is loud and merely wasteful. Seeing exactly how they differ turns "tune $\mathbf{Q}$" from folklore into a procedure you can defend in front of a **[[review board|review-board]]**.

## What Q actually controls

Follow $\mathbf{Q}$ through the machinery of the last three lessons, one link at a time.

1. **$\mathbf{Q}$ sets the predicted covariance.** The predict step is $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. A bigger $\mathbf{Q}$ means a bigger $\mathbf{P}^-$.
2. **$\mathbf{P}^-$ sets the trust ratio.** In one dimension, $\rho = P^-/R$. A bigger $P^-$ means a bigger $\rho$.
3. **The trust ratio sets the gain.** $K = \rho/(1+\rho)$ rises with $\rho$.
4. **The gain sets how far each measurement moves the estimate.** A bigger gain means the estimate jumps further toward every new reading.

Now run the chain backward. A $\mathbf{Q}$ that is too small makes $\mathbf{P}^-$ small, the gain small, and the estimate barely moves, no matter what the sensor reports. A $\mathbf{Q}$ that is too big makes the gain big, and the estimate follows every reading — noise and all.

::: key What Q really represents
$\mathbf{Q}$ stands for everything the dynamics model leaves out. Too small: the covariance collapses, the gain goes to zero, and the filter ignores data it should be using — it diverges while its own reported uncertainty keeps shrinking. Too large: the estimate chases sensor noise the model should have smoothed away. $\mathbf{Q}$ is the primary tuning knob of a working filter.
:::

Both failures come from the same chain, pushed in opposite directions. The examples below run a real simulated filter to show them, rather than only asserting them.

## Too small: confident and wrong

The dangerous direction is setting $\mathbf{Q}$ too small. The danger is specific. The filter's *reported* accuracy and its *actual* accuracy drift apart, and nothing in its output looks odd. Nothing crashes. No error message appears. The covariance quietly stops meaning what it claims to mean.

::: example An unmodelled deceleration meets a too-small Q
Take the descending-booster model from the last three lessons: position and velocity, time step $0.1\,\mathrm{s}$, an altimeter with $R = 4\,\mathrm{m^2}$ (good to $2\,\mathrm{m}$). The truth starts at $2500\,\mathrm{m}$, falling at $70\,\mathrm{m/s}$, driven by the same process noise used all module long, $q_{\mathrm{true}} = 0.5$. But now the truth also has a steady **[[unmodelled deceleration|unmodelled-accel]]** of $a = -3\,\mathrm{m/s^2}$ — a drag or throttle effect. The filter's constant-velocity model knows nothing about it.

Run two filters on the same $150$ steps ($15\,\mathrm{s}$) of the same noisy readings. They differ only in the $q$ used to build their own $\mathbf{Q}$: one uses the true $0.5$, the other a hundred times less, $0.005$. "Error" below is estimate minus truth; $\sigma_p$ is the filter's own reported position standard deviation, $\sqrt{P_{pp}^+}$.

| Step | True $p$ (m) | $q=0.5$: error (m) | $q=0.5$: $\sigma_p$ (m) | $q=0.005$: error (m) | $q=0.005$: $\sigma_p$ (m) |
| --- | --- | --- | --- | --- | --- |
| $10$ | $2428.54$ | $2.27$ | $1.106$ | $2.28$ | $1.104$ |
| $50$ | $2111.70$ | $3.74$ | $0.746$ | $6.80$ | $0.561$ |
| $100$ | $1651.55$ | $2.06$ | $0.745$ | $17.86$ | $0.441$ |
| $150$ | $1122.56$ | $3.57$ | $0.745$ | $26.68$ | $0.430$ |

**The $q = 0.5$ filter.** Its error wobbles between about $2$ and $4\,\mathrm{m}$ and does not grow. It is not perfect: its model is still wrong about the deceleration, so its error runs a few times its own $\sigma_p$. But it stays bounded, because process noise of this size leaves the gain high enough to keep correcting toward the truth.

**The $q = 0.005$ filter.** It starts out identical, then comes apart. By step $150$ its error is $26.68\,\mathrm{m}$ while it reports $\sigma_p = 0.430\,\mathrm{m}$ — an error about $62$ times its own claimed standard deviation. Over the last fifty steps its **[[RMS|rms]]** error is $22.2\,\mathrm{m}$, while its reported $\sigma_p$ averages $0.433\,\mathrm{m}$. (The healthy filter over the same stretch: RMS $2.3\,\mathrm{m}$ against $\sigma_p = 0.745\,\mathrm{m}$.)

**Sense check.** Look at the $\sigma_p$ column for the small-$q$ filter: it keeps *falling* while the error keeps *growing*. The filter has not crashed. It is producing smooth, confident, reasonable-looking numbers, every one of them wrong. Nothing in its output format tells this run apart from the healthy one. That is exactly why the consistency-testing lesson later in this module exists: a filter like this must be caught by a statistical test, because it will not announce itself.
:::

The mechanism is the "gain stuck near zero" failure from the trust-ratio lesson. A tiny $\mathbf{Q}$ shrinks $\mathbf{P}^-$ at every predict step. A tiny $\mathbf{P}^-$ shrinks the gain. A tiny gain means each new, informative measurement barely moves the estimate. So the error that the unmodelled deceleration keeps adding is never fully corrected. It piles up, step after step — even though every single measurement, looked at on its own, was telling the filter exactly where the truth had gone.

::: warning Small Q is not "playing it safe"
It feels cautious to set $\mathbf{Q}$ small: "I trust my physics." But a small $\mathbf{Q}$ is a strong *claim* — that the model leaves almost nothing out. If the claim is false, the filter becomes confident and wrong, the worst combination there is, because everything downstream trusts that confidence. When unsure, err toward a slightly larger $\mathbf{Q}$, and then check it with data, as below.
:::

## Too large: a good model, a jumpy estimate

Setting $\mathbf{Q}$ too large fails loudly instead of quietly. That makes it the safer mistake to make by accident. It still has a real cost, paid all the time in estimate quality rather than in one dramatic failure.

::: example Sweeping Q when the model is exactly right
Remove the deceleration. The truth is now a genuine constant-velocity motion, still shaken by real process noise $q_{\mathrm{true}} = 0.5$. At $q = 0.5$ the filter's assumptions are exactly correct, so *only* the tuning is being tested. Run $2000$ steps ($200\,\mathrm{s}$), skip the first $100$ so the start-up does not count, and try five values of $q$ across four powers of ten. Measure two things:

- the RMS position error against the truth;
- the **[[jitter|jitter]]**: the standard deviation of the step-to-step change in the error — how jumpy the estimate is.

| $q$ | RMS position error (m) | Jitter (m) |
| --- | --- | --- |
| $0.005$ | $2.005$ | $0.115$ |
| $0.05$ | $0.957$ | $0.175$ |
| $0.5$ (truth) | $0.722$ | $0.297$ |
| $5.0$ | $0.861$ | $0.508$ |
| $50.0$ | $1.122$ | $0.848$ |

**RMS error.** It is smallest exactly at $q = 0.5$, the true value, and rises on *both* sides. So "tune $\mathbf{Q}$" has a genuine best answer; it is not a matter of taste.

**Jitter.** It climbs steadily with $q$, by a factor of about seven from the smallest setting to the largest ($0.848/0.115 \approx 7.4$). A bigger assumed $q$ raises the gain, and a higher gain passes more of each reading's own noise straight into the estimate. At $q = 50$ the filter is the jumpiest of the five, chasing every reading's error.

**Sense check.** The smallest $q$ is the *worst* for accuracy here — worse even than $q = 50$, a hundredfold overestimate. That makes sense. The model is right, but it includes real process noise, and a $q$ of $0.005$ denies that the booster ever wanders. It then lags behind every real wander.
:::

Notice what that last point means. A common instinct says "when in doubt, trust the model — make $\mathbf{Q}$ small." But even a structurally perfect model has real process noise of its own, and an undersized $\mathbf{Q}$ throws away genuine motion along with any modelling error. There is no direction in which "smaller $\mathbf{Q}$ is always safer" holds. There is only the true value, unknown in general, and two kinds of wrong on either side of it.

## Tuning Q from data: make the surprises fit

The physical approach from the stochastic-model lesson — noise densities from a data sheet, random walk figures for a gyro — gets you close. "Close" still leaves a number to pin down. The tool for that is already built: the **innovation**,

$$
\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-,
$$

read "nu sub k". It is the surprise at step $k$: the gap between what the sensor read and what the filter expected it to read. The filter also predicts how big its surprises should be, through the innovation covariance

$$
\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}.
$$

For a correctly tuned filter, the orthogonality principle from the three-derivations lesson says the innovations average zero and have exactly covariance $\mathbf{S}_k$. We write that $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$: "nu is normally distributed with mean zero and covariance $\mathbf{S}_k$". And $\mathbf{S}_k$ depends on $\mathbf{Q}$, because $\mathbf{Q}$ feeds into $\mathbf{P}_k^-$ through the Riccati equation of the last lesson.

So here is the idea. For each candidate $\mathbf{Q}$, run the filter over recorded data. Ask: how likely were the surprises it saw, given the sizes it predicted? That score is the average Gaussian **[[log-likelihood|likelihood]]** of the innovations:

$$
\mathcal{L}(\mathbf{Q}) = -\frac{1}{2N}\sum_{k=1}^{N}\Big[\boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k(\mathbf{Q})^{-1}\boldsymbol{\nu}_k + \ln\det\big(2\pi\mathbf{S}_k(\mathbf{Q})\big)\Big].
$$

Here $\det$ is the **determinant**, a single number measuring how big a matrix's spread is, and $\ln$ is the natural logarithm. The bigger $\mathcal{L}$, the better the candidate. The two terms inside the brackets pull in opposite directions.

- **The surprise term,** $\boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$. In one dimension this is $\nu_k^2/S_k$: the surprise squared, measured in units of the predicted size. If $\mathbf{Q}$ is too small, $\mathbf{S}_k$ is too small, so ordinary surprises look shockingly large. This term gets big and drags $\mathcal{L}$ down.
- **The modesty term,** $\ln\det(2\pi\mathbf{S}_k)$. If $\mathbf{Q}$ is too large, $\mathbf{S}_k$ is needlessly large. The surprise term then looks fine, but this term grows. A filter that claims to be very unsure and then turns out quite accurate has also mis-predicted itself — in the other direction — and pays for it here.

::: example Tuning Q by making the innovations most likely
Score each $q$ from the sweep above with $\mathcal{L}(q)$, over the same $1900$ steps.

| $q$ | $0.005$ | $0.05$ | $0.5$ | $5.0$ | $50.0$ |
| --- | --- | --- | --- | --- | --- |
| $\mathcal{L}(q)$ | $-2.666$ | $-2.270$ | $-2.220$ | $-2.251$ | $-2.324$ |

**The coarse grid.** The highest (least negative) score is at $q = 0.5$, the true value.

**Zooming in.** Try $q = 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 2.0, 3.0$. The scores are $-2.239$, $-2.224$, $-2.221$, $-2.220$, $-2.222$, $-2.225$, $-2.234$ and $-2.241$. That is a smooth hump, highest at $0.5$, with $0.3$ and $0.7$ very close behind and the values beyond them noticeably lower.

**Sense check.** The hump is gentle near the top, so the data pin $q$ down to within a factor of about two, not to three digits. That is normal, and honest to report. What you can now defend in a design review is not "I tried a few values and this one looked fine" but "this is the value that makes the observed innovations most probable under the filter's own predicted covariance" — backed by a curve with a computed peak.
:::

Here is the whole experiment in code. It runs the sweep and prints both the accuracy scores (which need the truth, so only work in simulation) and the likelihood (which needs only the innovations, so works on real flight data too).

```python
import numpy as np

dt, q_true = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
H = np.array([[1.0, 0.0]]); R = 4.0
def Qm(q):
    return q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])

def simulate(seed, a, N):
    """Truth with process noise q_true plus a constant acceleration a."""
    rng = np.random.default_rng(seed)
    x = np.array([2500.0, -70.0]); xs, zs = [], []
    for _ in range(N):
        x = F @ x + np.array([0.5*a*dt**2, a*dt]) + rng.multivariate_normal([0, 0], Qm(q_true))
        xs.append(x[0]); zs.append(x[0] + rng.normal(0.0, np.sqrt(R)))
    return np.array(xs), np.array(zs)

def run_filter(zs, q):
    x = np.array([2400.0, -60.0]); P = np.diag([100.0, 25.0]); Q = Qm(q)
    est, sig, nus, Ss = [], [], [], []
    for z in zs:
        x = F @ x; P = F @ P @ F.T + Q                 # predict
        nu = z - x[0]; S = P[0, 0] + R                 # innovation
        K = P[:, 0] / S                                # gain
        x = x + K * nu; P = P - np.outer(K, P[0, :])   # update
        est.append(x[0]); sig.append(np.sqrt(P[0, 0])); nus.append(nu); Ss.append(S)
    return np.array(est), np.array(sig), np.array(nus), np.array(Ss)

truth, zs = simulate(seed=34, a=0.0, N=2000)
for q in [0.005, 0.05, 0.5, 5.0, 50.0]:
    est, sig, nu, S = run_filter(zs, q)
    e = (est - truth)[100:]                            # skip the first 10 s
    L = -0.5 * np.mean(nu[100:]**2 / S[100:] + np.log(2*np.pi*S[100:]))
    print(f"q={q:<6} rms={np.sqrt(np.mean(e**2)):.3f}  "
          f"jitter={np.std(np.diff(e)):.3f}  L={L:.3f}")
# q=0.005  rms=2.005  jitter=0.115  L=-2.666
# q=0.05   rms=0.957  jitter=0.175  L=-2.270
# q=0.5    rms=0.722  jitter=0.297  L=-2.220
# q=5.0    rms=0.861  jitter=0.508  L=-2.251
# q=50.0   rms=1.122  jitter=0.848  L=-2.324
```

Changing `a=0.0` to `a=-3.0` in the `simulate` call reruns the sweep against the truth with the hidden deceleration. The first example's table came from the same two functions, with `a=-3.0` and `N=150`.

::: warning A likelihood peak is not a certificate
Maximizing $\mathcal{L}(\mathbf{Q})$ finds the $\mathbf{Q}$ that best explains the innovations *given everything else in the model* — $\mathbf{F}$, $\mathbf{H}$ and $\mathbf{R}$ all held fixed and assumed right. If $\mathbf{R}$ is wrong, or the dynamics are missing a state (as in the deceleration example), the best-fit $\mathbf{Q}$ quietly soaks up that error too. It inflates to cover a mistake that is not really process noise at all.

So treat a large fitted $\mathbf{Q}$ as a symptom to investigate, not a finished tuning. Engineers call this failure using $\mathbf{Q}$ as a **[[dumping ground|dumping-ground]]**. The observability lesson later in this module gives one concrete reason a state can be impossible to separate from $\mathbf{Q}$, no matter how much data you collect.
:::

## Check yourself

::: check
Without redoing the simulation, explain why the $q = 0.005$ filter's $\sigma_p$ in the deceleration example kept *shrinking* while its actual error kept *growing*.
:::

::: answer
$\sigma_p$ comes from the Riccati equation of the last lesson, which computes $\mathbf{P}_k^-$ from $\mathbf{F}$, $\mathbf{Q}$, $\mathbf{H}$ and $\mathbf{R}$ alone. It cannot see the actual error — only the model's own assumptions. With $q$ tiny, those assumptions say very little uncertainty should remain after a few updates, so $\sigma_p$ falls.

The true error grows because the real motion has a deceleration that the filter's $\mathbf{F}$ does not contain. The tiny gain that comes from the tiny $\mathbf{P}^-$ is too small to correct for it each step, so the error piles up. The two numbers come from entirely different sources — one from the model, one from reality. A badly tuned $\mathbf{Q}$ is exactly a case where they disagree, without either calculation containing an arithmetic mistake.
:::

::: check
A colleague says that setting $\mathbf{Q}$ very small is "the conservative choice", because it makes the filter trust its physics-based model. Use this lesson's second experiment to argue against that.
:::

::: answer
"Conservative" should mean safer when you are unsure. But in the sweep with a perfectly correct model, the smallest $q$ tried, $0.005$, gave the *worst* RMS error of the five: $2.005\,\mathrm{m}$, against $0.722\,\mathrm{m}$ at the true $q = 0.5$ and even $1.122\,\mathrm{m}$ at $q = 50$, a hundredfold overestimate.

A small $\mathbf{Q}$ is not neutral. It actively ignores real process noise that is genuinely there. It is "conservative" only in the narrow sense of reporting a small $\sigma_p$ — and a small $\sigma_p$ that does not match the real error is the opposite of safe. The deceleration experiment makes the point more sharply: the small-$\mathbf{Q}$ filter was both less accurate and more confident than the correctly tuned one, the worst possible combination.
:::

::: check
Describe what the likelihood curve $\mathcal{L}(q)$ would look like if it were computed against the deceleration truth instead of the constant-velocity truth. Would you still expect its peak near $q = 0.5$?
:::

::: answer
No. With a hidden deceleration, no $q$ makes the constant-velocity model exactly right. The best $q$ is whatever trades off the two errors it can control: enough process noise to keep the gain high enough to chase the drift the deceleration causes, but not so much that it needlessly amplifies measurement noise on top.

That best $q$ should come out *larger* than the true $q_{\mathrm{true}} = 0.5$, because part of its job is now covering a real, deterministic effect. Running the lesson's code with `a=-3.0` confirms it: over $2000$ steps the likelihood peaks near $q \approx 15$, about thirty times the true value. This is the dumping-ground warning made concrete. The fitted number is doing double duty, and a surprisingly large fitted $\mathbf{Q}$ is a hint that a state is missing from the model — here, an acceleration — not only that the noise level was mismeasured.
:::

::: check
Why does the log-likelihood include the $\ln\det\mathbf{S}_k$ term, instead of scoring $\mathbf{Q}$ by the size of the normalized surprises alone?
:::

::: answer
Suppose you scored only by the surprise term, trying to make $\sum_k \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$ as small as possible. You could win by making $\mathbf{S}_k$ enormous: a huge $\mathbf{S}_k$ has a tiny inverse, which shrinks every surprise term toward zero whatever the real innovations are. Taken to the extreme, that rewards an absurdly inflated $\mathbf{Q}$ that predicts huge uncertainty and so is never "surprised" by anything.

The $\ln\det\mathbf{S}_k$ term is the penalty for that false modesty. It grows whenever $\mathbf{S}_k$ grows, so an inflated covariance is charged directly for claiming more uncertainty than the data need. Only the two terms together make a proper log-likelihood, and only together do they have a genuine peak in the middle instead of running off to one extreme.
:::

::: check
On a real flight you have no truth, only the innovations. Over a long stretch, the average of $\nu_k^2/S_k$ comes out around $2$ instead of the $1$ a well-tuned one-number filter should show. Which way is $\mathbf{Q}$ most likely wrong, and what else could cause it?
:::

::: answer
The surprises are about twice as big, in variance, as the filter predicted. So $S_k$ is too small, and the most likely cause is a $\mathbf{Q}$ that is too small: the filter is overconfident about its predictions. (In the lesson's own sweep, the $q = 0.005$ filter showed an average of about $2.06$, against about $1.07$ at the true $q$.)

But $S_k = HP_k^-H^{\mathsf{T}} + R$ has two parts, so an $R$ set too small would also do it. So would an unmodelled effect — a bias or an acceleration — that makes the surprises lean one way. The next step is to look at *how* the innovations are wrong: if they keep the same sign for long stretches, suspect a missing state rather than a noise level. The consistency-testing lesson turns this check into a formal test.
:::

## Summary

| Idea | Statement |
| --- | --- |
| The chain | $\mathbf{Q}$ → $\mathbf{P}^-$ (predict step) → trust ratio → gain → how far each measurement moves the estimate |
| Q too small | covariance and gain collapse; the filter ignores real evidence and errors pile up — confident and wrong, with no visible symptom |
| Q too large | covariance and gain stay high; the estimate jitters, chasing measurement noise |
| No model error does not mean tiny Q | real process noise exists even in a correct model; the best Q matched the true $q$, not zero |
| Innovation likelihood | $\mathcal{L}(\mathbf{Q}) = -\tfrac{1}{2N}\sum_k\big[\boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k + \ln\det(2\pi\mathbf{S}_k)\big]$, maximized over candidate Q using real innovations |
| Q as a dumping ground | a fitted Q that must cover an unmodelled effect runs larger than the true noise — a hint to look for a missing state |

This lesson treated $\mathbf{Q}$ as a dial, turned until the innovations looked right. The next lesson asks what happens to a *correctly* tuned filter if you let its Riccati equation run forever: is the settling seen in the last two lessons' tables a coincidence of those numbers, or a guaranteed destination?

::: context bench-test How R gets measured
To find a sensor's noise, engineers bolt it down on a lab bench — or leave it sitting still — and record its output for a long time while nothing changes. Whatever wobble shows up is noise, and its variance is a first estimate of $\mathbf{R}$. For gyros and accelerometers, a tool called the **Allan variance** sorts that wobble by time scale, separating fast white noise from slow drift. Nothing like that exists for $\mathbf{Q}$: you cannot hold the *model's mistakes* still on a bench.
:::

::: context review-board Defending a design
Big aerospace projects pass through formal **design reviews** — a preliminary design review, then a critical design review — where a board of experienced engineers questions every choice before hardware is built or software is flown. "Why is $\mathbf{Q}$ this number?" is a fair question at such a review. "It looked fine" is not an acceptable answer. "It maximizes the likelihood of the recorded innovations, and here is the curve" is.
:::

::: context unmodelled-accel Why a real booster has accelerations the model ignores
A constant-velocity model says the booster keeps its speed between steps. A real descending booster does not: air drag grows as the air gets thicker lower down, engines throttle up for a landing burn, and grid fins steer. A filter can carry acceleration as another state, or it can leave it out and rely on $\mathbf{Q}$ to cover it. Leaving it out is simpler — and it is exactly what makes $\mathbf{Q}$ matter so much. Three metres per second squared, the size used in the lesson, is less than a third of $g_0 = 9.80665\,\mathrm{m/s^2}$: a small push.
:::

::: context rms Root mean square
**RMS**, short for root mean square, is a way to boil a list of errors down to one typical size. Do what the name says, backwards: **square** each error (so minus signs stop cancelling plus signs), take the **mean** of the squares, then take the square **root** to get back to metres. For errors of $3$, $-4$ and $0$: the squares are $9$, $16$, $0$; the mean is $25/3 \approx 8.33$; the root is about $2.89$. RMS error is the number to compare with a filter's reported $\sigma$: for an honest filter they match.
:::

::: context jitter Lagging versus jumpy
Two ways to be wrong about the same motion. A too-small $\mathbf{Q}$ gives a smooth estimate that lags behind real changes. A too-large $\mathbf{Q}$ gives an estimate that stays near the truth on average but jumps with every reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="150" x2="20" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20,40 C120,42 200,70 340,130" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M20,40 C140,40 230,54 340,94" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.5" points="20,40 40,34 60,48 80,38 100,50 120,40 140,54 160,46 180,62 200,56 220,74 240,72 260,94 280,90 300,110 320,106 340,132"/>
  <g font-size="11">
    <text x="30" y="164" fill="#1f2a44">time</text>
    <text x="236" y="140" fill="#1f2a44">truth</text>
    <text x="250" y="60" fill="#1d6fd1">Q too small: lags</text>
    <text x="100" y="100" fill="#b4232c">Q too large: jumpy</text>
  </g>
</svg>
```

A sketch, not data: the lesson's tables give the real sizes. Jitter, as defined in the lesson, measures the red line's jumpiness.
:::

::: context likelihood What "likelihood" scores
Draw the bell curve the filter *predicts* for its surprises — its width set by $\mathbf{S}_k$ — and drop the surprises it actually saw onto the same line. The likelihood is high when the dots land where the curve is tall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="20,150.0 100,150.0 110,149.7 120,148.7 130,144.7 140,133.8 150,111.1 160,77.4 170,44.4 180,30.3 190,44.4 200,77.4 210,111.1 220,133.8 230,144.7 240,148.7 250,149.7 260,150.0 340,150.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="20,150.0 30,149.9 40,149.9 50,149.7 60,149.3 70,148.6 80,147.4 90,145.2 100,141.9 110,137.1 120,130.6 130,122.6 140,113.7 150,104.8 160,97.2 170,92.0 180,90.2 190,92.0 200,97.2 210,104.8 220,113.7 230,122.6 240,130.6 250,137.1 260,141.9 270,145.2 280,147.4 290,148.6 300,149.3 310,149.7 320,149.9 330,149.9 340,150.0"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="20,141.8 60,137.9 100,134.0 140,131.1 180,130.1 220,131.1 260,134.0 300,137.9 340,141.8"/>
  <g fill="#1f2a44">
    <circle cx="194" cy="162" r="3.5"/><circle cx="213" cy="162" r="3.5"/><circle cx="193" cy="170" r="3.5"/>
    <circle cx="128" cy="162" r="3.5"/><circle cx="216" cy="170" r="3.5"/><circle cx="198" cy="178" r="3.5"/>
    <circle cx="159" cy="162" r="3.5"/><circle cx="203" cy="186" r="3.5"/><circle cx="195" cy="186" r="3.5"/>
  </g>
  <g font-size="11">
    <text x="196" y="30" fill="#b4232c">S too small (Q too small)</text>
    <text x="238" y="112" fill="#1d6fd1">S right</text>
    <text x="264" y="128" fill="#6c7a93">S too big (Q too big)</text>
    <text x="20" y="196" fill="#1f2a44">the surprises actually seen</text>
  </g>
</svg>
```

The narrow red curve is tall in the middle but nearly zero where some dots fall — those dots are "shocking" and cost a lot. The flat grey curve never gets tall anywhere — the modesty cost. The blue curve, with the right width, scores best.
:::

::: context dumping-ground When Q hides a missing state
A classic real-world case: a gyro has a slowly changing **bias** — it reads a little too high, by an amount that drifts. If the filter has no bias state, the only way it can keep up is a large $\mathbf{Q}$ on the attitude. That works after a fashion, but it makes the filter jumpy all the time, to cover an error that was really one slowly varying number. Adding a bias state to the model, and shrinking $\mathbf{Q}$ back down, usually fixes both problems at once. Augmenting the state this way is the first remedy the divergence lesson lists.
:::
