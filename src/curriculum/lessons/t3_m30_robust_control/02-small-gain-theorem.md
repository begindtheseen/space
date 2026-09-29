---
id: l02-small-gain-theorem
title: The small gain theorem
minutes: 22
covers:
  - The small gain theorem and its exact hypotheses
---

Hold a microphone near the loudspeaker it feeds. A small sound goes into the microphone, comes out of the speaker, and goes back into the microphone. If each trip round the loop makes the sound *quieter*, it fades away. If each trip makes it *louder*, it grows until the speaker squeals. What decides it is one number: how much the loop multiplies a sound on each trip. Below one, silence. Above one, a squeal.

That is the whole idea of this lesson. You now have a set of plants and a weight that bounds it. The question the rest of the module answers, in more and more refined ways, is: does one controller stabilize *every* plant in that set? The **small gain theorem** is the first and bluntest answer, and every later test is a sharpened version of it. It says a feedback loop around a bounded uncertainty cannot go unstable if the gain round the loop is less than one at every frequency.

That sounds almost too simple to be useful. It becomes useful because of a rearrangement. Whatever the uncertainty description — additive, multiplicative at either end, or parameters pulled out as a block — the whole closed loop can be redrawn as exactly **[[two blocks in feedback|m-delta-picture]]**: the unknown $\boldsymbol{\Delta}$, and a known, stable transfer matrix $\mathbf{M}$ that contains the plant, the controller and the weights. All the robust-stability information is then in one number, $\lVert\mathbf{M}\rVert_\infty$, computed from things you know.

This lesson does the rearrangement for the three standard uncertainty forms, states the theorem with every hypothesis spelled out, proves it, and then spends the rest of its length on what engineers get wrong: the theorem is only *sufficient*, and its pessimism has causes you can name and measure.

## Pulling the block out

Take the output multiplicative description $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})\mathbf{G}$ and close a controller $\mathbf{K}$ in negative feedback. Set the outside inputs (reference, disturbances) to zero, because stability does not depend on them. Name two signals:

- $z$, the signal going *into* $\boldsymbol{\Delta}$;
- $v = \boldsymbol{\Delta}z$, the signal coming *out* of it.

The plant output is the nominal part plus the uncertain part. So the loop equations are

$$y = \mathbf{G}u + \mathbf{W}v, \qquad z = \mathbf{G}u, \qquad u = -\mathbf{K}y.$$

**Step 1.** Put $u = -\mathbf{K}y$ into the first equation: $y = -\mathbf{G}\mathbf{K}y + \mathbf{W}v$. Move the $y$ terms together: $(\mathbf{I} + \mathbf{G}\mathbf{K})y = \mathbf{W}v$. So

$$y = \mathbf{S}\mathbf{W}v, \qquad \mathbf{S} = (\mathbf{I} + \mathbf{G}\mathbf{K})^{-1},$$

where $\mathbf{S}$ is the nominal **[[sensitivity|sensitivity-names]]** function.

**Step 2.** Now find $z$. Since $z = \mathbf{G}u$ and $u = -\mathbf{K}y$:

$$z = -\mathbf{G}\mathbf{K}y = -\mathbf{G}\mathbf{K}\mathbf{S}\mathbf{W}v = -\mathbf{T}\mathbf{W}v,$$

where $\mathbf{T} = \mathbf{G}\mathbf{K}(\mathbf{I} + \mathbf{G}\mathbf{K})^{-1}$ is the nominal **complementary sensitivity** — the map from reference to output.

So the loop seen by the uncertainty is $\mathbf{M} = -\mathbf{T}\mathbf{W}$. A minus sign can be absorbed into $\boldsymbol{\Delta}$ (if $\boldsymbol{\Delta}$ is allowed, so is $-\boldsymbol{\Delta}$), so the size that matters is $\lVert\mathbf{W}\mathbf{T}\rVert_\infty$.

The same two steps give the other cases.

- **Additive**, $\mathbf{G}_p = \mathbf{G} + \mathbf{W}\boldsymbol{\Delta}$. The block sees the control signal, $z = u$. From $u = -\mathbf{K}(\mathbf{G}u + \mathbf{W}v)$ you get $\mathbf{M} = -\mathbf{K}\mathbf{S}\mathbf{W}$.
- **Input multiplicative**, $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})$. The block sits between controller and plant, and $\mathbf{M} = -\mathbf{T}_I\mathbf{W}$ with $\mathbf{T}_I = \mathbf{K}\mathbf{G}(\mathbf{I} + \mathbf{K}\mathbf{G})^{-1}$, the **input** complementary sensitivity.

For a SISO plant $T_I = T$. For a multivariable plant they are different matrices with different singular values, and mixing them up is the commonest slip in the subject.

::: key The three standard robust stability tests
With $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ and a nominally stable loop: additive $\mathbf{G}_p = \mathbf{G} + \mathbf{W}\boldsymbol{\Delta}$ needs $\lVert\mathbf{W}\mathbf{K}\mathbf{S}\rVert_\infty < 1$; output multiplicative $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})\mathbf{G}$ needs $\lVert\mathbf{W}\mathbf{T}\rVert_\infty < 1$; input multiplicative $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})$ needs $\lVert\mathbf{W}\mathbf{T}_I\rVert_\infty < 1$. For a full complex $\boldsymbol{\Delta}$ each test is "if and only if": for example, $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}\boldsymbol{\Delta})\mathbf{G}$ is robustly stabilized iff $\lVert\mathbf{W}\mathbf{T}\rVert_\infty < 1$. Where the uncertainty is large, the matching closed-loop map — here $\mathbf{T}$ — must be small.
:::

## The theorem

Back to the microphone. The loop multiplies each trip by some gain. If that gain is below one, the sound after many trips is $1 + \gamma + \gamma^2 + \dots$ times the first sound, a sum that settles to a finite number. That is the theorem in one line. Here it is stated precisely.

