---
id: l02-dynamic-pressure-and-max-q
title: Dynamic pressure and max-Q
minutes: 19
covers:
  - dynamic pressure and max-Q
---

Stick your hand out of a car window. At a crawl you barely feel the air. On the highway it shoves your hand back hard. Now imagine the same car on a mountain road so high the air is thin: at the same speed, the shove is gentler. How hard moving air pushes depends on two things — how fast you go, and how thick the air is.

Watch a rocket launch webcast and, about a minute after lift-off, someone says "max-Q". The rocket is 10 to 14 km up, moving at about one and a half times the speed of sound, and the air is pushing on it harder than it ever will again. The structures team built the nose cover, the tanks and the joints for this moment. The guidance team steered so the rocket points almost exactly along its path through it. The engine team may throttle down to get through it. Everything later in this module about loads and control is scaled by the number that peaks here.

That number is the **dynamic pressure**, written $\bar{q} = \tfrac{1}{2}\rho v^2$ and read "q bar". Here $\rho$ is the air density from the last lesson and $v$ is the rocket's speed through the air. This lesson defines it, shows why it *must* have a peak on the way up, estimates where the peak is with a short formula, and then finds it on a simulated flight of a Falcon-9-class rocket.

## What dynamic pressure is

Picture a stream of air hitting a flat plate head-on. Right at the center the air comes to a complete stop. That spot is the **[[stagnation point|stagnation-point]]**. The moving air had energy of motion, and stopping it turns that energy into extra pressure.

