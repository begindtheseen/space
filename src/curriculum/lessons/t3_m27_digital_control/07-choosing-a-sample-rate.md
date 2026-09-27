---
id: l07-choosing-a-sample-rate
title: Choosing a sample rate
minutes: 22
covers:
  - 'Choosing a sample rate: the 20-40x bandwidth rule of thumb and what drives the ends of that range'
---

Try riding a bike with your eyes shut, opening them for a blink every few seconds. You will crash. Open them ten times a second and you will ride fine. Open them a thousand times a second and you ride no better. A flight computer controlling a vehicle is in the same position. It looks at its sensors at fixed moments, decides, and acts. How often it looks is the **sample rate** $f_s$ (read "f sub s"): the number of times per second the loop runs. The time between looks is the **sample period** $T = 1/f_s$.

Somebody has to write that number into the software requirements, and it will be a round one: $50\,\mathrm{Hz}$, $200\,\mathrm{Hz}$, $400\,\mathrm{Hz}$. Once it is written, the processor is sized around it, the data bus schedule is built around it, and the sensors are set up to match. Changing it eighteen months later means testing the flight computer all over again. It is one of the earliest decisions on a program and one of the hardest to undo.

The rule of thumb is $20$ to $40$ times the closed-loop bandwidth. Both ends of that range have reasons, and the reasons are different in kind. The lower end is set by **phase** — how late the loop reacts — which is a control problem. The upper end is set by processor time, sensor rate, noise and number precision, which are implementation problems. Knowing which one binds on your vehicle is worth more than knowing the range. This lesson builds the lower end from the phase budget of the last three lessons, then looks at each upper-end driver with numbers.

## The lower bound is a phase budget

Think of pushing a child on a swing. Push at the right moment and the swing goes smoothly. Push a little late every time and you start fighting it. A feedback loop has the same weakness: every bit of lateness at the frequency where it works hardest eats into its safety margin.

That frequency is the **crossover frequency** $f_c$ ("f sub c"): the frequency where the open-loop gain passes through $1$. The **[[phase margin|phase-margin-refresher]]** is read there — how many degrees of extra lag the loop could take before it goes unstable. A delay of $\tau$ seconds costs $360^\circ f\tau$ of phase at frequency $f$, because one full cycle takes $1/f$ seconds and is worth $360^\circ$.

Going digital adds two unavoidable delays.

- The **zero-order hold** — the part that holds each command steady until the next one — behaves like a delay of **[[half a sample|zoh-half-sample]]**, $T/2$. Its cost at crossover is $360^\circ f_c \cdot T/2 = 180^\circ f_c/f_s$.
- The **computational delay** of one frame — reading the sensor in one frame and sending the command at the start of the next — is a full sample, $T$. Its cost is $360^\circ f_c/f_s$.

Add them. Three half-samples in all:

$$
\Delta\phi_{\text{digital}} = 540^\circ\,\frac{f_c}{f_s} .
$$

Here $\Delta\phi$ ("delta phi") is the phase the digital implementation takes away. The anti-alias filter of the first lesson takes some too, but its size depends on what it has to block, not only on $f_s$, so keep it separate and add it afterwards. Here is the digital part as a table:

| $f_s/f_c$ | Hold alone | Hold plus one frame |
| --- | --- | --- |
| $10$ | $18.0^\circ$ | $54.0^\circ$ |
| $20$ | $9.0^\circ$ | $27.0^\circ$ |
| $30$ | $6.0^\circ$ | $18.0^\circ$ |
| $40$ | $4.5^\circ$ | $13.5^\circ$ |
| $60$ | $3.0^\circ$ | $9.0^\circ$ |
| $100$ | $1.8^\circ$ | $5.4^\circ$ |

There is the **[[rule of thumb|phase-cost-curve]]**, in one column. At $20\times$ the implementation takes $27^\circ$. That is the most a design can give away and still be recognizable: a continuous design with $55^\circ$ of margin flies with $28^\circ$, and $28^\circ$ is about the least anyone accepts. At $40\times$ it takes $13.5^\circ$, and the same design flies with $41^\circ$, which is comfortable. Below $20\times$ the loss is more than any reasonable continuous margin can pay for. Above $40\times$ the returns shrink fast: going from $40$ all the way to $100$ buys back only another $8^\circ$.

