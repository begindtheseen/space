---
id: l07-ascent-losses-gravity-turn
title: Gravity, drag and steering losses on ascent
minutes: 22
covers:
  - variable-mass systems and the rocket equation done properly
---

Picture a phone battery that should last a day but is flat by lunch. The charge was all there. You spent it on things that did not move you forward.

A rocket's propellant is the same. The rocket equation from lesson 6 says what the propellant is *worth*: the **ideal $\Delta v$** — the speed change $v_e \ln(m_0/m_f)$ it would give in empty space, with nothing pulling or pushing. For a launcher heading to low Earth orbit that is about $9.3$–$9.5\,\mathrm{km/s}$, added up over its stages. Yet a 200 km circular orbit only needs $7.78\,\mathrm{km/s}$. About one and a half kilometres per second of speed goes missing. It is spent holding the rocket up against gravity while it is still slow, pushing air out of the way, and pointing the engines somewhere other than straight along the direction of motion.

Knowing where every metre per second goes tells engineers how hard to tip the rocket over, whether bigger engines pay for their weight, and where to put the launch pad. This lesson keeps gravity and drag on for a whole climb and derives the bookkeeping rule every trajectory engineer uses: realised $\Delta v$ equals ideal $\Delta v$ minus gravity loss, minus drag loss, minus steering loss. Then it puts numbers on each term and explains the manoeuvre — the **gravity turn** — that makes two of the three almost free.

## The equation of motion along the flight path

Start from lesson 6: $m\,d\mathbf{v}/dt = \mathbf{T} + \mathbf{F}_{\mathrm{ext}}$, where $\mathbf{T}$ is the thrust. Use a vertical plane over a flat Earth that does not spin, with the same gravity $g$ everywhere — the model of the module's simulation exercise. The outside forces are gravity, $-mg\,\hat{\mathbf{z}}$ (straight down), and air **drag** $\mathbf{D}$, which always points against the velocity. There is no lift, because the rocket will fly with its nose along its velocity.

Describe the velocity by two numbers: its size $v$ (the speed) and its **[[flight-path angle|flight-path-angle]]** $\gamma$ (Greek "gamma") — the angle of the velocity above the local horizontal. $\gamma = 90°$ is straight up; $\gamma = 0$ is flat. The thrust may point a little off the velocity. Call that angle $\alpha$ ("alpha"), positive when the thrust is tipped above the velocity.

Split every force into two parts, like "forward" and "sideways" on a shopping cart. The part **along** the velocity (tangential) changes the speed; the part **across** it (normal) changes the direction.

Along the velocity, thrust contributes $T\cos\alpha$, drag $-D$, and gravity $-mg\sin\gamma$ (all of gravity when you fly straight up, none when you fly flat). So

$$
m\frac{dv}{dt} = T\cos\alpha - D - m g \sin\gamma .
$$

Across the velocity, the direction turns at rate $\dot{\gamma}$ ("gamma dot", how fast $\gamma$ changes). A body moving at speed $v$ whose direction turns at rate $\dot{\gamma}$ has sideways acceleration $v\dot{\gamma}$ — the familiar $v^2/R$ of circular motion, with turning radius $R = v/\dot{\gamma}$. The sideways forces are $T\sin\alpha$ from thrust and $-mg\cos\gamma$ from gravity (drag has no sideways part), so

$$
m\,v\,\frac{d\gamma}{dt} = T\sin\alpha - m g \cos\gamma .
$$

Add the rates $\dot{h} = v\sin\gamma$ (height), $\dot{x} = v\cos\gamma$ (distance downrange) and the mass flow $\dot{m} = -T/(I_{sp} g_0)$ from lesson 2. Five numbers, $[v, \gamma, h, x, m]$, now describe the flight, and their rates depend only on those five — the system the gravity-turn exercise asks you to integrate.

