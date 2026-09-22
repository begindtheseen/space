---
id: l12-questions-that-prove-understanding
title: "Questions that prove you understand the work"
minutes: 22
covers:
  - questions you ask that prove you understand the work
---

Every round ends with some version of *do you have any questions for us?*, and the questions you ask are an answer in their own right. Not because there is a correct list, but because a question carries its premises with it: to ask something precise about how a team works, you have to already know enough about the work for the question to make sense.

This track's screens module covers the mechanics — when to ask, how many, how to follow an answer rather than moving down a list, what not to ask, and the note afterwards. This lesson covers one narrower thing, which is the thing this module's own objective asks for: what makes a question one that only someone who has studied the role family could have asked.

## A question carries its premises

Compare two questions about the same subject.

*"What tools do you use for simulation?"* presupposes nothing beyond the existence of simulation. Anyone could ask it, the answer is a list, and the list is probably on a job posting.

*"When a model moves from an engineer's analysis into the flight-software-in-the-loop simulation, how much of it gets reimplemented and how much runs as the same code?"* presupposes that those are different environments, that models cross between them, that reimplementation is a real option with a real cost, and that the answer varies by organisation. None of that can be faked, and the question would be slightly odd coming from someone who had not thought about it.

That is the whole mechanism. You are not demonstrating knowledge by displaying it; you are demonstrating it by asking something that only makes sense if you have it. The second form is much harder to perform and much easier to do honestly, which is why it works.

::: key
A question proves you understand the work when its premises could only be held by someone who has done adjacent work. Test each question two ways: could it be asked by someone who had not studied this role family, and do you actually want the answer? A question that fails the first proves nothing; one that fails the second collapses at the follow-up.
:::

## The second test: do you want the answer?

The failure mode of preparing questions is asking one you do not care about, because it sounded impressive when you wrote it down. It breaks immediately after it is answered: the answer arrives, you have nothing to say next, and the conversation lands on the floor. The person opposite will notice, because a candidate who cares about an answer reacts to it and one who does not moves to the next item.

So the practical constraint is that every question on your list has to be one where you would genuinely rather know than not know. That is a much tighter filter than it sounds, and applying it usually shrinks a prepared list of eight to about three — which is the number this module's objective asks for.

## Three sources of a question only you could ask

**From a decision you got stuck on.** The best source, and the one nobody else has. Somewhere in your own work you faced a choice, resolved it as well as you could, and remained unsure. That is a question with your evidence built into it: "I had to choose between a fixed final time and a free one on a descent solve, and I went fixed because I wanted a baseline in a week — with a real vehicle, where does that line actually sit?"

It demonstrates the decision existed, that you made it, and that you know what its cost was. It is also a question you want the answer to, by construction.

**From the boundary of what you can see from outside.** The previous lesson's move: name the thing you could not resolve from public information and ask about it. "From outside I cannot tell how much of the approach decision-making sits on the vehicle and how much is on the ground — as much as you can say, where is that line?" The phrase *as much as you can say* is doing real work, and it is the mark of someone who understands that there are things they cannot be told.

**From the seams of the role family.** This track's role-families module maps the boundaries: between GNC analysis and flight software, between design and verification, between the vehicle team and the subsystem teams. Seams are where organisations differ most and where a new engineer's experience is actually determined. "Who owns a requirement when the guidance design and the flight-software implementation disagree about what is feasible?" is a question about how work really happens, and its premise is that the disagreement is normal — which is the part that shows you have been near it.

## Calibrating so the question can be answered

Three ways a good question becomes an awkward one.

**It asks for something that cannot be disclosed.** Attach the escape clause yourself — *as much as you can say*, *at whatever level is appropriate* — and mean it. A candidate who makes it easy to decline part of an answer is a candidate who understands the constraints their interviewer is under.

**It is a statement wearing a question mark.** "Have you considered using a two-stage formulation to handle the unreachable-target case?" is advice from someone with no knowledge of the system, phrased as curiosity. The version that works removes the recommendation and keeps the curiosity: "How do you handle the case where the target is not reachable at all — is that a formulation problem or an operations one?"

**Its answer is published.** Asking something you could have found in ten minutes spends your question and tells the listener you did not spend the ten minutes. The exception, which is legitimate, is asking about something published in order to get the inside view of it — but then say so: "I have read the convexification paper; what I cannot tell from it is how much of the practical difficulty is in the solver and how much is in getting the problem data good enough."

::: warning The list is not the point
A prepared list is a safety net, not a script. If something in the conversation genuinely interests you, ask about that instead — a question that arises from what the person just said is better than anything you wrote down, because it proves you were listening and it is guaranteed to be one you want the answer to. The screens module treats following an answer at length; the relevant point here is that your three prepared questions exist so that you are never stuck, not so that they all get asked.
:::

