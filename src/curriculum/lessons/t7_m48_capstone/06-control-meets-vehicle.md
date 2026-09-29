---
id: l06-control-meets-vehicle
title: 'Control in the loop: TVC, gain scheduling and saturation'
minutes: 22
covers:
  - 'TVC attitude control with bending-mode and slosh notch or roll-off filtering, and gain scheduling against dynamic pressure and mass'
---

Balance a broomstick upright on your palm. You keep it up by moving your hand under it, and the push from your hand is the only thing steering it. Now imagine the broom slowly getting lighter as you hold it. The same hand movement now swings it harder, so you have to move your hand *less* to get the same result. If the broom were a little bendy, it would also wobble along its length, and your hand must not chase that wobble. If it had a cup of water taped to it, the water would slosh. And your arm can only reach so far: ask for a big correction and your hand hits its limit.

That is a landing booster's attitude control, nearly word for word. The booster steers by **[[thrust vector control|tvc]]** (TVC): it swings its engine on a pivot, the **gimbal**, so the thrust pushes a little sideways and turns the vehicle. The classical-control module built the three tools this needs — gain scheduling, notch filtering and anti-windup — each on its own example. This lesson applies all three to our one reference vehicle, in its landing burn. It finds that the gain schedule holds the loop's margins *exactly* constant through the burn, by construction. And then it finds where that stops mattering: a command so big that the gimbal hits its stop.

## How the controller is scheduled

The attitude motion in the pitch plane obeys

$$
\ddot\theta = \mu_\alpha\,\alpha + \mu_\delta\,\delta .
$$

Read $\ddot\theta$ as "theta double dot": the angular acceleration of the pitch angle $\theta$. The symbol $\alpha$ ("alpha") is the angle of attack, the angle between the vehicle and the airflow, and $\delta$ ("delta") is the gimbal deflection. The two coefficients say how strongly each one turns the vehicle:

- $\mu_\alpha$ ("mu alpha") is the **aerodynamic** term. It grows with **[[dynamic pressure|dynamic-pressure]]** $q$, the "how hard is the air pushing" number. For a rocket flying nose first it is usually destabilizing — the air tries to flip the vehicle.
- $\mu_\delta$ ("mu delta") is the **control effectiveness**: $\mu_\delta = T\ell_T/I$, thrust times the lever arm from the gimbal to the center of mass, divided by the pitch moment of inertia $I$. It says how much angular acceleration one radian of gimbal buys.

A PD controller — proportional plus derivative — sets $\delta = -(K_p\,\theta_{\text{err}} + K_d\,\dot\theta)$. Put that into the motion equation and choose the gains so the closed loop behaves like a spring and damper with a target natural frequency $\omega_n$ ("omega n") and damping ratio $\zeta$ ("zeta"). You get

$$
K_p = \frac{\omega_n^2 + \mu_\alpha}{\mu_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta}.
$$

Both $\mu_\alpha$ and $\mu_\delta$ change a lot during flight, so the gains must change with them. That is a **gain schedule**: a table of gains looked up from the flight condition.

::: key What a launch-vehicle TVC controller is scheduled on
Dynamic pressure and mass, primarily — they set aerodynamic stability and control effectiveness. The schedule is verified by frozen-time margin plots across the dispersed envelope, not at the nominal point.
:::

"**[[Frozen-time|frozen-time]]** margin plots" means: freeze the vehicle at many instants, treat each as a fixed system, and compute its stability margins. "Across the dispersed envelope" means doing this not only for the planned trajectory, but for heavier, lighter, windier and off-nominal ones too.

### The landing burn: a schedule on mass

On the way up, $\mu_\alpha$ dominates the schedule through the thick air. In the landing burn the booster has slowed to a controlled descent, and aerodynamic torque is small next to what the gimbal can do. So $\mu_\alpha \approx 0$, and the gains reduce to

$$
K_p = \frac{\omega_n^2}{\mu_\delta}, \qquad K_d = \frac{2\zeta\omega_n}{\mu_\delta}.
$$

What still changes is mass. As propellant burns, the inertia $I$ falls, so $\mu_\delta = T\ell_T/I$ rises — the broom gets lighter — and the gains must fall in step to hold the same $(\omega_n, \zeta)$. The landing-burn schedule is a schedule on mass, the opposite emphasis from the ascent schedule.

