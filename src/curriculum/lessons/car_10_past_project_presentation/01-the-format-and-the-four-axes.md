---
id: l01-the-format-and-the-four-axes
title: "The format, and what the panel is actually scoring"
minutes: 20
covers:
  - "the format: submit roughly five topics, they choose one, 10 to 20 minutes to a panel of 5 to 10 engineers, then extensive Q and A"
  - "the four evaluation axes: technical depth, communication clarity, simplicity of design approach, and defending engineering decisions under direct questioning"
---

Imagine a teacher who says: "Bring me five book reports. I will pick one. You will talk about it for fifteen minutes, and then the whole class gets to ask you questions." You would prepare very differently than if you could choose the report yourself. You could not hide a weak one at the bottom of the pile, because it might be the one she picks. And you would know the questions matter more than the talk, because the talk is the part you control.

That is the **past-project presentation**, one of the rounds of a SpaceX engineering interview, almost exactly. You submit roughly five project topics. SpaceX selects one of them. You present that one for ten to twenty minutes to a **[[panel|what-a-panel-is]]** — a group of interviewers who all watch and all score — of five to ten engineers. Then the panel asks questions, for a long time, and mostly about the parts of the project that never made it onto a slide. Almost every decision in this module follows from one clause of that: the panel chooses the topic, and you do not.

The second thing to know is what the round is really for. It is not what the word "presentation" suggests. This round usually fails in one recognizable way, and the cause is rarely nerves or ugly slides. It fails when a candidate **describes** what they built instead of **defending** why it is right. Describing is the easy half. You lived it, and twenty minutes of it comes out without effort. Defending is the half that separates someone who did the work from someone who followed a tutorial, and it is the half the questioning exists to find.

That is also why the questions are not hostile, even when they sound like it. They are **[[diagnostic|diagnostic-questions]]** — they are tests, the way a doctor's questions are tests. Three of them come up, in some wording, on every project a **GNC** panel hears (GNC, said "G-N-C", stands for guidance, navigation and control — the engineering that steers a vehicle). The three are: *what did you assume, how do you know it works, and what would you do differently.* Someone who really did the work answers each in a sentence, because each answer is a decision they already had to make. Someone who did not has to invent an answer in front of eight engineers who have made that same decision themselves, on real hardware, with real consequences.

## The mechanics, and what each one costs you

::: key
The format: you submit roughly five project topics, SpaceX selects one, and you present for 10 to 20 minutes to a panel of 5 to 10 engineers, followed by extensive question and answer.
:::

Take the rule one piece at a time. Each piece changes how you should prepare, and each is easy to miss.

**Roughly five topics, and they select.** A list is only as strong as its weakest entry, not its strongest, because the weakest can be the one chosen. So plan as though each of the five is equally likely to be picked. That is not a claim about how panels really decide. A panel has reasons — often curiosity about the entry it cannot already read about on your portfolio site. But you cannot see the reason from outside, so "any of the five" is the only safe assumption. The next lesson is entirely about building a list that survives it.

**Ten to twenty minutes.** This is short. It is shorter than one single engineering decision inside any of the five **[[anchor projects|anchor-projects]]** from the portfolio module deserves. The urge to cover everything is the most reliable way to lose the room, and it is the wrong urge anyway. What you leave out is not lost. It is what the questioning is for, and a question you answer well is worth more than a slide you showed.

**A panel of five to ten engineers.** Not all of them work on your project's subject. In a room of eight, the estimation specialist will follow your filter math without help. The propulsion or structures engineer two seats over will not — and their score counts the same. This is where the communication axis, below, is won and lost.

**Then extensive question and answer.** Some things this course cannot tell you: how long "extensive" runs, whether a written **[[rubric|rubric]]** sits behind the round, and exactly who will be in the room. Those vary, and the **[[coordinator|coordinator]]** who schedules your interview day is the person to ask. What does not vary is the direction of the questions: inward, toward your decisions, away from the description.

## Describing versus defending, on the same question

The clearest way to see the difference is to watch one question hit two candidates who built the same project.

