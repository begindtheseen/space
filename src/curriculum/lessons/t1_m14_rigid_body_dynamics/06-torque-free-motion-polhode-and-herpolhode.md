---
id: l06-torque-free-motion-polhode-and-herpolhode
title: Torque-free motion, the polhode and the herpolhode
minutes: 19
covers:
  - torque-free motion, polhode and herpolhode
---

Set the torque to zero in Euler's equations and ask what a rigid body does when left alone. A spacecraft between manoeuvres, a spent upper stage, a tumbling piece of debris, a spin-stabilised probe coasting to Mars — all are close to this case, and the answer is richer than "it keeps spinning". Unless the body happens to rotate about a principal axis, its angular velocity vector moves continuously through the body, and the body's attitude wobbles in a way that is regular but not a simple rotation.

The two conservation laws you met in lesson 5, constant kinetic energy and constant angular momentum, do most of the work here without integrating anything. Each confines the body-frame angular velocity to a surface — an ellipsoid and a sphere — and the motion must lie on their intersection. That curve is the **polhode**, and its shape tells you at a glance which spins are stable, which is the content of the next lesson. The same construction, viewed from inertial space, produces the **herpolhode** and Poinsot's picture of the inertia ellipsoid rolling on a fixed plane. For an axisymmetric body the whole motion can be solved in closed form, and that solution is the basis of everything the module says about spinning spacecraft.

## Two integrals of the motion

With $\mathbf{M} = 0$, Euler's equations in principal axes are

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,\omega_2\omega_3, \qquad
I_2\dot{\omega}_2 = (I_3 - I_1)\,\omega_3\omega_1, \qquad
I_3\dot{\omega}_3 = (I_1 - I_2)\,\omega_1\omega_2 .
$$

Lesson 5 showed that two scalar quantities are constant along any solution. The rotational kinetic energy,

$$
2T = I_1\omega_1^2 + I_2\omega_2^2 + I_3\omega_3^2 ,
$$

and the squared magnitude of the angular momentum,

$$
H^2 = I_1^2\omega_1^2 + I_2^2\omega_2^2 + I_3^2\omega_3^2 .
$$

Both are fixed by the initial conditions. Now read each as an equation for the point $(\omega_1, \omega_2, \omega_3)$ in the body frame. The first is an ellipsoid centred on the origin with semi-axes $\sqrt{2T/I_k}$ along the principal axes — the **energy ellipsoid**, a scaled copy of the inertia ellipsoid from lesson 3. The second is also an ellipsoid, the **momentum ellipsoid**, with semi-axes $H/I_k$. The angular velocity must lie on both at every instant, so it moves along their intersection curve. That curve is the polhode.

It is cleaner to work with the body components of $\mathbf{H}$ instead of $\boldsymbol{\omega}$, because then the second surface is a sphere. With $H_k = I_k\omega_k$,

$$
H_1^2 + H_2^2 + H_3^2 = H^2, \qquad
\frac{H_1^2}{I_1} + \frac{H_2^2}{I_2} + \frac{H_3^2}{I_3} = 2T .
$$

The first is the **momentum sphere** of radius $H$. The second is an ellipsoid with semi-axes $\sqrt{2TI_k}$. The body-frame angular momentum vector, which has constant length but changing direction as seen from the body, traces the intersection of a sphere and an ellipsoid. Since the two are the same shape scaled for every torque-free motion, the pictures below are drawn in this $\mathbf{H}$-space.

## The shape of the polhode

Order the moments $I_1 < I_2 < I_3$, so axis 1 is minor, 2 intermediate, 3 major. The ellipsoid's semi-axes are then $\sqrt{2TI_1} < \sqrt{2TI_2} < \sqrt{2TI_3}$. For the intersection with the sphere of radius $H$ to exist at all, the radius must fall between the smallest and largest semi-axis:

$$
2TI_1 \le H^2 \le 2TI_3 .
$$

The two equalities are the pure spins: $H^2 = 2TI_3$ means $\mathbf{H}$ lies along the major axis and the polhode degenerates to a point at the pole; $H^2 = 2TI_1$ is a pure minor-axis spin, a point at the other pole. In between, the position of $H^2$ relative to the middle value $2TI_2$ decides the topology of the curve.

