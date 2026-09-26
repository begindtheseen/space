---
id: l01-what-feedback-buys
title: What feedback buys, and what it costs
minutes: 19
covers:
  - 'Feedback fundamentals: disturbance rejection, noise attenuation, insensitivity to plant variation'
---

Think about filling a glass of water in the dark. You cannot see the level, so you guess: pour for three seconds and hope. If the tap runs faster than usual, the glass overflows. Now turn the light on. You watch the level, and you slow down as it nears the top. You do not need to know how fast the tap runs, because you are checking the result and correcting as you go. That habit — measure what happened, compare it with what you wanted, act on the difference — is **feedback**.

A launch vehicle is the glass in the dark, many times over. Its engine thrust is misaligned by a fraction of a degree. It flies through wind nobody measured. Its moment of inertia is known to perhaps ten percent. Its gyros add noise to every reading. None of that is in the model the control engineer designed against, and all of it is in the vehicle. **[[Feedback|black-amplifier]]** is what lets a controller built from the wrong model fly the right path anyway.

This lesson sets out what feedback does, and — every bit as important — what it cannot do. Three benefits carry almost the whole case for closing a loop:

- it **rejects disturbances** — pushes the model never contained;
- it makes the result **insensitive to plant errors** — mistakes in the model of the vehicle;
- it does both while letting you choose how much **sensor noise** reaches the actuator.

The three are tied together. Two transfer functions govern all of them: the **sensitivity** $S$ and the **complementary sensitivity** $T$, which you met in the signals and systems module. They obey $S + T = 1$ at every frequency. Every design decision in the rest of this module is a decision about where to make $S$ small and where to make $T$ small.

## The example vehicle

The running example for the next several lessons is the pitch **rate channel** of a vehicle — the part of the control system that makes the vehicle turn nose-up or nose-down at a commanded speed. The vehicle has pitch **[[inertia|moment-of-inertia]]** $J = 1200\ \mathrm{kg\,m^2}$ (its resistance to being spun up), and its torque comes through an actuator with a **lag** of $\tau = 0.02\ \mathrm{s}$ ($\tau$ is the Greek letter "tau"). A lag means the actuator does not deliver a new torque instantly; it [[creeps toward it|actuator-lag]], getting about 63% of the way there in $\tau$ seconds.

As a transfer function, from commanded torque to body rate:

$$
G(s) = \frac{\omega(s)}{T_c(s)} = \frac{1}{J s\,(\tau s + 1)}.
$$

Here $T_c$ is the commanded torque in $\mathrm{N\,m}$ and $\omega$ ("omega") is the body rate in $\mathrm{rad/s}$. Read it in two pieces. The factor $1/(Js)$ is Newton's law for turning: torque divided by inertia is angular acceleration, and the $1/s$ adds that acceleration up over time into a rate. The factor $1/(\tau s + 1)$ is the actuator's lag. This is the plant the module's PID exercise uses, and it is the simplest plant on which every idea here shows up.

## The four transfer functions

To see what feedback does, [[draw the loop honestly|loop-picture]], with every place a real signal gets in. There are four outside signals:

- $r$, the **reference** — the rate you command;
- $n$, the **sensor noise** — the gyro's jitter, added to what the controller measures;
- $d_i$, an **input disturbance** — an extra torque that enters where the actuator's torque does;
- $d_o$, an **output disturbance** — something added straight onto the output.

The controller cannot see the true rate $y$. It sees $y + n$. So the error it acts on is $e = r - (y + n)$, and its command is $u = C(s)\,e$, where $C$ is the controller's transfer function. The plant turns its input into an output: $y = G(s)\,(u + d_i) + d_o$.

Put the controller's command into the plant equation:

$$
y = GC\,(r - y - n) + G\,d_i + d_o .
$$

Now gather every $y$ on the left side. Write $L = GC$ for short:

$$
y\,(1 + L) = L\,r - L\,n + G\,d_i + d_o .
$$

Divide both sides by $1 + L$:

$$
y = T\,r + S\,d_o + GS\,d_i - T\,n,
\qquad
L = GC, \quad S = \frac{1}{1 + L}, \quad T = \frac{L}{1 + L}.
$$

$L$ is the **loop transfer function**: what a signal gets multiplied by on one trip around the loop, if you cut the loop open. $S$ is the **sensitivity** and $T$ is the **complementary sensitivity**. The same steps, done for $u$ instead of $y$, give the actuator command:

$$
u = CS\,(r - d_o - n) - T\,d_i,
\qquad
CS = \frac{C}{1 + L} = \frac{T}{G}.
$$

So four transfer functions — $S$, $T$, $GS$ and $CS$ — decide everything the loop does. Designing a controller means choosing their shapes.

