---
id: l03-change-of-variables-and-socp
title: The change of variables, convex mass bounds, and the SOCP
minutes: 23
covers:
  - The change of variables u = T/m, sigma = Gamma/m, z = ln m, and how it makes the translational dynamics exactly linear
  - The second-order-expanded mass bounds that keep the transformed thrust bounds convex
  - SOCP standard form, the second-order cone, and mapping the powered-descent problem onto it
---

When you ride in a car, you do not feel the engine's force in newtons. You feel how hard you are pressed into the seat — the acceleration. A heavy truck and a light car can have the same engine and feel completely different, because the same push divided by a different mass gives a different acceleration. If you only cared about where the car goes, you would plan in acceleration directly and let someone else work out the force.

That is the idea behind this lesson. The previous lesson fixed the bagel-shaped thrust band and borrowed a substitution to check the fix, promising to derive it later. This is later. Three things still stand between us and a problem a solver can eat. The mass-varying dynamics are still bilinear. The throttle band has to survive being divided by that same changing mass. And every piece has to be written in the exact form a solver reads. This lesson does all three. At the end, powered descent is not "roughly convex" or "convex except for one leftover piece". It is a **second-order cone program**, in the standard form the optimization module defined.

## Planning in acceleration instead of force

The mass-depletion problem from lesson one is separate from the thrust band, and it needs a separate tool. The velocity equation $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ divides one unknown, $\mathbf{T}$, by another, $m$. No relaxation removes that: a relaxation helps with an inequality whose *edge* is the trouble, and this is an equality. The fix here is exact. Change the unknowns.

Define, at every instant,

$$
\mathbf{u} = \frac{\mathbf{T}}{m}, \qquad \sigma = \frac{\Gamma}{m}, \qquad z = \ln m.
$$

Read them as "u", the thrust acceleration (thrust per kilogram, in $\mathrm{m/s^2}$); "sigma", the allowance per kilogram, also in $\mathrm{m/s^2}$; and "z", the natural logarithm of the mass. This is a true change of variables, not an approximation. It is a **[[bijection|bijection]]** — a one-to-one matching, so you can always go back — whenever $m > 0$, which every real trajectory has. Nothing is lost going from $(\mathbf{T}, \Gamma, m)$ to $(\mathbf{u}, \sigma, z)$ and back.

Now substitute, one equation at a time.

**Velocity.** $\mathbf{T}/m$ is $\mathbf{u}$ by definition, so

$$
\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}.
$$

That is a straight-line (affine) equation in the new unknowns. The mass is gone.

**Mass.** Use the chain rule on $z = \ln m$. The derivative of $\ln m$ is $1/m$ times the derivative of $m$:

$$
\dot z = \frac{\dot m}{m} = \frac{-\alpha\Gamma}{m} = -\alpha\sigma.
$$

The middle step uses $\dot m = -\alpha\Gamma$ from lesson two; the last uses $\Gamma/m = \sigma$. Also affine.

Both equations of motion are now exactly linear, with constant coefficients. The hardest-looking piece of the original problem has become the easiest. Why does the logarithm work so neatly? Mass does not fall by a fixed number of kilograms per second — it falls in proportion to the allowance, and dividing by $m$ turns the **[[relative rate|log-rate]]** $\dot m/m$ into the plain rate of $\ln m$.

**The thrust cone.** Divide both sides of $\|\mathbf{T}\|_2\le\Gamma$ by the same positive $m$:

$$
\|\mathbf{u}\|_2\le\sigma.
$$

Same shape, same cone.

**A free bonus.** $m = e^z$ is positive for every real $z$. So "mass stays positive" is built into the substitution, not an extra rule someone must remember. That is a side benefit, not the reason for the change. The reason is the bilinearity.

::: key The LCvx change of variables
$\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$. Then $\ddot{\mathbf{r}} = \mathbf{g} + \mathbf{u}$ and $\dot z = -\alpha\sigma$ — exactly linear, with all remaining nonlinearity pushed into the thrust bounds. $\alpha = 1/(I_{sp}g_0)$; for $I_{sp} = 300\,\mathrm{s}$, $\alpha = 3.399\times10^{-4}\,\mathrm{s/m}$.
:::

