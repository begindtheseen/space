---
id: l10-block-diagram-algebra-and-mason
title: Block diagram algebra, reduction and the Mason gain formula
minutes: 17
covers:
  - "Block diagram algebra, reduction, and the Mason gain formula"
---

A real flight control architecture is not one loop. A launch vehicle's pitch channel has an actuator with its own internal position loop, a rate loop closed around the vehicle by a gyro that may itself be a closed-loop instrument, an attitude loop closed around that, a feedforward path from the guidance command, and filters in several of those branches. Somebody has to turn that picture into a transfer function before anything can be analysed, and that somebody is you.

There are two ways to do it and you should own both. **Block diagram algebra** collapses the picture step by step, which is fast for simple topologies and builds intuition about what each loop does. **Mason's gain formula** reads the answer off the diagram in one pass, without redrawing anything, which is what you want when loops overlap or when you need several different transfer functions from the same diagram — command to output, disturbance to output, noise to actuator. A third way, writing one algebraic equation per summing junction and eliminating, is the safest of all and is what you fall back on when the picture gets confusing.

This lesson gives the reduction rules, including the ones for moving blocks past junctions that people get backwards, states Mason's formula precisely, and works a three-loop launch-vehicle chain both ways so you can see them agree.

## The elements, and the three basic rules

A block diagram has **blocks** (each a transfer function), **signals** on the arrows, **summing junctions** where signals add with the marked signs, and **pickoff points** where one signal feeds several branches. A pickoff takes a copy; it does not divide the signal.

Module 8 established the three basic combinations, and they are worth restating because everything else reduces to them:

| Connection | Equivalent |
| --- | --- |
| Series: $u \to G_1 \to G_2 \to y$ | $G_2G_1$ |
| Parallel: outputs of $G_1$ and $G_2$ summed | $G_1 + G_2$ |
| Negative feedback: forward $G$, feedback $H$ | $\dfrac{G}{1 + GH}$ |

For the feedback rule, remember the mnemonic: **forward path over one plus the loop gain**. If the summing junction adds rather than subtracts, the denominator is $1 - GH$.

## Moving blocks and pickoff points

The rules people misremember. In each case the requirement is that every signal leaving the region is unchanged.

| To do this | Do this |
| --- | --- |
| Move a block $G$ from *after* a summing junction to *before* it | insert a copy of $G$ in **every** input branch of that junction |
| Move a block $G$ from *before* a summing junction to *after* it | divide every **other** input branch by $G$ |
| Move a pickoff point from the *output* of $G$ to its *input* | insert $G$ in the branch that was picked off |
| Move a pickoff point from the *input* of $G$ to its *output* | insert $1/G$ in the branch that was picked off |
| Interchange two adjacent summing junctions | always allowed; addition commutes |

Check the first one on paper: if the junction forms $e = a - b$ and then $y = Ge$, moving $G$ upstream gives $y = Ga - Gb$, which is the same thing. Check the last pickoff rule: if the branch was taking $u$ and you move the pickoff to where the signal is $Gu$, you must undo the $G$, hence $1/G$.

::: warning
The factor $1/G$ that the rules produce is often improper (the inverse of a strictly proper block has more zeros than poles) and sometimes unstable (the inverse of a plant with a right-half-plane zero has a right-half-plane pole). It is a legitimate intermediate in the algebra, because it always cancels before you finish, but it must never be implemented and it must never be evaluated numerically as a standalone block. If you find yourself needing $1/G$ for more than one step, stop pushing blocks around and write the node equations instead.
:::

### The fallback that always works

Label every signal. Write one equation per summing junction and one per block. Eliminate. For a three-loop diagram this is a dozen lines of algebra with no geometry to get wrong, and it produces every transfer function of the diagram at once rather than one at a time. It is also what a symbolic algebra package does for you.

## Mason's gain formula

For a diagram with a single input and a single output, define:

- A **forward path** is a route from input to output that passes through no node more than once. Its **path gain** $P_k$ is the product of the block gains along it.
- A **loop** is a closed route that passes through no node more than once. Its **loop gain** $L_i$ is the product of the gains around it, **including the sign of the summing junction** — a negative-feedback loop has $L_i$ negative.
- Two loops are **non-touching** if they share no node.

Then the **determinant** of the diagram is

$$
\Delta = 1 - \sum_i L_i + \sum_{i,j\ \text{non-touching}} L_iL_j - \sum_{i,j,k\ \text{non-touching}} L_iL_jL_k + \cdots,
$$

and the transfer function is

$$
\frac{Y}{U} = \frac{1}{\Delta}\sum_k P_k\,\Delta_k,
$$

where $\Delta_k$ is $\Delta$ computed with every loop that touches path $k$ deleted.

