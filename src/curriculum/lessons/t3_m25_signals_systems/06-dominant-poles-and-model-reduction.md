---
id: l06-dominant-poles-and-model-reduction
title: Dominant poles and model order reduction by inspection
minutes: 18
covers:
  - "Dominant poles and model order reduction by inspection"
---

Everything in lesson 5 was written for a second-order system, and almost nothing you will meet is second order. A launch vehicle's pitch channel has rigid-body poles, actuator poles, sensor filter poles, structural bending modes and slosh modes; write it all down and you have a twentieth-order model that no one can reason about. Yet engineers routinely say "this loop is second order with $\zeta = 0.6$ and $\omega_n = 2\,\mathrm{rad/s}$" and are right. This lesson explains when that is legitimate, how to do the reduction in your head, and — more importantly — the analyses in which the same reduction will lie to you.

The idea is that a mode shows up in a response in proportion to two things: how slowly it decays and how big its residue is. A pole far to the left contributes a mode that is over before anything else has begun. A pole with a tiny residue contributes a mode nobody can see. Either way, deleting it changes the response by an amount you can bound, and the reduced model then supports all of lesson 5's arithmetic.

The reduction is also how design actually proceeds. You choose closed-loop poles on a second-order picture, then put the neglected dynamics back and check what they did to your margins. The check is not a formality: the last section of this lesson shows a case where a pole that the standard rule says to drop costs fifteen degrees of phase margin.

## What "dominant" means

Write the step response of a stable system with distinct poles as

$$
y(t) = G(0) + \sum_i \frac{r_i}{-p_i}e^{p_it},
$$

where $r_i$ is the residue of $G$ at $p_i$ (lesson 4), and the factor $1/(-p_i)$ comes from the extra $1/s$ of the step. Each mode's contribution to the response is thus measured by $\left|r_i/p_i\right|$, and its duration by $1/\left|\operatorname{Re}p_i\right|$.

A mode is negligible when either factor is small:

- **It is fast.** $\left|\operatorname{Re}p_i\right|$ large means the term is gone in $4/\left|\operatorname{Re}p_i\right|$ seconds, and the $1/(-p_i)$ makes its amplitude small too.
- **Its residue is small.** A zero near the pole guts the residue, whatever the pole's location.

The **dominant poles** are the ones left over: normally the pair closest to the imaginary axis with a residue of ordinary size. For $G = 100(s + 9)/\left[(s+1)(s+10)(s+100)\right]$ the three step-response contributions $\left|r_i/p_i\right|$ are $0.898$, $0.0123$ and $0.0102$ — the pole at $-1$ carries 97% of the transient, and the other two are visible for a few tens of milliseconds and worth about 1% each. Notice that the pole at $-10$ is not negligible because it is fast (it is only ten times further left) but because the zero at $-9$ sits almost on top of it.

::: key
When can you ignore a pole? When its real part is roughly **5 times further left** than the dominant pair, and it is **not near a zero**. Safe for time-domain design intuition; never safe when computing stability margins.
:::

## Reduction by inspection

The procedure is three lines, and the only trick is to work in the time-constant form of lesson 3, because then the reduction is literally deleting a factor.

1. Write $G$ in time-constant form: $G = K\dfrac{\prod(1 + s/z_i)}{\prod(1 + s/p_i)}$, with second-order factors as $\left(1 + 2\zeta s/\omega + s^2/\omega^2\right)$.
2. Fix the band of interest — normally up to about five times the intended crossover or the dominant $\omega_n$.
3. Replace by 1 every factor whose corner frequency lies well above that band, and cancel any pole-zero pair whose members are within about 10% of each other and well damped.

Because every deleted factor equals 1 at $s = 0$, this preserves the DC gain automatically. That is the whole reason for using the time-constant form.

::: warning
Do the same deletion in pole-zero form and you destroy the gain. From $G = 200/\left[(s^2 + 2s + 5)(s + 40)\right]$, striking out the factor $(s + 40)$ leaves $200/(s^2 + 2s + 5)$, whose DC gain is 40, not 1. The correct reduction replaces $(s + 40)$ by its value at $s = 0$, namely 40, giving $5/(s^2 + 2s + 5)$. In time-constant form the same step is deleting $(1 + s/40)$, and there is nothing to remember.
:::

