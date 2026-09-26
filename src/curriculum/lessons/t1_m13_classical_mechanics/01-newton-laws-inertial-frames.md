---
id: l01-newton-laws-inertial-frames
title: Newton's laws and inertial frames
minutes: 22
covers:
  - Newton laws and inertial frames
---

You are standing in a bus. The driver brakes hard and you lurch forward. Nothing pushed you: the bus slowed and you kept going. That lurch holds most of this lesson: Newton's laws, and the fine print about *where you stand* when you use them.

Every equation of motion a flight computer integrates — a launch, an orbit, a docking — is Newton's second law written in some frame, for some chunk of matter, with some list of forces. Getting those three choices right is most of the work. Getting them wrong gives code that runs, looks fine, and puts the vehicle hundreds of kilometers off.

You know the laws already. This lesson is about the fine print. The second law holds only for a *fixed* chunk of matter — a big deal for a rocket that throws most of its mass away. It holds only in an *inertial* frame. And an accelerometer does not measure acceleration, which surprises everyone the first time. We will work out exactly what a Falcon 9's accelerometers read as it leaves the pad.

## Particles and their motion

On a flight-tracker map, a jumbo jet is a single dot. A **particle** is a body whose size does not matter for the question you are asking. A 70 m rocket is a particle when you ask where its center of mass is going, but not when you ask whether it will tip over. Lesson 5 shows the particle picture is exact for the motion of any body's center of mass.

The **position** of a particle, measured from some starting point (the **origin**), is a vector $\mathbf{r}(t)$ — read "r of t", an arrow from the origin to the particle at time $t$. Bold letters are vectors: they have a size and a direction. The **velocity** is how fast position changes, and the **acceleration** is how fast velocity changes:

$$
\mathbf{v} = \dot{\mathbf{r}} = \frac{d\mathbf{r}}{dt}, \qquad \mathbf{a} = \dot{\mathbf{v}} = \ddot{\mathbf{r}}.
$$

A dot over a letter means "rate of change with time". Read $\dot{\mathbf{r}}$ as "r dot" and $\ddot{\mathbf{r}}$ as "r double-dot".

One thing hides here. A rate of change depends on whose axes you hold still: an arrow painted on a merry-go-round looks fixed to a rider but turns for someone on the ground. A later module converts between views; here every derivative is taken in an inertial frame.

## Newton's three laws

**First law.** A hockey puck slid across smooth ice keeps going straight at nearly the same speed, because almost nothing pushes on it. Precisely: there exist frames of reference in which a particle with no net force on it moves in a straight line at constant velocity. Such frames are called **inertial**. So the first law is not a special case of the second. It says inertial frames exist, and gives you a test for yours.

**Second law.** Push an empty shopping cart and it speeds up quickly. Load it with groceries and the same push does less. In an inertial frame, the net force on a fixed chunk of matter equals the rate of change of its **momentum** — mass times velocity:

$$
\mathbf{F} = \frac{d\mathbf{p}}{dt}, \qquad \mathbf{p} = m\mathbf{v}.
$$

When the mass does not change, this becomes the familiar $\mathbf{F} = m\mathbf{a}$.

The words "fixed chunk of matter" are **[[fine print|fixed-collection]]** most books skip. A rocket at time $t + dt$ (a tiny moment later) holds less matter than at time $t$, because propellant has left through the nozzle. So you may not apply $\mathbf{F} = d\mathbf{p}/dt$ to "the rocket" alone. Do it anyway and your answer depends on who is watching — a sure sign of a mistake. Lesson 6 does the rocket properly.

::: key
Newton's second law in the form that survives variable mass: $\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$, applied to a *fixed* system of matter, in an inertial frame. $\mathbf{F} = m\mathbf{a}$ is the special case of constant mass.
:::

**Third law.** Push a friend while standing on a skateboard and you roll backward. If body A pushes on body B with force $\mathbf{F}_{AB}$, then B pushes on A with $-\mathbf{F}_{AB}$: the same size, the opposite direction. The two forces act on *different* bodies, so they never cancel on one body. But add up all the forces inside a system and the pairs do cancel. That is why the center of mass of a tumbling, sloshing spacecraft still follows a clean path (lesson 5).

