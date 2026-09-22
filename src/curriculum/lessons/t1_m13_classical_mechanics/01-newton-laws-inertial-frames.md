---
id: l01-newton-laws-inertial-frames
title: Newton's laws and inertial frames
minutes: 21
covers:
  - Newton laws and inertial frames
---

Every equation of motion you will ever integrate on a flight computer — a launch trajectory, an orbit, a docking approach, an attitude manoeuvre — is Newton's second law written in some frame, for some collection of matter, under some list of forces. Getting those three choices right is most of the work. Getting them wrong produces code that runs, looks plausible, and lands the vehicle a few hundred kilometres from where it should be.

This lesson sets the three choices up carefully. You know the laws already; what you may not have thought hard about is the fine print. The second law holds for a *fixed* collection of matter, which matters enormously for a rocket that throws away most of its mass. It holds only in an *inertial* frame, which forces you to decide whether the Earth-centred inertial (ECI) frame your simulator uses is inertial enough. And the accelerometer in an inertial measurement unit (IMU) does not measure acceleration, which surprises everyone the first time.

On a real vehicle these ideas are not abstractions. When a Falcon 9 leaves the pad, about 7.6 MN of thrust act on a vehicle of about 559 t, and the guidance computer's first job is to decide what its accelerometers are telling it about that. We will compute exactly what they should read.

## Particles and their kinematics

A **particle** is a body whose size does not matter for the question being asked. A 70 m launch vehicle is a particle when you are asking where its centre of mass is going; it is emphatically not a particle when you are asking whether it will tip over. Later in this module you will see why the particle idealisation is exact for the translational motion of the centre of mass of any body at all — that is the content of the centre-of-mass theorem in lesson 5.

The position of a particle relative to some origin is a vector $\mathbf{r}(t)$. Its velocity and acceleration are the first and second time derivatives,

$$
\mathbf{v} = \dot{\mathbf{r}} = \frac{d\mathbf{r}}{dt}, \qquad \mathbf{a} = \dot{\mathbf{v}} = \ddot{\mathbf{r}}.
$$

One thing is buried in this notation: "the derivative" only means something once you have said which frame's axes you hold fixed while differentiating, because a vector that is constant in a rotating frame has a nonzero derivative in a non-rotating one. The conversion rule (the transport theorem) belongs to a later module. In this module every derivative is taken in an inertial frame unless stated otherwise.

## Newton's three laws

**First law.** There exist frames of reference in which a particle subject to no net force moves in a straight line at constant velocity. Such frames are called **inertial**. Read this way, the first law is not a special case of the second; it is the statement that inertial frames exist, and it tells you how to test whether the frame you are using is one of them.

**Second law.** In an inertial frame, the net force on a fixed collection of matter equals the rate of change of its momentum:

$$
\mathbf{F} = \frac{d\mathbf{p}}{dt}, \qquad \mathbf{p} = m\mathbf{v}.
$$

When the mass is constant this reduces to the familiar $\mathbf{F} = m\mathbf{a}$. The phrase "fixed collection of matter" is fine print most textbooks skip. A rocket is not a fixed collection of matter: the vehicle at time $t + dt$ contains less matter than the vehicle at time $t$, because propellant has left through the nozzle. Applying $\mathbf{F} = d\mathbf{p}/dt$ to "the vehicle" alone is therefore not allowed, and doing it anyway gives an answer that depends on which observer you ask — a sure sign of a mistake. Lesson 6 does the rocket properly.

**Third law.** If body A exerts a force $\mathbf{F}_{AB}$ on body B, then B exerts $-\mathbf{F}_{AB}$ on A. The pair acts on *different* bodies, so it never cancels on a single body — but such pairs cancel when you add up all the forces inside a system, which is why the centre of mass of a tumbling, sloshing spacecraft still follows a clean trajectory (lesson 5).

### Units and magnitudes

The SI unit of force is the newton, $1\,\mathrm{N} = 1\,\mathrm{kg\,m/s^2}$. A mental scale of the forces on a vehicle:

- a single ion thruster: about $0.1$–$0.5\,\mathrm{N}$;
- a reaction-control thruster: tens to hundreds of newtons;
- the weight of a 1 kg mass in low Earth orbit at 400 km: about $8.68\,\mathrm{N}$ (not zero — we will come back to this);
- one Merlin 1D engine at sea level: about $845\,\mathrm{kN}$;
- nine of them at liftoff: about $7.6\,\mathrm{MN}$.