::: example A fast pole behind a dominant pair
Take $G(s) = \dfrac{200}{(s^2 + 2s + 5)(s + 40)}$, DC gain 1. The complex pair is at $-1 \pm 2j$, so $\omega_n = \sqrt{5} = 2.236\,\mathrm{rad/s}$ and $\zeta = 1/\sqrt{5} = 0.447$; the third pole is at $-40$, forty times further left.

Lesson 5 predicts, from the pair alone: overshoot $M_p = e^{-\pi(0.447)/0.894} = 20.8\%$, peak time $t_p = \pi/2 = 1.571\,\mathrm{s}$, 2% settling $t_s \approx 4/1 = 4\,\mathrm{s}$.

Residues of $G$: at $-40$, $r = 200/\left[(-40)^2 + 2(-40) + 5\right] = 0.1311$, so the step contribution is $\left|r/p\right| = 0.00328$. At $-1 + 2j$, $\left|r\right| = 1.2804$ and $\left|r/p\right| = 0.5726$. The fast mode carries 0.6% of what the pair carries.

Integrating both step responses confirms it. The full third-order response peaks at $1.2075$ at $t = 1.596\,\mathrm{s}$; the reduced $5/(s^2 + 2s + 5)$ peaks at $1.2079$ at $t = 1.571\,\mathrm{s}$. The largest discrepancy anywhere is $0.032$, at $t = 0.58\,\mathrm{s}$ during the rise — about 3% of the final value, and it is a small delay rather than a change of shape, because the extra pole adds $1/40 = 25\,\mathrm{ms}$ of lag. Exact 2% settling times are $3.760\,\mathrm{s}$ and $3.735\,\mathrm{s}$.

So the reduction is excellent for every time-domain number a specification contains, and its only visible effect is a $25\,\mathrm{ms}$ shift early in the rise.
:::

::: example Throwing away a motor's electrical dynamics
The wheel motor of lesson 3 is $G(s) = 3054/\left[(s + 0.0529)(s + 2083.3)\right]$, or in time-constant form

$$
G(s) = \frac{27.72}{\left(1 + s/0.0529\right)\left(1 + s/2083.3\right)}\ \ \mathrm{(rad/s)/V}.
$$

The electrical corner is at $2083\,\mathrm{rad/s}$ — 39,000 times the mechanical one. Delete its factor:

$$
G_{\text{red}}(s) = \frac{27.72}{1 + s/0.0529} = \frac{1.466}{s + 0.0529},
$$

first order, DC gain unchanged at $27.72\,(\mathrm{rad/s})/\mathrm{V}$. Lesson 4 already showed why this is safe: the electrical mode's residue in the step response is $7.04\times10^{-4}$ against $27.7$, a ratio of $2.5\times10^{-5}$, and the mode is finished in $4 \times 0.48\,\mathrm{ms} = 1.9\,\mathrm{ms}$.

The reduction is what makes the wheel usable in a spacecraft model: torque command to wheel speed becomes one lag, the momentum bookkeeping stays exact, and nobody has to integrate a $0.48\,\mathrm{ms}$ time constant alongside an orbit. But if you were designing the motor's own current loop, which crosses over at hundreds of $\mathrm{rad/s}$, the electrical pole is the plant and the mechanical pole is the one you would neglect. Dominance is relative to the loop you are closing, not a property of the model.
:::

## Reducing the other way: what stays

The same reasoning tells you which fast dynamics you must *keep*. Delete a factor and you delete its phase, and phase is what stability margins are made of.

For a second-order actuator $A(s) = \omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$ with $\omega_n = 62.83\,\mathrm{rad/s}$ and $\zeta = 0.7$ — the $10\,\mathrm{Hz}$ thrust-vector actuator of lesson 2 — the magnitude stays within $0.3\%$ of one all the way to $20\,\mathrm{rad/s}$, so on a magnitude plot it is invisible. Its phase is not:

| $\omega$ (rad/s) | $\lvert A(j\omega)\rvert$ | $\angle A$ |
| --- | --- | --- |
| 0.163 | 1.0000 | $-0.21^\circ$ |
| 0.5 | 1.0000 | $-0.64^\circ$ |
| 1.0 | 1.0000 | $-1.28^\circ$ |
| 5.0 | 1.0001 | $-6.40^\circ$ |
| 20.0 | 0.9969 | $-26.4^\circ$ |

