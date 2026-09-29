---
id: l05-maximum-a-posteriori-estimation
title: Maximum a posteriori estimation
minutes: 20
covers:
  - Maximum a posteriori estimation
---

You are on a road trip. You filled the tank this morning and have driven about 200 km, so from memory you think the tank is roughly half full. Then you glance at the fuel gauge, and its needle bounces over every bump: right now it says a third. What do you believe? Not only your memory, and not only the jumpy needle. You blend them, leaning toward whichever you trust more. If the gauge is famously unreliable, you lean toward your memory. If you are unsure how far you drove, you lean toward the gauge.

Every estimator so far in this module started from nothing. Before the data arrived, $\mathbf{x}$ could have been anything. Real problems almost never look like that. A batch orbit determination carries a state and covariance from the previous solution. A calibration knows the sensor left the factory within its spec. A landing site is known to within a kilometer from the map before a single range is taken. **Maximum a posteriori (MAP) estimation** is the rule for blending a belief like that — a **prior**, meaning what you believed before the new data — with new measurements, using Bayes' theorem from the probability module.

The answer looks almost the same as weighted least squares (WLS). That is the point. MAP is what WLS becomes once you drop the "no prior information" assumption. Seeing exactly how it changes shows what a prior buys you and what it costs.

## From likelihood to posterior

Keep the measurement model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, with Gaussian noise $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$. Now add a prior. Before seeing $\mathbf{y}$, treat $\mathbf{x}$ itself as Gaussian:

$$
\mathbf{x}\sim\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0),
$$

independent of the noise $\mathbf{v}$. Read $\mathbf{x}_0$ ("x naught") as your best guess before the data, and $\mathbf{P}_0$ ("P naught") as how unsure you are about it. A big $\mathbf{P}_0$ means "I barely know"; a small one means "I am confident".

**[[Bayes' theorem|bayes]]** turns the prior and the likelihood into the **posterior**, the belief about $\mathbf{x}$ *after* seeing the data:

$$
p(\mathbf{x}\mid\mathbf{y}) = \frac{p(\mathbf{y}\mid\mathbf{x})\,p(\mathbf{x})}{p(\mathbf{y})} \;\propto\; p(\mathbf{y}\mid\mathbf{x})\,p(\mathbf{x}).
$$

Read $p(\mathbf{x}\mid\mathbf{y})$ as "the probability of x given y". The symbol $\propto$ means "is proportional to". We may drop $p(\mathbf{y})$ because it does not depend on $\mathbf{x}$, so it cannot move the peak. MAP picks the $\mathbf{x}$ at the top of the posterior: the single most probable value, given everything you know, prior included. The words **[[a posteriori|latin-names]]** mean "from what comes after" — after the data.

Now find that peak. As in the last lesson, take $-\log$ of both Gaussians. Each one turns into a squared distance measured in its own sigmas, plus constants. Drop every term without $\mathbf{x}$ in it:

$$
J_{\mathrm{MAP}}(\mathbf{x}) = \tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) \;+\; \tfrac12(\mathbf{x}-\mathbf{x}_0)^\mathsf{T}\mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0).
$$

The first term is the ordinary WLS cost: "stay close to the data". The second is new: "stay close to what you believed before". It pulls $\mathbf{x}$ toward $\mathbf{x}_0$, harder when $\mathbf{P}_0$ is small.

To find the lowest point, set the gradient (the vector of slopes) to zero. The first term's gradient is the WLS one from lesson two. The second term's gradient is $\mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0)$, by the same rule. So

$$
-\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0) = \mathbf{0}.
$$

Multiply out the brackets and move every term with $\mathbf{x}$ to the left:

$$
\left(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\right)\hat{\mathbf{x}} = \mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}.
$$

Multiply both sides by the inverse of the bracket:

$$
\hat{\mathbf{x}}_{\mathrm{MAP}} = \left(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\right)^{-1}\left(\mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}\right) .
$$

Read this in words. The bracket on the left is the prior information $\mathbf{P}_0^{-1}$ plus the measurement information $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$. **[[Information adds|information-adds]].** The bracket on the right is what the prior says and what the data say, each weighted by its own information. The inverse of the total information is the posterior covariance,

$$
\mathbf{P} = \left(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\right)^{-1},
$$

so the estimate can also be written $\hat{\mathbf{x}}_{\mathrm{MAP}} = \mathbf{P}\left(\mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}\right)$.

::: key MAP estimate with a Gaussian prior
$\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$. Information adds: prior information $\mathbf{P}_0^{-1}$ plus measurement information $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ gives the posterior information. The estimate is the information-weighted blend of what the prior says and what the data say.
:::

## The prior is one more measurement

Here is a way to see MAP that makes it feel familiar. Pretend your prior guess $\mathbf{x}_0$ is a reading from one more sensor — a sensor that measures $\mathbf{x}$ directly, with noise covariance $\mathbf{P}_0$. Stack it under the real data. This builds an **augmented** problem, meaning one made bigger by adding rows:

$$
\tilde{\mathbf{y}} = \begin{pmatrix}\mathbf{y}\\ \mathbf{x}_0\end{pmatrix}, \qquad
\tilde{\mathbf{H}} = \begin{pmatrix}\mathbf{H}\\ \mathbf{I}\end{pmatrix}, \qquad
\tilde{\mathbf{R}} = \begin{pmatrix}\mathbf{R} & \mathbf{0}\\ \mathbf{0} & \mathbf{P}_0\end{pmatrix} .
$$

The tilde ($\sim$ on top) marks the stacked versions. The $\mathbf{I}$ says the pretend sensor reads $\mathbf{x}$ itself. The zeros in $\tilde{\mathbf{R}}$ say its noise is independent of the real sensors' noise.

Now run ordinary WLS on the stacked problem: $(\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{H}})^{-1}\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{y}}$. It gives exactly $\hat{\mathbf{x}}_{\mathrm{MAP}}$. So a prior is not a different kind of object from a measurement. It is a measurement of $\mathbf{x}$ taken before the instrument was switched on. Everything this module has built for combining measurements — the sandwich formula, the adding of information, Gauss-Markov — applies to it unchanged.

::: note Why it has to be true
Multiply the blocks out. Because $\tilde{\mathbf{R}}$ is block-diagonal, its inverse is too: $\tilde{\mathbf{R}}^{-1}=\begin{pmatrix}\mathbf{R}^{-1} & \mathbf{0}\\ \mathbf{0} & \mathbf{P}_0^{-1}\end{pmatrix}$. Then

$$
\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{H}} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H} + \mathbf{I}\,\mathbf{P}_0^{-1}\mathbf{I} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}_0^{-1},
$$

$$
\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{R}}^{-1}\tilde{\mathbf{y}} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} + \mathbf{P}_0^{-1}\mathbf{x}_0 .
$$

Each block row of $\tilde{\mathbf{H}}$ contributes its own term, and the terms add. These are exactly the two brackets in the MAP formula, so the stacked WLS answer and $\hat{\mathbf{x}}_{\mathrm{MAP}}$ are the same vector — not an approximation of it.
:::

::: example A propellant estimate, two ways
Adding up the mass flow over the mission gives a prior estimate of the propellant left: $x_0=100\,\mathrm{kg}$ with $\sigma_0=15\,\mathrm{kg}$, so $P_0=225\,\mathrm{kg^2}$. Then a gauge reading arrives: $y=80\,\mathrm{kg}$ with $\sigma_y=25\,\mathrm{kg}$, so $R=625\,\mathrm{kg^2}$.

**By hand.** Everything is a single number, so the matrices become fractions. The information from each source is one over its variance: $1/225 = 0.004444$ and $1/625 = 0.0016\,\mathrm{kg^{-2}}$. They add to $0.006044\,\mathrm{kg^{-2}}$. The estimate is the information-weighted average:

$$
\hat x_{\mathrm{MAP}} = \frac{100/225 + 80/625}{0.006044} = \frac{0.4444 + 0.128}{0.006044} = 94.71\,\mathrm{kg}.
$$

The posterior sigma is $1/\sqrt{0.006044} = 12.86\,\mathrm{kg}$.

**By computer, both routes:**

```python
import numpy as np

x0, sigma0, y, sigma_y = 100.0, 15.0, 80.0, 25.0
P0, R = sigma0**2, sigma_y**2

Lambda_post = 1/P0 + 1/R
x_map = (1/Lambda_post) * (x0/P0 + y/R)

H_aug, R_aug = np.array([[1.0], [1.0]]), np.diag([R, P0])
x_aug = np.linalg.solve(H_aug.T @ np.linalg.inv(R_aug) @ H_aug,
                        H_aug.T @ np.linalg.inv(R_aug) @ np.array([y, x0]))[0]

print(f"direct MAP formula: {x_map:.4f} kg   augmented WLS: {x_aug:.4f} kg")
print(f"posterior sigma: {np.sqrt(1/Lambda_post):.4f} kg")
# direct MAP formula: 94.7059 kg   augmented WLS: 94.7059 kg
# posterior sigma: 12.8624 kg
```

**Sanity checks.** The answer, $94.71\,\mathrm{kg}$, lies between $80$ and $100$ and closer to $100$, the more trusted source. The weights are $0.7353$ on the prior and $0.2647$ on the gauge — the same form as the two-sensor blend in the Gauss-Markov lesson, because that is exactly what this is. The posterior sigma, $12.86\,\mathrm{kg}$, is smaller than either input ($15$ and $25\,\mathrm{kg}$): two sources together know more than either alone.

**Widen the prior** and the estimate slides toward the gauge. With $P_0 = 10^2$, $10^6$ and $10^{12}\,\mathrm{kg^2}$, $\hat x_{\mathrm{MAP}}$ comes out at $97.24$, $80.0125$ and $80.0000\,\mathrm{kg}$. It approaches the plain WLS answer, $80\,\mathrm{kg}$, as the prior stops carrying information. That is what the formula predicts when $\mathbf{P}_0^{-1}\to\mathbf{0}$.
:::

## Two covariances that answer two questions