::: key Small gain theorem
Let $\mathbf{M}$ and $\boldsymbol{\Delta}$ both be stable, connected in feedback so that $z = \mathbf{M}v$ and $v = \boldsymbol{\Delta}z$, with the interconnection well posed. If

$$\lVert\mathbf{M}\rVert_\infty\,\lVert\boldsymbol{\Delta}\rVert_\infty < 1$$

then the closed loop is internally stable. With $\boldsymbol{\Delta}$ normalized to $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ the condition is $\lVert\mathbf{M}\rVert_\infty < 1$. The condition is sufficient, not necessary, in general, and it is conservative because it ignores phase and structure. It is also necessary when $\boldsymbol{\Delta}$ ranges over *all* stable perturbations within the norm bound, with no structure imposed.
:::

**[[Internally stable|internal-stability]]** means every signal anywhere in the loop stays bounded when any bounded signal is injected anywhere — not only the output you happen to watch. **Conservative** means pessimistic: the test may say "not proven" for a loop that is in fact fine.

::: note Why it has to be true
The closed loop is governed by $(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})^{-1}$. Internal stability means this inverse exists and is itself a stable transfer matrix.

Call $\gamma = \lVert\mathbf{M}\rVert_\infty\lVert\boldsymbol{\Delta}\rVert_\infty < 1$. The H-infinity norm is **submultiplicative** — the size of a product is at most the product of the sizes — so $\lVert\mathbf{M}\boldsymbol{\Delta}\rVert_\infty \le \gamma$. Now write the inverse as the **[[Neumann series|geometric-series]]**, the matrix version of $1/(1-x) = 1 + x + x^2 + \cdots$:

$$(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})^{-1} = \mathbf{I} + \mathbf{M}\boldsymbol{\Delta} + (\mathbf{M}\boldsymbol{\Delta})^2 + \cdots$$

The $k$-th term has norm at most $\gamma^k$. Because $\gamma < 1$, these shrink fast enough that the whole sum converges, to something of norm at most $1/(1-\gamma)$. Each term is a product of stable systems, so it is stable, and a convergent sum of stable systems is stable. So the inverse exists and is stable. Done.
:::

::: note Why the test is exactly tight for a full block
Suppose $\bar{\sigma}(\mathbf{M}(j\omega_0)) = 1$ at some frequency $\omega_0$. Take the singular value decomposition $\mathbf{M}(j\omega_0) = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$, and call $\mathbf{v}_1$ and $\mathbf{u}_1$ the first columns of $\mathbf{V}$ and $\mathbf{U}$ — the **[[input and output directions|svd-directions]]** of largest gain. ($^\mathsf{H}$ means "conjugate transpose".)

Choose $\boldsymbol{\Delta}(j\omega_0) = \mathbf{v}_1\mathbf{u}_1^\mathsf{H}$. It has $\bar{\sigma} = 1$, so it is allowed. Then $\mathbf{M}\boldsymbol{\Delta}\mathbf{u}_1 = \mathbf{M}\mathbf{v}_1 = 1\cdot\mathbf{u}_1$: the vector $\mathbf{u}_1$ goes round the loop and comes back unchanged. So $\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}$ is singular at $\omega_0$, and the loop has a pole on the imaginary axis. Finally, build a stable, unit-norm rational $\boldsymbol{\Delta}$ that takes this value at $\omega_0$, using **[[all-pass|all-pass]]** factors.

That is why the test is exactly tight for unstructured uncertainty. Every bit of pessimism you meet later comes from the *set* being smaller than "all complex matrices of norm one" — never from the theorem.
:::

## What each hypothesis is doing

**Both blocks stable.** $\mathbf{M}$ stable means the nominal closed loop is already internally stable. You must establish that separately, and first. $\boldsymbol{\Delta}$ stable means the perturbation brings no right-half-plane poles of its own: every plant in the set has the same number of right-half-plane poles as the nominal. That is a real restriction. A multiplicative weight cannot describe a **[[booster whose aerodynamic instability disappears|booster-instability]]** above the atmosphere, because that plant's unstable pole count changes. An inverse multiplicative or coprime-factor description can.

**[[Well-posedness|well-posed]].** The matrix $\mathbf{I} - \mathbf{M}(\infty)\boldsymbol{\Delta}(\infty)$ must be invertible, so the loop equations have a solution at all. This holds whenever one of the two blocks is strictly proper — its gain falls to zero at infinite frequency — which is almost always.

**Strict inequality.** At $\lVert\mathbf{M}\rVert_\infty = 1$ exactly, the tightness construction puts a closed-loop pole on the imaginary axis: marginal, not stable. Reporting a peak of $1.00$ as "passes" is wrong. Reporting $0.999$ as "passes comfortably" is worse.

**No structure assumed.** The theorem treats $\boldsymbol{\Delta}$ as a full block. If your real uncertainty is three independent actuator scale factors, the theorem still applies — a diagonal $\boldsymbol{\Delta}$ is one of the matrices it allows. But it is answering a harder question than you asked, and it may say "no" when the honest answer is "yes".

::: warning Nominal stability is a precondition, not a consequence
The small gain theorem says nothing about whether your loop is stable for the nominal plant. If $\mathbf{M}$ is unstable, $\lVert\mathbf{M}\rVert_\infty$ is infinite and the test is empty. Worse, a routine that evaluates $\bar{\sigma}(\mathbf{M}(j\omega))$ on a frequency grid will happily return a finite peak for an unstable $\mathbf{M}$ and mislead you completely. Check the closed-loop pole locations first, then compute the norm.
:::

## The test read as a design rule

Write the output multiplicative test at one frequency: $\lvert W(j\omega)T(j\omega)\rvert < 1$. Divide both sides by $\lvert W\rvert$:

$$\lvert T(j\omega)\rvert < \frac{1}{\lvert W(j\omega)\rvert}\quad\text{for every }\omega .$$

That is the whole of loop shaping for robustness in one line. $1/\lvert W\rvert$ is a **ceiling**, and $\lvert T\rvert$ must stay under it everywhere.

