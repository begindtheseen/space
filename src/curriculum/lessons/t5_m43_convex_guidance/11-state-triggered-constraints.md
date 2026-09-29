---
id: l11-state-triggered-constraints
title: State-triggered constraints
minutes: 21
covers:
  - State-triggered constraints for logic in the loop, and compound STCs
---

Think of a school rule: "If it is raining, you must wear a coat." On a sunny day the rule says nothing. You can wear a coat or not. On a rainy day it says one thing: coat on. The rule has a **condition** (raining) and a **requirement** (coat), and the requirement only counts when the condition is true.

Real vehicles fly with rules like that. Keep the angle of attack small, but only while the air is pushing hard on the vehicle. Keep the engine plume off the landing pad's instruments, but only in the last few hundred meters. Lesson 1 listed these **logic-triggered constraints** as the fourth non-convexity of powered descent and set them aside. They had to wait, because the fix needs the successive-convexification loop that lessons 7 to 10 built.

Lossless convexification and the log-mass substitution were exact, one-shot rewrites. Logic has no such trick. Instead, a **state-triggered constraint** — an "if–then" rule written as one continuous inequality — turns the rule into a formula that is not convex. It is then handed to SCvx the same way lessons 7 to 10 handed it a rotation matrix or a free final time: something to linearize about a reference and improve, not something to relax once and trust forever.

## Why "if–then" is not convex

Take the angle-of-attack rule. The **[[angle of attack|angle-of-attack]]** $\alpha$ ("alpha") is the angle between the vehicle's nose and the oncoming air. The **[[dynamic pressure|dynamic-pressure]]** $q$ is how hard the air is pushing, in pascals. The rule: if $q > 15{,}000\,\mathrm{Pa}$, then $|\alpha| \le 8°$.

::: warning Yet another alpha, and a q that is not a quaternion
In this lesson $\alpha$ is the angle of attack — not the mass-flow constant $1/(I_{sp}g_0)$ of lesson 3, and not the commanded angular acceleration $\boldsymbol{\alpha}_{\text{cmd}}$ of lesson 10. And a plain italic $q$ is dynamic pressure, while the bold $\mathbf{q}$ of lesson 10 is the attitude quaternion. Aerodynamics owns these letters, so they stay; read the context.
:::

Now picture every allowed pair $(q, \alpha)$ on a flat chart. The rule allows two regions: everything with $q \le 15{,}000$ (the condition is off, so anything goes), and everything with $|\alpha| \le 8°$ (the requirement is met). The allowed set is the **union** — the "or" — of those two. Each region alone is convex. Their union is an L-shape, and an L-shape is not convex.

Check it with two points. The pair $(14{,}000\,\mathrm{Pa},\ 25°)$ is allowed, because the condition is off. The pair $(20{,}000\,\mathrm{Pa},\ 5°)$ is allowed, because the angle is small. Their midpoint is $(17{,}000\,\mathrm{Pa},\ 15°)$. There the condition is on and $15° > 8°$, so the midpoint breaks the rule. Two allowed points with a forbidden point between them: that is exactly what "not convex" means (see the **[[picture of the L-shape|l-shape]]**).

The textbook way to write "if–then" is with an on/off switch variable that can only be $0$ or $1$. That makes the problem a **[[mixed-integer|mixed-integer]]** program, and it throws away every guarantee this module has built on convexity. The rest of this lesson avoids integer variables entirely.

## From "if–then" to one inequality

Write the condition as a **trigger function** $g(\mathbf{x})$ of the state $\mathbf{x}$, with the convention that the trigger is **active** when $g(\mathbf{x}) < 0$. Write the requirement as $c(\mathbf{x}) \le 0$.

Logic gives the shape of the fix. "$g < 0$ implies $c \le 0$" says the same thing as "$g \ge 0$ **or** $c \le 0$": either the trigger is off, or the requirement holds. One formula that is $\le 0$ exactly on that union is

$$
\psi(\mathbf{x}) = \max\big(0,\,-g(\mathbf{x})\big)\cdot c(\mathbf{x}) \;\le\; 0.
$$

Read $\psi$ as "psi". The factor $\max(0, -g)$ is called the **[[negative part|negative-part]]** of $g$: it is zero when $g$ is zero or positive, and equals $-g$ (a positive number) when $g$ is negative. Some papers write it $-\min(g, 0)$; it is the same thing.

