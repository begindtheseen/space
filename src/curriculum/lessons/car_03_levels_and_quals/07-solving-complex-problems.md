---
id: l07-solving-complex-problems
title: "What 'little to no supervision' is actually testing"
minutes: 18
covers:
  - what capable of solving complex problems with little to no supervision is testing
---

Picture two kids who each built a birdhouse for a school project. The first followed the kit's instruction sheet, step by step, and the birdhouse came out well. The second was told only "make something that keeps birds dry." She had to decide what "dry" meant, whether to use wood or plastic, and where the roof should slope. She tried one design, saw it leak, and changed it. Both birdhouses might look equally good on the shelf. But if the teacher asks "why is the roof shaped like that?", only the second kid has a real answer.

Across the postings this module has covered, some version of a phrase like "capable of solving complex problems with little to no [[supervision|supervision-dial]]" shows up among the preferred qualifications. It is a different kind of line from everything in lesson four. Filtering or fault management is a subject you can study and point to. This phrase is a claim about *how you work* — whether you are the first kid or the second. A degree or a language can be checked on paper. This cannot.

This lesson works out three things: exactly what the phrase is asking, where it actually gets tested, and why the very same project can prove it or fail to prove it, depending only on how you describe it.

One honest caution first. Treat this phrase as typical wording, not a fixed formula. Different postings say the same thing in different words, and some do not say it at all. What follows is how to read it wherever some version of it appears — not a claim that these exact words sit on every posting in this role family.

## Why a résumé cannot prove it

Everything this module has looked at under basic qualifications is a plain fact. You have a degree in a certain field, or you do not. You have two years of professional work, or you do not. You have written C++, or you have not. A recruiter can check those from a document with fair confidence.

"Capable of solving complex problems with little to no supervision" is not that kind of fact. Nothing on a résumé proves it. A bullet point that says "solves complex problems independently" proves nothing beyond the fact that you typed it.

That is exactly why this phrase lives under **preferred qualifications** — the ranking signals — and not under basic ones. As the first lesson of this module showed, preferred items tend to get judged later in the hiring pipeline, through conversation, instead of at the cheap first-pass filter. The only way to test how someone works is to ask them to describe how they actually worked, in enough detail that the description itself becomes evidence. That takes a real interview, not a résumé scan.

## What it is actually testing

Read closely, the phrase is not asking about one vague quality called "independence." It asks about three specific things.

- **Scoping an ambiguous problem.** An **[[ambiguous|ambiguous-word]]** problem is one that could mean more than one thing, or that nobody has fully defined yet. Scoping it means working out what the real problem is *before* you try to solve it. The second kid had to decide what "keep birds dry" meant.
- **Choosing an approach.** Among genuinely different ways to tackle the problem, can you pick one and explain why it was the right choice — not merely the only one you knew?
- **Defending the choice.** When someone questions you, including about the paths you did not take, can your reasoning hold up? Or do you fall back on "that's what I did"?

Set against all three is **executing a specified task**: being handed a fully defined problem, with the approach already chosen by someone else, and carrying out the known steps well. That is the first kid with the kit.

Executing a specified task well is a real and valuable skill. Nothing about this phrase says otherwise. But it is not what this qualification asks about. A candidate whose only stories are about executing well-specified tasks — however impressive — has not yet shown the thing this phrase is probing.

::: key
"Capable of solving complex problems with little to no supervision" is a preferred-qualification phrase that is tested behaviorally and in the past-project round. It asks whether you can scope an ambiguous problem, choose an approach among real alternatives, and defend that choice — not whether you can execute a task someone else has already fully specified.
:::

## Where it actually gets tested

Two related but different interview formats do most of the work.

A **past-project deep dive** is a conversation built around something real you did. Not a made-up scenario — one specific project, walked through in enough detail that the interviewer can ask about your *decisions*, not only your results. Expect "why that way?" again and again, each answer opening the next question.

**[[Behavioral interviewing|behavioral-interview]]** asks structured questions about your past, often starting "Tell me about a time when…". The idea behind it is that how you actually handled a real situation predicts how you will handle a similar one again.

Both formats rest on the same logic. Past decisions, described in enough detail to be examined, are better evidence of how someone works than any self-description could ever be.

### The bar grows with the level

This connects back to the lesson on Sr. GNC Engineer. What counts as "complex," and what counts as "little supervision," is not one fixed bar applied the same way at every level.

