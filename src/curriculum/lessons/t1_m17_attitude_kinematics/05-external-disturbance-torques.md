---
id: l05-external-disturbance-torques
title: External torques — gravity gradient, aerodynamic, SRP and magnetic
minutes: 24
covers:
  - 'external torques: gravity gradient, aerodynamic, solar radiation pressure, residual magnetic dipole'
---

Hold a door open with one finger against a gentle breeze. You barely notice it. Now hold it for a whole day. The breeze never tires; your arm does. Small pushes that never stop are a different problem from big pushes that come and go.

The previous lesson left the torque $\mathbf{M}$ as a symbol. In orbit it is never zero. Four **disturbance torques** — twists nobody asked for — act on every spacecraft:

- gravity is not quite the same strength across the vehicle;
- the thin upper atmosphere pushes on it;
- sunlight pushes on it;
- whatever magnetism the electronics leave behind is tugged around by Earth's magnetic field.

Each is tiny, from micronewton-meters to millinewton-meters, and each acts for years. That combination makes them a design driver, not a footnote. A torque of $2\times 10^{-4}\,\mathrm{N\,m}$ is [[nothing to a thruster|how-small]]. But over a 92-minute orbit it adds up to $1.1\,\mathrm{N\,m\,s}$ of angular momentum that a reaction wheel must soak up. Over a day it is $17\,\mathrm{N\,m\,s}$, more than many small-satellite wheels can hold. Sizing the wheels, planning how to empty them, and budgeting attitude-control propellant all start here.

For each torque you get the model, its typical size and how it changes with altitude. Carry away the ranking, not the decimals. Gravity gradient and air drag lead in **low Earth orbit** (LEO, a few hundred kilometers up). Sunlight pressure leads at **geostationary orbit** (GEO, 35 786 km up, where a satellite circles once a day and seems to hang still over one spot). And the magnetic torque is the one you can turn around and use.

One vehicle sets the scale throughout: a $500\,\mathrm{kg}$ Earth-observing bus with principal inertias $\mathbf{I} = \mathrm{diag}(900,\, 1200,\, 1500)\,\mathrm{kg\,m^2}$, a projected area of $6\,\mathrm{m^2}$, a center of pressure $0.2\,\mathrm{m}$ from the center of mass, and a leftover magnetic dipole of $0.5\,\mathrm{A\,m^2}$.

## Gravity gradient

Gravity weakens with distance. The side of a spacecraft nearer the Earth is pulled a little harder than the far side. For a long object that is tilted, the stronger pull on the near end and the weaker pull on the far end do not line up through the center of mass, so they make a **[[twist|tidal-stretch]]**. Per kilogram it is minute. It matters because the lever arms are meters long and the vehicle can never escape it.

The result is:

$$
\mathbf{M}_{gg} = \frac{3\mu}{R^3}\,\bigl(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}\bigr) = 3n^2\,\bigl(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}\bigr).
$$

Read it piece by piece:

- $\mu$ ("mu") is Earth's gravitational parameter, $3.986\times 10^{14}\,\mathrm{m^3/s^2}$;
- $R$ is the distance from Earth's center to the spacecraft;
- $\hat{\mathbf{r}}$ ("r hat") is the unit vector along the Earth–spacecraft line, written in body axes — the direction of **nadir**, straight down (the formula uses $\hat{\mathbf{r}}$ twice, so pointing it up instead gives the same answer);
- $n = \sqrt{\mu/R^3}$ is the **[[mean motion|mean-motion]]**, the orbit's angular rate in radians per second.

The cross product $\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}$ is zero whenever $\mathbf{I}\hat{\mathbf{r}}$ points the same way as $\hat{\mathbf{r}}$. That happens exactly when a **principal axis** — one of the body's three natural spin axes, where the inertia matrix is diagonal — points at nadir.

::: note Why it has to be true
Let $\mathbf{R}$ be the position of the center of mass and $\hat{\mathbf{r}} = \mathbf{R}/R$. Let $\mathbf{r}'$ locate a small piece of mass $\rho\,dV$ relative to the center of mass. Gravity pulls that piece with force $-\mu\rho\,dV\,(\mathbf{R} + \mathbf{r}')/\lVert\mathbf{R} + \mathbf{r}'\rVert^3$.

**Step 1: expand.** The spacecraft is tiny next to its orbit, so keep only the first correction in $r'/R$:

$$
\lVert\mathbf{R} + \mathbf{r}'\rVert^{-3} \approx R^{-3}\left(1 - \frac{3\,\hat{\mathbf{r}}\cdot\mathbf{r}'}{R}\right).
$$

Multiply out, dropping anything smaller. The force on the piece becomes $-\dfrac{\mu\rho\,dV}{R^3}\bigl[\mathbf{R} + \mathbf{r}' - 3\hat{\mathbf{r}}(\hat{\mathbf{r}}\cdot\mathbf{r}')\bigr]$.

