---
id: l03-mach-regimes-and-drag
title: Mach number, flow regimes and the drag coefficient
minutes: 22
covers:
  - Mach number and the subsonic / transonic / supersonic / hypersonic regimes
  - drag coefficient vs Mach
---

Drop a pebble in a still pond. Ripples spread out in rings, all at the same speed. Now drag a stick through the water. Walk it slowly and the ripples run out ahead of the stick. Walk it faster than the ripples travel and something new happens: the ripples pile up into a V-shaped wake behind the stick, like the wake of a speedboat. The water in front gets no warning at all.

Air does the same thing with sound. A rocket moving slower than sound sends pressure "ripples" ahead that warn the air to move aside. A rocket moving faster than sound outruns its own warnings, and the air piles up into sharp jumps called shock waves. Whether you are slower or faster than your own ripples changes everything about how the air pushes on you.

The max-Q table in the last lesson had a column you took on trust: the **Mach number**. The drag coefficient that turned dynamic pressure into a force depended on it, nearly doubling between Mach 0.8 and Mach 1.2 and then sinking again. A launcher crosses that band almost exactly when dynamic pressure peaks. That is why the drag force peaks there too, and why the point where the air's push acts shifts just when the controller least wants surprises. This lesson defines the Mach number, shows how it measures how much the air gets squashed, walks through the four flow regimes, and builds the drag coefficient curve of a rocket from its parts.

## Mach number

From the first lesson, the speed of sound is $a = \sqrt{\gamma R T}$. It is how fast a small pressure ripple travels through the air. The air ahead of a rocket can only "know" the rocket is coming if those ripples get there first.

The **Mach number** compares the rocket's airspeed with the ripple speed:

$$
M = \frac{v}{a} = \frac{v}{\sqrt{\gamma R T}}.
$$

It is a plain ratio with no units, named after the physicist **[[Ernst Mach|ernst-mach]]**. Mach 2 means twice the local speed of sound.

- Below $M = 1$ the air ahead is warned and moves aside smoothly.
- Above $M = 1$ it cannot be warned. It is caught by surprise and has to adjust all at once, through a **[[shock wave|shock-wave]]** — an almost instant jump in pressure, density and temperature.

Because $a$ depends on temperature, the same airspeed is a different Mach number at different heights. At sea level $a = 340.3\ \mathrm{m/s}$, so 300 m/s is $300/340.3 = 0.88$, Mach 0.88. At the tropopause $a = 295.1\ \mathrm{m/s}$, and 300 m/s is $300/295.1 = 1.02$, Mach 1.02. A rocket climbing into the cold tropopause air goes supersonic sooner than its speed alone suggests.

There is a second way to read $M$. The energy of motion of each kilogram of flowing air is $v^2/2$. The random, jiggling heat energy of each kilogram is about $RT$. So $M^2 = v^2/(\gamma RT)$ is, apart from a constant, the ratio of "directed" energy to "random" energy. When it is small, pushing the air aside barely disturbs its temperature. When it is large, stopping the air turns a lot of motion into heat.

## How much the air gets squashed

Follow the streamline that hits the rocket's nose. The air slows to a stop at the stagnation point. Suppose it stops smoothly, with no heat flowing in or out and no shocks — the **[[isentropic|isentropic]]** case. Energy is conserved, so all its motion becomes heat. That gives the **stagnation temperature** $T_0$:

$$
\frac{T_0}{T} = 1 + \frac{\gamma - 1}{2} M^2 .
$$

Read $T_0$ as "T nought", the temperature where the air has stopped. The same smooth stop gives the stagnation pressure and density:

$$
\frac{p_0}{p} = \left(1 + \frac{\gamma-1}{2}M^2\right)^{\gamma/(\gamma-1)}, \qquad
\frac{\rho_0}{\rho} = \left(1 + \frac{\gamma-1}{2}M^2\right)^{1/(\gamma-1)} .
$$

