---
id: l02-the-pseudorange-and-its-error-budget
title: The pseudorange and its error budget
minutes: 20
covers:
  - The pseudorange measurement and its error budget
---

Your friend stands at the far end of a field. At exactly noon by her watch she shouts. You hear the shout at three seconds past noon by *your* watch, and since sound covers $343$ meters a second, you decide she is about a kilometer away. But suppose your watch runs one second fast. Then the shout really took two seconds, and she is only about $690$ meters away. And if a breeze slowed the sound, the answer is off again. Your "distance" was really *a time difference between two imperfect watches, times a speed*, plus whatever the air did on the way.

A GNSS receiver is in exactly that spot. The last lesson ended with it reading the time of transmission off a satellite's signal to the nanosecond, and noting the time of reception by its own clock. Multiply the difference by the speed of light and you get a distance — but not the distance to the satellite. It is called a **[[pseudorange|pseudo-word]]**, and the "pseudo" matters. The receiver's clock is wrong by an unknown amount that can reach milliseconds. The satellite's clock is wrong by a known-ish amount that can reach hundreds of microseconds. And the signal did not fly through empty space at $c$: it crossed a charged ionosphere and a damp lower atmosphere that slowed it by meters. Each of these lands in the number, multiplied by $299{,}792{,}458\,\mathrm{m/s}$.

Navigation means taking that messy number apart. Some pieces are removed with corrections the satellite broadcasts, some with models, some by using two frequencies. One piece — the receiver clock — cannot be removed at all and must be solved for; that is the next lesson. What is left after every correction is the **error budget**: the leftover meters from each cause, combined into one figure that, multiplied by a geometry factor, becomes the accuracy of the position. An engineer choosing a receiver, or deciding whether GNSS can meet a landing requirement, works from this budget, so its numbers are worth knowing cold.

## The measurement and its equation

Say the satellite sends a particular chip at true time $t_{tx}$, and the receiver gets it at true time $t_{rx}$. ("tx" and "rx" are radio shorthand for transmit and receive.) Neither clock shows true time. The satellite's clock reads $t_{tx} + \delta t_{sat}$, where $\delta t_{sat}$ ("delta t sat") is its offset from GPS system time. The receiver's clock reads $t_{rx} + \delta t_{rx}$. The receiver forms the **pseudorange** $\rho$ ("rho") as the speed of light times the difference of the two *readings*:

$$
\rho = c\,\big[(t_{rx} + \delta t_{rx}) - (t_{tx} + \delta t_{sat})\big] = c\,(t_{rx} - t_{tx}) + c\,\delta t_{rx} - c\,\delta t_{sat}.
$$

The second step only regroups the brackets: true travel time first, then the two clock errors.

The true travel time $t_{rx} - t_{tx}$ is the straight-line distance divided by $c$, plus the extra delay from the atmosphere. Write $\mathbf{s}_i$ for the position of satellite $i$ when it sent, and $\mathbf{x}$ for the receiver's position when it received, both in an **[[Earth-fixed frame|ecef]]**. The distance is $\|\mathbf{s}_i - \mathbf{x}\|$, read "the length of s i minus x". The pseudorange to satellite $i$ becomes

$$
\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} + I_i + T_i + \varepsilon_i .
$$

Here $I_i$ is the ionospheric delay and $T_i$ the tropospheric delay (the lower, weather-filled atmosphere), both already in meters. The last term, $\varepsilon_i$ ("epsilon"), collects echoes, receiver noise and everything else.

Look at the signs, because they trip people up.

- A receiver clock running *ahead* of system time makes every pseudorange longer, all by the same amount. So $c\,\delta t_{rx}$ has a plus sign and no satellite subscript.
- A satellite clock running ahead stamps the signal with a later time, so the signal seems to have left later and the pseudorange is *shorter*. Minus sign, and a subscript, because each satellite has its own offset.

Convert time to distance once and remember it. One nanosecond is $0.300\,\mathrm{m}$. One microsecond is $299.8\,\mathrm{m}$. One millisecond is $299.8\,\mathrm{km}$. An ordinary crystal clock left to itself can drift a millisecond in a few minutes: $300\,\mathrm{km}$ in every pseudorange at once.

