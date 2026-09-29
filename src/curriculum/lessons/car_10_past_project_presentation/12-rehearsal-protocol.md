---
id: l12-rehearsal-protocol
title: "Rehearsal: record it, time it, and be attacked"
minutes: 19
covers:
  - "rehearsal protocol: record yourself, present to a hostile reviewer, time it, drill 30 anticipated questions"
---

A school play is not ready because every actor has read the script. It is ready after the dress rehearsal — full costumes, real timing, someone in the audience who says "I could not hear you in the back row." Reading the script and performing it are different skills, and only one of them happens on opening night.

Everything in the previous eleven lessons is the script. This lesson is the dress rehearsal: how to turn the material into a performance. It is also the lesson with the largest gap between what candidates usually do and what they could do.

The payoff is about comparison, not absolute effort. Everybody drills coding problems, so an extra hour there moves you only a little relative to the other candidates. This round, on the account this curriculum's hiring-pipeline material gives of it, is the one candidates most consistently neglect. Yet it is heavily weighted, and it is judged by the largest group of engineers you will face in the whole process — each of whom feeds into the **[[debrief|debrief]]**, the meeting where interviewers compare notes and decide. The distance between typical preparation and possible preparation is wider here than anywhere else in the pipeline. That is the whole argument for spending the hours.

::: key
Rehearsal protocol: record yourself, present to a hostile reviewer, time it strictly, and drill thirty anticipated questions. This round is the least practiced by candidates and the most heavily weighted, which is exactly why rehearsal has such a large payoff.
:::

## Record yourself, and count instead of watching

"Watch it back and see how you did" is not a plan. It leaves you with a vague uncomfortable feeling and no specific change. Instead, watch with a **tally** — a running count, one mark per event — and count four things.

**Hedges per minute.** A **hedge** is a softening phrase: "I think," "sort of," "kind of," "I believe," "probably." Mark each one. Mark separately the ones attached to numbers you actually measured. Those are the expensive ones, for the reasons the previous lesson on "I do not know" gave.

**Answers over thirty seconds.** The rehearsal exercise names rambling past thirty seconds as one of the four habits to eliminate. The only way to know is to time each answer on its own.

**Over-claims.** Any sentence that asserts more than your evidence supports. "The filter is [[validated|verify-validate]]" when it is only *verified*. "It always converges" when it converged on the cases you ran. These are easier to catch on a recording than in the moment, because on the recording you are listening, not talking.

**Section times against plan.** Not the total time — each section. The section that grows is almost always "approach," because it is the most comfortable material.

A recording also gives you the one number that makes the thirty-second rule usable: your own **[[speaking rate|speaking-rate]]**. Count the words in one continuous minute of your own delivery. If it comes out near $150$ words a minute, then a thirty-second answer is about

$$
\frac{150\ \text{words}}{2} = 75\ \text{words},
$$

which is five or six sentences. That is a length you can feel while you speak, unlike a vague instruction to "be brief." Measure your rate instead of assuming it; it differs a lot between people, and between nervous and settled speaking.

::: example A rehearsal log across four takes
A candidate rehearsing her anchor-C talk (the quaternion filter) counts from her own recordings. Times are minutes:seconds.

| | Take 1 | Take 2 | Take 3 | Take 4 |
| --- | --- | --- | --- | --- |
| Total time | 18:40 | 17:05 | 15:50 | 14:55 |
| Hedges per minute | 4.2 | 3.1 | 1.4 | 0.6 |
| Hedges on measured numbers | 6 | 4 | 1 | 0 |
| Answers over 30 s | 7 of 12 | 5 of 12 | 2 of 12 | 1 of 12 |
| Over-claims | 3 | 2 | 0 | 0 |
| Approach section | 5:10 | 4:30 | 3:20 | 3:05 |

**Step 1 — convert to seconds.** Take 1 ran $18{:}40$, which is $18\times60 + 40 = 1120$ seconds. The target is fifteen minutes, $15\times60 = 900$ seconds.

