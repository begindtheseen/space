---
id: l02-the-action-section
title: "The Action section, in the first person singular"
minutes: 22
covers:
  - "STAR structure: Situation, Task, Action, Result, and the common failure of spending most of the answer on Situation"
---

The Action section is about sixty percent of a ninety-second story and it is the part being assessed. The previous lesson dealt with the first way it fails — the scene eats it. This lesson deals with the second, which is subtler, survives every timing fix, and affects engineers who have done genuinely excellent work on genuinely good teams.

It is the pronoun. An Action section narrated as *we* describes a team's work rather than yours, and a listener cannot score a team. This module states the point without hedging: using *we* throughout makes your contribution unassessable, which it names as the single most common reason a technically true story scores badly. The story is accurate, the work was real, the engineering was sound, and the answer still carries no information about the person answering.

What makes this hard is that the plural is usually a virtue elsewhere. Saying *we* is how you talk in a stand-up, how you write a paper, and how a decent colleague describes shared work. You are not being asked to stop being that person. You are being asked to be precise about a seam — which parts were yours — in a setting where nobody else is present to describe them.

## Why the plural costs you the answer

Reason about the mechanism rather than taking the rule on authority, because the mechanism tells you exactly how far to take the fix.

An interviewer has, at most, the ninety seconds you are speaking and whatever follow-ups they have time for. They are trying to establish what *you* would do on their team. Every sentence of the form "we decided to re-formulate the guidance problem with a free final time" is consistent with three very different candidates: the one who proposed it, the one who implemented it after someone else proposed it, and the one who was in the room. Those three people would contribute differently, and nothing in the sentence separates them. The listener is left with a choice between assuming the most flattering reading, assuming the least, or spending a follow-up question finding out. This module's position is that the follow-up is the usual outcome — and if it comes, you have spent one of your few questions answering something your own sentence should have settled.

There is a second cost that is easy to miss. A *we*-narrated Action tends to lose the decisions along with the attribution, because the natural grammar of collective narration is sequential: we did this, then we did that, then it worked. Decisions get flattened into events. So the fix is not only cosmetic. Rewriting an Action in the first person singular usually forces you to remember what you actually decided, which is the material the section needed anyway.

::: key
The Action section is narrated in the first person singular because the interviewer is assessing you, not the team. Using *we* throughout makes your contribution unassessable, which is the single most common reason a technically true story scores badly. Credit belongs in the Situation and the Result; the Action is yours.
:::

## Where the plural is correct

The rule is about one section, not about the whole answer, and applying it everywhere produces a different and equally bad result: a candidate who appears to have built a launch vehicle alone.

**Situation and Task take the plural naturally.** "We had three weeks before the design review and the campaign had never been run end to end" is scene, it is true, and the plural is right. Your Task sentence then draws the line: "I owned the dispersion set and the pass criterion."

**The Result can take the plural, and often should.** "We hit the review date with the campaign complete" gives the team the outcome, which is honest and which costs you nothing, because the Action has already established what you did to get there.

**Naming other people by role is a strength, not a dilution.** "Our propulsion lead gave me a thrust-misalignment tolerance from the hardware spec, and I dispersed against that rather than against a number I made up" is a sentence in the first person singular that credits someone else specifically. It reads as a person who works with others and knows where their own work ended.

::: warning The verbs that erase you
Watch for *helped*, *was involved in*, *worked on*, *was part of*, *contributed to*, *supported*. Each one names a relationship to some work instead of naming work. "I helped with the verification" could mean you designed the verification strategy or that you ran someone else's script twice. Replace the verb with what you actually did: decided, derived, measured, wrote, rejected, re-scoped, escalated, rewrote, tested, found. If no such verb is true for a piece of work, that piece belongs to someone else and should be attributed to them rather than blurred.
:::

## The two directions this goes wrong

There are two failure modes and they pull opposite ways, which is why a rule like *always say I* is not enough on its own.

**Erasure** is the one this lesson has been describing: work you did, narrated as the team's, leaving nothing assessable.

**Inflation** is the mirror image: work the team did, narrated as yours. It is one of the reported red flags this module names, and a later lesson deals with it directly. It is worth flagging here because the fix for erasure, applied carelessly, produces it. If you take a story about a four-person project and rewrite every *we* as *I*, you have not made the story assessable — you have made a claim you cannot defend three questions deep, in a round where being asked three questions deep is normal.

The thing that satisfies both constraints at once is *precise attribution*: say what was yours, say what was not, in the same breath, and do not leave the boundary to the listener's imagination. Precision is what makes a modest contribution sound credible and an immodest one sound suspect, and it is the reason the honest version of a small contribution often lands better than an inflated version of a large one.

## Finding the seam

Here is a practical method that takes about twenty minutes per story.

