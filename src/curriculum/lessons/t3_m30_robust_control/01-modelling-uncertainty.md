---
id: l01-modelling-uncertainty
title: Modelling uncertainty
minutes: 22
covers:
  - 'Modelling uncertainty: additive, multiplicative (input and output), parametric, unstructured'
---

Every model you have designed against so far was a lie told for a good reason. The rigid-body spacecraft had no solar array; the actuator had no delay; the inertia tensor was a table of numbers rather than a distribution over propellant loads. Classical and optimal design take that lie at face value and hand you a controller that is optimal for a plant that does not exist. Robust control begins one step earlier, by writing down a **set** of plants that the real vehicle is believed to lie in, and then asking for a controller that works for every member of the set.

The set is the whole game. Make it too small and the analysis is a comforting fiction — the flight vehicle sits outside it and the margins you reported were never real. Make it too large and no controller exists, or the one that does is so detuned that it cannot meet the pointing requirement. The engineering is in building a set that is honestly large enough and no larger, out of numbers you can actually defend: a torque constant specified to five percent on a datasheet, a hydraulic actuator bandwidth that halves when the fluid is cold, a first bending mode measured at two propellant loads on a shaker table and interpolated in between.

This lesson sets up the four ways that set gets written down — additive, multiplicative at the input, multiplicative at the output, and parametric — and the distinction between a structured description that keeps track of where the error lives and an unstructured one that throws that information away in exchange for a test you can actually run. Everything later in the module consumes one of these descriptions, so the vocabulary here is used on every page that follows.

## The plant set and the perturbation block

Write the nominal model $\mathbf{G}(s)$ and the true plant $\mathbf{G}_p(s)$, an unknown member of a set $\Pi$. A description of $\Pi$ is useful to a control engineer only if it has this shape: a **fixed, known interconnection** containing $\mathbf{G}$ and some **weights**, with a single unknown block $\boldsymbol{\Delta}$ pulled out and bounded in norm,

$$\Pi = \{\,\mathbf{G}_p(s) : \mathbf{G}_p = \mathcal{F}(\mathbf{G}, \mathbf{W}, \boldsymbol{\Delta}),\ \lVert\boldsymbol{\Delta}\rVert_\infty \le 1\,\}.$$

Two conventions make this work. First, $\boldsymbol{\Delta}$ is **normalised**: all the frequency shaping and all the magnitude information is moved into the stable, known weight $\mathbf{W}(s)$, so the unknown is a unit-norm block and nothing more. Second, $\boldsymbol{\Delta}$ is a **transfer function**, not a constant — an unknown stable system with $\sup_\omega\bar{\sigma}(\boldsymbol{\Delta}(j\omega)) \le 1$. Allowing it to vary with frequency is what lets one weight cover a whole family of dynamic errors, and it is also the single most common source of conservatism, because a real vehicle's error is one specific curve and $\boldsymbol{\Delta}$ is allowed to be any curve inside the disk.

The norm $\lVert\cdot\rVert_\infty$ is defined in the H2-and-H-infinity lesson; for now read $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ as "the largest singular value of $\boldsymbol{\Delta}(j\omega)$ never exceeds one, at any frequency".

## Additive uncertainty

The blunt description. Add an unknown transfer function of bounded size:

$$\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\,\boldsymbol{\Delta}, \qquad \lVert\boldsymbol{\Delta}\rVert_\infty \le 1.$$

At each frequency the true plant lies in a disk of radius $\lvert W_A(j\omega)\rvert$ centred on $G(j\omega)$ in the complex plane. The weight carries the **absolute** error and therefore the units of the plant: for a torque-to-angle plant, $\mathrm{rad/(N\,m)}$.

The weight you need is the upper envelope of the sampled error,

$$\lvert W_A(j\omega)\rvert \ \ge\ l_A(\omega) \ \equiv\ \max_{\mathbf{G}_p \in \Pi}\ \bar{\sigma}\big(\mathbf{G}_p(j\omega) - \mathbf{G}(j\omega)\big),$$

