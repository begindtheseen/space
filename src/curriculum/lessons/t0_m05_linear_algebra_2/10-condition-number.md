---
id: l10-condition-number
title: The condition number
minutes: 23
covers:
  - condition number
---

Lesson 9 kept returning to one fact: a small singular value divides your noise by a small number and hands back a large, unreliable answer. That was a statement about one matrix and one noise vector. The condition number turns it into a number you can compute before you have any data, look at once, and use to decide whether a solve is worth trusting at all.

The question it answers is narrow and useful. If the right-hand side of $\mathbf{A}\mathbf{x} = \mathbf{b}$ is wrong by one part in a million — sensor quantisation, a truncated constant, the last bit of a float — how wrong can $\mathbf{x}$ be? The answer is "up to $\kappa(\mathbf{A})$ parts in a million", and $\kappa$ is a property of $\mathbf{A}$ alone. Since the inputs to every GNC solve carry error at *some* level, and floating-point arithmetic injects error at the $10^{-16}$ level whether you like it or not, $\kappa$ sets the accuracy ceiling for the whole computation.

This lesson derives the amplification bound, defines $\kappa$ and lists its properties, establishes the rule of thumb that converts $\kappa$ into decimal digits lost, proves that forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ squares it, and reads the condition number in three GNC settings: a clock fit that fails for no reason other than the units of time, a beacon geometry where $\kappa$ *is* the dilution of precision, and the innovation covariance of a filter update.

## How much can a solve amplify an error?

Take a square invertible $\mathbf{A}$ and the exact solution $\mathbf{A}\mathbf{x} = \mathbf{b}$. Perturb the right-hand side to $\mathbf{b} + \delta\mathbf{b}$ and let $\mathbf{x} + \delta\mathbf{x}$ be the new exact solution. Subtracting, $\mathbf{A}\,\delta\mathbf{x} = \delta\mathbf{b}$, so $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$.

Two bounds from Lesson 8. First, $\mathbf{A}^{-1}$ stretches by at most its largest singular value, which is $1/\sigma_{\min}$, so

$$\|\delta\mathbf{x}\| \le \frac{\|\delta\mathbf{b}\|}{\sigma_{\min}}.$$

Second, $\mathbf{A}$ stretches by at most $\sigma_{\max}$, so $\|\mathbf{b}\| = \|\mathbf{A}\mathbf{x}\| \le \sigma_{\max}\|\mathbf{x}\|$, which rearranges to $1/\|\mathbf{x}\| \le \sigma_{\max}/\|\mathbf{b}\|$. Multiply the two:

$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \le \frac{\sigma_{\max}}{\sigma_{\min}}\cdot\frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}.$$

The relative error in the answer is at most $\sigma_{\max}/\sigma_{\min}$ times the relative error in the data. Nothing was thrown away: the bound is attained when $\delta\mathbf{b}$ points along $\mathbf{u}_{\min}$ — the output direction the matrix reaches least — while $\mathbf{b}$ points along $\mathbf{u}_{\max}$. Worst cases like that are not exotic; a nearly-degenerate measurement geometry arranges them for you.

The same factor governs error in the matrix itself, which is the more common situation: $\mathbf{A}$ is built from a modelled geometry, from a Jacobian, from time tags, and none of those are exact. Solving $(\mathbf{A} + \delta\mathbf{A})(\mathbf{x} + \delta\mathbf{x}) = \mathbf{b}$ and dropping the second-order term $\delta\mathbf{A}\,\delta\mathbf{x}$ gives $\mathbf{A}\,\delta\mathbf{x} \approx -\delta\mathbf{A}\,\mathbf{x}$, so $\|\delta\mathbf{x}\| \le \|\mathbf{A}^{-1}\|\,\|\delta\mathbf{A}\|\,\|\mathbf{x}\|$ and

$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \lesssim \|\mathbf{A}^{-1}\|_2\,\|\mathbf{A}\|_2\cdot\frac{\|\delta\mathbf{A}\|_2}{\|\mathbf{A}\|_2} = \frac{\sigma_{\max}}{\sigma_{\min}}\cdot\frac{\|\delta\mathbf{A}\|_2}{\|\mathbf{A}\|_2}.$$

