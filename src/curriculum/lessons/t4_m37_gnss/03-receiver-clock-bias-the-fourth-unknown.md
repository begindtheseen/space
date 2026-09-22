---
id: l03-receiver-clock-bias-the-fourth-unknown
title: The receiver clock as the fourth unknown
minutes: 18
covers:
  - Receiver clock bias as the fourth unknown
---

The corrected pseudorange at the end of the previous lesson still carried $936{,}915\,\mathrm{m}$ that had nothing to do with geometry: the receiver's clock was $3.125\,\mathrm{ms}$ ahead of GPS time. Every other term in the pseudorange equation was corrected by a model, a broadcast parameter or a second frequency. This one cannot be, and the reason is not carelessness in receiver design but physics: a clock good enough to be trusted to a few nanoseconds for hours is an atomic clock, and the satellites carry those precisely so that the receiver does not have to.

The resolution is to stop treating the clock error as a nuisance to be removed and start treating it as a quantity to be measured, exactly like the position. The state vector of a GNSS fix is not $(x, y, z)$ but $(x, y, z, b)$, with $b = c\,\delta t_{rx}$ the clock bias in metres, and the minimum number of satellites is four because there are four unknowns. This lesson shows what goes wrong if you pretend otherwise — the failure is quiet and large — and what you gain when you do it right: nanosecond time as a by-product, a velocity solution with the same structure, and a set of degraded modes for when four satellites are not available.

## What a receiver clock can and cannot do

A receiver's time base is an oscillator, and an oscillator is described by its fractional frequency error $y = \Delta f/f$. A time offset accumulates as the integral of $y$, so a constant fractional error $y$ produces a clock drift of $y$ seconds per second, which in range units is $c\,y$ metres per second of pseudorange drift, the same for every satellite. The table shows what that means across the technologies a receiver might carry:

| Oscillator | Fractional error $y$ | Pseudorange drift $c\,y$ | Apparent L1 Doppler $f_{L1}\,y$ |
| --- | --- | --- | --- |
| Crystal (TCXO), uncalibrated frequency offset | $10^{-6}$ | $300\,\mathrm{m/s}$ | $1{,}575\,\mathrm{Hz}$ |
| TCXO, short-term stability | $10^{-9}$ | $0.30\,\mathrm{m/s}$ | $1.6\,\mathrm{Hz}$ |
| Oven-controlled crystal (OCXO) | $10^{-10}$ | $3\,\mathrm{cm/s}$ | $0.16\,\mathrm{Hz}$ |
| Chip-scale atomic clock | $10^{-11}$ | $3\,\mathrm{mm/s}$ | $0.016\,\mathrm{Hz}$ |
| Rubidium | $10^{-12}$ | $0.3\,\mathrm{mm/s}$ | $1.6\,\mathrm{mHz}$ |
| Caesium (satellite class) | $10^{-13}$ | $0.03\,\mathrm{mm/s}$ | $0.16\,\mathrm{mHz}$ |

A temperature-compensated crystal, which is what almost every receiver carries, is off by a part per million or so out of the box and wanders by tenths of a part per million with temperature. That is $300\,\mathrm{m}$ of pseudorange per second, or the width of a landing pad every ten milliseconds. Even after you estimate and remove the frequency offset, the residual instability of $10^{-9}$ moves the range by $30\,\mathrm{cm}$ per second. There is no calibration that fixes this, because the error is not constant. What a receiver can do is estimate the offset *at every epoch* from the measurements themselves, which is exactly what solving for $b$ does. Between epochs the estimate is stale by $c\,y\,\Delta t$: a tenth of a second later a TCXO's bias has moved by $30\,\mathrm{m}$ if uncalibrated, $3\,\mathrm{cm}$ if the frequency offset has been estimated too. The clock is, in effect, re-measured every time.

::: key
The receiver clock bias $b = c\,\delta t_{rx}$ (metres) is the fourth unknown, alongside the three coordinates of $\mathbf{x}$. It cannot be calibrated away because a crystal oscillator's frequency error, $10^{-6}$ or so and temperature-dependent, produces a pseudorange drift of about $300\,\mathrm{m/s}$; only an atomic clock holds time to nanoseconds for more than seconds. Four unknowns need four satellites.
:::

## Three spheres and a wrong answer

