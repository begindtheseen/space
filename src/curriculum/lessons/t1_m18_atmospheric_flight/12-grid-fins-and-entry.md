---
id: l12-grid-fins-and-entry
title: Grid fins, control surfaces and entry aerodynamics
minutes: 25
covers:
  - grid fins and aerodynamic control surfaces
  - ballistic coefficient and lift-to-drag ratio in entry
---

Drop a badminton shuttlecock and a pebble from a window. The pebble plummets. The shuttlecock flips itself cork-first, slows almost at once, and drifts down at a gentle, steady speed. Two things decided that: how much mass it has for its size, and how the feathers at its tail keep it pointing the right way.

Every lesson so far treated the air as an obstacle between the pad and orbit. For a reusable booster, and for anything that comes home from space, the air is also the brake and the steering wheel. A Falcon 9 first stage separates at roughly 70 km and 2 km/s, flips around, and falls back engines-first through the air it climbed through minutes earlier. For most of the way down its engines are off, so there is no thrust to point. Its landing pad is a few tens of meters wide. Four lattice-work fins near its top do the steering.

How much the booster slows, how deep it falls before it does, and how hot it gets are set by two numbers: the **ballistic coefficient**, its mass for its drag, and the **lift-to-drag ratio**, how much sideways push it can make for each unit of drag.

The lesson has two halves. The first covers aerodynamic control surfaces and grid fins: what a surface does to stability and control, why a returning booster needs one, and why a lattice beats a flat plate. The second covers entry: the ballistic coefficient, the Allen–Eggers result for peak deceleration, and the lift-to-drag ratio and the gliding path that stretches a capsule's or a spaceplane's descent over thousands of kilometers.

## Aerodynamic control surfaces

Hold your hand out of a car window and tilt it: the air shoves it up. A **control surface** is a piece of the vehicle that does that on purpose — a part whose angle to the airflow can be changed. Deflect it by an angle $\delta_f$ ("delta sub f") and it makes an extra normal force

$$
\Delta N = \bar{q}\, S\, C_{N\delta}\,\delta_f
$$

at its own station $x_f$. Here $\bar{q}$ ("q bar") is the dynamic pressure, $S$ the surface's area and $C_{N\delta}$ how much normal-force coefficient each radian of deflection buys. Because the force acts away from the center of gravity, it also makes a moment $\Delta N\,(x_f - x_{cg})$ about it.

Two things follow.

- A surface *fixed* at the tail adds normal force behind the center of gravity. That moves the vehicle's center of pressure back and increases the static margin. This is what fins do for a model rocket.
- A *movable* surface gives the authority to trim and to maneuver, and its strength is proportional to $\bar{q}$.

That proportion is the surface's weakness. At 50 km and above, the dynamic pressure is a few hundred pascals or less, and a fin does almost nothing. That is why launch vehicles steer with thrust vector control on the way up. It is also why a returning booster carries **[[cold-gas thrusters|cold-gas]]** to hold its attitude in the thin air above where its fins work.

For an engines-first fall, the shape helps. The empty stage's mass is mostly its engines at the leading end, so the center of gravity sits toward the front of the falling body. Fins at the trailing end — the interstage end, which was the top on the way up — put their force far behind it. The booster falls like a **[[shuttlecock|shuttlecock]]**, statically stable. The same fins that stabilize it also steer it: deflecting them in opposite directions rolls the stage, and deflecting a pair together pitches or yaws it.

## Grid fins

A **grid fin** is a lattice of thin, crossing plates set in a frame, like an ice-cube tray with the bottom knocked out. It is mounted flat across the flow, so the air passes *through* the cells. Each cell acts as a tiny wing whose **chord** — its length from front edge to back edge — is very short. That shape has four advantages for a returning booster.