Below crossover $\lvert T\rvert \approx 1$, because tracking the reference is what closing a loop means. Above crossover $\lvert T\rvert$ rolls off. So the ceiling bites hardest where $\lvert W\rvert$ passes through $1$. At that frequency and above, $\lvert T\rvert$ must already be falling. In plain words: **the loop's crossover frequency cannot exceed the frequency at which the relative uncertainty reaches one hundred percent.** Try to cross over where you do not even know the sign of the plant's response, and no amount of cleverness will save you.

For the actuator of the previous lesson, $\lvert W\rvert$ reaches $1$ at $66.8\,\mathrm{rad/s}$. That number, built from a datasheet gain tolerance and a delay budget, is a hard ceiling on closed-loop bandwidth before any controller has been written.

::: example The rigid axis against its actuator
Take one axis of the three-axis spacecraft as if it were on its own: $G(s) = 1/(Js^2)$ with $J = 120\,\mathrm{kg\,m^2}$. Use the proportional-derivative controller from the classical modules, $K(s) = k_d s + k_p$ with $k_p = 40$ and $k_d = 90$.

The loop gain is $L = (90s + 40)/(120s^2)$. It crosses over at $0.847\,\mathrm{rad/s}$ with $62.3^\circ$ of phase margin. The closed loop has $\omega_n = \sqrt{40/120} = 0.577\,\mathrm{rad/s}$ and $\zeta = 90/(2\sqrt{40\times 120}) = 0.65$.

Against the weight $W(s) = (0.016s + 0.2)/(0.0064s + 1)$, the peak of $\lvert WT\rvert$ is $0.262$, at $0.46\,\mathrm{rad/s}$. There $\lvert W\rvert = 0.200$ and $\lvert T\rvert = 1.31$; check: $0.200 \times 1.31 = 0.262$.

The loop is robustly stable, with room to spare. You could multiply the whole uncertainty weight by $1/0.262 = 3.8$ and still pass. The frequencies show why. The loop crosses over at $0.85\,\mathrm{rad/s}$, where the actuator's relative error is only twenty percent. The error does not reach one hundred percent until $66.8\,\mathrm{rad/s}$ — nearly two decades higher. A slow loop is a robust loop.

Notice where the peak sits: not at high frequency, where $\lvert W\rvert$ is large, but at the small resonant bump in $\lvert T\rvert$. The test is a product, and both factors matter.
:::

::: example The bandwidth ceiling, found by the test
Now push the same design faster. Choose $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$ with $\zeta = 0.7$, and raise $\omega_n$. The nominal phase margin never changes — it is $65.2^\circ$ for every $\omega_n$, because the loop shape is **[[self-similar|self-similar]]**. So classical margins report no harm at all. The robust stability test disagrees:

| $\omega_n$ (rad/s) | $k_p$ | $k_d$ | crossover (rad/s) | $\lVert WT\rVert_\infty$ |
| --- | --- | --- | --- | --- |
| 0.577 (the design above, $\zeta = 0.65$) | 40 | 90 | 0.85 | 0.262 |
| 45 | 243 000 | 7 560 | 69.4 | 0.961 |
| 47.2 | 267 300 | 7 930 | 72.9 | 1.000 |
| 50 | 300 000 | 8 400 | 77.1 | 1.047 |

For the $\omega_n = 45$ row, as a check: $k_p = 120 \times 45^2 = 243{,}000$ and $k_d = 2 \times 0.7 \times 45 \times 120 = 7{,}560$.

The ceiling is $\omega_n = 47.2\,\mathrm{rad/s}$, a crossover of $72.9\,\mathrm{rad/s}$ — within ten percent of the $66.8\,\mathrm{rad/s}$ where $\lvert W\rvert = 1$, as the design rule predicts. Any faster and the guarantee is gone. That limit came from a twenty percent scale factor and a ten-millisecond delay, and no classical margin would have shown it. The note on **[[the ceiling|bandwidth-ceiling]]** draws $\lvert T\rvert$ touching $1/\lvert W\rvert$.
:::

The code below checks the $\omega_n = 50$ row and finds the perturbation that breaks it.

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

## Where the pessimism lives

A failed small gain test is not a proof of instability. It is the *absence* of a proof of stability. That difference matters when a program is deciding whether to slow a loop down. Four things separate the test from the truth.

**Phase.** The theorem lets $\boldsymbol{\Delta}(j\omega)$ have any phase at each frequency, independently. Real hardware does not. A gain error adds no phase at all. A transport delay adds phase in proportion to frequency, and nothing else.

**Direction.** For a multivariable plant, $\boldsymbol{\Delta}$ may line up its input and output directions with the worst singular vectors of $\mathbf{M}$ at every frequency. A physical error usually acts along one fixed direction set by the hardware layout.

**Structure.** A full block allows cross-coupling between channels that are physically separate. This is the big one on vehicles with several actuators, and the structured singular value exists to remove it.

**The weight.** Every gap between $\lvert W\rvert$ and the true envelope is pessimism you added yourself when you fitted a low-order curve over a sampled set.

::: example The perturbation the theorem is afraid of
Return to the $\omega_n = 50$ design, which fails with $\lVert WT\rVert_\infty = 1.047$ at $\omega^* = 69.9\,\mathrm{rad/s}$ (read "omega star"). At $\omega^*$, $W(j\omega^*)T(j\omega^*) = 1.046 + 0.049j$. The loop closes — $1 + WT\Delta = 0$ — when

$$\Delta(j\omega^*) = \frac{-1}{W(j\omega^*)T(j\omega^*)} = -0.954 + 0.045j .$$

Its magnitude is $0.955$ — inside the unit ball, so it is allowed — at a phase of $177.3^\circ$.

What plant is that? $G_p = (1 + W\Delta)G$, so the actuator would need to multiply by $1 + W(j\omega^*)\Delta(j\omega^*) = 0.405 - 0.792j$. That is a gain of $0.890$ together with a phase shift of $-62.9^\circ$, both at $69.9\,\mathrm{rad/s}$.

