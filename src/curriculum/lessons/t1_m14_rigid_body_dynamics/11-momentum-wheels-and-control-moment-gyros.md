---
id: l11-momentum-wheels-and-control-moment-gyros
title: Momentum wheels and control moment gyros
minutes: 28
covers:
  - momentum wheels and control moment gyros
---

Sit on a swivel chair with your feet off the floor and hold a heavy book out in front of you. Swing the book to the left, and the chair turns you to the right. Stop the book, and you stop too. Nothing outside you pushed. You shuffled spin between the book and yourself.

That is how most spacecraft actually turn. Inside the vehicle sit small flywheels driven by electric motors. A **[[reaction wheel|reaction-wheel]]** changes its speed to push the vehicle the other way. A **control moment gyro** (CMG) keeps its speed fixed and tilts its axis instead, trading a small tilting torque for a large output torque. Both spend nothing but electrical power. Both are inside the vehicle, so both obey one law: the total angular momentum of the vehicle plus its wheels cannot change without an outside torque.

That law is where the engineering lives. A wheel can turn a satellite back and forth forever, because each turn only borrows momentum. It cannot soak up a steady outside disturbance forever, because a disturbance *adds* momentum and a wheel has a top speed. Something outside — a magnetic coil, a thruster, or the environment — must carry the extra away, and choosing which is a real mission trade.

CMGs add a difficulty of their own: at certain tilt angles a cluster cannot push in one direction at all. These **singularities** appear well inside its rated capacity, and no steering law removes them.

## Momentum exchange: nothing is created

Let the spacecraft structure have inertia $\mathbf{I}$ about the system center of mass and angular velocity $\boldsymbol{\omega}$. Let it carry $N$ wheels. Wheel $k$ has axial inertia $I_{w,k}$ ("I sub w, k"), a spin axis $\hat{\mathbf{a}}_k$ fixed in the body, and a spin rate $\Omega_k$ relative to the body. Lesson 1's rule that angular velocities add gives the wheel's true spin as $\boldsymbol{\omega} + \Omega_k\hat{\mathbf{a}}_k$. Summing the body's share and the wheels' extra share,

$$
\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \sum_{k} I_{w,k}\Omega_k\hat{\mathbf{a}}_k
= \mathbf{I}\boldsymbol{\omega} + \mathbf{h} .
$$

Here $\mathbf{I}$ already includes the wheels' mass as if they were locked, and $\mathbf{h}$ is the **stored momentum** the wheels hold because they turn faster than the body — lessons 9 and 10's $\mathbf{h}$, now under a computer's command.

::: key Wheel momentum exchange
Under zero external torque the total system angular momentum $\mathbf{H}_{\text{body}} + \sum_k I_{w,k}\Omega_k\hat{\mathbf{a}}_k$, with $\mathbf{H}_{\text{body}} = \mathbf{I}\boldsymbol{\omega}$, is conserved. A wheel takes momentum from the body or gives it back; it cannot create or remove system momentum, only shuffle it. Changing $\mathbf{H}$ requires an external torque.
:::

Differentiate in the body frame with the transport theorem, and you get the equation every wheel-controlled spacecraft is simulated with:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}} .
$$

The wheel motors set $\dot{\mathbf{h}}$ ("h dot", the rate of change of stored momentum). So the torque the controller puts on the structure is $-\dot{\mathbf{h}}$: to turn the body one way, spin the wheel up the other way. The $\boldsymbol{\omega}\times\mathbf{h}$ term is lesson 9's gyroscopic coupling, which the software computes and cancels ahead of time. With $\mathbf{M}_{\mathrm{ext}} = 0$, the sum $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}$ stays constant — the conservation law in differential form.

::: example Slewing a bus with one wheel
This module's bus, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, must turn $30^\circ$ about $z$ using a wheel whose motor gives $0.10\,\mathrm{N\,m}$. Use a **[[bang-bang|bang-bang]]** profile: full torque one way for the first half, full torque the other way for the second half.

First convert the angle: $30^\circ = 0.5236\,\mathrm{rad}$. With constant angular acceleration $M/I$, half the angle is covered in half the time, $\tfrac{1}{2}\Delta\vartheta = \tfrac{1}{2}(M/I)(t/2)^2$. Solving for $t$:

$$
t = 2\sqrt{\frac{I\,\Delta\vartheta}{M}} = 2\sqrt{\frac{2000\times 0.5236}{0.10}} = 2\sqrt{10\,472} = 205\,\mathrm{s}.
$$