**Step 2: take moments.** The torque about the center of mass is $\mathbf{M} = \int\mathbf{r}'\times d\mathbf{F}$. The $\mathbf{R}$ term gives $\bigl(\int\rho\mathbf{r}'\,dV\bigr)\times\mathbf{R} = \mathbf{0}$, because the mass-weighted average position relative to the center of mass is zero — that is what "center of mass" means. The $\mathbf{r}'$ term gives $\mathbf{r}'\times\mathbf{r}' = \mathbf{0}$. Only the third term survives:

$$
\mathbf{M} = \frac{3\mu}{R^3}\int\rho\,(\hat{\mathbf{r}}\cdot\mathbf{r}')\,(\mathbf{r}'\times\hat{\mathbf{r}})\,dV
= \frac{3\mu}{R^3}\bigl(\mathbf{J}\hat{\mathbf{r}}\bigr)\times\hat{\mathbf{r}},
$$

where $\mathbf{J} = \int\rho\,\mathbf{r}'\mathbf{r}'^\top dV$ is the **[[second-moment matrix|second-moment]]**.

**Step 3: switch to the inertia tensor.** The two are related by $\mathbf{I} = \mathrm{tr}(\mathbf{J})\mathbf{1} - \mathbf{J}$, so $\mathbf{J} = \tfrac{1}{2}\mathrm{tr}(\mathbf{I})\mathbf{1} - \mathbf{I}$. The $\mathbf{1}$ part gives a multiple of $\hat{\mathbf{r}}$, which crosses with $\hat{\mathbf{r}}$ to zero. What is left is $-(\mathbf{I}\hat{\mathbf{r}})\times\hat{\mathbf{r}} = \hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}$, the formula above. For a circular orbit $\mu/R^3 = n^2$, which gives the second form.
:::

::: key Gravity gradient torque
$\mathbf{M}_{gg} = (3\mu/r^3)(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}) = 3n^2(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}})$, with $\hat{\mathbf{r}}$ the nadir direction in body axes. It vanishes when a principal axis points at nadir, because $\mathbf{I}\hat{\mathbf{r}}$ is then parallel to $\hat{\mathbf{r}}$ and the cross product is zero. Scaling as $1/r^3$, it dominates the disturbance budget in low orbit and is negligible at GEO.
:::

A simple case is worth keeping in your head. Take a principal-axis body with nadir tilted by an angle $\alpha$ ("alpha") away from body axis 3, inside the plane of axes 1 and 3. Then the torque has only one component:

$$
M_2 = 3n^2\cdot\tfrac{1}{2}\,(I_1 - I_3)\sin 2\alpha .
$$

It grows with the *difference* of two principal moments, with $\sin 2\alpha$ and with $n^2$. A body with $I_1 = I_3$ feels none at all.

### Gravity-gradient stabilization

The torque can also be put to work. Pull a pendulum aside and gravity swings it back. A long satellite pointing its length at the Earth behaves the same way.

Use orbit axes: $z$ points at nadir, $x$ points along the direction of travel, $y$ is perpendicular to the orbit plane. For a small pitch angle $\theta$ (rotation about $y$), the torque is close to a straight line in $\theta$, $M \approx -3n^2(I_x - I_z)\,\theta$. Put it into Euler's equation for the pitch axis:

$$
\ddot{\theta} + \frac{3n^2(I_x - I_z)}{I_y}\,\theta = 0.
$$

When $I_x > I_z$ this is a spring equation, and the body swings back and forth. When $I_x < I_z$ the "spring" pushes the wrong way, and the tilt grows. So pitch stability needs the nadir axis to have a smaller moment than the along-track axis. Roll and yaw add one more condition: the axis perpendicular to the orbit should carry the **largest** moment. Together, $I_y > I_x > I_z$ — the nadir axis least, the orbit-normal axis most. That is why gravity-gradient satellites deploy a [[long boom|gg-boom]] pointing straight down.

The swing is called **libration**, and its angular frequency is

$$
\omega_p = n\sqrt{\frac{3(I_x - I_z)}{I_y}} .
$$

It is comparable to the orbit rate: up to $\sqrt{3}\,n$ for a long thin boom, where $I_x \approx I_y \gg I_z$. And nothing damps it. Gravity gradient supplies the spring and nothing supplies the shock absorber, so these vehicles carry a damper — a hysteresis rod or a fluid-filled ring — to soak up the swinging.

::: example Gravity gradient on the bus, at 400 km and at GEO
**Orbit rate at 400 km.** The radius is $r = 6378 + 400 = 6778\,\mathrm{km}$. Then

$$
n = \sqrt{\frac{\mu}{r^3}} = \sqrt{\frac{3.986\times 10^{14}}{(6.778\times 10^6)^3}} = 1.1314\times 10^{-3}\,\mathrm{rad/s},
$$

one orbit every $2\pi/n = 5554\,\mathrm{s} = 92.6$ minutes. So $3n^2 = 3 \times (1.1314\times 10^{-3})^2 = 3.840\times 10^{-6}\,\mathrm{s^{-2}}$.

