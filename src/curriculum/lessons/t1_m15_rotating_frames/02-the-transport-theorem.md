---
id: l02-the-transport-theorem
title: The transport theorem
minutes: 16
covers:
  - the transport theorem
---

A rate gyro bolted to a spacecraft measures the angular velocity of the body relative to inertial space, resolved along body axes. Almost everything the flight computer stores — a star direction, the angular momentum, a thrust vector, the position of a docking target — is stored in body coordinates too. Newton's laws, however, are written for an observer who does not rotate. The transport theorem is the identity that connects the two: it tells you how to take an inertial time derivative of a vector you hold in a rotating frame, using nothing but the angular velocity of that frame.

The theorem is short enough to fit on one line, and it is behind more of GNC than any other single equation in this module. Euler's rotational equations from the rigid-body module are the transport theorem applied to angular momentum. The Coriolis and centrifugal terms in an inertial navigation mechanisation are the transport theorem applied twice to position. The relative-motion equations used for rendezvous, and the rule for adding the angular velocities of nested gimbals, are the same identity again.

This lesson derives it, states it carefully, writes it in matrix form, and shows the two properties of it that people most often need and most often forget.

## The derivative depends on who is watching

Take a unit vector $\hat{\mathbf{b}}_1$ fixed to a spinning spacecraft. To an observer riding on the spacecraft, that vector never changes: its coordinates in the body frame are $(1, 0, 0)$ for all time, so its body-frame derivative is zero. To an inertial observer the same vector sweeps around a cone; its inertial derivative is not zero. Both observers are describing one arrow. They disagree about its rate of change because a derivative compares the vector now with the vector a moment later, and "the vector a moment later" is being resolved against a basis that itself moved for one observer and did not for the other.

So a time derivative of a vector must be labelled with the frame in which it is taken. This module writes

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I \quad\text{and}\quad \left(\frac{d\mathbf{a}}{dt}\right)_B
$$

for the derivatives seen by an inertial observer and by an observer fixed in the body frame $B$. Scalars need no label: the length of a vector, or the angle between two vectors, has the same rate of change for everyone.

## The derivative of a rotating unit vector

Let frame $B$ have orthonormal axes $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$ that rotate relative to an inertial frame $I$. Because the axes stay orthonormal, $\hat{\mathbf{b}}_i \cdot \hat{\mathbf{b}}_j = \delta_{ij}$ at every instant. Differentiating in the inertial frame,

$$
\dot{\hat{\mathbf{b}}}_i \cdot \hat{\mathbf{b}}_j + \hat{\mathbf{b}}_i \cdot \dot{\hat{\mathbf{b}}}_j = 0 .
$$

Resolve each derivative along the body axes themselves, $\dot{\hat{\mathbf{b}}}_i = \sum_j \Omega_{ij}\hat{\mathbf{b}}_j$ with $\Omega_{ij} = \dot{\hat{\mathbf{b}}}_i \cdot \hat{\mathbf{b}}_j$. The identity above says $\Omega_{ij} + \Omega_{ji} = 0$: the matrix $\Omega$ is skew-symmetric, so its diagonal is zero and it has only three independent entries. Name them

$$
\omega_1 = \Omega_{23}, \qquad \omega_2 = \Omega_{31}, \qquad \omega_3 = \Omega_{12},
$$

and define the vector $\boldsymbol{\omega} = \omega_1\hat{\mathbf{b}}_1 + \omega_2\hat{\mathbf{b}}_2 + \omega_3\hat{\mathbf{b}}_3$. Now compute $\boldsymbol{\omega} \times \hat{\mathbf{b}}_1$ using $\hat{\mathbf{b}}_2 \times \hat{\mathbf{b}}_1 = -\hat{\mathbf{b}}_3$ and $\hat{\mathbf{b}}_3 \times \hat{\mathbf{b}}_1 = \hat{\mathbf{b}}_2$:

$$
\boldsymbol{\omega} \times \hat{\mathbf{b}}_1 = \omega_3 \hat{\mathbf{b}}_2 - \omega_2 \hat{\mathbf{b}}_3 = \Omega_{12}\hat{\mathbf{b}}_2 + \Omega_{13}\hat{\mathbf{b}}_3 = \dot{\hat{\mathbf{b}}}_1 ,
$$

where the middle step used $-\Omega_{31} = \Omega_{13}$. The same calculation for the other two axes gives the general result:

$$
\dot{\hat{\mathbf{b}}}_i = \boldsymbol{\omega}_{B/I} \times \hat{\mathbf{b}}_i, \qquad i = 1, 2, 3 .
$$

This is the definition of the angular velocity vector $\boldsymbol{\omega}_{B/I}$ of frame $B$ relative to frame $I$: the one vector such that every axis of $B$ moves at the rate given by crossing it with that axis. The subscript reads "$B$ relative to $I$". Its units are rad/s; a spacecraft in a slow attitude slew turns at a few tenths of a degree per second, about $5 \times 10^{-3}\,\mathrm{rad/s}$, and the Earth turns at $7.29 \times 10^{-5}\,\mathrm{rad/s}$.

## The transport theorem

Now take any vector $\mathbf{a}$ and write it in body coordinates, $\mathbf{a} = \sum_i a_i \hat{\mathbf{b}}_i$. The inertial observer differentiates both the components and the basis:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \sum_i \dot{a}_i \hat{\mathbf{b}}_i + \sum_i a_i \dot{\hat{\mathbf{b}}}_i
= \sum_i \dot{a}_i \hat{\mathbf{b}}_i + \boldsymbol{\omega}_{B/I} \times \sum_i a_i \hat{\mathbf{b}}_i .
$$

The first sum is what the body-fixed observer calls the derivative — the components change and the basis, to that observer, does not. The second sum is $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. Hence:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a} .
$$

This is the transport theorem. In words: the inertial derivative of any vector equals its body-frame derivative plus the rotation term, the angular velocity of the body frame crossed into the vector.

::: key
The transport theorem: $\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$ — the inertial derivative of any vector equals its body-frame derivative plus the rotation term $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. It holds for every vector, and for any pair of frames, with $\boldsymbol{\omega}$ the angular velocity of the second frame relative to the first.
:::

Four remarks, each of which is used later in the module:

1. **Nothing about $I$ needs to be inertial.** The derivation used only the rotation of $B$'s axes relative to the frame in which the derivative on the left is taken. For any two frames $A$ and $B$, $(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/A} \times \mathbf{a}$. The theorem relates ECEF derivatives to NED derivatives exactly as it relates inertial derivatives to body derivatives.
2. **Vectors parallel to $\boldsymbol{\omega}$ have the same derivative in both frames**, because the cross product vanishes. In particular $\boldsymbol{\omega}_{B/I}$ itself does: $(\dot{\boldsymbol{\omega}}_{B/I})_I = (\dot{\boldsymbol{\omega}}_{B/I})_B$. The angular acceleration is the same vector whichever of the two frames you differentiate in, so the Euler term in the next lessons needs no frame label.
3. **A vector fixed in $B$ has inertial derivative $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$**, since its body derivative is zero. A vector fixed in $I$ has body derivative $-\boldsymbol{\omega}_{B/I} \times \mathbf{a}$: to the rotating observer, inertially fixed directions appear to swing backwards.
4. **Reversing the frames flips the sign of $\boldsymbol{\omega}$**: $\boldsymbol{\omega}_{I/B} = -\boldsymbol{\omega}_{B/I}$, which is what remark 3 says in symbols.

::: example A star through a spinning star tracker
A spin-stabilised spacecraft turns at 2 rpm about its body $\hat{\mathbf{b}}_3$ axis, so $\boldsymbol{\omega}_{B/I} = (0, 0, \omega)$ in body coordinates with $\omega = 2 \times 2\pi / 60 = 0.209\,\mathrm{rad/s}$. A star tracker on the spacecraft sees a star whose direction $\hat{\mathbf{s}}$ makes an angle of $60^\circ$ with the spin axis. How fast does the star move across the tracker's field of view?

