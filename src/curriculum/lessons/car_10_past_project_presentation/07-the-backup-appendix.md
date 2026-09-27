---
id: l07-the-backup-appendix
title: "The appendix that makes a hard question look expected"
minutes: 20
covers:
  - "the backup-slide appendix for anticipated questions"
---

Picture a science fair. A judge stops at your table, points at your graph and asks, "How do you know the thermometer was accurate?" One student says, "I'm pretty sure it was fine." Another says, "Good question — page six of my notebook," flips straight to it, and shows the test she ran against ice water. Both students may know the same amount. But the second one has shown the judge something extra: she saw that question coming.

That is the idea of this lesson. The previous lesson cut your talk down to eight or ten slides. That raises a fair objection: the material you removed was not worthless. The table of results over many test runs, the derivation, the real numbers for the option you rejected, the case that failed — all of that is real evidence. Throwing it away to make the clock work would be a strange kind of discipline.

It does not get thrown away. It goes into an **[[appendix|appendix-word]]** — extra slides kept after your final slide, not shown during the talk. And it changes what happens during the questioning. A hard question answered from memory is a good answer. The same question answered by turning straight to a slide that already holds the figure is a different event. It tells the panel that you knew this question was coming. And that means you know where your own work is weakest.

::: key
Backup slides are an appendix after the final slide containing the derivations, alternative results and detail that would clutter the main talk. Turning straight to a backup slide when asked is one of the strongest possible signals of preparation.
:::

## Why it counts for so much

It is worth being exact about why this works, because it is not showmanship, and it fails if you treat it as a trick.

To guess a question correctly, you have to know which of your claims is easiest to attack. Think of a soccer goalie who studies which corner a striker likes to shoot at. Knowing where the danger comes from *is* the skill.

That knowledge is exactly what the round tests on two of its four **axes** — the four separate things the panel scores. Those two are technical depth and defending your decisions. So a well-chosen appendix is direct evidence of the very thing being scored. It is not only a convenience. A candidate with eleven backup slides who gets asked about nine of them has shown, without saying a word about it, that she has looked at her own project the way a critic would.

The reverse is also true. Suppose you build an appendix and nobody ever asks about any of it. Then the questions you expected are not the questions your work really provokes. That is useful to learn — during rehearsal, not on the day. It is the reason you write the question list *before* you build the appendix, not after.

## Building it from the thirty questions

The module's own exercise asks you to write thirty questions: the hardest a panel of **GNC** engineers (said "G-N-C": guidance, navigation and control) could ask about your chosen project. At least five should attack whether your approach is valid at all. At least three should be about your personal contribution. Each gets a two-sentence answer, and a note on which ones need a backup slide.

That last note is the sorting step. Engineers call it **[[triage|triage-word]]** — deciding what gets attention and what does not. It has a single rule.

**A question earns a backup slide when its honest answer has to be seen rather than said.** A number in a table. A curve against a limit line. Four lines of algebra. A spread of results. If the honest answer is one sentence — and many of the best answers are one sentence — then a slide adds nothing. Worse, it costs you a trip through the deck to find it.

The example below uses **anchor project B** from the portfolio module: guidance software that plans a rocket's landing burn, the way a Falcon 9 booster lands on its legs. A few words from it, in plain terms:

- **Fixed final time** means the landing is required to take exactly twenty seconds, rather than letting the math pick the best duration.
- A **dispersion set** is the list of hundreds of slightly-varied starting conditions (a bit higher, a bit faster) the guidance was tested against. Running all of them is a **Monte Carlo** campaign, named after the casino, because the variations are drawn at random.
- **Infeasible** means no landing plan exists that obeys all the rules — the engine cannot do it in the time allowed.
- The **cost** here is the total push the engine delivers over the landing, in m/s. It stands in for fuel used.
- **[[Lossless convexification|lossless-convexification]]** is a mathematical trick that turns a hard problem into an easy-to-solve one, with a **slack variable** — an extra helper number — standing in for the engine's thrust size. A theorem says the trick gives the right answer, which engineers call the relaxation being **tight**.

