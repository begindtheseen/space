---
id: l01-kinematic-differential-equations
title: Kinematic differential equations for DCM, quaternion, Euler angles and MRP
minutes: 22
covers:
  - kinematic differential equations for DCM, quaternion, Euler angles and MRP
---

Think of steering a bicycle with your eyes closed. You know how fast you are turning the handlebars, second by second. From that alone, can you say which way you are facing now? You can — if you keep adding up the turning carefully. That "adding up" is what this lesson is about, for a spacecraft.

A **rate gyro** measures how fast the vehicle is spinning, its **angular velocity**. A **star tracker** measures which way it is pointing, its **attitude**. Between the two sits a differential equation: a rule that says how the attitude changes, given the spin rate. Which rule you write depends on how you chose to store the attitude.

The attitude representations module gave you four ways to store an orientation: a direction cosine matrix, a unit quaternion, three Euler angles, and the modified Rodrigues parameters. Each is a different set of numbers for the same thing, so each has its own rule. They all describe the same motion. They differ in how many numbers you carry, what rules those numbers must obey, where they break, and how much arithmetic each step costs. On a flight computer running an attitude loop 400 times a second, those differences are the whole design decision.

Keep two words apart from the start. **[[Kinematics|kinematics-word]]** links attitude to spin rate, with no forces, masses or inertia — pure geometry in time. **Dynamics** links spin rate to torque through the inertia tensor. This lesson is all kinematics. The dynamics join in later in the module.

Throughout, $\boldsymbol{\omega}$ (read "omega") is the angular velocity of the body frame $B$ relative to the inertial frame $N$, **written in body axes**. That is what a **[[strapdown|strapdown]]** gyro triad — three gyros bolted to the vehicle — actually reports, and it is why every equation below comes out in body components.

## The state you are propagating

To **propagate** a state means to step it forward in time. Attitude has three **degrees of freedom** — three independent ways to turn (roll, pitch, yaw). Every representation pays for storing it somehow. Either it uses exactly three numbers and has a **singularity** (an attitude where the numbers break), or it uses more than three and has a **constraint** (a rule the extra numbers must keep obeying):

| Representation | Numbers carried | Constraint | Where it fails |
| --- | --- | --- | --- |
| Direction cosine matrix $\mathbf{C}$ | 9 | $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$, six conditions | Nowhere; but drifts off the orthogonal group |
| Quaternion $\mathbf{q}$ | 4 | $\lVert\mathbf{q}\rVert = 1$, one condition | Nowhere; double cover, $\mathbf{q}$ and $-\mathbf{q}$ agree |
| Euler angles $(\phi, \theta, \psi)$ | 3 | none | Gimbal lock at $\theta = \pm 90^\circ$ |
| Modified Rodrigues parameters $\boldsymbol{\sigma}$ | 3 | none | Singular at a $360^\circ$ rotation |

That table is the whole trade. The rest of the lesson writes one differential equation per row.

## The DCM kinematic equation

Stand in a field at night and turn slowly to your left. The stars seem to slide to your right. They have not moved; you have. Any direction fixed in space appears, from the turning body, to turn the opposite way. That is the whole idea of this section.

Let $\mathbf{C}$ be the **direction cosine matrix** (DCM) that turns the inertial components of any vector into its body components: $\mathbf{v}_B = \mathbf{C}\,\mathbf{v}_N$. Pick a vector fixed in inertial space, like the line of sight to a star, so $\mathbf{v}_N$ never changes. Its body components still change, because the body turns under it. The **[[transport theorem|transport-theorem]]** from the rotating-frames module gives that rate. For a vector that is fixed in inertial space,

$$
\left.\frac{d\mathbf{v}}{dt}\right|_B = -\boldsymbol{\omega}\times\mathbf{v}_B .
$$

The minus sign is the stars sliding the opposite way.

Now say the same thing with the matrix. Since $\mathbf{v}_N$ is constant, differentiating $\mathbf{v}_B = \mathbf{C}\mathbf{v}_N$ gives $\dot{\mathbf{v}}_B = \dot{\mathbf{C}}\,\mathbf{v}_N$. (A dot over a symbol, as in $\dot{\mathbf{C}}$, read "C dot", means its rate of change in time.) Set the two expressions for $\dot{\mathbf{v}}_B$ equal, and swap $\mathbf{v}_B$ for $\mathbf{C}\mathbf{v}_N$ on the right:

$$
\dot{\mathbf{C}}\,\mathbf{v}_N = -[\boldsymbol{\omega}\times]\,\mathbf{C}\,\mathbf{v}_N .
$$

Here $[\boldsymbol{\omega}\times]$, read "omega cross", is the **cross-product matrix** — the matrix that does the cross product when you multiply by it:

$$
[\boldsymbol{\omega}\times] = \begin{bmatrix} 0 & -\omega_3 & \omega_2 \\ \omega_3 & 0 & -\omega_1 \\ -\omega_2 & \omega_1 & 0 \end{bmatrix},
\qquad [\boldsymbol{\omega}\times]\mathbf{a} = \boldsymbol{\omega}\times\mathbf{a} .
$$

It is **[[skew-symmetric|skew-symmetric]]**: flip it across its diagonal and every entry changes sign, $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$.

