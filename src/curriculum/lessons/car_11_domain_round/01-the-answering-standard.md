---
id: l01-the-answering-standard
title: "The answering standard: four moves, ninety seconds"
minutes: 22
covers:
  - "the answering standard: state assumptions, write the equation, interpret physically, sanity check"
---

Everything else in this career track has been about presentation: how to describe work, how to structure a narrative, how to say a thing so that a listener can follow it. This module is different, and the difference is worth naming before you read another page. In the domain round the answer to *why does a Kalman filter diverge when the process noise is set too small* is a fact. You either know the mechanism or you do not. No amount of composure converts a wrong mechanism into a right one, and no amount of nerves makes a right one wrong.

So the material of this module is technical, and it is assessed as technical material. What the answering standard adds is the packaging: the same correct fact, delivered in four moves, is worth considerably more than the same correct fact delivered as a shapeless recitation, because the moves are themselves evidence. An engineer who states assumptions before the algebra is an engineer who will state assumptions in a design review. An engineer who closes with a sanity check is an engineer whose analysis will get caught by its own error bars before it gets caught by a flight.

This lesson gives you the standard and the budget. The next one gives you the harder skill: what to do when the fact is not there.

## What this round is, and what this curriculum does not know about it

This module's source material names the subjects: stability margins, the Kalman filter and its nonlinear descendants, filter tuning and consistency, attitude determination, the multiplicative quaternion filter, strapdown inertial integration, PID structure and windup, orbit determination. Those are the subjects of the twelve lessons that follow, and every one of them is a place where there is a right answer.

What varies — and what this curriculum will not pretend to know for any particular employer — is the process wrapped around them. Whether the round runs on a whiteboard, a shared document, a video call with a tablet, or a conversation with no writing surface at all; how long it lasts; how many engineers are in the room; whether one person covers all of it or each interviewer takes a subject; whether the questions are drawn from a fixed list or invented from your résumé. All of that varies by company, by team, by interviewer and by year. Where a later lesson says "the interviewer", read it as "whoever is asking", and prepare for the least convenient version: one person, a marker, and a follow-up to every answer.

The screens module covered how to derive out loud with no surface at all, which is the phone-screen constraint. Here you should assume you probably have a surface and that it will not save you, because a domain question is answered in ninety seconds of speech and a diagram, not in four minutes of algebra.

## The four moves

**State the assumptions. Write the equation. Interpret it physically. Sanity check it.** In that order, every time, for every question that has an equation in it.

The order is not decorative. Each move sets up the next: assumptions fix what the symbols mean, the equation is the compressed answer, the interpretation converts the equation back into a statement about a vehicle, and the check tests the whole chain against something you knew independently. Skip one and the answer still contains the fact, but it stops demonstrating that you know what the fact is *for*.

Here is what each move is actually evidence of, which is the part candidates miss.

| Move | What the interviewer learns |
| --- | --- |
| Assumptions stated first | You know where the model's edges are, so you will notice when a vehicle walks over one |
| The equation, with symbols defined | You carry the result rather than a memory of having once read it |
| Physical interpretation | You can talk to a propulsion engineer, a structures engineer and a programme manager |
| Sanity check | Your own work has a chance of catching its own errors |

Three of the four are cheap. Only the equation requires memory, which is why the equation is the part candidates over-rehearse and the other three are where the round is actually won or lost.

## Move one: assumptions, before any algebra

An assumption stated out loud is a different object from an assumption made silently. The silent one is indistinguishable from an oversight.

For most GNC questions the list is short and largely fixed: rigid or flexible; one axis or three; linear or nonlinear; small angles or large; which frame the components are expressed in; what the actuator and sensor dynamics are being neglected; whether noise is white, zero-mean and Gaussian. Say the two or three that matter for this question, not all of them — a candidate who recites nine assumptions for a question that turns on one is padding, and it reads as padding.

The strongest form names the assumption *and* the failure it is protecting against: "I will assume the gyro noise is white, which is what lets me write $\mathbf{Q}$ as a constant; if there is a slowly wandering bias in there instead, that assumption is the first thing I would go back and break."

::: warning An assumption you state and then quietly violate is worse than one you never stated
If you open with "small angles" and then, three minutes later, use the answer at forty degrees, the interviewer has watched you contradict yourself and will say so. Either keep the assumption or announce that you are leaving it: "I am going to step outside the small-angle assumption here, and the consequence is that the kinematics stop being linear."
:::

