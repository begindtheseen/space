---
id: l01-modelling-uncertainty
title: Modelling uncertainty
minutes: 24
covers:
  - 'Modelling uncertainty: additive, multiplicative (input and output), parametric, unstructured'
---

Suppose a friend asks how long your walk to school takes. You could say "twelve minutes". But on a good day it is ten, and when the light at the big crossing is red it is fifteen. The honest answer is a *range*: "ten to fifteen minutes". Plan on twelve and you will sometimes be late.

Every model you have designed against so far gave the "twelve minutes" answer. The spacecraft had no floppy solar array. The actuator had no delay. The inertia was one table of numbers, not a spread that changes as propellant burns off. Classical and optimal design take that one model at its word. **Robust control** starts one step earlier. It writes down a whole **set** of plants that the real vehicle is believed to lie in, and then asks for one controller that works for every member of the set.

The set is the whole game. Make it too small and the analysis is a comforting story — the real vehicle sits outside the set, and the margins you reported were never real. Make it too big and the only controllers that can handle it are too gentle to meet the pointing requirement. The engineering is in building a set that is honestly big enough and no bigger, from numbers you can defend: a torque constant good to five percent on a datasheet, a hydraulic actuator that gets half as fast when its fluid is cold, a first bending mode measured at two propellant loads on a **[[shaker table|modal-test]]** and guessed in between.

This lesson gives the four ways that set gets written down — additive, multiplicative at the input or output, and parametric — and the difference between a *structured* description, which tracks where the error lives, and an *unstructured* one, which throws that away for a test you can actually run.

## A set of plants, not one plant

Call the model you designed against the **[[nominal|nominal-word]]** plant, $\mathbf{G}(s)$ — the "twelve minutes" answer. Call the real vehicle $\mathbf{G}_p(s)$, read "G sub p", with p for *perturbed*. You do not know $\mathbf{G}_p$. You only claim it belongs to a set, written $\Pi$ (capital pi).

To be useful to a control engineer, the set must be described in one particular shape. There is a **fixed, known wiring diagram** that contains $\mathbf{G}$ and some **weights**. Inside it sits one unknown block, $\boldsymbol{\Delta}$ (read "delta"), which is pulled out and limited in size:

$$\Pi = \{\,\mathbf{G}_p(s) : \mathbf{G}_p = \mathcal{F}(\mathbf{G}, \mathbf{W}, \boldsymbol{\Delta}),\ \lVert\boldsymbol{\Delta}\rVert_\infty \le 1\,\}.$$

Read it as: "every plant you get by plugging some $\boldsymbol{\Delta}$ of size at most one into the known wiring $\mathcal{F}$". Two agreements make this work.

First, $\boldsymbol{\Delta}$ is **normalised** — scaled so that its size limit is exactly one. All the information about *how big* the error is, and *at which frequencies*, is moved into the **weight** $\mathbf{W}(s)$: a stable, known transfer function that you choose. The unknown is left as a plain "anything up to size one".

Second, $\boldsymbol{\Delta}$ is a **transfer function**, not a single number. It is an unknown stable system whose gain is at most one at every frequency:

$$\sup_\omega\ \bar{\sigma}\big(\boldsymbol{\Delta}(j\omega)\big) \le 1 .$$

Here $\sup_\omega$ (read "sup over omega", short for *supremum*) means "the largest value over all frequencies", and $\bar{\sigma}$ ("sigma bar") is the **[[largest singular value|singular-value]]** — the biggest factor by which a matrix can stretch a vector. For a single-input, single-output plant, $\bar{\sigma}$ is the plain magnitude $\lvert\Delta(j\omega)\rvert$.

Letting $\boldsymbol{\Delta}$ change with frequency lets one weight cover a whole family of errors. It is also the most common source of pessimism: the real vehicle's error is one particular curve. $\boldsymbol{\Delta}$ is allowed to be **[[any curve inside the disk|disk-versus-hardware]]**, including many the hardware could never produce.

The symbol $\lVert\cdot\rVert_\infty$, read "the H-infinity norm", is defined properly two lessons from now. For now, $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ is the line above: gain at most one at every frequency.

## Additive uncertainty

The bluntest description: add an unknown piece of limited size.

$$\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\,\boldsymbol{\Delta}, \qquad \lVert\boldsymbol{\Delta}\rVert_\infty \le 1.$$

Picture it for a single-input plant. At each frequency, $G(j\omega)$ is one point in the complex plane. The true plant lies somewhere in a disk of radius $\lvert W_A(j\omega)\rvert$ centred on that point. The weight $W_A$ carries the **absolute** error — "off by this much" — so it has the same units as the plant. For a torque-to-angle plant that is $\mathrm{rad/(N\,m)}$.

How big must the weight be? At every frequency, at least as big as the worst error in the set:

$$\lvert W_A(j\omega)\rvert \ \ge\ l_A(\omega) \ \equiv\ \max_{\mathbf{G}_p \in \Pi}\ \bar{\sigma}\big(\mathbf{G}_p(j\omega) - \mathbf{G}(j\omega)\big).$$

The curve $l_A(\omega)$ is the **envelope**, the top edge of all the errors ($\equiv$ means "is defined as"). You fit a low-order transfer function above it. It must be stable and **[[minimum-phase|minimum-phase]]**, so that the analysis can invert it without creating right-half-plane trouble of its own. And it must sit above *everywhere*. A weight that dips below the envelope at one frequency leaves a plant uncovered. Robust stability is a promise about *every* plant in the set, and one uncovered plant breaks the promise.

Additive form is the right choice where the nominal plant is small or zero: near an anti-resonance, or above the last mode you modelled. Its weakness: a five percent error on a plant with gain $10^4$ is an additive weight of $500$, a number that means nothing on its own.

## Multiplicative uncertainty, at the input and at the output

The relative description. Instead of "off by this much", say "off by this *fraction*". For a square plant (as many inputs as outputs):

$$\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\,\mathbf{G} \quad\text{(output)}, \qquad \mathbf{G}_p = \mathbf{G}\,(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta}) \quad\text{(input)}.$$

Here $\mathbf{I}$ is the identity matrix, the matrix version of "1". The weight now carries a **relative** error and has no units: $\lvert W(j\omega)\rvert = 0.2$ means twenty percent, whatever the plant's gain. Hardware tolerances turn most naturally into this form, so almost every robust-stability test in this module is written against it.

The envelope to cover, for the output form, is

$$l_I(\omega) = \max_{\mathbf{G}_p \in \Pi}\ \bar{\sigma}\big((\mathbf{G}_p(j\omega) - \mathbf{G}(j\omega))\,\mathbf{G}(j\omega)^{-1}\big),$$

"the worst error, divided by the nominal plant". For the input form, put $\mathbf{G}^{-1}$ on the left instead. For a single-input, single-output (SISO) plant the two forms are the same, because ordinary numbers can be multiplied in either order. Then $W_A = W_O\,G$ converts exactly between the additive and multiplicative descriptions.

For a **MIMO** plant — multi-input, multi-output — they are *not* the same, because $\mathbf{A}\mathbf{B}$ is usually not $\mathbf{B}\mathbf{A}$.

