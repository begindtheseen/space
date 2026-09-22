---
id: l11-not-knowing-out-loud
title: "Not knowing, out loud, without bluffing"
minutes: 26
covers:
  - recovering from a blank without bluffing
  - the difference between I do not know and I do not know, here is how I would find out
---

At some point in a thirty-minute technical screen you will be asked something you do not know. This is not a sign that the preparation failed. GNC is a wide field, the interviewer picks from all of it, and the alternative — a screen in which you knew everything — would mean the interviewer had not probed far enough to find your edge, which is the one thing they are actually trying to locate.

So the question is not how to avoid it. The question is what you do in the four seconds after it happens, and this is one of the few places in an interview where the correct behaviour is both simple to state and genuinely hard to perform, because the pressure pushes you toward the one response that does real damage.

That response is bluffing, and the reason it is so costly is worth being precise about. Interviewers in this field are domain experts, they detect it immediately, and the cost is not confined to the question you bluffed on. A candidate who states something false with confidence has given the interviewer evidence about how the candidate behaves at the edge of their knowledge — and that evidence applies retroactively to every confident-sounding thing they said earlier in the call. A small gap becomes a credibility problem across the whole conversation. There is no version of this trade that comes out in your favour.

## Four kinds of not knowing

They look identical from the inside and they have different correct responses, so the first move is to work out which one you are in. This takes about two seconds once you have the taxonomy.

**A vocabulary gap.** You know the thing; you do not know the word they used for it. This is extremely common across sub-disciplines, and the correct response is to ask: *"I may know this under a different name — can you say a bit more about what you mean?"* That is not a concession, it is a clarifying question, and once the term is unpacked you may well have a complete answer.

**An adjacent gap.** You have not done this specific thing, but you know the neighbouring thing and you know why the specific thing exists. This is the most common case for a well-prepared candidate, and it has a strong answer — the three-part recovery below.

**A method-available gap.** You do not know the answer and you do know, concretely, how you would obtain it: a measurement you would take, a calculation you would run, a specific reference you would go to. This is the *"here is how I would find out"* case, and it is assessable in a way a bare admission is not.

**A hard blank.** You do not know, the neighbours are dark too, and you have no route. Rare if you have prepared, and it does happen. Say so plainly, briefly, and without theatre, and move on quickly — the speed matters, because a long unravelling costs far more airtime than the question was worth.

::: key
Recovering from a blank has three parts: say what you do know, name the nearest thing you do know, and describe how you would work the rest out. What you never do is bluff — interviewers in this field are domain experts, they detect it immediately, and it converts a small gap into a credibility problem that changes how they weigh everything else you said.
:::

## The three-part recovery

For the adjacent-gap case, which is most of them, the structure is:

1. **State the boundary.** "I have not implemented one."
2. **Name the nearest thing you do know, and why the thing you were asked about exists.** This is the part that carries the weight, because knowing *why* a technique exists means knowing what the alternative fails at.
3. **Describe how you would work it out or close the gap.** Specific, not general.

The canonical example, and the one this module's own flashcards use, is the unscented filter:

> "I have not implemented a UKF, but I know why it exists. The extended Kalman filter linearises the dynamics and the measurement model about the current estimate — it propagates the covariance through the Jacobians of those functions — so it is a first-order approximation, and it loses accuracy when the nonlinearity is significant across the spread of the state uncertainty. The unscented filter does not linearise at all: it picks a deterministic set of sigma points that reproduce the current mean and covariance, pushes each one through the exact nonlinear function, and recomputes the mean and covariance from the transformed points. For a state of dimension $n$ the standard symmetric set is $2n+1$ points. It needs no Jacobians, which also matters when the model is awkward to differentiate. If I had to build one I would start by testing it against my EKF on a case with a strongly nonlinear measurement — a bearings-only geometry, say — where I would expect the difference to show up as a covariance the EKF reports as smaller than its actual error."

That is a strong answer. It is not a confession. Read it again and notice that it contains more assessable technical content than most correct answers do: the mechanism of the EKF, the precise condition under which it degrades, the mechanism of the alternative, a concrete count, and a designed experiment to distinguish them.

::: key
"I do not know" and "I do not know, and here is how I would find out" are different answers. The second is a claim about method, and it is assessable. To count, it must be specific: a measurement you would take, a calculation you would run, a named reference or a named person. "I would look it up" is not a method.
:::

