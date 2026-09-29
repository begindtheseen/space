---
id: l09-why-not-x-and-your-contribution
title: "Why did you not do X, and what did you actually do"
minutes: 26
covers:
  - "answering why did you not do X and what was your actual contribution"
---

Say you ride your bike to school, and a friend asks, "Why don't you take the bus?" One answer is "Because biking is better." Another is "I thought about it. The bus takes twenty-five minutes with the wait, and the bike takes twelve. If it's pouring rain, I take the bus." The second answer has three things the first lacks: you *considered* the bus, you have a *reason* with a number in it, and you know *when you would switch*.

Now a group science project. The teacher asks, "Which part did *you* do?" "We did all of it" tells her nothing. "I did all of it" gets you in trouble the moment she asks your partner.

Those are the two questions that arrive in every past-project round: **"why did you not do X"**, where X is another method the questioner knows well, and **"what was your actual contribution"**, asked on every team project and, in a different costume, on solo ones too.

The first tests whether you made a **decision** or only a **choice** — whether there was a reason that could have come out the other way. The second tests whether the work in front of the panel is evidence about *you*. Each has one shape that works. Rehearse it out loud until it is automatic, because the failures are instincts, and instinct is what you fall back on when eight people are looking at you.

## Why did you not do X

::: key
Answering "why did you not do X": never defensively. State that you considered X, give the specific reason you rejected it, and say what would have changed your mind. If you genuinely did not consider it, say so and then reason about it live.
:::

Three parts, in order — the same three as the bike answer:

1. **Considered.** You looked at the alternative.
2. **Criterion.** The specific reason it lost — ideally a number or a mechanism, not a preference.
3. **Reversal.** The condition under which you would have chosen it instead.

The third part is the one candidates leave out, and it does the most work: without it, a decision looks the same as a habit. The four ways the answer goes wrong are all instincts.

**Defensive.** "My approach was the right one for this problem." It signals that you never compared the options, because somebody who had would offer the comparison.

**Dismissive.** "That would have taken too long." A cost claim with no number. Say how much more, in what units — solves, weeks, sample points, lines of code to check.

**Caving in.** "You're right, I should have done that." Sometimes X really is better — but a bare "you're right" skips the engineering. Say *when* it is better and what it would have cost: the same three-part answer, pointed the other way.

**Bluffing.** Making up a reason you did not have at the time. This is the only one of the four that knocks you out rather than weakening you, because the invented reason will not survive the follow-up that asks for the number behind it.

::: example "Why did you not use an unscented filter?" — anchor project C
Anchor C is a filter that estimates which way a spacecraft points. It is an **EKF** (said "E-K-F", extended Kalman filter), which handles curved, **nonlinear** math by treating it as straight near the current guess. That step is called **[[linearization|linearization]]**. The rival is the **[[unscented filter|unscented-filter]]**, or UKF, which instead pushes a small set of test points through the true curved math.

**Weak.** "The EKF was accurate enough for what I needed, and UKFs are really for highly nonlinear systems. My results were good, so I did not see a reason to change."

Three problems: "accurate enough" has no threshold, a textbook generality stands in for an analysis of *this* system, and "my results were good" justifies a decision made before any results existed.

**Strong.** "I considered it. The test I used is where linearizing really hurts: when the uncertainty in the state is comparable to the scale over which the math curves. Here the attitude uncertainty is about the star-tracker noise, $5\times10^{-5}\,\mathrm{rad}$, and the attitude math curves on a scale of about one radian. So the ratio is about $5\times10^{-5}$ — across the region the uncertainty covers, the math is very nearly a straight line. On the other side, the unscented method costs $2n+1 = 13$ test points pushed through per step for a six-state filter. I did not think that cost bought anything measurable. The consistency result backs that up after the fact: if linearizing were bending the uncertainty out of shape, NEES would show it, and mean NEES came out at $6.067$, inside a band of $[5.614,\,6.398]$.

What would change my mind is coarse acquisition. If the filter has to start from tens of degrees of attitude error instead of tens of microradians, the ratio is about one, the linearized uncertainty is wrong, and I would either use an unscented filter or run a separate rough-alignment stage first."

**Checking the numbers.** $n = 6$, so $2n + 1 = 13$. The ratio $5\times10^{-5}$ is one part in twenty thousand. And $5.614 < 6.067 < 6.398$: inside the band. (NEES, said "nees", is lesson 1's score for whether a filter's claimed uncertainty is honest.)