The equation above holds for every star, every inertial vector $\mathbf{v}_N$. Two matrices that do the same thing to every vector are the same matrix. So

$$
\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\,\mathbf{C} .
$$

::: key DCM kinematics
$\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$, where $\mathbf{C}$ transforms inertial components into body components and $\boldsymbol{\omega}$ is the body rate expressed in body axes. The transpose $\mathbf{C}_{NB} = \mathbf{C}^\top$ obeys $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$ — the sign flips and the multiplication changes side, which is the single most common sign error in attitude code.
:::

Two properties come out of this.

**It keeps the matrix a rotation, exactly.** A DCM is **orthonormal**: its rows are unit length and at right angles to each other, which is what $\mathbf{C}\mathbf{C}^\top = \mathbf{I}$ says. If $\mathbf{C}$ starts orthonormal, the exact solution of the equation stays orthonormal forever. A numerical integrator does not follow the exact solution, and what it does instead is the next lesson.

::: note Why it has to be true
Differentiate $\mathbf{C}\mathbf{C}^\top$ with the product rule, then put in the kinematic equation for $\dot{\mathbf{C}}$ and its transpose, $\dot{\mathbf{C}}^\top = \mathbf{C}^\top[\boldsymbol{\omega}\times]$ (the transpose of a product reverses the order, and $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$):

$$
\frac{d}{dt}\bigl(\mathbf{C}\mathbf{C}^\top\bigr) = \dot{\mathbf{C}}\mathbf{C}^\top + \mathbf{C}\dot{\mathbf{C}}^\top = -[\boldsymbol{\omega}\times]\mathbf{C}\mathbf{C}^\top + \mathbf{C}\mathbf{C}^\top[\boldsymbol{\omega}\times] = -[\boldsymbol{\omega}\times] + [\boldsymbol{\omega}\times] = \mathbf{0}.
$$

The third step uses $\mathbf{C}\mathbf{C}^\top = \mathbf{I}$ at the current instant. The rate of change of $\mathbf{C}\mathbf{C}^\top$ is zero, so it stays $\mathbf{I}$.
:::

**It is expensive.** You carry nine numbers to describe three degrees of freedom. The right-hand side is a $3\times 3$ matrix times a $3\times 3$ matrix: 27 multiply-adds per evaluation. The quaternion form below needs 16 (only 12 of them nonzero), so the DCM costs about twice as much, and six of its nine numbers are redundant.

## The quaternion kinematic equation

A **quaternion** stores a rotation as four numbers. Write it scalar-first, $\mathbf{q} = (q_0,\, q_1,\, q_2,\, q_3) = (q_0,\, \mathbf{q}_v)$: one plain number $q_0$ (the **scalar part**) and a 3-vector $\mathbf{q}_v$ (the **vector part**). For a rotation by angle $\Phi$ (capital "phi") about the unit axis $\hat{\mathbf{e}}$,

$$
q_0 = \cos\frac{\Phi}{2}, \qquad \mathbf{q}_v = \hat{\mathbf{e}}\sin\frac{\Phi}{2}.
$$

The kinematic equation is

$$
\dot{\mathbf{q}} = \tfrac{1}{2}\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q}
= \tfrac{1}{2}\,\mathbf{q}\otimes\begin{bmatrix}0\\ \boldsymbol{\omega}\end{bmatrix},
\qquad
\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix} 0 & -\boldsymbol{\omega}^\top \\ \boldsymbol{\omega} & -[\boldsymbol{\omega}\times] \end{bmatrix},
$$

where $\otimes$ is the quaternion product and $\boldsymbol{\Omega}(\boldsymbol{\omega})$ is read "capital omega of omega". It is a $4\times 4$ matrix built from the rate. Written out in full, with $\boldsymbol{\omega} = (\omega_1, \omega_2, \omega_3)$:

$$
\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix}
0 & -\omega_1 & -\omega_2 & -\omega_3 \\
\omega_1 & 0 & \omega_3 & -\omega_2 \\
\omega_2 & -\omega_3 & 0 & \omega_1 \\
\omega_3 & \omega_2 & -\omega_1 & 0
\end{bmatrix}.
$$

Check that the two forms agree. The quaternion product of $\mathbf{q} = (q_0, \mathbf{q}_v)$ with the **pure quaternion** $(0, \boldsymbol{\omega})$ (scalar part zero) is

$$
\mathbf{q}\otimes(0, \boldsymbol{\omega}) = \bigl(-\mathbf{q}_v\cdot\boldsymbol{\omega},\;\; q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\bigr).
$$

The matrix form gives a scalar part $-\boldsymbol{\omega}^\top\mathbf{q}_v$ — the same dot product. Its vector part is $q_0\boldsymbol{\omega} - [\boldsymbol{\omega}\times]\mathbf{q}_v = q_0\boldsymbol{\omega} - \boldsymbol{\omega}\times\mathbf{q}_v = q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}$, because swapping the order of a cross product flips its sign. Same again.

### Why the length never changes

Picture a ball whirled on a string. The ball always moves sideways to the string, never along it, so the string never gets longer or shorter. The quaternion does the same thing in four dimensions: its rate $\dot{\mathbf{q}}$ is always at right angles to $\mathbf{q}$ itself, so its length stays exactly $1$.

