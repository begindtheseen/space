---
id: l06-the-linear-kalman-filter-from-memory
title: "The linear Kalman filter, from memory"
minutes: 19
covers:
  - "the Kalman filter in linear form: the predict and update equations and what each term does"
---

Close your eyes and walk across your bedroom, counting steps. After a few steps you have a guess of where you are — but the guess gets fuzzier with every step, because your steps are not all the same length. Now peek for half a second. The peek is not perfect either; the light is dim. So you do not throw away your step-counting guess. You blend the two, trusting whichever one you are more sure of. Then you close your eyes and keep walking.

That loop — guess forward, get fuzzier, peek, blend, repeat — is the **[[Kalman filter|kalman-name]]**. It is the most used estimation algorithm in guidance, navigation and control. It runs in spacecraft navigation, aircraft inertial systems, phone GPS and landers.

"Write down the Kalman filter" is the most literal question in this module. The module's own exercise asks you to do it on blank paper, with no reference, in under five minutes. That standard is reachable. There are seven short equations, and each carries one sentence of meaning that makes it hard to forget. Interviewers ask it because the follow-up — *what does each term do?* — cannot be faked. A candidate who writes the gain correctly and then cannot say what the bracket in it means has told them something specific.

This lesson gives the model, the seven equations, the meaning of every term, two other forms worth knowing, and the checks that catch a mis-written equation before the interviewer does.

## State the model before you write the filter

The filter is the best possible estimator *for one particular model*. Writing the filter without the model answers an unstated question. So say the model first. It takes fifteen seconds:

$$
\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}, \qquad \mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k
$$

Bold letters are vectors (lowercase) and matrices (uppercase). The subscript $k$ counts time steps. Here is each symbol:

- $\mathbf{x}$ is the **state** — the numbers you want to know, such as altitude and descent rate. It has $n$ entries ($n\times1$).
- $\mathbf{z}$ is the **measurement** — what the sensor reports. It has $m$ entries ($m\times1$).
- $\mathbf{F}$ is the **state transition matrix** ($n\times n$): how the state moves from one step to the next.
- $\mathbf{G}$ is the **control-input matrix**, written $\mathbf{B}$ in many texts: how a known command $\mathbf{u}$ moves the state.
- $\mathbf{H}$ is the **measurement matrix** ($m\times n$): which combination of the state the sensor sees.
- $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$ is **process noise**, everything the model leaves out. Read "$\sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$" as "drawn from a **[[Gaussian|gaussian]]** bell curve with average zero and **[[covariance|covariance]]** $\mathbf{Q}$".
- $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$ is **measurement noise**, the sensor's own error.

The assumptions that make the filter optimal: both noises are **[[white|white-noise]]** — each step's noise has nothing to do with any other step's — **zero-mean**, and **uncorrelated with each other** and with the starting state $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$.

Two things to say about those assumptions while you have the board.

- If the noises are Gaussian, the filter is optimal outright: it computes the exact conditional mean, the best possible guess given all the data. If they are not Gaussian, it is still the **[[best linear unbiased estimator|blue]]**. That is a weaker claim, but still very useful.
- Whiteness is the assumption real systems break most. A sensor bias that wanders slowly is not white — today's error looks like yesterday's. The fix is to estimate the bias as part of the state, instead of pretending it is noise.

Notation for the loop: the hat means "estimate", so $\hat{\mathbf{x}}$ is read "x hat". The superscript minus, $\hat{\mathbf{x}}_k^-$ and $\mathbf{P}_k^-$ ("x hat minus", "P minus"), marks the estimate and its covariance *before* the measurement at step $k$ is used. The superscript plus marks the values *after*. $\mathbf{P}$ is the filter's covariance: how unsure it thinks it is. The filter alternates between minus and plus forever.

## Predict

This is the "eyes closed, keep walking" half.

$$
\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}, \qquad \mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}
$$

The superscript $\mathsf{T}$ is the **[[transpose|transpose]]**: flip the matrix across its diagonal, so rows become columns.

**The state prediction** runs the known dynamics forward on the best estimate so far. The process noise adds nothing to it, because the noise averages to zero. Noise with no lean cannot change where you *expect* to be — only how sure you are.

**The covariance prediction** has two parts that do different jobs.