## Move two: the equation, with every symbol defined

Write it, and define each symbol once, with units, as it first appears. In a domain round this is fast, because these equations are short. The Kalman gain is one line. The delay margin is one line. Wahba's cost is one line.

Two habits make the difference. First, **write it before you talk about it**, so that the interviewer is reading the same object you are describing rather than reconstructing it from your speech. Second, **say the shape before the symbols**: "the gain is the prior covariance mapped into measurement space, divided by the total innovation covariance" is a sentence that survives even if you fumble a transpose, and the interviewer will hear that you have the structure.

If you genuinely cannot recall the exact form, write the structure you are sure of and say which piece you are unsure about. That is the subject of the next lesson and it is a legitimate answer, not a failure.

## Move three: interpret it physically

The test for this move is concrete: **say one sentence about the vehicle that contains no symbols.** Not "as $\mathbf{R}$ grows, $\mathbf{K}$ shrinks" — that is still algebra. Rather: "if the star tracker is noisier than we modelled, the filter leans on the gyro and rides through the noise, and it will lag a real attitude change by longer."

This is the move that separates people who have implemented these things from people who have read about them, and it is also the move that transfers directly to the job, because nobody at a design review wants the algebra first.

Every one of the lessons that follows carries the physical reading alongside the equation, in the same `::: key` block, because they are meant to be memorised together.

## Move four: the sanity check, out loud

There are four checks worth carrying, and one of them fits almost every GNC question.

**Units.** A proportional gain that turns radians into newton metres is in $\mathrm{N\,m/rad}$; a delay margin is in seconds; a covariance entry is in the square of the state's units. A units check costs four seconds and catches transposed factors.

**A limiting case.** Set a gain to zero, or a noise to zero, or a frequency to zero or infinity, and say what the expression must become. If $\mathbf{R}\to\mathbf{0}$ the Kalman gain must approach the pseudo-inverse of $\mathbf{H}$ and the filter must believe the measurement outright; if $\mathbf{R}\to\infty$ the gain must go to zero. If the expression does not do that, it is wrong.

**A sign, against a physical expectation.** Damping opposes rate. A restoring torque opposes displacement. Covariance grows in prediction and shrinks in update. Innovations are zero-mean when the model is right.

**An order of magnitude, against an anchor you already trust.** This is the check worth preparing, because it needs stock. Carry these:

| Anchor | Value |
| --- | --- |
| Circular speed at $400\,\mathrm{km}$ altitude | $7.67\,\mathrm{km/s}$ |
| Orbital period at $400\,\mathrm{km}$ | $92.6\,\mathrm{min}$ |
| Geostationary radius and period | $42\,164\,\mathrm{km}$, $23.93\,\mathrm{h}$ |
| Earth's gravitational parameter | $\mu = 3.986\times10^{14}\,\mathrm{m^3/s^2}$ |
| Standard gravity | $g_0 = 9.80665\,\mathrm{m/s^2}$ |
| Earth rotation rate | $7.292\times10^{-5}\,\mathrm{rad/s} = 15.04^\circ/\mathrm{h}$ |
| One degree, one arcsecond | $17.45\,\mathrm{mrad}$, $4.85\,\mathrm{\mu rad}$ |
| One rad/s | $0.159\,\mathrm{Hz}$ |
| Schuler period | $84.4\,\mathrm{min}$ |

::: key The answering standard
Four moves, in order: state the assumptions, write the equation and define its symbols, interpret it physically in one sentence that contains no symbols, and close with a sanity check said out loud — units, a limiting case, a sign, or an order of magnitude against a known anchor. The equation is the part that needs memory; the other three are the part that needs practice.
:::

## Three shapes of question, three budgets

Domain questions come in three shapes, and they want their ninety seconds spent differently.

**Recall.** *"What is gain margin?"* The fact is the whole answer. Budget: fifteen seconds for the definition, thirty for the physical reading, fifteen for the number a real design targets. Then stop, because a recall question answered at length reads as padding.

**Mechanism.** *"Why does a Kalman filter diverge when the process noise is set too small?"* The fact is the starting point and the causal chain is the answer. Budget: ten seconds to name the relevant equation, sixty seconds to walk the chain one link at a time, twenty seconds on how you would detect it.

