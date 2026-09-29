---
id: l11-control-structure-interaction
title: Control-structure interaction
minutes: 21
covers:
  - control-structure interaction
---

You have heard a microphone howl. Someone holds it too close to a loudspeaker. The speaker plays a tiny sound, the microphone picks it up, the amplifier makes it louder, the speaker plays it louder still, and in a second the room is screaming. Nothing is broken. The microphone, the amplifier and the speaker all work perfectly. The *loop* is the problem: it keeps feeding one tone back into itself.

A launch vehicle's control system can howl the same way. On its first flight in August 1998, the **[[Delta III|delta-iii]]** rocket began rolling back and forth at about 4 Hz. The controller treated that rolling as an error to fix, swung the solid-motor nozzles harder and harder, and used up the hydraulic fluid that moved them. Control was lost and the vehicle was destroyed about seventy seconds after lift-off. The airframe had not failed. The controller had — by treating a flexing of the structure, which its design model did not properly include, as a rigid-body error to correct. This failure has a name: **control-structure interaction**, a control loop feeding energy into the vehicle's own vibrations.

The last two lessons met its two main forms on a launch vehicle: bending modes at a few hertz and above, and slosh at a fraction of a hertz. This lesson puts the whole plant together — rigid body, slosh, bending, the engine's own mass, actuators and sensors — and shows how engineers check and design against the howl. At its center is a choice made for every flexible mode. **Gain stabilization** pushes the mode below 0 dB, so its phase cannot matter. **Phase stabilization** lets it rise above 0 dB but aims its phase so the loop stays stable. The choice depends on how far the mode sits from crossover, and the bending-notch exercise ends by making you apply it.

## The complete plant

Collect everything the earlier lessons built into one transfer function, from gimbal command $\delta_c$ ("delta sub c") to the attitude the gyro reports:

$$
\frac{\theta_{\text{meas}}}{\delta_c} = A(s)\left[\underbrace{\frac{\mu_\delta}{s^2 - \mu_\alpha}}_{\text{rigid}}
+ \underbrace{\sum_j \frac{\mu_\delta\,(\omega_{z,j}^2 - \omega_{p,j}^2)}{(s^2 - \mu_\alpha)(s^2 + 2\zeta_j\omega_{p,j}s + \omega_{p,j}^2)}}_{\text{slosh}}
+ \underbrace{\sum_n \frac{k_n\,\omega_n^2}{s^2 + 2\zeta_n\omega_n s + \omega_n^2}}_{\text{bending}}\right] .
$$

Read it piece by piece. $A(s)$ is the **actuator** that swings the engine, usually a second-order lag with a bandwidth of 3–10 Hz. The first term inside the bracket is the unstable rigid body of Lesson 6. The second is each slosh pole-zero pair of the last lesson, written as an addition to the rigid plant. The third is each bending mode, with modal gain $k_n$, from Lesson 9.

A digital controller adds one more thing: a **[[sample-and-hold delay|sample-hold]]** of half a sample period plus computing time, a few to tens of milliseconds. A delay $\tau$ ("tau") is pure phase lag, $\omega\tau$, that grows in step with frequency. Ten milliseconds is $360^\circ \times 2 \times 0.01 = 7^\circ$ at 2 Hz, but $43^\circ$ at 12 Hz. The controller is a PD (or PID) law times a bending filter, and the loop gain is the product of everything.

On a Bode plot of this loop gain, the frequency axis reads like a **[[map of the vehicle|bode-map]]**:

- below 0.1 Hz the gain is large and the phase sits at $-180^\circ$, the mark of a stabilized unstable plant;
- around 0.3–1 Hz sit the slosh pole-zero pairs, tiny in extent but sharp;
- the rigid-body crossover lies at 0.3–2 Hz, depending on the vehicle's size;
- from 1 to 20 Hz the bending modes stand up out of the roll-off like needles, the first one tallest;
- somewhere in 3–10 Hz the actuator's phase lag becomes large and the tail-wags-dog zero appears;
- above that the sampling delay rules the phase, and the gain should be well below 0 dB.

## Tail-wags-dog

Stand on a skateboard and swing a heavy broom quickly to one side. You roll the *other* way. Swinging a mass takes a push, and the push comes back on you.

