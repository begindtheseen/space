---
id: l08-time-delay-and-pade
title: Time delay and the Padé approximation
minutes: 18
covers:
  - "Time delay and the Pade approximation"
---

Talk to a friend on a video call with a bad connection. Everything they say arrives half a second late. The words are all there, at full volume — nothing is lost — but you keep talking over each other. You ask a question, hear nothing, start again, and then their answer arrives on top of you. Nothing was wrong with either of you. The lateness alone made the conversation unstable.

A control loop has exactly this problem. Every loop on a modern vehicle is closed through a computer, and a computer takes time. The gyro is sampled. The sample waits for the next control frame. The frame takes a few milliseconds to run. The command goes out on a data bus. The actuator's own electronics take a frame of their own. Only then does the nozzle move — tens of milliseconds after the motion that caused it. That built-up lateness is a **pure time delay**: the output is an exact copy of the input, only late.

A delay deserves its own lesson because it is pure cost. A pole at least gives you something back for its phase lag: it quiets high frequencies. A delay quiets nothing and takes phase without limit. Worse, it takes the most phase at the highest frequencies, which is exactly where a loop's stability is decided.

The second half of the lesson fixes a practical nuisance. The delay's transfer function, $e^{-sT}$, is not a ratio of polynomials, so the tools of this module cannot handle it directly. The standard repair is the **Padé approximation**. Its shape — a right-half-plane zero — turns out to be the right way to think about what a delay does to you. That is why this lesson follows lesson 7.

## Where the delay comes from

A digital loop's delay is a sum of pieces. You can measure or bound each one:

- **Sampling and the zero-order hold.** The computer holds each command constant until the next sample, for a sample period $T_s$ ("T sub s"). On average, [[a held command is half a period late|zoh-picture]]: $T_s/2$.
- **Computation latency.** If the control law reads a sample at the start of a frame and writes its output at the end, that is one full $T_s$. Some computer designs are worse.
- **Bus transport.** A message on a serial **[[data bus|data-bus]]** waits for its turn. A few milliseconds is typical.
- **Actuator and sensor electronics.** Their own sampling, filtering and drive stages.
- **Anti-alias and structural filters.** Not true delays, but at frequencies well below their corner their phase is nearly a straight line in frequency, so they act like one. The right measure is the **[[group delay|group-delay]]** $-d\phi/d\omega$ — how fast the phase $\phi$ falls as frequency $\omega$ rises. A first-order lag with time constant $\tau$ ("tau") has group delay $\tau$ at low frequency. A second-order actuator has $2\zeta/\omega_n$.

That last point matters when you add up the budget. Take the $10\,\mathrm{Hz}$, $\zeta = 0.7$ thrust-vector actuator of lesson 2, with $\omega_n = 62.83\,\mathrm{rad/s}$. Its low-frequency group delay is $2(0.7)/62.83 = 22.3\,\mathrm{ms}$. At $5\,\mathrm{rad/s}$ its phase is $-6.40^\circ$, against the $-6.38^\circ$ that a pure $22.3\,\mathrm{ms}$ delay would give. So below its corner, an actuator *is* a delay as far as the loop can tell.

## The transform of a delay

Say the output is the input shifted late by $T$ seconds: $y(t) = u(t - T)$, with $u$ zero before $t = 0$. What does that do to the transform?

$$
Y(s) = \int_0^\infty u(t - T)e^{-st}\,dt = \int_0^\infty u(\eta)e^{-s(\eta + T)}\,d\eta = e^{-sT}U(s).
$$

Step by step: write out the transform integral. Then rename the time variable, $\eta = t - T$ (read "eta"), so the late signal becomes a plain $u(\eta)$. The leftover $e^{-sT}$ does not depend on $\eta$, so it comes outside, and what remains is $U(s)$. So a delay of $T$ is multiplication by $e^{-sT}$.