- An error at the **input** is an **actuator** error: a thruster that fires ten percent hot, a gimbal with a scale-factor error, a reaction wheel whose torque constant drifts.
- An error at the **output** is a **sensor** or alignment error: a star tracker tilted slightly in the body frame, a rate gyro that picks up a little of the neighbouring axis.

Put the block where the physics puts it. Moving an input error round to the output needs $\mathbf{W}_O\boldsymbol{\Delta}_O = \mathbf{G}\mathbf{W}_I\boldsymbol{\Delta}_I\mathbf{G}^{-1}$, which changes both the size and the pattern of the block — a lot, for a plant much stronger in some directions than others.

Two more forms are worth recognising. The **inverse** multiplicative forms, such as $\mathbf{G}_p = (\mathbf{I} - \mathbf{W}\boldsymbol{\Delta})^{-1}\mathbf{G}$, allow plants whose number of right-half-plane poles changes with the perturbation; the ordinary form cannot. And **[[coprime factor|coprime-factors]]** uncertainty writes $\mathbf{G}$ as a fraction of two stable pieces and perturbs top and bottom separately — the description behind Glover–McFarlane loop shaping.

::: example An actuator weight from a datasheet
A gimbal actuator's gain is specified as anywhere within $\pm 20\,\%$ of nominal. Its **[[transport delay|transport-delay]]** — the dead time from computation, sensor filtering and valve response — is anywhere from $0$ to $10\,\mathrm{ms}$. The nominal model is unity gain with no delay, $G = 1$.

The true actuator is $G_p(s) = k\,e^{-\tau s}$ with $k \in [0.8, 1.2]$ and $\tau \in [0, 0.010]\,\mathrm{s}$. Since $G = 1$, the relative error envelope is

$$l_I(\omega) = \max_{k, \tau}\ \lvert k\,e^{-j\omega\tau} - 1\rvert .$$

**Low frequency.** As $\omega \to 0$ the delay does nothing ($e^{0} = 1$), so the worst error is the gain error alone: $l_I(0) = \lvert 1.2 - 1\rvert = 0.2$.

**High frequency.** As $\omega\tau$ grows, the factor $e^{-j\omega\tau}$ swings round the unit circle. The worst case is the biggest gain and longest delay, $k = 1.2$ and $\tau = 10\,\mathrm{ms}$. Once $\omega\tau$ reaches $\pi$, the actuator output points straight backwards: $1.2e^{-j\pi} = -1.2$, and the error is $\lvert -1.2 - 1\rvert = 2.2$. That happens above $\omega = \pi/0.010 = 314\,\mathrm{rad/s}$, and the envelope stays at $2.2$ from there on.

**Where the error reaches 100 %.** Set $\theta = \omega\tau$ and ask when $\lvert 1.2e^{-j\theta} - 1\rvert = 1$. Square both sides and expand:

$$\lvert 1.2e^{-j\theta} - 1\rvert^2 = 1.44 - 2.4\cos\theta + 1 = 1 .$$

That gives $\cos\theta = 1.44/2.4 = 0.6$, so $\theta = 0.9273\,\mathrm{rad}$. With $\tau = 0.010\,\mathrm{s}$, that is $\omega = 0.9273/0.010 = 92.7\,\mathrm{rad/s}$.

**The weight.** A first-order weight of the standard form covers this envelope:

$$W(s) = \frac{T s + r_0}{(T/r_\infty)\,s + 1}, \qquad T = 0.016\,\mathrm{s}, \quad r_0 = 0.2, \quad r_\infty = 2.5 .$$

Here $r_0$ is the weight's value at DC (zero frequency), $r_\infty$ its value at very high frequency, and $T$ sets where it climbs. Putting the numbers in gives $W(s) = (0.016 s + 0.2)/(0.0064 s + 1)$. It has a zero at $0.2/0.016 = 12.5\,\mathrm{rad/s}$ and a pole at $1/0.0064 = 156\,\mathrm{rad/s}$.

**Check it covers.** On a grid from $10^{-3}$ to $10^{5}\,\mathrm{rad/s}$, $\lvert W\rvert \ge l_I$ everywhere, touching only at DC. It reads $0.200$ at $0.1\,\mathrm{rad/s}$ and $0.256$ at $10\,\mathrm{rad/s}$. It reaches $1$ at $66.8\,\mathrm{rad/s}$ — earlier than the envelope's $92.7$, as a cover must — and levels off at $2.5$. You can see the two curves side by side in the note on **[[the envelope and its weight|envelope-and-weight]]**.

Why not $r_\infty = 2.2$, the exact top of the envelope? It cannot work for any $T$: the envelope *reaches* $2.2$ at a finite frequency, while this weight only creeps towards $r_\infty$ from below. Choosing $2.5$ buys a strict cover for about fourteen percent of pure pessimism at high frequency ($2.5/2.2 = 1.14$) — the standing cost of a low-order weight.
:::

::: warning A relative weight is meaningless where the nominal plant vanishes
$l_I$ divides by $\mathbf{G}$. So wherever $\mathbf{G}(j\omega)$ has a zero on or near the imaginary axis, $l_I$ blows up, even when the absolute error is tiny. A lightly damped anti-resonance does exactly this. The fix is to use the additive form in that band, or a coprime-factor description, or to put the nominal anti-resonance inside the uncertainty set so you never divide by something near zero.
:::

## Parametric uncertainty

Back to the walk to school. Instead of "ten to fifteen minutes", you could say *why*: "the walk is twelve minutes, plus a red light that lasts zero to three minutes". That keeps the structure of the trip and admits which piece you are unsure of.

**Parametric** uncertainty does the same for a plant. It keeps the model's equations and admits that some of its numbers are ranges, called **intervals**: inertia $J \in [102, 138]\,\mathrm{kg\,m^2}$, first bending mode $\omega_1 \in [10.8, 13.2]\,\mathrm{rad/s}$, damping $\zeta_1 \in [0.002, 0.01]$. The unknown block that comes out is **real** — an actual number, with no phase — and often **repeated**: one scalar $\delta_J \in [-1, 1]$ may appear in four places in the state-space model. It is not a full complex matrix.

This is the most honest description there is, and the hardest to analyse — a tension that runs through the whole subject. Covering a set of real parameters with a complex disk of the same size is always *allowed*, but can be wildly pessimistic: the disk contains plants with any phase at every frequency, while the real family's phase is pinned by the parameter.

::: example What covering a shifted resonance really costs
Take one axis of a spacecraft with a rigid body and one solar-array mode:

$$G(s) = \frac{1}{J}\left[\frac{1}{s^2} + \frac{0.6}{s^2 + 2\zeta\omega_1 s + \omega_1^2}\right], \qquad J = 120\,\mathrm{kg\,m^2},\ \zeta = 0.005 .$$

The nominal mode frequency is $\omega_1 = 12\,\mathrm{rad/s}$, with $\pm 10\,\%$ uncertainty from propellant load and temperature. The nominal model has an **[[anti-resonance|anti-resonance]]** — a frequency where the two terms nearly cancel and the plant almost stops responding. Adding the fractions, the numerator is $1.6s^2 + 2\zeta\omega_1 s + \omega_1^2$, which is nearly zero at $\lvert s\rvert = 12/\sqrt{1.6} = 9.49\,\mathrm{rad/s}$.