- **Short chord, low hinge moment.** A flat fin's lift acts about a quarter of the chord or more behind its front edge, so twisting it against the airflow takes a big actuator torque, a large **[[hinge moment|hinge-moment]]**. A grid fin's plates have chords of centimeters. The push on each sits close to the hinge line, and the hinge moment is small. The actuators can be smaller and lighter. On Falcon 9 the fins are driven hydraulically from a small open-loop system (the fluid is not recycled); on the first landing attempt, in January 2015, that system ran out of fluid before touchdown.
- **Works across Mach numbers.** Below the speed of sound each cell works as a small wing. Above it, once the Mach number is high enough (roughly above 1.5) that the shock waves from each plate pass out through the cells, the fin gets its full effect back and keeps it to hypersonic speeds. A flat fin's lift per degree, by contrast, falls steadily as supersonic Mach rises.
- **Hard to stall.** Because the cells are so short, they tolerate large local angles of attack before the flow breaks away. A grid fin keeps working at angles that would stall a plate.
- **Stows flat.** The fin folds against the body for the climb and opens after separation, adding little drag on the way up.

The price is drag, and a dip near Mach 1. A lattice has far more surface rubbing the air than a plate, so its drag is higher — which, on a booster trying to slow down, is welcome. And between about Mach 0.8 and 1.2 the flow inside the cells **chokes**: shock waves form straight across the cells and the passages jam. Drag jumps, and the fin's control effect falls into a **transonic bucket** before recovering above about Mach 1.5. A booster slowing through Mach 1 has to ride out that dip with less authority.

::: key
Grid fins provide aerodynamic control authority during a booster's unpowered supersonic descent, where the engines are off. The lattice form stays efficient across transonic and supersonic Mach with a short chord, keeps hinge moments low, and stows flat against the body.
:::

"Stays efficient across transonic Mach" should be read with the bucket in mind: the effect dips near Mach 1 but comes back, where a flat fin's keeps shrinking.

::: example Grid-fin authority at two altitudes
A Falcon-9-class stage carries four grid fins of about $1.8\ \mathrm{m^2}$ each, $7.2\ \mathrm{m^2}$ in all, near its trailing end, some 18 m from the center of gravity of the empty stage.

**Pitch inertia.** Treat the 25 t, 45 m stage as a uniform rod: $I \approx 25\,000 \times 45^2/12 = 4.2 \times 10^6\ \mathrm{kg\cdot m^2}$.

**At 10 km and 400 m/s** (density $0.4127\ \mathrm{kg/m^3}$): $\bar{q} = \tfrac{1}{2} \times 0.4127 \times 400^2 = 33\ \mathrm{kPa}$. With a normal-force coefficient of 0.5 at a large deflection, the four fins give

$$
\Delta N = 33\,000 \times 7.2 \times 0.5 = 119\ \mathrm{kN}, \qquad M = 119\,000 \times 18 = 2.1\ \mathrm{MN\cdot m}.
$$

Dividing moment by inertia gives the angular acceleration: $2.1 \times 10^6/4.2 \times 10^6 = 0.5\ \mathrm{rad/s^2}$, about $29^\circ/\mathrm{s^2}$. Plenty.

**At 40 km and 1000 m/s** (density $0.0040\ \mathrm{kg/m^3}$): $\bar{q} = \tfrac{1}{2} \times 0.0040 \times 1000^2 = 2.0\ \mathrm{kPa}$. The same deflection gives $2000 \times 7.2 \times 0.5 = 7.2\ \mathrm{kN}$ and $0.031\ \mathrm{rad/s^2}$ — about sixteen times less.

Sanity check: the ratio of the two answers is exactly the ratio of the two $\bar{q}$ values, $33/2.0 \approx 16$, as it must be. Above 40 km the fins are trim devices at best, and the nitrogen thrusters hold attitude.
:::

## The ballistic coefficient

Drop a flat sheet of paper and a crumpled one. Same mass, but the flat sheet has far more drag, so it floats down while the ball falls fast. What matters is mass *compared to* drag.

If drag is the only important force, Newton's law along the velocity is

$$
m\dot v = -\tfrac{1}{2}\rho v^2 C_D A \quad\Longrightarrow\quad \dot v = -\frac{\rho v^2}{2\beta}, \qquad \beta \equiv \frac{m}{C_D A} .
$$

