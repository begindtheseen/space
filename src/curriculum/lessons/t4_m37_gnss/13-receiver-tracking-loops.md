---
id: l13-receiver-tracking-loops
title: Receiver tracking loops
minutes: 24
covers:
  - Receiver tracking loops (DLL, PLL, FLL) and the bandwidth/dynamics trade
---

Picture yourself at night, keeping a flashlight beam on a dog running around a yard. You never know exactly where the dog is. You see how far the spot is from the dog, and you swing your arm to shrink the gap. Swing too gently and a fast dog escapes the beam. Swing too hard, reacting to every flicker of shadow, and the beam jitters all over the place.

A GNSS receiver plays that game with every satellite, all the time. Every measurement this module has used so far — pseudorange, carrier phase, Doppler — was handed to you as if it were already sitting there. None of it arrives that way. The receiver makes a copy of each satellite's signal inside itself, called the **replica**, and keeps steering it to stay lined up with the real signal coming in. The amount it had to steer *is* the measurement. The small machine that does this steering is a **tracking loop**: a feedback loop that measures a misalignment and corrects it, over and over, many times a second.

Much of what earlier lessons blamed on "the receiver" — a cycle slip, jerk breaking lock at staging — is really a property of these loops. This lesson opens them up, and ends at the one design choice that runs through all of them: the loop's **bandwidth**, how quickly it reacts, and the trade that choice always makes.

## What a tracking loop does

Every tracking loop has the same four parts, going around a circle.

1. The **correlator** multiplies the incoming signal by the replica and adds up the result over a short time $T$, the **integration time**. A good match gives a big number; a poor match gives a small one.
2. The **discriminator** turns the correlator outputs into a single number: how far off the replica is, and in which direction. This is the gap between the flashlight spot and the dog.
3. The **loop filter** smooths that noisy error and decides how hard to push. This is your arm's reflex.
4. The **[[numerically controlled oscillator|nco]]** (NCO) is the replica generator. It takes the loop filter's command and speeds up or slows down the replica.

Then the new replica goes back into the correlator, and the circle repeats. This is the same **[[feedback|feedback-loop]]** idea as a car's cruise control: measure the error, push against it, measure again.

The receiver never reads the satellite's timing directly. It reads its *own* NCO: when locked, the NCO's code timing is the pseudorange, its carrier phase the carrier-phase measurement, and its frequency the Doppler.

## Three loops, three jobs

A receiver runs different loops for different parts of the signal.

A **delay lock loop (DLL)** tracks the **code phase**: where the replica's code sits in time against the incoming code. Its discriminator is the early-minus-late balance from the multipath lesson — one reading a little early, one a little late, nudged until they are equal. Its output is range, good to about a meter.

A **phase lock loop (PLL)** tracks the **carrier phase**: where the replica's carrier wave sits within a single cycle. This is the accumulated cycle count the carrier-phase lesson measured range from. Its output is precise to millimeters. It is also fragile. If the loop slips by even a fraction of a cycle too far, it can lose count of whole cycles, and the precision is gone. GPS L1 C/A carries data bits that flip the carrier upside down every so often, so its PLL is built as a **[[Costas loop|costas]]**, a design that does not care about those flips.

A **frequency lock loop (FLL)** tracks only the carrier's **frequency** — the Doppler — and never commits to where the wave is within its cycle. That makes it far more forgiving of rough motion and weak signals than a PLL. The price is that it gives no phase measurement at all.

So a receiver works in stages. It pulls a signal in on an FLL, falls back to an FLL to ride out conditions too rough for phase lock, and hands over to a PLL once things calm down — the reacquisition sequence of the space-based and launch-vehicle lessons.

::: key
DLL, PLL and FLL: the delay lock loop tracks code phase (range); the phase lock loop tracks carrier phase (millimeter precision, but fragile under dynamics); the frequency lock loop tracks Doppler (robust, less precise). A receiver typically acquires and rides out hard dynamics on an FLL, then upgrades to a PLL once conditions allow. Loop bandwidth trades noise against dynamic stress.
:::

## Loop order: which motion a loop follows perfectly

Go back to the flashlight. If the dog sits still, even a lazy arm ends up right on it. If the dog trots at a steady speed, a lazy arm trails a fixed distance behind. To stay exactly on it, you must learn its speed and swing at that speed on your own. To stay on a dog that is speeding up, you must learn its speeding-up as well.