::: key
The pseudorange equation: $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} + I_i + T_i + \varepsilon_i$. The unknowns are the three coordinates of $\mathbf{x}$ and the receiver clock bias $c\,\delta t_{rx}$, four in all — hence four satellites minimum. Everything else is corrected, modeled or tolerated. Conversions: $1\,\mathrm{ns} = 0.3\,\mathrm{m}$, $1\,\mathrm{\mu s} = 300\,\mathrm{m}$, $1\,\mathrm{ms} = 300\,\mathrm{km}$.
:::

## How wrong is the raw number?

Before any correction the terms have wildly different sizes, and it pays to know which are big:

| Term | Typical size before correction | Nature |
| --- | --- | --- |
| Receiver clock $c\,\delta t_{rx}$ | up to hundreds of km | unknown; common to all satellites; solved for |
| Satellite clock $c\,\delta t_{sat}$ | up to $300\,\mathrm{km}$ ($\delta t_{sat}$ up to $1\,\mathrm{ms}$); typically tens of km | broadcast polynomial corrects it to about $1\,\mathrm{m}$ |
| Ionosphere $I$ | $2$ to $30\,\mathrm{m}$ on L1 (more at solar maximum, low elevation) | modeled or removed with two frequencies |
| Troposphere $T$ | $2.3\,\mathrm{m}$ at zenith to $25\,\mathrm{m}$ near the horizon | modeled |
| Multipath | $0.5$ to several meters on code | site and antenna dependent |
| Receiver noise | $0.1$ to $1\,\mathrm{m}$ | set by $C/N_0$ and the tracking loop |
| Ephemeris (error in $\mathbf{s}_i$) | about $1\,\mathrm{m}$ along the line of sight | broadcast orbit is a prediction |
| Hardware delays | tens of ns | common part absorbed into $\delta t_{rx}$; inter-frequency part broadcast as $T_{GD}$ |

Two words in the table: **multipath** is the signal arriving by echoes off the ground or nearby objects as well as directly, and the **zenith** is straight overhead.

The satellite clock is the one that surprises people. Satellite atomic clocks may drift up to a millisecond from GPS time before being reset, and offsets of a few hundred microseconds are ordinary. So the message carries a formula for the offset. It is a **polynomial** — a sum of a constant, a straight-line term and a squared term — built from $a_{f0}$, $a_{f1}$, $a_{f2}$ and the reference time $t_{oc}$ in subframe 1:

$$
\delta t_{sat} = a_{f0} + a_{f1}\,(t - t_{oc}) + a_{f2}\,(t - t_{oc})^2 + \Delta t_r - T_{GD}.
$$

Read it term by term. $a_{f0}$ is the offset at time $t_{oc}$. $a_{f1}$ is how fast the clock drifts, in seconds per second. $a_{f2}$ is how fast the drift itself changes. Then $\Delta t_r$ is a **[[relativistic|relativity]]** term that depends on where the satellite is along its slightly stretched orbit. And $T_{GD}$ is the **group delay**: the difference between the satellite's internal L1 and L2 signal paths, which a single-frequency L1 user must apply. The polynomial is refreshed every two hours and is typically good to a few nanoseconds; a later lesson treats what is left over.

The ionosphere and troposphere are the other big terms. The ionosphere's delay goes as $1/f^2$ and grows with the **[[total electron content|tec]]** along the path. On L1, one TEC unit ($10^{16}$ electrons per square meter) is $0.162\,\mathrm{m}$ of delay. The vertical content ranges from a few units at night to over $100$ on an afternoon at solar maximum. The troposphere's delay does not depend on frequency. At sea level it is about $2.3\,\mathrm{m}$ at the zenith and grows roughly as $1/\sin(\text{elevation})$, because a low signal crosses more air. Both get a lesson of their own; here they are lines in a budget.

## Which frame, and which instant

