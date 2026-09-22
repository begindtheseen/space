---
id: l12-authorization-adjacent-roles-and-the-mock-loop
title: Work authorisation, adjacent roles, and the full mock loop
minutes: 17
covers:
  - Work authorisation and export-control eligibility documentation, handled early rather than at offer stage
  - Adjacent entry roles — simulation, GNC software, site reliability for GNC infrastructure — as realistic vectors into the field
---

This closing lesson covers the two parts of the process that are not technical at all, and then ties the whole module together with the exercise that makes everything in it stick: a full, timed, recorded mock loop. Both non-technical parts share the same underlying discipline as everything else in this module — handle the thing that could derail you before it derails you, rather than discovering it under pressure, at the worst possible moment, with the least time to react.

## Handling eligibility documentation early

The legal substance — who the relevant US export-control regulations cover, what the eligible statuses are, what a deemed export is, and how a regulatory restriction differs from an employer's stated preference — belongs to the dedicated export-control eligibility module elsewhere in this curriculum, and is taught there in full. This lesson's job is narrower and purely practical: *when* that gets handled in a real interview timeline, and what handling it early actually buys you.

Eligibility for export-controlled work is typically confirmed at the very start of a pipeline, often in the first recruiter conversation, well before any technical round. That is not an arbitrary ordering — for roles where eligibility is a hard, unwaivable gate, confirming it early protects real time on both sides: there is no version of a strong technical performance that substitutes for a failed eligibility requirement, so finding out in week one rather than after weeks of technical preparation and multiple rounds is a better outcome for you as much as for the employer, not merely a courtesy extended to the employer.

The concrete, practical move this implies: know your own status with certainty *before* you are asked, not while being asked. If there is any genuine ambiguity in your own situation, resolve it against an authoritative source — an immigration attorney, or the actual government documentation governing your specific status — before a pipeline is already underway, rather than guessing in either direction. Guessing incorrectly toward "ineligible" costs you an opportunity you might actually have had; guessing incorrectly toward "eligible" costs everyone real time once it surfaces later, typically at a worse moment than the first conversation would have been. Treat your own eligibility status the way this module has treated every other fact worth knowing cold: something you can state immediately and accurately, not something you work out live under a stranger's question.

::: warning
Specific eligibility rules, and exactly how and when any individual employer confirms them, are genuinely outside what can be taught here as a fixed fact — regulations, programs, and individual company processes all vary and change. What is stable, and worth carrying forward regardless of the specifics, is the general pattern: resolve this early, against authoritative sources, rather than letting it surface as a surprise deep into a process you have already invested significant preparation in.
:::

## Adjacent entry roles as real vectors, not consolation prizes

Three roles recur as realistic entry points into GNC-adjacent work for a candidate whose path does not run through a traditional pipeline: **simulation** work (building and maintaining the 6-DOF simulation tools and infrastructure GNC engineers depend on), **GNC software** or analysis-automation work (building the tooling, pipelines, and infrastructure around GNC analysis rather than the control and estimation algorithms themselves), and **site reliability engineering for GNC infrastructure** (running the compute infrastructure — large-scale simulation and Monte Carlo compute, continuous integration for vehicle and simulation software — that GNC analysis depends on at scale).

The honest reason these are genuine vectors rather than a lesser path is a difference in *what gets weighted*, not a lower bar overall. Each of these roles weights general software-engineering skill — testing discipline, code quality, system design, operational reliability — more heavily relative to the deep, derivation-level control-and-estimation theory this module has spent most of its lessons drilling. That is a real, structural difference in what is being assessed, and it is a genuine relative strength for exactly the kind of candidate this curriculum is built for: someone who has built real, working software artifacts — the simulation architecture, the Monte Carlo pipeline, the tooling around a project — even while GNC-specific theoretical depth is still developing. The exact interview content and bar for any specific posting varies by team and by employer, and nothing here should be taken as a fixed description of what a particular role tests; the pattern worth trusting is the general one: these roles exist because the skills they need are broader than a single specialist track, which makes them accessible from more directions than the specialist GNC roles are.

