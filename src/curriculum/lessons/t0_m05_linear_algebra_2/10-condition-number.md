---
id: l10-condition-number
title: The condition number
minutes: 24
covers:
  - condition number
---

Draw two straight roads on a map that cross at a right angle. Now nudge one road sideways by the width of a pencil line. The crossing point moves by about a pencil line too. Now draw two roads that are almost parallel and do the same nudge. The crossing point slides a long way along the road. The roads barely changed, and the answer to "where do they meet?" changed a lot. That is **[[ill-conditioning|crossing-roads]]**: a problem where a tiny change in what you put in makes a big change in what you get out.

Every system of equations $\mathbf{A}\mathbf{x} = \mathbf{b}$ is a crossing-point problem like this, in more dimensions. Lesson 9 kept returning to the reason some of them are touchy: a small singular value divides your noise by a small number and hands back a large, unreliable answer. This lesson turns that into one number, the **condition number**, written $\kappa$ (the Greek letter "kappa"). You can compute it before you have any data, and it tells you whether a solve is worth trusting at all.

The question it answers is narrow and useful. Suppose $\mathbf{b}$ is wrong by one part in a million — a sensor's last digit, a rounded constant. How wrong can $\mathbf{x}$ be? Up to $\kappa$ parts in a million, and $\kappa$ depends on $\mathbf{A}$ alone. Every GNC input carries some error, and computer arithmetic adds more near the $10^{-16}$ level. So $\kappa$ sets the accuracy ceiling for a GPS fix, an orbit fit or a filter update.

## How much can a solve amplify an error?

Think of a magnifying glass held over your data. Any smudge on the data shows up bigger in the answer. We want to know the glass's worst-case magnification.

First, a word for "size". The **norm** $\lVert\mathbf{x}\rVert$ (read "the norm of x") is the length of the vector $\mathbf{x}$. The **relative error** is the size of an error divided by the size of the thing it is an error in: $\lVert\delta\mathbf{x}\rVert/\lVert\mathbf{x}\rVert$, where $\delta\mathbf{x}$ ("delta x") is the small change. A relative error of $10^{-6}$ is "one part in a million".

Take a square, invertible $\mathbf{A}$ and the exact solution of $\mathbf{A}\mathbf{x} = \mathbf{b}$. Change the right-hand side to $\mathbf{b} + \delta\mathbf{b}$, and call the new exact solution $\mathbf{x} + \delta\mathbf{x}$. So $\mathbf{A}(\mathbf{x} + \delta\mathbf{x}) = \mathbf{b} + \delta\mathbf{b}$. Subtract the original equation and what is left is $\mathbf{A}\,\delta\mathbf{x} = \delta\mathbf{b}$, or $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$.

Now use two facts from Lesson 8. A matrix stretches any vector by at most its largest singular value, $\sigma_{\max}$ ("sigma max"), and by at least its smallest, $\sigma_{\min}$. The inverse $\mathbf{A}^{-1}$ has singular values $1/\sigma_i$, so its largest stretch is $1/\sigma_{\min}$.

**Step 1: the error can grow.** Since $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$,

$$\|\delta\mathbf{x}\| \le \frac{\|\delta\mathbf{b}\|}{\sigma_{\min}}.$$

**Step 2: the answer can be small.** Since $\mathbf{b} = \mathbf{A}\mathbf{x}$, $\lVert\mathbf{b}\rVert \le \sigma_{\max}\lVert\mathbf{x}\rVert$. Divide both sides by $\lVert\mathbf{b}\rVert\,\lVert\mathbf{x}\rVert$ to get $1/\lVert\mathbf{x}\rVert \le \sigma_{\max}/\lVert\mathbf{b}\rVert$.

**Step 3: multiply the two.** Both sides of each inequality are positive, so multiplying them keeps the direction:

$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \le \frac{\sigma_{\max}}{\sigma_{\min}}\cdot\frac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|}.$$

In words: the relative error in the answer is at most $\sigma_{\max}/\sigma_{\min}$ times the relative error in the data. The bound is reached exactly when $\mathbf{b}$ points along $\mathbf{u}_{\max}$, the output direction the matrix stretches most, while $\delta\mathbf{b}$ points along $\mathbf{u}_{\min}$, the direction it [[reaches least|worst-case]]. A nearly degenerate measurement geometry arranges that for you.

The same factor governs error in the matrix itself, which is more common: $\mathbf{A}$ is built from modeled geometry, Jacobians and time tags, none of them exact. Solve $(\mathbf{A} + \delta\mathbf{A})(\mathbf{x} + \delta\mathbf{x}) = \mathbf{b}$ instead. Multiply out, subtract $\mathbf{A}\mathbf{x} = \mathbf{b}$, and drop the product $\delta\mathbf{A}\,\delta\mathbf{x}$, which is a small number times a small number. That leaves $\mathbf{A}\,\delta\mathbf{x} \approx -\delta\mathbf{A}\,\mathbf{x}$. Multiply by $\mathbf{A}^{-1}$ and take sizes: $\lVert\delta\mathbf{x}\rVert \le \lVert\mathbf{A}^{-1}\rVert\,\lVert\delta\mathbf{A}\rVert\,\lVert\mathbf{x}\rVert$. Here $\lVert\mathbf{A}\rVert_2$ (the "2-norm" of a matrix) is its biggest stretch, $\sigma_{\max}$, and $\lVert\mathbf{A}^{-1}\rVert_2 = 1/\sigma_{\min}$. Divide by $\lVert\mathbf{x}\rVert$ and multiply and divide by $\lVert\mathbf{A}\rVert_2$:

$$\frac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \lesssim \|\mathbf{A}^{-1}\|_2\,\|\mathbf{A}\|_2\cdot\frac{\|\delta\mathbf{A}\|_2}{\|\mathbf{A}\|_2} = \frac{\sigma_{\max}}{\sigma_{\min}}\cdot\frac{\|\delta\mathbf{A}\|_2}{\|\mathbf{A}\|_2}.$$

(The symbol $\lesssim$ reads "is at most about".) The same ratio appears both times. That is why it earns a name.

## The definition and its properties

::: key The 2-norm condition number
$\kappa_2(\mathbf{A}) = \sigma_{\max}/\sigma_{\min} = \lVert\mathbf{A}\rVert_2\,\lVert\mathbf{A}^{-1}\rVert_2$. It bounds the relative error amplification of a linear solve: a relative perturbation $\eta$ in $\mathbf{b}$ or in $\mathbf{A}$ produces a relative error of at most $\kappa_2\eta$ in $\mathbf{x}$. You lose roughly $\log_{10}\kappa$ decimal digits in a solve, so $\kappa = 10^8$ leaves about $8$ of float64's $\approx 16$ digits.
:::

Read $\kappa_2$ as "kappa two"; $\eta$ ("eta") stands for any small relative error. The **[[condition number|condition-word]]** measures how touchy the problem is. Its properties all follow from the singular values.

- **It is never below 1.** $\sigma_{\max} \ge \sigma_{\min}$, so $\kappa \ge 1$. It equals $1$ exactly when every singular value is the same, which means $\mathbf{A}$ is a scalar times an orthogonal matrix. **Orthogonal matrices are perfectly conditioned.**
- **Rotations do not change it.** $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A}\mathbf{Q}) = \kappa_2(\mathbf{A})$ for orthogonal $\mathbf{Q}$, because multiplying by an orthogonal matrix leaves every singular value alone. So rotations and reflections rearrange a problem without making it harder — the reason numerical methods are built from them, as Lesson 11 shows.
- **Overall scale does not change it.** $\kappa(c\mathbf{A}) = \kappa(\mathbf{A})$ for any number $c \neq 0$, and $\kappa(\mathbf{A}^{-1}) = \kappa(\mathbf{A})$. Scaling the *whole* matrix changes nothing. Scaling *one column* can change everything, as the first example shows.
- **Symmetric positive definite matrices use eigenvalues.** For them the singular values are the eigenvalues, so $\kappa_2 = \lambda_{\max}/\lambda_{\min}$. That covers every covariance, information and Gram matrix you will meet.
- **Rectangular matrices use the pseudoinverse.** For a tall matrix of full column rank, $\kappa_2(\mathbf{A}) = \sigma_1/\sigma_n = \lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^+\rVert_2$, with the pseudoinverse of Lesson 9 in place of the inverse. If $\mathbf{A}$ is rank deficient, $\sigma_{\min} = 0$ and $\kappa = \infty$. The condition number and the rank test are the same test seen from two sides.

There are [[other condition numbers|other-norms]], but "the condition number" with no label means $\kappa_2$, and that is what `np.linalg.cond` returns by default.

### Digits

Here is where the digits rule comes from. A **[[float64|float64]]** number — the standard 64-bit computer number — carries a relative precision of $\varepsilon = 2^{-52} = 2.2\times 10^{-16}$ ("epsilon"), which is about $16$ decimal digits.

A well-written solver is **[[backward stable|backward-stable]]**: the answer it returns is the exact answer to a slightly different problem, one whose $\mathbf{A}$ and $\mathbf{b}$ differ from yours by a relative amount of about $\varepsilon$. Feed that $\varepsilon$ through the bound above as $\eta$, and the relative error in $\mathbf{x}$ is about $\kappa\varepsilon$. A relative error of $10^{-k}$ means about $k$ correct digits, so:

$$\text{correct decimal digits} \approx 16 - \log_{10}\kappa.$$

So $\kappa = 10^3$ costs three digits and nobody notices. $\kappa = 10^8$ leaves eight, still plenty for a position in meters. $\kappa = 10^{16}$ leaves none. Single precision, **float32**, has $\varepsilon = 2^{-23} = 1.2\times 10^{-7}$, about $7$ digits. A float32 flight computer hits the wall at $\kappa \approx 10^7$, which an awkward geometry can reach.

Two cautions. The rule is a *worst case*: a solve with $\kappa = 10^{5}$ often beats the eleven digits it promises. And the solver never announces the loss. It prints the usual sixteen digits whether they mean anything or not.

::: example A clock fit that fails because of the units of time
A GPS receiver estimates its own clock error (its **clock bias**, $b$) over a $20\,\mathrm{s}$ stretch by fitting a curve $b(t) = c_0 + c_1t + c_2t^2$ to eleven samples, one every $2\,\mathrm{s}$. The natural time tag is **[[GPS seconds of week|gps-time]]**, so the samples run from $t = 345590$ to $345610\,\mathrm{s}$. Each row of the matrix $\mathbf{A}$ is $(1,\ t,\ t^2)$, with $t \approx 3.456\times 10^5$ and $t^2 \approx 1.194\times 10^{11}$.