**Step 2 — how far over?** $1120/900\approx1.24$, so about a quarter over.

**Step 3 — how much to remove?** $1120-900 = 220$ seconds.

**Step 4 — in slides.** At roughly ninety seconds a slide, that is $220/90\approx2.4$ slides' worth of material.

The instinct is to speak faster. The arithmetic says otherwise: you cannot talk two and a half slides faster. You [[cut them|overrun-in-slides]]. She moved one approach slide and one results slide into the appendix, which accounts for most of the gap between takes 1 and 3.

The hedge counts fall for a different reason: they fall *because she counted them*. Almost nobody hedges on purpose, and almost everybody stops once the habit is made visible with a number attached.

**Sanity check.** Take 4 at $14{:}55$ is $895$ seconds, inside $900$ with five seconds to spare — and the approach section shrank from $310$ to $185$ seconds, which is where most of the time came from.

The useful rule of thumb is the **ten percent line**. Over by more than about a tenth, cut content. Under that, tighten the transitions and stop adding sentences between slides.
:::

## Time it strictly, and time the sections

A stopwatch on the total is not enough. A total right on target can hide a talk that spent five minutes on approach and ninety seconds on verification. Log each section against the time budget from the talk-structure lesson.

Two patterns show up almost every time. The approach section grows. And the last two sections — result, and what you would do differently — get whatever is left over, which is usually nothing.

Rehearse a squeezed version too. If the format turns out to be ten minutes rather than fifteen, or the room starts late, you want a version you have actually delivered — not a plan to make cuts on the fly under pressure.

## The hostile reviewer

The exercise asks for at least two people, ideally technical, with **explicit** instructions to interrupt, challenge assumptions, and ask "why not X" again and again. The word "explicit" is doing real work. A friend who has not been told what to do will be polite. And a polite rehearsal is the one kind of practice that actively misleads you: it tells you the talk survives conditions it will never face.

Brief your reviewers with specifics:

- **Interrupt me mid-sentence, at least twice, in the first three minutes.** This is the most common real event, and you cannot practice it alone.
- **Ask "why" three times in a row on one answer.** The three-why drill, below, is the most efficient depth test there is.
- **Ask what I personally did, twice, in different words.**
- **Pick any claim and ask how I know it.**
- **Do not help me.** No nodding through a vague answer, no filling a silence, no accepting "roughly" when a number exists.

A non-technical reviewer — a parent, a friend who is not an engineer — is not a wasted session. They are the best test available of the communication axis. Give them one job: after the talk, retell the problem and the result in their own words. If they cannot, your first ninety seconds needs rewriting, however well the technical rehearsals went.

::: example The three-why drill, on anchor project A
Anchor project A is the rocket-flight simulation. A simulation moves forward in small time steps, and an **integrator** is the recipe that works out each next step. Here a reviewer asks "why" three times in a row.

**Why one.** "Why [[RK4|runge-kutta]]?"

"Fourth-order accuracy at four derivative evaluations per step, and I verified the order instead of assuming it — halving the step shrank the error by about a factor of sixteen, three halvings running, then flattened."

*Decoded:* "fourth-order" means the error shrinks like the step size to the fourth power. Halving the step should divide the error by $2^4 = 2\times2\times2\times2 = 16$. That is exactly what she measured.

**Why two.** "Why does it flatten?"

"[[Roundoff|error-floor]]. Once truncation error drops near the resolution of double precision for these state sizes, further halving adds arithmetic without adding accuracy, and the error curve bottoms out at the floating-point noise floor instead of continuing to fall. The flattening is itself evidence the convergence test was real — a test that kept improving past that point would mean I was measuring something other than truncation error."

*Decoded:* **truncation error** is the error from taking finite steps; **roundoff** is the error from the computer keeping only about sixteen digits (**double precision**).

