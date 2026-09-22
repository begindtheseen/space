---
id: l11-the-multiplicative-quaternion-ekf
title: "The multiplicative quaternion EKF, and the three-dimensional error"
minutes: 17
covers:
  - "the multiplicative quaternion EKF and why the error state is three-dimensional"
---

This module's own resource list singles out one paper with the note that it answers "one of the most common follow-up questions", and the question is this: why does the error state of a quaternion attitude filter have three components when a quaternion has four? It is asked constantly, it is asked of anyone whose résumé mentions attitude estimation, and it has a complete answer that takes about sixty seconds to give.

The answer is not "for efficiency", and it is not "because one component is redundant". It is that a four-parameter representation of a three-degree-of-freedom quantity forces the covariance to be *exactly singular*, which is a different and much more serious problem than being merely inefficient. This lesson derives that, builds the filter that fixes it, and gives you the sixty-second version.

## Why a quaternion cannot be an additive Kalman state

A unit quaternion — scalar first, Hamilton convention, $\mathbf{q} = (q_0, \mathbf{q}_v)$, representing the rotation from the reference frame to the body frame — has four components and one constraint, $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1$. Differentiate the constraint. For any variation $\delta\mathbf{q}$ that keeps the state on the unit sphere,

$$2\,\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0,$$

so every legitimate variation is **orthogonal to $\mathbf{q}$ itself**, without exception. A covariance built from legitimate variations, $\mathbf{P} = \mathbb{E}[\delta\mathbf{q}\,\delta\mathbf{q}^{\mathsf{T}}]$, therefore satisfies

$$\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbb{E}\!\left[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2\right] = 0$$

identically: **zero variance along $\mathbf{q}$**, forced by geometry rather than chosen. A $4\times4$ attitude covariance that respects the constraint has rank at most three. It is genuinely singular, not ill-conditioned.

That is the whole problem, and its consequences are concrete. Nothing in the ordinary covariance update $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ knows that one direction must stay at exactly zero variance. Any process noise added the natural isotropic way injects variance in the radial direction every single cycle, forever. And the ordinary state update $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ adds a vector in $\mathbb{R}^4$ to a point on a sphere, which leaves the sphere — so the result has to be renormalised, an operation the covariance knows nothing about.

::: example The constraint forces an exactly singular covariance
Take a nominal attitude $\mathbf{q}_0$ — a $40^\circ$ rotation about $(1, 2, -1)$ — and a genuinely three-dimensional, isotropic attitude uncertainty of $\sigma = 5^\circ$ per axis, so $\mathbf{P}_3 = \sigma^2\mathbf{I}_3$ with $\sigma = 0.0872665\,\mathrm{rad}$. Map it into $\mathbb{R}^4$ through the small-angle quaternion map, $\mathbf{q}_0 \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$, using the $4\times3$ Jacobian $\mathbf{J}$ of that map at $\boldsymbol{\delta\theta} = \mathbf{0}$, and form $\mathbf{P}_4 = \mathbf{J}\mathbf{P}_3\mathbf{J}^{\mathsf{T}}$. The eigenvalues come out

$$(0,\ \ 0.00190386,\ \ 0.00190386,\ \ 0.00190386)\ \mathrm{rad^2}$$

— rank exactly three, with the three nonzero eigenvalues equal to $\sigma^2/4$, which is $(2.5^\circ)^2$ in radians squared. The factor of four is the small-angle scaling $\delta\mathbf{q} \approx (1,\ \tfrac12\boldsymbol{\delta\theta})$. And $\mathbf{q}_0^{\mathsf{T}}\mathbf{P}_4\mathbf{q}_0 = -9.2\times10^{-21}$: zero to machine precision, exactly as the constraint demands.