Columns of such different sizes are already a warning. The singular values are $3.96\times 10^{11}$, $20.98$ and $9.81\times 10^{-10}$, so

$$\kappa_2(\mathbf{A}_{\text{raw}}) = \frac{3.96\times 10^{11}}{9.81\times 10^{-10}} = 4.04\times 10^{20}.$$

That is $\log_{10}\kappa = 20.6$ digits of loss against float64's $16$. The digits rule promises nothing at all.

Now shift and rescale time: $\tau = (t - 345600)/10$ ("tau"), which runs from $-1$ to $1$. The same fit now has singular values $3.601$, $2.098$ and $1.079$:

$$\kappa_2(\mathbf{A}_{\text{scaled}}) = \frac{3.601}{1.079} = 3.34, \qquad \log_{10}\kappa = 0.52.$$

Half a digit. The vehicle, the clock and the data are identical. Only the variable changed.

**Watch it fail.** Take a true clock bias of $120\,\mathrm{ns}$ at the middle of the stretch, a drift of $0.3\,\mathrm{ns/s}$ and a small curvature of $0.005\,\mathrm{ns/s^2}$. The samples run from $117.500$ to $123.500\,\mathrm{ns}$. Solve both fits in float64 through $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$, working in seconds.

- The scaled fit returns every coefficient to twelve digits or better, and fits the samples to better than $10^{-13}\,\mathrm{ns}$.
- The raw fit is garbage. The true $c_0$ is $0.597093\,\mathrm{s}$ (the curve extrapolated back to $t = 0$) and the true $c_2$ is $5\times 10^{-12}\,\mathrm{s/s^2}$. On the computer that checked this lesson, `scipy.linalg.solve` returned $c_0 = -5.1\times 10^{-4}$ and $c_2 = -3.4\times 10^{-15}$: $100\%$ wrong, with the sign of $c_2$ flipped. `np.linalg.solve` refused, calling the matrix singular. Another computer prints different garbage.

The fitted *curve* survives better than the coefficients, because least squares shrinks the misfit, not the coefficient error. The raw fit still matches the samples to within $0.30\,\mathrm{ns}$. But clock error turns into range error at the speed of light, so $0.30\,\mathrm{ns}$ is $0.30\times 10^{-9}\times 2.998\times 10^{8} = 0.090\,\mathrm{m}$ of **[[pseudorange|pseudorange]]** error: nine centimeters of navigation error made out of nothing but a choice of time origin.

You can see the mechanism without linear algebra. At mid-stretch the three raw terms are $+0.5971$, $-1.1943$ and $+0.5972$ seconds, and they must cancel down to $1.2\times 10^{-7}\,\mathrm{s}$ — five million to one. That throws away six and a half digits before the solver starts.
:::

::: warning Conditioning is a property of the coordinates, not of the physics
Nothing about the clock was ill-conditioned. The powers of raw seconds-of-week were. The fix costs two lines and buys twenty orders of magnitude. The general habit is **column equilibration**: choose units and offsets so every column of $\mathbf{A}$ has roughly the same size. Orbit determination measures time from the fit's reference epoch for this reason, and a filter carrying position in meters next to a clock bias in seconds should multiply the clock state by the speed of light first. When you report a condition number, report the scaling with it.
:::

## Forming the Gram matrix squares it

Put a magnifying glass under another magnifying glass and the magnifications multiply. The product $\mathbf{A}^\mathsf{T}\mathbf{A}$ — the **Gram matrix**, which appears in every least-squares fit — does exactly that: it runs $\mathbf{A}$ and then its transpose, and each one magnifies by $\kappa(\mathbf{A})$.

The exact statement comes from the SVD. $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, because $\mathbf{U}^\mathsf{T}\mathbf{U} = \mathbf{I}$. That is a spectral decomposition with eigenvalues $\sigma_1^2, \dots, \sigma_n^2$. The Gram matrix is symmetric positive semi-definite, so its condition number is the ratio of its extreme eigenvalues:

$$\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A}) = \frac{\sigma_{\max}^2}{\sigma_{\min}^2} = \kappa_2(\mathbf{A})^2.$$

::: key Squaring the condition number
$\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$. Forming the normal equations doubles the digits you lose. That is the whole argument for solving least squares by QR or SVD instead of by the normal equations.
:::

Put numbers on it with the polynomial fit that the module's least-squares exercise uses. The matrix has columns $1, t, t^2, \dots, t^d$ — a **Vandermonde matrix** — on $50$ points evenly spaced over $[-1, 1]$, so it is already well scaled.

- Degree $3$: $\kappa(\mathbf{A}) = 7.89$. Nothing is at risk.
- Degree $9$: $\kappa(\mathbf{A}) = 1.21\times 10^{3}$ and $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = 1.46\times 10^{6}$. Three digits lost working on $\mathbf{A}$, six on the Gram matrix.
- Degree $15$: $\kappa(\mathbf{A}) = 2.31\times 10^{5}$ and $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = 5.32\times 10^{10}$. A method that works on $\mathbf{A}$ keeps about $16 - 5.4 = 10.6$ digits; the normal equations keep about $16 - 10.7 = 5.3$.