**Why three.** "So what step size did you run the campaign at, and what set it?"

This is where an unprepared answer stops, and where a prepared one gets more interesting: "Not the integrator's accuracy floor — that would argue for the smallest step I can afford, which is the wrong criterion. The step is set by the fastest dynamics I need to resolve, which here is the attitude loop rather than the trajectory. Then I confirmed that the integration error at that step is orders of magnitude below the uncertainty in the aerodynamic and atmosphere models it is integrating. There is no point resolving the numerics far below the fidelity of the physics."

**When it bottoms out.** Sometimes the third why finds nothing. That is the point of the drill, not a failure of it. Every place the drill bottoms out is one of two things: a backup slide you should build, or an honest "I have not measured that" you should rehearse. Both are cheap to fix a week before, and expensive to discover in the room.
:::

## Drill the thirty questions

The thirty questions from the earlier exercise are not a document to file away. They are a drill.

Answer them out loud, two sentences each, in a **shuffled** order. Shuffling matters: an order you have rehearsed is an order that throws you when it changes. Thirty answers at thirty seconds each is

$$
30 \times 30\,\mathrm{s} = 900\,\mathrm{s} = 15\ \text{minutes}
$$

of speaking, plus thinking time. That is short enough to run every day in the final week.

What you are really drilling is not the content. It is the **opening clause** — the first few words. The gap between a good answer and a bad one is almost always the first two seconds. A candidate either starts with the answer — "Fixed final time, because it is one solve instead of a line search" — or starts by clearing her throat, and the throat-clearing turns into improvising. Drill until the first clause is automatic, and let the rest follow.

::: warning
Rehearsing alone has a blind spot that more solo repetitions cannot fix. The questions you can think up about your own project come, by their nature, from the parts you have already thought about. Your hardest self-made question is one you already have an answer to. That is why the hostile reviewer is not an optional extra at the end. It is the only step that [[samples|sample-population]] from the questions you did *not* anticipate — exactly the pool the panel will draw from.
:::

## The stopping rule

This module's rehearsal exercise ends with an unusually concrete rule for when you are done: repeat until the recording shows no hedging, no over-claiming, no answer rambling past thirty seconds, and no "I think" attached to something you knew. Four countable things, all at zero.

That is rare, and worth appreciating. Most interview preparation has no stopping rule at all, which is why it [[expands to fill|parkinsons-law]] whatever worry you have available. This rule tells you when you are done. Equally useful, it tells you that you are *not* done when the talk merely feels smooth.

## Check yourself

::: check
A rehearsal runs $18{:}40$ against a fifteen-minute target. Work out what has to change, and explain why speaking faster is the wrong response.
:::

::: answer
$18{:}40$ is $18\times60+40 = 1120$ seconds against $900$, so $1120/900\approx1.24$ — about a quarter over — and the excess is $1120-900 = 220$ seconds. At roughly ninety seconds a slide, that is $220/90\approx2.4$ slides' worth of material. Speaking faster cannot absorb two and a half slides; trying makes every section worse and the whole talk harder to follow. The fix is to cut content, moving it to the appendix, where it stays available if someone asks. The working rule: more than about ten percent over is a content problem; less than that is a transitions problem.
:::

::: check
Name the four things to count on a recording, and say why counting beats watching.
:::

::: answer
Hedges per minute, with those attached to measured numbers counted separately; answers running over thirty seconds; over-claims, meaning any sentence asserting more than the evidence supports; and section times against the planned budget. Counting beats watching because a count gives a specific target that can be driven to zero, while watching gives only a general impression that does not say what to change. Counting also attacks how hedging works: almost nobody hedges on purpose, and the habit tends to collapse once it is made visible with a number attached.
:::

::: check
Why does this lesson call an unbriefed friendly reviewer actively misleading, not merely unhelpful?
:::