Two facts come straight from the definitions. First, add them: $S + T = \frac{1 + L}{1 + L} = 1$, at every frequency, for every loop. You cannot make both small at the same frequency, so you put them to work in different frequency bands. Second, $S$ is small exactly where $|L|$ is large. When $|L| \gg 1$ (read "much bigger than one"), the $1$ in $1 + L$ hardly matters, so $|S| \approx 1/|L|$ and $T \approx 1$. The **crossover** frequency is where $|L|$ falls through one. Well above it, $|L| \ll 1$, so $T \approx L$ and $S \approx 1$.

::: key
$L = GC$, $S = 1/(1+L)$, $T = L/(1+L)$, and $S + T = 1$ at every frequency. The command reaches the output through $T$, and output disturbances through $S$. Sensor noise reaches the output through $-T$; input disturbances reach it through $GS$. The actuator sees $CS = T/G$. Where $|L| \gg 1$: $|S| \approx 1/|L|$ and $T \approx 1$. Where $|L| \ll 1$: $S \approx 1$ and $T \approx L$.
:::

## Disturbance rejection

Picture holding a door shut while someone leans on it from the other side. The harder they push, the harder you push back, and the door stays put. A constant **disturbance torque** is that lean. On a vehicle it comes from [[thrust-vector misalignment|misalignment]], an aerodynamic trim torque, sunlight pressing on a solar panel, or a leaking thruster.

With no feedback, the plant adds the disturbance up forever: a steady torque makes a steady angular acceleration, and the rate grows without end. With feedback, the rate error it produces is $GS\,d_i$. For a constant $d_i$, the final value theorem (the value a response settles to is found by letting $s \to 0$) says the steady rate error is $d_i$ times the value of $GS$ at $s = 0$:

$$
\lim_{s \to 0} \frac{G(s)}{1 + C(s)G(s)} = \lim_{s\to 0}\frac{1}{1/G(s) + C(s)}.
$$

(The second form comes from dividing top and bottom by $G$.) For this plant $1/G(s) = Js(\tau s + 1)$, which is $0$ at $s = 0$. So the limit is $1/C(0)$.

- A **proportional** controller, $C = k_p$, leaves a rate error of $d_i/k_p$ that never goes away.
- A controller with an **integrator** has $C(0) = \infty$, and leaves no error at all.

That is the whole argument for integral action. Notice that it is a statement about $|S|$ at low frequency, not about any particular time history.

::: example A 50 N·m trim torque on the rate channel
Take a constant disturbance $d_i = 50\ \mathrm{N\,m}$ from thrust misalignment.

**No feedback.** The vehicle's angular acceleration is torque over inertia: $50/1200 = 0.0417\ \mathrm{rad/s^2}$. After ten seconds the rate is $0.0417 \times 10 = 0.417\ \mathrm{rad/s}$, which is $23.9^\circ/\mathrm{s}$, and still climbing.

**Proportional feedback.** Close the loop with $k_p = 12\,000\ \mathrm{N\,m\,s/rad}$. (This value puts $k_p/J = 10\ \mathrm{rad/s}$, which sets the crossover near $10\ \mathrm{rad/s}$.) The steady rate error is

$$
\frac{d_i}{k_p} = \frac{50}{12\,000} = 4.17\times 10^{-3}\ \mathrm{rad/s} = 0.239^\circ/\mathrm{s}.
$$

It is bounded, but permanent. The controller is holding $50\ \mathrm{N\,m}$ of torque only by carrying that error: $12\,000 \times 0.00417 = 50$.

**Add an integrator.** Now $C(s) = k_p + k_i/s$ with $k_i = 24\,000\ \mathrm{N\,m/rad}$. Multiply out $L = GC$ and divide top and bottom by $J\tau = 24$:

$$
L(s) = \frac{k_p s + k_i}{J s^2(\tau s + 1)} = \frac{500\,(s + 2)}{s^2\,(s + 50)}.
$$

The disturbance-to-rate transfer function becomes

$$
GS = \frac{s}{24\,(s^3 + 50 s^2 + 500 s + 1000)}.
$$

The lone $s$ on top is the integrator doing its job: at $s = 0$ it makes $GS = 0$, so no error is left. Simulating the 50 N·m step, the rate error peaks at $3.41\times10^{-3}\ \mathrm{rad/s} = 0.195^\circ/\mathrm{s}$ at $t = 0.21\ \mathrm{s}$, then shrinks below 2% of that peak by $1.8\ \mathrm{s}$.

Sanity check: the peak is a little smaller than the proportional loop's permanent error ($0.195$ against $0.239^\circ/\mathrm{s}$), which makes sense, since both loops have the same $k_p$ and the integrator only adds to the push-back. The real difference is that this error goes away.
:::

## Insensitivity to plant variation

Here is the second benefit, and the one that gives $S$ its name. Suppose your model of the vehicle is a little wrong. How much does that change what the closed loop does?