The engine is that broom. When the actuator swings a 500 kg engine about its gimbal, the engine's center of mass speeds up sideways, and the reaction on the vehicle opposes the side force the swing was meant to make. For an engine of mass $m_e$ with its center of mass a distance $\ell_e$ from the gimbal, the net side force is $T\delta + m_e\ell_e\ddot\delta$ ($\ddot\delta$, "delta double dot", is the gimbal's angular acceleration). For a steady back-and-forth swing, $\ddot\delta = -\omega^2\delta$, so the force is $(T - m_e\ell_e\omega^2)\delta$, and the two parts cancel when $\omega^2 = T/(m_e\ell_e)$. That is the **[[tail-wags-dog frequency|twd]]**:

$$
\omega_{\text{TWD}} = \sqrt{\frac{T}{m_e\,\ell_e}} .
$$

At that frequency the gimbal cannot push the vehicle sideways at all.

Take a 0.85 MN engine of 470 kg with $\ell_e = 1.2\ \mathrm{m}$. First $m_e\ell_e = 470 \times 1.2 = 564\ \mathrm{kg\cdot m}$. Then $\omega_{\text{TWD}} = \sqrt{8.5 \times 10^5/564} = \sqrt{1507} = 38.8\ \mathrm{rad/s}$, which is $38.8/2\pi = 6.2\ \mathrm{Hz}$.

In the transfer function this is a pair of zeros on the imaginary axis, multiplying the control coefficient: $\mu_\delta \to \mu_\delta(1 + s^2/\omega_{\text{TWD}}^2)$, which is zero at $s = \pm j\omega_{\text{TWD}}$, with a small correction for the engine's own rotational inertia. Above $\omega_{\text{TWD}}$ the control force reverses sign, a $180^\circ$ phase flip. A bending mode near the TWD frequency sees its control authority change sign across its own narrow resonance. Small engines on large vehicles put the TWD zero high and harmless. Large engines put it near the first bending modes, where it must be modeled.

## Requirements and how they are checked

Launch-vehicle programs state stability requirements as **gain margin** (how much the loop gain could grow before instability) and **phase margin** (how much extra lag it could take). They are set separately for the rigid body and for each flexible mode, across the whole flight:

- **Rigid body**: at least 6 dB of gain margin and $30^\circ$ of phase margin. The gain margin is needed in *both* directions, because the plant is aerodynamically unstable — the low-gain margin of Lesson 6 as well as the usual high-gain one.
- **Gain-stabilized modes**: the loop gain at the mode's peak at least 6–8 dB below 0 dB, with the mode's frequency spread over its uncertainty band and its damping taken at the low end of what was measured.
- **Phase-stabilized modes**: at least 30–45° of phase margin at each place the mode crosses 0 dB, over the same spreads plus the actuator's phase uncertainty and the delay budget.

The spreads — engineers call them **dispersions** — are not small. **[[Ground vibration tests|gvt]]** and finite-element models predict bending frequencies to $\pm 10$–20 % and modal gains to perhaps $\pm 50$ %. Damping is uncertain by a factor of two. Slosh parameters move with fill level and $g_{\text{eff}}$. The actuator's bandwidth changes with load and temperature.

So checking means stepping through the flight time. At each step, run the linear analysis at the corner cases and a **[[Monte Carlo|monte-carlo]]** run over the dispersions, and confirm the margins hold everywhere. Flight data closes the loop: spectral analysis of the gyro and gimbal signals from every flight shows where the modes really sat.

## Gain stabilization and phase stabilization

Picture the Nyquist plot, which traces the loop gain as a point in the plane while frequency sweeps up. The closed loop goes unstable if the plot wraps around the **critical point**, $-1$, the wrong number of times.

A lightly damped mode draws a **[[circle in that plane|nyquist-circle]]** as frequency sweeps through its resonance. The circle's diameter is set by the mode's peak gain. Which way it points is set by the phase of everything else in the loop at that frequency, plus the sign of the modal gain $k_n$.

- If the peak gain is below one, the circle is too small to reach $-1$, whichever way it points. The mode is **gain-stabilized**, and nothing about its phase can hurt.
- If the peak gain is above one, the circle *can* reach $-1$. Point it away from $-1$ and the mode is **phase-stabilized**. Get the direction wrong by $180^\circ$ and the same mode is unstable.

::: key
Gain stabilization: attenuate the mode below 0 dB with a notch or roll-off — the right answer when the mode sits well above crossover. Phase stabilization: let it exceed 0 dB but shape the phase so the loop still encircles correctly — necessary when the mode is too close to crossover to attenuate without destroying the phase margin.
:::

