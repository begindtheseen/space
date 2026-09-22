---
id: l03-quantified-bullets
title: "Bullets that name a problem, a method, and a result"
minutes: 24
covers:
  - "quantified bullets: what you did, how, and the measured result"
---

A resume is a list of claims, and a bullet is the smallest unit one of those claims comes in. A reader cannot interview every applicant before deciding who to interview at all, so she has to weigh claims against each other sight unseen — which means a claim she cannot check is a claim she cannot weigh. "Worked on simulation and analysis" and "built a verified 6-DOF simulation" might describe the exact same three months of real effort, but only one of them gives a reader anything to check, compare, or ask a follow-up question about. This lesson is about closing that gap: turning a true but unfalsifiable sentence into one a reader can actually evaluate.

The fix is not enthusiasm, and it is not longer sentences. It is structure. Every strong bullet in a GNC resume contains three specific pieces, in a specific relationship to each other, and this lesson builds that structure once and then applies it, several times, to real project types from this curriculum — so that by the end you have not only been told the formula but have watched it applied to a 6-DOF simulation, a consistency-checked filter, a powered-descent solution, and an orbit-determination fit.

## The three parts: problem, method, result

A strong bullet names a problem: not a topic label like "simulation work," but the actual technical question that needed answering — does this vehicle model reproduce known physics, does this filter's reported uncertainty match its real error, does this guidance law reach the target within its propellant budget. A problem framed this way tells a reader what was actually at stake, which is different from, and more informative than, naming the general area you were working in.

A strong bullet names a method: the specific technique, not the domain it belongs to. "Simulation" is a domain; "a fixed-step RK4 integrator with a tabulated atmosphere model" is a method. "Estimation" is a domain; "a multiplicative quaternion extended Kalman filter" is a method. Naming the method tells a reader you made a specific engineering choice, rather than that you were present while something in a general area happened.

A strong bullet reports a measured result, with units, and — whenever it can — states how that result was obtained. This is the part most bullets skip, and it is the part that makes everything before it checkable rather than merely asserted. A result is not "the simulation worked" or "the filter performed well"; it is a number a reader can weigh: an error tolerance against a known solution, a convergence order, a percentile of a distribution, a residual. Stating how the number was obtained — compared against what, computed over how many trials — is what separates a measured result from a number that merely sounds precise.

All three parts do different work, and a bullet missing any one of them is weaker than it looks. A problem with no method is a description with nothing behind it. A method with no result is a tool name with no proof it was used correctly. A result with no problem or method attached is a number with no context — impressive-looking, perhaps, but disconnected from anything a reader can reason about. Together, the three parts make a complete, checkable claim: this specific thing needed solving, this specific approach was used, and here is the specific evidence it worked.

::: key
A strong bullet states a problem (the actual technical question), a method (the specific technique used, not the general domain), and a measured result with units and, where possible, how it was obtained. Each part alone is weak; together they make a claim a reader can check.
:::

## The phrases that erase the method

A short list of phrases shows up constantly in weak resumes, and every one of them has the same failure mode: it describes a relationship to work — you were assigned it, present for it, or adjacent to it — without describing the work itself. "Responsible for," "worked on," "helped with," "involved in," "assisted with," and "familiar with" all read as duty rather than accomplishment, and all of them give a reader nothing to follow up on. A reader cannot ask a meaningful question about "responsible for simulation tasks," because the sentence has already declined to say what those tasks were or what you specifically did among them.

The fix is a specific past-tense verb naming an action you actually took: built, designed, implemented, verified, tuned, diagnosed, derived, fitted, corrected. These verbs commit to a claim in a way the vague phrases do not, and committing to a claim is exactly what makes the sentence checkable — which is the entire point.

::: key
Replace "responsible for," "worked on," "helped with," and similar phrases with a specific action verb — built, implemented, verified, tuned, diagnosed. A vague phrase describes a relationship to the work; an action verb describes the work.
:::

::: example Rewrite one: a 6-DOF launch-vehicle simulation
Before: "Worked on a 6-DOF vehicle simulation for a class project."

After: "Built a fixed-step 6-DOF launch-vehicle simulation in C++ with an RK4 integrator and a tabulated atmosphere model; verified the rotational dynamics against the closed-form torque-free solution to within 1e-9 and confirmed fourth-order convergence under step-size refinement; ran a 10,000-case Monte Carlo dispersion campaign and reported 3-sigma apogee altitude and impact-point spread."

