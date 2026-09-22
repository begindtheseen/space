---
id: l12-grid-fins-and-entry
title: Grid fins, control surfaces and entry aerodynamics
minutes: 20
covers:
  - grid fins and aerodynamic control surfaces
  - ballistic coefficient and lift-to-drag ratio in entry
---

Every lesson so far has treated the atmosphere as an obstacle between the pad and orbit. For a reusable booster, and for anything that comes home, the atmosphere is also the brake and the steering. A Falcon 9 first stage separates at around 70 km and 2 km/s, flips, and falls back engines-first through the same air it climbed through minutes earlier — now with its engines off for most of the descent, no thrust vector to point, and a landing pad a few metres wide to reach. Four lattice-work fins near its top do the steering. How much it slows, how deep it penetrates before it does, and how hot it gets are set by two numbers: the ballistic coefficient and the lift-to-drag ratio.

This lesson has two halves. The first treats aerodynamic control surfaces in general and grid fins in particular: what a surface does to the vehicle's stability and control, why a returning booster needs one, and why a lattice beats a flat plate for that job. The second treats entry: the ballistic coefficient and the Allen–Eggers analysis that gives peak deceleration and its altitude in closed form, then the lift-to-drag ratio and the equilibrium glide that stretches a capsule or a spaceplane's descent across thousands of kilometres.

## Aerodynamic control surfaces

A control surface is a piece of the vehicle whose incidence to the flow can be changed. Deflect it by $\delta_f$ and it produces an additional normal force

$$
\Delta N = \bar{q}\, S\, C_{N\delta}\,\delta_f
$$

at its own station $x_f$, and therefore a moment $\Delta N\,(x_f - x_{cg})$ about the centre of gravity. Two things follow. First, a surface *fixed* at the tail adds normal-force slope aft of the centre of gravity, moving the vehicle's centre of pressure back and increasing the static margin — this is what fins do for a model rocket. Second, a *movable* surface gives the control authority to trim and to manoeuvre, with an effectiveness proportional to $\bar{q}$. That proportionality is the surface's limitation: at 50 km and above the dynamic pressure is a few hundred pascals or less and a fin does nothing, which is why launch vehicles use thrust vector control for ascent and why a returning booster carries cold-gas thrusters for attitude control in the thin air above its aerodynamic regime.

For an engines-first descent the geometry helps. The empty stage's mass is dominated by the engines at the leading end, so the centre of gravity sits toward the front of the falling body; fins mounted at the trailing end — the interstage end, which was the top during ascent — put their normal force well aft of it. The booster falls like a shuttlecock, statically stable, and the same fins that stabilise it steer it: differential deflection for roll, collective deflection in each plane for pitch and yaw.

## Grid fins

A **grid fin** is a lattice of thin intersecting plates set in a frame, mounted perpendicular to the body so that air passes through the cells. Each cell is a tiny wing of very short chord. The form has four advantages for a returning booster.

- **Short chord, low hinge moment.** A planar fin's lift acts a quarter-chord or more behind its leading edge; deflecting it against the flow takes a large actuator torque. A grid fin's individual plates have chords of centimetres, so the centre of pressure of each is close to the hinge line and the hinge moment is small. The actuators can be smaller and lighter — the fins are hydraulically driven from a small open-loop system on Falcon 9, and on the first landing attempt in January 2015 that system ran out of fluid before touchdown.
- **Effective across Mach.** Subsonically each cell works as a small wing. Supersonically, once the Mach number is high enough (roughly above 1.5) that the shock waves from each plate pass out through the cells, the fin regains full effectiveness and keeps it to hypersonic speeds. A planar fin's lift-curve slope, by contrast, falls steadily with supersonic Mach.
- **High stall angle.** Because the cells are so short in chord, they tolerate large local angles of attack before separating; a grid fin keeps working at incidences that would stall a plate.
- **Stows flat.** The fin folds against the body for ascent and deploys after separation, adding little drag on the way up.

The price is drag, and a transonic dip. A lattice has far more wetted area than a plate, so its drag is higher — which on a decelerating booster is welcome. And between about Mach 0.8 and 1.2 the flow inside the cells chokes: normal shocks form across the cells, the passages block, drag jumps and the lift effectiveness falls into a **transonic bucket** before recovering above Mach 1.5. A booster decelerating through Mach 1 has to ride out that dip with reduced authority.