One word needs care, because a factor of about two hides in it. Crossover $f_c$ is where the *open-loop* gain passes unity. **Closed-loop bandwidth** $f_{\text{BW}}$ is where the *closed-loop* response has fallen to $-3\,\mathrm{dB}$, about $71\%$ of its low-frequency value. For a well-damped loop, $f_{\text{BW}}$ is about $1.0$ to $1.6$ times $f_c$. The rule is loose enough that it works with either. Use crossover when you calculate, since that is where the margin is read.

::: key
**Choosing a sample rate.** The Nyquist-Shannon theorem says a signal band-limited to $f_{\max}$ is recoverable only if sampled above $2f_{\max}$. For closed-loop control that is far too loose: use $20$ to $40$ times the closed-loop bandwidth. The lower end is set by the phase the zero-order hold and the computational delay eat at crossover — $540^\circ f_c/f_s$ for a hold plus one frame. The upper end is set by CPU budget, sensor update rate, quantization noise amplification by derivative terms, and numerical conditioning of the difference equations.
:::

## A second lower-bound driver: modes you have to shape

Phase at crossover is not the only thing pushing the rate up. A rocket is not a rigid brick. It flexes, like a long ruler twanged on a desk, at its **[[bending modes|bending-modes]]** — natural wobble frequencies of the structure. If the controller has to do something on purpose about one of those modes, the sample rate must be high enough to do it. There are three strategies, and each asks something different.

A mode you plan to **notch** — cut out with a narrow filter — must sit well below the **Nyquist frequency** $f_s/2$. A notch is a feature of the discrete filter's response, and above $f_s/2$ there is no response to shape. Worse, the Tustin warping of the discretization lesson squeezes the band near Nyquist, so a notch placed above about a quarter of the sample rate comes out lopsided even when prewarped. A working rule is $f_s \ge 8$ to $10$ times the highest mode frequency you must actively notch.

A mode you plan to **phase stabilize** keeps its gain, but you arrange its phase so the mode's feedback helps rather than hurts — the plan the classical control module set out. That needs an accurate idea of the phase at the mode frequency $f_m$, and the hold and computational delay cost $540^\circ f_m/f_s$ there too. At $f_s = 10 f_m$ that is $54^\circ$ of extra lag sitting on top of the phase you were trying to control.

A mode you plan to **gain stabilize** is filtered down below unity gain so its phase stops mattering. That needs the mode to be sampled properly in the first place, or the filtering happens at the wrong frequency. The first lesson's $47\,\mathrm{Hz}$ mode that folded to $3\,\mathrm{Hz}$ in a $50\,\mathrm{Hz}$ loop is exactly a gain-stabilization plan defeated by the sampler.

## What stops you going faster

If faster buys phase, why not run everything at $10\,\mathrm{kHz}$? Because five things push back.

**Processor budget.** The control law is one task among many: navigation, guidance, fault detection, telemetry, managing backup hardware, servicing the data bus. Doubling the rate doubles the control task's share of the processor and cuts every other task's slack. Flight software is sized by **[[worst-case execution time|wcet]]**, not the average, so the spare time has to survive the worst frame in the worst mode. Often the rate is set by what fits with margin after everything else is counted, and then checked against the phase budget — not the other way round.

**Sensor update rate.** You cannot sample information that does not exist. Reading a $100\,\mathrm{Hz}$ gyro at $400\,\mathrm{Hz}$ returns each value four times. That is a zero-order hold in the *measurement* path: no new information, plus an extra average lag of half the sensor's period. The useful rate is the sensor's rate or a whole-number fraction of it, and on many vehicles this is what really sets the loop rate.

**Quantization noise through derivative terms.** A sensor reports in whole steps, like a ruler marked only in millimeters. The step is the **[[quantization step|quantization-step]]** $q$, and the rounding error it leaves acts like a small noise with **standard deviation** (typical size) $q/\sqrt{12}$ (the next lesson shows why). A derivative taken as a raw **backward difference**, $(x[n] - x[n-1])/T$, divides by $T$. So halving $T$ doubles the noise at the derivative's output.

Take a $16$-bit rate gyro spanning $\pm 300^\circ/\mathrm{s}$. Its range is $600^\circ/\mathrm{s}$ split into $2^{16} = 65{,}536$ steps, so $q = 600/65536 = 9.155\times10^{-3}\,{}^\circ/\mathrm{s}$. The rounding error has standard deviation $q/\sqrt{12} = 2.643\times10^{-3}\,{}^\circ/\mathrm{s}$. The difference of two independent errors has $\sqrt2$ times that; then divide by $T$:

| $f_s$ | Noise at the derivative output |
| --- | --- |
| $50\,\mathrm{Hz}$ | $0.187\,{}^\circ/\mathrm{s^2}$ |
| $200\,\mathrm{Hz}$ | $0.748\,{}^\circ/\mathrm{s^2}$ |
| $500\,\mathrm{Hz}$ | $1.869\,{}^\circ/\mathrm{s^2}$ |
| $5\,\mathrm{kHz}$ | $18.69\,{}^\circ/\mathrm{s^2}$ |

A hundred times the rate gives a hundred times the derivative noise, all of it going straight to the actuator. The cure is a *filtered* derivative rather than a raw difference, which is why the classical control module insisted on one. The next lesson works through quantization properly.

**Numerical conditioning.** A continuous pole at $s$ lands at $z = e^{sT}$ in the discrete world. As $T$ shrinks, $sT$ shrinks, and every pole **[[crowds against z = 1|poles-crowd]]**. Picture a second-order section with denominator $z^2 + a_1 z + a_2$. For a pole pair at radius $r$ and angle $\theta$, $a_1 = -2r\cos\theta$ and $a_2 = r^2$. As the poles crowd toward $1$, $a_1 \to -2$ and $a_2 \to +1$, and the part of each coefficient that carries the actual dynamics retreats into the last few digits:

| $f_s$ | $a_1$ | $a_2$ | Error in $\sigma$ from one $2^{-15}$ step in $a_2$ |
| --- | --- | --- | --- |
| $50\,\mathrm{Hz}$ | $-1.824216$ | $0.838677$ | $0.021\%$ |
| $1\,\mathrm{kHz}$ | $-1.991203$ | $0.991242$ | $0.350\%$ |
| $10\,\mathrm{kHz}$ | $-1.999120$ | $0.999121$ | $3.47\%$ |
| $100\,\mathrm{kHz}$ | $-1.999912$ | $0.999912$ | $34.7\%$ |

The pole pair is the same throughout: $1\,\mathrm{Hz}$ with damping ratio $\zeta = 0.7$, so its decay rate is $\sigma = \zeta\omega_n = 4.398\,\mathrm{s^{-1}}$ ($\sigma$ is "sigma", $\omega_n$ "omega sub n", the natural frequency in rad/s). At $100\,\mathrm{kHz}$, one step of a $16$-bit coefficient changes the decay rate by a third. The running arithmetic suffers too. To leading order the difference equation computes $y[n] \approx 2y[n-1] - y[n-2]$, and the answer is the small leftover after a large cancellation. The delta form of the realization lesson exists for exactly this, and it is why very fast loops are written differently, not merely run faster.

**The rest.** Bus bandwidth, actuator command limits, converter settling time, power and heat. Rarely binding alone, but each deserves a question.

::: example One controller, four sample rates
A small vehicle's inner rate loop. The **moment of inertia** is $J = 0.02\,\mathrm{kg\,m^2}$, the plant from torque to body rate is $P(s) = 1/(Js)$, and the controller is a PI (proportional plus integral):

$$
C(s) = k_p + \frac{k_i}{s},
\qquad
k_p = 0.6462\ \mathrm{N\,m\,s/rad},
\qquad
k_i = 38.71\ \mathrm{N\,m/rad}.
$$

The gains were sized in continuous time for crossover at $f_c = 8\,\mathrm{Hz}$ with exactly $40.00^\circ$ of phase margin.

Now go digital. Discretize the plant with ZOH equivalence (which includes the hold), and the controller with Tustin prewarped at $\omega_c = 2\pi f_c$. Compute the discrete margins, first with the hold alone, then adding one frame of computational delay:

| $f_s$ | $f_s/f_c$ | PM, hold only | PM, plus one frame | Closed-loop pole radius |
| --- | --- | --- | --- | --- |
| $500\,\mathrm{Hz}$ | $62.5$ | $37.13^\circ$ | $31.37^\circ$ | $0.972$ |
| $200\,\mathrm{Hz}$ | $25.0$ | $32.84^\circ$ | $18.41^\circ$ | $0.952$ |
| $100\,\mathrm{Hz}$ | $12.5$ | $25.70^\circ$ | $-3.29^\circ$ | $1.018$ |
| $50\,\mathrm{Hz}$ | $6.25$ | $11.32^\circ$ | $-47.8^\circ$ | $1.357$ |

(The pole radius is for the loop with the frame of delay. Inside $1$ means stable.) The gains are the same in all four rows. The plant is the same. Only the timer period changed.

