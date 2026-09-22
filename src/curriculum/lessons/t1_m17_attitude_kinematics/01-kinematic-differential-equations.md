---
id: l01-kinematic-differential-equations
title: Kinematic differential equations for DCM, quaternion, Euler angles and MRP
minutes: 17
covers:
  - kinematic differential equations for DCM, quaternion, Euler angles and MRP
---

A rate gyro measures angular velocity. A star tracker measures attitude. Between them sits a differential equation, and which one you write down depends on how you chose to store the attitude. That equation is the subject of this lesson, and of the first half of this module: given the body rate $\boldsymbol{\omega}$, how does the attitude change?

The attitude representations module gave you four ways to carry an orientation — a direction cosine matrix, a unit quaternion, a triple of Euler angles, and a set of modified Rodrigues parameters. Each is a different coordinate chart on the same three-dimensional space of rotations, so each has its own kinematic differential equation. They describe identical motion. They differ in how many numbers you propagate, what constraints you must hold, where they break down, and how much arithmetic each step costs. On a flight computer running a 400 Hz attitude loop those differences are the whole design decision.

Two words to keep apart from the start. **Kinematics** relates attitude to rate and involves no forces, no mass and no inertia: it is pure geometry in time. **Dynamics** relates rate to torque through the inertia tensor. This lesson is entirely kinematics; the dynamics arrive when the two are coupled into one propagator later in the module. Throughout, $\boldsymbol{\omega}$ means the angular velocity of the body frame $B$ with respect to the inertial frame $N$, **expressed in body axes** — which is what a strapdown gyro triad actually reports, and the reason every equation below comes out in body components.

## The state you are propagating

Attitude has three degrees of freedom. Every representation either uses exactly three numbers and pays for it with a singularity, or uses more than three and pays for it with a constraint you have to maintain:

| Representation | Numbers carried | Constraint | Where it fails |
| --- | --- | --- | --- |
| Direction cosine matrix $\mathbf{C}$ | 9 | $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$, six conditions | Nowhere; but drifts off the orthogonal group |
| Quaternion $\mathbf{q}$ | 4 | $\lVert\mathbf{q}\rVert = 1$, one condition | Nowhere; double cover, $\mathbf{q}$ and $-\mathbf{q}$ agree |
| Euler angles $(\phi, \theta, \psi)$ | 3 | none | Gimbal lock at $\theta = \pm 90^\circ$ |
| Modified Rodrigues parameters $\boldsymbol{\sigma}$ | 3 | none | Singular at a $360^\circ$ rotation |

That table is the whole trade. The rest of the lesson writes one differential equation per row.

## The DCM kinematic equation

Let $\mathbf{C}$ be the matrix that takes the inertial components of any vector to its body components: $\mathbf{v}_B = \mathbf{C}\,\mathbf{v}_N$. Take a vector $\mathbf{v}$ that is fixed in inertial space — a star line of sight, say — so $\mathbf{v}_N$ is constant. Its body components still change, because the body is turning under it. The transport theorem from the rotating-frames module gives that rate directly: for a vector with zero inertial derivative,

$$
\left.\frac{d\mathbf{v}}{dt}\right|_B = -\boldsymbol{\omega}\times\mathbf{v}_B .
$$

Now write the same thing through the matrix. Since $\mathbf{v}_N$ is constant, $\dot{\mathbf{v}}_B = \dot{\mathbf{C}}\,\mathbf{v}_N$. Substituting $\mathbf{v}_B = \mathbf{C}\mathbf{v}_N$ on the right,

$$
\dot{\mathbf{C}}\,\mathbf{v}_N = -[\boldsymbol{\omega}\times]\,\mathbf{C}\,\mathbf{v}_N ,
$$

where $[\boldsymbol{\omega}\times]$ is the skew-symmetric cross-product matrix

$$
[\boldsymbol{\omega}\times] = \begin{bmatrix} 0 & -\omega_3 & \omega_2 \\ \omega_3 & 0 & -\omega_1 \\ -\omega_2 & \omega_1 & 0 \end{bmatrix},
\qquad [\boldsymbol{\omega}\times]\mathbf{a} = \boldsymbol{\omega}\times\mathbf{a} .
$$