::: example Triage, on eight of the thirty questions for anchor project B
| Question | Honest answer | Slide? |
| --- | --- | --- |
| Why fix the final time? | One solve instead of a search over many candidate times; it cost a $4.0\%$ infeasible rate | No — this is a sentence |
| How do you know the lossless-convexification relaxation was tight on your solutions? | The gap between thrust size and its slack variable, over every returned trajectory, sat at solver tolerance | Yes — a plot of that gap against time |
| What is in the dispersion set, and what distributions? | Starting altitude and speed, normally distributed, with stated standard deviations | Yes — a small table |
| What is the worst case, not the mean? | The cost ranged from $247.3$ to $262.2\,\mathrm{m/s}$ across the feasible cases | Yes — the histogram, with both tails visible |
| Did you verify the dynamics constraints inside the solver? | Yes: re-simulating the returned control on its own reproduced the solver's states to $4\times10^{-12}\,\mathrm{m}$ | Yes — the leftover-error plot, because the number is the claim |
| Why did the cost barely move with altitude dispersion? | Because $\int u\,dt = (v_f-v_0)+g\,t_f$ for any feasible trajectory, which has no altitude term | Yes — the three lines of algebra |
| What did you write, and what did a solver do? | The formulation, discretization (chopping time into steps) and constraint checks are mine; the cone program — the math problem itself — is solved by a library | No — a sentence, and it is already on the carrying diagram |
| Would this run onboard? | I have not measured solve time against a flight processor's budget | No — and see the lesson on saying so |

**Reading the table.** Count the "Yes" rows: tightness, dispersion table, worst case, re-simulation, algebra. That is five slides for eight questions. The three "No" rows are each one sentence long.

**Scaling up.** Five out of eight is about $0.63$. Over thirty questions that would be about $19$, but many of the thirty will share a figure (several worst-case questions all point at one histogram). So an appendix of ten to fifteen slides is normal for a well-triaged project.

**One more slide.** Add a copy of the **carrying diagram** — the one picture of your whole system from the previous lesson — so you can jump back to it during questioning without walking backward through the main deck.
:::

A few symbols from that table, read aloud. $\int u\,dt$ is "the integral of u, d t": add up the engine's push $u$ over every moment of the landing. $v_0$ ("v nought") is the starting speed, $v_f$ ("v sub f") the final speed, $g$ is gravity, and $t_f$ is the final time. The identity says the total push equals the speed you have to lose plus what gravity added along the way. Altitude never appears in it. That is why altitude changes could not move the cost — and why that one answer really is three lines of algebra worth showing.

## What belongs in it, by category

Most backup slides fall into five families.

**The derivation you compressed.** Anything you stated in the talk because deriving it would have cost ninety seconds. Three examples from the anchor projects:

- the identity above, which fixes the fuel-stand-in cost from the speed conditions alone;
- the closed-form worst-case **[[gravity-gradient|gravity-gradient-bound]]** bound, $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$, that confirmed a numerical search over every pointing direction;
- the chi-square **acceptance band** for a filter test, $\big[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r\big]$, and why it narrows as the number of runs grows.

In that last one, $n$ is the number of things the filter estimates, $r$ is the number of independent runs, and $\chi^2_{rn}(0.025)$ (read "chi-square, r n, at 0.025") is the value that only $2.5\%$ of honest results fall below. For $n = 6$ and $r = 300$ the band is $[5.614,\ 6.398]$.

**The rejected alternative, with its result.** Not a description of the other option — its *numbers*. The table comparing a layered atmosphere model with a simple exponential one. The single-station tracking geometry's **[[condition number|condition-number]]** of $6\times10^{18}$ next to the four-station $4.3\times10^{5}$, with both convergence histories. This is the appendix's most valuable family. "Why did you not do X?" is the question most likely to be asked, and a figure answers it more decisively than anything you can say.

**The assumption and dispersion tables.** Every varied input, how it was varied, and what real-world failure it stands for. Every assumption the model makes. These are dull slides, and they end whole lines of questioning in one glance.