- $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$ *carries* the uncertainty you already had through the dynamics. If you are unsure of both position and velocity, one step later you are more unsure of position, and the two errors are now linked — a correlation that was not there before.
- $\mathbf{Q}$ *creates* new uncertainty for everything the model leaves out.

So the covariance always grows in prediction. That is the formal way of saying that coasting on a model makes you less sure.

## Update

This is the "peek and blend" half.

$$
\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-, \qquad \mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}, \qquad \mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}
$$

$$
\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k, \qquad \mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-
$$

$\boldsymbol{\nu}_k$ (Greek "nu", said "new") is the **[[innovation|innovation]]**: what the sensor said minus what the filter expected it to say. It is the only new information in the whole cycle. Everything else was already known.

$\mathbf{S}_k$ is the **innovation covariance**: how big the innovation *should* be. It adds the filter's own uncertainty, mapped into what the sensor sees ($\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$), to the sensor's noise ($\mathbf{R}$). It is what makes an innovation meaningful. A $30\,\mathrm{m}$ surprise is normal if $\sqrt{\mathbf{S}}$ is $40\,\mathrm{m}$, and alarming if it is $3\,\mathrm{m}$. It is also what a **measurement-gating** test — a check that throws out wild readings — is built from.

$\mathbf{K}_k$ is the **Kalman gain**. Read it as a **trust ratio**: the filter's uncertainty (in measurement terms) divided by the total uncertainty. Large $\mathbf{P}^-$ or small $\mathbf{R}$ means "trust the sensor". Small $\mathbf{P}^-$ or large $\mathbf{R}$ means "trust the prediction". With one number instead of matrices, it is plain to see:

$$
K = \frac{P^-}{P^- + R} = \frac{\rho}{1 + \rho}, \qquad \rho = \frac{P^-}{R}
$$

Here $\rho$ (rho) is the ratio of the two uncertainties. $K$ always lies strictly between $0$ and $1$. It is exactly the fraction of the surprise you accept.

The last two equations apply that trust: move the estimate by the gain times the surprise, and shrink the covariance to match. $\mathbf{I}$ is the **identity matrix**, the matrix version of the number 1.

::: key The linear Kalman filter
**Predict.** $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$ (with $\mathbf{G}$ often written $\mathbf{B}$); $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Propagate the state through the dynamics and grow the covariance by the process noise.

**Update.** $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$; $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$; $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$; $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$; $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$. The gain trades prior covariance against measurement covariance.
:::

## Two forms worth having ready

**The Joseph form.** The short covariance update $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ is only correct at the *optimal* gain. For any gain at all:

$$
\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}
$$

This is a sum of two symmetric, **[[positive semi-definite|psd]]** terms, so the result stays symmetric and positive semi-definite automatically. The short form does not promise that, which is why flight software uses the Joseph form. Reach for it whenever the gain has been rounded, detuned, fixed at a steady-state value, or deliberately under-weighted.

**The information form.** Turn the update upside down and it becomes an addition:

$$
(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}
$$

An inverse covariance is called **information** — big when you are sure, small when you are not. Information adds. This form makes three things plain: a measurement can never make you less certain; fusing many sensors is a sum, not a chain of compromises; and "knowing nothing to start" is written as zero information, not infinite covariance.

::: note Why the scalar gain is the best blend
Blend two guesses: the prior $\hat x^-$ with variance $P^-$, and the measurement $z$ with variance $R$. Take $\hat x^+ = \hat x^- + K(z - \hat x^-)$, which is $(1-K)$ of the prior plus $K$ of the measurement. Since the two errors are independent, the variance of the blend is $P^+ = (1-K)^2P^- + K^2R$. To make it as small as possible, set its derivative with respect to $K$ to zero: $-2(1-K)P^- + 2KR = 0$. Solve: $K = P^-/(P^- + R)$. Put that back in and $P^+ = (1-K)P^-$ — the short form, true only at this best $K$. For any other $K$, the full expression $(1-K)^2P^- + K^2R$ is the Joseph form in one dimension.
:::

## Checks that catch a mis-written equation

Before the interviewer says anything, run these on what you wrote. They take ten seconds, and they turn a memory answer into a confident one.

