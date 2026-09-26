---
id: l06-dominant-poles-and-model-reduction
title: Dominant poles and model order reduction by inspection
minutes: 19
covers:
  - "Dominant poles and model order reduction by inspection"
---

Take a photo of a room with the flash on. For a thousandth of a second the flash is the brightest thing there. Then it is gone, and the room lights are what you see for the rest of the evening. If someone asks "how is this room lit?", you say "by the ceiling lamps", and you are right — even though, for one instant, the flash outshone them all.

Lesson 5 was written for second-order systems, and almost nothing you will meet is second order. A launch vehicle's pitch channel has rigid-body poles, actuator poles, sensor filter poles, structural bending modes and **[[slosh|slosh]]** modes. Write it all down and you have a twentieth-order model no one can reason about. Yet engineers routinely say "this loop is second order with $\zeta = 0.6$ and $\omega_n = 2\,\mathrm{rad/s}$" — and they are right. This lesson explains when that is legitimate, how to do the reduction in your head, and — more importantly — the analyses in which the same reduction will lie to you.

The idea is the flash and the lamps. A mode shows up in a response in proportion to two things: how slowly it dies away, and how big its residue is. A pole far to the left gives a mode that is over before anything else has begun — a flash. A pole with a tiny residue gives a mode nobody can see — a lamp that is switched almost off. Either way, deleting it changes the response by an amount you can bound, and the smaller model then supports all of lesson 5's arithmetic.

Reduction is also how design really proceeds. You choose closed-loop poles on a second-order picture. Then you put the neglected dynamics back and check what they did to your margins. That check is not a formality: the last worked example shows a pole that the standard rule says to drop, costing fifteen degrees of phase margin.

## What "dominant" means

Write the step response of a stable system with distinct poles as

$$
y(t) = G(0) + \sum_i \frac{r_i}{p_i}e^{p_it},
$$

where $r_i$ is the residue of $G$ at the pole $p_i$ (lesson 4). The first term is the final value. Each term in the sum is one mode, dying away.

Where does the $1/p_i$ come from? A step input is $1/s$, so the output is $G(s)/s$. Its residue at $p_i$ is the residue of $G$ there, divided by the extra factor $s$ evaluated at $s = p_i$ — that is, $r_i/p_i$. (Sanity check with $G = 1/(s + 1)$: $r = 1$, $p = -1$, so $y = 1 + \frac{1}{-1}e^{-t} = 1 - e^{-t}$. Correct.)

So each mode has:

- a **size**, $\left|r_i/p_i\right|$ — how loud;
- a **duration**, $1/\left|\operatorname{Re}p_i\right|$ — how long it lasts.

A mode is negligible when either is small:

- **It is fast.** A large $\left|\operatorname{Re}p_i\right|$ means the term is gone in $4/\left|\operatorname{Re}p_i\right|$ seconds. And the $1/p_i$ makes its size small too — the **[[extra division|why-divide-by-p]]** shrinks fast modes twice over.
- **Its residue is small.** A zero near the pole guts the residue, wherever the pole is.

The **[[dominant poles|dominant-map]]** are the ones left over: normally the pair closest to the imaginary axis, with a residue of ordinary size.

Here is a worked comparison. For $G = 100(s + 9)/\left[(s+1)(s+10)(s+100)\right]$ the residues (from lesson 4) are $0.8979$, $0.1235$ and $-1.0213$. Divide each by its pole to get the three step-response sizes $\left|r_i/p_i\right|$:

$$
\frac{0.8979}{1} = 0.898, \qquad \frac{0.1235}{10} = 0.0123, \qquad \frac{1.0213}{100} = 0.0102.
$$

The pole at $-1$ carries 97% of the transient. The other two are visible for a few tens of milliseconds and are worth about 1% each.

Notice *why* the pole at $-10$ is negligible. It is not because it is fast — it is only ten times further left. It is because the zero at $-9$ sits almost on top of it.

