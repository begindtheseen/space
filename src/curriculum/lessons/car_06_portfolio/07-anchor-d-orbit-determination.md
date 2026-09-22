---
id: l07-anchor-d-orbit-determination
title: "Anchor D: batch orbit determination from real data"
minutes: 20
covers:
  - "anchor project D — batch least-squares orbit determination fitted to real GNSS or TLE-derived data"
---

A batch orbit-determination project fit only to measurements you generated yourself, with noise you chose, tests whether your Gauss-Newton implementation can recover a state you already know the answer to. That is a real and necessary check — but it is not the whole project, because the specific instruction behind this anchor is "fitted to real GNSS or TLE-derived data," and real data brings two things synthetic data cannot: geometry you did not choose, and imperfections you did not design. This lesson covers what the project needs to survive both, using the batch least-squares machinery this curriculum develops in full elsewhere, and a worked example built from an actual convergence failure — the kind a reviewer will ask whether you have ever seen.

## What the project has to contain

The Gauss-Newton iteration itself — linearize the measurement model, solve the normal equations $\mathbf H(\mathbf x_k)^{\mathsf T}\mathbf H(\mathbf x_k)\,\Delta\mathbf x=\mathbf H(\mathbf x_k)^{\mathsf T}\mathbf r(\mathbf x_k)$, step, and repeat — is developed in full in this curriculum's estimation material, alongside Levenberg-Marquardt for when Gauss-Newton's step is too aggressive to trust. This project's job is not to re-derive that machinery; it is to run it against real tracking data and report, honestly, what happened: whether it converged, to what tolerance, and whether the reported covariance actually means what it claims to.

Three things distinguish a credible version of this project. First, real data — a fit to GNSS pseudoranges or to positions derived from public two-line element sets, not exclusively self-generated synthetic measurements, because real data carries correlated errors, gaps, and outliers a synthetic Gaussian noise model does not. Second, a reported observability or conditioning check — the normal matrix $\mathbf H^{\mathsf T}\mathbf H$ can be near-singular for a genuinely bad tracking geometry, and a fit that converges without that check being reported has not shown it converged to a trustworthy answer rather than an accidental one. Third, a validated covariance — the formal covariance the fit reports, $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$, checked against something independent of the single fit that produced it, not simply quoted.

## Geometry can break convergence before noise does: a real failure, diagnosed

Attempting to fit a four-state constant-velocity arc — position and velocity in a local frame, a short-arc stand-in for a real orbital segment — to range-only measurements from a single fixed tracking station over a 300-second arc is a natural first version of this project. It is also, for a near-straight-line, near-radial trajectory relative to that one station, a geometry problem waiting to happen.

::: example When a fit fails to converge, and what the normal matrix says about why
Fitting the single-station case above, Gauss-Newton diverges by the second iteration — the state estimate for the velocity components jumps to a physically absurd value and the normal matrix becomes numerically singular. Computing the condition number of $\mathbf H^{\mathsf T}\mathbf H$ at the true state, before ever attempting to fit, would have shown the problem in advance: $\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)\approx 6\times10^{18}$, with the smallest singular value of $\mathbf H$ itself at $3\times10^{-15}$ — the fourth state direction is, for this geometry, essentially unobservable from range alone to a single station on a nearly straight-line pass.

Adding three more stations at distinct bearings around the trajectory — the same idea a real GNSS fix uses, several simultaneous ranges rather than one — and refitting the identical constant-velocity state from the identical kind of range data drops the condition number to $\mathrm{cond}(\mathbf H^{\mathsf T}\mathbf H)\approx 4.3\times10^{5}$. Gauss-Newton now converges cleanly: RMS residual falls from $120{,}131\,\mathrm m$ at the initial guess to $2{,}605\,\mathrm m$, then $62.0\,\mathrm m$, then $45.5\,\mathrm m$ over four iterations, settling near the $50\,\mathrm m$ per-measurement noise level used to generate the data.

The lesson is not "more stations are better" as a vague intuition — it is that a fit's convergence behavior is a direct, checkable function of the tracking geometry's conditioning, and checking that conditioning before trusting a fit (or before spending an afternoon debugging a Gauss-Newton implementation that was never broken) is exactly the kind of verification step this module has argued for throughout.
:::

