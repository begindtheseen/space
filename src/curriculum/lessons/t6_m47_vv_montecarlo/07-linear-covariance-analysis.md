---
id: l07-linear-covariance-analysis
title: Linear covariance analysis, and where it breaks
minutes: 19
covers:
  - 'Linear covariance analysis as the fast complement: one run gives the covariance a thousand runs would estimate'
  - Where LinCov is valid and where nonlinearity, saturation and discrete logic force you back to Monte Carlo
---

Shine a flashlight at a wall. The spot is small up close and wider far away. You do not need to follow every particle of light to know how wide the spot will be. The beam spreads in a predictable way, so you can work out the spot size with one calculation.

Every **[[Monte Carlo|monte-carlo-name]]** campaign in this module has done the opposite. It flew thousands of separate trajectories, each with its own random inputs, and then measured how spread out the answers were. That is like tracking ten thousand particles of light one at a time. It works, but it is slow.

There is a cheaper way, when the system earns it. Instead of flying many trajectories and measuring their spread afterward, you carry the *spread itself* forward through the flight, in a single pass. This is **linear covariance analysis**, or **LinCov** for short — pushing the covariance (the size and shape of the spread) through a straight-line model of the vehicle. It is fast enough to run inside a design loop. A parameter sweep that takes an afternoon by Monte Carlo takes seconds by LinCov.

The speed has a price. LinCov rests on one assumption, and nothing warns you when that assumption breaks. In this lesson you will derive the method, check with real numbers that it matches a full campaign when its assumption holds, and then break the assumption on purpose — by adding one actuator limit to an otherwise identical system — to see exactly what happens to the answer, and by how much.

## Carrying the spread forward

Start with one number. Suppose $x$ is a random error with variance $\operatorname{Var}(x)$, and you multiply it by a fixed number $a$. Every error gets $a$ times bigger, so the spread gets $a$ times wider. Variance measures spread *squared*, so it grows by $a^2$:

$$
\operatorname{Var}(a x) = a^2 \operatorname{Var}(x).
$$

Now the same idea for a list of errors at once. Let $\mathbf{x}$ be a random vector — say, an attitude error and a rate error stacked together. Its spread is described by its **[[covariance matrix|covariance-ellipse]]** $\mathbf{P}$: the variances of each error sit on the diagonal, and the covariances (how much two errors move together) sit off the diagonal. If $\mathbf{y} = \mathbf{A}\mathbf{x}$ for a fixed matrix $\mathbf{A}$, then

$$
\operatorname{Cov}(\mathbf{y}) = \mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}.
$$

Read $\mathbf{A}^{\mathsf{T}}$ as "A transpose": the matrix flipped over its diagonal, rows turned into columns. This is the **[[sandwich rule|sandwich-rule]]** from the probability and statistics module — $\mathbf{P}$ is the filling, with $\mathbf{A}$ on one side and $\mathbf{A}^{\mathsf{T}}$ on the other. For a $1 \times 1$ "matrix" it is exactly $a^2\operatorname{Var}(x)$ again.

Here is where the vehicle comes in. Pick a **reference trajectory** — the planned, error-free flight. A vehicle's small errors away from it can be linearized: over one time step, the new error state is a fixed matrix times the old one. That matrix is the **[[state transition matrix|state-transition]]** $\mathbf{\Phi}$, read "phi". On top of that, each step adds some fresh random disturbance, the **process noise**, with covariance $\mathbf{Q}$. Apply the sandwich rule once per step and add the fresh noise:

$$
\mathbf{P} \leftarrow \mathbf{\Phi}\,\mathbf{P}\,\mathbf{\Phi}^{\mathsf{T}} + \mathbf{Q}.
$$

Read the arrow as "is replaced by": the new $\mathbf{P}$ is the old one, sandwiched by $\mathbf{\Phi}$, plus $\mathbf{Q}$. You met this recursion in the Kalman filter module, as the prediction step with no measurement update. Here there is no update at all, because nothing is being estimated. The vehicle itself, not an onboard filter, is what is being dispersed.