The star direction is fixed in inertial space, so $(\dot{\hat{\mathbf{s}}})_I = 0$ and the transport theorem gives the body-frame rate:

$$
\left(\frac{d\hat{\mathbf{s}}}{dt}\right)_B = -\boldsymbol{\omega}_{B/I} \times \hat{\mathbf{s}}, \qquad
\left| \left(\frac{d\hat{\mathbf{s}}}{dt}\right)_B \right| = \omega \sin 60^\circ = 0.209 \times 0.866 = 0.181\,\mathrm{rad/s} ,
$$

which is $10.4^\circ/\mathrm{s}$. During a 20 ms exposure the star image smears through $0.181 \times 0.020 = 3.63 \times 10^{-3}\,\mathrm{rad}$, about $0.21^\circ$ or 12.5 arcminutes — far more than the few arcseconds a tracker is built to resolve. That is why star trackers on spinning vehicles are either mounted near the spin axis (small $\sin$ factor) or replaced by slit-type star scanners that time the star's crossing instead of imaging it. The minus sign says the star appears to move opposite to the spin, as the rotating observer's remark 3 predicts.
:::

## Matrix form: the attitude kinematics equation

The theorem is a statement about vectors. In code you hold coordinates, so a matrix version is what you implement. Let $\mathbf{R}_{I \leftarrow B}$ be the DCM from body to inertial coordinates, so that $\mathbf{a}^{I} = \mathbf{R}_{I \leftarrow B}\,\mathbf{a}^{B}$ for every vector, and define the skew-symmetric cross-product matrix of a vector $\mathbf{w} = (w_1, w_2, w_3)$:

$$
[\mathbf{w} \times] = \begin{bmatrix} 0 & -w_3 & w_2 \\ w_3 & 0 & -w_1 \\ -w_2 & w_1 & 0 \end{bmatrix}, \qquad [\mathbf{w} \times]\,\mathbf{a} = \mathbf{w} \times \mathbf{a} .
$$

Differentiate $\mathbf{a}^{I} = \mathbf{R}_{I \leftarrow B}\,\mathbf{a}^{B}$ with respect to time. The inertial coordinates of a vector change at the rate the inertial observer sees, so the left side is the inertial derivative in $I$ coordinates; on the right, $\dot{\mathbf{a}}^{B}$ is the body-frame derivative in $B$ coordinates:

$$
\frac{d\mathbf{a}^{I}}{dt} = \dot{\mathbf{R}}_{I \leftarrow B}\,\mathbf{a}^{B} + \mathbf{R}_{I \leftarrow B}\,\dot{\mathbf{a}}^{B} .
$$

The transport theorem, written in body coordinates and then rotated into $I$, says the same left side equals $\mathbf{R}_{I \leftarrow B}\left(\dot{\mathbf{a}}^{B} + [\boldsymbol{\omega}^{B}_{B/I} \times]\,\mathbf{a}^{B}\right)$. Comparing the two expressions for every possible $\mathbf{a}^{B}$:

$$
\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}\,[\boldsymbol{\omega}^{B}_{B/I} \times] .
$$

Here $\boldsymbol{\omega}^{B}_{B/I}$ is the angular velocity of the body relative to inertial space, resolved in body axes — in code, `omega_body_wrt_eci_in_body`, and physically the output of a strapdown gyro triad. Because $\mathbf{R}[\mathbf{w}\times]\mathbf{R}^{T} = [(\mathbf{R}\mathbf{w})\times]$ for any rotation, the same equation can be written with the rate resolved in inertial axes, $\dot{\mathbf{R}}_{I \leftarrow B} = [\boldsymbol{\omega}^{I}_{B/I} \times]\,\mathbf{R}_{I \leftarrow B}$. This is the attitude kinematics equation: integrate it with the gyro rates and you propagate attitude. The attitude-representations module that follows this one does the same thing with quaternions, which avoid carrying nine numbers with six constraints.

