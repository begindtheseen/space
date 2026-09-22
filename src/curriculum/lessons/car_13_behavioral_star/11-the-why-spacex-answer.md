---
id: l11-the-why-spacex-answer
title: "The why SpaceX answer, with information in it"
minutes: 22
covers:
  - the why SpaceX answer that is not a recital of the mission statement
---

*Why SpaceX?* is asked in almost every process and it is the question candidates prepare least seriously, because it feels like the soft one. It is not exactly a behavioural question — there is no past situation in it — but it belongs in this module, because it is answered well or badly for the same reason every other answer here is: whether it contains anything only you could have said.

The default answer is the mission. Making life multiplanetary, the most important project of the century, being part of something that matters. This module is blunt about why that fails, and the reason is worth stating precisely: reciting the mission statement is what everyone does, which makes it worth nothing as a signal.

That is not a criticism of the mission or of caring about it. You may well care about it, and saying so is not dishonest. It is a claim about information. An answer available to anyone who has read the front page of a website cannot separate one applicant from another, so it occupies sixty seconds and leaves the listener exactly where they started.

::: key
A why-this-company answer names a program, names a technical problem, and connects it to evidence you have built. Reciting the mission statement is what everyone does, which makes it worth nothing as a signal.
:::

## The three components

**A program.** Something specific enough to have its own engineering problems: a vehicle, a constellation, a spacecraft, a phase of flight. "Space" is not a program. Naming one commits you, which is the point — it gives the listener somewhere to take the conversation, and it demonstrates you have a view about which problems you want rather than a general enthusiasm.

**A technical problem.** The thing you would actually want to work on, described at the level an engineer would describe it. This is the component that most cleanly separates a candidate who has thought about the work from one who has thought about the company, because a problem cannot be named from a careers page.

**Evidence you have built.** The link back to your own work is what turns the answer from an interest into a direction. It also does something structurally useful: it makes your behavioural answers and your technical answers describe the same person. If the project you defended in the past-project round and the problem you name here are on the same axis, the whole process reads as coherent rather than as a set of separately prepared performances.

## Finding your program and problem honestly

Work outward from your own evidence rather than inward from the company. The alternative — picking the most famous program and looking for a reason — produces an answer that sounds exactly like what it is.

**Start with what you built and what was hard about it.** Not what it was called: what problem inside it held your attention. Was it that the estimator had to be honest about its own uncertainty? That the trajectory had to be recomputed under constraints in real time? That the disturbance environment was the thing driving the whole design?

**Name the class of problem.** Attitude estimation with limited or intermittent references. Guidance under thrust and pointing constraints with a hard terminal condition. Momentum management in a disturbance environment you do not control. Relative navigation with an object that is not cooperating with you.

**Then find where that class of problem lives.** A vehicle that lands under its own power has an entry-and-landing guidance problem. A large constellation in low orbit has an attitude and momentum problem at a scale that changes its character, because whatever a single spacecraft needs must work without per-spacecraft attention. A capsule that approaches a station has a relative navigation and approach-safety problem. These are inferences you can make from what is publicly known about what a vehicle does, and they are the right level of specificity for this answer.

**Read something that is specific about the engineering.** This module recommends Eric Berger's *Reentry* for exactly this purpose, because it is concrete about what the programs actually did rather than about what the company is for. Published technical papers are the other source: the lossless-convexification work behind modern powered-descent guidance, which this curriculum's portfolio module treats as an anchor-project basis, is a paper you can read, implement and then have an opinion about.

::: warning Do not claim knowledge you cannot have
You can know what is publicly documented: what vehicles do, what has flown, what has been published. You cannot know how a team currently works internally, what is on their roadmap, or what problems they consider hard this quarter — and a candidate who speaks confidently about any of that is making a claim the person opposite can immediately evaluate.

Two forms this takes. Flattery is one: telling engineers how extraordinary their work is says nothing about you and puts them in an awkward position. Assumed inside knowledge is the other: describing what their current challenges must be, from the outside, risks being wrong in a way that is specifically unhelpful. The safe and strong form is to say what you find interesting about a publicly known problem, and to ask about the parts you cannot see.
:::

## The transferability test

This module's third exercise gives the test in one line: the answer must contain no sentence that could be copied unchanged onto an application to a different company.

Run it as an edit rather than as a judgement. Write the answer out, then go through it sentence by sentence and cross out every sentence that would survive a find-and-replace of the company name. Mission sentences go. Prestige sentences go. *I want to work with the best engineers in the industry* goes. *I have always been fascinated by space* goes first of all.

What remains is your answer. If nothing remains, you have not yet done the work, and the work is the research above rather than a better way of phrasing what you had.

A second, harsher version of the test: would a working engineer on the program you named recognise that you have actually thought about their problem? That is the bar the exercise sets, and it is reachable — not by knowing what they know, but by having a real opinion about a real problem in their area, formed by having built something adjacent to it.

