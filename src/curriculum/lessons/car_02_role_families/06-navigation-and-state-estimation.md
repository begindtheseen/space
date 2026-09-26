---
id: l06-navigation-and-state-estimation
title: "Navigation and State Estimation: knowing where you actually are"
minutes: 21
covers:
  - "Navigation and State Estimation, Navigation and Orbit Determination, Precise Navigation Solutions (Starlink): star tracker and signals-based attitude determination, inertial propagation, GNSS, orbit determination"
---

Imagine walking through your house at night with the lights off. You count your steps, and you feel for the edge of a table. Now and then, a car's headlights flash through a window and you glimpse the room for a second. You put all of that together into one best guess of where you are — and you also know roughly how sure you are. Right after the flash you are quite sure. After twenty steps in the dark, much less.

That is this family's job, for a satellite. The last lesson drew a line, deliberately soft, between attitude determination and attitude control, and promised to go deeper into determination. Here we are.

Postings for this family appear under several related titles: **Navigation and State Estimation**, **Navigation and Orbit Determination** and **Precise Navigation Solutions**. All of them describe versions of one problem. Take noisy, partial, late sensor measurements. Turn them into a single trusted estimate of where a satellite is and which way it points. And state honestly how much that estimate should be trusted.

This is the most estimation-theoretic family in the module — the one that leans hardest on the mathematics of making best guesses from imperfect data. So it is worth saying plainly, up front: research on 2026 postings found roles in this family more likely than the general GNC Engineer or Site Reliability Engineer ladders to list a [[Master's or PhD|advanced-degrees]] in an engineering discipline, computer science or physics as a **basic qualification** (a must-have) rather than a **preferred** one (a nice-to-have).

Don't hide from that fact, and don't be discouraged by it. This lesson explains why the depth this family asks for tends to track formal training, what the technical content is, and — because the mathematics itself can be fully learned outside a degree program — what self-built evidence truly demonstrates it.

## No sensor tells you the truth by itself

Every sensor this family uses is imperfect in its own particular way.

- A **star tracker** gives a precise, absolute attitude fix. But only when it can see enough stars well, and it cannot update continuously.
- A **gyroscope**, or **gyro**, measures how fast the satellite is turning, all the time. But adding up those turn rates to get an attitude drifts over time, because any small uncorrected **bias** — a constant error in the reading — piles up.
- A **GNSS receiver** (said "G-N-S-S", for **Global Navigation Satellite System**; GPS is one example) gives a position and velocity from satellite signals. But each measurement has its own noise, and the answer can get worse or drop out depending on which signals it can see.

None of these alone is "the truth". The job of this family is to **fuse** them: to combine measurements with different kinds of error, different update rates and different ways of failing into one coherent estimate of the full **state** — everything you need to know about the satellite's position, speed and orientation. Along with it comes a **[[covariance|covariance]]**: a matrix of numbers that honestly describes how much uncertainty remains, like error bars.

### The predict-and-update cycle

The general tool for this problem is the **[[Kalman filter|kalman-history]]** and its relatives, which this course builds in its own modules. The shape to carry into this lesson is its **[[predict-and-update cycle|predict-update]]**.

**Predict.** Between absolute measurements, the filter carries its estimate forward using a model of how the satellite moves:

$$
\hat{\mathbf{x}}^-_k = \boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}
$$

Read it as "x-hat minus at step k equals Phi times x-hat at step k minus one". The hat means "estimate". The minus sign means "before the new measurement". $\boldsymbol{\Phi}$ (capital Greek phi) is the **state transition** — the rule that moves the state forward one time step.

At the same time, the filter tracks how its uncertainty grows while it does so:

$$
\mathbf{P}^-_k = \boldsymbol{\Phi}\mathbf{P}_{k-1}\boldsymbol{\Phi}^{\mathsf T} + \mathbf{Q}
$$

Here $\mathbf{P}$ is the covariance, the $\mathsf{T}$ means "transpose" (the matrix flipped across its diagonal), and $\mathbf{Q}$ is the **process noise**: extra uncertainty added for everything the model does not capture perfectly. In words: old uncertainty, carried forward, plus new uncertainty from the model's imperfection.

**Update.** Whenever a new measurement arrives, the filter corrects its prediction. It pulls the estimate toward the measurement and shrinks its uncertainty, in proportion to how much it trusts the new data compared with what it already believed.

Every sensor and technique below is a way of feeding this cycle.

::: key
Navigation and State Estimation, Navigation and Orbit Determination, and Precise Navigation Solutions (Starlink): star tracker and signals-based attitude determination, inertial propagation, GNSS, and orbit determination — the family that turns noisy measurements from several different sensors into one trusted, uncertainty-quantified state. It is the most estimation-theoretic family, and its specialist variants generally require a Master's or PhD.
:::

## Star tracker and signals-based attitude determination

### Star trackers

A **[[star tracker|star-tracker]]** is a camera that photographs the star field around it. It matches the pattern against an onboard **star catalog** — a stored map of stars — and solves directly for absolute attitude.

It is precise. But it can only update as fast as it can take a picture and match it. And it can be **blinded** when the Sun, Earth or Moon crosses its field of view.

Owning this sensor well means more than reading its output. It means measuring and correcting its **boresight alignment** — exactly which way the camera points relative to the satellite body. It means understanding its noise. And it means knowing exactly how to handle a stretch when it can see nothing useful at all.

### Signals-based attitude determination

**[[Signals-based attitude determination|carrier-phase]]** reaches a similar answer by a different road. It uses the geometry of received radio or navigation signals — for example, **differential carrier-phase** measurements across several antennas — to work out attitude without a star tracker's direct optical fix.

It tends to be coarser than a good star tracker. But it works under different conditions, and it uses hardware already on the satellite for other reasons. That makes it a useful partner technique, not a like-for-like replacement.

## Inertial propagation: what fills the gaps

**Inertial propagation** means carrying the attitude forward between absolute fixes using the gyro's measured turn rate. It is the $\boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}$ step above, applied to attitude.

It cannot run on its own forever. A real gyro has a small bias, and adding up a biased rate reading builds up error steadily over time — like a watch that runs two seconds fast each day.

::: example Why an unaided gyro cannot be trusted indefinitely
Take a gyro with a bias of $0.01^{\circ}/\mathrm{hr}$ — one hundredth of a degree per hour, a reasonable size for a capable but ordinary inertial sensor. It is carrying the attitude alone for ten minutes while the star tracker is blinded by a bright object.

**Step 1 — the rule.** Drift is bias times elapsed time.

**Step 2 — put time in hours**, to match the bias units: $10\ \text{min} = \frac{10}{60}\ \mathrm{hr} = \frac{1}{6}\ \mathrm{hr}$.

**Step 3 — multiply.**

$$
\theta_{\text{drift}} = \left(0.01\ \frac{{}^{\circ}}{\mathrm{hr}}\right)\times\left(\frac{10}{60}\ \mathrm{hr}\right) \approx 0.0017^{\circ}
$$

**Step 4 — convert to [[arcseconds|arcseconds]].** One degree is 3,600 arcseconds, so $0.0017^{\circ} \times 3600 \approx 6$ arcseconds.

Sanity check: the hours cancel, leaving degrees, as a drift angle should. And ten minutes is a sixth of an hour, so the drift is a sixth of the hourly bias — about $0.0017^{\circ}$, as found.

Six arcseconds in ten minutes sounds small, and for many purposes it is tolerable. But it grows in a straight line with every extra minute the star tracker stays blind. A filter that does not honestly account for this growing uncertainty during the gap will claim more confidence in its attitude than the physics supports.

That is why the $\mathbf{Q}$ term in the predict step matters as much as the state prediction itself. It is what keeps the filter's stated uncertainty honest while it is running blind.
:::

## GNSS and orbit determination

A satellite in low Earth orbit can use GNSS receivers to fix its own position and velocity, much as a phone does on the ground. Constellations like Starlink orbit [[far below the GNSS satellites|gnss-altitude]], so they receive those signals with a well-understood geometry.

A single GNSS fix, though, is a snapshot: position and velocity at one instant, with its own noise. **Orbit determination** is the bigger process built on top of that. It fits one consistent path through many measurements over time — often fusing GNSS with other tracking data. That path must obey the satellite's real physics: gravity, drag, and whatever other pushes matter at its altitude. Each fix is not treated as an independent, disconnected dot.

Why must it be precise, not merely good enough? For two concrete reasons.

1. **Pointing.** A pointing family, covered in the next lesson, needs to know where the satellite is in order to aim anything at a fixed spot on the ground.
2. **Collision checks.** A fleet the size of a large constellation has a constant need for accurate **[[conjunction assessment|conjunction]]** — knowing precisely enough where every satellite is to judge whether two objects are on paths close enough to need a dodge.

Both are only as good as the orbit determination feeding them.

::: warning A confident filter is not the same thing as an accurate one
A filter that reports a small covariance is not automatically trustworthy. It is trustworthy only if that small covariance matches how close its estimate really is to the truth. A filter that is systematically **overconfident** — reporting less uncertainty than it really has — is often more dangerous than one that is honestly unsure. Everything downstream that uses its output will leave too little safety margin against an error bigger than advertised.
:::

::: example An overconfident filter, traced to its cause
**The symptom.** An orbit determination filter for a constellation satellite reports a position uncertainty so small that a downstream pointing calculation treats it as exact. Over several weeks, independent tracking data shows the filter's real position error running consistently larger than its own reported uncertainty says is likely. That is the classic sign of an **inconsistent filter**: its confidence has come loose from its real accuracy.

**The cause.** Suppose the filter's process noise $\mathbf{Q}$ was tuned for a smoother **[[atmospheric-drag|drag-and-sun]]** model than the satellite actually meets at its current altitude and level of solar activity. Drag depends on air density, and density swings around more than the model assumed. So:

1. the filter's predicted uncertainty growth between GNSS fixes is too small for the real dynamics;
2. its covariance shrinks faster than its real error does;
3. it becomes overconfident.

**The fix.** It is not a blanket "trust it less". It is to retune $\mathbf{Q}$ against the real drag environment, then rerun a consistency check against independent tracking data until the filter's stated uncertainty and its real error agree.

Sanity check on "done": one day of good-looking output proves little. Only when the consistency check passes across the conditions the satellite really meets is the filter — not merely its output on one lucky day — finished.
:::

## What gets produced, reviewed, and called done

This family's **artifacts** — the finished pieces of work others review — are:

- **filter design documents**: the chosen structure, the tuned process and measurement noise, and the reasons for both;
- **sensor calibration reports**, such as a star tracker's measured boresight alignment or a gyro's bias and drift behavior;
- **orbit determination accuracy reports**.

What is reviewed is not only whether the filter's error is small on average. It is whether the filter is **[[consistent|consistency]]**: whether its reported covariance matches its real error, checked against independent data, as in the example above.

"Done", for a design in this family, means passing that consistency check across representative conditions. A low average error on a convenient data set is not enough. An estimator that is accurate but overconfident has not finished the job this family asks for.

## Course links, and the honest word on the degree line

Here is where the pieces live in this course:

- **The Kalman Filter** builds the predict-and-update cycle in full. The nonlinear-filters module extends it to the versions this family really uses — the **EKF** and **UKF** (extended and unscented Kalman filters) and relatives.
- **Least Squares & Static Estimation** covers the **batch** methods — fitting all the data at once — that sit alongside step-by-step filtering in orbit determination.
- **Inertial Navigation & IMU Mechanization** covers gyro and accelerometer modeling and propagation.
- **GNSS/GPS** and **Spacecraft Sensors & Optical Navigation** cover the sensors named here.
- **Orbit Determination** pulls it all together into the path-fitting problem.
- **Probability & Statistics** underlies consistency checking, which this lesson treats as the real definition of done.

Why do this family's postings lean harder on formal degrees than most others in this module? Here is the honest reason. Choosing and validating an estimator's structure is closer to applied research than to routine engineering. That means deciding whether an EKF's simplifications are good enough, or whether a UKF or another approach is truly needed — and then *proving* consistency instead of assuming it. Companies often weight formal training, and the research habits it builds, heavily for exactly that reason. The same pattern shows up in [[one other specialist family|ops-automation]].

None of that makes the mathematics off-limits to self-study. It is thoroughly documented and can be fully learned outside a degree. What closes the gap is not reading about it. It is a real navigation or orbit determination pipeline you built yourself, run against real data — such as public GNSS broadcast **ephemerides** (tables of where the GNSS satellites are) or tracking data. It should report an honest covariance and include a genuine consistency check, not only a nice-looking trajectory plot. That evidence speaks directly to what this family's technical interviews probe.

Whether it clears a specific posting's basic-qualification line on paper is a separate question. This course's module on levels and qualifications takes it on directly. This lesson's job was to make sure you understand the work itself, and can demonstrate it.

## Check yourself

::: check
Explain why no single sensor this lesson covers — star tracker, gyroscope, or GNSS receiver — can be trusted alone to produce a satellite's state, using each sensor's specific limitation.
:::

::: answer
A star tracker gives a precise absolute attitude fix, but only now and then, and bright objects in its view can blind it. A gyro measures turn rate all the time, but adding it up into an attitude builds drift from any uncorrected bias. A GNSS receiver gives position and velocity, but each fix carries noise, and the answer can get worse with poor signal geometry. Each sensor is strong exactly where another is weak. That is why this family's core task is fusing them into one estimate instead of trusting any single source.
:::

::: check
A gyroscope with a larger bias than the example in this lesson is propagating attitude during a longer gap in star-tracker coverage. Explain, without recomputing the exact number, why both the bias magnitude and the gap length matter to how much the filter's uncertainty should grow during that period.
:::

::: answer
Drift is bias multiplied by elapsed time. A larger bias gives more drift for the same gap; a longer gap gives more drift for the same bias. The two combine by multiplying, not separately — double both and the drift is four times as big. So the filter's uncertainty growth during the gap has to reflect both together. Using a fixed growth rate regardless of how long the gap has run, or of which gyro is in use, would misstate the true uncertainty — exactly the overconfidence this lesson warns against.
:::

::: check
A filter reports very low position uncertainty, and a downstream team treats its output as effectively exact. What question should be asked before trusting that low uncertainty, and what evidence would answer it?
:::

::: answer
The question is whether the filter is *consistent* — whether its reported covariance matches its real error — not merely whether the number is small. To answer it, check the filter's estimates against independent data, such as separate tracking measurements, over enough time and varied enough conditions to see whether the real error stays inside the bounds the covariance predicts. A single low-uncertainty output, taken at face value, proves nothing.
:::

::: check
Why does accurate orbit determination matter concretely for a large satellite constellation, beyond "knowing where things are" as a general good?
:::

::: answer
Two concrete needs depend on it directly. First, a beam- or antenna-pointing system must know where the satellite really is to aim correctly at a ground target. Second, conjunction assessment across a large fleet must know each satellite's position precisely enough to judge whether two objects are on paths close enough to need a maneuver. Both are only as good as the orbit determination feeding them, so an imprecise or overconfident estimate degrades both.
:::

::: check
This lesson says research on 2026 postings found this family more likely than the general GNC Engineer or SRE ladders to require a Master's or PhD. Give the reason this lesson offers for that pattern, and the kind of self-study evidence it says can still demonstrate readiness for the work.
:::

::: answer
The reason: choosing and validating an estimator's structure — and proving it is truly consistent, not merely low-error on convenient data — is closer to applied research than to routine engineering, so formal training is often weighted heavily for these roles. The self-study evidence it names is a real navigation or orbit determination pipeline, built by the candidate and run against real data, that reports an honest covariance and includes an actual consistency check — not only a plausible trajectory plot.
:::

## Summary

| Concept | Relation | What it captures |
| --- | --- | --- |
| State propagation | $\hat{\mathbf{x}}^-_k = \boldsymbol{\Phi}\hat{\mathbf{x}}_{k-1}$ | Carrying the estimate forward with the motion model between measurements |
| Covariance propagation | $\mathbf{P}^-_k = \boldsymbol{\Phi}\mathbf{P}_{k-1}\boldsymbol{\Phi}^{\mathsf T} + \mathbf{Q}$ | How uncertainty grows while predicting, including what the model misses |
| Star tracker | — | Precise, intermittent, absolute attitude fix; can be blinded |
| Gyroscope | — | Continuous turn rate; integrated attitude drifts with bias ($0.01^{\circ}/\mathrm{hr}$ for 10 min $\approx 6$ arcsec) |
| GNSS | — | Position and velocity fix with its own noise; fused, not trusted alone |
| Filter consistency | — | Reported covariance matches real error, checked against independent data |
| Degree line | — | Most estimation-theoretic family; specialist variants generally require a Master's or PhD |

The next lesson leaves pure estimation behind and moves to the actuator and pointing side of the constellation group: Starlink Controls and Embedded Controls, and the beam-pointing problem that depends directly on the navigation solution this lesson has built.

::: context advanced-degrees What a Master's and a PhD are
After a four-year bachelor's degree, a **Master's** is usually one or two more years of advanced classes, sometimes with a research project. A **PhD** (Doctor of Philosophy, said "P-H-D") usually takes four to six more years, most of it spent doing original research and writing it up as a long thesis. For estimation work, the research years are where people practice exactly the "prove it, don't assume it" habit this lesson describes.
:::

::: context covariance Error bars that come in shapes
A single number with error bars says "5, give or take 1". With several quantities at once — say, position along track and across track — the uncertainty has a shape, often an ellipse, because errors in one direction can be linked to errors in another. The covariance matrix stores that shape: its diagonal holds each quantity's spread squared, and the off-diagonal numbers say how the errors lean together.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="85" x2="300" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="155" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="85" rx="100" ry="36" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2" transform="rotate(-25 180 85)"/>
  <circle cx="180" cy="85" r="4" fill="#1f2a44"/>
  <text x="304" y="89" font-size="11" fill="#1f2a44">along</text>
  <text x="186" y="24" font-size="11" fill="#1f2a44">across</text>
  <text x="180" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">tilted ellipse: the two errors tend to move together</text>
</svg>
```
:::

::: context kalman-history Where the Kalman filter came from
Rudolf Kálmán published the filter in 1960. Engineers at NASA's Ames Research Center, led by Stanley Schmidt, quickly adapted it for navigating Apollo spacecraft to the Moon, where the onboard computer had to blend star sightings and other measurements into a trusted state. The extended Kalman filter they helped develop is still a workhorse in navigation software today.
:::

::: context predict-update The sawtooth of uncertainty
Uncertainty grows while the filter predicts in the dark, and drops each time a measurement arrives. Plot it and you get a sawtooth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,100 100,70 100,105 160,75 160,105 220,75 220,105 280,75 280,105 340,75" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="100" cy="105" r="3.5"/><circle cx="160" cy="105" r="3.5"/><circle cx="220" cy="105" r="3.5"/><circle cx="280" cy="105" r="3.5"/></g>
  <text x="130" y="60" font-size="11" text-anchor="middle" fill="#1d6fd1">predict: grows</text>
  <text x="250" y="122" font-size="11" text-anchor="middle" fill="#b4232c">update: drops</text>
  <text x="190" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="28" y="80" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 28 80)">uncertainty</text>
</svg>
```

A longer gap between measurements means a taller tooth — the lesson's blinded star tracker, drawn.
:::

::: context star-tracker How a camera finds its way by the stars
A star tracker spots bright points in its picture and measures the angles between them. Triangles of stars make patterns as unique as fingerprints, so the software can search its catalog for the matching triangle, name the stars, and from that work out exactly which way the camera faces. Good trackers do this to within a few arcseconds, several times a second.
:::

::: context carrier-phase Two antennas and a tilted wave
A radio signal from a distant satellite arrives as flat, parallel wavefronts. If two antennas on your spacecraft sit a distance $d$ apart, a signal coming in at an angle reaches the nearer antenna a little before the other (in the picture, the right one first). The extra path is $d\cos\theta$, where $\theta$ is the angle between the baseline and the direction to the source. Measuring that extra path as a fraction of the wavelength tells you the angle — and with three or more antennas, the attitude.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="150" x2="280" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="290" y1="167" x2="222" y2="50" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="322" y1="143" x2="270" y2="52" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="300" y="44" font-size="11" text-anchor="middle" fill="#1d6fd1">wavefronts</text>
  <line x1="230" y1="63" x2="265" y2="43" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="80" y1="150" x2="230" y2="63" stroke="#b4232c" stroke-width="3"/>
  <text x="160" y="92" font-size="11" text-anchor="end" fill="#b4232c">extra path d cos θ</text>
  <circle cx="80" cy="150" r="6" fill="#1d6fd1"/>
  <circle cx="280" cy="150" r="6" fill="#1d6fd1"/>
  <text x="180" y="172" font-size="11" text-anchor="middle" fill="#1f2a44">baseline d</text>
  <text x="112" y="145" font-size="11" fill="#1f2a44">θ</text>
</svg>
```
:::

::: context arcseconds How small is six arcseconds?
A circle has 360 degrees; each degree splits into 60 arcminutes, and each arcminute into 60 arcseconds, so a degree holds 3,600 arcseconds. Six arcseconds is about the angle a US quarter (24 mm across) covers seen from roughly 830 meters away. Tiny — but a satellite pointing a narrow beam at the ground from hundreds of kilometers up cares about angles this small.
:::

::: context gnss-altitude Receiving GPS from above the ground
GPS satellites orbit about 20,200 kilometers up; Starlink satellites fly around 550 kilometers. So a Starlink satellite sits deep inside the GNSS "sky" and sees signals coming down on it much as a phone on the ground does. GPS is the American system; Europe's Galileo, Russia's GLONASS and China's BeiDou are others, and together they are called GNSS.
:::

::: context conjunction Near misses in orbit
A **conjunction** is a predicted close approach between two objects in orbit. Operators get warnings, estimate the chance of collision from both objects' orbits and their covariances, and move a satellite if the chance is too high. With thousands of satellites, Starlink performs many such avoidance maneuvers and reports them to its US regulator, the FCC, twice a year. An overconfident orbit can hide a real risk; an underconfident one triggers needless maneuvers.
:::

::: context drag-and-sun When the sky gets thicker
The thin air in low orbit puffs up when the Sun is active. In February 2022, a geomagnetic storm raised air density right after a Starlink launch, while the 49 new satellites were still very low; about 40 of them could not climb away and reentered. Density swings like this are exactly what a drag model — and the $\mathbf{Q}$ that covers its mistakes — must allow for.
:::

::: context consistency Testing whether a filter is honest
If a filter says "my position error has a one-sigma size of 10 meters", then about two-thirds of the time its real error in that direction should be within 10 meters, and it should almost never be 40 meters off. A consistency test compares real errors, measured with independent data, against the filter's own stated spread over many samples. Statistically, engineers use tests like the normalized estimation error squared (NEES), which you will meet in the Kalman filter module.
:::

::: context ops-automation The other specialist variant
The same 2026 research found one other specialist variant listing a Master's or PhD as a basic qualification: GNC Software Engineer, Operations Automation. You will meet it in the lesson on software and infrastructure families. The general GNC Engineer and Site Reliability Engineer ladders, by contrast, did not.
:::
