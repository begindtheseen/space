---
id: l04-frequency-response-and-margins
title: Frequency response, Bode plots and stability margins
minutes: 24
covers:
  - bode, nyquist, nichols, margin, allmargin, sigma
---

Think about pushing a friend on a swing. Push slowly, once every ten seconds, and the swing barely moves with you. Push at exactly the swing's own rhythm and every push adds up, until the swing flies high. Push very fast, ten times a second, and the swing hardly notices, because it has no time to respond before your hand is going the other way. The same push does very different things depending on **how often** you push.

Every system you model in MATLAB behaves like that swing. Wiggle its input with a steady wave, and the output comes out bigger or smaller, and a little late. Recording "how big" and "how late" for every rhythm is called the **frequency response** — the system's answer to a steady wave, rhythm by rhythm.

The last lesson found stability from **poles**: a loop is stable when every closed-loop pole sits in the left half of the complex plane. This lesson finds it a second way, from the frequency response, and adds something poles do not give easily: **how close to unstable** you are. That distance is a **margin**, and on a launch vehicle it is the first number a design review asks for. You will compute margins with `margin` and `allmargin`, see what a computer's delay does to them, and protect a loop from a wobbly **[[flexible mode|bending-mode]]** with a notch filter.

## A wave in, a wave out

Here is the precise idea. Feed a stable linear system the input $u(t) = \sin(\omega t)$. Wait for the start-up wobble to die away. The output is then a sine wave **at the same frequency**, only bigger or smaller and shifted in time:

$$
y(t) = |G(j\omega)|\,\sin\big(\omega t + \angle G(j\omega)\big).
$$

Read $\omega$ as "omega". It is the **angular frequency** in **[[radians per second|rad-per-sec]]**, and it sets how fast the wave repeats. The two numbers that describe the output come from one complex number, $G(j\omega)$: the transfer function $G(s)$ from lesson 1 with $s$ replaced by $j\omega$ (here $j$ is the imaginary unit, $j^2 = -1$).

- The **gain** $|G(j\omega)|$ — read "the magnitude of G of j omega" — is how many times bigger the output wave is than the input wave.
- The **phase** $\angle G(j\omega)$ — read "the angle of G of j omega" — is how far the output is shifted. A negative phase is a **lag**: the output peaks after the input does.

### Decibels

Gains range from tiny to huge, so engineers measure them on a stretched-out scale. The **decibel** (dB) turns a gain factor into a number by taking a logarithm:

$$
\text{gain in dB} = 20\log_{10}|G|, \qquad |G| = 10^{\,\text{dB}/20}.
$$

Read the second formula as "the factor is ten to the power of the dB value over twenty". A few values to learn by heart:

| Factor | dB |
|---|---|
| 1 (no change) | 0 dB |
| 2 | about 6 dB |
| 10 | 20 dB |
| 100 | 40 dB |
| 0.5 | about −6 dB |
| 0.1 | −20 dB |

Multiplying gains means **adding** decibels, so a chain of blocks is the sum of their dB curves. And "above 0 dB" means "makes the signal bigger", "below 0 dB" means "makes it smaller".

::: key
Gain in decibels is $20\log_{10}|G|$; to go back, a gain of $x$ dB is a factor of $10^{x/20}$. 0 dB is a factor of 1, 6 dB is about 2, 20 dB is 10.
:::

::: warning Twenty, not ten
Some fields use $10\log_{10}$, because they measure **power**, which goes as amplitude squared. Control engineers measure amplitude, so it is always $20\log_{10}$. If you get "12 dB is a factor of 15.8", you used 10 by mistake; the right answer is $10^{12/20} = 3.98$.
:::

## The Bode plot

A **Bode plot** draws the frequency response as two graphs stacked on top of each other, sharing a frequency axis: gain in dB on top, phase in degrees below. The frequency axis is **logarithmic**: each equal step along it multiplies $\omega$ by 10. One such step is a **[[decade|log-axis]]**.

