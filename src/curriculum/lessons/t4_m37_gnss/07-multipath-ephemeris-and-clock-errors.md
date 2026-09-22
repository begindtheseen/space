---
id: l07-multipath-ephemeris-and-clock-errors
title: Multipath, ephemeris and clock errors
minutes: 24
covers:
  - Multipath; ephemeris and satellite clock errors
---

Three entries remain in the error budget the pseudorange lesson opened, and none of them yield to the tricks the previous lesson used. The ionosphere and troposphere are physics the receiver can model or measure around; multipath, ephemeris error and satellite clock error are not atmosphere at all. Multipath is a second copy of the same signal, arriving late, that the receiver cannot always tell from the first. Ephemeris error is the control segment's prediction of where a satellite will be, wrong by the amount any prediction of the future is wrong. Satellite clock error is what a curve fit could not capture about a clock's behaviour between the moments it was checked. All three are why, even after a perfect ionosphere-free combination and a perfect tropospheric model, the pseudorange lesson's budget still carried the better part of a metre.

This lesson derives what can be derived about each — the multipath bias a tracking loop settles on, how far an orbit error actually moves the range, how fast an unmodelled clock wanders — and is honest about the rest, which is empirical and cited as such.

## Multipath: a second copy of the signal, delayed

A signal reflects off the ground, a structure, or a vehicle's own fuselage, and arrives at the antenna a little later and a little weaker than the direct path, with a path-length difference $\Delta d$ (equivalently a delay $\Delta$, measured in chips of the code) and an amplitude ratio $\alpha < 1$ relative to the direct signal — a metal surface at a shallow grazing angle can put $\alpha$ close to $1$, while a diffuse or absorbing surface makes it small. The receiver's code tracking loop cannot separate the two; it correlates the incoming composite signal against its local code replica and locks where the correlation says to, and the reflection biases that point.

Model the code's autocorrelation function as an ideal triangle, $R(x) = \max(1-|x|, 0)$ for $x$ in chips — a fair approximation for a receiver with wide enough front-end bandwidth. An early-minus-late discriminator with correlator spacing $d$ chips locks where

$$
D(\tau) = \big[R(\tau-\tfrac{d}{2}) + \alpha R(\tau-\Delta-\tfrac{d}{2})\big] - \big[R(\tau+\tfrac{d}{2}) + \alpha R(\tau-\Delta+\tfrac{d}{2})\big] = 0.
$$

Without multipath ($\alpha=0$) this is zero exactly at $\tau=0$, since $R$ is even. With multipath present and a short delay ($0 \le \Delta \le d/2$), linearising $D(\tau)$ about $\tau=0$ — using $R'(x)=-\mathrm{sign}(x)$ on each linear piece — gives $D(0) = -2\alpha\Delta$ and $D'(0) = 2(1+\alpha)$, so the biased lock point is

