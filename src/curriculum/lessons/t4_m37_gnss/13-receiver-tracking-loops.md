---
id: l13-receiver-tracking-loops
title: Receiver tracking loops
minutes: 17
covers:
  - Receiver tracking loops (DLL, PLL, FLL) and the bandwidth/dynamics trade
---

Every measurement this module has used — pseudorange, carrier phase, Doppler — was presented as already in hand. None of it arrives that way. A receiver produces those numbers by running a small feedback loop per satellite per signal, continuously steering a local code and carrier replica to stay aligned with the incoming signal, and everything this module has attributed to "the receiver" without further comment — the multipath bias a correlator settles on, a cycle slip's cause, jerk breaking lock during staging, how wide a reacquisition search has to be — is a property of these loops. This lesson opens them up and derives the one design choice that runs through all of it: a tracking loop's bandwidth, and the trade it is always, unavoidably, making.

## Three loops, three jobs

A **delay lock loop (DLL)** tracks code phase — the early-late discriminator the multipath lesson built, driving the local code replica to keep the two correlators balanced — and its output is range. A **phase lock loop (PLL)** tracks carrier phase directly, the same accumulated-cycle count the carrier-phase lesson measured range from, and its output is precise to millimetres but fragile: lose the fractional cycle and you lose the count that made it precise. A **frequency lock loop (FLL)** tracks only the carrier's *frequency* — the Doppler — never committing to an absolute phase at all; it is far more forgiving of dynamics and noise than a PLL, at the cost of giving up phase-level precision entirely. A receiver typically leans on an FLL to pull a signal in during acquisition or to ride through conditions too rough for phase lock, then hands off to a PLL once conditions allow, exactly the reacquisition sequence the space-based and launch-vehicle lessons described without naming what was doing the work.

::: key
DLL tracks code phase (range); PLL tracks carrier phase (millimetre precision, fragile under dynamics); FLL tracks Doppler only (robust, coarser). A receiver typically acquires and rides out hard dynamics on an FLL, then upgrades to a PLL once conditions allow.
:::

## Loop order and dynamic stress: why jerk kills a third-order PLL

A tracking loop's order is the number of integrators in its feedback path, and it sets which derivative of the input the loop can follow with *zero* steady-state error. A first-order loop tracks a constant phase perfectly but lags a constant-velocity (constant-Doppler) input; a second-order loop tracks constant Doppler perfectly but lags constant Doppler *rate*; a third-order loop — standard for a receiver expected to handle real acceleration — tracks Doppler rate perfectly but lags a constant **jerk**, exactly the residual the multipath and launch-vehicle lessons named without deriving.

The size of that lag follows from control theory's final value theorem. Near the origin, a type-$N$ loop's open-loop transfer function behaves like $\omega_n^N/s^N$, so its steady-state error to an input whose Laplace transform is $X(s)$ is $\theta_e(\infty)=\lim_{s\to0} s\cdot\dfrac{1}{1+\omega_n^N/s^N}\cdot X(s)$. A constant jerk $J$ (radians per second cubed, in phase units) has $X(s)=J/s^4$, and for a third-order loop ($N=3$):

$$
\theta_e(\infty) = \lim_{s\to0}\, s\cdot\frac{s^3}{s^3+\omega_n^3}\cdot\frac{J}{s^4} = \lim_{s\to0}\frac{J}{s^3+\omega_n^3} = \frac{J}{\omega_n^3}.
$$

The error from a constant jerk does not decay — it settles at a fixed offset set by the loop's natural frequency $\omega_n$ cubed. Everything the launch-vehicle lesson computed about Doppler acceleration converts directly: $J=2\pi\,\ddot f_d$, since phase is $2\pi$ times the accumulated cycle count.

::: example What the staging transient does to a narrow-bandwidth PLL
The launch-vehicle lesson's staging transient produced $\ddot f_d=687.1\,\mathrm{Hz/s^2}$, so $J=2\pi\times687.1=4317\,\mathrm{rad/s^3}$:

```python
import numpy as np

J = 2 * np.pi * 687.1
for omega_n in (10, 15, 20, 25, 30):
    theta_e = J / omega_n**3
    print(omega_n, round(np.degrees(theta_e), 2))
# 10 247.36
# 15 73.29
# 20 30.92
# 25 15.83
# 30 9.16
```

A loop with $\omega_n=10\,\mathrm{rad/s}$ — a bandwidth well within what a quiet-signal, low-dynamics design might choose — settles at a phase error equivalent to more than a full cycle, guaranteed loss of lock. Even $\omega_n=20\,\mathrm{rad/s}$ leaves nearly $31^\circ$ of steady-state error from this transient alone, eating deeply into whatever margin remains before the loop loses lock outright (commonly cited PLL lock thresholds sit in the tens of degrees). Reaching $\omega_n=25$–$30\,\mathrm{rad/s}$ is what actually buys safety margin against a staging-class jerk.
:::

## Thermal noise: the other side of the bandwidth knob

