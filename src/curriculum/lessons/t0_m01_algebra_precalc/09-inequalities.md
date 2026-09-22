---
id: l09-inequalities
title: Inequalities and design constraints
minutes: 19
covers:
  - inequalities
---

An equation says what a quantity *is*. Most of what an engineer has to say about a vehicle is what a quantity *must not exceed* or *must at least reach*: thrust must exceed weight or the vehicle stays on the pad; dynamic pressure must stay below the structural limit or the fairing fails; the navigation error must be inside the landing ellipse; the orbital radius must be at least the planet's radius for the model to mean anything. Those are **inequalities**, and a design is a set of them all satisfied at once. The requirements document for a launch vehicle is, at bottom, a long list of $\leq$ and $\geq$ signs.

Inequalities are solved with almost the same moves as equations — add to both sides, multiply both sides — with one difference that causes nearly every error: multiplying or dividing by a negative number reverses the direction of the sign. This lesson derives that rule from the number line rather than stating it, extends the legal moves to reciprocals, squares, roots and logarithms, and then works through the kinds of inequality that arise in practice: linear, absolute-value (tolerances), quadratic (a height that must exceed a threshold), and inequalities with functions in them (an exponential that must fall below a limit).

The answer to an inequality is a *set*, usually an interval or a union of intervals, and you will write it in the interval notation from the functions lesson. Get used to answers that are ranges. Most real answers are.

## What an inequality says

The symbols $<$, $\leq$, $>$, $\geq$ compare two real numbers by their positions on the number line: $a < b$ means $a$ lies to the left of $b$, and $a \leq b$ allows them to coincide. Every pair of real numbers satisfies exactly one of $a < b$, $a = b$, $a > b$. An inequality with an unknown, such as $3x - 7 < 5$, is a statement that is true for some values of $x$ and false for others; to **solve** it is to find the set of all values that make it true, the **solution set**.

A **compound inequality** combines two conditions. "And" is written as a chain, $2 < x \leq 5$, meaning both $2 < x$ and $x \leq 5$, which is the interval $(2, 5]$. "Or" is written with the word or the union sign: $x < -1$ or $x > 3$ is $(-\infty, -1) \cup (3, \infty)$. A chain always reads with both signs pointing the same way; $2 < x > 5$ is not a statement.

## The legal moves

Two inequalities are **equivalent** if they have the same solution set, and, as with equations, the legal moves are the ones that preserve it. Picture $a < b$ as two points on the number line, $a$ to the left.

**Adding the same number to both sides** slides both points the same distance the same way; the one on the left stays on the left. So $a < b$ implies $a + c < b + c$ for any $c$, positive or negative. Subtraction is adding a negative. This is why terms move across an inequality sign exactly as they do across an equals sign.

**Multiplying both sides by a positive number** $k$ stretches the line away from zero (or shrinks it towards zero) without flipping it: $ka < kb$. Division by a positive number is multiplication by its reciprocal.

**Multiplying both sides by a negative number** reflects the line through zero. A point that was on the left is now on the right: if $a < b$ then $-a > -b$. Test it: $2 < 5$, and $-2 > -5$, because $-2$ is to the right of $-5$. In general,

$$
a < b \;\text{ and }\; k < 0 \quad\Rightarrow\quad ka > kb .
$$

Solve $-3x + 7 > 1$: subtract $7$, $-3x > -6$; divide by $-3$ and *reverse*, $x < 2$. The solution set is $(-\infty, 2)$. Check with a value in it, $x = 0$: $7 > 1$, true. Check with one outside, $x = 3$: $-2 > 1$, false. Testing one point on each side of the boundary is the cheapest check there is and you should do it every time.

**Multiplying by an unknown** is the trap. If you multiply both sides of $\frac{1}{x} < 2$ by $x$, you do not know whether you reversed the sign, because you do not know the sign of $x$. Either split into cases ($x > 0$: $1 < 2x$, so $x > \tfrac{1}{2}$; $x < 0$: $1 > 2x$, so $x < \tfrac{1}{2}$, which with $x < 0$ is all negative $x$), or better, bring everything to one side and use the sign-chart method below. The solution is $x < 0$ or $x > \tfrac{1}{2}$ — and notice that the naive move, "$1 < 2x$ so $x > \tfrac{1}{2}$", silently lost every negative solution.

