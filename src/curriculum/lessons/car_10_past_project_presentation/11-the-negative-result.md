---
id: l11-the-negative-result
title: "The talk about the thing that did not work"
minutes: 20
covers:
  - "talk structure: problem, why it was hard, approach, the key decision and the alternatives rejected, verification, result, what you would do differently"
---

Your desk lamp will not turn on. Is the bulb dead, or is the lamp broken? You could fiddle with the switch for an hour. Or you could do two quick things: screw the bulb into a lamp you know works, and screw a bulb you know works into your lamp. Two tests, each independent of the other, and now you *know* where the problem is. You did not fix anything, but you found something out — and you can prove it.

That is the whole idea of this lesson. More engineering projects end without a clean success than with one. A method turns out not to work where you needed it. A test campaign runs out of time at three hundred cases of a planned thousand. A setup that looked right gives an answer you cannot trust. This is ordinary engineering. Yet almost nobody puts one of these on a submission list, because "it did not work" sounds like a confession, not a topic. Results like these are called **negative results**, and they tend to [[stay in the drawer|file-drawer]].

Handled well, a negative result is the most convincing talk in the set, and the reason is precise. A positive result can come from luck, from following somebody else's recipe, or from a bug that happens to draw a plausible-looking plot. A negative result cannot be reported at all by someone who is unable to rule out the obvious other explanation — that they made a mistake. So the bar for defending a negative result is *higher* than for a positive one. Clearing it shows exactly what the round is trying to measure.

The same seven-part structure from the talk-structure lesson carries this talk. Three of the parts change weight.

::: key
For a negative or unfinished result the structure is unchanged — problem, why it was hard, approach, key decision and rejected alternatives, verification, result, what you would do differently — but three parts shift: "why it was hard" becomes the prediction you started with, verification expands to become the center of the talk, and the result is stated as a property of the system with the scope in which it holds.
:::

"Scope" here means the exact conditions under which your result is true — this geometry, this kind of measurement, this trajectory.

## The panel's first thought: you made a mistake

That is not suspicion of you personally. It is the correct **[[prior|prior-word]]** — the sensible starting belief before any evidence. Most of the time, when a standard method fails on a standard problem, the code is wrong. Your talk's job is to knock out that explanation. Everything else follows from it.

So the most important split in this kind of talk is between two claims that sound alike and are completely different.

**"The system does not do this."** A property of the problem itself, true no matter who writes the code. This is the strong form, and it can be proved.

**"I could not make it do this."** A statement about your attempt. It is still presentable, but it is only interesting to the degree that you can say what you ruled out along the way.

Mixing these up is the classic way a failure talk fails. Claim the first when you have only shown the second, and you are over-claiming — a panel will find it in two questions. Retreat to the second when you have actually shown the first, and you throw away your own result.

::: example Anchor project D, presented as a negative result
Anchor project D is batch orbit determination: working out where a spacecraft is and how it is moving by fitting a path to a whole batch of measurements at once. Here is how its failure story fits the seven parts.

**Problem.** Recover a four-number state — position and velocity in a flat local frame, two numbers each — from **range-only** measurements (distance, no direction) to a single fixed [[tracking station|one-station-blind-spot]] over a $300\,\mathrm{s}$ pass.

**The prediction.** "[[Gauss-Newton|gauss-newton]] on the normal equations is the standard tool for this, the measurement model is smooth, the noise is well behaved at $50\,\mathrm{m}$, and I expected it to converge in a handful of iterations."

**Approach.** Linearize the range model — replace the curved relationship with a straight-line approximation near the current guess — then solve

$$
\mathbf H^{\mathsf T}\mathbf H\,\Delta\mathbf x = \mathbf H^{\mathsf T}\mathbf r ,
$$

step, and repeat. Read it as "H transpose H times delta x equals H transpose r." Here $\mathbf H$ is the **Jacobian** — the table of how much each measurement changes when each state number is nudged — $\mathbf r$ is the **residuals**, the gaps between measured and predicted ranges, and $\Delta\mathbf x$ ("delta x") is the correction to the guess.

**What happened.** It diverged by the second iteration. The velocity numbers jumped to physically absurd values, and the matrix $\mathbf H^{\mathsf T}\mathbf H$ became numerically **singular** — so close to impossible to solve that the computer's arithmetic breaks down.

**Verification — the center of the talk.** Two independent results knock out the idea that the code is broken.

