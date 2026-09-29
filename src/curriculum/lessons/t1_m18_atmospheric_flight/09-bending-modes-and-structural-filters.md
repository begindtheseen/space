---
id: l09-bending-modes-and-structural-filters
title: Bending modes, flexible-body dynamics and structural filters
minutes: 24
covers:
  - bending modes, flexible body dynamics and structural filter design
---

Hold a ruler flat on a desk with a long piece hanging over the edge, and flick the free end. It buzzes at its own note. Flick harder and the note stays the same. Now tap the end gently, again and again, in exactly the rhythm of that buzz: each tap adds to the swing, and soon the ruler flaps wildly. That is **[[resonance|resonance]]**: a small push, repeated at an object's own natural rhythm, builds a huge motion.

A launch vehicle is a thin-walled tube tens of meters long, with a few millimeters of aluminum between its propellant and the air. Tap it and it rings too. Its lowest note — the **first bending mode** — is somewhere between 1 and 10 Hz, depending on its size. And it is damped so lightly that a push at that rhythm makes it swing about a hundred times harder than the same push held steady.

Here is the danger. The **rate gyros** that feed the attitude controller (sensors that measure how fast the vehicle is turning) are bolted to this tube, and they cannot tell the whole vehicle turning from the skin under them tilting as it bends. So the controller sees the bending, swings the engine to correct it, and the engine's push excites the bending further. A loop designed for a rigid rocket can go unstable at a frequency nobody looked at.

This lesson builds the flexible-body dynamics from beam theory, shows how a bending mode appears on a Bode plot, and then designs the standard remedy: a **notch filter** that hides the mode's frequency from the controller, sized for a mode whose frequency is uncertain. That is the bending-notch exercise, and the module's third objective.

## A launch vehicle is a free-free beam

Model the airframe as a long, thin beam of length $L$. Two numbers describe it:

- its **bending stiffness** $EI$ — how hard it is to bend. $E$ is the stiffness of the material (its elastic modulus) and $I$ is the **[[second moment of area|tube-stiffness]]** of the cross-section, which measures how far the material sits from the center line;
- its **mass per unit length** $\mu$ ("mu"), in kilograms per meter.

Let $w(x, t)$ be the small sideways bend at position $x$ along the body and time $t$. It obeys the **Euler–Bernoulli beam equation**:

$$
EI\,\frac{\partial^4 w}{\partial x^4} + \mu\,\frac{\partial^2 w}{\partial t^2} = 0 .
$$

Read it as a tug-of-war: stiffness trying to straighten the beam (first term) against each slice's mass times its sideways acceleration (second term).

A rocket in flight is held by nothing: both ends are **free**. Such a beam rings in a set of **modes** — fixed shapes, each vibrating at its own frequency — set by a number $\beta_n L$ for each mode $n$ that must satisfy

$$
\cosh\beta L\,\cos\beta L = 1,
$$

whose roots are $\beta_1 L = 4.730$, $\beta_2 L = 7.853$, $\beta_3 L = 10.996$, and after that close to $(2n+1)\pi/2$. The natural frequencies are then

$$
\omega_n = (\beta_n L)^2\sqrt{\frac{EI}{\mu L^4}}, \qquad (\beta_n L)^2 = 22.37,\ 61.67,\ 120.9,\ \ldots
$$

So the first three modes stand in the ratio $1 : 2.76 : 5.40$.

Like a guitar string, stiffness raises the note and mass lowers it. Length counts most: it sits as $L^4$ under the square root, so doubling the length quarters the frequency.

::: note Why it has to be true
Look for a standing wave, a fixed shape $\phi(x)$ ("phi of x") that grows and shrinks in time, $w(x, t) = \phi(x)\,\eta(t)$ with $\eta = \cos\omega t$. Taking two time derivatives of $\cos\omega t$ gives $-\omega^2\cos\omega t$. Put that into the beam equation and divide by $EI\,\eta$:

$$
\phi'''' = \beta^4\phi, \qquad \beta^4 = \frac{\mu\omega^2}{EI}.
$$

($\phi''''$ is read "phi four-prime", the fourth derivative in $x$.) The functions whose fourth derivative is $\beta^4$ times themselves are $\cosh\beta x$, $\sinh\beta x$, $\cos\beta x$ and $\sin\beta x$, so $\phi$ is a mix of the four.

