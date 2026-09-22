---
id: l03-mach-regimes-and-drag
title: Mach number, flow regimes and the drag coefficient
minutes: 18
covers:
  - Mach number and the subsonic / transonic / supersonic / hypersonic regimes
  - drag coefficient vs Mach
---

The max-Q table in the last lesson had a column you were asked to take on trust: the Mach number. The drag coefficient that turned dynamic pressure into a force depended on it, rising by a factor of two between Mach 0.8 and Mach 1.2 and then decaying. A launch vehicle crosses that band at almost exactly the moment dynamic pressure peaks, which is why the drag force peaks there too and why the aerodynamic centre of pressure shifts just when the controller least wants surprises.

The Mach number is the ratio of the vehicle's airspeed to the local speed of sound. It measures how compressible the flow is — how much the air's density changes as it is pushed aside — and it sorts flight into four regimes with qualitatively different physics: subsonic, transonic, supersonic and hypersonic. A booster experiences all four on the way up, and a returning stage experiences them again in reverse on the way down.

This lesson defines the Mach number properly, derives the compressibility relations that make it meaningful, describes the regimes and what happens to a slender body in each, and then builds up the drag coefficient curve of a launch vehicle from its physical parts. The result is the $C_D(M)$ table the max-Q simulation used, and the reason its shape is what it is.

## Mach number

The speed of sound $a = \sqrt{\gamma R T}$ is the speed at which a small pressure disturbance propagates through the gas. Air ahead of a body can only "know" the body is coming if pressure signals from it arrive first. The **Mach number**

$$
M = \frac{v}{a} = \frac{v}{\sqrt{\gamma R T}}
$$

compares the body's speed to the signal speed. Below $M = 1$ the air ahead is warned and rearranges itself smoothly; above $M = 1$ it cannot be warned and is caught unprepared, adjusting through a **shock wave** — an almost discontinuous jump in pressure, density and temperature.

Because $a$ depends on temperature, the same airspeed is a different Mach number at different altitudes. At sea level $a = 340.3\ \mathrm{m/s}$, so 300 m/s is $M = 0.88$; at the tropopause $a = 295.1\ \mathrm{m/s}$, and 300 m/s is $M = 1.02$. A vehicle climbing into the cold tropopause air goes supersonic sooner than its ground speed suggests.

There is a second way to read $M$. The kinetic energy per unit mass of the flow is $v^2/2$ and the thermal energy per unit mass is of order $RT$, so $M^2 = v^2/(\gamma RT)$ is, up to a constant, the ratio of directed kinetic energy to random thermal energy. When that ratio is small the air's compression by the body is a small perturbation of its thermal state; when it is large, stopping the air converts a great deal of kinetic energy into heat.

## Compressibility and the stagnation relations

Bring a stream of air isentropically to rest, as happens along the streamline that hits the nose. Energy conservation for a perfect gas gives the **stagnation temperature**

$$
\frac{T_0}{T} = 1 + \frac{\gamma - 1}{2} M^2 ,
$$

and the isentropic relations $p \propto T^{\gamma/(\gamma-1)}$ and $\rho \propto T^{1/(\gamma-1)}$ give the stagnation pressure and density:

$$
\frac{p_0}{p} = \left(1 + \frac{\gamma-1}{2}M^2\right)^{\gamma/(\gamma-1)}, \qquad
\frac{\rho_0}{\rho} = \left(1 + \frac{\gamma-1}{2}M^2\right)^{1/(\gamma-1)} .
$$

With $\gamma = 1.4$ the exponents are 3.5 and 2.5. The density ratio is the honest measure of compressibility, and here is how it grows:

| $M$ | $\rho_0/\rho$ | $p_0/p$ | $T_0/T$ |
| --- | --- | --- | --- |
| 0.3 | 1.046 | 1.064 | 1.018 |
| 0.5 | 1.130 | 1.186 | 1.050 |
| 0.8 | 1.351 | 1.524 | 1.128 |
| 1.0 | 1.577 | 1.893 | 1.200 |