Now sample $\omega_1$ across $[10.8, 13.2]$ and compute the relative error at each frequency. The envelope is:

- $0.001$ at $1\,\mathrm{rad/s}$, and $0.005$ at $50\,\mathrm{rad/s}$ — under one percent, nothing;
- **48.7** at $9.49\,\mathrm{rad/s}$, the anti-resonance;
- a second peak of $38.5$ at $10.8\,\mathrm{rad/s}$, where the softest plant in the set resonates.

A multiplicative weight covering this must reach nearly $50$ over a band a few $\mathrm{rad/s}$ wide. The next lesson's robust-stability test, $\lvert WT\rvert < 1$, would then force the closed-loop gain $\lvert T\rvert$ below $1/48.7 \approx 0.02$ there — a notch so deep it may as well be a hole in the loop.

The additive envelope for the same family peaks at $4.28\times 10^{-3}\,\mathrm{rad/(N\,m)}$ at $10.8\,\mathrm{rad/s}$. The nominal $\lvert G\rvert$ there is $1.12\times 10^{-4}$. The ratio, $4.28\times 10^{-3}/1.12\times 10^{-4} = 38$, matches the relative envelope there, but the additive number is a sensible thing to fit.

**Sanity check.** A ten percent shift in one number became a 4,870 percent error. Believable? Yes: with damping this light the resonance peak is very narrow, and the two plants' peaks miss each other entirely. Treating a moving mode as unstructured uncertainty is the most expensive thing you can do to a flexible-structure design. It is the reason the structured singular value exists.
:::

::: example Where the block goes on a coupled spacecraft
The three-axis spacecraft used throughout this module has

$$\mathbf{J} = \begin{pmatrix} 120 & 18 & 12 \\ 18 & 100 & 9 \\ 12 & 9 & 140\end{pmatrix}\ \mathrm{kg\,m^2}, \qquad \mathbf{J}^{-1} = 10^{-3}\begin{pmatrix} 8.622 & -1.494 & -0.643 \\ -1.494 & 10.317 & -0.535 \\ -0.643 & -0.535 & 7.232\end{pmatrix}.$$

The off-diagonal entries are the **[[products of inertia|products-of-inertia]]**, which couple the axes. The rigid plant is $\mathbf{G}(s) = \mathbf{J}^{-1}/s^2$.

Suppose the roll actuator is twenty percent hot. The true perturbation is $\boldsymbol{\Delta}_I = \operatorname{diag}(1, 0, 0)$ — a matrix with $1$ in the top-left corner and zeros elsewhere — with $W_I = 0.2$, applied at the **input**. The plant becomes $\mathbf{G}(\mathbf{I} + 0.2\boldsymbol{\Delta}_I)$. Multiplying on the right scales the first *column* of $\mathbf{J}^{-1}$: the response of every axis to roll torque.

Put the identical block at the output instead, $(\mathbf{I} + 0.2\boldsymbol{\Delta}_I)\mathbf{G}$. Multiplying on the left scales the first *row*: the roll response to every torque. The two plants differ by $2.91\,\%$ of $\bar{\sigma}(\mathbf{G})$ at every frequency, from one twenty percent actuator error on a mildly coupled vehicle. On a plant with a bigger spread between strong and weak directions the gap is far larger, and a certificate computed against the wrong one certifies nothing.
:::

::: key Uncertainty descriptions
Additive $\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\boldsymbol{\Delta}$; output multiplicative $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\mathbf{G}$; input multiplicative $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta})$; all with $\lVert\boldsymbol{\Delta}\rVert_\infty \le 1$ and the size carried by the stable minimum-phase weight. For SISO plants the two multiplicative forms coincide and $W_A = W_O G$; for MIMO plants they do not, and the block belongs where the hardware error is. Parametric uncertainty keeps the model structure with real, possibly repeated, interval parameters; unstructured uncertainty replaces it by a full complex block of the same size.
:::

## Structured and unstructured

A **full complex block** $\boldsymbol{\Delta}$, the same size as the plant, is the **unstructured** description. At each frequency it may be any complex matrix with largest singular value at most one — any phase, any input direction, any output direction.

A **structured** set limits $\boldsymbol{\Delta}$ to a block-diagonal pattern: small blocks down the diagonal and zeros elsewhere. Some blocks may be real, some may be one scalar repeated. Each block can have its own physical origin: one per actuator, one for the moving bending mode, one for the aerodynamic tables.

- **Unstructured** descriptions give you the small gain theorem and the two-Riccati H-infinity solution. These run fast and always return an answer.
- **Structured** descriptions need the structured singular value, $\mu$ ("mu"). Computing it exactly is **[[NP-hard|np-hard]]**, so tools give upper and lower bounds instead.

The reward for the harder problem is an answer that is not pessimistic. A design rejected by the unstructured test may be perfectly safe once the structure is counted; on a coupled vehicle with several actuators, the two verdicts routinely differ by a factor of two or more in the uncertainty they allow.

In industry the usual order is: build a structured model of the hardware, run the cheap unstructured test first, and go to the structured analysis only where it fails. That order guards against the most common error in the subject: building a beautiful structured model, running the unstructured test on it anyway, failing — and then shrinking the uncertainty until the test passes.

::: warning The weight covers the set; it does not fit it
A best-fit curve through the middle of an envelope is not a weight. A weight below the envelope at even one frequency leaves out a plant the hardware can really be. Fit the envelope from above. Check the fit on the sampling grid, and check it again on a grid ten times finer: a narrow spike between grid points is exactly where a lightly damped mode will put its worst case.
:::

## Check yourself

::: check
A sensor has a gain error of at most $\pm 4\,\%$ and a first-order lag with time constant anywhere in $[0, 2]\,\mathrm{ms}$. Describe the relative-error envelope and give its value at $1\,\mathrm{rad/s}$, at $500\,\mathrm{rad/s}$ and as $\omega\to\infty$.
:::

::: answer
The perturbed sensor is $G_p = k/(1 + T s)$ with $k \in [0.96, 1.04]$ and $T \in [0, 0.002]\,\mathrm{s}$; the nominal is $1$. The relative error is $\lvert k/(1 + j\omega T) - 1\rvert$.

At $1\,\mathrm{rad/s}$: $\omega T \le 0.002$, so the lag does almost nothing. The envelope is the gain error, $0.04$.

At $500\,\mathrm{rad/s}$: $\omega T$ reaches $1$. Then $k/(1 + j) = k(0.5 - 0.5j)$, and the worst case is $k = 0.96$: $\lvert 0.48 - 0.48j - 1\rvert = \lvert -0.52 - 0.48j\rvert = \sqrt{0.2704 + 0.2304} = 0.708$.

As $\omega\to\infty$: the lag drives $G_p\to 0$, so the error tends to $\lvert 0 - 1\rvert = 1$.

