---
id: l11-the-why-spacex-answer
title: "The why SpaceX answer, with information in it"
minutes: 22
covers:
  - the why SpaceX answer that is not a recital of the mission statement
---

Think about two birthday cards. One says, "Happy birthday! You are a great friend!" The other says, "Happy birthday! I still laugh about your model rocket landing in the pool — this year I want to see the two-stage one fly." The first could go to anyone. Only the second shows you know *this* person.

*Why SpaceX?* works the same way. It is asked in almost every process, and candidates prepare for it least, because it feels soft. It has no past situation in it, but it belongs in this module: it succeeds or fails for the same reason every answer does — whether it contains anything only you could have said.

The default answer is the **[[mission statement|mission-statement]]** — the short public sentence about what a company is for. Making life multiplanetary. The most important project of the century. Being part of something that matters. This module is blunt about why that fails: reciting the mission statement is what everyone does, which makes it worth nothing as a **[[signal|signal]]** — a piece of information that tells one candidate apart from another.

That is not a criticism of the mission, or of caring about it. It is a point about information. An answer anyone could give after reading a website's front page cannot separate one applicant from another. It uses up sixty seconds and leaves the listener where they started.

::: key
A why-this-company answer names a program, names a technical problem, and connects it to evidence you have built. Reciting the mission statement is what everyone does, which makes it worth nothing as a signal.
:::

## The three components

**A program.** Something specific enough to have its own engineering problems: a vehicle, a **[[constellation|constellation]]** of satellites, a spacecraft, a phase of flight. "Space" is not a program. Naming one commits you, and that is the point. It gives the listener somewhere to take the conversation, and it shows you have a view about which problems you want, not a general enthusiasm.

**A technical problem.** The thing you would actually want to work on, described the way an engineer would describe it. This part most cleanly separates a candidate who has thought about the *work* from one who has thought about the *company*, because a problem cannot be copied off a careers page.

**Evidence you have built.** The link back to your own work turns the answer from an interest into a direction. It also makes your behavioral answers and your technical answers describe the same person. If the project you defended in the past-project round and the problem you name here point the same way, the whole process reads as one coherent engineer — not a set of separately rehearsed performances.

## Finding your program and problem honestly

Work *outward* from your own evidence, not *inward* from the company. The other route — pick the most famous program, then hunt for a reason — produces an answer that sounds exactly like what it is.

**Start with what you built and what was hard about it** — the problem inside it that held your attention. Was it that the estimator had to be honest about its own uncertainty? That the trajectory had to be recomputed under limits, in real time? That the disturbances pushing on the vehicle drove the whole design?

**Name the class of problem** — the general kind it belongs to. For example:

- attitude estimation (working out which way a spacecraft points) with limited or on-and-off references;
- guidance under thrust and pointing limits, with a hard condition at the end;
- momentum management in a disturbance environment you do not control;
- relative navigation next to an object that is not cooperating with you.

**Then find where that class of problem lives.** A vehicle that lands under its own power has an entry-and-landing guidance problem. A large constellation in low orbit has an attitude and momentum problem at a scale that changes its character: whatever one spacecraft needs must work without anyone giving that spacecraft individual attention. A capsule approaching a space station has a relative-navigation and approach-safety problem. You can make these inferences from what is publicly known about what a vehicle does, and that is the right level of detail for this answer.

**Read something specific about the engineering.** This module recommends Eric Berger's **[[*Reentry*|reentry-book]]** for exactly this, because it is concrete about what the programs actually did rather than about what the company is for. Published technical papers are the other source. The **[[lossless-convexification|lossless-convexification]]** work behind modern powered-descent guidance, which this curriculum's portfolio module uses as a basis for an anchor project, is a paper you can read, implement, and then have an opinion about.

::: warning Do not claim knowledge you cannot have
You can know what is publicly documented: what vehicles do, what has flown, what has been published. You cannot know how a team works inside, what is on its roadmap, or which problems it finds hard this quarter. A candidate who speaks confidently about any of that is making a claim the person across the table can check on the spot.

It takes two forms. **Flattery** — telling engineers how extraordinary their work is — says nothing about you and puts them in an awkward position. **Assumed inside knowledge** — describing, from outside, what their current challenges must be — risks being wrong in an especially unhelpful way. The safe and strong form: say what you find interesting about a publicly known problem, and ask about the parts you cannot see.
:::

