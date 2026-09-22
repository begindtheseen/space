---
id: l10-propellant-slosh
title: Propellant slosh as a pendulum or mass-spring
minutes: 21
covers:
  - propellant slosh as a pendulum or mass-spring
---

Most of a launch vehicle's mass at lift-off is liquid. Several hundred tonnes of oxygen and fuel sit in tanks a few metres wide, and when the vehicle pitches or is shoved sideways by a gust, the liquid does not follow rigidly. Its free surface tilts and swings back, and the swinging liquid pushes on the tank walls with a force that the controller, the gyros and the accelerometers all feel. This is **propellant slosh**, and it has two properties that make it a control problem rather than a structural one: it is almost undamped, and its frequency — a few tenths of a hertz for a large booster — sits right where the attitude loop has its crossover.

The physics is that of waves on the free surface of a liquid in a moving container, and the linear theory has an exact solution for a cylindrical tank. The GNC engineer uses that solution in two equivalent mechanical disguises: a pendulum of a particular length and mass hanging in the tank, or a mass on a spring sliding across it. This lesson derives the slosh frequency, gives the equivalent-model parameters, shows how the sloshing mass couples into the pitch dynamics as a pole-zero pair whose ordering depends on where the tank sits relative to the centre of gravity, and explains why baffles are the standard answer.

## Effective gravity in an accelerating tank

Liquid in a tank on the pad feels Earth's gravity $g_0$. Once the vehicle is flying, the liquid and the tank are both in free fall under gravity — gravity accelerates them identically and produces no relative motion — so the only thing pressing the liquid against the tank bottom is the vehicle's *non-gravitational* acceleration, the thrust minus drag divided by mass. This is the **effective gravity**

$$
g_{\text{eff}} = \frac{T - D}{m},
$$

directed along the body axis toward the tail. For the Falcon-9-class vehicle of Lesson 2 it is $13.7\ \mathrm{m/s^2}$ immediately after lift-off (thrust-to-weight 1.4), about $21\ \mathrm{m/s^2}$ at max-Q and $35$–$40\ \mathrm{m/s^2}$ near first-stage burnout as the tanks empty. In coasting flight it is essentially zero, the free surface has no restoring force, and the liquid wanders — the reason upper stages use settling thrusters before an engine restart. Everything below uses $g_{\text{eff}}$ where an equation on the ground would use $g$.

## The free-surface problem in a cylindrical tank

Take a cylindrical tank of radius $R$ filled to depth $h$, with cylindrical coordinates $(r, \varphi, z)$, $z$ measured upward from the undisturbed free surface. For small motions the liquid is incompressible and irrotational, so its velocity is the gradient of a potential $\Phi$ satisfying Laplace's equation $\nabla^2\Phi = 0$, with three boundary conditions:

- no flow through the wall: $\partial\Phi/\partial r = 0$ at $r = R$;
- no flow through the bottom: $\partial\Phi/\partial z = 0$ at $z = -h$;
- the linearised free-surface condition at $z = 0$: $\dfrac{\partial^2\Phi}{\partial t^2} + g_{\text{eff}}\dfrac{\partial\Phi}{\partial z} = 0$, which combines "the surface moves with the liquid" and "the pressure at the surface is constant".

Lateral slosh is the first azimuthal mode, varying as $\cos\varphi$. Separation of variables gives

$$
\Phi = A\, J_1\!\left(\frac{\xi r}{R}\right)\cos\varphi\,\cosh\!\left(\frac{\xi (z + h)}{R}\right)\cos\omega t,
$$

where $J_1$ is the Bessel function of the first kind. The $\cosh(\xi(z+h)/R)$ factor already satisfies the bottom condition (its derivative vanishes at $z = -h$). The wall condition requires $J_1'(\xi) = 0$, whose roots are

$$
\xi_1 = 1.8412, \qquad \xi_2 = 5.3314, \qquad \xi_3 = 8.5363 .
$$

Finally apply the free-surface condition at $z = 0$. The time derivative gives $-\omega^2\Phi$, and $\partial\Phi/\partial z = (\xi/R)\tanh(\xi h/R)\,\Phi$ there, so

$$
-\omega^2 + g_{\text{eff}}\,\frac{\xi}{R}\tanh\frac{\xi h}{R} = 0
\quad\Longrightarrow\quad
\omega_n^2 = \frac{\xi_n\, g_{\text{eff}}}{R}\,\tanh\frac{\xi_n h}{R} .
$$

For the first, dominant mode:

::: key
First slosh mode frequency in a cylindrical tank: $\omega^2 = (1.841\,g_{\text{eff}}/R)\cdot\tanh(1.841\,h/R)$, with $R$ the tank radius, $h$ the fill height and $g_{\text{eff}}$ the axial acceleration. For a large booster this lands near 0.2–1 Hz — uncomfortably close to the rigid-body control bandwidth.
:::

Two limits make the formula intuitive. For a **deep** tank, $h/R > 2$, $\tanh \to 1$ and $\omega^2 \approx 1.841\,g_{\text{eff}}/R$: the frequency depends only on the radius, like a deep-water wave whose wavelength is set by the tank width. For a **shallow** tank, $\tanh x \approx x$ and $\omega^2 \approx (1.841)^2 g_{\text{eff}} h/R^2$: this is the shallow-water wave speed $\sqrt{g h}$ times the wavenumber $\xi_1/R$, and the frequency falls as the tank drains. Because $h/R$ passes from deep to shallow during a burn while $g_{\text{eff}}$ rises, the slosh frequency of each tank is a moving target the controller must be scheduled against.

::: example Slosh frequencies of a booster's oxygen tank
The tank has radius $R = 1.83\ \mathrm{m}$. Just after lift-off it is deep ($h/R \approx 5$) and $g_{\text{eff}} = 13.7\ \mathrm{m/s^2}$:

$$
\omega_1 = \sqrt{\frac{1.841 \times 13.7}{1.83}\tanh(9.2)} = \sqrt{13.78} = 3.71\ \mathrm{rad/s}, \qquad f_1 = 0.59\ \mathrm{Hz}.
$$

Late in the burn, with $g_{\text{eff}} = 35\ \mathrm{m/s^2}$ and the tank still deeper than two radii, $\omega_1 = \sqrt{1.841 \times 35/1.83} = 5.93\ \mathrm{rad/s}$, $f_1 = 0.94\ \mathrm{Hz}$ — the frequency has risen by $\sqrt{35/13.7} = 1.6$ purely from the acceleration. Only when the liquid is below one radius deep does the $\tanh$ factor matter: at $h/R = 1$ it is 0.951, lowering the frequency by 2.5 %. Compare an upper stage coasting under a $0.3\ \mathrm{m/s^2}$ settling burn with a 1.83 m tank: $f_1 = \sqrt{1.841 \times 0.3/1.83}/2\pi = 0.087\ \mathrm{Hz}$, a period of eleven seconds.
:::

## The equivalent mechanical models

The linear theory also gives the force the sloshing liquid exerts on the tank, and that force is exactly reproduced by a simple mechanical system. Two are in use.

**The pendulum.** A point mass $m_1$ hanging on a massless rod of length $L_1$ in the effective gravity has $\omega^2 = g_{\text{eff}}/L_1$. Matching the slosh frequency,

$$
L_1 = \frac{R}{\xi_1\tanh(\xi_1 h/R)} \;\longrightarrow\; \frac{R}{1.841} = 0.543\,R \quad (\text{deep tank}).
$$

The pendulum picture explains the $g_{\text{eff}}$ dependence at a glance: raise the acceleration and the pendulum swings faster, exactly as the formula says.

**The mass-spring.** The same mass $m_1$ on a spring of stiffness $k_1 = m_1\omega_1^2$, constrained to slide laterally in the tank. This form drops straight into a linear state-space model of the vehicle, which is why control analyses prefer it.

The **slosh mass** is the part of the liquid that participates in the first mode; the rest moves rigidly with the tank. From the potential-flow solution,

$$
\frac{m_1}{m_{\text{liq}}} = \frac{2\tanh(\xi_1 h/R)}{\xi_1(\xi_1^2 - 1)\,(h/R)} = 0.4545\,\frac{R}{h}\tanh\!\left(1.841\,\frac{h}{R}\right).
$$

| $h/R$ | 0.5 | 1 | 2 | 3 | 4 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| $m_1/m_{\text{liq}}$ | 0.660 | 0.432 | 0.227 | 0.151 | 0.114 | 0.076 |
| $L_1/R$ | 0.748 | 0.571 | 0.544 | 0.543 | 0.543 | 0.543 |

In a deep tank only the top radius or so of liquid sloshes — the fraction falls as $R/h$ — but that is still tens of tonnes on a booster. The point where the slosh mass or pendulum hinge attaches lies a fraction of a radius below the free surface and is tabulated with the other parameters in Abramson's and Dodge's monographs; for control work the important quantities are the frequency, the slosh mass and the station along the vehicle where it acts. Higher modes carry very little mass ($\xi_2$ gives about 1.4 % of the liquid at $h/R = 1$) and are normally ignored.

