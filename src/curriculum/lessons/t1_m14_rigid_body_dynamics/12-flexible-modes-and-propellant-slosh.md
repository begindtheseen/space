---
id: l12-flexible-modes-and-propellant-slosh
title: Flexible modes and propellant slosh
minutes: 23
covers:
  - introduction to flexible modes and propellant slosh
---

Lesson 1 defined a rigid body as one whose mass elements never change their mutual distances, and every lesson since has assumed it. The assumption is excellent for computing inertias, for designing slews, and for understanding spin stability, and it is wrong in one important respect: a real vehicle has parts that move relative to each other, and those parts have their own dynamics. A solar array 10 m long flexes at a fraction of a hertz. A 40 m launch vehicle bends like a beam at a few hertz. Several tonnes of liquid propellant in a partly full tank swings like a pendulum whose frequency depends on the thrust.

Three things follow, and this lesson treats them in turn. First, the plant a controller sees is no longer a double integrator: it has lightly damped pole pairs and zero pairs at the flexible frequencies, and the controller's bandwidth must be placed with respect to them. Second, whether those modes can be *stabilised* or must merely be *avoided* depends on where the sensor sits relative to the actuator — the collocation question, which is the single most useful structural idea in attitude control. Third, all of this motion dissipates energy, which makes it the physical realisation of the energy sink that lesson 8 modelled with a fictitious torque. Explorer 1's antennas were a flexible mode.

The treatment here is an introduction. Full flexible-body dynamics is a modal-analysis and finite-element subject and a module of its own. What you need now is the shape of the problem: one flexible degree of freedom coupled to one rotation, honestly derived, with the pole-zero pattern that comes out of it and the numbers that decide a design.

## One hub and one flexible mode

Take a rigid hub free to rotate about one axis through angle $\vartheta$, carrying an appendage whose deflection is described by a single modal coordinate $\eta$. Mass-normalise $\eta$ so that the appendage's kinetic energy of deflection is $\tfrac{1}{2}\dot{\eta}^2$ and its strain energy is $\tfrac{1}{2}\omega_n^2\eta^2$, where $\omega_n$ is the mode's frequency with the hub held *fixed* — the cantilevered frequency. The rotation and the deflection are coupled through a single coefficient $\delta$, so the kinetic energy of the pair is

$$
T = \tfrac{1}{2}I\dot{\vartheta}^2 + \tfrac{1}{2}\dot{\eta}^2 + \delta\,\dot{\vartheta}\dot{\eta},
\qquad
V = \tfrac{1}{2}\omega_n^2\eta^2 ,
$$

with $I$ the inertia of the whole vehicle with the appendage locked. Lagrange's equations, with a modal damping term $2\zeta\omega_n\dot{\eta}$ and an external torque $M$ on the hub, give

$$
\begin{aligned}
I\ddot{\vartheta} + \delta\ddot{\eta} &= M, \\
\ddot{\eta} + \delta\ddot{\vartheta} + 2\zeta\omega_n\dot{\eta} + \omega_n^2\eta &= 0 .
\end{aligned}
$$

Everything in this lesson comes out of those two lines. Read the first as a momentum statement: $I\dot{\vartheta} + \delta\dot{\eta}$ is the total angular momentum, and with $M = 0$ it is conserved no matter what the appendage does — the same law that governed wheels in lesson 11 and dampers in lesson 8. Read the second as the appendage's own oscillator, driven by the hub's angular acceleration.

The dimensionless group that measures how much the appendage matters is

$$
\sigma = \frac{\delta^2}{I} ,
$$

the fraction of the vehicle's inertia that participates in the mode. It always satisfies $0 \le \sigma < 1$.

## The transfer function, and what its zeros mean

Take Laplace transforms from rest. The second equation gives $\eta = -\delta s^2\vartheta/(s^2 + 2\zeta\omega_n s + \omega_n^2)$, and substituting into the first,

