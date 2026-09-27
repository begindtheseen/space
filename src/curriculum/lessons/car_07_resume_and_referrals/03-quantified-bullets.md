---
id: l03-quantified-bullets
title: "Bullets that name an action, a method, and a result"
minutes: 25
covers:
  - "quantified bullets: what you did, how, and the measured result"
---

Imagine two science-fair posters. One says "I did an experiment about plants." The other says "I grew 20 bean plants under red, blue and white light for three weeks and measured their height every day; the blue-light plants grew 30% taller." They might describe the exact same three weeks of work. But only the second one gives a judge anything to check, compare, or ask about.

A resume is a list of claims, and a **bullet** — one line under a project or job — is the smallest piece a claim comes in. A reader cannot interview every applicant before deciding whom to interview, so she has to weigh claims against each other without meeting anyone. A claim she cannot check is a claim she cannot weigh. "Worked on simulation and analysis" and "built a verified 6-DOF simulation" could describe the same effort. Only one of them is something a reader can test.

The fix is not enthusiasm, and it is not longer sentences. It is structure. Every strong bullet in a GNC resume has three parts in a fixed order. This lesson builds that structure once, then applies it four times to real kinds of project from this course: a 6-DOF simulation, a consistency-checked filter, a powered-descent solution, and an orbit-determination fit.

## The three parts: action, method, result

A **quantified bullet** is one that ends in a number you measured. It has three parts. You can remember them as three questions: *what did you do, how, and how do you know it worked?*

### Action: what you did, and to what problem

The **action** is a specific past-tense verb, aimed at a real technical problem. Not a topic label like "simulation work", but the actual question that needed answering:

- Does this vehicle model reproduce known physics?
- Does this filter's reported uncertainty match its real error?
- Does this guidance law reach the target within its fuel budget?

Framing it this way tells a reader what was at stake. That says more than naming the general area you worked in.

### Method: how you did it

The **method** is the specific technique, not the field it belongs to. "Simulation" is a field; "a fixed-step RK4 integrator with a tabulated atmosphere model" is a method. "Estimation" is a field; "a multiplicative quaternion extended Kalman filter" is a method.

Naming the method tells a reader you made a specific engineering choice — not that you were nearby while something in a general area happened.

### Result: the number, and how you got it

The **measured result** is a number with units and, whenever possible, a statement of how it was obtained. This is the part most bullets skip. It is also the part that turns everything before it from asserted into checkable.

A result is not "the simulation worked" or "the filter performed well". It is a number a reader can weigh:

- an error, measured against a known correct answer;
- a convergence order, showing the math behaves as theory says it should;
- a percentile of a spread of outcomes;
- a **residual** — the leftover mismatch between a fitted model and real data.

Saying how you got the number — compared with what, over how many trials — is what separates a measured result from a number that only *sounds* precise.

### Why all three

Each part does different work, and a bullet missing any one is weaker than it looks.

- An action with no method is a description with nothing behind it.
- A method with no result is a tool name with no proof it was used correctly.
- A result with no action or method is a number with no context — impressive, perhaps, but cut off from anything a reader can reason about.

Together they make a complete, checkable claim: this specific thing needed doing, this specific approach was used, and here is the specific evidence it worked. The picture of a **[[bullet split into its three parts|bullet-anatomy]]** is worth keeping in your head as you write.

::: key
Bullet structure: action, method, measured result. For example: "Built a fixed-step 6-DOF simulation in C++ with an RK4 integrator, verified against analytic torque-free rotation to 1e-9, and ran 10,000-case dispersion campaigns" — not "responsible for simulation work."
:::

::: key
A strong bullet states an action aimed at a real technical problem, a method (the specific technique, not the general field), and a measured result with units and, where possible, how it was obtained. Each part alone is weak; together they make a claim a reader can check.
:::

## The phrases that erase the method

A short list of phrases shows up again and again in weak resumes:

- "responsible for"
- "worked on"
- "helped with"
- "involved in"
- "assisted with"
- "familiar with"

They all fail the same way. Each describes your *relationship* to the work — you were assigned it, present for it, or near it — without describing the work itself. They read as duty, not accomplishment.