The relation holds for every inertial vector $\mathbf{v}_N$, so the matrices themselves are equal:

$$
\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\,\mathbf{C} .
$$

::: key DCM kinematics
$\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$, where $\mathbf{C}$ transforms inertial components into body components and $\boldsymbol{\omega}$ is the body rate expressed in body axes. The transpose $\mathbf{C}_{NB} = \mathbf{C}^\top$ obeys $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$ — the sign flips and the multiplication changes side, which is the single most common sign error in attitude code.
:::

Two properties fall out. First, the equation preserves orthonormality exactly. Differentiate $\mathbf{C}\mathbf{C}^\top$:

$$
\frac{d}{dt}\bigl(\mathbf{C}\mathbf{C}^\top\bigr) = \dot{\mathbf{C}}\mathbf{C}^\top + \mathbf{C}\dot{\mathbf{C}}^\top = -[\boldsymbol{\omega}\times]\mathbf{C}\mathbf{C}^\top + \mathbf{C}\mathbf{C}^\top[\boldsymbol{\omega}\times] = -[\boldsymbol{\omega}\times] + [\boldsymbol{\omega}\times] = \mathbf{0},
$$

using $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$. If $\mathbf{C}$ starts orthonormal it stays orthonormal — along the exact solution. A numerical integrator does not follow the exact solution, and what it does instead is the subject of the next lesson.

Second, the cost. Nine states, and the right-hand side is a $3\times 3$ by $3\times 3$ product: 27 multiply-adds. That is three to seven times the work of the quaternion form, and you are propagating six redundant numbers to do it.

## The quaternion kinematic equation

Write the attitude quaternion scalar-first, $\mathbf{q} = (q_0,\, q_1,\, q_2,\, q_3) = (q_0,\, \mathbf{q}_v)$, with $q_0 = \cos(\Phi/2)$ and $\mathbf{q}_v = \hat{\mathbf{e}}\sin(\Phi/2)$ for a rotation of $\Phi$ about the unit axis $\hat{\mathbf{e}}$. The kinematic equation is

$$
\dot{\mathbf{q}} = \tfrac{1}{2}\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q}
= \tfrac{1}{2}\,\mathbf{q}\otimes\begin{bmatrix}0\\ \boldsymbol{\omega}\end{bmatrix},
\qquad
\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix} 0 & -\boldsymbol{\omega}^\top \\ \boldsymbol{\omega} & -[\boldsymbol{\omega}\times] \end{bmatrix},
$$

where $\otimes$ is the quaternion product. Written out in full, with $\boldsymbol{\omega} = (\omega_1, \omega_2, \omega_3)$:

$$
\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix}
0 & -\omega_1 & -\omega_2 & -\omega_3 \\
\omega_1 & 0 & \omega_3 & -\omega_2 \\
\omega_2 & -\omega_3 & 0 & \omega_1 \\
\omega_3 & \omega_2 & -\omega_1 & 0
\end{bmatrix}.
$$

Check the two forms agree. The quaternion product of $\mathbf{q} = (q_0, \mathbf{q}_v)$ with the pure quaternion $(0, \boldsymbol{\omega})$ is $(-\mathbf{q}_v\cdot\boldsymbol{\omega},\; q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$. The matrix form gives scalar part $-\boldsymbol{\omega}^\top\mathbf{q}_v$, the same thing, and vector part $q_0\boldsymbol{\omega} - [\boldsymbol{\omega}\times]\mathbf{q}_v = q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}$, also the same.

The structural fact that matters is that $\boldsymbol{\Omega}$ is skew-symmetric: $\boldsymbol{\Omega}^\top = -\boldsymbol{\Omega}$. The top-left entry is zero, the first row is $-\boldsymbol{\omega}^\top$ against a first column of $+\boldsymbol{\omega}$, and the lower-right block $-[\boldsymbol{\omega}\times]$ is itself skew. Therefore

$$
\frac{d}{dt}\bigl(\mathbf{q}^\top\mathbf{q}\bigr) = 2\,\mathbf{q}^\top\dot{\mathbf{q}} = \mathbf{q}^\top\boldsymbol{\Omega}\mathbf{q} = 0,
$$