The peak body rate, at the midpoint, is $(M/I)(t/2) = \sqrt{M\,\Delta\vartheta/I} = \sqrt{0.10\times 0.5236/2000} = 5.12\times 10^{-3}\,\mathrm{rad/s}$, about $0.293^\circ/\mathrm{s}$.

At that instant the body carries $I\omega = 2000\times 5.12\times 10^{-3} = 10.2\,\mathrm{N\,m\,s}$. The total is conserved, so the wheel must have taken on $-10.2\,\mathrm{N\,m\,s}$. For a wheel of $I_w = 0.05\,\mathrm{kg\,m^2}$ that is a speed change of $10.2/0.05 = 205\,\mathrm{rad/s}$, about $1950\,\mathrm{rpm}$.

At the end the body is at rest and the wheel is back at its old speed: the momentum was borrowed and returned, at a cost of only electrical energy.

A continuous scan at $0.5^\circ/\mathrm{s}$ ($8.73\times 10^{-3}\,\mathrm{rad/s}$) is different. It needs $2000\times 8.73\times 10^{-3} = 17.45\,\mathrm{N\,m\,s}$ held in the wheel for as long as the scan lasts — an offset of $17.45/0.05 = 349\,\mathrm{rad/s}$, about $3330\,\mathrm{rpm}$. That standing offset, not the peak torque, usually sizes a wheel.
:::

## Saturation, and what the environment does to you

Think of a wheel as a bucket for momentum. It has a top speed, so the bucket has a size — typically $0.001$ to $0.05\,\mathrm{N\,m\,s}$ for a cubesat wheel and $20$ to $100\,\mathrm{N\,m\,s}$ for a large geostationary satellite. When an outside torque acts, the wheel's stored momentum must grow to keep the body still. When it reaches the limit, the wheel is **saturated**: it can no longer resist, and the vehicle starts to turn.

**Cyclic** disturbances go back and forth and average to zero, filling and emptying the bucket without long-term growth. **[[Secular|secular]]** ones keep pushing the same way, so they pile up.

Gravity-gradient torque on a satellite staring at one star is cyclic. Solar radiation pressure, air drag on an off-center shape and a leftover magnetic dipole all have secular parts.

::: example What a wheel accumulates in low orbit
Put the bus in a $700\,\mathrm{km}$ circular orbit. The radius is $r = 6378 + 700 = 7078\,\mathrm{km}$, the period $5926\,\mathrm{s}$, the orbit rate $\omega_o = 1.060\times 10^{-3}\,\mathrm{rad/s}$, and $3\mu/r^3 = 3.372\times 10^{-6}\,\mathrm{s^{-2}}$.

**Gravity gradient.** Let the bus stare at one star, so the direction "down" swings once around it every orbit. The gravity-gradient torque peaks when the bus is $45^\circ$ off the local vertical:

$$
M_{gg} = \tfrac{1}{2}\,\frac{3\mu}{r^3}\,\lvert I_z - I_x\rvert
= 0.5\times 3.372\times 10^{-6}\times 800 = 1.35\times 10^{-3}\,\mathrm{N\,m}.
$$

That sounds big, but it goes through two full back-and-forth cycles per orbit. The wheel's stored momentum only swings back and forth over a range of about $M_{gg}/\omega_o = 1.35\times 10^{-3}/1.060\times 10^{-3} = 1.27\,\mathrm{N\,m\,s}$ — trivial for a $30\,\mathrm{N\,m\,s}$ wheel.

**The secular leftover** is what bites. Take a modest $1\times 10^{-5}\,\mathrm{N\,m}$ of one-way torque from solar pressure, drag and a leftover dipole combined. Per orbit that is $10^{-5}\times 5926 = 0.059\,\mathrm{N\,m\,s}$; per day, $10^{-5}\times 86\,400 = 0.864\,\mathrm{N\,m\,s}$. A $30\,\mathrm{N\,m\,s}$ wheel fills in $30/0.864 = 34.7$ days, and a $50\,\mathrm{N\,m\,s}$ wheel in $58$ days. A fifteen-year mission therefore needs at least $15\times 365/34.7 \approx 158$ momentum dumps, and in practice a few hundred. Each must be planned and, if it uses propellant, budgeted.
:::

## Desaturation

Emptying the bucket — a **momentum dump** — needs an outside torque. There is no way around it. Commanding the wheel to zero speed hands its momentum back to the body, which then rotates. Bearing friction is internal too and does the same, more slowly. There are three real options, and each costs something different.

