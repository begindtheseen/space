---
id: l07-embedded-controls-and-beam-pointing
title: "Embedded Controls and Beam Pointing: actuators and aim"
minutes: 19
covers:
  - "Starlink Controls and Embedded Controls: solar array actuators, antenna gimbals, active optics, Hall thruster fluid and power control"
  - "Device Navigation and Beam Pointing, Beam Planning: user terminal pointing, RF and optical link pointing"
---

The two families this lesson covers sit next to each other on a real satellite and rarely get discussed with the same attention the vehicle families receive, which makes them easy to overlook and, for the right background, easy to underrate as a target. Both are Starlink-side postings, and both are closer to hands-on engineering than to the estimation theory of the previous lesson or the rigid-body dynamics of the one before it. Starlink Controls and Embedded Controls owns the actuators that make one satellite's subsystems physically do what they are told: solar arrays, antenna gimbals, active optics, and the fluid and power systems that run an electric thruster. Device Navigation and Beam Pointing, together with Beam Planning, owns a different problem entirely — keeping a communications link aimed at a target that is also moving, and, at constellation scale, deciding which satellite points at which terminal in the first place.

Neither family asks for the depth in orbital mechanics or rigid-body attitude dynamics that the ADCS or navigation families do. What they ask for instead — real closed-loop control of physical hardware in one case, and real geometric and scheduling reasoning built on someone else's navigation solution in the other — is exactly the kind of thing a strong embedded-systems or applied-software background can demonstrate directly, which makes this lesson's honest accessibility note, near the end, genuinely good news for a certain kind of self-taught candidate.

## Embedded Controls: one actuator, done correctly

Where ADCS, two lessons back, decides how the whole satellite body should be oriented, this family owns the local control loop that makes one specific actuator or subsystem actually deliver what a higher-level command asks for. A solar array actuator has to drive the array to a commanded angle — typically tracking the Sun to maximize power generation — and hold it there against whatever mechanical friction, backlash, or disturbance the drive train introduces. An antenna gimbal has to move a mechanically steered antenna to a commanded pointing direction and hold it, feeding directly into the beam-pointing problem covered later in this lesson. Active optics are steerable optical elements — fine-pointing mirrors or similar mechanisms — used on optical terminals for inter-satellite laser links, where the pointing precision required, covered below, is far tighter than any single gimbal can hold on its own. A Hall-effect thruster's fluid and power control has to coordinate propellant flow rate and the power processing unit's discharge power together, since commanding a change in thrust genuinely changes both at once — this is a coupled control problem, not two independent single-axis loops running side by side.

Each of these is, at its core, a classical or digital control-loop design problem — closer to a lead-lag compensator or a discrete PID running on an embedded processor than to the three-axis quaternion control of the ADCS family — paired with the firmware engineering to implement that loop correctly, deterministically, and within whatever timing the hardware demands. This is also the clearest place in this entire module where hardware-in-the-loop testing is not an occasional activity but close to the daily rhythm of the job: a control loop for a physical actuator is validated against that actuator, or a faithful bench representation of it, because a simulation of the actuator's dynamics is only ever an approximation of how the real motor, gear train, or valve actually behaves.

::: key
Starlink Controls and Embedded Controls: solar array actuators, antenna gimbals, active optics, and Hall thruster fluid and power control — local, actuator-level control loops and the firmware that runs them, validated against real or representative hardware rather than simulation alone.
:::

::: example A solar array drive that will not settle
A solar array actuator is commanded to a new angle and, instead of settling smoothly, oscillates slightly around the target for several seconds before finally stabilizing — behavior that was not present in the control loop's simulation-only validation. Bench testing against the actual drive hardware reproduces the oscillation reliably, which already tells the engineer something a pure simulation could not have: this is a real hardware effect, not a modeling artifact from an unrelated software change.

Tracing it further, suppose the drive train has a small amount of mechanical backlash — a little play in the gearing before it engages fully in a given direction — that the original control loop's model did not represent. Near the target angle, the controller's corrective commands are small enough that they fall partly within this play, producing exactly the kind of small-amplitude oscillation observed on the bench. The fix is not simulated first and then trusted; it is retuned or restructured — commonly by adjusting the controller's behavior near the target to compensate for the known backlash — and then validated again against the same bench hardware, because a fix to a hardware-driven problem has to be proven against hardware, not against the same simulation that missed it the first time.
:::

## Beam Pointing and Beam Planning: aiming at something that also moves

Once a satellite knows its own position and orientation — the previous lesson's output — and a ground user terminal's location is known, pointing is the problem of computing the direction between the two and keeping an antenna or optical terminal aimed along it continuously as the satellite moves through its orbit. Beam Planning is the constellation-scale version of the same problem: with many satellites overhead and many terminals on the ground, deciding which satellite serves which terminal, and handing that responsibility off smoothly to another satellite as the first one moves out of view, is a scheduling and resource-allocation problem layered on top of the geometry.

