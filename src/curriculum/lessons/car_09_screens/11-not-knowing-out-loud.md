---
id: l11-not-knowing-out-loud
title: "Not knowing, out loud, without bluffing"
minutes: 26
covers:
  - recovering from a blank without bluffing
  - the difference between I do not know and I do not know, here is how I would find out
---

A friend asks for directions to a street you have never heard of. You could wave and say "that way, I think." Or: "I don't know that street, but the main road is two blocks north, and there's a map at the bus stop." The first sounds helpful and might send them into a swamp. The second admits a gap and still gets them somewhere.

In a thirty-minute technical screen you will be asked something you do not know. That is not a failure of preparation. GNC is wide, and the interviewer is looking for your edge; if you knew everything, they had not probed far enough.

So the question is what you do in the four seconds after it happens. The right behavior is simple to state and hard to perform, because pressure pushes you toward the one response that does real damage: **bluffing** — talking as if you know something you do not.

Why is a bluff so costly? The people interviewing you are **[[domain experts|who-is-listening]]**, and they detect it immediately. And the cost is not limited to that question. A confident false statement shows how you behave at the edge of your knowledge, and that evidence applies backward to every confident thing you said earlier. A small gap becomes a credibility problem across the whole call. No version of this trade comes out in your favor.

## Four kinds of not knowing

They feel the same from the inside but need different responses, so first work out which one you are in — about two seconds, with practice.

**A vocabulary gap.** You know the thing; you do not know the word they used. Common, since different corners of engineering name ideas differently. The right response is to ask: *"I may know this under a different name — can you say a bit more about what you mean?"* That is a clarifying question, not giving up.

**An adjacent gap.** You have not done this exact thing, but you know the thing next to it and why this one exists. For a prepared candidate this is the most common case, and it has a strong answer: the three-part recovery below.

**A method-available gap.** You do not know the answer, but you know concretely how you would get it: a measurement, a calculation, a specific source. This is the *"here is how I would find out"* case, and unlike a bare "I don't know", the interviewer can judge it.

**A hard blank.** Nothing nearby, no route. Rare if you have prepared, but it happens. Say so plainly and briefly, without drama, and move on — a long unraveling costs far more airtime than the question was worth.

## The three-part recovery

For the adjacent gap — most of them — the structure is:

1. **State the boundary.** "I have not implemented one."
2. **Name the nearest thing you do know, and why the thing you were asked about exists.** This part carries the weight. Knowing *why* a technique exists means knowing what the older alternative fails at.
3. **Describe how you would work it out or close the gap.** Specific, not general.

The classic example, used by this module's flashcards, is the unscented Kalman filter. A **Kalman filter** blends a prediction with noisy measurements into a best estimate. The **extended Kalman filter**, or **EKF** (said "E-K-F"), handles curved, nonlinear problems by **[[linearizing|straight-line-guess]]** them — approximating them with straight lines, using the **[[Jacobians|jacobian-slopes]]** of the model. That is a first-order approximation, and it loses accuracy when the curve bends a lot across the spread of the state uncertainty. The **unscented Kalman filter**, or **UKF** (said "U-K-F"), never linearizes. It picks a fixed set of **[[sigma points|sigma-points]]** that reproduce the current mean and covariance, pushes each through the exact nonlinear function, and rebuilds the mean and covariance from where they land. For a state of $n$ numbers the standard symmetric set is $2n+1$ points — 13 for a six-number orbit state.

Put those into the three parts and you have the model answer in the key below; the full spoken version is the first exchange later on. It is not a confession. It carries more checkable content than most correct answers: how the EKF works, where it degrades, how the alternative works, a concrete count, and an experiment to tell them apart.

::: key
Recovering from a blank has three parts: say what you do know, name the nearest thing you do know, and describe how you would work the rest out. "I have not implemented a UKF, but I know why it exists — the EKF linearizes and loses accuracy for strongly nonlinear measurements, and the UKF propagates sigma points instead." That is a strong answer, not a failure. What you never do is bluff — interviewers in this field are domain experts, they detect it immediately, and it converts a small gap into a credibility problem that changes how they weigh everything else you said.
:::

::: key
"I do not know" and "I do not know, and here is how I would find out" are different answers. The second is a claim about method, and it is assessable. To count, it must be specific: a measurement you would take, a calculation you would run, a named reference or a named person. "I would look it up" is not a method.
:::

## What makes "how I would find out" count

Said vaguely, this half falls apart. Compare:

