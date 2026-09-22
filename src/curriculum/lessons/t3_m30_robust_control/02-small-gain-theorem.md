---
id: l02-small-gain-theorem
title: The small gain theorem
minutes: 21
covers:
  - The small gain theorem and its exact hypotheses
---

You now have a set of plants and a weight that bounds it. The question the rest of the module answers in more and more refined ways is: does one controller stabilise every plant in that set? The small gain theorem is the first and bluntest answer, and it is the one every later test specialises. It says that a feedback loop around a bounded uncertainty cannot go unstable if the loop gain the uncertainty sees is less than one at every frequency.

That sounds almost too simple to be useful, and the reason it is useful is the rearrangement that precedes it. Whatever the uncertainty description — additive, multiplicative at either end, parametric pulled out as a block — the whole closed loop can be redrawn as exactly two blocks in feedback: the unknown $\boldsymbol{\Delta}$, and a known stable transfer matrix $\mathbf{M}$ containing the nominal plant, the controller and the weights. All the robust-stability information is in $\lVert\mathbf{M}\rVert_\infty$, a single number computed from things you know.

This lesson does the rearrangement for the three standard uncertainty forms, states the theorem with its hypotheses spelled out and proves it in three lines, and then spends the rest of its length on the two things engineers get wrong: that the theorem is only sufficient, and that the conservatism has identifiable, quantifiable causes rather than being a vague unease.

## Pulling the block out

Take the output multiplicative description $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})\mathbf{G}$, close a controller $\mathbf{K}$ in negative feedback, and set the external inputs to zero — stability does not care about them. Write $z$ for the signal entering $\boldsymbol{\Delta}$ and $v = \boldsymbol{\Delta}z$ for the signal leaving it. The plant output is

$$y = \mathbf{G}u + \mathbf{W}v, \qquad z = \mathbf{G}u, \qquad u = -\mathbf{K}y.$$

Substituting $u$ into the first equation, $(\mathbf{I} + \mathbf{G}\mathbf{K})y = \mathbf{W}v$, so $y = \mathbf{S}\mathbf{W}v$ with $\mathbf{S} = (\mathbf{I} + \mathbf{G}\mathbf{K})^{-1}$ the nominal sensitivity. Then

$$z = -\mathbf{G}\mathbf{K}y = -\mathbf{G}\mathbf{K}\mathbf{S}\mathbf{W}v = -\mathbf{T}\mathbf{W}v,$$

where $\mathbf{T} = \mathbf{G}\mathbf{K}(\mathbf{I} + \mathbf{G}\mathbf{K})^{-1}$ is the nominal complementary sensitivity. So the loop seen by the uncertainty is $\mathbf{M} = -\mathbf{T}\mathbf{W}$, and since a sign is absorbed by $\boldsymbol{\Delta}$, the size that matters is $\lVert\mathbf{W}\mathbf{T}\rVert_\infty$.

The same two lines give the other cases. For **additive** uncertainty $\mathbf{G}_p = \mathbf{G} + \mathbf{W}\boldsymbol{\Delta}$ the block sees the control signal, $z = u$, and $u = -\mathbf{K}(\mathbf{G}u + \mathbf{W}v)$ gives $\mathbf{M} = -\mathbf{K}\mathbf{S}\mathbf{W}$. For **input multiplicative** uncertainty $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})$ the block sits between controller and plant and $\mathbf{M} = -\mathbf{T}_I\mathbf{W}$ with $\mathbf{T}_I = \mathbf{K}\mathbf{G}(\mathbf{I} + \mathbf{K}\mathbf{G})^{-1}$, the **input** complementary sensitivity. For a SISO plant $T_I = T$; for a multivariable plant they are different matrices with different singular values, and confusing them is the commonest slip in the subject.