A free end carries no bending moment and no shear force. For the beam that means $\phi'' = 0$ and $\phi''' = 0$ at $x = 0$ and at $x = L$ — four conditions on four unknown amounts. They have a non-zero answer only when a certain determinant vanishes, and working it out gives $\cosh\beta L\cos\beta L = 1$. Solving $\beta^4 = \mu\omega^2/EI$ for $\omega$ gives $\omega = \beta^2\sqrt{EI/\mu}$, which is the frequency formula above.
:::

### The shape of the first mode

The first **[[mode shape|free-free-shape]]** is symmetric about the middle: the two ends swing one way while the middle swings the other. Two points stay still. These are **nodes**, at $x = 0.224L$ and $x = 0.776L$. If the ends move one unit, the middle moves $0.608$ units the opposite way.

A gyro senses not the bend but the **slope** $\phi'(x)$ — how much the local skin is tilted. For the first mode it is zero at mid-body, where the bend is largest, and largest at the ends: $4.65/L$ per unit of end movement. The second mode is antisymmetric — one end up, the other down — with a node at mid-body. Its slope there is large, $5.40/L$ (a local peak), though its ends tilt even more, $7.86/L$. So where you mount a gyro decides how much of each mode it sees.

::: example First bending mode of a mid-size launcher
A 45 m vehicle has a mass of 130 t.

**Mass per meter.** $\mu = 130000/45 = 2889\ \mathrm{kg/m}$.

**Stiffness.** The core is an aluminum-alloy tube of radius 1.5 m. Spreading its stiffeners out into the skin gives an effective thickness of 10 mm. For a thin tube, $I = \pi r^3 t$:

$$
I = \pi \times 1.5^3 \times 0.010 = 0.106\ \mathrm{m^4}.
$$

With $E = 72\ \mathrm{GPa}$ for aluminum, $EI = 72 \times 10^9 \times 0.106 = 7.63 \times 10^9\ \mathrm{N\cdot m^2}$.

**Frequency.** First the square root: $\sqrt{7.63 \times 10^9 / (2889 \times 45^4)} = 0.803$ per second. Then

$$
\omega_1 = 22.37 \times 0.803 = 18.0\ \mathrm{rad/s}.
$$

In hertz: $18.0/6.283 = 2.86\ \mathrm{Hz}$. The next modes follow from the ratios: $f_2 = 2.76 \times 2.86 = 7.9\ \mathrm{Hz}$, and $f_3$ is about $15.5\ \mathrm{Hz}$.

**Other sizes.** Scale up to a 70 m, 420 t vehicle of radius 1.83 m with a 12 mm effective skin, and the first mode drops to about 1.2 Hz. Shrink to a 20 m, 40 t vehicle of radius 0.9 m with a 6 mm skin, and it rises to about 6.3 Hz.

**Sanity check.** Real vehicles are not uniform, and propellant leaves in flight, so frequencies *rise* through the burn. But the uniform-beam number lands within tens of percent of a full computer model and gives the right range: a few hertz, as the key below says.
:::

::: key
Bending modes are elastic deformations of the airframe, typically with the first mode at 2–10 Hz for a large launch vehicle (near 1 Hz for the very largest) and damping ratios of about 0.005. Rate gyros sense the local slope of the deformed structure, so the mode feeds straight back into the controller and can go unstable.
:::

## Modal equations and the flexible transfer function

Any bend can be built by adding up mode shapes, each with its own changing amount:

$$
w(x, t) = \sum_n \phi_n(x)\,\eta_n(t).
$$

The amount $\eta_n$ ("eta sub n") is the **modal coordinate** of mode $n$. The modes [[do not mix|modes-apart]], so each one obeys its own spring-and-damper equation, pushed only by the part of the outside forces that matches its shape.

The engine's sideways thrust, $T\delta$, acts at the gimbal station $x_T$. So

$$
\ddot\eta_n + 2\zeta_n\omega_n\dot\eta_n + \omega_n^2\eta_n = \frac{\phi_n(x_T)\,T\,\delta}{M_n}, \qquad M_n = \int_0^L \mu\,\phi_n^2\,dx .
$$

$M_n$ is the **generalized mass** — the mass taking part in the mode, weighted by its shape; for the first free-free mode, scaled to move one unit at the ends, $M_1 = m/4$. And $\zeta_n$ ("zeta sub n") is the **structural damping ratio** — how fast the ringing dies out. For welded aluminum structure full of propellant it is tiny: 0.005 is the usual value, with 0.002 to 0.02 measured.

### What the sensors see

A rate gyro at station $x_g$ measures the local turning rate of the skin. That is the rigid-body rate plus the rate of change of the local slope:

$$
\dot\theta_{\text{meas}} = \dot\theta + \sum_n \phi_n'(x_g)\,\dot\eta_n .
$$

An accelerometer at $x_a$ measures the local sideways acceleration, $\ddot z + x_a\ddot\theta + \sum_n \phi_n(x_a)\ddot\eta_n$. It sees the *bend* shape rather than the slope.

Combine the modal equation with the gyro equation. The link from gimbal to measured attitude becomes the rigid plant of lesson 6 plus one second-order term per mode:

$$
\frac{\theta_{\text{meas}}(s)}{\delta(s)} = \frac{\mu_\delta}{s^2 - \mu_\alpha} + \sum_n \frac{k_n\,\omega_n^2}{s^2 + 2\zeta_n\omega_n s + \omega_n^2},
\qquad
k_n = \frac{\phi_n'(x_g)\,\phi_n(x_T)\,T}{M_n\,\omega_n^2} .
$$

The **modal gain** $k_n$ has no units: radians of measured attitude per radian of gimbal, for a very slow push. And it has a sign — the slope of the mode at the gyro times the bend of the mode at the engine. Move the gyro across a point of zero slope and the sign flips.

For the 20 m, 40 t vehicle of the example, with its 6.3 Hz first mode ($\omega_1 = 39.3\ \mathrm{rad/s}$), 0.6 MN of thrust, the engine at an end (where $\phi = 1$) and the gyro at $0.85L$ (slope $+0.221$ per meter per unit end movement), and $M_1 = 40000/4 = 10^4\ \mathrm{kg}$:

$$
k_1 = \frac{0.221 \times 1 \times 6 \times 10^5}{10^4 \times 39.3^2} = 8.6 \times 10^{-3}.
$$

With the gyro at $0.15L$ it is $-8.6 \times 10^{-3}$; at mid-body, zero. Since $k_n$ falls as $1/\omega_n^2$, the same vehicle stiffened to a 12 Hz mode would have $k_1 \approx 2.3 \times 10^{-3}$. The example below uses a smaller $5 \times 10^{-4}$; real vehicles span an order of magnitude either way.

## What a mode looks like on a Bode plot

A second-order term with damping $\zeta$, pushed at its natural frequency, answers $1/(2\zeta)$ times more strongly than it does to a slow push. For $\zeta = 0.005$ that is a factor of

$$
\frac{1}{2 \times 0.005} = 100,
$$

or **40 dB** in [[decibels|decibels]]. Its phase drops through $-90^\circ$ at the natural frequency, on its way from $0^\circ$ to $-180^\circ$. The whole swing happens in a band only about $2\zeta\omega_n$ wide: about 0.1 Hz for a 12 Hz mode.

On the Bode plot of a rigid-body loop's gain, this shows up as a [[needle|needle-plot]]: a sharp spike rising tens of decibels above the smooth roll-off, with a phase that swings through $180^\circ$ in a few tenths of a hertz. With $k_n > 0$ the mode adds to the rigid response and the phase falls; with $k_n < 0$ it subtracts and the phase rises.

That is how you **identify a bending mode**: a narrow, tall resonance far above the actuator's bandwidth, whose frequency does not change with loop gain but rises slowly through the burn, and which shows at a different size — or with the opposite sign — on a gyro mounted elsewhere. Slosh looks similar but sits below 1 Hz. An actuator resonance shows on the gimbal-position feedback rather than the gyro.

::: example A 12 Hz mode destabilizes a 2 Hz loop
Take a small launcher with $\mu_\alpha = 1.0\ \mathrm{s^{-2}}$ and $\mu_\delta = 10\ \mathrm{s^{-2}}$, a PD controller with $K_p = 5$ and $K_d = 1.26\ \mathrm{s}$, and a 10 Hz second-order actuator.

**The rigid loop.** Computed numerically, the gain crosses 0 dB at 2.08 Hz with $56^\circ$ of phase margin. The upper gain margin is 16 dB (the phase crosses $-180^\circ$ at 9.5 Hz), and the low-gain margin is $20\log_{10}(K_p\mu_\delta/\mu_\alpha) = 20\log_{10}(50) = 34\ \mathrm{dB}$. At 12 Hz the rigid loop gain is down to $-20\ \mathrm{dB}$. A textbook-good design.

**Add the mode.** Put a first bending mode at 12.0 Hz with $\zeta = 0.005$ and $k_1 = +5 \times 10^{-4}$. Add up its contributions in decibels at 12 Hz:

- the mode's slow-push gain, $5 \times 10^{-4}$, is $-66\ \mathrm{dB}$;
- the resonance multiplies it by 100: $+40\ \mathrm{dB}$;
- the controller's rate term multiplies by $K_d\omega = 1.26 \times 75.4 = 95$, about $+40\ \mathrm{dB}$ (here $\omega = 2\pi \times 12 = 75.4\ \mathrm{rad/s}$);
- the actuator and the proportional term do the rest.

The net loop gain peaks at **+8.8 dB** at 12.0 Hz. The gain now crosses 0 dB twice more, at 11.86 Hz and 12.17 Hz, and the phase passes through $-180^\circ$ between them while the gain is above one.

**The verdict.** The closed-loop poles include a pair at $+0.014 \pm 76.4j$: an oscillation at 12.2 Hz whose positive real part makes it grow, slowly but without limit. The rigid design was faultless; the vehicle would shake itself apart.
:::

## The notch filter

The fix is to remove the mode's frequency from what the controller acts on, the way a sound engineer pulls down one equalizer slider to kill a howl. A **[[notch filter|notch-shape]]** in series with the controller does that:

$$
N(s) = \frac{s^2 + 2\zeta_z\omega_q s + \omega_q^2}{s^2 + 2\zeta_p\omega_q s + \omega_q^2}, \qquad \zeta_z < \zeta_p .
$$

Here $\omega_q$ is the notch center, and $\zeta_z$ and $\zeta_p$ are two dampings you choose. Far from $\omega_q$ the top and bottom are nearly equal, so $N$ is about 1. At the center, $s = j\omega_q$, the $s^2$ and $\omega_q^2$ terms cancel, and what remains is $\zeta_z/\zeta_p$. So:

- the **depth** of the notch is $20\log_{10}(\zeta_z/\zeta_p)$ decibels;
- the pole damping $\zeta_p$ sets the **width**: the attenuation stays within a few dB of its deepest over roughly $\pm\zeta_p\omega_q$;
- the zero damping $\zeta_z$ then sets the depth for that width.

The notch is not free. Well below its center it adds a small **phase lag** (a delay in the signal's timing):

$$
\angle N(j\omega) \approx -2(\zeta_p - \zeta_z)\,\frac{\omega}{\omega_q} \quad\text{(radians)} .
$$

A deep, wide notch (large $\zeta_p$) costs phase at crossover in proportion to $\zeta_p$ and to how close the crossover is. That is the whole design tension.

::: note Why it has to be true
For $s$ much smaller than $\omega_q$, the $s^2$ terms are tiny. Divide top and bottom by $\omega_q^2$:

$$
N(s) \approx \frac{1 + 2\zeta_z s/\omega_q}{1 + 2\zeta_p s/\omega_q} \approx 1 + 2(\zeta_z - \zeta_p)\frac{s}{\omega_q},
$$

using $1/(1 + a) \approx 1 - a$ for small $a$ and dropping the product of two small terms. Put $s = j\omega$: $N \approx 1 - j\,2(\zeta_p - \zeta_z)\omega/\omega_q$. A number $1 - j\varepsilon$ with small $\varepsilon$ has angle about $-\varepsilon$ radians, which is the formula.
:::

::: example Sizing the notch
Center a notch at 12 Hz in the loop above, with $\zeta_z = 0.05$ and $\zeta_p = 0.5$.

**Depth.** $\zeta_z/\zeta_p = 0.1$, and $20\log_{10}(0.1) = -20\ \mathrm{dB}$. The mode's peak falls from $+8.8$ to $-11.2\ \mathrm{dB}$. It is now **gain-stabilized** with 11 dB of margin, and the closed loop is stable.

**Cost at crossover.** At 2 Hz the notch trims the gain by only $0.12\ \mathrm{dB}$, and its phase is $-8.7^\circ$. The approximation agrees:

$$
-2 \times 0.45 \times 2/12 = -0.15\ \mathrm{rad} = -8.6^\circ .
$$

So the phase margin drops from $56^\circ$ to $47^\circ$, and the crossover moves slightly, to 2.04 Hz. The upper gain margin falls to 11.8 dB, because the notch's lag pulls the phase crossover down to 6.1 Hz. Requirement met: at least 8 dB of attenuation, and less than $10^\circ$ of phase margin spent.

**If the mode is not where you think.** Suppose the flight mode is at 13.2 Hz, 10 % above the ground-test value. The notch gives only 13.5 dB there, and the peak sits at $-5.1\ \mathrm{dB}$: still stable, but the margin has shrunk from 11 dB to 5.

**Widen it.** Try $\zeta_z = 0.03$, $\zeta_p = 0.6$, which is 26 dB deep. The nominal peak is $-17.3\ \mathrm{dB}$, the 13.2 Hz peak $-7.3\ \mathrm{dB}$, and the phase cost at 2 Hz rises to $11^\circ$ (phase margin $45^\circ$). Widen further to $\zeta_p = 1.0$ and the cost is $18^\circ$.

**Sanity check.** Wider notches cost more phase, as $2(\zeta_p - \zeta_z)\,\omega/\omega_q$ predicts. Size the notch on the *uncertain* mode; the phase budget at crossover limits how wide it can go.
:::

Why not a low-pass filter, cutting everything above some frequency? A second-order low-pass at 4 Hz would give 19 dB at 12 Hz — but $43^\circ$ of phase lag at 2 Hz, which wrecks the rigid-body margin. At 6 Hz it gives 12 dB for $28^\circ$. The notch spends its phase only near its own center, so for a mode well above crossover it is far cheaper per decibel.

In practice a **bending filter** is a chain: one notch per mode that needs it, plus a gentle low-pass for the higher modes. Since mode frequencies rise as propellant drains, the notches are either wide enough for the whole burn or scheduled with time.

```python
import numpy as np

def notch(w, wq, zz, zp):
    s = 1j * w
    return (s**2 + 2*zz*wq*s + wq**2) / (s**2 + 2*zp*wq*s + wq**2)

wq = 2*np.pi*12.0
N_at_mode  = notch(wq,           wq, 0.05, 0.5)
N_at_cross = notch(2*np.pi*2.0,  wq, 0.05, 0.5)
print(round(20*np.log10(abs(N_at_mode)), 1))        # -> -20.0 dB
print(round(np.degrees(np.angle(N_at_cross)), 1))   # -> -8.7 deg
```

## Gain stabilization, and its limit

What the notch achieves is **gain stabilization**: the mode is pushed so far below 0 dB that its phase no longer matters, whatever the sign of $k_n$ and however the actuator's lag drifts. It works because the 12 Hz mode is six times above the 2 Hz crossover, where the loop is already rolling off and the notch's phase cost is small.

Move the mode down to 3 Hz, one and a half times the crossover, and the trick fails. A 20 dB notch at 3 Hz costs $43^\circ$ of phase at 2 Hz; it also lowers the gain there, and the phase margin ends up near $22^\circ$ — below the usual $30^\circ$ requirement. A shallower 15.6 dB notch ($\zeta_p = 0.3$) keeps about $31^\circ$, barely legal. But it is so narrow that a mode 10 % off its predicted frequency gets only 9 dB. So close to crossover, attenuation wrecks the rigid-body loop. The other answer — **[[phase stabilization|phase-stab]]**, letting the mode rise above 0 dB but steering its phase so the loop stays stable — is the subject of the control-structure interaction lesson.

::: warning
The mode frequency in flight is not the frequency from the **[[ground vibration test|ground-test]]**. Draining propellant raises it through the burn. Tank pressure and temperature shift it. The model's uncertainty is typically $\pm 10$–20 %. A notch that covers only the nominal frequency misses in flight. Size the width on the uncertainty band, then pay the phase.
:::

::: warning
A notch cuts what the controller *sees*, not what the structure *does*. The mode is still there, still excited by gusts and the gimbal, still lightly damped; the notch only stops the loop from pumping it. If the structure itself needs less vibration, that is a damping or stiffness problem, not a filter problem.
:::

## Check yourself

::: check
A vehicle's first bending mode is measured at 4.0 Hz on the pad with full tanks. Using the uniform-beam scaling, estimate the frequency at first-stage burnout if 75 % of the vehicle's mass has been burned and the stiffness is unchanged.
:::

::: answer
The formula says $\omega_1 \propto \sqrt{EI/(\mu L^4)}$. With $EI$ and $L$ fixed, the frequency goes as $1/\sqrt{\mu}$. The mass per meter is down to 25 % of its starting value, so

$f_1 = 4.0/\sqrt{0.25} = 8.0\ \mathrm{Hz}$.

The real change is smaller, because the propellant is not spread like the structure. But a rise of tens of percent through the burn happens on every vehicle, and the notch must cover it or be scheduled.
:::

::: check
What is the resonant magnification of a mode with $\zeta = 0.005$, as a plain number and in decibels? How much does raising the damping to 0.02 (with added damping treatment) cut the peak?
:::

::: answer
The peak is $1/(2\zeta)$ times the slow-push gain: $1/0.01 = 100$, or 40 dB.

At $\zeta = 0.02$ it is $1/0.04 = 25$, or 28 dB. That is a 12 dB cut — as much as a fairly deep notch — with no phase cost at all. Damping is expensive to add, so filters do most of the work, but where it can be added it is the better answer.
:::

::: check
A gyro is mounted exactly at mid-body of a uniform free-free vehicle. Which of the first two bending modes does it see? What does that imply for the sign of the modal gain if the gyro is moved slightly?
:::

::: answer
The first mode is symmetric, with zero slope at mid-body, so the gyro sees none of it: $k_1 = 0$. The second mode is antisymmetric, with a node at mid-body and a local peak of slope there ($5.40/L$ per unit end movement; only the ends tilt more, at $7.86/L$). So the gyro sees the second mode strongly.

Move the gyro slightly aft and it sees a little first-mode slope of one sign; slightly forward, the *opposite* sign. So $k_1$ changes sign across the null. Mid-body mounting is excellent for the first mode and poor for the second, and the sign of $k_1$ is very sensitive to exactly where the gyro sits.
:::

::: check
A notch with $\zeta_z = 0.04$ and $\zeta_p = 0.4$ is centered on a 9 Hz mode. What is its depth, and what phase lag does it add at a 1.5 Hz rigid-body crossover?
:::

::: answer
**Depth.** $\zeta_z/\zeta_p = 0.1$, so $20\log_{10}(0.1) = -20\ \mathrm{dB}$.

**Lag.** $-2(\zeta_p - \zeta_z)\,\omega/\omega_q = -2 \times 0.36 \times 1.5/9 = -0.12\ \mathrm{rad}$, which is $-6.9^\circ$. (The ratio $\omega/\omega_q$ is the same in hertz as in radians per second.)

A six-to-one gap keeps the cost comfortably under $10^\circ$.
:::

::: check
In the worked example, the mode with $k_1 = +5 \times 10^{-4}$ was unstable. Would the loop with $k_1 = -5 \times 10^{-4}$ (gyro on the other side of the slope null) have been unstable without the notch? Why should you not rely on the answer?
:::

::: answer
With the sign reversed, the peak is still $+8.8\ \mathrm{dB}$, but its phase swing is shifted by $180^\circ$. The phase at the peak is near $+77^\circ$ instead of $-111^\circ$. The resonance's loop on the Nyquist plot swings away from $-1$ instead of around it, and the closed loop is in fact stable. The mode is *phase-stable* by the accident of where the sensor sits.

Do not rely on it. That phase depends on the actuator's lag at 12 Hz, on filters and delays, on the gyro's position relative to a slope null that moves as propellant drains, and on the predicted mode shape. Any of these can swing the resonance back onto $-1$. Gain stabilization removes the dependence on all of them, which is why it is preferred whenever the mode is far enough above crossover.
:::

## Summary

| Symbol or fact | Meaning or value |
| --- | --- |
| $EI\,w'''' + \mu\ddot w = 0$ | Euler–Bernoulli beam; free-free ends have $\phi'' = \phi''' = 0$ |
| $\cosh\beta L\cos\beta L = 1$ | free-free condition; $\beta_n L = 4.730, 7.853, 10.996$ |
| $\omega_n = (\beta_n L)^2\sqrt{EI/(\mu L^4)}$ | $(\beta_n L)^2 = 22.37, 61.67, 120.9$; ratios $1 : 2.76 : 5.40$ |
| First mode shape | nodes at $0.224L$ and $0.776L$; slope zero at mid-body, largest at the ends |
| $\ddot\eta_n + 2\zeta_n\omega_n\dot\eta_n + \omega_n^2\eta_n = \phi_n(x_T)T\delta/M_n$ | modal equation; $\zeta_n \approx 0.005$; $M_1 = m/4$ |
| $\dot\theta_{\text{meas}} = \dot\theta + \sum\phi_n'(x_g)\dot\eta_n$ | a gyro senses the local slope rate |
| $k_n = \phi_n'(x_g)\phi_n(x_T)T/(M_n\omega_n^2)$ | modal gain; its sign is set by the gyro's position |
| Resonant peak | $1/(2\zeta) = 100$, or 40 dB, for $\zeta = 0.005$ |
| Notch $N(s)$ | depth $20\log_{10}(\zeta_z/\zeta_p)$; lag $\approx -2(\zeta_p - \zeta_z)\omega/\omega_q$ at crossover |
| Example | 12 Hz mode, 2 Hz loop: +8.8 dB peak, unstable; 20 dB notch gives −11 dB for a 9° phase cost |

