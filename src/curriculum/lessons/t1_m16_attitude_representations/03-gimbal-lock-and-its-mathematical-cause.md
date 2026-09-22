---
id: l03-gimbal-lock-and-its-mathematical-cause
title: Gimbal lock and its mathematical cause
minutes: 19
covers:
  - gimbal lock and its mathematical cause
---

Gimbal lock began as a hardware problem. A stable platform hangs inside a nest of three gimbal rings, each free to turn about one axis, and the platform holds an inertial reference while the vehicle moves around it. When the middle ring swings to $90^\circ$, the inner and outer rings end up turning about the same physical line. The platform still has three bearings, but only two of them do anything, and a manoeuvre that needs motion about the lost direction drives the rings to slam round at enormous rates or tumble the platform outright. Apollo's inertial measurement unit hung its platform in three gimbals rather than four, to save mass; the crew display marked a caution region as the middle gimbal angle grew, and past roughly $85^\circ$ the platform was considered lost and had to be realigned against the stars.

The hardware is largely gone — strapdown sensors bolted to the structure replaced gimballed platforms decades ago — and the problem is not. It survived intact into software, because the mathematics of a three-gimbal nest is the mathematics of an Euler-angle sequence. A strapdown flight computer that stores attitude as yaw, pitch and roll has a virtual middle gimbal, and it locks at exactly the same place. There are no bearings to burn out, so the failure is quieter: the angles stay finite, the required angle rates spike, the integration loses accuracy, and the attitude estimate degrades in a way that looks like sensor noise.

This lesson takes the singularity apart three ways: geometrically, algebraically in the DCM, and through the kinematic matrix that maps body rates to Euler-angle rates. All three say the same thing, and knowing all three is what lets you recognise it in unfamiliar code.

## The geometry: two axes collapse onto one

Take the 3-2-1 sequence of lesson 02. The first turn is $\psi$ about the reference $z$ axis. The second is $\theta$ about the once-rotated $y$ axis. The third is $\phi$ about the twice-rotated $x$ axis, which is the body's own longitudinal axis.

Ask where that third axis points when $\theta = 90^\circ$. The pitch turn has swung the body $x$ axis from the horizontal plane to straight up — antiparallel to the reference $z$ axis if the reference frame has $z$ down, parallel if $z$ is up. Either way, the roll axis is now collinear with the yaw axis. Rolling and yawing do the same thing to the vehicle, differing only in sign, and one of the three parameters has stopped contributing.

Nothing has happened to the vehicle. It can still rotate about any axis whatever; nose-up is not a special attitude for a spacecraft or a fighter. What has failed is the coordinate system placed on top of it.

## The algebra: the DCM collapses to one parameter

Put $\theta = 90^\circ$ into the explicit 3-2-1 matrix of lesson 02, so $c\theta = 0$ and $s\theta = 1$:

$$
\mathbf{C}_{B\leftarrow N}\big|_{\theta = 90^\circ} =
\begin{bmatrix}
0 & 0 & -1\\
\sin(\phi-\psi) & \cos(\phi-\psi) & 0\\
\cos(\phi-\psi) & -\sin(\phi-\psi) & 0
\end{bmatrix},
$$

using $s\phi\,c\psi - c\phi\,s\psi = \sin(\phi-\psi)$ and $s\phi\,s\psi + c\phi\,c\psi = \cos(\phi-\psi)$ on the second row, and the matching identities on the third. The matrix depends on $\psi$ and $\phi$ only through their difference. Check it numerically: $(\psi,\phi) = (10^\circ, 40^\circ)$, $(30^\circ, 60^\circ)$, $(0^\circ, 30^\circ)$ and $(100^\circ, 130^\circ)$ all produce

$$
\begin{bmatrix} 0 & 0 & -1\\ 0.500000 & 0.866025 & 0\\ 0.866025 & -0.500000 & 0\end{bmatrix},
$$

because all four have $\phi - \psi = 30^\circ$. At $\theta = -90^\circ$ the same collapse happens with the *sum*: the matrix depends only on $\phi + \psi$, and $(10^\circ, 40^\circ)$ and $(30^\circ, 20^\circ)$ both give the matrix with $\sin 50^\circ$ and $\cos 50^\circ$ in it.

