---
id: l02-choosing-the-five
title: "Choosing five topics you would be content to be handed"
minutes: 20
covers:
  - "choosing five topics so that every one is defensible and each shows a different competency"
  - "the trap of listing a project you cannot defend in depth"
---

Think about picking a team for a relay race where the coach, not you, decides which runner goes last — and the last leg decides the race. You would not fill the fifth spot with someone slow just to have five names. Every runner on your list has to be someone you would be happy to see on that final leg.

The submission list for the past-project presentation works the same way. It is the first **[[artifact|artifact-word]]** of this round — the first thing you make — and the only one you build before you know what you will present. It is also the one place where a mistake cannot be fixed on the day. If the panel picks a topic you cannot defend, no slide skill or calm manner rescues you. The round becomes thirty minutes of questions about decisions that were not yours, or that you can no longer remember making. The cost of a weak entry is paid at submission, weeks before anyone walks into the room.

So treat the list the way an engineer treats anything with a requirement: write the requirement down, then check the list against it. There are two rules, and a list that meets only one of them has a known defect.

The first rule is that every entry must be **defensible in depth**. The standard this module sets is that you could survive thirty minutes of questions on it. The second rule is that each entry should show a **[[competency|competency-word]]** — a distinct skill — that the others do not. The two rules pull against each other a little, and that is the point. The first rule alone would let you submit five versions of the project you know best. The second rule alone would tempt you to grab an unfamiliar project just to fill a slot.

## Rule one: defensible in depth, every one of them

::: key
Topic selection is strategically critical because you do not choose which one you present. Every one of the five must be defensible at depth, so a topic you cannot survive thirty minutes on is a liability sitting in the submission, not a spare option.
:::

"Defensible in depth" is not a feeling about a project. It is something you can test, and the test is cheap. For each possible topic, write down the single hardest question a GNC engineer could ask about it. Then answer that question out loud, in about thirty seconds, without notes. Not "I could look that up." Out loud, now.

The questions that do this job are not obscure. They are the same three every time: *what did you assume, how do you know it works, and what would you do differently.* If your honest answer to any of the three is a rewording of the project description, the entry has failed. And it has failed in your kitchen, where it costs nothing, instead of in front of eight engineers.

This module's first exercise asks for four things per topic: a one-line title, the competency it shows, the hardest question you expect, and an honest self-rating of how well you could defend it for thirty minutes. The rating is the part people fudge. A rating is only useful with a **[[threshold|keep-or-cut]]** attached — a line that turns it into a decision. Here is the line: if you would not be content to present an entry when it is picked at random, it does not go on the list at all. There is no seven-out-of-ten entry. There are entries, and there are cuts.

## Rule two: five different competencies, not five projects

A panel that picks one topic still reads all five. The list itself says something about the range of work you can do. Five entries that all show the same skill waste four of those chances.

The portfolio module's five anchor projects were designed to fill five different slots, and they map onto the submission list almost directly.

| Slot | Anchor project | The competency it shows |
| --- | --- | --- |
| Guidance and optimization | B — powered-descent guidance | Setting up a constrained optimal-control problem and verifying the solution, not trusting the solver |
| Estimation and filtering | C — quaternion EKF | Sequential estimation, and proving a reported covariance is honest |
| Simulation and architecture | A — 6-DOF launch vehicle simulation | Building the tool a vehicle-performance team actually runs on, with a real atmosphere model |
| Verification and Monte Carlo | D — batch orbit determination, or A's dispersion campaign | Observability and conditioning checks, and validating a covariance against the actual scatter |
| The one that did not work cleanly | Whichever project's write-up documents a first attempt that failed a check | How you behave when a result is not clean |

A few words in that table need a gloss. **Guidance** is the part of GNC that decides where the vehicle should go; **[[powered descent|powered-descent]]** is the rocket-braked landing at the end of a flight. A **[[Monte Carlo|monte-carlo]]** campaign runs a simulation hundreds or thousands of times with slightly different random inputs, to see the spread of outcomes; a **dispersion campaign** is exactly that, for a vehicle's flight.