**The torque at $5^\circ$ off nadir.** Hold the bus with axis 3 nearest nadir, tilted $5^\circ$ toward axis 1. Then $\hat{\mathbf{r}} = (\sin 5^\circ,\, 0,\, \cos 5^\circ) = (0.0872,\, 0,\, 0.9962)$. Multiply by the inertias: $\mathbf{I}\hat{\mathbf{r}} = (900 \times 0.0872,\ 0,\ 1500 \times 0.9962) = (78.4,\, 0,\, 1494.3)$. The cross product has only a middle component:

$$
\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}} = \bigl(0,\ (0.9962)(78.4) - (0.0872)(1494.3),\ 0\bigr) = (0,\, -52.1,\, 0)\,\mathrm{kg\,m^2}.
$$

Check with the simple form: $\tfrac{1}{2}(I_1 - I_3)\sin 10^\circ = \tfrac{1}{2}(-600)(0.1736) = -52.1$. They agree. The torque's size is $3.840\times 10^{-6} \times 52.1 = 2.00\times 10^{-4}\,\mathrm{N\,m}$.

At $30^\circ$ off nadir the same formula gives $\tfrac{1}{2}(600)\sin 60^\circ = 259.8\,\mathrm{kg\,m^2}$ and $9.98\times 10^{-4}\,\mathrm{N\,m}$. That is five times larger for six times the angle, because $\sin 2\alpha$ is starting to bend over.

**At GEO.** Now $r = 42\,164\,\mathrm{km}$, and $3\mu/r^3 = 1.595\times 10^{-8}\,\mathrm{s^{-2}}$ — smaller by a factor of $(42\,164/6778)^3 = 241$. The $5^\circ$ tilt gives $8.31\times 10^{-7}\,\mathrm{N\,m}$ and the $30^\circ$ tilt $4.14\times 10^{-6}\,\mathrm{N\,m}$. Gravity gradient has stopped being the leading disturbance.

**As a stabilizer.** Suppose the bus were arranged for gravity-gradient stabilization: the smallest moment, $900$, on nadir ($I_z$), $1200$ along track ($I_x$), and the largest, $1500$, perpendicular to the orbit ($I_y$). Then $I_y > I_x > I_z$, as required, and

$$
\omega_p = n\sqrt{\frac{3(1200 - 900)}{1500}} = n\sqrt{0.6} = 0.775\,n = 8.76\times 10^{-4}\,\mathrm{rad/s}.
$$

One swing takes $2\pi/\omega_p = 119.5$ minutes, against an orbit of $92.6$. That is the same order as the orbit, as expected.
:::

## Aerodynamic torque

At a few hundred kilometers the air is incredibly thin. Above about $150\,\mathrm{km}$ the flow is **[[free-molecular|free-molecular]]**: an air molecule travels much farther than the spacecraft's size before hitting another molecule. So molecules arrive, strike the surface once, and leave, without jostling each other. The drag force is

$$
\mathbf{F}_{a} = -\tfrac{1}{2}\rho\,v_{rel}^2\,C_D\,A\,\hat{\mathbf{v}}_{rel},
$$

with $\rho$ ("rho") the air density, $v_{rel}$ the speed relative to the *air*, $A$ the area the flow sees, and $C_D$ the **drag coefficient**. In free-molecular flow $C_D$ runs about $2.0$ to $2.4$ — larger than the everyday values for cars and balls, because each molecule hands over its momentum once and little flow recovers around the body.

Drag acts at the **center of pressure**, and a force off the center of mass makes a torque:

$$
\mathbf{M}_a = (\mathbf{r}_{cp} - \mathbf{r}_{cm})\times\mathbf{F}_a .
$$

**The air turns with the Earth.** So $\mathbf{v}_{rel}$ is not the orbital velocity. At $400\,\mathrm{km}$ over the equator the air moves at $\omega_\oplus r = 7.292\times 10^{-5} \times 6.778\times 10^6 = 494\,\mathrm{m/s}$. That is $6.4\,\%$ of the $7669\,\mathrm{m/s}$ orbital speed. In a high-inclination orbit it tilts the flow direction by up to about $3.7^\circ$.

**The density is the least certain number in the whole model.** At $400\,\mathrm{km}$ it ranges from about $1\times 10^{-12}$ to $1\times 10^{-11}\,\mathrm{kg/m^3}$ over the [[solar cycle|solar-cycle]] and between day and night. A factor of ten in $\rho$ is a factor of ten in the torque.

## Solar radiation pressure

Light [[carries momentum|light-push]]. When sunlight hits a surface, it pushes — very gently. The sunlight power arriving at Earth's distance from the Sun (1 **AU**, astronomical unit) is $S = 1361\,\mathrm{W/m^2}$. Divide by the speed of light to get the pressure on a surface that faces the Sun and absorbs everything:

$$
P_{SRP} = \frac{S}{c} = \frac{1361}{2.998\times 10^8} = 4.54\times 10^{-6}\,\mathrm{N/m^2}.
$$

A mirror turns the light around and gets up to twice the push, like a ball that bounces instead of sticking. For a surface facing the Sun,

