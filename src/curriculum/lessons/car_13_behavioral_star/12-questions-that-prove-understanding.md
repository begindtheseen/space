---
id: l12-questions-that-prove-understanding
title: "Questions that prove you understand the work"
minutes: 22
covers:
  - questions you ask that prove you understand the work
---

Picture two kids at a skate park asking an older skater for help. The first asks, "Is skateboarding hard?" The second asks, "When you learned kickflips, did you keep your front foot angled, or straight across the board?" The second kid has clearly spent hours falling off a board; nobody else would think to ask about the front foot.

Every interview round ends with some version of *do you have any questions for us?* The questions you ask are an answer in their own right. Not because there is a correct list, but because a question carries its **[[premises|premise]]** with it — the things it quietly assumes are true. To ask something precise about how a team works, you must already know enough about the work for the question to make sense.

This track's screens module covers the mechanics: when to ask, how many, how to follow an answer instead of marching down a list, what not to ask, and the note you send afterward. This lesson covers one narrower thing, the thing this module's objective asks for: what makes a question one that only someone who has studied the **[[role family|role-family]]** could have asked.

## A question carries its premises

Compare two questions about the same subject.

*"What tools do you use for simulation?"* assumes nothing beyond the fact that simulation exists. Anyone could ask it. The answer is a list, and the list is probably on the job posting.

*"When a model moves from an engineer's analysis into the **[[flight-software-in-the-loop|fsw-in-the-loop]]** simulation, how much of it gets reimplemented and how much runs as the same code?"* assumes a lot:

- that those are different environments;
- that models cross between them;
- that rewriting a model (reimplementing it) is a real option with a real cost;
- that the answer varies from one organization to another.

None of that can be faked.

That is the whole mechanism. You do not prove knowledge by displaying it. You prove it by asking something that only makes sense if you have it. The second way is much harder to perform and much easier to do honestly, which is why it works.

::: key
A question proves you understand the work when its premises could only be held by someone who has done adjacent work. Test each question two ways: could it be asked by someone who had not studied this role family, and do you actually want the answer? A question that fails the first proves nothing; one that fails the second collapses at the follow-up.
:::

## The second test: do you want the answer?

The common mistake is to prepare a question you do not care about, because it sounded impressive. It breaks the moment it is answered. The answer arrives, you have nothing to say next, and the conversation drops to the floor. The other person notices: a candidate who cares about an answer reacts to it, and one who does not moves on to the next item.

So every question on your list must be one where you would really rather know than not know. That filter usually shrinks a prepared list of eight to about three — the number this module's objective asks for.

::: key
Aim for **three** questions that only someone who studied the role family could ask — each one you genuinely want answered. Their best sources: a decision you got stuck on, the boundary of what you can see from outside, and the seams of the role family.
:::

## Three sources of a question only you could ask

**From a decision you got stuck on.** This is the best source, and the one nobody else has. Somewhere in your own work you faced a choice, settled it as well as you could, and stayed unsure. That makes a question with your evidence built in: "I had to choose between a **[[fixed final time and a free one|fixed-free-time]]** on a descent solve, and I went fixed because I wanted a baseline in a week — with a real vehicle, where does that line actually sit?"

It shows the decision existed, that you made it, and that you know what it cost. And it is a question you want answered, by construction.

**From the boundary of what you can see from outside.** This is the previous lesson's move: name the thing you could not work out from public information, and ask about it. "From outside I cannot tell how much of the approach decision-making sits on the vehicle and how much on the ground — as much as you can say, where is that line?" The phrase *as much as you can say* does real work. It marks someone who understands there are things they cannot be told.

**From the seams of the role family.** A **[[seam|seams]]** is a boundary where two teams' work meets. This track's role-families module maps them: between GNC analysis and flight software, between design and verification, between the vehicle team and the subsystem teams. Seams are where organizations differ most, and where a new engineer's daily life is really decided. "Who owns a **[[requirement|requirement]]** when the guidance design and the flight-software implementation disagree about what is feasible?" is a question about how work really happens. Its premise is that such disagreement is normal — and knowing that is what shows you have been near it.

## Calibrating so the question can be answered

Three ways a good question turns awkward.