**The failure case.** The filter made overconfident on purpose, with a mean NEES (said "nees": a score for whether a filter's claimed uncertainty is honest) of $404.9$ against a ceiling of $6.398$ — about $63$ times too high. The fit that diverged. The infeasible cases. This family does double duty. It answers "how do you know your test can catch a problem?" And it is the raw material for the negative-result talk later in this module.

**The raw numbers behind a summary figure.** If the main deck shows a distribution, the appendix shows the table.

::: note Why the band gets narrower with more runs
Each run's score bounces around at random. Averaging $r$ runs cancels much of that bouncing, so the average sits closer to its true value of $n$. With more runs, an honest filter's average has less room to wander, so the range that holds it 95 times in 100 shrinks. Roughly, the width shrinks like $1/\sqrt{r}$: four times as many runs, half as wide a band. That is why a result from 300 runs is a much sharper test than one from 30.
:::

## The mechanics are worth rehearsing

None of this works if reaching the slide is slow. Two seconds of confident navigation reads as preparation. Twenty seconds of scrolling past eleven slides while talking over it reads as the opposite, and undoes the whole effect.

- **Number every appendix slide,** and make the first appendix slide a one-page **index** — a list of what is on each backup slide. Then any question can be turned into a slide number fast.
- **Know the [[jump to a slide|jump-keystroke]] in your software.** Most presentation software lets you type a slide number and press Enter, in presentation mode, without leaving it. Confirm that yours does, on the machine you will actually use, before the day.
- **Keep a printed index card** with the appendix numbers on it. This is the least technical item in the whole module, and it is the one that most reliably works.
- **Confirm who drives the deck.** You may present from your own laptop, a room computer, or a shared screen on a video call. That changes whether the jump you rehearsed will work. Ask the coordinator.

::: example The same question, with and without the appendix
The question, during anchor B's questioning: "You said the thrust lower limit is handled by lossless convexification. How do you know the relaxation was actually tight on the trajectories you solved — not only in theory?"

**Without.** "The theorem guarantees it for this problem class — the relaxed solution meets the original constraint exactly under the stated conditions. I did not check it directly on my own runs, but that is the result the formulation relies on."

This is not a bad answer. It is correct, it names the right result, and it will not lose the round. But it has given away exactly what the question was probing. The candidate has quoted a theorem instead of showing evidence from her own work. The follow-up writes itself: "So how would you know if your code broke one of the theorem's conditions?"

**With.** "Two ways. The theorem gives it under the stated conditions — and I checked it directly, because a theorem's conditions are something I can get wrong in code. Backup slide seven: the gap between the thrust size and the slack variable that bounds it, plotted for every returned trajectory. It sits at **[[solver tolerance|solver-tolerance]]** across the whole time history. So the inequality was active everywhere, and the relaxation was tight on my problems, not only in the paper's."

**What separates them.** Not confidence, and not knowledge — both candidates know the theorem. The second one treated the theorem as a claim to check in her own code, not a quote to lean on. She built the figure and expected the question. The appendix slide is the product of that habit. The habit is what is being scored.
:::

::: warning
An appendix is not a folder. Forty unsorted slides you cannot find your way through are worse than no appendix at all. They produce exactly the twenty-second scroll that looks unprepared. They usually mean the triage step was skipped: every figure that existed was kept, instead of only the ones that answer an expected question.

And never present the appendix. If the questioning ends early, stop. Walking the panel through backup slides nobody asked for turns your strongest asset into a talk that ran over.
:::

## Check yourself

::: check
State the triage rule for whether a question earns a backup slide. Apply it to two questions: "Why did you fix the final time?" and "What is the worst case across your dispersion set?"
:::

::: answer
A question earns a slide when its honest answer has to be seen rather than said — a table, a curve against a limit, a short derivation.

"Why did you fix the final time?" has a one-sentence answer: one solve instead of a search over many candidate final times, at the cost of a $4.0\%$ infeasible rate. No slide.

"What is the worst case across your dispersion set?" is answered by a distribution with both tails visible. Quoting one number aloud invites the follow-up question about the shape of the spread. That one gets a slide.
:::

::: check
Explain why an accurate appendix counts as evidence of technical depth, not only of being organized.
:::

::: answer
Building one requires knowing which of your own claims is easiest to attack. That is the same knowledge the round tests under technical depth and defending decisions.

A candidate who expected nine of the questions actually asked has shown an accurate picture of where her work is weak — and she showed it *before* being asked, not in reply. The neat slides are the visible product. The judgment about what to expect is the thing being scored.
:::

::: check
During rehearsal, your hostile reviewer never asks for any of your prepared backup slides. What does that tell you?
:::

::: answer
That the questions you expected are not the questions your work really provokes. Your picture of your project's weak points is off.

That is valuable to learn, not embarrassing. It is why the thirty-question exercise comes before building the appendix: the appendix should come from questions a real reader asks, not from whatever figures you happen to have made. The fix is to run the question-writing step again with someone who did not build the project.
:::

::: check
Give two reasons this lesson says never to present the appendix when the questioning ends early.
:::

::: answer
First, it throws away the appendix's whole advantage. Its value is that each slide arrives in answer to a question somebody actually asked. Shown unasked, it is only a talk that ran over, with extra slides.

Second, it spends the panel's time on material they did not ask for, and it ruins the clean ending. A talk that finishes, with a room that has run out of questions, is a strong outcome. Carrying on past it looks like not knowing when to stop.
:::

::: check
Why does this lesson treat navigation — slide numbers, an index, knowing the jump keystroke — as part of technical preparation, not as trivia?
:::

::: answer
Because the whole effect of the appendix depends on how fast you reach the slide. Two seconds of confident navigation shows you expected the question. Twenty seconds of scrolling past unrelated slides while narrating shows the opposite. It can leave the panel with a worse impression than answering from memory would have.

The work that made the slide is wasted if you cannot find it. So rehearsing the jumps, on the machine you will actually use, is part of preparing the content — not a separate chore.
:::

## Summary

| Item | Statement |
| --- | --- |
| What it is | An appendix after the final slide: derivations, rejected alternatives with their numbers, assumption and dispersion tables, the failure case, raw data |
| Where it comes from | The thirty anticipated questions, triaged |
| Triage rule | A slide only when the honest answer must be seen rather than said |
| Typical size | Ten to fifteen slides for a well-triaged project, plus a copy of the carrying diagram |
| Mechanics | Numbered slides, an index page, a printed card, a rehearsed jump keystroke, a confirmed machine |
| Why it scores | Expecting the question correctly proves you know where your own work is weakest |
| Never | Present it unasked, or let it become an unsorted folder of every figure you made |

The next lesson moves from the deck to the room: eight engineers, one of whom is asking, seven of whom are watching how you answer.

::: context appendix-word Where the word comes from
**Appendix** comes from Latin *appendere*, "to hang something on". A book's appendix hangs on after the last chapter: tables and details you can look up without having to read them in order. A slide appendix works the same way. It hangs off the end of the deck, after a clear "end" slide, and nobody sees it unless a question sends you there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2">
    <rect x="10" y="30" width="22" height="30"/><rect x="36" y="30" width="22" height="30"/>
    <rect x="62" y="30" width="22" height="30"/><rect x="88" y="30" width="22" height="30"/>
    <rect x="114" y="30" width="22" height="30"/><rect x="140" y="30" width="22" height="30"/>
    <rect x="166" y="30" width="22" height="30"/><rect x="192" y="30" width="22" height="30"/>
  </g>
  <line x1="222" y1="18" x2="222" y2="72" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <rect x="230" y="30" width="22" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.2">
    <rect x="256" y="30" width="22" height="30"/><rect x="282" y="30" width="22" height="30"/>
    <rect x="308" y="30" width="22" height="30"/><rect x="334" y="30" width="22" height="30"/>
  </g>
  <text x="112" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">main talk: 8 slides, shown</text>
  <text x="222" y="14" font-size="11" fill="#b4232c" text-anchor="middle">end</text>
  <text x="241" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">index</text>
  <line x1="241" y1="62" x2="241" y2="97" stroke="#1f2a44" stroke-width="1"/>
  <text x="306" y="88" font-size="12" fill="#1f2a44" text-anchor="middle">backups A1, A2, ...</text>
</svg>
```

The main talk is shown in order. The index and the backups sit behind the red line and are reached only by jumping.
:::

::: context triage-word Sorting by what the answer needs
**Triage** comes from the French *trier*, "to sort". Emergency doctors use it for deciding who needs care first. Here it sorts questions by one test: does the honest answer have to be *seen*?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="8" width="140" height="30" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="28" font-size="12" fill="#1f2a44" text-anchor="middle">one of the 30 questions</text>
  <line x1="180" y1="38" x2="180" y2="54" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="54" width="200" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="74" font-size="12" fill="#1f2a44" text-anchor="middle">must the answer be seen?</text>
  <line x1="130" y1="84" x2="80" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="84" x2="280" y2="108" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="96" y="100" font-size="11" fill="#1d6fd1" text-anchor="end">yes</text>
  <text x="264" y="100" font-size="11" fill="#6c7a93" text-anchor="start">no</text>
  <rect x="10" y="108" width="140" height="34" rx="6" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="130" font-size="12" fill="#fff" text-anchor="middle">backup slide</text>
  <rect x="210" y="108" width="140" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">rehearsed sentence</text>
</svg>
```

Both branches need preparing. The "no" branch is not "skip it" — it is "practice the sentence".
:::

::: context lossless-convexification The trick behind anchor B
Computers solve one family of problems, called **convex** problems, quickly and reliably. A landing burn almost fits, except for one rule: a real engine cannot throttle down to zero, so its thrust has a *minimum* as well as a maximum. That minimum breaks convexity. **Lossless convexification** swaps the thrust size for a helper number, the slack, that is allowed to be a little larger than the thrust. A theorem proves that the best answer always has the two exactly equal, so nothing is lost. That is what "tight" means, and it is why checking the gap on your own runs is a real test. You will meet the full method in the convex guidance module.
:::

::: context gravity-gradient-bound The pencil that twists itself
Hold a pencil tilted high above Earth. Its lower end is a little closer to Earth, so gravity pulls it a little harder, and the pencil twists toward hanging straight down. That twist on a satellite is the **gravity-gradient torque**. The bound $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$ gives its worst case: $\mu$ ("mu", said "myoo") is Earth's gravity constant, $r$ the distance from Earth's center, and the $I$ values measure how the satellite's mass is spread out. Anchor E found $4.226\times10^{-7}\,\mathrm{N\,m}$ both by brute-force search and by this formula — two methods agreeing is exactly what a backup slide can show.
:::

::: context condition-number A wobbly table, in one number
A **condition number** says how much a small error in the data can be magnified in the answer. Near $1$ is a steady table; $4.3\times10^{5}$ is still workable. A computer stores numbers to about 16 digits, so a condition number beyond about $10^{16}$ means some part of the answer is pure rounding noise. On a log scale — each step is ten times bigger — the two tracking setups are far apart:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="110" x2="20" y2="116"/><line x1="100" y1="110" x2="100" y2="116"/>
    <line x1="180" y1="110" x2="180" y2="116"/><line x1="260" y1="110" x2="260" y2="116"/>
    <line x1="340" y1="110" x2="340" y2="116"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="130">1</text><text x="100" y="130">10⁵</text><text x="180" y="130">10¹⁰</text>
    <text x="260" y="130">10¹⁵</text><text x="340" y="130">10²⁰</text>
  </g>
  <rect x="20" y="30" width="90" height="22" fill="#1d6fd1"/>
  <text x="116" y="46" font-size="12" fill="#1f2a44">four stations: 4.3 × 10⁵</text>
  <rect x="20" y="66" width="300" height="22" fill="#b4232c"/>
  <text x="170" y="82" font-size="12" fill="#fff" text-anchor="middle">one station: 6 × 10¹⁸</text>
  <line x1="276" y1="20" x2="276" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="272" y="16" font-size="11" fill="#6c7a93" text-anchor="end">rounding limit ≈ 10¹⁶</text>
</svg>
```
:::

::: context jump-keystroke Getting there in two seconds
In slideshow mode, PowerPoint and Keynote both let you type a slide number and press Enter to jump straight there, without showing the audience the editing view. Other tools, and some video-call screen shares, behave differently — which is why the lesson says to test it on the actual machine. A related habit: put a small, readable number in a corner of every backup slide, so when you land on the right one, you can see at a glance that you did.
:::

::: context solver-tolerance When a computer says "close enough"
A numerical **solver** does not find an exact answer in one step. It improves a guess again and again and stops when the improvement is smaller than a chosen size, its **tolerance** — often around a millionth or smaller. So "the gap sat at solver tolerance" means the gap was as close to zero as the solver was ever trying to get: zero, for every practical purpose. Compare the re-simulation check in the triage table, $4\times10^{-12}\,\mathrm{m}$. An atom is about $10^{-10}\,\mathrm{m}$ across, so that disagreement is about one twenty-fifth of an atom.
:::
