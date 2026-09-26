---
id: l10-block-diagram-algebra-and-mason
title: Block diagram algebra, reduction and the Mason gain formula
minutes: 21
covers:
  - "Block diagram algebra, reduction, and the Mason gain formula"
---

Think of a subway map. It does not show how far apart the stations really are or how the tunnels curve. It shows only what connects to what, and that is exactly what you need to plan a trip. A **block diagram** is the same kind of map for a control system. Each box is a piece of the system, each arrow is a signal flowing from one piece to the next, and the map shows only how they connect.

A real flight control system is not one simple loop. A launch vehicle's pitch channel has an actuator — the hydraulic ram that swings the engine nozzle — with its own small position loop inside it. Around the vehicle there is a rate loop, closed by a gyro that may itself be a closed-loop instrument. An attitude loop wraps around that. A feedforward path carries the guidance command straight in, and filters sit in several of the branches. Before anyone can analyze that system, somebody has to turn the map into one transfer function — one ratio of polynomials. That somebody is you.

There are two ways to do it, and you should own both. **Block diagram algebra** shrinks the picture step by step. It is fast for simple layouts, and it builds intuition about what each loop does. **Mason's gain formula** reads the answer straight off the diagram in one pass, without redrawing anything. That is what you want when loops overlap, or when you need several transfer functions from the same diagram: command to output, disturbance to output, noise to actuator. A third way — write one equation per junction and solve — is the safest of all, and it is what you fall back on when the picture gets confusing.

This lesson gives the rules for shrinking a diagram, including the ones for moving blocks past junctions that people get backwards. Then it states Mason's formula precisely and works a three-loop launch-vehicle chain both ways, so you can watch them agree.

## Boxes, arrows, circles and dots

A block diagram has four kinds of part:

- **Blocks** — boxes, each holding a transfer function. The signal leaving a block is the block's transfer function times the signal entering it.
- **Signals** — the arrows. Each arrow carries one quantity, such as a nozzle angle or a pitch rate.
- **Summing junctions** — circles where signals add, each input marked with a $+$ or a $-$ sign.
- **Pickoff points** — dots where one signal is sent down several branches at once.

A pickoff **[[takes a copy|copies-not-water]]**; it does not divide the signal. If the pitch rate is $2\,^\circ/\mathrm{s}$ and a pickoff sends it to three places, all three get $2\,^\circ/\mathrm{s}$.

## The three basic rules

Everything else in this lesson reduces to three combinations. Module 8 met them; here they are again, with the reason for each.

**Series.** Two blocks one after the other multiply. Picture two stereo amplifiers in a row: if the first doubles the volume and the second triples it, together they multiply it by six. So $u \to G_1 \to G_2 \to y$ gives $y = G_2G_1u$.

**Parallel.** Two blocks fed by the same input, with their outputs added, add. Like two paychecks landing in the same bank account, the totals add: $y = (G_1 + G_2)u$.

**Feedback.** A block $G$ in the forward path, and a block $H$ that measures the output and sends it back to be subtracted at the input. This is the one to derive, because it is the heart of control.

Call the reference $r$, the error $e$, and the output $y$. Then the junction and the block say

$$
e = r - Hy, \qquad y = Ge.
$$

Put the first equation into the second: $y = G(r - Hy) = Gr - GHy$. Move the $y$ term to the left: $y + GHy = Gr$, so $y(1 + GH) = Gr$. Divide:

$$
\frac{y}{r} = \frac{G}{1 + GH}.
$$

| Connection | Equivalent |
| --- | --- |
| Series: $u \to G_1 \to G_2 \to y$ | $G_2G_1$ |
| Parallel: outputs of $G_1$ and $G_2$ summed | $G_1 + G_2$ |
| Negative feedback: forward $G$, feedback $H$ | $\dfrac{G}{1 + GH}$ |

The product $GH$ is the **[[loop gain|feedback-loop-picture]]** — what a signal gets multiplied by on one trip around the loop. So the feedback rule has a memory aid: **forward path over one plus the loop gain**. If the summing junction adds the fed-back signal instead of subtracting it, the same steps give a denominator of $1 - GH$.

## Moving blocks and pickoff points