What decides it is the ratio of the mode's frequency to the rigid-body crossover.

- **Far above crossover** — a factor of five or more. The loop is already rolling off, a notch costs only a few degrees of phase at crossover, and gain stabilization is cheap and robust.
- **Close to crossover** — a factor of two or less. Any filter deep enough to shrink the mode costs tens of degrees of phase margin, and the designer is forced to work with the mode's phase instead.

::: example A 12 Hz mode against a 2 Hz loop
The bending lesson's loop crossed 0 dB at 2.08 Hz, and its first mode sat at 12 Hz. The ratio is $12/2.08 = 5.8$.

**The notch.** A 20 dB notch ($\zeta_z = 0.05$, $\zeta_p = 0.5$) took the mode's peak from $+8.8$ to $-11.2\ \mathrm{dB}$ and cost $9^\circ$ of phase margin at crossover. A 26 dB notch ($\zeta_z = 0.03$, $\zeta_p = 0.6$) bought 6 dB more for $2^\circ$ more.

**Why that is gain stabilization working.** The mode stays well below 0 dB across a $\pm 10$ % frequency band. The sign of $k_1$ does not matter. The actuator's phase at 12 Hz does not matter. The rigid-body loop is almost untouched.

**The alternative that fails.** Lowering the whole loop gain until the mode fell below 0 dB would take 9 dB of reduction. That would drag the rigid crossover down toward the unstable pole and use up most of the low-gain margin. On an aerodynamically unstable vehicle, the rigid loop cannot be slowed to suit a flexible mode.
:::

::: example The same mode at 3 Hz
Move the mode to 3 Hz with the same modal gain. The ratio is now only $3/2.08 = 1.4$.

**No filter.** The peak reaches $+3.6\ \mathrm{dB}$, above one. With $k_1 > 0$ the phase at the peak is $-85^\circ$ and the loop is stable. With $k_1 < 0$ it is $-168^\circ$, close to $-180^\circ$, and the closed loop has poles at $+0.046 \pm 18.9j$: unstable, growing at 3 Hz.

**A notch fails.** A 20 dB notch at 3 Hz costs $43^\circ$ of phase at 2 Hz and leaves only $22^\circ$ of phase margin. A shallower 15.6 dB notch ($\zeta_p = 0.3$) leaves $32^\circ$ — barely legal — and is so narrow that a 10 % frequency error puts the mode on its shoulder.

The remaining options:

- **Phase-stabilize.** Choose the gyro's station, or blend two gyros, so that $k_1 > 0$ and the resonance circle swings away from $-1$. Then check that the actuator lag, the delay budget and a $\pm 20$ % frequency spread cannot rotate it back. Fragile, but standard when nothing else fits.
- **Lower the crossover, if the aerodynamics allow.** With $K_p = 2.6$ and $K_d = 0.7$ the crossover falls to 1.22 Hz. That is still seven times the 0.16 Hz unstable pole, so the rigid margins survive, with $54^\circ$ of phase margin. The loop gain at 3 Hz is lower, the mode no longer reaches 0 dB, and a modest notch ($\zeta_z = 0.05$, $\zeta_p = 0.3$) leaves $41^\circ$. The price is a slower response to gusts, and higher loads.
- **Add damping or move the mode.** Stiffen the structure, add damping material, or move the sensor to a slope null of the offending mode.

None of these is free. The exercise asks you to pick one and defend it.
:::

## Sensor placement and blending

A gyro senses the local slope of a mode, $\phi_n'(x_g)$ ("phi n prime at x g"). An accelerometer senses the local deflection $\phi_n(x_a)$. So where you bolt a sensor is a design choice as powerful as a filter.

A gyro placed where the first mode's slope is zero — mid-body, for a uniform free-free beam — does not see that mode at all. But mode shapes are known only roughly, slope nulls move as propellant drains, and a quiet spot for one mode can be loud for another. At mid-body the second mode's slope has a strong peak of $5.4/L$.

**Blending** two sensors uses the symmetry of the mode shapes. For the uniform free-free beam of length $L$:

- the first mode's slope at $0.15L$ and $0.85L$ is $\mp 4.4/L$ — equal and opposite;
- the second mode's slope at those same two stations is $-6.3/L$ at both.

