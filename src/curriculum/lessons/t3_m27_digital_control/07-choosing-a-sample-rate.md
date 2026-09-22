---
id: l07-choosing-a-sample-rate
title: Choosing a sample rate
minutes: 20
covers:
  - 'Choosing a sample rate: the 20-40x bandwidth rule of thumb and what drives the ends of that range'
---

Somebody has to write a number in the software requirements document, and it will be a round one: $50\,\mathrm{Hz}$, $200\,\mathrm{Hz}$, $400\,\mathrm{Hz}$. Once it is there, the processor is sized around it, the bus schedule is built around it, the sensors are configured to it, and changing it eighteen months later means requalifying the flight computer. The sample rate is one of the earliest decisions and one of the hardest to reverse.

The rule of thumb is $20$ to $40$ times the closed-loop bandwidth. Both ends of that range have reasons, and the reasons are different in kind: the lower end is set by phase, which is a control problem, and the upper end by processor budget, sensor rate, noise amplification and numerical conditioning, which are implementation problems. Knowing which constraint is binding on your vehicle is more useful than knowing the range.

This lesson derives the lower bound from the phase budget of the previous three lessons, examines each of the four upper-bound drivers with numbers, and ends where it should: with a loop that is stable at $500\,\mathrm{Hz}$, marginal at $200\,\mathrm{Hz}$ and divergent at $50\,\mathrm{Hz}$, with identical gains throughout.

## The lower bound is a phase budget

Gather the three unavoidable contributions at crossover $f_c$.

The zero-order hold costs $180^\circ f_c/f_s$ — half a sample. A computational delay of one frame costs $360^\circ f_c/f_s$ — a full sample. Together, three half-samples:

$$
\Delta\phi_{\text{digital}} = 540^\circ\,\frac{f_c}{f_s} .
$$

The anti-alias filter is a fourth contribution, but its size depends on what you are filtering out rather than on $f_s$ alone, so keep it separate and add it afterwards. Tabulating the digital part:

| $f_s/f_c$ | Hold alone | Hold plus one frame |
| --- | --- | --- |
| $10$ | $18.0^\circ$ | $54.0^\circ$ |
| $20$ | $9.0^\circ$ | $27.0^\circ$ |
| $30$ | $6.0^\circ$ | $18.0^\circ$ |
| $40$ | $4.5^\circ$ | $13.5^\circ$ |
| $60$ | $3.0^\circ$ | $9.0^\circ$ |
| $100$ | $1.8^\circ$ | $5.4^\circ$ |

There is the rule of thumb, in one column. At $20\times$ the digital implementation takes $27^\circ$, which is the most a design can give away and still be recognisable: a continuous design with $55^\circ$ flies with $28^\circ$, and $28^\circ$ is the bottom of what anyone accepts. At $40\times$ it takes $13.5^\circ$, and a $55^\circ$ design flies with $41^\circ$, which is comfortable. Below $20\times$ the loss exceeds what any reasonable continuous margin can cover; above $40\times$ the returns are visibly diminishing — going from $40$ to $100$ recovers only another $8^\circ$.

A word on what "bandwidth" means here, because the factor of two hiding in it is the most common source of confusion. Crossover frequency $f_c$ is where the open-loop gain passes unity; closed-loop bandwidth $f_{\text{BW}}$ is where the closed-loop response falls to $-3\,\mathrm{dB}$. For a well-damped loop the second is about $1.0$ to $1.6$ times the first, so the rule is the same rule either way to within its own precision. Use crossover, since that is where the margin is read.

::: key
**Choosing a sample rate.** Nyquist requires only $f_s > 2f_{\max}$, which is far too loose for closed-loop control: use $20$ to $40$ times the closed-loop bandwidth. The lower end is set by the phase the zero-order hold and the computational delay eat at crossover — $540^\circ f_c/f_s$ for a hold plus one frame. The upper end is set by CPU budget, sensor update rate, quantization noise amplification by derivative terms, and numerical conditioning of the difference equations.
:::

## A second lower-bound driver: modes you have to shape

Phase at crossover is not the only thing pushing the rate up. If the loop has to do something deliberate about a structural mode, the sample rate has to be high enough to do it.

A mode you intend to **notch** must be well below Nyquist, because a notch is a feature of the discrete filter's response and there is no response above $f_s/2$ to shape. Worse, the Tustin warping of the discretization lesson compresses the band near Nyquist, so a notch placed above about a quarter of the sample rate comes out asymmetric even when prewarped. A working rule is $f_s \ge 8$ to $10$ times the highest modal frequency you must actively notch.

