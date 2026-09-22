---
id: l04-linear-and-quadratic-equations
title: Linear and quadratic equations
minutes: 16
covers:
  - linear and quadratic equations
---

Most of the algebra a GNC engineer does in a day is not solving for $x$. It is solving a *formula* for one of its symbols: the burnout mass in terms of the mass ratio, the orbital radius in terms of the period, the time of flight from a height. The numbers come last. So this lesson treats equation-solving as what it is — undoing operations in the reverse order they were applied, with the same operation on both sides — and applies it to formulas with letters in them as much as to equations with numbers.

Quadratics get the second half. They arise the moment anything is squared, which in mechanics is constantly: distance under constant acceleration, kinetic energy, the range to a point on a circle. You will derive the quadratic formula rather than recall it, meet the discriminant that tells you how many solutions exist before you compute any, and learn the one numerical trap in the formula that trips up production code.

Every solution below ends with a check by substitution. Make that reflex permanent now, while the equations are easy.

## What solving means

An equation is a statement that two expressions are equal for some values of the unknown. **Solving** means finding all such values, the **solution set**, and nothing else. Two equations are **equivalent** when they have the same solution set, and the legal moves are the ones that preserve it:

- add or subtract the same quantity on both sides;
- multiply or divide both sides by the same *non-zero* quantity;
- apply the same one-to-one operation to both sides (take the cube root, take the logarithm of positive quantities, and so on).

Squaring both sides is *not* on the list, because it can create solutions: $x = 3$ becomes $x^2 = 9$, which also allows $x = -3$. When you must square, check every candidate in the original equation afterwards. Dividing by an expression that might be zero is the other way to lose the thread, and it gets its own warning below.

## Linear equations

A linear equation in one unknown has the unknown to the first power only. Collect the unknown on one side, the constants on the other, divide:

$$
3x - 7 = 2x + 5 \;\Rightarrow\; 3x - 2x = 5 + 7 \;\Rightarrow\; x = 12 .
$$

Check: $3(12) - 7 = 29$ and $2(12) + 5 = 29$. With fractions, multiply through by the common denominator first, so the fractions disappear before you do anything else:

$$
\frac{x}{3} + \frac{x}{4} = 14 \;\Rightarrow\; 4x + 3x = 168 \;\Rightarrow\; 7x = 168 \;\Rightarrow\; x = 24 .
$$

With brackets, distribute first: $5(x - 2) = 3x + 8$ gives $5x - 10 = 3x + 8$, so $2x = 18$ and $x = 9$.

Two degenerate cases are worth recognising on sight. If the unknown cancels and what remains is true, as in $2(x + 1) = 2x + 2 \Rightarrow 2 = 2$, every value is a solution: the equation is an **identity**. If what remains is false, as in $2x + 1 = 2x + 3 \Rightarrow 1 = 3$, there is **no solution**. Both happen in real derivations, usually as a sign that two supposedly independent conditions were the same condition, or contradictory ones.

## Literal equations: solving a formula for a symbol

A **literal equation** has several symbols and you want one of them alone. The method is identical; the only new skill is treating the other letters as if they were numbers. Read the formula as a recipe — what was done to the symbol you want, in what order — and undo the steps in reverse.

Newton's second law $F = ma$ has $a$ multiplied by $m$; undo with a division: $a = F/m$. An engine delivering $F = 845\,\mathrm{kN}$ to a $25\,000\,\mathrm{kg}$ vehicle gives $a = 845\,000 / 25\,000 = 33.8\,\mathrm{m/s^2}$, about $3.4$ times $g$.

The constant-acceleration relation $v = v_0 + at$ has $t$ multiplied by $a$ and then $v_0$ added. Undo in reverse — subtract $v_0$, then divide by $a$: $t = (v - v_0)/a$. Reaching $7670\,\mathrm{m/s}$ from rest at a steady $3g$ acceleration ($a = 3 \times 9.80665 = 29.42\,\mathrm{m/s^2}$) would take $7670 / 29.42 \approx 261\,\mathrm{s}$.

When the symbol appears inside a root, square both sides (both sides are positive here, so nothing spurious appears). The pendulum period $T = 2\pi\sqrt{L/g}$ solved for $g$: divide by $2\pi$, square, then invert the fraction:

$$
\left(\frac{T}{2\pi}\right)^2 = \frac{L}{g} \;\Rightarrow\; g = \frac{4\pi^2 L}{T^2} .
$$

A one-metre pendulum swinging with $T = 2.006\,\mathrm{s}$ gives $g = 39.48/4.024 \approx 9.81\,\mathrm{m/s^2}$; this is how gravity was measured for two centuries.