Same data, same exact answer, half the accuracy. And an estimator's **information matrix**, $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ (capital "lambda"; $\mathbf{H}$ maps the state to the measurements and $\mathbf{R}$ is the measurement noise covariance), is a Gram matrix. That is why batch orbit determination and modern filters are often written in **square-root form**: they carry a factor whose condition number is the square root of the information matrix's. Lesson 6's Cholesky factor is one such square root; Lesson 11 builds the other.

## The condition number as geometry

For a measurement matrix, the condition number has a picture. Lesson 8 showed that when $\mathbf{H}$ has unit line-of-sight rows and each range has unit-variance noise, the position error ellipse has semi-axes $1/\sigma_i$ along the directions $\mathbf{v}_i$. So **the aspect ratio of the error ellipse is exactly $\kappa(\mathbf{H})$**: how many times worse the worst-seen direction is than the best-seen one.

::: example Four beacon geometries, from perfect to hopeless
Three range beacons in a plane, one row of $\mathbf{H}$ per beacon, each row a unit vector pointing at a beacon. Only the bearings change.

| Bearings | $\sigma_1$ | $\sigma_2$ | $\kappa(\mathbf{H})$ | $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})$ | GDOP |
| --- | --- | --- | --- | --- | --- |
| $0^\circ, 120^\circ, 240^\circ$ | $1.2247$ | $1.2247$ | $1.00$ | $1.00$ | $1.15$ |
| $0^\circ, 5^\circ, 10^\circ$ | $1.7277$ | $0.12326$ | $14.0$ | $197$ | $8.13$ |
| $0^\circ, 1^\circ, 2^\circ$ | $1.7319$ | $0.024681$ | $70.2$ | $4920$ | $40.5$ |
| $0^\circ, 0.2^\circ, 0.4^\circ$ | $1.7320$ | $0.0049365$ | $351$ | $1.23\times 10^{5}$ | $203$ |

**Evenly spread.** $\kappa = 1$ exactly. Here $\mathbf{H}^\mathsf{T}\mathbf{H} = 1.5\,\mathbf{I}$, the error ellipse is a circle, and the matrix is as well conditioned as a matrix can be.

**Squeezed into a $10^\circ$ cone.** $\kappa = 14.0$. With $1\,\mathrm{m}$ range noise, the ellipse's semi-axes are $1/1.7277 = 0.579\,\mathrm{m}$ along the line of sight and $1/0.12326 = 8.11\,\mathrm{m}$ across it — the numbers Lesson 8 computed. Check: $8.11/0.579 = 14.0$, the condition number, as promised. [[The picture|beacon-ellipses]] makes the shape plain.

**Squeezed to $0.4^\circ$.** $\kappa = 351$.

