---
id: l11-the-multiplicative-quaternion-ekf
title: "The multiplicative quaternion EKF, and the three-dimensional error"
minutes: 20
covers:
  - "the multiplicative quaternion EKF and why the error state is three-dimensional"
---

Picture an ant standing on a basketball. To say exactly where it is, you might give three numbers: its $x$, $y$ and $z$ from the center of the ball. But the ant cannot go anywhere it likes in those three numbers. It is stuck on the surface. It can walk north-south and east-west, but it can never step "up" off the ball or "down" into it. Three numbers, only two ways to move.

A spacecraft's attitude stored as a **quaternion** has the same problem, one size up. The quaternion is four numbers, but it must always have length one, so it lives on the surface of a four-dimensional ball. An attitude can change in only three ways — pitch, yaw and roll. Four numbers, three ways to move.

That mismatch is behind one of the most common follow-up questions in the domain round. This module's own resource list singles out [[one paper|markley-paper]] for answering it: why does the error state of a quaternion attitude filter have three components when a quaternion has four? It is asked of anyone whose résumé mentions attitude estimation, and it has a complete answer that takes about sixty seconds.

The answer is not "for efficiency", and it is not "because one component is redundant". It is that a four-number description of a three-way-movable quantity forces the filter's uncertainty matrix to be *exactly singular* — a much more serious problem than being wasteful. This lesson derives that, builds the filter that fixes it, and gives you the sixty-second version.

## Why a quaternion cannot be an additive Kalman state

First, the setup. We write a unit quaternion **scalar first**, in the **[[Hamilton convention|hamilton]]**: $\mathbf{q} = (q_0, \mathbf{q}_v)$, where $q_0$ ("q zero") is one number and $\mathbf{q}_v$ ("q vee") is a 3-vector. Here it represents the rotation from the reference frame to the body frame. It has four components and one **constraint** — a rule it must always obey:

$$\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1.$$

Now ask the ant question: which small changes $\delta\mathbf{q}$ ("delta q") keep the quaternion on its sphere? Take the constraint for the changed quaternion, $(\mathbf{q} + \delta\mathbf{q})^{\mathsf{T}}(\mathbf{q} + \delta\mathbf{q}) = 1$, and multiply it out. The $\mathbf{q}^{\mathsf{T}}\mathbf{q}$ part is already $1$, and for a small change the $\delta\mathbf{q}^{\mathsf{T}}\delta\mathbf{q}$ part is tiny enough to drop. What is left is

$$2\,\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0.$$

In words: every allowed change is **perpendicular to $\mathbf{q}$ itself**. The ant can move along the surface, never straight out from the center.

Next, the filter. A Kalman filter keeps a **[[covariance|covariance-picture]]** matrix $\mathbf{P}$ that says how unsure it is in each direction: $\mathbf{P} = \mathbb{E}[\delta\mathbf{q}\,\delta\mathbf{q}^{\mathsf{T}}]$, where $\mathbb{E}$ ("expected value") means the average over all the errors that could happen. How much variance does $\mathbf{P}$ put along $\mathbf{q}$? Sandwich $\mathbf{P}$ between two copies of $\mathbf{q}$:

$$\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbb{E}\!\left[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2\right] = 0.$$

Every error has zero component along $\mathbf{q}$, so its square averages to zero. **Zero variance along $\mathbf{q}$**, forced by geometry rather than chosen. So a $4\times4$ attitude covariance that respects the constraint has **rank** at most three — at most three directions with any uncertainty in them. It is genuinely **[[singular|singular]]**, not merely badly scaled.

That is the whole problem, and it has concrete consequences.

