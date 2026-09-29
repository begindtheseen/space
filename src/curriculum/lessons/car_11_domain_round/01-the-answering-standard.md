---
id: l01-the-answering-standard
title: "The answering standard: four moves, ninety seconds"
minutes: 22
covers:
  - "the answering standard: state assumptions, write the equation, interpret physically, sanity check"
---

Think about a spelling bee. You can be calm and polite, but spell the word wrong and you are out. Spell it right and nerves cannot take it away. The word is right or it is not.

The **[[domain round|domain-round]]** — the part of a job interview where engineers test what you know about your own field — works the same way. Most of this career track has been about presentation. This module is different. When an interviewer asks *why does a Kalman filter go wrong when its process noise is set too small?*, the answer is a fact. Calm cannot make a wrong answer right; nerves cannot make a right one wrong.

What this lesson adds is the packaging. The same correct fact, delivered in four clear moves, is worth much more than the same fact delivered as a jumble, because the moves are evidence in their own right. An engineer who states assumptions before the algebra will state them in a **[[design review|design-review]]** — the meeting where other engineers pick a design apart before it is built. An engineer who ends with a sanity check will catch her own mistakes before a flight does.

This lesson gives the standard and a time budget. The next gives the harder skill: what to do when the fact is not there.

## What this round is, and what we do not know about it

This module's sources name the subjects: stability margins, the **[[Kalman filter|kalman-filter]]** and its nonlinear relatives, filter tuning and consistency, attitude determination (working out which way a spacecraft points), the quaternion filter, inertial navigation, PID control and windup, and orbit determination. Each gets a lesson here, and each has right answers.

The process around them varies by company, team, interviewer and year, and this course will not pretend to know it for any one employer: a whiteboard, a shared document, a video call, or nothing to write on; one engineer or five; a fixed list or questions from your résumé. So read "the interviewer" as "whoever is asking", and prepare for the least convenient version: one person, a marker, and a follow-up to every answer.

Assume you probably have a surface — and that it will not save you. A domain question is answered in about ninety seconds of talking plus a sketch, not four minutes of algebra.

## The four moves

The whole standard: **state the assumptions, write the equation, interpret it physically, sanity check it.** In that order, for every question with an equation in it.

Think of a recipe card: what you are making and for how many (the assumptions), the ingredient list (the equation), what the dish should taste like (the meaning), and "taste before serving" (the check).

The **[[order matters|four-moves-picture]]**. The assumptions fix what the symbols mean. The equation is the answer in compressed form. The interpretation turns it back into a statement about a real vehicle. The check tests the whole chain against something you already knew. Skip one and your answer still contains the fact, but it stops showing that you know what the fact is *for*.

Here is what each move tells the interviewer:

| Move | What the interviewer learns |
| --- | --- |
| Assumptions stated first | You know where the model's edges are, so you will notice when a vehicle walks over one |
| The equation, with symbols defined | You carry the result, not a memory of once having read it |
| Physical interpretation | You can talk to a propulsion engineer, a structures engineer and a program manager |
| Sanity check | Your own work has a chance of catching its own errors |

Only the equation needs memory. That is why candidates over-rehearse it — and why the other three are where the round is really won or lost.

## Move one: assumptions, before any algebra

An **assumption** is something you take as true to make the problem solvable. Said out loud, it is a decision. Kept silent, it looks like a mistake.

For most GNC questions (guidance, navigation and control, said "G-N-C") the list is short and mostly the same:

- rigid body or flexible;
- one axis or three;
- linear or nonlinear;
- small angles or large;
- which **frame** — which set of reference axes — the numbers are written in;
- which sensor and actuator behavior you are ignoring;
- whether the noise is **[[white, zero-mean and Gaussian|white-noise]]**.

Say the two or three that matter for this question. Nine assumptions for a question that turns on one is padding, and sounds like it.

