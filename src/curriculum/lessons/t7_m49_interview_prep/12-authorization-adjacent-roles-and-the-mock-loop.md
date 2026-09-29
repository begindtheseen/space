---
id: l12-authorization-adjacent-roles-and-the-mock-loop
title: Work authorisation, adjacent roles, and the full mock loop
minutes: 17
covers:
  - Work authorisation and export-control eligibility documentation, handled early rather than at offer stage
  - Adjacent entry roles — simulation, GNC software, site reliability for GNC infrastructure — as realistic vectors into the field
---

Before a trip abroad, a careful traveler checks one thing first: is the passport valid? Not at the airport gate, after the bags are packed and the hotel is paid for. First. If there is a problem, finding it early costs a phone call. Finding it at the gate costs the whole trip.

A school play works the same way at the other end. Nobody performs on opening night without a **dress rehearsal** — one full run-through, in costume, start to finish, with no stopping. Practicing scenes one at a time is useful, but only the full run shows what happens when you are tired, the costume change is fast, and the lights go wrong.

This last lesson has both. First come the two parts of the job hunt that are not technical at all: **work authorization** — whether you are legally allowed to do the job — and **adjacent roles**, realistic ways into the field besides a specialist GNC job. Both follow the same rule as everything else in this module: deal with whatever could derail you *before* it derails you, not under pressure at the worst moment. Then comes the dress rehearsal: a full, timed, recorded **mock loop** that ties every round in the module together.

## Handling eligibility documentation early

The legal details — who the US **[[export-control|export-control]]** regulations cover, which statuses are eligible, what a **[[deemed export|deemed-export]]** is, and how a legal restriction differs from an employer's preference — are taught in full in the curriculum's dedicated export-control eligibility module. This lesson's job is narrower and purely practical: *when* this gets handled in a real hiring timeline, and what handling it early buys you.

For export-controlled work, eligibility is usually confirmed at the very start of the **[[pipeline|pipeline]]** — often in the first recruiter conversation, before any technical round. That order is not arbitrary. Where eligibility is a hard gate that cannot be waived, no technical performance can substitute for it. So learning the answer in week one, instead of after weeks of preparation and several rounds, is better for *you*, not only a courtesy to the employer.

The practical move follows: **know your own status with certainty before anyone asks.** If anything about your situation is unclear, settle it against an authoritative source — an immigration attorney, or the actual government documents that govern your status — before a pipeline starts. Do not guess in either direction.

- Guess "ineligible" wrongly, and you give up an opportunity you really had.
- Guess "eligible" wrongly, and everyone loses real time once it surfaces — usually at a worse moment than the first conversation would have been.

Treat your status the way this module treats every fact worth knowing cold: something you can state at once and accurately, not something you work out live under a stranger's question.

::: warning
The exact eligibility rules, and exactly how and when each employer confirms them, cannot be taught here as fixed facts. Regulations, programs and company processes vary and change. What stays true is the pattern: settle this early, against authoritative sources, so it never surfaces as a surprise deep into a process you have already invested in.
:::

## Adjacent entry roles as real ways in, not consolation prizes

Think of a hospital. Surgeons are the famous job, but a hospital also needs people who build and run the imaging machines, the records systems and the labs. Those people work beside the surgeons every day, and some of them move into clinical roles later.

GNC teams are the same. Three roles come up again and again as realistic ways in for a candidate who did not come through the traditional path:

- **Simulation** — building and maintaining the **6-DOF** simulation tools (six degrees of freedom: three for position, three for rotation) that GNC engineers depend on.
- **GNC software** or analysis automation — building the tools, pipelines and infrastructure *around* GNC analysis, rather than the control and estimation algorithms themselves.
- **[[Site reliability engineering|sre]] for GNC infrastructure** — running the computers GNC analysis needs at scale: large simulation and Monte Carlo compute, and **[[continuous integration|ci]]** for vehicle and simulation software.

Why are these genuine ways in and not a lesser path? Because of *what gets weighted*, not because the bar is lower. These roles weight general software-engineering skill — testing discipline, code quality, system design, keeping things running — more heavily, and deep derivation-level control and estimation theory less heavily, than a specialist GNC role does. That is a real difference in what is assessed.

And it plays to the strengths of exactly the candidate this curriculum builds: someone who has made real, working software — a simulation architecture, a Monte Carlo pipeline, the tooling around a project — while GNC theory is still deepening. The exact interview content for any one posting varies by team and employer, so nothing here describes what a particular role tests. The pattern to trust is the general one: these roles exist because the skills they need are broader than one specialist track, which makes them reachable from more directions.