::: example Slosh mass and pendulum length
The oxygen tank holds 250 t of liquid at $h/R = 2$. The slosh mass is $0.227 \times 250 = 57\ \mathrm{t}$ — more than the entire dry mass of the stage — and the equivalent pendulum is $0.544 \times 1.83 = 1.0\ \mathrm{m}$ long. As the tank drains to $h/R = 1$ with 125 t remaining, the fraction rises to 0.432 but the liquid mass has halved, so $m_1 = 54\ \mathrm{t}$: the slosh mass barely changes while the tank is deeper than about one radius, and then falls with the liquid. In the mass-spring form, at $\omega_1 = 3.71\ \mathrm{rad/s}$, the spring stiffness is $k_1 = 57\,000 \times 3.71^2 = 7.8 \times 10^5\ \mathrm{N/m}$.
:::

## Damping

A smooth-walled tank damps slosh only through the viscous boundary layer on its walls, and the damping ratio is tiny — of order $10^{-3}$ to $10^{-2}$, scaling with $\sqrt{\nu/(R^{3/2} g_{\text{eff}}^{1/2})}$ where $\nu$ is the kinematic viscosity, so large tanks of thin cryogenic liquids are the worst case. A resonance with $\zeta = 0.002$ has a magnification of $1/(2\zeta) = 250$, or 48 dB. The standard hardware fix is **ring baffles**: annular plates fixed to the wall, which shed vortices as the liquid moves past them and raise the damping to 0.05 or more near the baffle (a magnification of only 10). Baffle damping depends strongly on the depth of the free surface below the nearest baffle, so tanks carry several rings spaced down the wall. Baffles cost mass, and every kilogram of baffle is a kilogram of payload, so the control team is always asked whether it can live with fewer.

## Coupling into the pitch dynamics

Now put the mass-spring in the vehicle. Let the rigid part of the vehicle (structure plus non-sloshing liquid) have mass $m_r$ and pitch inertia $I$, with the gimbal a distance $\ell_T$ aft of the centre of gravity. Attach the slosh mass $m_s$ through a spring $k$ at a station $\ell_s$ *forward* of the centre of gravity ($\ell_s < 0$ for a tank aft of it), with $\xi$ its lateral displacement relative to the tank. Ignore aerodynamics for clarity; the gimbal applies a lateral force $-T\delta$ and a moment $T\ell_T\delta$ as in Lesson 6. The spring pulls the vehicle toward the displaced mass with force $k\xi$ at station $\ell_s$:

$$
m_r\ddot z = -T\delta + k\xi, \qquad
I\ddot\theta = T\ell_T\delta + k\ell_s\xi, \qquad
m_s(\ddot z + \ell_s\ddot\theta + \ddot\xi) = -k\xi .
$$

Substitute the first two into the third to get an equation for $\xi$ alone:

$$
\ddot\xi + k\left(\frac{1}{m_s} + \frac{1}{m_r} + \frac{\ell_s^2}{I}\right)\xi = T\left(\frac{1}{m_r} - \frac{\ell_s\ell_T}{I}\right)\delta .
$$

The slosh **pole** in the coupled vehicle is at $\omega_p^2 = k\,(1/m_s + 1/m_r + \ell_s^2/I)$, slightly above the tank-alone value $k/m_s$ because the tank itself recoils. Solving the pitch equation with $\xi(s)$ substituted gives the transfer function

$$
\frac{\theta(s)}{\delta(s)} = \frac{\mu_\delta\,(s^2 + \omega_z^2)}{s^2\,(s^2 + \omega_p^2)}, \qquad
\omega_z^2 = k\left[\frac{1}{m_s} + \frac{1}{m_r}\left(1 + \frac{\ell_s}{\ell_T}\right)\right],
$$

with $\mu_\delta = T\ell_T/I$: the slosh adds a pole-zero pair to the double integrator. Which comes first in frequency is decided by

$$
\omega_z^2 - \omega_p^2 = \frac{k\,\ell_s}{\ell_T}\left(\frac{1}{m_r} - \frac{\ell_s\ell_T}{I}\right)
= \frac{k\,\ell_s}{m_r\ell_T}\left(1 - \frac{\ell_s}{\ell_{cp}}\right), \qquad \ell_{cp} = \frac{I}{m_r\ell_T},
$$

where $\ell_{cp}$ is the station forward of the centre of gravity at which a gimbal force produces no lateral acceleration (the centre of percussion for a force at the gimbal). So a tank **aft** of the centre of gravity ($\ell_s < 0$) has its zero *below* its pole; a tank **forward** of it, but nearer than $\ell_{cp}$, has its zero *above* its pole; and a tank far forward flips back. The ordering fixes the phase the slosh pair contributes to the loop — a zero-then-pole pair gives a transient phase *lead*, a pole-then-zero pair a transient *lag* — and therefore whether the attitude controller adds or removes energy from the slosh.

