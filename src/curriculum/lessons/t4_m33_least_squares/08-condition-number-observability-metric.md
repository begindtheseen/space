---
id: l08-condition-number-observability-metric
title: The normal matrix condition number as an observability metric
minutes: 16
covers:
  - The normal matrix condition number as an observability metric
---

A filter's reported uncertainty balloons in one particular combination of states for no reason anyone can point to. Two batches of otherwise similar tracking data, processed the same way, disagree sharply on one parameter and agree closely on every other. Rerunning a fit with a slightly different data window flips the sign of an estimated bias. Each of these is the same diagnosis wearing a different costume, and the number that names it is one this module has already used twice: the condition number of the (weighted) design matrix. This lesson makes precise what a large condition number is actually a symptom of — not numerical unease, but a direction in state space the data barely see — and turns lesson one's two-column example into a general tool for diagnosing and fixing real estimation problems.

## From two columns to any number

Lesson one showed that two unit columns at angle $\phi$ give $\kappa(\mathbf{H})=\cot(\phi/2)$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})=\cot^2(\phi/2)$ — squaring, because forming the normal equations squares every singular value. That squaring is not particular to two columns. For any full-column-rank $\mathbf{H}$ with SVD $\mathbf{H}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ (Linear Algebra II), $\mathbf{H}^\mathsf{T}\mathbf{H}=\mathbf{V}\boldsymbol{\Sigma}^2\mathbf{V}^\mathsf{T}$, an eigendecomposition with eigenvalues $\sigma_i^2$ — the squared singular values of $\mathbf{H}$ — so

$$
\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \frac{\sigma_{\max}^2}{\sigma_{\min}^2} = \kappa(\mathbf{H})^2 .
$$

For a weighted problem the relevant matrix is the whitened design matrix $\tilde{\mathbf{H}}=\mathbf{L}^{-1}\mathbf{H}$ of lesson two ($\mathbf{R}=\mathbf{L}\mathbf{L}^\mathsf{T}$), since $\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{H}}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}=\boldsymbol{\Lambda}$, the information matrix. The same identity applies with $\tilde{\mathbf{H}}$ in place of $\mathbf{H}$:

$$
\kappa(\boldsymbol{\Lambda}) = \kappa(\tilde{\mathbf{H}})^2 .
$$

This is the general statement of what lesson one showed for two columns and a scalar $\sigma$; nothing about the argument needed $n=2$ or uniform weighting.

## What a small singular value physically means

$\sigma_{\min}(\tilde{\mathbf{H}}) = \min_{\lVert\mathbf{u}\rVert=1}\lVert\tilde{\mathbf{H}}\mathbf{u}\rVert$, achieved at $\mathbf{u}=\mathbf{v}_{\min}$, the right singular vector for the smallest singular value. Read the definition physically: perturb the true state by one unit along $\mathbf{v}_{\min}$, and the whitened, noise-normalized measurements move by only $\sigma_{\min}$ — arbitrarily little, if $\sigma_{\min}$ is small. A perturbation the data barely register is a perturbation the data cannot pin down; that is what it means for a direction to be **poorly observed**. This is exactly the eigenstructure of $\boldsymbol{\Lambda}$ that lesson two described — $\mathbf{v}_{\min}$ is the eigenvector of $\boldsymbol{\Lambda}$ with the smallest eigenvalue $\sigma_{\min}^2$, and the standard deviation of the estimate along it is $1/\sigma_{\min}$ — arrived at here through the design matrix's SVD directly, without forming $\boldsymbol{\Lambda}$ at all, which is both the numerically preferred route (lesson one) and, as it turns out, the conceptually clearer one: a state direction is poorly observed exactly when some combination of the unknowns moves the model's predictions almost not at all.

::: key Condition number as an observability metric
$\kappa(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}) = \kappa(\mathbf{H}_{\text{weighted}})^2$. A large value means some direction in state space, given by the worst-conditioned right singular vector, carries almost no information — a real perturbation along it barely changes what is measured. Never form the normal equations at that conditioning; solve by QR or SVD on the weighted design matrix, which halves the effective condition number. Fix the underlying problem by adding geometry-diverse measurements, rescaling states to comparable units, estimating fewer parameters, or regularizing with a prior.
:::

::: example Three tracking stations and a distant target
Three ground stations sit roughly along an east-west line — $(0,0)$, $(5000,100)$, $(10000,-50)\,\mathrm{m}$ — tracking a target $40\,\mathrm{km}$ due north, $(5000, 40000)\,\mathrm{m}$, by range alone, $\sigma=3\,\mathrm{m}$ per station:

```python
import numpy as np

stations = np.array([[0.0, 0.0], [5000.0, 100.0], [10000.0, -50.0]])
x_true = np.array([5000.0, 40000.0])
sigma = 3.0

d = x_true - stations
H = d / np.linalg.norm(d, axis=1, keepdims=True)   # unit line-of-sight rows
U, S, Vt = np.linalg.svd(H / sigma)
print("singular values:", S, " cond =", S[0] / S[-1])
print("worst-observed direction:", Vt[-1], " best-observed direction:", Vt[0])
P = np.linalg.inv(H.T @ H / sigma**2)
print("standard deviations:", np.sqrt(np.diag(P)))
# singular values: [0.5744 0.0584]  cond = 9.83
# worst-observed direction: [ 1.  -0.0001]   best-observed direction: [-0.0001 -1.]
# standard deviations: [17.11  1.74]
```

$\kappa=9.83$, so $\kappa(\boldsymbol{\Lambda})=96.6$: not numerically dangerous, but the worst direction, $(1,0)$ — due east, along the baseline — is known to $17.1\,\mathrm{m}$, ten times worse than the $1.74\,\mathrm{m}$ along the best direction, due north, the line of sight to the stations. This is the same mechanism as lesson one's two nearly parallel columns, now in a real geometry: seen from $40\,\mathrm{km}$ away, all three stations' lines of sight to the target point in nearly the same direction, so moving the target east-west changes every range by a nearly identical, second-order amount, while moving it north-south, along the shared line of sight, changes every range by nearly the full amount of the move. Move the same target to $6\,\mathrm{km}$ instead of $40\,\mathrm{km}$ away and $\kappa$ drops to $1.64$ — the geometry did not change, only the ratio of target distance to station spread did, which is the quantity that actually governs the conditioning.
:::

::: example What fixes it, and what does not
Add a fourth station to the same network and re-run the fit. Not every addition helps:

| Fourth station | Position | $\kappa$ | $\kappa(\boldsymbol{\Lambda})$ | Worst-direction $\sigma$ |
| --- | --- | --- | --- | --- |
| — (baseline, 3 stations) | — | $9.83$ | $96.6$ | $17.1\,\mathrm{m}$ |
| South, comparable range | $(5000,-25000)$ | $11.4$ | $129.2$ | $17.1\,\mathrm{m}$ |
| Close in, off the line | $(5000,-2000)$ | $11.4$ | $129.2$ | $17.1\,\mathrm{m}$ |
| East, comparable range | $(35000, 15000)$ | $2.54$ | $6.46$ | $4.05\,\mathrm{m}$ |

A station added south of the network, or tucked close in, views the target from nearly the same azimuth as the original three and adds almost nothing to the direction that was already weak — $\kappa$ even worsens slightly, since the new row is itself nearly parallel to the existing ones. A station placed east, at a comparable range but a genuinely different viewing angle, cuts $\kappa(\boldsymbol{\Lambda})$ by a factor of $15$ and the worst-direction standard deviation by more than $4\times$. "Add more measurements" is not the prescription; **add measurements whose rows are not nearly parallel to the ones you already have** is, and geometric diversity, not sheer count, is what the fix requires.
:::

## The other three fixes

Adding geometry is not always available — a ground network cannot always be moved, a spacecraft's own trajectory is what it is. Three more remedies follow directly from earlier lessons.

**Rescale.** A state combining a position in kilometres with a drag coefficient of order $10^{-3}$ produces a design matrix whose columns differ in scale by six orders of magnitude before geometry even enters, and $\kappa$ inherits that mismatch for reasons having nothing to do with observability. Nondimensionalizing every column to comparable size — dividing by a characteristic scale, not by its own column norm, which would hide a genuinely small effect — removes this artificial contribution and leaves $\kappa$ reporting only the real geometric conditioning.

**Drop a parameter.** Lesson one's accelerometer-bias-and-platform-tilt example — two effects producing the same constant offset until a manoeuvre separates them — has a poorly observed *combination*, not two individually useless parameters. Fixing one of the two at an assumed value (from ground calibration, say) removes that column from $\mathbf{H}$ entirely, and with it the ill-conditioned direction, at the price of a bias if the assumed value is wrong — exactly the trade lesson five's MAP estimate makes smoothly with a prior, of which this is the extreme, all-or-nothing case.

**Regularize.** Lesson five's MAP estimate is the general version of "drop a parameter": rather than fixing a poorly observed direction outright, add prior information to it specifically, $\mathbf{P}_0^{-1}$, and the posterior information matrix $\mathbf{P}_0^{-1}+\boldsymbol{\Lambda}$ has no small eigenvalues left to worry about, however small $\boldsymbol{\Lambda}$'s were. This is the least drastic of the three: it costs bias only in proportion to how wrong the prior turns out to be, concentrated in exactly the direction the data could not have corrected it anyway.

::: warning A large condition number is a symptom, not a verdict
$\kappa(\boldsymbol{\Lambda})=10^{8}$ says a direction in state space is nearly unobserved by this data; it does not by itself say whether that is a flaw in the experiment (fixable by better geometry), an artifact of units (fixable by rescaling), an over-parameterized model (fixable by dropping a state), or simply the truth about what a short tracking arc or a compact sensor network can determine. Compute $\mathbf{v}_{\min}$ and look at what physical combination of states it corresponds to before choosing a fix — the remedy for a units mismatch does nothing for a genuine geometric blind spot, and vice versa.
:::

