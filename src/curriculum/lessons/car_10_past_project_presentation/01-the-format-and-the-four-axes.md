---
id: l01-the-format-and-the-four-axes
title: "The format, and what the panel is actually scoring"
minutes: 18
covers:
  - "the format: submit roughly five topics, they choose one, 10 to 20 minutes to a panel of 5 to 10 engineers, then extensive Q and A"
  - "the four evaluation axes: technical depth, communication clarity, simplicity of design approach, and defending engineering decisions under direct questioning"
---

You submit roughly five project topics. SpaceX selects one of them. You present that one for ten to twenty minutes to a panel of five to ten engineers, and then the panel asks questions — extensively, and mostly about the parts of the project that never made it onto a slide. That is the format in a sentence, and almost every decision in this module follows from one clause of it: the panel chooses the topic, and you do not.

The second thing worth saying at the start is what the round is actually for, because it is not what the word "presentation" suggests. This round fails in a specific and recognisable way, and the failure is rarely nerves or slide design. It fails when a candidate describes what they built instead of defending why it is right. Description is the easy half — you lived it, and twenty minutes of it comes out without effort. Defence is the half that separates someone who did the work from someone who followed a tutorial, and it is the half the questioning exists to find.

That is also why the questions are not hostile even when they sound like it. They are diagnostic. Three of them recur, in some wording, on every project a GNC panel has ever heard: what did you assume, how do you know it works, and what would you do differently. Somebody who genuinely did the work answers each in a sentence, because each answer is a decision they already had to make. Somebody who did not has to invent one in front of eight engineers who have made that same decision themselves, on hardware, with consequences.

## The mechanics, and what each one costs you

::: key
The format: you submit roughly five project topics, SpaceX selects one, and you present for 10 to 20 minutes to a panel of 5 to 10 engineers, followed by extensive question and answer.
:::

Take the clauses one at a time, because each one has a preparation consequence that is easy to miss.

**Roughly five topics, and they select.** Your list's strength is set by its weakest entry, not its strongest, because the weakest can be the one chosen. Plan as though each of the five is equally likely to be picked. That is not a claim about how panels actually decide — a panel has reasons, and one of them is often curiosity about the entry they cannot already read on your portfolio site — but it is the only planning assumption that is safe, since you cannot see the reason from outside. The next lesson is entirely about building a list that survives that assumption.

**Ten to twenty minutes.** This is short. It is shorter than one engineering decision inside any of the five anchor projects from the portfolio module deserves. The instinct to cover everything is the single most reliable way to lose the room, and it is the wrong instinct anyway, because the material you leave out is not lost — it is what the questioning is for, and a question you answer is worth more than a slide you showed.

**A panel of five to ten engineers.** Not all of them work on your project's subject. In a room of eight, the estimation specialist will follow your multiplicative quaternion EKF without help; the propulsion or structures engineer two seats over will not, and their score counts the same. This is where the communication axis below is actually won and lost.

**Then extensive question and answer.** How long "extensive" runs, whether a written rubric sits behind the round, and who exactly is in the room are not things this curriculum can tell you — they vary, and the coordinator who schedules your day is the person to ask. What does not vary is the direction of the questioning: inward, toward the decisions, away from the description.

## Describing versus defending, on the same question

The clearest way to see the difference is to watch one question hit two candidates who built the identical project.

::: example "How do you know the filter works?" — anchor project C
**Weak.** "The attitude error stays under a tenth of a degree through the whole run, and the estimate tracks truth smoothly. I plotted error against time for a few cases and it looks clean."

**Strong.** "It is consistent, not only accurate. Over 300 independent runs the mean NEES was $6.067$ against a $95\%$ acceptance band of $[5.614,\,6.398]$ for a six-state filter, and mean NIS was $2.984$ against $[2.729,\,3.283]$ for a three-axis measurement. I also know the test has teeth, because I cut the filter's assumed process noise by a factor of one hundred and reran the same campaign: mean NEES went to $404.9$, about $63$ times the band's ceiling, and the filter was outside the band at every step."