Suppose you ignored the clock. Three pseudoranges would then define three spheres centred on the satellites, and their common intersection would be the receiver. This is how the problem is often drawn, and it hides the failure completely, because three spheres in general position *do* meet at a point — the wrong one. A common error in all three radii does not make the spheres miss each other; it moves their intersection.

::: example A two-dimensional receiver with a clock error
Put a receiver in a plane at $(1.0, 2.0)\,\mathrm{km}$ with a clock bias of $b = 0.5\,\mathrm{km}$, and three transmitters at $(0, 20)$, $(15, 12)$ and $(-10, 15)\,\mathrm{km}$. The true ranges are $18.028$, $17.205$ and $17.029\,\mathrm{km}$; the pseudoranges are each $0.5\,\mathrm{km}$ longer.

Treat the pseudoranges as radii and intersect the circles in pairs. The pair $(1, 2)$ meets at $(0.754, 1.488)$, the pair $(1, 3)$ at $(1.195, 1.511)$, and the pair $(2, 3)$ at $(0.910, 1.280)\,\mathrm{km}$ (each pair also meets at a second point $30\,\mathrm{km}$ away, easily rejected). Three different answers, none of them the truth, and the spread among them — about half a kilometre — is the clock bias made visible. Any two of the circles are consistent with each other; only all three together reveal that something is wrong, and only if you look.

Now solve for three unknowns $(x, y, b)$ instead. The three equations $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + b$ are linearised and iterated exactly as the next lesson does in three dimensions. Starting from the origin with $b = 0$: after one step $(1.093, 2.188, 0.716)$, after two $(1.0007, 2.0015, 0.5018)$, after three the errors are below a millimetre, and after four the update is $1.5 \times 10^{-7}\,\mathrm{km}$. The recovered bias is $0.500\,\mathrm{km}$ and the position is exact.

With only two transmitters the problem is underdetermined and the failure has a definite shape: for every assumed bias there is a position that fits both pseudoranges exactly. Assuming $b = 0$ gives $(0.754, 1.488)$; $b = 1.0$ gives $(1.248, 2.517)$; $b = 2.0$ gives $(1.753, 3.565)\,\mathrm{km}$. All have zero residual. The solutions lie along a curve, and nothing in the two measurements picks a point on it.
:::

In three dimensions the same thing happens with one more dimension of freedom for the error to hide in, and it hides in the vertical.

::: example Ignoring the clock at Cape Canaveral
Take the receiver at Cape Canaveral from the previous lesson and four satellites at (azimuth, elevation) of $(135^\circ, 60^\circ)$, $(45^\circ, 30^\circ)$, $(225^\circ, 25^\circ)$ and $(315^\circ, 45^\circ)$, at the GPS radius of $26{,}560\,\mathrm{km}$. Generate exact pseudoranges with a clock bias of $30\,\mathrm{km}$ — a receiver clock $100\,\mathrm{\mu s}$ fast, unremarkable for a crystal.

Solve for position only, using the first three satellites and taking the pseudoranges as true ranges. The three spheres intersect exactly: the residual is zero to machine precision. The intersection is $83.1\,\mathrm{km}$ from the receiver — $38.9\,\mathrm{km}$ east, $34.9\,\mathrm{km}$ south, and $64.6\,\mathrm{km}$ *below* the surface. Three consistent measurements, an exactly consistent answer, and a position inside the Earth's mantle.

Repeat with the $3.125\,\mathrm{ms}$ bias from the previous lesson, $936.9\,\mathrm{km}$. The three spheres still intersect exactly — residual zero — at a point $2{,}342\,\mathrm{km}$ away, $1{,}811\,\mathrm{km}$ below the surface. Now solve the same four pseudoranges for four unknowns, starting the iteration from the centre of the Earth with $b = 0$: six iterations, position error $7 \times 10^{-9}\,\mathrm{m}$, bias error $4 \times 10^{-9}\,\mathrm{m}$. The unknown that was poisoning the solution is recovered to the nanometre once it is given a slot in the state vector.
:::

The direction of the error is not an accident. All the satellites are above the receiver, so a common increase in every range can be traded, almost perfectly, for a downward shift of the receiver: moving down makes every satellite farther away at once. The clock bias and the height are nearly the same direction in measurement space, which is why the "clock ignored" solutions are dominated by height error, why the vertical component of a GNSS fix is always the weakest, and why the time dilution of precision and the vertical dilution of precision are large together — an idea the dilution-of-precision lesson makes exact.