The same ratio appears both times, which is why it earns a name.

## The definition and its properties

::: key The 2-norm condition number
$\kappa_2(\mathbf{A}) = \sigma_{\max}/\sigma_{\min} = \lVert\mathbf{A}\rVert_2\,\lVert\mathbf{A}^{-1}\rVert_2$. It bounds the relative error amplification of a linear solve: a relative perturbation $\eta$ in $\mathbf{b}$ or in $\mathbf{A}$ produces a relative error of at most $\kappa_2\eta$ in $\mathbf{x}$. You lose roughly $\log_{10}\kappa$ decimal digits in a solve, so $\kappa = 10^8$ leaves about $8$ of float64's $\approx 16$ digits.
:::

The properties follow straight from the singular values.

- $\kappa \ge 1$ always, since $\sigma_{\max} \ge \sigma_{\min}$. Equality holds exactly when every singular value is the same, which means $\mathbf{A}$ is a scalar multiple of an orthogonal matrix. **Orthogonal matrices are perfectly conditioned.**
- $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A}\mathbf{Q}) = \kappa_2(\mathbf{A})$ for orthogonal $\mathbf{Q}$, because multiplying by an orthogonal matrix leaves every singular value untouched. This is the whole reason numerical linear algebra is built out of rotations and reflections: they rearrange a problem without making it any harder. Lesson 11 cashes the observation in.
- $\kappa(c\mathbf{A}) = \kappa(\mathbf{A})$ for any $c \neq 0$, and $\kappa(\mathbf{A}^{-1}) = \kappa(\mathbf{A})$. Scaling the *whole* matrix changes nothing; scaling one column changes everything, as the next example shows.
- For a symmetric positive definite matrix the singular values are the eigenvalues, so $\kappa_2 = \lambda_{\max}/\lambda_{\min}$. This covers every covariance, information and Gram matrix you will meet.
- For a rectangular matrix of full column rank, $\kappa_2(\mathbf{A}) = \sigma_1/\sigma_n = \lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^+\rVert_2$, using the pseudoinverse of Lesson 9 in place of the inverse. If $\mathbf{A}$ is rank deficient, $\sigma_{\min} = 0$ and $\kappa = \infty$: the condition number and the rank test are the same test seen from two sides.

Other norms give other condition numbers — $\kappa_1$, $\kappa_\infty$ and the Frobenius version are all in use, and they agree with $\kappa_2$ to within a factor of $n$ — but "the condition number" with no qualifier means $\kappa_2$, and that is what `np.linalg.cond` returns by default.

### Digits

Here is where the rule of thumb comes from. A float64 number carries a relative precision of $\varepsilon = 2^{-52} = 2.2\times 10^{-16}$, about $16$ decimal digits. A well-written solver is **backward stable**: the answer it returns is the exact solution of a problem whose matrix and right-hand side differ from yours by a relative amount of order $\varepsilon$. Feed that through the bound above and the relative error in $\mathbf{x}$ is of order $\kappa\varepsilon$. Taking logarithms,

$$\text{correct decimal digits} \approx 16 - \log_{10}\kappa.$$

So $\kappa = 10^3$ costs three digits and nobody notices; $\kappa = 10^8$ leaves eight, which is still plenty for a navigation solution in metres; $\kappa = 10^{16}$ leaves none, and the answer is entirely round-off. Single precision has $\varepsilon = 2^{-23} = 1.2\times 10^{-7}$, about $7$ digits, so a flight computer running float32 hits the wall at $\kappa \approx 10^7$ — a threshold a merely awkward geometry can reach.

Two cautions before the examples. The rule is an estimate of the *worst case*, so a solve with $\kappa = 10^{5}$ often comes out better than the eleven digits it promises; you are being told what you cannot rule out. And the solver does not announce the loss. It returns a number with the usual seventeen digits printed, every one of them after the sixth meaningless.