Now run a naive four-state filter on it. Add isotropic process noise $\sigma_q^2\mathbf{I}_4$ each cycle, because nothing in the naive formulation suggests any direction is different from any other. On an initially isotropic $\mathbf{P}$, one quarter of the trace sits in the radial direction — a direction the unit-norm constraint proves has exactly zero true variance — and nothing in the ordinary covariance recursion ever removes it. The filter reports a quarter of its total uncertainty about a quantity that cannot vary.
:::

## The multiplicative formulation

The fix is to stop trying to put the attitude in the Kalman state at all. Carry the attitude as a **nominal quaternion** that is integrated exactly and renormalised, and put only a small **error rotation** in the filter state:

$$\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta}), \qquad \delta\mathbf{q}(\boldsymbol{\delta\theta}) \approx \left(1,\ \tfrac12\boldsymbol{\delta\theta}\right)\ \text{for small }\boldsymbol{\delta\theta}.$$

This is a **body-frame, right-multiplicative** error. The filter's state is the $3$-vector $\boldsymbol{\delta\theta}$ — the attitude error expressed in the tangent space at the current nominal — carrying a well-conditioned $3\times3$ covariance with no constraint, no singular direction and no wasted component. The composition is multiplicative because rotations compose by multiplication, so a small error applied this way is still a rotation by construction; there is no sphere to fall off.

The cycle has four steps. **Propagate** $\mathbf{q}_{\mathrm{nom}}$ through the true nonlinear kinematics using the measured rate, and propagate the $3\times3$ (or larger) error covariance through the linearised error dynamics. **Update** the error state with an ordinary linear Kalman update. **Inject** the estimated correction into the nominal, $\mathbf{q}_{\mathrm{nom}} \leftarrow \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$. **Reset** the error state to zero. Because the reset moves the nominal, the tangent space moves with it, and the covariance must be rotated into the new one:

$$\mathbf{G} = \mathbf{I} - \operatorname{skew}\!\left(\tfrac12\boldsymbol{\delta\hat\theta}\right), \qquad \mathbf{P} \leftarrow \mathbf{G}\,\mathbf{P}\,\mathbf{G}^{\mathsf{T}},$$

where $\operatorname{skew}(\mathbf{v})\mathbf{u} = \mathbf{v}\times\mathbf{u}$. That correction is second order in the estimated error, so implementations that omit it usually still run — which is exactly why it is worth knowing it exists.

::: key Why the MEKF error state is three-dimensional
A quaternion has four parameters with a unit-norm constraint, so a four-dimensional additive error covariance is necessarily singular. The multiplicative formulation carries the estimate as a reference quaternion and the error as a small three-parameter rotation applied multiplicatively, giving a well-conditioned $3\times3$ attitude covariance, then resets the reference after each update.
:::

## The six-state filter with gyro bias

In practice the error state is at least six-dimensional, because the gyro bias is estimated alongside the attitude. With a gyro reporting $\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b} + \mathbf{n}_g$ and the filter using $\hat{\boldsymbol{\omega}} = \tilde{\boldsymbol{\omega}} - \hat{\mathbf{b}}$, write the bias error as $\boldsymbol{\delta}\mathbf{b} = \mathbf{b} - \hat{\mathbf{b}}$. Under the body-frame multiplicative convention above, the linearised error dynamics are

$$\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b} - \mathbf{n}_g, \qquad \dot{\boldsymbol{\delta}\mathbf{b}} = \mathbf{n}_b,$$

so the $6\times6$ error dynamics matrix is

$$\mathbf{F} = \begin{pmatrix}-\operatorname{skew}(\hat{\boldsymbol{\omega}}) & -\mathbf{I}_3 \\ \mathbf{0} & \mathbf{0}\end{pmatrix}.$$

Two readings. The $-\mathbf{I}_3$ block is the entire reason the bias is observable at all: an uncorrected bias feeds straight into the attitude error rate, so it accumulates into an attitude error that an attitude measurement can see. And the $-\operatorname{skew}(\hat{\boldsymbol{\omega}})$ block says the error rotates with the body — which is what makes vehicle motion improve bias observability, by moving the error into directions the sensors constrain.

