---
id: l05-the-state-transition-matrix
title: The state transition matrix for two-body motion
minutes: 21
covers:
  - the state transition matrix and its use in targeting
---

A Lambert solve gives you one number for the departure velocity, computed from an idealised two-body model. Fly that velocity and the real trajectory — with a real, imperfect burn, real perturbations, a real gravity field that is not a perfect point mass — will not land exactly where Lambert promised. Fixing that requires answering a more specific question than "propagate the trajectory": it requires knowing *how sensitive* the arrival state is to a small change in the departure state, so that a correction can be computed rather than guessed. That sensitivity is the state transition matrix, and this lesson builds it from first principles, verifies its defining structural property numerically, and connects it back to the Lagrange coefficients this module has leaned on throughout.

The next lesson uses exactly what this one builds to close a real targeting loop; this lesson is about earning the matrix itself, including the one identity — a determinant equal to one, for any two-body arc, always — that both explains the structure and gives you a built-in correctness check on your own numerical integration of it.

## The variational equation

Write the two-body state as $\mathbf{x}=(\mathbf{r},\mathbf{v})\in\mathbb{R}^6$, so $\dot{\mathbf{x}} = (\mathbf{v},\, \mathbf{a}(\mathbf{r}))$ with $\mathbf{a}(\mathbf{r}) = -\mu\mathbf{r}/r^3$. Suppose the initial state is perturbed slightly, $\mathbf{x}_0 \to \mathbf{x}_0+\delta\mathbf{x}_0$. To first order, the perturbation at any later time evolves according to the *variational equation*,

$$
\delta\dot{\mathbf{x}} = \mathbf{A}(t)\,\delta\mathbf{x}, \qquad \mathbf{A}(t) = \left.\frac{\partial \dot{\mathbf{x}}}{\partial\mathbf{x}}\right|_{\mathbf{x}(t)} ,
$$

the Jacobian of the dynamics evaluated along the (unperturbed) reference trajectory. Work out $\mathbf{A}$ in $3\times3$ blocks: the top row is $\partial\mathbf{v}/\partial\mathbf{x} = (\mathbf{0}, \mathbf{I})$, since $\dot{\mathbf{r}}=\mathbf{v}$ does not depend on $\mathbf{r}$ at all and depends on $\mathbf{v}$ through the identity. The bottom row is $\partial\mathbf{a}/\partial\mathbf{x} = (\mathbf{G}, \mathbf{0})$, since $\mathbf{a}$ depends only on $\mathbf{r}$ (not on $\mathbf{v}$, for pure two-body motion), where $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$. Differentiate $a_i = -\mu r_i/r^3$ directly:

$$
G_{ij} = \frac{\partial a_i}{\partial r_j} = -\mu\left[\frac{\delta_{ij}}{r^3} - \frac{3r_ir_j}{r^5}\right] = -\frac{\mu}{r^3}\big(\delta_{ij} - 3\hat r_i\hat r_j\big) \quad\Longrightarrow\quad \mathbf{G} = -\frac{\mu}{r^3}\big(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top}\big) .
$$

