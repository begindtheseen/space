---
id: l01-what-an-imu-measures-accelerometer-and-gyro-physics
title: What an IMU measures, and how the sensors work
minutes: 26
covers:
  - "Accelerometer and gyroscope physics: MEMS, fiber optic, ring laser, hemispherical resonator"
---

An inertial measurement unit is six sensors in a box: three accelerometers and three gyroscopes on orthogonal axes, bolted to the vehicle. Everything an inertial navigator produces — attitude, velocity, position — is computed from those six output streams and nothing else. No signal comes in from outside. That self-containment is why an INS works in a tunnel, under jamming, inside a fairing and on the far side of the Moon, and it is also why every error the sensors make is kept forever, integrated and compounded, until something external corrects it.

The whole module rests on knowing precisely what the six numbers mean. Neither is what its name suggests. An accelerometer does not measure acceleration and a gyroscope does not measure how the vehicle is turning relative to the ground. The accelerometer measures **specific force**, which is acceleration with gravitation missing, and the gyro measures angular rate relative to **inertial space**, which includes the turning of the Earth under a vehicle that is standing still. Both distinctions are small in words and enormous in consequences: the first is the reason a gravity model sits inside every navigator and the second is the reason a stationary INS can find north.

This lesson establishes those two definitions from Newton's law, then looks inside the four gyro technologies the module names — MEMS vibratory, fibre-optic, ring laser and hemispherical resonator — with the accelerometer technologies alongside. The aim is to know which physical quantity each one senses, what limits it, and what its datasheet numbers mean when they reach the navigation equations.

## Specific force: what an accelerometer measures

Every accelerometer is a proof mass held to its case by something that acts like a spring, with a pick-off that reads how far the mass has been pushed. Write Newton's second law for the proof mass $m$ in an inertial frame. Two forces act on it: the spring force $\mathbf{F}_s$ from the case, and gravitation $m\,\mathbf{g}_{grav}$ from the Earth and everything else. If the case accelerates at $\mathbf{a}$ and the mass rides with it,

$$
m\,\mathbf{a} = \mathbf{F}_s + m\,\mathbf{g}_{grav}
\qquad\Longrightarrow\qquad
\mathbf{f} \equiv \frac{\mathbf{F}_s}{m} = \mathbf{a} - \mathbf{g}_{grav}.
$$

The pick-off reads the spring deflection, which is proportional to $\mathbf{F}_s$, so the instrument's output is $\mathbf{f}$: the **specific force**, the non-gravitational force per unit mass, in $\mathrm{m/s^2}$. Gravitation does not appear in it, and cannot. Gravitation pulls the proof mass and the case identically, so it produces no relative motion between them and nothing for the pick-off to see. This is the equivalence principle in engineering form: no instrument sealed inside a box can tell a gravitational field from an acceleration of the box.

Two situations fix the sign in your head. On a bench at rest, $\mathbf{a} = 0$, so $\mathbf{f} = -\mathbf{g}_{grav}$: the accelerometer reads $9.81\,\mathrm{m/s^2}$ pointing **up**. The spring is holding the mass against gravity, and that is what it reports. In free fall, $\mathbf{a} = \mathbf{g}_{grav}$ and $\mathbf{f} = 0$: the accelerometer reads nothing, though the vehicle is accelerating at $9.81\,\mathrm{m/s^2}$. A spacecraft in orbit is the permanent version of this. At the altitude of the International Space Station, $420\,\mathrm{km}$, gravitational acceleration is $\mu/r^2 = 3.986 \times 10^{14}/(6.798 \times 10^{6})^2 = 8.62\,\mathrm{m/s^2}$, eighty-eight per cent of its sea-level value; the station's accelerometers read a few micro-$g$ of drag and vibration, and nothing of the $8.62\,\mathrm{m/s^2}$ that keeps it in orbit.

So the navigator must supply gravity itself. Rearranging the definition,

$$
\mathbf{a} = \mathbf{f} + \mathbf{g}_{grav},
$$