Here $\ddot{\mathbf{r}}$, read "r double dot", is the acceleration: the rate of change of $\dot{\mathbf{r}} = \mathbf{v}$. Check the $\alpha$ value: $300 \times 9.80665 = 2942.0$, and $1/2942.0 = 3.399\times10^{-4}$.

::: example A thrust-and-mass state, converted and converted back
A vehicle pushes with $\mathbf{T} = (1200, -300, 8700)\,\mathrm{N}$ at mass $m = 1650\,\mathrm{kg}$. Take the allowance at its tight value, $\Gamma = \|\mathbf{T}\|_2$. Lesson two's theorem says this is what happens at the optimum, so it is the case worth checking.

**Step 1: the thrust size.** $\|\mathbf{T}\|_2 = \sqrt{1200^2 + 300^2 + 8700^2} = \sqrt{77\,220\,000} = 8787.49\,\mathrm{N}$.

**Step 2: forward.** Divide everything by $1650$:

$$
\mathbf{u} = (0.72727,\,-0.18182,\,5.27273)\,\mathrm{m/s^2}, \qquad \sigma = \frac{8787.49}{1650} = 5.32575\,\mathrm{m/s^2}, \qquad z = \ln 1650 = 7.40853.
$$

**Step 3: tightness survives.** $\|\mathbf{u}\|_2 = \sqrt{0.72727^2+0.18182^2+5.27273^2} = 5.32575\,\mathrm{m/s^2} = \sigma$. It must: dividing both sides of $\|\mathbf{T}\|=\Gamma$ by the same $m$ cannot change whether they are equal.

**Step 4: back.** $m = e^{7.40853} = 1650.0\,\mathrm{kg}$. Then $\mathbf{T} = m\,\mathbf{u} = (1200.0,-300.0,8700.0)\,\mathrm{N}$ and $\Gamma = m\sigma = 8787.5\,\mathrm{N} = \|\mathbf{T}\|_2$. The round trip is exact both ways.

**Sanity check.** $\sigma \approx 5.3\,\mathrm{m/s^2}$ is about $1.4$ times Mars gravity: enough to brake, not absurd.
:::

## The throttle band, divided by a changing mass

Now take the relaxed band $\rho_{\min}\le\Gamma\le\rho_{\max}$ and divide by $m = e^z$. Since $1/e^z = e^{-z}$,

$$
\rho_{\min}e^{-z} \le \sigma \le \rho_{\max}e^{-z}.
$$

Both sides involve $e^{-z}$, which is a convex function of $z$: its second derivative is $e^{-z} > 0$, so its graph curves upward everywhere. You might guess both inequalities share the same verdict. They do not, and it is easy to get this backwards.

- The **upper** bound, $\sigma \le \rho_{\max}e^{-z}$, is the region *below* a convex curve — its **hypograph**. Below a bowl-shaped curve is not convex: a straight line between two points on the curve bows up *above* the curve.
- The **lower** bound, $\sigma \ge \rho_{\min}e^{-z}$, is the region *above* a convex curve — its **[[epigraph|epigraph-picture]]**. That is always convex, by the same definition the optimization module used for every epigraph.

::: example Checking both claims with real numbers
Take a full vehicle, $m_1 = 1905\,\mathrm{kg}$ ($z_1 = 7.55224$), and a lighter one, $m_2 = 1500\,\mathrm{kg}$ ($z_2 = 7.31322$). The midpoint in $z$ is $z_m = 7.43273$, which is the mass $e^{7.43273} = 1690.41\,\mathrm{kg}$.

**Upper bound, $\rho_{\max}=13260\,\mathrm{N}$.** Put two points exactly on the boundary: $\sigma_1 = 13260/1905 = 6.96063$ and $\sigma_2 = 13260/1500 = 8.84000$. Their midpoint has $\sigma_m = (6.96063+8.84000)/2 = 7.90031$. The true bound at $z_m$ is $13260/1690.41 = 7.84423$. Since $7.90031 > 7.84423$, the midpoint of two allowed points breaks the upper bound. Not convex — confirmed by arithmetic, not by trusting a sketch.