::: warning Reverse the sign when you multiply or divide by a negative
$-2x \leq 8$ becomes $x \geq -4$, not $x \leq -4$. Test a number: $x = 0$ satisfies $-2x \leq 8$ ($0 \leq 8$), and $0 \geq -4$ is true while $0 \leq -4$ is false. When the coefficient of the unknown is negative, either divide and reverse, or add the term to the other side first so that the coefficient becomes positive — $-2x \leq 8$ is $0 \leq 8 + 2x$, so $-4 \leq x$. Both routes agree; the second one never needs a rule you can forget.
:::

### Applying functions to both sides

You may apply the same function to both sides of an inequality provided you know how it orders its outputs. An **increasing** function (bigger input, bigger output) preserves the inequality; a **decreasing** function reverses it; a function that does neither over the relevant range cannot be applied at all without splitting into cases.

- Adding a constant and multiplying by a positive constant are increasing: that is the first two rules above.
- $\sqrt{x}$, $x^3$, $e^x$ and $\ln x$ are increasing on their domains, so $a < b \Rightarrow \sqrt{a} < \sqrt{b}$ (for $a, b \geq 0$), $e^a < e^b$, $\ln a < \ln b$ (for $a, b > 0$).
- $1/x$ is decreasing on the positives: $0 < a < b \Rightarrow \frac{1}{a} > \frac{1}{b}$. Two is less than five and a half is more than a fifth. Across zero the rule fails: $-1 < 2$ but $-1 > \tfrac{1}{2}$, so never take reciprocals of both sides unless both are known to have the same sign.
- $x^2$ is increasing only for $x \geq 0$. For non-negative $a, b$, $a < b \Leftrightarrow a^2 < b^2$; with a negative side, squaring can reverse or destroy the inequality ($-3 < 2$ but $9 > 4$). Speeds, masses and distances are non-negative, so $v^2 < 2\mu/r$ and $v < \sqrt{2\mu/r}$ are equivalent for them, and that is how the escape-speed bound is read in either direction.

The atmospheric model of the logarithms lesson gives a clean case. Where is the density below a thousandth of sea level, $e^{-h/H} < 10^{-3}$? Take $\ln$ of both sides — legal, since $\ln$ is increasing and both sides are positive: $-h/H < \ln 10^{-3} = -\ln 1000$. Multiply by $-H$, a negative number, and reverse: $h > H \ln 1000 = 8.5 \times 6.908 = 58.7\,\mathrm{km}$. The answer is the half-line $(58.7, \infty)\,\mathrm{km}$, and every altitude above it satisfies the requirement, which is the sense in which a constraint is met "with margin".

## Absolute values and tolerances

The absolute value $|x|$ is the distance from $x$ to zero, and $|x - a|$ is the distance from $x$ to $a$. So an absolute-value inequality is a statement about distance:

$$
|x - a| < \delta \quad\Leftrightarrow\quad a - \delta < x < a + \delta ,
$$

"$x$ is within $\delta$ of $a$", an open interval centred on $a$. The other direction,

$$
|x - a| > \delta \quad\Leftrightarrow\quad x < a - \delta \;\text{ or }\; x > a + \delta ,
$$

is everything *outside* that interval — two half-lines, an "or", never a chain. The $\leq$ and $\geq$ versions include the endpoints. Every tolerance is an inequality of this form: "$300 \pm 5\,\mathrm{psi}$" is $|p - 300| \leq 5$, that is $295 \leq p \leq 305$. A landing requirement that the touchdown point be within $10\,\mathrm{m}$ of the pad centre in each axis is $|x| \leq 10$ and $|y| \leq 10$. A guidance loop declaring "converged when $|\text{error}| < 0.01\,\mathrm{m/s}$" is testing exactly this.

Solve $|2x - 3| \leq 7$: rewrite as $-7 \leq 2x - 3 \leq 7$, add $3$ throughout ($-4 \leq 2x \leq 10$), divide by $2$ ($-2 \leq x \leq 5$). The solution is $[-2, 5]$. Check the endpoints: $|{-4} - 3| = 7$ and $|10 - 3| = 7$, both included.

One inequality about absolute values is worth knowing by name. The **triangle inequality**,

$$
|a + b| \leq |a| + |b| ,
$$

says the magnitude of a sum never exceeds the sum of the magnitudes; equality holds exactly when $a$ and $b$ have the same sign. It is how error budgets are combined conservatively — if one source contributes at most $3\,\mathrm{m}$ and another at most $4\,\mathrm{m}$, the total is at most $7\,\mathrm{m}$ — and it becomes the statement about vectors, and about the lengths of the sides of a triangle, that gives it its name.

::: example A propellant-temperature window
A kerosene load must be kept between $3$ and $8\,^\circ\mathrm{C}$ inclusive, but the tank farm's sensors read in Fahrenheit. With $C = \tfrac{5}{9}(F - 32)$ from the functions lesson, the requirement is the compound inequality