The next lesson turns to the other lightly damped thing aboard: the propellant itself. Its sloshing sits not six times above the crossover but right on top of it.

::: context resonance Pushing a swing at the right moment
Push a playground swing once and it rocks gently. Push it at exactly the top of every swing and it goes higher and higher, because each push adds energy at the moment it helps most. Pushes at the wrong rhythm cancel out.

How high it finally gets depends on the **damping** — the friction that drains energy away each cycle. For a lightly damped system pushed at its own rhythm, the motion ends up $1/(2\zeta)$ times the motion from the same push held steady. A launch vehicle's airframe, with $\zeta$ around $0.005$, gives a factor of $100$.
:::

::: context tube-stiffness Why a tube is stiff
Bend a sheet of paper and it flops. Roll it into a tube and it becomes surprisingly stiff. Stiffness against bending depends on how far the material sits from the center line, and it grows with the *square* of that distance. So material far out on the rim counts for much more than material near the middle.

For a thin tube of radius $r$ and wall thickness $t$, the second moment of area is $I = \pi r^3 t$. That is why rockets, bicycle frames and bones are all hollow tubes: the most stiffness for the least mass.
:::

::: context free-free-shape The first free-free bending mode
A beam floating free, like a rocket in flight, drawn to scale. The ends swing one way (a unit of movement) and the middle swings $0.608$ units the other way. The two nodes, where nothing moves, sit at $0.224L$ and $0.776L$. A gyro at the middle sees zero slope; a gyro near an end sees the most.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="320" y2="80" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <polyline points="40.0,40.0 45.0,43.3 50.0,46.6 55.0,50.0 60.0,53.3 65.0,56.5 70.0,59.8 75.0,63.1 80.0,66.3 85.0,69.4 90.0,72.5 95.0,75.5 100.0,78.4 105.0,81.3 110.0,84.0 115.0,86.6 120.0,89.0 125.0,91.3 130.0,93.5 135.0,95.5 140.0,97.3 145.0,98.9 150.0,100.3 155.0,101.5 160.0,102.5 165.0,103.3 170.0,103.9 175.0,104.2 180.0,104.3 185.0,104.2 190.0,103.9 195.0,103.3 200.0,102.5 205.0,101.5 210.0,100.3 215.0,98.9 220.0,97.3 225.0,95.5 230.0,93.5 235.0,91.3 240.0,89.0 245.0,86.6 250.0,84.0 255.0,81.3 260.0,78.4 265.0,75.5 270.0,72.5 275.0,69.4 280.0,66.3 285.0,63.1 290.0,59.8 295.0,56.5 300.0,53.3 305.0,50.0 310.0,46.6 315.0,43.3 320.0,40.0" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="102.8" cy="80" r="4.5" fill="#b4232c"/>
  <circle cx="257.2" cy="80" r="4.5" fill="#b4232c"/>
  <text x="102.8" y="72" font-size="11" text-anchor="middle" fill="#b4232c">node 0.224L</text>
  <text x="257.2" y="72" font-size="11" text-anchor="middle" fill="#b4232c">node 0.776L</text>
  <line x1="150" y1="104.3" x2="210" y2="104.3" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">middle: −0.608, slope zero</text>
  <text x="40" y="30" font-size="11" text-anchor="start" fill="#1f2a44">end: +1</text>
  <text x="320" y="30" font-size="11" text-anchor="end" fill="#1f2a44">end: +1</text>
  <text x="180" y="144" font-size="11" text-anchor="middle" fill="#6c7a93">dashed: the straight, unbent body</text>