**What separates them.** A criterion about this system, a number on both sides of the comparison, an after-the-fact check, and the situation where the answer flips. And nothing defensive: the alternative is treated as a sensible thing to have considered, because it was.
:::

::: example "Why a batch fit rather than a sequential filter?" — anchor project D
Anchor D fits a satellite's orbit to tracking data. A **batch** fit processes all the data at once, after it has been collected. A **sequential** filter updates its estimate one measurement at a time, as data arrives.

**Weak.** "Batch least squares is the standard approach for orbit determination from a tracking arc, so that is what I implemented."

An appeal to habit. It may be true, and it says nothing about whether she knows *why* the habit exists.

**Strong.** "I considered a sequential filter and rejected it for a specific reason. The **arc** — the stretch of tracking data — is fixed and processed after the fact, so I do not need an estimate that updates as data comes in. And a filter would have forced me to choose a **[[process-noise|process-noise]]** model that I had no basis for choosing. A batch fit's uncertainty comes only from the measurement noise and the geometry, which made it checkable: I reran 400 independent fits, and the real scatter matched the fit's own predicted uncertainty, $\hat{\mathbf P}$, to within about $8\%$ on every component. With an invented process noise in the loop, I could not have made that comparison cleanly, because a wrong process noise would have shown up in exactly the same place as a bug.

What would change my mind is unmodeled dynamics. My model of the motion has no randomness in it. So anything it misses — changes in air drag over the arc, for instance — gets soaked into the estimated state instead of being carried as uncertainty. If the arc were long enough for that to matter, I would want either a filter with process noise or a batch fit with **[[consider parameters|consider-parameters]]**. The sign that would tell me is a pattern in the leftover errors after the fit, instead of the flat, random-looking noise I actually saw."

$\hat{\mathbf P}$, read "P hat", is the covariance — the fit's claim about how unsure it is.

**What separates them.** The alternative is named with the specific thing it would have forced on her, the choice is tied to a verification result it made possible, and the reversal condition comes with the sign that would detect it — the mark of somebody who has actually looked at leftover errors.
:::

### When you really did not consider it

The honest answer is far stronger than a made-up one, if you do the second half. Four parts:

1. Say you did not consider it.
2. Say what the alternative buys. That shows you know what it is for.
3. Say whether you think it would matter here, and why.
4. Name the measurement that would settle it.

> "Why did you not use a square-root formulation for the covariance?"
>
> "I did not consider one. What a square-root form buys you is numerical: it tracks a 'square root' of the covariance, so the covariance cannot stop being positive-definite through computer rounding. Whether that matters here depends on how well-conditioned the numbers are. With six states in double precision, and a measurement noise that is not small compared with the state uncertainty, I would be mildly surprised if it did. But I am guessing, and I do not need to — the check is sitting in the Monte Carlo runs I already have. The smallest eigenvalue of $\mathbf P$ at every step of every one of the 300 runs would tell me directly whether it ever came close to failing. That is an afternoon's work, and I would want the number before claiming either way."

A covariance is **[[positive-definite|positive-definite]]** when every spread it describes is above zero, as a real spread must be. No bluff, no apology: she knows what the alternative is for, has a view, knows it is unchecked, and names the experiment.

## What was your actual contribution

::: key
The contribution question — "what was your actual contribution" — is asked on every team project. Answer with specifics: what you designed, implemented, decided and verified, and name what others did. Inflation is detected easily and ends the round.
:::

Four verbs: **[[designed, implemented, decided, verified|four-verbs]]**. *Design*: work out how it should be built. *Implement*: build it. *Decide*: pick between options. *Verify*: prove it works. A statement using all four can be checked, which is why it persuades. The two failures sit on either side.

**Blanket "we."** "We built a momentum-management system for the satellite." Nothing in that can be assessed. Saying "we" all through a defense makes your own part invisible — often out of modesty, which makes it painful to watch.

**Inflation.** Claiming decisions that were somebody else's. It is caught by follow-up questions, and how that works explains why even a small inflation is a bad bet.

Each follow-up asks about a decision one level deeper than the last. Somebody who made the decision has the reason at once, because they needed it at the time. Somebody who did not has to invent a believable reason on the spot. Then the second invention has to agree with the first, and the third with both. Three levels down, the inventions start to contradict each other. Now the panel's question is no longer "how big was her role?" but "is she honest?"

::: example A contribution statement on a team project, three ways
The project: a university **[[CubeSat|cubesat]]** attitude control system, five people, flown in space.

**Blanket we.** "We designed the attitude control system, sized the wheels and magnetorquers, and validated it in a **[[hardware-in-the-loop|hardware-in-the-loop]]** rig before flight."