::: key The three standard robust stability tests
With $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ and a nominally stable loop: additive $\mathbf{G}_p = \mathbf{G} + \mathbf{W}\boldsymbol{\Delta}$ needs $\lVert\mathbf{W}\mathbf{K}\mathbf{S}\rVert_\infty < 1$; output multiplicative $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})\mathbf{G}$ needs $\lVert\mathbf{W}\mathbf{T}\rVert_\infty < 1$; input multiplicative $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})$ needs $\lVert\mathbf{W}\mathbf{T}_I\rVert_\infty < 1$. Where the uncertainty is large, the corresponding closed-loop map must be small.
:::

## The theorem

::: key Small gain theorem
Let $\mathbf{M}$ and $\boldsymbol{\Delta}$ both be stable, connected in feedback so that $z = \mathbf{M}v$, $v = \boldsymbol{\Delta}z$, with the interconnection well posed. If

$$\lVert\mathbf{M}\rVert_\infty\,\lVert\boldsymbol{\Delta}\rVert_\infty < 1$$

then the closed loop is internally stable. With $\boldsymbol{\Delta}$ normalised to $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ the condition is $\lVert\mathbf{M}\rVert_\infty < 1$. The condition is sufficient in general, and also necessary when $\boldsymbol{\Delta}$ ranges over *all* stable perturbations of that norm bound, with no structure imposed.
:::

The proof is short enough to carry in your head. The closed loop is governed by $(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})^{-1}$; internal stability means this inverse exists and is itself a stable transfer matrix. Because $\lVert\mathbf{M}\boldsymbol{\Delta}\rVert_\infty \le \lVert\mathbf{M}\rVert_\infty\lVert\boldsymbol{\Delta}\rVert_\infty = \gamma < 1$ — the H-infinity norm is submultiplicative — the Neumann series

$$(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})^{-1} = \mathbf{I} + \mathbf{M}\boldsymbol{\Delta} + (\mathbf{M}\boldsymbol{\Delta})^2 + \cdots$$

has terms of norm at most $\gamma^k$ and therefore converges absolutely. Each term is stable, the space of stable transfer matrices is closed under this kind of limit, so the sum is stable. Done.

The necessity direction is a construction. Suppose $\bar{\sigma}(\mathbf{M}(j\omega_0)) = 1$ at some $\omega_0$, with input direction $\mathbf{v}_1$ and output direction $\mathbf{u}_1$ from the singular value decomposition $\mathbf{M}(j\omega_0) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$. Choose $\boldsymbol{\Delta}(j\omega_0) = \mathbf{v}_1\mathbf{u}_1^\mathsf{H}$, which has $\bar{\sigma} = 1$; then $\mathbf{M}\boldsymbol{\Delta}$ has $\mathbf{u}_1$ as an eigenvector with eigenvalue $1$, so $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ is singular at $\omega_0$ and the loop has a pole on the imaginary axis. One then fits a stable rational $\boldsymbol{\Delta}$ of unit norm that takes that value at $\omega_0$ using all-pass factors. That is why the test is exactly tight for unstructured uncertainty, and why every bit of conservatism you meet later comes from the *set* being smaller than "all complex matrices of norm one", never from the theorem.

## What each hypothesis is doing

**Both blocks stable.** $\mathbf{M}$ stable means the nominal closed loop is already internally stable, which you must establish separately and first. $\boldsymbol{\Delta}$ stable means the perturbation does not itself introduce right-half-plane poles; equivalently, every plant in the set has the same number of right-half-plane poles as the nominal. This is a real restriction. A multiplicative weight cannot describe a booster whose aerodynamic instability disappears above the atmosphere, because that plant has a different unstable pole count; an inverse multiplicative or coprime-factor description can.

**Well-posedness.** $(\mathbf{I} - \mathbf{M}(\infty)\boldsymbol{\Delta}(\infty))$ must be invertible, so that the algebraic loop has a solution. In practice this holds whenever one of the two blocks is strictly proper, which is almost always.

**Strict inequality.** At $\lVert\mathbf{M}\rVert_\infty = 1$ exactly, the construction above puts a closed-loop pole on the imaginary axis: marginal, not stable. Reporting a peak of $1.00$ as "passes" is wrong, and reporting $0.999$ as "passes comfortably" is worse.

