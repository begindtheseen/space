---
id: l04-angular-momentum-h-equals-i-omega
title: Angular momentum H = Iω and rotational kinetic energy
minutes: 16
covers:
  - angular momentum H = I omega
---

Lesson 2 derived $\mathbf{H}_C = \mathbf{I}\boldsymbol{\omega}$ on the way to defining the inertia tensor and then set it aside. This lesson picks it up as the central object of rotational dynamics. Angular momentum is what an external torque changes, what a torque-free body conserves, what a reaction wheel stores and what a thruster firing dumps. Every attitude control problem is, at bottom, a bookkeeping problem for $\mathbf{H}$, and every spin-stability result in this module is a statement about how a body can rearrange its motion while keeping $\mathbf{H}$ fixed.

Two features of $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ make rigid-body rotation harder than particle mechanics, and both are worth facing before the equations of motion arrive in the next lesson. First, $\mathbf{H}$ is not in general parallel to $\boldsymbol{\omega}$: the body spins about one axis while its angular momentum points along another. Second, $\mathbf{I}$ is constant only in body axes, which rotate, so the inertially fixed vector $\mathbf{H}$ has body components that change even when no torque acts. The rotational kinetic energy, $T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$, is introduced alongside, because the pair $(\mathbf{H}, T)$ is what decides the fate of a spinning spacecraft in lessons 6 through 8.

## Angular momentum of a rigid body

The previous module defined the angular momentum of a system of particles about a point $O$ as $\mathbf{H}_O = \sum_i \mathbf{r}_i\times m_i\mathbf{v}_i$ and split it into a part carried by the centre of mass and a part about the centre of mass:

$$
\mathbf{H}_O = \mathbf{r}_C\times M\mathbf{v}_C + \mathbf{H}_C ,
$$

where $M$ is the total mass, $\mathbf{r}_C$ and $\mathbf{v}_C$ locate the centre of mass relative to $O$, and $\mathbf{H}_C = \sum_i\boldsymbol{\rho}_i\times m_i\dot{\boldsymbol{\rho}}_i$ uses positions and velocities relative to the centre of mass. The first term is orbital; the second is the spin. For a rigid body, lesson 2 evaluated the second term with $\dot{\boldsymbol{\rho}} = \boldsymbol{\omega}\times\boldsymbol{\rho}$ and found

$$
\mathbf{H}_C = \mathbf{I}\,\boldsymbol{\omega},
$$

with $\mathbf{I}$ the inertia tensor about the centre of mass. This module drops the subscript and writes $\mathbf{H}$ for $\mathbf{H}_C$; whenever a lesson says "angular momentum" without qualification it means the spin part, about the centre of mass. The units are $\mathrm{kg\,m^2/s}$, which equals $\mathrm{N\,m\,s}$ — torque times time — and the second form is the one used in reaction wheel data sheets.

In body axes, with the tensor written as in lesson 2,

$$
\begin{bmatrix} H_x \\ H_y \\ H_z \end{bmatrix}
=
\begin{bmatrix}
I_{xx} & -I_{xy} & -I_{xz} \\
-I_{xy} & I_{yy} & -I_{yz} \\
-I_{xz} & -I_{yz} & I_{zz}
\end{bmatrix}
\begin{bmatrix} \omega_x \\ \omega_y \\ \omega_z \end{bmatrix},
$$

so that, for instance, $H_x = I_{xx}\omega_x - I_{xy}\omega_y - I_{xz}\omega_z$. A spin about body $x$ alone produces angular momentum along $y$ and $z$ whenever the products of inertia are non-zero. In principal axes the products vanish and the three components decouple:

$$
H_1 = I_1\omega_1, \qquad H_2 = I_2\omega_2, \qquad H_3 = I_3\omega_3 .
$$

This is the form the rest of the module uses. It looks like three copies of the wheel-on-a-shaft formula, and that is the trap: the three components are scaled by three different numbers, so the vector $\mathbf{H}$ is not a scalar multiple of $\boldsymbol{\omega}$ unless only one component is non-zero.