::: answer
Because they hand you positive evidence about conditions you will not face. A polite reviewer nods through a vague answer, fills your silences, accepts "roughly" where a number exists, and never interrupts. So the rehearsal reports that the talk survives — when what it actually tested was a version of the round that will not happen. That is worse than no rehearsal, which at least leaves you correctly unsure. The briefing therefore has to be specific: interrupt mid-sentence early, ask why three times in a row, ask about personal contribution twice in different words, pick any claim and ask how it is known, and offer no help.
:::

::: check
What does it mean when the three-why drill bottoms out, and what are the two possible repairs?
:::

::: answer
It means you have found the edge of your preparation on that line of questioning — the drill working, not failing. The two repairs: build a backup slide, if the honest answer is something that has to be seen (a derivation, a table, a curve); or rehearse an "I have not measured that" response with a bound and a method, if the honest answer is that you do not know. Both cost very little a week ahead, and are expensive to meet for the first time in front of the panel.
:::

::: check
Explain the blind spot of solo rehearsal, and why more repetitions do not close it.
:::

::: answer
The questions you can think up about your own project come from the parts you have already thought about, so your hardest self-made question is, by its nature, one you can already answer. Repetition drills the answers you have; it does not sample the ones you lack. So the blind spot is built into the method, not a matter of effort. Only an outside reviewer samples from the pool the panel will draw from — the questions you did not anticipate — which is why that step cannot be replaced with more time alone.
:::

## Summary

| Element | What to do |
| --- | --- |
| Record | Count hedges per minute, hedges on measured numbers, answers over 30 s, over-claims, and section times |
| Speaking rate | Measure your own from one continuous minute; at $150$ words a minute, 30 seconds is $150/2 = 75$ words |
| Time | Per section, not only the total; rehearse the squeezed ten-minute version too |
| Over by | More than ten percent — cut content; less — tighten transitions |
| Overrun arithmetic | $18{:}40 = 1120\,\mathrm{s}$; $1120 - 900 = 220\,\mathrm{s} \approx 2.4$ slides at $90\,\mathrm{s}$ each |
| Hostile reviewer | At least two people, briefed explicitly: interrupt early, three whys, contribution twice, any claim challenged, no help |
| Non-technical reviewer | One job: retell the problem and result afterward in their own words |
| Thirty questions | Two sentences each, shuffled order, out loud — $30\times30 = 900$ seconds a session; drill the opening clause |
| Solo blind spot | Your hardest self-made question is one you can already answer |
| Stopping rule | No hedging, no over-claiming, nothing over 30 seconds, no "I think" when you knew |

That closes the module. The list was checked for defensibility and cleared for disclosure. The talk was built in seven parts against a clock, on eight to twelve assertion-evidence slides with one diagram carrying it and an appendix behind it. The room, the two decisive questions, the answer you do not have, and the result that was negative all have a shape now. What remains is what the whole module has been pointing at: the project you built is the project you defend, and the defense is rehearsed until four counters read zero.

::: context debrief Where your score actually goes
After an on-site interview day, the interviewers usually write up their feedback and then meet — or post notes — to compare. That meeting is the **debrief**, and it is where a hire or no-hire recommendation is formed. In a panel round, every engineer in the room brings an opinion to it, so one talk reaches more voters than any other round.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2">
    <circle cx="30" cy="25" r="10"/><circle cx="30" cy="55" r="10"/><circle cx="30" cy="85" r="10"/>
    <circle cx="30" cy="115" r="10"/><circle cx="60" cy="40" r="10"/><circle cx="60" cy="70" r="10"/>
    <circle cx="60" cy="100" r="10"/><circle cx="60" cy="130" r="10"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="72" y1="70" x2="138" y2="70"/>
  </g>
  <polygon points="146,70 136,65 136,75" fill="#1f2a44"/>
  <rect x="146" y="48" width="90" height="44" rx="8" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="191" y="75" font-size="12" fill="#1f2a44" text-anchor="middle">debrief</text>
  <line x1="236" y1="70" x2="262" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="270,70 260,65 260,75" fill="#1f2a44"/>
  <rect x="270" y="48" width="82" height="44" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="311" y="75" font-size="12" fill="#1f2a44" text-anchor="middle">decision</text>
  <text x="104" y="146" font-size="11" fill="#6c7a93" text-anchor="middle">a panel of eight, eight opinions</text>