::: example A clock fit that fails because of the units of time
A GPS receiver estimates its own clock bias over a $20\,\mathrm{s}$ arc by fitting a quadratic, $b(t) = c_0 + c_1t + c_2t^2$, to eleven samples taken every $2\,\mathrm{s}$. The natural time tag is GPS seconds of week, so the samples run from $t = 345590$ to $345610\,\mathrm{s}$ and the design matrix has rows $(1,\ t,\ t^2)$ with $t \approx 3.456\times 10^5$ and $t^2 \approx 1.194\times 10^{11}$.

Three columns of magnitude $1$, $3\times 10^5$ and $10^{11}$ is already a warning. The singular values are $3.96\times 10^{11}$, $20.98$ and $9.81\times 10^{-10}$, so

$$\kappa_2(\mathbf{A}_{\text{raw}}) = \frac{3.96\times 10^{11}}{9.81\times 10^{-10}} = 4.04\times 10^{20}.$$

That is $\log_{10}\kappa = 20.6$ digits of loss against float64's $16$: there is nothing left. Now recentre and rescale time, $\tau = (t - 345600)/10$, so $\tau$ runs over $[-1, 1]$. The same fit in the same physical units has singular values $3.601$, $2.098$ and $1.079$, and

$$\kappa_2(\mathbf{A}_{\text{scaled}}) = 3.34, \qquad \log_{10}\kappa = 0.52.$$

Half a digit. The vehicle, the clock and the data are identical; only the variable changed.

Watch it fail. Take a true clock bias of $120\,\mathrm{ns}$ at mid-arc with a drift of $0.3\,\mathrm{ns/s}$ and a small curvature, giving samples from $117.500$ to $123.500\,\mathrm{ns}$. Solved in float64 through the normal equations, the scaled fit returns every coefficient to twelve digits or better. The raw fit returns $c_0 = 2.115\times 10^{-4}$ where the truth is $0.597093$ — a relative error of $100\%$ in the coefficient vector — and $c_2 = 2.64\times 10^{-15}$ where the truth is $5\times 10^{-12}$, wrong by a factor of nineteen hundred.

The fitted *curve* survives better than the coefficients, because least squares is minimising the residual and not the coefficient error: the raw fit reproduces the samples to within $0.30\,\mathrm{ns}$. But $0.30\,\mathrm{ns}$ of clock error is $0.30\times 10^{-9}\times 2.998\times 10^{8} = 0.090\,\mathrm{m}$ of pseudorange, nine centimetres of navigation error manufactured out of nothing but a choice of epoch. The scaled fit is wrong by $7\times 10^{-14}\,\mathrm{ns}$.

You can see the mechanism without any linear algebra. At mid-arc the three terms of the raw model are $+0.5971$, $-1.1943$ and $+0.5972$ seconds, and they must cancel down to $1.2\times 10^{-7}$: a cancellation of five million to one, which throws away six and a half digits before the solver has done anything at all.
:::

::: warning Conditioning is a property of the coordinates, not of the physics
Nothing about the clock was ill-conditioned; the monomial basis in raw seconds-of-week was. The fix — subtract a reference epoch, divide by the arc half-length — costs two lines and buys twenty orders of magnitude. The general habit is **column equilibration**: choose units and offsets so that every column of $\mathbf{A}$ has roughly the same norm, and so that a unit change in each unknown moves the measurements by a comparable amount. Orbit determination recentres time on the epoch for exactly this reason, and a filter carrying position in metres alongside a clock bias in seconds should scale the clock state by the speed of light before anyone inverts anything. If you report a condition number, report the scaling with it, or the number means very little.
:::

## Forming the Gram matrix squares it

The most consequential fact about condition numbers in estimation is what happens when you build the normal equations.

From the SVD, $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, a spectral decomposition whose eigenvalues are $\sigma_1^2, \dots, \sigma_n^2$. The Gram matrix is symmetric PSD, so its condition number is the ratio of its extreme eigenvalues:

$$\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A}) = \frac{\sigma_{\max}^2}{\sigma_{\min}^2} = \kappa_2(\mathbf{A})^2.$$

::: key Squaring the condition number
$\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$. Forming the normal equations doubles the digits you lose. That is the whole argument for solving least squares by QR or SVD instead of by the normal equations.
:::

