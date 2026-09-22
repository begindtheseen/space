---
id: l05-region-of-attraction-estimation
title: Estimating the region of attraction
minutes: 22
covers:
  - 'Region of attraction estimation, including sum-of-squares approaches'
---

"Locally asymptotically stable" is a statement with a hole in it, and the previous lessons have now shown the hole three times: a pitch trim with $\zeta = 0.39$ whose basin ends $5.3^\circ$ away, a loop with eigenvalues $-0.15 \pm 0.989j$ that diverges past an amplitude of two, and an attitude law whose proof quietly restricted attention to $V \lt 4K$. Closing that hole means producing a **region of attraction**: a set of initial states from which the closed loop is guaranteed to converge.

The exact region is rarely available. What is available, and what flight programs actually use, is a *certified subset* — a region you can prove is inside the true one. The construction is one idea deep: a sublevel set of a Lyapunov function on which $\dot{V} \lt 0$ cannot be escaped, so every state in it converges. All the work is in choosing $V$ well, because a poor $V$ gives a true but useless answer.

This lesson gives the construction, computes it for two systems whose true basin you already know from earlier lessons so the conservatism can be measured, and then explains the method that automates the search for $V$: sum-of-squares programming, which turns "this polynomial is never negative" into a semidefinite program a computer can solve.

## What the exact region looks like

The **region of attraction** of an asymptotically stable equilibrium $\mathbf{x}_e$ is

$$
\mathcal{R} = \left\{\mathbf{x}_0 : \text{the solution from } \mathbf{x}_0 \text{ exists for all } t \ge 0 \text{ and } \mathbf{x}(t) \to \mathbf{x}_e\right\} .
$$

It is an open, connected, invariant set. Its boundary is built from other invariant sets — the stable manifolds of nearby saddles, unstable limit cycles, and in higher dimensions objects with no name you would want to write in a requirements document. The phase-plane lesson found such a boundary twice by bisection, which works in two dimensions and becomes hopeless in six.

So the practical target is not $\mathcal{R}$ but a set $\Omega \subseteq \mathcal{R}$ that you can certify, ideally as large as you can make it.

## The sublevel-set construction

Let $V$ be positive definite on a region $D$ containing the equilibrium, with $\dot{V}(\mathbf{x}) \lt 0$ for every $\mathbf{x} \ne \mathbf{x}_e$ in $D$. Take the sublevel set $\Omega_c = \{\mathbf{x} : V(\mathbf{x}) \le c\}$.

If $\Omega_c$ is bounded and contained in $D$, then it is contained in $\mathcal{R}$. The argument is the one from the direct method: a trajectory starting in $\Omega_c$ can never leave it, because leaving would require $V$ to increase through the boundary, and $\dot{V} \lt 0$ forbids that. Trapped in $\Omega_c$ with $\dot{V} \lt 0$, it converges to $\mathbf{x}_e$.

Everything then reduces to finding the largest admissible $c$. Since $\dot{V} \lt 0$ fails first where $\dot{V} = 0$, the answer is

$$
c^* = \min_{\mathbf{x}\,\ne\,\mathbf{x}_e,\ \dot{V}(\mathbf{x})\,=\,0} V(\mathbf{x}) ,
$$

and $\Omega_c$ for any $c \lt c^*$ is certified. Geometrically: grow the level surface of $V$ outward from the equilibrium and stop the instant it touches the surface on which $\dot{V}$ changes sign.

::: key Certified region of attraction
Given $V$ positive definite with $\dot{V} \lt 0$ on a neighbourhood of the equilibrium, put $c^* = \min\{V(\mathbf{x}) : \dot{V}(\mathbf{x}) = 0,\ \mathbf{x} \ne \mathbf{x}_e\}$. Every bounded sublevel set $\{V \lt c\}$ with $c \le c^*$ lies inside the true region of attraction. The estimate is a subset, never the whole region, and its size depends entirely on the choice of $V$.
:::

For a quadratic $V = \mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z}$ with $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$, the standard choice of $\mathbf{P}$ comes from the Jacobian: solve

$$
\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}
$$

for a chosen positive definite $\mathbf{Q}$. Then $\dot{V} = -\mathbf{z}^\mathsf{T}\mathbf{Q}\mathbf{z} + 2\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{g}(\mathbf{z})$, negative near the origin and turning positive somewhere out in the nonlinear terms $\mathbf{g}$. $\mathbf{Q}$ is a free design choice, and it changes the *shape* of the ellipse, which changes how far it can grow before touching. Trying several is the cheapest way to improve an estimate.