Now put $s = j\omega$ to see what happens to a steady oscillation:

$$
\left\lvert e^{-j\omega T}\right\rvert = 1, \qquad \angle e^{-j\omega T} = -\omega T.
$$

In words: the size is unchanged, and the phase falls in a straight line with frequency. The number $-\omega T$ is in radians. Multiply by $180/\pi = [[57.3|radian-degrees]]$ to get degrees.

::: key
Phase lag from a pure time delay: $\phi(\omega) = -\omega T$ radians $= -57.3\,\omega T$ degrees. Magnitude is unchanged at every frequency. At $5\,\mathrm{rad/s}$ a $50\,\mathrm{ms}$ delay costs $14.3^\circ$.
:::

Check that last number: $57.3 \times 5 \times 0.05 = 14.3^\circ$. Three consequences follow, and each is a habit worth forming.

**The magnitude plot is untouched.** A delay is invisible on a Bode magnitude plot. It is invisible in a step response's final value too. If you identify a plant from magnitude data alone, you will miss it entirely.

**The phase falls without limit.** A first-order lag stops at $-90^\circ$. A delay passes $-90^\circ$ at $\omega = \pi/(2T)$, $-180^\circ$ at $\pi/T$, and keeps going. There is no frequency beyond which the delay has "done its worst".

**Lowering the gain does not fix the phase.** Lowering the loop gain moves the crossover frequency down, and *that* shrinks the delay's phase penalty — $\omega_cT$ falls because $\omega_c$ falls. The delay itself is untouched. So the only defense against delay is a slower loop. That is the same conclusion as for a right-half-plane zero, for the same reason.

::: warning
A delay is not a lag, and must not be modeled as one. [[Compare|delay-vs-lag]] $e^{-0.05s}$ with $1/(1 + 0.05s)$ at $20\,\mathrm{rad/s}$. The delay has magnitude 1 and phase $-57.3^\circ$. The lag has magnitude $1/\sqrt{1 + 1} = 0.707$ and phase $-45^\circ$. The lag understates the phase, and it invents $3\,\mathrm{dB}$ of quieting that the real loop will not get. Swapping a lag in for a delay is the standard way to produce a design that is stable in simulation and marginal on the vehicle.
:::

## How much delay a loop can take

Two ideas from the frequency domain, which lesson 9 develops fully. The **gain crossover frequency** $\omega_c$ of a loop transfer function $L(s)$ is the frequency where the loop gain is exactly one: $\lvert L(j\omega_c)\rvert = 1$. The **phase margin** is how much extra phase lag you could add there before the phase reaches $-180^\circ$, where the loop would oscillate forever:

$$
\mathrm{PM} = 180^\circ + \angle L(j\omega_c).
$$

A delay adds exactly $-\omega_cT$ of phase at crossover. Because it leaves the magnitude alone, $\omega_c$ does not move, so the delay eats the phase margin directly. Set the two equal and you get the **delay margin** — the most delay the loop can take before it goes unstable:

$$
T_{\max} = \frac{\mathrm{PM}\ \text{in radians}}{\omega_c}.
$$

For a digital loop, this is the single most useful number to have. It turns a phase margin, which is abstract, into milliseconds, which a software lead can be held to.

::: example A launch-vehicle TVC delay budget
The flight computer runs its attitude law at $100\,\mathrm{Hz}$, so $T_s = 1/100 = 10\,\mathrm{ms}$. Add up the pieces:

| Contribution | Delay |
| --- | --- |
| zero-order hold, $T_s/2$ | $5.0\,\mathrm{ms}$ |
| computation, one frame | $10.0\,\mathrm{ms}$ |
| data bus transport | $2.0\,\mathrm{ms}$ |
| actuator electronics transport | $8.0\,\mathrm{ms}$ |
| **total** | $25.0\,\mathrm{ms}$ |

