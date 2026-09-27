---
id: l09-frequency-domain-out-loud
title: "Phase margin, explained out loud"
minutes: 22
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

Picture pushing a friend on a swing, but every push lands a fraction of a second late. A little late, and nothing much changes. Late enough, and your pushes add energy at the wrong moment and the swinging grows wild. How much lateness can you afford? For a control loop, that question is **phase margin**.

The previous lesson put a loop's poles where they were wanted. That answers *does this work?* It says nothing about the question that decides whether a control law flies: *does it still work when the vehicle is not the one you modeled?*

The inertia will not be what you assumed. The actuator has dynamics you left out. The flight computer takes a few milliseconds per command, and the sensor filter adds more. There may be a structural mode you do not know about. **Frequency-domain analysis** — studying a loop by how it responds to wiggles of each speed — answers this robustness question with numbers. Its two headline numbers, **gain margin** and **phase margin**, are the standard way that answer gets written down and reviewed.

That is why it is on this module's reported list of phone-screen topics. The version you are most likely to get is not *compute the phase margin* but *what does phase margin mean physically?* — the harder one, and the one this lesson is built around.

## Wiggles in, wiggles out

Feed a loop a steady **[[sine wave|sine-lag]]** — a smooth, repeating wiggle — at some **frequency** $\omega$ ("omega"), measured in radians per second. After things settle, what comes out is a sine wave at the same frequency, changed in two ways:

- its size is scaled by some factor, the **gain** (or **magnitude**);
- it is shifted later in time, the **phase lag**, measured as an angle — a full cycle is $360^\circ$.

In the $s$ language of the last lesson, you get both by putting $s = j\omega$ into the transfer function: the size of the resulting complex number is the gain, and its angle is the phase. A **[[Bode plot|bode-plot]]** draws both against frequency, gain in **[[decibels|decibels]]** (dB) and frequency on a **logarithmic** scale, where each equal step is ten times the frequency — a **decade**.

## The loop transfer function and the two crossings

Everything here is about one object: the **loop transfer function**

$$L(s) = C(s)G(s),$$

the controller $C$ times the plant $G$. Picture cutting the loop open, sending a signal all the way around once, and seeing what comes back. That is the **open-loop** function — not the **closed-loop** one from command to output. Mixing them up is the commonest confusion in the subject, so say which you mean.

Two frequencies matter.

The **gain crossover frequency** $\omega_c$ ("omega sub c") is where the loop gain passes through one: $|L(j\omega_c)| = 1$, which is 0 dB. Below it the loop has authority and follows commands; above it the loop gives up. It is roughly the closed-loop **bandwidth**.

The **phase crossover frequency** $\omega_{180}$ is where the phase passes $-180^\circ$ — half a cycle late.

Why $-180^\circ$? A wave half a cycle late is upside down. Feedback meant to push *against* the error now pushes *with* it — the swing pushed at exactly the wrong moment. If that happens at a gain of one, the signal comes back around the same size and flipped, and the loop keeps itself going: marginal stability.

The margins measure how far the loop is from that, at each crossing:

$$\mathrm{PM} = 180^\circ + \angle L(j\omega_c), \qquad \mathrm{GM} = \frac{1}{|L(j\omega_{180})|}$$

($\angle$ means "the angle of".) **Phase margin** is how much *extra phase lag* at the gain crossover frequency would take the loop to marginal stability. **Gain margin** is the factor you could multiply the loop gain by, at the frequency where the phase is already $-180^\circ$, before the same thing happened.

::: warning Both margins presume a stable, minimum-phase loop
Reading margins straight off a Bode plot is valid for a loop that is open-loop stable and **[[minimum-phase|minimum-phase]]** — no poles or zeros in the right half of the $s$-plane. Then the **Nyquist criterion**, the full stability test, requires zero **encirclements** of the $-1$ point (the curve of $L(j\omega)$ must not loop around it). For a loop with a right-half-plane pole, such as a plant that behaves like an inverted pendulum, closed-loop stability *requires* an encirclement. Then a large apparent gain margin can hide the fact that *reducing* the gain destabilizes it. Say the assumption before the definition; this module's source reports it is expected explicitly.
:::