True, and impossible to assess: nothing shows any of it was hers.

**Inflated.** "I led the ADCS subsystem, designed the control architecture, and drove the hardware validation campaign." (ADCS, said "A-D-C-S", is the attitude determination and control system.)

If somebody else owned the architecture, this falls apart on the second follow-up — "What drove the control bandwidth choice?" — and casts doubt on everything else she said.

**Strong.** "I owned momentum management. I designed the momentum budget: the worst-case gravity-gradient bound of $4.226\times10^{-7}\,\mathrm{N\,m}$ from a numerical scan over body attitudes, cross-checked against the closed form $\tfrac{3\mu}{2r^3}|I_{\max}-I_{\min}|$, and the one-orbit buildup of $2.40\times10^{-3}\,\mathrm{N\,m\,s}$ that followed. I decided the wheel size from that budget, and the desaturation margin of about $11.8$ is the number I defended it with. I implemented the dumping law in flight software, and I verified it against a disturbed environment — a misaligned torquer, a magnetic field strength off by $10\%$ — not only the nominal one. What I did not do: the attitude determination side is Priya's, including the sun-sensor calibration that the whole pointing budget depends on, and the hardware-in-the-loop rig was built by two people on the avionics team. I would say the same thing with all three of them in the room."

**Checking the numbers.** A torque of $4.226\times10^{-7}\,\mathrm{N\,m}$ acting for one low orbit of about $5680\,\mathrm{s}$ builds up $4.226\times10^{-7} \times 5680 \approx 2.40\times10^{-3}\,\mathrm{N\,m\,s}$ of stored spin, so the two budget numbers agree.

**What separates them.** Every claim names something checkable, and all four verbs are there. The credit given to others is not politeness — a candidate willing to hand away the parts that were not hers is more believable about the parts that were. And the last sentence is the test the module's exercise sets: you would say it with your teammates present.
:::

### The solo-project version of the same question

On a solo project the question arrives as the **library boundary**: what did you write, and what did a **library** — ready-made code from someone else — do for you?

::: example "What did you actually write?" — anchor project B
Anchor B is the landing-burn guidance project. It turns the landing into a **cone program** — a type of math problem computers solve reliably — and hands it to a **solver**, the program that finds the answer.

**Weak.** "I wrote all of it from scratch."

Almost certainly false — the panel checks it in ten seconds by asking what solved the cone program. It also wastes a chance: the interesting answer is your judgment about which part mattered.

**Strong.** "The formulation is mine: the cost, the constraints, the lossless-convexification slack variable, and the **discretization** into forty time steps. The verification is mine — the independent re-simulation of the returned control, which reproduced the solver's own states to $4\times10^{-12}\,\mathrm{m}$, the closed-form check on the cost, and the constraint check on every returned trajectory. The dispersion campaign is mine. The cone program itself is solved by a library, and the linear algebra is **[[NumPy|numpy]]**. The part I would defend as the real engineering is the discretization and the tightness check, because that is where a sign error produces a trajectory that looks completely plausible and is wrong. The solver cannot catch that for me. It will happily return the best answer to whatever problem I actually handed it."

**What separates them.** It draws the boundary honestly, says which side the judgment lived on, and heads off the next question: "how do you know the solver's answer is right?"
:::

::: warning
Under-claiming is not the safe direction. Candidates afraid of sounding boastful slide into "we" and into **[[passive voice|passive-voice]]** — "it was decided that", "the gains were tuned" — sentences with no one doing the action. Then nothing can be credited to you, and the round exists to gather evidence about you. Aim for precision in both directions: a statement that is specific, checkable and generous to others is at once the most honest version and the most persuasive one.
:::

## Check yourself

::: check
State the three parts of a strong answer to "why did you not do X," and explain what is lost when the third part is left out.
:::

::: answer
You considered it; the specific criterion it lost on, with a number or a mechanism; and the condition under which you would have chosen it instead.

Without the third part, a reason looks the same as an excuse for a habit: it explains what you did, not that you were weighing something. The reversal condition also shows you know where the alternative really wins.
:::

::: check
A candidate answers "that alternative would have taken too long." Diagnose the weakness and repair it.
:::

::: answer
With no number, it cannot be judged and sounds like a brush-off.

The repair is to state the cost in the units that actually applied. For example: a free final time needs a search with one convex solve per candidate time, against a single solve for the fixed-time version. Or: an unscented filter needs $2n+1 = 13$ test-point propagations per step for a six-state system.