With $\gamma = 1.4$, the number $\frac{\gamma - 1}{2}$ is $0.2$, and the two powers are $1.4/0.4 = 3.5$ and $1/0.4 = 2.5$.

::: note Why it has to be true
Energy per kilogram of flowing air is its heat content $c_p T$ plus its energy of motion $v^2/2$. Here $c_p$ is the heat needed to warm one kilogram by one kelvin at constant pressure, and for an ideal gas $c_p = \gamma R/(\gamma - 1)$. When the air stops, the motion becomes heat: $c_p T_0 = c_p T + v^2/2$. Divide by $c_p T$:

$$
\frac{T_0}{T} = 1 + \frac{v^2}{2 c_p T} = 1 + \frac{(\gamma - 1)\,v^2}{2\gamma R T} = 1 + \frac{\gamma - 1}{2} M^2 ,
$$

using $M^2 = v^2/(\gamma R T)$ in the last step. For a smooth, no-heat squeeze, an ideal gas obeys $p \propto T^{\gamma/(\gamma-1)}$ and $\rho \propto T^{1/(\gamma-1)}$. Raise the temperature ratio to those powers and you get $p_0/p$ and $\rho_0/\rho$.
:::

The density ratio is the honest measure of how much the air is squashed — its **compressibility**. Here is how it grows:

| $M$ | $\rho_0/\rho$ | $p_0/p$ | $T_0/T$ |
| --- | --- | --- | --- |
| 0.3 | 1.046 | 1.064 | 1.018 |
| 0.5 | 1.130 | 1.186 | 1.050 |
| 0.8 | 1.351 | 1.524 | 1.128 |
| 1.0 | 1.577 | 1.893 | 1.200 |

At Mach 0.3 the air at the nose is only 4.6 % denser than the air around it. That is why flow below about Mach 0.3 is treated as **[[incompressible|incompressible]]** — never squashed — and the simple Bernoulli result $p_0 - p = \tfrac{1}{2}\rho v^2$ holds. At Mach 1 the air at the nose is 58 % denser than ambient, and the simple formulas are off by tens of percent.

### Dynamic pressure from pressure and Mach

One identity is worth remembering, because it gives dynamic pressure from the static pressure and the Mach number alone. Follow the steps:

1. Start from $\bar{q} = \tfrac{1}{2}\rho v^2$.
2. Write the speed as Mach number times sound speed, $v = Ma$, so $\bar{q} = \tfrac{1}{2}\rho a^2 M^2$.
3. From $a^2 = \gamma R T$ and the gas law $p = \rho R T$, we get $\rho a^2 = \gamma p$.
4. So

$$
\bar{q} = \tfrac{1}{2}\rho a^2 M^2 = \frac{\gamma}{2}\, p\, M^2 = 0.7\, p\, M^2 .
$$

At the simulated max-Q, $p = 22\,632\ \mathrm{Pa}$ (at 11 km) and $M = 1.515$, so $M^2 = 2.295$ and

$$
\bar{q} = 0.7 \times 22\,632 \times 2.295 = 36.4\ \mathrm{kPa},
$$

the same value the density route gave. Put another way, $0.7 \times 2.295 = 1.6$: at max-Q the rocket feels a dynamic pressure 1.6 times the pressure of the still air around it.

::: example Mach and stagnation conditions at max-Q
The rocket is at 11 km, moving at 447 m/s.

**Mach number.** $a = 295.1\ \mathrm{m/s}$ there, so $M = 447/295.1 = 1.515$ and $M^2 = 2.295$.

**Stagnation temperature.** $T_0/T = 1 + 0.2 \times 2.295 = 1.459$, so $T_0 = 1.459 \times 216.65 = 316\ \mathrm{K}$. The nose sits in air about 100 K warmer than its surroundings — a mild $43\,^\circ\mathrm{C}$.

