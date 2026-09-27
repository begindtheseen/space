---
id: l03-rate-architecture
title: Rate architecture for the integrated stack
minutes: 18
covers:
  - 'Rate architecture: navigation at IMU rate, control at 100 Hz or faster, guidance re-solved at 1 to 2 Hz, mode management at a low rate'
---

Think about riding a bike across town. Your eyes and inner ear check your balance many times a second. Your hands make small steering corrections several times a second. You check the route — "left at the next light" — only now and then. And you decide whether to keep riding or stop for lunch rarely. Four jobs, four very different speeds. Nobody plans the route a hundred times a second. Nobody checks their balance once a minute.

A landing GNC stack is the same. The simulation module built a two-rate setup: a fine, accurate plant step, and one flight-software rate held steady by a **zero-order hold** — a value kept fixed until the next update. A landing stack has not one flight-software rate but four, one for each module lesson 1 named. They differ by about two **orders of magnitude** — a factor of about a hundred — between the fastest and the slowest.

This lesson fixes those four rates for the reference vehicle. It shows that the simulation module's rule — a slower period must be an exact whole-number multiple of a faster one — extends cleanly to all four nested together. Then it does one check that rule never had to make: whether the vehicle's own physical properties change slowly enough, compared with each chosen rate, for every later lesson's analysis to mean what it claims.

## Four rates, one nested hierarchy

Each module needs a different **sample rate** — how many times per second it runs. The rates are measured in **hertz** (Hz), cycles per second. The **period** is the time between runs, one over the rate: $100\,\mathrm{Hz}$ means a period of $10\,\mathrm{ms}$.

The simulation module required a slower rate to be an exact whole-number multiple of a faster one. Here all the rates follow that rule together. Every slower period is an exact whole-number multiple of every faster period below it. There is no **interpolation** (guessing values between two samples) and no schedule that slowly drifts out of step anywhere in the stack.

Why is each rate what it is? The one-line answer: each loop runs as fast as the thing it must follow can change, and no faster. Here is the card-style summary, and then the reasons in full.

::: key Typical GNC rate stack on a booster
Navigation at IMU rate (hundreds of Hz), control at 100 Hz or more, guidance re-solved at 1 to 2 Hz, mode management at a few Hz. Each rate is set by the bandwidth of what that loop must track, not by available CPU.
:::

**Bandwidth** here means how fast a signal or a loop can change — the highest frequency that matters to it.

::: key Why each rate is what it is, not merely what it is
**Navigation** runs at the IMU's own output rate, because a **[[strapdown mechanization|strapdown]]** has to integrate every gyro and accelerometer sample the hardware produces; skipping samples is not an option, it is discarding inertial data outright. **Control** runs fast enough that its own zero-order hold, priced exactly as the simulation module derived — a delay of half the sample period, costing $\phi_{\mathrm{ZOH}}=-\tfrac12\omega T$ radians of phase at the loop's crossover frequency — stays a small fraction of the phase margin the control lesson later in this module needs. **Guidance** runs only as fast as the trajectory itself changes, because re-solving a **[[boundary-value problem|bvp]]** that has moved only slightly since the last solve buys accuracy the vehicle cannot use and spends the stack's single largest computation doing it. **Mode management** runs slower still, fast enough to catch a transition condition without meaningful delay, with nothing to compute that changes faster than the flags it reads.
:::

Read $\phi_{\mathrm{ZOH}}$ as "phi Z-O-H", the phase lost to the hold. $\omega$ ("omega") is the frequency in radians per second, and $T$ is the sample period in seconds.

Navigation has one more reason to be fast. The vehicle shakes. Engine vibration and quick turns put fast wiggles into the gyros and accelerometers. If those are sampled too slowly they do not vanish — they come back disguised as slow, false motion. That trap is called **[[aliasing|aliasing]]**, and sampling at hundreds of hertz is the first defense against it.

::: example The reference vehicle's rate stack, nested exactly
Here are the six schedules in the landing burn, including the two sensor updates navigation folds in:

| Module | Period | Rate | Multiple of the fastest |
| --- | --- | --- | --- |
| Navigation (IMU mechanization) | $5\,\mathrm{ms}$ | $200\,\mathrm{Hz}$ | $\times1$ |
| Control | $10\,\mathrm{ms}$ | $100\,\mathrm{Hz}$ | $\times2$ |
| Radar altimeter update (below $1500\,\mathrm m$) | $50\,\mathrm{ms}$ | $20\,\mathrm{Hz}$ | $\times10$ |
| GNSS position/velocity update | $100\,\mathrm{ms}$ | $10\,\mathrm{Hz}$ | $\times20$ |
| Mode management | $200\,\mathrm{ms}$ | $5\,\mathrm{Hz}$ | $\times40$ |
| Guidance re-solve | $600\,\mathrm{ms}$ | $1.667\,\mathrm{Hz}$ | $\times120$ |

Walk up the table and check each step is a whole number:

- control: $10 / 5 = 2$ navigation periods;
- radar altimeter: $50 / 10 = 5$ control periods;
- GNSS: $100 / 50 = 2$ altimeter periods;
- mode management: $200 / 100 = 2$ GNSS periods;
- guidance: $600 / 200 = 3$ mode-management periods.

So a single fine step of $5\,\mathrm{ms}$ underlies the entire stack, and every other period is a whole-number multiple of it. This **[[nests exactly|rate-timeline]]**. It extends the simulation module's rule $\Delta t_{\mathrm{ctrl}}=n\,\Delta t_{\mathrm{plant}}$ from one ratio to five nested ones at once. ($\Delta t$ is read "delta t", a time step; $n$ is a whole number.)

Sanity check: $1.667\,\mathrm{Hz}$ is $1/0.6\,\mathrm s$, and it sits inside the $1$ to $2\,\mathrm{Hz}$ guidance range.
:::

Why is a re-solve this rare good enough? It is the zero-order-hold idea from the simulation module, one level up — with a twist. Between re-solves, guidance does not hold a single frozen number. It holds a whole *planned trajectory*. For each $0.6\,\mathrm s$ interval the vehicle follows a plan that already says how the command should change over that time. On average a plan is only $0.3\,\mathrm s$ old, and a plan that fresh is still close to the one the current state would produce.

Control, by contrast, holds only the immediate actuator command fixed. A frozen push is stale much sooner than a frozen plan. That is why control runs $600/10 = 60$ times faster than guidance, not merely twice as fast.

The same split tells you what a *missed* cycle costs at each level. Miss one guidance re-solve and the vehicle keeps flying a plan that is now about one cycle older — a small, measurable error, and survivable. Miss control ticks and nothing is steering the vehicle against its own motion, while the rotation keeps going. That difference is what later makes a guidance deadline policy possible at all: guidance can afford to be late now and then; control cannot.

## Pricing the control rate against the loop it serves

Now put numbers on the control rate. The attitude control loop built in a later lesson has a **[[crossover frequency|crossover]]** of $\omega_{gc}\approx4.59\,\mathrm{rad/s}$. ($\omega_{gc}$ is read "omega g c", for gain crossover.) At the chosen $10\,\mathrm{ms}$ period, the sampling frequency is

$$
\omega_s = \frac{2\pi}{\Delta t_{\mathrm{ctrl}}} = \frac{2\pi}{0.01} \approx 628\,\mathrm{rad/s}.
$$

The **oversampling ratio** — how many times faster than the loop's crossover we sample — is

$$
\frac{\omega_s}{\omega_{gc}} = \frac{628}{4.59} \approx 137.
$$

The digital-control material set a rule of thumb: sample at $20$ to $40$ times crossover. $137$ is more than three times the top of that range. The zero-order-hold phase cost at crossover is correspondingly small: $\tfrac12 \times 4.59 \times 0.01 \approx 0.023\,\mathrm{rad}$, about $1.3^\circ$. That sits comfortably inside the margin the control lesson needs to spend on other things — chiefly the **notch filter** guarding the vehicle's **[[first bending mode|bending]]**.

That bending mode sits at $25.1\,\mathrm{rad/s}$ ($4\,\mathrm{Hz}$). The same $100\,\mathrm{Hz}$ control rate samples *it* about $628/25.1 \approx 25$ times per wiggle, too. That is fast enough that a digital notch filter running at this rate behaves very nearly like its continuous-time design. The control lesson checks that directly instead of assuming it.