::: key Desaturation options and their costs
**[[Magnetorquers|magnetorquer]]** produce $\mathbf{M} = \mathbf{m}\times\mathbf{B}$ from a commanded magnetic dipole. They use no propellant, but they are slow, power-hungry, and can produce no torque at all about the local magnetic field direction, so dumping must be spread over an orbit as the field direction changes. **Thrusters** are fast and always available, but they consume propellant and, unless fired as a pure couple, disturb the orbit. **Environmental torques** — gravity gradient, aerodynamic — are free but very slow and require holding a biased attitude, which conflicts with the payload's pointing.
:::

::: example Dumping 30 N m s three ways
**Magnetorquers.** A coil of dipole moment $m = 100\,\mathrm{A\,m^2}$ in a field of $B = 3\times 10^{-5}\,\mathrm{T}$ gives at most $mB = 3.0\times 10^{-3}\,\mathrm{N\,m}$. Dumping $30\,\mathrm{N\,m\,s}$ takes $30/(3.0\times 10^{-3}) = 10\,000\,\mathrm{s}$, or $2.8$ hours, at perfect efficiency. Efficiency is never perfect, because only the part of the needed torque perpendicular to $\mathbf{B}$ can be made. Averaged over an orbit, about two thirds is achievable, so budget $2.8/(2/3) \approx 4.2$ hours. Cost: a few watts for hours, and no propellant.

**Thrusters.** Two $1\,\mathrm{N}$ thrusters $1\,\mathrm{m}$ apart, fired as a **couple** (equal and opposite, so they twist without pushing), give $2\,\mathrm{N\,m}$ and dump $30\,\mathrm{N\,m\,s}$ in $30/2 = 15\,\mathrm{s}$. With a **[[specific impulse|isp]]** $I_{sp} = 220\,\mathrm{s}$, the pair burns propellant at $2F/(g_0I_{sp}) = 2/(9.80665\times 220) = 9.27\times 10^{-4}\,\mathrm{kg/s}$. So each dump costs $9.27\times 10^{-4}\times 15 = 0.0139\,\mathrm{kg}$. Weekly dumps for fifteen years is about $782$ events and $10.9\,\mathrm{kg}$ of propellant — a real line in the mass budget, and the reason magnetic dumping is preferred in low orbit, where the field is strong.

**The environment.** Tilt the attitude a few degrees so a steady gravity-gradient torque opposes the pile-up. For a small tilt $\alpha$ the torque is about $(3\mu/r^3)\,\Delta I\,\alpha$; at $\alpha = 3^\circ = 0.0524\,\mathrm{rad}$ that is $3.372\times 10^{-6}\times 800\times 0.0524 = 1.4\times 10^{-4}\,\mathrm{N\,m}$. That easily cancels the $10^{-5}\,\mathrm{N\,m}$ disturbance — but only while the payload tolerates the tilt, so this cheapest option often loses the argument with the payload team.
:::

::: warning Commanding a wheel to zero does not dump momentum
A saturated wheel commanded to stop moves its whole stored momentum into the vehicle, which then rotates at $\lVert\mathbf{h}\rVert/I$. For $30\,\mathrm{N\,m\,s}$ and $I = 2000\,\mathrm{kg\,m^2}$ that is $30/2000 = 0.015\,\mathrm{rad/s}$, or $0.86^\circ/\mathrm{s}$, and it keeps rotating. Desaturation always needs an outside torque acting *while* the wheel slows, so the momentum leaves the system instead of moving around inside it.
:::

## Control moment gyros

Hold a spinning bicycle wheel by its axle and tilt it: the wheel twists hard against your hands, sideways to your tilt. That twist is a **[[control moment gyro|cmg-feel]]** at work.

A reaction wheel makes torque by changing the *size* of $\mathbf{h}$. A CMG makes torque by changing its *direction*. Its rotor runs at constant speed on a **gimbal** — a pivoting frame — and a small gimbal motor tilts the whole assembly. The output torque on the spacecraft is still $-\dot{\mathbf{h}}$. Since $\mathbf{h}$ keeps its size $h_0$, turning the gimbal at rate $\dot{\delta}$ ("delta dot") swings the tip of $\mathbf{h}$ around a circle at speed $h_0\dot{\delta}$. So the output torque has size

$$
\lVert\mathbf{M}\rVert = h_0\,\lvert\dot{\delta}\rvert ,
$$

pointing perpendicular to both the gimbal axis and the rotor momentum. The gimbal motor only overcomes the gimbal's own small inertia and friction, so the device is a **torque amplifier**.