::: key
When can you ignore a pole? When its real part is roughly **5 times further left** than the dominant pair, and it is **not near a zero**. Safe for time-domain design intuition; never safe when computing stability margins.
:::

## Reduction by inspection

The procedure is three lines. The only trick is to work in the **time-constant form** of lesson 3, because then reducing is literally deleting a factor.

1. Write $G$ in time-constant form, $G = K\dfrac{\prod(1 + s/z_i)}{\prod(1 + s/p_i)}$. Write second-order factors as $\left(1 + 2\zeta s/\omega + s^2/\omega^2\right)$. (Here $z_i$ and $p_i$ stand for the corner frequencies — the sizes of the zeros and poles.)
2. Fix the band of interest. Normally that is up to about five times the intended crossover or the dominant $\omega_n$.
3. Replace by 1 every factor whose corner frequency lies well above that band. Cancel any pole-zero pair whose members are within about 10% of each other and well damped.

Every deleted factor equals 1 at $s = 0$, so this **[[keeps the DC gain|dc-gain-kept]]** automatically. That is the whole reason for using the time-constant form.

::: warning
Do the same deletion in pole-zero form and you destroy the gain. From $G = 200/\left[(s^2 + 2s + 5)(s + 40)\right]$, striking out the factor $(s + 40)$ leaves $200/(s^2 + 2s + 5)$, whose DC gain is $200/5 = 40$, not 1. The correct reduction replaces $(s + 40)$ by its value at $s = 0$, namely 40, giving $5/(s^2 + 2s + 5)$. In time-constant form the same step is deleting $(1 + s/40)$, and there is nothing to remember.
:::

::: example A fast pole behind a dominant pair
Take $G(s) = \dfrac{200}{(s^2 + 2s + 5)(s + 40)}$. Its DC gain is $200/(5 \times 40) = 1$.

**The map.** The complex pair is at $-1 \pm 2j$. So $\omega_n = \sqrt{5} = 2.236\,\mathrm{rad/s}$ and $\zeta = 1/\sqrt{5} = 0.447$. The third pole is at $-40$, forty times further left.

**Lesson 5's predictions, from the pair alone.** Overshoot $M_p = e^{-\pi(0.447)/0.894} = 20.8\%$. Peak time $t_p = \pi/2 = 1.571\,\mathrm{s}$. 2% settling $t_s \approx 4/1 = 4\,\mathrm{s}$.

**Residues.** At $-40$: $r = 200/\left[(-40)^2 + 2(-40) + 5\right] = 200/1525 = 0.1311$, so the step size is $\left|r/p\right| = 0.1311/40 = 0.00328$. At $-1 + 2j$: $\left|r\right| = 1.2804$, and $|p| = \sqrt{5}$, so $\left|r/p\right| = 0.5726$. The fast mode carries 0.6% of what the pair carries.

**Check by simulation.** Integrating both step responses confirms it. The full third-order response peaks at $1.2075$ at $t = 1.596\,\mathrm{s}$. The reduced $5/(s^2 + 2s + 5)$ peaks at $1.2079$ at $t = 1.571\,\mathrm{s}$. The **[[largest gap between them|full-vs-reduced]]** anywhere is $0.032$, at $t = 0.58\,\mathrm{s}$ during the rise. That is about 3% of the final value, and it is a small delay rather than a change of shape, because the extra pole adds about $1/40 = 25\,\mathrm{ms}$ of lag. The exact 2% settling times are $3.760\,\mathrm{s}$ and $3.735\,\mathrm{s}$.

So the reduction is excellent for every time-domain number a specification contains. Its only visible effect is a $25\,\mathrm{ms}$ shift early in the rise.
:::

::: example Throwing away a motor's electrical dynamics
The wheel motor of lesson 3 is $G(s) = 3054/\left[(s + 0.0529)(s + 2083.3)\right]$. In time-constant form,