The project is anchor C from the portfolio module: a **[[filter|what-a-filter-does]]** — software that estimates which way a spacecraft is pointing from noisy sensors. This one is a quaternion EKF (said "E-K-F", an extended Kalman filter; a **quaternion** is a set of four numbers that describes an orientation). A good filter reports two things: its best guess, and how unsure it is. That "how unsure" number is its **covariance**. Two standard tests check whether the covariance is honest: **NEES** (said "nees", normalized estimation error squared) and **NIS** (said "niss", normalized innovation squared). Each averages a score over many runs and asks whether the average lands inside an **[[acceptance band|chi-square-band]]** — the range an honest filter would land in 95 times out of 100.

::: example "How do you know the filter works?" — anchor project C
**Weak.** "The attitude error stays under a tenth of a degree through the whole run, and the estimate tracks truth smoothly. I plotted error against time for a few cases and it looks clean."

**Strong.** "It is consistent, not only accurate. Over 300 independent runs the mean NEES was $6.067$ against a $95\%$ acceptance band of $[5.614,\,6.398]$ for a six-state filter, and mean NIS was $2.984$ against $[2.729,\,3.283]$ for a three-axis measurement. I also know the test has teeth. I cut the filter's assumed process noise by a factor of one hundred and reran the same campaign: mean NEES went to $404.9$, about $63$ times the band's ceiling, and the filter was outside the band at every step."

**Check the numbers.** Both means sit inside their bands: $5.614 < 6.067 < 6.398$ and $2.729 < 2.984 < 3.283$. For the broken run, $404.9 \div 6.398 \approx 63.3$, so "about 63 times" is right.

**What separates them.** The weak answer reports how close the guess was to the truth. The strong one reports whether the filter's own claimed uncertainty is honest — and that is the property everything downstream of the filter depends on.

Worse, the weak answer's evidence points the wrong way. An **[[overconfident|overconfident-filter]]** filter — one whose covariance has shrunk below its true error — makes the *smoothest* plot of all. A tiny covariance means the filter trusts its own prediction and barely reacts to new measurements, so its estimate barely wiggles. To a panel that knows this, "it looks clean" is mild evidence *against* the claim.

And the second half of the strong answer — the run broken on purpose — is the part that is hard to fake. It requires having built a test that is able to fail.
:::

Notice what the strong answer is *not* doing. It is not longer. It does not use more technical vocabulary. It does not walk through where the band comes from. It is about the same length, and it holds four numbers, each of which the candidate can be asked to justify. That is what the whole round feels like.

::: warning
Preparing the talk and not the questioning is the default failure of this round, and it feels like thorough preparation while you are doing it. The talk is the shorter, more visible piece, and it is easy to rehearse. The questioning is longer, unscripted, and carries the two axes — depth and defense — that the talk itself barely touches. If most of your preparation hours are going into slides, they are going into the half of the round that was never the hard part.
:::

## The four axes, and what each is measured by

An **evaluation axis** is one separate thing the panel scores you on, the way a gymnastics judge scores difficulty and execution separately.

::: key
The four evaluation axes: technical depth; communication clarity; simplicity of the design approach; and whether you can defend your engineering decisions under direct questioning.
:::

These are not four names for "did well". Each is measured by something different, and each catches a failure the other three miss.

### Technical depth

Depth is measured past the edge of your description, not inside it. The panel already assumes you can explain the slide you wrote. Depth is the third follow-up question. Not "what is NEES?" but "why does NIS pass when NEES fails?"

That one has a real answer. NIS is built from the **innovation** — the surprise, the gap between what the sensor measured and what the filter predicted it would measure. So NIS only sees the part of the state the measurement actually observes. NEES compares the *whole* state error against the *whole* covariance. So it also catches a badly wrong covariance on a part the sensor barely sees, such as the gyro's slow drift, called **gyro bias**. A candidate who has only read about these tests stops one question earlier.

### Communication clarity

Clarity is measured by the least specialized person in the room, not the most. The practical test: after your talk, could someone outside your subfield restate your problem and your result? If your first slide needs a definition of a technique such as lossless convexification before it means anything, you have spent your clearest thirty seconds on vocabulary.