What does $25\,\mathrm{ms}$ cost? Use $\phi = -57.3\,\omega T$ with $T = 0.025\,\mathrm{s}$.

- At an attitude-loop crossover of $1\,\mathrm{rad/s}$: $-57.3 \times 1 \times 0.025 = -1.43^\circ$. Nothing.
- At a rate-loop crossover of $5\,\mathrm{rad/s}$: $-7.16^\circ$. Worth carrying in the phase budget.
- At $8\,\mathrm{rad/s}$: $-11.5^\circ$. A fifth of a typical phase-margin allowance, spent on lateness.

Now read the same number the other way. The first-order Padé approximation below puts a right-half-plane zero at $z = 2/T = 2/0.025 = 80\,\mathrm{rad/s}$. Lesson 7's rule $\omega_c < z/2$ then becomes $\omega_c < 1/T = 40\,\mathrm{rad/s}$. That is the absolute ceiling this latency sets, whatever the plant, actuator or controller — and a real design with margins sits three or four times below it.
:::

::: example How much delay a rate loop tolerates
A rate loop has $L(s) = \dfrac{50}{s(s + 5)}$ under unity feedback.

Step 1: find the gain crossover. Set $\lvert L\rvert = 50/\left(\omega\sqrt{\omega^2 + 25}\right) = 1$. Square and clear the fraction: $\omega^2(\omega^2 + 25) = 2500$. Let $x = \omega^2$, so $x^2 + 25x - 2500 = 0$ and $x = 39.04$. Then $\omega_c = \sqrt{39.04} = 6.248\,\mathrm{rad/s}$.

Step 2: the phase there is $-90^\circ - \arctan(6.248/5) = -141.33^\circ$. So $\mathrm{PM} = 180 - 141.33 = 38.67^\circ$, which is $0.6749\,\mathrm{rad}$.

Step 3: the delay margin is

$$
T_{\max} = \frac{0.6749}{6.248} = 0.108\,\mathrm{s} = 108\,\mathrm{ms}.
$$

Step 4: check it by simulation. Integrate the closed loop with an explicit delay in the feedback path and a unit step command:

| $T$ | behavior |
| --- | --- |
| 0 | settles at 1.000, peak 1.305 |
| $50\,\mathrm{ms}$ | settles at 1.000, peak 1.57 |
| $108\,\mathrm{ms}$ | keeps oscillating between about 0 and 2, period $1.0\,\mathrm{s}$ |
| $150\,\mathrm{ms}$ | grows without bound |

At the predicted delay margin the loop oscillates without dying out. Its period is $2\pi/6.248 = 1.006\,\mathrm{s}$, the crossover frequency, exactly as the theory says — that is where the phase reaches $-180^\circ$. Below the margin the loop is stable but less damped: the $50\,\mathrm{ms}$ case has lost $57.3 \times 6.248 \times 0.05 = 17.9^\circ$ of margin, and its overshoot has grown from 30% to 57%. Above the margin the loop diverges.

Two readings. First, $108\,\mathrm{ms}$ sounds generous. But the budget in the previous example was already $25\,\mathrm{ms}$ before anyone added telemetry, redundancy voting or a filter — a quarter of the allowance gone on plumbing. Second, the tolerance scales as $1/\omega_c$: double the loop bandwidth and the delay you can absorb halves.
:::

## The Padé approximation

Root locus, pole placement, state-space design and most simulation tools all need a transfer function that is a ratio of polynomials. $e^{-sT}$ is not one. It has no poles and no zeros, and a loop containing it has [[infinitely many closed-loop roots|infinite-roots]]. The **Padé approximation** replaces it with a ratio of polynomials that matches as many terms of its power series as possible.

The first-order case comes from one neat trick. Split the delay into two halves — half a delay forward on top, half a delay "backward" on the bottom — and keep the first two terms of each exponential ($e^{a} \approx 1 + a$ for small $a$):