**No structure assumed.** The theorem treats $\boldsymbol{\Delta}$ as a full block. If your real uncertainty is three independent actuator scale factors, the theorem still applies — a diagonal $\boldsymbol{\Delta}$ is one of the matrices it allows — but it is answering a harder question than you asked, and it may answer "no" when the honest answer is "yes".

::: warning Nominal stability is a precondition, not a consequence
The small gain theorem says nothing about whether your loop is stable for the nominal plant. If $\mathbf{M}$ is unstable, $\lVert\mathbf{M}\rVert_\infty$ is infinite and the test is vacuous; worse, a numerical routine that evaluates $\bar{\sigma}(\mathbf{M}(j\omega))$ on a grid will happily return a finite peak for an unstable $\mathbf{M}$ and mislead you completely. Check closed-loop pole locations first, then compute the norm.
:::

## The test read as a design rule

Write the output multiplicative test at a single frequency: $\lvert W(j\omega)T(j\omega)\rvert < 1$, that is

$$\lvert T(j\omega)\rvert < \frac{1}{\lvert W(j\omega)\rvert}\quad\text{for every }\omega .$$

This is the whole of loop shaping for robustness in one line. Below crossover $\lvert T\rvert \approx 1$, because that is what closing a loop means; above crossover $\lvert T\rvert$ rolls off. So the constraint bites hardest exactly where $\lvert W\rvert$ passes through $1$: at that frequency, and above it, $\lvert T\rvert$ must already be shrinking. The practical statement is that **the loop's crossover frequency cannot exceed the frequency at which the relative uncertainty reaches one hundred percent.** Try to cross over where you do not know the sign of the plant's response and no amount of cleverness will save you.

For the actuator of the previous lesson, $\lvert W\rvert$ reaches $1$ at $66.9\,\mathrm{rad/s}$. That number, derived from a datasheet gain tolerance and a delay budget, is a hard ceiling on closed-loop bandwidth before any controller has been written down.

::: example The rigid axis against its actuator
Take one axis of the three-axis spacecraft as if it were decoupled: $G(s) = 1/(Js^2)$ with $J = 120\,\mathrm{kg\,m^2}$, and the proportional-derivative controller $K(s) = k_d s + k_p$ with $k_p = 40$, $k_d = 90$ that the classical modules produced. The loop is $L = (90s + 40)/(120s^2)$, crossing over at $0.847\,\mathrm{rad/s}$ with $62.3^\circ$ of phase margin, closed-loop $\omega_n = \sqrt{40/120} = 0.577\,\mathrm{rad/s}$ and $\zeta = 0.65$.

Against the weight $W(s) = (0.016s + 0.2)/(0.0064s + 1)$ the peak of $\lvert WT\rvert$ is $0.262$, at $0.46\,\mathrm{rad/s}$, where $\lvert W\rvert = 0.200$ and $\lvert T\rvert = 1.31$. The loop is robustly stable, and with room: you could multiply the whole uncertainty weight by $1/0.262 = 3.8$ and still pass. The reason is visible in the frequencies — the loop crosses over at $0.85\,\mathrm{rad/s}$ while the actuator's relative error is still only twenty percent, and does not reach one hundred percent until $66.9\,\mathrm{rad/s}$, two decades higher. A slow loop is a robust loop, which is exactly why it is a slow loop.

Note also where the peak sits: not at high frequency where $\lvert W\rvert$ is large, but at the resonant peak of $\lvert T\rvert$. The test is a product, and both factors matter.
:::

::: example The bandwidth ceiling, found by the test
Now push the same structure faster, choosing $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$ with $\zeta = 0.7$ and increasing $\omega_n$. The nominal phase margin never changes — it is $65.2^\circ$ for every $\omega_n$, because the loop shape is self-similar — so classical margins report no degradation at all. The robust stability test reports otherwise:

| $\omega_n$ (rad/s) | $k_p$ | $k_d$ | crossover (rad/s) | $\lVert WT\rVert_\infty$ |
| --- | --- | --- | --- | --- |
| 0.577 | 40 | 90 | 0.85 | 0.262 |
| 45 | 243 000 | 7 560 | 69.4 | 0.961 |
| 47.2 | 267 900 | 7 940 | 72.9 | 1.000 |
| 50 | 300 000 | 8 400 | 77.1 | 1.047 |