A finite-difference check of the sign is worth running once so that you never doubt it again:

```python
import numpy as np

def skew(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])

R_eci_from_body = np.eye(3)          # any rotation works; identity is easy to read
omega_body_wrt_eci_in_body = np.array([0.01, 0.02, -0.03])   # rad/s
dt = 1e-6
# after dt the body axes have turned by omega*dt, so body->eci picks up a small rotation
R_next = R_eci_from_body @ (np.eye(3) + skew(omega_body_wrt_eci_in_body * dt))
R_dot_fd = (R_next - R_eci_from_body) / dt
print(np.allclose(R_dot_fd, R_eci_from_body @ skew(omega_body_wrt_eci_in_body), atol=1e-6))
# True
```

## Adding angular velocities

Frames stack: a sensor gimbal turns relative to the body, the body turns relative to the local-level frame, the local-level frame turns relative to the Earth, and the Earth turns relative to inertial space. Apply the theorem to an arbitrary vector $\mathbf{a}$ across three frames $A$, $B$, $C$:

$$
(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/A} \times \mathbf{a}, \qquad
(\dot{\mathbf{a}})_B = (\dot{\mathbf{a}})_C + \boldsymbol{\omega}_{C/B} \times \mathbf{a} .
$$

Substituting the second into the first gives $(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_C + (\boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A}) \times \mathbf{a}$, and comparing with the direct statement $(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_C + \boldsymbol{\omega}_{C/A} \times \mathbf{a}$, valid for every $\mathbf{a}$:

$$
\boldsymbol{\omega}_{C/A} = \boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A} .
$$

Angular velocities add like the arrows in the subscripts, provided all three are resolved in the same axes before the addition — which, after the previous lesson, you would not do any other way. The inertial navigation mechanisation uses exactly this: the rate of the body relative to inertial space, which the gyros measure, is the rate of the body relative to NED plus the rate of NED relative to the Earth (the transport rate, from the vehicle moving over a curved surface) plus the Earth's own rate.

::: example An inertially fixed pad has an inertial velocity
Launch pad SLC-40 at Cape Canaveral has ECEF position $\mathbf{r}^{E} = (917\,832,\; -5\,530\,573,\; 3\,031\,344)\,\mathrm{m}$ (the geodetic conversion behind these numbers is in a later lesson). The pad is fixed in the Earth frame, so $(\dot{\mathbf{r}})_E = 0$, and the Earth rotates relative to inertial space about its $z$ axis at $\boldsymbol{\omega}^{E}_{E/I} = (0, 0, \omega_E)$ with $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. The transport theorem gives the pad's inertial velocity, resolved in ECEF axes:

$$
(\dot{\mathbf{r}})_I = \boldsymbol{\omega}_{E/I} \times \mathbf{r} = \omega_E \begin{bmatrix} -y \\ x \\ 0 \end{bmatrix}
= \begin{bmatrix} 7.292115 \times 10^{-5} \times 5\,530\,573 \\ 7.292115 \times 10^{-5} \times 917\,832 \\ 0 \end{bmatrix}
= \begin{bmatrix} 403.3 \\ 66.9 \\ 0 \end{bmatrix} \mathrm{m/s} .
$$

The magnitude is $\sqrt{403.3^2 + 66.9^2} = 408.8\,\mathrm{m/s}$, directed due east (perpendicular to both the spin axis and the position vector, with no vertical component). A rocket sitting on that pad, before ignition, is already moving at 409 m/s relative to the inertial frame in which its orbit will be described. The next lesson turns this observation into a launch-azimuth calculation.
:::

## Where the theorem shows up next

Two applications close the loop with the rigid-body module and open the door to the next lesson.

**Euler's rotational equations.** The angular momentum of a rigid body about its centre of mass is $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, and Newton's law for rotation says the inertial derivative of $\mathbf{H}$ equals the applied moment $\mathbf{M}$. The inertia tensor is constant in body axes and changes in inertial axes, so the derivative is easiest in the body frame. The transport theorem does the conversion in one step:

$$
\mathbf{M} = \left(\frac{d\mathbf{H}}{dt}\right)_I = \left(\frac{d\mathbf{H}}{dt}\right)_B + \boldsymbol{\omega} \times \mathbf{H}
= \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega} .
$$

The gyroscopic term $\boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega}$ that drives nutation and the intermediate-axis instability is nothing more than the rotation term of the transport theorem.

**Relative motion.** Apply the theorem to a position vector once and you get a velocity relation with one extra term; apply it again and you get the acceleration relation with three extra terms — Coriolis, centrifugal and Euler. That derivation is the next lesson.

::: warning
The rotation term uses the angular velocity of the frame in which the *second* derivative is taken relative to the frame of the *first*: $(\dot{\mathbf{a}})_I = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$, not $\boldsymbol{\omega}_{I/B}$. Swapping the subscripts flips the sign of every Coriolis and centrifugal term downstream. Check with a body-fixed vector: its inertial derivative must be $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$, and for a spin about $+z$ a vector along $+x$ must move toward $+y$.
:::

::: warning
The theorem is a relation between vectors. Before adding or comparing the terms numerically, resolve every one of them in the same axes. $\boldsymbol{\omega}^{B}_{B/I}$ from a gyro and $\mathbf{a}^{I}$ from an ephemeris cannot be crossed together until one of them is rotated, and the matrix form $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$ is only correct with the rate in body axes; with the rate in inertial axes the skew matrix goes on the left.
:::

## Check yourself

::: check
A body-fixed vector has body coordinates $\mathbf{a}^{B} = (1, 0, 0)$ and the body spins about its $z$ axis at $\boldsymbol{\omega}^{B}_{B/I} = (0, 0, 0.5)\,\mathrm{rad/s}$. What is the inertial derivative of $\mathbf{a}$, resolved in body axes, and in which direction does the tip of the vector move?
:::

::: answer
The body-frame derivative is zero because the vector is fixed in the body. The transport theorem leaves only the rotation term:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \boldsymbol{\omega}_{B/I} \times \mathbf{a} = (0, 0, 0.5) \times (1, 0, 0) = (0 \cdot 0 - 0.5 \cdot 0,\; 0.5 \cdot 1 - 0 \cdot 0,\; 0 \cdot 0 - 0 \cdot 1) = (0, 0.5, 0)\,\mathrm{rad/s} .
$$

The tip moves toward $+y$ at 0.5 units per second — a positive rotation about $+z$ carries the $x$ axis toward the $y$ axis, as the right-hand rule requires. The magnitude $|\boldsymbol{\omega}||\mathbf{a}|\sin 90^\circ = 0.5$ is consistent.
:::

::: check
Explain, without algebra, why the angular acceleration $\dot{\boldsymbol{\omega}}_{B/I}$ does not need a frame label, while the derivative of almost any other vector does.
:::

::: answer
The two derivatives differ by $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. When $\mathbf{a}$ is $\boldsymbol{\omega}_{B/I}$ itself the cross product is of a vector with itself, which is zero. So the inertial and body observers agree about how the angular velocity vector is changing, even though they disagree about almost every other vector. The same holds for any vector that happens to be parallel to $\boldsymbol{\omega}$ at that instant.
:::

::: check
A gimballed antenna rotates relative to the spacecraft body at $\boldsymbol{\omega}_{G/B} = (0, 0, 0.10)\,\mathrm{rad/s}$, and the body rotates relative to inertial space at $\boldsymbol{\omega}_{B/I} = (0, 0.05, 0)\,\mathrm{rad/s}$, both resolved in body axes at this instant. What is the angular velocity of the antenna relative to inertial space, and what is its magnitude?
:::