Almost everything else in this module carries over unchanged. The behavioral techniques, the coding-round instincts about determinism and memory, the systems-design skeleton, numbers instead of adjectives, and above all how to be wrong well work the same in a specialist controls interview and a simulation-infrastructure one. What changes is mainly the six core whiteboard derivations: lighter in these adjacent rounds, central in a specialist GNC one.

::: example Positioning a pivot toward an adjacent role
An interviewer asks whether you would consider the simulation team instead. A strong answer:

"I've focused my preparation on GNC, but I'm really interested in the simulation and tooling side too. Honestly, the 6-DOF simulation architecture I built is the part of this project I'm proudest of, separate from the guidance algorithm it was built to test. I designed it to be modular, so new vehicle configurations and environment models could be added without touching the integration core. And I wrote a real test suite around it instead of only eyeballing plots."

**Why it works, piece by piece:**

- It does not apologize for the interest or call the role a fallback.
- It names one specific strength: software architecture and testing discipline.
- It backs that strength with concrete evidence — the modular design and the test suite.

That is exactly what these roles are listening for.
:::

## The full mock loop

Every round this module built — the project presentation, the coding rounds, the controls, estimation, dynamics and systems rounds — comes together in one exercise. Run the whole thing in one sitting, against a real clock, in front of real people, and record it.

A full **[[loop|loop]]** mirrors the real day it rehearses:

- a project presentation, with a real question period after it;
- two timed coding rounds;
- one round each in controls, estimation, dynamics and systems design.

Doing it all in *one day*, instead of spread comfortably across a week, is deliberate. It rehearses the real fatigue and switching between topics that an interview day imposes, which comfortable practice never does.

### Score behaviors, not feelings

Score each round against five specific, mostly yes-or-no **[[markers|score-sheet]]**, not a vague sense of how it went:

1. Did you **state your assumptions**?
2. Did you **ask a clarifying question** where one was available?
3. Did you **narrate your reasoning** instead of working in silence?
4. Did you **recover cleanly** when you made a mistake?
5. Did you **quote your own numbers with units** when your past work came up?

Each is a concrete behavior this module built a whole lesson around, which is why they are the right things to score. "Did it go well?" is unreliable, because you cannot perform under pressure and objectively watch yourself perform at the same time.

::: example A self-scored round
You review a recorded estimation round against the five markers:

- **Assumptions — yes.** You stated the linear measurement model and the Gaussian noise before deriving the Kalman gain.
- **Clarifying question — no.** You dove straight into the derivation, when you could first have asked whether they wanted the general matrix form or the scalar intuition.
- **Narrated reasoning — partly.** You went quiet for about twenty seconds while differentiating the trace of the posterior covariance. On playback it looks like a stall, not like thinking.
- **Recovered cleanly — yes.** You caught a sign error in the covariance update, $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$, and fixed it out loud instead of silently.
- **Quoted own numbers — no chance** came up this round.

**The tally:** three clear yeses, one clear gap (the missed clarifying question), one partial (the silent stretch). That is a specific list to work on before the next loop — not a mood.
:::

### Why record it, and why run it twice

Watching the recording will be uncomfortable, and that is the point. From inside the performance you cannot judge your own pacing, your **[[filler words|own-voice]]**, or whether you actually did the things you believe you did. A recording is the only feedback not filtered through your memory of how it *felt* — which is a different, and usually more flattering, thing than how it *looked*.

Then run the full loop **twice**, with real work on the two weakest rounds in between. One loop's self-assessment is unreliable in a specific way: the first time, you have no calibrated sense of what "good" looks like from the outside, because you have never watched yourself do this. The second loop, run after fixing the two weakest rounds, gives a real before-and-after comparison against your own baseline. That is the only version of "am I ready?" you can answer with evidence instead of hope.

::: key
Score every round on five markers: stated assumptions, asked a clarifying question, narrated reasoning, recovered cleanly from a mistake, quoted your own numbers with units. Run the full loop twice, fixing the two weakest rounds in between — the second loop is what turns a guess about readiness into a measured one.
:::

## Check yourself

::: check
Why does confirming eligibility for export-controlled work early in a process help the candidate, not only the employer?
:::

::: answer
Where eligibility is a hard gate that cannot be waived, no technical performance in later rounds can make up for it. So if the answer is going to be no, learning it in the first conversation costs you far less time, preparation and emotional investment than learning it after several weeks of rounds. Calling it a courtesy to the employer misses that the candidate has at least as much to lose from a late surprise — arguably more, since your sunk preparation time is the bigger cost.
:::

::: check
Your own eligibility status is unclear to you. What is the right move, and what does guessing wrong cost in each direction?
:::

::: answer
Settle it against an authoritative source — an immigration attorney or the actual documents that govern your status — before a pipeline starts, instead of assuming either answer. Guessing "ineligible" when you are eligible costs you an opportunity you really had. Guessing "eligible" when you are not costs everyone real time once it surfaces, usually later and at a worse moment than an early, accurate answer. Neither mistake is free, which is exactly why it is worth settling for certain.
:::