The ceiling is $\omega_n = 47.2\,\mathrm{rad/s}$, a crossover of $72.9\,\mathrm{rad/s}$ — within ten percent of the $66.9\,\mathrm{rad/s}$ at which $\lvert W\rvert = 1$, as the design rule predicts. Anything faster and the guarantee is gone. That is a design constraint delivered by a twenty percent scale factor and a ten millisecond delay, and no classical margin would have told you about it.
:::

```python
import numpy as np

w = np.logspace(-2, 5, 200001)
s = 1j * w
W = (0.016 * s + 0.2) / (0.0064 * s + 1.0)      # actuator uncertainty weight
J, wn, zeta = 120.0, 50.0, 0.7                  # kg m^2, rad/s, -
kp, kd = J * wn**2, 2 * zeta * wn * J
L = (kd * s + kp) / (J * s**2)                  # PD on one rigid axis
T = L / (1 + L)
peak = np.abs(W * T)
i = int(np.argmax(peak))
print(f"||W T||inf = {peak[i]:.3f} at {w[i]:.1f} rad/s")
delta = -1.0 / (W * T)[i]                       # the perturbation that closes the loop
print(f"needs |Delta| = {abs(delta):.3f} at {np.degrees(np.angle(delta)):.1f} deg")
# ||W T||inf = 1.047 at 69.9 rad/s
# needs |Delta| = 0.955 at 177.3 deg
```

## Where the conservatism lives

A failed small gain test is not a proof of instability. It is the absence of a proof of stability, and the difference matters when a programme is deciding whether to detune a loop. Four things separate the test from the truth.

**Phase.** The theorem lets $\boldsymbol{\Delta}(j\omega)$ have any phase at each frequency independently. Real hardware does not. A gain error contributes no phase at all; a transport delay contributes phase proportional to frequency and nothing else.

**Direction.** For a multivariable plant, $\boldsymbol{\Delta}$ may align its input and output directions with the worst singular vectors of $\mathbf{M}$ at every frequency. A physical error usually acts along a fixed direction set by the hardware layout.

**Structure.** A full block allows cross-coupling between channels that are physically separate. This is the big one on multi-actuator vehicles, and the structured singular value exists to remove it.

**The weight.** Every gap between $\lvert W\rvert$ and the true envelope is conservatism you added yourself when you fitted a low-order rational function over a sampled set.

::: example The perturbation the theorem is afraid of
Return to the $\omega_n = 50$ design, which fails with $\lVert WT\rVert_\infty = 1.047$ at $\omega^* = 69.9\,\mathrm{rad/s}$. The theorem's necessity construction names the culprit: at $\omega^*$, $W(j\omega^*)T(j\omega^*) = 1.046 + 0.049j$, so the perturbation that puts a closed-loop pole on the imaginary axis is

$$\Delta(j\omega^*) = \frac{-1}{W(j\omega^*)T(j\omega^*)} = -0.954 + 0.045j,$$

of magnitude $0.955$ — inside the unit ball, hence admissible — at a phase of $177.3^\circ$. The corresponding plant is $G_p = (1 + W\Delta)G$, and the multiplicative factor it demands is $1 + W(j\omega^*)\Delta(j\omega^*) = 0.405 - 0.792j$: a gain of $0.890$ together with a phase shift of $-62.9^\circ$, both at $69.9\,\mathrm{rad/s}$.

Can the real actuator do that? At $69.9\,\mathrm{rad/s}$ the set $k\,e^{-j\omega\tau}$ with $k \in [0.8, 1.2]$ and $\tau \in [0, 10]\,\mathrm{ms}$ spans gains from $0.8$ to $1.2$ and phases from $0$ to $-\omega\tau = -40.1^\circ$. It cannot reach $-62.9^\circ$. Searching the real two-parameter set at that frequency, the closest it gets to closing the loop is $\lvert 1 + WT\Delta\rvert = 0.349$, attained at $k = 0.82$ and $\tau = 10\,\mathrm{ms}$ — a third of the way to instability, not all of it. Checking the worst sampled plant directly confirms it: $k = 1.2$, $\tau = 10\,\mathrm{ms}$ leaves $16.7^\circ$ of phase margin.

