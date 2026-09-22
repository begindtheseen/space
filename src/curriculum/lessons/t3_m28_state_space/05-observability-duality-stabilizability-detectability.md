---
id: l05-observability-duality-stabilizability-detectability
title: Observability, duality, stabilizability and detectability
minutes: 21
covers:
  - Observability and duality; stabilizability and detectability
---

A controller acts on the state. A sensor does not measure the state — it measures a few linear combinations of it, corrupted by noise, and the estimator has to reconstruct the rest. Whether that reconstruction is possible at all is the observability question, and it is the hinge on which the whole estimation tier turns. A Kalman filter applied to an unobservable state does not fail loudly; it returns a confident-looking estimate whose covariance in the unobservable direction never shrinks and whose mean is whatever you initialised it to.

The practical version of the question shows up on every spacecraft. A gyro measures body rate with a slowly drifting bias, and the bias has to be estimated because integrating it produces attitude error that grows without limit. Whether it *can* be estimated depends on the geometry of whatever attitude sensor you have. With a three-axis star tracker, all three bias components are observable. With a sun sensor alone, the bias about the sun line is not — and neither is the attitude about the sun line. That is a rank deficiency of two in a six-state model, and it has been the root cause of real on-orbit attitude anomalies.

This lesson defines observability, derives the rank test, establishes duality with controllability so that every result of Lesson 4 comes across for free, introduces the observability Gramian and says precisely what a badly conditioned one means operationally, and finishes with the two weaker conditions — stabilizability and detectability — that are what real designs actually require.

## Observability and its rank test

> A system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ is **observable** if the initial state $\mathbf{x}(0)$ is uniquely determined by $\mathbf{y}(t)$ and $\mathbf{u}(t)$ on any interval $[0, T]$ with $T > 0$.

Because the system is linear, the input contributes a known term that can be subtracted off; what matters is the unforced output $\mathbf{y}(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{x}(0)$. Two initial states are indistinguishable exactly when their difference produces identically zero output, so observability is the statement that $\mathbf{C}e^{\mathbf{A}t}\mathbf{x}_0 \equiv 0$ forces $\mathbf{x}_0 = \mathbf{0}$.

Differentiate the output at $t = 0$ repeatedly: $\mathbf{y}(0) = \mathbf{C}\mathbf{x}_0$, $\dot{\mathbf{y}}(0) = \mathbf{C}\mathbf{A}\mathbf{x}_0$, $\ddot{\mathbf{y}}(0) = \mathbf{C}\mathbf{A}^2\mathbf{x}_0$, and so on. Cayley–Hamilton stops the list at $n-1$, exactly as in Lesson 4, because every higher power of $\mathbf{A}$ is a combination of the earlier ones. Stacking,

$$\begin{pmatrix}\mathbf{y}(0)\\\dot{\mathbf{y}}(0)\\\vdots\\\mathbf{y}^{(n-1)}(0)\end{pmatrix} = \underbrace{\begin{pmatrix}\mathbf{C}\\\mathbf{C}\mathbf{A}\\\vdots\\\mathbf{C}\mathbf{A}^{n-1}\end{pmatrix}}_{\mathbf{O}_m}\mathbf{x}_0.$$

The initial state is recoverable exactly when this $np\times n$ matrix has a trivial null space.

::: key Observability matrix and duality
$\mathbf{O}_m = [\mathbf{C};\ \mathbf{C}\mathbf{A};\ \dots;\ \mathbf{C}\mathbf{A}^{n-1}]$, observable if and only if $\operatorname{rank}\mathbf{O}_m = n$. Duality: $(\mathbf{A}, \mathbf{C})$ is observable exactly when $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ is controllable — so every controllability result has a free observability twin.
:::

The duality is an identity, not an analogy. Transposing the stack,

$$\mathbf{O}_m(\mathbf{A},\mathbf{C})^\mathsf{T} = \left[\mathbf{C}^\mathsf{T},\ \mathbf{A}^\mathsf{T}\mathbf{C}^\mathsf{T},\ \dots,\ (\mathbf{A}^\mathsf{T})^{n-1}\mathbf{C}^\mathsf{T}\right] = \mathbf{C}_m(\mathbf{A}^\mathsf{T},\mathbf{C}^\mathsf{T}),$$

and transposing preserves rank. So you may take any theorem of Lesson 4, substitute $\mathbf{A}\to\mathbf{A}^\mathsf{T}$ and $\mathbf{B}\to\mathbf{C}^\mathsf{T}$, and read off a theorem about sensing. The null space of $\mathbf{O}_m$ is the **unobservable subspace**: initial states in it produce no output at all, so they are invisible forever. Its dimension is $n - \operatorname{rank}\mathbf{O}_m$.

Applying duality to PBH gives the test you will use in reviews:

$$\text{observable} \iff \operatorname{rank}\begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}\\\mathbf{C}\end{pmatrix} = n \quad\text{for every eigenvalue }\lambda\text{ of }\mathbf{A},$$