Two observations make it usable. First, $\Delta = 0$ is the characteristic equation of the whole diagram, so the closed-loop poles come from $\Delta$ alone and are the same for every input-output pair — which is the structural fact behind everything in lessons 11 and 12. Second, for the single-loop case there is one forward path $G$ and one loop $L = -GH$, giving $\Delta = 1 + GH$ and $Y/U = G/(1 + GH)$: the feedback rule is a special case.

::: key
Mason's gain formula: $\dfrac{Y}{U} = \dfrac{1}{\Delta}\sum_k P_k\Delta_k$, with $\Delta = 1 - \sum L_i + \sum L_iL_j - \cdots$ over non-touching loop products, $P_k$ the forward path gains, and $\Delta_k$ the determinant of the part of the diagram that path $k$ does not touch. Loop gains carry the summing-junction signs. $\Delta = 0$ is the characteristic equation, shared by every transfer function of the diagram.
:::

::: example A three-loop launch-vehicle pitch chain, both ways
The architecture: an attitude-rate command goes to a **proportional controller** $C = K$; that drives a hydraulic **actuator** whose ram is an integrator $G_a = 250/s$ closed by its own unity LVDT position feedback $H_a = 1$; the nozzle drives the **vehicle**, torque to pitch rate, $G_v = \mu_\delta/s = 1.745/s$; and the rate is measured by a **force-rebalance gyro**, itself a closed-loop instrument with forward gain $G_g = 3000/s$ and unity rebalance feedback $H_g = 1$. The gyro output is compared with the rate command at the outermost junction.

**By Mason.** The forward path is $P_1 = C\,G_a\,G_v\,G_g$; it touches every node, so $\Delta_1 = 1$. Three loops:

$$
L_1 = -G_aH_a, \qquad L_2 = -G_gH_g, \qquad L_3 = -C\,G_a\,G_v\,G_g.
$$

$L_1$ lives entirely inside the actuator and $L_2$ entirely inside the gyro, so they share no node: **non-touching**. $L_3$ passes through both, so it touches each of them. Hence

$$
\Delta = 1 + G_aH_a + G_gH_g + C\,G_a\,G_v\,G_g + G_aH_aG_gH_g = \left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g,
$$

and

$$
\frac{Q_m}{Q_c} = \frac{C\,G_a\,G_v\,G_g}{\left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g}.
$$

**By algebra.** Collapse the actuator to $G_a/(1 + G_a) = 250/(s + 250)$ and the gyro to $G_g/(1 + G_g) = 3000/(s + 3000)$, cascade them with $C$ and $G_v$ to get the loop transfer function, then apply the feedback rule. The result is identical, as it must be — the algebra is doing the factorisation of $\Delta$ that Mason exposed.

**Numbers.** Substituting and clearing denominators,

$$
\frac{Q_m}{Q_c} = \frac{1.309\times10^6\,K}{s(s + 250)(s + 3000) + 1.309\times10^6\,K}.
$$

Choose $K$ for a rate-loop crossover near $10\,\mathrm{rad/s}$. At low frequency $\lvert L\rvert \approx 1.745K/\omega$, so $K = 10/1.745 = 5.731$. Then the characteristic polynomial is $s^3 + 3250s^2 + 7.5\times10^5s + 7.50\times10^6$, whose roots are

$$
s = -10.47, \quad -238.6, \quad -3000.9\ \mathrm{rad/s}.
$$

The dominant pole at $-10.47$ gives a $95.5\,\mathrm{ms}$ time constant against the $100\,\mathrm{ms}$ the idealised loop $10/(s + 10)$ would give — the actuator and gyro dynamics cost 5%. The margins: crossover at $9.99\,\mathrm{rad/s}$ with $\mathrm{PM} = 87.5^\circ$, and the phase reaches $-180^\circ$ at $\sqrt{250 \times 3000} = 866\,\mathrm{rad/s}$ where the gain is $50.2\,\mathrm{dB}$ down, so $\mathrm{GM} = 325$. This loop is very conservative, which is the correct choice for an inner rate loop that an attitude loop will be built on top of.

Evaluating all three expressions — Mason, successive algebra, and the cleared-denominator closed form — at an arbitrary $s = 1.3 + 0.7j$ gives $0.8810940679 - 0.0551709380j$ from each. That agreement check costs one line of code and is worth doing every time.
:::

::: example A two-degree-of-freedom attitude loop with feedforward
Now a diagram that block algebra handles more gracefully than Mason, because the interesting part is a single extra forward path. Attitude command $\theta_c$ goes two ways: through a proportional attitude gain $K_\theta$ into the rate command, and through a feedforward block $F$ straight to the actuator command. A rate gyro closes an inner loop with gain $K_q$. The vehicle is $\ddot{\theta} = \mu_\delta\delta$ with $\mu_\delta = 1.745\,\mathrm{s^{-2}}$, and the actuator is taken as ideal.