::: warning
An exactly determined solution — as many measurements as unknowns — has zero residual whatever the measurements contain. Three satellites solved for three coordinates fit perfectly and put you $80\,\mathrm{km}$ underground; four satellites solved for four unknowns also fit perfectly, and they are right only because the model is now complete. The residuals of an exactly determined fit carry no information about its correctness. That is the argument for a fifth satellite, and for the integrity monitoring lesson later in the module.
:::

## Two ways to handle the bias: estimate it, or difference it away

Once $b$ is admitted as an unknown there are two mathematically equivalent ways to deal with it.

**Estimate it.** Write the four (or more) equations $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + b$, linearise about a guess, and solve. The derivative of $\rho_i$ with respect to $b$ is exactly $1$ for every satellite, so the Jacobian acquires a column of ones — the fourth column of the geometry matrix that the next lesson assembles, and the reason satellites at different elevations are so unequal in value: the clock column is the same for all of them, so what distinguishes a satellite's contribution is how different its line-of-sight direction is from everyone else's.

**Difference it away.** Subtract satellite 1's pseudorange from each of the others:

$$
\rho_i - \rho_1 = \|\mathbf{s}_i - \mathbf{x}\| - \|\mathbf{s}_1 - \mathbf{x}\| .
$$

The bias cancels. Each equation now says the *difference* of distances to two satellites is a known constant, which is the definition of a hyperboloid of revolution with the two satellites as foci. Four satellites give three hyperboloids, and their intersection is the receiver. This is the time-difference-of-arrival picture, and it is the right mental model for what the measurements determine: not distances, but differences of distances.

The two are equivalent because differencing is a linear, invertible transformation of the same data. Estimation is preferred in practice because differencing correlates the noise — every difference contains satellite 1's noise — and a correct weighted solution would have to carry that correlation, whereas estimating $b$ directly leaves the measurement errors independent and the weights diagonal. The sibling module on least squares treats why that matters; here the point is that "four satellites" is not a rule to memorise but a count of unknowns.

## What you get for free

Solving for $b$ turns a receiver into a clock. After the fix, $b/c$ is the offset between the receiver's clock and GPS time, and GPS time is steered to within tens of nanoseconds of UTC, with the offset broadcast in the navigation message. The precision of that time is the time dilution of precision times the UERE, divided by $c$: with a UERE of $4\,\mathrm{m}$ and a TDOP of $1.5$, about $6\,\mathrm{m}$ or $20\,\mathrm{ns}$; with a UERE of $1\,\mathrm{m}$ and a TDOP of $1.2$, $4\,\mathrm{ns}$. This is why GNSS became the world's time-distribution system — telecommunications networks, power grids and financial exchanges take their time from it — and why a launch range's timing system, which must stamp telemetry from dozens of sites to microseconds, is a set of GNSS-disciplined oscillators.

The velocity solution has the same structure and the same fourth unknown. Differentiate the pseudorange equation in time, with $\mathbf{e}_i = (\mathbf{s}_i - \mathbf{x})/\|\mathbf{s}_i - \mathbf{x}\|$ the unit line of sight:

$$
\dot\rho_i = \mathbf{e}_i^{\mathsf T}(\dot{\mathbf{s}}_i - \dot{\mathbf{x}}) + \dot b ,
$$

where $\dot\rho_i$ is measured from the carrier Doppler ($\dot\rho_i = -\lambda f_{d,i}$), $\dot{\mathbf{s}}_i$ is known from the ephemeris, and the unknowns are the receiver velocity $\dot{\mathbf{x}}$ and the clock *drift* $\dot b = c\,y$ in metres per second. Four Doppler measurements determine them, with a Jacobian identical to the position problem's. The drift is not small: an uncalibrated TCXO's $10^{-6}$ appears as $1{,}575\,\mathrm{Hz}$ of Doppler on every satellite, indistinguishable from a receiver velocity of $300\,\mathrm{m/s}$ along every line of sight at once, which no physical velocity can be. Solve for $\dot b$ and the velocity comes out to centimetres per second; forget it and the velocity is nonsense.

## When four satellites are not available

The count of unknowns can be reduced instead of the count of satellites raised. Each method replaces a measurement with an assumption, and each is honest only as long as the assumption is.