Two details in $\|\mathbf{s}_i - \mathbf{x}\|$ cost tens of meters if you forget them.

**Which instant.** $\mathbf{s}_i$ is the satellite's position *when it sent*, about $70$ to $86\,\mathrm{ms}$ before reception. The satellite moves about $270\,\mathrm{m}$ in that time. So the orbit formula must be evaluated at $t_{tx} = t_{rx} - \rho/c$, not at $t_{rx}$.

**Which frame.** The Earth-fixed frame turns while the signal is in flight. Suppose both positions are written in the Earth-fixed frame *at the moment of reception*. Then the satellite position computed for $t_{tx}$ must be rotated about the polar axis by $\omega_e\,\tau$, where $\omega_e = 7.292 \times 10^{-5}\,\mathrm{rad/s}$ ("omega e") is Earth's spin rate and $\tau$ ("tau") is the travel time. The rotation is about $5\,\mathrm{\mu rad}$, which moves the satellite about $150\,\mathrm{m}$. Its effect along the line of sight is the **[[Sagnac correction|sagnac]]**:

$$
\Delta\rho_{\text{Sagnac}} = \frac{\omega_e}{c}\,\big(x_s\,y_r - y_s\,x_r\big),
$$

where $(x_s, y_s)$ and $(x_r, y_r)$ are the satellite's and receiver's coordinates in the equator's plane. For a receiver at Cape Canaveral it runs from about $-33\,\mathrm{m}$ for a satellite low in the east to $+33\,\mathrm{m}$ for one low in the west, and is zero for satellites due north or south. The navigation-solution lesson derives it and codes it. For now: the geometric range carries a frame-rotation correction of up to $\pm 30$ to $40\,\mathrm{m}$.

## Corrections, then what is left

A receiver treats each pseudorange in a fixed order. It applies the satellite clock correction. It subtracts the modeled ionospheric and tropospheric delays. Then it passes the result — which still holds the geometric range and the receiver clock — to the position solver:

$$
\tilde\rho_i = \rho_i + c\,\hat{\delta t}_{sat,i} - \hat I_i - \hat T_i = \|\mathbf{s}_i - \mathbf{x}\| + c\,\delta t_{rx} + \underbrace{c\,(\hat{\delta t}_{sat,i} - \delta t_{sat,i}) + (I_i - \hat I_i) + (T_i - \hat T_i) + \varepsilon_i}_{\text{residual error}} .
$$

A hat, as in $\hat I_i$ ("I hat"), marks an estimate. The tilde in $\tilde\rho_i$ ("rho tilde") marks the corrected pseudorange. Notice that the clock correction is *added*: the equation has $-c\,\delta t_{sat}$ in it, so a positive $\delta t_{sat}$ is undone by adding it back, which lengthens the pseudorange.

The underbraced part is what the error budget is about. Not the raw sizes of the effects, but the sizes of the *mistakes in correcting them*.

::: example From a raw pseudorange to a corrected one
Take the channel from the last lesson. Transmit time $302{,}406.348\,597\,6\,\mathrm{s}$; receiver clock $302{,}406.421\,\mathrm{s}$. The difference is $0.072\,402\,37\,\mathrm{s}$, and times $c$ the raw pseudorange is $21{,}705{,}684.31\,\mathrm{m}$. The satellite is at $60^\circ$ elevation, azimuth (compass direction) $135^\circ$, seen from Cape Canaveral.

**Satellite clock.** Subframe 1 gives $a_{f0} = 2.5 \times 10^{-4}\,\mathrm{s}$, $a_{f1} = 3.0 \times 10^{-12}\,\mathrm{s/s}$, $a_{f2} = 0$, and $t - t_{oc} = 7{,}200\,\mathrm{s}$.

- Constant term: $250{,}000\,\mathrm{ns}$.
- Drift term: $3.0 \times 10^{-12} \times 7{,}200\,\mathrm{s} = 21.6\,\mathrm{ns}$.
- Relativity: the orbit has eccentricity $e = 0.01$ and eccentric anomaly $40^\circ$ (its position around the ellipse). The term has amplitude $-22.9\,\mathrm{ns}$, derived in the clock-error lesson, so it adds $-22.9 \sin 40^\circ = -14.7\,\mathrm{ns}$.
- Group delay: subtract $T_{GD} = 5\,\mathrm{ns}$.

