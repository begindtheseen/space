---
id: l03-rate-architecture
title: Rate architecture for the integrated stack
minutes: 19
covers:
  - 'Rate architecture: navigation at IMU rate, control at 100 Hz or faster, guidance re-solved at 1 to 2 Hz, mode management at a low rate'
---

The simulation module you have already completed built a two-rate architecture: a fine, accurate plant step, and one flight-software rate held fixed by a zero-order hold in between. A landing GNC stack is not one flight-software rate — it is four, one for each module this module's first lesson named, and they are not equal, not by a small margin but by two orders of magnitude between the fastest and the slowest. This lesson fixes those four rates for the reference vehicle, shows that the two-rate integer-multiple rule from the simulation module extends cleanly to all four nested together, and then does the one check that rule never had to make on its own: whether the vehicle's own physical parameters change slowly enough, relative to each chosen rate, for every later lesson's analysis to actually mean what it claims.

## Four rates, one nested hierarchy

Each of the four modules from the first lesson in this module needs a different sample rate, and — extending the simulation module's own rule that a slower rate must be an exact integer multiple of a faster one — all four are chosen so that every slower rate divides evenly into every faster one beneath it, with no interpolation and no drifting schedule anywhere in the stack.

::: key Why each rate is what it is, not merely what it is
**Navigation** runs at the IMU's own output rate, because a strapdown mechanization has to integrate every gyro and accelerometer sample the hardware produces; skipping samples is not an option, it is discarding inertial data outright. **Control** runs fast enough that its own zero-order hold, priced exactly as the simulation module derived — a delay of half the sample period, costing $\phi_{\mathrm{ZOH}}=-\tfrac12\omega T$ radians of phase at the loop's crossover frequency — stays a small fraction of the phase margin the control lesson later in this module needs. **Guidance** runs only as fast as the trajectory itself changes, because re-solving a boundary-value problem that has moved only slightly since the last solve buys accuracy the vehicle cannot use and spends the stack's single largest computation doing it. **Mode management** runs slower still, fast enough to catch a transition condition without meaningful delay, with nothing to compute that changes faster than the flags it reads.
:::

::: example The reference vehicle's rate stack, nested exactly
| Module | Period | Rate | Multiple of the fastest |
| --- | --- | --- | --- |
| Navigation (IMU mechanization) | $5\,\mathrm{ms}$ | $200\,\mathrm{Hz}$ | $\times1$ |
| Control | $10\,\mathrm{ms}$ | $100\,\mathrm{Hz}$ | $\times2$ |
| Radar altimeter update (below $1500\,\mathrm m$) | $50\,\mathrm{ms}$ | $20\,\mathrm{Hz}$ | $\times10$ |
| GNSS position/velocity update | $100\,\mathrm{ms}$ | $10\,\mathrm{Hz}$ | $\times20$ |
| Mode management | $200\,\mathrm{ms}$ | $5\,\mathrm{Hz}$ | $\times40$ |
| Guidance re-solve | $600\,\mathrm{ms}$ | $1.667\,\mathrm{Hz}$ | $\times120$ |

Every entry divides evenly into every faster one above it: control is exactly twice the navigation period, the radar altimeter exactly five times control, GNSS exactly twice the altimeter, mode management exactly twice GNSS, and guidance exactly three times mode management — a single fine step of $5\,\mathrm{ms}$ underlies the entire stack, and every other period is a small integer multiple of it, extending the simulation module's own $\Delta t_{\mathrm{ctrl}}=n\,\Delta t_{\mathrm{plant}}$ rule from one ratio to five nested ones at once.
:::

Guidance re-solving at $1.667\,\mathrm{Hz}$ sits inside the $1$ to $2\,\mathrm{Hz}$ range this module's own topic list names, and the reason a re-solve this infrequent is adequate is the same reasoning the simulation module used for its own zero-order hold, one level up: the guidance re-solve holds a *reference trajectory* fixed between updates, not a raw command, so the vehicle spends each $0.6\,\mathrm s$ interval tracking a whole planned trajectory rather than a single frozen number, and a plan computed a third of a second ago is still close to the plan the current state would produce. Control, by contrast, holds only the immediate actuator command fixed, which is why it needs to run roughly sixty times faster than guidance rather than merely twice as fast.

## Pricing the control rate against the loop it serves

The attitude control loop this module builds in a later lesson crosses over at $\omega_{gc}\approx4.59\,\mathrm{rad/s}$. At the control rate chosen above, the sampling frequency is $\omega_s = 2\pi/\Delta t_{\mathrm{ctrl}} = 2\pi/0.01 \approx 628\,\mathrm{rad/s}$, an oversampling ratio of