because a quadratic form built on a skew matrix vanishes for every vector: $x^\top\mathbf{A}x = (x^\top\mathbf{A}x)^\top = x^\top\mathbf{A}^\top x = -x^\top\mathbf{A}x$, so it equals its own negative. The exact flow never leaves the unit sphere in four dimensions.

::: key Quaternion kinematics and why the norm is conserved
$\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q} = \tfrac{1}{2}\mathbf{q}\otimes[0,\boldsymbol{\omega}]$, with $\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix}0 & -\boldsymbol{\omega}^\top\\ \boldsymbol{\omega} & -[\boldsymbol{\omega}\times]\end{bmatrix}$ for scalar-first quaternions. $\boldsymbol{\Omega}$ is skew-symmetric, so $d(\mathbf{q}^\top\mathbf{q})/dt = \mathbf{q}^\top\boldsymbol{\Omega}\mathbf{q} = 0$: the continuous flow stays on the unit sphere, and only the discrete integrator pushes it off.
:::

A second consequence of skew-symmetry is worth knowing for step sizing. A direct expansion gives $\boldsymbol{\Omega}(\boldsymbol{\omega})^2 = -\lVert\boldsymbol{\omega}\rVert^2\,\mathbf{I}_4$, so the eigenvalues of $\tfrac{1}{2}\boldsymbol{\Omega}$ are $\pm i\lVert\boldsymbol{\omega}\rVert/2$, each twice. The quaternion components oscillate at **half** the body rate — the half-angle showing itself again — which sets the frequency your integrator has to resolve.

::: warning Four quaternion conventions, and they are not compatible
Scalar-first or scalar-last; Hamilton product or the JPL convention with its reversed sign; the quaternion representing body-to-inertial or inertial-to-body. Each flip changes signs in $\boldsymbol{\Omega}$. Everything in this module is scalar-first, Hamilton, with $\mathbf{q}$ the same rotation as $\mathbf{C}$ (inertial to body). If you take a library routine and its norm is preserved but your angular momentum rotates the wrong way, a convention mismatch is the first thing to check, not the last.
:::

## Euler angle kinematics

Take the aerospace 3-2-1 sequence: yaw $\psi$ about the inertial $z$, then pitch $\theta$ about the once-rotated $y$, then roll $\phi$ about the twice-rotated $x$. The body rate is the sum of the three individual rates, each about *its own* axis, and those three axes are not orthogonal to one another. Resolving all three into body axes and inverting the result gives

$$
\begin{aligned}
\dot{\phi} &= p + (q\sin\phi + r\cos\phi)\tan\theta, \\
\dot{\theta} &= q\cos\phi - r\sin\phi, \\
\dot{\psi} &= \frac{q\sin\phi + r\cos\phi}{\cos\theta},
\end{aligned}
$$

with $(p, q, r) = (\omega_1, \omega_2, \omega_3)$ in the usual aircraft naming. In matrix form,

$$
\begin{bmatrix}\dot{\phi}\\ \dot{\theta}\\ \dot{\psi}\end{bmatrix}
= \frac{1}{\cos\theta}\begin{bmatrix}
\cos\theta & \sin\phi\sin\theta & \cos\phi\sin\theta \\
0 & \cos\phi\cos\theta & -\sin\phi\cos\theta \\
0 & \sin\phi & \cos\phi
\end{bmatrix}
\begin{bmatrix}p\\ q\\ r\end{bmatrix}.
$$

The $1/\cos\theta$ is not removable. At $\theta = \pm 90^\circ$ the yaw axis and the roll axis have become the same physical line, the matrix above is singular, and $\dot{\phi}$ and $\dot{\psi}$ both run away while their difference stays finite. That is **gimbal lock**, and it is a property of the coordinates, not of the vehicle: nothing whatever happens to the spacecraft as it passes through. The body rate stays bounded and perfectly well behaved; the numbers you chose to describe it do not.

This is why a launch vehicle flying a near-vertical pitch program, or any vehicle that can point anywhere, never carries Euler angles as its propagated state. They are excellent for telemetry, for a display, for a specification written by a human. They are a poor state vector.

## MRP kinematics

The modified Rodrigues parameters are built from the quaternion as