**Stagnation pressure.** $p_0/p = 1.459^{3.5} = 3.75$, so $p_0 = 3.75 \times 22.6 = 85\ \mathrm{kPa}$. That is $85 - 22.6 = 62$ kPa above the surrounding pressure, or $62/36.4 = 1.7\,\bar{q}$. The slow-flow Bernoulli answer would have been exactly $1.0\,\bar{q}$. Squashing already matters a lot.

(Because the flow is supersonic, the air really passes through a shock just ahead of the nose first, and that shock throws away some stagnation pressure. At Mach 1.5 the loss is about 7 %.)

**Later in the climb.** At Mach 6 in the same cold air, $T_0/T = 1 + 0.2 \times 36 = 8.2$, and the ideal stagnation temperature would be $8.2 \times 216.65 = 1780\ \mathrm{K}$. That single number is the nose cover's heating problem.

Sanity check: the stagnation temperature rises with $M^2$, so going from Mach 1.5 to Mach 6 — four times the Mach number — multiplies the *rise* above ambient by sixteen: $100 \times 16 = 1600$, close to $1780 - 217 = 1563$ K. It fits.
:::

## The four regimes

Engineers sort flight into four **regimes** by Mach number. The boundaries are fuzzy, because they depend on the body's shape.

**Subsonic, $M < 0.8$.** No shocks anywhere on the body. Pressure ripples run ahead and the flow adjusts smoothly. The coefficients hardly change with Mach, rising gently as the air starts to squash, and the point where the air's push acts stays put. Drag is **skin friction** — air rubbing along the surface — plus the pressure drag where the flow breaks away from the body, mostly at the blunt base.

**Transonic, $0.8 < M < 1.2$.** Air speeds up as it flows over the body's shoulders, so near the body it moves faster than the free stream. Somewhere above Mach 0.8, small pockets of supersonic flow appear on the nose cover and shoulders while the rocket itself is still subsonic, and each pocket ends in a shock. Those shocks thicken the thin layer of slow air hugging the skin, the **[[boundary layer|boundary-layer]]**, and can make it peel away. The drag coefficient climbs steeply: the **drag rise**. As $M$ passes 1, a **bow shock** forms ahead of the nose and the whole pressure pattern rearranges. The **[[center of pressure|centre-of-pressure]]** — the point where the air's total push effectively acts — moves, often by a sizeable fraction of the body length, and the coefficients change fast with $M$. This is the hardest regime to predict, in wind tunnels and in computer models alike, and it coincides with max-Q.

**Supersonic, $1.2 < M < 5$.** Shocks sit attached to sharp tips, and a bow shock stands just ahead of blunt ones. The flow between them is fully supersonic and well described by theory. **Wave drag** — the energy the shock system carries away — is the main pressure drag, but its coefficient falls as $M$ rises, because the shocks lean back more and more. Coefficients change smoothly and predictably, and the center of pressure drifts slowly rearward on most slender bodies.

**Hypersonic, $M > 5$.** The shock hugs the body in a thin layer, and stopping the air heats it so much that the air itself changes: **[[real-gas effects|real-gas]]** appear. Oxygen molecules start to break apart around 2000–2500 K and nitrogen above about 4000 K, the molecules' vibrations soak up energy, and $\gamma$ is no longer 1.4. Pressure coefficients approach the **[[Newtonian|newtonian]]** limit, $C_p \approx 2\sin^2\theta$, where $\theta$ ("theta") is the local angle between the surface and the oncoming flow. That limit does not depend on Mach — the **Mach-independence principle** — so $C_D$ is nearly constant above about Mach 5. Here heating, not force, drives the design.

::: key
Flow regimes by Mach number: subsonic $M < 0.8$ · transonic $0.8$–$1.2$ (drag rise, shifting center of pressure) · supersonic $1.2$–$5$ · hypersonic $M > 5$ (real-gas effects, strong shock layer).
:::

## The drag coefficient of a booster

