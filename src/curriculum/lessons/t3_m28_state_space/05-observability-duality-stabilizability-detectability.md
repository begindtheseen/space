---
id: l05-observability-duality-stabilizability-detectability
title: Observability, duality, stabilizability and detectability
minutes: 23
covers:
  - Observability and duality; stabilizability and detectability
---

Think about a car's dashboard. If you can watch the odometer over time, you can work out your speed: speed is how fast the odometer changes. But if all you have is the speedometer, you can never learn where you started. Every starting point gives exactly the same speedometer reading. Some things you can work out from what you watch; some things you cannot, no matter how long you watch.

That is the observability question. A controller acts on the state. A sensor does not measure the state — it measures a few combinations of it, with noise, and an **estimator** has to rebuild the rest. Whether that rebuild is possible at all is **observability**, and the whole estimation part of this course turns on it. A Kalman filter run on a state it cannot observe does not fail loudly. It returns a confident-looking estimate whose uncertainty in the hidden direction never shrinks, and whose value is whatever you started it at.

Every spacecraft meets this. A gyro measures how fast the body turns, but with a slowly drifting **[[bias|gyro-bias]]** — a small false reading added to the truth. The bias has to be estimated, because integrating it produces attitude error that grows without limit. Whether it *can* be estimated depends on the attitude sensor. With a three-axis star tracker, all three bias components are observable. With a sun sensor alone, the bias about the **[[sun line|sun-line]]** is not — and neither is the attitude about the sun line. That is two missing dimensions in a six-state model, and it has caused real attitude problems in orbit.

This lesson defines observability, derives its rank test, shows that it is the exact mirror image of controllability (so all of Lesson 4 comes across for free), introduces the observability Gramian and what a badly conditioned one means in operation, and ends with the two weaker conditions — stabilizability and detectability — that real designs actually need.

## Observability and its rank test

Here is the definition.

> A system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, $\mathbf{y} = \mathbf{C}\mathbf{x} + \mathbf{D}\mathbf{u}$ is **observable** if the initial state $\mathbf{x}(0)$ is uniquely determined by $\mathbf{y}(t)$ and $\mathbf{u}(t)$ on any interval $[0, T]$ with $T > 0$.

In words: watch the output and the input for any stretch of time, however short. If only one starting state could have produced what you saw, the system is observable. Once you know the starting state, the model tells you every state after it.

The input does not matter here. The system is linear, so the input adds a known piece to the output that you can subtract. What is left is the unforced output $\mathbf{y}(t) = \mathbf{C}e^{\mathbf{A}t}\mathbf{x}(0)$. Two starting states look identical exactly when their *difference* produces zero output forever. So observability says: if $\mathbf{C}e^{\mathbf{A}t}\mathbf{x}_0 = \mathbf{0}$ for all $t$, then $\mathbf{x}_0 = \mathbf{0}$.

Now the test. Take the output and its derivatives at $t = 0$:

$$\mathbf{y}(0) = \mathbf{C}\mathbf{x}_0, \qquad \dot{\mathbf{y}}(0) = \mathbf{C}\mathbf{A}\mathbf{x}_0, \qquad \ddot{\mathbf{y}}(0) = \mathbf{C}\mathbf{A}^2\mathbf{x}_0, \qquad \dots$$

Cayley–Hamilton stops the list at $n-1$, exactly as in Lesson 4: every higher power of $\mathbf{A}$ is a combination of the earlier ones, so later derivatives add no new information. Stack them:

$$\begin{pmatrix}\mathbf{y}(0)\\\dot{\mathbf{y}}(0)\\\vdots\\\mathbf{y}^{(n-1)}(0)\end{pmatrix} = \underbrace{\begin{pmatrix}\mathbf{C}\\\mathbf{C}\mathbf{A}\\\vdots\\\mathbf{C}\mathbf{A}^{n-1}\end{pmatrix}}_{\mathbf{O}_m}\mathbf{x}_0.$$

This is $n$ unknowns and $np$ equations ($p$ is the number of outputs). You can solve for $\mathbf{x}_0$ uniquely exactly when no nonzero $\mathbf{x}_0$ is sent to zero — when the **observability matrix** $\mathbf{O}_m$ has rank $n$.