Average two gyros there and the first mode cancels exactly, while the rigid rate, the same everywhere, is kept. The second mode passes at full strength and needs its own filter. Take the difference of the same two gyros and the roles swap. Real vehicles use weighted blends tuned to finite-element mode shapes.

Where the sensor sits relative to the engine matters too. A gyro near the engine sees the bending the engine excites with the same sign the engine pushes it. That tends to make modes phase-stable: the actuator and sensor "agree". A gyro far forward may see the opposite sign. The "positive sign in the feedback path" the exercise specifies is exactly this sign, and half of phase stabilization is knowing it with confidence.

## Beyond fixed filters

A fixed notch wide enough for a $\pm 20$ % frequency band costs phase for the whole flight. Two ideas reduce that cost.

**Scheduling** moves the notch centers with flight time, following the modes as propellant drains and their frequencies rise. Each notch can then be narrower.

**[[Adaptive augmenting control|aac]]**, flown on the Space Launch System, watches the frequency content of the attitude error. When it hears growing power above the rigid-body band — the sign of a mode being pumped — it turns the loop gain down. When the rigid-body error needs more authority, it turns the gain back up, never beyond a set multiple of the nominal. It does not replace the fixed design. It wins back margin when the real vehicle differs from the model.

::: warning
Gain stabilization is robust to *phase* but not to *gain*. A mode pushed to $-8\ \mathrm{dB}$ becomes unstable if its modal gain is 8 dB larger than predicted, and modal gains are the least certain numbers in the model. Size the attenuation on the upper bound of the modal gain and the lower bound of the damping, not on the nominal values.
:::

::: warning
Do not fix a flexible-mode problem by lowering the whole loop gain on an aerodynamically unstable vehicle. The rigid body needs its bandwidth to stay ahead of the unstable pole, and its low-gain margin to survive dispersions in $\mu_\alpha$. A mode too close to crossover is a structure or sensor-placement problem before it is a filter problem.
:::

## Check yourself

::: check
A rigid-body loop crosses over at 1.5 Hz. Bending modes are predicted at 9 Hz and 2.5 Hz. Which approach do you take for each, and why?
:::

::: answer
The 9 Hz mode is $9/1.5 = 6$ times above crossover. Gain-stabilize it with a notch sized on the mode's frequency uncertainty; a 20 dB notch will cost under $10^\circ$ of phase at 1.5 Hz.

The 2.5 Hz mode is only $2.5/1.5 = 1.7$ times above crossover. A notch deep enough to shrink it would cost tens of degrees of phase at 1.5 Hz. So it must be phase-stabilized — sensor placement or blending to fix the sign of its modal gain, then a check of its phase over the dispersions — or the structure and sensor layout must change. Lowering the overall gain is not an option on an unstable vehicle.
:::

::: check
A 12 Hz bending mode is gain-stabilized with 8 dB of margin. On the flight vehicle its modal gain turns out to be twice the prediction and its damping half. Is the mode still stable?
:::

::: answer
Doubling the modal gain adds $20\log_{10}2 = 6\ \mathrm{dB}$ to the peak. Halving the damping doubles the resonant magnification $1/(2\zeta)$: another 6 dB. The peak rises 12 dB, from $-8$ to $+4\ \mathrm{dB}$.

The mode is no longer gain-stabilized. Whether it is unstable now depends on its phase — the very thing gain stabilization was meant to make irrelevant. Either error alone would have left 2 dB of margin; together they use it all. Margins must be sized against the combined worst case.
:::

::: check
Find the tail-wags-dog frequency of a 0.6 MN engine of 300 kg with its center of mass 1.0 m from the gimbal. A bending mode is predicted at 7 Hz. Why does this matter?
:::

::: answer
$m_e\ell_e = 300 \times 1.0 = 300\ \mathrm{kg\cdot m}$, so $\omega_{\text{TWD}} = \sqrt{6 \times 10^5/300} = \sqrt{2000} = 44.7\ \mathrm{rad/s}$, and $44.7/2\pi = 7.1\ \mathrm{Hz}$.

The control force passes through zero and reverses sign almost exactly at the mode's frequency. Across the mode's resonance, the sign of the push — and so the direction of its Nyquist circle — flips. A phase-stabilization argument built on the sign of the modal gain would be wrong on one side of the TWD zero. The mode must be gain-stabilized, or the TWD dynamics modeled explicitly.
:::

