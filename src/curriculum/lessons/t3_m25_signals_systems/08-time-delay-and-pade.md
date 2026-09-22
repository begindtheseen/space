---
id: l08-time-delay-and-pade
title: Time delay and the Padé approximation
minutes: 17
covers:
  - "Time delay and the Pade approximation"
---

Every loop on a modern vehicle is closed through a computer, and a computer is slow. The gyro is sampled, the sample waits for the control frame, the frame takes some milliseconds to run, the command goes out on a bus, the actuator's own electronics take a frame of their own, and the nozzle finally moves — tens of milliseconds after the motion that provoked it. That accumulated lateness is a **pure time delay**, and it behaves unlike anything else in this module.

The reason it deserves its own lesson is that a delay is pure cost. A pole at least buys you attenuation in exchange for its phase lag; a delay attenuates nothing and takes phase without limit. Worse, it takes the most phase at the highest frequencies, which is exactly where a loop's stability is decided. Almost every "we had to detune the loop in flight" story has a delay at the bottom of it, and almost every one of those delays was known and written down before flight, in a table nobody added up.

The second half of the lesson deals with a practical nuisance: $e^{-sT}$ is not a ratio of polynomials, so it has no poles, no zeros, no state-space form and no place on a root locus. The standard repair is the **Padé approximation**, and the shape of that approximation — a right-half-plane zero — is the correct intuition about what a delay does to you, which is why this lesson follows lesson 7 rather than preceding it.

## Where the delay comes from

A digital loop's delay is a sum of contributions, each of which you can measure or bound:

- **Sampling and the zero-order hold.** A command held constant over a sample period $T_s$ is, on average, half a period late: $T_s/2$.
- **Computation latency.** If the control law reads a sample at the start of a frame and writes its output at the end, that is one full $T_s$. Pipelined architectures can be worse.
- **Bus transport.** A message on a serial data bus waits for its slot; a few milliseconds is typical.
- **Actuator and sensor electronics.** Their own sampling, filtering and drive stages.
- **Anti-alias and structural filters.** Not a true delay, but near their pass band a filter's phase is close to linear in frequency and it acts like one. The **group delay** $-d\phi/d\omega$ is the right measure: a first-order lag of time constant $\tau$ has group delay $\tau$ at low frequency, and a second-order actuator has $2\zeta/\omega_n$.

The last point matters for bookkeeping. The $10\,\mathrm{Hz}$, $\zeta = 0.7$ thrust-vector actuator of lesson 2 has a low-frequency group delay of $2(0.7)/62.83 = 22.3\,\mathrm{ms}$, and at $5\,\mathrm{rad/s}$ its phase is $-6.40^\circ$ against the $-6.38^\circ$ that a $22.3\,\mathrm{ms}$ pure delay would give. Below its corner, an actuator *is* a delay as far as the loop can tell.

## The transform of a delay

If $y(t) = u(t - T)$ with $u$ zero before $t = 0$, substitute $\eta = t - T$ in the transform integral:

$$
Y(s) = \int_0^\infty u(t - T)e^{-st}\,dt = \int_0^\infty u(\eta)e^{-s(\eta + T)}\,d\eta = e^{-sT}U(s).
$$

So delay by $T$ is multiplication by $e^{-sT}$. On the imaginary axis,

$$
\left\lvert e^{-j\omega T}\right\rvert = 1, \qquad \angle e^{-j\omega T} = -\omega T.
$$

::: key
Phase lag from a pure time delay: $\phi(\omega) = -\omega T$ radians $= -57.3\,\omega T$ degrees. Magnitude is unchanged at every frequency. At $5\,\mathrm{rad/s}$ a $50\,\mathrm{ms}$ delay costs $14.3^\circ$.
:::

Three consequences, and each one is a habit worth forming.

**The magnitude plot is untouched.** A delay is invisible on a Bode magnitude plot and invisible in a step response's final value. If you identify a plant from magnitude data alone you will miss it entirely.