Try asking a follow-up question about "responsible for simulation tasks". You cannot. The sentence has already refused to say what the tasks were, or what you did among them.

The fix is a specific past-tense **action verb** naming something you actually did: *built, designed, implemented, verified, tuned, diagnosed, derived, fitted, corrected*. These verbs commit to a claim. Committing to a claim is exactly what makes a sentence checkable — which is the whole point.

::: key
Replace "responsible for", "worked on", "helped with" and similar phrases with a specific action verb — built, implemented, verified, tuned, diagnosed. A vague phrase describes a relationship to the work; an action verb describes the work.
:::

## Four rewrites

Each rewrite below starts with a weak bullet and rebuilds it with the three parts. After each one, read the explanation to see which part does what.

::: example Rewrite one: a 6-DOF launch-vehicle simulation
**Before:** "Worked on a 6-DOF vehicle simulation for a class project."

**After:** "Built a fixed-step 6-DOF launch-vehicle simulation in C++ with an [[RK4 integrator|rk4]] and a tabulated atmosphere model; verified the rotational dynamics against the closed-form [[torque-free solution|torque-free]] to within [[1e-9|sci-notation]] and confirmed fourth-order convergence under step-size refinement; ran a 10,000-case Monte Carlo dispersion campaign and reported [[3-sigma|three-sigma]] apogee altitude and impact-point spread."

**Action:** "Built", aimed at a problem that is implied but easy to find — making a vehicle simulation trustworthy enough to run dispersion analysis on.

**Method:** explicit and specific. Fixed-step RK4. A tabulated atmosphere (a lookup table of air density by altitude) rather than a rough exponential formula. A named language.

**Result:** numbers a reader can weigh directly.

1. Agreement with a known exact answer, to a stated tolerance ($10^{-9}$).
2. A convergence order — fourth — which confirms the integrator is coded correctly.
3. A dispersion campaign — the same flight rerun 10,000 times with small random changes — whose output is a spread of apogee (highest point) and impact point, not a single run. That spread is what a launch-vehicle team actually needs from a simulation.

**Sanity check:** "fourth-order convergence" makes a testable prediction. Halve the time step and the error should shrink by about $2^4 = 16$ times. An interviewer can ask whether you saw that, and you can say yes.
:::

::: example Rewrite two: a quaternion EKF with a consistency check
**Before:** "Developed a Kalman filter for spacecraft attitude estimation."

**After:** "Implemented a multiplicative [[quaternion extended Kalman filter|quaternion-ekf]] fusing simulated IMU and star-tracker measurements; ran a 200-case Monte Carlo against known truth trajectories and verified filter consistency with [[NEES and NIS statistics|nees-nis]] inside their chi-squared bounds at the 95% level, after diagnosing and correcting an initially overconfident covariance traced to an under-tuned gyro-bias process-noise term."

**Action:** sharper than "estimate attitude" (which way the spacecraft points). The problem is "prove the filter's reported uncertainty can be trusted". That is a harder, more senior question than getting a filter to run at all.

**Method:** names the specific filter formulation, instead of the generic "a Kalman filter".

**Result:** does two things a weak bullet never does.

1. It reports a defined statistical test against a defined bound.
2. It names a real problem that was found and fixed along the way. The filter's **covariance** — its own measure of how unsure it is — was **overconfident**: it claimed to be more certain than it was. The cause was traced to one tuning term. Finding and fixing that is stronger evidence of understanding than a filter that happened to work first time.

**Sanity check:** a 95% bound is drawn so that about 5% of checks fall outside it even when the filter is healthy. So "inside the bounds" means roughly 95% of the checks land inside, not 100% — which a candidate who ran the test can explain.
:::

::: example Rewrite three: powered-descent guidance with a landing Monte Carlo
**Before:** "Implemented a powered descent guidance algorithm."

**After:** "Implemented convex powered-descent guidance via [[lossless convexification|lossless-convex]], posed as a second-order cone program and solved in Python; ran a 5,000-case Monte Carlo over dispersed initial position, velocity and mass, and reported a 99th-percentile landing-position error under 12 meters with a propellant margin retained above the fuel-optimal solution."

**Powered descent** is the final rocket-braked drop to a landing.