The posterior covariance $\mathbf{P} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ answers one specific question. Suppose $\mathbf{x}$ really was drawn at random from $\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0)$ and then measured. Having seen $\mathbf{y}$, how unsure should you be about that particular draw? That is the right number to carry forward as the prior for the next batch, or to hand a Kalman filter as its starting covariance. The Kalman filter module treats that handoff as routine: a filter's covariance at any moment is a posterior that becomes the next prior.

It does *not* answer a different question. Hold one particular true $\mathbf{x}$ fixed and rerun the experiment many times with fresh noise. How much does the MAP estimate jump around? To see the difference, put the model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ into the estimator:

$$
\hat{\mathbf{x}}_{\mathrm{MAP}} = \underbrace{\mathbf{P}\left(\mathbf{P}_0^{-1}\mathbf{x}_0 + \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x}\right)}_{\text{fixed, given the true }\mathbf{x}} + \;\mathbf{P}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v}.
$$

Only the last term changes from run to run. It is a fixed matrix, $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$, times the noise. By the sandwich formula its covariance is $(\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1})\,\mathbf{R}\,(\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1})^\mathsf{T} = \mathbf{P}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\,\mathbf{P}$. That is *not* $\mathbf{P}$, unless the prior carries no information. Two different questions, two different covariances.

::: example Posterior covariance against the spread of the estimate
Use a badly conditioned two-unknown fit: $m=50$ measurements, noise $\sigma=0.02$, and an $\mathbf{H}$ whose two columns point in almost the same direction, so its condition number is $\kappa(\mathbf{H})=1000$. Add a prior $\mathbf{x}_0=\mathbf{0}$, $\mathbf{P}_0=9\mathbf{I}$, meaning a sigma of $3$ on each unknown. The formula gives

$$
\mathbf{P}=\begin{pmatrix}4.306 & -4.306\\ -4.306 & 4.306\end{pmatrix},
$$

to three decimals. The off-diagonal is almost exactly minus the diagonal: the two unknowns are nearly perfectly anti-correlated, because the data pin down their sum but barely see their difference.

Now two **[[Monte Carlo|monte-carlo]]** experiments of $200{,}000$ trials each. In Trial A the true $\mathbf{x}$ stays fixed and only the noise changes. In Trial B the true $\mathbf{x}$ is itself drawn fresh from the prior on every trial.

```python
import numpy as np

rng = np.random.default_rng(4)
m = 50
phi = 2e-3
h1 = rng.standard_normal(m); h1 /= np.linalg.norm(h1)
u = rng.standard_normal(m); u -= (u @ h1) * h1; u /= np.linalg.norm(u)
H = np.column_stack([h1, np.cos(phi) * h1 + np.sin(phi) * u])   # cond(H) ~ 1000

sigma = 0.02
Rinv = np.eye(m) / sigma**2
Lambda_data = H.T @ Rinv @ H
P0 = 9.0 * np.eye(2)                        # prior: x0 = 0, sigma_prior = 3
P = np.linalg.inv(np.linalg.inv(P0) + Lambda_data)
K = P @ H.T @ Rinv                          # data part of the MAP gain
N = 200_000

# Trial A: one fixed true x, only measurement noise v varies
x_true = np.array([1.0, 1.0])
y = (H @ x_true)[None, :] + rng.normal(0.0, sigma, size=(N, m))
xhat_A = (K @ y.T).T                        # + P @ inv(P0) @ x0, zero here since x0 = 0
print("Trial A  empirical Cov diag:", np.var(xhat_A, axis=0).round(4))
print("Trial A  sandwich P@Lambda_data@P diag:", np.diag(P @ Lambda_data @ P).round(4))
print("Trial A  trace(P) alone (wrong for this question):", round(np.trace(P), 3))

# Trial B: x itself drawn fresh from the prior N(0, P0) each trial
x_samples = rng.normal(0.0, 3.0, size=(N, 2))
y2 = (x_samples @ H.T) + rng.normal(0.0, sigma, size=(N, m))
xhat_B = (K @ y2.T).T
print("Trial B  empirical Cov(xhat-x) diag:", np.var(xhat_B - x_samples, axis=0).round(4))
print("Trial B  P diag:", np.diag(P).round(4))
# Trial A  empirical Cov diag: [0.185 0.185]
# Trial A  sandwich P@Lambda_data@P diag: [0.1855 0.1855]
# Trial A  trace(P) alone (wrong for this question): 8.613
# Trial B  empirical Cov(xhat-x) diag: [4.2966 4.2965]
# Trial B  P diag: [4.3063 4.3063]
```

**Trial A.** With the truth held fixed, the estimate's spread matches the sandwich $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ to three figures. Its trace, $0.371$, is more than twenty times smaller than $\operatorname{tr}(\mathbf{P})=8.613$.

**Trial B.** Only when $\mathbf{x}$ is really redrawn from the prior every time — the situation MAP was derived for — does the error spread match $\mathbf{P}$, to within Monte Carlo noise.

**The lesson.** Reporting $\mathbf{P}$ as "how much the estimate would move under repeated noise" — a fixed-truth question, the one a **[[hardware-in-the-loop|hil]]** test asks — overstates that spread by more than a factor of ten here.
:::