::: check
Two gyros are mounted at $0.15L$ and $0.85L$ on a vehicle whose first two modes look like those of a uniform free-free beam. A designer proposes averaging their outputs. What does that do to each mode, and to the rigid-body rate?
:::

::: answer
The rigid-body rate is the same at both stations, so the average keeps it exactly.

The first mode's slopes are $-4.4/L$ and $+4.4/L$, so their average is zero: the first mode cancels.

The second mode's slopes are $-6.3/L$ at both, so the average passes it at full strength. It must still be handled by a filter; at 2.76 times the first-mode frequency it is usually far enough above crossover to notch. If the real mode shapes differ from the beam's, the cancellation is only partial, so the blend is checked against finite-element shapes and flight data.
:::

::: check
Why does a digital controller's sampling delay matter more for bending modes than for the rigid body?
:::

::: answer
A pure delay $\tau$ adds phase lag $\omega\tau$, growing in step with frequency. For 10 ms at a 2 Hz rigid crossover: $2\pi \times 2 \times 0.01 = 0.126\ \mathrm{rad} = 7^\circ$, a modest bite out of the phase margin. At a 12 Hz bending mode it is six times more, $43^\circ$ — enough to rotate a phase-stabilized mode's Nyquist circle a long way toward $-1$. Gain-stabilized modes are immune, which is one more reason to gain-stabilize wherever the separation allows.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Complete plant | actuator × (rigid + slosh pairs + bending modes), plus sampling delay |
| Delay $\tau$ | phase lag $\omega\tau$: 10 ms is 7° at 2 Hz, 43° at 12 Hz |
| $\omega_{\text{TWD}} = \sqrt{T/(m_e\ell_e)}$ | tail-wags-dog zero; 6.2 Hz for a 0.85 MN, 470 kg engine at 1.2 m |
| Rigid requirements | ≥ 6 dB gain margin in both directions, ≥ 30° phase margin |
| Flexible requirements | gain-stabilized ≥ 6–8 dB below 0 dB, or phase-stabilized ≥ 30–45°, over dispersions |
| Dispersions | mode frequency ±10–20 %, modal gain ±50 %, damping ×/÷ 2 |
| Gain stabilization | notch or roll-off when the mode is ≥ 5× crossover; robust to phase, not to gain |
| Phase stabilization | mode above 0 dB with phase aimed away from $-1$; needed within ~2× crossover; fragile to delay, actuator phase and sign |
| Sensor blending | average of gyros at $0.15L$, $0.85L$ cancels mode 1, passes mode 2 |
| Adaptive augmenting control | lowers gain when it detects a mode being pumped (SLS) |

The last lesson leaves the climb. A booster that has separated and turned around must fall back through the atmosphere with its engines off, and the aerodynamics that were a nuisance on the way up become its only way to steer on the way down.

::: context delta-iii What happened to Delta III
Delta III flew for the first time on August 26, 1998, from Cape Canaveral. Partway through the climb a roll oscillation near 4 Hz appeared. The roll controller kept swinging the steerable nozzles of the solid boosters to fight it, and the hydraulic fluid that powered them ran out. With no steering left, the vehicle lost control and was destroyed. The investigation traced it to a flexible roll mode that the control design had not adequately modeled.
:::

::: context sample-hold Why a computer adds delay
A digital flight computer does not watch the gyros continuously. It takes a reading, say, every 10 or 20 milliseconds, computes a command, and holds that command steady until the next update. The held command lags the smooth one it stands for by about half a sample period on average. Add the time to compute, and the engine always acts on slightly old news. At low frequencies that barely matters; at bending frequencies it can flip the loop's sign.
:::

::: context bode-map The loop's frequency map
Here is where each piece of the vehicle lives on the frequency axis (log scale). The overlaps are the whole difficulty of this lesson.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="136" x2="30" y2="144"/><line x1="164.7" y1="136" x2="164.7" y2="144"/><line x1="299.4" y1="136" x2="299.4" y2="144"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="158">0.1 Hz</text><text x="164.7" y="158">1 Hz</text><text x="299.4" y="158">10 Hz</text>
  </g>
  <rect x="94.3" y="16" width="70.4" height="16" fill="#f2b880"/>
  <text x="170" y="28" font-size="11" fill="#1f2a44">slosh 0.3–1 Hz</text>
  <rect x="94.3" y="42" width="111" height="16" fill="#8fb8f0"/>
  <text x="211" y="54" font-size="11" fill="#1f2a44">crossover 0.3–2 Hz</text>
  <rect x="164.7" y="68" width="175.3" height="16" fill="#1d6fd1"/>
  <text x="160" y="80" font-size="11" fill="#1f2a44" text-anchor="end">bending 1–20 Hz</text>
  <rect x="229" y="94" width="70.4" height="16" fill="#b4232c"/>
  <text x="224" y="106" font-size="11" fill="#1f2a44" text-anchor="end">actuator lag, TWD 3–10 Hz</text>
  <rect x="30" y="120" width="64.3" height="10" fill="#6c7a93"/>
  <text x="100" y="129" font-size="11" fill="#1f2a44">unstable rigid body</text>