Weight is a force; mass is not. A vehicle's mass is the same on the pad and in orbit; its weight $m g$ falls by about 11 % between the surface and 400 km, because $g$ does. Standard gravity, $g_0 = 9.80665\,\mathrm{m/s^2}$, is a defined constant used to convert between mass and weight and to define specific impulse; it is not the local $g$ anywhere in particular.

## What makes a frame inertial

An inertial frame is one in which the first law holds: a free particle moves at constant velocity. Equivalently, the frame is neither rotating nor accelerating relative to the fixed stars. Two consequences follow.

First, if one frame is inertial then any frame moving at constant velocity relative to it is also inertial. If frame $B$ moves at constant $\mathbf{u}$ relative to inertial frame $A$, positions and velocities transform as

$$
\mathbf{r}_B = \mathbf{r}_A - \mathbf{u}\,t, \qquad \mathbf{v}_B = \mathbf{v}_A - \mathbf{u}, \qquad \mathbf{a}_B = \mathbf{a}_A,
$$

so the acceleration — and with it $\mathbf{F} = m\mathbf{a}$ — is the same in both. This is the Galilean transformation. Newton's laws cannot tell you which inertial frame is "really at rest", and do not need to. Note, though, that *velocity* is frame-dependent even between inertial frames. Any formula containing a bare velocity, rather than a velocity difference or a derivative, is suspect — remember this at the rocket-equation trap in lesson 6.

Second, an accelerating or rotating frame is not inertial: a free particle observed from one appears to accelerate. Engineers describe the apparent acceleration with fictitious forces (centrifugal, Coriolis, Euler) — bookkeeping for having picked a non-inertial frame, not interactions with anything. You will derive them in the rotating-frames module; here you only need to know when they are big enough to matter.

### Is the laboratory inertial?

A frame fixed to the Earth's surface rotates once per sidereal day, with angular rate $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$. A particle at rest on the equator is carried in a circle of radius $R_E = 6378\,\mathrm{km}$, which requires a centripetal acceleration

$$
\omega_E^2 R_E = (7.2921 \times 10^{-5})^2 \times 6.378 \times 10^{6} \approx 0.0339\,\mathrm{m/s^2},
$$

about 0.35 % of $g$ — a small correction for a pendulum experiment. For an object at orbital speed it is not small: the Coriolis acceleration of something moving at $7.7\,\mathrm{km/s}$ relative to the rotating Earth is $2\omega_E v \approx 2 \times 7.2921 \times 10^{-5} \times 7700 \approx 1.12\,\mathrm{m/s^2}$, more than a tenth of $g$. Integrate an orbit in an Earth-fixed frame without those terms and it is wrong within seconds. The Earth-centred Earth-fixed (ECEF) frame is the natural place to express a ground station's position and a poor place to write Newton's second law.

### Is ECI inertial?

The Earth-centred inertial frame has its origin at the Earth's centre of mass and axes that do not rotate relative to distant stars. It does not rotate, so no centrifugal or Coriolis terms appear. But its origin accelerates: the Earth falls around the Sun. Is that acceleration a problem?

The Sun's gravitational parameter is $\mu_\odot = 1.327 \times 10^{20}\,\mathrm{m^3/s^2}$ and the Earth is about $1.496 \times 10^{11}\,\mathrm{m}$ away, so the Earth's centre accelerates toward the Sun at

$$
a_\odot = \frac{\mu_\odot}{r^2} = \frac{1.327 \times 10^{20}}{(1.496 \times 10^{11})^2} \approx 5.93 \times 10^{-3}\,\mathrm{m/s^2}.
$$

That is roughly 0.07 % of the $8.68\,\mathrm{m/s^2}$ that Earth's own gravity exerts at 400 km. Small, but not negligible for precision work — except that it almost entirely cancels. A satellite near the Earth is pulled toward the Sun by almost exactly the same $5.93\,\mathrm{mm/s^2}$ as the Earth's centre is, so *relative to the Earth's centre* the satellite feels only the difference between the two pulls: the solar tidal acceleration. Across one Earth radius that difference is about $2\mu_\odot R_E / r^3 \approx 5 \times 10^{-7}\,\mathrm{m/s^2}$, four orders of magnitude below the Sun's direct pull and seven below Earth's gravity. The Moon's tidal term is about twice as large, still tiny.

So ECI is inertial to excellent approximation for launch and orbit work: its origin accelerates, but everything you are tracking shares that acceleration, and what remains is a tidal perturbation you add as a small force when accuracy demands it. For interplanetary trajectories the picture changes: far from Earth, the Sun's pull on the spacecraft and on the Earth are no longer nearly equal, and the right inertial frame is centred on the Sun or the solar-system barycentre, with the planets' gravity added as forces. The rule is general — choose the frame whose origin's acceleration is shared by everything in the problem, and treat whatever is left as a force.