**Clock coasting, or clock-hold.** If the receiver's oscillator is good enough, the clock bias can be *propagated* from the last full fix instead of re-estimated: $\hat b(t) = \hat b_0 + \hat{\dot b}\,(t - t_0)$. Three satellites then suffice for position. The error in the propagated bias grows as $c\,\sigma_y\,\Delta t$, where $\sigma_y$ is the oscillator's stability over the interval:

| Stability $\sigma_y$ | $10\,\mathrm{s}$ | $100\,\mathrm{s}$ | $1{,}000\,\mathrm{s}$ |
| --- | --- | --- | --- |
| $10^{-9}$ (TCXO) | $3.0\,\mathrm{m}$ | $30\,\mathrm{m}$ | $300\,\mathrm{m}$ |
| $10^{-10}$ (OCXO) | $0.30\,\mathrm{m}$ | $3.0\,\mathrm{m}$ | $30\,\mathrm{m}$ |
| $10^{-11}$ (chip-scale atomic) | $3\,\mathrm{cm}$ | $0.30\,\mathrm{m}$ | $3.0\,\mathrm{m}$ |
| $10^{-12}$ (rubidium) | $3\,\mathrm{mm}$ | $3\,\mathrm{cm}$ | $0.30\,\mathrm{m}$ |

The coast error enters the position mostly in the vertical, for the reason given above. A TCXO buys seconds of clock-hold at metre accuracy; an OCXO buys a minute or two; an atomic clock buys tens of minutes. A launch-site reference receiver, or a receiver on a vehicle whose antenna switching briefly costs it a satellite, is a case for an OCXO, and the trade is weight and power against seconds of graceful degradation.

**Height aiding.** If the altitude is known — from a barometric altimeter, from a terrain database, or because the vehicle is sitting on a pad of surveyed elevation — the constraint $\|\mathbf{x}\| \approx R_E + h$ is a fourth equation. It behaves like a measurement from a satellite at the centre of the Earth with a perfect clock, and it constrains the direction the real satellites constrain worst. With height aiding, three satellites give horizontal position and clock; a barometer accurate to $10\,\mathrm{m}$ contributes a $10\,\mathrm{m}$ vertical measurement, far better than a poor constellation's own vertical geometry.

**A disciplined clock plus height** brings the requirement to two satellites for a horizontal fix, which is how some aviation and marine receivers ride through short outages. Beyond that, the navigation is carried by whatever else the vehicle has — for a launch vehicle, its inertial navigation system — and GNSS resumes when the count recovers.

::: note
The satellites face the same problem from the other side, and solve it the expensive way. Each carries rubidium or caesium clocks with stabilities near $10^{-13}$ to $10^{-14}$ per day, the control segment measures their offsets from monitor stations with known positions and atomic clocks of their own, and the broadcast polynomial of the previous lesson is the result. The whole system is one enormous time-transfer network: a few dozen atomic clocks in orbit and on the ground, and billions of crystal oscillators that borrow their time four satellites at a time.
:::

## Check yourself

::: check
A receiver with a crystal oscillator reports that all eight of its pseudoranges are increasing at $310\,\mathrm{m/s}$ more than the satellite motion accounts for. What is happening, and is the receiver moving?
:::

::: answer
A common rate in every pseudorange is the signature of clock drift, not of motion: no velocity moves a receiver away from eight satellites in eight different directions at once. The oscillator is running slow by $310/c = 1.03 \times 10^{-6}$, a typical uncalibrated TCXO offset. The velocity solution, which carries $\dot b$ as a fourth unknown, will assign the $310\,\mathrm{m/s}$ to $\dot b$ and report whatever genuine velocity remains.
:::

::: check
Why does ignoring the receiver clock in a three-satellite fix produce an error mostly in height rather than in horizontal position?
:::

::: answer
Every visible satellite is above the receiver, so every line-of-sight unit vector has a positive upward component. A common increase in all the ranges — a positive clock bias — can be reproduced by moving the receiver downward, which lengthens every range simultaneously. In measurement space the clock direction (all ones) and the vertical direction (all the upward components) are nearly parallel, so a solver without a clock unknown absorbs the bias into height. In the worked example, $30\,\mathrm{km}$ of bias became $64.6\,\mathrm{km}$ of height error against $52\,\mathrm{km}$ of horizontal error, and with a wider spread of elevations the ratio would be more lopsided still.
:::

