---
id: l02-the-pseudorange-and-its-error-budget
title: The pseudorange and its error budget
minutes: 19
covers:
  - The pseudorange measurement and its error budget
---

The previous lesson ended with a receiver reading the time of transmission off a satellite's signal to nanosecond resolution and noting the time of reception by its own clock. Multiply the difference by the speed of light and you have a distance — except that it is not the distance to the satellite. It is called a *pseudorange*, and the prefix is doing a lot of work. The receiver's clock is wrong by an unknown amount that can be milliseconds, the satellite's clock is wrong by a known-ish amount that can be hundreds of microseconds, and the signal did not travel through vacuum at $c$ but through a charged ionosphere and a wet troposphere that slowed it by metres. Every one of those shows up in the number, scaled by $299{,}792{,}458\,\mathrm{m/s}$.

Navigation is the business of taking that contaminated number apart. Some terms are removed with corrections broadcast by the satellite, some with models, some by using two frequencies, and one — the receiver clock — cannot be removed at all and must be solved for, which is the subject of the next lesson. What remains after every correction is the *error budget*: the residual metres from each cause, combined into a single figure that, multiplied by a geometry factor, becomes the accuracy of the position. A GNC engineer specifying a receiver, or deciding whether GNSS can meet a landing requirement, works from this budget, so the numbers in it are worth knowing cold.

## The measurement and its equation

Let the satellite transmit a particular code chip at true time $t_{tx}$ and the receiver receive it at true time $t_{rx}$. Neither clock reads true time. The satellite's clock reads $t_{tx} + \delta t_{sat}$, where $\delta t_{sat}$ is its offset from system time; the receiver's clock reads $t_{rx} + \delta t_{rx}$. The receiver forms the **pseudorange** as the speed of light times the difference of the two clock readings:

$$
\rho = c\,\big[(t_{rx} + \delta t_{rx}) - (t_{tx} + \delta t_{sat})\big] = c\,(t_{rx} - t_{tx}) + c\,\delta t_{rx} - c\,\delta t_{sat}.
$$

The true travel time $t_{rx} - t_{tx}$ is the geometric distance divided by $c$, plus the extra delay the atmosphere imposes. Writing $\mathbf{s}_i$ for the position of satellite $i$ at transmission and $\mathbf{x}$ for the receiver position at reception, both in an Earth-fixed frame, the geometric range is $\|\mathbf{s}_i - \mathbf{x}\|$, and the pseudorange to satellite $i$ becomes

$$
\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} + I_i + T_i + \varepsilon_i .
$$

Here $I_i$ is the ionospheric delay and $T_i$ the tropospheric delay, both already in metres, and $\varepsilon_i$ collects multipath, receiver noise and everything else. Notice the signs. A receiver clock that runs *ahead* of system time makes every pseudorange longer, by the same amount, so $c\,\delta t_{rx}$ enters with a plus and without a subscript. A satellite clock that runs ahead makes the signal appear to have left later, so the pseudorange is *shorter*: minus sign, and a subscript because each satellite has its own offset.

Convert time to distance once and remember the conversions. One nanosecond is $0.300\,\mathrm{m}$; one microsecond is $299.8\,\mathrm{m}$; one millisecond is $299.8\,\mathrm{km}$. A receiver with an ordinary crystal oscillator can be a millisecond off after a few minutes of running unaided; that is $300\,\mathrm{km}$ in every pseudorange simultaneously.

::: key
The pseudorange equation: $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} + I_i + T_i + \varepsilon_i$. The unknowns are the three coordinates of $\mathbf{x}$ and the receiver clock bias $c\,\delta t_{rx}$, four in all — hence four satellites minimum. Everything else is corrected, modelled or tolerated. Conversions: $1\,\mathrm{ns} = 0.3\,\mathrm{m}$, $1\,\mathrm{\mu s} = 300\,\mathrm{m}$, $1\,\mathrm{ms} = 300\,\mathrm{km}$.
:::

## How wrong is the raw number?