Sometimes a diagram will not shrink with the three basic rules, because two loops are tangled together. The fix is to slide a block or a pickoff point to a new spot so the loops come apart. There is one requirement: every signal leaving the region you changed must be exactly the same as before.

| To do this | Do this |
| --- | --- |
| Move a block $G$ from *after* a summing junction to *before* it | insert a copy of $G$ in **every** input branch of that junction |
| Move a block $G$ from *before* a summing junction to *after* it | divide every **other** input branch by $G$ |
| Move a pickoff point from the *output* of $G$ to its *input* | insert $G$ in the branch that was picked off |
| Move a pickoff point from the *input* of $G$ to its *output* | insert $1/G$ in the branch that was picked off |
| Interchange two adjacent summing junctions | always allowed; addition commutes |

These are the rules people misremember, so check each one on paper rather than memorizing it. Take the first. If the junction forms $e = a - b$ and then $y = Ge$, moving $G$ [[upstream|moving-a-block]] into both branches gives $y = Ga - Gb$, which is the same thing. Now take the fourth. The branch used to take $u$. If you move the pickoff to where the signal is $Gu$, you must undo the $G$ — hence the $1/G$.

::: warning
The factor $1/G$ that these rules produce is often **[[improper|improper-blocks]]**. The inverse of a strictly proper block has more zeros than poles, so its gain grows without limit at high frequency. It is sometimes unstable too: the inverse of a plant with a right-half-plane zero has a right-half-plane pole. It is a legitimate step in the algebra, because it always cancels before you finish. But it must never be built into hardware or software, and it must never be evaluated numerically as a block standing on its own. If you find yourself carrying $1/G$ for more than one step, stop pushing blocks around and write the node equations instead.
:::

### The fallback that always works

Give every signal a name. Write one equation for each summing junction and one for each block. Then eliminate the in-between signals until only the input and output are left. For a three-loop diagram this is about a dozen lines of algebra with no geometry to get wrong. It also produces every transfer function of the diagram at once, instead of one at a time. It is exactly what a **[[symbolic algebra package|computer-algebra]]** does when you hand it the same equations.

## Mason's gain formula

Mason's formula is a recipe that reads the transfer function directly off the diagram. It needs three words, each about routes you can trace with a finger. Call each junction, pickoff point and block output a **node** — a point on the map.

- A **forward path** is a route from the input to the output that never visits the same node twice. Its **path gain** $P_k$ ("P sub k", the gain of path number $k$) is the product of the block gains along it.
- A **loop** is a route that comes back to where it started, again without visiting any node twice. Its **loop gain** $L_i$ ("L sub i") is the product of the gains around it, **including the sign of the summing junction**. A negative-feedback loop has a negative $L_i$.
- Two loops are **non-touching** if they share no node at all.

Then the **determinant** of the diagram, written $\Delta$ ("delta"), is

$$
\Delta = 1 - \sum_i L_i + \sum_{i,j\ \text{non-touching}} L_iL_j - \sum_{i,j,k\ \text{non-touching}} L_iL_jL_k + \cdots
$$

Read it as: start at $1$; subtract every loop gain; add the product of every pair of loops that do not touch; subtract the product of every three loops that do not touch each other; and so on, until there are no more non-touching sets. The transfer function is

$$
\frac{Y}{U} = \frac{1}{\Delta}\sum_k P_k\,\Delta_k,
$$

where $\Delta_k$ is $\Delta$ computed again with every loop that touches path $k$ deleted. If a path touches every loop, $\Delta_k = 1$.

Two facts make the formula useful.

First, setting $\Delta = 0$ gives the **characteristic equation** of the whole diagram. So the closed-loop poles come from $\Delta$ alone, and they are the same for every choice of input and output. That structural fact is what lessons 11 and 12 are built on.

Second, the single loop is a special case. With forward gain $G$ and feedback $H$, there is one forward path, $P_1 = G$, and one loop, $L_1 = -GH$ (negative, because the junction subtracts). So $\Delta = 1 - (-GH) = 1 + GH$. The path touches the loop, so $\Delta_1 = 1$. And $Y/U = G/(1 + GH)$ — the feedback rule again.