and when the rank is short there is a right null vector $\mathbf{v}$ with $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ and $\mathbf{C}\mathbf{v} = \mathbf{0}$: an eigenvector that the sensors cannot see. In modal coordinates the same statement is that column $i$ of $\bar{\mathbf{C}} = \mathbf{C}\mathbf{V}$ is zero.

Duality also settles a question left open in Lesson 1. A realization is **minimal** — of the smallest possible dimension for its transfer matrix — if and only if it is both controllable and observable. Anything else carries states that either the input cannot reach or the output cannot see, and those states cancel out of $\mathbf{G}(s)$ while continuing to exist, and possibly diverge, inside the vehicle.

::: example The gyro bias you cannot see with a sun sensor
Attitude estimation carries the small attitude error $\delta\boldsymbol{\theta}$ and the gyro bias $\mathbf{b}$, six states in all. Linearised about a slow-rotating vehicle, the error kinematics are $\dot{\delta\boldsymbol{\theta}} = -\mathbf{b}$: whatever bias the gyro has is integrated straight into attitude error. So

$$\mathbf{A} = \begin{pmatrix}\mathbf{0}_{3\times3} & -\mathbf{I}_3 \\ \mathbf{0}_{3\times3} & \mathbf{0}_{3\times3}\end{pmatrix}.$$

A sun sensor reports the direction of the Sun in body axes. A small attitude error $\delta\boldsymbol{\theta}$ moves the measured direction by $\delta\hat{\mathbf{s}} = \hat{\mathbf{s}}\times\delta\boldsymbol{\theta} = [\hat{\mathbf{s}}\times]\,\delta\boldsymbol{\theta}$, so

$$\mathbf{C} = \left([\hat{\mathbf{s}}\times]\ \ \ \mathbf{0}_{3\times3}\right), \qquad \operatorname{rank}[\hat{\mathbf{s}}\times] = 2,$$

because a cross-product matrix always has the vector itself in its null space. Build the observability matrix: $\mathbf{C}\mathbf{A} = (\mathbf{0}\ \ -[\hat{\mathbf{s}}\times])$ and $\mathbf{C}\mathbf{A}^2 = \mathbf{0}$, so

$$\mathbf{O}_m = \begin{pmatrix}[\hat{\mathbf{s}}\times] & \mathbf{0}\\ \mathbf{0} & -[\hat{\mathbf{s}}\times]\\ \mathbf{0}&\mathbf{0}\\ \vdots&\vdots\end{pmatrix}, \qquad \operatorname{rank}\mathbf{O}_m = 2 + 2 = 4 < 6.$$

Two dimensions are missing, and computing the null space names them: for $\hat{\mathbf{s}} = (0.6,\ 0,\ 0.8)$ the basis comes out as $(\hat{\mathbf{s}},\ \mathbf{0})$ and $(\mathbf{0},\ \hat{\mathbf{s}})$. In words: **the attitude error about the sun line, and the gyro bias about the sun line**. Both are invisible, and the reason is one sentence of geometry — rotating about the direction you are looking at does not move what you see.

