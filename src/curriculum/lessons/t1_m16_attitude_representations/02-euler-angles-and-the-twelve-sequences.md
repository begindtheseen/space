---
id: l02-euler-angles-and-the-twelve-sequences
title: Euler angles, the twelve sequences and the 3-2-1 aerospace convention
minutes: 19
covers:
  - Euler angles, the twelve sequences, the 3-2-1 aerospace sequence
---

Three degrees of freedom invite three numbers, and the oldest way of choosing them is to build the attitude out of three turns about coordinate axes. Yaw the vehicle, then pitch it, then roll it, and record the three angles. That is an Euler-angle set, and it is the only representation a person can read directly: a pilot's attitude indicator, a launch pad's pitch programme, a ground controller's display of where a spacecraft is pointing are all Euler angles, because "pitch $50$ degrees, heading $15$ degrees" means something to a human and a quaternion does not.

The convenience comes with two hard edges. The first is that there are twelve valid sequences and nothing in the numbers tells you which one produced them, so "roll, pitch, yaw = $(5, 50, 15)$ degrees" is not an attitude until the sequence is named. The second is gimbal lock, the subject of the next lesson. This lesson builds the machinery: how a sequence defines a DCM, what the twelve choices are, why the aerospace world settled on 3-2-1, and how to get the angles back out of a matrix without losing a quadrant.

Everything here uses the conventions of lesson 01: $\mathbf{v}^{A} = \mathbf{C}_{A\leftarrow B}\mathbf{v}^{B}$, and the elementary coordinate transformations of module 15,

$$
\mathbf{R}_1(\alpha) = \begin{bmatrix} 1 & 0 & 0\\ 0 & \cos\alpha & \sin\alpha\\ 0 & -\sin\alpha & \cos\alpha\end{bmatrix},\quad
\mathbf{R}_2(\alpha) = \begin{bmatrix} \cos\alpha & 0 & -\sin\alpha\\ 0 & 1 & 0\\ \sin\alpha & 0 & \cos\alpha\end{bmatrix},\quad
\mathbf{R}_3(\alpha) = \begin{bmatrix} \cos\alpha & \sin\alpha & 0\\ -\sin\alpha & \cos\alpha & 0\\ 0 & 0 & 1\end{bmatrix},
$$

each of which transforms components into a frame rotated through $+\alpha$ about axis $1$, $2$ or $3$.

## A sequence is three turns about moving axes

Start with the body frame coincident with the reference frame $N$. Turn through $\alpha_1$ about reference axis $k_1$, reaching an intermediate frame $F_1$. Turn through $\alpha_2$ about the **new** frame's axis $k_2$, reaching $F_2$. Turn through $\alpha_3$ about $F_2$'s axis $k_3$, reaching the body frame $B$. Each turn is about an axis of the frame produced by the previous turn, which is what "intrinsic" or "body-fixed" means.

Chaining the transformations in lesson 01's domino order,

$$
\mathbf{C}_{B\leftarrow N} = \mathbf{C}_{B\leftarrow F_2}\,\mathbf{C}_{F_2\leftarrow F_1}\,\mathbf{C}_{F_1\leftarrow N}
= \mathbf{R}_{k_3}(\alpha_3)\,\mathbf{R}_{k_2}(\alpha_2)\,\mathbf{R}_{k_1}(\alpha_1).
$$

Read the product right to left and it is the order the turns happen in. Write it left to right and it is the order the matrices appear. Both orders are correct and they are opposite, which is the single commonest source of confusion in this material.

## Why there are exactly twelve

The first axis $k_1$ can be any of $1, 2, 3$. The second must differ from the first, or the two turns would merge into one about a single axis and only two angles would remain — that is two choices. The third must differ from the second, for the same reason, but may repeat the first — two choices again. So

$$
3\times 2\times 2 = 12
$$

sequences, and they fall into two families.