The reason is that $\boldsymbol{\Omega}$ is skew-symmetric, $\boldsymbol{\Omega}^\top = -\boldsymbol{\Omega}$. Look at the pattern. The top-left entry is zero. The first row is $-\boldsymbol{\omega}^\top$ and the first column is $+\boldsymbol{\omega}$. The lower-right block, $-[\boldsymbol{\omega}\times]$, is itself skew. The length squared is $\mathbf{q}^\top\mathbf{q}$, and its rate of change is

$$
\frac{d}{dt}\bigl(\mathbf{q}^\top\mathbf{q}\bigr) = 2\,\mathbf{q}^\top\dot{\mathbf{q}} = \mathbf{q}^\top\boldsymbol{\Omega}\mathbf{q} = 0.
$$

The last step holds because a **[[quadratic form|quadratic-form]]** $\mathbf{x}^\top\mathbf{A}\mathbf{x}$ built on a skew matrix is zero for every vector.

::: note Why it has to be true
A quadratic form $\mathbf{x}^\top\mathbf{A}\mathbf{x}$ is a single number, and a single number equals its own transpose. So

$$
\mathbf{x}^\top\mathbf{A}\mathbf{x} = (\mathbf{x}^\top\mathbf{A}\mathbf{x})^\top = \mathbf{x}^\top\mathbf{A}^\top\mathbf{x} = -\mathbf{x}^\top\mathbf{A}\mathbf{x}.
$$

The last step uses $\mathbf{A}^\top = -\mathbf{A}$. The only number equal to its own negative is zero.
:::

So the exact solution never leaves the **unit sphere** in four dimensions — the set of all 4-vectors of length one.

::: key Quaternion kinematics and why the norm is conserved
$\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q} = \tfrac{1}{2}\mathbf{q}\otimes[0,\boldsymbol{\omega}]$, with $\boldsymbol{\Omega}(\boldsymbol{\omega}) = \begin{bmatrix}0 & -\boldsymbol{\omega}^\top\\ \boldsymbol{\omega} & -[\boldsymbol{\omega}\times]\end{bmatrix}$ for scalar-first quaternions. $\boldsymbol{\Omega}$ is skew-symmetric, so $d(\mathbf{q}^\top\mathbf{q})/dt = \mathbf{q}^\top\boldsymbol{\Omega}\mathbf{q} = 0$: the continuous flow stays on the unit sphere, and only the discrete integrator pushes it off.
:::

One more fact about $\boldsymbol{\Omega}$ matters when you choose a time step. Multiplying it out gives $\boldsymbol{\Omega}(\boldsymbol{\omega})^2 = -\lVert\boldsymbol{\omega}\rVert^2\,\mathbf{I}_4$. So the **eigenvalues** of $\tfrac{1}{2}\boldsymbol{\Omega}$ — the special numbers that say how fast the solution swings — are $\pm i\lVert\boldsymbol{\omega}\rVert/2$, each appearing twice. The quaternion components wave up and down at **[[half the body rate|half-rate]]**. That is the half-angle in $\cos(\Phi/2)$ showing itself again, and it sets the frequency your integrator has to follow.

::: warning Quaternion conventions do not mix
Scalar-first or scalar-last. The Hamilton product or the JPL convention, which reverses a sign in the product. The quaternion taking body to inertial, or inertial to body. Each flip changes signs in $\boldsymbol{\Omega}$. Everything in this module is scalar-first, Hamilton, with $\mathbf{q}$ describing the same rotation as $\mathbf{C}$ (inertial to body). If you borrow a library routine and the norm stays at one but your angular momentum rotates the wrong way, check for a convention mismatch first, not last.
:::

## Euler angle kinematics

**Euler angles** describe an attitude as three turns in a row, like the instructions "face north, tilt your head up, then lean sideways". Take the aerospace **3-2-1 sequence**: yaw $\psi$ ("psi") about the inertial $z$ axis, then pitch $\theta$ ("theta") about the once-turned $y$ axis, then roll $\phi$ ("phi") about the twice-turned $x$ axis.

The body rate is the sum of the three angle rates, each about *its own* axis. But those three axes are not at right angles to each other. Resolving all three into body axes, then solving for the angle rates, gives

$$
\begin{aligned}
\dot{\phi} &= p + (q\sin\phi + r\cos\phi)\tan\theta, \\
\dot{\theta} &= q\cos\phi - r\sin\phi, \\
\dot{\psi} &= \frac{q\sin\phi + r\cos\phi}{\cos\theta},
\end{aligned}
$$

where $(p, q, r) = (\omega_1, \omega_2, \omega_3)$ are the roll, pitch and yaw rates in the usual aircraft naming. (This $q$ is a pitch rate, not the quaternion.) In matrix form,

$$
\begin{bmatrix}\dot{\phi}\\ \dot{\theta}\\ \dot{\psi}\end{bmatrix}
= \frac{1}{\cos\theta}\begin{bmatrix}
\cos\theta & \sin\phi\sin\theta & \cos\phi\sin\theta \\
0 & \cos\phi\cos\theta & -\sin\phi\cos\theta \\
0 & \sin\phi & \cos\phi
\end{bmatrix}
\begin{bmatrix}p\\ q\\ r\end{bmatrix}.
$$