$$
e^{-sT} = \frac{e^{-sT/2}}{e^{+sT/2}} \approx \frac{1 - sT/2}{1 + sT/2}.
$$

::: key
First-order Padé approximation of a delay: $e^{-sT} \approx \dfrac{1 - sT/2}{1 + sT/2}$. It reproduces the phase lag with a right-half-plane zero — which is exactly the right intuition about delay.
:::

Look at what that expression is. It is lesson 7's all-pass factor, with $z = 2/T$. Its magnitude is exactly 1 at every frequency, matching the delay perfectly. Its phase is $-2\arctan(\omega T/2)$, against the true $-\omega T$. So a delay *is* a non-minimum-phase element, and the bandwidth limit it sets is the right-half-plane-zero limit in disguise.

::: note Why the halves trick works so well
A power series writes a function as $1 + (\text{something})x + (\text{something})x^2 + \dots$. For the delay, with $x = sT$:

$$
e^{-x} = 1 - x + \frac{x^2}{2} - \frac{x^3}{6} + \frac{x^4}{24} - \dots
$$

Expanding the first-order Padé by long division gives $1 - x + \dfrac{x^2}{2} - \dfrac{x^3}{4} + \dots$. The first three terms match exactly, even though the formula has only one adjustable number in it, the $1/2$. A plain first-order lag $1/(1 + x)$ gives $1 - x + x^2 - \dots$ and matches only two. The second-order Padé below matches five terms, through $x^4$, and first differs at $x^5$, where it has $-x^5/144$ against the true $-x^5/120$. More matched terms means the approximation stays close out to larger $\omega T$.
:::

The second-order approximation matches two more series terms:

$$
e^{-sT} \approx \frac{1 - sT/2 + (sT)^2/12}{1 + sT/2 + (sT)^2/12}.
$$

It is also all-pass: its top and bottom have the same size at every $s = j\omega$. Its numerator has a pair of right-half-plane zeros at $s = (3 \pm j\sqrt{3})/T$. How accurate are the two, in phase?

| $\omega T$ | exact | first-order Padé | error | second-order Padé | error |
| --- | --- | --- | --- | --- | --- |
| 0.25 | $-14.32^\circ$ | $-14.25^\circ$ | $0.07^\circ$ | $-14.32^\circ$ | $0.00^\circ$ |
| 0.5 | $-28.65^\circ$ | $-28.07^\circ$ | $0.58^\circ$ | $-28.65^\circ$ | $0.00^\circ$ |
| 1.0 | $-57.30^\circ$ | $-53.13^\circ$ | $4.17^\circ$ | $-57.22^\circ$ | $0.08^\circ$ |
| 2.0 | $-114.59^\circ$ | $-90.00^\circ$ | $24.6^\circ$ | $-112.62^\circ$ | $1.97^\circ$ |
| 3.0 | $-171.89^\circ$ | $-112.62^\circ$ | $59.3^\circ$ | $-161.08^\circ$ | $10.8^\circ$ |

The working rules. First-order Padé is good to about $1^\circ$ for $\omega T < 0.5$, and to $4^\circ$ at $\omega T = 1$. Second-order is good to $2^\circ$ out to $\omega T = 2$. A well-designed loop keeps $\omega_cT$ well under 1, so first-order Padé is usually enough at crossover. But notice the direction of its error: it always shows *less* lag than the truth. It is optimistic. So a design done on it should be checked against the exact delay.

The table is easy to reproduce. [[Henri Padé|pade-history]]'s formulas are two lines of Python:

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

::: note Where Padé goes wrong
The Padé model gets the frequency response right and the very early time response wrong. A true delay gives *no output at all* for $t < T$. The first-order Padé responds instantly, with an [[initial jump to $-1$|pade-step]] — the right-half-plane zero's undershoot at full size — and then works its way to the correct value. For loop shaping and margins this does not matter, because the frequency response near crossover decides stability. But for a simulation meant to reproduce a measured transient, put the real delay in as a buffer of past samples, and leave Padé out.
:::

