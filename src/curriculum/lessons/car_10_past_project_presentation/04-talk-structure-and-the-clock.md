---
id: l04-talk-structure-and-the-clock
title: "Seven parts, and what each one gets of the clock"
minutes: 22
covers:
  - "talk structure: problem, why it was hard, approach, the key decision and the alternatives rejected, verification, result, what you would do differently"
---

Think about a good mystery story. First you learn what went wrong. Then you learn why it is a puzzle — why the obvious answer does not work. Then you watch the detective work. The best part is the moment she rules out the other suspects and says why. Then comes the proof, then the answer, and at the end, a word about what she would have done sooner. Nobody wants forty pages about the detective's car.

A talk about an engineering project has the same bones. It has seven parts, in this order:

1. the **problem**;
2. **why it was hard**;
3. the **approach**;
4. **the key decision and the alternatives you rejected**;
5. **verification** — how you know it is right;
6. the **result**;
7. **what you would do differently**.

Each part answers a question the panel will ask anyway. Put each answer where it belongs, and the question is answered before it can interrupt something else.

The hard part is the clock. Ten to twenty minutes is short for any real project, and the natural way to spend it — a long, comfortable tour of what you built — leaves thirty seconds for verification and nothing for the two parts that decide the round. So this lesson is as much about how many minutes each part gets as about the parts themselves. A structure that does not fit the time is a structure you will abandon halfway through.

::: key
Talk structure for 10 to 20 minutes: problem; why it was hard; approach; the key decision and the alternatives you rejected; verification; result; what you would do differently. The rejected-alternatives section is the one panels remember.
:::

## What each part is actually for

**Problem.** State the requirement as a **[[bar to clear|requirement-word]]**, not as an activity. Say "land within a stated miss distance, given a limited range of engine thrust," not "explored powered-descent guidance." Put a number in it. Everything after this means nothing without it. That is why it goes first, and why the least specialized person in the room must be able to follow it.

**Why it was hard.** This is the part candidates skip, and it is the part that sets the scale for everything else. Without it, the panel cannot tell whether your result is impressive or routine — and if you do not tell them, they assume routine. In one or two technical sentences, name the specific difficulty. For example:

- a **non-convex constraint** — a rule that splits the set of allowed answers into pieces, which makes the problem much harder to solve reliably;
- a direction of the state that is **unobservable** — something the sensors, from where they sit, cannot tell you;
- a **coupling** — two parts of the vehicle that affect each other so strongly that they cannot be designed separately.

**Approach.** What you built, at the level of the one diagram that carries the talk. Not a tour of the code. The right length is enough for the panel to follow the verification section afterwards. Anything more is detail the questions will ask for if they want it.

**The key decision and the alternatives you rejected.** One decision. The other options, named, each with the specific reason it lost and the condition that would have made it win. This is the section panels remember, because every other section describes an outcome. This one is the only direct evidence of engineering judgment — proof that you chose a path, instead of taking the first one that worked.

**Verification.** How you know the thing is right. Some typical kinds of evidence:

- an **analytic case** — a situation with a known pen-and-paper answer — matched to a stated **tolerance** (the largest error you will accept);
- a **conserved quantity**, such as energy, that stayed conserved;
- a **convergence rate** — how fast the error shrinks as the step size shrinks — that behaved as the method predicts;
- a **consistency test** against a statistical band.

Panels probe this section hardest, because most projects do not have one.

**Result.** The numbers, with units, and the worst case next to the average wherever there were repeated trials. A result is what happened when it ran, not what the code could do.

**What you would do differently.** Specific and technical. It closes the talk on the limits of your own work. It is not an apology.

## The clock

Here is a fifteen-minute split that fits, with the seven parts adding up exactly: $1.5+1.5+3+3+3+2+1 = 15$ minutes. The [[bar picture|clock-bar]] in the notes shows the same split to scale.

| Part | Minutes | What has to be in it |
| --- | --- | --- |
| Problem | 1.5 | The requirement with a number in it |
| Why it was hard | 1.5 | The specific difficulty, named technically |
| Approach | 3 | The carrying diagram, and what you built versus what a library did |
| Key decision and rejected alternatives | 3 | One decision, named alternatives, the reason each lost |
| Verification | 3 | The evidence, with the tolerance or band it was checked against |
| Result | 2 | Numbers with units; worst case as well as average |
| What you would do differently | 1 | One or two specific, technical changes |

Look at where the time goes. The key decision and verification get six of the fifteen minutes. Those are the two things a panel cannot get from your code and cannot guess from a plot. The section that *feels* like the talk — describing what you built — gets three minutes and no more.