$$
F_{SRP} \approx P_{SRP}\,A\,(1 + q),
$$

with $q$ the **reflectivity**: 0 for a black absorber, 1 for a perfect mirror. About $q \approx 0.5$ is a fair default for a real bus covered in insulation blankets and solar cells. As with drag, the force becomes a torque through the offset between the center of pressure — now the optical one — and the center of mass.

Solar pressure does not depend on altitude at all. The same $4.54\times 10^{-6}\,\mathrm{N/m^2}$ acts at $400\,\mathrm{km}$, at GEO, and far beyond, falling only with the square of the distance from the *Sun*. That is why it rises to the top of the list once the air and the gravity gradient fade.

::: key Solar radiation pressure
$P_{SRP} = S/c \approx 4.5\times 10^{-6}\,\mathrm{N/m^2}$ at 1 AU. The force is about $P_{SRP}A(1 + q)$ with $q$ the reflectivity, and it becomes a torque through the offset between the center of pressure and the center of mass. It is independent of altitude, so it dominates the disturbance budget at GEO.
:::

## Residual magnetic dipole

A compass needle twists to line up with Earth's magnetic field, and so does a spacecraft, a little. Wiring loops, magnetized metal and motor magnets leave it with a net **magnetic dipole moment** $\mathbf{m}$ — the strength and direction of its "bar magnet" — measured in $\mathrm{A\,m^2}$ (ampere square meters). In Earth's field $\mathbf{B}$, measured in tesla (T), it feels

$$
\mathbf{M}_{mag} = \mathbf{m}\times\mathbf{B}.
$$

For sizing, treat Earth's field as a tilted bar magnet. At radius $r$ and magnetic latitude $\lambda_m$ ("lambda sub m") its strength is

$$
\lVert\mathbf{B}\rVert = \frac{B_0 R_\oplus^3}{r^3}\sqrt{1 + 3\sin^2\lambda_m},
\qquad B_0 \approx 3.12\times 10^{-5}\,\mathrm{T},
$$

with $R_\oplus = 6378\,\mathrm{km}$ Earth's radius. Over the poles ($\sin\lambda_m = 1$) the square root is $2$, so the field is twice as strong as over the equator. And it falls as $1/r^3$. At $400\,\mathrm{km}$ that gives $2.6\times 10^{-5}\,\mathrm{T}$ at the equator and $5.2\times 10^{-5}\,\mathrm{T}$ at the pole. At GEO it is $1.1\times 10^{-7}\,\mathrm{T}$, about 240 times weaker.

The same physics works as an actuator. A **[[magnetorquer|magnetorquer-coil]]** is a coil whose current sets $\mathbf{m}$ on purpose, typically $1$ to $100\,\mathrm{A\,m^2}$. It is the standard way to drain momentum out of reaction wheels in low orbit, with no propellant and no moving parts.

::: key Magnetic torque, and why it cannot do everything
$\mathbf{M} = \mathbf{m}\times\mathbf{B}$, for a residual dipole and for a magnetorquer alike. The torque is always perpendicular to $\mathbf{B}$, so no magnetic actuator can produce any torque about the local field direction. Magnetic-only control is instantaneously **[[underactuated|underactuated]]** and becomes controllable only because orbital motion swings $\mathbf{B}$ around over an orbit.
:::

::: example The disturbance budget, LEO and GEO
The bus: $A = 6\,\mathrm{m^2}$, center-of-pressure offset $0.2\,\mathrm{m}$, $C_D = 2.2$, $q = 0.5$, residual dipole $0.5\,\mathrm{A\,m^2}$, held $5^\circ$ off nadir. Take the density at $400\,\mathrm{km}$ as $\rho = 2.8\times 10^{-12}\,\mathrm{kg/m^3}$, a middling value.

**Drag at 400 km.** First the **dynamic pressure**, the push per square meter of the oncoming flow:

$$
\tfrac{1}{2}\rho v^2 = \tfrac{1}{2}(2.8\times 10^{-12})(7669)^2 = 8.23\times 10^{-5}\,\mathrm{Pa}.
$$

Times $C_D A = 2.2 \times 6 = 13.2\,\mathrm{m^2}$, the force is $1.09\times 10^{-3}\,\mathrm{N}$. Times the $0.2\,\mathrm{m}$ lever arm, the torque is $2.17\times 10^{-4}\,\mathrm{N\,m}$.

**Sunlight.** Force $4.54\times 10^{-6} \times 6 \times 1.5 = 4.09\times 10^{-5}\,\mathrm{N}$. Times $0.2\,\mathrm{m}$: $8.17\times 10^{-6}\,\mathrm{N\,m}$.

**Magnetic.** The dipole and the field are at right angles in the worst case, so the size is $mB = 0.5 \times 2.6\times 10^{-5} = 1.30\times 10^{-5}\,\mathrm{N\,m}$ at the equator, twice that over a pole.

