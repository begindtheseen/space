---
id: l11-state-triggered-constraints
title: State-triggered constraints
minutes: 20
covers:
  - State-triggered constraints for logic in the loop, and compound STCs
---

This module's opening lesson named a fourth non-convexity and set it aside: logic-triggered constraints, the "enforce this limit only under that condition" rules a real vehicle actually flies with — a plume-impingement keep-out only below some altitude, an angle-of-attack cap only above some dynamic pressure. The reason it waited this long is that its fix needs the machinery the last four lessons built. Lossless convexification and the mass-depletion substitution were exact, one-shot reformulations, earning their place early. Logic has no such trick; a **state-triggered constraint** turns "if, then" into one continuous inequality that is not convex, and hands it to successive convexification exactly the way the last three lessons hand SCvx a rotation matrix or a free final time — something to linearise about a reference and refine, not something to relax once and trust forever.

## From "if–then" to one inequality

Write the trigger as a function $g(\mathbf{x})$, active when $g(\mathbf{x})<0$, and the constraint it should switch on as $c(\mathbf{x})\le0$. Formal logic gives the shape of the fix directly: "$g<0 \Rightarrow c\le0$" is equivalent to "$g\ge0$ **or** $c\le0$", and a single expression that is $\le0$ exactly on that union is

$$
\psi(\mathbf{x}) = \max\big(0,\,-g(\mathbf{x})\big)\cdot c(\mathbf{x}) \;\le\; 0.
$$

Check both regimes directly. When the trigger is inactive, $g(\mathbf{x})\ge0$, so $\max(0,-g(\mathbf{x}))=0$ and $\psi(\mathbf{x})=0$ regardless of $c(\mathbf{x})$ — the inequality $\psi\le0$ holds trivially, exactly capturing "no constraint applies." When the trigger is active, $g(\mathbf{x})<0$, so $\max(0,-g(\mathbf{x}))=-g(\mathbf{x})>0$, a strictly positive factor, and $\psi(\mathbf{x})\le0$ becomes $-g(\mathbf{x})\cdot c(\mathbf{x})\le0$; dividing through by the positive $-g(\mathbf{x})$ gives exactly $c(\mathbf{x})\le0$. One inequality, no case-splitting inside the solver, and — critically for everything this module has built — no integer or binary variable anywhere. A mixed-integer reformulation of the same logic would destroy every guarantee this module's convex machinery rests on; $\psi(\mathbf{x})\le0$ stays a statement about real-valued functions, exactly the kind SCvx's linearise-and-solve loop already knows how to consume.

::: example An angle-of-attack limit that only applies at high dynamic pressure
Trigger $g(\mathbf{x}) = q_{\text{thresh}} - q(\mathbf{x})$, active ($g<0$) once dynamic pressure $q$ climbs past $q_{\text{thresh}}=15{,}000\,\mathrm{Pa}$; constraint $c(\mathbf{x}) = |\alpha| - \alpha_{\max}$ with $\alpha_{\max}=8°$.

| $q\,(\mathrm{Pa})$ | $\alpha$ | trigger active? | $g$ | $c$ | $\psi=\max(0,-g)\cdot c$ | satisfied? |
| --- | --- | --- | --- | --- | --- | --- |
| $20{,}000$ | $5°$ | yes | $-5000$ | $-3$ | $-15{,}000$ | yes |
| $20{,}000$ | $12°$ | yes | $-5000$ | $+4$ | $+20{,}000$ | **no** |
| $8{,}000$ | $25°$ | no | $+7000$ | $+17$ | $0$ | yes |

At high dynamic pressure with the angle of attack inside its limit, $\psi$ is comfortably negative. Push the angle of attack past the limit at the same dynamic pressure and $\psi$ flips positive — a genuine, correctly detected violation. Drop dynamic pressure below threshold and $\alpha=25°$, wildly over the nominal $8°$ cap, produces $\psi=0$ exactly: the trigger is off, so the limit simply does not apply, precisely as the original "if–then" rule intended. One formula, three regimes, no branching logic anywhere in sight.
:::