**Lower bound, $\rho_{\min}=4972\,\mathrm{N}$.** Same two masses: $\sigma_1 = 4972/1905 = 2.60997$ and $\sigma_2 = 4972/1500 = 3.31467$, midpoint $\sigma_m = 2.96232$. The true bound at $z_m$ is $4972/1690.41 = 2.94129$. Since $2.96232 \ge 2.94129$, the midpoint obeys the lower bound, as the epigraph argument says it must — for every pair, not only this one.
:::

So the lower bound is already exactly convex. And yet this module approximates it anyway. The reason is not convexity; it is the *kind* of problem. $\sigma \ge \rho_{\min}e^{-z}$ contains a bare exponential. A second-order cone solver has no way to represent that. It belongs to a different cone, the **[[exponential cone|exp-cone]]**, which needs a different, less widely available solver. Everything else in the problem — dynamics, thrust cone, glideslope, pointing — is a linear equation or a second-order cone. Swap the exponential for a polynomial and the whole problem stays in one cone type that one solver handles, at the price of a tiny, checkable error.

The polynomials come from the **[[Taylor expansion|taylor-picture]]** of $e^{-z}$ about a reference log-mass $z_0(t)$. The upper bound keeps the first two terms (a tangent line). The lower bound keeps one term more (a parabola):

$$
\sigma \le \mu_2\big(1-(z-z_0)\big), \qquad \sigma \ge \mu_1\Big(1-(z-z_0)+\tfrac12(z-z_0)^2\Big), \qquad \mu_1 = \rho_{\min}e^{-z_0}, \quad \mu_2 = \rho_{\max}e^{-z_0}.
$$

Read $\mu$ as "mu". $\mu_1$ and $\mu_2$ are the minimum and maximum thrust accelerations the vehicle would have at the reference mass. The upper bound is now affine in $(z,\sigma)$ — a plain linear inequality. The lower bound is a convex parabola in $z$ against a straight line in $\sigma$: convex, no exponential, and (below) writable exactly as a second-order cone.

Both are expanded about the **reference log-mass**

$$
z_0(t) = \ln\big(m_{\text{wet}} - \alpha\rho_{\max}t\big),
$$

the mass the vehicle would have if the engine had run at full throttle since ignition. Here $m_{\text{wet}}$ is the starting mass, fuel and all. No real trajectory can be lighter than that, because running the engine any less hard leaves more propellant. So $z \ge z_0$ always.

::: key Convexified thrust bounds in log-mass
$\mu_1\big[1 - (z - z_0) + (z - z_0)^2/2\big] \le \sigma \le \mu_2\big[1 - (z - z_0)\big]$, with $z_0$ the reference log-mass, $\mu_1 = \rho_{\min}e^{-z_0}$, $\mu_2 = \rho_{\max}e^{-z_0}$. Left side convex quadratic, right side affine.
:::

::: warning Two bounds, two different reasons
The upper bound $\sigma\le\rho_{\max}e^{-z}$ is truly non-convex, and needs a fix to be usable at all; a tangent line is the simplest. The lower bound $\sigma\ge\rho_{\min}e^{-z}$ is already convex, and gets a polynomial only so the whole problem stays a second-order cone program instead of needing an exponential-cone solver. Mix up the reasons and you solve the wrong problem — for instance, treating the lower bound as "non-convex like the upper one" and throwing away accuracy for nothing.
:::

::: note Why it has to be true: both approximations err on the safe side
Write $x = z - z_0 \ge 0$. The tangent line of a convex curve always lies on or below it, so $1 - x \le e^{-x}$: the affine upper bound never allows more acceleration than the engine has. For the lower bound, Taylor's theorem with remainder says

$$
e^{-x} = 1 - x + \tfrac12 x^2 - \tfrac16 e^{-\xi}x^3
$$

for some $\xi$ ("xi") between $0$ and $x$. The last term is negative when $x > 0$, so $e^{-x} \le 1 - x + \tfrac12x^2$: the parabola sits on or above the true floor. Demanding $\sigma$ above the parabola asks for slightly *more* than minimum thrust, which the engine can always give. Both approximations shrink the allowed set a little, never grow it. That is why $z \ge z_0$ matters.
:::

How big is the error? Do not guess — measure it on a real solve.

::: example The approximation error along an actual optimal trajectory
Take the $240.382\,\mathrm{kg}$ landing from lesson two. At the *actual* solved $z_k$ (not the reference), compare the exact exponential bounds with the polynomial ones the solver enforced. All values are in $\mathrm{m/s^2}$:

| step $k$ | $z_k - z_{0,k}$ | upper: exact | upper: affine | affine is lower by | lower: exact | lower: quadratic | quadratic is higher by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $0.00000$ | $6.96063$ | $6.96063$ | $0.0000\%$ | $2.60997$ | $2.60997$ | $0.0000\%$ |
| $10$ | $0.00076$ | $7.42370$ | $7.42370$ | $0.0000\%$ | $2.78361$ | $2.78361$ | $0.0000\%$ |
| $17$ | $0.03125$ | $7.55700$ | $7.55323$ | $0.0499\%$ | $2.83359$ | $2.83361$ | $0.0005\%$ |
| $24$ | $0.06387$ | $7.69518$ | $7.67880$ | $0.2129\%$ | $2.88540$ | $2.88553$ | $0.0046\%$ |
| $29$ | $0.07434$ | $7.90905$ | $7.88609$ | $0.2904\%$ | $2.96560$ | $2.96581$ | $0.0072\%$ |

**Step 1: the upper bound.** The affine ceiling sits at most $0.29\%$ below the engine's true ceiling over the whole burn. The solver never claims authority the engine does not have. This is why lesson two's final burn showed $99.7\%$ throttle instead of $100\%$.

**Step 2: the lower bound.** The quadratic floor sits at most $0.0072\%$ above the true floor — at step $17$, it asks for $4972.03\,\mathrm{N}$ instead of $4972\,\mathrm{N}$. The engine gives that without noticing.

**Step 3: the pattern.** Both errors grow with $z-z_0$. That is why $z_0(t)$ is pinned to the fastest-burning mass history: a fuel-optimal trajectory spends long stretches below full throttle, but stays close enough to it that $z - z_0$ remains small — under $0.075$ here.
:::

## The second-order cone program

The optimization module defined the **second-order cone program** (SOCP) standard form:

$$
\min_{\mathbf{x}}\ \mathbf{c}^\top\mathbf{x} \quad\text{subject to}\quad \|\mathbf{A}_i\mathbf{x}+\mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x}+d_i \ \text{ for each } i, \qquad \mathbf{F}\mathbf{x}=\mathbf{g}.
$$

In words: minimize a linear cost, where each constraint says "the length of some affine vector is at most some affine number" — one **[[second-order cone|soc-3d]]** each — plus a batch of linear equations. The $\min$ reads "minimize over $\mathbf{x}$", and $\mathbf{c}^\top\mathbf{x}$ ("c transpose x") is the weighted sum of the unknowns.

Every piece of powered descent now maps straight onto this.

- **The unknowns.** $\mathbf{x}$ stacks $(\mathbf{r}_k,\mathbf{v}_k,z_k)$ at every node and $(\mathbf{u}_k,\sigma_k)$ at every step.
- **The dynamics** — now exactly linear, thanks to the first section — are rows of $\mathbf{F}\mathbf{x}=\mathbf{g}$, together with the start and landing conditions.
- **The thrust cone** $\|\mathbf{u}_k\|_2\le\sigma_k$ is a cone of dimension $4$: $\mathbf{A}_i$ picks out $\mathbf{u}_k$, and $\mathbf{c}_i$ picks out $\sigma_k$.
- **The upper mass bound** is a linear inequality — a cone of dimension $1$ in disguise, with nothing inside the norm.
- **The cost** is linear: minimize $\sum_k\sigma_k\Delta t$.

The lower mass bound is the one piece that does not look like a cone at first sight. The optimization module's identity for turning a square into a cone handles it:

$$
\|\mathbf{y}\|_2^2\le s \iff \|(2\mathbf{y},\,1-s)\|_2\le 1+s.
$$

(Square both sides of the right-hand form: $4\|\mathbf{y}\|^2 + (1-s)^2 \le (1+s)^2$, and the $1$s and $s^2$s cancel to leave $4\|\mathbf{y}\|^2 \le 4s$.)

Apply it in three steps.