Total: $\delta t_{sat} = 250{,}001.9\,\mathrm{ns}$, which is $74{,}948.68\,\mathrm{m}$. The constant alone is $75\,\mathrm{km}$; the drift after two hours is $6.5\,\mathrm{m}$; relativity $4.4\,\mathrm{m}$; group delay $1.5\,\mathrm{m}$.

**Ionosphere.** A vertical TEC of $30$ units gives $30 \times 0.1624 = 4.87\,\mathrm{m}$ straight up on L1. A slanted path crosses more of the layer. Modeling the ionosphere as a thin shell $350\,\mathrm{km}$ up, the **obliquity factor** at $60^\circ$ elevation is $1.136$, so $\hat I = 5.53\,\mathrm{m}$.

**Troposphere.** The Saastamoinen model's zenith delay at sea-level pressure $1013.25\,\mathrm{hPa}$ (hectopascals, the weather-map unit) and latitude $28.56^\circ$ is $2.310\,\mathrm{m}$. Divided by $\sin 60^\circ$, $\hat T = 2.67\,\mathrm{m}$.

**Put together.** Add the clock correction and subtract the two delays:

$$
\tilde\rho = 21{,}705{,}684.31 + 74{,}948.68 - 5.53 - 2.67 = 21{,}780{,}624.79\,\mathrm{m}.
$$

**Sanity check.** The true distance to a satellite at $60^\circ$ elevation from the Cape is about $20{,}843{,}721\,\mathrm{m}$. So the corrected pseudorange still holds about $936{,}904\,\mathrm{m}$ of receiver clock bias — $3.125\,\mathrm{ms}$. That is the fourth unknown, and the next lesson is about it. Everything else has shrunk from kilometers to meters; *how many* meters is what the budget answers.
:::

## The user equivalent range error

Each leftover error is treated as random, with an average of zero and its own **standard deviation** $\sigma$ ("sigma"), the typical size of its spread. The errors come from unrelated physics, so they are taken as **independent**: knowing one tells you nothing about another. Independent errors add **[[in quadrature|quadrature]]** — square each, add the squares, take the square root. That total is the **user equivalent range error**, or UERE:

$$
\sigma_{\text{UERE}} = \sqrt{\sigma_{clk}^2 + \sigma_{eph}^2 + \sigma_{iono}^2 + \sigma_{tropo}^2 + \sigma_{mp}^2 + \sigma_{noise}^2}.
$$

The subscripts name the sources: satellite clock, ephemeris, ionosphere, troposphere, multipath and receiver noise. This way of combining is called the **root-sum-square** (RSS).

Two rules matter.

1. The receiver clock is *not* in the UERE. It is estimated, not put up with, and its effect lands entirely in the geometry factor of the position solution.
2. The UERE is a per-satellite, per-measurement figure. The position error follows by multiplying it by a **dilution of precision** factor that depends only on where the satellites are in the sky — a later lesson.

Splitting accuracy into "how good is each measurement" times "how well does the geometry turn measurements into position" is the organizing idea of the whole subject.

::: example Three budgets
Here are typical one-sigma values in meters for a receiver under open sky.

| Source | Single-frequency, broadcast model | Dual-frequency, ionosphere-free | Legacy, 1990s |
| --- | --- | --- | --- |
| Satellite clock (after polynomial) | $0.6$ | $0.6$ | $2.0$ |
| Ephemeris, along line of sight | $0.6$ | $0.6$ | $2.0$ |
| Ionosphere | $4.0$ (Klobuchar residual) | $0.1$ (higher-order) | $5.0$ |
| Troposphere | $0.3$ | $0.3$ | $0.5$ |
| Multipath | $1.0$ | $3.0$ | $1.5$ |
| Receiver noise | $0.4$ | $1.2$ | $0.6$ |
| **UERE (RSS)** | $\mathbf{4.24}$ | $\mathbf{3.36}$ | $\mathbf{5.99}$ |