::: key Observability matrix and duality
$\mathbf{O}_m = [\mathbf{C};\ \mathbf{C}\mathbf{A};\ \dots;\ \mathbf{C}\mathbf{A}^{n-1}]$, observable if and only if $\operatorname{rank}\mathbf{O}_m = n$. Duality: $(\mathbf{A}, \mathbf{C})$ is observable exactly when $(\mathbf{A}^\mathsf{T}, \mathbf{C}^\mathsf{T})$ is controllable — so every controllability result has a free observability twin.
:::

The semicolons mean "stacked on top of each other".

## Duality: the mirror image

**Duality** is an exact identity, not a loose analogy. Transpose the stack:

$$\mathbf{O}_m(\mathbf{A},\mathbf{C})^\mathsf{T} = \left[\mathbf{C}^\mathsf{T},\ \mathbf{A}^\mathsf{T}\mathbf{C}^\mathsf{T},\ \dots,\ (\mathbf{A}^\mathsf{T})^{n-1}\mathbf{C}^\mathsf{T}\right] = \mathbf{C}_m(\mathbf{A}^\mathsf{T},\mathbf{C}^\mathsf{T}).$$

Transposing never changes rank. So take any theorem from Lesson 4, swap $\mathbf{A}\to\mathbf{A}^\mathsf{T}$ and $\mathbf{B}\to\mathbf{C}^\mathsf{T}$, and you get a theorem about sensing.

The null space of $\mathbf{O}_m$ — the starting states it sends to zero — is the **unobservable subspace**. States in it produce no output at all, ever. Its dimension is $n - \operatorname{rank}\mathbf{O}_m$.

Duality applied to PBH gives the test you will use in reviews:

$$\text{observable} \iff \operatorname{rank}\begin{pmatrix}\mathbf{A}-\lambda\mathbf{I}\\\mathbf{C}\end{pmatrix} = n \quad\text{for every eigenvalue }\lambda\text{ of }\mathbf{A}.$$

When the rank falls short, there is a vector $\mathbf{v}$ with $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ and $\mathbf{C}\mathbf{v} = \mathbf{0}$: an eigenvector — a natural motion of the system — that the sensors cannot see. In modal coordinates the same statement reads: column $i$ of $\bar{\mathbf{C}} = \mathbf{C}\mathbf{V}$ is zero.

Duality also settles a question left open in Lesson 1. A realization is **minimal** — the smallest possible number of states for its transfer matrix — if and only if it is both controllable and observable. Any other realization carries **[[hidden states|hidden-modes]]** that the input cannot reach or the output cannot see. They cancel out of $\mathbf{G}(s)$, yet they still exist inside the vehicle — and can still diverge.

::: example The gyro bias you cannot see with a sun sensor
Attitude estimation carries the small attitude error $\delta\boldsymbol{\theta}$ (read "delta theta") and the gyro bias $\mathbf{b}$: six states. For a slowly turning vehicle, the error grows as $\dot{\delta\boldsymbol{\theta}} = -\mathbf{b}$ — whatever bias the gyro has is integrated straight into attitude error. So

$$\mathbf{A} = \begin{pmatrix}\mathbf{0}_{3\times3} & -\mathbf{I}_3 \\ \mathbf{0}_{3\times3} & \mathbf{0}_{3\times3}\end{pmatrix}.$$

**The sensor.** A sun sensor reports the Sun's direction $\hat{\mathbf{s}}$ in body axes. A small attitude error moves that direction by $\delta\hat{\mathbf{s}} = \hat{\mathbf{s}}\times\delta\boldsymbol{\theta} = [\hat{\mathbf{s}}\times]\,\delta\boldsymbol{\theta}$, where $[\hat{\mathbf{s}}\times]$ is the **[[cross-product matrix|cross-matrix]]**. So

$$\mathbf{C} = \left([\hat{\mathbf{s}}\times]\ \ \ \mathbf{0}_{3\times3}\right), \qquad \operatorname{rank}[\hat{\mathbf{s}}\times] = 2,$$

because a cross-product matrix always sends its own vector to zero: $\hat{\mathbf{s}}\times\hat{\mathbf{s}} = \mathbf{0}$.

**The observability matrix.** $\mathbf{C}\mathbf{A} = (\mathbf{0}\ \ -[\hat{\mathbf{s}}\times])$ and $\mathbf{C}\mathbf{A}^2 = \mathbf{0}$, so

