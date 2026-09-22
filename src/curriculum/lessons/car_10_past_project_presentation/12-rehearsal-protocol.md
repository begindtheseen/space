---
id: l12-rehearsal-protocol
title: "Rehearsal: record it, time it, and be attacked"
minutes: 18
covers:
  - "rehearsal protocol: record yourself, present to a hostile reviewer, time it, drill 30 anticipated questions"
---

Everything in the previous eleven lessons is material. This one is about converting it into performance, and it is the lesson with the largest gap between what candidates do and what is available to them.

The leverage is a ratio rather than an absolute. Coding rounds are drilled by everybody, so an extra hour there buys you a small amount relative to the field. This round, on the account this curriculum's pipeline material gives of it, is the one candidates most consistently neglect — and it is heavily weighted, and it is evaluated by the largest group of engineers you will face in the whole process, each of whom contributes to the debrief. The distance between typical preparation and achievable preparation is wider here than anywhere else in the pipeline, which is the entire argument for spending the hours.

::: key
Rehearsal protocol: record yourself, present to a hostile reviewer, time it strictly, and drill thirty anticipated questions. This round is the least practised by candidates and the most heavily weighted, which is exactly why rehearsal has such a large payoff.
:::

## Record yourself, and measure rather than watch

"Watch it back and see how you did" is not a protocol; it produces a vague sense of discomfort and no specific change. Watch it with a tally, and count four things.

**Hedges, per minute.** "I think", "sort of", "kind of", "I believe", "probably". Mark each one, and mark separately those attached to numbers you actually measured — those are the expensive ones, for the reasons the previous lesson gives.

**Answers over thirty seconds.** The rehearsal exercise names rambling past thirty seconds as one of the four things to eliminate, and the only way to know is to time the answers individually.

**Over-claims.** Any sentence asserting more than your evidence supports. "The filter is validated" when it is verified. "It always converges" when it converged on the cases you ran. These are easier to catch on a recording than in the moment, because on the recording you are listening rather than talking.

**Section times against plan.** Not total time — per section. The section that expands is almost always "approach", because it is the most comfortable material.

A recording also gives you the one number that makes the thirty-second rule actionable: your own speaking rate. Count the words in one continuous minute of your own delivery. If it comes out near $150$ words a minute then a thirty-second answer is about $150/2 = 75$ words, which is five or six sentences — a length you can feel while speaking, unlike an abstract instruction to be brief. Measure it rather than assuming it; delivery rates differ substantially between people and between nervous and settled speaking.

::: example A rehearsal log across four takes
A candidate rehearsing the anchor-C talk, counting from her own recordings:

| | Take 1 | Take 2 | Take 3 | Take 4 |
| --- | --- | --- | --- | --- |
| Total time | 18:40 | 17:05 | 15:50 | 14:55 |
| Hedges per minute | 4.2 | 3.1 | 1.4 | 0.6 |
| Hedges on measured numbers | 6 | 4 | 1 | 0 |
| Answers over 30 s | 7 of 12 | 5 of 12 | 2 of 12 | 1 of 12 |
| Over-claims | 3 | 2 | 0 | 0 |
| Approach section | 5:10 | 4:30 | 3:20 | 3:05 |

Take 1 ran $1120$ seconds against a $900$-second target — $1120/900\approx1.24$, about a quarter over. The instinct is to speak faster. The arithmetic says otherwise: she needs to remove $1120-900 = 220$ seconds, and at roughly ninety seconds a slide that is $220/90\approx2.4$ slides' worth of material. You cannot talk two and a half slides faster; you cut them. She cut one approach slide and one results slide into the appendix, which is most of the gap between takes 1 and 3.

The hedge counts fall for a different reason: they fall because she counted them. Almost nobody hedges deliberately, and almost everybody stops once the habit has been made visible with a number attached.

The useful rule of thumb is the ten per cent line. Over by more than about a tenth, cut content; under it, tighten transitions and stop adding sentences between slides.
:::

## Time it strictly, and time the sections

A stopwatch on the total is not enough, because a total that is on target can hide a talk that spent five minutes on approach and ninety seconds on verification. Log each section against the allocation from the structure lesson. Two patterns show up almost universally: the approach section expands, and the last two sections — result and what you would do differently — absorb whatever is left, which is usually nothing.

