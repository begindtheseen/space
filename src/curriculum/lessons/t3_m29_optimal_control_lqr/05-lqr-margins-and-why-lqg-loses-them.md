---
id: l05-lqr-margins-and-why-lqg-loses-them
title: The guaranteed margins of LQR, and why LQG loses them
minutes: 22
covers:
  - The guaranteed margins of full-state-feedback LQR and why LQG loses them
---

Here is the question a GNC controls interview asks, in some form, almost every time: *LQR has guaranteed gain and phase margins — state them, prove them, and tell me when they do not apply.* The first two parts are a whiteboard exercise. The third part is the one that separates candidates, because the honest answer is that the guarantee evaporates the moment you replace the state vector with an estimate of it, which is what every flight controller in existence does.

The result is genuinely remarkable. Feed back the full state through the LQR gain and, for any positive definite $\mathbf{R}$ and any admissible $\mathbf{Q}$, the loop tolerates the actuator being half as strong as modelled, or arbitrarily stronger, or lagging by sixty degrees. You never asked for that; it fell out of the optimisation. It is the single strongest argument for using LQR rather than hand-placed poles, because pole placement offers nothing of the kind.

And then there is Doyle's 1978 paper, one page long, titled "Guaranteed Margins for LQG Regulators", whose content is that there are none — with an explicit two-state example whose margins can be driven to zero. Both facts are true, and knowing exactly where the boundary between them lies is the point of this lesson.

## The loop broken at the plant input

Margins are a property of a loop, and a loop has to be cut somewhere before a margin means anything. For full state feedback the natural cut is at the **plant input**: open the connection between the controller output and the actuator, inject a signal, and follow it round.

With $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ and $\mathbf{u} = -\mathbf{K}\mathbf{x}$, the transfer function around that loop is

$$
\mathbf{L}(s) = \mathbf{K}\,\boldsymbol{\Phi}(s)\,\mathbf{B}, \qquad \boldsymbol{\Phi}(s) = (s\mathbf{I} - \mathbf{A})^{-1},
$$

an $m \times m$ transfer matrix, scalar when there is one actuator. The quantity $\mathbf{I} + \mathbf{L}(s)$ is the **return difference**: it compares what comes back around the loop with what was injected, and the Nyquist criterion is a statement about where $\det(\mathbf{I} + \mathbf{L})$ goes relative to the origin. Everything below is about how far $\mathbf{I} + \mathbf{L}$ stays from being singular.

A gain error in the actuator — a thruster that delivers $0.8$ of its modelled force, a gimbal whose effectiveness dropped with a chamber pressure excursion — is a multiplier $m$ inserted at exactly this point, turning $\mathbf{L}$ into $m\mathbf{L}$. A lag — computational delay, actuator dynamics you left out of the model — is a factor $e^{-j\omega\tau}$ at the same point. This is why the input is the interesting place to cut.

## The Kalman return-difference identity

Start from the CARE and manufacture $s$ out of nothing. Since $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} = \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} - \mathbf{Q}$, add and subtract $s\mathbf{P}$:

$$
(-s\mathbf{I} - \mathbf{A}^\top)\mathbf{P} + \mathbf{P}(s\mathbf{I} - \mathbf{A}) = -\big(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A}\big) = \mathbf{Q} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}.
$$

Now pre-multiply by $\mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top$ and post-multiply by $\boldsymbol{\Phi}(s)\mathbf{B}$, where $\boldsymbol{\Phi}(-s)^\top = (-s\mathbf{I} - \mathbf{A}^\top)^{-1}$. The two factors on the left collapse:

$$
\mathbf{B}^\top\mathbf{P}\boldsymbol{\Phi}(s)\mathbf{B} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{P}\mathbf{B}
= \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B} - \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\boldsymbol{\Phi}(s)\mathbf{B}.
$$

Use $\mathbf{B}^\top\mathbf{P} = \mathbf{R}\mathbf{K}$ and $\mathbf{L}(s) = \mathbf{K}\boldsymbol{\Phi}(s)\mathbf{B}$ to rewrite each piece: the first term is $\mathbf{R}\mathbf{L}(s)$, the second is $\mathbf{L}(-s)^\top\mathbf{R}$, and the last is $\mathbf{L}(-s)^\top\mathbf{R}\mathbf{L}(s)$. Move that last one across and add $\mathbf{R}$ to both sides:

$$
\mathbf{R} + \mathbf{R}\mathbf{L}(s) + \mathbf{L}(-s)^\top\mathbf{R} + \mathbf{L}(-s)^\top\mathbf{R}\mathbf{L}(s)
= \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B},
$$

and the left side factors. This is the **Kalman return-difference identity**:

$$
\big[\mathbf{I} + \mathbf{L}(-s)\big]^\top\mathbf{R}\big[\mathbf{I} + \mathbf{L}(s)\big]
= \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\,\boldsymbol{\Phi}(s)\mathbf{B}.
$$

Evaluate it on the imaginary axis, $s = j\omega$, where $\boldsymbol{\Phi}(-j\omega)^\top = \boldsymbol{\Phi}(j\omega)^{*}$ because $\mathbf{A}$ is real. Writing $\mathbf{G}(j\omega) = \mathbf{Q}^{1/2}\boldsymbol{\Phi}(j\omega)\mathbf{B}$,

$$
\big[\mathbf{I} + \mathbf{L}(j\omega)\big]^{*}\mathbf{R}\big[\mathbf{I} + \mathbf{L}(j\omega)\big] = \mathbf{R} + \mathbf{G}(j\omega)^{*}\mathbf{G}(j\omega) \;\succeq\; \mathbf{R}.
$$

The right-hand side is $\mathbf{R}$ plus something positive semidefinite. For a single input with $\mathbf{R} = r > 0$ this is a statement about one complex number:

$$
r\,\big|1 + L(j\omega)\big|^2 = r + \big|\mathbf{G}(j\omega)\big|^2 \;\ge\; r
\qquad\Longrightarrow\qquad
\big|1 + L(j\omega)\big| \;\ge\; 1 \quad\text{for every }\omega.
$$

That is the whole result, and everything else is geometry.

## The forbidden disk

$|1 + L(j\omega)| \ge 1$ says the Nyquist plot of $L$ never enters the open disk of radius one centred at $-1$. Three consequences follow from a picture.

**Gain increase and reduction.** Replace $L$ by $mL$ for a real $m > 0$ and write $1 + mL = (1-m) + m(1+L)$. By the triangle inequality,

$$
|1 + mL| \;\ge\; m\,|1+L| - |1-m| \;\ge\; m - |1-m| = \begin{cases} 2m - 1, & m \le 1\\ 1, & m > 1.\end{cases}
$$

For every $m > \tfrac12$ this is strictly positive, so $1 + mL(j\omega)$ never passes through the origin as $m$ is varied continuously from $1$. The number of Nyquist encirclements therefore cannot change, and stability is preserved for all $m \in (\tfrac12, \infty)$. In decibels: **$-6\,\mathrm{dB}$ of gain reduction and unbounded gain increase.**

**Phase.** At a gain crossover, $|L(j\omega_c)| = 1$, so $L(j\omega_c)$ sits on the unit circle. It must also stay outside the unit circle about $-1$. The two circles meet where $L = e^{\pm j2\pi/3}$, that is at phase $\pm 120^\circ$, so any crossover has $|\angle L(j\omega_c)| \le 120^\circ$ and the phase margin $180^\circ - |\angle L(j\omega_c)|$ is at least $60^\circ$. **Phase margin $\ge 60^\circ$.**

**A general disk margin.** If a loop merely satisfies $\min_\omega|1 + L| = \eta$, the same arguments give a gain range $\big(1/(1+\eta),\ 1/(1-\eta)\big)$ and a phase margin of at least $2\arcsin(\eta/2)$. LQR is the case $\eta = 1$, which returns $(1/2,\ \infty)$ and $2\arcsin(0.5) = 60^\circ$. Keeping $\eta$ in mind is useful, because it is a single number that summarises a loop's robustness and it is what collapses later in this lesson.

::: key LQR guaranteed margins
Loop broken at the plant input: gain margin from $-6\,\mathrm{dB}$ to $+\infty$, phase margin at least $60^\circ$. It follows from the return-difference identity $|1 + L(j\omega)| \ge 1$.
:::

