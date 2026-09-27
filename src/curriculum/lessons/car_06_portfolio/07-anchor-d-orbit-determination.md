---
id: l07-anchor-d-orbit-determination
title: "Anchor D: batch orbit determination from real data"
minutes: 20
covers:
  - "anchor project D — batch least-squares orbit determination fitted to real GNSS or TLE-derived data"
---

Imagine a friend throws a ball across a dark gym, and you only get to see it in a few camera flashes. From those snapshots, you have to say where the ball started and how fast it was going. If you took the snapshots yourself in a perfectly lit studio, the job is easy. Real snapshots are blurry, a couple are missing, and one was taken by accident while somebody walked in front of the camera.

That is **[[orbit determination|what-is-od]]** — working out where a satellite is and how it is moving from a pile of imperfect measurements. Anchor project D asks you to do it with a **batch least-squares** fit: collect a whole batch of measurements first, then find the one orbit that agrees with all of them best. The brief says the fit must be done against **real** data — either **GNSS** measurements (said "G-N-S-S", Global Navigation Satellite System: GPS and its cousins) or positions worked out from public **[[two-line element sets|tle]]** (TLEs, said "T-L-E").

Fitting only to measurements you made up yourself, with noise you chose, is still a useful first step. It checks that your code can find an answer you already know. But real data brings two things made-up data cannot: tracking **geometry** you did not choose, and flaws you did not design. This lesson covers what the project needs to survive both, and walks through a real kind of failure a reviewer will ask whether you have ever met.

## What the project has to contain

### The machine inside: Gauss-Newton

Here is the fitting idea in everyday terms. You make a guess at the orbit. You predict what each measurement *should* have been if the guess were right. You compare with what was actually measured. The differences are called **residuals** — how far off each prediction was. Then you nudge the guess to shrink the residuals, and repeat.

The method that does the nudging is **[[Gauss-Newton|gauss-ceres]]**. Written out, each round solves the **normal equations**:

$$
\mathbf H(\mathbf x_k)^{\mathsf T}\mathbf H(\mathbf x_k)\,\Delta\mathbf x=\mathbf H(\mathbf x_k)^{\mathsf T}\mathbf r(\mathbf x_k).
$$

Read it piece by piece:

- $\mathbf x_k$ ("x sub k") is the guess at round $k$ — the **state**, the list of numbers that describe the orbit (positions and velocities).
- $\mathbf r(\mathbf x_k)$ is the list of residuals: measured minus predicted.
- $\mathbf H$ is the **Jacobian** (said "ja-KOH-bee-an") — a table of how much each predicted measurement changes when you nudge each state number a tiny bit.
- $\mathbf H^{\mathsf T}$ ("H transpose") is that table flipped on its side.
- $\Delta\mathbf x$ ("delta x") is the correction. You set $\mathbf x_{k+1}=\mathbf x_k+\Delta\mathbf x$ and go around again.

Sometimes Gauss-Newton's step is too bold and overshoots. **Levenberg-Marquardt** is the careful cousin: it adds damping, so each step is shorter and safer when the guess is still far off. Both are derived in full in this course's estimation material. This project's job is not to re-derive them. Its job is to run them on real tracking data and report honestly what happened: whether the fit converged, to what tolerance, and whether the uncertainty it reports means what it claims.

### Three things that make it credible

1. **Real data.** A fit to GNSS **[[pseudoranges|pseudorange]]** or to TLE-derived positions — not only to measurements you generated. Real data has errors that are linked to each other, gaps, and outliers that a made-up bell-curve noise model does not.
2. **A conditioning check.** The matrix $\mathbf H^{\mathsf T}\mathbf H$ (called the **normal matrix**) can be close to impossible to invert when the tracking geometry is poor. A fit that converged without this check reported has not shown that it converged to a trustworthy answer rather than a lucky one.
3. **A validated covariance.** The **covariance** is the fit's own statement of how uncertain each state number is. For least squares it is

$$
\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1},
$$