**Action:** landing accurately under real uncertainty in where the vehicle starts — not landing once in a single perfect case. That problem only becomes visible because the result reports a percentile over many runs rather than one run.

**Method:** names the actual formulation. To a reader who knows the field, lossless convexification is a real, specific technique, not a generic phrase.

**Result:** two numbers that matter to someone who works on landing guidance.

1. An accuracy figure: the **99th percentile**, meaning 99% of the runs landed closer than this.
2. A **propellant margin** — fuel still in reserve. A landing solution that ignores fuel cost is not a complete answer.

**Sanity check:** 1% of 5,000 runs is $0.01 \times 5000 = 50$ runs. So the claim is that at most about 50 of the 5,000 simulated landings missed by 12 meters or more. That is a specific, checkable statement.
:::

::: example Rewrite four: batch least-squares orbit determination
**Before:** "Worked on orbit determination using GPS data."

**After:** "Fitted a batch weighted least-squares orbit-determination solution to two weeks of real [[GNSS pseudorange|gnss]] data from a public CubeSat downlink; iterated the normal equations to convergence and reported a post-fit [[residual RMS|residual-rms]] of 4.2 meters against an independently propagated reference ephemeris."

**Orbit determination** means working out a satellite's orbit from measurements. A **CubeSat** is a small, standard-sized satellite built from 10 cm cubes. An **ephemeris** (said "ih-FEM-er-iss") is a table of where a body is at each moment.

**Action:** notice what made the problem specific. It was not the topic — "orbit determination" was already in the weak version. It was the *source of the data*. Real measurements, not a fake feed generated by the same code being tested, force the fit to deal with real noise and real geometry, instead of noise the candidate chose herself. That makes it a harder and more convincing problem.

**Method:** batch weighted least squares, iterated until it stops changing.

**Result:** a residual RMS checked against an independent reference. That answers the first question a skeptical reader asks: how do you know the fit converged to the *right* answer, and not merely that it stopped moving?

**Sanity check:** 4.2 meters is small next to the roughly 6,800 km distance from Earth's center to a low orbit — under one part in a million ($4.2 / 6.8\times10^{6} \approx 6\times10^{-7}$) — yet large enough to be believable for a fit to real, noisy data.
:::

## Numbers that count as measured, and the test for using them

Every number in the four rewrites is specific: a tolerance, a convergence order, a confidence level, a percentile, a residual. Specificity is not decoration. It is what makes a claim checkable instead of merely confident.

But specificity cuts both ways, and it demands a discipline. Here is the whole test:

> **The defensibility test.** Only put a number on the page if you can explain, in one or two sentences, without notes, how you got it.

Not "does it sound impressive?" but "can I defend it live, in a conversation?"

That is why the strongest results above are also, quietly, statements of how they were checked: "against the closed-form torque-free solution", "with NEES and NIS statistics", "against an independently propagated reference ephemeris". A number with no stated basis invites one follow-up question — *how do you know?* — and a candidate who cannot answer it at once loses more credibility than a modest, well-explained result would ever have cost her. A true result you can explain fully beats an impressive one you would have to make up an answer for.

One more rule follows. Do not borrow a number from this lesson, or from any resume you have seen, for a project where you did not measure that exact thing. Each figure above is worth something only because it was really computed against something real. A borrowed number is not evidence. It is exactly as uncheckable as "worked on simulation and analysis", dressed up to look otherwise.

::: warning An indefensible number costs more than an honest, modest one
A bullet claiming $10^{-9}$ agreement with an analytic solution invites "how do you know?" If your honest answer is that you never ran that comparison, do not write the number. A smaller, true result you can explain in one sentence beats an impressive one you would have to bluff through.
:::

::: note Why a verified number is worth more than a bigger one
A reader is not only asking "is this number good?" She is asking "how much should I trust *everything else* on this page?" A number that holds up under one follow-up question raises her trust in every other bullet. A number that collapses lowers it — for the whole page, not only that line. So a modest claim you can defend has a positive effect everywhere, and a grand claim you cannot defend has a negative effect everywhere. That lopsided payoff is why the defensibility test wins.
:::

## Check yourself

::: check
"Responsible for simulation and analysis tasks on a team project." Using the three-part structure, say what is missing and why each missing piece matters to a reader trying to judge this candidate.
:::