### Simplicity of the design approach

This is the axis candidates least expect, and it runs opposite to the urge to look ambitious. Complexity that was not needed is a cost — to build, to test, to review, and to fly. Choosing the simpler approach, and saying exactly why, shows more judgment than building the elaborate one.

### Defending engineering decisions under direct questioning

Defense is measured by whether a decision had a **criterion** — a stated reason that could have come out the other way.

Take anchor D, which fits an orbit to a stretch of tracking data. "I used a batch least-squares fit" — one calculation over all the data at once — is a *choice*. Here is a *decision*: "I used a batch fit because the arc of data was fixed and processed after the fact. So I did not have to invent a process-noise model. That let the covariance come only from the measurement noise and the geometry — and that is what made it checkable against the actual scatter of the results." The difference is the reason, and the fact that the reason could have pointed the other way.

::: example The simplicity axis, on anchor project E
Anchor E is about keeping a satellite's **[[reaction wheels|wheels-and-torquers]]** from filling up with spin. Reaction wheels are spinning wheels inside the satellite that turn it by speeding up or slowing down. Over time they soak up **momentum** — stored spin, written $\mathbf h$ — from small outside pushes, and it has to be dumped. **Magnetorquers** do the dumping: electric coils that push against Earth's magnetic field, $\mathbf B$. Two candidates are asked how they unload the wheels.

**The elaborate answer.** "I implemented a nonlinear model-predictive controller over a ten-step horizon that optimizes the magnetorquer commands against the predicted field profile, with a terminal cost on stored momentum."

**The simple answer.** "A cross-product law. Command the magnetic dipole $\mathbf m = -\frac{k}{|\mathbf B|^2}\,\mathbf B\times\mathbf h$, where $\mathbf h$ is the stored wheel momentum and $k$ is one gain. The delivered torque is then

$$\mathbf M = \mathbf m\times\mathbf B = -\frac{k}{|\mathbf B|^2}\big[(\mathbf B\times\mathbf h)\times\mathbf B\big] = -\frac{k}{|\mathbf B|^2}\big[\mathbf h|\mathbf B|^2 - \mathbf B(\mathbf B\cdot\mathbf h)\big] = -k\,\mathbf h_\perp$$

so it removes exactly the part of the stored momentum that is **[[perpendicular to the field|perpendicular-part]]**, with one gain and no horizon. It cannot touch the part along $\mathbf B$ at all. The removable fraction is $\sin\theta$, for an angle $\theta$ between $\mathbf h$ and $\mathbf B$. That is why this works only because the field direction rotates under the vehicle over an orbit. I sized against that: torquer capability over one orbit is $2.83\times10^{-2}\,\mathrm{N\,m\,s}$ against a worst-case gravity-gradient buildup of $2.40\times10^{-3}\,\mathrm{N\,m\,s}$, a **[[margin|margin-picture]]** of about $11.8$."

**Reading the algebra.** $\mathbf M$ is the twist (torque) the coils make, read "M". The first step plugs in $\mathbf m$. The second uses a standard cross-product identity, $(\mathbf a\times\mathbf b)\times\mathbf c = \mathbf b(\mathbf a\cdot\mathbf c) - \mathbf a(\mathbf b\cdot\mathbf c)$, with $\mathbf a = \mathbf c = \mathbf B$. The last step notices that $\mathbf h - \mathbf B(\mathbf B\cdot\mathbf h)/|\mathbf B|^2$ is $\mathbf h$ with its along-the-field part removed — which is $\mathbf h_\perp$, read "h perp".

**Check the margin.** $2.83\times10^{-2} \div 2.40\times10^{-3} = 28.3 \div 2.40 \approx 11.8$. The torquers can dump nearly twelve times what the disturbance piles up in an orbit. Comfortably more than one, as a margin should be.

