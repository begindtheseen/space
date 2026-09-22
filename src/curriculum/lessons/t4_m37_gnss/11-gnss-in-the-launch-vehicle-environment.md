---
id: l11-gnss-in-the-launch-vehicle-environment
title: GNSS in the launch vehicle environment
minutes: 21
covers:
  - "GNSS in a launch vehicle environment: acceleration, jerk, vibration, plume attenuation, antenna switching"
---

The constellation lesson deferred a promise: on a launch vehicle, Doppler rate "rises by orders of magnitude." The signal-structure and error-budget lessons were built around a receiver sitting still or drifting gently; a launch vehicle does neither. In the space of a few minutes it accelerates through several times the weight it started with, sheds stages in events measured in tenths of a second, shakes itself hard enough to worry every piece of avionics on board, burns propellant whose exhaust can outright block a radio signal rather than merely delay it, and switches which antenna is even listening as its geometry changes beneath the sky. None of this is exotic physics — it is the same pseudorange, the same tracking loop, the same Doppler formula this module has used throughout — but the numbers involved are large enough to change what "good enough" means for a receiver's design.

## Acceleration and jerk: stressing the Doppler rate

The vehicle's own growing speed already widens the baseline Doppler well beyond the ground receiver's $\pm4.9\,\mathrm{kHz}$ window long before staging — by orbital insertion a launch vehicle is moving at the same several-kilometres-per-second scale the space-based lesson's GTO and GEO users travel at, and the same Doppler arithmetic applies. What a launch vehicle adds on top of that offset is how *fast* it changes. The signal-structure lesson's Doppler formula, $f_d=-\dot\rho/\lambda$, differentiates once more under acceleration: $\dot{f}_d = -\ddot\rho/\lambda$, the **Doppler rate**, proportional to the line-of-sight component of relative acceleration. A static ground receiver's Doppler rate stays under $1\,\mathrm{Hz/s}$, set only by the slow geometric drift of a satellite crossing the sky. A launch vehicle supplies its own acceleration directly, and by first-stage cutoff that acceleration is not small: thrust stays roughly constant while propellant mass falls away, so a vehicle that lifts off at a thrust-to-weight ratio only a little over one can be pulling several times Earth's gravity by the time the tanks run dry.

::: example Steady thrust against a staging transient
Near main engine cutoff a representative booster is still accelerating at about $4g_0$:

$$
\dot f_d = \frac{a}{\lambda}: \qquad a = 4g_0 = 39.2\,\mathrm{m/s^2}\ \implies\ \dot f_d = \frac{39.2}{0.1903} = 206.1\,\mathrm{Hz/s},
$$

two orders of magnitude above the ground case, and that is a *steady*, predictable acceleration a receiver's loop can be designed around. Staging is not steady: main engine cutoff removes essentially all of the thrust acceleration within a few tenths of a second, and the difference between "several $g$" and "free fall" divided by that short interval is real **jerk** — the rate of change of acceleration, which drives the *second* derivative of Doppler:

$$
\text{jerk} = \frac{\Delta a}{\Delta t} = \frac{39.2\,\mathrm{m/s^2}}{0.3\,\mathrm{s}} = 130.8\,\mathrm{m/s^3} \implies \ddot f_d = \frac{130.8}{0.1903} = 687.1\,\mathrm{Hz/s^2}.
$$

A tracking loop that comfortably follows the steady $206\,\mathrm{Hz/s}$ climb through powered flight can still be caught by a transient this sharp, precisely the reason the multipath and ephemeris lesson flagged jerk as the term that breaks a high-order phase-lock loop — the tracking-loop lesson ahead derives exactly why.
:::

::: key
Doppler rate $\dot f_d = a_{\mathrm{LOS}}/\lambda$; Doppler acceleration (from jerk) $\ddot f_d = j_{\mathrm{LOS}}/\lambda$. A representative booster near main engine cutoff: $\dot f_d \approx 200\,\mathrm{Hz/s}$ from steady $4g$ thrust acceleration, $\ddot f_d \approx 700\,\mathrm{Hz/s^2}$ from the staging transient — both far beyond anything a static or orbital receiver design has to survive.
:::

