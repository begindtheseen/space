---
id: l09-why-not-x-and-your-contribution
title: "Why did you not do X, and what did you actually do"
minutes: 26
covers:
  - "answering why did you not do X and what was your actual contribution"
---

Two questions arrive in every past-project round. The first is some form of "why did you not do X," where X is an alternative the questioner knows well. The second is "what was your actual contribution," which arrives on every team project and, in a different costume, on every solo one too.

They test different things. The first tests whether you made a decision or merely made a choice. The second tests whether the work in front of the panel is evidence about you. Both have a shape that works, both have several shapes that do not, and both are worth rehearsing out loud until the shape is automatic — because the failure mode in each case is an instinctive reaction, and instinct is what you fall back on when eight people are looking at you.

## Why did you not do X

::: key
Answering "why did you not do X": never defensively. State that you considered X, give the specific reason you rejected it, and say what would have changed your mind. If you genuinely did not consider it, say so and then reason about it live.
:::

Three parts, in order. **Considered** — you looked at the alternative. **Criterion** — the specific reason it lost, ideally with a number or a mechanism rather than a preference. **Reversal** — the condition under which you would have chosen it instead. The third part is the one candidates omit and the one that does most of the work, because a decision with no stated reversal condition is indistinguishable from a habit.

The four ways the answer goes wrong are all instinctive.

**Defensive.** "My approach was the right one for this problem." Treated as an attack, answered as an attack. It signals that you never evaluated the alternative, because somebody who had would have an actual comparison to offer.

**Dismissive.** "That would have taken too long." A cost claim with no number in it. If the alternative costs more, say how much more and in what currency — solves, weeks, sample points, lines of code you would have had to verify.

**Capitulating.** "You are right, I should have done that." Sometimes the alternative genuinely is better, and conceding is correct — but a bare concession skips the engineering. If X is better, say under what conditions it is better and what it would have cost, which is the same three-part answer with the sign flipped.

**Bluffing.** Inventing a reason you did not actually have at the time. This is the only one of the four that is disqualifying rather than merely weak, and a room of domain experts detects it quickly, because the invented reason will not survive the follow-up that asks for the number behind it.

::: example "Why did you not use an unscented filter?" — anchor project C
**Weak.** "The EKF was accurate enough for what I needed, and UKFs are really for highly nonlinear systems. My results were good, so I did not see a reason to change."

Three problems in two sentences: "accurate enough" with no threshold, a textbook generality standing in for an analysis of this system, and "my results were good" offered as the reason for a design decision that was made before any results existed.

**Strong.** "I considered it. The criterion I used is where the linearisation actually hurts, which is when the state uncertainty is comparable to the scale over which the nonlinearity curves. Here the attitude uncertainty is on the order of the star-tracker noise, $5\times10^{-5}\,\mathrm{rad}$, and the attitude kinematics curve on a scale of order one radian, so the ratio is about $5\times10^{-5}$ — the map is very nearly linear across the region the covariance actually occupies. Against that, the unscented transform costs $2n+1 = 13$ sigma points propagated per step for a six-state filter. I did not think the cost bought anything measurable, and the consistency result supports that after the fact: if the linearisation were distorting the covariance, NEES would show it, and mean NEES came out at $6.067$ inside a band of $[5.614,\,6.398]$.

What would change my mind is coarse acquisition. If the filter has to start from tens of degrees of initial attitude error rather than tens of microradians, the ratio is order one, the linearised covariance is wrong, and I would either use an unscented filter or run a separate coarse-alignment stage first."

**What separates them.** The strong answer has a criterion that is about this system rather than about filters in general, a number on both sides of the comparison, an after-the-fact check that the decision was sound, and a stated regime where the answer flips. It is also not defensive anywhere: the alternative is treated as a reasonable thing to have considered, because it was.
:::

::: example "Why a batch fit rather than a sequential filter?" — anchor project D
**Weak.** "Batch least squares is the standard approach for orbit determination from a tracking arc, so that is what I implemented."

Appeal to convention. It may even be true, and it tells the panel nothing about whether this candidate knows why the convention exists.

**Strong.** "I considered a sequential filter and rejected it for a specific reason: the arc is fixed and processed after the fact, so I do not need a recursive estimate, and a filter would have required me to specify a process-noise model that I had no basis for choosing. Batch gives me a covariance that comes only from the measurement noise and the geometry, which is what made it checkable — I re-ran 400 independent fits and the empirical scatter matched the formal $\hat{\mathbf P}$ to within about $8\%$ on every component. With an invented process noise in the loop I could not have made that comparison cleanly, because a mis-specified process noise would have shown up in exactly the same place as a covariance bug.

What would change my mind is unmodelled dynamics. My dynamic model is deterministic, so anything it does not capture — drag variation over the arc, for instance — gets absorbed into the estimated state instead of being carried as uncertainty. If the arc were long enough for that to matter, I would want either a filter with process noise or a batch fit with consider parameters, and the diagnostic that would tell me is a structured trend in the post-fit residuals rather than the flat noise I actually saw."