::: key Angular momentum of a rigid body
About its centre of mass, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$; in principal axes $H_k = I_k\omega_k$. $\mathbf{H}$ and $\boldsymbol{\omega}$ are parallel only when $\boldsymbol{\omega}$ lies along a principal axis, or when all three principal moments are equal — which is exactly why an off-axis spin nutates. Units: $\mathrm{kg\,m^2/s} = \mathrm{N\,m\,s}$.
:::

## How far apart are H and ω?

Think of $\mathbf{I}$ acting on $\boldsymbol{\omega}$ in principal axes as three independent stretches: the component along the major axis is multiplied by the largest factor, the component along the minor axis by the smallest. The result is pulled toward the major axis relative to $\boldsymbol{\omega}$. The angle $\phi$ between the two vectors follows from the dot product,

$$
\cos\phi = \frac{\boldsymbol{\omega}\cdot\mathbf{H}}{\lVert\boldsymbol{\omega}\rVert\,\lVert\mathbf{H}\rVert}
= \frac{\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}}{\lVert\boldsymbol{\omega}\rVert\,\lVert\mathbf{I}\boldsymbol{\omega}\rVert},
$$

and it is zero exactly when $\boldsymbol{\omega}$ is an eigenvector. For a body whose principal moments are within a factor of two of each other, as most spacecraft are, $\phi$ is at most a few tens of degrees; for a slender body like a launch vehicle stage, whose moments differ by a factor near a hundred, a spin only slightly off the long axis produces an $\mathbf{H}$ almost perpendicular to it.

::: example A nearly axial spin on a communications bus
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ spins mostly about its major axis $z$ with a small component along $x$: $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$. The spin rate is $\lVert\boldsymbol{\omega}\rVert = \sqrt{0.02^2 + 0.10^2} = 0.102\,\mathrm{rad/s}$, tilted from $z$ by $\arctan(0.02/0.10) = 11.3^\circ$.

The angular momentum is $\mathbf{H} = (1200\times 0.02,\ 0,\ 2000\times 0.10) = (24, 0, 200)\,\mathrm{N\,m\,s}$, with magnitude $\sqrt{24^2 + 200^2} = 201.4\,\mathrm{N\,m\,s}$ and tilt from $z$ of $\arctan(24/200) = 6.84^\circ$. The angle between $\mathbf{H}$ and $\boldsymbol{\omega}$ is the difference, $11.3^\circ - 6.84^\circ = 4.47^\circ$; check with the dot product: $\boldsymbol{\omega}\cdot\mathbf{H} = 0.02\times 24 + 0.10\times 200 = 20.48$, and $20.48/(0.102\times 201.4) = 0.99696$, whose arccosine is $4.47^\circ$.

The major-axis component was stretched by $2000$ and the minor-axis component by only $1200$, so $\mathbf{H}$ sits closer to the major axis than $\boldsymbol{\omega}$ does. In torque-free flight $\mathbf{H}$ is fixed in space, so it is $\boldsymbol{\omega}$ — and with it the body — that must move around $\mathbf{H}$ on a cone of half-angle near $4.5^\circ$. That motion is nutation, and lesson 9 computes its rate.
:::

::: example A spin about a non-principal body axis
Lesson 3 added a 40 kg tank to the same bus and found, in the structural axes,

$$
\mathbf{I} = \begin{bmatrix} 1232.4 & -21.6 & 0 \\ -21.6 & 1514.4 & 0 \\ 0 & 0 & 2046.8 \end{bmatrix}\mathrm{kg\,m^2}.
$$