Pointing accuracy is not free, and different links demand wildly different budgets. An RF link's beamwidth is comparatively wide, tolerant of pointing error measured in a meaningful fraction of a degree. An optical or laser inter-satellite link has an extremely narrow beam divergence by comparison, and its pointing tolerance is correspondingly far tighter — routinely measured in millionths of a radian rather than degrees. This is exactly why active optics, from the previous section, exists as its own line item rather than being folded into "gimbal pointing": a coarse gimbal can aim an optical terminal roughly in the right direction, but closing the last, much smaller gap to the precision an optical link actually needs requires a separate, faster, finer-grained steering mechanism.

::: key
Device Navigation and Beam Pointing, Beam Planning: user terminal pointing, RF and optical link pointing. Pointing needs to know where the satellite is and where the terminal is, and keep a beam on target through motion and changing geometry; Beam Planning is the constellation-level scheduling version, deciding which satellite serves which terminal as both move.
:::

::: example A pointing budget, combined honestly
Consider three independent contributors to a satellite antenna's total pointing error: attitude knowledge error of $0.05^{\circ}$ from the navigation solution, mechanical gimbal alignment error of $0.03^{\circ}$, and actuator pointing resolution of $0.02^{\circ}$. Because these are independent error sources, they do not add directly; their variances add, which means the combined standard deviation is the root-sum-square:

$$
\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \sigma_3^2} = \sqrt{0.05^2 + 0.03^2 + 0.02^2}\ {}^{\circ} \approx 0.062^{\circ} \approx 1080\ \mu\mathrm{rad}
$$

For an RF link, whose beamwidth is commonly a degree or more, a budget of roughly $0.062^{\circ}$ is comfortably inside tolerance — the link stays closed with real margin to spare. For an optical link, whose divergence is commonly tens of microradians rather than thousands, this same combined budget is far too loose by roughly one to two orders of magnitude, which is precisely why an optical terminal cannot rely on gimbal pointing alone and needs the active-optics fine-steering stage this lesson named earlier to close the remaining gap.
:::

::: warning Root-sum-square only applies to genuinely independent errors
Combining error sources by root-sum-square assumes they are statistically independent. Two error sources that share a common cause — a shared reference frame error that biases both the attitude knowledge and the gimbal alignment measurement in the same direction, for instance — are correlated, and treating them as independent understates the true combined error. Check the assumption before reaching for the formula, not after.
:::

## What a week looks like, and what counts as done

An engineer in Embedded Controls spends real time on a bench: debugging exactly the kind of oscillation traced above, characterizing an actuator's real response against its data sheet, and validating firmware changes against physical hardware before they are trusted anywhere near a flight unit. An engineer in Beam Pointing or Beam Planning spends real time investigating a degraded or dropped link — separating a genuine pointing error from an environmental cause such as rain fade on an RF link or cloud obstruction on an optical one, or from a scheduling conflict where two terminals briefly needed the same satellite's attention — and refining the scheduling logic that allocates satellites to terminals as the constellation moves.

"Done" for an Embedded Controls change means the control loop meets its settling and accuracy requirements in closed-loop testing against real or representative hardware, not only in simulation, and survives whatever qualification a flight-bound change requires. "Done" for a pointing or planning change means the link meets its required availability and accuracy across a representative range of geometries and conditions, with an honestly computed error budget behind it — the same standard of honesty the previous lesson insisted on for a navigation filter's stated uncertainty, applied here to a pointing budget instead.

## Curriculum links

Embedded Controls draws on Real-Time & Embedded Systems and Digital & Sampled-Data Control for the loop and its implementation, Classical Feedback Control Design and Signals, Systems & Transfer Functions for the control-design fundamentals underneath a lead-lag or PID structure, and Modern C++ for Flight and Simulation together with Real-Time Constraints and Allocation-Free Flight Code for firmware that has to run deterministically. A good deal of real industry control-loop design also happens in Simulink before it is ever hand-written, which is exactly what this curriculum's Simulink: Block Diagrams and First Models and Verification and Embedded Coder: Models to Flight Code modules build toward.

Beam Pointing and Beam Planning draw on the previous lesson's Orbit Determination and GNSS/GPS output directly, on Probability & Statistics for the error-budget reasoning this lesson has leaned on, and on Real-Time & Embedded Systems again for the pointing control loop's own implementation. Beam Planning's scheduling and resource-allocation flavor connects to this curriculum's Optimization module, since deciding which satellite serves which terminal under changing geometry is, underneath the operational language, a genuine constrained-assignment problem.

Against the six generic categories, Embedded Controls sits heavily in flight software and hardware-in-the-loop and test, with moderate analysis and comparatively little navigation or mission-design content of its own. Beam Pointing leans on navigation and sensors — consumed rather than owned, as the previous lesson's own boundary discussion would predict — and on analysis for its error budgets, with Beam Planning adding a real scheduling and resource-allocation layer that borders on operations rather than classical guidance work.

## An honest note on how open these doors are