**Diagnosis.** *"Your filter tracks well but its innovations are correlated — what do you do?"* The answer is an ordered list of candidate causes and a test that discriminates between them. Budget: fifteen seconds to restate the symptom precisely, sixty to give two or three candidates ranked by likelihood, fifteen for the measurement that would separate them.

Misreading the shape is a common and expensive error. Answering a recall question as though it were a mechanism question buries the definition. Answering a mechanism question as though it were recall produces a correct sentence and no evidence of understanding.

::: example "Why does a Kalman filter diverge when the process noise is set too small?"
**A weak answer:** "Because the filter becomes overconfident. If $\mathbf{Q}$ is too small the covariance gets too small and the filter stops trusting the measurements, so it diverges. You want to tune $\mathbf{Q}$ so it matches reality."

That is not wrong. It is also three sentences of restatement with no mechanism in them, and an interviewer cannot tell whether the candidate has ever watched it happen.

**A strong answer, narrated:**

"This is a positive-feedback loop in the covariance, and it is easiest to see in the two lines where $\mathbf{Q}$ appears at all.

Assumptions: linear model, the filter is otherwise correctly specified, and the true dynamics contain something the model leaves out — an unmodelled acceleration, a drifting bias, whatever it is.

Prediction is $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, and $\mathbf{Q}$ is the only term that adds uncertainty. Make it too small and the covariance grows almost not at all between measurements. The update then shrinks it again, $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$, so over many cycles $\mathbf{P}$ contracts toward zero. And the gain $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ goes to zero with it.

Physically: the filter has concluded that its model is so good it no longer needs the sensor. So it stops listening. Meanwhile the real error is not going to zero, because there is something the model does not contain, and that error now has nothing correcting it. The estimate walks away while the reported covariance keeps shrinking — confident and wrong, which is the dangerous failure rather than the noisy one.

Detecting it: the innovations tell you before the estimate does. They stop being zero-mean, they become strongly correlated from step to step, and the normalised innovation squared sits above its chi-squared bound. All three are computable on real flight data with no truth available.

Fixes, in order of preference: add the missing state if you can name it, because that is the honest fix; otherwise inflate $\mathbf{Q}$ until the consistency test passes, or use a fading-memory factor that inflates the propagated covariance every cycle.

Sanity check on the direction: if $\mathbf{Q}$ were instead too *large*, the gain would go up and the estimate would chase measurement noise — noisy but not divergent. The two errors fail in opposite directions, and only the small-$\mathbf{Q}$ one is quiet about it."

**What the interviewer learns from the difference:** the strong answer names the two equations, walks the causal chain link by link, converts it into one sentence about what the filter is "deciding", offers a detection method that works without truth, ranks the remedies, and closes by checking the opposite error. It is about ninety seconds spoken. Nothing in it is obscure — the entire content is two standard equations and the discipline to follow them through.
:::

::: example "What is phase margin, physically?"
**A weak answer:** "It is how far the phase is from $-180$ degrees at the gain crossover frequency. You want at least thirty degrees, usually more like sixty."

Correct, and it is a definition with the physics filed off. It could have been read off a card.

**A strong answer:**

"Definition first: at the frequency where the open-loop magnitude is one — the gain crossover $\omega_{gc}$ — the phase margin is $180^\circ$ plus the open-loop phase there. It is how much *extra* lag the loop can absorb before the negative feedback arrives late enough to be positive feedback.

Physically I would rather quote it as a time. Any pure delay $T$ multiplies the loop by $e^{-j\omega T}$: magnitude unchanged, phase reduced by $\omega T$. So the crossover frequency does not move, and the margin is used up when $\omega_{gc}T$ equals the phase margin in radians. That gives the delay margin, phase margin in radians over $\omega_{gc}$, in seconds — which is the number I would actually take to the flight software team, because latency is the thing they can trade: sample rate, filter order, scheduling jitter, bus transport.

Typical numbers: aerospace loops target thirty to forty-five degrees, often sixty where the plant is poorly known.

Sanity check: more bandwidth costs delay margin for the same phase margin, since $\omega_{gc}$ is in the denominator. A loop redesigned for four times the bandwidth has a quarter of the delay budget at the same phase margin, which matches the experience that fast loops are the ones that get bitten by latency."

**What the interviewer learns:** the strong answer is the same fact plus a conversion into an engineering currency, an account of who the number is for, and a limiting-case check that produces a true statement about real designs. It is under sixty seconds.
:::

## Check yourself

::: check
Name the four moves of the answering standard in order, and say which one requires memory and which three require practice.
:::