## Vibration: the same coupling, oscillating

Structural vibration is the same acceleration-coupling mechanism as thrust, alternating rather than building steadily. A vibration environment with a peak of $5g$ at some structural resonance couples into the Doppler rate exactly the way steady thrust does, instantaneously:

$$
\dot f_{d,\mathrm{peak}} = \frac{5g_0}{\lambda} = \frac{49.0}{0.1903} = 257.7\,\mathrm{Hz/s},
$$

comparable to, or larger than, the steady thrust acceleration case above — even though vibration's *net* displacement averages close to zero over each cycle and contributes almost nothing to cumulative position error. The threat vibration poses to a tracking loop is not the position error it causes (negligible) but the instantaneous dynamic stress it places on the loop at whatever rate it oscillates. A loop's bandwidth acts as a filter on this: vibration content at frequencies well inside the loop's tracking bandwidth couples directly into tracking error the way any other dynamics would, while content well above the bandwidth is attenuated by the loop's own response before it can do much damage — which is exactly the bandwidth-versus-dynamics trade the tracking-loop lesson formalises. Beyond the electrical tracking problem, sustained vibration is also a mechanical one: connectors work loose, antenna radomes flex, and cable runs flexing at resonance modulate signal amplitude in ways no amount of loop design fixes — reasons a launch vehicle's GNSS antenna and its cabling are qualified against the vehicle's actual vibration and shock environment, not only its RF performance.

## Plume attenuation: from delay to blackout

The ionosphere lesson derived a signal's phase refractive index in a plasma, $n\approx1-40.3\,N_e/f^2$, and everything that lesson built assumed $f$ was far above the plasma frequency $f_p$, so the effect was a small delay. That assumption can fail entirely in a rocket's exhaust plume. Combustion products — free electrons and ions from the flame, sometimes enriched by easily-ionised metal compounds depending on the propellant — can reach an electron density high enough that the plasma frequency approaches or exceeds the GNSS carrier itself, and a wave below the plasma frequency does not merely slow down in a plasma, it is reflected and absorbed rather than transmitted.

The threshold follows directly from the same physics the ionosphere lesson derived: $f_p^2 = N_e e^2/(4\pi^2\varepsilon_0 m_e) = 80.6\,N_e$ (SI units, $N_e$ in electrons per cubic metre). Setting $f_p=f_{L1}$,

$$
N_e = \frac{f_{L1}^2}{80.6} = \frac{(1575.42\times10^6)^2}{80.6} = 3.08\times10^{16}\,\mathrm{el/m^3} = 3.08\times10^{10}\,\mathrm{el/cm^3}.
$$

The ionosphere's own peak electron density, at solar maximum, is on the order of $10^{12}\,\mathrm{el/m^3}$ — some four orders of magnitude below this threshold, which is exactly why the ionosphere only ever delays a GNSS signal and never blocks it outright. A dense combustion plasma close to the nozzle can plausibly approach the density this threshold requires, particularly for propellant chemistries that leave the exhaust rich in easily-ionised species; whether a given plume actually reaches it, and over how much of the flight, is a vehicle-specific electromagnetic analysis, not a fact this module can hand you as a number. What the physics does hand you is the *mechanism* — an ordinary delay turning into an outright blackout once electron density crosses this line — and why lower frequencies are the first to go: $f_p$ needed to block L5 is $(1176.45/1575.42)^2=0.558$ times L1's, so a plume that has not yet blocked L1 can already be blocking L5.

::: example Antenna placement is an electromagnetic decision, not only a structural one
A single antenna, wherever it sits, will at some point in flight have its view of some part of the sky pass close to or through the plume — during a pitch manoeuvre, or because the plume trails directly behind the vehicle along much of its own velocity vector. Multiple antennas at different body locations, selected or combined so that at least one always has a plume-free view of enough satellites, is the standard answer, and it is why the next section — antenna switching — is not an afterthought but a routine part of flight.
:::