Spin it about body $x$ at $\boldsymbol{\omega} = (0.05, 0, 0)\,\mathrm{rad/s}$. Then $\mathbf{H} = (1232.4\times 0.05,\ -21.6\times 0.05,\ 0) = (61.62, -1.08, 0)\,\mathrm{N\,m\,s}$. A spin purely about $x$ has produced a $y$ component of angular momentum, because $x$ is not principal for this tensor: $\mathbf{H}$ is rotated from $\boldsymbol{\omega}$ by $\arctan(1.08/61.62) = 1.00^\circ$, toward $-y$.

Now ask what it takes to hold this spin steady in the body. The next lesson shows that a constant $\boldsymbol{\omega}$ in body axes requires a torque $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{H}$. Here $\boldsymbol{\omega}\times\mathbf{H} = (0,\ 0,\ 0.05\times(-1.08)) = (0, 0, -0.054)\,\mathrm{N\,m}$. Without that torque — supplied, in a wheel, by the bearings — the spin axis will not stay on body $x$ but will wander toward the nearby principal axis at $4.35^\circ$. A steady spin about a non-principal axis is not a free motion; something must be pushing.
:::

## Rotational kinetic energy

The kinetic energy of the body is the sum over mass elements of $\tfrac{1}{2}\lVert\mathbf{v}\rVert^2\,dm$. With $\mathbf{v} = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$, the cross term $\mathbf{v}_C\cdot\int(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm$ vanishes because $\int\boldsymbol{\rho}\,dm = 0$, and the energy splits into translational and rotational parts (König's theorem from the previous module):

$$
T_{\mathrm{total}} = \tfrac{1}{2}M\lVert\mathbf{v}_C\rVert^2 + T,
\qquad
T = \tfrac{1}{2}\int\lVert\boldsymbol{\omega}\times\boldsymbol{\rho}\rVert^2\,dm .
$$

Evaluate the rotational part. Use the scalar triple product identity $(\mathbf{a}\times\mathbf{b})\cdot(\mathbf{a}\times\mathbf{b}) = \mathbf{a}\cdot\bigl(\mathbf{b}\times(\mathbf{a}\times\mathbf{b})\bigr)$ with $\mathbf{a} = \boldsymbol{\omega}$ and $\mathbf{b} = \boldsymbol{\rho}$:

$$
T = \tfrac{1}{2}\,\boldsymbol{\omega}\cdot\int\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm
= \tfrac{1}{2}\,\boldsymbol{\omega}\cdot\mathbf{H}
= \tfrac{1}{2}\,\boldsymbol{\omega}^\top\mathbf{I}\,\boldsymbol{\omega}.
$$

The integral is exactly the one that defined $\mathbf{H}$ in lesson 2, which is why the energy comes out as half the dot product of the two vectors. In principal axes,

$$
T = \tfrac{1}{2}\left(I_1\omega_1^2 + I_2\omega_2^2 + I_3\omega_3^2\right)
= \frac{H_1^2}{2I_1} + \frac{H_2^2}{2I_2} + \frac{H_3^2}{2I_3},
$$

the second form using $\omega_k = H_k/I_k$. The units are joules. For a spin about a single principal axis with moment $I$ the sum collapses to one term,

$$
T = \frac{H^2}{2I} .
$$

Read that formula the way the spin-stability lessons will read it. For a given magnitude of angular momentum, the energy of a pure spin is inversely proportional to the moment of inertia about the spin axis. Spinning about the major axis is the lowest-energy way to carry a given $\mathbf{H}$; spinning about the minor axis is the highest. For the bus above, $H = 200\,\mathrm{N\,m\,s}$ can be carried as a spin about $z$ at $0.10\,\mathrm{rad/s}$ with $T = 200^2/(2\times 2000) = 10.0\,\mathrm{J}$, about $y$ at $0.133\,\mathrm{rad/s}$ with $13.3\,\mathrm{J}$, or about $x$ at $0.167\,\mathrm{rad/s}$ with $16.7\,\mathrm{J}$. Same angular momentum, different energy. If anything inside the body can absorb energy without changing $\mathbf{H}$, the body will slide down that list.

::: key Rotational kinetic energy
$T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$, in joules; in principal axes $T = \tfrac{1}{2}\sum_k I_k\omega_k^2 = \sum_k H_k^2/(2I_k)$. For a spin about a single principal axis, $T = H^2/(2I)$: at fixed $H$, the major axis carries the least energy and the minor axis the most.
:::

In the first example, $T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H} = \tfrac{1}{2}\times 20.48 = 10.24\,\mathrm{J}$, slightly more than the $10.0\,\mathrm{J}$ of a pure $z$ spin with the same $\lVert\mathbf{H}\rVert$ — the $x$ component costs extra energy because it is carried by a smaller moment. In the second, $T = \tfrac{1}{2}\times 0.05\times 61.62 = 1.54\,\mathrm{J}$.

## Body components of an inertially fixed vector

The tensor is constant in body axes, so $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ is a body-frame statement: $\mathbf{H}_B = \mathbf{I}_B\boldsymbol{\omega}_B$. The inertial components are $\mathbf{H}_N = \mathbf{R}\mathbf{H}_B$ with $\mathbf{R}$ the attitude matrix of lesson 1. In inertial axes the tensor would be $\mathbf{R}\mathbf{I}_B\mathbf{R}^\top$, a matrix that changes every instant as the body turns; that is why nobody writes rotational dynamics in inertial components, and why the body frame — which makes $\mathbf{I}$ constant at the price of making the frame rotate — is the natural home of Euler's equations.

The price shows up when you differentiate. The transport rule of lesson 1 gives, for any vector,

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} .
$$