A tracking loop learns motion with **[[integrators|integrator]]**. An integrator is a running total: it keeps adding up the error it sees, so a small error that persists builds into a big correction. The **loop order** is the number of integrators in the feedback path. Each one lets the loop follow one more rate of change with zero lasting error.

- A **first-order** loop follows a constant phase perfectly, but lags behind a constant Doppler (steady speed along the line of sight).
- A **second-order** loop follows a constant Doppler perfectly, but lags behind a constant Doppler *rate* (steady acceleration).
- A **third-order** loop — standard for a receiver that must handle real acceleration — follows a constant Doppler rate perfectly, but lags behind a constant **jerk**, the rate of change of acceleration.

That leftover lag is the **steady-state error**: the error that is still there after the loop has settled. For a third-order loop driven by a constant jerk it is

$$
\theta_e = \frac{J}{\omega_n^3}.
$$

Here $\theta_e$ (read "theta sub e") is the phase error in radians. $J$ is the jerk written as a phase quantity, in radians per second cubed. And $\omega_n$ (read "omega sub n") is the loop's **natural frequency**, in radians per second: a measure of how fast the loop reacts. A bigger $\omega_n$ is a quicker arm. Because $\omega_n$ is cubed, doubling it cuts the jerk error by a factor of eight.

To get $J$ from the Doppler numbers of the launch-vehicle lesson, remember that one cycle of phase is $2\pi$ radians. The jerk makes the Doppler accelerate at $\ddot f_d$ (read "f d double dot"), in hertz per second squared, which is cycles per second cubed. So

$$
J = 2\pi\,\ddot f_d.
$$

::: note Why it has to be true
This uses the **[[final value theorem|final-value]]** from classical control: the value a signal settles to is $\lim_{s\to 0} s\,E(s)$, where $E(s)$ is its Laplace transform.

Near $s = 0$, a loop with $N$ integrators has an open-loop transfer function that behaves like $\omega_n^N/s^N$. The error is what is left of the input after the loop's correction, so the error transfer function is

$$
\frac{1}{1 + \omega_n^N/s^N} = \frac{s^N}{s^N + \omega_n^N}.
$$

A constant jerk $J$ in phase is a phase that grows like $J t^3/6$. Its Laplace transform is $J/s^4$. For a third-order loop, $N = 3$, so the settled error is

$$
\theta_e(\infty) = \lim_{s\to0}\, s\cdot\frac{s^3}{s^3+\omega_n^3}\cdot\frac{J}{s^4} = \lim_{s\to0}\frac{J}{s^3+\omega_n^3} = \frac{J}{\omega_n^3}.
$$

The same recipe shows the pattern in the list above. Feed a third-order loop a constant Doppler rate, with transform $K/s^3$, and the limit has an extra $s$ on top, so it goes to zero. Feed it a jerk and the powers of $s$ cancel exactly, leaving a fixed, nonzero offset. Feed it something one step sharper still and the error grows without limit.
:::

::: key
Dynamic stress on a tracking loop: tracking error from vehicle motion scales with the derivative of range at the loop order — jerk is the killer for a third-order PLL, with steady-state error $\theta_e = J/\omega_n^3$ and $J = 2\pi\,\ddot f_d$.
:::

::: example What the staging transient does to a PLL
The launch-vehicle lesson found that when about $4g_0$ of thrust disappears in $0.3\,\mathrm{s}$ at staging, the L1 Doppler accelerates at about $687\,\mathrm{Hz/s^2}$. Carried without rounding, it is $687.1\,\mathrm{Hz/s^2}$; that lesson's $687.3$ came from rounding the jerk to $130.8\,\mathrm{m/s^3}$ first. Find the steady-state phase error of a third-order PLL for several natural frequencies.

**Step 1: the jerk in phase units.** Multiply by $2\pi$ to turn cycles into radians:

$$
J = 2\pi \times 687.1 = 4317\,\mathrm{rad/s^3}.
$$

**Step 2: divide by $\omega_n^3$.** For $\omega_n = 10\,\mathrm{rad/s}$, $\omega_n^3 = 1000$, so $\theta_e = 4.317\,\mathrm{rad}$. Multiply by $180/\pi$ to get degrees: about $247^\circ$.