Run this once per time step along the reference trajectory, starting from the initial dispersion covariance $\mathbf{P}_0$ ("P zero"). The final $\mathbf{P}$ is the covariance that a Monte Carlo campaign of any size would only estimate — approximately, and only after flying every one of its trajectories.

There is an even shorter special case. If no process noise enters during the interval ($\mathbf{Q} = 0$), the steps chain together into one matrix, $\mathbf{\Phi}_{\mathrm{total}}$, that carries an error from start to end. Then the whole recursion collapses to a single sandwich:

$$
\mathbf{P}_{\mathrm{final}} = \mathbf{\Phi}_{\mathrm{total}}\mathbf{P}_0\mathbf{\Phi}_{\mathrm{total}}^{\mathsf{T}}.
$$

One piece of linear algebra stands in for the whole campaign. The first example uses this case, to make the comparison as direct as possible.

::: key
Linear covariance analysis: $\mathbf{P} \leftarrow \mathbf{\Phi}\mathbf{P}\mathbf{\Phi}^{\mathsf{T}} + \mathbf{Q}$, propagated through the linearized closed-loop system. One run gives the covariance a Monte Carlo campaign estimates with thousands of trajectories. Valid while deviations stay small enough for the linearization to hold and the driving uncertainties stay Gaussian; it breaks at saturations, deadbands and mode logic — exactly in the tail, which is usually where the answer matters most.
:::

::: note Why the sandwich rule has to be true
Take the mean of $\mathbf{x}$ to be zero (shift it if not; shifting does not change spread). Then $\mathbf{P} = E[\mathbf{x}\mathbf{x}^{\mathsf{T}}]$, where $E[\cdot]$, read "the expected value of", is the average over all possible draws. For $\mathbf{y} = \mathbf{A}\mathbf{x}$, the mean is also zero, and

$$
\operatorname{Cov}(\mathbf{y}) = E[\mathbf{y}\mathbf{y}^{\mathsf{T}}] = E[\mathbf{A}\mathbf{x}\mathbf{x}^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}] = \mathbf{A}\,E[\mathbf{x}\mathbf{x}^{\mathsf{T}}]\,\mathbf{A}^{\mathsf{T}} = \mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}.
$$

The second step uses $(\mathbf{A}\mathbf{x})^{\mathsf{T}} = \mathbf{x}^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}$. The third step pulls the fixed matrices out of the average, which is allowed because averaging is linear. Adding independent noise $\mathbf{w}$ with covariance $\mathbf{Q}$ adds $\mathbf{Q}$, because the cross terms $E[\mathbf{A}\mathbf{x}\mathbf{w}^{\mathsf{T}}]$ average to zero.

Notice what the proof did *not* use: it never assumed $\mathbf{x}$ was Gaussian. For a truly linear system, the propagated covariance is exact for any input shape. Gaussian inputs matter for a different reason — only then does the covariance tell you the whole shape, including the tail. The next lesson is about exactly that gap.
:::

::: example One run against ten thousand: an attitude error over a coast
A spacecraft starts a $T = 20\,\mathrm{s}$ coast with an attitude error $\theta_0$ ("theta zero") and a rate error $\omega_0$ ("omega zero"). Both are dispersed as Gaussian, with $\sigma_\theta = 0.4^\circ$ and $\sigma_\omega = 0.05^\circ/\mathrm{s}$. They share a calibration source, so they are correlated with $\rho = 0.25$ ($\rho$ is "rho"), in the spirit of the correlated-dispersions lesson.

**Build $\mathbf{P}_0$.** The diagonal holds the variances: $0.4^2 = 0.16\,\mathrm{deg^2}$ and $0.05^2 = 0.0025\,\mathrm{deg^2/s^2}$. The off-diagonal holds $\rho\sigma_\theta\sigma_\omega = 0.25 \times 0.4 \times 0.05 = 0.005\,\mathrm{deg^2/s}$:

$$
\mathbf{P}_0 = \begin{pmatrix} 0.16 & 0.005 \\ 0.005 & 0.0025 \end{pmatrix}\ (\text{deg}^2,\ \text{deg}^2/\text{s},\ \text{deg}^2/\text{s}^2).
$$