$$
\mathbf{A} = \begin{pmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{pmatrix} .
$$

$\mathbf{G}$, the gravity-gradient matrix, is symmetric, and its eigenvalues are easy to read off directly from the formula: along $\hat{\mathbf{r}}$, $\mathbf{G}\hat{\mathbf{r}} = -\frac{\mu}{r^3}(\hat{\mathbf{r}}-3\hat{\mathbf{r}}) = +\frac{2\mu}{r^3}\hat{\mathbf{r}}$; perpendicular to $\hat{\mathbf{r}}$, $\mathbf{G}\mathbf{v} = -\frac{\mu}{r^3}\mathbf{v}$. So a radial position perturbation grows (eigenvalue $+2\mu/r^3$, tidal stretching) while a transverse one is compressed (eigenvalue $-\mu/r^3$, doubly degenerate) — the familiar $2$-to-$(-1)$-to-$(-1)$ tidal signature that reappears, combined with the centrifugal term of a rotating frame, as the $3n^2$ coefficient in the Clohessy–Wiltshire equations of the next module.

The state transition matrix $\boldsymbol{\Phi}(t,t_0)$ is defined as the $6\times6$ matrix carrying any small initial perturbation forward:

$$
\delta\mathbf{x}(t) = \boldsymbol{\Phi}(t,t_0)\,\delta\mathbf{x}_0, \qquad \dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\,\boldsymbol{\Phi}, \qquad \boldsymbol{\Phi}(t_0,t_0)=\mathbf{I} .
$$

::: key The state transition matrix
$$
\delta\mathbf{x}_f = \boldsymbol{\Phi}(t_f,t_0)\,\delta\mathbf{x}_0, \qquad \dot{\boldsymbol{\Phi}}=\mathbf{A}(t)\boldsymbol{\Phi},\ \boldsymbol{\Phi}(t_0,t_0)=\mathbf{I},
$$
with $\mathbf{A}=\begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{G}&\mathbf{0}\end{pmatrix}$, $\mathbf{G}=-\dfrac{\mu}{r^3}(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top})$. In practice, integrate the $36$ extra scalar ODEs of $\dot{\boldsymbol{\Phi}}=\mathbf{A}\boldsymbol{\Phi}$ alongside the $6$-state trajectory — exact, if numerically more expensive than finite-differencing the whole propagator.
:::

## A built-in correctness check: $\det\boldsymbol{\Phi}\equiv1$

Before using $\boldsymbol{\Phi}$ for anything, it is worth knowing one structural fact about it that costs nothing extra to check and catches a broken integration immediately. Look at the trace of $\mathbf{A}$: its diagonal entries all sit in the two zero blocks — rows $1$–$3$ have their nonzero entries in columns $4$–$6$ (the identity block), and rows $4$–$6$ have theirs in columns $1$–$3$ (the $\mathbf{G}$ block) — so no diagonal entry of $\mathbf{A}$ is ever nonzero, for *any* central force, not only an inverse-square one. $\operatorname{tr}\mathbf{A}\equiv0$, always.

Jacobi's formula for the derivative of a determinant states $\frac{d}{dt}\det\mathbf{M} = \det\mathbf{M}\cdot\operatorname{tr}(\mathbf{M}^{-1}\dot{\mathbf{M}})$. Apply it to $\mathbf{M}=\boldsymbol{\Phi}$, with $\dot{\boldsymbol{\Phi}}=\mathbf{A}\boldsymbol{\Phi}$:

$$
\frac{d}{dt}\det\boldsymbol{\Phi} = \det\boldsymbol{\Phi}\cdot\operatorname{tr}\!\big(\boldsymbol{\Phi}^{-1}\mathbf{A}\boldsymbol{\Phi}\big) = \det\boldsymbol{\Phi}\cdot\operatorname{tr}(\mathbf{A}) = 0 ,
$$

using the cyclic property of the trace, $\operatorname{tr}(\boldsymbol{\Phi}^{-1}\mathbf{A}\boldsymbol{\Phi})=\operatorname{tr}(\mathbf{A}\boldsymbol{\Phi}\boldsymbol{\Phi}^{-1})=\operatorname{tr}(\mathbf{A})$, and the already-established $\operatorname{tr}\mathbf{A}=0$. So $\det\boldsymbol{\Phi}$ is constant in time, and since $\boldsymbol{\Phi}(t_0,t_0)=\mathbf{I}$ has determinant $1$,

$$
\det\boldsymbol{\Phi}(t,t_0) \equiv 1 \quad\text{for all } t .
$$