- Nothing in the ordinary covariance update $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ knows that one direction must stay at exactly zero variance.
- Process noise added the natural way — the same amount in every direction, called **isotropic** — injects variance in the radial direction every cycle, forever.
- The ordinary state update $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ (the gain $\mathbf{K}$ times the innovation $\boldsymbol{\nu}$, "nu", the measurement's surprise) adds a vector in $\mathbb{R}^4$ (four-dimensional space) to a point on a sphere. That knocks the point off the sphere, so the result must be **[[renormalized|renormalize]]** — an operation the covariance knows nothing about.

::: example The constraint forces an exactly singular covariance
Take a nominal attitude $\mathbf{q}_0$: a $40^\circ$ rotation about the axis $(1, 2, -1)$. Give it a genuinely three-dimensional, equal-in-every-direction attitude uncertainty of $\sigma = 5^\circ$ per axis. In radians, $\sigma = 5 \times \pi/180 = 0.0872665\,\mathrm{rad}$, so $\mathbf{P}_3 = \sigma^2\mathbf{I}_3$.

Map it into four-number quaternion space. The small-angle quaternion map sends a tiny rotation $\boldsymbol{\delta\theta}$ to $\mathbf{q}_0 \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$. Its $4\times3$ **Jacobian** — the table of how each quaternion component moves per unit of each angle — at $\boldsymbol{\delta\theta} = \mathbf{0}$ is $\mathbf{J}$. Form $\mathbf{P}_4 = \mathbf{J}\mathbf{P}_3\mathbf{J}^{\mathsf{T}}$ and compute its eigenvalues:

$$(0,\ \ 0.00190386,\ \ 0.00190386,\ \ 0.00190386)\ \mathrm{rad^2}$$

Rank exactly three. Check the nonzero ones: $\sigma^2 = 0.0872665^2 = 0.00761544$, and $\sigma^2/4 = 0.00190386$. That is $(2.5^\circ)^2$ written in radians squared. The factor of four comes from the small-angle scaling $\delta\mathbf{q} \approx (1,\ \tfrac12\boldsymbol{\delta\theta})$: half the angle, so a quarter of the variance. And $\mathbf{q}_0^{\mathsf{T}}\mathbf{P}_4\mathbf{q}_0 = -9.2\times10^{-21}$ — zero to machine precision, exactly as the constraint demands.

Now run a naive four-state filter on it. Add isotropic process noise $\sigma_q^2\mathbf{I}_4$ each cycle, because nothing in the naive formulation says any direction is special. An isotropic $4\times4$ matrix spreads its trace equally over four directions, so one quarter of each injection lands in the radial direction — a direction the constraint proves has zero true variance. Nothing in the ordinary covariance recursion ever removes it. On an isotropic start, the filter reports a quarter of its total uncertainty about a quantity that cannot vary.
:::

## The multiplicative formulation

Back to the ant. Instead of tracking its $x$, $y$, $z$ and fighting the rule that keeps it on the ball, lay a small flat map on the ball right where the ant is standing. On that map, the ant's small errors are two plain numbers — east and north — with no rule attached. When the ant moves, slide the map along with it.

The quaternion fix is the same idea. Stop putting the attitude itself in the Kalman state. Carry the attitude as a **nominal quaternion** $\mathbf{q}_{\mathrm{nom}}$ ("q nom", the best current guess) that is integrated exactly and renormalized. Put only a small **error rotation** in the filter state:

$$\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta}), \qquad \delta\mathbf{q}(\boldsymbol{\delta\theta}) \approx \left(1,\ \tfrac12\boldsymbol{\delta\theta}\right)\ \text{for small }\boldsymbol{\delta\theta}.$$

The symbol $\otimes$ is the **quaternion product** — the way two rotations combine into one. $\boldsymbol{\delta\theta}$ ("delta theta") is a 3-vector of small angles, in radians.

This is a **body-frame, right-multiplicative** error: the small rotation is applied on the right, in body axes. The filter's state is the 3-vector $\boldsymbol{\delta\theta}$ — the attitude error written on the flat map at the current nominal, which mathematicians call the **[[tangent space|tangent-space]]**. It carries a well-conditioned $3\times3$ covariance with no constraint, no singular direction and no wasted component. And because rotations combine by multiplication, a small error applied this way is still a rotation by construction. There is no sphere to fall off.

The cycle has four steps.

