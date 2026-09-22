---
id: l11-the-negative-result
title: "The talk about the thing that did not work"
minutes: 17
covers:
  - "talk structure: problem, why it was hard, approach, the key decision and the alternatives rejected, verification, result, what you would do differently"
---

More engineering projects end without a clean positive result than with one. A method turns out not to work in the regime you needed, a campaign runs out of time at three hundred cases of a planned thousand, a formulation that looked right produces an answer you cannot trust. This is the ordinary texture of technical work, and yet almost nobody puts one of these on a submission list, because "it did not work" sounds like a confession rather than a topic.

Handled properly, it is the most convincing talk in the set, and the reason is precise rather than motivational. A positive result can be produced by luck, by following somebody else's recipe, or by a bug that happens to generate a plausible-looking plot. A negative result cannot be reported at all by somebody who is unable to rule out the obvious alternative explanation — that they made a mistake. The bar for defending a negative result is *higher* than for a positive one, and clearing it demonstrates exactly what the round is trying to measure.

The same seven-part structure carries this talk. Three of the parts change weight.

::: key
For a negative or unfinished result the structure is unchanged — problem, why it was hard, approach, key decision and rejected alternatives, verification, result, what you would do differently — but three parts shift: "why it was hard" becomes the prediction you started with, verification expands to become the centre of the talk, and the result is stated as a property of the system with the scope in which it holds.
:::

## The first thing the panel thinks is that you made a mistake

That is not scepticism about you; it is the correct prior. Most of the time, when a standard method fails on a standard problem, the implementation is wrong. Your talk's job is to eliminate that hypothesis, and everything else follows from it.

Which means the separation that matters most in this kind of talk is between two claims that sound similar and are completely different.

**"The system does not do this."** A property of the problem, independent of who implements it. This is the strong form, and it is provable.

**"I could not make it do this."** A statement about your attempt. It is still presentable, and it is only interesting to the degree that you can say what you ruled out along the way.

Conflating them is the characteristic failure of a failure talk. Claiming the first when you have only established the second is over-claiming of the kind a panel will find in two questions; retreating to the second when you have actually established the first throws away your own result.

::: example Anchor project D, presented as a negative result
**Problem.** Recover a four-state arc — position and velocity in a local frame — from range-only measurements to a single fixed tracking station over a $300\,\mathrm{s}$ pass.

**The prediction.** Gauss-Newton on the normal equations is the standard tool for this, the measurement model is smooth, the noise is well behaved at $50\,\mathrm{m}$, and I expected convergence in a handful of iterations.

**Approach.** Linearise the range model, solve $\mathbf H^{\mathsf T}\mathbf H\,\Delta\mathbf x = \mathbf H^{\mathsf T}\mathbf r$, step, repeat.

**What happened.** It diverged by the second iteration. The velocity components jumped to physically absurd values and the normal matrix went numerically singular.

**Verification — the centre of the talk.** Two independent results eliminate the hypothesis that my implementation is broken. First, the condition number of $\mathbf H^{\mathsf T}\mathbf H$ evaluated at the *true* state, before any fitting at all: $\mathrm{cond}\approx6\times10^{18}$, with the smallest singular value of $\mathbf H$ itself around $3\times10^{-15}$. That is a statement about the geometry, computed without running the solver, so it cannot be an artefact of my iteration, my initial guess, or my step logic. Second, the identical code, unchanged, run against a four-station geometry: $\mathrm{cond}\approx4.3\times10^{5}$, and the fit converges cleanly, with RMS residual falling $120{,}131 \rightarrow 2{,}605 \rightarrow 62.0 \rightarrow 45.5\,\mathrm{m}$ against the $50\,\mathrm{m}$ noise floor. Together those two rule out the solver and point at the problem.

**Result, stated with its scope.** For this trajectory and this single-station geometry, one direction of the state is unobservable from range alone — not poorly determined, unobservable to within numerical precision — and no estimator of any kind recovers it from this data. Stations at distinct bearings restore observability, and the restoration is quantifiable: thirteen orders of magnitude of conditioning.

**What I would do differently.** Compute the conditioning before fitting, always, as a precondition rather than a diagnostic. I spent an afternoon debugging an implementation that was never broken, and the check that would have told me costs one line.
:::