::: example Measuring the margins on two vehicles
**Reaction-wheel axis** ($J = 120\,\mathrm{kg\,m^2}$, Bryson weights, $\mathbf{K} = (916.73,\ 522.05)$). Sweeping $\omega$ from $10^{-4}$ to $10^{5}\,\mathrm{rad/s}$ gives $\min_\omega|1+L(j\omega)| = 1.000000$, attained in the limit $\omega \to \infty$ where $L \to 0$ — the identity is tight at high frequency and slack in the middle, which is the usual picture. Gain crossover is at $4.650\,\mathrm{rad/s}$ with $\angle L = -110.7^\circ$, so the phase margin is $69.3^\circ$, comfortably above the guaranteed $60^\circ$.

The gain margin is better than guaranteed. The closed-loop polynomial with an input gain $m$ is $s^2 + (mk_2/J)s + mk_1/J$, whose coefficients are positive for every $m > 0$, so this loop is stable for *any* positive actuator gain, however small. The guarantee is a floor, not a prediction.

**Launch vehicle pitch plane** at maximum dynamic pressure — the unstable plant with poles at $-0.700$ and $+0.693\,\mathrm{s^{-1}}$, weighted with a $3^\circ$ angle-of-attack budget, $4^\circ/\mathrm{s}$ rate budget and $5^\circ$ gimbal budget. The Riccati solution gives $\mathbf{K} = (-1.7314,\ -1.4414)$ and closed-loop poles $-1.343$ and $-8.354\,\mathrm{s^{-1}}$. Again $\min_\omega|1+L| = 1.000000$; gain crossover at $9.715\,\mathrm{rad/s}$ with phase margin $83.0^\circ$; and a numerical sweep of the input gain finds the loop stable for every $m \in (0.04146,\ \infty)$, that is $-27.6\,\mathrm{dB}$ to $+\infty$.

Both designs beat the guarantee by a wide margin, which is typical. What the guarantee gives you is the right to skip the check in a trade study and still know the answer is not catastrophic — and that is worth a great deal when you are sweeping a hundred flight conditions.
:::

## The fine print

The guarantee is precise, and precision cuts both ways.

- **It is at the plant input.** Break the loop at the plant *output* instead and the identity says nothing. For a single-input single-output plant the two are the same loop, so the distinction bites only on multi-input vehicles — which is most of them.
- **It assumes the full state is fed back**, measured exactly, with no dynamics between $\mathbf{K}$ and $\mathbf{B}$. Every element of that sentence is false on a real vehicle.
- **The multivariable version needs care.** With $\mathbf{R} = \rho\mathbf{I}$ the identity gives $\big[\mathbf{I}+\mathbf{L}\big]^{*}\big[\mathbf{I}+\mathbf{L}\big] \succeq \mathbf{I}$, hence $\underline{\sigma}(\mathbf{I}+\mathbf{L}) \ge 1$, and the gain and phase results then hold for a perturbation applied **independently in each input channel** when $\mathbf{R}$ is diagonal. They do not cover an arbitrary full-block perturbation coupling the channels, and a per-axis margin claim on a three-axis vehicle with cross-coupling is worth much less than it sounds.
- **It says nothing about unmodelled dynamics.** A flexible mode at $18\,\mathrm{Hz}$ that is not in $\mathbf{A}$ is not covered by any statement about $\mathbf{L}$ built from $\mathbf{A}$. The margins are margins against errors in the modelled loop.
- **It says nothing about the actuator saturating**, which is a nonlinear effect the identity cannot see.

## Adding an estimator destroys the identity

Now build what actually flies. Measure $\mathbf{y} = \mathbf{C}\mathbf{x}$, run an observer, and feed back the estimate:

$$
\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} + \mathbf{B}\mathbf{u} + \mathbf{L}_f(\mathbf{y} - \mathbf{C}\hat{\mathbf{x}}), \qquad \mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}.
$$

Break the loop at the plant input again and follow the signal: it now passes through the plant, the measurement, the estimator dynamics, and only then the gain. The loop transfer function is

$$
\mathbf{L}_{\text{LQG}}(s) = \mathbf{K}\big(s\mathbf{I} - \mathbf{A} + \mathbf{B}\mathbf{K} + \mathbf{L}_f\mathbf{C}\big)^{-1}\mathbf{L}_f\,\mathbf{C}\,(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B},
$$

which is not $\mathbf{K}\boldsymbol{\Phi}(s)\mathbf{B}$ and satisfies no identity derived from the CARE. The estimator has inserted its own dynamics — its own phase lag — between the measurement and the command. Note what has *not* changed: the closed-loop poles are still the union of the regulator poles and the estimator poles, exactly as the separation principle says. The nominal design is untouched. Only the robustness is gone, and nothing in the nominal analysis reveals it.

