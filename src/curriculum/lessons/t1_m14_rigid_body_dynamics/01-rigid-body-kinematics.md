---
id: l01-rigid-body-kinematics
title: Rigid body kinematics and the angular velocity vector
minutes: 23
covers:
  - rigid body kinematics and the angular velocity vector
---

Pick up a closed book and toss it spinning into the air. Every page, every corner and the spine all turn together. The corner moves fast, the middle hardly moves at all, but nothing inside the book slides around. That is what we mean by a **[[rigid body|what-rigid-means]]** — a solid object whose pieces all keep the same distances from one another, no matter how it moves.

That one rule makes life much simpler. A cloud of loose sand needs a position for every grain. A rigid body needs only six numbers: three to say where its **center of mass** (its balance point) is, and three to say which way it is facing. Engineers call these six numbers the body's **degrees of freedom** — the separate ways it is free to move.

A rocket stage, a satellite, the spinning rotor inside a reaction wheel, an engine swinging on its mount: at the first level of any guidance, navigation and control (GNC) analysis, each one is treated as rigid. Bending and sloshing fuel are corrections added on top, and you will meet them in the last lesson of this module.

Everything else in the module — inertia, Euler's equations, spin stability, momentum wheels — rests on two facts from this lesson. First, a turning rigid body has one **angular velocity vector** $\boldsymbol{\omega}$ (read "omega"), shared by every point in it. Second, there is a rule for finding how fast a vector changes when it is carried around by a turning body. Rate gyros measure $\boldsymbol{\omega}$, navigation software adds it up over time, and controllers push on it with torques. So it pays to know exactly what it is.

Where it shows up: after stage separation, a Falcon 9 first stage flips around at a few degrees per second, and its **[[strapdown gyros|strapdown]]** report the three parts of $\boldsymbol{\omega}$ hundreds of times a second. The same math describes a reaction wheel spinning at $6{,}000$ rpm, a spinning upper stage at $60$ rpm, and the International Space Station (ISS), which turns once per orbit so one side always faces Earth.

## Two frames: the room and the vehicle

To describe turning, you need two sets of axes, called **frames**. Think of sitting in a spinning office chair. The room's walls are one frame. The chair — its seat, its armrests — is another. The armrest is always "to your left" in the chair frame, but it sweeps around the room.

- The **inertial frame** $N$ is the room: a frame where Newton's laws hold. For a spacecraft, axes centered on Earth and pointing at distant stars are close enough.
- The **body frame** $B$ is the chair: axes fixed in the vehicle, usually with the origin at the center of mass $C$ and the axes along handy directions, like the long axis of a rocket (the **roll axis**).

A vector fixed in the body — say, the arrow from the center of mass to the engine nozzle — has the same components in $B$ forever. In $N$ its components change as the vehicle turns.

The **attitude** of the body is how the two frames are turned relative to each other. If a vector has components $\mathbf{r}_B$ in the body frame and $\mathbf{r}_N$ in the inertial frame, then

$$
\mathbf{r}_N = \mathbf{R}\,\mathbf{r}_B ,
$$

where $\mathbf{R}$ is a $3\times 3$ **[[rotation matrix|rotation-matrix]]**. Its columns are the three body axes, written in inertial components. Because those axes are unit length and at right angles, $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$ (read "R transpose R equals the identity"; $\mathbf{I}_3$ is the $3\times 3$ identity matrix, ones down the diagonal and zeros elsewhere), and $\det\mathbf{R} = +1$. A matrix with $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$ is called **orthonormal**. Euler angles, quaternions and the other ways to store attitude get their own module later. Here you only need that $\mathbf{R}$ exists, is orthonormal, and changes as the body turns.

