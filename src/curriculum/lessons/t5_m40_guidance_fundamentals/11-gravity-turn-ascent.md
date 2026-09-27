---
id: l11-gravity-turn-ascent
title: The gravity turn
minutes: 22
covers:
  - Gravity turn ascent and zero-lift trajectories; the pitch program and open-loop pitch kick
---

Throw a ball up and a little forward. Nobody steers it, yet its path bends: it rises, levels off, and curves over. Gravity did all the turning. It pulls straight down, and a path that is not straight up or straight down gets bent toward the ground.

Now stick your hand out of a car window on the highway. Hold it flat, edge into the wind, and the air barely pushes. Tilt it a little, and the air shoves it hard, up and back. That sideways shove is what a rocket must avoid. A rocket is long and thin, like a pencil, and a sideways push in thick, fast air can bend it until it breaks.

Put those two ideas together and you get the **[[gravity turn|gravity-turn-name]]**: climb with the rocket pointed exactly along its direction of travel, so the air never pushes it sideways, and let gravity slowly bend the path over from straight up to nearly flat. Almost every rocket that reaches orbit flies this way through the lower atmosphere. The laws in the earlier lessons of this module react to measured errors. This one mostly does not react at all — and that is its strength.

## Angle of attack, and why zero is the whole point

The **angle of attack** $\alpha$ (read "alpha") is the angle between the direction the rocket's nose points — which is also where its thrust points — and the direction it is actually moving, its **velocity**. Your tilted hand in the car window had a nonzero angle of attack. The flat hand had zero.

At $\alpha = 0$ the air meets the rocket head-on. It produces **drag**, a push straight backward along the direction of travel, but no **lift**, the sideways push. No lift means nothing trying to bend the airframe.

How hard the air can push depends on the **[[dynamic pressure|dynamic-pressure]]**,

$$
q = \tfrac12\rho v^2 ,
$$

where $\rho$ (read "rho") is the density of the air in $\mathrm{kg/m^3}$ and $v$ is the speed in $\mathrm{m/s}$. The result is in pascals, $\mathrm{Pa}$. It is the "wind force per square meter" your hand feels, and it grows with the *square* of speed: twice as fast, four times the push.

The bending load on the rocket is measured by dynamic pressure times angle of attack:

$$
q\alpha = \tfrac12\rho v^2\,\alpha .
$$

Engineers call this "q-alpha". It needs both parts to be large. Huge $q$ with $\alpha = 0$ is fine: lots of drag, no side load. A big $\alpha$ in thin air is fine too. The danger is a big $\alpha$ when $q$ is high.

A gravity turn holds $\alpha = 0$ the whole way, except for one brief, deliberate moment near the start. So $q\alpha$ stays near zero. That is the whole reason for this trajectory shape: **a light, thin-walled rocket can survive the thickest, fastest air because it is never asked to carry sideways bending loads while it is there.**

::: key Gravity turn
After a small pitch kick, hold zero angle of attack so gravity rotates the velocity vector. Near-zero aerodynamic side load and no propellant spent turning — at the price of giving up in-atmosphere trajectory shaping.
:::

## How gravity turns the rocket

Describe the rocket's motion with three numbers:

- its speed $v$;
- its **flight path angle** $\gamma$ (read "gamma"): the angle of its velocity above the horizon, $90^\circ$ for straight up and $0^\circ$ for level flight;
- its height $h$.

With thrust along the velocity and no lift, three forces act. **Thrust** $T$ pushes forward along the velocity. **Drag** $D$ pushes backward along it. **Gravity** $mg$ pulls straight down, where $m$ is the rocket's mass and $g$ the strength of gravity. Split gravity into two parts: $g\sin\gamma$ along the velocity (slowing the rocket) and $g\cos\gamma$ across it (bending the path). Newton's second law, per unit mass, then gives

$$
\dot v = \frac{T}{m} - \frac{D}{m} - g\sin\gamma, \qquad \dot\gamma = -\frac{g\cos\gamma}{v}, \qquad \dot h = v\sin\gamma .
$$

Read $\dot v$ as "v dot", the rate the speed changes each second, and $\dot\gamma$ as "gamma dot", the rate the path angle changes.

The middle equation is the whole gravity turn in one line. Only gravity's across-the-path part, $g\cos\gamma$, turns the velocity. Thrust does not appear in it at all. So the turn costs **no propellant**. Gravity does the steering for free.