A sixth option, if a slot is really empty, is **hardware-adjacent** work: a real **[[IMU|imu]]** tested on a bench, a thrust-vector-control testbed, a balancing robot. It shows something none of the five simulations can — that you have seen what a real sensor does when its noise is not the noise you assumed.

::: example An audit that removes an entry, and what replaces it
A candidate's draft list, with the hardest expected question written next to each entry:

| Entry | Hardest question | Can she answer it in 30 seconds? |
| --- | --- | --- |
| 6-DOF ascent simulation with dispersion campaign | Why a layered atmosphere rather than an exponential one? | Yes — the exponential fit is about $30\%$ high by $20\,\mathrm{km}$ and roughly a factor of two high by $30\,\mathrm{km}$, and dynamic pressure drives the loads |
| Powered-descent guidance, fixed final time | What happens when the target is not reachable in the time allotted? | Yes — $4.0\%$ of the 500 dispersed cases returned infeasible, and that is the number I report first |
| Quaternion EKF with NEES and NIS | How do you know the consistency test would catch a real fault? | Yes — the injected fault drove mean NEES to $404.9$ against a ceiling of $6.398$ |
| Batch orbit determination on real data | How did you handle an outlier? | Yes — residual editing after the first pass, and here is what it removed |
| Quadrotor attitude controller, team class project, two years ago | Why PID rather than anything else, and what did you personally decide? | No |

**Reading the "yes" answers.** Each one has a number in it, and each number is hers. $4.0\%$ of 500 cases is $0.04 \times 500 = 20$ cases where the guidance found no **[[feasible|infeasible]]** answer. The fault run's $404.9$ is about $63$ times the band's ceiling of $6.398$. An **outlier** is a data point far from the rest, and **residual editing** means throwing out points whose leftover error after a first fit is suspiciously large.

**The failing entry.** The fifth entry fails both halves of its question at once. The quadrotor's **PID** controller (said "P-I-D", a controller built from three simple terms) had its gain structure chosen by a teammate before she joined that sub-team. She cannot rebuild the reason, because there may never have been one. It comes off the list.

**The replacement.** What replaces it is not a new project. It is the **failure talk**, built from material she already has: her quaternion EKF's first process-noise tuning. She chose it by matching the steady-state covariance to a target by eye, and it failed the consistency check badly before a corrected tuning passed. Same code, same numbers, different question. Not "does this prove the filter is consistent?" but "what does this show about how I work when a result is not clean?"

**Check it makes sense.** The new entry shows a competency none of the other four does, and it costs an afternoon of writing instead of a month of building.
:::

## The trap, and the three shapes it takes

::: key
Never list a project you cannot defend in depth. The selection is not yours, so a weak entry is a live liability rather than a spare — and the weakest topic can be examined by five to ten engineers for an extended question period.
:::

**Padding** a list — adding an entry just to reach five — is rarely careless. It happens for reasons that feel responsible at the time, and it comes in three recognizable shapes.

**The borrowed one.** A team project where someone else made the interesting decisions, included because the list felt like it needed something with an industry setting. This is the most common shape and the most expensive. Each single honest answer — "that was decided before I joined" — is perfectly fine. Ten of them in a row are fatal, because you are being scored on defending engineering decisions under direct questioning. Decisions you did not make cannot be defended, only reported.

**The tutorial follow-along.** A project built by working through someone else's step-by-step guide. The code runs and the plots are correct, and there is no decision anywhere inside it that was yours. These die at the second follow-up, which asks why a setting was chosen. The honest answer is that the tutorial chose it.

**The one you have forgotten.** A really good project from three years ago whose reasons you can no longer rebuild. This one can be saved, and the others mostly cannot. Re-read your own write-up, re-run the code, and re-derive the two or three decisions you would be asked about. If you are not willing to spend that day, it does not belong on the list. From the outside, a half-remembered defense sounds exactly like a borrowed one.

::: warning
"If they pick that one, I will steer the talk toward the parts I know" is not a plan. It is a hope, and it does not survive the questioning. You control the fifteen minutes of talk. You do not control the questions afterwards, and the questions are where the round is decided. A panel that senses steering follows the steer back to its source.
:::