$$
3 \leq \tfrac{5}{9}(F - 32) \leq 8 .
$$

Multiply all three parts by $\tfrac{9}{5}$, a positive number, so the signs stand: $5.4 \leq F - 32 \leq 14.4$. Add $32$ throughout: $37.4 \leq F \leq 46.4$. The operator's limits are $[37.4, 46.4]\,^\circ\mathrm{F}$. The same window written as a tolerance is centred at $41.9$ with half-width $4.5$: $|F - 41.9| \leq 4.5$. Check by converting an endpoint back: $\tfrac{5}{9}(46.4 - 32) = \tfrac{5}{9}(14.4) = 8.0\,^\circ\mathrm{C}$.
:::

## Quadratic and rational inequalities: the sign chart

When the unknown appears squared, or in a denominator, you cannot isolate it by the moves above. Instead: bring every term to one side so the inequality reads $f(x) > 0$ (or $<$, $\geq$, $\leq$); find the points where $f$ is zero or undefined; and note that $f$ can only change sign at those points, so on each interval between them it is either entirely positive or entirely negative. Test one number from each interval, then read off which intervals satisfy the inequality. This is the **sign chart**, and it works for any function you can factor.

For $x^2 - 5x + 6 < 0$: factor, $(x - 2)(x - 3) < 0$. The zeros are $2$ and $3$. Test $x = 0$: $(-2)(-3) = 6 > 0$. Test $x = 2.5$: $(0.5)(-0.5) < 0$. Test $x = 4$: $(2)(1) > 0$. The product is negative only between the roots, so the solution is $(2, 3)$. Geometrically, the parabola opens upward and dips below the axis between its two roots; for $> 0$ the answer would be the two outer pieces, $(-\infty, 2) \cup (3, \infty)$.

For a rational inequality like $\dfrac{x - 1}{x + 2} \geq 0$, the chart has a zero at $x = 1$ and an *undefined point* at $x = -2$. Test $x = -3$: $\frac{-4}{-1} > 0$. Test $x = 0$: $\frac{-1}{2} < 0$. Test $x = 2$: $\frac{1}{4} > 0$. The solution is $(-\infty, -2) \cup [1, \infty)$: the zero is included because of the $\geq$, the undefined point is never included. Note that you did not multiply through by $x + 2$, whose sign you did not know.

::: example When is the thrown object above 110 m?
The height $h(t) = 100 + 20t - 4.903t^2$ from the equations lesson. For which times is $h > 110\,\mathrm{m}$? Bring everything to one side: $100 + 20t - 4.903t^2 - 110 > 0$, that is $-4.903t^2 + 20t - 10 > 0$. Multiply by $-1$ and reverse: $4.903t^2 - 20t + 10 < 0$. The roots, by the quadratic formula, have discriminant $400 - 4(4.903)(10) = 203.9$, $\sqrt{203.9} = 14.28$, so

$$
t = \frac{20 \pm 14.28}{9.806} = 0.583\,\mathrm{s} \quad\text{or}\quad 3.496\,\mathrm{s} .
$$

The parabola $4.903t^2 - 20t + 10$ opens upward, so it is negative between its roots: the object is above $110\,\mathrm{m}$ for $t$ in $(0.583, 3.496)\,\mathrm{s}$, about $2.9$ seconds. Test $t = 2$: $h = 100 + 40 - 19.6 = 120.4 > 110$, consistent (and the maximum, as the functions lesson found). Test $t = 5$: $h = 100 + 100 - 122.6 = 77.4$, below. Had the threshold been $130\,\mathrm{m}$, above the peak, the discriminant would have been negative and the solution set empty — the algebra saying "never", which is the right answer.
:::

## Inequalities as design constraints

A requirement is an inequality with the design variable on one side. Solving it tells you the *feasible region*: the set of designs that meet the requirement.

**Lift-off.** A vehicle leaves the pad only if thrust exceeds weight, $T > m_0 g_0$. Designers ask for margin, typically a thrust-to-weight ratio of at least $1.2$: $T \geq 1.2\,m_0 g_0$. For $m_0 = 549\,\mathrm{t}$, $T \geq 1.2 \times 549\,000 \times 9.80665 = 6.46 \times 10^6\,\mathrm{N} = 6.46\,\mathrm{MN}$. Read the other way, at a fixed thrust of $7.6\,\mathrm{MN}$ the constraint bounds the mass: $m_0 \leq \dfrac{7.6 \times 10^6}{1.2 \times 9.80665} = 646\,\mathrm{t}$.