Rehearse the compressed version too. If the format turns out to be ten minutes rather than fifteen, or the room starts late, you want a version you have actually delivered, not a plan to improvise cuts under pressure.

## The hostile reviewer

The exercise asks for at least two people, ideally technical, with explicit instructions to interrupt, challenge assumptions, and ask "why not X" repeatedly. The word "explicit" is load-bearing: an unbriefed friend will be polite, and a polite rehearsal is the one form of practice that actively misleads, because it tells you the talk survives conditions it will not face.

Brief them with specifics.

- **Interrupt mid-sentence, at least twice, in the first three minutes.** This is the most common real event you cannot simulate alone.
- **Ask "why" three times in a row on one answer.** The three-why drill, below, is the single most efficient depth probe available.
- **Ask what I personally did, twice, in different words.**
- **Pick a claim and ask how I know it.** Any claim.
- **Do not help me.** No nodding through a vague answer, no filling a silence, no accepting "roughly" when a number exists.

A non-technical reviewer is not a wasted session; it is the best available test of the communication axis. Give them one instruction: after the talk, restate the problem and the result in their own words. If they cannot, the first ninety seconds needs rewriting, regardless of how well the technical rehearsals went.

::: example The three-why drill, on anchor project A
**Why one.** "Why RK4?"

"Fourth-order accuracy at four derivative evaluations per step, and I verified the order rather than assuming it — halving the step shrank the error by about a factor of sixteen, three halvings running, then flattened."

**Why two.** "Why does it flatten?"

"Roundoff. Once truncation error drops near the resolution of double precision for these state magnitudes, further halving adds arithmetic without adding accuracy, and the error curve bottoms out at the floating-point noise floor rather than continuing to fall. The flattening is itself evidence the convergence test was real — a test that kept improving past that point would mean I was measuring something other than truncation error."

**Why three.** "So what step size did you run the campaign at, and what set it?"

This is where an unprepared answer stops, and where a prepared one gets more interesting: "Not the integrator's accuracy floor — that would be an argument for the smallest step I can afford, which is the wrong criterion. The step is set by the fastest dynamics I need to resolve, which here is the attitude loop rather than the trajectory, and then I confirmed that the integration error at that step is orders of magnitude below the uncertainty in the aerodynamic and atmospheric models it is integrating. There is no point resolving the numerics far below the fidelity of the physics."

**When it bottoms out.** Sometimes the third why finds nothing, and that is the point of the drill rather than a failure of it. Every place the drill bottoms out is one of two things: a backup slide you should build, or an honest "I have not measured that" you should rehearse. Both are cheap to fix a week before and expensive to discover in the room.
:::

## Drill the thirty questions

The thirty questions from the earlier exercise are not a document to have written. They are a drill.

Answer them out loud, in two sentences each, in a shuffled order — shuffling matters, because an order you have rehearsed is an order you will be thrown by when it changes. Thirty answers at thirty seconds is $30\times30 = 900$ seconds of speaking, about fifteen minutes plus thinking time, which is a short enough session to run daily in the week before.

What you are drilling is not the content. It is the opening clause. The gap between a good answer and a bad one is almost always the first two seconds, where a candidate either starts with the answer — "Fixed final time, because it is one solve instead of a line search" — or starts with a throat-clear that turns into an improvisation. Drill until the first clause is automatic and let the rest follow.

::: warning
Rehearsing alone has a specific blind spot that more solo repetitions cannot fix: the questions you can generate about your own project are drawn, by construction, from the parts you have already thought about. Your hardest self-generated question is a question you already have an answer to. That is why the hostile reviewer is not an optional extra at the end of the protocol — it is the only step that samples from the questions you have not anticipated, which is exactly the population the panel will be drawing from.
:::

## The stopping rule

This module's rehearsal exercise ends with an unusually concrete termination criterion: repeat until the recording shows no hedging, no over-claiming, nothing rambling past thirty seconds, and no "I think" attached to something you knew. Four countable things, all zero.

That is a rarity worth appreciating. Most interview preparation has no stopping rule at all, which is why it expands to fill the available anxiety. This one tells you when you are done — and, just as usefully, tells you that you are not done when the talk merely feels smooth.

