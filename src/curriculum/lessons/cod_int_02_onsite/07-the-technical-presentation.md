---
id: l07-the-technical-presentation
title: The technical presentation
minutes: 23
covers:
  - 'The technical presentation: about twelve minutes of slides and twenty-plus minutes of debate'
---

Picture a science fair. You stand next to your poster for a few minutes while a judge reads it. Then the judge starts asking questions. Why did you pick that many trials? How do you know the thermometer was right? What would happen if the room were colder? The poster got you to the table. The questions decide the ribbon.

The onsite presentation works the same way, only the judges are the engineers you would work with, and there are several of them. You talk for a short while about something you built. Then they take it apart, one assumption at a time, to see whether you understand it all the way down.

This lesson shows you how to build a talk that survives that. You will lay out twelve slides with a clear job each, do the timing arithmetic, label every number on every slide by where it came from, and practise the moves for a hard question. The talk will be about one of your capstones — the Monte Carlo ascent simulator or the C++ GNC application from this track — because the best talk is about work you did yourself and know cold.

## The reported dynamic

Here is the shape of the round, as candidates have **[[reported|reported-again]]** it — meaning it comes from many people's accounts of their own interviews, not from a company rulebook.

::: key The team presentation
About twelve minutes of slides and twenty or more minutes of debate. Optimise for defending your assumptions, not for slide polish, and know which numbers on each slide you can derive from first principles.
:::

Put numbers on that and the priority becomes plain. The whole round is at least $12 + 20 = 32$ minutes. The questions take $20$ of those, so the questions are at least

$$
\frac{20}{32} = 0.625 \approx 62\%
$$

of the round. That is more than half, and "twenty or more" means it can be larger. The talk is the shorter part.

So where should your preparation hours go? Mostly into the **debate** — the back-and-forth where engineers challenge what you said and you answer. A beautiful slide with a number you cannot explain is worse than a plain slide with a number you can defend, because the beautiful one invites the question you cannot answer.

The key block uses two phrases worth slowing down on.

- **Defending your assumptions.** An **assumption** is something you took as true without proving it in the talk: that the air is still, that the engine gives its rated thrust, that a gyro's noise is steady. Every model rests on assumptions. The engineers know that. What they want to see is that *you* know which ones you made and what happens if they are wrong.
- **[[First principles|first-principles]].** A number you can derive from first principles is one you could work out on a whiteboard from basic physics, starting from nothing but a few well-known constants. We come back to this below, because it is the single most useful thing to prepare.

::: warning Polishing the wrong thing
It is tempting to spend a week on colours, fonts and animations, because that work feels productive and nobody argues with you while you do it. None of it survives the first question. Spend an hour on how the slides look and the rest of your time on what is on them and why.
:::

## Twelve slides, six jobs

A good technical talk answers six questions in order. Each question gets one or two slides. Twelve slides at about one minute each fits the twelve minutes.

1. **Problem.** What were you trying to find out, and why does it matter to someone flying a vehicle?
2. **Model and its fidelity limits.** What did you simulate, and what did you leave out? **[[Fidelity|fidelity]]** means how closely a model matches the real thing. Every model has limits, and this is where you name them before anyone else does.
3. **Method.** How did you run it: the integrator, the time step, the number of Monte Carlo runs, which inputs you scattered and by how much.
4. **Verification.** How do you know the code does what you think it does? Checks against answers you know, tests, convergence.
5. **Results with uncertainty.** What came out, and how sure you are. A result without an error bar is half a result.
6. **The conclusion you will defend.** One or two sentences you are prepared to stand behind for twenty minutes.

Here is one way to spread those six jobs over twelve slides for a Monte Carlo ascent simulator.

| Slide | Job | What is on it |
| --- | --- | --- |
| 1 | Problem | Title and the one question the talk answers |
| 2 | Problem | Why that question matters for a real ascent |
| 3 | Model | Equations of motion, forces included |
| 4 | Model | Fidelity limits: what is left out and why |
| 5 | Method | Integrator, time step, number of runs |
| 6 | Method | Dispersion table: each input, its spread, its source |
| 7 | Verification | Comparison against a case with a known answer |
| 8 | Verification | Step-size convergence and the regression tests |
| 9 | Results | The headline result |
| 10 | Results | The same result with its uncertainty |
| 11 | Conclusion | Limitations that could change the answer |
| 12 | Conclusion | The claim you will defend |

