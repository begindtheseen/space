---
id: l05-kalman-gain-and-proportional-navigation
title: The Kalman gain and proportional navigation, derived cold
minutes: 15
covers:
  - "Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations"
---

These two derivations pair naturally because they are the same kind of argument wearing different clothes: both minimize a cost — posterior uncertainty in one case, control effort in the other — and both hand you a gain that trades two competing quantities against each other. If you can produce that trade correctly and explain what the gain does in each limit, you have demonstrated exactly the thing both rounds are checking for: comfort with optimality arguments, not memorized formulas.

## The Kalman gain, from minimizing posterior covariance

Set up the update precisely. Before the measurement, the state estimate is $\hat{x}^-$ with error covariance $P^-$ (the prior). A linear measurement arrives, $z = Hx + v$, with measurement noise $v$ of covariance $R$, independent of the prior estimation error. The update takes the form

$$
\hat{x} = \hat{x}^- + K(z - H\hat{x}^-),
$$

and the question is: what choice of gain $K$ minimizes the posterior error?

Define the posterior error $e = x - \hat{x}$ and substitute:

$$
e = x - \hat{x}^- - K(Hx + v - H\hat{x}^-) = (I - KH)\underbrace{(x - \hat{x}^-)}_{e^-} - Kv.
$$

Since $e^-$ (prior error, covariance $P^-$) and $v$ (covariance $R$) are independent, the posterior covariance is the **Joseph form**,

$$
P = (I-KH)P^-(I-KH)^T + KRK^T,
$$

which is valid for *any* $K$, not only the optimal one — worth knowing on its own, because it is numerically the safer form to implement (it stays symmetric and positive semi-definite even with rounding error, where the simpler form below does not always).

To find the optimal $K$, minimize the scalar $\mathrm{tr}(P)$ — total estimation variance — with respect to $K$. Expand:

$$
\mathrm{tr}(P) = \mathrm{tr}(P^-) - 2\,\mathrm{tr}(KHP^-) + \mathrm{tr}\big(K(HP^-H^T + R)K^T\big).
$$

Two standard matrix-calculus identities (proved in full in the linear algebra track) finish it: for a matrix $B$, $\dfrac{d}{dX}\mathrm{tr}(XB) = B^T$, and for symmetric $S$, $\dfrac{d}{dX}\mathrm{tr}(XSX^T) = 2XS$. Applying both, with $S = HP^-H^T + R$ (symmetric, since $P^-$ and $R$ are covariances):

$$
\frac{d}{dK}\mathrm{tr}(P) = -2P^-H^T + 2KS = 0 \quad\Longrightarrow\quad K = P^-H^T\big(HP^-H^T + R\big)^{-1}.
$$

That is the Kalman gain, obtained without appeal to Bayes' rule or a Gaussian assumption anywhere — this derivation is a pure minimum-variance argument, which is worth stating explicitly if asked, because it is a common misconception that the Kalman filter requires Gaussian noise. It does not; Gaussianity is what makes the linear estimator also the *globally* optimal one among all estimators, linear or not, but the gain itself falls out of minimizing variance among linear estimators regardless.

::: key
$K = P^-H^T(HP^-H^T + R)^{-1}$, from minimizing $\mathrm{tr}(P)$ over $K$ in the Joseph-form posterior covariance. Large $R$: $K \to 0$, the measurement is ignored. Large $P^-$: $K$ approaches a pseudo-inverse of $H$, the prior is discarded and the state resets to what the measurement implies.
:::

Both limits are worth being able to state instantly, because they are the two follow-up questions asked almost every time. As $R \to \infty$ (a measurement trusted less and less), $K = P^-H^T(HP^-H^T+R)^{-1} \to 0$: an untrustworthy measurement moves the estimate hardly at all, and the filter continues propagating on the model alone. As $P^- \to \infty$ (a prior trusted less and less — for instance, right after initialization, or after a long gap with no update), $K \to H^T(HH^T)^{-1}$, the Moore–Penrose right pseudo-inverse of $H$: the prior contributes nothing, and the update effectively resets the state to whatever the measurement says, exactly as it should when there is no reason to trust anything that came before it.