## If you really have only four

Submit four. The format asks for *roughly* five, and four topics you own completely make a stronger list than five including one you hope nobody picks. Having four strong entries is not the failure this round produces. The failure it actually produces is the weak fifth entry being chosen.

The reason is a small piece of **[[expected-value|expected-value]]** thinking — weighing each outcome by how likely it is. A fifth entry you cannot defend adds no option worth having. If a strong topic is chosen, the extra entry changes nothing. If the weak one is chosen, it loses the round outright. So on balance it can only hurt.

That said, a fifth slot is usually cheaper to fill than it looks, because it does not need new code. The failure talk above is one route. A second is to **split a project you already have along a real boundary**. The 6-DOF simulation and its dispersion campaign are one project on your portfolio site. But two different talks live inside it:

- the simulation's **verification** — an analytic case matched to a tolerance, a conserved quantity that stayed conserved, a convergence rate that behaved as the method predicts;
- the campaign's **statistics** — how the vehicle behaves across hundreds of randomized flights.

Those show two different competencies, and you can defend both in depth because you built both.

::: example Two entries that look different and are not
A candidate submits both "multiplicative quaternion EKF fusing IMU and star tracker" and "extended Kalman filter for a ground robot fusing wheel odometry and a range sensor." Two projects, two platforms, two write-ups.

**They are one competency.** Both are sequential nonlinear estimation with a linearized measurement update — a filter that handles curved, nonlinear physics by treating it as a straight line near its current guess. The panel's questions will be nearly identical: what is your state, how did you tune the process noise, how do you know the covariance is honest. Answering that set twice does not show twice as much.

**Now a pair that really differs.** Compare the quaternion EKF with the batch orbit-determination project, which a candidate might worry is "another estimation project." These two are different, and the candidate should be able to say why in one sentence:

- the filter is **sequential** — it updates with each new measurement — and its central claim is **consistency**: a covariance that matches its own error over time;
- the batch fit is a **single solve** over a fixed stretch of data, and its central claims are **observability** (can the data pin down the orbit at all?) and **conditioning** (how sensitive is the answer to small errors?). With four tracking stations, the **normal matrix** — the table of numbers the batch fit solves — had a **[[condition number|condition-number]]** of $4.3\times10^{5}$. With one station, it was $6\times10^{18}$, and that fit diverged.

**Check the size of that gap.** $6\times10^{18} \div 4.3\times10^{5} \approx 1.4\times10^{13}$ — about thirteen powers of ten worse. Different failure modes, different tests, different follow-up questions. If you cannot state the distinction that crisply, the panel will not see one either.
:::

## Check yourself

::: check
State the test that decides whether a topic belongs on the list, and explain why a self-rating without a threshold is not useful.
:::

::: answer
For each topic, write the hardest question a GNC engineer could ask, then answer it aloud in about thirty seconds, without notes. The questions are: what did you assume, how do you know it works, and what would you do differently.

A self-rating without a threshold invites a middling score that settles nothing. A topic rated seven out of ten still sits on the list and can still be chosen. The threshold that makes the rating useful is this: you would be content to present any entry if it were picked at random. That turns the rating into a yes-or-no decision. The entry stays, or it is cut.
:::

::: check
Why is a team project where others made the key decisions called more expensive here than a project that is merely unfinished or unimpressive?
:::

::: answer
Because it fails on exactly the axis the round weighs most directly: defending engineering decisions under direct questioning. Each single honest answer — that a decision came before your involvement — is reasonable. A string of them is not, because together they show there is nothing inside the project for you to defend.

An unfinished or modest project can still contain decisions that were entirely yours, with stated reasons and evidence, which is what the axis measures. A borrowed project cannot, however impressive its result.
:::

::: check
A candidate has four strong anchor projects and wants a fifth entry without spending a month building one. Give the two routes this lesson describes, and say what makes each legitimate rather than padding.
:::

::: answer
First, the failure talk. Take a project whose write-up already records a first attempt that failed a check — such as an EKF tuning whose mean NEES landed far outside its acceptance band before a corrected tuning passed — and present that story as its own topic. It is legitimate because the work is hers, the numbers already exist, and it shows a competency the other four do not.