## Check yourself

::: check
Starting from $\mathbf{H}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, show that $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})=\kappa(\mathbf{H})^2$.
:::

::: answer
$\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^2\mathbf{V}^\mathsf{T}$, using $\mathbf{U}^\mathsf{T}\mathbf{U}=\mathbf{I}$; this is an eigendecomposition with eigenvalues $\sigma_i^2$. So $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \sigma_{\max}^2/\sigma_{\min}^2 = (\sigma_{\max}/\sigma_{\min})^2 = \kappa(\mathbf{H})^2$.
:::

::: check
In the three-station example, why is the worst-observed direction along the baseline (east-west) rather than along the line of sight to the target (north-south)?
:::

::: answer
Each row of $\mathbf{H}$ is a unit line-of-sight vector from a station to the target, and with the target $40\,\mathrm{km}$ north of a baseline only $10\,\mathrm{km}$ long, all three lines of sight point in nearly the same, nearly-due-north direction. Moving the target north-south moves it nearly along every line of sight at once, changing every range by close to the full displacement — well observed. Moving it east-west moves it nearly perpendicular to every line of sight, changing each range only by a small, second-order amount — poorly observed. The condition number is large because the rows of $\mathbf{H}$ are themselves nearly parallel, the same mechanism as lesson one's two nearly parallel columns.
:::

::: check
Why did adding a fourth station south of the network fail to improve the conditioning, while adding one east did?
:::

::: answer
A station to the south views the $40\,\mathrm{km}$-distant target from nearly the same azimuth as the original three — its row in $\mathbf{H}$ is nearly parallel to the rows already present, so it adds redundancy in the direction already well observed and almost nothing in the poorly observed east-west direction. A station to the east views the target from a genuinely different angle, contributing a row with a substantial component in the east-west direction, which is precisely the direction that needed more information.
:::

::: check
A design matrix has two columns in kilometres and one column in a drag coefficient of order $10^{-3}$, and $\kappa(\mathbf{H})=10^{6}$. Before concluding the geometry is bad, what should you check first, and why?
:::

::: answer
Whether the huge condition number is simply the units: a column whose entries are all around $10^{-3}$ next to columns around $10^{3}$ gives $\mathbf{H}$ a large spread in column norms for reasons that have nothing to do with how well the data constrain the corresponding directions. Rescaling each column by a characteristic size for that variable and recomputing $\kappa$ separates an artificial, unit-driven condition number from a genuine geometric one; only the latter calls for a geometry, parameterization, or prior-based fix.
:::

::: check
Lesson five showed a prior can reduce total error even though it introduces bias. Restate that result in this lesson's language: what does adding $\mathbf{P}_0^{-1}$ do to $\kappa(\boldsymbol{\Lambda})$, and why does that matter most exactly where the data are weakest?
:::

::: answer
$\mathbf{P}_0^{-1}$ adds directly to $\boldsymbol{\Lambda}$, and because it is positive definite it raises every eigenvalue, including — most consequentially — the smallest one, which is what $\kappa(\boldsymbol{\Lambda})$ is a ratio against. A weak, broad prior barely changes a large eigenvalue (the data already dominate there) but can be the majority of the information in a direction where $\boldsymbol{\Lambda}$'s eigenvalue was near zero, so the posterior condition number improves most exactly along the direction lesson five showed was worth the bias to stabilize.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \kappa(\mathbf{H})^2$ | General squaring identity, any full-column-rank $\mathbf{H}$ |
| $\kappa(\boldsymbol{\Lambda}) = \kappa(\tilde{\mathbf{H}})^2$, $\tilde{\mathbf{H}}=\mathbf{L}^{-1}\mathbf{H}$ | Weighted version, using the whitened design matrix |
| $\sigma_{\min}(\tilde{\mathbf{H}}) = \min_{\lVert\mathbf{u}\rVert=1}\lVert\tilde{\mathbf{H}}\mathbf{u}\rVert$, at $\mathbf{u}=\mathbf{v}_{\min}$ | Worst-observed direction; a real perturbation there barely changes the (whitened) predictions |
| $1/\sigma_{\min}$ | Standard deviation of the estimate along $\mathbf{v}_{\min}$ |
| Nearly parallel rows of $\mathbf{H}$ $\Rightarrow$ large $\kappa$ | The general mechanism; a distant target relative to network spread is one common cause |
| Four remedies | Geometry-diverse measurements; rescale to comparable units; drop a parameter; regularize with a prior |

Everything in this module so far has quietly assumed the residuals behave — zero mean, the stated covariance, nothing systematic left over. The next lesson stops assuming that and starts checking it, including a case built to pass every ordinary check while still being wrong.