Any motion of a rigid body is a slide of one chosen point plus a turn about an axis through that point. This is **[[Chasles' theorem|chasles]]**. The slide part is ordinary particle motion, which you already know. This module is about the turn.

## The angular velocity vector

Picture a spinning merry-go-round. A kid near the middle moves slowly; a kid at the edge moves fast. Yet everyone on it goes around at the same *rate* — one turn every few seconds — about the same *axis*, the center post. That shared rate and axis is the angular velocity. It belongs to the whole merry-go-round, not to any one rider.

Here is the precise version. Take any vector $\mathbf{r}$ fixed in the body. Its body components $\mathbf{r}_B$ never change, so only $\mathbf{R}$ changes, and in the inertial frame

$$
\dot{\mathbf{r}}_N = \dot{\mathbf{R}}\,\mathbf{r}_B = \dot{\mathbf{R}}\mathbf{R}^\top\,\mathbf{r}_N .
$$

(The dot over a letter, as in $\dot{\mathbf{R}}$, read "R dot", means its rate of change with time. The second step used $\mathbf{r}_B = \mathbf{R}^\top\mathbf{r}_N$.) The matrix $\dot{\mathbf{R}}\mathbf{R}^\top$ turns out to have a very special shape, and that shape is the whole story.

A $3\times 3$ **[[skew-symmetric|skew-symmetric]]** matrix is one that equals minus its own transpose: zeros on the diagonal, and each entry below the diagonal is the negative of its mirror above. Such a matrix has only three independent numbers. Call them $\omega_1, \omega_2, \omega_3$ and arrange them as

$$
[\boldsymbol{\omega}\times] =
\begin{bmatrix}
0 & -\omega_3 & \omega_2 \\
\omega_3 & 0 & -\omega_1 \\
-\omega_2 & \omega_1 & 0
\end{bmatrix},
\qquad
[\boldsymbol{\omega}\times]\,\mathbf{v} = \boldsymbol{\omega}\times\mathbf{v}
\ \text{ for every } \mathbf{v}.
$$

Read $[\boldsymbol{\omega}\times]$ as "omega cross": it is the matrix that does a cross product with $\boldsymbol{\omega}$. You can check the last identity by multiplying out one row. The top row gives $-\omega_3 v_2 + \omega_2 v_3$, which is exactly the first component of $\boldsymbol{\omega}\times\mathbf{v}$.

Now the key step: $\dot{\mathbf{R}}\mathbf{R}^\top$ is always skew-symmetric (the proof is in the note below). So it is some $[\boldsymbol{\omega}\times]$, and the rate of change of any body-fixed vector becomes

$$
\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}.
$$

This is the definition of the **angular velocity** of $B$ relative to $N$, written $\boldsymbol{\omega}_{B/N}$ ("omega of B relative to N") when the frames need naming. Its direction is the **instantaneous axis of rotation** — the axis the body is turning about right now — and its length is the turning rate in radians per second. The direction follows the **[[right-hand rule|right-hand-rule]]**.

The point to take away: *one* $\boldsymbol{\omega}$ works for *every* body-fixed vector. That is what rigidity buys you. If the pieces could slide, each would need its own rate.

::: note Why $\dot{\mathbf{R}}\mathbf{R}^\top$ has to be skew-symmetric
Start from $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$, which holds at every instant. The identity matrix never changes, so the rate of change of the left side is zero. Use the product rule:

$$
\dot{\mathbf{R}}\mathbf{R}^\top + \mathbf{R}\dot{\mathbf{R}}^\top = 0 .
$$

Call $\mathbf{W} = \dot{\mathbf{R}}\mathbf{R}^\top$. The second term is its transpose, $\mathbf{W}^\top = \mathbf{R}\dot{\mathbf{R}}^\top$. So the line says $\mathbf{W} + \mathbf{W}^\top = 0$, or $\mathbf{W} = -\mathbf{W}^\top$. That is the definition of skew-symmetric. Nothing about the body was used except that its axes stay unit length and square — which is rigidity.
:::

The same vector $\boldsymbol{\omega}$ can be written in either frame. Its inertial components are $\boldsymbol{\omega}_N$, and its body components are $\boldsymbol{\omega}_B = \mathbf{R}^\top\boldsymbol{\omega}_N$. There is a handy identity for any rotation matrix, $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\top = [(\mathbf{R}\mathbf{a})\times]$: rotating a cross-product matrix is the same as rotating its vector. With $\boldsymbol{\omega}_N = \mathbf{R}\boldsymbol{\omega}_B$ it turns $\dot{\mathbf{R}}\mathbf{R}^\top = [\boldsymbol{\omega}_N\times]$ into $\dot{\mathbf{R}}\mathbf{R}^\top = \mathbf{R}[\boldsymbol{\omega}_B\times]\mathbf{R}^\top$. Multiply both sides on the right by $\mathbf{R}$ and use $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$:

$$
\dot{\mathbf{R}} = \mathbf{R}\,[\boldsymbol{\omega}_B\times].
$$

This is the **kinematic differential equation** of the attitude — "kinematic" means it describes motion without asking what caused it. Feed it the body rates a gyro measures and it steps the attitude matrix forward in time. Doing that accurately is a topic of its own. For now, know that it exists and that it is **linear** in $\mathbf{R}$: $\mathbf{R}$ appears only to the first power.

::: key The angular velocity vector
For a rigid body there is one vector $\boldsymbol{\omega}$ such that every body-fixed vector obeys $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$. Its matrix form is the skew-symmetric $[\boldsymbol{\omega}\times] = \dot{\mathbf{R}}\mathbf{R}^\top$, and the attitude matrix evolves as $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ with $\boldsymbol{\omega}_B$ the body-axis components — the three numbers a rate gyro triad reports.
:::

### Body rates and what a gyro measures

A **rate gyro** is a sensor that measures turning rate about one axis. A **triad** is three of them at right angles. A strapdown triad is bolted to the structure, so it measures the body components $(\omega_1, \omega_2, \omega_3)$ of $\boldsymbol{\omega}_{B/N}$. On rockets and aircraft these are the **roll**, **pitch** and **yaw** rates, often written $p$, $q$, $r$, about the body $x$, $y$, $z$ axes. They are the natural numbers to track for rotation, which is why Euler's equations in lesson 5 are written in body components.

Typical sizes, all in radians per second:

| Thing that turns | $\lVert\boldsymbol{\omega}\rVert$ in rad/s |
| --- | --- |
| Earth's rotation | $7.29\times 10^{-5}$ |
| ISS, once per orbit | $1.13\times 10^{-3}$ |
| Agile imaging satellite slewing (about $0.5$ to $3^\circ/\mathrm{s}$) | $0.01$ to $0.05$ |
| Spinning upper stage at $60$ rpm | $6.28$ |
| Reaction wheel at $6{,}000$ rpm | $628$ |

To turn **[[rpm|rpm]]** (revolutions per minute) into rad/s, multiply by $2\pi/60 \approx 0.1047$: one turn is $2\pi$ radians, and one minute is $60$ seconds. That table spans seven powers of ten.

### Angular velocities add

Sit on a spinning office chair while holding a spinning bicycle wheel. How fast is the wheel turning, as the room sees it? It is the chair's turning plus the wheel's turning relative to your hands.

In symbols: let a wheel frame $W$ turn relative to the body $B$, which turns relative to $N$. Then

$$
\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{B/N} + \boldsymbol{\omega}_{W/B},
$$

once both terms are written in the same frame. Angular velocities add like ordinary arrows. This rule lets you write the angular velocity of a reaction wheel as the body rate plus the wheel's spin relative to the body, which lesson 11 needs.

::: note Why the rates add
Chain the rotations: $\mathbf{R}_{NW} = \mathbf{R}_{NB}\mathbf{R}_{BW}$ (body-to-room times wheel-to-body gives wheel-to-room). Take the rate of change with the product rule and multiply on the right by $\mathbf{R}_{NW}^\top = \mathbf{R}_{BW}^\top\mathbf{R}_{NB}^\top$:

$$
\dot{\mathbf{R}}_{NW}\mathbf{R}_{NW}^\top
= \dot{\mathbf{R}}_{NB}\mathbf{R}_{NB}^\top + \mathbf{R}_{NB}\bigl(\dot{\mathbf{R}}_{BW}\mathbf{R}_{BW}^\top\bigr)\mathbf{R}_{NB}^\top .
$$

The left side is $[\boldsymbol{\omega}_{W/N}\times]$ and the first term on the right is $[\boldsymbol{\omega}_{B/N}\times]$. The last term is $[\boldsymbol{\omega}_{W/B}\times]$ written in body components and then rotated into the room frame by the identity $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\top = [(\mathbf{R}\mathbf{a})\times]$. Cross-product matrices add exactly when their vectors add, so $\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{B/N} + \boldsymbol{\omega}_{W/B}$.
:::

Here is the surprise. **[[Finite rotations do not add|rotations-dont-commute]]** this way. Turn a book $90^\circ$ about one axis and then $90^\circ$ about another, then try the same two turns in the other order: the book ends up facing two different ways. Rates are different because they describe tiny rotations per second, and tiny rotations can be done in any order.

::: warning Rates add, angles do not
Because $\boldsymbol{\omega}$ is a vector, you can add body rates from different sources. You cannot add up (integrate) the three components of $\boldsymbol{\omega}$ separately and call the results three angles. After a finite time the order of the rotations matters, and angles built that way mean nothing consistent. The attitude must be stepped forward through $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ or something equivalent.
:::

## Velocity and acceleration of a point of the body

Back on the merry-go-round. Your velocity, as someone on the ground sees it, is the merry-go-round's own drift (zero, if it is bolted down) plus the speed you get from going around.

Let $P$ be a point of the body. Its position is $\mathbf{r}_P = \mathbf{r}_C + \boldsymbol{\rho}$, where $\boldsymbol{\rho}$ (read "rho") is the body-fixed arrow from the center of mass to $P$. Take the rate of change in $N$, and use $\dot{\boldsymbol{\rho}} = \boldsymbol{\omega}\times\boldsymbol{\rho}$ because $\boldsymbol{\rho}$ is body-fixed:

$$
\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}.
$$