## Check yourself

::: check
A rehearsal runs $18{:}40$ against a fifteen-minute target. Work out what has to change, and explain why speaking faster is the wrong response.
:::

::: answer
$18{:}40$ is $1120$ seconds against $900$, so $1120/900\approx1.24$ — about a quarter over — and the excess is $1120-900 = 220$ seconds. At roughly ninety seconds a slide that is $220/90\approx2.4$ slides' worth of material. Speaking faster cannot absorb two and a half slides, and attempting it degrades every section uniformly while making the delivery harder to follow. The fix is to cut content, moving it to the appendix where it remains available on request. The working rule is that anything more than about ten per cent over is a content problem, and anything under it is a transitions problem.
:::

::: check
Name the four things to count on a recording, and say why counting beats watching.
:::

::: answer
Hedges per minute, with those attached to measured numbers counted separately; answers running over thirty seconds; over-claims, meaning any sentence asserting more than the evidence supports; and section times against the planned allocation. Counting beats watching because a count produces a specific, falsifiable target that can go to zero, whereas watching produces a general impression that does not tell you what to change. It also works on the specific mechanism behind hedging: almost nobody hedges on purpose, and the habit tends to collapse once it has been made visible with a number attached to it.
:::

::: check
Why is an unbriefed friendly reviewer described here as actively misleading rather than merely unhelpful?
:::

::: answer
Because they give you positive evidence about conditions you will not face. A polite reviewer nods through a vague answer, fills your silences, accepts "roughly" where a number exists, and does not interrupt — so the rehearsal returns the finding that the talk survives, when what it actually tested was a version of the round that will not happen. That is worse than no rehearsal, which at least leaves you correctly uncertain. The briefing therefore has to be specific: interrupt mid-sentence early, ask why three times in a row, ask about personal contribution twice in different words, pick any claim and ask how it is known, and offer no help.
:::

::: check
What does it mean when the three-why drill bottoms out, and what are the two possible repairs?
:::

::: answer
It means you have found the edge of your own preparation on that thread, which is the drill working rather than failing. The two repairs are to build a backup slide, if the honest answer is something that has to be seen — a derivation, a table, a curve — or to rehearse an "I have not measured that" response with a bound and a method, if the honest answer is that you do not know. Both cost very little a week in advance and are expensive to encounter for the first time in front of the panel.
:::

::: check
Explain the specific blind spot of solo rehearsal, and why more repetitions do not close it.
:::

::: answer
The questions you can generate about your own project are drawn from the parts of it you have already thought about, so your hardest self-generated question is by construction one you already have an answer to. Repetition drills the answers you have rather than sampling the ones you lack, so the blind spot is structural rather than a matter of effort. Only an outside reviewer samples from the population the panel will draw from — the questions you did not anticipate — which is why that step is the one part of the protocol that cannot be substituted with more solo time.
:::

## Summary

| Element | What to do |
| --- | --- |
| Record | Count hedges per minute, hedges on measured numbers, answers over 30 s, over-claims, and section times |
| Speaking rate | Measure your own from one continuous minute; at $150$ words a minute, 30 seconds is $150/2 = 75$ words |
| Time | Per section, not just total; rehearse the compressed ten-minute version too |
| Over by | More than ten per cent — cut content; less — tighten transitions |
| Hostile reviewer | At least two people, briefed explicitly: interrupt early, three whys, contribution twice, any claim challenged, no help |
| Non-technical reviewer | One job: restate the problem and result afterwards in their own words |
| Thirty questions | Two sentences each, shuffled order, out loud — $30\times30 = 900$ seconds a session; drill the opening clause |
| Solo blind spot | Your hardest self-generated question is one you can already answer |
| Stopping rule | No hedging, no over-claiming, nothing over 30 seconds, no "I think" when you knew |

That closes the module. The list was audited for defensibility and cleared for disclosure; the talk was built in seven parts against a clock, on eight to twelve assertion-evidence slides with one diagram carrying it and an appendix behind it; the room, the two decisive questions, the answer you do not have, and the result that was negative all have a shape now. What remains is the thing the whole module has been pointing at: the project you built is the project you defend, and the defence is rehearsed until four counters read zero.
