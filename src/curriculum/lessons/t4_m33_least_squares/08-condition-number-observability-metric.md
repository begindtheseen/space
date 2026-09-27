---
id: l08-condition-number-observability-metric
title: The normal matrix condition number as an observability metric
minutes: 18
covers:
  - The normal matrix condition number as an observability metric
---

Your phone is lost somewhere in a big field. You and a friend stand side by side, and a gadget tells each of you how far away the phone is: "about 40 meters". Each distance puts the phone somewhere on a circle around the person who measured it. But you two are standing almost in the same spot, so your two circles are almost the same circle. They cross at a very shallow angle. You know the phone's *distance* well, and you have almost no idea how far it is to the left or right. Walk ten steps apart and the circles cross at a healthy angle, and the phone is pinned down in both directions.

That is the whole lesson in one picture. Estimation problems go wrong in the same way, and they show it through symptoms that look unrelated. A filter's reported uncertainty balloons in one particular combination of states, for no reason anyone can point to. Two batches of similar tracking data, processed the same way, disagree sharply on one parameter and agree closely on every other. Rerunning a fit with a slightly different data window flips the sign of an estimated bias.

Each of these is the same diagnosis in a different costume. The number that names it is one this module has already used twice: the **condition number** of the (weighted) design matrix. This lesson makes precise what a large condition number is really a symptom of. It is not numerical unease. It is a direction in the state that the data barely see — a direction that is poorly **[[observable|observability-word]]**. We then turn lesson one's two-column example into a general tool for diagnosing and fixing real estimation problems.

## The condition number, recalled

Every matrix $\mathbf{H}$ takes an input vector and stretches it. Some input directions get stretched a lot, others hardly at all. The **[[singular values|stretch-picture]]** $\sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_n$ are these stretch factors, largest to smallest. (In this lesson a $\sigma$ with a number or "max"/"min" under it is a singular value, not a noise level. The noise level stays a plain $\sigma$ in the examples.) The **condition number**, written $\kappa$ (the Greek letter "kappa"), is the ratio of the biggest stretch to the smallest:

$$
\kappa(\mathbf{H}) = \frac{\sigma_{\max}}{\sigma_{\min}} .
$$

It is a pure number, at least $1$. A value of $1$ means every direction is stretched equally — perfect. A rule of thumb from lesson one: solving a problem whose matrix has condition number $\kappa$ loses about $\log_{10}\kappa$ of the roughly $16$ significant digits a computer's double-precision number carries. So $\kappa = 10^6$ costs about six digits.

## From two columns to any number

Lesson one showed that two unit columns at angle $\phi$ give $\kappa(\mathbf{H})=\cot(\phi/2)$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})=\cot^2(\phi/2)$. The normal matrix has the *square* of the condition number, because forming the normal equations squares every singular value. That squaring is not special to two columns. It holds for any $\mathbf{H}$ whose columns are independent (full column rank):

$$
\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \frac{\sigma_{\max}^2}{\sigma_{\min}^2} = \kappa(\mathbf{H})^2 .
$$

::: note Why it has to be true
Write the singular value decomposition from Linear Algebra II, $\mathbf{H}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$. Here $\mathbf{U}$ and $\mathbf{V}$ are rotations (their columns are perpendicular unit vectors) and $\boldsymbol{\Sigma}$ holds the singular values. Then

$$
\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^2\mathbf{V}^\mathsf{T},
$$

using $\mathbf{U}^\mathsf{T}\mathbf{U}=\mathbf{I}$. This is an eigendecomposition: the eigenvalues of $\mathbf{H}^\mathsf{T}\mathbf{H}$ are the squared singular values $\sigma_i^2$, with the same directions $\mathbf{v}_i$ (the columns of $\mathbf{V}$). For a symmetric positive definite matrix the condition number is the ratio of largest to smallest eigenvalue, so it is $\sigma_{\max}^2/\sigma_{\min}^2 = (\sigma_{\max}/\sigma_{\min})^2$. Nothing here needed two columns.
:::

For a weighted problem the matrix that matters is the **whitened design matrix** of lesson two. Factor the measurement noise covariance as $\mathbf{R}=\mathbf{L}\mathbf{L}^\mathsf{T}$ and set $\tilde{\mathbf{H}}=\mathbf{L}^{-1}\mathbf{H}$ (read "H tilde"). For independent noise this just divides each row by its own noise level. Then $\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{H}}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}=\boldsymbol{\Lambda}$, the information matrix. The same argument, with $\tilde{\mathbf{H}}$ in place of $\mathbf{H}$, gives