Check the first column by hand. Square each entry: $0.36 + 0.36 + 16 + 0.09 + 1 + 0.16 = 17.97$. The square root is $4.24\,\mathrm{m}$.

**Reading the columns.** The single-frequency budget is ruled by the ionosphere. The broadcast **[[Klobuchar|klobuchar]]** model removes only about half the delay, and the $4\,\mathrm{m}$ left over outweighs everything else combined.

The dual-frequency column wipes out the ionosphere but pays for it. The ionosphere-free combination amplifies noise and multipath about three times, so those entries triple. The total improves less than you might hope — $3.4\,\mathrm{m}$ against $4.2\,\mathrm{m}$ — until multipath is cut by better antennas and siting.

The legacy column shows how far satellite clocks and orbits have come: about $2\,\mathrm{m}$ each in the 1990s, about half a meter now.

**The modern picture.** A good receiver with two frequencies, a **[[choke-ring antenna|choke-ring]]** and a $15^\circ$ elevation mask reaches a UERE near $1\,\mathrm{m}$. Multiplied by a typical dilution of precision of $1.5$ to $2$, that is where the "one to two meters" of modern GNSS comes from.
:::

## Elevation dependence and weighting

The errors are not the same for every satellite. A satellite low in the sky sends its signal on a long, slanted path. At $10^\circ$ elevation, the path through the ionosphere is $2.8$ times the straight-up path, and through the troposphere $5.8$ times — so the model errors grow with it. Echoes off the ground are worst at low elevation. The antenna is less sensitive there, so $C/N_0$ is lower and the noise higher.

A common way to fold all this in is an elevation-dependent standard deviation:

$$
\sigma_i^2 = a^2 + \frac{b^2}{\sin^2 \theta_i},
$$

where $\theta_i$ ("theta i") is the satellite's elevation angle and $a$, $b$ are tuning constants. Take $a = 0.4\,\mathrm{m}$ and $b = 0.6\,\mathrm{m}$.

- At the zenith, $\sin 90^\circ = 1$, so $\sigma = \sqrt{0.16 + 0.36} = 0.72\,\mathrm{m}$.
- At $20^\circ$, $\sin^2 = 0.117$, so $\sigma = 1.8\,\mathrm{m}$.
- At $10^\circ$, $\sin^2 = 0.0302$, so $\sigma = 3.5\,\mathrm{m}$.
- At $5^\circ$, $\sin^2 = 0.00760$, so $\sigma = 6.9\,\mathrm{m}$.

These go into a **weighted least-squares** solution, in which noisy measurements count for less; the least-squares module covers how. They are also the argument for an **[[elevation mask|elevation-mask]]**: a satellite below about $5^\circ$ gives a measurement so noisy that it hurts the fix more than it helps the geometry.

::: warning
Do not put the receiver clock into the UERE, and do not count a term twice. The receiver clock bias is common to every pseudorange at a given moment. The solver estimates it exactly, and its effect on the answer is described by the time dilution of precision, not the range budget. In the same way, the delay in the antenna cable is the same for all satellites and disappears into the clock estimate, so it costs nothing in position. The UERE counts only errors that *differ* between satellites, because those are what the geometry turns into position error.
:::

::: note Why the UERE is only a first sketch
The UERE is quoted as a standard deviation, but its parts are not all bell-curve shaped, not all zero on average, and not all fresh from one second to the next. Multipath at a fixed site is a slowly changing bias that repeats each sidereal day with the geometry. The ionospheric leftover is shared by satellites in the same part of the sky and lasts for minutes. Ephemeris error changes only when a new broadcast set arrives, every two hours. A filter that treats pseudorange errors as independent at $1\,\mathrm{Hz}$ will trust its own error estimate more than it should. The consistency tests from the Kalman filtering module are how you catch that.
:::

## Check yourself