## The transferability test

This module's third exercise gives the test in one line: the answer must contain no sentence that could be copied unchanged onto an application to a different company.

Run it as an edit, not a judgment. Write the answer out. Then go through it sentence by sentence and cross out every sentence that would survive a **[[find-and-replace|find-and-replace]]** of the company name. Mission sentences go. Prestige sentences go. *I want to work with the best engineers in the industry* goes. *I have always been fascinated by space* goes first of all.

What remains is your answer. If nothing remains, the fix is the research above, not better phrasing.

A harsher version: would an engineer on the program you named recognize that you have really thought about their problem? That bar is reachable — not by knowing what they know, but by having a real opinion about a real problem in their area, formed by building something next to it.

## Applying to several companies

Nothing here requires you to pretend this is the only place you applied. The answer is not a claim that this is the only company you would work for. It is a claim about what work you want and why this is a place where it happens. That can be true of several employers at once. Your answers for two companies should differ in the program and the problem while resting on the same evidence. That is what it looks like when someone knows *what* they want to work on, not only *where*.

## When the honest answer is partly about scale or pace

Sometimes the true reason is partly the **[[flight rate|flight-rate]]**, the amount of hardware, or how quickly a design becomes real. That is legitimate, if tied to work rather than atmosphere.

"I want to be somewhere that flies often, because what I am short of is contact between a model and reality — everything I have built has been checked against data I generated, or data somebody collected years ago" is specific, honest, and about engineering. "I want to be where things move fast" is a mood.

::: example The same candidate, twice
The question: *So — why SpaceX?*

**The default answer, about fifty seconds:**

"I think what you are doing is genuinely the most important thing happening in engineering right now. Making life multiplanetary is a goal I believe in, and I have followed the company since I was at school — the first booster landing is one of those things I remember exactly where I was for. I want to work with the best engineers in the industry on hard problems that matter, and I think the pace and the ambition here are unmatched. Honestly, if I am going to spend my twenties working hard on something, I want it to be this."

Every sentence is sincere, and not one is about the work. Run the transferability test and a single clause survives: the booster landing, only because it names a specific event — and nothing follows from it. This is the answer everyone gives, which is what makes it uninformative however strongly it is felt.

**The same candidate after doing the work, about a minute and a half:**

"The honest route to my answer starts with what I have built rather than with the company. The project I care most about is an attitude estimator — a **[[multiplicative EKF|mekf-nees]]** fusing gyro and star-tracker data, with a NEES and NIS consistency campaign, because what interested me was not the accuracy but whether the filter was honest about its own covariance.

That pushed me towards attitude and momentum problems, and the reason I am looking at Starlink specifically is a consequence of scale that I find genuinely interesting. A single spacecraft's momentum management is a sizing exercise; a constellation of that size cannot be a sizing exercise, because nothing that requires per-spacecraft attention survives the arithmetic. Everything has to hold across a population and across an environment that varies over a **[[solar cycle|solar-cycle]]**, and the estimator has to be trustworthy without anyone looking at its output. That is the same property I was chasing in my own filter, at a scale where it stops being a nicety.

The part I cannot see from outside is how much of that is autonomy on the spacecraft and how much is decided on the ground, and that is one of the things I would most like to ask about. What I would bring to it is the consistency-testing habit — I have built the estimator, and more to the point I have built the test that told me my estimator was lying to me."

**What changed.** A program is named, for an engineering reason, not prestige. A technical problem is named at a level an engineer would recognize. The link to her own evidence is explicit — the strongest sentence in the answer. She marks the edge of what she can know from outside and turns it into a question. And no sentence would survive a find-and-replace of the company name.

Sanity check on length: the rebuilt answer is about 240 words. At a comfortable 150 words a minute that is $240/150 = 1.6$ minutes, about 96 seconds — so in the room she would trim it toward the sixty-second target below.
:::

::: example The transferability test, run line by line
A candidate's draft, each sentence marked for whether it would survive being copied onto another application.

> "I have wanted to work in spaceflight since I was a child." — *Survives. Cut.*