Put numbers on it with the polynomial fit that the module's least-squares exercise uses: a Vandermonde matrix on $50$ points evenly spaced over $[-1, 1]$, already well scaled. At degree $3$, $\kappa(\mathbf{A}) = 7.89$ and nothing is at risk. At degree $9$, $\kappa(\mathbf{A}) = 1.21\times 10^{3}$ and $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = 1.46\times 10^{6}$: three digits lost working on $\mathbf{A}$, six on the Gram matrix. At degree $15$, $\kappa(\mathbf{A}) = 2.31\times 10^{5}$ and $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = 5.32\times 10^{10}$, so a method that works with $\mathbf{A}$ keeps about $10.6$ digits while the normal equations keep about $5.3$. Same data, same answer in exact arithmetic, half the accuracy.

The information matrix of an estimator is a Gram matrix, $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$, so this is not an academic worry: it is the reason batch orbit determination and modern filters are written in square-root form, carrying a factor whose condition number is the square root of the information matrix's. Lesson 6's Cholesky factor is one such square root; Lesson 11 builds the other.

## The condition number as geometry

For a measurement Jacobian the condition number has a direct physical reading. Lesson 8 showed that for $\mathbf{H}$ with unit line-of-sight rows and unit-variance range noise, the position error ellipse has semi-axes $1/\sigma_i$ along $\mathbf{v}_i$. So the **aspect ratio of the error ellipse is exactly $\kappa(\mathbf{H})$**: how many times worse the worst-observed direction is than the best-observed one.

::: example Four beacon geometries, from perfect to hopeless
Three range beacons in the plane, one row of $\mathbf{H}$ per beacon, unit line-of-sight vectors. Vary only the bearings.

| Bearings | $\sigma_1$ | $\sigma_2$ | $\kappa(\mathbf{H})$ | $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})$ | GDOP |
| --- | --- | --- | --- | --- | --- |
| $0^\circ, 120^\circ, 240^\circ$ | $1.2247$ | $1.2247$ | $1.00$ | $1.00$ | $1.15$ |
| $0^\circ, 5^\circ, 10^\circ$ | $1.7277$ | $0.12326$ | $14.0$ | $197$ | $8.13$ |
| $0^\circ, 1^\circ, 2^\circ$ | $1.7319$ | $0.024681$ | $70.2$ | $4920$ | $40.5$ |
| $0^\circ, 0.2^\circ, 0.4^\circ$ | $1.7320$ | $0.0049365$ | $351$ | $1.23\times 10^{5}$ | $203$ |

The evenly spread geometry has $\kappa = 1$ exactly: $\mathbf{H}^\mathsf{T}\mathbf{H} = 1.5\,\mathbf{I}$, the error ellipse is a circle, and the matrix is as well conditioned as a matrix can be. Squeeze the beacons into a $10^\circ$ cone and $\kappa = 14$: the error ellipse is fourteen times longer across the line of sight than along it, and with $1\,\mathrm{m}$ range noise the semi-axes are $0.579$ and $8.13\,\mathrm{m}$, the numbers Lesson 8 computed. Squeeze to $0.4^\circ$ and $\kappa = 351$.