First, the **[[condition number|condition-number]]** of $\mathbf H^{\mathsf T}\mathbf H$, evaluated at the *true* state, before any fitting at all: $\mathrm{cond}\approx6\times10^{18}$, with the smallest **singular value** of $\mathbf H$ itself around $3\times10^{-15}$. (A singular value measures how strongly the measurements respond along one direction of the state; near zero means "hardly at all.") That is a statement about the geometry, computed without running the solver. So it cannot come from the iteration, the starting guess, or the step logic.

Second, the identical code, unchanged, run on a four-station geometry: $\mathrm{cond}\approx4.3\times10^{5}$, and the fit converges cleanly. The **[[RMS|noise-floor]]** residual (said "R-M-S", root mean square — a kind of average size of the gaps) falls

$$
120{,}131 \rightarrow 2{,}605 \rightarrow 62.0 \rightarrow 45.5\,\mathrm{m}
$$

against the $50\,\mathrm{m}$ noise floor. Together those two rule out the solver and point at the problem.

**Result, stated with its scope.** For this trajectory and this single-station geometry, one direction of the state is **unobservable** from range alone — not poorly determined, but invisible to within numerical precision — and no estimator of any kind recovers it from this data. Stations at different bearings restore observability, and the improvement can be measured: thirteen orders of magnitude (a factor of about $10^{13}$) in conditioning.

**What I would do differently.** "Compute the conditioning before fitting, always, as a precondition rather than a diagnostic. I spent an afternoon debugging code that was never broken, and the check that would have told me costs one line."

**Check the numbers.** $6\times10^{18} \div 4.3\times10^{5} \approx 1.4\times10^{13}$, so "thirteen orders of magnitude" is right. The final residual, $45.5\,\mathrm{m}$, sits a little under the $50\,\mathrm{m}$ noise — about what a good fit should reach.
:::

This is the desk-lamp test. The condition number is "test the bulb in a lamp you trust" — it checks the problem without your code. The four-station run is "put a good bulb in your lamp" — it checks your code on a problem that should work.

Now read that outline against the four evaluation axes. **Technical depth:** an observability argument with two independent confirmations. **Communication clarity:** a claim with a stated scope. **Simplicity:** the diagnosis is one condition number, not an elaborate investigation. **Defending decisions:** the candidate can say exactly why she believes the problem is the geometry, not her code, and what would change her mind. A talk about a fit that worked the first time contains none of this.

::: warning
A negative result with no verification behind it looks exactly like a bug, and a panel will treat it as one — correctly. "It did not converge," on its own, is not a finding. What makes it a finding is evidence that rules out the explanations other than yours: a diagnostic computed independently of the failing run, the same code succeeding on a case where it should succeed, or an analytic argument for why the failure was expected. Bring at least two, ideally independent.
:::

## The project that did not finish

The second shape of this talk is a project that was going fine and then stopped. The test campaign at 120 cases of a planned 500. The software with two of its three constraint types coded. The hardware test that never got hardware.

The move here is to stop treating the project as incomplete and start treating it as a claim with a stated confidence. Unfinished does not mean no result. It means a result with wider **error bars** — a wider range of doubt — and that range can be computed.

::: example A campaign stopped at 120 of 500 cases
The campaign was planned at 500 randomly varied cases, with a [[pass criterion fixed in advance|fixed-in-advance]]. It stopped at 120, and all 120 passed.

**Weak, the over-claim.** "The Monte Carlo showed no failures." True, and misleading. It invites listeners to supply their own idea of how strong that evidence is, and their idea will be stronger than the data supports.

**Weak, the abandonment.** "The campaign is incomplete, so I do not have results yet." This throws away a real result. One hundred and twenty clean cases is evidence. Refusing to say what it is worth is not modesty; it is leaving the analysis undone.

**Strong.** "One hundred and twenty of a planned five hundred cases, all passing. With zero failures in $n$ trials, the one-sided $95\%$ upper confidence bound on the failure probability is $1-0.05^{1/n}$, which at $n=120$ is about $0.0247$. So the campaign supports a failure rate below about $2.5\%$, at $95\%$ confidence. It does not support the number I was aiming for: the full 500 cases would have given $1-0.05^{1/500}\approx0.00597$, below about $0.6\%$. The useful shortcut is the [[rule of three|rule-of-three]], $3/n$, which gives $3/120 = 0.025$ and $3/500 = 0.006$ — close enough to the exact values to do in your head. So the honest statement is that the requirement is met to within a factor of four of the confidence I wanted, and finishing the campaign is a compute cost, not a modeling question."

**Step by step.** Put $n=120$ into the formula: $0.05^{1/120}\approx0.97534$, and $1-0.97534 = 0.0247$, or $2.47\%$. With $n=500$: $0.05^{1/500}\approx0.99403$, so the bound is $0.00597$, or $0.60\%$. The ratio $0.0247 \div 0.00597 \approx 4.1$ — the "factor of four."