$$
\boldsymbol{\sigma} = \frac{\mathbf{q}_v}{1 + q_0} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{4},
$$

three numbers with no constraint, singular only at $\Phi = 360^\circ$ where $q_0 = -1$. Differentiating that definition and substituting the quaternion kinematics gives the MRP equation directly. With $s = 1 + q_0$ and $\mathbf{q}_v = s\boldsymbol{\sigma}$,

$$
\dot{\boldsymbol{\sigma}} = \frac{\dot{\mathbf{q}}_v}{s} - \frac{\mathbf{q}_v\,\dot{q}_0}{s^2}
= \frac{q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}}{2s} + \frac{\boldsymbol{\sigma}(\boldsymbol{\omega}\cdot\boldsymbol{\sigma})}{2},
$$

and using $q_0 = (1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})/(1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, which makes $(q_0)/s = (s-1)/s = (1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})/2$, the three terms collect into

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\,\boldsymbol{\omega}.
$$

::: key MRP kinematics
$\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\boldsymbol{\omega}$. Three states, no constraint to maintain, and the $\boldsymbol{\sigma} \to -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ shadow-set switch whenever $\lVert\boldsymbol{\sigma}\rVert > 1$ keeps the description bounded for arbitrarily large rotations.
:::

The shadow set is what makes MRPs practical. The two quaternions $\mathbf{q}$ and $-\mathbf{q}$ describe the same attitude and map to two different MRP vectors, $\boldsymbol{\sigma}$ and $\boldsymbol{\sigma}^S = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$. One of the pair always satisfies $\lVert\boldsymbol{\sigma}\rVert \le 1$, corresponding to $\Phi \le 180^\circ$. Switching to the shadow set whenever the norm exceeds one keeps the state small, the singularity far away, and — the practical point — removes the ambiguity that makes quaternion feedback laws need a sign test before every slew. MRPs are the natural state for nonlinear attitude control laws; quaternions remain the natural state for estimators and for raw propagation.

::: example One instant, four descriptions
A spacecraft has attitude $\mathbf{q} = (0.5,\, 0.5,\, 0.5,\, 0.5)$ and body rate $\boldsymbol{\omega} = (0.02,\, -0.01,\, 0.05)\,\mathrm{rad/s}$, which is $\lVert\boldsymbol{\omega}\rVert = 0.0548\,\mathrm{rad/s} = 3.14^\circ/\mathrm{s}$. That quaternion is a $120^\circ$ rotation about $(1,1,1)/\sqrt{3}$, since $q_0 = 0.5 = \cos 60^\circ$.

**Quaternion rate.** $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$. The scalar row gives $\tfrac{1}{2}(-0.02 - (-0.01) - 0.05)(0.5) = -0.015$, and the three vector rows give $0.02$, $-0.01$, $0.005$, so $\dot{\mathbf{q}} = (-0.015,\, 0.02,\, -0.01,\, 0.005)\,\mathrm{s^{-1}}$. Confirm the norm is safe: $\mathbf{q}\cdot\dot{\mathbf{q}} = 0.5(-0.015 + 0.02 - 0.01 + 0.005) = 0$ exactly.

**DCM rate.** The matrix for this quaternion is a clean axis permutation, $\mathbf{C} = \begin{bmatrix}0&1&0\\0&0&1\\1&0&0\end{bmatrix}$: body $x$ points along inertial $y$, body $y$ along inertial $z$, body $z$ along inertial $x$. Then

$$
\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C} = \begin{bmatrix}0 & 0.05 & 0.01\\ -0.05 & 0 & 0.02\\ -0.01 & -0.02 & 0\end{bmatrix}\begin{bmatrix}0&1&0\\0&0&1\\1&0&0\end{bmatrix} = \begin{bmatrix}0.01 & 0 & 0.05\\ 0.02 & -0.05 & 0\\ 0 & -0.01 & -0.02\end{bmatrix}\mathrm{s^{-1}}.
$$