## Check yourself

::: check
A loop crosses over at $6\,\mathrm{rad/s}$. Two proposals arrive: one adds $15\,\mathrm{ms}$ of transport delay, the other a first-order filter with $\tau = 15\,\mathrm{ms}$. Compare their effect at crossover and at $60\,\mathrm{rad/s}$, and say which you would rather have.
:::

::: answer
At crossover the two are almost identical. The delay gives $\phi = -57.3 \times 6 \times 0.015 = -5.16^\circ$ with no change in magnitude. The filter gives $-\arctan(6 \times 0.015) = -\arctan(0.09) = -5.14^\circ$, and $-0.035\,\mathrm{dB}$. If crossover were all that mattered you could not tell them apart — the group-delay bookkeeping from earlier in the lesson.

At $60\,\mathrm{rad/s}$ they part company completely. The delay gives $-51.6^\circ$ and still $0\,\mathrm{dB}$. The filter gives $-\arctan(0.9) = -42.0^\circ$ and $-2.58\,\mathrm{dB}$.

Take the filter. It costs slightly less phase and, more importantly, it *quiets* — which is what you need above crossover, where structural modes and sensor noise live. The delay leaves the gain at full value while removing phase without limit, so it can hand you a second gain crossover with no margin at all. The general rule: given a choice between lag and latency with the same phase cost at crossover, take the lag.
:::

::: check
A loop crosses over at $\omega_c = 20\,\mathrm{rad/s}$ with $50^\circ$ of phase margin. What is its delay margin, and what sample rate would you need if computation and hold together must use no more than a third of it?
:::

::: answer
First convert the margin to radians: $50 \times \pi/180 = 0.8727\,\mathrm{rad}$. Then $T_{\max} = 0.8727/20 = 43.6\,\mathrm{ms}$.

A third of that is $14.5\,\mathrm{ms}$. Hold plus one frame of computation is $T_s/2 + T_s = 1.5\,T_s$. So $1.5\,T_s \le 14.5\,\mathrm{ms}$ gives $T_s \le 9.7\,\mathrm{ms}$, a sample rate of at least $103\,\mathrm{Hz}$. Call it $200\,\mathrm{Hz}$ to leave room. The other two thirds are for bus transport, actuator electronics, filter group delay, and the margin you keep in case all of them are at their worst at once.
:::

::: check
Show that the first-order Padé approximation has unit magnitude at every frequency, and give its pole and zero.
:::

::: answer
Put $s = j\omega$. The approximation becomes $(1 - j\omega T/2)/(1 + j\omega T/2)$: a complex number divided by its own mirror image (its **conjugate**, the same number with the sign of the imaginary part flipped). A number and its conjugate have the same size, $\sqrt{1 + \omega^2T^2/4}$, so the ratio has size exactly 1.

Its phase is $\arctan(-\omega T/2) - \arctan(\omega T/2) = -2\arctan(\omega T/2)$.

In pole-zero form it is $-\dfrac{s - 2/T}{s + 2/T}$: a zero at $s = +2/T$ in the right half-plane and a pole at $s = -2/T$ in the left. They are mirror images across the imaginary axis. That mirror symmetry is what makes it all-pass, and the right-half-plane zero is what makes a delay a non-minimum-phase element.
:::

::: check
An engineer proposes to recover the phase lost to a $40\,\mathrm{ms}$ delay by adding a lead compensator that supplies $+40^\circ$ at the crossover of $15\,\mathrm{rad/s}$. Does that work?
:::

::: answer
Partly, and only up to a point. The delay costs $57.3 \times 15 \times 0.04 = 34.4^\circ$ at that crossover, so a lead supplying $40^\circ$ there does restore the phase margin at $\omega_c$.

