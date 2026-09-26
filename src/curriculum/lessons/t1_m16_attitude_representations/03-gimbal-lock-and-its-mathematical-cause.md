---
id: l03-gimbal-lock-and-its-mathematical-cause
title: Gimbal lock and its mathematical cause
minutes: 19
covers:
  - gimbal lock and its mathematical cause
---

Stand facing north and point your arm at the horizon. Two numbers describe where it points: a compass heading (north) and an elevation ($0^\circ$). Now raise your arm slowly until it points straight up. What is its heading now? There isn't one. Turn your whole body to face east and your arm still points straight up — the heading changed by $90^\circ$ and the arm did not move. Twist your arm about its own length and your hand turns, exactly as it would if you had turned your body. Straight up, "turn your body" and "twist your arm" have become the same motion. One of your three ways to turn has quietly disappeared.

That is **gimbal lock**. It began as a hardware problem. A stable platform for navigation sensors hangs inside a nest of three **[[gimbal|gimbal-rings]]** rings, each free to turn about one axis, so the platform can hold still in space while the vehicle turns around it. When the middle ring swings to $90^\circ$, the inner and outer rings end up turning about the same line. The platform still has three bearings, but only two of them do anything. A maneuver that needs motion about the lost direction makes the rings whip around at huge rates, or tumbles the platform. [[Apollo's|apollo-imu]] guidance platform hung in three gimbals rather than four to save weight and complexity, and the crew had to steer clear of the lock.

The hardware is mostly gone. **[[Strapdown|strapdown]]** sensors, bolted straight to the structure, replaced gimballed platforms decades ago. The problem is not gone. It moved into software, because the mathematics of a three-gimbal nest is the mathematics of an Euler-angle sequence. A flight computer that stores attitude as yaw, pitch and roll has a virtual middle gimbal, and it locks at exactly the same place. There are no bearings to burn out, so the failure is quieter: the angles stay finite, the angle *rates* spike, the integration loses accuracy, and the attitude estimate degrades in a way that looks like sensor noise.

This lesson takes the lock apart three ways: in the geometry, in the DCM, and in the matrix that turns body spin rates into Euler-angle rates. All three say the same thing. Knowing all three is what lets you recognize it in unfamiliar code.

## The geometry: two axes collapse onto one

Take the 3-2-1 sequence of lesson 02. The first turn is the yaw $\psi$ about the reference $z$ axis. The second is the pitch $\theta$ about the once-turned $y$ axis. The third is the roll $\phi$ about the twice-turned $x$ axis, which is the body's own nose line.

Ask where that third axis points when $\theta = 90^\circ$. The pitch turn has swung the nose from the horizontal to straight up. With a north-east-down reference, straight up is exactly opposite the reference $z$ axis (which points down). With a $z$-up reference it would be along it. Either way, the roll axis now lies on the same line as the yaw axis. Rolling and yawing do the same thing to the vehicle, differing only in sign — your arm and your body in the opening. One of the three angles has stopped contributing anything of its own.

Nothing has happened to the vehicle. It can still turn about any axis it likes; nose-up is not a special attitude for a spacecraft or a fighter jet. What has failed is the set of coordinates laid on top of it.

## The algebra: the DCM collapses to one parameter

Put $\theta = 90^\circ$ into the 3-2-1 matrix of lesson 02. Then $c\theta = \cos 90^\circ = 0$ and $s\theta = \sin 90^\circ = 1$, and every entry with a $c\theta$ in it vanishes:

$$
\mathbf{C}_{B\leftarrow N}\big|_{\theta = 90^\circ} =
\begin{bmatrix}
0 & 0 & -1\\
\sin(\phi-\psi) & \cos(\phi-\psi) & 0\\
\cos(\phi-\psi) & -\sin(\phi-\psi) & 0
\end{bmatrix}.
$$

The remaining entries tidy up with the difference formulas from trigonometry. On the second row, $s\phi\,c\psi - c\phi\,s\psi = \sin(\phi-\psi)$ and $s\phi\,s\psi + c\phi\,c\psi = \cos(\phi-\psi)$. The third row uses the same two identities. Look at what is left: $\psi$ and $\phi$ appear only as the difference $\phi - \psi$.

Check it with numbers. The pairs $(\psi,\phi) = (10^\circ, 40^\circ)$, $(30^\circ, 60^\circ)$, $(0^\circ, 30^\circ)$ and $(100^\circ, 130^\circ)$ all produce

$$
\begin{bmatrix} 0 & 0 & -1\\ 0.500000 & 0.866025 & 0\\ 0.866025 & -0.500000 & 0\end{bmatrix},
$$

because all four have $\phi - \psi = 30^\circ$. At $\theta = -90^\circ$ the same collapse happens with the *sum*: the matrix depends only on $\phi + \psi$. For instance $(10^\circ, 40^\circ)$ and $(30^\circ, 20^\circ)$ both give the matrix with $\sin 50^\circ$ and $\cos 50^\circ$ in it.

This is the precise statement of what is lost. Near $\theta = \pm 90^\circ$ the map from three angles to $SO(3)$ can only reach two dimensions' worth of attitudes instead of three. In the language of calculus, its **[[Jacobian drops rank|jacobian-rank]]**. A whole family of angle triples, $(\psi + \delta,\ 90^\circ,\ \phi + \delta)$ for any $\delta$, names one single attitude. So there is no way to go backward from the matrix to unique angles. Any extraction routine must make an arbitrary choice, and the usual one is to set $\psi = 0$ and put everything into $\phi$.

::: key What gimbal lock is
In a 3-2-1 sequence, $\theta = \pm 90^\circ$ lines the roll axis up with the yaw axis — the yaw and roll axes become parallel — so one degree of freedom of the parametrization is lost. The DCM then depends only on $\phi\mp\psi$: infinitely many angle triples give the identical attitude, and the inverse map does not exist. The vehicle is unaffected; the coordinates have failed. For a general asymmetric sequence the singularity sits at a middle angle of $\pm 90^\circ$; for a symmetric sequence it sits at $0^\circ$ and $180^\circ$.
:::

## The kinematics: a factor of $1/\cos\theta$

The sharpest form of the problem is in the link between the body's spin and the rate of change of the angles, because that link is what a flight computer integrates.

Think of a gyro strapped to the vehicle. It measures the body's spin rate $\boldsymbol{\omega}^B = (p, q, r)$ — the spin about the body's $x$, $y$ and $z$ axes, in radians per second. The flight computer wants $\dot\psi$, $\dot\theta$ and $\dot\phi$ ("psi dot" and so on: how fast each angle is changing), so it can step the angles forward in time.

### From angle rates to body rate

Go the easy direction first. The body's total spin is the sum of three spins, one per gimbal, each about its own axis:

- the roll rate $\dot\phi$ is about the body $x$ axis, which in body components is $(1, 0, 0)$;
- the pitch rate $\dot\theta$ is about the $y$ axis of the in-between frame $F_2$, which reaches body components through one turn, $\mathbf{R}_1(\phi)$;
- the yaw rate $\dot\psi$ is about the reference $z$ axis, two turns back, so it needs $\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)$.

Add them up:

$$
\boldsymbol{\omega}^{B}
= \dot\psi\,\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\begin{bmatrix}0\\0\\1\end{bmatrix}
+ \dot\theta\,\mathbf{R}_1(\phi)\begin{bmatrix}0\\1\\0\end{bmatrix}
+ \dot\phi\begin{bmatrix}1\\0\\0\end{bmatrix}
= \mathbf{S}\begin{bmatrix}\dot\psi\\ \dot\theta\\ \dot\phi\end{bmatrix}.
$$

Work out the two turned axes. $\mathbf{R}_2(\theta)$ takes $(0,0,1)$ to $(-\sin\theta, 0, \cos\theta)$ — its third column. Then $\mathbf{R}_1(\phi)$ takes that to $(-\sin\theta,\ \sin\phi\cos\theta,\ \cos\phi\cos\theta)$. And $\mathbf{R}_1(\phi)$ takes $(0,1,0)$ to $(0, \cos\phi, -\sin\phi)$ — its second column. Those three axes, side by side, are the columns of $\mathbf{S}$:

$$
\mathbf{S} =
\begin{bmatrix}
-\sin\theta & 0 & 1\\
\sin\phi\cos\theta & \cos\phi & 0\\
\cos\phi\cos\theta & -\sin\phi & 0
\end{bmatrix}.
$$

### When the gimbal axes flatten

The columns of $\mathbf{S}$ are the three gimbal axes written in body components. Its **determinant** is the volume of the box those three arrows outline. Expand it along the third column, which has only one nonzero entry, the $1$ in row 1. Its **[[cofactor|cofactor]]** is the $2\times 2$ determinant left after crossing out row 1 and column 3:

$$
\det\mathbf{S} = (+1)\det\begin{bmatrix}\sin\phi\cos\theta & \cos\phi\\ \cos\phi\cos\theta & -\sin\phi\end{bmatrix}
= -\sin^2\phi\cos\theta - \cos^2\phi\cos\theta = -\cos\theta ,
$$

using $\sin^2\phi + \cos^2\phi = 1$ in the last step. So

$$
\det\mathbf{S} = -\cos\theta ,
$$

which is zero at $\theta = \pm 90^\circ$. The box has flattened: the three gimbal axes [[lie in one plane|flat-axes]]. That is the algebra's way of saying "two rings turning about the same line".

### From body rate to angle rates

The flight computer needs the opposite direction: angle rates from the measured body rate. That means undoing $\mathbf{S}$ — multiplying by its inverse, which we call $\mathbf{B}$:

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

(You can check it: multiply $\mathbf{S}\mathbf{B}$ and you get $\mathbf{I}_3$. The determinant of an inverse is one over the original determinant.) Written out row by row, with $(p, q, r)$ the body rates:

$$
\dot\psi = \frac{\sin\phi\,q + \cos\phi\,r}{\cos\theta}, \qquad
\dot\theta = \cos\phi\,q - \sin\phi\,r, \qquad
\dot\phi = p + \tan\theta\,(\sin\phi\,q + \cos\phi\,r).
$$

The pitch rate is well behaved everywhere. The yaw and roll rates carry $1/\cos\theta$ and $\tan\theta$, and as $\theta \to \pm 90^\circ$ both blow up — while the body rates feeding them stay perfectly ordinary. Near $\theta = +90^\circ$ they blow up by the same amount with the *same* sign, so that the difference $\phi - \psi$, the only thing the attitude depends on there, changes sensibly.

::: key The Euler kinematic matrix and its singularity
For a 3-2-1 sequence, $\boldsymbol{\omega}^B = \mathbf{S}[\dot\psi,\dot\theta,\dot\phi]^\top$ with $\det\mathbf{S} = -\cos\theta$, and its inverse $\mathbf{B}$ carries an overall $1/\cos\theta$ factor with $\det\mathbf{B} = -1/\cos\theta$. The gimbal-lock singularity is the vanishing of $\cos\theta$: the kinematic matrix becomes singular, the required angle rates go to infinity for a finite body rate, and the condition number of $\mathbf{B}$ grows as $2/\cos\theta$.
:::

::: example How fast the conditioning goes
The **[[condition number|condition-number]]** of a matrix measures how much it can magnify small errors in its input. A value of $1$ is perfect. Evaluate $\mathbf{B}$ at $\phi = 0$ and take its 2-norm condition number. It is exactly $1$ at $\theta = 0$, and for large pitch it approaches $2/\cos\theta$:

| $\theta$ | $0^\circ$ | $30^\circ$ | $60^\circ$ | $80^\circ$ | $85^\circ$ | $89^\circ$ | $89.9^\circ$ | $89.99^\circ$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\operatorname{cond}_2\mathbf{B}$ | $1.00$ | $1.73$ | $3.73$ | $11.43$ | $22.90$ | $114.59$ | $1145.92$ | $11459.16$ |
| $2/\cos\theta$ | $2.00$ | $2.31$ | $4.00$ | $11.52$ | $22.95$ | $114.60$ | $1145.92$ | $11459.16$ |

**Reading the table.** A condition number of $10^{4}$ costs about four of the roughly $16$ significant digits a computer carries, leaving $12$. That alone is survivable.

**The real damage is the size of the numbers.** Hold the body rate fixed at $q = r = 0.5^\circ/\mathrm{s}$, $p = 0$, with $\phi = 0$. The vehicle turns at $\sqrt{0.5^2 + 0.5^2} = 0.707^\circ/\mathrm{s}$ throughout. Put the numbers in the three rate formulas: with $\phi = 0$, $\dot\psi = r/\cos\theta$, $\dot\theta = q$ and $\dot\phi = r\tan\theta$.

| $\theta$ | $0^\circ$ | $60^\circ$ | $80^\circ$ | $89^\circ$ | $89.9^\circ$ | $89.99^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| $\dot\psi$ ($^\circ/\mathrm{s}$) | $0.500$ | $1.000$ | $2.879$ | $28.649$ | $286.479$ | $2864.789$ |
| $\dot\theta$ ($^\circ/\mathrm{s}$) | $0.500$ | $0.500$ | $0.500$ | $0.500$ | $0.500$ | $0.500$ |
| $\dot\phi$ ($^\circ/\mathrm{s}$) | $0.000$ | $0.866$ | $2.836$ | $28.645$ | $286.479$ | $2864.789$ |

**Sanity check** at $60^\circ$: $0.5/\cos 60^\circ = 0.5/0.5 = 1.000$ and $0.5\tan 60^\circ = 0.5\times 1.732 = 0.866$. Both match the table.

At $\theta = 89.99^\circ$ the vehicle is turning at seven tenths of a degree per second, yet the yaw and roll angles must each change at nearly $2865^\circ/\mathrm{s}$ — eight turns per second — in the same direction, so that they cancel in $\phi - \psi$. Getting that cancellation right is exactly what a step-by-step integrator fails at.
:::

::: example Propagating the same maneuver two ways
**The setup.** A spacecraft spins at a steady $1^\circ/\mathrm{s}$ about a body axis tipped a small angle $\delta$ ("delta") away from the pitch axis, starting level. Because the spin axis is fixed and the rate is constant, the exact attitude is known in closed form, which gives a truth to compare against. The pitch angle climbs, peaks at $90^\circ - \delta$, and comes back down — so $\delta$ is how close the path comes to the lock.

**The test.** Propagate the same motion for $120\,\mathrm{s}$ at $10$ steps per second ($\Delta t = 0.1\,\mathrm{s}$), with the same fourth-order **[[Runge–Kutta|rk4]]** integrator, two ways: once through $\dot{\boldsymbol{\alpha}} = \mathbf{B}\boldsymbol{\omega}^{B}$ on the three Euler angles $\boldsymbol{\alpha} = (\psi, \theta, \phi)$, and once through the quaternion equation of the next module. Here is the worst attitude error over each run, in degrees:

| $\delta$ | peak pitch | peak $\lvert\dot{\boldsymbol{\alpha}}\rvert$ | Euler-angle RK4 | quaternion RK4 |
| --- | --- | --- | --- | --- |
| $1^\circ$ | $89.0^\circ$ | $81\ ^\circ/\mathrm{s}$ | $4.49\times 10^{-7}$ | $5.1\times 10^{-13}$ |
| $0.1^\circ$ | $89.9^\circ$ | $810\ ^\circ/\mathrm{s}$ | $7.26\times 10^{-4}$ | $3.4\times 10^{-13}$ |
| $0.01^\circ$ | $89.99^\circ$ | $8103\ ^\circ/\mathrm{s}$ | $1.45\times 10^{-1}$ | $3.7\times 10^{-13}$ |

**Reading it.** The quaternion column sits at about $10^{-13}$ degrees in every row — that is round-off, the best a computer can do. The Euler column gets worse fast. At $\delta = 1^\circ$ its error is already nearly a million times the quaternion's, though still tiny. Coming ten times closer to the lock makes it about $1600$ times worse. Ten times closer again, and it is off by a seventh of a degree, a large pointing error for a spacecraft. And the $10$-per-second samples in the last run never saw more than $3103^\circ/\mathrm{s}$ of the $8103^\circ/\mathrm{s}$ peak: the loop cannot even see the spike it is failing to follow.

**Why the quaternion does not care.** Its equation, $\dot{q} = \tfrac12 q\otimes[0,\boldsymbol{\omega}^B]$, is linear in $q$ with bounded coefficients everywhere. There is no $1/\cos\theta$ anywhere in it, and no attitude at which it loses rank. You will meet it properly in module 17.

**A measurement trap.** To score errors this small you must not compute the angle as $\arccos$ of the trace formula. [[Arccos cannot resolve|arccos-floor]] angles below about $10^{-6}$ degrees, and a test built that way would report a fake "floor" of around $2\times 10^{-6}$ degrees for both methods. The numbers above use a formula based on atan2 instead.
:::

::: warning "We limit pitch to $85^\circ$" is a mission constraint, not a fix
Keeping the middle angle away from $90^\circ$ keeps the conditioning finite. For an airliner, or a launch vehicle on a normal ascent, that is a reasonable engineering choice. It is not a fix. It rules out attitudes the vehicle may need — a vertical landing burn, a slew from pointing at Earth to pointing at a star, a recovery from an unknown tumble — and it fails exactly when things are already going wrong. At $85^\circ$ the conditioning is already $23$, and the yaw and roll rates are already more than eleven times the body rate ($1/\cos 85^\circ = 11.5$).
:::

::: warning Every three-parameter representation is singular somewhere
Switching to a different Euler sequence moves the singularity; it does not remove it. A 3-1-3 set is singular at $0^\circ$ and $180^\circ$ of its middle angle. That is why classical orbital elements break down for an orbit lying in the equator rather than for one passing over the poles. Some flight software carries two sequences and switches between them when the active one nears its bad region. That works, but it makes the state jump at every switch. The deeper reason no three numbers can work everywhere is the shape of $SO(3)$, the subject of lesson 13.
:::

::: note Where the singularity is for other sequences
For any asymmetric sequence the middle angle is the one that matters, and the singular values are $\pm 90^\circ$. For any symmetric sequence they are $0^\circ$ and $180^\circ$, where the first and third axes coincide directly. That is why symmetric sets are preferred when the interesting motion is a large tilt away from a reference axis — the wobble of a spinning spacecraft, or an orbit's inclination — and asymmetric sets are preferred when the vehicle spends its life near level.
:::

## Check yourself

::: check
At $\theta = 90^\circ$ in a 3-2-1 sequence, you are given the triples $(\psi, \theta, \phi) = (20^\circ, 90^\circ, 50^\circ)$ and $(-35^\circ, 90^\circ, -5^\circ)$. Are they the same attitude?
:::

::: answer
At $\theta = 90^\circ$ the DCM depends only on $\phi - \psi$. The first triple has $\phi - \psi = 50^\circ - 20^\circ = 30^\circ$. The second has $-5^\circ - (-35^\circ) = -5^\circ + 35^\circ = 30^\circ$. Same difference, so the same attitude. The matrix is the one with $\sin 30^\circ = 0.500$ and $\cos 30^\circ = 0.866$ in the lower block. Any extraction routine handed that matrix must invent a split between $\psi$ and $\phi$; the usual choice is $\psi = 0$, $\phi = 30^\circ$.
:::

::: check
A spacecraft holds a steady body rate with $p = 0$, $q = 0$, $r = 2^\circ/\mathrm{s}$ and $\phi = 0$. What yaw rate does the Euler-angle propagator demand at $\theta = 88^\circ$, and how does one step of a $50\,\mathrm{Hz}$ loop compare with the vehicle's actual motion?
:::

::: answer
**Yaw rate.** $\dot\psi = (\sin\phi\,q + \cos\phi\,r)/\cos\theta$. With $\phi = 0$ and $q = 0$ this is $r/\cos 88^\circ = 2/0.034899 = 57.3^\circ/\mathrm{s}$.

**One step.** A $50\,\mathrm{Hz}$ loop has $\Delta t = 1/50 = 0.02\,\mathrm{s}$. In one step the yaw angle changes by $57.3\times 0.02 = 1.15^\circ$, while the vehicle itself turns only $2\times 0.02 = 0.04^\circ$.

**Roll.** $\dot\phi = \tan 88^\circ\times 2 = 28.6\times 2 = 57.3^\circ/\mathrm{s}$, so the roll angle also changes by $1.15^\circ$ per step, in the same direction. Near $90^\circ$ the attitude depends on $\phi - \psi$, so the two big changes almost cancel. Nearly all the integrator's effort goes into tracking two large angle changes that cancel, and that is where the accuracy goes.
:::

::: check
Derive $\det\mathbf{S} = -\cos\theta$, and explain what it means physically that this is a determinant rather than, say, a length.
:::

::: answer
The third column of $\mathbf{S}$ has one nonzero entry, the $1$ in row 1. Expanding along that column: $\det\mathbf{S} = (+1)\det\begin{bmatrix}\sin\phi\cos\theta & \cos\phi\\ \cos\phi\cos\theta & -\sin\phi\end{bmatrix} = -\sin^2\phi\cos\theta - \cos^2\phi\cos\theta = -\cos\theta$, using $\sin^2\phi + \cos^2\phi = 1$.

The columns of $\mathbf{S}$ are the three gimbal axes in body components, so the determinant is the signed volume of the box they outline. Zero volume means the three axes lie in one plane. They no longer point in three independent directions, so some body rotation cannot be produced by any combination of gimbal rates. A length would tell you how long the axes are, which is never the problem — they are always unit length. Only whether they point in independent directions matters.
:::

::: check
Why does a pure pitch maneuver, with $p = r = 0$ and $\phi = 0$, pass through $\theta = 90^\circ$ with no numerical trouble in exact arithmetic, even though $\mathbf{B}$ is singular there?
:::

::: answer
The dangerous factor multiplies the combination $\sin\phi\,q + \cos\phi\,r$. With $r = 0$ and $\phi = 0$ that combination is $0\cdot q + 1\cdot 0 = 0$. So $\dot\psi = 0/\cos\theta$ and $\dot\phi = 0 + \tan\theta\times 0$: the exploding factor is always multiplied by an exact zero. Only $\dot\theta = q$ survives, and $\theta$ marches smoothly through $90^\circ$.

The singularity lives in *undoing* a map that has lost a direction, so it only bites when the commanded motion has a part along the direction the gimbals cannot produce. In real computer arithmetic, which rounds every result, that numerator is not exactly zero. A real pure-pitch maneuver through $90^\circ$ therefore gives a burst of angle-rate noise of size about (round-off)$/\cos\theta$ rather than a clean pass.
:::

::: check
A team proposes to detect gimbal lock by watching for $\lvert\theta\rvert > 89^\circ$ and freezing the attitude update until $\theta$ comes back. What goes wrong?
:::

::: answer
Two things.

First, the detection is late. At $89^\circ$ the condition number is already $115$ and the angle rates are already magnified $57$-fold ($1/\cos 89^\circ = 57.3$). The accuracy has been lost before the alarm goes off.

Second, freezing the update means the estimate stops following a vehicle that is still turning. The error then grows at the full body rate — at $1^\circ/\mathrm{s}$, one degree of drift every second. When the freeze lifts, the filter must recover from a large error, often while the vehicle is still in the attitude that caused the problem.

The sound choices are to carry the attitude in a representation with no singularity, such as a quaternion, and compute Euler angles only for display — or to switch to a second Euler sequence whose singularity is somewhere else, and accept the jump in bookkeeping at each switch.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Geometric cause | At $\theta = \pm 90^\circ$ the 3-2-1 roll axis lies along the yaw axis |
| Algebraic cause | The DCM depends only on $\phi-\psi$ at $\theta = 90^\circ$, only on $\phi+\psi$ at $-90^\circ$ |
| $\boldsymbol{\omega}^B = \mathbf{S}[\dot\psi,\dot\theta,\dot\phi]^\top$ | Columns of $\mathbf{S}$ are the gimbal axes in body components |
| $\det\mathbf{S} = -\cos\theta$ | Gimbal axes lie in one plane at $\theta = \pm 90^\circ$ |
| $\mathbf{B} = \mathbf{S}^{-1}$, $\det\mathbf{B} = -1/\cos\theta$ | Euler rates from body rates; $\operatorname{cond}_2\mathbf{B}\to 2/\cos\theta$ |
| $\dot\psi = (\sin\phi\,q + \cos\phi\,r)/\cos\theta$ | Blows up at $\theta = \pm 90^\circ$ |
| $\dot\theta = \cos\phi\,q - \sin\phi\,r$ | Never blows up |
| $\dot\phi = p + \tan\theta(\sin\phi\,q + \cos\phi\,r)$ | Blows up together with $\dot\psi$; near $+90^\circ$ the two cancel in $\phi - \psi$ |
| Worked figure | $0.707^\circ/\mathrm{s}$ body rate needs $2865^\circ/\mathrm{s}$ of yaw and roll at $\theta = 89.99^\circ$ |
| Worked figure | RK4 at $10\,\mathrm{Hz}$ through $89.99^\circ$: $0.145^\circ$ Euler-angle error, about $4\times 10^{-13}$ degrees for the quaternion |
| Other sequences | Asymmetric: singular at middle angle $\pm 90^\circ$; symmetric: at $0^\circ$ and $180^\circ$ |

The singularity comes from using three numbers, not from using these particular three. The next lesson goes back to the DCM and asks for the smallest honest description of a rotation — one axis and one angle — which is where both quaternions and Rodrigues parameters come from.

::: context gimbal-rings Rings inside rings
A gimbal is a ring on a pair of pivots, free to turn about one axis. The word comes from old words for "twin", after the paired rings used to keep a ship's compass level while the ship rolled. Nest three gimbals, each axis at right angles to the one outside it, and the platform in the middle can stay still while the vehicle turns every which way around it. Turn the middle ring $90^\circ$ and the inner ring's axis swings into line with the outer ring's axis — two rings, one motion.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="8" x2="110" y2="192" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="110" cy="100" r="80" fill="none" stroke="#1f2a44" stroke-width="6"/>
  <rect x="104" y="14" width="12" height="10" fill="#b4232c"/>
  <rect x="104" y="176" width="12" height="10" fill="#b4232c"/>
  <line x1="22" y1="100" x2="198" y2="100" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="110" cy="100" r="56" fill="none" stroke="#6c7a93" stroke-width="6"/>
  <rect x="48" y="94" width="10" height="12" fill="#1d6fd1"/>
  <rect x="162" y="94" width="10" height="12" fill="#1d6fd1"/>
  <rect x="86" y="76" width="48" height="48" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="110" cy="100" r="7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="110" cy="100" r="2.5" fill="#1f2a44"/>
  <text x="215" y="40" font-size="12" fill="#b4232c">outer ring: yaw</text>
  <text x="215" y="56" font-size="11" fill="#b4232c">(up–down axis)</text>
  <text x="215" y="92" font-size="12" fill="#1d6fd1">middle ring: pitch</text>
  <text x="215" y="108" font-size="11" fill="#1d6fd1">(left–right axis)</text>
  <text x="215" y="144" font-size="12" fill="#1f2a44">inner platform: roll</text>
  <text x="215" y="160" font-size="11" fill="#1f2a44">(axis out of the page)</text>
</svg>
```
:::

::: context apollo-imu Apollo and the fourth gimbal
The Apollo spacecraft steered by a gyro-stabilized platform in three gimbals. A fourth gimbal would have made lock impossible, but it cost weight and complexity, so the designers accepted three and told the crews to stay away from the bad attitude. The cockpit display showed the danger zone; a warning came on as the middle gimbal passed about $70^\circ$, and near $85^\circ$ the platform was considered lost and had to be realigned by sighting stars. During Apollo 11, Michael Collins joked to Mission Control about wanting a fourth gimbal for Christmas.
:::

::: context strapdown Strapdown sensors
In a strapdown system the gyros and accelerometers are bolted — strapped down — directly to the vehicle, and turn with it. There are no rings. Instead the flight computer keeps track of the attitude mathematically, updating it hundreds of times a second from the measured spin rates. This became practical once computers were fast enough, and it is now used on almost every rocket, airliner, drone and phone. It is also why gimbal lock moved from the hardware into the software.
:::

::: context jacobian-rank What "drops rank" means
The Jacobian of a map is the table of how much each output moves when you nudge each input a little. Here the inputs are the three angles and the output is the attitude. Normally, nudging each angle moves the attitude in a different direction, so three nudges reach all three directions: the rank is $3$. At $\theta = 90^\circ$, nudging $\psi$ and nudging $\phi$ move the attitude along the same direction (with opposite signs). Only two independent directions are left, so the rank has dropped to $2$.
:::

::: context cofactor Expanding a determinant
To find a $3\times 3$ determinant, pick any row or column. For each entry in it, cross out that entry's row and column, take the determinant of the $2\times 2$ grid that is left, and multiply by the entry and by a sign that follows a checkerboard pattern starting with $+$ in the top-left. Add the results. Choosing a column that is mostly zeros saves work: in $\mathbf{S}$ the third column has one nonzero entry, so the whole determinant is one $2\times 2$ determinant. For a $2\times 2$ grid, $\det\begin{bmatrix}a & b\\ c & d\end{bmatrix} = ad - bc$.
:::

::: context flat-axes The three axes, before and at the lock
On the left, at $\theta = 0$, the yaw, pitch and roll axes point in three independent directions and outline a real box. On the right, at $\theta = 90^\circ$ with a north-east-down reference, the roll axis (the nose) points straight up, exactly opposite the yaw axis, which points down. All three arrows now lie in one flat plane: the box has zero volume.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">θ = 0: det S = −1</text>
  <g stroke-width="2.5">
    <line x1="90" y1="100" x2="90" y2="165" stroke="#b4232c"/>
    <line x1="90" y1="100" x2="160" y2="100" stroke="#1d6fd1"/>
    <line x1="90" y1="100" x2="45" y2="60" stroke="#1f2a44"/>
  </g>
  <polygon points="90,173 84,161 96,161" fill="#b4232c"/>
  <polygon points="168,100 156,94 156,106" fill="#1d6fd1"/>
  <polygon points="39.0,54.7 52.0,58.2 44.0,67.1" fill="#1f2a44"/>
  <text x="98" y="178" font-size="11" fill="#b4232c">yaw (down)</text>
  <text x="130" y="92" font-size="11" fill="#1d6fd1">pitch</text>
  <text x="20" y="50" font-size="11" fill="#1f2a44">roll (nose)</text>
  <line x1="180" y1="25" x2="180" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">θ = 90°: det S = 0</text>
  <g stroke-width="2.5">
    <line x1="270" y1="100" x2="270" y2="165" stroke="#b4232c"/>
    <line x1="270" y1="100" x2="340" y2="100" stroke="#1d6fd1"/>
    <line x1="270" y1="100" x2="270" y2="40" stroke="#1f2a44"/>
  </g>
  <polygon points="270,173 264,161 276,161" fill="#b4232c"/>
  <polygon points="348,100 336,94 336,106" fill="#1d6fd1"/>
  <polygon points="270,32 264,44 276,44" fill="#1f2a44"/>
  <text x="278" y="178" font-size="11" fill="#b4232c">yaw (down)</text>
  <text x="310" y="92" font-size="11" fill="#1d6fd1">pitch</text>
  <text x="278" y="44" font-size="11" fill="#1f2a44">roll (nose, up)</text>
  <text x="270" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">all in one plane</text>
</svg>
```
:::

::: context condition-number Condition number in plain words
Solving with a matrix is like reading through a lens. A condition number of $1$ is clear glass: a small error in what goes in gives the same small error in what comes out. A condition number of $1000$ is a strong magnifier: an input error can come out up to $1000$ times bigger. As a rule of thumb, a condition number of $10^k$ costs about $k$ of your significant digits. At $\theta = 90^\circ$ exactly, $\mathbf{B}$'s condition number is infinite: the lens has no focus at all.
:::

::: context rk4 The Runge–Kutta method
An integrator steps a quantity forward in time from its rate of change. The simplest, forward Euler, looks at the rate once at the start of the step. The fourth-order Runge–Kutta method, RK4, looks four times — at the start, twice in the middle, and at the end — and takes a weighted average. Its error shrinks like the step size to the fourth power, so halving the step cuts the error about sixteen times. It is the workhorse integrator of simulation — but it assumes the rate changes smoothly across a step, and near gimbal lock it does not.
:::

::: context arccos-floor Why arccos is blind to small angles
The trace formula gives $\cos\Phi$, and near $\Phi = 0$ the cosine curve is almost flat: $\cos\Phi \approx 1 - \Phi^2/2$. A computer stores numbers near $1$ with gaps of about $2\times 10^{-16}$. So any angle smaller than about $10^{-8}$ radians has a cosine that rounds to exactly $1$, and arccos returns $0$ — or jumps to the next step, about $1.5\times 10^{-8}$ radians. That is roughly $10^{-6}$ degrees, the fake floor. Formulas built on atan2 of a sine and a cosine do not have this problem.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="20" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <text x="24" y="34" font-size="11" fill="#6c7a93">cos = 1</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,173.8 35.0,166.9 40.0,159.9 45.0,153.0 50.0,146.2 55.0,139.4 60.0,132.7 65.0,126.1 70.0,119.7 75.0,113.4 80.0,107.2 85.0,101.2 90.0,95.4 95.0,89.9 100.0,84.5 105.0,79.4 110.0,74.6 115.0,70.0 120.0,65.7 125.0,61.7 130.0,58.1 135.0,54.7 140.0,51.7 145.0,49.0 150.0,46.6 155.0,44.6 160.0,42.9 165.0,41.7 170.0,40.7 175.0,40.2 180.0,40.0 185.0,40.2 190.0,40.7 195.0,41.7 200.0,42.9 205.0,44.6 210.0,46.6 215.0,49.0 220.0,51.7 225.0,54.7 230.0,58.1 235.0,61.7 240.0,65.7 245.0,70.0 250.0,74.6 255.0,79.4 260.0,84.5 265.0,89.9 270.0,95.4 275.0,101.2 280.0,107.2 285.0,113.4 290.0,119.7 295.0,126.1 300.0,132.7 305.0,139.4 310.0,146.2 315.0,153.0 320.0,159.9 325.0,166.9 330.0,173.8"/>
  <ellipse cx="180" cy="40" rx="28" ry="9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="215" y="30" font-size="12" fill="#b4232c">flat top: tiny angles all</text>
  <text x="215" y="16" font-size="12" fill="#b4232c">look like cos = 1</text>
  <text x="184" y="185" font-size="11" fill="#1f2a44">Φ = 0</text>
</svg>
```
:::