A single-gimbal CMG with $h_0 = 1000\,\mathrm{N\,m\,s}$ tilted at $0.5\,\mathrm{rad/s}$ produces $1000\times 0.5 = 500\,\mathrm{N\,m}$. A reaction wheel of similar mass gives a fraction of a newton-meter, three or four orders of magnitude less. That is why agile vehicles use CMGs, and why the **[[International Space Station|iss-cmgs]]** does: four double-gimbal CMGs of $4760\,\mathrm{N\,m\,s}$ each. At a gimbal rate of $0.5^\circ/\mathrm{s}$ ($8.73\times 10^{-3}\,\mathrm{rad/s}$) each gives $4760\times 8.73\times 10^{-3} = 41.5\,\mathrm{N\,m}$.

Even so, the Station's own spin — once per orbit — carries about seven times what all four can store. Its CMGs do not turn it; they cancel disturbances about an attitude chosen so the secular part is nearly zero.

## The singularity problem

Torque gain has a geometric price. Each CMG's momentum can only swing within the plane perpendicular to its gimbal axis, so one unit can only push within that plane. A cluster of $N$ units has total momentum and torque

$$
\mathbf{h}(\boldsymbol{\delta}) = \sum_{i=1}^{N} h_0\,\hat{\mathbf{h}}_i(\delta_i),
\qquad
\dot{\mathbf{h}} = \mathbf{A}(\boldsymbol{\delta})\,\dot{\boldsymbol{\delta}},
\qquad
\mathbf{A} = \left[\frac{\partial\mathbf{h}}{\partial\delta_1}\ \cdots\ \frac{\partial\mathbf{h}}{\partial\delta_N}\right].
$$

Column $i$ of the $3\times N$ matrix $\mathbf{A}$ is the direction unit $i$ pushes when its gimbal turns, and it changes as the gimbals move.

Pushing in any direction needs $\mathbf{A}$ to have **rank** 3 — its columns must reach into all three dimensions. A **singularity** is a set of gimbal angles where they do not: all $N$ columns lie in one plane. Then some direction $\hat{\mathbf{u}}$ is perpendicular to every column, $\hat{\mathbf{u}}\cdot\partial\mathbf{h}/\partial\delta_i = 0$ for every $i$, and no gimbal rates, however large, produce any torque along $\hat{\mathbf{u}}$. Like a team pushing a box along the floor: however hard they push, it never goes up.

The standard gauge of how close a cluster is to this is

$$
m(\boldsymbol{\delta}) = \sqrt{\det\!\left(\mathbf{A}\mathbf{A}^\top\right)} ,
$$

positive away from singularities and exactly zero at them.

::: example A four-CMG pyramid and where it fails
The usual layout is four single-gimbal CMGs whose gimbal axes are the outward normals of a four-sided **[[pyramid|pyramid]]**, with faces tilted at $\beta$ to the base:

$$
\hat{\mathbf{g}}_{1,3} = (\pm\sin\beta,\ 0,\ \cos\beta), \qquad
\hat{\mathbf{g}}_{2,4} = (0,\ \pm\sin\beta,\ \cos\beta) .
$$

The usual choice $\beta = 54.74^\circ$ makes the reachable momentum nearly a sphere. Direction by direction the most it can hold is $3.266\,h_0$ along $z$, $3.155\,h_0$ along $x$ and $3.168\,h_0$ along $(1,1,1)/\sqrt{3}$ — within four percent of each other. At the zero-momentum state $\boldsymbol{\delta} = (0, 0, 0, 0)$ the gauge is $m = 1.088$: full three-axis authority.

Two singular states show the two kinds.

**External (saturation) singularity.** At $\boldsymbol{\delta} = (90^\circ, 90^\circ, 90^\circ, 90^\circ)$ all four momenta lean as far toward $+z$ as their gimbals allow. Then $\mathbf{h} = (0, 0, 3.266\,h_0)$, $m = 0$, and the lost direction is $\hat{\mathbf{u}} = \hat{\mathbf{z}}$. The cluster is full along $z$; each unit's momentum points partly along $\hat{\mathbf{u}}$ ($+0.8165\,h_0$ each). You cannot store more than you have.

**Internal singularity.** At $\boldsymbol{\delta} = (0^\circ, 90^\circ, 0^\circ, 90^\circ)$, $\mathbf{h} = (0, 0, 1.633\,h_0)$ — exactly *half* the capacity along $z$ — and yet $m = 0$ again, with lost direction $\hat{\mathbf{u}} = \hat{\mathbf{y}}$. Half empty, the cluster cannot push at all about $y$. The projections $\hat{\mathbf{u}}\cdot\hat{\mathbf{h}}_i$ are $(+1, -0.577, -1, +0.577)\,h_0$: mixed signs, the signature of an internal singularity, against the all-positive signature of saturation. This is what makes CMG clusters hard.
:::