- A **Level I to II** candidate who made a bounded, subsystem-level decision — say, which sensor-fusion approach to use for one component, and why — is showing exactly what this phrase asks for, at a size that fits that level.
- A **senior** candidate who made a mission-level architecture choice, weighing tradeoffs that affect a whole program, is showing the *same* quality at a size that fits the senior level.

You can reasonably expect interviewers to size what "complex" means to the level of the job being filled, instead of holding everyone to one standard. Exactly how any one interviewer does that sizing in practice is not something this module has specific information about.

## How to prepare

The standard technique is worth spelling out, because it is easy to skip. Before the interview, pick two or three concrete stories from your own projects or jobs. Not hypothetical ones, and not borrowed ones. For each story, be ready to say four things plainly:

1. What was the actual ambiguity — what was not decided when you started?
2. What real alternatives existed?
3. Which one did you choose?
4. Why?

The "why" matters as much as the "what." A story that only describes what you built shows execution. A story that also describes what you did *not* build, and the reasoning that ruled it out, shows the scoping and choosing this phrase is really asking about.

::: warning Narrating assigned steps is not the same as showing this quality
A common trap is to describe a project by listing the steps you were told to do — or the steps a tutorial, or the existing pattern in a codebase, told you to do. This happens even when the technical work was genuinely hard. An accurate account that never mentions a choice you made among real alternatives accidentally shows the opposite of what the phrase tests: competent execution of a specified task, not ownership of an ambiguous one. The fix is not to exaggerate. It is to notice, honestly, whether a real choice existed in work you already did, and to be ready to name it.
:::

::: warning This is not a box you either tick or leave blank
A degree field or a language is something you either have or lack. This quality is different. It is shown entirely through the specific stories you bring to the interview, and how well you tell them. Two candidates with genuinely similar experience can leave very different impressions, because one arrived with a specific, examined story and the other never thought to prepare one.
:::

::: example Two accounts of the same kind of project
Two candidates each describe building a **[[Monte Carlo dispersion analysis|monte-carlo]]** tool in Python.

**Candidate A:** "I was asked to add a dispersion tool to our simulation. I followed the existing pattern already used elsewhere in the codebase and had it working in about two weeks."

**Candidate B:** "The team needed dispersion analysis, and there were two reasonable ways to get it. One was to extend our existing **[[single-threaded|parallel-cooks]]** Monte Carlo script. The other was to build a parallelized framework the team had discussed but never built. I chose to extend the existing script first, because the parallel framework would have taken longer than the analysis deadline allowed. My plan was to revisit that if the number of runs we needed outgrew what the single-threaded version could finish in time. That happened about six weeks later, and at that point I built the parallel version."

Now read them against the three parts of the phrase.

- **Scoping.** A: none mentioned — the task arrived defined. B: which approach to build first was an open question.
- **Choosing.** A: followed the existing pattern. B: picked between two real options, with a stated reason (the deadline).
- **Defending.** A: nothing to defend. B: set a condition for changing course, and later changed course on exactly that condition.

The technical difficulty of the two tools might be about the same. What differs is what each account shows. A's story is a clean, honest description of executing a specified task well. B's story shows all three parts directly. An interviewer hearing both would reasonably treat B's account as stronger evidence of this particular quality — regardless of which tool was actually harder to build.

Sanity check: B's story does not claim anything bigger than A's. It only surfaces a decision that was really there.
:::

::: example The same quality, shown at two different sizes
**A Level I to II candidate** describes choosing between two **[[filter-tuning|filter-tuning]]** approaches for a single sensor on a vehicle that was already flying. She noticed the existing tuning gave noisy estimates under one particular flight condition. The decision was bounded — one subsystem — and she made it largely on her own, with a clear account of why she preferred one approach over the other.

**A Sr. GNC Engineer candidate** describes choosing the overall **[[state-estimation architecture|estimation-architecture]]** for a new vehicle program from its earliest design stage. He weighed long-term maintainability across several future teams against a tighter near-term schedule. The decision shaped work for many people besides himself.

Check each against the three parts:

| | Level I to II story | Senior story |
| --- | --- | --- |
| Scoping | Which flight condition is the real problem? | What should the estimation system for this program be? |
| Choosing | Two tuning approaches | Architectures that trade maintainability against schedule |
| Defending | Why one tuning approach beats the other | Why the long-term cost is worth the schedule pressure, or not |
| Size | One subsystem | Whole program |