> "SpaceX is doing the most exciting work in the industry and the pace of progress is extraordinary." — *Survives, with the name swapped. Cut.*

> "I am particularly drawn to the challenge of reusability and what it means for access to space." — *Survives with a small edit; several companies pursue reusability, and the sentence names no problem. Cut.*

> "My background is in estimation, and I have built a batch orbit-determination tool fitted to real tracking data." — *Does not survive as a why-this-company sentence — but it is not one. It is evidence with no destination attached. Keep, and attach it.*

> "I would love to work with the talented people at SpaceX and learn as much as I can." — *Survives. Cut, and note that it describes what she would receive, not what she would do.*

**What is left:** one sentence of evidence out of five, and nothing to attach it to. That is an accurate diagnosis: the draft was built from enthusiasm, not research.

**The rebuild, starting from the surviving sentence:**

"My background is in estimation, and the piece of work I would point at is a **[[batch orbit-determination|batch-od]]** fit to real tracking data rather than to measurements I generated myself, which is where I learned that a fit converging is not the same as a fit you can trust — the case that taught me that was a geometry problem, not a code problem, and I only found it by computing the conditioning before believing the answer.

What that makes me want to work on is navigation where the geometry is the difficulty rather than the algorithm, and the case of that I find most interesting is **[[close-proximity approach|proximity-approach]]**: the relative measurements get better as you close and the consequences of a bad estimate get worse at exactly the same rate, so the whole design is about where you put the decision points. That is a real tension, not a slogan, and it is the reason I am looking at the Dragon side rather than at launch.

What I do not know from outside is how much of the approach is autonomous and where the abort criteria actually sit, which is the first thing I would ask."

**What the rebuild shows.** The answer was never a phrasing problem. It became a real answer when the candidate connected evidence she already had to a class of problem she could name, and then to a program where that problem lives. That took research, not rewriting.
:::

## Delivering it

Aim for sixty seconds, thought through rather than recited. Use the same skeleton discipline as a story: the evidence you start from, the program, the problem, the link back, and the one thing you would ask.

End on the link or on the question, not on a statement about the company. An answer that finishes with how much you admire the work hands its last sentence — the one people remember — to a claim that says nothing about you.

## Check yourself

::: check
A candidate's answer names a program and a technical problem but mentions nothing she has built. What is missing, and why does it matter beyond this one question?
:::

::: answer
The evidence link is missing, and with it the reason to believe the interest is real rather than researched the night before. Anyone can name a program and a problem after an afternoon of reading. What cannot be put together quickly is a piece of work that put her next to that class of problem and gave her an opinion about it.

It matters beyond this question because it makes the process coherent. If the project she defends in the past-project round and the problem she names here point the same way, every round describes the same engineer. If they are unrelated, the answers read as separately rehearsed performances — and her strongest possible sentence, *I have built the adjacent thing, and here is what it taught me*, goes unsaid.
:::

::: check
Why does this lesson say the mission-statement answer fails, while also saying it is fine to care about the mission?
:::

::: answer
Because the objection is about information, not sincerity. An answer available to anyone who has read a website's front page cannot tell one applicant from another, so it spends sixty seconds and leaves the listener knowing nothing new. That is what "worth nothing as a signal" means.

Caring about the mission is fine, and one sentence about it costs little if the rest of the answer does the work. The failure is when it is the *whole* answer.
:::

::: check
Apply the transferability test to: "I want to work on hard problems with people who hold a very high bar, in an environment where engineering decisions are made quickly."
:::

::: answer
It survives a find-and-replace of the company name completely. There is no program, no technical problem, and nothing that could not be said to any employer known for pace. Cut it.

If the preference underneath is real, make it informative by tying it to work: what in your own experience makes slow decisions matter to you, and what could you do there that you cannot do now? "Everything I have built has been checked against data I generated myself, and what I am short of is contact between a model and reality" is the same preference with content in it.
:::

::: check
Why does this lesson warn against describing what a team's current technical challenges must be?
:::

::: answer
Because it is a claim about something you cannot see, made to the one person who can judge it immediately. What has flown and been published is public; roadmaps and which problems a team finds hard this quarter are not. Confident guessing is either wrong or accidentally right, and neither helps you.