In between, write $x = \omega T$. The squared error is $(k^2 - 2k)/(1 + x^2) + 1$. Since $k^2 - 2k < 0$ here, it grows steadily with $x$ from $(k-1)^2$ towards $1$ without passing it. A weight of the standard form with $r_0 = 0.04$, $r_\infty$ a little above $1$ and $T \approx 0.002\,\mathrm{s}$ covers it.
:::

::: check
Why is the additive description preferred to the multiplicative one near a lightly damped anti-resonance, and what goes wrong with the design if you insist on the multiplicative one?
:::

::: answer
The relative envelope $l_I = \lvert (G_p - G)/G\rvert$ divides by a nominal plant that is nearly zero at the anti-resonance. So it spikes even when the absolute difference is small — the flexible example hits $48.7$ at $9.49\,\mathrm{rad/s}$.

A weight covering that spike forces $\lvert T\rvert < 1/48.7 = 0.021$ over that band, a notch of about $34\,\mathrm{dB}$ (since $20\log_{10}48.7 = 33.8$). Either the controller buys the notch — costing phase near crossover, and breaking if the notch frequency moves — or the design is declared impossible. Neither matches reality: the absolute error there is a few thousandths of a $\mathrm{rad/(N\,m)}$, and the additive weight says so.
:::

::: check
For a SISO plant $G(s) = 5/(s+2)$ with $\pm 30\,\%$ gain uncertainty and a pole anywhere in $[1.5, 3]$, is $\lvert W_A(j\omega)\rvert$ larger at DC or at $\omega = 100\,\mathrm{rad/s}$? Give both numbers.
:::

::: answer
**At DC.** $G(0) = 5/2 = 2.5$. The perturbed plant is $G_p(0) = k\cdot 5/p$ with $k\in[0.7,1.3]$ and $p\in[1.5,3]$. Its smallest value is $0.7\cdot 5/3 = 1.167$ and its largest $1.3\cdot 5/1.5 = 4.333$. The biggest distance from $2.5$ is $4.333 - 2.5 = 1.833$, so $l_A(0) = 1.83$.

**At 100 rad/s.** $\lvert G(j100)\rvert = 5/\sqrt{10000 + 4} = 0.0500$. The largest perturbed gain is $1.3\cdot 5/\sqrt{10000 + 2.25} = 0.0650$. That far out the pole barely matters, so the worst deviation is about $0.065 - 0.050 = 0.015$.

The additive weight is over a hundred times larger at DC. The *relative* weight is about $1.833/2.5 = 0.73$ at DC and $0.015/0.050 = 0.30$ at $100\,\mathrm{rad/s}$ — far flatter and more useful, which is why multiplicative weights are the default.
:::

::: check
Each of the three reaction wheels on the spacecraft is specified to $\pm 5\,\%$ torque scale factor, independently. Write the uncertainty description, state the structure of $\boldsymbol{\Delta}$, and say what is lost by replacing it with a full complex $3\times 3$ block of norm one.
:::

::: answer
$\mathbf{G}_p = \mathbf{G}(\mathbf{I} + 0.05\,\boldsymbol{\Delta})$ with $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \delta_2, \delta_3)$, each $\delta_i$ real and in $[-1, 1]$. It is input multiplicative, because the error is in the actuators, and the structure is diagonal, real, with three separate scalars.

A full complex block admits three things the wheels cannot do:

- off-diagonal terms — a roll command producing pitch torque;
- any phase — a scale factor that acts like a $90^\circ$ lag;
- frequency dependence — a scale factor that is $+5\,\%$ at one frequency and $-5\,\%$ at another.

None of these is what a wheel scale-factor tolerance means, and together they can easily double the apparent size of the uncertainty. The structured singular value keeps the diagonal structure.
:::

::: check
A colleague fitted an uncertainty weight by least squares through the middle of the sampled envelope, and the design passes its robust-stability test with a peak of $0.95$. What do you do?
:::

::: answer
Refit the weight from above and rerun the test. A weight through the middle of the envelope leaves out roughly half the sampled plants, so a peak of $0.95$ against it is not a robust-stability result at all.

Take the upper envelope over a dense grid of the uncertain parameters, fit a stable, minimum-phase weight above it, check on a finer grid, then run the test. If the honest weight pushes the peak above one, the design does not tolerate the hardware you have bought. Retune, buy better hardware, or negotiate the tolerance — never shrink the weight.
:::

## Summary

| Item | Statement |
| --- | --- |
| Plant set | $\Pi = \{\mathbf{G}_p = \mathcal{F}(\mathbf{G}, \mathbf{W}, \boldsymbol{\Delta}) : \lVert\boldsymbol{\Delta}\rVert_\infty \le 1\}$; the weight carries the size, $\boldsymbol{\Delta}$ is a normalised unknown transfer function |
| Additive | $\mathbf{G}_p = \mathbf{G} + \mathbf{W}_A\boldsymbol{\Delta}$; $\lvert W_A\rvert$ has the units of $\mathbf{G}$; use near plant zeros |
| Output multiplicative | $\mathbf{G}_p = (\mathbf{I} + \mathbf{W}_O\boldsymbol{\Delta})\mathbf{G}$; sensor and alignment errors |
| Input multiplicative | $\mathbf{G}_p = \mathbf{G}(\mathbf{I} + \mathbf{W}_I\boldsymbol{\Delta})$; actuator errors; differs from the output form for MIMO plants |
| Envelope | $l_I(\omega) = \max_\Pi\bar{\sigma}((\mathbf{G}_p - \mathbf{G})\mathbf{G}^{-1})$; the weight must sit above it at every frequency |
| Standard weight | $W(s) = (Ts + r_0)/((T/r_\infty)s + 1)$: $r_0$ at DC, $r_\infty$ at high frequency, corner near $1/T$ |
| Actuator example | $k\in[0.8,1.2]$, $\tau\in[0,10]\,\mathrm{ms}$: $l_I(0) = 0.2$, reaches $1$ at $92.7\,\mathrm{rad/s}$, tops out at $2.2$; weight $(0.016s + 0.2)/(0.0064s + 1)$ reaches $1$ at $66.8\,\mathrm{rad/s}$ |
| Parametric | real interval parameters in a fixed structure; $\boldsymbol{\Delta}$ real, possibly repeated; most honest, hardest to analyse |
| Unstructured | full complex block, any phase and direction; cheap tests, pessimistic verdicts |
| Cost of covering | a $\pm 10\,\%$ shift of a $\zeta = 0.005$ mode at $12\,\mathrm{rad/s}$ reads as a relative error of $48.7$ at its anti-resonance |

The next lesson takes any of these descriptions, pulls the block out into an $\mathbf{M}$–$\boldsymbol{\Delta}$ loop, and gives the one theorem that turns a bounded uncertainty into a stability guarantee: the small gain theorem.

::: context modal-test How engineers find a bending mode
A **modal survey** shakes the real structure — a solar array, a whole spacecraft — with a controlled force and records how it responds at each frequency. Peaks in the response give the natural frequencies, their widths give the damping, and many sensors spread over the structure give the mode shapes.

Tests are expensive and slow, so they are done at only a few configurations: a full and an empty propellant tank, say. Every state in between is predicted by a finite-element model tuned to match the tests. The gaps between tested points are exactly where the uncertainty set has to be generous.
:::