$$
\kappa(\boldsymbol{\Lambda}) = \kappa(\tilde{\mathbf{H}})^2 .
$$

With the weighting matrix $\mathbf{W} = \mathbf{R}^{-1}$ this is the statement $\kappa(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}) = \kappa(\mathbf{H}_{\text{weighted}})^2$, where $\mathbf{H}_{\text{weighted}}$ is another name for $\tilde{\mathbf{H}}$. Nothing about the argument needed $n=2$ or equal weights.

## What a small singular value physically means

The smallest singular value has a direct meaning. It is the least that $\tilde{\mathbf{H}}$ can stretch any unit vector:

$$
\sigma_{\min}(\tilde{\mathbf{H}}) = \min_{\lVert\mathbf{u}\rVert=1}\lVert\tilde{\mathbf{H}}\mathbf{u}\rVert ,
$$

and the smallest value is reached at $\mathbf{u}=\mathbf{v}_{\min}$, the **right singular vector** belonging to $\sigma_{\min}$ (the last column of $\mathbf{V}$).

Now read that physically. Nudge the true state by one unit along $\mathbf{v}_{\min}$. The whitened measurements — each one measured in units of its own noise — move by only $\sigma_{\min}$. If $\sigma_{\min}$ is tiny, they barely move at all. A change the data barely notice is a change the data cannot pin down. That is what it means for a direction to be **poorly observed**.

This is the same picture as the eigenstructure of $\boldsymbol{\Lambda}$ in lesson two, reached a different way. $\mathbf{v}_{\min}$ is the eigenvector of $\boldsymbol{\Lambda}$ with the smallest eigenvalue, $\sigma_{\min}^2$. The standard deviation of the estimate along that direction is $1/\sigma_{\min}$. Here we got there through the SVD of the design matrix, without ever forming $\boldsymbol{\Lambda}$. That is the route lesson one recommended for accuracy, and it is also the clearer idea: a state direction is poorly observed exactly when some combination of the unknowns barely changes the model's predictions.

::: key Condition number as an observability metric
$\kappa(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}) = \kappa(\mathbf{H}_{\text{weighted}})^2$. A large value means some direction in state space, given by the worst-conditioned right singular vector, carries almost no information — a real perturbation along it barely changes what is measured. Solve by QR or SVD on the weighted design matrix, never the normal equations at that conditioning. Fix the underlying problem by adding geometry-diverse measurements, rescaling states to comparable units, estimating fewer parameters, or regularizing with a prior.
:::

::: example Three tracking stations and a distant target
Three ground stations sit roughly along an east-west line, at $(0,0)$, $(5000,100)$ and $(10000,-50)\,\mathrm{m}$ (east, north). They track a target $40\,\mathrm{km}$ to the north, at $(5000, 40000)\,\mathrm{m}$, by **range** alone — distance only, no angles — with noise $\sigma=3\,\mathrm{m}$ per station.

For a range measurement, each row of $\mathbf{H}$ is the **unit line-of-sight vector**, the length-one arrow pointing from the station to the target. (Lesson six derived this: nudging the target along that arrow changes the range one-for-one.)

```python
import numpy as np
np.set_printoptions(suppress=True)

stations = np.array([[0.0, 0.0], [5000.0, 100.0], [10000.0, -50.0]])
x_true = np.array([5000.0, 40000.0])
sigma = 3.0

d = x_true - stations
H = d / np.linalg.norm(d, axis=1, keepdims=True)   # unit line-of-sight rows
U, S, Vt = np.linalg.svd(H / sigma)                # whiten, then SVD
print("singular values:", S.round(4), " cond =", round(S[0] / S[-1], 2))
print("worst-observed direction:", Vt[-1].round(4))
print("best-observed direction: ", Vt[0].round(4))
P = np.linalg.inv(H.T @ H / sigma**2)
print("standard deviations (east, north):", np.sqrt(np.diag(P)).round(2))
# singular values: [0.5744 0.0584]  cond = 9.83
# worst-observed direction: [ 1.     -0.0001]
# best-observed direction:  [-0.0001 -1.    ]
# standard deviations (east, north): [17.11  1.74]
```

(An SVD may flip the sign of any singular vector; $-\mathbf{v}$ is the same direction.)