**Dimensions.** $\mathbf{P}$ is $n\times n$. $\mathbf{R}$ and $\mathbf{S}$ are $m\times m$. $\mathbf{H}$ is $m\times n$. The gain $\mathbf{K}$ must be $n\times m$: it takes a measurement-sized thing and returns a state-sized correction. Check: $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is $(n\times n)(n\times m)(m\times m)$, which is $n\times m$. If your gain does not come out $n\times m$, a transpose is in the wrong place.

**Symmetry.** Every covariance must be symmetric. $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$ is; $\mathbf{F}\mathbf{P}\mathbf{F}$ is not.

**The two limits of the gain.** As $\mathbf{R}\to\mathbf{0}$ (a perfect sensor), the gain must take the measurement outright. As $\mathbf{R}\to\infty$ (a useless sensor), the gain must go to zero. Only $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ in the denominator does both.

**Direction.** Prediction must grow the covariance; update must shrink it. If your update can grow it, a sign is wrong.

**Units.** A covariance entry carries the product of the units of the two states it links. For a position–velocity state, the diagonal is $\mathrm{m^2}$ and $\mathrm{m^2/s^2}$, and the off-diagonal is $\mathrm{m^2/s}$.

::: warning The short covariance update is not safe in flight code
$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ is right only at the exactly optimal gain, and it subtracts rather than adds. Rounding errors can make the result lopsided (asymmetric) or even give it negative variances. Then the filter is computing with something that is no longer a covariance. Use the Joseph form in anything that flies, and whenever the gain is not the optimal one.
:::

::: example One full cycle, with numbers
A lander carries a **[[radar altimeter|radar-altimeter]]**. The state is altitude and descent rate, $\mathbf{x} = (h, \dot h)^{\mathsf{T}}$. The filter runs at $10\,\mathrm{Hz}$, so each step is $\Delta t = 0.1\,\mathrm{s}$, and

$$
\mathbf{F} = \begin{pmatrix}1 & 0.1\\ 0 & 1\end{pmatrix}, \qquad \mathbf{H} = \begin{pmatrix}1 & 0\end{pmatrix}.
$$

$\mathbf{F}$ says "new altitude = old altitude + $0.1 \times$ rate; rate stays the same". $\mathbf{H}$ says "the altimeter sees altitude only".

The process noise comes from unmodeled acceleration with **[[power spectral density|psd-q]]** $q = 0.5\,\mathrm{m^2/s^3}$. For a constant-velocity model, the standard discrete form is

$$
\mathbf{Q} = q\begin{pmatrix}\Delta t^3/3 & \Delta t^2/2\\ \Delta t^2/2 & \Delta t\end{pmatrix} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 5\times10^{-2}\end{pmatrix}.
$$

**Update, worked as one number.** Say the prior altitude variance is $P^- = 4\,\mathrm{m^2}$ — a standard deviation of $2\,\mathrm{m}$. The altimeter has $\sigma = 1.5\,\mathrm{m}$, so $R = 1.5^2 = 2.25\,\mathrm{m^2}$.

1. Innovation covariance: $S = 4 + 2.25 = 6.25\,\mathrm{m^2}$.
2. Gain: $K = 4/6.25 = 0.64$.
3. Posterior variance: $P^+ = (1 - 0.64)\times 4 = 0.36 \times 4 = 1.44\,\mathrm{m^2}$.

The posterior standard deviation is $\sqrt{1.44} = 1.2\,\mathrm{m}$ — better than both the prior's $2\,\mathrm{m}$ and the sensor's $1.5\,\mathrm{m}$, as it should be.

**Check it another way,** through the information form: $1/4 + 1/2.25 = 0.2500 + 0.4444 = 0.6944\,\mathrm{m^{-2}}$, and $1/0.6944 = 1.44\,\mathrm{m^2}$. The two routes agree. That is the check worth saying out loud.

**Read the gain physically.** $K = 0.64$ means the filter accepts $64\%$ of the gap between what the altimeter said and what it expected. The prior is a little less certain than the sensor, so the sensor wins — but not outright, because the prior carries real information too.

**Predict, worked as a matrix.** Take the posterior to be $\mathbf{P}^+ = \mathrm{diag}(1.44,\ 0.25)$ — altitude variance $1.44\,\mathrm{m^2}$, rate variance $0.25\,\mathrm{m^2/s^2}$, no correlation yet. Propagate one step:

$$
\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} = \begin{pmatrix}1.4425 & 0.025\\ 0.025 & 0.25\end{pmatrix}, \qquad \mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \begin{pmatrix}1.4427 & 0.0275\\ 0.0275 & 0.30\end{pmatrix}.
$$

Three things happened in one line:

- The altitude variance grew from $1.44$ to $1.4427\,\mathrm{m^2}$ — a standard deviation from $1.200$ to $1.201\,\mathrm{m}$. Barely, because a tenth of a second of $0.5\,\mathrm{m/s}$ rate uncertainty is not much.
- The rate variance grew from $0.25$ to $0.30\,\mathrm{m^2/s^2}$, entirely from $\mathbf{Q}$, since nothing in the dynamics tells you about the rate.
- An off-diagonal term appeared where there was none: $0.025$ from the dynamics (an unknown rate error becomes a linked altitude error over a step), plus $0.0025$ from the shared acceleration noise. The correlation coefficient is $0.0275/\sqrt{1.4427 \times 0.30} \approx 0.042$.

That correlation is small after one step. But it is exactly this term that lets an altimeter-only filter estimate descent rate at all: when altitude is corrected, the link drags the rate estimate along.
:::

::: example "Write the Kalman filter and explain every term"
**A weak answer** writes the seven equations correctly, in silence, then says: "So you predict forward using $\mathbf{F}$, then you compute the gain, then you update the state and the covariance."

Nothing is wrong. Nothing beyond memory has been shown either, and the next question will find that out.

**A strong answer, narrated:**

"Let me state the model first, because the filter is optimal for this model and not in general.

Linear dynamics, $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}$; linear measurement, $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}$; both noises white, zero-mean, uncorrelated with each other, covariances $\mathbf{Q}$ and $\mathbf{R}$. If they are also Gaussian this is the exact conditional mean; if not, it is still the best linear unbiased estimator.

Predict. $\hat{\mathbf{x}}^- = \mathbf{F}\hat{\mathbf{x}}^+ + \mathbf{G}\mathbf{u}$ — run the dynamics; the noise has zero mean so it does not move the estimate. $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ — the first term carries the uncertainty I had, the second adds uncertainty for what the model leaves out. Covariance always grows here.

Update. The innovation $\boldsymbol{\nu} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$ is the only new information in the cycle. Its covariance is $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$: how big I expected the surprise to be, from my uncertainty plus the sensor's. The gain $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is a trust ratio — prior uncertainty in measurement space over total uncertainty. Then $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ and $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.

Two caveats on that last one. It holds only at the optimal gain; for any other gain you need the Joseph form, $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$, which flight code uses because it cannot go indefinite. And in information form the update is an addition, $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$, which shows a measurement can never make you less certain.

Checks. The gain must be $n$ by $m$, and $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is. Let $\mathbf{R}$ go to infinity and the gain goes to zero — right. Let it go to zero and the filter takes the measurement outright — also right. And every covariance here is symmetric, the fastest way to catch a dropped transpose."

**What the interviewer learns from the difference:** same seven equations. But the strong answer states the model, gives each term's role as it writes it, names the one place the standard form fails, offers a second form and says what it shows, and closes on three checks. It runs about two minutes — longer than ninety seconds, and rightly so, because this question asks for the whole object, not one fact.
:::

## Check yourself

::: check
Write the predict and update equations from memory. Then say which single assumption about $\mathbf{w}$ and $\mathbf{v}$ real systems break most often, and what you do about it.
:::

::: answer
Predict: $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$ and $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Update: $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$, $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$, $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$, $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$.

The assumption most often broken is **whiteness**. Real sensors carry slowly wandering biases, and real dynamics carry slowly changing unmodeled forces. Neither is uncorrelated from one step to the next. The remedy is to move the offending quantity out of the noise and into the state — estimate the bias, or the drag coefficient, or the leftover acceleration, as an extra state with its own dynamics — rather than inflating $\mathbf{Q}$ or $\mathbf{R}$ to cover for it.
:::

