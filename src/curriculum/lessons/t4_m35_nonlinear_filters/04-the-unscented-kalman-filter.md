---
id: l04-the-unscented-kalman-filter
title: The Unscented Kalman Filter
minutes: 26
covers:
  - 'The Unscented Kalman Filter: the unscented transform, sigma point selection (alpha, beta, kappa), the square-root UKF'
---

Stand in front of a funhouse mirror. It bends your reflection: your head looks huge, your legs look tiny. Suppose you want to know what the mirror does to a whole group photo. One way is to study a tiny patch of glass in the middle, measure how it tilts, and assume the whole mirror tilts that way. That is what the EKF does. It measures the slope of the function at one spot, the current estimate, and pretends the function is that straight line everywhere.

There is another way. Line up a few friends at carefully chosen spots: one in the middle, the others spread out to the left, right, front and back. Look at where each reflection lands. Then work out the group's average position and spread from those few reflections. You never measured the slope of the glass. You only looked at what the mirror *really does* to a handful of well-placed people.

That second way is the **Unscented Kalman Filter** (**UKF**) — a Kalman filter that pushes a small set of chosen points through the true nonlinear function, instead of pushing one point and a slope. The machinery inside it is called the **[[unscented|why-unscented]] transform**. The last two lessons showed how the EKF's one-slope picture can fail badly, near a bearing sensor for instance. This lesson builds the UKF, shows what its three tuning knobs do, and shows the one way its arithmetic can go wrong, together with the fix, the **square-root UKF**. UKFs fly today in spacecraft attitude filters, in drone autopilots and in orbit-determination software, wherever a model is too curved or too complicated to differentiate by hand.

## The job both filter steps need done

Every Kalman filter step does the same thing twice. You have an uncertain state described by a **Gaussian** — a bell-shaped spread — with mean $\hat{\mathbf x}$ (read "x hat", the best guess) and covariance $\mathbf P$ (the size and shape of the uncertainty). The state has $n$ numbers in it. You push that state through some function $\mathbf g$ and need the mean and covariance of what comes out, $\mathbf y = \mathbf g(\mathbf x)$.

- In the **predict** step, $\mathbf g$ is the dynamics $\mathbf f$: where will the vehicle be one step later?
- In the **update** step, $\mathbf g$ is the sensor model $\mathbf h$: what should the sensor read?

For a straight-line (linear) $\mathbf g$ there is an exact answer, and the ordinary Kalman filter uses it. For a curved $\mathbf g$ there is usually no exact answer. The EKF replaces $\mathbf g$ by its tangent line at $\hat{\mathbf x}$. The unscented transform leaves $\mathbf g$ alone and approximates the *bell curve* instead, by a few points that share its mean and covariance.

## Sigma points: a few friends in the right places

Start in one dimension, $n = 1$. The state is a single number with mean $\mu$ (read "mu") and standard deviation $\sigma$ (read "sigma"). Put one point at the mean and one on each side, at $\mu \pm c\,\sigma$ for some stretch $c$. Give the side points equal weights. Because they sit symmetrically, their average is exactly $\mu$. Choose $c$ and the weights so their spread is exactly $\sigma^2$, and these three points have the same mean and the same variance as the bell curve. Those representative points are called **[[sigma points|sigma-picture]]**, after the $\sigma$ that sets how far out they sit.

In $n$ dimensions you need $2n+1$ of them: the mean, plus one step forward and one step back along each of $n$ directions. The directions come from a **[[matrix square root|matrix-square-root]]** of $\mathbf P$ — a matrix $\mathbf S$ with $\mathbf S\mathbf S^{\mathsf T}$ equal to (a multiple of) $\mathbf P$, the way $3$ is a square root of $9$. Its columns, written $[\mathbf S]_i$ ("the $i$-th column of S"), point along the uncertainty ellipse. In practice $\mathbf S$ is the Cholesky factor, which a computer finds quickly.

Here is the full recipe, with three tuning numbers: $\alpha$ ("alpha"), $\beta$ ("beta") and $\kappa$ ("kappa"). They combine into one number $\lambda$ ("lambda"). The points are written $\boldsymbol\chi$ ("chi", said "kai"), and each gets two weights: $W^{(m)}$ for building the mean and $W^{(c)}$ for building the covariance.