Now compare the split almost everyone makes on a first try:

- eight to ten minutes of approach;
- one minute of results;
- verification squeezed into one sentence: "I validated it against the analytical solution and it matched";
- "what I would do differently" dropped, because the clock ran out.

That talk spends most of its time on the part of the round that was never in doubt.

If the format is ten minutes instead of fifteen, shrink every part in proportion. Do not delete one: $1+1+2+2+2+1.5+0.5 = 10$ minutes. A talk missing its verification section is not a shorter talk. It is a much weaker one.

::: warning
Never build a talk to the top of a stated range. If the format is ten to twenty minutes, build fifteen and know how to cut to ten. You do not control when the room actually starts. A panel that gathers five minutes late takes those minutes out of your talk, not out of the questions. The sections you lose are the ones at the end: verification, result and what you would do differently. A talk built at twenty minutes has no **[[margin|late-start]]** at all, and its failure is being cut off in the middle of the results — the worst possible place to stop.
:::

## The first ninety seconds, worked

The next example uses anchor project A from the portfolio module: a computer simulation of a rocket climbing to orbit, called a **[[6-DOF|six-dof]]** simulation (said "six-D-O-F", for six degrees of freedom).

::: example Problem and why-it-was-hard, on anchor project A
**Weak.** "So this project is a six-degree-of-freedom simulation of a launch vehicle. I wrote it in Python with NumPy, and it propagates the translational and rotational states together using an RK4 integrator. I built it over about six months and added features as I went, starting with three degrees of freedom and then adding attitude."

After ninety seconds of this, the panel knows what the thing *is* and nothing about whether it is any good. Step by step:

- there is no requirement, so there is nothing yet to judge;
- there is no difficulty named, so the panel assumes there was none;
- the story is told as a diary — "I started here and added that" — which is the shape of a hobby, not an engineering project.

**Strong.** "The requirement was to predict the vehicle's structural and control loads through max dynamic pressure well enough to size control authority, across the dispersions the vehicle would actually fly through — not on a single nominal trajectory. Two things made that hard. First, the loads follow dynamic pressure, and dynamic pressure follows atmospheric density, where a single-scale-height exponential model is about $30\%$ high by $20\,\mathrm{km}$ and nearly a factor of two high by $30\,\mathrm{km}$, so the convenient model is wrong exactly where the answer matters. Second, the attitude loop and the trajectory are not separable: a thrust misalignment is simultaneously a disturbance torque and a trajectory perturbation, so a three-degree-of-freedom answer cannot bound the control authority I needed to size."

Some words, unpacked. **[[Max dynamic pressure|max-q]]** is the moment in the climb when the air pushes hardest on the rocket. **Control authority** is how much turning force the steering can produce. A **nominal trajectory** is the single planned flight path; **dispersions** are the small random differences between that plan and the flights that really happen. A **[[single-scale-height exponential model|scale-height]]** is the simplest formula for how air thins with height.

**What separates them.** The strong version states a bar to clear. Then it names two specific technical difficulties — one about how accurate the air model is, with a number attached, and one about coupling — in about the same number of words as the weak version. It also quietly answers the two most likely first questions before they are asked: *why a layered atmosphere?* and *why six degrees of freedom rather than three?*

**Sanity check.** Both versions take about ninety seconds; only one uses them to set a bar.
:::

## The key decision section, worked

This section gets three of your fifteen minutes, and it has a shape. State the decision. Name the alternatives. Give the reason each one lost. Say what would have changed your mind.

The example uses anchor project B: guidance software for a rocket landing, set up as a **[[convex|convex-bowl]]** optimization problem — a kind of problem whose best answer a computer can find reliably and quickly.

::: example The decision section, on anchor project B
**Weak.** "I used a convex formulation because convex problems can be solved reliably and quickly, which is important for onboard guidance. I discretized into forty nodes and solved it with an interior-point solver."

This describes what was done and attaches a general reason. Nothing in it could have come out the other way. So it is not yet a decision.