- **$2TI_2 < H^2 < 2TI_3$:** the sphere is larger than the ellipsoid's two smaller semi-axes and smaller than its largest. The intersection is a pair of small closed curves encircling the major axis, one at each pole. $\mathbf{H}$ — and $\boldsymbol{\omega}$ with it — circulates around the major axis and never strays far. These are the *major-axis* polhodes.
- **$2TI_1 < H^2 < 2TI_2$:** by the same reasoning the intersection is a pair of closed curves encircling the *minor* axis. These are the *minor-axis* polhodes.
- **$H^2 = 2TI_2$:** the boundary case. Subtract $I_2$ times the energy equation from the sphere equation: $H_1^2(1 - I_2/I_1) + H_3^2(1 - I_2/I_3) = 0$, which with $I_1 < I_2 < I_3$ is $H_3^2(I_3 - I_2)/I_3 = H_1^2(I_2 - I_1)/I_1$, the equation of two planes through the intermediate axis. The intersection is two great ellipses crossing at the intermediate-axis poles. This curve is the **separatrix**; it divides the sphere into the four regions the closed polhodes occupy.

The picture on the momentum sphere is therefore: two families of closed loops, one nested around the major-axis pole and one around the minor-axis pole, separated by a figure-of-eight pair of curves that cross exactly at the intermediate-axis poles. Near the major and minor poles the loops are small: a body spinning almost about either axis has $\mathbf{H}$ wander only slightly through the body, which is stability. The intermediate poles are where the separatrix crosses itself. Start $\mathbf{H}$ exactly there and it stays, but start it a hair away and it lies on a polhode that runs along the separatrix, far around the sphere, to the neighbourhood of the *opposite* intermediate pole and back. That is the tumble of the next lesson, read off a drawing.

::: key The polhode
For torque-free motion the body components of $\mathbf{H}$ lie on the intersection of the momentum sphere $\lVert\mathbf{H}\rVert^2 = H^2$ and the energy ellipsoid $\sum_k H_k^2/I_k = 2T$. The intersection — the polhode — is a small closed curve around the major axis when $2TI_2 < H^2 < 2TI_3$, around the minor axis when $2TI_1 < H^2 < 2TI_2$, and the self-crossing separatrix through the intermediate axis when $H^2 = 2TI_2$.
:::

::: example Which polhode is the bus on?
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ starts at $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$, the case simulated in lesson 5. Lesson 4 found $H = 201.4\,\mathrm{N\,m\,s}$ and $T = 10.24\,\mathrm{J}$, so $H^2 = 40{,}576$ and the three comparison values are

$$
2TI_1 = 24{,}576, \qquad 2TI_2 = 30{,}720, \qquad 2TI_3 = 40{,}960
\quad(\mathrm{N^2\,m^2\,s^2}).
$$

$H^2$ lies between $2TI_2$ and $2TI_3$, so the polhode is a small loop around the major axis $z$, as the simulation showed: $\omega_3$ stayed within $0.0993$ to $0.100\,\mathrm{rad/s}$ while $\omega_1$ and $\omega_2$ oscillated with amplitudes $0.020$ and $0.0226\,\mathrm{rad/s}$. Those amplitudes come straight from the two conservation laws. At the point of the loop where $\omega_2 = 0$, the equations $1200\omega_1^2 + 2000\omega_3^2 = 20.48$ and $1200^2\omega_1^2 + 2000^2\omega_3^2 = 40{,}576$ return the starting values; at the point where $\omega_1 = 0$ they give $\omega_2^2 = 5.12\times 10^{-4}$, that is $\omega_2 = 0.0226\,\mathrm{rad/s}$, and $\omega_3 = 0.0993\,\mathrm{rad/s}$. Compare $H^2 = 40{,}576$ with $2TI_3 = 40{,}960$: the ratio is $0.991$, and the closer it is to one, the tighter the loop. A body released with $H^2 = 30{,}720$ instead would be on the separatrix and would tumble.
:::

## Poinsot's construction and the herpolhode

