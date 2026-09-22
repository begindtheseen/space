---
id: l06-navigation-and-state-estimation
title: "Navigation and State Estimation: knowing where you actually are"
minutes: 19
covers:
  - "Navigation and State Estimation, Navigation and Orbit Determination, Precise Navigation Solutions (Starlink): star tracker and signals-based attitude determination, inertial propagation, GNSS, orbit determination"
---

The previous lesson drew a line, deliberately left soft, between attitude determination and attitude control, and promised that this lesson would go deeper into the determination side. Postings for this family appear under several related titles — Navigation and State Estimation, Navigation and Orbit Determination, Precise Navigation Solutions — and all of them describe variations on one underlying problem: turning noisy, partial, delayed sensor measurements into a single trusted estimate of where a satellite actually is and how it is actually oriented, with an honest statement of how much that estimate should be trusted. This is the most estimation-theoretic family in this module, and it is worth saying plainly, up front, that research on 2026 postings found roles in this family more likely than the general GNC Engineer or Site Reliability Engineer ladders to list a Master's or PhD in an engineering discipline, computer science, or physics as a basic qualification rather than a preferred one.

That fact is worth neither hiding from nor being discouraged by. This lesson explains why the depth this family asks for tends to track formal training, what the actual technical content is, and — because the mathematics itself is completely learnable outside a degree program — what kind of self-built evidence genuinely demonstrates it.

## No sensor tells you the truth by itself

Every sensor this family works with is imperfect in its own specific way. A star tracker gives a precise absolute attitude fix, but only when it can see enough of the star field clearly, and it cannot update continuously. A gyroscope gives a continuous measurement of angular rate, but integrating rate into an attitude drifts over time as any small, uncorrected bias accumulates. A GNSS receiver gives a position and velocity fix from satellite signals, but each individual measurement carries its own noise, and the receiver's solution can degrade or drop out depending on signal geometry and visibility. None of these, alone, is "the truth." The job of this family is to fuse them — combine measurements with different error characteristics, different update rates, and different failure modes into one coherent estimate of the full state, together with a covariance that honestly describes how much uncertainty remains.

The general tool built for exactly this problem is the Kalman filter and its relatives, which this curriculum covers in its own dedicated modules. The shape worth carrying into this lesson is the predict-and-update cycle: between absolute measurements, the filter propagates its estimate forward using a dynamics model — $\hat{\mathbf{x}}^-_k = \boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}$ for the state, $\mathbf{P}^-_k = \boldsymbol{\Phi}\mathbf{P}_{k-1}\boldsymbol{\Phi}^{\mathsf T} + \mathbf{Q}$ for how its uncertainty grows while doing so, where $\boldsymbol{\Phi}$ is the state transition over one step and $\mathbf{Q}$ is the process noise added by whatever the model does not capture perfectly — and then corrects that prediction whenever a new measurement arrives, pulling the estimate and shrinking its uncertainty in proportion to how much the filter trusts the new data relative to what it already believed. Every specific sensor and technique below is an instance of feeding this cycle.

::: key
Navigation and State Estimation, Navigation and Orbit Determination, and Precise Navigation Solutions (Starlink): star tracker and signals-based attitude determination, inertial propagation, GNSS, and orbit determination — the family that turns noisy measurements from several different sensors into one trusted, uncertainty-quantified state.
:::

## Star tracker and signals-based attitude determination

A star tracker is a camera that images the surrounding star field and matches what it sees against an onboard star catalog to solve directly for absolute attitude — precise, but limited to whatever update rate the imaging and matching cycle allows, and vulnerable to being blinded when the Sun, Earth, or Moon crosses its field of view. Owning this sensor well means more than reading its output: it means characterizing and correcting its boresight alignment relative to the satellite body, understanding its noise behavior, and knowing exactly how to treat a period when it cannot see anything useful at all.

Signals-based attitude determination is a different route to a similar answer: using the geometry of received radio or navigation signals — differential carrier-phase measurements across multiple antennas, for instance — to derive an attitude solution without a star tracker's direct optical fix. It tends to be coarser than a good star tracker, but it is available under different conditions and from different hardware already on the satellite for other reasons, which makes it a genuinely useful complementary technique rather than a like-for-like replacement.

## Inertial propagation: what fills the gaps

Between absolute fixes from either of the above, a gyroscope's measured angular rate propagates the attitude estimate forward — the $\boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}$ step above, applied to attitude specifically. The reason this cannot run unaided forever is that a real gyroscope carries a small bias, and integrating a biased rate measurement accumulates error steadily over time.

::: example Why an unaided gyro cannot be trusted indefinitely
Consider a gyroscope with a bias of $0.01^{\circ}/\mathrm{hr}$ — a reasonable order of magnitude for a capable but unexceptional inertial sensor — propagating attitude alone during a ten-minute period when the star tracker is unavailable, blinded by a bright object in its field of view. The accumulated drift is bias multiplied by elapsed time:

$$
\theta_{\text{drift}} = \left(0.01\ \frac{{}^{\circ}}{\mathrm{hr}}\right)\times\left(\frac{10}{60}\ \mathrm{hr}\right) \approx 0.0017^{\circ} \approx 6\ \text{arcseconds}
$$

Six arcseconds in ten minutes sounds small, and for many purposes it is tolerable — but it accumulates linearly with every additional minute the star tracker stays unavailable, and a filter that does not account honestly for this growing uncertainty during the gap will report a confidence in its attitude estimate that the physics no longer supports. This is exactly why the predict step's covariance growth term, $\mathbf{Q}$, matters as much as the state prediction itself: it is what keeps the filter's stated uncertainty honest while it is running blind.
:::

## GNSS and orbit determination

A satellite in low Earth orbit can use GNSS receivers to fix its own position and velocity much the way a ground user does, since constellations like Starlink orbit well below the GNSS satellites themselves and receive their signals with a well-established geometry. A single GNSS fix, though, is a snapshot — a position and velocity at one instant, with its own measurement noise. Orbit determination is the broader process built on top of that: fitting a consistent trajectory, often fusing GNSS measurements with other tracking data over time, that the satellite's actual dynamics — gravity, drag, and whatever other perturbations matter at its altitude — must be consistent with, rather than treating each fix as an independent, disconnected data point.

Why this needs to be precise, not merely adequate, is a real and concrete reason rather than an abstract preference: a pointing family covered in the next lesson depends directly on knowing where the satellite is in order to aim anything at a fixed ground point, and a fleet the size of a large constellation has a genuine, ongoing need for accurate conjunction assessment — knowing precisely enough where every satellite is to judge whether two objects are on a path close enough to require a maneuver. Both of those downstream needs are only as good as the orbit determination feeding them.

::: warning A confident filter is not the same thing as an accurate one
A filter that reports a small covariance is not automatically trustworthy — it is trustworthy only if that small covariance actually reflects how close its estimate is to the truth. A filter that is systematically overconfident, reporting less uncertainty than it actually carries, is often more dangerous than one that is honestly uncertain, because everything downstream that consumes its output will under-allocate margin against an error that is larger than advertised.
:::

::: example An overconfident filter, traced to its cause
An orbit determination filter for a constellation satellite reports a position uncertainty small enough that a downstream pointing calculation treats it as effectively exact. Over several weeks, though, independent tracking data shows the filter's actual position error running consistently larger than its own reported uncertainty would suggest is likely — a classic sign of an inconsistent filter, one whose confidence has become disconnected from its actual accuracy.

Tracing the cause, suppose the filter's process-noise term $\mathbf{Q}$ was tuned assuming a smoother atmospheric-drag model than the satellite is actually experiencing at its current altitude and solar-activity conditions — drag varies with atmospheric density, which is itself more volatile than the model assumed. The filter's predicted uncertainty growth between GNSS fixes is too small for the actual dynamics, so its covariance shrinks faster than its real error does, and it becomes overconfident. The fix is not "trust it less" as a blanket rule — it is retuning $\mathbf{Q}$ against the real drag environment, and rerunning a consistency check against independent tracking data until the filter's stated uncertainty and its actual error agree. Only then is the filter, and not merely its output on one lucky day, actually done.
:::

## What gets produced, reviewed, and called done

This family's artifacts are filter design documents — the chosen structure, the tuned process and measurement noise, and the justification for both — sensor calibration reports, such as a star tracker's characterized boresight alignment or an inertial sensor's bias and drift behavior, and orbit determination accuracy reports. What is reviewed is not only whether the filter's error is small on average; it is whether the filter is consistent — whether its reported covariance actually matches its real error, checked against independent data, the way the example above worked through. "Done," for a design in this family, means passing that consistency check across representative conditions, not merely producing a low average error on a convenient data set. An estimator that is accurate but overconfident has not finished the job this family actually asks for.

## Curriculum links, and the honest word on the degree line

The predict-and-update cycle this lesson has leaned on throughout is built in full in The Kalman Filter, and extended to the genuinely nonlinear versions this family actually uses — the EKF, UKF, and related filters — in this curriculum's nonlinear-filters module. Least Squares & Static Estimation covers the batch-estimation techniques that sit alongside sequential filtering for orbit determination work. Inertial Navigation & IMU Mechanization covers gyroscope and accelerometer modeling and propagation in full. GNSS/GPS and Spacecraft Sensors & Optical Navigation cover the specific sensors this lesson has named, and Orbit Determination pulls all of it together into the trajectory-fitting problem itself. Probability & Statistics underlies the consistency-checking concept this lesson has treated as the real definition of done.