Here $\dot v$ ("v dot") is the rate of change of speed, $\rho$ ("rho") the air density, $C_D$ the drag coefficient and $A$ the reference area. Dividing both sides by $m$ leaves one vehicle number, $\beta$ ("beta"), the **ballistic coefficient**. The sign $\equiv$ means "is defined as". Its unit is $\mathrm{kg/m^2}$: mass per unit of drag area. A heavy, slender body has a high $\beta$, and the air slows it slowly. A light, blunt body has a low $\beta$ and stops quickly. Some books define it the other way up, as $C_D A/m$, so check before you compare numbers.

::: key
Ballistic coefficient: $\beta = m/(C_D A)$, in $\mathrm{kg/m^2}$. High $\beta$ means the body penetrates deeper before decelerating; low $\beta$ decelerates high in thin air, which is gentler on the thermal protection system.
:::

The **[[thermal protection system|tps]]** is the heat shield and insulation that keep the vehicle from burning up.

Set drag equal to weight and the body stops speeding up. That steady falling speed is the **terminal velocity** $v_t$:

$$
\tfrac{1}{2}\rho v_t^2 C_D A = mg \quad\Longrightarrow\quad v_t = \sqrt{\frac{2\beta g}{\rho}} .
$$

(Divide both sides by $\tfrac{1}{2}\rho C_D A$, use $\beta = m/(C_D A)$, and take the square root.)

::: example Ballistic coefficients and terminal velocities
**A booster.** A Falcon-9-class first stage falling engines-first has about 25 t of mass and a $10.5\ \mathrm{m^2}$ cross-section. Blunt end first, with nine engine bells, its drag coefficient is near 1.0. So $\beta \approx 25\,000/(1.0 \times 10.5) = 2380\ \mathrm{kg/m^2}$. Its sea-level terminal velocity is

$$
v_t = \sqrt{\frac{2 \times 2380 \times 9.81}{1.225}} = \sqrt{38\,100} = 195\ \mathrm{m/s}.
$$

It cannot land without a burn, and it reaches the landing burn at roughly that speed.

**A crew capsule.** 9.5 t, with a 4 m heat shield: area $\pi \times 2^2 = 12.6\ \mathrm{m^2}$ and $C_D \approx 1.4$. So $\beta = 9500/(1.4 \times 12.6) = 540\ \mathrm{kg/m^2}$ and $v_t = \sqrt{2 \times 540 \times 9.81/1.225} = 93\ \mathrm{m/s}$. Parachutes then cut that to a few meters per second.

**Apollo.** The command module, 5.5 t and 3.9 m across with the same $C_D$, was lower still: about $330\ \mathrm{kg/m^2}$ and 73 m/s.

Sanity check: the heaviest body per unit of drag area falls fastest, as the paper test said it would.
:::

## Allen–Eggers: peak deceleration in closed form

Now a body enters from space. As it falls, the air thickens, so drag grows. But drag also slows the body, which shrinks drag. So the deceleration climbs, peaks, then fades. Where is the peak, and how hard is it?

In 1953 Harvey **[[Allen and Alfred Eggers|allen-eggers]]** answered this in closed form. Assume the body enters steeply enough that gravity is small next to drag, and the path is nearly straight, at angle $\gamma$ ("gamma") below the horizontal. Use the exponential atmosphere of Lesson 1, $\rho = \rho_0 e^{-h/H}$, where $H$ is the **[[scale height|scale-height]]**. The results:

$$
a_{\max} = \frac{v_E^2\sin\gamma}{2eH}, \qquad
h^* = H\ln\frac{\rho_0 H}{\beta\sin\gamma}, \qquad
v^* = \frac{v_E}{\sqrt{e}} = 0.607\,v_E .
$$

Here $v_E$ is the entry speed, $e = 2.718$ is Euler's number, $h^*$ ("h star") is the altitude of the peak, and $v^*$ is the speed there. Along the way, the speed at any altitude is

$$
v = v_E\exp\!\left[-\frac{\rho H}{2\beta\sin\gamma}\right] .
$$