## Antenna switching

Switching from one antenna to another mid-flight changes the electrical path from sky to receiver in an instant: a different cable length, a different phase centre, sometimes a different amplifier — all of it adding up to a sudden jump in the apparent range the receiver measures, on every satellite the new antenna sees. On the code, this is a discontinuity the tracking loop has to re-settle through, generally within its ordinary pull-in range. On the carrier phase, it is worse: an abrupt phase jump of unknown size looks exactly like the cycle slip the carrier-phase lesson's detector was built to catch, because that is what it is — the physical path length genuinely changed, and the count of accumulated cycles genuinely needs a new starting offset. A receiver that is not explicitly told when a switch happens will, correctly, flag it as a slip and either resolve a fresh ambiguity from that point or, lacking the redundancy to do so cleanly, drop that satellite's carrier-phase track until it can.

::: warning
Do not assume antenna switching is invisible to the tracking loop merely because the code measurement recovers quickly. A code loop's few-hundred-nanosecond pull-in range can absorb a switch's path-length jump in well under a second and look, from a crude health check, like nothing happened; the carrier phase is a different story; the previous lesson's few-centimetre wavelength notices a jump the code loop shrugs off, and any receiver software using carrier phase — for a precise fix, or for velocity — needs to be told exactly when a switch occurs so it can treat the resulting jump as the deliberate event it is rather than a spurious slip to chase down after the fact.
:::

## Reacquisition after a launch-vehicle outage

Staging, a plume-shadowed antenna, or dynamics briefly exceeding a loop's tracking range can each cost lock outright, and every one of them is more likely at exactly the moments a launch vehicle can least afford bad navigation. What carries the vehicle through the gap is not GNSS at all: it is the inertial navigation system, which keeps producing a position and velocity solution — degrading, but continuous — throughout, exactly the subject the inertial navigation module works out in full, including how much a given inertial sensor's error grows over a given outage duration and how long a filter can trust it.

What this module can add is what the outage does to *reacquisition* once GNSS signals return. The previous lesson's search-space argument applies here with the numbers changed: during an outage of duration $\Delta t$, if the vehicle's acceleration is uncertain by some amount $\delta a$ — inertial navigation alone is not perfectly calibrated — the Doppler the receiver should expect on return has drifted by an additional, unpredicted amount:

$$
\delta f_d = \frac{\delta a\,\Delta t}{\lambda}: \qquad \delta a = 2g_0,\ \Delta t = 5\,\mathrm{s} \implies \delta f_d = \frac{2\times9.80665\times5}{0.1903} = 515\,\mathrm{Hz},
$$

on top of whatever Doppler search window the vehicle's known, modelled dynamics already demand. Every second of outage widens the search a little further, which is exactly why a shorter outage is not only easier on the inertial solution's growing position error — it is directly cheaper to reacquire from. Deep coupling, at the end of this module, closes this loop from the other direction: an inertial-aided receiver reacquires faster precisely because the inertial solution, however degraded, still predicts the Doppler well enough to narrow that search dramatically, which is a second, independent reason — beyond holding lock longer — that tightly coupling the two systems pays off on exactly the vehicle this lesson has been describing.

## Check yourself

::: check
A vehicle is accelerating at $2.5g$ along a satellite's line of sight. What Doppler rate does that produce on L1?
:::

::: answer
$\dot f_d = a/\lambda = (2.5\times9.80665)/0.1903 = 128.8\,\mathrm{Hz/s}$.
:::

::: check
A staging event drops acceleration by $3g$ over $0.2\,\mathrm{s}$. Compute the jerk and the resulting Doppler acceleration on L1.
:::

::: answer
Jerk $=\Delta a/\Delta t = (3\times9.80665)/0.2=147.1\,\mathrm{m/s^3}$. Doppler acceleration $=147.1/0.1903=772.99\,\mathrm{Hz/s^2}$ — even sharper than the module's $4g$-over-$0.3\,\mathrm{s}$ example, because the same acceleration change happened faster.
:::