## The slow-variation check, for a burn that changes fast

The control lesson will compute stability margins as if the vehicle's mass and thrust were frozen at their values at one instant. That is **[[frozen-time|frozen-time]] analysis**. It is like judging a car's handling from a photo: fine if the car is not changing much while you look. It is only trustworthy when those properties change slowly compared with how fast the control loop itself responds. That condition deserves a number, not an assumption.

The verification module checked exactly this for an *ascent* burn. It found the vehicle's inertia changing by only about $0.45\%$ within one loop period — comfortably slow. The landing burn is a different world: a short, fast burn that loses a large fraction of its mass in under thirty seconds. So run the check again.

::: example How fast the landing burn's own mass moves, relative to its control loop
**Step 1: how fast propellant leaves.** At full throttle the engine burns propellant at $\dot m \approx 324.3\,\mathrm{kg/s}$. ($\dot m$, "m dot", is the rate of change of mass.)

**Step 2: how fast inertia falls.** Model the pitch inertia — the vehicle's resistance to being turned — as $I=m k^2$, with a fixed **[[radius of gyration|gyration]]** $k\approx12.12\,\mathrm m$. When mass falls at $\dot m$, inertia falls at

$$
\left|\frac{dI}{dt}\right| = k^2\,\dot m \approx (12.12)^2 \times 324.3 \approx 4.76\times10^4\ \mathrm{kg\,m^2/s}.
$$

**Step 3: as a fraction.** The ignition inertia is $I_0\approx4.645\times10^6\,\mathrm{kg\,m^2}$. So the inertia falls by $\lvert dI/dt\rvert/I_0\approx1.03\%$ every second.

**Step 4: per loop period.** The control loop's own period at its $4.59\,\mathrm{rad/s}$ crossover is $2\pi/4.59\approx1.37\,\mathrm s$. Within one loop period, the inertia changes by

$$
1.03\%/\mathrm s \times 1.37\,\mathrm s \approx 1.41\%.
$$

**What it means.** That is roughly three times the ascent burn's $0.45\%$. Say it plainly: the landing burn changes faster, relative to its own control loop, than the ascent burn did.

It is still comfortably below the level that would break frozen-time analysis. The verification module's staging example — the case it flagged as genuinely too fast — changed inertia by about $13\%$ in one loop period, over $10\%$ and about nine times the landing burn's figure. So the margins the control lesson computes are trustworthy snapshots of a vehicle that really is changing fast, not an artifact of a method pushed past where it works.
:::

::: warning A rate that is individually well-chosen is not automatically safe in company
Every rate in the table passed its own bandwidth check on its own terms. Navigation samples fast enough for the IMU. Control oversamples its crossover by more than a hundred times. Guidance re-solves fast enough to follow a slowly changing plan. None of those checks asks whether two rates, running together, can interact — whether a correction arriving at one rate lands, by an accident of timing, near a frequency where another part of the loop has little margin to spare. That question needs its own analysis on the *closed* loop, not on any one rate alone. **[[A later lesson|lesson-nine]]** in this module builds exactly that case, with real numbers.
:::

::: warning Oversampling a rigid-body crossover does not oversample every mode
The $137\times$ ratio is measured against the *rigid-body* crossover only. A vehicle with a lower first bending mode, or a **slosh** mode (propellant swinging in the tank) sitting close to the control rate's **[[Nyquist frequency|nyquist]]**, would need the same calculation repeated against that mode before calling the rate good enough. Sampling one frequency well tells you nothing, by itself, about how well any other frequency in the same system is sampled.
:::

## Check yourself

::: check
In one sentence each, give the reason navigation, control, guidance and mode management run at the rates they do, without quoting any specific number.
:::

::: answer
- **Navigation** runs at the IMU's own output rate, because it must integrate every sample the hardware produces.
- **Control** runs fast enough that its own zero-order-hold phase cost stays a small fraction of the margin the loop needs.
- **Guidance** re-solves only as fast as the trajectory itself meaningfully changes, since re-solving a nearly unchanged boundary-value problem buys little and costs the stack's heaviest computation.
- **Mode management** runs slowly because it only reacts to flags that do not themselves change faster than a fraction of a second.
:::