For a vector-direction measurement with reference $\mathbf{r}$, predicted as $\hat{\mathbf{v}} = \mathbf{A}(\mathbf{q}_{\mathrm{nom}})\mathbf{r}$ in body axes, the measurement Jacobian on the attitude block is

$$\mathbf{H} = \left.\frac{\partial\mathbf{v}_{\mathrm{body}}}{\partial\boldsymbol{\delta\theta}}\right|_{\boldsymbol{\delta\theta} = \mathbf{0}} = \operatorname{skew}(\hat{\mathbf{v}}),$$

for this error convention. A skew matrix annihilates its own generating vector, so $\mathbf{H}\hat{\mathbf{v}} = \mathbf{0}$: **a single vector observation is structurally blind to an attitude error about that vector's own direction** — the same degrees-of-freedom fact that made one vector insufficient for Wahba's problem, now appearing inside a filter.

::: warning Never mix the two error conventions
The reset Jacobian's sign ($\mathbf{I} - \operatorname{skew}$, not $+$) and the measurement Jacobian's sign ($+\operatorname{skew}(\hat{\mathbf{v}})$, not $-$) both follow from the single choice $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}$. The reference-frame (left-multiplicative) convention, $\mathbf{q}_{\mathrm{true}} = \delta\mathbf{q} \otimes \mathbf{q}_{\mathrm{nom}}$, flips both together, consistently. Deriving one formula under one convention and copying the other from a paper that used the other is how a filter ends up confidently wrong with no obvious error anywhere in the code. State your convention out loud when you answer this question; it is a large part of what the interviewer is checking.
:::

## The answer, four ways

An interviewer asking why the error state is three-dimensional will accept one good reason. A strong answer gives them in this order, because each is a different kind of argument and together they leave nothing to probe.

**Degrees of freedom.** Attitude has three. Any estimator that carries four numbers for it is carrying one number that is not free.

**The constraint makes the covariance singular.** $\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$ forces $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = 0$, so a $4\times4$ attitude covariance is rank three at best. This is the load-bearing reason: it is not inefficiency, it is a rank deficiency.

**The numerics then break.** A singular covariance cannot be factorised for a square-root filter, cannot be inverted for the information form, and admits no well-defined Cholesky for sigma points. Meanwhile round-off and any isotropic process noise inject variance into the direction that must have none, and nothing removes it.

**The geometry.** The error genuinely lives in the tangent space to the unit sphere at the current nominal attitude, which is three-dimensional. The multiplicative formulation is not a trick to reduce the dimension; it is what you get by putting the state where it actually lives.

::: example "Why is the error state three-dimensional and not four?"
**A weak answer:** "Because attitude only has three degrees of freedom, so the fourth quaternion component is redundant. You can always recover it from the norm constraint, so there is no point estimating it."

The first clause is right. Everything after it is a claim about efficiency, and the actual reason is a claim about rank.

**A strong answer:**

"Three degrees of freedom is the start of it, but the sharp reason is that the four-parameter covariance is exactly singular rather than merely wasteful.

Here is the two-line argument. The constraint is $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1$; differentiate it and any admissible variation satisfies $\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$ — every legitimate error is orthogonal to the quaternion itself. So the covariance $\mathbb{E}[\delta\mathbf{q}\delta\mathbf{q}^{\mathsf{T}}]$ gives $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbb{E}[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2] = 0$: identically zero variance in the radial direction, forced by the geometry. A $4\times4$ attitude covariance is rank three.

That breaks things concretely. Nothing in $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ preserves the zero eigenvalue, isotropic process noise injects variance into that direction every cycle, and a singular covariance cannot be Cholesky-factorised, cannot be inverted for an information form, and cannot generate sigma points. On top of that, the additive update $\hat{\mathbf{x}} + \mathbf{K}\boldsymbol{\nu}$ takes the state off the unit sphere and the renormalisation that follows is invisible to the covariance.

