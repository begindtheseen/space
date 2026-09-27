---
id: l06-robust-stability-vs-performance
title: Robust stability versus robust performance
minutes: 18
covers:
  - Robust stability vs robust performance
---

Think about a bike with wobbly wheels. It never falls over, not once, whoever rides it and however the tires are pumped. Good. But on a gusty day it weaves so much that you cannot stay in the bike lane. Nobody would call that a good bike. "It does not fall over" and "it does the job" are two different promises.

Control engineers have the same two promises. A vehicle that stays stable across its whole uncertainty set, but misses its [[pointing requirement|pointing-requirement]] on half the plants in that set, has not been designed. It has been certified not to break. Every specification in a requirements document — settling time, disturbance rejection, steady-state error, jitter — is a *performance* specification. Every one of them must hold for the real vehicle, not only for the nominal model. That is the gap between **robust stability** and **robust performance**, and it is much bigger than the words suggest.

You can see the gap in one line of algebra. Robust stability asks that the denominator $1 + L_p$ never becomes zero. Robust performance asks that $1/(1 + L_p)$ stays *small*, which is a demand on how far from zero that denominator stays. A loop can be comfortably far from instability on every plant in the set and still let a disturbance through at ten times the allowed size on the worst one.

This lesson defines three tests — nominal performance, robust stability, robust performance. It derives the exact single-loop robust performance condition, shows two consequences that limit every design before a controller is even chosen, and sets up the multivariable version as a $\mu$ test with an imaginary "performance block".

## Three questions

Fix two things first.

- An **uncertainty set** $\Pi$ ("pi"): every plant $G_p$ the real hardware might turn out to be, described by an uncertainty weight $W_I$.
- A **performance weight** $W_P$ that encodes the specification as $\lvert W_PS\rvert < 1$, exactly like $W_1$ in the mixed-sensitivity lesson.

Then there are three questions you can ask.

- **Nominal performance (NP):** $\lVert W_PS\rVert_\infty < 1$. The specification holds for the nominal plant.
- **Robust stability (RS):** the loop is stable for every $G_p \in \Pi$ ("G p in Pi"). For output multiplicative uncertainty, that is $\lVert W_IT\rVert_\infty < 1$.
- **Robust performance (RP):** $\lVert W_PS_p\rVert_\infty < 1$ for every $G_p \in \Pi$, where $S_p = (1 + G_pK)^{-1}$ is the sensitivity of the *perturbed* loop.

::: key Robust stability vs robust performance
**RS**: stable for every plant in the set. **RP**: the performance specification is met for every plant in the set. RP is an RS test on an augmented system with a fictitious performance block, so it is strictly harder.
:::

RP implies both of the others. It contains NP as the special case $G_p = G$. And a plant on which the loop was unstable would give an infinite $\lVert W_PS_p\rVert_\infty$, so RP rules that out too. The reverse is false — routinely, and by large factors. That is what the rest of this lesson is about.

## The exact single-loop condition

Take a single loop. The true plant is the nominal plant with a multiplicative error, $G_p = (1 + W_I\Delta)G$, where $\Delta$ ("delta") is any stable perturbation with $\lvert\Delta\rvert \le 1$. The perturbed loop gain is then $L_p = L(1 + W_I\Delta)$. Work on the denominator of $S_p$.

**Step 1.** Multiply out: $1 + L_p = 1 + L + LW_I\Delta$.

**Step 2.** Pull out the factor $(1 + L)$:

$$1 + L_p = (1 + L)\left(1 + \frac{L}{1+L}W_I\Delta\right) = (1 + L)(1 + W_IT\Delta),$$

because $L/(1 + L)$ is the complementary sensitivity $T$.

**Step 3.** Flip it over. Since $S = 1/(1 + L)$,

$$S_p = \frac{S}{1 + W_IT\Delta}, \qquad \lvert W_PS_p\rvert = \frac{\lvert W_PS\rvert}{\lvert 1 + W_IT\Delta\rvert}.$$