- **Symmetric**, sometimes called proper Euler sequences, where $k_3 = k_1$: **3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2**. The second angle is a tilt between two axes of the same name, so its natural range is $[0^\circ, 180^\circ]$ and the sequence degenerates at $\alpha_2 = 0^\circ$ and $180^\circ$, where the first and third axes coincide.
- **Asymmetric**, also called Tait–Bryan or Cardan angles, where all three axes differ: **1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1**. The second angle ranges over $[-90^\circ, 90^\circ]$ and the sequence degenerates at $\alpha_2 = \pm 90^\circ$.

Both families are in daily use. The classical orbital elements are a 3-1-3 set — right ascension of the ascending node about $z$, inclination about the new $x$, argument of periapsis about the new $z$ — which is why a zero-inclination orbit has an undefined node. Spin-stabilised spacecraft are usually described with 3-1-3 as well, because the last angle is then the spin phase. Aircraft, launch vehicles and most spacecraft control laws use 3-2-1.

::: key The twelve Euler sequences
Three choices for the first axis, two for the second, two for the third gives twelve sequences. Six are symmetric ($k_1 = k_3$: 3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2) with middle angle in $[0^\circ,180^\circ]$ and singularities at its ends; six are asymmetric ($k_1\neq k_2\neq k_3$, all distinct: 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1) with middle angle in $[-90^\circ,90^\circ]$ and singularities at $\pm 90^\circ$. The DCM is $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_{k_3}(\alpha_3)\mathbf{R}_{k_2}(\alpha_2)\mathbf{R}_{k_1}(\alpha_1)$.
:::

## The 3-2-1 aerospace sequence

Yaw $\psi$ about the reference $z$ axis, then pitch $\theta$ about the new $y$, then roll $\phi$ about the new $x$:

$$
\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(\phi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_3(\psi).
$$

Multiplying out, with $c$ and $s$ for cosine and sine,

$$
\mathbf{C}_{B\leftarrow N} =
\begin{bmatrix}
c\theta\,c\psi & c\theta\,s\psi & -s\theta\\
s\phi\,s\theta\,c\psi - c\phi\,s\psi & s\phi\,s\theta\,s\psi + c\phi\,c\psi & s\phi\,c\theta\\
c\phi\,s\theta\,c\psi + s\phi\,s\psi & c\phi\,s\theta\,s\psi - s\phi\,c\psi & c\phi\,c\theta
\end{bmatrix}.
$$

The conventional ranges are $\psi\in(-180^\circ, 180^\circ]$, $\theta\in[-90^\circ, 90^\circ]$ and $\phi\in(-180^\circ, 180^\circ]$. Restricting $\theta$ to half a turn is what makes the set unique: allowing $\theta$ beyond $\pm 90^\circ$ would let two different triples describe the same attitude.

The sequence is the aerospace standard because each angle survives as a separate, meaningful quantity for a vehicle whose body $x$ axis points along its length. Applied to a north-east-down reference frame, $\psi$ is the **heading**, $\theta$ is the **elevation of the nose above the horizon**, and $\phi$ is the **bank**. Three of the matrix entries make that legible on sight: $\mathbf{C}_{B\leftarrow N}$ has $-\sin\theta$ in position $(1,3)$, and its first row is the body $x$ axis resolved in reference axes, so the nose's elevation is read off one number.

### Getting the angles back out

Invert the explicit matrix by picking entries that isolate one angle at a time. Write $\mathbf{C} = \mathbf{C}_{B\leftarrow N}$ with entries $C_{ij}$ indexed from one:

$$
\psi = \operatorname{atan2}(C_{12},\,C_{11}), \qquad
\theta = -\arcsin\!\left(C_{13}\right), \qquad
\phi = \operatorname{atan2}(C_{23},\,C_{33}).
$$

Three rules make this robust.

1. **Use `atan2`, never `atan` of a ratio.** $C_{12}/C_{11} = \tan\psi$ loses the quadrant: a heading of $135^\circ$ and one of $-45^\circ$ give the same ratio. Passing numerator and denominator separately keeps both signs and recovers the full circle.
2. **Clamp the arcsine argument to $[-1, 1]$.** Round-off in a propagated matrix routinely produces $C_{13} = -1.0000000000000002$, and `asin` of that is not a number. One clamp turns a mission-ending NaN into an error of $10^{-8}$ radians.
3. **Divide by $\cos\theta$ nowhere.** The two `atan2` calls above are already scaled by $\cos\theta$ in both arguments, and `atan2` is indifferent to a common positive factor. Near $\theta = \pm 90^\circ$ both arguments go to zero together and the answer becomes noise rather than infinity — which is the subject of the next lesson.

::: example Reading a launch vehicle's attitude out of its DCM
A vehicle in a gravity turn is at heading $\psi = 15^\circ$, pitch $\theta = 50^\circ$ and bank $\phi = 5^\circ$ relative to a launch-site north-east-down frame. Building $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(5^\circ)\mathbf{R}_2(50^\circ)\mathbf{R}_3(15^\circ)$,

$$
\mathbf{C}_{B\leftarrow N} =
\begin{bmatrix}
0.620885 & 0.166366 & -0.766044\\
-0.193344 & 0.979530 & 0.056023\\
0.759684 & 0.113326 & 0.640342
\end{bmatrix},
\qquad \det = 1.0000000 .
$$

The first row is the nose direction in north-east-down components. Its third component is $-0.766044 = -\sin 50^\circ$, so the nose is $\arcsin(0.766044) = 50.0^\circ$ above the horizon: the pitch angle, visible as one entry.

Now use the matrix. The vehicle's inertial velocity is $1500\,\mathrm{m/s}$ on a flight path angle of $47^\circ$ and a ground heading of $18^\circ$, which in north-east-down components is

$$
\mathbf{v}^{N} = (972.93,\ 316.12,\ -1097.03)\,\mathrm{m/s}.
$$

In body axes, $\mathbf{v}^{B} = \mathbf{C}_{B\leftarrow N}\mathbf{v}^{N} = (1497.04,\ 60.08,\ 72.47)\,\mathrm{m/s}$, with the same magnitude $1500.00\,\mathrm{m/s}$. The vehicle is flying $3.60^\circ$ off its own nose: angle of attack $\alpha = \operatorname{atan2}(72.47, 1497.04) = 2.77^\circ$ and sideslip $\beta = \arcsin(60.08/1500) = 2.30^\circ$. Those two numbers drive the aerodynamic loads, and they exist only because the body attitude and the velocity are expressed in the same frame. Feeding the extraction formulas back the matrix returns $(15.000^\circ, 50.000^\circ, 5.000^\circ)$ — the round trip closes.
:::

::: example The same three numbers in a different sequence
Take $(15^\circ, 50^\circ, 5^\circ)$ again but interpret them as a 1-2-3 sequence: roll $15^\circ$ about $x$, then $50^\circ$ about the new $y$, then $5^\circ$ about the new $z$, so $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_3(5^\circ)\mathbf{R}_2(50^\circ)\mathbf{R}_1(15^\circ)$:

$$
\begin{bmatrix}
0.640342 & 0.281698 & -0.714569\\
-0.056023 & 0.944970 & 0.322324\\
0.766044 & -0.166366 & 0.620885
\end{bmatrix}.
$$

It is a perfectly valid DCM — orthonormal, determinant $+1$ — and it is a different attitude. The relative rotation between the two results, $\mathbf{C}_{321}\mathbf{C}_{123}^{\top}$, has trace $2.907028$, so the principal angle between them is

$$
\Phi = \arccos\frac{2.907028 - 1}{2} = 17.54^\circ .
$$

Seventeen and a half degrees of pointing error from reading three numbers in the wrong order. And the error is not detectable from the numbers: read the 1-2-3 matrix with the 3-2-1 extraction formulas and you get $(23.75^\circ, 45.61^\circ, 27.44^\circ)$, a plausible-looking attitude with no sign that anything is wrong. This is why every interface that carries Euler angles must carry the sequence with them.
:::

::: warning Euler angles without a named sequence are not data
A message field called `roll_pitch_yaw` tells you nothing. You need four facts: the three axis indices in order, whether the turns are about body axes or fixed axes, which frame is the reference, and the sign convention of each angle. Aerospace 3-2-1 relative to north-east-down is common but not universal: robotics often uses fixed-axis 1-2-3 relative to an east-north-up frame, and photogrammetry uses 3-1-3. Two systems can exchange three floating-point numbers happily for years and be describing different vehicles.
:::

### Intrinsic and extrinsic are the same sequences, reversed

Turning about the moving body axes is called **intrinsic**; turning about the fixed reference axes is **extrinsic**. They are not two different families of representation — each intrinsic sequence equals an extrinsic sequence with the axes and angles in the opposite order.

The reason is visible in the matrices. An intrinsic 3-2-1 gives $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$. Transposing to the attitude matrix of lesson 01,

$$
\mathbf{C}_{N\leftarrow B} = \mathbf{R}_3(\psi)^{\top}\,\mathbf{R}_2(\theta)^{\top}\,\mathbf{R}_1(\phi)^{\top},
$$

a product of three *operators* that turn vectors about the fixed reference axes $z$, then $y$, then $x$, applied right to left: roll first, then pitch, then yaw, all about unmoving axes. So intrinsic 3-2-1 with angles $(\psi, \theta, \phi)$ is identical to extrinsic 1-2-3 with angles $(\phi, \theta, \psi)$. The rule generalises: reverse the axis order and the angle order together. Twelve sequences, read either way, twenty-four names for twelve things.

## Check yourself

::: check
List the twelve sequences and explain why 1-1-2 and 2-3-3 are not among them.
:::

::: answer
Symmetric: 1-2-1, 1-3-1, 2-1-2, 2-3-2, 3-1-3, 3-2-3. Asymmetric: 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1. A sequence with two *consecutive* turns about the same axis is excluded because those two turns combine into a single rotation about that axis through the sum of the angles — 1-1-2 is really a two-angle set with one redundant parameter, so it cannot reach every attitude. Repetition is allowed only when the two turns are separated, as in 1-2-1, where the intermediate turn moves the axis between them.
:::

::: check
A DCM has $C_{13} = -0.5$, $C_{11} = 0.75$, $C_{12} = 0.433$, $C_{23} = 0.354$, $C_{33} = 0.789$. Extract the 3-2-1 angles.
:::

::: answer
$\theta = -\arcsin(-0.5) = 30.0^\circ$. $\psi = \operatorname{atan2}(0.433, 0.75) = 30.0^\circ$, since $\tan\psi = 0.5773$. $\phi = \operatorname{atan2}(0.354, 0.789) = 24.2^\circ$. Sanity check on the first row: $C_{11}^2 + C_{12}^2 + C_{13}^2 = 0.5625 + 0.1875 + 0.25 = 1.0000$, so the row is a unit vector and the extraction is self-consistent. Note that $C_{11} = \cos\theta\cos\psi = 0.866\times 0.866 = 0.750$ and $C_{12} = \cos\theta\sin\psi = 0.866\times 0.5 = 0.433$, both confirmed.
:::

::: check
Your colleague's code computes $\psi = \arctan(C_{12}/C_{11})$. For which attitudes does it give the wrong answer, and by how much?
:::

::: answer
`atan` returns a value in $(-90^\circ, 90^\circ)$, so it cannot distinguish $\psi$ from $\psi \pm 180^\circ$. Whenever $C_{11} = \cos\theta\cos\psi$ is negative — that is, whenever $\lvert\psi\rvert > 90^\circ$, since $\cos\theta \ge 0$ over the allowed pitch range — the answer is wrong by exactly $180^\circ$. A vehicle heading south returns a heading of north. The failure is silent, it appears only on half the compass, and integration tests flown around zero heading never see it.
:::

::: check
Show that intrinsic 3-1-3 with angles $(\Omega, i, \omega)$ equals extrinsic 3-1-3 with angles $(\omega, i, \Omega)$, and say what that means for the classical orbital elements.
:::

::: answer
Intrinsic 3-1-3 gives $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_3(\omega)\mathbf{R}_1(i)\mathbf{R}_3(\Omega)$. Transposing, $\mathbf{C}_{N\leftarrow B} = \mathbf{R}_3(\Omega)^\top\mathbf{R}_1(i)^\top\mathbf{R}_3(\omega)^\top$, which is a product of operators about the fixed reference axes $3$, then $1$, then $3$, applied right to left: $\omega$ about fixed $z$, then $i$ about fixed $x$, then $\Omega$ about fixed $z$. So the axis list reverses to 3-1-3, which is the same list because the sequence is symmetric, and the angle list reverses to $(\omega, i, \Omega)$. For orbital elements it means the perifocal-to-inertial transformation can be read either as "swing the orbit plane up by $i$ and round by $\Omega$" or as "place periapsis at $\omega$ in a reference plane and then tilt". Both descriptions produce the same matrix, and texts differ in which they use.
:::

::: check
Why does restricting $\theta$ to $[-90^\circ, 90^\circ]$ make the 3-2-1 set unique, and what happens to $\psi$ and $\phi$ if you do not?
:::

::: answer
The extraction reads $\theta$ from $-\arcsin(C_{13})$, and $\arcsin$ returns a value in $[-90^\circ, 90^\circ]$; the other solution of $\sin\theta = -C_{13}$ is $180^\circ - \theta$. Taking that second branch flips the sign of $\cos\theta$, which flips the signs of $C_{11}, C_{12}, C_{23}, C_{33}$ as read through the extraction, and so shifts both $\psi$ and $\phi$ by $180^\circ$. So the triple $(\psi \pm 180^\circ,\ 180^\circ - \theta,\ \phi \pm 180^\circ)$ describes the identical attitude. Restricting $\theta$ selects one of the two, and without the restriction any attitude has two valid Euler representations, which breaks any code that differences two angle sets to get an error.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_{k_3}(\alpha_3)\mathbf{R}_{k_2}(\alpha_2)\mathbf{R}_{k_1}(\alpha_1)$ | Intrinsic sequence; matrices left to right, turns right to left |
| Twelve sequences | $3\times2\times2$; six symmetric, six asymmetric |
| Symmetric ($k_1=k_3$) | 3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2; $\alpha_2\in[0^\circ,180^\circ]$ |
| Asymmetric (all distinct) | 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1; $\alpha_2\in[-90^\circ,90^\circ]$ |
| 3-2-1 | Yaw $\psi$, pitch $\theta$, roll $\phi$; $\mathbf{C}_{B\leftarrow N}=\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$ |
| $\psi = \operatorname{atan2}(C_{12},C_{11})$ | Heading, full circle |
| $\theta = -\arcsin(C_{13})$ | Pitch; clamp the argument to $[-1,1]$ |
| $\phi = \operatorname{atan2}(C_{23},C_{33})$ | Bank, full circle |
| Intrinsic $\leftrightarrow$ extrinsic | Reverse both the axis order and the angle order |
| Worked figure | Reading $(15^\circ,50^\circ,5^\circ)$ as 1-2-3 instead of 3-2-1 misses by $17.54^\circ$ |

Three angles, one matrix, and a restriction on $\theta$ that keeps the map one-to-one. The next lesson asks what happens as $\theta$ approaches the edge of that restriction, where the first and third axes line up and one degree of freedom disappears.