Picture a cruise control on a car. Load the trunk with bags and the car is heavier — a different "plant". Without feedback, the same throttle gives a lower speed. With cruise control, the speed barely changes, because the controller notices the slowdown and adds throttle. The loop hides the change in the plant.

The precise statement is short. If the plant changes by a small fraction $dG/G$, the closed-loop response $T$ changes by the fraction

$$
\frac{dT}{T} = S\,\frac{dG}{G}.
$$

So $S$ is, quite literally, the sensitivity of the closed loop to a relative plant error. Where $|S| = 0.05$, a 20% plant error moves the closed-loop response by only 1%. Where $|S| = 1$ — above crossover — the closed loop inherits the plant error in full. Feedback does not make a system robust everywhere. It makes it robust exactly where the loop gain is high.

::: note Why it has to be true
Treat $T = GC/(1 + GC)$ as a function of $G$ and take its derivative with the quotient rule (top's derivative times bottom, minus top times bottom's derivative, over bottom squared):

$$
\frac{dT}{dG} = \frac{C(1 + GC) - GC\cdot C}{(1+GC)^2} = \frac{C}{(1 + L)^2}.
$$

To turn this into fractional changes, multiply by $G/T$:

$$
\frac{dT/T}{dG/G} = \frac{G}{T}\cdot\frac{C}{(1+L)^2} = \frac{GC\,(1 + L)}{L}\cdot\frac{1}{(1+L)^2} = \frac{1}{1 + L} = S .
$$

(The middle step used $G/T = G(1 + L)/L$ and $GC = L$.) Because it is a derivative, it is exact only for small changes.
:::

::: example A 30% inertia error
Propellant load, [[tank slosh|slosh]] and a payload that got heavier during integration all move $J$. Suppose the flight vehicle has $J = 1560\ \mathrm{kg\,m^2}$ — 30% above the design value — and the gains are unchanged.

**The plant error.** $G$ is proportional to $1/J$, so the new plant is the old one divided by $1.3$. The relative error is $1/1.3 - 1 = -0.231$, or $-23.1\%$, the same at every frequency.

**At $\omega = 1\ \mathrm{rad/s}$**, well below crossover, the nominal loop has $|L| = 22.4$, so $|S| = 0.0466$. The formula predicts the closed loop moves by about $0.0466 \times 23.1\% = 1.08\%$. Now recompute $T$ exactly with the heavier vehicle. At each frequency $T$ is a complex number — it has a size and a phase — so the honest measure of change is the size of the complex ratio, $|\Delta T/T|$, which counts both. It is $1.42\%$ (the size $|T|$ alone changes by $1.26\%$).

**At $\omega = 10\ \mathrm{rad/s}$**, the crossover, $|S| = 0.901$. The prediction is $0.901 \times 23.1\% = 20.8\%$; exactly, $|\Delta T/T| = 23.1\%$, and $|T|$ drops by $14.7\%$.

Why don't the numbers match exactly? The rule is a derivative, so it is accurate only for small changes. Try a heavier vehicle by only 1% ($dG/G = -0.99\%$): the predictions are $0.0461\%$ and $0.892\%$, and the exact values are $0.0466\%$ and $0.897\%$ — nearly identical. For a 23% error the rule is only a guide, but its message holds: below crossover the error is squeezed by the loop gain; near and above crossover it passes straight through.

**The margins move too**, less than you might fear. The heavier vehicle's $|L|$ is $1.3$ times smaller, a drop of $20\log_{10}1.3 = 2.3$ dB, so crossover falls from $10.0$ to $7.84\ \mathrm{rad/s}$. The phase margin — the extra phase lag the loop could take at crossover before going unstable, defined exactly in lesson 7 — goes from $67.4^\circ$ to $66.8^\circ$. The loop is slower on the heavy vehicle but no less stable, because the phase curve is nearly flat near crossover.
:::

## Noise attenuation, and the price of the loop

Now the downside. The controller cannot tell sensor noise from a real error, so it reacts to both. Noise reaches the output through $-T$ and the actuator through $-CS$.

Below crossover, $T \approx 1$. So noise inside the control band is copied to the output almost in full. Nothing feedback can do will fix a gyro that lies slowly. That is why sensor bias, not loop design, sets the final pointing accuracy of a vehicle. Above crossover, $T$ falls away and high-frequency noise is suppressed at the output.

The actuator is another story. As $|L| \to 0$ at high frequency, $CS \to C$. A controller with high gain at high frequency pumps noise straight into the hardware, whatever $T$ does.

For this loop, $|C| \to k_p = 12\,000$ at high frequency. A rate gyro with $0.01^\circ/\mathrm{s}$ of broadband noise — that is $1.75\times10^{-4}\ \mathrm{rad/s}$ [[rms|rms]] — therefore produces about