Two readings, and it matters which you are doing. As *statistics*, $\kappa$ and the geometric dilution of precision $\mathrm{GDOP} = \sqrt{\operatorname{tr}\left[(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\right]} = \sqrt{\sum_i\sigma_i^{-2}}$ say the geometry is bad: real ranging noise of $1\,\mathrm{m}$ becomes $203\,\mathrm{m}$ of position error in the worst row of the table, and no amount of arithmetic care recovers it. As *numerics*, $\kappa = 351$ costs $2.5$ digits of float64 and is entirely harmless — but the same problem solved through the normal equations costs $5.1$ digits, and in float32, where only $7$ are available, that is most of them.

Keep the two apart. A large $\kappa$ is always a statement about how much the answer can move; whether that motion comes from sensor noise or from round-off depends on which perturbation is bigger, and usually it is the sensor by many orders of magnitude.
:::

## Conditioning inside a filter

An extended Kalman filter forms the innovation covariance $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$ and inverts it to get the gain $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{S}^{-1}$. $\mathbf{S}$ is symmetric positive definite, so $\kappa(\mathbf{S}) = \lambda_{\max}/\lambda_{\min}$, and watching it is a cheap and informative filter health check.

::: example The innovation covariance of two nearly-parallel ranges
A vehicle holds a planar position estimate with $\mathbf{P} = 100\,\mathbf{I}\,\mathrm{m^2}$, that is $10\,\mathrm{m}$ one sigma on each axis. It takes range measurements to two beacons whose bearings differ by $1^\circ$, so the rows of $\mathbf{H}$ are unit vectors with dot product $\cos 1^\circ = 0.999848$, and $\mathbf{H}\mathbf{H}^\mathsf{T} = \begin{pmatrix} 1 & 0.999848 \\ 0.999848 & 1 \end{pmatrix}$. With range noise $\sigma_r = 0.5\,\mathrm{m}$,

$$\mathbf{S} = 100\,\mathbf{H}\mathbf{H}^\mathsf{T} + 0.25\,\mathbf{I} = \begin{pmatrix} 100.25 & 99.9848 \\ 99.9848 & 100.25 \end{pmatrix}\,\mathrm{m^2}.$$

Its eigenvectors are the sum and difference directions $(1, 1)^\mathsf{T}/\sqrt{2}$ and $(1, -1)^\mathsf{T}/\sqrt{2}$, with eigenvalues $100(1 + \cos 1^\circ) + 0.25 = 200.235$ and $100(1 - \cos 1^\circ) + 0.25 = 0.26523\,\mathrm{m^2}$. So $\kappa(\mathbf{S}) = 755$.

Read the two channels. The *sum* of the innovations is expected to vary by $\sqrt{200.235} = 14.15\,\mathrm{m}$, essentially all of it the shared along-track position uncertainty. The *difference* is expected to vary by $\sqrt{0.26523} = 0.515\,\mathrm{m}$, of which only $0.0152\,\mathrm{m^2}$ is position signal and $0.25\,\mathrm{m^2}$ is measurement noise: the cross-track channel is $6\%$ signal. That is what $\kappa = 755$ is telling you — the pair of measurements is nearly redundant, and the update will barely move the cross-track estimate.

Now fit a better ranging box, $\sigma_r = 0.05\,\mathrm{m}$. The difference eigenvalue falls to $0.0152 + 0.0025 = 0.01773$ and $\kappa(\mathbf{S})$ rises to $11279$. The conditioning got fifteen times worse and the filter got much better: the cross-track channel is now $86\%$ signal. A large $\kappa(\mathbf{S})$ means the measurement set has a wide dynamic range, not that anything is wrong. The genuine numerical question is separate and easy to answer: $\kappa = 1.1\times 10^4$ costs four of float64's sixteen digits when inverting $\mathbf{S}$, which is nothing, and four of float32's seven, which is not.
:::

::: warning The condition number is not a ratio of eigenvalues
$\kappa_2 = \sigma_{\max}/\sigma_{\min}$, always. For a symmetric matrix the singular values are $\lvert\lambda_i\rvert$ and the shortcut is safe; for anything else it can be badly wrong. The shear $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ of Lesson 8 has both eigenvalues equal to $1$, so the eigenvalue ratio says $\kappa = 1$, while its singular values $1.618$ and $0.618$ give the true $\kappa_2 = 2.62$. A defective matrix can have every eigenvalue equal and be arbitrarily ill-conditioned. The determinant is no better: Lesson 8's matrix with $\det = 1$ and $\kappa = 10^4$ makes that point.
:::

::: warning A small residual is not a small error
The clock example fitted coefficients that were $100\%$ wrong and still reproduced the data to three parts in a thousand. That is not a contradiction: least squares drives the residual down, and the residual is what the ill-conditioned directions barely affect. So a small residual is *not* evidence that your parameters are right, and "the fit looks good" is not a conditioning check. If you need the parameters — a bias, a drift, a scale factor to be handed to another subsystem — you need $\kappa$, not the residual.
:::

## Measuring it

```python
import numpy as np

t = np.linspace(345590.0, 345610.0, 11)       # GPS seconds of week
tau = (t - 345600.0) / 10.0                   # recentred, scaled to [-1, 1]
A_raw = np.column_stack([t**0, t**1, t**2])
A_sc = np.column_stack([tau**0, tau**1, tau**2])

print(np.linalg.cond(A_raw), np.linalg.cond(A_sc))   # 4.0381977749810584e+20 3.337223544546915
print(np.linalg.cond(A_sc.T @ A_sc), np.linalg.cond(A_sc) ** 2)   # 11.137060986278268 11.137060986278275
```

`np.linalg.cond` computes a full SVD, which costs $O(mn^2)$ and is fine offline but too expensive to run every filter cycle. Production code uses a **condition estimator** instead: LAPACK's `gecon` and friends take a factorisation you already have and return a cheap lower bound on $\kappa$, typically within a factor of a few, in $O(n^2)$ work. That is accurate enough for the decision you are making, which is whether you are near $10^7$ or near $10^{15}$, not whether $\kappa$ is $340$ or $350$.

What to do with the number: log it, threshold it, and equilibrate before you complain about it. A condition number that climbs over a pass is a geometry going degenerate and is worth an event message; one that is high from the first sample is usually a scaling bug in your own matrix.

## Check yourself

::: check
$\mathbf{A}$ has singular values $\{40, 8, 0.004\}$. Give $\kappa_2(\mathbf{A})$, $\kappa_2(\mathbf{A}^{-1})$, $\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A})$ and $\kappa_2(1000\,\mathbf{A})$, and say how many float64 digits each solve keeps.
:::

