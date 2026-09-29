---
id: l06-the-cubature-kalman-filter
title: The cubature Kalman filter
minutes: 18
covers:
  - The cubature Kalman filter
---

Suppose you want the average temperature of a swimming pool. You cannot measure every drop. So you dip a thermometer at a few spots and average the readings. If you choose the spots well — not all by the heater, not all in the shade — a handful of readings gives an excellent average. Picking good spots and good weights for such an average is an old branch of mathematics called **numerical integration**, because an average over a whole region is an integral.

The last two lessons pushed a Gaussian through a curved function by choosing sigma points with three knobs, $\alpha$, $\beta$ and $\kappa$. Knobs give flexibility, but a knob with no clearly right setting is a knob someone can set wrong, and lesson 4 showed that $\alpha = 10^{-3}$ brings weights near $\pm 10^6$ with real numerical consequences. The **cubature Kalman filter** (**CKF**) — a Kalman filter whose points come from a numerical-integration rule — answers the same question with a point set that has *no* knobs at all. It was published in 2009 by [[Arasaratnam and Haykin|ckf-origin]], and it has since been applied to spacecraft navigation and radar tracking. It comes from different mathematics, but this lesson shows, with exact numbers, that it turns out to be a very close relative of the UKF.

## Averages are integrals

Both filter steps need averages over a Gaussian. The predicted mean, for example, is the average value of $\mathbf g(\mathbf x)$ when $\mathbf x$ is spread like a bell curve:

$$
\hat{\mathbf y} = \int \mathbf g(\mathbf x)\,\mathcal N(\mathbf x;\hat{\mathbf x},\mathbf P)\,d\mathbf x .
$$

Read $\mathcal N(\mathbf x;\hat{\mathbf x},\mathbf P)$ as "the normal (Gaussian) density at $\mathbf x$, with mean x hat and covariance P". It is the weight each possible $\mathbf x$ gets. The integral sign $\int$ means "add up over every possible $\mathbf x$". So this is a weighted average of $\mathbf g$, with more weight near the mean. The covariance is the same kind of integral with $(\mathbf g - \hat{\mathbf y})(\mathbf g - \hat{\mathbf y})^{\mathsf T}$ inside.

A computer cannot add up infinitely many values. A **quadrature rule** — a recipe of a few points and weights that stands in for the whole integral — replaces it by a finite sum, $\sum_i w_i\,\mathbf g(\boldsymbol\xi_i)$ (read $\boldsymbol\xi$ as "xi", said "ksee" or "zai"). A good rule is exact for every polynomial up to some **degree**: degree $1$ means straight lines, degree $2$ adds squares, degree $3$ adds cubes. In more than one dimension such a rule is called a **[[cubature|cubature-word]]** rule.

Here is the simplest good rule in one dimension. For a bell curve with mean $\mu$ and standard deviation $\sigma$, put two points at $\mu - \sigma$ and $\mu + \sigma$ with weight $\tfrac12$ each. Check it on powers of $(x - \mu)$:

- degree $0$: $\tfrac12 + \tfrac12 = 1$, the total weight, correct;
- degree $1$: $\tfrac12(-\sigma) + \tfrac12(\sigma) = 0$, correct, since a bell is symmetric;
- degree $2$: $\tfrac12\sigma^2 + \tfrac12\sigma^2 = \sigma^2$, the variance, correct;
- degree $3$: $\tfrac12(-\sigma^3) + \tfrac12\sigma^3 = 0$, correct, by symmetry again.

So two well-placed points average any cubic exactly. This is a [[Gauss–Hermite|gauss-hermite]] rule, and the cubature rule is its many-dimensional version.

## The cubature rule

Where the unscented transform used $2n+1$ points, the cubature rule uses exactly $2n$, with no center point. They sit along the columns of a matrix square root of $\mathbf P$, stretched by $\sqrt n$, and every weight is the same.

::: key The (third-degree) cubature rule
With $\mathbf S$ any matrix square root satisfying $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$, the cubature points and weights are
$$
\boldsymbol\xi_i = \hat{\mathbf x}+[\mathbf S]_i, \qquad \boldsymbol\xi_{n+i}=\hat{\mathbf x}-[\mathbf S]_i \quad (i=1,\ldots,n), \qquad w_i=\frac1{2n}\ \ \text{for every }i.
$$
Propagate each point through the true, unmodified $\mathbf g$ and pool the mean and covariance exactly as the unscented transform does, with these uniform, always positive weights.
:::