Before any correction, the terms have wildly different sizes, and it pays to know which are large:

| Term | Typical size before correction | Nature |
| --- | --- | --- |
| Receiver clock $c\,\delta t_{rx}$ | up to hundreds of km | unknown; common to all satellites; solved for |
| Satellite clock $c\,\delta t_{sat}$ | up to $300\,\mathrm{km}$ ($\delta t_{sat}$ up to $1\,\mathrm{ms}$); typically tens of km | broadcast polynomial corrects it to about $1\,\mathrm{m}$ |
| Ionosphere $I$ | $2$ to $30\,\mathrm{m}$ on L1 (more at solar maximum, low elevation) | modelled or removed with two frequencies |
| Troposphere $T$ | $2.3\,\mathrm{m}$ at zenith to $25\,\mathrm{m}$ near the horizon | modelled |
| Multipath | $0.5$ to several metres on code | site and antenna dependent |
| Receiver noise | $0.1$ to $1\,\mathrm{m}$ | set by $C/N_0$ and the tracking loop |
| Ephemeris (error in $\mathbf{s}_i$) | about $1\,\mathrm{m}$ along the line of sight | broadcast orbit is a prediction |
| Hardware delays | tens of ns | common part absorbed into $\delta t_{rx}$; inter-frequency part broadcast as $T_{GD}$ |

The satellite clock term is the one that surprises people. Satellite atomic clocks are allowed to drift up to a millisecond from GPS time before being reset, and offsets of a few hundred microseconds are ordinary. The navigation message carries a polynomial for it — the terms $a_{f0}$, $a_{f1}$, $a_{f2}$ and reference time $t_{oc}$ from subframe 1 — so that

$$
\delta t_{sat} = a_{f0} + a_{f1}\,(t - t_{oc}) + a_{f2}\,(t - t_{oc})^2 + \Delta t_r - T_{GD},
$$

where $\Delta t_r$ is a relativistic term that depends on where the satellite is in its slightly eccentric orbit, and $T_{GD}$ is the group delay between the satellite's L1 and L2 signal paths that a single-frequency L1 user must apply. The clock polynomial is refreshed every two hours and typically accurate to a few nanoseconds; the lesson on ephemeris and clock errors treats what is left over.

The ionosphere and troposphere are the other large terms. The ionosphere's delay scales as $1/f^2$ and with the total electron content along the path; on L1, one TEC unit ($10^{16}$ electrons per square metre) is $0.162\,\mathrm{m}$, and the vertical content ranges from a few TECU at night to over $100$ at solar maximum in the afternoon. The troposphere's delay does not depend on frequency; at sea level its zenith value is about $2.3\,\mathrm{m}$ and grows roughly as $1/\sin(\text{elevation})$. Both have a lesson of their own; here they are entries in a budget.

## Which frame, and which instant

Two subtleties in $\|\mathbf{s}_i - \mathbf{x}\|$ cost tens of metres if ignored. First, $\mathbf{s}_i$ is the satellite position *at the transmit time*, about $70$ to $86\,\mathrm{ms}$ before reception; the satellite moves about $270\,\mathrm{m}$ in that interval, so the ephemeris must be evaluated at $t_{tx} = t_{rx} - \rho/c$, not at $t_{rx}$. Second, the Earth-fixed frame rotates during the transit. If both positions are expressed in the ECEF frame *at reception*, the satellite position computed from the ephemeris at $t_{tx}$ must be rotated about the polar axis by $\omega_e\,\tau$, with $\omega_e = 7.292 \times 10^{-5}\,\mathrm{rad/s}$ and $\tau$ the transit time. That rotation is about $5\,\mathrm{\mu rad}$, which at the satellite's radius is $150\,\mathrm{m}$ of displacement, and its projection onto the line of sight — the **Sagnac correction** — is

$$
\Delta\rho_{\text{Sagnac}} = \frac{\omega_e}{c}\,\big(x_s\,y_r - y_s\,x_r\big),
$$