Internal singularities are not isolated points. They form surfaces through the momentum space that a naively steered cluster meets in ordinary maneuvers. Worse, being *near* one is as bad as being on it, because the gimbal rates needed blow up.

::: example What a near-singularity costs in gimbal rate
Take the pyramid with $h_0 = 500\,\mathrm{N\,m\,s}$ per unit and demand $50\,\mathrm{N\,m}$ about $y$ — the direction lost at the internal singularity. Steer with the **[[Moore–Penrose pseudo-inverse|pseudo-inverse]]**, $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\boldsymbol{\tau}$ (here $\boldsymbol{\tau}$ is the commanded torque). Walk the gimbals toward the singular state along $\boldsymbol{\delta} = (\varepsilon, 90^\circ - \varepsilon, \varepsilon, 90^\circ - \varepsilon)$, where $\varepsilon$ ("epsilon") is the offset:

| Offset $\varepsilon$ | $m$ | $\lVert\mathbf{h}\rVert$ | Gimbal rate needed |
| --- | --- | --- | --- |
| $10^\circ$ | $0.527$ | $946\,\mathrm{N\,m\,s}$ | $20.2^\circ/\mathrm{s}$ |
| $3^\circ$ | $0.161$ | $858\,\mathrm{N\,m\,s}$ | $67.0^\circ/\mathrm{s}$ |
| $1^\circ$ | $0.054$ | $831\,\mathrm{N\,m\,s}$ | $201^\circ/\mathrm{s}$ |
| $0.3^\circ$ | $0.016$ | $821\,\mathrm{N\,m\,s}$ | $670^\circ/\mathrm{s}$ |

Cut the offset tenfold and the demand grows about tenfold. Real gimbals run at a few tens of degrees per second, so by $3^\circ$ out the cluster is at its hardware limit, and by $1^\circ$ the vehicle gets a maxed-out gimbal and a torque error in the one direction that mattered.

The common fix is the **singularity-robust inverse**, $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top + \lambda\mathbf{E})^{-1}\boldsymbol{\tau}$, with $\mathbf{E}$ the identity and $\lambda$ ("lambda") a small positive number. Adding $\lambda\mathbf{E}$ keeps the matrix invertible however close to singular $\mathbf{A}$ gets. The price is explicit: at the $0.3^\circ$ state with $\lambda = 0.01$, the gimbal-rate demand drops by a factor of $138$, to something a motor can deliver, and the torque actually produced is $0.7$ percent of the torque commanded. The controller stays stable, and the maneuver does not happen.
:::

## Steering laws, honestly

Three remedies exist, each a compromise, not a cure.

**Robust inverses** trade torque accuracy for bounded gimbal rates. They guarantee the loop never demands the impossible; they do not guarantee the vehicle turns.

**Null motion** uses the spare gimbal. With four gimbals and three torque directions, there is a one-dimensional family of gimbal-rate combinations that produce no torque at all — the **null space** of $\mathbf{A}$. Adding some of it steers the gimbals toward higher $m$ without disturbing the vehicle, combing the cluster away from singularities; most flight software does this. Its limit: where every unit's momentum projects positively onto $\hat{\mathbf{u}}$, the cluster sits at a local maximum of $\mathbf{h}\cdot\hat{\mathbf{u}}$, and no momentum-preserving motion lowers it. Those states are **elliptic**, and the internal ones among them truly trap the cluster. Mixed-sign states like $(0^\circ, 90^\circ, 0^\circ, 90^\circ)$ are **hyperbolic** and can be escaped, though the escape may take longer than the maneuver allows.

**Adding hardware** works and costs. A fifth or sixth CMG enlarges the null space and shrinks the singular set. Double-gimbal units, like the Station's, give each rotor two freedoms and richer escape routes, at the cost of mass, gimbal stops and harder steering.

::: warning A singularity is not a control-law bug
When a CMG cluster stalls, the instinct is to retune the attitude controller. The controller is fine: a singularity belongs to the *array geometry and the gimbal angles*; it would be there with perfect control and perfect hardware. Log $m(\boldsymbol{\delta})$ beside the torque error. If $m$ collapses when the error appears, the steering law, not the controller, needs attention.
:::

::: note Momentum bias, zero momentum, and wheel zero crossings
A zero-momentum cluster behaves like a plain rigid body with no gyroscopic coupling, but has no passive stability, and its wheels pass through zero speed when they reverse, where bearing **stiction** (sticky friction at rest) makes the pointing jitter. A **momentum-bias** system runs one wheel deliberately fast: stiff about that axis and away from zero, at the cost of lesson 9's $\boldsymbol{\omega}\times\mathbf{h}$ coupling — lesson 10's trade, one wheel at a time.
:::