::: example The schedule at three moments in the burn
Target $\omega_n = 3.0\,\mathrm{rad/s}$, $\zeta = 0.7$, at a representative $72\%$ throttle. Take the first row and compute its gains:

$$
K_p = \frac{3.0^2}{2.720} = \frac{9}{2.720} = 3.309, \qquad K_d = \frac{2(0.7)(3.0)}{2.720} = \frac{4.2}{2.720} = 1.544.
$$

Doing the same at each time, and then computing the loop's crossover frequency $\omega_{gc}$ and phase margin (PM) from its full frequency response:

| Flight time | Mass (kg) | $I$ (kg m²) | $\mu_\delta$ | $K_p$ | $K_d$ | $\omega_{gc}$ (rad/s) | PM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $t=0\,\mathrm s$ | $31{,}600$ | $4.645\times10^6$ | $2.720$ | $3.309$ | $1.544$ | $4.589$ | $54.79^\circ$ |
| $t=10\,\mathrm s$ | $29{,}168$ | $4.288\times10^6$ | $2.947$ | $3.054$ | $1.425$ | $4.589$ | $54.79^\circ$ |
| $t=20\,\mathrm s$ | $26{,}736$ | $3.930\times10^6$ | $3.215$ | $2.799$ | $1.306$ | $4.589$ | $54.79^\circ$ |

The gains fall by about $15\%$ ($2.799 / 3.309 = 0.846$) over twenty seconds, exactly following $1/\mu_\delta$. The crossover and phase margin do not move at all. Sanity check: $\mu_\delta$ should rise in the same proportion as $I$ falls, and it does — $4.645 / 3.930 = 1.182$ and $3.215 / 2.720 = 1.182$.
:::

That is not luck. The loop only ever sees the *product* of controller and plant, and the $\mu_\delta$ cancels.

::: note Why the margins cannot move
With $\mu_\alpha = 0$ the plant from gimbal angle to pitch angle is $\mu_\delta / s^2$, and the PD controller is $K_p + K_d s$. The open loop is their product:

$$
L(s) = (K_p + K_d s)\,\frac{\mu_\delta}{s^2} = \frac{\omega_n^2 + 2\zeta\omega_n s}{s^2}.
$$

The second step substitutes the scheduled gains, $K_p\mu_\delta = \omega_n^2$ and $K_d\mu_\delta = 2\zeta\omega_n$. No $\mu_\delta$ is left. Mass and thrust have dropped out of the loop entirely, so every margin computed from $L$ is the same at every moment — provided the schedule tracks the vehicle's true $\mu_\delta$. (The table's real loop also includes the actuator, sampling and the notch below; none of those depend on mass either, so the cancellation still holds.)
:::

That exact invariance is about the rigid-body loop shape only. It assumes the schedule updates fast enough to keep up with $\mu_\delta$. Lesson 3 ran that slow-variation check for this burn: the mass changes about three times faster per control period than on ascent, and is still well inside the range where frozen-time analysis can be trusted.

## The bending mode and the notch

A booster is a long, thin tube. Flick it and it rings like a tuning fork. That ringing is a **[[bending mode|bending-mode]]**: a natural wobble with its own frequency and shape. The gyros that measure the vehicle's turn rate sit somewhere along that tube, so they feel the wobble too, and the controller must not react to it.

In its landing configuration — light, nearly empty — the reference vehicle's first bending mode is at $25.1\,\mathrm{rad/s}$, which is $25.1 / 2\pi \approx 4\,\mathrm{Hz}$. That is higher than the $2.9\,\mathrm{Hz}$ ascent-phase mode in the classical-control module's example. A lighter structure on a similar spring rings faster.

Unfiltered, the open-loop gain near this mode peaks at $+0.61\,\mathrm{dB}$ — *above* $0\,\mathrm{dB}$, a loop gain of more than one. The mode is then not gain-stabilized at all: whether it stays stable depends entirely on its phase, which shifts with the mode's uncertain frequency and shape. Flight practice for **gain stabilization** asks for the mode to sit $6$ to $12\,\mathrm{dB}$ *below* $0\,\mathrm{dB}$. A **[[notch filter|notch]]** — a filter that cuts a narrow band of frequencies — pulls it down there.

