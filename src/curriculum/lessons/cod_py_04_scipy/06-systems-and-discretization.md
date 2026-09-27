---
id: l06-systems-and-discretization
title: Systems and discretization: bode, tf2ss and cont2discrete
minutes: 22
covers:
  - 'scipy.signal: butter, filtfilt vs lfilter, welch, bode, tf2ss, cont2discrete'
---

Think of an old shower with a long pipe. You turn the knob toward hot, and nothing happens for a few seconds, because the hot water is still on its way. So you turn it further. Then the scalding water arrives, you yank the knob toward cold, and a few seconds later you are freezing. Your corrections were fine. Their *timing* was not. The delay in the pipe turned sensible corrections into a swing that got worse each time.

Every control loop on a rocket lives with the same danger. A sensor measures, a computer thinks, an actuator moves — and each step takes a little time. Engineers measure how much extra delay a loop can take before it starts to swing, and they call that safety margin the **phase margin**. This lesson teaches how to compute it in SciPy, why delays eat it, and why the speed of the flight computer's clock is part of the control design.

The tools are the second half of `scipy.signal`. **`bode`** shows how a system responds at each frequency. **`tf2ss`** turns a transfer function into the state-space form that the linear-algebra tools of lesson 4 expect. And **`cont2discrete`** converts a design made in continuous time into the step-by-step form a computer actually runs. The last lesson ended with a filter's delay; this one shows what that delay costs.

## Transfer functions: a system as a ratio of polynomials

In the filters lesson you described a filter by what it does to a steady wave at each frequency: how much it shrinks the wave, and how late the wave comes out. A **transfer function** packs that whole description into one formula. It is written with a variable $s$, which you can read as "the rate of change" operator: multiplying by $s$ means taking a derivative, dividing by $s$ means integrating. (The formal name for this bookkeeping is the **[[Laplace transform|laplace]]**.)

Take a spacecraft rotating about one axis. Torque changes its spin rate, and spin rate changes its angle. So the angle is the torque integrated twice, divided by the moment of inertia $J$:

$$
G(s) = \frac{\theta(s)}{\tau(s)} = \frac{1}{J s^2}.
$$

Read $\theta$ as "theta", the angle, and $\tau$ as "tau", the torque. SciPy stores a transfer function as two lists of **polynomial coefficients**, highest power first: the numerator (top) and the denominator (bottom). With $J = 1$, the rigid body is `num = [1]`, `den = [1, 0, 0]` — that is $1 \cdot s^2 + 0 \cdot s + 0$.

To learn what the system does to a wave of angular frequency $\omega$ (in rad/s), put $s = j\omega$, where $j$ is the imaginary unit ($j^2 = -1$). The result is a complex number. Its size is the **gain** at that frequency; its angle is the **phase**.

## Bode plots, crossover and phase margin

A **Bode plot** draws the gain (in decibels) and the phase (in degrees) against frequency, on a logarithmic frequency axis. `signal.bode` computes both. Its frequencies are in **rad/s**, not hertz.

For a feedback loop, you draw the Bode plot of the **loop transfer function** $L(s)$: everything a signal passes through on one trip around the loop, here controller times plant. Two readings on that plot matter most.

- The **crossover frequency** $\omega_c$ is where the loop gain equals $1$, which is $0\,\mathrm{dB}$. Below it, the loop acts strongly on errors. Above it, the loop hardly reacts.
- The **phase margin** is how far the phase at crossover sits above $-180°$:

$$
\text{PM} = 180° + \angle L(j\omega_c).
$$

Read $\angle L$ as "the angle of L". Why $-180°$? A feedback loop subtracts the measurement from the goal. That subtraction already flips the sign once. If the loop's own lag adds another half-turn, $180°$, at a frequency where the gain is $1$, the correction comes back pushing in exactly the direction of the error, at full strength. The loop feeds itself: a steady **[[oscillation|oscillation]]** that grows the moment the gain edges above $1$. Phase margin is the extra lag you could add before that happens. Designers usually want $30°$ to $60°$.

Here is an attitude loop: a controller that pushes back against both the angle error and its rate of change (a **PD controller**, for "proportional plus derivative"), with a small smoothing filter, driving the rigid body. The loop transfer function is

$$
L(s) = \frac{8s + 16}{s^2\,(0.02s + 1)}.
$$

```python
import numpy as np
from scipy import signal
from scipy.optimize import brentq

num = [8.0, 16.0]
den = np.polymul([1.0, 0.0, 0.0], [0.02, 1.0])   # s^2 (0.02 s + 1)
L = signal.TransferFunction(num, den)

def gain_db(w):
    w_out, mag_db, phase_deg = signal.bode(L, [w])
    return mag_db[0]

wc = brentq(gain_db, 1.0, 100.0)                  # where the gain is 0 dB
phase = signal.bode(L, [wc])[2][0]
print(f"crossover {wc:.2f} rad/s")
print(f"phase {phase:.1f} deg, phase margin {180 + phase:.1f} deg")
# crossover 8.13 rad/s
# phase -113.1 deg, phase margin 66.9 deg
```

Notice the crossover is a root-finding problem, and `brentq` from lesson 1 solves it, because the gain drops through $0\,\mathrm{dB}$ between $1$ and $100\,\mathrm{rad/s}$. The loop has a healthy **[[phase margin|bode-picture]]** of $66.9°$.

::: example Checking the phase margin by hand
Confirm the $-113.1°$ at $\omega_c = 8.13\,\mathrm{rad/s}$ piece by piece. The phase of a product is the sum of the phases of its pieces.

**The double integrator** $1/s^2$. Each $1/s$ contributes $-90°$, so together $-180°$.

**The numerator** $8s + 16 = 16\,(0.5s + 1)$. A factor $(as + 1)$ at $s = j\omega$ has phase $\arctan(a\omega)$. Here $0.5 \times 8.13 = 4.065$, and $\arctan(4.065) \approx 76.2°$. That is a **lead** — it pushes the phase up.