::: answer
State the assumptions; write the equation and define its symbols; interpret it physically; sanity check it out loud. Only the second requires memory — the exact form of the Kalman gain, the definition of gain margin, the Wahba cost. The other three are practised skills that apply to any equation you have just written, which is why they are the reliable part of an answer under pressure and the part most candidates never rehearse.
:::

::: check
A question asks: "Your orbit determination filter's residuals look fine on range but show a slow ramp on range-rate. What is going on?" Which of the three question shapes is this, and how should the ninety seconds be divided?
:::

::: answer
It is a diagnosis question: a symptom is given and the answer is a ranked set of candidate causes plus a discriminating test. Spend the first fifteen seconds restating the symptom precisely — a ramp in one measurement type's residuals and not the other's, which already says the error is in something that affects velocity more than position over the arc. Spend about sixty seconds on two or three candidates ranked by likelihood: an unmodelled along-track acceleration such as drag or a small manoeuvre, a station clock or oscillator drift affecting the Doppler channel only, a mismodelled light-time or tropospheric term. Spend the last fifteen on the test that separates them: an error in the dynamics should show in both channels once the arc is long enough and should be absorbed by solving for a drag coefficient, while a range-rate-only defect that survives that is instrumental.
:::

::: check
Give a limiting-case sanity check for the Kalman gain in each direction, $\mathbf{R}\to\mathbf{0}$ and $\mathbf{R}\to\infty$, and say what each means about the vehicle.
:::

::: answer
With $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$: as $\mathbf{R}\to\mathbf{0}$ the denominator becomes $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ and the gain approaches the value that drives the residual to zero — for scalar measurement and state, $K\to1$, and the posterior takes the measurement outright. Physically: a perfect sensor, so ignore the prediction. As $\mathbf{R}\to\infty$ the denominator grows without bound and $\mathbf{K}\to\mathbf{0}$: the update does nothing and the filter coasts on its dynamics. Physically: a sensor so noisy it carries no information, so ride the model. Any expression you write for the gain that does not do both of these is wrong, and the check takes one sentence.
:::

::: check
An interviewer asks "what is gain margin?" and you deliver a four-minute answer covering Nyquist encirclements, the modulus margin, and an example from a launch vehicle loop. What has gone wrong, even if every statement is true?
:::

::: answer
The question shape was misread. "What is gain margin" is a recall question, and its ninety seconds want a definition, a physical reading, and the number a real design targets — then a stop, which invites the interviewer to take it wherever they intended to take it next. A four-minute answer to a recall question spends time the interviewer had allocated to three other subjects, signals that you cannot judge what a question is asking for, and removes their control of the conversation. The material about Nyquist and the modulus margin is not wasted; it is the answer to the follow-up, and it lands far better when they ask for it than when you volunteer it.
:::

::: check
Convert this into a physical-interpretation sentence containing no symbols: "the covariance grows during the predict step by $\mathbf{Q}$ and shrinks during the update step."
:::

::: answer
"Between measurements the filter gets less sure of where the vehicle is, because the model it is coasting on is imperfect and the longer it coasts the further that imperfection can have carried it; every time a sensor reports, it gets more sure again." A good test of the sentence is whether a propulsion engineer with no estimation background would follow it, and whether it would still be true if you swapped the specific filter for any other. Both hold here.
:::

## Summary

| Item | Content |
| --- | --- |
| The four moves | Assumptions, equation with symbols defined, physical interpretation, sanity check |
| Physical-interpretation test | One sentence about the vehicle containing no symbols |
| Four sanity checks | Units; a limiting case; a sign against physical expectation; order of magnitude against an anchor |
| Recall question | Definition, physical reading, design target — then stop |
| Mechanism question | Name the equation, walk the causal chain, say how you would detect it |
| Diagnosis question | Restate the symptom, rank two or three causes, give a discriminating test |
| Anchors to carry | $7.67\,\mathrm{km/s}$ at $400\,\mathrm{km}$; $92.6\,\mathrm{min}$; GEO $42\,164\,\mathrm{km}$; $g_0 = 9.80665\,\mathrm{m/s^2}$; $15.04^\circ/\mathrm{h}$ |
| Process | Format, length and panel size vary; prepare for one interviewer, a marker, and a follow-up to everything |

The next lesson takes the case this one assumed away: the question whose fact you do not have. That is a testable skill with its own structure, and it is the difference between a gap and a failure.