**Payload fraction.** From the rocket equation, $m_f/m_0 = e^{-\Delta v / v_e}$. If a mission needs at least $5\%$ of lift-off mass to arrive, $e^{-\Delta v/v_e} \geq 0.05$. Take $\ln$ (increasing): $-\Delta v / v_e \geq \ln 0.05 = -\ln 20$; multiply by $-v_e$ and reverse: $\Delta v \leq v_e \ln 20$. With $v_e = 3050\,\mathrm{m/s}$, $\Delta v \leq 3050 \times 2.996 = 9137\,\mathrm{m/s}$. Any single-stage mission demanding more than about $9.1\,\mathrm{km/s}$ from this engine cannot deliver five percent of its mass, structure included. That is the inequality that kills single-stage-to-orbit, and it is two legal moves long.

**Hovering.** A returning booster of mass $28\,\mathrm{t}$ can hover only if its engine can throttle down to exactly its weight, $T = m g_0 = 28\,000 \times 9.80665 = 275\,\mathrm{kN}$. If the engine's *minimum* thrust is about $480\,\mathrm{kN}$, then $T_{\min} > m g_0$ — the inequality is strict in the wrong direction — and the vehicle cannot hover: at minimum throttle it still decelerates at $T/m - g_0 = 480\,000/28\,000 - 9.81 = 7.3\,\mathrm{m/s^2}$. So the landing burn must be timed to reach zero velocity exactly at zero altitude, with no possibility of pausing to correct. An inequality that cannot be turned into an equality is a design fact, and here it is the reason a particular landing is flown the way it is.

::: example Fixed mass ratio, more payload, more propellant
The module's derivation exercise asks you to show that, at fixed mass ratio, adding payload forces more propellant *in the same proportion*. Set it up as the lessons so far allow. From $MR = m_0/m_f$ with $m_0 = m_d + m_p + m_L$ and $m_f = m_d + m_L$, the polynomials lesson showed $MR - 1 = m_p / m_f$, hence

$$
m_p = (MR - 1)(m_d + m_L) .
$$