On that log axis, simple building blocks draw as straight lines, which is why engineers can sketch a Bode plot by hand:

- An **integrator** $1/s$ has gain $1/\omega$: a line falling **20 dB per decade**, crossing 0 dB at 1 rad/s, with a constant phase of $-90^\circ$.
- A **double integrator** $1/s^2$ — a rigid rocket's pitch angle responding to a torque — falls 40 dB per decade with phase $-180^\circ$ everywhere.
- A **first-order lag** $a/(s + a)$ is flat at 0 dB until $\omega \approx a$, then falls 20 dB per decade. Its phase slides from $0^\circ$ to $-90^\circ$, passing $-45^\circ$ right at $\omega = a$.
- A **lightly damped mode** $\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ — read "omega n" for its natural frequency and "zeta" for its damping ratio from lesson 3 — is flat, then has a sharp spike at $\omega_n$ of height about $1/(2\zeta)$, then falls 40 dB per decade. Its phase drops by $180^\circ$, most of it in a narrow band around $\omega_n$.

In MATLAB, `bode(G)` draws the plot. With output arguments it returns numbers instead:

```matlab
s = tf('s');
G = 10/(s + 2);
[mag, phase] = bode(G, [2 20]);   % frequencies in rad/s
mag   = squeeze(mag)              % plain ratios, NOT dB
% mag =
%     3.5355
%     0.4975
phase = squeeze(phase)            % degrees
% phase =
%   -45.0000
%   -84.2894
magdB = 20*log10(mag)
% magdB =
%    10.9691
%    -6.0638
```

`bode` returns three-dimensional arrays (outputs × inputs × frequencies), so `squeeze` flattens them.

::: example Reading a Bode plot by hand, then checking it
Take $G(s) = \dfrac{10}{s + 2}$ and find its gain and phase at $\omega = 0$ and at $\omega = 20\,\mathrm{rad/s}$.

**At $\omega = 0$.** $G(0) = 10/2 = 5$. In decibels, $20\log_{10} 5 = 20 \times 0.699 = 13.98\,\mathrm{dB}$. The phase is $0^\circ$, because 5 is a positive real number.

**At $\omega = 20$.** $G(j20) = \dfrac{10}{2 + 20j}$. The size of the bottom is $\sqrt{4 + 400} = 20.10$, so the gain is $10/20.10 = 0.4975$. In decibels, $20\log_{10} 0.4975 = -6.06\,\mathrm{dB}$. The angle of $2 + 20j$ is $\arctan(20/2) = 84.29^\circ$, so the phase is $-84.29^\circ$.

**Sanity check with the straight lines.** The corner is at $a = 2$. From $\omega = 2$ to $\omega = 20$ is one decade, so after the corner the gain should fall by about 20 dB: $14 - 20 = -6\,\mathrm{dB}$. That matches. The phase is close to $-90^\circ$, as it should be well past the corner. The `bode` call above prints the same numbers.
:::

## Loops, the point −1, and margins

Now close a loop. The controller $C(s)$ and the plant $P(s)$ in a chain make the **open-loop transfer function** $L(s) = C(s)P(s)$ — everything a signal passes through going once around the loop. Negative feedback, `feedback(L,1)` from lesson 1, gives the closed loop

$$
T(s) = \frac{L(s)}{1 + L(s)}.
$$

The closed-loop poles are the values of $s$ where the bottom, $1 + L(s)$, is zero, which means $L(s) = -1$. So the loop is in danger when, at some frequency, $L(j\omega)$ comes close to the number $-1$.

What does $L(j\omega) = -1$ mean in gain and phase? The number $-1$ has size 1 and angle $-180^\circ$. So it means: a wave goes once around the loop and comes back **exactly as big as it started** (gain 1, or 0 dB), and **exactly upside-down** ($-180^\circ$). The minus sign of negative feedback flips it once more, so the wave lands exactly on top of itself and keeps itself going forever. That is an oscillation that needs no input — the same thing as the **[[squeal of a microphone|mic-squeal]]** held too close to its speaker.