Look at $a_{\max}$: it has no $\beta$ in it. **The peak deceleration depends only on entry speed and angle.** What $\beta$ decides is *where* the peak happens. A higher $\beta$ pushes it lower, by $H\ln(\beta_2/\beta_1)$, into denser air. And since the heating rate grows roughly as $\sqrt{\rho}\,v^3$, slowing down in denser air means a higher peak heating rate. A low ballistic coefficient is how a capsule keeps its heat shield's job survivable.

::: note Why it has to be true
Along a straight path, altitude falls as $\dot h = -v\sin\gamma$. Divide the drag equation by this to use altitude, not time, as the variable:

$$
\frac{dv}{dh} = \frac{\dot v}{\dot h} = \frac{\rho v}{2\beta\sin\gamma}
\quad\Longrightarrow\quad
\frac{dv}{v} = \frac{\rho_0 e^{-h/H}}{2\beta\sin\gamma}\,dh .
$$

Integrate from high up, where $\rho \approx 0$ and $v = v_E$, down to $h$. The left side gives $\ln(v/v_E)$; the right gives $-\rho_0 H e^{-h/H}/(2\beta\sin\gamma)$:

$$
\ln\frac{v}{v_E} = -\frac{\rho(h)\,H}{2\beta\sin\gamma}
\quad\Longrightarrow\quad
v = v_E\exp\!\left[-\frac{\rho H}{2\beta\sin\gamma}\right] .
$$

Put this into $a = \rho v^2/(2\beta)$; squaring $v$ doubles the exponent:

$$
a = \frac{\rho v_E^2}{2\beta}\exp\!\left[-\frac{\rho H}{\beta\sin\gamma}\right].
$$

As a function of $\rho$ this has the shape $\rho e^{-c\rho}$ with $c = H/(\beta\sin\gamma)$. Its slope is $(1 - c\rho)e^{-c\rho}$, which is zero when $c\rho = 1$, so the peak is at $\rho^* = \beta\sin\gamma/H$. Put that back in: the exponent becomes $-1$ and the $\beta$ cancels, giving $a_{\max} = v_E^2\sin\gamma/(2eH)$. The speed there is $v_E e^{-1/2}$. Solving $\rho_0 e^{-h^*/H} = \rho^*$ for $h^*$ gives the peak altitude.
:::

::: example A capsule and a booster through the same peak
A capsule enters at $v_E = 7.5\ \mathrm{km/s}$ at $\gamma = 3^\circ$ with $\beta = 540\ \mathrm{kg/m^2}$. Take $H = 7.2\ \mathrm{km}$.

**Peak deceleration.** The top is $7500^2 \times \sin 3^\circ = 5.625 \times 10^7 \times 0.0523 = 2.94 \times 10^6$. The bottom is $2 \times 2.718 \times 7200 = 39\,150$. So

$$
a_{\max} = \frac{2.94 \times 10^6}{39\,150} = 75\ \mathrm{m/s^2} = 7.7\,g_0 .
$$

**Where.** $h^* = 7200\ln\!\left[\dfrac{1.225 \times 7200}{540 \times 0.0523}\right] = 7200\ln(312) = 41\ \mathrm{km}$, with speed $0.607 \times 7500 = 4.55\ \mathrm{km/s}$ there.

**Steeper.** At $\gamma = 6^\circ$, $\sin\gamma$ roughly doubles and so does the peak, to about $15\,g_0$. That is why entry angle is controlled to fractions of a degree.

**Same entry, booster's $\beta = 2400$.** The peak is still $7.7\,g_0$, but at $h^* = 7200\ln(70.2) = 31\ \mathrm{km}$. That is 10.7 km lower, which checks: $H\ln(2400/540) = 7200 \times 1.49 = 10.7\ \mathrm{km}$. The air there is 4.4 times denser, and at the same speed the heating rate is $\sqrt{4.4} = 2.1$ times higher.