Read the table two ways. As *statistics*: the last column is the **[[geometric dilution of precision|gdop]]**, $\mathrm{GDOP} = \sqrt{\operatorname{tr}\left[(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\right]} = \sqrt{\sum_i\sigma_i^{-2}}$ (tr, the "trace", adds up the diagonal). It says the bad geometry turns $1\,\mathrm{m}$ of ranging noise into $203\,\mathrm{m}$ of position error in the last row. No amount of careful arithmetic gets that back.

As *numerics*: $\kappa = 351$ costs $\log_{10}351 = 2.5$ digits of float64, which is harmless. The same problem solved through $\mathbf{H}^\mathsf{T}\mathbf{H}$ costs $\log_{10}(1.23\times 10^5) = 5.1$ digits. In float32, with only $7$ to spend, that is most of them.

Keep the two apart. A large $\kappa$ says how far the answer can move; whether sensor noise or round-off moves it depends on which is bigger, and usually it is the sensor by many orders of magnitude.
:::

## Conditioning inside a filter

A Kalman filter compares each new measurement with what it predicted. The difference is the **[[innovation|innovation]]**, and its expected spread is the **innovation covariance** $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$, where $\mathbf{P}$ is the state covariance. The filter inverts $\mathbf{S}$ to get its gain, $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{S}^{-1}$. $\mathbf{S}$ is symmetric positive definite, so $\kappa(\mathbf{S}) = \lambda_{\max}/\lambda_{\min}$ — a cheap health check.

::: example The innovation covariance of two nearly parallel ranges
A vehicle holds a planar position estimate with $\mathbf{P} = 100\,\mathbf{I}\,\mathrm{m^2}$ — that is, $10\,\mathrm{m}$ one-sigma on each axis. It takes range measurements to two beacons whose bearings differ by $1^\circ$. The rows of $\mathbf{H}$ are unit vectors with dot product $\cos 1^\circ = 0.999848$, so $\mathbf{H}\mathbf{H}^\mathsf{T} = \begin{pmatrix} 1 & 0.999848 \\ 0.999848 & 1 \end{pmatrix}$. With range noise $\sigma_r = 0.5\,\mathrm{m}$, $\mathbf{R} = 0.25\,\mathbf{I}\,\mathrm{m^2}$ and

$$\mathbf{S} = 100\,\mathbf{H}\mathbf{H}^\mathsf{T} + 0.25\,\mathbf{I} = \begin{pmatrix} 100.25 & 99.9848 \\ 99.9848 & 100.25 \end{pmatrix}\,\mathrm{m^2}.$$

A symmetric $2\times 2$ matrix with equal diagonal entries has eigenvectors $(1, 1)^\mathsf{T}/\sqrt{2}$ and $(1, -1)^\mathsf{T}/\sqrt{2}$ (sum and difference), and eigenvalues equal to the diagonal plus or minus the off-diagonal:

$$\lambda_{\max} = 100(1 + \cos 1^\circ) + 0.25 = 200.235\,\mathrm{m^2}, \qquad \lambda_{\min} = 100(1 - \cos 1^\circ) + 0.25 = 0.26523\,\mathrm{m^2}.$$

So $\kappa(\mathbf{S}) = 200.235/0.26523 = 755$.

Read the two channels. The *sum* of the innovations should vary by about $\sqrt{200.235} = 14.15\,\mathrm{m}$, nearly all of it shared along-track uncertainty. The *difference* should vary by $\sqrt{0.26523} = 0.515\,\mathrm{m}$, and only $100(1 - \cos 1^\circ) = 0.0152\,\mathrm{m^2}$ of its variance is position signal; the other $0.25\,\mathrm{m^2}$ is noise. The cross-track channel is $0.0152/0.265 = 6\%$ signal. That is what $\kappa = 755$ is saying: the two measurements nearly repeat each other.

Now fit a better ranging box, $\sigma_r = 0.05\,\mathrm{m}$. The difference eigenvalue falls to $0.0152 + 0.0025 = 0.01773\,\mathrm{m^2}$, and $\kappa(\mathbf{S})$ rises to $11279$. The conditioning got fifteen times worse and the filter got much better: the cross-track channel is now $0.0152/0.0177 = 86\%$ signal. A large $\kappa(\mathbf{S})$ means a wide range of certainty, not a fault. The numerical cost is separate: $\log_{10}11279 = 4.1$ digits, nothing in float64 and most of float32's seven.
:::

::: warning The condition number is not a ratio of eigenvalues
$\kappa_2 = \sigma_{\max}/\sigma_{\min}$, always. For a symmetric matrix the singular values are $\lvert\lambda_i\rvert$, so the shortcut is safe. For anything else it can be badly wrong. The shear $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ of Lesson 8 has both eigenvalues equal to $1$, so the eigenvalue ratio says $\kappa = 1$. Its singular values are $1.618$ and $0.618$, so the true $\kappa_2 = 2.62$. A defective matrix can have every eigenvalue equal and be as badly conditioned as you like. The determinant is no better: Lesson 8's matrix with $\det = 1$ has $\kappa = 10^4$.
:::

::: warning A small residual is not a small error
The clock example returned coefficients that were $100\%$ wrong and still matched the data to within $0.30\,\mathrm{ns}$ out of $120$ — a few parts in a thousand. That is no contradiction. Least squares drives the **residual** (the misfit, $\mathbf{A}\mathbf{x} - \mathbf{b}$) down, and the badly conditioned directions barely affect the residual. So a small residual is *not* evidence that your parameters are right, and "the fit looks good" is not a conditioning check. If you need the parameters themselves — a bias, a drift, a scale factor handed to another subsystem — you need $\kappa$, not the residual.
:::

## Measuring it

```python
import numpy as np

t = np.linspace(345590.0, 345610.0, 11)       # GPS seconds of week
tau = (t - 345600.0) / 10.0                   # recentered, scaled to [-1, 1]
A_raw = np.column_stack([t**0, t**1, t**2])
A_sc = np.column_stack([tau**0, tau**1, tau**2])

print(np.linalg.cond(A_raw), np.linalg.cond(A_sc))   # 4.0381977749810584e+20 3.337223544546915
print(np.linalg.cond(A_sc.T @ A_sc), np.linalg.cond(A_sc) ** 2)   # 11.137060986278268 11.137060986278275
```

The last line checks the squaring rule: the Gram matrix's condition number is the square of the matrix's, to fourteen digits.

`np.linalg.cond` computes all the singular values, about $mn^2$ operations for an $m\times n$ matrix: fine on the ground, too slow for every filter cycle. Flight code uses a cheap **[[condition estimator|gecon]]** instead. It only needs to tell $10^7$ from $10^{15}$, not $340$ from $350$.

What to do with the number: log it, set a threshold, and equilibrate before you complain. A $\kappa$ that climbs over a pass is a geometry going degenerate. One that is high from the first sample is usually a scaling bug.

## Check yourself

::: check
$\mathbf{A}$ has singular values $\{40, 8, 0.004\}$. Give $\kappa_2(\mathbf{A})$, $\kappa_2(\mathbf{A}^{-1})$, $\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A})$ and $\kappa_2(1000\,\mathbf{A})$, and say how many float64 digits each solve keeps.
:::

::: answer
$\kappa_2(\mathbf{A}) = 40/0.004 = 10^4$.

The inverse has singular values $1/40$, $1/8$ and $1/0.004$, which are $\{250, 0.125, 0.025\}$ in decreasing order. So $\kappa_2(\mathbf{A}^{-1}) = 250/0.025 = 10^4$ as well. Inverting a matrix neither helps nor hurts its conditioning.

$\kappa_2(\mathbf{A}^\mathsf{T}\mathbf{A}) = (10^4)^2 = 10^8$.

Multiplying by $1000$ multiplies every singular value by $1000$, so the ratio stays $10^4$.

Digits: solving with $\mathbf{A}$, $\mathbf{A}^{-1}$ or $1000\,\mathbf{A}$ keeps about $16 - 4 = 12$. Going through the Gram matrix keeps about $16 - 8 = 8$. All four are safe in float64. The Gram route in float32 would keep about $7 - 8$, which is to say none.
:::