**The smoothing filter** $1/(0.02s + 1)$. Its phase is $-\arctan(0.02 \times 8.13) = -\arctan(0.163) \approx -9.2°$.

**Add them.** $-180° + 76.2° - 9.2° = -113.0°$, matching SciPy's $-113.1°$ to rounding. The phase margin is $180° - 113.1° = 66.9°$.

**Sanity check.** Without the derivative term, a bare rigid body sits at exactly $-180°$ at every frequency: zero margin. The lead from the $8s$ term is what makes the loop stable, which is why every attitude controller has some rate feedback.
:::

## Transport delay eats phase

A pure **transport delay** of $T$ seconds passes a signal through unchanged, only later — like the water in the shower pipe. Its transfer function is $e^{-sT}$. At $s = j\omega$, its size is $|e^{-j\omega T}| = 1$: no change in gain at all. Its phase is $-\omega T$ radians.

So a delay does nothing to the gain curve and does not move the crossover. It only bends the phase curve down, and more at higher frequency. At the crossover, its lag comes straight off the phase margin:

$$
\text{PM}_{\text{with delay}} = \text{PM} - \omega_c T \times \frac{180°}{\pi}.
$$

::: key
Delay adds phase lag linearly in frequency, $-\omega T$ radians, with no gain change. At the crossover frequency that subtracts directly from phase margin; $40\,\mathrm{ms}$ at $10\,\mathrm{rad/s}$ costs about $23°$ ($0.4\,\mathrm{rad} \approx 22.9°$).
:::

::: example How much delay can the attitude loop take?
Our loop has $\omega_c = 8.13\,\mathrm{rad/s}$ and $66.9°$ of margin. Sensor processing, a data bus and computation add $T = 40\,\mathrm{ms}$ of **[[latency|latency]]**. What is left?

**Lag at crossover in radians.** $\omega_c T = 8.13 \times 0.040 = 0.325\,\mathrm{rad}$.

**In degrees.** $0.325 \times 180 / \pi \approx 18.6°$.

**Remaining margin.** $66.9° - 18.6° = 48.3°$. Still comfortable.

**How much delay would take it all?** Set the lag equal to the whole margin: $T_{\max} = \dfrac{66.9° \times \pi / 180°}{8.13} = \dfrac{1.168}{8.13} \approx 0.144\,\mathrm{s}$. This is the loop's **delay margin**, about $144\,\mathrm{ms}$.

**Sanity check.** A loop that crosses over faster would lose more degrees for the same delay, because the lag is $\omega T$. That is why fast loops, like engine gimbal control, need very low latency.
:::

## tf2ss: from a transfer function to state space

Lesson 4 did everything with matrices: $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, with an output $y = \mathbf{C}\mathbf{x} + \mathbf{D}u$. That is **state-space form**, and `expm`, the Riccati solvers and most simulators want it. `signal.tf2ss(num, den)` converts a transfer function into the four matrices.

Take a structural mode with natural frequency $\omega_n = 10\,\mathrm{rad/s}$ and damping ratio $\zeta = 0.1$:

$$
G(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2} = \frac{100}{s^2 + 2s + 100}.
$$

```python
from scipy import signal

A, B, C, D = signal.tf2ss([100.0], [1.0, 2.0, 100.0])
print(A)
print(B.ravel(), C.ravel(), D.ravel())
# [[  -2. -100.]
#  [   1.    0.]]
# [1. 0.] [  0. 100.] [0.]
```

Look closely at $\mathbf{A}$. Its first row is the denominator's coefficients, negated: $-2$ and $-100$. SciPy builds a particular arrangement called the **[[controllable canonical form|canonical-form]]**, where the states are "the highest derivative first". Here the first state is the rate and the second is a scaled position; $\mathbf{C} = [0,\ 100]$ reads position times $100$ as the output.

::: warning tf2ss picks its own states
The state vector from `tf2ss` is not your physical (position, velocity) in that order, and it may be scaled. Its input-output behavior is identical to the transfer function, so it is fine for simulation and frequency response. But weights in an LQR $\mathbf{Q}$ matrix, or initial conditions, must be written for *these* states. When the physical meaning of each state matters, write $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$, $\mathbf{D}$ yourself from the equations of motion.
:::

## cont2discrete: from continuous design to computer code

A flight computer works in ticks. Every $T$ seconds it reads the sensors, computes a command, and sends it out through a **[[digital-to-analog converter|dac]]**, which holds that command steady until the next tick. `signal.cont2discrete(system, dt, method=...)` converts a continuous model into the discrete form $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d u_k$ (or a discrete transfer function in $z$, where $z$ means "one step later"). The `method` says what you assume happens between ticks.

### zoh: the input is held

The default, `method="zoh"`, is the **zero-order hold**. It assumes the input stays constant over each sample period — exactly what a digital controller driving a DAC does. For the plant, that assumption is not an approximation: it is what really happens, and the result is exact at the sample instants. It is the same answer as lesson 4's `expm` block trick.

```python
from scipy import signal

num_d, den_d, dt = signal.cont2discrete(([1.0], [1.0, 0.0, 0.0]), 0.1, method="zoh")
print(num_d.ravel(), den_d, dt)
# [0.    0.005 0.005] [ 1. -2.  1.] 0.1
```

The rigid body $1/s^2$ at $T = 0.1\,\mathrm{s}$ becomes $\dfrac{0.005z + 0.005}{z^2 - 2z + 1}$. Note the three things that come back: numerator, denominator and the time step. The numerator is a 2-D array, so flatten it with `.ravel()` before using it as a plain list.

### tustin: a smooth map of the whole frequency axis

The other workhorse is `method="bilinear"`, known as **Tustin's method**. Instead of assuming anything about the input, it replaces each $s$ with