What it cannot fix is the phase *above* crossover. A lead's phase boost peaks at one frequency and falls away, while the delay's lag keeps growing in a straight line. At $30\,\mathrm{rad/s}$ the delay already costs $68.8^\circ$, and the lead gives less than its peak there.

The magnitude side is worse. A lead raises the gain at high frequency by the same factor it boosts phase. That pushes $\lvert L\rvert$ up where the delay's phase is largest, risking a second crossover. Lead compensation buys a modest amount of delay tolerance and is standard practice. It is not a substitute for cutting the latency or accepting a lower bandwidth.
:::

::: check
Why does a first-order lag of time constant $\tau$ behave like a delay of $\tau$ at low frequency but not at high frequency?
:::

::: answer
The lag's phase is $-\arctan(\omega\tau)$. For $\omega\tau \ll 1$ ("much less than 1"), $\arctan x \approx x$, so the phase is about $-\omega\tau$ — exactly the phase of a delay $T = \tau$. Its group delay, $-d\phi/d\omega = \tau/(1 + \omega^2\tau^2)$, tends to $\tau$. Its magnitude over the same range is $1/\sqrt{1 + \omega^2\tau^2} \approx 1$, again like a delay.

At high frequency the two part company. The lag's phase stops at $-90^\circ$ while the delay's grows without limit. The lag's magnitude rolls off at $-20\,\mathrm{dB}$ per decade while the delay's stays at 1. So "this filter is worth $20\,\mathrm{ms}$ of delay" is a fair statement about the phase budget at crossover, and a wrong one about anything an octave or two higher.
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

Delays, right-half-plane zeros, lags and resonances have all been described here by what they do to magnitude and phase at each frequency. The next lesson builds that description properly: how to draw a Bode plot by hand, read crossover and margins off it, and check the sketch with a computer.

::: context zoh-picture Why a held signal is half a step late
The computer can only change its output at sample times, so it holds each value flat until the next one: a staircase. Draw the smooth wave that best follows the stairs and it is the original wave shifted right by half a step (and very slightly smaller).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="345" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,80.0 44.7,71.2 49.4,62.8 54.1,55.0 58.8,48.2 63.4,42.6 68.1,38.4 72.8,35.9 77.5,35.0 82.2,35.9 86.9,38.4 91.6,42.6 96.2,48.2 100.9,55.0 105.6,62.8 110.3,71.2 115.0,80.0 119.7,88.8 124.4,97.2 129.1,105.0 133.8,111.8 138.4,117.4 143.1,121.6 147.8,124.1 152.5,125.0 157.2,124.1 161.9,121.6 166.6,117.4 171.2,111.8 175.9,105.0 180.6,97.2 185.3,88.8 190.0,80.0 194.7,71.2 199.4,62.8 204.1,55.0 208.8,48.2 213.4,42.6 218.1,38.4 222.8,35.9 227.5,35.0 232.2,35.9 236.9,38.4 241.6,42.6 246.2,48.2 250.9,55.0 255.6,62.8 260.3,71.2 265.0,80.0 269.7,88.8 274.4,97.2 279.1,105.0 283.8,111.8 288.4,117.4 293.1,121.6 297.8,124.1 302.5,125.0 307.2,124.1 311.9,121.6 316.6,117.4 321.2,111.8 325.9,105.0 330.6,97.2 335.3,88.8 340.0,80.0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,80.0 58.8,80.0 58.8,48.2 77.5,48.2 77.5,35.0 96.2,35.0 96.2,48.2 115.0,48.2 115.0,80.0 133.8,80.0 133.8,111.8 152.5,111.8 152.5,125.0 171.2,125.0 171.2,111.8 190.0,111.8 190.0,80.0 208.8,80.0 208.8,48.2 227.5,48.2 227.5,35.0 246.2,35.0 246.2,48.2 265.0,48.2 265.0,80.0 283.8,80.0 283.8,111.8 302.5,111.8 302.5,125.0 321.2,125.0 321.2,111.8 340.0,111.8"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="40.0,97.2 44.7,88.8 49.4,80.0 54.1,71.2 58.8,62.8 63.4,55.0 68.1,48.2 72.8,42.6 77.5,38.4 82.2,35.9 86.9,35.0 91.6,35.9 96.2,38.4 100.9,42.6 105.6,48.2 110.3,55.0 115.0,62.8 119.7,71.2 124.4,80.0 129.1,88.8 133.8,97.2 138.4,105.0 143.1,111.8 147.8,117.4 152.5,121.6 157.2,124.1 161.9,125.0 166.6,124.1 171.2,121.6 175.9,117.4 180.6,111.8 185.3,105.0 190.0,97.2 194.7,88.8 199.4,80.0 204.1,71.2 208.8,62.8 213.4,55.0 218.1,48.2 222.8,42.6 227.5,38.4 232.2,35.9 236.9,35.0 241.6,35.9 246.2,38.4 250.9,42.6 255.6,48.2 260.3,55.0 265.0,62.8 269.7,71.2 274.4,80.0 279.1,88.8 283.8,97.2 288.4,105.0 293.1,111.8 297.8,117.4 302.5,121.6 307.2,124.1 311.9,125.0 316.6,124.1 321.2,121.6 325.9,117.4 330.6,111.8 335.3,105.0 340.0,97.2"/>
  <text x="40" y="20" font-size="12" fill="#1d6fd1">wanted</text>
  <text x="100" y="20" font-size="12" fill="#1f2a44">held (stairs)</text>
  <text x="200" y="20" font-size="12" fill="#b4232c">wanted, half a step late</text>
  <text x="190" y="152" font-size="11" fill="#1f2a44" text-anchor="middle">8 samples per cycle</text>