Suppose no torque acts, so that the inertial derivative is zero and $\mathbf{H}$ is a fixed arrow in space. The body derivative — the rate of change of the components a body-fixed observer records — is then $-\boldsymbol{\omega}\times\mathbf{H}$, which is non-zero whenever $\mathbf{H}$ and $\boldsymbol{\omega}$ are not parallel. The components $(H_1, H_2, H_3)$ change while $\lVert\mathbf{H}\rVert$ does not: the body sees the fixed vector $\mathbf{H}$ sweep around it. Combined with $H_k = I_k\omega_k$, that means the body rates $\omega_k$ change too, with no torque applied. This is the origin of every gyroscopic effect in the module, and the next lesson turns the identity into Euler's equations by setting the inertial derivative equal to the applied torque.

## Magnitudes

Angular momentum spans a wide range on flight hardware, and a feel for the numbers helps in sizing arguments later.

| System | $I$ ($\mathrm{kg\,m^2}$) | $\omega$ ($\mathrm{rad/s}$) | $H$ ($\mathrm{N\,m\,s}$) |
| --- | --- | --- | --- |
| Small reaction wheel at 6,000 rpm | $0.05$ | $628$ | $31.4$ |
| Communications bus slewing about $z$ | $2000$ | $0.05$ | $100$ |
| Loaded first stage rolling at $2^\circ/\mathrm{s}$ | $7.03\times 10^{5}$ | $0.0349$ | $2.45\times 10^{4}$ |
| Loaded first stage pitching at $2^\circ/\mathrm{s}$ | $5.92\times 10^{7}$ | $0.0349$ | $2.07\times 10^{6}$ |
| Space Station turning at orbit rate | $\sim 1.2\times 10^{8}$ | $1.13\times 10^{-3}$ | $\sim 1.4\times 10^{5}$ |

Two comparisons are instructive. The wheel and the bus carry angular momenta within a factor of three of each other, which is why a wheel can exchange momentum with a bus and slew it — the subject of lesson 11. The first stage pitching at the same rate as it rolls carries 84 times the angular momentum, the inertia ratio from lesson 2, so the pitch controller commands a torque two orders of magnitude larger than the roll controller for the same rate change.