Can the real actuator do that? Its set is $k\,e^{-j\omega\tau}$ with $k \in [0.8, 1.2]$ and $\tau \in [0, 10]\,\mathrm{ms}$. At $69.9\,\mathrm{rad/s}$ the gain spans $0.8$ to $1.2$, and the phase spans $0$ down to $-\omega\tau = -69.9 \times 0.010 = -0.699\,\mathrm{rad} = -40.1^\circ$. It cannot reach $-62.9^\circ$.

Searching the real two-parameter set at that frequency, the closest it gets to closing the loop is $\lvert 1 + WT\Delta\rvert = 0.349$, at $k = 0.82$ and $\tau = 10\,\mathrm{ms}$. That is a third of the way to instability, not all of it. Checking the worst sampled plant directly agrees: $k = 1.2$, $\tau = 10\,\mathrm{ms}$ still leaves $16.7^\circ$ of phase margin.

So the $\omega_n = 50$ design is in fact robustly stable against the hardware it will fly with, and the small gain theorem cannot say so. That is the price of a test that runs in milliseconds and needs nothing but a norm.
:::

::: warning Sufficient, not necessary
A peak above one means "not proven stable", not "unstable". A peak below one means stable, full stop. Treat the two verdicts differently. A pass is a guarantee you can put in a review package. A fail is a prompt to slow the loop, tighten the uncertainty description, or move to a structured analysis. What you must not do is quietly shrink the weight until the number falls below one.
:::

## Check yourself

::: check
A loop has $\lVert WT\rVert_\infty = 0.4$. By what factor can the modeled uncertainty be increased before robust stability is lost, and what does that factor mean physically?
:::

::: answer
Scaling the weight by $c$ scales the peak to $0.4c$. The guarantee survives while $0.4c < 1$, that is until $c = 1/0.4 = 2.5$.

Physically: if the weight said twenty percent relative error at low frequency and one hundred percent at $67\,\mathrm{rad/s}$, the design tolerates fifty percent ($2.5 \times 20$) and two hundred and fifty percent at those frequencies. It is the natural way to report robust-stability margin as one number. The structured singular value generalizes it: $1/\lVert WT\rVert_\infty$ is the unstructured robustness margin, and $1/\mu$ is the structured one.
:::

::: check
Your plant is $G(s) = 10/(s - 2)$, unstable, and you have a stabilizing controller. A colleague proposes the set $G_p = (1 + W\Delta)G$ to model a $\pm 25\,\%$ error in the unstable pole location. What is wrong?
:::

::: answer
A $\pm 25\,\%$ shift keeps the pole in the right half plane, between $1.5$ and $2.5$. So every plant in the intended family has one unstable pole, like the nominal. That part is fine.

The problem is the multiplicative error itself. For the pole at $2.5$: $(G_p - G)/G = (s-2)/(s-2.5) - 1 = 0.5/(s - 2.5)$. That is *unstable*, so it cannot be written as $W\Delta$ with both $W$ and $\Delta$ stable. (The pole at $1.5$ gives $-0.5/(s-1.5)$, unstable too.) The multiplicative description fails for a structural reason, not a numerical one.

The description that works is coprime-factor uncertainty. Write $G = N/M$ with $N = 10/(s+1)$ and $M = (s-2)/(s+1)$, both stable. A pole at $2 + \delta$ gives $M_p = (s - 2 - \delta)/(s+1) = M - \delta/(s+1)$: a *stable* perturbation of $M$, with weight $0.5/(s+1)$ for $\lvert\delta\rvert \le 0.5$. This is one reason launch-vehicle models with a varying aerodynamic instability are often written in coprime-factor form.
:::

::: check
For the additive test, $\lVert WKS\rVert_\infty < 1$: which part of the controller does this constrain, and why is the constraint felt at high frequency rather than low?
:::

::: answer
$KS$ is the map from reference or disturbance to control signal. So the test bounds *actuator activity*, weighted by the additive uncertainty.

At low frequency $\lvert S\rvert$ is small and $\lvert KS\rvert \approx \lvert 1/G\rvert$ — set by the plant, not the controller. At high frequency $\lvert S\rvert \to 1$ and $\lvert KS\rvert \to \lvert K\rvert$, so the test becomes $\lvert K(j\omega)\rvert < 1/\lvert W_A(j\omega)\rvert$: a direct ceiling on controller gain out where the plant model is unknown. A high-gain controller with no roll-off can fail the additive test while passing the multiplicative one. That is why the two are usually run together, and why the mixed-sensitivity problem of the H-infinity synthesis lesson carries a $KS$ channel.
:::

::: check
Design A has $\lVert WT\rVert_\infty = 0.95$ with the peak at $2\,\mathrm{rad/s}$, deep inside the control bandwidth. Design B has $\lVert WT\rVert_\infty = 0.95$ with the peak at $200\,\mathrm{rad/s}$, far above crossover. Are they equally robust?
:::

::: answer
By this test, yes: both pass with the same margin, and the theorem knows nothing else. In practice they are not equally trustworthy.

At $2\,\mathrm{rad/s}$ the weight is small, say $0.2$, so $\lvert T\rvert$ must be near $0.95/0.2 \approx 5$ to make the product $0.95$. That is a violent resonant peak in the closed loop, with a large sensitivity peak beside it and a poorly damped response. At $200\,\mathrm{rad/s}$ the weight is large and $\lvert T\rvert$ is tiny — the normal, healthy shape. Design A passes the robustness test while failing on nominal performance, and $\lVert S\rVert_\infty$ would show it at once. Never report one robustness number without the shapes behind it.
:::

::: check
Explain, using the tightness construction, why the small gain theorem is exact for unstructured uncertainty but pessimistic for a diagonal real $\boldsymbol{\Delta}$.
:::