**Strong.** "The decision was to fix the final time rather than solve for it. The thrust lower bound is the non-convex part of the problem — a real engine cannot throttle through zero — and lossless convexification handles that exactly, with a slack variable and a theorem that the relaxation is tight, so I checked it was tight on my own solutions rather than citing it: the maximum gap between the thrust magnitude and its slack across the returned trajectories was at solver tolerance. Final time is a separate choice. Free final time makes the problem non-convex again unless you line-search over it, which is a solve per candidate time; fixed final time is one solve. I took the single solve, and I know what it cost, because the dispersion campaign priced it: $4.0\%$ of 500 cases returned infeasible — no trajectory exists meeting both terminal conditions inside the actuator bounds in exactly twenty seconds. That fraction is the number I would report first, ahead of the mean landing accuracy. What would have changed my mind is the operational requirement: if the vehicle has to land from a dispersion set this wide with no abort, a $4\%$ no-solution rate is not acceptable and the two-stage architecture that finds a feasible landing point first is worth the extra solve."

Some terms, in plain words. **Lossless convexification** is a mathematical trick that turns the engine's "can't throttle below a minimum" rule into a convex one without changing the answer; the **slack variable** is the extra number the trick adds, and "tight" means the trick really did not change the answer. A **line search** here means trying many final times, one full solve each. **Infeasible** means no plan meets every rule.

**Pricing the choice.** $4.0\%$ of $500$ cases is $0.04 \times 500 = 20$ cases with no solution. That is the cost of choosing one solve instead of many.

**What separates them.**

- One decision, pulled apart from the others around it.
- An alternative named, with its real cost counted in solves — not waved away.
- A number that prices the choice, from the candidate's own campaign.
- A stated condition under which the decision would flip. That is what turns a preference into an engineering decision.

**Sanity check on length.** Spoken, it runs about ninety seconds — half the three minutes — leaving room for a second decision.
:::

## What you would do differently is not an apology

Candidates hear this section as a confession and write it as one: "I should have tested more." "I ran out of time." A panel reads that as either false modesty or a real admission that the work was rushed.

The section works when it is specific, technical, and about a limit of the *work*, not a limit of the *worker*. Here is the test: does your answer name something a reviewer could have raised as a criticism? If it does, you raised it first. That is a much stronger position than being asked about it.

For each anchor project, the honest version is already written in its limitations section:

- **Anchor A** — the attitude control gains were tuned against the nominal trajectory and never re-checked against the dispersion set the Monte Carlo used. So the campaign tests whether that tuning *happened* to work across the spread, not whether it was *designed* to.
- **Anchor B** — fixed final time, priced at a $4.0\%$ infeasible rate. The next version is the two-stage feasibility-then-fuel design.
- **Anchor C** — this is **[[verification, not validation|verify-validate]]**. The check that the filter's reported uncertainty matches its real error was done inside the same simulation that made both. Nothing here checks that the assumed gyro and star-tracker noise models describe real hardware.
- **Anchor D** — the outlier handling is a simple cut against a fixed threshold. Unmodeled effects such as changing air drag get soaked into the estimate, instead of being carried as a **[[consider parameter|consider-parameter]]**.
- **Anchor E** — the law for dumping stored spin from the reaction wheels was shown against a perfectly modeled magnetic field and a perfectly aligned magnetic coil. The margin of about $11.8$ is not yet a demonstrated margin once coil misalignment and field-model error are included.

Each names a specific technical gap and points at what the next version does about it.

## Check yourself

::: check
A candidate's fifteen-minute talk gives eight minutes to describing what he built, one minute to results, and squeezes verification into a single sentence. Name the two sections this split has effectively deleted, and explain why losing them costs more than the extra description gains.
:::

::: answer
It has deleted verification and the key decision with its rejected alternatives. It has probably lost "what you would do differently" to the clock as well.

Those are the sections a panel cannot get any other way. The description of what was built is available from the code or the write-up. The evidence that it is right, and the reasoning behind the central choice, exist only in the candidate's head until spoken.

Two of the four evaluation axes — technical depth, and defending engineering decisions under questioning — rest almost entirely on the deleted sections. So the split spends its time on the part of the round that was never in doubt.
:::

::: check
Why does this lesson insist that a talk be built at fifteen minutes when the stated format is ten to twenty?
:::

::: answer
Because you do not control the start. A room that gathers late takes the lost time out of the talk, not out of the questions. The sections that fall off the end are verification, result and what you would do differently — the strongest material in the talk.

A fifteen-minute build inside a ten-to-twenty window has five minutes of margin in each direction. It can shrink to ten by scaling every section down, without deleting one, and it finishes cleanly with time left if the room runs long. A build at twenty has no margin, which makes being cut off in the middle of the results the likely outcome.
:::

::: check
A candidate says: "I chose a convex formulation because convex problems solve reliably and quickly." Explain why this is not yet a defense of a decision, and what would make it one.
:::

::: answer
Nothing in it could have come out the other way. It attaches a general property of convex problems to a choice already made, instead of applying a test to *this* problem.

