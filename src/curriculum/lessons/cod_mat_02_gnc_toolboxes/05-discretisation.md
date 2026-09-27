---
id: l05-discretisation
title: 'Discretisation: c2d, d2c, zoh and tustin'
minutes: 16
covers:
  - c2d and d2c with zoh, tustin and prewarp; c2dOptions
---

Picture a sailor steering at night who can only glance at the compass once a minute. At each glance she reads the heading, decides how far to turn the wheel, sets it, and then holds the wheel still until the next glance. Between glances the boat keeps moving, but the wheel does not.

A flight computer steers exactly like that. It does not watch the rocket continuously. It wakes up on a fixed **[[tick|rate-groups]]**, reads the gyros, runs the control law, sends one number to each actuator, and holds that number until the next tick. Flight computers commonly run attitude control at 50 to a few hundred ticks per second. Everything between the ticks is invisible to the software.

The last lesson designed controllers with $s$, as if the computer were watching all the time. This lesson turns those designs into the step-by-step form a computer runs, and turns plants into the form a digital controller sees. That step is called **discretisation** — rewriting a continuous-time model as a discrete-time one that updates in steps. MATLAB does it with `c2d` ("continuous to discrete") and undoes it with `d2c`. The method you choose matters, and picking the wrong one can quietly move a notch filter off the mode it was meant to kill.

## Samples, holds and the sample time

A few words first.

- The **sample time** $T_s$ (read "T sub s") is the time between ticks, in seconds. Its flip, $f_s = 1/T_s$, is the **sample rate** in hertz. A 50 Hz controller has $T_s = 0.02\,\mathrm{s}$.
- A **sample** is the value of a signal at one tick. Write the tick number as $k$ (0, 1, 2, …), so $y[k]$, read "y at k", means $y(kT_s)$. Square brackets mark a step number instead of a time.
- A **[[zero-order hold|zoh-name]]** (ZOH) is what the computer's output stage does: it holds each command flat until the next one arrives, so the actuator sees a staircase.

Sampling throws information away. To pin down a wave you need at least two samples in each of its cycles; a faster wave cannot be told apart from a slower one. The fastest frequency a sampled system can represent is the **Nyquist frequency**, half the sample rate:

$$
\omega_N = \frac{\pi}{T_s}\ \mathrm{rad/s}, \qquad f_N = \frac{f_s}{2}\ \mathrm{Hz}.
$$

At 50 Hz that is $\pi/0.02 = 157\,\mathrm{rad/s}$, or 25 Hz. Anything faster **[[aliases|aliasing]]**: it shows up in the samples disguised as a slower wave. That is why sensor signals pass through an analog filter before they are sampled, and why a bending mode above $\omega_N$ can still sneak into a digital loop.

## The shift operator z

A continuous model says how fast things change right now: $\dot{x} = f(x, u)$. A discrete model says what the state will be at the **next tick**: $x[k+1] = f(x[k], u[k])$. Instead of $s$, discrete transfer functions use the letter $z$, which you can read as "one step ahead". Its partner $z^{-1}$ means "one step back", a delay of exactly one sample.

A discrete transfer function is a recipe for a **[[difference equation|difference-code]]** — a formula that makes each new output from recent inputs and outputs. For example,

$$
G(z) = \frac{0.2592}{z - 0.7408}
\quad\Longleftrightarrow\quad
y[k+1] = 0.7408\,y[k] + 0.2592\,u[k].
$$

Each tick, the new output keeps 74 percent of the old one and adds 26 percent of the input. That is a loop of two multiplications and one addition, which is why flight software can run it thousands of times a second.

Poles move too. A continuous pole at $s = p$ becomes a discrete pole at

$$
z = e^{pT_s}.
$$

A pole with $p < 0$ lands **inside** the circle of radius 1, because $e^{\text{negative}} < 1$. So the rule for stability changes shape: continuous poles must sit in the left half-plane; discrete poles must sit **[[inside the unit circle|unit-circle]]**, $|z| < 1$.