**Step 4: the worst case.** The top does not depend on $\Delta$. The bottom is a number $1 + W_IT\Delta$ that can sit anywhere in a [[disk centred on 1|worst-case-disk]] with radius $\lvert W_IT\rvert$. The worst $\Delta$ makes the bottom as small as possible, by pointing $W_IT\Delta$ straight at $-1$. Then $\lvert 1 + W_IT\Delta\rvert = 1 - \lvert W_IT\rvert$, which is positive exactly when robust stability holds. So

$$\sup_{\lvert\Delta\rvert\le 1}\lvert W_PS_p\rvert = \frac{\lvert W_PS\rvert}{1 - \lvert W_IT\rvert}.$$

**Step 5.** Require this to be below one at every frequency: $\lvert W_PS\rvert < 1 - \lvert W_IT\rvert$. Move the second term across:

::: key Robust performance, single loop
$$\lvert W_P(j\omega)S(j\omega)\rvert + \lvert W_I(j\omega)T(j\omega)\rvert < 1 \qquad\text{for every }\omega .$$

Nominal performance is the first term below one, robust stability the second below one, and robust performance the *sum* below one.
:::

The sum form makes the difficulty easy to see. A design with $\lVert W_PS\rVert_\infty = 0.9$ and $\lVert W_IT\rVert_\infty = 0.9$ passes both separate tests with ten percent to spare each. It can still fail robust performance by eighty percent ($0.9 + 0.9 = 1.8$), if the two peaks sit near the same frequency. And they usually do, because both peaks live near [[crossover|crossover]]. That is where $\lvert S\rvert$ has stopped being small, $\lvert T\rvert$ has not yet started being small, and the uncertainty weight is on its way up.

## Two structural consequences

### RP is impossible where both weights exceed one

At every frequency $S + T = 1$. The [[triangle inequality|triangle-inequality]] then says $\lvert S\rvert + \lvert T\rvert \ge \lvert S + T\rvert = 1$. Use it:

$$\lvert W_PS\rvert + \lvert W_IT\rvert \ \ge\ \min(\lvert W_P\rvert, \lvert W_I\rvert)\,(\lvert S\rvert + \lvert T\rvert) \ \ge\ \min(\lvert W_P\rvert, \lvert W_I\rvert).$$

(The first step replaces each weight by the smaller of the two, which can only shrink the left side.) So a condition you need for robust performance, *whatever the controller*, is

$$\min(\lvert W_P(j\omega)\rvert, \lvert W_I(j\omega)\rvert) < 1 \quad\text{at every frequency}.$$

In words: you may demand tight performance where the model is good, or accept large uncertainty where you demand nothing — but never both at the same frequency. Checking this takes two Bode magnitude plots and no design work. It is the first thing to do when a specification and an uncertainty budget land on your desk on the same day.

### The sensitivity peak is usually the binding quantity

With the standard weight $W_P = (s/M + \omega_B)/(s + \omega_BA)$, $\lvert W_P\rvert \to 1/M$ at high frequency. So near and above crossover the first term is about $\lVert S\rVert_\infty/M$. A design with $M = 2$ and a sensitivity peak of $1.5$ spends $1.5/2 = 0.75$ of its robust performance budget on peaking alone, leaving only $0.25$ for the uncertainty term. [[Damping the loop|damping]] is therefore often a better route to robust performance than slowing it down.

::: example A design that passes both tests and fails the real one
**The plant and controller.** One spacecraft axis, $G = 1/(120s^2)$. The controller is $K(s) = (k_ds + k_p)/(1 + s/80)^2$, sized for $\omega_n = 10\,\mathrm{rad/s}$ and $\zeta = 0.7$. So $k_p = 120\times 10^2 = 12\,000$ and $k_d = 2\times 0.7\times 10\times 120 = 1680$.

