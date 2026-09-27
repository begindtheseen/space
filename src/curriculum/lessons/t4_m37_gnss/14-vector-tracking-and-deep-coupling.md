---
id: l14-vector-tracking-and-deep-coupling
title: Vector tracking and deep coupling
minutes: 23
covers:
  - Vector tracking and deep coupling
---

Picture eight friends crossing a dark field in a line, holding hands. One of them has lost her flashlight and can barely see. On her own she would wander off. But she does not need to see: the others can, and they are holding her hand. Wherever the line goes, she goes. Now add a ninth friend walking behind with her eyes shut, counting steps and feeling every turn. She cannot see anything, yet she knows how the group is moving — and she keeps knowing it even when every flashlight goes out.

Every receiver in this module so far has worked like eight friends walking *alone*. It runs one separate tracking loop per satellite per signal. Each loop sees only its own satellite and knows nothing about the others, or about any other sensor on the vehicle. That independence is simple, and most of the time it is good enough. But it throws away real information. Eight satellites give eight noisy views of the *same* position, velocity and clock. And a vehicle carrying an **[[inertial measurement unit|imu]]** (IMU) — the box of accelerometers and gyroscopes that feels the vehicle's motion — has a ninth view that owes nothing to radio at all.

This lesson ends the module by joining all of it into one estimator. It then shows, in numbers, what that buys against the threats the module has raised: weak signals, hard dynamics, and a search too wide to do blindly after the signal is lost.

## One filter instead of many loops: vector tracking

A conventional receiver is called a **[[scalar|scalar-vector]]** receiver. It runs $n$ separate loops — DLL, PLL or FLL — and each one closes its own circle, from its own discriminator, through its own loop filter, to its own NCO.

**Vector tracking** replaces those $n$ loop filters with **[[one shared filter|vector-diagram]]**. In practice that filter is a Kalman filter, the same machinery the Kalman filtering module builds. It works like this:

1. Every channel still runs its correlators and its discriminator. Each discriminator output — "my replica is this far off" — goes to the central filter as a measurement.
2. The filter estimates the whole navigation state from all of them at once: position, velocity, and the receiver clock's bias and drift.
3. From that one estimate, the filter predicts where *every* satellite's code and carrier should be, and sends those predictions out as commands to each channel's NCO.

No channel closes its own loop any more. Every channel is steered by the shared estimate.

How does one state give every satellite's replica? Through the pseudorange equation. The predicted pseudorange to satellite $i$ is $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + b$: the distance from the estimated receiver position $\mathbf{x}$ to the satellite position $\mathbf{s}_i$, plus the clock bias $b$ in meters. That sets the code NCO. For the carrier NCO, the filter predicts the range rate — how fast that distance is changing:

$$
\dot\rho_i = \mathbf{e}_i \cdot (\mathbf{v}_{s,i} - \mathbf{v}) + \dot b.
$$

Here $\mathbf{e}_i$ is the unit vector from the receiver toward satellite $i$, $\mathbf{v}_{s,i}$ is the satellite's velocity, $\mathbf{v}$ is the receiver's velocity, and $\dot b$ (read "b dot") is the clock drift in meters per second. The dot "$\cdot$" is the **[[dot product|range-rate]]**: it keeps only the part of the relative velocity that points along the line of sight. The Doppler is then $f_d = -\dot\rho_i/\lambda$, as in the launch-vehicle lesson.

This is the same geometry as the navigation-solution lesson's Jacobian row $[-\mathbf{e}_i^{\mathsf T},\ 1]$. The filter uses it in both directions: to turn each channel's error into a correction of the shared state, and to turn the shared state into each channel's command.

::: example Steering a weak channel from the shared estimate
A receiver tracks eight satellites. Satellite $5$ is weak — too weak for its own PLL to hold. The filter's velocity estimate, built from the other seven, is good to about $0.05\,\mathrm{m/s}$ along each direction. The line of sight to satellite $5$ is $\mathbf{e} = (0.48,\ 0.60,\ 0.64)$. The satellite's velocity minus the receiver's is $(-1200,\ 2500,\ -900)\,\mathrm{m/s}$, and the clock drift is $\dot b = 30\,\mathrm{m/s}$. What Doppler does the filter command, and how good is it?