::: context nominal-word What "nominal" means
**Nominal** comes from the Latin for "name": the value something has *in name*, on paper. A nominal $12\,\mathrm{V}$ car battery really reads anywhere from about $11.8$ to $12.7\,\mathrm{V}$, depending on its charge. A nominal inertia of $120\,\mathrm{kg\,m^2}$ is what the mass-properties table says, not what the vehicle is on a given day.

In flight operations "nominal" has come to mean "as planned" — "the burn was nominal". In this module it keeps its first sense: the one model you picked to stand in for the whole set.
:::

::: context singular-value How much a matrix can stretch
Feed a matrix every vector of length one. The outputs trace out an ellipse (in 2-D) or an ellipsoid (in 3-D). The longest half-axis of that shape is the **largest singular value**, $\bar{\sigma}$; the shortest is the smallest singular value, $\underline{\sigma}$.

So $\bar{\sigma}$ is the worst-case gain of the matrix over every input direction. For a single number $a$ it is the plain size $\lvert a\rvert$. That makes it the natural "size" of an unknown matrix $\boldsymbol{\Delta}$: $\bar{\sigma}(\boldsymbol{\Delta}) \le 1$ says "no input, in any direction, comes out bigger than it went in".
:::

::: context disk-versus-hardware The disk is far bigger than the hardware
Here is the actuator from the worked example at one frequency, $100\,\mathrm{rad/s}$. The blue disk is everything the multiplicative description allows: centre $1$ (the nominal), radius $\lvert W(j100)\rvert = 1.36$. The orange patch is what the real actuator can do there: gain $k$ from $0.8$ to $1.2$, phase lag $\omega\tau$ from $0$ to $1\,\mathrm{rad}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="62" y1="12" x2="62" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <text x="302" y="104" font-size="11" fill="#6c7a93">Re</text>
  <text x="66" y="22" font-size="11" fill="#6c7a93">Im</text>
  <circle cx="124.0" cy="100" r="84.2" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="136.4,100.0 136.4,101.9 136.3,103.8 136.2,105.7 136.0,107.6 135.8,109.5 135.5,111.4 135.2,113.3 134.8,115.2 134.4,117.0 134.0,118.9 133.5,120.7 132.9,122.5 132.3,124.3 131.7,126.1 131.0,127.9 130.2,129.7 129.4,131.4 128.6,133.1 127.7,134.8 126.8,136.5 125.9,138.2 124.9,139.8 123.8,141.4 122.8,142.9 121.6,144.5 120.5,146.0 119.3,147.5 118.0,148.9 116.8,150.4 115.5,151.8 114.1,153.1 112.7,154.4 111.3,155.7 109.9,157.0 108.4,158.2 106.9,159.3 105.4,160.5 103.8,161.6 102.2,162.6 88.8,141.7 89.9,141.0 90.9,140.3 91.9,139.6 92.9,138.8 93.9,138.0 94.9,137.1 95.8,136.3 96.7,135.4 97.6,134.5 98.5,133.6 99.4,132.6 100.2,131.7 101.0,130.7 101.8,129.7 102.5,128.6 103.2,127.6 103.9,126.5 104.6,125.4 105.2,124.3 105.8,123.2 106.4,122.1 107.0,120.9 107.5,119.8 108.0,118.6 108.4,117.4 108.9,116.2 109.3,115.0 109.6,113.8 110.0,112.6 110.3,111.3 110.6,110.1 110.8,108.9 111.0,107.6 111.2,106.3 111.3,105.1 111.5,103.8 111.5,102.5 111.6,101.3 111.6,100.0" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="124.0" cy="100" r="3" fill="#1f2a44"/>
  <text x="120.0" y="93" font-size="11" fill="#1f2a44" text-anchor="end">nominal 1</text>
  <text x="62.0" y="114" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <line x1="186.0" y1="97" x2="186.0" y2="103" stroke="#6c7a93"/>
  <text x="186.0" y="114" font-size="11" fill="#6c7a93" text-anchor="middle">2</text>
  <text x="232" y="36" font-size="12" fill="#1d6fd1">the disk: radius</text>
  <text x="232" y="51" font-size="12" fill="#1d6fd1">|W| = 1.36</text>
  <text x="232" y="140" font-size="12" fill="#b4232c">what the actuator</text>
  <text x="232" y="155" font-size="12" fill="#b4232c">can really do</text>
  <text x="232" y="188" font-size="11" fill="#1f2a44">at ω = 100 rad/s</text>