**Euler rates.** Reading the 3-2-1 angles off $\mathbf{C}$ gives $\theta = \arcsin(-C_{13}) = 0^\circ$, $\phi = \mathrm{atan2}(C_{23}, C_{33}) = 90^\circ$, $\psi = \mathrm{atan2}(C_{12}, C_{11}) = 90^\circ$. With $\theta = 0$ the $\tan\theta$ term drops and $\dot{\phi} = p = 0.02$, $\dot{\theta} = q\cos 90^\circ - r\sin 90^\circ = -0.05$, $\dot{\psi} = q/\cos 0 = -0.01\,\mathrm{rad/s}$, that is $(1.15,\, -2.86,\, -0.57)\,^\circ/\mathrm{s}$.

**MRP rate.** $\boldsymbol{\sigma} = \mathbf{q}_v/(1 + q_0) = (1/3, 1/3, 1/3)$, with $\lVert\boldsymbol{\sigma}\rVert = 0.577 = \tan(120^\circ/4) = \tan 30^\circ$ as the definition promises, comfortably inside the shadow-switch boundary of 1. Here $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 1/3$, so the bracket is $\tfrac{2}{3}\mathbf{I} + 2[\boldsymbol{\sigma}\times] + \tfrac{2}{9}\mathbf{J}$ with $\mathbf{J}$ the all-ones matrix, and

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\begin{bmatrix}8/9 & -4/9 & 8/9\\ 8/9 & 8/9 & -4/9\\ -4/9 & 8/9 & 8/9\end{bmatrix}\begin{bmatrix}0.02\\ -0.01\\ 0.05\end{bmatrix} = (0.01667,\, -0.00333,\, 0.00667)\,\mathrm{s^{-1}}.
$$

Four different-looking rate vectors — 4, 9, 3 and 3 numbers — describing one rotation of a spacecraft at three degrees per second. Propagate any of them for a second and convert; you get the same attitude to integrator accuracy.
:::

::: example What gimbal lock costs a pitch program
A booster is pitching at $q = 0.5^\circ/\mathrm{s}$ with $r = 0.1^\circ/\mathrm{s}$ of yaw rate, $p = 0.2^\circ/\mathrm{s}$ of roll rate, and a roll angle $\phi = 30^\circ$. The body rate magnitude is $\sqrt{0.2^2 + 0.5^2 + 0.1^2} = 0.548^\circ/\mathrm{s}$ throughout, a leisurely motion. Track the Euler rates as the pitch attitude steepens. The combination $q\sin\phi + r\cos\phi = 0.5(0.5) + 0.1(0.866) = 0.3366^\circ/\mathrm{s}$ is common to two of the three:

| $\theta$ | $1/\cos\theta$ | $\dot{\psi}$ | $\dot{\phi}$ |
| --- | --- | --- | --- |
| $60^\circ$ | 2.00 | $0.673^\circ/\mathrm{s}$ | $0.783^\circ/\mathrm{s}$ |
| $85^\circ$ | 11.47 | $3.862^\circ/\mathrm{s}$ | $4.047^\circ/\mathrm{s}$ |
| $89^\circ$ | 57.30 | $19.287^\circ/\mathrm{s}$ | $19.484^\circ/\mathrm{s}$ |

At $89^\circ$ two of the three Euler rates read nearly twenty degrees per second while the vehicle turns at half a degree per second. They are equal and opposite in their effect — the physical motion is contained in $\dot{\phi} - \dot{\psi} = 0.197^\circ/\mathrm{s}$, close to $p$ — but an integrator does not know that. To keep the same relative accuracy on $\psi$ your step has to shrink by the factor $1/\cos\theta$, so a $10\,\mathrm{ms}$ step at $60^\circ$ becomes a $0.35\,\mathrm{ms}$ step at $89^\circ$, and at $90^\circ$ no step is small enough. The quaternion running beside it notices nothing: its four components stay of order one and its derivative stays of order $\lVert\boldsymbol{\omega}\rVert/2 = 0.0048\,\mathrm{rad/s}$.
:::

::: warning "Angular velocity" is not the derivative of anything
There is no vector-valued attitude function whose time derivative is $\boldsymbol{\omega}$. Integrating $\int\boldsymbol{\omega}\,dt$ component by component gives a quantity with no geometric meaning, because finite rotations do not commute: a $90^\circ$ pitch followed by a $90^\circ$ roll is not a $90^\circ$ roll followed by a $90^\circ$ pitch, while the integrals are identical. Every equation in this lesson exists precisely because that naive integral is wrong. The size of the error it makes is the subject of the coning lesson at the end of the module.
:::