## Applying to several companies

Nothing in this requires exclusivity, and pretending otherwise is a weak position anyway. You are probably applying to several places; everyone knows that.

The answer is not a claim that this is the only company you would work for. It is a claim about what work you want and why this is a place it happens. That claim can be true of more than one employer at a time, and your answers for two different companies should differ in the program and the problem while resting on the same evidence — which is what it looks like when someone knows what they want rather than where they want it.

## When the honest answer is partly about scale or pace

Sometimes the true reason is not purely technical: the flight rate, the amount of hardware, how quickly a design becomes something real. That is legitimate and can be said, provided it is tied to work rather than to atmosphere.

"I want to be somewhere that flies often, because the thing I am short of is contact between a model and reality — everything I have built has been validated against data I generated or data somebody else collected years ago" is specific, honest, and about engineering. "I want to be where things move fast" is a mood.

::: example The same candidate, twice
The question: *So — why SpaceX?*

**The default answer, about fifty seconds:**

"I think what you are doing is genuinely the most important thing happening in engineering right now. Making life multiplanetary is a goal I believe in, and I have followed the company since I was at school — the first booster landing is one of those things I remember exactly where I was for. I want to work with the best engineers in the industry on hard problems that matter, and I think the pace and the ambition here are unmatched. Honestly, if I am going to spend my twenties working hard on something, I want it to be this."

Every sentence is sincere and not one of them is about the work. Run the transferability test and a single clause survives — the booster landing, and only because it names a specific event, though nothing follows from it. It is a version of the answer this module describes as the one everyone gives, which is what makes it uninformative regardless of how strongly it is felt.

**The same candidate after doing the work, about sixty seconds:**

"The honest route to my answer starts with what I have built rather than with the company. The project I care most about is an attitude estimator — a multiplicative EKF fusing gyro and star-tracker data, with a NEES and NIS consistency campaign, because what interested me was not the accuracy but whether the filter was honest about its own covariance.

That pushed me towards attitude and momentum problems, and the reason I am looking at Starlink specifically is a consequence of scale that I find genuinely interesting. A single spacecraft's momentum management is a sizing exercise; a constellation of that size cannot be a sizing exercise, because nothing that requires per-spacecraft attention survives the arithmetic. Everything has to hold across a population and across an environment that varies over a solar cycle, and the estimator has to be trustworthy without anyone looking at its output. That is the same property I was chasing in my own filter, at a scale where it stops being a nicety.

The part I cannot see from outside is how much of that is autonomy on the spacecraft and how much is decided on the ground, and that is one of the things I would most like to ask about. What I would bring to it is the consistency-testing habit — I have built the estimator, and more to the point I have built the test that told me my estimator was lying to me."

**What changed:** a program is named and the reason for naming it is an inference about engineering rather than about prestige. A technical problem is named at a level an engineer would recognise. The link to her own evidence is explicit and is the strongest sentence in the answer. She marks the boundary of what she can know from outside and converts it into a question, which is accurate and also invites the conversation to continue. And no sentence in it would survive a find-and-replace of the company name.
:::

::: example The transferability test, run line by line
A candidate's draft, with each sentence marked for whether it would survive being copied onto a different application.

> "I have wanted to work in spaceflight since I was a child." — *Survives. Cut.*

> "SpaceX is doing the most exciting work in the industry and the pace of progress is extraordinary." — *Survives, with the name swapped. Cut.*

> "I am particularly drawn to the challenge of reusability and what it means for access to space." — *Survives with a small edit; several companies pursue reusability, and the sentence names no problem. Cut.*

> "My background is in estimation, and I have built a batch orbit-determination tool fitted to real tracking data." — *Does not survive as a why-this-company sentence, but it is not one — it is evidence with no destination attached. Keep, and attach it.*

> "I would love to work with the talented people at SpaceX and learn as much as I can." — *Survives. Cut, and note that it describes what she would receive rather than what she would do.*

**What is left:** one sentence of evidence and nothing to attach it to, which is an accurate diagnosis — the draft was assembled out of enthusiasm rather than research.

**The rebuild, starting from the surviving sentence:**

"My background is in estimation, and the piece of work I would point at is a batch orbit-determination fit to real tracking data rather than to measurements I generated myself, which is where I learned that a fit converging is not the same as a fit you can trust — the case that taught me that was a geometry problem, not a code problem, and I only found it by computing the conditioning before believing the answer.

What that makes me want to work on is navigation where the geometry is the difficulty rather than the algorithm, and the case of that I find most interesting is close-proximity approach: the relative measurements get better as you close and the consequences of a bad estimate get worse at exactly the same rate, so the whole design is about where you put the decision points. That is a real tension, not a slogan, and it is the reason I am looking at the Dragon side rather than at launch.

What I do not know from outside is how much of the approach is autonomous and where the abort criteria actually sit, which is the first thing I would ask."