Now check both cases, one step at a time.

**Trigger off**, $g(\mathbf{x}) \ge 0$. Then $-g \le 0$, so $\max(0, -g) = 0$. So $\psi = 0 \cdot c = 0$, whatever $c$ is. And $0 \le 0$ holds. No requirement applies — exactly the sunny day.

**Trigger on**, $g(\mathbf{x}) < 0$. Then $-g > 0$, so $\max(0, -g) = -g$, a positive number. So $\psi \le 0$ reads $(-g)\cdot c \le 0$. Divide both sides by the positive number $-g$; dividing by a positive number does not flip an inequality. That leaves $c(\mathbf{x}) \le 0$. The requirement is enforced — the rainy day.

One inequality, no case-splitting inside the solver, and no integer variable anywhere. $\psi(\mathbf{x}) \le 0$ is a statement about ordinary real-valued functions, which is exactly what SCvx's linearize-and-solve loop knows how to eat.

::: key State-triggered constraint
A continuous encoding of "if $g(\mathbf{x}) < 0$ then enforce $c(\mathbf{x}) \le 0$", written so no integer variable is needed:

$$
\psi(\mathbf{x}) = \max(0,-g(\mathbf{x}))\cdot c(\mathbf{x}) \le 0.
$$

It keeps conditional logic inside a continuous optimization. Example: enforce an angle-of-attack limit only while dynamic pressure exceeds a threshold. $\psi$ is continuous, not convex, and not smooth at $g(\mathbf{x}) = 0$; SCvx handles it by linearizing about a reference, like every other nonlinearity since lesson 7.
:::

::: example An angle-of-attack limit that only applies at high dynamic pressure
Trigger: $g(\mathbf{x}) = q_{\text{thresh}} - q(\mathbf{x})$ with $q_{\text{thresh}} = 15{,}000\,\mathrm{Pa}$. It is negative, so active, once $q$ climbs past the threshold. Requirement: $c(\mathbf{x}) = |\alpha| - \alpha_{\max}$ with $\alpha_{\max} = 8°$.

| $q\,(\mathrm{Pa})$ | $\alpha$ | trigger on? | $g$ | $c$ | $\psi = \max(0,-g)\cdot c$ | satisfied? |
| --- | --- | --- | --- | --- | --- | --- |
| $20{,}000$ | $5°$ | yes | $-5000$ | $-3$ | $-15{,}000$ | yes |
| $20{,}000$ | $12°$ | yes | $-5000$ | $+4$ | $+20{,}000$ | **no** |
| $8{,}000$ | $25°$ | no | $+7000$ | $+17$ | $0$ | yes |

**Row 1.** $g = 15{,}000 - 20{,}000 = -5000$, so the trigger is on and the factor is $5000$. $c = 5 - 8 = -3$. So $\psi = 5000 \times (-3) = -15{,}000$, comfortably negative.

**Row 2.** Same pressure, but $c = 12 - 8 = +4$. So $\psi = 5000 \times 4 = +20{,}000$, positive: a real violation, correctly caught.

**Row 3.** $g = 15{,}000 - 8000 = +7000$, so the trigger is off and the factor is $0$. Even though $25°$ is far over the $8°$ cap, $\psi = 0$ exactly. The limit does not apply, as the rule intended.

**Sanity check.** One formula, three cases, and each comes out the way the sentence "if the pressure is high, keep the angle small" says it should. (The units of $\psi$ are pascal-degrees, which mean nothing on their own. Only the sign of $\psi$ matters.)
:::

## Linearizing across the kink

$\psi$ is continuous, but it is not smooth. The factor $\max(0, -g)$ has a sharp corner — a **[[kink|kink]]** — exactly where $g(\mathbf{x}) = 0$. And $\psi$ is a product of two functions, so it is not convex even where $g$ and $c$ each are.

Neither is a problem for SCvx, most of the time. Away from the switching surface $g = 0$, the factor is locally either $0$ or $-g$, depending on which side the reference sits. So $\psi$ is locally smooth there and linearizes like anything else lessons 7 to 10 handled. Two cases show what that looks like.