At $M = 0.3$ the air at the stagnation point is only 4.6 % denser than the free stream, which is why flows below about Mach 0.3 are treated as incompressible and the Bernoulli form $p_0 - p = \tfrac{1}{2}\rho v^2$ holds. At Mach 1 the density at the nose is 58 % above ambient and the incompressible formulas are off by tens of percent.

One identity is worth memorising because it lets you check a dynamic pressure from pressure and Mach alone. Since $v = Ma$ and $a^2 = \gamma p/\rho$,

$$
\bar{q} = \tfrac{1}{2}\rho v^2 = \tfrac{1}{2}\rho a^2 M^2 = \frac{\gamma}{2}\, p\, M^2 = 0.7\, p\, M^2 .
$$

At the simulated max-Q, $p = 22\,632\ \mathrm{Pa}$ (11 km) and $M = 1.516$, so $\bar{q} = 0.7 \times 22\,632 \times 2.297 = 36.4\ \mathrm{kPa}$, exactly the value the density route gave. In other words the vehicle at max-Q is exposed to a dynamic pressure of $1.6$ times the ambient static pressure.

::: example Mach and stagnation conditions at max-Q
At 11 km and 447 m/s, $a = 295.1\ \mathrm{m/s}$, so $M = 447/295.1 = 1.515$ and $M^2 = 2.295$. The stagnation temperature ratio is $1 + 0.2 \times 2.295 = 1.459$, giving $T_0 = 1.459 \times 216.65 = 316\ \mathrm{K}$: the nose is bathed in air 100 K warmer than the surrounding atmosphere, a mild 43 °C. The isentropic stagnation pressure ratio is $1.459^{3.5} = 3.75$, so the ideal stagnation pressure is $3.75 \times 22.6 = 85\ \mathrm{kPa}$, about $2.8\bar{q}$ above ambient rather than the incompressible $1.0\bar{q}$ — compressibility has already changed the nose pressure substantially. (Because the flow is supersonic, the air actually passes through a bow shock first, which destroys some stagnation pressure; at $M = 1.5$ the loss is about 7 %.) At Mach 6, later in the flight in the same cold air, $T_0/T = 1 + 0.2 \times 36 = 8.2$ and the ideal stagnation temperature would be 1780 K — the fairing's thermal problem in a single number.
:::

## The four regimes

Flow regimes are conventionally bounded by Mach number, with the boundaries fuzzy because they depend on shape.

**Subsonic, $M < 0.8$.** No shocks anywhere on the body. Pressure disturbances run ahead and the flow adjusts smoothly. Aerodynamic coefficients are nearly constant with Mach, rising gently as compressibility grows, and the centre of pressure stays put. Drag is skin friction plus the pressure drag of flow separation, notably at the blunt base.

**Transonic, $0.8 < M < 1.2$.** The air accelerates over the body's shoulders, so local speeds exceed the free stream. Somewhere above $M \approx 0.8$ pockets of locally supersonic flow appear on the fairing and shoulders while the free stream is still subsonic; each pocket ends in a shock. Shocks thicken and separate the boundary layer and cost pressure recovery, and the drag coefficient rises steeply — the **drag rise** or drag divergence. As $M$ passes 1 a bow shock forms ahead of the nose and the whole pressure distribution rearranges, moving the centre of pressure, often by a significant fraction of the body length, and making the aerodynamic coefficients change quickly with $M$. This is the least predictable regime for both wind-tunnel and computational work, and it coincides with max-Q.

**Supersonic, $1.2 < M < 5$.** Shocks are attached to sharp features and a bow shock stands ahead of blunt ones; the flow between them is entirely supersonic and well described by oblique-shock and linearised theory. Wave drag — the energy carried away by the shock system — dominates pressure drag, but its coefficient falls with increasing Mach as the shocks become more oblique. Coefficients vary smoothly and predictably. The centre of pressure moves slowly aft on most slender bodies.