### Units and sizes

The unit of force is the **newton**: $1\,\mathrm{N} = 1\,\mathrm{kg\,m/s^2}$, the push that speeds up one kilogram by one meter per second every second. An apple weighs about one newton. On vehicles:

- one ion thruster: about $0.1$–$0.5\,\mathrm{N}$;
- one reaction-control thruster (a small steering jet): tens to hundreds of newtons;
- the weight of 1 kg in orbit at 400 km: about $8.68\,\mathrm{N}$ — not zero, and we will come back to this;
- one Merlin 1D engine at sea level: about $845\,\mathrm{kN}$;
- nine of them at liftoff: about $7.6\,\mathrm{MN}$ (meganewtons, millions of newtons).

**Weight** is a force; **mass** is not. Mass is how much stuff there is, the same on the pad and in orbit. Weight is $m g$, gravity's pull on it, and it falls by about 11 % between the ground and 400 km, because $g$ does. **Standard gravity**, $g_0 = 9.80665\,\mathrm{m/s^2}$ (read "g nought"), is a defined constant used to turn mass into weight and to define specific impulse (next lesson). It is not the local $g$ at any particular place.

## What makes a frame inertial

Back on the bus. When it brakes, a coffee cup on the seat slides forward. To someone on the sidewalk, nothing strange happened: the cup kept going while the bus slowed. To you, the cup sped up with no push at all. The first law fails, so your frame — the bus — is not inertial.

An **inertial frame** is one where the first law holds: a free particle moves at constant velocity. Equivalently, the frame is neither rotating nor accelerating compared with the distant stars. Two things follow.

First, if one frame is inertial, any frame gliding past it at constant velocity is inertial too. Say frame $B$ moves at a constant velocity $\mathbf{u}$ relative to inertial frame $A$. Positions, velocities and accelerations convert like this:

$$
\mathbf{r}_B = \mathbf{r}_A - \mathbf{u}\,t, \qquad \mathbf{v}_B = \mathbf{v}_A - \mathbf{u}, \qquad \mathbf{a}_B = \mathbf{a}_A.
$$

The acceleration is the same in both frames, so $\mathbf{F} = m\mathbf{a}$ is too. This is the **[[Galilean transformation|galileo-ship]]**. Newton's laws cannot tell which inertial frame is "really at rest", and do not need to. But *velocity* does change between frames. So be suspicious of any formula with a bare velocity in it, rather than a velocity difference or a rate of change — the trap of lesson 6.

Second, an accelerating or rotating frame is not inertial: a free particle seen from it seems to accelerate. Engineers patch this with **fictitious forces** (centrifugal, Coriolis, Euler) — bookkeeping for a non-inertial frame, not pushes from anything real. The rotating-frames module derives them. Here you only need to know when they matter.

### Is the ground inertial?

The ground spins with the Earth once per **[[sidereal day|sidereal-day]]**, at angular rate $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ (read "omega sub E"). A point on the equator rides a circle of radius $R_E = 6378\,\mathrm{km}$. Staying on a circle takes a sideways (**centripetal**) acceleration of $\omega^2 R$:

$$
\omega_E^2 R_E = (7.2921 \times 10^{-5})^2 \times 6.378 \times 10^{6} \approx 0.0339\,\mathrm{m/s^2}.
$$

That is about 0.35 % of $g$ — small for a pendulum experiment.

At orbital speed it is not small. The Coriolis acceleration is about $2\omega_E v$; at $7.7\,\mathrm{km/s}$ that is $2 \times 7.2921 \times 10^{-5} \times 7700 \approx 1.12\,\mathrm{m/s^2}$, more than a tenth of $g$. Leave those terms out of an Earth-fixed orbit integration and it goes wrong within seconds. The **Earth-centered, Earth-fixed (ECEF)** frame, which turns with the Earth, is the natural place to say where a ground station is — and a poor place to write Newton's second law.

### Is ECI inertial?

The **[[Earth-centered inertial (ECI)|eci-ecef]]** frame has its origin at the Earth's center of mass and axes that do not turn relative to the distant stars, so no centrifugal or Coriolis terms. But its origin accelerates, because the Earth falls around the Sun. Does that matter?