**The map.** With no correction, the attitude error at the end of the coast is the old error plus rate times time: $y = \theta_0 + T\omega_0$. That is one row vector, $\mathbf{h}^{\mathsf{T}} = (1,\ T)$, applied once — the one-shot special case.

**The sandwich.** Multiply it out: $\mathbf{h}^{\mathsf{T}}\mathbf{P}_0\mathbf{h} = P_{11} + 2T P_{12} + T^2 P_{22}$. So

$$
\operatorname{Var}(y) = 0.16 + 400(0.0025) + 2(20)(0.005) = 0.16 + 1.00 + 0.20 = 1.360\ \mathrm{deg}^2,
$$

and $\sigma_y = \sqrt{1.360} = 1.1662^\circ$. The rate error, stretched over $20\,\mathrm{s}$, is the biggest piece. The positive correlation adds a bit more.

**The campaign.** Now fly $N = 10{,}000$ trajectories. Each draws $(\theta_0, \omega_0)$ from $\mathbf{P}_0$ using the **[[Cholesky factor|cholesky]]** construction from the probability module, with seed $47472$ so the figure reproduces. The sample variance comes out at $1.3422\,\mathrm{deg}^2$, which is $1.31\%$ below the analytic value.

**Is that close enough?** A variance estimated from $N$ Gaussian draws has a **[[sampling scatter|variance-scatter]]** of about $\pm\sqrt{2/(N-1)}$ as a fraction, one standard deviation. For $N = 10{,}000$ that is $\pm 1.41\%$. The gap of $-1.31\%$ sits inside it. One matrix product and a ten-thousand-run campaign report the same physical quantity, to within the accuracy the campaign itself can reach. That is LinCov's claim, confirmed rather than assumed.

```python
import numpy as np

sigma_th, sigma_w, rho, T = 0.4, 0.05, 0.25, 20.0
P0 = np.array([[sigma_th**2, rho*sigma_th*sigma_w],
               [rho*sigma_th*sigma_w, sigma_w**2]])
h = np.array([1.0, T])
var_analytic = h @ P0 @ h                                  # 1.360

rng = np.random.default_rng(47472)
L = np.linalg.cholesky(P0)
X = rng.standard_normal((10_000, 2)) @ L.T
var_mc = np.var(X @ h, ddof=1)                              # 1.3422
print(var_analytic, var_mc, (var_mc - var_analytic) / var_analytic)
# 1.3600000000000003 1.3422321367655612 -0.013064605319440533
```
:::

## Adding one saturation

Think of a car's steering wheel. Turn it a little and the car turns a little. Turn it twice as far and the car turns twice as sharply. But the wheel hits a stop. Past that point, turning harder does nothing. That stop is a **saturation**: an output that follows its input up to a limit and then stays pinned at the limit.

Now give the spacecraft a small trim actuator that tries to cancel the coasted attitude error. It commands a correction $c = k y$ with gain $k = 0.7$ — it tries to remove $70\%$ of the error. But the actuator can deliver at most $\pm L$ degrees of correction. So the correction actually applied is $\operatorname{sat}(ky, \pm L)$, read "k y, saturated at plus or minus L". The **residual** — the error left over — is

$$
z = y - \operatorname{sat}(ky, \pm L).
$$

This is one realistic **nonlinearity** (a response that is not a straight line). Every real trim thruster, reaction wheel and thrust-vector-control channel has a limit like this. Nothing else about the system changed.

**What LinCov sees.** LinCov linearizes the actuator at the reference point, where the error is zero and the actuator is far from its limit. Near zero the correction is exactly $ky$, so $z = y - ky = (1-k)y$: a fixed gain of $1 - 0.7 = 0.3$. The sandwich rule for a single number gives

$$
\operatorname{Var}(z)_{\mathrm{LinCov}} = (1-k)^2\operatorname{Var}(y) = 0.09 \times 1.360 = 0.1224\,\mathrm{deg}^2.
$$

This number never changes as $L$ changes. The linearization is the **[[tangent line|saturation-tangent]]** to the actuator's response at zero, and a tangent line has no bend in it. LinCov never even reads the value of $L$.

::: example The two answers pulling apart as the limit tightens
Simulate the true, saturating system directly. Use the same $10{,}000$ draws of $(\theta_0,\omega_0)$ as the first example, and try several limits $L$.

