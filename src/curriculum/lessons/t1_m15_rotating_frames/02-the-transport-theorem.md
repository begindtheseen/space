---
id: l02-the-transport-theorem
title: The transport theorem
minutes: 20
covers:
  - the transport theorem
---

Picture a friend on a spinning merry-go-round holding a stick straight out to the side. To your friend the stick never moves: it points "out", the same as a moment ago. To you, standing on the ground, the tip of that stick is sweeping round in a circle. You are both watching one stick. You disagree about how fast it is changing, because one of you is turning and the other is not.

A spacecraft has exactly this problem. A rate gyro bolted to it measures how fast the body turns relative to inertial space, written along body axes. Almost everything the flight computer stores — a star direction, the angular momentum, a thrust direction, where a docking target sits — is stored in body coordinates too. But Newton's laws are written for an observer who does not turn. The **transport theorem** connects the two. It tells you how to find the rate of change an inertial observer sees, for any vector you hold in a turning frame, using only the turning rate of that frame.

The theorem fits on one line, and it sits behind more of GNC than any other equation in this module. Euler's rotational equations from the rigid-body module are the transport theorem applied to angular momentum. The Coriolis and centrifugal terms of inertial navigation are the transport theorem applied twice to position. The rendezvous equations, and the rule for adding the turning rates of stacked gimbals, are the same identity again. This lesson derives it, writes it as a matrix equation you can code, and shows the properties people most often need and most often forget.

## The rate of change depends on who is watching

Take a unit vector $\hat{\mathbf{b}}_1$ fixed to a spinning spacecraft — the stick on the merry-go-round. To an observer riding on the spacecraft, it never changes. Its body coordinates are $(1, 0, 0)$ forever, so its rate of change in the body frame is zero. To an inertial observer the same arrow sweeps round a cone, so its rate of change is not zero.

Why do they disagree about one arrow? A rate of change compares the arrow now with the arrow a moment later. Each observer measures "a moment later" against their own axes — and one set of axes has turned in the meantime while the other has not.

So the rate of change of a vector must be labeled with the frame it is taken in. This module writes

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I \quad\text{and}\quad \left(\frac{d\mathbf{a}}{dt}\right)_B
$$

read "d a by d t, seen in I" and "d a by d t, seen in B". The first is the rate of change seen by an inertial observer; the second is the rate seen by an observer fixed in the body frame $B$.

Plain numbers need no label. The length of a vector, or the angle between two vectors, changes at the same rate for everyone. Only directions depend on who is watching.

## How a turning unit arrow changes

Start with the simplest case: one axis of the turning frame. A unit arrow cannot change its length, so its tip can only move sideways — at right angles to the arrow. If the frame spins about some axis at rate $\omega$ ("omega", in radians per second), the tip moves at right angles to both the arrow and the spin axis, at a speed of $\omega$ times the arrow's distance from that axis. That is exactly what the **cross product** $\boldsymbol{\omega} \times \hat{\mathbf{b}}$ describes: a vector at right angles to both, with size $|\boldsymbol{\omega}|\sin(\text{angle between})$. So we expect

$$
\dot{\hat{\mathbf{b}}}_i = \boldsymbol{\omega}_{B/I} \times \hat{\mathbf{b}}_i, \qquad i = 1, 2, 3 .
$$

The dot over the letter, read "b-hat-one dot", means rate of change as seen in the inertial frame. The [[picture of a spinning arrow|rotating-arrow]] makes this concrete.

This equation *defines* the **angular velocity** $\boldsymbol{\omega}_{B/I}$ of frame $B$ relative to frame $I$ (read "omega, B relative to I"). It is the one vector such that every axis of $B$ changes at the rate you get by crossing it into that axis. Its units are rad/s. A spacecraft in a slow turn might rotate at a few tenths of a degree per second, about $5 \times 10^{-3}\,\mathrm{rad/s}$. The Earth turns at $7.29 \times 10^{-5}\,\mathrm{rad/s}$.

The surprise is that a *single* vector works for all three axes at once. The note below shows why that has to be so.

::: note Why one angular velocity serves all three axes
Let frame $B$ have axes $\hat{\mathbf{b}}_1, \hat{\mathbf{b}}_2, \hat{\mathbf{b}}_3$ that turn relative to $I$. The axes stay unit length and perpendicular, so at every instant $\hat{\mathbf{b}}_i \cdot \hat{\mathbf{b}}_j = \delta_{ij}$, where the **[[Kronecker delta|kronecker]]** $\delta_{ij}$ is $1$ when $i = j$ and $0$ otherwise. A constant has zero rate of change, so taking the inertial rate of change of both sides with the product rule gives