fitted by a stable, minimum-phase rational function that sits above $l_A$ everywhere. Stable and minimum-phase because the weight must be invertible in the analysis without introducing right-half-plane trouble of its own; above everywhere because a weight that dips below the envelope at one frequency covers nothing at all — robust stability is a statement about the whole set, and one uncovered plant voids it.

Additive form is the right choice where the nominal plant is small or zero: near an anti-resonance, or above the last mode you modelled. Its weakness is bookkeeping at low frequency, where a five percent error on a plant of gain $10^4$ is an additive weight of $500$ and the number tells you nothing on its own.

## Multiplicative uncertainty, at the input and at the output

The relative description. For a square plant, multiply rather than add:

$$\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\,\mathbf{G} \quad\text{(output)}, \qquad \mathbf{G}_p = \mathbf{G}\,(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta}) \quad\text{(input)}.$$

The weight now carries a **relative** error and is dimensionless: $\lvert W(j\omega)\rvert = 0.2$ means twenty percent, at every plant gain. That is why multiplicative weights are what hardware tolerances turn into most naturally, and why almost every robust-stability test in this module is written against one. The envelope to cover is

$$l_I(\omega) = \max_{\mathbf{G}_p \in \Pi}\ \bar{\sigma}\big((\mathbf{G}_p(j\omega) - \mathbf{G}(j\omega))\,\mathbf{G}(j\omega)^{-1}\big)$$

for the output form, and the same expression with $\mathbf{G}^{-1}$ on the left for the input form. For a single-input single-output plant the two forms are identical, because scalars commute, and $W_A = W_O\,G$ converts between additive and multiplicative descriptions exactly.

For a multivariable plant they are not identical, and the difference is not cosmetic. An error at the **input** is an actuator error: a thruster that fires ten percent hot, a gimbal with a scale-factor error, a reaction wheel whose torque constant drifts. An error at the **output** is a sensor or alignment error: a star tracker boresight misaligned in the body frame, a rate gyro cross-axis coupling term. Put the block where the physics puts it. Pushing an input error round to the output requires $\mathbf{W}_O\boldsymbol{\Delta}_O = \mathbf{G}\mathbf{W}_I\boldsymbol{\Delta}_I\mathbf{G}^{-1}$, a similarity transformation that changes both the size and the structure of the block, and for an ill-conditioned plant it changes them by a lot.

Two further forms appear in the literature and are worth recognising. The **inverse** multiplicative forms, $\mathbf{G}_p = (\mathbf{I} - \mathbf{W}\boldsymbol{\Delta})^{-1}\mathbf{G}$ and its input twin, can represent a plant whose number of right-half-plane poles changes with the perturbation — an ordinary multiplicative form cannot. And **coprime factor** uncertainty perturbs the numerator and denominator factors of $\mathbf{G}$ independently, which is the description behind the Glover–McFarlane loop-shaping procedure.

::: example An actuator weight from a datasheet
A gimbal actuator is specified with a gain anywhere in $\pm 20\,\%$ of nominal, and a transport delay anywhere from $0$ to $10\,\mathrm{ms}$ covering computation, sensor filtering and valve response. Nominal model: unity gain, no delay. The true actuator is $G_p(s) = k\,e^{-\tau s}$ with $k \in [0.8, 1.2]$ and $\tau \in [0, 0.010]\,\mathrm{s}$, so the relative error envelope is

$$l_I(\omega) = \max_{k, \tau}\ \lvert k\,e^{-j\omega\tau} - 1\rvert .$$

At $\omega \to 0$ the delay contributes nothing and $l_I = 0.2$, the gain error alone. As $\omega\tau$ grows the exponential sweeps around the unit circle and the worst case is $k = 1.2$ with $\tau = 10\,\mathrm{ms}$; the envelope saturates at $k_{\max} + 1 = 2.2$ once $\omega\tau \ge \pi$, that is above $\omega = \pi/0.010 = 314\,\mathrm{rad/s}$. The crossing $l_I = 1$ is worth having exactly: $\lvert 1.2e^{-j\theta} - 1\rvert^2 = 1.44 - 2.4\cos\theta + 1 = 1$ gives $\cos\theta = 0.6$, $\theta = 0.9273\,\mathrm{rad}$, and with $\tau = 0.010\,\mathrm{s}$ that is $\omega = 92.7\,\mathrm{rad/s}$.