The polhode is a body-frame picture. Louis Poinsot gave an inertial one in 1834 that needs no equations beyond the two integrals. Return to the energy ellipsoid in $\boldsymbol{\omega}$-space, $\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = 2T$, and think of it as rigidly attached to the body, since $\mathbf{I}$ is fixed in body axes. The angular velocity vector always ends on this surface. The gradient of the quadratic form at $\boldsymbol{\omega}$ is $2\mathbf{I}\boldsymbol{\omega} = 2\mathbf{H}$, so the tangent plane to the ellipsoid at the tip of $\boldsymbol{\omega}$ is perpendicular to $\mathbf{H}$. Its distance from the centre is the projection of $\boldsymbol{\omega}$ onto the unit vector along $\mathbf{H}$:

$$
d = \frac{\boldsymbol{\omega}\cdot\mathbf{H}}{H} = \frac{2T}{H} .
$$

Both $T$ and $H$ are constant, and $\mathbf{H}$ is fixed in inertial space. So the tangent plane is a fixed plane in inertial space, perpendicular to $\mathbf{H}$ at a fixed distance from the centre of mass. It is the **invariable plane**. The body-fixed energy ellipsoid touches it at the tip of $\boldsymbol{\omega}$ at every instant, and because the point of contact lies on the instantaneous axis of rotation, its velocity is zero: the ellipsoid *rolls without slipping* on the invariable plane.

Two curves are traced by the point of contact. On the ellipsoid, fixed in the body, it traces the polhode — the same curve as before, now in $\boldsymbol{\omega}$-space. On the invariable plane, fixed in space, it traces the **herpolhode**. The polhode is always closed; the herpolhode generally is not, because the ellipsoid rolls with a period that is in general incommensurate with the time to go once around the polhode, and it wanders between two concentric circles on the plane. For an axisymmetric body the two curves are both circles and the picture reduces to two cones rolling on each other, which is the next section.

The construction repays a moment's thought about what is fixed and what moves. Fixed in space: $\mathbf{H}$, the invariable plane, and the herpolhode drawn on it. Fixed in the body: the ellipsoid and the polhode drawn on it. Moving: $\boldsymbol{\omega}$, which is the one vector that lies at the contact point, tangent to both curves, and which is therefore neither fixed in space nor fixed in the body. This is the precise sense in which a torque-free body "wobbles": its axis of rotation moves relative to both the stars and the structure.

For the bus example, $d = 2\times 10.24/201.4 = 0.1017\,\mathrm{rad/s}$, while $\lVert\boldsymbol{\omega}\rVert$ ranges from $0.1018$ to $0.1020\,\mathrm{rad/s}$; the tip of $\boldsymbol{\omega}$ sits between $0.0056$ and $0.0079\,\mathrm{rad/s}$ from the foot of $\mathbf{H}$ on the plane, so the herpolhode is a narrow annulus and the invariable plane is very nearly perpendicular to the spin.

## The axisymmetric body solved

For a body with two equal principal moments — the cylinder of lesson 2, a spinning upper stage, a spin-stabilised probe — Euler's torque-free equations solve in elementary functions. Take the symmetry axis as 3, with axial moment $I_3$ and transverse moment $I_t = I_1 = I_2$. The third equation becomes $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = 0$: the spin component along the symmetry axis is exactly constant, $\omega_3 = n$. The first two become linear with constant coefficients,

$$
\dot{\omega}_1 = -\frac{I_3 - I_t}{I_t}\,n\,\omega_2 = -\lambda\,\omega_2, \qquad
\dot{\omega}_2 = \frac{I_3 - I_t}{I_t}\,n\,\omega_1 = \lambda\,\omega_1,
\qquad
\lambda \equiv n\,\frac{I_3 - I_t}{I_t} .
$$

Differentiate the first and substitute the second: $\ddot{\omega}_1 = -\lambda^2\omega_1$. With $\omega_1(0) = \omega_t$ and $\omega_2(0) = 0$,

$$
\omega_1 = \omega_t\cos\lambda t, \qquad \omega_2 = \omega_t\sin\lambda t, \qquad \omega_3 = n .
$$