1. **Propagate.** Integrate $\mathbf{q}_{\mathrm{nom}}$ through the true nonlinear motion equations using the measured spin rate. Carry the $3\times3$ (or larger) error covariance forward through the linearized error equations.
2. **Update.** Correct the error state with an ordinary linear Kalman update.
3. **Inject.** Fold the estimated correction into the nominal: $\mathbf{q}_{\mathrm{nom}} \leftarrow \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$. The arrow $\leftarrow$ means "is replaced by".
4. **Reset.** Set the error state back to zero.

This is the **[[inject-and-reset cycle|mekf-cycle]]**. The reset has one subtlety. Moving the nominal slides the flat map to a new spot, and the covariance was written on the old map. So it must be turned onto the new one:

$$\mathbf{G} = \mathbf{I} - \operatorname{skew}\!\left(\tfrac12\boldsymbol{\delta\hat\theta}\right), \qquad \mathbf{P} \leftarrow \mathbf{G}\,\mathbf{P}\,\mathbf{G}^{\mathsf{T}}.$$

Here $\operatorname{skew}(\mathbf{v})$ is the **[[skew-symmetric matrix|skew]]** that does a cross product: $\operatorname{skew}(\mathbf{v})\mathbf{u} = \mathbf{v}\times\mathbf{u}$. This correction is second order in the estimated error — tiny times tiny — so implementations that leave it out usually still run. That is exactly why it is worth knowing it exists.

::: key Why the MEKF error state is three-dimensional
A quaternion has four parameters with a unit-norm constraint, so a four-dimensional additive error covariance is necessarily singular. The multiplicative formulation carries the estimate as a reference quaternion and the error as a small three-parameter rotation applied multiplicatively, giving a well-conditioned $3\times3$ attitude covariance, then resets the reference after each update.
:::

## The six-state filter with gyro bias

In practice the error state has at least six numbers, because the **[[gyro bias|gyro-bias]]** is estimated alongside the attitude. A gyro reports

$$\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b} + \mathbf{n}_g,$$

read "omega tilde equals omega plus b plus n g": the true spin rate $\boldsymbol{\omega}$, plus a slowly drifting offset $\mathbf{b}$ (the bias), plus fast random noise $\mathbf{n}_g$. The filter uses its best guess of the true rate, $\hat{\boldsymbol{\omega}} = \tilde{\boldsymbol{\omega}} - \hat{\mathbf{b}}$. Write the bias error as $\boldsymbol{\delta}\mathbf{b} = \mathbf{b} - \hat{\mathbf{b}}$. Under the body-frame multiplicative convention above, the linearized error equations are

$$\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b} - \mathbf{n}_g, \qquad \dot{\boldsymbol{\delta}\mathbf{b}} = \mathbf{n}_b,$$

where the dot means rate of change and $\mathbf{n}_b$ is the small random drift of the bias. Stacking the two 3-vectors into one 6-vector, the $6\times6$ error dynamics matrix is

$$\mathbf{F} = \begin{pmatrix}-\operatorname{skew}(\hat{\boldsymbol{\omega}}) & -\mathbf{I}_3 \\ \mathbf{0} & \mathbf{0}\end{pmatrix}.$$

Read it in two parts.

- **The $-\mathbf{I}_3$ block** is the entire reason the bias can be estimated at all. An uncorrected bias feeds straight into the attitude error rate, so it piles up into an attitude error — and an attitude sensor can see attitude error. In filter language, it makes the bias **observable**.
- **The $-\operatorname{skew}(\hat{\boldsymbol{\omega}})$ block** says the error turns as the body turns. That is why vehicle motion improves bias observability: it swings the error into directions the sensors can constrain.

Now the measurement. For a vector-direction sensor with reference direction $\mathbf{r}$, the predicted body-axis reading is $\hat{\mathbf{v}} = \mathbf{A}(\mathbf{q}_{\mathrm{nom}})\mathbf{r}$, where $\mathbf{A}(\mathbf{q})$ is the attitude matrix of lesson 10. The measurement Jacobian on the attitude block is

