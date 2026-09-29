---
id: l02-the-action-section
title: "The Action section, in the first person singular"
minutes: 22
covers:
  - "STAR structure: Situation, Task, Action, Result, and the common failure of spending most of the answer on Situation"
---

Think of a school science fair. Your group of four built a volcano that really erupts, and it won. Now a judge walks up to you alone and asks, "What did *you* do?" If you answer, "We mixed the chemicals, we built the cone, we painted it," the judge still has no idea whether you designed the reaction or held the paint pot. The volcano was real. The win was real. And your answer told her nothing about you.

That is the problem this lesson fixes. The Action is about sixty percent of a ninety-second story and the part being judged. The previous lesson dealt with the first way it fails — the scene eats it. The second is subtler, survives every timing fix, and catches engineers who did excellent work on good teams.

It is the pronoun. An Action told as *we* describes a team's work, and a listener cannot score a team. This module says it without hedging: using *we* throughout makes your contribution **unassessable** — impossible for the listener to judge — and that is the single most common reason a technically true story scores badly. The story can be accurate and the engineering sound, and the answer still says nothing about the person answering.

What makes this hard is that *we* is usually a good habit. It is how you talk in a **[[stand-up|stand-up]]** meeting, how you write a paper, and how a decent colleague describes shared work. You are not being asked to drop it. You are being asked to be precise about one **[[seam|seam]]** — the line where your part ends and someone else's begins — in a room where nobody else is there to describe it.

## Why *we* costs you the answer

The reason tells you how far to take the fix. An interviewer has your ninety seconds plus a few follow-ups to work out what *you* would do on their team. Take a sentence like "we decided to re-formulate the guidance problem with a **[[free final time|free-final-time]]**." It fits three very different candidates:

- the one who proposed it,
- the one who built it after someone else proposed it,
- the one who was in the room.

Nothing in the sentence tells them apart. The listener can assume the best, assume the worst, or spend a follow-up finding out. Usually it is the follow-up — one of your few questions, spent on something your own sentence should have settled.

There is a second cost. A *we*-story tends to lose the **decisions** along with the credit. The natural grammar of group storytelling is a sequence: we did this, then we did that, then it worked. Decisions get flattened into events.

So the fix is not cosmetic. Rewriting an Action in the **[[first person singular|pronoun-grid]]** — with *I* as the subject — usually forces you to remember what you actually decided. And the decisions are what the section needed all along.

::: key
The Action section is narrated in the first person singular because the interviewer is assessing you, not the team. Using *we* throughout makes your contribution unassessable, which is the single most common reason a technically true story scores badly. Credit belongs in the Situation and the Result; the Action is yours.
:::

## Where *we* is correct

The rule is about one section. Apply it everywhere and you get a candidate who seems to have built a launch vehicle alone.

**Situation and Task take *we* naturally.** "We had three weeks before the design review and the campaign had never been run end to end" is scene. It is true, and the plural is right. Your Task sentence then draws the line: "I owned the dispersion set and the pass criterion."

**The Result can take *we*, and often should.** "We hit the review date with the campaign complete" gives the team the outcome. That costs you nothing, because the Action has already shown what you did.

**Naming other people by role is a strength.** "Our propulsion lead gave me a thrust-misalignment tolerance from the hardware spec, and I dispersed against that rather than against a number I made up." That sentence is in the first person singular *and* credits someone else specifically. It sounds like a person who knows where their own work ended.

::: warning The verbs that erase you
Watch for *helped*, *was involved in*, *worked on*, *was part of*, *contributed to*, *supported*. Each one names a relationship to some work instead of the work itself. "I helped with the verification" could mean you designed the whole verification plan or ran someone else's script twice. Swap in what you actually did: decided, derived, measured, wrote, rejected, re-scoped, escalated, rewrote, tested, found. If none of those verbs is true for a piece of work, that piece belongs to someone else — say whose, instead of blurring it.
:::

## The two ways this goes wrong

There are two failures, pulling in opposite directions, which is why "always say *I*" is not enough.

**Erasure** is the one described so far: work you did, told as the team's, leaving nothing to judge.

**Inflation** is its mirror image: work the team did, told as yours. It is one of the red flags a later lesson covers, and the fix for erasure, done carelessly, *produces* it. Take a story about a four-person project, turn every *we* into *I*, and you have not made it assessable. You have made a claim you cannot defend three questions deep — in a round where three questions deep is normal.