The transverse angular velocity has constant magnitude $\omega_t$ and rotates about the symmetry axis at the rate $\lambda$: the tip of $\boldsymbol{\omega}$ moves on a circle, and $\boldsymbol{\omega}$ itself sweeps out a cone of half-angle $\gamma$, with $\tan\gamma = \omega_t/n$, around the body axis. This is the **body cone**, and the polhode of an axisymmetric body is its circular base. The rate $\lambda$ is the body-frame **precession rate** of $\boldsymbol{\omega}$ (and of $\mathbf{H}$, which rotates with it in the body). Its sign is the sign of $I_3 - I_t$: for an **oblate** body ($I_3 > I_t$) the transverse rate advances in the same sense as the spin; for a **prolate** body ($I_3 < I_t$) it goes the other way, and the precession is called retrograde. A sphere-like body, $I_3 = I_t$, has $\lambda = 0$ and no wobble at all.

::: key Body-frame precession of an axisymmetric body
For $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$ and torque-free motion, $\omega_3 = n$ is constant and the transverse rate rotates about the symmetry axis at $\lambda = n\,(I_3 - I_t)/I_t$. Oblate bodies ($I_3 > I_t$) and prolate bodies ($I_3 < I_t$) precess in opposite senses; the angular velocity sweeps a body cone of half-angle $\gamma = \arctan(\omega_t/n)$.
:::

The inertial picture has $\mathbf{H}$ fixed. The angle $\theta$ between the symmetry axis and $\mathbf{H}$ is constant, since $\tan\theta = I_t\omega_t/(I_3 n)$ and every quantity in it is constant; it is the **nutation angle**. The symmetry axis, $\boldsymbol{\omega}$ and $\mathbf{H}$ are coplanar (all have transverse parts in the same direction), and that plane turns about $\mathbf{H}$ at a rate lesson 9 derives as $H/I_t$. So $\boldsymbol{\omega}$ also sweeps a cone about $\mathbf{H}$ — the **space cone**, of half-angle $\beta = |\theta - \gamma|$ — and the body cone rolls on it without slipping, touching along $\boldsymbol{\omega}$. For an oblate body $\theta < \gamma$, the space cone sits inside the body cone, and the body cone rolls around the outside of it; for a prolate body $\theta > \gamma$, the two cones touch externally. Where the general body has an ellipsoid rolling on a plane, the axisymmetric body has a cone rolling on a cone.

::: example A prolate upper stage
Model a spin-stabilised upper stage as a uniform solid cylinder of mass $2000\,\mathrm{kg}$, radius $1.0\,\mathrm{m}$ and length $3.0\,\mathrm{m}$. From the table in lesson 2, $I_3 = \tfrac{1}{2}mR^2 = 1000\,\mathrm{kg\,m^2}$ and $I_t = \tfrac{1}{12}m(3R^2 + L^2) = \tfrac{2000}{12}(3 + 9) = 2000\,\mathrm{kg\,m^2}$. It is prolate, $I_3 < I_t$, with the long axis as its minor axis. It spins at $60\,\mathrm{rpm}$, $n = 6.28\,\mathrm{rad/s}$, and a separation tip-off has left a transverse rate $\omega_t = 0.10\,\mathrm{rad/s}$.

The body-frame precession rate is $\lambda = n(I_3 - I_t)/I_t = 6.28\times(1000 - 2000)/2000 = -3.14\,\mathrm{rad/s}$: retrograde, and here exactly half the spin rate because $I_3/I_t = 1/2$. In the body the transverse rate rotates once every $2\pi/3.14 = 2.0\,\mathrm{s}$, backwards relative to the spin, which itself has a period of $1.0\,\mathrm{s}$. The body cone half-angle is $\gamma = \arctan(0.10/6.28) = 0.91^\circ$.

