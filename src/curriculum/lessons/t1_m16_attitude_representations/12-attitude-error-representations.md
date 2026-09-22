---
id: l12-attitude-error-representations
title: Attitude error representations
minutes: 20
covers:
  - attitude error representations
---

Almost nothing in guidance, navigation and control consumes an attitude. Controllers consume the difference between where the vehicle is pointing and where it should be pointing. Estimators consume the difference between a predicted measurement and an observed one, which is again an attitude difference. Verification consumes the difference between the estimated attitude and the truth. The attitude itself is a waypoint on the way to an error.

Errors are easier than attitudes in one respect and harder in another. Easier, because an error in a working system is small, and small rotations are nearly linear: the whole apparatus of singularities and double covers relaxes when $\Phi$ is an arcminute. Harder, because the error is a rotation between two frames and the bookkeeping about which frame it is resolved in is easy to get wrong — and getting it wrong produces a controller that is stable, well behaved, and driving the wrong axes.

This lesson builds the error quaternion, its small-angle form, the feedback signal every quaternion attitude controller uses, and the three-parameter error state that makes an attitude filter's covariance honest. Conventions as always: unit, scalar-first, Hamilton, and the stored attitude is $q_{N\leftarrow B}$ unless a formula says otherwise.

## The error rotation, and which frame it lives in

Let $q_{\text{est}}$ be the estimated attitude and $q_{\text{cmd}}$ the commanded one. There are two error quaternions and they are not the same object.

$$
\delta q^{B} = q_{\text{est}}^{-1}\otimes q_{\text{cmd}},
\qquad
\delta q^{N} = q_{\text{cmd}}\otimes q_{\text{est}}^{-1} .
$$

Both describe the same rotation — the one carrying the estimated body frame onto the commanded body frame — and both have the same scalar part and therefore the same principal angle. They differ in the frame their vector part is resolved in. With the module's $q_{N\leftarrow B}$ storage, the first is resolved in body axes and the second in reference axes, related by $\delta\mathbf{q}^{N}_v = \mathbf{C}(q_{\text{est}})\,\delta\mathbf{q}^{B}_v$.

Almost all attitude control wants the **body-resolved** error, because torques are applied about body axes. Which of the two formulas gives it depends on the storage direction, and this is exactly the trap:

- with $q$ meaning $q_{N\leftarrow B}$, the body-resolved error is $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$;
- with $q$ meaning $q_{B\leftarrow N}$ — the storage most spacecraft flight software actually uses — the body-resolved error is $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$, the form written in most textbooks and in this module's flashcards.

They are the same statement in two conventions. Name your storage direction, then pick the matching formula, and verify it by constructing a known error and checking that the vector part comes out along the axis you expect in the axes you expect.

::: key The attitude error quaternion
$\delta q = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$. For small errors $\delta q \approx [1,\ \delta\boldsymbol{\theta}/2]$, so the vector part is half the rotation-vector error — the standard feedback signal.
:::

## The small-angle form

Write the error as a principal rotation, $\delta q = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$, and define the **rotation vector** $\delta\boldsymbol{\theta} = \Phi\hat{\mathbf{e}}$ — the three-parameter error, in radians, with magnitude equal to the pointing error and direction equal to its axis. Expanding for small $\Phi$,

$$
\delta q = \Bigl[\,1 - \frac{\Phi^2}{8} + \cdots,\ \ \frac{\delta\boldsymbol{\theta}}{2}\Bigl(1 - \frac{\Phi^2}{24} + \cdots\Bigr)\Bigr]
\ \approx\ \Bigl[\,1,\ \frac{\delta\boldsymbol{\theta}}{2}\,\Bigr].
$$

So the vector part is half the rotation vector and the scalar part is $1$ to second order. How good is that? The relative error of $2\lVert\delta\mathbf{q}_v\rVert$ as an estimate of $\Phi$ is $\sin(\Phi/2)/(\Phi/2) - 1 \approx -\Phi^2/24$:

| $\Phi$ | $0.1^\circ$ | $1^\circ$ | $5^\circ$ | $10^\circ$ | $30^\circ$ | $60^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| relative error of $2\lVert\delta\mathbf{q}_v\rVert$ | $-1.3\times 10^{-7}$ | $-1.3\times 10^{-5}$ | $-3.2\times 10^{-4}$ | $-1.3\times 10^{-3}$ | $-1.1\times 10^{-2}$ | $-4.5\times 10^{-2}$ |
| $w$ | $0.9999996$ | $0.9999619$ | $0.9990482$ | $0.9961947$ | $0.9659258$ | $0.8660254$ |