::: example How much of the truth a quadratic certificate captures
Take the loop from the linearisation lesson, $\ddot{x} + \mu(1 - x^2)\dot{x} + x = 0$ with $\mu = 0.3$, written as $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - \mu(1 - x_1^2)x_2$. Its true region of attraction is the interior of an unstable limit cycle that crosses the $x_2 = 0$ axis at $x_1 = \pm2.00092$, measured by bisection.

The Jacobian at the origin is $\mathbf{A} = \begin{bmatrix}0 & 1\\ -1 & -0.3\end{bmatrix}$. Solving $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{I}$ by hand: writing $\mathbf{P} = \begin{bmatrix}p & q\\ q & r\end{bmatrix}$, the three equations are $-2q = -1$, $2q - 0.6r = -1$ and $p - 0.3q - r = 0$, giving $q = 0.5$, $r = 10/3$, $p = 3.48333$. The nonlinear remainder is $\mathbf{g} = (0,\ \mu x_1^2x_2)$, so

$$
\dot{V} = -x_1^2 - x_2^2 + 2\mu x_1^2 x_2\left(q x_1 + r x_2\right).
$$

Sweeping $7200$ rays from the origin and bisecting for the first radius at which $\dot{V} = 0$ gives $c^* = 6.77318$, first touched at $(0.9592, 0.9007)$. The certified ellipse $\mathbf{z}^\mathsf{T}\mathbf{P}\mathbf{z} \lt 6.77318$ crosses the axes at $x_1 = \pm1.3944$ and $x_2 = \pm1.4255$.

So the certificate reaches $1.394$ where the truth reaches $2.001$: **70 per cent** of the true extent along that axis. As a check, $2001$ points spaced around the certified boundary were integrated for $150\,\mathrm{s}$; all $2001$ converged to the origin, as they must.

Changing $\mathbf{Q}$ changes the answer:

| $\mathbf{Q}$ | $c^*$ | Axis crossing $x_1$ |
| --- | --- | --- |
| $\mathrm{diag}(1, 1)$ | $6.7732$ | $1.3944$ |
| $\mathrm{diag}(1, 0.2)$ | $3.3073$ | $1.2403$ |
| $\mathrm{diag}(1, 3)$ | $12.2677$ | $1.3415$ |
| $\mathrm{diag}(3, 1)$ | $12.0460$ | $1.3010$ |

All four are valid certificates; they differ by 12 per cent in reach. None can do better than about $70$ per cent, because the true basin is bounded by a limit cycle that is nothing like an ellipse, and an ellipse inscribed in it loses the corners. Getting past that needs a $V$ that is not quadratic.
:::

::: example The certified gust margin for the pitch trim
Return to the vehicle at $\delta = 4.80^\circ$, whose true basin the phase-plane lesson measured: incidence from $1.54^\circ$ to $15.36^\circ$ from rest — that is $-8.54^\circ$ to $+5.28^\circ$ about the trim at $10.080^\circ$ — and rate gusts from $-43.24\,^\circ\mathrm{/s}$ to $+15.92\,^\circ\mathrm{/s}$.

Write $z_1 = \alpha - \alpha^*$ and $z_2 = \dot{\alpha}$. Expanding the cubic about the trim, the exact shifted dynamics are

$$
\dot{z}_1 = z_2, \qquad
\dot{z}_2 = a_1 z_1 - 2 z_2 + a_m\left(18\alpha^* z_1^2 + 6 z_1^3\right),
$$

with $a_1 = a_m(-0.9 + 18\alpha^{*2}) = -6.7210\,\mathrm{s^{-2}}$ — no approximation, the constant terms cancel because $\alpha^*$ is a trim. The Jacobian is $\begin{bmatrix}0 & 1\\ -6.7210 & -2\end{bmatrix}$, and the quadratic term $18\alpha^*z_1^2$ dominates the cubic near the trim, which is why the certified region is strongly asymmetric in truth even though the ellipse is not.

Solving the Lyapunov equation and sweeping as before:

| $\mathbf{Q}$ | $c^*$ | Certified $\lvert\Delta\alpha\rvert$ | Certified $\lvert\Delta\dot{\alpha}\rvert$ |
| --- | --- | --- | --- |
| $\mathrm{diag}(1, 1)$ | $0.003806$ | $2.451^\circ$ | $6.596\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(20, 1)$ | $0.048648$ | $4.067^\circ$ | $12.676\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(60, 1)$ | $0.133132$ | $4.131^\circ$ | $13.270\,^\circ\mathrm{/s}$ |
| $\mathrm{diag}(120, 1)$ | $0.252634$ | $4.092^\circ$ | $13.265\,^\circ\mathrm{/s}$ |

The best of these, $\mathbf{Q} = \mathrm{diag}(60,1)$, certifies $\pm4.13^\circ$ of incidence and $\pm13.27\,^\circ\mathrm{/s}$ of rate about the trim, against true limits of $+5.28^\circ$ and $+15.92\,^\circ\mathrm{/s}$ on the binding side: $78$ and $83$ per cent. Integrating $2001$ points spaced around that certified ellipse for $40\,\mathrm{s}$ returns all $2001$ to the trim.

Two things are worth taking from the table. First, the default $\mathbf{Q} = \mathbf{I}$ gives less than half the reach of a weighted one — with states in radians and radians per second, an unweighted $\mathbf{Q}$ is an arbitrary statement about the relative importance of an angle and a rate, and it costs you. Second, past $\mathbf{Q} = \mathrm{diag}(60,1)$ the estimate stops improving: the family of quadratics has been used up, and the remaining $20$ per cent needs a better function, not a better weight.
:::

## Sum of squares: letting a solver choose $V$

Searching over quadratics by hand is a weak method. The general version searches over polynomials, and it works because of one reformulation.

Deciding whether a polynomial $p(\mathbf{x})$ is non-negative everywhere is hard. Deciding whether it is a **sum of squares** — $p = \sum_i \sigma_i(\mathbf{x})^2$ for some polynomials $\sigma_i$ — is a semidefinite program, because $p$ is a sum of squares exactly when it can be written

$$
p(\mathbf{x}) = \mathbf{z}(\mathbf{x})^\mathsf{T}\mathbf{G}\,\mathbf{z}(\mathbf{x}),
\qquad \mathbf{G} = \mathbf{G}^\mathsf{T} \succeq 0 ,
$$

where $\mathbf{z}$ is the vector of monomials up to half the degree of $p$. Matching coefficients makes the entries of $\mathbf{G}$ linear in the unknowns, and "$\mathbf{G}$ positive semidefinite" is a convex constraint. Factor $\mathbf{G} = \sum_i \lambda_i \mathbf{v}_i\mathbf{v}_i^\mathsf{T}$ and each eigenvector supplies one square.

Work one through. Take $p = x_1^4 + x_1^2x_2^2 + x_2^4$ with $\mathbf{z} = (x_1^2,\ x_1x_2,\ x_2^2)^\mathsf{T}$. Matching coefficients,

$$
\mathbf{G} = \begin{bmatrix} 1 & 0 & \lambda \\ 0 & 1 - 2\lambda & 0 \\ \lambda & 0 & 1\end{bmatrix} ,
$$

because the $x_1^2x_2^2$ coefficient receives $2\lambda$ from the corner entries and $1 - 2\lambda$ from the middle. Any $\lambda$ reproduces $p$; only some make $\mathbf{G}$ positive semidefinite, which needs $|\lambda| \le 1$ and $\lambda \le 1/2$. Choosing $\lambda = 1/2$ gives eigenvalues $1.5$, $0.5$, $0$ with eigenvectors $(1,0,1)/\sqrt{2}$, $(1,0,-1)/\sqrt{2}$ and $(0,1,0)$, so

$$
p = \tfrac{3}{4}\left(x_1^2 + x_2^2\right)^2 + \tfrac{1}{4}\left(x_1^2 - x_2^2\right)^2 .
$$

Expanding confirms it, and evaluating both sides at random points agrees to ten decimals. That two-line certificate is exactly what a solver produces, at scale, for polynomials in many variables.

::: key Sum of squares
A polynomial $p$ is a sum of squares if $p(\mathbf{x}) = \mathbf{z}(\mathbf{x})^\mathsf{T}\mathbf{G}\mathbf{z}(\mathbf{x})$ with $\mathbf{G} \succeq 0$ and $\mathbf{z}$ the monomial vector — a semidefinite feasibility problem. Sum of squares implies non-negative; the converse is false, the standard counterexample being $x_1^4x_2^2 + x_1^2x_2^4 - 3x_1^2x_2^2 + 1$, which is non-negative by the arithmetic–geometric mean inequality and is not a sum of squares. So the method is a sufficient test, which is what a certificate needs to be.
:::