::: key The scaled unscented transform
With $\lambda=\alpha^2(n+\kappa)-n$ and $\mathbf S$ any matrix square root satisfying $\mathbf S\mathbf S^{\mathsf T}=(n+\lambda)\mathbf P$ (a Cholesky factor, in practice), the $2n+1$ sigma points are
$$
\boldsymbol\chi_0=\hat{\mathbf x}, \qquad \boldsymbol\chi_i=\hat{\mathbf x}+[\mathbf S]_i,\quad \boldsymbol\chi_{n+i}=\hat{\mathbf x}-[\mathbf S]_i \quad (i=1,\ldots,n),
$$
with $[\mathbf S]_i$ the $i$-th column of $\mathbf S$. Weights: $W_0^{(m)}=\dfrac{\lambda}{n+\lambda}$, $W_0^{(c)}=\dfrac{\lambda}{n+\lambda}+(1-\alpha^2+\beta)$, and $W_i^{(m)}=W_i^{(c)}=\dfrac1{2(n+\lambda)}$ for $i=1,\ldots,2n$. Propagate every point through the true nonlinear function, $\mathbf y_i=\mathbf g(\boldsymbol\chi_i)$, with no linearization anywhere, then recombine:
$$
\hat{\mathbf y}=\sum_{i=0}^{2n}W_i^{(m)}\mathbf y_i, \qquad \mathbf P_{yy}=\sum_{i=0}^{2n}W_i^{(c)}(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}.
$$
No Jacobian is needed: $\mathbf g$ is evaluated, never differentiated.
:::

Read the recipe in three moves. **Place** the points using $\hat{\mathbf x}$ and $\mathbf P$. **Push** each one through the real $\mathbf g$ — the whole curved function, exactly as written in code. **Pool** the results with the weights. The symbol $(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}$ is an **outer product**: a column times a row, which makes a small matrix recording how far point $i$ landed from the new mean in each direction.

::: example Why the points catch what the tangent line misses
Take one number, $x$, with mean $\mu = 2$ and variance $\sigma^2 = 0.5$, and square it: $g(x) = x^2$. The exact mean of $x^2$ is $\mu^2 + \sigma^2 = 4 + 0.5 = 4.5$. (The extra $\sigma^2$ appears because squaring pushes both sides of the bell upward, so the average rises.)

**Tangent line (EKF).** Push only the mean through: $g(2) = 4$. It misses by $0.5$, because a straight line cannot see the bend.

**Sigma points** with $n = 1$, $\alpha = 1$, $\kappa = 2$: first $\lambda = 1^2(1 + 2) - 1 = 2$, so $n + \lambda = 3$. The stretch is $\sqrt{3 \times 0.5} = \sqrt{1.5} \approx 1.2247$. The points are $2$, $3.2247$ and $0.7753$. The weights are $W_0^{(m)} = \tfrac{2}{3}$ and $W_1^{(m)} = W_2^{(m)} = \tfrac{1}{6}$; check they add to $1$: $\tfrac23 + \tfrac16 + \tfrac16 = 1$.

Square each point: $4$, $10.399$ and $0.601$. Pool them:

$$
\hat y = \tfrac{2}{3}(4) + \tfrac{1}{6}(10.399 + 0.601) = 2.667 + 1.833 = 4.5.
$$

Exactly right. The two outer points sit on the curve's two arms, and their average carries the bend that the tangent line threw away. It is exact here because $x^2$ is a quadratic; for a general curve it is not exact, but it is right up to terms much smaller than the ones the EKF drops.
:::

::: note Why it has to be true
Two facts do all the work. First, the points are symmetric: every $+[\mathbf S]_i$ has a matching $-[\mathbf S]_i$. So $\sum_i W_i^{(m)}(\boldsymbol\chi_i - \hat{\mathbf x}) = \mathbf 0$: the points average to the mean exactly. Second, $\sum_{i=1}^{2n} \tfrac{1}{2(n+\lambda)}[\pm\mathbf S]_i[\pm\mathbf S]_i^{\mathsf T} = \tfrac{1}{n+\lambda}\mathbf S\mathbf S^{\mathsf T} = \mathbf P$: their spread equals $\mathbf P$ exactly.

Now expand $\mathbf g$ around $\hat{\mathbf x}$ as a Taylor series: a constant, plus a linear term, plus a quadratic term, and so on. The linear term averages to zero, over the points and over the true bell alike. The quadratic term averages to the same value over both, because it only depends on the spread, which matches. The cubic term averages to zero over both, by symmetry. So the pooled mean agrees with the true mean through the third-order terms; the first disagreement is in the fourth. The covariance multiplies two such expansions together, which brings in higher products sooner, so it is only guaranteed through second order. The EKF keeps only the linear term, so it is first order in both. For any linear $\mathbf g$ both transforms are exact.
:::

::: key UKF accuracy claim
The unscented transform captures the posterior mean to third order and the covariance to second order for any nonlinearity, against first order for the EKF. Cost: $2n+1$ model evaluations plus a matrix square root per step.
:::

::: example Range and bearing to east and north
A tracking radar reports range $r$ and bearing $\theta$ ("theta"). Range is $1000\,\mathrm m$ with standard deviation $50\,\mathrm m$; bearing is $30^\circ$ with standard deviation $15^\circ$, a very uncertain bearing. The two are independent. You want east and north, $\mathbf y = (r\cos\theta,\ r\sin\theta)$.