::: example Doyle's counterexample, computed
Doyle's 1978 plant is the smallest one that makes the point:

$$
\mathbf{A} = \begin{bmatrix}1 & 1\\ 0 & 1\end{bmatrix},\quad
\mathbf{B} = \begin{bmatrix}0\\1\end{bmatrix},\quad
\mathbf{C} = \begin{bmatrix}1 & 0\end{bmatrix},\quad
\mathbf{Q} = q\begin{bmatrix}1&1\\1&1\end{bmatrix},\quad R = 1,
$$

with the estimator designed as a Kalman filter for process noise $\mathbf{W} = \sigma\,\mathbf{1}\mathbf{1}^\top$ entering the same direction and unit measurement noise. Both Riccati equations have closed-form solutions: $\mathbf{K} = (k,\ k)$ with $k = 2 + \sqrt{4+q}$, and $\mathbf{L}_f = (f,\ f)^\top$ with $f = 2 + \sqrt{4+\sigma}$.

Insert a scalar gain $m$ at the plant input and find the range of $m$ for which the eight-state — here four-state — closed loop stays stable. With full state feedback the answer is analytic: $\mathbf{A} - m\mathbf{B}\mathbf{K}$ has determinant $1$ and trace $2 - mk$, so the loop is stable precisely for $m > 2/k$, with no upper limit. With the estimator in place:

| $q = \sigma$ | $k = f$ | full-state stable range | LQG stable range | LQG in dB | $\min_\omega\lvert 1+L_{\text{LQG}}\rvert$ |
| --- | --- | --- | --- | --- | --- |
| $1$ | $4.236$ | $(0.4721,\ \infty)$ | $(0.9208,\ 1.0557)$ | $(-0.72,\ +0.47)$ | $5.28\times10^{-2}$ |
| $10^{2}$ | $12.198$ | $(0.1640,\ \infty)$ | $(0.9381,\ 1.0067)$ | $(-0.56,\ +0.06)$ | $6.68\times10^{-3}$ |
| $10^{4}$ | $102.02$ | $(0.0196,\ \infty)$ | $(0.9905,\ 1.00010)$ | $(-0.083,\ +0.0008)$ | $1.00\times10^{-4}$ |
| $10^{6}$ | $1002.0$ | $(0.0020,\ \infty)$ | $(0.9990,\ 1.000001)$ | $(-0.0086,\ +0.000005)$ | $1.01\times10^{-6}$ |

At $q = \sigma = 10^{6}$ the LQG loop tolerates an actuator gain error of **one part in a thousand** before going unstable, and the phase margin at the lower crossover is $0.0001^\circ$. The same $\mathbf{K}$, fed the true state, tolerates the actuator being $500$ times too weak and arbitrarily too strong. The difference is entirely the estimator.

Notice also the first row. Even at $q = \sigma = 1$, with no attempt to make things bad, the LQG margins are $-0.72\,\mathrm{dB}$ and $+0.47\,\mathrm{dB}$ — already unflyable, on a plant where full state feedback gives $-6.5\,\mathrm{dB}$ to infinity. The collapse is not a pathology of extreme weights; the extreme weights only make it arbitrarily bad.
:::

::: key Guaranteed margins for LQG regulators
There are none. Doyle, *IEEE Transactions on Automatic Control*, 1978. The observer destroys the LQR return-difference identity, so LQG margins can be made arbitrarily small. Always check LQG margins explicitly.
:::

::: warning The separation principle separates the design, not the robustness
The stochastic separation theorem is true and useful: design $\mathbf{K}$ ignoring the estimator, design $\mathbf{L}_f$ ignoring the regulator, and the combination minimises the expected cost. It is routinely over-read into "the two designs do not interact", which is false for everything except the nominal cost and the nominal pole locations. The loop shape at the plant input depends on both designs together, and so does every margin. A design review that reports the LQR margins of an LQG controller is reporting a number that does not describe the system that flies.
:::

## What you do instead

Three responses, in increasing order of effort.

**Check.** Compute $\min_\omega|1+\mathbf{L}_{\text{LQG}}(j\omega)|$ — one frequency sweep — and sweep a real gain and a real delay at the plant input across the flight envelope. This takes an afternoon and catches the Doyle failure immediately.