## What makes the "how I would find out" half count

The second half is the part candidates say vaguely, and vagueness undoes it. Compare:

- *"I would look into it."* — Not a method. Says nothing about how you work.
- *"I would read up on it."* — Still nothing. Every candidate would.
- *"I would characterise the gyro with an Allan variance plot and read the angle random walk off the slope of the short-averaging region, then set the process noise from that rather than by hand."* — A method. It names the measurement, the quantity, and where the number comes from.
- *"Curtis covers the closely-spaced-observations case, and I would check my implementation against a worked example in it before trusting it on real data."* — A method. It names the source and, more importantly, names how the result would be verified.

The pattern is that a real method has a **verification step** in it. Saying where you would find the answer is half of it; saying how you would know the answer was right is what makes it engineering rather than reading.

::: warning Do not let the blank spread
The second failure is worse than the first and it is entirely avoidable: a candidate hits a gap, handles it acceptably, and then spends the next two answers rattled — hedging things they actually know, apologising, searching the interviewer's tone for a verdict. One gap in a thirty-minute call is one data point among five. Three hedged answers afterwards is a pattern, and patterns are what get written in the notes. Close the topic deliberately, with a sentence — "that one is outside what I have done; shall we move on?" — and reset.
:::

## Two special cases

**Retrieval failure, not a knowledge gap.** Sometimes you know the thing and cannot produce it. The fix is not to search harder for the memory; it is to rebuild from a definition. If you cannot recall the expression for the damping ratio of a loop, write the characteristic equation and compare it with the standard second-order form — you will have it in fifteen seconds. Say what you are doing while you do it: *"I have lost the expression, let me rebuild it from the characteristic equation."* That is an entirely respectable thing to say, and unlike a recalled formula it demonstrates you could reconstruct it at a desk.

**A belief with low confidence.** This is neither knowing nor not knowing, and it has its own correct form: state the belief *and* the confidence *and* the reason for the doubt. *"I believe it is second-order in the sample period, but I am not certain — I would want to check, because I am half-remembering a result that assumed a zero-order hold and I am not sure this one does."* That is an honest, useful answer. It is not a bluff, because the uncertainty is on the record; it is not a blank, because it contains a real claim; and the reason for the doubt is itself technical content that shows you know where the result's assumptions live.

## Three exchanges

::: example The bluff, and what it costs
**Interviewer:** Have you worked with an unscented Kalman filter?

**Bluffed answer:** "Yes, some — I have used unscented filters for nonlinear estimation problems. They are generally more accurate than an EKF because they handle nonlinearity better, and the unscented transform gives you a better approximation of the distribution."

**Interviewer:** "Sure. How do you choose the sigma point weights?"

**Candidate:** "Uh — I think they are chosen so that they match the distribution. It has been a while since I looked at the details, to be honest."

**Interviewer:** "No problem. Earlier you mentioned tuning the process noise on your attitude filter — how did you set it?"

**What has just happened:** the interviewer has moved on, and the candidate may think they got away with it. They did not. The question about weights was a check, it returned a clear result, and the interviewer's next question is a re-examination of an earlier answer that was previously taken at face value. Everything the candidate said before is now being weighed differently, because the interviewer has a data point about what this candidate's confident voice means.

**The same question, answered honestly:** "No, I have not built one — everything I have done has been EKF. I do know why they exist, though. The EKF linearises the dynamics and the measurement model about the current estimate and propagates the covariance through those Jacobians, so it is a first-order approximation; when the nonlinearity is significant over the spread of the state uncertainty, the reported covariance stops matching the actual error and the filter becomes overconfident. The unscented filter avoids the linearisation entirely: it picks a deterministic set of sigma points matching the current mean and covariance — the standard symmetric set is $2n+1$ points for an $n$-dimensional state — pushes each through the exact nonlinear function, and reconstructs the mean and covariance from the results. No Jacobians, which also helps when the model is hard to differentiate. If I were bringing one up I would run it head to head against my EKF on a bearings-only geometry, where I would expect the EKF to report a covariance smaller than its actual error, and use that as the acceptance test."

**What makes the difference:** the honest answer volunteers a boundary in its first four words and then delivers more real content than the bluff did, because it is drawing on things the candidate actually knows rather than performing familiarity. The follow-up about sigma point weights, had it come, would have landed on a candidate who has already said they have not implemented one — so it becomes a conversation about what they would need to learn, rather than a test they are failing. That is the whole trade: admitting the gap converts every subsequent question on the topic from an exposure into a discussion.
:::

