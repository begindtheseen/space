---
id: l13-orbit-determination-at-the-whiteboard
title: "Orbit determination: observability, batch and sequential"
minutes: 20
covers:
  - "orbit determination: observability, batch least squares versus sequential filtering, measurement types"
---

Orbit determination is where the estimation machinery of the last seven lessons meets real tracking data, and the domain round asks about it in three parts: what the measurements are and what each one carries, what observability actually means when the data are range and range-rate from a ground station rather than a textbook rank condition, and how you choose between processing a whole arc at once and processing it as it arrives.

The third question is the one with a crisp answer and it is worth having ready, because it is the kind of question that is really asking whether you have run either of these on real data. The other two are where the depth is.

## The measurement types, and what each carries

Six types cover almost everything, and they reduce to two physical quantities.

**Range.** A line-of-sight distance $\rho = \lVert\mathbf{r} - \mathbf{r}_s\rVert$ from a station at $\mathbf{r}_s$. Its partials are

$$\frac{\partial\rho}{\partial\mathbf{r}} = \hat{\mathbf{u}}, \qquad \frac{\partial\rho}{\partial\mathbf{v}} = \mathbf{0},$$

with $\hat{\mathbf{u}}$ the unit line-of-sight vector. So a range measurement carries information along the line of sight and *exactly none* transverse to it or about velocity, at the linearisation point.

**Range-rate**, from Doppler. With $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$ and $\dot\rho = \hat{\mathbf{u}}\cdot\Delta\mathbf{v}$,

$$\frac{\partial\dot\rho}{\partial\mathbf{r}} = \frac{\Delta\mathbf{v} - \dot\rho\,\hat{\mathbf{u}}}{\rho}, \qquad \frac{\partial\dot\rho}{\partial\mathbf{v}} = \hat{\mathbf{u}}.$$

The velocity partial is along the line of sight; the position partial is *perpendicular* to it, scaled by $1/\rho$ — which is exactly the transverse information range lacks, and is why the two together are so much stronger than either alone.

**Angles** — azimuth and elevation, or right ascension and declination. Direction only, so every partial with respect to $\rho$ itself is zero. A single fixed site can take a million angle measurements and still know nothing about range; range enters an angles-only solution only through the observer's own motion between looks, or through a genuinely separate baseline.

**GNSS pseudorange** is a range to a satellite whose clock error rides along in the measurement, so it comes with a receiver-clock state. **Inter-satellite range** is a range whose far end is also moving and also estimated. **VLBI delay** is a direction measurement that achieves very high angular precision by using a long physical baseline rather than one antenna's resolution.

::: key Six measurement types, two physical quantities
Range, GNSS pseudorange and inter-satellite range are the same quantity — a line-of-sight distance — differing in what sits at the far end. Angles and VLBI delay are direction-only measurements. Range-rate is the time derivative of the first family. Every one reduces to a line-of-sight vector, or a baseline projected onto one, differentiated with respect to the state.
:::

## Observability, as it actually behaves

The textbook version is a rank condition, and it is nearly useless operationally, because the interesting cases are never rank-deficient — they are badly conditioned. A short arc does not fail loudly: the normal equations still solve, the iteration still converges, and the answer still comes back with six numbers in it. What has happened instead is that some combination of state components carries an enormous formal uncertainty, and unless you look at the covariance's eigenstructure rather than at its trace or its largest diagonal entry, nothing tells you which.

Two practical habits follow.

**Non-dimensionalise before you solve.** In kilometres and seconds, the condition number of the normal-equation matrix is dominated by the units rather than by the geometry, because the velocity columns pick up a multiplier of order $10^3$–$10^4$ seconds from the state transition matrix that the position columns do not. Scale position by a distance unit and velocity by distance over time — for Earth, $\mathrm{DU} = 6378.137\,\mathrm{km}$ and $\mathrm{TU} = \sqrt{\mathrm{DU}^3/\mu} = 806.8\,\mathrm{s}$ — and the artificial gap disappears. The converged estimate is unchanged; only the conditioning improves.

**Read the covariance in a frame that means something.** Radial, in-track, cross-track is the standard, because the in-track direction is almost always the worst one and saying so is more useful than reporting a trace.