Over a round Earth, $\dot{\gamma}$ gains a term $+(v/r)\cos\gamma$ ($r$ is the distance from Earth's centre), because the horizon tilts as the rocket travels around the curve. It matters late in the climb; the flat-Earth model leaves it out.

## Integrating: the Δv budget

Divide the along-track equation by $m$. Then write $T\cos\alpha$ as "all of the thrust, minus the part lost to pointing": $T\cos\alpha = T - T(1 - \cos\alpha)$. That gives

$$
\frac{dv}{dt} = \frac{T}{m} - \frac{T}{m}(1 - \cos\alpha) - \frac{D}{m} - g\sin\gamma .
$$

Now add this up over the whole burn, from ignition at $t = 0$ to burnout at $t_b$. The first term is the one lesson 6 already integrated. With $T = v_e|\dot{m}|$,

$$
\int_0^{t_b} \frac{T}{m}\,dt = \int_0^{t_b} \frac{v_e |\dot{m}|}{m}\,dt = v_e \ln\frac{m_0}{m_f} = \Delta v_{\mathrm{ideal}}.
$$

It does not care how the rocket flew. The other three terms do, and each has a name.

$$
\Delta v_{\mathrm{realised}} = v(t_b) - v(0) = \underbrace{v_e \ln\frac{m_0}{m_f}}_{\text{ideal}} - \underbrace{\int_0^{t_b} g\sin\gamma\,dt}_{\text{gravity loss}} - \underbrace{\int_0^{t_b} \frac{D}{m}\,dt}_{\text{drag loss}} - \underbrace{\int_0^{t_b} \frac{T}{m}(1 - \cos\alpha)\,dt}_{\text{steering loss}} .
$$

This is an **identity**, not an estimate: it holds for every trajectory the equations produce. A simulation that logs the three losses must find that they, plus the realised $\Delta v$, add back to $v_e \ln(m_0/m_f)$ within integration error. That is the [[first check to build|identity-check]]. It is also why ideal $\Delta v$ is the currency of mission design: the rocket equation says what the propellant is worth, and the losses say how much the trajectory spends without adding speed.

If the ideal $\Delta v$ uses the vacuum $I_{sp}$, add the **[[back-pressure loss|back-pressure]]**, $\int (T_{\mathrm{vac}} - T)/m\,dt$: thrust the air takes away by pressing on the nozzle exit (lesson 6) in the first minute or so. It is a few tens of metres per second, and is often folded into a sea-level $I_{sp}$ instead.

::: key The Δv budget
Ideal $\Delta v$ decomposes as $\Delta v_{\mathrm{ideal}} = \Delta v_{\mathrm{realised}} + \text{gravity loss} + \text{drag loss} + \text{steering loss}$ (plus a back-pressure loss if the ideal figure uses vacuum $I_{sp}$). For a LEO ascent the ideal is about $9.3$–$9.5\,\mathrm{km/s}$ against an orbital speed of about $7.8\,\mathrm{km/s}$.
:::

## Gravity loss

Hold a heavy grocery bag at arm's length. Your arm tires though the bag goes nowhere. Effort spent holding something up buys no motion. That is gravity loss.

The gravity-loss integral is $\int g\sin\gamma\,dt$. At every instant the rocket's weight has a part $mg\sin\gamma$ pointing backward along the path. The thrust must cancel that part before any of it can speed the rocket up. Flying straight up ($\gamma = 90°$) you lose the full $g$: about $9.8\,\mathrm{m/s}$ for every second of vertical climb. Flying flat ($\gamma = 0$) you lose nothing. Gravity is then at right angles to the velocity, and — as in lesson 3 — a force at right angles to the motion does no work on it. The rocket is still being pulled down, but it is the across-track equation, not the along-track one, that pays.

Two things follow.

- Gravity loss grows with *time* spent steep. A higher thrust-to-weight ratio shortens that time, so it cuts the loss. This is the main argument for giving a first stage bigger engines than the rocket equation alone would suggest.
- It pays to turn toward horizontal early. But the air punishes flying low and fast. So the turn is a compromise, which the gravity-turn section settles.

::: key Gravity loss
The gravity-loss integral is $\int g\sin\gamma\,dt$, with $\gamma$ the flight-path angle above the local horizon. Vertical flight loses at the full $g$; horizontal flight loses nothing.
:::

::: example Gravity loss for a representative pitch profile
Model a climb to low orbit like this. Vertical for the first $10\,\mathrm{s}$. Then $\gamma$ falls steadily from $90°$ to $20°$ between $10$ and $150\,\mathrm{s}$ (the first-stage burn). Then it falls steadily from $20°$ to $0°$ between $150$ and $330\,\mathrm{s}$. Then flat until orbit insertion at $540\,\mathrm{s}$. Use $g = 9.7\,\mathrm{m/s^2}$, a fair average over the first 200 km. What is the gravity loss?

**A formula for one segment.** If $\gamma$ falls steadily from $\gamma_1$ to $\gamma_2$ over a time $\Delta t$, substitute $\gamma = \gamma_1 + (\gamma_2 - \gamma_1)\,t/\Delta t$ and integrate the sine:

$$
\int_0^{\Delta t} g\sin\gamma\,dt = \frac{g\,\Delta t}{\gamma_2 - \gamma_1}\Big[-\cos\gamma\Big]_{\gamma_1}^{\gamma_2} = g\,\Delta t\,\frac{\cos\gamma_1 - \cos\gamma_2}{\gamma_2 - \gamma_1},
$$

with the angles in radians.

**Segment by segment.**

- Vertical, $10\,\mathrm{s}$: $9.7 \times 10 = 97\,\mathrm{m/s}$.
- $90° \to 20°$ over $140\,\mathrm{s}$: the angle change is $-1.2217\,\mathrm{rad}$ and $\cos 90° - \cos 20° = -0.9397$. The two minus signs cancel: $9.7 \times 140 \times 0.9397 / 1.2217 \approx 1045\,\mathrm{m/s}$.
- $20° \to 0°$ over $180\,\mathrm{s}$: $9.7 \times 180 \times (0.9397 - 1)/(-0.3491) \approx 302\,\mathrm{m/s}$.
- Flat, $210\,\mathrm{s}$: $0$.

**Total:** $97 + 1045 + 302 \approx 1440\,\mathrm{m/s}$, about $1.44\,\mathrm{km/s}$.

**Does it make sense?** About four-fifths of it ($1142\,\mathrm{m/s}$) is spent in the first $150\,\mathrm{s}$, while the rocket is steep and slow. The long second-stage burn, flown nearly flat, costs only about $300\,\mathrm{m/s}$. Squeeze the whole turn $30\,\mathrm{s}$ earlier — $20°$ at $120\,\mathrm{s}$, flat at $300\,\mathrm{s}$ — and the loss drops by about $220\,\mathrm{m/s}$. The price is a lower, hotter path through the air.
:::

## Drag loss

Stick your hand out of a car window: at walking pace you feel nothing, on the highway it is shoved back hard. Drag depends on speed *and* on how thick the air is.

The drag-loss integral is $\int D/m\,dt$. Drag is

$$
D = \tfrac{1}{2}\rho v^2 C_D A = \bar{q}\,C_D A ,
$$

where $\rho$ ("rho") is the air density, $C_D$ the **drag coefficient** (a number for how streamlined the shape is), and $A$ the reference area — the rocket's cross-section. The combination $\bar{q} = \tfrac{1}{2}\rho v^2$ ("q-bar") is the **[[dynamic pressure|max-q]]**: the pressure you would feel on a flat plate held face-on to the wind.

Density falls off roughly exponentially with height, $\rho \approx \rho_0 e^{-h/H}$, with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and **[[scale height|scale-height]]** $H \approx 8.5\,\mathrm{km}$. Meanwhile $v^2$ grows. So $\bar{q}$ rises, peaks and then collapses. The peak is called **max-Q**. It comes at roughly $10$–$15\,\mathrm{km}$ altitude and $400$–$500\,\mathrm{m/s}$, about a minute into a typical climb, and is around $30\,\mathrm{kPa}$. Only the $60$–$100\,\mathrm{s}$ around it add much to the integral.

Drag loss is the one term that favours *big* rockets. Drag grows with area (size squared), mass with volume (size cubed), so $D/m$ shrinks as a rocket grows. For a medium launcher the drag loss is typically $0.1$–$0.2\,\mathrm{km/s}$; for a large, dense one it can be well under $0.1\,\mathrm{km/s}$; for a small sounding rocket it can beat the gravity loss. Drag is also why the climb is not flown as flat as gravity loss alone would like: stay low and fast, and the air takes back everything a steeper path would have lost to gravity.

::: example An order-of-magnitude drag loss
Model a Falcon-class climb's dynamic pressure as a smooth bump centred at $70\,\mathrm{s}$: $\bar{q}(t) = 30\,\mathrm{kPa} \times \exp[-((t - 70)/35)^2]$. Take $C_D A = 4.2\,\mathrm{m^2}$ ($C_D \approx 0.4$ on a $3.66\,\mathrm{m}$ diameter) and mass $m(t) = 549{,}000 - 2750\,t$ kg. Estimate the drag loss.

**At the peak.** Drag is $D = 30{,}000 \times 4.2 = 1.26 \times 10^{5}\,\mathrm{N}$. The mass then is $549{,}000 - 2750 \times 70 \approx 356{,}500\,\mathrm{kg}$. So $D/m \approx 0.35\,\mathrm{m/s^2}$ — a few percent of $g$.

**Area under the bump.** A bell curve of height $a$ and width parameter $w$ has area $a\,w\sqrt{\pi}$. Here that is $0.35 \times 35 \times \sqrt{\pi} \approx 22\,\mathrm{m/s}$. Integrating on a computer with the mass changing along the way gives $23\,\mathrm{m/s}$.

**Does it make sense?** Even allowing for a broader real pulse and the rise in $C_D$ near the speed of sound, this rocket's drag loss is a few tens of metres per second — ten times smaller than its gravity loss. Now halve the diameter while keeping the same density of construction. Area over mass doubles, so $D/m$ doubles at every instant: a $1.8\,\mathrm{m}$ rocket on the same path would lose about twice as much, and a still smaller one more again.
:::

## Steering loss

Push a stroller at a slant, and part of your push goes sideways, doing nothing for your speed. That is steering loss.

The steering-loss integral is $\int (T/m)(1 - \cos\alpha)\,dt$. With the thrust tipped at $\alpha$ from the velocity, only $T\cos\alpha$ adds speed. The missing $T(1 - \cos\alpha)$ is the price of using thrust to *turn* instead of to speed up.

For small angles, $1 - \cos\alpha \approx \alpha^2/2$ (with $\alpha$ in radians). That square makes a few degrees of steering nearly **[[free|small-angle-cost]]**. At $\alpha = 3°$, $1 - \cos\alpha \approx 0.00137$ — one part in about 730 of the thrust. At $30°$ it is $13\%$. At $90°$ it is all of it.

::: key Steering loss
The steering-loss integral is $\int (T/m)(1 - \cos\alpha)\,dt$, where $\alpha$ is the angle between the thrust vector and the velocity vector. Small $\alpha$ is cheap because $1 - \cos\alpha \approx \alpha^2/2$.
:::

On a well-flown climb, steering loss is a few tens of metres per second. Two quick numbers:

- Hold $\alpha = 3°$ for a whole $300\,\mathrm{s}$ second-stage burn at an average $T/m = 20\,\mathrm{m/s^2}$: $20 \times 0.00137 \times 300 \approx 8\,\mathrm{m/s}$.
- Hold $15°$ for $20\,\mathrm{s}$ near liftoff at $T/m = 13.6\,\mathrm{m/s^2}$: $1 - \cos 15° = 0.0341$, so $13.6 \times 0.0341 \times 20 \approx 9\,\mathrm{m/s}$.

Neither is expensive. What *is* expensive is a big $\alpha$ in thick air: the wind hits the rocket's side, and the side load grows like $\bar{q}\,\alpha$. That load, not the lost speed, is what breaks launch vehicles.

## The gravity turn

Throw a ball at a slant. Nobody steers it, yet gravity bends its path over. A rocket can let gravity do its turning too.

Set $\alpha = 0$, so the thrust points exactly along the velocity. The across-track equation becomes

$$
\frac{d\gamma}{dt} = -\frac{g}{v}\cos\gamma .
$$

Gravity's across-track part, $g\cos\gamma$, bends the path downward. The bend is quick when the rocket is slow ($v$ small, so $g/v$ big). It is zero when the rocket is exactly vertical, because then $\cos\gamma = 0$. This way of flying is the **gravity turn**.

A rocket that is exactly vertical never turns. So the manoeuvre starts with a small, brief **[[pitch-over|pitch-over]]**: a few degrees of $\alpha$ for a few seconds shortly after liftoff, at perhaps $50\,\mathrm{m/s}$. Then the thrust goes back along the velocity and gravity does the rest.

At $\gamma = 85°$ and $v = 100\,\mathrm{m/s}$, the rate is $(9.8/100) \times \cos 85° \approx 0.0085\,\mathrm{rad/s}$, about half a degree per second. At $\gamma = 45°$ and $v = 1000\,\mathrm{m/s}$ it is $0.4°/\mathrm{s}$. Near orbital speed it is tiny; guidance does the last flattening with a small $\alpha$, once the air is gone.

That is why every orbital launcher flies one.

- **No steering loss**, because $\alpha = 0$.
- **No side load.** The angle of attack, and so the side load $\bar{q}\alpha$, stays near zero through max-Q. That structural limit shapes first-stage design more than anything else.
- **The right compromise.** The path is steep while the air is thick and flat once it is thin — exactly the balance the gravity and drag integrals ask for.

The price is freedom. After the pitch-over, the path is fixed by the kick, the thrust and the air, so first-stage guidance boils down to choosing the size and timing of that kick — the sweep the simulation exercise asks you to run. Too small a kick and the rocket stays steep and pays gravity loss. Too large and it flattens early, pays drag loss, and may not climb high enough before staging.

::: key Gravity turn
A gravity turn: after a small initial pitch-over, the vehicle flies at zero angle of attack and lets gravity rotate the velocity vector, $\dot{\gamma} = -(g/v)\cos\gamma$. It costs no steering loss and keeps $\bar{q}\alpha$ near zero through max-Q, which is why every orbital launcher flies one.
:::

## What the Earth gives back

One more entry belongs in the budget, with the opposite sign. The launch pad is moving.

Earth spins once a day. A point on the equator is carried east at $\omega_E R_E$, where $\omega_E = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ is Earth's spin rate and $R_E = 6.378 \times 10^{6}\,\mathrm{m}$ its equatorial radius:

$$
\omega_E R_E = 7.2921 \times 10^{-5} \times 6.378 \times 10^{6} \approx 465\,\mathrm{m/s}.
$$

At latitude $\phi$ ("phi") the circle is smaller and the speed is $465\cos\phi$: about $409\,\mathrm{m/s}$ at Cape Canaveral ($28.5°$) and $463\,\mathrm{m/s}$ at Kourou ($5.2°$). A rocket launched due east starts with that speed for free, and orbital speed is measured in the non-spinning frame. So the **[[rotation credit|rotation-credit]]** cuts the $\Delta v$ the rocket must supply by up to $0.46\,\mathrm{km/s}$. A polar launch gets nothing. A launch westward pays it twice over.

## The budget, assembled

For a 200 km circular orbit, $r = 6378 + 200 = 6578\,\mathrm{km}$ and

$$
v_{\mathrm{circ}} = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{3.986 \times 10^{14}}{6.578 \times 10^{6}}} \approx 7.78\,\mathrm{km/s}.
$$