For this map the true mean and covariance can be worked out with pencil, so we have an exact answer to compare against (a [[Monte Carlo|monte-carlo]] run with five million random samples agrees with it to well under a meter). The true mean is $(836.85,\ 483.16)\,\mathrm m$. The true covariance is

$$
\begin{pmatrix}19453 & -25840\\ -25840 & 49290\end{pmatrix}\mathrm{m^2}.
$$

**Tangent line (EKF).** The mean is the image of the mean, $(866.03,\ 500.00)\,\mathrm m$. That is $33.7\,\mathrm m$ off. The true cloud of points is bent into an arc, and the average of an arc lies [[inside the curve|banana]], not on it. The covariance misses by a [[Frobenius|frobenius]] error of $4784\,\mathrm{m^2}$.

**Unscented transform**, $\beta = 2$, $\kappa = 0$, five sigma points ($n = 2$):

- at $\alpha = 10^{-3}$, the mean is off by only $0.58\,\mathrm m$, and the covariance error is $4341\,\mathrm{m^2}$;
- at $\alpha = 1$, the mean is off by $0.19\,\mathrm m$, and the covariance error is $1887\,\mathrm{m^2}$.

The mean is where the gain is biggest: $33.7 / 0.58 \approx 58$ and $33.7 / 0.19 \approx 177$ times closer than the tangent line, whichever $\alpha$ you pick. That is the third-order accuracy at work. The covariance improves less, and more at $\alpha = 1$ than at $\alpha = 10^{-3}$. With $\alpha = 1$ the points spread about $1.4$ standard deviations out, so they feel the real bend of the arc. With $\alpha = 10^{-3}$ they huddle within a thousandth of a standard deviation of the mean and can only guess the bend from its local shape.
:::

```python
import numpy as np

def sigma_points(x, P, alpha, beta, kappa):
    n = len(x)
    lam = alpha**2*(n + kappa) - n
    S = np.linalg.cholesky((n + lam)*P)
    chi = np.vstack([x, x + S.T, x - S.T])      # rows: centre, +columns, -columns
    Wm = np.full(2*n + 1, 1.0/(2*(n + lam))); Wc = Wm.copy()
    Wm[0] = lam/(n + lam); Wc[0] = lam/(n + lam) + (1 - alpha**2 + beta)
    return chi, Wm, Wc

def polar_to_cart(rt):
    r, th = rt
    return np.array([r*np.cos(th), r*np.sin(th)])

mean0 = np.array([1000.0, np.radians(30.0)])
P0 = np.diag([50.0**2, np.radians(15.0)**2])
for alpha in [1e-3, 1.0]:
    chi, Wm, Wc = sigma_points(mean0, P0, alpha, beta=2.0, kappa=0.0)
    Y = np.array([polar_to_cart(pt) for pt in chi])
    y_mean = Wm @ Y
    D = Y - y_mean
    y_cov = (Wc*D.T) @ D
    print(alpha, y_mean.round(2), y_cov.round(0).tolist())
# 0.001 [836.35 482.87] [[20771.0, -27579.0], [-27579.0, 52616.0]]
# 1.0 [836.68 483.06] [[20824.0, -25773.0], [-25773.0, 50584.0]]
```

## Choosing alpha, beta and kappa

Each knob has one job.

- $\alpha$ sets **how far out** the points sit. Small $\alpha$ keeps them close to the mean, which helps when the model can only be trusted near the estimate. Typical values run from $10^{-3}$ to $1$.
- $\kappa$ is a second, smaller stretch. It is usually $0$, or $3 - n$. With $\alpha = 1$, the choice $\kappa = 3 - n$ puts the points $\sqrt 3$ standard deviations out, which makes them match one more property of the bell curve along each axis (its fourth moment).
- $\beta$ carries **prior knowledge of the shape** of the distribution. It only touches the centre point's covariance weight. For a Gaussian, $\beta = 2$ is the best choice: it builds the bell curve's known [[fourth moment|kurtosis]] into the covariance.

::: key UKF tuning parameters
$\alpha$ sets the spread (typically $10^{-3}\le\alpha\le1$), $\kappa$ is usually $0$ or $3-n$, and $\beta=2$ is optimal for a Gaussian prior. $\lambda=\alpha^2(n+\kappa)-n$. The three enter only through the weights and the spread factor $\sqrt{n+\lambda}$ — never as derivatives of $\mathbf f$ or $\mathbf h$. Careless values give negative weights and an indefinite covariance — use the square-root UKF.
:::

A small $\alpha$ sounds like the safe default. It has a price. Take $n = 4$, $\kappa = 0$ and $\alpha = 10^{-3}$, the settings in this module's exercise. Then

$$
n + \lambda = \alpha^2(n + \kappa) = 10^{-6} \times 4 = 4 \times 10^{-6}.
$$