A launch-vehicle attitude loop crossing over near $1\,\mathrm{rad/s}$ loses $1.3^\circ$ to this actuator and may reduce it away. A rate loop crossing over at $5\,\mathrm{rad/s}$ loses $6.4^\circ$, which is worth carrying. A loop at $20\,\mathrm{rad/s}$ loses $26^\circ$ and cannot be designed without the actuator in the model at all — and by then the actuator is no longer "neglected dynamics", it is part of the plant.

::: example The pole you were told to drop, costing fifteen degrees
A rate loop has open-loop transfer function

$$
L(s) = \frac{30}{s\left(1 + s/8\right)\left(1 + s/50\right)}.
$$

The pole at $-50$ is $6.25$ times further left than the one at $-8$, so the five-times rule says drop it. Do that and $L_{\text{red}} = 30/\left[s(1 + s/8)\right]$.

Find the gain crossover of each — the frequency where the magnitude passes 1 — and the phase margin there, $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$:

- Full: $\omega_c = 14.18\,\mathrm{rad/s}$, $\angle L = -90^\circ - \arctan(14.18/8) - \arctan(14.18/50) = -90^\circ - 60.6^\circ - 15.8^\circ = -166.4^\circ$, so $\mathrm{PM} = 13.6^\circ$.
- Reduced: $\omega_c = 14.50\,\mathrm{rad/s}$, $\angle L = -90^\circ - 61.1^\circ = -151.1^\circ$, so $\mathrm{PM} = 28.9^\circ$.

The reduced model claims more than twice the phase margin the loop actually has. Nothing is wrong with the five-times rule; what is wrong is applying it against the *poles* rather than against the *crossover frequency*. Here crossover sits at $14.2\,\mathrm{rad/s}$, only $3.5$ times below the neglected pole, so that pole is squarely inside the band that decides stability.

The correct statement of the rule for margin work: a pole may be neglected when it is at least five to ten times above the **gain crossover frequency**, not above the other poles. In this loop that would need $\omega_c \le 10\,\mathrm{rad/s}$, which means reducing the gain from 30 to about 16. Design on the reduced model if you like; always compute margins on the full one.
:::

::: note
There are systematic alternatives to inspection when the model is large. Balanced truncation ranks states by how much input energy is needed to reach them and how much output energy they then produce, and discards the states that score low on both; singular perturbation replaces a fast subsystem by its steady-state relation, which is exactly what deleting a time-constant factor does by hand. Both preserve DC gain by construction, and both are worth knowing when the model comes out of a finite-element package with two hundred modes. The judgement about which band matters is still yours.
:::

## Check yourself

::: check
A system has poles at $-1 \pm 2j$ and at $-40$, and no zeros. Describe the step response: shape, overshoot, settling time, and what the third pole does.
:::

::: answer
The complex pair has $\omega_n = \sqrt{1 + 4} = \sqrt{5} = 2.24\,\mathrm{rad/s}$ and $\zeta = 1/\sqrt{5} = 0.447$, so the response is roughly second order: about 20.8% overshoot, a peak at $t_p = \pi/2 = 1.57\,\mathrm{s}$, and 2% settling in $t_s \approx 4/(\zeta\omega_n) = 4/1 = 4\,\mathrm{s}$. The pole at $-40$ is forty times further left; its mode decays with a $25\,\mathrm{ms}$ time constant and is finished in $100\,\mathrm{ms}$, and its residue-weighted contribution is under 1% of the pair's. Its only visible effect is a small delay at the start of the rise. For design purposes the system is the complex pair; for a margin calculation with crossover anywhere near $10\,\mathrm{rad/s}$ it is not.
:::

::: check
$G(s) = \dfrac{50(s + 4.2)}{(s + 4)(s + 5)(s + 60)}$. Which modes matter, and what is the simplest model you would carry?
:::

::: answer
Compute residues. At $-4$: $50(0.2)/\left[(1)(56)\right] = 0.1786$, contribution $\left|r/p\right| = 0.0446$. At $-5$: $50(-0.8)/\left[(-1)(55)\right] = 0.7273$, contribution $0.1455$. At $-60$: $50(-55.8)/\left[(-56)(-55)\right] = -0.9058$, contribution $0.0151$. DC gain is $50(4.2)/(4 \times 5 \times 60) = 0.175$.