The multiplicative fix. Write $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$ with $\delta\mathbf{q} \approx (1, \boldsymbol{\delta\theta}/2)$ — I am using the body-frame, right-multiplicative convention, and the signs downstream depend on that. The nominal quaternion is integrated exactly through the real kinematics and renormalised; the filter estimates only $\boldsymbol{\delta\theta}$, three components, with a well-conditioned $3\times3$ covariance and no constraint on it at all. Because the correction composes multiplicatively, the result is a rotation by construction — there is no sphere to fall off.

Then inject and reset: fold $\delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$ into the nominal and zero the error state, so the filter is always estimating a small quantity where the linearisation is good. The reset moves the tangent space, so the covariance is rotated by $\mathbf{G} = \mathbf{I} - \operatorname{skew}(\boldsymbol{\delta\hat\theta}/2)$ — second order, so many implementations skip it and run anyway, but it is what keeps the covariance honest after the nominal has moved.

In practice the state is at least six: attitude error plus gyro bias, with $\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b}$. That $-\boldsymbol{\delta}\mathbf{b}$ coupling is what makes the bias observable — it turns into attitude error, and the star tracker sees attitude error."

**What the interviewer learns:** the candidate gives the rank argument rather than the efficiency argument, derives it in two lines, lists the specific numerical failures, states the convention before using it, describes the inject-and-reset cycle, knows the reset Jacobian exists and why it is usually survivable to omit, and connects the structure to bias observability. Nothing in it is memorised trivia; every claim is reachable from the constraint.
:::

## Check yourself

::: check
Derive, in two lines, why a $4\times4$ quaternion error covariance must be singular.
:::

::: answer
The unit-norm constraint is $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1$. Differentiating it, any variation that keeps the state on the unit sphere satisfies $2\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$, so every admissible error is orthogonal to $\mathbf{q}$. Then $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbf{q}^{\mathsf{T}}\mathbb{E}[\delta\mathbf{q}\delta\mathbf{q}^{\mathsf{T}}]\mathbf{q} = \mathbb{E}[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2] = 0$, which says $\mathbf{q}$ is in the null space of $\mathbf{P}$ — zero variance along the quaternion itself. A symmetric matrix with a nontrivial null vector is singular, so the rank is at most three. This is a property of the representation, not of any particular filter or tuning.
:::

::: check
Name three things that break in a filter carrying a singular covariance, and one that breaks in the state update rather than the covariance.
:::

::: answer
Covariance: a singular matrix has no Cholesky factor, so a square-root filter or a sigma-point construction cannot be formed; it cannot be inverted, so the information form of the update is unavailable; and the ordinary recursion does not preserve the zero eigenvalue, so round-off plus any isotropic process noise injects variance into a direction with none — on an isotropic start, a full quarter of the reported trace lies in a direction that cannot vary. In the state update, $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ adds a vector in $\mathbb{R}^4$ to a point on the unit sphere, so the result is no longer a unit quaternion; the renormalisation that must follow is an operation the covariance knows nothing about, so the reported uncertainty no longer describes the state that was actually kept.
:::

::: check
Write the MEKF error definition, the injection and the reset, and say why the reset needs a Jacobian at all.
:::

::: answer
Error: $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$ with $\delta\mathbf{q} \approx (1, \tfrac12\boldsymbol{\delta\theta})$, a body-frame right-multiplicative error, and the filter state is the three-vector $\boldsymbol{\delta\theta}$. Injection: $\mathbf{q}_{\mathrm{nom}} \leftarrow \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$, then $\boldsymbol{\delta\hat\theta} \leftarrow \mathbf{0}$. The reset needs a Jacobian because $\boldsymbol{\delta\theta}$ is expressed in the tangent space at the *current* nominal attitude, and injection moves the nominal — so the covariance, which describes an error in the old tangent coordinates, has to be expressed in the new ones: $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\mathsf{T}}$ with $\mathbf{G} = \mathbf{I} - \operatorname{skew}(\tfrac12\boldsymbol{\delta\hat\theta})$. It is second order in the correction, so omitting it leaves a filter that runs and is slightly dishonest about its covariance after each update.
:::