$$
G(s) = \frac{27.72}{\left(1 + s/0.0529\right)\left(1 + s/2083.3\right)}\ \ \mathrm{(rad/s)/V}.
$$

The electrical corner is at $2083\,\mathrm{rad/s}$ — about 39,000 times the mechanical one. Delete its factor:

$$
G_{\text{red}}(s) = \frac{27.72}{1 + s/0.0529} = \frac{1.466}{s + 0.0529}.
$$

(Multiply top and bottom by $0.0529$ to get the second form: $27.72 \times 0.0529 = 1.466$.) It is first order, and the DC gain is unchanged at $27.72\,(\mathrm{rad/s})/\mathrm{V}$.

Lesson 4 already showed why this is safe. In the step response, the electrical mode's residue is $7.04\times10^{-4}$ against $27.7$, a ratio of $2.5\times10^{-5}$. And the mode is finished in $4 \times 0.48\,\mathrm{ms} = 1.9\,\mathrm{ms}$.

The reduction is what makes the wheel usable in a spacecraft model. Voltage command to wheel speed becomes one lag, the momentum bookkeeping stays exact, and nobody has to integrate a $0.48\,\mathrm{ms}$ time constant alongside an orbit.

But suppose you were designing the motor's own **[[current loop|current-loop]]**, which crosses over at hundreds of $\mathrm{rad/s}$. Then the electrical pole *is* the plant, and the mechanical pole is the one you would neglect. Dominance is relative to the loop you are closing. It is not a property of the model.
:::

## Reducing the other way: what stays

The same reasoning tells you which fast dynamics you must *keep*. Delete a factor and you delete its phase too — and phase is what stability margins are made of.

Here is the flash-and-lamps picture failing. A fast pole can be nearly invisible in *size* while still shifting the *timing* of every wobble that passes through it.

Take a second-order actuator $A(s) = \omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$ with $\omega_n = 62.83\,\mathrm{rad/s}$ and $\zeta = 0.7$ — the $10\,\mathrm{Hz}$ thrust-vector actuator of lesson 2. Its magnitude stays within $0.3\%$ of one all the way to $20\,\mathrm{rad/s}$, so on a magnitude plot it is invisible. Its **[[phase is not|actuator-phase]]**:

| $\omega$ (rad/s) | $\lvert A(j\omega)\rvert$ | $\angle A$ |
| --- | --- | --- |
| 0.163 | 1.0000 | $-0.21^\circ$ |
| 0.5 | 1.0000 | $-0.64^\circ$ |
| 1.0 | 1.0000 | $-1.28^\circ$ |
| 5.0 | 1.0001 | $-6.40^\circ$ |
| 20.0 | 0.9969 | $-26.4^\circ$ |

Read the table against three loops:

- A launch-vehicle attitude loop crossing over near $1\,\mathrm{rad/s}$ loses $1.3^\circ$ to this actuator, and may reduce it away.
- A rate loop crossing over at $5\,\mathrm{rad/s}$ loses $6.4^\circ$, which is worth carrying.
- A loop at $20\,\mathrm{rad/s}$ loses $26^\circ$ and cannot be designed without the actuator in the model at all. By then the actuator is no longer "neglected dynamics". It is part of the plant.

::: example The pole you were told to drop, costing fifteen degrees
A rate loop has open-loop transfer function

$$
L(s) = \frac{30}{s\left(1 + s/8\right)\left(1 + s/50\right)}.
$$

The pole at $-50$ is $6.25$ times further left than the one at $-8$, so the five-times rule says drop it. Do that and $L_{\text{red}} = 30/\left[s(1 + s/8)\right]$.

Now find, for each version, the **gain crossover** — the frequency $\omega_c$ where $|L|$ passes through 1 — and the **[[phase margin|phase-margin]]** there, $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$. Each factor $(1 + s/a)$ adds a lag of $\arctan(\omega/a)$, and the $1/s$ adds $90^\circ$:

- **Full.** $\omega_c = 14.18\,\mathrm{rad/s}$, and $\angle L = -90^\circ - \arctan(14.18/8) - \arctan(14.18/50) = -90^\circ - 60.6^\circ - 15.8^\circ = -166.4^\circ$. So $\mathrm{PM} = 13.6^\circ$.
- **Reduced.** $\omega_c = 14.50\,\mathrm{rad/s}$, and $\angle L = -90^\circ - 61.1^\circ = -151.1^\circ$. So $\mathrm{PM} = 28.9^\circ$.

The reduced model claims more than twice the phase margin the loop really has — $15.3^\circ$ too much.

Nothing is wrong with the five-times rule. What is wrong is applying it against the *poles* instead of against the *crossover frequency*. Here crossover sits at $14.2\,\mathrm{rad/s}$, only $3.5$ times below the neglected pole, so that pole is squarely inside the band that decides stability.

The correct statement of the rule for margin work: a pole may be neglected when it is at least five to ten times above the **gain crossover frequency** — not above the other poles. In this loop that would need $\omega_c \le 10\,\mathrm{rad/s}$, which means cutting the gain from 30 to about 16. Design on the reduced model if you like. Always compute margins on the full one.
:::

::: note Beyond inspection
There are systematic alternatives to inspection when the model is large. **Balanced truncation** ranks the states by how much input energy it takes to reach them and how much output energy they then produce, and discards the states that score low on both. **Singular perturbation** replaces a fast subsystem by its steady-state relation — which is exactly what deleting a time-constant factor does by hand. Both keep the DC gain by construction, and both are worth knowing when the model comes out of a finite-element package with two hundred modes. The judgment about which band matters is still yours.
:::

## Check yourself

::: check
A fourth-order closed loop has poles at $-0.8 \pm 1.5j$, $-6$ and $-55$, and a zero at $-5.8$, with unit DC gain. Rank the modes, and write down the model you would carry into a design review.
:::

::: answer
Compute the residue-weighted sizes $\lvert r_i/p_i\rvert$. For unit DC gain, $G = 164.4(s + 5.8)/\left[(s^2 + 1.6s + 2.89)(s + 6)(s + 55)\right]$ (check: $164.4 \times 5.8/(2.89 \times 6 \times 55) = 1.00$). The sizes are $0.5736$ for each member of the complex pair, $0.0038$ for the pole at $-6$, and $0.0010$ for the pole at $-55$. The pair carries 150 times what the pole at $-6$ carries, and 560 times what the pole at $-55$ carries.

The two rejections have different reasons. The pole at $-55$ is fast: 69 times further left than the pair, well past the five-times rule. The pole at $-6$ is *not* especially fast — only 7.5 times further left — but the zero at $-5.8$ sits almost on top of it and guts its residue.

The model to carry is $2.89/(s^2 + 1.6s + 2.89)$: $\omega_n = 1.70\,\mathrm{rad/s}$, $\zeta = 0.8/1.70 = 0.471$, about 18.7% overshoot, $t_p = \pi/1.5 = 2.09\,\mathrm{s}$, and 2% settling in $4/0.8 = 5.0\,\mathrm{s}$. Add a note in the margin that the near-cancellation at $-6$ holds only at nominal parameters.
:::

::: check
$G(s) = \dfrac{50(s + 4.2)}{(s + 4)(s + 5)(s + 60)}$. Which modes matter, and what is the simplest model you would carry?
:::

::: answer
Compute the residues by cover-up.

- At $-4$: $50(0.2)/\left[(1)(56)\right] = 0.1786$, size $\left|r/p\right| = 0.0446$.
- At $-5$: $50(-0.8)/\left[(-1)(55)\right] = 0.7273$, size $0.1455$.
- At $-60$: $50(-55.8)/\left[(-56)(-55)\right] = -0.9058$, size $0.0151$.

