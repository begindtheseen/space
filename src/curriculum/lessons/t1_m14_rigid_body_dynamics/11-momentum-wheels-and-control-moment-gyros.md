---
id: l11-momentum-wheels-and-control-moment-gyros
title: Momentum wheels and control moment gyros
minutes: 26
covers:
  - momentum wheels and control moment gyros
---

Every actuator in the previous three lessons was either a permanent spin or an external torque. This lesson covers the actuators that most spacecraft actually fly: small flywheels inside the vehicle, driven by electric motors, that let a satellite turn itself without expending anything but power. A **reaction wheel** changes its speed to push the vehicle the other way. A **control moment gyro** keeps its speed fixed and tilts its axis instead, trading a small gimbal torque for a large output torque. Both are internal, and both are therefore governed by one constraint: the total angular momentum of the vehicle plus its wheels cannot change without an external torque.

That constraint is where the engineering lives. A wheel can slew a satellite in either direction indefinitely, because slewing is a momentum *exchange* and the net stays zero. It cannot absorb a disturbance torque indefinitely, because a disturbance adds momentum and a wheel has a finite speed. Sooner or later something external — a magnetic coil, a thruster, or the environment — has to take the accumulated momentum away, and choosing which is a real mission trade.

Control moment gyros then add a difficulty of their own. Their torque amplification is enormous — a gimbal motor of a few newton-metres commands hundreds — but the mapping from gimbal rates to output torque is a state-dependent matrix that loses rank at certain gimbal angles. At those **singularities** the cluster cannot produce torque along one particular direction no matter how the gimbals move, and they occur at momentum states well inside the cluster's rated capacity. Nothing about CMGs is harder than this, and no steering law removes it.

## Momentum exchange: nothing is created

Let the spacecraft structure have inertia $\mathbf{I}$ about the system centre of mass and angular velocity $\boldsymbol{\omega}$, and let it carry $N$ wheels, the $k$-th with axial inertia $I_{w,k}$, spin axis $\hat{\mathbf{a}}_k$ fixed in the body, and spin rate $\Omega_k$ relative to the body. Lesson 1's rule that angular velocities add gives the wheel's inertial spin as $\boldsymbol{\omega} + \Omega_k\hat{\mathbf{a}}_k$, and summing the two contributions,

$$
\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \sum_{k} I_{w,k}\Omega_k\hat{\mathbf{a}}_k
= \mathbf{I}\boldsymbol{\omega} + \mathbf{h} ,
$$

where $\mathbf{I}$ already includes the wheels' inertia as if they were locked, and $\mathbf{h}$ is the **stored momentum** the wheels hold by virtue of turning faster than the body — the same $\mathbf{h}$ as in lessons 9 and 10, now under active command.

::: key Wheel momentum exchange
Under zero external torque the total system angular momentum $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \sum_k I_{w,k}\Omega_k\hat{\mathbf{a}}_k$ is conserved. A wheel takes momentum from the body or gives it back; it cannot create or remove system momentum, only shuffle it. Changing $\mathbf{H}$ requires an external torque.
:::

Differentiating in the body frame with the transport theorem gives the equation every wheel-controlled spacecraft is simulated with:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}} .
$$

The wheel motors set $\dot{\mathbf{h}}$, so the torque the controller applies to the structure is $-\dot{\mathbf{h}}$: to accelerate the body one way, spin the wheel the other. The $\boldsymbol{\omega}\times\mathbf{h}$ term is the gyroscopic coupling of lesson 9, and it is computed and cancelled by feed-forward rather than fought. When $\mathbf{M}_{\mathrm{ext}} = 0$ the sum $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}$ is constant, which is the conservation law in differential form.

::: example Slewing a bus with one wheel
The communications bus of this module, $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$, is to be turned $30^\circ$ about $z$ by a reaction wheel whose motor can deliver $0.10\,\mathrm{N\,m}$. Use a bang-bang profile: accelerate for half the time, decelerate for the other half.

