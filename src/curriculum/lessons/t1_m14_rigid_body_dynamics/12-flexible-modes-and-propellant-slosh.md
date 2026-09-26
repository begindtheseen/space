---
id: l12-flexible-modes-and-propellant-slosh
title: Flexible modes and propellant slosh
minutes: 24
covers:
  - introduction to flexible modes and propellant slosh
---

Carry a full cup of coffee and turn around quickly. The cup turns with you, but the coffee lags, sloshes up one side, and pushes back on your hand. Wave a long fishing rod, and the tip wobbles along behind the handle. Neither is rigid, and each has its own rhythm.

Lesson 1 defined a rigid body as one whose parts never change their distances from each other, and every lesson since has assumed it. That is excellent for inertias, slews and spin stability, but a real vehicle has parts that move on their own. A $10\,\mathrm{m}$ solar array flexes at a fraction of a hertz. A $40\,\mathrm{m}$ rocket bends like a beam at a few hertz. Several metric tons of propellant in a partly full tank swing like a pendulum whose rhythm depends on the thrust.

Three things follow. First, the model a controller sees gains lightly damped resonances, and the controller's speed must respect them. Second, whether those resonances can be *controlled* or must be *avoided* depends on where the sensor sits relative to the actuator — the **collocation** question, the most useful structural idea in attitude control. Third, this motion turns energy into heat — the real version of lesson 8's made-up energy-sink torque. **[[Explorer 1's antennas|explorer1-bridge]]** were a flexible mode.

This introduction couples one flexible motion to one rotation, honestly derived, with the numbers that decide a design.

## One hub and one flexible mode

Picture a stiff central box — the **hub** — free to rotate about one axis through angle $\vartheta$ ("vartheta", a curly theta). It carries an appendage, say a solar array, that can bend. Describe the bending by a single number $\eta$ ("eta"), a **[[modal coordinate|mode-shape]]**: how far the appendage has bent in its first natural wobble, its **mode**.

Choose the units of $\eta$ so that the bending's kinetic energy is $\tfrac{1}{2}\dot{\eta}^2$ and its stored spring energy is $\tfrac{1}{2}\omega_n^2\eta^2$. Here $\omega_n$ ("omega sub n") is the mode's frequency with the hub held *fixed* — the **cantilevered frequency**, the one you would measure with the hub clamped in a test stand.

Rotation and bending are linked by one coefficient $\delta$ ("delta"), which says how much turning the hub shakes the mode. The energies of the pair are

$$
T = \tfrac{1}{2}I\dot{\vartheta}^2 + \tfrac{1}{2}\dot{\eta}^2 + \delta\,\dot{\vartheta}\dot{\eta},
\qquad
V = \tfrac{1}{2}\omega_n^2\eta^2 ,
$$

with $I$ the inertia of the whole vehicle with the appendage locked straight. **[[Lagrange's equations|lagrange]]**, with a damping term $2\zeta\omega_n\dot{\eta}$ ($\zeta$, "zeta", is the **damping ratio**: how fast a ringing dies away, small for lightly damped) and an external torque $M$ on the hub, give

$$
\begin{aligned}
I\ddot{\vartheta} + \delta\ddot{\eta} &= M, \\
\ddot{\eta} + \delta\ddot{\vartheta} + 2\zeta\omega_n\dot{\eta} + \omega_n^2\eta &= 0 .
\end{aligned}
$$

Everything below comes from those two lines. Read the first as a momentum statement: $I\dot{\vartheta} + \delta\dot{\eta}$ is the total angular momentum, conserved when $M = 0$ whatever the appendage does — the law behind lesson 11's wheels and lesson 8's dampers. Read the second as the appendage's own spring-and-damper, driven by the hub's angular acceleration.

The number that measures how much the appendage matters is

$$
\sigma = \frac{\delta^2}{I} ,
$$

the fraction of the vehicle's inertia that takes part in the mode. It always satisfies $0 \le \sigma < 1$.

## The transfer function, and what its zeros mean

A **transfer function** says how strongly a system answers a push at each frequency. Take **[[Laplace transforms|laplace]]** of both equations from rest; each time derivative becomes a factor of $s$. The second equation gives

$$
\eta = \frac{-\delta s^2\,\vartheta}{s^2 + 2\zeta\omega_n s + \omega_n^2} .
$$

Substitute that into the first, $Is^2\vartheta + \delta s^2\eta = M$, and multiply top and bottom by the oscillator polynomial:

$$
\frac{\vartheta(s)}{M(s)}
= \frac{s^2 + 2\zeta\omega_n s + \omega_n^2}
       {s^2\left[(I - \delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2\right]} .
$$

Three features matter.

**The rigid body is still there.** At low frequency ($s$ small) the bracket tends to $I\omega_n^2$ and the whole thing to $1/(Is^2)$. Below the mode, the appendage moves with the vehicle, and the inertia is the full $I$. At high frequency it tends to $1/[(I - \delta^2)s^2]$. Above the mode, the appendage is left behind, and the hub answers with only $I(1 - \sigma)$. A controller designed for the rigid inertia is designed for the wrong vehicle at high frequency, by exactly the factor $1 - \sigma$.

**The poles sit above the cantilevered frequency.** A **pole** is a frequency where the response rings freely — a resonance. Setting the bracket to zero (ignoring the small damping term) gives $(I - \delta^2)s^2 = -I\omega_n^2$, so there is a pole pair at

$$
\omega_p = \frac{\omega_n}{\sqrt{1 - \sigma}} ,
$$

with damping ratio $\zeta_p = \zeta\,\omega_n/[(1-\sigma)\,\omega_p] = \zeta/\sqrt{1-\sigma}$. These are the **free-free** frequencies — what you would measure by tapping the vehicle floating in orbit. They are always higher than the clamped frequencies of a ground test.

**The zeros sit at the cantilevered frequency.** A **zero** is a frequency where a push produces almost no response — an anti-resonance, where the appendage swings so as to cancel the hub's motion. The numerator is the appendage's own oscillator polynomial, so the zeros are at $\omega_n$.

When the torque is applied at the hub and the angle is measured at the hub — a **collocated** actuator and sensor — the zeros therefore lie *below* the poles. Going up in frequency you meet the rigid-body poles at zero, then a zero, then a pole: the pattern **[[interlaces|pole-zero]]**.

That interlacing is why collocated control is easy. The rigid body starts the phase at $-180^\circ$. Each zero adds $+180^\circ$, and the pole just above takes it straight back, so the phase stays between $-180^\circ$ and $0^\circ$ and never runs away. A controller feeding back measured angle and rate with positive gains is then stable however many modes there are and however badly their frequencies are known.

::: key Flexible mode, collocated case
A rigid hub with one flexible mode has $\vartheta/M = (s^2 + 2\zeta\omega_n s + \omega_n^2)\big/\{s^2[(I-\delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2]\}$. The zeros are at the cantilevered frequency $\omega_n$, the poles at the free-free frequency $\omega_p = \omega_n/\sqrt{1-\sigma}$ with $\sigma = \delta^2/I$, and the effective inertia falls from $I$ below the mode to $I(1-\sigma)$ above it. For collocated torque and measurement, poles and zeros interlace on the imaginary axis.
:::

::: example A bus with flexible solar arrays
A spacecraft has total inertia $I = 2000\,\mathrm{kg\,m^2}$ about the slew axis. Its solar arrays have a first clamped bending mode at $0.500\,\mathrm{Hz}$, so $\omega_n = 2\pi\times 0.500 = 3.1416\,\mathrm{rad/s}$, with structural damping $\zeta = 0.005$. The arrays carry a fifth of the inertia in that mode, $\sigma = 0.20$. So $\delta = \sqrt{0.2\times 2000} = \sqrt{400} = 20.0$, and the hub-only inertia is $I(1-\sigma) = 2000\times 0.8 = 1600\,\mathrm{kg\,m^2}$.

**The in-orbit frequency.** The free-free pole is at $\omega_p = 3.1416/\sqrt{0.8} = 3.5124\,\mathrm{rad/s}$, which is $3.5124/2\pi = 0.559\,\mathrm{Hz}$, with $\zeta_p = 0.005/\sqrt{0.8} = 0.00559$. A ground test with the bus clamped would report $0.500\,\mathrm{Hz}$; in orbit the same mode rings at $0.559\,\mathrm{Hz}$, twelve percent higher. Getting that boundary condition wrong is a classic way to put a **[[notch filter|notch-filter]]** in the wrong place.

**The speed limit.** With collocated sensing, the pattern is the rigid poles at zero, a zero at $0.500\,\mathrm{Hz}$ and a pole at $0.559\,\mathrm{Hz}$ — interlaced. The usual rule keeps the controller's **crossover** (roughly, how fast it reacts) below a fifth of the lowest flexible pole: $0.559/5 = 0.112\,\mathrm{Hz}$, about $0.70\,\mathrm{rad/s}$. That sizes every slew: a $30^\circ$ turn cannot go faster than the arrays allow, however much wheel torque is available.

**Damping is real.** Release the vehicle turning at $\dot{\vartheta} = 0.100\,\mathrm{rad/s}$ with the mode bent to $\eta = 0.5$ and $\dot{\eta} = 0$. Then $H = I\dot{\vartheta} + \delta\dot{\eta} = 2000\times 0.1 + 0 = 200.0\,\mathrm{N\,m\,s}$. The energy is $T + V = \tfrac{1}{2}\times 2000\times 0.01 + \tfrac{1}{2}\times 9.8696\times 0.25 = 10.000 + 1.234 = 11.234\,\mathrm{J}$.

Integrate the two equations with no torque. $H$ holds to a few parts in $10^{14}$. The bending rings down with an amplitude time constant of $1/(\zeta_p\omega_p) = 1/(0.00559\times 3.5124) = 50.9\,\mathrm{s}$: $\eta$ falls from $0.5$ to $0.178$ at $50\,\mathrm{s}$ and to $0.0031$ at $200\,\mathrm{s}$. The energy settles to $10.000\,\mathrm{J} = H^2/(2I) = 200^2/4000$, the rigid-rotation value, with $\dot{\vartheta} = H/I = 0.100\,\mathrm{rad/s}$.

Check: momentum kept, and $11.234 - 10.000 = 1.234\,\mathrm{J}$ turned into heat in the array — lesson 8's energy sink, with the damper written out as a real moving part.
:::

## Collocation, and what happens when you lose it

Now move the sensor. Suppose the rate gyro sits not on the hub but out on the appendage, where the mode's bending has size $\varphi$ ("phi") per unit $\eta$. It then measures $y = \vartheta + \varphi\eta$. Substituting the expression for $\eta$ and simplifying the same way:

$$
\frac{y(s)}{M(s)}
= \frac{(1 - \varphi\delta)s^2 + 2\zeta\omega_n s + \omega_n^2}
       {s^2\left[(I - \delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2\right]} .
$$

The poles have not moved — they belong to the vehicle, not to where you look. The zeros have, and they depend on the sensor location through the single product $\varphi\delta$. Ignoring damping, the zero is at $\omega_n/\sqrt{1 - \varphi\delta}$. Three regimes:

- **$\varphi\delta$ small.** The zeros stay near $\omega_n$, below the pole. Interlaced and easy.
- **$\varphi\delta$ between $\sigma$ and $1$.** Now $1 - \varphi\delta < 1 - \sigma$, so the zeros sit *above* the pole. Interlacing is broken: the mode takes $180^\circ$ of phase that it never gives back, and the controller's gain must be rolled off before the mode or the loop goes unstable there.
- **$\varphi\delta > 1$.** The $s^2$ coefficient turns negative. The zeros leave the imaginary axis and become two real numbers, one of them positive — a zero in the right half plane. The plant is **[[non-minimum phase|non-minimum-phase]]**: it first responds the wrong way. No amount of gain makes that loop fast; the only options are to filter the mode out entirely or move the sensor.

::: example Three gyro locations on the same vehicle
Keep the bus above: $\delta = 20.0$, $\omega_n = 3.1416\,\mathrm{rad/s}$, $\zeta = 0.005$, pole at $3.5124\,\mathrm{rad/s}$.

**Gyro where the bending is small**, $\varphi = 0.020$, so $\varphi\delta = 0.020\times 20 = 0.40$. The zeros move to $-0.026 \pm j4.056\,\mathrm{rad/s}$ ($j$ is the square root of $-1$). The size $4.06 \approx 3.1416/\sqrt{0.6}$ checks. They are still almost on the imaginary axis, but at $4.06\,\mathrm{rad/s}$ they sit *above* the pole at $3.51$. Interlacing is already gone at this modest distance, and the loop must be rolled off below $3.5\,\mathrm{rad/s}$ rather than shaped through it.

**Further out**, $\varphi = 0.060$, so $\varphi\delta = 1.20$. The zeros become real, at $+7.104$ and $-6.947\,\mathrm{rad/s}$: a right-half-plane zero at $7.10\,\mathrm{rad/s}$.

**Further still**, $\varphi = 0.080$ ($\varphi\delta = 1.60$). The right-half-plane zero has come down to $4.08\,\mathrm{rad/s}$, only $4.08/3.51 = 1.16$ times — $16$ percent above — the flexible pole, squarely in the way of any useful speed. Only the gyro's bracket changed.

The practical rules: mount rate sensors on the stiffest structure, close to the actuators; never close a loop through a sensor on an appendage; and if a sensor must go on a boom, get the mode's bending there from the structural model before designing the controller — not after the first oscillation in orbit.
:::

## Launch vehicles: bending and the control bandwidth

A launch vehicle is the hard case. It is long and thin, and aerodynamically unstable, so its controller *must* be fast. Its actuator is a swiveling engine at the bottom, its rate gyro is somewhere up the stack, and its inertia and bending frequencies both change a lot during the burn. Lesson 2 found the first stage's pitch inertia falling by a factor of about $17$ from liftoff to burnout. With fixed gains that raises the rigid-body **bandwidth** — how fast the loop responds — by about $\sqrt{17} \approx 4$, pushing it toward the bending modes.

Take a first bending mode at $2.0\,\mathrm{Hz}$, $2\pi\times 2.0 = 12.57\,\mathrm{rad/s}$, typical for a vehicle of that size. The one-fifth rule caps the rigid-body crossover at $12.57/5 = 2.51\,\mathrm{rad/s}$, which is $0.40\,\mathrm{Hz}$. Everything above that must be weakened, which is what the notch filters in a launch-vehicle autopilot do.

The sign of the bending slope at the gyro's location decides the strategy. If it is favorable, the mode can be **phase stabilized** — let through with the right timing so the loop damps it. Otherwise it must be **gain stabilized** — notched out and left to its own structural damping, which for a metal airframe is well under one percent. Gain stabilization is safer but costs bandwidth; phase stabilization buys bandwidth but needs the mode's shape and frequency known accurately, which is why launch-vehicle structural models are tested so hard.

## Propellant slosh

Liquid in a partly full tank has a free surface, and that surface carries waves — the coffee in the cup. The lowest side-to-side mode, where the whole body of liquid swings across the tank, behaves like a pendulum and is **[[modeled as one|slosh-pendulum]]**: a mass $m_s$ on a rod of length $L$ hinged inside the tank, with the rest of the propellant treated as rigidly attached.

For a round cylindrical tank of radius $R$ filled to depth $h$, under axial acceleration $a$, the first slosh mode has

$$
\omega_s^2 = \frac{\xi_1 a}{R}\tanh\!\left(\frac{\xi_1 h}{R}\right),
\qquad \xi_1 = 1.8412 ,
$$

where $\xi_1$ ("xi one") is the first stationary point of the **[[Bessel function|bessel]]** $J_1$ — a number fixed by the round shape of the tank. The **hyperbolic tangent** $\tanh$ climbs from $0$ toward $1$ and levels off. Two things about the formula shape everything.

**It scales with the square root of the acceleration, not of gravity.** A pendulum swings faster where "down" pulls harder. Under boost the slosh is fast. In coast, with $a = 0$, there is no restoring pull at all and the slosh frequency goes to zero. What remains is liquid drifting under surface tension and small leftover accelerations. That is not an oscillator, but it is very much an energy sink — lesson 8's mechanism, and the reason a spent stage with propellant in it wobbles its way into a flat spin.

**It depends only weakly on fill level once the tank is more than about half full,** because $\tanh$ levels off. For $h/R = 5$ the factor is $1.0000$; at $h/R = 1$ it is $0.9509$; only below about $h/R = 0.5$, where it is $0.726$, does the frequency drop much.

::: example Slosh in a first-stage tank
Take the Falcon 9 first stage of lesson 2: radius $R = 1.83\,\mathrm{m}$, tanks much deeper than wide, so $\tanh \to 1$.

**Frequency.** Under $1.5\,g_0$, $a = 1.5\times 9.80665 = 14.71\,\mathrm{m/s^2}$ and

$$
\omega_s = \sqrt{\frac{1.8412\times 14.71}{1.83}} = \sqrt{14.80} = 3.847\,\mathrm{rad/s} = 0.612\,\mathrm{Hz},
$$

a period of $1.63\,\mathrm{s}$. Late in the burn at $3.0\,g_0$ the acceleration has doubled, so the frequency grows by $\sqrt{2}$, to $0.866\,\mathrm{Hz}$. The slosh frequency sweeps upward through the flight, straight across whatever the control bandwidth is.

**Pendulum length.** $L = a/\omega_s^2 = R/\xi_1 = 1.83/1.8412 = 0.994\,\mathrm{m}$. Notice it does not depend on the acceleration at all — only the tank's shape sets it.

**How hard it pushes.** Treat $5000\,\mathrm{kg}$ of propellant as the sloshing mass, swinging $5^\circ$ off the axis. The side force is $m_s a\sin 5^\circ = 5000\times 14.71\times 0.0872 = 6410\,\mathrm{N}$. If the slosh hinge is $10\,\mathrm{m}$ from the vehicle's center of mass, that is a moment of $6410\times 10 = 6.4\times 10^4\,\mathrm{N\,m}$. Lesson 5 put a swiveling first stage's control torque at $10^5$ to $10^6\,\mathrm{N\,m}$, so the slosh is between six and sixty percent of the control authority — at a frequency the autopilot cannot ignore, in a direction it did not command.

**Coasting.** On an upper stage with a small settling thrust of $0.01\,g_0$, the frequency drops to $\sqrt{1.8412\times 0.0981/1.83} = 0.314\,\mathrm{rad/s}$, which is $0.050\,\mathrm{Hz}$, a $20\,\mathrm{s}$ period — slow enough to tangle badly with a slow attitude loop. With no settling thrust at all, the liquid drifts, losing energy at constant angular momentum until, for a prolate stage, lesson 8's flat spin arrives.
:::

The fixes are hardware rather than software:

- **Baffles** — rings or fins on the tank wall — raise the slosh damping ratio about tenfold, from a fraction of a percent to a few percent, usually enough to keep the mode out of the controller's way.
- **Diaphragms and bladders** separate the liquid from the gas above it (the **[[ullage|ullage]]**) and remove the free surface entirely, at a cost in mass and a limit on tank size.
- **Propellant management devices** — vanes and sponges that hold liquid over the outlet by surface tension — solve the coast-phase settling problem, which is a fuel-feed problem before it is a dynamics problem.

::: warning Ground test frequencies are cantilevered frequencies
A modal survey with the spacecraft bolted to a shaker measures $\omega_n$, the clamped-hub frequency — where the *zeros* are. In orbit the vehicle rings at $\omega_p = \omega_n/\sqrt{1-\sigma}$, which for $\sigma = 0.2$ is $12$ percent higher, and more for large appendages. A notch filter centered on the test frequency sits on the zero, not the pole, and does nothing useful. Convert before you use the number, and carry the uncertainty in $\sigma$ into the notch width.
:::

::: warning Slosh is not a disturbance to be estimated
It is tempting to treat slosh as an unknown outside torque for a disturbance estimator. It is not outside: the propellant is part of the vehicle, driven by the vehicle's own acceleration, and the coupling runs both ways. Treated as a disturbance, it looks like a resonance that appears whenever the controller pushes — the signature of a feedback loop. Add the pendulum as a state — two more states per tank per axis — and the behavior becomes ordinary. **[[Falcon 1's second flight|falcon1-slosh]]** is the cautionary tale.
:::

::: note Where the module's rigid-body results still hold
Nothing in lessons 1 through 7 is undone by flexibility. Those results are the leading term; the corrections are of order $\sigma$ and of the slosh mass fraction. Inertia tensors, principal axes, Euler's equations and the intermediate axis theorem remain the first model every flexible analysis starts from. But the rigid model is no longer the *whole* model: it sets the slow behavior, and the flexible modes decide how fast you may drive it.
:::

## Check yourself

::: check
A spacecraft has $I = 5000\,\mathrm{kg\,m^2}$ and a single appendage mode with cantilevered frequency $0.30\,\mathrm{Hz}$ and $\sigma = 0.36$. Find the free-free pole frequency, the high-frequency effective inertia, and the largest sensible control bandwidth.
:::

::: answer
$\omega_n = 2\pi\times 0.30 = 1.885\,\mathrm{rad/s}$.

The pole is at $\omega_p = \omega_n/\sqrt{1-\sigma} = 1.885/\sqrt{0.64} = 1.885/0.80 = 2.356\,\mathrm{rad/s}$, that is $0.375\,\mathrm{Hz}$ — twenty-five percent above the ground-test value, because $\sigma$ is large.

Above the mode the effective inertia is $I(1-\sigma) = 5000\times 0.64 = 3200\,\mathrm{kg\,m^2}$.

The one-fifth rule on the pole gives a crossover of $2.356/5 = 0.471\,\mathrm{rad/s}$, about $0.075\,\mathrm{Hz}$. A vehicle with about a third of its inertia in a floppy appendage is a slow vehicle.
:::

::: check
Explain why collocated torque and angle measurement guarantees interlaced poles and zeros, and why that makes a controller easy to design.
:::

::: answer
With the sensor at the actuator, the numerator of the transfer function is the appendage's own oscillator polynomial, so the zeros are at the cantilevered frequencies $\omega_n$. The poles are at the free-free frequencies $\omega_p = \omega_n/\sqrt{1-\sigma}$, always higher because $\sigma > 0$. So each mode brings a zero followed, a little higher, by its pole.

Each zero lifts the phase by $180^\circ$ and the pole above hands it back, so the loop's phase stays bounded between $-180^\circ$ and $0^\circ$. With many modes the pattern repeats. A passive controller — measured angle and rate fed back with positive gains — is then stable however many modes exist and however poorly their frequencies are known. That matters, because flexible frequencies are among the least certain numbers in a spacecraft model.
:::

::: check
A sloshing tank has $R = 1.2\,\mathrm{m}$ and is filled to $h = 0.9\,\mathrm{m}$. Find the slosh frequency at $2.0\,g_0$ axial acceleration and the equivalent pendulum length.
:::

::: answer
$h/R = 0.9/1.2 = 0.75$, so $\xi_1 h/R = 1.8412\times 0.75 = 1.3809$ and $\tanh(1.3809) = 0.8812$. The acceleration is $a = 2\times 9.80665 = 19.613\,\mathrm{m/s^2}$. So

$$
\omega_s = \sqrt{\frac{1.8412\times 19.613}{1.2}\times 0.8812} = \sqrt{26.52} = 5.149\,\mathrm{rad/s},
$$

that is $0.820\,\mathrm{Hz}$, a period of $1.22\,\mathrm{s}$.

The pendulum length is $L = a/\omega_s^2 = 19.613/26.52 = 0.740\,\mathrm{m}$. A deep tank would give $R/\xi_1 = 1.2/1.8412 = 0.652\,\mathrm{m}$; the shallow fill lengthens the pendulum and lowers the frequency, as a $\tanh$ factor below $1$ should.
:::

::: check
In the hub-and-appendage model with no external torque, show that $I\dot{\vartheta} + \delta\dot{\eta}$ is conserved while the total energy decreases, and identify the final state.
:::

::: answer
**Momentum.** The first equation with $M = 0$ reads $I\ddot{\vartheta} + \delta\ddot{\eta} = 0$, which is $\tfrac{d}{dt}(I\dot{\vartheta} + \delta\dot{\eta}) = 0$. That combination is the system's angular momentum $H$, and it is constant.

**Energy.** Differentiate $E = \tfrac{1}{2}I\dot{\vartheta}^2 + \tfrac{1}{2}\dot{\eta}^2 + \delta\dot{\vartheta}\dot{\eta} + \tfrac{1}{2}\omega_n^2\eta^2$ and group the terms by $\dot{\vartheta}$ and $\dot{\eta}$:

$$
\dot{E} = \dot{\vartheta}\,(I\ddot{\vartheta} + \delta\ddot{\eta}) + \dot{\eta}\,(\ddot{\eta} + \delta\ddot{\vartheta} + \omega_n^2\eta) = 0 - 2\zeta\omega_n\dot{\eta}^2 \le 0 .
$$

The first bracket is zero by the first equation; the second equals $-2\zeta\omega_n\dot{\eta}$ by the second equation.

**End state.** $H$ is fixed and $E$ falls until $\dot{\eta} = 0$, which with the second equation forces $\eta = 0$. The vehicle ends in rigid rotation at $\dot{\vartheta} = H/I$ with energy $H^2/(2I)$ — lesson 8's conclusion, with the damper written out explicitly.
:::

::: check
An upper stage coasts with half-full tanks and no settling thrust. Its axial moment is smaller than its transverse moment. What does the propellant do, and what is the consequence?
:::

::: answer
With no axial acceleration there is no restoring force, so no slosh *mode* — the liquid does not swing at a definite frequency. It drifts along the walls under surface tension and the wobble's own small accelerations, turning energy into heat through viscosity and impacts. Angular momentum is untouched, since the propellant is internal.

The stage is prolate, so it is a minor-axis spinner, and lesson 8 applies directly. At fixed $H$ and falling $T$, the nutation angle grows with time constant $I_3I_t/[k(I_t - I_3)]$, and the stage ends in a flat spin about a sideways axis. The remedies are the same as in 1958: spin about the major axis instead, add a settling thrust so the propellant stays put, or add active nutation control.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $I\ddot{\vartheta} + \delta\ddot{\eta} = M$ | Hub equation; $I\dot{\vartheta} + \delta\dot{\eta}$ is the conserved angular momentum |
| $\ddot{\eta} + \delta\ddot{\vartheta} + 2\zeta\omega_n\dot{\eta} + \omega_n^2\eta = 0$ | Mode equation, driven by hub angular acceleration |
| $\sigma = \delta^2/I$ | Fraction of the inertia taking part in the mode, $0 \le \sigma < 1$ |
| $\omega_n$, $\omega_p = \omega_n/\sqrt{1-\sigma}$ | Cantilevered (zero) and free-free (pole) frequencies; $\zeta_p = \zeta/\sqrt{1-\sigma}$ |
| Effective inertia | $I$ below the mode, $I(1-\sigma)$ above it |
| Collocated | Zeros below poles, interlaced, minimum phase, passively stabilizable |
| $y = \vartheta + \varphi\eta$ | Non-collocated measurement; numerator $(1-\varphi\delta)s^2 + 2\zeta\omega_n s + \omega_n^2$, right-half-plane zero once $\varphi\delta > 1$ |
| Bandwidth rule | Crossover below about $\omega_p/5$; above that, gain stabilize (notch) or phase stabilize |
| $\omega_s^2 = (\xi_1 a/R)\tanh(\xi_1 h/R)$, $\xi_1 = 1.8412$ | First side-to-side slosh mode of a cylindrical tank; $L = a/\omega_s^2$ |
| Slosh in coast | $a \to 0$, frequency $\to 0$; propellant becomes an energy sink, and lesson 8 takes over |
| Fixes | Baffles (damping), diaphragms (no free surface), propellant management devices (settling) |

This closes the module. You can compute inertia tensors and principal axes, integrate Euler's equations, prove the intermediate axis theorem, explain the major-axis rule, compute nutation rates, size wheels, see why CMGs are hard, and say what flexible appendages and sloshing propellant do to all of it. The next module makes exact the conversions between the frames these results used — body, inertial, orbital.

::: context explorer1-bridge The antennas that tipped a satellite
Explorer 1, America's first satellite in 1958, was a long thin cylinder spun about its long axis — a minor-axis spin. Four springy wire antennas stuck out from its middle. Every wobble made them flex a little, and each flex turned a sliver of motion into heat. Within hours the satellite had settled into a tumble end over end. In this lesson's language, those antennas were a flexible mode with damping, and lesson 8's energy argument did the rest.
:::

::: context mode-shape One number for a whole bent beam
A bending solar array has a different deflection at every point along it, which sounds like infinitely many numbers. But at its lowest natural frequency it always bends in the same *shape*, only more or less. So one number $\eta$ — how much of that shape is present — describes it. Here is the first bending shape of a beam clamped at one end, drawn to scale: the tip moves most, the root not at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="70" width="20" height="60" fill="#6c7a93"/>
  <rect x="20" y="20" width="20" height="50" fill="#6c7a93"/>
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <polyline points="40.0,100.0 68.0,99.0 96.0,96.2 124.0,91.8 152.0,86.2 180.0,79.6 208.0,72.3 236.0,64.5 264.0,56.5 292.0,48.3 320.0,40.0" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="332" y1="100" x2="332" y2="44" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="332,40 327,50 337,50" fill="#b4232c"/>
  <text x="338" y="76" font-size="12" fill="#b4232c">tip</text>
  <text x="150" y="122" font-size="12" fill="#6c7a93">straight (η = 0)</text>
  <text x="130" y="60" font-size="12" fill="#1d6fd1">first bending shape</text>
  <text x="46" y="134" font-size="11" fill="#1f2a44">clamped root</text>
</svg>
```
:::

::: context lagrange Equations from energy
Joseph-Louis Lagrange, in the 1780s, found a way to get equations of motion from energy alone. Write the kinetic energy $T$ and the stored energy $V$ in terms of whatever coordinates you like — here an angle and a bending amount — and a fixed recipe turns them into one equation per coordinate. It saves hunting for every internal force between the hub and the array, which is why flexible-structure models are almost always built this way.
:::

::: context laplace Turning calculus into algebra
The Laplace transform, named after Pierre-Simon Laplace, turns a function of time into a function of a new variable $s$. Its useful trick: taking a derivative becomes multiplying by $s$, when starting from rest. So differential equations become ordinary algebra, and the ratio of output to input — the transfer function — can be read off. Setting $s = j\omega$ gives the response to a steady wobble at frequency $\omega$. The control modules later in the course use it constantly.
:::

::: context pole-zero Reading the pattern
Mark frequencies up a vertical line: × for a pole (resonance), ○ for a zero (anti-resonance). For this lesson's bus, the left column is the gyro at the hub: zero at $0.500\,\mathrm{Hz}$ under the pole at $0.559\,\mathrm{Hz}$ — interlaced. The right column is the gyro out on the array with $\varphi\delta = 0.4$: the zero has jumped to $0.646\,\mathrm{Hz}$, above the pole, and the easy pattern is gone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="175" x2="110" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="175" x2="250" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="104" y1="164" x2="116" y2="176"/><line x1="116" y1="164" x2="104" y2="176"/>
    <line x1="244" y1="164" x2="256" y2="176"/><line x1="256" y1="164" x2="244" y2="176"/>
    <line x1="104" y1="52.2" x2="116" y2="64.2"/><line x1="116" y1="52.2" x2="104" y2="64.2"/>
    <line x1="244" y1="52.2" x2="256" y2="64.2"/><line x1="256" y1="52.2" x2="244" y2="64.2"/>
  </g>
  <circle cx="110" cy="70" r="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="250" cy="40.8" r="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="122" y="62" font-size="11" fill="#b4232c">pole 0.559 Hz</text>
  <text x="122" y="80" font-size="11" fill="#1d6fd1">zero 0.500 Hz</text>
  <text x="262" y="62" font-size="11" fill="#b4232c">pole 0.559</text>
  <text x="262" y="44" font-size="11" fill="#1d6fd1">zero 0.646</text>
  <text x="122" y="174" font-size="11" fill="#b4232c">rigid (×2)</text>
  <text x="110" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">gyro at hub</text>
  <text x="250" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">gyro on array</text>
  <text x="20" y="30" font-size="11" fill="#6c7a93">frequency ↑</text>
</svg>
```
:::

::: context notch-filter A filter that deafens one note
A **notch filter** is a piece of controller software that passes every frequency except a narrow band, which it strongly weakens — like earplugs tuned to one note. Placed on a flexible mode, it stops the controller from reacting to, and pumping energy into, that resonance. It only works if it sits on the right frequency, which is why mixing up clamped and free-free frequencies is so costly.
:::

::: context non-minimum-phase Going the wrong way first
A right-half-plane zero makes a system start its response in the wrong direction. An everyday case: pull back on an airplane's control stick to climb, and the tail first pushes down, so the plane briefly sinks before it rises. A controller that reacts hard to that first wrong-way motion makes things worse, so it must be patient — and patience means low bandwidth.
:::

::: context slosh-pendulum Liquid as a pendulum
When the whole body of liquid rocks across the tank, it acts like a mass swinging on a string. The engine's thrust plays the part of gravity: the vehicle accelerates upward at $a$, so the liquid feels pulled "down" toward the tank bottom. The harder the push, the faster the swing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="110" height="160" rx="3" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="31,110 139,90 139,178 31,178" fill="#8fb8f0"/>
  <line x1="31" y1="110" x2="139" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <text x="85" y="45" font-size="12" text-anchor="middle" fill="#6c7a93">ullage gas</text>
  <text x="85" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">liquid</text>
  <rect x="200" y="20" width="110" height="160" rx="10" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="255" cy="60" r="4" fill="#1f2a44"/>
  <line x1="255" y1="60" x2="276" y2="119" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="276" cy="119" r="11" fill="#1d6fd1"/>
  <line x1="255" y1="60" x2="255" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="215" y="150" width="80" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="292" y="120" font-size="12" fill="#1f2a44">mₛ</text>
  <text x="248" y="96" font-size="12" fill="#1f2a44">L</text>
  <text x="255" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">fixed part</text>
  <line x1="340" y1="170" x2="340" y2="40" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="340,30 334,42 346,42" fill="#b4232c"/>
  <text x="330" y="190" font-size="12" fill="#b4232c">a</text>
</svg>
```
:::

::: context bessel A number set by the round tank
Bessel functions, studied by the astronomer Friedrich Bessel in the 1820s, are the natural wave shapes on round things — a drumhead, a round pond, the liquid surface in a cylinder. The number $1.8412$ is where the function $J_1$ stops rising and turns over for the first time. It marks the lowest side-to-side wave that fits a round tank, much as a guitar string's length fixes its lowest note.
:::

::: context ullage The empty space in the tank
**Ullage** is the part of a tank not filled with liquid — usually pressurizing gas. The word is old, from wine and beer barrels: the ullage was how far short of full a cask was. Rocket engineers also speak of "ullage motors": small thrusters fired before a main engine restarts in space, to push the liquid back to the tank bottom over the outlet.
:::

::: context falcon1-slosh Falcon 1, flight 2
In March 2007 SpaceX's second Falcon 1 launch reached space, but its upper stage began to roll and wobble. The liquid oxygen was sloshing, and the wobble coupled with the stage's control system, growing until the engine shut down early. The vehicle did not reach orbit. SpaceX added slosh baffles to the upper-stage tank, and Falcon 1 reached orbit on its fourth flight in 2008.
:::