Now add the typical losses:

| Term | Typical value |
| --- | --- |
| orbital speed, 200 km circular | $7.78\,\mathrm{km/s}$ |
| gravity loss $\int g\sin\gamma\,dt$ | $1.2$–$1.5\,\mathrm{km/s}$ |
| drag loss $\int D/m\,dt$ | $0.05$–$0.2\,\mathrm{km/s}$ |
| steering loss $\int (T/m)(1 - \cos\alpha)\,dt$ | $0.02$–$0.1\,\mathrm{km/s}$ |
| back-pressure loss (if using vacuum $I_{sp}$) | $0.03$–$0.1\,\mathrm{km/s}$ |
| **sum: ideal $\Delta v$ required** | **about $9.1$–$9.7\,\mathrm{km/s}$**, usually quoted as $9.3$–$9.5$ |
| Earth-rotation credit, eastward launch | $-0.4$ to $-0.46\,\mathrm{km/s}$ |

Gravity loss is the biggest, because the rocket spends its first minute or two nearly vertical with a thrust-to-weight ratio of only $1.2$–$1.5$. Drag is small because $\bar{q}$ matters only around max-Q. Steering loss is nearly zero on a gravity turn. Engine inefficiency does not appear: it is already inside $v_e$, and so inside the ideal $\Delta v$. For a real vehicle, integrate the losses along the simulated path rather than quoting these ranges.