::: example Linearizing the angle-of-attack constraint
**Reference with the trigger on.** Take $\bar q = 20{,}000\,\mathrm{Pa}$ and $\bar\alpha = 12°$ (the bar means "at the reference"). Near here, $\psi = (q - 15{,}000)(\alpha - 8)$ for positive $\alpha$.

- Its value is $\bar\psi = 5000 \times 4 = 20{,}000$.
- Its slope in $q$ is the other factor, $\bar\alpha - 8 = 4$ per pascal.
- Its slope in $\alpha$ is $\bar q - 15{,}000 = 5000$ per degree.

The linearized constraint is

$$
20{,}000 + 4\,(q - 20{,}000) + 5000\,(\alpha - 12) \le 0.
$$

Hold $q$ at $20{,}000$: then $5000(\alpha - 12) \le -20{,}000$, so $\alpha \le 12 - 4 = 8°$. Hold $\alpha$ at $12°$: then $4(q - 20{,}000) \le -20{,}000$, so $q \le 20{,}000 - 5000 = 15{,}000\,\mathrm{Pa}$. The linear model offers the two honest fixes: bring the angle down to the limit, or bring the pressure down until the trigger switches off.

**Reference with the trigger off.** Now take $\bar q = 14{,}000\,\mathrm{Pa}$ and $\bar\alpha = 12°$. Near here $\max(0, -g) = 0$, so $\psi$ is identically zero and so is its linearization. The subproblem sees no constraint at all. Suppose its step moves to $q = 16{,}000\,\mathrm{Pa}$ with $\alpha = 12°$. The linear model says $\psi = 0$. The truth is $\psi = 1000 \times 4 = 4000 > 0$: a violation.

**What catches it.** Re-simulating the step and re-evaluating the true $\psi$, as lesson 9's $\rho$ test does, sees the violation. The next iteration linearizes on the far side of the kink, where the constraint is visible.
:::

::: warning The kink hides the constraint from one side
When the reference sits where the trigger is off, the linearized $\psi$ is zero in every direction. A trust-region step that crosses $g = 0$ is invisible to that iteration. Real SCvx implementations deal with this explicitly — by evaluating the constraint on both sides of the switching surface, or by keeping the trust region small enough near it — rather than linearizing blindly through the corner. Never assume a single linearization of an STC near $g = 0$ tells you the truth.
:::

## Compound triggers: AND and OR with no new machinery

Real logic is rarely one condition. "Keep the tilt small below $500\,\mathrm{m}$ altitude **and** within $50\,\mathrm{m}$ of the pad sideways" needs both conditions at once. "Run the abort check if the attitude error is large **or** the rate is large" needs either one. Both fold into a single trigger function using $\max$ and $\min$, because those two operators already know about signs.

For two triggers $g_1$ and $g_2$:

- **AND** ("both active") holds exactly when $\max(g_1, g_2) < 0$. The larger of two numbers is negative only if both are negative.
- **OR** ("at least one active") holds exactly when $\min(g_1, g_2) < 0$. The smaller of two numbers is negative as soon as either one is.

A **[[compound STC|compound-stc-paper]]** is then just an ordinary one: feed $g_{\text{AND}} = \max(g_1, g_2)$ or $g_{\text{OR}} = \min(g_1, g_2)$ into the same $\psi = \max(0, -g)\cdot c$. Everything above applies unchanged.

::: example Compound triggers, checked against every combination
| $g_1$ | $g_2$ | $\max(g_1,g_2)$ (AND) | both active? | $\min(g_1,g_2)$ (OR) | either active? |
| --- | --- | --- | --- | --- | --- |
| $-1.0$ | $-2.0$ | $-1.0$ | yes | $-2.0$ | yes |
| $-1.0$ | $+3.0$ | $+3.0$ | no | $-1.0$ | yes |
| $+3.0$ | $-2.0$ | $+3.0$ | no | $-2.0$ | yes |
| $+3.0$ | $+4.0$ | $+4.0$ | no | $+3.0$ | no |

All four sign combinations come out exactly as the words "both" and "either" demand. Nesting further — three or more conditions, or a mix of AND and OR — is the same substitution applied again, because $\max$ and $\min$ take any number of arguments.
:::

::: example A keep-out that applies only low and close
The rule: below $500\,\mathrm{m}$ altitude **and** within $50\,\mathrm{m}$ of the pad sideways, keep the tilt $\theta$ at or under $10°$. That protects the pad from a sideways plume.