A first-order weight of the standard form covers it:

$$W(s) = \frac{T s + r_0}{(T/r_\infty)\,s + 1}, \qquad T = 0.016\,\mathrm{s}, \quad r_0 = 0.2, \quad r_\infty = 2.5,$$

that is $W(s) = (0.016 s + 0.2)/(0.0064 s + 1)$, with a zero at $12.5\,\mathrm{rad/s}$ and a pole at $156\,\mathrm{rad/s}$. Checked on a grid from $10^{-3}$ to $10^{5}\,\mathrm{rad/s}$, $\lvert W\rvert \ge l_I$ everywhere, touching at DC. It reads $0.200$ at $0.1\,\mathrm{rad/s}$, $0.256$ at $10\,\mathrm{rad/s}$, crosses $1$ at $66.9\,\mathrm{rad/s}$ and levels off at $2.5$. Note that $r_\infty = 2.2$ cannot work at any $T$: the envelope *attains* $2.2$ at a finite frequency, whereas this weight form only approaches $r_\infty$ asymptotically from below. Taking $r_\infty = 2.5$ buys strict domination at the price of about fourteen percent of pure conservatism at high frequency, which is the standing cost of a low-order weight.
:::

::: warning A relative weight is meaningless where the nominal plant vanishes
$l_I$ divides by $\mathbf{G}$, so wherever $\mathbf{G}(j\omega)$ has a zero on or near the imaginary axis, $l_I$ blows up even though the absolute error is tiny. A lightly damped anti-resonance does exactly this. The fix is to use the additive form in that band, or a coprime-factor description, or to move the nominal anti-resonance into the uncertainty set so that the division is never by something near zero.
:::

## Parametric uncertainty

Parametric uncertainty keeps the model structure and admits that its coefficients are intervals: $J \in [102, 138]\,\mathrm{kg\,m^2}$, first mode $\omega_1 \in [10.8, 13.2]\,\mathrm{rad/s}$, damping $\zeta_1 \in [0.002, 0.01]$. The perturbation block that comes out of this is **real** and **repeated** — one scalar $\delta_J \in [-1, 1]$ may appear in four places in the state-space realisation — rather than a full complex matrix.

This is the most honest description available, and it is also the hardest to analyse, which is the central tension of the subject. A real parameter set is a thin curved sheet in the space of plants. Covering it with a complex disk of the same radius is always valid and is sometimes wildly conservative, because the disk contains plants whose phase is arbitrary at every frequency while the true family's phase is pinned by the parameter.

::: example What covering a shifted resonance really costs
Take a single-axis flexible model with a rigid mode and one array mode,

$$G(s) = \frac{1}{J}\left[\frac{1}{s^2} + \frac{0.6}{s^2 + 2\zeta\omega_1 s + \omega_1^2}\right], \qquad J = 120\,\mathrm{kg\,m^2},\ \zeta = 0.005,$$

with nominal $\omega_1 = 12\,\mathrm{rad/s}$ and a $\pm 10\,\%$ parametric uncertainty on that frequency, from propellant load and thermal state. The nominal model has an anti-resonance where $1.6s^2 + 2\zeta\omega_1 s + \omega_1^2 = 0$, that is at $\lvert s\rvert = 12/\sqrt{1.6} = 9.49\,\mathrm{rad/s}$.

Sampling $\omega_1$ across its interval and computing the relative error at each frequency gives an envelope that is $0.001$ at $1\,\mathrm{rad/s}$ and $0.005$ at $50\,\mathrm{rad/s}$ — a tenth of a percent, nothing — and **48.7** at $9.49\,\mathrm{rad/s}$, with a secondary value of $27.4$ near the resonance itself at $11\,\mathrm{rad/s}$. A multiplicative weight covering this set must be nearly two orders of magnitude tall over a band a few rad/s wide, and a controller that satisfies $\lvert W T\rvert < 1$ there is forced to have $\lvert T\rvert$ below $0.02$ across that band: a notch so deep that it may as well be a hole in the loop.