::: answer
All three parts are missing.

- **Action:** there is no action verb and no stated problem. "Simulation and analysis" is a topic, not a technical question that needed answering.
- **Method:** no specific tool, technique or approach is named.
- **Result:** no number, tolerance or outcome appears.

The reader is left with a relationship to work ("responsible for") instead of a description of it. She has nothing to weigh against another candidate's version of the same sentence, and nothing to ask a follow-up question about.
:::

::: check
Why is "built" a stronger verb than "worked on", even when both describe the exact same three months of real effort by the same person?
:::

::: answer
"Worked on" describes a relationship to the task — being present, assigned, involved — without committing to what was done. "Built" commits to a specific claim: this person created the thing described.

That commitment is what makes the sentence checkable. A reader can ask "how did you build it?" and expect a real answer. "Worked on" gives her no clear claim to ask about at all, no matter how much real work happened.
:::

::: check
A candidate has a real result — her simulation agrees with an analytic solution to $10^{-9}$ — but while preparing for interviews she realizes she cannot explain how the comparison was run. What should she do before sending her resume, and why?
:::

::: answer
Either go back and re-establish exactly how the comparison was done, so she can explain it in one or two sentences, or remove the figure until she can.

The first follow-up question a careful reader or interviewer asks about a precise result is how it was obtained. A number she cannot defend live costs more credibility than a smaller, fully explained one would have.
:::

::: check
State the defensibility test in your own words, and explain why an impressive but indefensible number is worse than a modest, true one.
:::

::: answer
The test: only include a number you can explain, in one or two sentences and without notes, if someone asks how you got it.

An impressive but indefensible number is worse because its impressiveness invites exactly the questions the candidate cannot survive. When she cannot answer "how?", it shows the number was not really earned. That damages trust in every other claim on the page, not only that one bullet.
:::

::: check
Take the bullet "Implemented a Kalman filter for state estimation." Without inventing a specific number, describe the *kind* of measured result that would complete it.
:::

::: answer
It needs a result that tests whether the filter's estimate — and especially its reported uncertainty — can be trusted. For example:

- a consistency check such as NEES or NIS statistics compared with their expected statistical bounds over a Monte Carlo of trials; or
- estimation error compared with a known truth trajectory.

The result should say what was checked, over how many trials or against what reference, and whether the outcome fell inside or outside the expected bound — not a bare claim that the filter "performed well".
:::

::: check
Why does a strong result so often end up *describing how the work was checked*, instead of being a separate sentence written after the checking?
:::

::: answer
A result is only checkable if the reader can see what it was measured against. "Matches a known analytic solution to a stated tolerance" or "consistency tested against a chi-squared bound" is the result *and* the explanation of how it was obtained at the same time. The two cannot be pulled apart, because the number's credibility comes entirely from what it was compared with.

Strip that context away and the result stops being checkable. It becomes an assertion again — exactly what the three-part structure is built to avoid.
:::

## Summary

| Part | Answers | Weak signal | Strong signal |
| --- | --- | --- | --- |
| Action | What you did, and to what problem | A duty phrase ("responsible for", "worked on", "helped with") | A specific verb aimed at a real question ("built", "verified", "diagnosed") |
| Method | How you did it | A general field ("simulation", "estimation") | A named technique ("RK4 integrator", "multiplicative quaternion EKF") |
| Result | How you know it worked | No number, or a number with no stated basis | A measured figure with units and what it was checked against |
| Defensibility test | Should this number be on the page? | "It sounds impressive" | "I can explain how I got it in two sentences, without notes" |

The next lesson takes this same structure up to the level of a whole section: where the Projects section sits on the page, how to label self-directed work honestly, and how to order several anchor projects so the strongest evidence leads.