$\psi$ is continuous but not smooth — the $\max(0,\cdot)$ has a kink exactly where $g(\mathbf{x})=0$ — and it is a product of two functions, so it is not convex even where $g$ and $c$ individually are. Neither property is a problem for the tool this constraint is headed into: SCvx already linearises every nonlinear constraint about the current reference each iteration, and away from the switching surface $g=0$, $\max(0,-g)$ is locally just $0$ or $-g$ depending on which side of the surface the reference sits, so $\psi$ is locally smooth there and linearises like anything else this module's second half has handled. The one genuine wrinkle is a reference sitting close enough to $g(\mathbf{x})=0$ that a trust-region step could cross it; that case needs the constraint evaluated on both sides rather than linearised blindly through the kink, a detail real SCvx implementations handle explicitly rather than an edge case this lesson will pretend away.

::: key State-triggered constraint, in one line
$\psi(\mathbf{x}) = \max(0,-g(\mathbf{x}))\cdot c(\mathbf{x}) \le 0$ encodes "$g(\mathbf{x})<0 \Rightarrow c(\mathbf{x})\le0$" exactly, with no integer variables. It is continuous, not convex, and not smooth at $g(\mathbf{x})=0$ — handled by SCvx's linearise-about-a-reference loop like any other genuine nonlinearity this module's second half has introduced.
:::

## Compound triggers: logical AND and OR without any new machinery

Real logic is rarely a single condition. "Enforce the keep-out only below $500\,\mathrm{m}$ altitude **and** within $50\,\mathrm{m}$ of the pad horizontally" needs both triggers active at once; "enforce the abort check if attitude error is large **or** if the rate is large" needs either one. Both compound cases fold into a single trigger function using nothing more than $\max$ and $\min$, because that is exactly what those operators mean for a set of numbers' signs.

For triggers $g_1,g_2$, the **AND** of "both active" is itself active exactly when *both* $g_1<0$ and $g_2<0$ — which is precisely when $\max(g_1,g_2)<0$, since the max of two negative numbers is negative only if neither one is non-negative. The **OR** of "at least one active" is active when $\min(g_1,g_2)<0$, since the min of two numbers is negative as soon as either one is.

::: example Compound triggers, checked against every combination
| $g_1$ | $g_2$ | $\max(g_1,g_2)$ (AND-trigger) | both active? | $\min(g_1,g_2)$ (OR-trigger) | either active? |
| --- | --- | --- | --- | --- | --- |
| $-1.0$ | $-2.0$ | $-1.0$ | yes | $-2.0$ | yes |
| $-1.0$ | $+3.0$ | $+3.0$ | no | $-1.0$ | yes |
| $+3.0$ | $-2.0$ | $+3.0$ | no | $-2.0$ | yes |
| $+3.0$ | $+4.0$ | $+4.0$ | no | $+3.0$ | no |

Every one of the four sign combinations comes out exactly as the words "both" and "either" demand. A compound trigger is then just an ordinary trigger — feed $g_{\text{AND}}=\max(g_1,g_2)$ or $g_{\text{OR}}=\min(g_1,g_2)$ into the same $\psi(\mathbf{x})=\max(0,-g(\mathbf{x}))\cdot c(\mathbf{x})$ construction from the single-trigger case, and everything above applies unchanged. Nesting further — three or more conditions, or a mix of AND and OR — is the same substitution applied recursively, since $\max$ and $\min$ each combine any number of arguments, not only two.
:::

## Check yourself

::: check
Explain why $\psi(\mathbf{x})=\max(0,-g(\mathbf{x}))\cdot c(\mathbf{x})$ would stop working correctly as a state-triggered constraint if the trigger convention were flipped — "active when $g(\mathbf{x})>0$" instead of "active when $g(\mathbf{x})<0$" — without changing the formula to match.
:::

::: answer
The formula's correctness rests on $\max(0,-g(\mathbf{x}))$ being exactly zero when the trigger is meant to be inactive and exactly $-g(\mathbf{x})>0$ when active. With the flipped convention, the trigger is active for $g>0$, but $\max(0,-g)$ is zero for every $g\ge0$ — precisely the region that is now supposed to be active — so $\psi$ would report "no constraint" throughout the active region and only engage $c(\mathbf{x})\le0$ where the trigger is supposed to be off. The correct construction for that convention swaps the sign inside the max, $\psi(\mathbf{x})=\max(0,g(\mathbf{x}))\cdot c(\mathbf{x})$, by the same derivation run with $g\ge0$ in place of $g<0$. The lesson is to derive the sign from the actual convention in use each time, not to memorise one formula and paste it in.
:::