Take the rate of change once more. The product rule on $\boldsymbol{\omega}\times\boldsymbol{\rho}$ gives $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times\dot{\boldsymbol{\rho}}$, and $\dot{\boldsymbol{\rho}} = \boldsymbol{\omega}\times\boldsymbol{\rho}$ again, so

$$
\mathbf{a}_P = \mathbf{a}_C + \dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}).
$$

Each piece has a job:

- $\mathbf{a}_C$ is the acceleration of the whole body's balance point.
- $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho}$ is the **tangential** acceleration — the push you feel along the circle when the turning speeds up or slows down.
- $\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})$ is the **[[centripetal|centripetal]]** acceleration, which points toward the spin axis.

Expanding the double cross product shows the last one plainly. With the rule $\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}(\mathbf{a}\cdot\mathbf{b})$,

$$
\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}) = \boldsymbol{\omega}(\boldsymbol{\omega}\cdot\boldsymbol{\rho}) - \omega^2\boldsymbol{\rho} = -\omega^2\boldsymbol{\rho}_\perp ,
$$

where $\omega = \lVert\boldsymbol{\omega}\rVert$ and $\boldsymbol{\rho}_\perp$ ("rho perp") is the part of $\boldsymbol{\rho}$ perpendicular to the spin axis. It always points toward the axis, and it grows with the *square* of the rate.

