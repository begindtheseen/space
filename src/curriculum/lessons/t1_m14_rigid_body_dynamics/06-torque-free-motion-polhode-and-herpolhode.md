---
id: l06-torque-free-motion-polhode-and-herpolhode
title: Torque-free motion, the polhode and the herpolhode
minutes: 21
covers:
  - torque-free motion, polhode and herpolhode
---

Toss a paperback book into the air with a spin. Once it leaves your hand, nothing twists it — gravity pulls on its center of mass but makes no torque about it. Yet it rarely turns neatly. It wobbles, and sometimes it flips. This lesson is about what a rigid body does when it is left completely alone.

Set the torque to zero in Euler's equations and ask that question for real vehicles. A spacecraft between maneuvers, a spent upper stage, a tumbling piece of debris, a **[[spin-stabilized probe|spinning-cruise]]** coasting to Mars — all are close to this case. The answer is richer than "it keeps spinning". Unless the body happens to turn about a principal axis, its angular velocity keeps moving through the body, and the body wobbles in a way that is regular but is not a simple rotation.

The two conservation laws from lesson 5 — constant kinetic energy and constant angular momentum — do most of the work here without solving anything. Each one traps the body-frame angular velocity on a surface: one an ellipsoid (a stretched ball), one a sphere. The motion must stay where the two surfaces meet. That meeting curve is the **[[polhode|polhode-word]]**, and its shape tells you at a glance which spins are stable — the subject of the next lesson. The same idea seen from space gives the **herpolhode** and a famous picture of an ellipsoid rolling on a table. For a body with two equal moments, the whole motion can be solved exactly, and that solution underlies everything this module says about spinning spacecraft.

## Two numbers that never change

With $\mathbf{M} = 0$, Euler's equations in principal axes are

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,\omega_2\omega_3, \qquad
I_2\dot{\omega}_2 = (I_3 - I_1)\,\omega_3\omega_1, \qquad
I_3\dot{\omega}_3 = (I_1 - I_2)\,\omega_1\omega_2 .
$$

Lesson 5 showed that two numbers stay constant along any solution. One is twice the rotational kinetic energy,

$$
2T = I_1\omega_1^2 + I_2\omega_2^2 + I_3\omega_3^2 .
$$

The other is the squared length of the angular momentum,

$$
H^2 = I_1^2\omega_1^2 + I_2^2\omega_2^2 + I_3^2\omega_3^2 .
$$

Both are set once, by how the body was released. Such constant quantities are called **integrals of the motion**.

Now read each one as an equation for the point $(\omega_1, \omega_2, \omega_3)$ in a space whose axes are the three body rates. The first is an ellipsoid centered on the origin, with half-widths $\sqrt{2T/I_k}$ along the principal axes: the **energy ellipsoid**. It is a scaled copy of the inertia ellipsoid from lesson 3. The second is also an ellipsoid, the **momentum ellipsoid**, with half-widths $H/I_k$. The angular velocity must sit on both at every instant, so it moves along the curve where they cross. That curve is the polhode.

### A cleaner picture in H-space

It is neater to plot the body components of $\mathbf{H}$ instead of $\boldsymbol{\omega}$, because then one of the two surfaces becomes a perfect sphere. Put $H_k = I_k\omega_k$ into both equations:

$$
H_1^2 + H_2^2 + H_3^2 = H^2, \qquad
\frac{H_1^2}{I_1} + \frac{H_2^2}{I_2} + \frac{H_3^2}{I_3} = 2T .
$$

The first is the **momentum sphere** of radius $H$. The second is an ellipsoid with half-widths $\sqrt{2TI_k}$. So the body-frame angular momentum — constant in length, but changing direction as seen from the body — runs along the crossing of a sphere and an ellipsoid. The pictures below live in this $\mathbf{H}$-space.

## The shape of the polhode

Number the moments so that $I_1 < I_2 < I_3$: axis 1 is minor, 2 is intermediate, 3 is major. The ellipsoid's half-widths then line up the same way: $\sqrt{2TI_1} < \sqrt{2TI_2} < \sqrt{2TI_3}$.

A sphere and an ellipsoid with the same center only meet if the sphere's radius falls between the ellipsoid's smallest and largest half-widths. So every torque-free motion obeys

$$
2TI_1 \le H^2 \le 2TI_3 .
$$

The two ends are the pure spins. $H^2 = 2TI_3$ means $\mathbf{H}$ lies along the major axis, and the polhode shrinks to a single point at that pole. $H^2 = 2TI_1$ is a pure minor-axis spin, a point at the other pole.

In between, what matters is where $H^2$ sits compared with the middle value $2TI_2$:

- **$2TI_2 < H^2 < 2TI_3$.** The sphere is wider than the ellipsoid's two smaller half-widths, but narrower than its largest. The ellipsoid pokes out through the sphere only near the major poles. So the crossing is a pair of small closed loops, one around each end of the major axis. $\mathbf{H}$ — and $\boldsymbol{\omega}$ with it — circles the major axis and never strays far. These are the *major-axis* polhodes.
- **$2TI_1 < H^2 < 2TI_2$.** By the same reasoning, the crossing is a pair of closed loops around the ends of the *minor* axis. These are the *minor-axis* polhodes.
- **$H^2 = 2TI_2$.** The borderline case. The crossing is two big curves that cross each other at the ends of the intermediate axis. This curve is the **[[separatrix|separatrix-word]]**, the divider. It splits the sphere into the four regions where the closed loops live.

::: note Why the borderline is two crossing curves
Take the sphere equation and subtract $I_2$ times the energy equation. The $H_2$ terms cancel, and with $H^2 = 2TI_2$ the right side is zero:

$$
H_1^2\left(1 - \frac{I_2}{I_1}\right) + H_3^2\left(1 - \frac{I_2}{I_3}\right) = 0 .
$$

Because $I_1 < I_2 < I_3$, the first bracket is negative and the second positive. Move the first term across:

$$
H_3^2\,\frac{I_3 - I_2}{I_3} = H_1^2\,\frac{I_2 - I_1}{I_1} .
$$

That says $H_3$ is a fixed multiple of $\pm H_1$: two flat planes, both containing the intermediate axis. Each plane slices the sphere in a great circle, and the two cross at the intermediate-axis poles.
:::

Put it all together and [[the momentum sphere looks like this|sphere-picture]]: two families of nested loops, one around the major-axis poles and one around the minor-axis poles, separated by a figure-eight pair of curves that cross exactly at the intermediate-axis poles.

Near the major and minor poles the loops are small. A body spinning almost about either axis has $\mathbf{H}$ wander only a little through the body — that is stability. The intermediate poles are different: the separatrix crosses itself there. Start $\mathbf{H}$ exactly on that pole and it stays. Start it a hair away, and it lies on a loop that hugs the separatrix, running all the way around the sphere to near the *opposite* intermediate pole and back. That is the tumble of the next lesson, read straight off a drawing.

::: key The polhode
For torque-free motion the body components of $\mathbf{H}$ lie on the intersection of the momentum sphere $\lVert\mathbf{H}\rVert^2 = H^2$ and the energy ellipsoid $\sum_k H_k^2/I_k = 2T$. The intersection — the polhode — is a small closed curve around the major axis when $2TI_2 < H^2 < 2TI_3$, around the minor axis when $2TI_1 < H^2 < 2TI_2$, and the self-crossing separatrix through the intermediate axis when $H^2 = 2TI_2$.
:::

::: example Which polhode is the bus on?
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ starts at $\boldsymbol{\omega} = (0.02, 0, 0.10)\,\mathrm{rad/s}$, the case simulated in lesson 5. Lesson 4 found $H = 201.4\,\mathrm{N\,m\,s}$ and $T = 10.24\,\mathrm{J}$.

**Square and compare.** $H^2 = 40{,}576$. The three comparison values are $2T$ times each moment, with $2T = 20.48$:

$$
2TI_1 = 24{,}576, \qquad 2TI_2 = 30{,}720, \qquad 2TI_3 = 40{,}960
\quad(\mathrm{N^2\,m^2\,s^2}).
$$

**Read it off.** $H^2$ lies between $2TI_2$ and $2TI_3$, so the polhode is a small loop around the major axis $z$. That matches the simulation: $\omega_3$ stayed between $0.0993$ and $0.100\,\mathrm{rad/s}$ while $\omega_1$ and $\omega_2$ swung by $0.020$ and $0.0226\,\mathrm{rad/s}$.

**Get the swings from the two laws alone.** At the point of the loop where $\omega_2 = 0$, the two equations are $1200\omega_1^2 + 2000\omega_3^2 = 20.48$ and $1200^2\omega_1^2 + 2000^2\omega_3^2 = 40{,}576$; they return the starting values $\omega_1 = 0.02$, $\omega_3 = 0.10$. At the point where $\omega_1 = 0$, they become $1500\omega_2^2 + 2000\omega_3^2 = 20.48$ and $1500^2\omega_2^2 + 2000^2\omega_3^2 = 40{,}576$. Solving these two for the two unknowns gives $\omega_2^2 = 5.12\times 10^{-4}$, so $\omega_2 = 0.0226\,\mathrm{rad/s}$, and $\omega_3 = 0.0993\,\mathrm{rad/s}$. No integration needed.