## Two kinds of question, and both are yours to ask

The questions in this lesson demonstrate understanding of the work. The questions in the previous lesson — what a normal week looks like, how often a heavy period happens, what happened the last time a deadline slipped — gather the information you need for your own decision.

Both are legitimate and they do different jobs, so do not let either crowd the other out. A round where you ask only about pace has spent your questions on your own logistics; a round where you ask only about technical seams leaves you making a decision on no information. If you get two questions, one of each is a reasonable split. If you are meeting several people across a process, deliberately allocate: technical seams to the engineers whose work they are, pace and behaviour-under-stress to the people who live it, process and timeline to the recruiter.

::: example Five questions, graded on their premises
**1. "What does a typical day look like for someone in this role?"**

Premises: that there is a role and that it has days. Anyone can ask this, and the answer tends to be a generality. It is not damaging, and it is not evidence. If what you want is the calibrated version, the previous lesson's form — what did your last three weeks actually look like — asks for facts instead of a summary.

**2. "What language is the flight software written in?"**

Premises: none that are not on a posting or in a public talk. The answer is lookup-able, so asking spends a question to learn something you could have known. If you want the interesting version of this, the interesting version is about the constraint rather than the choice: "What does the real-time side impose on how you write analysis code — do model implementations have to be written twice, or does the same code run in both places?"

**3. "Have you thought about using lossless convexification for the thrust bound, rather than relaxing it?"**

Premises: that the team may not have considered a standard technique. This is advice from outside, formulated as a question, and it is the one shape on this list that actively costs you something. The knowledge behind it is real, which is what makes the phrasing such a waste: "How much of the practical difficulty in a descent solve is the formulation and how much is getting the problem data good enough?" displays the same understanding and asks something the person can actually answer.

**4. "What is the hardest technical problem your team is working on right now?"**

Premises: that there is a hard problem, which is safe, and that it can be described to an outsider, which may not be true. It is not a bad question and it is close to a good one; what holds it back is that it asks the other person to do all the work of finding common ground. Narrowing it to your own area fixes that: "Within attitude estimation specifically, what is the part that is still genuinely hard — is it the sensor side, the consistency of the estimator across a fleet, or getting the thing to be maintainable?"

**5. "I built a batch orbit-determination fit and the thing that surprised me was that convergence was a geometry problem long before it was a numerical one — I only caught it by checking the conditioning before trusting the fit. On a real tracking problem, how much of the work is actually about geometry and scheduling versus estimator design?"**

Premises: that the candidate has fitted real data, that conditioning is checkable in advance, that observability is a property of geometry, and that on a real system the tracking schedule is a design variable. Every one of those is true of someone who has done the work and awkward to fake. It is also a question with a genuine answer that the candidate wants, and it hands the other person an easy and interesting thing to talk about, which is the practical difference between a question that opens a conversation and one that closes it.
:::

::: example What to do with the answer
**Candidate:** "When a model moves from an engineer's analysis into the flight-software-in-the-loop simulation, how much gets reimplemented and how much runs as the same code?"

**Engineer:** "It depends on the model. Some things run as the same code, some get reimplemented because the analysis version uses libraries we would not fly. The reimplemented ones are where we spend most of our verification effort."

**The weak continuation:** "That makes sense. Great, thanks — my next question was about..." The candidate has treated a substantive answer as a box being ticked. The engineer said something specific and slightly weary — *that is where we spend most of our verification effort* — and nobody followed it.

**The strong continuation:** "That is the part I would have guessed is expensive. When a reimplementation is verified against the analysis version, is that a numerical equivalence check to a tolerance, or is it done at the level of behaviour — the same test cases producing the same decisions?"

**Engineer:** "Both, depending on what it is. Equivalence where we can, behaviour where the model is stochastic or the implementation genuinely differs."

**Candidate:** "That is useful, because it is exactly the thing I got wrong on my own simulation. I rewrote my integration inner loop for speed and changed the step size at the same time, and I did not re-run the analytic case, so I shipped a build that gave different loads. That is why everything I build now has a stored nominal case that has to reproduce before I merge — and what you are describing sounds like the same idea with a verification budget behind it."

**What happened in three exchanges:** the candidate followed the answer rather than her list, asked a second question whose premises were sharper than the first's, and then offered something of her own that was directly relevant and honest, including a failure. The conversation is now the kind that produces a real impression of an engineer, and none of it came from a prepared script beyond the opening question.

**One thing to notice:** she did not ask a third question. Following one question two levels down is worth more than asking three unrelated ones, and this is also where the material for the follow-up note comes from — the screens module's point that a note referring to something specific from the conversation is the only kind worth sending.
:::