- *"I would look into it."* or *"I would read up on it."* — Not a method. Every candidate would; it says nothing about how you work.
- *"I would characterize the gyro with an **[[Allan variance|allan-plot]]** plot, read the angle random walk off the slope of the short-averaging region, and set the process noise from that rather than by hand."* — A method. It names the measurement, the quantity, and where the number comes from.
- *"Curtis covers the closely-spaced-observations case, and I would check my implementation against a worked example there before trusting it on real data."* — A method: a named source and, more importantly, a check.

The pattern: a real method has a **verification step**. Saying where you would find the answer is half of it; saying how you would know it was right turns reading into engineering.

::: warning Do not let the blank spread
The second failure is worse than the first, and avoidable. A candidate handles a gap acceptably, then spends the next two answers rattled — hedging things they actually know, apologizing, searching the interviewer's tone for a verdict. One gap in a thirty-minute call is one data point among five. Three hedged answers is a pattern, and patterns get written in the **[[interviewer's notes|interview-notes]]**. Close the topic on purpose, with a sentence — "that one is outside what I have done; shall we move on?" — and reset.
:::

## Two special cases

**Retrieval failure, not a knowledge gap.** Sometimes you know the thing and cannot pull it out of memory. Do not search harder; rebuild it from a definition. Can't recall the **damping ratio** $\zeta$ (read "zeta") of a loop? Write the **characteristic equation** — the polynomial whose roots set the loop's behavior — and match it to the standard second-order form $s^2 + 2\zeta\omega_n s + \omega_n^2$, with $\omega_n$ (read "omega n") the natural frequency. Narrate it: *"I have lost the expression, let me rebuild it from the characteristic equation."* That is respectable, and it shows you could rebuild the result at a desk.

::: example Rebuilding instead of remembering
The characteristic equation is $s^2 + 4s + 16 = 0$. Match it term by term with $s^2 + 2\zeta\omega_n s + \omega_n^2$.

- Constant terms: $\omega_n^2 = 16$, so $\omega_n = 4\,\mathrm{rad/s}$.
- Middle terms: $2\zeta\omega_n = 4$, so $\zeta = 4/(2 \times 4) = 0.5$.

Sanity check: between 0 and 1 means a loop that overshoots a little and settles, and 0.5 is a common design value.
:::

**A belief with low confidence.** Neither knowing nor not knowing. State the belief, *and* your confidence, *and* the reason for your doubt: *"I believe it is second-order in the sample period, but I am not certain — I am half-remembering a result that assumed a **[[zero-order hold|zero-order-hold]]**, and I am not sure this one does."* Not a bluff, because the uncertainty is on the record; not a blank, because it makes a real claim. And the reason for the doubt is itself content: it shows you know where the result's assumptions live.

## Three exchanges

::: example The bluff, and what it costs
**Interviewer:** Have you worked with an unscented Kalman filter?

**Bluffed answer:** "Yes, some — I have used unscented filters for nonlinear estimation problems. They are generally more accurate than an EKF because they handle nonlinearity better, and the unscented transform gives you a better approximation of the distribution."

**Interviewer:** "Sure. How do you choose the sigma point weights?"

**Candidate:** "Uh — I think they are chosen to match the distribution. It has been a while, to be honest."

**Interviewer:** "No problem. Earlier you mentioned tuning the process noise on your attitude filter — how did you set it?"

**What has just happened:** the candidate may think they got away with it. They did not. The weights question was a check, and the next question re-examines an earlier answer once taken at face value. Everything is now weighed differently, because the interviewer has learned what this candidate's confident voice means.

**The same question, answered honestly:** "No, I have not built one — everything I have done has been EKF. I do know why they exist. The EKF linearizes the dynamics and measurement model about the current estimate and pushes the covariance through those Jacobians — a first-order approximation. When the nonlinearity is significant over the spread of the state uncertainty, the reported covariance stops matching the actual error and the filter becomes overconfident. The unscented filter avoids linearizing: a fixed set of sigma points matching the current mean and covariance — the standard symmetric set is $2n+1$ points for an $n$-dimensional state — each pushed through the exact nonlinear function, and the mean and covariance rebuilt from the results. No Jacobians, which also helps when the model is hard to differentiate. To bring one up I would run it head to head against my EKF on a **[[bearings-only|bearings-only-geometry]]** geometry, where I would expect the EKF to report a covariance smaller than its actual error, and use that as the acceptance test."

**What makes the difference:** the honest answer states a boundary in its first four words, then delivers *more* real content than the bluff. A follow-up about weights would now land on someone who already said they have not built one, so it becomes a discussion of what they would need to learn, not a test they are failing. Admitting the gap turns later questions from exposures into discussions.
:::