::: warning Stable means |z| < 1, not a negative real part
A discrete pole at $z = 0.9$ is stable even though $0.9$ is positive, and a pole at $z = -1.2$ is unstable even though $-1.2$ is negative. When you call `pole` on a discrete model, look at the size of each pole, `abs(pole(sysd))`, never at its sign.
:::

## c2d with zoh: exact for a staircase input

When a digital controller drives a real plant, the plant receives a staircase from the hold. Between ticks the input is constant, so you can solve the plant's differential equation over one tick exactly. The **zoh method** does exactly that. It is not an approximation: at the sample instants, the discrete model's output equals the continuous plant's output, as long as the input really is held flat between ticks.

```matlab
s  = tf('s');
A  = 30/(s + 30);            % actuator: first-order lag, 30 rad/s
Ad = c2d(A, 0.01, 'zoh')     % 100 Hz
% Ad =
%     0.2592
%   ----------
%   z - 0.7408
% Sample time: 0.01 seconds
```

Where do the numbers come from? The pole: $e^{-30 \times 0.01} = e^{-0.3} = 0.7408$. The top: $1 - 0.7408 = 0.2592$, chosen so that a steady input of 1 gives a steady output of 1, the same as the continuous actuator.

::: note Why zoh gives exactly these numbers
The actuator obeys $\dot{y} = -30y + 30u$. Over one tick, from $t = kT_s$ to $(k+1)T_s$, the hold keeps $u = u[k]$ fixed. With a constant input this equation has the solution $y(t) = u[k] + (y[k] - u[k])e^{-30(t - kT_s)}$: the output slides exponentially from where it was toward $u[k]$. Set $t = (k+1)T_s$:

$$
y[k+1] = e^{-30T_s}\,y[k] + \big(1 - e^{-30T_s}\big)\,u[k].
$$

With $T_s = 0.01$ that is $0.7408\,y[k] + 0.2592\,u[k]$, the same recipe `c2d` printed. No step was approximated; only the input was assumed flat.
:::

::: example Discretising a pitch plant and checking it
A rigid rocket's pitch angle responds to a torque like a double integrator, $P(s) = 1/s^2$. Discretise it for a 50 Hz controller.

**Step 1, run c2d.** `Pd = c2d(1/s^2, 0.02, 'zoh')` gives

$$
P_d(z) = \frac{0.0002\,z + 0.0002}{z^2 - 2z + 1} = \frac{0.0002\,(z + 1)}{(z - 1)^2}.
$$

**Step 2, check the poles.** The bottom is $(z-1)^2$, so both poles are at $z = 1$. That matches the rule $z = e^{pT_s}$: the continuous poles are at $s = 0$, and $e^0 = 1$. An integrator sits right on the unit circle, neither growing nor shrinking by itself, as it should.

**Step 3, check the number 0.0002.** Hold a torque input of 1 for one tick, starting from rest. The angle of a double integrator under constant input is $\tfrac{1}{2}t^2$, so after 0.02 s it is $\tfrac{1}{2}(0.02)^2 = 0.0002$. The discrete model agrees: with zero history, $y[1] = 0.0002 \times u[0] = 0.0002$.

**Sanity check on the actuator too.** Feed $A_d$ a step of 1 for five ticks: $y$ goes $0.259, 0.451, 0.593, 0.699, 0.777$. The continuous actuator after 0.05 s gives $1 - e^{-1.5} = 0.777$. Exact at the samples, as promised.
:::

### The hold costs phase

The staircase is the smooth signal pushed later by about half a step, on average. So a zero-order hold acts roughly like a transport delay of $T_s/2$, and the last lesson told you what a delay does: it costs $\omega T$ radians of phase. At crossover,

$$
\text{phase lost to the hold} \approx \omega_c \frac{T_s}{2}.
$$