Where does the $\sqrt n$ come from? Picture the standard bell in $n$ dimensions, a cloud of points. Split each point into a **direction** and a **distance** from the center. The rule averages over directions using the $2n$ points where the axes pierce a sphere, and over distances using a single typical distance. For a standard $n$-dimensional bell the squared distance from the center averages exactly $n$, so the typical distance is $\sqrt n$. Put the $2n$ direction points out at that distance and you have the rule. This is why it is called a **[[spherical-radial|spherical-radial]]** rule: spherical for the directions, radial for the distance.

::: note Why it has to be true
Work in standard coordinates, where $\hat{\mathbf x} = \mathbf 0$ and $\mathbf P = \mathbf I$; the matrix square root maps the answer back to any $\hat{\mathbf x}$ and $\mathbf P$. The points are $\pm\sqrt n\,\mathbf e_i$, where $\mathbf e_i$ is the unit vector along axis $i$, each with weight $\tfrac{1}{2n}$.

- Degree $0$: $2n \times \tfrac{1}{2n} = 1$.
- Degree $1$ and $3$: every point has a partner at minus itself, so every odd power averages to $0$ — as it does for the bell.
- Degree $2$: $\sum_i w_i \boldsymbol\xi_i\boldsymbol\xi_i^{\mathsf T} = \tfrac{1}{2n} \times 2 \times n \sum_i \mathbf e_i\mathbf e_i^{\mathsf T} = \mathbf I$, the bell's covariance.

So the rule is exact for every polynomial up to degree $3$. Degree $4$ is where it stops: along one axis the rule gives $\sum_i w_i \xi_{i,1}^4 = 2 \times \tfrac{1}{2n} \times n^2 = n$, while the bell's true fourth moment is $3$. Only at $n = 3$ do these agree. (The unscented choice $\kappa = 3 - n$ comes from exactly this observation.)
:::

::: example A cubature average by hand
Take $n = 2$, $\hat{\mathbf x} = (1,\ -2)$ and $\mathbf P = \operatorname{diag}(4,\ 1)$, meaning the variances are $4$ and $1$ and there is no correlation. Push through $g(\mathbf x) = x_1^2 + x_2$.

**Exact answer.** The average of $x_1^2$ is (mean squared) plus (variance) $= 1 + 4 = 5$, and the average of $x_2$ is $-2$. So the true mean of $g$ is $5 - 2 = 3$.

**Tangent line (EKF).** $g(\hat{\mathbf x}) = 1^2 + (-2) = -1$. Off by $4$, the whole variance of $x_1$.

**Cubature.** $n\mathbf P = \operatorname{diag}(8,\ 2)$, so $\mathbf S = \operatorname{diag}(\sqrt 8,\ \sqrt 2) = \operatorname{diag}(2.8284,\ 1.4142)$. The four points are $(3.8284,\ -2)$, $(1,\ -0.5858)$, $(-1.8284,\ -2)$ and $(1,\ -3.4142)$, each with weight $\tfrac14$.

Evaluate $g$ at each: $3.8284^2 - 2 = 12.657$, then $1 - 0.5858 = 0.414$, then $(-1.8284)^2 - 2 = 1.343$, then $1 - 3.4142 = -2.414$. Average them:

$$
\tfrac14(12.657 + 0.414 + 1.343 - 2.414) = \tfrac14(12.000) = 3.000.
$$

Exact, as it must be for a degree-$2$ function, with no Jacobian and no tuning. Sanity check: the points average to $(1,\ -2)$, the mean, as they should.
:::

Notice what is missing: no $\alpha$, no $\beta$, no $\kappa$ and no center point. Every weight is positive and equal, so the huge canceling weights of a small-$\alpha$ UKF cannot happen.

## The cubature points are UKF points in disguise

Now the surprise. Take the scaled unscented transform and set $\alpha = 1$ and $\kappa = 0$. Then

$$
\lambda = \alpha^2(n + \kappa) - n = 1^2(n + 0) - n = 0
$$

exactly, for every $n$. So the center's mean weight is $W_0^{(m)} = \lambda/(n+\lambda) = 0/n = 0$: the center point still exists but adds nothing to the mean. The stretch is $\sqrt{n + \lambda} = \sqrt n$, exactly the cubature stretch. And each outer weight is $1/(2(n + \lambda)) = 1/(2n)$, exactly the cubature weight.

::: example Two formulas, one set of points
Build both point sets on a real $3 \times 3$ covariance,