::: warning Two covariances, not one
$\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ is the right number to report as your *belief about $\mathbf{x}$, given the data and the prior*. That is its standard, correct use, and what the flashcard formula means. It is the wrong number when you run many trials with one fixed truth — especially with a prior chosen as a numerical safety net rather than a real belief — and compare against the spread of the estimates. Use the sandwich $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ there. Without a prior the gap vanishes: plain WLS's covariance answers both questions at once, which is why this subtlety has not come up before.
:::

## Trading bias for variance

With the truth held fixed, the MAP estimate is **biased** whenever $\mathbf{x}_0\ne\mathbf{x}$: on average it misses. Take the average of the fixed-truth formula above (the noise term averages to zero) and subtract the truth:

$$
\text{bias} = \mathbf{P}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x})-\mathbf{x}.
$$

It vanishes only if $\mathbf{x}_0=\mathbf{x}$ or $\mathbf{P}_0^{-1}\to\mathbf{0}$. Lesson three's Gauss-Markov theorem promised that no *unbiased linear* estimator beats WLS in variance. MAP does not contradict that, because MAP is not unbiased. It buys lower variance by giving up exactly the property the theorem required.

Is the trade worth it? Think of an archer. One archer's arrows are centered on the bullseye but scattered widely. Another's land in a tight cluster slightly off-center. Which is better depends on the total miss. That total is the **mean squared error**:

$$
\mathrm{MSE}=\lVert\text{bias}\rVert^2+\operatorname{tr}(\text{sampling covariance}),
$$

the squared average miss plus the scatter. Here $\operatorname{tr}$, the **trace**, adds up the diagonal of a matrix, so it totals the variance over all unknowns. The **[[bias-variance trade|bias-variance]]** pays best on the badly conditioned problems of lesson one.

::: example MAP against WLS on a badly conditioned fit
Take the $\kappa(\mathbf{H})=1000$ problem above ($m=50$, $\sigma=0.02$, prior $\mathbf{x}_0=\mathbf{0}$ with sigma $3$). Plain WLS has $\operatorname{tr}(\mathbf{P}_{\mathrm{WLS}})=200.0$: the nearly parallel columns make the difference of the two unknowns almost invisible to the data. Compute each estimator's bias and MSE from the formulas above at two different true states (a $200{,}000$-trial simulation agrees to within about $1\%$):

| True $\mathbf{x}$ | Estimator | Bias | MSE |
| --- | --- | --- | --- |
| $(1, 1)$ — only along the well-seen direction | WLS | $\mathbf{0}$ | $200.0$ |
| $(1, 1)$ | MAP | $\approx\mathbf{0}$ | $0.371$ |
| $(1.3, 0.7)$ — has a part the data barely see | WLS | $\mathbf{0}$ | $200.0$ |
| $(1.3, 0.7)$ | MAP | $(-0.287,\ 0.287)$ | $0.536$ |

**First truth.** The prior's guess of zero happens to be exactly right about the poorly seen direction (the difference of the two unknowns is zero). MAP wins by a factor of about $540$, with essentially no bias.

**Second truth.** Now the truth has a difference of $0.6$ that the prior did not expect. MAP picks up a real bias of about $0.29$ per unknown — and still wins, by a factor of about $370$. The bias adds only $0.165$ to the MSE, while the variance WLS pays in the invisible direction is about $200$.

**When does MAP lose?** Only when the prior is both confident (small $\mathbf{P}_0$) and wrong in a direction the data already measure well. In a direction the data barely constrain at all, almost any sensible prior beats having none.
:::

::: warning A strong, wrong prior can still hurt
The example favored MAP. The prior was weak — sigma $3$ per unknown — and it mattered only in a direction where WLS's own sigma is about $14$. A *strong* prior (small $\mathbf{P}_0$) placed on a direction the data measure well drags the estimate toward $\mathbf{x}_0$ whatever the data say. If $\mathbf{x}_0$ is wrong there, the bias is imposed, not merely left over from ignorance. Match the prior's confidence to how much you actually trust it, direction by direction, not to one convenient number.
:::

## Check yourself

::: check
Starting from $J_{\mathrm{MAP}}(\mathbf{x}) = \tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \tfrac12(\mathbf{x}-\mathbf{x}_0)^\mathsf{T}\mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0)$, derive $\hat{\mathbf{x}}_{\mathrm{MAP}}$.
:::

::: answer
The gradient is $\nabla_{\mathbf{x}}J_{\mathrm{MAP}} = -\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) + \mathbf{P}_0^{-1}(\mathbf{x}-\mathbf{x}_0)$.

Set it to zero and collect the terms with $\mathbf{x}$ on the left: $(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})\mathbf{x} = \mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}$.

Multiply by the inverse of the bracket: $\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$.
:::

::: check
Explain, without formulas, why treating the prior as "one more measurement" is exact and not a loose analogy.
:::

::: answer
Stack $\mathbf{x}_0$ under $\mathbf{y}$, with measurement matrix $\mathbf{I}$ and noise covariance $\mathbf{P}_0$, and solve by ordinary WLS. Multiplying out the blocks gives exactly the MAP formula, not an approximation of it. So the prior cannot be told apart from a direct, independent measurement of $\mathbf{x}$ by a sensor whose noise covariance is $\mathbf{P}_0$. Everything already known about combining measurements — the sandwich covariance formula, adding information — applies to it without change.
:::