$$\mathbf{H} = \left.\frac{\partial\mathbf{v}_{\mathrm{body}}}{\partial\boldsymbol{\delta\theta}}\right|_{\boldsymbol{\delta\theta} = \mathbf{0}} = \operatorname{skew}(\hat{\mathbf{v}})$$

for this error convention. A skew matrix wipes out its own vector, since $\hat{\mathbf{v}}\times\hat{\mathbf{v}} = \mathbf{0}$. So $\mathbf{H}\hat{\mathbf{v}} = \mathbf{0}$: **a single vector observation is structurally blind to an attitude error about that vector's own direction**. This is the same degrees-of-freedom fact that made one vector not enough for Wahba's problem, now showing up inside a filter.

::: note Why $\mathbf{H}$ is $+\operatorname{skew}(\hat{\mathbf{v}})$
With the true attitude $\mathbf{q}_{\mathrm{nom}}\otimes\delta\mathbf{q}$, the true attitude matrix is $\mathbf{A}(\delta\mathbf{q})\,\mathbf{A}(\mathbf{q}_{\mathrm{nom}})$: first the nominal, then the small error in body axes. For a small angle, $\mathbf{A}(\delta\mathbf{q}) \approx \mathbf{I} - \operatorname{skew}(\boldsymbol{\delta\theta})$. So the true reading is $(\mathbf{I} - \operatorname{skew}(\boldsymbol{\delta\theta}))\hat{\mathbf{v}} = \hat{\mathbf{v}} - \boldsymbol{\delta\theta}\times\hat{\mathbf{v}}$. Swapping the order of a cross product flips its sign, so $-\boldsymbol{\delta\theta}\times\hat{\mathbf{v}} = \hat{\mathbf{v}}\times\boldsymbol{\delta\theta} = \operatorname{skew}(\hat{\mathbf{v}})\,\boldsymbol{\delta\theta}$. The reading changes by $\operatorname{skew}(\hat{\mathbf{v}})\,\boldsymbol{\delta\theta}$, which is the Jacobian.
:::

::: warning Never mix the two error conventions
The reset Jacobian's sign ($\mathbf{I} - \operatorname{skew}$, not $+$) and the measurement Jacobian ($+\operatorname{skew}(\hat{\mathbf{v}})$, not $-$) both follow from the single choice $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}$. The reference-frame (left-multiplicative) convention, $\mathbf{q}_{\mathrm{true}} = \delta\mathbf{q} \otimes \mathbf{q}_{\mathrm{nom}}$, changes them together, consistently: the reset becomes $\mathbf{I} + \operatorname{skew}(\tfrac12\boldsymbol{\delta\hat\theta})$, and because the error now lives in reference axes, the measurement Jacobian becomes $\mathbf{A}(\mathbf{q}_{\mathrm{nom}})\operatorname{skew}(\mathbf{r})$. Deriving one formula under one convention and copying the other from a paper that used the other is how a filter ends up confidently wrong with no obvious error anywhere in the code. State your convention out loud when you answer this question; it is a large part of what the interviewer is checking.
:::

## The answer, four ways

An interviewer asking why the error state is three-dimensional will accept one good reason. A strong answer gives four, in this order, because each is a different kind of argument, and together they leave nothing to probe.

**Degrees of freedom.** Attitude has three. Any estimator that carries four numbers for it is carrying one number that is not free.

**The constraint makes the covariance singular.** $\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$ forces $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = 0$, so a $4\times4$ attitude covariance is rank three at best. This is the load-bearing reason. It is not inefficiency; it is a rank deficiency.

**The numerics then break.** A singular covariance cannot be factored for a square-root filter, cannot be inverted for the information form, and admits no well-defined **[[Cholesky factor|cholesky]]** for sigma points. Meanwhile round-off and any isotropic process noise inject variance into the direction that must have none, and nothing removes it.

**The geometry.** The error really lives in the tangent space to the unit sphere at the current nominal attitude, which is three-dimensional. The multiplicative formulation is not a trick to shrink the dimension. It is what you get by putting the state where it actually lives.