The problem is implicit but locatable: building a vehicle simulation trustworthy enough to run dispersion analysis on. The method is explicit and specific: fixed-step RK4, a tabulated rather than exponential atmosphere, in a named language. The result is a pair of numbers a reader can weigh directly — agreement with a known analytic case to a stated tolerance, a convergence order that confirms the integrator is implemented correctly, and a dispersion campaign whose output is a spread rather than a single run — exactly what a launch-vehicle team actually needs from a simulation.
:::

::: example Rewrite two: a quaternion EKF with a consistency check
Before: "Developed a Kalman filter for spacecraft attitude estimation."

After: "Implemented a multiplicative quaternion extended Kalman filter fusing simulated IMU and star-tracker measurements; ran a 200-case Monte Carlo against known truth trajectories and verified filter consistency with NEES and NIS statistics inside their chi-squared bounds at the 95% level, after diagnosing and correcting an initially overconfident covariance traced to an under-tuned gyro-bias process-noise term."

The problem here is sharper than "estimate attitude" — it is "prove the filter's reported uncertainty can be trusted," which is a materially harder and more senior question than simply getting a filter to run. The method names the specific filter formulation, not just "a Kalman filter." The result does two things a weak bullet never does: it reports a defined statistical test against a defined bound, and it names a real problem that was found and fixed along the way, which is stronger evidence of understanding than a filter that happened to work on the first attempt.
:::

::: example Rewrite three: powered-descent guidance with a landing Monte Carlo
Before: "Implemented a powered descent guidance algorithm."

After: "Implemented convex powered-descent guidance via lossless convexification, posed as a second-order cone program and solved in Python; ran a 5,000-case Monte Carlo over dispersed initial position, velocity and mass, and reported a 99th-percentile landing-position error under 12 meters with a propellant margin retained above the fuel-optimal solution."

The problem — landing accurately under real uncertainty in initial conditions, not just landing once in a nominal case — only becomes visible once the result reports a percentile over a dispersion campaign rather than a single run. The method names the actual formulation, which is itself informative to a reader who knows the field: lossless convexification is a real, specific technique, not a generic phrase. The result closes the loop with two numbers that matter to an actual descent-guidance reader: an accuracy figure and a propellant margin, because a landing solution that ignores fuel cost is not a complete answer to the problem.
:::

::: example Rewrite four: batch least-squares orbit determination
Before: "Worked on orbit determination using GPS data."

After: "Fitted a batch weighted least-squares orbit-determination solution to two weeks of real GNSS pseudorange data from a public CubeSat downlink; iterated the normal equations to convergence and reported a post-fit residual RMS of 4.2 meters against an independently propagated reference ephemeris."

Notice what changed the problem from vague to specific: not the topic — orbit determination was already named in the weak version — but the source of the data. Real GNSS pseudorange data, not a synthetic feed generated by the same code being tested, is a materially harder and more convincing problem, because it forces the fit to contend with real measurement noise and real geometry rather than noise the candidate chose herself. The result — a residual RMS checked against an independent reference — answers the question a skeptical reader asks immediately: how do you know the fit converged to the right answer rather than merely converging.
:::

## Numbers that count as measured, and the test for using them

Every number in the four rewrites above is specific: a tolerance, a convergence order, a confidence level, a percentile, a residual. Specificity is not decoration — it is what makes a claim checkable rather than merely assertive. But specificity cuts both ways, and it is worth being explicit about the discipline this requires: only put a number on the page that you can explain, in one or two sentences, if someone asks how you got it. That is the entire test. Not whether the number sounds impressive — whether you can defend it live, in a conversation, without notes.

This is why the strongest results in the examples above are also, quietly, statements of verification: "compared against the closed-form torque-free solution," "verified consistency with NEES and NIS statistics," "checked against an independently propagated reference ephemeris." A number with no stated basis invites exactly one follow-up question — how do you know — and a candidate who cannot answer it immediately loses more credibility than a modest, well-explained result would ever have cost her. A true result you can explain fully beats an impressive-sounding one you would have to improvise an answer for.

One more discipline follows directly from this: do not adopt a number from this lesson, or from any other resume you have seen, for a project where you did not actually measure that specific thing. The value of every figure above comes entirely from the fact that it was actually computed against something real. A borrowed number is not evidence — it is a claim exactly as unfalsifiable as "worked on simulation and analysis," dressed up to look otherwise.