How much extra? Each cubic metre of air has mass $\rho$, so its energy of motion is $\tfrac{1}{2}\rho v^2$ — the familiar $\tfrac{1}{2}mv^2$ with $\rho$ in place of $m$. **[[Bernoulli's equation|bernoulli]]** for slow flow says the pressure at the stagnation point, $p_0$, is higher than the pressure in the free stream, $p_\infty$ (read "p infinity", the pressure far from the body), by exactly that amount:

$$
p_0 - p_\infty = \tfrac{1}{2}\rho v^2 \equiv \bar{q}.
$$

(The sign $\equiv$ means "is defined as".) So the dynamic pressure is the pressure rise the moving air can produce when you stop it. It is the natural size for every pressure difference the flow can set up anywhere on the body.

To get a force, multiply a pressure by an area. Real bodies are not flat plates, so we also multiply by a shape factor:

$$
F = \bar{q}\, S\, C_F .
$$

Here $S$ is the **[[reference area|reference-area]]**, an agreed area. For a rocket it is, by convention, the cross-section of the main body, $S = \pi d^2/4$, with $d$ the diameter. For a 3.66 m rocket that is $10.52\ \mathrm{m^2}$. And $C_F$ is a **coefficient** — a plain number with no units that says how this shape turns $\bar{q}$ into force: the drag coefficient $C_D$, the normal-force coefficient $C_N$, and so on. The coefficient depends on shape, on Mach number and on the angle between the rocket and the airflow. All the dependence on *where* and *how fast* the rocket is flying sits in $\bar{q}$.

### Speed through the air, not over the ground

The $v$ in $\bar{q}$ is the speed **relative to the air**. Riding a bike into a headwind feels like riding faster; riding with a tailwind feels like riding slower. A rocket moving at 400 m/s into a 50 m/s headwind has an airspeed of 450 m/s, and its $\bar{q}$ goes up by a factor $(450/400)^2 = 1.27$. In a simulation you compute the **[[relative velocity|relative-wind]]** $\mathbf{v}_{\text{rel}} = \mathbf{v} - \mathbf{w}$, where $\mathbf{w}$ is the wind, and square its size.

The bar over the $q$ keeps dynamic pressure apart from heat flow, which people also call $q$. Many books and most code drop the bar. This module keeps it in the text and writes `q` in code.

::: key
Dynamic pressure: $\bar{q} = \tfrac{1}{2}\rho v^2$, with $v$ the speed relative to the air. It has units of pressure (Pa), and every aerodynamic force is $\bar{q}$ × reference area × a dimensionless coefficient.
:::

Some sizes to calibrate your feel:

- A 100 m/s gust at sea level: $\tfrac{1}{2} \times 1.225 \times 100^2 = 6125\ \mathrm{Pa}$, about 6.1 kPa.
- An airliner cruising at 250 m/s at 11 km, where $\rho = 0.3639\ \mathrm{kg/m^3}$: $\tfrac{1}{2} \times 0.3639 \times 250^2 = 11.4\ \mathrm{kPa}$.
- A launcher at max-Q: 25 to 40 kPa. That is about a third of an atmosphere pushing on every square metre of the nose.

## Why the climb has a max-Q

Think about the two ingredients during a launch.

- The **speed** starts at zero on the pad and only ever goes up.
- The **density** starts at 1.225 kg/m³ and only ever goes down.

On the pad $v = 0$, so $\bar{q} = 0$. In space $\rho = 0$, so $\bar{q} = 0$ again. In between it is positive. Something that starts at zero, rises, and ends at zero must have a highest point. That highest point is **max-Q**.

Now make it precise. Use the exponential atmosphere, $\rho = \rho_0 e^{-h/H}$, so

$$
\bar{q}(t) = \tfrac{1}{2}\rho_0\, e^{-h(t)/H}\, v(t)^2 .
$$

A peak is easiest to find with a logarithm, because it turns the product into a sum:

$$
\ln\bar{q} = \ln\left(\tfrac{1}{2}\rho_0\right) - \frac{h}{H} + 2\ln v.
$$

Now take the rate of change with time of each piece. The first is a constant, so it gives zero. The second gives $-\dot{h}/H$. Read $\dot{h}$ as "h dot": the rate of climb in m/s. The third gives $2\dot{v}/v$, where $\dot{v}$ ("v dot") is the acceleration. So

$$
\frac{d}{dt}\ln\bar{q} = \frac{2\dot{v}}{v} - \frac{\dot{h}}{H}.
$$

The first term pushes $\bar{q}$ up and the second pulls it down. Early on, $v$ is small, so $2\dot{v}/v$ is big and $\bar{q}$ grows fast. As $v$ grows, that term shrinks like $1/v$. Meanwhile the climb rate $\dot h = v\sin\gamma$ grows, where $\gamma$ is the **[[flight-path angle|flight-path-angle]]**, the angle of the path above the horizon. The two terms cross, and $\bar{q}$ peaks. At the peak the rate of change is zero:

$$
\frac{2\dot{v}}{v} = \frac{\dot{h}}{H}
\quad\Longleftrightarrow\quad
v^2 \sin\gamma = 2 H \dot{v}.
$$

(For the right-hand form, put $\dot h = v\sin\gamma$ into the left one and multiply both sides by $vH$.)

That is the whole story of the peak. Density falls exponentially with height. Speed grows only steadily with time. An exponential always wins in the end.

## A short formula for the peak

We can go further with a simplified flight. Suppose the rocket flies a straight line at a fixed angle $\gamma$, starting from rest, with a constant acceleration $a$. Then

- the speed is $v = at$;
- the distance along the path is $\tfrac{1}{2}at^2$;
- so the height is $h = \tfrac{1}{2}at^2\sin\gamma$.

Write $u = h/H$, the height counted in scale heights. From the height formula, $t^2 = 2Hu/(a\sin\gamma)$. Put $v^2 = a^2t^2$ into $\bar{q}$ and replace $t^2$:

$$
\bar{q} = \tfrac{1}{2}\rho_0 a^2 t^2 e^{-u} = \frac{\rho_0\, a\, H}{\sin\gamma}\; u\, e^{-u}.
$$

Everything in front is a fixed number. All the change sits in **[[the function u e to the minus u|u-exp-u]]**, $u e^{-u}$. It is biggest at $u = 1$, where it equals $1/e$. So the peak is at

$$
h^* = H, \qquad
\bar{q}_{\max} = \frac{\rho_0\, a\, H}{e\,\sin\gamma}, \qquad
v^* = \sqrt{\frac{2 a H}{\sin\gamma}}, \qquad
t^* = \frac{v^*}{a}.
$$

The star marks "at the peak". To see why $u e^{-u}$ peaks at $u = 1$: its rate of change is $e^{-u} - u e^{-u} = (1 - u)e^{-u}$, which is zero only when $u = 1$.

Three lessons fall out of this.

1. **Where.** In this model max-Q always happens at one scale height of altitude, whatever the acceleration or angle. That is about 8 km with $H = 8.5$ km, and a bit higher in reality, because the true density scale height near the ground is 9 to 10 km.
2. **Harder push, bigger peak.** $\bar{q}_{\max}$ is proportional to $a$. A rocket that accelerates harder reaches a given height going faster, so it meets the same air with more $v^2$. Throttling down through this region lowers the peak directly.
3. **Flatter path, bigger peak.** A smaller $\sin\gamma$ raises the peak, because the rocket covers more path — and gains more speed — for each metre of height.

::: example A quick max-Q estimate
Take a net acceleration $a = 8\ \mathrm{m/s^2}$, a flight-path angle of $60^\circ$ through the peak ($\sin 60^\circ = 0.866$), and $H = 8.5\ \mathrm{km}$.

**Peak dynamic pressure.** Multiply the top: $1.225 \times 8 \times 8500 = 83\,300$. Multiply the bottom: $2.718 \times 0.866 = 2.354$. Divide:

$$
\bar{q}_{\max} = \frac{1.225 \times 8 \times 8500}{2.718 \times 0.866} = 35.4\ \mathrm{kPa}.
$$

**Where and when.** It happens at $h^* = 8.5\ \mathrm{km}$, at speed $v^* = \sqrt{2 \times 8 \times 8500 / 0.866} = 396\ \mathrm{m/s}$, after $t^* = 396/8 = 49.5\ \mathrm{s}$.

**A gentler flight.** Drop the acceleration to 6 m/s² and steepen to $70^\circ$. The same formulas give 24.5 kPa at 329 m/s.

Sanity check: both numbers sit inside the real 25–40 kPa range for orbital launchers. That is a good sign the model has the right mechanism, even though it ignores the changing thrust, the drag and the curving path.
:::

## Finding max-Q on a gravity-turn flight

The dynamics module gave you a flat-Earth **[[gravity turn|gravity-turn]]**:

$$
\dot v = \frac{T}{m} - \frac{D}{m} - g\sin\gamma, \qquad
\dot\gamma = -\frac{g}{v}\cos\gamma, \qquad
\dot h = v\sin\gamma, \qquad
\dot m = -\frac{T}{I_{sp}\, g_0}.
$$

Here $T$ is the thrust, $m$ the mass, $D = \bar{q} S C_D$ the drag, and $I_{sp}$ the specific impulse. There is no lift, because the rocket flies pointing straight along its path. Plug in the standard atmosphere for $\rho(h)$ and the speed of sound, a drag coefficient that depends on Mach number (next lesson), and a Falcon-9-class rocket: lift-off mass 549 t, thrust 7.61 MN at sea level rising to 8.23 MN in vacuum, specific impulse 282 s at sea level and 311 s in vacuum, diameter 3.66 m, a 1.0° tip-over at 50 m/s, and no throttling. Every ten seconds the result is:

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

($M$ is the Mach number, the speed divided by the local speed of sound.) By 60 s the density has dropped to a third of its pad value, while $v^2$ keeps growing. The product tops out between 50 and 70 s.

Scanning the simulation at its 0.05 s step, the peak is $\bar{q}_{\max} = 36.4\ \mathrm{kPa}$ at $t = 61.8\ \mathrm{s}$, $h = 11.0\ \mathrm{km}$, $v = 447\ \mathrm{m/s}$, Mach 1.52 and $\gamma = 66^\circ$. The rocket's mass has dropped to 380 t. The peak is broad: $\bar{q}$ stays within 90 % of its maximum from 52 to 68 s, and within 80 % from 47 to 72 s. For the structure, "max-Q" is a twenty-second window, not an instant.

**Check the peak condition.** At the peak the simulation gives $\dot v = 11.8\ \mathrm{m/s^2}$ and $\dot h = 410\ \mathrm{m/s}$. So $2\dot v/v = 2 \times 11.8/447 = 0.0528\ \mathrm{s^{-1}}$. For $\dot h/H$ to match, $H = 410/0.0528 = 7.8\ \mathrm{km}$. That sits between the troposphere's 9 km and the stratosphere's 6.3 km — just right for a peak sitting on the tropopause.

**Check the short formula.** Use the average acceleration up to the peak, $447/61.8 = 7.2\ \mathrm{m/s^2}$, and $\gamma = 66^\circ$. The formula gives 30 kPa, low by about a sixth. The reason: the real acceleration grows as propellant burns off, so the later, faster part of the climb counts for more than an average suggests.

::: example Dynamic pressure at one moment
At $t = 70\ \mathrm{s}$ the rocket is at 14.7 km, moving at 551 m/s.

**Density.** 14.7 km is in the constant-temperature layer that starts at 11 km, so climb 3700 m from the tropopause:

$$
\rho = 0.3639\,\exp\!\left[-\frac{9.80665 \times 3700}{287.053 \times 216.65}\right] = 0.3639 \times 0.5580 = 0.2031\ \mathrm{kg/m^3}.
$$

(The table shows 0.205 because the simulation's altitude is rounded.)

**Dynamic pressure.**

$$
\bar{q} = \tfrac{1}{2} \times 0.2031 \times 551^2 = 30.8\ \mathrm{kPa}.
$$

Sanity check: that is already 15 % below the peak eight seconds earlier, even though the rocket is 100 m/s faster. Density is winning. By 80 s, 150 m/s faster still, $\bar{q}$ is down to 21 kPa.
:::

These numbers match what launch commentary reports for real rockets: **max-Q of roughly 25 to 40 kPa, at 10 to 14 km, near Mach 1.2 to 1.5.** Our unthrottled rocket lands at the top of each range.

Real Falcon 9 and Space Shuttle flights throttle the engines down, to about 70 %, through a **[[throttle bucket|throttle-bucket]]** around the peak. Since $\bar{q}_{\max}$ is proportional to $a$, that shaves several kilopascals off and shifts the peak a little. The cost is **[[gravity loss|gravity-loss]]**: every second spent at lower thrust is a second of gravity pulling back that the engines are not fighting as hard. The trade between structural safety and payload is settled between the structures, engine and trajectory teams long before launch.

::: key
Typical max-Q for an orbital launcher: roughly 25–40 kPa, at 10–14 km altitude and Mach 1.2–1.5. It is a maximum because $\rho$ falls exponentially with altitude while $v^2$ grows: the product peaks, at roughly one density scale height of altitude.
:::

## The procedure to code

Once you have an atmosphere model, finding max-Q on any trajectory — simulated or really flown — takes three lines:

```python
import numpy as np

def q_profile(altitudes, speeds_rel, rho_of_h):
    rho = np.array([rho_of_h(h) for h in altitudes])
    q = 0.5 * rho * speeds_rel**2          # Pa; speeds relative to the air
    i = int(np.argmax(q))                  # index of the largest q
    return q, q[i], altitudes[i], i

# Try it on the table above, with an exponential atmosphere (H = 8.5 km):
h = np.array([4.1, 6.8, 10.3, 14.7, 20.0]) * 1000.0
v = np.array([233.0, 322.0, 426.0, 551.0, 700.0])
q, q_max, h_at_max, i = q_profile(h, v, lambda z: 1.225 * np.exp(-z / 8500.0))
print(round(q_max / 1e3, 1), "kPa at", h_at_max / 1e3, "km")   # 33.1 kPa at 10.3 km
```

Two details matter.

- **Use airspeed.** Subtract the wind before squaring. At 447 m/s, a 60 m/s jet-stream headwind raises $\bar{q}$ by $(507/447)^2 = 1.29$, more than a quarter.
- **Do not trust a coarse grid.** If your trajectory is sampled every few seconds, fit a **[[parabola through the three points|parabola-fit]]** around the largest sample instead of reporting the sample itself. A 10 s grid on the table above would put the peak at 60 s and 36.2 kPa — close, but the edges of the high-$\bar{q}$ window would be off by seconds.

::: warning q̄ is a scale, not the pressure everywhere
$\bar{q}$ is not the pressure the airframe feels all over. It is the *scale* for pressure differences. The stagnation region sees roughly $+\bar{q}$ above the surrounding pressure, the shoulders of the nose cover can see a suction of similar size, and the base sees a fraction of it. Structural loads come from how the pressure is *spread*, which the coefficients describe. And $\bar{q}$ alone does not bend the rocket: it is $\bar{q}$ times the angle of attack that makes the sideways force, as later lessons show.
:::

::: warning Use the local speed of sound
Do not work out the Mach number at max-Q with the sea-level speed of sound. At 11 km the speed of sound is 295 m/s, not 340 m/s, so 447 m/s is Mach $447/295 = 1.52$, not $447/340 = 1.31$. Max-Q lands in the transonic-to-low-supersonic drag rise partly *because* the cold air near the tropopause lowers the speed of sound just as the rocket passes through.
:::

## Check yourself

::: check
A rocket at 12 km has an airspeed of 420 m/s. Find its dynamic pressure using the standard atmosphere.
:::

::: answer
**Density.** 12 km is in the constant-temperature layer, 1000 m above its base:

$\rho = 0.3639\,\exp[-9.80665 \times 1000/(287.053 \times 216.65)] = 0.3639 \times 0.8541 = 0.3108\ \mathrm{kg/m^3}$.

**Dynamic pressure.** $\bar{q} = \tfrac{1}{2} \times 0.3108 \times 420^2 = 27.4\ \mathrm{kPa}$.

With a 40 m/s headwind the airspeed would be 460 m/s, and $\bar{q} = \tfrac{1}{2} \times 0.3108 \times 460^2 = 32.9\ \mathrm{kPa}$. A 10 % rise in speed gave a 20 % rise in $\bar{q}$, because speed is squared.
:::

::: check
In the constant-acceleration model, what happens to $\bar{q}_{\max}$ if throttling halves the acceleration through the lower atmosphere, everything else the same? What happens to the height and the speed of the peak?
:::

::: answer
$\bar{q}_{\max} = \rho_0 a H/(e\sin\gamma)$ is proportional to $a$, so halving $a$ halves the peak.

The height of the peak, $h^* = H$, does not change in this model.

The speed at the peak, $v^* = \sqrt{2aH/\sin\gamma}$, goes as $\sqrt{a}$, so it falls by a factor of $\sqrt{2}$. The time to reach it, $t^* = v^*/a$, goes as $1/\sqrt{a}$, so it grows by $\sqrt{2}$.

In a real flight the smaller acceleration also means more gravity loss. That is the price of the throttle bucket.
:::

::: check
In one or two sentences: why must dynamic pressure fall eventually, even though the rocket keeps speeding up all the way to orbit?
:::

::: answer
Density drops exponentially with height, while speed grows only steadily (roughly in proportion to time under near-constant thrust), and $\bar{q} = \tfrac{1}{2}\rho v^2$ is their product. Once $\dot h/H$ becomes larger than $2\dot v/v$, the density's fall outruns the growth of $v^2$ and $\bar{q}$ drops, reaching essentially zero above 80 km however fast the rocket goes.
:::

::: check
On the simulated flight, the drag *force* peaks at 56 s (218 kN, Mach 1.27), but dynamic pressure peaks at 61.8 s. How can the two peaks differ, and which one does the trajectory team care about for drag loss?
:::

::: answer
Drag is $D = \bar{q} S C_D$, and the drag coefficient $C_D$ itself depends on Mach number. It rises steeply near the speed of sound and peaks near Mach 1.1 to 1.3, then falls. Between 56 and 62 s the rocket passes that $C_D$ peak. The falling $C_D$ outweighs the last bit of rise in $\bar{q}$, so the force peaks first.

For drag loss, the team adds up $D/m$ over the whole climb — about 22 m/s for this rocket — so both curves matter through the whole window. For structural loads it is $\bar{q}$, and later $\bar{q}\alpha$, that sets the limit.
:::

::: check
A trajectory file gives $(h, v)$ every 5 s: (8.0 km, 370 m/s), (10.3 km, 426 m/s), (12.5 km, 488 m/s). Using $\rho = 1.225 e^{-h/8500}$, which sample has the largest $\bar{q}$, and roughly where is the true peak?
:::

::: answer
**Densities:** $1.225 e^{-8000/8500} = 0.478$, $1.225 e^{-10300/8500} = 0.365$ and $1.225 e^{-12500/8500} = 0.282\ \mathrm{kg/m^3}$.

**Dynamic pressures:** $\tfrac{1}{2} \times 0.478 \times 370^2 = 32.7\ \mathrm{kPa}$, $\tfrac{1}{2} \times 0.365 \times 426^2 = 33.1\ \mathrm{kPa}$, and $\tfrac{1}{2} \times 0.282 \times 488^2 = 33.6\ \mathrm{kPa}$.

The third sample is largest. The values are still rising, so the true peak is at or beyond 12.5 km on this coarse grid; you need the next sample, or a finer grid, to bracket it.

Notice that with the standard atmosphere the middle sample would win instead. The $H = 8.5$ km fit makes the air a little too thin below about 13 km and too thick above it, and both errors push its peak higher than the standard atmosphere's.
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

The next lesson takes the Mach number from the table and explains why the drag coefficient jumps just as dynamic pressure peaks — and what subsonic, transonic, supersonic and hypersonic flow do to a slender rocket.

::: context stagnation-point Where the air stops
When air flows around a rocket's nose, it has to split: some goes over, some under, some around the sides. Exactly one streamline hits the tip dead-on and has nowhere to go. There the air stops completely, and its pressure is the highest anywhere on the body. That is also the hottest spot at high speed, which is why nose tips and the leading edges of wings get the toughest heat protection. "Stagnant" means "not moving", like a stagnant pond.
:::

::: context bernoulli An old equation for moving fluids
Daniel Bernoulli, a Swiss mathematician, published the idea in 1738: along a streamline in a steady, slow flow, pressure plus $\tfrac{1}{2}\rho v^2$ stays the same. Where the fluid speeds up, its pressure drops; where it slows down, its pressure rises. Stop it completely and all of $\tfrac{1}{2}\rho v^2$ has turned into pressure. The "slow" matters: it assumes the air is not squashed. The next lesson shows that above about Mach 0.3 the air does squash, and the stagnation pressure grows even faster than $\bar{q}$.
:::

::: context reference-area Why the area is a choice
The real force comes from pressure acting on every bit of the surface, and no single area captures that. So engineers pick an agreed area, measure or compute the force, and define the coefficient as whatever number makes $F = \bar{q} S C_F$ true. Pick a different $S$, and $C_F$ changes to match; the force does not. Rockets use the body's cross-section; airplanes use the wing's area. A coefficient without its reference area is meaningless — the next lesson returns to that trap.
:::

::: context relative-wind Air moving past you
On a treadmill in still air you feel no wind, even though your legs are running. On a bike on a still day you feel a breeze equal to your speed. Aerodynamic forces care only about how fast the air moves *past* the body. So a rocket's airspeed is its velocity minus the wind's velocity, done as arrows: a headwind adds to the airspeed, a tailwind subtracts, and a crosswind tilts the relative wind sideways, which later lessons turn into an angle of attack.
:::

::: context flight-path-angle Measuring the tilt of the path
The flight-path angle $\gamma$ is the angle between the rocket's velocity and the local horizon. Straight up is $90^\circ$; flying level is $0^\circ$. The climb rate is the upward part of the velocity, $\dot h = v\sin\gamma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="326" y="162" font-size="12" text-anchor="end" fill="#6c7a93">horizon</text>
  <line x1="60" y1="170" x2="120" y2="66" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="125,57.4 124.2,70.8 113.8,64.8" fill="#1d6fd1"/>
  <text x="132" y="58" font-size="13" fill="#1d6fd1">v</text>
  <path d="M100,170 A40,40 0 0,0 80,135.4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="106" y="150" font-size="13" fill="#b4232c">γ = 60°</text>
  <line x1="125" y1="57.4" x2="125" y2="170" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="132" y="118" font-size="12" fill="#1f2a44">climb rate v sin γ</text>
</svg>
```

A small $\gamma$ means a flat path: lots of speed, little height gained.
:::

::: context u-exp-u A rise that gives way
The curve $u e^{-u}$ is a tug of war. The $u$ part grows steadily; the $e^{-u}$ part shrinks faster and faster. At first the growth wins, then the shrinking takes over. They balance exactly at $u = 1$, where the curve is $1/e \approx 0.368$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="18" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 47.0,135.6 54.0,107.8 61.0,85.5 68.0,68.1 75.0,54.8 82.0,44.9 89.0,37.9 96.0,33.4 103.0,31.0 110.0,30.2 117.0,30.9 124.0,32.7 131.0,35.4 138.0,38.8 145.0,42.8 152.0,47.2 159.0,52.0 166.0,56.9 173.0,62.0 180.0,67.1 187.0,72.3 194.0,77.4 201.0,82.4 208.0,87.3 215.0,92.0 222.0,96.6 229.0,101.0 236.0,105.3 243.0,109.4 250.0,113.2 257.0,116.9 264.0,120.4 271.0,123.7 278.0,126.9 285.0,129.8 292.0,132.6 299.0,135.2 306.0,137.7 313.0,140.0 320.0,142.2"/>
  <line x1="110" y1="170" x2="110" y2="30.2" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <circle cx="110" cy="30.2" r="4" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44">
    <text x="118" y="24" fill="#b4232c">peak 1/e at u = 1</text>
    <text x="40" y="186" text-anchor="middle">0</text>
    <text x="110" y="186" text-anchor="middle">1</text>
    <text x="180" y="186" text-anchor="middle">2</text>
    <text x="250" y="186" text-anchor="middle">3</text>
    <text x="320" y="186" text-anchor="middle">4</text>
    <text x="330" y="160" text-anchor="end">u = h / H</text>
  </g>
</svg>
```

In the max-Q model, $u$ is the height in scale heights, so the peak sits at one scale height.
:::

::: context gravity-turn The turn that steers itself
A gravity turn is how most rockets tip over from vertical to horizontal. Right after lift-off the rocket is nudged a degree or so off vertical. After that it keeps its nose pointed along its path, and gravity does the steering: it pulls the path steadily toward the horizon, as $\dot\gamma = -(g/v)\cos\gamma$ says. Flying nose-first along the path keeps the angle of attack near zero, which keeps the sideways air loads small right when $\bar{q}$ is big.
:::

::: context throttle-bucket Why webcasts announce a throttle-down
Plot the planned thrust against time and it dips before max-Q and comes back after, like a bucket. The Space Shuttle's main engines throttled down to roughly two thirds of full power through max-Q, and launch commentary on Falcon 9 flights often mentions the vehicle "throttling down" as it approaches max-Q. Because $\bar{q}_{\max}$ grows with acceleration, easing off for a few tens of seconds takes kilopascals off the peak.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="335" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,180.0 64.0,175.2 88.0,159.2 112.0,130.0 136.0,91.6 160.0,54.8 184.0,35.2 188.3,34.4 208.0,56.0 232.0,94.4 256.0,132.4 280.0,158.4 328.0,176.8"/>
  <circle cx="188.3" cy="34.4" r="4" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44">
    <text x="196" y="30">max-Q 36.4 kPa, 61.8 s</text>
    <text x="34" y="144" text-anchor="end">10</text>
    <text x="34" y="104" text-anchor="end">20</text>
    <text x="34" y="64" text-anchor="end">30</text>
    <text x="34" y="24" text-anchor="end">40</text>
    <text x="40" y="195" text-anchor="middle">0</text>
    <text x="112" y="195" text-anchor="middle">30</text>
    <text x="184" y="195" text-anchor="middle">60</text>
    <text x="256" y="195" text-anchor="middle">90</text>
    <text x="328" y="195" text-anchor="middle">120 s</text>
  </g>
  <text x="270" y="110" font-size="12" fill="#b4232c">q̄ (kPa), unthrottled</text>
</svg>
```

This is the unthrottled simulated flight from the lesson. A throttle bucket flattens the top of that hump.
:::

::: context gravity-loss Paying gravity while you climb
While a rocket climbs, gravity pulls it back the whole time. The part of the engine's push spent just holding the rocket up, instead of speeding it up, is **gravity loss**. Its rate is $g\sin\gamma$ each second, so it is worst early, when the path is steep. A slower climb spends more seconds at steep angles, which is why every throttle-down costs some payload. For a typical orbital launch gravity loss is over a kilometre per second of speed, far more than drag loss.
:::

::: context parabola-fit Finding a peak between samples
Near any smooth peak, a curve looks like an upside-down parabola. Three samples — the largest and its two neighbours — pin down exactly one parabola, and its top can be found with a short formula. For samples $q_-$, $q_0$, $q_+$ spaced $\Delta t$ apart, the peak sits a fraction $\tfrac{1}{2}(q_- - q_+)/(q_- - 2q_0 + q_+)$ of a step from the middle sample. The numerical methods module uses the same trick for root-finding and optimisation.
:::