Both stories show scoping, choosing and defending. What differs is size, not kind. The Level I to II story fits that level's real responsibilities, and it is not a weak story for being smaller than the senior one. An interviewer who judged a Level I to II candidate against a mission-architecture story would be applying the wrong bar, not a tougher one.
:::

## Check yourself

::: check
State, in your own words, what "capable of solving complex problems with little to no supervision" is actually testing.
:::

::: answer
It tests three specific things. First, whether you can scope an ambiguous problem that was not handed to you fully defined. Second, whether you can choose an approach among genuinely different alternatives and explain what made it the right one. Third, whether you can defend that choice under questioning, including about the alternatives you did not take. It is not testing whether you can competently execute a task someone else already specified.
:::

::: check
Why can't this kind of qualification be judged at the cheap, early résumé-screen stage, the way a degree field or a years-of-experience line can?
:::

::: answer
A degree field or a years count is a fact that either holds or does not, and it can be checked from a document with reasonable confidence. A claim about how someone works cannot be verified from a bullet point — the bullet point proves nothing beyond the claim itself. It can only be tested by hearing someone describe a real situation in enough detail that the description becomes evidence. That needs an actual conversation, not a document scan.
:::

::: check
Contrast "executing a specified task" with the three things this phrase is actually probing.
:::

::: answer
Executing a specified task means carrying out a fully defined problem, using an approach someone else already chose. It is a real and valuable skill, but a different one. The phrase probes something else: scoping an ambiguous problem yourself, choosing among real alternatives, and defending that choice under questioning. None of those is shown by describing how well a pre-specified task was carried out, however competently.
:::

::: check
Explain why the same technical project might be described in a way that shows this quality, or in a way that fails to, depending only on how it is told.
:::

::: answer
The quality lives in the decisions made during the work, not in how technically hard the work was. A telling that only describes what was built and how — following an existing pattern, completing the known steps — shows competent execution, however hard the task was. A telling of the same project that also names a real alternative that was considered, and explains why it was not chosen, shows scoping and choosing directly. The technical substance can be identical. What differs is whether the account brings a decision to the surface at all.
:::

::: check
How does what counts as "complex" and "little supervision" change between a Level I to II candidate and a Sr. GNC Engineer candidate — and why doesn't that mean the phrase tests something different at each level?
:::

::: answer
The size of a fitting story changes with level. A Level I to II candidate's strongest example is usually a bounded, subsystem-level decision. A senior candidate's strongest example usually reaches further, to mission- or program-level architecture. What stays the same at both levels is the quality being tested: scoping an ambiguity, choosing among real alternatives, and defending the choice. The phrase means the same thing at every level; only the right scale of evidence changes.
:::

## Summary

| Part | What it means | Where it is tested |
| --- | --- | --- |
| Scoping | Defining the real problem when it was not handed to you fully specified | Past-project deep dive |
| Choosing | Picking an approach among genuinely different alternatives, with stated reasons | Behavioral and technical interview rounds |
| Defending | Holding up that reasoning under direct questioning, including about paths not taken | Interview follow-up questions |
| Contrast | Executing a specified task — a different, also valuable, skill this phrase is not asking about | — |
| Level | Same quality at every level; the size of the story grows with the level | Sized to the job being filled |

The next lesson pulls the whole module together around the question it opened with: which level you should actually target, how a recruiter and hiring manager arrive at that judgment, and how to run an honest self-assessment against every line this module has walked through.

::: context supervision-dial Supervision is a dial, not a switch
"Supervision" means someone more senior checking your work and telling you what to do next. On a real engineering team it is not all or nothing. It is more like a dial.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="330,50 320,45 320,55" fill="#1f2a44"/>
  <circle cx="40" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="133" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="226" cy="50" r="7" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="310" cy="50" r="7" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">told each</text>
  <text x="40" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">step</text>
  <text x="133" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">given the</text>
  <text x="133" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">method</text>
  <text x="226" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">given the</text>
  <text x="226" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">goal</text>
  <text x="310" y="78" font-size="11" text-anchor="middle" fill="#1f2a44">finds the</text>
  <text x="310" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">goal</text>
  <text x="40" y="30" font-size="12" fill="#6c7a93">more supervision</text>
  <text x="330" y="30" font-size="12" text-anchor="end" fill="#1d6fd1">less supervision</text>
  <text x="180" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">the phrase is asking about the right-hand end</text>