At $500\,\mathrm{Hz}$ — $62.5$ samples per crossover cycle — the implementation costs $40 - 31.37 = 8.6^\circ$ and the loop flies with $31^\circ$. A real design, if a slightly tight one.

At $200\,\mathrm{Hz}$ — $25\times$, inside the rule of thumb — the cost is $21.6^\circ$ and $18^\circ$ is left. Still stable, but with a closed-loop resonant peak near $10\,\mathrm{dB}$ and a step response that rings for several cycles. Nobody would sign that off. So "$20\times$ is the lower end" means: it works when the continuous design carried enough margin to pay for it, and this one did not.

At $100\,\mathrm{Hz}$ the loop is unstable, with poles at radius $1.018$. The divergence is slow: the oscillation grows $1.8\%$ per sample and doubles in $\ln 2/\ln 1.018 \approx 39$ frames, about $0.4\,\mathrm{s}$. It could pass a short bench test and then show up as a growing wobble the first time the loop stays closed for a second.

At $50\,\mathrm{Hz}$ the poles are at radius $1.357$: the wobble grows $36\%$ every frame, and $1.357^{50} \approx 4\times10^6$, a factor of four million in one second. That one announces itself.

Sanity check on the $50\,\mathrm{Hz}$ row: the frame of delay costs $360^\circ \times 8.2/50 \approx 59^\circ$ at the crossover near $8.2\,\mathrm{Hz}$, and $11.3 - 59 \approx -48^\circ$. It agrees.

The moral is narrower than "sample faster". The continuous design was never wrong. It was never a design for a digital loop. A controller meant for $100\,\mathrm{Hz}$ would have been tuned against the discrete model, crossed over lower, and flown. The failure is a continuous design handed across with no phase budget attached.
:::

::: example Setting the rate for three vehicles
Now use the rule the way you will in practice.

**Spacecraft attitude control with reaction wheels.** Closed-loop bandwidth is around $0.1\,\mathrm{Hz}$ — slow, because the wheels have limited authority and the vehicle is large. The rule gives $2$ to $4\,\mathrm{Hz}$. Real spacecraft attitude loops run at $5$ to $10\,\mathrm{Hz}$, because the binding constraints are elsewhere. The **[[star tracker|star-tracker]]** updates at $4$ to $10\,\mathrm{Hz}$ and sets the floor for knowing the attitude. The gyro and wheel speed sensors run faster. The same task usually also handles momentum management and safe-mode logic. Here the phase budget does not bind at all: the sensors set the rate, with a huge margin over what control needs.

**Launch vehicle thrust vector control.** Crossover is around $1\,\mathrm{Hz}$ for the rigid-body loop, so the rule gives $20$ to $40\,\mathrm{Hz}$. Real vehicles run at $50$ to $200\,\mathrm{Hz}$. The reason is the bending modes. Say the first mode is near $10\,\mathrm{Hz}$ and must be notched, and higher modes at $25$ and $40\,\mathrm{Hz}$ must be gain stabilized. The notch alone asks for $80$ to $100\,\mathrm{Hz}$. The higher modes must be sampled cleanly and rolled off well below Nyquist, and applying the same eight-to-ten factor to them gives $200$ to $400\,\mathrm{Hz}$. The anti-alias filter has to keep everything above Nyquist away from the sampler regardless. The structure outweighs the rigid body by an order of magnitude.

**Multirotor rate loop.** Crossover is around $10$ to $20\,\mathrm{Hz}$, because the vehicle is small, its inertia tiny, and the propellers respond in tens of milliseconds. The rule gives $200$ to $800\,\mathrm{Hz}$, and **[[real flight controllers|multirotor-rates]]** run the rate loop at $1$ to $8\,\mathrm{kHz}$. Here the phase budget truly binds — it is why these loops run so fast. The upper end is set by exactly the items above: the gyro's output rate, the noise the derivative pulls out of a vibrating frame, and the processor.

Three vehicles, three different binding constraints. The rule of thumb gave the right order of magnitude in all three and the final answer in none.
:::

::: warning
Raising the sample rate does not fix aliasing, even though it is the first thing people try. Doubling $f_s$ moves the Nyquist frequency up and changes *which* disturbances fold and *where they land*. Anything above the new Nyquist frequency still folds. The $60\,\mathrm{Hz}$ vibration of the first lesson folds to $40\,\mathrm{Hz}$ at $f_s = 100\,\mathrm{Hz}$ and to $10\,\mathrm{Hz}$ at $f_s = 50\,\mathrm{Hz}$. The faster rate is better here, but only because it happened to move the alias out of the control band.