| Torque | 400 km | GEO |
| --- | --- | --- |
| Gravity gradient, $5^\circ$ off nadir | $2.00\times 10^{-4}$ | $8.3\times 10^{-7}$ |
| Aerodynamic | $2.17\times 10^{-4}$ | negligible |
| Solar radiation pressure | $8.2\times 10^{-6}$ | $8.2\times 10^{-6}$ |
| Residual dipole, $0.5\,\mathrm{A\,m^2}$ | $1.3$ to $2.6\times 10^{-5}$ | $5.4\times 10^{-8}$ |

All in $\mathrm{N\,m}$.

**Reading the table.** In LEO the first two are about equal and ten times the rest. The drag figure alone swings between $7.8\times 10^{-5}$ and $7.8\times 10^{-4}$ as the density moves through the solar cycle. At GEO solar pressure is ten times the gravity gradient and about 150 times the magnetic torque. A real communications satellite with $60\,\mathrm{m^2}$ of solar array and a $1\,\mathrm{m}$ offset would feel ten times the area and five times the lever arm — a torque fifty times the bus's.
:::

::: example What the disturbances cost in stored momentum
A torque matters through what it adds up to over time: torque times time is angular momentum. Take the bus at $400\,\mathrm{km}$, and suppose the gravity-gradient torque is **[[secular|secular-cyclic]]** — always pushing the same way. It is, if the vehicle holds a fixed attitude relative to the orbit, because then nadir stays fixed in body axes and the torque never changes sign.

**Per orbit:** $2.00\times 10^{-4}\,\mathrm{N\,m} \times 5554\,\mathrm{s} = 1.11\,\mathrm{N\,m\,s}$. Drag adds a similar $1.21\,\mathrm{N\,m\,s}$ if it too is secular.

**Per day:** there are $86\,400/5554 = 15.56$ orbits a day, so gravity gradient alone delivers $15.56 \times 1.11 = 17.3\,\mathrm{N\,m\,s}$.

**What that means for wheels.** A small wheel storing $0.1\,\mathrm{N\,m\,s}$ fills in $0.1/2.00\times 10^{-4} = 500\,\mathrm{s}$, about eight minutes. A $1\,\mathrm{N\,m\,s}$ wheel lasts $5000\,\mathrm{s}$, most of an orbit. A $20\,\mathrm{N\,m\,s}$ wheel lasts about a day. So the vehicle needs either big wheels or a **momentum dump** — emptying the wheels with an outside torque — several times per orbit.

**Can magnetorquers keep up?** A $10\,\mathrm{A\,m^2}$ coil in the $2.6\times 10^{-5}\,\mathrm{T}$ equatorial field makes $10 \times 2.6\times 10^{-5} = 2.6\times 10^{-4}\,\mathrm{N\,m}$ — a little more than the gravity-gradient torque, and twice that near the poles. The margin is thin but real, and it is how small Earth-observing satellites are flown. At GEO the same coil makes only $1.1\times 10^{-6}\,\mathrm{N\,m}$, far below the solar torque. That is why GEO satellites dump momentum with thrusters instead.

**Secular or cyclic?** If the bus instead holds a fixed direction in space, nadir sweeps around the body once per orbit. The gravity-gradient torque then reverses twice per orbit and nearly cancels, leaving a swing the wheels ride out. Whether a disturbance is secular or cyclic can matter more than its size.
:::

::: warning The gravity gradient torque is not a force
$\mathbf{M}_{gg}$ is the twist about the center of mass from a field that is very slightly uneven. The net gravitational *force* on the vehicle is, to the same accuracy, $-\mu m\hat{\mathbf{r}}/r^2$ acting at the center of mass, and it does what it always does: it holds the orbit. Adding a "gravity gradient force" to the orbit equations counts gravity twice. The torque and the orbit are separate results of the same expansion.
:::

::: warning Centers of pressure move
The aerodynamic center of pressure moves with attitude, because the area the flow sees changes as the vehicle turns. The optical center of pressure depends on the Sun direction and on how the solar arrays are turned. And the center of mass moves as propellant is used — on a GEO satellite by tens of centimeters over fifteen years. A model with a fixed $\mathbf{r}_{cp} - \mathbf{r}_{cm}$ is a first cut. A flight model carries the offset as a function of attitude, Sun angle and tank level, and the attitude system estimates what is left over once in orbit.
:::

::: note What is left out
Heat radiating from a hot side, sunlight and infrared bounced off the Earth, gas escaping from materials, and structural flexing of booms and antennas all add $10^{-7}$ to $10^{-6}\,\mathrm{N\,m}$. They matter for arcsecond pointing over years and for precise orbit tracking, where an unmodeled $10^{-9}\,\mathrm{m/s^2}$ acceleration is a real error. For momentum budgets, the four above carry the weight.
:::

## Check yourself

::: check
A spacecraft has $\mathbf{I} = \mathrm{diag}(400, 400, 80)\,\mathrm{kg\,m^2}$ and flies at $600\,\mathrm{km}$. Compute the gravity gradient torque with nadir $20^\circ$ from body axis 3, and say whether pointing axis 3 at nadir would be stable in pitch.
:::