</svg>
```

Everyone starts near the left on a new team. The phrase asks whether you have ever worked toward the right.
:::

::: context ambiguous-word Where "ambiguous" comes from
The word comes from Latin *ambiguus*, "doubtful, going either way," built from *ambi-* ("around, both ways" — the same root as *ambidextrous*, able to use both hands) and *agere*, "to drive." An ambiguous problem is one you could drive off in more than one direction. Scoping is choosing the direction before you start, and being able to say why.
:::

::: context behavioral-interview Behavioral questions and the STAR shape
Many interviewers, and many career guides, suggest answering "tell me about a time when…" in four parts, known by the initials STAR:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="75" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="97" y="20" width="75" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="184" y="20" width="75" height="50" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="271" y="20" width="75" height="50" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="47" y="44" font-size="16" font-weight="700" text-anchor="middle" fill="#1f2a44">S</text>
  <text x="134" y="44" font-size="16" font-weight="700" text-anchor="middle" fill="#1f2a44">T</text>
  <text x="221" y="44" font-size="16" font-weight="700" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="308" y="44" font-size="16" font-weight="700" text-anchor="middle" fill="#1f2a44">R</text>
  <text x="47" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">Situation</text>
  <text x="134" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">Task</text>
  <text x="221" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">Action</text>
  <text x="308" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">Result</text>
  <text x="221" y="94" font-size="11" text-anchor="middle" fill="#1d6fd1">your choice lives here</text>
</svg>
```

STAR is a common habit, not a rule any company requires. For this phrase, put most of your words into the Action box: the options you saw, the one you picked, and why.
:::

::: context monte-carlo What a Monte Carlo dispersion analysis is
A real flight never goes exactly to plan. Winds differ, engines push slightly harder or softer, sensors read slightly off. A **dispersion analysis** asks how far the results *spread*. A **Monte Carlo** analysis answers by running the simulation hundreds or thousands of times, each time with the uncertain inputs picked at random within their known ranges, and then looking at the cloud of outcomes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="62" rx="120" ry="42" fill="#fff" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g fill="#1f2a44">
    <circle cx="180" cy="62" r="2.5"/><circle cx="160" cy="55" r="2.5"/><circle cx="205" cy="70" r="2.5"/>
    <circle cx="140" cy="70" r="2.5"/><circle cx="225" cy="52" r="2.5"/><circle cx="190" cy="44" r="2.5"/>
    <circle cx="170" cy="80" r="2.5"/><circle cx="118" cy="58" r="2.5"/><circle cx="245" cy="66" r="2.5"/>
    <circle cx="200" cy="88" r="2.5"/><circle cx="150" cy="40" r="2.5"/><circle cx="265" cy="58" r="2.5"/>
    <circle cx="100" cy="66" r="2.5"/><circle cx="215" cy="36" r="2.5"/><circle cx="130" cy="84" r="2.5"/>
    <circle cx="185" cy="72" r="2.5"/><circle cx="235" cy="80" r="2.5"/><circle cx="165" cy="66" r="2.5"/>
  </g>
  <circle cx="180" cy="62" r="5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">each dot = one simulated landing; red ring = the target</text>
</svg>
```

The name comes from the Monte Carlo casino in Monaco, because the method runs on random chance, like a roulette wheel.
:::

::: context parallel-cooks Single-threaded versus parallel
A **single-threaded** program does one thing at a time, like one cook making a thousand sandwiches in a row. A **parallelized** program splits the work so many processor cores do it at once, like twenty cooks each making fifty. Monte Carlo runs are perfect for splitting, because each run does not depend on any other. The catch is that building the kitchen for twenty cooks takes effort up front — which is exactly the tradeoff Candidate B weighed against a deadline.
:::

::: context filter-tuning What "tuning a filter" means
A navigation **filter** blends two sources of information: what the vehicle's model predicts, and what the sensors measure. **Tuning** it means choosing how much to trust each one. Trust the sensor too much and the estimate jumps around with every noisy reading. Trust the model too much and the estimate is slow to notice real changes. Noisy estimates under one flight condition, as in the example, often mean the balance is set wrong for that condition. The estimation lessons later in this course build this up properly, starting from the Kalman filter.
:::

::: context estimation-architecture What a state-estimation architecture is
The **state** of a vehicle is the handful of numbers that say where it is and how it is moving: position, velocity, which way it points, how fast it turns. **State estimation** is working out those numbers from imperfect sensors. The **architecture** is the big-picture design: which sensors feed in, how many filters there are, how they share information, and what happens when a sensor fails. Choosing it early matters, because every later team builds on top of it — which is why this is a senior-sized decision.
:::
