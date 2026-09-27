---
id: l05-resume-depth
title: "Three questions deep on every line"
minutes: 24
covers:
  - resume depth: expect to be asked to go deeper on any line you wrote
---

Picture a science fair. A judge walks up to your poster, points at a random line in the corner — "you measured the water temperature here; how?" — then asks why you did it that way, then what you would do differently. If you did the experiment, those questions are easy. If the line was copied from a website, the second one is where it falls apart.

A technical phone screen treats your resume the same way: anything you wrote is fair game, and you should expect to be taken at least three questions deep on any line the interviewer picks. Not the line you hoped for. Any line.

So your resume is a list of **commitments** — promises to defend each claim out loud, without notes, to an engineer who has done the same work. A line you cannot defend is a trap you set for yourself, and as this module's exercise warns, an interviewer will pick exactly that line: with limited time, the line worth testing is the one that claims the most.

## The three questions

They are always roughly these, in this order.

**What did you do?** Scope and content: what the thing was, what you personally did on it, and what came out.

**Why that way?** The decision: what the alternative was, and why you did not take it.

**What would you change?** The judgment: knowing what you know now, what was wrong with it.

Think of them as a **[[ladder going down|depth-ladder]]**, each step harder than the last. The first can be answered from a good project description. The second needs a decision you actually made, not a default you followed. The third needs someone who lived with the results long enough to collect a specific regret — which is why it separates people who did the work from people who described it.

::: key
Expect any line you wrote to be taken three questions deep: what you did, why you did it that way, and what you would change. Anything you cannot survive three questions on should be rewritten or removed, because the interviewer will pick exactly that line.
:::

## What a good answer sounds like at each depth

### Depth one: what did you do

Start at the technical content, not the project's history. The interviewer knows what a **[[CubeSat|cubesat]]** is and does not need the funding story.

Three things belong in the first thirty seconds:

1. what the technical object was;
2. what *you* personally did to it;
3. one specific fact that only someone who did the work would know — a number, a threshold, a failure, a limit.

The third item is what makes the answer land; the rest could be copied from a job description.

### Depth two: why that way

A good answer names the **alternative** (the other option) and the **criterion** (the test that decided). "I used a multiplicative formulation rather than an additive one, because the quaternion's norm constraint makes the four-by-four covariance singular" is a decision. "I used an extended Kalman filter" is only a description.

Sometimes you did not choose. Then **say so.** Much real engineering happens inside decisions made before you arrived, and claiming an inherited one fails the third question — you cannot have a thought-through view of a choice you never made. Say: *that was already the approach when I joined, and here is what I would have compared it against if it had been open.* That is honest about scope and still shows the judgment being tested.

### Depth three: what would you change

This answer must be **specific and technical**. The typical weak answer is about process — better documentation, more testing in general. That answers a **[[behavioral question|behavioral-question]]** nobody asked, and signals that no real regret exists.

A strong answer names one thing, what went wrong because of it, and what you would do instead. It can be small:

> "I tuned the process noise by hand until the filter looked right, and I never checked the innovations for whiteness, so I have no idea whether it was actually consistent or only visually smooth — I would characterize the gyro with an Allan variance and set the process noise from that."

Every part of it can be checked, which beats a grander answer.

::: warning "I would document it better" is not an answer to the third question
Documentation matters, but the sentence is true of every project ever built, so it says nothing about yours. If nothing technical comes to mind for a line, that usually means you did not own its decisions — so rewrite the line to describe what you did own.
:::

## The ownership problem

A school group poster says "we built a volcano", and the teacher asks you, "and what was your part?" That is the **ownership probe**, and interviewers use it often.

There are two ways to fail it:

- Saying "we" the whole time hides the boundary, so the interviewer assumes the smaller version of your part.
- Saying "I" about team work is worse: a false claim that collapses at the first follow-up into a part you did not touch.

What works is explicit and takes one sentence: **name the team's scope, then name yours.**