::: warning Three budget mistakes
**Feeding the rocket equation $7.8\,\mathrm{km/s}$.** It must be fed the *ideal* $\Delta v$, losses included. The gap is about a fifth of the total. For a kerosene–oxygen rocket ($v_e \approx 3.05\,\mathrm{km/s}$), $1.5\,\mathrm{km/s}$ of losses multiplies the mass ratio by $e^{1.5/3.05} \approx 1.6$.

**Getting the rotation credit's sign wrong.** It is not a loss. It *reduces* what the rocket must supply.

**Mixing up gravity loss with work done against gravity.** A rocket coasting upward gains potential energy with zero gravity loss, because it is not thrusting at all. Gravity loss is specifically thrust spent cancelling the along-track part of the weight.
:::

## Conservation laws as a check on the simulation

Three conservation checks for an ascent simulation fall straight out of this module.

1. **The $\Delta v$ identity.** Log the three loss integrals. Realised $\Delta v$ plus losses must equal $v_e \ln(m_0/m_f)$ at every instant, not only at burnout. A gap that grows with time is an integration error. A constant offset is a bookkeeping error — usually a stray factor of $m$.
2. **Empty-space limit.** Set $g = 0$ and $\rho = 0$. The realised $\Delta v$ must equal the rocket equation exactly, whatever the thrust level. If it depends on thrust, the mass is being differentiated somewhere it should not be (lesson 6).
3. **Energy rate.** The mechanical energy per kilogram, $\varepsilon = v^2/2 + g h$ ("epsilon"), must change at the rate $(T\cos\alpha - D)\,v/m$. That is the power of the non-conservative forces from lesson 4; gravity is already inside $\varepsilon$. Any other rate means a force is missing or has the wrong sign.