$$
12\,000 \times 1.75\times10^{-4} = 2.1\ \mathrm{N\,m}
$$

rms of torque command chatter. Against a 50 N·m trim torque that is fine. Against a [[reaction wheel|reaction-wheel]] with $0.2\ \mathrm{N\,m}$ of authority it would be ten times the whole wheel. Noise into the actuator is a hardware sizing limit, not a nuisance.

Feedback costs three more things, and they fill most of this module:

- **It can destabilize a stable plant.** Going around the loop, gain and phase can conspire. If $L(j\omega) = -1$ at some frequency, then $1 + L = 0$ and the closed loop has a pole on the imaginary axis — it rings forever. Nothing in the open-loop system had that property.
- **It cannot reduce $|S|$ everywhere.** The Bode sensitivity integral, later in this module, shows that pushing $|S|$ below 1 in the control band forces $|S| > 1$ somewhere else. For this loop the peak is $\lVert S\rVert_\infty = 1.151$ (read "the infinity-norm of $S$", meaning its largest value over all frequencies) at $28\ \mathrm{rad/s}$. Disturbances near 28 rad/s are made 15% *bigger* by the very loop that shrinks them about twenty-fold at 1 rad/s.
- **It costs actuator authority and bandwidth.** Every push the loop cancels, the actuator has to produce.

::: warning High gain is good only where the model is honest
Raising $k_p$ lowers $|S|$ at low frequency and raises crossover. But crossover cannot be pushed past the frequency where the model stops describing the hardware — the actuator lag, an unmodeled bending mode, a computer delay. A loop that crosses over where the model is wrong is a loop whose stability you have not actually analyzed.
:::

## Reading the numbers off the loop

The table below is the nominal loop with integral action, $L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$, sampled across the band. Magnitudes are in **[[decibels|decibels]]** (dB), where $20\log_{10}$ of a gain turns a factor of 10 into $20\ \mathrm{dB}$ and a factor of 1 into $0\ \mathrm{dB}$.

Read it as [[one picture|st-picture]]. As you go down the rows, $|L|$ falls. $|S|$ climbs from $-66\ \mathrm{dB}$ toward $0\ \mathrm{dB}$, and $|T|$ does the reverse. At the gain crossover, $10\ \mathrm{rad/s}$, $|L| = 1$ and the two are equal, both at $-0.9\ \mathrm{dB}$.

| $\omega$ (rad/s) | $\lvert L\rvert$ (dB) | $\lvert S\rvert$ (dB) | $\lvert T\rvert$ (dB) |
| --- | --- | --- | --- |
| 0.1 | 66.0 | −66.0 | 0.00 |
| 1 | 27.0 | −26.6 | 0.36 |
| 5 | 6.6 | −5.6 | 1.04 |
| 10 | 0.0 | −0.90 | −0.90 |
| 20 | −6.6 | 1.04 | −5.6 |
| 50 | −17.0 | 0.90 | −16.1 |
| 100 | −27.0 | 0.36 | −26.6 |

Notice the pattern: the $|S|$ column below crossover mirrors the $|T|$ column above it. That symmetry is special to this loop, not a law, but $S + T = 1$ is always behind the handover.

```python
import numpy as np

num, den = np.array([500.0, 1000.0]), np.array([1.0, 50.0, 0.0, 0.0])
for w in (0.1, 1, 5, 10, 20, 50, 100):
    L = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
    S, T = 1 / (1 + L), L / (1 + L)
    print(f"{w:6.1f} {20*np.log10(abs(L)):7.2f} "
          f"{20*np.log10(abs(S)):7.2f} {20*np.log10(abs(T)):7.2f}")
# 100.0  -26.99    0.36  -26.63   <- last line
```

::: note How a real specification is written
A real project almost never says "put a pole here". It writes three bounds: a limit on $|S|$ below some frequency (disturbance rejection), a limit on $|T|$ above some frequency (noise and unmodeled dynamics), and a limit on $\lVert S\rVert_\infty$ (robustness). Classical design meets those bounds by shaping $|L|$, because $S$ and $T$ are both set by $L$. That is the whole of loop shaping.
:::

## Check yourself

::: check
A loop has $|L(j\omega)| = 40\ \mathrm{dB}$ at $\omega = 0.5\ \mathrm{rad/s}$. Estimate $|S|$ and $|T|$ there. By what factor is a 0.5 rad/s output disturbance shrunk?
:::

::: answer
$40\ \mathrm{dB}$ is a factor of $10^{40/20} = 100$, so $|L| \gg 1$. Then $|S| \approx 1/|L| = 0.01$, which is $-40\ \mathrm{dB}$, and $|T| = |1 - S| \approx 1$. An output disturbance at that frequency reaches the output multiplied by $S$, so it is shrunk by a factor of about 100. The estimate is good to about a percent: exactly, $|S| = 1/|1 + L|$, which differs from $1/|L|$ by at most 1% when $|L| = 100$.
:::