The strong version stays on your side of the line: say what interests you about a publicly known problem, say plainly which part you cannot see from outside, and turn that into a question. Marking the boundary accurately is itself a signal, and it turns a gap in your knowledge into a reason for the conversation to continue.
:::

::: check
You are interviewing at three companies and genuinely want all three. Does the why-this-company answer require you to pretend otherwise?
:::

::: answer
No — and pretending is a weak position anyway, since everyone knows how job searches work. The answer is not a claim of exclusivity. It is a claim about which work you want and why this is a place where it happens.

The honest structure: the evidence half stays the same across all three, because it is your history, while the program and the problem differ, because they are specific to each place. If your three answers differ only in the company name, you have three copies of the default answer. If they differ in program and problem while resting on the same built evidence, you are someone who knows what they want to work on.
:::

::: check
Why does this lesson tell you to work outward from your own evidence rather than inward from the company?
:::

::: answer
Because the inward route — pick the most visible program, then find reasons — produces an answer that sounds assembled, and usually is. The outward route produces something that cannot be assembled: a problem you have really been next to, an opinion formed by building something, and a reason for caring that is older than the application.

It is also the only route that reliably produces the evidence link, since it starts there. And it is faster: the research is narrow — which programs have your class of problem — instead of a survey of everything a large company does.
:::

## Summary

| Component | What it looks like | What replaces it in a weak answer |
| --- | --- | --- |
| Program | A vehicle, constellation or spacecraft with its own problems | "Space", or the company as a whole |
| Technical problem | Named at the level an engineer would use | The mission, or the pace |
| Evidence link | The adjacent thing you built and what it taught you | Enthusiasm and a history of interest |
| Boundary | What you cannot know from outside, turned into a question | Confident guessing about internal work |
| Transferability test | No sentence survives a find-and-replace of the company name | Sentences that fit any employer |

The final lesson takes the other side of the same coin: the questions *you* ask, and what makes one prove you understand the work.

::: context mission-statement A company's one-line purpose
A **mission statement** is a short public sentence saying what an organization exists to do. Nearly every company has one, usually on its website's front page. SpaceX's is about making humanity able to live on other planets; NASA, universities and charities all have their own. Mission statements are useful for the people inside, because they point everyone the same way. But because every applicant can read the same page, repeating it back in an interview tells the listener nothing new about you.
:::

::: context signal Signal and noise
Engineers borrow this word from radio and electronics. The **signal** is the part of what you receive that carries the message; the **noise** is everything else. A signal is only useful if it changes depending on what is true. If every candidate says "I believe in the mission," hearing it cannot change the interviewer's view of any one of them — it is like a sensor that reads the same number whatever happens. You will meet signal and noise properly in the estimation part of this course, where a Kalman filter's whole job is to separate the two.
:::

::: context constellation Many satellites working as one
A **satellite constellation** is a group of satellites flying in coordinated orbits so that together they do a job no single one could — such as covering the whole Earth. Starlink, SpaceX's internet constellation, had thousands of satellites in low Earth orbit by the mid-2020s — more than every other operator combined. At that size, any task that needs a human to look at each satellite individually becomes impossible, which is why everything has to work automatically.
:::

::: context reentry-book The book this module recommends
*Reentry*, by the space journalist Eric Berger, is a 2024 book about how SpaceX made its Falcon 9 boosters land and fly again, and about the Dragon spacecraft. Berger had earlier written *Liftoff*, about the company's first years. This module recommends *Reentry* because it is specific about what the programs actually did — which is exactly the raw material a why-this-company answer needs. The general point: read sources that describe the engineering, not sources that describe the brand.
:::

::: context lossless-convexification Turning a hard problem into an easy one
Landing a rocket means finding a thrust plan that uses little fuel and never breaks the engine's limits. Written directly, that problem is **nonconvex**: its cost landscape has many dips, and a computer can get stuck in the wrong one. **Convex** problems have a single bowl-shaped bottom that a computer can find quickly and reliably.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,30 Q95,150 170,30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="95" cy="90" r="5" fill="#1d6fd1"/>
  <text x="95" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">convex: one bottom</text>
  <path d="M190,30 C205,110 220,110 235,70 C250,30 262,30 275,80 C288,130 305,125 320,60 C328,30 335,30 345,30" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="220" cy="98" r="5" fill="#b4232c"/>
  <circle cx="298" cy="118" r="5" fill="#b4232c"/>
  <text x="268" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">nonconvex: many dips</text>