**Drag** is the part of the air's force that points straight back along the relative wind:

$$
D = \bar{q}\, S\, C_D(M, \alpha).
$$

Here $S$ is the reference area — the core cross-section, $10.52\ \mathrm{m^2}$ for a 3.66 m core — and $C_D$ is the **drag coefficient**. It depends on the Mach number $M$ and the angle of attack $\alpha$ ("alpha"). In a gravity turn the rocket flies nose-first along its path, so $\alpha \approx 0$ and $C_D$ depends on Mach alone. It is built from four parts.

**Forebody pressure drag** comes from the air pressing on the nose cone and the shoulder of the nose cover. For a cone of half-angle $\theta_c$ at high Mach, Newtonian theory gives a pressure coefficient of $2\sin^2\theta_c$ on the cone's surface. Adding that up over the cone gives a drag coefficient of the same value, based on the cone's base area:

- a slender $10^\circ$ cone: $2\sin^2 10^\circ = 0.060$;
- $15^\circ$: 0.134;
- $20^\circ$: 0.234;
- a blunt $30^\circ$ cone: $2 \times 0.5^2 = 0.50$.

Blunt nose covers pay for their extra room in drag.

**Skin friction** over the long cylinder is small per square meter, but there are a lot of square meters. It adds roughly 0.05–0.10 to $C_D$ (measured on the cross-section) and falls slowly with Mach.

**[[Base drag|base-drag]]** is the suction on the flat back end, where the flow breaks away. With the engines off, a blunt base near Mach 1 can add 0.15–0.25 by itself. With the engines running, the exhaust plumes fill much of that region and cut base drag a lot. That is why a rocket's drag tables are always labeled **power-on** or **power-off**.

**Wave drag** is the pressure drag from the shock system. It appears in the transonic rise, dominates in the supersonic range, then fades as the shocks weaken compared with $\bar{q}$.

Add these up for a slender core with a pointed nose cover and you get a **[[curve of this shape|cd-curve]]**:

| $M$ | 0.0–0.6 | 0.8 | 0.95 | 1.05 | 1.2 | 1.5 | 2.0 | 3.0 | 5.0 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $C_D$ | 0.30 | 0.33 | 0.45 | 0.58 | 0.60 | 0.55 | 0.45 | 0.34 | 0.26 | 0.22 |

Every slender launcher shares the shape: a flat stretch near 0.3 below Mach 0.6, nearly doubling through the transonic band with the peak a little above Mach 1, then a slow fall toward a hypersonic floor. The exact numbers are not shared. They depend on how blunt the nose is, on strap-on boosters, on things sticking out of the skin, on power-on versus power-off, and on the **[[Reynolds number|reynolds]]**. A real rocket's table comes from wind-tunnel tests and computer flow models, listed against both $M$ and angle of attack. Treat this one as an honest sketch, and the exercise's use of it as a stand-in for real data.

::: example Drag force and drag deceleration at max-Q
At the simulated max-Q, $\bar{q} = 36.4\ \mathrm{kPa}$ and $M = 1.52$. The table gives $C_D = 0.55$ at Mach 1.5.

**Force.** Multiply dynamic pressure, area and coefficient:

$$
D = 36\,400 \times 10.52 \times 0.55 = 2.11 \times 10^5\ \mathrm{N} = 211\ \mathrm{kN}.
$$

**Deceleration.** The rocket's mass then is 380 t, so drag slows it at $D/m = 211\,000/380\,000 = 0.55\ \mathrm{m/s^2}$. That is $0.55/9.81$, about 5.6 % of $g_0$.

**Compared with thrust.** The thrust is 8.09 MN, so drag is $0.211/8.09$, about 2.6 % of thrust — a nuisance, not a wall.