The most common real failure mode in a fielded filter — and a favourite follow-up — is a filter that is **overconfident**: $P$ is smaller than the true error actually is, usually because some real error source (a correlated bias, an unmodelled disturbance) is missing from the model. An overconfident filter computes a gain that is too small for the trust it should actually place in new data, stops correcting itself adequately, and can silently diverge while still reporting a small, reassuring covariance — which is precisely why consistency testing (covered later in this module) matters as much as accuracy.

::: example Kalman gain, scalar, worked
Prior variance $P^- = 4$, measurement noise $R = 1$, $H = 1$ (a direct, unit-scaled measurement of the state).

$$
K = \frac{P^- H}{HP^-H + R} = \frac{4}{4+1} = 0.8, \qquad P = (1-K)P^- = 0.2 \times 4 = 0.8.
$$

Cross-check with the scalar information form, $1/P = 1/P^- + H^2/R$: $1/4 + 1/1 = 1.25$, and $1/1.25 = 0.8$ — matches exactly, and is a fast mental-math way to verify a scalar Kalman update on a whiteboard without redoing the full gain formula.
:::

## Proportional navigation, from optimal control

The geometry first, because the whole derivation sits on it. In the plane, let $\lambda$ be the line-of-sight (LOS) angle from pursuer to target, $R$ the range, and $V_c = -\dot R$ the closing speed. A short, purely geometric fact worth stating before any calculus: if $\dot\lambda = 0$ while the range is closing, the LOS direction is fixed in inertial space, so pursuer and target approach along the same unchanging line — a **constant-bearing collision course**, the same fact a ship's navigator or a pilot uses to recognize an imminent collision. Proportional navigation is built to drive $\dot\lambda \to 0$; the question worth deriving is exactly how strongly.

Linearize the engagement about a nominal collision course: relative lateral separation $y$ (perpendicular to the initial LOS) obeys $\ddot y = u$, a double integrator, where $u$ is the commanded lateral acceleration. With $t_{go}$ the time remaining to intercept, define the **zero-effort miss**,

$$
\text{ZEM} = y + \dot y \, t_{go},
$$

the miss distance that would result if no further control were applied from now on — the natural quantity to drive to zero.

Pose the guidance law as a minimum-effort optimal control problem: minimize $J = \int_0^{T} u(t)^2\,dt$ (with $T = t_{go}$ measured from now) subject to $\dot y = v$, $\dot v = u$, given $y(0), v(0)$, and the terminal constraint $y(T) = 0$ with $v(T)$ left free — you only care about zero miss, not the closing rate at impact. The Hamiltonian is $\mathcal{H} = u^2 + p_y v + p_v u$. The costate equations give $\dot p_y = 0$ (so $p_y$ is constant) and $\dot p_v = -p_y$; stationarity gives $u = -p_v/2$; and the free-terminal-velocity transversality condition requires $p_v(T) = 0$. Together these give $p_v(t) = p_y(T-t)$, so

$$
u(t) = \frac{p_y}{2}(t - T).
$$

Imposing the terminal position constraint $y(T) = 0$ (by integrating $v(t)$ then $y(t)$ from this control law and solving for $p_y$) gives $p_y = 6\,\text{ZEM}/T^3$, and evaluating the control at the current instant, $t=0$:

$$
u(0) = \frac{p_y}{2}(0 - T) = -\frac{3\,\text{ZEM}}{T^2}.
$$

This is the LQ-optimal minimum-effort guidance law: command acceleration proportional to zero-effort miss over time-to-go squared. The last step converts it into the familiar LOS-rate form. Using the small-angle relations $y = R\lambda$ and $t_{go} = R/V_c$, and $\dot R = -V_c$:

$$
\dot y = \dot R\lambda + R\dot\lambda = -V_c\lambda + R\dot\lambda \quad\Longrightarrow\quad \text{ZEM} = y + \dot y\,t_{go} = R\lambda + (-V_c\lambda + R\dot\lambda)\frac{R}{V_c} = \frac{R^2\dot\lambda}{V_c},
$$