## Check yourself

::: check
A $600\,\mathrm{kg\,m^2}$ satellite must scan at a steady $1.0^\circ/\mathrm{s}$ for eight minutes, then return to rest. What stored momentum must the wheel hold during the scan, and how much net momentum has left the system when the satellite is at rest again?
:::

::: answer
The body rate is $1.0^\circ/\mathrm{s} = 0.01745\,\mathrm{rad/s}$, so the body carries $I\omega = 600\times 0.01745 = 10.5\,\mathrm{N\,m\,s}$ during the scan. The wheel must hold $-10.5\,\mathrm{N\,m\,s}$ relative to its starting value for all eight minutes.

When the satellite stops, the wheel returns to its original speed, and the net change in system momentum is zero — no outside torque acted, so none could leave. The duration does not matter to the momentum budget — only to the heat budget, since the motor works against friction the whole time.
:::

::: check
A spacecraft in low orbit piles up $0.6\,\mathrm{N\,m\,s}$ per day of secular momentum. Its wheels hold $25\,\mathrm{N\,m\,s}$, and it carries magnetorquers of $60\,\mathrm{A\,m^2}$ in a $2.5\times 10^{-5}\,\mathrm{T}$ field. How often must it dump, and can the coils keep up?
:::

::: answer
The wheels fill in $25/0.6 = 41.7$ days, so a dump every month is comfortable.

The coils give at most $mB = 60\times 2.5\times 10^{-5} = 1.5\times 10^{-3}\,\mathrm{N\,m}$. At about two thirds average efficiency, the usable average is $1.0\times 10^{-3}\,\mathrm{N\,m}$. Running all day, that removes $1.0\times 10^{-3}\times 86\,400 = 86.4\,\mathrm{N\,m\,s}$ per day — $86.4/0.6 = 144$ times the daily pile-up. So the coils need to be on only about one part in $144$ — about $0.7$ percent of the time. In practice they run at a low level to cancel the disturbance continuously, so the wheels never near saturation. Magnetic control is slow per second and generous per day.
:::

::: check
A single-gimbal CMG has $h_0 = 800\,\mathrm{N\,m\,s}$ and a gimbal rate limited to $30^\circ/\mathrm{s}$. What is its maximum output torque? What torque must the gimbal motor supply if the gimbal assembly's inertia about its own axis is $2\,\mathrm{kg\,m^2}$ and it reaches full rate in $0.2\,\mathrm{s}$?
:::

::: answer
$30^\circ/\mathrm{s} = 0.5236\,\mathrm{rad/s}$, so the output torque is $h_0\dot{\delta} = 800\times 0.5236 = 419\,\mathrm{N\,m}$.

The gimbal motor only has to spin up the gimbal assembly about its own axis. The rate goes from $0$ to $0.5236\,\mathrm{rad/s}$ in $0.2\,\mathrm{s}$, an angular acceleration of $0.5236/0.2 = 2.62\,\mathrm{rad/s^2}$. So the motor torque is $2\times 2.62 = 5.24\,\mathrm{N\,m}$, plus friction.

That is the amplification: $419/5.24 \approx 80$ newton-meters out per newton-meter in. It is not free energy — the big reaction torque is carried by the gimbal bearings and structure, not the motor — but to the controller, a small actuator commands a very large torque.
:::

::: check
Why can a CMG cluster be singular at half its rated momentum, and why is that worse than being singular when full?
:::

::: answer
Each unit's momentum is confined to a circle in the plane perpendicular to its own gimbal axis. The total is a sum of four such constrained vectors, and many gimbal combinations give the same total. At some of them the four push directions $\partial\mathbf{h}/\partial\delta_i$ happen to lie in one plane even though the total momentum is modest. For the pyramid, $(0^\circ, 90^\circ, 0^\circ, 90^\circ)$ gives $\lVert\mathbf{h}\rVert = 1.633\,h_0$ against a capacity of $3.266\,h_0$, with no torque available about $y$.

Being singular when full is honest: the array is out of capacity, and the remedy is to dump momentum. Being singular at half capacity is a trap the steering law walked into with capacity to spare, mid-maneuver and with no warning to the attitude controller.
:::

::: check
Your CMG steering law uses a singularity-robust inverse with a fixed $\lambda$. During a fast slew the vehicle falls behind its commanded profile, and the log shows $m$ dropping to $0.02$ at the same moment. Explain what happened and name two changes that would help.
:::

::: answer
The cluster approached an internal singularity. The robust inverse kept gimbal rates finite, at the price of a torque error in exactly the direction the geometry could not supply, so the vehicle fell behind. A fixed $\lambda$ also makes that trade all the time, even far from singularities where it is not needed.