</svg>
```
:::

::: context data-bus Data bus
A **data bus** is the shared wiring that carries messages between the flight computer, the sensors and the actuators. Because many boxes share it, each message waits for its time slot. Aircraft and spacecraft use standard buses such as MIL-STD-1553, which runs at one megabit per second with a single controller deciding who talks when. The waiting is small, but it is a delay, and it goes in the budget.
:::

::: context group-delay Group delay
Picture a runner in a relay race. You cannot see them the whole way, but you know how late they reach each checkpoint. Group delay is that lateness for a signal passing through a filter: how many seconds it arrives behind the input, for signals near a given frequency. If the phase falls in a straight line, $\phi = -\omega T$, then $-d\phi/d\omega = T$ at every frequency — a pure delay. Real filters have a curving phase, so their group delay changes with frequency, but at low frequency it settles to a fixed number you can add to the budget.
:::

::: context radian-degrees Where 57.3 comes from
A full turn is $2\pi$ radians or $360^\circ$, so one radian is $360/(2\pi) = 180/\pi = 57.2958\ldots$ degrees. Engineers round it to $57.3$. Whenever a formula gives an angle in radians — and the delay's phase $-\omega T$ does, because $\omega$ is in radians per second — multiplying by $57.3$ turns it into degrees.
:::

::: context delay-vs-lag Two ways to lose phase
Phase against frequency, from $0$ to $60\,\mathrm{rad/s}$, for a $50\,\mathrm{ms}$ delay and a lag with the same $50\,\mathrm{ms}$ time constant. They start together; then the lag levels off toward $-90^\circ$ while the delay's straight line keeps falling.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="345" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="101" x2="340" y2="101" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="182" x2="340" y2="182" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="34" y="24" font-size="11" fill="#1f2a44" text-anchor="end">0°</text>
  <text x="34" y="105" font-size="11" fill="#1f2a44" text-anchor="end">−90°</text>
  <text x="34" y="186" font-size="11" fill="#1f2a44" text-anchor="end">−180°</text>
  <text x="340" y="14" font-size="11" fill="#1f2a44" text-anchor="end">60 rad/s</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40,20.0 50,25.2 60,30.3 70,35.5 80,40.6 90,45.8 100,50.9 110,56.1 120,61.3 130,66.4 140,71.6 150,76.7 160,81.9 170,87.0 180,92.2 190,97.3 200,102.5 210,107.7 220,112.8 230,118.0 240,123.1 250,128.3 260,133.4 270,138.6 280,143.8 290,148.9 300,154.1 310,159.2 320,164.4 330,169.5 340,174.7"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,20.0 50,25.1 60,30.2 70,35.0 80,39.6 90,43.9 100,47.9 110,51.5 120,54.8 130,57.8 140,60.5 150,63.0 160,65.2 170,67.2 180,69.0 190,70.7 200,72.2 210,73.6 220,74.9 230,76.0 240,77.1 250,78.1 260,79.0 270,79.9 280,80.6 290,81.4 300,82.1 310,82.7 320,83.3 330,83.9 340,84.4"/>
  <text x="250" y="160" font-size="12" fill="#b4232c">delay: −172° at 60</text>
  <text x="200" y="64" font-size="12" fill="#1d6fd1">lag: −72° at 60</text>
</svg>
```
:::