**What the booster really does.** Its **[[entry burn|entry-burn]]** slows it to about 1 km/s at $\gamma \approx 70^\circ$ before the dense air. Then $a_{\max} = 1000^2 \times 0.940/39\,150 = 24\ \mathrm{m/s^2} = 2.4\,g_0$, at about 10 km. The burn buys a gentle entry with propellant instead of a heat shield.
:::

## Lift-to-drag ratio and the equilibrium glide

A paper airplane and a crumpled ball of the same paper, thrown from the same height: the airplane goes much farther, because it makes lift. A body with lift has a second knob to turn.

The **lift-to-drag ratio**, $L/D = C_L/C_D$, says how much lift the body makes per unit of drag. It is about 0.3 for a capsule flying with its center of gravity offset to one side, about 1 for the Space Shuttle at its hypersonic angle of attack of $40^\circ$, and 1.5–2 for lifting bodies. Lift lets the vehicle fly a shallower path, slowing over a longer distance and time, and it lets the vehicle steer.

In an **equilibrium glide** the vehicle sinks so slowly that the up-and-down forces balance. Lift plus the "centrifugal relief" of flying a curved path at speed $v$ around a planet of radius $r$ equals weight:

$$
L + \frac{mv^2}{r} = mg \quad\Longrightarrow\quad L = mg\left(1 - \frac{v^2}{v_c^2}\right), \qquad v_c = \sqrt{gr} \approx 7.9\ \mathrm{km/s} .
$$

Here $v_c$ is circular orbital speed. Near it almost no lift is needed, because the vehicle is nearly in orbit. As it slows, it needs more lift. The drag is $D = L/(L/D)$, so the deceleration along the path is

$$
a = \frac{D}{m} = \frac{g}{L/D}\left(1 - \frac{v^2}{v_c^2}\right).
$$

It rises from near zero at orbital speed toward $g/(L/D)$ as the vehicle slows: about $1\,g_0$ for the Shuttle and $3.3\,g_0$ for a capsule at $L/D = 0.3$, with no sharp peak at all. Adding up the distance, $ds = v\,dt = -v\,dv/a$, from $v_E$ down to zero gives the glide range:

$$
s = \frac{L}{D}\,\frac{v_c^2}{2g}\,\ln\frac{1}{1 - v_E^2/v_c^2} = \frac{L}{D}\,\frac{r}{2}\,\ln\frac{1}{1 - v_E^2/v_c^2} .
$$

::: example Glide range from 7.5 km/s
Take $v_c = 7.97\ \mathrm{km/s}$ and $v_E = 7.5\ \mathrm{km/s}$.

**The speed ratio.** $v_E^2/v_c^2 = 7.5^2/7.97^2 = 0.886$, so $1 - 0.886 = 0.114$.

**The logarithm.** $\ln(1/0.114) = \ln 8.74 = 2.17$.

**The range per unit of $L/D$.** $v_c^2/(2g) = 7970^2/(2 \times 9.81) = 3238\ \mathrm{km}$, and $3238 \times 2.17 = 7020\ \mathrm{km}$.

So a capsule at $L/D = 0.3$ glides about 2100 km, a Shuttle-class vehicle at $L/D = 1$ about 7000 km, and a lifting body at $L/D = 2$ about 14 000 km.

Lift also buys **cross-range**, reach to the side of the ground track: the Shuttle could reach a runway roughly 1500–2000 km off to one side. And it widens the **[[entry corridor|corridor]]**. Too steep an entry overloads the structure and heat shield; too shallow a one skips back out of the atmosphere. Being able to change lift, by rolling the lift vector, lets guidance fly between the two limits instead of relying on the entry angle alone.

Sanity check: 2100 km for a capsule is a bit more than New York to Miami — believable for a vehicle that barely glides.
:::

For the returning booster, $L/D$ is small — it is a cylinder at a few degrees of angle of attack — but not zero. The grid fins trim the stage to a small angle of attack, the body makes lift, and that lift steers the stage several kilometers toward its pad on the way down. The body lift that threatened the airframe on the climb is now put to work.