**It asks for something that cannot be shared.** Much aerospace work is confidential or export-controlled. Add the escape clause yourself — *as much as you can say*, *at whatever level is appropriate* — and mean it. Making it easy to decline part of an answer shows you understand the limits your interviewer works under.

**It is a statement wearing a question mark.** "Have you considered using a two-stage formulation to handle the unreachable-target case?" is advice from someone who does not know the system, dressed up as curiosity. The version that works drops the recommendation and keeps the curiosity: "How do you handle the case where the target is not reachable at all — is that a formulation problem or an operations one?"

**Its answer is published.** Asking something you could have found in ten minutes spends your question and tells the listener you did not spend the ten minutes. The legitimate exception is asking for the inside view of something published — and saying so: "I have read the convexification paper; what I cannot tell from it is how much of the practical difficulty is in the solver and how much is in getting the problem data good enough."

::: warning The list is not the point
A prepared list is a safety net, not a script. If something in the conversation genuinely interests you, ask about that instead. A question that grows out of what the person just said beats anything you wrote down: it proves you were listening, and it is guaranteed to be one you want answered. The screens module covers following an answer at length. The point here is that your three prepared questions exist so you are never stuck — not so they all get asked.
:::

## Two kinds of question, and both are yours

The questions in this lesson show understanding of the work. The questions in lesson 10 — what a normal week looks like, how often a heavy period happens, what happened the last time a deadline slipped — gather the information you need for your own decision.

Both are legitimate and do different jobs; do not let either crowd out the other. Ask only about pace, and you spent your questions on your own logistics. Ask only about technical seams, and you will decide on the offer with no information about the life. If you get two questions, one of each is a sensible split. Across a process with several people, **allocate** deliberately:

- technical seams to the engineers whose work they are;
- pace and behavior under stress to the people who live it;
- process and timeline to the recruiter.

::: example Five questions, graded on their premises
**1. "What does a typical day look like for someone in this role?"**

Premises: that there is a role and it has days. Anyone can ask it; the answer tends to be a generality. Harmless, and no evidence. If you want the calibrated version, lesson 10's form — what did your last three weeks actually look like? — asks for facts instead of a summary.

**2. "What language is the flight software written in?"**

Premises: none that are not on a posting or in a public talk. The answer can be looked up, so asking spends a question on something you could have known. The interesting version is about the constraint, not the choice: "What does the real-time side impose on how you write analysis code — do model implementations have to be written twice, or does the same code run in both places?"

**3. "Have you thought about using lossless convexification for the thrust bound, rather than relaxing it?"**

Premises: that the team may not have considered a standard technique. This is outside advice shaped as a question, and it is the one on this list that actively costs you. The knowledge behind it is real, which makes the phrasing such a waste. "How much of the practical difficulty in a descent solve is the formulation, and how much is getting the problem data good enough?" shows the same understanding and asks something the person can actually answer.

**4. "What is the hardest technical problem your team is working on right now?"**

Premises: that there is a hard problem, which is safe, and that it can be described to an outsider, which may not be true. It is close to good, but it makes the other person do all the work of finding common ground. Narrowing it to your area fixes that: "Within attitude estimation specifically, what part is still genuinely hard — the sensor side, the consistency of the estimator across a fleet, or keeping the thing maintainable?"

**5. "I built a batch orbit-determination fit, and what surprised me was that convergence was a geometry problem long before it was a numerical one — I only caught it by checking the conditioning before trusting the fit. On a real tracking problem, how much of the work is actually about geometry and scheduling versus estimator design?"**

Premises: that the candidate has fitted real data; that conditioning can be checked in advance; that **[[observability|observability]]** is a property of geometry; and that on a real system the tracking schedule is a design choice. Each is true of someone who has done the work and awkward to fake. It is also a question she really wants answered, and it hands the other person something easy and interesting to talk about. That is the practical difference between a question that opens a conversation and one that closes it.

Tally: one of five (number 5) passes both tests as written; two (2, 4) can be rescued; one (1) is empty; one (3) costs you.
:::

::: example What to do with the answer
**Candidate:** "When a model moves from an engineer's analysis into the flight-software-in-the-loop simulation, how much gets reimplemented and how much runs as the same code?"