::: example Forward tank versus aft tank
Use the booster of Lesson 6: total mass 420 t, of which 37.5 t is oxygen slosh mass (15 % of 250 t in a deep tank), so $m_r = 382.5\ \mathrm{t}$; $I = 1.5 \times 10^8\ \mathrm{kg\cdot m^2}$, $T = 7.6\ \mathrm{MN}$, $\ell_T = 26\ \mathrm{m}$, giving $\ell_{cp} = 1.5 \times 10^8/(382\,500 \times 26) = 15.1\ \mathrm{m}$. With $\omega_1 = 3.713\ \mathrm{rad/s}$ the spring is $k = 37\,500 \times 3.713^2 = 5.17 \times 10^5\ \mathrm{N/m}$.

Oxygen tank 12 m forward of the centre of gravity ($\ell_s = +12$, inside $\ell_{cp}$): pole at 3.954 rad/s (0.629 Hz), zero at 3.970 rad/s (0.632 Hz) — zero above pole. Fuel tank 8 m aft ($\ell_s = -8$): pole 3.919 rad/s (0.624 Hz), zero 3.837 rad/s (0.611 Hz) — zero below pole. The separations are tiny, a fraction of a percent, because $m_s/m_r$ is small; but with damping of 0.002 the pole's own half-width is even smaller, and the ordering still decides the closed-loop sign. Close the PD attitude loop of Lesson 6 ($K_p = 1.88$, $K_d = 1.59\ \mathrm{s}$) around each: the forward tank's slosh pole moves to $+0.0007 \pm 3.956j$ — unstable, a growing oscillation at 0.63 Hz — while the aft tank's moves to $-0.052 \pm 3.907j$, stable, with the controller adding damping. Add baffles ($\zeta_s = 0.05$) and both are comfortably stable ($-0.19$ and $-0.24$ real parts). In this simple model, attitude feedback destabilises a forward tank and stabilises an aft one; a real analysis includes aerodynamics, the accelerometer loop and every tank at every fill level, but the mechanism is this one.
:::

## Why slosh near crossover is dangerous, and what to do

The slosh frequency here, 0.63 Hz, is 1.7 times the attitude loop's 0.36 Hz crossover — a region where the loop gain is near unity and the controller has full authority. The controller cannot tell slosh from rigid-body motion: the gyros feel the vehicle pitch as the liquid pushes the tank, the controller commands gimbal to correct it, the gimbal shoves the tank, and the liquid is pumped at its own frequency. With damping of a few thousandths, the energy exchange builds over tens of cycles into a limit cycle set by gimbal saturation or into outright divergence. Unlike a 12 Hz bending mode, the slosh mode cannot be notched out cheaply: a notch at 0.63 Hz would cost tens of degrees of phase at 0.36 Hz.

The remedies, in order of preference:

- **Baffles**, which add real damping so that the mode decays whatever the loop does — the hardware answer, and the reason nearly every tank has them.
- **Tank and loop design**: keep slosh masses away from the destabilising stations, choose the fill sequence, schedule the attitude gains against the slosh frequency as it moves with $h/R$ and $g_{\text{eff}}$, and keep the rigid-body crossover clear of the slosh band where the aerodynamic instability allows.
- **Model the slosh state**: include the mass-spring in the controller's model — an observer estimates the slosh displacement and the controller shapes its phase at the slosh frequency so the loop damps rather than pumps. This is phase stabilisation of the slosh mode, and it is fragile in exactly the way sensor-sign phase stabilisation of bending is fragile.
- **Notching**, only when the mode is far enough from crossover to afford the phase.

::: warning
The effective gravity is the thrust acceleration, not $g_0$. On the pad the slosh frequency is set by $g_0$; in flight by $(T - D)/m$, which for a booster is 1.4 to 4 times larger and rises through the burn; in coast it is nearly zero and the linear theory no longer applies. Using $9.81$ in the formula for a vehicle under thrust underestimates every slosh frequency.
:::

::: warning
Slosh mass is not liquid mass. In a deep tank only the top radius or so of liquid sloshes, and the fraction $m_1/m_{\text{liq}}$ falls as $R/h$. Modelling the entire tank contents as a pendulum overstates the coupling by a factor of several; modelling it as rigid understates it by the same factor.
:::

## Check yourself