::: note Why the energy rate has to be that
Differentiate $\varepsilon$ with the chain rule: $\dot{\varepsilon} = v\dot{v} + g\dot{h}$. Put in $\dot{v} = (T\cos\alpha - D)/m - g\sin\gamma$ and $\dot{h} = v\sin\gamma$:

$$
\dot{\varepsilon} = v\,\frac{T\cos\alpha - D}{m} - g v\sin\gamma + g v\sin\gamma = \frac{(T\cos\alpha - D)\,v}{m}.
$$

The two gravity terms cancel exactly — gravity only trades kinetic for potential energy.
:::

These checks do not say the trajectory is *good* — only that the equations are solved correctly, which comes first.

## Check yourself

::: check
A rocket with a liftoff thrust-to-weight ratio of $1.3$ climbs vertically for $40\,\mathrm{s}$ before pitching over. A redesign raises the ratio to $1.6$, which shortens the vertical climb to $30\,\mathrm{s}$ for the same altitude. How much gravity loss does the redesign save during that climb? Why does the answer not depend on the rocket's mass?
:::

::: answer
Flying vertically, $\gamma = 90°$ and $\sin\gamma = 1$, so the gravity loss is $\int g\,dt = g\,\Delta t$. The saving is $9.8 \times (40 - 30) = 98\,\mathrm{m/s}$.

