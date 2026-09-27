---
id: l01-what-an-imu-measures-accelerometer-and-gyro-physics
title: What an IMU measures, and how the sensors work
minutes: 26
covers:
  - "Accelerometer and gyroscope physics: MEMS, fiber optic, ring laser, hemispherical resonator"
---

Ride an elevator with your eyes shut. When it starts up, you feel heavier. On a drop-tower ride, you feel no weight at all while you fall. Your body is a motion sensor that works without looking outside.

An **inertial measurement unit**, or **IMU**, is that idea turned into hardware: six sensors in a box, bolted to the vehicle. Three **accelerometers** sense push, and three **gyroscopes** sense turning, one of each along three axes at right angles. Everything an inertial navigator works out — which way the vehicle points, how fast it moves, where it is — comes from those six streams of numbers and nothing else. No signal comes in from outside.

That is the great strength of an **inertial navigation system** (INS): it works in a tunnel, under jamming, and on the far side of the Moon. It is also the great weakness. Every sensor error is kept and compounded until something from outside corrects it.

So this module rests on knowing exactly what the six numbers mean, and neither sensor measures what its name suggests. This lesson builds both facts from Newton's law, then opens up the four gyro technologies — MEMS, fiber optic, ring laser and hemispherical resonator — with the accelerometers alongside.

## Specific force: what an accelerometer measures

Every accelerometer is a small weight on a spring inside a case. The weight is called the **[[proof mass|proof-mass]]**. A **pick-off** — a tiny ruler — reads how far the spring has stretched.

Write Newton's second law for the proof mass $m$ in an inertial frame. Two forces act on it: the spring force $\mathbf{F}_s$ from the case, and gravitation $m\,\mathbf{g}_{grav}$ from the Earth. (Read $\mathbf{g}_{grav}$ as "g grav", the pull of gravity per kilogram.) If the case accelerates at $\mathbf{a}$ and the mass rides along,

$$
m\,\mathbf{a} = \mathbf{F}_s + m\,\mathbf{g}_{grav}
\qquad\Longrightarrow\qquad
\mathbf{f} \equiv \frac{\mathbf{F}_s}{m} = \mathbf{a} - \mathbf{g}_{grav}.
$$

The second step divides by $m$ and rearranges. The pick-off reads the spring, so the sensor's output is $\mathbf{f}$: the **specific force**, meaning the push that is *not* gravity, per kilogram, in $\mathrm{m/s^2}$.

Gravitation never appears in it, and cannot. Gravity pulls the proof mass and the case exactly alike, so the spring does not stretch and the pick-off sees nothing. This is the **[[equivalence principle|equivalence-principle]]** in engineering form: nothing sealed in a box can tell gravity from the box's own acceleration.

Two cases fix the sign in your head.

- **At rest on a bench.** Here $\mathbf{a} = 0$, so $\mathbf{f} = -\mathbf{g}_{grav}$. Gravity points down, so the accelerometer reads $9.81\,\mathrm{m/s^2}$ pointing **up**. The spring holds the mass up against gravity, and that is what it reports.
- **In free fall.** Here $\mathbf{a} = \mathbf{g}_{grav}$, so $\mathbf{f} = 0$. The accelerometer reads nothing, even though the vehicle is speeding up at $9.81\,\mathrm{m/s^2}$.

A spacecraft in orbit falls forever. At the International Space Station's height, $420\,\mathrm{km}$, gravity is $\mu/r^2 = 3.986 \times 10^{14}/(6.798 \times 10^{6})^2 = 8.62\,\mathrm{m/s^2}$, about $88\%$ of its value on the ground. The station's accelerometers read only a few micro-$g$ of drag and vibration. The $8.62\,\mathrm{m/s^2}$ that keeps it in orbit is invisible to them.

So the navigator must supply gravity itself. Flip the definition around:

$$
\mathbf{a} = \mathbf{f} + \mathbf{g}_{grav}.
$$

This sum, not $\mathbf{f}$ alone, is what gets integrated into velocity. The gravity comes from a computer model, worked out at the computed position. Its errors add straight to the reading, and nothing can tell the two apart: a gravity-model error looks exactly like an accelerometer bias. In axes that turn with the Earth, the centrifugal term from the rotating-frames module joins gravitation to make **gravity** $\mathbf{g}$, the direction a plumb line hangs, and a later lesson builds the full velocity equation from there.

