---
id: l13-orbit-determination-at-the-whiteboard
title: "Orbit determination: observability, batch and sequential"
minutes: 22
covers:
  - "orbit determination: observability, batch least squares versus sequential filtering, measurement types"
---

Imagine a firefly in a dark garden. It blinks a few times, and from those few glimpses you try to work out the path it is flying. One blink tells you almost nothing. Several blinks close together show a short, nearly straight streak. Blinks spread out over a longer time finally show the curve.

**Orbit determination**, or **OD** (said "O-D"), is that problem for a spacecraft: working out its orbit — its position and velocity at some moment, from which the whole path follows — out of a handful of noisy measurements. It is where the estimation machinery of the last seven lessons meets real tracking data. Satellite operators run it routinely, and every mission's **[[ephemeris|ephemeris]]** comes out of it.

The domain round asks three things. What are the measurements, and what does each carry? What does **observability** — whether the data can pin the state down — mean when the data are range and range-rate from one ground station? And how do you choose between processing a whole arc at once and processing it as it arrives? The third has a crisp answer; the first two hold the depth.

## The measurement types, and what each carries

Six types cover almost everything, and they boil down to two physical quantities: *how far* and *which direction*.

A little notation first. The spacecraft is at position $\mathbf{r}$ with velocity $\mathbf{v}$. A tracking station is at $\mathbf{r}_s$ with velocity $\mathbf{v}_s$. The **partial derivative** $\partial\rho/\partial\mathbf{r}$, read "partial rho by partial r", says how much the measurement $\rho$ changes when you nudge the spacecraft's position a little in each direction. Those partials are the rows of the measurement matrix $\mathbf{H}$ in the filters you already know.

**Range.** The straight-line distance from station to spacecraft, $\rho = \lVert\mathbf{r} - \mathbf{r}_s\rVert$ ($\rho$ is "rho"; the double bars mean "length of"). A station measures it by **[[timing a radio signal|ranging]]** out and back. Its partials are

$$\frac{\partial\rho}{\partial\mathbf{r}} = \hat{\mathbf{u}}, \qquad \frac{\partial\rho}{\partial\mathbf{v}} = \mathbf{0},$$

where $\hat{\mathbf{u}}$ ("u hat") is the unit **line-of-sight** vector, an arrow of length one pointing from station to spacecraft. So range carries information along the line of sight and *none* sideways to it, and none about velocity, at the point where you linearize.

**Range-rate**, from the **[[Doppler shift|doppler]]**. It is how fast the range is changing. With $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$ (the relative velocity) and $\dot\rho = \hat{\mathbf{u}}\cdot\Delta\mathbf{v}$ (read "rho dot"),

$$\frac{\partial\dot\rho}{\partial\mathbf{r}} = \frac{\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}}{\rho}, \qquad \frac{\partial\dot\rho}{\partial\mathbf{v}} = \hat{\mathbf{u}}.$$

The velocity partial points along the line of sight. The position partial is the relative velocity with its line-of-sight part removed, so it points **[[perpendicular to it|los-picture]]**, scaled by $1/\rho$. That is exactly the sideways information range lacks — which is why the two together are so much stronger than either alone.

::: note Why the position partial points sideways
Nudge the spacecraft sideways by a small $\delta$. The line of sight swings by an angle of about $\delta/\rho$, so $\hat{\mathbf{u}}$ tilts, and the tilted $\hat{\mathbf{u}}$ now picks up a different share of $\Delta\mathbf{v}$. That change is the sideways part of $\Delta\mathbf{v}$ times $\delta/\rho$. Nudge it *along* the line of sight instead, and $\hat{\mathbf{u}}$ does not turn at all, so $\dot\rho$ does not change. Hence the partial is $(\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}})/\rho$: the sideways part of the relative velocity, divided by the distance.
:::

**Angles** — azimuth and elevation (compass direction and height above the horizon), or right ascension and declination (the same idea measured against the stars). Direction only: sliding the spacecraft along the line of sight changes neither angle. A single fixed site can take a million angle measurements and still know nothing about distance. Range enters an angles-only solution only through the observer's own motion between looks, or through a genuinely separate second site.

**GNSS pseudorange** (GNSS, said "G-N-S-S", means GPS and its cousins) is a range to a navigation satellite with the receiver's clock error riding along in it, so it brings a receiver-clock state. **Inter-satellite range** is a range whose far end is also moving and also being estimated. **[[VLBI|vlbi]] delay** is a direction measurement that gets very high precision from a long physical baseline between two antennas rather than from one dish.