$$
\mathbf P = \mathbf A\mathbf A^{\mathsf T}+2\mathbf I, \qquad \mathbf A=\begin{pmatrix}2.041 & -2.556 & 0.418\\ -0.568 & -0.453 & -0.216\\ -2.020 & -0.232 & -0.865\end{pmatrix},
$$

around $\hat{\mathbf x} = (1,\ -2,\ 0.5)$. Compute the six outer UKF sigma points ($\alpha = 1$, $\beta = 2$, $\kappa = 0$) from the UKF formula, and the six cubature points from the cubature formula. The largest difference between them is $0.0$ — not small, but zero, to the [[last bit|last-bit]] of floating-point precision. The UKF's outer weight is $\tfrac16 = 0.166667$, identical to the cubature weight $\tfrac{1}{2n}$. The UKF's center weights come out as $W_0^{(m)} = 0$ and $W_0^{(c)} = 2$.
:::

```python
import numpy as np

def sigma_points_ukf(x, P, alpha, beta, kappa):
    n = len(x); lam = alpha**2*(n + kappa) - n
    S = np.linalg.cholesky((n + lam)*P)
    chi = np.zeros((2*n + 1, n)); chi[0] = x
    for i in range(n):
        chi[i+1] = x + S[:, i]; chi[n+i+1] = x - S[:, i]
    Wm = np.full(2*n + 1, 1.0/(2*(n + lam))); Wc = Wm.copy()
    Wm[0] = lam/(n + lam); Wc[0] = lam/(n + lam) + (1 - alpha**2 + beta)
    return chi, Wm, Wc

def cubature_points(x, P):
    n = len(x); S = np.linalg.cholesky(n*P)
    pts = np.zeros((2*n, n))
    for i in range(n):
        pts[i] = x + S[:, i]; pts[n+i] = x - S[:, i]
    return pts, np.full(2*n, 1.0/(2*n))

n = 3
rng = np.random.default_rng(3)
x = np.array([1.0, -2.0, 0.5])
A = rng.standard_normal((n, n)); P = A@A.T + 2*np.eye(n)
chi, Wm, Wc = sigma_points_ukf(x, P, alpha=1.0, beta=2.0, kappa=0.0)
pts, w = cubature_points(x, P)
print(np.max(np.abs(chi[1:] - pts)))   # 0.0 -- exact match
print(Wm[0], Wc[0], Wm[1], w[0])       # 0.0 2.0 0.16666666666666666 0.16666666666666666
```

## The one real difference: the beta term

If the outer points and weights are identical, what separates the two filters? Only the **center point's covariance weight**. The UKF's is

$$
W_0^{(c)} = \frac{\lambda}{n+\lambda} + (1 - \alpha^2 + \beta),
$$

and at $\lambda = 0$, $\alpha = 1$ this is exactly $\beta$. With the standard Gaussian choice $\beta = 2$, the center point gets weight $0$ in the mean but weight $2$ in the covariance. That is a small correction that carries the bell curve's fourth-moment shape into the covariance. The cubature rule has no center point, so it has no such term. In this precise sense it is the $\alpha = 1$, $\kappa = 0$, $\beta = 0$ member of the unscented family, with the center point — which would carry zero weight in both the mean and the covariance — simply left out.

::: key CKF as a special case, stated precisely
The cubature Kalman filter's point set is exactly the unscented transform's sigma points at $\alpha=1,\ \kappa=0$, with the zero-mean-weight center point dropped. The two filters share every mean that this tuning of the UKF produces, and differ only in the covariance's center-point correction, which the UKF calls $\beta$ and the CKF fixes, implicitly, at $0$.
:::

Everything else about the filter is the UKF of lesson 4: predict by pushing the points through $\mathbf f$ and adding $\mathbf Q$; update by pushing fresh points through $\mathbf h$, forming $\mathbf P_{zz}$ and $\mathbf P_{xz}$, and using $\mathbf K = \mathbf P_{xz}\mathbf P_{zz}^{-1}$. There is a square-root CKF too, and because every weight is positive, its square root can be built entirely from a QR factorization, with no risky downdates.

::: example The range-and-bearing problem, with cubature points
Go back to lesson 4's radar: range $1000\,\mathrm m$ with standard deviation $50\,\mathrm m$, bearing $30^\circ$ with standard deviation $15^\circ$, converted to east and north. With $n = 2$ the cubature rule uses four points, and weight $\tfrac14$ each.

**Mean.** $(836.68,\ 483.06)\,\mathrm m$ — identical to the $\alpha = 1$ unscented mean, as it must be, because the center point never entered that mean. It is $0.19\,\mathrm m$ from the exact mean $(836.85,\ 483.16)\,\mathrm m$.