1. Write the Action out in prose, however it comes.
2. Rewrite every sentence to start with *I*. Some of them will work as they stand. Some will feel like a lie.
3. For each sentence that felt like a lie, work out which of two things is true: either you do not remember precisely what you did, or the work was genuinely shared.
4. For the first case, go and look. Your own commit history, your notes, the write-up from the portfolio module — the record exists and is worth twenty minutes, because a vague memory becomes a vague sentence.
5. For the second case, narrow the claim until it is exactly true, and attribute the rest. "I did not write the solver interface — that was my project partner. What I owned was the constraint-checking layer, and the reason it exists is that I did not trust an *optimal* status flag to mean the returned trajectory actually satisfied the glide-slope constraint."

Step five is the one that pays. A narrowed, exactly true claim with an explicit reason attached is more persuasive than a broad one, because the reason is the kind of detail only the person who did the work would produce.

## Pre-empting the follow-up

If your Action is precise, the question *what did you personally do?* has already been answered and the interviewer can spend their follow-up on something more interesting to you — the engineering. That is a good trade and it is entirely in your control.

One useful habit: put the seam sentence early in the Action rather than at the end. "The part that was mine was the estimator itself" in sentence one means every decision you describe afterwards is already scoped, and you never have to backfill. This is the same discipline as the past-project round's contribution question, which this track covers in its own module, compressed into a setting where you have ninety seconds and no slides to point at.

## The solo-project problem

Some candidates have the opposite difficulty. If your strongest evidence is a portfolio you built alone, every sentence is already in the first person singular and the risk is a different one: an answer that reads as somebody who has never worked with anyone.

Do not invent a team. Do notice that solo projects almost always contain real collaboration that goes unmentioned — the person who reviewed your code, the forum thread where somebody told you your covariance was wrong, the club teammate you talked through a derivation with, the maintainer whose issue reply changed your approach. Naming one of those, specifically, and saying how it changed what you did, evidences the same thing a team story evidences: that you seek out a check on your own work and act on it. "I asked a friend who does estimation professionally to look at my consistency test, and she pointed out I was averaging the normalised error over runs that were not independent" is a collaboration sentence. It is also true, which an invented team would not be.

::: example An Action rewritten, sentence by sentence
The question: *Tell me about a time you owned a piece of technical work end to end.*

**As first drafted — five sentences, twelve instances of the plural, one assessable claim:**

"We built a batch least-squares orbit determination tool for the club. We were fitting to positions derived from public two-line element sets, and we had some trouble getting it to converge at first. We looked at the geometry and realised the problem was that we only had one station, so we added more. After that we got it converging nicely and we validated it against a known case. We presented it at the end-of-term showcase and it went well."

**Diagnosed:** the listener now knows a club built an orbit-determination tool. They do not know whether this candidate wrote the estimator, ran the fits, diagnosed the conditioning problem, or made the slides. *We looked at the geometry and realised* is the pivotal sentence in the whole story and it is attributed to four people. *It went well* is not a result.

**Rewritten, same events, nothing inflated:**

"I owned the estimator — the Gauss-Newton iteration, the convergence criteria, and the covariance we reported. Two others on the team handled the data ingest and the plotting.

My first version diverged by the second iteration, and the velocity states ran off to physically absurd values. My instinct was that I had a bug in the Jacobian, and I spent an afternoon looking for one that was not there. What actually fixed it was stopping and computing the condition number of the normal matrix at the true state before fitting anything: it came out around ten to the eighteen, so one state direction was effectively unobservable from range-only data to a single station on a nearly straight-line pass. That is a geometry problem, not a code problem.

I re-ran with three more stations at distinct bearings. The condition number dropped to the order of ten to the five, and the fit converged in four iterations, with the RMS residual settling near the fifty-metre measurement noise level I had assumed. I now compute the conditioning before I trust any fit, and the tool reports it on every run."

**What changed:** the seam is named in the first sentence, so nothing later needs qualifying. The pivotal diagnosis is now attributed to the person who made it. The wrong first instinct is included, which costs nothing and makes the correct diagnosis credible. And the Result is a number against a standard rather than an assurance that it went well.
:::

::: example Narrating a genuinely joint decision without inflating or disappearing
The question: *Tell me about a technical decision you made with someone else.*

**The inflated version:** "I decided we should use a fixed final time for the descent solve, because it is much simpler to implement and I wanted to get a working baseline before adding complexity."

If the decision was actually joint, this is a claim that will not survive the follow-up *what was the argument against it, and who made it?* — and being caught is expensive in a way the small exaggeration never repays.

**The erased version:** "We decided to use a fixed final time because it was simpler."

Now nothing is assessable. It is also, quietly, less interesting: the reasoning has vanished along with the attribution.

**The precise version:** "My project partner and I disagreed about this one. She wanted a free-final-time formulation from the start because it is what a real descent guidance architecture needs, and she was right about that. My argument was that a fixed-time solve would let us get an end-to-end result in a week and give us a baseline to measure the harder version against, and that is what we did.

What I owned after that was the dispersion campaign, and it settled the argument in her favour with a number: across five hundred dispersed cases, four percent came back infeasible — no trajectory exists that meets both terminal conditions inside the actuator bounds in exactly twenty seconds. A fixed-time formulation has no way to ask for more time, so those cases just fail. I reported the infeasible fraction as the headline result rather than the mean landing accuracy, because it was the number that actually told us something, and we moved to the two-stage formulation after that."