Write the node equations. With $P = \mu_\delta/s$ from nozzle angle to rate,

$$
\delta = K_\theta(\theta_c - \theta) - K_qq + F\theta_c, \qquad q = P\delta, \qquad \theta = \frac{q}{s}.
$$

Substitute $q = s\theta$ and eliminate $\delta$:

$$
s\theta\left(1 + PK_q\right) = P\left[(K_\theta + F)\theta_c - K_\theta\theta\right] \quad\Longrightarrow\quad \frac{\theta}{\theta_c} = \frac{P(K_\theta + F)}{s\left(1 + PK_q\right) + PK_\theta}.
$$

With $P = \mu_\delta/s$, multiply numerator and denominator by $s$:

$$
\frac{\theta}{\theta_c} = \frac{\mu_\delta\left(K_\theta + F\right)}{s^2 + \mu_\delta K_q\,s + \mu_\delta K_\theta}.
$$

Read it. The **denominator** is the standard second-order form of lesson 5 with $\omega_n = \sqrt{\mu_\delta K_\theta}$ and $2\zeta\omega_n = \mu_\delta K_q$: the attitude gain sets the frequency, the rate gain sets the damping, and that is the whole reason every attitude controller has a rate term. The **numerator** contains only the feedforward, so $F$ changes the command response without moving a single closed-loop pole. That separation is what "two degrees of freedom" means.

Design to $\omega_n = 1.0\,\mathrm{rad/s}$ and $\zeta = 0.7$: $K_\theta = \omega_n^2/\mu_\delta = 0.573$ and $K_q = 2\zeta\omega_n/\mu_\delta = 0.802$, giving $\theta/\theta_c = 1.745(0.573 + F)/(s^2 + 1.400s + 1.000)$. With $F = 0$ the DC gain is exactly 1, the overshoot is 4.6% and the 2% settling time is $4/(0.7) = 5.71\,\mathrm{s}$. Setting $F = 0.2$ multiplies the command response by 1.349 without touching the poles — useful for trimming out a known actuator dead band, dangerous if you forget that it also multiplies the actuator demand.

Mason gives the same answer: two forward paths ($K_\theta P/s$ and $FP/s$ to $\theta$), two loops ($-PK_q$ and $-K_\theta P/s$) which touch each other, so $\Delta = 1 + PK_q + K_\theta P/s$ and $\theta/\theta_c = (K_\theta + F)(P/s)/\Delta$. Multiply through by $s$ and it is the expression above. When the diagram has several forward paths and few loops, Mason is the quicker route; when it has several nested loops and one path, successive reduction is.
:::

::: note
Everything here assumes the blocks do not load each other — that connecting $G_2$ after $G_1$ does not change $G_1$. That is true for signals in a flight computer and for a sensor with high input impedance, and false for two mechanical or electrical stages coupled without a buffer. When loading matters, the honest description is a two-port or state-space model, and the block diagram must be built from those, not from the isolated transfer functions.
:::

## Check yourself

::: check
A forward path $G$ has unity negative feedback. A second block $H$ is then placed in the feedback path. Write both closed-loop transfer functions and say what changes about the poles and about the DC gain.
:::

::: answer
Unity feedback: $T_1 = G/(1 + G)$. With $H$: $T_2 = G/(1 + GH)$. The characteristic equations differ — $1 + G = 0$ against $1 + GH = 0$ — so the closed-loop poles move, which is the point of putting dynamics in the feedback path. The DC gains are $G(0)/(1 + G(0))$ and $G(0)/(1 + G(0)H(0))$. If $H(0) = 1$, a sensor with correct steady-state calibration, the DC gains match and $H$ has changed only the transient behaviour; if $H(0) \ne 1$ the loop tracks to $1/H(0)$ rather than to 1, because feedback makes the output follow the *sensor*, not the truth. A miscalibrated sensor gain is therefore a steady-state error that no amount of loop gain removes.
:::

::: check
On a diagram, a pickoff point sits at the input of a block $G(s) = 10/(s + 2)$ and feeds a feedback branch. Someone moves the pickoff to the output of $G$. What must be inserted, and why is this a bad idea here?
:::

::: answer
The branch must be multiplied by $1/G = (s + 2)/10$ to undo the block, so a factor $(s + 2)/10$ appears in the feedback branch. The algebra is correct, but $(s + 2)/10$ is improper: it is a differentiator plus a gain, with unbounded gain at high frequency. As an intermediate step in a reduction that ends with the factor cancelled, it is harmless. As something you keep, evaluate numerically, or hand to a simulation, it is wrong — it will amplify every bit of numerical or sensor noise in the branch. If the reduction cannot be completed without leaving the improper factor in place, abandon block-pushing and write the node equations.
:::