**Triggers.** Altitude $h$: $g_1 = h - 500$, negative below $500\,\mathrm{m}$. Sideways distance $d$: $g_2 = d - 50$, negative within $50\,\mathrm{m}$. Combined with AND: $g = \max(g_1, g_2)$. **Requirement:** $c = \theta - 10$.

| $h$ (m) | $d$ (m) | $\theta$ | $g_1$ | $g_2$ | $g = \max$ | $c$ | $\psi$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $300$ | $20$ | $14°$ | $-200$ | $-30$ | $-30$ | $+4$ | $+120$ (violated) |
| $300$ | $20$ | $6°$ | $-200$ | $-30$ | $-30$ | $-4$ | $-120$ (fine) |
| $300$ | $80$ | $14°$ | $-200$ | $+30$ | $+30$ | $+4$ | $0$ (off) |
| $800$ | $20$ | $14°$ | $+300$ | $-30$ | $+300$ | $+4$ | $0$ (off) |

**Row 1.** Low and close: both triggers negative, the larger is $-30$, so the factor is $30$ and $\psi = 30 \times 4 = 120 > 0$. A $14°$ tilt breaks the rule.

**Rows 3 and 4.** Either far away or high up: one trigger is positive, so $\max$ is positive, the factor is $0$, and $\psi = 0$. The rule is off.

**Sanity check.** Only the "low and close" rows can ever be violated — exactly what "and" means.
:::

## Check yourself

::: check
Suppose the trigger convention were flipped — "active when $g(\mathbf{x}) > 0$" — but the formula $\psi = \max(0, -g)\cdot c$ were left as it is. What goes wrong, and what is the fix?
:::

::: answer
The formula works because $\max(0, -g)$ is zero exactly when the trigger is meant to be off, and positive exactly when it is meant to be on.

With the flipped convention, the trigger is on for $g > 0$. But $\max(0, -g)$ is zero for every $g \ge 0$ — precisely the region that is now supposed to be on. So $\psi$ would report "no constraint" everywhere the rule should apply, and would enforce $c \le 0$ only where the rule is supposed to be off. It is backwards.

The fix for that convention is $\psi = \max(0, g)\cdot c \le 0$, found by running the same two-case derivation with $g > 0$ in place of $g < 0$. The lesson: derive the sign from the convention in use every time; do not memorise one formula and paste it.
:::

::: check
A colleague suggests dropping $\psi \le 0$ and instead letting flight software switch the constraint in and out: "if the trigger is on, add $c(\mathbf{x}) \le 0$ to the problem; otherwise leave it out." What is lost?
:::

::: answer
Switching the constraint set outside the optimizer means the *problem being solved* jumps from one shape to another as the trigger crosses its boundary. That brings back exactly the branching that real-time flight code avoids: lesson 12 relies on one fixed problem structure — the same sparsity pattern every cycle — that a solver can be generated and verified against once.

Worse, a vehicle near the trigger boundary could have the optimizer solving two structurally different problems on consecutive guidance cycles, with no guarantee the answers are even close. A continuous $\psi(\mathbf{x}) \le 0$ avoids that by construction: it is one fixed inequality whose *value* changes smoothly as the state moves, while the shape of the problem stays the same.
:::

::: check
Show with algebra, not just the table, why $\max(g_1, g_2) < 0$ is the same as "$g_1 < 0$ and $g_2 < 0$".
:::

::: answer
$\max(g_1, g_2)$ is by definition the larger of the two numbers. So $\max(g_1, g_2) < 0$ says the larger one is negative. The smaller one is no bigger than the larger one, so it is negative too. Both are negative.

The other way: if both are negative, the larger of them is one of the two, so it is negative as well, and $\max(g_1, g_2) < 0$.

Each statement implies the other, so they are equivalent. That is the reason behind the table's four rows, not a pattern read off them afterwards.
:::

::: check
Take a compound OR trigger $g_{\text{OR}} = \min(g_1, g_2)$ where $g_1$ is a smooth function of the state but $g_2$ is itself a compound trigger, $g_2 = \max(g_3, g_4)$. Is the nested trigger still a single continuous function you can use inside $\psi$?
:::