**How tight is the loop?** $H^2/2TI_3 = 40{,}576/40{,}960 = 0.991$. The closer this ratio is to one, the tighter the loop around the major axis. A body released with $H^2 = 30{,}720$ instead would sit on the separatrix and tumble.
:::

## Poinsot's picture and the herpolhode

The polhode is a view from inside the body. In 1834 **[[Louis Poinsot|poinsot]]** found a view from space that needs nothing beyond the two conservation laws.

Go back to the energy ellipsoid in $\boldsymbol{\omega}$-space, $\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = 2T$. Since $\mathbf{I}$ is fixed in body axes, think of this ellipsoid as a solid egg bolted to the body. The tip of $\boldsymbol{\omega}$ always sits on its surface.

Now three facts, one at a time.

**The flat plane at the tip is perpendicular to $\mathbf{H}$.** The direction straight out of a surface is its **gradient**. For this surface the gradient at $\boldsymbol{\omega}$ is $2\mathbf{I}\boldsymbol{\omega} = 2\mathbf{H}$. So the plane that barely touches the egg at the tip of $\boldsymbol{\omega}$ — its **tangent plane** — is perpendicular to $\mathbf{H}$.

**That plane never moves.** Its distance from the center is the part of $\boldsymbol{\omega}$ that lies along $\mathbf{H}$:

$$
d = \frac{\boldsymbol{\omega}\cdot\mathbf{H}}{H} = \frac{2T}{H} .
$$

$T$ and $H$ are constant, and $\mathbf{H}$ is fixed in space. So this plane is fixed in space: perpendicular to $\mathbf{H}$, a fixed distance from the center of mass. It is called the **[[invariable plane|invariable-plane]]**.

**The egg rolls on it without slipping.** The body-fixed energy ellipsoid touches the invariable plane at the tip of $\boldsymbol{\omega}$ at every instant. That contact point lies on the axis the body is turning about right now, so it has zero velocity. A surface touching a plane at a point that is not moving is **[[rolling without slipping|poinsot-roll]]**.

The contact point draws two curves. On the egg, which is fixed in the body, it traces the polhode — the same curve as before, now in $\boldsymbol{\omega}$-space. On the invariable plane, fixed in space, it traces the **herpolhode**. The polhode always closes on itself. The herpolhode usually does not: the time for one trip around the polhode generally does not fit a whole number of times into the rolling, so the herpolhode keeps wandering between two circles on the plane, filling the ring between them. For a body with two equal moments both curves become circles, and the picture reduces to two cones rolling on each other — the next section.

It pays to sort out what is fixed and what moves.

- **Fixed in space:** $\mathbf{H}$, the invariable plane, and the herpolhode drawn on it.
- **Fixed in the body:** the ellipsoid, and the polhode drawn on it.
- **Fixed in neither:** $\boldsymbol{\omega}$. It is the one vector that ends at the contact point, so it moves relative to both the stars and the structure.

That is the exact sense in which a torque-free body "wobbles": its axis of rotation moves relative to both.

For the bus, $d = 2\times 10.24/201.4 = 0.1017\,\mathrm{rad/s}$, while $\lVert\boldsymbol{\omega}\rVert$ ranges from $0.1018$ to $0.1020\,\mathrm{rad/s}$. The tip of $\boldsymbol{\omega}$ stays between $0.0056$ and $0.0079\,\mathrm{rad/s}$ from the foot of $\mathbf{H}$ on the plane. So the herpolhode fills a narrow ring, and the invariable plane is almost perpendicular to the spin.

## The body with two equal moments, solved

Many spinners have two equal principal moments: the cylinder of lesson 2, a spinning upper stage, a spin-stabilized probe. Such a body is **axisymmetric** — the same all the way around its symmetry axis. For it, Euler's torque-free equations can be solved with sines and cosines.

Take the symmetry axis as 3, with axial moment $I_3$. Call the two equal sideways moments the **transverse moment**, $I_t = I_1 = I_2$ ("I sub t").

**The spin is constant.** The third equation becomes $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2 = 0$, since $I_1 = I_2$. So the spin along the symmetry axis never changes: $\omega_3 = n$.

**The other two are simple.** With $\omega_3 = n$ fixed, the first two equations become linear with constant coefficients:

$$
\dot{\omega}_1 = -\frac{I_3 - I_t}{I_t}\,n\,\omega_2 = -\lambda\,\omega_2, \qquad
\dot{\omega}_2 = \frac{I_3 - I_t}{I_t}\,n\,\omega_1 = \lambda\,\omega_1,
\qquad
\lambda \equiv n\,\frac{I_3 - I_t}{I_t} .
$$