This is the precise statement of what is lost. The map from three angles to $SO(3)$ has a two-dimensional image in a neighbourhood of $\theta = \pm 90^\circ$ instead of a three-dimensional one; its Jacobian drops rank. A whole one-parameter family of angle triples, $(\psi + \delta,\ 90^\circ,\ \phi + \delta)$ for any $\delta$, names one attitude. Inverting that map is impossible, and any extraction routine has to make an arbitrary choice — conventionally setting $\psi = 0$ and putting everything into $\phi$.

::: key What gimbal lock is
In a 3-2-1 sequence, $\theta = \pm 90^\circ$ aligns the roll axis with the yaw axis. The DCM then depends only on $\phi\mp\psi$, so one degree of freedom of the parametrisation is lost: infinitely many angle triples give the identical attitude, and the inverse map does not exist. The vehicle is unaffected; the coordinates have failed. For a general asymmetric sequence the singularity sits at a middle angle of $\pm 90^\circ$; for a symmetric sequence it sits at $0^\circ$ and $180^\circ$.
:::

## The kinematics: a factor of $1/\cos\theta$

The sharpest form of the problem is in the differential relation between body rates and Euler-angle rates, because that is what a propagator integrates.

The total angular velocity of the body is the sum of the three gimbal rates, each about its own axis. Resolve each in body components. The roll rate $\dot\phi$ is already about the body $x$ axis. The pitch rate $\dot\theta$ is about the $F_2$-frame $y$ axis, which reaches body components through $\mathbf{R}_1(\phi)$. The yaw rate $\dot\psi$ is about the $N$-frame $z$ axis, two turns back, so it needs $\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)$:

$$
\boldsymbol{\omega}^{B}
= \dot\psi\,\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\begin{bmatrix}0\\0\\1\end{bmatrix}
+ \dot\theta\,\mathbf{R}_1(\phi)\begin{bmatrix}0\\1\\0\end{bmatrix}
+ \dot\phi\begin{bmatrix}1\\0\\0\end{bmatrix}
= \mathbf{S}\begin{bmatrix}\dot\psi\\ \dot\theta\\ \dot\phi\end{bmatrix},
$$

$$
\mathbf{S} =
\begin{bmatrix}
-\sin\theta & 0 & 1\\
\sin\phi\cos\theta & \cos\phi & 0\\
\cos\phi\cos\theta & -\sin\phi & 0
\end{bmatrix}.
$$

Expanding $\det\mathbf{S}$ along its third column, the only non-zero entry is the $1$ in position $(1,3)$, whose cofactor is $+\det\begin{bmatrix}\sin\phi\cos\theta & \cos\phi\\ \cos\phi\cos\theta & -\sin\phi\end{bmatrix} = -\cos\theta(\sin^2\phi + \cos^2\phi) = -\cos\theta$. So

$$
\det\mathbf{S} = -\cos\theta ,
$$

which vanishes at $\theta = \pm 90^\circ$. The three gimbal axes become linearly dependent there — the algebraic statement of "two rings turning about the same line".

Inverting $\mathbf{S}$ gives the matrix a propagator actually uses:

$$
\begin{bmatrix}\dot\psi\\ \dot\theta\\ \dot\phi\end{bmatrix}
= \mathbf{B}\,\boldsymbol{\omega}^{B},
\qquad
\mathbf{B} = \frac{1}{\cos\theta}
\begin{bmatrix}
0 & \sin\phi & \cos\phi\\
0 & \cos\phi\cos\theta & -\sin\phi\cos\theta\\
\cos\theta & \sin\phi\sin\theta & \cos\phi\sin\theta
\end{bmatrix},
\qquad \det\mathbf{B} = -\frac{1}{\cos\theta}.
$$

Written out row by row: $\dot\psi = (\sin\phi\,q + \cos\phi\,r)/\cos\theta$, $\dot\theta = \cos\phi\,q - \sin\phi\,r$, and $\dot\phi = p + \tan\theta(\sin\phi\,q + \cos\phi\,r)$, with $(p,q,r)$ the body rates. The pitch rate is well behaved everywhere. The yaw and roll rates carry $1/\cos\theta$ and $\tan\theta$, and both diverge at $\theta = \pm 90^\circ$ — while the body rates that drive them stay perfectly ordinary.