Summed over the whole climb, drag costs this large rocket about 22 m/s of speed, tiny against the 9.3–9.5 km/s it needs in total. Drag loss scales with $C_D S/m$. A small launcher with a tenth of the mass but a third of the cross-section pays $\tfrac{1/3}{1/10} \approx 3$ times as much per kilogram, which is why small rockets typically lose 100–150 m/s to drag.
:::

::: example Why the drag force peaks before max-Q
In the simulation the drag force peaked at 56 s (218 kN, Mach 1.27), while $\bar{q}$ peaked at 61.8 s.

**At 56 s:** $\bar{q} \approx 35\ \mathrm{kPa}$ and $C_D \approx 0.59$. Their product is $35 \times 0.59 = 20.7\ \mathrm{kPa}$.

**At 61.8 s:** $\bar{q} = 36.4\ \mathrm{kPa}$ and $C_D = 0.55$. Their product is $36.4 \times 0.55 = 20.0\ \mathrm{kPa}$.

Dynamic pressure grew by $36.4/35 = 1.04$, about 4 %. But $C_D$ fell by $0.55/0.59 = 0.93$, about 7 %, as the rocket left the transonic peak. The fall wins, so the force is smaller at max-Q. Whenever a rocket passes Mach 1.1–1.3 shortly before max-Q, as most do, the drag force peaks a few seconds before the dynamic pressure.
:::

## What changes with Mach besides drag

The drag coefficient is the part you see. Two other Mach effects matter more to the control engineer, and the next lessons develop them. The **normal-force slope** $C_{N\alpha}$ ("C N alpha"), which turns angle of attack into sideways force, rises through the transonic band and then falls. And the center of pressure moves — forward through the transonic range on many slender bodies, then rearward when supersonic — which changes the turning push of the air on the rocket and so the instability the controller fights. All of these shift fast across $0.8 < M < 1.2$, the same window where $\bar{q}$ is largest. That is why the flight-control gains are **scheduled** — set differently — by Mach number or by time, and why wind-tunnel data are densest there.

::: warning A C_D needs its area
A drag coefficient without its reference area means nothing. Launch vehicles use the core cross-section, $\pi d^2/4$. Airplanes use the wing area. Some missile data use the diameter squared, $d^2$. The same body with $C_D = 0.3$ on a $d^2$ reference has $C_D = 0.3 \times 4/\pi = 0.38$ on a $\pi d^2/4$ reference. Always carry $C_D S$ as the real physical quantity, and check which $S$ a table assumes before you use it.
:::

::: warning Mach is not a speed
"Supersonic" means $M > 1$ against the *local* speed of sound. A rocket at 300 m/s can be subsonic at the pad and supersonic at 11 km. When you build a $C_D(M)$ lookup, feed it the Mach number worked out with the local $a = \sqrt{\gamma R T}$, never a fixed 340 m/s.
:::

## Check yourself

::: check
A returning booster is at 30 km, falling at 900 m/s. The standard atmosphere gives $T = 226.65\ \mathrm{K}$ there. What is its Mach number, and which regime is it in?
:::

::: answer
**Sound speed:** $a = \sqrt{1.4 \times 287.053 \times 226.65} = 301.8\ \mathrm{m/s}$.

**Mach number:** $M = 900/301.8 = 2.98$.

That is solidly supersonic, in the middle of the 1.2–5 band, where coefficients change smoothly with Mach and wave drag dominates. Lower down it will slow through the transonic range, where grid fins behave most awkwardly.
:::

::: check
Use $\bar{q} = (\gamma/2) p M^2$ to find the dynamic pressure at 20 km and Mach 2.4, where $p = 5\,475\ \mathrm{Pa}$. Check it against $\tfrac{1}{2}\rho v^2$ with $\rho = 0.08803\ \mathrm{kg/m^3}$ and $a = 295.1\ \mathrm{m/s}$.
:::

::: answer
**Pressure route:** $\bar{q} = 0.7 \times 5\,475 \times 2.4^2 = 0.7 \times 5\,475 \times 5.76 = 22.1\ \mathrm{kPa}$.