</svg>
```
:::

::: context twd Swinging the engine pushes back
Two forces act on the vehicle when the engine swings. The tilted thrust pushes the vehicle one way. Throwing the heavy engine sideways pushes it the other way, and that reaction grows with the square of how fast the engine is waved. At the tail-wags-dog frequency they are equal and cancel; above it the reaction wins and the push reverses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="10" width="60" height="72" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="182,93.2 177.6,149.1 140,135.4 172.6,89.8" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="84" r="4" fill="#1f2a44"/>
  <line x1="215" y1="56" x2="262" y2="56" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="272,56 260,50 260,62" fill="#1d6fd1"/>
  <text x="222" y="46" font-size="11" fill="#1d6fd1">thrust side force Tδ</text>
  <line x1="145" y1="30" x2="98" y2="30" stroke="#b4232c" stroke-width="3"/>
  <polygon points="88,30 100,24 100,36" fill="#b4232c"/>
  <text x="20" y="52" font-size="11" fill="#b4232c">reaction of the</text>
  <text x="20" y="66" font-size="11" fill="#b4232c">swinging engine</text>
  <text x="192" y="100" font-size="11" fill="#1f2a44">gimbal</text>
  <text x="180" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">equal and opposite at ω_TWD</text>
</svg>
```
:::

::: context gvt Shaking the real rocket
Before first flight, engineers hang the assembled vehicle (or a stage) on soft supports, so it behaves almost as if floating free, and shake it with electric shakers across a range of frequencies. Accelerometers all over the structure record how it rings. This **ground vibration test** measures the real mode frequencies, shapes and damping, and the finite-element model is then tuned to match. Even so, flight differs: propellant drains, tanks are pressurized, and the air pushes on the skin.
:::

::: context monte-carlo Rolling the dice thousands of times
A **Monte Carlo** analysis picks every uncertain number — mode frequency, damping, modal gain, actuator bandwidth, wind — at random from its expected spread, runs the analysis, and repeats thousands of times. The result is not one answer but a cloud of answers, from which engineers read, say, "the gain margin stays above 6 dB in 99.7 % of cases". The name comes from the casino in Monaco: the method runs on chance.
:::

::: context nyquist-circle A mode draws a circle
As frequency sweeps through a lightly damped mode, the loop gain swings around a small circle. If the circle is small (gain-stabilized), it cannot reach the critical point $-1$. If it is large, its direction decides everything: pointed away, the loop is fine; pointed at $-1$, it wraps around it and the loop goes unstable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="250" y1="15" x2="250" y2="165" stroke="#6c7a93" stroke-width="1"/>
  <text x="256" y="26" font-size="11" fill="#6c7a93">Im</text>
  <text x="330" y="84" font-size="11" fill="#6c7a93">Re</text>
  <circle cx="150" cy="90" r="4" fill="#1f2a44"/>
  <text x="150" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">−1</text>
  <circle cx="178" cy="90" r="40" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="178" y="146" font-size="11" text-anchor="middle" fill="#b4232c">points at −1: unstable</text>
  <circle cx="290" cy="90" r="40" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="300" y="162" font-size="11" text-anchor="middle" fill="#1d6fd1">points away: stable</text>
  <circle cx="70" cy="60" r="10" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="70" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">small: gain-stabilized</text>
</svg>
```
:::

::: context aac A controller that listens for trouble
NASA's Marshall Space Flight Center developed adaptive augmenting control for the Space Launch System, and it flew on Artemis I in 2022. It runs beside the fixed controller. One filter watches the attitude error in the rigid-body band; another listens above it, where a pumped bending mode would show up. Rising high-frequency energy turns the gain down; large low-frequency error turns it up. Hard limits keep it inside what the fixed design was proven for.
:::