::: key
Mason's gain formula: $\dfrac{Y}{U} = \dfrac{1}{\Delta}\sum_k P_k\Delta_k$, with $\Delta = 1 - \sum L_i + \sum L_iL_j - \cdots$ over non-touching loop products, $P_k$ the forward path gains, and $\Delta_k$ the determinant of the part of the diagram that path $k$ does not touch. Loop gains carry the summing-junction signs. $\Delta = 0$ is the characteristic equation, shared by every transfer function of the diagram.
:::

::: note Why two non-touching loops multiply
Suppose a diagram has two loops that share no node. Neither loop's signal ever passes through the other, so each loop behaves as if the other were not there. Each on its own would give a factor $1 - L_i$ in the denominator. Multiplying the two factors out gives $(1 - L_1)(1 - L_2) = 1 - L_1 - L_2 + L_1L_2$ — the first terms of Mason's $\Delta$, including the $+L_1L_2$ for the non-touching pair. Loops that do touch cannot be separated this way, so they never get a product term. That is the whole logic of the alternating signs; Mason's contribution was proving it holds for any diagram, however tangled.
:::

::: example A three-loop launch-vehicle pitch chain, both ways
Here is the chain, in the order the signal flows:

- An attitude-rate command goes to a **proportional controller** $C = K$ — a plain gain.
- That drives a hydraulic **actuator**. Its ram is an integrator, $G_a = 250/s$, closed by its own unity **[[LVDT|lvdt]]** position feedback $H_a = 1$.
- The nozzle drives the **vehicle**, from nozzle angle to pitch rate: $G_v = \mu_\delta/s = 1.745/s$.
- The rate is measured by a **[[force-rebalance gyro|rebalance-gyro]]**, itself a closed-loop instrument with forward gain $G_g = 3000/s$ and unity rebalance feedback $H_g = 1$.
- The gyro output is compared with the rate command at the outermost junction.

**By Mason.** There is one forward path, $P_1 = C\,G_a\,G_v\,G_g$. It runs through every node, so it touches every loop and $\Delta_1 = 1$. There are **[[three loops|three-loop-map]]**:

$$
L_1 = -G_aH_a, \qquad L_2 = -G_gH_g, \qquad L_3 = -C\,G_a\,G_v\,G_g.
$$

$L_1$ lives entirely inside the actuator, and $L_2$ entirely inside the gyro. They share no node, so they are **non-touching**. $L_3$ passes through both, so it touches each of them. The only non-touching pair is $L_1L_2$. So

$$
\Delta = 1 + G_aH_a + G_gH_g + C\,G_a\,G_v\,G_g + G_aH_aG_gH_g = \left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g,
$$

and the command-to-measured-rate transfer function is

$$
\frac{Q_m}{Q_c} = \frac{C\,G_a\,G_v\,G_g}{\left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g}.
$$

**By algebra.** Collapse the actuator loop with the feedback rule: $G_a/(1 + G_a) = 250/(s + 250)$. Collapse the gyro loop the same way: $G_g/(1 + G_g) = 3000/(s + 3000)$. Put them in series with $C$ and $G_v$ to get the loop transfer function, then apply the feedback rule once more. The result is identical, as it must be. The algebra is doing, step by step, the factoring of $\Delta$ that Mason showed in one line.

**Numbers.** Substitute the blocks and clear the fractions. The forward product is $K \cdot 250 \cdot 1.745 \cdot 3000 = 1.309\times10^6\,K$ over $s^3$, so

$$
\frac{Q_m}{Q_c} = \frac{1.309\times10^6\,K}{s(s + 250)(s + 3000) + 1.309\times10^6\,K}.
$$

Choose $K$ for a rate-loop crossover near $10\,\mathrm{rad/s}$. At low frequency the actuator and gyro factors are close to $1$, so $\lvert L\rvert \approx 1.745K/\omega$. Setting that equal to $1$ at $\omega = 10$ gives $K = 10/1.745 = 5.731$. The characteristic polynomial becomes $s^3 + 3250s^2 + 7.5\times10^5s + 7.50\times10^6$, whose roots are

$$
s = -10.47, \quad -238.6, \quad -3000.9\ \mathrm{rad/s}.
$$