**Step 3: repeat for the other values**, here in a few lines of Python:

```python
import numpy as np

J = 2 * np.pi * 687.1
for omega_n in (10, 15, 20, 25, 30):
    theta_e = J / omega_n**3
    print(omega_n, round(np.degrees(theta_e), 2))
# 10 247.36
# 15 73.29
# 20 30.92
# 25 15.83
# 30 9.16
```

**What it means.** At $\omega_n = 10\,\mathrm{rad/s}$ — a reasonable choice for a quiet receiver on a slow vehicle — the loop settles about $247^\circ$ off, more than two thirds of a cycle. A Costas PLL can only hold on within $\pm 90^\circ$, so lock is certainly lost. At $\omega_n = 20\,\mathrm{rad/s}$ the error is still nearly $31^\circ$ from this one event. Only around $25$ to $30\,\mathrm{rad/s}$ does the jerk error shrink to $10$ to $16^\circ$, leaving real margin.

**Sanity check.** Going from $10$ to $20\,\mathrm{rad/s}$ doubles $\omega_n$, so the error should fall by $2^3 = 8$: $247.36/8 = 30.92$. It does.
:::

A real staging jerk lasts only a few tenths of a second, so a slow loop may not settle all the way to $\theta_e$. The steady-state number is where the error is heading: the honest worst case to design against.

## Thermal noise: the other side of the bandwidth dial

If a bigger $\omega_n$ beats jerk, why not make it huge? Because a quick arm also reacts to every flicker.

Every receiver hears **thermal noise**, the hiss of warm electronics. A quick loop lets more of that hiss into its estimate, so its output wobbles more. The wobble is called **jitter**, measured as a standard deviation. The loop's quickness, seen from the noise side, is its **[[noise bandwidth|noise-bandwidth]]** $B_n$, in hertz. For the standard third-order design, $B_n \approx 0.78\,\omega_n$, so the two move together: $\omega_n = 10\,\mathrm{rad/s}$ is about $B_n = 7.8\,\mathrm{Hz}$.

For a Costas PLL tracking a data-carrying signal like L1 C/A, the thermal jitter is

$$
\sigma_{\mathrm{PLL}} = \sqrt{\frac{B_n}{C/N_0}\left(1+\frac{1}{2T\,(C/N_0)}\right)}\ \ \text{radians}.
$$

Read $\sigma_{\mathrm{PLL}}$ as "sigma PLL". Here $C/N_0$ is the carrier-to-noise-density ratio, turned from dB-Hz into a plain ratio: $35\,\mathrm{dB\text{-}Hz}$ means $10^{3.5} \approx 3162\,\mathrm{Hz}$. And $T$ is the integration time. On L1 C/A it can be at most $20\,\mathrm{ms}$, one navigation-message bit, unless the data are stripped off or a data-free **pilot** channel is used. The bracket is a small penalty for the data bits; at strong signals it is close to $1$.

The code loop has a matching formula, built from the early-minus-late discriminator with correlator spacing $d$ (in chips):

$$
\sigma_{\mathrm{DLL}} = \sqrt{\frac{B_n\,d}{2\,(C/N_0)}}\ \ \text{chips}.
$$