::: check
An engineer reports that changing one state from meters to kilometers moved the condition number of his information matrix from $10^{9}$ to $10^{3}$. Did the estimation problem get easier?
:::

::: answer
The estimation problem is unchanged. The same measurements pin down the same physical directions equally well; the error ellipsoid in physical units has not moved.

What changed is the matrix he wrote down. The state in kilometers is $1000$ times smaller than the state in meters, so to predict the same measurements, the matching column of $\mathbf{H}$ must be $1000$ times larger. In $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ that multiplies the matching row and column by $1000$ — and the diagonal entry where they cross by $1000^2 = 10^6$. Changes like that can move $\kappa$ by orders of magnitude.

The *numerical* problem did get easier — three digits lost instead of nine, a real gain. But nothing became more observable, and the estimate's uncertainty will not shrink.
:::

::: check
Why does a QR or SVD method keep twice as many digits as the normal equations on the same least-squares problem?
:::

::: answer
All three methods are backward stable, so each one's error is about $\varepsilon$ times the condition number of the matrix it actually works with.

QR and the SVD work on $\mathbf{A}$ itself, using only orthogonal transformations. Those leave every singular value unchanged, so they leave $\kappa$ unchanged, and the error is about $\kappa(\mathbf{A})\varepsilon$.

The normal equations first form $\mathbf{A}^\mathsf{T}\mathbf{A}$, whose singular values are $\sigma_i^2$. The matrix being solved has condition number $\kappa(\mathbf{A})^2$, and the error is about $\kappa(\mathbf{A})^2\varepsilon$.

In digits, $\log_{10}\kappa^2 = 2\log_{10}\kappa$: twice the loss. The damage is done in the *forming*, and no care in the solve undoes it.
:::

::: check
A star tracker's attitude solution uses a matrix with $\kappa = 3\times 10^{6}$. The flight computer runs float32. Is the solve usable, and what would you change?
:::

::: answer
float32 carries about $7$ decimal digits, and $\log_{10}(3\times 10^{6}) = 6.5$. About half a digit survives: the solve returns noise. It is not usable as written. Three fixes, in order of preference.

1. **Check the scaling.** In a problem built from unit vectors, a $\kappa$ that size usually means one column carries different units.
2. **Stop squaring.** If the code forms $\mathbf{H}^\mathsf{T}\mathbf{H}$, the underlying $\kappa(\mathbf{H})$ is only $\sqrt{3\times 10^6} = 1.7\times 10^{3}$. A QR-based solve on $\mathbf{H}$ keeps about $7 - 3.2 = 3.8$ digits instead of $0.5$.
3. **Admit the geometry.** If $\kappa$ stays that large, the stars in view nearly line up and one rotation axis is barely observable. Truncate that direction, as in Lesson 9, and report reduced knowledge about that axis.
:::

::: check
Two solves have $\kappa = 10^2$ and $\kappa = 10^{12}$. Both return a residual of $10^{-9}$ relative to $\lVert\mathbf{b}\rVert$. Which answer do you trust, and why is the residual not the deciding evidence?
:::

::: answer
Trust the first.

A small residual is a statement about $\mathbf{A}\mathbf{x} - \mathbf{b}$, not about $\mathbf{x} - \mathbf{x}_{\text{true}}$. The two are linked by $\mathbf{x} - \mathbf{x}_{\text{true}} = \mathbf{A}^{-1}(\mathbf{A}\mathbf{x} - \mathbf{b})$, and $\mathbf{A}^{-1}$ can stretch by $1/\sigma_{\min}$. In relative terms, the same three steps as the amplification bound give

$$\frac{\lVert\mathbf{x} - \mathbf{x}_{\text{true}}\rVert}{\lVert\mathbf{x}_{\text{true}}\rVert} \le \kappa\,\frac{\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert}{\lVert\mathbf{b}\rVert}.$$

With $\kappa = 10^{2}$, a relative residual of $10^{-9}$ guarantees a relative error below $10^{-7}$: seven correct digits. With $\kappa = 10^{12}$ the bound is $10^{3}$, which guarantees nothing at all. Badly conditioned problems are exactly where a tiny residual and a wrong answer live together, as the clock fit showed.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $\kappa_2(\mathbf{A}) = \sigma_{\max}/\sigma_{\min} = \lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^{-1}\rVert_2$; for rectangular full-rank $\mathbf{A}$, $\lVert\mathbf{A}\rVert_2\lVert\mathbf{A}^+\rVert_2$ |
| Amplification | relative error in $\mathbf{x}$ is at most $\kappa$ times the relative error in $\mathbf{b}$, and at most about $\kappa$ times the relative error in $\mathbf{A}$ |
| Digits | about $16 - \log_{10}\kappa$ correct decimal digits in float64; about $7 - \log_{10}\kappa$ in float32 |
| Range | $\kappa \ge 1$; $\kappa = 1$ for a multiple of an orthogonal matrix; $\kappa = \infty$ for a rank-deficient matrix |
| Invariances | $\kappa(c\mathbf{A}) = \kappa(\mathbf{A}^{-1}) = \kappa(\mathbf{A})$; $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A})$ for orthogonal $\mathbf{Q}$ |
| Symmetric PD | $\kappa_2 = \lambda_{\max}/\lambda_{\min}$ — covariances, information and Gram matrices |
| Normal equations | $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$: twice the digits lost |
| Geometry | for unit line-of-sight rows, $\kappa(\mathbf{H})$ is the aspect ratio of the error ellipse; $\mathrm{GDOP} = \sqrt{\sum_i\sigma_i^{-2}}$ |
| Scaling | $\kappa$ depends on units and offsets; equilibrate the columns before reading it |
| Not conditioning | eigenvalue ratio (unless symmetric), determinant, residual size |
| NumPy | `np.linalg.cond(A)` (2-norm by default, from the singular values); LAPACK `gecon` estimators for real-time use |