::: check
Explain honestly why simulation, GNC software and site-reliability-for-GNC roles are real ways into the field, without claiming "the bar is lower".
:::

::: answer
The difference is in what gets weighted, not a lower bar overall. These roles weight general software-engineering skill — testing, system design, operational reliability — relatively more, and deep derivation-level control and estimation theory relatively less, than a specialist GNC role. For a candidate whose software artifacts (a well-tested simulation core, a real analysis pipeline) are strong while GNC theory is still developing, that reweighting is a real structural advantage. It rewards a different, equally real kind of demonstrated skill.
:::

::: check
List the five markers for scoring a mock round, and explain why they beat a general "how did that feel?" self-assessment.
:::

::: answer
Stated assumptions; asked a clarifying question where one was available; narrated reasoning instead of working silently; recovered cleanly from a mistake; quoted your own numbers with units when your work came up. Each is a specific, observable behavior the module built a lesson around, so each can be checked from a recording. A feeling is produced from inside the performance and is unreliable for that reason. "Did I ask a clarifying question?" has a yes-or-no answer that any outside observer — including your later self watching the recording — can verify.
:::

::: check
Why does watching a recording of your mock round give more reliable feedback than your own sense of how it went at the time?
:::

::: answer
You cannot perform a skill under pressure and accurately observe that performance at the same moment. Attention spent watching your own delivery is taken from the reasoning, and the reverse is also true, so a live self-assessment is always partial. A recording removes that conflict: you watch it later with full attention on observing. It reveals pacing, filler words, and gaps between what you think you did and what you actually did — things that are nearly invisible from inside the performance.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Eligibility, handled early | Know your status with certainty before anyone asks; settle any real ambiguity against an authoritative source before a pipeline starts |
| Adjacent roles | Simulation, GNC software and analysis tooling, and site reliability for GNC infrastructure weight software-engineering skill more, deep derivation-level theory less — a real difference, not a lower bar |
| What transfers | Behavioral technique, coding-round instincts, the systems skeleton, numbers not adjectives, and being wrong well work the same in specialist and adjacent rounds |
| Full mock loop | One day, a real clock, every round in this module, recorded |
| Self-scoring | Stated assumptions, asked a clarifying question, narrated reasoning, recovered cleanly, quoted own numbers with units |
| Run it twice | The first loop calibrates; the second, after fixing the two weakest rounds, turns a guess about readiness into a measurement |

This closes the module, and the GNC track with it. The road here began, back in the foundations, with signed numbers and fractions. It ends with you able to derive a Kalman gain at a whiteboard, defend a Monte Carlo campaign, and write flight-style code with no allocation in the hot path. Every lesson has been building toward the same afternoon: a clock, a whiteboard, someone who will interrupt, and a body of work you can defend out loud — under pressure, honestly, and cold. Go and have that afternoon.

::: context export-control Rules about who may see what
The United States controls not only where certain hardware may be shipped, but who may see the technical data behind it. Two sets of rules matter most for aerospace: **ITAR**, the International Traffic in Arms Regulations, run by the State Department, which covers defense articles and much launch-vehicle and spacecraft technology; and the **EAR**, the Export Administration Regulations, run by the Commerce Department, which covers "dual-use" items with both civil and military uses. Job postings that mention export control are pointing at these rules.
:::

::: context deemed-export An export that never leaves the building
Handing controlled technical data to a foreign person counts as exporting it to that person's country — even if the handoff happens in an office in the United States. That is a **deemed export**. It is why working on site does not solve an eligibility problem, and why an employer cannot simply make an exception for a strong candidate: the restriction comes from the government, not from company preference.
:::

::: context pipeline Where the eligibility question sits
A hiring **pipeline** is the series of steps from application to offer. For export-controlled roles, eligibility usually comes up at the very first step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="340,50 330,45 330,55" fill="#1f2a44"/>
  <circle cx="40" cy="50" r="9" fill="#1d6fd1"/>
  <circle cx="110" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="180" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="250" cy="50" r="7" fill="#8fb8f0" stroke="#1f2a44"/>
  <circle cx="315" cy="50" r="7" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="76">recruiter</text><text x="40" y="90">call</text>
    <text x="110" y="76">phone</text><text x="110" y="90">screen</text>
    <text x="180" y="76">technical</text><text x="180" y="90">rounds</text>
    <text x="250" y="76">full</text><text x="250" y="90">loop</text>
    <text x="315" y="76">offer</text>
  </g>
  <text x="40" y="28" font-size="11" fill="#1d6fd1" text-anchor="middle">eligibility asked here</text>
  <text x="300" y="112" font-size="11" fill="#b4232c" text-anchor="middle">worst place to learn "no"</text>