**Hypersonic, $M > 5$.** The shock layer is thin and hugs the body, and stopping the air heats it so much that real-gas effects appear: oxygen molecules start to dissociate around 2000–2500 K and nitrogen above about 4000 K, vibrational modes are excited, and $\gamma$ is no longer 1.4. Pressure coefficients approach the **Newtonian** limit $C_p \approx 2\sin^2\theta$, with $\theta$ the local angle between surface and free stream, and become independent of Mach — the **Mach-independence principle** — so that $C_D$ is nearly constant above $M \approx 5$. Heating, not force, becomes the design driver.

::: key
Flow regimes by Mach number: subsonic $M < 0.8$ · transonic $0.8$–$1.2$ (drag rise, shifting centre of pressure) · supersonic $1.2$–$5$ · hypersonic $M > 5$ (real-gas effects, strong shock layer).
:::

## Drag and the drag coefficient of a booster

Drag is the component of aerodynamic force along the relative wind, written as

$$
D = \bar{q}\, S\, C_D(M, \alpha),
$$

with $S$ the reference area — the core cross-section, $10.52\ \mathrm{m^2}$ for a 3.66 m core — and $C_D$ the **drag coefficient**. At the zero angle of attack of a gravity turn, $C_D$ is a function of Mach number alone, and it is built from four contributions.

*Forebody pressure drag* comes from the pressure on the nose cone and fairing shoulder. For a cone of half-angle $\theta_c$ at high Mach, Newtonian theory gives a pressure coefficient of $2\sin^2\theta_c$ on the cone surface, and integrating over the cone gives a drag coefficient of the same value based on the base area: 0.060 for a slender 10° cone, 0.134 for 15°, 0.234 for 20°, 0.50 for a blunt 30° cone. Blunt fairings pay for their volume in drag.

*Skin friction* over the long cylinder is small per unit area but the area is large; it contributes roughly 0.05–0.10 to $C_D$ based on cross-section and falls slowly with Mach as the boundary layer thins.

*Base drag* is the suction on the flat aft end where the flow separates. Power-off, a blunt base at transonic speed can contribute 0.15–0.25 by itself. Power-on, the exhaust plumes fill much of the base region and cut base drag substantially, so launch-vehicle drag tables are always labelled power-on or power-off.

*Wave drag* is the pressure drag associated with the shock system, appearing through the transonic rise and dominating in the supersonic regime, then decaying as the shocks weaken relative to $\bar{q}$.

Add these up for a slender core with a conical-ogive fairing and you get a curve of this representative shape:

| $M$ | 0.0–0.6 | 0.8 | 0.95 | 1.05 | 1.2 | 1.5 | 2.0 | 3.0 | 5.0 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $C_D$ | 0.30 | 0.33 | 0.45 | 0.58 | 0.60 | 0.55 | 0.45 | 0.34 | 0.26 | 0.22 |

The subsonic plateau near 0.3, the doubling through the transonic band with the peak just above Mach 1, and the slow supersonic decay toward a hypersonic asymptote are common to every slender launcher. The exact numbers are not: they depend on fairing bluntness, on strap-on boosters, on protuberances, on power-on versus power-off, and on Reynolds number, and a real vehicle's table comes from wind-tunnel tests and CFD, tabulated against both $M$ and angle of attack. Treat this table as an honest sketch, and the exercise's use of it as a stand-in for the vehicle's own data.

::: example Drag force and drag deceleration at max-Q
At the simulated max-Q, $\bar{q} = 36.4\ \mathrm{kPa}$, $M = 1.52$ and the table gives $C_D = 0.55$. With $S = 10.52\ \mathrm{m^2}$,

$$
D = 36\,400 \times 10.52 \times 0.55 = 2.11 \times 10^5\ \mathrm{N} = 211\ \mathrm{kN}.
$$