The analog filter is what removes aliasing. A higher sample rate makes that filter cheaper, by putting the frequencies it must block further from the ones it must pass. That is a real benefit — but a different one from the one people usually claim.
:::

## Check yourself

::: check
A loop needs a closed-loop bandwidth of $4\,\mathrm{Hz}$ and must fly with at least $35^\circ$ of phase margin. The continuous design has $52^\circ$, and the software will have one frame of computational delay. What is the minimum sample rate, and what would you actually specify?
:::

::: answer
The phase you can afford to spend on going digital is $52^\circ - 35^\circ = 17^\circ$. Set the digital cost no larger than that, with $f_c \approx 4\,\mathrm{Hz}$:

$$
540^\circ \frac{f_c}{f_s} \le 17^\circ
\quad\Longrightarrow\quad
f_s \ge \frac{540 \times 4}{17} = 127\,\mathrm{Hz}.
$$

That is $31.8$ times the bandwidth, comfortably inside the rule of thumb — a good consistency check.

Specify more than that, for three reasons. The anti-alias filter has not been counted and will take several degrees of its own. The $17^\circ$ leaves nothing for the delay growing as the software grows. And nobody builds a $127\,\mathrm{Hz}$ loop. Specify $200\,\mathrm{Hz}$: the digital cost falls to $540 \times 4/200 = 10.8^\circ$, leaving about $6^\circ$ for the anti-alias filter and schedule growth, and $200\,\mathrm{Hz}$ divides cleanly into the rates the rest of the system will want.
:::

::: check
Your processor cannot support more than $100\,\mathrm{Hz}$, and the phase budget says you need $200\,\mathrm{Hz}$. Name three ways to close the gap without a faster processor, and the cost of each.
:::

::: answer
**Cut the computational delay.** At $100\,\mathrm{Hz}$ a full frame costs $360^\circ f_c/f_s$. Sending the command at a fixed point a fifth of a frame after the sensor read cuts that to $72^\circ f_c/f_s$, recovering four fifths of the biggest single item — usually more than doubling the rate would give, at no processor cost. Try this first, every time.

**Lower the crossover frequency.** The cost goes as $f_c/f_s$, so cutting the bandwidth by a third has the same effect as raising the rate by half. The price is performance: slower disturbance rejection and slower command following. Whether that is acceptable is a vehicle-level question, and it is an honest trade, not a dodge.

**Add lead at crossover.** A **[[lead network|lead-network]]** giving $15^\circ$ at $f_c$ replaces phase the implementation took. The price is gain at high frequency — about $1.3\times$ above crossover for $15^\circ$ of lead — which amplifies sensor noise and any structural content the anti-alias filter let through. On a vehicle with a lightly damped mode above crossover, this can be the costliest of the three.

A fourth option: run only the cheap *inner* loop fast and the outer loop slower — the multi-rate setup of this module's last lesson.
:::

::: check
Explain, with a concrete case, why the Nyquist criterion is the wrong tool for choosing a control sample rate.
:::

::: answer
Nyquist answers "can I rebuild this signal from its samples?", and the answer is yes for any $f_s > 2f_{\max}$. A control loop asks a different question: "how much phase does sampling cost at crossover?" That answer is $540^\circ f_c/f_s$ for a hold plus one frame, and it stays large long after Nyquist is satisfied.

Concretely: a loop crossing over at $4\,\mathrm{Hz}$, sampled at $10\,\mathrm{Hz}$, satisfies Nyquist with room to spare. The digital cost is $540 \times 4/10 = 216^\circ$. No continuous design has $216^\circ$ of phase margin, so the loop is unstable — inside the sampling theorem and completely unflyable.

The deeper reason: Nyquist is about an open-loop signal-processing job, where only information content matters. A control loop feeds the rebuilt signal back into the thing that made it. In a feedback path, *when* the information arrives matters as much as whether it arrives.
:::

::: check
A $2\,\mathrm{kHz}$ multirotor rate loop takes its derivative as a raw backward difference of a $16$-bit gyro spanning $\pm 2000^\circ/\mathrm{s}$. Estimate the noise the derivative puts on the motor commands, and say what to do about it.
:::

::: answer
The range is $4000^\circ/\mathrm{s}$ in $65{,}536$ steps, so $q = 4000/65536 = 0.06104\,{}^\circ/\mathrm{s}$, and the rounding error has standard deviation $q/\sqrt{12} = 0.01762\,{}^\circ/\mathrm{s}$. A backward difference multiplies by $\sqrt2$ and divides by $T = 0.5\,\mathrm{ms}$:

$$
\sigma_d = \frac{1.4142 \times 0.01762}{0.0005} = 49.8\ {}^\circ/\mathrm{s^2}.
$$

About fifty degrees per second squared of pure noise on the derivative signal, multiplied by $k_d$ and sent to the motors. And that is before any real vibration — it is only the converter's own rounding.

What to do: filter the derivative instead of differencing raw. A first-order filter at, say, $80\,\mathrm{Hz}$ cuts the noise band from the $1\,\mathrm{kHz}$ Nyquist frequency to about $80\,\mathrm{Hz}$. For white noise the standard deviation scales as the square root of bandwidth, so the noise drops by about $\sqrt{1000/80} \approx 3.5$. It costs a few degrees of phase at the $15\,\mathrm{Hz}$ crossover. Sampling slower is not an option, because the phase budget is what put the loop at $2\,\mathrm{kHz}$. This is the squeeze every fast loop lives in: phase pushes the rate up, noise pushes back, and the filtered derivative buys room between them.
:::

## Summary

| Item | Statement |
| --- | --- |
| Rule of thumb | $f_s = 20$ to $40$ times the closed-loop bandwidth |
| Digital phase cost | $540^\circ f_c/f_s$ for a zero-order hold plus one frame of computational delay |
| At $20\times$ | $27^\circ$ — the most a design can give away |
| At $40\times$ | $13.5^\circ$ — comfortable; beyond this the returns shrink fast |
| Modes to notch | $f_s \ge 8$ to $10$ times the highest mode you must actively shape |
| Upper end: CPU | Worst-case execution time, shared with the rest of the GNC software |
| Upper end: sensors | Sampling faster than the sensor updates adds delay and no information |
| Upper end: noise | A backward difference scales measurement noise by $1/T$ |
| Upper end: conditioning | Poles crowd toward $z = 1$; $a_1 \to -2$, $a_2 \to 1$, and coefficient precision is used up |
| Bandwidth versus crossover | $f_{\text{BW}} \approx 1.0$ to $1.6\,f_c$; the rule does not care much which you use |
| What the rule is not | Nyquist. $f_s > 2f_{\max}$ is satisfied long before the loop is flyable |

The next lesson takes up the arithmetic behind the last two upper-end drivers: what a quantizer does to a signal, how finite word length moves the poles you placed, and how a controller is written for a processor with no floating-point unit.

::: context phase-margin-refresher Phase margin in one breath
Go once around a feedback loop at the crossover frequency, where the signal comes back the same size it left. If it also comes back exactly $180^\circ$ out of step, the loop feeds itself and oscillates forever. **Phase margin** is how far you are from that: $180^\circ$ plus the loop's phase at crossover.

Designers usually aim for $30^\circ$ to $60^\circ$. Less than about $30^\circ$ and the response rings and overshoots badly. Every source of lateness — a filter, a hold, a slow computer — spends some of this margin.
:::