Both families in this lesson are more reachable from self-study than the domain-theory-heavy families earlier in this module, and it is worth saying so plainly rather than treating every GNC family as equally hard to break into. Embedded Controls rewards exactly the kind of evidence a strong embedded-systems or mechatronics background can produce directly: a real closed-loop controller, driving real hardware — a motor, a gimbal, a valve — through a microcontroller, tuned and validated on a bench, with the same discipline the solar-array example in this lesson walked through. None of that requires orbital mechanics depth at all. Beam Pointing and Beam Planning reward geometric reasoning, comfortable use of someone else's navigation output, and a working sense of scheduling or resource allocation, which is reachable without the estimation-theory depth the previous lesson asked for, precisely because this family consumes a navigation solution rather than deriving one.

Neither family is a zero-prerequisite entry point. Both still expect real comfort with reference frames and coordinate transforms, and Beam Pointing expects at least a working, if not expert, grasp of link-budget concepts. But relative to the families that came before this lesson, these two ask for engineering breadth and hands-on rigor more than for years of specialized theoretical depth, which is exactly the honest distinction this module's objectives ask you to be able to draw.

## Check yourself

::: check
Explain, in terms of scope rather than difficulty, why Embedded Controls is a genuinely different kind of problem from the ADCS family covered two lessons ago.
:::

::: answer
ADCS decides how the whole satellite body should be oriented and manages momentum across the vehicle as a system. Embedded Controls owns the local control loop for one specific actuator or subsystem — a solar array drive, a gimbal, a thruster's fluid and power system — making sure that actuator delivers what a higher-level command asks of it. One is a whole-body, three-axis dynamics and estimation problem; the other is a set of local, often single- or few-axis control loops paired with the firmware and hardware validation to make each one behave correctly on real hardware.
:::

::: check
A control loop for a physical actuator performs correctly in simulation but oscillates on the hardware bench. What does this by itself already tell the engineer, and what should happen next?
:::

::: answer
It tells the engineer the problem is a real hardware effect the simulation did not capture, rather than a bug introduced by an unrelated software change — because the same control logic behaves differently against real hardware than it did against the model. What should happen next is investigating what the model is missing, such as mechanical backlash or an unmodeled dynamic, fixing the control logic to account for it, and validating the fix again against the same bench hardware rather than trusting a rerun of the original simulation.
:::

::: check
Using the pointing-budget example in this lesson, explain why an optical inter-satellite link needs active optics as a separate fine-steering stage, even when the satellite already has a gimbal pointing system.
:::

::: answer
A combined gimbal-based pointing budget on the order of a thousand microradians, as the worked example computed, is comfortably within an RF link's much wider beamwidth tolerance but is roughly one to two orders of magnitude too loose for an optical link's beam divergence, which is commonly tens of microradians. A coarse gimbal can point an optical terminal roughly in the right direction, but closing the remaining, much smaller gap to the precision an optical link actually requires needs a separate, finer, typically faster-responding steering mechanism — which is exactly the role active optics plays.
:::

::: check
Why does combining independent pointing-error contributors by root-sum-square, rather than by simple addition, give a more honest total error estimate — and when does that method stop being valid?
:::

::: answer
Independent random error sources combine in variance, not directly in magnitude, so the combined standard deviation is the square root of the sum of the individual variances rather than their simple sum — root-sum-square gives a smaller, statistically honest total than adding the errors outright would. The method stops being valid when the error sources are not actually independent — for example, when two of them share a common underlying cause, such as a shared reference-frame error biasing more than one contributor in the same direction — in which case treating them as independent understates the true combined error.
:::

::: check
A candidate has strong evidence of hands-on embedded control work — a tuned, hardware-validated actuator control loop — but little orbital mechanics or estimation background. According to this lesson, is that candidate well positioned for either family covered here, and why?
:::

::: answer
Yes, particularly for Embedded Controls, whose core demands — real closed-loop control-law design, firmware implementation, and hardware-in-the-loop validation — are exactly what that evidence demonstrates directly, without requiring orbital mechanics or attitude-estimation depth. That candidate is also reasonably well positioned for Beam Pointing, which consumes a navigation solution rather than deriving one and rewards geometric and scheduling reasoning more than estimation theory, provided they also build real comfort with reference frames and coordinate transforms, which both families still expect.
:::

## Summary

| Family | Owns | Consumes | Primary curriculum module |
| --- | --- | --- | --- |
| Embedded Controls | Local actuator control loops: arrays, gimbals, active optics, thruster fluid/power | Commanded setpoints from higher-level systems | Real-Time & Embedded Systems; Digital & Sampled-Data Control |
| Beam Pointing | Aiming one link at a moving target from a known state | The navigation solution (previous lesson) | Probability & Statistics (error budgets) |
| Beam Planning | Constellation-scale scheduling of which satellite serves which terminal | Pointing and navigation outputs across the fleet | Optimization |

The next lesson moves away from any single satellite's hardware or geometry entirely, to the two families that build the tools every other family in this module actually runs on: Software Engineer, GNC and Operations Automation, and Site Reliability Engineer, GNC.