Now compare two payloads $m_L' > m_L$ with everything else fixed. Subtracting the two versions of this identity, $m_p' - m_p = (MR - 1)(m_L' - m_L)$. Since $MR > 1$ (the first lesson: $m_0$ is $m_f$ plus a positive $m_p$), the factor $MR - 1$ is positive, and multiplying the true inequality $m_L' - m_L > 0$ by it preserves the direction: $m_p' - m_p > 0$. More payload means more propellant — and the *ratio* of the increase is $(m_p' - m_p)/(m_L' - m_L) = MR - 1$, a constant. With $MR = 12.08$ and $m_d = 22\,\mathrm{t}$: a payload of $15\,\mathrm{t}$ needs $11.08 \times 37 = 410\,\mathrm{t}$ of propellant, and $20\,\mathrm{t}$ needs $11.08 \times 42 = 465\,\mathrm{t}$; five tonnes of payload cost $55.4$ tonnes of propellant, eleven-fold. The step "multiplying by the positive number $MR - 1$ preserves the inequality" is the one-line justification the exercise asks for.
:::

::: key Solving inequalities
Add or subtract anything on both sides; multiply or divide by a positive number and keep the sign; multiply or divide by a negative number and **reverse** it; never multiply by an unknown whose sign you do not know. Increasing functions ($\sqrt{\ }$, $e^x$, $\ln$, $x^3$) preserve an inequality; decreasing ones ($1/x$ on positives) reverse it; $x^2$ preserves it only for non-negative sides. $|x - a| < \delta$ means $a - \delta < x < a + \delta$; $|x - a| > \delta$ means $x < a - \delta$ or $x > a + \delta$. For quadratics and quotients: move everything to one side, find zeros and undefined points, test each interval.
:::

::: note Inequalities in code
`if abs(v_err) < 0.01:` is $|v_{\text{err}}| < 0.01$. `if 3 <= T <= 8:` is a Python chain and reads exactly as the mathematics does. Comparing floating-point numbers for *equality* almost never works — two computations of the "same" value differ in the last bit — so real code tests closeness with an absolute-value inequality and a tolerance. The tolerance you pick is a design decision about how wrong you are willing to be.
:::

## Check yourself

::: check
Solve $5 - 2x \geq 3x + 20$ and write the solution in interval notation. Test one value inside and one outside.
:::

::: answer
Subtract $3x$: $5 - 5x \geq 20$. Subtract $5$: $-5x \geq 15$. Divide by $-5$ and reverse: $x \leq -3$, that is $(-\infty, -3]$. Test $x = -4$: $13 \geq 8$, true. Test $x = 0$: $5 \geq 20$, false. (Or avoid the reversal: $5 - 20 \geq 3x + 2x$ gives $-15 \geq 5x$, $-3 \geq x$.)
:::

::: check
A tank's pressure must satisfy $|p - 300| < 12$ in psi. Write this as a chain, give the interval, and state the widest and narrowest allowed pressures.
:::

::: answer
$288 < p < 312$, the open interval $(288, 312)\,\mathrm{psi}$. Every pressure strictly between $288$ and $312$ is allowed; $288$ and $312$ themselves are not, because the inequality is strict.
:::

::: check
Solve $x^2 + 2x - 8 \geq 0$.
:::

::: answer
Factor: $(x + 4)(x - 2) \geq 0$; zeros at $-4$ and $2$. Test $x = -5$: $(-1)(-7) = 7 > 0$. Test $x = 0$: $(4)(-2) < 0$. Test $x = 3$: $(7)(1) > 0$. The solution is $(-\infty, -4] \cup [2, \infty)$, endpoints included because of $\geq$. The parabola opens upward and is at or above the axis outside its roots.
:::

::: check
For which orbital radii is the circular speed $v = \sqrt{\mu/r}$ less than $5\,\mathrm{km/s}$? Use $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.
:::

::: answer
$\sqrt{\mu/r} < 5000$. Both sides are non-negative, so squaring preserves the inequality: $\mu/r < 2.5 \times 10^7$. Both sides positive, so taking reciprocals reverses it: $r/\mu > 4 \times 10^{-8}$, and multiplying by the positive $\mu$: $r > 3.986 \times 10^{14} \times 4 \times 10^{-8} = 1.594 \times 10^7\,\mathrm{m} = 15\,940\,\mathrm{km}$. Circular orbits slower than $5\,\mathrm{km/s}$ are those with radius above about $15\,900\,\mathrm{km}$ (altitude above about $9\,600\,\mathrm{km}$). Sanity check: the function decreases with $r$, so "slower" must mean "further out".
:::

::: check
Why can you not solve $\dfrac{x + 3}{x - 1} < 2$ by multiplying both sides by $x - 1$? Solve it correctly.
:::

::: answer
The sign of $x - 1$ is unknown, so you would not know whether to reverse the inequality. Instead, subtract $2$: $\dfrac{x + 3}{x - 1} - 2 = \dfrac{x + 3 - 2(x - 1)}{x - 1} = \dfrac{5 - x}{x - 1} < 0$. Zero at $x = 5$, undefined at $x = 1$. Test $x = 0$: $\frac{5}{-1} < 0$, satisfies. Test $x = 2$: $\frac{3}{1} > 0$, fails. Test $x = 6$: $\frac{-1}{5} < 0$, satisfies. Solution: $(-\infty, 1) \cup (5, \infty)$. The naive multiplication would have given $x + 3 < 2x - 2$, so $x > 5$ only, losing every $x < 1$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Solution set | the set of values making the statement true; usually an interval or a union |
| Compound | "and" is a chain $a < x \leq b$; "or" is a union $(\cdot) \cup (\cdot)$ |
| Add/subtract | preserves direction, any sign |
| Multiply/divide | positive: preserves; negative: **reverses**; unknown sign: do not |
| Functions | increasing ($\sqrt{\ }$, $e^x$, $\ln$) preserve; decreasing ($1/x$ on positives) reverse; $x^2$ only on non-negatives |
| Absolute value | $\lvert x - a \rvert < \delta \Leftrightarrow a - \delta < x < a + \delta$; $\lvert x - a \rvert > \delta \Leftrightarrow x < a - \delta$ or $x > a + \delta$ |
| Triangle inequality | $\lvert a + b \rvert \leq \lvert a \rvert + \lvert b \rvert$ |
| Sign chart | one side zero; find zeros and undefined points; test each interval; include zeros for $\leq$, $\geq$; never include undefined points |
| Constraints | $T \geq 1.2\, m_0 g_0$; $e^{-\Delta v/v_e} \geq 0.05 \Leftrightarrow \Delta v \leq v_e \ln 20$; $\rho < \rho_0/1000 \Leftrightarrow h > H\ln 1000$ |
| Fixed $MR$ | $m_p = (MR - 1)(m_d + m_L)$, so more payload needs $(MR - 1)$ times as much more propellant |

The next lesson turns to the numbers themselves: what units they carry, how to convert between SI and US customary without losing a vehicle, and how the requirement that every term of an equation carry the same dimensions catches errors before they fly.