::: key
Grid fins provide aerodynamic control authority during a booster's unpowered supersonic descent, where the engines are off. The lattice form stays efficient across transonic and supersonic Mach with a short chord, keeps hinge moments low, and stows flat against the body.
:::

::: example Grid-fin authority at two altitudes
A Falcon-9-class stage carries four grid fins of about $1.8\ \mathrm{m^2}$ each, near the trailing end some 18 m from the centre of gravity of the empty stage, whose pitch inertia is about $I \approx 25\,000 \times 45^2/12 = 4.2 \times 10^6\ \mathrm{kg\cdot m^2}$. At 10 km and 400 m/s, $\bar{q} = \tfrac{1}{2} \times 0.4127 \times 400^2 = 33\ \mathrm{kPa}$. With a representative normal-force coefficient of 0.5 at a large deflection, the four fins give

$$
\Delta N = 33\,000 \times 7.2 \times 0.5 = 119\ \mathrm{kN}, \qquad M = 119\,000 \times 18 = 2.1\ \mathrm{MN\cdot m},
$$

and an angular acceleration of $2.1 \times 10^6/4.2 \times 10^6 = 0.5\ \mathrm{rad/s^2}$ — about $29^\circ/\mathrm{s^2}$, ample. At 40 km and 1000 m/s, $\bar{q} = \tfrac{1}{2} \times 0.00385 \times 1000^2 = 1.9\ \mathrm{kPa}$, the same deflection gives 7 kN and $0.03\ \mathrm{rad/s^2}$: seventeen times less. Above that the fins are trim devices at best and the nitrogen thrusters hold attitude.
:::

## The ballistic coefficient

For a body whose only significant aerodynamic force is drag, the equation of motion along the velocity is

$$
m\dot v = -\tfrac{1}{2}\rho v^2 C_D A \quad\Longrightarrow\quad \dot v = -\frac{\rho v^2}{2\beta}, \qquad \beta \equiv \frac{m}{C_D A} ,
$$

and $\beta$, the **ballistic coefficient** in $\mathrm{kg/m^2}$, is the only vehicle property that matters. It is mass per unit drag area: a heavy, slender, streamlined body has a high $\beta$ and the air slows it slowly; a light, blunt body has a low $\beta$ and stops quickly. Some texts define it inversely, as $C_D A/m$; check before you compare.

::: key
Ballistic coefficient: $\beta = m/(C_D A)$, in $\mathrm{kg/m^2}$. High $\beta$ means the body penetrates deeper before decelerating; low $\beta$ decelerates high in thin air, which is gentler on the thermal protection system.
:::

Balancing drag against weight gives the **terminal velocity**, the speed at which a body falls once drag equals weight:

$$
\tfrac{1}{2}\rho v_t^2 C_D A = mg \quad\Longrightarrow\quad v_t = \sqrt{\frac{2\beta g}{\rho}} .
$$

::: example Ballistic coefficients and terminal velocities
A Falcon-9-class first stage descending engines-first has about 25 t of mass, a $10.5\ \mathrm{m^2}$ cross-section and, blunt end forward with nine engine bells, a drag coefficient near 1.0: $\beta \approx 25\,000/(1.0 \times 10.5) = 2400\ \mathrm{kg/m^2}$. Its sea-level terminal velocity is $\sqrt{2 \times 2400 \times 9.81/1.225} = 195\ \mathrm{m/s}$ — it cannot land without a burn, and it arrives at the landing burn at roughly that speed. A 9.5 t crew capsule with a 4 m heat shield ($12.6\ \mathrm{m^2}$, $C_D \approx 1.4$) has $\beta = 540\ \mathrm{kg/m^2}$ and a terminal velocity of 93 m/s, which parachutes then reduce to a few metres per second; the Apollo command module at 5.5 t and 3.9 m was lower still, about $350\ \mathrm{kg/m^2}$ and 75 m/s.
:::

## Allen–Eggers: peak deceleration in closed form

Consider a body entering steeply enough that gravity is negligible against drag and the flight path is nearly a straight line at angle $\gamma$ below the horizontal, through an exponential atmosphere $\rho = \rho_0 e^{-h/H}$. Then $\dot h = -v\sin\gamma$, and the drag equation can be written with altitude as the independent variable:

$$
\frac{dv}{dh} = \frac{\dot v}{\dot h} = \frac{\rho v}{2\beta\sin\gamma}
\quad\Longrightarrow\quad
\frac{dv}{v} = \frac{\rho_0 e^{-h/H}}{2\beta\sin\gamma}\,dh .
$$

Integrate from the entry altitude, where $\rho \approx 0$ and $v = v_E$, down to $h$:

$$
\ln\frac{v}{v_E} = -\frac{\rho(h)\,H}{2\beta\sin\gamma}
\quad\Longrightarrow\quad
v = v_E\exp\!\left[-\frac{\rho H}{2\beta\sin\gamma}\right] .
$$

The deceleration is $a = \rho v^2/(2\beta) = \dfrac{\rho v_E^2}{2\beta}\exp\!\left[-\dfrac{\rho H}{\beta\sin\gamma}\right]$. As a function of $\rho$ it is of the form $\rho e^{-c\rho}$, maximum where $c\rho = 1$, i.e. at $\rho^* = \beta\sin\gamma/H$. Substituting back:

$$
a_{\max} = \frac{v_E^2\sin\gamma}{2eH}, \qquad
h^* = H\ln\frac{\rho_0 H}{\beta\sin\gamma}, \qquad
v^* = \frac{v_E}{\sqrt{e}} = 0.607\,v_E .
$$

The peak deceleration does not depend on the ballistic coefficient at all — only on entry speed and angle. What $\beta$ decides is *where* the peak happens: a higher $\beta$ pushes it to a lower altitude, by $H\ln(\beta_2/\beta_1)$, into denser air. And since convective heating rate scales roughly as $\sqrt{\rho}\,v^3$, decelerating in denser air means a higher peak heating rate. A low ballistic coefficient is how a capsule keeps its heat shield's job survivable.

::: example A capsule and a booster through the same peak
A capsule enters at $v_E = 7.5\ \mathrm{km/s}$ at $\gamma = 3^\circ$ with $\beta = 540\ \mathrm{kg/m^2}$; take $H = 7.2\ \mathrm{km}$. Then

$$
a_{\max} = \frac{7500^2 \times \sin 3^\circ}{2 \times 2.718 \times 7200} = \frac{2.94 \times 10^6}{39\,150} = 75\ \mathrm{m/s^2} = 7.7\,g_0,
$$

at $h^* = 7200\ln\!\left[\dfrac{1.225 \times 7200}{540 \times 0.0523}\right] = 7200\ln(312) = 41\ \mathrm{km}$, with the speed there $0.607 \times 7500 = 4.55\ \mathrm{km/s}$. Steepen to $\gamma = 6^\circ$ and the peak doubles to $15\,g_0$ — the reason entry angle is controlled to fractions of a degree. Now give the same entry to a body with the booster's $\beta = 2400$: the peak is still $7.7\,g_0$, but at $h^* = 7200\ln(70.3) = 31\ \mathrm{km}$, 10.7 km lower ($= H\ln(2400/540)$), in air 4.4 times denser and correspondingly hotter. The real booster does not fly this profile: its entry burn slows it to about 1 km/s at $\gamma \approx 70^\circ$ before the dense air, for which the formula gives $a_{\max} = 1000^2 \times 0.94/39\,150 = 24\ \mathrm{m/s^2} = 2.4\,g_0$ at about 10 km — the burn buys a gentle entry with propellant instead of a heat shield.
:::

## Lift-to-drag ratio and the equilibrium glide

A body with lift has a second knob. The **lift-to-drag ratio** $L/D = C_L/C_D$ is 0.3 or so for a capsule flying with an offset centre of gravity, about 1 for the Space Shuttle at its hypersonic angle of attack of 40°, and 1.5–2 for lifting bodies. Lift lets the vehicle fly a shallower path in which it decelerates over a longer distance and time, and it lets it steer.

In an **equilibrium glide** the vehicle descends slowly enough that the vertical forces balance: lift plus the centrifugal relief of flying a curved path at speed $v$ around a planet of radius $r$ equals weight,