::: context bullet-anatomy One bullet, three parts
Here is the shape of a strong bullet, cut into its parts. Read left to right: a verb and what it was aimed at, the technique, and the measured number with what it was checked against. If you cannot fill all three boxes, the bullet is not finished — usually the third box is the one that is empty.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="30" width="110" height="60" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="124" y="30" width="110" height="60" rx="6" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="242" y="30" width="112" height="60" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">
    <text x="61" y="22">Action</text><text x="179" y="22">Method</text><text x="298" y="22">Result</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="61" y="55">Built a 6-DOF</text><text x="61" y="71">simulation</text>
    <text x="179" y="55">C++, RK4</text><text x="179" y="71">integrator</text>
    <text x="298" y="55">matched exact</text><text x="298" y="71">answer to 1e-9</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="61" y="110">what you did</text><text x="179" y="110">how</text><text x="298" y="110">how you know</text>
  </g>
</svg>
```
:::

::: context rk4 A careful way to step forward in time
A simulation moves forward in small time steps. The simplest method looks at the current slope and takes one straight step. **RK4** (said "R-K-four"), the classic fourth-order **Runge–Kutta** method, samples the slope four times inside each step and blends them, which is far more accurate for the same step size. "Fourth order" has a testable meaning: halve the step and the error drops by about $2^4 = 16$ times. Seeing that happen in your own code is strong proof it is coded correctly. You build this in the numerical methods part of the course.
:::

::: context torque-free A test with a known answer
A **torque** is a twisting push. A spinning body with no outside torque on it — a tossed book tumbling in the air, or a satellite coasting in space — has motion that can be worked out exactly with pencil and paper for some shapes. That exact answer is called a **closed-form** or **analytic** solution. Engineers run their simulation on the same case and compare. If the two agree to many decimal places, the simulation's rotation math is very likely right. It is the same idea as checking a calculator against a sum you already know.
:::

::: context sci-notation Reading 1e-9
"1e-9" is how computers write $1 \times 10^{-9}$: one billionth, or 0.000000001. The "e" means "times ten to the power". So 1e-9 agreement means the simulation and the exact answer differ by about one part in a billion — like one millimeter compared with 1,000 kilometers. Numbers this small are typical when you compare a good integrator against an exact solution using the computer's double-precision arithmetic.
:::

::: context three-sigma What "3-sigma" means
When you run thousands of simulated flights, the results scatter around an average. **Sigma** ($\sigma$), the Greek letter for "s", stands for the **standard deviation** — a typical distance from the average. If the scatter follows the usual bell-shaped curve, about 68% of results land within $1\sigma$ of the average, about 95% within $2\sigma$, and about 99.7% within $3\sigma$. So a "3-sigma" spread is a range that covers nearly every case.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <polygon points="72.0,150.0 72.0,148.8 79.2,147.8 86.4,146.3 93.6,143.8 100.8,140.2 108.0,135.1 115.2,128.2 122.4,119.4 129.6,108.7 136.8,96.5 144.0,83.3 151.2,70.1 158.4,58.1 165.6,48.5 172.8,42.2 180.0,40.0 187.2,42.2 194.4,48.5 201.6,58.1 208.8,70.1 216.0,83.3 223.2,96.5 230.4,108.7 237.6,119.4 244.8,128.2 252.0,135.1 259.2,140.2 266.4,143.8 273.6,146.3 280.8,147.8 288.0,148.8 288.0,150.0" fill="#8fb8f0"/>
  <polyline points="21.6,150.0 28.8,150.0 36.0,150.0 43.2,149.9 50.4,149.8 57.6,149.7 64.8,149.3 72.0,148.8 79.2,147.8 86.4,146.3 93.6,143.8 100.8,140.2 108.0,135.1 115.2,128.2 122.4,119.4 129.6,108.7 136.8,96.5 144.0,83.3 151.2,70.1 158.4,58.1 165.6,48.5 172.8,42.2 180.0,40.0 187.2,42.2 194.4,48.5 201.6,58.1 208.8,70.1 216.0,83.3 223.2,96.5 230.4,108.7 237.6,119.4 244.8,128.2 252.0,135.1 259.2,140.2 266.4,143.8 273.6,146.3 280.8,147.8 288.0,148.8 295.2,149.3 302.4,149.7 309.6,149.8 316.8,149.9 324.0,150.0 331.2,150.0 338.4,150.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="18" y1="150" x2="342" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="72" y1="150" x2="72" y2="156"/><line x1="108" y1="150" x2="108" y2="156"/><line x1="144" y1="150" x2="144" y2="156"/>
    <line x1="180" y1="150" x2="180" y2="156"/><line x1="216" y1="150" x2="216" y2="156"/><line x1="252" y1="150" x2="252" y2="156"/><line x1="288" y1="150" x2="288" y2="156"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="72" y="170">−3σ</text><text x="108" y="170">−2σ</text><text x="144" y="170">−1σ</text><text x="180" y="170">avg</text>
    <text x="216" y="170">+1σ</text><text x="252" y="170">+2σ</text><text x="288" y="170">+3σ</text>
  </g>
  <text x="180" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">shaded: within 3σ, about 99.7% of cases</text>
</svg>
```
:::