The total slew time is $t = 2\sqrt{I\,\Delta\vartheta/M} = 2\sqrt{2000\times 0.5236/0.10} = 205\,\mathrm{s}$, and the peak body rate at the midpoint is $\sqrt{M\,\Delta\vartheta/I} = \sqrt{0.10\times 0.5236/2000} = 5.12\times 10^{-3}\,\mathrm{rad/s}$, that is $0.293^\circ/\mathrm{s}$. At that instant the body carries $I\omega = 2000\times 5.12\times 10^{-3} = 10.2\,\mathrm{N\,m\,s}$, and because the total is conserved the wheel must have taken on $-10.2\,\mathrm{N\,m\,s}$. For a wheel of $I_w = 0.05\,\mathrm{kg\,m^2}$ that is a speed change of $10.2/0.05 = 205\,\mathrm{rad/s}$, about $1950\,\mathrm{rpm}$.

At the end of the slew the body is at rest and the wheel is back at its original speed: the momentum was borrowed and returned, and the only permanent cost was the electrical energy the motor drew. A continuous scan at $0.5^\circ/\mathrm{s}$ is different — it needs $2000\times 8.73\times 10^{-3} = 17.5\,\mathrm{N\,m\,s}$ held in the wheel for as long as the scan lasts, which is $3330\,\mathrm{rpm}$ of offset. That standing offset, not the peak torque, is what usually sizes a wheel.
:::

## Saturation, and what the environment does to you

A wheel has a maximum speed, so it has a maximum stored momentum — typically $0.01$ to $1\,\mathrm{N\,m\,s}$ for a cubesat wheel, $20$ to $100\,\mathrm{N\,m\,s}$ for a geostationary bus. When an external torque acts, the stored momentum has to grow to keep the body still, and when the wheel reaches its limit it is **saturated**: it can no longer resist, and the vehicle starts to turn.

Which disturbances matter depends on whether they are cyclic or secular in the body frame. An Earth-pointing satellite sees gravity-gradient torque as a once-per-orbit oscillation, which charges and discharges the wheel with no long-term growth. Solar radiation pressure, aerodynamic torque on an offset centre of pressure, and a residual magnetic dipole all have secular components, and those integrate.

::: example What a wheel accumulates in low orbit
Put the bus in a $700\,\mathrm{km}$ circular orbit: $r = 7.078\times 10^6\,\mathrm{m}$, period $5926\,\mathrm{s}$, orbit rate $\omega_o = 1.060\times 10^{-3}\,\mathrm{rad/s}$, and $3\mu/r^3 = 3.372\times 10^{-6}\,\mathrm{s^{-2}}$. Holding an Earth-pointing attitude, the gravity-gradient torque peaks at

$$
M_{gg} = \tfrac{1}{2}\,\frac{3\mu}{r^3}\,\lvert I_z - I_x\rvert
= 0.5\times 3.372\times 10^{-6}\times 800 = 1.35\times 10^{-3}\,\mathrm{N\,m}
$$

when the vehicle is $45^\circ$ off the local vertical. That is a big-sounding torque, but it reverses twice per orbit, so the wheel only has to store about $M_{gg}/\omega_o = 1.27\,\mathrm{N\,m\,s}$ — trivial for a $30\,\mathrm{N\,m\,s}$ wheel.

The secular residue is what bites. Take a modest $1\times 10^{-5}\,\mathrm{N\,m}$ of unidirectional torque from solar pressure, aerodynamics and a residual dipole combined. Per orbit that is $0.059\,\mathrm{N\,m\,s}$; per day, $0.864\,\mathrm{N\,m\,s}$. A $30\,\mathrm{N\,m\,s}$ wheel fills in $34.7$ days and a $50\,\mathrm{N\,m\,s}$ wheel in $58$ days. A fifteen-year mission therefore needs a few hundred momentum dumps, and each one must be planned, powered and — if it uses propellant — budgeted.
:::

## Desaturation

Momentum dumping requires an external torque; there is no way around it. Commanding the wheel to zero speed simply hands its momentum back to the body, which then rotates. Bearing friction is internal too and does the same thing more slowly. Three real options exist, and each costs something different.