::: warning
Allen–Eggers assumes gravity is small next to drag and the flight-path angle stays fixed. Both hold for steep ballistic entries and fail for shallow lifting ones, where gravity, centrifugal relief and lift shape the path. For those, use the equilibrium-glide relations or a numerical integration. The famous result — peak deceleration independent of $\beta$ — is exact only inside those assumptions.
:::

::: warning
The area in $\beta$ is the drag reference area for the attitude actually flown. A booster nose-first and the same booster engines-first have the same cross-section but very different $C_D$. A capsule's $\beta$ at its trim angle of attack differs from its head-on value. Quote $\beta$ together with the configuration it belongs to.
:::

## Check yourself

::: check
Why can a flat fin big enough to control a booster at 10 km not be scaled up to control it at 50 km, and what does the vehicle use instead?
:::

::: answer
Fin force is $\bar{q} S C_{N\delta}\delta_f$. At 50 km and 1 km/s, $\bar{q} \approx \tfrac{1}{2} \times 0.001 \times 1000^2 = 0.5\ \mathrm{kPa}$, about 66 times less than the 33 kPa at 10 km and 400 m/s. A fin sixty-odd times larger would be absurd in mass and in drag on the way up.

Instead the stage uses cold-gas nitrogen thrusters at high altitude. Their small torque is enough there, because there is almost no aerodynamic moment to fight. Control hands over to the grid fins as $\bar{q}$ builds on the way down.
:::

::: check
Why does a grid fin lose effect near Mach 1 and get it back above roughly Mach 1.5?
:::

::: answer
In the transonic range the flow entering each small cell reaches the speed of sound, and shock waves form straight across the cells, choking the passages. The flow cannot pass freely: drag rises sharply and the lift from the plates drops. That is the transonic bucket.

Above about Mach 1.5 the shock waves from each plate's front edge lean back far enough to pass out through the cell exits without blocking them. Flow through the lattice is restored, and each plate works again as a small supersonic wing — an effect the fin keeps up to hypersonic speeds.
:::

::: check
Two bodies enter at the same speed and angle, one with $\beta = 100\ \mathrm{kg/m^2}$ and one with $\beta = 1000$. Using $H = 7.2\ \mathrm{km}$, compare their peak decelerations and the altitudes where they happen.
:::

::: answer
The peak deceleration $v_E^2\sin\gamma/(2eH)$ has no $\beta$ in it, so both bodies feel the same maximum.

The peak altitude $h^* = H\ln[\rho_0 H/(\beta\sin\gamma)]$ is lower for the heavier body by $H\ln(1000/100) = 7.2 \times 2.303 = 16.6\ \mathrm{km}$. There the air is $e^{16.6/7.2} = 10$ times denser. Since heating rate goes as $\sqrt\rho\,v^3$ and the speed at the peak is the same, its peak heating rate is about $\sqrt{10} \approx 3$ times higher.
:::

::: check
A capsule with $L/D = 0.3$ is in an equilibrium glide at 5 km/s. What deceleration does it feel, and what would a vehicle with $L/D = 1$ feel at the same speed?
:::

::: answer
Use $a = (g/(L/D))(1 - v^2/v_c^2)$ with $v_c = 7.97\ \mathrm{km/s}$. First $1 - 5^2/7.97^2 = 1 - 25/63.5 = 0.606$.

For $L/D = 0.3$: $a = 9.81 \times 0.606/0.3 = 19.8\ \mathrm{m/s^2} = 2.0\,g_0$.

For $L/D = 1$: $a = 9.81 \times 0.606 = 5.9\ \mathrm{m/s^2} = 0.6\,g_0$.

A higher lift-to-drag ratio spreads the same energy loss over a longer path with gentler deceleration — and a longer time at high temperature, which is the spaceplane's heating trade.
:::

::: check
A stage's entry burn is cut short, and it enters the dense air at 1.4 km/s instead of 1.0 km/s, still at $\gamma \approx 70^\circ$. By what factor does the peak deceleration change, and what else changes for the heating?
:::

::: answer
$a_{\max}$ grows as $v_E^2$, so it rises by $(1.4/1.0)^2 = 1.96$: from $2.4\,g_0$ to about $4.7\,g_0$.