$$
L + \frac{mv^2}{r} = mg \quad\Longrightarrow\quad L = mg\left(1 - \frac{v^2}{v_c^2}\right), \qquad v_c = \sqrt{gr} \approx 7.9\ \mathrm{km/s} .
$$

At near-orbital speed almost no lift is needed; as the vehicle slows, more is. The drag is $D = L/(L/D)$, so the deceleration along the path is

$$
a = \frac{D}{m} = \frac{g}{L/D}\left(1 - \frac{v^2}{v_c^2}\right),
$$

rising from near zero at orbital speed to $g/(L/D)$ as the vehicle slows — about $1\,g_0$ for the Shuttle, $3.3\,g_0$ for a capsule at $L/D = 0.3$, with no sharp peak at all. Integrating $ds = v\,dt = -v\,dv/a$ from $v_E$ to zero gives the glide range,

$$
s = \frac{L}{D}\,\frac{v_c^2}{2g}\,\ln\frac{1}{1 - v_E^2/v_c^2} = \frac{L}{D}\,\frac{r}{2}\,\ln\frac{1}{1 - v_E^2/v_c^2} .
$$

::: example Glide range from 7.5 km/s
With $v_c = 7.97\ \mathrm{km/s}$ and $v_E = 7.5\ \mathrm{km/s}$, $v_E^2/v_c^2 = 0.886$ and the logarithm is $\ln(1/0.114) = 2.18$. The range factor is $(r/2) \times 2.18 = 3236 \times 2.18 = 7040\ \mathrm{km}$ per unit of $L/D$: a capsule at $L/D = 0.3$ glides about 2100 km, a Shuttle-class vehicle at $L/D = 1$ about 7000 km, a lifting body at $L/D = 2$ about 14 000 km. Lift also buys cross-range — the Shuttle could reach a runway 1500 km to the side of its orbital track — and it widens the **entry corridor**: too steep an entry overloads the structure and heat shield, too shallow a one skips back out of the atmosphere, and the ability to modulate lift (by rolling the lift vector) lets guidance fly between the two limits instead of relying on the entry angle alone.
:::

For the returning booster, $L/D$ is small — a cylinder at a few degrees of angle of attack — but not zero. The grid fins trim the stage to a small angle of attack, the body generates lift, and that lift steers the stage several kilometres toward its pad during the descent: the same body-lift physics that threatened the airframe on ascent, now put to work.

::: warning
Allen–Eggers assumes gravity is negligible against drag and that the flight-path angle is constant. Both hold for steep ballistic entries and fail for shallow lifting ones, where gravity, centrifugal relief and lift shape the path; for those, use the equilibrium-glide relations or a numerical integration. The formula's most-quoted result — peak deceleration independent of $\beta$ — is exact only within those assumptions.
:::

::: warning
The reference area in $\beta$ is the drag reference area for the attitude actually flown. A booster nose-first and the same booster engines-first have the same cross-section but very different $C_D$, and a capsule's $\beta$ at its trim angle of attack differs from its axial value. Quote $\beta$ with the configuration it belongs to.
:::

## Check yourself

::: check
Why can a planar fin large enough to control a booster at 10 km not simply be scaled up to control it at 50 km, and what does the vehicle use instead?
:::

::: answer
Fin force is $\bar{q} S C_{N\delta}\delta_f$, and $\bar{q}$ at 50 km and 1 km/s is about $\tfrac{1}{2} \times 0.001 \times 10^6 = 0.5\ \mathrm{kPa}$, some sixty times less than at 10 km and 400 m/s. A fin sixty times larger would be absurd in mass and ascent drag. The stage uses cold-gas nitrogen thrusters for attitude control at high altitude, where their small torque is enough because there is almost no aerodynamic moment to fight, and hands over to the grid fins as $\bar{q}$ builds in the descent.
:::

::: check
Why does a grid fin lose effectiveness near Mach 1 and regain it above roughly Mach 1.5?
:::

::: answer
In the transonic range the flow entering each small cell reaches sonic conditions and normal shocks form inside the cells, choking the passages: the flow cannot pass freely, drag rises sharply and the lift the plates generate drops — the transonic bucket. Above about Mach 1.5 the oblique shocks from each plate's leading edge become swept enough to pass out through the cell exits without blocking them, the flow through the lattice is re-established, and each plate again works as a small supersonic wing, an effectiveness the fin keeps to hypersonic speeds.
:::