With a 10 rad/s crossover at 50 Hz, that is $10 \times 0.01 = 0.1\,\mathrm{rad}$, about $5.7^\circ$. Real flight code often adds up to a whole extra sample, because the command computed from tick $k$ goes out at tick $k+1$. Both belong in the delay budget. This is also why teams sample much faster than the loop: many textbooks suggest a sample rate at least 20 times the closed-loop bandwidth, so the hold's lag stays small.

## c2d with tustin: keeping the shape of a filter

A controller or a filter is different. It is not a physical thing receiving a staircase; it is a formula you get to choose. What you want is for the digital version to have the **same frequency response** as the continuous design you tuned in lesson 4. The **tustin method**, also called the **[[bilinear|bilinear-word]]** transform, is built for that. It replaces every $s$ with

$$
s \leftarrow \frac{2}{T_s}\,\frac{z - 1}{z + 1}.
$$

This comes from the **[[trapezoid rule|trapezoid-rule]]** for integration: approximate the area under a curve over one tick by a trapezoid instead of a rectangle. Two properties make it the favorite for controllers. It maps the whole stable left half-plane onto the inside of the unit circle, so a stable controller always stays stable. And its frequency response keeps the same shape — the same peaks, dips and slopes in the same order.

The catch is **frequency warping**. Tustin squeezes the infinite continuous frequency axis into the finite range up to $\omega_N$, so frequencies slide. A feature at continuous frequency $\omega_a$ ends up at digital frequency

$$
\omega_d = \frac{2}{T_s}\arctan\!\left(\frac{\omega_a T_s}{2}\right).
$$

Read it as "two over T s, times the arctangent of omega a times T s over two". For frequencies far below $\omega_N$, $\arctan(x) \approx x$ and $\omega_d \approx \omega_a$: no harm done. Near $\omega_N$, the slide is big.

The fix is **prewarping**: tell Tustin one frequency that must come out exactly right, and it stretches the map so that frequency lands where it belongs. You choose the frequency you care most about — a notch center, or the crossover.

In MATLAB, method details go into a **`c2dOptions`** object, which you then pass to `c2d`:

```matlab
opts = c2dOptions('Method', 'tustin', 'PrewarpFrequency', 60);
Nd   = c2d(N, 0.02, opts);
```