with $(x_s, y_s)$ and $(x_r, y_r)$ the equatorial ECEF coordinates of the satellite and receiver. For a receiver at Cape Canaveral it ranges from $-33\,\mathrm{m}$ for a satellite low in the east to $+33\,\mathrm{m}$ for one low in the west and is zero for satellites due north or south. The navigation-solution lesson derives this expression and applies it in code; for now, record that the geometric range term in the pseudorange equation carries a frame-rotation correction of up to $\pm 30$ to $40\,\mathrm{m}$.

## Corrections, then what is left

A receiver processes each pseudorange in a fixed order: apply the satellite clock correction (which lengthens the pseudorange when $\delta t_{sat}$ is positive, because the model subtracts it), subtract the modelled ionospheric and tropospheric delays, and pass the result — still containing the geometric range and the receiver clock — to the position solver:

$$
\tilde\rho_i = \rho_i + c\,\hat{\delta t}_{sat,i} - \hat I_i - \hat T_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} + \underbrace{c\,(\hat{\delta t}_{sat,i} - \delta t_{sat,i}) + (I_i - \hat I_i) + (T_i - \hat T_i) + \varepsilon_i}_{\text{residual error}} .
$$

The hats mark estimates. The bracket is what the error budget is about: not the raw sizes of the effects, but the sizes of the *mistakes in correcting them*.

::: example From a raw pseudorange to a corrected one
Take the channel from the previous lesson's example: transmit time $302{,}406.348\,597\,6\,\mathrm{s}$, receiver clock $302{,}406.421\,\mathrm{s}$, so the raw pseudorange is $0.072\,402\,4\,\mathrm{s} \times c = 21{,}705{,}693.45\,\mathrm{m}$. The satellite is at $60^\circ$ elevation, azimuth $135^\circ$, seen from a receiver at Cape Canaveral.

*Satellite clock.* Subframe 1 gives $a_{f0} = 2.5 \times 10^{-4}\,\mathrm{s}$, $a_{f1} = 3.0 \times 10^{-12}\,\mathrm{s/s}$, $a_{f2} = 0$, and $t - t_{oc} = 7{,}200\,\mathrm{s}$. The polynomial gives $250{,}000\,\mathrm{ns} + 21.6\,\mathrm{ns}$. The orbit has $e = 0.01$ and the eccentric anomaly is $40^\circ$; the relativistic term has amplitude $-22.9\,\mathrm{ns}$ (derived in the clock-error lesson) and contributes $-22.9 \sin 40^\circ = -14.7\,\mathrm{ns}$. The group delay is $T_{GD} = 5\,\mathrm{ns}$. Total: $\delta t_{sat} = 250{,}001.9\,\mathrm{ns}$, which is $74{,}948.68\,\mathrm{m}$. The $a_{f0}$ term alone is $75\,\mathrm{km}$; the drift term after two hours is $6.5\,\mathrm{m}$; relativity is $4.4\,\mathrm{m}$; group delay $1.5\,\mathrm{m}$.

*Ionosphere.* Vertical TEC of $30\,\mathrm{TECU}$ gives $30 \times 0.1624 = 4.87\,\mathrm{m}$ at the zenith on L1; the obliquity factor at $60^\circ$ elevation for a $350\,\mathrm{km}$ shell is $1.136$, so $\hat I = 5.53\,\mathrm{m}$.

*Troposphere.* The Saastamoinen zenith hydrostatic delay at sea-level pressure $1013.25\,\mathrm{hPa}$ and latitude $28.56^\circ$ is $2.310\,\mathrm{m}$; divided by $\sin 60^\circ$ it is $\hat T = 2.67\,\mathrm{m}$.

The corrected pseudorange is

$$
\tilde\rho = 21{,}705{,}693.45 + 74{,}948.68 - 5.53 - 2.67 = 21{,}780{,}633.93\,\mathrm{m}.
$$