When does the actuator saturate? When $|0.7\,y| > L$, that is, when $|y| > L/0.7$. At $L = 1.0^\circ$ that threshold is $1.43^\circ$, only about $1.2$ standard deviations of $y$ — so roughly one case in five saturates. At $L = 3.0^\circ$ the threshold is $4.29^\circ$, about $3.7$ standard deviations, which almost never happens.

| $L$ (deg) | $P(\text{saturates})$ | $\operatorname{Var}(z)$, true (MC) | $\operatorname{Var}(z)$, LinCov | Gap in variance | Gap in $\sigma$ |
| --- | --- | --- | --- | --- | --- |
| $3.0$ | $0.03\%$ | $0.1209$ | $0.1224$ | $-1.2\%$ | $-0.6\%$ |
| $2.0$ | $1.35\%$ | $0.1298$ | $0.1224$ | $+6.1\%$ | $+3.0\%$ |
| $1.5$ | $6.36\%$ | $0.1677$ | $0.1224$ | $+37.0\%$ | $+17.1\%$ |
| $1.0$ | $21.59\%$ | $0.3011$ | $0.1224$ | $+146.0\%$ | $+56.8\%$ |
| $0.7$ | $38.54\%$ | $0.4722$ | $0.1224$ | $+285.8\%$ | $+96.4\%$ |

**Read the top row.** At $L = 3.0^\circ$ the actuator saturates in three cases out of ten thousand. LinCov and the true system agree to within the same sampling noise as the first example. The actuator almost never leaves its straight-line range, so ignoring the limit costs nothing.

**Read down the table.** As the limit tightens, the true residual grows fast. The LinCov prediction does not move at all. By $L = 1.0^\circ$, where more than one case in five saturates, the true variance is $0.3011 / 0.1224 = 2.46$ times the LinCov variance. The true standard deviation is $\sqrt{2.46} = 1.57$ times what LinCov reports — LinCov's $\sigma$ is less than two thirds of the real one.

**Which way is the error?** When the actuator saturates, it delivers *less* correction than the straight-line law asks for. So on those cases the residual is bigger than LinCov assumes. And the cases that saturate are exactly the large-$|y|$ ones, which carry most of the variance, because variance squares each distance. So even a modest saturating fraction moves the variance a lot. LinCov's error here is not random noise that could go either way. It is one-sided and **[[non-conservative|non-conservative]]**: it understates the true dispersion whenever the actuator's authority is not comfortably bigger than what the unsaturated law would ask for.
:::

::: warning A LinCov result gives no sign that it has become wrong
The most dangerous thing about this failure is that the LinCov output looks the same when it is wrong. At $L = 3.0^\circ$ it is a clean, precise-looking covariance. At $L = 0.7^\circ$ it is an equally clean, equally precise-looking covariance — and it is off by nearly a factor of four in variance. Nothing in the number, or in how it was computed, raises a flag. The check has to come from outside the LinCov run: either a nonlinear simulation of the real saturating system, or an explicit comparison of how big the unsaturated command would get against the actuator's real limit.
:::

## When LinCov may stand in for Monte Carlo

Now turn the actuator example into a general rule. LinCov is valid when every piece between the dispersed inputs and the output you care about — dynamics, sensors and control law alike — is well described by its straight-line approximation across the whole range of deviations the dispersion set actually produces. It also needs the driving uncertainties to be Gaussian, because a covariance fully describes a Gaussian and nothing else.

Each of these breaks that condition, and each is ordinary hardware or software, not an exotic edge case:

- **Saturation** of an actuator or a sensor, as in the example.
- A **[[deadband|deadband]]** — a zone near zero where the controller deliberately does nothing, so small errors get no response at all.
- A **discrete mode switch**, or an **[[FDIR|fdir]]** trip, that changes which control law is running once an error crosses a threshold.
- A dispersed input that is not Gaussian, such as a **[[lognormal|lognormal]]** density or drag coefficient. Even pushed through a perfectly linear model, it gives a non-Gaussian output that a covariance alone does not fully describe.