::: example What one pass actually determines
A circular orbit at $500\,\mathrm{km}$ altitude, inclination $51.6^\circ$, tracked from a single station at $35^\circ$ latitude with an elevation mask of $10^\circ$, sampled every $10\,\mathrm{s}$. Range noise $\sigma_\rho = 10\,\mathrm{m}$, range-rate noise $\sigma_{\dot\rho} = 1\,\mathrm{mm/s}$. The state transition matrix comes from the two-body variational equations, the epoch is the midpoint of the data arc, and the information matrix is $\boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$, formed in non-dimensional units.

| Data | Observations | $\operatorname{cond}(\boldsymbol{\Lambda})$ | Radial $\sigma$ | In-track $\sigma$ | Cross-track $\sigma$ |
| --- | --- | --- | --- | --- | --- |
| One $7.2$-minute pass, range only | $44$ | $3.0\times10^{15}$ | $6400\,\mathrm{km}$ | $8900\,\mathrm{km}$ | $8100\,\mathrm{km}$ |
| Same pass, range and range-rate | $88$ | $1.3\times10^{14}$ | $17.6\,\mathrm{km}$ | $24.4\,\mathrm{km}$ | $22.2\,\mathrm{km}$ |
| Two passes, $1.8$-hour arc | $162$ | $8.7\times10^{6}$ | $0.36\,\mathrm{m}$ | $3.65\,\mathrm{m}$ | $0.22\,\mathrm{m}$ |
| Four passes, $8.4$-hour arc | $326$ | $4.1\times10^{5}$ | $0.037\,\mathrm{m}$ | $0.126\,\mathrm{m}$ | $0.057\,\mathrm{m}$ |

Read the first two rows. Forty-four range measurements good to ten metres determine essentially nothing — a condition number of $3\times10^{15}$ is at the edge of double precision, so the matrix is numerically singular and the kilometre figures beside it are not a result, they are a warning. Adding range-rate improves it by ten orders of magnitude in conditioning and still leaves tens of kilometres of formal uncertainty from a single short pass.

Then read the third row. One more pass, ninety minutes later, moves the formal uncertainty from tens of kilometres to metres. Nothing about the sensors changed; the *geometry* changed, because the second pass views the orbit from a completely different place along it.

It is worth confirming that the second row is real rather than a numerical artefact. Perturb the epoch state by one standard deviation along the worst-determined direction — $37.4\,\mathrm{km}$, mostly out of the station's viewing plane — and recompute every predicted observation. Each range residual moves by about $0.04$ of its own standard deviation and each range-rate residual by about $0.15$ of its own, and the total chi-square change over all $88$ observations comes to $1.000$, exactly as it must for a one-sigma direction. The data genuinely cannot see that combination; the covariance is telling the truth.

Two caveats on these numbers, and they matter. The dynamics here are pure two-body with no force-model error, and the station is perfectly known — so these are optimistic, and a real solution also carries drag, gravity-field and station-location errors that do not shrink with more data. And the point of the table is the *ratios between the rows*, not the absolute figures: what it demonstrates is that observability in orbit determination is bought with geometry and arc length, not with sensor precision.
:::

## Batch least squares

Batch processes the whole arc at once. Map every measurement partial back to a single epoch through the state transition matrix, accumulate, and solve one normal-equation system for a correction to the epoch state:

$$\boldsymbol{\Lambda}\,\delta\mathbf{x}_0 = \mathbf{N}, \qquad \boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i), \qquad \mathbf{N} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i\,\delta y_i,$$

with $\boldsymbol{\Phi}_i = \boldsymbol{\Phi}(t_i, t_0)$ the state transition matrix from the epoch to the observation time, $\mathbf{H}_i$ the measurement partial at $t_i$, $\mathbf{W}_i$ the weight (usually $\mathbf{R}_i^{-1}$) and $\delta y_i$ the residual. $\boldsymbol{\Phi}$ comes from integrating the variational equations $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$ alongside the trajectory, with $\mathbf{A} = \partial\mathbf{f}/\partial\mathbf{x}$.