::: example A vocabulary gap that looks like a knowledge gap
**Interviewer:** In your inertial navigation work, how did you handle **[[coning and sculling|coning-sculling]]**?

**Weak answer:** "I do not think we had to deal with that. Our application was not very dynamic, so I do not think those effects came up."

**Strong answer:** "I want to make sure I am answering the right question — I may know this under different language. Do you mean the high-frequency rectification errors in the **[[strapdown|strapdown-imu]]** integration, or something else?"

**Interviewer:** "That is what I mean, yes."

**Candidate:** "Then I know the underlying problem, though I should say up front that I did not implement the corrections myself — the inertial solution I worked with came from a vendor library.

The strapdown update integrates body-frame quantities over each sample interval, and finite rotations do not commute. If the body vibrates about two axes with the right phase relationship, a naive integration of angular rate builds an attitude error that does not average out over a cycle — it rectifies. That is coning. The correction is an extra term in the attitude update, built from the cross product of the angular increments within the interval. Sculling is the same idea in the velocity channel: correlated angular vibration and specific-force vibration produce a velocity error that also rectifies, and the correction is a matching cross-product term between the velocity and angular increments.

To claim real experience I would implement both corrections and verify them — drive the algorithm with a synthetic profile whose exact answer is known, a pure conical motion, and confirm the error disappears with the correction on. That would also show at what vibration level and sample rate the corrections start to matter."

**What makes the difference:** the weak answer treats an unfamiliar phrase as an unfamiliar subject and closes it with a guess — itself a small bluff, since the candidate never assessed the vibration. The strong answer checks whether the gap is real before conceding it. Here the candidate knew the effect but not its names — normal when you arrive from another direction. It states the boundary honestly, explains both effects, and closes with a verification plan against a known exact answer — the most convincing thing you can say about a technique you have not built.
:::

::: example A genuine blank, handled in twenty seconds
**Interviewer:** What is your view on using a **[[Lyapunov|lyapunov-bowl]]** argument to prove stability for a nonlinear attitude control law?

**Weak answer:** "So — Lyapunov stability, right, that is about finding a function that decreases along trajectories. I think for attitude control you would... I mean, you could use the energy, maybe? Sorry, I am trying to remember how this goes. I know it is related to how you show the equilibrium is stable. Is it about the eigenvalues? Sorry — I have not thought about this in a while, I feel like I should know it."

**Strong answer:** "That is outside what I have actually done. What I know is the shape of it: you build a scalar function that is positive definite about the equilibrium and show its derivative along the closed-loop trajectories is negative. That gives you stability without linearizing — which is the point, since a linearized argument only tells you about a small neighborhood. I have not built one for an attitude law, and I do not know the standard candidate functions for that problem.

If I needed it, I would work from a reference treatment of nonlinear attitude control, implement the candidate law, and check numerically over a wide range of starting attitudes and rates. A proof that disagrees with the simulation means one of them is wrong, and I would want to know which before flight.

Shall we carry on with this one or move to something else?"

**What makes the difference:** the weak answer takes forty-five seconds to say nothing, apologizes three times, and shows both the gap and a poor response to it. The strong answer takes about twenty seconds: the boundary first, the real partial knowledge — the structure of a Lyapunov argument and *why* you would want it over a linearized one — then a real route with a verification step. The closing question hands control back so the blank cannot spread.
:::

## Check yourself

::: check
Why is the cost of a bluff not confined to the question it was given on?
:::

::: answer
Because it is evidence about the candidate, not the topic. Domain-expert interviewers detect it quickly and learn that this candidate's confident delivery does not reliably mean knowledge. That applies backward to everything said earlier and forward to everything after, so a gap that would have cost almost nothing to admit becomes a discount on the whole conversation.
:::

::: check
Name the four kinds of not knowing and give the correct first move for each.
:::

::: answer
Vocabulary gap: ask what they mean before conceding — you may know it by another name. Adjacent gap: the three-part recovery — boundary, nearest known thing and why the technique exists, how you would close the gap. Method-available gap: give the method, including how you would verify the result. Hard blank: say so plainly and briefly and move on, since a long unraveling costs more airtime than the question was worth.
:::

::: check
What separates a real "here is how I would find out" from a vague one? Give an example of each on the same topic.
:::

::: answer
A real one names a specific action and a verification step. Vague: "I would read up on how to set the process noise." Real: "I would characterize the gyro with an Allan variance plot, read the angle random walk off the slope of the short-averaging region, set the process noise from that, and then confirm the filter is consistent by checking the normalized innovations against their expected distribution." The second names a measurement, a quantity, the number's source, and a test that would catch it being wrong — engineering, not intention.
:::