The vehicle mass at that instant is 380 t, so the drag deceleration is $D/m = 0.55\ \mathrm{m/s^2}$, about 5.6 % of $g_0$. The thrust is 8.09 MN, so drag is 2.6 % of thrust — a nuisance, not a wall. Integrated over the whole ascent the drag loss for this large vehicle is about 22 m/s, small against the 9.3–9.5 km/s ideal $\Delta v$. Drag loss scales with $C_D S/m$: a small launcher with a tenth of the mass but a third of the cross-section pays three times as much per kilogram, and drag losses of 100–150 m/s are typical for small vehicles.
:::

::: example Why the drag force peaks before max-Q
In the simulation the drag force peaked at 56 s (218 kN, Mach 1.27) while $\bar{q}$ peaked at 61.8 s. At 56 s, $\bar{q} \approx 35\ \mathrm{kPa}$ and $C_D \approx 0.59$, product $20.7\ \mathrm{kPa}$; at 61.8 s, $\bar{q} = 36.4$ and $C_D = 0.55$, product $20.0\ \mathrm{kPa}$. The 4 % gain in dynamic pressure is outweighed by the 7 % fall in $C_D$ as the vehicle leaves the transonic peak. Whenever a vehicle passes Mach 1.1–1.3 shortly before max-Q, as most do, the drag force leads the dynamic-pressure peak by a few seconds.
:::

## What changes with Mach besides drag

The drag coefficient is the visible part. Two other Mach effects matter more to the control engineer and are developed in the following lessons. The **normal-force slope** $C_{N\alpha}$, which converts angle of attack into side force, rises through the transonic band and then declines. And the **centre of pressure** moves — forward through the transonic range on many slender bodies, then aft supersonically — which changes the vehicle's aerodynamic moment and therefore the unstable pole the controller fights. Because these all shift rapidly across $0.8 < M < 1.2$, the same window in which $\bar{q}$ is largest, the flight control gains are scheduled against Mach (or time) and the wind-tunnel database is densest there.

::: warning
A drag coefficient without its reference area is a number without meaning. Launch vehicles use the core cross-section; aircraft use wing planform area; some missile references use body diameter squared. A $C_D$ of 0.3 on one convention can be 0.38 on another for the same body. Always carry $C_D S$ as the physical quantity, and check which $S$ a table assumes before you use it.
:::

::: warning
Do not mix Mach regimes with speeds. "Supersonic" means $M > 1$ relative to the local sound speed, and a vehicle at 300 m/s can be subsonic at the pad and supersonic at 11 km. When you build a $C_D(M)$ lookup, feed it the Mach number computed with the local $a = \sqrt{\gamma R T}$, never a fixed 340 m/s.
:::

## Check yourself

::: check
A returning booster is at 30 km altitude descending at 900 m/s. What is its Mach number, and which flow regime is it in? The standard atmosphere gives $T = 226.65\ \mathrm{K}$ at 30 km.
:::

::: answer
$a = \sqrt{1.4 \times 287.053 \times 226.65} = 301.8\ \mathrm{m/s}$, so $M = 900/301.8 = 2.98$: solidly supersonic, in the middle of the 1.2–5 band, where coefficients vary smoothly with Mach and wave drag dominates. It will decelerate through the transonic regime lower down, where the grid fins have their most awkward behaviour.
:::

::: check
Use the identity $\bar{q} = (\gamma/2) p M^2$ to find the dynamic pressure at 20 km altitude and Mach 2.4, where $p = 5\,475\ \mathrm{Pa}$. Check against $\tfrac{1}{2}\rho v^2$ with $\rho = 0.08803\ \mathrm{kg/m^3}$ and $a = 295.1\ \mathrm{m/s}$.
:::