::: check
Verify that the guidance period in the table is an exact whole-number multiple of the mode-management period. Explain why that exact relationship — not merely both being "slow" — matters for the stack's timing.
:::

::: answer
$600\,\mathrm{ms}/200\,\mathrm{ms}=3$ exactly, a whole number.

It matters for the same reason the simulation module insisted that $\Delta t_{\mathrm{ctrl}}=n\,\Delta t_{\mathrm{plant}}$ be an exact whole-number ratio, not merely close to one. An exact multiple guarantees every guidance re-solve lands exactly on a mode-management tick. So mode management always sees a guidance status flag that is either fresh from this instant or exactly one mode-management cycle old. It never sees a value made up by interpolating between two mode-management ticks with a guidance update falling somewhere between them.
:::

::: check
Suppose someone proposes running control at $20\,\mathrm{Hz}$ instead of $100\,\mathrm{Hz}$ to save computing time, pointing out that $20\,\mathrm{Hz}$ still oversamples the $4.59\,\mathrm{rad/s}$ rigid-body crossover by about $27$ times — inside the $20$-to-$40\times$ rule. Using this lesson's oversampling calculation, explain why $100\,\mathrm{Hz}$ was chosen anyway.
:::

::: answer
The control rate has to serve the *whole* landing loop, not only its rigid-body crossover. In particular it must sample the first bending mode at $25.1\,\mathrm{rad/s}$ finely enough for a digital notch filter to behave the way its continuous-time design intends.

- At $100\,\mathrm{Hz}$, $\omega_s \approx 628\,\mathrm{rad/s}$, so the bending mode is sampled about $25$ times per cycle — comfortable, not excessive. The hold costs about $7^\circ$ of phase at that frequency.
- At $20\,\mathrm{Hz}$, $\omega_s \approx 126\,\mathrm{rad/s}$, so the mode is sampled only about $5$ times per cycle. The hold alone costs about $36^\circ$ of phase there, and a notch placed that close to the Nyquist frequency ($\omega_s/2 \approx 63\,\mathrm{rad/s}$) is noticeably distorted compared with its continuous design.

A rate chosen only against the rigid-body crossover — which might be fine for a vehicle with no structural mode nearby — would under-serve the notch filter here. The rates differ because the frequencies each loop must respect differ, not because one designer was more cautious.
:::

::: check
The slow-variation check found the landing burn's inertia changing about three times faster, relative to its own loop period, than the ascent burn's. Does that make frozen-time margin analysis invalid for the landing burn? Justify your answer with this lesson's numbers.
:::

::: answer
No. The landing burn changes inertia by about $1.41\%$ per loop period, against about $0.45\%$ for the ascent burn — three times larger.

But the case the verification module found really does break the frozen-time assumption was a staging event, at about $13\%$ within one loop period. That is about nine times the landing burn's figure, and well past $10\%$.

"Three times faster than a very slow baseline" and "too fast to trust" are different claims. Only a computed number, not the direction of the comparison alone, can tell them apart.
:::

::: check
A future version of the vehicle doubles the landing engine's thrust, keeping the same propellant load and the same shape of burn profile. Without recomputing anything, what happens to the slow-variation number from this lesson, and why?
:::

::: answer
Doubling thrust at the same propellant load roughly halves the burn time: mass drains twice as fast, and there is the same amount to drain. So the *same* fractional change in mass and inertia now happens in half the time. The relative rate of change, $\lvert dI/dt\rvert/I$, roughly doubles.

Unless the control loop's crossover also rises enough to shrink its period by a similar factor, the change per loop period grows the same way. That pushes the vehicle closer to the edge of where frozen-time analysis is valid — an edge the landing burn already sits nearer to than the ascent burn did. A redesign has to re-check this with numbers, not assume it is unchanged.
:::

## Summary