(The sign $\equiv$ means "is defined as"; $\lambda$ is "lambda".) Take the rate of change of the first and substitute the second: $\ddot{\omega}_1 = -\lambda^2\omega_1$. That is the equation of a swing, so start the body with $\omega_1(0) = \omega_t$ and $\omega_2(0) = 0$ and the answer is

$$
\omega_1 = \omega_t\cos\lambda t, \qquad \omega_2 = \omega_t\sin\lambda t, \qquad \omega_3 = n .
$$

Check it: the rate of change of $\omega_t\cos\lambda t$ is $-\lambda\omega_t\sin\lambda t = -\lambda\omega_2$, as the first equation demands.

**What it means.** The sideways part of the angular velocity keeps a constant size $\omega_t$ and turns around the symmetry axis at rate $\lambda$. So the tip of $\boldsymbol{\omega}$ runs around a circle, and $\boldsymbol{\omega}$ sweeps out a cone around the body axis, with half-angle $\gamma$ ("gamma") given by $\tan\gamma = \omega_t/n$. This is the **body cone**, and the polhode of an axisymmetric body is its circular rim.

The rate $\lambda$ is the body-frame **precession rate** of $\boldsymbol{\omega}$ — and of $\mathbf{H}$, which turns with it in the body. Its sign is the sign of $I_3 - I_t$:

- an **oblate** body ($I_3 > I_t$, like a coin) has the sideways rate turning the same way as the spin;
- a **prolate** body ($I_3 < I_t$, like a pencil) has it turning the opposite way, called **retrograde**;
- a sphere-like body, $I_3 = I_t$, has $\lambda = 0$ and no wobble at all.

::: key Body-frame precession of an axisymmetric body
For $\mathbf{I} = \mathrm{diag}(I_t, I_t, I_3)$ and torque-free motion, $\omega_3 = n$ is constant and the transverse rate rotates about the symmetry axis at $\lambda = \omega_3(I_3 - I_t)/I_t = n\,(I_3 - I_t)/I_t$. Oblate bodies ($I_3 > I_t$) and prolate bodies ($I_3 < I_t$) precess in opposite senses; the angular velocity sweeps a body cone of half-angle $\gamma = \arctan(\omega_t/n)$.
:::

### The view from space: two cones

From space, $\mathbf{H}$ is fixed. The angle $\theta$ ("theta") between the symmetry axis and $\mathbf{H}$ obeys $\tan\theta = I_t\omega_t/(I_3 n)$ — sideways momentum over axial momentum — and every quantity in it is constant. So $\theta$ is constant. It is called the **nutation angle**.

The symmetry axis, $\boldsymbol{\omega}$ and $\mathbf{H}$ all lie in one plane, because their sideways parts point the same way. That plane turns about $\mathbf{H}$, at a rate lesson 9 derives as $H/I_t$. So $\boldsymbol{\omega}$ also sweeps a cone around $\mathbf{H}$ — the **space cone**, with half-angle $\beta = |\theta - \gamma|$ ("beta"). The body cone **[[rolls on the space cone|two-cones]]** without slipping, touching it along $\boldsymbol{\omega}$.

- **Oblate** ($\theta < \gamma$): the narrow space cone sits inside the wider body cone, which rolls around it touching on its inner side.
- **Prolate** ($\theta > \gamma$): the two cones sit side by side and touch on the outside.

Where the general body has an egg rolling on a plane, the axisymmetric body has a cone rolling on a cone. Earth itself is a slightly oblate spinner, and it shows exactly this wobble — the **[[Chandler wobble|chandler]]**.

::: example A prolate upper stage
Model a spin-stabilized upper stage as a uniform solid cylinder: mass $2000\,\mathrm{kg}$, radius $1.0\,\mathrm{m}$, length $3.0\,\mathrm{m}$.

**Moments.** From lesson 2's table, $I_3 = \tfrac{1}{2}mR^2 = \tfrac{1}{2}\times 2000\times 1.0^2 = 1000\,\mathrm{kg\,m^2}$, and $I_t = \tfrac{1}{12}m(3R^2 + L^2) = \tfrac{2000}{12}(3 + 9) = 2000\,\mathrm{kg\,m^2}$. So $I_3 < I_t$: the stage is prolate, and its long axis is its minor axis.

**Spin and kick.** It spins at $60\,\mathrm{rpm}$, which is one turn per second, $n = 2\pi = 6.28\,\mathrm{rad/s}$. Separating from the rocket gave it a sideways **[[tip-off|tip-off]]** rate $\omega_t = 0.10\,\mathrm{rad/s}$.

