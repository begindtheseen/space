---
id: l02-euler-angles-and-the-twelve-sequences
title: Euler angles, the twelve sequences and the 3-2-1 aerospace convention
minutes: 18
covers:
  - Euler angles, the twelve sequences, the 3-2-1 aerospace sequence
---

Pick up a toy airplane that is sitting level on a table, nose pointing north. To put it in any attitude you like, you can do three turns. First turn it flat on the table until the nose points the heading you want. Then tip the nose up. Then twist it about its own nose to bank the wings. Write down the three amounts and anyone can repeat the pose exactly.

Those three numbers are an **[[Euler|euler-history]]-angle set** — an attitude built from three turns in a row, each about one axis. Lesson 01 showed that attitude has three degrees of freedom, and Euler angles spend them in the most human way possible. They are the only representation a person can read directly. A pilot's attitude indicator, a launch vehicle's pitch program and a ground controller's display all show Euler angles, because "pitch $50$ degrees, heading $15$ degrees" means something to a person and a quaternion does not.

The convenience comes with two hard edges. First, there are twelve valid orders of turns, and nothing in the three numbers tells you which one produced them. "Roll, pitch, yaw $= (5, 50, 15)$ degrees" is not an attitude until the order is named. Second, there is gimbal lock, the subject of the next lesson. This lesson builds the machinery: how an order of turns defines a DCM, what the twelve choices are, why aerospace settled on the order called 3-2-1, and how to get the angles back out of a matrix without landing in the wrong quarter of the circle.

Everything here uses the conventions of lesson 01: $\mathbf{v}^{A} = \mathbf{C}_{A\leftarrow B}\mathbf{v}^{B}$. It also uses the three single-axis coordinate transformations of module 15:

$$
\mathbf{R}_1(\alpha) = \begin{bmatrix} 1 & 0 & 0\\ 0 & \cos\alpha & \sin\alpha\\ 0 & -\sin\alpha & \cos\alpha\end{bmatrix},\quad
\mathbf{R}_2(\alpha) = \begin{bmatrix} \cos\alpha & 0 & -\sin\alpha\\ 0 & 1 & 0\\ \sin\alpha & 0 & \cos\alpha\end{bmatrix},\quad
\mathbf{R}_3(\alpha) = \begin{bmatrix} \cos\alpha & \sin\alpha & 0\\ -\sin\alpha & \cos\alpha & 0\\ 0 & 0 & 1\end{bmatrix}.
$$

Read $\mathbf{R}_1(\alpha)$ as "R one of alpha". Each one converts components into a frame turned through $+\alpha$ about axis $1$, $2$ or $3$ — that is, about $x$, $y$ or $z$. Each leaves its own axis alone, which is why each has a lone $1$ on the diagonal.

## A sequence is three turns about moving axes

Go back to the toy airplane. When you tip the nose up, you tip it about the airplane's own wing line — wherever the first turn left the wings — not about some fixed line in the room. When you bank, you twist about the airplane's own nose, wherever the first two turns left it. Each turn uses an axis that the earlier turns have already moved.

Here is the precise recipe. Start with the body frame lined up with the reference frame $N$.

1. Turn through $\alpha_1$ about reference axis $k_1$. Call the result the first in-between frame, $F_1$.
2. Turn through $\alpha_2$ about axis $k_2$ **of $F_1$**. Call the result $F_2$.
3. Turn through $\alpha_3$ about axis $k_3$ **of $F_2$**. The result is the body frame $B$.

Here $k_1, k_2, k_3$ are axis numbers ($1$, $2$ or $3$), and $\alpha_1, \alpha_2, \alpha_3$ are the three angles. Turning about axes that move with the body is called **intrinsic**, or body-fixed.

Chain the three transformations in lesson 01's domino order:

$$
\mathbf{C}_{B\leftarrow N} = \mathbf{C}_{B\leftarrow F_2}\,\mathbf{C}_{F_2\leftarrow F_1}\,\mathbf{C}_{F_1\leftarrow N}
= \mathbf{R}_{k_3}(\alpha_3)\,\mathbf{R}_{k_2}(\alpha_2)\,\mathbf{R}_{k_1}(\alpha_1).
$$