::: check
Why does adding an integrator to the controller remove the steady-state error to a constant input disturbance, and what does it do to $|S|$ at low frequency?
:::

::: answer
The steady rate error to a constant input disturbance is $\lim_{s\to0} G/(1+CG) = \lim_{s\to0} 1/\bigl(1/G + C\bigr)$. An integrator makes $C(s) \to \infty$ as $s \to 0$, so the limit is zero whatever the plant does. In frequency terms, $|L| \to \infty$ as $\omega \to 0$, so $|S| = 1/|1+L| \to 0$: the sensitivity function gains a zero at the origin. Every "system type" argument about steady-state error is really a statement about how many zeros $S$ has at $s = 0$.
:::

::: check
The example rate loop flies on a vehicle whose actuator turns out 20% weaker than modeled — the same as a 20% drop in loop gain. Using the sensitivity rule, estimate the fractional change in the closed-loop response at $\omega = 1\ \mathrm{rad/s}$ and at $\omega = 20\ \mathrm{rad/s}$, where $|S| = 1.13$.
:::

::: answer
At $1\ \mathrm{rad/s}$, $|S| = 0.047$, so $|dT/T| \approx 0.047 \times 0.20 = 0.94\%$ — negligible. At $20\ \mathrm{rad/s}$, $|S| = 1.13$, so $|dT/T| \approx 1.13 \times 0.20 = 23\%$. There the closed loop is *more* sensitive to the plant error than the plant itself is, because $|S| > 1$. This is the waterbed effect showing up as a robustness problem, and it is why a loop is never signed off on its low-frequency behavior alone.
:::

::: check
An engineer proposes cutting gyro noise at the output by lowering the controller's high-frequency gain. Will that also cut the noise the actuator sees? Which transfer function governs each?
:::

::: answer
Noise reaches the output through $T$ and the actuator through $CS$. Above crossover, $|T| \approx |L| = |GC|$ and $|CS| \approx |C|$. Lowering $|C|$ at high frequency lowers both, so the idea works for both. But they do not scale the same way: $|T|$ also carries the plant's roll-off $|G|$, and $|CS|$ does not. A plant that rolls off steeply protects the output from noise by itself. Nothing protects the actuator except the controller's own high-frequency gain. That difference is why the derivative term of a PID is always filtered.
:::

::: check
Explain why $S + T = 1$ makes "reject every disturbance and ignore all noise" impossible, and how a designer lives with it.
:::

::: answer
At any one frequency, $S(j\omega) + T(j\omega) = 1$, so $|S|$ and $|T|$ cannot both be much less than one there. If $|S| = 0.01$, then $T = 1 - S$ has size at least $0.99$. Good disturbance rejection at a frequency guarantees full noise pass-through at that frequency, and the other way around. The way out is to separate by frequency: make $|S|$ small in the band where disturbances live (low frequency — wind, trim torques, mass shifts) and $|T|$ small in the band where noise and unmodeled dynamics live (high frequency), and accept that both are about one near crossover. Choosing where that handover sits is what choosing a bandwidth means.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $L = GC$ | loop transfer function; the product around the loop |
| $S = 1/(1+L)$, $T = L/(1+L)$ | sensitivity and complementary sensitivity |
| $S + T = 1$ | holds at every frequency, always |
| $y = Tr + Sd_o + GS\,d_i - Tn$ | the four ways a signal reaches the output |
| $u = CS(r - d_o - n) - T d_i$, $CS = T/G$ | what the actuator is asked to do |
| $dT/T = S\,\cdot\,dG/G$ | sensitivity to relative plant error |
| $\lim_{s\to0} 1/(1/G + C)$ | steady-state error to a constant input disturbance |
| Example plant | $G = 1/(Js(\tau s+1))$, $J = 1200\ \mathrm{kg\,m^2}$, $\tau = 0.02\ \mathrm{s}$ |
| Example loop | $L = 500(s+2)/\bigl(s^2(s+50)\bigr)$; $\omega_{gc} = 10\ \mathrm{rad/s}$, $\mathrm{PM} = 67.4^\circ$ |
| Its peak | $\lVert S\rVert_\infty = 1.151$ at $28\ \mathrm{rad/s}$ |
| 50 N·m trim torque | proportional loop: $0.239^\circ/\mathrm{s}$ forever; with integrator: $0.195^\circ/\mathrm{s}$ peak, gone in 1.8 s |

The next lesson gives that controller a name and a structure. PID is the form almost every flight loop takes, and each of its three terms has a job you can now describe in terms of $S$ and $T$.

