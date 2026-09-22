---
id: l02-dynamic-pressure-and-max-q
title: Dynamic pressure and max-Q
minutes: 19
covers:
  - dynamic pressure and max-Q
---

Watch a launch webcast and about a minute after lift-off the commentator says "max-Q". The vehicle is 10 to 14 km up, moving at one and a half times the speed of sound, and the air is pushing on it harder than it ever will again. The structures team designed the fairing, the interstage and the tank walls for this instant; the guidance team shaped the pitch program so the vehicle would pass through it at nearly zero angle of attack; the propulsion team may have throttled the engines down to make it survivable. Everything in this module about loads, instability and load relief is scaled by the quantity that peaks here.

That quantity is dynamic pressure, $\bar{q} = \tfrac{1}{2}\rho v^2$, where $\rho$ is the air density from the last lesson and $v$ is the vehicle's speed relative to the air. It has the units of a pressure, and every aerodynamic force on the vehicle — drag, lift, the normal force that tries to bend the airframe — is dynamic pressure multiplied by a reference area and a dimensionless coefficient. Get $\bar{q}$ right and the rest of aerodynamics is coefficients.

This lesson defines dynamic pressure, shows why it must have a maximum on any ascent, derives a closed-form estimate of where and how big that maximum is, and then locates it on a simulated gravity-turn trajectory of a Falcon-9-class vehicle. Along the way you will build the procedure the max-Q exercise asks you to code.

## What dynamic pressure is

Take a stream of air of density $\rho$ moving at speed $v$ and bring it to rest against a flat plate. Each cubic metre of air carries kinetic energy $\tfrac{1}{2}\rho v^2$, and the momentum crossing a unit area per second is $\rho v \cdot v = \rho v^2$. Bernoulli's equation for incompressible flow says the pressure at the stagnation point exceeds the free-stream pressure by exactly

$$
p_0 - p_\infty = \tfrac{1}{2}\rho v^2 \equiv \bar{q}.
$$

This is the **dynamic pressure**. It is the pressure rise the moving air can produce when stopped, and therefore the natural scale for every pressure difference the flow can set up anywhere on the body. Multiply by an area to get a force, and by a shape-dependent coefficient to account for how the actual pressure distribution differs from the ideal stagnation value:

$$
F = \bar{q}\, S\, C_F .
$$

Here $S$ is a **reference area** — for a launch vehicle, by convention the cross-sectional area of the core, $S = \pi d^2/4$, which is $10.52\ \mathrm{m^2}$ for a 3.66 m diameter — and $C_F$ is the coefficient (drag $C_D$, normal force $C_N$, and so on). The coefficient depends on shape, Mach number and angle of attack; the reference area is a bookkeeping choice; all the dependence on flight condition sits in $\bar{q}$.

The speed in $\bar{q}$ is the speed **relative to the air**, not relative to the ground or to an inertial frame. A 50 m/s headwind at an airspeed of 400 m/s raises $\bar{q}$ by a factor $(450/400)^2 = 1.27$. In an ascent simulation you compute $\mathbf{v}_{\text{rel}} = \mathbf{v} - \mathbf{w}$ with $\mathbf{w}$ the wind vector, and square the magnitude of that.

The overbar in $\bar{q}$ distinguishes dynamic pressure from heat flux $q$ in aerothermodynamics; many texts and most code drop it and write plain $q$. This module keeps the bar in prose and uses `q` in code.

::: key
Dynamic pressure: $\bar{q} = \tfrac{1}{2}\rho v^2$, with $v$ the speed relative to the air. It has units of pressure (Pa), and every aerodynamic force is $\bar{q}$ × reference area × a dimensionless coefficient.
:::

Some magnitudes to calibrate against. A 100 m/s gust at sea level: $\tfrac{1}{2} \times 1.225 \times 100^2 = 6.1\ \mathrm{kPa}$. An airliner cruising at 250 m/s at 11 km, where $\rho = 0.3639$: $11.4\ \mathrm{kPa}$. A launcher at max-Q: 25 to 40 kPa, a third of an atmosphere pushing on every square metre of the nose.

## Why ascent has a max-Q