where $\sigma$ ("sigma") is the size of the measurement noise and the $^{-1}$ means "matrix inverse". The hat on $\hat{\mathbf P}$ ("P hat") marks it as an estimate. The project must check this number against something independent of the single fit that produced it, not quote it on its own.

::: key
A credible batch orbit-determination anchor needs three things beyond working code: real GNSS or TLE-derived data, a reported conditioning (observability) check of $\mathbf H^{\mathsf T}\mathbf H$ for every fit, and a formal covariance $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$ checked against independent evidence.
:::

## Geometry can break a fit before noise does

### The condition number, in plain words

Picture a table with one short leg. Press lightly on the wrong corner and it tips a long way. A **badly conditioned** problem is like that: a tiny wobble in the measurements causes a huge swing in the answer.

The **[[condition number|condition-number]]** puts a number on the wobble. For the normal matrix it is the ratio of its biggest stretch to its smallest:

$$
\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)=\frac{\lambda_{\max}}{\lambda_{\min}},
$$

where $\lambda$ ("lambda") are the matrix's **eigenvalues** — how strongly it stretches along each of its special directions. A condition number near $1$ is a steady table. A condition number of $10^{5}$ is workable. A condition number near $10^{16}$ or beyond means that, as far as a computer can tell, one direction has no information in it at all. That direction is **unobservable**: no amount of this kind of data can pin it down.

### A natural first version, and why it fails

A natural first version of this project fits a four-number state — position and velocity in a flat, local frame, a short-arc stand-in for a real orbital segment — to **range-only** measurements (distance only, no direction) from one fixed tracking station, over a $300$-second arc. For a nearly straight-line track past that one station, this is a geometry problem waiting to happen.

::: example When a fit fails to converge, and what the normal matrix says about why
**One station.** Fitting this case, Gauss-Newton blows up by the second round. The velocity estimate jumps to a physically absurd value, and the normal matrix becomes numerically singular — impossible to invert.

The condition number, computed at the true state *before* any fit, would have warned you: $\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)\approx 6\times10^{18}$. The smallest **singular value** of $\mathbf H$ itself — how strongly $\mathbf H$ responds to a change in its least-seen direction — came out around $3\times10^{-15}$. Both numbers are at the level of computer rounding, so read them as "infinite" and "zero". One direction in the four-number state is, for this geometry, invisible to range from a single station.

**Four stations.** Now add three more stations at different bearings around the track — the same idea a real GNSS fix uses, several ranges at once instead of one. Refit the identical four-number state from the identical kind of range data. The condition number drops to $\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)\approx 4.3\times10^{5}$: a steady table.

Gauss-Newton now converges cleanly. The **RMS residual** (root mean square — the typical size of a residual) goes, round by round:

| Round | RMS residual |
| --- | --- |
| initial guess | $120{,}131\,\mathrm m$ |
| 1 | $2{,}605\,\mathrm m$ |
| 2 | $62.0\,\mathrm m$ |
| 3 | $45.5\,\mathrm m$ |

It settles near the $50\,\mathrm m$ per-measurement noise used to make the data.

**Sanity check.** A good fit should leave residuals about as big as the noise — not much bigger (the model is missing something) and not much smaller (the fit is chasing the noise). $45.5\,\mathrm m$ against $50\,\mathrm m$ is right where it should be. It is a little below $50$ because fitting four numbers soaks up a small part of the noise.

The point is not the vague "more stations are better". It is that a fit's convergence is a direct, checkable result of the tracking geometry's conditioning. Checking it first can save an afternoon spent debugging Gauss-Newton code that was never broken.
:::

::: note Why one station can never see the whole track
Put the station at the center of a clock face. The track is a straight line walked at constant speed. Now rotate the *whole* track — starting point and velocity together — around the station by any angle. Every distance from the station to the object, at every moment, stays exactly the same, because rotating about the station does not change distances from it.

So there is a whole family of different tracks that produce identical range data. The fit has no way to choose between them. That direction in the state — "turn everything about the station" — is exactly unobservable, and it mixes position *and* velocity. It is not one velocity component on its own.

