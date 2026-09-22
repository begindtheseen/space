---
id: l05-external-disturbance-torques
title: External torques — gravity gradient, aerodynamic, SRP and magnetic
minutes: 22
covers:
  - 'external torques: gravity gradient, aerodynamic, solar radiation pressure, residual magnetic dipole'
---

The previous lesson left $\mathbf{M}$ as a symbol. In orbit it is never zero. Four environmental torques act on every spacecraft whether or not anyone commands them: the gravity field is not uniform across the vehicle, the residual atmosphere pushes on it, sunlight pushes on it, and whatever magnetic moment the electronics leave behind is dragged around by the geomagnetic field. Each is small — micronewton-metres to millinewton-metres — and each acts continuously for years.

That combination is what makes them a design driver rather than a footnote. A torque of $2\times 10^{-4}\,\mathrm{N\,m}$ is nothing to a thruster; multiplied by a 92-minute orbit it is $1.1\,\mathrm{N\,m\,s}$ of angular momentum that a reaction wheel must absorb, and multiplied by a day it is $17\,\mathrm{N\,m\,s}$, which is more than many small-satellite wheels can hold. Sizing the momentum storage, sizing the momentum dumping, and deciding how much propellant the mission spends on attitude control all start from these four numbers.

This lesson gives you each torque's model, its typical magnitude, and how it scales with orbit. Carry away the ranking, not the decimals: gravity gradient and aerodynamics dominate in low Earth orbit, solar radiation pressure dominates at geostationary altitude, and the magnetic torque is the one you can fight back with.

Throughout, one vehicle is used for scale: a $500\,\mathrm{kg}$ Earth-observing bus with principal inertias $\mathbf{I} = \mathrm{diag}(900,\, 1200,\, 1500)\,\mathrm{kg\,m^2}$, a projected area of $6\,\mathrm{m^2}$, a centre of pressure $0.2\,\mathrm{m}$ from the centre of mass, and a residual magnetic dipole of $0.5\,\mathrm{A\,m^2}$.

## Gravity gradient

The near side of a spacecraft is closer to the Earth than the far side, so it is pulled harder. The net force acts through a point slightly below the centre of mass, and that offset is a torque. The effect is tiny per kilogram and matters because the lever arms are metres and the vehicle never gets away from it.

Derive it. Let $\mathbf{R}$ be the position of the centre of mass, $R = \lVert\mathbf{R}\rVert$, $\hat{\mathbf{r}} = \mathbf{R}/R$, and let $\mathbf{r}'$ locate a mass element relative to the centre of mass. The gravitational force on $\rho\,dV$ is $-\mu\rho\,dV\,(\mathbf{R} + \mathbf{r}')/\lVert\mathbf{R} + \mathbf{r}'\rVert^3$. Expand the denominator to first order in $r'/R$:

$$
\lVert\mathbf{R} + \mathbf{r}'\rVert^{-3} \approx R^{-3}\left(1 - \frac{3\,\hat{\mathbf{r}}\cdot\mathbf{r}'}{R}\right),
$$

so the force element is $-\dfrac{\mu\rho\,dV}{R^3}\bigl[\mathbf{R} + \mathbf{r}' - 3\hat{\mathbf{r}}(\hat{\mathbf{r}}\cdot\mathbf{r}')\bigr]$ to first order. Take the torque about the centre of mass, $\mathbf{M} = \int\mathbf{r}'\times d\mathbf{F}$. The $\mathbf{R}$ term integrates to $\bigl(\int\rho\mathbf{r}'\,dV\bigr)\times\mathbf{R} = \mathbf{0}$ by the definition of the centre of mass, and $\mathbf{r}'\times\mathbf{r}' = \mathbf{0}$. Only the third term survives:

$$
\mathbf{M} = \frac{3\mu}{R^3}\int\rho\,(\hat{\mathbf{r}}\cdot\mathbf{r}')\,(\mathbf{r}'\times\hat{\mathbf{r}})\,dV
= \frac{3\mu}{R^3}\bigl(\mathbf{J}\hat{\mathbf{r}}\bigr)\times\hat{\mathbf{r}},
$$