It also shows how the turn behaves. Dividing by $v$ means a slow rocket turns fast and a fast rocket turns slowly — the same sideways pull bends a slow path more. And $\cos\gamma$ is small near vertical and large near level flight.

::: note Why it has to be true
Newton's second law says force equals mass times acceleration. Split the acceleration into a part along the velocity and a part across it.

Along the velocity, the acceleration is the rate the speed changes, $\dot v$. The forces along it are thrust ($+T$), drag ($-D$), and the along-path part of gravity. Gravity points straight down, and the velocity is tilted $\gamma$ above the horizon, so the part of gravity along the path is $-mg\sin\gamma$. Divide everything by $m$: $\dot v = T/m - D/m - g\sin\gamma$.

Across the velocity, an object moving at speed $v$ whose direction turns at rate $\dot\gamma$ has a sideways acceleration $v\dot\gamma$ — the same thing that pushes you sideways in a car going around a bend. The only sideways force is gravity's across-path part, $-mg\cos\gamma$ (it pulls the nose down). So $v\dot\gamma = -g\cos\gamma$, which gives $\dot\gamma = -g\cos\gamma/v$.

This is the **flat-Earth** version. On a round Earth an extra term, $+v\cos\gamma/r$ with $r$ the distance from Earth's center, appears in $\dot\gamma$: as you travel around the curve, "horizontal" itself tips. Together the two terms read $\dot\gamma = -(g - v^2/r)\cos\gamma/v$. At orbital speed, $v^2/r = g$ and the turning stops: the rocket is falling around the Earth exactly as fast as the ground curves away. For a first stage the extra term is modest, and we leave it out here to keep the equations simple. (Earth's spin helps too: a rocket launched east from the equator starts with a free $465\,\mathrm{m/s}$.)
:::

### Why a pitch kick is needed

Look at the turning equation at $\gamma = 90^\circ$, straight up. There $\cos 90^\circ = 0$, so $\dot\gamma = 0$. A rocket going exactly straight up with $\alpha = 0$ stays going straight up. Vertical flight is an **[[equilibrium|equilibrium-balance]]** of this equation: a state that does not change by itself. In this ideal model, a perfectly vertical rocket would climb straight up forever. Nothing tips it over.

So the rocket tips itself, once. The **pitch kick** is a brief, deliberate lean of a few degrees, made early while the rocket is still slow and $q$ is still small. It is the only time in the ascent with a nonzero angle of attack. After it, $\gamma$ is a little below $90^\circ$, so $\cos\gamma > 0$ and $\dot\gamma < 0$. Gravity takes over and keeps bending the path, faster and faster as $\gamma$ drops, with no further command.

::: key The pitch program
Rise vertically for a short time (to clear the launch tower and keep the early air loads predictable). Apply a brief pitch kick of a few degrees — the only moment of the flight with a nonzero angle of attack. Then hold zero angle of attack and let $\dot\gamma = -g\cos\gamma/v$ turn the vehicle the rest of the way. This is open-loop in the strongest sense: no further steering command is issued at all.
:::

The whole ascent is then set by two numbers chosen before launch: how big the kick is, and when it happens. A bigger or earlier kick makes a flatter, lower path. A smaller or later one makes a steeper, higher path. Choosing those two numbers is the **[[pitch program|pitch-program]]** design.

### The price of going straight up

While the rocket climbs straight up, all of gravity works against it. Each second, gravity takes $g$ meters per second of speed away. That lost speed is the **gravity loss**, in general

$$
\Delta v_{gravity} = \int g\sin\gamma\,dt ,
$$

the sum, over the whole flight, of gravity's along-path pull. For straight up, $\sin 90^\circ = 1$, and the loss is simply $g$ times the time. Read $\Delta v$ as "delta v", a change in speed.

::: example The cost of the vertical rise
A rocket rises straight up for $12\,\mathrm{s}$ before its kick.

Step 1, the quick estimate. With constant surface gravity $g_0 = 9.80665\,\mathrm{m/s^2}$, the loss is $g_0 \times 12 = 117.680\,\mathrm{m/s}$.

Step 2, the careful version. Gravity weakens with height as $g(h) = \mu/(R_E + h)^2$, where $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravity constant and $R_E = 6371\,\mathrm{km}$ its radius. Adding up $g(h)$ along the real climb (the simulation below does this) gives $117.839\,\mathrm{m/s}$.