## What phase margin means physically

The definition sounds circular until you turn it into time. That conversion is what an interviewer is looking for.

A pure time delay of $T$ seconds — the late push on the swing — leaves the size of every sine wave alone. It only shifts each one later by $T$ seconds. A wave at frequency $\omega$ turns through $\omega T$ radians in $T$ seconds, so the delay adds a phase of $-\omega T$ radians. It changes no gain anywhere and removes phase everywhere, more at higher frequency.

So if your loop has a phase margin of $\mathrm{PM}$ radians at crossover frequency $\omega_c$, the delay that uses it all up satisfies $\omega_c T = \mathrm{PM}$. The largest pure delay you can insert before marginal stability is

$$T_{\max} = \frac{\mathrm{PM}\ \text{[rad]}}{\omega_c}$$

**Phase margin is a budget for unmodeled lag, and dividing it by the crossover frequency turns it into seconds.** Everything that eats it is real hardware on a real vehicle:

- computation delay between reading the sensor and commanding the actuator;
- the zero-order hold's effective half-sample delay (from the last lesson);
- actuator response time;
- **[[anti-aliasing|anti-aliasing]]** and noise filters;
- the transport delay of a slow data bus.

It also explains why fast loops are harder to make robust: doubling the bandwidth halves the delay budget at the same phase margin. A twenty-millisecond computation delay is invisible in a slow spacecraft attitude loop and can be most of the margin in a launch vehicle's rate loop.

::: key
Phase margin is the additional phase lag at the gain crossover frequency that would drive the loop to marginal stability. Converted to time, the tolerable pure delay is the phase margin in radians divided by the crossover frequency. It is a budget for unmodeled lag — computation delay, the hold, actuator dynamics, filters — and it shrinks in seconds as the bandwidth rises.
:::

## Design targets, and what they are

Common engineering practice targets something like $30^\circ$ to $60^\circ$ of phase margin and a gain margin of about 6 dB. Six decibels is a factor of 2 in gain: 6 dB is a factor of 1.995, and a factor of exactly 2 is 6.02 dB.

These are conventions from control practice, of the kind **[[Franklin, Powell and Emami-Naeini|franklin-powell]]** set out — not any employer's requirements, which live in each program's own documents. Quote them as what they are: values for sanity checking a design when no requirement is stated.

Why a floor near $30^\circ$? Below it almost nothing is left for unmodeled lags, and the closed-loop response becomes badly underdamped — ringing a lot, which links back to the previous lesson's damping ratio.

## Phase margin and damping are the same statement

For the standard second-order loop, phase margin and closed-loop damping ratio are two readings of one design choice. The handy approximation is

$$\zeta \approx \frac{\mathrm{PM}\ \text{[degrees]}}{100}$$

good up to a phase margin of roughly $60^\circ$ to $70^\circ$. Exact values for the standard loop: a damping ratio of 0.3 goes with about $33^\circ$, 0.5 with about $52^\circ$, and 0.7 with about $65^\circ$.

This pair lets you check a frequency-domain answer with a time-domain fact, and the other way around — the most useful sanity check in this area.

## Slope at crossover

One more fact, the shortest route to explaining *why* a loop is designed as it is.