::: answer
The construction picks $\boldsymbol{\Delta}(j\omega_0) = \mathbf{v}_1\mathbf{u}_1^\mathsf{H}$, built from the singular vectors of $\mathbf{M}(j\omega_0)$. That matrix is in general full — every entry nonzero — and complex.

If the allowed set is all norm-bounded stable perturbations, this matrix is in it, the loop really does go marginally unstable, and the bound is reached. If the allowed set is diagonal and real, $\mathbf{v}_1\mathbf{u}_1^\mathsf{H}$ is almost never in it: the worst singular vectors would have to line up with the coordinate axes and the phases would have to come out real. So the smallest *allowed* destabilizing perturbation is larger — possibly much larger — than $1/\lVert\mathbf{M}\rVert_\infty$, and the test rejects designs that are in fact safe. The structured singular value is defined as the reciprocal of the size of the smallest allowed destabilizing perturbation, which makes it exact by construction.
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
| Pessimism | free phase, free direction, ignored structure, and the weight's own slack |
| Robustness margin | $1/\lVert\mathbf{M}\rVert_\infty$ is the factor by which the uncertainty can be scaled |

The next lesson steps back to define the two norms this test is built on — the H-infinity norm used here, and the H2 norm that LQG minimizes — and says exactly what physical quantity each one measures.

::: context m-delta-picture Every robust-stability problem looks like this
However the uncertainty was described, and however complicated the vehicle, the analysis redraws it as one loop with two boxes. The top box is everything you do not know, scaled to size one. The bottom box is everything you do know — plant model, controller, weights — lumped into one transfer matrix $\mathbf{M}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <rect x="130" y="18" width="100" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="45" font-size="16" fill="#1f2a44" text-anchor="middle" font-weight="700">Δ</text>
  <text x="245" y="30" font-size="11" fill="#1f2a44">unknown, size ≤ 1</text>
  <rect x="130" y="104" width="100" height="44" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="131" font-size="16" fill="#1f2a44" text-anchor="middle" font-weight="700">M</text>
  <text x="245" y="145" font-size="11" fill="#1f2a44">plant + controller</text>
  <text x="245" y="159" font-size="11" fill="#1f2a44">+ weights: known</text>
  <polyline points="130,40 70,40 70,126 128,126" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <polyline points="230,126 290,126 290,40 232,40" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="62" y="88" font-size="13" fill="#1f2a44" text-anchor="end">v = Δz</text>
  <text x="298" y="88" font-size="13" fill="#1f2a44">z = Mv</text>
</svg>
```

Signals go round: $\mathbf{M}$ turns $v$ into $z$, and $\boldsymbol{\Delta}$ turns $z$ back into $v$. The loop is the microphone and the speaker. The only question left is how much the trip round it can amplify.
:::

::: context sensitivity-names Why S is called "sensitivity"
Hendrik Bode, working on telephone amplifiers at Bell Labs, asked: if the plant changes by one percent, by how many percent does the closed loop change? For a single loop the answer is exactly $S = 1/(1 + GK)$:

$$\frac{dT/T}{dG/G} = \frac{1}{1 + GK} = S .$$

Where the loop gain is high, $S$ is small and the closed loop hardly notices plant errors — the great gift of feedback. $T$ is called **complementary** because the two always add up to one: $S + T = 1$ (and $\mathbf{S} + \mathbf{T} = \mathbf{I}$ for matrices). They cannot both be small at the same frequency.
:::

::: context internal-stability Stable on the outside, broken on the inside
A loop can look perfectly stable from the output you are watching while some other signal inside it grows without limit. The classic way this happens is a cancellation: the controller has a zero exactly on top of an unstable plant pole. The pole vanishes from the reference-to-output transfer function, but it is still there in the map from a disturbance to the control signal, and the actuator saturates.

**Internal stability** closes that loophole. It asks that *every* transfer function from any injected signal to any internal signal be stable — which is why the small gain theorem is stated for it.
:::

::: context geometric-series The echo that dies away
The Neumann series is the matrix version of an old sum: $1 + x + x^2 + x^3 + \cdots = 1/(1-x)$, true whenever $\lvert x\rvert < 1$. Each trip round the loop multiplies the signal by at most $\gamma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="350" y2="150" stroke="#1f2a44"/>
  <rect x="30" y="120.0" width="14" height="30.0" fill="#1d6fd1"/><rect x="50" y="132.0" width="14" height="18.0" fill="#1d6fd1"/><rect x="70" y="139.2" width="14" height="10.8" fill="#1d6fd1"/><rect x="90" y="143.5" width="14" height="6.5" fill="#1d6fd1"/><rect x="110" y="146.1" width="14" height="3.9" fill="#1d6fd1"/><rect x="130" y="147.7" width="14" height="2.3" fill="#1d6fd1"/><rect x="150" y="148.6" width="14" height="1.4" fill="#1d6fd1"/><rect x="170" y="149.2" width="14" height="0.8" fill="#1d6fd1"/><rect x="200" y="120.0" width="14" height="30.0" fill="#b4232c"/><rect x="220" y="114.0" width="14" height="36.0" fill="#b4232c"/><rect x="240" y="106.8" width="14" height="43.2" fill="#b4232c"/><rect x="260" y="98.2" width="14" height="51.8" fill="#b4232c"/><rect x="280" y="87.8" width="14" height="62.2" fill="#b4232c"/><rect x="300" y="75.4" width="14" height="74.6" fill="#b4232c"/><rect x="320" y="60.4" width="14" height="89.6" fill="#b4232c"/><rect x="340" y="42.5" width="14" height="107.5" fill="#b4232c"/>
  <text x="30" y="170" font-size="12" fill="#1d6fd1">γ = 0.6: 1, 0.6, 0.36, …</text>
  <text x="30" y="186" font-size="12" fill="#1d6fd1">total → 1/(1 − 0.6) = 2.5</text>
  <text x="200" y="170" font-size="12" fill="#b4232c">γ = 1.2: 1, 1.2, 1.44, …</text>
  <text x="200" y="186" font-size="12" fill="#b4232c">grows without limit</text>
</svg>
```