::: key Desaturation options and their costs
**Magnetorquers** produce $\mathbf{M} = \mathbf{m}\times\mathbf{B}$ from a commanded magnetic dipole. They consume no propellant, but they are slow, power-hungry, and can produce no torque at all about the local magnetic field direction, so dumping must be spread over an orbit as the field geometry changes. **Thrusters** are fast and always available, but they consume propellant and, unless fired as a pure couple, perturb the orbit. **Environmental torques** — gravity gradient, aerodynamic — are free but very slow and require holding a biased attitude, which conflicts with the payload's pointing.
:::

::: example Dumping 30 N m s three ways
A coil of dipole moment $m = 100\,\mathrm{A\,m^2}$ in a field of $B = 3\times 10^{-5}\,\mathrm{T}$ gives at best $mB = 3.0\times 10^{-3}\,\mathrm{N\,m}$. Dumping $30\,\mathrm{N\,m\,s}$ takes $30/3.0\times 10^{-3} = 10{,}000\,\mathrm{s}$, or $2.8$ hours, at perfect efficiency — and the efficiency is never perfect, because only the component of the required torque perpendicular to $\mathbf{B}$ can be produced. Averaged over an orbit, roughly two thirds of the demand is achievable, so budget about $4.2$ hours. Cost: a few watts, for hours, and no thrust.

Two $1\,\mathrm{N}$ thrusters $1\,\mathrm{m}$ apart, fired as a couple, give $2\,\mathrm{N\,m}$ and dump the same $30\,\mathrm{N\,m\,s}$ in $15\,\mathrm{s}$. At $I_{sp} = 220\,\mathrm{s}$ the mass flow of the pair is $2F/(g_0I_{sp}) = 2/(9.80665\times 220) = 9.27\times 10^{-4}\,\mathrm{kg/s}$, so each dump costs $0.0139\,\mathrm{kg}$. Weekly dumps for fifteen years is $780$ events and $10.8\,\mathrm{kg}$ of propellant — a real entry in the mass budget, and the reason magnetic dumping is preferred in low orbit where the field is strong.

The environmental option: bias the attitude a few degrees so the gravity-gradient torque opposes the accumulation. With $1.35\times 10^{-3}\,\mathrm{N\,m}$ available at $45^\circ$ of lean, a few degrees gives of order $10^{-4}\,\mathrm{N\,m}$, enough to cancel the $10^{-5}\,\mathrm{N\,m}$ disturbance outright — but only while the payload tolerates the bias. It is the cheapest option and the one that most often loses the argument with the payload team.
:::

## Control moment gyros

A reaction wheel makes torque by changing $|\mathbf{h}|$. A control moment gyro makes torque by changing the *direction* of $\mathbf{h}$: its rotor runs at constant speed on a gimbal, and a gimbal motor tilts the whole assembly. Since the output torque on the spacecraft is $-\dot{\mathbf{h}}$ and $\mathbf{h}$ has constant magnitude $h_0$, rotating the gimbal at $\dot{\delta}$ gives an output torque of magnitude

$$
\lVert\mathbf{M}\rVert = h_0\,\lvert\dot{\delta}\rvert ,
$$

perpendicular to both the gimbal axis and the rotor momentum. The gimbal motor itself has to supply almost nothing — only enough to overcome the gimbal assembly's own small inertia and friction — so the device is a **torque amplifier**. A single-gimbal CMG with $h_0 = 1000\,\mathrm{N\,m\,s}$ driven at $0.5\,\mathrm{rad/s}$ produces $500\,\mathrm{N\,m}$, three or four orders of magnitude more than a reaction wheel motor of comparable mass. That is why large agile vehicles use them, and why the Space Station uses them: four double-gimbal CMGs of $4760\,\mathrm{N\,m\,s}$ each, which at a gimbal rate of $0.5^\circ/\mathrm{s}$ can produce $41.5\,\mathrm{N\,m}$ apiece.