::: key The Euler kinematic matrix and its singularity
For a 3-2-1 sequence, $\boldsymbol{\omega}^B = \mathbf{S}[\dot\psi,\dot\theta,\dot\phi]^\top$ with $\det\mathbf{S} = -\cos\theta$, and its inverse $\mathbf{B}$ carries an overall $1/\cos\theta$ with $\det\mathbf{B} = -1/\cos\theta$. The gimbal-lock singularity is the vanishing of $\cos\theta$: the required angle rates go to infinity for a finite body rate, and the condition number of $\mathbf{B}$ grows as $2/\cos\theta$.
:::

::: example How fast the conditioning goes
Evaluate $\mathbf{B}$ at $\phi = 0$ and take its 2-norm condition number. It is exactly $1$ at $\theta = 0$, and for large pitch it approaches $2/\cos\theta$:

| $\theta$ | $0^\circ$ | $30^\circ$ | $60^\circ$ | $80^\circ$ | $85^\circ$ | $89^\circ$ | $89.9^\circ$ | $89.99^\circ$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\operatorname{cond}_2\mathbf{B}$ | $1.00$ | $1.73$ | $3.73$ | $11.43$ | $22.90$ | $114.59$ | $1145.92$ | $11459.16$ |
| $2/\cos\theta$ | $2.00$ | $2.31$ | $4.00$ | $11.52$ | $22.95$ | $114.60$ | $1145.92$ | $11459.16$ |

A condition number of $10^{4}$ means double precision, with about $16$ significant digits, is down to $12$ useful ones in this operation — survivable. The real damage is not round-off but the size of the numbers. Hold the body rate at $\lvert\boldsymbol{\omega}\rvert = 0.707^\circ/\mathrm{s}$ with $q = r = 0.5^\circ/\mathrm{s}$, $p = 0$, $\phi = 0$, and ask what angle rates that demands:

| $\theta$ | $0^\circ$ | $60^\circ$ | $80^\circ$ | $89^\circ$ | $89.9^\circ$ | $89.99^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| $\dot\psi$ ($^\circ/\mathrm{s}$) | $0.500$ | $1.000$ | $2.879$ | $28.649$ | $286.479$ | $2864.789$ |
| $\dot\theta$ ($^\circ/\mathrm{s}$) | $0.500$ | $0.500$ | $0.500$ | $0.500$ | $0.500$ | $0.500$ |
| $\dot\phi$ ($^\circ/\mathrm{s}$) | $0.000$ | $0.866$ | $2.836$ | $28.645$ | $286.479$ | $2864.789$ |

At $\theta = 89.99^\circ$ the vehicle is turning at seven tenths of a degree per second and the yaw and roll angles are both required to change at nearly $2865^\circ/\mathrm{s}$ — eight revolutions per second, in equal and opposite amounts that cancel in the attitude. That cancellation is exactly what a finite-step integrator gets wrong.
:::

::: example Propagating the same manoeuvre two ways
A spacecraft rotates at a constant $1^\circ/\mathrm{s}$ about a body axis tilted $\delta$ away from the pitch axis, starting level. Because the rotation axis is fixed in the body and the motion is a pure constant-rate turn, the exact attitude is available in closed form as a quaternion, which gives a truth to compare against. The pitch angle climbs, peaks at $90^\circ - \delta$, and comes back down.

Propagate the same motion for $120\,\mathrm{s}$ two ways at a $10\,\mathrm{Hz}$ step, $\Delta t = 0.1\,\mathrm{s}$, with the same fourth-order Runge–Kutta integrator: once through $\dot{\boldsymbol{\alpha}} = \mathbf{B}\boldsymbol{\omega}^{B}$ on the three Euler angles, once through the quaternion kinematics of a later lesson. Worst attitude error over the run, in degrees:

| $\delta$ | peak pitch | peak $\lvert\dot{\boldsymbol{\alpha}}\rvert$ | Euler-angle RK4 | quaternion RK4 |
| --- | --- | --- | --- | --- |
| $1^\circ$ | $89.0^\circ$ | $81\ ^\circ/\mathrm{s}$ | $2.09\times 10^{-6}$ | $2.09\times 10^{-6}$ |
| $0.1^\circ$ | $89.9^\circ$ | $810\ ^\circ/\mathrm{s}$ | $7.26\times 10^{-4}$ | $1.71\times 10^{-6}$ |
| $0.01^\circ$ | $89.99^\circ$ | $8103\ ^\circ/\mathrm{s}$ | $1.45\times 10^{-1}$ | $1.71\times 10^{-6}$ |