With $\gamma = 0.6$ each echo is smaller than the last, and all of them together add up to a finite $2.5$ times the first. With $\gamma = 1.2$ each echo is bigger, and the sum runs away — the squeal. The whole small gain theorem is the blue side of this picture.
:::

::: context svd-directions The directions a matrix likes best
The singular value decomposition writes any matrix as $\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{H}$: turn, stretch along the axes, turn again. The first column of $\mathbf{V}$, $\mathbf{v}_1$, is the input direction that gets stretched the most; the first column of $\mathbf{U}$, $\mathbf{u}_1$, is the direction it comes out in; the stretch is $\bar{\sigma}$.

The worst perturbation is the one that takes the output of $\mathbf{M}$ in direction $\mathbf{u}_1$ and feeds it straight back in direction $\mathbf{v}_1$ — the most amplifying route round the loop, taken on purpose.
:::

::: context all-pass A filter that changes timing, not size
An **all-pass** filter has gain exactly $1$ at every frequency and changes only the phase. The simplest is

$$\frac{a - s}{a + s},$$

whose magnitude is $\lvert a - j\omega\rvert/\lvert a + j\omega\rvert = 1$ and whose phase goes from $0^\circ$ at DC to $-180^\circ$ at high frequency. By choosing $a$ you can give it any phase you like at one chosen frequency $\omega_0$.

Combine a constant of size at most one (to set the magnitude) with an all-pass factor or two (to set the phase), and you get a *stable* $\Delta$ that hits any required complex value at $\omega_0$. That is how the worst-case perturbation is turned into a real system.
:::

::: context booster-instability A rocket that is unstable only in the air
Many launch vehicles are aerodynamically unstable: the center of pressure, where the air's side force acts, sits ahead of the center of mass. Any small angle of attack makes the air push the nose further off, like a dart thrown tail first. The engine gimbal has to hold it straight.

That instability appears in the model as a right-half-plane pole whose size grows with dynamic pressure. Above the atmosphere the air is gone and the pole disappears, leaving a plain double integrator. A single uncertainty set covering both flight phases must allow the number of unstable poles to change, which the ordinary multiplicative form cannot do.
:::

::: context well-posed When a loop has no answer
Suppose both blocks passed signals through instantly, with gains $m$ and $d$ at very high frequency. Then the loop equation there reads $v = d\,m\,v + (\text{input})$. If $dm = 1$, it becomes $0 = \text{input}$: no solution, or infinitely many. That loop is **ill-posed** — it does not describe any physical system.

Real hardware always rolls off: a motor cannot respond at infinite frequency. So at least one block has zero gain at $\omega \to \infty$, $dm = 0$, and the loop is well posed. The hypothesis is there so the mathematics does not describe something impossible.
:::

::: context self-similar Why the phase margin never changed
With $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$, the loop gain is

$$L(s) = \frac{2\zeta\omega_n s + \omega_n^2}{s^2} .$$

Write $s = \omega_n p$. Then $L = (2\zeta p + 1)/p^2$, which does not contain $\omega_n$ at all. So raising $\omega_n$ slides the whole Bode plot to the right without changing its shape. The phase margin is the same $65.2^\circ$ every time; only the crossover moves, always at $1.54\,\omega_n$. A margin that cannot see bandwidth cannot see the actuator's delay either — the test on $WT$ can.
:::

