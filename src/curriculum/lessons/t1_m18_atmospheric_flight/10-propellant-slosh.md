---
id: l10-propellant-slosh
title: Propellant slosh as a pendulum or mass-spring
minutes: 24
covers:
  - propellant slosh as a pendulum or mass-spring
---

Carry a full bowl of soup across the kitchen and stop suddenly. The soup runs up one side, falls back, runs up the other, and keeps rocking long after you have stopped. Jiggle the bowl at exactly the wrong rhythm and each rock gets bigger, until the soup is on the floor.

A rocket carries its soup by the hundreds of metric tons. Most of a launch vehicle's mass at lift-off is liquid oxygen and fuel, sitting in tanks a few meters wide. When the vehicle pitches, or a gust shoves it sideways, the liquid does not follow like a solid block. Its **[[free surface|free-surface]]** — the top of the liquid, where it meets the gas above — tilts, swings back, and swings again, pushing on the tank walls. The gyros, the accelerometers and the controller all feel that push.

This is **propellant slosh**: the rocking of liquid propellant inside its tank. Two facts make it a control problem, not a structures problem. It is almost undamped, so once started it keeps going. And its frequency, a few tenths of a hertz for a large booster, sits right where the attitude loop has its **[[crossover|crossover]]** — the frequency where the controller is working hardest.

This lesson finds the slosh frequency, swaps the liquid for a pendulum or a mass on a spring, joins that stand-in to the vehicle's pitch motion, and explains baffles.

## Effective gravity in an accelerating tank

Stand on a bathroom scale in an elevator. As it speeds up going up, the scale reads more than your weight. If the cable snapped, you and the scale would fall together and it would read zero. What presses you onto the scale is not gravity itself, but the extra push on the floor.

Liquid in a tank is the same. On the pad it feels Earth's gravity, $g_0$ ("g nought", $9.81\ \mathrm{m/s^2}$). In flight, gravity pulls the liquid and the tank equally, so it produces no motion of one relative to the other. The only thing pressing the liquid onto the tank bottom is the push that is *not* gravity: thrust minus drag, divided by mass. That is the **effective gravity**, $g_{\text{eff}}$ ("g effective"):

$$
g_{\text{eff}} = \frac{T - D}{m},
$$

where $T$ is thrust, $D$ is drag and $m$ is the vehicle's mass. It points along the body axis toward the tail.

For the Falcon-9-class vehicle of Lesson 2, $g_{\text{eff}}$ is $13.7\ \mathrm{m/s^2}$ just after lift-off (thrust-to-weight 1.4). It is about $21\ \mathrm{m/s^2}$ at max-Q, and $35$–$40\ \mathrm{m/s^2}$ near first-stage burnout as the tanks empty and the vehicle gets lighter. In coasting flight it is almost zero, nothing holds the free surface flat, and the liquid wanders. That is why upper stages fire small **[[settling thrusters|ullage]]** before restarting an engine.

## How fast the liquid rocks

Slap the water in a bathtub and a wave runs to the end, bounces, and comes back. A bigger tub rocks more slowly; stronger gravity pulls the wave back faster. A rocket tank is a round tub, so its rocking rate depends on its radius, the liquid's depth, and $g_{\text{eff}}$.

For a cylindrical tank of radius $R$ filled to depth $h$, the linear theory of waves on a free surface has an exact answer. Each rocking pattern, or **mode**, has its own frequency. The one that matters is the first, where the whole surface tilts side to side:

::: key
First slosh mode frequency in a cylindrical tank: $\omega^2 = (1.841\,g_{\text{eff}}/R)\cdot\tanh(1.841\,h/R)$, with $R$ the tank radius, $h$ the fill height and $g_{\text{eff}}$ the axial acceleration. For a large booster this lands near 0.2–1 Hz — uncomfortably close to the rigid-body control bandwidth.
:::

Here $\omega$ ("omega") is the frequency in radians per second, and $f = \omega/2\pi$ is the same thing in hertz. The number $1.841$ comes from the round shape of the tank. The function $\tanh$ ("tanch", the hyperbolic tangent) starts at $0$, climbs like a straight line at first, and levels off at $1$ once its input is bigger than about $2$.

That leveling-off gives two simple limits.