$$
\dot{\hat{\mathbf{b}}}_i \cdot \hat{\mathbf{b}}_j + \hat{\mathbf{b}}_i \cdot \dot{\hat{\mathbf{b}}}_j = 0 .
$$

Write each rate of change along the body axes themselves, $\dot{\hat{\mathbf{b}}}_i = \sum_j \Omega_{ij}\hat{\mathbf{b}}_j$ with $\Omega_{ij} = \dot{\hat{\mathbf{b}}}_i \cdot \hat{\mathbf{b}}_j$. The line above then says $\Omega_{ij} + \Omega_{ji} = 0$. So the table $\Omega$ ("capital omega") is **[[skew-symmetric|skew-symmetric]]**: its diagonal is zero, and each entry is minus its mirror across the diagonal. It has only three independent entries. Name them

$$
\omega_1 = \Omega_{23}, \qquad \omega_2 = \Omega_{31}, \qquad \omega_3 = \Omega_{12},
$$

and build the vector $\boldsymbol{\omega} = \omega_1\hat{\mathbf{b}}_1 + \omega_2\hat{\mathbf{b}}_2 + \omega_3\hat{\mathbf{b}}_3$. Now work out $\boldsymbol{\omega} \times \hat{\mathbf{b}}_1$ using $\hat{\mathbf{b}}_1 \times \hat{\mathbf{b}}_1 = 0$, $\hat{\mathbf{b}}_2 \times \hat{\mathbf{b}}_1 = -\hat{\mathbf{b}}_3$ and $\hat{\mathbf{b}}_3 \times \hat{\mathbf{b}}_1 = \hat{\mathbf{b}}_2$:

$$
\boldsymbol{\omega} \times \hat{\mathbf{b}}_1 = \omega_3 \hat{\mathbf{b}}_2 - \omega_2 \hat{\mathbf{b}}_3 = \Omega_{12}\hat{\mathbf{b}}_2 + \Omega_{13}\hat{\mathbf{b}}_3 = \dot{\hat{\mathbf{b}}}_1 .
$$

The middle step used $-\Omega_{31} = \Omega_{13}$ (skew symmetry), and the last step is the definition of $\Omega$ with $\Omega_{11} = 0$. The same calculation for $\hat{\mathbf{b}}_2$ and $\hat{\mathbf{b}}_3$ gives the other two. Three unknown motions, one vector: the stiffness of a rigid frame is what forces it.
:::

## The transport theorem

Now take any vector $\mathbf{a}$ — not just an axis — and write it in body coordinates, $\mathbf{a} = \sum_i a_i \hat{\mathbf{b}}_i$. The components $a_i$ are plain numbers. The axes $\hat{\mathbf{b}}_i$ are arrows that turn.

The inertial observer sees *both* change. By the product rule, the rate of change has two parts:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \sum_i \dot{a}_i \hat{\mathbf{b}}_i + \sum_i a_i \dot{\hat{\mathbf{b}}}_i .
$$

In the second sum, replace each $\dot{\hat{\mathbf{b}}}_i$ by $\boldsymbol{\omega}_{B/I} \times \hat{\mathbf{b}}_i$, from the previous section. The same $\boldsymbol{\omega}_{B/I}$ appears in every term, so it comes outside the sum:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \sum_i \dot{a}_i \hat{\mathbf{b}}_i + \boldsymbol{\omega}_{B/I} \times \sum_i a_i \hat{\mathbf{b}}_i .
$$

Now read each piece. The first sum is what the body observer calls the rate of change: the components change and, to that observer, the axes do not. The second sum is $\boldsymbol{\omega}_{B/I}$ crossed into $\mathbf{a}$ itself. So:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a} .
$$

That is the transport theorem. In words: the inertial rate of change of any vector equals its body-frame rate of change plus the **rotation term** — the angular velocity of the body frame crossed into the vector. On the merry-go-round, the stick has zero body rate, and all of its motion that you see from the ground is the rotation term.

::: key
The transport theorem: $\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$ — the inertial derivative of any vector equals its body-frame derivative plus the rotation term $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. It holds for every vector, and for any pair of frames, with $\boldsymbol{\omega}$ the angular velocity of the second frame relative to the first.
:::

Four remarks, each used later in the module:

1. **Nothing about $I$ needs to be inertial.** The derivation only used how $B$'s axes turn relative to the frame on the left. For any two frames $A$ and $B$, $(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/A} \times \mathbf{a}$. The theorem links ECEF rates to north–east–down rates exactly as it links inertial rates to body rates.
2. **Vectors along $\boldsymbol{\omega}$ change at the same rate in both frames**, because the cross product of parallel vectors is zero. In particular $\boldsymbol{\omega}_{B/I}$ itself does: $(\dot{\boldsymbol{\omega}}_{B/I})_I = (\dot{\boldsymbol{\omega}}_{B/I})_B$. The **angular acceleration** (how fast the turning rate changes) is the same vector whichever of the two frames you use, so the Euler term in the next lessons needs no frame label.
3. **A vector fixed in $B$ has inertial rate $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$**, since its body rate is zero. A vector fixed in $I$ has body rate $-\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. To the turning observer, directions fixed in space seem to swing *backwards* — the way trees seem to slide backwards past a turning car.
4. **Swapping the frames flips the sign of $\boldsymbol{\omega}$**: $\boldsymbol{\omega}_{I/B} = -\boldsymbol{\omega}_{B/I}$. That is remark 3 in symbols.

::: example A star through a spinning star tracker
A **[[spin-stabilized|spin-stabilized]]** spacecraft turns at $2$ revolutions per minute (rpm) about its body $\hat{\mathbf{b}}_3$ axis. A star tracker on it sees a star whose direction $\hat{\mathbf{s}}$ makes a $60^\circ$ angle with the spin axis. How fast does the star cross the tracker's view?

**Turning rate in rad/s.** One revolution is $2\pi$ radians and one minute is $60\,\mathrm{s}$:

$$
\omega = \frac{2 \times 2\pi}{60} = 0.209\,\mathrm{rad/s}, \qquad \boldsymbol{\omega}_{B/I} = (0, 0, \omega) \text{ in body axes}.
$$

**Apply the theorem.** The star's direction is fixed in inertial space, so $(\dot{\hat{\mathbf{s}}})_I = 0$. Put that on the left of the transport theorem and move the rotation term across:

$$
\left(\frac{d\hat{\mathbf{s}}}{dt}\right)_B = -\boldsymbol{\omega}_{B/I} \times \hat{\mathbf{s}} .
$$

**Size.** The size of a cross product is the product of the sizes times the sine of the angle between. The star arrow has length $1$:

$$
\left| \left(\frac{d\hat{\mathbf{s}}}{dt}\right)_B \right| = \omega \sin 60^\circ = 0.209 \times 0.866 = 0.181\,\mathrm{rad/s} .
$$

That is $10.4^\circ$ every second. The minus sign says the star seems to move opposite to the spin, as remark 3 predicts.

**Does it matter?** During a $20\,\mathrm{ms}$ camera exposure the star image smears through $0.181 \times 0.020 = 3.63 \times 10^{-3}\,\mathrm{rad}$. That is about $0.21^\circ$, or $12.5$ arcminutes — far more than the few arcseconds a tracker is built to resolve. So on spinning vehicles, star trackers are mounted near the spin axis (where the $\sin$ factor is small) or replaced by **[[slit star scanners|star-scanner]]**, which time the star's crossing instead of photographing it.
:::

## The matrix form: attitude kinematics

The theorem is about arrows. In code you hold columns of numbers, so you need a matrix version.

First, a tool. For a vector $\mathbf{w} = (w_1, w_2, w_3)$, the **cross-product matrix** $[\mathbf{w}\times]$ (read "w cross") is the skew-symmetric matrix that does the cross product by ordinary multiplication:

$$
[\mathbf{w} \times] = \begin{bmatrix} 0 & -w_3 & w_2 \\ w_3 & 0 & -w_1 \\ -w_2 & w_1 & 0 \end{bmatrix}, \qquad [\mathbf{w} \times]\,\mathbf{a} = \mathbf{w} \times \mathbf{a} .
$$

Let $\mathbf{R}_{I \leftarrow B}$ be the DCM from body to inertial coordinates, so that $\mathbf{a}^{I} = \mathbf{R}_{I \leftarrow B}\,\mathbf{a}^{B}$ for every vector. Now take the rate of change of both sides.

**Left side.** The inertial coordinates change at the rate the inertial observer sees, so $d\mathbf{a}^{I}/dt$ is the inertial rate of change written in $I$ coordinates.

**Right side.** The product rule gives two pieces. The second contains $\dot{\mathbf{a}}^{B}$, the body-frame rate of change in $B$ coordinates:

$$
\frac{d\mathbf{a}^{I}}{dt} = \dot{\mathbf{R}}_{I \leftarrow B}\,\mathbf{a}^{B} + \mathbf{R}_{I \leftarrow B}\,\dot{\mathbf{a}}^{B} .
$$

**The theorem, as columns.** Write the transport theorem in body coordinates and then rotate it into $I$. It says the same left side equals $\mathbf{R}_{I \leftarrow B}\left(\dot{\mathbf{a}}^{B} + [\boldsymbol{\omega}^{B}_{B/I} \times]\,\mathbf{a}^{B}\right)$.