::: check
Two bodies enter at the same speed and angle, one with $\beta = 100\ \mathrm{kg/m^2}$ and one with $\beta = 1000$. Using $H = 7.2\ \mathrm{km}$, compare their peak decelerations and the altitudes at which they occur.
:::

::: answer
The peak deceleration $v_E^2\sin\gamma/(2eH)$ does not depend on $\beta$, so both bodies experience the same maximum. The altitude of the peak is $h^* = H\ln[\rho_0 H/(\beta\sin\gamma)]$, which is lower for the heavier body by $H\ln(1000/100) = 7.2 \times 2.303 = 16.6\ \mathrm{km}$. The high-$\beta$ body reaches its peak in air $e^{16.6/7.2} = 10$ times denser, and since heating rate scales with $\sqrt\rho\,v^3$ at the same speed, its peak heating rate is about three times higher.
:::

::: check
A capsule with $L/D = 0.3$ is in equilibrium glide at 5 km/s. What deceleration does it feel, and what would a vehicle with $L/D = 1$ feel at the same speed?
:::

::: answer
$a = (g/(L/D))(1 - v^2/v_c^2)$ with $v_c = 7.97\ \mathrm{km/s}$: $1 - 25/63.5 = 0.606$. For $L/D = 0.3$: $a = 9.81 \times 0.606/0.3 = 19.8\ \mathrm{m/s^2} = 2.0\,g_0$. For $L/D = 1$: $5.9\ \mathrm{m/s^2} = 0.6\,g_0$. Higher lift-to-drag spreads the same energy loss over a longer path and a lower deceleration — and a longer time at high temperature, which is the spaceplane's thermal trade.
:::

::: check
A stage's entry burn is shortened and it enters the dense atmosphere at 1.4 km/s instead of 1.0 km/s, still at $\gamma \approx 70^\circ$. By what factor does the peak deceleration change, and what else changes for the thermal environment?
:::

::: answer
$a_{\max} \propto v_E^2$, so the peak rises by $(1.4/1.0)^2 = 1.96$: from $2.4\,g_0$ to about $4.7\,g_0$. The altitude of the peak is unchanged (it depends on $\beta$ and $\gamma$, not $v_E$), but heating rate scales as $v^3$, so the peak heating rate rises by $1.4^3 = 2.7$ — a strong incentive to spend the propellant on the entry burn rather than harden the engine section.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\Delta N = \bar{q} S C_{N\delta}\delta_f$ | control-surface force; effectiveness $\propto \bar{q}$, useless above ~50 km |
| Grid fins | lattice of short-chord plates: low hinge moment, effective supersonically, high stall angle, stow flat; transonic choking |
| Fin authority | ~0.5 rad/s² at 10 km/400 m/s; ~0.03 rad/s² at 40 km/1 km/s for a Falcon-9-class stage |
| $\beta = m/(C_D A)$ | ballistic coefficient, kg/m²; ~2400 engines-first stage, ~540 capsule, ~350 Apollo |
| $v_t = \sqrt{2\beta g/\rho}$ | terminal velocity; 195 m/s for the stage at sea level |
| Allen–Eggers | $v = v_E\exp[-\rho H/(2\beta\sin\gamma)]$; $a_{\max} = v_E^2\sin\gamma/(2eH)$, independent of $\beta$ |
| Peak altitude | $h^* = H\ln[\rho_0 H/(\beta\sin\gamma)]$; higher $\beta$ → lower, hotter peak |
| Equilibrium glide | $L = mg(1 - v^2/v_c^2)$; $a = (g/(L/D))(1 - v^2/v_c^2)$; range $= (L/D)(r/2)\ln[1/(1 - v_E^2/v_c^2)]$ |
| $L/D$ | ~0.3 capsule, ~1 Shuttle, 1.5–2 lifting body; buys range, cross-range and corridor width |

This closes the module. From the standard atmosphere through dynamic pressure, angle of attack, static instability, load relief, wind, bending, slosh and control-structure interaction to the aerodynamics of coming home, the thread has been one quantity — $\bar{q}$ times a coefficient — and what a controller must do about it.