and it is this sum, not $\mathbf{f}$ alone, that is integrated into velocity. The gravitation comes from a model evaluated at the computed position, and whatever the model gets wrong is added to the accelerometer's reading with no way of telling the two apart: a gravity-model error is indistinguishable from an accelerometer bias. In a frame rotating with the Earth the centrifugal term of the rotating-frames module folds into gravitation to make **gravity** $\mathbf{g}$, the quantity a plumb line hangs along, and the equation becomes the velocity mechanisation a later lesson assembles term by term.

::: key What an accelerometer measures
Specific force, not acceleration: $\mathbf{f} = \mathbf{a} - \mathbf{g}_{grav}$. In free fall it reads zero; at rest on a bench it reads $+g$ upward. Gravity must be added analytically, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, from a model evaluated at the computed position, which is why a gravity-model error is indistinguishable from an accelerometer bias.
:::

::: example A level banked turn
An aircraft holds a level turn at $60^\circ$ of bank. The lift must carry the weight, so the lift-to-weight ratio, the load factor, is $1/\cos 60^\circ = 2.00$: the accelerometers read a specific force of $2 \times 9.80665 = 19.6\,\mathrm{m/s^2}$ along the body vertical, straight through the pilot's seat. The acceleration is something else entirely: horizontal, toward the centre of the turn, of magnitude $g\tan 60^\circ = 9.80665 \times 1.732 = 17.0\,\mathrm{m/s^2}$. Specific force and acceleration differ here by a vector of length $g$ pointing down, and they do not even share a direction. The navigator recovers the acceleration by rotating $\mathbf{f}$ into the navigation frame and adding the model gravity $(0, 0, 9.81)\,\mathrm{m/s^2}$ in north–east–down axes.

```python
import numpy as np

g0 = 9.80665                       # m/s^2
g_grav_ned = np.array([0.0, 0.0, g0])   # gravitation, NED (down positive), sphere approx.

def specific_force(a_ned):
    """What a perfect accelerometer triad reads, resolved in NED: f = a - g."""
    return a_ned - g_grav_ned

print(specific_force(np.zeros(3)))                # at rest on a bench
print(specific_force(g_grav_ned))                 # in free fall
a_turn = np.array([g0 * np.tan(np.radians(60.0)), 0.0, 0.0])   # level 60 deg banked turn
f = specific_force(a_turn)
print(f, np.linalg.norm(f) / g0)                  # 2 g, but not along the acceleration
# [ 0.       0.      -9.80665]
# [0. 0. 0.]
# [16.98561605  0.         -9.80665   ] 1.9999999999999993
```
:::

## Inertial angular rate: what a gyroscope measures

A gyroscope measures the angular velocity of its case relative to inertial space, resolved along its own axes. In the notation of the rotating-frames module that is $\boldsymbol{\omega}^{b}_{B/I}$; this module adopts the compact navigation form $\boldsymbol{\omega}_{ib}^{b}$, read as "the rate of frame $b$ with respect to frame $i$, expressed in $b$ axes", because it is what the mechanisation literature and the module's exercises use. The two notations name the same vector.

The word *inertial* matters because the Earth turns. A gyro triad motionless on a bench is carried round the Earth's axis once per sidereal day, and it reports that. The Earth's rate is

$$
\omega_{ie} = 7.292115 \times 10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h},
$$

resolved in local north–east–down axes at geodetic latitude $\varphi$ as $\boldsymbol{\omega}_{ie}^{n} = \omega_{ie}(\cos\varphi,\ 0,\ -\sin\varphi)$, as the rotating-frames module derived it. At $45^\circ$ the horizontal component is $15.041\cos 45^\circ = 10.6^\circ/\mathrm{h}$, pointing true north. A gyro good enough to measure that component can find north with no external reference — gyrocompassing, a later lesson of this module — and a gyro whose bias is comparable with it cannot. Know the number in both units: $7.292115 \times 10^{-5}\,\mathrm{rad/s}$ for the code, $15.04^\circ/\mathrm{h}$ for judging a datasheet at a glance.