Read that outline against the four evaluation axes. Technical depth: an observability argument with two independent confirmations. Communication clarity: a claim with a stated scope. Simplicity: the diagnosis is one condition number, not an elaborate investigation. Defending decisions: the candidate can say exactly why she believes the problem is the geometry rather than her code, and what would change her mind. A talk about a fit that worked first time contains none of this.

::: warning
A negative result with no verification behind it is indistinguishable from a bug, and a panel will treat it as one — correctly. "It did not converge" on its own is not a finding. What makes it a finding is the evidence that rules out the explanations other than the one you are claiming: a diagnostic computed independently of the failing run, the same code succeeding on a case where it should succeed, an analytic argument for why the failure was expected. At least two, ideally independent.
:::

## The project that did not finish

The second shape this talk takes is a project that was going fine and stopped — the campaign at 120 cases of a planned 500, the implementation with two of three constraint types coded, the hardware test that never got hardware.

The move here is to stop treating the project as incomplete and start treating it as a claim with a stated confidence. Incompleteness is not an absence of a result; it is a result with wider error bars, and the wider bars can be computed.

::: example A campaign stopped at 120 of 500 cases
The campaign was planned at 500 dispersed cases with a pass criterion fixed in advance. It stopped at 120, all of which passed.

**Weak, the over-claim.** "The Monte Carlo showed no failures." True and misleading, because it invites the reader to supply their own idea of how strong that evidence is, which will be stronger than the data supports.

**Weak, the abandonment.** "The campaign is incomplete, so I do not have results from it yet." This discards a genuine result. One hundred and twenty clean cases is evidence; refusing to characterise it is not modesty, it is leaving the analysis undone.

**Strong.** "One hundred and twenty of a planned five hundred cases, all passing. With zero failures in $n$ trials, the one-sided $95\%$ upper confidence bound on the failure probability is $1-0.05^{1/n}$, which at $n=120$ is $\approx0.0247$ — so the campaign supports a failure rate below about $2.5\%$, at $95\%$ confidence. It does not support the number I was aiming for: the full 500 cases would have given $1-0.05^{1/500}\approx0.00597$, below about $0.6\%$. The useful approximation is the rule of three, $3/n$, which gives $3/120 = 0.025$ and $3/500 = 0.006$ — close enough to the exact values to do in your head. So the honest statement is that the requirement is met to within a factor of four of the confidence I wanted, and finishing the campaign is a compute cost rather than a modelling question."

**What separates them.** The strong version converts an unfinished campaign into a quantified claim, states precisely what it does and does not support, and identifies what the remaining work actually is. It also demonstrates something the completed campaign would not have: that the candidate knows what a zero-failure result is worth, which is a question a surprising number of people with finished Monte Carlos cannot answer.
:::

## The project you stopped on purpose

The third shape is a project abandoned by decision rather than by circumstance — you concluded it was the wrong thing to build and stopped. This is presentable, and it is governed by the same rule as every other decision in this round: it needs a criterion.

"I stopped because I lost interest" is not a criterion. "I stopped when the dispersion campaign showed the infeasible fraction was a property of the fixed-final-time formulation rather than of my tuning, because at that point the remaining work was a rewrite into a two-stage architecture rather than a fix, and I judged the rewrite less valuable than starting the estimation project" is a criterion, a piece of evidence, and a tradeoff. Note that the second version also names what the project produced before it stopped, which is the part that makes it a topic rather than an anecdote.

One caution specific to this round: the panel chose this topic from your list, so if an abandoned project is on it, you are committing to defend the abandonment decision as carefully as any other decision in your portfolio.

## The five ways a failure talk fails

**Blaming.** The library, the data, the machine, the time available. Even when true, it moves the talk away from what you did and toward what happened to you.

**No prediction.** If you never state what you expected, the negative result has nothing to contrast against and the panel cannot tell whether it is surprising.

**Vague scope.** "It does not work" instead of "it is unobservable for this geometry and this measurement type." The scope is the result; without it there is no claim to evaluate.

**No ruling-out.** Covered above, and it is the one that actually loses rounds.

**Ending on the failure.** The last thing said should be what the result established and what it changed about how you work — in the anchor-D case, that conditioning is now a precondition rather than a diagnostic. A talk that ends on the divergence leaves the panel holding the wrong sentence.