</svg>
```
:::

::: context modes-apart Modes that keep to themselves
A piano string playing a chord of its own overtones still behaves like separate strings, one per note: energy put into one overtone stays in that overtone. Beam modes are the same. Mathematically they are **orthogonal** — the mass-weighted product of two different mode shapes, added up along the beam, is zero.

That is what lets one hard problem (a whole bending beam) become many easy ones (one spring-and-damper per mode). In practice control engineers keep only the first few modes, because the higher ones are small by the time the sensors see them.
:::

::: context decibels Decibels in one line
A decibel figure is $20\log_{10}$ of a gain. So $\times 10$ is $+20\ \mathrm{dB}$, $\times 100$ is $+40\ \mathrm{dB}$, $\times 2$ is about $+6\ \mathrm{dB}$, and $\times 0.1$ is $-20\ \mathrm{dB}$. The handy part is that multiplying gains becomes adding decibels, which is why the worked example could build the $+8.8\ \mathrm{dB}$ peak by adding up pieces. And 0 dB means a gain of exactly $1$ — the line a loop gain must not cross with the wrong phase.
:::

::: context needle-plot A needle on the Bode plot
The loop gain of the worked example, computed from its transfer function, from 0.1 to 30 Hz. The smooth rigid-body curve crosses 0 dB near 2 Hz and falls away. Then the 12 Hz bending mode stabs up through 0 dB to $+8.8\ \mathrm{dB}$ — a spike only a few tenths of a hertz wide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="95" x2="340" y2="95" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="5,4"/>
  <text x="344" y="99" font-size="11" fill="#b4232c" text-anchor="end" dy="-6">0 dB</text>
  <line x1="50" y1="178" x2="340" y2="178" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="14" x2="50" y2="178" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline points="50.0,38.8 51.8,39.2 53.6,39.5 55.5,39.8 57.3,40.2 59.1,40.6 60.9,41.0 62.8,41.4 64.6,41.8 66.4,42.2 68.2,42.7 70.1,43.2 71.9,43.7 73.7,44.2 75.5,44.8 77.4,45.3 79.2,45.9 81.0,46.5 82.8,47.1 84.7,47.7 86.5,48.3 88.3,49.0 90.1,49.7 91.9,50.3 93.8,51.0 95.6,51.8 97.4,52.5 99.2,53.2 101.1,54.0 102.9,54.7 104.7,55.5 106.5,56.2 108.4,57.0 110.2,57.8 112.0,58.6 113.8,59.4 115.7,60.2 117.5,61.0 119.3,61.8 121.1,62.6 123.0,63.4 124.8,64.2 126.6,65.0 128.4,65.8 130.3,66.6 132.1,67.5 133.9,68.3 135.7,69.1 137.5,69.8 139.4,70.6 141.2,71.4 143.0,72.2 144.8,73.0 146.7,73.7 148.5,74.5 150.3,75.3 152.1,76.0 154.0,76.8 155.8,77.5 157.6,78.2 159.4,79.0 161.3,79.7 163.1,80.4 164.9,81.1 166.7,81.8 168.6,82.5 170.4,83.2 172.2,83.8 174.0,84.5 175.8,85.2 177.7,85.9 179.5,86.5 181.3,87.2 183.1,87.8 185.0,88.5 186.8,89.1 188.6,89.8 190.4,90.4 192.3,91.0 194.1,91.6 195.9,92.3 197.7,92.9 199.6,93.5 201.4,94.1 203.2,94.7 205.0,95.4 206.9,96.0 208.7,96.6 210.5,97.2 212.3,97.8 214.2,98.4 216.0,99.0 217.8,99.6 219.6,100.2 221.4,100.8 223.3,101.5 225.1,102.1 226.9,102.7 228.7,103.3 230.6,103.9 232.4,104.5 234.2,105.2 236.0,105.8 237.9,106.5 239.7,107.1 241.5,107.8 243.3,108.4 245.2,109.1 247.0,109.8 248.8,110.5 250.6,111.2 252.5,112.0 254.3,112.7 256.1,113.5 257.9,114.4 259.7,115.2 261.6,116.1 263.4,117.1 265.2,118.1 267.0,119.1 268.9,120.3 270.7,121.6 272.5,122.9 274.3,124.5 276.2,126.2 278.0,128.3 279.8,130.8 281.6,134.1 283.5,139.0 285.3,147.9 287.1,176.0 288.9,140.0 289.0,139.4 289.1,138.5 289.1,137.7 289.2,136.9 289.3,136.2 289.4,135.4 289.5,134.6 289.5,133.9 289.6,133.2 289.7,132.4 289.8,131.7 289.8,131.0 289.9,130.3 290.0,129.6 290.1,128.9 290.1,128.2 290.2,127.5 290.3,126.8 290.4,126.1 290.4,125.5 290.5,124.8 290.6,124.1 290.7,123.4 290.7,122.7 290.8,122.6 290.8,122.0 290.9,121.3 291.0,120.6 291.0,119.8 291.1,119.1 291.2,118.4 291.3,117.6 291.3,116.8 291.4,116.1 291.5,115.3 291.6,114.5 291.6,113.6 291.7,112.8 291.8,111.9 291.9,111.0 291.9,110.1 292.0,109.2 292.1,108.2 292.2,107.2 292.2,106.1 292.3,105.0 292.4,103.8 292.4,102.6 292.5,101.3 292.6,100.1 292.6,99.9 292.7,98.5 292.7,96.9 292.8,95.3 292.9,93.5 292.9,91.6 293.0,89.5 293.1,87.3 293.2,85.0 293.2,82.7 293.3,80.7 293.4,79.5 293.4,79.3 293.5,80.3 293.6,82.0 293.7,84.1 293.7,86.1 293.8,88.0 293.9,89.8 293.9,91.5 294.0,93.0 294.1,94.4 294.2,95.7 294.2,96.8 294.3,97.9 294.4,98.9 294.4,99.4 294.4,99.9 294.5,100.7 294.6,101.6 294.6,102.3 294.7,103.1 294.8,103.8 294.9,104.4 294.9,105.1 295.0,105.7 295.1,106.2 295.1,106.8 295.2,107.3 295.3,107.8 295.3,108.3 295.4,108.7 295.5,109.2 295.5,109.6 295.6,110.0 295.7,110.4 295.7,110.8 295.8,111.2 295.9,111.5 295.9,111.9 296.0,112.2 296.1,112.5 296.2,112.9 296.2,113.2 296.2,113.2 296.3,113.5 296.4,113.8 296.4,114.1 296.5,114.3 296.6,114.6 296.6,114.9 296.7,115.1 296.8,115.4 296.8,115.6 296.9,115.9 297.0,116.1 297.0,116.4 297.1,116.6 297.2,116.8 297.2,117.0 297.3,117.3 297.4,117.5 297.4,117.7 297.5,117.9 298.1,119.5 299.9,123.7 301.7,126.9 303.5,129.7 305.3,132.1 307.2,134.3 309.0,136.4 310.8,138.4 312.6,140.4 314.5,142.3 316.3,144.2 318.1,146.0 319.9,147.8 321.8,149.6 323.6,151.4 325.4,153.2 327.2,155.0 329.1,156.7 330.9,158.5 332.7,160.2 334.5,162.0 336.4,163.7 338.2,165.4 340.0,167.2" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="192">0.1</text><text x="167.1" y="192">1</text><text x="202.3" y="192">2</text><text x="293.4" y="192">12</text><text x="336" y="192">30 Hz</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="46" y="27">+40</text><text x="46" y="99">0</text><text x="46" y="171">−40</text>
  </g>
</svg>
```
:::