**Recover.** Loop transfer recovery deliberately detunes the estimator, inflating the assumed process noise as $\mathbf{W} = \mathbf{W}_0 + \varrho\,\mathbf{B}\mathbf{B}^\top$ with $\varrho$ large, so that the estimator becomes fast and the LQG loop shape approaches the LQR loop shape at the input. The margins come back asymptotically. It is not free, and the lesson on loop transfer recovery is about exactly what it costs.

**Synthesize for robustness.** If robustness is the requirement, optimise for it: the $\mathcal{H}_\infty$ and structured-singular-value methods of the robust control module take an uncertainty model as an input rather than hoping a quadratic cost will produce robustness as a by-product.

## Check yourself

::: check
Derive the $60^\circ$ phase margin from $|1+L(j\omega)| \ge 1$, and explain why the bound is exactly $60$ and not some other number.
:::

::: answer
A phase margin is read at a gain crossover, where $|L(j\omega_c)| = 1$, so $L(j\omega_c) = e^{j\phi}$ for some $\phi$. The constraint is $|1 + e^{j\phi}| \ge 1$. Squaring, $(1+\cos\phi)^2 + \sin^2\phi = 2 + 2\cos\phi \ge 1$, so $\cos\phi \ge -\tfrac12$ and $|\phi| \le 120^\circ$. The phase margin is $180^\circ - |\phi| \ge 60^\circ$. The number $60$ is the angle subtended where the unit circle about the origin meets the unit circle about $-1$: two unit circles whose centres are one unit apart intersect at the apexes of an equilateral triangle, so the intersections are at $\pm120^\circ$ and the margin is $180 - 120 = 60$. The $60^\circ$ is a consequence of the forbidden region having radius exactly one, which in turn is a consequence of the $\mathbf{R}$ on both sides of the identity cancelling.
:::

::: check
An LQR design has $\min_\omega|1+L| = 1$. A colleague adds a first-order actuator lag with time constant $0.02\,\mathrm{s}$ that was not in the model, at a loop with gain crossover at $4.65\,\mathrm{rad/s}$. Is the guarantee still good?
:::

::: answer
The guarantee covers a pure phase shift at the input of up to $60^\circ$, so start by asking how much phase the lag adds at crossover: $\arctan(0.02 \times 4.65) = \arctan(0.093) = 5.3^\circ$. That is well inside the $60^\circ$ allowance, so the design survives — but the reasoning needs one more step to be honest. The lag also changes the magnitude, by a factor $1/\sqrt{1 + 0.093^2} = 0.996$, which is inside the gain allowance too, and a first-order lag is exactly a combined gain-and-phase perturbation rather than either alone. The clean way to say it is that the perturbation $\Delta(j\omega) = 1/(1+0.02j\omega) - 1$ has magnitude below $\eta = 1$ relative to the loop at all frequencies where it matters, so the disk-margin argument covers it. If instead the unmodelled element were a $50\,\mathrm{ms}$ transport delay, the phase at crossover would be $4.65 \times 0.05 = 0.233\,\mathrm{rad} = 13.3^\circ$ — still inside, but a delay keeps accumulating phase with frequency and will eventually break any loop, so the check must be done at the frequency where the loop gain is actually near one, not at the bandwidth you designed for.
:::

::: check
Why does the return-difference identity fail for LQG, given that the separation principle says the closed-loop poles are the union of the two designs?
:::

::: answer
Because closed-loop poles and loop shape are different things. The identity is a statement about $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$, and its derivation used the CARE for the *same* $\mathbf{A}$, $\mathbf{B}$, $\mathbf{K}$ that appear in $\mathbf{L}$. In LQG the transfer function seen going round the loop at the plant input includes the estimator's own dynamics, $\big(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C}\big)^{-1}$, together with the measurement matrix. That transfer function satisfies no CARE and there is no reason for $|1 + L_{\text{LQG}}|$ to stay outside the unit disk — the numbers in this lesson show it going to $10^{-6}$. The separation principle is a statement about where the poles are when the model is exact; a margin is a statement about what happens when the model is wrong, and the two questions are unrelated. Every root of the nominal characteristic polynomial can be exactly where you designed it while the Nyquist plot passes within a millionth of $-1$.
:::

::: check
Doyle's example gets worse as $q$ and $\sigma$ grow together. What are $q$ and $\sigma$ doing physically, and would fixing one of them be enough?
:::

