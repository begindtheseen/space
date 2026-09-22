---
id: l03-the-technical-phone-screen
title: "Stage 2: the technical phone screen"
minutes: 17
covers:
  - PLACEHOLDER
---

The second stage is the first one where an engineer is on the other end. It runs thirty minutes in the typical case, with some reports of sixty to ninety, and it is conducted by an engineer on the team you would join or by the hiring manager. There is no whiteboard, no shared document you can be sure of, and no screen between you and the question. You talk, and what you say is the entire artefact.

That constraint is the defining feature of the stage, and it is the reason a candidate who genuinely knows the material can still do badly here. Everything that a whiteboard normally does for you — holding the variables so you do not have to, letting a listener see your structure without you having to narrate it, giving you somewhere to put a half-formed idea while you work on the other half — you now have to do with sentences, in real time, while someone waits. It is a different skill from knowing control theory, and it is trainable.

This lesson is the map of the stage: its length, its participants, its two halves, and the reported GNC subject matter you can prepare for by name. The next module in this track is where the skill itself gets built — narrating a derivation without a whiteboard, asking clarifying questions before answering, and the difference between "I do not know" and "I do not know, and here is how I would find out."

## Length, and who runs it

Thirty minutes is the typical figure. Sixty to ninety has been reported, and both should be treated as normal rather than as a signal about you — a longer screen might mean a deeper conversation, or it might mean the interviewer had an hour free.

The interviewer is an engineer on the team or the hiring manager. That is worth pausing on. Unlike the recruiter screen, the person asking the questions does the work you are applying to do, which has two consequences. First, imprecision is visible: a hand-waved answer about frequency-domain behaviour sounds different to someone who spends their week looking at Bode plots than it does to a generalist. Second, the conversation can go deep the moment you give it somewhere to go, which is an opportunity rather than a hazard if the thing you led with is something you genuinely own.

::: key
The technical phone screen is 30 minutes typically, with some reports of 60 to 90, conducted by an engineer on the team or the hiring manager. It combines resume highlights with fundamental engineering questions tied to the role. Reported GNC topics include PD control, orbit determination and frequency-domain analysis.
:::

## The two halves

### Resume depth

Expect to be asked to go deeper on what you wrote. Not on all of it — there is not time — but on whatever the interviewer picks, which is usually whatever looks most relevant to the requisition, and which is therefore usually the thing you most want to be asked about.

The standard to hold yourself to is simple to state: every line on your resume is a line you can be taken down three levels on. If a bullet says you validated a 6-DOF simulation against analytic cases, you should be ready for what the analytic cases were, why those and not others, what tolerance you held them to, and what you did when one of them did not close. The portfolio module of this track built projects to survive exactly this kind of questioning, and the resume module wrote bullets that invite it. This stage is where that investment is collected.

::: warning A line you cannot defend is worse than no line
An unsupportable bullet does not fail quietly. It fails in the middle of a thirty-minute conversation with an engineer who was, until that moment, interested — and it converts the question from "what can this candidate do" to "what else on this page is overstated". Every line on the page is an invitation. Do not write an invitation you do not want accepted.
:::

### Fundamental engineering questions

The second half is fundamentals tied to the role. The reported GNC topics are specific enough to prepare against by name: **PD control**, **orbit determination**, and **frequency-domain analysis**.

Those three are not exotic and that is the point. PD control is proportional-derivative feedback — what each term does, what raising each one does to the response, and why the derivative term needs care in the presence of noise or sampling. Orbit determination is estimating an orbit from measurements: what is being estimated, what measurements inform it, and what makes a solution well or poorly determined. Frequency-domain analysis is the loop-shaping and stability-margin picture: Bode and Nyquist, gain and phase margin, and what a margin means physically rather than as a number read off a plot.

The technical track of this curriculum teaches all three properly, and this module is not going to re-teach them in miniature. What this module can tell you is that these three names are where preparation should be pointed for this specific stage, and that the eleventh module of this career track — the domain round — drills the same material to a considerably higher standard than a thirty-minute phone call will ask for. Preparing for that round over-prepares you for this one, which is the right direction for the error to run.

## Why thirty minutes changes the answer you should give

Take the stated structure seriously for a moment. If a thirty-minute call spends roughly half its time on resume depth, the technical portion is on the order of fifteen minutes. A question that takes you five minutes to orient to has consumed a third of it before you have said anything substantive.

The conclusion is not that you should answer fast. It is that your answers have to be **structured rather than exploratory**. Exploratory thinking is a legitimate and often superior way to solve a hard problem, and it is what a whiteboard round is partly designed to let you do. It is not what fits into a fifteen-minute window over a phone line, and a candidate who treats a fundamentals question as an invitation to think out loud from first principles for eight minutes will run out of call before running out of derivation.

What fits is: restate the question in your own words, name the assumptions you are making, give the structure of the answer in a sentence, then fill it in. That ordering means that even if you are cut off halfway, the interviewer has already heard the shape of your answer and knows you had one. The next module makes this a drilled routine rather than an aspiration.

## What this lesson does not know

Whether you get one technical phone screen or two, whether the hiring manager conducts it or an engineer does, which of the three reported topics comes up, whether there is a written rubric behind it, and what standard separates a pass from a fail — none of that is something this curriculum can state. The topics above are reported subject matter, not a syllabus with a guaranteed table of contents.