**Engineer:** "It depends on the model. Some things run as the same code, some get reimplemented because the analysis version uses libraries we would not fly. The reimplemented ones are where we spend most of our verification effort."

**The weak continuation:** "That makes sense. Great, thanks — my next question was about…" The candidate treated a real answer as a box to tick. The engineer said something specific and slightly weary — *that is where we spend most of our verification effort* — and nobody followed it.

**The strong continuation:** "That is the part I would have guessed is expensive. When a reimplementation is verified against the analysis version, is that a numerical equivalence check to a tolerance, or is it done at the level of behavior — the same test cases producing the same decisions?"

**Engineer:** "Both, depending on what it is. Equivalence where we can, behavior where the model is stochastic or the implementation genuinely differs."

**Candidate:** "That is useful, because it is exactly the thing I got wrong on my own simulation. I rewrote my integration inner loop for speed and changed the step size at the same time, and I did not re-run the analytic case, so I shipped a build that gave different loads. That is why everything I build now has a stored **[[nominal case|nominal-case]]** that has to reproduce before I merge — and what you are describing sounds like the same idea with a verification budget behind it."

**What happened in three exchanges:** she followed the answer, not her list. She asked a second question with sharper premises. Then she offered something of her own that was relevant and honest, including a failure. None of it came from a script beyond the opening question.

**One thing to notice:** she did not ask a third question. Following one question two levels down is worth more than asking three unrelated ones. It is also where the material for the **[[follow-up note|follow-up-note]]** comes from — the screens module's point that a note referring to something specific from the conversation is the only kind worth sending.
:::

## Check yourself

::: check
Why does this lesson argue that a question shows understanding through its premises rather than through its content?
:::

::: answer
Because premises cannot be borrowed convincingly. Content can: anyone can name a technique they have read about, and showing off knowledge inside a question — "have you considered lossless convexification?" — usually reads as display, not curiosity.

A question with specific premises — say, one that assumes models cross between analysis and flight environments and that rewriting them has a cost — only makes sense if the asker holds those premises, and holding them is the evidence. It is also a more comfortable way to be judged: you ask about something you really do not know instead of performing something you do.
:::

::: check
You have written eight questions. Using this lesson's second test, how do you get down to three?
:::

::: answer
Ask of each one whether you would really rather know the answer than not — not whether it sounds good or shows something about you. Most prepared lists collapse under that test, because half the entries were written to impress rather than to find out.

The survivors are usually tied to something specific in your history: a decision you got stuck on, something you could not resolve from public sources, a seam you have already been caught in. The filter matters because of the follow-up: a question you care about has a natural next move, and one you do not care about leaves you silent the moment it is answered.
:::

::: check
Rewrite this so that it stops being advice: "Have you considered running your consistency tests over a Monte Carlo rather than a single run?"
:::

::: answer
Drop the recommendation, keep the curiosity, and make it something you really do not know: "When you check an estimator's consistency, is that done over a Monte Carlo set or against flight data from a single run — and if it is flight data, how do you get a distribution out of it?"

Its premises show you know the difference between the state-error test (NEES) and the innovation test (NIS), and why the state-error test is not available outside simulation — it needs the true state, which only a simulation knows. And it hands the other person an interesting question instead of an implied criticism of their practice.
:::

::: check
Why does this lesson say to allocate question types across the people you meet, rather than asking everything of everyone?
:::

::: answer
Because different people answer different things well, and your questions are limited — usually one or two per conversation. Engineers can tell you about seams, about what is really hard in their area, and about their own last three weeks. The recruiter is right for process, policy and timelines. Asking an engineer about the formal interview process wastes a rare chance, and asking a recruiter about verification practice makes them relay something secondhand.

Allocating also prevents the two failure shapes: asking only about pace and learning nothing about the work, or asking only about the work and facing the offer with no information about the life.
:::

::: check
An engineer gives you a short, slightly weary answer with one specific detail in it. What is the move?
:::

::: answer
Follow the detail. A specific detail offered without prompting is usually the part the person finds real, and asking about it is more interesting to them and more informative to you than your next list item.