The integrand $g\sin\gamma$ is an acceleration, not a force, so the mass never enters; only the time spent at each angle matters. Higher thrust-to-weight cuts gravity loss purely by shortening that time.
:::

::: check
A guidance error holds the thrust $6°$ off the velocity for $120\,\mathrm{s}$ during a second-stage burn with $T/m = 18\,\mathrm{m/s^2}$. Estimate the steering loss. Compare it with the loss if the error had been $12°$.
:::

::: answer
$1 - \cos 6° \approx 0.00548$, so the loss is $18 \times 0.00548 \times 120 \approx 11.8\,\mathrm{m/s}$.

At $12°$, $1 - \cos 12° \approx 0.0219$ — four times bigger — giving about $47\,\mathrm{m/s}$. For small angles steering loss grows like $\alpha^2$, so doubling the error quadruples the cost.

Both are small next to gravity loss, so moderate pointing errors are tolerable in vacuum. In the atmosphere, $12°$ would be an unacceptable angle of attack — for structural reasons, not $\Delta v$.
:::

::: check
Write the flat-Earth gravity-turn equations for $\dot{v}$ and $\dot{\gamma}$. Explain physically why the turn rate is large when the rocket is slow, why it is exactly zero when the rocket points straight up, and why it is small again by the time the path is nearly flat.
:::

::: answer
With zero angle of attack, $\dot{v} = T/m - D/m - g\sin\gamma$ and $\dot{\gamma} = -(g/v)\cos\gamma$.

The turn is driven by gravity's across-track part, $g\cos\gamma$. The across-track acceleration is $v\dot{\gamma}$, so a given sideways pull turns the path at a rate $\propto 1/v$: a slow rocket's direction is easy to change.

At $\gamma = 90°$ gravity lies entirely along the velocity. It has no across-track part and cannot turn it. That is why a small pitch-over is needed to start the turn.

At $\gamma = 0$ gravity is entirely across-track and $\cos\gamma$ is as big as it gets, so the rate is $g/v$. But by then $v$ is large, so the rate is small. On a flat Earth the path would keep bending below the horizon; on a round Earth the $(v/r)\cos\gamma$ term pushes back against it.
:::

::: check
A launch provider says its rocket can deliver an ideal $\Delta v$ of $9.6\,\mathrm{km/s}$ from Kourou. Can it reach a 200 km eastward circular orbit with a gravity loss of $1.35\,\mathrm{km/s}$, a drag loss of $0.12\,\mathrm{km/s}$ and a steering loss of $0.05\,\mathrm{km/s}$? By what margin?
:::

::: answer
The orbit needs $7.78\,\mathrm{km/s}$ in the non-spinning frame. The pad at Kourou already supplies $0.46\,\mathrm{km/s}$ eastward, so the rocket must add $7.78 - 0.46 = 7.32\,\mathrm{km/s}$ of realised $\Delta v$.

Add the losses to get the ideal $\Delta v$ needed: $7.32 + 1.35 + 0.12 + 0.05 = 8.84\,\mathrm{km/s}$.

Against $9.6\,\mathrm{km/s}$ available, the margin is $9.6 - 8.84 = 0.76\,\mathrm{km/s}$, so yes. The margin could buy a higher orbit, a heavier payload, or a polar launch that gives up the rotation credit.
:::