So the $\omega_n = 50$ design is in fact robustly stable against the hardware it will actually fly with, and the small gain theorem cannot say so. That is the price of a test that runs in milliseconds and needs nothing but a norm.
:::

::: warning Sufficient, not necessary
A peak above one means "not proven stable", not "unstable". A peak below one means stable, full stop. Treat the two verdicts asymmetrically: a pass is a guarantee you can put in a review package, a fail is a prompt to either detune, tighten the uncertainty description, or move to a structured analysis. What you must not do is quietly shrink the weight until the number falls below one.
:::

## Check yourself

::: check
A loop has $\lVert WT\rVert_\infty = 0.4$. By what factor can the modelled uncertainty be increased before robust stability is lost, and what does that factor mean physically?
:::

::: answer
Scaling the weight by $c$ scales the peak to $0.4c$, so the guarantee survives until $c = 2.5$. Physically, if the weight said twenty percent relative error at low frequency and one hundred percent at $67\,\mathrm{rad/s}$, the design tolerates fifty percent and two hundred and fifty percent at those frequencies. It is the natural way to report robust-stability margin as a single number, and it is what the structured singular value generalises: $1/\lVert WT\rVert_\infty$ is exactly the unstructured robustness margin, and $1/\mu$ is the structured one.
:::

::: check
Your plant is $G(s) = 10/(s - 2)$, unstable, and you have designed a stabilising controller. A colleague proposes the uncertainty set $G_p = (1 + W\Delta)G$ to model a $\pm 25\,\%$ error in the unstable pole location. What is wrong?
:::

::: answer
Two things. First, a $\pm 25\,\%$ pole shift keeps the pole in the right half plane, so every plant in the intended family has one unstable pole, the same as nominal — that part is consistent with the theorem's hypothesis that $\Delta$ be stable. But second, the multiplicative error $(G_p - G)/G = (s-2)/(s-2.5) - 1 = 0.5/(s - 2.5)$ is itself *unstable*, so it cannot be written as $W\Delta$ with both $W$ and $\Delta$ stable. The multiplicative description fails here for a structural reason, not a numerical one. The correct descriptions are inverse multiplicative, $G_p = G(1 - W\Delta)^{-1}$, or coprime-factor uncertainty, both of which handle a moving unstable pole. This is why launch vehicle models with a varying aerodynamic instability are written in coprime-factor form.
:::

::: check
For the additive test, $\lVert WKS\rVert_\infty < 1$: which part of the controller does this constrain, and why is the constraint felt at high frequency rather than low?
:::

::: answer
$KS$ is the transfer function from reference or disturbance to control signal, so the test bounds *actuator activity* weighted by the additive uncertainty. At low frequency $\lvert S\rvert$ is small, so $\lvert KS\rvert \approx \lvert 1/G\rvert$ — set by the plant, not the controller. At high frequency $\lvert S\rvert \to 1$ and $\lvert KS\rvert \to \lvert K\rvert$, so the test becomes $\lvert K(j\omega)\rvert < 1/\lvert W_A(j\omega)\rvert$: a direct ceiling on controller gain out where the plant model is unknown. A high-gain controller with no roll-off fails the additive test even when it passes the multiplicative one, which is why the two are usually run together, and why the mixed-sensitivity problem of the H-infinity lesson carries a $KS$ channel.
:::

::: check
Two designs are compared. Design A has $\lVert WT\rVert_\infty = 0.95$ with the peak at $2\,\mathrm{rad/s}$, deep inside the control bandwidth; design B has $\lVert WT\rVert_\infty = 0.95$ with the peak at $200\,\mathrm{rad/s}$, far above crossover. Are they equally robust?
:::