**Covariance.**

$$
\begin{pmatrix}19{,}102 & -26{,}767\\-26{,}767 & 50{,}010\end{pmatrix}\mathrm{m^2}.
$$

Its Frobenius error against the exact covariance is $1536\,\mathrm{m^2}$. The $\alpha = 1$, $\beta = 2$ unscented result had $1887\,\mathrm{m^2}$, and the tangent line $4784\,\mathrm{m^2}$.

So dropping the $\beta = 2$ correction happened to help a little on this problem. That is a fact about this particular curve's higher moments, not proof that $\beta = 0$ is better in general. $\beta$ encodes a correction that is right on average for a Gaussian input; it is not promised to help every single function.
:::

```python
import numpy as np

def cubature_points(x, P):
    n = len(x); S = np.linalg.cholesky(n*P)
    pts = np.zeros((2*n, n))
    for i in range(n):
        pts[i] = x + S[:, i]; pts[n+i] = x - S[:, i]
    return pts, np.full(2*n, 1.0/(2*n))

def polar_to_cart(rt):
    r, th = rt
    return np.array([r*np.cos(th), r*np.sin(th)])

mean0 = np.array([1000.0, np.radians(30.0)])
P0 = np.diag([50.0**2, np.radians(15.0)**2])
pts, w = cubature_points(mean0, P0)
Y = np.array([polar_to_cart(p) for p in pts])
y_mean = w @ Y
D = Y - y_mean
y_cov = (w*D.T) @ D
print(y_mean.round(2), y_cov.round(0).tolist())
# [836.68 483.06] [[19102.0, -26767.0], [-26767.0, 50010.0]]
```

::: warning "No tuning parameters" is a trade, not a pure win
The CKF's fixed weights avoid the small-$\alpha$ cancellation problem entirely: every weight is positive and equal. What it gives up is exactly what the knobs were for. It cannot pull its points closer for a model that is only trustworthy near the estimate, as a small $\alpha$ can. And it cannot encode a known non-Gaussian tail shape, as $\beta$ can. Choosing between them is choosing between one fixed rule that behaves predictably and a tunable family that can be matched more closely to what you know — at the price of a setting someone must get right.
:::

::: warning The points drift outward as the state grows
The cubature points sit $\sqrt n$ standard deviations out. For $n = 4$ that is $2$; for a $100$-state filter it is [[ten standard deviations|far-points]]. Out there a model may be meaningless — a negative altitude, a quaternion far from unit length — and a single wild evaluation, weighted like all the others, can spoil the average. The UKF at $\alpha = 1$, $\kappa = 0$ has the same habit, since it uses the same points. For large states, check where your points actually land.
:::

## Check yourself

::: check
For $n = 6$ states, how many points does the cubature rule use, and how does that compare with the unscented transform?
:::

::: answer
The cubature rule uses $2n = 12$ points, with no center point. The unscented transform uses $2n + 1 = 13$, one more.

At the $\alpha = 1$, $\kappa = 0$ tuning where the two rules coincide, that extra center point has zero weight in the mean. So both produce the same mean from what are effectively the same $12$ points.
:::

::: check
Why is the agreement between the UKF's outer sigma points and the cubature points, at $\alpha = 1$, $\kappa = 0$, called exact rather than approximate?
:::

::: answer
Both point sets reduce, by algebra, to $\hat{\mathbf x}\pm[\mathbf S]_i$ with $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$. The UKF's stretch $\sqrt{n+\lambda}$ equals $\sqrt n$ exactly when $\lambda = \alpha^2(n+\kappa) - n = 0$, and at $\alpha = 1$, $\kappa = 0$ that is the identity $1^2(n + 0) - n = 0$, true for every $n$ with no approximation.

So the two formulas compute the identical numbers from the identical covariance. Any code that uses the same matrix square root for both will agree to the last bit, which is exactly the $0.0$ difference the worked example printed.
:::

::: check
A designer wants a UKF whose covariance weights exactly match the cubature filter's, without switching filters. Starting from $\alpha = 1$, $\beta = 2$, $\kappa = 0$, which single parameter should change?
:::

::: answer
Set $\beta = 0$ and keep $\alpha = 1$, $\kappa = 0$. Then

$$
W_0^{(c)} = \frac{\lambda}{n+\lambda} + (1 - \alpha^2 + \beta) = 0 + (1 - 1 + 0) = 0.
$$