The Sun's **gravitational parameter** (defined below) is $\mu_\odot = 1.327 \times 10^{20}\,\mathrm{m^3/s^2}$, and the Earth is about $1.496 \times 10^{11}\,\mathrm{m}$ away. So the Earth's center accelerates toward the Sun at

$$
a_\odot = \frac{\mu_\odot}{r^2} = \frac{1.327 \times 10^{20}}{(1.496 \times 10^{11})^2} \approx 5.93 \times 10^{-3}\,\mathrm{m/s^2}.
$$

That is about 0.07 % of Earth's gravity at 400 km. Small, but not small enough for precise work — except that it almost entirely cancels.

Picture two kids side by side on the same falling elevator. Relative to each other, they do not fall at all. A satellite near the Earth is pulled toward the Sun by almost exactly the same $5.93\,\mathrm{mm/s^2}$ as the Earth's center is. So *relative to the Earth's center*, the satellite feels only the small difference between the two pulls: the **[[solar tidal acceleration|tidal-picture]]**. Across one Earth radius that difference is about $2\mu_\odot R_E / r^3 \approx 5 \times 10^{-7}\,\mathrm{m/s^2}$. That is about ten thousand times below the Sun's direct pull and ten million times below Earth's gravity. The Moon's tidal pull is about twice as big — still tiny.

So ECI is inertial to excellent approximation for launch and orbit work. Its origin accelerates, but everything you track shares that acceleration, and the leftover is a small tidal force you add when accuracy demands it. Interplanetary flight is different. Far from Earth, the Sun pulls on the spacecraft and on the Earth quite differently, so the inertial frame is centered on the Sun or on the solar system's balance point (the **barycenter**), with the planets' gravity added as forces. The rule: pick the frame whose origin's acceleration everything in the problem shares, and treat what is left as a force.

::: key
A frame is inertial when a free particle moves in a straight line at constant speed in it — it is non-rotating and unaccelerated. ECI is inertial to excellent approximation for launch and orbit work, though it does orbit the Sun, which matters for interplanetary dynamics. ECEF is not inertial: it rotates at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$.
:::

::: example Is ECI good enough for a LEO propagator?
A **propagator** is a program that predicts where a satellite will be. One for a 400 km low Earth orbit (LEO) must hold position to 10 m over one lap of about 5,550 s. Should it model the Sun's pull?

**Earth's pull.** At $r = 6778\,\mathrm{km}$, gravity is $\mu_E / r^2 = 3.986 \times 10^{14} / (6.778 \times 10^6)^2 \approx 8.68\,\mathrm{m/s^2}$.

**The Sun's direct pull,** about $5.93 \times 10^{-3}\,\mathrm{m/s^2}$, if it acted on the satellite alone. A steady acceleration $a$ moves something $\tfrac{1}{2} a t^2$ in time $t$, so over one orbit that is $0.5 \times 5.93 \times 10^{-3} \times 5550^2 \approx 9.1 \times 10^{4}\,\mathrm{m}$. That is 91 km, far outside the 10 m budget.

**What ECI actually sees.** ECI's origin is *also* falling toward the Sun at $5.93\,\mathrm{mm/s^2}$. Relative to it, the satellite feels only the tidal difference, about $5 \times 10^{-7}\,\mathrm{m/s^2}$. The same rough estimate gives $0.5 \times 5 \times 10^{-7} \times 5550^2 \approx 7.7\,\mathrm{m}$.

**Sanity check.** 7.7 m is inside the budget, but only just, and the Moon's tide is about twice as big. So ECI is the right frame, and the Sun's direct pull must *not* be added as a force — the choice of origin already soaked it up. The solar and lunar tidal terms go in as small extra forces if 10 m is a hard requirement.
:::

## The forces you will meet

Writing the second law means listing every force on the vehicle. Here the list is short.

**Gravity.** A point mass $M$ pulls a particle of mass $m$ at position $\mathbf{r}$ (measured from $M$) with

$$
\mathbf{F}_g = -\frac{G M m}{r^2}\,\hat{\mathbf{r}} = -\frac{\mu m}{r^3}\,\mathbf{r}.
$$