::: context notch-shape What a notch looks like
The magnitude of the 12 Hz notch with $\zeta_z = 0.05$ and $\zeta_p = 0.5$, drawn from its formula. It is flat at 0 dB far from the center and dips to $-20\ \mathrm{dB}$ at 12 Hz. At the 2 Hz crossover it barely touches the gain — its cost there is phase, about $9^\circ$, which a magnitude plot does not show.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="40" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="40" y1="145" x2="340" y2="145" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline points="40.0,30.2 42.0,30.2 44.0,30.2 46.0,30.2 48.1,30.2 50.1,30.2 52.1,30.2 54.1,30.2 56.1,30.2 58.1,30.3 60.1,30.3 62.1,30.3 64.2,30.3 66.2,30.3 68.2,30.4 70.2,30.4 72.2,30.4 74.2,30.4 76.2,30.5 78.3,30.5 80.3,30.5 82.3,30.6 84.3,30.6 86.3,30.6 88.3,30.7 90.3,30.7 92.3,30.8 94.4,30.8 96.4,30.9 98.4,31.0 100.4,31.0 102.4,31.1 104.4,31.2 106.4,31.2 108.5,31.3 110.5,31.4 112.5,31.5 114.5,31.6 116.5,31.7 118.5,31.9 120.5,32.0 122.6,32.1 124.6,32.3 126.6,32.5 128.6,32.7 130.6,32.9 132.6,33.1 134.6,33.3 136.6,33.6 138.7,33.8 140.7,34.1 142.7,34.5 144.7,34.8 146.7,35.2 148.7,35.7 150.7,36.1 152.8,36.7 154.8,37.3 156.8,37.9 158.8,38.6 160.8,39.4 162.8,40.3 164.8,41.3 166.8,42.4 168.9,43.7 170.9,45.1 172.9,46.7 174.9,48.5 176.9,50.6 178.9,52.9 180.9,55.7 183.0,58.8 185.0,62.5 187.0,66.8 189.0,71.9 190.0,74.8 190.4,75.9 190.7,77.0 191.0,77.9 191.1,78.2 191.4,79.4 191.8,80.6 192.1,81.9 192.5,83.2 192.8,84.5 193.0,85.2 193.2,85.9 193.5,87.3 193.9,88.8 194.2,90.3 194.6,91.9 194.9,93.5 195.0,94.2 195.2,95.2 195.6,96.9 195.9,98.6 196.2,100.4 196.6,102.3 196.9,104.2 197.0,105.2 197.2,106.2 197.5,108.1 197.9,110.2 198.2,112.2 198.5,114.3 198.8,116.4 199.1,118.0 199.1,118.5 199.4,120.5 199.8,122.4 200.1,124.2 200.4,125.9 200.7,127.3 201.0,128.5 201.1,128.7 201.3,129.3 201.6,129.8 201.9,130.0 202.2,129.8 202.5,129.2 202.8,128.3 203.1,127.2 203.1,127.2 203.4,125.8 203.7,124.2 204.0,122.5 204.3,120.7 204.6,118.8 204.9,117.0 205.1,115.4 205.1,115.1 205.4,113.2 205.7,111.4 206.0,109.5 206.3,107.8 206.6,106.0 206.9,104.3 207.1,102.8 207.1,102.7 207.4,101.1 207.7,99.6 208.0,98.1 208.2,96.6 208.5,95.3 208.8,93.9 209.1,92.6 209.1,92.2 209.3,91.3 209.6,90.1 209.9,88.9 210.1,87.7 210.4,86.6 210.7,85.5 210.9,84.5 211.1,83.6 211.2,83.5 211.4,82.5 211.7,81.5 212.0,80.6 212.2,79.7 212.5,78.8 212.7,78.0 213.0,77.1 213.2,76.6 213.2,76.3 213.5,75.5 213.8,74.8 215.2,70.8 217.2,65.9 219.2,61.7 221.2,58.2 223.2,55.1 225.2,52.4 227.2,50.1 229.3,48.1 231.3,46.3 233.3,44.8 235.3,43.4 237.3,42.2 239.3,41.1 241.3,40.1 243.4,39.3 245.4,38.5 247.4,37.8 249.4,37.1 251.4,36.6 253.4,36.0 255.4,35.6 257.4,35.1 259.5,34.8 261.5,34.4 263.5,34.1 265.5,33.8 267.5,33.5 269.5,33.3 271.5,33.0 273.6,32.8 275.6,32.6 277.6,32.4 279.6,32.3 281.6,32.1 283.6,32.0 285.6,31.8 287.7,31.7 289.7,31.6 291.7,31.5 293.7,31.4 295.7,31.3 297.7,31.2 299.7,31.1 301.7,31.1 303.8,31.0 305.8,30.9 307.8,30.9 309.8,30.8 311.8,30.8 313.8,30.7 315.8,30.7 317.9,30.6 319.9,30.6 321.9,30.6 323.9,30.5 325.9,30.5 327.9,30.5 329.9,30.4 331.9,30.4 334.0,30.4 336.0,30.4 338.0,30.3 340.0,30.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="85.2" y1="20" x2="85.2" y2="145" stroke="#f2b880" stroke-width="2"/>
  <text x="89" y="52" font-size="11" fill="#1f2a44">2 Hz crossover</text>
  <g font-size="11" fill="#1f2a44">
    <text x="36" y="34" text-anchor="end">0</text><text x="36" y="134" text-anchor="end">−20</text>
    <text x="40" y="160" text-anchor="middle">1</text><text x="190" y="160" text-anchor="middle">10</text><text x="206" y="160" text-anchor="start">12</text><text x="336" y="160" text-anchor="end">100 Hz</text>
  </g>
</svg>
```
:::

::: context phase-stab The other answer
Phase stabilization lets a mode's gain rise above 0 dB and instead makes sure its phase keeps the Nyquist plot on the safe side of $-1$. You saw an accidental version in the last check question, where flipping the sign of $k_1$ made the loop stable. Doing it on purpose means designing the sensor position, the filters and the delays so the mode's phase is known and correct across all its uncertainty. It is harder and less forgiving than gain stabilization, and lesson 11 shows when you have no choice.
:::

::: context ground-test Shaking a rocket on the ground
Before flight, engineers hang or stand the real vehicle (or a full-size test article) in a test stand, shake it with electric shakers across a range of frequencies, and measure how it rings. This ground vibration test gives the mode frequencies, shapes and damping that the flight filters are designed on. NASA built a special tower at Marshall Space Flight Center in the 1960s to do this to a whole Saturn V. The test is done on the ground, with the vehicle supported and tanks filled with stand-in liquids, so its results still have to be corrected to free flight — one source of the ±10–20 % uncertainty.
:::