::: key What an accelerometer measures
Specific force, not acceleration: $\mathbf{f} = \mathbf{a} - \mathbf{g}_{grav}$. In free fall it reads zero; at rest on a bench it reads $+g$ upward. Gravity must be added analytically, $\mathbf{a} = \mathbf{f} + \mathbf{g}$, from a model evaluated at the computed position, which is why a gravity-model error is indistinguishable from an accelerometer bias.
:::

::: example A level banked turn
An airplane holds a level turn at $60^\circ$ of bank. The lift must hold up the weight, so lift divided by weight — the **load factor** — is $1/\cos 60^\circ = 2.00$. The accelerometers read a specific force of $2 \times 9.80665 = 19.6\,\mathrm{m/s^2}$ straight down through the pilot's seat, along the body's vertical axis.

The acceleration is something else entirely. It is horizontal, toward the center of the turn, of size $g\tan 60^\circ = 9.80665 \times 1.732 = 17.0\,\mathrm{m/s^2}$. So specific force and acceleration differ by a vector of length $g$ pointing down, and they do not even point the same way. The navigator gets the acceleration back by turning $\mathbf{f}$ into north–east–down axes and adding model gravity $(0, 0, 9.81)\,\mathrm{m/s^2}$.

Sanity check: $\sqrt{17.0^2 + 9.81^2} \approx 19.6$, so the numbers fit.

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

A gyroscope measures how fast its case turns relative to **[[inertial space|inertial-space]]** — relative to the distant stars, not the ground — along its own axes. The rotating-frames module wrote that as $\boldsymbol{\omega}^{b}_{B/I}$. This module uses the navigation shorthand $\boldsymbol{\omega}_{ib}^{b}$, read "omega i b, in b": the rate of the body frame $b$ relative to the inertial frame $i$, written in body axes. Both name the same vector.

The word *inertial* matters because the Earth turns. A gyro sitting still on a bench is carried around the Earth's axis once per **[[sidereal day|sidereal-day]]**, and it reports that. The Earth's rate is

$$
\omega_{ie} = 7.292115 \times 10^{-5}\,\mathrm{rad/s} = 15.041^\circ/\mathrm{h}.
$$

In north–east–down axes at latitude $\varphi$ ("phi"), the rotating-frames module showed it splits as $\boldsymbol{\omega}_{ie}^{n} = \omega_{ie}(\cos\varphi,\ 0,\ -\sin\varphi)$. At $45^\circ$ the horizontal part is $15.041\cos 45^\circ = 10.6^\circ/\mathrm{h}$, and it points to true north.

A gyro good enough to sense that horizontal part can find north with no compass. This is **[[gyrocompassing|gyrocompassing]]**, taught later in this module. A gyro whose error is about as big as Earth rate cannot do it. Learn the number both ways: $7.292115 \times 10^{-5}\,\mathrm{rad/s}$ for code, $15.04^\circ/\mathrm{h}$ for judging a datasheet at a glance.

::: key Earth rate
$\omega_{ie} = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$, about $15.041^\circ/\mathrm{h}$. A gyro whose bias instability is well below this can gyrocompass; a gyro whose bias is a large fraction of it cannot find north.
:::

Older systems held their sensors level on motorized rings. A **[[strapdown|strapdown]]** IMU bolts the sensors straight to the vehicle and levels in software. The computer integrates the gyros to track $\mathbf{C}_b^n$, the direction cosine matrix from body to navigation axes, and uses it to turn the specific force into the frame where gravity is added.

So every attitude error tips gravity sideways into the horizontal channels. That chain — gyro error, attitude error, gravity leak, velocity error, position error — is the backbone of this module.

## Accelerometer technologies

Three designs cover the market.