1. Name the pieces. Let $y=\sqrt{\mu_1}\,(z-z_0)$, so $\tfrac12\mu_1(z-z_0)^2 = \tfrac12y^2$. Let $s = \sigma - \mu_1\big(1-(z-z_0)\big)$, the room left above the tangent line.
2. Rewrite the bound. The quadratic lower bound says exactly $\tfrac12y^2\le s$, that is, $y^2\le 2s$.
3. Use the identity with $2s$ in place of $s$: $\|(2y,\,1-2s)\|_2\le 1+2s$ — a cone of dimension $3$ in the local unknowns $(z,\sigma)$.

Multiplying out gives explicit standard-form data:

$$
\mathbf{A}_i = \begin{bmatrix}2\sqrt{\mu_1} & 0 \\ -2\mu_1 & -2\end{bmatrix},\quad \mathbf{b}_i=\begin{bmatrix}-2\sqrt{\mu_1}\,z_0\\ 1+2\mu_1(1+z_0)\end{bmatrix},\quad \mathbf{c}_i=\begin{bmatrix}2\mu_1\\2\end{bmatrix},\quad d_i = 1-2\mu_1(1+z_0).
$$

Two checks. Test $20{,}000$ random points $(z,\sigma)$ on both sides of the boundary at step $17$: the lifted cone and the original quadratic agree every time, with zero mismatches. That is expected — it is an algebraic identity, not a second approximation. And at the solver's own step-$17$ answer, which sits right on the floor, the quadratic form reports a slack of $1.1\times10^{-8}$ and the lifted form $4.3\times10^{-8}$: both at solver tolerance, both describing the same boundary point. (The barrier solver used in lesson two never performs this lift; its barrier works on the quadratic directly. A general conic solver that accepts only pure second-order cones needs exactly this rewrite, and it is worth knowing the two are the same constraint before trusting either.)

::: key SOCP standard form
Minimize $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x}+\mathbf{b}_i\|_2\le\mathbf{c}_i^\top\mathbf{x}+d_i$ and $\mathbf{F}\mathbf{x}=\mathbf{g}$. Powered descent after lossless convexification and the change of variables: linear dynamics in $\mathbf{F}\mathbf{x}=\mathbf{g}$, the thrust cone $\|\mathbf{u}_k\|\le\sigma_k$, an affine upper mass bound, and a quadratic lower mass bound written as $\|(2y,1-2s)\|_2\le1+2s$.
:::

::: example Counting the pieces of the discretized problem
Chop the $60\,\mathrm{s}$ Mars descent from lesson two into $N=30$ steps of $\Delta t=2\,\mathrm{s}$. The dynamics between nodes are the **[[zero-order-hold|zoh]]** form: hold $\mathbf{u}_k$ and $\sigma_k$ fixed over step $k$, so

$$
\mathbf{r}_{k+1} = \mathbf{r}_k + \mathbf{v}_k\Delta t + \tfrac12(\mathbf{g}+\mathbf{u}_k)\Delta t^2, \qquad \mathbf{v}_{k+1} = \mathbf{v}_k + (\mathbf{g}+\mathbf{u}_k)\Delta t, \qquad z_{k+1} = z_k - \alpha\sigma_k\Delta t.
$$

**Step 1: unknowns.** The state $(\mathbf{r},\mathbf{v},z)$ is $3+3+1 = 7$ numbers at each of $N+1=31$ nodes. The control $(\mathbf{u},\sigma)$ is $4$ numbers at each of $30$ steps. Total: $7\times31 + 4\times30 = 217+120=337$.

**Step 2: equations.** Each step's dynamics give $7$ rows: $7\times30 = 210$. The start fixes $\mathbf{r}_0$, $\mathbf{v}_0$, $z_0$ ($7$ rows) and the landing fixes $\mathbf{r}_N$, $\mathbf{v}_N$ ($6$ rows): $13$ more. Total: $210+13 = 223$ equality rows.

**Step 3: cones.** Per step, one thrust cone, one upper-mass linear bound, and one lower-mass bound: $3\times30=90$ blocks, none bigger than dimension $4$.

**Sanity check.** $337 - 223 = 114$ unknowns are left free after the equations. That is the $120$ control numbers, less the $6$ spent meeting the landing conditions: $120 - 6 = 114$. It adds up.

Every one of these numbers fixes a matrix shape the solver sets up once and never resizes. Lesson twelve, on real-time implementation, builds a flight-software argument on exactly that.
:::

