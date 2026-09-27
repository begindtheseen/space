---
id: l12-attitude-covariance-sensor-geometry
title: Covariance of an attitude solution and the effect of sensor geometry
minutes: 16
covers:
  - Covariance of an attitude solution and the effect of sensor geometry
---

Think of a camera tripod. Spread its legs wide and it stands rock steady. Pull two legs close together and it still stands — but give it a nudge from the side and it wobbles badly. Nothing about the legs got worse. Only their *geometry* changed.

Attitude sensors behave the same way. In the last lesson we measured attitude errors by comparing against a truth we had invented. A spacecraft in flight has no such truth. It needs to know how good its attitude answer is *before* anyone checks — from the sensor directions and the sensor noise alone. That number is the attitude **covariance**: the spread of errors you should expect, direction by direction. It is the same question lesson one asked for an ordinary state vector — the uncertainty you can work out before the data arrive — now asked for a rotation.

This lesson derives that covariance in a short formula, checks it against thousands of simulated trials instead of trusting it, and finds exactly how it blows up when two observed directions close in on each other — the tripod with two legs together.

## Attitude error as a small rotation vector

Suppose our estimate is close to the true attitude $\mathbf{A}$ but a little off. Any small error in orientation can be described as a small turn: a **rotation vector** $\boldsymbol{\delta\theta}$ (read "delta theta"), whose direction is the axis of the turn and whose length is the angle in radians. For a small error, a nearby attitude is

$$
\mathbf{A}(\boldsymbol{\delta\theta}) = (\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A},
$$

where $[\mathbf{v}\times]$ (read "v cross") is the **[[skew-symmetric matrix|skew-matrix]]** that does a cross product: $[\mathbf{v}\times]\mathbf{w}=\mathbf{v}\times\mathbf{w}$ for any $\mathbf{w}$. This is the standard small-angle attitude error that the attitude module builds small quaternions and MRPs from. The vector $\boldsymbol{\delta\theta}$ lives in the body frame and has three numbers — the three things we want to know.

Now see how such a small error moves a predicted body arrow. Multiply by $\mathbf{r}_i$ and use $\mathbf{A}\mathbf{r}_i=\mathbf{b}_i$ for the true attitude:

$$
\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = \mathbf{b}_i - \boldsymbol{\delta\theta}\times\mathbf{b}_i = \mathbf{b}_i + \mathbf{b}_i\times\boldsymbol{\delta\theta} = \mathbf{b}_i + [\mathbf{b}_i\times]\boldsymbol{\delta\theta} .
$$

Step by step: the first equality multiplies out the bracket. The second swaps the order of the cross product, which flips its sign ($\mathbf{u}\times\mathbf{v}=-\mathbf{v}\times\mathbf{u}$). The third writes that cross product as a matrix times $\boldsymbol{\delta\theta}$.

This is the nonlinear least squares setup from lesson six. $\boldsymbol{\delta\theta}$ is the unknown, and $[\mathbf{b}_i\times]$ is its **Jacobian** — the matrix saying how much the prediction moves per unit of error. The only new feature is size: each vector observation gives a $3\times3$ Jacobian block, where a single scalar measurement used to give one row.

## The attitude information matrix

Lesson two built the information matrix as "Jacobian transpose, times weight, times Jacobian", added over all measurements. Do the same here. Each vector observation has weight $a_i=1/\sigma_i^2$ on all its components alike — the same assumption the Wahba cost made — so it contributes

$$
a_i[\mathbf{b}_i\times]^\mathsf{T}[\mathbf{b}_i\times].
$$

That product has a much simpler form. A skew-symmetric matrix satisfies $[\mathbf{v}\times]^\mathsf{T}=-[\mathbf{v}\times]$. And the **double cross product** rule, $\mathbf{v}\times(\mathbf{v}\times\mathbf{w})=\mathbf{v}(\mathbf{v}\cdot\mathbf{w})-\mathbf{w}\lVert\mathbf{v}\rVert^2$, says $[\mathbf{v}\times]^2=\mathbf{v}\mathbf{v}^\mathsf{T}-\lVert\mathbf{v}\rVert^2\mathbf{I}$. Putting the two together:

$$
[\mathbf{v}\times]^\mathsf{T}[\mathbf{v}\times] = -[\mathbf{v}\times]^2 = \lVert\mathbf{v}\rVert^2\mathbf{I}-\mathbf{v}\mathbf{v}^\mathsf{T} .
$$

For a unit vector $\mathbf{b}_i$ this is $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$. Adding up over every observation gives the **attitude information matrix** $\mathbf{F}$ and its inverse, the attitude covariance $\mathbf{P}_{\boldsymbol{\delta\theta}}$:

$$
\mathbf{F} = \sum_i a_i\left(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}\right), \qquad \mathbf{P}_{\boldsymbol{\delta\theta}} = \mathbf{F}^{-1} .
$$

The matrix $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ has a nice meaning: it takes any arrow and removes its part along $\mathbf{b}_i$, keeping only the part sideways to it. It is a **[[projection|projection]]** onto the plane perpendicular to $\mathbf{b}_i$.

Compare this with lesson two's information matrix for a vector state, $\boldsymbol{\Lambda}=\sum_i\mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$. There, each scalar measurement informed exactly *one* direction: a **[[rank-one|rank]]** term. Here it is the other way round. Each vector measurement is blind in exactly one direction — rotation about $\mathbf{b}_i$ itself, because $(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i=\mathbf{0}$ — and informs the other two directions equally: a rank-two term. This is lesson ten's hidden spin, turned into an exact algebra fact. A single arrow's piece of $\mathbf{F}$ has a true zero eigenvalue along the arrow, not merely a small one.

::: key Attitude information matrix
$\mathbf{F}=\sum_i a_i(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})$ is the linearized **[[Fisher information|fisher]]** for the small-angle attitude error $\boldsymbol{\delta\theta}$ (body frame), and $\mathbf{P}_{\boldsymbol{\delta\theta}}=\mathbf{F}^{-1}$ is the attitude covariance. Each vector observation contributes a rank-two term, blind exactly along its own direction — the opposite of a scalar measurement's rank-one term, which informs one direction.
:::

A handy single number from $\mathbf{P}$: its trace is the expected sum of squared errors about all three axes, so $\sqrt{\operatorname{trace}\mathbf{P}}$ is the predicted RMS attitude error. The code below computes it for two sensors of $0.2^\circ$ noise at three separations:

```python
import numpy as np

def info_matrix(bs, weights):
    """Attitude information matrix F = sum a_i (I - b_i b_i^T)."""
    return sum(a * (np.eye(3) - np.outer(b, b)) for b, a in zip(bs, weights))

sigma = np.radians(0.2)                      # sensor noise, radians
a = 1 / sigma**2                             # weight = 1/sigma^2
for sep in (90, 10, 2):
    t = np.radians(sep)
    b1 = np.array([1.0, 0.0, 0.0])
    b2 = np.array([np.cos(t), np.sin(t), 0.0])
    F = info_matrix([b1, b2], [a, a])
    P = np.linalg.inv(F)                     # attitude covariance, rad^2
    lam = np.linalg.eigvalsh(F)              # eigenvalues, smallest first
    print(f"{sep:3d} deg: sqrt(trace P) = {np.degrees(np.sqrt(np.trace(P))):.3f} deg, "
          f"worst-direction sigma = {np.degrees(1/np.sqrt(lam[0])):.3f} deg, cond(F) = {lam[-1]/lam[0]:.0f}")
#  90 deg: sqrt(trace P) = 0.316 deg, worst-direction sigma = 0.200 deg, cond(F) = 2
#  10 deg: sqrt(trace P) = 1.635 deg, worst-direction sigma = 1.623 deg, cond(F) = 132
#   2 deg: sqrt(trace P) = 8.106 deg, worst-direction sigma = 8.103 deg, cond(F) = 3283
```

No noisy data was used. These predictions come from geometry and sensor quality alone.

::: example Checking the prediction against the real solver
A formula built on a small-angle approximation deserves a test. Take the same two-sensor setup ($0.2^\circ$ noise each), run the full SVD Wahba solver from lesson eleven on $200{,}000$ noisy **[[Monte Carlo|monte-carlo]]** trials per separation, and measure the actual RMS attitude error:

| Separation | Predicted $\sqrt{\operatorname{trace}\mathbf{F}^{-1}}$ | Monte Carlo RMS (SVD) |
| --- | --- | --- |
| $90^\circ$ | $0.316^\circ$ | $0.316^\circ$ |
| $10^\circ$ | $1.635^\circ$ | $1.638^\circ$ |
| $2^\circ$ | $8.106^\circ$ | $8.184^\circ$ |

The prediction also works axis by axis, not only in total. At $10^\circ$ separation (in the test's body axes, units $\mathrm{rad}^2$):

- predicted diagonal of $\mathbf{P}_{\boldsymbol{\delta\theta}}$: $5.40\times10^{-4}$, $1.90\times10^{-4}$, $8.37\times10^{-5}$;
- measured variance of the actual rotation errors: $5.43\times10^{-4}$, $1.91\times10^{-4}$, $8.40\times10^{-5}$.

Each pair agrees to within about half a percent. Sanity check on the last row: at $2^\circ$ the real error is about $1\%$ bigger than predicted. That is the linearization warning from lesson six. The error there is about $8^\circ$ — large enough that "small angle" is no longer perfectly true, so the linear formula starts to underestimate slightly. At good geometry, where errors are tiny, the prediction is essentially exact.
:::

## Two vectors: the closed form

For two equally weighted arrows ($a_1=a_2=a$) separated by angle $\theta$, we can find the eigenvalues of $\mathbf{F}$ by hand. They tell us the information in each of three special directions:

$$
\lambda \in \{\,a(1+\cos\theta),\ \ a(1-\cos\theta),\ \ 2a\,\}.
$$

Each eigenvalue belongs to a direction you can picture:

- $2a$ belongs to the axis perpendicular to the plane of both arrows. A turn about that axis moves both arrows fully, so it is always well measured.
- $a(1+\cos\theta)$ belongs to the in-plane direction along the *difference* of the arrows. Also well measured.
- $a(1-\cos\theta)$ belongs to the **bisector** — the direction halfway between the two arrows. This is the weak one. As $\theta\to0$ it goes to zero.

The standard deviation in the worst direction is one over the square root of the smallest eigenvalue. Using $a=1/\sigma_{\text{sensor}}^2$ and the **[[half-angle identity|half-angle]]** $1-\cos\theta=2\sin^2(\theta/2)$:

$$
\sigma_{\text{worst}} = \frac{1}{\sqrt{a(1-\cos\theta)}} = \frac{\sigma_{\text{sensor}}}{\sqrt{2}\,\sin(\theta/2)} .
$$

::: note Why the eigenvalues have to be these
Write $\mathbf{F}=a\big[2\mathbf{I}-\mathbf{G}\big]$ with $\mathbf{G}=\mathbf{b}_1\mathbf{b}_1^\mathsf{T}+\mathbf{b}_2\mathbf{b}_2^\mathsf{T}$, and let $c=\cos\theta=\mathbf{b}_1\cdot\mathbf{b}_2$. Test three arrows.

Bisector: $\mathbf{G}(\mathbf{b}_1+\mathbf{b}_2)=\mathbf{b}_1(1+c)+\mathbf{b}_2(c+1)=(1+c)(\mathbf{b}_1+\mathbf{b}_2)$.

Difference: $\mathbf{G}(\mathbf{b}_1-\mathbf{b}_2)=\mathbf{b}_1(1-c)+\mathbf{b}_2(c-1)=(1-c)(\mathbf{b}_1-\mathbf{b}_2)$.

Normal $\mathbf{n}$, perpendicular to both: $\mathbf{G}\mathbf{n}=\mathbf{0}$.

So $\mathbf{G}$ has eigenvalues $1+c$, $1-c$, $0$, and $\mathbf{F}=a(2\mathbf{I}-\mathbf{G})$ has $a(1-c)$ along the bisector, $a(1+c)$ along the difference, and $2a$ along the normal. None of this depends on the overall attitude, only on the angle between the arrows.
:::

Here are the numbers for $\sigma_{\text{sensor}}=0.2^\circ$, which gives $a=1/(0.2^\circ\text{ in radians})^2\approx82{,}070\ \mathrm{rad^{-2}}$:

| $\theta$ | $\lambda_{\text{best}}=a(1+\cos\theta)$ | $\lambda_{\text{worst}}=a(1-\cos\theta)$ | $\sigma_{\text{worst}}$ |
| --- | --- | --- | --- |
| $90^\circ$ | $82{,}070$ | $82{,}070$ | $0.200^\circ$ |
| $30^\circ$ | $153{,}145$ | $10{,}995$ | $0.546^\circ$ |
| $10^\circ$ | $162{,}893$ | $1{,}247$ | $1.623^\circ$ |
| $5^\circ$ | $163{,}828$ | $312$ | $3.242^\circ$ |
| $2^\circ$ | $164{,}090$ | $50.0$ | $8.103^\circ$ |

The third eigenvalue, $2a\approx164{,}140$, stays fixed throughout. Only the in-plane bisector direction degrades.

Look at where the weak direction points. In a frame with $\mathbf{b}_1$ along the first axis and $\mathbf{b}_2$ in the first-second plane, the bisector is $(1,\ \tan(\theta/2),\ 0)$ before scaling to length $1$. As $\theta\to0$ it swings onto $\mathbf{b}_1$ itself — exactly the axis a single arrow cannot see at all. The two-arrow blind spot does not appear from nowhere. It is lesson ten's one-arrow blind spot, reached gradually. And no Wahba solver can escape it: it is a statement about how much information two nearly identical directions can hold, not about any algorithm.

This formula is the attitude twin of lesson one's $\kappa(\mathbf{H})=\cot(\phi/2)$ for two nearly parallel columns: the same $\sin(\theta/2)$ sits in the denominator. Indeed the ratio of the two in-plane eigenvalues is $(1+\cos\theta)/(1-\cos\theta)=\cot^2(\theta/2)$ — the squared version, because $\mathbf{F}$ is a normal-equations matrix.

::: key Worst-direction attitude error for two vectors
For two equally weighted vectors at angle $\theta$, $\mathbf{F}$ has eigenvalues $a(1+\cos\theta)$, $a(1-\cos\theta)$ and $2a$, and the worst-observed direction (the bisector) has $\sigma_{\text{worst}} = \sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$. Geometry and sensor noise enter the same formula.
:::

### A mission-design calculation

This can be worked out before a sensor is ever built. The angle between the Sun direction and the magnetic field direction is not fixed: it changes as the spacecraft goes around its orbit and as the seasons turn, and on some orbits it gets small for part of the time. The formula says exactly how bad attitude knowledge gets at those moments, before any telemetry comes down. The same algebra even works inside one instrument: the stars a single **[[star tracker|star-tracker-roll]]** sees all lie close to the direction it looks, so its weakest direction is roll about that line.

::: warning Budget against the worst day, not the typical one
A team that checks its attitude accuracy at one "typical" separation angle, and never at the smallest angle the orbit really produces, is budgeting against the wrong number. At $30^\circ$ two $0.2^\circ$ sensors give $0.55^\circ$ in the worst direction; at $5^\circ$ they give $3.2^\circ$ — six times worse, from the same hardware. Sweep the geometry over the whole mission and design for the worst case.
:::

::: example The fix, quantified
Start with two arrows $2^\circ$ apart, each with $0.2^\circ$ noise: condition number $\kappa(\mathbf{F})=3283$ and worst-direction $\sigma=8.10^\circ$. Now try three ways of improving it, all computed with the `info_matrix` function above:

| Change | $\kappa(\mathbf{F})$ | Worst-direction $\sigma$ | Improvement |
| --- | --- | --- | --- |
| none (2 arrows) | $3283$ | $8.10^\circ$ | — |
| make one existing sensor twice as accurate | — | $6.41^\circ$ | $1.26\times$ |
| add a third arrow $90^\circ$ from both | $3.00$ | $0.200^\circ$ | $40.5\times$ |
| add a third arrow on the same arc, $4^\circ$ from the first | $1232$ | $4.05^\circ$ | $2.0\times$ |

**Better sensor.** Doubling one sensor's accuracy multiplies its weight by four. But the weak direction is the bisector, which *neither* arrow sees well, so this buys only a factor of $1.26$. (Improving both sensors twofold would buy exactly $2$, since $\sigma_{\text{worst}}$ is proportional to $\sigma_{\text{sensor}}$.)

**Well-placed third arrow.** It looks straight across the blind spot. The condition number falls from $3283$ to $3$, and the worst direction drops right back to the single-sensor noise floor, $0.2^\circ$ — forty times better.

**Poorly placed third arrow.** One that is itself only a few degrees from the other two helps far less, a factor of two, because it barely sees the direction the first two already missed.

Sanity check: the best fix used the *same* quality of sensor as the others. Geometric diversity, not measurement count or sensor quality, is what conditioning asks for — lesson eight's prescription, now in its third setting in this module.
:::

## Check yourself

::: check
Derive $\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = \mathbf{b}_i + [\mathbf{b}_i\times]\boldsymbol{\delta\theta}$ from $\mathbf{A}(\boldsymbol{\delta\theta})=(\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}$, stating which cross-product rule turns $\boldsymbol{\delta\theta}\times\mathbf{b}_i$ into $[\mathbf{b}_i\times]\boldsymbol{\delta\theta}$.
:::

::: answer
Multiply out: $\mathbf{A}(\boldsymbol{\delta\theta})\mathbf{r}_i = (\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}\mathbf{r}_i = \mathbf{b}_i - \boldsymbol{\delta\theta}\times\mathbf{b}_i$, using $\mathbf{A}\mathbf{r}_i=\mathbf{b}_i$.

The cross product is anticommutative — swapping the order flips the sign: $\boldsymbol{\delta\theta}\times\mathbf{b}_i=-\mathbf{b}_i\times\boldsymbol{\delta\theta}$. So the expression becomes $\mathbf{b}_i+\mathbf{b}_i\times\boldsymbol{\delta\theta}$. Finally, $\mathbf{b}_i\times\boldsymbol{\delta\theta}=[\mathbf{b}_i\times]\boldsymbol{\delta\theta}$ by the definition of the cross-product matrix.
:::

::: check
Show that $(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i=\mathbf{0}$, and explain in words what this says about a single vector observation's contribution to $\mathbf{F}$.
:::

::: answer
$(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})\mathbf{b}_i = \mathbf{b}_i - \mathbf{b}_i(\mathbf{b}_i^\mathsf{T}\mathbf{b}_i) = \mathbf{b}_i - \mathbf{b}_i(1) = \mathbf{0}$, using $\mathbf{b}_i^\mathsf{T}\mathbf{b}_i=1$ for a unit vector.

So $\mathbf{b}_i$ is an eigenvector of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ with eigenvalue exactly zero. A turn about $\mathbf{b}_i$ gets no information at all from this term, whatever the weight $a_i$. One vector observation truly cannot see rotation about its own direction.
:::

::: check
Using the closed form, what happens to the worst-direction standard deviation if the sensor noise $\sigma_{\text{sensor}}$ is cut in half at a fixed separation $\theta$? Compare that with cutting $\theta$ in half at a fixed $\sigma_{\text{sensor}}$, for a small $\theta$.
:::

::: answer
$\sigma_{\text{worst}}=\sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$ is directly proportional to $\sigma_{\text{sensor}}$, so halving the sensor noise halves the worst-direction uncertainty, at any separation.

For small angles $\sin(\theta/2)\approx\theta/2$, so halving $\theta$ roughly halves the denominator and doubles $\sigma_{\text{worst}}$. Both enter the same formula, but they behave differently: better sensors help by the same factor everywhere, while geometry barely matters at wide angles and dominates everything at narrow ones.
:::

::: check
The eigenvalue for the direction perpendicular to the plane of $\mathbf{r}_1$ and $\mathbf{r}_2$ is $2a$ whatever $\theta$ is. Explain why this direction does not degrade as the two arrows approach each other.
:::

::: answer
A turn about the axis perpendicular to the plane of both arrows moves each of $\mathbf{b}_1$ and $\mathbf{b}_2$ by the full amount, however close together they are, because that axis is at $90^\circ$ to both of them. Neither arrow loses any sensitivity to it as $\theta$ shrinks. The information collapses only in the plane, along the bisector, which is where the two arrows' own blind spots nearly coincide.
:::

::: check
Two engineers have a two-sensor attitude solution with $\sigma_{\text{sensor}}=0.2^\circ$ at $2^\circ$ separation. One proposes spending the budget on making one existing sensor twice as accurate; the other on adding a third sensor looking $90^\circ$ away from the pair. Using this lesson's numbers, which does more for the worst-direction uncertainty, and why?
:::

::: answer
Doubling one sensor's accuracy takes the worst direction from $8.10^\circ$ to $6.41^\circ$, a factor of only about $1.26$. Even doubling both would give only a factor of $2$, since $\sigma_{\text{worst}}$ is proportional to $\sigma_{\text{sensor}}$.

Adding a well-separated third arrow takes it to $0.200^\circ$, a factor of about $40$. It attacks the real bottleneck — one direction with almost no information — instead of polishing directions that were already well observed. When one direction is badly under-informed, fixing the geometry beats improving any one sensor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{A}(\boldsymbol{\delta\theta})=(\mathbf{I}-[\boldsymbol{\delta\theta}\times])\mathbf{A}$ | Small-angle attitude error; $\boldsymbol{\delta\theta}$ a rotation vector in the body frame |
| $[\mathbf{b}_i\times]$ | Jacobian of a predicted body arrow with respect to $\boldsymbol{\delta\theta}$ |
| $[\mathbf{v}\times]^\mathsf{T}[\mathbf{v}\times] = \lVert\mathbf{v}\rVert^2\mathbf{I}-\mathbf{v}\mathbf{v}^\mathsf{T}$ | Double cross product rule; $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ for a unit arrow |
| $\mathbf{F}=\sum_i a_i(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})$, $\mathbf{P}_{\boldsymbol{\delta\theta}}=\mathbf{F}^{-1}$ | Attitude information matrix and covariance; matches Monte Carlo to about $1\%$ |
| Each arrow: rank two, blind along $\mathbf{b}_i$ | The opposite of a scalar measurement's rank-one term |
| Two arrows at $\theta$: $\lambda\in\{a(1+\cos\theta),\,a(1-\cos\theta),\,2a\}$ | Worst eigenvalue, along the bisector, goes to $0$ as $\theta\to0$ |
| $\sigma_{\text{worst}} = \sigma_{\text{sensor}}/(\sqrt2\sin(\theta/2))$ | Attitude twin of $\kappa(\mathbf{H})=\cot(\phi/2)$ |
| Fix: geometric diversity | A well-placed third arrow beat a twice-as-good sensor by about $30\times$ here |