- The **pendulous force-rebalance** accelerometer hangs its proof mass on a thin quartz hinge. A control loop drives a coil that holds the mass exactly centered. The current needed is proportional to specific force, and the pick-off never leaves the center, where it is most accurate. This is the navigation-grade workhorse: bias of $25$ to $100\,\mathrm{\mu g}$, and a scale factor steady to tens of parts per million.
- The **MEMS capacitive** accelerometer is the same idea carved into silicon. **MEMS** means micro-electro-mechanical systems: machines a fraction of a millimeter across. A tiny mass sits on folded springs, and comb-shaped fingers read its motion as a change in capacitance. Phone-grade parts run open loop; better tactical parts close the loop. Bias ranges from a few milli-$g$ down to about $100\,\mathrm{\mu g}$.
- The **vibrating-beam** accelerometer hangs the proof mass on a quartz beam, like a guitar string. More load changes the beam's pitch, so the output is a frequency — digital from the start.

One micro-$g$ ($\mathrm{\mu g}$) is $9.80665 \times 10^{-6}\,\mathrm{m/s^2}$ and one milli-$g$ ($\mathrm{mg}$) is $9.80665 \times 10^{-3}\,\mathrm{m/s^2}$.

A trade you will use constantly: tilt a level accelerometer by a small angle $\delta\theta$ ("delta theta") and it picks up $g\sin\delta\theta \approx g\,\delta\theta$ of gravity sideways. So a bias of $1\,\mathrm{mg}$ looks exactly like a tilt of $1\,\mathrm{mrad}$, about $3.4$ arcminutes. Accelerometer bias and attitude error trade places throughout this module.

## MEMS vibratory gyroscopes

Walk straight across a spinning merry-go-round and you feel shoved sideways. That shove is the **[[Coriolis acceleration|coriolis]]**, and a MEMS gyro is built to feel it.

A MEMS gyro has no spinning wheel. It has a proof mass shaken back and forth along one axis, the **drive** axis, at a few thousand to a few tens of thousands of times a second. When the case turns at rate $\Omega$ ("omega") about an axis at right angles to the shaking, the moving mass (velocity $\mathbf{v}_d$) feels

$$
\mathbf{a}_{cor} = -2\,\boldsymbol{\Omega} \times \mathbf{v}_d .
$$

This pushes the mass along the third axis, the **sense** axis. The push wiggles at the drive frequency, with a size proportional to $\Omega$. Comparing the sense wiggle with the drive gives the rate.

::: example The size of the Coriolis signal in a MEMS gyro
Take a drive swing of $10\,\mathrm{\mu m}$ at $10\,\mathrm{kHz}$. The peak drive speed is $v_d = 2\pi \times 10^{4} \times 10^{-5} = 0.628\,\mathrm{m/s}$.

At a turn rate of $1^\circ/\mathrm{s} = 0.01745\,\mathrm{rad/s}$, the Coriolis acceleration is $2 \times 0.01745 \times 0.628 = 0.0219\,\mathrm{m/s^2}$, about $2.2\,\mathrm{mg}$. If the sense spring responds slowly compared with the drive, the mass moves $a/\omega^2 = 0.0219/(2\pi \times 10^{4})^2 = 5.6 \times 10^{-12}\,\mathrm{m}$. A design with matched resonances and a quality factor of $1000$ magnifies that to about $5.6\,\mathrm{nm}$.

Now ask the gyro to feel the Earth turn. At $\omega_{ie} = 7.29 \times 10^{-5}\,\mathrm{rad/s}$ the Coriolis acceleration is $9.2 \times 10^{-5}\,\mathrm{m/s^2}$, and the motion is $2.3 \times 10^{-14}\,\mathrm{m}$: twenty-three **[[femtometers|femtometers]]**, smaller than thirty protons in a row.

Compare an imperfection. If manufacturing leaks one part per million of the $10\,\mathrm{\mu m}$ drive swing into the sense axis, that is $10\,\mathrm{pm}$ of false motion — about $430$ times the Earth-rate signal. This leak is called **quadrature error**. It is a quarter-cycle ($90^\circ$) out of step with the Coriolis signal, so the electronics mostly reject it. But any small timing error lets a slice through as bias. So MEMS gyros are bias-limited, their bias shifts with temperature, and a phone-grade gyro cannot find north.
:::