**The weights.** Uncertainty: the actuator weight $W_I = (0.016s + 0.2)/(0.0064s + 1)$, which is $0.2$ ($20\,\%$) at low frequency and rises toward $2.5$. Performance: $W_P = (s/2 + 6)/(s + 0.006)$, asking for a sensitivity crossover near $6\,\mathrm{rad/s}$ and a peak below $2$.

**The two separate tests.** Both are comfortable:

$$\lVert W_PS\rVert_\infty = 0.879\ \text{at}\ 17.0\,\mathrm{rad/s}, \qquad \lVert W_IT\rVert_\infty = 0.422\ \text{at}\ 14.3\,\mathrm{rad/s}.$$

Nominal performance passes with twelve percent to spare. Robust stability passes by a factor of $1/0.422 = 2.4$.

**The real test.** The two peaks are only $2.7\,\mathrm{rad/s}$ apart, which at these bandwidths is no separation at all. At $16.05\,\mathrm{rad/s}$ the two terms are $0.877$ and $0.417$. Their sum is the [[robust performance peak|rp-curves]]:

$$\lVert\,\lvert W_PS\rvert + \lvert W_IT\rvert\,\rVert_\infty = 1.294,$$

so robust performance fails by twenty-nine percent.

**What that means on the worst plant.** Use the worst-case formula at that frequency: $\lvert W_PS_p\rvert = 0.877/(1 - 0.417) = 0.877/0.583 = 1.50$. On the worst plant in the set, the disturbance-rejection specification is missed by a factor of $1.5$.

**Sanity check.** $1.50$ is bigger than the nominal $0.877$, as it must be: the worst plant can only be worse than the nominal one. The nominal design met the specification with room.
:::

## The multivariable version: a fictitious performance block

The trick that makes robust performance computable is to notice that "the weighted error stays small for every input" is itself a small gain statement.

Here is the idea. Imagine a [[fictitious|fictitious-block]] full complex block $\boldsymbol{\Delta}_P$ that takes the weighted error $z_P$ and feeds it back in as the outside input $w$, with $\lVert\boldsymbol{\Delta}_P\rVert_\infty \le 1$. By the small gain theorem, this imaginary loop is stable for every such $\boldsymbol{\Delta}_P$ if and only if the performance channel has H-infinity norm below one. So "performance is met" and "the imaginary loop is stable" are the same statement. Now put the real uncertainty and the imaginary block side by side, and ask for stability against both at once:

::: key Robust performance as a mu test
Write the closed loop as $\mathbf{N} = \mathcal{F}_l(\mathbf{P},\mathbf{K})$, split so that $\mathbf{N}_{11}$ sees the real uncertainty and $\mathbf{N}_{22}$ is the weighted performance channel. With the augmented structure $\hat{\boldsymbol{\Delta}} = \operatorname{diag}(\boldsymbol{\Delta}, \boldsymbol{\Delta}_P)$ and $\boldsymbol{\Delta}_P$ a full complex block,

$$\text{RP} \iff \sup_\omega\ \mu_{\hat{\boldsymbol{\Delta}}}\big(\mathbf{N}(j\omega)\big) < 1 .$$

RS alone is $\sup_\omega\mu_{\boldsymbol{\Delta}}(\mathbf{N}_{11}) < 1$; NP alone is $\sup_\omega\bar{\sigma}(\mathbf{N}_{22}) < 1$.
:::

For a single loop this gives back the sum condition exactly. Doing the derivation shows where the sum comes from. Take output multiplicative uncertainty with $\boldsymbol{\Delta}$ a scalar $\delta$, and the weight placed on the input side of the uncertainty:

$$\mathbf{N} = \begin{pmatrix}-W_IT & -T \\ W_PSW_I & W_PS\end{pmatrix}, \qquad \hat{\boldsymbol{\Delta}} = \operatorname{diag}(\delta, \delta_P).$$

**Step 1: expand the determinant.**