Sharpen rather than broaden: take the thing they named and ask how it actually works, what it costs, or where the line is. Following one thread two levels down beats three unconnected questions. It gives you something concrete for the follow-up note, and it is the clearest proof you were listening rather than waiting to talk.
:::

::: check
Is it legitimate to ask about something that is publicly documented?
:::

::: answer
Yes, if you say you have read it and ask for the part the document does not contain. "I have read the convexification paper; what I cannot tell from it is how much of the practical difficulty is in the solver versus in getting the problem data good enough" is strong, because its premises include having read the paper and spotted what it leaves open.

What fails is asking for something the document plainly answers: it spends a question and shows the ten minutes were not spent. The difference is between asking to be informed and asking for the inside view — and saying which you are doing takes one clause.
:::

## Summary

| Source of the question | What its premises show | Example shape |
| --- | --- | --- |
| A decision you got stuck on | You faced the choice and know its cost | "I went fixed-time for a baseline; where does that line sit in practice?" |
| The boundary of public knowledge | You know what you cannot see from outside | "As much as you can say, where does that decision sit?" |
| A seam in the role family | You know where organizations really differ | "Who owns a requirement when design and implementation disagree?" |
| Something published | You read it and found what it leaves open | "I have read the paper; what it does not say is…" |
| The two tests | Could an outsider ask it? Do you want the answer? | Three questions survive both |

Allocate deliberately — seams to the engineers, pace and behavior under stress to the people who live it, process to the recruiter — and follow one answer two levels down rather than asking three unrelated questions.

That closes this module and, with it, the career track. The work now is the four exercises, not more reading: build the bank of ten stories with quantified results and no first-person plural in the Action; write the extended-hours answer you would give identically to a friend and to a hiring manager; write the sixty-second why-this-company answer with no transferable sentence in it; and put your failure story in front of someone who will push on it three times. Each produces an artifact you will use in a room — the only test of this module that matters.

::: context premise What a question takes for granted
A **premise** is something an argument or a question assumes is already true. "What time did you get home?" has the premise that you went out. The word comes from Latin for "sent before": the premise is what has to be in place before the question can be asked. That is why premises are hard to fake. You can memorize a fancy word, but you cannot easily fake knowing which things are true enough to build a question on.
:::

::: context role-family Jobs that share a toolkit
A **role family** is a group of related jobs that share skills — for example, GNC analysis, flight software, and test and verification. Companies name and split these differently, so a "GNC engineer" at one place may do work another place calls "flight dynamics." This track's role-families module maps them out. Knowing the family you are applying to tells you which problems, tools and teammates the job will involve, and that is exactly the knowledge good questions are built on.
:::

::: context fsw-in-the-loop Testing the real code in a pretend world
Engineers first build models in analysis tools, where they are easy to change. The real **flight software** — the code that will actually fly — is written separately, under strict rules. **Flight-software-in-the-loop** simulation runs that real code against a simulated vehicle and world, so it can be tested before any hardware flies.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="8" y="40" width="100" height="46"/>
    <rect x="252" y="40" width="100" height="46"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="58" y="60">analysis</text><text x="58" y="76">model</text>
    <text x="302" y="60">flight-software</text><text x="302" y="76">simulation</text>
  </g>
  <line x1="108" y1="52" x2="244" y2="52" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="252,52 242,47 242,57" fill="#1d6fd1"/>
  <text x="180" y="44" font-size="11" text-anchor="middle" fill="#1d6fd1">same code runs</text>
  <line x1="108" y1="76" x2="244" y2="76" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="252,76 242,71 242,81" fill="#b4232c"/>
  <text x="180" y="96" font-size="11" text-anchor="middle" fill="#b4232c">rewritten: must be re-verified</text>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#6c7a93">two paths a model can take</text>