::: answer
**The factor in front.** At $600\,\mathrm{km}$, $r = 6978\,\mathrm{km}$, and

$$
\frac{3\mu}{r^3} = \frac{3 \times 3.986\times 10^{14}}{(6.978\times 10^6)^3} = 3.519\times 10^{-6}\,\mathrm{s^{-2}}.
$$

**The torque.** With nadir in the 1–3 plane at $\alpha = 20^\circ$, so $2\alpha = 40^\circ$ and $\sin 40^\circ = 0.6428$:

$$
M_2 = 3.519\times 10^{-6} \times \tfrac{1}{2}(400 - 80)(0.6428) = 3.62\times 10^{-4}\,\mathrm{N\,m}.
$$

**Stability.** Axis 3 carries the smallest moment ($80$, against $400$ along track), so $I_x > I_z$ holds with a large margin and pitch is stable. The libration frequency is $\omega_p = n\sqrt{3(400-80)/400} = n\sqrt{2.4} = 1.549\,n$. (The other two moments are equal, so this body sits right on the roll–yaw boundary $I_y = I_x$; a little extra inertia about the orbit normal would settle that too.) Notice the shape: one axis with a fifth of the inertia of the other two is a long thin boom — exactly what gravity-gradient satellites look like.
:::

::: check
Why can three magnetorquers at right angles not hold a spacecraft's attitude at a single instant, and why does it work over an orbit?
:::

::: answer
Whatever dipole $\mathbf{m}$ the coils make, the torque $\mathbf{m}\times\mathbf{B}$ is perpendicular to $\mathbf{B}$. The part of any wanted torque along $\mathbf{B}$ cannot be made: the reachable torques fill a flat plane, not all of space. At any instant one rotational direction has no control at all.

Over an orbit the field direction, seen from the spacecraft, sweeps a large arc — in an inclined orbit roughly two turns per orbit. So the "forbidden" direction moves, and a torque impossible now is possible twenty minutes later. The system is controllable over time: magnetic control works but is slow, and it struggles in near-equatorial orbits, where $\mathbf{B}$ moves least.
:::

::: check
A GEO communications satellite has $40\,\mathrm{m^2}$ of solar array with reflectivity $q = 0.4$. The array's center of pressure is $1.5\,\mathrm{m}$ from the center of mass along the yaw axis. Estimate the solar radiation torque and the momentum it delivers in a day.
:::

::: answer
**Force:** $F = P_{SRP}A(1+q) = 4.54\times 10^{-6} \times 40 \times 1.4 = 2.54\times 10^{-4}\,\mathrm{N}$.

**Torque:** $M = 2.54\times 10^{-4} \times 1.5 = 3.81\times 10^{-4}\,\mathrm{N\,m}$.

**Per day, if secular:** $3.81\times 10^{-4} \times 86\,400 = 32.9\,\mathrm{N\,m\,s}$. That is close to the whole capacity of a big momentum wheel. It is why GEO satellites keep the offset small, why some trim it with a lopsided "solar sail" flap, and why their momentum management runs on thrusters. In reality the torque is partly cyclic as the satellite turns through the day, so the one-way leftover is smaller — and that leftover sizes the system.
:::

::: check
The aerodynamic torque on a LEO satellite is quoted as $2\times 10^{-4}\,\mathrm{N\,m}$. What is the single biggest source of uncertainty in that number, and how far off could it be?
:::

::: answer
The air density. At $400\,\mathrm{km}$ it ranges from about $1\times 10^{-12}$ to $1\times 10^{-11}\,\mathrm{kg/m^3}$ over the eleven-year solar cycle, with day–night swings and magnetic-storm surges on top. Even the best models are off by some tens of percent at any given moment. So a quoted torque can be wrong by a factor of ten, and you only know which way if you know where in the solar cycle the mission will fly.

The drag coefficient adds perhaps $\pm 10\,\%$, the projected area about as much, and the center-of-pressure offset more if unmeasured. None compete with the density. In practice: size the momentum system for solar maximum, and treat the disturbance as a range rather than a single value.
:::

::: check
Two spacecraft feel the same disturbance torque of $1\times 10^{-4}\,\mathrm{N\,m}$. On the first it is fixed in body axes. On the second it reverses sign twice per $5554\,\mathrm{s}$ orbit. Compare the wheel momentum each builds up in a day.
:::

::: answer
**The first is secular:** $1\times 10^{-4} \times 86\,400 = 8.64\,\mathrm{N\,m\,s}$ per day, growing without limit until something dumps it.

**The second is cyclic.** Model it as $M(t) = M_0\sin(2\pi t/T)$ with $T = 5554\,\mathrm{s}$. The wheel momentum is the running total of the torque:

$$
h(t) = \frac{M_0T}{2\pi}\bigl(1 - \cos(2\pi t/T)\bigr).
$$