::: answer
Yes. The $\min$ or $\max$ of continuous functions is continuous: at each state it picks one of the continuous pieces, and it can switch pieces only where they are equal, so there is no jump. It can add new corners, though.

So $g_{\text{OR}} = \min\big(g_1,\ \max(g_3, g_4)\big)$ is a well-defined continuous function of the state. It encodes "$g_1$ active, or both $g_3$ and $g_4$ active" as one trigger. It picks up extra kinks — where $g_3 = g_4$, and where $g_1 = \max(g_3, g_4)$ — on top of the kink at $g = 0$. Each needs the same care during linearization as the single-trigger kink. More bookkeeping, not a new kind of object.
:::

::: check
An SCvx reference has $\bar q = 14{,}000\,\mathrm{Pa}$ and $\bar\alpha = 12°$, and the angle-of-attack STC of this lesson. The subproblem returns a step to $q = 15{,}500\,\mathrm{Pa}$, $\alpha = 12°$. What did the linearized constraint say about this step, what is the true $\psi$, and what should the loop do?
:::

::: answer
At the reference, $g = 15{,}000 - 14{,}000 = 1000 > 0$: the trigger is off, so $\psi$ and its linearization are both zero. The subproblem saw no constraint and happily allowed the step.

At the new point, $g = 15{,}000 - 15{,}500 = -500$, so the factor is $500$, and $c = 12 - 8 = 4$. The true $\psi = 500 \times 4 = 2000 > 0$: the step breaks the rule.

The true-dynamics and true-constraint check after the solve catches this. The loop should treat the step as poorly predicted — reject it or shrink the trust region — and the next linearization, on the active side of the kink, will see the $8°$ limit.
:::

## Summary

| Object | Statement |
| --- | --- |
| The logic problem | "If $g(\mathbf{x}) < 0$ then $c(\mathbf{x}) \le 0$" allows a union of two regions — an L-shape, not convex |
| The rejected fix | An on/off integer variable: mixed-integer, loses every convexity guarantee |
| State-triggered constraint | $\psi(\mathbf{x}) = \max(0, -g(\mathbf{x}))\cdot c(\mathbf{x}) \le 0$; exactly the implication, no integer variables |
| Why it works | Trigger off: factor $0$, so $\psi = 0$ and it holds. Trigger on: divide by the positive factor $-g$ to get $c \le 0$ |
| Regularity | Continuous, not convex, kinked at $g(\mathbf{x}) = 0$; linearized about the reference by SCvx |
| Linearizing | Trigger on at the reference: slopes are the other factor. Trigger off: linearization is zero, so a step across $g = 0$ is invisible until re-checked |
| Compound AND | $g_{\text{AND}} = \max(g_1, g_2)$: active if and only if both $g_1 < 0$ and $g_2 < 0$ |
| Compound OR | $g_{\text{OR}} = \min(g_1, g_2)$: active if and only if at least one is negative |
| Nesting | $\max$ and $\min$ of continuous functions stay continuous; any mix of AND and OR becomes one trigger |
| What is rejected | Switching the constraint in and out outside the optimizer — it breaks the fixed problem structure real-time code needs |

The next lesson turns from the mechanics of single SCvx iterations to the convergence theory behind the whole loop, and to what it costs to run this machinery on the hardware a vehicle actually carries.

::: context angle-of-attack The angle the air sees
The **angle of attack** is the angle between the direction a vehicle points and the direction the air is coming from. At zero, the air flows straight along the body. Tilt the nose and the air hits the side, making sideways force and bending loads. A tall, thin booster falling back through the atmosphere can only take a small angle of attack while the air is thick and fast, or the loads could damage it. That is why the limit matters most at high dynamic pressure.
:::

::: context dynamic-pressure How hard the air pushes
**Dynamic pressure** is $q = \tfrac12\rho v^2$: half the air density times the speed squared, in pascals. It measures how hard the oncoming air presses on the vehicle. Double the speed and $q$ goes up four times. For a returning booster it peaks during the high-speed fall through the lower atmosphere; the entry burn exists partly to cut that peak. Here $\rho$ is air density — yet another use of a letter this module also uses for thrust bounds.
:::