Notice slide 4 and slide 11. Two of twelve slides — one sixth of the deck — are about what your work *cannot* tell anyone. That is on purpose. Saying it first, in your own words, is far stronger than having it dragged out of you in minute twenty-five.

There is one more rule for the whole deck: **every number on every slide has a stated source.** If a slide says the drag coefficient is 0.3, a small note under it says where 0.3 came from — a textbook table, a wind-tunnel report, your own fit, or "assumed". An engineer who sees a number with no source will ask about it, and now you are defending the number instead of the idea.

::: warning The slide that says "it just works"
Never tell the room that your simulator "just works", or "works fine", or "is validated" with nothing after it. Those phrases claim success without evidence, and every engineer in the room will want to know how you know. Replace them with the check: "It matches the analytic answer to within 0.1 percent for the no-drag case, and here is the comparison." A check can be questioned and survive. A claim cannot.
:::

## Timing arithmetic

Twelve minutes for twelve slides is

$$
\frac{12\ \text{min}}{12\ \text{slides}} = 1\ \text{min per slide} = 60\ \text{s per slide}.
$$

That is the average, not a rule. A title slide needs less. A results slide needs more. The trick is to plan in seconds and make the total come out right.

How much can you say in a minute? Most people presenting speak at roughly **130 to 150 words per minute**. So one slide gets about 130 to 150 words of speech, and the whole talk is about $12 \times 130 = 1{,}560$ to $12 \times 150 = 1{,}800$ words. That is not much. It is about three pages of typed notes for the entire talk.

::: example Budgeting twelve slides in seconds
You have 720 seconds. Plan each slide's time, then add them up.

- Slide 1, title and question: 30 s. It is short on purpose.
- Slides 4 and 9, the fidelity limits and the headline result: 75 s each, because these draw the most questions.
- Slide 12, the conclusion: 60 s.
- The other eight slides: 60 s each.

Add them. One short slide: $30$. Two long slides: $2 \times 75 = 150$. Nine slides at 60 s (the eight others plus slide 12): $9 \times 60 = 540$. Total:

$$
30 + 150 + 540 = 720\ \text{s} = 12\ \text{min}.
$$

It fits exactly. Now convert to words at 140 words per minute, the middle of the range. A 75 s slide gets $140 \times 75 / 60 = 175$ words. A 30 s slide gets $140 \times 30/60 = 70$ words.

Sanity check: 720 s at 140 words per minute is $140 \times 12 = 1{,}680$ words, which sits inside the 1,560 to 1,800 range above. Good.
:::

Now the danger. Say you add three "quick" extra slides at a minute each. Fifteen slides at 60 s is 15 minutes. You are three minutes over, which is a quarter of your whole twelve. Nobody will stop you, but the panel will notice, and the extra slides make more targets.

::: warning Rehearse with a clock, out loud
Reading slides silently in your head runs much faster than speaking. People who time their talk that way run long on the day. Stand up, speak every word aloud, and time it. If you finish in 11 minutes on the third try, you are in good shape; nerves usually speed you up a little.
:::

## Numbers you can derive from first principles

Every number on your slides falls into one of four bins. Knowing which bin each one is in is most of your defence.

- **Derived** — you can work it out on a whiteboard from physics and a few known constants.
- **Measured** — it came from data: a test, a log, a run of your simulator.
- **Cited** — you took it from a source: a textbook, a datasheet, a paper.
- **Assumed** — you picked it because you had to pick something.

None of these is bad. Assumed numbers are allowed! What is bad is not knowing which bin a number is in. The panel's favourite question is "where does that number come from?", and "derived — let me show you" is the strongest possible answer.

::: example Deriving orbital speed at the whiteboard
Your ascent slide says the target is a circular orbit at 400 km, needing about 7.67 km/s. An engineer asks: "Where does 7.67 come from?"