The DC gain is $50(4.2)/(4 \times 5 \times 60) = 210/1200 = 0.175$.

So the pole at $-4$ is nearly cancelled by the zero at $-4.2$ and carries little. The pole at $-60$ is both fast and small. The dominant mode is the one at $-5$.

A defensible reduced model that keeps the DC gain is $G_{\text{red}}(s) = 0.175/(1 + s/5) = 0.875/(s + 5)$: a first-order lag with a $0.2\,\mathrm{s}$ time constant. Check it against the full step response before trusting it, and do not use it above about $1\,\mathrm{rad/s}$.
:::

::: check
Why does deleting a factor $(1 + s/p)$ keep the DC gain, while deleting $(s + p)$ does not?
:::

::: answer
The DC gain is $G(0)$, so what matters is the value of the deleted factor at $s = 0$.

The time-constant factor $(1 + s/p)$ equals exactly 1 there. Removing it multiplies $G(0)$ by 1 — no change.

The pole-zero factor $(s + p)$ equals $p$ there. Removing it from the denominator multiplies $G(0)$ by $p$, which for $p = 40$ is a factor of forty.

The honest version of the pole-zero deletion is to replace $(s + p)$ by the constant $p$, which is the same operation written differently. That is why reduction is always done in time-constant form.
:::

::: check
An attitude loop is designed on a rigid-body model and crosses over at $1.2\,\mathrm{rad/s}$. The vehicle has a first bending mode at $2.1\,\mathrm{rad/s}$ with $\zeta = 0.005$. May the mode be neglected because it is above crossover?
:::

::: answer
No. The five-times rule needs the neglected dynamics well above crossover, and $2.1/1.2 = 1.75$ is not well above anything.

Worse, the rule assumes ordinary damping. A mode with $\zeta = 0.005$ has a resonant peak of $1/(2\zeta) = 100$ — forty decibels — and swings the phase by close to $180^\circ$ across a band only a few percent wide. Both the magnitude peak and the phase swing land right where the loop decides its stability. The mode can push the gain back above 1 at a frequency where the phase has already passed $-180^\circ$.

A lightly damped mode is never negligible on nearness arguments alone. It is either **[[gain-stabilized or phase-stabilized|gain-phase-stabilized]]**: attenuated by a notch or a roll-off so its peak stays well below 1, or arranged so the phase at the mode is safe. Those are the subject of the next module.
:::

::: check
You reduce a model, and the step responses agree to 1%. But the closed loop built on the reduced model oscillates on the test stand. Give two explanations consistent with this lesson.
:::

::: answer
**First, the neglected dynamics may be close to the crossover frequency** rather than close to the poles you compared. Step-response agreement is dominated by low frequencies, where the deleted factors are all near 1. Phase margin is decided at crossover, where they are not. The worked example above loses $15^\circ$ of margin with a 3% step-response error.

**Second, the reduction may have cancelled a pole against a nearby zero.** The cancellation is exact only at the nominal parameter values, and the real hardware's pole and zero sit somewhere else. So the mode you removed from the model is still in the loop, with a residue that is small but no longer zero — and if it is lightly damped, it can ring.

In both cases the fix is the same: recompute margins on the unreduced model and, where the model is uncertain, at the extremes of the parameter range.
:::

## Summary

| Item | Statement |
| --- | --- |
| Step response decomposition | $y(t) = G(0) + \sum_i \dfrac{r_i}{p_i}e^{p_it}$; mode size $\left\lvert r_i/p_i\right\rvert$, duration $1/\lvert\operatorname{Re}p_i\rvert$ |
| Dominant poles | those nearest the imaginary axis with residues of ordinary size |
| Neglect rule | real part $\gtrsim 5\times$ further left than the dominant pair, and not near a zero |
| Margin rule | for stability margins, the neglected corner must be $5$–$10\times$ above **gain crossover**, not above the other poles |
| How to reduce | time-constant form, delete factors whose corner is far above the band; DC gain kept automatically |
| Pole-zero form trap | deleting $(s + p)$ changes the DC gain by $p$; replace it by the constant $p$ instead |
| Near cancellation | a pole within ~10% of a zero may be cancelled if well damped; never if lightly damped |
| Lightly damped modes | never negligible on nearness alone; peak is $1/(2\zeta)$ |

