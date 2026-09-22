---
id: l09-bending-modes-and-structural-filters
title: Bending modes, flexible-body dynamics and structural filters
minutes: 21
covers:
  - bending modes, flexible body dynamics and structural filter design
---

A launch vehicle is a thin-walled tube tens of metres long with a few millimetres of aluminium between its propellant and the air. Tap it and it rings. The lowest tone — the first bending mode — is somewhere between 1 and 10 Hz depending on the vehicle's size, and it is damped so lightly that a resonant push makes it swing a hundred times harder than a steady one. The rate gyros that feed the attitude controller are bolted to this tube, and they cannot tell the difference between the whole vehicle rotating and the piece of skin under them bending. So the controller sees the bending, commands the engine to correct it, the engine's side force excites the bending further, and a loop designed for a rigid body can go unstable at a frequency the designer never considered.

This lesson develops the flexible-body dynamics from beam theory, shows how a bending mode appears in the transfer function between gimbal and sensed attitude and on a Bode plot, and then designs the standard remedy: a notch filter that removes the mode's frequency from the controller's view. It quantifies what the notch costs in phase margin at the rigid-body crossover, how much margin to demand, and how to size the notch for a mode whose frequency is uncertain. That is the bending-notch exercise, and the third objective of the module.

## A launch vehicle is a free-free beam

Model the airframe as a slender beam of length $L$, bending stiffness $EI$ ($E$ the elastic modulus, $I$ the second moment of area of the cross-section) and mass per unit length $\mu$. Small lateral deflections $w(x, t)$ obey the **Euler–Bernoulli equation**,

$$
EI\,\frac{\partial^4 w}{\partial x^4} + \mu\,\frac{\partial^2 w}{\partial t^2} = 0 .
$$

Look for standing waves $w(x, t) = \phi(x)\,\eta(t)$ with $\eta = \cos\omega t$. The time derivative gives $-\omega^2$, so $\phi'''' = \beta^4\phi$ with $\beta^4 = \mu\omega^2/(EI)$. Solutions are combinations of $\cosh\beta x$, $\sinh\beta x$, $\cos\beta x$ and $\sin\beta x$, and the boundary conditions pick out the allowed $\beta$. A vehicle in flight is supported by nothing: both ends are **free**, with zero bending moment ($\phi'' = 0$) and zero shear ($\phi''' = 0$). Imposing these at $x = 0$ and $x = L$ gives the characteristic equation

$$
\cosh\beta L\,\cos\beta L = 1,
$$

whose roots are $\beta_1 L = 4.730$, $\beta_2 L = 7.853$, $\beta_3 L = 10.996$, and thereafter approximately $(2n+1)\pi/2$. The natural frequencies follow from $\omega_n = \beta_n^2\sqrt{EI/\mu}$:

$$
\omega_n = (\beta_n L)^2\sqrt{\frac{EI}{\mu L^4}}, \qquad (\beta_n L)^2 = 22.37,\ 61.67,\ 120.9,\ \ldots
$$

so the modes stand in the ratio $1 : 2.76 : 5.40$. Stiffness raises the frequency, length and mass lower it, and length enters as the fourth power under the root — doubling the length at fixed $EI$ and $\mu$ quarters the frequency.

The first **mode shape** is symmetric about the mid-point: the ends swing one way while the middle swings the other, with **nodes** (zero deflection) at $x = 0.224L$ and $0.776L$. Normalised to unit deflection at the ends, the mid-body deflection is $-0.608$. The **slope** $\phi'(x)$ — which is what a gyro senses — is zero at mid-body, where the deflection is largest, and largest at the ends, where $|\phi'| = 4.65/L$ per unit end deflection. The second mode is antisymmetric, with a node at mid-body and its largest slope there. Where you mount a gyro decides how much of each mode it sees.

::: example First bending mode of a mid-size launcher
A 45 m vehicle of 130 t has $\mu = 130\,000/45 = 2889\ \mathrm{kg/m}$. Its core is an aluminium-alloy shell of radius 1.5 m with an effective (stiffener-smeared) thickness of 10 mm, so $I = \pi r^3 t = \pi \times 1.5^3 \times 0.010 = 0.106\ \mathrm{m^4}$ and, with $E = 72\ \mathrm{GPa}$, $EI = 7.63 \times 10^9\ \mathrm{N\cdot m^2}$. Then

$$
\omega_1 = 22.37\sqrt{\frac{7.63 \times 10^9}{2889 \times 45^4}} = 22.37 \times 0.803 = 18.0\ \mathrm{rad/s} = 2.86\ \mathrm{Hz},
$$