The peak's altitude does not change, since it depends on $\beta$ and $\gamma$, not $v_E$. But the heating rate grows as $v^3$, so the peak heating rises by $1.4^3 = 2.7$ times. That is a strong reason to spend propellant on the entry burn rather than armor the engine section.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\Delta N = \bar{q} S C_{N\delta}\delta_f$ | control-surface force; effect $\propto \bar{q}$, useless above ~50 km |
| Grid fins | lattice of short-chord plates: low hinge moment, effective supersonically, hard to stall, stow flat; choke near Mach 1 |
| Fin authority | ~0.5 rad/s² at 10 km, 400 m/s; ~0.03 rad/s² at 40 km, 1 km/s, for a Falcon-9-class stage |
| $\beta = m/(C_D A)$ | ballistic coefficient, kg/m²; ~2400 engines-first stage, ~540 capsule, ~330 Apollo |
| $v_t = \sqrt{2\beta g/\rho}$ | terminal velocity; about 195 m/s for the stage at sea level |
| Allen–Eggers | $v = v_E\exp[-\rho H/(2\beta\sin\gamma)]$; $a_{\max} = v_E^2\sin\gamma/(2eH)$, independent of $\beta$ |
| Peak altitude | $h^* = H\ln[\rho_0 H/(\beta\sin\gamma)]$; higher $\beta$ → lower, hotter peak |
| Equilibrium glide | $L = mg(1 - v^2/v_c^2)$; $a = (g/(L/D))(1 - v^2/v_c^2)$; range $= (L/D)(r/2)\ln[1/(1 - v_E^2/v_c^2)]$ |
| $L/D$ | ~0.3 capsule, ~1 Shuttle, 1.5–2 lifting body; buys range, cross-range and corridor width |

This closes the module. From the standard atmosphere through dynamic pressure, angle of attack, static instability, load relief, wind, bending, slosh and control-structure interaction to the aerodynamics of coming home, the thread has been one quantity — $\bar{q}$ times a coefficient — and what a controller must do about it.

::: context cold-gas Steering with puffs of gas
A **cold-gas thruster** is a valve and a nozzle on a tank of compressed gas. Open the valve and the gas rushes out, pushing the other way. There is no burning, so it is simple and reliable, though weak. Falcon 9's first stage has clusters of nitrogen thrusters near its top. They flip the stage after separation and hold its attitude in the thin upper air, where fins have nothing to push on.
:::

::: context shuttlecock Why the booster falls engines-first and stable
Heavy end in front, drag-makers behind: that is a shuttlecock, a dart and a weather vane. When the body tilts, the fins at the back get shoved sideways, and since they are far behind the center of gravity, that push turns the nose back into the wind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="165" y="20" width="30" height="130" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="143" y="30" width="22" height="14" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="195" y="30" width="22" height="14" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="168,150 180,150 183,166 165,166" fill="#6c7a93" stroke="#1f2a44"/>
  <polygon points="180,150 192,150 195,166 177,166" fill="#6c7a93" stroke="#1f2a44"/>
  <circle cx="180" cy="118" r="6" fill="#b4232c"/>
  <text x="230" y="122" font-size="12" fill="#b4232c">CG (heavy engines)</text>
  <text x="225" y="41" font-size="12" fill="#1f2a44">fins: far behind CG</text>
  <line x1="90" y1="40" x2="90" y2="140" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="90,152 84,138 96,138" fill="#1d6fd1"/>
  <text x="90" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">falling</text>
  <text x="180" y="184" font-size="12" text-anchor="middle" fill="#1f2a44">engines lead the way down</text>