For a region of attraction with polynomial dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$, the program is:

find a polynomial $V$ and a multiplier polynomial $\sigma$ such that

$$
V - \epsilon\,\mathbf{x}^\mathsf{T}\mathbf{x} \ \text{is SOS},
\qquad
-\dot{V} - \sigma(\mathbf{x})\left(c - V(\mathbf{x})\right) \ \text{is SOS},
\qquad
\sigma \ \text{is SOS},
$$

and maximise $c$. The first line makes $V$ positive definite. The second is the S-procedure: the multiplier $\sigma \ge 0$ makes the constraint bite only where $V \le c$, so it says "$\dot{V} \lt 0$ *inside the sublevel set*" without demanding it everywhere. The whole thing is bilinear in the unknowns — $\sigma$ multiplies $V$ — so it is solved by alternating: fix $V$ and solve for $\sigma$ and $c$, then fix $\sigma$ and solve for $V$, and repeat. The result is a certified region bounded by a higher-degree surface that can follow the true basin far more closely than an ellipse, and for the reversed van der Pol system a quartic $V$ recovers most of the remaining $30$ per cent.

::: note
Sum-of-squares work needs a semidefinite solver, which this module does not assume you have installed; the quadratic computations above use nothing but a linear solve and a sweep. Tedrake's *Underactuated Robotics* course is the standard free treatment of the polynomial case and includes working code, and the regions it certifies for walking robots and perching gliders are the same construction as the ellipse above with $V$ of higher degree.
:::

::: warning
Scaling is not cosmetic here. The same system in radians and in degrees gives different $\mathbf{P}$, a different $c^*$ and, once you convert back, a different certified region — because $\mathbf{Q} = \mathbf{I}$ means something different in each. Non-dimensionalise the states, or choose $\mathbf{Q}$ deliberately from the magnitudes you care about, before reporting a number.
:::

::: warning
Never report a Lyapunov estimate as "the region of attraction". It is a lower bound, and the gap can be large: an ellipse inside a long thin true basin may certify a small fraction of it. The correct sentence is "recovery is guaranteed from this set", with the shape stated. Simulation can then probe outside it to see how much margin is really there — the two methods answer different questions and belong in the same report.
:::

## Check yourself

::: check
For $\dot{x} = -x + x^3$ with $V = \tfrac{1}{2}x^2$, compute $c^*$ and the certified region. Compare with the true region of attraction.
:::

::: answer
$\dot{V} = -x^2 + x^4 = -x^2(1 - x^2)$, which is zero at $x = 0$ and at $x = \pm1$. So $c^* = V(\pm1) = 1/2$, and the certified region is $\{V \lt 1/2\} = \{|x| \lt 1\}$. The true region is also $|x| \lt 1$, since $x = \pm1$ are equilibria. Here the estimate is exact, which happens when the nearest obstruction is itself an equilibrium lying on a level set of $V$. In two or more dimensions this alignment is rare and the estimate is strictly conservative.
:::

::: check
Explain why the certified set must be a *bounded* sublevel set, with an example of what goes wrong otherwise.
:::

::: answer
The argument is "the trajectory cannot leave $\Omega_c$, and inside it $V$ decreases, so it converges". If $\Omega_c$ is unbounded the trajectory can stay inside while running off to infinity, with $V$ decreasing the whole way, and nothing converges. The standard example is $V = x_1^2/(1 + x_1^2) + x_2^2$, whose level set $V = 1$ is the unbounded curve $x_2^2 = 1/(1 + x_1^2)$. In practice, check boundedness by confirming that the connected component of $\{V \le c\}$ containing the equilibrium is closed and bounded; for a quadratic $V$ with $\mathbf{P} \succ 0$ every sublevel set is an ellipsoid and this is automatic.
:::

::: check
You have certified $\pm4.13^\circ$ of incidence for the pitch case and the requirement is $\pm5^\circ$. Give three things you could try, in order of effort.
:::