::: context quaternion-ekf Four numbers for which way you point
A **quaternion** (said "kwa-TER-nee-un") is a set of four numbers that describes an orientation — which way a spacecraft is pointing — without the glitches that three angles can hit at certain attitudes. A **Kalman filter** blends a prediction of where you should be with noisy measurements, weighting each by how much it can be trusted. The **extended** version (EKF) handles curved, nonlinear physics. "Multiplicative" means the small error is kept as its own tiny rotation, which keeps the quaternion valid. The estimation track of this course builds one.
:::

::: context nees-nis Is the filter honest about its doubt?
A Kalman filter reports two things: its estimate, and how unsure it is — its **covariance**. **NEES** (normalized estimation error squared) checks the real error against that claimed uncertainty, which you can only do in simulation where the truth is known. **NIS** (normalized innovation squared) checks each measurement surprise against what the filter expected, which works on real data too. If the filter is honest, both follow a known **chi-squared** (said "kai-squared") distribution, which sets the bounds. Numbers too high mean an overconfident filter.
:::

::: context lossless-convex Turning a hard landing problem into an easy one
Finding the least-fuel path to a pinpoint landing is hard, because some of its limits make the problem **nonconvex** — it can have many false "best" answers. **Convex** problems have one best answer that a computer can find reliably and fast. **Lossless convexification**, developed in research on Mars pinpoint landing in the mid-2000s, rewrites the landing problem in convex form and proves that the answer to the easier problem is still a correct answer to the original. A **second-order cone program** (SOCP, said "sock-P") is the kind of convex problem it produces.
:::

::: context gnss Satellite navigation, and why "pseudo"
**GNSS** (said "G-N-S-S"), the global navigation satellite systems, is the family name for GPS and its cousins: Europe's Galileo, Russia's GLONASS and China's BeiDou. A receiver times how long each satellite's signal took to arrive and turns that into a distance. It is called a **pseudorange** — "pseudo" meaning "false" — because the receiver's own clock is slightly off, so every distance carries the same unknown error. The fit has to solve for that clock error alongside the position.
:::

::: context residual-rms Measuring what is left over
After fitting an orbit, compare each real measurement with what the fitted orbit predicts. The gap for each one is a **residual**. **RMS** (said "R-M-S", root mean square) is one number for their typical size: square each residual, average the squares, take the square root. Residuals scattered evenly around zero, with a small RMS, suggest a good fit. A pattern in them — a drift or a wave — means the model is missing something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="36" y="51" width="300" height="58" fill="#8fb8f0" opacity="0.5"/>
  <line x1="36" y1="80" x2="336" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="56" r="3.5"/><circle cx="68" cy="120" r="3.5"/><circle cx="86" cy="72" r="3.5"/><circle cx="104" cy="32" r="3.5"/><circle cx="122" cy="96" r="3.5"/><circle cx="140" cy="112" r="3.5"/><circle cx="158" cy="48" r="3.5"/><circle cx="176" cy="88" r="3.5"/><circle cx="194" cy="64" r="3.5"/><circle cx="212" cy="128" r="3.5"/><circle cx="230" cy="40" r="3.5"/><circle cx="248" cy="104" r="3.5"/><circle cx="266" cy="80" r="3.5"/><circle cx="284" cy="56" r="3.5"/><circle cx="302" cy="112" r="3.5"/><circle cx="320" cy="64" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="30" y="84" text-anchor="end">0</text>
    <text x="336" y="146" text-anchor="end">16 residuals, no pattern</text>
    <text x="40" y="146">shaded: ±1 RMS (3.6 m)</text>
  </g>
</svg>
```
:::
