---
id: l08-behavioural-themes-and-ownership
title: Behavioral themes and saying what you did
minutes: 20
covers:
  - 'Behavioral themes: mission alignment, extreme ownership, operating with ambiguity and speed, intellectual honesty about failure'
  - Saying what you personally modeled, coded, analyzed, tuned, tested or debugged versus what the team did
---

Think about a group project at school. Four of you built a model volcano. At the end the teacher turns to you and asks, "What did *you* do?" There are three bad answers. "We all did everything" hides you. "I did most of it" might not be true, and your teammates are standing right there. "Not much, really" undersells you. The good answer is specific: "I mixed the baking-soda recipe, tested it five times, and fixed the one that overflowed the base."

An engineering interview asks that question over and over, in different clothes. It also asks a few others: why you want this work, what you do when nobody tells you the plan, and what happened the last time you got something wrong. Questions like these are called **behavioral questions** — questions about how you work, not about what you know.

This lesson covers the four themes those questions probe, and the one sentence you must be able to say plainly about every project on your résumé: what you personally did, versus what the team did. The next lesson turns all of this into stories you can tell.

## Half the interview

It is easy to treat behavioral questions as the chat before the real test. That is a mistake, and the numbers show why.

::: key How much of the onsite is behavioral
Reported at 30 to 50 percent. The themes are mission alignment, ownership end to end, tolerance for ambiguity and pace, and honesty about failure. Treat it as half the interview, because it is.
:::

"Reported" means it comes from many candidates' accounts of their own onsites, not from an official rulebook. Behavioral questions are not one round. They show up [[inside the other rounds|behavioural-throughout]]: at the start of a design round, at the end of a coding round, in the middle of the presentation's questions.

::: example Turning a percentage into hours
Say your onsite has six rounds of 50 minutes each. How much of it is behavioral, if the reported range holds?

Step 1: total time. $6 \times 50 = 300$ minutes.

Step 2: the low end. $0.30 \times 300 = 90$ minutes.

Step 3: the high end. $0.50 \times 300 = 150$ minutes.

So between 90 and 150 minutes — an hour and a half to two and a half hours — of a five-hour day is about how you work.

Now your preparation. This module is planned at 40 hours. If you split your time the way the onsite does, behavioral preparation gets $0.30 \times 40 = 12$ to $0.50 \times 40 = 20$ hours.

Sanity check: both answers are between a third and a half of the whole, which is what 30 to 50 percent means. Compare that with how long most people spend on it — often an evening. That gap is the opportunity.
:::

## Mission alignment

**Mission alignment** means your reasons for wanting the job match what the company is trying to do. An interviewer probing it wants to know whether you will still care in month eight, when the work is hard and the launch has slipped.

"I love space" is where almost everyone starts, and it is not enough, because every candidate says it. What makes it believable is evidence: things you did because you cared, when nobody made you.

- **Before:** "I've always been passionate about space."
- **After:** "I built a Monte Carlo ascent simulator in my own time because I wanted to see how much propellant margin a vehicle really needs. That's the question I want to keep working on."

The second answer is shorter on feelings and longer on proof. It names a thing you built and a question you care about. The interviewer can now ask about that simulator, and you can talk about it for an hour.

## Ownership end to end

**Ownership** means treating a result as yours to get right, from start to finish — not only the part someone assigned you. The idea is often called **[[extreme ownership|extreme-ownership]]**: when something goes wrong on your watch, you look first at what *you* could have done differently, before looking at anyone else.

Ownership shows up in small moves. You wrote the function, so you also wrote the test. You found a bug in someone else's module, so you reported it with a way to reproduce it, instead of quietly working around it. Your analysis fed a decision, so you checked afterwards whether the decision turned out right.

"End to end" is the key phrase. A person who owns a piece of software cares whether it builds, whether it is tested, whether its output is correct, and whether the next person can understand it. A person who does not own it cares whether their ticket is closed.

::: warning Ownership is not blame-taking
Owning an outcome does not mean saying everything was your fault. If a teammate's bug caused the problem, say so plainly and without drama — then say what *you* did about it. "The input file had the wrong units. I added a check so any file like it now fails loudly." That is ownership. Taking the blame for something you did not do is not honest, and interviewers can tell.
:::