Each of the eight outer points gets weight $W_i^{(m)} = 1/(2 \times 4 \times 10^{-6}) = 125{,}000$. The centre gets $W_0^{(m)} = \lambda/(n+\lambda) = 1 - 10^6 = -999{,}999$. Check the total: $8 \times 125{,}000 - 999{,}999 = 1$. The weights still add to one, but only by huge numbers cancelling. Nothing here is a mistake. Those extreme weights are exactly what keeps the mean accurate while the points crowd the centre. But the computer is now finding a small answer as the difference of numbers a million times bigger, and any small slip in the inputs gets multiplied by a million. That is called **[[cancellation|cancellation]]**.

::: warning A negative weight is not a bug, but it removes a safety net
When every weight is positive, a weighted sum of outer products can never have a negative variance in any direction: it is a sum of squares. The moment the centre weight $W_0^{(c)}$ is negative, that guarantee is gone. The formula can then return a "covariance" that claims negative uncertainty in some direction — and nothing in the arithmetic will warn you.
:::

## From transform to filter

The UKF is the Kalman filter with the unscented transform doing both jobs.

**Predict.** Make sigma points from $\hat{\mathbf x}_{k-1}^+$ and $\mathbf P_{k-1}^+$. Push each through the dynamics, $\boldsymbol\chi_i^- = \mathbf f(\boldsymbol\chi_i)$. Pool them into $\hat{\mathbf x}_k^-$ and a covariance, then add the process noise $\mathbf Q$ to get $\mathbf P_k^-$.

**Update.** Make fresh sigma points from $\hat{\mathbf x}_k^-$ and $\mathbf P_k^-$. Push each through the sensor model, $\mathbf z_i = \mathbf h(\boldsymbol\chi_i)$. Pool:

$$
\hat{\mathbf z}=\sum_i W_i^{(m)}\mathbf z_i,\qquad
\mathbf P_{zz}=\sum_i W_i^{(c)}(\mathbf z_i-\hat{\mathbf z})(\mathbf z_i-\hat{\mathbf z})^{\mathsf T}+\mathbf R,\qquad
\mathbf P_{xz}=\sum_i W_i^{(c)}(\boldsymbol\chi_i-\hat{\mathbf x}_k^-)(\mathbf z_i-\hat{\mathbf z})^{\mathsf T}.
$$

$\mathbf P_{zz}$ is the predicted spread of the measurement, noise included. $\mathbf P_{xz}$, the **cross-covariance**, says how the state and the measurement move together. Then

$$
\mathbf K=\mathbf P_{xz}\mathbf P_{zz}^{-1},\qquad
\hat{\mathbf x}_k^+=\hat{\mathbf x}_k^-+\mathbf K(\mathbf z_k-\hat{\mathbf z}),\qquad
\mathbf P_k^+=\mathbf P_k^--\mathbf K\mathbf P_{zz}\mathbf K^{\mathsf T}.
$$

These are the Kalman filter's own equations. For a linear sensor, $\mathbf P_{xz}$ is exactly $\mathbf P^-\mathbf H^{\mathsf T}$ and $\mathbf P_{zz}$ is exactly $\mathbf H\mathbf P^-\mathbf H^{\mathsf T}+\mathbf R$, so the UKF becomes the ordinary Kalman filter. The UKF finds those two quantities from the points instead of from a Jacobian.

## When the covariance goes bad

Negative weights can break the covariance even with perfect arithmetic. Take $n = 4$ with $\alpha = 1$, $\kappa = 3 - n = -1$ and $\beta = 0$. Then $\lambda = 1 \times (4 - 1) - 4 = -1$ and $n + \lambda = 3$. The centre weights are both $-\tfrac13$, and the eight outer weights are $\tfrac16$ each. Let $\mathbf x$ have mean zero and $\mathbf P = \mathbf I$ (the identity matrix, so each of the four numbers has variance one), and let $g(\mathbf x) = x_1^2 + x_2^2 + x_3^2 + x_4^2$. The centre point gives $0$. Each outer point sits at distance $\sqrt 3$ along one axis, so it gives $3$. The mean is $8 \times \tfrac16 \times 3 = 4$, which is exactly right. The variance is

$$
-\tfrac13(0 - 4)^2 + 8 \times \tfrac16 (3 - 4)^2 = -\tfrac{16}{3} + \tfrac{4}{3} = -4.
$$

A negative variance. No real quantity has one. (The true value is $8$.) The trouble is that $\kappa = 3 - n$ makes $\lambda$ negative as soon as $n > 3$, and with $\beta = 0$ nothing lifts the centre's covariance weight back above zero.

::: example A real UKF run that breaks
Run this module's bearings-only tracking problem (the one from the EKF-diverges lesson) with a UKF at the exercise settings, $\alpha = 10^{-3}$, $\beta = 2$, $\kappa = 0$. Over a thousand runs with different random noise, two break. Take run number $733$, update $31$.