::: check
A star tracker's bias is believed before launch to be $x_0 = 0$ arcseconds with $\sigma_0 = 10$ arcseconds. In orbit, a calibration measures it as $y = 6$ arcseconds with $\sigma_y = 5$ arcseconds. Find the MAP estimate and its sigma.
:::

::: answer
Information: prior $1/10^2 = 0.01$, measurement $1/5^2 = 0.04$, total $0.05$ per square arcsecond.

Estimate: $\hat x = \dfrac{0.01 \times 0 + 0.04 \times 6}{0.05} = \dfrac{0.24}{0.05} = 4.8$ arcseconds.

Sigma: $1/\sqrt{0.05} = 4.47$ arcseconds.

The measurement is four times as informative as the prior, so it gets $80\%$ of the weight, and the answer sits $80\%$ of the way from $0$ to $6$. The sigma is below both $10$ and $5$, as it should be.
:::

::: check
As $\mathbf{P}_0 \to \infty$ (a prior that admits it knows nothing), what does $\hat{\mathbf{x}}_{\mathrm{MAP}}$ become, and why does that make sense?
:::

::: answer
$\mathbf{P}_0^{-1}\to\mathbf{0}$, so the extra term in the information and the $\mathbf{P}_0^{-1}\mathbf{x}_0$ term on the right both vanish. What is left is $\hat{\mathbf{x}}_{\mathrm{MAP}}\to(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} = \hat{\mathbf{x}}_{\mathrm{WLS}}$, just as the propellant example slid to $80\,\mathrm{kg}$. It makes sense: a prior that knows nothing should contribute nothing, and plain WLS is what remains.
:::

::: check
Two engineers compute $\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ for the same MAP estimate. One reports it as "my uncertainty about $\mathbf{x}$". The other runs a hardware-in-the-loop test with a fixed true $\mathbf{x}$, collects the spread of the estimate over many noise draws, and finds it much smaller than $\mathbf{P}$. Whose number is wrong?
:::

::: answer
Neither used the wrong formula; they are answering different questions. The first engineer's $\mathbf{P}$ is the posterior covariance, correct when $\mathbf{x}$ is treated as drawn from the stated prior. The second is measuring the spread of the estimate for one fixed $\mathbf{x}$, which is the smaller sandwich $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$, not $\mathbf{P}$. The test does not show $\mathbf{P}$ was computed wrongly. It shows $\mathbf{P}$ was the wrong quantity for that comparison.
:::

::: check
This lesson calls a prior "weak" in one place and "strong" in another, with opposite effects on how much MAP helps. What single quantity in the formula controls this, and what does it mean physically?
:::