What satisfies both at once is **precise attribution**: say what was yours and what was not, in the same breath, and never leave the boundary to the listener's imagination. Precision makes a modest contribution sound believable and an inflated one suspicious, so an honest small contribution often lands better than a puffed-up large one.

## Finding the seam

Here is a method that takes about twenty minutes per story.

1. Write the Action out in plain sentences, however it comes.
2. Rewrite every sentence to start with *I*. Some will work as they stand. Some will feel like a lie.
3. For each one that felt like a lie, decide which of two things is true: you do not remember exactly what you did, or the work was genuinely shared.
4. If you do not remember, go and look. Your own **[[commit history|commit-history]]**, your notes, the write-up from the portfolio module — the record exists, and twenty minutes is worth it, because a vague memory becomes a vague sentence.
5. If the work was shared, narrow the claim until it is exactly true, and name who did the rest. "I did not write the solver interface — that was my project partner. What I owned was the constraint-checking layer, and the reason it exists is that I did not trust an *optimal* status flag to mean the returned trajectory actually satisfied the **[[glide-slope constraint|glide-slope]]**."

Step 5 pays most. A narrow, exactly true claim with its reason attached beats a broad one, because only the person who did the work would think to give that reason.

## Answering the follow-up before it is asked

If your Action is precise, *what did you personally do?* is already answered, and the interviewer can spend the follow-up on the engineering instead.

One useful habit: put the seam sentence **early**. "The part that was mine was the estimator itself," said first, means every decision after it is already scoped, and you never have to go back and qualify. It is the past-project round's contribution question, squeezed into ninety seconds with no slides.

## The solo-project problem

If your best evidence is a portfolio you built alone, every sentence is already *I*. The risk is the opposite: sounding like someone who has never worked with anyone.

Do not invent a team. Do notice that solo projects almost always contain real collaboration that goes unmentioned: the person who reviewed your code, the forum thread where someone told you your covariance was wrong, the club teammate you talked through a derivation with, the maintainer whose reply to your issue changed your approach.

Name one specifically and say how it changed what you did. That shows what a team story shows: you look for a check on your work and act on it. "I asked a friend who does estimation professionally to look at my consistency test, and she pointed out I was averaging the normalized error over runs that were not independent" is a collaboration sentence. It is also true, which an invented team would not be.

::: example An Action rewritten, sentence by sentence
The question: *Tell me about a time you owned a piece of technical work end to end.*

**As first drafted — five sentences, nine uses of *we*, one assessable claim:**

"We built a batch least-squares orbit determination tool for the club. We were fitting to positions derived from public [[two-line element sets|tle]], and we had some trouble getting it to converge at first. We looked at the geometry and realized the problem was that we only had one station, so we added more. After that we got it converging nicely and we validated it against a known case. We presented it at the end-of-term showcase and it went well."

**Diagnosed.** The listener knows a club built an orbit-determination tool — a program that works out a satellite's orbit from measurements. They do not know whether this candidate wrote the estimator, ran the fits, diagnosed the problem, or made the slides. *We looked at the geometry and realized* is the turning point of the whole story, and it is credited to four people. *It went well* is not a result.

**Rewritten — same events, nothing inflated:**

"I owned the estimator — the Gauss-Newton iteration, the convergence criteria, and the covariance we reported. Two others on the team handled the data ingest and the plotting.

My first version diverged by the second iteration, and the velocity states ran off to physically absurd values. My instinct was that I had a bug in the Jacobian, and I spent an afternoon looking for one that was not there. What actually fixed it was stopping and computing the [[condition number|condition-number]] of the normal matrix at the true state before fitting anything: it came out around ten to the eighteen, so one state direction was effectively unobservable from range-only data to a single station on a nearly straight-line pass. That is a geometry problem, not a code problem.

I re-ran with three more stations at distinct bearings. The condition number dropped to the order of ten to the five, and the fit converged in four iterations, with the RMS residual settling near the fifty-meter measurement noise level I had assumed. I now compute the conditioning before I trust any fit, and the tool reports it on every run."