Here $G$ is the universal gravitational constant, $r$ the distance, and $\hat{\mathbf{r}} = \mathbf{r}/r$ (read "r hat") an arrow of length one pointing from $M$ to the particle; the minus sign points the force back toward $M$. The product $\mu = GM$ (read "mu") is the **[[gravitational parameter|mu-precision]]** of the attracting body. For Earth, $\mu_E = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$. Near the surface $\mu_E / R_E^2 \approx 9.80\,\mathrm{m/s^2}$; we write $\mathbf{F}_g = m\mathbf{g}$ with $\mathbf{g}$ pointing down. A round, evenly layered body pulls as if all its mass sat at its center; the Earth's slight flattening is a later module's correction.

**Thrust.** The engine's push, here a given vector $\mathbf{T}$. Where it comes from — exhaust momentum plus a pressure term at the nozzle exit — is lesson 6.

**Aerodynamic forces.** **Drag** pushes back against the velocity relative to the air. **Lift** pushes at right angles to it. Both grow with the **[[dynamic pressure|dynamic-pressure]]** $\bar{q} = \tfrac{1}{2}\rho v^2$ (read "q bar"), where $\rho$ ("rho") is air density. Lesson 7 uses drag; the atmospheric-flight module covers lift.

**Contact and constraint forces.** The pad holds the rocket up; a tank wall holds propellant in. These forces are whatever they must be to keep a geometric rule true. That makes them awkward in Newton's approach, and it is why Lagrangian mechanics exists (lessons 8 and 9).

A **[[free-body diagram|free-body]]** is a sketch of one body with every force acting *on it* drawn as an arrow — and nothing else. Keep the habit even in a code comment. It is the list of terms in your equation of motion, and a missing or doubled term there is the most common dynamics bug there is.

## What an accelerometer measures

Stand on a bathroom scale in an elevator. As it starts up, the scale reads more; as it starts down, less. If the cable snapped, the scale would read zero while you fell. The scale never measures gravity. It measures how hard the floor pushes on you.

An **[[accelerometer|accelerometer-inside]]** works the same way: a small **proof mass** on a spring inside a case. When the case accelerates, the spring drags the proof mass along. But gravity pulls on the proof mass directly, not through the spring. Newton's second law for the proof mass, in an inertial frame:

$$
\mathbf{F}_{\mathrm{spring}} + m\mathbf{g} = m\mathbf{a} \quad \Rightarrow \quad \mathbf{f} \equiv \frac{\mathbf{F}_{\mathrm{spring}}}{m} = \mathbf{a} - \mathbf{g}.
$$

We subtracted $m\mathbf{g}$ from both sides and divided by $m$ (the symbol $\equiv$ means "is defined as"). The quantity $\mathbf{f}$ — the acceleration from everything *except* gravity — is called **specific force**, and it is what the instrument reads. Three cases:

- **On the pad:** $\mathbf{a} = 0$, so $\mathbf{f} = -\mathbf{g}$. Gravity points down, so $-\mathbf{g}$ is $9.81\,\mathrm{m/s^2}$ *upward*. A resting accelerometer reads one $g$ up.
- **In free fall or in orbit:** gravity is the only force, so $\mathbf{a} = \mathbf{g}$ and $\mathbf{f} = 0$. The instrument reads zero, even though gravity at 400 km is 88 % of its surface value. **[["Zero g"|zero-g]]** in orbit means zero specific force, not zero gravity.
- **Under thrust:** $\mathbf{f} = \mathbf{T}/m$ (plus aerodynamic forces divided by mass). It reads the thrust's acceleration, not the vehicle's.

So a navigation system works out the true acceleration as $\mathbf{a} = \mathbf{f} + \mathbf{g}(\mathbf{r})$, adding back a gravity model at its estimated position. Forget it and a resting sensor believes it is accelerating upward at one $g$.

::: example What the IMU reads at liftoff
An **inertial measurement unit (IMU)** is the box of accelerometers and gyroscopes a vehicle navigates by. A Falcon-class rocket lifts off with thrust $T \approx 7.6\,\mathrm{MN}$ and mass $m_0 \approx 559\,\mathrm{t}$ (559,000 kg). Ignore drag. What is its acceleration, and what does an accelerometer along its axis read?