Crucially, almost everything else in this module transfers to these rounds without modification. The behavioural techniques, the coding-round instincts around determinism and memory, the systems-design skeleton, the numbers-not-adjectives discipline, and especially the "how to be wrong well" material apply identically whether the round in front of you is a specialist controls interview or a simulation-infrastructure one — only the depth and frequency of the six core whiteboard derivations is likely to shift, lighter in these adjacent rounds, central in a specialist GNC one.

::: example Positioning a pivot toward an adjacent role, worked
"I've focused my preparation on GNC specifically, but I'm also very interested in the simulation and tooling side — the 6-DOF simulation architecture I built is honestly the piece of this project I'm proudest of, independent of the guidance algorithm it was built to test. I designed it to be modular specifically so new vehicle configurations and environment models could be added without touching the integration core, and I wrote a real test suite around it rather than only eyeballing plots." This answer does not apologize for interest in an adjacent role or frame it as a fallback; it states a genuine, specific strength — software architecture and testing discipline — with concrete evidence behind it, which is exactly what these roles are actually listening for.
:::

## The full mock loop

Every round this module has built — the project presentation, the coding rounds, the controls, estimation, dynamics, and systems rounds — comes together in one exercise: run the whole thing, in one sitting, against a real clock, in front of real people, and record it.

A full loop looks like the real thing it is rehearsing: a project presentation with a real question period after it, two timed coding rounds, and one round each in controls, estimation, dynamics, and systems design. Doing all of it in a single day, rather than spread comfortably across a week, is deliberate — it rehearses the actual fatigue and context-switching a real interview day imposes, which a comfortably-paced practice session never does.

Score each round against five specific, largely binary markers, not a vague sense of how it went: did you state your assumptions, did you ask a clarifying question where one was available, did you narrate your reasoning rather than working silently, did you recover cleanly when you made a mistake, and did you quote your own numbers with units when your own past work came up. Every one of those five is a concrete behaviour this module has built a full lesson around, which is exactly why they are the right things to score — a vague "did it go well" self-assessment is unreliable precisely because you cannot both perform under pressure and objectively observe your own performance at the same time.

::: example A self-scored round, worked
Reviewing a recorded estimation round against the five markers: "Assumptions — yes, stated the measurement model explicitly before deriving the gain. Clarifying question — no, I dove straight into the derivation when I could have first asked whether they wanted the general matrix form or the scalar intuition first. Narrated reasoning — mostly, but I went quiet for about twenty seconds while working through the transversality condition on the PN derivation, which on playback reads as a stall rather than as thinking. Recovered cleanly — yes, caught a sign error in the costate equation and fixed it out loud rather than silently. Quoted own numbers — no opportunity came up this round." Three clear yeses, one clear gap (the missed clarifying question), and one partial (the silent stretch) — a concrete, specific list to work on before the next loop, not a mood.
:::

This is precisely why recording and watching it back matters, and why it will be uncomfortable: you cannot accurately judge your own pacing, filler words, or whether you actually did the things you believe you did from inside the performance itself. A recording is the only source of that feedback that is not filtered through your own memory of how it felt, which is a genuinely different and generally more flattering thing than how it looked.

Run the full loop twice, with real, deliberate work on the two weakest rounds in between, rather than once. A single loop's self-assessment is unreliable in a specific, structural way — on the first attempt, you do not yet have a calibrated sense of what "good" looks like from the outside, since you have never watched yourself do this before. A second loop, run after genuinely fixing the two weakest rounds identified in the first, gives you an actual before-and-after comparison against your own baseline, which is the only version of "am I ready" that is answerable with evidence rather than hope.

::: key
Score every round on five markers: stated assumptions, asked a clarifying question, narrated reasoning, recovered cleanly from a mistake, quoted your own numbers with units. Run the full loop twice, fixing the two weakest rounds in between — the second loop is what turns a guess about readiness into a measured one.
:::

## Check yourself

::: check
Why does confirming eligibility for export-controlled work early in a process benefit the candidate specifically, not only the employer?
:::