The bracket swings between $0$ and $2$, so $h$ swings between $0$ and $M_0T/\pi = 1\times 10^{-4}\times 5554/\pi = 0.177\,\mathrm{N\,m\,s}$, and never builds up. A wheel with a fraction of a newton-meter-second of room handles it forever.

That is about fifty times less storage ($8.64/0.177 = 49$) from the same torque size. So a momentum budget is always written as a secular part plus a cyclic swing, and an attitude plan that turns secular into cyclic — yaw steering on a GEO satellite, say — is worth designing for.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{M}_{gg} = (3\mu/r^3)(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}}) = 3n^2(\hat{\mathbf{r}}\times\mathbf{I}\hat{\mathbf{r}})$ | Gravity gradient; zero when a principal axis is at nadir |
| $M_2 = \tfrac{3}{2}n^2(I_1 - I_3)\sin 2\alpha$ | Single-plane form; $2.0\times 10^{-4}\,\mathrm{N\,m}$ for the bus at $5^\circ$, $400\,\mathrm{km}$ |
| $\omega_p = n\sqrt{3(I_x - I_z)/I_y}$ | Pitch libration; stable needs $I_x > I_z$, fully stable $I_y > I_x > I_z$ |
| $\mathbf{F}_a = -\tfrac{1}{2}\rho v_{rel}^2 C_D A\hat{\mathbf{v}}_{rel}$ | Free-molecular drag, $C_D \approx 2.0$ to $2.4$; torque through $\mathbf{r}_{cp} - \mathbf{r}_{cm}$ |
| $\rho$ at $400\,\mathrm{km}$ | $10^{-12}$ to $10^{-11}\,\mathrm{kg/m^3}$; the biggest uncertainty |
| $P_{SRP} = S/c = 4.54\times 10^{-6}\,\mathrm{N/m^2}$ | Solar radiation pressure at 1 AU; $F \approx P_{SRP}A(1+q)$ |
| $\mathbf{M}_{mag} = \mathbf{m}\times\mathbf{B}$ | Always perpendicular to $\mathbf{B}$; no torque about the field direction |
| $\lVert\mathbf{B}\rVert = (B_0R_\oplus^3/r^3)\sqrt{1 + 3\sin^2\lambda_m}$ | $B_0 \approx 3.12\times 10^{-5}\,\mathrm{T}$; $2.6\times 10^{-5}\,\mathrm{T}$ at $400\,\mathrm{km}$, $1.1\times 10^{-7}$ at GEO |
| Ranking | LEO: gravity gradient and drag lead. GEO: solar radiation pressure leads |
| Momentum cost | $2\times 10^{-4}\,\mathrm{N\,m}$ secular is $1.1\,\mathrm{N\,m\,s}$ per orbit, $17\,\mathrm{N\,m\,s}$ per day |

The next lesson gives the vehicle something to soak up that momentum with. Reaction wheels and control moment gyros trade angular momentum with the body instead of adding it, which changes the equations of motion and changes what "conservation" means in a simulation.

::: context how-small How small is a tenth of a millinewton-meter?
A torque of $2\times 10^{-4}\,\mathrm{N\,m}$ is a force of $0.2$ millinewtons on a one-meter lever. That force is the weight of about $20$ milligrams — roughly a single grain of rice resting on the end of a meter stick. A small attitude thruster pushes thousands of times harder. The only reason such a whisper matters is that it never stops.
:::

::: context tidal-stretch Near end pulled harder
Think of a dumbbell tilted in orbit. The near ball is pulled harder than the far ball (longer red arrow). The two pulls do not balance about the middle, so they twist the dumbbell toward pointing straight at the Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M40,190 A260,260 0 0,1 320,190" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <line x1="150" y1="30" x2="210" y2="90" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="150" cy="30" r="10" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="210" cy="90" r="10" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="60" r="3" fill="#1f2a44"/>
  <line x1="150" y1="42" x2="150" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="150,68 144,56 156,56" fill="#b4232c"/>
  <line x1="210" y1="102" x2="210" y2="134" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="210,144 204,132 216,132" fill="#b4232c"/>
  <text x="90" y="28" font-size="11" fill="#1f2a44">far end</text>
  <text x="222" y="88" font-size="11" fill="#1f2a44">near end</text>
  <text x="104" y="68" font-size="11" fill="#b4232c">weaker</text>
  <text x="222" y="126" font-size="11" fill="#b4232c">stronger</text>
  <text x="240" y="30" font-size="11" fill="#1f2a44">net twist: toward</text>
  <text x="240" y="45" font-size="11" fill="#1f2a44">pointing at Earth</text>