The additive envelope for the same family peaks at $4.28\times 10^{-3}\,\mathrm{rad/(N\,m)}$ at $10.8\,\mathrm{rad/s}$, against a nominal $\lvert G\rvert$ there of $1.12\times 10^{-4}$: the ratio is the same $38$, but the additive number is at least a sane quantity to fit. The real lesson is that a small parametric shift of a lightly damped pole pair is enormous when measured in relative error, because the two plants' resonance peaks miss each other entirely. Treating a moving mode as unstructured uncertainty is the most expensive thing you can do to a flexible-structure design, and it is why the structured singular value exists.
:::

::: example Where the block goes on a coupled spacecraft
The three-axis spacecraft used throughout this module has

$$\mathbf{J} = \begin{pmatrix} 120 & 18 & 12 \\ 18 & 100 & 9 \\ 12 & 9 & 140\end{pmatrix}\ \mathrm{kg\,m^2}, \qquad \mathbf{J}^{-1} = 10^{-3}\begin{pmatrix} 8.622 & -1.494 & -0.643 \\ -1.494 & 10.317 & -0.535 \\ -0.643 & -0.535 & 7.232\end{pmatrix},$$

so the rigid plant is $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$. Suppose the roll actuator is twenty percent hot: the true perturbation is $\boldsymbol{\Delta}_I = \operatorname{diag}(1, 0, 0)$ with $W_I = 0.2$, applied at the **input**, giving $\mathbf{G}(\mathbf{I} + 0.2\boldsymbol{\Delta}_I)$ — which scales the first *column* of $\mathbf{J}^{-1}$, that is, the response to roll torque. Applying the identical block at the output instead scales the first *row*, the roll response to every torque. Numerically the two perturbed plants differ by $2.91\,\%$ of $\bar{\sigma}(\mathbf{G})$ at every frequency, from a single twenty percent actuator error on a mildly coupled vehicle. On an ill-conditioned plant the discrepancy is far larger, and a robust-stability certificate computed against the wrong one certifies nothing.
:::

::: key Uncertainty descriptions
Additive $\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\boldsymbol{\Delta}$; output multiplicative $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\mathbf{G}$; input multiplicative $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta})$; all with $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ and the size carried by the stable minimum-phase weight. For SISO plants the two multiplicative forms coincide and $W_A = W_O G$; for MIMO plants they do not, and the block belongs where the hardware error is. Parametric uncertainty keeps the model structure with real, possibly repeated, interval parameters; unstructured uncertainty replaces it by a full complex block of the same size.
:::

## Structured and unstructured

A **full complex block** $\boldsymbol{\Delta}$ of the same dimensions as the plant is the unstructured description: at each frequency it may be any complex matrix of largest singular value at most one, with any phase and any input and output direction. A **structured** set restricts $\boldsymbol{\Delta}$ to a block-diagonal pattern, possibly with real blocks and repeated scalars, and possibly with blocks of different physical origin sitting in different slots: one for each actuator, one for the moving bending mode, one for the aerodynamic database.

The trade is stark and it runs through the rest of the module. Unstructured descriptions buy you the small gain theorem and the two-Riccati H-infinity solution — tests and syntheses that run in polynomial time and always return an answer. Structured descriptions require the structured singular value, which is NP-hard to compute exactly and is handled with upper and lower bounds. The reward for the harder problem is that the answer is not conservative: a design rejected by the unstructured test may be perfectly safe once the structure is accounted for, and on a coupled multi-actuator vehicle the gap between the two verdicts is routinely a factor of two or more in allowed uncertainty.

The practical sequence in industry is to build a structured model of the hardware, run the unstructured test first because it is cheap, and go to the structured analysis only where the cheap test fails. That order also protects you from the commonest error in the subject, which is to build a beautifully structured uncertainty description, run the unstructured test on it anyway, fail, and then shrink the uncertainty until the test passes.

