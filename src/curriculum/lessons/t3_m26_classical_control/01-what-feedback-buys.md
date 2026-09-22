---
id: l01-what-feedback-buys
title: What feedback buys, and what it costs
minutes: 20
covers:
  - 'Feedback fundamentals: disturbance rejection, noise attenuation, insensitivity to plant variation'
---

A launch vehicle flies with an engine whose thrust is misaligned by a fraction of a degree, through a wind field nobody measured, carrying an inertia tensor known to perhaps ten per cent, with gyros that add noise to every measurement. None of that is in the model the control engineer designed against, and all of it is in the vehicle. Feedback is the mechanism that lets a controller built from the wrong model fly the right trajectory anyway.

This lesson establishes what feedback does and, equally important, what it cannot do. Three benefits carry almost the whole justification for closing a loop: it rejects disturbances the model never contained, it makes the closed-loop behaviour insensitive to errors in the plant model, and it does both while letting you choose how much sensor noise reaches the actuator. The three are not independent. They are governed by two transfer functions, the sensitivity $S$ and the complementary sensitivity $T$, which the signals and systems module introduced and which satisfy $S + T = 1$ at every frequency. Every design decision in the rest of this module is a decision about where to put $S$ small and where to put $T$ small.

The running example for the next several lessons is the rate channel of a vehicle with pitch inertia $J = 1200\ \mathrm{kg\,m^2}$ driven through an actuator with a $\tau = 0.02\ \mathrm{s}$ lag:

$$
G(s) = \frac{\omega(s)}{T_c(s)} = \frac{1}{J s\,(\tau s + 1)},
$$

with $T_c$ the commanded torque in $\mathrm{N\,m}$ and $\omega$ the body rate in $\mathrm{rad/s}$. It is the plant the module's PID exercise uses, and it is the simplest plant on which every idea here is visible.

## The four transfer functions

Draw the loop honestly, with every place a real signal enters. Let $r$ be the commanded rate, $n$ the gyro noise added to the measurement, $d_i$ a torque disturbance entering at the plant input, and $d_o$ a disturbance added at the plant output. The controller sees $e = r - (y + n)$ and produces $u = C(s)e$; the plant produces $y = G(s)(u + d_i) + d_o$. Substituting and collecting,

$$
y = T\,r + S\,d_o + G S\,d_i - T\,n,
\qquad
L = GC, \quad S = \frac{1}{1 + L}, \quad T = \frac{L}{1 + L}.
$$

$L$ is the **loop transfer function** (what a signal is multiplied by on one trip around the loop with the loop cut), $S$ the **sensitivity** and $T$ the **complementary sensitivity**. The actuator command works out to

$$
u = CS\,(r - d_o - n) - T\,d_i,
\qquad
CS = \frac{C}{1 + L} = \frac{T}{G}.
$$

Four distinct transfer functions — $S$, $T$, $GS$ and $CS$ — decide everything the loop does. Designing a controller is choosing their shapes.

Two facts follow directly from the definitions and are worth committing to memory. First, $S + T = 1$ identically, at every frequency, for every loop: you cannot make both small at the same frequency, so you place them in different frequency bands. Second, $S$ is small exactly where $|L|$ is large, because $|S| \approx 1/|L|$ when $|L| \gg 1$, and $T \approx 1$ there; above crossover $|L| \ll 1$, so $T \approx L$ and $S \approx 1$.

::: key
$L = GC$, $S = 1/(1+L)$, $T = L/(1+L)$, and $S + T = 1$ at every frequency. Output disturbances and reference tracking go through $S$; sensor noise and input disturbances reach the output through $T$; the actuator sees $CS = T/G$. Where $|L| \gg 1$: $|S| \approx 1/|L|$ and $T \approx 1$. Where $|L| \ll 1$: $S \approx 1$ and $T \approx L$.
:::

## Disturbance rejection

A constant torque disturbance is the everyday case: thrust-vector misalignment, aerodynamic trim torque, solar pressure, a leaking thruster. Open loop, the plant integrates it forever. Closed loop, the rate error it produces is $GS\,d_i$, and the steady-state value for a constant $d_i$ is