::: example "Why is the error state three-dimensional and not four?"
**A weak answer:** "Because attitude only has three degrees of freedom, so the fourth quaternion component is redundant. You can always recover it from the norm constraint, so there is no point estimating it."

The first clause is right. Everything after it is a claim about efficiency, and the real reason is a claim about rank.

**A strong answer:**

"Three degrees of freedom is the start of it, but the sharp reason is that the four-parameter covariance is exactly singular, not merely wasteful.

Here is the two-line argument. The constraint is $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1$. Differentiate it, and any allowed variation satisfies $\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$ — every legitimate error is perpendicular to the quaternion itself. So the covariance $\mathbb{E}[\delta\mathbf{q}\delta\mathbf{q}^{\mathsf{T}}]$ gives $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbb{E}[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2] = 0$: zero variance in the radial direction, forced by the geometry. A $4\times4$ attitude covariance is rank three.

That breaks things concretely. Nothing in $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ preserves the zero eigenvalue. Isotropic process noise injects variance into that direction every cycle. A singular covariance cannot be Cholesky-factored, cannot be inverted for an information form, and cannot generate sigma points. On top of that, the additive update $\hat{\mathbf{x}} + \mathbf{K}\boldsymbol{\nu}$ takes the state off the unit sphere, and the renormalization that follows is invisible to the covariance.

The multiplicative fix. Write $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$ with $\delta\mathbf{q} \approx (1, \boldsymbol{\delta\theta}/2)$. I am using the body-frame, right-multiplicative convention, and the signs downstream depend on that. The nominal quaternion is integrated exactly through the real kinematics and renormalized. The filter estimates only $\boldsymbol{\delta\theta}$ — three components, a well-conditioned $3\times3$ covariance, and no constraint on it at all. Because the correction composes multiplicatively, the result is a rotation by construction. There is no sphere to fall off.

Then inject and reset: fold $\delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$ into the nominal and zero the error state, so the filter is always estimating a small quantity where the linearization is good. The reset moves the tangent space, so the covariance is rotated by $\mathbf{G} = \mathbf{I} - \operatorname{skew}(\boldsymbol{\delta\hat\theta}/2)$. It is second order, so many implementations skip it and run anyway, but it keeps the covariance honest after the nominal has moved.

In practice the state is at least six: attitude error plus gyro bias, with $\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b}$. That $-\boldsymbol{\delta}\mathbf{b}$ coupling is what makes the bias observable. It turns into attitude error, and the star tracker sees attitude error."

**What the interviewer learns:** the candidate gives the rank argument rather than the efficiency argument, and derives it in two lines. They list the specific numerical failures, state the convention before using it, and describe the inject-and-reset cycle. They know the reset Jacobian exists and why skipping it is usually survivable, and they connect the structure to bias observability. Nothing in it is memorized trivia; every claim can be reached from the constraint.
:::

## Check yourself

::: check
Derive, in two lines, why a $4\times4$ quaternion error covariance must be singular.
:::

::: answer
The unit-norm constraint is $\mathbf{q}^{\mathsf{T}}\mathbf{q} = 1$. Differentiating it, any variation that keeps the state on the unit sphere satisfies $2\mathbf{q}^{\mathsf{T}}\delta\mathbf{q} = 0$, so every allowed error is perpendicular to $\mathbf{q}$.

Then $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q} = \mathbf{q}^{\mathsf{T}}\mathbb{E}[\delta\mathbf{q}\delta\mathbf{q}^{\mathsf{T}}]\mathbf{q} = \mathbb{E}[(\mathbf{q}^{\mathsf{T}}\delta\mathbf{q})^2] = 0$. For a symmetric matrix like $\mathbf{P}$ that can never go negative, this says $\mathbf{q}$ is in its null space — zero variance along the quaternion itself. A matrix with a nonzero null vector is singular, so the rank is at most three. This is a property of the representation, not of any particular filter or tuning.
:::

::: check
Name three things that break in a filter carrying a singular covariance, and one that breaks in the state update rather than the covariance.
:::

::: answer
In the covariance:

- A singular matrix has no Cholesky factor, so a square-root filter or a sigma-point construction cannot be formed.
- It cannot be inverted, so the information form of the update is unavailable.
- The ordinary recursion does not preserve the zero eigenvalue, so round-off plus any isotropic process noise injects variance into a direction that has none. A quarter of every isotropic noise injection lands there, and on an isotropic start a full quarter of the reported trace lies in a direction that cannot vary.

In the state update, $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ adds a vector in $\mathbb{R}^4$ to a point on the unit sphere, so the result is no longer a unit quaternion. The renormalization that must follow is an operation the covariance knows nothing about, so the reported uncertainty no longer describes the state that was actually kept.
:::

::: check
Write the MEKF error definition, the injection and the reset, and say why the reset needs a Jacobian at all.
:::

::: answer
Error: $\mathbf{q}_{\mathrm{true}} = \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\theta})$ with $\delta\mathbf{q} \approx (1, \tfrac12\boldsymbol{\delta\theta})$, a body-frame right-multiplicative error. The filter state is the three-vector $\boldsymbol{\delta\theta}$.

Injection: $\mathbf{q}_{\mathrm{nom}} \leftarrow \mathbf{q}_{\mathrm{nom}} \otimes \delta\mathbf{q}(\boldsymbol{\delta\hat\theta})$, then reset $\boldsymbol{\delta\hat\theta} \leftarrow \mathbf{0}$.

The reset needs a Jacobian because $\boldsymbol{\delta\theta}$ is written in the tangent space at the *current* nominal attitude, and injection moves the nominal. The covariance describes an error in the old tangent coordinates, so it has to be re-expressed in the new ones: $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\mathsf{T}}$ with $\mathbf{G} = \mathbf{I} - \operatorname{skew}(\tfrac12\boldsymbol{\delta\hat\theta})$. It is second order in the correction, so leaving it out gives a filter that runs but is slightly dishonest about its covariance after each update.
:::

::: check
In the six-state MEKF, which term in the error dynamics makes the gyro bias observable, and why is a single vector measurement not enough to observe all three bias components?
:::

::: answer
The $-\boldsymbol{\delta}\mathbf{b}$ term in $\dot{\boldsymbol{\delta\theta}} = -\hat{\boldsymbol{\omega}}\times\boldsymbol{\delta\theta} - \boldsymbol{\delta}\mathbf{b}$. Nothing measures a bias error directly. It becomes observable only because it drives the attitude error, and the attitude error is what an attitude sensor sees.

A single vector measurement has Jacobian $\mathbf{H} = \operatorname{skew}(\hat{\mathbf{v}})$ on the attitude block, and a skew matrix wipes out its own vector, so $\mathbf{H}\hat{\mathbf{v}} = \mathbf{0}$. An attitude error about the observed direction produces no change in the predicted measurement — and so neither does the bias component that would cause it. A second non-parallel vector fixes this. So does vehicle rotation, which swings the error into an observable direction through the $-\operatorname{skew}(\hat{\boldsymbol{\omega}})$ coupling.
:::

::: check
A colleague says the three-dimensional error state is "only a computational optimization". Give the one-sentence correction, and one experiment that would settle it.
:::

::: answer
The correction: it is not an optimization but the repair of a rank deficiency — the unit-norm constraint puts $\mathbf{q}$ in the null space of the four-parameter covariance, so the four-state filter is not a slower version of the three-state one; its covariance cannot be factored or inverted, and its radial variance is fiction.

The experiment: build an honest three-dimensional attitude covariance, map it into $\mathbb{R}^4$ through the small-angle quaternion map, and compute the eigenvalues. For an isotropic $5^\circ$ uncertainty they come out as $(0, \sigma^2/4, \sigma^2/4, \sigma^2/4)$ — one of them zero to machine precision — and $\mathbf{q}^{\mathsf{T}}\mathbf{P}\mathbf{q}$ is zero to about $10^{-20}$. Then run a naive four-state propagation with isotropic process noise and watch variance pile up along $\mathbf{q}$ — a quarter of every injection — and never leave.
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
| Convention warning | Left-multiplicative error flips the reset sign and makes $\mathbf{H} = \mathbf{A}(\mathbf{q}_{\mathrm{nom}})\operatorname{skew}(\mathbf{r})$; never mix |