**Precession rate.** $\lambda = n(I_3 - I_t)/I_t = 6.28\times(1000 - 2000)/2000 = -3.14\,\mathrm{rad/s}$. It is negative — retrograde — and exactly half the spin rate, because $I_3/I_t = 1/2$. In the body, the sideways rate goes around once every $2\pi/3.14 = 2.0\,\mathrm{s}$, backwards compared with the spin, which takes $1.0\,\mathrm{s}$ per turn.

**Body cone.** $\gamma = \arctan(0.10/6.28) = 0.91^\circ$.

**Nutation angle.** The axial momentum is $I_3 n = 1000\times 6.283 = 6283\,\mathrm{N\,m\,s}$. The sideways momentum is $I_t\omega_t = 2000\times 0.10 = 200\,\mathrm{N\,m\,s}$. So $H = \sqrt{6283^2 + 200^2} = 6286\,\mathrm{N\,m\,s}$, and $\theta = \arctan(200/6283) = 1.82^\circ$.

**Does it make sense?** The body is prolate, so we expect $\theta > \gamma$, and indeed $1.82^\circ > 0.91^\circ$. The symmetry axis cones around $\mathbf{H}$ at $1.82^\circ$, while $\boldsymbol{\omega}$ cones around the symmetry axis at only $0.91^\circ$, because the sideways part of $\mathbf{H}$ was multiplied by $I_t$, twice the $I_3$ that multiplied the axial part. A kick of a tenth of a radian per second — about six degrees per second — on a 60 rpm spinner gives a two-degree wobble. Stepping Euler's equations forward numerically for this case reproduces the $2.0\,\mathrm{s}$ body-frame period, with $\omega_3$ constant to round-off.
:::

::: warning Precession, nutation and the two frames
"Precession" is used both for $\boldsymbol{\omega}$ turning about the body axis at rate $\lambda$ *and* for the body axis turning about $\mathbf{H}$ at rate $H/I_t$. Different books also attach "nutation" to different parts of the same motion. Whenever you read a rate, ask: which vector is turning about which, and in which frame? In this module, $\lambda$ is the body-frame precession, the nutation angle $\theta$ is the constant angle between the symmetry axis and $\mathbf{H}$, and lesson 9 names the inertial rate. Gyro data from a wobbling spacecraft show the body-frame rate $\lambda$; a star tracker shows the inertial one.
:::

::: warning The polhode is a body-frame curve
A common misreading is that $\mathbf{H}$ moves along the polhode in space. It does not: with no torque, $\mathbf{H}$ is fixed in space. What moves along the polhode are the *body components* of $\mathbf{H}$ — which is the same as saying the body moves around the fixed $\mathbf{H}$. Plotting a simulation's $(H_1, H_2, H_3)$ traces the polhode. Plotting $\mathbf{R}\mathbf{H}_B$ gives a single point that never moves, which is a handy check that your attitude and your rates were stepped forward consistently.
:::

::: note Elliptic functions and the lopsided body
For three different moments, the torque-free motion also has an exact solution, written with **Jacobi elliptic functions** — cousins of sine and cosine — whose shape is set by how far $H^2$ is from $2TI_2$. It is elegant and rarely needed. The two conservation laws plus a numerical integrator give a GNC engineer everything needed about the lopsided case, and the axisymmetric solution above covers spinning spacecraft.
:::

## Check yourself

::: check
A body with $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$ is released with $\boldsymbol{\omega} = (0.01, 1.0, 0.01)\,\mathrm{rad/s}$. Compute $H^2$ and $2TI_2$, and say what kind of polhode it is on.
:::

::: answer
$H^2 = 1^2\times 0.01^2 + 2^2\times 1.0^2 + 3^2\times 0.01^2 = 0.0001 + 4 + 0.0009 = 4.0010$.

$2T = 1\times 0.0001 + 2\times 1 + 3\times 0.0001 = 2.0004$, so $2TI_2 = 2.0004\times 2 = 4.0008$.

$H^2 = 4.0010$ is a hair above $2TI_2 = 4.0008$. So the polhode is a major-axis loop — but one that hugs the separatrix. It passes very close to the intermediate pole where the body started, then travels far across the sphere. The body spends a long time near its starting spin, then tumbles, then comes back. A nudge that made $H^2$ slightly *less* than $2TI_2$ would give a minor-axis loop with the same behavior.
:::

::: check
Show that no torque-free motion can have $H^2 > 2TI_3$ or $H^2 < 2TI_1$.
:::

::: answer
Write $H^2 = \sum_k I_k^2\omega_k^2 = \sum_k I_k\,(I_k\omega_k^2)$. Each $I_k\omega_k^2$ is zero or positive, and together they add up to $2T$. So $H^2$ equals $2T$ times a **weighted average** of $I_1$, $I_2$, $I_3$, with weights $I_k\omega_k^2/2T$ that are positive and add to one.