$$
\lim_{s \to 0} \frac{G(s)}{1 + C(s)G(s)} = \lim_{s\to 0}\frac{1}{1/G(s) + C(s)}.
$$

For this plant $1/G(0) = 0$, so the limit is $1/C(0)$. Proportional control leaves a residual rate error of $d_i/k_p$; a controller with an integrator has $C(0) = \infty$ and leaves none. That is the whole argument for integral action, and it is a statement about $|S|$ at low frequency rather than about the time domain.

::: example A 50 N·m trim torque on the rate channel
Take a constant $d_i = 50\ \mathrm{N\,m}$ from thrust misalignment. With no feedback the vehicle accelerates at $50/1200 = 0.0417\ \mathrm{rad/s^2}$, so after ten seconds the rate is $0.417\ \mathrm{rad/s} = 23.9^\circ/\mathrm{s}$ and still climbing.

Close a proportional loop with $k_p = 12\,000\ \mathrm{N\,m\,s/rad}$ (chosen in the next section because $k_p/J = 10\ \mathrm{rad/s}$ sets the crossover). The steady-state rate error is $d_i/k_p = 50/12\,000 = 4.17\times 10^{-3}\ \mathrm{rad/s} = 0.239^\circ/\mathrm{s}$ — bounded, but permanent, and the controller is holding $50\ \mathrm{N\,m}$ of torque by carrying that error.

Now add integral action, $C(s) = k_p + k_i/s$ with $k_i = 24\,000\ \mathrm{N\,m/rad}$. Then

$$
L(s) = \frac{k_p s + k_i}{J s^2(\tau s + 1)} = \frac{500\,(s + 2)}{s^2\,(s + 50)},
$$

and the disturbance-to-rate transfer function becomes $GS = s/\bigl(24\,(s^3 + 50 s^2 + 500 s + 1000)\bigr)$. The factor $s$ in the numerator is the integrator doing its job: the DC gain is zero. Simulating the 50 N·m step, the rate error peaks at $3.41\times10^{-3}\ \mathrm{rad/s} = 0.195^\circ/\mathrm{s}$ at $t = 0.21\ \mathrm{s}$, then decays to under 2% of that peak by $1.8\ \mathrm{s}$. The transient is about the same size as the proportional loop's permanent error; the difference is that it goes away.
:::

## Insensitivity to plant variation

The second benefit is the one that gives $S$ its name. Suppose the true plant is $G + \delta G$ rather than $G$. Differentiate $T = GC/(1 + GC)$ with respect to $G$:

$$
\frac{dT}{dG} = \frac{C(1 + GC) - GC\cdot C}{(1+GC)^2} = \frac{C}{(1 + L)^2},
$$

so the fractional change in $T$ per fractional change in $G$ is

$$
\frac{dT/T}{dG/G} = \frac{G}{T}\cdot\frac{C}{(1+L)^2} = \frac{1}{1 + L} = S .
$$

The sensitivity function is literally the sensitivity of the closed-loop response to relative plant error. Where $|S|$ is 0.05, a 20% plant error moves the closed-loop response by 1%. Where $|S|$ is 1 — above crossover — the closed loop inherits the plant error in full. Feedback does not make a system robust everywhere; it makes it robust exactly where the loop gain is high.

::: example A 30% inertia error
Propellant load, tank sloshing and a payload mass that grew during integration all move $J$. Suppose the flight vehicle has $J = 1560\ \mathrm{kg\,m^2}$, 30% above the design value, with the gains unchanged. Since $G \propto 1/J$, the relative plant error is $\delta G/G = -0.3/1.3 = -23.1\%$ at every frequency.

At $\omega = 1\ \mathrm{rad/s}$ the nominal loop has $|L| = 22.4$ and $|S| = 0.047$. The predicted change in $|T|$ is about $0.047 \times 23.1\% = 1.1\%$; recomputing $T$ exactly gives $1.26\%$. At $\omega = 10\ \mathrm{rad/s}$, the crossover, $|S| = 0.90$ and the exact change is $-14.7\%$. The relation $dT/T = S\,dG/G$ is a derivative, so it is accurate for small perturbations — at $\delta G/G = -1\%$ the exact figures are 0.0466% and 0.897% against predictions of 0.0461% and 0.893% — and only indicative for a 23% one. The shape of the conclusion holds either way: below crossover the error is suppressed by the loop gain, near and above crossover it passes straight through.