::: check
A receiver's clock is $2.3\,\mathrm{ms}$ ahead of GPS time. Left uncorrected, what does that do to each pseudorange? Does it spoil the position fix?
:::

::: answer
Each pseudorange grows by $c \times 2.3\,\mathrm{ms} = 689.5\,\mathrm{km}$, the same for every satellite.

It does not spoil the position if the solver treats the clock bias as a fourth unknown, because a shared offset in every measurement is exactly what that unknown soaks up. It would be a disaster for a solver that assumed the clock was right and tried to intersect spheres with the measured radii.
:::

::: check
A satellite's broadcast clock polynomial has $a_{f0} = -1.8 \times 10^{-4}\,\mathrm{s}$ and $a_{f1} = 2.0 \times 10^{-12}$. What correction, in meters, applies $3{,}600\,\mathrm{s}$ after $t_{oc}$, and which way does it move the pseudorange?
:::

::: answer
Add the two terms:

$\delta t_{sat} = -180{,}000\,\mathrm{ns} + 2.0 \times 10^{-12} \times 3{,}600\,\mathrm{s} = -180{,}000\,\mathrm{ns} + 7.2\,\mathrm{ns} = -179{,}992.8\,\mathrm{ns}$.

Times $c$, that is $-53{,}960.5\,\mathrm{m}$.

The equation has $-c\,\delta t_{sat}$ in it, so the correction adds $c\,\delta t_{sat}$ back. Adding a negative number shortens the pseudorange, by $53.96\,\mathrm{km}$. That makes sense: a satellite clock running *behind* stamps the signal with an earlier time, so the signal seems to have left earlier and the raw pseudorange was too long.
:::

::: check
A single-frequency receiver's budget has satellite clock $0.6\,\mathrm{m}$, ephemeris $0.6\,\mathrm{m}$, ionospheric leftover $3.5\,\mathrm{m}$, troposphere $0.3\,\mathrm{m}$, multipath $0.8\,\mathrm{m}$ and noise $0.3\,\mathrm{m}$. What is the UERE, and what one change would cut it most?
:::

::: answer
Square, add, and take the root:

$$
\sqrt{0.36 + 0.36 + 12.25 + 0.09 + 0.64 + 0.09} = \sqrt{13.79} = 3.71\,\mathrm{m}.
$$

The ionosphere supplies $12.25$ of the $13.79$ square meters. Removing it — with a second frequency, or with differential corrections from a nearby reference station — is the only change that matters. Halving every *other* term would leave the UERE above $3.5\,\mathrm{m}$.
:::

::: check
Why is the satellite position in the pseudorange equation taken at the transmit time rather than the receive time? How big is the difference?
:::

::: answer
The signal received at $t_{rx}$ left the satellite about $\rho/c \approx 67$ to $86\,\mathrm{ms}$ earlier, and the range must be measured from where the satellite was at that earlier moment. At $3{,}874\,\mathrm{m/s}$ the satellite moves about $270\,\mathrm{m}$ during the trip. Using $t_{rx}$ misplaces it by that much, which is up to tens of meters along the line of sight.

Separately, the Earth-fixed frame turns about $5\,\mathrm{\mu rad}$ during the trip, and the Sagnac correction — up to about $\pm 33\,\mathrm{m}$ at mid-latitudes — takes care of that.
:::

::: check
An engineer wants to lower the elevation mask from $10^\circ$ to $2^\circ$ to add two more satellites. With the weighting model $\sigma^2 = 0.4^2 + 0.6^2/\sin^2\theta$, how noisy are those measurements, and what is the case against?
:::

::: answer
At $2^\circ$, $\sin\theta = 0.0349$ and $\sin^2\theta = 0.001218$. So

$$
\sigma = \sqrt{0.16 + 0.36/0.001218} = \sqrt{0.16 + 295.6} = 17.2\,\mathrm{m},
$$