**Second law, up positive.** Thrust pushes up, weight pulls down:

$$
m_0 a = T - m_0 g \quad \Rightarrow \quad a = \frac{T}{m_0} - g = \frac{7.6 \times 10^6}{5.59 \times 10^5} - 9.81 \approx 13.60 - 9.81 \approx 3.79\,\mathrm{m/s^2}.
$$

We divided both sides by $m_0$, then subtracted $g$ from $T/m_0$.

**How much to spare.** The **thrust-to-weight ratio** is $T/(m_0 g_0) = 7.6 \times 10^6 / (5.59 \times 10^5 \times 9.80665) \approx 1.39$: 39 % more push than weight. At a steady $3.79\,\mathrm{m/s^2}$ it would clear a 100 m tower in $\sqrt{2 \times 100 / 3.79} \approx 7.3\,\mathrm{s}$ — really a bit sooner, because it sheds about $2.75\,\mathrm{t/s}$ of propellant and speeds up as it lightens.

**The accelerometer.** It reads specific force: $f = a - g = 3.79 - (-9.81) = 13.60\,\mathrm{m/s^2}$. (With up positive, $g$ is $-9.81$.) That is exactly $T/m_0$, about $1.39\,g$.

**Sanity check.** The reading beats the true acceleration by exactly one $g$, just like the pad case. The instrument sees only thrust; the navigation computer must add its gravity model to recover the true $3.79\,\mathrm{m/s^2}$.
:::

::: warning
$\mathbf{F} = m\mathbf{a}$ needs three things true at once: an inertial frame, a fixed chunk of matter, and *every* force on that matter included in $\mathbf{F}$. The classic failures: a rotating frame without the Coriolis and centrifugal terms; a vehicle that is losing mass; a constraint force left off the free-body diagram because "it does no work". Each gives an equation that looks fine and integrates to nonsense.
:::

## Newton's second law as a computer program

A computer steps first-order equations forward in time easily, so we split the second law into two first-order pieces: position changes at the rate $\mathbf{v}$, and velocity changes at the rate $\mathbf{F}/m$. Together, position and velocity make the **state** $\mathbf{x} = (\mathbf{r}, \mathbf{v})$:

$$
\frac{d}{dt}\begin{pmatrix} \mathbf{r} \\ \mathbf{v} \end{pmatrix}
=
\begin{pmatrix} \mathbf{v} \\ \mathbf{F}(\mathbf{r}, \mathbf{v}, t)/m \end{pmatrix}.
$$

This is the form every propagator integrates. **[[Six numbers|six-numbers]]** — three for position, three for velocity — plus a force model fix the whole future. For gravity alone the right-hand side is $\mathbf{F}/m = -\mu \mathbf{r}/r^3$, with no $m$ in it: all bodies fall alike.

```python
import numpy as np

MU_E = 3.986004418e14  # m^3/s^2

def two_body_rhs(t, x):
    """State x = [rx, ry, rz, vx, vy, vz] in ECI; returns dx/dt."""
    r = x[:3]
    v = x[3:]
    a = -MU_E * r / np.linalg.norm(r) ** 3
    return np.concatenate([v, a])

x0 = np.array([6778e3, 0.0, 0.0, 0.0, 7669.0, 0.0])
print(two_body_rhs(0.0, x0)[3:])
# [-8.67630173 -0.         -0.        ]   -> 8.68 m/s^2 toward the origin
```

The output is the $8.68\,\mathrm{m/s^2}$ we worked out by hand. A function like this — a free-body list in its docstring, units on every line — is the building block of every simulation in this course. When mass varies, the frame rotates, or the body has size, it grows. The next eight lessons are about how.

## Check yourself

::: check
A colleague wants to integrate a low-Earth-orbit path in the ECEF frame "because the ground stations are in ECEF anyway". What is wrong with writing $\mathbf{F} = m\mathbf{a}$ directly in that frame, and roughly how big is the error for a satellite moving at $7.7\,\mathrm{km/s}$?
:::