where $\mathbf{J} = \int\rho\,\mathbf{r}'\mathbf{r}'^\top dV$ is the second-moment matrix. It relates to the inertia tensor by $\mathbf{I} = \mathrm{tr}(\mathbf{J})\mathbf{1} - \mathbf{J}$, so $\mathbf{J} = \tfrac{1}{2}\mathrm{tr}(\mathbf{I})\mathbf{1} - \mathbf{I}$. The scalar multiple of $\hat{\mathbf{r}}$ crosses with $\hat{\mathbf{r}}$ to zero, leaving

$$
\mathbf{M}_{gg} = \frac{3\mu}{R^3}\,\bigl(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}\bigr) = 3n^2\,\bigl(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}\bigr),
$$

using the mean motion $n = \sqrt{\mu/R^3}$ for a circular orbit. Everything is in body axes: $\hat{\mathbf{r}}$ is the nadir direction written in body components.

::: key Gravity gradient torque
$\mathbf{M}_{gg} = (3\mu/r^3)(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}) = 3n^2(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}})$, with $\hat{\mathbf{r}}$ the nadir direction in body axes. It vanishes when a principal axis points at nadir, because $\mathbf{I}\hat{\mathbf{r}}$ is then parallel to $\hat{\mathbf{r}}$ and the cross product is zero. Scaling as $1/r^3$, it dominates the disturbance budget in low orbit and is negligible at GEO.
:::

For a principal-axis body with nadir at an angle $\alpha$ from body axis 3, in the 1–3 plane, the torque has a single component

$$
M_2 = 3n^2\cdot\tfrac{1}{2}\,(I_1 - I_3)\sin 2\alpha ,
$$

which is the form to keep in your head: proportional to the *difference* of two principal moments, to $\sin 2\alpha$, and to $n^2$.

### Gravity-gradient stabilisation

Set $\alpha$ small and the torque is linear: $M \approx 3n^2(I_x - I_z)\,\theta$ where $z$ is the nadir axis, $x$ the in-track axis and $\theta$ the pitch displacement. Work through the sign and the pitch equation becomes

$$
\ddot{\theta} + \frac{3n^2(I_x - I_z)}{I_y}\,\theta = 0,
$$

an oscillator when $I_x > I_z$ and a divergence otherwise. Stability therefore requires the nadir-pointing axis to have the **smallest** moment of inertia — which is why gravity-gradient satellites deploy a long boom straight down. The libration frequency is $\omega_p = n\sqrt{3(I_x - I_z)/I_y}$, a little faster than orbit rate, and it is undamped: gravity gradient supplies the spring and nothing supplies the dashpot, so these vehicles carry a hysteresis rod or a fluid damper.

::: example Gravity gradient on the bus, at 400 km and at GEO
At $400\,\mathrm{km}$, $r = 6778\,\mathrm{km}$ and $n = \sqrt{\mu/r^3} = 1.1314\times 10^{-3}\,\mathrm{rad/s}$ — an orbit of $92.6$ minutes — so $3n^2 = 3.840\times 10^{-6}\,\mathrm{s^{-2}}$.

Hold the bus $5^\circ$ off nadir with body axis 3 nearest nadir. Then $\hat{\mathbf{r}} = (0.0872,\, 0,\, 0.9962)$, $\mathbf{I}\hat{\mathbf{r}} = (78.4,\, 0,\, 1494.3)$ and

$$
\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}} = \bigl(0,\ (0.9962)(78.4) - (0.0872)(1494.3),\ 0\bigr) = (0,\, -52.1,\, 0)\,\mathrm{kg\,m^2},
$$

matching $\tfrac{1}{2}(I_1 - I_3)\sin 10^\circ = \tfrac{1}{2}(-600)(0.1736) = -52.1$. The torque is $3.840\times 10^{-6} \times 52.1 = 2.00\times 10^{-4}\,\mathrm{N\,m}$. At $30^\circ$ off nadir the same formula gives $259.8\,\mathrm{kg\,m^2}$ and $9.98\times 10^{-4}\,\mathrm{N\,m}$ — five times larger for six times the angle, because $\sin 2\alpha$ is bending over.