</svg>
```

Lossless convexification, published by Behçet Açıkmeşe and colleagues in the 2000s, rewrites the landing problem as a convex one *without changing its answer*. You will build this idea properly in the optimization module.
:::

::: context find-and-replace The swap-the-name test
Every word processor has a **find-and-replace** command: it finds every copy of one word and swaps in another. The test imagines doing that with the company's name.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="12" width="340" height="56" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="20" y="34" font-size="12" fill="#1f2a44">"I admire the ambition at [any company]."</text>
  <text x="20" y="55" font-size="12" font-weight="700" fill="#b4232c">still true after the swap: cut</text>
  <rect x="10" y="80" width="340" height="56" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="20" y="102" font-size="12" fill="#1f2a44">"A constellation that size cannot be sized by hand."</text>
  <text x="20" y="123" font-size="12" font-weight="700" fill="#1d6fd1">only true of one program: keep</text>
</svg>
```

A sentence that stays true about any employer carries no information about why *this* one.
:::

::: context flight-rate How often a company launches
The **flight rate** is how many times a vehicle or company flies in a period, usually a year. A high flight rate matters to an engineer because every flight produces real data — how the hardware actually behaved compared with what the model predicted. SpaceX has flown Falcon 9 far more often than any other rocket family in recent years, more than a hundred times in a single year (2024). For someone whose work has only ever been checked against simulated data, that contact with reality is a genuine engineering reason, not a mood.
:::

::: context mekf-nees Is the filter honest about itself?
A **Kalman filter** estimates something you cannot measure directly — here, which way a spacecraft points — and also reports how unsure it is, a number called its **covariance**. An **EKF** (extended Kalman filter) handles curved, nonlinear problems; the **multiplicative** version, or MEKF, handles rotations cleanly. **NEES** (normalized estimation error squared) and **NIS** (normalized innovation squared) are tests of honesty: they check whether the filter's real errors are about as big as it *claims* they are. A filter that says "I am sure" while being wrong is dangerous. You will build one later in the course.
:::

::: context solar-cycle The Sun's eleven-year rhythm
The Sun's activity rises and falls over a cycle of about eleven years. When it is active, it heats Earth's upper atmosphere, which swells upward. Satellites in low orbit then fly through thicker air and feel more drag and more disturbing torque. So a design that works well at solar minimum can be pushed harder at solar maximum. For a constellation meant to fly for years, the whole range has to be handled — which is what "an environment that varies over a solar cycle" means.
:::

::: context batch-od Fitting an orbit to all the data at once
**Orbit determination** means working out where a satellite is and how it is moving from tracking measurements such as ranges and angles. A **batch** method collects many measurements first, then finds the one orbit that best fits all of them together, like drawing the best straight line through a scatter of dots. **Conditioning** measures how much the answer wobbles when the data wobbles a little. If all the measurements come from nearly the same direction, the fit can "converge" — settle on an answer — and still be badly wrong in the direction the data could not see. That is a geometry problem, not a coding bug.
:::

::: context proximity-approach Closing in on a space station
SpaceX's Crew Dragon docks with the International Space Station on its own, using sensors to measure its position relative to the station. As it closes in, its measurements get better — but a mistake gets more dangerous, because there is less room and time to fix it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M50,40 Q190,120 330,138" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M50,138 Q190,120 330,40" fill="none" stroke="#b4232c" stroke-width="3"/>
  <text x="56" y="32" font-size="12" fill="#1d6fd1">measurement error</text>
  <text x="330" y="32" font-size="12" text-anchor="end" fill="#b4232c">cost of a mistake</text>
  <text x="50" y="168" font-size="12" fill="#1f2a44">far away</text>
  <text x="330" y="168" font-size="12" text-anchor="end" fill="#1f2a44">close to station</text>
  <text x="44" y="95" font-size="11" fill="#6c7a93">(shape only)</text>
</svg>
```

Engineers place **hold points** along the approach, where the vehicle stops and checks everything before going closer, and **abort criteria**, the rules for backing away.
:::