$$\mathbf{O}_m = \begin{pmatrix}[\hat{\mathbf{s}}\times] & \mathbf{0}\\ \mathbf{0} & -[\hat{\mathbf{s}}\times]\\ \mathbf{0}&\mathbf{0}\\ \vdots&\vdots\end{pmatrix}, \qquad \operatorname{rank}\mathbf{O}_m = 2 + 2 = 4 < 6.$$

**What is missing.** Two dimensions. For $\hat{\mathbf{s}} = (0.6,\ 0,\ 0.8)$ the null space comes out as $(\hat{\mathbf{s}},\ \mathbf{0})$ and $(\mathbf{0},\ \hat{\mathbf{s}})$. In words: **the attitude error about the sun line, and the gyro bias about the sun line**. Both are invisible, for a one-sentence reason: turning about the direction you are looking along does not move what you see.

**Why it is dangerous.** The two hidden states are linked. The unseen bias integrates into an unseen attitude error that grows steadily at the bias rate. The pointing error about the sun line grows without bound while every residual the filter computes stays at the noise floor. Nothing in the filter output announces it.

**PBH, for the record.** All six eigenvalues are zero, and $\operatorname{rank}\begin{pmatrix}\mathbf{A}\\\mathbf{C}\end{pmatrix} = 5$ — short by one, because the two missing states form a single chain (bias feeding attitude), exactly as in the mirror case of Lesson 4.

**The fixes are geometric, not algorithmic.** Add a second sensor looking a different way: stacking the observability matrices for $\hat{\mathbf{s}}_1 = (0,0,1)$ and $\hat{\mathbf{s}}_2 = (0.6,0,0.8)$ gives rank $6$. Or turn the vehicle, so $\hat{\mathbf{s}}$ moves in body axes; the stacked observability matrix over the maneuver again reaches rank $6$. That is why attitude procedures specify a slew, and why "we will calibrate the gyros during the next maneuver" is a sentence with mathematics behind it.
:::

## The observability Gramian, and what a bad condition number means

The rank test says whether a direction is visible. The **observability Gramian** says *how* visible. Mirroring Lesson 4:

$$\mathbf{W}_o(T) = \int_0^T e^{\mathbf{A}^\mathsf{T}\sigma}\,\mathbf{C}^\mathsf{T}\mathbf{C}\,e^{\mathbf{A}\sigma}\,d\sigma, \qquad \mathbf{A}^\mathsf{T}\mathbf{W}_o + \mathbf{W}_o\mathbf{A} + \mathbf{C}^\mathsf{T}\mathbf{C} = \mathbf{0}\ \text{ for stable }\mathbf{A}.$$

Its meaning is direct. The energy in the unforced output is

$$\int_0^T\|\mathbf{y}(t)\|^2dt = \int_0^T\mathbf{x}_0^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\mathbf{C}^\mathsf{T}\mathbf{C}e^{\mathbf{A}t}\mathbf{x}_0\,dt = \mathbf{x}_0^\mathsf{T}\mathbf{W}_o(T)\,\mathbf{x}_0.$$

So $\mathbf{W}_o$ measures how much signal each state direction makes. A large eigenvalue is a direction that shouts. A small one whispers. A zero one is silent — which is the rank test again.

It is also the key to estimation. The best least-squares guess of the starting state from a noisy record is $\hat{\mathbf{x}}_0 = \mathbf{W}_o(T)^{-1}\int_0^Te^{\mathbf{A}^\mathsf{T}t}\mathbf{C}^\mathsf{T}\mathbf{y}(t)\,dt$. With white measurement noise of intensity $\sigma^2$, its covariance (the spread of its errors) is $\sigma^2\mathbf{W}_o(T)^{-1}$. The Gramian is the **[[information matrix|information-matrix]]** of the estimation problem.

That is why its condition number is an operational fact, not a numerical curiosity. Suppose $\operatorname{cond}(\mathbf{W}_o) = 10^9$. The Gramian measures output *energy*, so a unit state along the worst direction makes $10^9$ times less output energy than one along the best. In *amplitude* that is $\sqrt{10^9} = 3.2\times10^4$ — about $10^{4.5}$. Four consequences follow, and they are what to say when asked:

- **The estimate along that direction converges slowly.** Information arrives $10^9$ times more slowly there. If the strong direction settles in a second, the weak one needs on the order of $10^9$ seconds of the same geometry.
- **It is noise-dominated.** The spread in that direction is $\sigma^2/\lambda_{\min}$, so it stays large. Whatever the filter reports there is closer to its starting guess than to the data.
- **It is model-error dominated too.** With almost no measurement leverage, any unmodeled effect — a misalignment, a stray torque — gets absorbed into that state.
- **It is numerically fragile.** The Gramian is already a "squared" quantity, built from $\mathbf{C}^\mathsf{T}\mathbf{C}$ the way least-squares normal equations are built from a Jacobian times its transpose. Solving with it directly spends about $9$ of the roughly $16$ digits that **[[double precision|double-precision]]** carries. A square-root or QR formulation works with the unsquared factor, whose condition number is only about $10^{4.5}$, and spends about half as many.

The three standard responses: add a measurement whose geometry excites the weak direction; move the state into the **[[consider set|consider-states]]** — carried with its uncertainty but not estimated; or remove it from the state vector and accept the resulting bias. And remember that the Gramian changes by congruence when you change state units, so a condition number quoted without the state definition means nothing. Scale the model first.

::: example How long an arc it takes to calibrate a gyro
Take one axis: $\mathbf{x} = (\theta, b)$ with $\dot{\theta} = -b$, and a star tracker measuring $\theta$. So $\mathbf{A} = \begin{pmatrix}0&-1\\0&0\end{pmatrix}$, $\mathbf{C} = (1\ \ 0)$, $e^{\mathbf{A}\sigma} = \begin{pmatrix}1&-\sigma\\0&1\end{pmatrix}$, and $\mathbf{C}e^{\mathbf{A}\sigma} = (1\ \ -\sigma)$.

**The Gramian.**

$$\mathbf{W}_o(T) = \int_0^T\begin{pmatrix}1\\-\sigma\end{pmatrix}\begin{pmatrix}1&-\sigma\end{pmatrix}d\sigma = \begin{pmatrix}T & -T^2/2\\ -T^2/2 & T^3/3\end{pmatrix}.$$

This is the mirror of Lesson 4's controllability Gramian for the double integrator, as duality promises. It is invertible for every $T > 0$, so the bias is observable from any arc at all. The yes-or-no question is settled at once. The useful question is conditioning.

**The conditioning.** At $T = 10\,\mathrm{s}$ the eigenvalues are $340.9$ and $2.44$, so $\operatorname{cond} = 139$. At $T = 100\,\mathrm{s}$ they are $3.334\times10^5$ and $25.0$, so $\operatorname{cond} = 1.33\times10^4$. The condition number got *worse* with more data! That is a units effect, not physics: $\theta$ is in radians and $b$ in radians per second, so the two corners of the Gramian grow with different powers of $T$.

Rescale the bias into "radians piled up over the arc", with $\mathbf{T} = \operatorname{diag}(1,\ 1/T)$. The congruence $\mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$ gives $\begin{pmatrix}T & -T/2\\-T/2 & T/3\end{pmatrix}$, with condition number $19.3$ at every arc length. That is the honest statement: telling a constant offset from a steady ramp is mildly ill-conditioned and stays so, while the total information grows in proportion to $T$.

**The number an estimation engineer wants.** Sample the tracker at $4\,\mathrm{Hz}$ with $10''$ (arcseconds) of noise per axis, and **[[fit a straight line|line-fit]]** $\theta(t) = \theta_0 - bt$ over an arc of length $T$ with $N = 4T$ samples. The slope of a least-squares line through evenly spaced points has variance $\operatorname{var}(\hat{b}) = 12\sigma^2/(NT^2)$, so $\sigma_b = \sqrt{12}\,\sigma/(T\sqrt{N})$.

| Arc $T$ | samples $N$ | $\sigma_b$ |
| --- | --- | --- |
| $60\,\mathrm{s}$ | 240 | $0.0373\ ''/\mathrm{s} = 0.0373\ ^\circ/\mathrm{hr}$ |
| $600\,\mathrm{s}$ | 2400 | $0.00118\ ''/\mathrm{s} = 0.00118\ ^\circ/\mathrm{hr}$ |

For the first row: $\sqrt{12}\times10/(60\times\sqrt{240}) = 34.64/929.5 = 0.0373$. The two unit labels give the same number because both conversions are factors of 3600.