::: key Earth rate
$\omega_{ie} = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$, about $15.041^\circ/\mathrm{h}$. A gyro whose bias instability is well below this can gyrocompass; a gyro whose bias is a large fraction of it cannot find north.
:::

A **strapdown** IMU keeps its sensors fixed to the vehicle and does the levelling in software: the direction cosine matrix $\mathbf{C}_b^n$ from body to navigation axes is computed by integrating the gyros, and this computed matrix, not a mechanical gimbal, rotates the specific force into the frame where gravity is added. Every attitude error therefore misprojects gravity into the horizontal channels, and that chain — gyro to attitude to gravity leak to velocity to position — is the spine of the module.

## Accelerometer technologies

Three mechanisms cover the market. The **pendulous force-rebalance** accelerometer hinges a proof mass on a thin quartz flexure and a servo drives a coil to hold the mass exactly at null; the restoring current is proportional to specific force, the pick-off never leaves its most linear point, and the result is the navigation-grade instrument, with bias of $25$ to $100\,\mathrm{\mu g}$ and scale factor stable to tens of parts per million. The **MEMS capacitive** accelerometer is the same idea in silicon: a micromachined mass on folded springs, its displacement read by comb fingers as a change in capacitance, open-loop in consumer parts and closed-loop in the better tactical units, with bias from a few milli-$g$ down to around $100\,\mathrm{\mu g}$. The **vibrating-beam** accelerometer loads a quartz beam with the proof mass and reads the shift in its resonant frequency, a digital output with no pick-off nonlinearity.

One micro-$g$ is $9.80665 \times 10^{-6}\,\mathrm{m/s^2}$; one milli-$g$ is $9.80665 \times 10^{-3}\,\mathrm{m/s^2}$. A bias of $1\,\mathrm{mg}$ on a level accelerometer is indistinguishable from a tilt of $1\,\mathrm{mrad}$, about $3.4$ arcminutes, because a tilt $\delta\theta$ leaks $g\sin\delta\theta \approx g\,\delta\theta$ of gravity into the horizontal reading. That equivalence is how accelerometer bias and attitude error trade places throughout the module.

## MEMS vibratory gyroscopes

A MEMS gyro has no spinning wheel. It has a proof mass driven into steady oscillation along one axis, the **drive** axis, at a resonant frequency of a few to a few tens of kilohertz. When the case rotates at $\Omega$ about the axis perpendicular to the plane of drive and sense, the proof mass moving at velocity $\mathbf{v}_d$ in the rotating case frame experiences the Coriolis acceleration of the rotating-frames module,

$$
\mathbf{a}_{cor} = -2\,\boldsymbol{\Omega} \times \mathbf{v}_d,
$$

directed along the third axis, the **sense** axis, and oscillating at the drive frequency with an amplitude proportional to $\Omega$. Demodulating the sense-axis motion against the drive gives the rate.

::: example The size of the Coriolis signal in a MEMS gyro
Take a drive amplitude of $10\,\mathrm{\mu m}$ at $10\,\mathrm{kHz}$. The peak drive velocity is $v_d = 2\pi \times 10^{4} \times 10^{-5} = 0.628\,\mathrm{m/s}$. At a rate of $1^\circ/\mathrm{s} = 0.01745\,\mathrm{rad/s}$ the Coriolis acceleration is $2 \times 0.01745 \times 0.628 = 0.0219\,\mathrm{m/s^2}$, about $2.2\,\mathrm{mg}$. If the sense mode is quasi-static at the drive frequency, that acceleration displaces the mass by $a/\omega^2 = 0.0219/(2\pi \times 10^{4})^2 = 5.6 \times 10^{-12}\,\mathrm{m}$, and a mode-matched design with a quality factor of $1000$ amplifies it to about $5.6\,\mathrm{nm}$.