$$
\frac{\omega_s}{\omega_{gc}} = \frac{628}{4.59} \approx 137,
$$

more than three times the $20$-to-$40\times$ rule the digital-control material already established as adequate, and correspondingly a small zero-order-hold phase cost at crossover — comfortably inside the margin the control lesson later in this module needs to spend on other things, principally the notch filter guarding the vehicle's first bending mode. That bending mode sits at $25.1\,\mathrm{rad/s}$ ($4\,\mathrm{Hz}$), and the same $100\,\mathrm{Hz}$ control rate oversamples *it* by a factor of about $25$ as well — fast enough that a digital notch filter implemented at this rate reproduces its continuous-time design closely, which the control lesson checks directly rather than assuming.

## The slow-variation check, for a burn that changes fast

Frozen-time margin analysis — computing a stability margin as though the vehicle's mass and thrust were fixed at their value at one instant — is only trustworthy when those parameters actually change slowly relative to how fast the control loop itself responds, a condition worth checking with a number rather than assumed. The verification module's own worked example checked exactly this for an *ascent* burn and found the vehicle's inertia changing by only about $0.45\%$ within one loop period, comfortably slow. The landing burn this module builds is a different regime — a short, fast burn losing a large fraction of its own mass in under thirty seconds — and the same check is worth running again rather than assumed to still hold.

::: example How fast the landing burn's own mass moves, relative to its control loop
At full throttle, the reference vehicle's engine consumes propellant at $\dot m \approx 324.3\,\mathrm{kg/s}$; with the pitch inertia modeled as $I=m k^2$ for a fixed radius of gyration $k\approx12.12\,\mathrm m$, the rate of change of inertia at ignition is

$$
\left|\frac{dI}{dt}\right| = k^2\,\dot m \approx (12.12)^2 \times 324.3 \approx 4.76\times10^4\ \mathrm{kg\,m^2/s},
$$

against an ignition inertia $I_0\approx4.645\times10^6\,\mathrm{kg\,m^2}$ — a relative rate of $\lvert dI/dt\rvert/I_0\approx1.03\%$ per second. The control loop's own period at its $4.59\,\mathrm{rad/s}$ crossover is $2\pi/4.59\approx1.37\,\mathrm s$, so the relative change *within one loop period* is

$$
1.03\%/\mathrm s \times 1.37\,\mathrm s \approx 1.41\%,
$$

roughly three times the ascent burn's own $0.45\%$ figure, and worth stating plainly rather than glossed over: the landing burn moves faster, relative to its own control loop, than the ascent burn did. It is still comfortably under any threshold that would call frozen-time analysis into question — the staging event the verification module flagged as genuinely too fast moved parameters more than an order of magnitude faster than this, at over $10\%$ per loop period — so the control margins the later lesson computes are trustworthy snapshots of a genuinely fast-changing vehicle, not an artifact of an analysis method being pushed past where it applies.
:::

::: warning A rate that is individually well-chosen is not automatically safe in company
Every rate in this lesson's table passed its own bandwidth check on its own terms: navigation samples fast enough for the IMU, control oversamples its own crossover by more than a hundredfold, guidance re-solves fast enough to track a slowly evolving plan. None of those individual checks looks at whether two of these rates, running together, can interact — a correction injected at one rate landing, by coincidence of timing, near a frequency where a different part of the loop has little margin to spare. That question needs its own analysis, on the *closed* loop rather than on any one rate in isolation, and a later lesson in this module builds exactly that case, with real numbers, once every piece this lesson assumes is in place.
:::

::: warning Oversampling a rigid-body crossover does not oversample every mode
The $137\times$ ratio computed above is measured against the *rigid-body* crossover frequency specifically. A vehicle with a lower first bending mode, or a slosh mode sitting close to the control rate's own Nyquist frequency, would need the same calculation repeated against that mode before declaring the rate adequate — oversampling one frequency in a system says nothing by itself about how well any other frequency in the same system is sampled.
:::

## Check yourself

::: check
State, in one sentence each, the reason navigation, control, guidance and mode management run at the rates they do, without citing any specific number.
:::

::: answer
Navigation runs at the IMU's own output rate because it must integrate every sample the hardware produces. Control runs fast enough that its own zero-order-hold phase cost stays a small fraction of the margin the loop needs. Guidance re-solves only as fast as the trajectory itself meaningfully changes, since re-solving a nearly-unchanged boundary-value problem buys little at the cost of the stack's heaviest computation. Mode management runs slowly because it only reacts to flags that themselves do not change faster than a fraction of a second.
:::

::: check
Verify that the guidance period in this lesson's table is an exact integer multiple of the mode-management period, and explain why that specific relationship — rather than merely both being "slow" — matters for the stack's timing discipline.
:::