Second, split an existing project along a real boundary — for instance, presenting the verification of a 6-DOF simulation separately from its dispersion campaign. Evidence that the simulation is correct, and statistics of how the vehicle behaves under uncertainty, are different arguments with different questions behind them.

Neither is padding, because padding means an entry whose decisions were not hers, and she can defend either half in depth.
:::

::: check
Explain why the quaternion EKF and the batch orbit-determination project count as different competencies, while a quaternion EKF and a ground-robot EKF do not.
:::

::: answer
The two EKFs share a structure, so they share their questions: how the state is defined, how the process noise was tuned, whether the covariance is consistent. Answering the same set on two platforms shows no more than answering it once.

The filter and the batch fit differ in their central claim and in how that claim fails. The filter claims consistency over time, tested by NEES and NIS against chi-square bands. The batch fit claims observability and good conditioning over a fixed arc, tested by the normal matrix's condition number and by comparing its formal covariance with the actual scatter across repeated fits. Different tests, different failure modes, different follow-up questions.
:::

::: check
Why does this lesson argue that a list of four owned topics is stronger than five that include one borrowed entry, given that the panel only picks one?
:::

::: answer
Because the panel picks one and you cannot predict which. A fifth entry you cannot defend does not add an option. It adds a chance of being asked to defend the indefensible in front of five to ten engineers for a long question period.

On balance the extra entry can only hurt. It cannot improve the round when a strong topic is chosen, and it loses the round outright when it is chosen itself. A shorter list removes that outcome entirely.
:::

## Summary

| Rule or trap | Statement |
| --- | --- |
| Rule one | Every entry defensible in depth — the standard is surviving thirty minutes of questions on it |
| Rule two | Each entry shows a competency the others do not |
| The test | Write the hardest question, answer it aloud in thirty seconds, without notes |
| The threshold | You would be content if any entry were picked at random; otherwise it is cut, not rated |
| Trap one | The borrowed team project whose decisions were somebody else's |
| Trap two | The tutorial follow-along with no decision of yours inside it |
| Trap three | The good project from three years ago whose reasons you can no longer rebuild — saved only by re-reading and re-running it |
| If you have four | Submit four; or build a fifth from an existing project's recorded failure, or by splitting one along a real boundary |

The next lesson runs one more check over this list before it is submitted: whether every entry is yours to present to a room of outside engineers.

::: context artifact-word "Artifact": a thing somebody made
In everyday speech an artifact is an old object dug up by archaeologists. The word comes from Latin for "made with skill". Engineers use it for any made thing that exists on its own: a document, a slide deck, a piece of code, a test report. Calling your topic list an artifact is a reminder to treat it like one — something with a purpose that can be checked against a requirement, not a quick form to fill in.
:::

::: context competency-word Competency versus project
A **project** is a thing you did. A **competency** is a skill it proves you have. Two very different projects can prove the same skill — a robot filter and a spacecraft filter both prove you can build a filter. The panel is trying to learn how many different skills you have, so what matters on the list is the number of different competencies, not the number of different projects.
:::

::: context keep-or-cut A rating that ends in a decision
A score from one to ten feels careful, but it leaves the hard choice unmade. Adding a threshold turns it into a gate: every topic comes out either kept or cut.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="50" width="110" height="46" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">candidate</text>
  <text x="65" y="86" font-size="12" fill="#1f2a44" text-anchor="middle">topic</text>
  <line x1="120" y1="73" x2="150" y2="73" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,43 210,73 180,103 150,73" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="77" font-size="12" fill="#1f2a44" text-anchor="middle">ok if</text>
  <text x="180" y="122" font-size="11" fill="#6c7a93" text-anchor="middle">picked at random?</text>
  <line x1="210" y1="73" x2="250" y2="35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="210" y1="73" x2="250" y2="111" stroke="#b4232c" stroke-width="2"/>
  <rect x="250" y="16" width="96" height="38" rx="8" fill="#1d6fd1"/>
  <text x="298" y="40" font-size="12" fill="#fff" text-anchor="middle">yes: keep</text>
  <rect x="250" y="92" width="96" height="38" rx="8" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="298" y="116" font-size="12" fill="#b4232c" text-anchor="middle">no: cut</text>