::: check
A prior altitude variance is $P^- = 9\,\mathrm{m^2}$ and a sensor has $\sigma = 1\,\mathrm{m}$. Give the gain, the posterior variance, and the physical reading of the gain. Then repeat with a sensor of $\sigma = 6\,\mathrm{m}$.
:::

::: answer
**Sharp sensor**, $R = 1^2 = 1\,\mathrm{m^2}$:

- $S = 9 + 1 = 10\,\mathrm{m^2}$
- $K = 9/10 = 0.9$
- $P^+ = (1-0.9)\times 9 = 0.9\,\mathrm{m^2}$, a standard deviation of about $0.949\,\mathrm{m}$

That is slightly better than the sensor alone ($1\,\mathrm{m}$), as it must be, since the prior still contributes. The filter accepts $90\%$ of the surprise: the sensor is much sharper than the prior, so it dominates.

**Blunt sensor**, $R = 6^2 = 36\,\mathrm{m^2}$:

- $S = 9 + 36 = 45\,\mathrm{m^2}$
- $K = 9/45 = 0.2$
- $P^+ = 0.8 \times 9 = 7.2\,\mathrm{m^2}$

The filter accepts only a fifth of the surprise, because the measurement is twice as noisy as the prior in standard deviation ($6\,\mathrm{m}$ against $3\,\mathrm{m}$), and the covariance barely improves. Same prior, same equations, opposite behavior — the trust ratio doing its job.
:::

::: check
Why is the covariance update $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ not the form to use in flight software, and what replaces it?
:::

::: answer
Two reasons. It is only valid at the exactly optimal gain. And it is a difference of matrices rather than a sum of positive semi-definite ones, so finite-precision arithmetic can make it asymmetric or even indefinite — at which point the filter is computing with something that is not a covariance, and its behavior is undefined. The replacement is the Joseph form, $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$. It is a sum of two symmetric positive semi-definite terms, so it is symmetric and positive semi-definite by construction. And it is correct for *any* gain — a rounded one, a steady-state one, a deliberately detuned one.
:::

::: check
An interviewer asks what the bracket in the Kalman gain is. Answer in one sentence of algebra and one of physics, and give one practical use of it that is not computing the gain.
:::

::: answer
Algebra: $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ is the covariance of the innovation — the prior state covariance mapped into measurement space, plus the measurement noise covariance. Physics: it is how large a surprise the filter should expect from this measurement, given how unsure it is about the state and how noisy the sensor is. The practical use beyond the gain is **gating**: form the normalized innovation squared, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$, compare it with a **[[chi-squared|chi-squared]]** threshold, and reject the measurement if it fails. That one test keeps a single bad reading from wrecking an otherwise healthy filter, and it uses $\mathbf{S}$ and nothing else.
:::

::: check
You write the gain as $\mathbf{K} = \mathbf{P}^-\mathbf{H}\mathbf{S}^{-1}$ on the board. Catch the error with a dimension check.
:::

::: answer
$\mathbf{P}^-$ is $n\times n$ and $\mathbf{H}$ is $m\times n$. The product $\mathbf{P}^-\mathbf{H}$ needs the inner sizes to match, $n = m$, so it is undefined unless the measurement happens to be the same size as the state. Even when it is defined, it is the wrong object: the gain must be $n\times m$, because it multiplies an $m\times1$ innovation and produces an $n\times1$ state correction. The correct form uses $\mathbf{H}^{\mathsf{T}}$, which is $n\times m$, giving $(n\times n)(n\times m)(m\times m) = n\times m$. The whole check takes five seconds — the reason to write sizes beside the symbols the first time they appear.
:::

## Summary

| Symbol or equation | Meaning |
| --- | --- |
| $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$ | Linear dynamics; $\mathbf{w}\sim\mathcal{N}(\mathbf{0},\mathbf{Q})$, white |
| $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k$ | Linear measurement; $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, white |
| $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$ | Predict the state; zero-mean noise does not move the mean |
| $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ | Carry the uncertainty forward, then add what the model omits |
| $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$ | Innovation: the only new information in the cycle |
| $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ | Innovation covariance; also the basis of measurement gating |
| $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$ | Trust ratio, $n\times m$; scalar case $K = \rho/(1+\rho)$, $\rho = P^-/R$ |
| $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$ | Accept a fraction of the surprise |
| $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$ | Optimal gain only |
| Joseph form | $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$; any gain, numerically safe |
| Information form | $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ |

The next lesson takes the same loop nonlinear: what the extended Kalman filter changes, where its linearization stops being valid, and the specific way an EKF talks itself into confident failure.

::: context kalman-name Who Kalman was, and the first job the filter did
Rudolf Kálmán, a Hungarian-born American engineer, published the filter in 1960. Almost at once, Stanley Schmidt's group at NASA's Ames Research Center saw it could solve the navigation problem for Apollo's trip to the Moon, and worked out how to apply it to nonlinear orbits — the idea behind the extended Kalman filter in the next lesson. A form of the filter flew in the Apollo guidance computer. Today versions of it run in most spacecraft, airliners and phones that navigate, all turning the same loop:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="45" width="130" height="50" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="66" font-size="13" text-anchor="middle" fill="#1f2a44">Predict</text>
  <text x="85" y="83" font-size="11" text-anchor="middle" fill="#1f2a44">P grows</text>
  <rect x="210" y="45" width="130" height="50" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="275" y="66" font-size="13" text-anchor="middle" fill="#1f2a44">Update</text>
  <text x="275" y="83" font-size="11" text-anchor="middle" fill="#1f2a44">P shrinks</text>
  <path d="M85,45 C85,10 275,10 275,40" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="275,45 270,35 280,35" fill="#1f2a44"/>
  <path d="M275,95 C275,130 85,130 85,100" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="85,95 80,105 90,105" fill="#1f2a44"/>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#1d6fd1">measurement z arrives</text>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#6c7a93">next time step</text>
</svg>
```
:::

::: context gaussian The bell curve, and blending two of them
A **Gaussian** (after the mathematician Carl Friedrich Gauss), or normal distribution, is the bell-shaped curve of "how likely is each value". Its middle is the average; its width is the standard deviation $\sigma$ (sigma). Below are the lesson's numbers: a prior guess of $100\,\mathrm{m}$ with $\sigma = 2\,\mathrm{m}$, a reading of $103\,\mathrm{m}$ with $\sigma = 1.5\,\mathrm{m}$, and the blend at $100 + 0.64 \times 3 = 101.92\,\mathrm{m}$ with $\sigma = 1.2\,\mathrm{m}$ — narrower than either.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="20.0,129.3 31.4,128.6 42.9,127.4 54.3,125.2 65.7,121.9 77.1,117.0 88.6,110.5 100.0,102.5 111.4,93.6 122.9,84.7 134.3,77.1 145.7,71.8 157.1,70.0 168.6,71.8 180.0,77.1 191.4,84.7 202.9,93.6 214.3,102.5 225.7,110.5 237.1,117.0 248.6,121.9 260.0,125.2 271.4,127.4 282.9,128.6 294.3,129.3 305.7,129.7 317.1,129.9 328.6,129.9 340.0,130.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="20.0,130.0 88.6,130.0 111.4,129.7 122.9,129.1 134.3,127.7 145.7,124.7 157.1,119.2 168.6,110.1 180.0,97.1 191.4,81.5 202.9,65.9 214.3,54.3 225.7,50.0 237.1,54.3 248.6,65.9 260.0,81.5 271.4,97.1 282.9,110.1 294.3,119.2 305.7,124.7 317.1,127.7 328.6,129.1 340.0,129.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="20.0,130.0 100.0,129.9 111.4,129.5 122.9,128.3 134.3,124.8 145.7,116.9 157.1,102.2 168.6,80.3 180.0,55.5 185.7,44.4 191.4,35.9 197.1,31.0 202.9,30.2 208.6,33.7 214.3,41.0 220.0,51.3 231.4,75.9 242.9,98.7 254.3,114.8 265.7,123.8 277.1,127.9 288.6,129.4 300.0,129.9 340.0,130.0"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44"><text x="111" y="146">98</text><text x="157" y="146">100</text><text x="203" y="146">102</text><text x="249" y="146">104</text></g>
  <text x="80" y="64" font-size="11" text-anchor="middle" fill="#6c7a93">prior, σ 2</text>
  <text x="290" y="46" font-size="11" text-anchor="middle" fill="#1f2a44">reading, σ 1.5</text>
  <text x="203" y="20" font-size="11" text-anchor="middle" fill="#1d6fd1">blend, σ 1.2</text>
</svg>
```
:::