At geostationary altitude, $r = 42\,164\,\mathrm{km}$ and $3\mu/r^3 = 1.595\times 10^{-8}\,\mathrm{s^{-2}}$, a factor of 241 smaller. The same $5^\circ$ offset gives $8.31\times 10^{-7}\,\mathrm{N\,m}$, and the $30^\circ$ offset $4.14\times 10^{-6}\,\mathrm{N\,m}$. Gravity gradient has stopped being the leading disturbance.

If instead the bus were configured for gravity-gradient stabilisation with its smallest moment, $I = 900\,\mathrm{kg\,m^2}$, along nadir, the in-track axis carrying $1500$ and the orbit normal $1200$, the pitch libration frequency would be $\omega_p = n\sqrt{3(1500-900)/1200} = 1.2247\,n = 1.386\times 10^{-3}\,\mathrm{rad/s}$, a period of $75.6$ minutes against an orbit of $92.6$.
:::

## Aerodynamic torque

Above about $150\,\mathrm{km}$ the flow is free-molecular: the mean free path is far larger than the vehicle, molecules arrive, hit once, and leave without colliding with each other. The drag force is

$$
\mathbf{F}_{a} = -\tfrac{1}{2}\rho\,v_{rel}^2\,C_D\,A\,\hat{\mathbf{v}}_{rel},
$$

with $\rho$ the atmospheric density, $v_{rel}$ the speed relative to the *air*, $A$ the area projected along the flow, and $C_D$ a drag coefficient that in free-molecular flow runs about $2.0$ to $2.4$ — larger than the familiar continuum values because momentum is transferred once per molecule with little recovery. The torque follows from the offset between the centre of pressure and the centre of mass:

$$
\mathbf{M}_a = (\mathbf{r}_{cp} - \mathbf{r}_{cm})\times\mathbf{F}_a .
$$

Two practical points. The air co-rotates with the Earth, so $\mathbf{v}_{rel}$ is not the inertial velocity: at $400\,\mathrm{km}$ over the equator the co-rotation speed is $\omega_\oplus r = 7.292\times 10^{-5} \times 6.778\times 10^6 = 494\,\mathrm{m/s}$, about $6.4\,\%$ of the $7669\,\mathrm{m/s}$ orbital speed, which for a retrograde or high-inclination orbit swings the flow direction by several degrees. And the density is the least certain number in the whole disturbance model: at $400\,\mathrm{km}$ it ranges from roughly $1\times 10^{-12}$ to $1\times 10^{-11}\,\mathrm{kg/m^3}$ across the solar cycle and from day to night. A factor of ten in $\rho$ is a factor of ten in the torque.

## Solar radiation pressure

Photons carry momentum. The solar irradiance at $1\,\mathrm{AU}$ is $S = 1361\,\mathrm{W/m^2}$, and dividing by the speed of light gives the pressure exerted on a perfectly absorbing surface facing the Sun:

$$
P_{SRP} = \frac{S}{c} = \frac{1361}{2.998\times 10^8} = 4.54\times 10^{-6}\,\mathrm{N/m^2}.
$$

A reflecting surface turns the photons around and receives up to twice that, so for a surface at normal incidence

$$
F_{SRP} \approx P_{SRP}\,A\,(1 + q),
$$

with $q$ the reflectivity between 0 for a black absorber and 1 for a perfect specular mirror; $q \approx 0.5$ is a reasonable default for a real multi-layer-insulated bus with solar cells. As with aerodynamics, the force becomes a torque through the offset between the centre of pressure — now the optical one — and the centre of mass.

Solar radiation pressure has one feature the others do not: it does not depend on altitude at all. The same $4.54\times 10^{-6}\,\mathrm{N/m^2}$ acts at $400\,\mathrm{km}$ and at GEO and out past Mars, falling only as the inverse square of the distance from the *Sun*. That is why it rises to the top of the list as soon as the atmosphere and the gravity gradient fade.