The next lesson supplies what the nominal quaternion is integrated *from*: the strapdown mechanization, what an IMU actually measures, how a gyro bias becomes a navigation error, and what the bias states in the filter are for.

::: context markley-paper The paper behind the question
The resource is F. Landis Markley's "Attitude Error Representations for Kalman Filtering", published in the *Journal of Guidance, Control, and Dynamics* in 2003. Markley spent his career at NASA's Goddard Space Flight Center, and he is also a co-author of the attitude textbook this module lists. The multiplicative filter itself is older: E. J. Lefferts, Markley and M. D. Shuster laid it out in 1982 in "Kalman Filtering for Spacecraft Attitude Estimation". If an interviewer names either paper, this is the lineage they mean.
:::

::: context hamilton Hamilton's quaternions, and the other convention
Quaternions were invented by the Irish mathematician William Rowan Hamilton in 1843. The story goes that the multiplication rule came to him on a walk in Dublin, and he scratched $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Brougham Bridge. Aerospace later grew a second habit: some groups, notably at NASA's Jet Propulsion Laboratory, write the product in the opposite order and put the scalar last. Both work. Mixing them silently flips signs, which is why stating your convention is part of a good answer.
:::

::: context covariance-picture Uncertainty that must lie flat
A covariance matrix describes a cloud of possible errors. For a point that must stay on a sphere, the cloud can spread along the surface but never straight out from the center. Drawn in two dimensions, the sphere is a circle, the allowed errors run along the tangent line, and the radial direction must carry zero variance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="135" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="135" r="3" fill="#1f2a44"/>
  <line x1="110" y1="135" x2="110" y2="65" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="65" x2="180" y2="65" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="36,65 48,59 48,71" fill="#1d6fd1"/>
  <polygon points="184,65 172,59 172,71" fill="#1d6fd1"/>
  <line x1="110" y1="62" x2="110" y2="22" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <polygon points="110,16 104,28 116,28" fill="#b4232c"/>
  <circle cx="110" cy="65" r="5" fill="#1f2a44"/>
  <text x="120" y="88" font-size="12" fill="#1f2a44">q</text>
  <text x="118" y="30" font-size="12" fill="#b4232c">along q: zero variance</text>
  <text x="200" y="70" font-size="12" fill="#1d6fd1">along the surface:</text>
  <text x="200" y="86" font-size="12" fill="#1d6fd1">the allowed errors</text>
  <text x="200" y="170" font-size="12" fill="#6c7a93">unit sphere, drawn</text>
  <text x="200" y="186" font-size="12" fill="#6c7a93">as a circle</text>
</svg>
```
:::

::: context singular What "singular" means for a matrix
A **singular** matrix squashes at least one direction flat to zero, so it has no inverse — there is no way to undo a squash. It is the matrix version of dividing by zero. A covariance with a zero eigenvalue says "I am perfectly certain in this direction". For the radial direction of a quaternion that happens to be true, but the filter's equations then need to invert or factor that matrix, and they cannot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="128" width="50" height="2" fill="#b4232c"/>
  <rect x="130" y="40" width="50" height="90" fill="#1d6fd1"/>
  <rect x="200" y="40" width="50" height="90" fill="#1d6fd1"/>
  <rect x="270" y="40" width="50" height="90" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="148">0</text>
    <text x="155" y="148">σ²/4</text>
    <text x="225" y="148">σ²/4</text>
    <text x="295" y="148">σ²/4</text>
    <text x="85" y="118" fill="#b4232c">along q</text>
  </g>
  <text x="190" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">eigenvalues of the 4×4 covariance in the example</text>
  <text x="190" y="164" font-size="11" fill="#6c7a93" text-anchor="middle">three equal, one exactly zero: rank three</text>
</svg>
```
:::