With the number there, the panel can argue the tradeoff — a conversation about engineering, not about your attitude.
:::

::: check
A panel member asks about an alternative you have truly never considered. Give the four-part shape of an honest answer, and say why it beats a believable made-up reason.
:::

::: answer
Say you did not consider it; state what the alternative buys; give your view on whether it matters here, and why; name the measurement that would settle it.

A made-up reason will not survive the follow-up asking for its number. The honest version shows live reasoning and ends with a concrete experiment, which is what a colleague would propose.
:::

::: check
Explain how an inflated contribution claim gets caught, and why it is a bad bet even when the inflation is small.
:::

::: answer
Follow-up questions go down one decision level at a time. Someone who made a decision has its reason ready, because they needed it at the time. Someone who did not has to invent one, and each new invention must agree with the earlier ones. Two or three levels down, the inventions begin to clash.

Then the panel's question is about your honesty, not your role — far worse than a modest contribution. Small inflations are tested by the same follow-ups, and the damage does not shrink with the exaggeration.
:::

::: check
Why does naming what teammates did make your own contribution more believable, not less impressive?
:::

::: answer
Because it makes the whole statement checkable, and it shows you are willing to give away what was not yours.

A statement that claims everything must be discounted entirely. One that hands specific pieces to named colleagues shows you draw the line with care, which makes your side of it believable. The test: would you say it with those teammates in the room?
:::

::: check
Give the solo-project form of the contribution question, and say what makes a strong answer different from a complete list of what you wrote.
:::

::: answer
On a solo project it arrives as the library boundary: what did you write, and what did a library do for you?

A strong answer draws that boundary honestly and then goes one step further. It names which part of the work carried the real engineering judgment — for instance, the discretization and the tightness check in a convex guidance project, because that is where an error produces a believable but wrong trajectory that the solver cannot catch for you. A list says what you touched; the extra step says where you think the risk was.
:::

## Summary

| Question | Shape of a strong answer |
| --- | --- |
| Why did you not do X | Considered it; the criterion it lost on, with a number or mechanism; the condition that would reverse the decision |
| X you never considered | Say so; what X buys; whether it matters here and why; the measurement that would settle it |
| Failure modes | Defensive, dismissive with no number, caving in without analysis, bluffing |
| Contribution, team project | What you designed, implemented, decided and verified — plus what named others did |
| Contribution, solo project | The library boundary, plus which part carried the engineering judgment |
| Why inflation fails | Follow-ups go down a level at a time; invented reasons start contradicting each other |
| Why under-claiming fails | Blanket "we" and passive voice make your contribution impossible to assess, and assessing it is what the round is for |

The next lesson takes the question nobody prepares for, because preparing for it feels like planning to fail: the one you cannot answer.

::: context linearization Why a curve looks straight up close
Stand in a field and Earth looks flat, though it is round. Any smooth curve looks like a straight line if you zoom in far enough. An EKF uses that trick: near its current guess, it treats the curved math as a straight line. The trick is safe only while the uncertainty is small compared with how sharply the curve bends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20,150 Q180,-10 340,150" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="60" y1="70" x2="300" y2="70" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="180" cy="70" r="4" fill="#1f2a44"/>
  <rect x="160" y="62" width="40" height="16" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="80" y="62" width="200" height="90" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="54" font-size="11" fill="#1d6fd1" text-anchor="middle">small spread: line fits</text>
  <text x="180" y="146" font-size="11" fill="#b4232c" text-anchor="middle">big spread: line misses</text>
  <text x="300" y="62" font-size="11" fill="#1d6fd1" text-anchor="end">straight-line guess</text>
</svg>
```

Anchor C's spread is about one twenty-thousandth of the bending scale — far smaller even than the blue box.
:::

::: context unscented-filter Test points instead of a straight line
An **unscented filter** does not straighten the curve. It picks a few **sigma points** — test points spread around the current guess — and pushes each one through the real curved math, then measures where they land. For a state of $n$ numbers it uses $2n + 1$ points: the center, plus one on each side of it along each of the $n$ directions. Here $n = 2$, so $2 \times 2 + 1 = 5$ points.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="75" rx="110" ry="50" fill="#8fb8f0" fill-opacity="0.4" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="70" y1="75" x2="290" y2="75" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="25" x2="180" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g fill="#b4232c" stroke="#1f2a44" stroke-width="1">
    <circle cx="180" cy="75" r="6"/><circle cx="100" cy="75" r="6"/><circle cx="260" cy="75" r="6"/>
    <circle cx="180" cy="39" r="6"/><circle cx="180" cy="111" r="6"/>
  </g>
  <text x="180" y="145" font-size="12" fill="#1f2a44" text-anchor="middle">n = 2 directions → 2n + 1 = 5 sigma points</text>
</svg>
```