A mode you intend to **phase stabilise** — keeping its gain and arranging the phase so the Nyquist encirclements are unchanged, as the classical control module set out — needs more, because phase stabilisation requires an accurate model of the phase at that frequency, and the hold and computational delay contribute $540^\circ f_m/f_s$ there too. At $f_s = 10 f_m$ that is $54^\circ$ of implementation lag sitting on top of the modal phase you were trying to control.

And a mode you intend to **gain stabilise** — attenuating it below unity so its phase does not matter — needs the mode to be properly sampled in the first place, or the attenuation happens at the wrong frequency. The first lesson's $47\,\mathrm{Hz}$ mode folding to $3\,\mathrm{Hz}$ in a $50\,\mathrm{Hz}$ loop is precisely a gain-stabilisation plan defeated by the sampler.

## What stops you going faster

**Processor budget.** The control law is one task among many: navigation, guidance, fault detection, telemetry, redundancy management, bus servicing. Doubling the rate doubles the control task's share and halves the slack every other task has. Flight software is sized by worst-case execution time, not average, so the headroom has to survive the worst frame in the worst mode. A common outcome is that the rate is set by what fits with margin after everything else is accounted for, then checked against the phase budget rather than the other way round.

**Sensor update rate.** You cannot sample information that does not exist. Reading a $100\,\mathrm{Hz}$ gyro at $400\,\mathrm{Hz}$ returns each value four times, which is a zero-order hold in the *measurement* path: no new information, and an additional average lag of half the sensor's period on top of everything else. The useful rate is the sensor's rate, or a submultiple of it, and this is what sets the loop rate on a great many vehicles.

**Quantization noise through derivative terms.** A backward difference divides by $T$, so it multiplies any measurement noise by $1/T$: halving $T$ doubles the noise at the derivative output. Take a $16$-bit rate gyro spanning $\pm 300^\circ/\mathrm{s}$, so the quantization step is $q = 600/65536 = 9.155\times10^{-3}\,{}^\circ/\mathrm{s}$ and the quantization error has standard deviation $q/\sqrt{12} = 2.643\times10^{-3}\,{}^\circ/\mathrm{s}$. The backward difference of two independent errors has standard deviation $\sqrt2$ times that, divided by $T$:

| $f_s$ | Noise at the derivative output |
| --- | --- |
| $50\,\mathrm{Hz}$ | $0.187\,{}^\circ/\mathrm{s^2}$ |
| $200\,\mathrm{Hz}$ | $0.748\,{}^\circ/\mathrm{s^2}$ |
| $500\,\mathrm{Hz}$ | $1.869\,{}^\circ/\mathrm{s^2}$ |
| $5\,\mathrm{kHz}$ | $18.69\,{}^\circ/\mathrm{s^2}$ |

A hundredfold increase in rate gives a hundredfold increase in derivative-path noise, all of it going straight to the actuator. The remedy is a filtered derivative rather than a raw difference, which is why the classical control module insisted on one, and the next lesson works the arithmetic of quantization properly.

**Numerical conditioning.** As $T$ shrinks, $z = e^{sT} \to 1$ and every pole crowds against $z = 1$. In a second-order section $z^2 + a_1 z + a_2$ with $a_1 = -2r\cos\theta$ and $a_2 = r^2$, this means $a_1 \to -2$ and $a_2 \to +1$, and the interesting part of each coefficient retreats into the low-order digits:

| $f_s$ | $a_1$ | $a_2$ | Error in $\sigma$ from one $2^{-15}$ step in $a_2$ |
| --- | --- | --- | --- |
| $50\,\mathrm{Hz}$ | $-1.824216$ | $0.838677$ | $0.021\%$ |
| $1\,\mathrm{kHz}$ | $-1.991203$ | $0.991242$ | $0.350\%$ |
| $10\,\mathrm{kHz}$ | $-1.999120$ | $0.999121$ | $3.47\%$ |
| $100\,\mathrm{kHz}$ | $-1.999912$ | $0.999912$ | $34.7\%$ |