**Sanity check.** More clean cases should give a tighter bound, and they do: $500$ cases give a bound about four times smaller than $120$, close to the ratio $500/120 \approx 4.2$ the rule of three predicts.

**What separates them.** The strong version turns an unfinished campaign into a measured claim, says exactly what it does and does not support, and names what the remaining work really is. It also shows something the finished campaign would not have: that the candidate knows what a zero-failure result is worth — a question a surprising number of people with finished Monte Carlo campaigns cannot answer.
:::

::: note Why the formula has to be true
Suppose each case fails with some probability $p$. Then each passes with probability $1-p$, and, since the cases are independent, all $n$ pass with probability $(1-p)^n$. The $95\%$ upper bound is the largest $p$ that still leaves at least a $5\%$ chance of seeing zero failures. Set $(1-p)^n = 0.05$ and solve: take the $n$-th root of both sides to get $1-p = 0.05^{1/n}$, so $p = 1-0.05^{1/n}$. Any failure rate higher than that would make "120 clean cases" a less-than-$5\%$ fluke. For the shortcut, write $0.05^{1/n} = e^{\ln 0.05/n}$; since $\ln 0.05 \approx -3.00$ and $e^{-y}\approx 1-y$ for small $y$, this is about $1 - 3/n$, so $p \approx 3/n$.
:::

## The project you stopped on purpose

The third shape is a project abandoned by decision, not by circumstance. You concluded it was the wrong thing to build, and you stopped. This is presentable, and the same rule governs it as every other decision in this round: it needs a **criterion** — a stated reason you could check.

"I stopped because I lost interest" is not a criterion. Compare: "I stopped when the dispersion campaign showed the infeasible fraction was a property of the [[fixed-final-time formulation|fixed-final-time]], not of my tuning. At that point the remaining work was a rewrite into a two-stage architecture rather than a fix, and I judged the rewrite less valuable than starting the estimation project." That is a criterion, a piece of evidence, and a tradeoff. (The **infeasible fraction** is the share of test cases where no valid plan existed.) The second version also names what the project produced before it stopped — which is what makes it a topic rather than an anecdote.

One caution for this round: the panel picks the topic from your list. If an abandoned project is on it, you are committing to defend the decision to abandon it as carefully as any other decision in your portfolio.

## The five ways a failure talk fails

**Blaming.** The library, the data, the machine, the time available. Even when true, it moves the talk away from what you did and toward what happened to you.

**No prediction.** If you never say what you expected, the negative result has nothing to contrast with, and the panel cannot tell whether it is surprising.

**Vague scope.** "It does not work," instead of "it is unobservable for this geometry and this measurement type." The scope *is* the result. Without it there is no claim to judge.

**No ruling-out.** Covered above — and this is the one that actually loses rounds.

**Ending on the failure.** The last thing you say should be what the result established and what it changed about how you work. In the anchor-D case, that is: conditioning is now a precondition, not a diagnostic. A talk that ends on the divergence leaves the panel holding the wrong sentence.

## Check yourself

::: check
Explain why a negative result needs more verification than a positive one, and why that makes it stronger evidence about the candidate.
:::

::: answer
Because the panel's correct default explanation, when a method fails on a standard problem, is that the code was wrong. So the talk has to eliminate that explanation before the result means anything. A positive result carries no such burden — it can come from luck, from following a recipe, or even from a bug that happens to produce a plausible plot. Clearing the higher bar therefore shows exactly what the round measures: that the candidate can tell a property of the system from a defect in their own work, and has the evidence to prove which is which.
:::

::: check
Tell apart the two claims a failure talk can make, and say what goes wrong when they are mixed up in each direction.
:::

::: answer
"The system does not do this" is a property of the problem, true whoever implements it. "I could not make it do this" is a statement about one attempt. Claiming the first with evidence only for the second is over-claiming, and a panel finds it within two questions by asking what rules out a coding error. Retreating to the second when you have actually shown the first throws away your own result. In the orbit-determination case, a condition number computed at the true state shows unobservability for *any* estimator, which is a far stronger statement than "my fit diverged."
:::

::: check
In the anchor-D negative-result talk, two pieces of evidence rule out the candidate's own code. Name both and explain why they are independent.
:::