</svg>
```
:::

::: context verify-validate Two words engineers keep apart
**Verification** asks "did I build the thing right?" — does the software do what its specification says? **Validation** asks "did I build the right thing?" — does the model match the real world it is meant to represent? A filter checked against simulated truth, where you know the right answer, is verified. Showing it works on real flight data is a step toward validation. Saying "validated" when you mean "verified" claims evidence you do not have, and panels notice.
:::

::: context speaking-rate How fast people talk
Conversational English is often quoted at somewhere around 120 to 180 words per minute, and presenters vary widely inside and beyond that range. Nerves usually push the rate up. That is why the lesson says to measure your own: record one continuous minute, count the words, and use that number. If you speak at 180 words a minute, your thirty-second answer is 90 words, not 75.
:::

::: context overrun-in-slides The overrun, measured in slides
Take 1 ran 220 seconds past the 900-second target. At about 90 seconds a slide, the overrun is a little more than two slides — too much to recover by talking faster.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="225" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="152" y="48" font-size="12" fill="#1f2a44" text-anchor="middle">target 900 s</text>
  <rect x="265" y="30" width="55" height="26" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="292" y="22" font-size="12" fill="#b4232c" text-anchor="middle">+220 s</text>
  <g fill="#f2b880" stroke="#1f2a44">
    <rect x="265" y="70" width="22.5" height="20"/>
    <rect x="287.5" y="70" width="22.5" height="20"/>
    <rect x="310" y="70" width="10" height="20"/>
  </g>
  <text x="40" y="84" font-size="12" fill="#1f2a44">each orange block = one 90 s slide</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">220 ÷ 90 ≈ 2.4 slides to cut</text>
</svg>
```
:::

::: context runge-kutta Named after two mathematicians
**RK4** (said "R-K-four") is the classic fourth-order Runge-Kutta method, named after the German mathematicians Carl Runge and Martin Kutta, who developed this family of methods around 1900. Each step samples the slope four times — at the start, twice in the middle, and at the end — and blends them. It is one of the most widely used integrators in simulation, and you will build one yourself in the course's numerical-methods material.
:::

::: context error-floor Why the error stops falling
On a plot of error against step size, both on log scales, RK4's error falls steeply as the step shrinks — divided by 16 for each halving. Then it hits a floor set by the computer's limited digits and goes flat, or even creeps up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50,128 80,131 110,126 140,130" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="140" y1="130" x2="320" y2="20" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="252" y="92" font-size="11" fill="#1d6fd1">halve step: error ÷ 16</text>
  <text x="95" y="116" font-size="11" fill="#b4232c" text-anchor="middle">roundoff floor</text>
  <text x="340" y="168" font-size="11" fill="#1f2a44" text-anchor="end">step size (log)</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">error (log)</text>
</svg>
```

Seeing the floor is proof the test measured truncation error, not something else.
:::

::: context sample-population Sampling from the right pool
In statistics, a **population** is the whole set of things you care about, and a **sample** is the handful you actually look at. A sample only tells you about the population it was drawn from. Your self-written questions are a sample from "questions I have already thought of." The panel draws from "questions eight other engineers might think of," a much bigger pool. Only other people can give you a sample from that one.
:::

::: context parkinsons-law Work that grows to fill the space
In 1955 the British historian C. Northcote Parkinson wrote, in an essay in *The Economist*, that "work expands so as to fill the time available for its completion." It became known as **Parkinson's law**. Preparation with no finish line behaves the same way: there is always one more thing to review. A countable stopping rule — four counters at zero — is the cure.
:::