::: context zoh-half-sample Why a hold looks half a sample late
The smooth curve is what the controller wanted to send. The blue staircase is what a zero-order hold actually sends: each value held flat for one period $T$. The dashed curve is the smooth one shifted right by $T/2$ — and it runs straight through the middle of every step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="20.0,85.0 25.0,72.5 30.0,60.3 35.0,48.9 40.0,38.4 45.0,29.3 50.0,21.7 55.0,15.9 60.0,12.0 65.0,10.1 70.0,10.4 75.0,12.8 80.0,17.1 85.0,23.4 90.0,31.4 95.0,40.9 100.0,51.7 105.0,63.3 110.0,75.6 115.0,88.1 120.0,100.6 125.0,112.6 130.0,123.9 135.0,134.0 140.0,142.8 145.0,150.0 150.0,155.3 155.0,158.7 160.0,160.0 165.0,159.2 170.0,156.3 175.0,151.5 180.0,144.7 185.0,136.3 190.0,126.5 195.0,115.5 200.0,103.7 205.0,91.3 210.0,78.7 215.0,66.3 220.0,54.5 225.0,43.5 230.0,33.7 235.0,25.3 240.0,18.5 245.0,13.7 250.0,10.8 255.0,10.0 260.0,11.3 265.0,14.7 270.0,20.0 275.0,27.2 280.0,36.0 285.0,46.1 290.0,57.4 295.0,69.4 300.0,81.9 305.0,94.4" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M20,85 H50 V21.7 H80 V17.1 H110 V75.6 H140 V142.8 H170 V156.3 H200 V103.7 H230 V33.7 H260 V11.3 H290 V57.4 H305" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="35.0,85.0 40.0,72.5 45.0,60.3 50.0,48.9 55.0,38.4 60.0,29.3 65.0,21.7 70.0,15.9 75.0,12.0 80.0,10.1 85.0,10.4 90.0,12.8 95.0,17.1 100.0,23.4 105.0,31.4 110.0,40.9 115.0,51.7 120.0,63.3 125.0,75.6 130.0,88.1 135.0,100.6 140.0,112.6 145.0,123.9 150.0,134.0 155.0,142.8 160.0,150.0 165.0,155.3 170.0,158.7 175.0,160.0 180.0,159.2 185.0,156.3 190.0,151.5 195.0,144.7 200.0,136.3 205.0,126.5 210.0,115.5 215.0,103.7 220.0,91.3 225.0,78.7 230.0,66.3 235.0,54.5 240.0,43.5 245.0,33.7 250.0,25.3 255.0,18.5 260.0,13.7 265.0,10.8 270.0,10.0 275.0,11.3 280.0,14.7 285.0,20.0 290.0,27.2 295.0,36.0 300.0,46.1 305.0,57.4 310.0,69.4 315.0,81.9 320.0,94.4" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="200" y1="170" x2="230" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="200" y1="166" x2="200" y2="174" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="230" y1="166" x2="230" y2="174" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="240" y="174" font-size="11" fill="#1f2a44">one period T</text>
  <line x1="20" y1="190" x2="36" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="194" font-size="11" fill="#1f2a44">wanted</text>
  <line x1="100" y1="190" x2="116" y2="190" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="120" y="194" font-size="11" fill="#1d6fd1">held output</text>
  <line x1="205" y1="190" x2="221" y2="190" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="225" y="194" font-size="11" fill="#b4232c">wanted, late by T/2</text>
</svg>
```

A delay of $T/2$ at frequency $f$ costs $360^\circ f \cdot T/2 = 180^\circ f/f_s$ — the half-sample penalty.
:::

::: context phase-cost-curve The rule of thumb, drawn
The curve is the digital phase cost $540^\circ f_c/f_s$ for a hold plus one frame of delay, against $f_s/f_c$. The shaded band is $20\times$ to $40\times$. Left of it the cost climbs steeply; right of it the curve is almost flat, so extra speed buys very little.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <rect x="118" y="20" width="68" height="150" fill="#8fb8f0" opacity="0.45"/>
  <line x1="50" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline points="80.6,20.0 84.0,35.0 87.4,47.3 90.8,57.5 97.6,73.6 104.4,85.6 111.2,95.0 118.0,102.5 131.6,113.8 145.2,121.8 158.8,127.8 172.4,132.5 186.0,136.2 220.0,143.0 254.0,147.5 288.0,150.7 339.0,154.1" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="118" cy="102.5" r="3.5" fill="#1f2a44"/>
  <circle cx="186" cy="136.2" r="3.5" fill="#1f2a44"/>
  <text x="124" y="97" font-size="11" fill="#1f2a44">27° at 20×</text>
  <text x="192" y="130" font-size="11" fill="#1f2a44">13.5° at 40×</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="184">0</text><text x="118" y="184">20</text><text x="186" y="184">40</text><text x="254" y="184">60</text><text x="339" y="184">85</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0°</text><text x="45" y="124">20°</text><text x="45" y="74">40°</text><text x="45" y="24">60°</text>
  </g>
  <text x="200" y="200" font-size="11" fill="#6c7a93" text-anchor="middle">samples per crossover cycle, fs / fc</text>
</svg>
```

At $f_s/f_c = 60$ the cost is $9^\circ$; at $85$ it is about $6.4^\circ$ — only seven degrees better than at $40\times$ for more than twice the processor load.
:::

::: context bending-modes A rocket wobbles like a ruler
Hold a ruler over the edge of a desk and twang it: it vibrates at one natural frequency. A long, thin rocket does the same thing in flight, bending side to side at a few natural frequencies called its **bending modes**. For a large launch vehicle the first one is often only a few hertz.

A gyro mounted on the rocket feels both the whole vehicle turning and the local bending at its mounting point. The controller cannot tell them apart unless it is designed to, which is why the modes set requirements on the filters and the sample rate.
:::