**What the rebuild demonstrates:** the answer was not a phrasing problem. It became a real answer when the candidate connected evidence she already had to a class of problem she could name, and then to a program where that class of problem lives — and the whole thing took research, not rewriting.
:::

## Delivering it

Sixty seconds. It is a prepared answer and it should sound thought-about rather than recited, which means the same skeleton discipline as a story: the evidence you start from, the program, the problem, the link back, and the one thing you would ask.

End on the link or on the question, not on a statement about the company. An answer that finishes with how much you admire the work has handed the last sentence — the one that is remembered — to a claim that carries no information about you.

## Check yourself

::: check
A candidate's answer names a program and a technical problem but contains no reference to anything she has built. What is missing, and why does it matter beyond this one question?
:::

::: answer
The evidence link is missing, and with it the reason to believe the interest is real rather than researched the night before. Anyone can name a program and a problem after an afternoon of reading; what cannot be assembled quickly is a piece of work that put the candidate next to that class of problem and gave her an opinion about it. It matters beyond this question because it is what makes the process coherent: if the project she defends in the past-project round and the problem she names here sit on the same axis, every round is describing the same engineer. If they are unrelated, the answers read as separately prepared performances, and the strongest single sentence available to her — *I have built the adjacent thing, and here is what it taught me* — goes unsaid.
:::

::: check
Why does this lesson say the mission-statement answer fails, while also saying it is fine to care about the mission?
:::

::: answer
Because the objection is about information, not about sincerity. An answer that is available to anyone who has read the front page of a website cannot distinguish one applicant from another, so it spends sixty seconds and leaves the listener knowing nothing new — which is what this module means by saying it is worth nothing as a signal. Caring about the mission is common and unobjectionable, and a sentence about it costs little if the rest of the answer does the work. The failure is when it is the whole answer, because then the candidate has used their most open-ended question to say the one thing that could not tell anyone anything.
:::

::: check
Apply the transferability test to: "I want to work on hard problems with people who hold a very high bar, in an environment where engineering decisions are made quickly."
:::

::: answer
It survives a find-and-replace of the company name entirely — there is no program, no technical problem, and nothing that could not be said to any employer with a reputation for pace. Cut it. If the underlying preference is real, the way to make it informative is to attach it to work: what is it about your own experience that makes decision latency matter to you, and what specifically would you be able to do that you cannot do now? "Everything I have built has been validated against data I generated myself, and what I am short of is contact between a model and reality" is the same preference with content in it.
:::

::: check
Why does this lesson warn against describing what a team's current technical challenges must be?
:::

::: answer
Because it is a claim about something you cannot see, made to the one person who can evaluate it immediately. What is public is what vehicles do, what has flown and what has been published; what is internal — current roadmaps, which problems a team considers hard this quarter, how the work is divided — is not, and confident speculation about it is either wrong or accidentally right, neither of which helps you. The strong version stays on your side of the line: say what you find interesting about a publicly known problem, state plainly which part you cannot see from outside, and turn that into a question. Marking the boundary accurately is itself a signal, and it converts a weakness in your knowledge into a reason for the conversation to continue.
:::

::: check
You are interviewing at three companies and genuinely want all three. Does the why-this-company answer require you to pretend otherwise?
:::

::: answer
No, and pretending is a weak position in any case, since everyone knows how a job search works. The answer is not a claim of exclusivity; it is a claim about which work you want and why this is a place where that work happens. The honest structure is that the evidence half of your answer stays the same across all three — it is your history — while the program and the problem differ, because they are specific to each place. If your three answers differ only in the company name, you have three versions of the default answer. If they differ in program and problem while resting on the same built evidence, you are someone who knows what they want to work on.
:::

::: check
Why does this lesson tell you to work outward from your own evidence rather than inward from the company?
:::

::: answer
Because the inward route — pick the most visible program, then find reasons — produces an answer that sounds assembled, and it usually is. The evidence route produces something that cannot be assembled: a problem you have actually been next to, an opinion formed by building something, and a reason for caring that predates the application. It is also the only route that reliably produces the evidence link, since it starts there. As a practical matter it is faster: you already know what held your attention in your own projects, and the research is then narrow — which programs have that class of problem — rather than a general survey of everything a large company does.
:::

## Summary

| Component | What it looks like | What replaces it in a weak answer |
| --- | --- | --- |
| Program | A vehicle, constellation or spacecraft with its own problems | "Space", or the company as a whole |
| Technical problem | Named at the level an engineer would use | The mission, or the pace |
| Evidence link | The adjacent thing you built and what it taught you | Enthusiasm and history of interest |
| Boundary | What you cannot know from outside, turned into a question | Confident speculation about internal work |

The test is that no sentence survives a find-and-replace of the company name, and the harder version is that an engineer on the program would recognise you have thought about their problem. The final lesson takes the other half of the same coin: the questions you ask, and what makes one prove you understand the work.