At a $1^\circ$ miss distance the two are indistinguishable. At $0.1^\circ$ the Euler-angle propagation is $425$ times worse. At $0.01^\circ$ it is off by a seventh of a degree — a large pointing error for a spacecraft — while the quaternion propagation has not moved from its floor of $1.7\times 10^{-6}$ degrees. Note also that the $10\,\mathrm{Hz}$ samples of the last case never recorded more than $3103^\circ/\mathrm{s}$ of the $8103^\circ/\mathrm{s}$ peak: the loop cannot even see the spike it is failing to integrate.

The quaternion propagation does not care because its kinematic equation, $\dot{q} = \tfrac12 q\otimes[0,\boldsymbol{\omega}^B]$, is linear in $q$ with bounded coefficients everywhere on the sphere. There is no $1/\cos\theta$ anywhere in it, and no attitude at which its coefficient matrix loses rank.
:::

::: warning "We limit pitch to $85^\circ$" is a mission constraint, not a fix
Bounding the middle angle keeps the conditioning finite, and for an airliner or a launch vehicle on a nominal ascent that is a reasonable engineering choice. It is not a fix. It removes attitudes the vehicle may need — a vertical landing burn, a nadir-to-inertial slew, an attitude-recovery manoeuvre from an unknown tumble — and it fails exactly when things are already going wrong. At $85^\circ$ the conditioning is already $23$ and the angle rates are already amplified twelvefold.
:::

::: warning Every three-parameter representation is singular somewhere
Switching sequences moves the singularity; it does not remove it. A 3-1-3 set is singular at $0^\circ$ and $180^\circ$ of its middle angle, which is why classical orbital elements degenerate for an equatorial orbit rather than for a polar one. Some flight software carries two sequences and switches between them when the active one approaches its bad region, which works and costs a discontinuity in the state at every switch. The deeper reason no three parameters can work everywhere is topological and is the subject of lesson 13.
:::

::: note Where the singularity is for other sequences
For any asymmetric sequence the middle angle is the one that matters and the singular values are $\pm 90^\circ$. For any symmetric sequence the singular values are $0^\circ$ and $180^\circ$, where the first and third axes coincide directly. That is why symmetric sets are preferred when the interesting motion is a large tilt away from a reference axis — a spinning spacecraft's nutation, or an orbit's inclination — and asymmetric sets are preferred when the vehicle spends its life near level.
:::

## Check yourself

::: check
At $\theta = 90^\circ$ in a 3-2-1 sequence, the triples $(\psi, \theta, \phi) = (20^\circ, 90^\circ, 50^\circ)$ and $(-35^\circ, 90^\circ, -5^\circ)$ are given. Are they the same attitude?
:::

::: answer
At $\theta = 90^\circ$ the DCM depends only on $\phi - \psi$. The first triple has $\phi - \psi = 50^\circ - 20^\circ = 30^\circ$; the second has $-5^\circ - (-35^\circ) = 30^\circ$. Same difference, so the same attitude, and the matrix is the one with $\sin 30^\circ = 0.500$ and $\cos 30^\circ = 0.866$ in the lower block. Any extraction routine handed that matrix must invent a split between $\psi$ and $\phi$; the usual convention is $\psi = 0$, $\phi = 30^\circ$.
:::

::: check
A spacecraft holds a steady body rate of $2^\circ/\mathrm{s}$ with $p = 0$, $q = 0$, $r = 2^\circ/\mathrm{s}$ and $\phi = 0$. What yaw rate does the Euler-angle propagator demand at $\theta = 88^\circ$, and what fraction of a $50\,\mathrm{Hz}$ control step does that consume?
:::

::: answer
$\dot\psi = (\sin\phi\,q + \cos\phi\,r)/\cos\theta = r/\cos 88^\circ = 2/0.034899 = 57.3^\circ/\mathrm{s}$. In one step of a $50\,\mathrm{Hz}$ loop, $\Delta t = 0.02\,\mathrm{s}$, the yaw angle changes by $1.15^\circ$ while the vehicle itself turns $0.04^\circ$. The roll angle changes by $\tan 88^\circ\times 2\times 0.02 = 1.15^\circ$ the other way. Almost all of the integrator's work is spent tracking two large angle changes that cancel, which is where the accuracy goes.
:::

::: check
Derive $\det\mathbf{S} = -\cos\theta$ and explain what it means physically that this is a determinant rather than, say, a norm.
:::