**The phase falls without bound.** A first-order lag saturates at $-90^\circ$; a delay passes $-90^\circ$ at $\omega = \pi/(2T)$, $-180^\circ$ at $\pi/T$, and keeps going. There is no frequency beyond which the delay has "done its worst".

**Reducing the gain does not help the phase.** Lowering the loop gain moves the gain crossover frequency down, and *that* is what reduces the delay's phase penalty — $\omega_cT$ falls because $\omega_c$ falls. The delay itself is untouched. So the only defence against delay is a slower loop, which is the same conclusion as for a right-half-plane zero and for the same reason.

::: warning
A delay is not a lag and must not be modelled as one. Compare $e^{-0.05s}$ with $1/(1 + 0.05s)$ at $20\,\mathrm{rad/s}$: the delay has magnitude 1 and phase $-57.3^\circ$; the lag has magnitude $1/\sqrt{1 + 1} = 0.707$ and phase $-45^\circ$. The lag understates the phase and invents $3\,\mathrm{dB}$ of attenuation that the real loop will not get. Substituting a lag for a delay is the standard way to produce a design that is stable in simulation and marginal in the vehicle.
:::

## How much delay a loop can take

Two pieces of frequency-domain vocabulary, which lesson 9 develops properly. The **gain crossover frequency** $\omega_c$ of a loop transfer function $L(s)$ is the frequency at which $\lvert L(j\omega_c)\rvert = 1$. The **phase margin** is how much phase lag you could add there before the phase reaches $-180^\circ$:

$$
\mathrm{PM} = 180^\circ + \angle L(j\omega_c).
$$

A delay adds exactly $-\omega_cT$ of phase at crossover, and (to first order, since the magnitude is unchanged, so $\omega_c$ does not move) it eats the phase margin directly. Setting the two equal gives the **delay margin**:

$$
T_{\max} = \frac{\mathrm{PM}\ \text{in radians}}{\omega_c}.
$$

This is the single most useful number to have for a digital loop. It converts a phase margin, which is abstract, into milliseconds, which a software lead can be held to.

::: example A launch-vehicle TVC delay budget
The flight computer runs its attitude law at $100\,\mathrm{Hz}$, so $T_s = 10\,\mathrm{ms}$. The budget:

| Contribution | Delay |
| --- | --- |
| zero-order hold, $T_s/2$ | $5.0\,\mathrm{ms}$ |
| computation, one frame | $10.0\,\mathrm{ms}$ |
| data bus transport | $2.0\,\mathrm{ms}$ |
| actuator electronics transport | $8.0\,\mathrm{ms}$ |
| **total** | $25.0\,\mathrm{ms}$ |

What does $25\,\mathrm{ms}$ cost? At an attitude-loop crossover of $1\,\mathrm{rad/s}$, $\phi = -57.3(1)(0.025) = -1.43^\circ$ — nothing. At a rate-loop crossover of $5\,\mathrm{rad/s}$, $-7.16^\circ$ — worth carrying in the phase budget. At $8\,\mathrm{rad/s}$, $-11.5^\circ$ — a fifth of a typical phase-margin allowance, spent on latency.

The same number read the other way: the first-order Padé approximation below puts a right-half-plane zero at $2/T = 80\,\mathrm{rad/s}$, and lesson 7's rule $\omega_c < z/2$ becomes $\omega_c < 1/T = 40\,\mathrm{rad/s}$. That is the absolute ceiling this latency imposes, regardless of the plant, the actuator or the controller — and a real design with margins sits a factor of three or four below it.
:::

::: example How much delay a rate loop tolerates
A rate loop has $L(s) = \dfrac{50}{s(s + 5)}$ under unity feedback. Gain crossover: $\lvert L\rvert = 50/\left(\omega\sqrt{\omega^2 + 25}\right) = 1$ gives $\omega^2(\omega^2 + 25) = 2500$, so with $x = \omega^2$, $x^2 + 25x - 2500 = 0$ and $x = 39.04$, $\omega_c = 6.248\,\mathrm{rad/s}$. The phase there is $-90^\circ - \arctan(6.248/5) = -141.33^\circ$, so $\mathrm{PM} = 38.67^\circ = 0.6749\,\mathrm{rad}$.