A weighted average always lies between the smallest and largest of the numbers being averaged. Hence $2TI_1 \le H^2 \le 2TI_3$.

Seen as a picture: the momentum sphere must meet the energy ellipsoid, so its radius must fall between the ellipsoid's smallest and largest half-widths.
:::

::: check
For the prolate stage of the example ($I_3 = 1000$, $I_t = 2000\,\mathrm{kg\,m^2}$), the tip-off rate doubles to $0.20\,\mathrm{rad/s}$ at the same $60\,\mathrm{rpm}$ spin. What happens to $\lambda$, $\gamma$ and $\theta$?
:::

::: answer
$\lambda = n(I_3 - I_t)/I_t$ does not contain $\omega_t$ at all, so it stays at $-3.14\,\mathrm{rad/s}$. The wobble period is set by the spin and the inertia ratio, not by how hard the body was kicked.

The cone angles roughly double. $\gamma = \arctan(0.20/6.28) = 1.82^\circ$. $\theta = \arctan\bigl(2000\times 0.20/(1000\times 6.28)\bigr) = \arctan(0.0637) = 3.64^\circ$.

The nutation angle is still twice the body-cone angle, because $\tan\theta/\tan\gamma = I_t/I_3 = 2$.
:::

::: check
In Poinsot's picture, say what is fixed in space, what is fixed in the body, and what is fixed in neither — a sentence or two each.
:::

::: answer
Fixed in space: the angular momentum $\mathbf{H}$, the invariable plane perpendicular to it at distance $2T/H$ from the center of mass, and the herpolhode traced on that plane.

Fixed in the body: the energy ellipsoid $\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega} = 2T$ and the polhode traced on it.

Fixed in neither: the angular velocity $\boldsymbol{\omega}$. Its tip is the point where the rolling ellipsoid touches the plane, so it moves along the polhode as seen from the body and along the herpolhode as seen from space.
:::

::: check
An oblate spinner has $I_3 = 1500$, $I_t = 1000\,\mathrm{kg\,m^2}$ and spins at $10\,\mathrm{rpm}$ with a small sideways rate. Find the body-frame precession rate and its direction, and say whether the space cone is inside or outside the body cone.
:::

::: answer
Convert the spin: $n = 10\times 2\pi/60 = 1.047\,\mathrm{rad/s}$. Then $\lambda = n(I_3 - I_t)/I_t = 1.047\times 500/1000 = 0.524\,\mathrm{rad/s}$.

It is positive, so the sideways rate turns the same way as the spin, at half its speed: one trip every $2\pi/0.524 = 12\,\mathrm{s}$, against a spin period of $6\,\mathrm{s}$.

For an oblate body, $\tan\theta = (I_t/I_3)\tan\gamma$ is smaller than $\tan\gamma$. So $\mathbf{H}$ lies closer to the symmetry axis than $\boldsymbol{\omega}$ does. The space cone is the narrower one and sits inside the body cone, which rolls around it touching on its inner side.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $2T = \sum_k I_k\omega_k^2$, $H^2 = \sum_k I_k^2\omega_k^2$ | The two integrals of torque-free motion |
| Momentum sphere, energy ellipsoid | $\sum_k H_k^2 = H^2$; $\sum_k H_k^2/I_k = 2T$, half-widths $\sqrt{2TI_k}$ |
| Polhode | Their crossing: the body-frame path of $\mathbf{H}$ (or $\boldsymbol{\omega}$) |
| $2TI_1 \le H^2 \le 2TI_3$ | Range of possible motions; equality at the pure minor and major spins |
| $H^2 = 2TI_2$ | Separatrix through the intermediate axis; loops around the major axis above it, the minor axis below |
| Invariable plane | Perpendicular to $\mathbf{H}$ at distance $2T/H$; the body-fixed energy ellipsoid rolls on it |
| Herpolhode | Path of the contact point (tip of $\boldsymbol{\omega}$) on the invariable plane |
| $\lambda = n(I_3 - I_t)/I_t$ | Body-frame precession rate of an axisymmetric body; sign follows $I_3 - I_t$ |
| $\tan\gamma = \omega_t/n$, $\tan\theta = I_t\omega_t/(I_3 n)$ | Body-cone half-angle; nutation angle between the symmetry axis and $\mathbf{H}$ |
| Prolate stage example | $\lambda = -3.14\,\mathrm{rad/s}$ at 60 rpm, $\gamma = 0.91^\circ$, $\theta = 1.82^\circ$ for $\omega_t = 0.10\,\mathrm{rad/s}$ |

The polhode picture says spins about the major and minor axes are ringed by small loops, and the intermediate axis by a separatrix. The next lesson proves the same thing from Euler's equations in three lines, puts a growth rate on the instability, and reproduces it numerically.

