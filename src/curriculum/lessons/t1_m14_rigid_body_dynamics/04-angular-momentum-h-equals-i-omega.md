---
id: l04-angular-momentum-h-equals-i-omega
title: Angular momentum H = Iω and rotational kinetic energy
minutes: 19
covers:
  - angular momentum H = I omega
---

Spin a bicycle wheel on its axle, then try to tilt the axle. It fights you. A spinning thing carries a kind of stored "turning" that resists change and does not go away on its own. That stored turning is **angular momentum** — how much rotation a body carries, counting both how fast it spins and how its mass is spread. Its symbol is $\mathbf{H}$, read "bold H".

Lesson 2 met the formula $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ ("H equals I omega") on the way to the inertia tensor, then set it aside. This lesson makes it the main character. Angular momentum is what an outside torque changes. It is what a body left alone keeps. A reaction wheel stores it. A thruster firing dumps it overboard. Every attitude control problem is, underneath, bookkeeping for $\mathbf{H}$. And every spin-stability result later in this module is a statement about how a body can rearrange its motion while keeping $\mathbf{H}$ fixed.

Two features make rotation harder than the motion of a single particle, and it is worth facing both now. First, $\mathbf{H}$ usually does *not* point along $\boldsymbol{\omega}$: the body spins about one line while its angular momentum points along another. Second, $\mathbf{I}$ is constant only in body axes, and those axes rotate. So a vector fixed in space, like $\mathbf{H}$ with no torque acting, has body components that keep changing. Alongside $\mathbf{H}$ this lesson introduces the **rotational kinetic energy** $T$, the energy stored in the spin. The pair $\mathbf{H}$ and $T$ decides the fate of a spinning spacecraft in lessons 6 through 8.

## Angular momentum of a rigid body

The previous module defined the angular momentum of a group of particles about a point $O$ as $\mathbf{H}_O = \sum_i \mathbf{r}_i\times m_i\mathbf{v}_i$: add up position crossed with momentum for every particle. It then split that sum into two parts:

$$
\mathbf{H}_O = \mathbf{r}_C\times M\mathbf{v}_C + \mathbf{H}_C .
$$

Here $M$ is the total mass, and $\mathbf{r}_C$ and $\mathbf{v}_C$ are the position and velocity of the center of mass $C$ measured from $O$. The first term is the **orbital** part: the whole body treated as one heavy dot swinging past $O$. The second, $\mathbf{H}_C = \sum_i\boldsymbol{\rho}_i\times m_i\dot{\boldsymbol{\rho}}_i$, uses positions $\boldsymbol{\rho}_i$ ("rho i") and velocities measured from the center of mass. It is the **[[spin part|orbit-and-spin]]**. For a rigid body, lesson 2 put $\dot{\boldsymbol{\rho}} = \boldsymbol{\omega}\times\boldsymbol{\rho}$ into that second term and found

$$
\mathbf{H}_C = \mathbf{I}\,\boldsymbol{\omega},
$$

with $\mathbf{I}$ the inertia tensor about the center of mass. From here on this module drops the subscript and writes $\mathbf{H}$ for $\mathbf{H}_C$. Whenever a lesson says "angular momentum" with no other label, it means this spin part, about the center of mass.

The units are $\mathrm{kg\,m^2/s}$. That is the same as $\mathrm{N\,m\,s}$ — a torque times a time — and the second form is the one reaction wheel data sheets use.

### Writing it out in components

In body axes, with the tensor written as in lesson 2,

$$
\begin{bmatrix} H_x \\ H_y \\ H_z \end{bmatrix}
=
\begin{bmatrix}
I_{xx} & -I_{xy} & -I_{xz} \\
-I_{xy} & I_{yy} & -I_{yz} \\
-I_{xz} & -I_{yz} & I_{zz}
\end{bmatrix}
\begin{bmatrix} \omega_x \\ \omega_y \\ \omega_z \end{bmatrix}.
$$

Read the top row: $H_x = I_{xx}\omega_x - I_{xy}\omega_y - I_{xz}\omega_z$. So a spin about body $x$ alone still makes angular momentum along $y$ and $z$, whenever the products of inertia are not zero.

In principal axes the products of inertia vanish and the three components come apart:

$$
H_1 = I_1\omega_1, \qquad H_2 = I_2\omega_2, \qquad H_3 = I_3\omega_3 .
$$

This is the form the rest of the module uses. It looks like three copies of the wheel-on-a-shaft rule $H = I\omega$, and that is the trap. The three components are multiplied by three *different* numbers. So the vector $\mathbf{H}$ is not a plain multiple of $\boldsymbol{\omega}$ unless only one component is nonzero.

::: key Angular momentum of a rigid body
About its center of mass, $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$; in principal axes $H_k = I_k\omega_k$. $\mathbf{H}$ and $\boldsymbol{\omega}$ are parallel only when $\boldsymbol{\omega}$ lies along a principal axis, or when all three principal moments are equal — which is exactly why an off-axis spin nutates. Units: $\mathrm{kg\,m^2/s} = \mathrm{N\,m\,s}$.
:::

## How far apart are H and ω?

Picture $\mathbf{I}$ acting on $\boldsymbol{\omega}$ in principal axes as three separate stretches. The piece of $\boldsymbol{\omega}$ along the major axis is multiplied by the biggest number. The piece along the minor axis is multiplied by the smallest. So the result, $\mathbf{H}$, gets **[[pulled toward the major axis|h-leans-major]]** compared with $\boldsymbol{\omega}$.

To measure the gap, use the dot product. The angle $\phi$ ("phi") between the two vectors obeys

$$
\cos\phi = \frac{\boldsymbol{\omega}\cdot\mathbf{H}}{\lVert\boldsymbol{\omega}\rVert\,\lVert\mathbf{H}\rVert}
= \frac{\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}}{\lVert\boldsymbol{\omega}\rVert\,\lVert\mathbf{I}\boldsymbol{\omega}\rVert},
$$

where $\lVert\cdot\rVert$ means the length of a vector. The angle is zero exactly when $\boldsymbol{\omega}$ is an eigenvector of $\mathbf{I}$ — a principal axis.

How big does it get? Most spacecraft have principal moments within a factor of two of each other, and for them $\phi$ is at most a few tens of degrees. A slender launch vehicle stage is different: its moments differ by a factor near a hundred. Spin it only slightly off its long axis and $\mathbf{H}$ ends up nearly perpendicular to that axis.

::: example A nearly axial spin on a communications bus
A satellite bus has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$. ("diag" means a matrix with these numbers down the diagonal and zeros elsewhere — the body axes are principal.) It spins mostly about its major axis $z$, with a small part along $x$: $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$.

**The spin.** Its rate is $\lVert\boldsymbol{\omega}\rVert = \sqrt{0.02^2 + 0.10^2} = 0.102\,\mathrm{rad/s}$. It is tilted from $z$ by $\arctan(0.02/0.10) = 11.3^\circ$.

**The angular momentum.** Multiply each component by its own moment: $\mathbf{H} = (1200\times 0.02,\ 0,\ 2000\times 0.10) = (24, 0, 200)\,\mathrm{N\,m\,s}$. Its size is $\sqrt{24^2 + 200^2} = 201.4\,\mathrm{N\,m\,s}$, and it is tilted from $z$ by $\arctan(24/200) = 6.84^\circ$.

**The gap.** Both vectors lie in the $xz$ plane, so the angle between them is the difference: $11.3^\circ - 6.84^\circ = 4.47^\circ$. Check with the dot product. $\boldsymbol{\omega}\cdot\mathbf{H} = 0.02\times 24 + 0.10\times 200 = 20.48$. Divide by the two lengths: $20.48/(0.102\times 201.4) = 0.99696$. Its arccosine is $4.47^\circ$. The two methods agree.

**Does it make sense?** The $z$ part was multiplied by $2000$ and the $x$ part by only $1200$, so $\mathbf{H}$ should sit closer to $z$ than $\boldsymbol{\omega}$ does. It does: $6.84^\circ$ against $11.3^\circ$.

With no torque, $\mathbf{H}$ is fixed in space. So it is $\boldsymbol{\omega}$ — and the body with it — that must move, circling $\mathbf{H}$ on a cone about $4.5^\circ$ wide. That circling is **[[nutation|nutation-word]]**, and lesson 9 computes its rate.
:::