The scale factor is proportional to the drive speed, so a control loop holds the drive swing constant and the electronics are calibrated over temperature. Tactical MEMS gyros reach bias instabilities below $1^\circ/\mathrm{h}$ and angle random walk near $0.1^\circ/\sqrt{\mathrm{h}}$. Consumer parts are ten to a hundred times worse. The art of low-cost navigation is letting something else correct their bias faster than it wanders.

## Optical gyroscopes: the Sagnac effect

Light gives a rate sensor with no moving parts at all. Send two beams around the same closed loop in opposite directions, then turn the loop. The beam going with the turn has to chase the finish line, which has moved on, so it travels a little farther. The beam going against the turn travels a little less. This is the **[[Sagnac effect|sagnac]]**.

For a circular loop of radius $R$ and area $A = \pi R^2$ turning at $\Omega$, with $c$ the speed of light, the two trip times are

$$
t_{\pm} = \frac{2\pi R}{c \mp R\Omega}, \qquad
\Delta t = t_+ - t_- = \frac{4\pi R^2\,\Omega}{c^2 - R^2\Omega^2} \approx \frac{4A\,\Omega}{c^2}.
$$

The last step drops $R^2\Omega^2$, which is tiny next to $c^2$. The answer depends only on the area enclosed, and it holds for any loop shape. When the beams meet again, they are out of step by a phase

$$
\Delta\phi = \frac{2\pi c\,\Delta t}{\lambda} = \frac{8\pi A}{\lambda c}\,\Omega
$$

per trip around, where $\lambda$ ("lambda") is the wavelength. The effect is tiny. For one loop $10\,\mathrm{cm}$ across at $1550\,\mathrm{nm}$, $8\pi A/(\lambda c)$ is about $4.2 \times 10^{-4}$ radians of phase per $\mathrm{rad/s}$ of turn. The two optical gyros are two ways to make it readable.

The **fiber-optic gyro** (FOG) winds $N$ turns of glass fiber onto a coil, which multiplies the phase by $N$. With total fiber length $L = N\pi D$ and coil diameter $D$,

$$
\Delta\phi = \frac{8\pi N A}{\lambda c}\,\Omega = \frac{2\pi L D}{\lambda c}\,\Omega .
$$

The second form uses $NA = N\pi D^2/4 = LD/4$. The light's brightness at the detector goes as $1 + \cos\Delta\phi$, which is flat at $\Delta\phi = 0$ — a bad place to measure. So a phase modulator shifts the working point to $\pm\pi/2$, where the curve is steepest. A closed-loop FOG then adds a phase ramp that cancels the Sagnac phase, and reads the rate from the ramp. The light source is deliberately broadband, so stray light scattered inside the fiber cannot interfere with the main beams.

::: example A navigation-grade fiber coil
A FOG has $L = 1000\,\mathrm{m}$ of fiber on a coil of diameter $D = 0.10\,\mathrm{m}$, at $\lambda = 1550\,\mathrm{nm}$. That is $N = L/(\pi D) = 3183$ turns. Its Sagnac scale factor is

$$
\frac{2\pi L D}{\lambda c} = \frac{2\pi \times 1000 \times 0.10}{1550 \times 10^{-9} \times 2.998 \times 10^{8}} = 1.35\ \mathrm{rad\ per\ rad/s}.
$$

Earth rate gives $1.35 \times 7.29 \times 10^{-5} = 9.86 \times 10^{-5}\,\mathrm{rad}$ of phase: $99\,\mathrm{\mu rad}$, about $20$ arcseconds. A navigation-grade bias of $0.01^\circ/\mathrm{h} = 4.85 \times 10^{-8}\,\mathrm{rad/s}$ is $66\,\mathrm{nrad}$ of phase, one part in $10^{8}$ of a full fringe. The electronics must resolve that while the light takes only $L/c = 3.3\,\mathrm{\mu s}$ to cross the coil.

All these numbers grow with $L D$. More fiber or a bigger coil buys sensitivity, at the cost of size and of temperature differences across the coil — the FOG's main source of bias.
:::

The **ring laser gyro** (RLG) makes the loop itself into a laser. It is a triangular or square block of special glass, with mirrors at the corners and a glowing helium–neon gas discharge in the path. A laser loop only shines at wavelengths that fit a whole number of times around the loop. The two opposite beams see paths that differ by $\Delta L = c\,\Delta t = 4A\Omega/c$, so their frequencies differ by