**What changed.** The seam is named in the first sentence, so nothing later needs qualifying. The diagnosis is credited to the person who made it. The wrong first instinct costs nothing and makes the right one believable. And the Result is a number against a standard, not a promise that it went well.

**Sanity check.** The condition number fell from about $10^{18}$ to about $10^{5}$ — thirteen powers of ten, from "hopeless" to "fine" for ordinary computer arithmetic. A fit error near the assumed 50 m noise is what a correct fit should give: it matches the data about as well as the data allows, and no better.
:::

::: example Telling a joint decision without inflating or disappearing
The question: *Tell me about a technical decision you made with someone else.*

**The inflated version:** "I decided we should use a fixed final time for the descent solve, because it is much simpler to implement and I wanted to get a working baseline before adding complexity."

If the decision was really joint, this will not survive the follow-up *what was the argument against it, and who made it?* — and being caught costs far more than the exaggeration gained.

**The erased version:** "We decided to use a fixed final time because it was simpler."

Now nothing is assessable, and the reasoning vanished along with the credit.

**The precise version:** "My project partner and I disagreed about this one. She wanted a free-final-time formulation from the start because it is what a real descent guidance architecture needs, and she was right about that. My argument was that a fixed-time solve would let us get an end-to-end result in a week and give us a baseline to measure the harder version against, and that is what we did.

What I owned after that was the dispersion campaign, and it settled the argument in her favor with a number: across five hundred dispersed cases, four percent came back [[infeasible|infeasible]] — no trajectory exists that meets both terminal conditions inside the actuator bounds in exactly twenty seconds. A fixed-time formulation has no way to ask for more time, so those cases fail outright. I reported the infeasible fraction as the headline result rather than the mean landing accuracy, because it was the number that actually told us something, and we moved to the two-stage formulation after that."

**Sanity check on the number.** Four percent of 500 is $0.04 \times 500 = 20$ cases — few enough to look at one by one, and too many to wave away.

**Why the precise version is strongest.** It is exactly true, so it survives any follow-up. It gives the other person credit for being right, which reads as confidence, not weakness. It still holds a plainly owned contribution: the argument for doing the simple version first, the campaign, and the choice of which number to report. And it shows what the round is looking for far better than winning the argument would have: an engineer who let evidence settle a disagreement and said so.
:::

## Check yourself

::: check
A candidate says: "I was involved in the verification effort for the simulation, and we made sure everything was checked properly before we used it." Rewrite the sentence, and say what information you would need from the candidate to do it.
:::

::: answer
As written, it names a relationship to work, not work: *involved in* and *made sure* could mean anything from designing the verification plan to attending the meetings. To rewrite it you need three things: which checks the candidate personally designed or ran, what the pass criterion was, and what the checks actually returned.

A repaired version: "I wrote the verification section — an analytic two-body case the propagator had to reproduce to a stated tolerance, an energy-conservation check over the full run, and a step-size convergence study. The convergence study is the one that mattered: it showed my default step was too coarse above about forty kilometers, so I tightened it before anyone used the results." Same event, now assessable.
:::

::: check
Why is it acceptable — sometimes better — to use *we* in the Result, when the whole lesson argues for the first person singular?
:::

::: answer
Because the pronoun rule exists to make your contribution assessable, and by the Result the Action has already done that. Giving the team the outcome then costs you nothing, and it sounds like someone comfortable sharing credit — a very different signal from someone who cannot say what they did. The order matters: credit *after* attribution is generosity; credit *instead of* attribution is vagueness.
:::

::: check
A candidate rewrites a four-person project story so that every sentence begins with *I*. What has she fixed, what has she broken, and what test would have caught it?
:::

::: answer
She has fixed the assessability problem and created an accuracy problem. She now claims work that belonged to three other people, which is the inflated-contribution red flag this module names.

The test is whether each sentence survives a follow-up three questions deep: can she describe the design of the thing she claimed, the alternatives she rejected, and why? Any sentence that fails should be narrowed until it is exactly true, and the rest credited to whoever did it. Precise attribution, not maximum attribution, is the standard that satisfies both.
:::

::: check
Your strongest evidence is a portfolio you built alone. An interviewer asks for a time you worked with someone on a technical problem. What do you do?
:::

::: answer
Find the real collaboration inside the solo work instead of inventing a team. Nearly every serious independent project contains a check by someone else: a review, a forum answer, a professional who looked at your filter, a teammate you talked a derivation through with.