</svg>
```

The disk includes plants that *lead* in phase, and plants whose output is nearly zero. The hardware can do neither. Every bit of disk outside the patch is pessimism the test pays for.
:::

::: context minimum-phase What "minimum-phase" asks of a weight
A transfer function is **minimum-phase** when none of its zeros (and none of its poles) sit in the right half of the complex plane. Among all systems with the same gain curve, it has the least phase lag — hence the name.

The practical point: the inverse of a minimum-phase, stable weight is also stable. Analysis and synthesis tools regularly divide by the weight, and dividing by a right-half-plane zero would create a right-half-plane pole — an instability that came from your bookkeeping, not from the vehicle.
:::

::: context coprime-factors Writing a plant as a fraction
Any plant can be written as a ratio of two *stable* transfer functions, $G = N/M$. For $G = 10/(s-2)$, one choice is $N = 10/(s+1)$ and $M = (s-2)/(s+1)$. Both pieces are stable; the unstable pole of $G$ now lives as a right-half-plane *zero* of $M$. "Coprime" means $N$ and $M$ share no zeros that would cancel.

Perturbing $N$ and $M$ separately lets an unstable pole slide around, or even cross the axis, without ever needing an unstable $\boldsymbol{\Delta}$. Keith Glover and Duncan McFarlane built their H-infinity loop-shaping method on this description around 1989, and it has since been flight-tested on research helicopters.
:::

::: context transport-delay A delay changes phase, never size
A pure delay of $\tau$ seconds has transfer function $e^{-s\tau}$. At frequency $\omega$ it has gain exactly $1$ and phase lag $\omega\tau$ radians. It does not shrink a signal; it only makes it late.

Late is enough to do damage. Compared with the undelayed signal, the error is $\lvert e^{-j\omega\tau} - 1\rvert = 2\sin(\omega\tau/2)$, which grows from $0$ to $2$ as the lag reaches half a cycle, $\omega\tau = \pi$. At that point the delayed signal is upside down. With a $1.2$ gain on top, the worst error is $1.2 + 1 = 2.2$ — the top of the envelope in the example.
:::

::: context envelope-and-weight The envelope and the weight that covers it
The red curve is the actuator's worst relative error at each frequency, $l_I(\omega)$. The blue curve is the first-order weight $\lvert W(j\omega)\rvert$ fitted to it. Both axes are logarithmic.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="175" x2="340" y2="175" stroke="#1f2a44"/>
  <line x1="45" y1="175" x2="45" y2="15" stroke="#1f2a44"/>
  <line x1="45.0" y1="175" x2="45.0" y2="179" stroke="#1f2a44"/><text x="45.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text><line x1="104.0" y1="175" x2="104.0" y2="179" stroke="#1f2a44"/><text x="104.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">1</text><line x1="163.0" y1="175" x2="163.0" y2="179" stroke="#1f2a44"/><text x="163.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">10</text><line x1="222.0" y1="175" x2="222.0" y2="179" stroke="#1f2a44"/><text x="222.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">100</text><line x1="281.0" y1="175" x2="281.0" y2="179" stroke="#1f2a44"/><text x="281.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">1000</text><line x1="340.0" y1="175" x2="340.0" y2="179" stroke="#1f2a44"/><text x="340.0" y="191" font-size="11" fill="#1f2a44" text-anchor="middle">10⁴</text><text x="41" y="179.0" font-size="11" fill="#1f2a44" text-anchor="end">0.1</text><text x="41" y="79.1" font-size="11" fill="#1f2a44" text-anchor="end">1</text><text x="41" y="44.9" font-size="11" fill="#1f2a44" text-anchor="end">2.2</text>
  <line x1="45" y1="75.1" x2="340" y2="75.1" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <polyline points="45.0,144.9 46.9,144.9 48.7,144.9 50.6,144.9 52.4,144.9 54.3,144.9 56.1,144.9 58.0,144.9 59.8,144.9 61.7,144.9 63.6,144.9 65.4,144.9 67.3,144.9 69.1,144.9 71.0,144.9 72.8,144.9 74.7,144.9 76.5,144.9 78.4,144.9 80.3,144.9 82.1,144.9 84.0,144.9 85.8,144.9 87.7,144.9 89.5,144.9 91.4,144.9 93.2,144.9 95.1,144.9 96.9,144.9 98.8,144.8 100.7,144.8 102.5,144.8 104.4,144.8 106.2,144.8 108.1,144.7 109.9,144.7 111.8,144.7 113.6,144.6 115.5,144.6 117.4,144.5 119.2,144.5 121.1,144.4 122.9,144.3 124.8,144.2 126.6,144.1 128.5,144.0 130.3,143.9 132.2,143.7 134.1,143.5 135.9,143.3 137.8,143.1 139.6,142.8 141.5,142.5 143.3,142.2 145.2,141.8 147.0,141.3 148.9,140.8 150.8,140.2 152.6,139.5 154.5,138.8 156.3,138.0 158.2,137.1 160.0,136.1 161.9,135.0 163.7,133.8 165.6,132.5 167.5,131.1 169.3,129.5 171.2,127.9 173.0,126.2 174.9,124.3 176.7,122.3 178.6,120.3 180.4,118.1 182.3,115.9 184.2,113.6 186.0,111.2 187.9,108.7 189.7,106.2 191.6,103.7 193.4,101.1 195.3,98.5 197.1,95.8 199.0,93.2 200.8,90.5 202.7,87.8 204.6,85.1 206.4,82.5 208.3,79.9 210.1,77.3 212.0,74.7 213.8,72.2 215.7,69.7 217.5,67.3 219.4,65.0 221.3,62.7 223.1,60.6 225.0,58.5 226.8,56.5 228.7,54.6 230.5,52.8 232.4,51.2 234.2,49.6 236.1,48.2 238.0,46.8 239.8,45.6 241.7,44.5 243.5,43.5 245.4,42.5 247.2,41.7 249.1,40.9 250.9,40.3 252.8,39.7 254.7,39.1 256.5,38.7 258.4,38.3 260.2,37.9 262.1,37.6 263.9,37.3 265.8,37.0 267.6,36.8 269.5,36.6 271.4,36.5 273.2,36.3 275.1,36.2 276.9,36.1 278.8,36.0 280.6,35.9 282.5,35.8 284.3,35.8 286.2,35.7 288.1,35.7 289.9,35.6 291.8,35.6 293.6,35.6 295.5,35.6 297.3,35.5 299.2,35.5 301.0,35.5 302.9,35.5 304.7,35.5 306.6,35.5 308.5,35.4 310.3,35.4 312.2,35.4 314.0,35.4 315.9,35.4 317.7,35.4 319.6,35.4 321.4,35.4 323.3,35.4 325.2,35.4 327.0,35.4 328.9,35.4 330.7,35.4 332.6,35.4 334.4,35.4 336.3,35.4 338.1,35.4 340.0,35.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="45.0,144.9 46.9,144.9 48.7,144.9 50.6,144.9 52.4,144.9 54.3,144.9 56.1,144.9 58.0,144.9 59.8,144.9 61.7,144.9 63.6,144.9 65.4,144.9 67.3,144.9 69.1,144.9 71.0,144.9 72.8,144.9 74.7,144.9 76.5,144.9 78.4,144.9 80.3,144.9 82.1,144.9 84.0,144.9 85.8,144.9 87.7,144.9 89.5,144.9 91.4,144.9 93.2,144.9 95.1,144.9 96.9,144.9 98.8,144.9 100.7,144.9 102.5,144.9 104.4,144.9 106.2,144.9 108.1,144.8 109.9,144.8 111.8,144.8 113.6,144.8 115.5,144.8 117.4,144.8 119.2,144.7 121.1,144.7 122.9,144.7 124.8,144.6 126.6,144.6 128.5,144.5 130.3,144.4 132.2,144.4 134.1,144.3 135.9,144.2 137.8,144.0 139.6,143.9 141.5,143.8 143.3,143.6 145.2,143.4 147.0,143.1 148.9,142.9 150.8,142.6 152.6,142.2 154.5,141.8 156.3,141.4 158.2,140.9 160.0,140.3 161.9,139.7 163.7,139.0 165.6,138.2 167.5,137.3 169.3,136.3 171.2,135.2 173.0,134.0 174.9,132.7 176.7,131.3 178.6,129.8 180.4,128.2 182.3,126.4 184.2,124.6 186.0,122.6 187.9,120.6 189.7,118.4 191.6,116.2 193.4,113.8 195.3,111.4 197.1,108.9 199.0,106.4 200.8,103.8 202.7,101.1 204.6,98.5 206.4,95.7 208.3,93.0 210.1,90.2 212.0,87.4 213.8,84.6 215.7,81.8 217.5,78.9 219.4,76.1 221.3,73.3 223.1,70.6 225.0,67.8 226.8,65.1 228.7,62.5 230.5,59.9 232.4,57.3 234.2,54.9 236.1,52.6 238.0,50.4 239.8,48.3 241.7,46.4 243.5,44.7 245.4,43.3 247.2,42.1 249.1,41.3 250.9,40.9 252.8,40.9 254.7,40.9 256.5,40.9 258.4,40.9 260.2,40.9 262.1,40.9 263.9,40.9 265.8,40.9 267.6,40.9 269.5,40.9 271.4,40.9 273.2,40.9 275.1,40.9 276.9,40.9 278.8,40.9 280.6,40.9 282.5,40.9 284.3,40.9 286.2,40.9 288.1,40.9 289.9,40.9 291.8,40.9 293.6,40.9 295.5,40.9 297.3,40.9 299.2,40.9 301.0,40.9 302.9,40.9 304.7,40.9 306.6,40.9 308.5,40.9 310.3,40.9 312.2,40.9 314.0,40.9 315.9,40.9 317.7,40.9 319.6,40.9 321.4,40.9 323.3,40.9 325.2,40.9 327.0,40.9 328.9,40.9 330.7,40.9 332.6,40.9 334.4,40.9 336.3,40.9 338.1,40.9 340.0,40.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="55.4" y="136.9" font-size="11" fill="#1f2a44">both start at 0.2</text>
  <text x="73.2" y="33.7" font-size="12" fill="#1d6fd1">weight |W| (blue), levels at 2.5</text>
  <text x="55.4" y="101.1" font-size="12" fill="#b4232c">envelope (red)</text>
  <text x="192.5" y="210" font-size="11" fill="#1f2a44" text-anchor="middle">frequency ω (rad/s), log scale</text>
</svg>
```