Now ask the gyro to see the Earth turn. At $\omega_{ie} = 7.29 \times 10^{-5}\,\mathrm{rad/s}$ the Coriolis acceleration is $9.2 \times 10^{-5}\,\mathrm{m/s^2}$ and the quasi-static displacement is $2.3 \times 10^{-14}\,\mathrm{m}$: twenty-three femtometres, some thirty proton radii. A mechanical imperfection that couples one part per million of the $10\,\mathrm{\mu m}$ drive motion into the sense axis produces $10\,\mathrm{pm}$ of spurious motion, about $430$ times the Earth-rate signal. That coupling, **quadrature error**, is $90^\circ$ out of phase with the Coriolis signal and largely rejected by the demodulator, but any phase error in the electronics lets a fraction through as bias. This is why MEMS gyros are bias-limited, why their bias moves with temperature, and why a consumer-grade unit cannot gyrocompass.
:::

The scale factor of a vibratory gyro is proportional to the drive velocity, so the drive amplitude is held constant by an automatic gain loop and the electronics are calibrated over temperature. Tactical MEMS gyros reach bias instabilities below $1^\circ/\mathrm{h}$ and angle random walk near $0.1^\circ/\sqrt{\mathrm{h}}$; consumer parts sit one to two orders of magnitude worse. The art of low-cost navigation is arranging for something else to correct their bias faster than it wanders.

## Optical gyroscopes: the Sagnac effect

Light offers a rate sensor with no moving proof mass at all. Send two beams round the same closed loop in opposite directions and rotate the loop. In the inertial frame the beam travelling with the rotation must go a little farther to reach the beam splitter, which has moved on; the beam travelling against it goes a little less far. For a circular loop of radius $R$ and area $A = \pi R^2$ turning at $\Omega$,

$$
t_{\pm} = \frac{2\pi R}{c \mp R\Omega}, \qquad
\Delta t = t_+ - t_- = \frac{4\pi R^2\,\Omega}{c^2 - R^2\Omega^2} \approx \frac{4A\,\Omega}{c^2}.
$$

The result depends only on the enclosed area, and it holds for any loop shape. The two beams recombine with a phase difference of

$$
\Delta\phi = \frac{2\pi c\,\Delta t}{\lambda} = \frac{8\pi A}{\lambda c}\,\Omega
$$

per turn of the loop, where $\lambda$ is the wavelength. This is the **Sagnac effect**, and it is tiny: for a single $10\,\mathrm{cm}$ loop at $1550\,\mathrm{nm}$, $8\pi A/(\lambda c)$ is about $4.2 \times 10^{-4}$ radians of phase per radian per second. The two optical gyros are two ways of making it large enough to read.

The **fibre-optic gyro** (FOG) winds $N$ turns of optical fibre onto a coil, multiplying the phase by $N$. With total fibre length $L = N\pi D$ and coil diameter $D$,

$$
\Delta\phi = \frac{8\pi N A}{\lambda c}\,\Omega = \frac{2\pi L D}{\lambda c}\,\Omega .
$$

The interferometer's intensity varies as $1 + \cos\Delta\phi$, which is flat at $\Delta\phi = 0$, so a phase modulator biases the operating point to $\pm\pi/2$ where the slope is steepest; a closed-loop FOG then feeds back a phase ramp that nulls the Sagnac phase and reads rate from the ramp. There is no lasing in the loop, and the source is deliberately broadband so that backscatter within the fibre cannot interfere coherently.

::: example A navigation-grade fibre coil
A FOG with $L = 1000\,\mathrm{m}$ of fibre on a coil of diameter $D = 0.10\,\mathrm{m}$ at $\lambda = 1550\,\mathrm{nm}$ has $N = L/(\pi D) = 3183$ turns and a Sagnac scale factor of

$$
\frac{2\pi L D}{\lambda c} = \frac{2\pi \times 1000 \times 0.10}{1550 \times 10^{-9} \times 2.998 \times 10^{8}} = 1.35\ \mathrm{rad\ per\ rad/s}.
$$