| Item | Value |
| --- | --- |
| Navigation rate | $200\,\mathrm{Hz}$ ($5\,\mathrm{ms}$), IMU mechanization |
| Control rate | $100\,\mathrm{Hz}$ ($10\,\mathrm{ms}$), $\approx137\times$ oversampled vs. the $4.59\,\mathrm{rad/s}$ rigid-body crossover; hold costs $\approx1.3^\circ$ there |
| GNSS / radar altimeter | $10\,\mathrm{Hz}$ / $20\,\mathrm{Hz}$ (altimeter active below $1500\,\mathrm m$) |
| Mode-management rate | $5\,\mathrm{Hz}$ ($200\,\mathrm{ms}$) |
| Guidance re-solve rate | $1.667\,\mathrm{Hz}$ ($600\,\mathrm{ms}$), inside the $1$–$2\,\mathrm{Hz}$ range |
| Nesting | Every slower period is an exact integer multiple of every faster one, up to $\times120$ over the fastest |
| Missed cycles | a missed guidance cycle means flying a slightly older plan (survivable); a missed control cycle leaves nothing steering |
| Slow-variation check | Landing burn: $\approx1.41\%$ inertia change per loop period, about $3\times$ the ascent burn's $\approx0.45\%$, still far from the $>10\%$ staging regime that invalidates frozen-time analysis |
| What this lesson does not check | Interaction *between* correctly chosen rates — a later lesson builds that case directly |

With the vehicle, the interfaces and the rates all fixed, the next four lessons take each interface from lesson 1 in turn and show, with numbers from a running simulation, exactly what goes wrong at it: navigation feeding guidance, guidance feeding control, control feeding the vehicle, and the mode transition that switches all three at once.

::: context strapdown Sensors bolted to the body
In a **strapdown** system the gyros and accelerometers are fixed rigidly to the vehicle, turning with it. (Older systems kept them on a gimballed platform that stayed level.) The flight computer has to do the work the platform used to do: take each tiny rotation the gyros report and add it to the attitude, then turn each accelerometer reading into the right frame and add it to velocity and position.

That adding-up is the **mechanization**. Each sample carries a small slice of the motion. Drop one and that slice is gone for good — which is why navigation runs at the IMU's own rate.
:::

::: context bvp A problem pinned at both ends
A **boundary-value problem** fixes conditions at two ends. For landing guidance, one end is where the vehicle is now (position, velocity); the other is where it must be at touchdown (on the pad, gently moving down). The solver finds the best path joining them, often while minimizing fuel and respecting thrust limits.

That makes it the heaviest computation in the stack — and lesson 5 shows what happens when it does not finish in time.
:::