The blue curve never goes below the red one — that is the whole job. The two touch at DC. Blue crosses the dashed line $1$ at $66.8\,\mathrm{rad/s}$, red at $92.7\,\mathrm{rad/s}$. The gap at the top, $2.5$ against $2.2$, is the price of using only one pole and one zero.
:::

::: context anti-resonance Where a plant nearly stops responding
Push a long, floppy solar array at its root, at the right frequency, and the rigid body and the flexing array move in such a way that the hub barely turns. That frequency is an **anti-resonance**: a sharp dip in the gain, sitting a little below the resonance peak.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="180" x2="340" y2="180" stroke="#1f2a44"/>
  <line x1="45" y1="180" x2="45" y2="12" stroke="#1f2a44"/>
  <line x1="77.7" y1="180" x2="77.7" y2="184" stroke="#1f2a44"/><text x="77.7" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">5</text><line x1="179.2" y1="180" x2="179.2" y2="184" stroke="#1f2a44"/><text x="179.2" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">10</text><line x1="280.6" y1="180" x2="280.6" y2="184" stroke="#1f2a44"/><text x="280.6" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">20</text><line x1="340.0" y1="180" x2="340.0" y2="184" stroke="#1f2a44"/><text x="340.0" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">30</text><text x="41" y="184.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁷</text><text x="41" y="150.4" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁶</text><text x="41" y="116.8" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁵</text><text x="41" y="83.2" font-size="11" fill="#1f2a44" text-anchor="end">10⁻⁴</text><text x="41" y="49.6" font-size="11" fill="#1f2a44" text-anchor="end">10⁻³</text><text x="41" y="16.0" font-size="11" fill="#1f2a44" text-anchor="end">10⁻²</text>
  <polyline points="45.0,56.6 47.5,57.1 50.0,57.7 52.4,58.3 54.9,58.8 57.4,59.4 59.9,60.0 62.4,60.5 64.8,61.1 67.3,61.7 69.8,62.3 72.3,62.9 74.7,63.5 77.2,64.1 79.7,64.7 82.2,65.4 84.7,66.0 87.1,66.7 89.6,67.3 92.1,68.0 94.6,68.7 97.1,69.4 99.5,70.1 102.0,70.8 104.5,71.5 107.0,72.3 109.5,73.1 111.9,73.9 114.4,74.8 116.9,75.7 119.4,76.6 121.8,77.6 124.3,78.6 126.8,79.7 129.3,80.9 131.8,82.2 134.2,83.6 136.7,85.2 139.2,87.0 141.7,89.1 144.2,91.5 146.6,94.6 149.1,98.7 151.6,104.7 154.1,115.7 156.6,128.9 159.0,108.4 161.5,99.2 164.0,92.9 166.5,88.0 166.9,87.2 167.2,86.8 167.4,86.3 167.7,85.9 167.9,85.5 168.2,85.1 168.4,84.7 168.6,84.3 168.9,83.9 168.9,83.8 169.1,83.5 169.4,83.1 169.6,82.8 169.9,82.4 170.1,82.0 170.3,81.6 170.6,81.3 170.8,80.9 171.0,80.5 171.3,80.2 171.4,80.0 171.5,79.8 171.8,79.4 172.0,79.1 172.2,78.7 172.5,78.4 172.7,78.0 172.9,77.7 173.2,77.3 173.4,77.0 173.6,76.6 173.9,76.3 173.9,76.2 174.1,75.9 174.3,75.6 174.6,75.2 174.8,74.9 175.0,74.5 175.3,74.1 175.5,73.8 175.7,73.4 176.0,73.1 176.2,72.7 176.4,72.4 178.9,68.4 181.3,63.9 183.8,58.4 186.3,50.9 186.3,50.9 186.5,50.1 186.7,49.2 186.9,48.3 187.2,47.4 187.4,46.4 187.6,45.3 187.8,44.2 188.0,43.0 188.2,41.8 188.4,40.4 188.6,38.9 188.8,37.8 188.8,37.3 189.1,35.6 189.3,33.7 189.5,31.7 189.7,29.6 189.9,27.5 190.1,25.7 190.3,24.5 190.5,24.5 190.7,25.5 190.9,27.2 191.1,29.2 191.3,30.3 191.4,31.2 191.6,33.1 191.8,34.9 192.0,36.5 192.2,37.9 192.4,39.3 192.6,40.5 192.8,41.7 193.0,42.8 193.2,43.8 193.4,44.7 193.6,45.6 193.7,46.1 193.8,46.4 194.0,47.2 194.2,47.9 194.4,48.6 196.2,53.5 198.7,58.2 201.2,61.7 202.1,62.8 202.3,63.0 202.5,63.2 202.7,63.4 202.9,63.7 203.1,63.8 203.3,64.0 203.5,64.2 203.7,64.4 203.7,64.4 203.9,64.6 204.1,64.8 204.2,65.0 204.4,65.2 204.6,65.3 204.8,65.5 205.0,65.7 205.2,65.8 205.4,66.0 205.6,66.2 205.8,66.3 205.9,66.5 206.1,66.6 206.1,66.6 206.3,66.8 206.5,66.9 206.7,67.1 206.9,67.2 207.1,67.4 207.2,67.5 207.4,67.7 207.6,67.8 207.8,68.0 208.0,68.1 208.2,68.2 208.4,68.4 208.5,68.5 208.6,68.5 208.7,68.6 208.9,68.8 209.1,68.9 209.3,69.0 209.5,69.1 211.1,70.2 213.6,71.7 216.1,73.0 218.5,74.3 221.0,75.4 223.5,76.5 226.0,77.5 228.4,78.4 230.9,79.3 233.4,80.2 235.9,81.0 238.4,81.8 240.8,82.6 243.3,83.4 245.8,84.1 248.3,84.8 250.8,85.5 253.2,86.2 255.7,86.9 258.2,87.5 260.7,88.2 263.2,88.8 265.6,89.5 268.1,90.1 270.6,90.7 273.1,91.3 275.5,91.9 278.0,92.5 280.5,93.1 283.0,93.7 285.5,94.3 287.9,94.8 290.4,95.4 292.9,96.0 295.4,96.6 297.9,97.1 300.3,97.7 302.8,98.2 305.3,98.8 307.8,99.3 310.3,99.9 312.7,100.4 315.2,101.0 317.7,101.5 320.2,102.0 322.6,102.6 325.1,103.1 327.6,103.6 330.1,104.2 332.6,104.7 335.0,105.2 337.5,105.7 340.0,106.3" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="45.0,56.3 47.5,56.8 50.0,57.3 52.4,57.9 54.9,58.4 57.4,59.0 59.9,59.5 62.4,60.1 64.8,60.6 67.3,61.2 69.8,61.8 72.3,62.3 74.7,62.9 77.2,63.5 79.7,64.1 82.2,64.7 84.7,65.3 87.1,65.9 89.6,66.5 92.1,67.1 94.6,67.7 97.1,68.3 99.5,68.9 102.0,69.6 104.5,70.2 107.0,70.9 109.5,71.6 111.9,72.3 114.4,73.0 116.9,73.7 119.4,74.4 121.8,75.2 124.3,76.0 126.8,76.8 129.3,77.7 131.8,78.5 134.2,79.5 136.7,80.4 139.2,81.4 141.7,82.5 144.2,83.7 146.6,85.0 149.1,86.4 151.6,87.9 154.1,89.6 156.6,91.6 159.0,94.0 161.5,96.9 164.0,100.7 166.5,106.2 166.9,107.5 167.2,108.3 167.4,109.1 167.7,109.9 167.9,110.9 168.2,111.8 168.4,112.9 168.6,114.0 168.9,115.2 168.9,115.5 169.1,116.5 169.4,118.0 169.6,119.6 169.9,121.4 170.1,123.4 170.3,125.7 170.6,128.2 170.8,131.1 171.0,134.0 171.3,136.2 171.4,136.6 171.5,136.5 171.8,134.6 172.0,131.7 172.2,128.7 172.5,126.0 172.7,123.5 172.9,121.4 173.2,119.4 173.4,117.7 173.6,116.1 173.9,114.7 173.9,114.5 174.1,113.3 174.3,112.1 174.6,110.9 174.8,109.9 175.0,108.9 175.3,107.9 175.5,107.0 175.7,106.1 176.0,105.3 176.2,104.5 176.4,103.9 178.9,97.2 181.3,92.1 183.8,87.8 186.3,83.9 186.3,83.9 186.5,83.6 186.7,83.2 186.9,82.9 187.2,82.6 187.4,82.3 187.6,81.9 187.8,81.6 188.0,81.3 188.2,81.0 188.4,80.7 188.6,80.3 188.8,80.1 188.8,80.0 189.1,79.7 189.3,79.4 189.5,79.1 189.7,78.8 189.9,78.4 190.1,78.1 190.3,77.8 190.5,77.5 190.7,77.2 190.9,76.9 191.1,76.5 191.3,76.4 191.4,76.2 191.6,75.9 191.8,75.6 192.0,75.2 192.2,74.9 192.4,74.6 192.6,74.3 192.8,73.9 193.0,73.6 193.2,73.3 193.4,72.9 193.6,72.6 193.7,72.4 193.8,72.3 194.0,71.9 194.2,71.6 194.4,71.2 196.2,68.0 198.7,62.8 201.2,55.9 202.1,52.3 202.3,51.5 202.5,50.7 202.7,49.8 202.9,48.9 203.1,47.9 203.3,46.9 203.5,45.8 203.7,44.7 203.7,44.6 203.9,43.4 204.1,42.1 204.2,40.7 204.4,39.1 204.6,37.5 204.8,35.7 205.0,33.8 205.2,31.9 205.4,30.1 205.6,28.5 205.8,27.6 205.9,27.5 206.1,28.4 206.1,28.4 206.3,29.8 206.5,31.6 206.7,33.4 206.9,35.2 207.1,36.8 207.2,38.4 207.4,39.8 207.6,41.1 207.8,42.3 208.0,43.4 208.2,44.5 208.4,45.5 208.5,46.4 208.6,46.7 208.7,47.3 208.9,48.1 209.1,48.8 209.3,49.6 209.5,50.3 211.1,55.2 213.6,60.4 216.1,64.1 218.5,66.9 221.0,69.3 223.5,71.2 226.0,72.9 228.4,74.5 230.9,75.8 233.4,77.1 235.9,78.2 238.4,79.3 240.8,80.3 243.3,81.3 245.8,82.2 248.3,83.1 250.8,83.9 253.2,84.7 255.7,85.5 258.2,86.3 260.7,87.0 263.2,87.7 265.6,88.4 268.1,89.1 270.6,89.8 273.1,90.5 275.5,91.1 278.0,91.8 280.5,92.4 283.0,93.0 285.5,93.6 287.9,94.3 290.4,94.9 292.9,95.5 295.4,96.0 297.9,96.6 300.3,97.2 302.8,97.8 305.3,98.4 307.8,98.9 310.3,99.5 312.7,100.1 315.2,100.6 317.7,101.2 320.2,101.7 322.6,102.3 325.1,102.8 327.6,103.4 330.1,103.9 332.6,104.4 335.0,105.0 337.5,105.5 340.0,106.1" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="171.5" y="150.6" font-size="11" fill="#1d6fd1" text-anchor="middle">dip 9.49</text>
  <text x="213.8" y="31.5" font-size="11" fill="#1d6fd1">peak 12</text>
  <text x="228.4" y="150" font-size="12" fill="#1d6fd1">nominal ω₁ = 12</text>
  <text x="228.4" y="166" font-size="12" fill="#b4232c">shifted ω₁ = 10.8</text>
  <text x="192.5" y="210" font-size="11" fill="#1f2a44" text-anchor="middle">frequency ω (rad/s)  ·  |G| in rad/(N m)</text>