The geometric range to a satellite at $60^\circ$ elevation is about $20{,}843{,}719\,\mathrm{m}$, so the corrected pseudorange still carries about $936{,}915\,\mathrm{m}$ of receiver clock bias — $3.125\,\mathrm{ms}$. That is the fourth unknown, and the next lesson is about it. Everything else has been reduced from kilometres to the metre level, and how many metres is the question the budget answers.
:::

## The user equivalent range error

Each residual in the bracket above is treated as a zero-mean random error with its own standard deviation, and because they arise from unrelated physics they are taken as independent. Independent errors add in quadrature, so the **user equivalent range error** is the root-sum-square

$$
\sigma_{\text{UERE}} = \sqrt{\sigma_{clk}^2 + \sigma_{eph}^2 + \sigma_{iono}^2 + \sigma_{tropo}^2 + \sigma_{mp}^2 + \sigma_{noise}^2}.
$$

Two conventions matter. The receiver clock is *not* in the UERE, because it is estimated, not tolerated; its effect is entirely in the geometry factor of the position solution. And the UERE is a per-satellite, per-measurement figure; the position error follows from it by multiplying with a dilution-of-precision factor that depends only on where the satellites are, which is the subject of a later lesson. Splitting accuracy into "how good is each measurement" times "how well does the geometry convert measurements to position" is the organising idea of the whole subject.

::: example Three budgets
Representative one-sigma values in metres, for a receiver with an open sky:

| Source | Single-frequency, broadcast model | Dual-frequency, ionosphere-free | Legacy, 1990s |
| --- | --- | --- | --- |
| Satellite clock (after polynomial) | $0.6$ | $0.6$ | $2.0$ |
| Ephemeris, along line of sight | $0.6$ | $0.6$ | $2.0$ |
| Ionosphere | $4.0$ (Klobuchar residual) | $0.1$ (higher-order) | $5.0$ |
| Troposphere | $0.3$ | $0.3$ | $0.5$ |
| Multipath | $1.0$ | $3.0$ | $1.5$ |
| Receiver noise | $0.4$ | $1.2$ | $0.6$ |
| **UERE (RSS)** | $\mathbf{4.24}$ | $\mathbf{3.36}$ | $\mathbf{5.99}$ |

Read the columns against each other. The single-frequency budget is dominated by the ionosphere: the broadcast Klobuchar model removes only about half of the delay, and the $4\,\mathrm{m}$ that remains is bigger than everything else combined. The dual-frequency column eliminates the ionosphere but pays for it: the ionosphere-free combination amplifies noise and multipath by a factor of about three, so those entries triple, and the total improves less than you might hope — $3.4\,\mathrm{m}$ against $4.2\,\mathrm{m}$ — until multipath is brought down by antenna design and siting. The legacy column shows how much the satellite clocks and orbits have improved: the control segment's clock-and-ephemeris error, about $2\,\mathrm{m}$ each in the 1990s, is now around half a metre. With a good modern receiver, dual frequency, a choke-ring antenna and a $15^\circ$ mask, a UERE near $1\,\mathrm{m}$ is achievable; multiplied by a typical dilution of precision of $1.5$ to $2$, that is where the "one to two metres" of modern GNSS comes from.
:::

## Elevation dependence and weighting

None of these errors is the same for every satellite. A satellite at $10^\circ$ elevation has a slant path through the ionosphere $2.8$ times longer than the zenith path and through the troposphere $5.8$ times longer, so the model residuals scale up with it; multipath from the ground is worst at low elevation; and the antenna gain is lower there, so $C/N_0$ and the noise are worse too. A widely used way to fold this into the solution is an elevation-dependent standard deviation,

$$
\sigma_i^2 = a^2 + \frac{b^2}{\sin^2 \theta_i},
$$

with $\theta_i$ the elevation and, for example, $a = 0.4\,\mathrm{m}$ and $b = 0.6\,\mathrm{m}$, giving $\sigma = 1.0\,\mathrm{m}$ at the zenith, $2.2\,\mathrm{m}$ at $20^\circ$, $3.9\,\mathrm{m}$ at $10^\circ$ and $7.3\,\mathrm{m}$ at $5^\circ$. These weights go into a weighted least-squares solution — the sibling module on least squares covers how — and the reason to know them here is that they are also the argument for an elevation mask: a satellite below $5^\circ$ or so contributes a measurement so noisy that it degrades the fix more than it helps the geometry.

