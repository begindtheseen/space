---
id: l02-pid-and-the-filtered-derivative
title: PID, term by term, and the derivative you can actually build
minutes: 17
covers:
  - 'PID control: the physical meaning of each term, ideal vs practical form, derivative filtering'
---

Something close to PID runs in almost every flight control loop ever built: the rate loops of a launch vehicle, the wheel-speed loop of a reaction wheel, the thermal loop that holds a propellant tank, the throttle loop on a landing burn. It survives because its three terms are the three things a loop can do with an error signal — respond to it now, remember it, and anticipate it — and because each term has a physical meaning an engineer can argue about with the propulsion team.

That familiarity hides a trap. The textbook controller $k_p + k_i/s + k_d s$ cannot be built, cannot be flown, and does not describe any PID that has ever run in flight software. Its derivative term has gain that rises without bound, so it is improper: it amplifies sensor noise forever and responds infinitely hard to a step command. Every real PID replaces $k_d s$ with a filtered derivative, and the filter changes the loop's phase where it matters most. This lesson gives the three terms their physical meaning, sets out the three algebraic forms you will meet in different documents, and then works out exactly what derivative filtering costs.

The two plants used throughout are the rate channel from the previous lesson, $G_\omega(s) = 1/\bigl(J s(\tau s + 1)\bigr)$ with $J = 1200\ \mathrm{kg\,m^2}$ and $\tau = 0.02\ \mathrm{s}$, and the attitude channel of the same vehicle, $G_\theta(s) = 1/(J s^2)$ — a rigid body with a torque in and an angle out.

## What each term does

**Proportional** feedback, $u = k_p e$, is a spring. Applied to the attitude plant it produces $J\ddot\theta = -k_p\theta$, the equation of an undamped oscillator with $\omega_n = \sqrt{k_p/J}$. Proportional gain is stiffness, in newton-metres per radian, and it sets how fast the loop is. It responds to the error that exists now and to nothing else, which is why on its own it leaves a steady error against a constant disturbance and no damping at all against a double integrator.

**Integral** feedback, $u = k_i\int e\,dt$, is memory. Its output keeps changing until the error is zero, so whatever constant disturbance the plant faces, the integrator finds the constant actuator command that cancels it and holds it there. That is the entire content of "integral action removes steady-state error". The cost is stated equally plainly in the frequency domain: $k_i/s$ contributes $-90^\circ$ of phase at every frequency and adds a pole at the origin, so an integrator always makes a loop less stable and slower to recover from a transient than the same loop without one.

**Derivative** feedback, $u = k_d\dot e$, is anticipation. Write the proportional-plus-derivative command as $k_p\bigl(e + T_d\dot e\bigr)$ with $T_d = k_d/k_p$: the bracket is the first-order extrapolation of the error $T_d$ seconds into the future. The controller acts on where the error is going rather than where it is. Against the attitude plant this is physically damping — the term is proportional to $\dot\theta$, which is exactly what a rate gyro measures — and it supplies the $2\zeta\omega_n s$ that proportional feedback cannot. In frequency terms $k_d s$ contributes $+90^\circ$ of phase, and phase lead near crossover is the currency of stability.

::: key
What each PID term physically does. **P**: stiffness, responds to present error; sets loop bandwidth, leaves steady-state error. **I**: removes steady-state error to constant disturbances, adds a pole at the origin and $90^\circ$ of lag. **D**: damping, predicts error $T_d = k_d/k_p$ seconds ahead, adds phase lead but amplifies noise.
:::

::: example PD on the attitude channel: stiffness and damping, sized
Close the attitude loop with $u = -(k_p\theta + k_d\dot\theta)$. The closed-loop equation is $J s^2 + k_d s + k_p = 0$, so matching $s^2 + 2\zeta\omega_n s + \omega_n^2$ gives $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$.

For $\omega_n = 2\ \mathrm{rad/s}$ and $\zeta = 0.7$: $k_p = 1200 \times 4 = 4800\ \mathrm{N\,m/rad}$ and $k_d = 2\times0.7\times2\times1200 = 3360\ \mathrm{N\,m\,s/rad}$. The overshoot to a step is $\exp\bigl(-\pi\zeta/\sqrt{1-\zeta^2}\bigr) = 4.6\%$ and the prediction horizon is $T_d = 3360/4800 = 0.70\ \mathrm{s}$.

Drop the derivative term and the closed-loop poles are $\pm j\sqrt{k_p/J} = \pm 2j$: the vehicle oscillates at $2\ \mathrm{rad/s}$, a $3.14\ \mathrm{s}$ period, and never settles. Every gust of disturbance torque adds energy that nothing removes. On a rigid body the derivative term is not a refinement; without it there is no damping mechanism in the loop at all.
:::

## Three forms, and why the difference matters