The center point now contributes nothing to the covariance, and every remaining weight is $\tfrac{1}{2n}$, the cubature weight. The filter still calls itself a UKF but reproduces the CKF exactly — which is precisely the sense in which the CKF is a special case rather than a separate algorithm.
:::

::: check
In the range-and-bearing example, the cubature mean matched the $\alpha = 1$ unscented mean exactly. Is that a coincidence of this problem, or a general property?
:::

::: answer
A general property. Whenever $\lambda = 0$, which happens at $\alpha = 1$, $\kappa = 0$ whatever the function, the center point's mean weight is zero. The UKF mean $\sum_i W_i^{(m)}\mathbf y_i$ then never uses $\mathbf g(\boldsymbol\chi_0)$ at all. It is built only from the same $2n$ outer points, with the same weights $\tfrac{1}{2n}$, as the cubature mean. So the two means agree for every nonlinear $\mathbf g$, not only this one.
:::

::: check
Is the cubature Kalman filter more or less exposed than a small-$\alpha$ UKF to the large-canceling-weights problem from lesson 4? Justify it from the weight formulas.
:::

::: answer
Less exposed. Every cubature weight is exactly $\tfrac{1}{2n}$: positive, equal, and never large. There is nothing like the UKF's outer weights of size about $1/\alpha^2$, or its huge negative center weight that must cancel them.

The cubature weights add to one because $2n$ equal pieces of $\tfrac{1}{2n}$ add to one, with no cancellation at all. And with every weight positive, the pooled covariance is a sum of squares, so it can never show a negative variance.
:::

## Summary

| Item | Statement |
| --- | --- |
| Averages as integrals | Filter means and covariances are Gaussian-weighted integrals; a quadrature or cubature rule replaces each by a weighted sum over a few points |
| Cubature rule | $2n$ points $\hat{\mathbf x}\pm[\mathbf S]_i$ with $\mathbf S\mathbf S^{\mathsf T}=n\mathbf P$, equal weights $\tfrac{1}{2n}$; no center point, no tuning |
| Origin | Third-degree spherical-radial rule: exact for polynomials up to degree $3$; points at the typical distance $\sqrt n$ |
| Relation to the UKF | Identical to the UKF's outer points and weights at $\alpha=1,\kappa=0$, to the last bit; the CKF equals that UKF with $\beta=0$ |
| Range-and-bearing test | Same mean as the $\alpha=1$ UKF; covariance error $1536\,\mathrm{m^2}$ against $1887$ ($\beta=2$) and $4784$ (tangent line) |
| Trade-off | No canceling weights and no knobs to mis-set, but no way to shrink the spread or encode tail shape; points drift out as $\sqrt n$ |

Every filter in this module so far — EKF, UKF and CKF — shares one assumption under all their differences: the belief is a single Gaussian, however it is pushed through the curve. The next lesson drops that assumption and represents the belief as [[a cloud of weighted samples|particle-bridge]] instead.

::: context ckf-origin Where the CKF came from
Ienkaran Arasaratnam and Simon Haykin, at McMaster University in Canada, published "Cubature Kalman Filters" in the *IEEE Transactions on Automatic Control* in 2009. They framed nonlinear filtering as a problem of computing Gaussian-weighted integrals well, and chose the rule that is exact to third degree with the fewest points and only positive weights. Their paper also gave a square-root version. Soon afterwards other researchers pointed out the equivalence with the UKF at $\alpha = 1$, $\kappa = 0$, $\beta = 0$ that this lesson demonstrates.
:::

::: context cubature-word Squares, cubes and the names of integrals
To "square" a shape once meant to find a square with the same area — the ancient puzzle of "squaring the circle". So finding an area, a one-dimensional integral, came to be called **quadrature**, from the Latin for "making square". Finding a volume, an integral in several dimensions, is **cubature**, "making a cube". Today "quadrature" usually means a numerical rule for a one-dimensional integral and "cubature" a rule for many dimensions.
:::