$$
\Delta f = \frac{c}{\lambda}\,\frac{\Delta L}{P} = \frac{4A}{\lambda P}\,\Omega,
$$

where $P$ is the perimeter. Mix the two beams on a detector and you get a **beat** at $\Delta f$, like two guitar strings slightly out of tune. Each beat is one fixed step of angle, so the RLG counts angle directly, like a digital odometer for turning.

::: example A ring laser at Earth rate
A square cavity with $10\,\mathrm{cm}$ sides has $A = 0.01\,\mathrm{m^2}$ and $P = 0.4\,\mathrm{m}$. At the helium–neon wavelength $632.8\,\mathrm{nm}$ its scale factor is

$$
\frac{4A}{\lambda P} = \frac{4 \times 0.01}{632.8 \times 10^{-9} \times 0.4} = 1.58 \times 10^{5}\ \mathrm{Hz\ per\ rad/s}.
$$

Earth rate gives a beat of $1.58 \times 10^{5} \times 7.29 \times 10^{-5} = 11.5\,\mathrm{Hz}$. One beat is $1/(1.58 \times 10^{5}) = 6.33\,\mathrm{\mu rad}$, about $1.3$ arcseconds, so a $90^\circ$ turn ($1.571\,\mathrm{rad}$) gives $248\,000$ counts.

The catch: at low rates, light scattered by the mirrors pulls both beams onto one frequency. Inside this **[[lock-in|lock-in]]** band, typically a few hundred degrees per hour wide, the output is zero. The cure is to shake the block through a small angle a few hundred times a second, keeping the rate outside the band, then subtract the known shaking, which adds up to zero.
:::

With bias of about $0.001$ to $0.01^\circ/\mathrm{h}$ and a scale factor steady to a few parts per million, the RLG has been the standard airliner gyro for forty years. Its costs: the gas discharge, precision mirrors, the shaking mechanism, and a lifetime limited by the discharge.

## The hemispherical resonator gyro

Tap a wine glass and it rings: its rim flexes into an oval, then an oval turned $45^\circ$, back and forth. The points on the rim that stay still are **nodes**.

In 1890 G. H. Bryan noticed that if you turn the ringing glass on its stem, the pattern of nodes stays fixed neither to the glass nor to the room. It lags behind the glass by a fixed fraction of the turn angle — about $0.3$ for a thin half-sphere — set only by the shape. This is the **[[Bryan factor|bryan]]**.

The **hemispherical resonator gyro** (HRG) is that wine glass made precise: a fused-quartz half-sphere a few centimeters across, rung by electric forces in a vacuum, with electrodes around the rim reading where the pattern points.

- In **whole-angle** mode the pattern is left free and its angle to the case is read directly. The output is total rotation, with a scale factor set by the shell's shape and no limit on rate.
- In **force-rebalance** mode the electrodes hold the pattern fixed to the case, and the force needed is proportional to rate. This trades range for lower noise.

With no light source, gas or bearings, and a quality factor in the millions (it rings a long time after one tap), an HRG runs for decades without wear. So it flies on a large share of today's spacecraft and on several launch vehicles, with navigation-grade bias and noise.

## Grades, and what the grade buys

Datasheets sort themselves into grades by gyro bias. The figures below are typical ranges, not specifications.

| Grade | Gyro bias instability | Angle random walk | Accelerometer bias | Typical technology |
| --- | --- | --- | --- | --- |
| Consumer / automotive | $10$ to $1000^\circ/\mathrm{h}$ | $0.3$ to $1^\circ/\sqrt{\mathrm{h}}$ | $1$ to $10\,\mathrm{mg}$ | MEMS, open loop |
| Tactical | $0.1$ to $10^\circ/\mathrm{h}$ | $0.02$ to $0.3^\circ/\sqrt{\mathrm{h}}$ | $0.1$ to $1\,\mathrm{mg}$ | Closed-loop MEMS, small FOG |
| Navigation (aviation) | about $0.01^\circ/\mathrm{h}$ | $0.002$ to $0.005^\circ/\sqrt{\mathrm{h}}$ | $25$ to $100\,\mathrm{\mu g}$ | RLG, FOG, HRG |
| Strategic / marine | below $0.001^\circ/\mathrm{h}$ | below $0.001^\circ/\sqrt{\mathrm{h}}$ | below $10\,\mathrm{\mu g}$ | Large RLG, HRG, electrostatic |