## Check yourself

::: check
The upper mass bound is replaced by a tangent line that always sits *below* the true curve, with no theorem attached — only an error table. Yet lesson two's thrust relaxation needed a full proof that nothing was lost. Why the difference?
:::

::: answer
They err in opposite directions. The tangent-line upper bound *shrinks* the allowed set: it forbids some acceleration the engine could really deliver. Being cautious in that safe direction — never claiming more authority than the vehicle has — is acceptable as an engineering approximation, as long as its size is checked, which the error table does. The thrust relaxation of lesson two *enlarges* the allowed set, adding physically meaningless points like zero thrust on a paid allowance. If nothing forced the optimizer away from those points, the answer would not be slightly cautious — it would be wrong, describing no flyable trajectory at all. So one needs a theorem about where the optimum lands; the other needs only an error bound.
:::

::: check
A colleague suggests skipping the lower-bound approximation and handing the solver the exact $\sigma \ge \rho_{\min}e^{-z}$, since it is already convex. What must be true of the solver, and what do you give up?
:::

::: answer
The solver must support the exponential cone — for example SCS, Clarabel or MOSEK — not only the second-order cone that a lean flight solver is built around. What you give up is the uniformity the counting example relies on: every other constraint is already a second-order cone or a linear inequality, so a solver specialized for those (smaller, simpler, and the kind of code the real-time lesson generates for flight) can handle the whole problem. Trading a tiny, checked, safe-side error for a dependence on a less common cone type and a different solver family is rarely the better engineering choice — though it is a legitimate one to make on purpose.
:::

::: check
In the round-trip example, redo the forward conversion with $\Gamma = 9200\,\mathrm{N}$ instead of the tight value (still $\mathbf{T}=(1200,-300,8700)\,\mathrm{N}$, $m=1650\,\mathrm{kg}$). Does $\|\mathbf{u}\|_2=\sigma$ still hold?
:::

::: answer
$\sigma = \Gamma/m = 9200/1650 = 5.57576\,\mathrm{m/s^2}$. But $\|\mathbf{u}\|_2$ depends only on $\mathbf{T}$ and $m$, so it stays $5.32575\,\mathrm{m/s^2}$. Now $\|\mathbf{u}\|_2 = 5.32575 < \sigma = 5.57576$: the point is strictly *inside* the cone, not on its edge. It is a perfectly legal point of the relaxed problem — the cone only asks for $\le$. It is the "paying for unused allowance" case that lesson two's theorem rules out *at the optimum*: an optimal trajectory would never sit there, because paying for $412.5\,\mathrm{N}$ of allowance it does not use wastes propellant for nothing.
:::

::: check
The count gave $337$ unknowns and $223$ equality rows for $N=30$. Without recounting from scratch, how does each change if $N$ doubles to $60$ at the same $\Delta t$ (so $t_f$ doubles too)? Which grows faster?
:::

::: answer
Unknowns: $7(N+1)+4N = 11N+7$. At $N=60$ that is $660+7=667$ — a little under double the $337$ at $N=30$ (double would be $674$), because the $+7$ does not double. Equality rows: $7N+13$, giving $420+13=433$ at $N=60$ against $223$ — again a little under double. Unknowns grow by $11$ per step and rows by $7$ per step, so unknowns grow faster in absolute terms, but both are linear in $N$. The number of cones, $3N$, is linear too. What can grow much faster than linearly is the *work per iteration*, if the solver ignores the problem's banded structure — a point the real-time lesson returns to.
:::

::: check
Show that the point $(z,\sigma)=(z_0, \mu_1)$ — exactly at the reference log-mass — lies exactly on the boundary of both the quadratic lower bound and its lifted cone form.
:::