**What separates them.** The weak answer reports how close the estimate was to truth. The strong one reports whether the filter's own claimed uncertainty is honest — which is the property every downstream consumer of that covariance actually depends on. Worse, the weak answer's evidence points the wrong way: an overconfident filter, one whose covariance has collapsed below its true error, produces the *smoothest*-looking plot of all, because a small reported covariance is a filter that trusts its own prediction and barely reacts to measurements. "It looks clean" is, to a panel that knows this, mild evidence against the claim. And the second half of the strong answer — the deliberately broken run — is the part that is hard to fake, because it requires having built a test capable of failing.
:::

Notice what the strong answer is not doing. It is not longer, it is not more technical vocabulary, and it does not go into the derivation of the chi-square band. It is the same length and it contains four numbers, each of which the candidate can be asked to justify. That is the texture of the whole round.

## The four axes, and what each is measured by

::: key
The four evaluation axes: technical depth; communication clarity; simplicity of the design approach; and whether you can defend your engineering decisions under direct questioning.
:::

These are not four names for "did well". Each is measured by something different, and each has a failure mode the others do not catch.

**Technical depth** is measured past the edge of your description, not inside it. The panel already assumes you can explain the slide you wrote. Depth is the third follow-up: not "what is NEES", but "why does NIS pass when NEES fails", which has a real answer — NIS is built from the innovation covariance, so it only sees the part of the state the measurement actually observes, while NEES compares the whole state error against the whole covariance and therefore catches a badly wrong covariance on a weakly observed component such as gyro bias. A candidate who has only read about the test stops one question earlier than that.

**Communication clarity** is measured by the least specialised person in the room, not the most. The practical test is whether someone who does not work in your subfield can restate your problem and your result after the talk. If your first slide needs a definition of lossless convexification before it means anything, you have spent your clearest thirty seconds on vocabulary.

**Simplicity of the design approach** is the axis candidates least expect to be graded on, and it runs opposite to the instinct to look ambitious. Complexity that was not required is a cost to build, test, review and fly. Choosing the simpler approach and being able to say precisely why is a stronger signal of judgement than building the elaborate one.

**Defending engineering decisions under direct questioning** is measured by whether a decision had a criterion. "I used a batch least-squares fit" is a choice. "I used a batch fit because the arc was fixed and processed after the fact, so I did not have to invent a process-noise model, which let the covariance come only from the measurement noise and the geometry — and that is what made it checkable against the empirical scatter" is a decision. The difference is a stated reason that could have come out the other way.

::: example The simplicity axis, on anchor project E
Two candidates present ADCS momentum management. Both are asked how they unload the wheels.

**The elaborate answer.** "I implemented a nonlinear model-predictive controller over a ten-step horizon that optimises the magnetorquer commands against the predicted field profile, with a terminal cost on stored momentum."

**The simple answer.** "A cross-product law. Command the dipole $\mathbf m = -\frac{k}{|\mathbf B|^2}\,\mathbf B\times\mathbf h$, where $\mathbf h$ is the stored wheel momentum. The delivered torque is then

$$\mathbf M = \mathbf m\times\mathbf B = -\frac{k}{|\mathbf B|^2}\big[(\mathbf B\times\mathbf h)\times\mathbf B\big] = -\frac{k}{|\mathbf B|^2}\big[\mathbf h|\mathbf B|^2 - \mathbf B(\mathbf B\cdot\mathbf h)\big] = -k\,\mathbf h_\perp$$

so it removes exactly the component of stored momentum perpendicular to the field, with one gain and no horizon. It cannot touch the component along $\mathbf B$ at all — the removable fraction is $\sin\theta$ for an angle $\theta$ between $\mathbf h$ and $\mathbf B$, which is why this works only because the field direction rotates under the vehicle over an orbit. I sized against that: torquer capability over one orbit is $2.82\times10^{-2}\,\mathrm{N\,m\,s}$ against a worst-case gravity-gradient accumulation of $2.40\times10^{-3}\,\mathrm{N\,m\,s}$, a margin of about $11.8$."

**What separates them.** The second answer is three lines of algebra with an exact result, one tuning parameter, a stated limitation, and a margin computed against the disturbance it exists to cover. The first may well be a working controller, but nothing in it says the extra machinery bought anything — and the panel's next question will be exactly that: what does the horizon buy you over the cross-product law, quantified. A candidate who chose the elaborate approach and can answer that is fine. A candidate who chose it because it was more impressive is now defending a cost they never justified.
:::