::: warning
A batch fit that converges is not, by itself, evidence the geometry was adequate — a badly conditioned problem can still converge to *a* answer, just one with enormous, easily overlooked uncertainty in a poorly observed direction. Report the condition number or an equivalent observability diagnostic alongside every fit, not only when something visibly goes wrong.
:::

## Does the reported covariance mean what it claims?

A fit's formal covariance, $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$ evaluated at the converged solution, is a claim about how much the estimate would vary under repeated, independent draws of measurement noise. That claim is checkable, and checking it is stronger evidence than quoting the covariance alone.

::: example Formal covariance against empirical scatter, over 400 independent fits
For the four-station geometry above, the formal 1-sigma uncertainties from a single fit are $24.1\,\mathrm m$ (initial position, $x$), $14.3\,\mathrm m$ ($y$), $242\,\mathrm{mm/s}$ (velocity, $x$), $76\,\mathrm{mm/s}$ ($y$). Re-running the identical fit $400$ times, each with an independent draw of $50\,\mathrm m$ measurement noise, gives empirical standard deviations across the $400$ recovered states of $22.9\,\mathrm m$, $15.4\,\mathrm m$, $230\,\mathrm{mm/s}$, and $79.9\,\mathrm{mm/s}$ — matching the formal values to within about $8\%$ on every component, and with no single fit among the $400$ failing to converge.

That match is the actual validation of the covariance claim. A single fit's formal $\hat{\mathbf P}$ is only trustworthy insofar as its assumptions hold — correctly specified measurement noise, a well-conditioned geometry, a converged solution — and a Monte Carlo of independent re-fits is a direct, repeatable way to confirm those assumptions produced a covariance that actually describes how much the estimate moves under real noise, rather than a number that merely came out of a formula.
:::

## Real data brings problems synthetic noise does not

Everything above used measurements with independent, correctly-specified Gaussian noise — exactly the assumption the normal equations rest on. Real GNSS pseudoranges or TLE-derived positions rarely honor that assumption cleanly: multipath and atmospheric delay correlate errors across nearby measurements rather than leaving them independent, a station dropout leaves a gap in otherwise-even tracking coverage, and an occasional bad measurement sits far enough outside the noise model to pull an unweighted fit noticeably off course. A project that only ever fits synthetic Gaussian noise has not yet faced any of these, and an interviewer whose own work involves real tracking data will ask directly whether yours has. Residual editing and outlier rejection — checking each residual against its expected size after a fit and re-weighting or excluding the ones that do not belong — are developed fully elsewhere in this curriculum's orbit-determination material; a credible version of this project implements at least a basic form of it and reports what it found, rather than asserting real-data readiness without evidence.

## What the interviewer asks, and what the project needs ready

How do you know your fit converged to the right answer rather than a bad local one or an accidentally-passable ill-conditioned fit — the condition-number check above is the direct answer, run before the fit is trusted, not after a strange result prompts a search for excuses. What does your covariance actually mean here, and did you check it — the Monte Carlo validation above, not the formula alone. What happens with real data specifically, and how did you handle an outlier or a gap — a residual-editing step, even a simple one, reported honestly rather than left untested. And why real data at all, if synthetic noise is so much easier to work with — because a synthetic-only project has never demonstrated the part of orbit determination that real tracking data is hardest about, and that gap is exactly what a reviewer with real flight-dynamics experience will probe first.

## Check yourself

::: check
A batch least-squares fit to single-station range data diverges. The condition number of $\mathbf H^{\mathsf T}\mathbf H$ at the true state is $6\times10^{18}$. Explain what this number is telling you, and why it is a better diagnostic than watching Gauss-Newton fail and guessing at the cause.
:::

::: answer
A condition number that large means the normal matrix is numerically singular in at least one direction — here, the smallest singular value of $\mathbf H$ itself was around $3\times10^{-15}$, meaning one combination of the state variables (in this case, a component of velocity) is essentially unobservable from this specific measurement geometry, independent of how good the initial guess or the solver is. It is a better diagnostic than watching Gauss-Newton fail because it identifies the actual cause — a geometry problem, not a solver problem — before any time is spent debugging perfectly correct iteration code for a fit that was never observable in the first place.
:::