::: answer
The prior information $\mathbf{P}_0^{-1}$. A tight, confident prior (small $\mathbf{P}_0$) has large $\mathbf{P}_0^{-1}$ and pulls hard toward $\mathbf{x}_0$ whatever the data say — good if $\mathbf{x}_0$ is right, harmful if it is wrong. A loose, weak prior (large $\mathbf{P}_0$) has small $\mathbf{P}_0^{-1}$. It nudges the estimate only in directions the data cannot see, and leaves well-measured directions to the data. A prior's strength should reflect how much it is really trusted, direction by direction.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{x}\sim\mathcal{N}(\mathbf{x}_0,\mathbf{P}_0)$ | Prior: belief about $\mathbf{x}$ before the data |
| $p(\mathbf{x}\mid\mathbf{y}) \propto p(\mathbf{y}\mid\mathbf{x})\,p(\mathbf{x})$ | Bayes: posterior is likelihood times prior |
| $J_{\mathrm{MAP}} = \tfrac12\lVert\mathbf{y}-\mathbf{H}\mathbf{x}\rVert^2_{\mathbf{R}^{-1}} + \tfrac12\lVert\mathbf{x}-\mathbf{x}_0\rVert^2_{\mathbf{P}_0^{-1}}$ | Negative log-posterior: WLS cost plus a pull toward the prior |
| $\hat{\mathbf{x}}_{\mathrm{MAP}} = (\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y})$ | MAP estimate; information adds |
| $\tilde{\mathbf{H}}=(\mathbf{H};\mathbf{I})$, $\tilde{\mathbf{R}}=\operatorname{blkdiag}(\mathbf{R},\mathbf{P}_0)$ | The prior is a measurement of $\mathbf{x}$ with matrix $\mathbf{I}$ and noise $\mathbf{P}_0$ |
| $\mathbf{P}=(\mathbf{P}_0^{-1}+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ | Posterior covariance: belief given data and prior |
| $\mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{P}$ | Spread of the estimate for one fixed true $\mathbf{x}$; smaller than $\mathbf{P}$ when the prior carries information |
| Bias $= \mathbf{P}(\mathbf{P}_0^{-1}\mathbf{x}_0+\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\mathbf{x})-\mathbf{x}$ | Nonzero unless $\mathbf{x}_0=\mathbf{x}$ or the prior is uninformative |
| $\mathrm{MSE} = \lVert\text{bias}\rVert^2 + \operatorname{tr}(\text{sampling covariance})$ | The fair way to judge whether the bias was worth it |

Every estimator so far has assumed the measurement is linear in $\mathbf{x}$. The next lesson drops that assumption and fits models where $\mathbf{H}$ itself depends on $\mathbf{x}$ — the usual situation once ranges, angles and a spacecraft's own dynamics enter the picture.

::: context bayes A minister's rule for changing your mind
Thomas Bayes was an English minister with a taste for mathematics. His essay on the rule was found after his death and published in 1763 by his friend Richard Price. The rule says how to update a belief when evidence arrives: the new belief is the old belief times how well each possibility explains the evidence, rescaled so the total is one. On a spacecraft it runs constantly. Every Kalman filter update is Bayes' theorem applied to Gaussian beliefs.
:::

::: context latin-names Before and after
*A priori* and *a posteriori* are Latin for "from what comes before" and "from what comes after". In estimation, the prior is what you believe before this batch of data, and the posterior is what you believe after. Orbit-determination teams still say "the a priori state" and "a priori covariance" for the values they start a fit from. Today's posterior becomes tomorrow's prior, which is the whole idea behind recursive estimation in lesson seven.
:::

::: context information-adds Two blurry pictures make a sharper one
Below, the dashed gray curve is the prior belief about the propellant ($100 \pm 15\,\mathrm{kg}$). The orange curve is what the gauge alone says ($80 \pm 25\,\mathrm{kg}$). Multiply them together, as Bayes says, and the result is the blue curve: centered at $94.7\,\mathrm{kg}$ and narrower than either, with sigma $12.9\,\mathrm{kg}$. It sits nearer the prior, because the prior is the sharper of the two. Multiplying two Gaussians always gives another Gaussian, which is why MAP with Gaussian beliefs has a closed-form answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="160.0" x2="340.0" y2="160.0" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20.0,160.0 22.3,160.0 24.6,160.0 26.9,160.0 29.1,160.0 31.4,160.0 33.7,160.0 36.0,160.0 38.3,160.0 40.6,160.0 42.9,160.0 45.1,160.0 47.4,159.9 49.7,159.9 52.0,159.9 54.3,159.9 56.6,159.9 58.9,159.8 61.1,159.8 63.4,159.7 65.7,159.6 68.0,159.5 70.3,159.4 72.6,159.3 74.9,159.1 77.1,159.0 79.4,158.7 81.7,158.5 84.0,158.1 86.3,157.7 88.6,157.3 90.9,156.8 93.1,156.2 95.4,155.5 97.7,154.7 100.0,153.8 102.3,152.8 104.6,151.6 106.9,150.3 109.1,148.9 111.4,147.2 113.7,145.4 116.0,143.5 118.3,141.3 120.6,139.0 122.9,136.5 125.1,133.8 127.4,130.9 129.7,127.8 132.0,124.6 134.3,121.2 136.6,117.7 138.9,114.1 141.1,110.4 143.4,106.6 145.7,102.8 148.0,99.0 150.3,95.2 152.6,91.5 154.9,87.9 157.1,84.5 159.4,81.2 161.7,78.2 164.0,75.4 166.3,72.9 168.6,70.8 170.9,69.0 173.1,67.5 175.4,66.5 177.7,65.9 180.0,65.7 182.3,65.9 184.6,66.5 186.9,67.5 189.1,69.0 191.4,70.8 193.7,72.9 196.0,75.4 198.3,78.2 200.6,81.2 202.9,84.5 205.1,87.9 207.4,91.5 209.7,95.2 212.0,99.0 214.3,102.8 216.6,106.6 218.9,110.4 221.1,114.1 223.4,117.7 225.7,121.2 228.0,124.6 230.3,127.8 232.6,130.9 234.9,133.8 237.1,136.5 239.4,139.0 241.7,141.3 244.0,143.5 246.3,145.4 248.6,147.2 250.9,148.9 253.1,150.3 255.4,151.6 257.7,152.8 260.0,153.8 262.3,154.7 264.6,155.5 266.9,156.2 269.1,156.8 271.4,157.3 273.7,157.7 276.0,158.1 278.3,158.5 280.6,158.7 282.9,159.0 285.1,159.1 287.4,159.3 289.7,159.4 292.0,159.5 294.3,159.6 296.6,159.7 298.9,159.8 301.1,159.8 303.4,159.9 305.7,159.9 308.0,159.9 310.3,159.9 312.6,159.9 314.9,160.0 317.1,160.0 319.4,160.0 321.7,160.0 324.0,160.0 326.3,160.0 328.6,160.0 330.9,160.0 333.1,160.0 335.4,160.0 337.7,160.0 340.0,160.0" fill="none" stroke="#6c7a93" stroke-width="2.5" stroke-dasharray="6 4"/>
  <polyline points="20.0,152.3 22.3,151.7 24.6,151.0 26.9,150.3 29.1,149.6 31.4,148.8 33.7,148.0 36.0,147.1 38.3,146.2 40.6,145.3 42.9,144.3 45.1,143.2 47.4,142.2 49.7,141.1 52.0,139.9 54.3,138.8 56.6,137.6 58.9,136.3 61.1,135.1 63.4,133.8 65.7,132.5 68.0,131.1 70.3,129.8 72.6,128.4 74.9,127.0 77.1,125.7 79.4,124.3 81.7,122.9 84.0,121.6 86.3,120.2 88.6,118.9 90.9,117.6 93.1,116.3 95.4,115.1 97.7,113.9 100.0,112.7 102.3,111.6 104.6,110.6 106.9,109.6 109.1,108.6 111.4,107.8 113.7,107.0 116.0,106.2 118.3,105.6 120.6,105.0 122.9,104.5 125.1,104.1 127.4,103.8 129.7,103.6 132.0,103.5 134.3,103.4 136.6,103.5 138.9,103.6 141.1,103.8 143.4,104.1 145.7,104.5 148.0,105.0 150.3,105.6 152.6,106.2 154.9,107.0 157.1,107.8 159.4,108.6 161.7,109.6 164.0,110.6 166.3,111.6 168.6,112.7 170.9,113.9 173.1,115.1 175.4,116.3 177.7,117.6 180.0,118.9 182.3,120.2 184.6,121.6 186.9,122.9 189.1,124.3 191.4,125.7 193.7,127.0 196.0,128.4 198.3,129.8 200.6,131.1 202.9,132.5 205.1,133.8 207.4,135.1 209.7,136.3 212.0,137.6 214.3,138.8 216.6,139.9 218.9,141.1 221.1,142.2 223.4,143.2 225.7,144.3 228.0,145.3 230.3,146.2 232.6,147.1 234.9,148.0 237.1,148.8 239.4,149.6 241.7,150.3 244.0,151.0 246.3,151.7 248.6,152.3 250.9,152.9 253.1,153.5 255.4,154.0 257.7,154.5 260.0,155.0 262.3,155.4 264.6,155.8 266.9,156.2 269.1,156.5 271.4,156.8 273.7,157.1 276.0,157.4 278.3,157.6 280.6,157.9 282.9,158.1 285.1,158.3 287.4,158.4 289.7,158.6 292.0,158.7 294.3,158.9 296.6,159.0 298.9,159.1 301.1,159.2 303.4,159.3 305.7,159.4 308.0,159.4 310.3,159.5 312.6,159.6 314.9,159.6 317.1,159.7 319.4,159.7 321.7,159.7 324.0,159.8 326.3,159.8 328.6,159.8 330.9,159.8 333.1,159.9 335.4,159.9 337.7,159.9 340.0,159.9" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <polyline points="20.0,160.0 22.3,160.0 24.6,160.0 26.9,160.0 29.1,160.0 31.4,160.0 33.7,160.0 36.0,160.0 38.3,160.0 40.6,160.0 42.9,160.0 45.1,160.0 47.4,160.0 49.7,160.0 52.0,160.0 54.3,159.9 56.6,159.9 58.9,159.9 61.1,159.8 63.4,159.8 65.7,159.7 68.0,159.7 70.3,159.6 72.6,159.4 74.9,159.3 77.1,159.1 79.4,158.8 81.7,158.5 84.0,158.1 86.3,157.7 88.6,157.1 90.9,156.4 93.1,155.7 95.4,154.7 97.7,153.6 100.0,152.4 102.3,150.9 104.6,149.2 106.9,147.3 109.1,145.1 111.4,142.6 113.7,139.9 116.0,136.8 118.3,133.5 120.6,129.9 122.9,126.0 125.1,121.8 127.4,117.4 129.7,112.7 132.0,107.8 134.3,102.8 136.6,97.7 138.9,92.5 141.1,87.3 143.4,82.2 145.7,77.3 148.0,72.5 150.3,68.1 152.6,64.0 154.9,60.3 157.1,57.1 159.4,54.5 161.7,52.4 164.0,51.0 166.3,50.2 168.6,50.0 170.9,50.6 173.1,51.7 175.4,53.5 177.7,56.0 180.0,58.9 182.3,62.4 184.6,66.3 186.9,70.6 189.1,75.3 191.4,80.1 193.7,85.2 196.0,90.3 198.3,95.5 200.6,100.7 202.9,105.8 205.1,110.7 207.4,115.5 209.7,120.0 212.0,124.3 214.3,128.3 216.6,132.1 218.9,135.5 221.1,138.7 223.4,141.5 225.7,144.1 228.0,146.4 230.3,148.4 232.6,150.2 234.9,151.8 237.1,153.1 239.4,154.3 241.7,155.3 244.0,156.1 246.3,156.9 248.6,157.5 250.9,157.9 253.1,158.4 255.4,158.7 257.7,159.0 260.0,159.2 262.3,159.4 264.6,159.5 266.9,159.6 269.1,159.7 271.4,159.8 273.7,159.8 276.0,159.9 278.3,159.9 280.6,159.9 282.9,159.9 285.1,160.0 287.4,160.0 289.7,160.0 292.0,160.0 294.3,160.0 296.6,160.0 298.9,160.0 301.1,160.0 303.4,160.0 305.7,160.0 308.0,160.0 310.3,160.0 312.6,160.0 314.9,160.0 317.1,160.0 319.4,160.0 321.7,160.0 324.0,160.0 326.3,160.0 328.6,160.0 330.9,160.0 333.1,160.0 335.4,160.0 337.7,160.0 340.0,160.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="42.9" y1="160.0" x2="42.9" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="42.9" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">40</text>
  <line x1="88.6" y1="160.0" x2="88.6" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="88.6" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">60</text>
  <line x1="134.3" y1="160.0" x2="134.3" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="134.3" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">80</text>
  <line x1="180.0" y1="160.0" x2="180.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <line x1="225.7" y1="160.0" x2="225.7" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="225.7" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">120</text>
  <line x1="271.4" y1="160.0" x2="271.4" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="271.4" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">140</text>
  <line x1="317.1" y1="160.0" x2="317.1" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="317.1" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">160</text>
  <text x="180.0" y="196.0" font-size="11" fill="#1f2a44" text-anchor="middle">propellant left (kg)</text>
  <text x="173.1" y="38.0" font-size="12" fill="#1d6fd1" text-anchor="start">after: 94.7 ± 12.9</text>
  <text x="207.4" y="84.0" font-size="11" fill="#6c7a93" text-anchor="start">prior: 100 ± 15</text>
  <text x="26.9" y="112.0" font-size="11" fill="#f2b880" text-anchor="start">gauge:</text>
  <text x="26.9" y="126.0" font-size="11" fill="#f2b880" text-anchor="start">80 ± 25</text>
</svg>
```
:::

::: context monte-carlo Answering by rolling dice
A Monte Carlo experiment answers a question about randomness by simulating it many times and counting. Instead of deriving the spread of an estimate with algebra, you generate $200{,}000$ fake data sets, run the estimator on each, and measure the spread directly. The name comes from the famous casino in Monaco. It was used as a code name by Stanislaw Ulam, John von Neumann and Nicholas Metropolis at Los Alamos in the 1940s. GNC teams run thousands of Monte Carlo cases before every flight.
:::

::: context hil Flight hardware, simulated world
In a hardware-in-the-loop test, the real flight computer runs the real flight software, but its sensors are fed signals from a simulation instead of the real sky. Because the simulation knows the true state exactly, engineers can repeat a scenario many times with fresh noise and see how the estimates scatter. That is precisely the fixed-truth question. It is why the sandwich covariance, not the posterior $\mathbf{P}$, is the right thing to compare against such a test.
:::

::: context bias-variance Tight and slightly off can beat centered and wild
Each dot is one estimate from one run of the experiment; the bullseye is the truth. WLS (left) is unbiased — its dots center on the bullseye — but they scatter widely. MAP (right) is a little off-center, yet its dots cluster tightly, so on average they land closer. Statisticians call the idea "shrinkage": pulling estimates toward a sensible guess. The same trick appears in machine learning as ridge regression, and in numerical analysis as Tikhonov regularization — a prior centered at zero under a different name.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="95" cy="95" r="60" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="95" cy="95" r="40" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="95" cy="95" r="20" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="95.0" cy="95.0" r="3" fill="#1f2a44"/>
  <text x="95.0" y="178.0" font-size="11" fill="#6c7a93" text-anchor="middle">WLS: centred, spread out</text>
  <circle cx="265" cy="95" r="60" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="265" cy="95" r="40" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="265" cy="95" r="20" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <circle cx="265.0" cy="95.0" r="3" fill="#1f2a44"/>
  <text x="265.0" y="178.0" font-size="11" fill="#1d6fd1" text-anchor="middle">MAP: a little off, tight</text>
  <circle cx="99.8" cy="104.5" r="4" fill="#6c7a93"/>
  <circle cx="93.7" cy="78.3" r="4" fill="#6c7a93"/>
  <circle cx="89.7" cy="76.1" r="4" fill="#6c7a93"/>
  <circle cx="101.1" cy="127.4" r="4" fill="#6c7a93"/>
  <circle cx="88.9" cy="84.3" r="4" fill="#6c7a93"/>
  <circle cx="110.5" cy="105.8" r="4" fill="#6c7a93"/>
  <circle cx="102.1" cy="77.5" r="4" fill="#6c7a93"/>
  <circle cx="99.1" cy="113.2" r="4" fill="#6c7a93"/>
  <circle cx="70.2" cy="87.9" r="4" fill="#6c7a93"/>
  <circle cx="270.4" cy="83.8" r="4" fill="#1d6fd1"/>
  <circle cx="270.7" cy="89.0" r="4" fill="#1d6fd1"/>
  <circle cx="273.6" cy="91.6" r="4" fill="#1d6fd1"/>
  <circle cx="280.7" cy="89.3" r="4" fill="#1d6fd1"/>
  <circle cx="267.3" cy="87.5" r="4" fill="#1d6fd1"/>
  <circle cx="279.7" cy="90.8" r="4" fill="#1d6fd1"/>
  <circle cx="272.3" cy="87.8" r="4" fill="#1d6fd1"/>
  <circle cx="275.0" cy="86.2" r="4" fill="#1d6fd1"/>
  <circle cx="285.2" cy="86.2" r="4" fill="#1d6fd1"/>
  <text x="180.0" y="22.0" font-size="11" fill="#1f2a44" text-anchor="middle">bullseye = the true x</text>
</svg>
```
:::