::: answer
Large $q$ makes the regulator aggressive — the state weight $q\,\mathbf{1}\mathbf{1}^\top$ grows, the gain $k = 2 + \sqrt{4+q}$ grows without bound, and the regulator bandwidth goes with it. Large $\sigma$ makes the estimator aggressive in the same direction, since the assumed process noise $\sigma\mathbf{1}\mathbf{1}^\top$ tells the filter to trust its measurements and chase them. Fixing only one is not enough in general, and the table shows why: the mechanism is that the regulator's loop shape and the estimator's loop shape disagree, and the mismatch is what eats the margin. Holding $\sigma$ at a modest value while $q$ grows leaves a fast regulator behind a slow estimator, which is the classic recipe for phase lag at crossover. The structured fix is loop transfer recovery, which deliberately drives $\sigma$ in a *particular* direction — along $\mathbf{B}$ — so that the estimator loop shape approaches the regulator's rather than diverging from it. Arbitrary large $\sigma$ does not do that, which is exactly why Doyle's choice of $\mathbf{W} = \sigma\mathbf{1}\mathbf{1}^\top$ rather than $\sigma\mathbf{B}\mathbf{B}^\top$ makes the counterexample work.
:::

::: check
Your three-axis attitude controller reports $6\,\mathrm{dB}$ and $60^\circ$ margins on each axis from a single-axis analysis. What have you not shown?
:::

::: answer
That the axes do not interact. A per-channel margin is computed by perturbing one input at a time with the others nominal, and the guarantee for diagonal $\mathbf{R}$ covers independent perturbations in each channel — but the vehicle can present a perturbation that couples them: a misaligned thruster, an inertia cross-product that is wrong, a gimbal whose two axes are not orthogonal. The relevant quantity for a coupled perturbation is $\underline{\sigma}(\mathbf{I}+\mathbf{L}(j\omega))$, the smallest singular value, and it can be far below one at some frequency while each diagonal loop looks healthy. The other thing not shown is that the margins apply to the *system that flies*: if the controller runs on estimated states, the single-axis analysis of the state-feedback loop is the wrong loop entirely, and Doyle's example is the reason that matters.
:::

## Summary

| Result | Statement |
| --- | --- |
| Loop at the plant input | $\mathbf{L}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$ |
| Return-difference identity | $[\mathbf{I}+\mathbf{L}(-s)]^\top\mathbf{R}[\mathbf{I}+\mathbf{L}(s)] = \mathbf{R} + \mathbf{B}^\top\boldsymbol{\Phi}(-s)^\top\mathbf{Q}\boldsymbol{\Phi}(s)\mathbf{B}$ |
| Consequence | $\lvert 1 + L(j\omega)\rvert \ge 1$ for all $\omega$; Nyquist plot avoids the unit disk about $-1$ |
| Gain margin | Stable for every input gain $m \in (1/2, \infty)$: $-6\,\mathrm{dB}$ to $+\infty$ |
| Phase margin | At least $60^\circ$, from $|1+e^{j\phi}| \ge 1 \Rightarrow |\phi| \le 120^\circ$ |
| Disk margin | $\min_\omega|1+L| = \eta$ gives gain range $(1/(1+\eta), 1/(1-\eta))$ and phase $\ge 2\arcsin(\eta/2)$ |
| Scope | Input only; full state feedback only; per-channel for diagonal $\mathbf{R}$; nothing about unmodelled dynamics or saturation |
| Measured, wheel axis | $\eta = 1.000$, PM $69.3^\circ$ at $4.65\,\mathrm{rad/s}$, stable for every $m > 0$ |
| Measured, launch vehicle | $\eta = 1.000$, PM $83.0^\circ$ at $9.72\,\mathrm{rad/s}$, gain range $(0.0415, \infty)$ |
| LQG | $\mathbf{L}_{\text{LQG}} = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}_f\mathbf{C})^{-1}\mathbf{L}_f\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}$; no identity, no guarantee |
| Doyle 1978 | $q = \sigma = 10^{6}$: LQG stable only for $m \in (0.9990, 1.000001)$, $\eta = 10^{-6}$ |
| Practice | Check the margins of the loop that flies; recover them with LTR; or synthesize for robustness |

The margins are a property of the infinite-horizon, full-state design. The next lesson goes back to the design itself and asks what changes when the horizon is finite.