::: context gauss-hermite Two points that average any cubic
Carl Friedrich Gauss showed in 1814 that by choosing *where* to sample, not only *how* to weight, $k$ points can integrate every polynomial up to degree $2k - 1$ exactly. The version for bell-curve weights is named after Charles Hermite, whose polynomials it uses. For $k = 2$ the points are at $\mu \pm \sigma$ with weight $\tfrac12$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20,129.5 L30,129.0 L40,128.2 L50,126.9 L60,124.9 L70,122.0 L80,117.8 L90,112.2 L100,105.0 L110,96.2 L120,86.2 L130,75.4 L140,64.6 L150,54.8 L160,46.9 L170,41.8 L180,40.0 L190,41.8 L200,46.9 L210,54.8 L220,64.6 L230,75.4 L240,86.2 L250,96.2 L260,105.0 L270,112.2 L280,117.8 L290,122.0 L300,124.9 L310,126.9 L320,128.2 L330,129.0 L340,129.5" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="130" x2="180" y2="36" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="130" y1="130" x2="130" y2="75.4" stroke="#b4232c" stroke-width="2"/>
  <line x1="230" y1="130" x2="230" y2="75.4" stroke="#b4232c" stroke-width="2"/>
  <circle cx="130" cy="130" r="6" fill="#b4232c"/>
  <circle cx="230" cy="130" r="6" fill="#b4232c"/>
  <text x="130" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">μ − σ, weight ½</text>
  <text x="230" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">μ + σ, weight ½</text>
  <text x="180" y="28" font-size="12" text-anchor="middle" fill="#1f2a44">μ</text>
</svg>
```

Two points, four moments right: total weight, mean, variance and the zero third moment.
:::

::: context spherical-radial Directions times distance
For $n = 2$ the cubature points lie on a circle of radius $\sqrt 2 \approx 1.41$ standard deviations, where the two axes cross it. Four directions on the circle average over "which way"; the single radius stands in for "how far". The dashed circle is one standard deviation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="100" r="60" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="180" cy="100" r="84.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="264.9" cy="100" r="6" fill="#b4232c"/>
  <circle cx="95.1" cy="100" r="6" fill="#b4232c"/>
  <circle cx="180" cy="15.1" r="6" fill="#b4232c"/>
  <circle cx="180" cy="184.9" r="6" fill="#b4232c"/>
  <circle cx="180" cy="100" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="272" y="92" font-size="12" fill="#1f2a44">√2 σ</text>
  <text x="222" y="130" font-size="12" fill="#6c7a93">1σ</text>
  <text x="190" y="96" font-size="11" fill="#1f2a44">no centre point</text>
  <text x="10" y="195" font-size="12" fill="#1f2a44">2n = 4 points, weight ¼ each</text>
</svg>
```

In standard coordinates (where $\mathbf P = \mathbf I$) the picture is a circle; the matrix square root then stretches it into the real uncertainty ellipse.
:::

::: context last-bit When zero really means zero
Floating-point arithmetic usually leaves tiny traces of rounding, so two routes to "the same" number often differ by something like $10^{-15}$. A difference of exactly $0.0$ says more: both codes performed the very same operations on the very same inputs. Here both scale $\mathbf P$ by $n$ (because $n + \lambda$ is exactly $n$ when $\lambda$ is exactly $0$), call the same Cholesky routine, and add and subtract the same columns. That is the strongest possible numerical evidence that the two rules are one rule.
:::

::: context far-points Points in places the model never meant
Why does the distance grow like $\sqrt n$? In $n$ dimensions, each axis adds its own variance to the squared distance from the center, so a typical draw from the bell sits about $\sqrt n$ standard deviations out, even though along any single axis it is usually within one. This graph shows that distance for different $n$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="350" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="30">n = 1</text><text x="36" y="50">n = 4</text><text x="36" y="70">n = 9</text><text x="36" y="90">n = 25</text><text x="36" y="110">n = 50</text><text x="36" y="130">n = 100</text>
  </g>
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1">
    <rect x="40" y="18" width="30" height="16"/><rect x="40" y="38" width="60" height="16"/><rect x="40" y="58" width="90" height="16"/><rect x="40" y="78" width="150" height="16"/><rect x="40" y="98" width="212.1" height="16"/><rect x="40" y="118" width="300" height="16"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="76" y="30">1σ</text><text x="106" y="50">2σ</text><text x="136" y="70">3σ</text><text x="196" y="90">5σ</text><text x="258" y="110">7.07σ</text><text x="300" y="156">10σ</text>
  </g>
</svg>
```

A sensor model evaluated ten standard deviations away may be asked about an impossible state. Some designers use higher-degree cubature rules or a smaller spread for large $n$ for exactly this reason.
:::

::: context particle-bridge Beyond one bell curve
A particle filter keeps hundreds or thousands of sample states, each with a weight saying how well it explains the measurements so far. It can represent two separate peaks, a banana, or any lumpy belief, which no single Gaussian can. The price, as lesson 8 shows, is that the number of samples needed grows very fast with the size of the state.
:::