Earth rate produces $1.35 \times 7.29 \times 10^{-5} = 9.86 \times 10^{-5}\,\mathrm{rad}$ of optical phase, about $99\,\mathrm{\mu rad}$ or $20$ arcseconds of fringe shift. A navigation-grade bias of $0.01^\circ/\mathrm{h} = 4.85 \times 10^{-8}\,\mathrm{rad/s}$ corresponds to $66\,\mathrm{nrad}$ of phase, one part in $10^{8}$ of a fringe, which the detector electronics must resolve while the light takes $L/c = 3.3\,\mathrm{\mu s}$ to transit the coil. Every one of those numbers scales linearly with $L D$: more fibre or a bigger coil buys sensitivity, at the cost of volume and of the thermal gradients across a large coil that are the FOG's chief bias mechanism.
:::

The **ring laser gyro** (RLG) makes the loop itself a laser cavity, a triangular or square block of glass-ceramic with mirrors at the corners and a helium–neon discharge in the path. A cavity lases only at frequencies for which the round-trip path is an integer number of wavelengths, and the two counter-propagating beams see paths differing by $\Delta L = c\,\Delta t = 4A\Omega/c$. Their frequencies therefore differ by

$$
\Delta f = \frac{c}{\lambda}\,\frac{\Delta L}{P} = \frac{4A}{\lambda P}\,\Omega,
$$

with $P$ the perimeter. Mixing the beams on a detector gives a beat at $\Delta f$, and each beat cycle is one fixed angular increment: the RLG is natively a digital integrating gyro whose scale factor is set by geometry and wavelength.

::: example A ring laser at Earth rate
A square cavity of $10\,\mathrm{cm}$ side has $A = 0.01\,\mathrm{m^2}$ and $P = 0.4\,\mathrm{m}$; at the helium–neon wavelength $632.8\,\mathrm{nm}$ its scale factor is $4A/(\lambda P) = 4 \times 0.01/(632.8 \times 10^{-9} \times 0.4) = 1.58 \times 10^{5}\,\mathrm{Hz}$ per $\mathrm{rad/s}$. Earth rate gives a beat of $1.58 \times 10^{5} \times 7.29 \times 10^{-5} = 11.5\,\mathrm{Hz}$; one beat cycle is $1/(1.58 \times 10^{5}) = 6.33\,\mathrm{\mu rad}$, about $1.3$ arcseconds, so a $90^\circ$ turn delivers $248\,000$ counts. At low rates mirror backscatter pulls the two beams into a single frequency, a **lock-in** band of typically a few hundred degrees per hour in which the output is zero. The cure is to dither the block through a small angle at a few hundred hertz, keeping the instantaneous rate outside the band, and to strip the dither's known contribution, which integrates to zero, from the counts.
:::

The RLG's bias, of order $0.001$ to $0.01^\circ/\mathrm{h}$, and its scale-factor stability of a few parts per million have made it the standard aircraft-INS gyro for forty years. Its costs are the gas discharge, the precision mirrors, the dither mechanism and a life limited by the discharge.

## The hemispherical resonator gyro

Strike a wine glass and it rings in a flexural mode with two nodal diameters, its rim alternately elongating along one axis and along the axis at $45^\circ$. Bryan observed in 1890 that when the glass is rotated about its stem the pattern of nodes stays fixed neither to the glass nor to inertial space: it lags behind the glass by a fixed fraction of the rotation angle, about $0.3$ for a thin hemispherical shell, set entirely by geometry. The **hemispherical resonator gyro** (HRG) is a fused-quartz hemisphere a few centimetres across, electrostatically driven into that mode in vacuum, with capacitive electrodes around the rim reading the pattern angle.

In **whole-angle** mode the pattern is left free and its angle relative to the case is read directly: the output is integrated rotation, with a scale factor that is a ratio of shell dimensions and no rate limit. In **force-rebalance** mode the electrodes hold the pattern fixed to the case and the required force is proportional to rate, trading range for lower noise. With no light source, no gas, no bearings and a quality factor in the millions, the HRG runs for decades without wear, which is why it flies on a large fraction of today's spacecraft and on several launch vehicles. Its bias and random walk sit in the navigation-grade class.