**Reading it.** $\kappa=9.83$, so $\kappa(\boldsymbol{\Lambda})=9.83^2=96.6$. That is not dangerous for the arithmetic — it costs about two digits. But look at the directions. The worst one is $(1,0)$: due east, along the baseline. It is known to $17.1\,\mathrm{m}$, which is $1/0.0584$. The best one is due north, along the line of sight, known to $1.74\,\mathrm{m}$. That is ten times better.

**Why.** Seen from $40\,\mathrm{km}$ away, the three lines of sight point within about $7^\circ$ of each other. The rows of $\mathbf{H}$ are [[nearly parallel|dop]] — the same mechanism as lesson one's two nearly parallel columns, now in a real geometry. Moving the target north moves it almost straight along every line of sight, so every range changes by nearly the full move. Moving it east moves it almost sideways to every line of sight, so every range barely changes.

**Sanity check.** Move the same target to $6\,\mathrm{km}$ away instead of $40\,\mathrm{km}$ and $\kappa$ drops to $1.64$. The stations did not move. Only the ratio of target distance to station spread changed, and that ratio is what governs the conditioning.
:::

::: example What fixes it, and what does not
Add a fourth station to the same network and redo the fit. Not every addition helps.

| Fourth station | Position | $\kappa$ | $\kappa(\boldsymbol{\Lambda})$ | Worst-direction $\sigma$ |
| --- | --- | --- | --- | --- |
| none (3 stations) | — | $9.83$ | $96.6$ | $17.1\,\mathrm{m}$ |
| South, comparable range | $(5000,-25000)$ | $11.4$ | $129.2$ | $17.1\,\mathrm{m}$ |
| Close in, off the line | $(5000,-2000)$ | $11.4$ | $129.2$ | $17.1\,\mathrm{m}$ |
| East, comparable range | $(35000, 15000)$ | $2.54$ | $6.46$ | $4.10\,\mathrm{m}$ |

**South or close in.** Both of these stations sit due south of the target, so they look at it along exactly the same line as the middle station. Their row of $\mathbf{H}$ is $(0,1)$, identical to one already there. It adds information only to the north direction, which was already good (its standard deviation improves from $1.74$ to $1.51\,\mathrm{m}$). The east direction stays at $17.1\,\mathrm{m}$. The condition number even gets *worse*, because the biggest singular value grew while the smallest did not.

**East.** A station at $(35000, 15000)$ looks at the target along a line about $50^\circ$ away from the others. Its row has a large east component — exactly the direction that was starving for information. $\kappa(\boldsymbol{\Lambda})$ falls by a factor of $96.6/6.46 \approx 15$, and the worst-direction standard deviation falls from $17.1$ to $4.10\,\mathrm{m}$, more than four times better.

"Add more measurements" is not the prescription. **Add measurements whose rows are not nearly parallel to the ones you already have** is. What the fix needs is [[geometric diversity|station-spread]], not sheer count.
:::

## Never solve at that conditioning

Since $\kappa(\boldsymbol{\Lambda})$ is the square of $\kappa(\tilde{\mathbf{H}})$, forming the normal matrix doubles the number of digits you lose. Take a design matrix with $\kappa(\tilde{\mathbf{H}}) = 10^5$. Its normal matrix has $\kappa(\boldsymbol{\Lambda}) = 10^{10}$ and throws away about ten of your sixteen digits before any solver starts. QR or the SVD work on $\tilde{\mathbf{H}}$ directly and lose only about five. Working on the design matrix takes the *square root* of the normal matrix's condition number, which halves the number of digits lost. No care in the solver afterwards can recover digits that forming $\boldsymbol{\Lambda}$ already destroyed.

But a better solver only stops the arithmetic from making things worse. It does nothing about the real problem: the data still do not see $\mathbf{v}_{\min}$. For that you need one of four fixes. You have met the first — better geometry. The other three follow from earlier lessons.

::: warning A better solver is not a fix
Switching from the normal equations to QR saves digits, not information. In the three-station example, QR and the normal equations give the same $17.1\,\mathrm{m}$ east uncertainty, because that number comes from the geometry, not from round-off. Increasing precision to quadruple digits, or shrinking the stated noise $\mathbf{R}$ on paper, does not change the geometry either.
:::

## The other three fixes

Adding geometry is not always possible. A [[ground network|dsn-geometry]] cannot always be moved, and a spacecraft's own path is what it is.