::: answer
$\kappa_2(\mathbf{A}) = 40/0.004 = 10^4$. The inverse has singular values $\{250, 0.125, 0.025\}$, so $\kappa_2(\mathbf{A}^{-1}) = 250/0.025 = 10^4$ as well — inverting a matrix neither helps nor hurts its conditioning. $\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A}) = (10^4)^2 = 10^8$. Scaling by $1000$ multiplies every singular value by $1000$ and leaves the ratio at $10^4$. Digits: solving with $\mathbf{A}$ or $\mathbf{A}^{-1}$ keeps about $16 - 4 = 12$; going through the Gram matrix keeps about $16 - 8 = 8$. All four solves are safe in float64; the Gram route in float32 would keep essentially none.
:::

::: check
An engineer reports that rescaling one state from metres to kilometres changed the condition number of his information matrix from $10^{9}$ to $10^{3}$. Did the estimation problem get easier?
:::

::: answer
The estimation problem is unchanged: the same measurements constrain the same physical directions to the same accuracy, and the error ellipsoid in physical units is what it was. What changed is the matrix he wrote down. Dividing one state by $1000$ divides the corresponding column of $\mathbf{H}$ by $1000$ and the matching row and column of $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ by $1000$ and $10^6$ respectively, which can move $\kappa$ by orders of magnitude. The *numerical* problem did get easier — the solve now loses three digits instead of nine — and that is a real and worthwhile gain. But nothing became more observable, and if he expected the estimate's uncertainty to shrink he will be disappointed. Report the scaling alongside the condition number.
:::

::: check
Why does a QR or SVD method keep twice as many digits as the normal equations on the same least-squares problem?
:::

::: answer
Both methods are backward stable, so each returns the exact answer to a problem perturbed by a relative amount of order $\varepsilon$, and the error is that perturbation times the condition number of the matrix the method actually solves with. QR and SVD work on $\mathbf{A}$ itself, using only orthogonal transformations, which leave every singular value unchanged and therefore leave $\kappa$ unchanged; their error is of order $\kappa(\mathbf{A})\varepsilon$. The normal equations first form $\mathbf{A}^\mathsf{T}\mathbf{A}$, whose singular values are $\sigma_i^2$, so the matrix being solved has condition number $\kappa(\mathbf{A})^2$ and the error is of order $\kappa(\mathbf{A})^2\varepsilon$. In digits, $\log_{10}\kappa^2 = 2\log_{10}\kappa$: exactly twice the loss. The damage is done in the forming, not the solving, and no amount of care in the solve step undoes it.
:::

::: check
A star tracker's attitude solution uses a matrix with $\kappa = 3\times 10^{6}$. The flight computer runs float32. Is the solve usable, and what would you change?
:::