::: answer
$\mathbf{S}$ has a single non-zero entry in its third column, the $1$ in row $1$, so expanding along that column gives $\det\mathbf{S} = (+1)\det\begin{bmatrix}\sin\phi\cos\theta & \cos\phi\\ \cos\phi\cos\theta & -\sin\phi\end{bmatrix} = -\sin^2\phi\cos\theta - \cos^2\phi\cos\theta = -\cos\theta$. The columns of $\mathbf{S}$ are the three gimbal axes written in body components, so the determinant is the signed volume they span. A determinant of zero means the three axes are coplanar — they no longer span three dimensions, so some body rotation cannot be produced by any combination of gimbal rates. A norm would tell you how large the axes are, which is never the problem; only their linear independence matters.
:::

::: check
Why does a pure pitch manoeuvre, $p = r = 0$, pass through $\theta = 90^\circ$ without any numerical trouble, even though $\mathbf{B}$ is singular there?
:::

::: answer
The singular factor multiplies the combination $\sin\phi\,q + \cos\phi\,r$. With $r = 0$ and $\phi = 0$ that combination is zero, so $\dot\psi = 0/\cos\theta$ and $\dot\phi = 0\times\tan\theta$: the divergent factor is multiplied by an exactly vanishing numerator. Only $\dot\theta = q$ survives, and the angles march through $90^\circ$ smoothly. The singularity is in the *inverse* of a rank-deficient map, so it bites only when the commanded motion has a component along the direction the gimbals cannot produce. In floating point the numerator is not exactly zero, so a real pure-pitch manoeuvre through $90^\circ$ produces a burst of angle-rate noise of order $\varepsilon/\cos\theta$ rather than a clean pass.
:::

::: check
A team proposes to detect gimbal lock by watching for $\lvert\theta\rvert > 89^\circ$ and freezing the attitude update until it comes back. What goes wrong?
:::

::: answer
Two things. First, the detection is late: the conditioning is already $115$ at $89^\circ$ and the angle rates already amplified $57$-fold, so the accuracy loss has happened before the trigger fires. Second, freezing the update means the estimate stops tracking a vehicle that is still rotating, so the error grows at the full body rate — at $1^\circ/\mathrm{s}$, one degree per second of open-loop drift — and when the trigger releases, the filter must reconverge from a large error, often while the vehicle is in the attitude that caused the problem. The defensible responses are to carry the attitude in a representation without the singularity and derive angles only for display, or to switch to a second Euler sequence whose singularity is elsewhere and accept a bookkeeping discontinuity.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Geometric cause | At $\theta = \pm 90^\circ$ the 3-2-1 roll axis is collinear with the yaw axis |
| Algebraic cause | The DCM depends only on $\phi-\psi$ at $\theta = 90^\circ$, only on $\phi+\psi$ at $-90^\circ$ |
| $\boldsymbol{\omega}^B = \mathbf{S}[\dot\psi,\dot\theta,\dot\phi]^\top$ | Columns of $\mathbf{S}$ are the gimbal axes in body components |
| $\det\mathbf{S} = -\cos\theta$ | Gimbal axes become coplanar at $\theta = \pm 90^\circ$ |
| $\mathbf{B} = \mathbf{S}^{-1}$, $\det\mathbf{B} = -1/\cos\theta$ | Euler rates from body rates; $\operatorname{cond}_2\mathbf{B}\to 2/\cos\theta$ |
| $\dot\psi = (\sin\phi\,q + \cos\phi\,r)/\cos\theta$ | Diverges; $\dot\theta = \cos\phi\,q - \sin\phi\,r$ never does |
| $\dot\phi = p + \tan\theta(\sin\phi\,q + \cos\phi\,r)$ | Diverges equal and opposite to $\dot\psi$ |
| Worked figure | $0.707^\circ/\mathrm{s}$ body rate needs $2865^\circ/\mathrm{s}$ of yaw and roll at $\theta = 89.99^\circ$ |
| Worked figure | RK4 at $10\,\mathrm{Hz}$: $0.145^\circ$ Euler-angle error through $89.99^\circ$, $1.7\times 10^{-6}$ degrees for the quaternion |
| Other sequences | Asymmetric singular at middle angle $\pm 90^\circ$; symmetric at $0^\circ$ and $180^\circ$ |

The singularity is a property of using three parameters, not of using these three. The next lesson goes back to the DCM and asks what the minimum honest description of a rotation is — one axis and one angle — which is where both quaternions and Rodrigues parameters come from.