## Check yourself

::: check
Explain why a negative result requires more verification than a positive one, and why that makes it stronger evidence about the candidate.
:::

::: answer
Because the panel's correct default explanation for a method failing on a standard problem is that the implementation was wrong, so the talk has to eliminate that hypothesis before the result means anything. A positive result does not carry that burden — it can arise from luck, from following a recipe, or even from a bug that happens to produce a plausible plot. Clearing the higher bar therefore demonstrates precisely what the round is measuring: that the candidate can distinguish a property of the system from a defect in their own work, and has the evidence to do it.
:::

::: check
Distinguish the two claims a failure talk can make, and say what goes wrong when they are conflated in each direction.
:::

::: answer
"The system does not do this" is a property of the problem, independent of the implementer; "I could not make it do this" is a statement about one attempt. Claiming the first with only evidence for the second is over-claiming, and a panel finds it within two questions by asking what rules out an implementation error. Retreating to the second when you have actually established the first discards your own result — in the orbit-determination case, a condition number computed at the true state establishes unobservability for any estimator, which is a much stronger statement than "my fit diverged."
:::

::: check
In the anchor-D negative-result talk, two pieces of evidence rule out the candidate's own code. Name both and explain why they are independent.
:::

::: answer
First, the condition number of $\mathbf H^{\mathsf T}\mathbf H$ evaluated at the true state before any fitting — about $6\times10^{18}$, with the smallest singular value of $\mathbf H$ near $3\times10^{-15}$ — which is computed without running the solver at all, so it cannot be an artefact of the iteration, the initial guess or the step logic. Second, the same unchanged code converging cleanly on a four-station geometry, to $45.5\,\mathrm{m}$ RMS against a $50\,\mathrm{m}$ noise floor. They are independent because the first is a statement about the measurement geometry derived analytically from the Jacobian, while the second is an empirical demonstration that the implementation works when the geometry allows it — one would survive if the other were mistaken.
:::

::: check
A candidate stopped a planned 500-case campaign at 120 cases with no failures. State what that result does and does not support, with numbers, and name the approximation that makes it quick to compute.
:::

::: answer
With zero failures in $n$ trials the one-sided $95\%$ upper confidence bound on the failure probability is $1-0.05^{1/n}$. At $n=120$ that is $\approx0.0247$, so the data supports a failure rate below about $2.5\%$ at $95\%$ confidence. It does not support the roughly $0.6\%$ the full campaign would have given, since $1-0.05^{1/500}\approx0.00597$. The rule of three, $3/n$, approximates both closely — $3/120 = 0.025$ and $3/500 = 0.006$ — and is quick enough to do in the room.
:::

::: check
Why is "I stopped because I lost interest" unusable, while a decision to abandon a project can be a defensible topic?
:::

::: answer
Because abandonment is a decision, and every decision in this round is defended the same way: with the criterion that drove it. A defensible version names the evidence that triggered the stop, the judgement made about the remaining work, and what the project had already produced — for instance, stopping when a dispersion campaign showed an infeasible fraction was a property of the formulation rather than of the tuning, making the remaining work a rewrite rather than a fix. The caution is that the panel selects the topic, so listing an abandoned project commits you to defending the abandonment as rigorously as any technical choice.
:::

## Summary

| Element | Negative or unfinished talk |
| --- | --- |
| Structure | The same seven parts, with verification expanded to the centre |
| "Why it was hard" becomes | The prediction you started with, so the result has something to contrast against |
| The two claims | "The system does not do this" (provable, strong) versus "I could not make it do this" (about your attempt) |
| Ruling out your own error | At least two independent pieces of evidence — a diagnostic computed without the failing run, and the same code succeeding where it should |
| Unfinished campaign | A claim with a stated confidence: zero failures in $n$ trials bounds the failure rate by $1-0.05^{1/n}$, approximated by $3/n$ |
| Abandoned by choice | Defensible with a criterion, the triggering evidence, and what the project produced first |
| Five ways it fails | Blaming, no stated prediction, vague scope, no ruling-out, ending on the failure |

The final lesson is the one that converts everything in this module into performance: the rehearsal protocol, and what to measure on the recording.