$$
s \approx \frac{2}{T}\,\frac{z - 1}{z + 1}.
$$

This maps the continuous frequency axis onto the discrete one smoothly and without folding — the technical word is **conformally** (it keeps small shapes and angles intact). A stable design stays stable, and the shape of the frequency response survives. It is the usual choice for turning a continuous *controller* or filter into code, because a controller's input is a sampled sensor reading, not a held staircase.

The price is **[[frequency warping|warping]]**: the whole infinite continuous axis has to fit below the Nyquist frequency, so it gets squeezed. A continuous frequency $\omega_a$ lands at the discrete frequency

$$
\omega_d = \frac{2}{T}\arctan\!\left(\frac{\omega_a T}{2}\right).
$$

Low frequencies barely move; frequencies near Nyquist move a lot. The cure is **prewarping**: stretch the design first so one chosen frequency — a notch, a crossover — lands exactly where it should. Near that prewarp frequency, Tustin preserves the frequency response shape best.

::: key
`cont2discrete` with zoh models a zero-order hold: the input is held constant over each sample period, which is exactly what a digital controller driving a DAC does. Tustin (bilinear) instead maps the s-plane to the z-plane conformally and preserves frequency response shape better near the prewarp frequency.
:::

::: example A notch filter that misses its target
A notch filter should remove an $8\,\mathrm{Hz}$ structural mode from an attitude loop that runs at $50\,\mathrm{Hz}$ ($T = 0.02\,\mathrm{s}$). Where does the notch land after Tustin?

**Predict with the warping formula.** $\omega_a = 2\pi \times 8 \approx 50.27\,\mathrm{rad/s}$. Then $\omega_a T/2 = 50.27 \times 0.01 = 0.5027$, and $\arctan(0.5027) \approx 0.4658$. So $\omega_d = (2/0.02) \times 0.4658 = 46.58\,\mathrm{rad/s}$, which is $46.58 / 2\pi \approx 7.41\,\mathrm{Hz}$.

**Check with SciPy, and fix it by prewarping.** SciPy has no prewarp argument, but the prewarped map is Tustin with $T$ replaced by $T' = 2\tan(\omega_0 T/2)/\omega_0$ inside the formula (the note below shows why). So pass $T'$ as the time step and keep using the result at the real rate.

```python
import numpy as np
from scipy import signal

w0 = 2 * np.pi * 8.0                               # notch, rad/s
num = [1.0, 0.0, w0**2]
den = [1.0, 2 * 0.3 * w0, w0**2]
fs, T = 50.0, 1 / 50.0

def notch_hz(nd, dd):
    f, H = signal.freqz(nd.ravel(), dd, worN=4096, fs=fs)
    return f[np.argmin(np.abs(H))]

nd, dd, _ = signal.cont2discrete((num, den), T, method="bilinear")
print(f"Tustin:    {notch_hz(nd, dd):.2f} Hz")
Tp = 2 * np.tan(w0 * T / 2) / w0                   # prewarped step
nd, dd, _ = signal.cont2discrete((num, den), Tp, method="bilinear")
print(f"prewarped: {notch_hz(nd, dd):.2f} Hz")
# Tustin:    7.42 Hz
# prewarped: 8.00 Hz
```

**Read the answer.** Plain Tustin puts the notch at about $7.4\,\mathrm{Hz}$ (the $0.01\,\mathrm{Hz}$ difference from $7.41$ is the plotting grid). A $0.6\,\mathrm{Hz}$ miss on a sharp notch can leave the mode almost untouched. Prewarping at $8\,\mathrm{Hz}$ puts it back exactly.

**Sanity check.** $8\,\mathrm{Hz}$ is about a third of the way to the $25\,\mathrm{Hz}$ Nyquist frequency — high enough that warping matters. A notch at $1\,\mathrm{Hz}$ would move by less than $0.01\,\mathrm{Hz}$.
:::