::: answer
First, the condition number of $\mathbf H^{\mathsf T}\mathbf H$ evaluated at the true state before any fitting — about $6\times10^{18}$, with the smallest singular value of $\mathbf H$ near $3\times10^{-15}$. It is computed without running the solver, so it cannot come from the iteration, the starting guess or the step logic. Second, the same unchanged code converging cleanly on a four-station geometry, to $45.5\,\mathrm{m}$ RMS against a $50\,\mathrm{m}$ noise floor. They are independent because the first is a statement about the measurement geometry, worked out from the Jacobian, while the second is an experiment showing the code works when the geometry allows it. Either one would still stand if the other turned out to be mistaken.
:::

::: check
A candidate stopped a planned 500-case campaign at 120 cases with no failures. Say what that result does and does not support, with numbers, and name the shortcut that makes it quick to compute.
:::

::: answer
With zero failures in $n$ trials, the one-sided $95\%$ upper confidence bound on the failure probability is $1-0.05^{1/n}$. At $n=120$ that is about $0.0247$, so the data supports a failure rate below about $2.5\%$ at $95\%$ confidence. It does not support the roughly $0.6\%$ the full campaign would have given, since $1-0.05^{1/500}\approx0.00597$. The rule of three, $3/n$, approximates both closely — $3/120 = 0.025$ and $3/500 = 0.006$ — and is quick enough to do in the room.
:::

::: check
Why is "I stopped because I lost interest" unusable, while a decision to abandon a project can be a defensible topic?
:::

::: answer
Because abandoning a project is a decision, and every decision in this round is defended the same way: with the criterion that drove it. A defensible version names the evidence that triggered the stop, the judgment made about the remaining work, and what the project had already produced. For example: stopping when a dispersion campaign showed the infeasible fraction was a property of the formulation, not the tuning, so the remaining work was a rewrite rather than a fix. The caution is that the panel picks the topic, so listing an abandoned project commits you to defending the abandonment as carefully as any technical choice.
:::

## Summary

| Element | Negative or unfinished talk |
| --- | --- |
| Structure | The same seven parts, with verification expanded to the center |
| "Why it was hard" becomes | The prediction you started with, so the result has something to contrast with |
| The two claims | "The system does not do this" (provable, strong) versus "I could not make it do this" (about your attempt) |
| Ruling out your own error | At least two independent pieces of evidence — a diagnostic computed without the failing run, and the same code succeeding where it should |
| Anchor D numbers | One station: cond $\approx 6\times10^{18}$; four stations: cond $\approx 4.3\times10^{5}$, RMS $45.5\,\mathrm{m}$ against $50\,\mathrm{m}$ noise |
| Unfinished campaign | A claim with a stated confidence: zero failures in $n$ trials bounds the failure rate by $1-0.05^{1/n}$, approximated by $3/n$ |
| Abandoned by choice | Defensible with a criterion, the triggering evidence, and what the project produced first |
| Five ways it fails | Blaming, no stated prediction, vague scope, no ruling-out, ending on the failure |

The final lesson turns everything in this module into performance: the rehearsal protocol, and what to look for on the recording.

::: context file-drawer Where failed experiments go to hide
Scientists have a name for this habit: the **file-drawer problem**, a phrase the psychologist Robert Rosenthal made popular in 1979. Studies that find nothing tend to go unpublished and sit in a drawer, while the lucky successes get printed. The result is a record that looks more successful than reality. Engineers do the same thing on résumés and submission lists. The panel knows real projects fail often, so a candidate who can present a failure well stands out from a list of spotless successes.
:::

::: context prior-word What a "prior" is
Your **prior** is what you believe before you look at the new evidence. If your friend says "my phone won't turn on," your prior is "the battery is flat," because that is usually the answer — not "the phone has a rare factory defect." Good reasoning starts from the likely explanation and moves off it only when evidence pushes. The word comes from probability, where the prior is the starting chance you give an idea before the data arrives. A panel's prior for "standard method failed" is "bug," and your evidence has to move it.
:::

::: context gauss-newton Named after two giants
The method carries two famous names. In 1801 the young Carl Friedrich Gauss used least squares — choosing the answer that makes the squared gaps between prediction and measurement as small as possible — to predict where the newly found dwarf planet Ceres would reappear after it was lost in the Sun's glare, and it was found close to his prediction. Isaac Newton's name comes from the other half of the trick: replace a curved problem with a straight-line approximation, solve that, and repeat. Orbit determination has used this idea ever since.
:::