against $3.5\,\mathrm{m}$ at $10^\circ$ and $0.72\,\mathrm{m}$ at the zenith. Such a measurement is about twenty-four times noisier than a zenith one, and carries far more multipath and unmodelled tropospheric delay than the formula admits. Weighted properly, it barely changes the answer. Unweighted, it drags the fix around by meters. The extra satellites improve the geometry only on paper.
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
| Elevation weighting | $\sigma_i^2 = a^2 + b^2/\sin^2\theta_i$; with $a = 0.4$, $b = 0.6\,\mathrm{m}$: $0.72\,\mathrm{m}$ at zenith, $3.5\,\mathrm{m}$ at $10^\circ$ |
| Position error | $\approx$ DOP $\times$ UERE, where DOP is a pure geometry factor |

The corrected pseudorange still holds the receiver clock bias — nearly a thousand kilometers of it in the example. The next lesson explains why that term cannot be calibrated away, why it is treated as a fourth unknown rather than a nuisance, and what you get for free once you have estimated it.

::: context pseudo-word A "false" range
*Pseudo* is Greek for "false", as in *pseudonym*, a false name. A pseudorange has the units and roughly the size of a range, but it is not one: it is a difference of two clock readings, scaled by $c$, and it includes both clocks' errors. The word is a standing warning not to treat the number as a distance until the clock terms are dealt with.
:::

::: context ecef ECEF: a frame that spins with Earth
The **Earth-centered, Earth-fixed** frame, ECEF, puts the origin at Earth's center, the $z$-axis through the North Pole, and the $x$-axis through the point where the equator meets the Greenwich meridian. The axes turn with Earth, so a launch pad has fixed coordinates in it — convenient for maps, and the frame GPS positions are given in. The price is that the frame is rotating, which is where the Sagnac correction comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="70" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="180" cy="110" rx="70" ry="20" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="180" y1="110" x2="180" y2="22"/>
    <line x1="180" y1="110" x2="144.1" y2="138.2"/>
    <line x1="180" y1="110" x2="278.7" y2="120.3"/>
  </g>
  <polygon points="180,16 175,26 185,26" fill="#1f2a44"/>
  <polygon points="140,141.3 146.5,132.4 150.3,139.2" fill="#1f2a44"/>
  <polygon points="284,121 273.6,115.2 272.7,124.7" fill="#1f2a44"/>
  <circle cx="156.1" cy="128.8" r="4" fill="#b4232c"/>
  <text x="190" y="24" font-size="12" fill="#1f2a44">z: through the North Pole</text>
  <text x="20" y="160" font-size="12" fill="#b4232c">x: toward Greenwich</text>
  <text x="20" y="175" font-size="12" fill="#b4232c">on the equator</text>
  <text x="250" y="140" font-size="12" fill="#1f2a44">y: 90° east</text>
  <text x="258" y="70" font-size="11" fill="#6c7a93">axes turn with Earth</text>