**Why this is the strongest of the three:** it is exactly true, so it survives any follow-up. It gives the other person credit for being right, which reads as confidence rather than weakness. It still contains a clearly owned contribution — the argument for sequencing, the campaign, and the choice of which number to report. And it demonstrates the thing the round is looking for far better than winning the argument would have: an engineer who let evidence settle a disagreement and said so.
:::

## Check yourself

::: check
A candidate says: "I was involved in the verification effort for the simulation, and we made sure everything was checked properly before we used it." Rewrite the sentence, and say what information you would need from the candidate to do it.
:::

::: answer
As written, it names a relationship to work rather than work: *involved in* and *made sure* could describe anything from designing the verification strategy to attending the meetings. To rewrite it you need three things: which checks the candidate personally designed or ran, what the acceptance criterion was, and what the checks actually returned. A repaired version might be: "I wrote the verification section — an analytic two-body case the propagator had to reproduce to a stated tolerance, an energy-conservation check over the full run, and a step-size convergence study. The convergence study is the one that mattered: it showed my default step was too coarse above about forty kilometres, so I tightened it before anyone used the results." Same event, now assessable.
:::

::: check
Why is it acceptable — sometimes preferable — to use *we* in the Result, when the whole lesson argues for the first person singular?
:::

::: answer
Because the pronoun rule exists to make your contribution assessable, and by the time you reach the Result the Action has already done that. Giving the team the outcome costs you nothing at that point and reads as someone who is comfortable sharing credit, which is a different signal from someone who cannot say what they did. The order matters: credit after attribution is generosity, credit instead of attribution is vagueness.
:::

::: check
A candidate rewrites a four-person project story so that every sentence begins with *I*. What has she fixed, what has she broken, and what is the test that would have caught it?
:::

::: answer
She has fixed the assessability problem and created an accuracy problem — she is now claiming work that belonged to three other people, which is the inflated-contribution red flag this module names. The test is whether each sentence would survive a follow-up three questions deep: can she describe the design of the thing she just claimed, the alternatives she rejected, and why? Any sentence that fails that test should be narrowed until it is exactly true and the remainder attributed to the person who did it. Precise attribution, not maximal attribution, is the standard that satisfies both constraints.
:::

::: check
Your strongest evidence is a portfolio you built alone. An interviewer asks for a time you worked with someone on a technical problem. What do you do?
:::

::: answer
Find the real collaboration inside the solo work rather than inventing a team. Almost every serious independent project contains a check by someone else: a review, a forum answer, a professional who looked at your filter, a teammate you talked a derivation through with. Name the person by role, say what they told you, and say specifically what you changed as a result — the change is the part that evidences collaboration, not the conversation. If the honest answer is that the interaction was small, say so and say what you would do differently now, which is a better answer than a manufactured group project that falls apart under the first follow-up.
:::

::: check
Explain, from the mechanism rather than the rule, why rewriting an Action section in the first person singular often improves it even when nobody was going to ask about attribution.
:::

::: answer
Because collective narration has a grammar that flattens decisions into events. "We looked at the geometry and realised the problem" is a sentence about something that happened; "I computed the condition number before fitting anything, because my first instinct had been wrong" is a sentence about something someone chose to do, and it carries the reasoning with it. Forcing every sentence into the first person singular makes you locate the decision behind each step, and the decisions are the material the Action section is supposed to contain. The attribution fix and the content fix are the same edit.
:::

::: check
An interviewer follows up with: "You keep saying you owned the estimator — what did the other two actually do?" How should you read this question, and what makes a good answer?
:::

::: answer
Read it as a check on precision, not as an accusation. It is the natural question to ask someone who has drawn a clear boundary, and the fact that you drew one is why it can be asked at all. A good answer is specific and generous: name what the other two did, in the same concrete terms you used for your own work, and where their work made yours possible, say so. "One wrote the ingest that turned the element sets into positions in a consistent frame, which is the part I would have got wrong, and the other did the visualisation we used to spot the outlier pass" answers the question and confirms that your original boundary was real. An answer that vaguely minimises their contribution does the opposite, and would leave the interviewer wondering about the boundary you had just drawn.
:::

## Summary

| Section | Pronoun | Why |
| --- | --- | --- |
| Situation | Plural is natural | Context belongs to the team and the project |
| Task | Singular | This is the sentence that draws the seam |
| Action | Singular throughout | The part being assessed; the plural makes it unassessable |
| Result | Either; plural is generous | Attribution is already established |
| Crediting others | Singular sentence, named role | "X gave me the tolerance; I dispersed against it" |

Two failure directions, one standard: erasure makes you unassessable, inflation makes you indefensible, and precise attribution — what was mine, what was not, said in the same breath — is the only position that survives three follow-up questions. The next lesson takes the other half of a strong Result and deals with the number in it: where it comes from, what to do when you never measured one, and why a checkable result is worth more than an impressive one.