::: example Skin speed and load on a spinning upper stage
A spinning upper stage turns at $60$ rpm about its long axis. A box is mounted on the skin at radius $R = 1.2\,\mathrm{m}$.

**Rate.** Multiply rpm by $2\pi/60$: $\omega = 60\times 2\pi/60 = 2\pi = 6.28\,\mathrm{rad/s}$ — one turn per second.

**Skin speed** relative to the center of mass: $v = \omega R = 6.28\times 1.2 = 7.54\,\mathrm{m/s}$.

**Centripetal acceleration:**

$$
a = \omega^2 R = 6.28^2\times 1.2 = 39.5\times 1.2 = 47.4\,\mathrm{m/s^2}.
$$

Divide by $g_0 = 9.80665\,\mathrm{m/s^2}$ to get "g's": $47.4/9.80665 = 4.83$ g.

**Sanity check.** One turn per second at a bit over a meter is like a hard spin on a playground roundabout — you would need to hold on tight, so several g is believable. Every bracket on that skin carries almost five times its own weight, pulling outward, for the whole coast. Any liquid fuel is flung against the outer tank wall. Designers of spinning stages live with both facts.
:::

::: example Nozzle velocity during a pitch maneuver
A first stage's center of mass moves at $\mathbf{v}_C = (2000, 0, 0)\,\mathrm{m/s}$ along body $x$ while the stage pitches at $2^\circ/\mathrm{s}$ about body $y$.

**Rate in rad/s.** $2\times\pi/180 = 0.0349$, so $\boldsymbol{\omega} = (0, 0.0349, 0)\,\mathrm{rad/s}$.

**Where the nozzle is.** $20\,\mathrm{m}$ behind the center of mass: $\boldsymbol{\rho} = (-20, 0, 0)\,\mathrm{m}$.

**Cross product,** component by component:

$$
\boldsymbol{\omega}\times\boldsymbol{\rho} = (\omega_2\rho_3 - \omega_3\rho_2,\ \omega_3\rho_1 - \omega_1\rho_3,\ \omega_1\rho_2 - \omega_2\rho_1) = (0 - 0,\ 0 - 0,\ 0 - 0.0349\times(-20)) = (0,\ 0,\ 0.698)\,\mathrm{m/s}.
$$

So $\mathbf{v}_P = (2000, 0, 0.698)\,\mathrm{m/s}$: the nozzle drifts sideways at $0.70\,\mathrm{m/s}$ relative to the flight path.

**Accelerations.** Suppose the pitch rate is also growing at $\dot{\omega}_2 = 0.5^\circ/\mathrm{s^2} = 0.00873\,\mathrm{rad/s^2}$. The tangential term $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho}$ works out the same way: $0.00873\times 20 = 0.175\,\mathrm{m/s^2}$ along $+z$. The centripetal term has size $\omega^2\times 20 = 0.0349^2\times 20 = 0.0244\,\mathrm{m/s^2}$ and points from the nozzle toward the center of mass, along $+x$.

**Sanity check.** The nozzle is behind the center and the nose pitches one way, so the tail must swing the other way — sideways, perpendicular to both $\boldsymbol{\omega}$ and $\boldsymbol{\rho}$, which is what $+z$ is. An accelerometer at the nozzle would feel these on top of the vehicle's own acceleration. That is one reason inertial sensors are mounted near the center of mass whenever possible.
:::

## Differentiating a vector carried by a turning frame

The rule $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$ covers vectors that sit still in the body. But some vectors change even as seen from inside the body. Angular momentum, the subject of lesson 4, is one. So you need the general rule.

Picture an ant walking across a spinning turntable. Someone standing beside the turntable sees two motions added: the ant's own walk, and the turntable carrying the ant around.

