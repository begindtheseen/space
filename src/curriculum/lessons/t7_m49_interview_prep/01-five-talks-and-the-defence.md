---
id: l01-five-talks-and-the-defence
title: The five-talk system, and rehearsing the defense
minutes: 22
covers:
  - The project presentation: choosing five topics, building a 10 to 20 minute talk for each, and rehearsing the defence rather than the delivery
---

Picture a science fair. You stand beside your poster. A judge walks up and listens to your first minute. Then the judge stops you and asks, "How do you know the plants grew because of the music and not the sunlight?" From that moment on, the poster matters much less. What matters is whether you have an answer.

A project talk in a GNC interview works the same way. The **[[panel|panel]]** — the three to six engineers interviewing you — will listen for a while, and then they will start poking. So a project talk is not a status update. A status update reports what happened. A **project talk** makes a claim — "this problem was hard for a reason I can name, and here is what I did about it" — and then defends that claim against people whose job for the next fifteen minutes is to find its weak spot. The talk itself is maybe a third of what gets scored. The questions afterward are the rest, and for many panels the bigger rest.

Treating the talk like a status update is the most common reason strong work comes across as weak. Someone who defended a thesis learned this skill by accident; a self-taught candidate has to build it on purpose. This lesson covers both halves: what to choose and how to build a ten-to-twenty-minute talk, and then how to rehearse the **defense** — the questions — rather than the delivery.

## Choosing five topics that cover different ground

Think of a job panel as a checklist of worries. Each worry is a question they want closed before they can hire you. Five talks should close five different worries. Five versions of your best result close one worry five times and waste four slots.

A good spread, and the one this module's exercises are built around:

1. **Guidance or optimization.** It answers: "Can this person turn a requirement into a problem a computer can solve?"
2. **Estimation or filtering.** It answers: "Does this person understand what a **state estimate** (a best guess of where the vehicle is and how it is moving) is — and how sure of it they should be?"
3. **Simulation or software architecture.** It answers: "Can this person build something other people would have to maintain?"
4. **Verification or Monte Carlo.** A **Monte Carlo** campaign runs a simulation thousands of times, each with slightly different random inputs, to see the whole spread of outcomes. It answers: "Does this person know the difference between a result that *looks* right and one that has been *checked*?" This is the most important worry on the list. A panel comes back to it in every other talk.
5. **One project that did not work.** It answers what none of the others can: "What does this person do when the result is not clean?"

With more than five projects to pick from, choose the combination that leaves the fewest worries open, not the most impressive projects one by one. A second optimization project adds little; an honestly checked estimation project closes a gap nothing else can.

Candidates leave the failure talk out all the time. But four polished successes tell a panel nothing about how you behave when things go wrong — and on a real program, things go wrong most days. A candidate who offers a failure story unasked comes across as more senior than one pulled into it in a behavioral round. The next lesson builds that story; here, one of your five slots is reserved for it.

::: key
Five talks, five competencies: guidance or optimization; estimation or filtering; simulation or software architecture; verification or Monte Carlo; one project that failed. Pick each remaining slot to close a gap the others leave open, not to add a second example of a gap you have already closed.
:::

## The shape of a ten-to-twenty-minute talk

A recipe says "chocolate cake for twelve" before it says "cream the butter". A talk works the same way. Every talk has the same four parts, and each part answers the question the listener has at that exact moment.

**1. Open with the problem and the requirement, not the method.** A **requirement** is the thing that had to be true for the work to count as a success. Your first sentence says what had to be true and why it was hard — before it names any tool. Compare two openings:

- "I needed to land a simulated booster within a few meters of a target, with a guidance law that runs in real time and never returns infeasible."
- "I implemented a second-order cone program for powered-descent guidance."

The first tells the listener what "good" means. The second hands over a method with no yardstick, and invites the wrong first question — "why that method?" — before the listener knows what it was for. (The words "infeasible" and "second-order cone program" come from **[[convex optimization|convex]]**; the note explains them.)

**2. State your contribution in one sentence, with a number in it.** Your **contribution** is what you personally achieved. Not "the guidance law performed well", but "the solver converges in under 200 ms across ten thousand dispersed initial conditions, with zero infeasible solves." "Dispersed" means each run started from a slightly different, randomly chosen condition. The number turns an adjective the panel must take on faith into a claim they can check. One test: if your contribution sentence has no unit in it, it is not finished.