This module opened with one question — given more measurements than unknowns, all slightly wrong, what is the best estimate? — and has now answered it for a state as plain as a clock bias and as structured as a rotation, with the same normal equations, information matrix and conditioning arguments doing the work each time. The **[[Kalman filter|kalman-bridge]]** module picks up where lesson seven left off: a state that moves, and an estimator that predicts as well as it updates.

::: context skew-matrix A cross product dressed as a matrix
For $\mathbf{v}=(v_1,v_2,v_3)$, the cross-product matrix is
$$
[\mathbf{v}\times]=\begin{pmatrix}0&-v_3&v_2\\ v_3&0&-v_1\\ -v_2&v_1&0\end{pmatrix}.
$$
Multiply it by any $\mathbf{w}$ and you get $\mathbf{v}\times\mathbf{w}$. It is called skew-symmetric because flipping it across the diagonal gives its negative. Writing a cross product as a matrix lets all the machinery of linear algebra — Jacobians, transposes, information matrices — work on rotations.
:::

::: context projection Keeping only the sideways part
Multiply an arrow $\mathbf{w}$ by $\mathbf{I}-\mathbf{b}\mathbf{b}^\mathsf{T}$ and you subtract its shadow along $\mathbf{b}$, leaving the part that is sideways to $\mathbf{b}$. That sideways part is exactly what a small rotation can change about where $\mathbf{b}$ points, which is why this matrix measures what one arrow can tell you.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="320" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="300" y="130" font-size="12" fill="#6c7a93">direction b</text>
  <line x1="60" y1="110" x2="220" y2="30" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="220,30 207,31 213,42" fill="#1d6fd1"/>
  <text x="120" y="55" font-size="12" fill="#1d6fd1">w</text>
  <line x1="60" y1="110" x2="220" y2="110" stroke="#1f2a44" stroke-width="3"/>
  <text x="140" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">part along b (removed)</text>
  <line x1="220" y1="110" x2="220" y2="30" stroke="#b4232c" stroke-width="3"/>
  <text x="228" y="72" font-size="12" fill="#b4232c">(I − b bᵀ) w</text>