::: check
Distinguish a retrieval failure from a knowledge gap, and say why the right response differs.
:::

::: answer
In a retrieval failure the material is there but will not come out under pressure; in a knowledge gap it is not there. A retrieval failure is fixable in about fifteen seconds by rebuilding from a definition — for example, the damping ratio from matching the characteristic equation to $s^2 + 2\zeta\omega_n s + \omega_n^2$ — and narrating the rebuild is good evidence that you could reproduce it at a desk. A knowledge gap cannot be rebuilt in the moment, so the response is the three-part recovery, not a longer search.
:::

::: check
An interviewer asks something you half-remember and are genuinely unsure about. What is the right form of answer, and why is it neither a bluff nor a blank?
:::

::: answer
State the belief, your confidence, and why you doubt it: "I believe it is second-order in the sample period, but I am not certain, because I am half-remembering a result that assumed a zero-order hold and I am not sure that applies here." Not a bluff: the uncertainty is on the record, so the interviewer can weigh the claim. Not a blank: it makes a real claim they can respond to. And knowing which assumption a half-remembered result depends on shows more understanding than the result alone.
:::

::: check
A candidate handles one gap well, then hedges the next two answers on material they know solidly. Why is the second failure more damaging than the first?
:::

::: answer
One gap in a thirty-minute call is a single data point about the breadth of someone's experience — every candidate has gaps, and every interviewer expects to find one. Three hedged answers is a pattern, and it is about composure and self-assessment rather than knowledge: it suggests a setback degrades everything after it. That worries an employer far more in someone who will defend designs in reviews. The fix: close the topic with a sentence that hands control back, then treat the next question as fresh.
:::

## Summary

| Situation | First move | What it demonstrates |
| --- | --- | --- |
| Vocabulary gap | Ask what they mean before conceding | That you check before assuming |
| Adjacent gap | Boundary, nearest known thing and why the technique exists, route to close it | Where your edge is, and that you know what lies beyond it |
| Method available | The measurement or calculation, plus how you would verify it | How you actually work |
| Hard blank | Say it plainly, briefly, then hand control back | Composure, and respect for the clock |
| Retrieval failure | Rebuild from a definition, narrating | That you do not depend on memorized results |
| Low-confidence belief | Claim, confidence, and the reason for the doubt | That you know where the assumptions live |
| Any of them | Never bluff | — |

The next and final lesson closes out the two calls: the questions you ask the engineer at the end, what they buy you, and what to do in the days and weeks afterward.

::: context who-is-listening Who is on the other end of the call
A technical phone screen is usually run by an engineer on the team you would join, or by the hiring manager. These are people who design, test and fly GNC systems for a living. They have sat through design reviews where a confident-sounding wrong answer was caught, and catching it is part of their day job. A bluff that might pass with a general audience rarely survives a specialist who knows exactly which follow-up question exposes it.
:::

::: context straight-line-guess Why a straight-line guess fails on a curve
To linearize a function is to replace it, near one point, with the straight line that touches it there. Near that point the line is excellent. Farther away the curve bends and the line does not. If your uncertainty is spread wide, part of it lives out where the line is wrong — and the EKF's error estimate goes wrong with it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="150" x2="30" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 40 140 Q 150 140 250 80 Q 300 50 335 15" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="90" y1="145.5" x2="330" y2="62.5" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="168.4" cy="118.4" r="5" fill="#1f2a44"/>
  <text x="178" y="142" font-size="11" fill="#1f2a44">current estimate</text>
  <text x="240" y="114" font-size="11" fill="#b4232c">straight-line guess</text>
  <text x="190" y="84" font-size="11" fill="#1d6fd1">true curve</text>
  <text x="40" y="24" font-size="11" fill="#6c7a93">close by: nearly the same</text>
  <text x="40" y="40" font-size="11" fill="#6c7a93">far away: they split</text>