In symbols: write any vector $\mathbf{A}$ with its body components $A_i$ and the body unit vectors $\hat{\mathbf{b}}_i$ ("b hat i"). Unit vectors are body-fixed, so $\dot{\hat{\mathbf{b}}}_i = \boldsymbol{\omega}\times\hat{\mathbf{b}}_i$. The product rule then gives

$$
\mathbf{A} = \sum_{i=1}^{3} A_i\,\hat{\mathbf{b}}_i,
\qquad
\left.\frac{d\mathbf{A}}{dt}\right|_N = \sum_i \dot{A}_i\,\hat{\mathbf{b}}_i + \sum_i A_i\,\boldsymbol{\omega}\times\hat{\mathbf{b}}_i
= \left.\frac{d\mathbf{A}}{dt}\right|_B + \boldsymbol{\omega}\times\mathbf{A}.
$$

(The bar with $N$ or $B$ below it says which frame is watching.) The first sum is the ant's walk: what an observer riding the body sees change. The second is the ride: the frame's own rotation. This is the **[[transport theorem|transport-theorem]]** in its simplest form.

It does two jobs in this module. Applied to $\boldsymbol{\omega}$ itself, it shows that $\dot{\boldsymbol{\omega}}$ is the same in both frames, because $\boldsymbol{\omega}\times\boldsymbol{\omega} = 0$. Applied to angular momentum in lesson 5, it produces Euler's equations.

::: key Derivative of a vector seen from the body
For any vector $\mathbf{A}$, its inertial rate of change equals its rate of change as seen in the body plus $\boldsymbol{\omega}\times\mathbf{A}$. A body-fixed vector has zero body-frame derivative, so it obeys $\dot{\mathbf{A}} = \boldsymbol{\omega}\times\mathbf{A}$; its length is constant because $\mathbf{A}\cdot(\boldsymbol{\omega}\times\mathbf{A}) = 0$.
:::

::: example The Space Station's angular velocity
The ISS keeps one axis pointed at Earth's center, so the whole station turns once per orbit relative to the stars. One orbit takes about $92.9$ minutes, which is $92.9\times 60 = 5{,}574\,\mathrm{s}$.

**Rate.** One turn is $2\pi$ radians:

$$
\omega = \frac{2\pi}{5574} = 1.13\times 10^{-3}\,\mathrm{rad/s} = 0.0646^\circ/\mathrm{s}.
$$

**A module $50\,\mathrm{m}$ out** moves at $\omega\rho = 1.13\times 10^{-3}\times 50 = 0.056\,\mathrm{m/s}$ relative to the center of mass — about $6$ centimeters per second.

**Sanity check.** A minute hand turns once an hour; the ISS turns once in about an hour and a half, so it is slower than a minute hand. A few centimeters per second is small, but it matters when a visiting vehicle docks at the end of a long truss. The rate is tiny, yet the station's inertia is huge (around $10^{8}\,\mathrm{kg\,m^2}$), so the angular momentum involved is enormous — which is why lesson 11 makes so much of it.
:::

::: warning Angular velocity belongs to the body, not to a point
People often ask for "the angular velocity of the nozzle" or "of the tip of the boom". A point has a velocity. Only a body or a frame has an angular velocity. Every point of a rigid body shares the one $\boldsymbol{\omega}$. Their different velocities come entirely from their different positions $\boldsymbol{\rho}$ in $\mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$.
:::

::: note Signs and conventions
The cross-product matrix $[\boldsymbol{\omega}\times]$ is also written $\boldsymbol{\omega}^\times$, $\tilde{\boldsymbol{\omega}}$ or $\mathbf{S}(\boldsymbol{\omega})$. Some flight software stores the transpose of $\mathbf{R}$ and calls that "the attitude". The physics does not care, but a sign slip in $[\boldsymbol{\omega}\times]$ spreads into every equation after it. Whenever you meet new code, test its convention on a turn about a single axis before you trust anything else.
:::

## Check yourself

::: check
Starting from $\mathbf{R}\mathbf{R}^\top = \mathbf{I}_3$, show that $\dot{\mathbf{R}}\mathbf{R}^\top$ is skew-symmetric. Then explain why that guarantees a body-fixed vector never changes length.
:::

::: answer
Take the rate of change of the constraint with the product rule: $\dot{\mathbf{R}}\mathbf{R}^\top + \mathbf{R}\dot{\mathbf{R}}^\top = 0$. The second term is the transpose of the first. So with $\mathbf{W} = \dot{\mathbf{R}}\mathbf{R}^\top$ this reads $\mathbf{W} = -\mathbf{W}^\top$: skew-symmetric.