where the $R\lambda$ terms cancel exactly. Substituting into $u(0) = -3\,\text{ZEM}/T^2$ with $T = R/V_c$:

$$
u(0) = -\frac{3(R^2\dot\lambda/V_c)}{(R/V_c)^2} = -3\,V_c\,\dot\lambda.
$$

That is proportional navigation: $a_{cmd} = N\,V_c\,\dot\lambda$, applied perpendicular to the line of sight, with the navigation constant $N = 3$ falling directly out of the optimal-control derivation rather than being an assumed heuristic.

::: key
$a_{cmd} = N\,V_c\,\dot\lambda$. $N=3$ is exactly the LQ-optimal navigation constant against a non-manoeuvring target with perfect information, derived from minimizing $\int u^2\,dt$ subject to zero terminal miss. It emerges from the same zero-effort-miss quantity, $\text{ZEM} = R^2\dot\lambda/V_c$, that also equals $y + \dot y\,t_{go}$ — two ways of writing the same thing, one geometric and one in relative Cartesian coordinates.
:::

Practice runs $N$ from 3 to 5, and the reasoning for both bounds is worth having ready. Slightly above 3, the trajectory straightens out earlier in the engagement, which leaves more control authority in reserve for late corrections — useful against a manoeuvring target or under real estimation error, neither of which the idealized derivation assumed; augmented PN adds an explicit term proportional to estimated target acceleration for exactly this reason. The upper bound is noise: the command is directly proportional to $\dot\lambda$, the noisiest quantity the seeker measures, so pushing $N$ much higher amplifies seeker noise into a command that saturates the airframe well before it improves accuracy.

::: example Proportional-navigation command, worked
Range $R = 5000\,\mathrm{m}$, closing speed $V_c = 800\,\mathrm{m/s}$, measured LOS rate $\dot\lambda = 0.02\,\mathrm{rad/s}$.

$$
a_{cmd} = N\,V_c\,\dot\lambda.
$$

At $N=3$: $a_{cmd} = 3 \times 800 \times 0.02 = 48\,\mathrm{m/s^2} \approx 4.9\,g$. At $N=5$: $a_{cmd} = 80\,\mathrm{m/s^2} \approx 8.2\,g$. Sanity check: both are plausible commanded accelerations for a guided interceptor airframe, but the jump from $N=3$ to $N=5$ costs almost $3.3\,g$ of extra demanded authority for the same measured LOS rate — a concrete illustration of why $N$ is not pushed arbitrarily high even though a larger $N$ nominally tightens the intercept geometry.
:::

::: warning
Do not present $N=3$ as an arbitrary convention. An interviewer who asks "why 3" is checking whether you know it is the output of an optimality argument, not a rule someone picked. If time is short, at minimum state that it comes from minimizing control effort subject to zero terminal miss on a linearized double-integrator engagement, even without reproducing every costate step.
:::

## Check yourself

::: check
In the Kalman gain derivation, why is $\mathrm{tr}(P)$ the right quantity to minimize, rather than, say, the largest eigenvalue of $P$ or $\det(P)$?
:::

::: answer
The trace of the covariance matrix is the sum of the estimation variance in each state component — minimizing it minimizes the total mean-squared estimation error summed across all states, which is a natural and analytically tractable scalar objective. It is not the only defensible choice (minimizing the largest eigenvalue, for instance, would minimize worst-direction uncertainty instead), but it is the one that produces a clean closed-form linear gain, and it happens to coincide with the maximum-likelihood and Bayesian-optimal estimator under Gaussian assumptions, which is why it is the standard choice rather than an arbitrary one.
:::

::: check
A filter reports a small, tight covariance, but its actual errors (checked against ground truth or a consistency test) are consistently much larger than that covariance implies. Using the gain formula, explain concretely what is going wrong.
:::