The next lesson is about the numerator instead of the denominator: what an added zero does to a response, and why a zero in the right half plane is the one feature of a plant that no controller can argue with.

::: context slosh Propellant that moves on its own
A rocket's tanks are partly full of liquid, and liquid sloshes — like coffee in a mug you carry too fast. The sloshing mass pushes on the tank walls at its own natural frequency, which depends on the tank size and the acceleration. To the control system this looks like an extra pendulum hanging inside the vehicle: a pair of lightly damped poles. Tanks carry baffles, rings and plates inside, partly to add damping to these modes.
:::

::: context why-divide-by-p Why fast modes shrink twice
The step response is the running total (the integral) of the impulse response. A mode $r e^{pt}$ in the impulse response has total area $r/|p|$ when $p$ is negative, because the exponential's area is one over its decay rate. So when the step adds it up, a fast mode — large $|p|$ — contributes very little area before it dies. It is short *and* small. A mode ten times faster is, residue for residue, ten times smaller in the step response.
:::

::: context dominant-map Two reasons to drop a pole, on one map
The poles of the first check question, to scale except for the far pole. The dashed line is five times further left than the dominant pair's real part, $-0.8$. The pole at $-6$ is past the line but only 7.5 times out — it is the zero at $-5.8$, almost on top of it, that silences it. The pole at $-55$ is far off to the left and silenced by speed alone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="330" y1="10" x2="330" y2="190" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="170" y1="15" x2="170" y2="185" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="5 3"/>
  <text x="170" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">−4 (5 × 0.8)</text>
  <g stroke="#1d6fd1" stroke-width="2.2">
    <line x1="292" y1="34" x2="304" y2="46"/><line x1="304" y1="34" x2="292" y2="46"/>
    <line x1="292" y1="154" x2="304" y2="166"/><line x1="304" y1="154" x2="292" y2="166"/>
  </g>
  <text x="290" y="28" font-size="11" text-anchor="end" fill="#1d6fd1">dominant −0.8 ± 1.5j</text>
  <g stroke="#1f2a44" stroke-width="2.2">
    <line x1="84" y1="94" x2="96" y2="106"/><line x1="96" y1="94" x2="84" y2="106"/>
  </g>
  <circle cx="98" cy="100" r="6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="92" y="84" font-size="11" text-anchor="middle" fill="#1f2a44">pole −6</text>
  <text x="100" y="124" font-size="11" text-anchor="middle" fill="#b4232c">zero −5.8</text>
  <line x1="60" y1="100" x2="22" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="15,100 25,95 25,105" fill="#1f2a44"/>
  <text x="20" y="150" font-size="11" fill="#1f2a44">pole −55: far off this way</text>
  <text x="334" y="116" font-size="11" fill="#6c7a93">0</text>