When the symbol appears more than once, collect it. The propellant mass fraction $\zeta = \dfrac{m_p}{m_p + m_d}$ solved for $m_p$: multiply out, $\zeta m_p + \zeta m_d = m_p$; collect, $\zeta m_d = m_p - \zeta m_p = m_p(1 - \zeta)$; divide by $(1 - \zeta)$, which is non-zero because $\zeta < 1$:

$$
m_p = \frac{\zeta\, m_d}{1 - \zeta} .
$$

A stage with $\zeta = 0.949$ and $m_d = 22\,\mathrm{t}$ carries $m_p = 0.949 \times 22 / 0.051 \approx 409\,\mathrm{t}$, consistent with the $410\,\mathrm{t}$ that produced $\zeta$ in the first lesson (the difference is the rounding of $\zeta$ to three figures).

::: example Geostationary radius from the period
The circular-orbit period is $T = 2\pi\sqrt{r^3/\mu}$. Solve for $r$: divide by $2\pi$, square, multiply by $\mu$, take the cube root.

$$
r^3 = \frac{\mu T^2}{4\pi^2}, \qquad r = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} .
$$

A geostationary satellite completes one orbit per sidereal day, $T = 86\,164\,\mathrm{s}$. Then $\mu T^2 = 3.986 \times 10^{14} \times (8.6164 \times 10^4)^2 = 3.986 \times 10^{14} \times 7.424 \times 10^9 = 2.959 \times 10^{24}$; dividing by $4\pi^2 = 39.48$ gives $r^3 = 7.496 \times 10^{22}\,\mathrm{m^3}$, and the cube root is $r \approx 4.216 \times 10^7\,\mathrm{m} = 42\,164\,\mathrm{km}$. Subtracting Earth's radius gives the familiar geostationary altitude of about $35\,790\,\mathrm{km}$. Units: $\mathrm{m^3/s^2} \times \mathrm{s^2} = \mathrm{m^3}$, whose cube root is metres.
:::

## Quadratic equations by factoring

A **quadratic equation** has the unknown to the second power. Its standard form is $ax^2 + bx + c = 0$ with $a \neq 0$ — everything on one side, zero on the other. If the left side factors, the zero-product property from the previous lesson finishes it:

$$
2x^2 - 7x + 3 = 0 \;\Rightarrow\; (2x - 1)(x - 3) = 0 \;\Rightarrow\; x = \tfrac{1}{2} \text{ or } x = 3 .
$$

A quadratic has at most two real solutions, and a factoring solution finds both at once.

::: warning Never divide by the unknown
Faced with $x^2 = 2x$, the tempting move is to divide by $x$ and get $x = 2$. That discards the solution $x = 0$, because dividing by $x$ is illegal when $x = 0$ — and $x = 0$ is precisely one of the answers. Instead move everything to one side and factor: $x^2 - 2x = x(x - 2) = 0$, so $x = 0$ or $x = 2$. The same slip loses the trivial solution of many physics equations.
:::

## Completing the square and the quadratic formula

Most quadratics do not factor nicely. **Completing the square** rewrites $x^2 + px$ as a perfect square minus a correction, using $(x + \tfrac{p}{2})^2 = x^2 + px + \tfrac{p^2}{4}$:

$$
x^2 + 6x - 7 = 0 \;\Rightarrow\; x^2 + 6x + 9 = 7 + 9 \;\Rightarrow\; (x + 3)^2 = 16 \;\Rightarrow\; x + 3 = \pm 4 \;\Rightarrow\; x = 1 \text{ or } x = -7 .
$$

Do this once in general and you have the quadratic formula. Start from $ax^2 + bx + c = 0$, divide by $a$, move the constant across, and add the square of half the linear coefficient to both sides:

$$
x^2 + \frac{b}{a}x = -\frac{c}{a}
\;\Rightarrow\;
x^2 + \frac{b}{a}x + \frac{b^2}{4a^2} = \frac{b^2}{4a^2} - \frac{c}{a}
\;\Rightarrow\;
\left(x + \frac{b}{2a}\right)^2 = \frac{b^2 - 4ac}{4a^2} .
$$

Take the square root of both sides, remembering the $\pm$, and subtract $\frac{b}{2a}$:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} .
$$