::: check
An ascent simulation reports realised $\Delta v = 8.05\,\mathrm{km/s}$, gravity loss $1.30\,\mathrm{km/s}$, drag loss $0.10\,\mathrm{km/s}$ and steering loss $0.04\,\mathrm{km/s}$. The rocket has two stages with mass ratios $3.98$ and $6.84$ and exhaust speeds $3050$ and $3413\,\mathrm{m/s}$. Is the simulation consistent?
:::

::: answer
Ideal $\Delta v$, stage by stage: $3050 \ln 3.98 \approx 3050 \times 1.381 \approx 4213\,\mathrm{m/s}$ and $3413 \ln 6.84 \approx 3413 \times 1.923 \approx 6562\,\mathrm{m/s}$. Together that is about $10.78\,\mathrm{km/s}$.

The simulation's realised value plus losses is $8.05 + 1.30 + 0.10 + 0.04 = 9.49\,\mathrm{km/s}$.

They differ by about $1.3\,\mathrm{km/s}$ — far more than integration error — so the simulation is *not* consistent. A loss is under-logged, or the thrust or mass flow does not match the stated $v_e$, or the mass is handled wrongly. The identity must close before any number from the run is trusted.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\gamma$, $\alpha$ | flight-path angle above the local horizon; angle between thrust and velocity |
| $m\dot{v} = T\cos\alpha - D - mg\sin\gamma$ | along-track equation of motion, flat Earth |
| $m v\dot{\gamma} = T\sin\alpha - mg\cos\gamma$ | across-track equation; $\dot{\gamma} = -(g/v)\cos\gamma$ for a gravity turn ($\alpha = 0$) |
| $\Delta v_{\mathrm{realised}} = v_e\ln(m_0/m_f) - \int g\sin\gamma\,dt - \int D/m\,dt - \int (T/m)(1-\cos\alpha)\,dt$ | the $\Delta v$ identity; exact for every trajectory |
| gravity loss $\int g\sin\gamma\,dt$ | full $g$ vertical, zero horizontal; $1.2$–$1.5\,\mathrm{km/s}$ for LEO; shrinks with thrust-to-weight |
| drag loss $\int D/m\,dt$, $D = \bar{q}C_D A$ | bunched around max-Q ($\sim 30\,\mathrm{kPa}$, $10$–$15\,\mathrm{km}$); $0.05$–$0.2\,\mathrm{km/s}$; smaller for bigger rockets |
| steering loss $\int (T/m)(1-\cos\alpha)\,dt$ | $1 - \cos\alpha \approx \alpha^2/2$; nearly zero on a gravity turn |
| gravity turn | small pitch-over, then $\alpha = 0$ and gravity rotates $\mathbf{v}$; no steering loss, $\bar{q}\alpha \approx 0$ through max-Q |
| Earth rotation | $\omega_E R_E\cos\phi$: $465\,\mathrm{m/s}$ at the equator, $409\,\mathrm{m/s}$ at $28.5°$; a credit for an eastward launch |
| LEO budget | $7.8\,\mathrm{km/s}$ orbital $+$ losses $\approx 9.3$–$9.5\,\mathrm{km/s}$ ideal |

The last two lessons change method rather than subject. For a single body under gravity, thrust and drag, Newton's second law is the natural tool. For a gimballed engine on a flexing stage with sloshing tanks, writing out every hidden joint force is not. Lesson 8 introduces constraints and generalised coordinates, and lesson 9 the Lagrangian machinery that turns them into equations of motion without a single free-body diagram.

::: context flight-path-angle Two angles that are easy to mix up
The **flight-path angle** $\gamma$ is measured from the horizon to the *velocity* — where the rocket is actually going. The **angle** $\alpha$ is measured from the velocity to the *thrust* — where the engine is pushing. The rocket's nose usually lines up with the thrust, so $\alpha$ is close to the angle of attack the air feels.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="300" y="188" font-size="12" fill="#6c7a93">horizon</text>
  <line x1="60" y1="170" x2="244.5" y2="63.5" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="254.9,57.5 241.5,58.3 247.5,68.7" fill="#1d6fd1"/>
  <text x="228" y="92" font-size="13" fill="#1d6fd1">velocity v</text>
  <line x1="60" y1="170" x2="210.9" y2="38.8" stroke="#b4232c" stroke-width="3"/>
  <polygon points="220,30.9 207,34.3 214.9,43.3" fill="#b4232c"/>
  <text x="170" y="30" font-size="13" fill="#b4232c">thrust T</text>
  <path d="M130,170 A70,70 0 0,0 120.6,135" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="138" y="158" font-size="13" fill="#1f2a44">γ = 30°</text>
  <path d="M164,110 A120,120 0 0,0 150.2,91" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112" y="100" font-size="13" fill="#1f2a44">α</text>