::: check
Adding three more tracking stations dropped the condition number from roughly $10^{18}$ to roughly $4\times10^5$ and let Gauss-Newton converge cleanly. Explain, in terms of observability rather than "more data is better" in the abstract, why adding stations at different bearings specifically fixed the problem.
:::

::: answer
A single station observes range along one changing line of sight over the arc, which for a nearly straight-line trajectory leaves position and velocity along that line of sight poorly distinguished from each other — the geometry does not provide enough independent directions of information to separate the four state components. Stations at different bearings each contribute a line-of-sight direction pointed a different way, so the combined measurement Jacobian spans more independent directions in state space; it is the diversity of geometry, not simply the count of measurements, that restores observability. A fifth measurement from the same single station would not have fixed the underlying degeneracy the way a differently-positioned station did.
:::

::: check
A project reports a fit's formal covariance without any independent check of it. What specific experiment does this lesson recommend to validate that claim, and what result would indicate the claim is trustworthy?
:::

::: answer
Re-run the identical fit many times, each against an independently drawn realization of measurement noise consistent with the assumed noise model, and compare the empirical standard deviation of the recovered states across those runs against the formal covariance's predicted standard deviations. A trustworthy claim shows close agreement — this lesson's own example matched formal and empirical values to within about 8% across four states over 400 trials — while a meaningfully larger empirical spread than the formal covariance predicts would indicate the covariance formula's assumptions (correctly specified noise, a well-conditioned fit) were not actually met.
:::

::: check
Why does a project that fits only self-generated synthetic Gaussian noise fail to demonstrate a skill a reviewer with real tracking-data experience is likely to ask about directly?
:::

::: answer
Synthetic Gaussian noise, drawn to match exactly the assumptions the least-squares normal equations rest on, never exercises correlated errors, measurement gaps, or outliers — the specific imperfections real GNSS or TLE-derived tracking data actually has. A reviewer who works with real data knows these problems are routine, not edge cases, and a project that has never had to detect or handle one has not yet demonstrated the part of orbit determination that experience in the field is mostly built around; asking "how did you handle an outlier" is a natural, common first probe specifically because it separates the two kinds of project quickly.
:::

::: check
Explain why "the fit converged" is a weaker claim than "the fit converged, and the condition number of the normal matrix was checked and found acceptable," even when both describe the exact same successful run.
:::

::: answer
Convergence alone only reports that the iteration's stopping criterion was met; it says nothing about whether the geometry that produced the converged answer was well-observed in every state direction. A converged fit from a poorly conditioned geometry can still return a specific numerical answer with an enormous, easily-overlooked true uncertainty in whichever direction is weakly observed — the fit "worked" in the narrow sense of terminating, while the underlying estimate in that direction may be nearly meaningless. Reporting the condition number turns an unverifiable assertion of success into a specific, checkable claim about how much to trust every component of the result.
:::

## Summary

| Item | What it needs |
| --- | --- |
| Iteration | Gauss-Newton (or Levenberg-Marquardt where the step needs damping), as this curriculum's least-squares material develops it |
| Data | Real GNSS pseudoranges or TLE-derived positions, not synthetic Gaussian noise exclusively |
| Geometry check | Condition number of $\mathbf H^{\mathsf T}\mathbf H$ (or an equivalent observability diagnostic), reported for every fit |
| Covariance validation | Empirical scatter from repeated independent fits, checked against the formal $\hat{\mathbf P}=\sigma^2(\mathbf H^{\mathsf T}\mathbf H)^{-1}$ |
| Worked example | Single-station geometry: $\mathrm{cond}\approx6\times10^{18}$, diverges. Four-station geometry: $\mathrm{cond}\approx4.3\times10^5$, converges to 45.5 m RMS residual against 50 m noise |
| Role family | Orbit determination / flight dynamics |

The next lesson moves from fitting a trajectory to controlling one continuously: anchor project E, ADCS momentum management, and the environmental torques a spacecraft accumulates whether or not its attitude control system is watching for them.