Start with the idea. In a circular orbit, gravity supplies exactly the pull needed to keep you moving in a circle. Setting gravity's pull equal to the pull a circle needs gives

$$
v = \sqrt{\frac{\mu}{r}}.
$$

Here $v$ is the orbital speed, $r$ is the distance from Earth's centre, and $\mu$ (read "mu") is Earth's **[[gravitational parameter|mu]]**, $3.986 \times 10^{14}\ \mathrm{m^3/s^2}$.

Step 1: find $r$. It is measured from Earth's centre, not the ground. Earth's mean radius is 6,371 km, so $r = 6{,}371 + 400 = 6{,}771$ km $= 6.771 \times 10^6$ m.

Step 2: divide. $\mu / r = 3.986 \times 10^{14} / 6.771 \times 10^{6} \approx 5.887 \times 10^{7}\ \mathrm{m^2/s^2}$.

Step 3: take the square root. $\sqrt{5.887 \times 10^7} \approx 7{,}673$ m/s, about 7.67 km/s.

Sanity check: low Earth orbit speeds are usually quoted as about 7.7 km/s, and a 400 km orbit is a little higher than the lowest ones, so a little slower. That fits.
:::

Go through your deck slide by slide and mark each number D, M, C or A. For every D, practise the derivation. For every C, know the source by name. For every M, know how many runs or samples it came from. For every A, know what happens to your conclusion if it is off by a sensible amount.

::: note Why gravity and the circle balance
An object moving in a circle of radius $r$ at speed $v$ needs a pull toward the centre of $v^2/r$ per kilogram. Gravity at distance $r$ gives $\mu/r^2$ per kilogram. In a circular orbit they are the same pull, so $v^2 / r = \mu / r^2$. Multiply both sides by $r$ to get $v^2 = \mu / r$, then take the square root: $v = \sqrt{\mu/r}$.
:::

## Results with uncertainty

A Monte Carlo result is a count out of a number of runs, so it always carries uncertainty. Suppose your 1,000-run ascent study had zero runs that missed orbit. Can you say the failure chance is zero? No. You can only say it is small, and you should say how small.

::: example Zero failures in a thousand runs
There is a handy result called the **[[rule of three|rule-of-three]]**: if you see zero failures in $N$ independent runs, then with about 95 percent confidence the true failure chance is below $3/N$.

With $N = 1{,}000$:

$$
\frac{3}{N} = \frac{3}{1{,}000} = 0.003 = 0.3\%.
$$

So the honest slide says: "0 of 1,000 dispersed runs missed orbit; at 95 percent confidence the miss rate is below about 0.3 percent, given the dispersions on slide 6."

Sanity check: more runs should shrink the bound. With 10,000 runs it is $3/10{,}000 = 0.03\%$, ten times tighter for ten times the runs. That matches the intuition that more evidence narrows the answer.
:::

Look at the last clause of that slide sentence: "given the dispersions on slide 6". The result is only as good as the inputs you scattered. That clause invites the right question — "why those dispersions?" — and you have already prepared for it.

::: note Why three
If each run fails with chance $p$, the chance that all $N$ runs pass is $(1-p)^N$. For small $p$ this is very close to $e^{-pN}$. We ask: how big could $p$ be before seeing zero failures would be a surprise, happening less than 5 percent of the time? Set $e^{-pN} = 0.05$. Take the natural log of both sides: $-pN = \ln 0.05 \approx -3.0$. So $p \approx 3/N$.
:::

## Handling hostile questions

"Hostile" here does not mean rude. It means the questions are designed to find the weak spot. This is how engineering teams review work with each other, and the panel is showing you what a normal design review feels like. It is not personal.

When a hard question lands, use four moves.

1. **Pause and restate.** "So you're asking whether the drag model holds past Mach 1?" This buys three seconds and checks that you are answering the right question.
2. **Answer with the bin.** Say where the number came from: derived, measured, cited or assumed.
3. **Bound the damage.** If the assumption were wrong by a sensible amount, what changes? "If the drag coefficient were 20 percent higher, the extra loss would come out of the propellant margin shown on slide 10."
4. **Say what would settle it.** "I would check that by rerunning with the higher coefficient; it takes about an hour."