You cannot get rid of that $1/\cos\theta$. At $\theta = \pm 90^\circ$, $\cos\theta = 0$. The yaw axis and the roll axis have become the same physical line, the matrix is singular, and $\dot{\phi}$ and $\dot{\psi}$ both race off to infinity while their difference stays finite. That is **[[gimbal lock|gimbal-lock]]** — the Euler angles jamming at pitch $\pm 90^\circ$ — and it belongs to the numbers, not to the vehicle. Nothing happens to the spacecraft as it passes through. Its body rate stays small and well behaved. Only the three numbers you chose to describe it misbehave.

This is why a launch vehicle flying nearly straight up, or any craft that can point anywhere, never carries Euler angles as its propagated state. They are excellent for telemetry, for a display, for a requirement written by a person. They are a poor state vector.

## MRP kinematics

The **modified Rodrigues parameters** (MRPs) squeeze the quaternion into three numbers:

$$
\boldsymbol{\sigma} = \frac{\mathbf{q}_v}{1 + q_0} = \hat{\mathbf{e}}\,\tan\frac{\Phi}{4}.
$$

Read $\boldsymbol{\sigma}$ as "sigma". There is no constraint to keep. The only singularity is at $\Phi = 360^\circ$, where $q_0 = -1$ and the bottom becomes zero. Differentiating this definition and using the quaternion equation gives

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\,\boldsymbol{\omega}.
$$

Here $\boldsymbol{\sigma}^\top\boldsymbol{\sigma}$ is a plain number (the length squared), while $\boldsymbol{\sigma}\boldsymbol{\sigma}^\top$ is a $3\times 3$ matrix (the **outer product**, every component times every component).

::: note Why it has to be true
Let $s = 1 + q_0$, so $\mathbf{q}_v = s\boldsymbol{\sigma}$. Differentiate $\boldsymbol{\sigma} = \mathbf{q}_v/s$ with the quotient rule:

$$
\dot{\boldsymbol{\sigma}} = \frac{\dot{\mathbf{q}}_v}{s} - \frac{\mathbf{q}_v\,\dot{q}_0}{s^2}.
$$

From the quaternion equation, $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v\cdot\boldsymbol{\omega}$ and $\dot{\mathbf{q}}_v = \tfrac{1}{2}(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega})$. Put these in and use $\mathbf{q}_v/s = \boldsymbol{\sigma}$:

$$
\dot{\boldsymbol{\sigma}} = \frac{q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}}{2s} + \frac{\boldsymbol{\sigma}(\boldsymbol{\omega}\cdot\boldsymbol{\sigma})}{2}.
$$

The unit-norm quaternion gives $q_0 = (1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})/(1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma})$, so $s = 2/(1 + \boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ and $q_0/s = (1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})/2$. The three terms become $\tfrac{1}{4}(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\boldsymbol{\omega}$, $\tfrac{1}{2}\boldsymbol{\sigma}\times\boldsymbol{\omega}$ and $\tfrac{1}{2}\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\boldsymbol{\omega}$. Pull out $\tfrac{1}{4}$ and $\boldsymbol{\omega}$, and that is the bracket.
:::

::: key MRP kinematics
$\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\boldsymbol{\omega}$. Three states, no constraint to maintain, and the $\boldsymbol{\sigma} \to -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ shadow-set switch whenever $\lVert\boldsymbol{\sigma}\rVert > 1$ keeps the description bounded for arbitrarily large rotations.
:::

The **[[shadow set|shadow-set]]** is what makes MRPs practical. Turning $270^\circ$ to the left ends up facing the same way as turning $90^\circ$ to the right. In the same way, $\mathbf{q}$ and $-\mathbf{q}$ describe one attitude, but they give two different MRP vectors: $\boldsymbol{\sigma}$ and its shadow $\boldsymbol{\sigma}^S = -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$. One of the pair always has $\lVert\boldsymbol{\sigma}\rVert \le 1$, which means $\Phi \le 180^\circ$ — the short way round.

Switching to the shadow whenever the length passes one keeps the numbers small and the singularity far away. It also removes the "which sign?" question that makes quaternion feedback laws check a sign before every slew. MRPs are the natural state for nonlinear attitude control laws. Quaternions remain the natural state for estimators and for raw propagation.

::: example One instant, four descriptions
A spacecraft has attitude $\mathbf{q} = (0.5,\, 0.5,\, 0.5,\, 0.5)$ and body rate $\boldsymbol{\omega} = (0.02,\, -0.01,\, 0.05)\,\mathrm{rad/s}$. The rate's size is $\lVert\boldsymbol{\omega}\rVert = \sqrt{0.02^2 + 0.01^2 + 0.05^2} = 0.0548\,\mathrm{rad/s} = 3.14^\circ/\mathrm{s}$. Since $q_0 = 0.5 = \cos 60^\circ$, the quaternion is a $120^\circ$ rotation, about the axis $(1,1,1)/\sqrt{3}$.

**Quaternion rate.** Use $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$. Every component of $\mathbf{q}$ is $0.5$, so each row is $\tfrac{1}{2} \times 0.5 \times$ (the sum of that row of $\boldsymbol{\Omega}$). The scalar row sums to $-0.02 + 0.01 - 0.05 = -0.06$, giving $\tfrac{1}{4}(-0.06) = -0.015$. The three vector rows sum to $0.08$, $-0.04$ and $0.02$, giving $0.02$, $-0.01$ and $0.005$. So

$$
\dot{\mathbf{q}} = (-0.015,\; 0.02,\; -0.01,\; 0.005)\,\mathrm{s^{-1}}.
$$

Check the norm is safe: $\mathbf{q}\cdot\dot{\mathbf{q}} = 0.5(-0.015 + 0.02 - 0.01 + 0.005) = 0.5 \times 0 = 0$ exactly, as skew-symmetry promised.

**DCM rate.** This quaternion's matrix is a clean shuffle of axes, $\mathbf{C} = \begin{bmatrix}0&1&0\\0&0&1\\1&0&0\end{bmatrix}$. Each row is a body axis in inertial components: body $x$ points along inertial $y$, body $y$ along inertial $z$, body $z$ along inertial $x$. Then

$$
\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C} = \begin{bmatrix}0 & 0.05 & 0.01\\ -0.05 & 0 & 0.02\\ -0.01 & -0.02 & 0\end{bmatrix}\begin{bmatrix}0&1&0\\0&0&1\\1&0&0\end{bmatrix} = \begin{bmatrix}0.01 & 0 & 0.05\\ 0.02 & -0.05 & 0\\ 0 & -0.01 & -0.02\end{bmatrix}\mathrm{s^{-1}}.
$$