At a degree the approximation is good to one part in $10^5$; at $10^\circ$ to one part in $10^3$; at $60^\circ$ it is $4.5\%$ low, which is where linearisation stops being honest. A converged attitude estimate lives at the left end of that table, which is why the linear error model works so well in practice and why it must be re-examined after any event that could put the error at $30^\circ$ or more.

::: example An error quaternion, resolved two ways
A spacecraft's estimated attitude is $q_{\text{est}} = [0.93667219,\ 0.07022077,\ -0.10533115,\ 0.32652657]$, a $41^\circ$ rotation. The commanded attitude is $2.400^\circ$ away, about the body axis $\hat{\mathbf{d}} = (0.500275,\ 0.800440,\ -0.330182)$.

Body-resolved:

$$
\delta q^{B} = q_{\text{est}}^{-1}\otimes q_{\text{cmd}}
= [\,0.99978068,\ 0.01047697,\ 0.01676316,\ -0.00691480\,].
$$

Its principal angle is $2\arcsin\lVert\delta\mathbf{q}_v\rVert = 2.400000^\circ$, and normalising the vector part returns $(0.500275,\ 0.800440,\ -0.330182)$ — the body axis it was built from.

Reference-resolved:

$$
\delta q^{N} = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}
= [\,0.99978068,\ -0.00144421,\ 0.02066230,\ -0.00309332\,],
$$

same scalar part, same $2.400000^\circ$, but axis $(-0.068961,\ 0.986624,\ -0.147706)$ — which is $\mathbf{C}(q_{\text{est}})\hat{\mathbf{d}}$ to eight digits, the same physical axis written in reference components.

A controller handed $\delta q^{N}$ when it expects $\delta q^{B}$ applies the right magnitude about the wrong axes, here $41^\circ$ off. The magnitude is right, so every scalar diagnostic agrees; only the direction is wrong.

The small-angle form: $2\delta\mathbf{q}^{B}_v = (0.02095395,\ 0.03352632,\ -0.01382961)\,\mathrm{rad}$ against the exact rotation vector $(0.02095548,\ 0.03352877,\ -0.01383062)$ — short by $7.3\times 10^{-5}$ relative, or $0.00018^\circ$ out of $2.4^\circ$.
:::

## The feedback signal

The standard quaternion attitude control law is

$$
\boldsymbol{\tau} = K\,\delta\mathbf{q}^{B}_v - D\,\boldsymbol{\omega}^{B},
$$

with $\delta q^{B}$ canonicalised to $w\ge 0$ by the shortest-path rule of lesson 07. Three things make it work.

It needs only the **vector part**. Since $\lVert\delta q\rVert = 1$, the scalar carries no independent information; it is $\sqrt{1 - \lVert\delta\mathbf{q}_v\rVert^2}$ up to the sign the guard fixes. Three numbers in, three torques out.

It is **nearly linear** where it matters. With $\delta\mathbf{q}_v \approx \delta\boldsymbol{\theta}/2$ and $J\,\ddot{\delta\boldsymbol{\theta}} = \boldsymbol{\tau}$ for a single axis of inertia $J$, the closed loop is

$$
J\,\ddot{\delta\theta} + D\,\dot{\delta\theta} + \frac{K}{2}\,\delta\theta = 0,
\qquad
\omega_n = \sqrt{\frac{K}{2J}},
\qquad
\zeta = \frac{D}{2\sqrt{JK/2}} .
$$

Standard second-order design applies, which is the point: choose $\omega_n$ and $\zeta$, then read off $K$ and $D$.

It **saturates gracefully** at large errors. As $\Phi\to 180^\circ$, $\lVert\delta\mathbf{q}_v\rVert\to 1$, so the commanded torque is bounded by $K$ no matter how large the error — unlike a law proportional to $\delta\boldsymbol{\theta}$ itself, which would command $\pi K$ at a half turn.

::: example Sizing a quaternion attitude controller
A bus with $J = 1200\,\mathrm{kg\,m^2}$ about the axis of interest is to be closed at $\omega_n = 0.050\,\mathrm{rad/s}$ — a $125.7\,\mathrm{s}$ natural period — with damping $\zeta = 0.70$. Then

$$
K = 2J\omega_n^2 = 2(1200)(0.0025) = 6.00\,\mathrm{N\,m},
\qquad
D = 2\zeta\sqrt{JK/2} = 1.4\sqrt{3600} = 84.0\,\mathrm{N\,m\,s}.
$$