**3. Show one plot that carries the argument, and know it cold.** One plot, not four: the single piece of evidence a doubtful reviewer would ask for first — a scatter of landing errors, a filter's claimed uncertainty against its true error, a solver's convergence curve. Be ready to name every axis, every unit and every visible outlier without looking. "What's that point over there?" is a common interruption. "I'm not sure, let me check" costs more credibility than almost any other stumble.

**4. Close with limitations and what you would do next.** This is not an apology. It shows that you know the edges of your own result — something a junior engineer who got lucky cannot fake. "This assumes a rigid vehicle; the next step is a flexible-body check against the first bending mode" tells the panel you know what you have *not* shown. That is exactly what the question "did you validate that, or only verify it?" (below) is trying to find out.

### A time budget

For a fifteen-minute talk, a rough budget is:

- two to three minutes on the requirement,
- three to four minutes on the approach and the plot,
- two minutes on results, with numbers,
- two minutes on limitations.

That adds to nine to eleven minutes. The other four to six will disappear into questions, because they always do. So plan a talk where every part stands on its own if the panel jumps straight to it.

::: example Outline: a powered-descent guidance talk
**Requirement (2 min).** "The vehicle must cancel its sideways speed and hit a soft-landing target, keeping thrust between a lower and an upper bound, using a guidance law that runs onboard and never returns infeasible — because an infeasible solve with no fallback is a lost vehicle."

**Approach (4 min).** The thrust lower bound makes the problem nonconvex. Explain how a slack variable relaxes it, and why the relaxation is **[[lossless|lossless]]**: the relaxed optimum always sits right on the original constraint. The result is a second-order cone program, solved with a fixed budget of iterations.

**Result (3 min).** "Across ten thousand dispersed initial conditions, the solver returned a feasible trajectory in under 250 ms in the worst case, with zero infeasible returns." Show one plot: where the landings fell, the target marked, the worst case circled.

**Limitations (2 min).** "This is a point-mass, rigid-vehicle model with a fixed final time. It does not yet handle a free final time or a flexible structure." A specific next step, not a vague one.

**Sanity check.** The parts add to $2 + 4 + 3 + 2 = 11$ minutes. In a fifteen-minute slot that leaves four minutes for the questions that will certainly arrive.
:::

::: example Outline: a failure talk
**Requirement (2 min).** "I needed a navigation filter that was accurate on average *and* consistent: its reported uncertainty had to match its actual error. A filter that is confidently wrong is more dangerous than one that is honestly unsure."

**What happened (4 min).** A single run looked fine. But a **[[consistency test|consistency]]** across a Monte Carlo set showed the filter was overconfident by roughly a factor of three. Its covariance — its own estimate of its error — said "accurate to a meter"; its actual error was routinely three meters. State the number, not the adjective.

**Diagnosis and fix (4 min).** How it was found: the consistency test, not staring at one trajectory. What it was: a sensor bias that drifts slowly, treated as if it were **[[white noise|bias-vs-noise]]**. The one plot is the consistency test before and after the fix.

**Limitations (2 min).** "This fix handled one bias source. I have not re-run the full dispersion set to confirm no smaller unmodeled source is left." A specific loose end, not "there's probably more to do."

**Sanity check.** $2 + 4 + 4 + 2 = 12$ minutes, inside a fifteen-minute slot with three minutes of room.
:::

## Rehearsing the defense, not the delivery

The exercise for this lesson asks you to write out the twenty hardest questions anyone could ask about each project, then answer every one out loud, on a timer. Do this literally.

The point is not a memorized answer; a panel can tell rehearsed from reasoned within one sentence. The point is that you have already done the thinking, so what comes out under pressure is a real analysis, not something invented on the spot.

Four kinds of question make up most of what you will be asked.

### "Why not X?"

Why not an **[[NLP|nlp]]** instead of a convex program? Why an EKF instead of a UKF? Why a reaction wheel instead of a CMG? (Pairs of rival tools; what matters is the shape of the answer.) The answer that works names the alternative honestly, names the measure you judged it on, and names what you gave up.

"An NLP can handle the nonconvex cost directly, but it has no convergence guarantee and no bound on solve time, and both matter more than optimality margin onboard." That is a **trade** — a choice where you can say what you gained and what it cost. "The convex approach is better" is a **preference**. A later lesson develops that difference, because it comes up in every kind of round.

### "How do you know?"

How do you know your filter is consistent? How do you know the solver converged and did not merely stop? How do you know the simulation is right? These test whether a result was *checked* or only *produced*. Have the actual check ready: the consistency test, an audit of the convergence flag across the whole Monte Carlo set, a comparison against an independent model.

### "What is your worst case, not your average?"