Multiplying by this $\mathbf{C}$ on the right moves column 3 to the front and shifts the others along, which is why the answer is the first matrix with its columns rearranged.

**Euler rates.** Read the 3-2-1 angles off $\mathbf{C}$: $\theta = \arcsin(-C_{13}) = \arcsin 0 = 0^\circ$, $\phi = \mathrm{atan2}(C_{23}, C_{33}) = \mathrm{atan2}(1, 0) = 90^\circ$, and $\psi = \mathrm{atan2}(C_{12}, C_{11}) = \mathrm{atan2}(1, 0) = 90^\circ$. With $\theta = 0$ the $\tan\theta$ term drops out and $\cos\theta = 1$:

$$
\dot{\phi} = p = 0.02, \quad \dot{\theta} = q\cos 90^\circ - r\sin 90^\circ = -0.05, \quad \dot{\psi} = q\sin 90^\circ + r\cos 90^\circ = -0.01\,\mathrm{rad/s},
$$

which is $(1.15,\, -2.86,\, -0.57)\,^\circ/\mathrm{s}$.

**MRP rate.** $\boldsymbol{\sigma} = \mathbf{q}_v/(1 + q_0) = (0.5, 0.5, 0.5)/1.5 = (1/3, 1/3, 1/3)$. Its length is $0.577$, which is $\tan(120^\circ/4) = \tan 30^\circ$, as the definition promises, and safely below the shadow boundary of 1. Here $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 3 \times \tfrac{1}{9} = \tfrac{1}{3}$, so the bracket is $\tfrac{2}{3}\mathbf{I} + 2[\boldsymbol{\sigma}\times] + \tfrac{2}{9}\mathbf{J}$, with $\mathbf{J}$ the all-ones matrix. Adding those up and multiplying,

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\begin{bmatrix}8/9 & -4/9 & 8/9\\ 8/9 & 8/9 & -4/9\\ -4/9 & 8/9 & 8/9\end{bmatrix}\begin{bmatrix}0.02\\ -0.01\\ 0.05\end{bmatrix} = (0.01667,\, -0.00333,\, 0.00667)\,\mathrm{s^{-1}}.
$$

Four different-looking rates — 4, 9, 3 and 3 numbers — for one spacecraft turning at three degrees per second. Step any of them forward a second and convert, and you get the same attitude to integrator accuracy.
:::

::: example What gimbal lock costs a pitch program
A booster pitches at $q = 0.5^\circ/\mathrm{s}$, with $r = 0.1^\circ/\mathrm{s}$ of yaw rate, $p = 0.2^\circ/\mathrm{s}$ of roll rate and a roll angle $\phi = 30^\circ$. Its total body rate is $\sqrt{0.2^2 + 0.5^2 + 0.1^2} = 0.548^\circ/\mathrm{s}$ the whole time — a gentle motion.

Two of the Euler rates share the combination $q\sin\phi + r\cos\phi = 0.5(0.5) + 0.1(0.866) = 0.25 + 0.0866 = 0.3366^\circ/\mathrm{s}$. Divide it by $\cos\theta$ for $\dot{\psi}$; multiply it by $\tan\theta$ and add $p$ for $\dot{\phi}$. Track them as the pitch steepens:

| $\theta$ | $1/\cos\theta$ | $\dot{\psi}$ | $\dot{\phi}$ |
| --- | --- | --- | --- |
| $60^\circ$ | 2.00 | $0.673^\circ/\mathrm{s}$ | $0.783^\circ/\mathrm{s}$ |
| $85^\circ$ | 11.47 | $3.862^\circ/\mathrm{s}$ | $4.047^\circ/\mathrm{s}$ |
| $89^\circ$ | 57.30 | $19.287^\circ/\mathrm{s}$ | $19.484^\circ/\mathrm{s}$ |