Delay margin:

$$
T_{\max} = \frac{0.6749}{6.248} = 0.108\,\mathrm{s} = 108\,\mathrm{ms}.
$$

Check it by simulation. Integrating the closed loop with an explicit delay in the feedback path and a unit step command:

| $T$ | behaviour |
| --- | --- |
| 0 | settles at 1.000, peak 1.305 |
| $50\,\mathrm{ms}$ | settles at 1.000, peak 1.574 |
| $108\,\mathrm{ms}$ | sustained oscillation between $-0.06$ and $2.06$, period $1.0\,\mathrm{s}$ |
| $150\,\mathrm{ms}$ | divergent |

At the predicted delay margin the loop oscillates without decaying, at a period of $2\pi/6.248 = 1.006\,\mathrm{s}$ — the crossover frequency, as the theory says, because that is where the phase reaches $-180^\circ$. Below it the loop is stable with reduced damping (the $50\,\mathrm{ms}$ case has lost $17.9^\circ$ of margin and its overshoot has grown from 30% to 57%); above it the loop diverges.

Two readings. First, $108\,\mathrm{ms}$ sounds generous until you notice that the budget in the previous example was $25\,\mathrm{ms}$ before anyone added telemetry, redundancy voting or a filter — a quarter of the allowance gone on infrastructure. Second, the tolerance scales as $1/\omega_c$: double the loop bandwidth and the delay you can absorb halves.
:::

## The Padé approximation

Root locus, pole placement, state-space design and most simulation tools need a rational transfer function. $e^{-sT}$ is not one — it is an entire function with no poles and no zeros, and a system containing it has infinitely many characteristic roots. The **Padé approximation** replaces it with a ratio of polynomials matching as many terms of the Taylor series as possible.

The first-order case has a one-line derivation. Split the delay in half and use the first two terms of each exponential:

$$
e^{-sT} = \frac{e^{-sT/2}}{e^{+sT/2}} \approx \frac{1 - sT/2}{1 + sT/2}.
$$

::: key
First-order Padé approximation of a delay: $e^{-sT} \approx \dfrac{1 - sT/2}{1 + sT/2}$. It reproduces the phase lag with a right-half-plane zero — which is exactly the right intuition about delay.
:::

Look at what that expression is. It is the all-pass factor of lesson 7, with $z = 2/T$: magnitude exactly 1 at every frequency, matching the delay exactly, and phase $-2\arctan(\omega T/2)$ against the true $-\omega T$. A delay *is* a non-minimum-phase element, and the bandwidth limit it imposes is the right-half-plane-zero limit in disguise.

The second-order approximation matches two more series terms:

$$
e^{-sT} \approx \frac{1 - sT/2 + (sT)^2/12}{1 + sT/2 + (sT)^2/12},
$$

also all-pass, with a right-half-plane zero pair. Accuracy of both, in phase:

| $\omega T$ | exact | first-order Padé | error | second-order Padé | error |
| --- | --- | --- | --- | --- | --- |
| 0.25 | $-14.32^\circ$ | $-14.25^\circ$ | $0.07^\circ$ | $-14.32^\circ$ | $0.00^\circ$ |
| 0.5 | $-28.65^\circ$ | $-28.07^\circ$ | $0.58^\circ$ | $-28.65^\circ$ | $0.00^\circ$ |
| 1.0 | $-57.30^\circ$ | $-53.13^\circ$ | $4.17^\circ$ | $-57.22^\circ$ | $0.08^\circ$ |
| 2.0 | $-114.59^\circ$ | $-90.00^\circ$ | $24.6^\circ$ | $-112.62^\circ$ | $1.97^\circ$ |
| 3.0 | $-171.89^\circ$ | $-112.62^\circ$ | $59.3^\circ$ | $-161.08^\circ$ | $10.8^\circ$ |

The working rules: first-order Padé is good to about $1^\circ$ for $\omega T < 0.5$ and to $4^\circ$ at $\omega T = 1$; second-order is good to $2^\circ$ out to $\omega T = 2$. Since a well-designed loop keeps $\omega_cT$ well under 1, first-order Padé is usually enough at crossover — and it errs on the *optimistic* side, understating the lag, so a design carried out on it should be checked against the exact delay.