::: note Why the prewarp trick works
Prewarped Tustin replaces $s$ with $\dfrac{\omega_0}{\tan(\omega_0 T/2)}\,\dfrac{z-1}{z+1}$ instead of $\dfrac{2}{T}\,\dfrac{z-1}{z+1}$. Plug $z = e^{j\omega_0 T}$ into $\dfrac{z-1}{z+1}$: multiply top and bottom by $e^{-j\omega_0 T/2}$ to get $\dfrac{2j\sin(\omega_0 T/2)}{2\cos(\omega_0 T/2)} = j\tan(\omega_0 T/2)$. Times $\dfrac{\omega_0}{\tan(\omega_0 T/2)}$, that is exactly $j\omega_0$: the chosen frequency maps to itself. The two maps differ only in the constant in front. Setting $\dfrac{2}{T'} = \dfrac{\omega_0}{\tan(\omega_0 T/2)}$ gives $T' = \dfrac{2\tan(\omega_0 T/2)}{\omega_0}$, so plain Tustin with $T'$ is prewarped Tustin.
:::

## The sample rate eats phase

Here is the effect that makes the sample rate a control-design decision. A zero-order hold turns a smooth command into a **staircase**. Draw a smooth line through the middle of each step and it sits **[[half a sample late|zoh-delay]]**. At frequencies well below the sample rate, a hold behaves like a pure delay of $T/2$.

You already know what a delay costs: $\omega_c \cdot T/2$ radians at crossover. Write $T = 1/f_s$ and $\omega_c = 2\pi f_c$, and convert to degrees:

$$
\text{lag} = \frac{\omega_c T}{2} \times \frac{180°}{\pi} = \frac{2\pi f_c}{2 f_s} \times \frac{180°}{\pi} = 180° \times \frac{f_c}{f_s}.
$$

A loop sampled $20$ times faster than its crossover loses $180°/20 = 9°$ to the hold alone. Sample only $5$ times faster and it loses $36°$. Real flight computers also take part of a sample to compute the command, which adds more delay on top.

::: example The attitude loop at two sample rates
Run our attitude loop on a computer at $f_s = 20\,\mathrm{Hz}$ and at $f_s = 200\,\mathrm{Hz}$. The plant gets `zoh` (its input really is held); the controller $\dfrac{8s + 16}{0.02s + 1}$ gets `bilinear`.

**Predict.** The crossover $8.13\,\mathrm{rad/s}$ is $f_c = 8.13 / 2\pi \approx 1.29\,\mathrm{Hz}$. At $20\,\mathrm{Hz}$ the lag is $180° \times 1.29 / 20 \approx 11.6°$, leaving about $66.9° - 11.6° = 55.3°$. At $200\,\mathrm{Hz}$ it is ten times smaller, about $1.2°$.

**Compute.** Build the discrete loop and find its crossover and margin, using $z = e^{j\omega T}$ in place of $s = j\omega$:

```python
import numpy as np
from scipy import signal
from scipy.optimize import brentq

plant = ([1.0], [1.0, 0.0, 0.0])                   # 1 / s^2
ctrl = ([8.0, 16.0], [0.02, 1.0])                  # (8 s + 16) / (0.02 s + 1)

def margin(fs, ctrl_method):
    T = 1 / fs
    pn, pd, _ = signal.cont2discrete(plant, T, method="zoh")
    cn, cd, _ = signal.cont2discrete(ctrl, T, method=ctrl_method)
    num = np.polymul(pn.ravel(), cn.ravel())
    den = np.polymul(pd, cd)
    def L(w):
        z = np.exp(1j * w * T)
        return np.polyval(num, z) / np.polyval(den, z)
    wc = brentq(lambda w: abs(L(w)) - 1, 1.0, 0.99 * np.pi / T)
    return wc, 180 + np.degrees(np.angle(L(wc)))

for fs in (20.0, 200.0):
    for m in ("bilinear", "zoh"):
        wc, pm = margin(fs, m)
        print(f"{fs:.0f} Hz, controller {m:8s}: crossover {wc:5.2f} rad/s, PM {pm:4.1f} deg")
# 20 Hz, controller bilinear: crossover  8.18 rad/s, PM 55.3 deg
# 20 Hz, controller zoh     : crossover 19.01 rad/s, PM 29.5 deg
# 200 Hz, controller bilinear: crossover  8.13 rad/s, PM 65.8 deg
# 200 Hz, controller zoh     : crossover  9.03 rad/s, PM 67.3 deg
```

**Read the answer.** With the Tustin controller, $200\,\mathrm{Hz}$ keeps $65.8°$, only $1.1°$ below the continuous design. At $20\,\mathrm{Hz}$ the margin falls to $55.3°$: the $11.6°$ the half-sample rule predicted.

**Sanity check.** The numbers match the rule of thumb to a tenth of a degree, which says the hold really is the main cost. The slower computer ran the same controller and lost a sixth of its margin.
:::

::: warning Match the method to the job
The two `zoh` controller rows show what happens when the method does not fit. Treating the controller's input as a held staircase distorts its derivative action; at $20\,\mathrm{Hz}$ the crossover more than doubles and the margin collapses to $29.5°$. Use `zoh` for the plant, whose input truly is held, and Tustin (prewarped when a frequency matters) for controllers and filters. And never treat discretization as exact: at a low sample rate, re-check the margin on the discrete loop, not the continuous one.
:::

## Check yourself

::: check
A loop has crossover at $\omega_c = 5\,\mathrm{rad/s}$ and $50°$ of phase margin. A new sensor adds $60\,\mathrm{ms}$ of delay. What is the new margin, and did the crossover frequency move?
:::

::: answer
The delay's lag at crossover is $\omega_c T = 5 \times 0.060 = 0.3\,\mathrm{rad}$, which is $0.3 \times 180/\pi \approx 17.2°$. The new margin is $50° - 17.2° \approx 32.8°$. The crossover does not move, because a pure delay has gain $1$ at every frequency; it only changes the phase.
:::

::: check
Find the phase of $L(s) = \dfrac{4(s + 1)}{s^2}$ at $\omega = 2\,\mathrm{rad/s}$. Is $2\,\mathrm{rad/s}$ its crossover? If not, find the crossover and the phase margin.
:::

::: answer
The $1/s^2$ contributes $-180°$. The factor $(s + 1)$ at $s = 2j$ contributes $\arctan(2) \approx 63.4°$. The constant $4$ adds no phase. Total: $-180° + 63.4° = -116.6°$.

The gain at $2\,\mathrm{rad/s}$ is $|L(2j)| = \dfrac{4\sqrt{1 + 2^2}}{2^2} = \sqrt{5} \approx 2.24$, not $1$, so this is not the crossover. Set the gain to $1$: $4\sqrt{1 + \omega^2} = \omega^2$. Square both sides: $16(1 + \omega^2) = \omega^4$, a quadratic in $\omega^2$ with positive root $\omega^2 = \dfrac{16 + \sqrt{256 + 64}}{2} \approx 16.94$, so $\omega_c \approx 4.12\,\mathrm{rad/s}$. There the phase is $-180° + \arctan(4.12) \approx -180° + 76.3° = -103.7°$, and the phase margin is about $76.3°$. Always find the crossover before reading the margin.
:::

::: check
What do `A`, `B`, `C`, `D` from `signal.tf2ss([1.0], [1.0, 3.0, 2.0])` look like, following the pattern in the lesson?
:::

::: answer
The first row of $\mathbf{A}$ is the denominator after the leading $1$, negated: $[-3,\ -2]$. The second row shifts a state down: $[1,\ 0]$. So $\mathbf{A} = \begin{bmatrix} -3 & -2 \\ 1 & 0 \end{bmatrix}$, $\mathbf{B} = [1,\ 0]^{\mathsf{T}}$, $\mathbf{C} = [0,\ 1]$ (the numerator is $1$), and $\mathbf{D} = [0]$. You can confirm with the code; the states are SciPy's canonical ones, not a physical position and velocity.
:::

::: check
A loop crosses over at $f_c = 2\,\mathrm{Hz}$. About how much phase does the zero-order hold cost at $f_s = 40\,\mathrm{Hz}$, and at $f_s = 400\,\mathrm{Hz}$?
:::

::: answer
The hold acts like a delay of $T/2$, costing $180° \times f_c / f_s$. At $40\,\mathrm{Hz}$: $180 \times 2/40 = 9°$. At $400\,\mathrm{Hz}$: $180 \times 2/400 = 0.9°$. Ten times the rate, a tenth of the lag. Computation time adds more on top of both.
:::

::: check
Where does a $20\,\mathrm{Hz}$ notch land after plain Tustin at $f_s = 100\,\mathrm{Hz}$?
:::

::: answer
$\omega_a = 2\pi \times 20 \approx 125.7\,\mathrm{rad/s}$ and $T = 0.01\,\mathrm{s}$. Then $\omega_a T/2 \approx 0.628$, $\arctan(0.628) \approx 0.561$, and $\omega_d = (2/0.01) \times 0.561 \approx 112.2\,\mathrm{rad/s}$, or $112.2 / 2\pi \approx 17.9\,\mathrm{Hz}$. The notch misses by about $2\,\mathrm{Hz}$, so you would prewarp at $20\,\mathrm{Hz}$.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Transfer function | Output over input, in $s$ | `TransferFunction(num, den)`, highest power first |
| `signal.bode` | Gain (dB) and phase (deg) | Frequencies in rad/s |
| Crossover $\omega_c$ | Loop gain $= 1$ ($0\,\mathrm{dB}$) | Find it with `brentq` |
| Phase margin | Lag you can still add | $\text{PM} = 180° + \angle L(j\omega_c)$ |
| Transport delay $e^{-sT}$ | Gain $1$, phase $-\omega T$ rad | $40\,\mathrm{ms}$ at $10\,\mathrm{rad/s}$ costs about $23°$ |
| `tf2ss` | $\mathbf{A}, \mathbf{B}, \mathbf{C}, \mathbf{D}$ | Canonical states, not physical ones |
| `cont2discrete(..., "zoh")` | Input held over each step | Exact for a plant behind a DAC |
| `cont2discrete(..., "bilinear")` | Tustin, $s \approx \frac{2}{T}\frac{z-1}{z+1}$ | Warps: $\omega_d = \frac{2}{T}\arctan(\omega_a T/2)$; prewarp to fix one frequency |
| Hold lag | Half-sample delay | $180° \times f_c / f_s$ |

The next lesson leaves the time and frequency domains for tables: how `scipy.interpolate` turns an aerodynamic database, measured on a grid of Mach numbers and angles, into smooth values a six-degree-of-freedom simulation can call thousands of times a second.

::: context laplace Where s comes from
The Laplace transform, named after the French mathematician Pierre-Simon Laplace, turns a function of time into a function of a new variable $s$. Its key property is that a derivative in time becomes multiplication by $s$. So a differential equation like $J\ddot{\theta} = \tau$ becomes plain algebra, $Js^2\theta(s) = \tau(s)$, and you can divide. Setting $s = j\omega$ reads off the steady response to a wave of frequency $\omega$.
:::

::: context oscillation Pushing a swing
Push a playground swing at the right moment in each cycle and it goes higher and higher, even with small pushes. The timing does the work. A loop at $-180°$ with gain $1$ is pushing its own error in time with the swing. With any gain above $1$ at that frequency, each lap around the loop is bigger than the last, and the oscillation grows until something saturates or breaks. With the gain below $1$ there, each lap is smaller and the wobble dies out.
:::

::: context bode-picture The margin on a Bode plot
Our attitude loop. The gain line (top) falls through $0\,\mathrm{dB}$ at the crossover, $8.13\,\mathrm{rad/s}$. Straight below, the phase line (bottom) sits at $-113.1°$. The red bar is the gap down to $-180°$: the phase margin. Frequencies run from $0.3$ to $300\,\mathrm{rad/s}$ on a log scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="55" x2="340" y2="55" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="59" font-size="11" text-anchor="end" fill="#6c7a93">0 dB</text>
  <polyline points="40.0,14.4 42.5,15.3 45.0,16.2 47.6,17.1 50.1,18.0 52.6,18.9 55.1,19.8 57.6,20.7 60.2,21.5 62.7,22.4 65.2,23.3 67.7,24.2 70.3,25.1 72.8,25.9 75.3,26.8 77.8,27.6 80.3,28.5 82.9,29.3 85.4,30.2 87.9,31.0 90.4,31.8 92.9,32.7 95.5,33.5 98.0,34.3 100.5,35.1 103.0,35.9 105.5,36.6 108.1,37.4 110.6,38.1 113.1,38.9 115.6,39.6 118.2,40.3 120.7,41.0 123.2,41.7 125.7,42.3 128.2,43.0 130.8,43.6 133.3,44.3 135.8,44.9 138.3,45.5 140.8,46.1 143.4,46.7 145.9,47.3 148.4,47.8 150.9,48.4 153.4,48.9 156.0,49.5 158.5,50.0 161.0,50.5 163.5,51.1 166.1,51.6 168.6,52.1 171.1,52.6 173.6,53.1 176.1,53.6 178.7,54.1 181.2,54.6 183.7,55.1 186.2,55.6 188.7,56.1 191.3,56.5 193.8,57.0 196.3,57.5 198.8,58.0 201.3,58.5 203.9,59.0 206.4,59.5 208.9,60.0 211.4,60.5 213.9,61.0 216.5,61.5 219.0,62.0 221.5,62.5 224.0,63.0 226.6,63.6 229.1,64.1 231.6,64.6 234.1,65.2 236.6,65.8 239.2,66.3 241.7,66.9 244.2,67.5 246.7,68.1 249.2,68.7 251.8,69.3 254.3,70.0 256.8,70.6 259.3,71.3 261.8,71.9 264.4,72.6 266.9,73.3 269.4,74.0 271.9,74.8 274.5,75.5 277.0,76.2 279.5,77.0 282.0,77.8 284.5,78.6 287.1,79.4 289.6,80.2 292.1,81.0 294.6,81.8 297.1,82.6 299.7,83.5 302.2,84.3 304.7,85.1 307.2,86.0 309.7,86.9 312.3,87.7 314.8,88.6 317.3,89.5 319.8,90.3 322.4,91.2 324.9,92.1 327.4,93.0 329.9,93.9 332.4,94.8 335.0,95.7 337.5,96.6 340.0,97.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="202" x2="340" y2="202" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="206" font-size="11" text-anchor="end" fill="#6c7a93">−180°</text>
  <polyline points="40.0,193.0 42.5,192.5 45.0,191.9 47.6,191.3 50.1,190.7 52.6,190.0 55.1,189.3 57.6,188.6 60.2,187.8 62.7,187.0 65.2,186.2 67.7,185.3 70.3,184.3 72.8,183.3 75.3,182.3 77.8,181.2 80.3,180.1 82.9,178.9 85.4,177.7 87.9,176.4 90.4,175.1 92.9,173.7 95.5,172.3 98.0,170.8 100.5,169.3 103.0,167.7 105.5,166.1 108.1,164.5 110.6,162.9 113.1,161.2 115.6,159.5 118.2,157.9 120.7,156.2 123.2,154.5 125.7,152.8 128.2,151.2 130.8,149.5 133.3,147.9 135.8,146.4 138.3,144.8 140.8,143.3 143.4,141.9 145.9,140.6 148.4,139.2 150.9,138.0 153.4,136.8 156.0,135.7 158.5,134.7 161.0,133.7 163.5,132.8 166.1,132.0 168.6,131.2 171.1,130.6 173.6,130.0 176.1,129.4 178.7,129.0 181.2,128.6 183.7,128.3 186.2,128.1 188.7,128.0 191.3,127.9 193.8,127.9 196.3,128.0 198.8,128.1 201.3,128.4 203.9,128.7 206.4,129.1 208.9,129.5 211.4,130.1 213.9,130.7 216.5,131.4 219.0,132.1 221.5,133.0 224.0,133.9 226.6,134.8 229.1,135.9 231.6,137.0 234.1,138.2 236.6,139.5 239.2,140.8 241.7,142.2 244.2,143.6 246.7,145.1 249.2,146.6 251.8,148.2 254.3,149.8 256.8,151.5 259.3,153.1 261.8,154.8 264.4,156.5 266.9,158.2 269.4,159.9 271.9,161.5 274.5,163.2 277.0,164.8 279.5,166.4 282.0,168.0 284.5,169.6 287.1,171.1 289.6,172.5 292.1,173.9 294.6,175.3 297.1,176.6 299.7,177.9 302.2,179.1 304.7,180.3 307.2,181.4 309.7,182.5 312.3,183.5 314.8,184.5 317.3,185.4 319.8,186.3 322.4,187.2 324.9,188.0 327.4,188.7 329.9,189.5 332.4,190.2 335.0,190.8 337.5,191.4 340.0,192.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="183.3" y1="20" x2="183.3" y2="202" stroke="#1f2a44" stroke-width="1"/>
  <line x1="191.3" y1="128.4" x2="191.3" y2="202" stroke="#b4232c" stroke-width="3"/>
  <text x="197.3" y="194" font-size="12" fill="#b4232c">phase margin 67°</text>
  <text x="189.3" y="30" font-size="12" fill="#1f2a44">crossover 8.13 rad/s</text>
  <text x="44" y="112" font-size="11" fill="#1f2a44">gain</text>
  <text x="44" y="138" font-size="11" fill="#1f2a44">phase</text>
</svg>
```
:::

::: context latency Where the milliseconds come from
Delay in a real loop piles up from many small sources. A sensor may average its samples internally before reporting. The reading crosses a data bus, waits for the flight software's next cycle, gets filtered (last lesson's causal filter added about $21\,\mathrm{ms}$), is processed, and the command goes back over the bus to an actuator, which has its own response time. Engineers budget this total as carefully as they budget mass.
:::

::: context canonical-form One of many right answers
A transfer function describes only what goes in and what comes out. Infinitely many state-space models share it: any change of state variables, $\mathbf{x}' = \mathbf{M}\mathbf{x}$ with an invertible $\mathbf{M}$, gives a different $\mathbf{A}, \mathbf{B}, \mathbf{C}$ with the same transfer function. A canonical form is one agreed-upon choice. The controllable canonical form puts the denominator in $\mathbf{A}$'s first row and the numerator in $\mathbf{C}$, which makes it quick to build.
:::

::: context dac From numbers to voltages
A digital-to-analog converter, or DAC, turns the number a computer writes into a voltage or current. It updates only when the computer writes a new value and holds the old one in between. Valve drivers, gimbal actuators and reaction-wheel motor drives all see this staircase. That is why the zero-order hold is the honest model of a plant's input.
:::

::: context warping The squeeze toward Nyquist
Tustin has to fit the whole continuous frequency axis, from $0$ to infinity, into the discrete band from $0$ to Nyquist. It does it with an arctangent, which is nearly a straight line at first and then flattens out. At $50\,\mathrm{Hz}$ sampling, $8\,\mathrm{Hz}$ lands at $7.41\,\mathrm{Hz}$, and $60\,\mathrm{Hz}$ is squeezed down to about $20.9\,\mathrm{Hz}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="336" y="24" font-size="11" text-anchor="end" fill="#6c7a93">Nyquist 25 Hz</text>
  <line x1="40" y1="180" x2="165" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="108" y="60" font-size="11" text-anchor="end" fill="#6c7a93">no warping</text>
  <polyline points="40.0,180.0 42.5,177.0 45.0,174.0 47.5,171.0 50.0,168.1 52.5,165.1 55.0,162.2 57.5,159.3 60.0,156.5 62.5,153.7 65.0,150.9 67.5,148.2 70.0,145.6 72.5,143.0 75.0,140.4 77.5,137.9 80.0,135.5 82.5,133.2 85.0,130.9 87.5,128.6 90.0,126.4 92.5,124.3 95.0,122.2 97.5,120.2 100.0,118.3 102.5,116.4 105.0,114.6 107.5,112.8 110.0,111.1 112.5,109.4 115.0,107.8 117.5,106.3 120.0,104.7 122.5,103.3 125.0,101.9 127.5,100.5 130.0,99.1 132.5,97.8 135.0,96.6 137.5,95.4 140.0,94.2 142.5,93.0 145.0,91.9 147.5,90.9 150.0,89.8 152.5,88.8 155.0,87.8 157.5,86.8 160.0,85.9 162.5,85.0 165.0,84.1 167.5,83.3 170.0,82.5 172.5,81.6 175.0,80.9 177.5,80.1 180.0,79.4 182.5,78.6 185.0,77.9 187.5,77.2 190.0,76.6 192.5,75.9 195.0,75.3 197.5,74.7 200.0,74.1 202.5,73.5 205.0,72.9 207.5,72.4 210.0,71.8 212.5,71.3 215.0,70.8 217.5,70.2 220.0,69.8 222.5,69.3 225.0,68.8 227.5,68.3 230.0,67.9 232.5,67.4 235.0,67.0 237.5,66.6 240.0,66.2 242.5,65.8 245.0,65.4 247.5,65.0 250.0,64.6 252.5,64.2 255.0,63.9 257.5,63.5 260.0,63.1 262.5,62.8 265.0,62.5 267.5,62.1 270.0,61.8 272.5,61.5 275.0,61.2 277.5,60.9 280.0,60.6 282.5,60.3 285.0,60.0 287.5,59.7 290.0,59.4 292.5,59.2 295.0,58.9 297.5,58.6 300.0,58.4 302.5,58.1 305.0,57.9 307.5,57.6 310.0,57.4 312.5,57.1 315.0,56.9 317.5,56.7 320.0,56.4 322.5,56.2 325.0,56.0 327.5,55.8 330.0,55.6 332.5,55.4 335.0,55.2 337.5,55.0 340.0,54.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="80.0" cy="135.5" r="4" fill="#b4232c"/>
  <text x="88.0" y="149.5" font-size="11" fill="#b4232c">8 Hz → 7.41 Hz</text>
  <text x="190" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">continuous frequency (Hz), 0 to 60</text>
  <text x="48" y="44" font-size="11" fill="#1f2a44">digital (Hz)</text>
</svg>
```
:::

::: context zoh-delay Why a staircase is late
The held output (dark steps) follows the wanted signal (light blue) in jumps. Each step holds the value from the start of its period, so on average it describes the signal half a period ago. The red dashed curve is the wanted signal shifted half a step later; it runs right through the middle of the steps. Ten samples per cycle, as drawn, costs $180° / 10 = 18°$ at that frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30.0,80.0 31.5,78.4 33.0,76.8 34.5,75.3 36.0,73.7 37.5,72.1 39.0,70.6 40.6,69.0 42.1,67.5 43.6,66.0 45.1,64.5 46.6,63.0 48.1,61.5 49.6,60.0 51.1,58.6 52.6,57.2 54.1,55.8 55.6,54.4 57.1,53.1 58.6,51.8 60.2,50.5 61.7,49.2 63.2,48.0 64.7,46.8 66.2,45.6 67.7,44.5 69.2,43.4 70.7,42.4 72.2,41.3 73.7,40.4 75.2,39.4 76.7,38.5 78.2,37.6 79.7,36.8 81.3,36.1 82.8,35.3 84.3,34.6 85.8,34.0 87.3,33.4 88.8,32.9 90.3,32.4 91.8,31.9 93.3,31.5 94.8,31.1 96.3,30.8 97.8,30.6 99.3,30.4 100.9,30.2 102.4,30.1 103.9,30.0 105.4,30.0 106.9,30.0 108.4,30.1 109.9,30.3 111.4,30.4 112.9,30.7 114.4,31.0 115.9,31.3 117.4,31.7 118.9,32.1 120.5,32.6 122.0,33.1 123.5,33.7 125.0,34.3 126.5,35.0 128.0,35.7 129.5,36.4 131.0,37.2 132.5,38.1 134.0,39.0 135.5,39.9 137.0,40.8 138.5,41.8 140.1,42.9 141.6,44.0 143.1,45.1 144.6,46.2 146.1,47.4 147.6,48.6 149.1,49.8 150.6,51.1 152.1,52.4 153.6,53.8 155.1,55.1 156.6,56.5 158.1,57.9 159.6,59.3 161.2,60.8 162.7,62.2 164.2,63.7 165.7,65.2 167.2,66.7 168.7,68.3 170.2,69.8 171.7,71.4 173.2,72.9 174.7,74.5 176.2,76.1 177.7,77.6 179.2,79.2 180.8,80.8 182.3,82.4 183.8,83.9 185.3,85.5 186.8,87.1 188.3,88.6 189.8,90.2 191.3,91.7 192.8,93.3 194.3,94.8 195.8,96.3 197.3,97.8 198.8,99.2 200.4,100.7 201.9,102.1 203.4,103.5 204.9,104.9 206.4,106.2 207.9,107.6 209.4,108.9 210.9,110.2 212.4,111.4 213.9,112.6 215.4,113.8 216.9,114.9 218.4,116.0 219.9,117.1 221.5,118.2 223.0,119.2 224.5,120.1 226.0,121.0 227.5,121.9 229.0,122.8 230.5,123.6 232.0,124.3 233.5,125.0 235.0,125.7 236.5,126.3 238.0,126.9 239.5,127.4 241.1,127.9 242.6,128.3 244.1,128.7 245.6,129.0 247.1,129.3 248.6,129.6 250.1,129.7 251.6,129.9 253.1,130.0 254.6,130.0 256.1,130.0 257.6,129.9 259.1,129.8 260.7,129.6 262.2,129.4 263.7,129.2 265.2,128.9 266.7,128.5 268.2,128.1 269.7,127.6 271.2,127.1 272.7,126.6 274.2,126.0 275.7,125.4 277.2,124.7 278.7,123.9 280.3,123.2 281.8,122.4 283.3,121.5 284.8,120.6 286.3,119.6 287.8,118.7 289.3,117.6 290.8,116.6 292.3,115.5 293.8,114.4 295.3,113.2 296.8,112.0 298.3,110.8 299.8,109.5 301.4,108.2 302.9,106.9 304.4,105.6 305.9,104.2 307.4,102.8 308.9,101.4 310.4,100.0 311.9,98.5 313.4,97.0 314.9,95.5 316.4,94.0 317.9,92.5 319.4,91.0 321.0,89.4 322.5,87.9 324.0,86.3 325.5,84.7 327.0,83.2 328.5,81.6 330.0,80.0" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <polyline points="30.0,80.0 60.0,80.0 60.0,50.6 90.0,50.6 90.0,32.4 120.0,32.4 120.0,32.4 150.0,32.4 150.0,50.6 180.0,50.6 180.0,80.0 210.0,80.0 210.0,109.4 240.0,109.4 240.0,127.6 270.0,127.6 270.0,127.6 300.0,127.6 300.0,109.4 330.0,109.4" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polyline points="45.1,79.9 46.6,78.3 48.1,76.8 49.6,75.2 51.1,73.6 52.6,72.1 54.1,70.5 55.6,69.0 57.1,67.4 58.6,65.9 60.2,64.4 61.7,62.9 63.2,61.4 64.7,60.0 66.2,58.5 67.7,57.1 69.2,55.7 70.7,54.4 72.2,53.0 73.7,51.7 75.2,50.4 76.7,49.2 78.2,47.9 79.7,46.7 81.3,45.6 82.8,44.4 84.3,43.4 85.8,42.3 87.3,41.3 88.8,40.3 90.3,39.4 91.8,38.5 93.3,37.6 94.8,36.8 96.3,36.0 97.8,35.3 99.3,34.6 100.9,34.0 102.4,33.4 103.9,32.8 105.4,32.3 106.9,31.9 108.4,31.5 109.9,31.1 111.4,30.8 112.9,30.5 114.4,30.3 115.9,30.2 117.4,30.1 118.9,30.0 120.5,30.0 122.0,30.0 123.5,30.1 125.0,30.3 126.5,30.5 128.0,30.7 129.5,31.0 131.0,31.3 132.5,31.7 134.0,32.1 135.5,32.6 137.0,33.1 138.5,33.7 140.1,34.3 141.6,35.0 143.1,35.7 144.6,36.5 146.1,37.3 147.6,38.1 149.1,39.0 150.6,39.9 152.1,40.9 153.6,41.9 155.1,42.9 156.6,44.0 158.1,45.1 159.6,46.3 161.2,47.5 162.7,48.7 164.2,49.9 165.7,51.2 167.2,52.5 168.7,53.8 170.2,55.2 171.7,56.6 173.2,58.0 174.7,59.4 176.2,60.8 177.7,62.3 179.2,63.8 180.8,65.3 182.3,66.8 183.8,68.3 185.3,69.9 186.8,71.4 188.3,73.0 189.8,74.6 191.3,76.1 192.8,77.7 194.3,79.3 195.8,80.9 197.3,82.4 198.8,84.0 200.4,85.6 201.9,87.2 203.4,88.7 204.9,90.3 206.4,91.8 207.9,93.3 209.4,94.8 210.9,96.3 212.4,97.8 213.9,99.3 215.4,100.7 216.9,102.2 218.4,103.6 219.9,105.0 221.5,106.3 223.0,107.6 224.5,108.9 226.0,110.2 227.5,111.5 229.0,112.7 230.5,113.8 232.0,115.0 233.5,116.1 235.0,117.2 236.5,118.2 238.0,119.2 239.5,120.2 241.1,121.1 242.6,122.0 244.1,122.8 245.6,123.6 247.1,124.4 248.6,125.1 250.1,125.7 251.6,126.3 253.1,126.9 254.6,127.4 256.1,127.9 257.6,128.3 259.1,128.7 260.7,129.0 262.2,129.3 263.7,129.6 265.2,129.7 266.7,129.9 268.2,130.0 269.7,130.0 271.2,130.0 272.7,129.9 274.2,129.8 275.7,129.6 277.2,129.4 278.7,129.2 280.3,128.9 281.8,128.5 283.3,128.1 284.8,127.6 286.3,127.1 287.8,126.6 289.3,126.0 290.8,125.3 292.3,124.6 293.8,123.9 295.3,123.1 296.8,122.3 298.3,121.4 299.8,120.5 301.4,119.6 302.9,118.6 304.4,117.6 305.9,116.5 307.4,115.4 308.9,114.3 310.4,113.1 311.9,111.9 313.4,110.7 314.9,109.5 316.4,108.2 317.9,106.8 319.4,105.5 321.0,104.1 322.5,102.7 324.0,101.3 325.5,99.9 327.0,98.4 328.5,96.9 330.0,95.5" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="30" y="150" font-size="12" fill="#1f2a44">held output</text>
  <text x="130" y="150" font-size="12" fill="#1d6fd1">wanted</text>
  <text x="200" y="150" font-size="12" fill="#b4232c">half a step late</text>
</svg>
```
:::