::: key Six measurement types, two physical quantities
Range, GNSS pseudorange and inter-satellite range are the same quantity — a line-of-sight distance — differing in what sits at the far end. Angles and VLBI delay are direction-only measurements. Range-rate is the time derivative of the first family. Every one reduces to a line-of-sight vector, or a baseline projected onto one, differentiated with respect to the state.
:::

## Observability, as it actually behaves

Try to tell the size of a circle from a tiny piece of its edge. A short piece looks almost straight, so many different circles fit it. You get *an* answer, but not a trustworthy one.

The textbook test of observability is a rank condition: can the data determine every state at all? In practice it rarely helps, because real cases are almost never cleanly undeterminable. They are badly **conditioned**. The **[[condition number|condition-number]]** of a matrix is the ratio of its strongest direction to its weakest; a huge one means some combination of states is barely pinned down. A short arc does not fail loudly: the equations solve, the iteration converges, six numbers come back. But some combination of them carries an enormous uncertainty, and nothing tells you which unless you look at the covariance's **eigenstructure** — its principal directions and sizes — rather than its **trace** (the sum of its variances) or its largest diagonal entry.

Two practical habits follow.

**Non-dimensionalize before you solve.** In kilometers and seconds, the condition number is dominated by the units rather than the geometry: the velocity columns pick up a multiplier of order $10^3$–$10^4$ seconds from the state transition matrix that the position columns do not. So scale position by a distance unit and velocity by distance over a time unit. For Earth, $\mathrm{DU} = 6378.137\,\mathrm{km}$ (Earth's radius) and

$$\mathrm{TU} = \sqrt{\mathrm{DU}^3/\mu} = 806.8\,\mathrm{s},$$

with $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, Earth's gravity constant. The fake gap disappears. The converged answer does not change; only the conditioning improves.

**Read the covariance in a frame that means something.** The standard is **[[radial, in-track, cross-track|ric-frame]]**, because the in-track direction is almost always the worst, and saying so is more useful than a single trace.

::: example What one pass actually determines
A circular orbit at $500\,\mathrm{km}$ altitude, inclination $51.6^\circ$ (the tilt of the orbit to the equator, the Space Station's value), tracked from one station at $35^\circ$ latitude. The station only sees the spacecraft above $10^\circ$ elevation, and samples every $10\,\mathrm{s}$. Range noise $\sigma_\rho = 10\,\mathrm{m}$; range-rate noise $\sigma_{\dot\rho} = 1\,\mathrm{mm/s}$. The **[[state transition matrix|stm]]** comes from two-body dynamics, the epoch is the middle of the data arc, and the information matrix $\boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$ (defined in the next section) is formed in non-dimensional units.

| Data | Observations | $\operatorname{cond}(\boldsymbol{\Lambda})$ | Radial $\sigma$ | In-track $\sigma$ | Cross-track $\sigma$ |
| --- | --- | --- | --- | --- | --- |
| One $7.2$-minute pass, range only | $44$ | $3.0\times10^{15}$ | $6400\,\mathrm{km}$ | $8900\,\mathrm{km}$ | $8100\,\mathrm{km}$ |
| Same pass, range and range-rate | $88$ | $1.3\times10^{14}$ | $17.6\,\mathrm{km}$ | $24.4\,\mathrm{km}$ | $22.2\,\mathrm{km}$ |
| Two passes, $1.8$-hour arc | $162$ | $8.7\times10^{6}$ | $0.36\,\mathrm{m}$ | $3.65\,\mathrm{m}$ | $0.22\,\mathrm{m}$ |
| Four passes, $8.4$-hour arc | $326$ | $4.1\times10^{5}$ | $0.037\,\mathrm{m}$ | $0.126\,\mathrm{m}$ | $0.057\,\mathrm{m}$ |

**First row.** $7.2$ minutes at one sample per $10\,\mathrm{s}$ is $44$ samples. Forty-four ranges good to ten meters determine essentially nothing. A condition number of $3\times10^{15}$ is at the edge of what double-precision arithmetic can handle (about $4.5\times10^{15}$), so the matrix is numerically singular. The thousands of kilometers beside it are not a result; they are a warning.

**Second row.** Adding range-rate shrinks the uncertainties by a factor of about $360$ ($6400/17.6 \approx 364$), but the condition number improves only about twentyfold ($3.0\times10^{15}/1.3\times10^{14} \approx 23$), and one short pass still leaves tens of kilometers.

**Third row.** One more pass, about an orbit later (a $500\,\mathrm{km}$ orbit takes about $95$ minutes), takes the uncertainty from tens of kilometers to meters. The sensors did not change. The *geometry* did: the second pass sees the orbit from a different place along it.

**Is the second row real?** Push the epoch state one standard deviation along the worst-determined direction — $37.4\,\mathrm{km}$, mostly out of the station's viewing plane — and recompute every predicted observation. Each range moves by about $0.04$ of its own noise and each range-rate by about $0.15$ of its own. The total **chi-square** change (the sum of each squared change divided by its noise variance) over all $88$ observations is $1.000$, exactly what a one-sigma direction must give. The data genuinely cannot see that direction; the covariance is telling the truth.

**Two caveats.** The dynamics are pure two-body with no force-model error, and the station location is perfect. So these numbers are optimistic: a real solution also carries drag, gravity-field and station errors that do not shrink with more data. The point is the [[ratios between the rows|geometry-bars]], not the absolute figures: observability in OD is bought with geometry and arc length, not with sensor precision.
:::

## Batch least squares

Picture a scatter of dots on graph paper and a ruler. **Batch** processing looks at all the dots at once and lays the ruler where it fits best overall. That is **[[least squares|gauss-ceres]]**: pick the answer that makes the sum of squared misfits smallest.

For an orbit, every measurement is taken at a different time, so each one's partials are first mapped back to a single **epoch** (reference time) through the **state transition matrix** $\boldsymbol{\Phi}$ ("Phi"). Then everything is added up, and one set of **normal equations** is solved for a correction to the epoch state:

$$\boldsymbol{\Lambda}\,\delta\mathbf{x}_0 = \mathbf{N}, \qquad \boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i), \qquad \mathbf{N} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i\,\delta y_i.$$

Symbol by symbol:

- $\delta\mathbf{x}_0$ — the correction to the epoch state;
- $\boldsymbol{\Phi}_i = \boldsymbol{\Phi}(t_i, t_0)$ — the state transition matrix from the epoch $t_0$ to observation time $t_i$;
- $\mathbf{H}_i$ — the measurement partial at $t_i$;
- $\mathbf{W}_i$ — the weight, usually $\mathbf{R}_i^{-1}$, the inverse of the measurement noise covariance;
- $\delta y_i$ — the residual: measured minus predicted.

$\boldsymbol{\Phi}$ comes from integrating the **variational equations** $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$ alongside the trajectory, with $\mathbf{A} = \partial\mathbf{f}/\partial\mathbf{x}$, the slope of the dynamics.

The problem is nonlinear, so this is repeated: apply the correction, re-propagate, recompute every partial, solve again. That loop is **Gauss–Newton** iteration. **Re-linearizing the entire arc on every iteration is exactly why batch tolerates a poor initial guess.** A sequential filter commits to its linearization at each step as it goes, and never looks back.

Two more terms. Any suspected error source can be added as an extra **solve-for** parameter with its own column — a drag coefficient, a station range bias, a small thrust. And a parameter the data barely constrains can instead be held fixed at its best value while its uncertainty is still carried honestly into the reported covariance. That makes it a **consider** parameter.

::: warning Solving for what the data cannot see
It is tempting to add every error source as a solve-for. But a parameter the data cannot see does not sit quietly: it soaks up noise and corrupts the epoch state estimated alongside it. If the data barely constrain it, make it a consider parameter instead.
:::

## Sequential filtering

**Sequential** processing is the extended or unscented Kalman filter of the earlier lessons, applied to the same problem, one measurement at a time.

**Predict:** propagate the state, and the covariance through the same variational equations: $\mathbf{P}^- = \boldsymbol{\Phi}\mathbf{P}^+\boldsymbol{\Phi}^{\mathsf{T}} + \mathbf{Q}$.

**Update:** innovation $\mathbf{y} = \mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}^-)$, its covariance $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, gain $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, and the Joseph form for $\mathbf{P}^+$ — because a long recursion is exactly where the short covariance update drifts into claiming negative variances.