::: answer
First, re-weight $\mathbf{Q}$ — free, and the table shows it moved the answer from $2.45^\circ$ to $4.13^\circ$, though it has now saturated. Second, enlarge the $V$ family: a quartic $V$ found by sum-of-squares can follow the asymmetric basin, which here is $-8.54^\circ$ on one side and $+5.28^\circ$ on the other, where a symmetric ellipse must fit inside the smaller one and waste the rest. Third, change the plant or the controller: back the elevator off from $4.80^\circ$ so the trim moves away from the fold, or add rate feedback to increase the damping term, both of which enlarge the true basin rather than only the estimate. Note the ordering — the first two improve the certificate, the third improves the vehicle.
:::

::: check
Why does the sum-of-squares program need the multiplier $\sigma(\mathbf{x})$ at all? What would go wrong if you asked for $-\dot{V}$ to be SOS outright?
:::

::: answer
Requiring $-\dot{V}$ to be a sum of squares demands $\dot{V} \le 0$ *everywhere in the state space*, which is far stronger than needed and usually infeasible: for the reversed van der Pol system $\dot{V}$ is genuinely positive outside the limit cycle, so no $V$ of any degree satisfies it. The multiplier implements the conditional statement instead. Since $\sigma \ge 0$ and $c - V \ge 0$ inside the sublevel set, the expression $-\dot{V} - \sigma(c - V)$ being non-negative there forces $-\dot{V} \ge \sigma(c - V) \ge 0$ inside, while outside the set the term $\sigma(c - V)$ is negative and the constraint becomes vacuous. That is the S-procedure: trading a conditional inequality for an unconditional one at the price of an extra unknown.
:::

::: check
The quaternion attitude proof gave the region $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0) \lt 4K$ without any sweeping or optimisation. Why was that case so much easier?
:::

::: answer
Because $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ exactly, with no nonlinear remainder at all — the gyroscopic term dropped out identically and the proportional term cancelled by construction. There is therefore no surface where $\dot{V}$ changes sign, and the only limit on $c$ is that the sublevel set must exclude the other equilibrium at $q_0 = -1$, which fixes $c^* = 4K$ immediately. The sweeping in this lesson exists because a quadratic $V$ built from a Jacobian leaves a genuine remainder $\mathbf{g}(\mathbf{z})$ behind. A candidate constructed from the physics, rather than from the linearisation, often avoids the problem entirely — which is the strongest practical argument for the energy-plus-potential recipe.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathcal{R}$ | True region of attraction; boundary built from saddle stable manifolds and unstable cycles |
| $\Omega_c = \{V \le c\}$ | Certified region when bounded and inside $\{\dot{V} \lt 0\}$ |
| $c^* = \min\{V : \dot{V} = 0,\ \mathbf{x} \ne \mathbf{x}_e\}$ | Largest admissible level |
| $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ | Quadratic candidate; $\mathbf{Q}$ sets the ellipse shape and the reach |
| Reversed van der Pol, $\mathbf{Q} = \mathbf{I}$ | $\mathbf{P} = \begin{bmatrix}3.4833 & 0.5\\ 0.5 & 3.3333\end{bmatrix}$, $c^* = 6.773$, reach $1.394$ against a true $2.001$ |
| Pitch trim, $\mathbf{Q} = \mathrm{diag}(60,1)$ | $c^* = 0.1331$; certifies $\pm4.13^\circ$ and $\pm13.27\,^\circ\mathrm{/s}$ against true $+5.28^\circ$, $+15.92\,^\circ\mathrm{/s}$ |
| $p = \mathbf{z}^\mathsf{T}\mathbf{G}\mathbf{z}$, $\mathbf{G} \succeq 0$ | Sum of squares as a semidefinite program |
| $x_1^4 + x_1^2x_2^2 + x_2^4$ | $= \tfrac{3}{4}(x_1^2 + x_2^2)^2 + \tfrac{1}{4}(x_1^2 - x_2^2)^2$ |
| Motzkin polynomial | Non-negative but not a sum of squares; SOS is sufficient, not necessary |
| $-\dot{V} - \sigma(c - V)$ SOS, $\sigma$ SOS | S-procedure form of "$\dot{V} \lt 0$ inside $\{V \le c\}$"; solved by alternating |

A region of attraction answers "how far from the set point may I start". It says nothing about a disturbance that keeps pushing — a thruster plume, an unmodelled torque, a gust field the vehicle flies through for a minute. The next lesson introduces the notion built for that question, input-to-state stability, which bounds the state by a decaying term plus a function of the worst disturbance seen so far.