::: check
A fuel tank of radius 1.5 m is filled to a depth of 3.0 m in a vehicle accelerating at $20\ \mathrm{m/s^2}$. Compute the first slosh frequency, the pendulum length and the slosh mass fraction.
:::

::: answer
$h/R = 2$, so $\tanh(1.841 \times 2) = \tanh 3.68 = 0.9987$. Then $\omega_1^2 = 1.841 \times 20/1.5 \times 0.9987 = 24.5$, $\omega_1 = 4.95\ \mathrm{rad/s}$, $f_1 = 0.79\ \mathrm{Hz}$. The pendulum length is $L_1 = 1.5/(1.841 \times 0.9987) = 0.816\ \mathrm{m}$ (and $g_{\text{eff}}/L_1 = 24.5$ checks). The slosh mass fraction is $0.4545 \times (1/2) \times 0.9987 = 0.227$.
:::

::: check
Why does the slosh frequency of a deep tank depend on the tank radius but not on the fill depth, while a shallow tank's frequency depends on both?
:::

::: answer
The restoring force is effective gravity acting on the tilted free surface, and the mode's wavelength is set by the tank width through $\xi_1/R$. In a deep tank the wave motion decays with depth over a distance of order $R/\xi_1$ and never feels the bottom, so $\tanh(\xi_1 h/R) \to 1$ and $\omega^2 = \xi_1 g_{\text{eff}}/R$. In a shallow tank the bottom constrains the motion, the wave becomes a shallow-water wave with speed $\sqrt{g_{\text{eff}} h}$, and $\omega^2 \approx \xi_1^2 g_{\text{eff}} h/R^2$ depends on the depth.
:::

::: check
For the booster of the worked example, at what stations (relative to the centre of gravity) would a tank's slosh zero lie above its pole, and what does that ordering mean for a loop with attitude feedback?
:::

::: answer
The sign of $\omega_z^2 - \omega_p^2$ is that of $\ell_s(1 - \ell_s/\ell_{cp})$ with $\ell_{cp} = I/(m_r\ell_T) = 15.1\ \mathrm{m}$. It is positive — zero above pole — for tanks forward of the centre of gravity but less than 15.1 m ahead of it; negative for tanks aft of the centre of gravity or more than 15.1 m forward. In the worked example the zero-above-pole (forward-tank) case was the one that attitude feedback drove unstable, the pole-then-zero pair adding a phase lag at the slosh frequency that turns the controller's correction into pumping; the aft tank's zero-below-pole pair added lead and the loop damped it.
:::

::: check
A slosh mode has $\zeta = 0.002$ without baffles. What is its resonant magnification in decibels, and to what does a baffle raising $\zeta$ to 0.05 reduce it? Why is this more valuable than the same decibel reduction from a notch?
:::

::: answer
$1/(2 \times 0.002) = 250 = 48\ \mathrm{dB}$; with $\zeta = 0.05$, $1/0.1 = 10 = 20\ \mathrm{dB}$, a 28 dB reduction. A notch of the same depth would only hide the mode from the controller — the liquid would still slosh with $\zeta = 0.002$ when a gust excited it — and at 0.6 Hz the notch would cost tens of degrees of phase at the 0.36 Hz rigid-body crossover. The baffle removes energy from the liquid itself, so the mode decays in a few cycles regardless of what the loop does, and costs the loop nothing.
:::

::: check
During a coast the effective gravity is zero. What does the formula predict, and what does a stage actually do before restarting its engine?
:::

::: answer
With $g_{\text{eff}} = 0$ the formula gives $\omega = 0$: no restoring force, no oscillation, and the linear free-surface theory ceases to apply — the liquid can float anywhere in the tank, driven by residual accelerations and surface tension. Before a restart the stage fires small settling thrusters (or uses a low-thrust ullage burn) to produce a modest $g_{\text{eff}}$ that collects the propellant over the outlet; the slosh frequency during that settling is low — 0.087 Hz for a 1.83 m tank at $0.3\ \mathrm{m/s^2}$ — and the settling must last long enough for the resulting slow waves to damp out.
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
| $\theta/\delta = \mu_\delta(s^2 + \omega_z^2)/[s^2(s^2 + \omega_p^2)]$ | slosh adds a pole-zero pair; ordering set by $\ell_s(1 - \ell_s/\ell_{cp})$ |
| Near-crossover slosh | controller pumps it; fixes are baffles, tank/loop design, slosh-state modelling, notching last |

Bending and slosh are two instances of one problem: a lightly damped structural or fluid mode inside a control loop. The next lesson treats that problem in general — control-structure interaction — and settles the question of when to gain-stabilise and when to phase-stabilise.