Two frequencies mark the danger on a Bode plot:

- The **gain crossover frequency** $\omega_c$ is where $|L|$ crosses 0 dB (gain 1). It roughly sets how fast the loop responds, its **bandwidth**.
- The **phase crossover frequency** $\omega_{180}$ is where the phase of $L$ crosses $-180^\circ$.

The two margins measure how far you are from the dangerous point, one along each direction:

$$
\text{GM} = \frac{1}{|L(j\omega_{180})|}, \qquad \text{PM} = 180^\circ + \angle L(j\omega_c).
$$

The **gain margin** GM says how many times you could multiply the loop gain before it reaches 1 at the frequency where the phase is already $-180^\circ$. The **phase margin** PM says how much extra lag you could add at crossover before the phase hits $-180^\circ$ where the gain is already 1. In decibels, $\text{GM}_{\text{dB}} = -20\log_{10}|L(j\omega_{180})|$, the distance the gain curve sits below 0 dB at $\omega_{180}$.

::: key
Gain margin is how much the open-loop gain can grow before the closed loop goes unstable; phase margin is how much extra phase lag it can tolerate. For a launch vehicle, 6 dB and 30 degrees are typical minima because aerodynamics, actuators and flexible modes are all uncertain.
:::

Why demand margin from a stable loop? Because the model is a little wrong: wind-tunnel coefficients are uncertain, an actuator is slower on a cold day, the mass drops as propellant burns. Margins are the room you leave for all of it.

### margin and allmargin

`margin` does the search for you:

```matlab
s = tf('s');
P = 30/(s^2*(s + 30));         % rigid pitch: double integrator + actuator lag
C = 3 + 2*s/(1 + s/40);        % PD controller with a derivative filter
L = C*P;
[Gm, Pm, Wcg, Wcp] = margin(L)
% Gm  = 30.889     (a ratio, not dB)
% Pm  = 50.986     (degrees)
% Wcg = 33.148     (rad/s, where the phase is -180 deg)
% Wcp = 2.4081     (rad/s, where the gain is 0 dB)
GmdB = 20*log10(Gm)
% GmdB = 29.796
```

Called with no outputs, `margin(L)` draws the Bode plot and marks both margins on it, with the numbers in the title.

::: warning Wcg and Wcp are named backwards from what you expect
`Wcg` is the frequency where the **gain margin** is measured, which is the **phase** crossover. `Wcp` is where the **phase margin** is measured, the **gain** crossover. And `Gm` is a plain ratio: a returned `Gm = 2` is about 6 dB, not 2 dB. Convert with `20*log10(Gm)` (or `mag2db(Gm)`) before you compare it with a requirement.
:::

`margin` gives you one gain margin and one phase margin. A loop can cross 0 dB or $-180^\circ$ several times, and then one pair of numbers hides the rest. `allmargin(L)` returns a structure listing **every** crossing: fields `GainMargin` and `GMFrequency`, `PhaseMargin` and `PMFrequency`, `DelayMargin` and `DMFrequency`, and `Stable`, which is 1 when the closed loop is stable. Use `allmargin` whenever the Bode plot has a resonance, and always read `Stable` — margins measured on a loop that is already unstable mean nothing.

The PD controller above deserves a word. A **PD controller** sends a command $u = K_p e + K_d \dot{e}$: a part **proportional** to the error $e$ and a part proportional to how fast the error is changing, $\dot{e}$ (read "e dot"). A double integrator has $-180^\circ$ of phase at every frequency, so on its own it has zero phase margin. The derivative part adds up to $+90^\circ$ of phase **lead**, which lifts the phase above $-180^\circ$ near crossover. That lift is where the 51° above comes from.

## Delay: all lag, no gain