::: note Which one flies
A typical spacecraft attitude control computer propagates the quaternion, converts to a DCM once per cycle for sensor and actuator vector maths, reports Euler angles to the ground for readability, and — if the control law is a nonlinear one — computes the error signal in MRPs. All four appear in the same 10 ms frame, each doing what it is best at. Knowing four kinematic equations is not academic tidiness; it is the working vocabulary.
:::

## Check yourself

::: check
Show that $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$ follows from $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$, and say in words what the sign flip means.
:::

::: answer
Since $\mathbf{C}_{NB} = \mathbf{C}^\top$, transpose the given equation: $\dot{\mathbf{C}}^\top = \bigl(-[\boldsymbol{\omega}\times]\mathbf{C}\bigr)^\top = \mathbf{C}^\top\bigl(-[\boldsymbol{\omega}\times]\bigr)^\top = \mathbf{C}^\top[\boldsymbol{\omega}\times]$, using the skew-symmetry $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$. So $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$.

In words: the columns of $\mathbf{C}_{NB}$ are the body axes written in inertial components, and each is being carried around by the rotation, so each column obeys $\dot{\mathbf{b}}_k = \boldsymbol{\omega}\times\mathbf{b}_k$ with a plus sign. The rows of $\mathbf{C}$ are the same vectors, so the body-to-inertial form takes the plus and multiplies from the right, and the inertial-to-body form takes the minus and multiplies from the left. Getting this backwards produces a simulation that runs the rotation in reverse while conserving everything you thought to check.
:::

::: check
Your colleague proposes propagating attitude by integrating $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$ with the nine entries as independent states. How many redundant degrees of freedom is that, and what happens to the redundancy under a numerical integrator?
:::

::: answer
Nine states for three degrees of freedom is six redundant numbers, held in check by the six independent conditions in $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ (three unit-length conditions and three orthogonality conditions; the matrix equation has nine entries but is symmetric). The exact flow keeps all six satisfied, as the derivation of $d(\mathbf{C}\mathbf{C}^\top)/dt = 0$ shows. A numerical integrator satisfies them only to its own truncation error, so the columns slowly lose unit length and mutual perpendicularity. The matrix then represents a rotation combined with a small stretch and shear — it is no longer a rotation at all, and every vector you transform with it picks up a systematic error.
:::

::: check
At $\theta = 89.9^\circ$ with $\phi = 30^\circ$, $p = 0.2^\circ/\mathrm{s}$, $q = 0.5^\circ/\mathrm{s}$, $r = 0.1^\circ/\mathrm{s}$, compute $\dot{\psi}$ and $\dot{\phi}$. Then compute $\dot{\phi} - \dot{\psi}$ and explain why that combination stays small.
:::

::: answer
The shared combination is $q\sin\phi + r\cos\phi = 0.5(0.5) + 0.1(0.8660) = 0.3366^\circ/\mathrm{s}$. With $\cos 89.9^\circ = 0.0017453$, $\dot{\psi} = 0.3366/0.0017453 = 192.86^\circ/\mathrm{s}$. With $\tan 89.9^\circ = 572.957$, $\dot{\phi} = 0.2 + 0.3366(572.957) = 193.06^\circ/\mathrm{s}$.

Their difference is $193.06 - 192.86 = 0.20^\circ/\mathrm{s}$, exactly $p$, because $\tan\theta - 1/\cos\theta \to 0$ as $\theta \to 90^\circ$ (write it as $(\sin\theta - 1)/\cos\theta$, which is $0/0$ and tends to zero). Physically, at $\theta = 90^\circ$ the roll axis and the yaw axis coincide, so only the *sum* of the two rotations about that shared line is observable; the split between $\phi$ and $\psi$ is arbitrary and the equations resolve it by sending both to infinity with a finite difference. Two enormous numbers whose difference is the small true answer is also a recipe for catastrophic cancellation in floating point.
:::

::: check
A spacecraft has $\boldsymbol{\sigma} = (0.9, 0.3, 0.2)$. Should you switch to the shadow set, and what is the new vector? What rotation angle does each correspond to?
:::