::: check
A receiver loses its fourth satellite for $45\,\mathrm{s}$. With an OCXO of stability $2 \times 10^{-10}$ over that interval, what clock error accumulates in clock-hold mode, and roughly where in the position does it appear?
:::

::: answer
$c\,\sigma_y\,\Delta t = 299{,}792{,}458 \times 2 \times 10^{-10} \times 45 = 2.7\,\mathrm{m}$ of range-equivalent clock error. It appears predominantly as a height error of similar size, with a smaller horizontal component, because the clock and vertical directions are nearly aligned. A TCXO at $10^{-9}$ would have accumulated $13.5\,\mathrm{m}$ in the same interval.
:::

::: check
Explain why differencing pseudoranges against a reference satellite and estimating the clock bias directly give the same position, and why the second is preferred.
:::

::: answer
Differencing is a linear, invertible transformation of the measurement set: the $n$ pseudoranges and the $n - 1$ differences plus any one original pseudorange contain exactly the same information. A least-squares solution correctly weighted for each formulation gives the same estimate. But the differences share the reference satellite's noise, so they are correlated, and a correct solution must carry a full covariance rather than a diagonal one. Estimating $b$ directly keeps the measurements independent, the weights diagonal, and the fourth column of the Jacobian equal to ones — cleaner, and it delivers the time solution as a by-product.
:::

::: check
A GNSS timing receiver at a fixed, surveyed site tracks ten satellites. How many unknowns does it have, and what precision of time can it deliver with a UERE of $0.5\,\mathrm{m}$?
:::

::: answer
One. Its position is known, so the only unknown is the clock bias $b$, and every pseudorange is a direct measurement of it: $b_i = \tilde\rho_i - \|\mathbf{s}_i - \mathbf{x}\|$. Averaging ten independent measurements with $\sigma = 0.5\,\mathrm{m}$ gives $0.5/\sqrt{10} = 0.16\,\mathrm{m}$, or $0.53\,\mathrm{ns}$, per epoch; over time the atmospheric and multipath errors, which do not average like white noise, limit it to a few nanoseconds. This is how timing laboratories and launch ranges distribute time.
:::

## Summary

| Item | Statement |
| --- | --- |
| The fourth unknown | $b = c\,\delta t_{rx}$ in metres; state vector $(x, y, z, b)$; four satellites minimum |
| Why it cannot be calibrated | Fractional frequency error $y$ gives pseudorange drift $c\,y$: $300\,\mathrm{m/s}$ for a $10^{-6}$ crystal, $3\,\mathrm{cm/s}$ for an OCXO at $10^{-10}$ |
| Ignoring it | Three spheres still meet at a point, with zero residual, tens to thousands of km away, mostly in height |
| Estimation | $\partial\rho_i/\partial b = 1$: the Jacobian gains a column of ones |
| Differencing | $\rho_i - \rho_1 = \|\mathbf{s}_i - \mathbf{x}\| - \|\mathbf{s}_1 - \mathbf{x}\|$: hyperboloids; same information, correlated noise |
| Time transfer | $\sigma_t = \mathrm{TDOP} \times \sigma_{\text{UERE}}/c$: about $20\,\mathrm{ns}$ for $4\,\mathrm{m}$ and $1.5$; a few ns for a good site |
| Velocity | $\dot\rho_i = \mathbf{e}_i^{\mathsf T}(\dot{\mathbf{s}}_i - \dot{\mathbf{x}}) + \dot b$, with $\dot\rho_i = -\lambda f_{d,i}$; clock drift is the fourth unknown |
| Clock-hold | Bias propagated; error $c\,\sigma_y\,\Delta t$: $30\,\mathrm{m}$ per $100\,\mathrm{s}$ for $10^{-9}$, $3\,\mathrm{m}$ for $10^{-10}$, $0.3\,\mathrm{m}$ for $10^{-11}$ |
| Height aiding | Known altitude is a measurement from a "satellite at the Earth's centre" with a perfect clock; three satellites then suffice |

The next lesson writes the four equations out, linearises them, derives the Jacobian row $[-\mathbf{e}_i^{\mathsf T},\ 1]$, and iterates a real four-satellite fix from the centre of the Earth to the millimetre.