Two quick readings come first with any datasheet, and both work in your head.

- **Read the gyro column against Earth rate.** A tactical gyro's bias is a tenth to a hundredth of $15^\circ/\mathrm{h}$: enough to see the Earth turn, but not to find north better than about a degree. A navigation-grade gyro sees Earth rate to one part in a thousand.
- **Read the accelerometer column as tilts.** $1\,\mathrm{mg}$ is $1\,\mathrm{mrad}$ of level error; $50\,\mathrm{\mu g}$ is $50\,\mathrm{\mu rad}$, about $10$ arcseconds.

::: warning
Do not read a gyro's rate range or an accelerometer's $g$ range as a measure of quality. They say what motion the sensor survives, not how accurate it is. And do not read "in-run bias instability" as the bias you will see at power-on. The **turn-on bias** is different at every start and often ten to a hundred times bigger than the instability figure. The alignment and the filter must remove it first. The instability only says how much the bias wanders afterwards.
:::

## Check yourself

::: check
A rocket lifts off straight up with a thrust-to-weight ratio of $1.3$. What does an accelerometer along the body axis read, and what is the vehicle's acceleration?
:::

::: answer
The net upward acceleration is $(1.3 - 1)g = 0.3 \times 9.80665 = 2.94\,\mathrm{m/s^2}$. The accelerometer reads specific force, $f = a - g_{grav}$, with $g_{grav}$ pointing down. Along "up", subtracting a downward $9.81$ means adding it: $f = 2.94 + 9.81 = 12.7\,\mathrm{m/s^2}$, which is exactly $1.3\,g$. So an accelerometer on a rocket reads thrust-to-weight in $g$, not acceleration. The $1\,g$ the engines spend fighting gravity is invisible to it, and the gravity model must put it back before the reading is integrated.
:::

::: check
A gyro triad sits level and pointed north at Cape Canaveral, latitude $28.5^\circ$. What does it read on each axis, in degrees per hour, and why is the reading not zero?
:::

::: answer
The triad is fixed to the Earth, the Earth turns relative to inertial space, and a gyro measures inertial rate. In north–east–down axes, $\boldsymbol{\omega}_{ie}^{n} = \omega_{ie}(\cos\varphi, 0, -\sin\varphi)$ with $\omega_{ie} = 15.041^\circ/\mathrm{h}$:

- north: $15.041\cos 28.5^\circ = 13.2^\circ/\mathrm{h}$;
- east: $0$;
- down: $-15.041\sin 28.5^\circ = -7.18^\circ/\mathrm{h}$.

The down part is negative because in the northern hemisphere the Earth's spin axis points up out of the ground, toward the North Star. The total size is $15.04^\circ/\mathrm{h}$ at every latitude; only the split between horizontal and vertical changes.
:::

::: check
A fiber-optic gyro designer has exactly $500\,\mathrm{m}$ of fiber. Compare the Sagnac scale factor of a coil $5\,\mathrm{cm}$ across with one $10\,\mathrm{cm}$ across, and explain the result using turns and area.
:::

::: answer
The scale factor is $2\pi L D/(\lambda c)$. With $L$ fixed it grows in step with $D$, so the $10\,\mathrm{cm}$ coil has twice the scale factor of the $5\,\mathrm{cm}$ coil.

In terms of turns, the formula is $8\pi N A/(\lambda c)$. Doubling $D$ makes each turn enclose four times the area, but the fiber now makes only half as many turns, since $N = L/(\pi D)$. Four times a half is two, so $NA$ doubles. For a given fiber length, big coils win. That is why high-performance FOGs are physically large — and why their temperature-difference bias, which also grows with coil size, is the designer's main tension.
:::

::: check
The drive swing of a MEMS gyro drifts by one percent because of a temperature change, and the control loop fails to correct it. What happens to the output at a true rate of $1^\circ/\mathrm{s}$, and at Earth rate?
:::