</svg>
```
:::

::: context dc-gain-kept Why deleting a 1 is harmless at DC
At $s = 0$ every time-constant factor $(1 + s/a)$ is exactly 1, and multiplying by 1 changes nothing. So you can throw away as many of those factors as you like and $G(0)$ stays put. Near $s = 0$ — slow signals — a factor with a large corner $a$ is also close to 1, which is why deleting it barely changes slow behavior either. What it does change is behavior near and above $\omega = a$.
:::

::: context full-vs-reduced Full and reduced, side by side
The step responses of the third-order $200/[(s^2 + 2s + 5)(s + 40)]$ (solid) and the reduced $5/(s^2 + 2s + 5)$ (dashed), over six seconds, drawn to scale. They are hard to tell apart. The largest gap, $0.032$, is during the rise near $0.58\,\mathrm{s}$, where the full model lags by about $25\,\mathrm{ms}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="60" x2="345" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.4" points="50.0,180.0 54.8,178.2 59.6,171.8 64.4,161.4 69.2,148.4 74.0,133.7 78.8,118.4 83.6,103.2 88.4,88.8 93.2,75.7 98.0,64.3 102.8,54.8 107.6,47.2 112.4,41.6 117.2,37.8 122.0,35.7 126.8,35.1 131.6,35.7 136.4,37.3 141.2,39.7 146.0,42.5 150.8,45.6 155.6,48.8 160.4,51.9 165.2,54.8 170.0,57.5 174.8,59.7 179.6,61.6 184.4,63.0 189.2,64.1 194.0,64.8 198.8,65.1 203.6,65.2 208.4,65.0 213.2,64.6 218.0,64.1 222.8,63.5 227.6,62.8 232.4,62.1 237.2,61.5 242.0,60.9 246.8,60.4 251.6,59.9 256.4,59.6 261.2,59.3 266.0,59.1 270.8,59.0 275.6,58.9 280.4,58.9 285.2,59.0 290.0,59.1 294.8,59.2 299.6,59.3 304.4,59.5 309.2,59.6 314.0,59.7 318.8,59.8 323.6,59.9 328.4,60.0 333.2,60.1 338.0,60.2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.6" stroke-dasharray="5 3" points="50.0,180.0 54.8,177.2 59.6,169.6 64.4,158.5 69.2,144.9 74.0,129.9 78.8,114.6 83.6,99.5 88.4,85.4 93.2,72.7 98.0,61.7 102.8,52.6 107.6,45.6 112.4,40.4 117.2,37.1 122.0,35.4 126.8,35.1 131.6,36.0 136.4,37.8 141.2,40.3 146.0,43.2 150.8,46.4 155.6,49.6 160.4,52.7 165.2,55.5 170.0,58.1 174.8,60.2 179.6,62.0 184.4,63.4 189.2,64.3 194.0,64.9 198.8,65.2 203.6,65.1 208.4,64.9 213.2,64.5 218.0,63.9 222.8,63.3 227.6,62.6 232.4,62.0 237.2,61.3 242.0,60.8 246.8,60.3 251.6,59.8 256.4,59.5 261.2,59.2 266.0,59.1 270.8,59.0 275.6,58.9 280.4,58.9 285.2,59.0 290.0,59.1 294.8,59.2 299.6,59.4 304.4,59.5 309.2,59.6 314.0,59.8 318.8,59.9 323.6,60.0 328.4,60.1 333.2,60.1 338.0,60.2"/>
  <text x="44" y="64" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="130" y="28" font-size="11" fill="#1f2a44">peak ≈ 1.21 near 1.6 s</text>
  <line x1="338" y1="180" x2="338" y2="185" stroke="#1f2a44"/>
  <text x="338" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">6 s</text>
  <text x="200" y="150" font-size="11" fill="#1d6fd1">solid: full, 3 poles</text>
  <text x="200" y="166" font-size="11" fill="#b4232c">dashed: reduced, 2 poles</text>
</svg>
```
:::

::: context current-loop The loop inside the motor
A reaction-wheel motor is usually driven by its own small, fast controller that sets the current in the windings, because torque is proportional to current. That inner current loop has to be fast — crossing over at hundreds of radians per second — so the attitude controller above it can treat "commanded torque" as if it happened at once. For that inner loop, the $0.48\,\mathrm{ms}$ electrical lag is the main thing to control, and the slow $19\,\mathrm{s}$ mechanical lag hardly moves during one of its responses.
:::