Before the update, everything is healthy. The **[[eigenvalues|eigen-ellipse]]** of $\mathbf P^-$ — the variances along the ellipse's own axes — are $0.048$, $1.767$, $8.179$ and $3261$, all positive. But the estimate sits $10.4\,\mathrm m$ from the sensor with a position spread of about $57\,\mathrm m$. The sigma points huddle within $0.11\,\mathrm m$ of the estimate. The huge weights extrapolate the bearing's local bend across the whole $57\,\mathrm m$ ellipse and shift the predicted mean bearing by $9.16$ rad — more than a full turn.

The code then wraps each bearing difference back into the range $-\pi$ to $\pi$, as bearing code must. That moves every difference by $2\pi$. With ordinary weights such a shift would do little harm; multiplied by weights near $\pm 10^6$, it changes $\mathbf P_{zz}$ from about $195\,\mathrm{rad^2}$ to $7.31\,\mathrm{rad^2}$. The gain $\mathbf P_{xz}/\mathbf P_{zz}$ comes out far too big, and the update subtracts more uncertainty than there was. The posterior eigenvalues are

$$
(-8742,\ \ 0.048,\ \ 1.767,\ \ 8.183).
$$

One variance is hugely negative. The next step needs a Cholesky factor of $\mathbf P$ to make sigma points, and that fails outright.
:::

```python
import numpy as np

def wrap(a): return (a + np.pi) % (2*np.pi) - np.pi
def h(x): return np.arctan2(x[1], x[0])        # bearing, sensor at the origin

dt, q = 1.0, 0.01
F = np.array([[1, 0, dt, 0], [0, 1, 0, dt], [0, 0, 1, 0], [0, 0, 0, 1]], float)
Q = q*np.array([[dt**3/3, 0, dt**2/2, 0], [0, dt**3/3, 0, dt**2/2],
                [dt**2/2, 0, dt, 0], [0, dt**2/2, 0, dt]])
sig = np.radians(2.0); R = sig**2

def sigma_points(x, P, alpha=1e-3, beta=2.0, kappa=0.0):
    n = len(x); lam = alpha**2*(n + kappa) - n
    S = np.linalg.cholesky((n + lam)*P)
    chi = np.vstack([x, x + S.T, x - S.T])
    Wm = np.full(2*n + 1, 1/(2*(n + lam))); Wc = Wm.copy()
    Wm[0] = lam/(n + lam); Wc[0] = lam/(n + lam) + 1 - alpha**2 + beta
    return chi, Wm, Wc

def ukf_step(x, P, z):
    chi, Wm, Wc = sigma_points(x, P)                 # predict
    X = chi@F.T; xm = Wm@X; D = X - xm
    Pm = (Wc*D.T)@D + Q
    chi, Wm, Wc = sigma_points(xm, Pm)               # update
    Z = np.array([h(c) for c in chi])
    zm = h(xm) + Wm@wrap(Z - h(xm)); dz = wrap(Z - zm)
    Pzz = Wc@dz**2 + R; Pxz = (Wc*dz)@(chi - xm)
    K = Pxz/Pzz
    return xm + K*wrap(z - zm), Pm - np.outer(K, K)*Pzz, Pm, Pzz, zm - h(xm)

rng = np.random.default_rng(733)
xt = np.array([300.0, 50.0, -11.0, -1.0])
x, P = xt.copy(), np.diag([60.0**2, 60.0**2, 2.0**2, 2.0**2])
for k in range(1, 32):
    xt = F@xt + rng.multivariate_normal(np.zeros(4), Q)
    z = h(xt) + rng.normal(0, sig)
    x, P, Pm, Pzz, shift = ukf_step(x, P, z)
print(np.linalg.eigvalsh(Pm).round(3))
print(round(Pzz, 2), round(shift, 2))
print(np.linalg.eigvalsh(P).round(3))
# [4.800000e-02 1.767000e+00 8.179000e+00 3.261216e+03]
# 7.31 9.16
# [-8.74234e+03  4.80000e-02  1.76700e+00  8.18300e+00]
```

## The square-root UKF

A variance is a square — a standard deviation times itself — so it can never be negative. The **square-root UKF** uses that idea as its design rule. Instead of carrying $\mathbf P$ from step to step, it carries a square root $\mathbf S$ with $\mathbf P = \mathbf S\mathbf S^{\mathsf T}$. Any matrix times its own transpose is **positive semi-definite**: no direction can have negative variance. So whatever $\mathbf S$ the filter holds, the covariance it stands for is valid by construction.

It updates $\mathbf S$ directly, never forming $\mathbf P$:

- the positively weighted points (and the noise) go into $\mathbf S$ through a **QR factorization**, a stable way to turn a stack of weighted deviations into a triangular square root;
- the centre point, when its weight is negative, is handled by a **Cholesky downdate**, a routine that removes one outer product from $\mathbf S\mathbf S^{\mathsf T}$;
- the measurement update removes $\mathbf K\mathbf P_{zz}\mathbf K^{\mathsf T}$ by more downdates.