Because the problem is nonlinear, this is iterated: apply the correction, re-propagate, recompute every partial, solve again — Gauss–Newton. **The re-linearisation of the entire arc at each iteration is exactly why batch tolerates a poor initial guess**, where a sequential filter, which commits to its linearisation at each step as it goes, does not.

Two more things worth knowing by name. Any suspected error source can be added as an extra **solve-for** parameter with its own column — a drag coefficient, a station range bias, a small thrust. And a parameter the data barely constrains can instead be left fixed at its best value while its uncertainty is still propagated honestly into the reported covariance, which makes it a **consider** parameter. Solving for something the data cannot see lets it absorb noise and corrupt the epoch state it is estimated alongside.

## Sequential filtering

Sequential processing is the extended or unscented Kalman filter of the earlier lessons, applied to the same problem. Predict by propagating the state and, through the same variational equations, the covariance: $\mathbf{P}^- = \boldsymbol{\Phi}\mathbf{P}^+\boldsymbol{\Phi}^{\mathsf{T}} + \mathbf{Q}$. Update with $\mathbf{y} = \mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}^-)$, $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, and the Joseph form for $\mathbf{P}^+$, because a long recursion is exactly where the short covariance update goes indefinite.

The one genuinely orbit-determination-specific choice is $\mathbf{Q}$. Two-body and $J_2$ dynamics have no random forcing of their own, so a filter that trusted its dynamics completely would run with $\mathbf{Q} = \mathbf{0}$ — and would then collapse its covariance to nothing and stop listening, which is the failure of lesson seven. Real filters carry process noise for the forces the model omits, often as a Gauss–Markov acceleration state (dynamic model compensation) rather than as white noise, because unmodelled drag and solar radiation pressure are correlated in time rather than white.

The cost of processing measurements one at a time is sensitivity: to initialisation, because each step commits to its local linearisation, and to outliers, because a single bad observation enters with the full gain and then moves the point at which the next set of partials is evaluated. Residual editing — gating on $\mathbf{y}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{y}$ against a chi-squared threshold — is not optional in an operational sequential filter.

::: key Batch versus sequential
Batch processes an entire arc at once, is robust to a poor initial guess because it re-linearises the whole arc on every Gauss–Newton iteration, and is the standard for post-pass reconstruction and definitive ephemerides. A sequential filter processes measurements as they arrive and is what you run in real time and onboard, at the cost of sensitivity to initialisation and to outliers. Operational systems routinely run both: a periodic batch solution to anchor accuracy, a sequential filter to stay current between batch runs.
:::

::: example "You have a full pass of range and range-rate, a bad initial guess, and you need the best trajectory you can get. What do you run?"
**A weak answer:** "I would use a Kalman filter, since it is the standard estimator for this and it processes the measurements efficiently."

It answers the question with the tool the candidate knows, and the two conditions in the question — full pass available, bad initial guess — both point the other way.

**A strong answer:**

"Batch least squares, and the two conditions in the question are exactly why.

The data are already all in hand, so there is nothing real-time about the problem and no value in processing them in order. And the initial guess is bad, which is the condition batch handles and a sequential filter does not. The reason is specific: batch is a Gauss–Newton iteration that re-propagates the trajectory and recomputes every partial derivative across the whole arc at each pass, so a linearisation that was poor at the first iteration is replaced by a better one at the second. An extended Kalman filter linearises once per measurement about its own current estimate and never revisits it, so a bad starting point means the early partials describe the sensitivity somewhere the vehicle is not — and the covariance collapse that follows closes the filter to the measurements that would have fixed it.