Scale matters. The Station's inertia is of order $1.2\times 10^{8}\,\mathrm{kg\,m^2}$ and it turns once per orbit at $1.13\times 10^{-3}\,\mathrm{rad/s}$, so its own angular momentum is about $1.36\times 10^{5}\,\mathrm{N\,m\,s}$ — seven times what the whole cluster can store. The CMGs are not there to turn the Station but to null disturbance torques about a chosen attitude, and that attitude is chosen so the secular disturbance is near zero, because there is no margin for anything else.

## The singularity problem

Torque amplification comes with a geometric price. Each CMG's momentum is confined to the plane perpendicular to its gimbal axis, so a single unit can only ever produce torque in that plane. A cluster of several units has a total momentum

$$
\mathbf{h}(\boldsymbol{\delta}) = \sum_{i=1}^{N} h_0\,\hat{\mathbf{h}}_i(\delta_i),
\qquad
\dot{\mathbf{h}} = \mathbf{A}(\boldsymbol{\delta})\,\dot{\boldsymbol{\delta}},
\qquad
\mathbf{A} = \left[\frac{\partial\mathbf{h}}{\partial\delta_1}\ \cdots\ \frac{\partial\mathbf{h}}{\partial\delta_N}\right],
$$

with $\mathbf{A}$ a $3\times N$ matrix that depends on the gimbal angles. Three-axis control needs $\mathbf{A}$ to have rank 3. A **singularity** is a set of gimbal angles at which it does not: all $N$ columns become coplanar, and there is a direction $\hat{\mathbf{u}}$ with $\hat{\mathbf{u}}\cdot\partial\mathbf{h}/\partial\delta_i = 0$ for every $i$. No combination of gimbal rates, however large, produces any torque along $\hat{\mathbf{u}}$.

The standard measure of how close a cluster is to this condition is

$$
m(\boldsymbol{\delta}) = \sqrt{\det\!\left(\mathbf{A}\mathbf{A}^\top\right)} ,
$$

which is positive away from singularities and exactly zero at them.

::: example A four-CMG pyramid and where it fails
The usual arrangement is four single-gimbal CMGs whose gimbal axes are the normals of a pyramid, skewed at $\beta$ from the base plane:

$$
\hat{\mathbf{g}}_{1,3} = (\pm\sin\beta,\ 0,\ \cos\beta), \qquad
\hat{\mathbf{g}}_{2,4} = (0,\ \pm\sin\beta,\ \cos\beta) .
$$

The common choice $\beta = 54.74^\circ$ makes the momentum envelope nearly spherical: computing the maximum reachable momentum direction by direction gives $3.266\,h_0$ along $z$, $3.155\,h_0$ along $x$ and $3.168\,h_0$ along $(1,1,1)/\sqrt{3}$ — within four per cent of a sphere. At the zero-momentum state $\boldsymbol{\delta} = (0, 0, 0, 0)$ the measure is $m = 1.088$, and the cluster has full three-axis authority.

Two singular states show the two kinds. At $\boldsymbol{\delta} = (90^\circ, 90^\circ, 90^\circ, 90^\circ)$ all four momenta lean as far toward $+z$ as their gimbals allow: $\mathbf{h} = (0, 0, 3.266\,h_0)$, $m = 0$, and the lost direction is $\hat{\mathbf{u}} = \hat{\mathbf{z}}$. This is an **external**, or saturation, singularity — the cluster is simply full along $z$, and every unit's momentum projects positively onto $\hat{\mathbf{u}}$ ($+0.8165\,h_0$ each). Nothing can be done about it and nothing should be: you cannot store more momentum than you have.

At $\boldsymbol{\delta} = (0^\circ, 90^\circ, 0^\circ, 90^\circ)$, however, $\mathbf{h} = (0, 0, 1.633\,h_0)$ — exactly *half* the envelope — and $m = 0$ again, with the lost direction $\hat{\mathbf{u}} = \hat{\mathbf{y}}$. The cluster is half empty and still cannot produce any torque about $y$. This is an **internal** singularity, and it is what makes CMG clusters hard. The projections $\hat{\mathbf{u}}\cdot\hat{\mathbf{h}}_i$ here are $(+1, -0.577, -1, +0.577)\,h_0$: mixed signs, which is the signature of an internal singularity, against the all-positive signature of the saturation case.
:::