The next lesson puts all of this to work. Least squares can be solved three ways — the normal equations, QR, and the SVD — and they differ in cost and in exactly one other respect: whether the arithmetic ever sees $\kappa(\mathbf{A})$ or $\kappa(\mathbf{A})^2$. That one difference decides which belongs in flight software.

::: context crossing-roads Why nearly parallel lines are touchy
Each equation in a $2\times 2$ system is a line, and the solution is where the lines cross. Nudge one line sideways by the same small amount in both pictures below. When the lines cross at $90^\circ$, the crossing moves by that amount. When they cross at $12^\circ$, it slides $1/\sin 12^\circ = 4.8$ times as far.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="95" x2="145" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="85" y1="35" x2="85" y2="155" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="93" y1="35" x2="93" y2="155" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="85" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="93" cy="95" r="4" fill="#b4232c"/>
  <text x="85" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">cross at 90°</text>
  <text x="85" y="175" font-size="12" text-anchor="middle" fill="#b4232c">moves 1×</text>
  <line x1="175" y1="95" x2="345" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="176.7" y1="111.6" x2="333.3" y2="78.4" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="178.4" y1="119.5" x2="334.9" y2="86.2" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="255" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="293.5" cy="95" r="4" fill="#b4232c"/>
  <text x="260" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">cross at 12°</text>
  <text x="260" y="175" font-size="12" text-anchor="middle" fill="#b4232c">same nudge, moves 4.8×</text>
  <text x="200" y="55" font-size="11" fill="#6c7a93">dashed: nudged line</text>
</svg>
```

Write each equation with unit-length coefficients. Then for two lines crossing at angle $\theta$, the condition number of the system works out to $1/\tan(\theta/2)$: exactly $1$ at $90^\circ$, and $9.5$ at $12^\circ$.
:::

::: context worst-case The worst case, drawn
Take $\mathbf{A} = \operatorname{diag}(3, 0.5)$, so $\kappa = 6$. On the left, the answer $\mathbf{x}$ has length $1$ and the error $\delta\mathbf{x}$ has length $0.6$: a $60\%$ error. On the right, $\mathbf{A}$ turns them into $\mathbf{b}$ of length $3$ and $\delta\mathbf{b}$ of length $0.3$: only a $10\%$ error. Run the solve backwards and a $10\%$ smudge on the data becomes a $60\%$ error in the answer — six times, the full $\kappa$. The data sat on the long axis and the smudge on the short one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="95" r="30" fill="#fff" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="70" y1="95" x2="100" y2="95" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="100" y1="95" x2="100" y2="77" stroke="#b4232c" stroke-width="3"/>
  <text x="85" y="112" font-size="12" text-anchor="middle" fill="#1d6fd1">x</text>
  <text x="106" y="84" font-size="12" fill="#b4232c">δx</text>
  <text x="70" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">answer: 60% off</text>
  <ellipse cx="250" cy="95" rx="90" ry="15" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="250" y1="95" x2="340" y2="95" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="340" y1="95" x2="340" y2="86" stroke="#b4232c" stroke-width="3"/>
  <text x="295" y="128" font-size="12" text-anchor="middle" fill="#1d6fd1">b = Ax</text>
  <text x="332" y="80" font-size="12" text-anchor="end" fill="#b4232c">δb</text>
  <text x="250" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">data: 10% off</text>
  <line x1="150" y1="45" x2="125" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="119,45 129,40 129,50" fill="#1f2a44"/>
  <text x="140" y="35" font-size="12" text-anchor="middle" fill="#1f2a44">solve</text>
</svg>
```
:::

::: context condition-word Who named it
Alan Turing used the term "condition number" in a 1948 paper on the rounding errors of matrix computations, written as the first electronic computers were being built. John von Neumann and Herman Goldstine had studied the same question for inverting matrices a year earlier. Both groups were asking whether the new machines, which rounded every result, could be trusted to solve large systems. The answer they found is this lesson: it depends on the matrix, and on one ratio in particular.
:::

::: context other-norms Other ways to measure size
Length is not the only way to size a matrix. The **1-norm** is its largest column sum of absolute values, the **∞-norm** its largest row sum, and the **Frobenius norm** the square root of the sum of every entry squared. Each gives its own condition number, $\lVert\mathbf{A}\rVert\,\lVert\mathbf{A}^{-1}\rVert$, written $\kappa_1$, $\kappa_\infty$ and $\kappa_F$. For an $n\times n$ matrix they all agree with $\kappa_2$ to within a factor of $n$, so they tell the same story about digits lost. The 1-norm and ∞-norm need no SVD, which is why fast estimators use them.
:::