::: answer
Angular velocities add along the chain of frames when resolved in common axes: $\boldsymbol{\omega}_{G/I} = \boldsymbol{\omega}_{G/B} + \boldsymbol{\omega}_{B/I} = (0, 0.05, 0.10)\,\mathrm{rad/s}$. The magnitude is $\sqrt{0.05^2 + 0.10^2} = 0.112\,\mathrm{rad/s}$, about $6.4^\circ/\mathrm{s}$, about an axis tilted from the gimbal axis toward the body $y$ axis. A gyro mounted on the antenna would read this sum, not the gimbal rate alone.
:::

::: check
Starting from $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$, show that $\mathbf{R}_{I \leftarrow B}$ stays orthogonal as it is integrated exactly, and say what that implies for a numerical integrator.
:::

::: answer
Let $\mathbf{R} = \mathbf{R}_{I \leftarrow B}$ and $\mathbf{W} = [\boldsymbol{\omega}^{B}_{B/I}\times]$, which is skew-symmetric, $\mathbf{W}^{T} = -\mathbf{W}$. Then

$$
\frac{d}{dt}\left(\mathbf{R}^{T}\mathbf{R}\right) = \dot{\mathbf{R}}^{T}\mathbf{R} + \mathbf{R}^{T}\dot{\mathbf{R}} = \mathbf{W}^{T}\mathbf{R}^{T}\mathbf{R} + \mathbf{R}^{T}\mathbf{R}\mathbf{W} .
$$

If $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$ at some instant this becomes $\mathbf{W}^{T} + \mathbf{W} = 0$, so the product never leaves the identity: exact integration preserves orthogonality. A numerical integrator does not respect this exactly; truncation error accumulates as a slow loss of orthogonality and unit determinant, so an attitude propagator must re-orthogonalise periodically (or use a representation such as the unit quaternion, where the constraint is a single normalisation).
:::

::: check
A vector is fixed in inertial space. What does an observer in the rotating frame $B$ see as its rate of change, and how does this explain why the stars appear to move westward across the sky?
:::

::: answer
With $(\dot{\mathbf{a}})_I = 0$ the transport theorem gives $(\dot{\mathbf{a}})_B = -\boldsymbol{\omega}_{B/I} \times \mathbf{a}$: the fixed vector appears to rotate at the negative of the frame's angular velocity. The Earth rotates eastward about its axis at $\omega_E$, so to an Earth-fixed observer every inertially fixed star direction appears to rotate westward at the same rate, $7.29 \times 10^{-5}\,\mathrm{rad/s}$, tracing a circle about the celestial pole. That apparent motion is the "rotation of the sky", and its period is one sidereal day.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $(d\mathbf{a}/dt)_I$, $(d\mathbf{a}/dt)_B$ | Time derivative of $\mathbf{a}$ as seen from frame $I$ or frame $B$ |
| $\boldsymbol{\omega}_{B/I}$ | Angular velocity of $B$ relative to $I$; defined by $\dot{\hat{\mathbf{b}}}_i = \boldsymbol{\omega}_{B/I} \times \hat{\mathbf{b}}_i$ |
| $\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$ | The transport theorem, valid for any vector and any two frames |
| $\dot{\boldsymbol{\omega}}_{B/I}$ | The same in both frames; no label needed |
| Body-fixed vector | Inertial derivative $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$ |
| Inertially fixed vector | Body derivative $-\boldsymbol{\omega}_{B/I} \times \mathbf{a}$ |
| $[\mathbf{w}\times]$ | Skew-symmetric matrix with $[\mathbf{w}\times]\mathbf{a} = \mathbf{w} \times \mathbf{a}$ |
| $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$ | Attitude kinematics; rate resolved in body axes on the right |
| $\boldsymbol{\omega}_{C/A} = \boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A}$ | Angular velocities add along a chain of frames, in common axes |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ | Euler's equations, via the theorem applied to $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ |

The next lesson applies the theorem to the position of a point twice, producing the velocity and acceleration relations between an inertial frame and a rotating one — the equations that carry Coriolis, centrifugal and Euler terms.
