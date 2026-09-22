---
id: l09-lead-lag-compensators
title: Lead, lag and lead-lag compensators
minutes: 15
covers:
  - Lead, lag and lead-lag compensators
---

A loop needs two different things in two different places. Near crossover it needs **phase**, because phase margin is what keeps it stable and no amount of gain buys phase. Far below crossover it needs **gain**, because that is what makes $|S|$ small and rejects disturbances. A proportional gain gives neither selectively: raise it and you move the whole magnitude curve, changing crossover and phase margin together, usually for the worse.

Lead and lag networks are the two first-order filters that separate those jobs. A **lead** adds phase in a chosen band, at the cost of high-frequency gain. A **lag** adds low-frequency gain, at the cost of a small amount of phase near crossover. A **lead-lag** does both, and between them they cover most of what a PID does, in a form whose parameters map directly onto the specification.

They are also the compensators you meet in flight hardware that predates digital control and in plenty that does not. A launch-vehicle autopilot is typically rate feedback plus a lead network plus notches; a gimbal servo loop is a lead; a thermal loop is a lag. The vocabulary is worth having in the form the hardware uses it.

The plant for this lesson is an electromechanical gimbal actuator — current command to gimbal angle, with a motor pole at $3\ \mathrm{rad/s}$:

$$
G(s) = \frac{2}{s\,(s + 3)} .
$$

## The lead network

$$
C_{\text{lead}}(s) = K\,\frac{Ts + 1}{\alpha Ts + 1}, \qquad 0 < \alpha < 1 .
$$

The zero at $-1/T$ comes first and the pole at $-1/(\alpha T)$ a factor $1/\alpha$ later, so between them the magnitude rises at $+20\ \mathrm{dB/decade}$ and the phase is positive. The phase is

$$
\angle C = \arctan(\omega T) - \arctan(\alpha\omega T),
$$

and setting its derivative to zero gives the peak at the geometric mean of the corners,

$$
\omega_m = \frac{1}{T\sqrt{\alpha}} = \sqrt{\frac{1}{T}\cdot\frac{1}{\alpha T}},
\qquad
\sin\phi_m = \frac{1-\alpha}{1+\alpha},
\qquad
|C(j\omega_m)| = \frac{K}{\sqrt{\alpha}} .
$$

Everything about designing a lead follows from those three. $\alpha$ sets how much phase you get; $T$ sets where you get it; $K$ sets the gain. Inverting the middle one, $\alpha = (1-\sin\phi_m)/(1+\sin\phi_m)$.

| $\alpha$ | max phase lead | high-frequency gain boost $1/\alpha$ |
| --- | --- | --- |
| 0.5 | 19.5° | 2.0 |
| 0.3 | 32.6° | 3.3 |
| 0.2 | 41.8° | 5.0 |
| 0.1 | 54.9° | 10 |
| 0.05 | 64.8° | 20 |
| 0.01 | 78.6° | 100 |

The table is the whole trade. A single section can in principle produce almost $90^\circ$, but the high-frequency gain grows as $1/\alpha$ and with it the noise the actuator sees and the loop gain sitting on top of any unmodelled resonance. Past about $\alpha = 0.1$ the price is usually refused; when more than $55^\circ$ is genuinely needed, two cascaded sections of $\alpha = 0.3$ give $65^\circ$ for a high-frequency boost of $11$ rather than the $1/\alpha = 30$ a single section would cost.

::: example A lead for the gimbal actuator: 4 rad/s and 60° of phase margin
At the target crossover $\omega_c = 4\ \mathrm{rad/s}$,

$$
G(j4) = \frac{2}{j4\,(j4+3)},\qquad |G(j4)| = \frac{2}{4\sqrt{16+9}} = 0.100,\qquad \angle G(j4) = -90^\circ - \arctan\tfrac43 = -143.13^\circ .
$$

For $60^\circ$ of phase margin the loop phase at crossover must be $-120^\circ$, so the compensator must supply $-120^\circ + 143.13^\circ = +23.13^\circ$ of lead — and it should supply its *maximum* there, so $\phi_m = 23.13^\circ$ and

$$
\alpha = \frac{1-\sin 23.13^\circ}{1+\sin 23.13^\circ} = \frac{1 - 0.3928}{1.3928} = 0.4359 .
$$

Place the peak at the target crossover: $T = 1/(\omega_m\sqrt{\alpha}) = 1/(4 \times 0.6602) = 0.3786\ \mathrm{s}$, so the zero is at $1/T = 2.641\ \mathrm{rad/s}$ and the pole at $1/(\alpha T) = 6.058\ \mathrm{rad/s}$. Finally the magnitude condition: $|C(j4)| = K/\sqrt{\alpha}$ must equal $1/|G(j4)| = 10$, so