::: context float64 What float64 means
A float64 number is stored in 64 bits: one for the sign, eleven for the power of two, and 52 for the digits after the leading $1$. Those 52 bits give a spacing of $2^{-52} \approx 2.2\times 10^{-16}$ between neighboring numbers near $1$, which is about $16$ decimal digits. A float32 number has 23 such bits, a spacing of $2^{-23} \approx 1.2\times 10^{-7}$, and about $7$ digits. The digits rule is these two numbers, fed through $\kappa$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="5" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="25" y="30" width="55" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="30" width="260" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="22" y="22" font-size="11" fill="#b4232c">sign</text>
  <text x="52" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">11: power of 2</text>
  <text x="210" y="50" font-size="12" text-anchor="middle" fill="#1f2a44">52 bits of digits ≈ 16 decimal digits</text>
  <text x="340" y="82" font-size="11" text-anchor="end" fill="#1f2a44">64 bits in all, drawn to scale</text>
</svg>
```
:::

::: context backward-stable The right answer to a nearby question
Here is another way to say "backward stable". Imagine asking a very careful assistant to solve your equations. She does not quite answer your question. She answers one whose numbers differ from yours only in the sixteenth digit, and answers *that* one exactly. You cannot fault her: your data was never that precise anyway. But if your problem is touchy, the nearby question can have a very different answer. The algorithm is blameless; the condition number measures the problem. James Wilkinson made this way of analyzing round-off standard in the 1960s.
:::

::: context gps-time How GPS counts time
GPS time is counted as a week number plus the seconds since the start of that week, which began at midnight between Saturday and Sunday. Seconds of week run from $0$ to $604800$. So a perfectly ordinary time tag is a six-digit number, and its square is an eleven or twelve-digit number — which is exactly how a harmless quadratic fit ends up with $\kappa = 4\times 10^{20}$.
:::

::: context pseudorange Why nanoseconds are meters
A GPS receiver measures range by timing how long a signal took to arrive. Light covers about $0.30\,\mathrm{m}$ in a nanosecond, so every nanosecond of error in the receiver's clock becomes about $30\,\mathrm{cm}$ of error in every range. Because the clock error contaminates all the ranges, the measured range is called a **pseudorange**, and the receiver solves for its clock bias along with its position — four unknowns, which is why it needs at least four satellites.
:::

::: context beacon-ellipses Spread beacons and squeezed beacons
Both pictures use the same $1\,\mathrm{m}$ range noise and the same scale. With beacons spread $120^\circ$ apart, the error region is a small circle of radius $0.82\,\mathrm{m}$. Squeeze the beacons into a $10^\circ$ cone and the region becomes a thin ellipse, $0.58\,\mathrm{m}$ along the lines of sight and $8.1\,\mathrm{m}$ across them — fourteen times longer than it is wide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="80" y1="105" x2="140" y2="105"/><line x1="80" y1="105" x2="50" y2="53.0"/><line x1="80" y1="105" x2="50" y2="157.0"/>
    <line x1="215" y1="105" x2="325" y2="105"/><line x1="215" y1="105" x2="324.6" y2="95.4"/><line x1="215" y1="105" x2="323.3" y2="85.9"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="140" cy="105" r="4"/><circle cx="50" cy="53.0" r="4"/><circle cx="50" cy="157.0" r="4"/>
    <circle cx="325" cy="105" r="4"/><circle cx="324.6" cy="95.4" r="4"/><circle cx="323.3" cy="85.9" r="4"/>
  </g>
  <circle cx="80" cy="105" r="7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="215" cy="105" rx="5" ry="70" transform="rotate(-5 215 105)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="80" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">spread: κ = 1</text>
  <text x="260" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">10° cone: κ = 14</text>
  <text x="330" y="80" font-size="11" text-anchor="end" fill="#1f2a44">beacons</text>
  <text x="80" y="200" font-size="11" text-anchor="middle" fill="#1d6fd1">circle, 0.82 m</text>
  <text x="235" y="200" font-size="11" text-anchor="middle" fill="#1d6fd1">ellipse, 8.1 m by 0.58 m</text>
</svg>
```

The long axis points across the lines of sight: ranges to beacons that all lie in one direction say almost nothing about sideways position.
:::

::: context gdop Dilution of precision in GPS
Every GPS receiver computes a dilution of precision from its current satellite geometry, the same way the table does, and many will show it on a status screen. Values near $1$ to $2$ mean the satellites are well spread across the sky; large values mean they are bunched, often because buildings or terrain hide part of the sky. The module's observability exercise asks you to build this number yourself for four beacons, spread and then clustered.
:::

::: context innovation The filter's surprise
The innovation is measurement minus prediction: how surprised the filter is by what it has seen. A filter that is working well sees innovations that look like the noise it expected, with spread matching $\mathbf{S}$. The Kalman gain decides how much of each surprise to believe and feed into the new estimate. The estimation modules later in the course build all of this; here it is enough that $\mathbf{S}$ is a symmetric positive definite matrix that gets inverted at every step.
:::

::: context gecon Condition estimators
LAPACK, the linear-algebra library under NumPy and MATLAB, has routines such as `dgecon` (for a matrix already factored as $\mathbf{L}\mathbf{U}$) and `dpocon` (for one already factored by Cholesky). Given those factors, they estimate $1/\kappa$ in the 1-norm using a clever search devised by William Hager and refined by Nicholas Higham, for about $n^2$ operations instead of the $n^3$ a full SVD needs. The estimate is rarely off by more than a factor of a few, and the 1-norm differs from $\kappa_2$ by at most a factor of $n$. For a yes-or-no question about digits, that is plenty.
:::