**Compare.** The $\mathbf{R}_{I \leftarrow B}\,\dot{\mathbf{a}}^{B}$ pieces match. What remains must match for every possible $\mathbf{a}^{B}$, so the matrices themselves are equal:

$$
\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}\,[\boldsymbol{\omega}^{B}_{B/I} \times] .
$$

Here $\boldsymbol{\omega}^{B}_{B/I}$ is the angular velocity of the body relative to inertial space, written in body axes — in code, `omega_body_wrt_eci_in_body`, and physically the output of a strapdown gyro set.

For any rotation, $\mathbf{R}[\mathbf{w}\times]\mathbf{R}^{T} = [(\mathbf{R}\mathbf{w})\times]$: a cross product turns along with its inputs. Using it, the same equation can be written with the rate in inertial axes, $\dot{\mathbf{R}}_{I \leftarrow B} = [\boldsymbol{\omega}^{I}_{B/I} \times]\,\mathbf{R}_{I \leftarrow B}$. Notice the skew matrix has moved to the left.

This is the **attitude kinematics equation**. Step it forward in time with the gyro rates and you track which way the vehicle points. The attitude module that follows this one does the same job with **[[quaternions|quaternion-bridge]]**.

A finite-difference check of the sign is worth running once, so you never doubt it again:

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

Frames stack like Russian dolls. A sensor gimbal turns relative to the body. The body turns relative to the local north–east–down frame. That frame turns relative to the Earth. The Earth turns relative to inertial space. How do the turning rates combine?

Apply the theorem twice, to any vector $\mathbf{a}$, across three frames $A$, $B$ and $C$:

$$
(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/A} \times \mathbf{a}, \qquad
(\dot{\mathbf{a}})_B = (\dot{\mathbf{a}})_C + \boldsymbol{\omega}_{C/B} \times \mathbf{a} .
$$

Put the second line into the first, in place of $(\dot{\mathbf{a}})_B$. The two cross products share $\mathbf{a}$, so they combine:

$$
(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_C + (\boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A}) \times \mathbf{a}.
$$

But the theorem applied directly from $A$ to $C$ says $(\dot{\mathbf{a}})_A = (\dot{\mathbf{a}})_C + \boldsymbol{\omega}_{C/A} \times \mathbf{a}$. Both hold for every $\mathbf{a}$, so

$$
\boldsymbol{\omega}_{C/A} = \boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A} .
$$

Angular velocities add like the links of a chain — $C$ relative to $B$, plus $B$ relative to $A$, gives $C$ relative to $A$ — provided all of them are written along the same axes first. After the last lesson, you would not do it any other way.

Inertial navigation uses exactly this [[stack of frames|nested-frames]]. The gyros measure the body's rate relative to inertial space. That equals the body's rate relative to north–east–down, plus the rate of north–east–down relative to the Earth (the **[[transport rate|transport-rate]]**, from moving over a curved surface), plus the Earth's own rate.

::: example A pad that sits still is still moving
Launch pad SLC-40 at Cape Canaveral has ECEF position $\mathbf{r}^{E} = (917\,832,\; -5\,530\,573,\; 3\,031\,344)\,\mathrm{m}$. (A later lesson shows how latitude and longitude turn into these numbers.) What is the pad's velocity relative to inertial space?

**Set up.** The pad is fixed to the Earth, so its rate of change in the Earth frame is zero: $(\dot{\mathbf{r}})_E = 0$. The Earth turns relative to inertial space about its $z$ axis, $\boldsymbol{\omega}^{E}_{E/I} = (0, 0, \omega_E)$ with $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. The transport theorem leaves only the rotation term.

**The cross product.** For $\boldsymbol{\omega} = (0, 0, \omega_E)$ and $\mathbf{r} = (x, y, z)$, the cross product is $\omega_E(-y, x, 0)$. Put in the numbers:

$$
(\dot{\mathbf{r}})_I = \boldsymbol{\omega}_{E/I} \times \mathbf{r} = \omega_E \begin{bmatrix} -y \\ x \\ 0 \end{bmatrix}
= \begin{bmatrix} 7.292115 \times 10^{-5} \times 5\,530\,573 \\ 7.292115 \times 10^{-5} \times 917\,832 \\ 0 \end{bmatrix}
= \begin{bmatrix} 403.3 \\ 66.9 \\ 0 \end{bmatrix} \mathrm{m/s} .
$$

(The first entry is $-y$, and $y$ is negative, so it comes out positive.) This is the inertial velocity, written along ECEF axes.