Concretely I would accumulate the normal equations mapped to a single epoch, $\boldsymbol{\Lambda}\delta\mathbf{x}_0 = \mathbf{N}$ with $\boldsymbol{\Lambda} = \sum(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$, taking $\boldsymbol{\Phi}$ from the variational equations integrated with the trajectory, and iterate to convergence. I would non-dimensionalise the state first, since in kilometres and seconds the conditioning is dominated by units rather than geometry.

Two things I would say about the result rather than only producing it. First, one pass from one station is a weak geometry regardless of estimator — in a clean two-body simulation with ten-metre ranging, a single seven-minute pass leaves tens of kilometres of formal uncertainty, and the second pass an orbit later is worth far more than better sensors would be. So I would report the covariance in radial, in-track and cross-track components and say plainly which direction the data did not constrain, rather than quoting a single number. Second, I would check the residuals for structure before trusting the fit: a systematic signature across the pass means a force model or a station-location error, and the right response is a solve-for or consider parameter, not a tighter weight.

Where I would use the sequential filter is the other half of the operation: running in real time between batch solutions, and onboard, where there is no option to hold the arc. That is the normal arrangement — a periodic batch to anchor the accuracy, a filter to stay current."

**What the interviewer learns:** the candidate reads both stated conditions, gives the mechanism behind batch's robustness rather than asserting it, names the concrete algorithm and one numerical detail that shows they have implemented it, warns about the geometry independently of the estimator choice, proposes a residual check before accepting the answer, and places the rejected method where it does belong.
:::

## Check yourself

::: check
Give the measurement partials for range and for range-rate, and say what each measurement type does and does not constrain.
:::

::: answer
With $\boldsymbol{\rho} = \mathbf{r} - \mathbf{r}_s$, $\rho = \lVert\boldsymbol{\rho}\rVert$, $\hat{\mathbf{u}} = \boldsymbol{\rho}/\rho$ and $\Delta\mathbf{v} = \mathbf{v} - \mathbf{v}_s$: range gives $\partial\rho/\partial\mathbf{r} = \hat{\mathbf{u}}$ and $\partial\rho/\partial\mathbf{v} = \mathbf{0}$, so it constrains position along the line of sight only and says nothing about velocity or about transverse position. Range-rate gives $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}$ and $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})/\rho$, so it constrains velocity along the line of sight and position *perpendicular* to it, the latter weakening as $1/\rho$. The two are complementary — range-rate supplies precisely the transverse position information range lacks — which is why a pass with both is vastly better conditioned than a pass with either.
:::

::: check
Why can a short tracking arc produce a converged, well-behaved solution that is nonetheless worthless, and what would you look at to detect it?
:::

::: answer
Because poor observability in orbit determination is almost never a rank deficiency; it is bad conditioning. The normal equations still solve, the Gauss–Newton iteration still converges, and six numbers still come out. What has happened is that one or more directions in state space are barely constrained, so the estimate along them is close to whatever the prior said rather than something the data determined. Nothing in the fit announces this. To detect it, look at the condition number of the normal-equation matrix after non-dimensionalising — in raw kilometres and seconds the number is dominated by units rather than geometry — and at the eigenstructure of the covariance rather than its trace or its largest diagonal entry, reported in radial, in-track and cross-track components so that the weak direction has a physical name.
:::

::: check
Write the batch normal equations, define every symbol, and say which part of the algorithm is responsible for its tolerance of a poor initial estimate.
:::