**Rescale.** Suppose a state mixes a position in kilometers with a drag coefficient around $10^{-3}$. The columns of the design matrix then differ in size by six powers of ten before geometry even enters, and $\kappa$ inherits that mismatch for reasons that have nothing to do with observability. The fix is to **[[nondimensionalize|nondimensional]]** each column: divide it by a characteristic size for that variable, so all columns are comparable. Use a physically meaningful scale, not the column's own length — dividing by its own length would hide a genuinely small effect. What is left in $\kappa$ is then only the real geometric conditioning.

Here is a tiny case. A clock bias (in meters) and a clock drift (in meters per second) are fitted from four readings taken at $t = -1.5, -0.5, 0.5, 1.5\,\mathrm{ms}$. The drift column holds the times in seconds: $-0.0015$ to $0.0015$. The bias column is all ones. The condition number comes out $894$. Now measure drift in meters per millisecond instead, so the drift column holds $-1.5$ to $1.5$. Nothing physical changed, and $\kappa$ drops to $1.12$. The two columns were perpendicular all along; the "ill-conditioning" was entirely units.

**Drop a parameter.** Lesson one had an accelerometer bias and a small platform tilt that produce the same constant offset while the vehicle sits still; only a maneuver separates them. That is a poorly observed *combination*, not two useless parameters. Fixing one of them at an assumed value (from ground calibration, say) removes its column from $\mathbf{H}$, and with it the bad direction. The price is a bias if the assumed value is wrong. This is the extreme, all-or-nothing version of what lesson five's MAP estimate does smoothly with a prior.

**Regularize.** Lesson five's MAP estimate is the general version of "drop a parameter". Rather than fixing a poorly observed direction outright, add [[prior information|tikhonov]] $\mathbf{P}_0^{-1}$. The posterior information matrix is $\mathbf{P}_0^{-1}+\boldsymbol{\Lambda}$, and a positive definite prior lifts every eigenvalue — most usefully the smallest. In the three-station example, $\boldsymbol{\Lambda}$ has eigenvalues $0.330$ and $0.00341\,\mathrm{m^{-2}}$. A weak prior of $10\,\mathrm{m}$ standard deviation on each axis adds $1/10^2 = 0.01\,\mathrm{m^{-2}}$ to both. The big one barely changes, to $0.340$. The small one nearly quadruples, to $0.0134$. $\kappa(\boldsymbol{\Lambda})$ falls from $96.6$ to $25.3$, and the east standard deviation from $17.1$ to $8.6\,\mathrm{m}$. This is the gentlest of the three fixes. It costs bias only in proportion to how wrong the prior turns out to be, and only in the direction where the data could not have corrected it anyway.

::: warning A large condition number is a symptom, not a verdict
$\kappa(\boldsymbol{\Lambda})=10^{8}$ says some direction in state space is nearly unobserved by these data. It does not say why. It could be a flaw in the experiment (fix it with better geometry), an artifact of units (rescale), an over-parameterized model (drop a state), or simply the truth about what a short tracking arc or a compact sensor network can determine. Compute $\mathbf{v}_{\min}$ and look at which physical combination of states it is before choosing a fix. The remedy for a units mismatch does nothing for a real geometric blind spot, and the other way around.
:::

## Check yourself

::: check
Starting from $\mathbf{H}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, show that $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})=\kappa(\mathbf{H})^2$.
:::

::: answer
$\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^2\mathbf{V}^\mathsf{T}$, using $\mathbf{U}^\mathsf{T}\mathbf{U}=\mathbf{I}$. This is an eigendecomposition with eigenvalues $\sigma_i^2$. So $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \sigma_{\max}^2/\sigma_{\min}^2 = (\sigma_{\max}/\sigma_{\min})^2 = \kappa(\mathbf{H})^2$.
:::

::: check
In the three-station example, why is the worst-observed direction along the baseline (east-west) rather than along the line of sight to the target (north-south)?
:::

::: answer
Each row of $\mathbf{H}$ is a unit line-of-sight vector from a station to the target. The target is $40\,\mathrm{km}$ north of a baseline only $10\,\mathrm{km}$ long, so all three lines of sight point nearly due north, within about $7^\circ$ of each other. Moving the target north-south moves it almost along every line of sight at once, changing every range by nearly the full displacement: well observed. Moving it east-west moves it almost perpendicular to every line of sight, changing each range only a little: poorly observed. The condition number is large because the rows of $\mathbf{H}$ are nearly parallel, the same mechanism as lesson one's two nearly parallel columns.
:::