**Size and direction.** $\sqrt{403.3^2 + 66.9^2} = 408.8\,\mathrm{m/s}$. It is at right angles to both the spin axis and the pad's position, with no up-or-down part — so it points due east, as the [[view from above the North Pole|pad-velocity]] shows.

**Sanity check.** The equator moves at about $465\,\mathrm{m/s}$, and the Cape, at latitude $28.6^\circ$, is closer to the axis. $465 \times \cos 28.6^\circ \approx 408$. It matches.

A rocket sitting on that pad, before ignition, is already moving at $409\,\mathrm{m/s}$ in the inertial frame its orbit will be described in. The next lesson turns this into a launch-direction calculation.
:::

## Where the theorem shows up next

Two uses close the loop with the rigid-body module and open the next lesson.

**Euler's rotational equations.** A rigid body's angular momentum about its center of mass is $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, where $\mathbf{I}$ is the inertia matrix. Newton's law for turning says the inertial rate of change of $\mathbf{H}$ equals the applied moment (twisting force) $\mathbf{M}$. The inertia matrix is constant in body axes but changes in inertial axes, so the body frame is the easy place to take the rate of change. The transport theorem does the conversion in one step:

$$
\mathbf{M} = \left(\frac{d\mathbf{H}}{dt}\right)_I = \left(\frac{d\mathbf{H}}{dt}\right)_B + \boldsymbol{\omega} \times \mathbf{H}
= \mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega} .
$$

The gyroscopic term $\boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega}$ that drives nutation and the **[[intermediate-axis instability|tennis-racket]]** is nothing more than the rotation term of the transport theorem.

**Relative motion.** Apply the theorem to a position vector once and you get a velocity rule with one extra term. Apply it again and you get the acceleration rule with three extra terms — Coriolis, centrifugal and Euler. That is the next lesson.

::: warning Get the subscripts the right way round
The rotation term uses the angular velocity of the frame on the *right* relative to the frame on the *left*: $(\dot{\mathbf{a}})_I = (\dot{\mathbf{a}})_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$, not $\boldsymbol{\omega}_{I/B}$. Swapping the subscripts flips the sign of every Coriolis and centrifugal term downstream. Check with a body-fixed arrow: its inertial rate must be $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$, and for a spin about $+z$ an arrow along $+x$ must move toward $+y$.
:::

::: warning Put every term on the same axes first
The theorem is a relation between arrows. Before adding or comparing its terms as numbers, write every one of them along the same axes. $\boldsymbol{\omega}^{B}_{B/I}$ from a gyro and $\mathbf{a}^{I}$ from an ephemeris (a table of predicted positions) cannot be crossed together until one of them is rotated. Likewise, $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$ is only right with the rate in body axes; with the rate in inertial axes the skew matrix goes on the left.
:::

## Check yourself

::: check
A body-fixed arrow has body coordinates $\mathbf{a}^{B} = (1, 0, 0)$, and the body spins about its $z$ axis at $\boldsymbol{\omega}^{B}_{B/I} = (0, 0, 0.5)\,\mathrm{rad/s}$. What is the inertial rate of change of $\mathbf{a}$, written in body axes, and which way does the arrow's tip move?
:::

::: answer
The arrow is fixed in the body, so its body-frame rate is zero. The transport theorem leaves only the rotation term. Work the cross product one component at a time:

$$
\left(\frac{d\mathbf{a}}{dt}\right)_I = \boldsymbol{\omega}_{B/I} \times \mathbf{a} = (0, 0, 0.5) \times (1, 0, 0) = (0 \cdot 0 - 0.5 \cdot 0,\; 0.5 \cdot 1 - 0 \cdot 0,\; 0 \cdot 0 - 0 \cdot 1) = (0, 0.5, 0)\,\mathrm{rad/s} .
$$

The tip moves toward $+y$ at $0.5$ units per second. That fits the right-hand rule: a positive turn about $+z$ carries the $x$ axis toward the $y$ axis. The size also checks: $|\boldsymbol{\omega}||\mathbf{a}|\sin 90^\circ = 0.5$.
:::

::: check
Explain, without algebra, why the angular acceleration $\dot{\boldsymbol{\omega}}_{B/I}$ needs no frame label, while the rate of change of almost any other vector does.
:::

::: answer
The two observers' rates of change differ by $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. When $\mathbf{a}$ is $\boldsymbol{\omega}_{B/I}$ itself, that is a vector crossed with itself, which is zero. So the inertial and body observers agree about how the angular velocity is changing, even though they disagree about almost every other vector. The same holds for any vector that happens to point along $\boldsymbol{\omega}$ at that instant.
:::