::: context spinning-cruise Spinning all the way to Mars
Spinning is the cheapest way to keep a spacecraft pointed: a spinning body resists being tipped, with no fuel and no computer. The cruise stages that carried NASA's Mars Pathfinder and the Spirit and Opportunity rovers to Mars spun at about $2\,\mathrm{rpm}$ for the whole trip. Juno spins on its way around Jupiter too. Between course corrections, each is a torque-free body of exactly the kind this lesson studies.
:::

::: context polhode-word Pole paths
Both words are Greek. **Polhode** joins *polos*, "pole" or "axis", with *hodos*, "path": the path of the rotation pole through the body. **Herpolhode** adds *herpein*, "to creep": the creeping pole path, as it slowly crawls around the fixed plane. Poinsot named both.
:::

::: context separatrix-word A watershed
Think of a mountain ridge. Rain falling a step east of the ridge runs to one ocean. Rain falling a step west runs to another. The ridge line itself is the divider. The separatrix is that ridge for spinning bodies: start on one side and $\mathbf{H}$ circles the major axis, start on the other and it circles the minor axis. Start right on it, at the intermediate axis, and the smallest nudge decides which way you go.
:::

::: context sphere-picture The momentum sphere, seen down the intermediate axis
Here the momentum sphere is drawn for $\mathbf{I} = \mathrm{diag}(1, 2, 3)$, looking straight down axis 2. From this angle each closed loop is seen edge-on as an arc, and the separatrix is the two straight lines at $\pm 60^\circ$, crossing at the intermediate pole in the middle. Blue arcs circle the major axis (top and bottom); orange arcs circle the minor axis (left and right).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="110" r="95" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="102.5" y1="192.3" x2="197.5" y2="27.7" stroke="#b4232c" stroke-width="2"/>
  <line x1="102.5" y1="27.7" x2="197.5" y2="192.3" stroke="#b4232c" stroke-width="2"/>
  <g fill="none" stroke="#1d6fd1" stroke-width="2">
    <polyline points="111.7,23.1 118.1,31.2 124.5,38.5 130.9,44.7 137.2,49.6 143.6,52.7 150.0,53.8 156.4,52.7 162.8,49.6 169.1,44.7 175.5,38.5 181.9,31.2 188.3,23.1"/>
    <polyline points="111.7,196.9 118.1,188.8 124.5,181.5 130.9,175.3 137.2,170.4 143.6,167.3 150.0,166.2 156.4,167.3 162.8,170.4 169.1,175.3 175.5,181.5 181.9,188.8 188.3,196.9"/>
    <polyline points="124.0,18.6 128.3,22.1 132.7,25.0 137.0,27.4 141.3,29.1 145.7,30.2 150.0,30.5 154.3,30.2 158.7,29.1 163.0,27.4 167.3,25.0 171.7,22.1 176.0,18.6"/>
    <polyline points="124.0,201.4 128.3,197.9 132.7,195.0 137.0,192.6 141.3,190.9 145.7,189.8 150.0,189.5 154.3,189.8 158.7,190.9 163.0,192.6 167.3,195.0 171.7,197.9 176.0,201.4"/>
  </g>
  <g fill="none" stroke="#f2b880" stroke-width="2.5">
    <polyline points="218.0,176.3 214.6,165.3 211.7,154.2 209.4,143.2 207.6,132.1 206.6,121.1 206.2,110.0 206.6,98.9 207.6,87.9 209.4,76.8 211.7,65.8 214.6,54.7 218.0,43.7"/>
    <polyline points="82.0,176.3 85.4,165.3 88.3,154.2 90.6,143.2 92.4,132.1 93.4,121.1 93.8,110.0 93.4,98.9 92.4,87.9 90.6,76.8 88.3,65.8 85.4,54.7 82.0,43.7"/>
    <polyline points="233.6,155.1 232.4,147.6 231.4,140.0 230.5,132.5 230.0,125.0 229.6,117.5 229.5,110.0 229.6,102.5 230.0,95.0 230.5,87.5 231.4,80.0 232.4,72.4 233.6,64.9"/>
    <polyline points="66.4,155.1 67.6,147.6 68.6,140.0 69.5,132.5 70.0,125.0 70.4,117.5 70.5,110.0 70.4,102.5 70.0,95.0 69.5,87.5 68.6,80.0 67.6,72.4 66.4,64.9"/>
  </g>
  <circle cx="150" cy="110" r="4" fill="#1f2a44"/>
  <text x="262" y="30" font-size="12" fill="#1d6fd1">major axis 3</text>
  <text x="262" y="46" font-size="12" fill="#1d6fd1">(top and bottom)</text>
  <text x="262" y="104" font-size="12" fill="#1f2a44">minor axis 1</text>
  <text x="262" y="120" font-size="12" fill="#1f2a44">(left and right)</text>
  <text x="262" y="180" font-size="12" fill="#b4232c">separatrix</text>
  <text x="262" y="196" font-size="12" fill="#1f2a44">dot: axis 2</text>