A downdate cannot quietly return a negative variance. If the removal would make the result invalid, it stops and reports failure. So the square-root form turns a silent disaster into a loud one, and on ordinary problems it also keeps twice as many correct digits, because $\mathbf S$ is far better conditioned than $\mathbf P$. These are the same [[square-root forms|bridge-sqrt]] the Kalman filter module used; the trigger here is different, but the remedy is the same idea.

::: warning Treat the cause as well as the symptom
The square-root form guarantees you never *use* an invalid covariance. It does not make the huge weights sensible. In the example above, the root cause was $\alpha = 10^{-3}$ stretching a local bend over a $57\,\mathrm m$ ellipse, plus a wrapped angle. The durable fixes are a larger $\alpha$ when the problem allows it, weights with $W_0^{(c)} \ge 0$ where you can choose them, and careful angle handling — together with the square-root form.
:::

## Check yourself

::: check
In the unscented transform, what goes through the nonlinear function $\mathbf g$, and what never does?
:::

::: answer
The $2n+1$ sigma points $\boldsymbol\chi_i$ go through the true, unmodified $\mathbf g$: $\mathbf y_i=\mathbf g(\boldsymbol\chi_i)$, exactly as $\mathbf g$ is written, with nothing linearized or cut short.

No Jacobian of $\mathbf g$ is ever computed or propagated. The recipe uses only values of $\mathbf g$ at the chosen points, pooled afterwards with fixed weights.
:::

::: check
In the range-and-bearing example, the unscented mean improved far more over the tangent line than the unscented covariance did. Why are the two not corrected equally?
:::

::: answer
It is built into the transform. For a general nonlinear function, the unscented mean is right through third-order Taylor terms, but the covariance only through second order.

The mean's accuracy comes from the symmetry of the points and the matched spread, which hold however tightly the points are packed. That is why even the huddled $\alpha=10^{-3}$ points got the mean to within $0.58\,\mathrm m$. The covariance gains more from points that actually explore the bend, which is why widening to $\alpha=1$ cut its error from $4341$ to $1887\,\mathrm{m^2}$ while the mean, already excellent, barely moved.
:::

::: check
Why does $\alpha=10^{-3}$ give weights near $\pm10^6$ for a four-state system? Is that an error?
:::

::: answer
The outer weights are $W_i^{(m)}=1/(2(n+\lambda))$, and $n+\lambda=\alpha^2(n+\kappa)$. With $n=4$, $\kappa=0$, $\alpha=10^{-3}$: $n+\lambda=4\times10^{-6}$, so $W_i^{(m)}=1/(8\times10^{-6})=125{,}000$. The centre weight is $W_0^{(m)}=\lambda/(n+\lambda)=1-10^6=-999{,}999$, so that all nine still add to exactly $1$.

It is not an error. The transform needs those weights to keep its accuracy while the points sit very close to the mean. But it means the answer is a small difference of huge numbers, so any slip in the inputs is magnified about a million times.
:::

::: check
Explain why the ordinary UKF's covariance formula can produce a negative eigenvalue, while the linear Kalman filter's Joseph-form update cannot (in exact arithmetic).
:::

::: answer
The Joseph form, $(\mathbf I-\mathbf K\mathbf H)\mathbf P^-(\mathbf I-\mathbf K\mathbf H)^{\mathsf T}+\mathbf K\mathbf R\mathbf K^{\mathsf T}$, is a sum of pieces that are each positive semi-definite by their shape. It cannot give a negative variance, whatever the numbers.

The UKF's $\sum_i W_i^{(c)}(\mathbf y_i-\hat{\mathbf y})(\mathbf y_i-\hat{\mathbf y})^{\mathsf T}$ is a weighted sum of outer products in which the centre weight can be negative. Then nothing in the shape of the formula protects it. The four-state example with $\kappa=3-n$ gives a variance of $-4$ with perfect arithmetic. With $\alpha=10^{-3}$ the weights near $\pm10^6$ also magnify any small inconsistency in the deviations (in the bearing example, a $2\pi$ wrap) into a large negative eigenvalue.
:::

::: check
A colleague suggests fixing negative eigenvalues by clipping each negative eigenvalue of $\mathbf P$ to a small positive number after every update, instead of adopting the square-root form. What does this fix, and what does it not?
:::

::: answer
It keeps the filter running: the next Cholesky factorization succeeds, which is a real, practical benefit.