Read the product right to left and you get the order the turns happen in. Read it left to right and you get the order the matrices are written in. Both readings are correct, and they are opposite. That single fact is the commonest source of confusion in this whole subject, so say it to yourself once: *the first turn is written last*.

## Why there are exactly twelve

Count the choices, the way you would count outfits from shirts and pants.

- The first axis $k_1$ can be any of $1, 2, 3$: **three** choices.
- The second axis must differ from the first. Two turns in a row about the same axis would merge into one turn through the sum of the angles, leaving only two useful angles. So **two** choices.
- The third axis must differ from the second, for the same reason, but it may repeat the first: **two** choices again.

Multiply the choices:

$$
3\times 2\times 2 = 12
$$

[[sequences|twelve-tree]]. They fall into two families.

- **Symmetric** sequences, sometimes called proper Euler sequences, repeat the first axis at the end ($k_3 = k_1$): **3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2**. The middle angle is a tilt between two axes with the same name, so it runs over $[0^\circ, 180^\circ]$. The sequence breaks down at the two ends of that range, $\alpha_2 = 0^\circ$ and $180^\circ$, where the first and third axes line up.
- **Asymmetric** sequences, also called **[[Tait–Bryan|tait-bryan]]** or Cardan angles, use three different axes: **1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1**. The middle angle runs over $[-90^\circ, 90^\circ]$, and the sequence breaks down at $\alpha_2 = \pm 90^\circ$.

Both families are used every day. The **[[classical orbital elements|orbital-elements]]** are a 3-1-3 set: the longitude of the ascending node about $z$, then the inclination about the new $x$, then the argument of periapsis about the new $z$. That is why a zero-inclination orbit has an undefined node — it sits exactly at a breakdown point of 3-1-3. Spinning spacecraft usually use 3-1-3 too, because the last angle is then the spin position. Aircraft, launch vehicles and most spacecraft control laws use 3-2-1.

::: key The twelve Euler sequences
Three choices for the first axis, two for the second, two for the third gives twelve sequences. Six are symmetric ($k_1 = k_3$: 3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2) with middle angle in $[0^\circ,180^\circ]$ and singularities at its ends; six are asymmetric ($k_1\neq k_2\neq k_3$, all distinct: 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1) with middle angle in $[-90^\circ,90^\circ]$ and singularities at $\pm 90^\circ$. The DCM is $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_{k_3}(\alpha_3)\mathbf{R}_{k_2}(\alpha_2)\mathbf{R}_{k_1}(\alpha_1)$.
:::

## The 3-2-1 aerospace sequence