## Check yourself

::: check
Why does this lesson argue that a question demonstrates understanding through its premises rather than through its content?
:::

::: answer
Because premises cannot be borrowed convincingly. Content can: anyone can name a technique they have read about, and displaying knowledge in a question — "have you considered lossless convexification?" — usually reads as display rather than curiosity. A question whose premises are specific, such as one that assumes models cross between analysis and flight environments and that reimplementation has a cost, only makes sense if the asker holds those premises, and holding them is the evidence. It is also a more comfortable way to be evidenced, since you are asking about something you genuinely do not know rather than performing something you do.
:::

::: check
You have written eight questions. Applying this lesson's second test, how do you get to three?
:::

::: answer
Ask, for each one, whether you would genuinely rather know the answer than not know it — not whether it sounds good, and not whether it shows something about you. Most prepared lists collapse under that test, because half the entries were written to demonstrate rather than to find out. The ones that survive are usually the ones tied to something specific in your own history: a decision you got stuck on, a thing you could not resolve from public sources, a seam you have already been caught in. The practical reason the filter matters is the follow-up: a question you care about has a natural second move, and one you do not care about leaves you with nothing to say the moment it is answered.
:::

::: check
Rewrite this so that it stops being advice: "Have you considered running your consistency tests over a Monte Carlo rather than a single run?"
:::

::: answer
Remove the recommendation, keep the curiosity, and put your own evidence in as the reason you are asking. "When you check an estimator's consistency, is that done over a Monte Carlo set or against flight data from a single run — and if it is flight data, how do you get a distribution out of it?" The rewritten version asks something you actually do not know, has premises that show you know the difference between the state-error test and the innovation test and why one of them is unavailable outside simulation, and gives the other person an interesting question rather than an implied criticism of their practice.
:::

::: check
Why does this lesson say to allocate question types across the people you meet rather than asking everything of everyone?
:::

::: answer
Because different people can answer different things well, and your questions are a finite resource — you typically get one or two per conversation. Engineers can tell you about seams, about what is genuinely hard in their area, and about what their own last three weeks looked like. The recruiter is the right person for process, policy and timelines. Asking an engineer about the formal interview process wastes a rare opportunity, and asking a recruiter about verification practice puts them in the position of relaying something second-hand. Allocating deliberately also prevents the two failure shapes: a process where you asked only about pace and learned nothing about the work, or one where you asked only about the work and have to decide on the offer with no information about the life.
:::

::: check
An engineer gives you a short, slightly weary answer with one specific detail in it. What is the move?
:::

::: answer
Follow the detail. A specific detail offered unprompted is usually the part the person finds real, and asking about it is both more interesting to them and more informative to you than moving to the next item on your list. The follow-up should sharpen rather than broaden: take the specific thing they named and ask how it actually works, or what it costs, or where the line is. Following one thread two levels down beats asking three unconnected questions, it gives you something concrete for the follow-up note afterwards, and it is the clearest available demonstration that you were listening rather than waiting.
:::

::: check
Is it legitimate to ask about something that is publicly documented?
:::

::: answer
Yes, if you say that you have read it and ask for the part the document does not contain. "I have read the convexification paper; what I cannot tell from it is how much of the practical difficulty is in the solver versus in getting the problem data good enough" is a strong question, because its premises include having read the thing and having identified what it leaves open. What fails is asking for something the document plainly answers, which spends a question and shows the ten minutes were not spent. The distinction is between asking to be informed and asking for the view from inside, and stating which you are doing takes one clause.
:::

## Summary

| Source of the question | What its premises show | Example shape |
| --- | --- | --- |
| A decision you got stuck on | You faced the choice and know its cost | "I went fixed-time for a baseline; where does that line sit in practice?" |
| The boundary of public knowledge | You know what you cannot see from outside | "As much as you can say, where does that decision sit?" |
| A seam in the role family | You know where organisations actually differ | "Who owns a requirement when design and implementation disagree?" |
| Something published | You read it and found what it leaves open | "I have read the paper; what it does not say is..." |

Two tests: could someone who had not studied this role family ask it, and do you actually want the answer? Allocate deliberately — seams to the engineers, pace and behaviour under stress to the people who live it, process to the recruiter — and follow one answer two levels down rather than asking three unrelated questions.

That closes this module and, with it, the career track. The work now is the four exercises rather than more reading: build the bank of ten stories with quantified results and no first-person plural in the Action, write the extended-hours answer you would give identically to a friend and to a hiring manager, write the sixty-second answer to why this company with no transferable sentence in it, and put your failure story in front of someone who will push on it three times. Every one of those produces an artefact you will use in a room, which is the only test of this module that matters.