The dominant pole at $-10.47$ gives a time constant of $1/10.47 = 95.5\,\mathrm{ms}$. The idealized loop $10/(s + 10)$ would give $100\,\mathrm{ms}$, so the actuator and gyro dynamics shift it by about 5%.

The margins: crossover lands at $9.99\,\mathrm{rad/s}$ with a phase margin of $87.5^\circ$. The phase reaches $-180^\circ$ at $\sqrt{250 \times 3000} = 866\,\mathrm{rad/s}$, where the gain is $50.2\,\mathrm{dB}$ below $1$, so the gain margin is a factor of $325$. This loop is very conservative. That is the right choice for an inner rate loop that an attitude loop will be built on top of.

**Sanity check.** Evaluate all three expressions — Mason, step-by-step algebra, and the cleared-fraction form — at an arbitrary point, $s = 1.3 + 0.7j$. Each gives $0.8810940679 - 0.0551709380j$. That check costs one line of code and is worth doing every time.
:::

::: example A two-degree-of-freedom attitude loop with feedforward
Now a diagram where the node equations are the quickest route, because the interesting part is one extra forward path.

The attitude command $\theta_c$ ("theta sub c") goes two ways. One way is through a proportional attitude gain $K_\theta$, which forms part of the nozzle command. The other is through a **[[feedforward|feedforward-2dof]]** block $F$, straight to the nozzle command. A rate gyro closes an inner loop with gain $K_q$ on the pitch rate $q$. The vehicle is $\ddot{\theta} = \mu_\delta\delta$, with $\mu_\delta = 1.745\,\mathrm{s^{-2}}$ and $\delta$ the nozzle angle. Take the actuator as ideal.

Write the node equations. With $P = \mu_\delta/s$ from nozzle angle to rate,

$$
\delta = K_\theta(\theta_c - \theta) - K_qq + F\theta_c, \qquad q = P\delta, \qquad \theta = \frac{q}{s}.
$$

The last equation says $q = s\theta$. Put that into the middle one, and put the first into it for $\delta$. Collect the $\theta$ terms on the left:

$$
s\theta\left(1 + PK_q\right) = P\left[(K_\theta + F)\theta_c - K_\theta\theta\right] \quad\Longrightarrow\quad \frac{\theta}{\theta_c} = \frac{P(K_\theta + F)}{s\left(1 + PK_q\right) + PK_\theta}.
$$

Now put in $P = \mu_\delta/s$ and multiply the top and bottom by $s$:

$$
\frac{\theta}{\theta_c} = \frac{\mu_\delta\left(K_\theta + F\right)}{s^2 + \mu_\delta K_q\,s + \mu_\delta K_\theta}.
$$

Read it. The **denominator** is the standard second-order form of lesson 5, with $\omega_n = \sqrt{\mu_\delta K_\theta}$ and $2\zeta\omega_n = \mu_\delta K_q$. The attitude gain sets the frequency. The rate gain sets the damping. That is the whole reason every attitude controller has a rate term. The **numerator** is the only place $F$ appears, so $F$ changes the command response without moving a single closed-loop pole. That separation is what "two degrees of freedom" means.

**Design.** Aim for $\omega_n = 1.0\,\mathrm{rad/s}$ and $\zeta = 0.7$:

$$
K_\theta = \frac{\omega_n^2}{\mu_\delta} = \frac{1}{1.745} = 0.573, \qquad K_q = \frac{2\zeta\omega_n}{\mu_\delta} = \frac{1.4}{1.745} = 0.802,
$$

giving $\theta/\theta_c = 1.745(0.573 + F)/(s^2 + 1.400s + 1.000)$. With $F = 0$ the DC gain is $1.745 \times 0.573 = 1.000$ — exactly one, as a pointing loop should be. The overshoot is 4.6%, and the 2% settling time is $4/(\zeta\omega_n) = 4/0.7 = 5.71\,\mathrm{s}$.

Setting $F = 0.2$ multiplies the command response by $(0.573 + 0.2)/0.573 = 1.349$ without touching the poles. That can be useful for trimming out a known actuator dead band. It is dangerous if you forget that it also multiplies the nozzle demand.