::: check
In the six-state MEKF, which term in the error dynamics makes the gyro bias observable, and why is a single vector measurement not enough to observe all three bias components?
:::

::: answer
The $-\boldsymbol{\delta}\mathbf{b}$ term in $\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b}$. A bias error is not measured directly by anything; it becomes observable only because it drives the attitude error, and the attitude error is what an attitude sensor sees. A single vector measurement has Jacobian $\mathbf{H} = \operatorname{skew}(\hat{\mathbf{v}})$ on the attitude block, and a skew matrix annihilates its own generating vector, so $\mathbf{H}\hat{\mathbf{v}} = \mathbf{0}$: an attitude error about the observed direction produces no change in the predicted measurement, and therefore neither does the bias component that would generate it. A second non-parallel vector, or vehicle rotation that moves the error into an observable direction via the $-\operatorname{skew}(\hat{\boldsymbol{\omega}})$ coupling, resolves it.
:::

::: check
A colleague says the three-dimensional error state is "just a computational optimisation". Give the one-sentence correction, and one experiment that would settle it.
:::

::: answer
The correction: it is not an optimisation but a repair of a rank deficiency — the four-parameter covariance is *exactly* singular because the unit-norm constraint puts $\mathbf{q}$ in its null space, so the four-state filter is not a slower version of the three-state one, it is a filter whose covariance cannot be factorised or inverted and whose radial variance is fiction. The experiment: build an honest three-dimensional attitude covariance, map it into $\mathbb{R}^4$ through the small-angle quaternion map, and compute the eigenvalues. For an isotropic $5^\circ$ uncertainty they come out as $(0, \sigma^2/4, \sigma^2/4, \sigma^2/4)$ — one of them exactly zero to machine precision — and $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q}$ is zero to about $10^{-20}$. Then run a naive four-state propagation with isotropic process noise and watch a quarter of the reported trace accumulate in that zero direction and never leave.
:::

## Summary

| Item | Content |
| --- | --- |
| The constraint | $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1 \Rightarrow \mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0 \Rightarrow \mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = 0$: rank three at best |
| Worked check | Isotropic $5^\circ$ error mapped to $\mathbb{R}^4$ has eigenvalues $(0, \sigma^2/4, \sigma^2/4, \sigma^2/4)$ |
| What breaks | No Cholesky, no inverse, radial variance injected and never removed, additive update leaves the sphere |
| MEKF error | $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$, $\delta\mathbf{q} \approx (1, \tfrac12\boldsymbol{\delta\theta})$; body-frame, right-multiplicative |
| The cycle | Propagate nominal exactly, update the error linearly, inject, reset to zero |
| Reset Jacobian | $\mathbf{G} = \mathbf{I} - \operatorname{skew}(\tfrac12\boldsymbol{\delta\hat\theta})$, $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\mathsf{T}}$; second order |
| Six-state dynamics | $\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b} - \mathbf{n}_g$, $\dot{\boldsymbol{\delta}\mathbf{b}} = \mathbf{n}_b$ |
| Vector-measurement Jacobian | $\mathbf{H} = \operatorname{skew}(\hat{\mathbf{v}})$, $\hat{\mathbf{v}} = \mathbf{A}(\mathbf{q}_{\mathrm{nom}})\mathbf{r}$; blind along $\hat{\mathbf{v}}$ |
| Convention warning | Left-multiplicative error flips both Jacobian signs; never mix |

The next lesson supplies what the nominal quaternion is integrated *from*: the strapdown mechanisation, what an IMU actually measures, how a gyro bias becomes a navigation error, and what the bias states in the filter are for.