::: warning An indefensible number costs more than an honest, modest one
A bullet claiming 1e-9 agreement with an analytic solution invites the question "how do you know." If your honest answer is that you never actually ran that comparison, do not write the number. A smaller, true result you can explain in one sentence outperforms an impressive one you would have to bluff through.
:::

## Check yourself

::: check
"Responsible for simulation and analysis tasks on a team project." Using the three-part formula, name what is missing and explain why each missing piece matters to a reader trying to evaluate this candidate.
:::

::: answer
All three parts are missing. There is no stated problem — "simulation and analysis" is a topic, not a technical question that needed answering. There is no method — no specific tool, technique, or approach is named. There is no result — no number, tolerance, or outcome appears anywhere. A reader is left with a relationship to work ("responsible for") rather than a description of it, and has nothing to weigh this claim against another candidate's equivalent sentence, or to ask a follow-up question about.
:::

::: check
Why is "built" a stronger verb choice than "worked on," even when both are describing the exact same three months of real effort by the same person?
:::

::: answer
"Worked on" describes a relationship to the task — presence, assignment, involvement — without committing to what was actually done. "Built" commits to a specific claim: that this person is the one who created the thing being described. That commitment is what makes the sentence checkable; a reader can ask "how did you build it" and expect a real answer, whereas "worked on" gives no clear claim to interrogate in the first place, regardless of how much real work actually happened.
:::

::: check
A candidate has a genuine result — her simulation agrees with an analytic solution to 1e-9 — but realizes, while preparing for interviews, that she cannot clearly explain how that comparison was actually run. What should she do before submitting her resume, and why?
:::

::: answer
She should either go back and re-establish exactly how the comparison was performed so she can explain it in one or two sentences, or remove the specific figure until she can. Writing a number she cannot defend live is worse than writing a more modest, fully explainable one, because the first follow-up question a careful reader or interviewer asks about a precise result is how it was obtained — and failing to answer that costs more credibility than a smaller, well-understood result would have cost in the first place.
:::

::: check
State the "defensibility test" for a resume bullet in your own words, and explain why an impressive but indefensible number is a worse choice than a modest, true one.
:::

::: answer
The defensibility test: only include a number you can explain, in one or two sentences and without notes, if someone asks how you obtained it. An impressive but indefensible number is worse than a modest true one because the impressiveness invites exactly the scrutiny the candidate cannot survive — a reader or interviewer will ask how, and an inability to answer reveals that the number was not really earned, which damages trust in every other claim on the page, not just that one bullet.
:::

::: check
Take the bullet "Implemented a Kalman filter for state estimation." Using the three-part formula, describe what kind of result would complete it — not a specific invented number, but the kind of measured outcome that would make this a strong bullet.
:::

::: answer
It needs a result that tests whether the filter's estimate, and specifically its reported uncertainty, can be trusted — for example, a consistency check such as NEES or NIS statistics compared against their expected statistical bounds over a Monte Carlo of trials, or an estimation error compared against a known truth trajectory. The result should state what was checked, over how many trials or against what reference, and whether the outcome fell inside or outside the expected bound — not simply that the filter "performed well."
:::

::: check
Explain why a strong result often ends up describing how the work was verified, rather than being a separate statement written after the verification is done.
:::

::: answer
A result is only checkable if a reader can see what it was measured against. Stating that a simulation matches a known analytic solution to a stated tolerance, or that a filter's consistency was tested against a chi-squared bound, is simultaneously the result and the explanation of how it was obtained — the two cannot be cleanly separated, because the credibility of the number comes entirely from what it was compared against. A result stripped of that context stops being checkable and becomes an assertion again, which is exactly what this lesson's formula is built to avoid.
:::

## Summary

| Part | Answers | Weak signal | Strong signal |
| --- | --- | --- | --- |
| Problem | What actually needed solving | A topic label ("simulation work") | A specific technical question ("does the model match known physics") |
| Method | What specific approach was used | A vague or passive phrase ("worked on," "helped with") | A named technique ("RK4 integrator," "multiplicative quaternion EKF") |
| Result | How you know it worked | No number, or a number with no stated basis | A measured figure with units and what it was checked against |

The next lesson takes this same formula and applies it at the level of a whole section: where the Projects section sits on the page, what to call self-directed work honestly, and how to order several anchor projects so the strongest evidence leads.