It becomes a decision when it does four things:

1. isolates one specific choice — fixed final time versus free final time;
2. names the rejected alternative — free final time, which needs a search over many candidate times;
3. states the cost that decided it — one solve instead of many, at the price of a $4.0\%$ infeasible rate across the dispersion set;
4. gives the condition that would reverse it — an operational requirement that cannot accept a no-solution case.
:::

::: check
Why does "why it was hard" get its own section instead of being folded into the problem statement?
:::

::: answer
The problem statement sets the bar. The difficulty section sets how *high* the bar is. A panel that hears only the first cannot judge the result. With no stated difficulty, they assume the problem was routine, and even a strong result then reads as ordinary.

Keeping the two apart also forces you to name the difficulty technically — a non-convex constraint, an unobservable direction, a coupling that prevents separate design. When the section is folded into a general introduction, it tends to slide into talk about effort or how long the work took.
:::

::: check
Rewrite this closing into a defensible "what I would do differently": "I would have liked to test it more thoroughly, but I ran out of time."
:::

::: answer
Make it specific and technical, naming a gap a reviewer could otherwise raise. For the 6-DOF simulation, for example:

"The attitude control gains were tuned against the nominal trajectory and never re-checked against the dispersion set. So the campaign shows the tuning happened to work across the spread, not that it was designed to. Re-tuning inside the dispersion loop is the next thing I would do."

That names a real limitation, says how the existing result should be read, and states the fix. The original names only a shortage of time: it tells the panel nothing about the work, and invites the very question it was trying to avoid.
:::

## Summary

| Part | Minutes at 15 | Its job |
| --- | --- | --- |
| Problem | 1.5 | The requirement as a bar, with a number |
| Why it was hard | 1.5 | The specific technical difficulty, so the result can be judged |
| Approach | 3 | The carrying diagram; enough that verification makes sense, no more |
| Key decision and alternatives rejected | 3 | The section panels remember: the reason, the cost, and what would flip it |
| Verification | 3 | Evidence against a stated tolerance or band |
| Result | 2 | Numbers with units, worst case as well as average |
| What you would do differently | 1 | One specific technical gap and its fix — not an apology |
| Ten-minute version | — | $1+1+2+2+2+1.5+0.5 = 10$: scale every section; never delete one |
| Build target | 15 | Inside a 10-to-20 window, so a late start costs margin, not content |

The next lesson takes the slides these seven parts live on, starting with the one rule that does more work than every other slide-design rule combined.

::: context requirement-word What engineers mean by a requirement
In everyday speech, "requirement" can mean anything you have to do. In engineering it has a sharper meaning: a statement that can be *checked*, usually with a number and a unit. "The lander shall touch down within 5 m of the target" is a requirement. "The lander should land accurately" is a wish. Big programs keep thousands of requirements in a database, and every test traces back to one. Opening your talk with a requirement tells the panel exactly what to judge you against.
:::

::: context clock-bar Fifteen minutes, drawn to scale
Each block's width is its share of the fifteen minutes. The two darker blocks — the key decision and verification — are the parts a panel cannot get from your code, and together they take six minutes, $40\%$ of the talk.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="33" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="48" y="30" width="33" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="81" y="30" width="66" height="40" fill="#fff" stroke="#1f2a44"/>
  <rect x="147" y="30" width="66" height="40" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="213" y="30" width="66" height="40" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="279" y="30" width="44" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="323" y="30" width="22" height="40" fill="#fff" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="31.5" y="22">P</text><text x="64.5" y="22">H</text><text x="114" y="22">approach</text>
    <text x="180" y="22">decision</text><text x="246" y="22">verify</text><text x="301" y="22">result</text><text x="334" y="22">D</text>
    <text x="31.5" y="55">1.5</text><text x="64.5" y="55">1.5</text><text x="114" y="55">3</text>
    <text x="301" y="55">2</text><text x="334" y="55">1</text>
  </g>
  <g font-size="11" fill="#fff" text-anchor="middle"><text x="180" y="55">3</text><text x="246" y="55">3</text></g>
  <line x1="15" y1="84" x2="345" y2="84" stroke="#6c7a93"/>
  <g font-size="11" fill="#6c7a93" text-anchor="middle"><text x="15" y="98">0</text><text x="180" y="98">7.5</text><text x="345" y="98" text-anchor="end">15 min</text></g>
  <text x="15" y="120" font-size="11" fill="#6c7a93">P problem · H why hard · D do differently</text>