> "The team built the whole attitude determination and control subsystem. My piece was the estimator — the measurement models, the tuning, and the consistency testing. I did not work on the actuator drivers."

Candidates leave out the last clause, yet it buys the most trust: someone exaggerating would never volunteer where their work stopped. It also turns a follow-up about actuator drivers into a friendly conversation, not an exposure.

::: key
State the team's scope and then your own, and volunteer where your contribution ended. An interviewer who cannot locate your personal contribution will assume the smaller version of it, and a claim that overreaches collapses at the first follow-up.
:::

## Running the drill on yourself

This module's exercise is blunt: hand your resume to someone technical, have them pick any line, and go three questions deep. Every line — because the lines you would have picked to rehearse are not the ones at risk.

**The questioner does not need your specialty.** Any engineer can ask "why that way?" and hear whether the answer holds a real decision.

**Record it.** You will remember which answers *felt* shaky, not which ones were — different lists.

**Grade each line against three boxes**, not a feeling:

1. Did the first answer contain a specific fact only a participant could give?
2. Did the second name an alternative and a criterion?
3. Did the third name a technical regret?

A line that fails any box is not ready. It has three possible fates, and only one is "prepare harder":

- **Rewrite it** to describe what you did. An overstated line usually has a true, narrower version underneath that is still worth having.
- **Remove it.** A line that only carries a **[[keyword|keyword-lines]]** is worth less than the airtime it costs when picked — and it does get picked.
- **Go and close the gap**, if you truly want to make the claim. Expensive, and sometimes right.

::: note Lines that attract the probe
Two kinds of line are likely targets — not measured, but reasoned from what each offers an interviewer short on time. The first names a heavy technique — an unscented filter, model predictive control, convex guidance — because naming one is a claim about depth, and it is cheap to test. The second carries an impressive number: a percentage improvement, a margin, a run time. Both are worth having *if they are true and you own them*, and expensive if they are decoration. Know which of your lines fall in these groups, and rehearse those first.
:::

## Three lines, questioned