**What separates them.** The rejected alternative is named with the specific thing it would have forced on her, the choice is connected to a verification result it made possible, and the reversal condition comes with the diagnostic that would detect it. That last clause is the tell of somebody who has actually looked at residuals.
:::

### When you genuinely did not consider it

This happens, it is not a failure, and the honest answer is far stronger than an invented one — provided you do the second half.

The shape is: say you did not consider it; say what the alternative would buy, which shows you know what it is for; say whether you think it would bite here and why; and name the measurement that would settle it. You are reasoning live, which is one of the more useful things a panel can watch you do.

> "Why did you not use a square-root formulation for the covariance?"
>
> "I did not consider one. What a square-root form buys you is numerical: it propagates a factor of the covariance so the covariance cannot lose positive-definiteness through finite-precision arithmetic. Whether that bites depends on conditioning, and with six states in double precision and a measurement noise that is not small compared with the state uncertainty, I would be mildly surprised if it did. But I am guessing, and I do not need to — the diagnostic is sitting in the Monte Carlo I already ran. The minimum eigenvalue of $\mathbf P$ across every step of every one of the 300 runs would tell me directly whether it ever came near losing rank. That is an afternoon, and I would want the number before claiming either way."

Nothing there is a bluff, and nothing is an apology. The candidate has demonstrated that she knows what the alternative is for, has a view about whether it applies, knows her view is unverified, and can name the experiment.

## What was your actual contribution

::: key
The contribution question — "what was your actual contribution" — is asked on every team project. Answer with specifics: what you designed, implemented, decided and verified, and name what others did. Inflation is detected easily and ends the round.
:::

Four verbs: designed, implemented, decided, verified. A contribution statement that uses all four is specific enough to be checked, which is exactly why it is persuasive. The two failure modes sit on either side of it.

**Blanket "we".** "We built a momentum-management system for the satellite." Nothing in that sentence is assessable. A candidate who says "we" throughout a thirty-minute defence has made their own contribution invisible, which is the opposite of what the round needs — and it is often done out of modesty, which makes it painful to watch.

**Inflation.** Claiming ownership of decisions that were somebody else's. This is not detected by intuition; it is detected by follow-ups, and the mechanism is worth understanding because it explains why inflation is a bad bet even when it is only slight. Each follow-up asks for a decision one level below the last. Somebody who made the decision has the reason immediately, because they had to have it at the time. Somebody who did not has to generate a plausible reason on the spot — and the second invention has to be consistent with the first, and the third with both. Three levels down, the inventions start to contradict each other, and what the panel now has is not a question about scope but a question about honesty.

::: example A contribution statement on a team project, three ways
The project: a university CubeSat ADCS, five people, flown.

**Blanket we.** "We designed the attitude control system, sized the wheels and magnetorquers, and validated it in a hardware-in-the-loop rig before flight."

True, unassessable, and it gives the panel no reason to believe any of it was hers.

**Inflated.** "I led the ADCS subsystem, designed the control architecture, and drove the hardware validation campaign."

If she was one of two people working on momentum management and somebody else owned the architecture, this collapses on the second follow-up — "what drove the control bandwidth choice?" — and it collapses in a way that reframes everything else she has said.

**Strong.** "I owned momentum management. I designed the momentum budget: the worst-case gravity-gradient bound of $4.226\times10^{-7}\,\mathrm{N\,m}$ from a numerical scan over body attitudes, cross-checked against the closed form $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$, and the one-orbit secular accumulation of $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ that followed. I decided the wheel size from that budget, and the desaturation margin of about $11.8$ is the number I defended it with. I implemented the dumping law in flight software and I verified it against a perturbed environment — misaligned torquer, field magnitude off by $10\%$ — rather than only the nominal one. What I did not do: the attitude determination side is Priya's, including the sun-sensor calibration that the whole pointing budget depends on, and the hardware-in-the-loop rig was built by two people on the avionics team. I would say the same thing with all three of them in the room."

**What separates them.** Every claim in the strong version names a specific artefact or number that could be checked. The credit given to others is not a courtesy — it is what makes the rest believable, because a candidate willing to hand away the parts that were not theirs is more credible about the parts that were. And the final sentence is the test the module's own exercise sets: you would be comfortable saying it with your teammates present.
:::

### The solo-project version of the same question

On a project you built alone, the contribution question does not disappear. It arrives as the library boundary: what did you write, and what did something else do for you?

::: example "What did you actually write?" — anchor project B
**Weak.** "I wrote all of it from scratch."

Almost certainly false, in a way the panel can check in ten seconds by asking what solved the cone program. It also gives away a free opportunity, because the interesting answer is not the list of what you wrote but the judgement about which part mattered.

**Strong.** "The formulation is mine: the cost, the constraint set, the lossless-convexification slack variable and the discretisation into forty nodes. The verification is mine — the independent re-simulation of the returned control, which reproduced the solver's own states to $4\times10^{-12}\,\mathrm{m}$, the closed-form check on the objective, and the constraint check on every returned trajectory. The dispersion campaign is mine. The cone program itself is solved by a library, and the linear algebra is NumPy. The part I would defend as the actual engineering is the discretisation and the tightness check, because that is where a sign error produces a trajectory that looks completely plausible and is wrong — the solver cannot catch that for me, since it happily returns an optimal answer to whatever problem I actually handed it."