::: answer
The Coriolis acceleration is $2\Omega v_d$, so a one percent change in drive speed is a one percent change in scale factor. At $1^\circ/\mathrm{s}$ the output is off by $0.01^\circ/\mathrm{s} = 36^\circ/\mathrm{h}$ — far bigger than the sensor's bias instability. At Earth rate the same one percent is only $0.15^\circ/\mathrm{h}$.

Scale-factor error grows with the rate being measured: tiny at rest, dominant in a fast maneuver. That is why the drive swing is servo-held, the scale factor is calibrated over temperature, and the next lesson treats scale factor separately from bias.
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
| $\Delta f = 4A\Omega/(\lambda P)$ | Ring laser beat frequency; one beat is one fixed angle step |
| Bryan factor $\approx 0.3$ | HRG: the ringing pattern lags the case's turn by a fixed fraction set by shape |
| Consumer, tactical, navigation, strategic | Gyro bias roughly $100$, $1$, $0.01$, $0.001^\circ/\mathrm{h}$ |

The next lesson writes down everything a real accelerometer and gyro add to these perfect readings — turn-on and in-run bias, scale factor, non-orthogonality, misalignment, $g$-sensitivity and quantization — as the measurement model that every later lesson corrects for.

::: context proof-mass A weight on a spring
Every accelerometer, from a phone chip to a missile's navigator, is at heart this: a mass, a spring and a ruler. Push the case to the right and the mass lags behind, stretching the spring. The ruler reads the stretch, and the stretch tells you the push.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="320" height="80" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="20,60 40,60 50,45 70,75 90,45 110,75 130,45 150,75 160,60 180,60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="180" y="40" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="210" y="64" font-size="12" text-anchor="middle" fill="#1f2a44">mass</text>
  <line x1="210" y1="80" x2="210" y2="96" stroke="#b4232c" stroke-width="2"/>
  <line x1="200" y1="96" x2="300" y2="96" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="270" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">pick-off</text>
  <text x="95" y="38" font-size="12" text-anchor="middle" fill="#1d6fd1">spring</text>
  <text x="180" y="120" font-size="12" text-anchor="middle" fill="#1f2a44">case (bolted to the vehicle)</text>
</svg>
```

Gravity pulls the mass and the case equally, so on its own it never stretches the spring.
:::

::: context equivalence-principle Einstein's elevator
Albert Einstein imagined a person in a closed, windowless elevator. If the elevator sits on Earth, a dropped ball falls to the floor. If it is far out in space and a rocket pushes it upward at $9.81\,\mathrm{m/s^2}$, the ball does exactly the same thing. No experiment inside can tell which is happening. He called this his "happiest thought", and it became the start of general relativity. For a navigator it has a blunt meaning: the box of sensors can never feel gravity, so the computer has to know it in advance.
:::

::: context inertial-space What "inertial" means here
An inertial frame is one where Newton's laws hold without made-up forces: a puck with nothing pushing it slides in a straight line. The ground is not quite one, because the Earth spins. A frame lined up with the distant stars is, for all practical purposes. Gyros are built from springs, light and inertia, so they naturally sense turning relative to that star-fixed frame — not relative to the ground you stand on.
:::

::: context sidereal-day Why 15.041 and not 15
A solar day, noon to noon, is $24$ hours. But in that time the Earth also moves about one degree along its orbit around the Sun, so it has to turn a little more than one full turn to face the Sun again. One true turn relative to the stars — a **sidereal day** — takes about $86\,164\,\mathrm{s}$, or $23$ hours $56$ minutes. So the Earth turns $360^\circ$ in slightly less than a day: $360/86\,164 \times 3600 = 15.041^\circ$ per hour, and $2\pi/86\,164 = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$.
:::

::: context gyrocompassing Finding north without a compass
Lesson 10 of this module turns the idea into an algorithm. A level gyro pointed some way east of north feels only part of the horizontal Earth rate, $\omega_{ie}\cos\varphi$. Compare what the east and north gyros feel and you get the heading. Near the poles $\cos\varphi$ shrinks toward zero, so the signal fades and the method fails at the pole itself. Ships and submarines used spinning-wheel gyrocompasses on the same principle for a century before GPS.
:::

::: context strapdown Rings versus software
Early inertial navigators, including the one that guided Apollo to the Moon, kept their sensors on a platform held level by three motorized rings called gimbals. The rings were heavy, delicate and costly, and certain attitudes could make two rings line up and lose a degree of freedom — "gimbal lock". Once flight computers became fast enough, engineers bolted the sensors straight to the vehicle and let software do the math instead. Nearly every modern rocket, airliner and phone is strapdown.
:::

::: context coriolis The merry-go-round shove
Roll a ball straight out from the center of a spinning merry-go-round. To someone riding it, the ball curves sideways. Nothing pushed it; the platform turned underneath. In the rider's frame this shows up as the Coriolis acceleration, $-2\boldsymbol{\Omega}\times\mathbf{v}$. It needs both turning ($\boldsymbol{\Omega}$) and motion ($\mathbf{v}$), which is why a MEMS gyro keeps its proof mass moving all the time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="75" r="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="75" r="3" fill="#1f2a44"/>
  <path d="M110,75 Q150,70 160,40" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="160,40 153,50 163,50" fill="#b4232c"/>
  <line x1="110" y1="75" x2="170" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M60,40 A60,60 0 0,1 90,19" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="90,19 80,19 86,27" fill="#1d6fd1"/>
  <text x="40" y="20" font-size="12" fill="#1d6fd1">turning</text>
  <text x="200" y="70" font-size="12" fill="#6c7a93">straight, seen from the ground</text>
  <text x="200" y="45" font-size="12" fill="#b4232c">curved, seen by the rider</text>
</svg>
```
:::