**What separates them.** The second answer is three lines of algebra with an exact result, one tuning number, a stated limitation, and a margin computed against the disturbance it exists to handle. The first may well be a working controller. But nothing in it says the extra machinery bought anything. The panel's next question will be exactly that: what does the horizon buy you over the cross-product law, in numbers? A candidate who chose the elaborate approach and can answer that is fine. A candidate who chose it because it looked more impressive is now defending a cost they never justified.
:::

## Check yourself

::: check
Why does the panel selecting your topic, rather than you selecting it, change how you should judge a list of five possible topics?
:::

::: answer
Because the list's real strength becomes its weakest member, not its strongest. If you chose, you would present your best topic and the other four would not matter. Because the panel chooses, a topic you cannot defend in depth is not a spare kept in reserve. It is a live liability that can be selected and then examined by five to ten engineers.

The right planning assumption is that each of the five is equally likely to be picked. Not because panels necessarily choose at random, but because their reason is invisible from outside, and any list built around predicting it is a guess.
:::

::: check
A candidate answers "how do you know your filter works" by describing a smooth error plot and a small RMS attitude error. Name the specific reason this evidence is weak, and what should replace it.
:::

::: answer
RMS error (root-mean-square, the typical size of the error) measures only how far the estimate sat from the truth. It says nothing about whether the covariance the filter reports matches that error — and that is the claim everything downstream relies on.

Worse, smoothness points the wrong way. An overconfident filter with a collapsed covariance barely reacts to measurements, so its estimate looks unusually smooth. "The plot looks clean" is weak evidence at best and mildly incriminating at worst.

The replacement is a consistency result with numbers: mean NEES and NIS against their chi-square acceptance bands over a stated number of independent runs. Add evidence that the test can fail — a fault injected on purpose, and how far outside the band it landed.
:::

::: check
Explain what the simplicity axis is really measuring, and why an elaborate approach is not automatically a bad sign.
:::

::: answer
It measures whether the complexity you built was *required* by the problem, because unneeded complexity is a real, recurring cost to build, test, review and fly.

It is not a preference for simple work. An elaborate approach is defensible whenever the candidate can say what the extra machinery buys, in numbers, compared with the simpler option it replaced. What fails the axis is complexity chosen for its own sake. That shows up at once when the panel asks what the simpler option would have cost, and the candidate has never worked it out.
:::

::: check
In a room of eight engineers, several will not work in your project's subfield. What does this mean for the first minute of your talk?
:::

::: answer
The first minute has to make the problem and the result understandable to the least specialized person present, because their score counts the same as the specialist's.

So state the requirement as a physical outcome — a landing accuracy, a pointing error, a margin — rather than in the vocabulary of a technique, and hold back specialized words until the problem is established. A first slide that needs a definition before it means anything has spent the clearest thirty seconds of the talk on terminology instead of the claim.
:::

::: check
Explain how a filter can pass a NIS check while failing a NEES check. Why does this matter for the technical-depth axis in particular?
:::

::: answer
NIS is computed from the innovation and its covariance, $\mathbf S_k = \mathbf H\mathbf P_k^-\mathbf H^{\mathsf T}+\mathbf R$. Here $\mathbf P_k^-$ is the filter's covariance before the measurement, $\mathbf H$ maps the state to what the sensor sees, and $\mathbf R$ is the sensor noise. Because of that $\mathbf H$, NIS only exercises the directions of the state the measurement actually observes.

NEES compares the full state error with the full covariance. So it also sees parts the measurement is only weakly sensitive to — a gyro bias state, observed only indirectly through the dynamics, for instance. It can catch a badly wrong covariance there that leaves the innovation almost undisturbed.

This matters for depth because it is exactly the kind of question that sits one step past a rehearsed description. A candidate who has used both tests knows why they can disagree. One who has only read about them stops at "both should be inside their bands."
:::

## Summary

| Element | Statement |
| --- | --- |
| Format | Roughly five topics submitted, SpaceX picks one, 10 to 20 minutes to 5 to 10 engineers, then extensive Q and A |
| Planning assumption | Every one of the five is equally likely to be chosen |
| The typical failure | Describing what you built instead of defending why it is right |
| Axis 1 — technical depth | Measured past the edge of your description, at the third follow-up |
| Axis 2 — communication clarity | Measured by the least specialized person in the room |
| Axis 3 — simplicity | Measured by whether the complexity you built was required, and whether you costed the simpler option |
| Axis 4 — defending decisions | Measured by whether a decision had a stated criterion that could have come out the other way |
| Not knowable in advance | How long the questioning runs, whether a rubric exists, who is in the room — ask the coordinator |