Every real loop has a **transport delay**: time during which the signal is on its way but nothing happens to it. The flight computer needs a few milliseconds to read the sensors and do the math; the command waits on a data bus; the actuator starts late. A delay of $T$ seconds has the transfer function $e^{-sT}$.

What does it do to a wave? It shifts it later by $T$ seconds and leaves its size alone. So its gain is exactly 1 at every frequency. A wave at $\omega$ rad/s moves through $\omega T$ radians in $T$ seconds, so the lag is

$$
\angle e^{-j\omega T} = -\omega T \ \text{radians}.
$$

The lag grows in a straight line with frequency. Slow waves barely notice a few milliseconds; fast ones lose a big slice of their cycle. To turn radians into degrees, multiply by $180/\pi \approx 57.3$, or call `rad2deg`.

::: key
A transport delay costs minus omega times T radians, with no change in gain. At a 10 rad/s crossover a 40 ms delay costs 0.4 rad, about 23 degrees, straight off the phase margin.
:::

Because the whole cost comes straight off the phase at crossover, you can also turn the question around. The **delay margin** is the largest extra delay the loop can take before its phase margin hits zero:

$$
T_{\max} = \frac{\text{PM in radians}}{\omega_c}.
$$

In MATLAB, a delay is written the way the math writes it. With `s = tf('s')`, the expression `exp(-0.03*s)` is a transfer function carrying a 0.03 s delay, and `margin` and `bode` handle it exactly. You can also set it as a property, `tf(num, den, 'InputDelay', 0.03)`. For tools that need an ordinary polynomial model, `pade(sys, n)` swaps the delay for an $n$-th order rational approximation.

::: example What 30 ms of delay does to the pitch loop
Take the pitch loop above: crossover $\omega_c = 2.408\,\mathrm{rad/s}$, phase margin $51.0^\circ$, gain margin $29.8\,\mathrm{dB}$. Add a 30 ms delay: `Ld = L*exp(-0.03*s)`.

**Step 1, the phase cost at crossover.** The delay does not change the gain, so the crossover stays at 2.408 rad/s. The phase lost there is

$$
\omega_c T = 2.408 \times 0.030 = 0.0722\,\mathrm{rad} = 0.0722 \times 57.3 = 4.14^\circ.
$$

**Step 2, the new phase margin.** $51.0^\circ - 4.14^\circ = 46.8^\circ$. Running `margin(Ld)` in MATLAB gives $46.8^\circ$, matching.

**Step 3, the delay margin of the original loop.** PM in radians is $51.0 \times \pi/180 = 0.890\,\mathrm{rad}$. Divide by crossover: $0.890 / 2.408 = 0.370\,\mathrm{s}$. The loop could take about 370 ms of delay before it oscillates.

**A surprise in the gain margin.** It falls from 29.8 dB to 20.7 dB, even though the delay has no gain. The delay's lag grows with frequency, so the phase now reaches $-180^\circ$ sooner — at 17.8 rad/s instead of 33.1 rad/s — where the loop gain is bigger.

**Sanity check.** Thirty milliseconds is short next to one cycle at crossover ($2\pi/2.408 = 2.6\,\mathrm{s}$), so a cost of a few degrees makes sense.
:::

::: warning Delay hurts fast loops most
The same 30 ms costs $4^\circ$ at a 2.4 rad/s crossover but $17^\circ$ at 10 rad/s and $69^\circ$ at 40 rad/s. Raise the bandwidth and you must re-check the delay budget. Count every source: computation, data buses, sensor filtering and the sample-and-hold of a digital controller, which the next lesson turns into a delay of its own.
:::

## Nyquist, Nichols and sigma: the same data, other views

The **Nyquist plot**, `nyquist(L)`, draws $L(j\omega)$ as a curve in the complex plane as $\omega$ runs from low to high (MATLAB also draws its mirror image). The **[[Nyquist criterion|nyquist-criterion]]** turns the picture into a stability test: when $L$ has no unstable poles of its own, the closed loop is stable exactly when the curve does **not** loop around $-1$. Margins become distances: if the curve crosses the negative real axis at $-a$, between $-1$ and $0$, the gain margin is $1/a$; and the phase margin is the angle, seen from the origin, between $-1$ and where the curve crosses the circle of radius 1.