The margins move too, though less than you might fear. Crossover falls from $10.0$ to $7.84\ \mathrm{rad/s}$ because $|L|$ dropped by 2.3 dB, and the phase margin goes from $67.4^\circ$ to $66.8^\circ$. The loop is slower on the heavy vehicle but no less stable, because the phase curve is flat near crossover.
:::

## Noise attenuation, and the price of the loop

Sensor noise reaches the output through $-T$ and the actuator through $-CS$. Since $T \approx 1$ below crossover, noise inside the control band is reproduced at the output essentially unattenuated — there is nothing feedback can do about a gyro that lies slowly, which is why sensor bias, not loop design, sets the ultimate pointing accuracy. Above crossover $T$ rolls off and high-frequency noise is suppressed at the output. The actuator, however, sees $CS \to C$ as $|L| \to 0$, so a controller with high gain at high frequency pumps noise straight into the hardware whatever $T$ does.

For this loop $|C| \to k_p = 12\,000$ at high frequency. A rate gyro with $0.01^\circ/\mathrm{s} = 1.75\times10^{-4}\ \mathrm{rad/s}$ of broadband noise therefore produces about $12\,000 \times 1.75\times10^{-4} = 2.1\ \mathrm{N\,m}$ rms of torque command chatter. Against a 50 N·m trim torque that is acceptable; against a reaction wheel with 0.2 N·m of authority it would not be. Noise-to-actuator is a hardware sizing constraint, not a nuisance.

Feedback costs three other things, and they are the subject of most of this module:

- **It can destabilise a stable plant.** Around the loop, gain and phase conspire: if $L(j\omega) = -1$ at some frequency the closed loop has a pole on the imaginary axis. Nothing in the open-loop system had that property.
- **It cannot reduce $|S|$ everywhere.** The Bode sensitivity integral, treated later in this module, shows that pushing $|S|$ below 1 in the control band forces $|S| > 1$ somewhere else. For this loop the peak is $\lVert S\rVert_\infty = 1.151$ at $28\ \mathrm{rad/s}$: disturbances near 28 rad/s are amplified 15% by the very loop that suppresses them a hundredfold at 1 rad/s.
- **It costs actuator authority and bandwidth.** Everything the loop rejects, the actuator produces.

::: warning
"High gain is good" is true only inside the band where the loop is honest about the plant. Raising $k_p$ lowers $|S|$ at low frequency and raises crossover, but crossover cannot be pushed past the frequency where the model stops describing the hardware — the actuator lag, an unmodelled bending mode, a computational delay. A loop that crosses over where the model is wrong is a loop whose stability you have not actually analysed.
:::

## Reading the numbers off the loop

The table below is the nominal PI loop, $L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$, sampled across the band. It is worth reading as a single picture: $|S|$ climbing from $-66\ \mathrm{dB}$ toward 0 dB as $|L|$ falls, $|T|$ doing the reverse, and the two crossing at $-0.9\ \mathrm{dB}$ at the gain crossover, where $|L| = 1$ and the two are equal in magnitude.

| $\omega$ (rad/s) | $\lvert L\rvert$ (dB) | $\lvert S\rvert$ (dB) | $\lvert T\rvert$ (dB) |
| --- | --- | --- | --- |
| 0.1 | 66.0 | −66.0 | 0.00 |
| 1 | 27.0 | −26.6 | 0.36 |
| 5 | 6.6 | −5.6 | 1.04 |
| 10 | 0.0 | −0.90 | −0.90 |
| 20 | −6.6 | 1.04 | −5.6 |
| 50 | −17.0 | 0.90 | −16.1 |
| 100 | −27.0 | 0.36 | −26.6 |

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

::: note
The specification a real project writes is almost never "put a pole here". It is a bound on $|S|$ below some frequency (disturbance rejection), a bound on $|T|$ above some frequency (noise and unmodelled dynamics), and a bound on $\lVert S\rVert_\infty$ (robustness). Classical design meets those bounds by shaping $|L|$, because $S$ and $T$ are both determined by $L$. That is the whole of loop shaping.
:::

## Check yourself