For an initial error of $5.0^\circ$, the vector part has magnitude $\sin 2.5^\circ = 0.043619$, so the initial torque is $6.00\times 0.043619 = 0.2617\,\mathrm{N\,m}$ — within a typical reaction-wheel torque capability and comfortably below the $6.00\,\mathrm{N\,m}$ the law would command at a half turn.

The linear prediction for settling to within $2\%$ of the initial error is $4/(\zeta\omega_n) = 114.3\,\mathrm{s}$. Integrating the full nonlinear closed loop from $5.0^\circ$ at $100\,\mathrm{Hz}$, the error last exceeds $0.10^\circ$ at $t = 119.6\,\mathrm{s}$ and has fallen to $3.4\times 10^{-6}$ degrees by $400\,\mathrm{s}$. The nonlinear answer is $4.6\%$ slower than the linear estimate, which is the price of $\sin(\Phi/2)$ being slightly less than $\Phi/2$ — a small, predictable conservatism.
:::

::: note No continuous feedback is globally stabilising
The sign guard makes the control law discontinuous on the set of $180^\circ$ errors. That is not a defect of this particular law. Because $SO(3)$ is not contractible — the topological fact behind the whole module — no continuous, time-invariant state feedback can drive every initial attitude to a single equilibrium; every such law leaves behind a set of initial conditions that do not converge, and for the quaternion law that set is the $180^\circ$ boundary. Dropping the guard removes the discontinuity and introduces *unwinding*: from an error slightly beyond $180^\circ$ the vehicle turns the long way round rather than the short way. Practical systems keep the guard, add hysteresis about the boundary so the sign does not chatter, and accept a measure-zero set of initial conditions that need a nudge.
:::

## Three-parameter error states and the multiplicative filter

Lesson 07 showed that a $4\times 4$ covariance over a unit quaternion is structurally rank-deficient: the constraint $\lVert q\rVert = 1$ forbids any uncertainty along $q$ itself, so $\mathbf{P}q = \mathbf{0}$. The fix is to keep the quaternion out of the filter's linear algebra entirely.

The **multiplicative extended Kalman filter** carries the attitude in two pieces:

- a unit quaternion $\hat{q}$, the full global attitude, propagated by the quaternion kinematics and normalised;
- a three-parameter error $\delta\boldsymbol{\theta}$, defined by $q_{\text{true}} = \hat{q}\otimes\delta q(\delta\boldsymbol{\theta})$, which is held at zero by construction and whose $3\times 3$ covariance $\mathbf{P}$ is what the filter actually propagates and updates.

After each measurement update produces an estimate $\delta\hat{\boldsymbol{\theta}}$, it is folded into the global quaternion and the error is reset to zero:

$$
\hat{q} \leftarrow \frac{\hat{q}\otimes[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,]}{\bigl\lVert\hat{q}\otimes[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,]\bigr\rVert},
\qquad
\delta\hat{\boldsymbol{\theta}} \leftarrow \mathbf{0}.
$$

The error state never grows large, so its linearisation is never strained; there is no constraint on $\delta\boldsymbol{\theta}$, so the covariance is full rank; and there is no sign ambiguity, because a small error is nowhere near the antipodal set. The same construction works with $4\boldsymbol{\sigma}$ in place of $\delta\boldsymbol{\theta}$, since lesson 09 showed modified Rodrigues parameters are the most nearly linear of the three-parameter sets — which is why some filters use them instead.

::: example A star tracker update and reset, in arcseconds
A filter holds $\hat{q} = [0.9366721892,\ 0.0702207681,\ -0.1053311521,\ 0.3265265717]$ with error covariance $\mathbf{P} = \operatorname{diag}\bigl((30'')^2,\ (30'')^2,\ (200'')^2\bigr)$ in $\mathrm{rad^2}$ — good cross-boresight knowledge, poorer about the boresight, the characteristic shape for a single star tracker. Its condition number is $(200/30)^2 = 44.4$, entirely benign.

A measurement update returns $\delta\hat{\boldsymbol{\theta}} = (12,\ -8,\ 45)$ arcseconds, which is $(5.81776,\ -3.87851,\ 21.81662)\times 10^{-5}\,\mathrm{rad}$ with magnitude $2.2909691\times 10^{-4}\,\mathrm{rad} = 47.255''$. The increment quaternion is

$$
[\,1,\ \delta\hat{\boldsymbol{\theta}}/2\,] = [\,1,\ 2.90888\times 10^{-5},\ -1.93925\times 10^{-5},\ 1.090831\times 10^{-4}\,],
$$