::: answer
$\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.81 + 0.09 + 0.04 = 0.94$, so $\lVert\boldsymbol{\sigma}\rVert = 0.9695$, which is less than 1 — no switch yet. The corresponding rotation angle is $\Phi = 4\arctan(0.9695) = 4(44.11^\circ) = 176.4^\circ$, close to the half-turn where the shadow boundary sits.

Had it been $(0.9, 0.5, 0.4)$, then $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.81 + 0.25 + 0.16 = 1.22$ and $\lVert\boldsymbol{\sigma}\rVert = 1.1045 > 1$, so you switch: $\boldsymbol{\sigma}^S = -\boldsymbol{\sigma}/1.22 = (-0.738, -0.410, -0.328)$, whose norm is $1/1.1045 = 0.9054$. The original describes $\Phi = 4\arctan(1.1045) = 191.4^\circ$ about $\hat{\mathbf{e}}$; the shadow describes $4\arctan(0.9054) = 168.6^\circ$ about $-\hat{\mathbf{e}}$. Same attitude, $191.4 + 168.6 = 360^\circ$, the short way round instead of the long way.
:::

::: check
Two engineers integrate the same gyro data. One propagates a quaternion and reports a norm of $1 - 4\times 10^{-9}$ after an hour. The other propagates Euler angles and reports no constraint violation at all. Which result is more trustworthy?
:::

::: answer
Neither number tells you about accuracy; they measure different things. The quaternion norm measures how far the integrator has wandered off the constraint manifold, which is a *diagnostic* the Euler-angle propagation cannot offer because it has no constraint to violate. A clean norm does not prove the attitude is right — a quaternion can be exactly unit-norm and point the wrong way — but a drifting norm proves something is wrong. The Euler-angle run has silently accumulated the same order of truncation error, plus whatever the $1/\cos\theta$ amplification added near steep pitch attitudes, and offers no way to see it. Prefer the representation that gives you a free self-check, and then check accuracy separately by propagating a known closed-form case or by comparing two step sizes.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\boldsymbol{\omega}$ | Angular velocity of body relative to inertial, in body axes, $\mathrm{rad/s}$ |
| $[\boldsymbol{\omega}\times]$ | Skew cross-product matrix; $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$ |
| $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$ | DCM kinematics, $\mathbf{C}$ inertial to body; 9 states, 6 constraints |
| $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$ | The transposed form; sign and side both flip |
| $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q} = \tfrac{1}{2}\mathbf{q}\otimes[0,\boldsymbol{\omega}]$ | Quaternion kinematics, scalar-first |
| $\boldsymbol{\Omega} = \begin{bmatrix}0 & -\boldsymbol{\omega}^\top\\ \boldsymbol{\omega} & -[\boldsymbol{\omega}\times]\end{bmatrix}$ | Skew, so $d(\mathbf{q}^\top\mathbf{q})/dt = 0$; $\boldsymbol{\Omega}^2 = -\lVert\boldsymbol{\omega}\rVert^2\mathbf{I}_4$ |
| $\dot{\phi} = p + (q\sin\phi + r\cos\phi)\tan\theta$ | 3-2-1 Euler kinematics, with $\dot{\theta} = q\cos\phi - r\sin\phi$ and $\dot{\psi} = (q\sin\phi + r\cos\phi)/\cos\theta$ |
| Gimbal lock | The $1/\cos\theta$ factor at $\theta = \pm 90^\circ$; a coordinate failure, not a physical one |
| $\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top]\boldsymbol{\omega}$ | MRP kinematics; shadow switch at $\lVert\boldsymbol{\sigma}\rVert > 1$ |
| Worked instant | $\mathbf{q} = (0.5,0.5,0.5,0.5)$, $\boldsymbol{\omega} = (0.02,-0.01,0.05)$ gives $\dot{\mathbf{q}} = (-0.015, 0.02, -0.01, 0.005)$ |

The next lesson takes these exact equations and hands them to a numerical integrator, which breaks every constraint they preserve. You will measure how fast the DCM loses orthonormality, how fast the quaternion norm drifts, and what re-normalisation costs and buys.