::: answer
float32 carries about $7$ decimal digits and $\log_{10}(3\times 10^{6}) = 6.5$, so roughly half a digit survives: the solve returns noise. It is not usable as written. Three fixes, in order of preference. First, check the scaling — a $\kappa$ of that size in a problem built from unit vectors usually means one column is carrying different units, and equilibrating it may drop $\kappa$ by several orders of magnitude. Second, avoid any step that squares the conditioning: if the code forms $\mathbf{H}^\mathsf{T}\mathbf{H}$, the underlying $\kappa(\mathbf{H})$ is only $1.7\times 10^{3}$ and a QR-based solve on $\mathbf{H}$ would keep about $3.8$ digits instead of $0.5$. Third, if $\kappa$ is genuinely that large after scaling, the star field is nearly degenerate — the stars fall close to one line — and the honest answer is to truncate the unobservable direction, as in Lesson 9, and report reduced attitude knowledge about that axis.
:::

::: check
Two solves have $\kappa = 10^2$ and $\kappa = 10^{12}$. Both return a residual of $10^{-9}$. Which answer do you trust, and why is the residual not the deciding evidence?
:::

::: answer
Trust the first. A small residual says the returned $\mathbf{x}$ nearly satisfies the equations, which is a statement about $\mathbf{A}\mathbf{x} - \mathbf{b}$, not about $\mathbf{x} - \mathbf{x}_{\text{true}}$. The two are related by $\mathbf{x} - \mathbf{x}_{\text{true}} = \mathbf{A}^{-1}(\mathbf{A}\mathbf{x} - \mathbf{b})$, and $\mathbf{A}^{-1}$ can stretch by $1/\sigma_{\min}$. In relative terms the bound is $\lVert\mathbf{x} - \mathbf{x}_{\text{true}}\rVert/\lVert\mathbf{x}\rVert \le \kappa\,\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert/\lVert\mathbf{b}\rVert$: with $\kappa = 10^{2}$ a relative residual of $10^{-9}$ guarantees seven correct digits, while with $\kappa = 10^{12}$ it guarantees nothing at all. Ill-conditioned problems are exactly the ones where a tiny residual and a badly wrong answer coexist, as the clock fit showed: three parts in a thousand of residual, $100\%$ error in the coefficients.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $\kappa_2(\mathbf{A}) = \sigma_{\max}/\sigma_{\min} = \lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^{-1}\rVert_2$; for rectangular full-rank $\mathbf{A}$, $\lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^+\rVert_2$ |
| Amplification | relative error in $\mathbf{x}$ is at most $\kappa$ times the relative error in $\mathbf{b}$, and at most $\kappa$ times the relative error in $\mathbf{A}$ |
| Digits | about $16 - \log_{10}\kappa$ correct decimal digits in float64; about $7 - \log_{10}\kappa$ in float32 |
| Range | $\kappa \ge 1$; $\kappa = 1$ for a multiple of an orthogonal matrix; $\kappa = \infty$ for a rank-deficient matrix |
| Invariances | $\kappa(c\mathbf{A}) = \kappa(\mathbf{A}^{-1}) = \kappa(\mathbf{A})$; $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A})$ for orthogonal $\mathbf{Q}$ |
| Symmetric PD | $\kappa_2 = \lambda_{\max}/\lambda_{\min}$ — covariances, information and Gram matrices |
| Normal equations | $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$: twice the digits lost |
| Geometry | for unit line-of-sight rows, $\kappa(\mathbf{H})$ is the aspect ratio of the error ellipse; $\mathrm{GDOP} = \sqrt{\sum_i\sigma_i^{-2}}$ |
| Scaling | $\kappa$ depends on units and offsets; equilibrate the columns before reading it |
| Not conditioning | eigenvalue ratio (unless symmetric), determinant, residual size |
| NumPy | `np.linalg.cond(A)` (2-norm by default, full SVD); LAPACK `gecon` estimators for real-time use |

The next lesson uses all of this. Least squares can be solved three ways — the normal equations, QR, and the SVD — and they differ in cost and in exactly one other respect: whether the arithmetic ever sees $\kappa(\mathbf{A})$ or $\kappa(\mathbf{A})^2$. That single distinction decides which one belongs in flight software.