::: key
A frame is inertial when a free particle moves in a straight line at constant speed in it — it is non-rotating and unaccelerated. ECI is inertial to excellent approximation for launch and orbit work, though it does orbit the Sun, which matters for interplanetary dynamics. ECEF is not inertial: it rotates at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$.
:::

::: example Is ECI good enough for a LEO propagator?
A propagator for a 400 km orbit is required to hold position to 10 m over one orbit of about 5,550 s. Should it model the Sun's pull on the satellite, and if so, how?

Earth's gravity at $r = 6778\,\mathrm{km}$ is $\mu_E / r^2 = 3.986 \times 10^{14} / (6.778 \times 10^6)^2 \approx 8.68\,\mathrm{m/s^2}$. The Sun's direct pull is about $5.93 \times 10^{-3}\,\mathrm{m/s^2}$. If that direct pull acted on the satellite alone it would displace it by roughly $\tfrac{1}{2} a t^2 = 0.5 \times 5.93 \times 10^{-3} \times 5550^2 \approx 9.1 \times 10^{4}\,\mathrm{m}$ over one orbit — 91 km, wildly outside the requirement.

But the propagator works in ECI, whose origin is *also* falling toward the Sun at $5.93\,\mathrm{mm/s^2}$. Relative to that origin the satellite experiences only the tidal difference, about $5 \times 10^{-7}\,\mathrm{m/s^2}$, and the same crude estimate gives $0.5 \times 5 \times 10^{-7} \times 5550^2 \approx 7.7\,\mathrm{m}$ — within the requirement, barely, with the Moon's tide about twice as large again. So: ECI is the right frame, the Sun's direct pull must *not* be added as a force (the choice of origin has absorbed it), and the lunar and solar tidal terms go in as small perturbing forces if 10 m is a hard requirement.
:::

## The forces you will meet

Writing the second law for a vehicle means listing every force acting on it. In this module the list is short.

**Gravity.** Newton's law of gravitation says a point mass $M$ attracts a particle of mass $m$ at position $\mathbf{r}$ (measured from $M$) with

$$
\mathbf{F}_g = -\frac{G M m}{r^2}\,\hat{\mathbf{r}} = -\frac{\mu m}{r^3}\,\mathbf{r},
$$

where $\mu = GM$ is the **gravitational parameter** of the attracting body and $\hat{\mathbf{r}} = \mathbf{r}/r$. For Earth, $\mu_E = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, known to about ten significant figures — far better than $G$ and $M$ separately, which is why orbital mechanics never separates them. Near the surface, $\mu_E / R_E^2 \approx 9.80\,\mathrm{m/s^2}$, and we write $\mathbf{F}_g = m\mathbf{g}$ with $\mathbf{g}$ pointing down. A spherically symmetric body attracts as if all its mass were at its centre; the Earth's oblateness and other departures from symmetry are perturbations for a later module.

**Thrust.** The force a rocket engine produces. In this lesson it is a given vector $\mathbf{T}$ of known magnitude and direction. Where it comes from — the momentum of the exhaust and a pressure term at the nozzle exit — is lesson 6.

**Aerodynamic forces.** Drag opposes the velocity relative to the air; lift is perpendicular to it. Both scale with dynamic pressure $\bar{q} = \tfrac{1}{2}\rho v^2$. Lesson 7 uses drag; the atmospheric-flight module treats lift.

**Contact and constraint forces.** The pad holds the vehicle up; a gimbal bearing holds an engine on; a tank wall holds propellant in. These forces are whatever they must be to enforce a geometric constraint, which makes them awkward in Newtonian mechanics and is the reason Lagrangian mechanics exists (lessons 8 and 9).

A **free-body diagram** is a sketch of one body with every force acting *on it* drawn as an arrow — and nothing else; forces the body exerts on other things do not appear. Keep the discipline even when the "diagram" is a comment above a function: it is the list of terms on the right-hand side of your equation of motion, and a missing or doubled term there is the most common dynamics bug there is.

## What an accelerometer measures

An accelerometer is a proof mass on a spring inside a case. When the case accelerates, the spring supplies whatever force carries the proof mass along — except that gravity acts on the proof mass directly, without going through the spring. The second law for the proof mass in an inertial frame reads