The one choice special to OD is $\mathbf{Q}$, the process noise. Two-body and $J_2$ dynamics ($J_2$ is Earth's equatorial bulge) have no random forcing, so a filter that trusted them completely would run with $\mathbf{Q} = \mathbf{0}$. Its covariance would then shrink to nothing and it would stop listening — the failure of lesson seven. Real filters carry process noise for the forces the model leaves out, often as a Gauss–Markov acceleration state, called **[[dynamic model compensation|dmc]]**, rather than white noise, because unmodeled drag and solar radiation pressure are correlated in time.

The price of one-at-a-time processing is sensitivity. To initialization, because each step commits to its local linearization. To outliers, because one bad observation enters with the full gain and then moves the point where the next partials are worked out. So **residual editing** — gating on $\mathbf{y}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{y}$ against a chi-squared threshold and rejecting what fails — is not optional in an operational sequential filter.

::: key Batch versus sequential
Batch processes an entire arc at once, is robust to a poor initial guess because it re-linearizes the whole arc on every Gauss–Newton iteration, and is the standard for post-pass reconstruction and definitive ephemerides. A sequential filter processes measurements as they arrive and is what you run in real time and onboard, at the cost of sensitivity to initialization and to outliers. Operational systems routinely run both: a periodic batch solution to anchor accuracy, a sequential filter to stay current between batch runs.
:::

::: example "You have a full pass of range and range-rate, a bad initial guess, and you need the best trajectory you can get. What do you run?"
**A weak answer:** "I would use a Kalman filter, since it is the standard estimator and processes the measurements efficiently."

It reaches for the tool the candidate knows. Both conditions in the question — full pass in hand, bad initial guess — point the other way.

**A strong answer:**

"Batch least squares, and the two conditions are exactly why.

The data are all in hand, so nothing is real-time, and the initial guess is bad, which batch handles and a sequential filter does not. Batch is a Gauss–Newton iteration: it re-propagates the trajectory and recomputes every partial across the whole arc on each pass, so a poor first linearization is replaced by a better one. An EKF linearizes once per measurement about its current estimate and never revisits it. With a bad start, its early partials describe the sensitivity somewhere the vehicle is not — and the covariance collapse that follows shuts out the very measurements that would have fixed it.

Concretely: accumulate the normal equations at one epoch, $\boldsymbol{\Lambda}\delta\mathbf{x}_0 = \mathbf{N}$ with $\boldsymbol{\Lambda} = \sum(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$, $\boldsymbol{\Phi}$ from the variational equations, and iterate to convergence. I would non-dimensionalize first, since in kilometers and seconds the conditioning is set by units, not geometry.

Two things about the result. First, one pass from one station is weak geometry whatever the estimator — in a clean simulation with ten-meter ranging, a seven-minute pass leaves tens of kilometers of uncertainty, and a second pass an orbit later is worth more than better sensors. So I would report radial, in-track and cross-track and say which direction the data did not constrain. Second, I would check the residuals for structure: a systematic pattern across the pass means a force-model or station-location error, and the fix is a solve-for or consider parameter, not a tighter weight.

The sequential filter belongs in the other half of the operation: real time between batch solutions, and onboard, where there is no arc to hold. The normal arrangement is both — batch to anchor, filter to stay current."

**What the interviewer learns:** both stated conditions read, the mechanism behind batch's robustness, the algorithm plus an implementation detail, geometry flagged apart from the estimator, a residual check, and the rejected method put where it belongs.
:::

## Check yourself

::: check
Give the measurement partials for range and for range-rate, and say what each measurement type does and does not constrain.
:::

::: answer
Let $\boldsymbol{\rho} = \mathbf{r} - \mathbf{r}_s$, $\rho = \lVert\boldsymbol{\rho}\rVert$, $\hat{\mathbf{u}} = \boldsymbol{\rho}/\rho$ and $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$.

**Range:** $\partial\rho/\partial\mathbf{r} = \hat{\mathbf{u}}$ and $\partial\rho/\partial\mathbf{v} = \mathbf{0}$. It constrains position along the line of sight only — nothing about velocity or sideways position.

**Range-rate:** $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}$ and $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})/\rho$. It constrains velocity along the line of sight and position *perpendicular* to it, the latter weakening as $1/\rho$.