The quantity under the root, $\Delta = b^2 - 4ac$, is the **discriminant**, and it tells you the shape of the answer before you compute it: two distinct real solutions if $\Delta > 0$, one repeated solution $x = -\frac{b}{2a}$ if $\Delta = 0$, and no real solutions if $\Delta < 0$. For $3x^2 + 2x + 5 = 0$, $\Delta = 4 - 60 = -56$: the parabola never crosses zero. Physically, a negative discriminant usually means the thing you asked for cannot happen — a line of sight that misses the planet, a velocity that is never reached.

Two more facts follow from the formula. Adding the two roots kills the $\pm$ term and multiplying them uses the difference of squares, giving **Vieta's relations**

$$
x_1 + x_2 = -\frac{b}{a}, \qquad x_1 x_2 = \frac{c}{a} .
$$

For $2x^2 - 7x + 3$: $\tfrac{1}{2} + 3 = 3.5 = \tfrac{7}{2}$ and $\tfrac{1}{2} \times 3 = 1.5 = \tfrac{3}{2}$. Vieta's relations are the fastest check on a pair of roots, and the second one is about to earn its keep.

::: example Time of flight of a thrown object
An object is launched upward at $20\,\mathrm{m/s}$ from a $100\,\mathrm{m}$ tower. Its height is $h(t) = 100 + 20t - \tfrac{1}{2}gt^2$ with $g = 9.80665\,\mathrm{m/s^2}$, so $\tfrac{1}{2}g = 4.903$. When does it hit the ground? Set $h = 0$ and put the equation in standard form with a positive leading coefficient by multiplying through by $-1$:

$$
4.903\,t^2 - 20t - 100 = 0, \qquad a = 4.903,\; b = -20,\; c = -100 .
$$

Discriminant: $\Delta = (-20)^2 - 4(4.903)(-100) = 400 + 1961.3 = 2361.3$, so $\sqrt{\Delta} = 48.59$. Then

$$
t = \frac{20 \pm 48.59}{9.806} = 6.99\,\mathrm{s} \quad\text{or}\quad -2.92\,\mathrm{s} .
$$

The negative root is a time before launch at which the same parabola would have passed through the ground; it is mathematically valid and physically irrelevant, so the answer is $t \approx 6.99\,\mathrm{s}$. Note that $-b = +20$ because $b$ itself is negative — the most common sign slip with the formula. Vieta check: the product of the roots should be $c/a = -100/4.903 = -20.40$, and $6.99 \times (-2.92) = -20.4$.
:::

## The numerically stable small root

When $b^2$ is much larger than $4ac$, the square root $\sqrt{b^2 - 4ac}$ is very nearly $|b|$. One of the two roots then computes $-b \pm \sqrt{\Delta}$ as the difference of two nearly equal numbers, and most of the significant figures cancel. This is **catastrophic cancellation**, and it is not a textbook curiosity — it appears whenever a quadratic has one large and one tiny root, such as a time step with a fast and a slow mode.

The fix is Vieta's product. Compute the large root, the one where $-b$ and $\pm\sqrt{\Delta}$ have the *same* sign and add, and get the small one by division:

$$
x_{\text{large}} = \frac{-b - \operatorname{sign}(b)\sqrt{b^2 - 4ac}}{2a}, \qquad x_{\text{small}} = \frac{c}{a\,x_{\text{large}}} .
$$

::: example Cancellation in a quadratic with one tiny root
Solve $x^2 - 2000x + 1 = 0$ keeping only four significant figures, as a cheap calculator or a hurried hand would. Here $\Delta = 4\,000\,000 - 4 = 3\,999\,996$, and to four figures $\sqrt{\Delta} = 2000$. The formula gives

$$
x_{\text{large}} = \frac{2000 + 2000}{2} = 2000, \qquad x_{\text{small}} = \frac{2000 - 2000}{2} = 0 .
$$

The small root has come out as zero — a $100\%$ error — even though every intermediate step was carried to four figures. The stable route gives $x_{\text{small}} = c / (a\,x_{\text{large}}) = 1/2000 = 5.000 \times 10^{-4}$, correct to the precision you kept. (The true values are $1999.9995$ and $5.000001 \times 10^{-4}$.)

The same thing happens in double-precision floating point, only further out. For $x^2 - 10^8 x + 1 = 0$ the naive formula returns a small root of $7.45 \times 10^{-9}$, while the correct value is $1.00 \times 10^{-8}$: a $25\%$ error from a formula that is algebraically exact. Solving quadratics in flight software means using the stable form.
:::

::: key Quadratic formula
For $ax^2 + bx + c = 0$: $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$. The discriminant $b^2 - 4ac$ gives two, one or no real roots as it is positive, zero or negative. For $b^2 \gg 4ac$, compute the large root with the formula and the small root as $c/(a \cdot x_{\text{large}})$ to avoid cancellation.
:::