</svg>
```

The same uneven pull, from the Moon on Earth's oceans, raises the tides.
:::

::: context mean-motion Mean motion
The **mean motion** $n$ is how fast a satellite goes around its orbit, as an angle per second: a full circle, $2\pi$ radians, divided by the orbit period. At $400\,\mathrm{km}$ that is $2\pi/5554\,\mathrm{s} = 1.13\times 10^{-3}\,\mathrm{rad/s}$. For a circular orbit it also equals $\sqrt{\mu/r^3}$, which is why the gravity-gradient formula can be written with either.
:::

::: context second-moment Two ways to describe how mass is spread
The **second-moment matrix** $\mathbf{J}$ records how far the mass lies along each direction: its diagonal entry for $x$ is $\int\rho\,x^2\,dV$. The **inertia tensor** records how hard the body is to spin about each axis, which depends on the distance *from the axis*: $I_{xx} = \int\rho\,(y^2 + z^2)\,dV$. Since $y^2 + z^2 = (x^2 + y^2 + z^2) - x^2$, the inertia is the total spread minus the spread along the axis — the rule $\mathbf{I} = \mathrm{tr}(\mathbf{J})\mathbf{1} - \mathbf{J}$, where the **trace** tr adds up the diagonal.
:::

::: context gg-boom A boom and a weight
Gravity-gradient satellites often carry a long boom, several meters or more, with a small mass on its tip, pointed at the Earth. The boom makes the nadir axis the one with the least inertia by a wide margin, so the gravity-gradient torque always pulls the satellite back to pointing down — with no fuel, no power and no moving parts. The price is that it only points roughly, within a few degrees, and wobbles slowly unless something damps it.
:::

::: context free-molecular When air stops acting like a fluid
Near the ground an air molecule travels less than a millionth of a meter before bumping into another one, so air flows like a fluid, bending around a car. At $400\,\mathrm{km}$ the average trip between collisions is kilometers long — far bigger than any spacecraft. Each molecule flies in alone, strikes, and bounces off, like hail on a roof. Engineers call this **free-molecular flow**, and it needs its own drag coefficients.
:::

::: context solar-cycle The Sun's eleven-year breathing
The Sun's activity rises and falls on a cycle of about eleven years. Near solar maximum it pours out more ultraviolet light, which heats Earth's upper atmosphere and makes it puff up. At $400\,\mathrm{km}$ the air can become several times denser. Satellites then feel more drag, lose altitude faster and need more attitude control. The International Space Station burns noticeably more propellant to hold its altitude near solar maximum.
:::

::: context light-push Pushed by sunlight
Light has no mass, but it does carry momentum: energy $E$ comes with momentum $E/c$. That is where $P = S/c$ comes from. The push is so gentle that sunlight on a football field adds up to about the weight of two or three paper clips. Yet it is real enough to fly on: in 2010 the Japanese spacecraft IKAROS unfurled a thin sail about $14\,\mathrm{m}$ on a side and was steered through space by sunlight alone.
:::

::: context magnetorquer-coil A coil that acts like a compass needle
Run a current through a coil and it becomes a magnet, with dipole $\mathbf{m}$ along the coil's axis. In Earth's field it feels a torque $\mathbf{m}\times\mathbf{B}$, at right angles to both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <ellipse cx="120" cy="100" rx="22" ry="50" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <ellipse cx="136" cy="100" rx="22" ry="50" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <ellipse cx="152" cy="100" rx="22" ry="50" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <line x1="136" y1="100" x2="250" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="262,100 248,93 248,107" fill="#1d6fd1"/>
  <text x="266" y="104" font-size="12" fill="#1d6fd1">m (coil axis)</text>
  <line x1="136" y1="100" x2="136" y2="22" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="136,12 129,26 143,26" fill="#1f2a44"/>
  <text x="146" y="22" font-size="12" fill="#1f2a44">B (Earth's field)</text>
  <circle cx="136" cy="100" r="6" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <circle cx="136" cy="100" r="2" fill="#b4232c"/>
  <text x="30" y="170" font-size="12" fill="#b4232c">torque m × B: out of the page</text>
</svg>
```

Change the current and you change $\mathbf{m}$ — but the torque can never point along $\mathbf{B}$.
:::

::: context underactuated Fewer controls than directions
A system is **underactuated** when it has fewer independent controls than directions it can move. A shopping cart with stuck front wheels is one: you cannot push it straight sideways, though by moving forward and turning you can still get it anywhere eventually. Magnetic control is the same. At each instant one direction of twist is missing, but as the field direction changes around the orbit, every direction becomes reachable over time.
:::

::: context secular-cyclic Build-up that grows, and build-up that swings
A **secular** torque always pushes the same way, so the wheel momentum climbs steadily (red). A **cyclic** torque of the same size reverses, so the momentum rises and falls back, never going far (blue).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="320" y2="25" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M40,140 C62,140 62,129 80,129 C98,129 98,140 120,140 C142,140 142,129 160,129 C178,129 178,140 200,140 C222,140 222,129 240,129 C258,129 258,140 280,140 C302,140 302,129 320,129" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="250" y="40" font-size="12" fill="#b4232c">secular: grows</text>
  <text x="190" y="118" font-size="12" fill="#1d6fd1">cyclic: swings</text>
  <text x="300" y="158" font-size="11" fill="#1f2a44">time</text>
  <text x="34" y="30" font-size="11" text-anchor="end" fill="#1f2a44">h</text>
</svg>
```

Only the secular part fills the wheels; the cyclic part needs just enough room for one swing.
:::