$$\det(\mathbf{I} - \mathbf{N}\hat{\boldsymbol{\Delta}}) = 1 - N_{11}\delta - N_{22}\delta_P + (N_{11}N_{22} - N_{12}N_{21})\delta\delta_P .$$

**Step 2: the bracket is zero.** $(-W_IT)(W_PS) - (-T)(W_PSW_I) = -W_IW_PTS + W_IW_PTS = 0$. The matrix is [[rank one|rank-one]].

**Step 3: find the smallest pair.** So the determinant vanishes when $N_{11}\delta + N_{22}\delta_P = 1$. Give both perturbations the same size $r$ and turn their phases so both terms point the same way. Then $r(\lvert N_{11}\rvert + \lvert N_{22}\rvert) = 1$, so the smallest pair has $\lvert\delta\rvert = \lvert\delta_P\rvert = 1/(\lvert N_{11}\rvert + \lvert N_{22}\rvert)$. Hence

$$\mu_{\hat{\boldsymbol{\Delta}}}(\mathbf{N}) = \lvert N_{11}\rvert + \lvert N_{22}\rvert = \lvert W_IT\rvert + \lvert W_PS\rvert,$$

the sum condition, derived a second way.

**Checking it on the failing design.** Evaluate $\mathbf{N}$ at $16.05\,\mathrm{rad/s}$ and run a scaling computation: it returns $\mu = 1.2943$, agreeing with the sum to fourteen digits. Meanwhile $\bar{\sigma}(\mathbf{N}) = 1.639$ at the same frequency. Even here — two scalar blocks, the simplest structure there is — the unstructured test overstates the shortfall by twenty-seven percent ($1.639/1.294 = 1.27$). On a real multivariable problem the gap is larger, and $\mu$ is the only honest number.

A related quantity worth knowing by name is **skewed $\mu$**, written $\mu_s$. Ordinary $\mu$ asks "is performance met for the whole uncertainty set?" and returns a scaled yes-or-no. Skewed $\mu$ holds the performance block at size one and asks how far the *uncertainty* can be scaled up or down before performance is lost. That is usually the number a programme actually wants: not "did we pass" but "by how much".

::: example Fixing it, and what the fix costs
**Diagnose.** The failing design has $\lVert S\rVert_\infty = 1.488$. With $M = 2$ in the performance weight, that peak alone contributes about $1.488/2 = 0.744$ to the robust performance sum near crossover, leaving almost nothing for the uncertainty term.

**The natural first move barely helps.** Lower $\omega_B$ in $W_P$ from $6$ to $2\,\mathrm{rad/s}$. The sum only drops from $1.294$ to $1.153$ — still a fail. Why so little? The peak of the sum sits above $\omega_B$, where $\lvert W_P\rvert$ has already flattened out at $1/M$, and lowering $\omega_B$ does not touch that level.

**Attack the peak instead.** Raise the damping to $\zeta = 0.9$ (so $k_d = 2\times 0.9\times 10\times 120 = 2160$), and replace the second-order roll-off at $80\,\mathrm{rad/s}$ with a first-order roll-off at $300\,\mathrm{rad/s}$. Keep $\omega_n = 10\,\mathrm{rad/s}$ and $\omega_B = 6\,\mathrm{rad/s}$. Then

$$\lVert S\rVert_\infty = 1.052, \quad \lVert T\rVert_\infty = 1.195, \quad \lVert W_PS\rVert_\infty = 0.532, \quad \lVert W_IT\rVert_\infty = 0.312,$$

and the robust performance sum peaks at $0.837$ at $25.9\,\mathrm{rad/s}$. That is a pass with sixteen percent to spare, at the *same* bandwidth as the failing design.

**Sanity check.** The sum's peak ($0.837$) is less than the two separate peaks added ($0.532 + 0.312 = 0.844$), as it must be, because the two separate peaks happen at different frequencies.