- **Deep tank** ($h/R > 2$). Then $\tanh \approx 1$ and $\omega^2 \approx 1.841\,g_{\text{eff}}/R$. The frequency depends on the radius only: like a deep-ocean wave, it never feels the bottom.
- **Shallow tank.** For a small input, $\tanh x \approx x$, so $\omega^2 \approx (1.841)^2 g_{\text{eff}}\,h/R^2$. The frequency falls as the tank drains: a shallow-water wave, whose speed is $\sqrt{g h}$.

During a burn the tank drains from deep toward shallow while $g_{\text{eff}}$ climbs, so each tank's slosh frequency is a moving target the controller must be tuned against all the way up.

::: note Why it has to be true
Put the $z$ axis up, with $z = 0$ at the flat liquid surface, and use cylindrical coordinates $(r, \varphi, z)$: distance from the tank's center line, angle around it, and height. For small motions the liquid cannot be squeezed and does not swirl, so its velocity is the slope (gradient) of a single function $\Phi$ ("capital phi"), the **velocity potential**, which obeys Laplace's equation $\nabla^2\Phi = 0$. Three conditions pin it down:

- no flow through the wall: $\partial\Phi/\partial r = 0$ at $r = R$;
- no flow through the bottom: $\partial\Phi/\partial z = 0$ at $z = -h$;
- at the surface $z = 0$: $\dfrac{\partial^2\Phi}{\partial t^2} + g_{\text{eff}}\dfrac{\partial\Phi}{\partial z} = 0$. This joins "the surface moves with the liquid" to "the pressure at the surface is constant".

Side-to-side slosh varies once around the tank, as $\cos\varphi$. Separating the variables gives

$$
\Phi = A\, J_1\!\left(\frac{\xi r}{R}\right)\cos\varphi\,\cosh\!\left(\frac{\xi (z + h)}{R}\right)\cos\omega t,
$$

where $J_1$ is a **[[Bessel function|bessel]]** of the first kind and $\xi$ ("xi") is a number still to be found. The $\cosh$ factor has zero slope at $z = -h$, so the bottom condition holds. The wall condition needs $J_1'(\xi) = 0$, whose roots are

$$
\xi_1 = 1.8412, \qquad \xi_2 = 5.3314, \qquad \xi_3 = 8.5363 .
$$

Now the surface condition at $z = 0$. Two time derivatives of $\cos\omega t$ give $-\omega^2\Phi$. The $z$ derivative gives $(\xi/R)\tanh(\xi h/R)\,\Phi$. So

$$
-\omega^2 + g_{\text{eff}}\,\frac{\xi}{R}\tanh\frac{\xi h}{R} = 0
\quad\Longrightarrow\quad
\omega_n^2 = \frac{\xi_n\, g_{\text{eff}}}{R}\,\tanh\frac{\xi_n h}{R} .
$$

The first root, $\xi_1 = 1.841$, gives the formula in the key box.
:::

::: example Slosh frequencies of a booster's oxygen tank
The tank has radius $R = 1.83\ \mathrm{m}$. Just after lift-off it is deep, $h/R \approx 5$, and $g_{\text{eff}} = 13.7\ \mathrm{m/s^2}$.

**The tanh factor.** Its input is $1.841 \times 5 = 9.2$, so $\tanh(9.2) = 1.000$ to four places.

**The frequency.** Multiply $1.841 \times 13.7 = 25.2$, divide by $1.83$ to get $13.78$, and take the square root:

$$
\omega_1 = \sqrt{13.78} = 3.71\ \mathrm{rad/s}, \qquad f_1 = \frac{3.71}{2\pi} = 0.59\ \mathrm{Hz}.
$$

**Late in the burn**, $g_{\text{eff}} = 35\ \mathrm{m/s^2}$ and the tank is still more than two radii deep: $\omega_1 = \sqrt{1.841 \times 35/1.83} = 5.93\ \mathrm{rad/s}$, so $f_1 = 0.94\ \mathrm{Hz}$. The frequency rose by $\sqrt{35/13.7} = 1.6$ times, purely from the harder push.

**When depth matters.** Only below one radius deep does $\tanh$ bite. At $h/R = 1$ it is $\tanh(1.841) = 0.951$, and since $\omega$ goes as its square root, the frequency drops by about $2.5\ \%$.