An aerospace panel cares more about the **tail** — the rare, bad end of the spread of results — than about the middle. Vehicles are not lost in the middle. A talk that states only a mean or an RMS (a kind of average error) should expect this question. Better: state the worst case in the talk itself, and the question never needs asking.

### "Did you validate that, or only verify it?"

Mixing these two up loses credibility fast with an experienced panel.

- **Verification** asks whether you built the thing *right*. Does the code correctly solve the equations you wrote down?
- **Validation** asks whether you built the *right thing*. Do those equations describe the real system well enough to trust the result outside the simulation?

A perfectly verified simulation of a wrong model is still wrong. A spelling checker can **[[verify|verify-validate]]** that every word in your essay is spelled right; it cannot tell you whether you answered the question the teacher asked.

Most self-taught projects can verify fully but rarely validate fully, because you seldom have hardware or flight data to test the model against. The honest answer beats pretending the difference does not apply to you: "Verified against an independent implementation and a closed-form case; not validated against hardware, which is the biggest gap here."

Success is a written answer to all twenty questions, for each talk. If you cannot answer one, there is a gap in the work itself, not in your rehearsal. Close that gap while there is time — do not prepare a way to talk around it.

::: warning
A talk that survives only if it runs start to finish without interruption is built wrong. A real panel will jump straight to your result or your limitations within the first two minutes and expect you to meet them there.
:::

::: warning
Rehearsing the *delivery* until the wording is smooth produces a talk that breaks the moment someone interrupts, because the smoothness was memorized, not understood. Rehearsing the *defense* — answering the hard questions out loud from different starting points — produces a talk that survives interruption, because interruption is what you practiced.
:::

## Handling the interruption itself

When a question arrives in the middle of your talk, answer it directly, first. Do not say "I'll get to that" unless the answer truly depends on something you are about to show. Even then, give the short version now. Putting off a direct question sounds evasive, and the order of your talk is not the point of the exercise.

You usually do not need to go back to your outline afterward. If "why not an NLP?" opens into a real discussion of convex relaxations, follow it: an unscripted technical conversation is exactly what the panel came for. If it trails off, close the remaining gap in a sentence rather than restarting the section.

::: key
Verification checks that the thing was built right, against its own specification. Validation checks that the right thing was built, against reality. A self-taught project can usually verify fully and validate only partially — say so, specifically, rather than letting the distinction pass unaddressed.
:::

## Check yourself

::: check
What are the four parts of the talk structure, in order, and what question does each one answer for the listener?
:::

::: answer
1. **Requirement** — what had to be true, and why it was hard. It answers "what would count as success here?"
2. **Contribution**, as one sentence with a number. It answers "did they achieve it, and how would I know?"
3. **The one plot.** It answers "show me, don't only tell me."
4. **Limitations and next steps.** They answer "does this person know the edges of their own result?"

Each part comes first because the listener cannot judge the next without it: you cannot judge a result with no yardstick, or trust one whose limits are hidden.
:::

::: check
Why does one of the five talks have to be about a project that did not work, rather than a fifth success?
:::

::: answer
Four polished successes show a panel that you can execute. They say nothing about how you behave when execution does not go cleanly — and on a real program, it rarely does.

A failure talk answers that directly, and offered unprompted it reads as more senior than the same story pulled out reluctantly later. It also lets you show recovery skills — finding why a result was wrong, admitting the error, changing course — which this module treats as the most valuable material in the whole interview. A fifth success cannot show any of that.
:::

::: check
You are two minutes into a talk about a Monte Carlo verification campaign, and your one-sentence contribution is "the simulation ran ten thousand cases and everything looked reasonable." What is wrong with that sentence, and how would you rewrite it?
:::

::: answer
It has no unit and no criterion. "Looked reasonable" is an adjective standing in for a number, and it invites the question you should have headed off: "reasonable by what measure?"

A working version states the measure, the sample and a pass mark set in advance: "Across ten thousand dispersed cases, landing **[[CEP|cep]]** was 4.2 m against a 10 m requirement, with a **[[99.87th-percentile|percentile]]** error of 11 m, and the pass criteria were fixed before the campaign ran."

It says what was measured, on how much data, and whether it was good enough — a number to question instead of a mood to accept.
:::

::: check
What is the difference between verification and validation, and why is a self-taught candidate especially likely to have done one but not the other?
:::

::: answer
Verification checks that the work was built correctly against its own specification: the code implements the equations you derived. Validation checks that the specification itself can be trusted, so that a result inside the simulation means something outside it.