`c2d(sys, Ts, 'tustin')` is the short form when you need no options. (In GNU Octave's control package, the same prewarped design is `c2d(N, 0.02, 'prewarp', 60)`.)

::: example A notch that misses its mode
A bending mode sits at 60 rad/s. You design a continuous notch there, depth $\zeta_z/\zeta_p = 0.02/0.5 = 0.04$ (−28 dB), and the controller runs at 50 Hz.

```matlab
wn = 60;  Ts = 0.02;
N  = (s^2 + 2*0.02*wn*s + wn^2)/(s^2 + 2*0.5*wn*s + wn^2);
Nt = c2d(N, Ts, 'tustin');                    % no prewarp
opts = c2dOptions('Method','tustin','PrewarpFrequency',wn);
Np = c2d(N, Ts, opts);                        % prewarped at 60 rad/s
```

**Step 1, where does plain Tustin put the notch?** Use the warping formula with $\omega_a = 60$ and $T_s = 0.02$:

$$
\omega_d = \frac{2}{0.02}\arctan\!\left(\frac{60 \times 0.02}{2}\right) = 100\arctan(0.6) = 100 \times 0.5404 = 54.0\,\mathrm{rad/s}.
$$

The notch now sits at 54 rad/s, 10 percent low.

**Step 2, what does the mode see?** Evaluating `bode(Nt, 60)` gives a gain of 0.257 at 60 rad/s, which is $20\log_{10} 0.257 = -11.8\,\mathrm{dB}$ instead of −28 dB. The mode gets about 16 dB less attenuation than you designed for.

**Step 3, prewarp.** With `PrewarpFrequency` set to 60, the bottom of `Np`'s notch lands at 60 rad/s and its depth there is back to 0.04.

**Sanity check.** 60 rad/s is not far below the Nyquist frequency of 157 rad/s, so a big slide is expected. A notch at 5 rad/s would barely move: $100\arctan(0.05) = 4.996\,\mathrm{rad/s}$.
:::

## Choosing the method, and going back with d2c

The two methods answer different questions. Zoh asks "what does the plant do when a computer holds its input?" Tustin asks "what digital filter behaves most like this continuous one?"

::: key
zoh models a sample-and-hold exactly, which is what a digital controller driving an actuator does. tustin is a bilinear map that preserves frequency-response shape better and can be prewarped to match at a chosen frequency. Pick zoh for plants, tustin for filters and controllers.
:::

`c2d` knows other methods too, such as `'foh'` (a hold that ramps between samples instead of stepping), `'impulse'` and `'matched'` (which moves each pole and zero with $z = e^{sT_s}$). Zoh and Tustin cover almost everything a GNC engineer does.

`d2c` runs the conversion backwards, turning a discrete model into a continuous one with the method you name:

```matlab
Ac = d2c(Ad, 'zoh')
% Ac =
%     30
%   ------
%   s + 30
```

The round trip gives back the actuator exactly. You use `d2c` when a model arrives in discrete form — for instance, one fitted to flight-test data sampled at 100 Hz — and you want to compare it with a continuous design, or re-discretise it at a different rate. It works by taking a logarithm of the poles, $s = \ln(z)/T_s$, so a discrete pole at $z = 0$ (a pure one-step delay) has no finite continuous twin and will not convert cleanly.

::: warning Use the same Ts everywhere, and the right method for the right block
Connecting models with different sample times, or a continuous model to a discrete one, makes MATLAB stop with an error; convert first with `c2d`, or change rates with `d2d`. And do not zoh-discretise a notch or a lead filter because zoh is the default of `c2d`: zoh adds the hold's lag and bends the filter's shape. Tustin for your filters, zoh for the plant they will control.
:::

## Check yourself

::: check
A controller runs at 200 Hz. What is its sample time, and what is its Nyquist frequency in rad/s and in Hz?
:::

::: answer
The sample time is $T_s = 1/200 = 0.005\,\mathrm{s}$. The Nyquist frequency is half the sample rate, $200/2 = 100\,\mathrm{Hz}$, which in rad/s is $\pi/T_s = \pi/0.005 = 628\,\mathrm{rad/s}$. (Check: $2\pi \times 100 = 628$.)
:::

::: check
A continuous plant has a pole at $s = -5$. Where is its pole after `c2d` with zoh at 0.1 s, and is it stable? What about a pole at $s = +2$?
:::

::: answer
Use $z = e^{pT_s}$. For $p = -5$: $z = e^{-0.5} = 0.607$, inside the unit circle, so stable. For $p = +2$: $z = e^{0.2} = 1.22$, outside the unit circle, so unstable. The discrete model keeps the plant's stability, as an exact method should.
:::

::: check
Your pitch loop crosses over at 6 rad/s and the flight computer runs at 25 Hz. Roughly how much phase margin does the zero-order hold cost, in degrees?
:::

::: answer
$T_s = 1/25 = 0.04\,\mathrm{s}$, so the hold acts like a delay of about $T_s/2 = 0.02\,\mathrm{s}$. The phase lost at crossover is $\omega_c T_s/2 = 6 \times 0.02 = 0.12\,\mathrm{rad}$, and $0.12 \times 57.3 = 6.9^\circ$. That comes straight off the phase margin, before counting computation delay.
:::

::: check
A teammate discretises a continuous lead compensator with `c2d(C, Ts, 'zoh')` and discretises the plant with `c2d(P, Ts, 'tustin')`. What would you change, and why?
:::

::: answer
Swap them. The plant really is driven through a sample-and-hold, so zoh gives its exact behavior at the sample instants; Tustin only approximates it. The compensator is a formula you choose, and you want its frequency response to match the one you tuned; Tustin keeps that shape (and can be prewarped at crossover), while zoh distorts it.
:::

::: check
With Tustin at $T_s = 0.01\,\mathrm{s}$ and no prewarp, where does a continuous notch at 150 rad/s end up?
:::

::: answer
$\omega_d = (2/T_s)\arctan(\omega_a T_s/2) = 200\arctan(150 \times 0.01/2) = 200\arctan(0.75) = 200 \times 0.6435 = 128.7\,\mathrm{rad/s}$. It lands about 14 percent low. Prewarping at 150 rad/s puts it back where it belongs.
:::

## Summary

| Idea | Meaning | Formula or command |
|---|---|---|
| Sample time | seconds between ticks | $T_s = 1/f_s$ |
| Nyquist frequency | fastest frequency the samples can show | $\pi/T_s$ rad/s $= f_s/2$ Hz |
| Shift operator | one step ahead; $z^{-1}$ is one-sample delay | $y[k+1]$ from $y[k]$, $u[k]$ |
| Pole mapping | continuous pole to discrete pole | $z = e^{pT_s}$; stable if $\lvert z\rvert < 1$ |
| zoh | exact for a held staircase input | `c2d(P, Ts, 'zoh')` — for plants |
| Hold's lag | acts like half a sample of delay | about $\omega_c T_s/2$ rad |
| tustin | trapezoid rule, keeps response shape | $s \leftarrow \frac{2}{T_s}\frac{z-1}{z+1}$ — for controllers and filters |
| Warping | Tustin slides frequencies down | $\omega_d = \frac{2}{T_s}\arctan(\omega_a T_s/2)$ |
| Prewarp | match one chosen frequency exactly | `c2dOptions('Method','tustin','PrewarpFrequency',w0)` |
| d2c | discrete back to continuous | `d2c(sysd, 'zoh')` |

The next lesson opens up the state-space model from lesson 1 and designs controllers and estimators straight from its matrices — `place`, `lqr` and `kalman`, with `dlqr` as the discrete version for the sampled models you can now build.

::: context rate-groups How flight software keeps time
Flight software is usually built around a fixed schedule. A hardware timer interrupts the processor at a steady rate, and each interrupt starts a **frame**. Tasks are sorted into **rate groups**: the attitude control law might run every frame, guidance every tenth frame, housekeeping once a second. Because every task runs at a known rate, its sample time $T_s$ is a fixed number that the control design can rely on — which is exactly what `c2d` assumes.
:::

::: context zoh-name Why "zero-order"
A hold rebuilds a smooth signal from its samples using a small polynomial between ticks. A polynomial of **order zero** is a constant, so a zero-order hold draws flat steps. A first-order hold uses a straight line (order one), so it draws ramps. Real digital-to-analog converters and actuator command registers behave as zero-order holds: they keep the last number until a new one is written.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="95" x2="340" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="20,95 25,91 30,86 35,82 40,78 45,74 50,70 55,66 60,63 65,59 70,56 75,53 80,51 85,48 90,46 95,44 100,43 105,42 110,41 115,40 120,40 125,40 130,41 135,42 140,43 145,44 150,46 155,48 160,51 165,53 170,56 175,59 180,63 185,66 190,70 195,74 200,78 205,82 210,86 215,91 220,95 225,99 230,104 235,108 240,112 245,116 250,120 255,124 260,127 265,131 270,134 275,137 280,139 285,142 290,144 295,146 300,147 305,148 310,149 315,150 320,150 325,150 330,149 335,148 340,147" fill="none" stroke="#8fb8f0" stroke-width="2.5"/>
  <polyline points="20,95 60,95 60,63 100,63 100,43 140,43 140,43 180,43 180,63 220,63 220,95 260,95 260,127 300,127 300,147 340,147" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="20" cy="95" r="3" fill="#b4232c"/>
  <circle cx="60" cy="63" r="3" fill="#b4232c"/>
  <circle cx="100" cy="43" r="3" fill="#b4232c"/>
  <circle cx="140" cy="43" r="3" fill="#b4232c"/>
  <circle cx="180" cy="63" r="3" fill="#b4232c"/>
  <circle cx="220" cy="95" r="3" fill="#b4232c"/>
  <circle cx="260" cy="127" r="3" fill="#b4232c"/>
  <circle cx="300" cy="147" r="3" fill="#b4232c"/>
  <circle cx="340" cy="147" r="3" fill="#b4232c"/>
  <text x="180" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">smooth signal (light), samples (red), held flat until the next tick (dark)</text>
</svg>
```
:::

::: context aliasing The wagon wheel that spins backwards
In old films, a stagecoach wheel sometimes seems to turn slowly backwards. The camera takes 24 pictures a second; if a spoke moves almost one spoke-gap between frames, each picture shows it slightly behind where the last one did. The fast motion is recorded as a slow backwards one. A sampled sensor does the same to any vibration faster than the Nyquist frequency, and no software can undo it afterwards — the information is gone once it is sampled. So the filtering must happen before the sample is taken.
:::

::: context difference-code From a transfer function to a line of C
A difference equation is what finally ends up in the flight code. The actuator model here becomes one line inside the control task, something like `y = 0.7408f*y + 0.2592f*u;`, run once per tick with `y` kept between calls. Later in the Simulink modules, Embedded Coder writes lines like this for you from discrete blocks, and checking that they match `c2d`'s numbers is one of the first tests a team runs.
:::

::: context unit-circle Where the left half-plane goes
The map $z = e^{sT_s}$ bends the $s$-plane around. The imaginary axis, $s = j\omega$, becomes the unit circle, because $|e^{j\omega T_s}| = 1$ for every $\omega$. The whole stable left half-plane folds inside the circle, and the unstable right half-plane lands outside it. The origin $s = 0$ goes to $z = 1$, and very fast, well-damped poles crowd toward $z = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="70" height="110" fill="#8fb8f0"/>
  <line x1="20" y1="70" x2="150" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <line x1="90" y1="15" x2="90" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <text x="85" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">s-plane: stable is left</text>
  <text x="178" y="66" font-size="12" text-anchor="middle" fill="#1f2a44">z = e^(sTs)</text>
  <line x1="155" y1="74" x2="200" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M200,74 l-7,-4 l0,8 Z" fill="#1f2a44"/>
  <circle cx="280" cy="70" r="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="220" y1="70" x2="345" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <line x1="280" y1="15" x2="280" y2="125" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="325" cy="70" r="3" fill="#b4232c"/>
  <text x="330" y="62" font-size="11" fill="#b4232c">1</text>
  <text x="280" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">z-plane: stable is inside</text>
</svg>
```
:::

::: context bilinear-word Why "bilinear"
The Tustin substitution $s = \frac{2}{T_s}\frac{z-1}{z+1}$ has a straight-line (linear) expression in $z$ on top and another on the bottom. A fraction made of two such pieces is called a bilinear map, or a Möbius transformation in mathematics. Maps like this send circles and lines to circles and lines, which is exactly why the imaginary axis of the $s$-plane lands neatly on the unit circle of the $z$-plane.
:::

::: context trapezoid-rule Rectangles versus trapezoids
To add up the area under a curve one tick at a time, the simplest way is a rectangle using the value at one end. Tustin's method uses a trapezoid: the average of the values at both ends, times the tick length. The trapezoid hugs a sloping curve much better. Arnold Tustin, a British electrical engineer, brought this idea into control engineering in the 1940s, which is why MATLAB's option carries his name.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="70" width="80" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <path d="M40,70 Q80,52 120,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="80" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">rectangle: misses a lot</text>
  <path d="M220,110 L220,70 L300,30 L300,110 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M220,70 Q260,52 300,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="260" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">trapezoid: hugs the curve</text>
</svg>
```
:::