For a minimum-phase system, **[[Bode's gain–phase relationship|bode-history]]** ties the phase to the slope of the magnitude curve. A magnitude slope of $-20\,\mathrm{dB}$ per decade, kept up around some frequency, goes with about $-90^\circ$ of phase there. A slope of $-40\,\mathrm{dB}$ per decade goes with about $-180^\circ$.

So the design rule is to cross over at $-20\,\mathrm{dB}$ per decade. Cross at $-40$ and you are at roughly $-180^\circ$ at crossover — zero phase margin.

This is exactly why the double integrator needs derivative action. $1/(Js^2)$ falls at $-40\,\mathrm{dB}$ per decade everywhere, with phase $-180^\circ$ everywhere. So *any* proportional-only loop around it crosses over at the worst possible slope. The derivative term adds a zero, which lifts the slope to $-20$ and the phase toward $-90^\circ$ around crossover. The PD controller's phase contribution is

$$\arctan\!\left(\frac{k_d\omega}{k_p}\right),$$

rising from $0^\circ$ at low frequency toward $+90^\circ$ at high frequency. (The **[[arctangent|arctangent]]**, "arctan", turns a ratio back into an angle.) The whole of the phase margin on that loop is that **lead** — phase pushed earlier, the opposite of lag.

::: key
For a minimum-phase loop, a magnitude slope of $-20\,\mathrm{dB}$/decade at crossover corresponds to roughly $-90^\circ$ of phase and $-40\,\mathrm{dB}$/decade to roughly $-180^\circ$, so designs aim to cross over at $-20$. A double integrator is $-40\,\mathrm{dB}$/decade at every frequency, which is why proportional-only feedback around it has zero phase margin, and why the PD zero — contributing $\arctan(k_d\omega/k_p)$ of lead — is what creates the margin.
:::

::: example "What does phase margin mean physically?"
**Weak answer:** "Phase margin is the amount of phase you can add before the system becomes unstable. You read it off the Bode plot at the frequency where the gain is 0 dB — it is 180 degrees plus the phase there. You generally want at least 30 to 45 degrees."

**Strong answer:**

"I will state the assumption, give the definition, then say what it means physically and check it against something.

Assumption: a loop that is open-loop stable and minimum-phase, so the Nyquist criterion wants zero encirclements of minus one and the margins read off the Bode plot mean what they appear to. For a plant with a right-half-plane pole that reading is not valid.

Definition: take the loop transfer function — controller times plant, open loop. Find the gain crossover frequency, where the magnitude passes through one. The phase margin is 180 degrees plus the loop phase there; equivalently, the extra phase lag you could add at that frequency before the loop sits exactly at marginal stability.

Physically, the thing that adds phase lag without adding gain is a time delay. A pure delay of $T$ seconds contributes minus omega $T$ radians of phase and leaves the magnitude alone. So the phase margin in radians, divided by the crossover frequency, is the largest pure delay the loop tolerates. It is a budget for everything I did not model: the computation delay between reading the gyro and commanding the actuator, the hold's half-sample delay, the actuator's own response, the anti-aliasing filter.

Sanity check with a typical value. Sixty degrees is about 1.05 radians. On a slow spacecraft attitude loop crossing over near 1 radian per second, that is about a second of tolerable delay — enormous, so delay is a non-issue. On a launch vehicle rate loop crossing over near 30 radians per second, the same 60 degrees is about 35 milliseconds, the same order as the computation and filtering delays actually present. Same margin, completely different engineering problem, and that is the point of expressing it in time."

**What makes the difference.** The weak answer is a correct definition and nothing else. It would pass a written exam and fail the follow-up, *yes, but what does that mean on a vehicle?* Degrees alone connect to nothing an engineer can measure or trade.

The strong answer, in about three minutes, states the assumption, defines, converts to seconds of tolerable lag, and runs the conversion on two real systems differing by a factor of thirty. That comparison shows the candidate knows what the angle costs in time.

**Sanity check:** $60^\circ \approx 1.047$ rad; $1.047/1 \approx 1.05$ s and $1.047/30 \approx 0.035$ s. Their ratio is 30, the ratio of the crossover frequencies, as it should be.
:::

::: example Estimating crossover and phase margin in your head
Take the loop from the previous lesson: $J = 120\,\mathrm{kg\,m^2}$, $k_p = 30\,\mathrm{N\,m/rad}$, $k_d = 84\,\mathrm{N\,m\,s/rad}$, so

$$L(s) = \frac{k_p + k_d s}{Js^2}$$

**Interviewer:** Roughly where does that cross over, and what is the phase margin?

Solving $|L(j\omega)| = 1$ exactly means a fourth-power equation — not something to do out loud. Estimate instead.

"Near crossover the derivative term is the bigger one. The zero is at $k_p/k_d$, about 0.36 radians per second, so above that the top is dominated by $k_d\omega$. The magnitude is then about $k_d\omega/(J\omega^2) = k_d/(J\omega)$, which equals one when $\omega \approx k_d/J$. That is $84/120$, about 0.7 radians per second.

Phase: the plant gives a flat minus 180 degrees, and the controller gives $\arctan(k_d\omega/k_p)$ of lead. At 0.7 that is $\arctan(84 \times 0.7/30)$. Now $84 \times 0.7 = 58.8$, and $58.8/30 = 1.96$, so the arctangent is about 63 degrees. The phase at crossover is about minus 117 degrees, and the phase margin about 63 degrees.

Two checks. Damping ratio is roughly phase margin over one hundred, so about 0.63; I designed this loop for $\zeta = 0.7$ — consistent, and the small shortfall is because my crossover estimate was low. And in time: 63 degrees is about 1.1 radians, over 0.7 radians per second, roughly one and a half seconds of tolerable delay. For a reaction-wheel loop, delay will never be the binding constraint."

**How good is the estimate?** Solved exactly, the crossover is at $0.771\,\mathrm{rad/s}$ and the phase margin is $65.2^\circ$, against the estimated $0.7$ and $63^\circ$. The estimate is low by about nine percent in frequency and two degrees in margin — far better than anyone needs on a phone call, from two divisions and an arctangent. And $65.2^\circ$ matches the exact $65^\circ$ quoted for $\zeta = 0.7$ earlier, so the two sections agree.

**What makes this worth practicing.** The move is spotting which term dominates at the frequency you care about and dropping the other — the general technique without a plot: find the region, keep the dominant term, estimate, say how far off you expect to be. And the last line converts the margin into seconds and says whether it matters. Stopping at "63 degrees" answers the question; one more step answers the question behind it.
:::

## Gain margin, and when it lies

Gain margin is the simpler number and the less informative one. The PD loop above has no finite gain margin at all. Its phase is $-180^\circ + \arctan(k_d\omega/k_p)$, which is strictly above $-180^\circ$ at every positive frequency. The phase never crosses, so the gain margin is infinite.

That sounds wonderful and means little: it is a quirk of the model. Add a computation delay, an actuator lag, or a lightly damped structural mode above crossover, and the phase does cross $-180^\circ$, so the gain margin becomes finite and may be small. Infinite gain margin in an idealized model describes the model, not the vehicle.

A better single number, worth having for a follow-up: the shortest distance from the $-1$ point to the curve of $L(j\omega)$ (the **Nyquist curve**). Its reciprocal is the peak of the **[[sensitivity function|sensitivity-peak]]**. Unlike either classical margin, it cannot look good for a loop that passes close to $-1$. So do adequate gain and phase margins guarantee robustness? Not on their own: a loop can skirt the critical point while satisfying both.

## Check yourself

::: check
Define gain crossover frequency, phase crossover frequency, phase margin and gain margin, and state the assumption under which reading the two margins off a Bode plot is valid.
:::

::: answer
All four belong to the loop transfer function $L(s) = C(s)G(s)$, the open-loop product of controller and plant.

- Gain crossover frequency $\omega_c$: where $|L(j\omega)| = 1$.
- Phase crossover frequency $\omega_{180}$: where $\angle L(j\omega) = -180^\circ$.
- Phase margin: $180^\circ + \angle L(j\omega_c)$, the extra lag at crossover that would produce marginal stability.
- Gain margin: $1/|L(j\omega_{180})|$, the factor the gain could be multiplied by at that frequency before the same thing happened.

The reading is valid for an open-loop stable, minimum-phase loop, where the Nyquist criterion requires zero encirclements of $-1$. With a right-half-plane pole the closed loop requires an encirclement, and the plain reading can be badly misleading.
:::

::: check
A rate loop crosses over at $30\,\mathrm{rad/s}$ with $60^\circ$ of phase margin. A software change adds 20 ms of computation delay. What is left?
:::

::: answer
A pure delay adds $-\omega T$ radians of phase at frequency $\omega$. At crossover that is $30 \times 0.02 = 0.6$ radians. Convert: $0.6 \times 180/\pi \approx 34$ degrees. The remaining phase margin is $60 - 34 = 26$ degrees.

The change used more than half the budget and left the loop below the usual $30^\circ$ floor. The same 20 ms at a 1 rad/s crossover would cost 0.02 radians, a little over one degree. A delay's cost scales with crossover frequency, which is why phase margin must be turned into time before it can be traded.
:::

::: check
Explain why a double integrator under pure proportional control has zero phase margin, using the gain–phase relationship rather than the pole locations.
:::

::: answer
The magnitude of $1/(Js^2)$ falls at $-40\,\mathrm{dB}$ per decade at every frequency. For a minimum-phase system a steady $-40\,\mathrm{dB}$ per decade goes with about $-180^\circ$ of phase, and here it is exactly $-180^\circ$ at all frequencies.

A proportional gain is a constant: it slides the magnitude curve up or down, moving crossover, but adds no phase. So whatever the gain, phase at crossover is $-180^\circ$ and the margin is zero — the frequency-domain version of the last lesson's fact that the poles sit on the imaginary axis for every gain.
:::

::: check
A candidate reports that their loop has infinite gain margin and concludes it is very robust. What is wrong with the conclusion?
:::

::: answer
Infinite gain margin only means that, in the model as written, the phase never reaches $-180^\circ$ — common in idealized loops such as PD on a double integrator. It is a property of the model, not the vehicle.

Anything the model leaves out — computation delay, the hold, actuator dynamics, a lightly damped structural mode above crossover — adds lag that grows with frequency and will bring the phase across $-180^\circ$. Then the gain margin is finite and may be small. A robust conclusion needs those dynamics included. A better single number is the shortest distance from the Nyquist curve to $-1$, whose reciprocal is the peak sensitivity.
:::

::: check
You are told a loop has $45^\circ$ of phase margin. Estimate the closed-loop damping ratio and say what you would expect the step response to look like.
:::

::: answer
Damping ratio is roughly phase margin in degrees over one hundred, so $\zeta \approx 0.45$. That fits the exact values for the standard second-order loop, where 0.5 goes with about $52^\circ$ and 0.3 with about $33^\circ$ — and $45^\circ$ sits between them.

Near 0.45, a step response overshoots noticeably and rings for a couple of cycles before settling.

Two caveats: the approximation is for the standard second-order loop and degrades for higher-order or lightly damped systems; and if the command path carries a zero — as PD acting on the error does — the overshoot will exceed what the damping ratio suggests.
:::

::: check
Why is the tolerable delay budget the thing to quote rather than the phase margin itself, when discussing a specific vehicle?
:::

::: answer
Because degrees cannot be compared across loops of different bandwidth, and engineers trade time. The same $60^\circ$ is about a second of tolerable delay in a loop crossing over near 1 rad/s, and about 35 milliseconds in one crossing over near 30 rad/s.

In the first, delay is irrelevant. In the second, it is the same order as the real computation, hold and filter delays, and must be budgeted. In time, the margin is directly comparable with delays you can measure — a design constraint, not a number on a plot.
:::

## Summary

| Quantity | Definition | Note |
| --- | --- | --- |
| Loop transfer function | $L(s) = C(s)G(s)$, open loop | Not the closed-loop function; say which you mean |
| Gain crossover $\omega_c$ | $\lvert L(j\omega_c)\rvert = 1$ | Approximately the closed-loop bandwidth |
| Phase crossover $\omega_{180}$ | $\angle L = -180^\circ$ | May not exist for a simple loop |
| Phase margin | $180^\circ + \angle L(j\omega_c)$ | Extra lag at $\omega_c$ giving marginal stability |
| Gain margin | $1/\lvert L(j\omega_{180})\rvert$ | Infinite in idealized models; finite once lag is added |
| Tolerable delay | $T_{\max} = \mathrm{PM}\,[\text{rad}]/\omega_c$ | The physical reading of phase margin |
| Damping estimate | $\zeta \approx \mathrm{PM}[^\circ]/100$ | Good to about $60^\circ$–$70^\circ$ |
| Slope at crossover | $-20\,\mathrm{dB}$/decade $\to$ about $-90^\circ$ | $-40$ gives about $-180^\circ$, zero margin |
| Common design targets | $30^\circ$–$60^\circ$ PM, about 6 dB GM | Practice convention, not any employer's requirement |

The next lesson takes the third reported topic — orbit determination — where the question is less about a formula and more about knowing which method matches which set of observations.

::: context sine-lag Same wiggle, arriving late
Push a wiggle into a system and, once it settles, the same wiggle comes out — bigger or smaller, and shifted later. The shift, as a fraction of one full cycle, is the phase lag: a quarter cycle late is $90^\circ$, half a cycle is $180^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20,75 C40,15 80,15 100,75 C120,135 160,135 180,75 C200,15 240,15 260,75 C280,135 320,135 340,75" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M60,75 C80,35 120,35 140,75 C160,115 200,115 220,75 C240,35 280,35 300,75 C310,95 320,105 330,110" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="60" y1="24" x2="100" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="18" x2="60" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="18" x2="100" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="13" font-size="11" text-anchor="middle" fill="#1f2a44">lag: 1/4 cycle</text>
  <text x="24" y="145" font-size="11" fill="#1d6fd1">in</text>
  <text x="196" y="145" font-size="11" fill="#b4232c">out: smaller, 90° late</text>
</svg>
```

The peaks are a quarter of a cycle apart, so this output lags by $90^\circ$.
:::

::: context bode-plot The loop from the last lesson, drawn
Here is the real Bode plot of the PD loop $L(s) = (30 + 84s)/(120s^2)$ from 0.1 to 10 rad/s. The top curve is the gain in dB; the bottom is the phase. Where the gain crosses 0 dB (about 0.77 rad/s), read the phase: about $-115^\circ$, which is $65^\circ$ above $-180^\circ$. That gap is the phase margin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="65" x2="330" y2="65" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="46" y="69" font-size="11" text-anchor="end" fill="#1f2a44">0 dB</text>
  <polyline points="50.0,22.6 64.0,28.3 78.0,33.9 92.0,39.3 106.0,44.4 120.0,49.3 134.0,53.8 148.0,58.0 162.0,61.8 176.0,65.4 190.0,68.9 204.0,72.1 218.0,75.3 232.0,78.4 246.0,81.5 260.0,84.6 274.0,87.6 288.0,90.6 302.0,93.6 316.0,96.6 330.0,99.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="50" y1="205" x2="330" y2="205" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="50" y1="135" x2="330" y2="135" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="46" y="209" font-size="11" text-anchor="end" fill="#1f2a44">−180°</text>
  <text x="46" y="139" font-size="11" text-anchor="end" fill="#1f2a44">−90°</text>
  <polyline points="50.0,192.8 64.0,189.9 78.0,186.4 92.0,182.3 106.0,177.7 120.0,172.7 134.0,167.6 148.0,162.6 162.0,158.0 176.0,153.8 190.0,150.3 204.0,147.3 218.0,144.9 232.0,142.9 246.0,141.3 260.0,140.0 274.0,139.0 288.0,138.2 302.0,137.5 316.0,137.0 330.0,136.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="174" y1="65" x2="174" y2="154" stroke="#1f2a44" stroke-width="1"/>
  <line x1="174" y1="154" x2="174" y2="205" stroke="#b4232c" stroke-width="3"/>
  <text x="182" y="186" font-size="12" fill="#b4232c">PM ≈ 65°</text>
  <text x="178" y="58" font-size="11" fill="#1f2a44">ωc ≈ 0.77</text>
  <text x="50" y="118" font-size="11" fill="#6c7a93">0.1</text>
  <text x="190" y="118" font-size="11" fill="#6c7a93">1</text>
  <text x="340" y="118" font-size="11" text-anchor="end" fill="#6c7a93">10 rad/s</text>
</svg>
```

Notice the top curve steepens toward $-40$ dB/decade at the far left and eases to $-20$ at the right, while the phase climbs from near $-180^\circ$ toward $-90^\circ$ — Bode's slope rule, visible.
:::

::: context decibels Counting gain in decibels
A **decibel** turns multiplying into adding. A gain $K$ in decibels is $20\log_{10}K$. A factor of 10 is $+20$ dB, a factor of 2 is about $+6$ dB, a factor of 1 is 0 dB, and a factor of one half is about $-6$ dB. Because loop gains multiply around a loop, their decibels add, which makes a Bode plot easy to build and read by hand. The name honors Alexander Graham Bell; the same unit measures sound loudness.
:::

::: context minimum-phase Balancing a broomstick
Most plants settle on their own if left alone. Some do not. A broomstick balanced on your palm falls if you stop moving your hand; engineers call that an **unstable** plant, and its runaway shows up as a pole in the right half of the $s$-plane. Rockets with the center of pressure ahead of the center of mass behave a little like this in the atmosphere. **Minimum-phase** means no poles or zeros on that right-hand side. For such plants the simple margin rules can mislead, so always say which case you are in.
:::

::: context anti-aliasing Why sensors are filtered before sampling
A computer sees a sensor only at sample instants. A wiggle faster than half the sampling rate cannot be told apart from a slower one — it **aliases**, the way a spinning wheel in a film can look like it is turning backward. So sensors pass through an **anti-aliasing filter** that removes fast content before sampling. The filter is necessary, and it also delays the signal a little, spending some of the loop's phase margin.
:::

::: context franklin-powell The standard textbook
*Feedback Control of Dynamic Systems* by Gene Franklin, J. David Powell and Abbas Emami-Naeini is a widely used undergraduate control textbook and this module's recommended reading for PD structure and frequency-domain basics. It covers Bode plots, margins, the Nyquist criterion and the phase-margin–damping link at about the depth a phone screen reaches. When you quote a "typical" margin target, this is the sort of source it comes from: engineering convention, not a law.
:::

::: context bode-history Where the slope rule comes from
Hendrik Bode worked on telephone amplifiers at Bell Telephone Laboratories in the 1930s and 1940s, when feedback was new and amplifiers kept breaking into oscillation. He showed that for minimum-phase systems the gain curve and the phase curve are not independent: know one and you know the other. The rule of thumb that each $-20$ dB per decade of slope brings about $-90^\circ$ of phase is the everyday form of that result, and it is why a control engineer can read stability off the shape of a gain curve.
:::

::: context arctangent Turning a ratio into an angle
Draw a right triangle with a flat side of $k_p$ and an upright side of $k_d\omega$. The angle at the corner where the flat side starts is $\arctan(k_d\omega/k_p)$. For the worked loop at $\omega = 0.7$: sides $30$ and $58.8$, ratio $1.96$, angle about $63^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="120,135 180,135 180,17.4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="170" y="125" width="10" height="10" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <path d="M140,135 A20,20 0 0,0 129.1,117.2" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="150" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">k_p = 30</text>
  <text x="188" y="80" font-size="11" fill="#1f2a44">k_d ω = 58.8</text>
  <text x="96" y="118" font-size="11" text-anchor="end" fill="#b4232c">about 63°</text>
</svg>
```

As $\omega$ grows the upright side grows and the angle creeps toward $90^\circ$; at $\omega = 0$ it is $0^\circ$.
:::

::: context sensitivity-peak One number for how close you came
Plot $L(j\omega)$ as a curve in the complex plane and mark the point $-1$. Stability trouble lives at that point. The **sensitivity function** $S = 1/(1 + L)$ says how much the loop amplifies disturbances at each frequency, and $|1 + L|$ is exactly the distance from the curve to $-1$. So the peak of $|S|$ is one over the closest approach. A common rule of thumb keeps that peak below about 2, meaning the curve never comes closer than one half to $-1$.
:::