whose norm exceeds $1$ by $6.56\times 10^{-9}$ — small, and still worth normalising, because it accumulates over thousands of updates. The exact increment $[\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$ differs from the normalised first-order form by $4.8\times 10^{-13}$ per component, so at this error size the linear form is exact for any purpose. After the reset,

$$
\hat{q} = [\,0.9366324793,\ 0.0702428567,\ -0.1053474775,\ 0.3266304468\,],
$$

and the principal angle between the old and new estimates is $47.255''$, matching $\lVert\delta\hat{\boldsymbol{\theta}}\rVert$ to eight digits.

Now the contrast. Map the same $3\times 3$ covariance into quaternion space with the $4\times 3$ Jacobian of $q = \hat{q}\otimes[1,\delta\boldsymbol{\theta}/2]$. The resulting $4\times 4$ matrix has eigenvalues $\{0,\ 5.30\times 10^{-9},\ 5.30\times 10^{-9},\ 2.35\times 10^{-7}\}\,\mathrm{rad^2}$ — each a quarter of the corresponding $3\times 3$ eigenvalue, from the factor of $\tfrac12$, and one of them exactly zero, with $\mathbf{P}_4\hat{q} = \mathbf{0}$ to machine precision. That zero is the constraint, and it is why the filter's arithmetic is done in three dimensions and the fourth is carried outside.
:::

::: warning Euler angles are not an error representation
Differencing two Euler-angle triples gives a triple that is not the error rotation, is not resolved in any single frame, and is meaningless near gimbal lock — where two attitudes a hundredth of a degree apart can have triples differing by $180^\circ$ in two components. The error is a rotation and must be computed as one: form $\delta q$ or $\delta\mathbf{C}$, then convert to whatever three numbers you want to display. Requirements written as "yaw error less than $0.1^\circ$" should be read as three components of a rotation vector, and stated that way.
:::

::: warning Keep the error's frame in the name
The two forms $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ and $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ have identical scalar parts, so the reported pointing error is the same and no magnitude check distinguishes them. The only difference is the frame of the vector part, and the consequence is a controller applying the correct torque magnitude about axes rotated by the vehicle's own attitude. Call them `dq_body` and `dq_ref`, and unit-test with a vehicle at a large attitude, never at the identity.
:::

## Check yourself

::: check
An error quaternion has vector part $(0.0010,\ -0.0025,\ 0.0007)$. What is the pointing error in arcseconds, and about which axis?
:::

::: answer
$\lVert\delta\mathbf{q}_v\rVert = \sqrt{10^{-6} + 6.25\times 10^{-6} + 4.9\times 10^{-7}} = \sqrt{7.74\times 10^{-6}} = 2.7821\times 10^{-3}$. The angle is $\Phi = 2\arcsin(2.7821\times 10^{-3}) = 5.5642\times 10^{-3}\,\mathrm{rad}$, which is $5.5642\times 10^{-3}\times 206265 = 1147.6''$, or $0.3188^\circ$. The axis is $\delta\mathbf{q}_v/\lVert\delta\mathbf{q}_v\rVert = (0.3594,\ -0.8986,\ 0.2516)$, in whichever frame the error was formed in — which the calculation cannot tell you and the variable name must.
:::

::: check
Design a quaternion attitude controller for $J = 400\,\mathrm{kg\,m^2}$ with $\omega_n = 0.10\,\mathrm{rad/s}$ and $\zeta = 1.0$. What torque does it command at a $30^\circ$ error, and is the linear model trustworthy there?
:::

::: answer
$K = 2J\omega_n^2 = 2(400)(0.01) = 8.00\,\mathrm{N\,m}$ and $D = 2\zeta\sqrt{JK/2} = 2\sqrt{400\times 4} = 2\times 40 = 80.0\,\mathrm{N\,m\,s}$. At a $30^\circ$ error the vector part has magnitude $\sin 15^\circ = 0.258819$, so the proportional torque is $8.00\times 0.258819 = 2.071\,\mathrm{N\,m}$. The linear model is marginal: from the table, $2\lVert\delta\mathbf{q}_v\rVert$ understates the rotation angle by $1.1\%$ at $30^\circ$, so the effective proportional gain is about $1\%$ low and the response slightly slower than designed. That is acceptable for a transient but should not be the design point; size the bandwidth for the small-error regime and check the large-error response by simulation.
:::

::: check
Why is the error state in a multiplicative filter reset to zero after every update, rather than allowed to accumulate?
:::

::: answer
Because everything that makes the error state well behaved depends on it being small. Its covariance is the covariance of a *linearised* rotation, valid while $\delta\boldsymbol{\theta}$ is small; it has no unit-norm constraint only because it is a rotation vector rather than a quaternion, and rotation vectors are singular at $2\pi$; and it has no sign ambiguity only because it is far from the antipodal set. Folding the estimated error into the global quaternion and zeroing it keeps all three conditions true indefinitely, however far the vehicle rotates, because the global quaternion absorbs the large motion and the error state only ever holds the residual since the last update.
:::

::: check
Two teams report the same $0.05^\circ$ pointing error but their controllers disagree about which way to turn. What single difference explains it, and what test settles it?
:::

::: answer
One team is forming the error in body axes and the other in reference axes — the two forms $q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ and $q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ have the same scalar part and therefore the same reported angle, but their vector parts differ by the vehicle's own attitude. (A second candidate with the same signature is a missing shortest-path sign guard, which flips the vector part outright, but that would report $359.95^\circ$ rather than $0.05^\circ$ unless the angle were computed from $\lVert\delta\mathbf{q}_v\rVert$.) The test: put the vehicle at a large known attitude — $90^\circ$ about a body axis — introduce a known small error about a second body axis, and check which team's error vector points along that body axis. At the identity attitude the two agree and the test proves nothing.
:::

::: check
A filter reports attitude uncertainty as a $3\times 3$ covariance with square-root diagonal $(15'',\ 15'',\ 90'')$. What is the total pointing uncertainty, and why is the third number so much larger?
:::

::: answer
Treating the three as independent, the expected squared rotation-vector magnitude is the trace: $15^2 + 15^2 + 90^2 = 225+225+8100 = 8550\,\mathrm{arcsec^2}$, so the root-sum-square is $92.5''$, about $0.026^\circ$. The third axis is worse because a single star tracker measures directions transverse to its boresight far better than rotation about it: a star displaced by an angle $\epsilon$ on the focal plane gives a cross-boresight attitude change of $\epsilon$, but a roll about the boresight moves a star only by $\epsilon$ times the sine of its angular distance from the boresight, so the information about that axis is reduced by the field of view — a factor of several for a typical tracker. This is why spacecraft carry two trackers with widely separated boresights when roll knowledge matters.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\delta q = q_{\text{cmd}}\otimes q_{\text{est}}^{-1}$ | Attitude error quaternion (flashcard form, body-resolved when $q$ means $q_{B\leftarrow N}$) |
| $\delta q^{B} = q_{\text{est}}^{-1}\otimes q_{\text{cmd}}$ | Body-resolved error with this module's $q_{N\leftarrow B}$ storage |
| Same scalar part | Both forms give the same principal angle; only the vector part's frame differs |
| $\delta q \approx [1,\ \delta\boldsymbol{\theta}/2]$ | Small-angle form; vector part is half the rotation vector |
| $\Phi = 2\arcsin\lVert\delta\mathbf{q}_v\rVert$ | Pointing error, well conditioned at small angles |
| Relative error $\approx -\Phi^2/24$ | $1.3\times 10^{-5}$ at $1^\circ$, $1.1\times 10^{-2}$ at $30^\circ$ |
| $\boldsymbol{\tau} = K\delta\mathbf{q}^{B}_v - D\boldsymbol{\omega}^{B}$ | Standard law; bounded by $K$ at any error |
| $\omega_n = \sqrt{K/2J}$, $\zeta = D/(2\sqrt{JK/2})$ | Closed-loop design from the linearised error dynamics |
| $\hat{q}\leftarrow \hat{q}\otimes[1,\delta\hat{\boldsymbol{\theta}}/2]$, then $\delta\hat{\boldsymbol{\theta}}\leftarrow \mathbf{0}$ | Multiplicative filter update and reset |
| $\mathbf{P}$ is $3\times 3$ | Full rank; the $4\times 4$ version has an exact zero eigenvalue along $\hat{q}$ |
| Worked figures | $J = 1200$, $\omega_n = 0.05$, $\zeta = 0.7$ gives $K = 6.00\,\mathrm{N\,m}$, $D = 84.0\,\mathrm{N\,m\,s}$, settling $119.6\,\mathrm{s}$ from $5^\circ$ |

Small rotations have behaved like vectors throughout this lesson — added, scaled, given covariances. The last lesson explains why that works, what the exact statement is, and where the linear picture ends.