A second station somewhere else breaks the tie: a rotation about the first station changes distances to the second. That is why *where* the stations sit matters more than how many measurements each one takes. (A real orbit is curved by gravity toward Earth's center, which is not the station, so real single-station tracking is only weakly, not perfectly, blind. The straight-line stand-in is the extreme case.)
:::

::: warning
A batch fit that converges is not, by itself, proof that the geometry was good enough. A badly conditioned problem can still converge to *an* answer — one with an enormous, easily overlooked uncertainty in its weakly observed direction. Report the condition number, or an equivalent observability check, with every fit — not only when something visibly goes wrong.
:::

## Does the reported covariance mean what it claims?

A fit's formal covariance, $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$ at the converged answer, makes a promise. It says: "If you repeated this whole experiment with fresh noise, the answer would wobble by about this much." The square root of each diagonal entry is a **1-sigma uncertainty** — the typical size of the wobble for that state number.

A promise like that can be tested. Do the experiment many times and watch how much the answer actually wobbles. That test is a **[[Monte Carlo|monte-carlo-od]]** run, and it is stronger evidence than quoting the formula.

::: example Formal covariance against actual scatter, over 400 independent fits
For the four-station geometry above, one fit's formal $1$-sigma uncertainties are listed in the first column. Then the identical fit is re-run $400$ times, each with a fresh, independent draw of $50\,\mathrm m$ measurement noise, and the standard deviation of the $400$ answers is measured.

| State number | Formal (one fit) | Actual (400 fits) | Ratio actual/formal |
| --- | --- | --- | --- |
| initial position, $x$ | $24.1\,\mathrm m$ | $22.9\,\mathrm m$ | $0.95$ |
| initial position, $y$ | $14.3\,\mathrm m$ | $15.4\,\mathrm m$ | $1.08$ |
| velocity, $x$ | $242\,\mathrm{mm/s}$ | $230\,\mathrm{mm/s}$ | $0.95$ |
| velocity, $y$ | $76\,\mathrm{mm/s}$ | $79.9\,\mathrm{mm/s}$ | $1.05$ |

Every ratio is within about $8\%$ of $1$, and none of the $400$ fits failed to converge.

**Why about 8% is the right size of agreement.** A standard deviation measured from $400$ samples is itself uncertain, by roughly $1/\sqrt{2\times400}\approx3.5\%$. So differences of a few percent, up to around twice that, are what honest agreement looks like. A ratio of $2$ or $3$ would be a real problem.

That match is the actual validation of the covariance. A single fit's $\hat{\mathbf P}$ is only trustworthy if its assumptions hold — correctly sized noise, good geometry, a converged answer. A Monte Carlo of independent re-fits is a direct, repeatable way to confirm those assumptions produced a covariance that describes how much the estimate really moves.
:::

## Real data brings problems made-up noise does not

Everything above used noise that was independent from one measurement to the next and exactly the size the fit assumed. That is the assumption the normal equations rest on. Real GNSS pseudoranges and TLE-derived positions rarely behave so well:

- **Correlated errors.** **[[Multipath|multipath]]** and delays in the atmosphere make nearby measurements wrong in the same direction, instead of independently.
- **Gaps.** A station drops out, and the even spacing of the tracking breaks.
- **Outliers.** An occasional bad measurement sits far outside the noise model and drags an unweighted fit off course.

A project that has only ever fitted made-up bell-curve noise has faced none of these. An interviewer whose own work uses real tracking data will ask directly whether yours has.

The fix has a name: **residual editing**. After a fit, compare each residual with its expected size. Flag the ones that do not belong — a common starting rule is anything beyond about three times the noise level — then down-weight or remove them and refit. This course's orbit-determination material develops it fully. A credible version of this project implements at least a basic form and reports what it found, rather than claiming it is ready for real data without evidence.

## What the interviewer asks, and what to have ready

These questions come up again and again for this project, from reviewers in the **[[flight dynamics|flight-dynamics]]** role family:

- **"How do you know your fit converged to the right answer, and not a bad or accidental one?"** The condition-number check, run *before* trusting the fit — not after a strange result sends you hunting for excuses.
- **"What does your covariance mean, and did you check it?"** The Monte Carlo comparison, not the formula alone.
- **"What happened with real data? How did you handle an outlier or a gap?"** A residual-editing step, even a simple one, reported honestly.
- **"Why bother with real data when made-up noise is so much easier?"** Because a made-up-only project has never shown the part of orbit determination that real data is hardest about — and that gap is exactly what a reviewer with flight experience probes first.

## Check yourself

::: check
A batch least-squares fit to single-station range data diverges. The condition number of $\mathbf H^{\mathsf T}\mathbf H$ at the true state is $6\times10^{18}$. What is this number telling you, and why is it a better diagnostic than watching Gauss-Newton fail and guessing at the cause?
:::

::: answer
A condition number that large means the normal matrix is singular as far as the computer can tell: at least one direction in the state has essentially no information in it. Here the smallest singular value of $\mathbf H$ was around $3\times10^{-15}$ — zero, to rounding. The invisible direction is a combination of the state numbers (for a straight track and one station, rotating position and velocity together about the station), and it is unobservable from this geometry no matter how good the starting guess or the solver.

It is a better diagnostic because it names the actual cause — a geometry problem, not a solver problem — before you spend any time debugging iteration code that was correct all along.
:::

::: check
Adding three more tracking stations dropped the condition number from about $10^{18}$ to about $4\times10^5$ and let Gauss-Newton converge. Explain, in terms of observability rather than "more data is better", why stations at *different bearings* fixed it.
:::

::: answer
One station measures distance along one line of sight. For a nearly straight track, that leaves some combinations of position and velocity impossible to tell apart — for example, the whole track turned about the station gives identical ranges. The geometry does not supply enough independent directions of information to separate all four state numbers.

Each station at a new bearing looks along a line of sight pointed a different way, so the combined Jacobian $\mathbf H$ covers more independent directions in state space. A rotation about station one changes the distances to station two. It is the variety of geometry, not the count of measurements, that restores observability. More measurements from the same single station would not have fixed it.
:::

::: check
A project reports a fit's formal covariance with no independent check. What experiment does this lesson recommend, and what result would show the covariance is trustworthy?
:::

::: answer
Re-run the identical fit many times, each time with a freshly drawn set of measurement noise that matches the assumed noise model. Measure the standard deviation of the recovered state numbers across all runs, and compare it with the square roots of the diagonal of $\hat{\mathbf P}$.

A trustworthy covariance shows close agreement — in this lesson's example, formal and actual matched to within about $8\%$ on all four state numbers over $400$ runs. An actual spread much larger than the formal one means the formula's assumptions (correct noise size, good geometry, a converged fit) were not really met.
:::

::: check
Why does a project that fits only self-generated bell-curve noise fail to show a skill a reviewer with real tracking-data experience will ask about?
:::

::: answer
Made-up noise drawn to match exactly what the least-squares math assumes never produces correlated errors, gaps or outliers — the imperfections real GNSS and TLE-derived data actually has. A reviewer who works with real data knows these are routine, not rare. A project that has never had to detect or handle one has not shown the part of orbit determination that field experience is mostly built around. "How did you handle an outlier?" is a quick, common probe because it separates the two kinds of project at once.
:::

::: check
Why is "the fit converged" a weaker claim than "the fit converged, and the condition number was checked and found acceptable", even for the exact same run?
:::

::: answer
"Converged" only says the stopping rule was met. It says nothing about whether every direction in the state was well observed. A poorly conditioned fit can stop at a definite-looking answer while carrying a huge real uncertainty in its weak direction — it "worked" only in the narrow sense of finishing. Adding the condition number turns an unverifiable claim of success into a specific, checkable statement about how far to trust each part of the result.
:::

## Summary

| Item | What it needs |
| --- | --- |
| Iteration | Gauss-Newton on the normal equations $\mathbf H^{\mathsf T}\mathbf H\,\Delta\mathbf x=\mathbf H^{\mathsf T}\mathbf r$, or Levenberg-Marquardt when the step needs damping |
| Data | Real GNSS pseudoranges or TLE-derived positions, not only made-up bell-curve noise |
| Geometry check | Condition number of $\mathbf H^{\mathsf T}\mathbf H$ (or another observability check), reported for every fit |
| Covariance validation | Actual scatter over many independent re-fits, compared with $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$ |
| Worked example | One station: $\mathrm{cond}\approx6\times10^{18}$, diverges. Four stations: $\mathrm{cond}\approx4.3\times10^5$, converges to $45.5\,\mathrm m$ RMS residual against $50\,\mathrm m$ noise |
| Covariance check | Formal and actual $1$-sigma values agree within about $8\%$ over $400$ fits |
| Real-data handling | Residual editing for outliers, gaps and correlated errors, reported honestly |
| Role family | Orbit determination / flight dynamics |

The next lesson moves from fitting a trajectory to controlling a spacecraft all the time: anchor project E, momentum management for attitude control, and the small steady twists a spacecraft piles up whether or not its control system is watching for them.

::: context what-is-od Who does orbit determination
Every satellite operator needs to know where each spacecraft is, to point antennas, plan maneuvers and avoid collisions. The team that does this is usually called **flight dynamics**. They take in tracking measurements — radar ranges, radio signals, GNSS fixes from a receiver on board — and fit an orbit to them, day after day. The fitted orbit is then pushed forward in time to predict where the satellite will be. A good fit today is what makes tomorrow's prediction trustworthy.
:::

::: context tle Two lines of numbers per satellite
A **two-line element set** is a compact text format for a satellite's orbit: two lines of about $69$ characters each, holding things like the orbit's tilt, its shape, and how many times it goes around per day. The U.S. Space Force catalogs thousands of objects and publishes TLEs for many of them, free, through Space-Track; sites such as CelesTrak redistribute them.

TLEs are meant to be used with a matching orbit model called SGP4. Running SGP4 on a TLE turns it into positions at any time you ask — which is how you get "TLE-derived" data for this project. Those positions carry errors of order a kilometer or more, which makes them realistic practice data.
:::

::: context gauss-ceres How least squares found a lost planet
In 1801 the astronomer Giuseppe Piazzi spotted a new object, later named Ceres, and followed it for a few weeks before it vanished into the Sun's glare. Nobody could tell where it would reappear. The young mathematician Carl Friedrich Gauss took the handful of observations, fitted an orbit to them with the method we now call least squares, and predicted where to look. Astronomers found Ceres close to his prediction at the end of that year.

So this anchor project is, in a real sense, a rerun of where least squares began: fitting an orbit to too few, imperfect measurements.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="60" r="6" fill="#1d6fd1"/>
  <circle cx="57" cy="60" r="6" fill="#b4232c"/>
  <circle cx="270" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="330" cy="60" r="6" fill="#1d6fd1"/>
  <rect x="30" y="54" width="27" height="12" fill="#8fb8f0" opacity="0.6"/>
  <text x="30" y="40" font-size="11" fill="#1d6fd1">Jan 1801: found</text>
  <text x="57" y="88" font-size="11" fill="#b4232c">Feb: lost in glare</text>
  <text x="270" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">late 1801: Gauss</text>
  <text x="270" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">predicts</text>
  <text x="330" y="88" font-size="11" text-anchor="end" fill="#1d6fd1">31 Dec: found again</text>
</svg>
```
:::

::: context pseudorange Why the range is "pseudo"
A GNSS receiver works out its distance to a satellite from how long the signal took to arrive, times the speed of light. But the receiver's clock is cheap and never quite matches the satellites' atomic clocks. An error of one millionth of a second in the clock makes about $300\,\mathrm m$ of error in the distance, because light covers about $3\times10^8\,\mathrm{m/s}$.

So the measured distance is not the true range — it is the true range plus a clock error. That is why it is called a **pseudorange** ("pseudo" means "false" or "sort-of"). The fit treats the clock error as one more unknown to solve for, which is one reason a receiver needs signals from at least four satellites.
:::

::: context condition-number The steady table and the wobbly one
The condition number measures how much a small error in the data can grow in the answer. Roughly, a condition number of $10^{k}$ can cost you about $k$ digits of accuracy.

A computer stores numbers with about $16$ significant digits: the smallest relative step it can tell apart is about $2.2\times10^{-16}$, called **machine epsilon**. So once a condition number reaches about $10^{16}$, every digit can be lost, and the matrix is singular as far as the computer is concerned. Values like $6\times10^{18}$ are not really measured — they are what rounding noise looks like when the true answer is "infinite".

Picture the fit as rolling a ball to the bottom of a valley. A round bowl has one clear lowest point. A long, flat trough does not: the ball can stop anywhere along it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#1d6fd1" stroke-width="1.5">
    <circle cx="90" cy="68" r="14"/><circle cx="90" cy="68" r="30"/><circle cx="90" cy="68" r="46"/>
  </g>
  <circle cx="90" cy="68" r="3" fill="#1f2a44"/>
  <g fill="none" stroke="#b4232c" stroke-width="1.5">
    <ellipse cx="270" cy="68" rx="30" ry="4"/><ellipse cx="270" cy="68" rx="60" ry="8"/><ellipse cx="270" cy="68" rx="84" ry="12"/>
  </g>
  <line x1="220" y1="68" x2="320" y2="68" stroke="#1f2a44" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="90" y="134" font-size="12" text-anchor="middle" fill="#1f2a44">cond near 1: one clear answer</text>
  <text x="270" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">huge cond: a whole line</text>
  <text x="270" y="126" font-size="12" text-anchor="middle" fill="#1f2a44">of near-equal answers</text>
</svg>
```
:::

::: context monte-carlo-od Testing a promise by repeating the experiment
You cannot rerun a real satellite pass with fresh noise. In simulation you can, as many times as you like, and that is the whole trick of a Monte Carlo test. The name comes from the Monte Carlo casino in Monaco; scientists at Los Alamos in the 1940s used it as a code name for methods built on chance. It came up already in the 6-DOF anchor as a dispersion campaign. Here it answers a narrower question: is the uncertainty my fit reports the uncertainty it really has?
:::

::: context multipath Signals that take the long way
**Multipath** happens when a radio signal reaches the antenna by more than one route — straight from the satellite, and also bounced off a building, the ground, or the spacecraft's own body. The bounced copy arrives late, so it makes the distance look too long. Because the reflecting surfaces do not move much from one second to the next, the error stays similar across nearby measurements. That is exactly the correlated error a bell-curve noise model leaves out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="36" height="14" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="38" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">satellite</text>
  <line x1="56" y1="30" x2="300" y2="130" stroke="#1d6fd1" stroke-width="2"/>
  <text x="170" y="64" font-size="11" fill="#1d6fd1">direct path</text>
  <polyline points="56,34 170,150 300,132" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="100" y="118" font-size="11" fill="#b4232c">bounced path</text>
  <line x1="120" y1="150" x2="240" y2="150" stroke="#6c7a93" stroke-width="4"/>
  <text x="180" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">reflecting surface</text>
  <circle cx="306" cy="132" r="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="306" y="115" font-size="11" text-anchor="middle" fill="#1f2a44">antenna</text>
</svg>
```
:::

::: context flight-dynamics The flight dynamics role family
At a launch or satellite company, **flight dynamics** engineers own the trajectory after it leaves the pad: orbit determination, maneuver planning, collision-avoidance screening, and predicting where each vehicle will be. It sits next to GNC but is its own family of roles. An orbit-determination anchor maps straight onto it. A reviewer from that team will care less about fancy plots and more about your residuals, your covariance and how you treated bad data.
:::