## Ambiguity and speed

**Ambiguity** means not having all the information, or not having a clear instruction. Real engineering is full of it. The requirement is vague. The data is incomplete. Two senior people disagree. The launch date does not move.

The interviewer is probing **tolerance for ambiguity and pace**: can you make a sensible decision without perfect information, move quickly, and check it afterwards? The strong pattern has three steps.

1. **Say what you did not know.** "We had no wind data for that site."
2. **Say what you decided, and why that was reasonable.** "I used a standard wind profile and doubled its spread, because a too-wide dispersion is safer than a too-narrow one."
3. **Say how you checked or corrected it.** "When real balloon data arrived two weeks later, I reran the 500 cases. The margin changed by less than 1 percent, so the decision held."

Notice the numbers. A story about moving fast is only convincing if it also shows you were careful, and numbers are how you show care.

## Intellectual honesty about failure

**Intellectual honesty** means telling the truth about your work even when the truth makes you look worse. In an interview it is tested most directly with one request: tell me about a time you failed.

Everyone has failed. An engineer who says they have not is either very new or not being truthful, and neither helps them. What the question really measures is whether you can look at your own mistake honestly and learn from it.

::: key Being honest about failure
Name a real defect you caused or missed, what it cost, how it was found, and the specific process or test you changed so it cannot recur. Intellectual honesty is one of the four things being probed, and a scrubbed story is transparent.
:::

A **[[scrubbed story|scrubbed]]** is a failure story that has been cleaned until there is no failure left in it: "My biggest weakness is that I work too hard." Interviewers have heard it many times. It tells them you will not be straight with them, which is the opposite of what the question is looking for.

The key block gives the four parts. Here they are as questions to answer.

1. **The defect.** What exactly went wrong, and was it yours?
2. **The cost.** What did it waste or break? Hours, runs, a wrong decision?
3. **How it was found.** By you, a teammate, a test, a review?
4. **What you changed.** A specific test, check or process that makes it hard to happen again.

The fourth part is the one that matters most. It turns "I made a mistake" into "I made the whole system better", which is exactly the change the interviewer is hoping to hear.

::: example Rewriting a failure story
**Before:** "Once I had a small bug with units in my simulator, but we fixed it quickly and it was fine."

That has no defect you can picture, no cost, no discovery and no change. It is scrubbed.

**After:** Work through the four parts.

- *Defect:* "In my dispersion input file, I entered a pitch-angle spread of 0.5, meaning degrees, but the code [[read it as radians|radian-slip]]."
- *Cost:* How big was that mistake? One radian is about 57.3 degrees, so $0.5\ \text{rad} = 0.5 \times 57.3 \approx 28.6$ degrees. The spread was about 57 times too large. "About a fifth of my 1,000 runs failed, and I spent two days chasing a guidance bug that did not exist."
- *Found:* "A teammate looked at the histogram of sampled pitch angles and asked why it was so wide."
- *Changed:* "I renamed every angle input with its unit, like `pitch_sigma_deg`, and added a test that samples 10,000 values and checks the spread comes out at 0.5 degrees, not 0.5 radians."

Sanity check on the arithmetic: 28.6 degrees divided by 0.5 degrees is about 57, which is the number of degrees in a radian. The mistake was exactly one unit conversion. That is what makes the story believable — the size of the error matches its cause.
:::

## What you did, and what the team did

Most real engineering is done in teams, with libraries other people wrote. That is fine. But in an interview, the panel is hiring *you*, so they need to know where your work stops and everyone else's starts.

::: key What you did versus the team
What was personally modeled, coded, analyzed, tuned, tested or debugged by you versus completed by a team. Build the portfolio so that answer is specific and verifiable, and rehearse saying it without either inflating or deflating your contribution.
:::

The flashcard calls this "the Katalyst sentence". The name comes from a **[[job posting|job-posting]]** — the public description of a job a company advertises — that asks candidates for exactly this distinction. You do not need to know anything more about that posting. What matters is the six verbs in it, because each one is a different kind of contribution.