It does not explain or cure the cause, and it silently throws information away. An eigenvalue of $-8742$ is not "about zero". It is a sign that the pooled covariance went badly wrong in that direction. Replacing it with a small positive number is a guess about the true uncertainty there — and a small variance is an *overconfident* guess, the very failure that ruins filters. The square-root form never builds the invalid matrix and reports the failure instead, and fixing the cause (sensible $\alpha$, non-negative centre weight, careful angle handling) stops it from happening at all.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unscented transform | $2n+1$ sigma points at $\hat{\mathbf x}$ and $\hat{\mathbf x}\pm$ columns of $\mathbf S$, with $\mathbf S\mathbf S^{\mathsf T}=(n+\lambda)\mathbf P$; push through the true $\mathbf g$; pool with $W^{(m)}$, $W^{(c)}$. No Jacobian |
| Accuracy | Mean to third order, covariance to second order, for any nonlinearity; EKF is first order |
| $\lambda$ | $\lambda=\alpha^2(n+\kappa)-n$; sets the spread $\sqrt{n+\lambda}$ and every weight |
| $\alpha,\beta,\kappa$ | $\alpha$ from $10^{-3}$ to $1$ sets the spread; $\kappa$ usually $0$ or $3-n$; $\beta=2$ best for a Gaussian |
| UKF update | $\mathbf K=\mathbf P_{xz}\mathbf P_{zz}^{-1}$, $\mathbf P^+=\mathbf P^--\mathbf K\mathbf P_{zz}\mathbf K^{\mathsf T}$ |
| Small $\alpha$ | Weights of size about $1/\alpha^2$ that cancel to $1$; slips get magnified |
| Negative $W_0^{(c)}$ | The covariance can come out indefinite, even with exact arithmetic |
| Square-root UKF | Carry $\mathbf S$ with $\mathbf P=\mathbf S\mathbf S^{\mathsf T}$; QR and Cholesky updates and downdates keep it valid by construction |

This lesson built the machinery on single transforms and single steps. The next lesson runs the UKF over a whole tracking run, on the exact scenario where the EKF collapsed, and prices what the extra points cost.

::: context why-unscented A name from a deodorant
Jeffrey Uhlmann developed the transform with Simon Julier in the mid-1990s. He has said he wanted a name that did not sound like jargon, noticed a stick of unscented deodorant on a colleague's desk, and borrowed the word. It stuck. There is no hidden meaning: "unscented" does not describe anything about the mathematics. Some authors prefer the plainer name "sigma-point Kalman filter", which covers the UKF and its cousins such as the cubature filter in lesson 6.
:::

::: context sigma-picture Five points for a two-number state
For $n = 2$ there are five sigma points: the mean, and a pair on each axis of the uncertainty ellipse. With $\alpha = 1$ and $\kappa = 0$ the pairs sit $\sqrt 2 \approx 1.41$ standard deviations out, just outside the one-sigma ellipse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="90" rx="80" ry="40" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="90" x2="300" y2="90" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="25" x2="180" y2="155" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="90" r="6" fill="#b4232c"/>
  <circle cx="293.1" cy="90" r="6" fill="#1f2a44"/>
  <circle cx="66.9" cy="90" r="6" fill="#1f2a44"/>
  <circle cx="180" cy="33.4" r="6" fill="#1f2a44"/>
  <circle cx="180" cy="146.6" r="6" fill="#1f2a44"/>
  <text x="192" y="84" font-size="12" fill="#b4232c">mean</text>
  <text x="250" y="126" font-size="12" fill="#1d6fd1">1-sigma ellipse</text>
  <text x="296" y="78" font-size="12" fill="#1f2a44">+1.41σ</text>
  <text x="20" y="78" font-size="12" fill="#1f2a44">−1.41σ</text>
  <text x="10" y="172" font-size="12" fill="#1f2a44">2n + 1 = 5 points for n = 2</text>