::: answer
By this test, yes — both pass with the same margin, and the theorem knows nothing else. In practice they are not equally trustworthy, for reasons outside the test. At $2\,\mathrm{rad/s}$ the uncertainty weight is small (say twenty percent) and $\lvert T\rvert$ must be near five to reach a product of $0.95$, which means a violent resonant peak in the closed loop, a large sensitivity peak alongside it and a poorly damped response. At $200\,\mathrm{rad/s}$ the weight is large and $\lvert T\rvert$ is tiny, which is the normal, healthy shape. Design A is passing the robustness test while failing on nominal performance grounds, and the sensitivity peak $\lVert S\rVert_\infty$ would show it immediately. Never report a single robustness number without the shapes behind it.
:::

::: check
Explain why the small gain theorem is exactly tight for unstructured uncertainty but conservative for a diagonal real $\boldsymbol{\Delta}$, using the necessity construction.
:::

::: answer
The construction picks $\boldsymbol{\Delta}(j\omega_0) = \mathbf{v}_1\mathbf{u}_1^\mathsf{H}$, built from the singular vectors of $\mathbf{M}(j\omega_0)$. That matrix is in general full — every entry nonzero — and complex. If the admissible set is all norm-bounded stable perturbations, it is a member, the loop really does go marginally unstable, and the bound is attained. If the admissible set is diagonal and real, $\mathbf{v}_1\mathbf{u}_1^\mathsf{H}$ is almost never in it: you would need the worst singular vectors to line up with the coordinate axes and the phases to work out to zero. So the smallest *admissible* destabilising perturbation is larger — possibly much larger — than $1/\lVert\mathbf{M}\rVert_\infty$, and the test rejects designs that are in fact safe. The structured singular value is defined precisely as the reciprocal of the size of the smallest admissible destabilising perturbation, which makes it tight by construction.
:::

## Summary

| Item | Statement |
| --- | --- |
| Rearrangement | any uncertainty description becomes $z = \mathbf{M}v$, $v = \boldsymbol{\Delta}z$ with $\mathbf{M}$ known and stable |
| $\mathbf{M}$ for additive | $-\mathbf{K}\mathbf{S}\mathbf{W}$; test $\lVert\mathbf{W}\mathbf{K}\mathbf{S}\rVert_\infty < 1$ |
| $\mathbf{M}$ for output multiplicative | $-\mathbf{T}\mathbf{W}$; test $\lVert\mathbf{W}\mathbf{T}\rVert_\infty < 1$ |
| $\mathbf{M}$ for input multiplicative | $-\mathbf{T}_I\mathbf{W}$ with $\mathbf{T}_I = \mathbf{K}\mathbf{G}(\mathbf{I}+\mathbf{K}\mathbf{G})^{-1}$ |
| Theorem | $\mathbf{M}, \boldsymbol{\Delta}$ stable, loop well posed, $\lVert\mathbf{M}\rVert_\infty\lVert\boldsymbol{\Delta}\rVert_\infty < 1$ implies internal stability |
| Proof | $(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})^{-1} = \sum_k(\mathbf{M}\boldsymbol{\Delta})^k$ converges since $\lVert\mathbf{M}\boldsymbol{\Delta}\rVert_\infty < 1$ |
| Tightness | necessary and sufficient for full complex $\boldsymbol{\Delta}$; conservative for structured or real $\boldsymbol{\Delta}$ |
| Design rule | $\lvert T(j\omega)\rvert < 1/\lvert W(j\omega)\rvert$; crossover below the frequency where relative uncertainty reaches $1$ |
| Worked ceiling | actuator with $\pm 20\,\%$ gain and $0$–$10\,\mathrm{ms}$ delay caps a PD loop at $\omega_n = 47.2\,\mathrm{rad/s}$, crossover $72.9\,\mathrm{rad/s}$ |
| Conservatism | free phase, free direction, ignored structure, and the weight's own slack |
| Robustness margin | $1/\lVert\mathbf{M}\rVert_\infty$ is the factor by which the uncertainty can be scaled |

The next lesson steps back to define the two norms this test is built on — the H-infinity norm used here, and the H2 norm that LQG minimises — and says exactly what physical quantity each one measures.