This matters because the two are coupled. The unobservable bias integrates into an unobservable attitude error that grows linearly at the bias rate, so the pointing error about the sun line grows without bound while every residual the filter computes stays at the noise floor. Nothing in the filter output announces it.

Run PBH for the record: all six eigenvalues are zero, and $\operatorname{rank}\begin{pmatrix}\mathbf{A}\\\mathbf{C}\end{pmatrix} = 5$, a deficiency of one because the two missing states form a single Jordan chain — bias feeding attitude — exactly as in the dual case of Lesson 4.

Two things fix it, and both are geometric rather than algorithmic. Add a second sensor with a different boresight: stacking the observability matrices for $\hat{\mathbf{s}}_1 = (0,0,1)$ and $\hat{\mathbf{s}}_2 = (0.6,0,0.8)$ gives rank $6$. Or rotate the vehicle, so that $\hat{\mathbf{s}}$ moves in body axes and the system becomes time-varying; the stacked observability matrix over the manoeuvre again reaches rank $6$. This is why attitude determination procedures specify a slew, and why "we will calibrate the gyros during the next attitude manoeuvre" is a sentence with mathematics behind it.
:::

## The observability Gramian, and what a bad condition number means

Dualising the controllability Gramian gives

$$\mathbf{W}_o(T) = \int_0^T e^{\mathbf{A}^\mathsf{T}\sigma}\,\mathbf{C}^\mathsf{T}\mathbf{C}\,e^{\mathbf{A}\sigma}\,d\sigma, \qquad \mathbf{A}^\mathsf{T}\mathbf{W}_o + \mathbf{W}_o\mathbf{A} + \mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{0}\ \text{ for stable }\mathbf{A},$$

and it has a direct interpretation: the energy in the unforced output is

$$\int_0^T\|\mathbf{y}(t)\|^2dt = \int_0^T\mathbf{x}_0^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\mathbf{C}^\mathsf{T}\mathbf{C}e^{\mathbf{A}t}\mathbf{x}_0\,dt = \mathbf{x}_0^\mathsf{T}\mathbf{W}_o(T)\,\mathbf{x}_0.$$

So $\mathbf{W}_o$ measures how much signal each state direction produces. A large eigenvalue is a direction that shouts; a small one whispers; a zero one is silent, which recovers the rank test. The least-squares reconstruction of the initial state from a noisy record is $\hat{\mathbf{x}}_0 = \mathbf{W}_o(T)^{-1}\int_0^Te^{\mathbf{A}^\mathsf{T}t}\mathbf{C}^\mathsf{T}\mathbf{y}(t)\,dt$, and with white measurement noise of intensity $\sigma^2$ the estimate covariance is $\sigma^2\mathbf{W}_o(T)^{-1}$. The Gramian is the information matrix of the estimation problem.

That identification is what makes its condition number an operational quantity rather than a numerical curiosity. Suppose $\operatorname{cond}(\mathbf{W}_o) = 10^9$. Since $\mathbf{W}_o$ is a ratio of output **energies**, a unit state along the worst eigenvector produces $10^9$ times less output energy than a unit state along the best — which in **amplitude** is a factor of $\sqrt{10^9} = 3.2\times10^4$, about $10^{4.5}$. Four consequences follow, and they are what to say when asked:

- **The estimate along that direction converges slowly.** Information accumulates $10^9$ times more slowly there, so if the strong direction settles in a second, the weak one needs on the order of $10^9$ seconds of comparable geometry.
- **It is noise-dominated.** Covariance in that direction is $\sigma^2/\lambda_{\min}$, so it stays large; whatever the filter reports there is closer to the prior than to the data.
- **It is model-error dominated too.** With almost no measurement leverage, any unmodelled effect — a misalignment, an unmodelled torque — is absorbed into that state.
- **It is numerically fragile.** Forming normal equations squares the conditioning, so $10^9$ becomes $10^{18}$, beyond the $\approx10^{16}$ that double precision carries. Use a square-root or QR formulation, as the least-squares lesson of Linear Algebra II argues.