The **Nichols plot**, `nichols(L)`, puts phase in degrees along the bottom and gain in dB up the side. The point $-1$ becomes the spot $(-180^\circ, 0\,\mathrm{dB})$. Where the curve passes the $-180^\circ$ line, the gap from there up to 0 dB is the gain margin in dB. Where the curve passes 0 dB, the gap from there across to $-180^\circ$ is the phase margin. Launch-vehicle teams like it because many flight conditions fit on one chart around one forbidden spot.

`sigma(G)` plots **[[singular values|singular-values]]**: for a system with several inputs and outputs, its largest and smallest gain at each frequency over every direction the input could point. For one input and one output, `sigma` draws the same curve as the top half of `bode`.

## Flexible modes, notches and a tamed derivative

A long, thin rocket bends like a diving board. Each **bending mode** has its own natural frequency and very little damping, often $\zeta$ of 0.005 to 0.02, and the rate gyro on the structure feels it. To the loop, a bending mode is the lightly damped block from the Bode section: a tall, narrow spike in gain at $\omega_n$, of height about $1/(2\zeta)$. With $\zeta = 0.01$ that spike is 50 times, or 34 dB.

If the spike lifts $|L|$ above 0 dB, the loop gets extra crossovers near $\omega_n$. Stability then hangs on the exact phase at the resonance, the least certain number in the model, since bending frequencies shift as propellant drains. Teams usually either **gain-stabilize** a bending mode — hold its peak below 0 dB with room to spare — or deliberately **phase-stabilize** it and give it its own phase requirement. For a mode well above crossover, gain stabilization is the common choice, and the tool is a notch filter.

A **notch filter** is a block that passes every frequency unchanged except a narrow band, which it cuts down:

$$
N(s) = \frac{s^2 + 2\zeta_z\omega_n s + \omega_n^2}{s^2 + 2\zeta_p\omega_n s + \omega_n^2}.
$$

Read $\zeta_z$ as "zeta z" (the **[[zeros|notch-zeros-poles]]** on top) and $\zeta_p$ as "zeta p" (the poles below). At very low and very high frequency, top and bottom are nearly equal, so $|N| \approx 1$. At exactly $\omega = \omega_n$, the $s^2$ and $\omega_n^2$ terms cancel on both lines, leaving

$$
|N(j\omega_n)| = \frac{2\zeta_z\omega_n^2}{2\zeta_p\omega_n^2} = \frac{\zeta_z}{\zeta_p}.
$$

So the **depth** of the notch is $\zeta_z/\zeta_p$, and its **width** grows with $\zeta_p$. A wider notch forgives a bending frequency that is not quite where you thought, but adds more phase lag below $\omega_n$, where your crossover lives.

The last piece is the derivative. A pure $K_d s$ has gain $K_d\omega$, which grows forever with frequency: it amplifies sensor noise and bending modes and cannot be built on its own. So real PD controllers add a **roll-off filter**:

$$
C(s) = K_p + \frac{K_d s}{1 + s/\omega_f}.
$$

Below the filter frequency $\omega_f$ it acts like the pure derivative. Above it, the derivative part levels off at $K_d\omega_f$. For the controller in this lesson, $K_p = 3$, $K_d = 2$ and $\omega_f = 40\,\mathrm{rad/s}$, so the high-frequency gain stops at about $3 + 2 \times 40 = 83$ instead of climbing past 2000 at 1000 rad/s.

::: example Taming a 30 rad/s bending mode with a notch
Add a bending mode at $\omega_n = 30\,\mathrm{rad/s}$ with $\zeta = 0.01$ to the pitch loop from before (no delay):