$$
\frac{\vartheta(s)}{M(s)}
= \frac{s^2 + 2\zeta\omega_n s + \omega_n^2}
       {s^2\left[(I - \delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2\right]} .
$$

Three features matter.

**The rigid-body double integrator survives.** At low frequency the bracket tends to $I\omega_n^2$ and the whole expression to $1/(Is^2)$: below the mode, the appendage moves with the vehicle and the effective inertia is the total $I$. At high frequency it tends to $1/[(I - \delta^2)s^2]$: above the mode the appendage is left behind, and the vehicle responds with the hub inertia $I(1 - \sigma)$ alone. A controller designed for the rigid inertia is therefore designed for the wrong plant at high frequency, by exactly the factor $1 - \sigma$.

**The poles sit above the cantilevered frequency.** Setting the bracket to zero gives a pole pair at

$$
\omega_p = \frac{\omega_n}{\sqrt{1 - \sigma}} ,
$$

with damping ratio $\zeta_p = \zeta\,\omega_n/[(1-\sigma)\,\omega_p] = \zeta/\sqrt{1-\sigma}$. These are the *free-free* modal frequencies — what you would measure by tapping the vehicle in orbit — and they are always higher than the cantilevered frequencies a ground test gives with the hub clamped.

**The zeros sit at the cantilevered frequency.** The numerator is the appendage's own oscillator polynomial, so the zeros are at $\omega_n$ exactly. For a torque applied at the hub and an angle measured at the hub — a **collocated** actuator and sensor — the zeros therefore lie *below* the poles, and the imaginary axis carries the pattern pole, zero, pole as frequency increases. That interlacing is the whole reason collocated control is easy: each mode adds $-180^\circ$ of phase at its pole and gives it straight back at its zero, so the loop's phase never runs away, and any strictly positive-rate feedback is stable regardless of how many modes there are or how badly their frequencies are known.

::: key Flexible mode, collocated case
A rigid hub with one flexible mode has $\vartheta/M = (s^2 + 2\zeta\omega_n s + \omega_n^2)\big/\{s^2[(I-\delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2]\}$. The zeros are at the cantilevered frequency $\omega_n$, the poles at the free-free frequency $\omega_p = \omega_n/\sqrt{1-\sigma}$ with $\sigma = \delta^2/I$, and the effective inertia falls from $I$ below the mode to $I(1-\sigma)$ above it. For collocated torque and measurement, poles and zeros interlace on the imaginary axis.
:::

::: example A bus with flexible solar arrays
A spacecraft has total inertia $I = 2000\,\mathrm{kg\,m^2}$ about the slew axis, and its solar arrays have a first cantilevered bending mode at $0.500\,\mathrm{Hz}$, so $\omega_n = 3.1416\,\mathrm{rad/s}$, with structural damping $\zeta = 0.005$. The arrays carry a fifth of the inertia in that mode, $\sigma = 0.20$, so $\delta = \sqrt{0.2\times 2000} = 20.0$ and the hub-only inertia is $I(1-\sigma) = 1600\,\mathrm{kg\,m^2}$.

The free-free pole is at $\omega_p = 3.1416/\sqrt{0.8} = 3.5124\,\mathrm{rad/s} = 0.559\,\mathrm{Hz}$, with $\zeta_p = 0.005/\sqrt{0.8} = 0.00559$. A ground vibration test with the bus clamped would report $0.500\,\mathrm{Hz}$; in orbit the same mode rings at $0.559\,\mathrm{Hz}$, twelve per cent higher. Getting that boundary condition wrong is a classic way to mis-place a notch filter.

With collocated sensing, the imaginary-axis pattern is the rigid pole at the origin, a zero at $0.500\,\mathrm{Hz}$, and a pole at $0.559\,\mathrm{Hz}$ — interlaced. The usual bandwidth rule, keep the crossover below a fifth of the lowest flexible pole, gives $0.559/5 = 0.112\,\mathrm{Hz}$, about $0.70\,\mathrm{rad/s}$. That is the number that sizes every slew on this vehicle: a $30^\circ$ manoeuvre cannot be commanded faster than the arrays allow, no matter how much wheel torque is available.

Damping is a real effect, not a nuisance. Released with $\dot{\vartheta} = 0.100\,\mathrm{rad/s}$ and the mode deflected to $\eta = 0.5$, the system has $H = I\dot{\vartheta} + \delta\dot{\eta} = 200.0\,\mathrm{N\,m\,s}$ and energy $T + V = 11.234\,\mathrm{J}$. Integrating the two equations with no external torque: $H$ holds to four parts in $10^{14}$; the strain energy rings down with an envelope time constant $1/(\zeta_p\omega_p) = 50.9\,\mathrm{s}$; $\eta$ falls from $0.5$ to $0.178$ at $50\,\mathrm{s}$ and $0.0031$ at $200\,\mathrm{s}$; and the energy settles at exactly $10.000\,\mathrm{J} = H^2/(2I)$, the rigid-rotation value, with $\dot{\vartheta} = 0.100000\,\mathrm{rad/s} = H/I$. Momentum conserved, $1.234\,\mathrm{J}$ turned into heat in the array's structure. That is lesson 8's energy sink with the damper written out as a genuine degree of freedom.
:::

## Collocation, and what happens when you lose it

Now move the sensor. Suppose the rate gyro is not at the hub but out on the appendage, where the mode shape has amplitude $\varphi$, so the measured angle is $y = \vartheta + \varphi\eta$. Substituting the expression for $\eta$,

$$
\frac{y(s)}{M(s)}
= \frac{(1 - \varphi\delta)s^2 + 2\zeta\omega_n s + \omega_n^2}
       {s^2\left[(I - \delta^2)s^2 + 2I\zeta\omega_n s + I\omega_n^2\right]} .
$$

The poles have not moved — they are properties of the vehicle, not of where you look — but the zeros have, and they depend on the sensor location through the single product $\varphi\delta$. Three regimes:

- $\varphi\delta$ small: the zeros stay near $\omega_n$, below the pole. Interlaced, minimum phase, easy.
- $\varphi\delta$ between roughly $\sigma$ and $1$: the zeros move *above* the pole. Interlacing is broken, the mode now contributes a net $-180^\circ$ that it never returns, and gain must be rolled off before the mode or the loop will be unstable there.
- $\varphi\delta > 1$: the coefficient of $s^2$ turns negative, the zeros leave the imaginary axis and become a real pair, one of them in the right half plane. The plant is **non-minimum phase**: no amount of feedback gain can make that loop fast, and the only options are to filter the mode out entirely or move the sensor.

::: example Three gyro locations on the same vehicle
Keep the bus above, $\delta = 20.0$, $\omega_n = 3.1416\,\mathrm{rad/s}$, $\zeta = 0.005$, pole at $3.5124\,\mathrm{rad/s}$.

Put the gyro where the mode shape is small, $\varphi = 0.020$, so $\varphi\delta = 0.40$. The zeros move to $-0.026 \pm j4.056\,\mathrm{rad/s}$ — still essentially on the imaginary axis, but now at $4.06\,\mathrm{rad/s}$, *above* the pole at $3.51$. The interlacing is already gone at this modest displacement, and the loop must be rolled off below $3.5\,\mathrm{rad/s}$ rather than merely shaped through it.

Move it further out, $\varphi = 0.060$, so $\varphi\delta = 1.20$. The zeros become real, at $+7.104$ and $-6.947\,\mathrm{rad/s}$: a right-half-plane zero at $7.10\,\mathrm{rad/s}$. At $\varphi = 0.080$ the RHP zero has come down to $4.08\,\mathrm{rad/s}$, which is only $16$ per cent above the flexible pole and firmly in the way of any useful bandwidth. The vehicle has not changed; the gyro's mounting bracket has.

The practical rules that follow are unglamorous and effective: mount rate sensors on the stiffest structure, as close to the actuators as the layout allows; avoid mounting anything that closes a loop on an appendage; and if a sensor must go out on a boom, get the mode shape at that station from the structural model before the controller is designed, not after the first on-orbit oscillation.
:::

## Launch vehicles: bending and the control bandwidth

A launch vehicle is the hard case. It is long and slender, it is aerodynamically unstable so the controller *must* be fast, its actuator is a gimballed engine at the very bottom and its rate gyro is somewhere up the stack, and its inertia and its bending frequencies both change by large factors during the burn. Lesson 2 found the first stage's transverse inertia falling by a factor of 17 between liftoff and burnout, which raises the rigid-body control bandwidth by a factor of about four if the gains are left alone — and drives it toward the bending modes.

Take a first bending mode at $2.0\,\mathrm{Hz}$, $12.57\,\mathrm{rad/s}$, which is representative for a vehicle of that size. The frequency-separation rule caps the rigid-body crossover at $12.57/5 = 2.51\,\mathrm{rad/s}$, that is $0.40\,\mathrm{Hz}$. Everything above that has to be attenuated, which is what the notch filters in a launch vehicle autopilot do. The sign of the mode slope at the gyro station decides whether the mode can be **phase stabilised** — let through with the right sign so that it is damped by the loop — or must be **gain stabilised**, notched out and left to its own structural damping, which for a metal airframe is well under one per cent. Gain stabilisation is safer and costs bandwidth; phase stabilisation buys bandwidth and depends on knowing the mode shape and frequency accurately enough, which is why launch vehicle structural models are tested so hard.

## Propellant slosh

Liquid propellant in a partly full tank has a free surface, and that surface supports waves. The lowest lateral mode — the whole body of liquid swinging side to side — behaves like a pendulum, and it is modelled as one: a mass $m_s$ on a rod of length $L$ hinged inside the tank, with the rest of the propellant treated as rigidly attached. For a circular cylindrical tank of radius $R$ filled to depth $h$, under axial acceleration $a$, the first lateral mode has

$$
\omega_s^2 = \frac{\xi_1 a}{R}\tanh\!\left(\frac{\xi_1 h}{R}\right),
\qquad \xi_1 = 1.8412 ,
$$

where $\xi_1$ is the first stationary point of the Bessel function $J_1$. Two things about this formula shape everything.

It scales with the square root of the *acceleration*, not of gravity. Under boost the slosh is fast; in coast, with $a = 0$, there is no restoring force at all and the lateral frequency goes to zero. What remains in coast is propellant drifting under surface tension and residual accelerations, which is not an oscillator but is very much an energy sink — the lesson 8 mechanism, and the reason a spent stage with propellant in it nutates its way into a flat spin.

And it depends only weakly on fill level once the tank is more than about half full, because $\tanh$ saturates. For $h/R = 5$ the factor is $1.0000$; at $h/R = 1$ it is $0.9509$; only below about $h/R = 0.5$, where it is $0.726$, does the frequency drop appreciably.

::: example Slosh in a first-stage tank
Take the Falcon 9 first stage of lesson 2 as the geometry: $R = 1.83\,\mathrm{m}$, tanks much deeper than wide, so $\tanh \to 1$. Under $1.5\,g_0$ of axial acceleration, $a = 14.71\,\mathrm{m/s^2}$ and

$$
\omega_s = \sqrt{\frac{1.8412\times 14.71}{1.83}} = 3.847\,\mathrm{rad/s} = 0.612\,\mathrm{Hz},
$$

a period of $1.63\,\mathrm{s}$. Late in the burn at $3.0\,g_0$ it has risen to $0.866\,\mathrm{Hz}$; the slosh frequency sweeps upward through the flight, straight across whatever the control bandwidth is. The equivalent pendulum length is $L = a/\omega_s^2 = R/\xi_1 = 0.994\,\mathrm{m}$, and note that it does not depend on the acceleration at all — only the geometry sets it.

How hard does it push? Model $5000\,\mathrm{kg}$ of the propellant as the sloshing mass, swinging $5^\circ$ off the axis. The lateral force is $m_s a\sin 5^\circ = 5000\times 14.71\times 0.0872 = 6410\,\mathrm{N}$, and if the tank's slosh hinge is $10\,\mathrm{m}$ from the vehicle centre of mass that is a moment of $6.4\times 10^4\,\mathrm{N\,m}$. Lesson 5 put a gimballed first stage's control torque at $10^5$ to $10^6\,\mathrm{N\,m}$, so the slosh is between six and sixty per cent of the available authority — at a frequency the autopilot cannot ignore and in a direction it did not command.

On a coasting upper stage the same propellant is a different problem. With a settling thrust of only $0.01\,g_0$ the frequency drops to $0.050\,\mathrm{Hz}$, a $20\,\mathrm{s}$ period, slow enough to alias badly against a slow attitude loop; with no settling thrust at all the liquid simply migrates, dissipating energy at constant angular momentum until, for a prolate stage, lesson 8's flat spin arrives.
:::

The fixes are structural rather than algorithmic. **Baffles** — rings or vanes on the tank wall — increase the slosh damping ratio by an order of magnitude, from a fraction of a per cent for a smooth tank to a few per cent, which is usually enough to keep the mode out of the controller's way. **Diaphragms and bladders** separate the liquid from the ullage entirely and eliminate the free surface, at a cost in mass and a limit on tank size. **Propellant management devices** — vanes and sponges that hold liquid over the outlet by capillary action — solve the coast-phase settling problem, which is a feed problem before it is a dynamics problem.

::: warning Ground test frequencies are cantilevered frequencies
A modal survey with the spacecraft bolted to a shaker measures $\omega_n$, the clamped-hub frequency, which is where the plant's *zeros* are. The vehicle in orbit rings at $\omega_p = \omega_n/\sqrt{1-\sigma}$, which for $\sigma = 0.2$ is $12$ per cent higher, and more for a vehicle with large appendages. A notch filter centred on the test frequency sits on the zero, not the pole, and does nothing useful. Convert before you use the number, and carry the uncertainty in $\sigma$ through into the notch width.
:::

::: warning Slosh is not a disturbance to be estimated
It is tempting to treat slosh as an unknown external torque and lean on a disturbance observer. It is not external: the propellant is part of the vehicle, its motion is driven by the vehicle's own acceleration, and the coupling is two-way. Modelled as a disturbance it looks like a resonance that appears whenever the controller pushes, which is the signature of a feedback loop, not of a disturbance. Add the pendulum as a state — two more states per tank per axis — and the behaviour becomes ordinary.
:::

::: note Where the module's rigid-body results still hold
Nothing in lessons 1 through 7 is invalidated by flexibility; those results are the leading term, and the corrections are of order $\sigma$ and of order the slosh mass fraction. Inertia tensors, principal axes, Euler's equations and the intermediate axis theorem all remain the right first model, and every flexible analysis starts by computing them. What changes is that the rigid model is no longer the *whole* model: it sets the low-frequency behaviour, and the flexible modes decide how fast you are allowed to drive it.
:::

## Check yourself

::: check
A spacecraft has $I = 5000\,\mathrm{kg\,m^2}$ and a single appendage mode with cantilevered frequency $0.30\,\mathrm{Hz}$ and $\sigma = 0.36$. Find the free-free pole frequency, the high-frequency effective inertia, and the largest sensible control bandwidth.
:::

::: answer
$\omega_n = 2\pi\times 0.30 = 1.885\,\mathrm{rad/s}$. The pole is at $\omega_p = \omega_n/\sqrt{1-\sigma} = 1.885/\sqrt{0.64} = 1.885/0.80 = 2.356\,\mathrm{rad/s}$, that is $0.375\,\mathrm{Hz}$ — twenty-five per cent above the ground-test value, because $\sigma$ is large. The effective inertia above the mode is $I(1-\sigma) = 5000\times 0.64 = 3200\,\mathrm{kg\,m^2}$. Applying the one-fifth rule to the pole gives a crossover of $2.356/5 = 0.471\,\mathrm{rad/s}$, about $0.075\,\mathrm{Hz}$. A vehicle with a third of its inertia in a soft appendage is a slow vehicle.
:::

::: check
Explain why collocated torque and angle measurement guarantees interlaced poles and zeros, and why that makes a controller easy to design.
:::

::: answer
With the sensor at the actuator, the numerator of the transfer function is the appendage's own oscillator polynomial, so the zeros are at the cantilevered frequencies $\omega_n$; the poles are at the free-free frequencies $\omega_p = \omega_n/\sqrt{1-\sigma}$, which are always higher because $\sigma > 0$. Each mode therefore contributes a pole immediately followed, at a higher frequency, by a zero-like recovery, and the phase lost at the pole is returned at the zero. With many modes the pattern repeats and the loop phase stays bounded, so a controller that is passive — output rate fed back with positive gain — is stable no matter how many modes exist or how poorly their frequencies are known. That robustness is worth a great deal: flexible frequencies are among the least certain numbers in a spacecraft model.
:::

::: check
A sloshing tank has $R = 1.2\,\mathrm{m}$ and is filled to $h = 0.9\,\mathrm{m}$. Find the slosh frequency at $2.0\,g_0$ axial acceleration and the equivalent pendulum length.
:::

::: answer
$h/R = 0.75$, so $\xi_1 h/R = 1.8412\times 0.75 = 1.381$ and $\tanh(1.381) = 0.8814$. The acceleration is $a = 2\times 9.80665 = 19.613\,\mathrm{m/s^2}$, so

$$
\omega_s = \sqrt{\frac{1.8412\times 19.613}{1.2}\times 0.8814} = \sqrt{26.54} = 5.152\,\mathrm{rad/s},
$$

that is $0.820\,\mathrm{Hz}$, a period of $1.22\,\mathrm{s}$. The equivalent pendulum length is $L = a/\omega_s^2 = 19.613/26.54 = 0.739\,\mathrm{m}$. (With a full deep tank it would have been $R/\xi_1 = 0.652\,\mathrm{m}$; the shallow fill lengthens the pendulum and lowers the frequency.)
:::

::: check
In the hub-and-appendage model with no external torque, show that $I\dot{\vartheta} + \delta\dot{\eta}$ is conserved while the total energy decreases, and identify the final state.
:::

::: answer
The first equation with $M = 0$ reads $I\ddot{\vartheta} + \delta\ddot{\eta} = 0$, which is $\tfrac{d}{dt}(I\dot{\vartheta} + \delta\dot{\eta}) = 0$: that combination is the system's angular momentum $H$ and it is constant. For the energy, differentiate $E = \tfrac{1}{2}I\dot{\vartheta}^2 + \tfrac{1}{2}\dot{\eta}^2 + \delta\dot{\vartheta}\dot{\eta} + \tfrac{1}{2}\omega_n^2\eta^2$ and group terms: $\dot{E} = \dot{\vartheta}(I\ddot{\vartheta} + \delta\ddot{\eta}) + \dot{\eta}(\ddot{\eta} + \delta\ddot{\vartheta} + \omega_n^2\eta) = 0 - 2\zeta\omega_n\dot{\eta}^2 \le 0$. So $H$ is fixed and $E$ falls until $\dot{\eta} = 0$, which with the second equation forces $\eta = 0$. The final state is rigid rotation at $\dot{\vartheta} = H/I$ with energy $H^2/(2I)$ — the same conclusion lesson 8 reached with a lumped energy sink, here with the damper written explicitly.
:::

::: check
An upper stage coasts with half-full tanks and no settling thrust. Its axial moment is smaller than its transverse moment. What does the propellant do, and what is the consequence?
:::

::: answer
With no axial acceleration there is no restoring force, so there is no slosh *mode* — the liquid does not oscillate at a definable frequency. It drifts under surface tension and whatever residual accelerations the nutation itself provides, sliding along the tank walls, and that motion dissipates energy through viscosity and through impacts with structure. Angular momentum is untouched, since the propellant is internal. The stage is prolate, so it is a minor-axis spinner, and lesson 8's result applies directly: at fixed $H$ and falling $T$, the nutation angle grows with a time constant $I_3I_t/[k(I_t - I_3)]$ and the stage ends in a flat spin about a transverse axis. The remedies are the same as they were in 1958 — spin about the major axis instead, add a settling thrust so the propellant stays put, or add active nutation control.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $I\ddot{\vartheta} + \delta\ddot{\eta} = M$ | Hub equation; $I\dot{\vartheta} + \delta\dot{\eta}$ is the conserved angular momentum |
| $\ddot{\eta} + \delta\ddot{\vartheta} + 2\zeta\omega_n\dot{\eta} + \omega_n^2\eta = 0$ | Modal equation, driven by hub angular acceleration |
| $\sigma = \delta^2/I$ | Fraction of the inertia participating in the mode, $0 \le \sigma < 1$ |
| $\omega_n$, $\omega_p = \omega_n/\sqrt{1-\sigma}$ | Cantilevered (zero) and free-free (pole) frequencies; $\zeta_p = \zeta/\sqrt{1-\sigma}$ |
| Effective inertia | $I$ below the mode, $I(1-\sigma)$ above it |
| Collocated | Zeros below poles, interlaced, minimum phase, passively stabilisable |
| $y = \vartheta + \varphi\eta$ | Non-collocated measurement; numerator $(1-\varphi\delta)s^2 + 2\zeta\omega_n s + \omega_n^2$, RHP zero once $\varphi\delta > 1$ |
| Bandwidth rule | Crossover below about $\omega_p/5$; above that, gain stabilise (notch) or phase stabilise |
| $\omega_s^2 = (\xi_1 a/R)\tanh(\xi_1 h/R)$, $\xi_1 = 1.8412$ | First lateral slosh mode of a cylindrical tank; $L = a/\omega_s^2$ |
| Slosh in coast | $a \to 0$, frequency $\to 0$; propellant becomes an energy sink, and lesson 8 takes over |
| Fixes | Baffles (damping), diaphragms (no free surface), propellant management devices (settling) |

This closes the module. You can compute an inertia tensor and its principal axes, write and integrate Euler's equations, read a polhode, prove and reproduce the intermediate axis theorem, explain why a dissipating vehicle ends on its major axis, compute nutation and precession rates, size wheels and understand why control moment gyros are hard, and say what a flexible appendage or a tank of propellant does to all of it. The next module takes the frames these results were written in — body, inertial, orbital — and makes the transformations between them exact.