Multiply by $293.05\,\mathrm{m}$ per chip to get meters on C/A code. The DLL uses its own, much smaller $B_n$, as the last section explains. (This simple form leaves out a small data-bit penalty like the PLL's bracket.)

Both formulas say the same thing: jitter grows like $\sqrt{B_n}$ and shrinks like $1/\sqrt{C/N_0}$. Four times the bandwidth doubles the jitter. A signal $6\,\mathrm{dB}$ weaker (four times less power) also doubles it.

::: note Why the formulas look like this
Take the PLL. After one integration of length $T$, the correlator's signal part has size proportional to $\sqrt{C}\,T$, and its noise has variance proportional to $N_0 T$. So one discriminator reading has a phase error with variance $1/(2T\,C/N_0)$ radians squared. The Costas discriminator squares out the data bits, and squaring noise adds the bracket factor.

The loop filter then averages many readings. A loop of noise bandwidth $B_n$ keeps a fraction $2B_nT$ of each reading's variance. Multiply:

$$
\frac{1}{2T\,C/N_0}\times 2B_nT = \frac{B_n}{C/N_0}.
$$

The DLL works the same way. The early and late correlator noises overlap by $1 - d$, so their difference has variance proportional to $2d$. The early-minus-late slope is $2$ per chip, so dividing by $2^2 = 4$ and averaging with the same $2B_nT$ gives $B_n d/(2\,C/N_0)$.
:::

::: example The same bandwidth, cutting both ways
Use $T = 20\,\mathrm{ms}$. At a solid $C/N_0 = 35\,\mathrm{dB\text{-}Hz}$, the PLL jitter is:

| $B_n$ (Hz) | 5 | 10 | 15 | 20 | 25 |
| --- | --- | --- | --- | --- | --- |
| $\sigma_{\mathrm{PLL}}$ at 35 dB-Hz | $2.29^\circ$ | $3.23^\circ$ | $3.96^\circ$ | $4.57^\circ$ | $5.11^\circ$ |
| $\sigma_{\mathrm{PLL}}$ at 30 dB-Hz | $4.10^\circ$ | $5.80^\circ$ | $7.10^\circ$ | $8.20^\circ$ | $9.17^\circ$ |

Work the first entry by hand. $C/N_0 = 10^{3.5} = 3162$. The bracket is $1 + 1/(2 \times 0.02 \times 3162) = 1 + 0.0079 = 1.0079$. Then $5/3162 \times 1.0079 = 0.001594$, and its square root is $0.0399\,\mathrm{rad}$, which is $2.29^\circ$.

Five times the bandwidth ($5$ to $25\,\mathrm{Hz}$) multiplies the jitter by $\sqrt 5 = 2.24$: $2.29 \times 2.24 = 5.13$, close to the table's $5.11^\circ$ (the bracket shifts it slightly). Dropping $5\,\mathrm{dB}$ multiplies it by $\sqrt{10^{0.5}} = 1.78$.

**The code side.** At $C/N_0 = 45\,\mathrm{dB\text{-}Hz}$ with a standard one-chip correlator, DLL jitter runs from $0.82\,\mathrm{m}$ at $B_n = 0.5\,\mathrm{Hz}$ to $1.65\,\mathrm{m}$ at $B_n = 2\,\mathrm{Hz}$. That matches the pseudorange lesson's "$0.1$ to $1\,\mathrm{m}$" receiver-noise entry at the narrow end.

Now narrow the correlator to $d = 0.1\,\mathrm{chip}$, the change the multipath lesson credited with a ten-fold cut in multipath. The jitter falls by $\sqrt{10} = 3.16$ too: $0.26\,\mathrm{m}$ instead of $0.82\,\mathrm{m}$ at $B_n = 0.5\,\mathrm{Hz}$. A narrow correlator helps against both multipath and noise, at the cost of a wider receiver front end to keep the correlation peak sharp. A wider loop bandwidth never helps against both. It always trades one error for another.
:::

## Putting the two together

Now the trade is exact. Too narrow a bandwidth, and a jerk like the staging transient breaks lock. Too wide, and thermal noise takes over — worse on a weak or side-lobe signal — and can push a marginal link past its own limit.

Engineers add the two with a common **[[rule of thumb|lock-rule]]** for a Costas PLL: three times the jitter, plus the dynamic stress error, must stay under $45^\circ$, half of the $\pm 90^\circ$ the loop can hold:

$$
3\sigma_{\mathrm{PLL}} + \theta_e \le 45^\circ.
$$

Three times, because noise wanders: keeping even a rare $3\sigma$ excursion inside the limit keeps loss of lock rare.

::: example Is there any bandwidth that survives staging?
Take the staging jerk ($J = 4317\,\mathrm{rad/s^3}$), $T = 20\,\mathrm{ms}$ and $B_n = 0.78\,\omega_n$. For each $\omega_n$, add $3\sigma_{\mathrm{PLL}}$ to $\theta_e$.

At $C/N_0 = 35\,\mathrm{dB\text{-}Hz}$:

- $\omega_n = 10\,\mathrm{rad/s}$ ($B_n = 7.8\,\mathrm{Hz}$): $\theta_e = 247.4^\circ$, $3\sigma = 8.6^\circ$, total $256.0^\circ$. Fails badly.
- $\omega_n = 20\,\mathrm{rad/s}$ ($B_n = 15.7\,\mathrm{Hz}$): $30.9^\circ + 12.2^\circ = 43.1^\circ$. Just passes.
- $\omega_n = 30\,\mathrm{rad/s}$ ($B_n = 23.5\,\mathrm{Hz}$): $9.2^\circ + 14.9^\circ = 24.1^\circ$. Passes comfortably.

Solving for the edge, anything above about $\omega_n = 19.6\,\mathrm{rad/s}$ works at $35\,\mathrm{dB\text{-}Hz}$.

At $30\,\mathrm{dB\text{-}Hz}$ the jitter is bigger, and the edge moves up to about $22.4\,\mathrm{rad/s}$.

At $25\,\mathrm{dB\text{-}Hz}$ — a weak signal, the kind a plume-shadowed antenna delivers — there is *no* answer. The best total, near $\omega_n = 31\,\mathrm{rad/s}$, is about $58^\circ$. Narrower and jerk wins; wider and noise wins.

**Sanity check.** The jerk term falls as $1/\omega_n^3$ and the noise term rises as $\sqrt{\omega_n}$, so the total has a lowest point in between, and a weaker signal lifts it. Both happen.
:::

So choosing a bandwidth means picking a point on this curve for the worst motion and the weakest signal the receiver must survive *at the same time*. A launch vehicle needs a wide loop for jerk *and* margin for a weak, plume-affected signal, and sometimes no loop gives both. Nor can a loop be widened freely: it updates once per integration time and stays stable only while $B_nT$ is well below $1$.

::: key
The trade: widening the bandwidth shrinks dynamic stress error and grows thermal noise, in both loops, always. PLL jitter $\sigma_{\mathrm{PLL}}=\sqrt{(B_n/(C/N_0))(1+1/(2T\,C/N_0))}$ radians; DLL jitter $\sigma_{\mathrm{DLL}}=\sqrt{B_n d/(2\,C/N_0)}$ chips. Rule of thumb for a Costas PLL: $3\sigma_{\mathrm{PLL}} + \theta_e \le 45^\circ$. No bandwidth minimizes both errors at once, and on a weak enough signal under hard enough dynamics, none satisfies the rule at all.
:::

::: warning Order and bandwidth are two different dials
**Order** sets which rate of change the loop follows with *zero* lasting error — third order for a constant Doppler rate, leaving jerk over. **Bandwidth** ($\omega_n$, or $B_n$) sets how fast the loop responds and how much noise it lets in, for any order. Raising the order does not escape the noise-versus-dynamics trade: a high-order loop with too narrow a bandwidth still loses lock to a hard enough jolt, and each extra integrator makes the loop harder to keep stable.
:::

## Carrier-aided code tracking: loops helping each other

The DLL does not have to fight the vehicle's motion on its own. The PLL already knows the Doppler far more precisely than the code loop needs. So a standard design feeds the PLL's rate estimate straight to the code NCO, scaled from carrier to code rate. The code replica moves with the vehicle before the DLL does anything at all.

That leaves the DLL only the slow drift between code and carrier. It comes mainly from the ionosphere, which delays the code and advances the carrier, so the two **[[slowly pull apart|divergence]]** — meters per minute at most, not meters per second. This is why real DLL bandwidths run under a hertz, about ten times narrower than a typical PLL's, even on a highly dynamic vehicle. The code loop rides on the carrier loop's much better estimate of the motion.

This is the first hint of a bigger idea, which the final lesson develops in full: nothing says the help has to come only from another loop inside the same receiver.

## Check yourself

::: check
Name the three kinds of tracking loop. For each, say what it tracks, and compare how precise and how robust they are.
:::

::: answer
The DLL tracks code phase, giving range to about a meter; it is fairly robust, because the code ruler is coarse (one C/A chip is $293\,\mathrm{m}$). The PLL tracks carrier phase: millimeter precision, but fragile — too much motion or too little signal and it loses the count of cycles. The FLL tracks only Doppler. It is the most robust, because it never commits to an absolute phase, but gives no phase measurement. Receivers acquire or survive harsh conditions on the FLL, then switch to a PLL.
:::

::: check
A third-order PLL with $\omega_n = 18\,\mathrm{rad/s}$ experiences a sustained Doppler acceleration of $400\,\mathrm{Hz/s^2}$. Compute the steady-state phase error.
:::

::: answer
First the jerk in phase units: $J = 2\pi \times 400 = 2513\,\mathrm{rad/s^3}$. Then $\omega_n^3 = 18^3 = 5832$. The error is $\theta_e = J/\omega_n^3 = 2513/5832 = 0.431\,\mathrm{rad}$. In degrees, $0.431 \times 180/\pi = 24.69^\circ$. That is over half of the $45^\circ$ budget before any noise is counted.
:::

::: check
Compute the PLL thermal noise jitter for $B_n = 8\,\mathrm{Hz}$, $C/N_0 = 33\,\mathrm{dB\text{-}Hz}$, $T = 20\,\mathrm{ms}$.
:::

::: answer
Turn the dB-Hz into a ratio: $10^{3.3} = 1995\,\mathrm{Hz}$. The bracket is $1 + 1/(2 \times 0.02 \times 1995) = 1 + 0.0125 = 1.0125$. Then $8/1995 \times 1.0125 = 0.00406$, and the square root is $0.0637\,\mathrm{rad}$. In degrees, that is $3.65^\circ$.
:::

::: check
Explain, without further calculation, why there is no single loop bandwidth that is always "best" for a tracking loop.
:::

::: answer
Widening the bandwidth shrinks dynamic stress error, $\theta_e = J/\omega_n^3$, because a quicker loop follows fast motion more closely. It also raises thermal jitter, because a quicker loop lets more noise through. Any bandwidth is better for one error and worse for the other. "Best" only means something once you fix a worst-case motion and a worst-case signal to design against; then you pick the bandwidth that keeps the sum inside the lock limit, if one exists.
:::

::: check
Why can a real receiver's DLL run with a bandwidth about ten times narrower than its PLL, even on a highly dynamic vehicle?
:::

::: answer
Because the DLL does not track the vehicle's motion by itself. In carrier-aided code tracking, the PLL's far more precise Doppler estimate drives the code replica's rate directly. The DLL is left with only the slow divergence between code and carrier, caused mainly by the ionosphere, not the vehicle's acceleration and jerk. The motion is handled by the loop built to track it precisely.
:::

::: check
At $C/N_0 = 40\,\mathrm{dB\text{-}Hz}$ and $B_n = 1\,\mathrm{Hz}$, compute the DLL jitter for a standard one-chip correlator and for a narrow $0.1$-chip correlator, and state the ratio between them.
:::

::: answer
$40\,\mathrm{dB\text{-}Hz}$ is a ratio of $10^4$. One-chip: $\sqrt{1 \times 1/(2 \times 10^4)} = 0.00707$ chip, and $0.00707 \times 293.05 = 2.07\,\mathrm{m}$. Narrow ($d = 0.1$): $\sqrt{1 \times 0.1/(2 \times 10^4)} = 0.00224$ chip, which is $0.655\,\mathrm{m}$. The ratio is $2.07/0.655 = 3.16 = \sqrt{10}$, the square root of the ratio of the correlator spacings, as the formula predicts.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| DLL / PLL / FLL | Loops for code phase / carrier phase / Doppler | Range, about a meter / millimeters but fragile / robust but no phase |
| NCO | The receiver's adjustable replica generator | Its settings are the measurements |
| Loop order | Number of integrators | Third order follows a constant Doppler rate; jerk is left over |
| Dynamic stress error | Settled lag of a third-order loop under jerk | $\theta_e = J/\omega_n^3$, $J = 2\pi\ddot f_d$; about $247^\circ$ for staging at $\omega_n = 10\,\mathrm{rad/s}$ |
| Noise bandwidth $B_n$ | How much noise the loop lets in | $B_n \approx 0.78\,\omega_n$ for the standard third-order design |
| PLL thermal jitter | Wobble from noise, radians | $\sigma_{\mathrm{PLL}}=\sqrt{(B_n/(C/N_0))(1+1/(2T\,C/N_0))}$ |
| DLL thermal jitter | Wobble from noise, chips | $\sigma_{\mathrm{DLL}}=\sqrt{B_n d/(2\,C/N_0)}$; narrowing $d$ cuts it by $\sqrt{d}$ |
| Lock rule of thumb | Costas PLL budget | $3\sigma_{\mathrm{PLL}} + \theta_e \le 45^\circ$ |
| The trade | Wider bandwidth | Less dynamic stress, more noise — always, in both loops |
| Carrier aiding | PLL's Doppler steers the code NCO | DLL bandwidth can be about ten times narrower than the PLL's |

Carrier aiding is one loop lending another its best estimate, inside one receiver, for one signal. The final lesson takes that idea as far as it goes: every loop, for every satellite, steered by a single navigation filter that also knows what the vehicle's inertial sensors say it is doing.

::: context nco A counter that makes a wave
A **numerically controlled oscillator** is a counter, not a crystal you can tune. Every tick of the receiver's clock, it adds a number to a running total, and the total wraps around like a car's odometer. Where the total sits in its cycle is the replica's phase. The number it adds each tick sets the frequency: add more, and it wraps faster. So the loop steers the replica by changing one number, and the receiver can read the exact phase and frequency straight out of its own registers. That is why the NCO's settings *are* the measurements.
:::

::: context feedback-loop The loop, drawn as a circle
Cruise control measures the car's speed, compares it with the setting, and presses the gas harder or softer. A tracking loop does the same with timing: it compares the replica with the incoming signal, filters the error, and nudges the replica. The only input from outside is the satellite's signal; everything else goes around the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/></marker>
  </defs>
  <text x="10" y="30" font-size="11" fill="#1d6fd1">signal in</text>
  <line x1="20" y1="45" x2="58" y2="45" stroke="#1d6fd1" stroke-width="2" marker-end="url(#ah)"/>
  <rect x="60" y="28" width="100" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">correlator</text>
  <line x1="160" y1="45" x2="198" y2="45" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <rect x="200" y="28" width="110" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="255" y="50" font-size="12" fill="#1f2a44" text-anchor="middle">discriminator</text>
  <line x1="255" y1="62" x2="255" y2="103" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="262" y="87" font-size="11" fill="#b4232c">error</text>
  <rect x="200" y="105" width="110" height="34" rx="5" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="255" y="127" font-size="12" fill="#1f2a44" text-anchor="middle">loop filter</text>
  <line x1="200" y1="122" x2="162" y2="122" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <rect x="60" y="105" width="100" height="34" rx="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="127" font-size="12" fill="#1f2a44" text-anchor="middle">NCO (replica)</text>
  <line x1="110" y1="105" x2="110" y2="64" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <line x1="60" y1="122" x2="22" y2="122" stroke="#f2b880" stroke-width="2" marker-end="url(#ah)"/>
  <text x="10" y="155" font-size="11" fill="#6c7a93">measurements out</text>
</svg>
```
:::

::: context costas Why data bits do not bother a Costas loop
Each navigation data bit either leaves the carrier alone or flips it upside down, a $180^\circ$ jump. An ordinary PLL would chase every flip. The **Costas loop**, published by John P. Costas in 1956, uses a discriminator such as $\arctan(Q/I)$ that gives the same answer for a wave and its upside-down copy. The price: it can only hold phase errors between $-90^\circ$ and $+90^\circ$ before the reading wraps around.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="185" y1="20" x2="185" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="30,85 107.5,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="107.5,150 262.5,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="262.5,150 340,85" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="107.5" y1="20" x2="107.5" y2="150" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="262.5" y1="20" x2="262.5" y2="150" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="100">−180°</text><text x="107.5" y="164">−90°</text><text x="185" y="164">0</text>
    <text x="262.5" y="164">+90°</text><text x="340" y="100">+180°</text>
  </g>
  <text x="192" y="30" font-size="11" fill="#1f2a44">output</text>
  <text x="300" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">phase error</text>
  <text x="185" y="14" font-size="11" fill="#b4232c" text-anchor="middle">wraps at ±90°</text>
</svg>
```

The output equals the phase error only between the dashed lines.
:::

::: context integrator A running total that learns
An **integrator** keeps a running total of everything fed into it, like a savings jar. Put in a small error every step and the jar keeps filling, so the correction it produces keeps growing until the error is truly zero. That is how a loop "learns" a steady Doppler: once the jar holds exactly the right amount, it keeps steering at that rate even with no error coming in. A second jar, feeding the first, learns a steady *change* in Doppler. Each jar handles one more rate of change, which is why order counts integrators.
:::

::: context final-value The settled value, from the transform
The **final value theorem** says that if a signal settles down, its settled value is $\lim_{s\to0} s\,E(s)$, where $E(s)$ is its Laplace transform. It lets you read the long-run error off a transfer function without solving the differential equation. The classical control module (Tier 3) builds it up alongside the idea of **system type**: a loop with $N$ integrators is "type $N$", and follows inputs up to the $(N-1)$-th power of time with no lasting error. A third-order PLL is a type-3 loop in exactly that sense.
:::

::: context noise-bandwidth Measuring a loop by the noise it lets in
A loop's response to noise has soft edges: it passes slow wiggles, weakens faster ones gradually, and blocks very fast ones. The **noise bandwidth** $B_n$ replaces that soft shape with an imaginary sharp-edged window that lets through exactly the same total noise power. That makes jitter easy to compute: noise power per hertz, times $B_n$ hertz. It is quoted one-sided, in hertz, while $\omega_n$ is in radians per second, which is why the two differ by a number near one rather than being equal.
:::

::: context lock-rule Where the forty-five degrees comes from
A Costas discriminator reads phase correctly only out to $\pm 90^\circ$. Past that, it wraps and pushes the loop the wrong way, and lock is lost. Engineers keep the *typical worst* error inside half that range: the steady dynamic error plus three standard deviations of noise, at most $45^\circ$. For Gaussian noise, three sigma covers all but about one reading in 370. The picture shows the staging example at $35\,\mathrm{dB\text{-}Hz}$: jerk error in red, $3\sigma$ in blue, their sum in dark ink, crossing the gray $45^\circ$ line near $\omega_n = 19.6\,\mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="79.0,39.9 88.7,69.8 98.3,92.3 108.0,109.5 117.7,122.9 127.3,133.4 137.0,141.9 146.7,148.8 156.3,154.4 166.0,159.0 175.7,162.9 185.3,166.1 195.0,168.9 204.7,171.2 214.3,173.2 224.0,175.0 233.7,176.5 243.3,177.8 253.0,178.9 262.7,179.9 272.3,180.8 282.0,181.6 291.7,182.3 301.3,182.9 311.0,183.5 320.7,184.0 330.3,184.4 340.0,184.8"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="79.0,176.9 88.7,176.4 98.3,176.0 108.0,175.5 117.7,175.1 127.3,174.6 137.0,174.2 146.7,173.8 156.3,173.4 166.0,173.0 175.7,172.6 185.3,172.2 195.0,171.9 204.7,171.5 214.3,171.2 224.0,170.8 233.7,170.5 243.3,170.2 253.0,169.8 262.7,169.5 272.3,169.2 282.0,168.9 291.7,168.6 301.3,168.3 311.0,168.0 320.7,167.7 330.3,167.4 340.0,167.1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="88.7,56.2 98.3,78.2 108.0,95.0 117.7,107.9 127.3,118.1 137.0,126.1 146.7,132.6 156.3,137.8 166.0,142.0 175.7,145.5 185.3,148.4 195.0,150.8 204.7,152.8 214.3,154.4 224.0,155.8 233.7,157.0 243.3,157.9 253.0,158.8 262.7,159.4 272.3,160.0 282.0,160.5 291.7,160.9 301.3,161.2 311.0,161.4 320.7,161.6 330.3,161.8 340.0,161.9"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="205">10</text><text x="146.7" y="205">20</text><text x="243.3" y="205">30</text><text x="340" y="205">40</text>
    <text x="195" y="218">natural frequency (rad/s)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="194">0°</text><text x="45" y="134">45°</text><text x="45" y="74">90°</text>
  </g>
  <line x1="46" y1="70" x2="50" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="45" font-size="11" fill="#b4232c">jerk error</text>
  <text x="250" y="150" font-size="11" fill="#1f2a44">sum</text>
  <text x="290" y="180" font-size="11" fill="#1d6fd1">3σ noise</text>
</svg>
```
:::

::: context divergence Code and carrier drift apart
The ionosphere is a strange medium for radio waves: it *delays* the code but *advances* the carrier phase, by the same amount. So as a satellite rises or sets and the amount of ionosphere along the path changes, code range and carrier range move in opposite directions, and the gap between them grows at twice the rate of the ionospheric change. That drift is slow — at most a few meters over many minutes — which is why a carrier-aided DLL can afford to be very narrow. The same effect is what the ionosphere lesson's dual-frequency combination is built to remove.
:::