::: check
Why does vibration threaten a tracking loop through its peak instantaneous acceleration rather than through the net position error it causes?
:::

::: answer
Vibration is oscillatory, so its contribution to net position — the double integral of acceleration over a full cycle — averages close to zero and is not what a tracking loop struggles with. What the loop actually has to follow, moment to moment, is the *rate of change* of range, and an oscillating acceleration produces an oscillating Doppler rate whose *peak* can rival or exceed a steady thrust acceleration's Doppler rate, stressing the loop's dynamic tracking capability at that instant even though the vehicle has barely moved from where it would otherwise have been.
:::

::: check
Compute the electron density needed for a plasma to reach the plasma frequency of L5 ($1176.45\,\mathrm{MHz}$), and compare it to the L1 threshold worked out in the lesson.
:::

::: answer
$N_e = f_{L5}^2/80.6 = (1176.45\times10^6)^2/80.6 = 1.72\times10^{16}\,\mathrm{el/m^3}$, against L1's $3.08\times10^{16}\,\mathrm{el/m^3}$ — L5 needs $1.79$ times less electron density to be blocked, the same $(f_1/f_2)^2$ scaling the ionosphere lesson used for delay, here applied to an opacity threshold instead: a plume dense enough to start blocking L5 may still be letting L1 through.
:::

::: check
Why does switching to a different antenna mid-flight typically cause more trouble for a carrier-phase measurement than for a code measurement on the same satellite?
:::

::: answer
Both measurements see the same sudden jump in electrical path length, but they see it at very different scales relative to their own precision. The code loop's tracking uncertainty is metres to tens of metres, so a switch-induced jump of centimetres to a few metres is well inside what the loop's ordinary pull-in range absorbs without incident. The carrier-phase measurement is precise to millimetres, so the same jump is many wavelengths — indistinguishable, without being told otherwise, from a genuine cycle slip, and it forces exactly the ambiguity-recovery response a slip would.
:::

::: check
A launch vehicle loses GNSS lock for $8\,\mathrm{s}$ with an acceleration uncertainty of $1.5g$. How much extra Doppler search width does this add on return, on L1?
:::

::: answer
$\delta f_d = \delta a\,\Delta t/\lambda = (1.5\times9.80665\times8)/0.1903 = 618.4\,\mathrm{Hz}$, added on top of whatever search window the vehicle's already-modelled dynamics require.
:::

## Summary

| Item | Statement |
| --- | --- |
| Doppler rate | $\dot f_d=a_{\mathrm{LOS}}/\lambda$; $\approx206\,\mathrm{Hz/s}$ at $4g$ steady thrust on L1 |
| Doppler acceleration (jerk) | $\ddot f_d=j_{\mathrm{LOS}}/\lambda$; $\approx687\,\mathrm{Hz/s^2}$ for a $4g$-over-$0.3\,\mathrm{s}$ staging transient |
| Vibration | Same coupling, oscillating; peak Doppler-rate excursion can rival steady thrust ($258\,\mathrm{Hz/s}$ at $5g$ peak); loop bandwidth filters high-frequency content |
| Plume opacity threshold | $N_e=f^2/80.6\,\mathrm{el/m^3}$; $3.08\times10^{16}\,\mathrm{el/m^3}$ for L1, four orders of magnitude above the ionosphere's own peak density |
| Antenna switching | Instant path-length jump; code loop absorbs it, carrier phase reads it as a cycle slip unless flagged |
| Outage reacquisition | $\delta f_d=\delta a\,\Delta t/\lambda$ extra search width per second of outage and per unit acceleration uncertainty |
| What carries the outage | The inertial navigation system (inertial navigation module), while deep coupling (ahead) narrows the reacquisition search on return |

Two threads from this lesson and the one before it — a search space that can be narrowed by outside knowledge, and dynamics sharp enough to defeat a loop that is not built for them — both point at the receiver's tracking loops themselves. The next lesson pauses the dynamics story to work out what a receiver can do about a single bad measurement hiding among good ones, before the final two lessons return to the loops and close the module with the aided architecture built to survive everything this lesson described.