**What it cost.** High-frequency roll-off. The controller now has one pole of attenuation above $300\,\mathrm{rad/s}$ instead of two above $80\,\mathrm{rad/s}$. It passes more sensor noise to the actuator and offers less protection against unmodelled [[structural modes|structural-modes]] above a few hundred rad/s. That is the real trade, and the robust performance number found it. Slowing the loop down would have been the wrong answer.
:::

::: warning Robust performance is not robust stability with a smaller number
It is tempting to "allow for performance" by requiring $\lVert W_IT\rVert_\infty < 0.5$ instead of $1$. That is neither enough nor needed. Not enough, because a large nominal $\lvert W_PS\rvert$ can break the sum on its own. Not needed, because in a band where the performance term is tiny, $\lvert W_IT\rvert$ may go all the way to $0.95$. Compute the sum, or compute $\mu$ on the augmented structure. No single derating factor — a fixed safety discount applied to one test — substitutes for either.
:::

## Check yourself

::: check
At $4\,\mathrm{rad/s}$ a design has $\lvert W_PS\rvert = 0.62$ and $\lvert W_IT\rvert = 0.55$. Does it meet robust performance there? What is the achieved performance on the worst plant in the set?
:::

::: answer
The sum is $0.62 + 0.55 = 1.17$, so robust performance fails at that frequency by seventeen percent, even though both separate tests pass. The worst-case performance is $\lvert W_PS_p\rvert = \lvert W_PS\rvert/(1 - \lvert W_IT\rvert) = 0.62/(1 - 0.55) = 0.62/0.45 = 1.38$. On the worst plant the specification is missed by a factor of $1.38$.

Notice how touchy that is. If $\lvert W_IT\rvert$ were $0.75$ instead, the worst case would be $0.62/0.25 = 2.48$. The denominator $1 - \lvert W_IT\rvert$ is the distance to instability, and performance gets worse and worse, faster and faster, as that distance closes.
:::

::: check
A requirements document asks for $\lvert S\rvert < 0.1$ up to $30\,\mathrm{rad/s}$, and the actuator uncertainty weight reaches $1$ at $20\,\mathrm{rad/s}$. Comment before doing any design.
:::

::: answer
The performance requirement means $\lvert W_P\rvert > 10$ up to $30\,\mathrm{rad/s}$. The uncertainty weight is above $1$ from $20\,\mathrm{rad/s}$ upward. So from $20$ to $30\,\mathrm{rad/s}$ both weights exceed one, $\min(\lvert W_P\rvert, \lvert W_I\rvert) > 1$, and robust performance is impossible for *any* controller.

Nothing needs to be designed to know this; two magnitude plots settle it. The conversation to have is which number moves. Either tighten the actuator specification so $\lvert W_I\rvert$ crosses one above $30\,\mathrm{rad/s}$, or relax the performance bandwidth to below $20\,\mathrm{rad/s}$. This check catches a surprising number of requirement sets before a programme spends months failing to meet them.
:::

::: check
Why is the matrix $\mathbf{N}$ in the single-loop robust performance problem rank one? What would change if the uncertainty were at the plant input instead of the output?
:::

::: answer
The four entries are $-W_IT$, $-T$, $W_PSW_I$ and $W_PS$. The second column is the first divided by $W_I$, so $\mathbf{N}$ is a column times a row: $\mathbf{N} = \begin{pmatrix}-T \\ W_PS\end{pmatrix}\begin{pmatrix}W_I & 1\end{pmatrix}$. A column times a row is rank one. Its determinant is zero, so the $\delta\delta_P$ term in $\det(\mathbf{I} - \mathbf{N}\hat{\boldsymbol{\Delta}})$ disappears — and that is what makes $\mu$ exactly the sum of the two diagonal magnitudes.

For a *scalar* plant, moving the uncertainty to the input changes nothing, because scalars commute and $T_I = T$. For a multivariable plant it changes everything. $\mathbf{T}_I \ne \mathbf{T}$, the matching $\mathbf{N}$ is not rank one, the sum formula fails, and $\mu$ must be computed numerically on the augmented structure.
:::