**By Mason, as a check.** Two forward paths: $K_\theta P/s$ and $FP/s$ to $\theta$. Two loops: $-PK_q$ (the rate loop) and $-K_\theta P/s$ (the attitude loop). The loops touch each other at the nozzle command, so $\Delta = 1 + PK_q + K_\theta P/s$, and both paths touch both loops. So $\theta/\theta_c = (K_\theta + F)(P/s)/\Delta$. Multiply the top and bottom by $s$ and it is the expression above.

When a diagram has several forward paths and few loops, Mason is the quicker route. When it has several nested loops and one path, step-by-step reduction is.
:::

::: note When the boxes change each other
Everything in this lesson assumes the blocks do not **[[load|loading]]** each other — that connecting $G_2$ after $G_1$ does not change $G_1$. That is true for numbers passed between routines in a flight computer, and for a sensor that draws almost no power from what it measures. It is false for two mechanical or electrical stages coupled without a buffer between them. When loading matters, the honest description is a two-port or state-space model, and the block diagram must be built from those, not from transfer functions measured with each stage on its own.
:::

## Check yourself

::: check
A forward path $G$ has unity negative feedback. A second block $H$ is then placed in the feedback path. Write both closed-loop transfer functions and say what changes about the poles and about the DC gain.
:::

::: answer
With unity feedback, $T_1 = G/(1 + G)$. With $H$, $T_2 = G/(1 + GH)$.

**Poles.** The characteristic equations differ — $1 + G = 0$ against $1 + GH = 0$ — so the closed-loop poles move. That is the point of putting dynamics in the feedback path.

**DC gain.** Put $s = 0$: the DC gains are $G(0)/(1 + G(0))$ and $G(0)/(1 + G(0)H(0))$. If $H(0) = 1$ — a sensor with correct steady-state calibration — the DC gains match, and $H$ has changed only the transient. If $H(0) \ne 1$, the loop tracks toward $1/H(0)$ instead of $1$, because feedback makes the output follow the *sensor*, not the truth. So a miscalibrated sensor gain is a steady-state error that no amount of loop gain removes.
:::

::: check
On a diagram, a pickoff point sits at the input of a block $G(s) = 10/(s + 2)$ and feeds a feedback branch. Someone moves the pickoff to the output of $G$. What must be inserted, and why is this a bad idea here?
:::

::: answer
The branch must be multiplied by $1/G = (s + 2)/10$ to undo the block, so a factor $(s + 2)/10$ appears in the feedback branch.

The algebra is correct, but $(s + 2)/10$ is improper. It is a differentiator ($s/10$) plus a gain ($0.2$), and its gain grows without limit at high frequency. As a middle step in a reduction that ends with the factor cancelled, it is harmless. As something you keep, evaluate numerically, or hand to a simulation, it is wrong: it will amplify every bit of numerical or sensor noise in that branch. If the reduction cannot be finished without leaving the improper factor in place, stop pushing blocks and write the node equations.
:::

::: check
For the three-loop launch-vehicle example, write the transfer function from a *disturbance* injected at the vehicle input — added to $\delta$, expressed as an equivalent nozzle angle — to the measured rate. Use Mason.
:::

::: answer
The loops, and therefore $\Delta$, are unchanged: $\Delta$ belongs to the diagram, not to the input. What changes is the forward path. From the injection point to the measured rate, the path runs through the vehicle and the gyro: $P_1 = G_vG_g$.

Which loops does it touch? It passes through the vehicle and gyro nodes, so it touches $L_2$ (the gyro loop) and $L_3$ (the outer loop, which runs through the vehicle). It does **not** touch $L_1$, which lives entirely inside the actuator, upstream of the injection point. So $\Delta_1$ keeps only $L_1$: $\Delta_1 = 1 - L_1 = 1 + G_aH_a$, and

$$
\frac{Q_m}{D} = \frac{G_vG_g\left(1 + G_aH_a\right)}{\left(1 + G_aH_a\right)\left(1 + G_gH_g\right) + C\,G_a\,G_v\,G_g}.
$$

The denominator is the same as for the command response. That confirms the poles belong to the loop, not to where you push on it. Getting several transfer functions out of one determinant like this is the main practical reason to learn Mason's formula.
:::