::: example Verifying $\det\boldsymbol{\Phi}=1$ by direct integration
Take the ISS-like state from the universal-variables lesson, $\mathbf{r}_0=(-2267.240,-3989.573,5001.268)\,\mathrm{km}$, $\mathbf{v}_0=(5.0098,-5.4258,-2.0540)\,\mathrm{km/s}$, and integrate the $42$-element state-plus-$\boldsymbol{\Phi}$ system for one hour with a high-accuracy Runge–Kutta method. The propagated position, $(-2148.598,6242.669,-1592.817)\,\mathrm{km}$, matches the Lagrange-coefficient result from that earlier lesson exactly — confirming the trajectory part of the integration is correct — and
$$
\det\boldsymbol{\Phi}(3600\,\mathrm{s}) = 0.99999999999984 ,
$$
agreeing with the predicted value of exactly $1$ to twelve decimal places, with the residual explained entirely by the integrator's own error tolerance. This check needs no separate ground truth and no independent method — it is a property $\boldsymbol{\Phi}$ must have regardless of the orbit, so any large departure from $1$ in your own code means the STM integration has a bug, full stop, before you have even used $\boldsymbol{\Phi}$ for anything.
:::

## The four blocks, and what they mean

Partition $\boldsymbol{\Phi}$ into $3\times3$ blocks matching the position/velocity split of the state:

$$
\boldsymbol{\Phi}(t_f,t_0) = \begin{pmatrix} \boldsymbol{\Phi}_{rr} & \boldsymbol{\Phi}_{rv} \\ \boldsymbol{\Phi}_{vr} & \boldsymbol{\Phi}_{vv} \end{pmatrix}, \qquad
\begin{pmatrix}\delta\mathbf{r}_f\\\delta\mathbf{v}_f\end{pmatrix} = \begin{pmatrix} \boldsymbol{\Phi}_{rr} & \boldsymbol{\Phi}_{rv} \\ \boldsymbol{\Phi}_{vr} & \boldsymbol{\Phi}_{vv} \end{pmatrix}\begin{pmatrix}\delta\mathbf{r}_0\\\delta\mathbf{v}_0\end{pmatrix} .
$$

$\boldsymbol{\Phi}_{rr}$ is how a departure position error maps into an arrival position error; $\boldsymbol{\Phi}_{vv}$, a departure velocity error into an arrival velocity error; the off-diagonal blocks mix position and velocity. The one the next lesson needs most is $\boldsymbol{\Phi}_{rv}$: the sensitivity of the *arrival position* to a small change in the *departure velocity* — exactly the quantity a targeting correction has to invert, since a burn is a velocity change and a miss is a position error.

It is tempting to reach for the Lagrange coefficients here and guess $\boldsymbol{\Phi}_{rv} \approx g\,\mathbf{I}$, since $\mathbf{r}=f\mathbf{r}_0+g\mathbf{v}_0$ looks, at a glance, like $g$ is the coefficient multiplying $\mathbf{v}_0$, full stop. Resist that guess, or at least check it before trusting it: $f$ and $g$ are themselves functions of the initial state (through $\chi$, $\alpha$, and everything they depend on), so the *true* partial derivative $\partial\mathbf{r}/\partial\mathbf{v}_0$ at fixed $t_f$ picks up extra terms from how $f$ and $g$ themselves shift when $\mathbf{v}_0$ shifts — it is not $g$ times the identity except in a specific limit.

::: example How good is the $g\mathbf{I}$ guess?
For the same ISS-like state and a one-hour propagation, the previous module found $g=-703.83\,\mathrm{s}$. The numerically integrated $\boldsymbol{\Phi}_{rv}$ for this same case is
$$
\boldsymbol{\Phi}_{rv}(3600\,\mathrm{s}) = \begin{pmatrix} 4277.8 & -7174.2 & -918.7 \\ 2039.7 & -2006.5 & -1408.9 \\ -6739.6 & 8673.1 & 1191.5 \end{pmatrix}\mathrm{s} .
$$
Neither the diagonal entries (which range from $-2006.5$ to $4277.8\,\mathrm{s}$) nor the large off-diagonal entries resemble $g=-703.83\,\mathrm{s}$ times the identity in any way — the $g\mathbf{I}$ guess is wrong for an hour-long arc on this orbit, and using it in a targeting correction would send the correction in badly the wrong direction. Repeating the same integration for much shorter steps tells a different story: at $\Delta t=1\,\mathrm{s}$, $\boldsymbol{\Phi}_{rv} = \mathrm{diag}(1.00000,1.00000,1.00000)\,\mathrm{s}$ with off-diagonal terms below $3\times10^{-7}\,\mathrm{s}$; at $\Delta t=10\,\mathrm{s}$, the diagonal is $(9.99986,10.00001,10.00013)\,\mathrm{s}$ with off-diagonal terms near $10^{-4}\,\mathrm{s}$. The $g\mathbf{I}$ picture is the correct *leading-order, short-step* limit — matching the Taylor-expansion result from the Lagrange-coefficients lesson, where $g\approx\Delta t$ for small steps — and it degrades quickly as the step grows and gravity's curvature has time to act.
:::