::: check
Explain, using the shape of the performance weight, why damping the loop can improve robust performance more than slowing it down.
:::

::: answer
With $W_P = (s/M + \omega_B)/(s + \omega_BA)$, the magnitude flattens to $1/M$ above about $\omega_B$. The peak of the robust performance sum almost always sits near or above crossover, which is above $\omega_B$. There the performance term is about $\lvert S\rvert/M$, so it is set by the *sensitivity peak*, not by $\omega_B$.

Lowering $\omega_B$ moves the corner of the weight down but leaves the high-frequency level at $1/M$ untouched. So the sum at the critical frequency barely improves: the worked example saw $1.294$ fall only to $1.153$ for a threefold cut in $\omega_B$. Reducing $\lVert S\rVert_\infty$ from $1.49$ to $1.05$ instead took the sum to $0.837$ at unchanged bandwidth. Peak sensitivity is the currency of robust performance.
:::

::: check
A programme reports RS with $\mu = 0.6$ and RP with $\mu = 1.4$. A junior engineer suggests reporting only the RS figure, because "stability is the safety-critical property". How do you respond?
:::

::: answer
Stability is necessary, not sufficient, and the RP figure is telling you something specific: there is a plant in the modelled set on which the loop is stable but the weighted performance is missed by a factor of $1.4$. If the performance weight encodes a pointing requirement, that is a mission failure rather than a lost vehicle — but it is still a failure, and it will be found in flight instead of in analysis.

The right report carries both numbers with their weights, plus the skewed-$\mu$ figure saying what fraction of the modelled uncertainty *can* be tolerated while still meeting performance. And if the performance weight was written more aggressively than the real requirement — common, because designers add margin into weights — the right action is to rewrite the weight to match the requirement and rerun, not to drop the test.
:::

## Summary

| Item | Statement |
| --- | --- |
| Nominal performance | $\lVert W_PS\rVert_\infty < 1$ |
| Robust stability | stable for every plant in $\Pi$; output multiplicative: $\lVert W_IT\rVert_\infty < 1$ |
| Robust performance | $\lVert W_PS_p\rVert_\infty < 1$ for every plant in $\Pi$; implies NP and RS, strictly stronger |
| Worst-case performance | $\sup_{\lvert\Delta\rvert\le1}\lvert W_PS_p\rvert = \lvert W_PS\rvert/(1 - \lvert W_IT\rvert)$ |
| Single-loop RP test | $\lvert W_PS\rvert + \lvert W_IT\rvert < 1$ at every frequency |
| Necessary condition | $\min(\lvert W_P\rvert, \lvert W_I\rvert) < 1$ at every frequency, for any controller |
| MIMO RP test | $\sup_\omega\mu_{\hat{\boldsymbol{\Delta}}}(\mathbf{N}) < 1$ with $\hat{\boldsymbol{\Delta}} = \operatorname{diag}(\boldsymbol{\Delta}, \boldsymbol{\Delta}_P)$, $\boldsymbol{\Delta}_P$ a full fictitious block |
| Rank-one structure | single-loop $\mathbf{N}$ is rank one, giving $\mu = \lvert W_IT\rvert + \lvert W_PS\rvert$ exactly |
| Skewed $\mu$ | fixes the performance block and scales the uncertainty: "by how much", not "did we pass" |
| Worked failure | NP $= 0.879$, RS $= 0.422$, RP $= 1.294$; worst-plant performance $0.877/(1-0.417) = 1.50$ |
| Worked fix | raise $\zeta$ to $0.9$, roll off later: $\lVert S\rVert_\infty$ from $1.488$ to $1.052$, RP from $1.294$ to $0.837$ |

The next lesson goes back to the multivariable machinery the last two tests rely on, and asks what a singular value of a transfer *matrix* actually means for a vehicle with three coupled axes.