::: example "Implemented an extended Kalman filter for attitude determination on a CubeSat simulator"
(An **extended Kalman filter**, or EKF, blends predictions with noisy sensor readings — here to estimate the spacecraft's **attitude**, which way it points.)

**Q1 — Tell me about the filter. What did you build?**

*Weak:* "So this was a university CubeSat project. We had a team of about six and I was on the software side. I implemented an EKF for attitude determination, using the gyro, magnetometer and a sun sensor. It worked pretty well — we got good results in simulation."

*Strong:* "Attitude and gyro bias, so a six-state filter: three-parameter attitude error plus three bias states, with the quaternion carried as a reference and reset after each update. Measurements were magnetometer and coarse sun sensor, both as unit vectors compared against a reference model. My part was the estimator specifically — the measurement models, the tuning and the consistency testing. I did not write the sensor drivers."

**Q2 — Why a multiplicative formulation rather than estimating the quaternion directly?**

*Weak:* "That is the standard approach for attitude filters — it is what the references I was working from used."

*Strong:* "Because the quaternion is four numbers with a unit-norm constraint, so it only has three degrees of freedom. If you put all four in the state, the covariance is singular in the direction of the constraint, and the filter either fights the normalization or drifts off the unit sphere. The [[multiplicative form|multiplicative-ekf]] estimates a small three-parameter error about the current reference and folds it back in after each update, so the covariance is three-by-three and non-singular, and the reference stays a unit quaternion by construction."

**Q3 — What would you change?**

*Weak:* "I would probably structure the code better and write more tests. And document the tuning process — it was pretty ad hoc."

*Strong:* "The tuning. I set the process noise by hand until the estimate looked smooth, which is not a criterion — I never checked whether the filter was actually consistent. Two things I would do now: characterize the gyro with an [[Allan variance|allan-variance]] and set the process noise from the measured angle random walk and bias instability rather than by eye, and then check the normalized [[innovations|innovations]] against their expected distribution and test them for whiteness. A filter can look beautiful and be overconfident, and I had no way of telling the difference."

**What makes the difference.** The weak answers are not wrong — they are empty. The first has no fact that sets this filter apart from any other. The second cites authority instead of a reason, and fails if asked *why is it standard?* The third is about process. Each strong answer holds something only a participant could say — the state size and reset, the singular-covariance argument, the missing consistency check — and the third names a real regret with a concrete fix.

**Sanity check on the state count:** three attitude-error states plus three bias states is $3 + 3 = 6$, matching "a six-state filter".
:::

::: example "Built a six-degree-of-freedom simulation in Python"
(**Six degrees of freedom** means the simulated vehicle can move three ways — forward, sideways, up — and turn three ways — pitch, yaw, roll.)

**Q1 — What is in it?**

*Strong:* "Rigid-body translational and rotational dynamics, quaternion attitude, a standard atmosphere, aerodynamic forces and moments from a coefficient table, thrust with a gimbaled engine model, and the control law running at its own fixed rate. I wrote all of it; the aero coefficients came from a published dataset."

**Q2 — What integrator, and why?**

*Weak:* "I used an ODE solver from SciPy. It handled it fine."

*Strong:* "Fixed-step Runge–Kutta four, at a step that divides evenly into the controller rate. I did start with a [[variable-step solver|variable-step]], and it was more accurate per unit of work, but it was the wrong tool here for two reasons. First, the controller is a discrete system running at a fixed rate, so the simulation has to land exactly on those sample instants; a variable-step solver keeps stepping past them and you end up interpolating the very thing you are trying to evaluate. Second, I wanted bit-identical repeatability across Monte Carlo runs, and adaptive step-size control makes the trajectory depend on solver internals. Fixed-step RK4 is fourth-order accurate globally, which was far more than I needed at the step size the controller forced on me anyway."

**Q3 — What would you change?**

*Strong:* "Event handling. I detect staging and ground contact by checking a condition at the end of each step, which means the event is located to within one step and the state at the event is wrong by that much. For ground contact at the step sizes I was using, that is a real error in touchdown velocity. I would add proper event detection — [[bracket the sign change and solve for the crossing time|event-bracketing]] — and, separately, validate the whole propagator against an [[analytic two-body case|two-body-check]] with the aero and thrust switched off, which I never did. I checked the sim against intuition, not against a closed-form answer."

**What makes the difference.** The weak second answer names a tool, not a decision, and has no defense against the obvious follow-up: why is variable-step a poor fit here? The strong one names the rejected alternative, gives two reasons rooted in the problem's structure, and ends with a sanity check on the accuracy needed. The third names one defect, its cost, the fix, and a testing gap the candidate found on their own. Volunteering a weakness you have already diagnosed is one of the strongest moves in this round.
:::

::: example The ownership probe
**Interviewer:** You say here you developed the guidance algorithm for the landing phase. Walk me through your part in that.

*Weak:* "Yes, so we developed a guidance algorithm for the powered descent phase. We used a convex formulation, and we validated it in simulation across a range of dispersions. It performed well — we were able to hit the target consistently."

*Strong:* "I should be precise about the boundary. The formulation was already chosen when I joined — a colleague had done the convexification work and the problem setup. What I owned was the solver interface and the real-time side: I profiled the solve, found that the worst-case iteration count was the thing that would break the timing budget rather than the average, and changed the [[warm-start|warm-start]] so that each solve started from the previous solution. I also built the dispersion campaign that we used to establish the worst case. I did not do the convexification, and I would not want to claim it."

**What makes the difference.** Count the words: the weak answer says "we" four times in three sentences and "I" not once. The candidate's part is invisible, while the resume line, *developed the guidance algorithm*, claims all of it. Asked why lossless convexification works, the candidate would be answering for someone else's decision.

The strong answer gives up the biggest-sounding piece and gains everything. It names a boundary unasked, and describes a smaller but far more specific contribution — worst-case rather than average iteration count is a detail only someone who was there would give. Every claim in it can survive three more questions.
:::

## Check yourself

::: check
Why is "what would you change?" the question that separates candidates who did the work from candidates who described it?
:::

::: answer
Because a specific technical regret only comes from living with a decision's results. The first can be answered from a project summary, the second sometimes from a textbook. The third needs you to have seen what the choice cost — a defect, a limit, a skipped check. Someone who only described the work has nothing specific, so they fall back on process: better documentation, more tests, better planning.
:::

::: check
A candidate is asked why they used a particular estimator design, and the honest answer is that it was already in place when they joined. What should they say, and why is this not a weak answer?
:::

::: answer
Exactly that, plus what they would have compared it against: *that was already the approach when I arrived; if it had been mine, I would have weighed it against this alternative, on this criterion.*

It is not weak: the question tests judgment, not credit, and this shows the judgment while being accurate about scope. Claiming the decision is the weak option — it fails the third question and collapses under one more follow-up.
:::

::: check
Give the three boxes you grade each resume line against after the drill, and say what to do with a line that fails one.
:::

::: answer
One: did "what did you do" produce a fact only a participant could give? Two: did "why that way" name a real alternative and the criterion for rejecting it? Three: did "what would you change" name a technical regret, not a process one?

A line that fails any box can be rewritten to describe what you actually did and owned, removed if it only carries a keyword, or kept while you go and close the gap. Only the last is "prepare harder", and it is the least common right answer.
:::

::: check
Explain why saying what you did *not* work on makes an answer stronger, not weaker.
:::

::: answer
It is evidence of accuracy — someone inflating their part would not shrink it unprompted — so everything else becomes more believable. And it protects you: a follow-up into territory you did not own becomes ordinary conversation. Leave the boundary unstated and the interviewer either probes for it, which is worse, or assumes the smaller version of your contribution.
:::

::: check
Which two kinds of resume line are likely probe targets, and what follows for how you prepare?
:::

::: answer
Lines naming a heavy technique — an unscented filter, model predictive control, convex guidance — because that claims depth and is cheap to test. And lines with an impressive number, such as a percentage or a margin, because a number invites "how was it measured?"

So identify these lines before the call and rehearse them first, and take off any that are decoration rather than owned. A claim you cannot defend is worth less than the airtime it costs when tested.
:::

::: check
An interviewer picks a line about a project from three years ago that you now barely remember. You prepared thoroughly on everything recent. What went wrong, and what is the general lesson?
:::

::: answer
The preparation covered the lines the candidate would have chosen — but the interviewer chooses. Age is no defense: the line is on the page, so it is a commitment, and an interviewer may pick the older project because it looks unusual.

That is why the exercise says *every* line. If a line is too old to defend three deep, refresh it or take it off — before the call, not during it.
:::

## Summary

| Depth | Question | A strong answer contains | The weak default |
| --- | --- | --- | --- |
| One | What did you do? | A specific fact only a participant could give | A project description with a team in it |
| Two | Why that way? | The alternative and the criterion | "It is the standard approach" |
| Three | What would you change? | One technical regret and its fix | "Better documentation and more tests" |
| Ownership | What was your part? | Team's scope, then yours, then where yours ended | "We" throughout, or "I" over-claimed |

The next lesson takes the other half of the screen — the fundamentals — and deals with the limit that defines it: producing a derivation out loud, with no surface to write on, in under five minutes.

::: context depth-ladder Each step down is harder to fake
The three questions go down like stairs. Anyone can stand on the top step with a good project description. The second step needs a real decision you made. The bottom step needs a regret you earned by living with that decision. An interviewer who reaches the bottom step with you has learned whether you did the work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="14" width="340" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="50" y="62" width="300" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="110" width="260" height="40" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="31" font-size="12" font-weight="700" fill="#1f2a44">1. What did you do?</text>
  <text x="20" y="47" font-size="11" fill="#1f2a44">a fact only a participant knows</text>
  <text x="60" y="79" font-size="12" font-weight="700" fill="#1f2a44">2. Why that way?</text>
  <text x="60" y="95" font-size="11" fill="#1f2a44">the alternative and the criterion</text>
  <text x="100" y="127" font-size="12" font-weight="700" fill="#ffffff">3. What would you change?</text>
  <text x="100" y="143" font-size="11" fill="#ffffff">one technical regret and its fix</text>
  <text x="340" y="166" font-size="11" fill="#6c7a93" text-anchor="end">deeper = harder to fake</text>
</svg>
```
:::

::: context cubesat A satellite the size of a loaf of bread
A **CubeSat** is a small satellite built from standard cubes 10 cm on a side, each called one "unit" or 1U. A 3U CubeSat is three cubes stacked, about the size of a loaf of bread. The standard came out of university work around the year 2000, and because the parts and launch slots are cheap, many students' first real space project is a CubeSat — which is why interviewers see so many on resumes, and why they probe them.
:::

::: context behavioral-question Two kinds of interview question
A **behavioral question** asks how you acted in a past situation: "tell me about a time you missed a deadline." A technical question asks about the engineering itself. "I would document it better" is a fine answer to a behavioral question about teamwork. But "what would you change?" asked about a filter design is a technical question, so it wants a technical answer. Mixing the two up tells the interviewer you had no engineering regret to offer. A later module in this track is all about behavioral questions.
:::

::: context keyword-lines Lines written for a robot
Many companies first run resumes through an **applicant tracking system** — software that sorts applications partly by matching words from the job posting. That tempts people to add lines whose only job is to contain a word like "MPC" or "Kalman". The software may be pleased. But a human engineer reads the same page on the phone screen, and a keyword with no real work behind it is exactly the line they will ask about.
:::

::: context multiplicative-ekf Why four numbers cause trouble
A **quaternion** describes which way something points using four numbers whose squares must add up to 1 — the **unit-norm constraint**. Pointing has only three real freedoms, so one of the four numbers is not free. A filter that treats all four as free gets confused along that fourth direction: its **covariance** (its table of how unsure it is) becomes **singular**, meaning it claims zero uncertainty in a direction that should not exist at all. The multiplicative filter tracks a tiny three-number error instead, and folds it into the quaternion after each update.
:::

::: context allan-variance Measuring how a gyro wanders
A gyro measures turning rate, but its reading jitters and slowly drifts. The **Allan variance** is a test for sorting that error into types: record the gyro sitting still for hours, average the data over windows of different lengths, and see how the scatter changes with window length. Short windows reveal the fast jitter, called **angle random walk**; long windows reveal the slow wander, related to **bias instability**. Those measured numbers are what a filter's process noise should be built from — not guesses.
:::

::: context innovations The filter's surprise
Each time a measurement arrives, a Kalman filter first predicts what it expects to see. The gap between the real measurement and that prediction is the **innovation** — the filter's surprise. If the filter is honest about its own uncertainty, the surprises should be about the size it predicted, and they should look like random noise with no pattern from one step to the next. That "no pattern" property is called **whiteness**, the same way white light mixes all colors evenly. A filter whose innovations drift or wave is missing something.
:::

::: context variable-step Why the steps must land on the ticks
The controller in a simulation acts at fixed ticks, like a clock. A fixed-step solver whose step divides the tick evenly lands on every tick. A variable-step solver picks its own step sizes to save work, so its points fall between ticks — and the controller's inputs have to be guessed by interpolation. **Fourth-order accurate** means that halving the step cuts the error by about $2^4 = 16$ times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="40" y1="20" x2="40" y2="120"/><line x1="120" y1="20" x2="120" y2="120"/>
    <line x1="200" y1="20" x2="200" y2="120"/><line x1="280" y1="20" x2="280" y2="120"/>
  </g>
  <text x="340" y="16" font-size="11" fill="#b4232c" text-anchor="end">controller ticks</text>
  <line x1="30" y1="50" x2="300" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="95" x2="300" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <circle cx="40" cy="50" r="4"/><circle cx="80" cy="50" r="4"/><circle cx="120" cy="50" r="4"/><circle cx="160" cy="50" r="4"/>
    <circle cx="200" cy="50" r="4"/><circle cx="240" cy="50" r="4"/><circle cx="280" cy="50" r="4"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <circle cx="40" cy="95" r="4"/><circle cx="67" cy="95" r="4"/><circle cx="131" cy="95" r="4"/>
    <circle cx="166" cy="95" r="4"/><circle cx="187" cy="95" r="4"/><circle cx="251" cy="95" r="4"/><circle cx="297" cy="95" r="4"/>
  </g>
  <text x="305" y="54" font-size="11" fill="#1f2a44">fixed</text>
  <text x="305" y="99" font-size="11" fill="#1f2a44">variable</text>
  <text x="180" y="140" font-size="11" fill="#6c7a93" text-anchor="middle">fixed steps hit every tick; variable steps miss them</text>
</svg>
```
:::

::: context event-bracketing Finding the moment of touchdown
If a simulation only checks "am I below the ground?" at the end of each step, it notices touchdown late, with the vehicle already partway underground. Better: once the height changes sign between two steps, you know the true crossing is **bracketed** — trapped between them. Then solve for the exact crossing time inside that step and restart from there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="2"/>
  <text x="24" y="136" font-size="11" fill="#6c7a93">ground (height 0)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,60.0 45.6,58.3 51.2,56.8 56.8,55.4 62.4,54.2 68.0,53.2 73.6,52.4 79.2,51.8 84.8,51.4 90.4,51.1 96.0,51.0 101.6,51.1 107.2,51.4 112.8,51.8 118.4,52.4 124.0,53.2 129.6,54.2 135.2,55.4 140.8,56.8 146.4,58.3 152.0,60.0 157.6,61.9 163.2,64.0 168.8,66.2 174.4,68.6 180.0,71.2 185.6,74.0 191.2,77.0 196.8,80.2 202.4,83.5 208.0,87.0 213.6,90.7 219.2,94.6 224.8,98.6 230.4,102.8 236.0,107.2 241.6,111.8 247.2,116.6 252.8,121.6 258.4,126.7 264.0,132.0"/>
  <g fill="#1f2a44">
    <circle cx="40" cy="60" r="4"/><circle cx="96" cy="51" r="4"/><circle cx="152" cy="60" r="4"/><circle cx="208" cy="87" r="4"/>
  </g>
  <circle cx="264" cy="132" r="5" fill="#b4232c"/>
  <circle cx="251" cy="120" r="5" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="350" y="160" font-size="11" fill="#b4232c" text-anchor="end">noticed here, 8 m under</text>
  <text x="236" y="140" font-size="11" fill="#1d6fd1" text-anchor="end">true touchdown</text>
  <text x="130" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">dots = end of each step</text>
</svg>
```
:::

::: context two-body-check Testing against an answer you already know
With air and engine switched off, a spacecraft near a single planet follows the **two-body problem**: one planet, one spacecraft, gravity only. Its path is an exact ellipse that can be worked out with pencil and paper — an **analytic** or **closed-form** answer. Running the simulation on that case and comparing, point by point, is a strong test of the gravity and integration code. Checking "against intuition" only tells you the result looked believable.
:::

::: context warm-start Starting the search from yesterday's answer
A numerical solver finds its answer by improving a guess over many rounds, called **iterations**. If each new guidance problem is only slightly different from the last one — as it is when a lander re-plans every fraction of a second — starting from the previous answer instead of from scratch usually cuts the rounds needed. That trick is a **warm start**. On a flight computer the worst case matters most, because one slow solve can miss its deadline even if the average is fast.
:::