::: key Solar radiation pressure
$P_{SRP} = S/c \approx 4.5\times 10^{-6}\,\mathrm{N/m^2}$ at 1 AU. The force is about $P_{SRP}A(1 + q)$ with $q$ the reflectivity, and it becomes a torque through the offset between the centre of pressure and the centre of mass. It is independent of altitude, so it dominates the disturbance budget at GEO.
:::

## Residual magnetic dipole

Current loops in the harness, magnetised structure and permanent magnets in motors leave a spacecraft with a net magnetic dipole moment $\mathbf{m}$, measured in $\mathrm{A\,m^2}$. In the geomagnetic field $\mathbf{B}$ it experiences

$$
\mathbf{M}_{mag} = \mathbf{m}\times\mathbf{B}.
$$

A tilted-dipole model of the Earth's field is enough for sizing: the magnitude at radius $r$ and magnetic latitude $\lambda_m$ is

$$
\lVert\mathbf{B}\rVert = \frac{B_0 R_\oplus^3}{r^3}\sqrt{1 + 3\sin^2\lambda_m},
\qquad B_0 \approx 3.12\times 10^{-5}\,\mathrm{T},
$$

so the field is twice as strong over the poles as over the equator at the same radius, and it falls as $1/r^3$. At $400\,\mathrm{km}$ that is $2.6\times 10^{-5}\,\mathrm{T}$ at the equator and $5.2\times 10^{-5}\,\mathrm{T}$ at the pole; at GEO it is $1.1\times 10^{-7}\,\mathrm{T}$, a factor of 240 weaker.

The same physics runs in reverse as an actuator. A **magnetorquer** is a coil that commands $\mathbf{m}$ deliberately, typically $1$ to $100\,\mathrm{A\,m^2}$, and it is the standard way to bleed accumulated momentum out of reaction wheels in low orbit — no propellant, no moving parts.

::: key Magnetic torque, and why it cannot do everything
$\mathbf{M} = \mathbf{m}\times\mathbf{B}$, for a residual dipole and for a magnetorquer alike. The torque is always perpendicular to $\mathbf{B}$, so no magnetic actuator can produce any torque about the local field direction. Magnetic-only control is instantaneously underactuated and becomes controllable only because orbital motion swings $\mathbf{B}$ around over an orbit.
:::

::: example The disturbance budget, LEO and GEO
The bus: $A = 6\,\mathrm{m^2}$, $\mathbf{r}_{cp} - \mathbf{r}_{cm} = 0.2\,\mathrm{m}$, $C_D = 2.2$, $q = 0.5$, residual dipole $0.5\,\mathrm{A\,m^2}$, held $5^\circ$ off nadir.

**At 400 km.** Dynamic pressure $\tfrac{1}{2}\rho v^2 = \tfrac{1}{2}(2.8\times 10^{-12})(7669)^2 = 8.23\times 10^{-5}\,\mathrm{Pa}$; drag force $8.23\times 10^{-5}\times 2.2\times 6 = 1.09\times 10^{-3}\,\mathrm{N}$; torque $2.17\times 10^{-4}\,\mathrm{N\,m}$. Solar radiation force $4.54\times 10^{-6}\times 6\times 1.5 = 4.09\times 10^{-5}\,\mathrm{N}$; torque $8.17\times 10^{-6}\,\mathrm{N\,m}$. Magnetic torque $0.5 \times 2.6\times 10^{-5} = 1.30\times 10^{-5}\,\mathrm{N\,m}$ at the equator, twice that over a pole.

| Torque | 400 km | GEO |
| --- | --- | --- |
| Gravity gradient, $5^\circ$ off nadir | $2.00\times 10^{-4}$ | $8.3\times 10^{-7}$ |
| Aerodynamic | $2.17\times 10^{-4}$ | negligible |
| Solar radiation pressure | $8.2\times 10^{-6}$ | $8.2\times 10^{-6}$ |
| Residual dipole, $0.5\,\mathrm{A\,m^2}$ | $1.3$ to $2.6\times 10^{-5}$ | $5.4\times 10^{-8}$ |