The angular momentum has axial component $I_3n = 6283\,\mathrm{N\,m\,s}$ and transverse component $I_t\omega_t = 200\,\mathrm{N\,m\,s}$, so $H = \sqrt{6283^2 + 200^2} = 6286\,\mathrm{N\,m\,s}$ and the nutation angle is $\theta = \arctan(200/6283) = 1.82^\circ$. Because the body is prolate, $\theta > \gamma$: the symmetry axis cones about $\mathbf{H}$ at $1.82^\circ$ while the angular velocity cones about the symmetry axis at only $0.91^\circ$, the transverse part of $\mathbf{H}$ having been stretched by $I_t$ twice as much as the axial part by $I_3$. A tip-off of a tenth of a radian per second — six degrees per second — on a sixty-rpm spinner produces a two-degree wobble. Integrating Euler's equations numerically for this case reproduces the $2.0\,\mathrm{s}$ body-frame period and constant $\omega_3$ to round-off.
:::

::: warning Precession, nutation and the two frames
The word "precession" is used for the rotation of $\boldsymbol{\omega}$ about the body axis at rate $\lambda$ *and* for the rotation of the body axis about $\mathbf{H}$ at rate $H/I_t$, and different books attach "nutation" to different parts of the same motion. When you read a rate, ask which vector is rotating about which, and in which frame. In this module: $\lambda$ is the body-frame precession, the nutation angle $\theta$ is the constant angle between the symmetry axis and $\mathbf{H}$, and lesson 9 names the inertial rate. Gyro data from a nutating spacecraft show the body-frame rate $\lambda$; a star tracker shows the inertial one.
:::

::: warning The polhode is a body-frame curve
A common misreading is that $\mathbf{H}$ moves along the polhode in space. It does not; $\mathbf{H}$ is fixed in space for torque-free motion. What moves along the polhode are the body components of $\mathbf{H}$, which is the same as saying the body moves relative to the fixed $\mathbf{H}$. Plotting a simulation's $(H_1, H_2, H_3)$ traces the polhode; plotting $\mathbf{R}\mathbf{H}_B$ gives a single unmoving point, which is a useful check that the attitude integration is consistent with the rate integration.
:::

::: note Elliptic functions and the asymmetric body
For three distinct moments the torque-free solution exists in closed form in terms of Jacobi elliptic functions, with the polhode's shape parameter set by how far $H^2$ is from $2TI_2$. It is elegant and rarely needed; the two conservation laws and a numerical integrator give everything a GNC engineer needs from the asymmetric case, and the axisymmetric solution above covers spinning spacecraft.
:::

## Check yourself

::: check
A body with $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$ is released with $\boldsymbol{\omega} = (0.01, 1.0, 0.01)\,\mathrm{rad/s}$. Compute $H^2$ and $2TI_2$, and state what kind of polhode it lies on.
:::

::: answer
$H^2 = 1^2\times 0.01^2 + 2^2\times 1.0^2 + 3^2\times 0.01^2 = 0.0001 + 4 + 0.0009 = 4.0010$. $2T = 1\times 0.0001 + 2\times 1 + 3\times 0.0001 = 2.0004$, so $2TI_2 = 4.0008$. Then $H^2 = 4.0010 > 2TI_2 = 4.0008$, barely: the polhode is a major-axis loop, but one that hugs the separatrix, passing very close to the intermediate pole where it started and then travelling far across the sphere. The body will spend a long time near the initial spin, then tumble, then return. Had the perturbation been chosen to make $H^2$ slightly less than $2TI_2$ it would be a minor-axis loop with the same character.
:::

::: check
Show that no torque-free motion can have $H^2 > 2TI_3$ or $H^2 < 2TI_1$.
:::

::: answer
Write $H^2 = \sum_k I_k^2\omega_k^2 = \sum_k I_k\,(I_k\omega_k^2)$. Each term $I_k\omega_k^2$ is non-negative and they sum to $2T$, so $H^2$ is a weighted average of the $I_k$ with weights $I_k\omega_k^2/2T$ — a convex combination of $I_1, I_2, I_3$ multiplied by $2T$. A convex combination lies between the smallest and largest values, hence $2TI_1 \le H^2 \le 2TI_3$. Geometrically, the momentum sphere must intersect the energy ellipsoid, which requires its radius to fall between the ellipsoid's smallest and largest semi-axes.
:::

::: check
For the prolate stage of the example, $I_3 = 1000$, $I_t = 2000\,\mathrm{kg\,m^2}$, the transverse rate is doubled to $0.20\,\mathrm{rad/s}$ at the same $60\,\mathrm{rpm}$ spin. What changes in $\lambda$, $\gamma$ and $\theta$?
:::