</svg>
```

The blue curve is the nominal plant: dip at $9.49\,\mathrm{rad/s}$, peak at $12$. The red curve has the mode moved $10\,\%$ lower, to $10.8$. Near either dip, one plant is tiny while the other is not, so their *ratio* — the relative error — explodes.
:::

::: context products-of-inertia Why the inertia matrix has off-diagonal terms
If a body's mass were spread symmetrically about all three of its body axes, $\mathbf{J}$ would be diagonal: a roll torque would produce only roll. Real spacecraft are lopsided — an antenna on one side, a tank offset on another. The off-diagonal **products of inertia** measure that lopsidedness, and they make a torque about one axis spin the body a little about the others too.

In the module's matrix the biggest one, $18\,\mathrm{kg\,m^2}$, is fifteen percent of the roll inertia of $120$. That coupling is small enough to ignore in a first design and large enough to matter for input-versus-output bookkeeping.
:::

::: context np-hard What "NP-hard" means in practice
A problem is **NP-hard** when no one knows a method that solves every case in a time that grows only like a power of its size — and finding one would settle one of the most famous open questions in mathematics. For the known methods, the work can grow explosively as the number of uncertainty blocks goes up.

Richard Braatz, Peter Young, John Doyle and Manfred Morari showed in 1994 that computing $\mu$ exactly is NP-hard. So practical tools do not try. They compute a cheap upper bound and a cheap lower bound, and on real aerospace problems the two are usually close enough to decide the question.
:::