```matlab
wn = 30;
F  = wn^2/(s^2 + 2*0.01*wn*s + wn^2);    % bending mode seen by the gyro
L2 = C*P*F;
```

**Step 1, how tall is the spike?** Without the bending mode, $|L(j30)| = 0.039$. The mode multiplies that by about $1/(2 \times 0.01) = 50$, giving about 1.96, or $+5.8\,\mathrm{dB}$. The spike pokes above 0 dB.

**Step 2, what `allmargin` shows.** `m = allmargin(L2)` lists three gain crossovers in `m.PMFrequency`: 2.42 rad/s (the real one) and two more at 29.5 and 30.5 rad/s, on either side of the spike. `m.Stable` is 1, so the loop is stable today — but only thanks to the exact phase at 30 rad/s, which is the number you trust least.

**Step 3, design the notch.** Center it on the mode, $\omega_n = 30$. Choose $\zeta_z = 0.02$ and $\zeta_p = 0.5$, so the depth is $0.02/0.5 = 0.04$, which is $20\log_{10} 0.04 = -28\,\mathrm{dB}$:

```matlab
N  = (s^2 + 2*0.02*wn*s + wn^2)/(s^2 + 2*0.5*wn*s + wn^2);
L3 = C*N*P*F;
[Gm, Pm, Wcg, Wcp] = margin(L3)
% Gm  = 8.2594    -> 18.3 dB
% Pm  = 46.492    degrees
% Wcg = 15.836
% Wcp = 2.4142
```

The spike now peaks at $5.8 - 28 = -22\,\mathrm{dB}$, and there is one crossover again.

**Step 4, the price.** At 2.42 rad/s the notch adds $4.5^\circ$ of lag, which is why the phase margin fell from $51.0^\circ$ (rigid loop) to $46.5^\circ$. At 1 rad/s the notch's gain is 0.9994, so slow maneuvers see no difference.

**Sanity check.** Both margins clear the 6 dB and $30^\circ$ minimums, and the lag cost is a few degrees. A notch that is too wide would eat the phase margin it was meant to protect.
:::

## Check yourself

::: check
A loop's gain is 0.25 at the frequency where its phase is $-180^\circ$. What is its gain margin, as a factor and in dB? Does it meet a 6 dB requirement?
:::

::: answer
The gain margin is $1/0.25 = 4$. In decibels, $20\log_{10} 4 = 20 \times 0.602 = 12.0\,\mathrm{dB}$. That is well above 6 dB, so yes. (Check: 6 dB is a factor of about 2, and 4 is two doublings, so about 12 dB.)
:::

::: check
A loop has a phase margin of $40^\circ$ at a crossover of 8 rad/s. What is its delay margin in milliseconds?
:::

::: answer
Turn the margin into radians: $40 \times \pi/180 = 0.698\,\mathrm{rad}$. The delay's lag at crossover is $\omega_c T$, so the delay that uses up all of it is $T = 0.698/8 = 0.0873\,\mathrm{s}$, about 87 ms.
:::

::: check
`[Gm, Pm, Wcg, Wcp] = margin(L)` returns `Gm = 1.8`. A teammate reports "gain margin 1.8 dB, fails the 6 dB requirement badly". What went wrong, and does the loop pass?
:::

::: answer
`Gm` is a plain ratio, not decibels. In dB it is $20\log_{10} 1.8 = 5.1\,\mathrm{dB}$. So the loop does fail a 6 dB requirement, but narrowly, not badly: 6 dB would be a factor of about 2.0, and it has 1.8. The fix is to convert with `20*log10(Gm)` before comparing.
:::

::: check
You need a notch 20 dB deep at a bending mode. You pick $\zeta_p = 0.4$. What $\zeta_z$ do you need, and what happens to the rigid-body phase margin if you instead widen the notch with $\zeta_p = 0.8$?
:::