::: warning
Do not put the receiver clock into the UERE, and do not put a term in twice. The receiver clock bias is common to every pseudorange at an epoch; it is estimated exactly by the solver and its effect on position is described by the time dilution of precision, not by the range budget. Similarly, a receiver's antenna cable delay is common to all satellites and disappears into the clock estimate, so it costs nothing in position. Errors that are *different* for each satellite are what the UERE counts, because those are the ones the geometry converts into position error.
:::

::: note
The UERE is quoted as a standard deviation, but the components are not all Gaussian, not all zero-mean, and not all white. Multipath at a fixed site is a slowly varying bias that repeats each sidereal day with the geometry; the ionospheric residual is correlated across satellites in the same part of the sky and over minutes; ephemeris error changes only when the broadcast set changes, every two hours. A filter that treats pseudorange errors as white at $1\,\mathrm{Hz}$ will believe its covariance more than it should. The consistency tests from the Kalman filtering module are how you find out.
:::

## Check yourself

::: check
A receiver's clock is $2.3\,\mathrm{ms}$ ahead of GPS time. Without correction, what does that do to each pseudorange, and does it affect the position fix?
:::

::: answer
Each pseudorange is lengthened by $c \times 2.3\,\mathrm{ms} = 689.5\,\mathrm{km}$, the same amount for every satellite. It does not corrupt the position if the solver treats the clock bias as a fourth unknown, because a common offset in all measurements is exactly what that unknown absorbs. It would be catastrophic for a solver that assumed the clock was right and tried to intersect spheres of the measured radii.
:::

::: check
The broadcast clock polynomial for a satellite has $a_{f0} = -1.8 \times 10^{-4}\,\mathrm{s}$ and $a_{f1} = 2.0 \times 10^{-12}$. What correction, in metres, applies to a measurement made $3{,}600\,\mathrm{s}$ after $t_{oc}$, and which way does it move the pseudorange?
:::

::: answer
$\delta t_{sat} = -1.8 \times 10^{-4} + 2.0 \times 10^{-12} \times 3600 = -180{,}000\,\mathrm{ns} + 7.2\,\mathrm{ns} = -179{,}992.8\,\mathrm{ns}$, which is $-53{,}960.5\,\mathrm{m}$. The model has $-c\,\delta t_{sat}$ in the pseudorange, so the correction adds $c\,\delta t_{sat}$: the pseudorange is shortened by $53.96\,\mathrm{km}$. A satellite clock that runs slow makes the signal appear to have left earlier, so the raw pseudorange was too long.
:::

::: check
A single-frequency receiver's budget has satellite clock $0.6\,\mathrm{m}$, ephemeris $0.6\,\mathrm{m}$, ionospheric residual $3.5\,\mathrm{m}$, troposphere $0.3\,\mathrm{m}$, multipath $0.8\,\mathrm{m}$ and noise $0.3\,\mathrm{m}$. What is the UERE, and what single change would most reduce it?
:::

::: answer
RSS: $\sqrt{0.36 + 0.36 + 12.25 + 0.09 + 0.64 + 0.09} = \sqrt{13.79} = 3.71\,\mathrm{m}$. The ionosphere accounts for $12.25$ of the $13.79$ square metres, so removing it — by a second frequency or by differential corrections from a nearby reference — is the only change that matters; halving every other term would leave the UERE above $3.5\,\mathrm{m}$.
:::

::: check
Why is the satellite position in the pseudorange equation evaluated at the transmit time rather than the receive time, and how large is the difference?
:::