So the pole at $-4$ is nearly cancelled by the zero at $-4.2$ and carries little, and the pole at $-60$ is both fast and small. The dominant mode is the one at $-5$. A defensible reduced model preserving DC gain is $G_{\text{red}}(s) = 0.175/(1 + s/5) = 0.875/(s + 5)$, a first-order lag with a $0.2\,\mathrm{s}$ time constant. Check it against the full step response before trusting it, and do not use it above about $1\,\mathrm{rad/s}$.
:::

::: check
Why does deleting a factor $(1 + s/p)$ preserve the DC gain, while deleting $(s + p)$ does not?
:::

::: answer
The DC gain is $G(0)$, so what matters is the value of the deleted factor at $s = 0$. The time-constant factor $(1 + s/p)$ equals exactly 1 there, so removing it multiplies $G(0)$ by 1 — no change. The pole-zero factor $(s + p)$ equals $p$ there, so removing it from the denominator multiplies $G(0)$ by $p$, which for $p = 40$ is a factor of forty. The honest version of the pole-zero deletion is to replace $(s + p)$ by the constant $p$, which is the same operation written differently. This is why reduction is always done in time-constant form.
:::

::: check
An attitude loop is designed on a rigid-body model and crosses over at $1.2\,\mathrm{rad/s}$. The vehicle has a first bending mode at $2.1\,\mathrm{rad/s}$ with $\zeta = 0.005$. May the mode be neglected because it is above crossover?
:::

::: answer
No. The five-times rule needs the neglected dynamics well above crossover, and $2.1/1.2 = 1.75$ is not well above anything. Worse, the rule assumes ordinary damping: a mode with $\zeta = 0.005$ has a resonant peak of $1/(2\zeta) = 100$, forty decibels, and contributes a phase swing of close to $180^\circ$ across a band only a few percent wide. Both the magnitude peak and the phase swing land right where the loop decides its stability, so the mode can push the gain back above 1 at a frequency where the phase has already passed $-180^\circ$. A lightly damped mode is never negligible on proximity arguments alone; it is either gain-stabilised (attenuated by a notch or a roll-off so its peak stays well below 1) or phase-stabilised (arranged so the phase at the mode is safe), and those are the subject of the next module.
:::

::: check
You reduce a model and the step responses agree to 1%, but the closed loop built on the reduced model oscillates on the test stand. Give two explanations consistent with what this lesson says.
:::

::: answer
First, the neglected dynamics may be close to the crossover frequency rather than close to the poles you compared. Step-response agreement is dominated by low frequencies, where the deleted factors are all near 1; phase margin is decided at crossover, where they are not. The worked example above loses $15^\circ$ of margin with a 3% step-response error. Second, the reduction may have cancelled a pole against a nearby zero. The cancellation is exact only at the nominal parameter values, and the real hardware's pole and zero sit somewhere else — so the mode you removed from the model is still in the loop, with a residue that is small but no longer zero, and if it is lightly damped it can ring. In both cases the fix is the same: recompute margins on the unreduced model and, where the model is uncertain, on the extremes of the parameter range.
:::

## Summary

| Item | Statement |
| --- | --- |
| Step response decomposition | $y(t) = G(0) + \sum_i \dfrac{r_i}{-p_i}e^{p_it}$; mode size $\left\lvert r_i/p_i\right\rvert$, duration $1/\lvert\operatorname{Re}p_i\rvert$ |
| Dominant poles | those nearest the imaginary axis with residues of ordinary size |
| Neglect rule | real part $\gtrsim 5\times$ further left than the dominant pair, and not near a zero |
| Margin rule | for stability margins, the neglected corner must be $5$–$10\times$ above **gain crossover**, not above the other poles |
| How to reduce | time-constant form, delete factors whose corner is far above the band; DC gain preserved automatically |
| Pole-zero form trap | deleting $(s + p)$ changes the DC gain by $p$; replace it by the constant $p$ instead |
| Near cancellation | a pole within ~10% of a zero may be cancelled if well damped; never if lightly damped |
| Lightly damped modes | never negligible on proximity alone; peak is $1/(2\zeta)$ |

The next lesson is about the numerator instead of the denominator: what an added zero does to a response, and why a zero in the right half plane is the one feature of a plant that no controller can argue with.