</svg>
```

Weeks of preparation separate the first dot from the last. That gap is what early certainty protects.
:::

::: context sre Keeping the machines honest
**Site reliability engineering** is the discipline of running large computer systems so they stay up, fast and correct, using software engineering instead of manual fixes. The name and the role began at Google in the early 2000s and spread widely. On a GNC team, the "site" is the compute farm where tens of thousands of simulation runs happen every night; if it breaks, every analysis that depends on it stops.
:::

::: context ci Testing every change automatically
**Continuous integration** means that every time someone submits a change to the code, a server automatically builds it and runs the tests — often including a batch of simulation runs — and flags anything that broke. For flight and simulation software, CI is how a team knows today's change did not quietly ruin last month's landing accuracy. Keeping that machinery fast and trustworthy is real, valued work.
:::

::: context loop Why it is called a loop
In tech hiring, the **loop** is the final set of back-to-back interviews, usually in one day, with different people covering different skills. The name comes from the candidate being passed around a loop of interviewers, who then meet to compare notes. A mock loop copies that shape on purpose: the same length, the same variety, the same tiredness by the fourth round.
:::

::: context score-sheet A score sheet for one loop
A grid like this, filled in from the recording, turns "I think it went OK" into a pattern you can see. Here, a blue box is yes, orange is partly, and a white box is no or no chance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="150" y="18">talk</text><text x="185" y="18">code</text><text x="220" y="18">ctrl</text>
    <text x="255" y="18">est</text><text x="290" y="18">dyn</text><text x="325" y="18">sys</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="10" y="42">assumptions</text><text x="10" y="70">clarifying Q</text><text x="10" y="98">narrated</text>
    <text x="10" y="126">recovered</text><text x="10" y="154">own numbers</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="138" y="30" width="24" height="18" fill="#1d6fd1"/><rect x="173" y="30" width="24" height="18" fill="#1d6fd1"/><rect x="208" y="30" width="24" height="18" fill="#f2b880"/><rect x="243" y="30" width="24" height="18" fill="#1d6fd1"/><rect x="278" y="30" width="24" height="18" fill="#1d6fd1"/><rect x="313" y="30" width="24" height="18" fill="#1d6fd1"/>
    <rect x="138" y="58" width="24" height="18" fill="#fff"/><rect x="173" y="58" width="24" height="18" fill="#fff"/><rect x="208" y="58" width="24" height="18" fill="#fff"/><rect x="243" y="58" width="24" height="18" fill="#fff"/><rect x="278" y="58" width="24" height="18" fill="#fff"/><rect x="313" y="58" width="24" height="18" fill="#1d6fd1"/>
    <rect x="138" y="86" width="24" height="18" fill="#1d6fd1"/><rect x="173" y="86" width="24" height="18" fill="#f2b880"/><rect x="208" y="86" width="24" height="18" fill="#1d6fd1"/><rect x="243" y="86" width="24" height="18" fill="#f2b880"/><rect x="278" y="86" width="24" height="18" fill="#1d6fd1"/><rect x="313" y="86" width="24" height="18" fill="#1d6fd1"/>
    <rect x="138" y="114" width="24" height="18" fill="#1d6fd1"/><rect x="173" y="114" width="24" height="18" fill="#1d6fd1"/><rect x="208" y="114" width="24" height="18" fill="#1d6fd1"/><rect x="243" y="114" width="24" height="18" fill="#1d6fd1"/><rect x="278" y="114" width="24" height="18" fill="#f2b880"/><rect x="313" y="114" width="24" height="18" fill="#1d6fd1"/>
    <rect x="138" y="142" width="24" height="18" fill="#1d6fd1"/><rect x="173" y="142" width="24" height="18" fill="#fff"/><rect x="208" y="142" width="24" height="18" fill="#fff"/><rect x="243" y="142" width="24" height="18" fill="#fff"/><rect x="278" y="142" width="24" height="18" fill="#fff"/><rect x="313" y="142" width="24" height="18" fill="#1d6fd1"/>
  </g>
</svg>
```

The "est" column matches the self-scored round in this lesson. Read across a row and the weakest habit jumps out — here, clarifying questions. (The white boxes in the last row are mostly rounds where your own work never came up.)
:::

::: context own-voice Why your recording sounds strange
Almost everyone dislikes hearing their own recorded voice. Part of the reason is physical: when you speak, you hear your voice partly through the bones of your skull, which makes it sound deeper and fuller to you than it does to anyone else. The recording is how everyone else has always heard you. Get past that first wince and listen for what matters — the "um" that comes before every equation, the long silences, the sentences you never finished.
:::