At $89^\circ$, two Euler rates read nearly twenty degrees per second while the vehicle turns at half a degree per second. Their effects nearly cancel: the real motion sits in the difference $\dot{\phi} - \dot{\psi} = 19.484 - 19.287 = 0.197^\circ/\mathrm{s}$, close to $p$. But an integrator does not know that.

To keep the same relative accuracy on $\psi$, your step must shrink by the growth in $1/\cos\theta$. From $60^\circ$ to $89^\circ$ that is $57.30/2.00 = 28.6$, so a $10\,\mathrm{ms}$ step becomes $10/28.6 = 0.35\,\mathrm{ms}$. At $90^\circ$ no step is small enough. The quaternion running beside it notices nothing: its components stay near one in size, and its rate stays about $\lVert\boldsymbol{\omega}\rVert/2 = 0.0048\,\mathrm{rad/s}$.
:::

::: warning "Angular velocity" is not the derivative of anything
There is no three-number attitude whose rate of change is $\boldsymbol{\omega}$. Adding up $\int\boldsymbol{\omega}\,dt$ component by component gives a number with no geometric meaning, because finite rotations do not commute. Pitch $90^\circ$ then roll $90^\circ$ leaves a book lying differently from roll $90^\circ$ then pitch $90^\circ$ — try it — yet the two integrals are identical. Every equation in this lesson exists because that naive integral is wrong. The coning lesson at the end of the module measures how wrong.
:::

::: note Which one flies
A typical spacecraft attitude computer propagates the quaternion, converts it to a DCM once per cycle for sensor and actuator vector maths, sends Euler angles to the ground because people read them easily, and — if the control law is a nonlinear one — computes the error signal in MRPs. All four appear in the same 10 ms frame, each doing what it is best at. Knowing all four equations is the working vocabulary, not tidiness.
:::

## Check yourself

::: check
Show that $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$ follows from $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$, and say in words what the sign flip means.
:::

::: answer
$\mathbf{C}_{NB} = \mathbf{C}^\top$, so transpose the given equation. The transpose of a product reverses the order:

$$
\dot{\mathbf{C}}^\top = \bigl(-[\boldsymbol{\omega}\times]\mathbf{C}\bigr)^\top = \mathbf{C}^\top\bigl(-[\boldsymbol{\omega}\times]\bigr)^\top = \mathbf{C}^\top[\boldsymbol{\omega}\times],
$$

using $[\boldsymbol{\omega}\times]^\top = -[\boldsymbol{\omega}\times]$. So $\dot{\mathbf{C}}_{NB} = \mathbf{C}_{NB}[\boldsymbol{\omega}\times]$.

In words: the columns of $\mathbf{C}_{NB}$ are the body axes written in inertial components. The rotation carries each one around, so each obeys $\dot{\mathbf{b}}_k = \boldsymbol{\omega}\times\mathbf{b}_k$ with a plus sign. The rows of $\mathbf{C}$ are the same vectors. So the body-to-inertial form takes the plus and multiplies from the right; the inertial-to-body form takes the minus and multiplies from the left. Mixing them up gives a simulation that runs the rotation backwards while conserving everything you thought to check.
:::

::: check
A colleague proposes propagating attitude by integrating $\dot{\mathbf{C}} = -[\boldsymbol{\omega}\times]\mathbf{C}$ with the nine entries as independent states. How many redundant numbers is that, and what happens to the redundancy under a numerical integrator?
:::

::: answer
Nine states for three degrees of freedom is six redundant numbers. They are held in check by the six independent conditions in $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$: three "each column has unit length" and three "each pair of columns is perpendicular". (The matrix equation has nine entries, but it is symmetric, so only six are different.)

The exact solution keeps all six true, as the proof that $d(\mathbf{C}\mathbf{C}^\top)/dt = 0$ shows. A numerical integrator keeps them only to its own truncation error. The columns slowly lose unit length and stop being perpendicular. The matrix becomes a rotation mixed with a small stretch and shear — not a rotation at all — and every vector you transform with it picks up a systematic error.
:::

::: check
At $\theta = 89.9^\circ$ with $\phi = 30^\circ$, $p = 0.2^\circ/\mathrm{s}$, $q = 0.5^\circ/\mathrm{s}$, $r = 0.1^\circ/\mathrm{s}$, compute $\dot{\psi}$ and $\dot{\phi}$. Then compute $\dot{\phi} - \dot{\psi}$ and explain why that combination stays small.
:::

::: answer
The shared combination is $q\sin\phi + r\cos\phi = 0.5(0.5) + 0.1(0.8660) = 0.3366^\circ/\mathrm{s}$.

With $\cos 89.9^\circ = 0.0017453$: $\dot{\psi} = 0.3366/0.0017453 = 192.86^\circ/\mathrm{s}$.

With $\tan 89.9^\circ = 572.957$: $\dot{\phi} = 0.2 + 0.3366 \times 572.957 = 193.06^\circ/\mathrm{s}$.