::: answer
At $z=z_0$, $z-z_0=0$. The quadratic bound reads $\sigma \ge \mu_1(1-0+0) = \mu_1$, so $\sigma=\mu_1$ sits exactly on the boundary, with zero slack. In the lifted form, $y=\sqrt{\mu_1}\cdot0=0$ and $s=\mu_1-\mu_1(1-0)=0$, so the cone reads $\|(0,\,1-0)\|_2 \le 1+0$, that is, $1\le1$: also exactly on the boundary, with zero slack. The two forms agree here, as the identity behind the lift guarantees they must everywhere.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Change of variables | $\mathbf{u}=\mathbf{T}/m$, $\sigma=\Gamma/m$, $z=\ln m$: an exact bijection for $m>0$, not a relaxation |
| Linear dynamics | $\ddot{\mathbf{r}}=\mathbf{g}+\mathbf{u}$, $\dot z=-\alpha\sigma$; the thrust cone becomes $\|\mathbf{u}\|\le\sigma$ |
| $\alpha$ | $1/(I_{sp}g_0)$: $3.399\times10^{-4}\,\mathrm{s/m}$ at $300\,\mathrm{s}$, $4.532\times10^{-4}\,\mathrm{s/m}$ at $225\,\mathrm{s}$ |
| Band in new variables | $\rho_{\min}e^{-z}\le\sigma\le\rho_{\max}e^{-z}$ |
| Upper bound | Non-convex (below a convex curve); tangent line $\mu_2[1-(z-z_0)]$, on the safe side, error $\le0.29\%$ on the worked burn |
| Lower bound | Already convex (epigraph); parabola $\mu_1[1-(z-z_0)+(z-z_0)^2/2]$ to stay in the SOCP, on the safe side, error $\le0.0072\%$ |
| Reference log-mass | $z_0(t) = \ln(m_{\text{wet}}-\alpha\rho_{\max}t)$, the full-throttle mass history; $z\ge z_0$ always |
| Square as cone | $\|\mathbf{y}\|^2\le s \iff \|(2\mathbf{y},1-s)\|_2\le1+s$; checked on $20{,}000$ points, zero mismatches |
| SOCP standard form | Minimize $\mathbf{c}^\top\mathbf{x}$ s.t. $\|\mathbf{A}_i\mathbf{x}+\mathbf{b}_i\|_2\le\mathbf{c}_i^\top\mathbf{x}+d_i$, $\mathbf{F}\mathbf{x}=\mathbf{g}$ |
| Size at $N=30$ | $337$ unknowns, $223$ equality rows, $90$ cone or linear blocks, none bigger than dimension $4$ |

The 3-DoF landing problem is now a true second-order cone program: linear dynamics, a losslessly tight thrust cone, and safe-side mass bounds, all in the form a solver reads. The next lesson puts that solver to work in G-FOLD, the two-stage guidance law that actually flew, and uses it to map how far the vehicle can divert.

::: context bijection Why "one-to-one" matters
A **bijection** pairs every item on one side with exactly one on the other, with nothing left over, like seats and ticket holders at a sold-out show. Because every $(\mathbf{T},\Gamma,m)$ with $m>0$ has exactly one $(\mathbf{u},\sigma,z)$ and back, solving in the new unknowns loses nothing. The best answer in one set of variables is the best answer in the other.
:::

::: context log-rate Why the logarithm straightens mass out
Suppose something shrinks by the same *fraction* every second, like money losing value to inflation. Plotted directly, it curves. Plotted as a logarithm, it falls in a straight line, because $\frac{d}{dt}\ln m = \dot m/m$ is exactly the fractional rate. For the lander, $\dot m/m = -\alpha\Gamma/m = -\alpha\sigma$. Choosing $\sigma$ as the unknown makes that rate a plain linear expression.
:::