with $f_2 = 2.76 \times 2.86 = 7.9\ \mathrm{Hz}$ and $f_3 = 15.5\ \mathrm{Hz}$. Scale up to a 70 m, 420 t vehicle with a 1.83 m radius and 12 mm effective skin and the first mode drops to about 1.2 Hz; shrink to a 20 m, 40 t vehicle with a 0.9 m radius and 6 mm skin and it rises to about 6 Hz. Real vehicles are not uniform beams — the fairing, interstage and engine section change $\mu$ and $EI$ along the length, and the propellant mass leaves during flight so the frequencies *rise* through the burn — but the uniform-beam number is within tens of percent of a finite-element model and tells you which decade to expect.
:::

::: key
Bending modes are elastic deformations of the airframe, typically with the first mode at 2–10 Hz for a large launch vehicle (near 1 Hz for the very largest) and damping ratios of about 0.005. Rate gyros sense the local slope of the deformed structure, so the mode feeds straight back into the controller and can go unstable.
:::

## Modal equations and the flexible transfer function

Expand the deflection in the mode shapes, $w(x, t) = \sum_n \phi_n(x)\,\eta_n(t)$. Because the modes are orthogonal, each **modal coordinate** $\eta_n$ obeys its own second-order equation, driven by the projection of the external forces onto its shape. The engine's lateral thrust component $T\delta$ acts at the gimbal station $x_T$, so

$$
\ddot\eta_n + 2\zeta_n\omega_n\dot\eta_n + \omega_n^2\eta_n = \frac{\phi_n(x_T)\,T\,\delta}{M_n}, \qquad M_n = \int_0^L \mu\,\phi_n^2\,dx,
$$

where $M_n$ is the **generalised mass** (for the end-normalised free-free first mode, $M_1 = m/4$) and $\zeta_n$ is the **structural damping ratio**, which for riveted and welded aluminium structure with propellant is small — 0.005 is the customary value, with 0.002 to 0.02 the range of what is measured.

Now the sensors. A rate gyro at station $x_g$ measures the local angular rate of the structure, which is the rigid-body rate plus the rate of change of the local slope:

$$
\dot\theta_{\text{meas}} = \dot\theta + \sum_n \phi_n'(x_g)\,\dot\eta_n .
$$

An accelerometer at $x_a$ measures the local lateral acceleration, $\ddot z + x_a\ddot\theta + \sum_n \phi_n(x_a)\ddot\eta_n$, and sees the *deflection* shape instead. Combine the modal equation with the gyro equation and the gimbal-to-sensed-attitude transfer function becomes the rigid plant plus one second-order term per mode:

$$
\frac{\theta_{\text{meas}}(s)}{\delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha} + \sum_n \frac{k_n\,\omega_n^2}{s^2 + 2\zeta_n\omega_n s + \omega_n^2},
\qquad
k_n = \frac{\phi_n'(x_g)\,\phi_n(x_T)\,T}{M_n\,\omega_n^2} .
$$

The **modal gain** $k_n$ is dimensionless — radians of sensed attitude per radian of gimbal at zero frequency — and it carries a sign: the product of the mode slope at the gyro and the mode deflection at the engine. Move the gyro from one side of a slope null to the other and the sign flips. For the 20 m vehicle with a 12 Hz first mode, $T = 0.6\ \mathrm{MN}$ and the gyro at $0.85L$ (slope $+0.22\ \mathrm{m^{-1}}$ per unit end deflection, engine at the end where $\phi = 1$), $k_1 = 0.22 \times 1 \times 6 \times 10^5/(10^4 \times 75.4^2) = 2.3 \times 10^{-3}$; at $0.15L$ it is $-2.3 \times 10^{-3}$; at mid-body it is zero. The teaching example below uses a smaller $5 \times 10^{-4}$; real vehicles span an order of magnitude either way.

## What a mode looks like on a Bode plot

At its natural frequency a second-order term with damping $\zeta$ has magnitude $1/(2\zeta)$ times its static gain — a factor of 100, or **40 dB**, for $\zeta = 0.005$ — and its phase drops through $-90^\circ$ at $\omega_n$ on its way from $0^\circ$ to $-180^\circ$, the whole transit happening within a band about $2\zeta\omega_n$ wide (0.1 Hz for a 12 Hz mode). On the loop-gain Bode plot of a rigid-body controller this appears as a needle: a sharp peak rising tens of decibels above the smooth roll-off, with a phase that swings through 180° in a few tenths of a hertz. Its sign shows in where the swing starts: with $k_n > 0$ the mode adds to the rigid response and the phase falls; with $k_n < 0$ it subtracts and the phase rises.

That is how you **identify a bending mode**: a narrow, tall resonance at a fixed frequency that is far above the actuator's bandwidth, whose frequency does not change with gain and rises slowly during the burn as propellant leaves, and which appears on a gyro but at a different amplitude — or with the opposite sign — on a gyro mounted elsewhere. Slosh looks similar but sits below 1 Hz; an actuator resonance sits at a fixed frequency and shows on the gimbal-position feedback rather than the gyro.

::: example A 12 Hz mode destabilises a 2 Hz loop
Take a small launcher with $\mu_\alpha = 1.0\ \mathrm{s^{-2}}$ and $\mu_\delta = 10\ \mathrm{s^{-2}}$, a PD controller $K_p = 5$, $K_d = 1.26\ \mathrm{s}$ and a 10 Hz second-order actuator. The rigid loop crosses 0 dB at 2.08 Hz with 56° of phase margin, a 16 dB upper gain margin (the actuator's phase crossover is at 9.6 Hz) and a 30 dB low-gain margin. At 12 Hz the rigid loop gain has rolled off to $-20\ \mathrm{dB}$.

Add a first bending mode at 12.0 Hz with $\zeta = 0.005$ and $k_1 = +5 \times 10^{-4}$. The mode's static gain is $-66\ \mathrm{dB}$, the resonance adds 40 dB, and the PD controller's derivative term multiplies by $K_d\omega = 1.26 \times 75.4 = 95$ (+40 dB) at that frequency: the net loop gain peaks at **+8.8 dB** at 12.0 Hz. The loop gain now crosses 0 dB twice more, at 11.86 Hz and 12.17 Hz, and the phase passes through $-180^\circ$ between them while the gain is above unity. The closed-loop poles confirm it: a pair at $+0.014 \pm 76.4j$, an oscillation at 12.2 Hz growing slowly but without limit. The rigid-body design was faultless; the vehicle would shake itself apart in flight.
:::

## The notch filter

The remedy is to remove the mode's frequency from what the controller acts on. A **notch filter** in series with the controller,

$$
N(s) = \frac{s^2 + 2\zeta_z\omega_q s + \omega_q^2}{s^2 + 2\zeta_p\omega_q s + \omega_q^2}, \qquad \zeta_z < \zeta_p,
$$

is unity at low and high frequency and has magnitude $\zeta_z/\zeta_p$ at its centre $\omega_q$: a **depth** of $20\log_{10}(\zeta_z/\zeta_p)$ decibels. The pole damping $\zeta_p$ sets the **width** — the attenuation is within a few dB of the maximum over roughly $\pm\zeta_p\omega_q$ — and the zero damping $\zeta_z$ sets the depth for a given width.

The notch is not free. Expand for $s \ll \omega_q$: $N(s) \approx 1 + 2(\zeta_z - \zeta_p)\,s/\omega_q$, a small negative real coefficient on $s$, which is a phase lag

$$
\angle N(j\omega) \approx -2(\zeta_p - \zeta_z)\,\frac{\omega}{\omega_q} \quad\text{(radians)} .
$$

A deep, wide notch (large $\zeta_p$) costs phase at the rigid-body crossover in proportion to $\zeta_p$ and to how close the crossover is to the notch. That proportionality is the whole design tension.

::: example Sizing the notch
Centre a notch at 12 Hz in the loop above. With $\zeta_z = 0.05$, $\zeta_p = 0.5$ the depth is $20\log_{10}(0.1) = -20\ \mathrm{dB}$. The mode's peak falls from $+8.8$ to $-11.2\ \mathrm{dB}$ — gain-stabilised with 11 dB of margin — and the closed loop is stable. At the 2 Hz crossover the notch's magnitude is $-0.12\ \mathrm{dB}$ and its phase is $-8.7^\circ$ (the approximation gives $-2 \times 0.45 \times 2/12 = -0.15\ \mathrm{rad} = -8.6^\circ$), so the phase margin drops from 56° to 47° and the crossover moves slightly to 2.04 Hz. The upper gain margin falls to 11.8 dB because the notch's lag moves the phase crossover down to 6.1 Hz. Requirement met: at least 8 dB of attenuation, less than 10° of phase margin spent.

Now suppose the flight vehicle's mode is at 13.2 Hz, 10 % above the ground-test value. The 20 dB notch delivers only 13.5 dB there, and the peak sits at $-5.1\ \mathrm{dB}$: still stable, but the margin has shrunk from 11 to 5 dB. Widen the notch to $\zeta_z = 0.03$, $\zeta_p = 0.6$ (26 dB deep): the nominal peak is $-17.3\ \mathrm{dB}$, the 13.2 Hz peak $-7.3\ \mathrm{dB}$, and the phase cost at 2 Hz rises to $11^\circ$ (phase margin 45°). Widen further to $\zeta_p = 1.0$ and the cost is $17^\circ$. The notch is sized on the *uncertain* mode, not the nominal one, and the phase budget at crossover is what limits how wide you can go.
:::

Why not a low-pass filter instead? A second-order low-pass at 4 Hz would give 19 dB of attenuation at 12 Hz — but $43^\circ$ of phase lag at 2 Hz, which destroys the rigid-body margin. At 6 Hz it gives 12 dB for $28^\circ$. The notch's advantage is precisely that it spends its phase only near its centre: for a mode well above crossover it is far cheaper per decibel. In practice a **bending filter** is a cascade — one notch per mode that needs it, plus a gentle low-pass to catch the higher modes that are already small — and since the mode frequencies rise as propellant depletes, either the notches are wide enough to cover the whole burn or their centres are scheduled with time.

```python
import numpy as np

def notch(w, wq, zz, zp):
    s = 1j * w
    return (s**2 + 2*zz*wq*s + wq**2) / (s**2 + 2*zp*wq*s + wq**2)

wq = 2*np.pi*12.0
N_at_mode  = notch(wq,           wq, 0.05, 0.5)
N_at_cross = notch(2*np.pi*2.0,  wq, 0.05, 0.5)
print(20*np.log10(abs(N_at_mode)))                 # -> -20.0 dB
print(np.degrees(np.angle(N_at_cross)))            # -> -8.7 deg
```

## Gain stabilisation, and its limit

What the notch achieves is **gain stabilisation**: the mode is pushed so far below 0 dB that its phase no longer matters, whatever the sign of $k_n$ and however the actuator's lag drifts. It works because the mode at 12 Hz is six times above the 2 Hz crossover — the loop is already rolling off there, and the notch's phase cost at crossover is small. Move the mode down to 3 Hz, one and a half times the crossover, and the same trick fails: a 20 dB notch at 3 Hz costs $43^\circ$ at 2 Hz, leaving 13° of phase margin, and a shallower one that keeps 30° of margin is only 15 dB deep and so narrow that a 10 % frequency error misses the mode entirely. A mode that close to crossover cannot be attenuated without wrecking the rigid-body loop, and the alternative — **phase stabilisation**, letting the mode exceed 0 dB but arranging its phase so the Nyquist plot still encircles correctly — is the subject of the control-structure interaction lesson.

::: warning
The mode frequency in flight is not the mode frequency in the ground vibration test. Propellant depletion raises it through the burn, the tank pressurisation and the thermal state shift it, and the model's uncertainty is typically $\pm 10$–20 %. A notch that exactly covers the nominal frequency and nothing else is a notch that misses in flight. Size the width on the uncertainty band, then pay the phase.
:::

::: warning
A notch attenuates what the controller *sees*, not what the structure *does*. The mode is still there, still excited by gusts and by the gimbal's off-resonance motion, and still lightly damped; the notch only stops the loop from pumping it. If the structure needs less vibration for its own sake, that is a damping or stiffness problem, not a filter problem.
:::

## Check yourself

::: check
A vehicle's first bending mode is measured at 4.0 Hz on the pad with full tanks. Using the uniform-beam scaling, estimate the frequency at first-stage burnout if 75 % of the vehicle's mass has been burned and the stiffness is unchanged.
:::

::: answer
$\omega_1 \propto \sqrt{EI/(\mu L^4)}$, so at fixed $EI$ and $L$ the frequency scales as $\mu^{-1/2}$. With the mass per unit length reduced to 25 % of its initial value, $f_1 = 4.0/\sqrt{0.25} = 8.0\ \mathrm{Hz}$. The real change is smaller because the propellant is not distributed like the structure and the empty tanks are relatively stiffer, but a frequency rising by tens of percent through the burn is universal — and the notch must cover the whole excursion or be scheduled.
:::

::: check
What is the resonant magnification of a mode with $\zeta = 0.005$, in linear terms and in decibels? How much does raising the damping to 0.02 (with added damping treatment) reduce the peak?
:::

::: answer
The peak of a second-order mode is $1/(2\zeta)$ times its static gain: $1/0.01 = 100$, or $40\ \mathrm{dB}$. At $\zeta = 0.02$ it is $1/0.04 = 25$, or $28\ \mathrm{dB}$ — a 12 dB reduction, equivalent to a fairly deep notch, obtained without any phase cost to the loop. Damping is expensive to add to a launch vehicle, which is why filters do most of the work, but where it can be added it is the better answer.
:::

::: check
A gyro is mounted exactly at mid-body of a uniform free-free vehicle. Which of the first two bending modes does it see, and what does that imply for the sign of the modal gains if the gyro is moved slightly aft?
:::

::: answer
The first mode is symmetric with zero slope at mid-body, so the gyro sees none of it ($k_1 = 0$); the second mode is antisymmetric with its maximum slope at mid-body, so the gyro sees the second mode at full strength. Moving the gyro slightly aft, the first-mode slope is small and of one sign; moving it slightly forward, the slope is small and of the *opposite* sign — the modal gain $k_1$ changes sign through the null. Mid-body mounting is therefore excellent for the first mode and worst for the second, and the sign of $k_1$ is sensitive to exactly where the gyro sits.
:::

::: check
A notch with $\zeta_z = 0.04$, $\zeta_p = 0.4$ is centred on a 9 Hz mode. What is its depth, and what phase lag does it introduce at a 1.5 Hz rigid-body crossover?
:::

::: answer
Depth $= 20\log_{10}(0.04/0.4) = -20\ \mathrm{dB}$. The low-frequency phase lag is $\approx -2(\zeta_p - \zeta_z)\,\omega/\omega_q = -2 \times 0.36 \times 1.5/9 = -0.12\ \mathrm{rad} = -6.9^\circ$. A 1.5 Hz crossover against a 9 Hz mode is a six-to-one separation, and the phase cost is comfortably under 10°.
:::

::: check
In the worked example the mode with $k_1 = +5 \times 10^{-4}$ was unstable. Would the loop with $k_1 = -5 \times 10^{-4}$ (gyro on the other side of the slope null) have been unstable without the notch, and why should you not rely on that?
:::

::: answer
With the sign reversed the mode's peak is still $+8.8\ \mathrm{dB}$ but its phase transit is shifted by 180°, so the phase at the peak is near $+77^\circ$ instead of $-111^\circ$, the Nyquist loop of the resonance swings away from $-1$ rather than around it, and the closed loop is in fact stable — the mode is *phase-stable* by accident of sensor placement. You should not rely on it because that phase depends on the actuator's lag at 12 Hz, on filters and delays in the signal path, on the gyro's exact station relative to a slope null that moves as propellant drains, and on the mode-shape prediction; any of these can rotate the resonance loop back onto $-1$. Gain stabilisation removes the dependence on all of them, which is why it is the preferred answer whenever the mode is far enough above crossover to afford it.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $EI\,w'''' + \mu\ddot w = 0$ | Euler–Bernoulli beam; free-free ends $\phi'' = \phi''' = 0$ |
| $\cosh\beta L\cos\beta L = 1$ | free-free characteristic equation; $\beta_n L = 4.730, 7.853, 10.996$ |
| $\omega_n = (\beta_n L)^2\sqrt{EI/(\mu L^4)}$ | $(\beta_n L)^2 = 22.37, 61.67, 120.9$; ratios $1 : 2.76 : 5.40$ |
| First mode shape | nodes at $0.224L$, $0.776L$; slope zero at mid-body, largest at the ends |
| $\ddot\eta_n + 2\zeta_n\omega_n\dot\eta_n + \omega_n^2\eta_n = \phi_n(x_T)T\delta/M_n$ | modal equation; $\zeta_n \approx 0.005$ |
| $\dot\theta_{\text{meas}} = \dot\theta + \sum\phi_n'(x_g)\dot\eta_n$ | gyro senses the local slope rate |
| $k_n = \phi_n'(x_g)\phi_n(x_T)T/(M_n\omega_n^2)$ | modal gain; sign set by gyro location |
| Resonant peak | $1/(2\zeta) = 100 = 40\ \mathrm{dB}$ for $\zeta = 0.005$ |
| Notch $N(s)$ | depth $20\log_{10}(\zeta_z/\zeta_p)$; lag $\approx -2(\zeta_p - \zeta_z)\omega/\omega_q$ at crossover |
| Example | 12 Hz mode, 2 Hz loop: +8.8 dB peak, unstable; 20 dB notch → −11 dB, 9° phase cost |

The next lesson moves to the other lightly damped thing on a launch vehicle: the propellant itself, whose sloshing sits not six times above the crossover but right on top of it.