Internal singularities are not isolated points. They form surfaces threading the momentum envelope, and a naively steered cluster runs into them during ordinary manoeuvres. Worse, near-singular is as bad as singular, because the gimbal rates required blow up.

::: example What a near-singularity costs in gimbal rate
Take the pyramid with $h_0 = 500\,\mathrm{N\,m\,s}$ per unit, and demand $50\,\mathrm{N\,m}$ about $y$ — the direction that is lost at the internal singularity. Steer with the Moore–Penrose pseudo-inverse, $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\boldsymbol{\tau}$, and walk the gimbals toward $(0^\circ, 90^\circ, 0^\circ, 90^\circ)$:

| Offset from singular | $m$ | $\lVert\mathbf{h}\rVert$ | Gimbal rate needed |
| --- | --- | --- | --- |
| $10^\circ$ | $0.527$ | $946\,\mathrm{N\,m\,s}$ | $20.2^\circ/\mathrm{s}$ |
| $3^\circ$ | $0.161$ | $858\,\mathrm{N\,m\,s}$ | $67.0^\circ/\mathrm{s}$ |
| $1^\circ$ | $0.054$ | $831\,\mathrm{N\,m\,s}$ | $201^\circ/\mathrm{s}$ |
| $0.3^\circ$ | $0.016$ | $821\,\mathrm{N\,m\,s}$ | $670^\circ/\mathrm{s}$ |

The demand grows as the reciprocal of the distance from the singularity, and real gimbals run at a few tens of degrees per second. By $3^\circ$ away the cluster is already at the limit of its hardware; by $1^\circ$ the pseudo-inverse is asking for something impossible, and what the vehicle actually gets is a saturated gimbal rate and a torque error in the one direction that mattered.

The common fix is the **singularity-robust inverse**, $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top + \lambda\mathbf{E})^{-1}\boldsymbol{\tau}$, where $\mathbf{E}$ is the identity, which keeps the matrix invertible however close to singular $\mathbf{A}$ becomes. It works, and the price is explicit: at the $0.3^\circ$ state with $\lambda = 0.01$, the gimbal-rate demand drops by a factor of $138$ to something a motor can deliver, and the torque actually produced is $0.7$ per cent of the torque commanded. The controller stays stable and the manoeuvre does not happen.
:::

## Steering laws, honestly

Three families of remedy exist, and each is a compromise rather than a solution.

**Robust inverses** trade torque accuracy for bounded gimbal rates. They guarantee the loop never demands the impossible; they do not guarantee that the vehicle turns.

**Null motion** exploits the extra gimbal. With four gimbals and three torque axes there is a one-dimensional family of gimbal-rate vectors that produce no torque — the null space of $\mathbf{A}$. Adding a null-space component steers the gimbals toward higher $m$ without disturbing the vehicle, so a cluster can be continuously combed away from singularities, and this is what most flight software does. Its limit: null motion cannot escape every singularity. Where every unit's momentum projects positively onto $\hat{\mathbf{u}}$, the cluster sits at a local maximum of $\mathbf{h}\cdot\hat{\mathbf{u}}$ and no momentum-preserving gimbal motion reduces it. Those states are **elliptic**, and the internal ones among them genuinely trap. Mixed-sign states such as $(0^\circ, 90^\circ, 0^\circ, 90^\circ)$ are **hyperbolic** and can be escaped, though the escape may take longer than the manoeuvre allows.

**Adding hardware** works and costs. A fifth or sixth CMG enlarges the null space and shrinks the singular set; double-gimbal units give each rotor two degrees of freedom and a richer escape geometry, at the cost of mass, gimbal stops and a harder steering problem. The Station's four double-gimbal units are that choice.

::: warning A singularity is not a control-law bug
The first instinct on seeing a CMG cluster stall is to retune the attitude controller. The controller is fine: a singularity is a property of the *array geometry and the gimbal angles*, and it would be there with perfect control and perfect hardware. Log $m(\boldsymbol{\delta})$ beside the torque error; if $m$ collapses when the error appears, the steering law, not the controller, needs the attention.
:::