On a rocket climbing out of the atmosphere, speed increases monotonically while density decreases monotonically, and $\bar{q}$ is their product. At lift-off $v = 0$ so $\bar{q} = 0$. In space $\rho = 0$ so $\bar{q} = 0$ again. In between it must rise and fall, and the peak is **max-Q**.

Make this quantitative with the exponential atmosphere, $\rho = \rho_0 e^{-h/H}$. Then

$$
\bar{q}(t) = \tfrac{1}{2}\rho_0\, e^{-h(t)/H}\, v(t)^2 ,
$$

and differentiating the logarithm,

$$
\frac{d}{dt}\ln\bar{q} = \frac{2\dot{v}}{v} - \frac{\dot{h}}{H}.
$$

Early in flight $v$ is small so $2\dot{v}/v$ is large and $\bar{q}$ grows quickly. As $v$ increases the first term falls as $1/v$ while the climb rate $\dot h = v\sin\gamma$ grows; the two cross and $\bar{q}$ peaks. The condition for the maximum is

$$
\frac{2\dot{v}}{v} = \frac{\dot{h}}{H}
\quad\Longleftrightarrow\quad
v^2 \sin\gamma = 2 H \dot{v},
$$

with $\gamma$ the flight-path angle above the horizon. Density falls exponentially in altitude, speed grows only polynomially in time, and an exponential always wins eventually: that is the whole story of the peak.

## A closed-form estimate

Assume the vehicle flies a straight line at flight-path angle $\gamma$ with constant acceleration $a$ from rest, so $v = at$ and the distance along the path is $\tfrac{1}{2}at^2$, giving $h = \tfrac{1}{2}at^2\sin\gamma$. Introduce $u = h/H$, so that $t^2 = 2Hu/(a\sin\gamma)$ and

$$
\bar{q} = \tfrac{1}{2}\rho_0 a^2 t^2 e^{-u} = \frac{\rho_0\, a\, H}{\sin\gamma}\; u\, e^{-u}.
$$

The function $u e^{-u}$ has its maximum at $u = 1$, where it equals $1/e$. Therefore

$$
h^* = H, \qquad
\bar{q}_{\max} = \frac{\rho_0\, a\, H}{e\,\sin\gamma}, \qquad
v^* = \sqrt{\frac{2 a H}{\sin\gamma}}, \qquad
t^* = \frac{v^*}{a}.
$$

Three things fall out of this. First, in this model max-Q always occurs at one scale height of altitude, whatever the acceleration and whatever the flight-path angle — around 8 km for the 8.5 km fit, and a little higher in reality because the true density scale height in the troposphere is 9 to 10 km. Second, $\bar{q}_{\max}$ is proportional to the acceleration: a vehicle that accelerates harder reaches a given altitude at a higher speed and meets the same density with more $v^2$. Throttling down through the region directly lowers the peak. Third, a shallower trajectory (smaller $\sin\gamma$) raises the peak, because the vehicle covers more path length, hence gains more speed, per metre of altitude.

::: example A quick max-Q estimate
Take $a = 8\ \mathrm{m/s^2}$ of net acceleration, a flight-path angle of $60^\circ$ through the peak, and $H = 8.5\ \mathrm{km}$. Then

$$
\bar{q}_{\max} = \frac{1.225 \times 8 \times 8500}{2.718 \times 0.866} = 35.4\ \mathrm{kPa},
$$

at $h^* = 8.5\ \mathrm{km}$, with $v^* = \sqrt{2 \times 8 \times 8500 / 0.866} = 396\ \mathrm{m/s}$ and $t^* = 396/8 = 49.5\ \mathrm{s}$. Reduce the acceleration to 6 m/s² and steepen to $70^\circ$ and the estimate drops to 24.5 kPa at 329 m/s. Every number here is in the right range for a real orbital launcher, which is a good sign that the model captures the mechanism even though it ignores the variable thrust-to-weight, the drag and the curved trajectory.
:::

## Locating max-Q on a gravity-turn trajectory