</svg>
```

There is no third exit marked "probably fine".
:::

::: context powered-descent Landing on a rocket
**Powered descent** is the last part of a landing, where the engine fires to slow the vehicle down instead of relying on parachutes or wings. Falcon 9 boosters land this way, and so did the Apollo lunar modules. The guidance software has to work out, in a fraction of a second, a thrust plan that ends at the pad, at almost zero speed, without using more fuel than is left. Anchor project B in the portfolio module builds a version of this.
:::

::: context monte-carlo Why it is named after a casino
**Monte Carlo** methods use lots of random trials to learn how something behaves. The name comes from the famous casino in Monaco, because the method runs on chance like a roulette wheel. The idea took off in the 1940s among scientists working on the first computers. For a rocket, each trial nudges the wind, the engine thrust and the sensor errors a little, then flies the whole mission. After hundreds of runs you can say, for example, "95% of landings were within this distance."
:::

::: context imu The box that feels motion
An **IMU** (said "I-M-U") is an inertial measurement unit: a small box of sensors that measure how the vehicle speeds up (accelerometers) and how it turns (gyroscopes). Your phone has a tiny one; that is how it knows to rotate the screen. Real IMUs have quirks — slow drift, noise that changes with temperature — that no textbook model captures perfectly. Measuring one on a bench teaches you those quirks first-hand, which is why hardware work fills a slot no simulation can.
:::

::: context infeasible When no answer exists
A problem is **feasible** if at least one answer obeys all its rules. For a landing, the rules include "engine thrust between its minimum and maximum" and "touch down at the target at the chosen time." If the vehicle starts too far away or too fast, no thrust plan can meet every rule, and the solver reports the problem **infeasible**. Reporting how often that happened — 20 of 500 cases here — shows you checked for it rather than hiding it.
:::

::: context expected-value Weighing outcomes by their chances
**Expected value** means judging a choice by all its possible outcomes, each weighted by how likely it is. The grid compares a list of four strong topics with the same list plus one weak entry. Adding the weak entry never improves a box, and it creates the one box where the round is lost.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="165" y="20">panel picks a strong topic</text>
    <text x="290" y="20">panel picks the weak one</text>
    <text x="50" y="72">list of four</text>
    <text x="50" y="132">list of five</text>
  </g>
  <rect x="105" y="35" width="120" height="60" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="230" y="35" width="120" height="60" fill="#fff" stroke="#1f2a44"/>
  <rect x="105" y="100" width="120" height="60" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="230" y="100" width="120" height="60" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="12" text-anchor="middle">
    <text x="165" y="70" fill="#1f2a44">strong round</text>
    <text x="290" y="64" fill="#6c7a93">cannot happen:</text>
    <text x="290" y="80" fill="#6c7a93">not on the list</text>
    <text x="165" y="135" fill="#1f2a44">same strong round</text>
    <text x="290" y="135" fill="#b4232c">round lost</text>
  </g>
</svg>
```
:::

::: context condition-number How wobbly is the answer?
A **condition number** says how much small errors in the data can be magnified in the answer. A condition number of $10$ means small errors can grow up to about tenfold; $10^{18}$ means the answer is essentially noise. On a scale of powers of ten, the two orbit fits sit very far apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="96" height="24" fill="#1d6fd1"/>
  <text x="124" y="37" font-size="12" fill="#1f2a44">four stations: 4.3 × 10⁵</text>
  <rect x="20" y="56" width="320" height="24" fill="#b4232c"/>
  <text x="330" y="73" font-size="12" fill="#fff" text-anchor="end">one station: 6 × 10¹⁸, diverged</text>
  <line x1="20" y1="90" x2="340" y2="90" stroke="#1f2a44"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="108">10⁰</text><text x="105" y="108">10⁵</text><text x="190" y="108">10¹⁰</text><text x="275" y="108">10¹⁵</text>
  </g>
</svg>
```

Each bar's length is the power of ten: about $5.6$ against about $18.8$.
:::