::: context l-shape The allowed region is an L
Put dynamic pressure across and angle of attack up. The rule allows the whole left strip (pressure below $15{,}000\,\mathrm{Pa}$, any angle) plus the bottom strip (angle at most $8°$, any pressure). The two blue points are allowed. The straight line between them passes through the white corner, where the rule is broken: the red midpoint.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="140" height="140" fill="#8fb8f0" opacity="0.6"/>
  <rect x="180" y="132.7" width="140" height="37.3" fill="#8fb8f0" opacity="0.6"/>
  <line x1="40" y1="170" x2="325" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="30" x2="180" y2="170" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="132.7" x2="320" y2="132.7" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="170.7" y1="53.3" x2="226.7" y2="146.7" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="170.7" cy="53.3" r="4" fill="#1d6fd1"/>
  <circle cx="226.7" cy="146.7" r="4" fill="#1d6fd1"/>
  <circle cx="198.7" cy="100" r="4.5" fill="#b4232c"/>
  <text x="206" y="98" font-size="11" fill="#b4232c">midpoint: broken</text>
  <text x="180" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">15,000 Pa</text>
  <text x="330" y="186" font-size="11" text-anchor="end" fill="#1f2a44">q</text>
  <text x="34" y="136" font-size="11" text-anchor="end" fill="#1f2a44">8°</text>
  <text x="34" y="30" font-size="11" text-anchor="end" fill="#1f2a44">α</text>
  <text x="110" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">trigger off</text>
</svg>
```

The chart is to scale: $q$ from $0$ to $30{,}000\,\mathrm{Pa}$ and $\alpha$ from $0°$ to $30°$.
:::

::: context mixed-integer Why on/off switches are expensive
A **mixed-integer** program has some variables that must be whole numbers, often just $0$ or $1$. The set $\{0, 1\}$ is not convex — the midpoint $\tfrac12$ is not in it — so no convex solver can handle it directly. Solvers use **branch and bound**: try the switch at $0$, try it at $1$, and prune. With $k$ switches there can be $2^k$ cases in the worst case. A landing with one switch per node and $50$ nodes has $2^{50}$, about $10^{15}$. No bounded iteration count survives that.
:::

::: context negative-part Keeping only the below-zero side
The **negative part** of a number keeps how far it is below zero and throws the rest away: $\max(0, -g)$. For $g = -3$ it gives $3$. For $g = 2$ it gives $0$. Its graph is flat at zero on the right and a straight ramp rising to the left, with a corner at $g = 0$. In a state-triggered constraint it acts like a volume knob: silent while the trigger is off, and turned up in proportion to how deeply the trigger is on.
:::

::: context kink A corner, not a jump
The graph of $\max(0, -g)$ has no gaps — you can draw it without lifting your pencil — so it is **continuous**. But at $g = 0$ it has a sharp corner, a **kink**, where the slope jumps from $-1$ to $0$. A linearization is a tangent line, and at a corner there is no single tangent line. That is why SCvx needs extra care when the reference sits near $g = 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="150" x2="180" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="20" x2="180" y2="140" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="180" y1="140" x2="320" y2="140" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="180" cy="140" r="4.5" fill="#b4232c"/>
  <text x="188" y="130" font-size="11" fill="#b4232c">kink at g = 0</text>
  <text x="330" y="158" font-size="11" text-anchor="end" fill="#1f2a44">g</text>
  <text x="60" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">−3</text>
  <text x="300" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">+3</text>
  <text x="70" y="70" font-size="11" fill="#1f2a44">slope −1</text>
  <text x="240" y="128" font-size="11" fill="#1f2a44">slope 0</text>
  <text x="190" y="24" font-size="11" fill="#1f2a44">max(0, −g)</text>
  <text x="84" y="100" font-size="11" fill="#6c7a93">trigger on</text>
  <text x="250" y="100" font-size="11" fill="#6c7a93">trigger off</text>
</svg>
```

Horizontal and vertical scales match: the ramp reaches height $3$ at $g = -3$.
:::

::: context compound-stc-paper Where compound STCs come from
State-triggered constraints were developed by Behçet Açıkmeşe's group at the University of Washington. Reynolds, Szmuk, Malyuta, Mesbahi, Açıkmeşe and Carson used them for real-time 6-DoF powered descent, and Szmuk and co-authors extended them to AND and OR logic in "Real-Time Quad-Rotor Path Planning Using Convex Optimization and Compound State-Triggered Constraints". Both are free on arXiv and listed in this module's resources.
:::