::: answer
The filter is overconfident: $P$ is smaller than the true uncertainty warrants, typically because some real error source is missing from the model entirely (a correlated bias treated as absent, an unmodelled disturbance). Because the gain $K = P^-H^T(HP^-H^T+R)^{-1}$ scales directly with $P^-$, an artificially small $P^-$ produces an artificially small gain, so the filter under-weights new measurements relative to how much it actually should trust them given its real error — the filter stops correcting itself adequately, the true error can grow largely unchecked, and the reported covariance never reflects it because the model producing that covariance is itself wrong. This is the single most common real failure mode in fielded filters.
:::

::: check
Derive, in words, why $\text{ZEM} = R^2\dot\lambda/V_c$ and $\text{ZEM} = y + \dot y\,t_{go}$ are the same quantity.
:::

::: answer
Starting from $y = R\lambda$ (the small-angle relation between lateral separation and LOS angle) and differentiating, $\dot y = \dot R\lambda + R\dot\lambda$; using $\dot R = -V_c$, this is $\dot y = -V_c\lambda + R\dot\lambda$. Substituting into $y + \dot y\,t_{go}$ with $t_{go} = R/V_c$: the $R\lambda$ term from $y$ and the $-V_c\lambda \cdot (R/V_c) = -R\lambda$ term from $\dot y\,t_{go}$ cancel exactly, leaving only $R\dot\lambda \cdot (R/V_c) = R^2\dot\lambda/V_c$. The cancellation is not a coincidence — both expressions describe the same physical quantity, the miss that would result from no further correction, computed in two different coordinate descriptions of the same geometry.
:::

::: check
Why does proportional navigation not require estimating the target's absolute position, only the line-of-sight rate and closing velocity?
:::

::: answer
Because the entire derivation is carried out in *relative* geometry — the LOS angle, its rate, and the closing speed are all properties of the pursuer-target relationship, not of either vehicle's position in an external frame. The zero-effort-miss quantity that the optimal control law drives to zero is defined purely from these relative quantities, so a seeker that measures LOS rate and range rate directly (as a radar or optical seeker does) has everything the guidance law needs without ever forming an absolute position estimate for either vehicle.
:::

::: check
Both derivations in this lesson end in a formula with the shape "gain times a difference" or "gain times a rate." What is the common mathematical structure underneath both, and why does recognizing it help you rederive either one under time pressure?
:::

::: answer
Both are the stationary point of a quadratic cost: the Kalman gain minimizes a quadratic form (trace of a covariance built from a quadratic expression in $K$), and the PN law minimizes a quadratic control-effort integral subject to a linear terminal constraint. In both cases, setting the derivative of a quadratic objective to zero produces a linear equation for the unknown (gain or control law), which is why both derivations end in a ratio — one quantity divided by a sum of two comparable quantities. Recognizing this shared shape means that under pressure, you are not trying to recall two unrelated formulas; you are running the same "differentiate a quadratic, set to zero, solve" move twice, on two different but structurally identical setups.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Kalman gain | $K = P^-H^T(HP^-H^T+R)^{-1}$, from minimizing $\mathrm{tr}(P)$ in the Joseph-form posterior covariance |
| Gain limits | $R\to\infty$: $K\to 0$ (ignore the measurement). $P^-\to\infty$: $K\to$ pseudo-inverse of $H$ (reset to the measurement) |
| Overconfident filter | $P$ too small relative to true error, usually a missing error source, produces too-small a gain and silent divergence |
| Zero-effort miss | $\text{ZEM} = y + \dot y\,t_{go} = R^2\dot\lambda/V_c$, two forms of the same relative-geometry quantity |
| Proportional navigation | $a_{cmd} = N V_c\dot\lambda$, $N=3$ from minimizing $\int u^2\,dt$ subject to zero terminal miss; 3–5 in practice, bounded above by seeker-noise amplification |

The next lesson carries the same cold-derivation approach to the two remaining core derivations built on rigid-body and orbital geometry: Euler's equations and the intermediate-axis instability, and the Clohessy-Wiltshire equations of relative motion.