(The pole is the same $1\,\mathrm{Hz}$, $\zeta = 0.7$ pair throughout; $\sigma = \zeta\omega_n = 4.398\,\mathrm{s^{-1}}$.) At $100\,\mathrm{kHz}$ a single step of a $16$-bit coefficient moves the decay rate by a third. The difference equation also loses precision at run time, because $y[n] \approx 2y[n-1] - y[n-2]$ to leading order and the answer is the small residue left after a large cancellation. The delta form of the realization lesson exists for exactly this, and it is why very fast loops are written differently rather than merely run faster.

**The rest.** Bus bandwidth, actuator command-rate limits, converter settling time, power and heat. None of these is usually binding on its own, and all of them are worth a question before the number goes in the requirement.

::: example One controller, four sample rates
A small vehicle's inner rate loop: moment of inertia $J = 0.02\,\mathrm{kg\,m^2}$, plant $P(s) = 1/(Js)$ from torque to body rate, and a PI rate controller

$$
C(s) = k_p + \frac{k_i}{s},
\qquad
k_p = 0.6462\ \mathrm{N\,m\,s/rad},
\qquad
k_i = 38.71\ \mathrm{N\,m/rad},
$$

sized for crossover at $f_c = 8\,\mathrm{Hz}$ with exactly $40.00^\circ$ of phase margin in continuous time.

Discretize the plant with ZOH equivalence and the controller with Tustin prewarped at $\omega_c$, then compute the discrete margins — first with the hold alone, then with one frame of computational delay.

| $f_s$ | $f_s/f_c$ | PM, hold only | PM, plus one frame | Closed-loop pole radius |
| --- | --- | --- | --- | --- |
| $500\,\mathrm{Hz}$ | $62.5$ | $37.13^\circ$ | $31.37^\circ$ | $0.972$ |
| $200\,\mathrm{Hz}$ | $25.0$ | $32.84^\circ$ | $18.41^\circ$ | $0.952$ |
| $100\,\mathrm{Hz}$ | $12.5$ | $25.70^\circ$ | $-3.29^\circ$ | $1.018$ |
| $50\,\mathrm{Hz}$ | $6.25$ | $11.32^\circ$ | $-46.4^\circ$ | $1.357$ |

The gains are identical in all four rows. The plant is identical. The only difference is the timer period.

At $500\,\mathrm{Hz}$, $62.5$ samples per cycle of crossover, the implementation costs $8.6^\circ$ and the loop flies with $31^\circ$ — a real design, if a slightly tight one. At $200\,\mathrm{Hz}$, $25\times$ and inside the rule of thumb, the cost is $21.6^\circ$ and what is left is $18^\circ$: still stable, with a closed-loop resonant peak near $10\,\mathrm{dB}$ and a step response that rings for several cycles. Nobody would sign that off, which is the honest reading of "$20\times$ is the lower end" — $20\times$ works when the continuous design carried enough margin to pay for it, and this one did not.

At $100\,\mathrm{Hz}$ the loop is unstable, with closed-loop poles at radius $1.018$. That divergence is slow: an oscillation growing by $1.8\%$ per sample, which doubles in $39$ frames, about four tenths of a second. It will pass a short bench test and then appear as a growing oscillation the first time the loop is left closed for a second.

At $50\,\mathrm{Hz}$, poles at radius $1.357$: the amplitude grows by $36\%$ every frame, a factor of four million in one second. That one announces itself.

The moral is narrower than "sample faster". The continuous design was never wrong; it was never a design for a digital loop. A controller intended for a $100\,\mathrm{Hz}$ loop would have been tuned against the discrete model, would have crossed over lower, and would have flown. The failure here is not the sample rate in isolation, it is a continuous design handed across an interface with no phase budget attached.
:::

::: example Setting the rate for three vehicles
Apply the rule in the direction you will actually use it.

**Spacecraft attitude control, reaction wheels.** Closed-loop bandwidth around $0.1\,\mathrm{Hz}$ — slow, because the wheels are the authority and the vehicle is large. The rule gives $2$ to $4\,\mathrm{Hz}$, which nobody flies: real spacecraft attitude loops run at $5$ to $10\,\mathrm{Hz}$, and the binding constraints are elsewhere. The star tracker updates at $4$ to $10\,\mathrm{Hz}$ and sets the floor for attitude determination; the gyro and the wheel tachometers run faster; and the same task typically services momentum management and the safe-mode logic. Here the phase budget is not binding at all, and the honest statement is that the rate is set by the sensor suite with a very large margin over the control requirement.