A question about the **tail** of a distribution is a separate reason to be careful, even where the average behavior linearizes well. A covariance is a statement about spread, not shape. The next lesson is entirely about how far those two can differ.

The professional pattern is to use both methods, each for what it does best:

- **LinCov for design iteration.** Its speed lets a parameter sweep or a sensitivity study run in seconds. It is also a standing sanity check: if a full Monte Carlo campaign's sample covariance is not near the LinCov answer, something in one of the two pipelines is wrong, and you want to know before trusting the campaign's tail numbers.
- **Monte Carlo for the verification claim itself**, whenever the system contains any of the nonlinearities above. On a real vehicle with real actuators and real mode logic, that is nearly always.

## Check yourself

::: check
Starting from the sandwich rule for a linear map, show that the unsaturated correction $z = y - ky$ has $\operatorname{Var}(z) = (1-k)^2\operatorname{Var}(y)$.
:::

::: answer
First collect the terms: $z = y - ky = (1-k)y$. That is a linear map with a single fixed coefficient $(1-k)$ applied to the random number $y$. The sandwich rule is $\operatorname{Cov}(\mathbf{A}\mathbf{x}) = \mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$. With a $1 \times 1$ "matrix" $A = (1-k)$ and $P = \operatorname{Var}(y)$, the transpose of a single number is itself, so the sandwich becomes $(1-k)\operatorname{Var}(y)(1-k) = (1-k)^2\operatorname{Var}(y)$. With $k = 0.7$ that is $0.09\operatorname{Var}(y)$.
:::

::: check
At $L = 1.5^\circ$ in the worked example, the true variance is $37.0\%$ above the LinCov prediction, yet only $6.36\%$ of cases saturate. Why does such a small saturating fraction open such a large gap?
:::

::: answer
Variance squares each distance from the mean, so the biggest deviations count far more than the small ones. The cases that saturate are exactly the ones with the largest $|y|$ — the ones already contributing most of the variance. On precisely those cases the actuator under-corrects, leaving a residual bigger than $(1-k)y$. So a saturating fraction that looks small as a percentage of cases removes a large share of the correction's variance-reducing effect.
:::

::: check
State when LinCov may substitute for Monte Carlo, and name at least three specific mechanisms that break that condition.
:::

::: answer
LinCov may substitute when the whole path from dispersed inputs to the output of interest — dynamics, sensors and control together — is well approximated by its linearization across the range of deviations the dispersion set produces, and the driving inputs are Gaussian. Mechanisms that break this: actuator or sensor saturation; a control deadband; a discrete mode switch or FDIR trip that changes the active control law; and a non-Gaussian dispersed input, such as a lognormal density or drag coefficient.
:::

::: check
In the worked example, why does the LinCov prediction stay exactly the same as the actuator limit $L$ tightens, while the true system changes sharply?
:::

::: answer
LinCov propagates the covariance through the linearization of the system about the reference point. For a saturating actuator, that linearization is its tangent line at zero error: a fixed gain, here $(1-k)$. A tangent line runs straight forever; it has no idea where the real curve bends. So the LinCov calculation never uses the value of $L$ at all. Every effect of the limit happens away from the reference point, where LinCov never looks — it only examines the system infinitesimally close to the reference trajectory.
:::

::: check
A team uses LinCov alone for an entire design cycle, including the final verification report. The vehicle's attitude controller has a rate-limited actuator and a discrete safe-mode switch that triggers above a fixed error threshold. Evaluate this choice.
:::

::: answer
For design iteration it is a good choice: LinCov's speed is exactly what rapid parameter sweeps need. For the final verification report it is not defensible. A rate limit and a threshold-triggered mode switch are exactly the mechanisms that break LinCov's linearity assumption. A verification claim built only on LinCov would be blind to what those two do to the true dispersion — the same way the worked example's saturation made LinCov understate the variance by more than a factor of two. The right practice: LinCov for iteration, and a full Monte Carlo campaign, with the rate limit and the mode switch coded exactly as they fly, carrying the verification claim.
:::

## Summary