::: check
A gimbaled antenna turns relative to the spacecraft body at $\boldsymbol{\omega}_{G/B} = (0, 0, 0.10)\,\mathrm{rad/s}$, and the body turns relative to inertial space at $\boldsymbol{\omega}_{B/I} = (0, 0.05, 0)\,\mathrm{rad/s}$, both written in body axes at this instant. What is the antenna's angular velocity relative to inertial space, and how big is it?
:::

::: answer
Angular velocities add along the chain of frames once they are on the same axes. They already are, so add component by component:

$$
\boldsymbol{\omega}_{G/I} = \boldsymbol{\omega}_{G/B} + \boldsymbol{\omega}_{B/I} = (0, 0.05, 0.10)\,\mathrm{rad/s}.
$$

The size is $\sqrt{0.05^2 + 0.10^2} = 0.112\,\mathrm{rad/s}$, about $6.4^\circ/\mathrm{s}$. The axis is tilted from the gimbal axis toward the body $y$ axis. A gyro mounted on the antenna would read this sum, not the gimbal rate alone.
:::

::: check
Starting from $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$, show that $\mathbf{R}_{I \leftarrow B}$ stays orthogonal if the equation is solved exactly. What does that mean for a computer that solves it step by step?
:::

::: answer
Write $\mathbf{R} = \mathbf{R}_{I \leftarrow B}$ and $\mathbf{W} = [\boldsymbol{\omega}^{B}_{B/I}\times]$. $\mathbf{W}$ is skew-symmetric, so $\mathbf{W}^{T} = -\mathbf{W}$. The transpose of $\dot{\mathbf{R}} = \mathbf{R}\mathbf{W}$ is $\dot{\mathbf{R}}^{T} = \mathbf{W}^{T}\mathbf{R}^{T}$. Use the product rule on $\mathbf{R}^{T}\mathbf{R}$:

$$
\frac{d}{dt}\left(\mathbf{R}^{T}\mathbf{R}\right) = \dot{\mathbf{R}}^{T}\mathbf{R} + \mathbf{R}^{T}\dot{\mathbf{R}} = \mathbf{W}^{T}\mathbf{R}^{T}\mathbf{R} + \mathbf{R}^{T}\mathbf{R}\mathbf{W} .
$$

If $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$ at some instant, the right side becomes $\mathbf{W}^{T} + \mathbf{W} = 0$. So the product never changes and stays the identity: an exact solution stays orthogonal.

A computer stepping the equation forward makes small errors each step. They pile up as a slow loss of orthogonality and of unit determinant. So an attitude propagator must re-orthogonalize the matrix from time to time — or use a representation such as the unit quaternion, where the only constraint is keeping one length equal to $1$.
:::

::: check
A vector is fixed in inertial space. What rate of change does an observer in the turning frame $B$ see? Use the answer to explain why the stars seem to move westward across the night sky.
:::

::: answer
With $(\dot{\mathbf{a}})_I = 0$, the transport theorem gives $(\dot{\mathbf{a}})_B = -\boldsymbol{\omega}_{B/I} \times \mathbf{a}$. The fixed arrow seems to turn at minus the frame's angular velocity.

The Earth turns eastward about its axis at $\omega_E$. So to an observer on the ground, every star direction seems to turn *westward* at the same rate, $7.29 \times 10^{-5}\,\mathrm{rad/s}$, tracing a circle about the celestial pole. That apparent motion is the "turning of the sky", and one full circle takes one sidereal day.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $(d\mathbf{a}/dt)_I$, $(d\mathbf{a}/dt)_B$ | Rate of change of $\mathbf{a}$ as seen from frame $I$ or frame $B$ |
| $\boldsymbol{\omega}_{B/I}$ | Angular velocity of $B$ relative to $I$; defined by $\dot{\hat{\mathbf{b}}}_i = \boldsymbol{\omega}_{B/I} \times \hat{\mathbf{b}}_i$ |
| $\left(\frac{d\mathbf{a}}{dt}\right)_I = \left(\frac{d\mathbf{a}}{dt}\right)_B + \boldsymbol{\omega}_{B/I} \times \mathbf{a}$ | The transport theorem, for any vector and any two frames |
| $\dot{\boldsymbol{\omega}}_{B/I}$ | The same in both frames; no label needed |
| Body-fixed vector | Inertial rate $\boldsymbol{\omega}_{B/I} \times \mathbf{a}$ |
| Inertially fixed vector | Body rate $-\boldsymbol{\omega}_{B/I} \times \mathbf{a}$ |
| $[\mathbf{w}\times]$ | Skew-symmetric matrix with $[\mathbf{w}\times]\mathbf{a} = \mathbf{w} \times \mathbf{a}$ |
| $\dot{\mathbf{R}}_{I \leftarrow B} = \mathbf{R}_{I \leftarrow B}[\boldsymbol{\omega}^{B}_{B/I}\times]$ | Attitude kinematics; rate in body axes, skew matrix on the right |
| $\boldsymbol{\omega}_{C/A} = \boldsymbol{\omega}_{C/B} + \boldsymbol{\omega}_{B/A}$ | Angular velocities add along a chain of frames, on common axes |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega} = \mathbf{M}$ | Euler's equations, from the theorem applied to $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ |

Next lesson: apply the theorem twice to the position of a point. Out come the velocity and acceleration rules between an inertial frame and a turning one — the equations that carry the Coriolis, centrifugal and Euler terms.

::: context rotating-arrow A spinning arrow, seen from above
The frame spins counterclockwise about an axis pointing out of the page. The unit arrow $b_1$ turns with it. Its tip can only move sideways — at right angles to the arrow — because its length is fixed at $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="110" r="90" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="130" cy="110" r="9" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="130" cy="110" r="3" fill="#1f2a44"/>
  <text x="96" y="140" font-size="12" fill="#1f2a44">ω (out of page)</text>
  <line x1="130" y1="110" x2="210" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="220,110 208,104 208,116" fill="#1d6fd1"/>
  <text x="170" y="126" font-size="13" fill="#1d6fd1">b₁ now</text>
  <line x1="130" y1="110" x2="199.3" y2="70" stroke="#8fb8f0" stroke-width="3"/>
  <polygon points="207.9,65 194.4,65.8 200.4,76.2" fill="#8fb8f0"/>
  <text x="212" y="62" font-size="12" fill="#6c7a93">a moment later</text>
  <line x1="220" y1="110" x2="220" y2="48" stroke="#b4232c" stroke-width="3"/>
  <polygon points="220,38 214,50 226,50" fill="#b4232c"/>
  <text x="230" y="100" font-size="13" fill="#b4232c">rate = ω × b₁</text>
</svg>
```

The red arrow, $\boldsymbol{\omega} \times \hat{\mathbf{b}}_1$, is at right angles to both the spin axis and $b_1$. Its length is $\omega$ times the arrow's length, which is $1$.
:::

::: context kronecker A compact way to say "one or zero"
The **Kronecker delta**, $\delta_{ij}$ (read "delta i j"), is a shorthand named after the 19th-century German mathematician Leopold Kronecker. It equals $1$ when the two labels match and $0$ when they differ: $\delta_{11} = 1$, $\delta_{12} = 0$.

So "$\hat{\mathbf{b}}_i \cdot \hat{\mathbf{b}}_j = \delta_{ij}$" packs nine facts into one line: each axis has length $1$, and every pair of different axes is perpendicular. The table of all nine $\delta_{ij}$ values is the identity matrix.
:::

::: context skew-symmetric What "skew-symmetric" means
A square table of numbers is **symmetric** if flipping it across its main diagonal leaves it unchanged. It is **skew-symmetric** if flipping it changes every sign: entry $(i, j)$ equals minus entry $(j, i)$.

The diagonal entries must then equal minus themselves, so they are all zero. For a 3 × 3 table that leaves only three free numbers — the three above the diagonal. That is why a skew-symmetric 3 × 3 matrix and a 3-vector carry exactly the same information, and why $[\mathbf{w}\times]$ can stand in for $\mathbf{w}$.
:::

::: context spin-stabilized Spinning to stay steady
A spinning top resists being tipped over, and so does a spinning spacecraft. Spin it about a suitable axis and it holds that direction in space with no active control at all. Many early satellites worked this way, and so do some deep-space probes: NASA's Juno spins at a few revolutions per minute as it orbits Jupiter.

The price is that anything bolted to the side — a camera, an antenna — sweeps round the sky once per turn, which is exactly the problem the example measures.
:::

::: context star-scanner Timing the stars instead of photographing them
A slit star scanner looks through a narrow slit. As the spacecraft spins, each star flashes across the slit and the detector records the moment it passes. From those timings, the known spin rate and a star catalog, the computer works out which way the spin axis points.

Because the sensor only needs a *time*, smearing does not hurt it the way it hurts a camera. Spinning spacecraft have used star scanners and Sun sensors for exactly this reason.
:::

::: context quaternion-bridge Why quaternions come next
A rotation matrix has nine numbers but only three are free: the other six are tied down by the rule $\mathbf{R}^{T}\mathbf{R} = \mathbf{I}_3$. When a computer steps the attitude equation forward, small errors slowly break that rule, and the matrix must be repaired.

A **quaternion** describes the same rotation with four numbers and only one rule — its length must be $1$. Keeping that one rule is cheap, the numbers never hit a singular point, and the stepping equation is simpler. That is why most flight software stores attitude as a quaternion. The next module builds them.
:::

::: context nested-frames A stack of turning frames
Each frame turns relative to the one below it. The gyro measures the total, and the total is the sum of every link, all written on the same axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <rect x="110" y="8" width="140" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="180" y="27">body B</text>
    <rect x="110" y="62" width="140" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="180" y="81">north–east–down N</text>
    <rect x="110" y="116" width="140" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="180" y="135">Earth E</text>
    <rect x="110" y="170" width="140" height="28" rx="5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="180" y="189">inertial I</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="180" y1="62" x2="180" y2="42"/><line x1="180" y1="116" x2="180" y2="96"/><line x1="180" y1="170" x2="180" y2="150"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="180,36 175,46 185,46"/><polygon points="180,90 175,100 185,100"/><polygon points="180,144 175,154 185,154"/>
  </g>
  <g font-size="12" fill="#1d6fd1">
    <text x="190" y="54">ω_B/N</text><text x="190" y="108">ω_N/E  (transport rate)</text><text x="190" y="162">ω_E/I  (Earth rate)</text>
  </g>
  <text x="8" y="100" font-size="12" fill="#b4232c">ω_B/I = sum</text>
</svg>
```