::: key Solving a formula for a symbol
Undo the operations applied to the symbol in reverse order, doing the same thing to both sides; collect the symbol if it appears more than once; never divide by something that may be zero; when you square both sides, check the candidates in the original.
:::

## Check yourself

::: check
Solve $3(x - 1) + 2 = 3x + 4$ and $\dfrac{2x - 1}{5} = \dfrac{x + 3}{2}$.
:::

::: answer
The first: $3x - 3 + 2 = 3x + 4$, so $3x - 1 = 3x + 4$ and $-1 = 4$, which is false. No solution — the two lines are parallel. The second: cross-multiply (equivalently, multiply by $10$): $2(2x - 1) = 5(x + 3)$, so $4x - 2 = 5x + 15$ and $x = -17$. Check: $\tfrac{-35}{5} = -7$ and $\tfrac{-14}{2} = -7$.
:::

::: check
Solve $E = \tfrac{1}{2}mv^2$ for $v$. Why is there only one physically meaningful answer even though the algebra gives two?
:::

::: answer
Multiply by $2$, divide by $m$, take the square root: $v = \pm\sqrt{2E/m}$. Kinetic energy depends on speed squared, so a speed of $v$ and $-v$ both give the same $E$; if $v$ denotes a speed (a magnitude) only the positive root applies. For $E = 2.94 \times 10^{10}\,\mathrm{J}$ and $m = 1000\,\mathrm{kg}$, $v = \sqrt{5.88 \times 10^7} \approx 7670\,\mathrm{m/s}$.
:::

::: check
Solve $3x^2 - 10x - 8 = 0$ with the quadratic formula and confirm the roots with Vieta's relations.
:::

::: answer
$a = 3$, $b = -10$, $c = -8$: $\Delta = 100 + 96 = 196$, $\sqrt{\Delta} = 14$, so $x = \dfrac{10 \pm 14}{6}$, giving $x = 4$ and $x = -\tfrac{2}{3}$. Vieta: sum $4 - \tfrac{2}{3} = \tfrac{10}{3} = -b/a$; product $-\tfrac{8}{3} = c/a$. Both agree, and they match the factorisation $(3x + 2)(x - 4)$ from the previous lesson.
:::

::: check
For which values of $k$ does $x^2 + kx + 9 = 0$ have exactly one real solution, and what is it?
:::

::: answer
Exactly one solution requires $\Delta = k^2 - 36 = 0$, so $k = \pm 6$. The repeated root is $x = -\tfrac{k}{2}$: $x = -3$ for $k = 6$ (the equation is $(x + 3)^2 = 0$) and $x = 3$ for $k = -6$.
:::

::: check
Find both roots of $x^2 - 5000x + 2 = 0$ in a way that keeps full precision for the small one.
:::

::: answer
$\sqrt{\Delta} = \sqrt{25 \times 10^6 - 8} \approx 4999.9992$. The large root adds: $x_{\text{large}} = (5000 + 4999.9992)/2 \approx 4999.9996$. The small root by Vieta: $x_{\text{small}} = c/(a\,x_{\text{large}}) = 2/4999.9996 \approx 4.0000003 \times 10^{-4}$. The naive subtraction $(5000 - 4999.9992)/2$ would have kept only a couple of significant figures of that value.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Legal moves | same addition, non-zero multiplication, one-to-one operation on both sides; squaring can add spurious roots |
| Linear | collect the unknown, divide; identity if $0 = 0$ remains, no solution if a falsehood remains |
| Literal equations | undo operations in reverse order; collect a repeated symbol before dividing |
| $\zeta$ inverted | $m_p = \zeta m_d / (1 - \zeta)$ |
| Period inverted | $r = \left(\mu T^2 / 4\pi^2\right)^{1/3}$; $T = 86\,164\,\mathrm{s}$ gives $42\,164\,\mathrm{km}$ |
| Zero product | factor, then each factor $= 0$; never divide by the unknown |
| Completing the square | $x^2 + px = (x + p/2)^2 - p^2/4$ |
| Quadratic formula | $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ |
| Discriminant | $b^2 - 4ac > 0$: two roots; $= 0$: one; $< 0$: none real |
| Vieta | $x_1 + x_2 = -b/a$, $x_1 x_2 = c/a$ |
| Stable small root | $x_{\text{small}} = c / (a\,x_{\text{large}})$ when $b^2 \gg 4ac$ |

The next lesson has several unknowns at once: systems of equations, where the same legal moves are applied to two or three equations together.