Step 3, compare. The two differ by $0.14\%$. The quick formula is excellent here, because the rocket only climbs about $320\,\mathrm{m}$ in those $12\,\mathrm{s}$, and gravity barely changes over that height. (The careful value is slightly *larger* because the simulation's $g$ uses the mean radius, where $g$ is a hair above $g_0$.)

Now a longer vertical climb. $30\,\mathrm{s}$ straight up costs $g_0 \times 30 = 294.2\,\mathrm{m/s}$. The speed for a circular orbit $200\,\mathrm{km}$ up is $\sqrt{\mu/(R_E + 200\,\mathrm{km})} = 7788.5\,\mathrm{m/s}$. So those $30\,\mathrm{s}$ burn $3.78\%$ of orbital speed just holding the rocket up, before it has any sideways speed at all. That is why the kick comes early.
:::

## Flying it, and where the delta-v goes

Before launch, the **rocket equation** (Tsiolkovsky's) promises an **ideal delta-v**:

$$
\Delta v_{ideal} = I_{sp}\,g_0\ln\frac{m_0}{m_f},
$$

where $I_{sp}$ is the engine's **specific impulse** in seconds (a measure of how efficient it is), $m_0$ the mass at liftoff and $m_f$ the mass at burnout. That is the speed the propellant could give in empty space with no gravity. In a real ascent the rocket gets less. The difference is the **loss budget**.

::: key Ascent delta-v loss terms
Gravity loss (integral of $g\sin\gamma\,dt$), drag loss (integral of $D/m\,dt$), steering loss (from thrust not aligned with velocity), and back-pressure loss (from finite nozzle expansion at sea level). Gravity loss dominates.
:::

Two of these need a word. **Steering loss** happens when thrust points off the velocity by some angle $\alpha$: only $T\cos\alpha$ speeds the rocket up, so the loss is $\int (T/m)(1 - \cos\alpha)\,dt$. A gravity turn keeps $\alpha = 0$, so its steering loss is essentially zero. **[[Back-pressure loss|back-pressure]]** happens because air pressure outside the nozzle pushes back on the exhaust, so an engine makes less thrust at sea level than in vacuum.

::: example A gravity-turn ascent to burnout, with its loss budget
A made-up first stage: liftoff mass $m_0 = 5 \times 10^5\,\mathrm{kg}$, thrust $T = 7 \times 10^6\,\mathrm{N}$, $I_{sp} = 300\,\mathrm{s}$, burning down to $m_f = 8 \times 10^4\,\mathrm{kg}$. Air density falls as $\rho = 1.225\,e^{-h/8500}\,\mathrm{kg/m^3}$ (an **[[exponential atmosphere|exponential-atmosphere]]**), and drag is $D = \tfrac12\rho v^2 \cdot 10\,\mathrm{m^2}$. Rise straight up for $12\,\mathrm{s}$, kick $2^\circ$ off vertical, then fly the three equations above to burnout.

Step 1, check the rocket can lift off. The ratio of thrust to weight is $T/(m_0 g_0) = 7 \times 10^6 / (5 \times 10^5 \times 9.80665) = 1.43$. More than $1$, so it rises.

Step 2, the burn time. The engine eats propellant at $\dot m = T/(I_{sp}g_0) = 2379\,\mathrm{kg/s}$. It has $420{,}000\,\mathrm{kg}$ to burn, so it burns for $176.5\,\mathrm{s}$.

Step 3, the ideal delta-v. $300 \times 9.80665 \times \ln(5 \times 10^5 / 8 \times 10^4) = 5391.4\,\mathrm{m/s}$.

Step 4, fly it. This program steps the equations forward in small time steps (a method called Runge–Kutta) and adds up the gravity and drag losses on the way:

```python
import numpy as np

MU, RE, G0 = 3.986004418e14, 6_371_000.0, 9.80665
m0, m_dry, T, isp = 5.0e5, 8.0e4, 7.0e6, 300.0
CdA, rho0, H = 10.0, 1.225, 8500.0      # drag area (m^2), sea-level density, scale height
mdot = T / (isp * G0)                   # propellant flow, kg/s
t_burn = (m0 - m_dry) / mdot            # 176.5 s

def rates(t, s, turning):
    v, gam, h, g_loss, d_loss = s
    m = m0 - mdot * t
    g = MU / (RE + h) ** 2
    D = 0.5 * rho0 * np.exp(-h / H) * v**2 * CdA
    v_dot = T / m - D / m - g * np.sin(gam)
    gam_dot = -g * np.cos(gam) / v if turning else 0.0
    return np.array([v_dot, gam_dot, v * np.sin(gam), g * np.sin(gam), D / m])

def fly(s, t0, t1, turning, dt=0.01):
    t = t0
    while t < t1 - 1e-12:
        h_ = min(dt, t1 - t)
        k1 = rates(t, s, turning)
        k2 = rates(t + h_/2, s + h_/2 * k1, turning)
        k3 = rates(t + h_/2, s + h_/2 * k2, turning)
        k4 = rates(t + h_, s + h_ * k3, turning)
        s = s + h_/6 * (k1 + 2*k2 + 2*k3 + k4)
        t += h_
    return s

s = np.array([0.0, np.pi/2, 0.0, 0.0, 0.0])      # v, gamma, h, gravity loss, drag loss
s = fly(s, 0.0, 12.0, turning=False)             # 12 s straight up
print(f"vertical-phase gravity loss = {s[3]:.3f} m/s")
s[1] = np.radians(88.0)                          # the 2-degree pitch kick
s = fly(s, 12.0, t_burn, turning=True)           # zero angle of attack to burnout
v, gam, h, g_loss, d_loss = s
ideal = isp * G0 * np.log(m0 / m_dry)
print(f"burnout: v = {v:.1f} m/s, gamma = {np.degrees(gam):.2f} deg, h = {h/1000:.1f} km")
print(f"ideal {ideal:.1f} - actual {v:.1f} = {ideal - v:.1f} m/s")
print(f"gravity loss {g_loss:.1f} + drag loss {d_loss:.1f} = {g_loss + d_loss:.1f} m/s")
# vertical-phase gravity loss = 117.839 m/s
# burnout: v = 4269.6 m/s, gamma = 3.03 deg, h = 52.4 km
# ideal 5391.4 - actual 4269.6 = 1121.8 m/s
# gravity loss 927.9 + drag loss 193.9 = 1121.8 m/s
```

Step 5, read the result. At burnout the rocket is doing $4269.6\,\mathrm{m/s}$ at a path angle of $3.03^\circ$ — nearly level, as a gravity turn should deliver — at $52.4\,\mathrm{km}$ up. That is $54\%$ of the circular orbit speed at that height ($7877\,\mathrm{m/s}$), with no steering command at all after the kick.

Step 6, close the budget. The rocket was promised $5391.4\,\mathrm{m/s}$ and got $4269.6\,\mathrm{m/s}$, a shortfall of $1121.8\,\mathrm{m/s}$. Gravity took $927.9\,\mathrm{m/s}$ and drag took $193.9\,\mathrm{m/s}$, which add to $1121.8\,\mathrm{m/s}$. Nothing is left over and nothing is missing: this model has no steering loss ($\alpha = 0$) and no back-pressure loss (its thrust is the same at every height).

Sanity check: gravity is by far the bigger loss, as the key says. And only $117.8\,\mathrm{m/s}$ of it came from the vertical rise. The rest was paid slowly through the turn, while $\gamma$ was still steep enough for $g\sin\gamma$ to matter.
:::

### Max-Q

Dynamic pressure $q = \tfrac12\rho v^2$ is a product of two things pulling opposite ways. Density is highest on the pad and falls as the rocket climbs. Speed is zero on the pad and grows through the burn. At liftoff $q$ is zero, because $v$ is zero. As the rocket speeds up, $q$ climbs. Then the air thins faster than $v^2$ grows, and $q$ falls. The peak in between is called **[[max-Q|max-q]]**.

In the ascent above, max-Q is $40.0\,\mathrm{kPa}$, reached at about $80\,\mathrm{s}$, at a height of $16.5\,\mathrm{km}$ and a speed of $676\,\mathrm{m/s}$. That is the moment the rocket is most exposed. It is also exactly when a gravity turn has $\alpha = 0$, so the danger never becomes a side load.

::: example Why nobody steers at max-Q
Suppose the rocket were tilted $2^\circ$ off its velocity at two different moments. First convert: $2^\circ = 0.0349\,\mathrm{rad}$.

At the kick ($t = 12\,\mathrm{s}$), the rocket is doing $55.0\,\mathrm{m/s}$ at $320\,\mathrm{m}$, so $q = 1.78\,\mathrm{kPa}$. Then $q\alpha = 1785 \times 0.0349 = 62.3\,\mathrm{Pa}$.

At max-Q, $q = 40.0\,\mathrm{kPa}$, and the same $2^\circ$ gives $q\alpha = 40{,}024 \times 0.0349 = 1397\,\mathrm{Pa}$.

The same tilt is $22$ times as punishing at max-Q. That is why the kick happens early, in thick but slow air, and why the rocket holds $\alpha = 0$ through max-Q instead of steering.

What would that tilt buy in speed? Very little. The steering loss depends on $1 - \cos\alpha$, and $1 - \cos 2^\circ = 0.00061$. At a thrust acceleration of $20\,\mathrm{m/s^2}$ for $10\,\mathrm{s}$, that is only $20 \times 0.00061 \times 10 = 0.12\,\mathrm{m/s}$. Small tilts cost almost no speed. The real price of steering in the atmosphere is the structural load, not the propellant.
:::

::: warning A gravity turn is efficient because it gives something up
Once the kick is done, nothing in $\dot\gamma = -g\cos\gamma/v$ can be steered. The path through the atmosphere is set by the thrust, the drag, and the kick's size and timing. That is the open-loop guidance of lesson 2: cheap, structurally safe, and blind to anything unexpected. A stronger headwind or a slightly wrong kick angle is not corrected while the rocket is in thick air. The fix comes later: engineers update the pitch program on launch day from measured winds, and a closed-loop guidance law takes over above the dense air, where steering is safe again. The next module, on ascent guidance, picks that up.
:::

::: note Zero angle of attack is a choice, not a law of nature
Nothing forces $\alpha = 0$ during ascent. A vehicle could fly with lift and shape its path more freely — some winged vehicles do — in exchange for real side loads and the propellant spent making lift. The gravity turn is a deliberate trade: give up trajectory freedom, get a lighter structure and near-zero turning cost in return. It is not the only path physics allows.
:::

## Check yourself

::: check
Why is $\gamma = 90^\circ$ an equilibrium of the zero-lift flight-path-angle equation, and what does that say about why a pitch kick is needed?
:::

::: answer
The equation is $\dot\gamma = -g\cos\gamma/v$, and $\cos 90^\circ = 0$, so $\dot\gamma = 0$ exactly at $\gamma = 90^\circ$. A perfectly vertical path does not change its angle at all: in this ideal zero-lift model it would keep climbing straight up forever, instead of tipping over on its own. Since nothing in the physics of a zero-angle-of-attack climb moves $\gamma$ off vertical, a deliberate pitch kick — the one moment of nonzero angle of attack — has to start the turn. After that, $\cos\gamma > 0$ and gravity keeps the turn going by itself.
:::

::: check
Using constant $g_0$, find the gravity loss for a flight path angle held at $\gamma = 60^\circ$ for $8\,\mathrm{s}$.
:::

::: answer
The loss is $\int g_0\sin\gamma\,dt = g_0\sin 60^\circ \times 8$. With $\sin 60^\circ = 0.8660$: $9.80665 \times 0.8660 \times 8 = 67.94\,\mathrm{m/s}$. Compare a fully vertical $8\,\mathrm{s}$: $g_0 \times 8 = 78.5\,\mathrm{m/s}$. Tilting the path cuts the loss by exactly the factor $\sin\gamma$.
:::

::: check
Why does zero angle of attack make $q\alpha$ zero, even though $q = \tfrac12\rho v^2$ itself is not zero — and is largest in the middle of the climb?
:::

::: answer
$q\alpha$ is a product, and the load it measures needs *both* parts. Dynamic pressure gives the airflow its strength. A nonzero angle of attack is what turns that airflow into a sideways force the long, thin airframe was not built to carry. A rocket flying straight into its own airflow feels plenty of drag along its length but no side load, however large $q$ is. That is why the trick is to hold $\alpha = 0$ right through the region where $q$ is largest, instead of trying to make $q$ small.
:::

::: check
A different ascent has an ideal delta-v of $6000\,\mathrm{m/s}$, an actual burnout speed of $5100\,\mathrm{m/s}$, and a measured gravity loss of $700\,\mathrm{m/s}$. If gravity and drag are the only losses, what was the drag loss?
:::

::: answer
The budget must close: ideal minus actual equals gravity loss plus drag loss. So $6000 - 5100 = 900\,\mathrm{m/s}$ of total loss, and $900 = 700 + \text{drag loss}$, giving a drag loss of $200\,\mathrm{m/s}$. If a real budget does not close this way, either a term was measured wrong or another loss is present and unaccounted for — a steering loss, if $\alpha \ne 0$ anywhere, or a back-pressure loss from flying the engine in air.
:::

::: check
Explain, using the two quantities that multiply to make it, why maximum dynamic pressure comes neither at liftoff nor at burnout.
:::

::: answer
$q = \tfrac12\rho v^2$ multiplies air density, which is largest at liftoff and keeps falling with height, by speed squared, which is zero at liftoff and keeps growing through the burn. At liftoff $\rho$ is at its maximum but $v = 0$, so $q = 0$. Later the air has thinned so much that even a much larger $v^2$ cannot keep up — in the example, $q$ at burnout is $23.4\,\mathrm{kPa}$, well below the $40.0\,\mathrm{kPa}$ peak. The peak comes in between, where density is still fairly high and speed is already large.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Angle of attack $\alpha$ | Angle between thrust (nose) direction and velocity |
| Dynamic pressure | $q = \tfrac12\rho v^2$, in pascals |
| Bending load indicator | $q\alpha = \tfrac12\rho v^2\alpha$ |
| Equations of motion | $\dot v = T/m - D/m - g\sin\gamma$, $\dot\gamma = -g\cos\gamma/v$, $\dot h = v\sin\gamma$ |
| Why a kick is needed | $\gamma = 90^\circ$ is an equilibrium ($\cos 90^\circ = 0$); nothing tips a vertical climb over by itself |
| Pitch program | Short vertical rise, brief kick of a few degrees, then zero $\alpha$ to burnout, open-loop |
| Loss budget | Ideal $\Delta v$ minus actual $v_f$ equals the sum of the losses |
| Loss terms | Gravity $\int g\sin\gamma\,dt$ (the biggest), drag $\int D/m\,dt$, steering, back-pressure |
| Max-Q | Peak of $q$, between liftoff and burnout, where the rocket must not steer |

The gravity turn buys its low loads and free turning by giving up steering through the thick air. The next lesson, the last of this module, asks what guidance looks like when the vehicle can steer again — split into a coarse phase and a precise one — and what happens when the actuators cannot deliver what the law asks for.

::: context gravity-turn-name A trick as old as the cannonball
Every thrown or fired object that is not aimed straight up flies a "gravity turn": gravity bends its path over. Rocket designers borrowed the idea on purpose. The difference is that a rocket keeps thrusting along its path while gravity bends it, so its speed grows as it turns. Launchers since the early space age have flown a short vertical rise, a small tilt, and then a path shaped mostly by gravity. Today's launchers still fly essentially the same plan through the lower atmosphere, then switch to smarter, closed-loop guidance higher up.
:::

::: context dynamic-pressure The push of moving air
Dynamic pressure is how hard moving air can push on each square meter that faces it. At sea level the air density is about $1.225\,\mathrm{kg/m^3}$. At highway speed, $30\,\mathrm{m/s}$, $q = 0.5 \times 1.225 \times 30^2 = 551\,\mathrm{Pa}$ — the push you feel on your hand. At the rocket's max-Q of $40.0\,\mathrm{kPa}$, the air presses about $73$ times harder than that. The $v^2$ is why: doubling speed quadruples the push.
:::

::: context equilibrium-balance A balanced pencil
An equilibrium is a state that stays put if nothing disturbs it. A pencil balanced on its tip is in equilibrium — until the slightest nudge tips it, and then it falls faster and faster. Vertical flight in a gravity turn behaves the same way: at exactly $90^\circ$ nothing turns the rocket, but once it leans even a little, gravity's sideways pull grows and the lean speeds up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="150" x2="90" y2="30" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="90,20 84,34 96,34" fill="#1d6fd1"/>
  <text x="90" y="166" font-size="12" text-anchor="middle" fill="#1f2a44">γ = 90°: no turn</text>
  <line x1="250" y1="150" x2="270.9" y2="31.8" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="272.6,22 264.2,34.7 276.0,36.8" fill="#1d6fd1"/>
  <line x1="272.6" y1="22" x2="272.6" y2="62" stroke="#b4232c" stroke-width="2"/>
  <polygon points="272.6,70 268,58 277.2,58" fill="#b4232c"/>
  <text x="282" y="60" font-size="12" fill="#b4232c">g</text>
  <text x="250" y="166" font-size="12" text-anchor="middle" fill="#1f2a44">γ = 80°: gravity bends it over</text>
</svg>
```
:::

::: context pitch-program Program, not pilot
The word "program" here means a schedule written before launch: rise for so many seconds, lean so many degrees, then hold zero angle of attack. The flight computer plays it back like sheet music. On launch day, weather balloons measure the winds aloft, and engineers can update the schedule before liftoff so the rocket meets those winds nose-first. Once the rocket is flying, though, the plan is not changed in the thick air.
:::

::: context back-pressure Why engines lose thrust at sea level
A rocket nozzle is a flared bell. The hot exhaust expands inside it and leaves the exit at some pressure. Outside, the air pushes back on that exit with its own pressure — about $101\,\mathrm{kPa}$ at sea level, nothing in space. That push subtracts from the thrust, so the same engine is weaker on the pad than in vacuum. The lost speed is the back-pressure loss. It shrinks as the rocket climbs into thinner air, and it is why upper-stage engines, which only fire in near-vacuum, can use much bigger bells.
:::

::: context exponential-atmosphere Air that thins by a fixed fraction
In the simple model used here, every $8.5\,\mathrm{km}$ of height cuts the air density by a factor of $e \approx 2.72$. That distance is called the **scale height**. At $8.5\,\mathrm{km}$ the density is about $37\%$ of sea level; at $17\,\mathrm{km}$, about $14\%$; at $52\,\mathrm{km}$, about $0.2\%$. The real atmosphere is lumpier, because its temperature changes with height, but this model catches the main shape well enough to see where max-Q lands.
:::

::: context max-q The max-Q curve for the example rocket
Here is $q$ through the whole burn of the worked example. It peaks at $40.0\,\mathrm{kPa}$ near $80\,\mathrm{s}$. Notice it does not fall back to zero: this made-up stage flies nearly level and very fast at about $50\,\mathrm{km}$, so $q$ dips to about $21\,\mathrm{kPa}$ and then creeps back up to $23.4\,\mathrm{kPa}$ at burnout. A smaller kick would climb out of the air sooner — exactly the kind of tuning the gravity-turn exercise asks you to do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="26" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="143.3" y="186">60</text><text x="236.7" y="186">120</text><text x="330" y="186">180</text>
    <text x="190" y="204">time after liftoff (s)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0</text><text x="44" y="109">20</text><text x="44" y="44">40</text>
  </g>
  <text x="54" y="22" font-size="11" fill="#1f2a44">q (kPa)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,170.0 56.2,169.4 62.4,167.5 68.7,164.2 74.9,159.4 81.1,153.1 87.3,145.4 93.6,136.6 99.8,126.8 106.0,116.3 112.2,105.4 118.4,94.6 124.7,84.1 130.9,74.2 137.1,65.3 143.3,57.5 149.6,51.1 155.8,46.1 162.0,42.6 168.2,40.6 174.4,39.9 180.7,40.6 186.9,42.3 193.1,45.0 199.3,48.4 205.6,52.4 211.8,56.8 218.0,61.4 224.2,66.1 230.4,70.8 236.7,75.3 242.9,79.7 249.1,83.7 255.3,87.4 261.6,90.7 267.8,93.6 274.0,96.1 280.2,98.1 286.4,99.6 292.7,100.5 298.9,100.9 305.1,100.5 311.3,99.5 317.6,97.5 324.6,93.9"/>
  <circle cx="174.3" cy="39.9" r="4" fill="#b4232c"/>
  <text x="182" y="32" font-size="12" fill="#b4232c">max-Q 40.0 kPa</text>
  <line x1="68.7" y1="170" x2="68.7" y2="150" stroke="#f2b880" stroke-width="2"/>
  <text x="74" y="158" font-size="11" fill="#1f2a44">kick</text>
</svg>
```

Real rockets often throttle their engines down for a few seconds around max-Q — the Space Shuttle and Falcon 9 both did — to keep this peak lower.
:::