A self-taught candidate almost always has the tools to verify — an independent implementation, a closed-form case, a conservation law. They rarely have hardware or flight data to validate against. Say exactly that: state what was verified, name what validation would need, and never present a verified result as if it were validated.
:::

::: check
Midway through your talk, the panel asks "why didn't you use gradient descent instead of that convex solver?" What does a strong answer do in the first ten seconds that a weak answer does not?
:::

::: answer
A strong answer does three things. It names the alternative on its own terms. It states the measure being judged — here, a guarantee of convergence and a bounded solve time, neither of which gradient descent gives by default. And it says what switching would cost: "Gradient descent carries no certificate of global optimality and no bound on iteration count, and both matter more here than raw simplicity."

A weak answer waves the alternative away with no reason, or gives up ground without thinking it through. One sounds like a trade that was made; the other like a preference never examined.
:::

::: check
Your plotted result shows one clear outlier — a single dispersed case with an error five times the rest. The panel points at it and asks what happened. What is the worst way to respond, and what should you have already done before the talk to avoid it?
:::

::: answer
The worst response is not knowing, followed by guessing: "I'm not sure, maybe a solver issue." It suggests the plot was made but never read — in front of a panel testing exactly whether you know your own data.

Before the talk, find every visible outlier in the plot you chose, and its specific cause: an initial condition at the edge of the envelope, a nearly singular geometry, a convergence flag that should have failed and did not. A later lesson covers the honest fallback for truly not knowing. For a plot you chose to show, not knowing is avoidable, and avoiding it is part of preparing the talk.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Five competencies | Guidance/optimization, estimation/filtering, simulation/architecture, verification/Monte Carlo, one failure |
| Talk structure | Requirement, then contribution (one sentence, one number), then one plot known cold, then limitations and next steps |
| Time budget (15 min) | About 2–3 requirement, 3–4 approach and plot, 2 results, 2 limitations; the rest goes to questions |
| Verification | Was the work built correctly against its own specification? |
| Validation | Is the specification itself trustworthy against reality? |
| Rehearse the defense | Write the twenty hardest questions per talk and answer each aloud, timed — the questions, not the delivery |
| On interruption | Answer what was asked, directly, first; often you should not go back to the planned order at all |

The next lesson takes the two questions almost every panel asks somewhere in this defense — "what would you do differently?" and "what was the hardest bug?" — and builds concrete, rehearsable answers to both, along with the wider behavioral round they belong to.

::: context panel Who sits on the panel
An onsite interview for a GNC role is usually a "loop": several back-to-back sessions in one day, each with one or two engineers. The project talk is often given to a larger group — a GNC lead, a couple of engineers from the team you would join, sometimes someone from flight software or test. Each of them listens for their own worry. The software person wants to know if your code could be maintained. The test person wants to know how you checked things. That is why a talk that answers only one kind of question leaves most of the room unconvinced. The last lesson of this module runs a full mock loop.
:::

::: context convex Bowls, egg cartons and "infeasible"
An **optimization problem** asks a computer to find the best choice that obeys some rules. A problem is **convex** when its landscape is shaped like a single bowl: roll downhill from anywhere and you reach the one true bottom. A nonconvex problem is like an egg carton, full of dips where a solver can get stuck.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M20,30 Q90,170 160,30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="90" cy="93" r="6" fill="#1d6fd1"/>
  <text x="90" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">convex: one bottom</text>
  <path d="M200,40 Q220,110 240,70 Q260,30 280,95 Q300,140 320,60 Q330,30 345,40" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="225" cy="78" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="294" cy="105" r="6" fill="#b4232c"/>
  <text x="272" y="136" font-size="12" text-anchor="middle" fill="#1f2a44">nonconvex: a solver can stall</text>
</svg>
```

A **second-order cone program** is one tidy family of convex problems, with fast, reliable solvers. **Infeasible** means no choice obeys all the rules — for a landing guidance law, "I have no answer", which is the one reply a descending rocket cannot accept.
:::

::: context lossless Why the thrust rule is nonconvex, and the trick that fixes it
A rocket engine cannot throttle below some minimum without going out, so thrust must lie between a lower and an upper bound. Draw every allowed thrust direction and size: you get a ring, a disk with a hole in it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="75" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="110" cy="75" r="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="65" cy="75" r="4" fill="#1f2a44"/>
  <circle cx="155" cy="75" r="4" fill="#1f2a44"/>
  <line x1="65" y1="75" x2="155" y2="75" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="5,3"/>
  <text x="110" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">min ≤ thrust ≤ max: a ring</text>
  <text x="265" y="55" font-size="12" text-anchor="middle" fill="#b4232c">the straight line between</text>
  <text x="265" y="72" font-size="12" text-anchor="middle" fill="#b4232c">two allowed thrusts passes</text>
  <text x="265" y="89" font-size="12" text-anchor="middle" fill="#b4232c">through the forbidden hole</text>
</svg>
```