| Verb | What it means you did |
| --- | --- |
| Modeled | wrote down the physics or maths the software represents |
| Coded | wrote the software itself |
| Analyzed | ran it and drew conclusions from the results |
| Tuned | adjusted gains or parameters until it met a requirement |
| Tested | wrote the checks that show it works |
| Debugged | found and fixed what was wrong |

Try your projects against the six verbs. For each one, say "I" or "the team" or "a library". Most honest answers are a mix.

Two mistakes pull in opposite directions.

- **Inflating** means claiming more than you did. "I built the flight software" when you wrote one module of it. It feels safe until the interviewer asks one level deeper about a part you did not write.
- **Deflating** means claiming less than you did. "We built it" when you wrote most of it. Many careful people do this out of modesty. It hides exactly what the panel came to learn.

The cure for both is the same: be specific, and be **[[verifiable|verifiable]]** — say things someone could check.

::: example Drawing the boundary on a C++ project
**Before:** "We built a GNC application in C++ that ran the control loop in real time."

**After:** Go through the verbs.

- "The team designed the overall structure; I did not."
- "I **coded** the attitude-control module — about 600 lines — and the sensor-message parser."
- "The matrix maths came from the Eigen library; I did not write that."
- "I **tuned** the attitude controller's two gains until the step response settled in under 2 seconds."
- "I **tested** it: I wrote 40 unit tests for my module and the parser."
- "I **debugged** a timing problem where the loop missed its deadline, and traced it to a memory allocation inside the loop."

Count what changed. The before has one "we" and zero checkable numbers. The after has four sentences starting from a named verb, three numbers (600 lines, 2 seconds, 40 tests), and two honest "not me" boundaries. An interviewer can now pick any line and dig in, and every line holds up.
:::

::: warning Rehearse it out loud
The boundary sentence feels awkward the first few times you say it, because it sounds like boasting or like shrinking. Say it aloud for every project until it sounds like a plain description, the way you would describe what you ate for lunch. It is only information.
:::

## Check yourself

::: check
An onsite has four rounds of 45 minutes. Using the reported range, how many minutes are likely behavioral, and why would you not save your stories for one "behavioral round"?
:::

::: answer
Total time is $4 \times 45 = 180$ minutes. Thirty percent is $0.30 \times 180 = 54$ minutes and fifty percent is $0.50 \times 180 = 90$ minutes. Behavioral questions are spread through the other rounds, not held in one, so you need your stories ready from the first round to the last.
:::

::: check
Name the four behavioral themes, and for each one give a one-line question an interviewer might ask to probe it.
:::

::: answer
Mission alignment: "Why this work and not something else?" Ownership end to end: "Tell me about something you took responsibility for that wasn't strictly your job." Ambiguity and pace: "Tell me about a decision you made without all the information." Honesty about failure: "Tell me about a bug you shipped." Any sensible question aimed at each theme is fine.
:::

::: check
"My biggest failure was probably caring too much about code quality." What is wrong with this answer, and which four parts should replace it?
:::

::: answer
It is a scrubbed story: there is no real defect in it, so it shows the opposite of intellectual honesty. It should name a real defect you caused or missed, what it cost, how it was found, and the specific process or test you changed so it cannot recur.
:::

::: check
A candidate says, "I built the whole Monte Carlo framework," but the integrator came from SciPy and a teammate wrote the plotting. Is this inflating or deflating, and how would you fix the sentence?
:::

::: answer
It is inflating: it claims parts someone else wrote. A fixed version names the boundary: "I wrote the dispersion sampling and the run manager; the integrator is SciPy's, and a teammate wrote the plotting. I ran and analyzed the 2,000-case study." It is still impressive, and now it is true and checkable.
:::

::: check
A pitch-rate spread was typed as 2, meaning degrees per second, and read as radians per second. About how many times too big was the spread, and how big in degrees per second?
:::