**A coasting upper stage** with the same 1.83 m tank, under a $0.3\ \mathrm{m/s^2}$ settling burn, has $f_1 = \sqrt{1.841 \times 0.3/1.83}\,/\,2\pi = 0.087\ \mathrm{Hz}$: one slow rock every eleven seconds.

Sanity check: a harder push rocks faster, a gentle one slower, as in the bathtub.
:::

## Two stand-ins: the pendulum and the mass on a spring

A control engineer does not want to carry wave equations around. Happily, the push of the sloshing liquid on the tank is copied exactly by a simple machine. Two are in use.

**The pendulum.** Hang a small weight of mass $m_1$ on a light rod of length $L_1$ inside the tank. In effective gravity it swings at $\omega^2 = g_{\text{eff}}/L_1$. Choose $L_1$ so this matches the slosh frequency:

$$
L_1 = \frac{R}{\xi_1\tanh(\xi_1 h/R)} \;\longrightarrow\; \frac{R}{1.841} = 0.543\,R \quad (\text{deep tank}).
$$

**The mass on a spring.** The same mass $m_1$ on a spring of stiffness $k_1 = m_1\omega_1^2$, free to slide sideways in the tank. This form drops straight into the vehicle's equations of motion as one more state, which is why control analyses prefer it.

Not all the liquid rocks. The **slosh mass** $m_1$ is the part of the liquid that takes part in the first mode. The rest moves with the tank as if it were solid. The wave theory gives the share:

$$
\frac{m_1}{m_{\text{liq}}} = \frac{2\tanh(\xi_1 h/R)}{\xi_1(\xi_1^2 - 1)\,(h/R)} = 0.4545\,\frac{R}{h}\tanh\!\left(1.841\,\frac{h}{R}\right),
$$

where $m_{\text{liq}}$ is all the liquid in the tank.

| $h/R$ | 0.5 | 1 | 2 | 3 | 4 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| $m_1/m_{\text{liq}}$ | 0.660 | 0.432 | 0.227 | 0.151 | 0.114 | 0.076 |
| $L_1/R$ | 0.748 | 0.571 | 0.544 | 0.543 | 0.543 | 0.543 |