The next lesson builds the submission list itself: five topics, each defensible in depth, each showing a competency the other four do not.

::: context what-a-panel-is Why a whole room, not one interviewer
In most interview rounds you meet one or two people. A **panel** is a group who watch the same performance at the same time, like judges at a talent show. Each forms a view, and afterwards the views are pooled in a discussion often called a **debrief**. That makes this round unusual: in one hour, five to ten engineers see you, and all of them feed the decision. It is one reason this module calls the round the highest-leverage part of the process — and one reason a single weak moment is seen by everyone at once.
:::

::: context diagnostic-questions Questions as tests, not attacks
A doctor who asks "does it hurt when I press here?" is not being mean. The question is a test, and your answer tells her something she could not see. Panel questions work the same way. "What did you assume?" checks whether you know the edges of your own work. "How do you know it works?" checks whether you verified it or hoped. "What would you do differently?" checks whether you learned from it. Hearing them as tests, not attacks, makes them much easier to answer calmly.
:::

::: context anchor-projects The five anchor projects, briefly
The portfolio module built five deep projects, lettered A to E, and this module refers back to them by letter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="10" y="8" width="340" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="22" y="27" font-weight="700">A</text><text x="42" y="27">6-DOF launch vehicle simulation</text>
    <rect x="10" y="42" width="340" height="28" rx="6" fill="#fff" stroke="#1f2a44"/>
    <text x="22" y="61" font-weight="700">B</text><text x="42" y="61">powered-descent guidance</text>
    <rect x="10" y="76" width="340" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="22" y="95" font-weight="700">C</text><text x="42" y="95">quaternion EKF with NEES and NIS</text>
    <rect x="10" y="110" width="340" height="28" rx="6" fill="#fff" stroke="#1f2a44"/>
    <text x="22" y="129" font-weight="700">D</text><text x="42" y="129">batch orbit determination</text>
    <rect x="10" y="144" width="340" height="28" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
    <text x="22" y="163" font-weight="700">E</text><text x="42" y="163">ADCS momentum management</text>
  </g>
</svg>
```

Each one is a strong candidate for the submission list, and the next lesson maps them onto it.
:::

::: context rubric What a rubric is
A **rubric** is a written scoring guide: a list of what is being judged and what counts as weak, fair or strong on each. Teachers use them to grade essays. Some companies give interviewers one; others rely on the interviewers' judgment and a group discussion afterwards. This course does not know which applies to this round, and it may change. The four axes in this lesson come from reported accounts of the round, so treat them as what you are being scored on either way.
:::

::: context coordinator Who to ask about the day
The **recruiting coordinator** is the person who books your interview day: the times, the rooms or video links, who you will meet. They are not the ones judging you, and they expect logistics questions. "How long is the question period after the presentation?" and "Will there be a projector, or should I share my screen?" are normal things to ask. Asking shows planning, not nerves.
:::

::: context what-a-filter-does What a filter does
Every sensor is a little wrong. A gyro drifts; a star camera jitters. A **filter** is software that combines them into one best guess, again and again, many times a second. It predicts where things should be, compares that with each new measurement, and nudges its guess. The **Kalman filter** is named after Rudolf Kálmán, who published it in 1960; the Apollo guidance computer used a version of it. The "extended" version handles problems that are not straight-line simple, like a spinning spacecraft.
:::

::: context chi-square-band Why an honest filter lands in a band
If a filter's covariance is honest, each NEES score behaves like a known kind of random number called a **chi-square** variable (chi is the Greek letter χ, said "kai"). Averaged over 300 runs of a six-state filter, the mean should land between $5.614$ and $6.398$ ninety-five times in a hundred. The line below shows the band, and where the two runs from the example landed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="77" y="46" width="209" height="24" fill="#8fb8f0"/>
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="47" y1="70" x2="47" y2="78"/><line x1="180" y1="70" x2="180" y2="78"/><line x1="313" y1="70" x2="313" y2="78"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="47" y="93">5.5</text><text x="180" y="93">6.0</text><text x="313" y="93">6.5</text>
    <text x="77" y="40">5.614</text><text x="286" y="40">6.398</text>
  </g>
  <circle cx="198" cy="58" r="6" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="198" y="116" font-size="12" fill="#1d6fd1" text-anchor="middle">honest run: 6.067</text>
  <line x1="198" y1="64" x2="198" y2="102" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="3 3"/>
  <polygon points="350,20 336,14 336,26" fill="#b4232c"/>
  <text x="330" y="24" font-size="12" fill="#b4232c" text-anchor="end">broken run: 404.9, far off</text>
</svg>
```
:::