**Density route:** $v = 2.4 \times 295.1 = 708\ \mathrm{m/s}$, and $\tfrac{1}{2} \times 0.08803 \times 708^2 = 22.1\ \mathrm{kPa}$.

The two agree because both use the same gas law. It also matches the simulation at 80 s: 21.4 kPa at Mach 2.37.
:::

::: check
Why does the drag coefficient of a slender launcher roughly double between Mach 0.8 and Mach 1.1, and why does it fall again by Mach 3?
:::

::: answer
**The rise.** Between 0.8 and 1.1 the flow over the shoulders turns locally supersonic and ends in shocks. The shocks make the boundary layer peel away and spoil the pressure recovery at the back of the shoulders. As the free stream passes Mach 1, a bow shock forms ahead of the nose. Wave drag appears and pressure drag climbs steeply.

**The fall.** Above about Mach 1.2 the shock pattern is settled. As Mach rises, the shocks lean back more, and the pressure coefficients on the nose, which depend roughly on how sharply the flow is turned, fall compared with $\bar{q}$. Base drag fades too. So the coefficient falls, toward a hypersonic value of about 0.2–0.25 that no longer depends on Mach.
:::

::: check
A nose cover is redesigned from a $15^\circ$ half-angle cone to a $20^\circ$ cone to fit a bigger payload. Using the Newtonian estimate, how much does the nose's share of $C_D$ change at high Mach, and what fraction of a total $C_D$ of 0.30 is that?
:::

::: answer
Newtonian cone drag, based on the base area, is $2\sin^2\theta_c$.

$2\sin^2 15^\circ = 0.134$ and $2\sin^2 20^\circ = 0.234$, so the change is $0.234 - 0.134 = 0.100$.

Against a total of 0.30, that is $0.100/0.30$, a third more drag from the nose alone. Real nose covers use rounded (ogive) or blunted shapes, so the change is smaller, but the direction is right: bluntness is paid for in drag, mostly at supersonic speeds.
:::

::: check
Estimate the ideal stagnation temperature on a vehicle at Mach 8 in air at 216.65 K, and explain why the real value is lower.
:::

::: answer
**Ideal value:** $T_0/T = 1 + 0.2 \times 8^2 = 1 + 12.8 = 13.8$, so $T_0 = 13.8 \times 216.65 = 2\,990\ \mathrm{K}$.

**Why lower.** At those temperatures the air molecules start vibrating strongly, and oxygen begins to break apart. Energy that goes into vibration and into breaking bonds does not show up as temperature. In effect $\gamma$ drops below 1.4, and the real stagnation temperature comes out several hundred kelvin lower, around 2600 K. This is the real-gas effect that marks the hypersonic regime.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $M = v/a$, $a = \sqrt{\gamma R T}$ | Mach number, using the local speed of sound |
| $T_0/T = 1 + \tfrac{\gamma-1}{2}M^2$ | stagnation temperature; $p_0/p$ and $\rho_0/\rho$ carry powers 3.5 and 2.5 |
| $\rho_0/\rho$ at $M = 0.3$ | 1.046 — treat as incompressible below about Mach 0.3 |
| $\bar{q} = \tfrac{\gamma}{2} p M^2 = 0.7\,p M^2$ | dynamic pressure from static pressure and Mach |
| Regimes | subsonic $< 0.8$, transonic 0.8–1.2, supersonic 1.2–5, hypersonic $> 5$ |
| $D = \bar{q} S C_D$ | drag; $S$ = core cross-section for launchers |
| $C_D(M)$ of a slender launcher | ~0.3 subsonic, ~0.6 peak near $M \approx 1.1$–1.2, ~0.25 hypersonic |
| Newtonian cone | $C_p \approx 2\sin^2\theta_c$ |
| Drag loss | ~22 m/s for a Falcon-9-class vehicle; 100–150 m/s for small launchers |