The three standard responses are to add a measurement whose geometry excites the weak direction, to move the state into the *consider* set — propagated with its uncertainty but not estimated — or to remove it from the state vector altogether and accept the resulting bias. Note also that the Gramian transforms by congruence under a change of state units, so a condition number quoted without the state definition means nothing; always scale the model first.

::: example How long an arc it takes to calibrate a gyro
Take one axis: $\mathbf{x} = (\theta, b)$ with $\dot{\theta} = -b$ and a star tracker measuring $\theta$. Then $\mathbf{A} = \begin{pmatrix}0&-1\\0&0\end{pmatrix}$, $\mathbf{C} = (1\ \ 0)$, $e^{\mathbf{A}\sigma} = \begin{pmatrix}1&-\sigma\\0&1\end{pmatrix}$, and $\mathbf{C}e^{\mathbf{A}\sigma} = (1\ \ -\sigma)$. So

$$\mathbf{W}_o(T) = \int_0^T\begin{pmatrix}1\\-\sigma\end{pmatrix}\begin{pmatrix}1&-\sigma\end{pmatrix}d\sigma = \begin{pmatrix}T & -T^2/2\\ -T^2/2 & T^3/3\end{pmatrix},$$

which is exactly the dual of Lesson 4's controllability Gramian for the double integrator, as duality promises. It is non-singular for every $T > 0$, so the bias is observable from any arc at all — the structural question has a trivial answer. The useful question is the conditioning.

At $T = 10\,\mathrm{s}$ the eigenvalues are $340.9$ and $2.44$, so $\operatorname{cond} = 139$. At $T = 100\,\mathrm{s}$ they are $3.334\times10^5$ and $25.0$, so $\operatorname{cond} = 1.33\times10^4$. The condition number got *worse* with more data, which is a units artefact and not a physical fact: $\theta$ is in radians and $b$ in radians per second, so the two blocks of the Gramian grow at different powers of $T$. Rescale the bias into units of "radians accumulated over the arc", $\mathbf{T} = \operatorname{diag}(1,\ 1/T)$, and the congruence $\mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$ gives $\begin{pmatrix}T & -T/2\\-T/2 & T/3\end{pmatrix}$ with condition number $19.3$ at every arc length. That is the honest statement: the geometry of separating a constant offset from a linear ramp is mildly ill-conditioned and stays so, while the total information grows in proportion to $T$.

Now the number an estimation engineer wants. Sample the tracker at $4\,\mathrm{Hz}$ with $10''$ per-axis noise, and fit $\theta(t) = \theta_0 - bt$ by least squares over an arc of length $T$ with $N = 4T$ samples. The slope variance of a straight-line fit over a uniformly sampled interval is $\operatorname{var}(\hat{b}) = 12\sigma^2/(NT^2)$, so $\sigma_b = \sqrt{12}\,\sigma/(T\sqrt{N})$.

| Arc $T$ | samples $N$ | $\sigma_b$ |
| --- | --- | --- |
| $60\,\mathrm{s}$ | 240 | $0.0373\ ''/\mathrm{s} = 0.0373\ ^\circ/\mathrm{hr}$ |
| $600\,\mathrm{s}$ | 2400 | $0.00118\ ''/\mathrm{s} = 0.00118\ ^\circ/\mathrm{hr}$ |

(The two unit labels are numerically equal because both conversions are factors of 3600.) The uncertainty falls as $T^{-3/2}$ — one power of $T$ from the longer lever arm and a half power from the extra samples — so a ten-times-longer arc buys a factor of $31.6$. A ten-minute quiet arc calibrates this gyro to about $0.001\ ^\circ/\mathrm{hr}$, which is why bias calibration is scheduled rather than continuous.
:::

## Stabilizability and detectability

Full controllability and observability are stronger than most designs need, and real vehicle models routinely fail them for harmless reasons. A well-damped structural mode with no input path is uncontrollable, and nothing bad follows: it decays on its own. What matters is only whether the **troublesome** modes can be moved and seen.