**Launch vehicle thrust vector control.** Crossover around $1\,\mathrm{Hz}$ for the rigid-body loop. The rule gives $20$ to $40\,\mathrm{Hz}$ — and real vehicles run at $50$ to $200\,\mathrm{Hz}$. The reason is not the rigid-body loop: it is the bending modes. With a first mode near $10\,\mathrm{Hz}$ that must be notched and higher modes at $25$ and $40\,\mathrm{Hz}$ that must be gain stabilised, the "eight to ten times the highest mode you must shape" rule gives $200$ to $400\,\mathrm{Hz}$, and the anti-alias filter has to keep everything above Nyquist away from the sampler regardless. The structural requirement dominates the rigid-body requirement by an order of magnitude.

**Multirotor rate loop.** Crossover around $10$ to $20\,\mathrm{Hz}$, because the vehicle is small, the inertia is tiny and the propellers respond in tens of milliseconds. The rule gives $200$ to $800\,\mathrm{Hz}$, and real flight controllers run the rate loop at $1$ to $8\,\mathrm{kHz}$. Here the phase budget genuinely is binding — it is the reason these loops run so fast — and the upper end is set by exactly the items listed above: the gyro's output data rate, the noise the derivative term pulls out of a vibrating airframe, and the processor.

Three vehicles, three different binding constraints, one rule of thumb that gave the right order of magnitude in all three and the final answer in none.
:::

::: warning
Raising the sample rate does not fix an aliasing problem, and this is worth saying because it is the instinctive response. Doubling $f_s$ moves the Nyquist frequency up and changes *which* disturbances fold and *where they land*, but any content above the new Nyquist frequency still folds. The $60\,\mathrm{Hz}$ vibration of the first lesson folds to $40\,\mathrm{Hz}$ at $f_s = 100\,\mathrm{Hz}$ and to $10\,\mathrm{Hz}$ at $f_s = 50\,\mathrm{Hz}$ — the faster rate is better here, but only because it happened to move the alias out of the control band, not because sampling faster removes aliasing.

The analog filter is what removes aliasing. A higher sample rate makes that filter cheaper, by moving the frequencies it has to attenuate further from the ones it has to pass. That is a real and substantial benefit, and it is a different benefit from the one people usually claim.
:::

## Check yourself

::: check
A loop is required to have a closed-loop bandwidth of $4\,\mathrm{Hz}$ and to fly with at least $35^\circ$ of phase margin. The continuous design achieves $52^\circ$, and the software will have one frame of computational delay. What is the minimum sample rate, and what would you actually specify?
:::

::: answer
The budget available for digital implementation is $52 - 35 = 17^\circ$. Setting $540^\circ f_c/f_s \le 17^\circ$ with $f_c \approx 4\,\mathrm{Hz}$ gives

$$
f_s \ge \frac{540 \times 4}{17} = 127\,\mathrm{Hz}.
$$

That is $31.8$ times the bandwidth, comfortably inside the rule of thumb, which is the consistency check.

What to specify is more than that, for three reasons. The anti-alias filter has not been accounted for and will take several degrees of its own. The $17^\circ$ has no allowance for the delay growing during integration. And $127$ is not a rate anyone builds. Specify $200\,\mathrm{Hz}$: the digital cost falls to $10.8^\circ$, leaving $6^\circ$ for the anti-alias filter and a couple of frames of schedule growth, and $200\,\mathrm{Hz}$ divides cleanly into the rates the rest of the system will want.
:::

::: check
Your processor budget will not support more than $100\,\mathrm{Hz}$, and the phase budget says you need $200\,\mathrm{Hz}$. List three ways to close the gap without a faster processor, and the cost of each.
:::

::: answer
**Cut the computational delay.** At $100\,\mathrm{Hz}$ a full frame costs $360^\circ f_c/f_s$. Moving to a fixed actuation offset of a fifth of a frame cuts that to $72^\circ f_c/f_s$, recovering four fifths of the largest single item — typically more than doubling the rate would give, at no CPU cost. This is the first thing to try, every time.

**Lower the crossover frequency.** The phase cost is proportional to $f_c/f_s$, so reducing the bandwidth by a third has the same effect as increasing the rate by half. The cost is performance: slower disturbance rejection, slower command tracking. Whether that is acceptable is a vehicle-level question, and it is the honest trade rather than an evasion.

**Add lead at crossover.** A lead network contributing $15^\circ$ at $f_c$ replaces phase the implementation took. The cost is high-frequency gain — a lead of $15^\circ$ raises the loop gain above crossover by about $1.3\times$ — which amplifies sensor noise and any structural content the anti-alias filter left behind. On a vehicle with a lightly damped mode above crossover this can be the most expensive option of the three.