::: context black-amplifier Where negative feedback came from
The idea that made modern control possible came from telephones. In 1927 Harold Black, an engineer at Bell Labs, was trying to build amplifiers for long-distance lines. The vacuum tubes inside drifted and distorted, and dozens of amplifiers in a row made the problem unbearable. His fix was to feed part of the output back, subtracted from the input. The amplifier then gave up some raw gain, but its behavior came to depend on stable resistors instead of fickle tubes. That trade — spend gain to buy insensitivity — is exactly the one this lesson describes.
:::

::: context moment-of-inertia Inertia for turning
Mass tells you how hard it is to push something into moving. **Moment of inertia** tells you how hard it is to spin something up. It depends on the mass and on how far that mass sits from the axis: a figure skater spins faster by pulling in her arms, because her moment of inertia drops. Its unit is $\mathrm{kg\,m^2}$. Newton's law for turning is torque $=$ moment of inertia $\times$ angular acceleration, so on our vehicle a torque of $1200\ \mathrm{N\,m}$ gives $1\ \mathrm{rad/s^2}$.
:::

::: context actuator-lag A first-order lag
An actuator — a gimbal motor, a valve — cannot jump to a new setting. With a first-order lag, after a step command it closes the remaining gap at a rate proportional to the gap. After one time constant $\tau$ it has covered $1 - e^{-1} \approx 63\%$ of the way; after $3\tau$, about 95%.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="46" y1="130" x2="340" y2="130" stroke="#1f2a44"/>
  <line x1="46" y1="130" x2="46" y2="12" stroke="#1f2a44"/>
  <polyline points="46,130 46,18 340,18" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polyline points="46.0,130.0 51.0,120.9 56.0,112.5 60.9,104.9 65.9,97.8 70.9,91.3 75.9,85.4 80.9,79.9 85.9,74.9 90.8,70.2 95.8,66.0 100.8,62.1 105.8,58.5 110.8,55.2 115.8,52.2 120.7,49.4 125.7,46.9 130.7,44.5 135.7,42.4 140.7,40.4 145.7,38.6 150.6,36.9 155.6,35.4 160.6,33.9 165.6,32.7 170.6,31.5 175.6,30.4 180.5,29.4 185.5,28.4 190.5,27.6 195.5,26.8 200.5,26.1 205.5,25.4 210.4,24.8 215.4,24.3 220.4,23.8 225.4,23.3 230.4,22.9 235.4,22.5 240.3,22.1 245.3,21.8 250.3,21.5 255.3,21.2 260.3,20.9 265.3,20.7 270.2,20.5 275.2,20.3 280.2,20.1 285.2,19.9 290.2,19.8 295.2,19.6 300.1,19.5 305.1,19.4 310.1,19.3 315.1,19.2 320.1,19.1 325.1,19.0 330.0,18.9 335.0,18.8 340.0,18.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="104.8" y1="130" x2="104.8" y2="59.2" stroke="#b4232c" stroke-dasharray="3 3"/>
  <line x1="46" y1="59.2" x2="104.8" y2="59.2" stroke="#b4232c" stroke-dasharray="3 3"/>
  <circle cx="104.8" cy="59.2" r="3" fill="#b4232c"/>
  <text x="42" y="134.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="42" y="63.2" font-size="11" text-anchor="end" fill="#1f2a44">63%</text>
  <text x="42" y="22.0" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="46.0" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="104.8" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0.02</text>
  <text x="163.6" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0.04</text>
  <text x="222.4" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0.06</text>
  <text x="281.2" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0.08</text>
  <text x="340.0" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <text x="193.0" y="162" font-size="11" text-anchor="middle" fill="#1f2a44">time after the torque command steps (s)</text>
  <text x="193.0" y="12.0" font-size="11" fill="#6c7a93">commanded torque</text>
  <text x="134.2" y="68.4" font-size="11" fill="#1d6fd1">torque delivered</text>