::: answer
One radian is about 57.3 degrees, so 2 rad/s is $2 \times 57.3 \approx 115$ degrees per second. That is about 57 times the intended 2 degrees per second — the same factor as any degrees-for-radians mix-up.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Behavioral share | reported at 30 to 50 percent of the onsite; treat it as half the interview |
| Mission alignment | your reasons match the work; show it with things you did, not feelings |
| Ownership end to end | the result is yours to get right, from build to test to follow-up |
| Ambiguity and pace | say what you did not know, what you decided, how you checked |
| Honesty about failure | defect, cost, how found, what you changed; a scrubbed story is transparent |
| Six verbs | modeled, coded, analyzed, tuned, tested, debugged: you, the team, or a library |
| Inflate or deflate | both are mistakes; be specific and verifiable instead |

Next lesson turns these themes into a bank of six to eight stories from your capstones, each with a number, timed to under two minutes — and ends with the questions you ask them.

::: context behavioural-throughout Why every round checks it
A single conversation is a small sample, and one interviewer can misread you. Checking the same themes in several rounds, with several people, gives the team a steadier picture. For you it means there is no safe round: the systems C++ interviewer may still ask how you handled a bug you shipped. Have your stories ready for all of them.
:::

::: context extreme-ownership Where the phrase comes from
"Extreme Ownership" is the title of a 2015 book by two former US Navy SEAL officers, Jocko Willink and Leif Babin, about leadership. Its central idea is that a leader owns everything in their world, including the mistakes of the people they lead. The phrase spread widely in business and engineering. In an interview you do not need the book; you need the habit it names — asking "what could I have done?" first.
:::

::: context scrubbed Why polished stories fail
Interviewers hear the same few non-answers again and again: "I'm a perfectionist", "I work too hard", "I care too much". They have learned that these mean the candidate prepared a safe answer instead of an honest one. A real failure with a real fix is far more reassuring, because it shows you notice your own mistakes — and a team that flies hardware needs people who do.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="8" y="30" width="78" height="40" rx="4"/>
    <rect x="98" y="30" width="78" height="40" rx="4"/>
    <rect x="188" y="30" width="78" height="40" rx="4"/>
    <rect x="278" y="30" width="78" height="40" rx="4" fill="#8fb8f0"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="47" y="55">defect</text>
    <text x="137" y="55">cost</text>
    <text x="227" y="55">how found</text>
    <text x="317" y="55">what changed</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="86" y1="50" x2="96" y2="50"/>
    <line x1="176" y1="50" x2="186" y2="50"/>
    <line x1="266" y1="50" x2="276" y2="50"/>
  </g>
  <text x="180" y="96" font-size="11" fill="#6c7a93" text-anchor="middle">a scrubbed story has none of the four</text>
</svg>
```
:::

::: context radian-slip The most common unit slip in GNC code
Mixing degrees and radians is one of the most common bugs in guidance and navigation software, because humans think in degrees and maths libraries work in radians. Every trigonometric function in C++ and NumPy expects radians. A habit that prevents most of it: put the unit in every variable name that holds an angle, and convert only at the edges of the program.
:::

::: context job-posting Reading postings as a study guide
A job posting lists what the team needs. Read closely, it is a study guide: the tools, the problems, and sometimes, as here, the exact question you will face. Engineers preparing for interviews often copy the key lines of a posting into their notes and write an answer to each one. The six verbs in this line are a good example of a posting telling you what the interview will ask.
:::

::: context verifiable Leaving a trail someone can check
Verifiable means another person could confirm it. For software, the best trail is the history in version control: each commit records who changed what, and when. A portfolio project with a clean commit history, tests and a short README showing which parts you wrote makes your boundary sentence easy to believe. If an interviewer asks to see the code, you can point to exactly your lines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="320" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="40" width="120" height="30" fill="#1d6fd1"/>
  <rect x="140" y="40" width="100" height="30" fill="#8fb8f0"/>
  <rect x="240" y="40" width="100" height="30" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="30">I wrote</text>
    <text x="190" y="30">teammate</text>
    <text x="290" y="30">library</text>
  </g>
  <text x="80" y="59" font-size="11" fill="#fff" text-anchor="middle">controller, tests</text>
  <text x="190" y="59" font-size="11" fill="#1f2a44" text-anchor="middle">structure</text>
  <text x="290" y="59" font-size="11" fill="#1f2a44" text-anchor="middle">matrix maths</text>
  <text x="180" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">say where each boundary sits</text>
</svg>
```
:::