::: context overconfident-filter The friend who is always sure
Picture a friend who is certain of every answer and never changes their mind when you show them new facts. Their story stays perfectly steady — and is often wrong. An **overconfident filter** is that friend. Its covariance says "I am very sure", so it gives each new measurement almost no weight. Its estimate looks calm and smooth, even while it drifts away from the truth. That is why a smooth plot alone proves nothing; you need a test like NEES that compares the claimed sureness with the actual error.
:::

::: context wheels-and-torquers Wheels that fill up, coils that empty them
A **reaction wheel** turns a satellite the way you turn on a spinning office chair by swinging your arms: spin the wheel one way, the satellite turns the other. Small outside pushes — from gravity pulling unevenly on the satellite, for example — keep adding spin, and a wheel has a top speed. So the stored momentum has to be dumped. A **magnetorquer** is a coil of wire; run current through it and it becomes a weak magnet that pushes against Earth's magnetic field, twisting the satellite so the wheels can slow down.
:::

::: context perpendicular-part The part the coils can reach
Split the stored spin $\mathbf h$ into two pieces: one lying along the magnetic field $\mathbf B$, and one at right angles to it, $\mathbf h_\perp$. A magnetic twist is always at right angles to $\mathbf B$, so the coils can shrink only $\mathbf h_\perp$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="340,150 328,144 328,156" fill="#6c7a93"/>
  <text x="336" y="170" font-size="12" fill="#6c7a93" text-anchor="end">field B</text>
  <line x1="40" y1="150" x2="174" y2="37" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="178,34 165,38 172,46" fill="#1f2a44"/>
  <text x="96" y="80" font-size="13" fill="#1f2a44" text-anchor="end">stored spin h</text>
  <line x1="178" y1="150" x2="178" y2="44" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="186" y="100" font-size="12" fill="#b4232c">h⊥: coils can remove</text>
  <line x1="40" y1="150" x2="178" y2="150" stroke="#1d6fd1" stroke-width="4"/>
  <text x="109" y="170" font-size="12" fill="#1d6fd1" text-anchor="middle">along B: out of reach</text>
  <path d="M80,150 A40,40 0 0 0 71,124" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="86" y="138" font-size="12" fill="#1f2a44">θ</text>
</svg>
```

As the satellite orbits, $\mathbf B$ swings to new directions, so a piece that is out of reach now becomes reachable later.
:::

::: context margin-picture What a margin of 11.8 looks like
A **margin** compares what you can handle with what you must handle. Here, drawn to scale, is one orbit's worth of each. The disturbance bar is about one twelfth as long as the capability bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="22" width="300" height="24" fill="#1d6fd1"/>
  <text x="20" y="16" font-size="12" fill="#1f2a44">torquer capability: 2.83 × 10⁻² N m s</text>
  <rect x="20" y="70" width="25" height="24" fill="#f2b880" stroke="#1f2a44"/>
  <text x="54" y="87" font-size="12" fill="#1f2a44">disturbance: 2.40 × 10⁻³ N m s</text>
</svg>
```

A margin near one would mean the wheels slowly fill up whenever conditions are a little worse than expected. A margin of about twelve means there is room for error.
:::