Two changes help. Add **null motion**, steering the gimbals toward higher $m$ before the maneuver needs the lost direction. And make $\lambda$ *adaptive*, scaling it with $m$ so it vanishes when the cluster is healthy. A third, if the same singular surface keeps appearing, is to re-plan the momentum path around it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \sum_k I_{w,k}\Omega_k\hat{\mathbf{a}}_k$ | Total system momentum; conserved with no external torque |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}}$ | Equations of motion with wheels; control torque is $-\dot{\mathbf{h}}$ |
| Slew sizing | $t = 2\sqrt{I\Delta\vartheta/M}$, peak momentum $\sqrt{IM\Delta\vartheta}$; a steady rate needs $I\omega$ held |
| Saturation | Wheel at top speed; a secular torque $M$ fills capacity $h_{\max}$ in $h_{\max}/M$ |
| Desaturation | Magnetorquers ($\mathbf{m}\times\mathbf{B}$, no torque along $\mathbf{B}$, slow), thrusters (fast, propellant), environmental (free, very slow, needs a biased attitude) |
| $\lVert\mathbf{M}\rVert = h_0\lvert\dot{\delta}\rvert$ | CMG output torque; a torque amplifier |
| $\dot{\mathbf{h}} = \mathbf{A}(\boldsymbol{\delta})\dot{\boldsymbol{\delta}}$ | CMG cluster matrix, $3\times N$ |
| $m = \sqrt{\det(\mathbf{A}\mathbf{A}^\top)}$ | Singularity gauge; zero at a singularity |
| Pyramid, $\beta = 54.74^\circ$ | Capacity $3.266\,h_0$ along $z$; internal singularity at $1.633\,h_0$ with no torque about $y$ |
| Steering laws | Pseudo-inverse (blows up), robust inverse (bounded rates, torque error), null motion (escapes hyperbolic singularities only) |

Wheels and CMGs complete the actuator picture: momentum is swapped inside for free and removed outside at a price, and geometry limits a CMG cluster. Everything so far has assumed the vehicle carrying these actuators is rigid. The last lesson of the module drops that assumption and shows what flexible appendages and sloshing propellant do to the model a controller is designed against.

::: context reaction-wheel Spin one way, turn the other
A reaction wheel is a heavy disc on a motor, fixed inside the spacecraft. When the motor speeds the wheel up one way, the motor's housing — and the spacecraft bolted to it — is pushed the opposite way with the same torque. Slow the wheel down and the push reverses. Three wheels on three axes (often four, for a spare) steer the whole vehicle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="50" width="160" height="110" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="105" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="105" r="4" fill="#1f2a44"/>
  <path d="M 153.1 78.1 A 38 38 0 0 1 206.9 78.1" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="210.4,81.6 206.8,71.0 199.8,78.0" fill="#1d6fd1"/>
  <path d="M 93.4 55 A 100 100 0 0 0 93.4 155" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="95.9,159.3 95.2,148.1 86.6,153.1" fill="#b4232c"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">wheel spun up clockwise</text>
  <text x="180" y="182" font-size="12" text-anchor="middle" fill="#b4232c">body turns counterclockwise</text>
  <text x="270" y="110" font-size="12" fill="#1f2a44">spacecraft</text>
</svg>
```
:::

::: context bang-bang Full on, then full reverse
"Bang-bang" describes a command that only ever sits at its two limits: full push one way, then full push the other, with an instant switch between them. For a fixed torque limit it is the fastest way to turn a body through a given angle and stop it there. Real flight software rounds the corners a little, because an instant switch shakes flexible parts like solar arrays — the subject of the next lesson.
:::

::: context secular Why "secular"?
In astronomy and engineering, **secular** means slowly and steadily changing in one direction, as opposed to periodic. It comes from the Latin *saeculum*, "an age" or "a century": a secular change is one you notice over ages rather than over one cycle. A secular torque is small but always pushes the same way, so its effect keeps growing with time.
:::

::: context magnetorquer A compass needle you can switch
A magnetorquer is a coil of wire (often wound around an iron rod). Current through it makes a magnetic dipole $\mathbf{m}$, like a compass needle, and Earth's field $\mathbf{B}$ twists it with torque $\mathbf{m}\times\mathbf{B}$. Like a compass needle, it feels no twist when it already lines up with the field. So whatever you do, you cannot make torque along $\mathbf{B}$ — only across it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="160" y2="120" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="168,120 156,114 156,126" fill="#1f2a44"/>
  <text x="140" y="140" font-size="12" fill="#1f2a44">B</text>
  <line x1="60" y1="120" x2="100" y2="51" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="104,44 94,51 104,56" fill="#1d6fd1"/>
  <text x="108" y="50" font-size="12" fill="#1d6fd1">m</text>
  <circle cx="60" cy="120" r="10" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <line x1="53" y1="113" x2="67" y2="127" stroke="#b4232c" stroke-width="2"/>
  <line x1="67" y1="113" x2="53" y2="127" stroke="#b4232c" stroke-width="2"/>
  <text x="20" y="160" font-size="12" fill="#b4232c">torque into page</text>
  <line x1="200" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="348,120 336,114 336,126" fill="#1f2a44"/>
  <text x="320" y="140" font-size="12" fill="#1f2a44">B</text>
  <line x1="220" y1="100" x2="290" y2="100" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="298,100 286,94 286,106" fill="#1d6fd1"/>
  <text x="300" y="96" font-size="12" fill="#1d6fd1">m</text>
  <text x="200" y="160" font-size="12" fill="#b4232c">m along B: no torque</text>
</svg>
```
:::