## Grades, and what the grade buys

Datasheets sort themselves into grades by gyro bias, and the grades map onto the navigation performance the later lessons compute. The figures below are typical ranges, not specifications.

| Grade | Gyro bias instability | Angle random walk | Accelerometer bias | Typical technology |
| --- | --- | --- | --- | --- |
| Consumer / automotive | $10$ to $1000^\circ/\mathrm{h}$ | $0.3$ to $1^\circ/\sqrt{\mathrm{h}}$ | $1$ to $10\,\mathrm{mg}$ | MEMS, open loop |
| Tactical | $0.1$ to $10^\circ/\mathrm{h}$ | $0.02$ to $0.3^\circ/\sqrt{\mathrm{h}}$ | $0.1$ to $1\,\mathrm{mg}$ | Closed-loop MEMS, small FOG |
| Navigation (aviation) | about $0.01^\circ/\mathrm{h}$ | $0.002$ to $0.005^\circ/\sqrt{\mathrm{h}}$ | $25$ to $100\,\mathrm{\mu g}$ | RLG, FOG, HRG |
| Strategic / marine | below $0.001^\circ/\mathrm{h}$ | below $0.001^\circ/\sqrt{\mathrm{h}}$ | below $10\,\mathrm{\mu g}$ | Large RLG, HRG, electrostatic |

Read the gyro column against Earth rate: a tactical gyro's bias is a tenth to a hundredth of $15^\circ/\mathrm{h}$, enough to see the Earth turn but not to find north to better than a degree; a navigation-grade gyro sees it to one part in a thousand. Read the accelerometer column as tilts: $1\,\mathrm{mg}$ is $1\,\mathrm{mrad}$ of level error, $50\,\mathrm{\mu g}$ is $50\,\mathrm{\mu rad}$, about $10$ arcseconds. These two readings are the first things a navigation engineer does with any datasheet, and both can be done in your head.

::: warning
Do not read a gyro's rate range or an accelerometer's $g$ range as a measure of quality; they describe the dynamics the sensor survives, not the accuracy it delivers. And do not read "in-run bias instability" as the bias you will see at power-on. The turn-on bias, different every start and often ten to a hundred times larger than the instability figure, is what the alignment and the filter must remove first; the instability describes only how much the bias wanders afterwards.
:::

## Check yourself

::: check
A rocket lifts off vertically with a thrust-to-weight ratio of $1.3$. What does an accelerometer aligned with the body axis read, and what is the vehicle's acceleration?
:::

::: answer
The net upward acceleration is $(1.3 - 1)g = 0.3 \times 9.80665 = 2.94\,\mathrm{m/s^2}$. The accelerometer reads specific force, $f = a - g_{grav}$ with $g_{grav}$ pointing down, so along the up direction $f = 2.94 + 9.81 = 12.7\,\mathrm{m/s^2}$, exactly $1.3\,g$. An accelerometer on a rocket reads thrust-to-weight in $g$, not acceleration; the $1\,g$ the engines spend fighting gravity is invisible to it and must be restored by the gravity model before the reading is integrated.
:::

::: check
A gyro triad sits level and aligned with north at Cape Canaveral, geodetic latitude $28.5^\circ$. What does it read on each axis, in degrees per hour, and why is the reading not zero?
:::

::: answer
The triad is fixed to the Earth, which rotates relative to inertial space, and a gyro measures inertial rate. In NED axes $\boldsymbol{\omega}_{ie}^{n} = \omega_{ie}(\cos\varphi, 0, -\sin\varphi)$ with $\omega_{ie} = 15.041^\circ/\mathrm{h}$: north $15.041\cos 28.5^\circ = 13.2^\circ/\mathrm{h}$, east $0$, down $-15.041\sin 28.5^\circ = -7.18^\circ/\mathrm{h}$ (the down component is negative because the spin axis points up out of the ground in the northern hemisphere). The magnitude is $15.04^\circ/\mathrm{h}$ regardless of latitude; only its split between horizontal and vertical changes.
:::