The difference is $193.06 - 192.86 = 0.20^\circ/\mathrm{s}$ — equal to $p$. That is because $\tan\theta - 1/\cos\theta = (\sin\theta - 1)/\cos\theta$, which heads to zero as $\theta \to 90^\circ$ (the top shrinks faster than the bottom). Physically, at $\theta = 90^\circ$ the roll axis and yaw axis are the same line, so only the *total* turning about that line means anything. How it is split between $\phi$ and $\psi$ is arbitrary, and the equations handle that by sending both to infinity with a finite difference. Two huge numbers whose small difference is the real answer is also a recipe for **catastrophic cancellation** — losing most of your digits when you subtract — in floating point.
:::

::: check
A spacecraft has $\boldsymbol{\sigma} = (0.9, 0.3, 0.2)$. Should you switch to the shadow set? What rotation angle does it describe? Repeat for $(0.9, 0.5, 0.4)$.
:::

::: answer
$\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.81 + 0.09 + 0.04 = 0.94$, so $\lVert\boldsymbol{\sigma}\rVert = \sqrt{0.94} = 0.9695$. That is less than 1: no switch yet. The angle is $\Phi = 4\arctan(0.9695) = 4 \times 44.11^\circ = 176.4^\circ$, close to the half-turn where the boundary sits.

For $(0.9, 0.5, 0.4)$: $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} = 0.81 + 0.25 + 0.16 = 1.22$ and $\lVert\boldsymbol{\sigma}\rVert = 1.1045 > 1$, so you switch. Divide by $1.22$ and flip the sign: $\boldsymbol{\sigma}^S = (-0.738, -0.410, -0.328)$, with length $1/1.1045 = 0.9054$.

The original describes $\Phi = 4\arctan(1.1045) = 191.4^\circ$ about $\hat{\mathbf{e}}$. The shadow describes $4\arctan(0.9054) = 168.6^\circ$ about $-\hat{\mathbf{e}}$. Check: $191.4 + 168.6 = 360^\circ$. Same attitude, reached the short way round instead of the long way.
:::

::: check
Two engineers integrate the same gyro data. One propagates a quaternion and reports a norm of $1 - 4\times 10^{-9}$ after an hour. The other propagates Euler angles and reports no constraint violation at all. Which result is more trustworthy?
:::

::: answer
Neither number measures accuracy; they measure different things.

The quaternion norm shows how far the integrator has wandered off the constraint. That is a free **diagnostic** — a health check — that the Euler-angle run cannot offer, because it has no constraint to break. A clean norm does not prove the attitude is right: a quaternion can have length exactly one and point the wrong way. But a drifting norm does prove something is wrong.

The Euler-angle run has quietly built up the same kind of truncation error, plus whatever the $1/\cos\theta$ amplification added near steep pitch, and it gives you no way to see it. Prefer the representation with a free self-check. Then check accuracy separately, by running a case with a known exact answer or by comparing two step sizes.
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
| Gimbal lock | The $1/\cos\theta$ factor at $\theta = \pm 90^\circ$; a failure of the numbers, not the vehicle |
| $\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top]\boldsymbol{\omega}$ | MRP kinematics; shadow switch when $\lVert\boldsymbol{\sigma}\rVert > 1$ |
| Worked instant | $\mathbf{q} = (0.5,0.5,0.5,0.5)$, $\boldsymbol{\omega} = (0.02,-0.01,0.05)$ gives $\dot{\mathbf{q}} = (-0.015, 0.02, -0.01, 0.005)$ |

The next lesson hands these exact equations to a numerical integrator, which breaks every constraint they keep. You will measure how fast the DCM stops being a rotation, how fast the quaternion norm drifts, and what re-normalisation costs and buys.

::: context kinematics-word Motion without the push
"Kinematics" comes from the Greek *kinema*, "motion" — the same root as "cinema", the moving pictures. It describes *how* something moves without asking *why*. A dance described step by step is kinematics; the muscles that make the steps are dynamics. For attitude, the kinematic equation turns a spin rate into a change of orientation. It would be exactly the same for a gram-sized sensor or a 400-tonne space station, because mass never appears in it.
:::

::: context strapdown Strapped down, not floating
Early inertial systems, like the one on Apollo, kept their gyros on a platform held steady by motorised **gimbals** — nested rings — so the platform stayed fixed in space while the vehicle turned around it. A **strapdown** system bolts the gyros straight to the vehicle's frame. They then measure the vehicle's own turning in body axes, and the computer does the bookkeeping the gimbals used to do mechanically. That bookkeeping is the set of equations in this lesson. Almost every modern rocket, aircraft and phone uses strapdown sensors.
:::

::: context transport-theorem Why a fixed star seems to turn backwards
The transport theorem says how fast a vector seems to change when you watch it from a turning frame. For a star direction fixed in space, its true change is zero, so what you see is purely the effect of your own turning: $-\boldsymbol{\omega}\times\mathbf{v}$. Turn left, and the star sweeps right across your view.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="110" r="44" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="110" x2="110" y2="40" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="110" y1="110" x2="75" y2="49" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="75,49 76,62 86,56" fill="#1d6fd1"/>
  <text x="24" y="44" font-size="12" fill="#1d6fd1">body nose</text>
  <text x="116" y="36" font-size="12" fill="#6c7a93">nose before</text>
  <path d="M 130 70 A 46 46 0 0 0 95 67" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="110" y="162" font-size="12" text-anchor="middle" fill="#1f2a44">body turns left (ω)</text>
  <circle cx="300" cy="30" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="300" y="54" font-size="12" text-anchor="middle" fill="#1f2a44">star, fixed</text>
  <line x1="200" y1="100" x2="330" y2="100" stroke="#b4232c" stroke-width="2"/>
  <polygon points="340,100 328,94 328,106" fill="#b4232c"/>
  <text x="270" y="124" font-size="12" text-anchor="middle" fill="#b4232c">star seen from body</text>
  <text x="270" y="140" font-size="12" text-anchor="middle" fill="#b4232c">slides right: −ω × v</text>