::: warning Commanding a wheel to zero does not dump momentum
A saturated wheel commanded to stop transfers its entire stored momentum to the vehicle, which then rotates at $\lVert\mathbf{h}\rVert/I$ — for $30\,\mathrm{N\,m\,s}$ and $I = 2000\,\mathrm{kg\,m^2}$, $0.015\,\mathrm{rad/s}$, or $0.86^\circ/\mathrm{s}$, and it will keep rotating. Desaturation always requires an external torque acting *while* the wheel slows down, so that the momentum leaves the system rather than moving within it.
:::

::: note Momentum bias, zero momentum, and wheel zero crossings
A cluster at zero net stored momentum behaves like a plain rigid body with no gyroscopic coupling, but it has no passive stability, and its wheels pass through zero speed whenever they reverse, where bearing stiction makes the torque non-linear and the pointing jitters. A **momentum-bias** system runs one wheel deliberately fast, keeping the vehicle stiff about that axis and its wheels away from zero, at the cost of the $\boldsymbol{\omega}\times\mathbf{h}$ coupling of lesson 9 — the trade of lesson 10, made one wheel at a time.
:::

## Check yourself

::: check
A $600\,\mathrm{kg\,m^2}$ satellite must scan at a constant $1.0^\circ/\mathrm{s}$ for eight minutes, then return to rest. What stored momentum must the wheel hold during the scan, and how much net momentum has left the system when the satellite is at rest again?
:::

::: answer
The body rate is $1.0^\circ/\mathrm{s} = 0.01745\,\mathrm{rad/s}$, so the body carries $I\omega = 600\times 0.01745 = 10.5\,\mathrm{N\,m\,s}$ during the scan, and the wheel must hold $-10.5\,\mathrm{N\,m\,s}$ relative to its starting value for the whole eight minutes. When the satellite returns to rest the wheel returns to its original speed and the net momentum change of the system is zero — no external torque acted, so none could. The duration is irrelevant to the momentum budget (though not to the thermal one: the motor dissipates the whole time it holds the offset against friction).
:::

::: check
A spacecraft in low orbit accumulates $0.6\,\mathrm{N\,m\,s}$ per day of secular momentum. Its wheels hold $25\,\mathrm{N\,m\,s}$ and it carries magnetorquers of $60\,\mathrm{A\,m^2}$ in a $2.5\times 10^{-5}\,\mathrm{T}$ field. How often must it dump, and can the coils keep up?
:::

::: answer
The wheels fill in $25/0.6 = 41.7$ days, so a dump every month is comfortable. The coils give at most $mB = 60\times 2.5\times 10^{-5} = 1.5\times 10^{-3}\,\mathrm{N\,m}$; at, say, two thirds average efficiency the usable average is $1.0\times 10^{-3}\,\mathrm{N\,m}$, which removes $86\,\mathrm{N\,m\,s}$ per day of continuous operation. That is $144$ times the daily accumulation, so the coils need only be on about $0.7$ per cent of the time — or, more practically, they can be left on at a low duty cycle and continuously cancel the disturbance so that the wheels never approach saturation at all. Magnetic control is slow per unit time and generous per unit day.
:::

::: check
A single-gimbal CMG has $h_0 = 800\,\mathrm{N\,m\,s}$ and a gimbal rate limited to $30^\circ/\mathrm{s}$. What is its maximum output torque, and what torque must the gimbal motor supply if the gimbal assembly's inertia about its own axis is $2\,\mathrm{kg\,m^2}$ and it reaches full rate in $0.2\,\mathrm{s}$?
:::

::: answer
Output torque is $h_0\dot{\delta} = 800\times 0.5236 = 419\,\mathrm{N\,m}$. The gimbal motor only has to accelerate the gimbal assembly about its own axis: $\dot{\delta}$ goes from $0$ to $0.5236\,\mathrm{rad/s}$ in $0.2\,\mathrm{s}$, an acceleration of $2.62\,\mathrm{rad/s^2}$, so the motor torque is $2\times 2.62 = 5.24\,\mathrm{N\,m}$ plus friction. That is the amplification: about $80$ newton-metres out per newton-metre in. It is not free energy — the reaction torque on the gimbal bearings from the rotor's momentum is carried by the structure, not by the motor — but from the controller's point of view a small actuator commands a very large torque.
:::