::: context renormalize Putting the quaternion back on its sphere
To **renormalize** a vector, divide it by its own length, so its length becomes exactly one again. After an additive update, a quaternion that was length $1$ might come out length $1.003$; dividing all four numbers by $1.003$ puts it back on the sphere. The trouble is that this quietly changes the state, and the covariance was never told. A small fix in the state is paired with no fix in the uncertainty, and the two drift apart.
:::

::: context tangent-space The flat map at your feet
The **tangent space** at a point on a curved surface is the flat plane that touches the surface at that one point — like a sheet of paper laid on a globe at your city. For small distances, the paper and the globe agree, and on the paper there are no awkward rules: any direction is allowed. For the attitude sphere the tangent space is three-dimensional, one direction per way the vehicle can turn. The MEKF writes its error on this sheet and moves the sheet each time the nominal moves.
:::

::: context mekf-cycle The four steps as a loop
Each measurement goes around the same loop. The nominal quaternion carries the attitude; the small error state only lives for one pass before it is folded in and zeroed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <rect x="20" y="20" width="140" height="44" rx="6"/>
    <rect x="200" y="20" width="140" height="44" rx="6"/>
    <rect x="200" y="120" width="140" height="44" rx="6"/>
    <rect x="20" y="120" width="140" height="44" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="39">1 Propagate</text><text x="90" y="55">nominal and P</text>
    <text x="270" y="39">2 Update</text><text x="270" y="55">error state δθ</text>
    <text x="270" y="139">3 Inject</text><text x="270" y="155">δθ into nominal</text>
    <text x="90" y="139">4 Reset</text><text x="90" y="155">δθ = 0, turn P by G</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="160" y1="42" x2="192" y2="42"/>
    <line x1="270" y1="64" x2="270" y2="112"/>
    <line x1="200" y1="142" x2="168" y2="142"/>
    <line x1="90" y1="120" x2="90" y2="72"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="200,42 190,37 190,47"/>
    <polygon points="270,120 265,110 275,110"/>
    <polygon points="160,142 170,137 170,147"/>
    <polygon points="90,64 85,74 95,74"/>
  </g>
  <text x="180" y="190" font-size="11" fill="#6c7a93" text-anchor="middle">one pass per measurement</text>
</svg>
```
:::

::: context skew The cross product as a matrix
A cross product $\mathbf{v}\times\mathbf{u}$ can be written as a matrix times a vector. For $\mathbf{v} = (v_1, v_2, v_3)$,

$$\operatorname{skew}(\mathbf{v}) = \begin{pmatrix}0 & -v_3 & v_2\\ v_3 & 0 & -v_1\\ -v_2 & v_1 & 0\end{pmatrix}.$$

It is called **skew-symmetric** because flipping it across the diagonal gives its own negative. Writing cross products this way lets a Jacobian be a plain matrix, which is what a Kalman filter needs. It also makes the blind spot easy to see: $\operatorname{skew}(\mathbf{v})\mathbf{v} = \mathbf{v}\times\mathbf{v} = \mathbf{0}$.
:::

::: context gyro-bias A scale that reads 1 kg when empty
A **gyro bias** is a steady offset in a rate gyro's reading, like a bathroom scale that shows 1 kg with nobody on it. Unlike random noise, it does not average away. It adds the same wrong spin rate every second, so the integrated attitude drifts further and further off. Worse, the bias itself wanders slowly with temperature and age, so it cannot be measured once on the ground and subtracted forever. That is why the filter estimates it in flight. Lesson 12 follows a bias all the way into a navigation error.
:::

::: context cholesky The square root of a matrix
A **Cholesky factor** of a covariance $\mathbf{P}$ is a lower-triangular matrix $\mathbf{L}$ with $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$ — a matrix "square root". Square-root filters carry $\mathbf{L}$ instead of $\mathbf{P}$ for numerical safety, and the unscented filter of lesson 8 builds its sigma points from it. The standard algorithm divides by square roots of the diagonal as it goes, so a zero direction makes it fail or produce garbage. It is named after André-Louis Cholesky, a French army officer and surveyor who devised it for map-making calculations.
:::