Anchor C has $n = 6$, so 13 points, each pushed through the math at every step.
:::

::: context process-noise Admitting the model is not perfect
A filter predicts how the state moves, then corrects with measurements. **Process noise** is a number you give it that says, "my prediction of the motion is off by about this much each step". Too small, and the filter trusts a flawed model too much; too large, and it trusts noisy measurements too much. Choosing it well needs knowledge you may not have. A batch fit over a fixed arc can skip that choice, which is the whole point of the anchor D answer.
:::

::: context consider-parameters Uncertain things you do not solve for
Some quantities affect your fit but cannot be pinned down by the data — for example, exactly how strong air drag was. **Consider parameters** are a way to say "I will not estimate this, but I know it is uncertain by about this much". The fit then widens its reported uncertainty to include that doubt, instead of pretending the quantity is known exactly. It is an honest middle path between ignoring the effect and trying to estimate it.
:::

::: context positive-definite Why a covariance must stay positive
A covariance holds variances — squared spreads — and a squared spread can never be negative. A covariance matrix that is **positive-definite** passes that test in every direction at once. Its **eigenvalues**, the spreads along its special directions, are all above zero. Computers round every number slightly, and over thousands of steps rounding can push a tiny eigenvalue below zero. That is nonsense, and the filter can blow up. A square-root form tracks a matrix whose "square" is the covariance, so the result cannot go negative.
:::

::: context four-verbs Four verbs, four kinds of claim
Each verb is a different kind of work, and each can be checked with a different follow-up question.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="10" y="10" width="165" height="72" rx="6" fill="#8fb8f0"/>
    <rect x="185" y="10" width="165" height="72" rx="6" fill="#fff"/>
    <rect x="10" y="90" width="165" height="72" rx="6" fill="#fff"/>
    <rect x="185" y="90" width="165" height="72" rx="6" fill="#8fb8f0"/>
  </g>
  <g fill="#1f2a44" text-anchor="middle">
    <text x="92" y="36" font-size="14" font-weight="700">designed</text>
    <text x="92" y="58" font-size="11">"how did you size it?"</text>
    <text x="267" y="36" font-size="14" font-weight="700">implemented</text>
    <text x="267" y="58" font-size="11">"what did the code do?"</text>
    <text x="92" y="116" font-size="14" font-weight="700">decided</text>
    <text x="92" y="138" font-size="11">"what did you reject?"</text>
    <text x="267" y="116" font-size="14" font-weight="700">verified</text>
    <text x="267" y="138" font-size="11">"how do you know?"</text>
  </g>
</svg>
```

A contribution statement that fills all four boxes with specifics gives the panel something to check in each one.
:::

::: context cubesat A satellite the size of a loaf of bread
A **CubeSat** is a small standard satellite built from 10 cm cube units, each called a "U". A 1U CubeSat fits in your hands; a 3U is about the size of a loaf of bread. The standard came out of university work around the year 2000, so that students could build real spacecraft cheaply and ride to orbit alongside bigger satellites. Many engineers' first flight hardware was a university CubeSat — which is exactly why "what did *you* do on it?" gets asked.
:::

::: context hardware-in-the-loop Real hardware, fake world
**Hardware-in-the-loop** testing (often "HIL", said "hill") connects the real flight computer or real sensors to a computer simulation of space. The simulation pretends to be the orbit, the Sun and the magnetic field; the real hardware reacts as if it were flying. It catches problems that a pure simulation misses — timing, wiring, unit mix-ups — before launch, when fixing them is still possible.
:::

::: context numpy The library under almost everything
**NumPy** (said "NUM-pie") is a free Python library for fast math on arrays of numbers: matrices, vectors, linear algebra. It is so widely used in science and engineering that nobody expects you to have written your own matrix code — and saying so honestly costs you nothing. What the panel wants to hear is what *you* built on top of it, and how you checked it.
:::

::: context passive-voice Sentences with nobody in them
In **active voice**, someone does something: "I tuned the gains." In **passive voice**, the thing gets done by nobody in particular: "The gains were tuned." Passive voice is handy when the doer does not matter. In a contribution statement, the doer is the whole point. A good habit when rehearsing: every time you hear "was" plus a verb, ask "by whom?" and say the name.
:::