$$
\mathbf{F}_{\mathrm{spring}} + m\mathbf{g} = m\mathbf{a} \quad \Rightarrow \quad \mathbf{f} \equiv \frac{\mathbf{F}_{\mathrm{spring}}}{m} = \mathbf{a} - \mathbf{g}.
$$

The quantity $\mathbf{f}$, the non-gravitational acceleration, is called **specific force**, and it is what the instrument reads. Three cases make the point.

- Sitting on the pad: $\mathbf{a} = 0$, so $\mathbf{f} = -\mathbf{g}$, which is $9.81\,\mathrm{m/s^2}$ *upward*. A stationary accelerometer reads one $g$ up.
- In free fall or in orbit: gravity is the only force, so $\mathbf{a} = \mathbf{g}$ and $\mathbf{f} = 0$. The instrument reads zero although gravity at 400 km is 88 % of its surface value. "Zero g" in orbit means zero specific force, not zero gravity.
- Under thrust: $\mathbf{f} = \mathbf{T}/m$ (plus aerodynamic forces over mass). The instrument reads thrust acceleration, not the vehicle's acceleration.

An inertial navigation system therefore integrates $\mathbf{a} = \mathbf{f} + \mathbf{g}(\mathbf{r})$, adding back a gravity model at the estimated position. Forget the gravity model and a stationary IMU believes it is accelerating upward at one $g$.

::: example What the IMU reads at liftoff
A Falcon-class vehicle lifts off with thrust $T \approx 7.6\,\mathrm{MN}$ and mass $m_0 \approx 559\,\mathrm{t}$. Ignore drag (the vehicle is barely moving). What is its acceleration, and what does a body-mounted accelerometer read along the vehicle axis?

Newton's second law along the vertical, with up positive:

$$
m_0 a = T - m_0 g \quad \Rightarrow \quad a = \frac{T}{m_0} - g = \frac{7.6 \times 10^6}{5.59 \times 10^5} - 9.81 \approx 13.60 - 9.81 \approx 3.79\,\mathrm{m/s^2}.
$$

The thrust-to-weight ratio is $T/(m_0 g_0) \approx 1.39$: the engines lift the vehicle with 39 % to spare. At constant $a$ the vehicle would clear a 100 m tower in $\sqrt{2 \times 100 / 3.79} \approx 7.3\,\mathrm{s}$ — in reality slightly sooner, because mass is falling at about $2.75\,\mathrm{t/s}$.

The accelerometer reads specific force $f = a - g = 3.79 - (-9.81) = 13.60\,\mathrm{m/s^2}$, which is exactly $T/m_0$, about $1.39\,g$. The instrument cannot see gravity; it sees only the thrust. The navigation computer must add its own gravity model to recover the true $3.79\,\mathrm{m/s^2}$.
:::

::: warning
$\mathbf{F} = m\mathbf{a}$ needs three things to be true at once: an inertial frame, a fixed collection of matter, and *every* force on that matter in $\mathbf{F}$. The three classic failures are writing it in a rotating frame without the Coriolis and centrifugal terms, applying it to a vehicle that is losing mass, and leaving a constraint force off the free-body diagram because "it does no work". Each produces an equation that looks fine and integrates to nonsense.
:::

## Newton's second law as an ODE

For a particle of constant mass under known forces, the second law is a system of first-order ordinary differential equations for the **state** $\mathbf{x} = (\mathbf{r}, \mathbf{v})$:

$$
\frac{d}{dt}\begin{pmatrix} \mathbf{r} \\ \mathbf{v} \end{pmatrix}
=
\begin{pmatrix} \mathbf{v} \\ \mathbf{F}(\mathbf{r}, \mathbf{v}, t)/m \end{pmatrix}.
$$