::: answer
ECEF turns with the Earth at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$, so it is not inertial. Writing $\mathbf{F} = m\mathbf{a}$ with only the real forces leaves out the Coriolis and centrifugal accelerations.

The Coriolis term is about $2\omega_E v = 2 \times 7.29 \times 10^{-5} \times 7700 \approx 1.12\,\mathrm{m/s^2}$. That is about 13 % of gravity at that height, so the orbit is badly wrong within a minute. Instead, integrate in ECI and rotate into ECEF for ground-station quantities.
:::

::: check
The Earth's center accelerates toward the Sun at about $5.9\,\mathrm{mm/s^2}$. Why is it still fine to treat ECI as inertial for a satellite in low orbit, and when does this stop being fine?
:::

::: answer
The satellite is almost exactly as far from the Sun as the Earth's center, so it is pulled toward the Sun by almost the same $5.9\,\mathrm{mm/s^2}$. Relative to the Earth's center, only the difference survives: the solar tidal acceleration, roughly $5 \times 10^{-7}\,\mathrm{m/s^2}$ across one Earth radius. That is seven orders of magnitude below Earth's own gravity.

It stops being fine on interplanetary trajectories, where the Sun's pulls on the spacecraft and on the Earth are no longer nearly equal. There a Sun-centered or barycentric frame is the inertial one, and the planets' pulls become forces.
:::

::: check
A vehicle in a 400 km circular orbit carries an accelerometer. Gravity there is $8.68\,\mathrm{m/s^2}$. What does the accelerometer read, and what does that tell you about how a navigation system must use it?
:::

::: answer
It reads zero. An accelerometer measures specific force, $\mathbf{f} = \mathbf{a} - \mathbf{g}$. In orbit gravity is the only force, so $\mathbf{a} = \mathbf{g}$ and $\mathbf{f} = 0$. The proof mass and the case fall together, and the spring is not stretched at all.

So a navigation system cannot integrate the accelerometer output alone. It must add a gravity model at its estimated position, $\mathbf{a} = \mathbf{f} + \mathbf{g}(\mathbf{r})$, and any error in that model grows into a position error.
:::

::: check
State Newton's second law in the form this module insists on, and name the two conditions it needs. Why does the wording matter for a rocket?
:::

::: answer
$\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$: the net external force equals the rate of change of momentum. It must be applied (1) in an inertial frame, (2) to a fixed chunk of matter.

For a rocket, the matter called "the vehicle" changes from moment to moment as propellant leaves, so you cannot apply the law to it alone. You apply it to the vehicle *plus* the propellant that leaves during the small time $dt$. The momentum that propellant carries away is what shows up as thrust. Lesson 6 carries this out.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}, \mathbf{v} = \dot{\mathbf{r}}, \mathbf{a} = \ddot{\mathbf{r}}$ | position, velocity, acceleration of a particle, rates taken in an inertial frame |
| $\mathbf{F} = d\mathbf{p}/dt$, $\mathbf{p} = m\mathbf{v}$ | second law, for a fixed chunk of matter in an inertial frame; $\mathbf{F} = m\mathbf{a}$ when $m$ is constant |
| inertial frame | a free particle moves in a straight line at constant speed; non-rotating and unaccelerated |
| ECI | inertial to excellent approximation for launch and orbit work; orbits the Sun, which matters for interplanetary dynamics |
| ECEF | rotates at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$; centripetal $0.034\,\mathrm{m/s^2}$ at the equator, Coriolis $\approx 1.1\,\mathrm{m/s^2}$ at orbital speed |
| $\mathbf{F}_g = -\mu m \mathbf{r}/r^3$ | Newton's gravity; $\mu_E = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ |
| $g_0 = 9.80665\,\mathrm{m/s^2}$ | standard gravity, a defined constant |
| $\mathbf{f} = \mathbf{a} - \mathbf{g}$ | specific force, what an accelerometer reads: $-\mathbf{g}$ on the pad, $0$ in orbit, $\mathbf{T}/m$ under thrust |

The next lesson takes the momentum form of the second law seriously: impulse, why total impulse per unit of propellant weight grades an engine, and the angular momentum of a particle with the torque that changes it.