All in $\mathrm{N\,m}$. In LEO the first two are comparable and an order of magnitude above the rest; the aerodynamic figure alone swings between $7.8\times 10^{-5}$ and $7.8\times 10^{-4}$ as the density moves over the solar cycle. At GEO solar radiation pressure is ten times the gravity gradient and a hundred times the magnetic torque, and a real communications satellite with $60\,\mathrm{m^2}$ of solar array and a metre of centre-of-pressure offset would see a torque some fifty times larger than the bus does.
:::

::: example What the disturbances cost in stored momentum
A torque only matters through its time integral. Take the bus in its $400\,\mathrm{km}$ orbit, and suppose the gravity-gradient torque is *secular* — which it is, if the vehicle holds a fixed attitude relative to the orbit frame, because then $\hat{\mathbf{r}}$ is fixed in body axes and the torque never changes sign.

Per orbit: $2.00\times 10^{-4}\,\mathrm{N\,m} \times 5554\,\mathrm{s} = 1.11\,\mathrm{N\,m\,s}$. The aerodynamic contribution adds a similar $1.21\,\mathrm{N\,m\,s}$ if it too is secular. With $15.56$ orbits per day, gravity gradient alone delivers $17.3\,\mathrm{N\,m\,s}$ per day.

That number decides the design. A small reaction wheel storing $0.1\,\mathrm{N\,m\,s}$ saturates in eight minutes; a $1\,\mathrm{N\,m\,s}$ wheel lasts most of an orbit; a $20\,\mathrm{N\,m\,s}$ wheel lasts a day. So the vehicle needs either large wheels or a momentum dump several times per orbit.

Magnetorquers can supply it. A $10\,\mathrm{A\,m^2}$ coil in the $2.6\times 10^{-5}\,\mathrm{T}$ equatorial field produces $2.6\times 10^{-4}\,\mathrm{N\,m}$ — slightly more than the gravity-gradient torque it has to cancel, and twice that near the poles. The margin is thin but real, and it is exactly how small Earth-observing satellites are flown. At GEO the same coil would produce $1.1\times 10^{-6}\,\mathrm{N\,m}$, far below the solar-pressure torque, which is why GEO satellites dump momentum with thrusters instead.

If the attitude is held inertially rather than to the orbit frame, the gravity-gradient torque reverses twice per orbit and its secular part nearly cancels, leaving a much smaller net accumulation and a cyclic swing the wheels ride out. Whether a disturbance is secular or cyclic can matter more than its magnitude.
:::

::: warning The gravity gradient torque is not a force
$\mathbf{M}_{gg}$ is the moment about the centre of mass of a field that is very slightly non-uniform. The net gravitational *force* on the vehicle is, to the same order, $-\mu m\hat{\mathbf{r}}/r^2$ acting at the centre of mass, and it does what it always does: it holds the orbit. Adding a "gravity gradient force" to the translational equations double-counts. The torque and the orbit are separate consequences of the same expansion.
:::

::: warning Centres of pressure move
The aerodynamic centre of pressure depends on the attitude, because the projected area and its centroid do. The optical centre of pressure depends on the Sun direction and on how the arrays are articulated. And the centre of mass moves as propellant is consumed — on a GEO satellite by tens of centimetres over fifteen years. A disturbance model with a fixed $\mathbf{r}_{cp} - \mathbf{r}_{cm}$ is a first cut; a flight model carries the offset as a function of attitude, Sun angle and tank state, and the attitude system estimates the residual on orbit.
:::

::: note What is left out
Four torques, not all of them. Thermal re-radiation from a hot side, Earth albedo and infrared pressure, outgassing, and — for anything with a boom or an antenna — structural flexing all contribute at the $10^{-7}$ to $10^{-6}\,\mathrm{N\,m}$ level. They matter for missions that need arcsecond stability over years, and for precision orbit determination, where an unmodelled $10^{-9}\,\mathrm{m/s^2}$ acceleration is a real error. For momentum budgeting the four above carry the weight.
:::

## Check yourself