</svg>
```

The question in the lesson asks which path most models take — and each rewrite is a chance for the two versions to disagree.
:::

::: context fixed-free-time When must the landing happen?
In a landing (descent) problem, the computer finds a thrust plan that brings the vehicle down gently. You can tell it exactly how many seconds the landing takes — **fixed final time** — or let it choose the duration too — **free final time**. Fixed is simpler and quicker to solve, which is why a student might pick it for a first working version. Free usually saves fuel, but the problem gets harder. You will meet both in the optimization module.
:::

::: context seams Where teams meet
Picture a quilt: the patches are the teams, and the stitched lines between them are the **seams**. Problems love seams, because each side can assume the other is handling something.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5">
    <rect x="10" y="20" width="100" height="44"/>
    <rect x="130" y="20" width="100" height="44"/>
    <rect x="250" y="20" width="100" height="44"/>
    <rect x="70" y="92" width="100" height="44"/>
    <rect x="190" y="92" width="100" height="44"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="47">GNC analysis</text>
    <text x="180" y="47">flight software</text>
    <text x="300" y="47">verification</text>
    <text x="120" y="119">vehicle team</text>
    <text x="240" y="119">subsystems</text>
  </g>
  <g stroke="#b4232c" stroke-width="3">
    <line x1="120" y1="20" x2="120" y2="64"/>
    <line x1="240" y1="20" x2="240" y2="64"/>
    <line x1="180" y1="92" x2="180" y2="136"/>
  </g>
  <text x="180" y="14" font-size="11" text-anchor="middle" fill="#b4232c">red lines: seams</text>
</svg>
```

Asking who owns a problem at a seam shows you know the seams exist.
:::

::: context requirement The written promise a design must keep
A **requirement** is a precise written statement of what a system must do — for example, "the vehicle shall land within a set distance of the target." Big engineering projects run on thousands of them, and each has an owner. Trouble starts when two teams read a requirement differently, or when one team's design cannot meet what another team needs. Asking who settles those disputes is asking how the organization really works.
:::

::: context observability Can the data even see it?
A quantity is **observable** if your measurements contain enough information to work it out. Imagine judging how far away a friend is using only a straight-on photo: you see left and right, but hardly any depth. Tracking a satellite by measuring angles from stations that all look at it from nearly the same direction has the same weakness — the data barely constrain some directions. That is why *when* and *from where* you take measurements (the tracking schedule) can matter more than the cleverness of the estimator.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="30" r="7" fill="#1f2a44"/>
  <text x="194" y="34" font-size="12" fill="#1f2a44">satellite</text>
  <line x1="20" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="160" y1="140" x2="180" y2="30"/>
    <line x1="180" y1="140" x2="180" y2="30"/>
    <line x1="200" y1="140" x2="180" y2="30"/>
  </g>
  <g fill="#1d6fd1"><rect x="154" y="134" width="12" height="12"/><rect x="174" y="134" width="12" height="12"/><rect x="194" y="134" width="12" height="12"/></g>
  <text x="180" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">three stations, almost one viewpoint</text>
  <line x1="60" y1="60" x2="60" y2="110" stroke="#b4232c" stroke-width="2"/>
  <polygon points="60,54 55,64 65,64" fill="#b4232c"/><polygon points="60,116 55,106 65,106" fill="#b4232c"/>
  <text x="70" y="82" font-size="11" fill="#b4232c">depth (angles only):</text>
  <text x="70" y="96" font-size="11" fill="#b4232c">poorly seen</text>
  <line x1="250" y1="85" x2="330" y2="85" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="244,85 254,80 254,90" fill="#1d6fd1"/><polygon points="336,85 326,80 326,90" fill="#1d6fd1"/>
  <text x="290" y="76" font-size="11" text-anchor="middle" fill="#1d6fd1">across: well seen</text>
</svg>
```
:::

::: context nominal-case A known answer to check against
A **nominal case** is a standard, ordinary test run whose correct result you have saved. After any change to the code, you re-run it and check that the result still matches. An **analytic case** is even better: a situation simple enough that you can work out the exact answer with pencil and paper, such as an orbit with no disturbances. If a code change makes either one come out different, something broke — which is exactly what the candidate's skipped check would have caught.
:::

::: context follow-up-note The short message after the interview
Many candidates send a brief note to the people who interviewed them, usually by email within a day. A generic "thank you for your time" is forgettable. A note that mentions something specific — "your point about spending most of the verification effort on reimplemented models stuck with me" — proves you were paying attention, and reminds the reader who you were among many candidates. The screens module covers what to write and when.
:::