::: answer
A depth of 20 dB is a factor of $10^{-20/20} = 0.1$. The depth is $\zeta_z/\zeta_p$, so $\zeta_z = 0.1 \times 0.4 = 0.04$. Widening to $\zeta_p = 0.8$ (with $\zeta_z = 0.08$ to keep the same depth) spreads the notch's phase lag further down in frequency, so more of it lands at the rigid-body crossover and the phase margin there drops. The wider notch forgives an uncertain bending frequency, but you pay in phase.
:::

## Summary

| Idea | Meaning | Formula or command |
|---|---|---|
| Frequency response | gain and phase of a steady sine, per frequency | $G(j\omega)$ |
| Decibels | log scale for gain | $20\log_{10}\lvert G\rvert$; factor $= 10^{\text{dB}/20}$ |
| Bode plot | gain (dB) and phase (deg) against log frequency | `bode(G)`, `[mag,phase] = bode(G,w)` |
| Open loop | once around the loop | $L = CP$ |
| Gain margin | factor the gain can grow at the $-180^\circ$ frequency | $1/\lvert L(j\omega_{180})\rvert$ |
| Phase margin | extra lag allowed at the 0 dB frequency | $180^\circ + \angle L(j\omega_c)$ |
| Margins in MATLAB | one pair, or every crossing | `margin(L)`, `allmargin(L)` |
| Transport delay | pure lag, unit gain | $e^{-sT}$, phase $-\omega T$ rad |
| Delay margin | largest extra delay before instability | PM in rad $/\,\omega_c$ |
| Other views | complex plane, gain vs phase, MIMO gain | `nyquist`, `nichols`, `sigma` |
| Notch filter | deep cut at one frequency | depth $\zeta_z/\zeta_p$ at $\omega_n$ |
| Derivative roll-off | caps the D term's gain | $K_d s/(1 + s/\omega_f)$ |

The next lesson moves the controller onto a flight computer that works in time steps: `c2d` turns these continuous designs into discrete ones, and the sample-and-hold becomes one more delay to count against the phase margin you learned to measure here.

::: context bending-mode Rockets bend like diving boards
A launch vehicle is a tube tens of meters long and only a few meters wide, built as light as possible. Push on its tail with the engine and it bends a little, then springs back and forth. The slowest of these shapes, the **first bending mode**, looks like a bow: ends swinging one way, middle the other. A gyro mounted on the structure measures the local tilt of the bend on top of the rigid rotation, so the controller "sees" the bending and can feed energy into it if the loop is careless.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline points="20,36 40,43 60,50 80,56 100,62 120,67 140,71 160,74 180,75 200,74 220,71 240,67 260,62 280,56 300,50 320,43 340,36" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polyline points="20,84 40,77 60,70 80,64 100,58 120,53 140,49 160,46 180,45 200,46 220,49 240,53 260,58 280,64 300,70 320,77 340,84" fill="none" stroke="#8fb8f0" stroke-width="3"/>
  <circle cx="92" cy="60" r="4" fill="#b4232c"/>
  <circle cx="268" cy="60" r="4" fill="#b4232c"/>
  <text x="180" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">first bending mode: two swings, two still points (nodes, red)</text>
  <text x="24" y="24" font-size="11" fill="#1f2a44">engine end</text>
  <text x="336" y="24" font-size="11" text-anchor="end" fill="#1f2a44">nose</text>