::: answer
$\bar{q} = 0.7 \times 5\,475 \times 2.4^2 = 0.7 \times 5\,475 \times 5.76 = 22.1\ \mathrm{kPa}$. Via density: $v = 2.4 \times 295.1 = 708\ \mathrm{m/s}$, and $\tfrac{1}{2} \times 0.08803 \times 708^2 = 22.1\ \mathrm{kPa}$. The two routes agree because both use the same ideal-gas state; this matches the simulation's value at 80 s (21.4 kPa at Mach 2.37).
:::

::: check
Why does the drag coefficient of a slender launch vehicle roughly double between Mach 0.8 and Mach 1.1, and why does it then fall again by Mach 3?
:::

::: answer
Between 0.8 and 1.1 the flow over the shoulders becomes locally supersonic and terminates in shocks; the shocks separate the boundary layer, spoil pressure recovery, and — as the free stream passes Mach 1 — a bow shock forms ahead of the nose. Wave drag appears and pressure drag rises sharply. Above about Mach 1.2 the shock system is established; with increasing Mach the shocks become more oblique and the pressure coefficients on the forebody, which scale roughly with the flow deflection angle, fall relative to $\bar{q}$, while base drag also decays. The coefficient therefore falls, approaching a Mach-independent hypersonic value near 0.2–0.25.
:::

::: check
A fairing nose is redesigned from a 15° half-angle cone to a 20° cone to gain payload volume. Using the Newtonian estimate, by how much does the nose's contribution to $C_D$ change at high Mach, and what fraction of a total $C_D$ of 0.30 is that?
:::

::: answer
Newtonian cone drag based on the base area is $2\sin^2\theta_c$: $2\sin^2 15^\circ = 0.134$ and $2\sin^2 20^\circ = 0.234$, an increase of 0.100. Against a total of 0.30 that is a third more drag from the nose alone. In practice fairings use ogive or blunted shapes and the change is smaller, but the direction is right: bluntness is paid for in drag, and the payment is made mostly at supersonic speeds.
:::

::: check
Estimate the ideal stagnation temperature on a vehicle at Mach 8 in air at 216.65 K, and explain why the real value is lower.
:::

::: answer
$T_0/T = 1 + 0.2 \times 64 = 13.8$, so $T_0 = 13.8 \times 216.65 = 2\,990\ \mathrm{K}$. At that temperature oxygen is substantially dissociated and vibrational modes are fully excited, so energy goes into breaking bonds and internal modes rather than translational temperature; the effective $\gamma$ drops below 1.4 and the real stagnation temperature is lower, roughly 2\,300–2\,500 K. This is the real-gas effect that defines the hypersonic regime.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $M = v/a$, $a = \sqrt{\gamma R T}$ | Mach number with the local speed of sound |
| $T_0/T = 1 + \tfrac{\gamma-1}{2}M^2$ | stagnation temperature; $p_0/p$ and $\rho_0/\rho$ carry exponents 3.5 and 2.5 |
| $\rho_0/\rho$ at $M = 0.3$ | 1.046 — incompressible below about Mach 0.3 |
| $\bar{q} = \tfrac{\gamma}{2} p M^2 = 0.7\,p M^2$ | dynamic pressure from static pressure and Mach |
| Regimes | subsonic $< 0.8$, transonic 0.8–1.2, supersonic 1.2–5, hypersonic $> 5$ |
| $D = \bar{q} S C_D$ | drag; $S$ = core cross-section for launchers |
| $C_D(M)$ of a slender launcher | ~0.3 subsonic, ~0.6 peak near $M \approx 1.1$–1.2, ~0.25 hypersonic |
| Newtonian cone | $C_p \approx 2\sin^2\theta_c$ |
| Drag loss | ~22 m/s for a Falcon-9-class vehicle; 100–150 m/s for small launchers |

The next lesson leaves the zero-angle-of-attack world of the gravity turn. Once the relative wind is not aligned with the body axis, the aerodynamic force acquires a component perpendicular to the vehicle, and describing it requires the body and wind frames and the angles of attack and sideslip.