::: check
A loop has $|L(j\omega)| = 40\ \mathrm{dB}$ at $\omega = 0.5\ \mathrm{rad/s}$. Estimate $|S|$ and $|T|$ there. By what factor is a 0.5 rad/s output disturbance attenuated?
:::

::: answer
$40\ \mathrm{dB}$ is a factor of 100, so $|L| \gg 1$ and $|S| \approx 1/|L| = 0.01$, i.e. $-40\ \mathrm{dB}$, while $|T| = |1 - S| \approx 1$. An output disturbance at that frequency appears at the output multiplied by $S$, so it is attenuated by a factor of about 100. The approximation is good to a per cent or so here; exactly, $|S| = 1/|1 + L|$, which differs from $1/|L|$ by at most 1% when $|L| = 100$.
:::

::: check
Why does adding an integrator to the controller eliminate the steady-state error to a constant input disturbance, and what does it do to $|S|$ at low frequency?
:::

::: answer
The steady-state rate error to a constant input disturbance is $\lim_{s\to0} G/(1+CG) = \lim_{s\to0} 1/\bigl(1/G + C\bigr)$. An integrator makes $C(s) \to \infty$ as $s \to 0$, so the limit is zero whatever the plant does. In frequency terms $|L| \to \infty$ as $\omega \to 0$, so $|S| = 1/|1+L| \to 0$: the sensitivity function acquires a zero at the origin. Every "type" argument about steady-state error is a statement about the order of the zero $S$ has at $s = 0$.
:::

::: check
The rate loop of the examples is flown on a vehicle whose actuator turns out to be 20% weaker than modelled (the same as a 20% drop in loop gain). Using the sensitivity relation, estimate the fractional change in the closed-loop response at $\omega = 1\ \mathrm{rad/s}$ and at $\omega = 20\ \mathrm{rad/s}$, where $|S| = 1.13$.
:::

::: answer
At $1\ \mathrm{rad/s}$, $|S| = 0.047$, so $|dT/T| \approx 0.047 \times 0.20 = 0.94\%$ — negligible. At $20\ \mathrm{rad/s}$, $|S| = 1.13$, so $|dT/T| \approx 1.13 \times 0.20 = 23\%$: the closed loop is more sensitive to the plant error than the plant itself is, because $|S| > 1$ there. This is the waterbed effect showing up as a robustness statement, and it is the reason a loop is never certified on its low-frequency behaviour alone.
:::

::: check
An engineer proposes cutting gyro noise at the output by lowering the controller's high-frequency gain. Will that also reduce the noise the actuator sees? Which transfer function governs each?
:::

::: answer
Noise reaches the output through $T$ and the actuator through $CS$. Above crossover $|T| \approx |L| = |GC|$ and $|CS| \approx |C|$. Lowering $|C|$ at high frequency reduces both, so the proposal works for both — but the two do not scale the same way, since $|T|$ also carries the plant roll-off $|G|$ while $|CS|$ does not. A plant that rolls off steeply protects the output from noise all by itself; nothing protects the actuator except the controller's own high-frequency gain. That asymmetry is why the derivative term of a PID is always filtered.
:::

::: check
Explain why $S + T = 1$ makes "reject all disturbances and ignore all noise" impossible, and how a designer lives with it.
:::

::: answer
At any single frequency, $S(j\omega) + T(j\omega) = 1$, so $|S|$ and $|T|$ cannot both be much less than one there: if $|S| = 0.01$ then $T = 1 - S$ has magnitude at least 0.99. Good disturbance rejection at a frequency guarantees full noise transmission at that frequency, and vice versa. The resolution is frequency separation: make $|S|$ small in the band where disturbances live (low frequency, where wind, trim torques and mass shifts act) and $|T|$ small in the band where noise and unmodelled dynamics live (high frequency), and accept that near crossover both are about one. Choosing where that transition sits is what choosing a bandwidth means.
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
| 50 N·m trim torque | proportional loop: $0.239^\circ/\mathrm{s}$ forever; PI loop: $0.195^\circ/\mathrm{s}$ peak, gone in 1.8 s |

The next lesson gives that controller a name and a structure. PID is the form that almost every flight loop takes, and each of its three terms has a job you can now state in terms of $S$ and $T$.