::: check
A colleague suggests replacing $\psi(\mathbf{x})\le0$ with two separate constraints solved in different modes — "if the trigger is active, add $c(\mathbf{x})\le0$ to the problem; otherwise don't" — switched by flight software logic outside the optimizer. What does this module's certification standard say is lost by doing that?
:::

::: answer
Switching the constraint set outside the optimizer means the *problem being solved* changes discontinuously as the trigger crosses its boundary, which reintroduces exactly the kind of branching this module's real-time-implementation standard rules out: a fixed, precomputed sparsity pattern and problem structure that a solver can be built and verified against once. A vehicle whose state sits close to the trigger boundary between two guidance cycles would have the optimizer solving two structurally different problems on consecutive cycles, with no guarantee the solutions are even close to each other — a discontinuity a continuous $\psi(\mathbf{x})\le0$ constraint avoids by construction, since it is one fixed inequality whose *value*, not the shape of the problem, changes smoothly as the state moves.
:::

::: check
For the compound-AND case, verify algebraically (not just by the table) why $\max(g_1,g_2)<0$ is equivalent to "$g_1<0$ and $g_2<0$."
:::

::: answer
$\max(g_1,g_2)$ is, by definition, the larger of the two numbers, so $\max(g_1,g_2)<0$ says the *larger* of $g_1,g_2$ is negative. If the larger one is negative, the smaller one — being no bigger — must also be negative, so both are negative. Conversely, if both are negative, the larger of the two is still one of them, hence also negative. The two statements imply each other exactly, which is the algebraic content behind the table's four rows rather than a pattern read off them after the fact.
:::

::: check
Sketch, in words, what happens to a compound OR trigger $g_{\text{OR}}=\min(g_1,g_2)$ if $g_1$ is a smooth function of the state but $g_2$ is itself another compound trigger, say $\max(g_3,g_4)$. Is nesting like this still a single continuous function usable inside $\psi$?
:::

::: answer
Yes. $\min$ and $\max$ of continuous functions are themselves continuous functions (each is a pointwise minimum or maximum of continuous pieces, and that operation preserves continuity even though it can introduce new kinks), so $g_{\text{OR}} = \min\big(g_1,\ \max(g_3,g_4)\big)$ is a perfectly well-defined continuous function of the state, encoding "$g_1$ active, or both $g_3$ and $g_4$ active" as a single trigger. It picks up an additional kink at whatever surface $g_3=g_4$, alongside the kinks already present at $g_1=g_2$-type boundaries and at $g=0$ itself, and each of those kinks needs the same care during linearisation this lesson already flagged for the single-trigger case — more bookkeeping for the implementation, not a different kind of mathematical object.
:::

## Summary

| Object | Statement |
| --- | --- |
| The logic problem | "If $g(\mathbf{x})<0$ then $c(\mathbf{x})\le0$" is a union of regions — not convex, and not fixed by any tool used so far in this module |
| State-triggered constraint | $\psi(\mathbf{x})=\max(0,-g(\mathbf{x}))\cdot c(\mathbf{x})\le0$; exactly equivalent to the implication, no integer variables |
| Why it works | Inactive trigger forces $\psi\equiv0$ (trivially satisfied); active trigger divides through by a positive factor, recovering $c(\mathbf{x})\le0$ exactly |
| Regularity | Continuous everywhere, not convex, not smooth at $g(\mathbf{x})=0$ — handled by linearising about a reference like any other SCvx nonlinearity |
| Compound AND | $g_{\text{AND}}=\max(g_1,g_2)$: active iff both $g_1<0$ and $g_2<0$ |
| Compound OR | $g_{\text{OR}}=\min(g_1,g_2)$: active iff at least one of $g_1,g_2<0$ |
| Nesting | $\max$/$\min$ of continuous functions stay continuous; arbitrarily complex logical combinations reduce to one trigger function |
| What is rejected | Switching the constraint set outside the optimizer — breaks the fixed problem structure this module's real-time standard requires |

The next lesson turns from the mechanics of a single SCvx iteration to the convergence theory behind the whole loop, and to what it costs to run this machinery on hardware a vehicle actually carries.