::: context aliasing Fast wiggles in disguise
Sample a fast wiggle too slowly and the samples trace out a slow wiggle that is not really there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <polyline points="30.0,60.0 31.5,52.4 33.0,45.1 34.5,38.5 36.0,33.0 37.5,28.8 39.0,26.1 40.5,25.0 42.0,25.6 43.5,27.9 45.0,31.7 46.5,36.9 48.0,43.1 49.5,50.2 51.0,57.8 52.5,65.5 54.0,72.9 55.5,79.7 57.0,85.5 58.5,90.1 60.0,93.3 61.5,94.8 63.0,94.7 64.5,92.9 66.0,89.6 67.5,84.7 69.0,78.8 70.5,71.9 72.0,64.4 73.5,56.7 75.0,49.2 76.5,42.2 78.0,36.0 79.5,31.1 81.0,27.5 82.5,25.4 84.0,25.1 85.5,26.4 87.0,29.3 88.5,33.7 90.0,39.4 91.5,46.1 93.0,53.4 94.5,61.1 96.0,68.7 97.5,75.9 99.0,82.3 100.5,87.7 102.0,91.7 103.5,94.2 105.0,95.0 106.5,94.2 108.0,91.7 109.5,87.7 111.0,82.3 112.5,75.9 114.0,68.7 115.5,61.1 117.0,53.4 118.5,46.1 120.0,39.4 121.5,33.7 123.0,29.3 124.5,26.4 126.0,25.1 127.5,25.4 129.0,27.5 130.5,31.1 132.0,36.0 133.5,42.2 135.0,49.2 136.5,56.7 138.0,64.4 139.5,71.9 141.0,78.8 142.5,84.7 144.0,89.6 145.5,92.9 147.0,94.7 148.5,94.8 150.0,93.3 151.5,90.1 153.0,85.5 154.5,79.7 156.0,72.9 157.5,65.5 159.0,57.8 160.5,50.2 162.0,43.1 163.5,36.9 165.0,31.7 166.5,27.9 168.0,25.6 169.5,25.0 171.0,26.1 172.5,28.8 174.0,33.0 175.5,38.5 177.0,45.1 178.5,52.4 180.0,60.0 181.5,67.6 183.0,74.9 184.5,81.5 186.0,87.0 187.5,91.2 189.0,93.9 190.5,95.0 192.0,94.4 193.5,92.1 195.0,88.3 196.5,83.1 198.0,76.9 199.5,69.8 201.0,62.2 202.5,54.5 204.0,47.1 205.5,40.3 207.0,34.5 208.5,29.9 210.0,26.7 211.5,25.2 213.0,25.3 214.5,27.1 216.0,30.4 217.5,35.3 219.0,41.2 220.5,48.1 222.0,55.6 223.5,63.3 225.0,70.8 226.5,77.8 228.0,84.0 229.5,88.9 231.0,92.5 232.5,94.6 234.0,94.9 235.5,93.6 237.0,90.7 238.5,86.3 240.0,80.6 241.5,73.9 243.0,66.6 244.5,58.9 246.0,51.3 247.5,44.1 249.0,37.7 250.5,32.3 252.0,28.3 253.5,25.8 255.0,25.0 256.5,25.8 258.0,28.3 259.5,32.3 261.0,37.7 262.5,44.1 264.0,51.3 265.5,58.9 267.0,66.6 268.5,73.9 270.0,80.6 271.5,86.3 273.0,90.7 274.5,93.6 276.0,94.9 277.5,94.6 279.0,92.5 280.5,88.9 282.0,84.0 283.5,77.8 285.0,70.8 286.5,63.3 288.0,55.6 289.5,48.1 291.0,41.2 292.5,35.3 294.0,30.4 295.5,27.1 297.0,25.3 298.5,25.2 300.0,26.7 301.5,29.9 303.0,34.5 304.5,40.3 306.0,47.1 307.5,54.5 309.0,62.2 310.5,69.8 312.0,76.9 313.5,83.1 315.0,88.3 316.5,92.1 318.0,94.4 319.5,95.0 321.0,93.9 322.5,91.2 324.0,87.0 325.5,81.5 327.0,74.9 328.5,67.6 330.0,60.0" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <polyline points="30.0,60.0 36.0,64.4 42.0,68.7 48.0,72.9 54.0,76.9 60.0,80.6 66.0,84.0 72.0,87.0 78.0,89.6 84.0,91.7 90.0,93.3 96.0,94.4 102.0,94.9 108.0,94.9 114.0,94.4 120.0,93.3 126.0,91.7 132.0,89.6 138.0,87.0 144.0,84.0 150.0,80.6 156.0,76.9 162.0,72.9 168.0,68.7 174.0,64.4 180.0,60.0 186.0,55.6 192.0,51.3 198.0,47.1 204.0,43.1 210.0,39.4 216.0,36.0 222.0,33.0 228.0,30.4 234.0,28.3 240.0,26.7 246.0,25.6 252.0,25.1 258.0,25.1 264.0,25.6 270.0,26.7 276.0,28.3 282.0,30.4 288.0,33.0 294.0,36.0 300.0,39.4 306.0,43.1 312.0,47.1 318.0,51.3 324.0,55.6 330.0,60.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <g fill="#1f2a44"><circle cx="30" cy="60" r="4"/><circle cx="67.5" cy="84.7" r="4"/><circle cx="105" cy="95" r="4"/><circle cx="142.5" cy="84.7" r="4"/><circle cx="180" cy="60" r="4"/><circle cx="217.5" cy="35.3" r="4"/><circle cx="255" cy="25" r="4"/><circle cx="292.5" cy="35.3" r="4"/><circle cx="330" cy="60" r="4"/></g>
  <text x="30" y="118" font-size="11" fill="#1d6fd1">true: 7 wiggles</text>
  <text x="150" y="118" font-size="11" fill="#1f2a44">8 samples (dots)</text>
  <text x="258" y="118" font-size="11" fill="#b4232c">seen: 1 slow wiggle</text>