</svg>
```
:::

::: context rad-per-sec Radians per second and hertz
One full cycle of a wave is $2\pi$ radians, so a wave at $\omega$ rad/s repeats $f = \omega/(2\pi)$ times a second, measured in **hertz** (Hz). A 30 rad/s bending mode shakes about 4.8 times a second; a 2.4 rad/s pitch loop swings about once every 2.6 seconds. Control math uses rad/s because the formulas come out cleaner — the delay's lag is $\omega T$ with no stray $2\pi$ in it. Test engineers with shakers and spectrum analyzers usually speak in Hz, so convert carefully when you read their reports.
:::

::: context log-axis Why the frequency axis is squashed
On a log axis, the distance from 1 to 10 equals the distance from 10 to 100, and from 100 to 1000. That lets one plot show a slow pitch loop near 1 rad/s and a bending mode at 100 rad/s with equal detail. Because gain is also plotted on a log scale (decibels), a gain that goes like $1/\omega$ becomes a straight line with slope $-20$ dB per decade, which is why Bode plots can be sketched with a ruler.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="32" x2="30" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="130" y1="32" x2="130" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="32" x2="230" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="32" x2="330" y2="48" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60.1" y1="36" x2="60.1" y2="44" stroke="#6c7a93"/>
  <line x1="77.7" y1="36" x2="77.7" y2="44" stroke="#6c7a93"/>
  <line x1="100" y1="36" x2="100" y2="44" stroke="#6c7a93"/>
  <text x="30" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="130" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="230" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="330" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="80" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">one decade</text>
  <text x="180" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">one decade</text>
  <text x="280" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">one decade</text>
  <text x="180" y="84" font-size="11" text-anchor="middle" fill="#6c7a93">grey ticks: 2, 3 and 5</text>
</svg>
```
:::

::: context mic-squeal Why a microphone squeals
A microphone near its own loudspeaker picks up the speaker's sound, the amplifier makes it louder, and the speaker plays it again. At most pitches the sound fades each trip around. But at the one pitch where a trip around the loop comes back at least as loud as it started, and lined up with itself, every trip adds to the last. The sound grows until the amplifier can give no more: the squeal. A control loop with $L(j\omega) = -1$ does exactly this, and on a rocket the "squeal" is an engine nozzle swinging back and forth.
:::

::: context nyquist-criterion Harry Nyquist and counting loops
Harry Nyquist worked at Bell Telephone Laboratories, where engineers were building amplifiers with feedback for long-distance phone lines and found that some of them sang on their own. In 1932 he published a way to tell, from measured gain and phase alone, whether the closed loop would be stable: follow the curve $L(j\omega)$ and count how many times it circles the point $-1$. The full rule also counts unstable poles of $L$ itself, which is why the simple version in this lesson assumes there are none.
:::

::: context singular-values One gain for many directions
With two inputs, you can push the first, the second, or some mix of both, and the size of the output depends on the mix. At each frequency, the **singular values** are the largest and smallest amplification over every possible mix. The largest one is the worst-case gain, and it is what robustness checks for multi-actuator vehicles rely on — a rocket steering with four gimbaled engines, say. You will meet the matrix math behind it, the singular value decomposition, in linear algebra.
:::

::: context notch-zeros-poles A notch is a pole and a zero pair almost on top of each other
The notch's zeros sit very close to the imaginary axis at $\pm j\omega_n$, because $\zeta_z$ is small. Its poles sit at the same distance from the origin but further left, because $\zeta_p$ is larger. Far from $\omega_n$ they look the same size and cancel. Right at $\omega_n$ you pass very close to the zeros and much further from the poles, so the gain dips.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="75" x2="330" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <line x1="300" y1="10" x2="300" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="326" y="92" font-size="11" text-anchor="end" fill="#6c7a93">real</text>
  <text x="306" y="20" font-size="11" fill="#6c7a93">imag</text>
  <path d="M300,15 A60,60 0 0,0 300,135" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="297" cy="15" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="297" cy="135" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M265,18 l10,10 M275,18 l-10,10" stroke="#b4232c" stroke-width="2"/>
  <path d="M265,122 l10,10 M275,122 l-10,10" stroke="#b4232c" stroke-width="2"/>
  <text x="250" y="14" font-size="11" text-anchor="end" fill="#1d6fd1">zeros (o): almost on the axis</text>
  <text x="250" y="50" font-size="11" text-anchor="end" fill="#b4232c">poles (x): same distance, further left</text>
  <text x="200" y="100" font-size="11" text-anchor="end" fill="#6c7a93">dashed: radius omega n</text>
</svg>
```
:::