::: example The notch, checked against its design formula
The notch is

$$
N(s)=\frac{s^2+2\zeta_n\omega_m s+\omega_m^2}{s^2+2\zeta_d\omega_m s+\omega_m^2},
$$

with $\omega_m = 25.1\,\mathrm{rad/s}$ (the mode), $\zeta_n = 0.06$ and $\zeta_d = 0.35$. At exactly $s = j\omega_m$ the $s^2$ and $\omega_m^2$ terms cancel top and bottom, leaving $\zeta_n/\zeta_d$. So the depth should be

$$
20\log_{10}\!\left(\frac{0.06}{0.35}\right) = 20\log_{10}(0.1714) \approx -15.32\,\mathrm{dB}.
$$

Computing the frequency response directly gives $-15.32\,\mathrm{dB}$ too. The bending-mode peak falls from $+0.61\,\mathrm{dB}$ to $-13.97\,\mathrm{dB}$ — comfortably past the $6$ to $12\,\mathrm{dB}$ rule.

The price is paid at crossover, far below the mode. There the notch adds about $6.2^\circ$ of phase lag, and phase margin drops from $61.15^\circ$ without the notch to $54.79^\circ$ with it. Sanity check: $61.15 - 54.79 = 6.36^\circ$, a touch more than the notch's own lag, because the notch also nudges crossover slightly.
:::

When a mode sits so close to crossover that a notch would cost too much phase, the alternative is a **roll-off**: a gentle low-pass filter that lowers the loop's gain through the mode's whole region instead of a narrow notch. It costs some bandwidth instead of some phase. Here the mode is about $25.1 / 4.589 \approx 5.5$ times the crossover frequency, which leaves enough room for the sharper notch. That is a choice to make on purpose, not a default.

Where the gyro sits matters as much as the filter. A bending mode has a **[[mode shape|mode-shape]]**: some points on the vehicle swing a lot, some barely move. A rate gyro feels the local *rotation* of the structure there. Along the vehicle that rotation changes sign, so a gyro on one side of the sign change sees the wobble with the opposite sign from a gyro on the other side. If the flight gyro is on the other side from where the design assumed, a controller that was meant to damp the mode drives it instead. A deep notch is robust to that, because it removes the mode whatever its sign.

## Slosh: the water in the cup

Carry a full mug quickly around a corner and the coffee swings up the side. Rocket propellant does the same in its tanks. That is **[[slosh|slosh]]**: the free surface of the liquid rocking back and forth, pushing on the tank walls. To the controller it looks like a pendulum hung inside the vehicle.

A notch is a poor tool for slosh, because slosh does not stay at one frequency. A standard model for a cylindrical tank of radius $R$, liquid depth $h$, under acceleration $a$ gives

$$
\omega_s^2 = 1.841\,\frac{a}{R}\,\tanh\!\left(1.841\,\frac{h}{R}\right),
$$

where $\tanh$ is the hyperbolic tangent, a function that rises from $0$ toward $1$. Both $a$ and $h$ change through the burn:

- as the tank drains from $h = R$ to $h = 0.2R$, the $\tanh$ factor falls from $0.951$ to $0.352$, so the frequency drops to $\sqrt{0.352/0.951} \approx 0.61$ of its starting value;
- meanwhile, at fixed thrust, acceleration rises as mass falls — from $648/31.6 = 20.5\,\mathrm{m/s^2}$ to $648/26.74 \approx 24.2\,\mathrm{m/s^2}$ over the first twenty seconds — which raises the frequency by about $\sqrt{24.2/20.5} \approx 1.09$.