</svg>
```
:::

::: context poinsot Louis Poinsot
Louis Poinsot (1777–1859) was a French mathematician who liked to see mechanics rather than grind through it. His 1834 work on the rotation of bodies replaced pages of algebra with the image of an ellipsoid rolling on a plane — a picture that still appears in every serious dynamics text. He also gave us the idea of a **couple**, a pure twist with no net push.
:::

::: context invariable-plane Invariable planes in the sky
Astronomy has one too. The whole solar system has a total angular momentum that no outside torque changes, and the plane perpendicular to it is called the invariable plane of the solar system. Pierre-Simon Laplace used it as a reference that stays put while the individual planets' orbits slowly tilt. It lies close to Jupiter's orbital plane, since Jupiter carries most of the planets' angular momentum.
:::

::: context poinsot-roll The egg rolling on the table
Side view, drawn to scale for an ellipse turned $25^\circ$. The egg (fixed in the body) touches the table (fixed in space) at one point. The spin $\boldsymbol{\omega}$ runs from the center to that point; $\mathbf{H}$ runs straight down to the table, meeting it at a right angle. As time goes on, the egg rolls and the touching point wanders.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="124.3" x2="340" y2="124.3" stroke="#1f2a44" stroke-width="2"/>
  <text x="20" y="162" font-size="12" fill="#1f2a44">invariable plane (fixed in space)</text>
  <ellipse cx="150" cy="70" rx="85" ry="45" transform="rotate(25 150 70)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="150" cy="70" r="3.5" fill="#1f2a44"/>
  <line x1="150" y1="70" x2="150" y2="112" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="150,124.3 144,112 156,112" fill="#1d6fd1"/>
  <text x="154" y="104" font-size="12" fill="#1d6fd1">H</text>
  <line x1="150" y1="70" x2="186.6" y2="124.3" stroke="#b4232c" stroke-width="3"/>
  <circle cx="186.6" cy="124.3" r="4" fill="#b4232c"/>
  <text x="196" y="142" font-size="12" fill="#b4232c">ω ends at the contact point</text>
  <text x="245" y="40" font-size="12" fill="#1f2a44">energy ellipsoid</text><text x="245" y="56" font-size="12" fill="#1f2a44">(fixed in the body)</text>
</svg>
```
:::

::: context two-cones Cone on cone
A slice through both cones for a prolate body, with the angles drawn much larger than in the example: nutation angle $\theta = 40^\circ$ and body-cone half-angle $\gamma = 20^\circ$, so the space cone has half-angle $\theta - \gamma = 20^\circ$. The two cones share one edge, along $\boldsymbol{\omega}$, and the body cone rolls around the fixed space cone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="120,185 68.7,44.0 171.3,44.0" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="120,185 171.3,44.0 249.9,110.0" fill="#8fb8f0" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="185" x2="120" y2="20" stroke="#1d6fd1" stroke-width="3"/>
  <text x="96" y="20" font-size="12" fill="#1d6fd1">H</text>
  <line x1="120" y1="185" x2="226.1" y2="58.6" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="230" y="56" font-size="12" fill="#1f2a44">symmetry axis</text>
  <line x1="120" y1="185" x2="176.4" y2="30.0" stroke="#b4232c" stroke-width="3"/>
  <text x="180" y="30" font-size="12" fill="#b4232c">ω (shared edge)</text>
  <text x="14" y="120" font-size="12" fill="#1f2a44">space cone</text>
  <text x="250" y="130" font-size="12" fill="#1f2a44">body cone</text>
</svg>
```
:::

::: context chandler Earth's own wobble
Earth is a slightly oblate spinner: its moment about the poles is larger than its moment about the equator by about one part in $305$. Using exactly this lesson's $\lambda = n(I_3 - I_t)/I_t$, Euler predicted that a rigid Earth's axis would wander around its geographic pole once every $305$ days. In 1891 Seth Chandler found the wobble in star observations — but with a period of about $433$ days, because Earth is not rigid: its oceans and mantle give a little.
:::

::: context tip-off The kick at separation
When a spacecraft is pushed away from its rocket by springs, the springs never push perfectly evenly. The small sideways rate left behind is the **tip-off rate**, typically a fraction of a degree to a few degrees per second. On a spinning stage it turns straight into nutation, which is why spinning upper stages carry nutation dampers or small thrusters to remove it.
:::