$$
K = 10\sqrt{\alpha} = 6.602 .
$$

Evaluating the finished loop numerically gives crossover at $4.0000\ \mathrm{rad/s}$ and a phase margin of $60.00^\circ$, exactly as designed. The closed-loop poles are $-3.283 \pm 4.618j$ and $-2.492$, and the modulus margin is $0.737$, so $\lVert S\rVert_\infty = 1.36$ — a comfortable design.

Note the step that catches people. The lead's gain at $\omega_m$ is $K/\sqrt{\alpha}$, not $K$. If you size $K$ from the plant magnitude alone and then add the lead, the extra $1/\sqrt{\alpha} = 1.51$ pushes crossover above the target, where the plant has less phase, and you get less margin than you designed for. Either fold $\sqrt\alpha$ into $K$ as above, or iterate.
:::

## The lag network

$$
C_{\text{lag}}(s) = \frac{Ts + 1}{\beta Ts + 1}, \qquad \beta > 1 .
$$

Now the *pole* comes first, at $-1/(\beta T)$, and the zero at $-1/T$ a factor $\beta$ later. The magnitude falls from 1 at DC to $1/\beta$ above the zero, and the phase is negative throughout, peaking at $-\phi_m$ with the same formula as before.

Written that way the lag looks like an attenuator, which is exactly how it is used. Place both corners well below the intended crossover and raise the overall gain by $\beta$ to compensate. The result is a loop whose gain near and above crossover is unchanged — so crossover and phase margin are nearly unchanged — while its gain below the lag's corners is $\beta$ times larger. You have bought low-frequency loop gain without spending phase where it matters.

The cost is the residual phase lag at crossover. Placing the lag zero a decade below crossover, $1/T = \omega_c/10$, leaves

$$
\angle C_{\text{lag}}(j\omega_c) = \arctan(10) - \arctan(10\beta),
$$

which is $-4.6^\circ$ for $\beta = 5$ and $-5.1^\circ$ for $\beta = 10$. Push the corners closer to crossover and the penalty grows quickly; push them further down and the loop takes longer to realise the benefit in the time domain.

::: example Adding a lag to fix the ramp error
The lead design above gives a **velocity error constant** $K_v = \lim_{s\to0} sL(s)$. With $L = C_{\text{lead}}G$ and $C_{\text{lead}}(0) = K$,

$$
K_v = K\cdot\frac{2}{3} = 6.602 \times 0.6667 = 4.40\ \mathrm{s^{-1}},
$$

so the steady-state error to a unit-ramp command is $1/K_v = 0.227$. Suppose the specification asks for $K_v \ge 20$, a factor of 4.5 more.

Add a lag with $\beta = 5$ and its zero a decade below crossover: $1/T_{\text{lag}} = 0.4\ \mathrm{rad/s}$, so $T_{\text{lag}} = 2.5\ \mathrm{s}$ and the pole is at $1/(\beta T_{\text{lag}}) = 0.08\ \mathrm{rad/s}$. Raise the gain to $K' = \beta K = 33.01$. The complete compensator is

$$
C(s) = 33.01\,\frac{(0.3786\,s + 1)}{(0.1650\,s + 1)}\cdot\frac{(2.5\,s + 1)}{(12.5\,s + 1)} .
$$

At $4\ \mathrm{rad/s}$ the lag contributes a magnitude of $0.201$ — almost exactly $1/\beta$ — so the $\beta$ in $K'$ cancels it and crossover barely moves, from $4.000$ to $4.015\ \mathrm{rad/s}$. It contributes $-4.57^\circ$ of phase, so the phase margin falls from $60.0^\circ$ to $55.3^\circ$. And $K_v$ rises to $33.01 \times 2/3 = 22.0\ \mathrm{s^{-1}}$, cutting the ramp error from $0.227$ to $0.045$.

Five times the low-frequency gain for four and a half degrees of phase margin. That is the lag's whole proposition, and it is usually a good trade.
:::

## They are PID in disguise

The two families are the same objects the PID lesson built, written in a different notation, and seeing the correspondence saves a great deal of confusion.

A **practical PD** is exactly a lead. Combining the terms over a common denominator,

$$
k_p + \frac{k_dNs}{s+N} = \frac{(k_p + k_dN)\,s + k_pN}{s + N},
$$