::: context one-station-blind-spot Why one station cannot see everything
In the simplest version of this problem — a spacecraft coasting in a straight line in a flat frame — spin the whole path around the station and every distance stays exactly the same. The station measures only distance, so it cannot tell the two paths apart. That spin is the unobservable direction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="145" x2="230" y2="45" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="30" cy="145" r="4" fill="#1d6fd1"/>
  <circle cx="130" cy="95" r="4" fill="#1d6fd1"/>
  <circle cx="230" cy="45" r="4" fill="#1d6fd1"/>
  <line x1="90.8" y1="57.9" x2="308.3" y2="109.9" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="7 4"/>
  <circle cx="90.8" cy="57.9" r="4" fill="#b4232c"/>
  <circle cx="199.5" cy="83.9" r="4" fill="#b4232c"/>
  <circle cx="308.3" cy="109.9" r="4" fill="#b4232c"/>
  <line x1="180" y1="185" x2="130" y2="95" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="3 3"/>
  <line x1="180" y1="185" x2="199.5" y2="83.9" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="3 3"/>
  <polygon points="180,178 173,192 187,192" fill="#1f2a44"/>
  <text x="196" y="196" font-size="12" fill="#1f2a44">station</text>
  <text x="20" y="165" font-size="12" fill="#1d6fd1">true path</text>
  <text x="240" y="132" font-size="12" fill="#b4232c">rotated path</text>
  <text x="140" y="150" font-size="11" fill="#6c7a93">same distances</text>
</svg>
```

Stations at different bearings break the tie, because a rotation about one station changes the distances to the others.
:::

::: context condition-number A wobble meter for equations
The **condition number** says how much a small error in the inputs can be magnified in the answer. A value near 1 is rock steady. Ordinary computer arithmetic carries about 16 significant digits, so once the condition number reaches around $10^{16}$ the answer can be pure rounding noise. The bars show each case's power of ten.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="10" y="42" font-size="12" fill="#1f2a44">1 station</text>
  <rect x="100" y="28" width="225" height="22" fill="#b4232c"/>
  <text x="10" y="90" font-size="12" fill="#1f2a44">4 stations</text>
  <rect x="100" y="76" width="68" height="22" fill="#1d6fd1"/>
  <text x="174" y="92" font-size="11" fill="#1f2a44">about 10^5.6</text>
  <line x1="292" y1="16" x2="292" y2="110" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="292" y="126" font-size="11" fill="#1f2a44" text-anchor="middle">10^16: digits run out</text>
  <text x="100" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">10^0</text>
  <text x="330" y="22" font-size="11" fill="#b4232c" text-anchor="end">10^18.8</text>
</svg>
```

The single-station bar runs past the line; the four-station bar stops far short of it.
:::

::: context noise-floor Why the fit stops near 50 meters
**RMS**, root mean square, is a way to average sizes that ignores sign: square each gap, average the squares, then take the square root. If every measurement carries random noise of about $50\,\mathrm{m}$, even a perfect fit leaves gaps of about that size — you cannot fit away randomness. That level is the **noise floor**. So a residual that falls to $45.5\,\mathrm{m}$ and stops is a sign of success. A residual far *below* the noise would be suspicious: it would mean the fit was bending to chase the noise.
:::

::: context fixed-in-advance No moving the goalposts
Deciding what counts as a pass *before* running the tests matters because people are very good at fooling themselves. If you choose the pass line after seeing the results, it is tempting to put it right below whatever you got. A criterion written down in advance cannot be nudged, so a pass means something. Scientists call writing the plan down first **preregistration**; flight test engineers write test plans with pass-fail criteria for the same reason.
:::

::: context rule-of-three Zero failures is not zero risk
Seeing no failures does not mean the failure rate is zero. It means the rate is probably below a ceiling, and the ceiling drops as the number of clean cases grows. At $95\%$ confidence the ceiling is about $3/n$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="10" y="40" font-size="12" fill="#1f2a44">120 cases</text>
  <rect x="90" y="26" width="247" height="22" fill="#f2b880" stroke="#1f2a44"/>
  <text x="330" y="41" font-size="12" fill="#1f2a44" text-anchor="end">below 2.47%</text>
  <text x="10" y="84" font-size="12" fill="#1f2a44">500 cases</text>
  <rect x="90" y="70" width="60" height="22" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="158" y="85" font-size="12" fill="#1f2a44">below 0.60%</text>
  <line x1="90" y1="18" x2="90" y2="104" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">0%</text>
  <text x="190" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">1%</text>
  <text x="290" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">2%</text>
</svg>
```

Both runs had zero failures; only the number of cases differs.
:::

::: context fixed-final-time When the clock is chosen for you
In anchor project B, the landing-guidance problem, the time at which the vehicle must touch down can be set before the solver runs. That is a **fixed final time**. It keeps the problem simple and fast, but if the chosen time is too short or too long for a particular starting condition, no plan meets every rule and the case is infeasible. A **two-stage** design first searches for a good landing time, then solves for the plan with that time fixed. It removes many infeasible cases, at the cost of more code and more solves.
:::