::: context pointing-requirement What a pointing requirement looks like
A space telescope has to hold its aim while a camera exposure runs. The Hubble Space Telescope's pointing-stability requirement is usually quoted as $0.007$ arcseconds (an arcsecond is $1/3600$ of a degree) — about the angle of a dime seen from $500$ kilometres away. Staying stable is only the start. The hard part is keeping the leftover wobble inside that tiny number despite reaction-wheel noise, structural flexing and a model that is never perfect; Hubble's first solar arrays shook the telescope every time it passed between sunlight and shadow. That is a robust *performance* problem.
:::

::: context worst-case-disk The worst perturbation, as a picture
For each possible $\Delta$ with $\lvert\Delta\rvert \le 1$, the number $1 + W_IT\Delta$ lands somewhere in a disk centred on $1$ with radius $\lvert W_IT\rvert$. Drawn here for the failing design at $16.05\,\mathrm{rad/s}$, where the radius is $0.417$. The point of the disk closest to zero is at distance $1 - 0.417 = 0.583$, and that is the smallest the denominator can be.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="10" x2="60" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="210" cy="85" r="62.55" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="60" cy="85" r="4" fill="#1f2a44"/>
  <circle cx="210" cy="85" r="4" fill="#1f2a44"/>
  <circle cx="147.45" cy="85" r="4" fill="#b4232c"/>
  <line x1="60" y1="100" x2="147.45" y2="100" stroke="#b4232c" stroke-width="2"/>
  <text x="104" y="116" font-size="12" fill="#b4232c" text-anchor="middle">0.583</text>
  <line x1="210" y1="85" x2="254.2" y2="40.8" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="248" y="62" font-size="12" fill="#1f2a44">0.417</text>
  <text x="60" y="78" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="214" y="102" font-size="12" fill="#1f2a44">1</text>
  <text x="262" y="164" font-size="11" fill="#1d6fd1" text-anchor="middle">all possible 1 + W_I T Δ</text>
</svg>
```

If the radius reached $1$, the disk would touch zero: the loop could go unstable. That is the robust stability test hiding inside the robust performance one.
:::

::: context crossover Why the trouble gathers at crossover
**Crossover** is the frequency where the loop gain $\lvert L\rvert$ falls through one. Well below it, $\lvert L\rvert$ is huge, so $S$ is tiny and $T$ is about one. Well above it, $\lvert L\rvert$ is tiny, so $S$ is about one and $T$ is tiny. Only near crossover are *both* $S$ and $T$ of ordinary size at the same time — and the uncertainty weight, rising with frequency, is usually mid-way up there too. So the two terms of the robust performance sum tend to peak close together.
:::

::: context triangle-inequality Two arrows that add to one
At any one frequency, $S$ and $T$ are two complex numbers — two arrows in a plane — and they always add up to exactly $1$. Walking along two sides of a triangle is never shorter than going straight across, so the lengths $\lvert S\rvert + \lvert T\rvert$ are at least $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="282" y2="110" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="290,110 278,104 278,116" fill="#1f2a44"/>
  <text x="165" y="130" font-size="12" fill="#1f2a44" text-anchor="middle">S + T = 1</text>
  <line x1="40" y1="110" x2="167" y2="40.7" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="177.5,35 164.1,35.5 169.8,46.0" fill="#1d6fd1"/>
  <text x="96" y="62" font-size="13" fill="#1d6fd1">S</text>
  <line x1="177.5" y1="35" x2="280" y2="103.3" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="290,110 276.7,108.3 283.3,98.3" fill="#b4232c"/>
  <text x="242" y="62" font-size="13" fill="#b4232c">T</text>
</svg>
```

Here $S = 0.55 + 0.3j$ and $T = 0.45 - 0.3j$, with lengths $0.63$ and $0.54$: together $1.17$, more than $1$.
:::