::: context fixed-collection Why "the rocket alone" breaks the law
Try it and see. For the rocket alone, $d(m\mathbf{v})/dt = m\,d\mathbf{v}/dt + \mathbf{v}\,dm/dt$. The last term has a bare velocity $\mathbf{v}$ in it. Now watch the same rocket from a frame gliding past at a steady speed. The forces are the same and $d\mathbf{v}/dt$ is the same, but $\mathbf{v}$ is different — so that last term changes. Real physics cannot depend on who is gliding past. The fix is to follow a chunk of matter that does not change: the rocket plus the propellant about to leave. Then the bare velocity drops out, and thrust appears in its place. That is lesson 6.
:::

::: context galileo-ship Galileo's ship
In 1632 Galileo asked readers to imagine a cabin below decks on a ship sailing smoothly at steady speed. Butterflies flutter, drips fall straight into a bottle, a ball tossed to a friend takes the same effort either way. Nothing you do inside can tell you whether the ship is moving or tied up at the dock. That is the idea behind the Galilean transformation: every inertial frame runs the same physics. Only when the ship speeds up, slows down or turns can you feel it — the bus lurch again.
:::

::: context sidereal-day Why not 24 hours?
A normal "solar" day of 24 hours is the time from noon to noon. But while the Earth spins once, it also moves a little way around the Sun, so it must turn a bit extra to bring the Sun back overhead. Measured against the distant stars, one turn takes about 23 h 56 min 4 s, or 86,164 s. That is the **sidereal day** (from the Latin for "star"). Dividing one full turn by it gives the spin rate: $2\pi / 86{,}164 \approx 7.2921 \times 10^{-5}\,\mathrm{rad/s}$.
:::

::: context eci-ecef Two ways to hang axes on the Earth
Both frames have their origin at the Earth's center. ECI's axes point at fixed directions among the stars, so the Earth turns underneath them. ECEF's axes are glued to the Earth — one runs through the point where the equator meets the Greenwich meridian — so they turn with it, once per sidereal day. Engineers integrate orbits in ECI and convert to ECEF to ask "which ground station can see it?"

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="95" r="55" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="95" x2="300" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="306,95 294,89 294,101" fill="#1f2a44"/>
  <line x1="180" y1="95" x2="180" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,14 174,26 186,26" fill="#1f2a44"/>
  <text x="300" y="115" font-size="12" fill="#1f2a44" text-anchor="middle">ECI x (fixed)</text>
  <line x1="180" y1="95" x2="274" y2="41" stroke="#b4232c" stroke-width="2"/>
  <polygon points="279,38 266,39 272,50" fill="#b4232c"/>
  <text x="286" y="34" font-size="12" fill="#b4232c">ECEF x</text>
  <path d="M 250 95 A 70 70 0 0 0 241 60" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="258" y="78" font-size="11" fill="#b4232c">turns</text>
  <text x="180" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">ECEF turns once per sidereal day; ECI does not</text>
</svg>
```
:::

::: context tidal-picture The Sun pulls the near side harder
The Sun's pull weakens with distance, so the side of the Earth facing it is pulled a little harder than the center, and the far side a little less. Take away the center's pull, which everything shares, and what is left stretches things along the Sun line: toward the Sun on the near side, away on the far side. That leftover is the tidal acceleration — the same effect that, from the Moon and Sun together, raises ocean tides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="22" cy="70" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="22" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">Sun</text>
  <circle cx="230" cy="70" r="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2.5">
    <line x1="185" y1="70" x2="137" y2="70"/><line x1="230" y1="76" x2="190" y2="76"/><line x1="275" y1="70" x2="241" y2="70"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="131,70 141,65 141,75"/><polygon points="184,76 194,71 194,81"/><polygon points="235,70 245,65 245,75"/>
  </g>
  <text x="160" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">near: most</text>
  <text x="300" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">far: least</text>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="185" y1="140" x2="165" y2="140"/><line x1="275" y1="140" x2="295" y2="140"/>
  </g>
  <g fill="#b4232c">
    <polygon points="159,140 169,135 169,145"/><polygon points="301,140 291,135 291,145"/>
  </g>
  <circle cx="230" cy="140" r="3" fill="#b4232c"/>
  <text x="230" y="128" font-size="11" fill="#b4232c" text-anchor="middle">minus the center's pull</text>
</svg>
```
:::