A shape is convex only if the straight line between any two of its points stays inside it, so the ring is not convex. The fix adds an extra variable, a **slack**, that lets the hole fill in. The surprise, proved by Açıkmeşe and colleagues, is that the best answer to the relaxed problem always lands back on the ring anyway. Nothing is lost — hence "lossless convexification".
:::

::: context consistency Checking that a filter's confidence is honest
A navigation filter reports two things: its best guess of the state, and a **covariance**, its own claim about how wrong that guess might be. A consistency test compares the claim to the truth. In a simulation you know the true state, so for every run you can divide the actual error by the error the filter claimed, square it, and average over many runs. For an honest filter that average matches what theory predicts; the statistics behind it use the **chi-square** distribution. If the filter claims 1 m and is really off by 3 m, the squared ratio is about $3^2 = 9$ times too big — a glaring fail. One run cannot show this; only many runs can.
:::

::: context bias-vs-noise A drifting bias is not random noise
**White noise** is error that is fresh and independent every instant, like static on a radio: it averages away. A **bias** is an error that stays the same or drifts slowly, like a bathroom scale that always reads one kilogram heavy. Averaging does not remove it. A filter told "this sensor's error is white noise" will average a biased sensor many times and grow very confident — in a wrong answer. That is exactly how a filter becomes overconfident. The usual cure is to add the bias to the list of things the filter estimates, so it learns the bias instead of trusting it away.
:::

::: context nlp What "NLP" means here
In optimization, **NLP** stands for **nonlinear program**: an optimization problem with no special shape promised, such as convexity. NLP solvers can attack almost anything, which is their strength. Their weakness, for flight, is that they promise little. They may stop at a local dip instead of the best answer, and the number of steps they need can change wildly from one problem to the next. Flight software must finish on time, every time, so an engineer may happily give up some optimality to get a solver whose worst-case run time can be proven. That is the trade the "why not an NLP?" answer names.
:::

::: context verify-validate Right thing, built right
The software engineer Barry Boehm put the distinction in two short questions in 1979. Verification: "Am I building the product right?" Validation: "Am I building the right product?" NASA and the wider aerospace world use the same pair, usually shortened to **V&V**. Real programs validate models against wind-tunnel runs, engine tests and flight data. That is why a self-taught project, however careful, will nearly always be stronger on the first question than the second — and why saying so plainly reads as maturity rather than weakness.
:::

::: context cep The circle that holds half the landings
**CEP** stands for **circular error probable**. Draw a circle around the target exactly big enough to hold half of all the landing points. Its radius is the CEP. So "CEP of 4.2 m" means half the simulated landings were within 4.2 m of the target — and, importantly, half were not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="85" r="45" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="122" y1="85" x2="138" y2="85" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="77" x2="130" y2="93" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#1f2a44">
    <circle cx="112" cy="70" r="3"/><circle cx="145" cy="95" r="3"/><circle cx="125" cy="104" r="3"/>
    <circle cx="150" cy="68" r="3"/><circle cx="104" cy="96" r="3"/>
    <circle cx="186" cy="60" r="3"/><circle cx="80" cy="120" r="3"/><circle cx="170" cy="134" r="3"/>
    <circle cx="72" cy="52" r="3"/>
  </g>
  <circle cx="232" cy="30" r="3" fill="#b4232c"/>
  <circle cx="232" cy="30" r="9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="248" y="34" font-size="12" fill="#b4232c">worst case</text>
  <text x="250" y="100" font-size="12" fill="#1d6fd1">CEP circle:</text>
  <text x="250" y="116" font-size="12" fill="#1d6fd1">half of the points</text>
</svg>
```

Here 5 of the 10 points sit inside the circle. A CEP alone hides the far-off case, which is why you quote the worst case next to it.
:::

::: context percentile Why the odd number 99.87
A **percentile** says what fraction of results fall below a value: the 99.87th-percentile error is the error that 99.87% of cases beat. The strange number is not random. For a bell-shaped (Gaussian) spread, 99.87% of results lie below the average plus three **standard deviations** — the "3-sigma" level engineers use as a standard bar for rare events. In ten thousand cases, about 13 or 14 would land beyond it. Quoting it tells the panel you looked at the tail, not only the middle.
:::