$$
\tau_e = -\frac{D(0)}{D'(0)} = \frac{\alpha\,\Delta}{1+\alpha}\ \ \text{(chips)}.
$$

A numerical root-find of $D(\tau)=0$ confirms this exactly across a range of $\alpha$, $\Delta$ and $d$ — for example $\alpha=0.5$, $\Delta=0.20$: the closed form gives $0.5\times0.20/1.5=0.0667\,\mathrm{chip}$, and solving $D(\tau)=0$ numerically gives the same $0.0667$ to five decimal places. Notice what is *not* in the formula: the correlator spacing $d$. For a delay shorter than half the spacing, the bias depends only on the reflection's strength and delay, not on how tightly the correlator is built.

::: example The envelope, and what a narrow correlator buys
Scanning $\Delta$ from $0$ out past $1+d/2$ (where the reflected code no longer overlaps either correlator gate at all) traces out the full multipath error envelope. For a standard, one-chip-spacing correlator ($d=1$) and $\alpha=0.5$, the bias rises through the region the formula above covers, peaks at $0.25\,\mathrm{chip}$ near $\Delta \approx 0.75\,\mathrm{chip}$, and falls back to zero by $\Delta=1.5\,\mathrm{chip}$ — on C/A code, a peak of $0.25\times293.05=73.3\,\mathrm{m}$. Narrow the correlator spacing to $d=0.1\,\mathrm{chip}$, standard on modern receivers, and the same scan peaks at $0.025\,\mathrm{chip}$ near $\Delta\approx0.55\,\mathrm{chip}$, falling to zero by $\Delta=1.05\,\mathrm{chip}$: a peak of $7.3\,\mathrm{m}$, a full order of magnitude smaller, in exact proportion to the ten-fold reduction in $d$. The formula derived above explains why the improvement is not unlimited: a reflection delayed by only $0.02\,\mathrm{chip}$ — a reflector a couple of metres from the antenna — biases both correlators by essentially the same amount, $\alpha\Delta/(1+\alpha)$, regardless of how narrow $d$ is. Narrow correlators buy a great deal against a reflector metres to tens of metres away; they buy nothing against one bolted to the vehicle.
:::

The carrier tracking loop faces the same interference in a different form. The composite signal is a phasor sum, direct plus reflection: $1\angle 0 + \alpha\angle\phi$, where $\phi$ is the carrier phase difference the extra path length produces — and because a carrier wavelength is centimetres, even a metre of geometry swings $\phi$ through many cycles, so treat $\phi$ as effectively unpredictable. The phase-lock loop tracks the argument of the sum,

$$
\theta(\phi) = \arctan\left(\frac{\alpha\sin\phi}{1+\alpha\cos\phi}\right),
$$

and the worst case over all $\phi$ is a clean closed form: $\max_\phi|\theta(\phi)| = \arcsin(\alpha)$, confirmed by a direct numerical search over $\phi$ for several values of $\alpha$ (for instance $\alpha=0.5$ gives a numerical maximum of $30.000^\circ$, matching $\arcsin(0.5)=30^\circ$ exactly). Converting phase to range, $\delta\rho = (\theta/2\pi)\lambda$, the *carrier* multipath error is bounded by

$$
\delta\rho_{\max} = \frac{\lambda}{2\pi}\arcsin(\alpha) \ \xrightarrow{\ \alpha\to1\ }\ \frac{\lambda}{4}.
$$

At $\alpha=0.99$ — a reflection almost as strong as the direct signal — the bound evaluates to $0.0433\,\mathrm{m}$ on L1, against the limiting value $\lambda/4=0.0476\,\mathrm{m}$ the formula approaches as $\alpha\to1$. Carrier multipath is bounded by a quarter of a wavelength no matter how strong the reflection, a few centimetres at most on any GNSS carrier — three orders of magnitude tighter than code multipath's tens of metres, which is the whole reason carrier-based positioning, taken up two lessons ahead, buys the precision it does.

::: key
Code multipath bias (short delay): $\tau_e = \alpha\Delta/(1+\alpha)$ chips, independent of correlator spacing; the full envelope peaks somewhere beyond $\Delta=d/2$ and vanishes past $\Delta=1+d/2$, with the peak scaling with $d$ — narrow correlators cut it roughly in proportion. Carrier multipath is bounded by $\delta\rho_{\max}=(\lambda/2\pi)\arcsin(\alpha) \le \lambda/4$: centimetres, never metres.
:::

Mitigation follows directly from the mechanism: narrow correlators for distant reflectors, choke-ring or pinwheel antennas that physically attenuate low-elevation and ground-reflected signals before they reach the front end, and site selection that keeps large flat reflectors away from the antenna. None of these help with multipath from the vehicle's own structure, which is why an antenna's placement on a launch vehicle or spacecraft is a geometry problem worked out at the same table as the structural and RF engineers.

::: warning
Carrier smoothing of the code — averaging the noisy code range using the much smoother carrier phase to track its trend — reduces thermal noise dramatically, but it does not remove multipath the way it removes noise. Static multipath from a nearby reflector is not white; it has a correlation time set by the reflector's geometry and the satellite's slow motion across the sky, often tens of seconds to minutes, so it survives smoothing over any shorter interval largely intact. A receiver bolted to a fixed structure can see the *same* multipath bias, repeating with the satellite geometry, day after day.
:::

## Ephemeris error: a prediction, wrong by the amount predictions are wrong

The navigation message's ephemeris, the constellation lesson noted, is a curve fit to the satellite's *predicted* orbit, refreshed every couple of hours and valid a few hours either side of its reference time. The control segment tracks each satellite from monitor stations, fits its current position and velocity, and propagates that fit forward with a dynamics model to generate the curve broadcast for the next several hours — and any propagation of an uncertain state forward in time accumulates error, here from unmodelled solar radiation pressure variations, unpredicted manoeuvres, and the ordinary growth of orbit-determination uncertainty with prediction horizon.

Decompose the resulting position error $\delta\mathbf{s}$ into radial, along-track and cross-track components at the satellite. The constellation lesson's Earth-subtense angle answers a question this lesson needs: how much of $\delta\mathbf{s}$ actually reaches the pseudorange? The line of sight from receiver to satellite, $\mathbf{e}_i$, makes an angle with the satellite's own radial direction $\hat{\mathbf{s}}=\mathbf{s}/\|\mathbf{s}\|$ equal to the nadir angle at the satellite — bounded by $13.9^\circ$, reached only when the receiver is exactly on the satellite's horizon. So

$$
|\mathbf{e}_i\cdot\hat{\mathbf{s}}| \ge \cos(13.9^\circ) = 0.971, \qquad |\mathbf{e}_i\cdot\hat{\mathbf{t}}| \le \sin(13.9^\circ) = 0.240
$$

for any direction $\hat{\mathbf{t}}$ perpendicular to $\hat{\mathbf{s}}$ — which covers both along-track and cross-track. A **radial** ephemeris error projects almost entirely onto the range, at $97\%$ efficiency or better; a **tangential** (along-track or cross-track) error of the same size projects at no more than $24\%$ efficiency, and typically much less once the actual azimuth of the along-track direction relative to the line of sight is accounted for.

::: example Radial against along-track, satellite by satellite
Take the satellite at $(\mathrm{az},\mathrm{el})=(135^\circ,60^\circ)$ used throughout the navigation-solution and dilution-of-precision lessons. Its nadir angle as seen from Cape Canaveral is only $6.9^\circ$ (well inside the $13.9^\circ$ bound, since it is far from the horizon), so a $3.0\,\mathrm{m}$ radial ephemeris error produces a range error of $3.0\times\cos(6.9^\circ) = 2.98\,\mathrm{m}$ — $99\%$ efficient. A $3.0\,\mathrm{m}$ along-track error, for the along-track direction this satellite happens to have, produces only $3.0\times0.093=0.28\,\mathrm{m}$ of range error — roughly a tenth as much, for the identical error magnitude. Radial orbit error is more dangerous, metre for metre, than tangential error, which is exactly why orbit-determination systems are built to be best in the radial direction and can tolerate looser along-track knowledge.
:::

Real broadcast-ephemeris error budgets exploit this directly: the "signal-in-space range error" figures the control segment and independent monitoring agencies publish weight the radial component near full strength and the tangential components by an empirically fitted, much smaller coefficient, reflecting both the geometric projection derived here and the way that projection averages over a satellite's full pass rather than any single instant. Modern GPS broadcast ephemerides achieve a line-of-sight range error from this source of roughly a metre or better — the pseudorange lesson's "ephemeris, along line of sight, about $1\,\mathrm{m}$" entry — down from several metres in the 1990s, before more monitor stations and better force models tightened the fit.

::: warning
A tangential error's weak projection is not the same as a negligible one. Along-track prediction error is typically several times larger in absolute terms than radial error, because along-track position along an orbit is inherently harder to pin down than the distance to Earth's centre — so even at ten or twenty percent efficiency, along-track mismodelling remains a real, non-negligible contributor to the total. The projection factor tells you how efficiently an error converts to range error, not whether the error itself is small.
:::

## Satellite clock error: what the quadratic fit could not see

The receiver-clock lesson's broadcast polynomial, $\delta t_{sat} = a_{f0}+a_{f1}(t-t_{oc})+a_{f2}(t-t_{oc})^2$, is a curve fit to a satellite clock's behaviour around the reference time $t_{oc}$, refreshed roughly every two hours. Like any curve fit, it captures the smooth, predictable part of the clock's drift and aging and leaves behind whatever is genuinely stochastic — the same random walk in fractional frequency the receiver-clock lesson quantified for a receiver's own oscillator, here for a satellite-class one.

That lesson's clock-coasting formula, $c\,\sigma_y\,\Delta t$, applies without modification: it is the range-equivalent time error a clock of stability $\sigma_y$ accumulates over an interval $\Delta t$ during which nothing re-measures it. A satellite-class caesium clock has $\sigma_y \approx 10^{-13}$ — the same figure the receiver-clock lesson's oscillator table quoted — so over the interval between a clock's reference epoch and the edge of its two-hour validity window,

$$
c\,\sigma_y\,\Delta t = 299{,}792{,}458 \times 10^{-13} \times \Delta t,
$$

which gives $0.054\,\mathrm{m}$ at $\Delta t=1800\,\mathrm{s}$ (thirty minutes after upload), $0.108\,\mathrm{m}$ at one hour, and $0.216\,\mathrm{m}$ at two hours — a genuine, physically grounded piece of why the pseudorange lesson's budget carried $0.6\,\mathrm{m}$ of satellite-clock error even after applying the polynomial. It is a piece, not the whole: the rest comes from residual mismodelling of the deterministic terms themselves — the relativistic periodic correction the receiver-clock lesson's pseudorange example computed is itself only an approximation, the broadcast group delay $T_{GD}$ is a single calibrated number standing in for a mildly temperature- and aging-dependent hardware delay, and there is a small discontinuity every time a fresh polynomial is uploaded. None of these is under the receiver's control; all of them are why "after correction" in the error budget means "after the best correction available," not "corrected away."

::: example Rubidium, caesium, and why Galileo carries both
Most GPS satellites carry rubidium clocks as their primary standard, with caesium as backup, at the $10^{-13}$-class stability used above; Galileo's satellites additionally carry passive hydrogen masers, roughly an order of magnitude more stable over the timescales that matter for a two-hour broadcast fit. At $\sigma_y=10^{-14}$ instead of $10^{-13}$, the same two-hour growth falls from $0.216\,\mathrm{m}$ to $0.0216\,\mathrm{m}$ — a tenth as much stochastic residual, for a receiver willing to track a second constellation to get it. The gain does not come free: a maser is heavier, more power-hungry, and more expensive than a rubidium standard, an ordinary satellite-design trade against the payload's mass and power budget.
:::

::: key
Ephemeris error projects onto range by $\cos(\text{nadir angle})$ for the radial component (at least $0.971$) and by at most $\sin(\text{nadir angle})\le0.240$ for tangential (along- or cross-track) components — radial error is far more dangerous per metre. Satellite clock residual (after the broadcast polynomial) grows with time since the fit epoch as $c\,\sigma_y\,\Delta t$, the same clock-coasting law as a receiver's own oscillator, with a satellite-class clock's $\sigma_y\sim10^{-13}$ (rubidium/caesium) to $10^{-14}$ (hydrogen maser).
:::

## Check yourself

::: check
A reflection on L5 ($\lambda=25.48\,\mathrm{cm}$) has amplitude ratio $\alpha=0.4$ relative to the direct signal. What is the maximum possible carrier-tracking range error?
:::

::: answer
Maximum phase error is $\arcsin(0.4)=23.58^\circ$, or $23.58/360=0.0655$ cycles. Range error is $0.0655\times0.2548\,\mathrm{m}=0.0167\,\mathrm{m}$ — under two centimetres, illustrating again that carrier multipath stays small even for a fairly strong reflection.
:::

::: check
A receiver with a $0.5$-chip correlator spacing sees a reflection with $\alpha=0.4$ and a delay of $0.15\,\mathrm{chip}$ (short enough for the linear formula to apply). Compute the code-tracking bias in chips and in metres on C/A code.
:::

::: answer
$\tau_e = \alpha\Delta/(1+\alpha) = 0.4\times0.15/1.4 = 0.0429\,\mathrm{chip}$, which on C/A code ($293.05\,\mathrm{m/chip}$) is $12.6\,\mathrm{m}$.
:::

::: check
Why does narrowing the correlator spacing reduce the *peak* code multipath error but leave the short-delay bias formula $\tau_e=\alpha\Delta/(1+\alpha)$ unchanged?
:::

::: answer
The short-delay formula holds whenever the reflected code's autocorrelation still fully overlaps both the early and late correlator gates in the same way the direct signal does, which happens for any $\Delta$ up to roughly half the correlator spacing regardless of how large or small that spacing is — the bias in that regime depends only on how the reflection's strength and delay compare to the direct signal, not on the correlator geometry. The peak of the full envelope, by contrast, occurs near where the reflected signal starts to fall *off* one of the gates, a point set directly by the spacing $d$; shrinking $d$ moves that point closer to $\Delta=0$ and shrinks the whole envelope in proportion, but it cannot touch the always-present, spacing-independent bias from a very close-in reflector.
:::

::: check
An ephemeris error has a $1.0\,\mathrm{m}$ radial component and a $4.0\,\mathrm{m}$ along-track component. For a satellite with a $12.0^\circ$ nadir angle as seen from the receiver, and an along-track efficiency for this particular geometry of $0.020$, compute each component's contribution to the range error.
:::

::: answer
Radial: $1.0\times\cos(12.0^\circ) = 1.0\times0.978 = 0.978\,\mathrm{m}$. Along-track: $4.0\times0.020=0.080\,\mathrm{m}$. Despite being four times larger, the along-track error contributes an order of magnitude less range error than the radial one, because its projection efficiency here is far below even the $\sin(12.0^\circ)=0.208$ worst-case bound for this nadir angle — the specific azimuth of the along-track direction relative to the line of sight happened to be favourable.
:::

::: check
A satellite's clock polynomial is refreshed every two hours. Using a caesium-class stability of $\sigma_y=10^{-13}$, roughly how much stochastic clock error should you expect to have accumulated thirty minutes after a fresh upload, and is this the entire satellite-clock contribution to the error budget?
:::

::: answer
$c\,\sigma_y\,\Delta t = 299{,}792{,}458\times10^{-13}\times1800 = 0.054\,\mathrm{m}$. This is only the stochastic piece; the remaining satellite-clock budget comes from imperfect modelling of the deterministic terms — the relativistic correction, the group delay calibration, and small discontinuities at each upload — none of which shrinks as the clock ages within its fit interval the way this term does.
:::

## Summary

| Item | Statement |
| --- | --- |
| Multipath geometry | Path delay $\Delta$ (chips), amplitude ratio $\alpha<1$ relative to direct signal |
| Code multipath (short delay) | $\tau_e = \alpha\Delta/(1+\alpha)$ chips, independent of correlator spacing $d$ |
| Code multipath envelope | Peaks beyond $\Delta=d/2$, vanishes past $\Delta=1+d/2$; peak scales with $d$ — a $10\times$ narrower correlator gives roughly a $10\times$ smaller peak |
| Carrier multipath | $\delta\rho_{\max}=(\lambda/2\pi)\arcsin(\alpha) \le \lambda/4$; centimetres at most, on any carrier |
| Ephemeris projection | Radial efficiency $\ge\cos(13.9^\circ)=0.971$; tangential (along-/cross-track) efficiency $\le\sin(13.9^\circ)=0.240$ |
| Modern ephemeris budget | $\approx1\,\mathrm{m}$ along line of sight (control-segment SISRE); several metres in the 1990s |
| Satellite clock residual | $c\,\sigma_y\,\Delta t$ since last upload; $\sigma_y\sim10^{-13}$ (Rb/Cs), $\sim10^{-14}$ (H-maser); $0.05$–$0.22\,\mathrm{m}$ over a two-hour fit interval |

Every term in the error budget the pseudorange lesson opened now has a derivation behind its size: clock, ionosphere, troposphere, multipath, ephemeris. The next lesson changes the measurement itself — from the code's metre-level ruler to the carrier's millimetre one — and shows what that buys, and what it costs, in the integer ambiguity every carrier-phase receiver has to resolve.