::: warning
Preparing the talk and not the questioning is the default failure of this round, and it feels like thorough preparation while you are doing it. The talk is the shorter, more visible artefact and it rehearses easily; the questioning is longer, unscripted, and carries the two axes — depth and defence — that the talk itself barely touches. If your preparation hours are going mostly into slides, they are going into the half of the round that was never the hard part.
:::

## Check yourself

::: check
Why does the panel selecting your topic, rather than you selecting it, change how you should evaluate a list of five candidate topics?
:::

::: answer
Because the list's effective strength becomes its weakest member rather than its strongest. If you chose, you would present your best topic and the other four would be irrelevant; because the panel chooses, a topic you cannot defend at depth is not a spare option held in reserve but a live liability that can be selected and then examined by five to ten engineers. The correct planning assumption is that each of the five is equally likely to be picked, not because panels necessarily choose at random, but because their reason is invisible from outside and any list built around predicting it is a guess.
:::

::: check
A candidate answers "how do you know your filter works" by describing a smooth error plot and a small RMS attitude error. Name the specific reason this evidence is weak, and what it should be replaced with.
:::

::: answer
RMS error measures only how far the estimate sat from truth; it says nothing about whether the covariance the filter reports matches that error, which is the claim everything downstream relies on. Worse, smoothness actively points the wrong way: an overconfident filter with a collapsed covariance barely reacts to measurements and therefore produces an unusually smooth-looking estimate, so "the plot looks clean" is weak evidence at best and mildly incriminating at worst. The replacement is a consistency result with numbers — mean NEES and NIS against their chi-square acceptance bands over a stated number of independent runs — together with evidence that the test can fail, such as a deliberately injected fault and the magnitude by which it was caught.
:::

::: check
Explain what the simplicity axis is actually measuring, and why an elaborate approach is not automatically a negative signal.
:::

::: answer
It measures whether the complexity you built was required by the problem, because unnecessary complexity is a real recurring cost to build, test, review and fly. It is not a preference for simple work: an elaborate approach is defensible whenever the candidate can state what the extra machinery buys, quantified against the simpler alternative it replaced. What fails the axis is complexity chosen for its own sake, which shows up immediately when the panel asks what the simpler option would have cost and the candidate has never computed it.
:::

::: check
In a room of eight engineers, several will not work in your project's subfield. What does this imply about the first minute of the talk?
:::

::: answer
The first minute has to make the problem and the result legible to the least specialised person present, because their score counts the same as the specialist's. That means stating the requirement in terms of a physical outcome rather than in the vocabulary of a technique — a landing accuracy, a pointing error, a margin — and deferring the specialised vocabulary until after the problem is established. A first slide that requires a definition before it means anything has spent the clearest thirty seconds of the talk on terminology rather than on the claim.
:::

::: check
Give the mechanism behind this statement: a filter can pass a NIS check while failing a NEES check. Why does this matter for the technical-depth axis specifically?
:::

::: answer
NIS is computed from the innovation and its covariance $\mathbf S_k = \mathbf H\mathbf P_k^-\mathbf H^{\mathsf T}+\mathbf R$, so it only exercises the directions in the state that the measurement actually observes. NEES compares the full state error against the full covariance, so it also sees components the measurement is only weakly sensitive to — a gyro bias state observed indirectly through the coupled dynamics, for instance — and can catch a badly wrong covariance there that leaves the innovation almost undisturbed. It matters for the depth axis because it is exactly the kind of question that sits one step past a rehearsed description: a candidate who has used both tests knows why they disagree, while one who has read about them stops at "both should be inside their bands."
:::

## Summary

| Element | Statement |
| --- | --- |
| Format | Roughly five topics submitted, SpaceX picks one, 10 to 20 minutes to 5 to 10 engineers, then extensive Q and A |
| Planning assumption | Every one of the five is equally likely to be chosen |
| The characteristic failure | Describing what you built instead of defending why it is right |
| Axis 1 — technical depth | Measured past the edge of your description, at the third follow-up |
| Axis 2 — communication clarity | Measured by the least specialised person in the room |
| Axis 3 — simplicity | Measured by whether the complexity you built was required, and whether you costed the simpler option |
| Axis 4 — defending decisions | Measured by whether a decision had a stated criterion that could have come out the other way |
| Not knowable in advance | How long the questioning runs, whether a rubric exists, who is in the room — ask the coordinator |

The next lesson builds the submission list itself: five topics, each defensible at depth, each showing a competency the other four do not.