::: example A vocabulary gap that looks like a knowledge gap
**Interviewer:** In your inertial navigation work, how did you handle coning and sculling?

**Weak answer:** "I do not think we had to deal with that. Our application was not very dynamic, so I do not think those effects came up."

**Strong answer:** "I want to make sure I am answering the right question — I may know this under different language. Do you mean the high-frequency rectification errors in the strapdown integration, or something else?"

**Interviewer:** "That is what I mean, yes."

**Candidate:** "Then I know the underlying problem, though I should say up front that I did not implement the corrections myself — the inertial solution I worked with came from a vendor library.

The issue is that the strapdown update integrates body-frame quantities over a sample interval, and finite rotations do not commute. If the body is vibrating in a way that produces rotation about two axes with the right phase relationship, a naive integration of angular rate accumulates an attitude error that does not average out over a cycle — it rectifies. That is coning, and the correction is an extra term in the attitude update built from the cross product of the angular increments within the interval. Sculling is the same idea in the velocity channel: correlated angular vibration and specific-force vibration produce a velocity error that also rectifies rather than averaging out, and the correction is an analogous cross-product term between the velocity and angular increments.

What I would need to do to claim real experience here is implement the coning and sculling corrections and then verify them properly, which for this kind of thing means driving the algorithm with a synthetic profile whose exact answer is known analytically — a pure conical motion — and confirming the error goes away when the correction is on. That would also tell me at what vibration level and sample rate the corrections start to matter for a given application."

**What makes the difference:** the weak answer treats an unfamiliar phrase as an unfamiliar subject and closes the topic with a guess — and the guess ("our application was not very dynamic") is a claim about vibration environments the candidate has not actually assessed, which is a small bluff in its own right.

The strong answer does something you can do far more often than you think: it checks whether the gap is real before conceding it. In this case it was not — the candidate knew the phenomenon and not the standard names for it, which is entirely normal when you have come to the subject from a different direction. It then states the boundary honestly (a vendor library, not their own implementation), gives the physical mechanism for both effects, and closes with a verification plan built around a case with a known analytic answer, which is the most convincing thing anyone can say about a technique they have not yet implemented.
:::

::: example A genuine blank, handled in twenty seconds
**Interviewer:** What is your view on using a Lyapunov argument to prove stability for a nonlinear attitude control law?

**Weak answer:** "So — Lyapunov stability, right, that is about finding a function that decreases along trajectories. I think for attitude control you would... I mean, you could use the energy, maybe? Sorry, I am trying to remember how this goes. I know it is related to how you show the equilibrium is stable. Is it about the eigenvalues? Sorry — I have not thought about this in a while, I feel like I should know it."

**Strong answer:** "That is outside what I have actually done. What I know is the shape of it: you construct a scalar function that is positive definite about the equilibrium and show its derivative along the closed-loop trajectories is negative, which gives you stability without linearising — which is the point, since a linearised argument only tells you about a neighbourhood. I have not built one for an attitude law and I do not know the standard candidate functions for that problem.

If I needed it, the route would be to work from a reference treatment of nonlinear attitude control, implement the candidate law, and then do what I would do anyway: check numerically over a wide range of initial attitudes and rates, because a proof that does not match the simulation means one of the two is wrong and I would want to know which before flight.

Shall we carry on with this one or move to something else?"

**What makes the difference:** the weak answer takes forty-five seconds to say nothing, apologises three times, and finishes in a worse position than a plain admission would have — the candidate has now demonstrated both the gap and a poor response to it, and the visible distress makes it more likely that the next answer will be hedged too.

The strong answer takes about twenty seconds. It states the boundary in the first sentence, then gives the genuine partial knowledge — the structure of a Lyapunov argument and, crucially, *why* one would want it rather than a linearised argument — before marking clearly where the knowledge stops. The route it offers is a real one with a verification step. And the closing question is the move that keeps the blank from spreading: it hands control back to the interviewer, closes the topic cleanly, and makes it easy for both of you to move on without the moment hanging over the rest of the call.
:::

## Check yourself

::: check
Why is the cost of a bluff not confined to the question it was given on?
:::