In a deep tank only about the top radius of liquid rocks, so the share falls like $R/h$ — still tens of metric tons on a booster. The attachment point of the mass (or the pendulum's hinge) lies a fraction of a radius below the free surface; Abramson's and Dodge's slosh handbooks tabulate it. For control work the numbers that matter are the frequency, the slosh mass, and the station along the vehicle where it acts. Higher modes carry very little mass — the second carries about $1.4\ \%$ of the liquid at $h/R = 1$ — and are normally left out.

::: example Slosh mass and pendulum length
The oxygen tank ($R = 1.83\ \mathrm{m}$) holds 250 t of liquid at $h/R = 2$.

**Slosh mass.** From the table, $0.227 \times 250 = 57\ \mathrm{t}$. That is more than the whole dry mass of the stage.

**Pendulum length.** $0.544 \times 1.83 = 1.0\ \mathrm{m}$.

**Draining.** At $h/R = 1$ there are 125 t left. The share rises to 0.432, but the liquid has halved, so $m_1 = 0.432 \times 125 = 54\ \mathrm{t}$. The slosh mass hardly changes while the tank is deeper than about one radius, and then falls with the liquid.

**Spring.** At $\omega_1 = 3.71\ \mathrm{rad/s}$ the spring stiffness is $k_1 = 57\,000 \times 3.71^2 = 7.8 \times 10^5\ \mathrm{N/m}$.

Sanity check: under a quarter of the liquid rocks, which fits "only the top radius" in a tank two radii deep.
:::

::: warning
Slosh mass is not liquid mass. In a deep tank only the top radius or so of liquid sloshes, and the fraction $m_1/m_{\text{liq}}$ falls as $R/h$. Modeling the whole tank as a pendulum overstates the coupling several times over; modeling it all as rigid understates it by the same factor.
:::

## Damping, and why tanks have baffles

A playground swing keeps going long after one push. The only thing slowing slosh in a smooth tank is a thin layer of liquid rubbing on the wall. The **damping ratio** $\zeta$ ("zeta"), which says how fast an oscillation dies away, is tiny: about $10^{-3}$ to $10^{-2}$. It scales like $\sqrt{\nu/(R^{3/2} g_{\text{eff}}^{1/2})}$, where $\nu$ ("nu") is the liquid's kinematic viscosity (its runniness). So big tanks of thin, runny cryogenic liquids are the worst case.

Push a lightly damped system at its own frequency and it answers $1/(2\zeta)$ times harder than to a steady push. With $\zeta = 0.002$ that is $1/0.004 = 250$ times, or 48 **[[decibels|decibels]]**.

The standard hardware fix is **[[ring baffles|baffle-picture]]**: flat rings around the inside of the tank wall. Liquid rocking past their edges sheds little whirlpools that carry energy away. Near a baffle the damping rises to 0.05 or more, a magnification of only $1/0.1 = 10$. A baffle works best when it sits just below the free surface, so tanks carry several rings down the wall. Every kilogram of baffle is a kilogram of payload, so the control team is always asked whether it can live with fewer.

## How slosh joins the pitch motion

Now put the mass-spring inside the vehicle. Picture it as a small cart on a spring, riding inside a big cart.

Call the vehicle without the sloshing liquid the "rigid part". It has mass $m_r$ and pitch **moment of inertia** $I$ (its resistance to turning). Its lateral position is $z$ and its pitch angle is $\theta$ ("theta"). The engine gimbal sits a distance $\ell_T$ ("ell sub T") behind the center of gravity. The slosh mass $m_s$ hangs on a spring $k$ at a station $\ell_s$ measured *forward* of the center of gravity, so $\ell_s < 0$ for a tank behind it. Its sideways shift relative to the tank is $\xi$.

Leave out aerodynamics to keep it clear. As in Lesson 6, a gimbal angle $\delta$ ("delta") gives a lateral force $-T\delta$ and a moment $T\ell_T\delta$. The spring pulls the vehicle toward the displaced mass with a force $k\xi$ at station $\ell_s$. Newton's law for each piece:

$$
m_r\ddot z = -T\delta + k\xi, \qquad
I\ddot\theta = T\ell_T\delta + k\ell_s\xi, \qquad
m_s(\ddot z + \ell_s\ddot\theta + \ddot\xi) = -k\xi .
$$

The first equation is the rigid part sliding, the second is its turning. In the third, the slosh mass's sideways acceleration is the vehicle's, plus the turning at its station, plus its own slide.

Replace $\ddot z$ and $\ddot\theta$ in the third line using the first two. That leaves an equation for $\xi$ alone:

$$
\ddot\xi + k\left(\frac{1}{m_s} + \frac{1}{m_r} + \frac{\ell_s^2}{I}\right)\xi = T\left(\frac{1}{m_r} - \frac{\ell_s\ell_T}{I}\right)\delta .
$$

So the slosh **pole** — its natural frequency inside the vehicle — sits at $\omega_p^2 = k\,(1/m_s + 1/m_r + \ell_s^2/I)$. That is a little above the tank-alone value $k/m_s$, because the tank itself recoils.

Feed $\xi$ back into the pitch equation to get the transfer function from gimbal to attitude:

$$
\frac{\theta(s)}{\delta(s)} = \frac{\mu_\delta\,(s^2 + \omega_z^2)}{s^2\,(s^2 + \omega_p^2)}, \qquad
\omega_z^2 = k\left[\frac{1}{m_s} + \frac{1}{m_r}\left(1 + \frac{\ell_s}{\ell_T}\right)\right],
$$

with $\mu_\delta = T\ell_T/I$. The rigid vehicle alone is a double integrator, $\mu_\delta/s^2$. Slosh adds a **pole-zero pair**: a pole at $\omega_p$ and a **zero** at $\omega_z$, a frequency where the response dips to nothing. Which comes first is decided by

$$
\omega_z^2 - \omega_p^2 = \frac{k\,\ell_s}{\ell_T}\left(\frac{1}{m_r} - \frac{\ell_s\ell_T}{I}\right)
= \frac{k\,\ell_s}{m_r\ell_T}\left(1 - \frac{\ell_s}{\ell_{cp}}\right), \qquad \ell_{cp} = \frac{I}{m_r\ell_T}.
$$

Here $\ell_{cp}$ is the station forward of the center of gravity where a gimbal force produces no sideways acceleration at all — the **[[center of percussion|percussion]]** for a force at the gimbal. Read the sign off the formula:

- a tank **behind** the center of gravity ($\ell_s < 0$) has its zero *below* its pole;
- a tank **forward** of it, but closer than $\ell_{cp}$, has its zero *above* its pole;
- a tank farther forward than $\ell_{cp}$ flips back to zero below pole.

The order sets the phase the pair adds to the loop. Zero-then-pole (going up in frequency) gives a brief phase *lead*. Pole-then-zero gives a brief phase *lag*. And that decides whether the attitude controller feeds energy into the slosh or takes it out.

::: example Forward tank versus aft tank
Use the booster of Lesson 6. Total mass is 420 t. Of that, 37.5 t is oxygen slosh mass (15 % of 250 t, about right for $h/R = 3$), so $m_r = 420 - 37.5 = 382.5\ \mathrm{t}$. Also $I = 1.5 \times 10^8\ \mathrm{kg\cdot m^2}$, $T = 7.6\ \mathrm{MN}$ and $\ell_T = 26\ \mathrm{m}$.

**Center of percussion.** $\ell_{cp} = 1.5 \times 10^8/(382\,500 \times 26) = 15.1\ \mathrm{m}$.

**Spring.** With $\omega_1 = 3.713\ \mathrm{rad/s}$, $k = 37\,500 \times 3.713^2 = 5.17 \times 10^5\ \mathrm{N/m}$.

**Oxygen tank 12 m forward** ($\ell_s = +12$, inside $\ell_{cp}$): the pole is at 3.954 rad/s (0.629 Hz) and the zero at 3.970 rad/s (0.632 Hz). Zero above pole.

**Fuel tank 8 m aft** ($\ell_s = -8$): pole 3.919 rad/s (0.624 Hz), zero 3.837 rad/s (0.611 Hz). Zero below pole.

The gaps are small (0.4 % and 2 %) because $m_s/m_r$ is small, but the resonance is narrower still, so the order matters.

**Close the loop.** Wrap the PD attitude loop of Lesson 6 ($K_p = 1.88$, $K_d = 1.59\ \mathrm{s}$) around each case and find the closed-loop slosh poles. With no liquid damping, the forward tank's pole moves to $+0.0086 \pm 3.956j$: a positive real part, so an oscillation at 0.63 Hz that doubles every $\ln 2/0.0086 = 81\ \mathrm{s}$. The aft tank's moves to $-0.044 \pm 3.907j$: the controller is *adding* damping. Give the liquid its bare-wall damping of 0.002 and the forward tank is balanced on a knife edge (real part about $+0.0002$), while the aft tank sits at $-0.053$. Add baffles ($\zeta_s = 0.05$) and both are comfortably stable, with real parts near $-0.20$ and $-0.25$.

In this simple model, attitude feedback destabilizes a forward tank and stabilizes an aft one. A real analysis adds aerodynamics, the accelerometer loop and every tank at every fill level, but the mechanism is the same.
:::

## Why slosh near crossover is dangerous, and what to do

The slosh frequency here, 0.63 Hz, is only 1.7 times the attitude loop's 0.36 Hz crossover. There the controller has full authority.

The controller cannot tell slosh from the vehicle turning. The liquid pushes the tank, the gyros feel a pitch, the controller swings the engine to correct it, and the engine shoves the tank — pushing the liquid again at its own frequency, like pushing a swing at exactly the right moment. With damping of a few thousandths, the energy builds over tens of cycles. It ends either in a **[[limit cycle|limit-cycle]]**, an oscillation held at a fixed size by the gimbal hitting its stops, or in outright divergence.

Unlike a 12 Hz bending mode, slosh cannot be notched out cheaply: a notch at 0.63 Hz would cost tens of degrees of phase at 0.36 Hz.

The remedies, in order of preference:

- **Baffles**, which add real damping so the mode dies away whatever the loop does. This is the hardware answer, and the reason nearly every tank has them.
- **Tank and loop design.** Keep slosh masses away from destabilizing stations, choose the drain order, schedule the attitude gains against the moving slosh frequency, and keep the crossover clear of the slosh band where the aerodynamic instability allows.
- **Model the slosh state.** Put the mass-spring in the controller's model: an observer estimates the slosh displacement, and the controller shapes its phase at the slosh frequency so the loop damps instead of pumps. This **phase stabilization** is fragile, just as phase-stabilizing a bending mode by sensor sign is.
- **Notching**, only when the mode is far enough from crossover to afford the phase.

::: warning
The effective gravity is the thrust acceleration, not $g_0$. On the pad the slosh frequency is set by $g_0$. In flight it is set by $(T - D)/m$, which for a booster is 1.4 to 4 times larger and rises through the burn. In coast it is nearly zero and the linear theory no longer applies. Using $9.81$ in the formula for a vehicle under thrust underestimates every slosh frequency.
:::

## Check yourself

::: check
A fuel tank of radius 1.5 m is filled to a depth of 3.0 m in a vehicle accelerating at $20\ \mathrm{m/s^2}$. Find the first slosh frequency, the pendulum length and the slosh mass fraction.
:::

::: answer
First $h/R = 3.0/1.5 = 2$, so the tanh factor is $\tanh(1.841 \times 2) = \tanh 3.68 = 0.9987$.

Frequency: $\omega_1^2 = (1.841 \times 20/1.5) \times 0.9987 = 24.5$, so $\omega_1 = 4.95\ \mathrm{rad/s}$ and $f_1 = 4.95/2\pi = 0.79\ \mathrm{Hz}$.

Pendulum length: $L_1 = 1.5/(1.841 \times 0.9987) = 0.816\ \mathrm{m}$. Check: $g_{\text{eff}}/L_1 = 20/0.816 = 24.5$, the same $\omega_1^2$.

Slosh mass fraction: $0.4545 \times (1/2) \times 0.9987 = 0.227$, matching the table.
:::

::: check
Why does the slosh frequency of a deep tank depend on the tank radius but not on the fill depth, while a shallow tank's frequency depends on both?
:::

::: answer
The restoring force is effective gravity acting on the tilted free surface, and the mode's wavelength is set by the tank width through $\xi_1/R$. In a deep tank the wave motion dies out with depth over a distance of about $R/\xi_1$ and never feels the bottom. So $\tanh(\xi_1 h/R) \to 1$ and $\omega^2 = \xi_1 g_{\text{eff}}/R$.

In a shallow tank the bottom hems the motion in. The wave becomes a shallow-water wave with speed $\sqrt{g_{\text{eff}} h}$, and $\omega^2 \approx \xi_1^2 g_{\text{eff}} h/R^2$ depends on the depth.
:::

::: check
For the booster of the worked example, at what stations (relative to the center of gravity) would a tank's slosh zero lie above its pole, and what does that order mean for a loop with attitude feedback?
:::

::: answer
The sign of $\omega_z^2 - \omega_p^2$ is the sign of $\ell_s(1 - \ell_s/\ell_{cp})$, with $\ell_{cp} = I/(m_r\ell_T) = 15.1\ \mathrm{m}$.

It is positive — zero above pole — for tanks forward of the center of gravity but less than 15.1 m ahead of it. It is negative for tanks behind the center of gravity, or more than 15.1 m forward.

In the worked example, attitude feedback drove the zero-above-pole case (the forward tank) unstable: its pole-then-zero pair adds phase lag at the slosh frequency, turning the controller's corrections into pumping. The aft tank's zero-below-pole pair adds lead, and the loop damped it.
:::

::: check
A slosh mode has $\zeta = 0.002$ without baffles. What is its resonant magnification in decibels, and what does a baffle raising $\zeta$ to 0.05 bring it down to? Why is this worth more than the same decibel drop from a notch?
:::

::: answer
Without baffles: $1/(2 \times 0.002) = 250$, and $20\log_{10}250 = 48\ \mathrm{dB}$. With baffles: $1/(2 \times 0.05) = 10$, which is $20\ \mathrm{dB}$. That is a 28 dB drop.

A notch of the same depth would only hide the mode from the controller; the liquid would still slosh with $\zeta = 0.002$ whenever a gust set it going. And at 0.6 Hz the notch would cost tens of degrees of phase at the 0.36 Hz crossover. The baffle takes energy out of the liquid itself, so the mode dies in a few cycles whatever the loop does, at no cost to the loop.
:::

::: check
During a coast the effective gravity is zero. What does the formula predict, and what does a stage actually do before restarting its engine?
:::

::: answer
With $g_{\text{eff}} = 0$ the formula gives $\omega = 0$: no restoring force and no oscillation. The linear theory stops applying, and the liquid floats anywhere, moved by small leftover accelerations and surface tension.

Before a restart the stage fires small settling thrusters (an ullage burn) for a modest $g_{\text{eff}}$ that gathers the propellant over the outlet. The slosh frequency during settling is low — 0.087 Hz for a 1.83 m tank at $0.3\ \mathrm{m/s^2}$ — so the settling must last long enough for those slow waves to die down.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $g_{\text{eff}} = (T - D)/m$ | effective gravity in the tank; 13.7 → 35 m/s² through a booster burn |
| $J_1'(\xi_n) = 0$ | $\xi_1 = 1.8412$, $\xi_2 = 5.3314$, $\xi_3 = 8.5363$ |
| $\omega_n^2 = (\xi_n g_{\text{eff}}/R)\tanh(\xi_n h/R)$ | slosh frequencies; first mode 0.2–1 Hz for a large booster |
| Deep tank ($h/R > 2$) | $\omega_1^2 \approx 1.841\,g_{\text{eff}}/R$; pendulum length $0.543R$ |
| $m_1/m_{\text{liq}} = 0.4545\,(R/h)\tanh(1.841 h/R)$ | slosh mass fraction: 0.43 at $h/R = 1$, 0.23 at $h/R = 2$ |
| Mass-spring | $k_1 = m_1\omega_1^2$; pendulum $L_1 = g_{\text{eff}}/\omega_1^2$ |
| Damping | bare wall $\zeta \sim 0.001$–0.01 (up to 48 dB magnification); baffles $\sim 0.05$ |
| $\theta/\delta = \mu_\delta(s^2 + \omega_z^2)/[s^2(s^2 + \omega_p^2)]$ | slosh adds a pole-zero pair; order set by $\ell_s(1 - \ell_s/\ell_{cp})$ |
| Slosh near crossover | the controller pumps it; fixes are baffles, tank and loop design, slosh-state modeling, notching last |

Bending and slosh are two cases of one problem: a lightly damped mode of the structure or the liquid, sitting inside a control loop. The next lesson treats that problem in general — control-structure interaction — and settles when to gain-stabilize and when to phase-stabilize.

::: context free-surface The top of the liquid
A tank is never filled to the brim. The gas-filled space on top is called the **ullage**, and it holds pressurizing gas such as helium. The boundary between liquid and gas is the free surface. It is "free" because nothing solid holds it in place: only effective gravity keeps it flat. Tilt the push, or take it away, and the surface moves. Every slosh force starts there.
:::

::: context crossover Where the loop works hardest
The **crossover frequency** is where the attitude loop's gain passes through one (0 dB) on a Bode plot. Below it the controller fights errors hard. Above it the controller gradually stops responding. For the booster of Lesson 6 it is 0.36 Hz. A disturbance near crossover gets the controller's full attention, which is good for gusts and bad for anything the controller might mistake for a gust — like a tank of rocking oxygen.
:::

::: context ullage Why a restart needs a small push first
In a coast, the propellant floats as blobs, and the pump inlet may sit in gas. Starting a turbopump on gas can wreck it. So before a restart, the stage fires small thrusters — **ullage motors** or cold-gas jets — for tens of seconds. That gentle push settles the liquid over the outlet, the way a bus pulling away sends loose coffee cups sliding to the back. The Saturn V's third stage used small ullage rockets this way, and upper stages today still do.
:::

::: context bessel The wave that fits a round tank
A sine wave is the natural shape for waves in a long straight channel. In a round tank the natural shape is a **Bessel function**. $J_1$ starts at zero in the middle, rises, and wobbles like a fading sine wave. The tank wall has to sit where the curve is flat, so no liquid flows through it. The first flat spot is at $1.841$, and that is where the famous number comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30,100 41.2,85.1 52.5,70.9 63.8,58.1 75,47.2 86.2,38.7 97.5,33 108.8,30.4 120,30.8 131.2,34.2 142.5,40.3 153.8,48.9 165,59.3 176.2,71.1 187.5,83.5 198.8,96 210,107.9 221.2,118.7 232.5,127.7 243.8,134.7 255,139.3 266.2,141.4 277.5,141 288.8,138.2 300,133.2 311.2,126.5 322.5,118.5 333.8,109.6 345,100.6"/>
  <line x1="95" y1="30.2" x2="131" y2="30.2" stroke="#b4232c" stroke-width="2"/>
  <line x1="112.9" y1="30.2" x2="112.9" y2="100" stroke="#b4232c" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="112.9" y="116" font-size="12" text-anchor="middle" fill="#b4232c">1.841</text>
  <line x1="252" y1="141.5" x2="288" y2="141.5" stroke="#f2b880" stroke-width="2"/>
  <line x1="269.9" y1="141.5" x2="269.9" y2="100" stroke="#f2b880" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="269.9" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">5.331</text>
  <text x="140" y="24" font-size="12" fill="#1f2a44">flat: first mode's wall</text>
  <text x="36" y="172" font-size="12" fill="#1f2a44">J₁(x): the shape of the wave across the tank</text>
</svg>
```
:::

::: context decibels Counting in powers of ten
Engineers measure how much bigger an oscillation gets in **decibels**: $20\log_{10}$ of the amplification. Ten times is 20 dB. A hundred times is 40 dB. So 250 times is $20\log_{10}250 = 48\ \mathrm{dB}$. The scale turns multiplying into adding, which is handy when a signal passes through a sensor, a filter and an actuator in a row: add their decibels and you have the total.
:::

::: context baffle-picture What a baffle looks like
A ring baffle is a flat washer welded around the inside of the wall. Liquid rocking past its sharp inner edge rolls up into whirlpools, and those whirlpools carry the rocking energy off as heat. Several rings are spaced down the wall, so that whatever the fill level, the free surface is near one of them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="15" width="140" height="170" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M111,92 L249,78 L249,184 L111,184 Z" fill="#8fb8f0"/>
  <line x1="111" y1="92" x2="249" y2="78" stroke="#1d6fd1" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="4">
    <line x1="110" y1="60" x2="138" y2="60"/><line x1="222" y1="60" x2="250" y2="60"/>
    <line x1="110" y1="110" x2="138" y2="110"/><line x1="222" y1="110" x2="250" y2="110"/>
    <line x1="110" y1="160" x2="138" y2="160"/><line x1="222" y1="160" x2="250" y2="160"/>
  </g>
  <path d="M140,114 a6,6 0 1,0 8,4" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M220,114 a6,6 0 1,1 -8,4" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="262" y="64" font-size="12" fill="#1f2a44">ring baffle</text>
  <text x="262" y="84" font-size="12" fill="#1d6fd1">tilted free surface</text>
  <text x="262" y="122" font-size="12" fill="#b4232c">whirlpools</text>
  <text x="20" y="40" font-size="12" fill="#1f2a44">ullage gas</text>
  <text x="20" y="150" font-size="12" fill="#1f2a44">liquid</text>
</svg>
```
:::

::: context percussion The sweet spot of a bat
Hit a baseball on a bat's sweet spot and your hands feel almost no sting. The bat turns about your hands instead of shoving them. That spot is the **center of percussion**. A rocket has one too, for pushes from the gimbal: a sideways engine force both shoves the vehicle and turns it, and at one station forward of the center of gravity those two motions cancel. Here that station is 15.1 m forward. A tank placed there feels no sideways jolt from the engine at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="45" width="300" height="24" rx="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="57" r="6" fill="#1f2a44"/>
  <text x="200" y="38" font-size="12" text-anchor="middle" fill="#1f2a44">CG</text>
  <line x1="30" y1="57" x2="30" y2="104" stroke="#b4232c" stroke-width="3"/>
  <polygon points="30,114 24,102 36,102" fill="#b4232c"/>
  <text x="40" y="124" font-size="12" fill="#b4232c">gimbal force</text>
  <line x1="299" y1="30" x2="299" y2="84" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="299" y="22" font-size="12" text-anchor="middle" fill="#1d6fd1">no sideways jolt</text>
  <line x1="30" y1="80" x2="200" y2="80" stroke="#1f2a44" stroke-width="1"/>
  <text x="115" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">ℓT = 26 m</text>
  <line x1="200" y1="80" x2="299" y2="80" stroke="#1f2a44" stroke-width="1"/>
  <text x="250" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">ℓcp = 15.1 m</text>
</svg>
```
:::

::: context limit-cycle An oscillation that stops growing
A **limit cycle** is a steady oscillation with a fixed size. It grows until something stops it growing — here, the gimbal reaching its angle or rate limit, so the controller cannot push any harder. Sometimes nothing stops it in time. On Falcon 1's second flight in March 2007, slosh in the second stage's oxygen tank coupled with the roll and attitude control, the oscillation grew, and the engine shut down early short of orbit.
:::