</svg>
```
:::

::: context relativity Clocks that run fast in orbit
Einstein's theories say two things about a satellite clock. Weaker gravity high up makes it run *faster* than a clock on the ground, by about $45.7\,\mathrm{\mu s}$ a day at GPS altitude. Its orbital speed makes it run *slower*, by about $7.2\,\mathrm{\mu s}$ a day. The net gain is about $38\,\mathrm{\mu s}$ a day — over $11\,\mathrm{km}$ of range. That constant part is removed before launch: the clocks are built to tick at $10.22999999543\,\mathrm{MHz}$ so they read $10.23\,\mathrm{MHz}$ from the ground. The $\Delta t_r$ term handles what is left, which varies as the slightly oval orbit carries the satellite higher and lower.
:::

::: context tec Counting electrons
Total electron content, TEC, is the number of free electrons in a column one square meter across along the signal's path. The ionosphere's delay is proportional to it: $I = 40.3\,\mathrm{TEC}/f^2$ in SI units. One TEC unit is $10^{16}$ electrons per square meter, and at the L1 frequency it adds $40.3 \times 10^{16}/(1575.42 \times 10^6)^2 = 0.162\,\mathrm{m}$ of delay. The Sun's ultraviolet light makes these electrons, which is why TEC peaks in the afternoon and in years of high solar activity.
:::

::: context sagnac The ground moves while the signal flies
During the $70$ to $86\,\mathrm{ms}$ the signal is in flight, Earth turns and carries the receiver eastward — about $30\,\mathrm{m}$ at Cape Canaveral's latitude. A receiver moving away from the satellite meets the signal later, so the range is longer; moving toward it, shorter. That is why the correction is negative for satellites in the east and positive for those in the west. The effect is named after Georges Sagnac, who in 1913 measured the same kind of time difference for light sent both ways around a spinning loop.
:::

::: context quadrature Adding like Pythagoras
Two independent errors of $3\,\mathrm{m}$ and $4\,\mathrm{m}$ do not usually add to $7\,\mathrm{m}$ — they would both have to push the same way at the same time. On average they combine like the sides of a right triangle: $\sqrt{3^2 + 4^2} = 5\,\mathrm{m}$. With more errors, keep adding squares. A useful effect: the biggest term dominates. A $4\,\mathrm{m}$ error plus a $1\,\mathrm{m}$ error gives only $\sqrt{17} = 4.12\,\mathrm{m}$, so small terms barely matter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="100,140 220,140 220,50" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="2"/>
  <rect x="208" y="128" width="12" height="12" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="160" font-size="13" fill="#1f2a44" text-anchor="middle">4 m</text>
  <text x="230" y="100" font-size="13" fill="#1f2a44">3 m</text>
  <text x="145" y="86" font-size="13" fill="#b4232c" text-anchor="middle">√(3² + 4²) = 5 m</text>
  <text x="300" y="40" font-size="12" fill="#6c7a93" text-anchor="middle">not 3 + 4 = 7</text>
</svg>
```
:::

::: context klobuchar A model that sends its own coefficients
The Klobuchar model, designed by John Klobuchar in the 1980s, describes the ionosphere's delay with a smooth daily bump centered on 2 p.m. local time. Its eight coefficients are worked out on the ground and broadcast in subframe 4 of the navigation message, so any single-frequency receiver can apply it with a few lines of arithmetic. Being so simple, it removes only about half of the real delay on average; storms and uneven patches of ionosphere defeat it.
:::

::: context choke-ring A trap for echoes
A **choke-ring antenna** sits inside several deep, concentric metal rings. Signals that bounce off the ground arrive from below the horizon at a low angle, and the rings — each about a quarter wavelength deep — cancel them before they reach the antenna, while the direct signals from above get through. Survey and reference stations use them to push multipath down to a few centimeters on the carrier. They are far too heavy and bulky for a rocket, which is one reason multipath is harder to beat on a vehicle.
:::

::: context elevation-mask Why low satellites cost so much
A signal from a satellite low in the sky crosses much more atmosphere than one from overhead. In a flat-layer picture, the path through a layer is its thickness divided by $\sin(\text{elevation})$: twice as long at $30^\circ$, nearly six times at $10^\circ$. An **elevation mask** is a cutoff angle below which the receiver ignores satellites, trading a little geometry for a lot less error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="340" height="40" fill="#f2b880" fill-opacity="0.45"/>
  <text x="20" y="64" font-size="12" fill="#1f2a44">atmosphere layer</text>
  <line x1="10" y1="180" x2="350" y2="180" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="180" x2="60" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="60" y1="180" x2="302.5" y2="40" stroke="#b4232c" stroke-width="2"/>
  <line x1="60" y1="80" x2="60" y2="40" stroke="#1d6fd1" stroke-width="5"/>
  <line x1="233.2" y1="80" x2="302.5" y2="40" stroke="#b4232c" stroke-width="5"/>
  <circle cx="60" cy="180" r="5" fill="#1f2a44"/>
  <path d="M 100 180 A 40 40 0 0 0 94.6 160" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="106" y="172" font-size="12" fill="#1f2a44">30°</text>
  <text x="68" y="112" font-size="12" fill="#1d6fd1">zenith: 1×</text>
  <text x="200" y="126" font-size="12" fill="#b4232c">30° elevation: 2×</text>
  <text x="60" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">receiver</text>
</svg>
```
:::