This is the toy airplane recipe with names. Turn through the **yaw** angle $\psi$ ("psi") about the reference $z$ axis. Then through the **pitch** angle $\theta$ ("theta") about the new $y$ axis. Then through the **roll** angle $\phi$ ("phi") about the new $x$ axis. The three axes are [[the airplane's own|body-axes]]: $x$ out the nose, $y$ out the right wing, $z$ out the belly. The first turn is written last:

$$
\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(\phi)\,\mathbf{R}_2(\theta)\,\mathbf{R}_3(\psi).
$$

Multiply it out. Write $c$ for cosine and $s$ for sine, so $c\theta$ means $\cos\theta$:

$$
\mathbf{C}_{B\leftarrow N} =
\begin{bmatrix}
c\theta\,c\psi & c\theta\,s\psi & -s\theta\\
s\phi\,s\theta\,c\psi - c\phi\,s\psi & s\phi\,s\theta\,s\psi + c\phi\,c\psi & s\phi\,c\theta\\
c\phi\,s\theta\,c\psi + s\phi\,s\psi & c\phi\,s\theta\,s\psi - s\phi\,c\psi & c\phi\,c\theta
\end{bmatrix}.
$$

The usual ranges are $\psi\in(-180^\circ, 180^\circ]$, $\theta\in[-90^\circ, 90^\circ]$ and $\phi\in(-180^\circ, 180^\circ]$. Limiting $\theta$ to half a turn is what makes the three numbers unique. If $\theta$ could go past $\pm 90^\circ$, two different triples would describe the same attitude.

Why did aerospace pick this order? Because for a vehicle whose body $x$ axis runs along its length, each angle keeps a separate, useful meaning. Measured from a **[[north-east-down|ned-frame]]** reference frame, $\psi$ is the **heading** (which compass direction the nose points), $\theta$ is the **elevation of the nose above the horizon**, and $\phi$ is the **bank** (how far the wings are tipped).

You can see that in the matrix. Its first row is the body $x$ axis — the nose — written in reference components (row $i$ of $\mathbf{C}_{B\leftarrow N}$ is body axis $i$ in $N$, from lesson 01). The third number of that row is the nose's "down" component, and it is $-\sin\theta$. So the nose elevation can be read off a single entry.

### Getting the angles back out

Now run it backward: given the nine numbers, find the three angles. Pick entries that each involve only one unknown angle, or one angle times a common factor. Call the matrix $\mathbf{C} = \mathbf{C}_{B\leftarrow N}$, with $C_{ij}$ the entry in row $i$, column $j$, counting from one:

$$
\psi = \operatorname{atan2}(C_{12},\,C_{11}), \qquad
\theta = -\arcsin\!\left(C_{13}\right), \qquad
\phi = \operatorname{atan2}(C_{23},\,C_{33}).
$$

Check them against the matrix. $C_{12}/C_{11} = (c\theta\,s\psi)/(c\theta\,c\psi) = \tan\psi$. $C_{13} = -\sin\theta$. $C_{23}/C_{33} = (s\phi\,c\theta)/(c\phi\,c\theta) = \tan\phi$. Three rules make these formulas safe in flight software.

1. **Use `atan2`, never `atan` of a ratio.** $C_{12}/C_{11} = \tan\psi$ loses the quarter of the circle: a heading of $135^\circ$ and one of $-45^\circ$ give the same ratio. [[`atan2`|atan2-bridge]] takes the top and the bottom separately, keeps both signs, and returns the full circle.
2. **Clamp the arcsine input to $[-1, 1]$.** Round-off in a matrix that has been updated many times often produces something like $C_{13} = -1.0000000000000002$. The arcsine of that is not a number — the computer returns **[[NaN|nan]]**. One line that clamps the input into $[-1, 1]$ turns a mission-ending NaN into an error of about $10^{-8}$ radians.
3. **Divide by $\cos\theta$ nowhere.** Both `atan2` calls have $\cos\theta$ as a factor in both inputs, and `atan2` ignores a shared positive factor. Near $\theta = \pm 90^\circ$ both inputs shrink to zero together, and the answer turns into noise instead of infinity. That noise is the subject of the next lesson.

::: key Extracting 3-2-1 angles
From $\mathbf{C} = \mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$: $\psi = \operatorname{atan2}(C_{12}, C_{11})$, $\theta = -\arcsin(C_{13})$ with the input clamped to $[-1,1]$, $\phi = \operatorname{atan2}(C_{23}, C_{33})$. Use atan2 twice and never divide by $\cos\theta$.
:::

::: example Reading a launch vehicle's attitude out of its DCM
A vehicle in its **gravity turn** — the arc from vertical toward horizontal on the way to orbit — has heading $\psi = 15^\circ$, pitch $\theta = 50^\circ$ and bank $\phi = 5^\circ$, measured from a north-east-down frame at the launch site.

**Build the matrix.** Multiply $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(5^\circ)\mathbf{R}_2(50^\circ)\mathbf{R}_3(15^\circ)$:

$$
\mathbf{C}_{B\leftarrow N} =
\begin{bmatrix}
0.620885 & 0.166366 & -0.766044\\
-0.193344 & 0.979530 & 0.056023\\
0.759684 & 0.113326 & 0.640342
\end{bmatrix},
\qquad \det = 1.0000000 .
$$

**Read the nose.** The first row is the nose direction in north-east-down components. Its third number is $-0.766044 = -\sin 50^\circ$, so the nose is $\arcsin(0.766044) = 50.0^\circ$ above the horizon. That is the pitch, visible in one entry.

**Use the matrix.** The vehicle's velocity is $1500\,\mathrm{m/s}$, climbing at $47^\circ$ above the horizon along a ground heading of $18^\circ$. In north-east-down components that is $1500$ times $(\cos 47^\circ\cos 18^\circ,\ \cos 47^\circ\sin 18^\circ,\ -\sin 47^\circ)$:

$$
\mathbf{v}^{N} = (972.93,\ 316.12,\ -1097.03)\,\mathrm{m/s}.
$$

In body axes, $\mathbf{v}^{B} = \mathbf{C}_{B\leftarrow N}\mathbf{v}^{N} = (1497.04,\ 60.08,\ 72.47)\,\mathrm{m/s}$. Its length is still $1500.00\,\mathrm{m/s}$, as it must be.

**What it means.** The air is coming at the vehicle $3.60^\circ$ off its own nose, since $\arccos(1497.04/1500) = 3.60^\circ$. Split that into the up-down part, the **[[angle of attack|alpha-beta]]** $\alpha = \operatorname{atan2}(72.47, 1497.04) = 2.77^\circ$, and the sideways part, the **sideslip** $\beta = \arcsin(60.08/1500) = 2.30^\circ$. Those two numbers set the aerodynamic loads, and you can only get them once the body attitude and the velocity are written in the same frame.

**Round trip.** Feed the matrix back into the extraction formulas and out come $(15.000^\circ, 50.000^\circ, 5.000^\circ)$. The loop closes.
:::

::: example The same three numbers in a different sequence
Take $(15^\circ, 50^\circ, 5^\circ)$ again, but read them as a 1-2-3 sequence: $15^\circ$ about $x$, then $50^\circ$ about the new $y$, then $5^\circ$ about the new $z$. The first turn is written last, so $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_3(5^\circ)\mathbf{R}_2(50^\circ)\mathbf{R}_1(15^\circ)$:

$$
\begin{bmatrix}
0.640342 & 0.281698 & -0.714569\\
-0.056023 & 0.944970 & 0.322324\\
0.766044 & -0.166366 & 0.620885
\end{bmatrix}.
$$

**Is it valid?** Yes — orthonormal, determinant $+1$. But it is a different attitude.

**How different?** The turn that takes one to the other is $\mathbf{C}_{321}\mathbf{C}_{123}^{\top}$, and its **trace** (the sum of its diagonal) is $2.907028$. Lesson 04 shows that any rotation matrix's trace equals $1 + 2\cos\Phi$, where $\Phi$ ("capital phi") is the size of the turn. So

$$
\Phi = \arccos\frac{2.907028 - 1}{2} = \arccos(0.953514) = 17.54^\circ .
$$

Seventeen and a half degrees of pointing error, from reading three numbers in the wrong order.

**Can you tell from the numbers?** No. Read the 1-2-3 matrix with the 3-2-1 extraction formulas and you get $(23.75^\circ, 45.61^\circ, 27.44^\circ)$ — a plausible attitude with no hint that anything is wrong. This is why every interface that carries Euler angles must carry the sequence with them.
:::

::: warning Euler angles without a named sequence are not data
A message field called `roll_pitch_yaw` tells you almost nothing. You need four facts: the three axis numbers in order, whether the turns are about body axes or fixed axes, which frame is the reference, and the sign of each angle. Aerospace 3-2-1 from north-east-down is common but not universal. Robotics often uses fixed-axis 1-2-3 from an east-north-up frame, and photogrammetry (making maps from aerial photos) uses 3-1-3. Two systems can swap three numbers happily for years and be describing different vehicles.
:::

### Intrinsic and extrinsic are the same sequences, reversed

Turning about the moving body axes is **intrinsic**. Turning about axes that stay fixed in the room is **extrinsic**. These are not two separate families. Every intrinsic sequence equals an extrinsic sequence with the axes *and* the angles listed in the opposite order.

Try it with the toy airplane. Do yaw, pitch, roll about the airplane's own axes. Now start over and do roll first, then pitch, then yaw, all about the room's fixed axes. You end up in the same pose.

::: note Why it has to be true
An intrinsic 3-2-1 gives $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$. Flip it (transpose) to get lesson 01's attitude matrix. Flipping a product reverses its order:

$$
\mathbf{C}_{N\leftarrow B} = \mathbf{R}_3(\psi)^{\top}\,\mathbf{R}_2(\theta)^{\top}\,\mathbf{R}_1(\phi)^{\top}.
$$

Each $\mathbf{R}_k(\alpha)^\top$ is an **operator**: it physically turns a vector through $\alpha$ about the fixed axis $k$. Operators act right to left, so this product turns about fixed $x$ by $\phi$ first, then fixed $y$ by $\theta$, then fixed $z$ by $\psi$. The attitude matrix does exactly this to the reference axes to produce the body axes. So intrinsic 3-2-1 with angles $(\psi, \theta, \phi)$ is the same as extrinsic 1-2-3 with angles $(\phi, \theta, \psi)$.
:::

The rule works for every sequence: reverse the axis order and the angle order together. Twelve sequences, each readable two ways, makes twenty-four names for twelve things.

## Check yourself

::: check
List the twelve sequences, and explain why 1-1-2 and 2-3-3 are not among them.
:::

::: answer
Symmetric: 1-2-1, 1-3-1, 2-1-2, 2-3-2, 3-1-3, 3-2-3. Asymmetric: 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1.

A sequence with two turns in a row about the same axis is left out because those two turns merge into one turn about that axis, through the sum of their angles. So 1-1-2 is really a two-angle set with one wasted number, and two angles cannot reach every attitude. The same goes for 2-3-3. Repeating an axis is allowed only when another turn sits between the two, as in 1-2-1: the middle turn moves the axis, so the third turn is about a different line in space.
:::

::: check
A DCM has $C_{13} = -0.5$, $C_{11} = 0.75$, $C_{12} = 0.433$, $C_{23} = 0.354$, $C_{33} = 0.789$. Find the 3-2-1 angles.
:::

::: answer
**Pitch:** $\theta = -\arcsin(-0.5) = 30.0^\circ$.

**Yaw:** $\psi = \operatorname{atan2}(0.433, 0.75) = 30.0^\circ$. (The ratio is $0.5773$, the tangent of $30^\circ$, and both inputs are positive, so the angle is in the first quarter.)

**Roll:** $\phi = \operatorname{atan2}(0.354, 0.789) = 24.2^\circ$.

**Sanity check** on the first row: $C_{11}^2 + C_{12}^2 + C_{13}^2 = 0.5625 + 0.1875 + 0.25 = 1.0000$, so the row is a unit vector, as a row of a DCM must be. And $C_{11} = \cos\theta\cos\psi = 0.866\times 0.866 = 0.750$ and $C_{12} = \cos\theta\sin\psi = 0.866\times 0.5 = 0.433$ — both match.
:::

::: check
A colleague's code computes $\psi = \arctan(C_{12}/C_{11})$. For which attitudes is it wrong, and by how much?
:::

::: answer
Plain `atan` only returns angles between $-90^\circ$ and $90^\circ$, so it cannot tell $\psi$ from $\psi \pm 180^\circ$. Whenever $C_{11} = \cos\theta\cos\psi$ is negative, the answer is off by exactly $180^\circ$. Since $\cos\theta \ge 0$ over the allowed pitch range, that happens whenever $\lvert\psi\rvert > 90^\circ$. A vehicle heading south is reported heading north. The failure is silent, it happens on only half the compass, and tests flown near zero heading never see it.
:::

::: check
Show that intrinsic 3-1-3 with angles $(\Omega, i, \omega)$ equals extrinsic 3-1-3 with angles $(\omega, i, \Omega)$, and say what that means for the classical orbital elements.
:::

::: answer
Intrinsic 3-1-3 gives $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_3(\omega)\mathbf{R}_1(i)\mathbf{R}_3(\Omega)$. Flip it: $\mathbf{C}_{N\leftarrow B} = \mathbf{R}_3(\Omega)^\top\mathbf{R}_1(i)^\top\mathbf{R}_3(\omega)^\top$. That is a product of operators about the fixed axes, acting right to left: $\omega$ about fixed $z$, then $i$ about fixed $x$, then $\Omega$ about fixed $z$. The axis list reverses to 3-1-3 — the same list, because the sequence is symmetric — and the angle list reverses to $(\omega, i, \Omega)$.

For orbits, it means the matrix from the orbit's own frame to the inertial frame can be pictured two ways: "tilt the orbit plane up by $i$ and swing it round by $\Omega$", or "place periapsis at angle $\omega$ in the reference plane, then tilt, then swing". Both give the same matrix, and different textbooks use different pictures.
:::

::: check
Why does limiting $\theta$ to $[-90^\circ, 90^\circ]$ make the 3-2-1 set unique, and what happens to $\psi$ and $\phi$ if you do not?
:::

::: answer
The extraction finds $\theta$ from $-\arcsin(C_{13})$, and arcsine returns an angle in $[-90^\circ, 90^\circ]$. But $\sin\theta = -C_{13}$ has a second solution, $180^\circ - \theta$. Taking it flips the sign of $\cos\theta$. That flips the signs of both inputs of each `atan2` call, which moves both $\psi$ and $\phi$ by $180^\circ$. So $(\psi \pm 180^\circ,\ 180^\circ - \theta,\ \phi \pm 180^\circ)$ is the same attitude. Limiting $\theta$ picks one of the two. Without the limit every attitude has two valid sets of Euler angles, which breaks any code that subtracts two angle sets to get an error.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{C}_{B\leftarrow N} = \mathbf{R}_{k_3}(\alpha_3)\mathbf{R}_{k_2}(\alpha_2)\mathbf{R}_{k_1}(\alpha_1)$ | Intrinsic sequence; matrices written left to right, turns happen right to left |
| Twelve sequences | $3\times2\times2$; six symmetric, six asymmetric |
| Symmetric ($k_1=k_3$) | 3-1-3, 3-2-3, 1-2-1, 1-3-1, 2-1-2, 2-3-2; $\alpha_2\in[0^\circ,180^\circ]$ |
| Asymmetric (all distinct) | 1-2-3, 1-3-2, 2-1-3, 2-3-1, 3-1-2, 3-2-1; $\alpha_2\in[-90^\circ,90^\circ]$ |
| 3-2-1 | Yaw $\psi$, pitch $\theta$, roll $\phi$; $\mathbf{C}_{B\leftarrow N}=\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$ |
| $\psi = \operatorname{atan2}(C_{12},C_{11})$ | Heading, full circle |
| $\theta = -\arcsin(C_{13})$ | Pitch; clamp the input to $[-1,1]$ |
| $\phi = \operatorname{atan2}(C_{23},C_{33})$ | Bank, full circle |
| Intrinsic $\leftrightarrow$ extrinsic | Reverse both the axis order and the angle order |
| Worked figure | Reading $(15^\circ,50^\circ,5^\circ)$ as 1-2-3 instead of 3-2-1 misses by $17.54^\circ$ |

Three angles, one matrix, and a limit on $\theta$ that keeps the match one-to-one. The next lesson asks what happens as $\theta$ reaches the edge of that limit, where the first and third axes line up and one degree of freedom disappears.

::: context euler-history Who Euler was
Leonhard Euler (say "OY-ler") was an 18th-century Swiss mathematician and one of the most productive who ever lived. In the 1760s and 1770s he showed that any orientation of a solid body can be reached by three turns about axes, and he worked out the mechanics of spinning bodies that attitude control still uses. So many results carry his name that engineers have to say *which* one: Euler angles here, Euler's rotation theorem in lesson 04, Euler's equations for a spinning body in a later module.
:::

::: context twelve-tree All twelve, counted
Each branch is one choice. Three choices for the first axis, then two for the second (anything but the first), then two for the third (anything but the second). The sequences whose last axis matches the first are the symmetric ones.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
<line x1="24" y1="104.8" x2="95" y2="38.8" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="24" y1="104.8" x2="95" y2="104.8" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="24" y1="104.8" x2="95" y2="170.8" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="38.8" x2="175" y2="22.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="38.8" x2="175" y2="55.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="104.8" x2="175" y2="88.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="104.8" x2="175" y2="121.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="170.8" x2="175" y2="154.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="95" y1="170.8" x2="175" y2="187.2" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="22.2" x2="255" y2="14.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="22.2" x2="255" y2="30.5" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="55.2" x2="255" y2="47.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="55.2" x2="255" y2="63.5" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="88.2" x2="255" y2="80.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="88.2" x2="255" y2="96.5" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="121.2" x2="255" y2="113.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="121.2" x2="255" y2="129.5" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="154.2" x2="255" y2="146.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="154.2" x2="255" y2="162.5" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="187.2" x2="255" y2="179.0" stroke="#6c7a93" stroke-width="1.2"/>
<line x1="175" y1="187.2" x2="255" y2="195.5" stroke="#6c7a93" stroke-width="1.2"/>
<circle cx="24" cy="104.8" r="4" fill="#1f2a44"/>
<rect x="86" y="29.8" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="95" y="43.2" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
<rect x="86" y="95.8" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="95" y="109.2" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
<rect x="86" y="161.8" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="95" y="175.2" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
<rect x="166" y="13.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="26.8" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
<rect x="166" y="46.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="59.8" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
<rect x="166" y="79.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="92.8" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
<rect x="166" y="112.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="125.8" font-size="12" text-anchor="middle" fill="#1f2a44">3</text>
<rect x="166" y="145.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="158.8" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
<rect x="166" y="178.2" width="18" height="18" rx="4" fill="#fff" stroke="#1f2a44"/><text x="175" y="191.8" font-size="12" text-anchor="middle" fill="#1f2a44">2</text>
<text x="261" y="18.0" font-size="12" fill="#1d6fd1">1-2-1</text>
<text x="261" y="34.5" font-size="12" fill="#b4232c">1-2-3</text>
<text x="261" y="51.0" font-size="12" fill="#1d6fd1">1-3-1</text>
<text x="261" y="67.5" font-size="12" fill="#b4232c">1-3-2</text>
<text x="261" y="84.0" font-size="12" fill="#1d6fd1">2-1-2</text>
<text x="261" y="100.5" font-size="12" fill="#b4232c">2-1-3</text>
<text x="261" y="117.0" font-size="12" fill="#b4232c">2-3-1</text>
<text x="261" y="133.5" font-size="12" fill="#1d6fd1">2-3-2</text>
<text x="261" y="150.0" font-size="12" fill="#b4232c">3-1-2</text>
<text x="261" y="166.5" font-size="12" fill="#1d6fd1">3-1-3</text>
<text x="261" y="183.0" font-size="12" fill="#b4232c">3-2-1</text>
<text x="261" y="199.5" font-size="12" fill="#1d6fd1">3-2-3</text>
<text x="95" y="214" font-size="11" text-anchor="middle" fill="#1f2a44">3 ways</text>
<text x="175" y="214" font-size="11" text-anchor="middle" fill="#1f2a44">× 2</text>
<text x="310" y="214" font-size="11" text-anchor="middle" fill="#1f2a44">× 2 = 12</text>
<text x="24" y="16" font-size="11" fill="#1d6fd1">blue: symmetric</text><text x="24" y="31" font-size="11" fill="#b4232c">red: asymmetric</text>
</svg>
```
:::

::: context tait-bryan Where "Tait–Bryan" comes from
Peter Guthrie Tait was a 19th-century Scottish physicist who wrote about rotations and quaternions. George Hartley Bryan was a British engineer who, in the early 1900s, wrote one of the first mathematical treatments of how an airplane stays stable in flight — and used three different axes, yaw, pitch and roll, to do it. "Cardan angles" honors Gerolamo Cardano, the 16th-century Italian after whom the Cardan joint, a gimbal-like coupling, is named.
:::

::: context orbital-elements Six numbers for an orbit
An orbit around Earth is fixed by six numbers. Two give its size and shape. One says where the spacecraft is along it. The other three say how the orbit is turned in space — and those three are a 3-1-3 Euler set. The node angle $\Omega$ swings the line where the orbit crosses the equator. The inclination $i$ tilts the orbit's plane. The argument of periapsis $\omega$ swings the orbit's closest point around within that plane. When $i = 0$ the orbit lies flat in the equator, it never crosses the equator, and $\Omega$ has no meaning — a breakdown point of 3-1-3.
:::

::: context body-axes The airplane's own axes
Looking down on an airplane from above, with its nose pointing right: $x$ runs out the nose, $y$ out the right wing (toward the bottom of the page) and $z$ straight down, into the page. Rolling is turning about $x$, pitching is turning about $y$, yawing is turning about $z$. The words come from sailing ships, which rolled from side to side, pitched nose-up and nose-down in waves, and yawed off course.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="160" cy="80" rx="95" ry="11" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="175,70 140,15 122,15 135,70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="175,90 140,145 122,145 135,90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="85,72 70,50 62,50 70,74" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="85,88 70,110 62,110 70,86" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="160" y1="80" x2="310" y2="80" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="318,80 306,74 306,86" fill="#b4232c"/>
  <text x="300" y="102" font-size="12" fill="#b4232c">x: roll</text>
  <line x1="160" y1="80" x2="160" y2="172" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="160,180 154,168 166,168" fill="#1d6fd1"/>
  <text x="170" y="178" font-size="12" fill="#1d6fd1">y: pitch (right wing)</text>
  <circle cx="160" cy="80" r="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="154.3" y1="74.3" x2="165.7" y2="85.7" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="165.7" y1="74.3" x2="154.3" y2="85.7" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="40" font-size="12" fill="#1f2a44">z: yaw (down, into page)</text>
  <text x="20" y="192" font-size="11" fill="#6c7a93">seen from above</text>
</svg>
```
:::

::: context ned-frame Why "down" is positive
Pilots and aircraft engineers measure from a frame whose axes point north, east and down. Down, not up, because with $x$ north and $y$ east the right-hand rule forces $z$ downward. It also matches the airplane's own axes when it flies level heading north: nose north, right wing east, belly down, so all three Euler angles are zero. The price is that climbing makes the $z$ coordinate *more negative* — a classic sign trap.
:::

::: context atan2-bridge atan2 again
You met atan2 in the trigonometry module. It takes the two sides of a would-be fraction separately, $\operatorname{atan2}(y, x)$, so it still knows which of $x$ and $y$ was negative after the division would have forgotten. That lets it return an angle anywhere in $(-180^\circ, 180^\circ]$, not only in the right half of the circle. Every heading and bank angle in flight software should come out of atan2.
:::

::: context nan When the computer gives up
NaN stands for "not a number". It is a special value a computer returns when a calculation has no real answer — the arcsine of $1.0000000000000002$, zero divided by zero, the square root of $-1$. Worse, anything computed from a NaN is also NaN, so one bad value spreads through the whole navigation state within a step. Flight software therefore clamps inputs to their legal range before calling functions like arcsine.
:::

::: context alpha-beta Angle of attack
Seen from the side, the body $x$ axis (the nose) and the direction the vehicle is actually moving through the air need not agree. The angle between them, in the vertical plane, is the angle of attack $\alpha$. Its sideways twin is the sideslip $\beta$. Wings make lift from angle of attack — and on a rocket, the same angle makes sideways loads that can break the vehicle, so ascent guidance works hard to keep it near zero where the air is thickest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5,4"/>
  <text x="300" y="155" font-size="11" fill="#6c7a93">horizon</text>
  <line x1="60" y1="140" x2="291.8" y2="46.35" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="297.4,44.1 290.0,52.5 286.2,43.2" fill="#1f2a44"/>
  <text x="235" y="45" font-size="12" fill="#1f2a44">body x (nose)</text>
  <line x1="60" y1="140" x2="267.96" y2="110.77" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="273.9,109.9 264.7,116.3 263.3,106.4" fill="#1d6fd1"/>
  <text x="225" y="130" font-size="12" fill="#1d6fd1">velocity</text>
  <path d="M139.22,128.87 A80,80 0 0,0 134.17,110.03" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="146" y="124" font-size="13" fill="#b4232c">α</text>
</svg>
```
:::