::: key Stabilizable and detectable
**Stabilizable**: every mode with $\operatorname{Re}\lambda \ge 0$ is controllable, that is $\operatorname{rank}[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}] = n$ for every such $\lambda$. **Detectable**: every such mode is observable, $\operatorname{rank}\left[\mathbf{A}-\lambda\mathbf{I};\ \mathbf{C}\right] = n$. These, not full controllability and observability, are the real requirements for a stabilizing design: stabilizability for a state feedback that makes $\mathbf{A}-\mathbf{B}\mathbf{K}$ stable, detectability for an observer that makes $\mathbf{A}-\mathbf{L}\mathbf{C}$ stable.
:::

Both are PBH tests restricted to the closed right half plane, which is why PBH is the formulation to remember: the Kalman rank test cannot express "only check these modes". In discrete time, replace the condition $\operatorname{Re}\lambda \ge 0$ with $|\mu| \ge 1$.

The asymmetry between the two failures is worth internalising. Losing controllability of a stable mode is free. Losing observability of a stable mode is also free, in the sense that no estimator will ever know it and no harm follows. Losing controllability of an *unstable* mode means no controller exists, at any gain. Losing observability of an unstable mode means that not only will the estimate diverge, but the closed loop built on it will too — and the divergence may be slow enough to pass a short simulation, as Linear Algebra II's warning about small positive eigenvalues describes.

::: example Stabilizable but not controllable
Consider a spacecraft axis carrying a solar array whose first bending mode the wheel cannot excite — the wheel sits at a node of the mode shape. Model it with the rigid attitude states $(\theta, \omega)$ and one lightly damped mode at $20\,\mathrm{rad/s}$ with $\zeta = 0.01$, written in its real $2\times2$ block:

$$\mathbf{A} = \begin{pmatrix}0&1&0&0\\0&0&0&0\\0&0&-0.2&20\\0&0&-20&-0.2\end{pmatrix},\qquad \mathbf{B} = \begin{pmatrix}0\\1\\0\\0\end{pmatrix}.$$

The eigenvalues are $0,\ 0,\ -0.2\pm20i\ \mathrm{s^{-1}}$. The controllability matrix has rank $2$, so the system is not controllable: no wheel command touches the flex mode. But PBH at $\lambda = -0.2\pm20i$ gives rank $3 < 4$ while PBH at $\lambda = 0$ gives rank $4$ — the failures are all in the open left half plane. The system is **stabilizable**, a state feedback exists that stabilises the rigid modes, and the flex mode rings down by itself with a time constant of $1/0.2 = 5\,\mathrm{s}$.

Two cautions attach to that comfortable conclusion. First, uncontrollable does not mean undisturbable: a thruster firing or a thermal snap can still excite the mode, and the controller cannot damp it. Second, if the mode is *observable* — if the rate gyro is not at a node — then it appears in the measurement, feeds through any observer, and can be re-injected into the loop through the control. The pairing that is genuinely benign is uncontrollable **and** unobservable. That is precisely the pairing that Lesson 11's balanced truncation discards.
:::

```python
import numpy as np

def obsv(A, C):
    rows, blk = [C], C
    for _ in range(A.shape[0] - 1):
        blk = blk @ A
        rows.append(blk)
    return np.vstack(rows)

def cross(v):
    return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])

A = np.zeros((6, 6)); A[0:3, 3:6] = -np.eye(3)      # dtheta_dot = -bias
s1, s2 = np.array([0.0, 0, 1]), np.array([0.6, 0, 0.8])
C1 = np.hstack([cross(s1), np.zeros((3, 3))])
C2 = np.hstack([cross(s2), np.zeros((3, 3))])
print("one sun sighting :", np.linalg.matrix_rank(obsv(A, C1)))
print("two sightings    :", np.linalg.matrix_rank(np.vstack([obsv(A, C1), obsv(A, C2)])))
print("star tracker     :", np.linalg.matrix_rank(
    obsv(A, np.hstack([np.eye(3), np.zeros((3, 3))]))))
u, sv, vt = np.linalg.svd(obsv(A, C2))
print("unobservable directions:\n", np.round(vt[4:].T, 4))
# one sun sighting : 4
# two sightings    : 6
# star tracker     : 6
# unobservable directions:
#  [[ 0.6  0. ]
#  [ 0.   0. ]
#  [ 0.8  0. ]
#  [ 0.   0.6]
#  [ 0.   0. ]
#  [ 0.   0.8]]
```