</svg>
```
:::

::: context rank Counting informed directions
The rank of a matrix counts how many independent directions it acts on. A scalar measurement like a range adds $\mathbf{h}\mathbf{h}^\mathsf{T}/\sigma^2$, which has rank one: it tells you about one direction and nothing about the others. A vector observation adds $a(\mathbf{I}-\mathbf{b}\mathbf{b}^\mathsf{T})$, rank two: it tells you about every direction except one. So a vector measurement is worth two scalar measurements, the same count lesson ten reached by counting constraints on a sphere.
:::

::: context fisher Named for a statistician
Ronald Fisher introduced the information idea in the 1920s: how sharply the data pin down an unknown. A cost that curves steeply around its minimum means lots of information and a small covariance. A flat cost means little information and a large covariance. The attitude $\mathbf{F}$ measures that curvature in each rotation direction. Shuster's QUEST papers gave this same matrix as the covariance of the QUEST answer, which is why QUEST can hand a filter both an attitude and how far to trust it.
:::

::: context monte-carlo Why the simulation and the formula differ slightly
A Monte Carlo average has its own random scatter, shrinking like one over the square root of the number of trials. With $200{,}000$ trials an RMS is good to roughly $0.2\%$. That is why lesson eleven's $20{,}000$-trial numbers differ from these in the third figure. The $1\%$ gap at $2^\circ$ here is bigger than the scatter, so it is real: that is the small-angle approximation wearing thin.
:::

::: context half-angle Where the half-angle rule comes from
The double-angle rule for cosines is $\cos 2x = 1-2\sin^2 x$. Put $x=\theta/2$ and rearrange: $1-\cos\theta = 2\sin^2(\theta/2)$. It is handy here because $1-\cos\theta$ is a difference of two numbers close to $1$ when $\theta$ is small, which hides how small it is; $2\sin^2(\theta/2)\approx\theta^2/2$ shows it plainly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="130" x2="320" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="60" y1="130" x2="301.6" y2="36.2" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="60" y1="130" x2="315.6" y2="82.6" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3"/>
  <text x="326" y="134" font-size="12" fill="#1d6fd1">b1</text>
  <text x="300" y="30" font-size="12" fill="#1d6fd1">b2</text>
  <text x="250" y="84" font-size="12" fill="#b4232c">bisector</text>
  <text x="130" y="122" font-size="12" fill="#1f2a44">θ/2</text>
  <text x="120" y="98" font-size="12" fill="#1f2a44">θ/2</text>
</svg>
```