::: check
For the three-loop launch-vehicle example, write the transfer function from a *disturbance torque* injected at the vehicle input (that is, added to $\delta$) to the measured rate. Use Mason.
:::

::: answer
The loops and therefore $\Delta$ are unchanged — $\Delta$ belongs to the diagram, not to the input. What changes is the forward path. From the injection point (the vehicle input node) to the measured rate the path is $P_1 = G_vG_g$. Which loops does it touch? It passes through the vehicle and gyro nodes and the outer summing junction, so it touches $L_2$ (the gyro loop) and $L_3$ (the outer loop) but **not** $L_1$, which lives entirely inside the actuator. So $\Delta_1 = 1 - L_1 = 1 + G_aH_a$, and

$$
\frac{Q_m}{D} = \frac{G_vG_g\left(1 + G_aH_a\right)}{\left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g}.
$$

The denominator is the same as for the command response, confirming that the poles are a property of the loop and not of where you push on it. Getting several transfer functions out of one determinant like this is the main practical reason to learn Mason's formula.
:::

::: check
Two loops in a diagram are non-touching. Show that the determinant factorises, and explain what that means physically.
:::

::: answer
With exactly two loops, non-touching, $\Delta = 1 - (L_1 + L_2) + L_1L_2 = (1 - L_1)(1 - L_2)$. For negative feedback, $L_i = -G_iH_i$, so $\Delta = (1 + G_1H_1)(1 + G_2H_2)$: the characteristic polynomial of the pair is the product of the two individual characteristic polynomials. Physically, non-touching means the loops share no signal, so neither can influence the other and each keeps its own poles — exactly as in the worked example, where the actuator's internal loop and the gyro's internal rebalance loop are separate pieces of hardware. As soon as a third loop passes through both, the factorisation breaks and the poles of the whole assembly are no longer the union of the parts.
:::

::: check
In the two-degree-of-freedom loop, a colleague proposes raising $K_\theta$ to speed the response up. What happens to $\omega_n$, $\zeta$ and the overshoot, and what should be changed alongside it?
:::

::: answer
From $\omega_n = \sqrt{\mu_\delta K_\theta}$, doubling $K_\theta$ raises $\omega_n$ by $\sqrt2$, to $1.414\,\mathrm{rad/s}$. But $2\zeta\omega_n = \mu_\delta K_q$ is unchanged, so $\zeta$ falls by the same $\sqrt2$, from $0.700$ to $0.495$, and the overshoot rises from 4.6% to 16.7%. The settling time, governed by $\zeta\omega_n = \mu_\delta K_q/2$, does not improve at all — it is set by $K_q$ alone. To speed the loop up while keeping the damping, raise $K_q$ by $\sqrt2$ as well, so that both gains scale with $\omega_n^2$ and $\omega_n$ respectively. That coupled adjustment is the essence of gain scheduling: when $\mu_\delta$ changes through flight, both gains must move to hold $\omega_n$ and $\zeta$ fixed.
:::

## Summary

| Item | Statement |
| --- | --- |
| Series, parallel, feedback | $G_2G_1$; $G_1 + G_2$; $G/(1 + GH)$, forward over one plus loop gain |
| Block past a summing junction | moving it upstream: copy into every input; downstream: divide the other inputs by $G$ |
| Pickoff point | move to the block input: insert $G$; move to the block output: insert $1/G$ |
| Caution | $1/G$ may be improper or unstable; acceptable as an intermediate only |
| Node equations | one per junction and block, then eliminate; always works, yields every transfer function |
| Mason | $Y/U = \frac{1}{\Delta}\sum_kP_k\Delta_k$; $\Delta = 1 - \sum L_i + \sum_{\text{non-touching}}L_iL_j - \cdots$ |
| Loop gains | include the summing-junction signs; negative feedback gives $L < 0$ |
| Characteristic equation | $\Delta = 0$, shared by every input-output pair of the diagram |
| Non-touching loops | share no node; their determinant factorises, $(1 - L_1)(1 - L_2)$ |
| Rate-inside-attitude | $\theta/\theta_c = \mu_\delta(K_\theta + F)/\left(s^2 + \mu_\delta K_qs + \mu_\delta K_\theta\right)$; $K_\theta$ sets $\omega_n$, $K_q$ sets $\zeta$, $F$ sets the numerator only |

The next lesson takes the single most important object in this lesson — the loop gain $L$ — and separates what it means for the loop from what it means for the vehicle: open-loop against closed-loop transfer functions, and what feedback actually buys.