</svg>
```
:::

::: context jacobian-slopes A table of slopes
A **Jacobian** (said "juh-KOH-bee-an", after the mathematician Carl Jacobi) is the table of all the slopes of a function with several inputs and outputs: how much each output changes when you nudge each input a little. It is the many-variable version of the slope of a line. The EKF needs these slopes for both its motion model and its measurement model, and for a messy model, working them out correctly is real work.
:::

::: context sigma-points Sampling instead of slope-taking
Picture the uncertainty in a two-number state as an oval. The UKF places one point at the center and two on each side along each of the oval's main directions: $2n + 1 = 2 \times 2 + 1 = 5$ points. Each point goes through the true, curved function; the new mean and covariance are rebuilt from where they land.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="75" rx="110" ry="50" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="75" x2="260" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="39" x2="180" y2="111" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g fill="#b4232c">
    <circle cx="180" cy="75" r="6"/>
    <circle cx="100" cy="75" r="5"/><circle cx="260" cy="75" r="5"/>
    <circle cx="180" cy="39" r="5"/><circle cx="180" cy="111" r="5"/>
  </g>
  <text x="192" y="70" font-size="11" fill="#1f2a44">mean</text>
  <text x="300" y="80" font-size="12" fill="#1f2a44">n = 2</text>
  <text x="290" y="100" font-size="12" fill="#b4232c">5 points</text>
</svg>
```
:::

::: context allan-plot Reading noise off a plot
Leave a gyro sitting still, record it for hours, then average the data over windows of different lengths and see how much the averages wander. That wander is the **Allan variance**; its square root, plotted on log-log axes, is the **Allan deviation** plot, named after the physicist David Allan, who introduced the method in 1966 to study atomic clocks. Different noise types show up as different slopes. The white-noise part of the gyro — **angle random walk** — is the line sloping down at $-\tfrac{1}{2}$ on the short-averaging side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 50 30 L 190 100 Q 230 118 270 100 L 330 70" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="125" y="40" font-size="11" fill="#b4232c">slope −1/2:</text>
  <text x="125" y="54" font-size="11" fill="#b4232c">angle random walk</text>
  <text x="230" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">bias instability (the floor)</text>
  <text x="190" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">averaging time (log scale)</text>
  <text x="46" y="20" font-size="11" fill="#1f2a44">Allan deviation (log)</text>
</svg>
```
:::

::: context interview-notes What gets written down
After a screen, the interviewer usually writes up feedback — often in a structured form or scorecard in the company's hiring system — and that write-up is what the hiring team reads when deciding who goes forward. The interviewer remembers the call; the team only sees the notes. So a single gap tends to become one line, while a run of shaky answers becomes the headline.
:::

::: context zero-order-hold Holding the last value
A computer controller works in steps: it reads a sensor, computes a command, sends it, and waits for the next tick. A **zero-order hold** keeps each command flat until the next one arrives, so the output looks like a staircase. Many textbook results about digital control assume exactly this, so knowing whether it applies is a real question.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 30 90 Q 110 20 190 50 T 340 40" fill="none" stroke="#8fb8f0" stroke-width="3"/>
  <path d="M 30 90 H 80 V 56 H 130 V 41.6 H 180 V 46.6 H 230 V 60.7 H 280 V 61.2 H 330 V 45.3 H 340" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="200" y="100" font-size="11" fill="#1d6fd1">held command (staircase)</text>
  <text x="210" y="24" font-size="11" fill="#6c7a93">smooth ideal</text>
  <text x="30" y="126" font-size="11" fill="#1f2a44">one step per sample period</text>
</svg>
```
:::

::: context bearings-only-geometry Knowing the direction, not the distance
A **bearing** is a direction only — like a submarine's passive sonar hearing a ship to the northeast without knowing how far away it is. Turning bearings into a position is strongly nonlinear, especially when the angles change slowly. That is why bearings-only tracking is the textbook place where an EKF grows overconfident and a UKF or other method is worth testing against it.
:::

::: context coning-sculling Why the order of turns matters
Hold a book flat. Turn it 90° about a side-to-side axis, then 90° about a front-to-back axis. Start again and do the same two turns in the other order: the book ends up facing a different way. Rotations do not **commute** — order matters. When an instrument vibrates in two axes at once, that order effect adds up a little each cycle instead of canceling. In attitude it is called **coning**; the matching effect in velocity is **sculling**.
:::

::: context strapdown-imu Strapped to the vehicle
Early inertial systems kept their gyros and accelerometers on a gimballed platform that stayed pointed in a fixed direction while the vehicle turned around it. A **strapdown** system bolts the sensors straight to the vehicle, and a computer does the bookkeeping of the rotation instead. Strapdown is cheaper and tougher, and nearly all modern systems use it — which is why getting the rotation math right, coning included, matters.
:::

::: context lyapunov-bowl A marble in a bowl
Aleksandr Lyapunov was a Russian mathematician whose 1892 work on stability is still the foundation. The picture: a marble in a bowl. Define a quantity like the marble's height — positive everywhere except at the bottom, where it is zero. If you can show that quantity always goes down as the marble moves, the marble must end up at the bottom. You never solved for its path; you only showed "downhill always". That is a Lyapunov function.
:::