</svg>
```

The light curve wiggles $7$ times; it is sampled only $8$ times. The dots fall exactly on a single slow wave, upside down. A filter fed those samples would believe in a slow motion that never happened.
:::

::: context rate-timeline The rates, drawn to scale
Here are $600\,\mathrm{ms}$ of the landing burn — exactly one guidance cycle. Each tick is one run. (Navigation, not drawn, ticks twice as often as control.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <text x="8" y="32" font-size="11" fill="#1f2a44">control 10 ms</text>
  <line x1="100" y1="28" x2="340" y2="28" stroke="#1f2a44" stroke-width="0.8"/>
  <path d="M100.0,33 v-10 M104.0,33 v-10 M108.0,33 v-10 M112.0,33 v-10 M116.0,33 v-10 M120.0,33 v-10 M124.0,33 v-10 M128.0,33 v-10 M132.0,33 v-10 M136.0,33 v-10 M140.0,33 v-10 M144.0,33 v-10 M148.0,33 v-10 M152.0,33 v-10 M156.0,33 v-10 M160.0,33 v-10 M164.0,33 v-10 M168.0,33 v-10 M172.0,33 v-10 M176.0,33 v-10 M180.0,33 v-10 M184.0,33 v-10 M188.0,33 v-10 M192.0,33 v-10 M196.0,33 v-10 M200.0,33 v-10 M204.0,33 v-10 M208.0,33 v-10 M212.0,33 v-10 M216.0,33 v-10 M220.0,33 v-10 M224.0,33 v-10 M228.0,33 v-10 M232.0,33 v-10 M236.0,33 v-10 M240.0,33 v-10 M244.0,33 v-10 M248.0,33 v-10 M252.0,33 v-10 M256.0,33 v-10 M260.0,33 v-10 M264.0,33 v-10 M268.0,33 v-10 M272.0,33 v-10 M276.0,33 v-10 M280.0,33 v-10 M284.0,33 v-10 M288.0,33 v-10 M292.0,33 v-10 M296.0,33 v-10 M300.0,33 v-10 M304.0,33 v-10 M308.0,33 v-10 M312.0,33 v-10 M316.0,33 v-10 M320.0,33 v-10 M324.0,33 v-10 M328.0,33 v-10 M332.0,33 v-10 M336.0,33 v-10 M340.0,33 v-10" stroke="#1d6fd1" stroke-width="1" fill="none"/>
  <text x="8" y="58" font-size="11" fill="#1f2a44">altimeter 50 ms</text>
  <line x1="100" y1="54" x2="340" y2="54" stroke="#1f2a44" stroke-width="0.8"/>
  <path d="M100.0,59 v-10 M120.0,59 v-10 M140.0,59 v-10 M160.0,59 v-10 M180.0,59 v-10 M200.0,59 v-10 M220.0,59 v-10 M240.0,59 v-10 M260.0,59 v-10 M280.0,59 v-10 M300.0,59 v-10 M320.0,59 v-10 M340.0,59 v-10" stroke="#8fb8f0" stroke-width="2.5" fill="none"/>
  <text x="8" y="84" font-size="11" fill="#1f2a44">GNSS 100 ms</text>
  <line x1="100" y1="80" x2="340" y2="80" stroke="#1f2a44" stroke-width="0.8"/>
  <path d="M100.0,85 v-10 M140.0,85 v-10 M180.0,85 v-10 M220.0,85 v-10 M260.0,85 v-10 M300.0,85 v-10 M340.0,85 v-10" stroke="#6c7a93" stroke-width="2.5" fill="none"/>
  <text x="8" y="110" font-size="11" fill="#1f2a44">mode 200 ms</text>
  <line x1="100" y1="106" x2="340" y2="106" stroke="#1f2a44" stroke-width="0.8"/>
  <path d="M100.0,111 v-10 M180.0,111 v-10 M260.0,111 v-10 M340.0,111 v-10" stroke="#f2b880" stroke-width="2.5" fill="none"/>
  <text x="8" y="136" font-size="11" fill="#1f2a44">guidance 600 ms</text>
  <line x1="100" y1="132" x2="340" y2="132" stroke="#1f2a44" stroke-width="0.8"/>
  <path d="M100.0,137 v-10 M340.0,137 v-10" stroke="#b4232c" stroke-width="2.5" fill="none"/>
  <text x="100" y="156" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="340" y="156" font-size="11" text-anchor="end" fill="#1f2a44">600 ms</text>
</svg>
```