::: answer
$\lambda = n(I_3 - I_t)/I_t$ does not depend on $\omega_t$ at all, so it stays at $-3.14\,\mathrm{rad/s}$: the wobble period is set by the spin and the inertia ratio, not by how hard the body was kicked. The cone angles double, to first order: $\gamma = \arctan(0.20/6.28) = 1.82^\circ$ and $\theta = \arctan(2000\times 0.20/(1000\times 6.28)) = \arctan(0.0637) = 3.64^\circ$. The nutation angle is still twice the body-cone angle because $\tan\theta/\tan\gamma = I_t/I_3 = 2$.
:::

::: check
Explain in one or two sentences each what is fixed in space, what is fixed in the body, and what is fixed in neither, in Poinsot's construction.
:::

::: answer
Fixed in space: the angular momentum $\mathbf{H}$, the invariable plane perpendicular to it at distance $2T/H$ from the centre of mass, and the herpolhode traced on that plane. Fixed in the body: the energy ellipsoid $\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = 2T$ and the polhode traced on it. Fixed in neither: the angular velocity $\boldsymbol{\omega}$, whose tip is the point where the rolling ellipsoid touches the plane, moving along the polhode as seen from the body and along the herpolhode as seen from space.
:::

::: check
An oblate spinner has $I_3 = 1500$, $I_t = 1000\,\mathrm{kg\,m^2}$ and spins at $10\,\mathrm{rpm}$ with a small transverse rate. Find the body-frame precession rate and its sense, and say whether the space cone is inside or outside the body cone.
:::

::: answer
$n = 10\times 2\pi/60 = 1.047\,\mathrm{rad/s}$ and $\lambda = n(I_3 - I_t)/I_t = 1.047\times 500/1000 = 0.524\,\mathrm{rad/s}$, positive: the transverse rate advances in the same sense as the spin, half as fast (period $12\,\mathrm{s}$ against a $6\,\mathrm{s}$ spin period). For an oblate body $\tan\theta = (I_t/I_3)\tan\gamma$ is smaller than $\tan\gamma$, so $\mathbf{H}$ lies closer to the symmetry axis than $\boldsymbol{\omega}$ does, the space cone is the narrower one and sits inside the body cone, and the body cone rolls around its outside.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $2T = \sum_k I_k\omega_k^2$, $H^2 = \sum_k I_k^2\omega_k^2$ | The two integrals of torque-free motion |
| Momentum sphere, energy ellipsoid | $\sum_k H_k^2 = H^2$; $\sum_k H_k^2/I_k = 2T$, semi-axes $\sqrt{2TI_k}$ |
| Polhode | Their intersection: body-frame path of $\mathbf{H}$ (or $\boldsymbol{\omega}$) |
| $2TI_1 \le H^2 \le 2TI_3$ | Range of possible motions; equality at the pure minor and major spins |
| $H^2 = 2TI_2$ | Separatrix through the intermediate axis; loops around the major axis above it, the minor axis below |
| Invariable plane | Perpendicular to $\mathbf{H}$ at distance $2T/H$; the body-fixed energy ellipsoid rolls on it |
| Herpolhode | Path of the contact point ($\boldsymbol{\omega}$) on the invariable plane |
| $\lambda = n(I_3 - I_t)/I_t$ | Body-frame precession rate of an axisymmetric body; sign follows $I_3 - I_t$ |
| $\tan\gamma = \omega_t/n$, $\tan\theta = I_t\omega_t/(I_3 n)$ | Body-cone half-angle; nutation angle between the symmetry axis and $\mathbf{H}$ |
| Prolate stage example | $\lambda = -3.14\,\mathrm{rad/s}$ at 60 rpm, $\gamma = 0.91^\circ$, $\theta = 1.82^\circ$ for $\omega_t = 0.10\,\mathrm{rad/s}$ |

The polhode picture says that spins about the major and minor axes are surrounded by small loops and the intermediate axis by a separatrix. The next lesson proves the same thing from Euler's equations in three lines, puts a growth rate on the instability, and reproduces it numerically.