::: check
A spacecraft has $\mathbf{I} = \mathrm{diag}(400, 400, 80)\,\mathrm{kg\,m^2}$ and flies at $600\,\mathrm{km}$. Compute the gravity gradient torque with nadir $20^\circ$ from the body 3 axis, and say whether pointing axis 3 at nadir would be a stable configuration.
:::

::: answer
At $600\,\mathrm{km}$, $r = 6978\,\mathrm{km}$ and $3\mu/r^3 = 3 \times 3.986\times 10^{14}/(6.978\times 10^6)^3 = 3.519\times 10^{-6}\,\mathrm{s^{-2}}$.

With nadir in the 1–3 plane at $\alpha = 20^\circ$, $M_2 = 3n^2\cdot\tfrac{1}{2}(I_1 - I_3)\sin 2\alpha = 3.519\times 10^{-6} \times \tfrac{1}{2}(400 - 80)(0.6428) = 3.62\times 10^{-4}\,\mathrm{N\,m}$.

Pointing axis 3 at nadir is stable in pitch, since axis 3 carries the smallest moment ($80$ against $400$ in track): the requirement $I_x > I_z$ is met with a large margin. The libration frequency is $\omega_p = n\sqrt{3(400-80)/400} = 1.549\,n$. Note the shape this implies — one axis with a fifth the inertia of the other two is a long thin boom, which is exactly what gravity-gradient satellites look like.
:::

::: check
Why can a set of three orthogonal magnetorquers not hold a spacecraft's attitude at an instant, and why does it work over an orbit?
:::

::: answer
Whatever dipole $\mathbf{m}$ the three coils produce, the torque is $\mathbf{m}\times\mathbf{B}$, which is perpendicular to $\mathbf{B}$ by the definition of a cross product. The component of any desired torque along $\mathbf{B}$ is unachievable: the achievable set is a two-dimensional plane, not all of three-space. At any instant the system is underactuated, and one rotational degree of freedom has no control authority at all.

Over an orbit the geomagnetic field direction in the body frame sweeps out a large arc — for an inclined orbit it rotates roughly twice per orbit as the vehicle crosses the magnetic equator and poles — so the unachievable direction moves. A torque that could not be produced now can be produced twenty minutes from now. The system is controllable in the time-varying sense, which is why magnetic control works but is slow, and why its performance degrades in near-equatorial orbits where $\mathbf{B}$ moves least.
:::

::: check
A GEO communications satellite has $40\,\mathrm{m^2}$ of solar array with reflectivity $q = 0.4$, and the array's centre of pressure is $1.5\,\mathrm{m}$ from the centre of mass along the yaw axis. Estimate the solar radiation torque and the momentum it delivers in a day.
:::

::: answer
Force: $F = P_{SRP}A(1+q) = 4.54\times 10^{-6} \times 40 \times 1.4 = 2.54\times 10^{-4}\,\mathrm{N}$.

Torque: $M = 2.54\times 10^{-4} \times 1.5 = 3.81\times 10^{-4}\,\mathrm{N\,m}$.

Over a day, if the torque is secular, $3.81\times 10^{-4} \times 86400 = 32.9\,\mathrm{N\,m\,s}$. That is a large number — comparable to the total capacity of a substantial momentum wheel — and it is the reason GEO satellites are designed to make the offset small, why some deliberately trim it with an asymmetric "solar sail" flap, and why their momentum management runs on thrusters. In reality the torque is partly cyclic as the vehicle yaws through the day, so the secular residue is smaller, but it is the residue that sizes the system.
:::

::: check
The aerodynamic torque on a LEO satellite is quoted as $2\times 10^{-4}\,\mathrm{N\,m}$. What is the single largest source of uncertainty in that number, and by how much could it be wrong?
:::

::: answer
Atmospheric density. At $400\,\mathrm{km}$ it varies from about $1\times 10^{-12}$ to $1\times 10^{-11}\,\mathrm{kg/m^3}$ over the eleven-year solar cycle, with further day–night and geomagnetic-storm variation on top, and even the best models carry a residual error of some tens of per cent at a given time. A quoted torque can therefore be wrong by a factor of ten, and the direction of the error is known in advance only if you know where in the solar cycle the mission will fly.