For a body-fixed $\mathbf{r}$, $\dot{\mathbf{r}} = \mathbf{W}\mathbf{r}$. The squared length changes at $\frac{d}{dt}(\mathbf{r}\cdot\mathbf{r}) = 2\,\mathbf{r}^\top\mathbf{W}\mathbf{r}$. That number is zero: transpose it (a single number equals its own transpose) to get $\mathbf{r}^\top\mathbf{W}^\top\mathbf{r} = -\mathbf{r}^\top\mathbf{W}\mathbf{r}$, and the only number equal to its own negative is zero. So the length is constant. In vector language, $\mathbf{r}\cdot(\boldsymbol{\omega}\times\mathbf{r}) = 0$, because a cross product is perpendicular to both its inputs.
:::

::: check
A gyro triad reports body rates $(0.5, -0.2, 0.1)^\circ/\mathrm{s}$. What is the size of the angular velocity in rad/s, and about which body direction is the vehicle turning at this instant?
:::

::: answer
Convert each component with $\pi/180 = 0.01745$: $(0.00873, -0.00349, 0.00175)\,\mathrm{rad/s}$.

The size is $\sqrt{0.00873^2 + 0.00349^2 + 0.00175^2} = 0.00956\,\mathrm{rad/s}$, which is $0.548^\circ/\mathrm{s}$.

The axis is the unit vector along $\boldsymbol{\omega}$: divide each component by $0.00956$ to get $(0.913, -0.365, 0.183)$ in body coordinates. There is one axis and one rate — not three separate turns happening at once. Sanity check: $0.548^\circ/\mathrm{s}$ is a bit more than the largest component, $0.5^\circ/\mathrm{s}$, as it should be.
:::

::: check
A reaction wheel spins at $300\,\mathrm{rad/s}$ about the body $x$ axis while the spacecraft itself turns at $\boldsymbol{\omega}_{B/N} = (0.01, 0.02, 0)\,\mathrm{rad/s}$. What is the wheel's angular velocity relative to inertial space, in body components?
:::

::: answer
Angular velocities add: $\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{W/B} + \boldsymbol{\omega}_{B/N} = (300, 0, 0) + (0.01, 0.02, 0) = (300.01, 0.02, 0)\,\mathrm{rad/s}$.

The wheel's true spin axis is tilted from body $x$ by about $0.02/300 \approx 6.7\times 10^{-5}\,\mathrm{rad}$. That is negligible for the wheel's own spin. But the small body rate is exactly what produces the gyroscopic coupling torque you will meet in lesson 9.
:::

::: check
A stage turns at $\boldsymbol{\omega} = (0, 0, 0.5)\,\mathrm{rad/s}$ with its center of mass at rest. Find the velocity of the point $\boldsymbol{\rho} = (1, 2, 0)\,\mathrm{m}$, and check that it is perpendicular both to $\boldsymbol{\omega}$ and to $\boldsymbol{\rho}$.
:::

::: answer
$\mathbf{v} = \boldsymbol{\omega}\times\boldsymbol{\rho} = (\omega_2\rho_3 - \omega_3\rho_2,\ \omega_3\rho_1 - \omega_1\rho_3,\ \omega_1\rho_2 - \omega_2\rho_1) = (0 - 0.5\times 2,\ 0.5\times 1 - 0,\ 0 - 0) = (-1, 0.5, 0)\,\mathrm{m/s}$.

Dot product with $\boldsymbol{\omega}$: $0 + 0 + 0 = 0$. Dot product with $\boldsymbol{\rho}$: $-1\times 1 + 0.5\times 2 + 0 = 0$. Both perpendicular.

The speed is $\sqrt{1 + 0.25} = \sqrt{1.25} = 1.12\,\mathrm{m/s}$. That matches $\omega\,\lVert\boldsymbol{\rho}_\perp\rVert = 0.5\times\sqrt{5} = 1.12$, since all of $\boldsymbol{\rho}$ is perpendicular to the $z$ spin axis.
:::

::: check
A body-fixed unit vector $\hat{\mathbf{e}}_1 = (1, 0, 0)$ is carried by a body with $\boldsymbol{\omega} = (0.1, -0.2, 0.3)\,\mathrm{rad/s}$. What is its inertial rate of change? And why is the rate of change of $\boldsymbol{\omega}$ itself the same whether measured in $N$ or in $B$?
:::

::: answer
$d\hat{\mathbf{e}}_1/dt = \boldsymbol{\omega}\times\hat{\mathbf{e}}_1 = (\omega_2\cdot 0 - \omega_3\cdot 0,\ \omega_3\cdot 1 - \omega_1\cdot 0,\ \omega_1\cdot 0 - \omega_2\cdot 1) = (0,\ \omega_3,\ -\omega_2) = (0, 0.3, 0.2)$ per second. It is perpendicular to $\hat{\mathbf{e}}_1$, as it must be for a vector whose length cannot change.