a zero at $-k_pN/(k_p + k_dN)$ over a pole at $-N$ — a lead network with $\alpha = k_p/(k_p + k_dN)$. For the attitude loop of the PID lesson ($k_p = 4800$, $k_d = 3360$, $N = 10\ \mathrm{rad/s}$) that is $\alpha = 4800/38\,400 = 0.125$: a maximum lead of $51.1^\circ$ at $\omega_m = \sqrt{1.25 \times 10} = 3.54\ \mathrm{rad/s}$. The loop crossed over at $3.26\ \mathrm{rad/s}$, so the derivative filter was, without anyone saying so, a lead network with its peak placed close to crossover. The $14.2^\circ$ that filter appeared to cost is the difference between $51.1^\circ$ and the ideal derivative's $90^\circ$, evaluated at crossover.

A **lag is a PI with the integrator moved off the origin**. A PI is $k_p(T_is + 1)/(T_is)$: a zero at $-1/T_i$ over a pole at exactly zero, giving infinite DC gain. A lag is the same shape with the pole moved to $-1/(\beta T)$, giving DC gain $\beta$ rather than infinity. As $\beta \to \infty$ with $T$ fixed, the lag becomes a PI.

That difference is a design decision, not a technicality. An integrator gives zero steady-state error, and it gives you windup, a mode-transfer problem, a pole on the stability boundary and $90^\circ$ of low-frequency lag. A lag gives a *finite* error — $1/(1+\beta L_{\text{other}}(0))$ rather than zero — and none of those problems. On loops where an actuator saturates routinely, or where the controller is frequently switched in and out, choosing $\beta = 20$ and accepting a 5% residual error is often the better engineering.

::: warning
A lag network moves a closed-loop pole very close to its own zero, near the origin. That nearly cancelling pair contributes a slow, small-amplitude tail to the step response — a "lag tail" — that can last many times the loop's nominal settling time while contributing almost nothing to the overshoot. Settling-time requirements written to a tight tolerance, such as 1%, will catch it; a 2% or 5% criterion usually will not. Simulate the step response out to several times $\beta T$ before declaring the design finished.
:::

::: warning
A lead network raises high-frequency loop gain by $1/\alpha$, and that gain sits on top of everything you did not model: sensor noise, the next bending mode, the discretisation. Whenever you add lead, recompute what the actuator is being asked to do in response to noise, and recheck the loop gain at every structural frequency. Two of this module's later constraints — the notch filter's phase cost and the waterbed effect — are both statements about the same high-frequency gain you are spending here.
:::

## Check yourself

::: check
A lead network is specified by a zero at $2\ \mathrm{rad/s}$ and a pole at $18\ \mathrm{rad/s}$. What is $\alpha$, what is the maximum phase lead, and at what frequency does it occur?
:::

::: answer
$\alpha$ is the ratio of the corner frequencies, $2/18 = 0.1111$. The maximum lead is $\arcsin\bigl((1-0.1111)/(1+0.1111)\bigr) = \arcsin(0.8) = 53.13^\circ$, at the geometric mean $\omega_m = \sqrt{2 \times 18} = 6\ \mathrm{rad/s}$. Its magnitude there is $1/\sqrt{\alpha} = 3.0$ times the network's DC gain, and its high-frequency gain is $1/\alpha = 9$ times.
:::

::: check
Why does designing the lead's gain from the plant magnitude alone, and only then adding the lead network, produce less phase margin than intended?
:::

::: answer
Because the lead contributes magnitude as well as phase. If $K$ is chosen so that $K|G(j\omega_c)| = 1$ and the lead is then applied, the loop magnitude at $\omega_c$ becomes $K|G|/\sqrt{\alpha} = 1/\sqrt{\alpha} > 1$, so crossover moves to a higher frequency. At that higher frequency the plant has more phase lag and the lead — whose peak was placed at the *old* $\omega_c$ — supplies less than its maximum. Both effects reduce the margin. The fix in the worked example is to set $K = \sqrt{\alpha}/|G(j\omega_c)|$ so the $1/\sqrt\alpha$ is already paid for.
:::

::: check
A loop crosses over at $8\ \mathrm{rad/s}$ with $55^\circ$ of phase margin, and you need ten times more loop gain below $1\ \mathrm{rad/s}$ without losing more than $6^\circ$ of margin. Design a lag and state the result.
:::