A narrow notch tuned to one frequency would be left behind. So slosh is handled in other ways: **bandwidth separation** (keep the control loop's crossover well away from where slosh lives, or accept it and keep it well damped), **baffles** in the tanks that damp the sloshing liquid, and not exciting it in the first place with sharp commands.

::: key Flex and slosh in the control loop
Bending modes are handled by notch or roll-off filtering with attention to the sensor location relative to the mode shape (a displacement sensor across a node, or a rate gyro across an antinode where the slope changes sign, sees the mode with inverted sign). Slosh is handled by bandwidth separation and by not exciting it, because notching a mode whose frequency migrates with fill level is fragile.
:::

## The join: saturation meets a big step

A scheduled, notch-filtered loop with over fifty degrees of phase margin sounds safe. It is — for small commands near the operating point where every margin above was computed. The command from the previous lesson is not small: a $15.12^\circ$ turn, asked for almost instantly at ignition. The gimbal can only swing $5^\circ$, and it **saturates** — hits its stop — the moment that step arrives.

The loop also carries a small **integral** term, which adds up error over time to remove steady offsets such as a slightly misaligned engine. While the gimbal is on its stop, the integrator keeps adding up a large error that the gimbal cannot act on. That stored-up excess is **[[windup|windup]]**, and when the vehicle finally reaches the target, the integrator is still full and drives it past.

::: example Three ways to handle the integrator
The full $15.12^\circ$ step at ignition, with the schedule above and the gimbal's real rate and position limits:

| Integrator | Peak overshoot | Settling (2% band) | Error at $6\,\mathrm s$ |
| --- | --- | --- | --- |
| Naive | $36.8^\circ$ past target | not settled by $6\,\mathrm s$ | $13.5^\circ$ |
| **[[Back-calculation|back-calculation]]** | $2.88^\circ$ past target ($19\%$) | $3.82\,\mathrm s$ | settled |
| Conditional integration | $13.2^\circ$ past target | not settled by $6\,\mathrm s$ | $11.3^\circ$ |

Sanity check on the percentage: $2.88 / 15.12 = 0.19$, so $19\%$.

The **naive** integrator keeps adding up error the whole time the gimbal is pinned. The vehicle swings far past the target and keeps swinging for many seconds — the loop was effectively open while saturated, and this command is huge next to the gimbal's authority. **Back-calculation** feeds the difference between what the gimbal actually delivers and what the controller asked for back into the integrator, draining the excess as it builds. It settles cleanly in under four seconds. **Conditional integration** simply stops integrating while saturated. It beats naive, but has still not settled after six seconds.
:::

Back-calculation's win is not just smaller overshoot. It is the difference between a controller that settles and one that does not, for a command this big against an actuator this limited. The anti-windup choice decides whether the vehicle recovers from a large turn in a time that matters.

::: key The join between control and the vehicle
A scheduled, notch-filtered loop's margins describe its behavior near the operating point the schedule was designed around. A command big enough to saturate the actuator leaves that regime — for as long as the gimbal is pinned, the loop is open — and the anti-windup scheme decides whether the vehicle recovers cleanly or oscillates for many seconds after.
:::

::: warning Margins and windup are two separate risks
A comfortable phase margin describes small-signal behavior. Saturation is a nonlinearity that no linear margin calculation sees at all, so a $54.79^\circ$ phase margin tells you nothing about what a pinned gimbal does. The gain-schedule table and the windup table answer different questions about the same loop. You need both.
:::

::: warning Shape a big command before it arrives
This lesson shows the controller *recovering* well from a large step. That is not the same as the step being a good idea. Lesson 7 moves the fix upstream: the mode manager **[[shapes the command|shaping-bridge]]** so the gimbal rarely saturates this hard at all — cheaper, in propellant and in risk, than recovering gracefully.
:::

## Check yourself

::: check
The gains fall by about $15\%$ over the burn, yet the loop's crossover and phase margin do not change at all. Explain why, using $K_p=\omega_n^2/\mu_\delta$ and $K_d=2\zeta\omega_n/\mu_\delta$.
:::

::: answer
The loop depends on the product of controller and plant, $(K_p + K_d s)\,\mu_\delta / s^2$. Multiply the scheduled gains by $\mu_\delta$ and you get $\omega_n^2 + 2\zeta\omega_n s$, with no $\mu_\delta$ left. The gains change because $\mu_\delta$ changes, in exactly the opposite proportion, so the product — the loop itself — does not change, as long as the schedule tracks the vehicle's true, current $\mu_\delta$.
:::

::: check
At $t = 10\,\mathrm s$ the table gives $\mu_\delta = 2.947$. Compute $K_p$ and $K_d$ for $\omega_n = 3.0\,\mathrm{rad/s}$, $\zeta = 0.7$, and check them against the table.
:::

::: answer
$K_p = 3.0^2 / 2.947 = 9 / 2.947 = 3.054$. $K_d = 2(0.7)(3.0)/2.947 = 4.2/2.947 = 1.425$. Both match the table. Sanity check: $\mu_\delta$ rose by $2.947/2.720 = 1.083$ from ignition, and $K_p$ fell by the same factor, $3.309 / 3.054 = 1.083$.
:::

::: check
Why is the landing-burn bending mode ($4\,\mathrm{Hz}$) higher than the ascent example's ($2.9\,\mathrm{Hz}$), and why does it matter for the notch?
:::

::: answer
A ringing structure's frequency rises when its stiffness goes up or its mass goes down. The landing vehicle is much lighter — dry structure plus a little propellant — while its stiffness comes mostly from the airframe, which does not shrink as propellant burns. So it rings faster.

It matters because the notch's phase cost at crossover depends on how far the mode sits above crossover. Here the mode is about $5.5$ times crossover, so the notch costs only about $6.2^\circ$ at crossover. A mode closer to crossover would cost much more, and might push the design toward a roll-off instead.
:::

::: check
Why is slosh usually handled by bandwidth separation, baffles and gentle commands, rather than by a notch like the bending mode?
:::

::: answer
The slosh frequency depends on the liquid depth and the vehicle's acceleration, and both change through the burn. In this lesson's numbers, draining from $h = R$ to $h = 0.2R$ alone drops the frequency to about $0.61$ of its starting value, while rising acceleration pushes it up by about $9\%$. A narrow notch sits at one frequency and would soon be cutting the wrong band. Keeping the loop away from the slosh range, damping the liquid with baffles, and not kicking it with sharp commands all keep working wherever the frequency moves.
:::

::: check
The windup table shows conditional integration beating naive, but still not settled after six seconds. Why is freezing the integrator not enough here?
:::

::: answer
Conditional integration stops the integrator from growing while the gimbal is pinned, but does nothing to bring it back toward the value that matches what the gimbal is really delivering. It stops digging the hole deeper without filling it in. The integrator is left at whatever value it had when saturation began — an accident of timing. For a command this much larger than the actuator's authority, saturation lasts long enough that this leftover value is far from right, and the loop overshoots and oscillates once the error starts to fall. Back-calculation actively drains the excess, so the integrator is already near the right value when the gimbal comes off its stop.
:::

::: check
A colleague proposes raising the gimbal limit from $5^\circ$ to $15^\circ$ so this step never saturates. What should be checked before accepting that?
:::

::: answer
It is a legitimate design change, but not a free one. A bigger deflection means more torque available, so the vehicle's response near saturation changes. It costs actuator mass and hydraulic or electric power. A larger swing may also put more force into the bending mode at the engine. The margin and notch analysis must be re-run for the new limit rather than assumed to still hold. And lesson 7's command shaping may fix the same problem more cheaply.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Pitch dynamics | $\ddot\theta = \mu_\alpha\alpha + \mu_\delta\delta$, with $\mu_\delta = T\ell_T/I$ |
| General schedule | $K_p = (\omega_n^2+\mu_\alpha)/\mu_\delta$, $K_d = 2\zeta\omega_n/\mu_\delta$; on dynamic pressure and mass; verified by frozen-time margins over the dispersed envelope |
| Landing-burn schedule | $\mu_\alpha\approx0$, so a schedule on mass through $\mu_\delta$ |
| Margin invariance | $\omega_{gc}=4.589\,\mathrm{rad/s}$, PM $=54.79^\circ$ at $t=0,10,20\,\mathrm s$ — because $\mu_\delta$ cancels in the loop |
| Bending mode | $25.1\,\mathrm{rad/s}$ ($4\,\mathrm{Hz}$); unfiltered peak $+0.61\,\mathrm{dB}$ |
| Notch | Depth $20\log_{10}(\zeta_n/\zeta_d) = -15.32\,\mathrm{dB}$; peak to $-13.97\,\mathrm{dB}$; costs about $6.2^\circ$ at crossover |
| Sensor location | A gyro on the wrong side of the mode shape's sign change sees the mode inverted |
| Slosh | Frequency moves with fill level and acceleration; handled by separation, baffles and gentle commands |
| The join | A $15.12^\circ$ step saturates the $5^\circ$ gimbal; naive integrator overshoots $36.8^\circ$; back-calculation settles in $3.82\,\mathrm s$ |
| Margins versus saturation | Margins describe small signals only; saturation needs a time-domain check |

Control's recovery from a big command is one defense. The next lesson takes up the other one, upstream: the mode manager that decides when a command this big is issued, and how to smooth the handover between two guidance laws.

::: context tvc Steering with the engine
A rocket has no rudder that works in thin air or at low speed. Instead it tilts its engine. A **gimbal** is a pivot that lets the engine swing a few degrees in two directions, pushed by hydraulic or electric actuators. Tilting the thrust by an angle $\delta$ gives a sideways force of about $T\sin\delta$ at the bottom of the vehicle, far from its center of mass, and that lever turns the whole booster. On our vehicle, $5^\circ$ of gimbal at ignition gives about $2.72 \times 0.0873 \approx 0.24\,\mathrm{rad/s^2}$, or $13.6^\circ/\mathrm{s^2}$ — the figure the previous lesson used.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <rect x="165" y="15" width="30" height="135" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="150" x2="180" y2="198" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polygon points="180,150 161.2,187.3 184.9,191.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="150" r="3.5" fill="#1f2a44"/>
  <circle cx="180" cy="75" r="5" fill="#1d6fd1"/>
  <text x="203" y="79" font-size="12" fill="#1d6fd1">center of mass</text>
  <line x1="150" y1="75" x2="150" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="145" y1="75" x2="155" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="145" y1="150" x2="155" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="117" font-size="12" text-anchor="end" fill="#1f2a44">lever arm ℓ_T</text>
  <text x="203" y="154" font-size="12" fill="#1f2a44">gimbal</text>
  <line x1="215" y1="195" x2="224.0" y2="143.8" stroke="#b4232c" stroke-width="3"/>
  <polygon points="225.4,135.9 218.1,142.7 229.9,144.8" fill="#b4232c"/>
  <text x="232" y="185" font-size="12" fill="#b4232c">thrust T, tilted by δ</text>
  <text x="180" y="10" font-size="11" text-anchor="middle" fill="#6c7a93">angle drawn exaggerated (10°)</text>
</svg>
```
:::

::: context dynamic-pressure The number for "how hard the air pushes"
**Dynamic pressure** is $q = \tfrac12\rho v^2$: half the air density times speed squared. Hold your hand out of a car window at $50$ and then at $100\,\mathrm{km/h}$: the push roughly quadruples, because speed is squared. For a rising rocket, $q$ climbs as it speeds up, then falls as the air thins, peaking at "max q", where aerodynamic loads and aerodynamic torque are largest. That is where the ascent schedule works hardest.
:::

::: context frozen-time Freezing a changing vehicle
The classical tools — Bode plots, phase margin — assume a system that does not change. A rocket burning propellant changes all the time. Frozen-time analysis pretends it is fixed at each instant, one snapshot at a time. That is trustworthy when the vehicle changes slowly compared with how fast the loop responds, which is exactly what lesson 3's slow-variation check measured. A fast event, like stage separation, can break the assumption.
:::

::: context bending-mode Why a lighter tube rings faster
A mass on a spring bounces at $\omega = \sqrt{k/m}$: stiffer spring, faster; heavier mass, slower. A bending tube is many little masses joined by springy walls, but the same rule holds. Empty the tanks and the mass drops while the walls stay as stiff, so the frequency rises. That is why the landing-burn mode, at $4\,\mathrm{Hz}$, rings faster than the fully fuelled ascent example at $2.9\,\mathrm{Hz}$.
:::

::: context notch What a notch does to the loop
A notch leaves almost every frequency alone and cuts one narrow band deeply. At crossover ($4.59\,\mathrm{rad/s}$) this notch changes the gain by less than a tenth of a decibel; at the mode ($25.1\,\mathrm{rad/s}$) it cuts $15.3\,\mathrm{dB}$, a factor of about $5.8$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,40.0 47.5,40.0 55.0,40.0 62.5,40.0 70.0,40.1 77.5,40.1 85.0,40.1 92.5,40.1 100.0,40.1 107.5,40.2 115.0,40.2 122.5,40.3 130.0,40.4 137.5,40.5 145.0,40.6 152.5,40.8 160.0,41.0 167.5,41.3 175.0,41.7 182.5,42.3 190.0,43.0 197.5,44.1 205.0,45.7 212.5,48.3 220.0,52.4 227.5,59.7 235.0,73.6 242.5,102.5 250.0,145.3 257.5,101.9 265.0,73.3 272.5,59.6 280.0,52.4 287.5,48.2 295.0,45.7 302.5,44.1 310.0,43.0 317.5,42.2 325.0,41.7 332.5,41.3 340.0,41.0"/>
  <line x1="139.3" y1="150" x2="139.3" y2="55" stroke="#f2b880" stroke-width="2"/>
  <line x1="250" y1="150" x2="250" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="34" font-size="11" fill="#6c7a93">0 dB</text>
  <text x="139.3" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">crossover 4.59</text>
  <text x="250" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">mode 25.1</text>
  <text x="258" y="140" font-size="11" fill="#b4232c">−15.3 dB</text>
  <text x="190" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">frequency, rad/s (log scale, 1 to 100)</text>
</svg>
```
:::

::: context mode-shape Where the gyro sits on the wobble
The first bending mode of a free tube bends it like a banana: the ends swing one way and the middle the other, with two still points, the **nodes**, about $22\%$ of the length in from each end. A rate gyro feels how much the tube *tilts* where it sits, and that tilt reverses across the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30.0,60.0 45.0,67.0 60.0,73.9 75.0,80.6 90.0,87.1 105.0,93.0 120.0,98.2 135.0,102.4 150.0,105.6 165.0,107.6 180.0,108.2 195.0,107.6 210.0,105.6 225.0,102.4 240.0,98.2 255.0,93.0 270.0,87.1 285.0,80.6 300.0,73.9 315.0,67.0 330.0,60.0"/>
  <circle cx="97.2" cy="90" r="4.5" fill="#1f2a44"/>
  <circle cx="262.8" cy="90" r="4.5" fill="#1f2a44"/>
  <text x="97.2" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
  <text x="262.8" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
  <rect x="114" y="92" width="12" height="12" fill="#b4232c"/>
  <rect x="234" y="92" width="12" height="12" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="120" y="126" font-size="11" text-anchor="middle" fill="#b4232c">gyro A: tilt one way</text>
  <text x="240" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">gyro B: tilt the other</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">zero tilt at the middle</text>
</svg>
```

Gyro A and gyro B see the same wobble with opposite signs. For a sensor that measures sideways motion instead of tilt, the sign flips across a node.
:::

::: context slosh Why baffles work
**Baffles** are rings or plates fixed inside a tank. They break up the sloshing wave and turn its motion into swirls that die out, the way a wave loses energy running over rocks. They add a little mass, but they make slosh far better damped, which is why launch-vehicle tanks carry them. Slosh has caused real trouble. On SpaceX's second Falcon 1 flight, in 2007, sloshing liquid oxygen in the upper stage coupled with the control system and the stage lost control. Engineers model slosh from the start for that reason.
:::

::: context windup The bathtub picture of windup
Think of the integrator as a bathtub filling with error. While the gimbal is on its stop, water keeps pouring in, even though the gimbal cannot do anything more with it. When the vehicle finally reaches the target, the tub is overflowing, and the controller keeps pushing — straight past the target — until the tub drains. The bigger the command and the longer the saturation, the fuller the tub gets.
:::

::: context back-calculation How back-calculation drains the tub
Back-calculation compares what the controller *asked* the gimbal to do with what the gimbal *actually* did (stuck at $5^\circ$). The difference is fed back into the integrator with a gain, pulling it down while saturation lasts. So the integrator tracks a value that matches what the gimbal can really deliver. When the gimbal comes off its stop, there is little excess left to drain, and the response is clean.
:::

::: context shaping-bridge Where this goes next
Instead of jumping the reference from $0^\circ$ to $15.12^\circ$ in one step, lesson 7 ramps it at a bounded rate. At a gentle enough ramp the gimbal never saturates at all, and the windup question disappears. The mode manager owns the ramp, because it is the only module that knows a mode change is happening.
:::