For $\boldsymbol{\omega}$, the transport rule gives $\dot{\boldsymbol{\omega}}|_N = \dot{\boldsymbol{\omega}}|_B + \boldsymbol{\omega}\times\boldsymbol{\omega}$, and a vector crossed with itself is zero. So the angular acceleration is the same in both frames, and differentiating gyro-measured body rates gives the true angular acceleration directly.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $N$, $B$ | Inertial frame ("the room"); body-fixed frame with origin at the center of mass $C$ |
| $\mathbf{R}$ | Attitude matrix, $\mathbf{r}_N = \mathbf{R}\mathbf{r}_B$, with $\mathbf{R}^\top\mathbf{R} = \mathbf{I}_3$ and $\det\mathbf{R} = +1$ |
| $\boldsymbol{\omega}$ | Angular velocity of $B$ relative to $N$; $\dot{\mathbf{r}} = \boldsymbol{\omega}\times\mathbf{r}$ for body-fixed $\mathbf{r}$ |
| $[\boldsymbol{\omega}\times]$ | Skew-symmetric matrix of $\boldsymbol{\omega}$, equal to $\dot{\mathbf{R}}\mathbf{R}^\top$ in inertial components |
| $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$ | Kinematic differential equation, driven by gyro body rates |
| $\mathbf{v}_P = \mathbf{v}_C + \boldsymbol{\omega}\times\boldsymbol{\rho}$ | Velocity of a body point; acceleration adds $\dot{\boldsymbol{\omega}}\times\boldsymbol{\rho} + \boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})$ |
| Centripetal term | $\boldsymbol{\omega}\times(\boldsymbol{\omega}\times\boldsymbol{\rho}) = -\omega^2\boldsymbol{\rho}_\perp$, toward the axis |
| Transport rule | Inertial derivative equals body derivative plus $\boldsymbol{\omega}\times\mathbf{A}$ |
| Composition | $\boldsymbol{\omega}_{W/N} = \boldsymbol{\omega}_{W/B} + \boldsymbol{\omega}_{B/N}$; rates add, finite angles do not |
| rpm to rad/s | multiply by $2\pi/60 \approx 0.1047$ |

The next lesson asks how much angular momentum a given $\boldsymbol{\omega}$ carries. Adding up $\boldsymbol{\rho}\times(\boldsymbol{\omega}\times\boldsymbol{\rho})$ over every bit of mass produces the **inertia tensor**, and the parallel axis theorem tells you how to build it for a whole vehicle.

::: context what-rigid-means Nothing is truly rigid
Real metal bends a little under any load, so "rigid" is an idealization — a very good one when the bending is tiny compared with the motion you care about. A satellite bus made of aluminum honeycomb is stiff enough to treat as rigid. A $20\,\mathrm{m}$ solar array or a long wire antenna is not: it wobbles slowly, and that wobble can fight the attitude controller. Lesson 12 adds those flexible parts back as small corrections on top of the rigid-body motion you learn here, and lesson 8 shows how a little flexing changed the fate of America's first satellite.
:::

::: context strapdown Why "strapdown"?
Early inertial navigation systems, like the ones on Apollo, mounted their gyros on a **gimballed platform**: a set of nested rings with motors that kept the gyros pointing the same way in space while the spacecraft turned around them. A **strapdown** system does the opposite. The gyros are bolted ("strapped down") to the vehicle and turn with it, so they measure body rates, and a computer does the bookkeeping with $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}_B\times]$. Cheap, fast computers made strapdown the normal choice on modern rockets and satellites.
:::

::: context rotation-matrix The columns are the body axes
Each column of $\mathbf{R}$ is one body axis, written in room coordinates. In this flat picture the body is turned by $30^\circ$: its $x$ axis points along $(\cos 30^\circ, \sin 30^\circ) = (0.866, 0.5)$ and its $y$ axis along $(-0.5, 0.866)$. Those two arrows, stacked side by side, are the (two-dimensional) rotation matrix.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="170" x2="250" y2="170" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="258,170 248,165 248,175" fill="#6c7a93"/>
  <line x1="120" y1="170" x2="120" y2="40" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="120,32 115,42 125,42" fill="#6c7a93"/>
  <text x="262" y="186" font-size="12" fill="#6c7a93">room x</text>
  <text x="128" y="38" font-size="12" fill="#6c7a93">room y</text>
  <line x1="120" y1="170" x2="224" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="231,106 219,106 224,115" fill="#1d6fd1"/>
  <line x1="120" y1="170" x2="60" y2="66" stroke="#b4232c" stroke-width="3"/>
  <polygon points="56,59 55,71 65,66" fill="#b4232c"/>
  <text x="190" y="92" font-size="12" fill="#1d6fd1">body x = (0.866, 0.5)</text>
  <text x="8" y="46" font-size="12" fill="#b4232c">body y = (−0.5, 0.866)</text>
  <path d="M 170 170 A 50 50 0 0 0 163.3 145" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="176" y="158" font-size="12" fill="#1f2a44">30°</text>