::: check
Two loops in a diagram are non-touching. Show that the determinant factors, and explain what that means physically.
:::

::: answer
With exactly two loops, not touching, Mason gives $\Delta = 1 - (L_1 + L_2) + L_1L_2$. That multiplies out from $(1 - L_1)(1 - L_2)$, so $\Delta = (1 - L_1)(1 - L_2)$.

For negative feedback, $L_i = -G_iH_i$, so $\Delta = (1 + G_1H_1)(1 + G_2H_2)$. The characteristic polynomial of the pair is the product of the two loops' own characteristic polynomials.

Physically, non-touching means the loops share no signal, so neither can influence the other and each keeps its own poles. That is exactly the worked example: the actuator's internal loop and the gyro's rebalance loop are separate pieces of hardware. As soon as a third loop passes through both, the factoring breaks, and the poles of the whole assembly are no longer the poles of the parts put together.
:::

::: check
In the two-degree-of-freedom loop, a colleague proposes doubling $K_\theta$ to speed the response up. What happens to $\omega_n$, $\zeta$ and the overshoot, and what should be changed alongside it?
:::

::: answer
From $\omega_n = \sqrt{\mu_\delta K_\theta}$, doubling $K_\theta$ multiplies $\omega_n$ by $\sqrt2$, to $1.414\,\mathrm{rad/s}$.

But $2\zeta\omega_n = \mu_\delta K_q$ has not changed, so $\zeta$ falls by the same $\sqrt2$: from $0.700$ to $0.495$. The overshoot rises from 4.6% to 16.7%.

The settling time does not improve at all. It is governed by $\zeta\omega_n = \mu_\delta K_q/2$, which depends on $K_q$ alone.

To speed the loop up while keeping the damping, raise $K_q$ by $\sqrt2$ as well. Then $K_\theta$ scales with $\omega_n^2$ and $K_q$ with $\omega_n$, and $\zeta$ stays put. That coupled adjustment is the essence of gain scheduling: as $\mu_\delta$ changes through flight, both gains must move to hold $\omega_n$ and $\zeta$ fixed.
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
| Non-touching loops | share no node; their determinant factors, $(1 - L_1)(1 - L_2)$ |
| Rate-inside-attitude | $\theta/\theta_c = \mu_\delta(K_\theta + F)/\left(s^2 + \mu_\delta K_qs + \mu_\delta K_\theta\right)$; $K_\theta$ sets $\omega_n$, $K_q$ sets $\zeta$, $F$ sets the numerator only |

The next lesson takes the most important object in this one — the loop gain $L$ — and separates what it means for the loop from what it means for the vehicle: open-loop against closed-loop transfer functions, and what feedback actually buys.

::: context copies-not-water Signals are copies, not water
If you split a garden hose three ways, each branch gets a third of the water. Signals do not work like that. A signal is *information* — a number — and telling the same number to three listeners does not use it up. Read a thermometer aloud to three friends and each of them hears the whole temperature.

In a flight computer this is literally true: a pickoff is the same variable read by three routines. In analog electronics it is true when each listener draws almost no current, which designers arrange on purpose. When that fails, the blocks "load" each other, and the note at the end of the examples explains what then goes wrong.
:::