And if you do not know? Say so. "I don't know. Here is how I would find out." That sentence costs you nothing and earns a great deal, because a confident guess that turns out wrong in front of five engineers costs a great deal.

::: warning Arguing to win
If a panel member finds a real flaw, do not defend it to the end. Say "You're right, that's a gap," then say what it does to your conclusion. Changing your mind for a good reason is exactly what they hope to see. Refusing to is the worst thing you can do in this round.
:::

## Conceding a limitation before you are asked

The exercise for this module asks you to concede at least one real limitation **unprompted** — without anyone asking. Slide 4 and slide 11 are where you do it.

A real limitation is one that could change the answer. "The font is small" is not one. "The model is 3-DOF, so it ignores attitude dynamics during the gravity turn" is. **3-DOF** means three degrees of freedom: the model tracks where the vehicle is, but not which way it points.

A good concession has three parts: what you left out, why you left it out, and what it might do to the result. "I used a 3-DOF model because the question was about propellant margin, not control. Attitude errors would add some steering losses, so the real margin is probably a bit smaller than slide 10 shows." Now the panel knows you see the edge of your own work. That is what they came to find out.

## Check yourself

::: check
The debate part of a presentation round runs 25 minutes and the talk runs 12. What fraction of the round is debate, and what does that tell you about preparation?
:::

::: answer
The round is $12 + 25 = 37$ minutes. Debate is $25/37 \approx 0.68$, about 68 percent. More than two thirds of the round is questions, so most of your preparation belongs in defending assumptions and knowing where each number comes from, not in slide polish.
:::

::: check
You planned 60 s per slide but your results slide needs 90 s. You cannot go over 12 minutes. Where does the extra time come from, and how many words does the 90 s slide get at 140 words per minute?
:::

::: answer
The extra is $90 - 60 = 30$ s, so some other slide or slides must lose 30 s in total, for example the title slide dropping from 60 s to 30 s. The total stays $720$ s. At 140 words per minute, 90 s is $140 \times 90 / 60 = 210$ words.
:::

::: check
Sort these numbers from an ascent talk into derived, measured, cited or assumed: (a) 7.67 km/s orbital speed at 400 km; (b) a 5 percent spread in engine thrust you picked because you had no data; (c) a drag coefficient from a textbook table; (d) 3 of 2,000 runs exceeding a load limit.
:::

::: answer
(a) Derived, from $v = \sqrt{\mu/r}$. (b) Assumed — so be ready to say what happens if the spread is 10 percent instead. (c) Cited — know the book and the table. (d) Measured — it is a count from your own runs, so you should also know its uncertainty.
:::

::: check
Your 500-run study had no failures. What upper bound on the failure rate can you honestly state, and what phrase should follow it?
:::

::: answer
By the rule of three, $3/500 = 0.006$, so below about 0.6 percent at roughly 95 percent confidence. It should be followed by the conditions: "given the dispersions I used", because the bound only covers the inputs you scattered.
:::

::: check
Rewrite this answer to a panel question so it survives: "The integrator is fine, it just works."
:::

::: answer
Something like: "I used RK4 at a 10 ms step. I checked it by halving the step to 5 ms; the final orbit speed changed by less than 0.01 percent, so the step is small enough for this question. The comparison plot is on slide 8." It names the method, gives a check anyone can repeat, states a number with its source, and points to the evidence.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Reported dynamic | about 12 min of slides, 20 or more min of debate; optimise for defending assumptions |
| Six jobs | problem, model and fidelity limits, method, verification, results with uncertainty, defended conclusion |
| Timing | 12 min over 12 slides is 60 s each on average; plan in seconds, total 720 s |
| Speaking rate | about 130 to 150 words per minute, so about 1,560 to 1,800 words for the talk |
| Number bins | derived, measured, cited, assumed; every number has a stated source |
| Orbital speed | $v = \sqrt{\mu/r}$, about 7.67 km/s at 400 km |
| Rule of three | 0 failures in $N$ runs: rate below about $3/N$ at 95 percent confidence |
| Hard question | restate, give the bin, bound the damage, say what would settle it |
| Never | "it just works"; always concede a real limitation unprompted |