Why this family's postings lean harder on formal credentials than most others in this module is worth stating honestly rather than left as an unexplained fact: choosing and validating an estimator structure — deciding an EKF's linearization is adequate, or that a UKF or a different approach is genuinely needed, and then proving consistency rather than assuming it — is closer to applied research than to routine engineering practice, and companies often weight formal training and the research habits it builds heavily for exactly that reason. None of that makes the underlying mathematics inaccessible to self-study; it is thoroughly documented and fully learnable outside a degree program. What closes the gap is not reading about it — it is a real navigation or orbit determination pipeline you built yourself, run against real data such as public GNSS broadcast ephemerides or tracking data, producing an honestly reported covariance and a genuine consistency check rather than only a plausible-looking trajectory plot. That evidence speaks directly to what this family's technical interviews actually probe. Whether it clears a specific posting's basic-qualification line on paper is a separate question this curriculum's module on levels and qualifications takes on directly — this lesson's job was to make sure you understand, and can demonstrate, the work itself.

## Check yourself

::: check
Explain why no single sensor this lesson covers — star tracker, gyroscope, or GNSS receiver — can be trusted alone to produce a satellite's state, using each sensor's specific limitation.
:::

::: answer
A star tracker gives a precise absolute attitude fix but only intermittently, and it can be blinded by bright objects in its field of view. A gyroscope gives a continuous rate measurement, but integrating it into an attitude accumulates drift from any uncorrected bias over time. A GNSS receiver gives position and velocity, but each fix carries measurement noise and the solution can degrade with signal geometry. Each sensor is strong exactly where another is weak, which is why this family's core task is fusing them into one estimate rather than trusting any single source.
:::

::: check
A gyroscope with a larger bias than the example in this lesson is propagating attitude during a longer gap in star-tracker coverage. Explain, without recomputing the exact number, why both the bias magnitude and the gap length matter to how much the filter's uncertainty should grow during that period.
:::

::: answer
Accumulated drift is bias multiplied by elapsed time, so a larger bias produces more drift for the same gap, and a longer gap produces more drift for the same bias — the two combine multiplicatively, not independently. A filter's process-noise growth during the gap has to reflect both factors together; using a fixed uncertainty-growth rate regardless of how long the gap has run, or regardless of which gyro is in use, would misstate the true uncertainty in exactly the way the overconfident-filter example in this lesson warns against.
:::

::: check
A filter reports very low position uncertainty, and a downstream team treats its output as effectively exact. What question should be asked before trusting that low uncertainty, and what evidence would answer it?
:::

::: answer
The question is whether the filter is consistent — whether its reported covariance actually matches its real error — not merely whether the reported number is small. Answering it requires checking the filter's estimates against independent data, such as separate tracking measurements, over enough time and enough varying conditions to see whether the actual error stays within the bounds the covariance predicts, rather than accepting a single low-uncertainty output at face value.
:::

::: check
Why does accurate orbit determination matter concretely for a large satellite constellation, beyond "knowing where things are" as a general good?
:::

::: answer
Two concrete downstream needs depend on it directly: a beam- or antenna-pointing system needs to know where the satellite actually is to aim correctly at a ground target, and conjunction assessment across a large fleet needs to know each satellite's position precisely enough to judge whether two objects are on a path close enough to warrant a maneuver. Both of those depend entirely on the quality of the orbit determination feeding them — an imprecise or overconfident estimate degrades both.
:::

::: check
This lesson says research on 2026 postings found this family more likely than the general GNC Engineer or SRE ladders to require a Master's or PhD. Give the reason this lesson offers for that pattern, and the kind of self-study evidence it says can still demonstrate readiness for the work.
:::

::: answer
The reason given is that choosing and validating an estimator's structure, and proving it is genuinely consistent rather than merely low-error on convenient data, is closer to applied research than to routine engineering practice, which is part of why formal training is often weighted heavily for these roles. The self-study evidence this lesson names as genuinely demonstrative is a real navigation or orbit determination pipeline, built by the candidate and run against real data, that reports an honest covariance and includes an actual consistency check — not only a plausible trajectory plot.
:::

## Summary

| Concept | Relation | What it captures |
| --- | --- | --- |
| State propagation | $\hat{\mathbf{x}}^-_k = \boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}$ | Carrying the estimate forward using the dynamics model between measurements |
| Covariance propagation | $\mathbf{P}^-_k = \boldsymbol{\Phi}\mathbf{P}_{k-1}\boldsymbol{\Phi}^{\mathsf T} + \mathbf{Q}$ | How uncertainty grows while propagating, including what the model does not capture |
| Star tracker | — | Precise, intermittent, absolute attitude fix; vulnerable to blinding |
| Gyroscope | — | Continuous rate; integrated attitude drifts with uncorrected bias |
| GNSS | — | Position and velocity fix with its own noise; fused, not trusted alone |
| Filter consistency | — | Reported covariance actually matches real error, checked against independent data |

The next lesson leaves pure estimation behind and moves to the actuator and pointing side of the constellation group: Starlink Controls and Embedded Controls, and the beam-pointing problem that depends directly on the navigation solution this lesson has built.