Best of all, name the assumption *and* the failure it guards against: "I will assume the gyro noise is white, which is what lets me write $\mathbf{Q}$ as a constant. If there is a slowly wandering bias in there instead, that assumption is the first thing I would go back and break." ($\mathbf{Q}$, read "bold Q", is the filter's process-noise matrix; lesson 6 introduces it.)

::: warning An assumption you state and then quietly break is worse than one you never stated
If you open with "small angles" and then, three minutes later, use your answer at forty degrees, the interviewer has watched you contradict yourself and will say so. Either keep the assumption or announce that you are leaving it: "I am going to step outside the small-angle assumption here, and the consequence is that the equations of motion stop being linear."
:::

## Move two: the equation, with every symbol defined

Define each symbol once, with its units, the first time it appears. This is quick, because these equations are short: the Kalman gain, the delay margin and Wahba's cost are one line each. Two habits make the difference.

**Write it before you talk about it,** so the interviewer reads the same thing you are describing instead of rebuilding it from your speech.

**Say the shape before the symbols.** For example: "the gain is the prior uncertainty mapped into measurement space, divided by the total uncertainty of the new measurement." That sentence survives even if you fumble a transpose, and the interviewer hears that you have the structure.

If you cannot recall the exact form, write the part you are sure of and say which piece you doubt. That is a legitimate answer, and the next lesson's subject.

## Move three: interpret it physically

The test: **say one sentence about the vehicle that contains no symbols.**

"As $\mathbf{R}$ grows, $\mathbf{K}$ shrinks" fails — it is spoken algebra. This passes: "if the **[[star tracker|star-tracker]]** is noisier than we modeled, the filter leans on the gyro and rides through the noise — and it will lag a real attitude change by longer."

This move separates people who have built these things from people who have read about them, and nobody at a design review wants the algebra first. Every later lesson puts the physical reading next to the equation, in the same key box, so you memorize them together.

## Move four: the sanity check, out loud

A **sanity check** is a quick test of whether an answer is even possible. If you work out that a car weighs 3 grams, you know something went wrong before you find the slip. Four checks are worth carrying, and one fits almost every GNC question.

**Units.** A proportional gain that turns radians of error into newton-meters of torque has units of $\mathrm{N\,m/rad}$. A delay margin is in seconds. A covariance entry — a measure of spread — is in the square of the state's units. Four seconds, and it catches misplaced factors.

**A [[limiting case|limiting-case]].** Push one quantity to an extreme — zero or infinity — and say what the expression must become. For the Kalman gain: as the measurement noise $\mathbf{R}\to\mathbf{0}$, the estimate must reproduce the measurement exactly: the filter believes the sensor outright. As $\mathbf{R}\to\infty$, the gain must go to zero. If your expression does not do that, it is wrong.

**A sign, against what physics says.** Damping opposes motion. A restoring torque opposes displacement. **[[Covariance grows in prediction and shrinks in update|covariance-sawtooth]].** The **innovations** — the gaps between what a sensor reports and what the filter predicted it would report — average to zero when the model is right.

**An order of magnitude, against an anchor.** An **anchor** is a number you know cold. This check needs a stock of them prepared ahead of time. Carry these:

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

Read $\mu$ as "mew" and $g_0$ as "g nought". A geostationary satellite goes around once per Earth spin, measured against the stars — the **sidereal day**, about four minutes shorter than 24 hours — so it seems to hang still in the sky. An arcsecond is one 3600th of a degree. The **[[Schuler period|schuler-period]]** is the natural rhythm of error in an inertial navigator on Earth.

::: key The answering standard
Four moves, in order: state the assumptions, write the equation and define its symbols, interpret it physically in one sentence that contains no symbols, and close with a sanity check said out loud — units, a limiting case, a sign, or an order of magnitude against a known anchor. The equation is the part that needs memory; the other three are the part that needs practice.
:::

## Three shapes of question, three budgets

Domain questions come in three shapes, like questions to a doctor: "what is this word?", "why does this happen?", and "here is what I feel — what is wrong?" Each wants its time spent differently.

**Recall.** *"What is gain margin?"* Budget: fifteen seconds for the definition, thirty for the physical reading, fifteen for the number a real design aims for. Then stop; length here sounds like padding.

**Mechanism.** *"Why does a Kalman filter diverge when the process noise is set too small?"* The chain of cause and effect is the answer. Budget: ten seconds to name the relevant equation, sixty seconds to walk the chain one link at a time, twenty seconds on how you would detect the problem.

**Diagnosis.** *"Your filter tracks well but its innovations are correlated — what do you do?"* The answer is ranked causes plus a test that tells them apart. Budget: fifteen seconds to restate the symptom precisely, sixty to give two or three causes ranked by how likely they are, fifteen for the measurement that would separate them.

The **[[budgets add up|question-budgets]]** to a minute for recall and ninety seconds otherwise. Misreading the shape is expensive. Answer recall as mechanism and you bury the definition. Answer mechanism as recall and you give a correct sentence with no evidence of understanding.

::: example "Why does a Kalman filter diverge when the process noise is set too small?"
A filter **diverges** when its estimate drifts ever further from the truth.

**A weak answer:** "Because the filter becomes overconfident. If $\mathbf{Q}$ is too small the covariance gets too small and the filter stops trusting the measurements, so it diverges. You want to tune $\mathbf{Q}$ so it matches reality."

Not wrong — but restatement with no mechanism. Has this candidate ever watched it happen? You cannot tell.

**A strong answer, narrated:**

"This is a runaway loop in the covariance, and it is easiest to see in the two lines where $\mathbf{Q}$ appears at all.

Assumptions: a linear model, the filter is otherwise set up correctly, and the true dynamics contain something the model leaves out — an unmodeled acceleration, a drifting bias, whatever it is.

Prediction is $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, and $\mathbf{Q}$ is the only term that adds uncertainty. Make it too small and the covariance hardly grows between measurements, while the update keeps shrinking it, $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$, so over many cycles $\mathbf{P}$ shrinks toward zero. And the gain $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ goes to zero with it.

Physically: the filter has concluded its model is so good it no longer needs the sensor, so it stops listening. But the real error is not going to zero — the model is missing something — and now nothing corrects it. The estimate walks away while the reported covariance keeps shrinking — confident and wrong, which is the dangerous failure rather than the noisy one.

Detecting it: the innovations tell you first. They stop averaging to zero, become strongly correlated step to step, and the normalized innovation squared sits above its **[[chi-squared bound|chi-squared]]**. All three work on flight data with no truth available.

Fixes, in order: add the missing state if you can name it — the honest fix. Otherwise raise $\mathbf{Q}$ until the consistency test passes, or use a fading-memory factor that inflates the predicted covariance every cycle.

Sanity check on the direction: with $\mathbf{Q}$ too *large*, the gain rises and the estimate chases measurement noise — noisy, not divergent. The errors fail in opposite directions, and only small $\mathbf{Q}$ is quiet about it."

Here $\mathbf{P}$ is the covariance (how unsure the filter thinks it is), $\mathbf{F}$ steps the state forward, $\mathbf{H}$ turns a state into a predicted measurement, $\mathbf{I}$ is the identity matrix, and $-$ and $+$ mean before and after the measurement. Lesson 6 builds all of these.

**What the interviewer learns:** the strong answer names the two equations, walks the chain link by link, says in one sentence what the filter is "deciding", detects it without knowing the truth, ranks the fixes, and checks the opposite error. Spoken, it takes about ninety seconds, and nothing in it is obscure — two standard equations and the discipline to follow them through.
:::

::: example "What is phase margin, physically?"
**A weak answer:** "It is how far the phase is from $-180$ degrees at the gain crossover frequency. You want at least thirty degrees, usually more like sixty."

Correct, but the physics is filed off — it could come off a flashcard.

**A strong answer:**

"Definition first: at the frequency where the open-loop magnitude is one — the gain crossover $\omega_{gc}$ — the phase margin is $180^\circ$ plus the open-loop phase there. It is how much *extra* lag the loop can absorb before negative feedback arrives late enough to act as positive feedback.

I would rather quote it as a time. A pure delay $T$ multiplies the loop by $e^{-j\omega T}$: the magnitude is unchanged, and the phase drops by $\omega T$. So the crossover frequency does not move, and the margin is used up when $\omega_{gc}T$ equals the phase margin in radians. That gives the delay margin — phase margin in radians divided by $\omega_{gc}$, in seconds. That is the number I take to the flight software team, because latency is what they can trade: sample rate, filter order, scheduling jitter, time on the data bus.

Aerospace loops aim for thirty to forty-five degrees, often sixty where the plant is poorly known.

Sanity check: more bandwidth costs delay margin at the same phase margin, because $\omega_{gc}$ is on the bottom of the fraction. Four times the bandwidth means a quarter of the delay budget at the same phase margin — which matches experience: fast loops get bitten by latency."

Read $\omega_{gc}$ as "omega sub g-c". Lesson 3 teaches every piece of this.

**What the interviewer learns:** the same fact, converted into an engineering currency (seconds), with who the number is for and a check that gives a true statement about real designs — in under sixty seconds.
:::

## Check yourself

::: check
Name the four moves of the answering standard in order, and say which one needs memory and which three need practice.
:::

::: answer
State the assumptions; write the equation and define its symbols; interpret it physically; sanity check it out loud.

Only the second needs memory — the exact Kalman gain, the definition of gain margin, the Wahba cost. The other three are practiced skills that work on any equation, which makes them the reliable part of an answer under pressure and the part most candidates never rehearse.
:::

::: check
A question asks: "Your orbit determination filter's residuals look fine on range but show a slow ramp on range-rate. What is going on?" Which of the three question shapes is this, and how should the ninety seconds be divided?
:::

::: answer
It is a diagnosis question: a symptom, answered by ranked causes plus a test that separates them. (Range is distance to the spacecraft, range-rate how fast it changes, and a residual what is left after the fit.)

Spend fifteen seconds restating the symptom precisely: a ramp in one measurement type's residuals and not the other's. That already hints the error affects velocity more than position over the pass.

Spend sixty on two or three causes, ranked:

- an unmodeled along-track acceleration, such as drag or a small maneuver;
- a ground station clock or oscillator drift that affects only the Doppler (range-rate) channel;
- a mismodeled light-time or atmospheric delay term.

Spend the last fifteen on the separating test. A dynamics error should show in both channels once the arc is long enough, and be absorbed by solving for a drag coefficient. A range-rate-only defect that survives that is instrumental.
:::

::: check
Give a limiting-case sanity check for the Kalman gain in each direction, $\mathbf{R}\to\mathbf{0}$ and $\mathbf{R}\to\infty$, and say what each means about the vehicle.
:::

::: answer
Start from $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$.

As $\mathbf{R}\to\mathbf{0}$, the bracket becomes $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$. Multiply the gain by $\mathbf{H}$ and you get $\mathbf{H}\mathbf{K}\to\mathbf{I}$, so the updated estimate reproduces the measurement exactly. For a single state measured directly ($H = 1$), $K\to1$ and the new estimate is the measurement. Physically: a perfect sensor, so ignore the prediction.

As $\mathbf{R}\to\infty$, the bracket grows without limit and $\mathbf{K}\to\mathbf{0}$. The update does nothing and the filter coasts on its dynamics. Physically: a sensor so noisy it carries no information, so ride the model.

A gain expression that fails either limit is wrong, and the check takes one sentence.
:::

::: check
An interviewer asks "what is gain margin?" and you give a four-minute answer covering Nyquist encirclements, the modulus margin, and an example from a launch vehicle. What has gone wrong, even if every statement is true?
:::

::: answer
You misread the shape. "What is gain margin?" is recall: a definition, a physical reading and the number a real design targets — then a stop, which lets the interviewer steer where they meant to go.

A four-minute answer spends time the interviewer had set aside for other subjects, signals that you cannot judge what a question asks for, and takes away their control of the conversation. The Nyquist and modulus-margin material is not wasted: it answers the follow-up, and lands far better when they ask for it.
:::

::: check
Turn this into a physical-interpretation sentence with no symbols: "the covariance grows during the predict step by $\mathbf{Q}$ and shrinks during the update step."
:::

::: answer
"Between measurements the filter gets less sure of where the vehicle is, because the model it is coasting on is imperfect, and the longer it coasts the further that imperfection can have carried it. Every time a sensor reports, it gets more sure again."

Test it: would a propulsion engineer with no estimation background follow it, and would it hold for any other filter? Both do.
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
| Process | Varies; prepare for one interviewer, a marker, and a follow-up to everything |

The next lesson takes the case this one assumed away: the question whose fact you do not have — a testable skill of its own, and the difference between a gap and a failure.

::: context domain-round Why it is called the "domain" round
In engineering hiring, your **domain** is your specialty — the body of knowledge your job is built on. For a GNC engineer, that is control, estimation and orbital mechanics. A typical interview day has several parts: a screen with a recruiter, sometimes a coding round, a behavioral round about how you work with people, and one or more technical rounds where engineers from the team question you on the domain. Companies name and arrange these parts differently, and many do not use the word "domain" at all, so treat it as this course's label for the technical-knowledge part, whatever a given company calls it.
:::

::: context design-review Where the four moves come from in real work
Aerospace programs put designs through a series of formal reviews before anything flies. NASA's life cycle, for example, includes a Preliminary Design Review (PDR) and a Critical Design Review (CDR), where a panel of engineers questions the design. The questions sound a lot like a domain round: what did you assume, show me the equation, what does it mean for the vehicle, how do you know the number is right? That is no accident. The interviewer is partly asking, "would I want this person presenting at our next review?"
:::

::: context kalman-filter A one-paragraph Kalman filter
A **Kalman filter** is a recipe for blending two imperfect sources of information: a model that predicts where the vehicle should be, and sensors that report where it seems to be. Each cycle it predicts forward, compares the prediction with a new measurement, and nudges its estimate toward the measurement by an amount set by how much it trusts each source. It is named after Rudolf Kálmán, who published the method in 1960, and it was used in navigation for the Apollo program. Lesson 6 writes it out in full.
:::

::: context four-moves-picture The four moves as a pipeline
Each move hands something to the next. The assumptions fix what the symbols mean; the equation compresses the answer; the interpretation turns it back into words about a vehicle; the check tests the result against something you already knew. If the check fails, you go back to the start and question the assumptions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <rect x="6" y="30" width="74" height="44" rx="6"/>
    <rect x="98" y="30" width="74" height="44" rx="6"/>
    <rect x="190" y="30" width="74" height="44" rx="6"/>
    <rect x="282" y="30" width="72" height="44" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="43" y="49">1 State</text><text x="43" y="64">assumptions</text>
    <text x="135" y="49">2 Write the</text><text x="135" y="64">equation</text>
    <text x="227" y="49">3 Say what</text><text x="227" y="64">it means</text>
    <text x="318" y="49">4 Sanity</text><text x="318" y="64">check</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="80" y1="52" x2="94" y2="52"/><line x1="172" y1="52" x2="186" y2="52"/><line x1="264" y1="52" x2="278" y2="52"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="98,52 90,47 90,57"/><polygon points="190,52 182,47 182,57"/><polygon points="282,52 274,47 274,57"/>
  </g>
  <path d="M318 74 L318 112 L43 112 L43 80" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="43,74 38,84 48,84" fill="#b4232c"/>
  <text x="180" y="132" font-size="12" fill="#b4232c" text-anchor="middle">check fails: question the assumptions</text>
  <text x="180" y="18" font-size="12" fill="#6c7a93" text-anchor="middle">only step 2 needs memory</text>
</svg>
```
:::

::: context white-noise What "white, zero-mean and Gaussian" means
**White** noise is noise with no memory: knowing this instant's value tells you nothing about the next one. The name borrows from white light, which mixes all colors (frequencies) equally. **Zero-mean** means it averages out to nothing over time, so it adds scatter but no steady push. **Gaussian** means its values follow the bell curve, named after the mathematician Carl Friedrich Gauss. A gyro bias that wanders slowly breaks the first two: it has memory, and over a short stretch it does not average to zero. That is why a real filter often gives the bias its own state.
:::

::: context star-tracker Star trackers and gyros
A **star tracker** is a small camera that photographs the star field, matches the pattern against a catalog, and reports which way the spacecraft is pointing — very accurate, but it updates only a few times a second and can be blinded by the Sun. A **gyro** (short for gyroscope) measures how fast the spacecraft is turning, many times a second, but it drifts slowly. The attitude filter blends the two: the gyro fills in between star tracker reports, and the star tracker pulls the gyro's drift back into line. Lessons 11 and 12 build exactly this filter.
:::

::: context limiting-case Why extreme cases catch errors
A formula that is right must be right everywhere, including at the edges. At an edge, you often know the answer without any formula: a perfect sensor should be believed; a useless one should be ignored; a loop with no delay loses no phase. So pushing a variable to zero or infinity gives you a free answer to compare against. Wrong formulas usually fail at the edges, because the typical slip — a flipped fraction, a missing term — changes how the expression behaves as something grows. Physicists use this trick all the time; it takes one sentence and needs no calculator.
:::

::: context covariance-sawtooth The sawtooth shape of uncertainty
Plot a filter's uncertainty over time and you get a sawtooth. Between measurements it climbs, because the model is coasting and errors pile up. At each measurement it drops, because the sensor pins the estimate down. In a healthy filter the teeth settle to a steady size. When the process noise is set too small, the climbs almost vanish and the whole line sinks toward zero — the filter becoming overconfident.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="120" x2="30" y2="14" stroke="#1f2a44" stroke-width="2"/>
  <text x="344" y="138" font-size="11" fill="#1f2a44" text-anchor="end">time</text>
  <text x="36" y="20" font-size="11" fill="#1f2a44">uncertainty</text>
  <polyline points="30,30 90,50 90,85 150,62 150,92 210,68 210,94 270,69 270,95 330,70 330,95" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="90" y1="120" x2="90" y2="30"/><line x1="150" y1="120" x2="150" y2="30"/><line x1="210" y1="120" x2="210" y2="30"/><line x1="270" y1="120" x2="270" y2="30"/><line x1="330" y1="120" x2="330" y2="30"/>
  </g>
  <text x="212" y="44" font-size="11" fill="#6c7a93">measurements</text>
  <text x="112" y="72" font-size="11" fill="#1d6fd1" text-anchor="middle">grows</text>
  <text x="170" y="108" font-size="11" fill="#1d6fd1">shrinks</text>
</svg>
```
:::

::: context schuler-period The Schuler period
Imagine a pendulum whose string is as long as Earth's radius. It would swing back and forth once every $2\pi\sqrt{R_E/g}$, which with $R_E \approx 6378\,\mathrm{km}$ and $g \approx 9.81\,\mathrm{m/s^2}$ comes to about $84.4$ minutes. Max Schuler noticed in the 1920s that a navigation system which stays level over a curved Earth behaves like that pendulum: a small tilt error does not grow without limit but swings back and forth with this period. So an inertial navigator's position error often oscillates with an $84$-minute rhythm, and seeing that number in a plot is a sanity check that the physics is right. Lesson 12 returns to inertial navigation.
:::

::: context question-budgets The three budgets side by side
Here are the three time budgets drawn to scale, in seconds. Recall is shortest on purpose: the fact is the answer, and stopping early hands the interviewer the next move. Mechanism and diagnosis both spend most of their time in the middle, walking a chain or ranking causes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="4" y="40">Recall</text><text x="4" y="76">Mechanism</text><text x="4" y="112">Diagnosis</text>
  </g>
  <rect x="80" y="26" width="45" height="22" fill="#8fb8f0"/><rect x="125" y="26" width="90" height="22" fill="#1d6fd1"/><rect x="215" y="26" width="45" height="22" fill="#f2b880"/>
  <rect x="80" y="62" width="30" height="22" fill="#8fb8f0"/><rect x="110" y="62" width="180" height="22" fill="#1d6fd1"/><rect x="290" y="62" width="60" height="22" fill="#f2b880"/>
  <rect x="80" y="98" width="45" height="22" fill="#8fb8f0"/><rect x="125" y="98" width="180" height="22" fill="#1d6fd1"/><rect x="305" y="98" width="45" height="22" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="102" y="41">15</text><text x="170" y="41" fill="#ffffff">30</text><text x="237" y="41">15</text>
    <text x="95" y="77">10</text><text x="200" y="77" fill="#ffffff">60</text><text x="320" y="77">20</text>
    <text x="102" y="113">15</text><text x="215" y="113" fill="#ffffff">60</text><text x="327" y="113">15</text>
  </g>
  <line x1="80" y1="134" x2="350" y2="134" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="80" y="148">0 s</text><text x="260" y="148">60 s</text><text x="350" y="148">90 s</text>
  </g>
</svg>
```
:::

::: context chi-squared A test with a known answer
The **normalized innovation squared** (NIS) takes each innovation and divides it by how large the filter *expected* it to be. If the filter's picture of its own uncertainty is honest, this number follows a known statistical pattern, the **chi-squared** distribution (said "kye-squared", from the Greek letter $\chi$). That pattern tells you the range the average should fall in. Consistently above the range means the filter is more confident than it should be; consistently below means it is too cautious. Lesson 9 builds this test step by step.
:::