The dynamics module gave you a flat-Earth gravity-turn model: $\dot v = T/m - D/m - g\sin\gamma$, $\dot\gamma = -(g/v)\cos\gamma$, $\dot h = v\sin\gamma$, $\dot m = -T/(I_{sp} g_0)$, with drag $D = \bar{q} S C_D$ and no lift because the vehicle flies at zero angle of attack. Attach the standard atmosphere for $\rho(h)$ and $a(h)$, a drag coefficient that depends on Mach number (next lesson), and fly a Falcon-9-class vehicle: lift-off mass 549 t, sea-level thrust 7.61 MN rising to 8.23 MN in vacuum, specific impulse 282 s at sea level and 311 s in vacuum, diameter 3.66 m, a 1.0° pitch kick at 50 m/s and no throttling. The result, sampled every ten seconds:

| $t$ (s) | $h$ (km) | $v$ (m/s) | $M$ | $\rho$ (kg/m³) | $\bar{q}$ (kPa) | $\gamma$ (°) | $D$ (kN) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0.0 | 0 | 0.00 | 1.225 | 0.0 | 90 | 0 |
| 10 | 0.2 | 44 | 0.13 | 1.200 | 1.2 | 90 | 4 |
| 20 | 0.9 | 97 | 0.29 | 1.121 | 5.2 | 87 | 16 |
| 30 | 2.2 | 159 | 0.48 | 0.989 | 12.5 | 83 | 39 |
| 40 | 4.1 | 233 | 0.72 | 0.811 | 22.1 | 78 | 74 |
| 50 | 6.8 | 322 | 1.03 | 0.605 | 31.3 | 72 | 182 |
| 60 | 10.3 | 426 | 1.43 | 0.400 | 36.2 | 67 | 214 |
| 70 | 14.7 | 551 | 1.87 | 0.205 | 31.0 | 62 | 156 |
| 80 | 20.0 | 700 | 2.37 | 0.087 | 21.4 | 58 | 92 |
| 90 | 26.5 | 875 | 2.92 | 0.031 | 11.9 | 54 | 44 |
| 100 | 34.2 | 1080 | 3.52 | 0.009 | 5.4 | 50 | 18 |
| 120 | 53.5 | 1597 | 4.91 | 0.001 | 0.8 | 44 | 2 |

Density has fallen by a factor of three by 60 s while $v^2$ has grown without bound, and the product tops out between 50 and 70 s. Scanning at the simulation's 0.05 s step, the peak is $\bar{q}_{\max} = 36.4\ \mathrm{kPa}$ at $t = 61.8\ \mathrm{s}$, $h = 11.0\ \mathrm{km}$, $v = 447\ \mathrm{m/s}$, Mach 1.52 and $\gamma = 66^\circ$, with the vehicle mass down to 380 t. The peak is broad: $\bar{q}$ stays within 90 % of its maximum from 52 to 68 s and within 80 % from 47 to 72 s. Structurally, "max-Q" is a twenty-second window, not an instant.

Check the maximum condition at the peak. The simulation gives $\dot v = 11.8\ \mathrm{m/s^2}$ and $\dot h = 410\ \mathrm{m/s}$ there, so $2\dot v/v = 0.0526\ \mathrm{s^{-1}}$, and $\dot h/H = 0.0526$ requires $H = 7.8\ \mathrm{km}$ — right between the troposphere's 9 km and the stratosphere's 6.3 km, as it should be for a peak sitting exactly on the tropopause. The closed-form estimate, using the average acceleration to the peak ($447/61.8 = 7.2\ \mathrm{m/s^2}$) and $\gamma = 66^\circ$, gives 30 kPa: low by a sixth, because the real acceleration grows as propellant burns off and the later, faster part of the climb counts for more.