::: answer
$\boldsymbol{\Lambda}\,\delta\mathbf{x}_0 = \mathbf{N}$ with $\boldsymbol{\Lambda} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$ and $\mathbf{N} = \sum_i(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i\,\delta y_i$, where $\delta\mathbf{x}_0$ is the correction to the epoch state, $\mathbf{H}_i$ is the measurement partial at $t_i$, $\boldsymbol{\Phi}_i = \boldsymbol{\Phi}(t_i,t_0)$ is the state transition matrix from the variational equations, $\mathbf{W}_i$ is the weight (normally $\mathbf{R}_i^{-1}$) and $\delta y_i$ is the residual. The tolerance comes from the *iteration*: this is Gauss–Newton, so after applying the correction the trajectory is re-propagated and every $\mathbf{H}_i$ and $\boldsymbol{\Phi}_i$ is recomputed about the improved reference. A linearisation that was poor on the first pass is replaced on the second. A sequential filter has no equivalent step — it linearises about its current estimate as each measurement arrives and never revisits it.
:::

::: check
A sequential orbit determination filter is run with $\mathbf{Q} = \mathbf{0}$ on the grounds that gravity is deterministic. What happens, and what is the standard fix?
:::

::: answer
With no process noise the predicted covariance is $\boldsymbol{\Phi}\mathbf{P}^+\boldsymbol{\Phi}^{\mathsf{T}}$ and nothing adds uncertainty between measurements, so over many updates the covariance contracts toward zero and the gain contracts with it. The filter becomes closed to new data while its reported uncertainty keeps shrinking, and any force the model omits — drag, solar radiation pressure, a small manoeuvre, a gravity-field truncation — accumulates as real error with nothing correcting it. The argument that gravity is deterministic is true and irrelevant: $\mathbf{Q}$ does not represent randomness in gravity, it represents everything the dynamics model leaves out. The standard fix is to carry process noise sized to the omitted forces, and because those forces are correlated in time rather than white, the usual form is a Gauss–Markov acceleration state — dynamic model compensation — rather than white noise on velocity.
:::

::: check
You are asked to choose an estimator for an onboard navigation function on a spacecraft with no ground contact for hours at a time. Which do you choose, and what do you have to do to make it safe?
:::

::: answer
A sequential filter, because there is no alternative: onboard there is no stored arc to re-process and no operator to restart an iteration, and the state is needed continuously rather than after the fact. What makes it safe is handling the two things sequential processing is bad at. Initialisation: start from a solution produced by something more robust — a ground batch solution uploaded, or an onboard initial-orbit-determination fix — rather than from a guess, because a poor starting point is what triggers the covariance-collapse failure. Outliers: gate every measurement on $\mathbf{y}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{y}$ against a chi-squared threshold and reject what fails, because one accepted bad observation moves the estimate and therefore moves the point at which the next partials are evaluated. Beyond those: the Joseph form or a square-root implementation for a recursion that runs for hours, process noise sized to the unmodelled forces so the filter never stops listening, and a NIS monitor so the ground can see whether the filter is consistent when contact resumes.
:::

## Summary

| Item | Content |
| --- | --- |
| Range partials | $\partial\rho/\partial\mathbf{r} = \hat{\mathbf{u}}$, $\partial\rho/\partial\mathbf{v} = \mathbf{0}$ |
| Range-rate partials | $\partial\dot\rho/\partial\mathbf{r} = (\Delta\mathbf{v} - \dot\rho\hat{\mathbf{u}})/\rho$, $\partial\dot\rho/\partial\mathbf{v} = \hat{\mathbf{u}}$ |
| Angles | Direction only; a single fixed site never obtains range from them |
| Observability | A matter of degree, not rank; the failure is silent and shows only in the covariance eigenstructure |
| Conditioning | Non-dimensionalise first ($\mathrm{DU} = 6378.137\,\mathrm{km}$, $\mathrm{TU} = 806.8\,\mathrm{s}$); report in radial, in-track, cross-track |
| Worked geometry | One $7$-minute pass with range and range-rate leaves tens of kilometres; a second pass brings it to metres |
| Batch | $\boldsymbol{\Lambda}\delta\mathbf{x}_0 = \mathbf{N}$, $\boldsymbol{\Lambda} = \sum(\mathbf{H}_i\boldsymbol{\Phi}_i)^{\mathsf{T}}\mathbf{W}_i(\mathbf{H}_i\boldsymbol{\Phi}_i)$; Gauss–Newton re-linearises the whole arc |
| Sequential | EKF or UKF with $\boldsymbol{\Phi}$ from the same variational equations, Joseph form, gating, Gauss–Markov process noise |
| The choice | Batch for post-pass reconstruction and poor a priori; sequential for real time and onboard; operationally both |
| Extra parameters | Solve-for adds a column; consider keeps the parameter fixed but propagates its uncertainty |

That completes the module. The subjects are the ones the module's own list names — margins, the three filters, tuning and consistency, attitude determination, the multiplicative filter, strapdown inertial, PID, orbit determination — and every one of them has been given in the form an interviewer asks for it: the statement, the mechanism, the number, and a sanity check. What remains is the drill. The exercises attached to this module are written to be repeated rather than completed once, and the reason is the reason this module is technical at all: on the day, the difference between knowing the Kalman gain and being able to write it, explain it and check it under time pressure is entirely a matter of how many times you have done it before.