Here the arrows are $\theta=21^\circ$ apart, and the dashed bisector — the weakest direction — splits the angle into two halves of $10.5^\circ$.
:::

::: context star-tracker-roll The same effect inside one star tracker
A star tracker sees several stars, but all inside a narrow field of view, often around $10$ to $20^\circ$ across. All its star arrows are therefore nearly parallel to its boresight — the direction it looks. By this lesson's algebra, that makes rotation about the boresight the weak direction. Real trackers are specified this way: the roll error about the boresight is typically several times larger than the cross-boresight error. Spacecraft that need the best accuracy carry two trackers pointed well apart, so each one covers the other's roll.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="320" y2="70" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 3"/>
  <line x1="30" y1="70" x2="310" y2="45" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="30" y1="70" x2="310" y2="95" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="30" y1="70" x2="300" y2="55" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="70" x2="300" y2="80" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="70" x2="300" y2="89" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="200" cy="70" rx="8" ry="30" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="200,40 193,35 193,45" fill="#b4232c"/>
  <text x="30" y="30" font-size="12" fill="#1d6fd1">star arrows, all inside a narrow field of view</text>
  <text x="140" y="122" font-size="12" fill="#b4232c">roll about the boresight: weakly seen</text>
</svg>
```
:::

::: context kalman-bridge Where this covariance goes next
A single Wahba answer is a snapshot. Real spacecraft blend snapshots with gyro readings over time in a filter — very often the multiplicative extended Kalman filter, whose error state is exactly this small rotation vector $\boldsymbol{\delta\theta}$. The measurement update of that filter uses the same $[\mathbf{b}_i\times]$ Jacobian and the same $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ structure you met here, so this lesson is the filter's measurement step written out for one moment in time.
:::