Sanity check: the uncertainty falls as $T^{-3/2}$ — one power of $T$ from the longer lever arm, a half power from the extra samples. So ten times the arc should buy $10^{1.5} = 31.6$, and indeed $0.0373/0.00118 \approx 31.6$. A ten-minute quiet arc calibrates this gyro to about $0.001\ ^\circ/\mathrm{hr}$, which is why bias calibration is scheduled rather than continuous.
:::

## Stabilizability and detectability

Full controllability and full observability are more than most designs need, and real vehicle models often fail them for harmless reasons. Think of a guitar string you cannot reach: if it is already dying away on its own, it does not matter that you cannot touch it. A well-damped structural mode with no input path is uncontrollable, and nothing bad follows — it decays by itself. What matters is only whether the *troublesome* modes can be moved and seen.

::: key Stabilizable and detectable
**Stabilizable**: every mode with $\operatorname{Re}\lambda \ge 0$ is controllable, that is $\operatorname{rank}[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}] = n$ for every such $\lambda$. **Detectable**: every such mode is observable, $\operatorname{rank}\left[\mathbf{A}-\lambda\mathbf{I};\ \mathbf{C}\right] = n$. These, not full controllability and observability, are the real requirements for a stabilizing design: stabilizability for a state feedback that makes $\mathbf{A}-\mathbf{B}\mathbf{K}$ stable, detectability for an observer that makes $\mathbf{A}-\mathbf{L}\mathbf{C}$ stable.
:::

Here $\operatorname{Re}\lambda$ is the real part of the eigenvalue. The modes with $\operatorname{Re}\lambda \ge 0$ are the ones that grow or **[[never die away|marginal-modes]]**.

Both conditions are PBH tests restricted to those modes. That is why PBH is the form to remember: the Kalman rank test cannot say "only check these modes". In discrete time, replace $\operatorname{Re}\lambda \ge 0$ with $|\mu| \ge 1$, where $\mu$ is a discrete-time eigenvalue.

The four possible failures are not equally bad:

- Losing controllability of a **stable** mode costs nothing. It decays anyway.
- Losing observability of a **stable** mode also costs nothing: no estimator will ever know it, and no harm follows.
- Losing controllability of an **unstable** mode means no controller exists, at any gain.
- Losing observability of an **unstable** mode means the estimate diverges, and so does the closed loop built on it — possibly slowly enough to pass a short simulation, as Linear Algebra II warned about small positive eigenvalues.

::: example Stabilizable but not controllable
A spacecraft axis carries a solar array whose first bending mode the wheel cannot excite, because the wheel sits at a **[[node|mode-node]]** of the mode shape. Model it with the rigid states $(\theta, \omega)$ plus one lightly damped mode at $20\,\mathrm{rad/s}$ with damping ratio $\zeta = 0.01$:

$$\mathbf{A} = \begin{pmatrix}0&1&0&0\\0&0&0&0\\0&0&-0.2&20\\0&0&-20&-0.2\end{pmatrix},\qquad \mathbf{B} = \begin{pmatrix}0\\1\\0\\0\end{pmatrix}.$$