::: check
A fibre-optic gyro designer has a fixed $500\,\mathrm{m}$ of fibre. Compare the Sagnac scale factor of a coil of diameter $5\,\mathrm{cm}$ with one of $10\,\mathrm{cm}$, and explain the result in terms of turns and area.
:::

::: answer
The scale factor is $2\pi L D/(\lambda c)$, linear in $D$ at fixed $L$, so the $10\,\mathrm{cm}$ coil has twice the scale factor of the $5\,\mathrm{cm}$ coil. In terms of the per-turn formula $8\pi N A/(\lambda c)$: doubling $D$ quadruples the area per turn but halves the number of turns the fibre makes, $N = L/(\pi D)$, and the product $N A$ doubles. Sensitivity therefore favours large coils for a given fibre length, which is why high-performance FOGs are physically large and why their thermal-gradient bias, which also grows with coil size, is the design tension.
:::

::: check
The drive amplitude of a MEMS gyro drifts by one per cent because of a temperature change and the gain loop fails to correct it. What happens to the output at a true rate of $1^\circ/\mathrm{s}$, and at Earth rate?
:::

::: answer
The Coriolis acceleration is $2\Omega v_d$, so a one per cent change in drive velocity is a one per cent change in scale factor. At $1^\circ/\mathrm{s}$ the output error is $0.01^\circ/\mathrm{s} = 36^\circ/\mathrm{h}$, a rate error far larger than the sensor's bias instability. At Earth rate the same one per cent is $0.15^\circ/\mathrm{h}$. Scale-factor error is proportional to the rate being measured: negligible for a sensor sitting still, dominant during a fast manoeuvre. That is why the drive amplitude is servo-controlled and the scale factor is calibrated over temperature, and why the next lesson treats scale factor as a separate error term from bias.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{f} = \mathbf{a} - \mathbf{g}_{grav}$ | Specific force: what an accelerometer measures; $0$ in free fall, $+g$ up at rest |
| $\mathbf{a} = \mathbf{f} + \mathbf{g}_{grav}$ | Gravity is added from a model; a model error looks exactly like an accelerometer bias |
| $\boldsymbol{\omega}_{ib}^{b}$ | Gyro output: rate of the body relative to inertial space, in body axes |
| $\omega_{ie} = 7.292115 \times 10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}$ | Earth rate; $\boldsymbol{\omega}_{ie}^{n} = \omega_{ie}(\cos\varphi, 0, -\sin\varphi)$ |
| $1\,\mathrm{\mu g} = 9.80665 \times 10^{-6}\,\mathrm{m/s^2}$; $1\,\mathrm{mg} \leftrightarrow 1\,\mathrm{mrad}$ tilt | Accelerometer units and the bias–tilt equivalence |
| $\mathbf{a}_{cor} = -2\boldsymbol{\Omega} \times \mathbf{v}_d$ | MEMS vibratory gyro: Coriolis acceleration on a driven proof mass |
| $\Delta t = 4A\Omega/c^2$, $\Delta\phi = 8\pi A\Omega/(\lambda c)$ per turn | Sagnac effect; FOG phase $2\pi L D\,\Omega/(\lambda c)$ |
| $\Delta f = 4A\Omega/(\lambda P)$ | Ring laser beat frequency; one beat is one fixed angle increment |
| Bryan factor $\approx 0.3$ | HRG: the standing-wave pattern lags case rotation by a fixed geometric fraction |
| Consumer, tactical, navigation, strategic | Gyro bias roughly $100$, $1$, $0.01$, $0.001^\circ/\mathrm{h}$ |

The next lesson writes down everything a real accelerometer and gyro add to these ideal readings — turn-on and in-run bias, scale factor, non-orthogonality, misalignment, acceleration sensitivity and quantisation — as the measurement model that every later lesson corrects for.
