---
id: l07-the-backup-appendix
title: "The appendix that makes a hard question look expected"
minutes: 16
covers:
  - "the backup-slide appendix for anticipated questions"
---

The previous lesson cut your talk down to eight or ten slides, which raises an obvious objection: the material you removed was not worthless. The dispersion table, the derivation, the rejected alternative's actual numbers, the case that failed — all of that is real evidence, and throwing it away to make the clock work would be a strange kind of discipline.

It does not get thrown away. It goes into an appendix that sits after your final slide, and it changes what happens during the questioning. A hard question answered from memory is a good answer. The same question answered by turning directly to a slide that already contains the figure is a different event entirely: it tells the panel that you knew this question was coming, which means you have an accurate model of where your own work is weakest.

::: key
Backup slides are an appendix after the final slide containing the derivations, alternative results and detail that would clutter the main talk. Turning straight to a backup slide when asked is one of the strongest possible signals of preparation.
:::

## Why it reads as strongly as it does

It is worth being precise about the mechanism, because it is not showmanship and it does not work if it is treated as such.

Anticipating a question correctly requires knowing which of your claims is the most attackable. That is the same knowledge the round is testing on two of its four axes — technical depth and defending decisions — so a correctly prepared appendix is direct evidence of the thing being evaluated, not merely a convenience. A candidate who has eleven backup slides and gets asked about nine of them has demonstrated, without saying so, that they have looked at their own project the way a critic would.

The converse is also true and worth stating plainly: an appendix full of slides nobody ever asks about means the questions you expected were not the questions your work actually provokes. That is useful information during rehearsal, and it is the reason the thirty-question exercise comes before the appendix is built rather than after.

## Building it from the thirty questions

The module's own exercise asks for thirty questions: the hardest a panel of GNC engineers could ask about your chosen project, including at least five that attack the validity of your approach and at least three about your personal contribution, each with a two-sentence answer, and a note on which ones need a backup slide.

That last note is the triage, and it has a single rule.

**A question earns a backup slide when its honest answer is something that has to be seen rather than said.** A number in a table, a curve against a threshold, four lines of algebra, a distribution. If the honest answer is a sentence — and many of the best answers are one sentence — then a slide adds nothing and costs you a navigation.

::: example Triage, on eight of the thirty questions for anchor project B
| Question | Honest answer | Slide? |
| --- | --- | --- |
| Why fix the final time? | One solve instead of a line search over candidate times; it cost a $4.0\%$ infeasible rate | No — this is a sentence |
| How do you know the lossless-convexification relaxation was tight on your solutions? | The gap between thrust magnitude and its slack variable, over every returned trajectory, sat at solver tolerance | Yes — a plot of that gap against time |
| What is in the dispersion set, and what distributions? | Initial altitude and velocity, normal, with stated standard deviations | Yes — a small table |
| What is the worst case, not the mean? | The cost ranged from $248.2$ to $262.4\,\mathrm{m/s}$ across the feasible cases | Yes — the histogram, with both tails visible |
| Did you verify the dynamics constraints inside the solver? | Yes: forward-propagating the returned control independently reproduced the solver's own states to $4\times10^{-12}\,\mathrm{m}$ | Yes — the residual plot, because the number is the claim |
| Why did the objective barely move with altitude dispersion? | Because $\int u\,dt = (v_f-v_0)+g\,t_f$ for any feasible trajectory, which has no altitude term | Yes — the three lines of algebra |
| What did you write and what did a solver do? | The formulation, discretisation and constraint checks are mine; the cone program is solved by a library | No — a sentence, and it is already on the carrying diagram |
| Would this run onboard? | I have not measured solve time against a flight processor's budget | No — and see the lesson on saying so |

Eight questions, five slides. Extrapolated over thirty, an appendix in the range of ten to fifteen slides is normal for a well-triaged project. Add one more — a duplicate of the carrying diagram — so you can return to it during questioning without walking backwards through the main deck.
:::

## What belongs in it, by category

**The derivation you compressed.** Anything you asserted in the talk because deriving it would have cost ninety seconds. The identity that fixes the fuel-proxy objective from the velocity boundary conditions alone; the closed-form worst-case gravity-gradient bound $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$ that confirmed the numerical scan; the chi-square acceptance band $\big[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r\big]$ and why it narrows with the number of runs.

**The rejected alternative, with its result.** Not a description of the alternative — the numbers. The layered-versus-exponential atmosphere table. The single-station geometry's condition number of $6\times10^{18}$ next to the four-station $4.3\times10^{5}$, with both convergence histories. This is the appendix's highest-value category, because "why did you not do X" is the question most likely to be asked and the one a figure answers most decisively.

**The assumption and dispersion tables.** Every dispersed parameter, its distribution, and the failure mechanism it represents. Every assumption the model makes. These are dull slides and they end whole lines of questioning in one glance.

**The failure case.** The deliberately overconfident filter, at mean NEES $404.9$ against a ceiling of $6.398$. The fit that diverged. The infeasible cases. This category does double duty: it answers "how do you know your test has power," and it is the raw material for the negative-result talk covered later in this module.

**The raw numbers behind a summary figure.** If the main deck shows a distribution, the appendix shows the table.

## Mechanics, which are worth rehearsing

None of this works if reaching the slide is slow. Two seconds of confident navigation reads as preparation; twenty seconds of scrolling past eleven slides while talking over it reads as the opposite and undoes the effect entirely.