::: context femtometers How small is 23 femtometers?
A femtometer is $10^{-15}\,\mathrm{m}$, a millionth of a billionth of a meter. A proton is about $0.84$ femtometers in radius, and a silicon atom is about $200\,000$ femtometers across. So the MEMS proof mass, sensing Earth rate, moves about one ten-thousandth of the width of one of its own atoms. Nobody measures that directly; the electronics average the signal over many cycles, which is part of why MEMS gyros are noisy.
:::

::: context sagnac Two beams, one loop
Georges Sagnac showed the effect with light in 1913. The two beams leave the splitter together. While they travel, the loop turns, so the finish line moves toward one beam and away from the other. The difference in their trip times is proportional to the turn rate and the area inside the loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="80" r="60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <rect x="113" y="133" width="14" height="14" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M136,138 A60,60 0 0,0 176,60" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="176,60 170,70 181,70" fill="#1d6fd1"/>
  <path d="M104,138 A60,60 0 0,1 64,60" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="64,60 59,70 70,70" fill="#b4232c"/>
  <path d="M155,30 A60,60 0 0,0 85,30" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="85,30 95,26 91,35" fill="#6c7a93"/>
  <text x="120" y="15" font-size="12" text-anchor="middle" fill="#6c7a93">loop turns</text>
  <text x="120" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">area A</text>
  <text x="210" y="60" font-size="12" fill="#1d6fd1">with the turn: longer path</text>
  <text x="210" y="100" font-size="12" fill="#b4232c">against the turn: shorter</text>
  <text x="210" y="140" font-size="12" fill="#1f2a44">splitter</text>
</svg>
```
:::

::: context lock-in Why the laser gets stuck
Two oscillators with nearly the same frequency, weakly coupled, tend to pull into step — the same reason pendulum clocks on one wall can end up swinging together. In a ring laser, the coupling is the tiny fraction of light each mirror scatters backward into the other beam. When the turn rate is so slow that the two frequencies are close, they lock and the beat vanishes. Mechanical shaking, called dither, keeps the gyro out of that dead zone almost all the time.
:::

::: context bryan A wine glass that knows it turned
Why does the pattern lag? The ringing is energy moving around in the shell. When the glass turns, the moving material feels Coriolis forces, which nudge the pattern backward relative to the glass. For a thin hemisphere the pattern turns only about $0.3$ as far as the shell does. The fraction depends only on shape, not on how hard you tapped it or how warm it is, which is exactly what you want from a scale factor.
:::