::: warning Angular momentum depends on the reference point
$\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ holds with both $\mathbf{H}$ and $\mathbf{I}$ taken about the centre of mass, or about a point fixed in the body and in inertial space — a bearing, say. About a general moving point it does not; the orbital term $\mathbf{r}_C\times M\mathbf{v}_C$ must be added and the tensor must be the one about that point. Mixing an inertia tensor about the structural origin with an angular momentum about the centre of mass is a common simulation error, and it appears as a spurious torque proportional to the vehicle's acceleration.
:::

::: warning Kinetic energy is not conserved in the body frame's arithmetic
$T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$ is a scalar and has the same value in every frame, but if you compute it from body rates that were integrated with a poor integrator it will drift, and the drift looks exactly like the physical energy loss of lesson 8. Before drawing any conclusion from a simulated energy history, run the same case torque free and confirm that $T$ and $\lVert\mathbf{H}\rVert$ hold to your integrator's tolerance.
:::

::: note Units of angular momentum
$\mathrm{kg\,m^2/s}$, $\mathrm{N\,m\,s}$ and $\mathrm{J\,s}$ are the same unit. Reaction wheel catalogues quote capacity in $\mathrm{N\,m\,s}$ (a small wheel: $0.01$ to $1\,\mathrm{N\,m\,s}$; a large one for a geostationary bus: $50$ to $100\,\mathrm{N\,m\,s}$; a Space Station control moment gyro: $4{,}760\,\mathrm{N\,m\,s}$). Kinetic energy, in joules, is a different quantity and cannot be compared to any of them.
:::

## Check yourself

::: check
A body with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ has $\boldsymbol{\omega} = (0.05, 0.05, 0)\,\mathrm{rad/s}$. Find $\mathbf{H}$, the angle between $\mathbf{H}$ and $\boldsymbol{\omega}$, and $T$.
:::

::: answer
$\mathbf{H} = (60, 75, 0)\,\mathrm{N\,m\,s}$, magnitude $\sqrt{60^2 + 75^2} = 96.0\,\mathrm{N\,m\,s}$. The angular velocity lies at $45^\circ$ from $x$ in the $xy$ plane; $\mathbf{H}$ lies at $\arctan(75/60) = 51.3^\circ$, so the angle between them is $6.3^\circ$, and $\mathbf{H}$ has been pulled toward $y$, the axis of larger moment. The energy is $T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H} = \tfrac{1}{2}(0.05\times 60 + 0.05\times 75) = 3.38\,\mathrm{J}$; equivalently $\tfrac{1}{2}(1200 + 1500)\times 0.05^2 = 3.38\,\mathrm{J}$.
:::

::: check
A spacecraft carries $H = 150\,\mathrm{N\,m\,s}$ as a pure spin about its minor axis, $I_1 = 1200\,\mathrm{kg\,m^2}$. How much rotational kinetic energy would it shed if the same angular momentum were instead carried as a pure spin about its major axis, $I_3 = 2000\,\mathrm{kg\,m^2}$? What would the two spin rates be?
:::

::: answer
About the minor axis, $T_1 = 150^2/(2\times 1200) = 9.38\,\mathrm{J}$ at $\omega_1 = 150/1200 = 0.125\,\mathrm{rad/s}$. About the major axis, $T_3 = 150^2/(2\times 2000) = 5.63\,\mathrm{J}$ at $\omega_3 = 0.075\,\mathrm{rad/s}$. The difference is $3.75\,\mathrm{J}$, forty per cent of the initial energy. If any internal mechanism can dissipate that energy while external torques are absent, the second state is where the spacecraft will end up — a slower spin about a different axis with identical angular momentum.
:::

::: check
Explain, using $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, why a body cannot rotate at constant $\boldsymbol{\omega}$ about a non-principal axis without an applied torque.
:::

::: answer
If $\boldsymbol{\omega}$ is constant in body axes and $\mathbf{I}$ is constant there too, then $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ has constant body components, so its body derivative is zero and the transport rule gives $d\mathbf{H}/dt|_N = \boldsymbol{\omega}\times\mathbf{H}$. Off a principal axis $\mathbf{H}$ is not parallel to $\boldsymbol{\omega}$, so this cross product is non-zero: the angular momentum is changing in inertial space, which requires an external torque $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{H}$. Without it, $\boldsymbol{\omega}$ cannot stay constant. Along a principal axis $\mathbf{H} \parallel \boldsymbol{\omega}$, the cross product vanishes, and a steady spin is free.
:::