The presentation is the most technical place where the panel watches how you work. Next lesson turns to the part of the onsite that is about that directly: the behavioural themes, and how to say exactly what you did.

::: context reported-again A map, not a contract
"Reported" in this module means the fact comes from candidates' own accounts, which agree on the broad shape but not every detail. Your team may run the presentation differently: a different length, a fixed topic, or a smaller panel. Ask your recruiter what to expect. They are there to help you get through, and questions about format are normal.
:::

::: context first-principles Building up from the bottom
"First principles" means starting from the most basic facts you trust — Newton's laws, conservation of energy, a known constant like Earth's gravitational parameter — and reasoning upward, instead of repeating a number because someone else wrote it down. The phrase goes back to philosophy, where a first principle is something not derived from anything else. In engineering, it is the difference between "the textbook says 7.7 km/s" and "here is why it must be about 7.7 km/s". Only the second one survives a follow-up question.
:::

::: context fidelity How close is close enough
A model's fidelity is how much of the real world it includes. A point-mass model with gravity only is low fidelity. Adding drag raises it. Adding attitude, engine gimbal, sloshing propellant and wind raises it more. Higher is not always better: each layer costs time to build, time to run and new ways to be wrong. The right fidelity is the lowest one that can answer your question.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="20" y="110" width="80" height="26" fill="#fff"/>
    <rect x="100" y="84" width="80" height="52" fill="#8fb8f0"/>
    <rect x="180" y="58" width="80" height="78" fill="#1d6fd1"/>
    <rect x="260" y="32" width="80" height="104" fill="#1f2a44"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="104">gravity only</text>
    <text x="140" y="78">+ drag</text>
    <text x="220" y="52">+ attitude</text>
    <text x="300" y="26">+ slosh, wind</text>
  </g>
  <text x="180" y="148" font-size="11" fill="#6c7a93" text-anchor="middle">more fidelity: more cost, more to verify</text>
</svg>
```
:::

::: context mu One number instead of two
Newton's law of gravity uses $G$, the universal gravitational constant, times $M$, Earth's mass. Each of those is hard to measure on its own, but their product $\mu = GM$ can be measured very precisely by tracking satellites. That is why orbital engineers use $\mu$ directly: $3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ for Earth. Its units look strange, but they are what make $\sqrt{\mu/r}$ come out in metres per second.
:::

::: context rule-of-three A bound from nothing
The rule of three is a quick answer to "we saw zero failures — so what?" The bound falls by the same factor the run count grows, so to push it down you need many more runs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="120" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="80" y="30" width="50" height="90"/>
    <rect x="170" y="75" width="50" height="45"/>
    <rect x="260" y="111" width="50" height="9"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="105" y="136">N = 100</text>
    <text x="195" y="136">N = 200</text>
    <text x="285" y="136">N = 1,000</text>
    <text x="105" y="24">3%</text>
    <text x="195" y="69">1.5%</text>
    <text x="285" y="105">0.3%</text>
  </g>
  <text x="20" y="75" font-size="11" fill="#6c7a93" transform="rotate(-90 20 75)" text-anchor="middle">bound 3/N</text>
</svg>
```

Bar heights are to scale: 3 percent, 1.5 percent and 0.3 percent.
:::

::: context design-review How teams really argue
Most aerospace teams hold design reviews, where the people who built something present it and others try hard to break it. The reviewers are not enemies; a flaw found in a conference room is far cheaper than a flaw found in flight. The onsite presentation is a small version of that meeting. Showing that you are comfortable in it — calm, specific, willing to say "good point" — tells the panel you would fit into their real reviews.
:::

::: context three-dof Counting the ways a thing can move
A rigid body in space can move in six independent ways: three for position (forward, sideways, up) and three for rotation (pitch, yaw, roll). A 3-DOF model tracks only position, treating the rocket as a point. A 6-DOF model adds rotation, so it can show how the vehicle points and how the control system steers it. 3-DOF is fine for many trajectory questions; it cannot answer attitude questions at all.
:::