::: context bandwidth-ceiling The ceiling, drawn
The dashed red curve is the ceiling $1/\lvert W\rvert$: $5$ at low frequency (twenty percent uncertainty), falling through $1$ near $67\,\mathrm{rad/s}$, leveling at $0.4$. The robust stability test says $\lvert T\rvert$ must stay strictly underneath it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="180" x2="345" y2="180" stroke="#1f2a44"/>
  <line x1="45" y1="180" x2="45" y2="15" stroke="#1f2a44"/>
  <line x1="45.0" y1="180" x2="45.0" y2="184" stroke="#1f2a44"/><text x="45.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text><line x1="120.0" y1="180" x2="120.0" y2="184" stroke="#1f2a44"/><text x="120.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">1</text><line x1="195.0" y1="180" x2="195.0" y2="184" stroke="#1f2a44"/><text x="195.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">10</text><line x1="270.0" y1="180" x2="270.0" y2="184" stroke="#1f2a44"/><text x="270.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">100</text><line x1="345.0" y1="180" x2="345.0" y2="184" stroke="#1f2a44"/><text x="345.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">1000</text><text x="41" y="184.0" font-size="11" fill="#1f2a44" text-anchor="end">0.01</text><text x="41" y="129.0" font-size="11" fill="#1f2a44" text-anchor="end">0.1</text><text x="41" y="74.0" font-size="11" fill="#1f2a44" text-anchor="end">1</text><text x="41" y="19.0" font-size="11" fill="#1f2a44" text-anchor="end">10</text>
  <polyline points="45.0,31.6 46.4,31.6 47.7,31.6 49.1,31.6 50.5,31.6 51.8,31.6 53.2,31.6 54.6,31.6 56.0,31.6 57.3,31.6 58.7,31.6 60.1,31.6 61.4,31.6 62.8,31.6 64.2,31.6 65.5,31.6 66.9,31.6 68.3,31.6 69.7,31.6 71.0,31.6 72.4,31.6 73.8,31.6 75.1,31.6 76.5,31.6 77.9,31.6 79.2,31.6 80.6,31.6 82.0,31.6 83.4,31.6 84.7,31.6 86.1,31.6 87.5,31.6 88.8,31.6 90.2,31.6 91.6,31.6 92.9,31.6 94.3,31.6 95.7,31.6 97.1,31.6 98.4,31.6 99.8,31.6 101.2,31.6 102.5,31.6 103.9,31.6 105.3,31.6 106.6,31.6 108.0,31.6 109.4,31.6 110.8,31.6 112.1,31.6 113.5,31.6 114.9,31.6 116.2,31.6 117.6,31.6 119.0,31.6 120.3,31.6 121.7,31.6 123.1,31.6 124.5,31.7 125.8,31.7 127.2,31.7 128.6,31.7 129.9,31.7 131.3,31.7 132.7,31.7 134.0,31.7 135.4,31.8 136.8,31.8 138.2,31.8 139.5,31.8 140.9,31.8 142.3,31.9 143.6,31.9 145.0,31.9 146.4,31.9 147.7,32.0 149.1,32.0 150.5,32.0 151.8,32.1 153.2,32.1 154.6,32.2 156.0,32.2 157.3,32.3 158.7,32.3 160.1,32.4 161.4,32.5 162.8,32.6 164.2,32.6 165.5,32.7 166.9,32.8 168.3,32.9 169.7,33.1 171.0,33.2 172.4,33.3 173.8,33.5 175.1,33.6 176.5,33.8 177.9,34.0 179.2,34.1 180.6,34.3 182.0,34.6 183.4,34.8 184.7,35.0 186.1,35.3 187.5,35.6 188.8,35.9 190.2,36.2 191.6,36.5 192.9,36.9 194.3,37.2 195.7,37.6 197.1,38.0 198.4,38.4 199.8,38.9 201.2,39.4 202.5,39.9 203.9,40.4 205.3,40.9 206.6,41.4 208.0,42.0 209.4,42.6 210.8,43.2 212.1,43.8 213.5,44.5 214.9,45.2 216.2,45.8 217.6,46.5 219.0,47.3 220.3,48.0 221.7,48.7 223.1,49.5 224.5,50.3 225.8,51.0 227.2,51.8 228.6,52.6 229.9,53.4 231.3,54.3 232.7,55.1 234.0,55.9 235.4,56.8 236.8,57.6 238.2,58.4 239.5,59.3 240.9,60.2 242.3,61.0 243.6,61.9 245.0,62.7 246.4,63.6 247.7,64.4 249.1,65.3 250.5,66.1 251.8,67.0 253.2,67.8 254.6,68.6 256.0,69.5 257.3,70.3 258.7,71.1 260.1,71.9 261.4,72.7 262.8,73.4 264.2,74.2 265.5,75.0 266.9,75.7 268.3,76.4 269.7,77.1 271.0,77.8 272.4,78.5 273.8,79.2 275.1,79.8 276.5,80.4 277.9,81.0 279.2,81.6 280.6,82.2 282.0,82.7 283.4,83.2 284.7,83.8 286.1,84.2 287.5,84.7 288.8,85.1 290.2,85.6 291.6,86.0 292.9,86.3 294.3,86.7 295.7,87.0 297.1,87.4 298.4,87.7 299.8,88.0 301.2,88.2 302.5,88.5 303.9,88.7 305.3,89.0 306.6,89.2 308.0,89.4 309.4,89.6 310.8,89.7 312.1,89.9 313.5,90.0 314.9,90.2 316.2,90.3 317.6,90.4 319.0,90.5 320.3,90.6 321.7,90.7 323.1,90.8 324.5,90.9 325.8,91.0 327.2,91.1 328.6,91.1 329.9,91.2 331.3,91.2 332.7,91.3 334.0,91.3 335.4,91.4 336.8,91.4 338.2,91.5 339.5,91.5 340.9,91.5 342.3,91.5 343.6,91.6 345.0,91.6" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3"/>
  <polyline points="45.0,69.3 46.4,69.3 47.7,69.2 49.1,69.1 50.5,69.0 51.8,69.0 53.2,68.9 54.6,68.8 56.0,68.7 57.3,68.6 58.7,68.5 60.1,68.3 61.4,68.2 62.8,68.1 64.2,67.9 65.5,67.8 66.9,67.6 68.3,67.4 69.7,67.2 71.0,67.0 72.4,66.8 73.8,66.6 75.1,66.4 76.5,66.1 77.9,65.9 79.2,65.7 80.6,65.4 82.0,65.2 83.4,64.9 84.7,64.7 86.1,64.4 87.5,64.2 88.8,64.0 90.2,63.8 91.6,63.7 92.9,63.6 94.3,63.5 95.7,63.5 97.1,63.6 98.4,63.7 99.8,63.9 101.2,64.2 102.5,64.6 103.9,65.0 105.3,65.5 106.6,66.1 108.0,66.8 109.4,67.5 110.8,68.3 112.1,69.2 113.5,70.1 114.9,71.0 116.2,72.0 117.6,73.0 119.0,74.0 120.3,75.1 121.7,76.1 123.1,77.2 124.5,78.3 125.8,79.4 127.2,80.5 128.6,81.6 129.9,82.6 131.3,83.7 132.7,84.8 134.0,85.9 135.4,87.0 136.8,88.1 138.2,89.2 139.5,90.2 140.9,91.3 142.3,92.4 143.6,93.4 145.0,94.5 146.4,95.6 147.7,96.6 149.1,97.7 150.5,98.7 151.8,99.7 153.2,100.8 154.6,101.8 156.0,102.9 157.3,103.9 158.7,104.9 160.1,106.0 161.4,107.0 162.8,108.0 164.2,109.0 165.5,110.1 166.9,111.1 168.3,112.1 169.7,113.1 171.0,114.1 172.4,115.2 173.8,116.2 175.1,117.2 176.5,118.2 177.9,119.2 179.2,120.2 180.6,121.2 182.0,122.2 183.4,123.3 184.7,124.3 186.1,125.3 187.5,126.3 188.8,127.3 190.2,128.3 191.6,129.3 192.9,130.3 194.3,131.3 195.7,132.3 197.1,133.3 198.4,134.4 199.8,135.4 201.2,136.4 202.5,137.4 203.9,138.4 205.3,139.4 206.6,140.4 208.0,141.4 209.4,142.4 210.8,143.4 212.1,144.4 213.5,145.4 214.9,146.4 216.2,147.4 217.6,148.4 219.0,149.4 220.3,150.4 221.7,151.5 223.1,152.5 224.5,153.5 225.8,154.5 227.2,155.5 228.6,156.5 229.9,157.5 231.3,158.5 232.7,159.5 234.0,160.5 235.4,161.5 236.8,162.5 238.2,163.5 239.5,164.5 240.9,165.5 242.3,166.5 243.6,167.5 245.0,168.5 246.4,169.5 247.7,170.5 249.1,171.6 250.5,172.6 251.8,173.6 253.2,174.6 254.6,175.6 256.0,176.6 257.3,177.6 258.7,178.6 260.1,179.6" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polyline points="45.0,70.0 46.4,70.0 47.7,70.0 49.1,70.0 50.5,70.0 51.8,70.0 53.2,70.0 54.6,70.0 56.0,70.0 57.3,70.0 58.7,70.0 60.1,70.0 61.4,70.0 62.8,70.0 64.2,70.0 65.5,70.0 66.9,70.0 68.3,70.0 69.7,70.0 71.0,70.0 72.4,70.0 73.8,70.0 75.1,70.0 76.5,70.0 77.9,70.0 79.2,70.0 80.6,70.0 82.0,70.0 83.4,70.0 84.7,70.0 86.1,70.0 87.5,70.0 88.8,70.0 90.2,70.0 91.6,70.0 92.9,70.0 94.3,70.0 95.7,70.0 97.1,70.0 98.4,70.0 99.8,70.0 101.2,70.0 102.5,70.0 103.9,70.0 105.3,70.0 106.6,70.0 108.0,70.0 109.4,70.0 110.8,70.0 112.1,70.0 113.5,70.0 114.9,70.0 116.2,70.0 117.6,70.0 119.0,70.0 120.3,70.0 121.7,70.0 123.1,70.0 124.5,70.0 125.8,70.0 127.2,70.0 128.6,70.0 129.9,70.0 131.3,70.0 132.7,70.0 134.0,70.0 135.4,70.0 136.8,70.0 138.2,70.0 139.5,70.0 140.9,70.0 142.3,70.0 143.6,70.0 145.0,70.0 146.4,69.9 147.7,69.9 149.1,69.9 150.5,69.9 151.8,69.9 153.2,69.9 154.6,69.9 156.0,69.9 157.3,69.9 158.7,69.9 160.1,69.9 161.4,69.9 162.8,69.9 164.2,69.8 165.5,69.8 166.9,69.8 168.3,69.8 169.7,69.8 171.0,69.8 172.4,69.7 173.8,69.7 175.1,69.7 176.5,69.7 177.9,69.6 179.2,69.6 180.6,69.6 182.0,69.5 183.4,69.5 184.7,69.5 186.1,69.4 187.5,69.4 188.8,69.3 190.2,69.2 191.6,69.2 192.9,69.1 194.3,69.0 195.7,69.0 197.1,68.9 198.4,68.8 199.8,68.7 201.2,68.6 202.5,68.5 203.9,68.3 205.3,68.2 206.6,68.1 208.0,67.9 209.4,67.8 210.8,67.6 212.1,67.5 213.5,67.3 214.9,67.1 216.2,66.9 217.6,66.7 219.0,66.5 220.3,66.3 221.7,66.1 223.1,65.8 224.5,65.6 225.8,65.4 227.2,65.2 228.6,65.0 229.9,64.8 231.3,64.6 232.7,64.5 234.0,64.3 235.4,64.2 236.8,64.2 238.2,64.2 239.5,64.2 240.9,64.3 242.3,64.4 243.6,64.7 245.0,64.9 246.4,65.3 247.7,65.7 249.1,66.2 250.5,66.7 251.8,67.3 253.2,68.0 254.6,68.7 256.0,69.5 257.3,70.3 258.7,71.1 260.1,72.0 261.4,72.9 262.8,73.9 264.2,74.8 265.5,75.8 266.9,76.8 268.3,77.8 269.7,78.8 271.0,79.8 272.4,80.9 273.8,81.9 275.1,82.9 276.5,84.0 277.9,85.0 279.2,86.0 280.6,87.1 282.0,88.1 283.4,89.1 284.7,90.2 286.1,91.2 287.5,92.3 288.8,93.3 290.2,94.3 291.6,95.4 292.9,96.4 294.3,97.4 295.7,98.4 297.1,99.5 298.4,100.5 299.8,101.5 301.2,102.5 302.5,103.5 303.9,104.6 305.3,105.6 306.6,106.6 308.0,107.6 309.4,108.6 310.8,109.6 312.1,110.7 313.5,111.7 314.9,112.7 316.2,113.7 317.6,114.7 319.0,115.7 320.3,116.7 321.7,117.7 323.1,118.7 324.5,119.8 325.8,120.8 327.2,121.8 328.6,122.8 329.9,123.8 331.3,124.8 332.7,125.8 334.0,126.8 335.4,127.8 336.8,128.8 338.2,129.8 339.5,130.8 340.9,131.8 342.3,132.8 343.6,133.9 345.0,134.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="257.3" cy="70.3" r="4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50.9" y="27.2" font-size="12" fill="#b4232c">ceiling 1/|W|</text>
  <text x="50.9" y="153.8" font-size="12" fill="#6c7a93">|T|, slow design</text>
  <text x="50.9" y="170.3" font-size="12" fill="#1d6fd1">|T|, fast design (ωₙ = 47.2)</text>
  <text x="265.3" y="62.3" font-size="11" fill="#1f2a44">touch ≈ 67 rad/s</text>
  <text x="195.0" y="210" font-size="11" fill="#1f2a44" text-anchor="middle">frequency ω (rad/s), log scale</text>
</svg>
```

The gray curve is the slow $\omega_n = 0.577$ design: far below the ceiling everywhere. The blue curve is the $\omega_n = 47.2$ design: it touches the ceiling near $67\,\mathrm{rad/s}$. That touch is $\lVert WT\rVert_\infty = 1$.
:::