They complement each other: range-rate supplies exactly the sideways position information range lacks. That is why a pass with both is far better conditioned than a pass with either.
:::

::: check
Why can a short tracking arc give a converged, well-behaved solution that is nonetheless worthless, and what would you look at to detect it?
:::

::: answer
Because poor observability in OD is almost never a rank deficiency; it is bad conditioning. The normal equations still solve, Gauss–Newton still converges, and six numbers come out. But one or more directions in state space are barely constrained, so the estimate along them is close to whatever the prior said, not something the data determined. Nothing in the fit announces this.

To detect it: look at the condition number of the normal-equation matrix *after* non-dimensionalizing (in raw kilometers and seconds it reflects units, not geometry). And look at the eigenstructure of the covariance, not its trace or largest diagonal entry, reported in radial, in-track and cross-track components so the weak direction has a physical name.
:::

::: check
Write the batch normal equations, define every symbol, and say which part of the algorithm makes it tolerant of a poor initial estimate.
:::

::: answer
$\boldsymbol{\Lambda}\,\delta\mathbf{x}_0 = \mathbf{N}$, with $\boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$ and $\mathbf{N} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i\,\delta y_i$.

Here $\delta\mathbf{x}_0$ is the correction to the epoch state, $\mathbf{H}_i$ the measurement partial at $t_i$, $\boldsymbol{\Phi}_i = \boldsymbol{\Phi}(t_i,t_0)$ the state transition matrix from the variational equations, $\mathbf{W}_i$ the weight (normally $\mathbf{R}_i^{-1}$), and $\delta y_i$ the residual.