The next lesson leaves the nose-first world of the gravity turn. Once the relative wind is not lined up with the rocket's body, the air's force gets a sideways part, and describing it needs the body and wind frames and the angles of attack and sideslip.

::: context ernst-mach Whose name is on the number
Ernst Mach was an Austrian physicist. In 1887 he and Peter Salcher took the first photographs of a bullet flying faster than sound, showing the shock waves around it. Decades later, engineers named the speed ratio after him. So "Mach 2" is not a unit like meters; it is "two times the local speed of sound", and it can mean different speeds at different heights.
:::

::: context shock-wave Outrunning your own sound
Each circle is a sound ripple the object sent out earlier, spreading at the speed of sound. At Mach 2 the object moves twice as far as each ripple grows, so the ripples pile up along a cone. The cone's half-angle $\mu$ satisfies $\sin\mu = 1/M$: at Mach 2 that is $30^\circ$. The pile-up is the shock wave, and when it sweeps over you on the ground you hear a sonic boom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5">
    <circle cx="290" cy="105" r="20"/>
    <circle cx="250" cy="105" r="40"/>
    <circle cx="210" cy="105" r="60"/>
    <circle cx="170" cy="105" r="80"/>
  </g>
  <line x1="330" y1="105" x2="160" y2="6.9" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="330" y1="105" x2="160" y2="203.1" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="330" y1="105" x2="220" y2="105" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="330" cy="105" r="5" fill="#1f2a44"/>
  <path d="M300,105 A30,30 0 0,1 304.0,90.0" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="276" y="96" font-size="12" fill="#1f2a44">μ</text>
  <text x="20" y="24" font-size="12" fill="#b4232c">shock (Mach cone)</text>
  <text x="20" y="196" font-size="12" fill="#1f2a44">M = 2, sin μ = 1/2, μ = 30°</text>
</svg>
```
:::

::: context isentropic A word for "smooth and no heat traded"
"Isentropic" means "at the same entropy". Entropy is physics' measure of how much energy has been spread out into useless disorder. A process is isentropic when nothing is wasted: no friction, no shocks, and no heat flowing in or out. Real flows are close to this away from walls and shocks, which is why the isentropic formulas work well in front of a subsonic nose. A shock is the opposite — it creates entropy — which is why it destroys some stagnation pressure.
:::

::: context incompressible Why Mach 0.3 is the line
No gas is truly incompressible. But if the density changes by only a few percent, treating it as fixed makes the maths far simpler and the answers nearly right. At Mach 0.3 the density at the nose rises by 4.6 %, and the stagnation pressure differs from the simple Bernoulli value by about 2 %. That is the usual cutoff. Cars, wind turbines and most of a rocket's first twenty seconds are "incompressible"; everything near max-Q is not.
:::

::: context boundary-layer The thin layer that clings
Air right against the skin sticks to it and does not move. A little further out it moves a little; further still it reaches the full stream speed. That thin zone of slowed air is the boundary layer — on a rocket, a few centimeters thick near the nose and a few tens of centimeters near the tail. Skin friction comes from it. When a shock or a sharp corner pushes against it, it can lift off the surface entirely, called **separation**, and the swirling wake left behind adds a lot of drag.
:::

::: context centre-of-pressure Where the push effectively acts
The air pushes on every bit of the rocket's skin. For balance, you can replace all those pushes with one total force acting at one point: the center of pressure. Whether that point sits ahead of or behind the center of mass decides whether the rocket weathervanes back into the wind or flips away from it. Two lessons from now, that comparison — the static margin — explains why a launcher is unstable and needs its engines steered constantly.
:::

::: context real-gas When air stops acting like simple air
The formulas in this lesson treat air as a simple gas with $\gamma = 1.4$. That works while molecules only fly around and spin. Heat air to a couple of thousand kelvin and its molecules also vibrate like springs, soaking up energy. Hotter still, oxygen molecules break into single atoms, and then nitrogen does. Each of these steals energy that would have raised the temperature. Returning capsules meet this in full: the glowing air around them is partly broken apart, and the heat shield is designed with real-gas models, not the simple formulas.
:::

::: context newtonian Newton's rain of particles
Isaac Newton pictured air as a rain of separate particles that hit a surface, give up the part of their momentum pointing into it, and slide off. For ordinary flight that picture is poor. But at hypersonic speed the shock hugs the body so closely that it works surprisingly well. A surface tilted at angle $\theta$ to the flow gets a pressure coefficient of about $2\sin^2\theta$ — steep surfaces take the full hit, shallow ones hardly any.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="120,100 300,51.8 300,148.2" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="100" x2="310" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M170,100 A50,50 0 0,0 168.3,87.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="176" y="92" font-size="12" fill="#b4232c">θc = 15°</text>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="20" y1="60" x2="80" y2="60"/><line x1="20" y1="80" x2="80" y2="80"/>
    <line x1="20" y1="120" x2="80" y2="120"/><line x1="20" y1="140" x2="80" y2="140"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="88,60 78,55 78,65"/><polygon points="88,80 78,75 78,85"/>
    <polygon points="88,120 78,115 78,125"/><polygon points="88,140 78,135 78,145"/>
  </g>
  <text x="20" y="44" font-size="12" fill="#1d6fd1">oncoming flow</text>
  <text x="120" y="182" font-size="12" fill="#1f2a44">C_D ≈ 2 sin²θc = 0.134 (base area)</text>
</svg>
```
:::