| Item | Statement |
| --- | --- |
| Covariance recursion | $\mathbf{P} \leftarrow \mathbf{\Phi}\mathbf{P}\mathbf{\Phi}^{\mathsf{T}}+\mathbf{Q}$; one-shot case $\mathbf{P}_{\mathrm{final}} = \mathbf{\Phi}_{\mathrm{total}}\mathbf{P}_0\mathbf{\Phi}_{\mathrm{total}}^{\mathsf{T}}$ when $\mathbf{Q}=0$ over the interval |
| Baseline agreement | Analytic $\operatorname{Var}(y)=1.360\,\mathrm{deg}^2$ vs. $10{,}000$-run MC $1.3422\,\mathrm{deg}^2$ ($-1.31\%$, inside the $\pm1.41\%$ sampling scatter) |
| Saturation gap | LinCov fixed at $0.1224\,\mathrm{deg}^2$ whatever $L$ is; true variance is $2.46\times$ that by $L=1.0^\circ$ ($21.6\%$ saturating) |
| Direction of the error | Non-conservative: a saturating actuator under-corrects the large cases that dominate the variance, so LinCov understates the true dispersion |
| Validity condition | Whole path (dynamics, sensors, control) well linearized across the dispersion's range, and Gaussian inputs |
| Breaking mechanisms | Saturation, deadbands, discrete mode switches and FDIR trips, non-Gaussian inputs, tail questions |
| Professional pattern | LinCov for design iteration and as a sanity check on the Monte Carlo covariance; Monte Carlo for the verification claim |

LinCov's blind spot — a covariance says nothing about shape — deserves its own lesson. Even where LinCov is fully valid and Monte Carlo confirms it, the covariance alone can mislead about how far into the tail a given multiple of sigma really reaches. That is the next lesson.

::: context monte-carlo-name A method named after a casino
The Monte Carlo method was developed at Los Alamos in the late 1940s by Stanislaw Ulam and John von Neumann, and Nicholas Metropolis suggested the name — after the famous casino in Monaco, because the method runs on random chance the way a roulette wheel does. The idea: when a problem is too tangled to solve with a formula, play it out many times with random inputs and count what happens. LinCov goes back the other way — it finds a formula for the one quantity (the spread) that the random games were estimating.
:::

::: context covariance-ellipse A covariance is an ellipse
Plot thousands of $(\theta_0, \omega_0)$ pairs and they form a tilted, egg-shaped cloud. The covariance matrix describes the ellipse that outlines it: the diagonal entries set how wide it is along each axis, and the off-diagonal entry sets how much it tilts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="330" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="185" y1="180" x2="185" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="320" y="112" font-size="12" fill="#1f2a44">θ₀</text>
  <text x="192" y="20" font-size="12" fill="#1f2a44">ω₀</text>
  <ellipse cx="185" cy="95" rx="110" ry="42" transform="rotate(-25 185 95)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="185" y1="95" x2="284.7" y2="48.5" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="40" font-size="11" fill="#b4232c">tilt: correlation</text>
  <text x="20" y="160" font-size="11" fill="#6c7a93">width along each axis:</text>
  <text x="20" y="174" font-size="11" fill="#6c7a93">the variances</text>