::: warning Do not substitute a short-step approximation for the real thing
The point of the last example is not "use $g\mathbf{I}$ for short arcs and something else for long ones" as a rule of thumb to memorise — it is that $\boldsymbol{\Phi}_{rv}$ has to be computed for the actual time of flight in question, by integrating the variational equation (or, as the next lesson's differential correction needs, integrating it under whatever perturbed dynamics the real spacecraft actually experiences). Any shortcut is only as good as the assumptions that justify it, and a one-hour transfer is well outside the regime where the short-step limit applies.
:::

## Composition and inversion

Two structural properties make $\boldsymbol{\Phi}$ practical to work with rather than merely correct. First, it composes over sub-intervals exactly as you would want: $\boldsymbol{\Phi}(t_2,t_0) = \boldsymbol{\Phi}(t_2,t_1)\boldsymbol{\Phi}(t_1,t_0)$ for any intermediate $t_1$, because both sides carry a perturbation at $t_0$ forward to $t_2$ by the same underlying linear dynamics, and matrix multiplication is exactly how linear maps compose. Second, because $\det\boldsymbol{\Phi}\equiv1\ne0$, $\boldsymbol{\Phi}$ is always invertible, and $\boldsymbol{\Phi}(t_0,t_f) = \boldsymbol{\Phi}(t_f,t_0)^{-1}$ — running the sensitivity backwards in time is the matrix inverse, not a separate integration. Both facts are used without comment in the next lesson's correction loop: a burn partway along a trajectory needs the STM for the sub-arc from the burn to the target, obtained either by integrating that sub-arc directly or by composing and inverting STMs you already have.

## Check yourself

::: check
Explain why $\operatorname{tr}\mathbf{A}=0$ holds for the two-body Jacobian regardless of the specific force law, as long as the force depends only on position and not on velocity.
:::

::: answer
The Jacobian's block structure puts all of its nonzero entries off the main diagonal: the top-right block (identity, from $\dot{\mathbf{r}}=\mathbf{v}$) sits in rows $1$–$3$, columns $4$–$6$, and the bottom-left block (the force's position-gradient) sits in rows $4$–$6$, columns $1$–$3$. Neither block contributes to the diagonal of the full $6\times6$ matrix, and the two diagonal blocks are both exactly zero (since $\dot{\mathbf{r}}$ does not depend on $\mathbf{r}$, and $\dot{\mathbf{v}}$ does not depend on $\mathbf{v}$ for a purely position-dependent force). This holds for any central or non-central position-dependent force, not only an inverse-square one.
:::

::: check
You integrate the STM for a two-body arc and find $\det\boldsymbol{\Phi} = 1.4$ at the final time. What does this tell you, and what does it not tell you?
:::

::: answer
It tells you something is wrong — a correctly integrated two-body STM has $\det\boldsymbol{\Phi}=1$ exactly, for any arc, so a value of $1.4$ signals a bug (too loose an integrator tolerance, a mistake in building $\mathbf{A}$, a units inconsistency, or similar). It does not, by itself, tell you *what* the bug is or whether the rest of $\boldsymbol{\Phi}$'s numerical entries are close to correct or wildly wrong; it is a necessary check, not a full validation, and a value very close to $1$ does not guarantee $\boldsymbol{\Phi}$ is exactly right either, only that this one property is satisfied.
:::

::: check
Using the composition property, express $\boldsymbol{\Phi}(t_0,t_f)$ (backward in time) in terms of $\boldsymbol{\Phi}(t_f,t_0)$, and explain why this does not require a second numerical integration.
:::