::: example Dynamic pressure at a single trajectory point
At $t = 70\ \mathrm{s}$ the vehicle is at 14.7 km and 551 m/s. From the standard atmosphere, 14.7 km lies in the isothermal layer, so $\rho = 0.3639\,\exp[-9.80665 \times 3700/(287.053 \times 216.65)] = 0.3639 \times 0.5580 = 0.2031\ \mathrm{kg/m^3}$ (the table shows 0.205 because the simulation's altitude is rounded). Then

$$
\bar{q} = \tfrac{1}{2} \times 0.2031 \times 551^2 = 30.8\ \mathrm{kPa},
$$

already 15 % below the peak eight seconds earlier even though the vehicle is 100 m/s faster. Density is winning. By 80 s, 150 m/s faster still, $\bar{q}$ is down to 21 kPa.
:::

The numbers match what flight commentary reports for real vehicles: **max-Q of roughly 25 to 40 kPa, at 10 to 14 km, near Mach 1.2 to 1.5**. The simulated vehicle, flown at full throttle, lands at the upper end of each range; real Falcon 9 and Shuttle ascents throttled the engines to about 70 % through a "throttle bucket" spanning the peak, which by the $\bar{q}_{\max} \propto a$ scaling shaves several kilopascals off and shifts the peak slightly. The cost of the bucket is gravity loss — every second spent at lower thrust-to-weight is a second of $g\sin\gamma$ not compensated — and the trade between structural margin and payload is negotiated between structures, propulsion and trajectory design long before launch.

::: key
Typical max-Q for an orbital launcher: roughly 25–40 kPa, at 10–14 km altitude and Mach 1.2–1.5. It is a maximum because $\rho$ falls exponentially with altitude while $v^2$ grows: the product peaks, at roughly one density scale height of altitude.
:::

## The procedure to code

Locating max-Q on any trajectory — simulated or flown — is three lines once you have an atmosphere model:

```python
import numpy as np

def q_profile(altitudes, speeds_rel, rho_of_h):
    rho = np.array([rho_of_h(h) for h in altitudes])
    q = 0.5 * rho * speeds_rel**2          # Pa; speeds relative to the air
    i = int(np.argmax(q))
    return q, q[i], altitudes[i], i

# q, q_max, h_at_max, i = q_profile(h, v_rel, us1976_density)
# print(q_max / 1e3, "kPa at", h_at_max / 1e3, "km")   # -> 36.4 kPa at 11.0 km
```

Two details matter. The speed must be air-relative: subtract the wind before squaring, or a 60 m/s jet stream will move your answer by a quarter. And if your trajectory is sampled coarsely, fit a parabola through the three points around the discrete maximum rather than reporting the sample — a 10 s grid on the table above would put the peak at 60 s and 36.2 kPa, close, but the window edges would be off by seconds.

::: warning
$\bar{q}$ is not the pressure the airframe feels everywhere. It is the scale for pressure differences: the stagnation region sees roughly $+\bar{q}$ above ambient, the shoulders of a fairing can see a suction of a similar size, and the base sees a fraction of it. Structural loads come from the *distribution* of pressure, which the coefficients describe. And $\bar{q}$ alone does not bend the vehicle — it is $\bar{q}$ times angle of attack that produces the normal force, as later lessons develop.
:::

::: warning
Do not compute the Mach number at max-Q with the sea-level speed of sound. At 11 km the sound speed is 295 m/s, not 340 m/s, so 447 m/s is Mach 1.52 rather than 1.31. Max-Q sits in the transonic-to-low-supersonic drag rise partly because the cold tropopause air lowers the speed of sound just as the vehicle passes through it.
:::

## Check yourself

::: check
A vehicle at 12 km altitude has an airspeed of 420 m/s. Compute its dynamic pressure using the standard atmosphere.
:::

::: answer
At 12 km the layer is isothermal at 216.65 K, so $\rho = 0.3639\,\exp[-9.80665 \times 1000/(287.053 \times 216.65)] = 0.3639 \times 0.8541 = 0.3108\ \mathrm{kg/m^3}$. Then $\bar{q} = \tfrac{1}{2} \times 0.3108 \times 420^2 = 27.4\ \mathrm{kPa}$. If a 40 m/s headwind were present the airspeed would be 460 m/s and $\bar{q}$ would rise to $\tfrac{1}{2} \times 0.3108 \times 460^2 = 32.9\ \mathrm{kPa}$, a 20 % increase from a 10 % change in speed.
:::

::: check
Using the constant-acceleration model, how does $\bar{q}_{\max}$ change if the vehicle's acceleration through the lower atmosphere is halved by throttling, everything else equal? What happens to the altitude and the speed of the peak?
:::

::: answer
$\bar{q}_{\max} = \rho_0 a H/(e\sin\gamma)$ is proportional to $a$, so halving the acceleration halves the peak dynamic pressure. The altitude of the peak, $h^* = H$, does not change in this model. The speed at the peak, $v^* = \sqrt{2aH/\sin\gamma}$, falls by $\sqrt{2}$, and the time to reach it, $t^* = v^*/a$, grows by $\sqrt{2}$. In a real ascent the reduced acceleration also increases gravity loss, which is the price of the throttle bucket.
:::

::: check
Explain in one or two sentences why dynamic pressure must eventually fall on any ascent, even though the vehicle keeps accelerating all the way to orbit.
:::

::: answer
Density decreases exponentially with altitude while speed grows only polynomially in time (roughly linearly under near-constant thrust), and $\bar{q} = \tfrac{1}{2}\rho v^2$ is their product. Once the vehicle climbs faster than about two density scale heights per $v/\dot v$ — precisely, once $\dot h/H > 2\dot v/v$ — the exponential decay of $\rho$ outruns the growth of $v^2$ and $\bar{q}$ falls, reaching essentially zero above 80 km however fast the vehicle is going.
:::

::: check
On the simulated trajectory, the drag force peaks at 56 s (218 kN, Mach 1.27) but dynamic pressure peaks at 61.8 s. How can the two peaks differ, and which one does the trajectory team care about for drag loss?
:::

::: answer
Drag is $D = \bar{q} S C_D$ and the drag coefficient itself depends on Mach number, rising steeply through the transonic range and peaking near Mach 1.1 to 1.3 before falling off. Between 56 and 62 s the vehicle passes the $C_D$ peak, so the fall in $C_D$ outweighs the residual rise in $\bar{q}$ and the drag force peaks first. For drag loss the team integrates $D/m$ over the whole ascent — about 22 m/s for this vehicle — so both curves matter through the entire window; for structural loads it is $\bar{q}$, and later $\bar{q}\alpha$, that sets the constraint.
:::

::: check
A trajectory file gives $(h, v)$ pairs every 5 s: (8.0 km, 370 m/s), (10.3 km, 426 m/s), (12.5 km, 488 m/s). Using $\rho = 1.225 e^{-h/8500}$, which sample has the largest $\bar{q}$, and roughly where is the true peak?
:::

::: answer
Densities: $1.225 e^{-8000/8500} = 0.478$, $1.225 e^{-10300/8500} = 0.365$, $1.225 e^{-12500/8500} = 0.282\ \mathrm{kg/m^3}$. Dynamic pressures: $\tfrac{1}{2} \times 0.478 \times 370^2 = 32.7$, $\tfrac{1}{2} \times 0.365 \times 426^2 = 33.1$, $\tfrac{1}{2} \times 0.282 \times 488^2 = 33.5\ \mathrm{kPa}$. The third sample is largest, and since the values are still rising the true peak lies at or beyond 12.5 km on this coarse grid — you would need the next sample (or a finer grid) to bracket it. Note that the exponential fit with $H = 8.5$ km puts the peak higher than the standard atmosphere does, because it overestimates density above the tropopause.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $\bar{q} = \tfrac{1}{2}\rho v^2$ | dynamic pressure, Pa; $v$ relative to the air |
| $F = \bar{q} S C_F$ | every aerodynamic force: dynamic pressure × reference area × coefficient |
| $S = \pi d^2/4$ | launch-vehicle reference area; 10.52 m² for $d = 3.66$ m |
| $d\ln\bar{q}/dt = 2\dot v/v - \dot h/H$ | max-Q where $v^2\sin\gamma = 2H\dot v$ |
| Constant-acceleration model | $h^* = H$, $\bar{q}_{\max} = \rho_0 a H/(e\sin\gamma)$, $v^* = \sqrt{2aH/\sin\gamma}$ |
| Typical max-Q | 25–40 kPa, 10–14 km, Mach 1.2–1.5; a ~20 s window within 90 % of the peak |
| Simulated Falcon-9-class ascent | 36.4 kPa at 61.8 s, 11.0 km, 447 m/s, Mach 1.52, unthrottled |
| Throttle bucket | $\bar{q}_{\max} \propto a$, so throttling to ~70 % trims the peak at the cost of gravity loss |

The next lesson takes the Mach number that appeared in the table and explains why the drag coefficient rises so sharply just as dynamic pressure peaks — and what subsonic, transonic, supersonic and hypersonic flow do to a slender body.