The same controller is written three ways, and a gain copied from one document into code that expects another is a real and recurring failure.

**Parallel (ideal) form** keeps the three gains independent:

$$
C(s) = k_p + \frac{k_i}{s} + k_d s .
$$

**Standard (ISA) form** factors out $k_p$ and expresses the other two as times:

$$
C(s) = k_p\left(1 + \frac{1}{T_i s} + T_d s\right),
\qquad T_i = \frac{k_p}{k_i}, \quad T_d = \frac{k_d}{k_p} .
$$

$T_i$ is the **integral time** — the time in which the integral term alone repeats the proportional term's contribution to a constant error — and $T_d$ is the **derivative time**, the prediction horizon above. Both are in seconds, which makes them easier to reason about against a vehicle's own time constants than raw gains are.

**Series (interacting) form** is what older hardware implemented and what some tuning rules assume:

$$
C(s) = k_c\left(1 + \frac{1}{T_i' s}\right)\bigl(1 + T_d' s\bigr).
$$

Multiplying out and matching coefficients with the standard form gives

$$
T_i = T_i' + T_d', \qquad T_d = \frac{T_i'T_d'}{T_i' + T_d'}, \qquad k_p = k_c\,\frac{T_i' + T_d'}{T_i'} .
$$

Going the other way, the series parameters are the roots of a quadratic and exist as real numbers only when $T_i \ge 4T_d$. A parallel PID with $T_i < 4T_d$ has complex zeros and no series equivalent at all. Note in passing that the classic Ziegler–Nichols PID settings sit exactly on that boundary, $T_i = 4T_d$, so their series form has a double zero.

::: warning
"$k_d$" in one tool and "$T_d$" in another differ by a factor of $k_p$, and a series-form $k_c$ differs from a parallel $k_p$ by $(T_i' + T_d')/T_i'$, which for a well-tuned loop is often close to 2. Before you type a gain into flight software, confirm which of the three forms the source used and whether its derivative acts on the error or on the measurement.
:::

## The derivative you cannot build

$k_d s$ is improper: its numerator degree exceeds its denominator degree, so $|k_d(j\omega)| = k_d\omega$ grows without bound. Three consequences follow, and all three are fatal in hardware.

It is not causal on its own. A differentiator's impulse response is not a function, and any digital implementation approximates it with a difference of samples — which is to say with a filter, whether you chose one or not.

It amplifies sensor noise without limit. Gyro and encoder noise is broadband; multiplying it by a gain rising at 20 dB/decade puts the loudest thing the actuator ever sees at the top of the noise band. For the attitude loop above, $k_d s$ has gain $3360 \times 100 = 3.36\times10^5\ \mathrm{N\,m/rad}$ at $100\ \mathrm{rad/s}$, and higher still above that.

It couples the loop to dynamics the model does not contain. Structural bending modes, actuator resonances and sampling effects all live at high frequency. An unbounded high-frequency gain guarantees the loop is closed around them.

The fix is one first-order pole:

$$
C(s) = k_p + \frac{k_i}{s} + \frac{k_d N s}{s + N} .
$$

Below $N$ the term behaves as $k_d s$; above $N$ its gain flattens at $k_d N$, and the whole controller's high-frequency gain is bounded by $k_p + k_d N$. The term's phase is $90^\circ - \arctan(\omega/N)$, so the lead it was bought for is progressively given back as $\omega$ approaches $N$.

::: key
Practical (filtered-derivative) PID: $C(s) = k_p + k_i/s + k_d N s/(s + N)$, with $N \sim 10\text{--}20$. The filter makes the controller proper and bounds high-frequency gain at $k_p + k_d N$.
:::

::: warning
Two conventions share the letter $N$. In the parallel form above, $N$ is a frequency in rad/s and the filter pole sits at $N$. In the ISA form the same filter is written $T_d s/\bigl(1 + (T_d/N)s\bigr)$ with $N$ dimensionless, and the pole sits at $N/T_d$ rad/s. The algebra is identical — both are $k_d N' s/(s + N')$ for some pole $N'$ — but the number means different things. Check which one a specification intends before choosing $N = 15$.
:::

::: example What the filter costs the attitude loop
Take the PD loop above, $k_p = 4800$, $k_d = 3360$, $J = 1200$, and replace $k_d s$ with $k_d N s/(s+N)$. Sweeping $N$ and computing the loop's margins numerically:

| $N$ (rad/s) | $\omega_{gc}$ (rad/s) | phase margin | HF gain $k_p + k_dN$ | torque from $0.01^\circ$ rms noise |
| --- | --- | --- | --- | --- |
| 5 | 3.21 | 38.2° | 21 600 | 3.8 N·m |
| 10 | 3.26 | 51.0° | 38 400 | 6.7 N·m |
| 20 | 3.21 | 58.3° | 72 000 | 12.6 N·m |
| 100 | 3.12 | 63.9° | 340 800 | 59.5 N·m |
| ideal $k_ds$ | 3.09 | 65.2° | unbounded | unbounded |

Crossover barely moves; the phase margin moves a great deal. At $N = 10\ \mathrm{rad/s}$, three times the $3.26\ \mathrm{rad/s}$ crossover, the filter has given back $14.2^\circ$ of the derivative's lead. At $N = 5$ it has given back $27^\circ$ and the loop is no longer a loop you would fly. Meanwhile each doubling of $N$ doubles the torque the actuator is asked to produce in response to pure sensor noise.

There is no correct answer, only a trade: put the filter pole three to ten times above crossover, then check that the noise-driven actuator torque is a small fraction of the authority you have. Here $N = 20$ costs $6.9^\circ$ and asks for $12.6\ \mathrm{N\,m}$ of noise chatter; if the vehicle has a 500 N·m gimbal that is comfortable, and if it has a 0.2 N·m reaction wheel it is not.
:::

## The practical PID on the rate channel

The rate loop of the previous lesson used PI alone: $k_p = 12\,000\ \mathrm{N\,m\,s/rad}$, $k_i = 24\,000\ \mathrm{N\,m/rad}$, so $T_i = 0.5\ \mathrm{s}$, giving crossover at $10.0\ \mathrm{rad/s}$ with $67.4^\circ$ of phase margin. Adding $k_d = 600\ \mathrm{N\,m\,s^2/rad}$ ($T_d = 0.05\ \mathrm{s}$) with $N = 15\ \mathrm{rad/s}$ moves crossover to $12.95\ \mathrm{rad/s}$ and the phase margin to $84.8^\circ$, with the controller's high-frequency gain bounded at $12\,000 + 600\times15 = 21\,000$.

A phase margin of $85^\circ$ is not a better loop than one of $67^\circ$; it is a loop that is being held back. All that lead is available to buy bandwidth instead, and the next lessons spend it deliberately rather than banking it. The reason to notice the number now is that it tells you the derivative term is doing real work on this plant even though the plant is benign.

```python
import numpy as np

kp, ki, kd, N, J, tau = 12000.0, 24000.0, 600.0, 15.0, 1200.0, 0.02
num = np.array([kp + kd * N, kp * N + ki, ki * N])
den = np.convolve([1.0, N, 0.0], [J * tau, J, 0.0])
w = np.logspace(-2, 4, 600001)
L = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
i = np.argmin(abs(abs(L) - 1.0))
print(round(w[i], 3), round(180 + np.degrees(np.angle(L[i])), 2))
# 12.952 84.79
```

::: note
Almost every flight PID takes the derivative of the *measurement*, not of the error: $u = k_p e + k_i\!\int\! e\,dt - k_d\,\dot y_f$, where $y_f$ is the filtered measurement. A step change in the command then produces no derivative impulse — no "derivative kick" — while the damping behaviour is unchanged, because for a constant setpoint $\dot e = -\dot y$. This is the simplest case of setpoint weighting, and the next lesson treats the general version along with the other things that go wrong between a clean controller and flight code.
:::

## Check yourself

::: check
A reaction wheel holds a 900 kg·m² spacecraft axis. You want a PD attitude loop with $\omega_n = 0.5\ \mathrm{rad/s}$ and $\zeta = 0.8$. Find $k_p$, $k_d$, $T_d$ and the overshoot.
:::

::: answer
$k_p = J\omega_n^2 = 900 \times 0.25 = 225\ \mathrm{N\,m/rad}$ and $k_d = 2\zeta\omega_n J = 2\times0.8\times0.5\times900 = 720\ \mathrm{N\,m\,s/rad}$. The derivative time is $T_d = k_d/k_p = 3.2\ \mathrm{s}$, meaning the controller acts on the error it predicts 3.2 s ahead — long, but appropriate for a loop whose own period is $2\pi/0.5 = 12.6\ \mathrm{s}$. Overshoot is $\exp\bigl(-\pi\times0.8/\sqrt{1-0.64}\bigr) = \exp(-4.189) = 1.5\%$.
:::

::: check
Why does adding integral action always reduce the phase margin of a loop whose gains are otherwise unchanged, and what does that mean for the crossover frequency you can achieve?
:::

::: answer
The term $k_i/s$ has phase $-90^\circ$ at every frequency, so the combination $k_p + k_i/s$ has phase $-\arctan\bigl(k_i/(k_p\omega)\bigr)$, which is negative everywhere and approaches $-90^\circ$ as $\omega \to 0$. Adding it to a loop subtracts phase at crossover, so the phase margin falls unless something else is changed. The amount depends on how far the integral corner $1/T_i$ sits below crossover: at $\omega T_i = 10$ the lag is $5.7^\circ$, at $\omega T_i = 2$ it is $26.6^\circ$. To keep a target phase margin you either place $1/T_i$ well below crossover, accepting slower disturbance rejection, or you buy the phase back with derivative action.
:::

::: check
A PID is specified in standard form with $k_p = 50$, $T_i = 2\ \mathrm{s}$, $T_d = 0.4\ \mathrm{s}$. Give the parallel gains, and find the series-form parameters if they exist.
:::

::: answer
Parallel: $k_i = k_p/T_i = 25$ and $k_d = k_pT_d = 20$. For the series form, $T_i' + T_d' = T_i = 2$ and $T_i'T_d'/(T_i'+T_d') = T_d = 0.4$, so $T_i'T_d' = 0.8$. The two are roots of $x^2 - 2x + 0.8 = 0$, i.e. $x = 1 \pm \sqrt{0.2} = 1.447$ and $0.553$. The condition $T_i \ge 4T_d$ holds ($2 \ge 1.6$), so real roots exist: $T_i' = 1.447\ \mathrm{s}$, $T_d' = 0.553\ \mathrm{s}$, and $k_c = k_pT_i'/(T_i'+T_d') = 50\times1.447/2 = 36.2$. Had $T_d$ been $0.6\ \mathrm{s}$, $T_i = 2 < 4T_d = 2.4$, the quadratic would have complex roots and no series form would exist.
:::

::: check
An engineer raises $N$ from 10 rad/s to 100 rad/s to "get a cleaner derivative", leaving all gains unchanged. What improves, what gets worse, and what stays about the same?
:::

::: answer
The phase margin improves, because the filter's lag at crossover falls from $\arctan(\omega_{gc}/10)$ to $\arctan(\omega_{gc}/100)$ — for the attitude loop of the example, from $51.0^\circ$ to $63.9^\circ$ of phase margin. What gets worse is everything above the old corner: the controller's high-frequency gain rises from $k_p + 10k_d$ to $k_p + 100k_d$, a factor of nearly 9 in this case, so noise-driven actuator torque rises by the same factor and any unmodelled resonance now sits inside a loop with nine times the gain. Crossover itself barely moves, from 3.26 to 3.12 rad/s, because the filter's effect on magnitude near crossover is small. The change is a straight trade of high-frequency gain for phase, and whether it is a good trade depends on what lives up there.
:::

::: check
The attitude loop's derivative term is implemented as a backward difference of the measured angle, $\bigl(\theta_k - \theta_{k-1}\bigr)/h$, at $h = 0.01\ \mathrm{s}$, with no explicit filter. Is the derivative unfiltered?
:::

::: answer
No. A backward difference has frequency response $\bigl(1 - e^{-j\omega h}\bigr)/h$, whose magnitude is $\bigl|2\sin(\omega h/2)\bigr|/h$. That matches $\omega$ at low frequency but saturates at $2/h = 200\ \mathrm{rad/s}$ and then falls back, rather than growing without bound. The difference operator is therefore a filter chosen by the sample rate rather than by the designer, with its corner near the Nyquist frequency — far too high to protect the actuator from noise, and placed where you have no control over it. This is the usual argument for an explicit filter: not that the implicit one does not exist, but that it is in the wrong place and moves whenever somebody changes the sample rate.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| P term | stiffness; $k_p = J\omega_n^2$ for the attitude plant; leaves steady-state error |
| I term | memory; removes steady-state error; adds a pole at the origin and $90^\circ$ lag |
| D term | damping and prediction $T_d$ seconds ahead; $+90^\circ$ phase; amplifies noise |
| Parallel form | $C = k_p + k_i/s + k_d s$ |
| Standard (ISA) form | $C = k_p\bigl(1 + 1/(T_is) + T_ds\bigr)$, $T_i = k_p/k_i$, $T_d = k_d/k_p$ |
| Series form | $k_c(1 + 1/(T_i's))(1 + T_d's)$; $T_i = T_i'+T_d'$, $T_d = T_i'T_d'/(T_i'+T_d')$; real only if $T_i \ge 4T_d$ |
| Practical PID | $C = k_p + k_i/s + k_dNs/(s+N)$, $N \sim 10\text{--}20$ |
| High-frequency gain | bounded at $k_p + k_dN$ |
| Filter phase penalty | derivative term's phase is $90^\circ - \arctan(\omega/N)$ |
| Attitude example | $k_p = 4800$, $k_d = 3360$; $\omega_n = 2\ \mathrm{rad/s}$, $\zeta = 0.7$, 4.6% overshoot |
| Rate example | $k_p = 12\,000$, $k_i = 24\,000$, $k_d = 600$, $N = 15$: $\omega_{gc} = 12.95\ \mathrm{rad/s}$, PM $84.8^\circ$ |

The next lesson takes this controller to the actuator's limits, where the integrator stops helping and starts causing the overshoot it was supposed to prevent.