::: context damping What damping does to the peak
The damping ratio $\zeta$ ("zeta") says how quickly a loop's ringing dies away. Low damping means a response that overshoots and rings; in the frequency domain it shows up as a tall hump in $\lvert S\rvert$ and $\lvert T\rvert$ near crossover. Raising $\zeta$ from $0.7$ to $0.9$ flattens that hump. The loop can keep the same speed while being much less touchy, which is exactly what the sum near crossover rewards.
:::

::: context rp-curves The two terms and their sum
The failing design across frequency. Blue is $\lvert W_PS\rvert$, orange is $\lvert W_IT\rvert$, red is their sum. Both separate curves stay under the dashed line at $1$; their sum pokes through it near $16\,\mathrm{rad/s}$, peaking at $1.294$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4,3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="36" y="174">0</text><text x="36" y="124">0.5</text><text x="36" y="74">1</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="186">0.1</text><text x="115" y="186">1</text><text x="190" y="186">10</text><text x="265" y="186">100</text><text x="336" y="186">1000</text></g>
  <text x="190" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">frequency, rad/s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,169.4 55.0,169.0 70.0,168.5 85.0,167.6 100.0,166.2 115.0,164.0 130.0,160.4 145.0,154.6 152.5,150.3 160.0,144.8 167.5,137.5 175.0,127.8 182.5,115.3 190.0,101.0 197.5,88.5 205.0,82.4 212.5,83.4 220.0,88.4 227.5,94.7 235.0,100.9 242.5,106.5 250.0,111.1 257.5,114.5 265.0,116.9 280.0,119.2 295.0,119.8 310.0,120.0 340.0,120.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,150.0 85.0,150.0 115.0,149.7 130.0,149.3 145.0,148.4 152.5,147.4 160.0,146.0 167.5,143.8 175.0,140.7 182.5,136.5 190.0,131.8 197.5,128.3 205.0,128.2 212.5,131.1 220.0,135.6 227.5,140.5 235.0,145.5 242.5,150.3 250.0,154.8 257.5,158.8 265.0,162.2 280.0,166.7 295.0,168.9 310.0,169.7 340.0,170.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,149.4 55.0,149.0 70.0,148.5 85.0,147.6 100.0,146.1 115.0,143.7 130.0,139.7 145.0,132.9 152.5,127.8 160.0,120.8 167.5,111.3 175.0,98.5 182.5,81.8 190.0,62.8 197.5,46.8 205.0,40.6 212.5,44.5 220.0,54.0 227.5,65.2 235.0,76.4 242.5,86.8 250.0,95.8 257.5,103.3 265.0,109.0 280.0,115.9 295.0,118.7 310.0,119.6 340.0,120.0"/>
  <text x="205" y="33" font-size="11" fill="#b4232c" text-anchor="middle">sum 1.294</text>
  <text x="300" y="112" font-size="11" fill="#1d6fd1" text-anchor="middle">|W_P S|</text>
  <text x="300" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">|W_I T|</text>
</svg>
```
:::

::: context fictitious-block An imaginary opponent for performance
"Fictitious" means made-up on purpose. Nobody thinks the error signal is really fed back into the disturbance input. The block is a thinking tool: it turns the question "is this output always small?" into the question "is this loop always stable?", which the small gain theorem and $\mu$ already know how to answer. One tool then handles stability and performance together.
:::

::: context rank-one What "rank one" means
A matrix has **rank one** when every column is a multiple of the same single column. It can then be written as one column times one row. Such a matrix squashes every input onto one direction, so it has only one nonzero singular value, and every $2\times 2$ determinant inside it is zero. That zero is what kills the cross term here.
:::

::: context structural-modes Why roll-off protects the structure
A spacecraft is not rigid: its panels, booms and tanks flex at their own frequencies, often tens to hundreds of rad/s. A controller that still has gain up there can push energy into those modes and shake them up. Roll-off — the controller's gain falling away at high frequency — is the insurance. Trading two poles of roll-off at $80\,\mathrm{rad/s}$ for one at $300\,\mathrm{rad/s}$ spends some of that insurance, so the flexible model has to be checked again before the fix is accepted.
:::