::: example A spin about a body axis that is not principal
Lesson 3 added a 40 kg tank to the same bus and found, in the structural axes,

$$
\mathbf{I} = \begin{bmatrix} 1232.4 & -21.6 & 0 \\ -21.6 & 1514.4 & 0 \\ 0 & 0 & 2046.8 \end{bmatrix}\mathrm{kg\,m^2}.
$$

Spin it about body $x$ at $\boldsymbol{\omega} = (0.05, 0, 0)\,\mathrm{rad/s}$. Multiply the matrix by the vector, which picks out the first column times $0.05$:

$$
\mathbf{H} = (1232.4\times 0.05,\ -21.6\times 0.05,\ 0) = (61.62,\ -1.08,\ 0)\,\mathrm{N\,m\,s}.
$$

A spin purely about $x$ has produced a $y$ part of angular momentum, because $x$ is not a principal axis of this tensor. $\mathbf{H}$ is turned away from $\boldsymbol{\omega}$ by $\arctan(1.08/61.62) = 1.00^\circ$, toward $-y$.

Now ask what it takes to hold this spin steady in the body. The next lesson shows that a constant $\boldsymbol{\omega}$ in body axes needs a torque $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{H}$. Here only the third component survives:

$$
\boldsymbol{\omega}\times\mathbf{H} = \bigl(0,\ 0,\ 0.05\times(-1.08) - 0\times 61.62\bigr) = (0,\ 0,\ -0.054)\,\mathrm{N\,m}.
$$

Without that torque — which in a spinning wheel the **[[bearings supply|wheel-balance]]** — the spin will not stay on body $x$. It wanders toward the nearby principal axis, $4.35^\circ$ away. A steady spin about an axis that is not principal is not free motion. Something must be pushing.
:::

## Rotational kinetic energy

A spinning body has energy even if its center of mass sits still. Every bit of mass is moving, and each bit carries the familiar $\tfrac{1}{2}mv^2$. Add them all up and you have the rotational kinetic energy.