::: check
Why did adding a fourth station south of the network fail to improve the conditioning, while adding one to the east did?
:::

::: answer
The south station views the $40\,\mathrm{km}$-distant target along the same line as the middle station, due north. Its row of $\mathbf{H}$ is parallel to rows already present, so it adds information only in the direction that was already well observed, and nothing in the poorly observed east-west direction. The east station views the target from a very different angle, about $50^\circ$ away. Its row has a large east-west component, which is exactly the direction that needed more information.
:::

::: check
A design matrix has two columns in kilometers and one column holding a drag coefficient of order $10^{-3}$, and $\kappa(\mathbf{H})=10^{6}$. Before concluding the geometry is bad, what should you check first, and why?
:::

::: answer
Check whether the huge condition number comes from nothing more than units. A column whose entries are all around $10^{-3}$ next to columns around $10^{3}$ gives $\mathbf{H}$ a huge spread in column sizes, whatever the data say about those directions. Rescale each column by a characteristic size for its variable and recompute $\kappa$. That separates an artificial, unit-driven condition number from a real geometric one, as in the clock example where $894$ fell to $1.12$. Only a real geometric one calls for a geometry, parameter-list or prior-based fix.
:::

::: check
Lesson five showed a prior can reduce total error even though it adds bias. Restate that in this lesson's language: what does adding $\mathbf{P}_0^{-1}$ do to $\kappa(\boldsymbol{\Lambda})$, and why does it matter most exactly where the data are weakest?
:::

::: answer
$\mathbf{P}_0^{-1}$ adds directly to $\boldsymbol{\Lambda}$. Because it is positive definite, it raises every eigenvalue, including the smallest one, which is what $\kappa(\boldsymbol{\Lambda})$ divides by. A weak, broad prior barely changes a large eigenvalue — the data already dominate there — but it can be most of the information in a direction where $\boldsymbol{\Lambda}$'s eigenvalue was near zero. In the three-station example, a $10\,\mathrm{m}$ prior moved the big eigenvalue by $3\%$ and nearly quadrupled the small one. So the posterior condition number improves most along exactly the direction that lesson five showed was worth the bias to stabilize.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\kappa = \sigma_{\max}/\sigma_{\min}$ | Condition number; about $\log_{10}\kappa$ digits lost in a solve |
| $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \kappa(\mathbf{H})^2$ | General squaring identity, any full-column-rank $\mathbf{H}$ |
| $\kappa(\boldsymbol{\Lambda}) = \kappa(\tilde{\mathbf{H}})^2$, $\tilde{\mathbf{H}}=\mathbf{L}^{-1}\mathbf{H}$ | Weighted version, using the whitened design matrix |
| $\sigma_{\min}(\tilde{\mathbf{H}}) = \min_{\lVert\mathbf{u}\rVert=1}\lVert\tilde{\mathbf{H}}\mathbf{u}\rVert$, at $\mathbf{u}=\mathbf{v}_{\min}$ | Worst-observed direction; a real change there barely moves the whitened predictions |
| $1/\sigma_{\min}$ | Standard deviation of the estimate along $\mathbf{v}_{\min}$ |
| Nearly parallel rows of $\mathbf{H}$ $\Rightarrow$ large $\kappa$ | The general mechanism; a distant target relative to network spread is one common cause |
| QR or SVD on $\tilde{\mathbf{H}}$ | Square root of the normal matrix's $\kappa$: half the digits lost |
| Four remedies | Geometry-diverse measurements; rescale to comparable units; drop a parameter; regularize with a prior |

Everything in this module so far has quietly assumed the residuals behave: zero mean, the stated covariance, nothing systematic left over. The next lesson stops assuming that and starts checking it — including a case built to pass every ordinary check while still being wrong.

::: context observability-word A word from control theory
Rudolf Kálmán made "observability" a precise idea around 1960: a system is observable if its measurements, collected over time, are enough to work out its whole state. Here the word has a softer, practical meaning. A direction is well observed if the data pin it down tightly, and poorly observed if they barely do. A zero singular value means truly unobservable — no amount of that kind of data will ever find it. A small one means observable in principle but expensive in practice.
:::