$\boldsymbol{\omega}_{B/I} = \boldsymbol{\omega}_{B/N} + \boldsymbol{\omega}_{N/E} + \boldsymbol{\omega}_{E/I}$ — the chain rule for turning rates.
:::

::: context transport-rate Why "north" turns as you travel
Fly due east around the Earth. Your local "north" and "down" directions are tied to the ground beneath you, and the ground curves. After a quarter of the way round the equator, "down" points in a direction $90^\circ$ from where it started — even though the Earth's own spin has been left out.

That turning of the local north–east–down frame, caused only by moving over a curved surface, is the **transport rate**. Its size is roughly your ground speed divided by the Earth's radius. For an airliner at $250\,\mathrm{m/s}$ that is about $4 \times 10^{-5}\,\mathrm{rad/s}$ — comparable to the Earth's rotation, so an inertial navigator must include it.
:::

::: context pad-velocity The Cape, seen from above the North Pole
Looking down on the North Pole, the Earth turns counterclockwise. The pad's position (projected onto the equator plane) points from the center toward the Cape; its velocity $\boldsymbol{\omega}_E \times \mathbf{r}$ is at right angles to that — due east.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="105" r="85" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="105" x2="290" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <text x="294" y="109" font-size="12" fill="#6c7a93">x</text>
  <line x1="180" y1="105" x2="180" y2="10" stroke="#6c7a93" stroke-width="1"/>
  <text x="185" y="16" font-size="12" fill="#6c7a93">y</text>
  <circle cx="180" cy="105" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="105" r="2.5" fill="#1f2a44"/>
  <text x="120" y="98" font-size="12" fill="#1f2a44">ω_E</text>
  <path d="M 105 60 A 85 85 0 0 0 105 150" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="105,150 97,138 110,140" fill="#6c7a93"/>
  <line x1="180" y1="105" x2="192.2" y2="178.7" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="192.2" cy="178.7" r="4" fill="#1d6fd1"/>
  <text x="140" y="200" font-size="12" fill="#1d6fd1">pad, 80.6° W</text>
  <line x1="192.2" y1="178.7" x2="251.4" y2="168.9" stroke="#b4232c" stroke-width="3"/>
  <polygon points="261.3,167.2 248.9,162.9 250.9,174.7" fill="#b4232c"/>
  <text x="256" y="188" font-size="12" fill="#b4232c">409 m/s east</text>
</svg>
```

The red arrow's parts, $(403.3, 66.9)\,\mathrm{m/s}$ along $x$ and $y$, tilt it $9.4^\circ$ from the $x$ axis — exactly at right angles to the pad direction at $-80.6^\circ$.
:::

::: context tennis-racket The tumbling wing nut
Throw a tennis racket or a phone in the air spinning end over end, and it flips over halfway through, every time. Spin about the longest axis or the shortest axis is steady. Spin about the middle axis is not.

In 1985 the cosmonaut Vladimir Dzhanibekov saw a wing nut on the Salyut 7 station spin off its bolt and flip back and forth every few seconds. It is the same effect, and it falls straight out of the $\boldsymbol{\omega} \times \mathbf{I}\boldsymbol{\omega}$ term. Spacecraft designers must know about it: a satellite spun about its middle axis will not stay put.
:::