::: context feedback-loop-picture The loop behind the feedback rule
Follow a signal around the loop. It leaves the junction as the error $e$, gets multiplied by $G$ to become the output $y$, then by $H$ on its way back, and is subtracted at the junction. One trip multiplies it by $GH$ and flips its sign. That product is the loop gain.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="50" x2="56" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="58,50 48,45 48,55" fill="#1f2a44"/>
  <text x="18" y="40" font-size="13" fill="#1f2a44">r</text>
  <circle cx="70" cy="50" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="50" y="42" font-size="12" fill="#1f2a44">+</text>
  <text x="76" y="80" font-size="14" fill="#b4232c">−</text>
  <line x1="82" y1="50" x2="138" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="140,50 130,45 130,55" fill="#1f2a44"/>
  <text x="104" y="40" font-size="13" fill="#1f2a44">e</text>
  <rect x="140" y="32" width="60" height="36" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="170" y="55" font-size="14" text-anchor="middle" fill="#1f2a44">G</text>
  <line x1="200" y1="50" x2="336" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="346,50 334,44 334,56" fill="#1f2a44"/>
  <text x="330" y="40" font-size="13" fill="#1f2a44">y</text>
  <circle cx="270" cy="50" r="4" fill="#1f2a44"/>
  <polyline points="270,50 270,115 202,115" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="200,115 210,110 210,120" fill="#1f2a44"/>
  <rect x="140" y="97" width="60" height="36" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="170" y="120" font-size="14" text-anchor="middle" fill="#1f2a44">H</text>
  <polyline points="140,115 70,115 70,64" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="70,62 65,72 75,72" fill="#1f2a44"/>
  <text x="278" y="88" font-size="12" fill="#1f2a44">pickoff:</text>
  <text x="278" y="103" font-size="12" fill="#1f2a44">a copy of y</text>
  <text x="222" y="142" font-size="12" fill="#1f2a44">y / r = G / (1 + GH)</text>
</svg>
```
:::

::: context moving-a-block Sliding a block upstream
Moving $G$ from after the junction to before it means putting a copy of $G$ in *both* input branches. Both diagrams give the same output, $y = Ga - Gb$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 182" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#6c7a93">before</text>
  <line x1="14" y1="45" x2="66" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="68,45 58,40 58,50" fill="#1f2a44"/>
  <text x="18" y="38" font-size="13" fill="#1f2a44">a</text>
  <circle cx="80" cy="45" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="80" y1="75" x2="80" y2="59" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="80,57 75,67 85,67" fill="#1f2a44"/>
  <text x="88" y="78" font-size="13" fill="#1f2a44">b  (−)</text>
  <line x1="92" y1="45" x2="138" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="140,45 130,40 130,50" fill="#1f2a44"/>
  <rect x="140" y="28" width="50" height="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="165" y="50" font-size="14" text-anchor="middle" fill="#1f2a44">G</text>
  <line x1="190" y1="45" x2="236" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="244,45 234,40 234,50" fill="#1f2a44"/>
  <text x="252" y="50" font-size="13" fill="#1f2a44">y</text>
  <text x="10" y="100" font-size="12" fill="#6c7a93">after</text>
  <line x1="14" y1="125" x2="38" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <text x="18" y="118" font-size="13" fill="#1f2a44">a</text>
  <rect x="40" y="110" width="40" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="130" font-size="13" text-anchor="middle" fill="#1f2a44">G</text>
  <line x1="80" y1="125" x2="166" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="168,125 158,120 158,130" fill="#1f2a44"/>
  <circle cx="180" cy="125" r="12" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="14" y1="160" x2="38" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <text x="18" y="153" font-size="13" fill="#1f2a44">b</text>
  <rect x="40" y="147" width="40" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="165" font-size="13" text-anchor="middle" fill="#1f2a44">G</text>
  <polyline points="80,160 180,160 180,139" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,137 175,147 185,147" fill="#1f2a44"/>
  <text x="188" y="156" font-size="13" fill="#1f2a44">(−)</text>
  <line x1="192" y1="125" x2="236" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="244,125 234,120 234,130" fill="#1f2a44"/>
  <text x="252" y="130" font-size="13" fill="#1f2a44">y</text>
  <text x="286" y="92" font-size="12" text-anchor="middle" fill="#1d6fd1">same y</text>
</svg>
```
:::

::: context improper-blocks What "improper" means
A transfer function is **proper** when its denominator's degree is at least its numerator's, and **strictly proper** when it is higher. Every real physical device is proper: at high enough frequency its response fades or levels off, because nothing moves infinitely fast.

An **improper** block, with more zeros than poles, has a gain that keeps climbing as frequency rises. The simplest one is $s$, a pure differentiator: its gain at frequency $\omega$ is $\omega$. Feed it tiny, fast sensor noise and it hands back enormous output. That is why $1/G$ may appear on paper but never in flight software.
:::

::: context computer-algebra Letting the computer do the elimination
Engineers rarely reduce a large diagram by hand today. They type the node equations into a symbolic tool — the free Python library SymPy, or the symbolic toolboxes of MATLAB and Mathematica — and let it eliminate the in-between signals. Numerical tools can also connect blocks directly; MATLAB's `feedback` and `connect` commands are two examples.