::: answer
$\boldsymbol{\Phi}(t_0,t_f) = \boldsymbol{\Phi}(t_f,t_0)^{-1}$. Because the two-body STM has determinant exactly $1$ for any arc, it is always invertible, and its inverse can be obtained directly by matrix inversion of the already-computed forward STM — no separate backward-in-time integration of the variational equation is needed.
:::

::: check
For a very short propagation time, argue from the Taylor-expansion results of the Lagrange-coefficients lesson ($f\approx1-\tfrac12(\mu/r_0^3)\Delta t^2$, $g\approx\Delta t$) why $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ makes sense as a limit, even though it is not exact for longer steps.
:::

::: answer
For very small $\Delta t$, the correction terms that make $f$ and $g$ depend nontrivially on the initial velocity are themselves second order or higher in $\Delta t$ (the leading correction to $f$ is $O(\Delta t^2)$, and $g$'s own dependence on $\mathbf{v}_0$ beyond the leading $\Delta t$ term is similarly higher order), so to leading order $\mathbf{r}\approx\mathbf{r}_0+\mathbf{v}_0\Delta t$ behaves like uniform motion with $g$ acting as an ordinary scalar coefficient of $\mathbf{v}_0$, giving $\partial\mathbf{r}/\partial\mathbf{v}_0 \approx \Delta t\,\mathbf{I}$. As $\Delta t$ grows, those higher-order terms are no longer negligible, and the true $\boldsymbol{\Phi}_{rv}$ departs from this simple limit, exactly as the numerical example shows.
:::

::: check
The gravity-gradient matrix $\mathbf{G}$ has eigenvalue $+2\mu/r^3$ along the radial direction and $-\mu/r^3$ (twice) transverse to it. Which direction of position perturbation grows fastest under the linearised dynamics, and is this consistent with tidal stretching?
:::

::: answer
The radial direction, with eigenvalue $+2\mu/r^3$, which is positive — a linearised radial perturbation tends to be amplified rather than restored, twice as strongly (in magnitude) as the transverse directions are compressed. This is exactly the signature of tidal stretching: nearby bodies at slightly different radii from a central mass are pulled apart along the radial direction (the one closer in falls "faster") and pushed together in the transverse directions, the same physics that produces the $2$-to-$(-1)$-to-$(-1)$ pattern behind tidal disruption and, combined with the rotating frame's centrifugal term, the Clohessy–Wiltshire equations' radial coefficient.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{A}=\begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{G}&\mathbf{0}\end{pmatrix}$ | Two-body Jacobian; $\mathbf{G}=-\mu/r^3(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top})$ |
| Eigenvalues of $\mathbf{G}$ | $+2\mu/r^3$ radial, $-\mu/r^3$ transverse (twice); tidal stretch/compress |
| $\dot{\boldsymbol{\Phi}}=\mathbf{A}\boldsymbol{\Phi}$, $\boldsymbol{\Phi}(t_0,t_0)=\mathbf{I}$ | Defines the STM; $\delta\mathbf{x}_f=\boldsymbol{\Phi}\,\delta\mathbf{x}_0$ |
| $\operatorname{tr}\mathbf{A}\equiv0$ | Structural; holds for any position-only force |
| $\det\boldsymbol{\Phi}\equiv1$ | From Jacobi's formula and $\operatorname{tr}\mathbf{A}=0$; a free, powerful correctness check |
| $\boldsymbol{\Phi}_{rv}$ | Sensitivity of arrival position to departure velocity; the block the next lesson inverts |
| $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ | Only in the short-step limit; not a substitute for integrating the real arc |
| $\boldsymbol{\Phi}(t_2,t_0)=\boldsymbol{\Phi}(t_2,t_1)\boldsymbol{\Phi}(t_1,t_0)$, $\boldsymbol{\Phi}(t_0,t_f)=\boldsymbol{\Phi}(t_f,t_0)^{-1}$ | Composition and inversion, free of extra integration |

The next lesson puts $\boldsymbol{\Phi}_{rv}$ to work: a Lambert-solved trajectory misses its target once real dynamics are added, and differential correction — a Newton iteration built directly on this lesson's matrix — removes the miss.