A fourth possibility worth checking: run only the *inner* loop at the high rate and the outer loop slower, which is the multi-rate arrangement of the last lesson in this module. The inner loop is usually the cheap one, and the outer loop rarely needs the rate.
:::

::: check
Explain why the Nyquist criterion is the wrong tool for choosing a control sample rate, using a concrete case.
:::

::: answer
Nyquist answers "can I reconstruct this signal from its samples", and the answer is yes for any $f_s > 2f_{\max}$. Closed-loop control asks a different question: "how much phase does the sampling process take at crossover", and the answer to that is $540^\circ f_c/f_s$ for a hold and one frame of computation, which is large long after Nyquist is satisfied.

Concretely, a loop crossing over at $4\,\mathrm{Hz}$ sampled at $10\,\mathrm{Hz}$ satisfies Nyquist with room to spare. The digital implementation then costs $540 \times 4/10 = 216^\circ$. No continuous design has $216^\circ$ of phase margin, so the loop is unstable — comfortably inside the sampling theorem and entirely unflyable.

The deeper reason is that Nyquist concerns an open-loop signal-processing operation, where the only question is information content, while a control loop feeds the reconstructed signal back into the process that generated it. In a feedback path, *when* the information arrives matters as much as whether it arrived.
:::

::: check
A $2\,\mathrm{kHz}$ multirotor rate loop implements its derivative term as a raw backward difference on a $16$-bit gyro spanning $\pm 2000^\circ/\mathrm{s}$. Estimate the noise the derivative term puts on the motor command path, and say what to do about it.
:::

::: answer
The quantization step is $q = 4000/65536 = 0.06104\,{}^\circ/\mathrm{s}$, with error standard deviation $q/\sqrt{12} = 0.01762\,{}^\circ/\mathrm{s}$. A backward difference gives $\sqrt2 \times 0.01762/T$ with $T = 0.5\,\mathrm{ms}$:

$$
\sigma_d = \frac{1.4142 \times 0.01762}{0.0005} = 49.8\ {}^\circ/\mathrm{s^2}.
$$

Fifty degrees per second squared of pure noise on the rate-derivative signal, multiplied by whatever $k_d$ is and sent to the motors. That is before any real vibration is considered — this is only the converter's own rounding.

What to do: filter the derivative rather than differencing raw. A first-order filter at, say, $80\,\mathrm{Hz}$ on the derivative path reduces the noise roughly in proportion to the square root of the bandwidth ratio, here from the $1\,\mathrm{kHz}$ Nyquist band down to $80\,\mathrm{Hz}$, a factor of about $3.5$ in standard deviation, and costs a few degrees of phase at the $15\,\mathrm{Hz}$ crossover. The alternative — sampling slower — is not available, because the phase budget is what put the loop at $2\,\mathrm{kHz}$ in the first place. This is the characteristic squeeze of a fast loop: the rate is set from below by phase and from above by noise, and the filtered derivative is what buys room between them.
:::

## Summary

| Item | Statement |
| --- | --- |
| Rule of thumb | $f_s = 20$ to $40$ times the closed-loop bandwidth |
| Digital phase cost | $540^\circ f_c/f_s$ for a zero-order hold plus one frame of computational delay |
| At $20\times$ | $27^\circ$ — the most a design can give away |
| At $40\times$ | $13.5^\circ$ — comfortable; beyond this the returns diminish fast |
| Modes to notch | $f_s \ge 8$ to $10$ times the highest mode you must actively shape |
| Upper end: CPU | Worst-case execution time, shared with the rest of the GNC stack |
| Upper end: sensors | Sampling faster than the sensor updates adds delay and no information |
| Upper end: noise | A backward difference scales measurement noise by $1/T$ |
| Upper end: conditioning | Poles crowd towards $z = 1$; $a_1 \to -2$, $a_2 \to 1$, and coefficient precision is consumed |
| Bandwidth versus crossover | $f_{\text{BW}} \approx 1.0$ to $1.6\,f_c$; the rule is insensitive to which you use |
| What the rule is not | Nyquist. $f_s > 2f_{\max}$ is satisfied long before the loop is flyable |

The next lesson takes up the arithmetic the last two upper-end drivers depend on: what a quantizer does to a signal, how finite word length moves the poles you carefully placed, and how a controller is written when the processor has no floating-point unit.