::: context wcet Worst-case execution time
**Worst-case execution time** (WCET) is the longest a piece of code could ever take to run on the target processor — through the slowest branch, with the least helpful memory caching, in the busiest mode.

Flight software is scheduled by it, not by the average, because a control frame that runs late even once can put a late command on an actuator. Engineers measure it on real hardware and also bound it by analysis, then keep a healthy margin — commonly a large fraction of the frame held back as spare.
:::

::: context quantization-step Counts, not numbers
A digital gyro does not send "$12.34^\circ/\mathrm{s}$". It sends an integer — a count — and the software multiplies by a scale factor. A $16$-bit sensor has $2^{16} = 65{,}536$ possible counts, spread across its whole range.

So the finest change it can report is the range divided by $65{,}536$. For a $\pm 300^\circ/\mathrm{s}$ gyro that is about $0.009^\circ/\mathrm{s}$. Choosing a narrower range gives finer steps but risks the sensor saturating during a violent maneuver.
:::

::: context poles-crowd Poles marching to z = 1
A close-up of the $z$-plane near $z = 1$ (the dashed line is part of the unit circle). The same $1\,\mathrm{Hz}$, $\zeta = 0.7$ pole pair is plotted at three sample rates. As $f_s$ rises, $e^{sT}$ slides toward $z = 1$, and everything that tells the poles apart shrinks into tiny differences.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <path d="M316.5,16 A1000,1000 0 0,1 316.5,184" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="220" y1="96" x2="220" y2="104" stroke="#6c7a93"/><line x1="270" y1="96" x2="270" y2="104" stroke="#6c7a93"/>
  <text x="220" y="116" font-size="11" fill="#6c7a93" text-anchor="middle">0.90</text>
  <text x="270" y="116" font-size="11" fill="#6c7a93" text-anchor="middle">0.95</text>
  <text x="326" y="116" font-size="11" fill="#1f2a44">1</text>
  <circle cx="232.1" cy="17.9" r="5" fill="#b4232c"/><circle cx="232.1" cy="182.1" r="5" fill="#b4232c"/>
  <circle cx="298.0" cy="78.1" r="5" fill="#1d6fd1"/><circle cx="298.0" cy="121.9" r="5" fill="#1d6fd1"/>
  <circle cx="315.6" cy="95.5" r="4" fill="#f2b880" stroke="#1f2a44"/><circle cx="315.6" cy="104.5" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="222" y="22" font-size="11" fill="#b4232c" text-anchor="end">50 Hz: 0.912 ± 0.082j</text>
  <text x="288" y="74" font-size="11" fill="#1d6fd1" text-anchor="end">200 Hz: 0.978 ± 0.022j</text>
  <text x="300" y="150" font-size="11" fill="#1f2a44" text-anchor="end">1 kHz (orange): 0.9956 ± 0.0045j</text>
  <text x="24" y="92" font-size="11" fill="#6c7a93">real axis</text>
</svg>
```

Horizontal and vertical scales are equal: $1000$ pixels per unit of $z$.
:::

::: context star-tracker A camera that reads the stars
A **star tracker** is a small camera that photographs the sky, matches the pattern of stars against an onboard catalog, and works out which way the spacecraft is pointing — often to a few arcseconds.

Taking a picture and solving the pattern takes time, so updates arrive only a few to about ten times a second. Gyros fill in between: they report turning rate much faster, and the software blends the two.
:::

::: context multirotor-rates Why drones run so fast
Small drones have very little inertia, so they can change rotation rate within a few hundredths of a second, and their crossover is high. Open-source hobby flight-controller firmware commonly runs the gyro-based rate loop at several kilohertz, reading a MEMS gyro that can output samples that fast.

The price is exactly the upper-end list of this lesson: gyro noise from motor and propeller vibration, which is why these controllers carry several filters on the gyro and the derivative path.
:::

::: context lead-network Buying phase back
A **lead network** is a small filter, $C(s) = (1 + s/\omega_z)/(1 + s/\omega_p)$ with $\omega_z < \omega_p$, that pushes the phase *forward* over a band of frequencies — the opposite of a delay.

Its maximum lead $\phi$ happens when the two corners are in the ratio $\alpha = \omega_z/\omega_p = (1 - \sin\phi)/(1 + \sin\phi)$. For $15^\circ$ that is $\alpha = 0.589$. The catch: the gain at high frequency is $1/\sqrt{\alpha} \approx 1.30$ times the gain at the center of the lead — more noise passed through.
:::