This is the form every propagator integrates: six numbers and a force model fix the future, which is why orbital state vectors have six components. For gravity alone the right-hand side is $\mathbf{F}/m = -\mu \mathbf{r}/r^3$, independent of the mass — all bodies fall alike.

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
# [-8.67603586  0.          0.        ]   -> 8.68 m/s^2 toward the origin
```

The number in the comment is the $8.68\,\mathrm{m/s^2}$ computed by hand above. A right-hand-side function like this, with a free-body list in its docstring and units on every line, is the atom from which every simulation in this curriculum is built. When mass varies, the frame rotates, or the body has extent, the right-hand side grows — the next eight lessons are about how.

## Check yourself

::: check
A colleague proposes integrating a low-Earth-orbit trajectory in the ECEF frame "because the ground stations are in ECEF anyway". What is wrong with $\mathbf{F} = m\mathbf{a}$ written directly in that frame, and roughly how large is the error term for a satellite at $7.7\,\mathrm{km/s}$?
:::

::: answer
ECEF rotates at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$, so it is not inertial: a free particle does not move in a straight line in it. Writing $\mathbf{F} = m\mathbf{a}$ with only the real forces omits the Coriolis and centrifugal accelerations. The Coriolis term is of order $2\omega_E v = 2 \times 7.29 \times 10^{-5} \times 7700 \approx 1.12\,\mathrm{m/s^2}$, about 13 % of gravity at that altitude, so the orbit is badly wrong within a minute. Integrate in ECI and rotate the result into ECEF whenever a ground-station quantity is needed.
:::

::: check
The Earth's centre accelerates toward the Sun at about $5.9\,\mathrm{mm/s^2}$. Why is it nevertheless acceptable to treat ECI as inertial for a LEO satellite, and when does this stop being acceptable?
:::

::: answer
The satellite is pulled toward the Sun by almost exactly the same $5.9\,\mathrm{mm/s^2}$ as the Earth's centre, because it is at almost the same distance from the Sun. Relative to the Earth's centre only the difference — the solar tidal acceleration, roughly $5 \times 10^{-7}\,\mathrm{m/s^2}$ across one Earth radius — survives, seven orders of magnitude below Earth's own gravity. The approximation fails on interplanetary trajectories, where the two solar pulls are no longer nearly equal; there a Sun-centred or barycentric frame is inertial and the planets' pulls become forces.
:::

::: check
A vehicle in a 400 km circular orbit carries an accelerometer. Gravity there is $8.68\,\mathrm{m/s^2}$. What does the accelerometer read, and what does that tell you about how an inertial navigation system must use its output?
:::

::: answer
It reads zero. The accelerometer measures specific force $\mathbf{f} = \mathbf{a} - \mathbf{g}$, and in orbit gravity is the only force, so $\mathbf{a} = \mathbf{g}$ and $\mathbf{f} = 0$. The proof mass and the case fall together and the spring is unloaded. A navigation system therefore cannot integrate accelerometer output directly; it must add a gravity model evaluated at its estimated position, $\mathbf{a} = \mathbf{f} + \mathbf{g}(\mathbf{r})$, and any error in that model integrates into a position error.
:::

::: check
State Newton's second law in the form that this module insists on, and say which two conditions must hold for it to apply. Why does the phrasing matter for a rocket?
:::

::: answer
$\mathbf{F}_{\mathrm{ext}} = d\mathbf{p}/dt$, the net external force equals the rate of change of momentum, applied in an inertial frame to a fixed collection of matter. For a rocket the collection of matter called "the vehicle" changes from instant to instant as propellant leaves, so the law cannot be applied to the vehicle alone; it must be applied to the vehicle *plus* the propellant that leaves during $dt$, and the momentum that propellant carries away is what appears as thrust. Lesson 6 carries this out.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}, \mathbf{v} = \dot{\mathbf{r}}, \mathbf{a} = \ddot{\mathbf{r}}$ | position, velocity, acceleration of a particle, differentiated in an inertial frame |
| $\mathbf{F} = d\mathbf{p}/dt$, $\mathbf{p} = m\mathbf{v}$ | second law, for a fixed collection of matter in an inertial frame; $\mathbf{F} = m\mathbf{a}$ when $m$ is constant |
| inertial frame | a free particle moves in a straight line at constant speed; non-rotating and unaccelerated |
| ECI | inertial to excellent approximation for launch and orbit work; orbits the Sun, which matters for interplanetary dynamics |
| ECEF | rotates at $\omega_E = 7.29 \times 10^{-5}\,\mathrm{rad/s}$; centripetal $0.034\,\mathrm{m/s^2}$ at the equator, Coriolis $\approx 1.1\,\mathrm{m/s^2}$ at orbital speed |
| $\mathbf{F}_g = -\mu m \mathbf{r}/r^3$ | Newtonian gravity; $\mu_E = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ |
| $g_0 = 9.80665\,\mathrm{m/s^2}$ | standard gravity, a defined constant |
| $\mathbf{f} = \mathbf{a} - \mathbf{g}$ | specific force, what an accelerometer reads: $-\mathbf{g}$ on the pad, $0$ in orbit, $\mathbf{T}/m$ under thrust |

The next lesson takes the momentum form of the second law seriously: it defines impulse, shows why total impulse per unit propellant weight is the figure of merit for an engine, and introduces the angular momentum of a particle and the torque that changes it.