The tolerance comes from the *iteration*. This is Gauss–Newton: after each correction the trajectory is re-propagated and every $\mathbf{H}_i$ and $\boldsymbol{\Phi}_i$ is recomputed about the improved reference, so a poor first linearization is replaced on the second pass. A sequential filter has no such step — it linearizes about its current estimate as each measurement arrives and never revisits it.
:::

::: check
A sequential OD filter is run with $\mathbf{Q} = \mathbf{0}$ because "gravity is deterministic". What happens, and what is the standard fix?
:::

::: answer
With no process noise the predicted covariance is $\boldsymbol{\Phi}\mathbf{P}^+\boldsymbol{\Phi}^{\mathsf{T}}$, and nothing adds uncertainty between measurements. Over many updates the covariance shrinks toward zero and the gain with it. The filter stops listening to new data while its reported uncertainty keeps shrinking. Meanwhile every force the model omits — drag, solar radiation pressure, a small maneuver, a truncated gravity field — builds up as real error that nothing corrects.

"Gravity is deterministic" is true and beside the point: $\mathbf{Q}$ does not represent randomness in gravity; it represents everything the dynamics model leaves out. The fix is process noise sized to the omitted forces. Because those forces are correlated in time, the usual form is a Gauss–Markov acceleration state — dynamic model compensation — rather than white noise on velocity.
:::

::: check
You must choose an estimator for onboard navigation on a spacecraft with no ground contact for hours at a time. Which do you choose, and what makes it safe?
:::

::: answer
A sequential filter, because there is no alternative: onboard there is no stored arc to re-process and no operator to restart an iteration, and the state is needed continuously.

Safety means covering the two things sequential processing is bad at:

- **Initialization.** Start from a solution made by something more robust — an uploaded ground batch solution, or an onboard initial-orbit-determination fix — not a guess, because a poor start is what triggers covariance collapse.
- **Outliers.** Gate every measurement on $\mathbf{y}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{y}$ against a chi-squared threshold and reject what fails, because one accepted bad observation moves the estimate and so moves where the next partials are evaluated.

Beyond those: the Joseph form or a square-root implementation for a recursion that runs for hours, process noise sized to the unmodeled forces so the filter never stops listening, and a NIS monitor so the ground can check consistency when contact resumes.
:::

## Summary