```python
import numpy as np


def pade(n, x):
    """Pade approximation of exp(-x) of order n, x = j*w*T."""
    if n == 1:
        return (1 - x / 2) / (1 + x / 2)
    return (1 - x / 2 + x**2 / 12) / (1 + x / 2 + x**2 / 12)


print("   wT     exact     pade1     pade2    |pade1|")
for wT in (0.25, 0.5, 1.0, 2.0, 3.0):
    x = 1j * wT
    print(f"{wT:6.2f} {-np.degrees(wT):9.2f} {np.degrees(np.angle(pade(1, x))):9.2f}"
          f" {np.degrees(np.angle(pade(2, x))):9.2f} {abs(pade(1, x)):10.6f}")

#    wT     exact     pade1     pade2    |pade1|
#   0.25    -14.32    -14.25    -14.32   1.000000
#   0.50    -28.65    -28.07    -28.65   1.000000
#   1.00    -57.30    -53.13    -57.22   1.000000
#   2.00   -114.59    -90.00   -112.62   1.000000
#   3.00   -171.89   -112.62   -161.08   1.000000
```

::: note
The Padé model gets the frequency response right and the very early time response wrong. A true delay produces *no output at all* for $t < T$; the first-order Padé responds instantly, with an initial jump of $-1$ (the right-half-plane zero's undershoot at full amplitude) that then works its way to the correct value. For loop shaping and margin analysis this does not matter, because it is the frequency response near crossover that decides stability. For a simulation whose purpose is to reproduce a measured transient, put the real delay in as a buffer of past samples and leave Padé out of it.
:::

## Check yourself

::: check
A pure time delay of $T$ seconds appears in a loop. What does it do to the Bode plot, and what is the phase at $12\,\mathrm{rad/s}$ for $T = 30\,\mathrm{ms}$?
:::

::: answer
The magnitude plot is unchanged — $\lvert e^{-j\omega T}\rvert = 1$ at every frequency — and the phase falls linearly and without bound, $\phi = -\omega T$ radians. At $\omega = 12\,\mathrm{rad/s}$ and $T = 0.03\,\mathrm{s}$: $\phi = -0.36\,\mathrm{rad} = -20.6^\circ$. Nothing about this is recoverable by gain adjustment; reducing the gain lowers $\omega_c$, which lowers $\omega_cT$, but the delay element itself is untouched. This is why delay is so corrosive: it eats phase margin fastest exactly where your crossover is, and only a slower loop fixes it.
:::

::: check
A loop crosses over at $\omega_c = 20\,\mathrm{rad/s}$ with $50^\circ$ of phase margin. What is its delay margin, and what sample rate would you need if computation and hold together must consume no more than a third of it?
:::

::: answer
$T_{\max} = \mathrm{PM}/\omega_c = (50 \times \pi/180)/20 = 0.8727/20 = 43.6\,\mathrm{ms}$. A third of that is $14.5\,\mathrm{ms}$. Hold plus one frame of computation is $T_s/2 + T_s = 1.5\,T_s$, so $T_s \le 14.5/1.5 = 9.7\,\mathrm{ms}$, that is a sample rate of at least $103\,\mathrm{Hz}$ — call it $200\,\mathrm{Hz}$ to leave room. The remaining two thirds are for bus transport, actuator electronics, filter group delay and the margin you keep against all of them being at their worst simultaneously.
:::

::: check
Show that the first-order Padé approximation has unit magnitude at every frequency, and give its pole and zero.
:::

::: answer
Put $s = j\omega$: the approximation is $(1 - j\omega T/2)/(1 + j\omega T/2)$, a complex number over its own conjugate. Numerator and denominator therefore have the same modulus, $\sqrt{1 + \omega^2T^2/4}$, and the ratio has modulus exactly 1. Its phase is $\arctan(-\omega T/2) - \arctan(\omega T/2) = -2\arctan(\omega T/2)$. Writing it in pole-zero form, $-\dfrac{s - 2/T}{s + 2/T}$: a zero at $s = +2/T$ in the right half plane and a pole at $s = -2/T$ in the left, mirror images about the imaginary axis. That mirror symmetry is what makes it all-pass, and the right-half-plane zero is what makes a delay a non-minimum-phase element.
:::

::: check
An engineer proposes to recover the phase lost to a $40\,\mathrm{ms}$ delay by adding a lead compensator that supplies $+40^\circ$ at the crossover of $15\,\mathrm{rad/s}$. Does that work?
:::

::: answer
Partly, and only up to a point. The delay costs $57.3(15)(0.04) = 34.4^\circ$ at that crossover, so a lead supplying $40^\circ$ there does restore the phase margin at $\omega_c$. What it cannot do is fix the phase *above* crossover: a lead's phase boost peaks at one frequency and falls away, while the delay's lag keeps growing linearly, so at $30\,\mathrm{rad/s}$ the delay costs $68.8^\circ$ and the lead is already giving less than its peak. The magnitude side is worse: a lead raises the gain at high frequency by the same factor it boosts phase, pushing $\lvert L\rvert$ up where the delay's phase is largest and risking a second crossover. Lead compensation buys a modest amount of delay tolerance and is standard practice; it is not a substitute for reducing the latency or accepting a lower bandwidth.
:::

::: check
Why does a first-order lag of time constant $\tau$ behave like a delay of $\tau$ at low frequency but not at high frequency?
:::

::: answer
The lag's phase is $-\arctan(\omega\tau)$. For $\omega\tau \ll 1$, $\arctan x \approx x$, so the phase is $\approx -\omega\tau$ — exactly the phase of a delay of $T = \tau$, and the group delay $-d\phi/d\omega = \tau/(1 + \omega^2\tau^2)$ tends to $\tau$. Its magnitude over the same range is $1/\sqrt{1 + \omega^2\tau^2} \approx 1$, again like a delay. At high frequency the two part company completely: the lag's phase saturates at $-90^\circ$ while the delay's grows without bound, and the lag's magnitude rolls off at $-20\,\mathrm{dB}$ per decade while the delay's stays at 1. So "this filter is worth $20\,\mathrm{ms}$ of delay" is a fair statement about the phase budget at crossover and a wrong statement about anything an octave or two higher.
:::

## Summary

| Item | Statement |
| --- | --- |
| Delay operator | $y(t) = u(t - T) \iff Y(s) = e^{-sT}U(s)$ |
| Frequency response | $\lvert e^{-j\omega T}\rvert = 1$; $\phi = -\omega T$ rad $= -57.3\,\omega T$ degrees |
| Benchmark | $50\,\mathrm{ms}$ at $5\,\mathrm{rad/s}$ costs $14.3^\circ$ |
| Sources | hold $T_s/2$, computation $\approx T_s$, bus, actuator electronics, filter group delay $-d\phi/d\omega$ |
| Equivalent delays | first-order lag: $\tau$; second-order: $2\zeta/\omega_n$ (low frequency) |
| Phase margin | $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$ where $\lvert L(j\omega_c)\rvert = 1$ |
| Delay margin | $T_{\max} = \mathrm{PM}\,[\mathrm{rad}]/\omega_c$ |
| First-order Padé | $e^{-sT} \approx \dfrac{1 - sT/2}{1 + sT/2}$; all-pass; zero at $+2/T$, pole at $-2/T$ |
| Second-order Padé | $\dfrac{1 - sT/2 + (sT)^2/12}{1 + sT/2 + (sT)^2/12}$; good to $2^\circ$ out to $\omega T = 2$ |
| Bandwidth ceiling | $\omega_c \lesssim 1/T$, the right-half-plane-zero rule applied to $z = 2/T$ |

Delay, right-half-plane zeros, lags and resonances have all been described here by what they do to magnitude and phase at each frequency. The next lesson builds that description properly: how to construct a Bode plot by hand, read crossover and margins off it, and check the sketch numerically.