The velocity of a bit of mass is $\mathbf{v} = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$: the drift of the center of mass plus the speed from turning. When you square it and add over the body, the cross term $\mathbf{v}_C\cdot\int(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm$ drops out, because $\int\boldsymbol{\rho}\,dm = 0$ — that is what "center of mass" means. The energy splits cleanly into a moving part and a spinning part (**[[König's theorem|konig]]** from the previous module):

$$
T_{\mathrm{total}} = \tfrac{1}{2}M\lVert\mathbf{v}_C\rVert^2 + T,
\qquad
T = \tfrac{1}{2}\int\lVert\boldsymbol{\omega}\times\boldsymbol{\rho}\rVert^2\,dm .
$$

Working out that integral gives a short, beautiful answer:

$$
T = \tfrac{1}{2}\,\boldsymbol{\omega}\cdot\mathbf{H} = \tfrac{1}{2}\,\boldsymbol{\omega}^\top\mathbf{I}\,\boldsymbol{\omega}.
$$

Read it as "half omega dot H". It matches the one-particle rule $\tfrac{1}{2}I\omega^2 = \tfrac{1}{2}\omega(I\omega)$, with vectors in place of numbers.

::: note Why it has to be true
Start from $T = \tfrac{1}{2}\int(\boldsymbol{\omega}\times\boldsymbol{\rho})\cdot(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm$. Use the **[[triple product swap|triple-product]]**: for any vectors, $(\mathbf{a}\times\mathbf{b})\cdot\mathbf{c} = \mathbf{a}\cdot(\mathbf{b}\times\mathbf{c})$. Take $\mathbf{a} = \boldsymbol{\omega}$, $\mathbf{b} = \boldsymbol{\rho}$ and $\mathbf{c} = \boldsymbol{\omega}\times\boldsymbol{\rho}$:

$$
T = \tfrac{1}{2}\,\boldsymbol{\omega}\cdot\int\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})\,dm
= \tfrac{1}{2}\,\boldsymbol{\omega}\cdot\mathbf{H}
= \tfrac{1}{2}\,\boldsymbol{\omega}^\top\mathbf{I}\,\boldsymbol{\omega}.
$$

The first step pulled $\boldsymbol{\omega}$ out of the integral, since every bit of mass shares it. The integral left behind is exactly the one that defined $\mathbf{H}$ in lesson 2. The last step replaced $\mathbf{H}$ by $\mathbf{I}\boldsymbol{\omega}$.
:::

In principal axes the energy is a sum of three familiar-looking terms:

$$
T = \tfrac{1}{2}\left(I_1\omega_1^2 + I_2\omega_2^2 + I_3\omega_3^2\right)
= \frac{H_1^2}{2I_1} + \frac{H_2^2}{2I_2} + \frac{H_3^2}{2I_3}.
$$

The second form used $\omega_k = H_k/I_k$ in each term. The units are joules. For a spin about a single principal axis with moment $I$, the sum collapses to one term:

$$
T = \frac{H^2}{2I} .
$$

### Same momentum, different energy

Read that last formula the way the spin-stability lessons will. Hold the amount of angular momentum fixed. Then the energy of a pure spin is *inversely* proportional to the moment of inertia about the spin axis. Spinning about the major axis is the cheapest way, in energy, to carry a given $\mathbf{H}$. Spinning about the minor axis is the most expensive.

For the bus, $H = 200\,\mathrm{N\,m\,s}$ can be carried three ways:

- about $z$ at $200/2000 = 0.10\,\mathrm{rad/s}$, with $T = 200^2/(2\times 2000) = 10.0\,\mathrm{J}$;
- about $y$ at $200/1500 = 0.133\,\mathrm{rad/s}$, with $T = 200^2/(2\times 1500) = 13.3\,\mathrm{J}$;
- about $x$ at $200/1200 = 0.167\,\mathrm{rad/s}$, with $T = 200^2/(2\times 1200) = 16.7\,\mathrm{J}$.

Same angular momentum, different energy. If anything inside the body can soak up energy without changing $\mathbf{H}$ — a sloshing liquid, a flexing antenna — the body will **[[slide down that list|energy-ladder]]**.

::: key Rotational kinetic energy
$T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$, in joules; in principal axes $T = \tfrac{1}{2}\sum_k I_k\omega_k^2 = \sum_k H_k^2/(2I_k)$. For a spin about a single principal axis, $T = H^2/(2I)$: at fixed $H$, the major axis carries the least energy and the minor axis the most.
:::

Back to the two examples. In the first, $T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H} = \tfrac{1}{2}\times 20.48 = 10.24\,\mathrm{J}$. That is a little more than the $10.0\,\mathrm{J}$ of a pure $z$ spin with the same $\lVert\mathbf{H}\rVert$ — the small $x$ part costs extra, because it rides on a smaller moment. In the second, $T = \tfrac{1}{2}\times 0.05\times 61.62 = 1.54\,\mathrm{J}$.

## A fixed arrow seen from a spinning seat

The tensor is constant in body axes, so $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ is really a body-frame statement: $\mathbf{H}_B = \mathbf{I}_B\boldsymbol{\omega}_B$, where the subscript $B$ means "components along the body axes". The inertial components are $\mathbf{H}_N = \mathbf{R}\mathbf{H}_B$, with $\mathbf{R}$ the attitude matrix of lesson 1.

Why not work in inertial axes instead? Because there the tensor would be $\mathbf{R}\mathbf{I}_B\mathbf{R}^\top$, a matrix that changes every instant as the body turns. Nobody writes rotational dynamics that way. The body frame makes $\mathbf{I}$ constant, at the price of a frame that rotates. That is why the body frame is the natural home of Euler's equations.

The price shows up when you take a rate of change. The transport rule of lesson 1 says, for any vector,

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \left.\frac{d\mathbf{H}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{H} .
$$

The left side is the change seen from space ($N$). The first term on the right is the change a rider on the body sees ($B$). The last term is the effect of the rider's own turning.

Now suppose no torque acts. Then the left side is zero and $\mathbf{H}$ is a fixed arrow in space. The rider sees its components change at the rate $-\boldsymbol{\omega}\times\mathbf{H}$, which is not zero whenever $\mathbf{H}$ and $\boldsymbol{\omega}$ point different ways. Think of sitting on a spinning office chair and watching a doorway: the doorway does not move, but from your seat it sweeps around you.

So the body components $(H_1, H_2, H_3)$ change while the length $\lVert\mathbf{H}\rVert$ stays put. And since $H_k = I_k\omega_k$, the body rates $\omega_k$ change too — with no torque applied at all. This is the root of every gyroscopic effect in the module. The next lesson turns this line into Euler's equations by setting the inertial rate equal to the applied torque.

## How big are these numbers?

Angular momentum on flight hardware spans a huge range. A feel for the sizes helps with the sizing arguments later.

| System | $I$ ($\mathrm{kg\,m^2}$) | $\omega$ ($\mathrm{rad/s}$) | $H$ ($\mathrm{N\,m\,s}$) |
| --- | --- | --- | --- |
| Reaction wheel at 6,000 rpm | $0.05$ | $628$ | $31.4$ |
| Communications bus turning about $z$ | $2000$ | $0.05$ | $100$ |
| Loaded first stage rolling at $2^\circ/\mathrm{s}$ | $7.03\times 10^{5}$ | $0.0349$ | $2.45\times 10^{4}$ |
| Loaded first stage pitching at $2^\circ/\mathrm{s}$ | $5.92\times 10^{7}$ | $0.0349$ | $2.07\times 10^{6}$ |
| Space Station turning at **[[orbit rate|station-orbit-rate]]** | $\sim 1.2\times 10^{8}$ | $1.13\times 10^{-3}$ | $\sim 1.4\times 10^{5}$ |

Two comparisons stand out. The wheel and the bus carry angular momenta within a factor of three of each other. That is why a wheel can trade momentum with a bus and turn it — the subject of lesson 11. And the first stage pitching at the same rate as it rolls carries $84$ times the angular momentum, the inertia ratio from lesson 2. So for the same change in rate, the pitch controller must command about a hundred times the torque of the roll controller.

::: warning Angular momentum depends on the reference point
$\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ holds when both $\mathbf{H}$ and $\mathbf{I}$ are taken about the center of mass, or about a point fixed both in the body and in space — a bearing, say. About a general moving point it does not: you must add the orbital term $\mathbf{r}_C\times M\mathbf{v}_C$, and use the tensor about that point. Mixing an inertia tensor about the structural origin with an angular momentum about the center of mass is a common simulation bug. It shows up as a fake torque proportional to the vehicle's acceleration.
:::

::: warning A drifting energy may be your integrator, not physics
$T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$ is a single number with the same value in every frame. But if you compute it from body rates produced by a poor integrator, it will drift — and the drift looks exactly like the real energy loss of lesson 8. Before trusting any simulated energy history, run the same case with no torque and confirm that $T$ and $\lVert\mathbf{H}\rVert$ hold to your integrator's tolerance.
:::

::: note Units of angular momentum
$\mathrm{kg\,m^2/s}$, $\mathrm{N\,m\,s}$ and $\mathrm{J\,s}$ are the same unit. Reaction wheel catalogs quote capacity in $\mathrm{N\,m\,s}$: a small wheel holds $0.01$ to $1\,\mathrm{N\,m\,s}$, a large one for a geostationary bus $50$ to $100\,\mathrm{N\,m\,s}$, and one Space Station control moment gyro $4{,}760\,\mathrm{N\,m\,s}$. Kinetic energy, in joules, is a different quantity and cannot be compared with any of them.
:::

## Check yourself

::: check
A body with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ has $\boldsymbol{\omega} = (0.05, 0.05, 0)\,\mathrm{rad/s}$. Find $\mathbf{H}$, the angle between $\mathbf{H}$ and $\boldsymbol{\omega}$, and $T$.
:::

::: answer
Multiply each component by its moment: $\mathbf{H} = (1200\times 0.05,\ 1500\times 0.05,\ 0) = (60, 75, 0)\,\mathrm{N\,m\,s}$. Its size is $\sqrt{60^2 + 75^2} = 96.0\,\mathrm{N\,m\,s}$.

Both vectors lie in the $xy$ plane. $\boldsymbol{\omega}$ has equal parts, so it sits at $45^\circ$ from $x$. $\mathbf{H}$ sits at $\arctan(75/60) = 51.3^\circ$. The angle between them is $51.3^\circ - 45^\circ = 6.3^\circ$. $\mathbf{H}$ has been pulled toward $y$, the axis with the larger moment — as it should be.

Energy: $T = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H} = \tfrac{1}{2}(0.05\times 60 + 0.05\times 75) = \tfrac{1}{2}\times 6.75 = 3.38\,\mathrm{J}$. Check the other way: $\tfrac{1}{2}(1200 + 1500)\times 0.05^2 = \tfrac{1}{2}\times 2700\times 0.0025 = 3.38\,\mathrm{J}$.
:::

::: check
A spacecraft carries $H = 150\,\mathrm{N\,m\,s}$ as a pure spin about its minor axis, $I_1 = 1200\,\mathrm{kg\,m^2}$. How much rotational kinetic energy would it shed if the same angular momentum were carried instead as a pure spin about its major axis, $I_3 = 2000\,\mathrm{kg\,m^2}$? What are the two spin rates?
:::

::: answer
About the minor axis: $T_1 = 150^2/(2\times 1200) = 22{,}500/2400 = 9.38\,\mathrm{J}$, at $\omega_1 = 150/1200 = 0.125\,\mathrm{rad/s}$.

About the major axis: $T_3 = 150^2/(2\times 2000) = 22{,}500/4000 = 5.63\,\mathrm{J}$, at $\omega_3 = 150/2000 = 0.075\,\mathrm{rad/s}$.

The difference is $9.38 - 5.63 = 3.75\,\mathrm{J}$, forty percent of the starting energy. If some internal mechanism can drain that energy while no outside torque acts, the second state is where the spacecraft ends up: a slower spin about a different axis, with exactly the same angular momentum.
:::

::: check
Explain, using $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, why a body cannot rotate at constant $\boldsymbol{\omega}$ about an axis that is not principal unless a torque acts.
:::

::: answer
If $\boldsymbol{\omega}$ is constant in body axes, and $\mathbf{I}$ is constant there too, then $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ has constant body components. Its body rate of change is zero, so the transport rule gives $d\mathbf{H}/dt|_N = \boldsymbol{\omega}\times\mathbf{H}$.

Off a principal axis, $\mathbf{H}$ is not parallel to $\boldsymbol{\omega}$, so this cross product is not zero. The angular momentum is changing in space, and that takes an outside torque, $\mathbf{M} = \boldsymbol{\omega}\times\mathbf{H}$. Without it, $\boldsymbol{\omega}$ cannot stay constant.

Along a principal axis, $\mathbf{H}$ is parallel to $\boldsymbol{\omega}$, the cross product is zero, and a steady spin needs no help.
:::

::: check
A reaction wheel with $I_w = 0.05\,\mathrm{kg\,m^2}$ spins at $6{,}000\,\mathrm{rpm}$. What is its angular momentum? If internal friction alone brought it to rest, how fast would the $2000\,\mathrm{kg\,m^2}$ spacecraft it sits in end up turning about the wheel axis?
:::

::: answer
Convert to radians per second: $\omega_w = 6000\times 2\pi/60 = 628\,\mathrm{rad/s}$. Then $H_w = 0.05\times 628 = 31.4\,\mathrm{N\,m\,s}$.

Friction between wheel and spacecraft is an internal torque. It cannot change the total angular momentum, so the $31.4\,\mathrm{N\,m\,s}$ must reappear in the spacecraft body: $\omega = 31.4/2000 = 0.0157\,\mathrm{rad/s}$, about $0.9^\circ/\mathrm{s}$, in the direction the wheel was spinning. Lesson 11 turns this exchange into a way of steering.
:::

::: check
A simulation reports that the rotational kinetic energy of a torque-free rigid body fell by two percent over an hour. List the possible explanations and how you would tell them apart.
:::

::: answer
For a truly rigid body with no torque, $T$ is exactly conserved. So one of three things is wrong: the simulation is not really torque free, the body model is not really rigid, or the integrator is at fault.

Check $\lVert\mathbf{H}\rVert$ first.

- An integration error usually drifts both $T$ and $\lVert\mathbf{H}\rVert$, and halving the step size shrinks the drift by a predictable factor.
- A modeled internal energy sink (a damper, lesson 8) lowers $T$ while holding $\lVert\mathbf{H}\rVert$ constant to integrator tolerance.
- An unintended outside torque changes both.

Only after the integrator is cleared is a two percent energy loss a physical result.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ | Angular momentum about the center of mass; $\mathrm{kg\,m^2/s} = \mathrm{N\,m\,s}$ |
| $H_k = I_k\omega_k$ | Principal-axis components; three different multipliers, so $\mathbf{H} \nparallel \boldsymbol{\omega}$ in general |
| $\cos\phi = \boldsymbol{\omega}\cdot\mathbf{H}/(\lVert\boldsymbol{\omega}\rVert\lVert\mathbf{H}\rVert)$ | Angle between $\mathbf{H}$ and $\boldsymbol{\omega}$; zero only along a principal axis or for equal moments |
| $T = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = \tfrac{1}{2}\boldsymbol{\omega}\cdot\mathbf{H}$ | Rotational kinetic energy, joules; $\tfrac{1}{2}\sum_k I_k\omega_k^2 = \sum_k H_k^2/(2I_k)$ |
| $T = H^2/(2I)$ | Pure spin about one principal axis; least for the major axis at fixed $H$ |
| $\mathbf{H}_O = \mathbf{r}_C\times M\mathbf{v}_C + \mathbf{H}$ | Angular momentum about another point: orbital plus spin |
| $d\mathbf{H}/dt\vert_N = d\mathbf{H}/dt\vert_B + \boldsymbol{\omega}\times\mathbf{H}$ | Transport rule; a fixed $\mathbf{H}$ has changing body components when $\mathbf{H} \nparallel \boldsymbol{\omega}$ |
| Bus example | $\boldsymbol{\omega} = (0.02, 0, 0.10)$ gives $\mathbf{H} = (24, 0, 200)$, $4.47^\circ$ apart, $T = 10.24\,\mathrm{J}$ |

The next lesson sets the inertial rate of change of $\mathbf{H}$ equal to the applied torque and writes it out in body axes. The result — Euler's rotational equations — is three linked equations for the body rates, and the link is the $\boldsymbol{\omega}\times\mathbf{H}$ you have now met twice.

::: context orbit-and-spin Two kinds of turning
Earth shows both parts at once. It swings around the Sun once a year — that is orbital angular momentum, the $\mathbf{r}_C\times M\mathbf{v}_C$ term, treating Earth as one heavy dot. It also spins on its axis once a day — that is spin angular momentum, $\mathbf{H}_C$. Attitude control cares only about the second. Orbit mechanics looks after the first. Splitting them about the center of mass is what lets the two subjects live in separate modules.
:::

::: context h-leans-major Why H leans toward the major axis
The bus example drawn in its $xz$ plane, to scale. The spin $\boldsymbol{\omega}$ (red) is $11.3^\circ$ from $z$. The angular momentum $\mathbf{H}$ (blue) is only $6.84^\circ$ from $z$, because its $z$ part was multiplied by $2000$ while its $x$ part got only $1200$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="205" x2="330" y2="205" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="318" y="198" font-size="12" fill="#6c7a93">x</text>
  <line x1="40" y1="205" x2="40" y2="8" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="26" y="18" font-size="12" fill="#6c7a93">z</text>
  <line x1="40" y1="205" x2="77.3" y2="18.7" stroke="#b4232c" stroke-width="3"/>
  <polygon points="77.3,18.7 70.8,30.7 78.7,32.2" fill="#b4232c"/>
  <text x="86" y="40" font-size="12" fill="#b4232c">ω, 11.3° from z</text>
  <line x1="40" y1="205" x2="62.6" y2="16.4" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="62.6,16.4 57.1,28.8 65.0,29.8" fill="#1d6fd1"/>
  <text x="86" y="62" font-size="12" fill="#1d6fd1">H, 6.84° from z</text>
  <text x="150" y="130" font-size="12" fill="#1f2a44">gap between them: 4.47°</text>
  <text x="150" y="150" font-size="12" fill="#1f2a44">H sits nearer the major axis</text>
</svg>
```
:::

::: context nutation-word Nodding
*Nutation* comes from the Latin *nutare*, "to nod". Astronomers first used it for a small nodding of Earth's own axis. For a spacecraft it means the slow coning of the body around its fixed angular momentum. Spinning satellites carry nutation dampers precisely to kill this nod, because a coning antenna or camera points in the wrong place.
:::

::: context wheel-balance The same thing as balancing a car tire
A tire shop balances wheels in two ways. "Static" balance puts the center of mass on the axle. "Dynamic" balance makes the axle a principal axis — it removes the products of inertia. A tire that is statically balanced but not dynamically balanced still shakes the steering wheel at speed. That shake is the bearings pushing with $\boldsymbol{\omega}\times\mathbf{H}$, turning around once per revolution, to keep $\mathbf{H}$ lined up with the axle. Reaction wheels are balanced the same way, to tiny tolerances, because that once-per-turn push jitters the whole spacecraft.
:::

::: context konig A useful split
Johann Samuel König was an eighteenth-century mathematician. The theorem says the kinetic energy of any group of particles equals the energy of the whole mass moving with the center of mass, plus the energy of motion *relative* to the center of mass. The cross terms cancel because positions measured from the center of mass average to zero. It is why a rocket's energy budget can treat "flying" and "tumbling" separately.
:::

::: context triple-product Why the swap is allowed
The number $(\mathbf{a}\times\mathbf{b})\cdot\mathbf{c}$ is the volume of the slanted box whose edges are $\mathbf{a}$, $\mathbf{b}$ and $\mathbf{c}$, with a sign for handedness. The volume does not care which pair you cross first, as long as you keep the order $\mathbf{a}, \mathbf{b}, \mathbf{c}$ going around. So $(\mathbf{a}\times\mathbf{b})\cdot\mathbf{c} = \mathbf{a}\cdot(\mathbf{b}\times\mathbf{c})$: the dot and the cross can trade places.
:::

::: context energy-ladder The energy ladder at fixed H
The three ways the bus can carry $H = 200\,\mathrm{N\,m\,s}$, drawn to scale. Draining energy while keeping $H$ can only move the body down the ladder, toward the major axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="32" font-size="12" fill="#1f2a44">minor x</text>
  <rect x="80" y="18" width="250.5" height="20" fill="#b4232c"/>
  <text x="325" y="54" font-size="12" text-anchor="end" fill="#1f2a44">16.7 J</text>
  <text x="10" y="80" font-size="12" fill="#1f2a44">interm. y</text>
  <rect x="80" y="66" width="200" height="20" fill="#f2b880"/>
  <text x="280" y="102" font-size="12" text-anchor="end" fill="#1f2a44">13.3 J</text>
  <text x="10" y="128" font-size="12" fill="#1f2a44">major z</text>
  <rect x="80" y="114" width="150" height="20" fill="#1d6fd1"/>
  <text x="240" y="129" font-size="12" fill="#1f2a44">10.0 J (lowest)</text>
</svg>
```
:::

::: context station-orbit-rate Turning once per orbit
The Space Station keeps the same side facing Earth. To do that it must turn once for every lap of its orbit, about $92.6$ minutes. One turn is $2\pi$ radians, so its rate is $2\pi/5554\,\mathrm{s} = 1.13\times 10^{-3}\,\mathrm{rad/s}$ — slow, but carried by an enormous inertia.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="110" r="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="114" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="110" cy="110" r="80" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g transform="translate(110,30) rotate(0)"><rect x="-14" y="-5" width="28" height="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><circle cx="0" cy="5" r="3" fill="#b4232c"/></g>
  <g transform="translate(190,110) rotate(90)"><rect x="-14" y="-5" width="28" height="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><circle cx="0" cy="5" r="3" fill="#b4232c"/></g>
  <g transform="translate(110,190) rotate(180)"><rect x="-14" y="-5" width="28" height="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><circle cx="0" cy="5" r="3" fill="#b4232c"/></g>
  <g transform="translate(30,110) rotate(-90)"><rect x="-14" y="-5" width="28" height="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/><circle cx="0" cy="5" r="3" fill="#b4232c"/></g>
  <text x="215" y="80" font-size="12" fill="#b4232c">red dot: Earth-facing side</text>
  <text x="215" y="104" font-size="12" fill="#1f2a44">one lap of the orbit</text>
  <text x="215" y="122" font-size="12" fill="#1f2a44">= one full turn</text>
  <text x="215" y="146" font-size="12" fill="#1f2a44">ω ≈ 1.13 × 10⁻³ rad/s</text>
</svg>
```
:::