</svg>
```

When $\mathbf P$ has correlations, the ellipse tilts and the Cholesky columns are no longer along the page axes, but the idea is the same.
:::

::: context matrix-square-root Square roots of a matrix
A number like $9$ has a square root $3$ because $3 \times 3 = 9$. A covariance matrix $\mathbf P$ has a "square root" $\mathbf S$ when $\mathbf S\mathbf S^{\mathsf T} = \mathbf P$. Unlike numbers, a matrix has many such roots: rotate the columns of one and you get another. The **Cholesky factor** is the one that is lower-triangular (zeros above the diagonal); a computer finds it in about $n^3/3$ operations and it only exists when $\mathbf P$ is positive definite. That is why a broken covariance crashes a UKF: the very next Cholesky call fails. Any valid root gives the same mean and covariance from the transform.
:::

::: context monte-carlo Checking by brute force
A **Monte Carlo** check draws a huge number of random samples from the input bell curve, pushes every one through the function, and measures the average and spread of the results. With millions of samples it is very accurate, but far too slow to run inside a filter every step. Engineers use it offline as the referee. It is named after the casino in Monaco, a nod to its reliance on chance, and it was used seriously for the first time in the 1940s in nuclear weapons work at Los Alamos.
:::

::: context banana Why the average falls inside the arc
With the bearing so uncertain, the true points spread along an arc around the radar. The tangent line puts the mean on the arc; the real average of an arc lies inside it, closer to the sensor. The dots are the five sigma points for $\alpha = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M22.5,72.2 L46.9,59.5 L72.3,49.0 L98.5,40.7 L125.3,34.8 L152.5,31.2 L180.0,30.0 L207.5,31.2 L234.7,34.8 L261.5,40.7 L287.7,49.0 L313.1,59.5 L337.5,72.2 L322.5,98.2 L300.4,86.7 L277.5,77.2 L253.8,69.7 L229.5,64.3 L204.8,61.1 L180.0,60.0 L155.2,61.1 L130.5,64.3 L106.2,69.7 L82.5,77.2 L59.6,86.7 L37.5,98.2 Z" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="180" cy="45" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="23.8" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="66.2" r="4" fill="#1f2a44"/>
  <circle cx="288.6" cy="65.3" r="4" fill="#1f2a44"/>
  <circle cx="71.4" cy="65.3" r="4" fill="#1f2a44"/>
  <line x1="165" y1="45" x2="195" y2="45" stroke="#f2b880" stroke-width="3"/>
  <line x1="165" y1="55.1" x2="195" y2="55.1" stroke="#b4232c" stroke-width="3"/>
  <text x="200" y="20" font-size="12" fill="#1f2a44">tangent-line mean: on the arc</text>
  <text x="200" y="100" font-size="12" fill="#b4232c">true mean: 33.7 m inside</text>
  <line x1="198" y1="96" x2="186" y2="58" stroke="#b4232c" stroke-width="1"/>
  <text x="10" y="140" font-size="12" fill="#1f2a44">band: ±1σ in range and ±2σ in bearing; radar far below</text>
</svg>
```

The picture is to scale: 1 pixel is about 3.3 m.
:::

::: context frobenius One number for a whole matrix error
To say how far one $2 \times 2$ covariance is from another, subtract them and take the square root of the sum of the squares of all the entries. That is the **Frobenius norm** of the difference, named after the German mathematician Georg Frobenius. It works like the length of an arrow, but for a grid of numbers. Its units here are $\mathrm{m^2}$, the same as the entries. It is a blunt measure, but it is enough to rank three approximations on the same problem.
:::

::: context kurtosis What beta remembers about the bell
The mean is the first moment of a distribution and the variance is the second. The **fourth moment** measures how heavy the tails are: for a Gaussian, the average of $(x-\mu)^4$ is exactly $3\sigma^4$. That fixed ratio of $3$ is the bell curve's **kurtosis**. The covariance formula involves squares of squares, so it quietly depends on the fourth moment. With $\beta = 2$ the centre weight adds just the right amount to match a Gaussian's fourth moment in the leading correction term. For a distribution with heavier tails, a larger $\beta$ can do better.
:::

::: context cancellation Finding a small number as a big difference
Weigh a ship with its captain aboard, then without, and subtract: you will not learn the captain's weight, because each ship weighing is uncertain by far more than a person weighs. Computers have the same problem. A double-precision number keeps about $16$ significant digits. If an answer near $1$ is the difference of two numbers near $10^6$, about six of those digits are spent on the cancellation — and any error in the inputs, from rounding or from a modelling shortcut such as an angle wrap, is magnified by the same factor.
:::

::: context eigen-ellipse What a negative eigenvalue looks like
A valid covariance draws an ellipse: every direction has a positive variance, and the eigenvalues are the squared half-lengths of the axes. Make one eigenvalue negative and the "ellipse" becomes a pair of hyperbolas, a shape that claims negative uncertainty along one axis. No real spread of points looks like that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <ellipse cx="90" cy="80" rx="60" ry="30" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">both eigenvalues positive</text>
  <path d="M335.9,33.2 L322.9,44.8 L313.2,54.1 L306.3,61.9 L301.6,68.5 L298.9,74.4 L298.0,80.0 L298.9,85.6 L301.6,91.5 L306.3,98.1 L313.2,105.9 L322.9,115.2 L335.9,126.8" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M204.1,33.2 L217.1,44.8 L226.8,54.1 L233.7,61.9 L238.4,68.5 L241.1,74.4 L242.0,80.0 L241.1,85.6 L238.4,91.5 L233.7,98.1 L226.8,105.9 L217.1,115.2 L204.1,126.8" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="150" font-size="12" text-anchor="middle" fill="#b4232c">one eigenvalue negative</text>
</svg>
```

The Cholesky factorization only exists for the left-hand kind, which is why the filter crashes on the right-hand kind.
:::

::: context bridge-sqrt The same cure, twice
In the Kalman filter module, square-root and $\mathbf U\mathbf D\mathbf U^{\mathsf T}$ forms were the answer to a covariance losing positive definiteness through rounding when measurements are very precise. Here the trigger is a negative sigma-point weight. The remedy is the same: never let the algorithm rely on a subtraction staying positive. Rudolph van der Merwe and Eric Wan published the square-root UKF in 2001. The cubature filter in lesson 6 comes with a square-root version too.
:::