</svg>
```

In the picture $\gamma = 30°$ and the thrust sits $11°$ above the velocity. On a gravity turn the red and blue arrows lie on top of each other.
:::

::: context identity-check Why engineers check the books first
The $\Delta v$ identity is like balancing a bank statement: money in must equal money spent plus money left. If your simulation's numbers do not balance, some part of it is wrong, and every plot it draws is suspect. Flight-software and trajectory teams build checks like this into their tools and run them on every case, because a sign error in a drag model can otherwise hide for months inside plausible-looking results.
:::

::: context back-pressure Air pushing back on the nozzle
The exhaust leaves the nozzle at some pressure $p_e$. At sea level the surrounding air, at about $101\,\mathrm{kPa}$, presses back on the whole exit area, so the thrust is lower than in vacuum by $p_a A_e$. The same engine gives more thrust in space. As the rocket climbs and the air thins, the thrust creeps up toward its vacuum value — the thrust equation of lesson 6 with its $(p_e - p_a)A_e$ term.
:::

::: context max-q The hardest minute of the flight
Dynamic pressure $\bar{q} = \tfrac{1}{2}\rho v^2$ is how hard the oncoming air presses. Early on the rocket is slow; late in the climb the air is almost gone. In between, the two effects cross and $\bar{q}$ peaks. That peak, max-Q, is when the air loads on the structure are at their worst. Launch commentators call it out, and many rockets, Falcon 9 among them, throttle their engines down briefly around it to ease the load.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,140 C80,139 100,100 120,55 C130,33 140,30 150,30 C165,30 175,45 190,75 C215,122 240,138 340,139" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="150" y1="30" x2="150" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="156" y="26" font-size="12" fill="#b4232c">max-Q, ~1 min</text>
  <text x="330" y="158" font-size="12" text-anchor="end" fill="#1f2a44">time</text>
  <text x="46" y="18" font-size="12" fill="#1f2a44">dynamic pressure q̄</text>
  <text x="64" y="120" font-size="11" fill="#6c7a93">slow</text>
  <text x="250" y="126" font-size="11" fill="#6c7a93">thin air</text>
</svg>
```
:::

::: context scale-height What "scale height" means
The scale height $H$ is the climb over which air density falls by a factor of $e \approx 2.72$. With $H \approx 8.5\,\mathrm{km}$, the air at $8.5\,\mathrm{km}$ — about the height of Mount Everest — is roughly a third as dense as at sea level. At $17\,\mathrm{km}$ it is about a seventh, and at $50\,\mathrm{km}$, in this simple model, about $1/360$. That fast fall-off is why drag matters only for a minute or two.
:::

::: context small-angle-cost Why small steering angles are nearly free
Split the thrust into two arrows: $T\cos\alpha$ along the velocity and $T\sin\alpha$ across it. For small $\alpha$, the across part grows in step with $\alpha$ — so it can turn the rocket usefully — while the along part barely shrinks, because $\cos\alpha$ is flat at the top. At $3°$ you get about $5\%$ of the thrust sideways and lose only about $0.14\%$ of it forward.
:::

::: context pitch-over Starting the turn with a nudge
A pencil balanced perfectly upright would stay there forever; nudge it and it topples. A rocket climbing exactly vertically is like that pencil for the gravity turn: $\dot{\gamma} = 0$ when $\gamma = 90°$. The pitch-over is the nudge. After it, gravity keeps tipping the path over, faster while the rocket is slow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="185" x2="345" y2="185" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M40,185 L40,140 C44,100 70,60 130,38 C190,20 260,15 340,14" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="40" cy="140" r="4" fill="#b4232c"/>
  <text x="50" y="152" font-size="12" fill="#b4232c">pitch-over kick</text>
  <text x="50" y="168" font-size="11" fill="#6c7a93">vertical rise</text>
  <text x="120" y="70" font-size="12" fill="#1f2a44">gravity bends the path, α = 0</text>
  <text x="250" y="34" font-size="12" fill="#1f2a44">nearly flat</text>
</svg>
```
:::

::: context rotation-credit Why launch sites sit near the equator and face east
Because Earth's spin hands an eastward rocket up to $465\,\mathrm{m/s}$, launch sites are placed as close to the equator as a country can manage, with open sea or empty land to the east so spent stages fall safely. Europe launches from Kourou in French Guiana, at $5.2°$ north, for exactly this reason. Satellites bound for polar orbits give the credit up, so they need a little more $\Delta v$ for the same altitude.
:::