::: context actuator-phase Tiny in size, not in timing
The phase of the $10\,\mathrm{Hz}$, $\zeta = 0.7$ actuator from $0.1$ to about $63\,\mathrm{rad/s}$ on a log scale, drawn to scale. The dots are the table's values at $1$, $5$ and $20\,\mathrm{rad/s}$. The magnitude is within 0.3% of 1 over most of this range, yet the phase is already bending down by $5\,\mathrm{rad/s}$ and reaches $-90^\circ$ at $\omega_n = 62.8\,\mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="25" x2="345" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="25" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="73" x2="330" y2="73" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="50" y1="121" x2="330" y2="121" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="50" y1="169" x2="330" y2="169" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50.0,25.2 54.8,25.2 59.5,25.3 64.2,25.3 69.0,25.3 73.8,25.4 78.5,25.4 83.2,25.5 88.0,25.5 92.8,25.6 97.5,25.6 102.2,25.7 107.0,25.8 111.8,25.9 116.5,26.0 121.2,26.1 126.0,26.3 130.8,26.4 135.5,26.6 140.2,26.8 145.0,27.0 149.8,27.3 154.5,27.6 159.2,27.9 164.0,28.2 168.8,28.6 173.5,29.1 178.2,29.6 183.0,30.1 187.8,30.8 192.5,31.5 197.2,32.3 202.0,33.1 206.8,34.1 211.5,35.3 216.2,36.5 221.0,37.9 225.8,39.5 230.5,41.3 235.3,43.3 240.0,45.6 244.8,48.2 249.5,51.1 254.2,54.3 259.0,58.1 263.8,62.3 268.5,67.1 273.2,72.6 278.0,78.9 282.8,86.1 287.5,94.3 292.2,103.8 297.0,114.6 301.8,126.7 306.5,140.1 311.2,154.6 316.0,169.6"/>
  <circle cx="145" cy="27" r="3.5" fill="#b4232c"/>
  <circle cx="211.4" cy="35.2" r="3.5" fill="#b4232c"/>
  <circle cx="268.6" cy="67.2" r="3.5" fill="#b4232c"/>
  <text x="44" y="29" font-size="11" text-anchor="end" fill="#1f2a44">0°</text>
  <text x="44" y="77" font-size="11" text-anchor="end" fill="#1f2a44">−30°</text>
  <text x="44" y="125" font-size="11" text-anchor="end" fill="#1f2a44">−60°</text>
  <text x="44" y="173" font-size="11" text-anchor="end" fill="#1f2a44">−90°</text>
  <text x="145" y="44" font-size="11" text-anchor="middle" fill="#b4232c">1: −1.3°</text>
  <text x="200" y="56" font-size="11" text-anchor="middle" fill="#b4232c">5: −6.4°</text>
  <text x="240" y="92" font-size="11" text-anchor="middle" fill="#b4232c">20: −26°</text>
  <text x="50" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">0.1</text>
  <text x="145" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="240" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="316" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">63 rad/s</text>
</svg>
```
:::

::: context phase-margin A first look at phase margin
Lesson 9 and lesson 11 build this properly; here is the idea. A feedback loop turns unstable if, at some frequency, a signal goes once around the loop and comes back the same size ($|L| = 1$) and exactly inverted ($\angle L = -180^\circ$), because then it feeds itself. The gain crossover is where $|L| = 1$. The phase margin is how many degrees of extra lag you could add there before hitting $-180^\circ$. Designers usually want 30 to 60 degrees. So a model that hides $15^\circ$ of lag is hiding a large share of your safety.
:::

::: context gain-phase-stabilized Two ways to live with a bending mode
**Gain stabilization** makes the loop too weak at the mode's frequency to matter: a notch filter or a steep roll-off pushes the resonant peak well below 1, so the phase there no longer matters. **Phase stabilization** leaves the gain high but arranges the phase at the mode so the loop pushes against the vibration instead of feeding it — which needs a trustworthy model of the mode's sign and frequency. Launch vehicles often gain-stabilize higher bending modes and phase-stabilize the first one. Module 26 on classical control takes this up.
:::