::: context mu-precision Why engineers keep G and M glued together
We can measure $\mu_E = GM$ extremely well by tracking satellites: its uncertainty is a few parts in a billion. But $G$ on its own is one of the worst-known constants in physics, measured in delicate lab experiments to only about two parts in a hundred thousand. Splitting $\mu$ into $G$ times $M$ would throw that precision away. So orbital software never does. It uses $\mu$ for the Earth, the Sun, the Moon — each measured directly.
:::

::: context dynamic-pressure Wind on your hand
Stick your hand out of a car window. At twice the speed, the push is about four times as hard, because it grows with speed squared. That push per unit area is the dynamic pressure, $\bar{q} = \tfrac{1}{2}\rho v^2$. On a climbing rocket, speed rises while the air thins, so $\bar{q}$ climbs to a peak — **max-Q** — then falls. Launch vehicles are built and steered around that peak, and lesson 7 comes back to it.
:::

::: context free-body The rocket on the pad, one second after liftoff
Just two forces act on the rocket: thrust up and weight down. The arrows are drawn to scale — about 7.6 MN against about 5.5 MN — so the upward arrow is about 1.39 times longer. The difference, about 2.1 MN, is what speeds the rocket up. The force the exhaust puts on the ground is *not* drawn: it acts on the ground, not the rocket.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="165" y="50" width="30" height="100" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="165,50 180,26 195,50" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="100" r="4" fill="#1f2a44"/>
  <line x1="180" y1="100" x2="180" y2="9" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="180,3 173,15 187,15" fill="#1d6fd1"/>
  <text x="200" y="20" font-size="12" fill="#1d6fd1">thrust T ≈ 7.6 MN</text>
  <line x1="180" y1="100" x2="180" y2="164" stroke="#b4232c" stroke-width="4"/>
  <polygon points="180,170 173,158 187,158" fill="#b4232c"/>
  <text x="200" y="168" font-size="12" fill="#b4232c">weight mg ≈ 5.5 MN</text>
  <text x="60" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">center of mass</text>
  <line x1="108" y1="100" x2="172" y2="100" stroke="#6c7a93" stroke-width="1"/>
</svg>
```
:::

::: context accelerometer-inside Inside an accelerometer
A proof mass hangs on a spring inside a box. On the pad, the spring must hold the mass up against gravity, so it is squeezed — the instrument reads $9.81\,\mathrm{m/s^2}$ up. In orbit, box and mass fall together and the spring rests at its natural length — it reads zero. Real ones are tiny silicon or quartz parts, but the idea is exactly this.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="100" height="110" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="90,130 80,124 100,118 80,112 100,106 90,100" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <rect x="70" y="76" width="40" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">on the pad: squeezed</text>
  <text x="90" y="164" font-size="12" fill="#1d6fd1" text-anchor="middle">reads 1 g up</text>
  <rect x="220" y="20" width="100" height="110" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="270,130 260,122 280,114 260,106 280,98 260,90 280,82 270,74" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <rect x="250" y="50" width="40" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">in orbit: relaxed</text>
  <text x="270" y="164" font-size="12" fill="#1d6fd1" text-anchor="middle">reads 0</text>
</svg>
```
:::

::: context zero-g Why astronauts float
On the International Space Station, about 400 km up, gravity is still about 88 % as strong as on the ground. Astronauts float because they and the station are falling together, all the time — moving sideways so fast that they keep missing the Earth. Nothing pushes on them relative to the station, so they feel nothing. That is why engineers say "microgravity" or "free fall" and why an accelerometer on board reads nearly zero.
:::

::: context six-numbers Six numbers, a whole future
Three position numbers and three velocity numbers are a **state vector**. Given it and the forces, the second law fixes every later moment. The orbital-mechanics module shows you can swap these six for six other numbers — the orbital elements, like the orbit's size, shape and tilt — that describe the same orbit in a way people can picture. Six in, six out: the count never changes.
:::