::: context epigraph-picture Above the curve versus below it
The curve is $e^{-z}$ with the range stretched so the bend is visible. The chord between two points on it bows above the curve. So the region above the curve (blue, the lower bound's allowed set) contains the chord, and the region below (orange, the upper bound's allowed set) does not: the red midpoint is outside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M60,30 L75,46.5 L90,61 L105,73.8 L120,85.1 L135,95.1 L150,103.9 L165,111.6 L180,118.5 L195,124.5 L210,129.9 L225,134.6 L240,138.8 L255,142.4 L270,145.7 L285,148.5 L300,151.1 L300,170 L60,170 Z" fill="#f2b880"/>
  <path d="M60,30 L75,46.5 L90,61 L105,73.8 L120,85.1 L135,95.1 L150,103.9 L165,111.6 L180,118.5 L195,124.5 L210,129.9 L225,134.6 L240,138.8 L255,142.4 L270,145.7 L285,148.5 L300,151.1 L300,15 L60,15 Z" fill="#8fb8f0"/>
  <polyline points="60,30 75,46.5 90,61 105,73.8 120,85.1 135,95.1 150,103.9 165,111.6 180,118.5 195,124.5 210,129.9 225,134.6 240,138.8 255,142.4 270,145.7 285,148.5 300,151.1" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="60" y1="30" x2="300" y2="151.1" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="60" cy="30" r="4.5" fill="#1f2a44"/>
  <circle cx="300" cy="151.1" r="4.5" fill="#1f2a44"/>
  <circle cx="180" cy="90.5" r="5" fill="#b4232c"/>
  <text x="190" y="82" font-size="11" fill="#b4232c">midpoint</text>
  <text x="230" y="40" font-size="12" fill="#1f2a44">above: convex</text>
  <text x="70" y="160" font-size="12" fill="#1f2a44">below: not convex</text>
  <text x="310" y="170" font-size="11" fill="#1f2a44">z</text>
</svg>
```
:::

::: context exp-cone The exponential cone
As the second-order cone captures "length at most a number", the **exponential cone** captures constraints like $y\,e^{x/y} \le w$, which covers exponentials and logarithms. Solvers such as SCS, Clarabel and MOSEK support it. Interior-point theory works there too, but its barrier is more complicated, and the small solvers written for embedded flight computers usually stick to linear and second-order cones.
:::

::: context taylor-picture The tangent line and the parabola
Here is $e^{-x}$ (dark) with its tangent line $1-x$ (red, always below) and its parabola $1-x+x^2/2$ (blue, always above for $x\ge0$). The range is stretched to $x = 1.5$ to show the gaps. In the real burn, $x = z-z_0$ never passes $0.075$, where all three are nearly on top of each other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="175" x2="50" y2="25" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="50,40 68,52.4 86,63.6 104,73.7 122,82.9 140,91.2 158,98.7 176,105.4 194,111.6 212,117.1 230,122.2 248,126.7 266,130.8 284,134.6 302,137.9 320,141" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <polyline points="50,40 68,52.3 86,63.4 104,73.2 122,81.6 140,88.8 158,94.6 176,99.2 194,102.4 212,104.3 230,105 248,104.3 266,102.4 284,99.1 302,94.6 320,88.8" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="50" y1="40" x2="230" y2="170" stroke="#b4232c" stroke-width="2"/>
  <text x="255" y="84" font-size="11" fill="#1d6fd1">1 − x + x²/2</text>
  <text x="255" y="152" font-size="11" fill="#1f2a44">e^(−x)</text>
  <text x="150" y="160" font-size="11" fill="#b4232c">1 − x</text>
  <text x="325" y="185" font-size="11" text-anchor="end" fill="#1f2a44">x = z − z0</text>
  <text x="44" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
</svg>
```
:::

::: context soc-3d The ice-cream cone
The second-order cone in three dimensions is the set of points $(x_1, x_2, t)$ with $\sqrt{x_1^2+x_2^2} \le t$. It is an upright ice-cream cone with its tip at the origin: at height $t$, the slice is a disk of radius $t$. It is also called the Lorentz cone, after the physicist, because the same shape appears as the light cone in relativity. The thrust cone $\|\mathbf{u}\|\le\sigma$ is its four-dimensional cousin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M180,160 L100,40 A80,18 0 0,0 260,40 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="180" cy="40" rx="80" ry="18" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="180" y2="20" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="40" x2="260" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="34" font-size="11" text-anchor="middle" fill="#1f2a44">radius t</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">t</text>
  <text x="188" y="168" font-size="11" fill="#1f2a44">tip at 0</text>
  <text x="270" y="100" font-size="11" fill="#1f2a44">length of (x1, x2) ≤ t</text>
</svg>
```
:::

::: context zoh Why "zero-order hold"
A **hold** is what a digital computer does between updates: it sends a command and keeps it there until the next one. Holding the value constant is the zero-order hold (a polynomial of degree zero); ramping it linearly would be first-order. With $\mathbf{u}$ held constant over a step, the position and velocity updates are the exact constant-acceleration formulas from school physics, so no accuracy is lost between nodes. Lesson six looks at what else survives this chopping into steps.
:::