**Step 1: check $\mathbf{e}$ is a unit vector.** $0.48^2 + 0.60^2 + 0.64^2 = 0.2304 + 0.36 + 0.4096 = 1$. Good.

**Step 2: the dot product.** Multiply matching parts and add:

$$
0.48 \times (-1200) + 0.60 \times 2500 + 0.64 \times (-900) = -576 + 1500 - 576 = 348\,\mathrm{m/s}.
$$

**Step 3: add the clock drift.** $\dot\rho = 348 + 30 = 378\,\mathrm{m/s}$. The range is growing.

**Step 4: turn it into Doppler.** $f_d = -378/0.1903 = -1986\,\mathrm{Hz}$. The minus sign means the frequency is lowered, as it should be for a satellite moving away.

**Step 5: how good is the command?** A $0.05\,\mathrm{m/s}$ error along the line of sight becomes a Doppler error of $0.05/0.1903 = 0.26\,\mathrm{Hz}$.

**What it means.** The weak channel is handed its Doppler to about a quarter of a hertz, borrowed from seven other satellites. Its own noisy discriminator only has to nudge that. **Sanity check:** $1986\,\mathrm{Hz}$ is a typical GPS Doppler (a few kilohertz at most for a ground user), and a quarter-hertz is far finer than the few hundred hertz an acquisition search starts from.
:::

This changes what a weak channel needs to survive. A scalar PLL on a weak signal still produces a discriminator reading. The reading is noisy, but it is not worthless. Alone, the loop cannot hold on to it. Inside a vector filter, that noisy reading is weighed together with seven stronger channels and a model of how the vehicle moves. The filter keeps predicting where the weak satellite's code and carrier *should* be and keeps steering its NCO there. The weak channel rides on the strong ones, like the friend without a flashlight.

Studies of vector tracking consistently report **[[several decibels|decibel-gain]]** of extra tracking sensitivity from this alone: the receiver can keep tracking signals that much weaker. A scalar loop, however well designed, cannot reach that, because it never sees any other channel's information.