</svg>
```

LinCov carries this ellipse forward in time, stretching and turning it, instead of carrying every dot.
:::

::: context sandwich-rule The sandwich rule, told another way
Scale a single error by $3$ and its standard deviation triples, so its variance goes up nine times. With several errors, a matrix can stretch one direction, shrink another, and mix them together. The sandwich $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ is the bookkeeping that tracks all of that at once: one $\mathbf{A}$ for each of the two factors in "error times error", which is why $\mathbf{A}$ appears twice. For a single number it shrinks back to "scale factor squared times variance".
:::

::: context state-transition What the Φ matrix does
The state transition matrix answers one question: "if the vehicle is off by this much now, how much will it be off one step later, if nothing else happens?" For the coasting spacecraft, the attitude error one step later is the old attitude error plus rate times the step length, and the rate error stays the same:

$$
\mathbf{\Phi} = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}.
$$

Chain twenty one-second steps and you get $\Delta t = 20$ in the corner — the $(1,\ T)$ row used in the worked example. For a real vehicle, $\mathbf{\Phi}$ comes from linearizing the full equations of motion and the control law along the reference trajectory.
:::

::: context cholesky Drawing correlated samples
A computer's random generator gives independent, unit-variance numbers. To make samples with a chosen covariance $\mathbf{P}$, factor it as $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, where $\mathbf{L}$ is lower triangular (zeros above the diagonal). That factor is the **Cholesky factor**, named after André-Louis Cholesky, a French army surveyor who devised it around 1910. Multiply each independent pair by $\mathbf{L}$ and, by the sandwich rule, the result has covariance $\mathbf{L}\mathbf{I}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$. That is the line `X = ... @ L.T` in the code.
:::

::: context variance-scatter Why a sample variance wobbles by √(2/(N−1))
A campaign never measures the true variance, only an estimate of it from $N$ cases. Run the same campaign again with new seeds and the estimate comes out slightly different. For Gaussian data, the estimate's own standard deviation, as a fraction of the true variance, is $\sqrt{2/(N-1)}$. With $10{,}000$ runs that is about $1.4\%$; with $100$ runs it is about $14\%$. So a gap between LinCov and Monte Carlo only means something when it is clearly bigger than this scatter.
:::

::: context saturation-tangent The curve and its tangent
The residual $z$ plotted against the coasted error $y$. Near zero the real curve (blue) and LinCov's tangent line (red, slope $0.3$) are the same. Past the saturation point $|y| = L/k$ the real curve bends up to slope $1$: every extra degree of error is left uncorrected.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 214" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="107" x2="340" y2="107" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="210" x2="180" y2="4" stroke="#6c7a93" stroke-width="1"/>
  <text x="332" y="124" font-size="12" fill="#1f2a44">y</text>
  <text x="186" y="16" font-size="12" fill="#1f2a44">z</text>
  <line x1="40" y1="149" x2="320" y2="65" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline points="40,207 122.9,124.1 237.1,89.9 320,7" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="237.1" y1="101" x2="237.1" y2="113" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="122.9" y1="101" x2="122.9" y2="113" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="237" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">L/k</text>
  <text x="123" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">−L/k</text>
  <text x="290" y="92" font-size="11" fill="#b4232c">LinCov</text>
  <text x="196" y="40" font-size="11" fill="#1d6fd1">true, slope 1</text>
  <text x="200" y="200" font-size="11" fill="#6c7a93">drawn for k = 0.7, L = 1°</text>
</svg>
```

The tangent is excellent near the middle and wrong exactly out where the big errors live.
:::

::: context non-conservative What "conservative" means to an engineer
An estimate is **conservative** when its error points the safe way — it makes things look a little worse than they are, so a design built on it has extra margin. It is **non-conservative** (or optimistic) when it makes things look better than they are. Engineers accept conservative errors routinely and fight non-conservative ones hard, because a design sized to an optimistic number has less margin than its paperwork claims. LinCov with an unmodeled saturation errs the dangerous way.
:::

::: context deadband Why controllers ignore small errors on purpose
Attitude thrusters fire in pulses, and every pulse spends propellant. If the controller answered every tiny error, it would chatter back and forth forever and drain its tanks. So many spacecraft controllers use a **deadband**: while the error stays inside, say, $\pm 0.5^\circ$, nothing fires. Outside it, the thrusters act. Inside the band the response is flat; outside it is steep — a kink that no single straight line can describe.
:::

::: context fdir Fault detection, isolation and recovery
**FDIR** stands for fault detection, isolation and recovery: the on-board logic that notices something has gone wrong, works out which part failed, and switches to a safe configuration — a backup sensor, a different control law, or a "safe mode" that points the solar panels at the Sun and waits for help from the ground. An FDIR trip is a yes-or-no decision at a threshold. On one side of it the vehicle runs one set of equations; on the other, a completely different set. No linearization can span that jump.
:::

::: context lognormal Quantities that cannot go negative
A **lognormal** quantity is one whose logarithm is Gaussian. It is always positive and leans to the right: most values cluster near the middle, with a longer tail of large ones. Atmospheric density factors and drag coefficients are often modeled this way, because they cannot be negative and their errors act by multiplying, not adding. Push a lognormal input through even a perfectly linear model and the output leans the same way — a shape a covariance alone cannot describe. The next lesson shows how much that lean matters.
:::