</svg>
```
:::

::: context late-start What a late start eats
Both talks below were planned for a room booked from minute 0 to minute 20. The panel sat down five minutes late. The talk built at fifteen minutes still fits; the talk built at twenty loses its last five minutes — the end of the results and everything after.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="28" width="60" height="84" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="50" y="66" font-size="11" fill="#6c7a93" text-anchor="middle">late</text>
  <text x="50" y="80" font-size="11" fill="#6c7a93" text-anchor="middle">start</text>
  <rect x="80" y="34" width="180" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="52" font-size="11" fill="#1f2a44" text-anchor="middle">15-minute talk: all of it fits</text>
  <rect x="80" y="80" width="180" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="260" y="80" width="60" height="26" fill="#b4232c" stroke="#1f2a44"/>
  <text x="170" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">20-minute talk: first 15 min</text>
  <text x="290" y="98" font-size="11" fill="#fff" text-anchor="middle">cut</text>
  <line x1="260" y1="20" x2="260" y2="116" stroke="#1f2a44" stroke-width="2"/>
  <text x="260" y="14" font-size="11" fill="#1f2a44" text-anchor="middle">questions begin</text>
  <line x1="20" y1="126" x2="320" y2="126" stroke="#6c7a93"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="20" y="142">0</text><text x="80" y="142">5</text><text x="260" y="142">20</text><text x="320" y="142">25 min</text></g>
</svg>
```

The margin is the gap between the length you build and the longest slot you might be given — and a late start shrinks the slot.
:::

::: context six-dof Six ways to move
An object floating in space can move in six independent ways, called its **degrees of freedom**. Three are sliding: forward-back, left-right, up-down. Three are turning: nose up or down (pitch), nose left or right (yaw), and rolling around its long axis (roll). A "3-DOF" simulation tracks only where the rocket's center is; a "6-DOF" one also tracks which way it points. That matters because a rocket that points wrong pushes itself off course.
:::

::: context max-q The moment the air pushes hardest
**Dynamic pressure**, written $q$, measures how hard moving air pushes on the vehicle: $q = \tfrac{1}{2}\rho v^2$, with $\rho$ the air density and $v$ the speed. Just after lift-off the rocket is slow, so $q$ is small. High up, the air is thin, so $q$ is small again. In between it peaks — the moment launch commentators call "max Q", roughly a minute after lift-off for many rockets. Loads on the structure are largest near there, so it is where an accurate air model matters most.
:::

::: context scale-height The simplest air model, and where it slips
The simplest model of the atmosphere says density shrinks by the same factor for every fixed step up — like a stack of blankets, each layer squashing the ones below. That model is an **exponential**, and the height over which density falls by a factor of $e \approx 2.718$ is the **scale height**, about $8\,\mathrm{km}$ near Earth. Real air changes temperature with height, so one scale height does not fit all altitudes. The portfolio module's anchor A measured the error: about $30\%$ too dense by $20\,\mathrm{km}$.
:::

::: context convex-bowl Bowls and egg cartons
A **convex** problem is like a marble in a smooth bowl: roll it anywhere and it ends up at the one lowest point. A non-convex problem is like an egg carton: the marble can settle in a dip that is not the lowest one, and a computer cannot easily tell.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <path d="M20,30 Q90,150 160,30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="90" cy="84" r="7" fill="#1f2a44"/>
  <text x="90" y="118" font-size="12" fill="#1f2a44" text-anchor="middle">convex: one bottom</text>
  <path d="M200,40 Q220,100 240,60 Q260,20 280,80 Q300,130 320,50 Q330,30 345,35" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="220" cy="68" r="7" fill="#1f2a44"/>
  <text x="272" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">non-convex: false bottoms</text>
</svg>
```

Onboard guidance has seconds to answer and no one to check it, so engineers work hard to make landing problems convex.
:::

::: context verify-validate Built right, or the right thing?
Engineers use two words that sound alike. **Verification** asks: did we build the thing right — does the code do what the math says? **Validation** asks: did we build the right thing — does the math describe the real world? A filter can pass every check inside a simulation (verified) and still fail on a real spacecraft, if the simulated sensor noise is not what real sensors produce (not validated). Saying which one you did is a mark of honesty panels notice.
:::

::: context consider-parameter Known unknowns you carry along
Some quantities you cannot pin down from your data, but you know they are uncertain — the exact air drag on a satellite, say. A **consider parameter** is one you do not try to estimate, but whose uncertainty you still add into the final error bars. It is like packing a raincoat without predicting the rain: you admit the doubt instead of pretending it is zero. Orbit-determination teams use them routinely.
:::