::: context infinite-roots Why a delay has endless roots
Close a loop around $L(s)e^{-sT}$ and the closed-loop poles are the solutions of $1 + L(s)e^{-sT} = 0$. With a polynomial there is a fixed number of solutions — a cubic has three. But $e^{-sT}$ repeats itself as $s$ moves up the imaginary direction (it is built from sines and cosines of $\omega T$), so the equation keeps finding new solutions, farther and farther up and down the $s$-plane, forever. Most sit far to the left and fade fast, which is why a low-order Padé model captures the ones that matter.
:::

::: context pade-history Henri Padé
Henri Padé (1863–1953) was a French mathematician who studied these rational approximations systematically in his doctoral thesis of 1892. He arranged them in a table by the degrees of the top and bottom polynomials, now called the **Padé table**. The first-order delay formula in this lesson sits in the table's $[1/1]$ slot; the second-order one is $[2/2]$. Control engineers borrowed the idea decades later, because they needed delays in a form their polynomial tools could handle.
:::

::: context pade-step The Padé step starts backward
A step through a true $1\,\mathrm{s}$ delay (grey) does nothing for one second, then jumps to 1. The first-order Padé (red) jumps to $-1$ at once, then climbs as $1 - 2e^{-2t}$, crossing zero at $t = \ln 2/2 = 0.35\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="44" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="104" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="164" font-size="11" fill="#1f2a44" text-anchor="end">−1</text>
  <text x="115" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">1 s</text>
  <text x="340" y="116" font-size="11" fill="#1f2a44" text-anchor="end">4 s</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2.5" points="40,100 115,100 115,40 340,40"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40,100 40.0,160.0 47.5,138.2 55.0,120.4 62.5,105.9 70.0,93.9 77.5,84.1 85.0,76.1 92.5,69.6 100.0,64.2 107.5,59.8 115.0,56.2 122.5,53.3 130.0,50.9 137.5,48.9 145.0,47.3 152.5,46.0 160.0,44.9 167.5,44.0 175.0,43.3 182.5,42.7 190.0,42.2 197.5,41.8 205.0,41.5 212.5,41.2 220.0,41.0 227.5,40.8 235.0,40.7 242.5,40.5 250.0,40.4 257.5,40.4 265.0,40.3 272.5,40.2 280.0,40.2 287.5,40.2 295.0,40.1 302.5,40.1 310.0,40.1 317.5,40.1 325.0,40.1 332.5,40.0 340.0,40.0"/>
  <text x="200" y="30" font-size="12" fill="#6c7a93">true delay</text>
  <text x="80" y="150" font-size="12" fill="#b4232c">Padé: starts at −1</text>
</svg>
```
:::