The hand methods still matter. They are how you check that the computer's answer is sensible, and how you see *why* a gain or a filter moved a pole.
:::

::: context lvdt What an LVDT is
An LVDT — linear variable differential transformer — is a position sensor. A metal core slides inside a set of coils. An alternating current in one coil induces voltages in two others, and how those voltages differ tells you exactly where the core sits. Nothing rubs, so it lasts a long time and reads very finely.

Hydraulic actuators that gimbal rocket engines often carry one on the ram, so the actuator's own electronics can close a tight position loop before the flight computer ever sees it. That internal loop is $L_1$ in the example.
:::

::: context rebalance-gyro A gyro that is itself a loop
In a force-rebalance (or torque-rebalance) gyro, the sensing element is not allowed to drift far from its center. When the vehicle rotates, the element starts to move. A small electric motor inside the gyro pushes it straight back. The push needed to hold it centered is proportional to the rotation rate, so that push *is* the measurement.

Holding the element near its center keeps it where the sensor is most accurate and most linear. The price is that the gyro contains a feedback loop of its own, with its own dynamics — the $G_g/(1 + G_gH_g)$ in the example.
:::

::: context three-loop-map Finding the three loops
Trace each loop with a finger. The blue loop stays inside the actuator, the orange loop stays inside the gyro, and the red outer loop runs through everything. Blue and orange never share a node, so they are non-touching and their product appears in $\Delta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="4" y1="50" x2="22" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="50" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="38" y1="50" x2="46" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="46" y="36" width="28" height="28" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="74" y1="50" x2="88" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="96" cy="50" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="104" y1="50" x2="112" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="112" y="36" width="32" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="128" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">Ga</text>
  <line x1="144" y1="50" x2="170" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="156" cy="50" r="3" fill="#1f2a44"/>
  <rect x="170" y="36" width="32" height="28" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="186" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">Gv</text>
  <line x1="202" y1="50" x2="216" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="224" cy="50" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="232" y1="50" x2="240" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="240" y="36" width="32" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="256" y="55" font-size="13" text-anchor="middle" fill="#1f2a44">Gg</text>
  <line x1="272" y1="50" x2="344" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="354,50 342,44 342,56" fill="#1f2a44"/>
  <text x="330" y="40" font-size="12" fill="#1f2a44">Qm</text>
  <circle cx="286" cy="50" r="3" fill="#1f2a44"/>
  <circle cx="306" cy="50" r="3" fill="#1f2a44"/>
  <polyline points="156,50 156,82 96,82 96,58" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="286,50 286,82 224,82 224,58" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <polyline points="306,50 306,118 30,118 30,58" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="126" y="98" font-size="11" text-anchor="middle" fill="#1d6fd1">L1 actuator</text>
  <text x="255" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">L2 gyro</text>
  <text x="168" y="136" font-size="11" text-anchor="middle" fill="#b4232c">L3 outer loop, through everything</text>
  <text x="168" y="154" font-size="11" text-anchor="middle" fill="#1f2a44">every circle subtracts the signal from below</text>
</svg>
```
:::

::: context feedforward-2dof Feedforward: acting before the error appears
Feedback waits for an error, then reacts. **Feedforward** uses the command itself, before any error exists. A cyclist who sees a hill ahead and starts pedaling harder before slowing down is using feedforward.

In the example, $F$ never sees the measured attitude, so it cannot move the closed-loop poles — only the loop's gains can. That is the freedom: the feedback gains decide how the vehicle fights disturbances, and $F$ separately shapes how it answers commands. Two independent knobs are what "two degrees of freedom" names.
:::

::: context loading Loading, with a flashlight
Hook a small flashlight bulb to a battery and it glows brightly. Hook up ten bulbs to the same small battery and each glows dimmer: the battery's output changed because of what you connected to it. That is **loading**. The battery's "transfer function" measured alone no longer describes it once it is connected.

Engineers avoid this with a buffer — an amplifier that listens without drawing power — or by passing signals as numbers inside a computer, where one routine reading a value cannot change it.
:::