::: answer
Take $\beta = 10$ for the factor of ten. Place the lag zero low enough that its phase penalty at $8\ \mathrm{rad/s}$ is small: a decade below crossover puts it at $0.8\ \mathrm{rad/s}$, so $T = 1.25\ \mathrm{s}$ and the pole is at $1/(\beta T) = 0.08\ \mathrm{rad/s}$. The phase at crossover is $\arctan(8 \times 1.25) - \arctan(8 \times 12.5) = 84.29^\circ - 89.43^\circ = -5.14^\circ$, inside the $6^\circ$ budget. Raise the overall gain by $\beta = 10$ so the loop gain near crossover is restored. The result is crossover essentially unchanged near $8\ \mathrm{rad/s}$, phase margin about $49.9^\circ$, and ten times the loop gain below $0.08\ \mathrm{rad/s}$. Note that the full benefit appears only below the lag's *pole*, not its zero.
:::

::: check
Express the lead compensator $6.602(0.3786s + 1)/(0.1650s + 1)$ as a filtered PD, giving $k_p$, $k_d$ and $N$.
:::

::: answer
Match $\bigl[(k_p + k_dN)s + k_pN\bigr]/(s+N)$ against the lead written with a monic denominator. Dividing through by $0.1650$: $6.602\,(0.3786s+1)/\bigl(0.1650(s + 6.061)\bigr) = (15.15s + 40.01)/(s + 6.061)$. So $N = 6.061\ \mathrm{rad/s}$, $k_pN = 40.01$ giving $k_p = 6.602$, and $k_p + k_dN = 15.15$ giving $k_d = (15.15 - 6.602)/6.061 = 1.410$. Check the correspondence the other way: $\alpha = k_p/(k_p + k_dN) = 6.602/15.15 = 0.436$, which is the $\alpha$ the design started from. The derivative time is $T_d = k_d/k_p = 0.214\ \mathrm{s}$, and the filter pole at $6.06\ \mathrm{rad/s}$ is only 1.5 times crossover — aggressive filtering, which is why this lead gives $23^\circ$ rather than the ideal derivative's much larger contribution.
:::

::: check
When would you deliberately choose a lag network over a PI controller, and what do you give up?
:::

::: answer
Choose a lag when an integrator is a liability rather than an asset: when the actuator saturates often enough that windup is a real risk, when the controller is switched in and out of the loop and would need bumpless transfer machinery, when a pole exactly on the stability boundary is unacceptable to the certification process, or when the extra $90^\circ$ of low-frequency phase lag interacts badly with something else in the loop — a structural mode below crossover, for instance, that you are phase-stabilising. What you give up is the exact zero steady-state error: a lag leaves a residual error smaller than the uncompensated one by the factor $\beta$, so $\beta = 20$ turns a 10% trim error into 0.5%. If the requirement is genuinely "zero", you need the integrator and the machinery that goes with it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $C_{\text{lead}} = K(Ts+1)/(\alpha Ts+1)$, $\alpha < 1$ | zero first, then pole; adds phase, raises high-frequency gain |
| $\omega_m = 1/(T\sqrt{\alpha})$ | frequency of maximum lead, the geometric mean of the corners |
| $\sin\phi_m = (1-\alpha)/(1+\alpha)$ | maximum lead; inverted, $\alpha = (1-\sin\phi_m)/(1+\sin\phi_m)$ |
| $\lvert C(j\omega_m)\rvert = K/\sqrt{\alpha}$ | the magnitude boost that moves crossover if you forget it |
| $1/\alpha$ | high-frequency gain penalty; practical limit near $\alpha = 0.1$, $55^\circ$ |
| $C_{\text{lag}} = (Ts+1)/(\beta Ts+1)$, $\beta > 1$ | pole first, then zero; DC gain 1, high-frequency gain $1/\beta$ |
| Lag usage | place corners below crossover, multiply overall gain by $\beta$ |
| Lag phase cost | $\arctan(\omega_cT) - \arctan(\beta\omega_cT)$; $-4.6^\circ$ at $\beta = 5$, zero a decade down |
| $K_v = \lim_{s\to0}sL(s)$ | velocity error constant; ramp error $1/K_v$ |
| Gimbal example | $\alpha = 0.436$, zero 2.64, pole 6.06, $K = 6.60$: $\omega_{gc} = 4.0$, PM $60.0^\circ$ |
| With the lag | $\beta = 5$, zero 0.4, pole 0.08, $K' = 33.0$: PM $55.3^\circ$, $K_v$ from 4.40 to 22.0 |
| Practical PD $=$ lead | $\alpha = k_p/(k_p + k_dN)$, pole at $N$ |
| Lag $=$ PI with finite DC gain | pole moved from $0$ to $-1/(\beta T)$; error reduced by $\beta$ rather than to zero |

The next lesson uses the same machinery for the opposite purpose: a filter designed to remove loop gain at one narrow frequency, where a structural mode lives, and the phase that removal costs.