::: answer
$600\,\mathrm{ms}/200\,\mathrm{ms}=3$ exactly, an integer. The relationship matters for the same reason the simulation module insisted $\Delta t_{\mathrm{ctrl}}=n\,\Delta t_{\mathrm{plant}}$ be an exact integer ratio rather than merely close to one: an exact multiple guarantees every guidance re-solve lands exactly on a mode-management tick, so mode management always sees a guidance status flag that is either fresh from this instant or one full mode-management cycle old, never a value manufactured by interpolating between two mode-management ticks that straddle a guidance update landing between them.
:::

::: check
Using the oversampling-ratio calculation in this lesson, explain why a $100\,\mathrm{Hz}$ control rate was chosen instead of, say, the ascent module's own rigid-body loop, which the classical-control material showed crossing over at a much lower frequency and needing correspondingly less oversampling.
:::

::: answer
The $100\,\mathrm{Hz}$ rate has to serve the *whole* landing-phase loop, not only its rigid-body crossover — in particular it also has to sample the first bending mode at $25.1\,\mathrm{rad/s}$ finely enough for a digital notch filter to behave the way its continuous-time design intends, which this lesson found gives a comfortable but not excessive $25\times$ oversampling at that specific frequency. A rate chosen only against the rigid-body crossover, the way a slower ascent-phase loop with no nearby structural mode might reasonably be, would under-serve the notch filter here; the two vehicles' control rates differ because the frequencies each control loop actually has to respect differ, not because one designer was more conservative than the other.
:::

::: check
The slow-variation check found the landing burn's inertia changing about three times faster, relative to its own loop period, than the ascent burn's. Does this mean frozen-time margin analysis is invalid for the landing burn? Justify the answer using the specific numbers this lesson computed.
:::

::: answer
No. The check found a relative change of about $1.41\%$ per loop period for the landing burn, against about $0.45\%$ for the ascent burn — three times larger, but still far below the regime the verification module identified as actually breaking the frozen-time assumption, which was a staging event moving parameters more than $10\%$ within one loop period, over twenty times larger than the landing burn's figure. "Three times faster than a very slow baseline" and "too fast to trust" are different claims, and only a computed number, not the direction of the comparison alone, can tell them apart.
:::

::: check
A future revision of the vehicle doubles the landing engine's thrust while keeping the same propellant load and burn profile shape. Without recomputing anything, say qualitatively what happens to the slow-variation check's relative-rate number from this lesson, and why.
:::

::: answer
Doubling thrust at the same propellant load roughly halves the burn duration (since mass depletes twice as fast for the same total propellant), which means the *same* fractional change in mass and inertia now happens in half the time — the relative rate of change, $\lvert dI/dt\rvert/I$, roughly doubles. Unless the control loop's own crossover frequency also increases enough to shrink the loop period by a comparable factor, the relative change per loop period grows accordingly, moving the vehicle's margin-analysis validity closer to the boundary this lesson found the landing burn already sitting nearer to than the ascent burn — exactly the kind of question a redesign has to re-check numerically rather than assume unchanged.
:::

## Summary

| Item | Value |
| --- | --- |
| Navigation rate | $200\,\mathrm{Hz}$ ($5\,\mathrm{ms}$), IMU mechanization |
| Control rate | $100\,\mathrm{Hz}$ ($10\,\mathrm{ms}$), $\approx137\times$ oversampled vs. the $4.59\,\mathrm{rad/s}$ rigid-body crossover |
| GNSS / radar altimeter | $10\,\mathrm{Hz}$ / $20\,\mathrm{Hz}$ (altimeter active below $1500\,\mathrm m$) |
| Mode-management rate | $5\,\mathrm{Hz}$ ($200\,\mathrm{ms}$) |
| Guidance re-solve rate | $1.667\,\mathrm{Hz}$ ($600\,\mathrm{ms}$), inside the $1$–$2\,\mathrm{Hz}$ range |
| Nesting | Every slower period is an exact integer multiple of every faster one, up to $\times120$ over the fastest |
| Slow-variation check | Landing burn: $\approx1.41\%$ inertia change per loop period, about $3\times$ the ascent burn's $\approx0.45\%$, still far from the $>10\%$ regime that invalidates frozen-time analysis |
| What this lesson does not check | Interaction *between* correctly-chosen rates — a later lesson builds that case directly |

With the vehicle, the interfaces and the rates all fixed, the next four lessons take each interface from the first lesson in turn and show, with numbers from a running simulation, exactly what goes wrong at it: navigation feeding guidance, guidance feeding control, control feeding the vehicle, and the mode transition that switches all three at once.