**What separates them.** The strong answer draws the boundary honestly and then says which side of it the judgement lived on. It also pre-empts a follow-up about solver trust, which is the natural next question for anyone who has been burned by an optimisation that converged to the wrong problem.
:::

::: warning
Under-claiming is not the safe direction. Candidates who fear sounding boastful default to "we" and to passive constructions — "it was decided that", "the gains were tuned" — and the result is a thirty-minute defence in which nothing can be attributed to the person defending it. The round exists to gather evidence about you. Precision is the goal in both directions: a contribution statement that is specific, checkable, and generous about others is simultaneously the most honest version and the most persuasive one.
:::

## Check yourself

::: check
State the three parts of a strong answer to "why did you not do X," and explain what is lost when the third part is omitted.
:::

::: answer
You considered it; the specific criterion on which it lost, with a number or a mechanism; and the condition under which you would have chosen it instead. Without the third part, a stated reason is indistinguishable from a rationalisation of a habit: it explains what you did but not that you were genuinely weighing something. The reversal condition is also the part that demonstrates you understand the alternative's actual domain of advantage rather than only a reason to avoid it.
:::

::: check
A candidate answers "that alternative would have taken too long." Diagnose the weakness and repair it.
:::

::: answer
It is a cost claim with no number, so it cannot be evaluated and reads as a dismissal rather than a decision. The repair is to state the cost in the currency that actually applied: a free final time requires a line search with one convex solve per candidate time against a single solve for the fixed-time formulation, or an unscented filter requires $2n+1 = 13$ sigma-point propagations per step for a six-state system. With the number present, the panel can agree or disagree with the tradeoff — which is the conversation you want, since it is about engineering rather than about your attitude to the question.
:::

::: check
A panel member asks about an alternative you have genuinely never considered. Give the four-part shape of an honest answer and say why it is stronger than a plausible-sounding invented reason.
:::

::: answer
Say you did not consider it; state what the alternative buys, which shows you know what it is for; give your view on whether it would bite in this case and why; and name the measurement that would settle the question. It is stronger than an invented reason because the invention has to survive a follow-up asking for the number behind it, and it will not — whereas the honest version demonstrates live reasoning, which the panel can watch, and ends with a concrete experiment, which is what a colleague would actually propose.
:::

::: check
Explain the mechanism by which an inflated contribution claim is detected, and why it is a bad bet even when the inflation is small.
:::

::: answer
Follow-up questions descend one decision level at a time. Somebody who made a decision has its reason available immediately because they needed it at the time; somebody who did not has to invent one, and each subsequent invention must stay consistent with the earlier ones. Two or three levels down, the inventions begin to conflict, and at that point the panel's question is no longer about the scope of your role but about your honesty — which is a far more damaging finding than a modest contribution would have been. Small inflations are a bad bet for the same reason: they are questioned by the same mechanism, and the downside is not proportional to the size of the exaggeration.
:::

::: check
Why does naming what teammates did make your own contribution more believable rather than less impressive?
:::

::: answer
Because it makes the whole statement checkable and it demonstrates a willingness to give away what was not yours. A statement that claims everything provides no evidence of discrimination between your work and others', so a panel has to discount all of it; a statement that hands specific, substantial pieces to named colleagues shows you are drawing the line carefully, which makes the claims on your side of the line credible. The practical test is whether you would say the same sentences with those teammates in the room.
:::

::: check
Give the solo-project form of the contribution question, and say what makes a strong answer different from a complete inventory of what you wrote.
:::

::: answer
On a solo project it arrives as the library boundary: what did you write, and what did a library do for you. A strong answer draws the boundary honestly and then goes one step further, naming which part of the work carried the actual engineering judgement — for instance the discretisation and the relaxation-tightness check in a convex guidance project, because that is where an error produces a plausible-looking and wrong trajectory that the solver cannot detect on your behalf. An inventory tells the panel what you touched; the extra step tells them where you think the risk was, which is the more informative claim.
:::

## Summary

| Question | Shape of a strong answer |
| --- | --- |
| Why did you not do X | Considered it; the criterion it lost on, with a number or mechanism; the condition that would reverse the decision |
| X you never considered | Say so; what X buys; whether it bites here and why; the measurement that would settle it |
| Failure modes | Defensive, dismissive with no number, capitulating without analysis, bluffing |
| Contribution, team project | What you designed, implemented, decided and verified — plus what named others did |
| Contribution, solo project | The library boundary, plus which part carried the engineering judgement |
| Why inflation fails | Follow-ups descend a level at a time; invented reasons start contradicting each other |
| Why under-claiming fails | Blanket "we" and passive voice make your contribution unassessable, which is what the round exists to assess |

The next lesson takes the question nobody prepares for, because preparing for it feels like planning to fail: the one you cannot answer.