::: answer
For roles where eligibility is a hard, unwaivable gate, no amount of strong technical performance in later rounds can substitute for it — so if the outcome is going to be a no on eligibility grounds, finding that out in the first conversation costs a candidate far less time, preparation effort, and emotional investment than finding it out after several weeks of technical rounds. Framing it as only a courtesy to the employer misses that the candidate has at least as much to lose from a late-surfacing eligibility problem as the employer does, arguably more, since the candidate's sunk preparation time is the larger cost in that scenario.
:::

::: check
Your own eligibility status is genuinely unclear to you. What is the concrete right move, and what are the costs of guessing wrong in each direction?
:::

::: answer
Resolve the ambiguity against an authoritative source — an immigration attorney or the actual governing documentation for your specific status — before a pipeline is underway, rather than assuming an answer in either direction. Guessing "ineligible" when you are in fact eligible costs you an opportunity you genuinely had; guessing "eligible" when you are not costs everyone involved real time and effort once it surfaces, typically later and less conveniently than an early, accurate answer would have. Neither error is cost-free, which is precisely why this is worth resolving with certainty rather than assumption.
:::

::: check
Explain the honest mechanism by which simulation, GNC software, and site-reliability-for-GNC roles are genuine entry vectors, without overstating it as "the bar is lower."
:::

::: answer
The mechanism is a difference in what is weighted, not a uniformly lower bar: these roles place relatively more weight on general software-engineering skill — testing, system design, operational reliability — and relatively less on the deep, derivation-level control and estimation theory a specialist GNC role centers on. For a candidate whose software-engineering artifacts (a well-tested simulation core, a real analysis pipeline) are genuinely strong even while GNC-specific theoretical depth is still developing, that reweighting is a real, structural advantage rather than a consolation path — it rewards a different, equally real form of demonstrated skill.
:::

::: check
State the five markers used to score a mock interview round, and explain why they were chosen over a general "how did that feel" self-assessment.
:::

::: answer
Stated assumptions, asked a clarifying question where one was available, narrated reasoning rather than working silently, recovered cleanly from a mistake, and quoted your own numbers with units when your own work came up. They were chosen because each is a specific, largely observable behaviour this module has built a dedicated lesson around, which makes them checkable from a recording in a way "how did that feel" is not — a feeling is generated from inside the performance and is unreliable for exactly that reason, while "did I ask a clarifying question" has a yes-or-no answer any outside observer, including your own later self watching a recording, can verify.
:::

::: check
Why does watching a recording of your own mock round produce more reliable feedback than your own real-time sense of how it went?
:::

::: answer
Performing a skill under pressure and objectively observing that same performance are not tasks you can do at the same time with any real accuracy — attention spent monitoring your own delivery is attention not spent on the actual reasoning, and the reverse is equally true, so a real-time self-assessment is necessarily a compromised, partial one. A recording removes that conflict entirely: it can be watched afterward with full attention on the observation itself, revealing pacing, filler, and gaps between what you believe you did and what you actually did that are essentially invisible from inside the performance in the moment.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Eligibility, handled early | Know your own status with certainty before being asked; resolve genuine ambiguity against an authoritative source before a pipeline begins, not during it |
| Adjacent roles | Simulation, GNC software/analysis tooling, and site reliability for GNC infrastructure weight software-engineering skill more heavily relative to deep derivation-level theory — a real, structural difference, not a lower bar |
| What transfers | Behavioural technique, coding-round instincts, the systems skeleton, numbers-not-adjectives, and "how to be wrong well" apply unchanged across specialist and adjacent rounds alike |
| Full mock loop | One day, real clock, every round this module covers, recorded |
| Self-scoring | Stated assumptions, asked a clarifying question, narrated reasoning, recovered cleanly, quoted own numbers with units |
| Run it twice | The first loop calibrates; the second, after fixing the two weakest rounds, is what turns a guess about readiness into a measured one |

This closes the module. Every lesson in it has been building toward the same afternoon: a clock, a whiteboard, someone who will interrupt, and a body of work you can now defend out loud, under pressure, honestly, and cold.