Widening $\omega_n$ (and with it the loop's noise bandwidth $B_n$, roughly proportional to it) is not free. A loop's thermal noise jitter grows with its own bandwidth, because a wider bandwidth admits more of the noise spectrum along with the signal — the standard result for a Costas-type PLL tracking a data-modulated signal like GPS L1 C/A is

$$
\sigma_{\mathrm{PLL}} = \sqrt{\frac{B_n}{C/N_0}\left(1+\frac{1}{2T\,(C/N_0)}\right)}\ \ \text{radians},
$$

with $T$ the predetection integration time (bounded above by the $20\,\mathrm{ms}$ navigation-message bit period on L1 C/A, the constellation lesson's own number, unless the data is wiped or a dataless pilot channel is used). The code loop has an equivalent, built the same way from the early-late discriminator's slope of $2$ the multipath lesson derived:

$$
\sigma_{\mathrm{DLL}} = \sqrt{\frac{B_n\,d}{2\,(C/N_0)}}\ \ \text{chips}.
$$

::: example The same bandwidth, cutting both ways
At a solid $C/N_0=35\,\mathrm{dB\text{-}Hz}$ and $T=20\,\mathrm{ms}$, PLL jitter climbs from $2.29^\circ$ at $B_n=5\,\mathrm{Hz}$ to $5.11^\circ$ at $B_n=25\,\mathrm{Hz}$; at a weaker $C/N_0=30\,\mathrm{dB\text{-}Hz}$, from $4.10^\circ$ to $9.17^\circ$ over the same range. On the code side, at $C/N_0=45\,\mathrm{dB\text{-}Hz}$ and a standard one-chip correlator, DLL jitter runs $0.82\,\mathrm{m}$ at $B_n=0.5\,\mathrm{Hz}$ to $1.65\,\mathrm{m}$ at $B_n=2\,\mathrm{Hz}$ — consistent with the pseudorange lesson's "$0.1$ to $1\,\mathrm{m}$" receiver-noise entry at the narrower end. Narrowing the correlator to $d=0.1\,\mathrm{chip}$, exactly the narrow-correlator change the multipath lesson credited with a ten-fold multipath reduction, *also* buys a $\sqrt{10}=3.16$-fold reduction in this thermal term: $0.26\,\mathrm{m}$ instead of $0.82\,\mathrm{m}$ at $B_n=0.5\,\mathrm{Hz}$. A narrow correlator is close to a free lunch against both multipath and noise; a wide loop bandwidth is not free against anything — it always trades one error source for another.
:::

Put the two effects together and the trade is exact, not only qualitative: too narrow a bandwidth and a jerk transient like the one above blows through lock; too wide and ordinary thermal noise, worse still on a weak or side-lobe signal, dominates the error budget and can itself push a marginal link past its own lock threshold. Choosing $\omega_n$ (and its associated $B_n$) is choosing a point on this curve for the worst dynamics and the weakest signal the receiver is actually expected to survive at the same time — a launch vehicle's receiver, needing both the high $\omega_n$ this lesson's jerk example demands and enough margin against the weak, plume-affected signal the launch-vehicle lesson described, is choosing from a noticeably harder region of that trade than a static ground receiver ever has to.

::: key
Third-order loop steady-state jerk error: $\theta_e=J/\omega_n^3$, $J=2\pi\,\ddot f_d$. PLL thermal jitter $\sigma_{\mathrm{PLL}}=\sqrt{(B_n/(C/N_0))(1+1/(2T\,C/N_0))}$; DLL jitter $\sigma_{\mathrm{DLL}}=\sqrt{B_n d/(2\,C/N_0)}$ chips. Widening bandwidth shrinks dynamic stress error and grows thermal noise, in both loops, always — there is no bandwidth that minimises both at once.
:::

::: warning
Loop order and loop bandwidth are two different dials, easy to conflate. Order sets which derivative of the dynamics the loop tracks with *zero* steady-state error — third order for jerk, as this lesson derived — and is a design choice about what kind of dynamics to survive at all. Bandwidth ($\omega_n$, or equivalently $B_n$) sets how fast the loop responds and how much noise it admits, independent of order. Raising the order does not, on its own, buy any of the noise-versus-dynamics trade this lesson works out; a higher-order loop with too narrow a bandwidth still loses lock to a strong enough disturbance, and a higher order also brings its own stability margin to manage, not only a longer list of derivatives tracked for free.
:::

## Carrier-aided code tracking: loops helping each other

The DLL's bandwidth does not have to carry the vehicle's full dynamics on its own. Because the PLL already estimates Doppler far more precisely than the code loop needs, a standard architecture feeds the PLL's rate estimate forward to steer the code replica's rate directly, leaving the DLL to track only the slowly varying difference between code and carrier — mainly ionospheric divergence, a metres-per-minute effect rather than a metres-per-second one. This is why real DLL bandwidths run under a hertz, an order of magnitude narrower than a typical PLL's, even on a vehicle experiencing the dynamics this lesson has been computing: the code loop is not fighting the dynamics at all, it is riding on a much better estimate of them that the carrier loop already produced. It is also the first hint of a larger idea the final lesson develops in full: nothing says the *aiding* has to stop at frequencies borrowed from another loop inside the same receiver.

## Check yourself

::: check
State the three tracking loop types, what each one tracks, and their relative precision and robustness.
:::

::: answer
DLL tracks code phase (range), with metre-level precision and comparatively robust against dynamics because it operates on the much coarser code ruler. PLL tracks carrier phase, millimetre precision, but fragile — losing the fractional cycle under too much dynamics or too little signal costs the whole measurement. FLL tracks only Doppler (frequency), the most robust of the three because it never commits to an absolute phase, at the cost of giving up phase-level precision; receivers typically use it to acquire or to survive conditions too harsh for phase lock, then switch to a PLL.
:::

::: check
A third-order PLL with $\omega_n=18\,\mathrm{rad/s}$ experiences a sustained Doppler acceleration of $400\,\mathrm{Hz/s^2}$. Compute the steady-state phase error.
:::

::: answer
$J=2\pi\times400=2513\,\mathrm{rad/s^3}$; $\theta_e=J/\omega_n^3=2513/18^3=0.431\,\mathrm{rad}=24.69^\circ$.
:::

::: check
Compute the PLL thermal noise jitter for $B_n=8\,\mathrm{Hz}$, $C/N_0=33\,\mathrm{dB\text{-}Hz}$, $T=20\,\mathrm{ms}$.
:::

::: answer
$\sigma_{\mathrm{PLL}}=\sqrt{(8/10^{3.3})(1+1/(2\times0.02\times10^{3.3}))}$ radians $=3.65^\circ$.
:::

::: check
Explain, without further calculation, why there is no single loop bandwidth that is unconditionally "best" for a tracking loop.
:::

::: answer
Dynamic stress error falls as bandwidth widens (a wider bandwidth follows faster-changing dynamics more closely, shrinking $\theta_e=J/\omega_n^3$), while thermal noise jitter rises with bandwidth (a wider bandwidth admits more of the noise spectrum alongside the signal). Any choice of bandwidth sits somewhere on that trade, better for one error source and worse for the other; "best" only has meaning once you fix a specific worst-case dynamics profile and a specific worst-case signal strength to design against, at which point a widest-tolerable-noise or narrowest-tolerable-dynamics-margin choice can be made, but no single number is optimal for every situation at once.
:::

::: check
Why can a real receiver's DLL run with a bandwidth roughly an order of magnitude narrower than its PLL, even on a highly dynamic vehicle?
:::

::: answer
Because the DLL does not have to track the vehicle's dynamics on its own — carrier-aided code tracking feeds the PLL's much more precise Doppler estimate forward to drive the code replica's rate directly, leaving the DLL to track only the slow divergence between code and carrier (mainly the ionosphere), not the vehicle's own acceleration and jerk. The dynamics are still there; they are handled by the loop built to track them precisely, and shared with the loop that does not need to duplicate the effort.
:::

::: check
At $C/N_0=40\,\mathrm{dB\text{-}Hz}$ and $B_n=1\,\mathrm{Hz}$, compute the DLL jitter for a standard one-chip correlator and for a narrow $0.1$-chip correlator, and state the ratio between them.
:::

::: answer
One-chip: $\sigma_{\mathrm{DLL}}=\sqrt{1\times1/(2\times10^4)}\times293.05=2.07\,\mathrm{m}$. Narrow ($d=0.1$): $\sqrt{1\times0.1/(2\times10^4)}\times293.05=0.655\,\mathrm{m}$. The ratio is $\sqrt{10}=3.16$, exactly the square root of the correlator spacing ratio, as the formula predicts.
:::

## Summary

| Item | Statement |
| --- | --- |
| DLL / PLL / FLL | Code phase (range) / carrier phase (mm, fragile) / Doppler only (robust, coarse) |
| Dynamic stress (3rd-order loop) | $\theta_e = J/\omega_n^3$, $J=2\pi\ddot f_d$; a launch-vehicle staging jerk can exceed $200^\circ$ of error at a narrow $\omega_n$ |
| PLL thermal jitter | $\sigma_{\mathrm{PLL}}=\sqrt{(B_n/(C/N_0))(1+1/(2T\,C/N_0))}$ |
| DLL thermal jitter | $\sigma_{\mathrm{DLL}}=\sqrt{B_n d/(2\,C/N_0)}$ chips; narrow correlator ($d\downarrow$) reduces it by $\sqrt d$ |
| The trade | Wider bandwidth: less dynamic stress error, more thermal noise — always, in both loops |
| Carrier-aided code tracking | PLL's Doppler estimate steers the DLL, letting DLL bandwidth stay an order of magnitude narrower than PLL bandwidth |

Carrier-aiding is one loop lending another its best estimate, inside a single receiver, of a single signal. The final lesson widens that idea as far as it goes: aiding every tracking loop, for every satellite, from a single navigation filter that also knows where the vehicle's inertial sensors say it is going — the architecture built specifically to survive everything this module has described a receiver having to survive.