::: warning Observable is not the same as estimable
Passing the rank test tells you the initial state is *in principle* recoverable from a noiseless record of any positive length. It does not tell you that your filter, with your noise, your sample rate and your arc length, will recover it. Those questions are answered by $\mathbf{W}_o$ and its condition number, not by the rank. Most real estimation failures are conditioning failures, not rank failures: a direction that is technically observable and practically not.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -2, -3)$ and $\mathbf{C} = (1\ \ 1\ \ 0)$. Is it observable? Which mode is hidden, and how does this relate to Lesson 4's example with $\mathbf{B} = (1,1,0)^\mathsf{T}$?
:::

::: answer
$\mathbf{O}_m = \begin{pmatrix}1&1&0\\-1&-2&0\\1&4&0\end{pmatrix}$ has a zero third column, so the rank is $2$ and the system is unobservable. PBH at $\lambda = -3$: $\begin{pmatrix}\mathbf{A}+3\mathbf{I}\\\mathbf{C}\end{pmatrix}$ has rank $2 < 3$, with right null vector $\mathbf{v} = (0,0,1)^\mathsf{T}$ — the third mode. It is exactly the dual of Lesson 4's example, because $\mathbf{A}$ is symmetric and $\mathbf{C} = \mathbf{B}^\mathsf{T}$, so $\mathbf{O}_m = \mathbf{C}_m^\mathsf{T}$. The system is detectable, since the hidden mode decays at $3\,\mathrm{s^{-1}}$.
:::

::: check
Why does adding a second sun sensor with a different boresight make the gyro bias observable, and why does slewing the spacecraft do the same thing?
:::

::: answer
A single sun sensor has $\mathbf{C} = ([\hat{\mathbf{s}}\times]\ \ \mathbf{0})$, whose null space contains $\hat{\mathbf{s}}$. A second sensor contributes $[\hat{\mathbf{s}}_2\times]$, whose null space contains $\hat{\mathbf{s}}_2$. The two null spaces intersect only at the origin when $\hat{\mathbf{s}}_1$ and $\hat{\mathbf{s}}_2$ are not parallel, so the stacked $\mathbf{C}$ has rank $3$ and the observability matrix reaches rank $6$. Slewing achieves the same thing in time rather than in hardware: $\hat{\mathbf{s}}$ moves in body axes, so $\mathbf{C}(t)$ takes two or more effectively independent values during the manoeuvre, and the stacked observability matrix over the arc is full rank. The underlying requirement is identical — two independent look directions — and the closer the two directions are to parallel, the worse the conditioning.
:::

::: check
State the difference between controllable and stabilizable, and give an aerospace example of a system that is one and not the other.
:::

::: answer
Controllable means every mode can be moved anywhere by state feedback. Stabilizable is the weaker condition that every mode with $\operatorname{Re}\lambda \ge 0$ can be moved; uncontrollable modes in the open left half plane are acceptable because they decay without help. PBH states it exactly: stabilizable means $\operatorname{rank}[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}] = n$ for every $\lambda$ with $\operatorname{Re}\lambda \ge 0$. The usual example is a well-damped structural mode with no input path — a solar-array bending mode whose node lies at the actuator, as in the worked example above: not controllable, comfortably stabilizable. The dual notion is detectability. Real vehicle models are frequently stabilizable and detectable without being controllable and observable.
:::

::: check
An estimator's observability Gramian has eigenvalues spanning $10^{-7}$ to $10^{2}$ in a model whose states are metres, metres per second and radians. What do you conclude, and what do you do first?
:::