::: warning The weight covers the set; it does not fit it
A least-squares fit through the middle of an uncertainty envelope is not a weight. Robust stability says "for every plant in the set", so a weight that lies below the envelope at even one frequency excludes a plant that the hardware can actually be. Fit the envelope from above, check the fit on the sampling grid, and check it again on a grid ten times finer, because a narrow spike between grid points is exactly where a lightly damped mode will put its worst case.
:::

## Check yourself

::: check
A sensor is specified to have a gain error of at most $\pm 4\,\%$ and a first-order lag with a time constant anywhere in $[0, 2]\,\mathrm{ms}$. Sketch the relative-error envelope and give its value at $1\,\mathrm{rad/s}$, at $500\,\mathrm{rad/s}$ and as $\omega\to\infty$.
:::

::: answer
The perturbed sensor is $G_p = k/(1 + T s)$ with $k \in [0.96, 1.04]$, $T \in [0, 0.002]$, and the nominal is $1$. The relative error is $\lvert k/(1 + j\omega T) - 1\rvert$. At $1\,\mathrm{rad/s}$ the lag contributes $\omega T \le 0.002\,\mathrm{rad}$, negligible, so the envelope is the gain error $0.04$. At $500\,\mathrm{rad/s}$, $\omega T$ reaches $1$, so $k/(1 + j) = k(0.5 - 0.5j)$ and the worst case is $k = 0.96$: $\lvert 0.48 - 0.48j - 1\rvert = \lvert -0.52 - 0.48j\rvert = 0.708$. As $\omega\to\infty$ the lag drives $G_p\to 0$ and the error tends to $\lvert 0 - 1\rvert = 1$. Writing $x = \omega T$, the squared error is $(k^2 - 2k)/(1 + x^2) + 1$, which for $k$ near one increases monotonically in $x$ from $(k-1)^2$ to $1$; the envelope therefore climbs from $0.04$ and approaches $1$ without exceeding it. A weight of the standard form with $r_0 = 0.04$, $r_\infty$ a little above $1$ and $T \approx 0.002\,\mathrm{s}$ covers it.
:::

::: check
Why is the additive description preferred to the multiplicative one in the neighbourhood of a lightly damped anti-resonance, and what goes wrong with the design if you insist on the multiplicative one?
:::

::: answer
The relative envelope $l_I = \lvert (G_p - G)/G\rvert$ divides by a nominal plant that is nearly zero at the anti-resonance, so it spikes even when the absolute difference is small; the flexible example above hits $48.7$ at $9.49\,\mathrm{rad/s}$. A weight covering that spike forces $\lvert T\rvert < 1/48.7 = 0.021$ over that band, roughly a $34\,\mathrm{dB}$ notch. The controller either buys the notch — which costs phase near crossover and is fragile to the notch frequency moving — or the design is declared infeasible. Neither reflects reality: the absolute error at that frequency is a few thousandths of a $\mathrm{rad/(N\,m)}$, and the additive weight says so.
:::

::: check
For a SISO plant $G(s) = 5/(s+2)$ with $\pm 30\,\%$ gain uncertainty and a pole anywhere in $[1.5, 3]$, is $\lvert W_A(j\omega)\rvert$ larger at DC or at $\omega = 100\,\mathrm{rad/s}$? Give both numbers.
:::

::: answer
At DC, $G(0) = 2.5$ and $G_p(0) = k\cdot 5/p$ with $k\in[0.7,1.3]$, $p\in[1.5,3]$, so $G_p(0)$ ranges over $[0.7\cdot 5/3,\ 1.3\cdot 5/1.5] = [1.167, 4.333]$. The largest deviation from $2.5$ is $4.333 - 2.5 = 1.833$, so $l_A(0) = 1.83$. At $\omega = 100$, $\lvert G(j100)\rvert = 5/\sqrt{10004} = 0.0500$ and $\lvert G_p\rvert$ is at most $1.3\cdot 5/\sqrt{10000 + 2.25} = 0.0650$; the pole barely matters that far out, so the worst deviation is about $1.3\times 0.050 - 0.050 = 0.015$. The additive weight is more than a hundred times larger at DC than at $100\,\mathrm{rad/s}$. The *relative* weight is roughly $0.73$ at DC ($1.833/2.5$) and $0.30$ at $100\,\mathrm{rad/s}$ — a far flatter, far more useful description, which is the general reason multiplicative weights are the default.
:::