</svg>
```
:::

::: context skew-symmetric A mirror that flips signs
A matrix is **symmetric** if it looks the same after flipping across its main diagonal (top-left to bottom-right). It is **skew-symmetric** if the flip turns every entry into its negative. That forces the diagonal to be zero, because only zero equals its own negative.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="15" text-anchor="middle" fill="#1f2a44">
    <text x="120" y="35">0</text><text x="180" y="35" fill="#b4232c">−ω₃</text><text x="240" y="35" fill="#1d6fd1">ω₂</text>
    <text x="120" y="75" fill="#b4232c">ω₃</text><text x="180" y="75">0</text><text x="240" y="75" fill="#6c7a93">−ω₁</text>
    <text x="120" y="115" fill="#1d6fd1">−ω₂</text><text x="180" y="115" fill="#6c7a93">ω₁</text><text x="240" y="115">0</text>
  </g>
  <line x1="100" y1="15" x2="260" y2="122" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="300" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">mirror line</text>
  <text x="40" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">[ω×]</text>
</svg>
```

Matching colours sit across the mirror from each other with opposite signs. Every "rate of turning" matrix in attitude work has this shape.
:::

::: context quadratic-form Always sideways
$\mathbf{q}^\top\dot{\mathbf{q}} = 0$ says the rate is perpendicular to the quaternion itself — like the ball on a string, always moving across the string, never along it. Moving perpendicular to the radius can change your direction but never your distance from the centre. That is why the exact quaternion flow stays at length one, whatever the spin rate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="95" r="65" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="150" cy="95" r="3" fill="#1f2a44"/>
  <line x1="150" y1="95" x2="196" y2="49" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="196" cy="49" r="5" fill="#1d6fd1"/>
  <line x1="196" y1="49" x2="242" y2="95" stroke="#b4232c" stroke-width="3"/>
  <polygon points="249,102 236,98 244,90" fill="#b4232c"/>
  <text x="160" y="62" font-size="13" fill="#1d6fd1">q</text>
  <text x="232" y="68" font-size="13" fill="#b4232c">q̇ ⟂ q</text>
  <text x="280" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">length stays 1</text>
</svg>
```
:::

::: context half-rate The 720-degree surprise
Because a quaternion stores half-angles, spinning a body a full $360^\circ$ only takes the quaternion from $\mathbf{q}$ to $-\mathbf{q}$. It takes $720^\circ$ to bring it back to exactly where it started. You can feel this with the "plate trick": hold a plate flat on your palm and turn it one full circle without dropping it — your arm ends up twisted. A second full turn in the same direction untwists it. The quaternion is keeping track of the arm.
:::

::: context gimbal-lock Apollo and the missing fourth gimbal
Apollo's guidance platform floated inside three gimbal rings, so its hardware had the same gimbal lock as the 3-2-1 equations. If the middle ring swung too far, the platform lost its reference and had to be realigned from star sightings. Crews watched a warning light as the angle approached the limit. During Apollo 11, Command Module Pilot Michael Collins joked to Mission Control that he would like a fourth gimbal for Christmas. Strapdown systems with quaternion software removed the problem: there are no rings to lock, and the quaternion has no singular attitude.
:::

::: context shadow-set Two roads to the same attitude
$\lVert\boldsymbol{\sigma}\rVert = \tan(\Phi/4)$ reaches $1$ at $\Phi = 180^\circ$ and runs off to infinity at $360^\circ$. The shadow set describes the same attitude as a turn of $360^\circ - \Phi$ the other way, and its length falls back towards zero. Switching at the crossing keeps you on the lower, safe curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="70" x2="330" y2="70" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="44" y="74" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="50" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">0°</text>
  <text x="190" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="330" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">360°</text>
  <text x="195" y="184" font-size="12" text-anchor="middle" fill="#1f2a44">rotation angle Φ</text>
  <polyline points="50.0,150.0 61.7,144.8 73.3,139.5 85.0,134.1 96.7,128.6 108.3,122.8 120.0,116.9 131.7,110.5 143.3,103.8 155.0,96.5 166.7,88.6 178.3,79.8 190.0,70.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="190.0,70.0 201.7,58.8 213.3,45.7 225.0,30.3" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="190.0,70.0 201.7,79.8 213.3,88.6 225.0,96.5 236.7,103.8 248.3,110.5 260.0,116.9 271.7,122.8 283.3,128.6 295.0,134.1 306.7,139.5 318.3,144.8 330.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="232" y="34" font-size="11" fill="#b4232c">σ without switch → ∞</text>
  <text x="262" y="100" font-size="11" fill="#1d6fd1">shadow σˢ</text>
  <text x="58" y="36" font-size="12" fill="#1f2a44">‖σ‖</text>
</svg>
```
:::