::: answer
The signal received at $t_{rx}$ left the satellite about $\rho/c \approx 67$ to $86\,\mathrm{ms}$ earlier, and the satellite's position at that earlier instant is where the range must be measured from. At $3{,}874\,\mathrm{m/s}$ the satellite moves about $270\,\mathrm{m}$ during the transit, so evaluating the ephemeris at $t_{rx}$ misplaces it by that much — up to tens of metres along the line of sight. In addition, the Earth-fixed frame turns by about $5\,\mathrm{\mu rad}$ during the transit, and the Sagnac correction of up to about $\pm 33\,\mathrm{m}$ at mid-latitudes accounts for that.
:::

::: check
An engineer proposes lowering the elevation mask from $10^\circ$ to $2^\circ$ to get two more satellites into the fix. Using the weighting model $\sigma^2 = 0.4^2 + 0.6^2/\sin^2\theta$, what standard deviation would those measurements have, and what is the case against?
:::

::: answer
At $2^\circ$, $\sin\theta = 0.0349$ and $\sigma = \sqrt{0.16 + 0.36/0.001218} = \sqrt{0.16 + 295.6} = 17.2\,\mathrm{m}$, against $3.9\,\mathrm{m}$ at $10^\circ$ and $1.0\,\mathrm{m}$ at the zenith. Such a measurement is seventeen times noisier than a zenith one and carries far more multipath and unmodelled tropospheric delay than the model captures. Properly weighted it barely changes the solution; unweighted it drags the fix around by metres. The extra satellites improve the geometry only on paper.
:::

## Summary

| Item | Statement |
| --- | --- |
| Pseudorange | $\rho = c\,[(t_{rx} + \delta t_{rx}) - (t_{tx} + \delta t_{sat})]$: receiver clock reading minus satellite clock reading, times $c$ |
| Pseudorange equation | $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} + I_i + T_i + \varepsilon_i$ |
| Unknowns | $\mathbf{x}$ (three) and $c\,\delta t_{rx}$ (one): four satellites minimum |
| Conversions | $1\,\mathrm{ns} = 0.3\,\mathrm{m}$; $1\,\mathrm{\mu s} = 300\,\mathrm{m}$; $1\,\mathrm{ms} = 300\,\mathrm{km}$ |
| Satellite clock model | $\delta t_{sat} = a_{f0} + a_{f1}(t - t_{oc}) + a_{f2}(t - t_{oc})^2 + \Delta t_r - T_{GD}$; raw offsets of tens of km, corrected to about $1\,\mathrm{m}$ |
| Frame and instant | Evaluate $\mathbf{s}_i$ at $t_{tx} = t_{rx} - \rho/c$ (satellite moves $\sim 270\,\mathrm{m}$); Sagnac $\Delta\rho = (\omega_e/c)(x_s y_r - y_s x_r)$, up to $\pm 30$–$40\,\mathrm{m}$ |
| Corrected pseudorange | $\tilde\rho_i = \rho_i + c\,\hat{\delta t}_{sat,i} - \hat I_i - \hat T_i$ |
| UERE | $\sigma_{\text{UERE}} = \sqrt{\sigma_{clk}^2 + \sigma_{eph}^2 + \sigma_{iono}^2 + \sigma_{tropo}^2 + \sigma_{mp}^2 + \sigma_{noise}^2}$; excludes the receiver clock |
| Typical budgets | Single-frequency $\approx 4.2\,\mathrm{m}$ (ionosphere dominates); dual-frequency $\approx 3.4\,\mathrm{m}$ (noise and multipath tripled); good modern setup $\approx 1\,\mathrm{m}$ |
| Elevation weighting | $\sigma_i^2 = a^2 + b^2/\sin^2\theta_i$; with $a = 0.4$, $b = 0.6\,\mathrm{m}$: $1.0\,\mathrm{m}$ at zenith, $3.9\,\mathrm{m}$ at $10^\circ$ |
| Position error | $\approx$ DOP $\times$ UERE, where DOP is a pure geometry factor |

The corrected pseudorange still contains the receiver clock bias, hundreds of kilometres of it in the example above. The next lesson explains why that term cannot be calibrated away, why it is treated as a fourth unknown rather than a nuisance, and what you get for free once you have estimated it.