::: context covariance What a covariance matrix holds
**Variance** is the square of the standard deviation — how spread out one uncertain number is. **Covariance** says how two uncertain numbers move together. If an overestimate of speed tends to come with an overestimate of altitude, their covariance is positive. The covariance matrix $\mathbf{P}$ puts the variances on its diagonal and the covariances off it. In this lesson's lander, the altitude variance over the first few cycles goes $4 \to 1.44$ (update), $1.443$ (predict), $0.879$ (update), $0.886$ (predict), $0.635$ (update): a staircase down, with small steps back up each time the filter coasts.
:::

::: context white-noise Why noise is called "white"
White light contains every color in equal amounts. **White noise** contains every frequency in equal amounts, which works out to meaning that its value at one instant tells you nothing about its value at any other. The hiss of an untuned radio is close to white. A slowly drifting sensor bias is the opposite: its value now predicts its value a second from now very well. That kind of noise is sometimes called "colored", and the Kalman filter needs it moved into the state.
:::

::: context blue What "best linear unbiased" means
Engineers shorten it to **BLUE**, said "blue". *Linear* means the estimate is built by adding up the measurements with weights. *Unbiased* means that on average it lands on the truth. *Best* means that among all such estimators, it has the smallest error spread. With Gaussian noise the Kalman filter beats every estimator, linear or not. Without Gaussian noise, a cleverer nonlinear method might do better, but no linear one can.
:::

::: context transpose Flipping a matrix
The **transpose** of a matrix swaps rows and columns: the entry in row 2, column 1 moves to row 1, column 2. A $2\times3$ matrix becomes $3\times2$. In the Kalman filter it appears in pairs, like $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$, and that sandwich is what keeps a covariance symmetric. When you see an unmatched $\mathbf{F}$ on one side, a transpose has probably been dropped.
:::

::: context innovation Why "innovation"
The word means "the new thing". Before the measurement arrives, the filter already predicted what it would read, $\mathbf{H}\hat{\mathbf{x}}^-$. Only the part of the reading that differs from that prediction teaches the filter anything. Some books call it the **residual** or the **measurement residual**. Watching innovations is also how engineers check a filter is healthy: they should look like white noise with covariance $\mathbf{S}$. Lesson 9 turns that into a test called NIS.
:::

::: context psd What "positive semi-definite" guarantees
A covariance matrix must never claim a negative variance — no combination of the states can have a spread less than zero. A symmetric matrix with that property is called **positive semi-definite**. In symbols, $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} \ge 0$ for every vector $\mathbf{a}$. Adding two such matrices gives another one, which is why the Joseph form, a sum, is safe; subtracting, as the short form effectively does, gives no such guarantee.
:::

::: context radar-altimeter How a radar altimeter measures height
A **radar altimeter** sends radio pulses straight down and times the echo from the ground. Height is the speed of light times the round-trip time, divided by two. Landers on the Moon and Mars have used them in the final descent, alongside instruments that measure velocity. Its noise is a meter or so in the example, which is why the filter blends it with a prediction instead of trusting each reading alone.
:::

::: context psd-q What the "q" in the process noise means
$q$ is a **power spectral density**: how strong a random, jittery acceleration is, spread over frequency. Its units, $\mathrm{m^2/s^3}$, look odd until you see that $q\,\Delta t$ is the variance added to the velocity over a step: $\mathrm{m^2/s^3} \times \mathrm{s} = \mathrm{m^2/s^2}$. That is the $0.5 \times 0.1 = 0.05$ in the bottom-right corner of $\mathbf{Q}$. The other entries come from that random velocity spreading into position over the step.
:::

::: context chi-squared The chi-squared test, in one idea
Chi is the Greek letter $\chi$, said "kai". If a filter is healthy, the number $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$ follows a known spread called the chi-squared distribution, with an average equal to the measurement's size $m$. So you can set a threshold that a healthy filter exceeds only rarely — say one time in a hundred — and treat anything above it as a bad reading. Lesson 9 builds the full consistency tests, NEES and NIS, on the same idea.
:::