::: answer
Because it is evidence about the candidate rather than about the topic. Interviewers in this field are domain experts and detect a bluff quickly, and what they learn is how this candidate behaves at the edge of their knowledge — specifically, that confident delivery does not reliably indicate actual knowledge. That inference applies retroactively to everything said earlier in the call and forward to everything said afterwards, so a single small gap that would have cost almost nothing to admit becomes a discount applied to the whole conversation. There is no version of the trade that favours the candidate.
:::

::: check
Name the four kinds of not knowing and give the correct first move for each.
:::

::: answer
A vocabulary gap: you know the thing under a different name, so ask the interviewer to say more about what they mean before conceding anything. An adjacent gap: you know the neighbouring material and why the thing asked about exists, so give the three-part recovery — boundary, nearest known thing and why the technique exists, then how you would close the gap. A method-available gap: you do not know the answer but know concretely how to obtain it, so give the method, including how you would verify the result. A hard blank: no route at all, so say it plainly and briefly and move on quickly, because the airtime a long unravelling costs is worth more than the question was.
:::

::: check
What distinguishes a real "here is how I would find out" from a vague one? Give an example of each on the same topic.
:::

::: answer
A real one names a specific action and includes a verification step — how you would know the answer was right, not just where you would look. Vague: "I would read up on how to set the process noise." Real: "I would characterise the gyro with an Allan variance plot, read the angle random walk off the slope of the short-averaging region, set the process noise from that, and then confirm the filter is consistent by checking the normalised innovations against their expected distribution." The second names a measurement, a quantity, where the number comes from, and a test that would catch it being wrong — which is why it is assessable as engineering rather than as intention.
:::

::: check
Distinguish a retrieval failure from a knowledge gap, and say why the correct response differs.
:::

::: answer
In a retrieval failure you know the material and cannot produce the specific result under pressure; in a knowledge gap the material is not there to retrieve. The responses differ because a retrieval failure is repairable in fifteen seconds by rebuilding from a definition rather than searching for the memory — for example, recovering the damping ratio expression by writing the characteristic equation and comparing it with the standard second-order form — and narrating that reconstruction is itself good evidence, since it shows you could reproduce the result at a desk without a reference. A knowledge gap cannot be rebuilt in the moment, so the correct response is the three-part recovery, not a longer search.
:::

::: check
An interviewer asks something you half-remember and are genuinely unsure about. What is the correct form of answer, and why is it neither a bluff nor a blank?
:::

::: answer
State the belief, state the confidence, and state the reason for the doubt: for instance, "I believe it is second-order in the sample period, but I am not certain, because I am half-remembering a result that assumed a zero-order hold and I am not sure the same assumption applies here." It is not a bluff because the uncertainty is explicit and on the record, so the interviewer can weigh the claim correctly. It is not a blank because it contains a real technical claim they can respond to. And the reason for the doubt is itself content: knowing which assumption a half-remembered result depends on demonstrates more understanding than the result alone would.
:::

::: check
A candidate handles one gap well and then hedges the next two answers on material they know solidly. Why is the second failure more damaging than the first?
:::

::: answer
Because of how the two are read. One gap in a thirty-minute call is a single data point about the breadth of someone's experience, which every candidate has and every interviewer expects to find. Three hedged answers is a pattern, and it is a pattern about composure and self-assessment rather than about knowledge — it suggests that a setback degrades subsequent performance, which is a much more general and more concerning signal for someone who will have to defend a design in a review. The remedy is to close the gap deliberately with a sentence that hands control back to the interviewer, then treat the next question as a fresh one.
:::

## Summary

| Situation | First move | What it demonstrates |
| --- | --- | --- |
| Vocabulary gap | Ask what they mean before conceding | That you check before assuming |
| Adjacent gap | Boundary, nearest known thing and why the technique exists, route to close it | Where your edge is, and that you know what lies beyond it |
| Method available | The measurement or calculation, plus how you would verify it | How you actually work |
| Hard blank | Say it plainly, briefly, then hand control back | Composure, and respect for the clock |
| Retrieval failure | Rebuild from a definition, narrating | That you do not depend on memorised results |
| Low-confidence belief | Claim, confidence, and the reason for the doubt | That you know where the assumptions live |
| Any of them | Never bluff | — |

The next and final lesson closes the two calls out: the questions you ask the engineer at the end, what they buy you, and what to do in the days and weeks afterwards.