::: answer
The condition number is $10^{9}$, so the weakest direction produces about $10^{4.5} \approx 3\times10^{4}$ times less output amplitude than the strongest; its covariance stays roughly $10^9$ times larger, it will be dominated by noise and model error, and normal equations would square the conditioning to $10^{18}$ and lose all precision. But the first thing to do is not to redesign anything: it is to scale the model. The Gramian transforms by congruence, and a state vector mixing metres with radians will show a large spread for that reason alone. Re-express each state in units of one "unit of engineering significance", recompute, and only then decide whether the weak direction is real. If it is, look at its eigenvector, identify the physical combination, and either add a measurement with geometry that excites it or move it to the consider set.
:::

::: check
The six-state rigid spacecraft of Lesson 1 is measured by a rate gyro only, $\mathbf{C} = (\mathbf{0}_{3\times3}\ \ \mathbf{I}_3)$. Is it observable? Is it detectable?
:::

::: answer
$\mathbf{C}\mathbf{A} = (\mathbf{0}\ \ \mathbf{0})$ because $\mathbf{A}$ maps the rate block into the angle block and $\mathbf{C}$ ignores the angle block — concretely, $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$ gives $\mathbf{C}\mathbf{A} = \mathbf{0}$. So $\mathbf{O}_m$ has rank $3$ and the three attitude angles are unobservable, which is the formal version of the obvious fact that integrating rate leaves an unknown constant. It is also **not detectable**, because the unobservable modes are the three zero eigenvalues, which sit on the imaginary axis rather than strictly inside the left half plane. No observer built on the gyro alone can make the attitude estimate converge; you need an absolute attitude reference. This is the whole reason spacecraft carry star trackers as well as gyros.
:::

## Summary

| Item | Statement |
| --- | --- |
| Observable | $\mathbf{x}(0)$ is uniquely determined by $\mathbf{y}$ and $\mathbf{u}$ on any $[0,T]$ |
| Rank test | $\mathbf{O}_m = [\mathbf{C};\mathbf{C}\mathbf{A};\dots;\mathbf{C}\mathbf{A}^{n-1}]$; observable iff $\operatorname{rank} = n$; $\operatorname{null}\mathbf{O}_m$ is the unobservable subspace |
| Duality | $\mathbf{O}_m(\mathbf{A},\mathbf{C})^\mathsf{T} = \mathbf{C}_m(\mathbf{A}^\mathsf{T},\mathbf{C}^\mathsf{T})$ — every controllability result has an observability twin |
| PBH | observable iff $\operatorname{rank}\left[\mathbf{A}-\lambda\mathbf{I};\ \mathbf{C}\right] = n$ for every eigenvalue; null vector names the hidden mode |
| Modal reading | mode $i$ unobservable iff column $i$ of $\mathbf{C}\mathbf{V}$ is zero |
| Minimality | a realization is minimal iff it is both controllable and observable |
| Gramian | $\mathbf{W}_o(T) = \int_0^Te^{\mathbf{A}^\mathsf{T}\sigma}\mathbf{C}^\mathsf{T}\mathbf{C}e^{\mathbf{A}\sigma}d\sigma$; $\int\|\mathbf{y}\|^2 = \mathbf{x}_0^\mathsf{T}\mathbf{W}_o\mathbf{x}_0$; covariance $\sigma^2\mathbf{W}_o^{-1}$ |
| Lyapunov form | stable $\mathbf{A}$: $\mathbf{A}^\mathsf{T}\mathbf{W}_o + \mathbf{W}_o\mathbf{A} + \mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{0}$ |
| $\operatorname{cond}(\mathbf{W}_o) = 10^9$ | worst direction gives $10^{4.5}$ less output amplitude: slow, noise-dominated, fragile; scale first |
| Stabilizable | every mode with $\operatorname{Re}\lambda\ge0$ is controllable |
| Detectable | every mode with $\operatorname{Re}\lambda\ge0$ is observable |
| Sun-sensor case | $\operatorname{rank}\mathbf{O}_m = 4$ of $6$; attitude and bias about $\hat{\mathbf{s}}$ are invisible; fixed by a second boresight or a slew |

You can now say what a plant lets you do and what it lets you see. The next lesson uses the first half: given a controllable pair, build the gain matrix that puts the closed-loop eigenvalues wherever you decide they belong — and find out what that decision costs.