::: context isp Specific impulse: fuel mileage for thrusters
**Specific impulse**, $I_{sp}$, measures how much push a rocket gets from its propellant. It is the thrust divided by the weight of propellant used per second, which leaves units of seconds. So the propellant flow is thrust over $g_0 I_{sp}$, with $g_0 = 9.80665\,\mathrm{m/s^2}$. Small hydrazine attitude thrusters give roughly $200$ to $230\,\mathrm{s}$; bigger engines do better. Higher $I_{sp}$ means less propellant for the same momentum dump.
:::

::: context cmg-feel The bicycle-wheel trick
Hold a spinning bicycle wheel by both ends of its axle and try to tilt the axle toward you. The wheel pushes one hand up and the other down — a strong twist at right angles to your tilt. The faster the wheel spins and the faster you tilt, the harder the twist. A CMG is exactly that, with a motor doing the tilting and the spacecraft feeling the twist. Lesson 9 derived the rule behind it: the torque is the rate of change of the momentum arrow.
:::

::: context iss-cmgs The Station's gyroscopes
The International Space Station holds its attitude day to day with four double-gimbal CMGs mounted on its central truss, each a rotor spinning at about $6600\,\mathrm{rpm}$. They have been a maintenance item: one failed in 2002 after a bearing problem and was replaced by a Space Shuttle crew in 2005. When they cannot cope, the Station fires thrusters on its Russian segment instead, which costs propellant.

Scale explains the limits. The Station's inertia is about $1.2\times 10^{8}\,\mathrm{kg\,m^2}$ and it turns once per orbit, at $1.13\times 10^{-3}\,\mathrm{rad/s}$, so its angular momentum is about $1.36\times 10^{5}\,\mathrm{N\,m\,s}$, against $4\times 4760 = 19\,040\,\mathrm{N\,m\,s}$ for the whole cluster.
:::

::: context pyramid Four gimbals on a pyramid
Seen from the side, the pyramid's faces lean at $\beta = 54.74^\circ$ to the base. Each gimbal axis sticks straight out of a face, so it leans $54.74^\circ$ from the vertical. That special angle is the one whose cosine is $1/\sqrt{3}$ — the angle between a cube's edge and its long diagonal — and it makes the four units share the load almost equally in every direction. Each rotor's momentum swings in the plane of its face.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="320" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="80,170 180,28.6 280,170" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="99.3" x2="81" y2="64.6" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="81,64.6 92.1,66.3 86.3,74.5" fill="#b4232c"/>
  <line x1="230" y1="99.3" x2="279" y2="64.6" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="279,64.6 273.7,74.5 267.9,66.3" fill="#b4232c"/>
  <path d="M 110 170 A 30 30 0 0 0 97.3 145.5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="114" y="162" font-size="11" fill="#1f2a44">54.74°</text>
  <text x="20" y="58" font-size="12" fill="#b4232c">gimbal axis</text>
  <text x="262" y="56" font-size="12" fill="#b4232c">gimbal axis</text>
  <text x="180" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">side view: two of the four faces</text>
</svg>
```
:::

::: context pseudo-inverse The best answer to an unfair question
With four gimbals and three torque directions, many gimbal-rate combinations give the same torque. The **Moore–Penrose pseudo-inverse**, named after the mathematicians E. H. Moore and Roger Penrose, picks the one with the smallest total gimbal rate. It works well while $\mathbf{A}\mathbf{A}^\top$ can be inverted. Near a singularity that matrix is almost uninvertible — like dividing by a number close to zero — and the "smallest" answer becomes enormous.
:::