The useful response to that uncertainty is not to prepare for everything equally. It is to notice that the three reported topics, the domain round's content, and the technical track's control, estimation and astrodynamics modules all point at the same body of material. Preparation aimed there is not wasted whichever of them shows up.

::: example A resume line that could not hold weight
A candidate's resume carries the bullet: "Implemented an extended Kalman filter for attitude estimation fusing IMU and star tracker measurements." It is true. She wrote the filter, it ran, and it produced plausible attitude.

The interviewer, an engineer on an attitude determination team, goes straight to it, because it is the most relevant line on the page. He asks how she checked that the filter was consistent — not that it converged, but that its own covariance was telling the truth about its error.

She does not have an answer, because she never ran that check. The conversation does not end; interviewers are not looking for a reason to stop. But its character changes. The next several questions are about verification rather than about the work, and the honest summary of the exchange is that the most relevant line on her resume turned out to be thinner than it read.

The remedy is not to delete the line. It is to have run the check before the line existed: the portfolio module of this track builds consistency testing into the project itself, precisely so that the most attractive line on the resume is also the most defensible one. A project whose write-up states how you know the result is right produces resume bullets that survive this stage by construction.
:::

::: example Fifteen minutes, spent two ways
Two candidates are asked the same fundamentals question near the twenty-minute mark of a thirty-minute screen: how they would approach tuning a proportional-derivative controller for a pointing loop, and how they would know the result was any good.

The first candidate begins deriving the closed-loop transfer function out loud. It is correct, and it is slow: symbols have to be named, terms carried in the head on both ends of the line, and by the time she reaches a characteristic polynomial, four minutes have gone and no property of the design has been stated. The interviewer, watching the clock, redirects her. She has demonstrated real ability and has not yet answered the question.

The second candidate takes fifteen seconds first: she asks what the plant is, whether there is a meaningful sensor delay, and what the pointing requirement is. Then she states her structure before filling it in — she would set the derivative term against the damping she wants and the proportional term against the bandwidth she can afford, check that the bandwidth stays clear of the first structural mode, and then look at gain and phase margin to see whether the design has any room in it. Only then does she go into detail, starting with the margin check because that is the part the question's second half was about.

She has used about ninety seconds to put a complete answer on the table, and the remaining time goes on the interviewer's follow-ups — which is the conversation the stage exists to have. The difference between the two was not knowledge. It was that the second candidate gave the answer a shape before giving it content.
:::

## Check yourself

::: check
State the length, the participants and the two halves of the technical phone screen.
:::

::: answer
Thirty minutes typically, with some reports of sixty to ninety. It is conducted by an engineer on the team or by the hiring manager. The two halves are resume depth — going deeper on what you wrote — and fundamental engineering questions tied to the role, with PD control, orbit determination and frequency-domain analysis reported as the GNC subject matter.
:::

::: check
Why does the absence of a whiteboard make this stage harder than its length suggests, even for a candidate who knows the material well?
:::

::: answer
A whiteboard carries the variables so you do not have to hold them all in working memory, shows your structure to a listener without you having to narrate it, and gives you a place to park a half-finished idea. Over a phone line all three jobs fall to your sentences, in real time. The result is that verbal derivation is a separate skill from knowing the subject, and a candidate can be strong at the second and weak at the first.
:::

::: check
Using only the stage's stated length, argue for why answers here should be structured rather than exploratory.
:::

::: answer
If thirty minutes divides roughly between resume depth and fundamentals, the technical portion is on the order of fifteen minutes. A question needing five minutes of orientation before anything substantive is said has spent a third of that. Structure — restate, state assumptions, give the shape of the answer in a sentence, then fill it in — means the interviewer has heard a complete answer early and any interruption lands after the substance rather than before it. Exploratory thinking is a real and often better method for a hard problem; it does not fit this window.
:::

::: check
A candidate's resume says she implemented a batch least-squares orbit determination fit. What should she assume about how that line will be treated on this call?
:::

::: answer
She should assume it is the line most likely to be chosen, because it is directly relevant to one of the reported topics, and that she will be taken several levels down into it: what was estimated, what measurements were used, how the normal equations were conditioned, how she knew the fit was good, and what she did about the cases where it was not. Every line on a resume is an invitation to be questioned in depth, and the most relevant line is the one most likely to have the invitation accepted.
:::

::: check
Why does this lesson refuse to say what separates a pass from a fail at this stage?
:::

::: answer
Because no criterion is stated anywhere this curriculum can rely on, and a fabricated bar would be acted upon. What can be said honestly is where preparation should point: the three reported topics, the domain round's material, and the curriculum's control, estimation and astrodynamics modules are all the same body of knowledge, so effort aimed at it is not wasted regardless of which specific question arrives.
:::

## Summary

| Element | What it is |
| --- | --- |
| Length | 30 minutes typically; 60 to 90 reported |
| Who | An engineer on the team, or the hiring manager |
| First half | Resume depth — any line you wrote, taken several levels down |
| Second half | Fundamentals tied to the role |
| Reported GNC topics | PD control, orbit determination, frequency-domain analysis |
| Defining constraint | No whiteboard; sentences are the whole artefact |
| The answering habit | Restate, state assumptions, give the shape, then fill it in |
| Not knowable here | How many screens, who runs yours, which topic, what the bar is |

The next lesson covers the one stage that is conditional on the role rather than on you: the take-home exercise, which appears for some software and firmware roles and not universally.