</svg>
```

For our actuator, $\tau = 0.02\ \mathrm{s}$, so the torque is 63% there after 20 ms and about 95% there after 60 ms.
:::

::: context loop-picture The loop, with everything that gets in
Each circle adds its inputs. The controller $C$ sees only the error $e$, and the error is built from the measured output $y + n$, not the true one. That single fact is why noise is a problem at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="none">
    <line x1="14" y1="60" x2="40" y2="60"/>
    <circle cx="50" cy="60" r="10" fill="#fff"/>
    <line x1="60" y1="60" x2="80" y2="60"/>
    <rect x="80" y="44" width="40" height="32" fill="#8fb8f0"/>
    <line x1="120" y1="60" x2="148" y2="60"/>
    <circle cx="158" cy="60" r="10" fill="#fff"/>
    <line x1="158" y1="22" x2="158" y2="50"/>
    <line x1="168" y1="60" x2="186" y2="60"/>
    <rect x="186" y="44" width="40" height="32" fill="#f2b880"/>
    <line x1="226" y1="60" x2="252" y2="60"/>
    <circle cx="262" cy="60" r="10" fill="#fff"/>
    <line x1="262" y1="22" x2="262" y2="50"/>
    <line x1="272" y1="60" x2="342" y2="60"/>
    <line x1="300" y1="60" x2="300" y2="110"/>
    <circle cx="300" cy="120" r="10" fill="#fff"/>
    <line x1="340" y1="120" x2="310" y2="120"/>
    <line x1="290" y1="120" x2="50" y2="120"/>
    <line x1="50" y1="120" x2="50" y2="70"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="40,60 32,56 32,64"/>
    <polygon points="80,60 72,56 72,64"/>
    <polygon points="148,60 140,56 140,64"/>
    <polygon points="158,50 154,42 162,42"/>
    <polygon points="186,60 178,56 178,64"/>
    <polygon points="252,60 244,56 244,64"/>
    <polygon points="262,50 258,42 266,42"/>
    <polygon points="342,60 334,56 334,64"/>
    <polygon points="300,110 296,102 304,102"/>
    <polygon points="310,120 318,116 318,124"/>
    <polygon points="50,70 46,78 54,78"/>
    <circle cx="300" cy="60" r="2.5"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="18" y="52">r</text>
    <text x="100" y="65" font-weight="700">C</text>
    <text x="206" y="65" font-weight="700">G</text>
    <text x="158" y="16">d_i</text>
    <text x="262" y="16">d_o</text>
    <text x="340" y="52">y</text>
    <text x="340" y="112">n</text>
    <text x="40" y="88">−</text>
    <text x="70" y="52">e</text>
    <text x="134" y="52">u</text>
    <text x="175" y="140">the controller sees y + n, not y</text>
  </g>
</svg>
```

Follow a disturbance: $d_i$ passes through $G$ before it shows up at $y$, so it arrives through $GS$; $d_o$ skips $G$, so it arrives through $S$.
:::

::: context misalignment Where a trim torque comes from
An engine pushes along a line. If that line misses the vehicle's center of mass, the push also twists the vehicle. The twist is the thrust times the miss distance. A $10\ \mathrm{kN}$ engine whose thrust line misses by only $5\ \mathrm{mm}$ gives $10\,000 \times 0.005 = 50\ \mathrm{N\,m}$ — the torque in the example. Perfect alignment is impossible, and the center of mass moves as propellant burns, so real vehicles always fly with some steady trim torque for the control loop to cancel.
:::

::: context slosh When propellant moves
Liquid in a tank sloshes like coffee in a carried mug, and it shifts the vehicle's mass around as it goes. The control loop sees this as a plant that changes and pushes back. Slosh is a real hazard: on the second flight of SpaceX's Falcon 1 in 2007, liquid-oxygen slosh in the upper stage grew into a roll the controller could not hold, and the engine shut down early, short of orbit. Tanks carry baffles to calm the liquid, and controllers are designed knowing slosh is there.
:::

::: context rms What "rms" means
Noise jumps up and down, so its plain average is about zero, which is useless. Instead engineers square each value (making everything positive), average the squares, then take the square root to get back to the original units. That is the **root mean square**, or rms: a typical size of the wiggle. For noise that swings evenly around zero, the rms is the same as the standard deviation.
:::

::: context reaction-wheel Reaction wheels
A **reaction wheel** is a heavy flywheel driven by an electric motor inside a spacecraft. Spin the wheel one way and the spacecraft turns the other, because the total spin (angular momentum) stays the same. Reaction wheels give very fine, smooth control but only small torques — a fraction of a newton-meter for many satellites. So a loop that sends a couple of newton-meters of noise to a wheel would ask it for more than it can give, all the time.
:::

::: context decibels Why engineers use decibels
Control gains range from a millionth to a million, so engineers use a log scale. The decibel value of a gain $|G|$ is $20\log_{10}|G|$. A gain of $10$ is $20\ \mathrm{dB}$, $100$ is $40\ \mathrm{dB}$, $1$ is $0\ \mathrm{dB}$, and $0.1$ is $-20\ \mathrm{dB}$. The big win: multiplying gains becomes adding decibels, so the gain around a loop is the sum of the pieces' decibels.
:::