**Eigenvalues:** $0,\ 0,\ -0.2\pm20i\ \mathrm{s^{-1}}$. (The flex block's real part is $-\zeta\omega_n = -0.01\times20 = -0.2$.)

**Kalman:** the controllability matrix has rank $2$. Not controllable — no wheel command touches the flex mode.

**PBH:** at $\lambda = -0.2\pm20i$ the rank is $3 < 4$; at $\lambda = 0$ it is $4$. Every failure sits in the left half plane, where modes decay. So the system is **stabilizable**. A state feedback exists that stabilizes the rigid modes, and the flex mode rings down by itself with time constant $1/0.2 = 5\,\mathrm{s}$.

Two cautions come with that comfortable answer. First, uncontrollable does not mean undisturbable: a thruster firing or a thermal snap can still ring the mode, and the controller cannot damp it. Second, if the mode is *observable* — if the rate gyro is not also at a node — it shows up in the measurement, flows through any observer, and can be fed back into the loop through the control. The truly harmless pairing is uncontrollable **and** unobservable. That is exactly the pairing Lesson 11's balanced truncation throws away.
:::

Here is the sun-sensor example in code.

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
#  [[0.6 0. ]
#  [0.  0. ]
#  [0.8 0. ]
#  [0.  0.6]
#  [0.  0. ]
#  [0.  0.8]]
```

::: warning Observable is not the same as estimable
Passing the rank test says the starting state is recoverable *in principle*, from a noiseless record of any length. It does not say your filter — with your noise, your sample rate and your arc length — will recover it. $\mathbf{W}_o$ and its condition number answer that, not the rank. Most real estimation failures are conditioning failures, not rank failures: a direction that is observable on paper and not in practice.
:::

## Check yourself

::: check
A plant has $\mathbf{A} = \operatorname{diag}(-1, -2, -3)$ and $\mathbf{C} = (1\ \ 1\ \ 0)$. Is it observable? Which mode is hidden, and how does this relate to Lesson 4's example with $\mathbf{B} = (1,1,0)^\mathsf{T}$?
:::

::: answer
$\mathbf{O}_m = \begin{pmatrix}1&1&0\\-1&-2&0\\1&4&0\end{pmatrix}$ has a zero third column, so the rank is $2$: unobservable.

PBH at $\lambda = -3$: $\begin{pmatrix}\mathbf{A}+3\mathbf{I}\\\mathbf{C}\end{pmatrix}$ has rank $2 < 3$, with null vector $\mathbf{v} = (0,0,1)^\mathsf{T}$ — the third mode.

It is exactly the mirror of Lesson 4's example: $\mathbf{A}$ is symmetric and $\mathbf{C} = \mathbf{B}^\mathsf{T}$, so $\mathbf{O}_m = \mathbf{C}_m^\mathsf{T}$. The system is detectable, since the hidden mode decays at $3\,\mathrm{s^{-1}}$.
:::

::: check
Why does adding a second sun sensor with a different boresight make the gyro bias observable, and why does slewing the spacecraft do the same thing?
:::

::: answer
One sun sensor has $\mathbf{C} = ([\hat{\mathbf{s}}\times]\ \ \mathbf{0})$, whose null space contains $\hat{\mathbf{s}}$. A second adds $[\hat{\mathbf{s}}_2\times]$, whose null space contains $\hat{\mathbf{s}}_2$. If the two directions are not parallel, the only vector both send to zero is zero itself. So the stacked $\mathbf{C}$ has rank $3$, and the observability matrix reaches rank $6$.

Slewing does the same thing in time instead of hardware: $\hat{\mathbf{s}}$ moves in body axes, so $\mathbf{C}(t)$ takes two or more effectively different values during the maneuver, and the stacked observability matrix over the arc is full rank. The requirement is the same either way — two independent look directions — and the closer they are to parallel, the worse the conditioning.
:::

::: check
State the difference between controllable and stabilizable, and give an aerospace example of a system that is one and not the other.
:::

::: answer
Controllable: every mode can be moved anywhere by state feedback. Stabilizable: the weaker condition that every mode with $\operatorname{Re}\lambda \ge 0$ can be moved; uncontrollable modes strictly in the left half plane are fine because they decay without help. PBH states it exactly: stabilizable means $\operatorname{rank}[\mathbf{A}-\lambda\mathbf{I},\ \mathbf{B}] = n$ for every $\lambda$ with $\operatorname{Re}\lambda \ge 0$.

The usual example is a well-damped structural mode with no input path — a solar-array bending mode with a node at the actuator, as in the worked example: not controllable, comfortably stabilizable. The mirror notion is detectability. Real vehicle models are often stabilizable and detectable without being controllable and observable.
:::

::: check
An estimator's observability Gramian has eigenvalues spanning $10^{-7}$ to $10^{2}$ in a model whose states are meters, meters per second and radians. What do you conclude, and what do you do first?
:::

::: answer
The condition number is $10^{2}/10^{-7} = 10^{9}$. The weakest direction makes about $10^{4.5} \approx 3\times10^{4}$ times less output amplitude than the strongest. Its spread stays about $10^9$ times larger, it will be dominated by noise and model error, and solving with the Gramian directly spends about nine of the sixteen digits a double carries.

But the first step is not to redesign anything. It is to scale the model. The Gramian changes by congruence, and a state vector mixing meters with radians can show a huge spread for that reason alone. Re-express each state in units of engineering importance, recompute, and only then decide whether the weak direction is real. If it is, read its eigenvector, name the physical combination, and either add a measurement whose geometry excites it or move it to the consider set.
:::

::: check
The six-state rigid spacecraft of Lesson 1 is measured by a rate gyro only, $\mathbf{C} = (\mathbf{0}_{3\times3}\ \ \mathbf{I}_3)$. Is it observable? Is it detectable?
:::

::: answer
With $\mathbf{A} = \begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{0}&\mathbf{0}\end{pmatrix}$, $\mathbf{C}\mathbf{A} = (\mathbf{0}\ \ \mathbf{0})$: $\mathbf{A}$ moves the rate block into the angle block, and $\mathbf{C}$ ignores the angle block. So $\mathbf{O}_m$ has rank $3$ and the three attitude angles are unobservable — the formal version of "integrating rate leaves an unknown constant", the speedometer problem from the start of this lesson.

It is also **not detectable**. The unobservable modes are the zero eigenvalues, which sit on the imaginary axis, not strictly inside the left half plane. No observer built on the gyro alone can make the attitude estimate converge; you need an absolute attitude reference. That is the whole reason spacecraft carry star trackers as well as gyros.
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

You can now say what a plant lets you do and what it lets you see. The next lesson uses the first half: given a controllable pair, build the gain matrix that puts the closed-loop eigenvalues wherever you decide — and find out what that decision costs.

::: context gyro-bias What a gyro bias is
A gyro's **bias** is the rate it reports when the vehicle is not turning at all. It is small and drifts slowly with temperature and age, so it cannot be calibrated once on the ground and forgotten. Integrate a bias of $1\,^\circ/\mathrm{hr}$ for an hour and the attitude estimate is off by a full degree. Good navigation gyros have biases well below that; cheap MEMS gyros, the kind in a phone, have far larger ones. Either way, the filter has to estimate it continuously.
:::

::: context sun-line Turning about the line of sight
Point a camera at the Sun and roll it about that line. The Sun stays in the center of the picture the whole time. So a sun sensor cannot tell how far the vehicle has rolled about the sun line — nor whether the gyro's bias about that line is making it roll.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="55" width="50" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="55" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">spacecraft</text>
  <line x1="80" y1="75" x2="290" y2="75" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="315" cy="75" r="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="315" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">Sun</text>
  <text x="245" y="66" font-size="12" fill="#1f2a44" text-anchor="middle">sun line ŝ</text>
  <ellipse cx="185" cy="75" rx="14" ry="38" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="185,113 175,106 177,118" fill="#b4232c"/>
  <text x="185" y="140" font-size="12" fill="#b4232c" text-anchor="middle">roll about ŝ: the Sun does not move in view</text>
</svg>
```
:::

::: context hidden-modes Where hidden states hide
In a transfer function, a hidden mode shows up as a pole cancelled by an equal zero. The formula for $\mathbf{G}(s)$ looks lower order than the vehicle really is. Classical control warns never to cancel an unstable pole with a zero, and this is why: the cancelled mode is still inside the hardware, still growing, but no longer visible in the input-output description. A state-space model with a controllability or observability test run on it cannot hide that mode from you.
:::

::: context cross-matrix The cross product as a matrix
The cross product $\mathbf{s}\times\mathbf{v}$ is linear in $\mathbf{v}$, so it can be written as a matrix times $\mathbf{v}$:

$$[\mathbf{s}\times] = \begin{pmatrix}0&-s_3&s_2\\s_3&0&-s_1\\-s_2&s_1&0\end{pmatrix}.$$

It is skew-symmetric (its transpose is its negative), and it always sends $\mathbf{s}$ itself to zero, because a vector crossed with itself is zero. So its rank is $2$: it is blind to exactly one direction, the direction of $\mathbf{s}$.
:::

::: context information-matrix Information is inverse uncertainty
Estimation engineers treat the inverse of a covariance matrix as **information**: the more information in a direction, the less uncertainty. Information from independent measurements adds up, which is why the Gramian — a sum (integral) over the whole record — grows as you watch longer. Doubling the information halves the variance. In the Kalman filter module you will see the same bookkeeping in the "information filter", which carries the inverse covariance instead of the covariance.
:::

::: context double-precision Sixteen digits
A standard double-precision floating-point number carries about 16 significant decimal digits (its relative precision is about $2.2\times10^{-16}$). Solving a linear system with condition number $10^{k}$ can lose about $k$ of them. So a condition number of $10^9$ leaves about seven trustworthy digits, and $10^{16}$ leaves none. Square-root methods exist precisely to avoid squaring a condition number that is already large.
:::

::: context consider-states Consider parameters
In orbit determination, a **consider** parameter is a quantity you know is uncertain — a drag coefficient, a station location — but choose not to estimate, usually because the data cannot pin it down. The filter still carries its uncertainty and lets that uncertainty inflate the covariance of the states it does estimate. The result is an honest error bar instead of an overconfident one. It is the standard way to handle a nearly unobservable parameter without letting it soak up model error.
:::

::: context line-fit Why a longer arc helps so much
A bias shows up as a steady slope in the attitude record. Fitting a line through noisy points pins the slope down better when the points are spread out: the same scatter over a longer baseline tilts the line less. That is the "lever arm" power of $T$. More samples add a further square-root improvement.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="330" y="186" font-size="12" fill="#1f2a44">t</text>
  <text x="30" y="24" font-size="12" fill="#1f2a44">θ</text>
  <line x1="50" y1="43" x2="320" y2="119" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1f2a44">
    <circle cx="50" cy="46" r="3"/><circle cx="68" cy="47" r="3"/><circle cx="86" cy="35" r="3"/><circle cx="104" cy="50" r="3"/>
    <circle cx="122" cy="78" r="3"/><circle cx="140" cy="68" r="3"/><circle cx="158" cy="80" r="3"/><circle cx="176" cy="78" r="3"/>
    <circle cx="194" cy="100" r="3"/><circle cx="212" cy="88" r="3"/><circle cx="230" cy="94" r="3"/><circle cx="248" cy="86" r="3"/>
    <circle cx="266" cy="104" r="3"/><circle cx="284" cy="108" r="3"/><circle cx="302" cy="133" r="3"/><circle cx="320" cy="102" r="3"/>
  </g>
  <text x="200" y="150" font-size="12" fill="#1d6fd1">fitted slope = −b</text>
  <line x1="50" y1="160" x2="320" y2="160" stroke="#b4232c" stroke-width="1.5"/>
  <text x="120" y="156" font-size="11" fill="#b4232c">arc length T</text>
</svg>
```
:::

::: context marginal-modes Why zero counts as trouble
A mode with $\operatorname{Re}\lambda < 0$ shrinks like $e^{-t}$ and forgets its past. A mode with $\lambda = 0$ holds its value forever — an attitude angle with nothing restoring it, a gyro bias. It does not grow, but it never goes away either, so an error in it stays. That is why the definitions use $\ge 0$ rather than $> 0$: a mode on the imaginary axis must be controllable to be corrected and observable to be estimated.
:::

::: context mode-node Nodes of a mode shape
When a flexible panel vibrates in one of its modes, some points stay still: the **nodes**. A free-free beam's first bending mode has two, at about $22\,\%$ and $78\,\%$ of its length. Push at a node and you do no work on that mode, so you cannot excite it or damp it — and a sensor at a node cannot see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="40.0,50.0 47.0,55.8 54.0,61.6 61.0,67.4 68.0,73.1 75.0,78.8 82.0,84.4 89.0,89.8 96.0,95.1 103.0,100.2 110.0,105.0 117.0,109.5 124.0,113.6 131.0,117.4 138.0,120.7 145.0,123.6 152.0,126.0 159.0,127.9 166.0,129.3 173.0,130.1 180.0,130.4 187.0,130.1 194.0,129.3 201.0,127.9 208.0,126.0 215.0,123.6 222.0,120.7 229.0,117.4 236.0,113.6 243.0,109.5 250.0,105.0 257.0,100.2 264.0,95.1 271.0,89.8 278.0,84.4 285.0,78.8 292.0,73.1 299.0,67.4 306.0,61.6 313.0,55.8 320.0,50.0"/>
  <circle cx="102.8" cy="100" r="5" fill="#b4232c"/>
  <circle cx="257.2" cy="100" r="5" fill="#b4232c"/>
  <text x="97" y="122" font-size="12" fill="#b4232c" text-anchor="end">node, 0.224 L</text>
  <text x="263" y="122" font-size="12" fill="#b4232c">node, 0.776 L</text>
  <text x="180" y="22" font-size="12" fill="#1f2a44" text-anchor="middle">first bending mode of a free-free beam</text>
</svg>
```
:::