- **Number every appendix slide** and put a one-page index as the first slide of the appendix, so a question can be converted into a number quickly.
- **Know the jump mechanism in your tool.** Most presentation software accepts a slide number typed followed by Enter, in presentation mode, without leaving it. Confirm that yours does, on the machine you will actually use, before the day.
- **Keep a printed index card** with the appendix numbers on it. This is the least technical item in the whole module and it is the one that most reliably works.
- **Confirm who drives the deck.** Whether you present from your own machine, a room machine, or a shared screen on a video call varies, and it changes whether the jump mechanism you rehearsed is available. Ask the coordinator.

::: example The same question, with and without the appendix
The question, during anchor B's questioning: "You said the thrust lower bound is handled by lossless convexification. How do you know the relaxation was actually tight on the trajectories you solved, rather than in theory?"

**Without.** "The theorem guarantees it for this problem class — the relaxed solution satisfies the original non-convex constraint with equality under the stated conditions. I did not check it directly on my own runs, but that is the result the formulation relies on."

This is not a bad answer. It is correct, it names the right result, and it will not lose the round. But it has conceded exactly the thing the question was probing: the candidate has cited a theorem rather than evidence from her own work, and the follow-up writes itself.

**With.** "Two ways. The theorem gives it under the stated conditions — and I checked it directly, because a theorem's conditions are something I can get wrong in an implementation. Backup slide seven: the gap between the thrust magnitude and the slack variable it is bounded by, plotted for every returned trajectory. It sits at solver tolerance across the whole time history, so the inequality was active everywhere and the relaxation was tight on my problems, not only in the paper's."

**What separates them.** Not confidence, and not technical knowledge — both candidates know the theorem. The second one treated the theorem as a claim to be verified in her own implementation rather than a citation to rest on, built the figure, and anticipated being asked. The appendix slide is the artefact of that habit; the habit is what is being scored.
:::

::: warning
An appendix is not a folder. Forty unsorted slides you cannot navigate is worse than no appendix at all, because it produces exactly the twenty-second scroll that reads as unpreparedness, and it usually means the triage step was skipped — every figure that existed was kept rather than the ones that answer an anticipated question. And never present the appendix: if the questioning ends early, stop. Walking the panel through backup slides unprompted converts your strongest asset into an overrun talk.
:::

## Check yourself

::: check
State the triage rule for whether a question earns a backup slide, and apply it to these two: "why did you fix the final time?" and "what is the worst case across your dispersion set?"
:::

::: answer
A question earns a slide when its honest answer is something that has to be seen rather than said — a table, a curve against a threshold, a short derivation. "Why did you fix the final time?" is answered in one sentence: one solve rather than a line search over candidate final times, at the cost of a $4.0\%$ infeasible rate. No slide. "What is the worst case across your dispersion set?" is answered by a distribution with both tails visible, and quoting a single number aloud invites the follow-up about the shape; that gets a slide.
:::

::: check
Explain the mechanism that makes an accurate appendix read as evidence of technical depth rather than as mere organisation.
:::

::: answer
Building one requires knowing which of your own claims is most attackable, which is the same knowledge the round tests under technical depth and defending decisions. A candidate who anticipated nine of the questions actually asked has demonstrated an accurate model of where their work is weak, and they demonstrated it before being asked rather than in response. The organisation is the visible artefact; the judgement about what to anticipate is the thing being scored.
:::

::: check
What does it tell you, during rehearsal, if none of your prepared backup slides is ever requested by your hostile reviewer?
:::

::: answer
That the questions you anticipated are not the questions the work actually provokes — your model of your project's weak points is miscalibrated. This is valuable rather than embarrassing, and it is the reason the thirty-question exercise is meant to precede building the appendix: the appendix should be derived from questions a real reader generates, not from the figures you happen to have made. The repair is to re-run the question-generation step with someone who did not build the project.
:::

::: check
Give two reasons this lesson says never to present the appendix when questioning ends early.
:::

::: answer
First, it converts the appendix's entire advantage into a liability: its value is that each slide arrives in response to a question somebody actually asked, and material shown unprompted is just an overrun talk with extra slides. Second, it burns the time the panel had allocated for the round on content they did not request, and it removes the clean ending — a talk that finishes and a room that has run out of questions is a strong outcome, and continuing past it reads as not knowing when to stop.
:::

::: check
Why does this lesson treat navigation mechanics — slide numbers, an index, knowing the jump keystroke — as part of the technical preparation rather than as trivia?
:::

::: answer
Because the entire effect of the appendix depends on the speed of reaching the slide. Two seconds of confident navigation demonstrates that the candidate expected the question; twenty seconds of scrolling past unrelated slides while narrating demonstrates the opposite and can leave the panel with a worse impression than answering from memory would have. The preparation that produced the slide is wasted if the retrieval fails, so rehearsing the jumps on the machine you will actually use is part of preparing the content, not separate from it.
:::

## Summary

| Item | Statement |
| --- | --- |
| What it is | An appendix after the final slide: derivations, rejected alternatives with their numbers, assumption and dispersion tables, the failure case, raw data |
| Where it comes from | The thirty anticipated questions, triaged |
| Triage rule | A slide only when the honest answer must be seen rather than said |
| Typical size | Ten to fifteen slides for a well-triaged project, plus a copy of the carrying diagram |
| Mechanics | Numbered slides, an index page, a printed card, a rehearsed jump keystroke, a confirmed machine |
| Why it scores | Anticipating the question correctly proves you know where your own work is weakest |
| Never | Present it unprompted, or let it become an unsorted folder of every figure you made |

The next lesson moves from the deck to the room: eight engineers, one of whom is asking, seven of whom are watching how you answer.