| Item | Content |
| --- | --- |
| Range partials | $\partial\rho/\partial\mathbf{r} = \hat{\mathbf{u}}$, $\partial\rho/\partial\mathbf{v} = \mathbf{0}$ |
| Range-rate partials | $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})/\rho$, $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}$ |
| Angles | Direction only; a single fixed site never gets range from them |
| Observability | A matter of degree, not rank; the failure is silent and shows only in the covariance eigenstructure |
| Conditioning | Non-dimensionalize first ($\mathrm{DU} = 6378.137\,\mathrm{km}$, $\mathrm{TU} = 806.8\,\mathrm{s}$); report in radial, in-track, cross-track |
| Worked geometry | One $7$-minute pass with range and range-rate leaves tens of kilometers; a second pass brings it to meters |
| Batch | $\boldsymbol{\Lambda}\delta\mathbf{x}_0 = \mathbf{N}$, $\boldsymbol{\Lambda} = \sum(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$; Gauss–Newton re-linearizes the whole arc |
| Sequential | EKF or UKF with $\boldsymbol{\Phi}$ from the same variational equations, Joseph form, gating, Gauss–Markov process noise |
| The choice | Batch for post-pass reconstruction and a poor initial guess; sequential for real time and onboard; operationally both |
| Extra parameters | Solve-for adds a column; consider keeps the parameter fixed but carries its uncertainty |

That completes the module. Every subject on the list — margins, the three filters, tuning and consistency, attitude determination, the multiplicative filter, strapdown inertial, PID, orbit determination — has been given the way an interviewer asks for it: the statement, the mechanism, the number, and a sanity check. What remains is the [[drill|the-drill]]. The exercises are written to be repeated, not completed once, because on the day, the gap between knowing the Kalman gain and writing, explaining and checking it under time pressure is set by how many times you have done it before.

::: context ephemeris A table of where things will be
An ephemeris is a table or formula giving an object's position at each time. The word comes from the Greek for "daily", because early astronomers' tables listed the planets' places day by day. A **definitive ephemeris** is the best after-the-fact reconstruction of where a spacecraft actually was, usually from a batch fit; a **predicted ephemeris** projects forward so antennas know where to point.
:::

::: context ranging Measuring distance with a stopwatch
A ground station sends a coded radio signal up; the spacecraft's transponder sends it straight back. The round-trip time, multiplied by the speed of light and halved, is the range. Light covers about $30\,\mathrm{cm}$ in a nanosecond, so ten meters of range accuracy means timing the round trip to about $67$ nanoseconds. Real systems also correct for delays in the station's own electronics and in the atmosphere.
:::

::: context doppler The ambulance siren, in space
A siren sounds higher as it comes toward you and lower as it moves away. Radio waves do the same. For two-way tracking at X-band, about $8.4\,\mathrm{GHz}$, a range-rate of $1\,\mathrm{mm/s}$ shifts the returned frequency by $2 \times 0.001 \times 8.4\times10^9 / (3\times10^8) \approx 0.056\,\mathrm{Hz}$. Stations measure shifts that small, which is why range-rate is often the most precise measurement they make.
:::

::: context los-picture Along the line, and across it
Range feels a nudge along the line of sight. Range-rate's position partial feels a nudge across it — the sideways part of the relative velocity, divided by the distance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="170" x2="120" y2="170" stroke="#6c7a93" stroke-width="3"/>
  <polygon points="30,170 50,170 40,154" fill="#6c7a93"/>
  <text x="40" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">station</text>
  <line x1="40" y1="160" x2="280" y2="50" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="280" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="280" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">spacecraft</text>
  <line x1="280" y1="50" x2="321" y2="31" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="327,28 315,28 320,38" fill="#1d6fd1"/>
  <text x="250" y="100" font-size="12" fill="#1d6fd1" text-anchor="end">range: along û</text>
  <line x1="280" y1="50" x2="297" y2="86" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,93 292,84 302,81" fill="#b4232c"/>
  <text x="306" y="112" font-size="12" fill="#b4232c" text-anchor="middle">range-rate:</text>
  <text x="306" y="127" font-size="12" fill="#b4232c" text-anchor="middle">across, ÷ ρ</text>
  <text x="150" y="150" font-size="11" fill="#6c7a93">line of sight, length ρ</text>
</svg>
```
:::

::: context vlbi Two dishes, one giant eye
VLBI, "very long baseline interferometry", records the same radio signal at two antennas thousands of kilometers apart and measures the tiny difference in arrival time. That delay equals the baseline length times the cosine of the angle between the baseline and the source direction, divided by the speed of light — so it measures direction very finely. NASA's Deep Space Network uses a version called delta-DOR, alternating between a spacecraft and a nearby quasar, to steer probes toward Mars.
:::

::: context condition-number How many digits you lose
A rough rule: a condition number of $10^k$ means you can lose about $k$ digits of accuracy when you solve with that matrix. Double-precision numbers carry about $16$ digits. So a condition number of $10^{15}$ leaves roughly one trustworthy digit, and anything near $4.5\times10^{15}$ (one over the smallest step double precision can resolve near $1$) leaves none. That is why the first row of the table is a warning, not a result.
:::

::: context ric-frame Radial, in-track, cross-track
Three directions that ride along with the spacecraft: **radial** points straight away from Earth's center, **in-track** points along the direction of motion, and **cross-track** points out of the orbit plane. In-track is usually the worst determined: a tiny error in orbital speed changes the period, so the timing error grows every orbit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="150" r="46" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="110" y="155" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <path d="M 10 150 A 100 100 0 0 1 210 150" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="181" cy="79" r="7" fill="white" stroke="#1f2a44" stroke-width="2"/>
  <line x1="186" y1="74" x2="220" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polygon points="225,35 213,39 221,47" fill="#b4232c"/>
  <text x="230" y="36" font-size="12" fill="#b4232c">radial</text>
  <line x1="188" y1="86" x2="222" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="227,125 215,121 223,113" fill="#1d6fd1"/>
  <text x="232" y="132" font-size="12" fill="#1d6fd1">in-track (motion)</text>
  <circle cx="160" cy="92" r="7" fill="white" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="160" cy="92" r="2" fill="#1f2a44"/>
  <text x="152" y="72" font-size="12" fill="#1f2a44" text-anchor="end">cross-track</text>
  <text x="152" y="86" font-size="11" fill="#6c7a93" text-anchor="end">(out of page)</text>
</svg>
```
:::

::: context stm The state transition matrix
$\boldsymbol{\Phi}(t, t_0)$ answers one question: if I nudge the starting state a little, how much does the state at time $t$ move? Each column is the effect of nudging one starting component. For an orbit, a small nudge to the starting velocity grows into a position change that keeps growing around the orbit, which is why the velocity columns get large and why unit scaling matters.
:::

::: context geometry-bars The table as bars
In-track uncertainty for the four rows of the table, on a log scale — each gridline is ten times the one to its left. Sensors fixed; only the data arc changed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3">
    <line x1="133" y1="18" x2="133" y2="140"/><line x1="159" y1="18" x2="159" y2="140"/><line x1="185" y1="18" x2="185" y2="140"/><line x1="211" y1="18" x2="211" y2="140"/><line x1="237" y1="18" x2="237" y2="140"/><line x1="263" y1="18" x2="263" y2="140"/><line x1="289" y1="18" x2="289" y2="140"/><line x1="315" y1="18" x2="315" y2="140"/><line x1="341" y1="18" x2="341" y2="140"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="114" y="36" text-anchor="end">1 pass, range</text>
    <text x="114" y="66" text-anchor="end">1 pass, + rate</text>
    <text x="114" y="96" text-anchor="end">2 passes</text>
    <text x="114" y="126" text-anchor="end">4 passes</text>
  </g>
  <rect x="120" y="22" width="219.7" height="20" fill="#b4232c"/>
  <rect x="120" y="52" width="153.1" height="20" fill="#f2b880"/>
  <rect x="120" y="82" width="53.6" height="20" fill="#8fb8f0"/>
  <rect x="120" y="112" width="15.6" height="20" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="330" y="36" text-anchor="end" fill="white">8900 km</text>
    <text x="279" y="66">24 km</text>
    <text x="180" y="96">3.65 m</text>
    <text x="142" y="126">0.13 m</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="159" y="156">1 m</text><text x="237" y="156">1 km</text><text x="315" y="156">1000 km</text>
  </g>
</svg>
```
:::

::: context gauss-ceres How least squares found a lost planet
In 1801 the astronomer Giuseppe Piazzi spotted a new object, Ceres, and tracked it for a few weeks before it vanished into the Sun's glare. Many tried to predict where it would reappear. The 24-year-old Carl Friedrich Gauss fitted an orbit to the scattered observations, and astronomers found Ceres again near his predicted spot. Gauss later published the method of least squares and said he had been using it since 1795. Orbit determination and least squares have been partners ever since.
:::

::: context dmc Dynamic model compensation
Some forces are hard to model exactly: air drag in low orbit changes with solar activity, and sunlight pushes on the spacecraft with a force that depends on its shape and attitude. Rather than pretend these are zero, the filter carries an extra acceleration state that drifts slowly (a Gauss–Markov process, as in the previous lesson's bias states) and lets the measurements estimate it. It soaks up what the model misses without letting the covariance collapse.
:::

::: context the-drill Why drills work
Interviewers ask these questions at a whiteboard, with a clock running and someone watching. Knowing an equation when you read it and producing it cold are different skills, and only the second is tested. Writing the filters out from blank paper each week, as the module's exercises ask, turns the second skill into the first.
:::