</svg>
```
:::

::: context hinge-moment Why short chords need small motors
The **hinge moment** is the twist the air puts on a fin about its hinge. It equals the fin's force times the distance from the hinge to where that force acts. A long flat fin's force acts well behind the hinge: a long lever. A grid fin is made of many short plates, so the force sits close to the hinge line: a short lever, and a much smaller motor can hold it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="60" width="130" height="8" fill="#6c7a93" stroke="#1f2a44"/>
  <circle cx="20" cy="64" r="5" fill="#1f2a44"/>
  <line x1="52" y1="60" x2="52" y2="22" stroke="#b4232c" stroke-width="3"/>
  <polygon points="52,14 46,26 58,26" fill="#b4232c"/>
  <line x1="20" y1="84" x2="52" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="36" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">arm</text>
  <text x="85" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">flat fin: long arm</text>
  <g fill="#6c7a93" stroke="#1f2a44">
    <rect x="230" y="30" width="16" height="5"/><rect x="230" y="50" width="16" height="5"/>
    <rect x="230" y="70" width="16" height="5"/><rect x="230" y="90" width="16" height="5"/>
  </g>
  <line x1="231" y1="20" x2="231" y2="105" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="235" y1="50" x2="235" y2="22" stroke="#b4232c" stroke-width="3"/>
  <polygon points="235,14 229,26 241,26" fill="#b4232c"/>
  <text x="240" y="130" font-size="12" text-anchor="middle" fill="#1f2a44">grid fin: short chords, short arm</text>
  <text x="6" y="45" font-size="11" fill="#1f2a44">hinge</text>
</svg>
```
:::

::: context tps The heat shield's job
Coming back from orbit, a vehicle carries enormous kinetic energy, and almost all of it ends up as heat in the air around it. The **thermal protection system** keeps enough of that heat out of the vehicle. Capsules use an ablative shield that chars and flakes away, carrying heat with it. The Shuttle used reusable silica tiles. Slowing high up, in thin air, keeps the heating rate down, which is why a low $\beta$ is kind to the heat shield.
:::

::: context allen-eggers The blunt-body idea
Harvey Allen and Alfred Eggers worked at NACA's Ames laboratory in California. Their analysis, finished in 1953 and published in 1958, showed something surprising: a *blunt* nose survives entry better than a sharp one. The blunt shape pushes a strong shock wave out in front, and most of the heat stays in the shocked air instead of soaking into the vehicle. Every crewed capsule since, from Mercury to Orion, has the blunt shape their work suggested.
:::

::: context scale-height The atmosphere's step size
The scale height $H$ is how far you climb for the air density to fall by a factor of $e \approx 2.718$. Lesson 1 fitted $H \approx 7.2$ to $8.5$ km for the lower atmosphere. Because $H$ is the only atmosphere number in the Allen–Eggers results, it sets the size of everything: the peak's altitude moves in steps of $H$ times a logarithm, and the peak deceleration is inversely proportional to $H$.
:::

::: context entry-burn Slowing down with the engines
After flipping around, the Falcon 9 booster relights some of its engines high in the atmosphere, usually three for a burn of roughly twenty seconds. That is the entry burn. It cuts the speed before the thick air, lowering both the deceleration and the heating on the engines and the base of the stage. The exhaust plume in front of the stage also shields it from some of the hot flow. A final single-engine landing burn does the rest.
:::

::: context corridor Threading the needle
The entry corridor is the band of entry angles that works. Too steep, and deceleration and heating are too high. Too shallow, and the vehicle bounces off the upper air like a stone skipping on a pond. For Apollo returning from the Moon at 11 km/s, the corridor was only a couple of degrees wide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M10,150 Q180,110 350,150" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <path d="M10,110 Q180,70 350,110" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5,4"/>
  <text x="352" y="124" font-size="11" text-anchor="end" fill="#6c7a93">top of the air</text>
  <text x="352" y="164" font-size="11" text-anchor="end" fill="#6c7a93">ground</text>
  <path d="M30,20 Q90,60 130,132" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M110,20 Q170,80 250,122" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M200,20 Q255,175 340,30" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <text x="10" y="190" font-size="11" fill="#b4232c">too steep</text>
  <text x="80" y="190" font-size="11" fill="#1d6fd1">in the corridor</text>
  <text x="185" y="190" font-size="11" fill="#1f2a44">orange: too shallow, skips out</text>
</svg>
```
:::