Name the person by role, say what they told you, and say exactly what you changed as a result — the change is the part that shows collaboration, not the conversation. If the honest answer is that the interaction was small, say so and say what you would do differently now. That beats a made-up group project that falls apart at the first follow-up.
:::

::: check
Explain, from the mechanism rather than the rule, why rewriting an Action in the first person singular often improves it even when nobody was going to ask about credit.
:::

::: answer
Because group storytelling has a grammar that flattens decisions into events. "We looked at the geometry and realized the problem" is about something that *happened*. "I computed the condition number before fitting anything, because my first instinct had been wrong" is about something someone *chose* to do, and it carries the reasoning with it. Forcing every sentence into *I* makes you find the decision behind each step — and the decisions are what the Action section is supposed to contain. The credit fix and the content fix are the same edit.
:::

::: check
An interviewer follows up: "You keep saying you owned the estimator — what did the other two actually do?" How should you read this question, and what makes a good answer?
:::

::: answer
Read it as a check on precision, not an accusation. It is the natural question for someone who drew a clear boundary — and you drawing one is why it can be asked at all.

A good answer is specific and generous. Name what the other two did, in the same concrete terms you used for your own work, and say where their work made yours possible: "One wrote the ingest that turned the element sets into positions in a consistent frame, which is the part I would have got wrong, and the other did the visualization we used to spot the outlier pass." That answers the question and confirms your original boundary was real. A vague answer that shrinks their part does the opposite, and leaves the interviewer doubting the boundary you drew.
:::

## Summary

| Section | Pronoun | Why |
| --- | --- | --- |
| Situation | *We* is natural | Context belongs to the team and the project |
| Task | *I* | This is the sentence that draws the seam |
| Action | *I* throughout | The part being assessed; *we* makes it unassessable |
| Result | Either; *we* is generous | Credit is already established |
| Crediting others | *I* sentence, named role | "X gave me the tolerance; I dispersed against it" |
| Two failures | Erasure and inflation | Unassessable versus indefensible |

Precise attribution — what was mine, what was not, said in the same breath — is the only position that survives three follow-up questions. The next lesson takes the other half of a strong Result, the number in it: where it comes from, what to do when you never measured one, and why a checkable result beats an impressive one.

::: context stand-up The meeting where everyone stands
A stand-up is a short daily team meeting, often held standing so nobody gets comfortable and it stays brief — ten or fifteen minutes. Each person says what they did yesterday, what they will do today, and what is blocking them. Software and engineering teams everywhere use it. In a stand-up, *we* is natural and friendly: the point is the team's progress. That habit is exactly what leaks into interview answers, where the point is you.
:::

::: context seam Where two pieces of cloth meet
In sewing, a seam is the stitched line where two pieces of fabric are joined. You can see exactly where one piece stops and the next begins. In your story, the seam is the line between your work and your teammates' work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="150" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="20" width="150" height="80" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="174" y1="26" x2="186" y2="34"/><line x1="174" y1="40" x2="186" y2="48"/><line x1="174" y1="54" x2="186" y2="62"/><line x1="174" y1="68" x2="186" y2="76"/><line x1="174" y1="82" x2="186" y2="90"/>
  </g>
  <text x="105" y="56" font-size="13" fill="#1f2a44" text-anchor="middle">mine: the estimator</text>
  <text x="255" y="56" font-size="13" fill="#1f2a44" text-anchor="middle">theirs: ingest, plots</text>
  <text x="180" y="120" font-size="12" fill="#b4232c" text-anchor="middle">the seam: say where it is</text>