::: key
Vector tracking: one Kalman filter (the Kalman filtering module's machinery) takes every channel's discriminator output as a measurement and feeds predicted code and carrier commands back to every NCO, replacing $n$ independent loops with one shared estimate. A channel too weak to close its own scalar loop can still be held by the filter, using the other channels' strength and the dynamics model — several decibels of tracking sensitivity a scalar architecture cannot reach.
:::

## Deep coupling: help from the inertial side

**Deep coupling** (also called **ultra-tight coupling**) adds the ninth friend. The same filter now takes in the IMU's measurements too. It estimates the IMU's own errors — its **bias** (a constant offset in each reading) and **scale factor** (a small percentage error) — alongside position, velocity and clock. This is the **[[error-state|error-state]]** design the Kalman filtering module builds for an inertial navigator. The difference is that the inertial solution now shares its estimate with every GNSS tracking channel, instead of only receiving GNSS fixes as outside corrections.

The payoff is a fact this module has stated since the tracking-loop lesson: *inertial aiding removes the dynamics instead* of making the loop wider to chase them.

Recall that lesson's result. A third-order PLL facing a sustained jerk settles at an error $\theta_e = J/\omega_n^3$. The staging transient gave $J = 4317\,\mathrm{rad/s^3}$, which means $247^\circ$ of error at a low-noise $\omega_n = 10\,\mathrm{rad/s}$, far past any lock limit.

An aided loop is not tracking that jerk at all. The inertial navigator already predicts the vehicle's acceleration from its accelerometers. Feeding that prediction forward to every NCO moves each replica *with* the vehicle. The loop's job shrinks to closing the gap between the true motion and the inertial prediction of it. For a decent IMU, that gap is the sensor's own error, not the vehicle's motion.

And here is the key step. An accelerometer's bias is nearly constant over the fraction of a second a tracking loop cares about. A constant acceleration error has **zero jerk**. A third-order loop follows a constant acceleration — a constant Doppler rate — with *zero* steady-state error. Not a smaller error: none.

What jerk is left comes only from the bias slowly wandering, its **[[bias instability|bias-instability]]**. That is typically a small fraction of the bias itself over a second:

```python
import numpy as np

g0, lam = 9.80665, 0.1903
bias_tactical = 1.0e-3 * g0            # tactical-grade accelerometer bias, 1 mg
instability_frac_per_s = 0.01           # representative short-term instability, 1%/s
residual_jerk_accel = bias_tactical * instability_frac_per_s
J_res = 2 * np.pi * (residual_jerk_accel / lam)
for omega_n in (10, 15, 20):
    print(omega_n, round(np.degrees(J_res / omega_n**3), 6))
# 10 0.000186
# 15 5.5e-05
# 20 2.3e-05
```

Read it line by line. A **[[1 mg|milli-g]]** bias is $0.001 \times 9.80665 = 0.0098\,\mathrm{m/s^2}$. If it wanders by $1\%$ of itself per second, the leftover jerk is about $0.0001\,\mathrm{m/s^3}$. Dividing by the wavelength and multiplying by $2\pi$ gives $J \approx 0.0032\,\mathrm{rad/s^3}$, more than a million times smaller than the staging jerk. At $\omega_n = 10\,\mathrm{rad/s}$ the error is under two ten-thousandths of a degree.

Against the $247^\circ$ the same loop suffered unaided, that is nothing. The narrow bandwidth that the tracking-loop trade allowed only under gentle motion becomes safe again. The vehicle's motion did not change. The loop just stopped being the thing fighting it.

::: example The trade the last lesson could not solve
The tracking-loop lesson found that at $C/N_0 = 25\,\mathrm{dB\text{-}Hz}$, with $T = 20\,\mathrm{ms}$, no bandwidth survives the staging jerk. The best it managed was about $58^\circ$ against the $45^\circ$ rule $3\sigma_{\mathrm{PLL}} + \theta_e \le 45^\circ$. Now aid the loop.

**Step 1: pick a narrow loop.** Take $\omega_n = 10\,\mathrm{rad/s}$, so $B_n \approx 0.78 \times 10 \approx 7.8\,\mathrm{Hz}$.

**Step 2: its thermal jitter.** From the PLL formula at $25\,\mathrm{dB\text{-}Hz}$ (a ratio of $10^{2.5} \approx 316$), $\sigma_{\mathrm{PLL}} = 9.37^\circ$. Three times that is $28.1^\circ$.

**Step 3: its dynamic error.** With aiding, $\theta_e$ is the residual from the code above, about $0.0002^\circ$.

**Step 4: add.** $28.1^\circ + 0.0002^\circ \approx 28.1^\circ$, well under $45^\circ$. The loop holds.

**Going further.** With the dynamics gone, the loop can be narrowed even more. At $B_n = 3\,\mathrm{Hz}$, the same formula gives $3\sigma_{\mathrm{PLL}} = 33.3^\circ$ at $20\,\mathrm{dB\text{-}Hz}$. That is a signal $5\,\mathrm{dB}$ weaker than the one no unaided loop could hold.

**Sanity check.** Unaided, the jerk term was the whole problem: $247^\circ$ at this bandwidth. Aided, only the noise term is left, and a narrow loop has little noise. The trade from the tracking-loop lesson has not vanished. It is now paid almost entirely from the inertial sensor's error budget instead of the loop's noise budget. That is exactly why a vehicle facing these dynamics carries an IMU good enough to make the deal worth it.
:::

::: key
Dynamic stress on a tracking loop: widening the bandwidth admits more noise; inertial aiding removes the dynamics instead, which is why deep coupling exists. With deep coupling the loop sees only the inertial prediction's error. A constant accelerometer bias has zero jerk, so a third-order loop tracks it with zero steady-state error, and only the bias's own instability leaves any residual.
:::

## Reacquisition, aided

Sometimes lock is lost anyway: the plume blocks the antenna, or an antenna switch interrupts the signal. The space-based and launch-vehicle lessons showed what that costs. To find a signal again, the receiver searches over possible Doppler values and code delays. A wider window takes longer, in direct proportion. And the window has to cover everything the vehicle *might* have done while the signal was gone.

The launch-vehicle lesson gave the extra Doppler width from an unknown acceleration $\delta a$ over an outage of length $\Delta t$:

$$
\delta f_d = \frac{\delta a\,\Delta t}{\lambda}.
$$

With no independent estimate, $\delta a$ must cover the whole range of what the engines could have been doing — for a launch vehicle, as much as $4g_0$. With deep coupling, the inertial navigator kept predicting velocity through the whole outage from its own measurements. Then $\delta a$ is only the inertial solution's own error: the accelerometer bias, set by the sensor's grade and not by the vehicle's motion.

::: example An eight-second gap, searched cold and searched aided
The signal is gone for $\Delta t = 8\,\mathrm{s}$ on L1 ($\lambda = 0.1903\,\mathrm{m}$). Unaided, take $\delta a = 4g_0$. Aided by a tactical-grade IMU, take $\delta a = 1\,\mathrm{mg}$, its bias.

**The Doppler search.** Unaided:

$$
\delta f_{d} = \frac{4\times9.80665\times8}{0.1903} = 1649\,\mathrm{Hz}.
$$

Aided:

$$
\delta f_{d} = \frac{0.001\times9.80665\times8}{0.1903} = 0.41\,\mathrm{Hz}.
$$

That is $1649/0.41$, about $4000$ times narrower — exactly the ratio of the two accelerations, $4\,g_0$ against $0.001\,g_0$, since everything else is the same.

**The code search.** The same unknown acceleration also moves the position, by $\tfrac12\,\delta a\,\Delta t^2$. Unaided:

$$
\tfrac12 \times 4 \times 9.80665 \times 8^2 = 1255\,\mathrm{m},
$$

about $4.3$ chips of C/A code at $293.05\,\mathrm{m}$ per chip. Aided, the same formula with $0.001\,g_0$ gives $0.31\,\mathrm{m}$, about a thousandth of a chip.

**What it means.** The thing that sets the search width changed from "anything the engines could have done" to "how far a tactical-grade accelerometer's bias carries you in eight seconds". An aided receiver often has to search only **[[a single cell|search-grid]]**. **Sanity check:** the unaided Doppler window here matches the size of the launch-vehicle lesson's $515\,\mathrm{Hz}$ for $2g_0$ over $5\,\mathrm{s}$, scaled by $2 \times 1.6 = 3.2$: $515 \times 3.2 = 1648$. It agrees.
:::

This is deep coupling's second payoff, separate from holding lock longer. When lock is lost anyway, the receiver finds the signal again in a search space thousands of times smaller than a cold start faces.

::: key
Deep coupling shares one error-state filter between the inertial navigator and every GNSS tracking channel. It removes vehicle dynamics from the tracking loop's own burden, so a low-noise bandwidth survives dynamics that would otherwise demand a much wider one. And it shrinks the post-outage search, $\delta f_d = \delta a\,\Delta t/\lambda$, from the full dynamics envelope down to the inertial sensor's own error — orders of magnitude for a decent tactical-grade unit.
:::

## What deep coupling costs

None of this is free. It helps to see the three levels of joining GNSS and inertial navigation, the **[[coupling ladder|coupling-ladder]]**:

- **Loosely coupled:** the receiver computes its own position fix, and the navigation filter takes that fix as one measurement — the way the inertial navigation module's filter uses GNSS.
- **Tightly coupled:** the filter takes each satellite's pseudorange and Doppler separately, so it can still use two or three satellites when a full fix is impossible.
- **Deeply coupled:** the filter reaches all the way down into the tracking loops, as this lesson describes.

A loosely coupled design keeps a clean wall between the two systems. A bad GNSS fix can be rejected, down-weighted or ignored by the outer filter without touching the inertial solution. Deep coupling knocks that wall down on purpose. That is exactly what buys the gains above, and it is also the cost.

::: warning Deep coupling is not simply a better loose coupling
Knocking down the wall between GNSS and inertial estimation has a price. The integrity lesson's slope analysis showed that some faults barely move the residual that a consistency test watches. In a loosely coupled system, such a fault corrupts a position fix, and the vehicle can fall back on its inertial solution to override it. In a deeply coupled system, the same fault can work its way into the shared state that the inertial solution itself now depends on. So a deeply coupled system needs its own integrity monitoring, designed with the coupling in mind — not the RAIM built for a standalone fix. It also needs tight, well-measured **[[time synchronization|time-sync]]** between the inertial measurements and the GNSS observables, or it combines them wrongly.
:::

The complexity is real. So is the payoff, for a vehicle that actually faces the dynamics, weak signals and outages this module has spent fourteen lessons putting numbers on.

## Check yourself

::: check
What does a vector-tracking architecture change about how a weak satellite's channel is tracked, compared with a scalar architecture?
:::

::: answer
In a scalar receiver, each channel closes its own feedback loop, from its own discriminator to its own NCO. A channel too weak to give a reliable discriminator output on its own cannot hold lock — nothing else can help it. In vector tracking, every channel's discriminator output is a measurement into one shared filter, which also has every other, stronger channel's information and a model of the motion. The filter's combined estimate, not the weak channel alone, drives that channel's NCO. So the channel can be held at a signal level a standalone scalar loop could never track.
:::

::: check
A third-order PLL, unaided, sees a jerk of $J = 3000\,\mathrm{rad/s^3}$ at $\omega_n = 12\,\mathrm{rad/s}$. With deep coupling, the jerk left over after inertial aiding falls to $J = 0.01\,\mathrm{rad/s^3}$. Compute the steady-state phase error in both cases.
:::

::: answer
First $\omega_n^3 = 12^3 = 1728$. Unaided: $\theta_e = 3000/1728 = 1.736\,\mathrm{rad}$, which is $99.5^\circ$ — past the $\pm 90^\circ$ a Costas loop can hold. Aided: $\theta_e = 0.01/1728 = 5.8 \times 10^{-6}\,\mathrm{rad}$, which is $0.00033^\circ$. Same loop, same bandwidth. The whole difference is how much of the true motion the loop is still asked to fight.
:::

::: check
An accelerometer bias left uncorrected is a real, nonzero error in the motion the loop is fed. Why can a third-order loop still track it with zero steady-state error?
:::

::: answer
A loop's steady-state error depends on which derivative of the input is constant, compared with the loop's order. A third-order loop follows any input up to and including a constant *acceleration* (a constant Doppler rate) with zero lasting error, because it has enough integrators to learn it exactly. Only jerk, the next derivative, leaves an error. A perfectly constant bias has zero jerk, so there is nothing for the loop to lag behind. Only the bias's instability — how far it strays from constant — adds any jerk, and that is far smaller than the bias itself.
:::

::: check
The formula $\delta f_d = \delta a\,\Delta t/\lambda$ is the same with or without deep coupling. Why, then, does deep coupling narrow a post-outage Doppler search by orders of magnitude?
:::

::: answer
The formula does not change; what changes is which $\delta a$ goes into it. Without an independent estimate, the receiver must search over the whole range of acceleration the vehicle might have had during the outage — possibly several $g$. With deep coupling, the inertial navigator kept predicting velocity through the outage, so the only unknown left is how far that prediction drifted, set by the accelerometer's bias and not by anything the engines did. For a decent sensor that is three to four orders of magnitude smaller in $\delta a$, and so the same factor smaller in search width.
:::

::: check
What is the main integrity risk deep coupling brings that a loosely coupled design does not have, and why does it matter given the integrity lesson's slope analysis?
:::

::: answer
In a loosely coupled system, a bad GNSS fix is one more input to an outer filter, which can down-weight, reject or ignore it while the inertial solution carries on independently — a clean wall. Deep coupling removes that wall by design, folding the GNSS measurements into the same state the inertial solution depends on. The slope analysis showed that some faults make little or no residual, so ordinary consistency checks cannot catch them. Under deep coupling, such a fault is no longer confined to a position fix the vehicle could override with inertial navigation. It can corrupt the shared state that the inertial solution itself is built from.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Scalar tracking | One independent loop per channel | Each discriminator drives only its own NCO |
| Vector tracking | One shared Kalman filter for all channels | Every discriminator is a measurement; every NCO is steered from the shared estimate |
| Predicted range rate | Sets each carrier NCO | $\dot\rho_i = \mathbf{e}_i\cdot(\mathbf{v}_{s,i}-\mathbf{v}) + \dot b$, $f_d = -\dot\rho_i/\lambda$ |
| Weak-signal benefit | A weak channel rides on strong ones | Several dB of extra sensitivity |
| Deep coupling | Vector tracking plus the IMU in one error-state filter | Inertial prediction removes the vehicle's motion from the loop's burden |
| Dynamic stress, aided | What jerk is left | Set by bias instability; a constant bias alone gives a third-order loop zero error |
| Reacquisition, aided | Search width after an outage | $\delta f_d=\delta a\,\Delta t/\lambda$ with $\delta a$ = sensor error, not the dynamics envelope; about $4000$ times narrower in the example |
| Cost | The price of joining everything | No loose-coupling integrity wall; a hard-to-see GNSS fault can reach the shared inertial state; tight time synchronization needed |

That closes the module on the thread it opened with: a receiver reading time off a signal more than seventeen decibels under the noise, turning it into a position by iterating a handful of unit vectors, and surviving everything real flight throws at it — through error budgets, redundancy, differencing, geometry above the constellation, and now a filter shared with the vehicle's own inertial sense of itself.

::: context imu The box that feels motion
An **inertial measurement unit** holds three accelerometers and three gyroscopes, one of each along three perpendicular axes. The accelerometers measure the push the vehicle feels (thrust, drag, the ground's support); the gyroscopes measure how fast it is turning. Adding up those readings over time — with a gravity model — gives velocity, position and attitude with no outside signal at all. That independence is its strength: it cannot be jammed or blocked by a plume. Its weakness is that every small sensor error is added up too, so the answer drifts. The inertial navigation module (Tier 4) builds this up.
:::

::: context scalar-vector Why "scalar" and "vector"
The names come from what each filter handles. A **scalar** loop estimates one number per channel — this satellite's code phase, or this carrier's phase — on its own. A **vector** tracker estimates a whole vector of states at once (position, velocity, clock bias and drift) and derives every channel's number from it. Engineers use "scalar tracking" only to contrast it with the vector kind, much as "acoustic guitar" only became a phrase once electric guitars existed.
:::

::: context vector-diagram The shape of a vector tracker
Every channel sends its error inward to the one filter, and the filter sends each channel its next command. With deep coupling, the IMU feeds the same filter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="av" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/></marker>
  </defs>
  <g fill="#ffffff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="15" width="90" height="28" rx="4"/>
    <rect x="10" y="60" width="90" height="28" rx="4"/>
    <rect x="10" y="105" width="90" height="28" rx="4"/>
    <rect x="10" y="150" width="90" height="28" rx="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="33">channel 1</text><text x="55" y="78">channel 2</text>
    <text x="55" y="123">channel 3</text><text x="55" y="168">channel 4</text>
  </g>
  <rect x="190" y="60" width="110" height="73" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="245" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">one Kalman</text>
  <text x="245" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">filter</text>
  <text x="245" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">x, v, clock</text>
  <g stroke="#b4232c" stroke-width="1.5" marker-end="url(#av)">
    <line x1="100" y1="25" x2="188" y2="70"/><line x1="100" y1="70" x2="188" y2="85"/>
    <line x1="100" y1="115" x2="188" y2="105"/><line x1="100" y1="160" x2="188" y2="122"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#av)">
    <line x1="188" y1="76" x2="102" y2="35"/><line x1="188" y1="92" x2="102" y2="80"/>
    <line x1="188" y1="112" x2="102" y2="125"/><line x1="188" y1="128" x2="102" y2="170"/>
  </g>
  <rect x="300" y="160" width="50" height="28" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="325" y="178" font-size="11" fill="#1f2a44" text-anchor="middle">IMU</text>
  <line x1="315" y1="160" x2="285" y2="135" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#av)"/>
  <text x="150" y="12" font-size="11" fill="#b4232c" text-anchor="middle">errors in</text>
  <text x="150" y="196" font-size="11" fill="#1d6fd1" text-anchor="middle">NCO commands out</text>
</svg>
```

Red arrows carry discriminator outputs; dashed blue arrows carry the predicted code and carrier for each channel.
:::

::: context range-rate Only the part along the line counts
A satellite moving sideways across your view does not change its distance from you at that instant; one moving straight away does. The **dot product** $\mathbf{e}\cdot\mathbf{u}$ with a unit vector $\mathbf{e}$ picks out exactly the part of $\mathbf{u}$ that lies along $\mathbf{e}$: multiply matching components and add. That part is all the Doppler can see. It is why the same velocity error can be harmless for one satellite and large for another, depending on where each sits in the sky.
:::

::: context decibel-gain What a few decibels buys
Every $3\,\mathrm{dB}$ is about a factor of two in power: $10^{0.3} = 1.995$. So a tracker that works at $3\,\mathrm{dB}$ lower $C/N_0$ holds a signal with half the power, and $6\,\mathrm{dB}$ is a quarter. For a launch vehicle, that margin can be the difference between keeping a satellite and losing it when the plume or the vehicle body weakens the signal, or when a spacecraft above the constellation is listening to weak side lobes.
:::

::: context error-state Estimating the mistakes, not the motion
An **error-state** filter does not estimate position and velocity directly. The inertial navigator computes those at a high rate on its own. The filter estimates the *errors* in them — how far off the inertial position is, how big the accelerometer bias is — and feeds corrections back. The errors change slowly and are small, so they are close to linear, which is exactly the setting a Kalman filter handles best. The Kalman filtering module builds this design; deep coupling adds the tracking channels as extra measurements of the same error state.
:::

::: context bias-instability A bias that barely moves
The loop only suffers from jerk, the *change* in acceleration. The staging cliff is a big change in a fraction of a second. An accelerometer bias is a small, nearly flat offset that creeps slowly. Its jerk is tiny because its slope is tiny.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="165" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="130" x2="20" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20,40 90,40 110,130 165,130" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="92" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">unaided: 4 g gone in 0.3 s</text>
  <text x="26" y="34" font-size="11" fill="#b4232c">4 g</text>
  <line x1="195" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="195" y1="130" x2="195" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="195,41 230,40 265,41.5 300,40.5 340,41" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="268" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">aided: what the loop sees</text>
  <text x="200" y="62" font-size="11" fill="#1d6fd1">1 mg, wandering 1% per second</text>
  <text x="268" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">vertical scale 4000 times finer</text>
</svg>
```

Left: the acceleration the unaided loop must follow. Right: the inertial error the aided loop follows instead.
:::

::: context milli-g Sensor grades in milli-g
A **milli-g** (mg) is a thousandth of standard gravity, $0.0098\,\mathrm{m/s^2}$. Accelerometer bias is quoted in these units and sorts IMUs into grades. A **tactical-grade** unit, like those on many missiles and small launchers, has a bias around $1\,\mathrm{mg}$. A **navigation-grade** unit, as on airliners and orbital launch vehicles, is around $0.025\,\mathrm{mg}$, forty times better, and costs far more. Consumer phone sensors are worse than tactical grade by a factor of ten or more.
:::

::: context search-grid Searching a grid of cells
Acquisition tests a grid of guesses: each **cell** is one code delay and one Doppler **bin**. A weak signal needs long integration, and long integration makes the bins narrow — with $20\,\mathrm{ms}$ integration, bins are roughly $25\,\mathrm{Hz}$ wide. Then the unaided $1649\,\mathrm{Hz}$ window is about $66$ bins, while the aided $0.41\,\mathrm{Hz}$ sits inside one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="300" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M34.5,30 v26 M39.1,30 v26 M43.6,30 v26 M48.2,30 v26 M52.7,30 v26 M57.3,30 v26 M61.8,30 v26 M66.4,30 v26 M70.9,30 v26 M75.5,30 v26 M80.0,30 v26 M84.5,30 v26 M89.1,30 v26 M93.6,30 v26 M98.2,30 v26 M102.7,30 v26 M107.3,30 v26 M111.8,30 v26 M116.4,30 v26 M120.9,30 v26 M125.5,30 v26 M130.0,30 v26 M134.5,30 v26 M139.1,30 v26 M143.6,30 v26 M148.2,30 v26 M152.7,30 v26 M157.3,30 v26 M161.8,30 v26 M166.4,30 v26 M170.9,30 v26 M175.5,30 v26 M180.0,30 v26 M184.5,30 v26 M189.1,30 v26 M193.6,30 v26 M198.2,30 v26 M202.7,30 v26 M207.3,30 v26 M211.8,30 v26 M216.4,30 v26 M220.9,30 v26 M225.5,30 v26 M230.0,30 v26 M234.5,30 v26 M239.1,30 v26 M243.6,30 v26 M248.2,30 v26 M252.7,30 v26 M257.3,30 v26 M261.8,30 v26 M266.4,30 v26 M270.9,30 v26 M275.5,30 v26 M280.0,30 v26 M284.5,30 v26 M289.1,30 v26 M293.6,30 v26 M298.2,30 v26 M302.7,30 v26 M307.3,30 v26 M311.8,30 v26 M316.4,30 v26 M320.9,30 v26 M325.5,30 v26" stroke="#8fb8f0" stroke-width="1"/>
  <rect x="175.5" y="30" width="4.5" height="26" fill="#b4232c"/>
  <text x="180" y="20" font-size="11" fill="#1f2a44" text-anchor="middle">unaided: 66 bins of 25 Hz, about 1650 Hz</text>
  <line x1="178" y1="58" x2="178" y2="80" stroke="#b4232c" stroke-width="1.5"/>
  <text x="178" y="95" font-size="11" fill="#b4232c" text-anchor="middle">aided: 0.41 Hz, inside one bin</text>
</svg>
```
:::

::: context coupling-ladder Loose, tight, deep
The three levels differ in *what* GNSS hands the navigation filter. Loose: a finished position and velocity. Tight: raw pseudoranges and Dopplers, one per satellite, so even two satellites still help. Deep: the correlator or discriminator outputs, below the loops, so the filter also steers the receiver. Each step down shares more information and gains more robustness, and each step removes more of the separation that made the simpler design easy to check.
:::

::: context time-sync Why a millisecond matters
The filter must know exactly when each IMU reading and each correlator output was taken. Suppose they are misaligned by $1\,\mathrm{ms}$ while the vehicle accelerates at $4g_0$. The velocity handed to the NCO is then off by $4 \times 9.80665 \times 0.001 = 0.039\,\mathrm{m/s}$, a Doppler error of $0.21\,\mathrm{Hz}$ on L1 — half the entire aided search window from the lesson's example. Deeply coupled systems therefore time-tag both data streams against the receiver's own clock, usually to microseconds.
:::