::: check
The three-axis spacecraft has each of its three reaction wheels specified to $\pm 5\,\%$ torque scale factor, independently. Write the uncertainty description, state the structure of $\boldsymbol{\Delta}$, and say what is lost by replacing it with a full complex $3\times 3$ block of norm one.
:::

::: answer
$\mathbf{G}_p = \mathbf{G}(\mathbf{I} + 0.05\,\boldsymbol{\Delta})$ with $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2, \delta_3)$, each $\delta_i$ real and in $[-1, 1]$ — input multiplicative, because the error is in the actuators, with a diagonal, real, three-block structure. Replacing it by a full complex block admits three things the hardware cannot do: off-diagonal terms, so a roll torque command producing a pitch torque; arbitrary phase, so a scale factor that behaves like a $90^\circ$ lag; and frequency variation, so a scale factor that is $+5\,\%$ at one frequency and $-5\,\%$ at another. Each is a real physical possibility for *some* hardware fault, but none of them is what a wheel scale-factor tolerance means, and together they can easily double the apparent size of the uncertainty. The structured singular value is the tool that keeps the diagonal structure.
:::

::: check
You are handed an uncertainty weight that a colleague fitted by least squares through the middle of the sampled envelope, and the design passes its robust-stability test with the peak at $0.95$. What do you do?
:::

::: answer
Refit the weight from above and rerun. A weight through the middle of the envelope excludes roughly half the sampled plants, so a peak of $0.95$ against it is not a robust-stability result at all. The correct procedure is to take the upper envelope over a dense grid of the uncertain parameters, fit a low-order stable minimum-phase weight that dominates it everywhere, verify the domination on a finer grid, and then run the test. If the honest weight pushes the peak above one, that is information — it means the design does not tolerate the hardware you have bought, and the answer is to retune, to buy better hardware, or to negotiate the tolerance, not to shrink the weight.
:::

## Summary

| Item | Statement |
| --- | --- |
| Plant set | $\Pi = \{\mathbf{G}_p = \mathcal{F}(\mathbf{G}, \mathbf{W}, \boldsymbol{\Delta}) : \lVert\boldsymbol{\Delta}\rVert_\infty \le 1\}$; weight carries the size, $\boldsymbol{\Delta}$ is a normalised unknown transfer function |
| Additive | $\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\boldsymbol{\Delta}$; $\lvert W_A\rvert$ has the units of $\mathbf{G}$; use near plant zeros |
| Output multiplicative | $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\mathbf{G}$; sensor and alignment errors |
| Input multiplicative | $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta})$; actuator errors; differs from the output form for MIMO plants |
| Envelope | $l_I(\omega) = \max_\Pi\bar{\sigma}((\mathbf{G}_p - \mathbf{G})\mathbf{G}^{-1})$; the weight must dominate it at every frequency |
| Standard weight | $W(s) = (Ts + r_0)/((T/r_\infty)s + 1)$: $r_0$ at DC, $r_\infty$ at high frequency, corner near $1/T$ |
| Actuator example | $k\in[0.8,1.2]$, $\tau\in[0,10]\,\mathrm{ms}$: $l_I(0) = 0.2$, crosses $1$ at $92.7\,\mathrm{rad/s}$, saturates at $2.2$; weight $(0.016s + 0.2)/(0.0064s + 1)$ |
| Parametric | real interval parameters in a fixed structure; $\boldsymbol{\Delta}$ real, possibly repeated; most honest, hardest to analyse |
| Unstructured | full complex block, any phase and direction; cheap tests, conservative verdicts |
| Cost of covering | a $\pm 10\,\%$ shift of a $\zeta = 0.005$ mode at $12\,\mathrm{rad/s}$ reads as a relative error of $48.7$ near its anti-resonance |

The next lesson takes any of these descriptions, pulls the block out into an $\mathbf{M}$–$\boldsymbol{\Delta}$ loop, and gives the one theorem that turns a bounded uncertainty into a stability guarantee: the small gain theorem.