::: context stretch-picture Singular values are stretch factors
Feed every unit-length arrow into a matrix and look at what comes out. A circle of arrows turns into an ellipse. The long half-axis is the biggest singular value and the short half-axis is the smallest; their ratio is the condition number. This one is drawn for the three-station example, where the ratio is about $9.8$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="70" r="30" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="122" font-size="12" fill="#1f2a44" text-anchor="middle">unit circle</text>
  <line x1="105" y1="70" x2="135" y2="70" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="143,70 133,65 133,75" fill="#6c7a93"/>
  <text x="124" y="60" font-size="12" fill="#6c7a93" text-anchor="middle">H̃</text>
  <ellipse cx="250" cy="70" rx="98" ry="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="250" y1="70" x2="348" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="250" y1="70" x2="250" y2="60" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="100" font-size="12" fill="#1d6fd1" text-anchor="middle">σmax (long)</text>
  <text x="250" y="45" font-size="12" fill="#b4232c" text-anchor="middle">σmin (short)</text>
  <text x="250" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">κ = long ÷ short ≈ 9.8</text>
</svg>
```

The short axis points along the direction the data can barely see.
:::

::: context dop The same number in every GPS receiver
Satellite navigation engineers call this effect **dilution of precision**, or DOP. A receiver computes $(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ from the directions to the satellites in view and reports how much the geometry multiplies the range noise. When the satellites are bunched in one part of the sky, the rows of $\mathbf{H}$ are nearly parallel, DOP is large, and the position is poor, even though every satellite's signal is fine. The GNSS module computes DOP in full; it is this lesson's idea with a name.
:::

::: context station-spread Why distance and spread set the angle
Every range measurement puts the target on a circle around the station. Near the target those circles look like lines crossing at the angle between the two lines of sight. Far-off target, close-set stations: the circles cross at a shallow angle, and a thin band of noise on each one overlaps in a long sliver (below, a sketch not to scale). The sliver points along the baseline — exactly the badly observed east-west direction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="4 3">
    <path d="M100,51.4 A156.79,156.79 0 0 1 260,88.3"/>
    <path d="M100,38.8 A168.79,168.79 0 0 1 260,72"/>
    <path d="M100,88.3 A156.79,156.79 0 0 1 260,51.4"/>
    <path d="M100,72 A168.79,168.79 0 0 1 260,38.8"/>
  </g>
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <path d="M100,45.1 A162.79,162.79 0 0 1 260,80"/>
    <path d="M100,80 A162.79,162.79 0 0 1 260,45.1"/>
  </g>
  <circle cx="180" cy="40" r="4" fill="#b4232c"/>
  <text x="192" y="30" font-size="12" fill="#b4232c">target</text>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3">
    <line x1="150" y1="200" x2="180" y2="40"/>
    <line x1="210" y1="200" x2="180" y2="40"/>
  </g>
  <rect x="144" y="194" width="12" height="12" fill="#1f2a44"/>
  <rect x="204" y="194" width="12" height="12" fill="#1f2a44"/>
  <text x="120" y="215" font-size="12" fill="#1f2a44">station 1</text>
  <text x="222" y="215" font-size="12" fill="#1f2a44">station 2</text>
  <text x="275" y="62" font-size="11" fill="#1f2a44">range ± noise</text>
</svg>
```
:::

::: context dsn-geometry How NASA spreads its antennas out
NASA's Deep Space Network has three big antenna sites: Goldstone in California, near Madrid in Spain, and near Canberra in Australia. They are spread roughly a third of the way around the world from each other. That keeps every deep-space probe in view of at least one site as Earth turns, and it gives navigators widely separated viewpoints — the geometric diversity this lesson says the conditioning needs.
:::

::: context nondimensional Making numbers comparable
To nondimensionalize a quantity is to divide it by a typical size of the same kind, so the result has no units and sits near $1$. Orbit engineers measure distance in Earth radii and time in fractions of an orbit for exactly this reason: the equations stop mixing numbers like $6.4 \times 10^6$ with numbers like $10^{-3}$, and the computer's digits go where the information is.
:::

::: context tikhonov Regularization has two famous names
Adding a little prior information to steady an ill-conditioned problem was worked out independently in several fields. Mathematicians often call it Tikhonov regularization, after the Russian mathematician Andrey Tikhonov, who developed it for "ill-posed" problems in the 1940s to 1960s. Statisticians call it ridge regression, after a 1970 paper by Arthur Hoerl and Robert Kennard. In estimation language, both are a Gaussian prior centered on a guess, exactly lesson five's MAP estimate.
:::