</svg>
```
:::

::: context skew-symmetric What "skew-symmetric" means
A **symmetric** matrix is its own mirror image across the main diagonal: the entry in row 2, column 1 equals the one in row 1, column 2. A **skew-symmetric** matrix is a mirror image with a sign flip: row 2, column 1 is *minus* row 1, column 2. The diagonal must then be zero, since each diagonal entry has to equal its own negative. In $3\times 3$ that leaves exactly three free numbers — the three parts of a vector. This is why a turning rate in three dimensions fits so neatly into one arrow.
:::

::: context right-hand-rule Which way does the arrow point?
Curl the fingers of your right hand the way the body is turning. Your thumb points along $\boldsymbol{\omega}$. A turntable spinning counterclockwise, seen from above, has $\boldsymbol{\omega}$ pointing straight up. Spin it the other way and the arrow flips to point down. The arrow's length is the rate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="130" rx="110" ry="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="130" x2="180" y2="30" stroke="#b4232c" stroke-width="3"/>
  <polygon points="180,20 174,34 186,34" fill="#b4232c"/>
  <text x="192" y="32" font-size="13" fill="#b4232c">ω</text>
  <path d="M 110 150 A 80 18 0 0 0 250 150" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="258,146 246,143 249,154" fill="#1f2a44"/>
  <text x="180" y="178" font-size="12" text-anchor="middle" fill="#1f2a44">counterclockwise seen from above</text>
  <circle cx="180" cy="130" r="3" fill="#1f2a44"/>
</svg>
```
:::

::: context rpm Revolutions per minute
Engines, wheels and drills are often rated in **rpm**, turns per minute. Physics formulas want radians per second. One turn is $2\pi \approx 6.283$ radians and a minute is $60$ seconds, so $1\,\mathrm{rpm} = 2\pi/60 \approx 0.1047\,\mathrm{rad/s}$. A car engine idling at $800$ rpm turns at about $84\,\mathrm{rad/s}$. A reaction wheel at $6{,}000$ rpm turns $100$ times a second, about $628\,\mathrm{rad/s}$.
:::

::: context rotations-dont-commute Try it with a book
Lay a book face up, spine to your left. Turn it $90^\circ$ about the axis pointing away from you, then $90^\circ$ about the vertical axis. Note where the spine ends up. Now start again and do the vertical turn first. The spine ends up somewhere else. Big turns depend on their order; mathematicians say they do not **commute**. Tiny turns nearly do — the difference between the two orders shrinks like the product of the two angles — which is why a *rate*, made of tiny turns, can be an ordinary vector.
:::

::: context centripetal Toward the center
"Centripetal" is Latin for "center-seeking". A point on a spinning body moves along a circle, and to keep bending its path it must be pulled toward the center. The speed is along the circle; the acceleration points inward, with size $\omega^2 r$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="160" cy="100" r="70" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="160" cy="100" r="3" fill="#1f2a44"/>
  <text x="140" y="118" font-size="12" fill="#1f2a44">axis</text>
  <circle cx="230" cy="100" r="6" fill="#1f2a44"/>
  <line x1="230" y1="100" x2="230" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="230,30 224,44 236,44" fill="#1d6fd1"/>
  <text x="240" y="44" font-size="12" fill="#1d6fd1">velocity ωr</text>
  <line x1="230" y1="100" x2="186" y2="100" stroke="#b4232c" stroke-width="3"/>
  <polygon points="176,100 190,94 190,106" fill="#b4232c"/>
  <text x="190" y="192" font-size="12" text-anchor="middle" fill="#b4232c">acceleration ω²r, toward the axis</text>
</svg>
```
:::

::: context chasles Slide plus turn
Michel Chasles, a French mathematician, proved in the 1830s that any move of a rigid body can be split into a slide (every point shifted the same way) and a turn about an axis. You are free to choose which point the turn is about; engineers almost always pick the center of mass, because then the slide obeys $\mathbf{F} = m\mathbf{a}$ on its own and the turn has its own separate equations. That split is why orbit and attitude can be studied in separate modules.
:::

::: context transport-theorem Where the transport rule comes back
The transport rule is the seed of the famous "fictitious forces". Apply it twice to a position vector and out come the **Coriolis** and **centrifugal** accelerations that a person on a spinning carousel — or on the spinning Earth — seems to feel. The rotating-frames module grows them from exactly this line. In this module it does something equally important: applied to angular momentum, it gives Euler's equations in lesson 5.
:::