::: check
A reaction wheel with $I_w = 0.05\,\mathrm{kg\,m^2}$ spins at $6{,}000\,\mathrm{rpm}$. What is its angular momentum, and if it were brought to rest by internal friction alone, at what rate would a $2000\,\mathrm{kg\,m^2}$ spacecraft it is mounted in end up turning about the wheel axis?
:::

::: answer
$\omega_w = 6000\times 2\pi/60 = 628\,\mathrm{rad/s}$, so $H_w = 0.05\times 628 = 31.4\,\mathrm{N\,m\,s}$. Friction between wheel and spacecraft is an internal torque and cannot change the total angular momentum, so the $31.4\,\mathrm{N\,m\,s}$ must reappear in the spacecraft body: $\omega = 31.4/2000 = 0.0157\,\mathrm{rad/s}$, about $0.9^\circ/\mathrm{s}$, in the direction the wheel was spinning. Lesson 11 turns this exchange into a control technique.
:::

::: check
A simulation reports that the rotational kinetic energy of a torque-free rigid body fell by two per cent over an hour. List the possible explanations and how you would tell them apart.
:::

::: answer
For a genuinely rigid, torque-free body, $T$ is exactly conserved, so either the simulation is not torque free, the body model is not rigid, or the integrator is at fault. Check $\lVert\mathbf{H}\rVert$ first: an integration error typically drifts both $T$ and $\lVert\mathbf{H}\rVert$, and halving the step size should shrink the drift by a predictable factor. A modelled internal energy sink (a damper, lesson 8) reduces $T$ while holding $\lVert\mathbf{H}\rVert$ constant to integrator tolerance. An unintended external torque changes both. Only after the integrator is exonerated is a two per cent energy loss a physical result.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ | Angular momentum about the centre of mass; $\mathrm{kg\,m^2/s} = \mathrm{N\,m\,s}$ |
| $H_k = I_k\omega_k$ | Principal-axis components; three different scale factors, so $\mathbf{H} \nparallel \boldsymbol{\omega}$ in general |
| $\cos\phi = \boldsymbol{\omega}\cdot\mathbf{H}/(\lVert\boldsymbol{\omega}\rVert\lVert\mathbf{H}\rVert)$ | Angle between $\mathbf{H}$ and $\boldsymbol{\omega}$; zero only along a principal axis or for equal moments |
| $T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$ | Rotational kinetic energy, joules; $\tfrac{1}{2}\sum_k I_k\omega_k^2 = \sum_k H_k^2/(2I_k)$ |
| $T = H^2/(2I)$ | Pure spin about one principal axis; least for the major axis at fixed $H$ |
| $\mathbf{H}_O = \mathbf{r}_C\times M\mathbf{v}_C + \mathbf{H}$ | Angular momentum about another point: orbital plus spin |
| $d\mathbf{H}/dt|_N = d\mathbf{H}/dt|_B + \boldsymbol{\omega}\times\mathbf{H}$ | Transport rule; a fixed $\mathbf{H}$ has changing body components when $\mathbf{H} \nparallel \boldsymbol{\omega}$ |
| Bus example | $\boldsymbol{\omega} = (0.02, 0, 0.10)$ gives $\mathbf{H} = (24, 0, 200)$, $4.47^\circ$ apart, $T = 10.24\,\mathrm{J}$ |

The next lesson sets the inertial derivative of $\mathbf{H}$ equal to the applied torque and expands it in body axes. The result — Euler's rotational equations — is three coupled nonlinear differential equations for the body rates, and the coupling term is the $\boldsymbol{\omega}\times\mathbf{H}$ you have now met twice.