</svg>
```

A good Action names both sides of the seam, so the listener never has to guess.
:::

::: context free-final-time Letting the computer pick the landing time
Guidance software for a landing rocket solves a problem like: "find the engine commands that bring the vehicle to the pad, upright and slow, using as little fuel as possible." With a **fixed final time**, you also tell it *when* to arrive — say, in exactly 20 seconds. With a **free final time**, the arrival time is one more thing the solver chooses. That is harder to set up, but more flexible: if 20 seconds is not enough, the solver can take 22. Reusable boosters face this kind of problem on every landing.
:::

::: context pronoun-grid Grammar's names for who is talking
Grammar sorts pronouns by *person* (who is speaking or being spoken to) and *number* (one or many). "First person" is the speaker; "singular" is one. So the first person singular is *I*, and the first person plural is *we*.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="190" y="20" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">singular</text>
  <text x="300" y="20" font-size="12" fill="#1f2a44" text-anchor="middle" font-weight="700">plural</text>
  <text x="20" y="58" font-size="12" fill="#1f2a44" font-weight="700">first person</text>
  <text x="20" y="108" font-size="12" fill="#1f2a44" font-weight="700">second person</text>
  <rect x="135" y="30" width="110" height="44" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="245" y="30" width="110" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="135" y="80" width="110" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="245" y="80" width="110" height="44" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="57" font-size="14" fill="#fff" text-anchor="middle" font-weight="700">I</text>
  <text x="300" y="57" font-size="14" fill="#1f2a44" text-anchor="middle">we</text>
  <text x="190" y="107" font-size="14" fill="#1f2a44" text-anchor="middle">you</text>
  <text x="300" y="107" font-size="14" fill="#1f2a44" text-anchor="middle">you (all)</text>
</svg>
```

The Action section lives in the dark blue square.
:::

::: context commit-history Your work's own diary
Engineers keep code in a version-control system such as Git. Each time you save a meaningful change, you make a **commit**: a snapshot with your name, the date, and a short message saying what you changed. The list of all commits is the commit history. It is a precise, time-stamped record of who did what — which makes it the best memory aid you have when you need to recall exactly which part of a project was yours.
:::

::: context glide-slope A cone the landing must stay inside
A glide-slope constraint says a landing vehicle must stay inside an upside-down cone that rises from the landing pad. Near the ground the cone is narrow, so the vehicle cannot swoop in low from the side and clip terrain or the pad's edges. A trajectory can come back from a solver labeled "optimal" and still break a constraint like this if the problem was set up wrong — which is why an engineer might write a separate check that tests the answer, not the label.
:::

::: context tle Public orbit data in two lines of text
A two-line element set, or TLE, describes a satellite's orbit in two 69-character lines of numbers. The US Space Force publishes them for many thousands of tracked objects, and anyone can download them. Students often use positions computed from TLEs as practice "measurements" for orbit determination, because real tracking data is harder to get. They are approximate — good for learning, not for precision work.
:::

::: context condition-number One station cannot see everything
The condition number measures how close a problem is to having no single answer. A small number means the measurements pin the solution down well. A huge one — like $10^{18}$ — means some combination of unknowns barely changes the measurements at all, so it cannot be recovered. Measuring only range from one station on a nearly straight pass is like judging where a car is from one spot using distance alone: many positions give almost the same readings. Stations at different bearings look from different directions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="30" x2="160" y2="30" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="90" cy="30" r="5" fill="#1d6fd1"/>
  <polygon points="90,110 83,122 97,122" fill="#1f2a44"/>
  <line x1="90" y1="110" x2="90" y2="36" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="90" y="140" font-size="12" fill="#b4232c" text-anchor="middle">one station</text>
  <line x1="200" y1="30" x2="340" y2="30" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="270" cy="30" r="5" fill="#1d6fd1"/>
  <polygon points="215,110 208,122 222,122" fill="#1f2a44"/>
  <polygon points="250,110 243,122 257,122" fill="#1f2a44"/>
  <polygon points="290,110 283,122 297,122" fill="#1f2a44"/>
  <polygon points="325,110 318,122 332,122" fill="#1f2a44"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="215" y1="110" x2="267" y2="35"/><line x1="250" y1="110" x2="268" y2="36"/><line x1="290" y1="110" x2="272" y2="36"/><line x1="325" y1="110" x2="273" y2="35"/>
  </g>
  <text x="270" y="140" font-size="12" fill="#1d6fd1" text-anchor="middle">four stations</text>
</svg>
```
:::

::: context infeasible When no answer exists at all
In optimization, a problem is **infeasible** when no solution satisfies all the rules at once. It is different from a poor solution: there is nothing to find. For a landing burn, the rules might be "arrive at the pad, stopped, in exactly 20 seconds, without asking the engine for more thrust than it has." If the vehicle starts too high or too fast, no set of engine commands can meet all of those together. The honest thing is to count those cases, not hide them.
:::