::: context st-picture S and T on one plot
Here are the two columns of the table, drawn over the whole band for the example loop. $|S|$ (red) is tiny at low frequency and rises to about one; $|T|$ (blue) is about one at low frequency and falls away. They cross slightly below $0\ \mathrm{dB}$ near $10\ \mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <rect x="46" y="20" width="294" height="150" fill="#fff" stroke="#6c7a93"/>
  <text x="42" y="54.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <line x1="46" y1="50.0" x2="340" y2="50.0" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="42" y="114.0" font-size="11" text-anchor="end" fill="#1f2a44">-20</text>
  <text x="42" y="174.0" font-size="11" text-anchor="end" fill="#1f2a44">-40</text>
  <text x="42" y="24.0" font-size="11" text-anchor="end" fill="#1f2a44">10</text>
  <line x1="46.0" y1="170" x2="46.0" y2="174" stroke="#6c7a93"/>
  <text x="46.0" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <line x1="119.5" y1="170" x2="119.5" y2="174" stroke="#6c7a93"/>
  <text x="119.5" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <line x1="193.0" y1="170" x2="193.0" y2="174" stroke="#6c7a93"/>
  <text x="193.0" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <line x1="266.5" y1="170" x2="266.5" y2="174" stroke="#6c7a93"/>
  <text x="266.5" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <line x1="340.0" y1="170" x2="340.0" y2="174" stroke="#6c7a93"/>
  <text x="340.0" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="193.0" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">frequency ω (rad/s)</text>
  <text x="12" y="14" font-size="11" fill="#1f2a44">dB</text>
  <polyline points="95.6,167.6 98.9,162.3 102.2,157.0 105.5,151.8 108.8,146.6 112.1,141.4 115.4,136.2 118.7,131.2 122.0,126.1 125.3,121.2 128.6,116.3 131.9,111.6 135.2,106.9 138.5,102.4 141.8,98.0 145.1,93.8 148.4,89.7 151.7,85.8 155.0,82.1 158.3,78.5 161.6,75.2 164.9,72.0 168.2,69.0 171.5,66.2 174.8,63.6 178.1,61.2 181.4,59.0 184.7,56.9 188.0,55.1 191.3,53.5 194.7,52.0 198.0,50.7 201.3,49.7 204.6,48.7 207.9,48.0 211.2,47.4 214.5,46.9 217.8,46.6 221.1,46.4 224.4,46.3 227.7,46.3 231.0,46.4 234.3,46.6 237.6,46.8 240.9,47.0 244.2,47.3 247.5,47.5 250.8,47.8 254.1,48.1 257.4,48.3 260.7,48.6 264.0,48.8 267.3,49.0 270.6,49.1 273.9,49.3 277.2,49.4 280.5,49.5 283.8,49.6 287.1,49.7 290.4,49.7 293.8,49.8 297.1,49.8 300.4,49.8 303.7,49.9 307.0,49.9 310.3,49.9 313.6,49.9 316.9,49.9 320.2,50.0 323.5,50.0 326.8,50.0 330.1,50.0 333.4,50.0 336.7,50.0 340.0,50.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="46.0,50.0 49.3,50.0 52.6,50.0 55.9,50.0 59.2,50.0 62.5,50.0 65.8,50.0 69.1,49.9 72.4,49.9 75.7,49.9 79.0,49.9 82.3,49.9 85.6,49.8 88.9,49.8 92.2,49.8 95.6,49.7 98.9,49.7 102.2,49.6 105.5,49.5 108.8,49.4 112.1,49.3 115.4,49.1 118.7,49.0 122.0,48.8 125.3,48.6 128.6,48.3 131.9,48.1 135.2,47.8 138.5,47.5 141.8,47.3 145.1,47.0 148.4,46.8 151.7,46.6 155.0,46.4 158.3,46.3 161.6,46.3 164.9,46.4 168.2,46.6 171.5,46.9 174.8,47.4 178.1,48.0 181.4,48.7 184.7,49.7 188.0,50.7 191.3,52.0 194.7,53.5 198.0,55.1 201.3,56.9 204.6,59.0 207.9,61.2 211.2,63.6 214.5,66.2 217.8,69.0 221.1,72.0 224.4,75.2 227.7,78.5 231.0,82.1 234.3,85.8 237.6,89.7 240.9,93.8 244.2,98.0 247.5,102.4 250.8,106.9 254.1,111.6 257.4,116.3 260.7,121.2 264.0,126.1 267.3,131.2 270.6,136.2 273.9,141.4 277.2,146.6 280.5,151.8 283.8,157.0 287.1,162.3 290.4,167.6" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="225.9" cy="46.3" r="3" fill="#b4232c"/>
  <text x="221.9" y="38.3" font-size="11" text-anchor="end" fill="#b4232c">peak 1.15 at 28</text>
  <text x="97.4" y="140.0" font-size="12" fill="#b4232c">|S|</text>
  <text x="75.2" y="44.0" font-size="12" fill="#1d6fd1">|T|</text>
  <text x="288.6" y="122.0" font-size="12" fill="#1d6fd1">|T|</text>
</svg>
```

Look at the red bump above $0\ \mathrm{dB}$ around $28\ \mathrm{rad/s}$. That is the $1.15$ peak — the price, paid later in the module under the name **waterbed effect**, for pushing $|S|$ down at low frequency.
:::