The drag coefficient contributes perhaps $\pm 10\,\%$, the projected area a similar amount as the attitude changes, and the centre-of-pressure offset rather more if the vehicle has not been characterised. None of these competes with the density. Practically: size the momentum system for solar maximum, and treat the disturbance estimate as a range rather than a value.
:::

::: check
Two spacecraft carry the same disturbance torque of $1\times 10^{-4}\,\mathrm{N\,m}$. On the first it is fixed in body axes; on the second it reverses sign twice per $5554\,\mathrm{s}$ orbit. Compare the wheel momentum each accumulates in a day.
:::

::: answer
The first is secular: $1\times 10^{-4} \times 86400 = 8.64\,\mathrm{N\,m\,s}$ per day, growing without bound until something dumps it.

The second is cyclic. Model it as $M(t) = M_0\sin(2\pi t/T)$ with $T = 5554\,\mathrm{s}$; the wheel momentum is the integral, $h(t) = (M_0T/2\pi)\bigl(1 - \cos(2\pi t/T)\bigr)$, which oscillates between $0$ and $2M_0T/2\pi = M_0T/\pi = 1\times 10^{-4}\times 5554/\pi = 0.177\,\mathrm{N\,m\,s}$ and never accumulates. A wheel with a fraction of a newton-metre-second of capacity handles it forever.

A factor of fifty in the required storage, from the same torque magnitude. This is why the momentum budget is always written as a secular part plus a cyclic amplitude, and why an attitude profile that turns a secular disturbance into a cyclic one — yaw steering on a GEO satellite, for instance — is worth designing for.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M}_{gg} = (3\mu/r^3)(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}) = 3n^2(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}})$ | Gravity gradient; zero when a principal axis is at nadir |
| $M_2 = \tfrac{3}{2}n^2(I_1 - I_3)\sin 2\alpha$ | Single-plane form; $2.0\times 10^{-4}\,\mathrm{N\,m}$ for the bus at $5^\circ$, $400\,\mathrm{km}$ |
| $\omega_p = n\sqrt{3(I_x - I_z)/I_y}$ | Gravity-gradient pitch libration; stable only if the nadir axis has the least inertia |
| $\mathbf{F}_a = -\tfrac{1}{2}\rho v_{rel}^2 C_D A\hat{\mathbf{v}}_{rel}$ | Free-molecular drag, $C_D \approx 2.0$ to $2.4$; torque through $\mathbf{r}_{cp} - \mathbf{r}_{cm}$ |
| $\rho$ at $400\,\mathrm{km}$ | $10^{-12}$ to $10^{-11}\,\mathrm{kg/m^3}$; the dominant uncertainty |
| $P_{SRP} = S/c = 4.54\times 10^{-6}\,\mathrm{N/m^2}$ | Solar radiation pressure at 1 AU; $F \approx P_{SRP}A(1+q)$ |
| $\mathbf{M}_{mag} = \mathbf{m}\times\mathbf{B}$ | Always perpendicular to $\mathbf{B}$; no torque about the field direction |
| $\lVert\mathbf{B}\rVert = (B_0R_\oplus^3/r^3)\sqrt{1 + 3\sin^2\lambda_m}$ | $B_0 \approx 3.12\times 10^{-5}\,\mathrm{T}$; $2.6\times 10^{-5}\,\mathrm{T}$ at $400\,\mathrm{km}$, $1.1\times 10^{-7}$ at GEO |
| Ranking | LEO: gravity gradient and drag lead. GEO: solar radiation pressure leads |
| Momentum cost | $2\times 10^{-4}\,\mathrm{N\,m}$ secular is $1.1\,\mathrm{N\,m\,s}$ per orbit, $17\,\mathrm{N\,m\,s}$ per day |

The next lesson gives the vehicle something to absorb that momentum with. Reaction wheels and control moment gyros exchange angular momentum with the body rather than adding it, which changes the equations of motion and changes what "conservation" means in a simulation.