Every slow tick lines up with a fast one below it. Nothing ever lands between two ticks of a faster clock.
:::

::: context crossover How fast the loop reacts
The **gain crossover frequency** is where the loop's open-loop gain falls to exactly one. Roughly, it marks how fast the closed loop can respond: signals slower than crossover are followed, faster ones are not.

At $4.59\,\mathrm{rad/s}$, one full cycle takes $2\pi/4.59 \approx 1.37\,\mathrm s$. That "loop period" is the yardstick used in this lesson's slow-variation check. It is also why the sample period, $0.01\,\mathrm s$, is so small by comparison: the loop barely notices it is digital.
:::

::: context bending The rocket is a bit of a spring
A rocket is long and thin, so it can flex like a diving board. Its slowest flexing shape is the **first bending mode**, here at $4\,\mathrm{Hz}$ — four sways a second.

The gyros sit somewhere along that flexing body, so they feel the sway as if it were a real turn. A controller that reacts to it can pump the bending up instead of calming the vehicle. The **notch filter** removes a narrow band of frequencies around the mode so the controller ignores it. Lesson 6 designs it for this vehicle.
:::

::: context frozen-time Judging a moving thing from a snapshot
Stability margins come from tools built for systems that do not change. A rocket burning propellant does change. **Frozen-time** analysis takes snapshots: freeze the vehicle at one instant, compute margins as if it stayed that way, then repeat at other instants.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="11" fill="#1f2a44">inertia change within one loop period (same scale)</text>
  <rect x="20" y="30" width="9" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="36" y="45" font-size="11" fill="#1f2a44">ascent burn 0.45%</text>
  <rect x="20" y="60" width="28.2" height="20" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <text x="55" y="75" font-size="11" fill="#1f2a44">landing burn 1.41%</text>
  <rect x="20" y="90" width="260" height="20" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <text x="26" y="105" font-size="11" fill="#fff">staging about 13%: too fast</text>
</svg>
```

The staging bar is the verification module's example. Snapshots are fair when the vehicle barely moves between them, as in the top two bars.
:::

::: context gyration One number for how mass is spread
Two objects with the same mass can be very different to spin. A figure skater with arms out turns slowly; arms in, fast. The **radius of gyration** $k$ is the distance at which you could put all the mass in a thin ring and get the same resistance to turning: $I = m k^2$.

Keeping $k$ fixed is a simplification. Real propellant drains from particular tanks, so $k$ shifts during the burn. For a quick check of how fast inertia changes, the fixed-$k$ model is good enough.
:::

::: context lesson-nine Where the rates meet
Lesson 9, "the integration-only failure", builds the case this warning points at. A navigation error that repeats on some timescale passes navigation's own test. The control loop passes its own margin test. Together, the closed loop does measurably worse than either test predicted, because the error's timing lines up with a frequency where the loop amplifies it. Neither test could see it, since each looked only at its own part.
:::

::: context nyquist Half the sampling rate
The **Nyquist frequency** is half the sampling frequency. It is the fastest wiggle a sampler can represent at all; anything faster comes back aliased as something slower.

For the $100\,\mathrm{Hz}$ control rate it is $50\,\mathrm{Hz}$, about $314\,\mathrm{rad/s}$. The $4\,\mathrm{Hz}$ bending mode is far below it. At $20\,\mathrm{Hz}$ the Nyquist frequency would be only $10\,\mathrm{Hz}$, and a notch at $4\,\mathrm{Hz}$ would sit uncomfortably close.
:::