::: check
Why can a CMG cluster be singular at half of its rated momentum, and why is that worse than being singular when full?
:::

::: answer
Each unit's momentum is confined to a circle in the plane perpendicular to its own gimbal axis, so the total momentum is a sum of four constrained vectors, and there are many gimbal combinations that give the same total. At some of those combinations the four derivative vectors $\partial\mathbf{h}/\partial\delta_i$ happen to be coplanar even though the total momentum is modest — for the pyramid, $(0^\circ, 90^\circ, 0^\circ, 90^\circ)$ gives $\lVert\mathbf{h}\rVert = 1.633\,h_0$ against an envelope of $3.266\,h_0$, with no torque available about $y$. Being singular when full is honest and expected: the array is out of capacity and the only remedy is desaturation. Being singular at half capacity is a trap the steering law walked into while there was still plenty of capacity left, and it can happen in the middle of a manoeuvre with no warning to the attitude controller.
:::

::: check
Your CMG steering law uses a singularity-robust inverse with a fixed $\lambda$. During a fast slew the vehicle falls behind its commanded profile, and the log shows $m$ dropping to $0.02$ at the same moment. Explain what happened and name two changes that would help.
:::

::: answer
The cluster approached an internal singularity. The robust inverse did its job and kept the gimbal rates finite, but its price is a torque error in exactly the direction the singular geometry could not supply, so the vehicle got a fraction of the commanded torque and lagged. A fixed $\lambda$ makes that trade continuously, even far from singularities where it is not needed. Two changes help: add **null motion**, steering the gimbals toward higher $m$ before the manoeuvre needs the lost direction; and make $\lambda$ *adaptive*, scaling it with $m$ so it vanishes when the cluster is healthy. A third, if the same singular surface keeps appearing, is to re-plan the momentum trajectory around it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \sum_k I_{w,k}\Omega_k\hat{\mathbf{a}}_k$ | Total system momentum; conserved with no external torque |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}) = \mathbf{M}_{\mathrm{ext}}$ | Equations of motion with wheels; control torque is $-\dot{\mathbf{h}}$ |
| Slew sizing | $t = 2\sqrt{I\Delta\vartheta/M}$, peak momentum $\sqrt{IM\Delta\vartheta}$; a standing rate needs $I\omega$ held |
| Saturation | Wheel at maximum speed; secular disturbance $M$ fills capacity $h_{\max}$ in $h_{\max}/M$ |
| Desaturation | Magnetorquers ($\mathbf{m}\times\mathbf{B}$, no torque along $\mathbf{B}$, slow), thrusters (fast, propellant), environmental (free, very slow, needs a biased attitude) |
| $\lVert\mathbf{M}\rVert = h_0\lvert\dot{\delta}\rvert$ | CMG output torque; a torque amplifier |
| $\dot{\mathbf{h}} = \mathbf{A}(\boldsymbol{\delta})\dot{\boldsymbol{\delta}}$ | CMG cluster Jacobian, $3\times N$ |
| $m = \sqrt{\det(\mathbf{A}\mathbf{A}^\top)}$ | Singularity measure; zero at a singularity |
| Pyramid, $\beta = 54.74^\circ$ | Envelope $3.266\,h_0$ along $z$; internal singularity at $1.633\,h_0$ with no torque about $y$ |
| Steering laws | Pseudo-inverse (blows up), robust inverse (bounded rates, torque error), null motion (escapes hyperbolic singularities only) |

Wheels and CMGs complete the actuator picture: momentum is exchanged internally for free and removed externally at a price, and the geometry of the exchange is what limits a CMG cluster. Everything so far has assumed the vehicle carrying these actuators is rigid. The last lesson of the module removes that assumption, and shows what flexible appendages and liquid propellant do to the plant model a controller is designed against.