::: context base-drag The suction behind a flat tail
Air flowing past the end of a rocket cannot turn sharply around the flat base, so it leaves a pocket of low pressure behind it — like the dusty swirl behind a truck on the highway. That low pressure pulls backward on the base. When the engines fire, the hot exhaust fills much of the pocket and raises its pressure, so base drag drops. After the engines cut off — for example a booster falling back — the full base suction returns.
:::

::: context cd-curve The drag coefficient against Mach
The table's numbers drawn as a curve, from Mach 0 to 5. The hump just above Mach 1 is the transonic drag rise; the long slope after it is wave drag easing off. At Mach 10 the curve is down to about 0.22.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="68.0" y="18" width="56.0" height="162" fill="#f2b880" opacity="0.35"/>
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,105.0 73.6,105.0 84.8,97.5 93.2,67.5 98.8,35.0 107.2,30.0 124.0,42.5 152.0,67.5 208.0,95.0 320.0,115.0"/>
  <g font-size="11" fill="#1f2a44">
    <text x="34" y="134" text-anchor="end">0.2</text>
    <text x="34" y="84" text-anchor="end">0.4</text>
    <text x="34" y="34" text-anchor="end">0.6</text>
    <text x="40" y="195" text-anchor="middle">0</text>
    <text x="96" y="195" text-anchor="middle">1</text>
    <text x="152" y="195" text-anchor="middle">2</text>
    <text x="208" y="195" text-anchor="middle">3</text>
    <text x="264" y="195" text-anchor="middle">4</text>
    <text x="320" y="195" text-anchor="middle">5</text>
    <text x="330" y="172" text-anchor="end">Mach</text>
    <text x="130" y="28">transonic 0.8–1.2</text>
    <text x="200" y="130" fill="#1d6fd1">C_D</text>
  </g>
</svg>
```
:::

::: context reynolds The other number that sets drag
The Reynolds number compares how strongly air keeps moving (its momentum) with how strongly it sticks to itself (its viscosity): $Re = \rho v L/\mu$, with $L$ a length and $\mu$ the air's stickiness. For a rocket it runs into the hundreds of millions. It decides how thick the boundary layer is and whether it is smooth or churning, and so it sets the skin friction. Wind-tunnel models are small, so their Reynolds number is lower than the real rocket's, and engineers have to correct for that.
:::
