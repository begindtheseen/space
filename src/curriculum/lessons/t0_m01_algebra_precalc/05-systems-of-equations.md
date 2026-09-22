---
id: l05-systems-of-equations
title: Systems of equations
minutes: 14
covers:
  - systems of equations
---

A single equation pins down a single unknown. Real problems come with several unknowns tied together by several conditions: the oxidizer and fuel masses that must add to the tank load *and* stand in a fixed ratio; the three coefficients of a thrust curve that must pass through three test points; the two coordinates where a line of sight meets the surface of a planet. Each condition is one equation, and the conditions have to hold at the same time. That is a **system of equations**, and solving it is the central mechanical skill behind curve fitting, navigation fixes and, later, every matrix computation in the track.

This lesson covers the two hand methods, substitution and elimination, the geometry that tells you when a system has one solution, none or infinitely many, and the extension to three unknowns and to systems that are not linear. The linear algebra modules will later do all of this with matrices; the point now is to see what the matrices are doing, on systems small enough to solve on paper.

Keep checking solutions in *every* equation of the system. A pair of numbers that satisfies one equation of two is not a solution; it is a point on one line.

## Two equations in two unknowns

A linear equation in two unknowns, $ax + by = c$, has infinitely many solutions — every point on a line in the $x$–$y$ plane. Two such equations describe two lines, and a solution of the system is a point on both, that is, their intersection. Two lines in a plane either cross once, never (parallel), or lie on top of each other, and those are exactly the three possibilities for the system: **one solution**, **no solution**, or **infinitely many**.

### Substitution

Solve one equation for one unknown, substitute the result into the other, and you are back to one equation in one unknown. For

$$
x + y = 10, \qquad x - y = 4,
$$

the second gives $x = y + 4$; substituting into the first, $(y + 4) + y = 10$, so $2y = 6$, $y = 3$ and $x = 7$. Check in both: $7 + 3 = 10$ and $7 - 3 = 4$.

Substitution is the natural method when one equation already has an unknown alone, which is common when the equation is a *ratio*. The propellant split from the first lesson is a system: the two masses must sum to the load and stand in the mixture ratio,

$$
m_{ox} + m_{fuel} = 400\,\mathrm{t}, \qquad m_{ox} = 2.3\, m_{fuel} .
$$

Substitute the second into the first: $2.3\,m_{fuel} + m_{fuel} = 3.3\,m_{fuel} = 400$, so $m_{fuel} = 121.2\,\mathrm{t}$ and $m_{ox} = 278.8\,\mathrm{t}$ — the same numbers the fraction-of-the-whole argument gave, now with no fractions to reason about. A chase is another: a chaser at $x = 2 + 1.5t$ and a target at $x = 10 + 0.5t$ (kilometres and hours) meet when $2 + 1.5t = 10 + 0.5t$, so $t = 8\,\mathrm{h}$ at $x = 14\,\mathrm{km}$.

### Elimination

When neither equation isolates an unknown, scale one or both so that an unknown has opposite coefficients, then add the equations to eliminate it. For

$$
3x + 2y = 16, \qquad 5x - 4y = 12,
$$

double the first to get $6x + 4y = 32$; adding the second gives $11x = 44$, so $x = 4$. Back-substitute into either original: $12 + 2y = 16$, $y = 2$. Check in the *other* one: $20 - 8 = 12$. Checking in the equation you back-substituted into proves nothing, since you used it to get $y$.

Do elimination once with letters and you get a formula. For the general system $a_1 x + b_1 y = c_1$, $a_2 x + b_2 y = c_2$, multiply the first by $b_2$ and the second by $b_1$ and subtract:

$$
(a_1 b_2 - a_2 b_1)\,x = c_1 b_2 - c_2 b_1
\quad\Rightarrow\quad
x = \frac{c_1 b_2 - c_2 b_1}{a_1 b_2 - a_2 b_1}, \qquad
y = \frac{a_1 c_2 - a_2 c_1}{a_1 b_2 - a_2 b_1} .
$$

The shared denominator $D = a_1 b_2 - a_2 b_1$ is the **determinant** of the system's coefficients, and it decides everything. If $D \neq 0$ there is exactly one solution. If $D = 0$ the two lines have the same slope: they are parallel and the system has no solution — unless the numerators vanish too, in which case the equations are the same line and every point on it solves the system. Check the example: $D = 3(-4) - 5(2) = -22$, $x = \frac{16(-4) - 12(2)}{-22} = \frac{-88}{-22} = 4$, $y = \frac{3(12) - 5(16)}{-22} = \frac{-44}{-22} = 2$.

So $2x + 3y = 6$ and $4x + 6y = 8$ have $D = 2(6) - 4(3) = 0$; the second is twice the left side of the first but not twice the right, so no point satisfies both. Replace the $8$ by $12$ and the second equation *is* twice the first: infinitely many solutions. Both situations show up in engineering as "I wrote down two conditions but they were really one".

::: warning Scale the whole equation
When you double $3x + 2y = 16$, the right-hand side doubles too: $6x + 4y = 32$, not $6x + 4y = 16$. Forgetting the right side is the single most common elimination error. Write the multiplier beside the equation and apply it to every term before you add.
:::

## Three unknowns

With three equations in three unknowns the geometry is three planes meeting at a point, and the method is elimination in stages: use one equation to eliminate one unknown from the other two, leaving a $2 \times 2$ system you already know how to solve, then back-substitute. The bookkeeping grows, the ideas do not.

::: example Fitting a thrust curve through three points
A test stand records thrust $800\,\mathrm{kN}$ at $t = 0$, $950\,\mathrm{kN}$ at $t = 10\,\mathrm{s}$ and $800\,\mathrm{kN}$ at $t = 40\,\mathrm{s}$. Fit a quadratic $F(t) = a + bt + ct^2$ through all three. Each data point is one linear equation in the unknown coefficients:

$$
\begin{aligned}
a &= 800, \\
a + 10b + 100c &= 950, \\
a + 40b + 1600c &= 800 .
\end{aligned}
$$

The first gives $a$ at once. Substituting into the other two: $10b + 100c = 150$ and $40b + 1600c = 0$. The second of these gives $b = -40c$; putting that into the first, $-400c + 100c = -300c = 150$, so $c = -0.5$ and $b = 20$. The curve is $F(t) = 800 + 20t - 0.5t^2$ — the very polynomial evaluated in the polynomials lesson. Check the third point: $800 + 800 - 800 = 800$.

Notice what happened: the unknowns were the *coefficients*, and the equations were linear in them even though the curve is quadratic in $t$. Fitting a curve to data is always a linear system of this kind, which is why the linear-algebra modules matter so much for data work.
:::

## Nonlinear systems

If one equation is not linear — a circle, a parabola, a product — substitution still works: solve the linear equation for one unknown, substitute into the nonlinear one, and solve the single-variable equation that results, usually a quadratic. The number of solutions is now up to the degree, and a negative discriminant means the curves do not meet.

::: example Where a line of sight meets the ground
Work in kilometres in a plane through Earth's centre, so the surface is the circle $x^2 + y^2 = R^2$ with $R = 6371$. A satellite sits at $(0,\, 6771)$, $400\,\mathrm{km}$ up, and its sensor looks along the line $y = 6771 - 3x$ (dropping three kilometres for every kilometre sideways). Where does the boresight hit the ground?

Substitute the line into the circle: $x^2 + (6771 - 3x)^2 = 6371^2$. Expand the square, $(6771 - 3x)^2 = 6771^2 - 2(6771)(3x) + 9x^2$, and collect:

$$
10x^2 - 40\,626\,x + (6771^2 - 6371^2) = 0 .
$$

The constant is a difference of squares, $(6771 - 6371)(6771 + 6371) = 400 \times 13\,142 = 5\,256\,800$. Now the quadratic formula: $\Delta = 40\,626^2 - 4(10)(5\,256\,800) = 1.4402 \times 10^9$, $\sqrt{\Delta} = 37\,950$, and

$$
x = \frac{40\,626 \pm 37\,950}{20} = 133.8 \quad\text{or}\quad 3928.8\,\mathrm{km} .
$$

The nearer root is the ground point: $x = 133.8$, $y = 6771 - 401.4 = 6369.6\,\mathrm{km}$. Check on the circle: $133.8^2 + 6369.6^2 = 17\,902 + 40\,571\,800 \approx 6371^2$. The far root is where the line would exit the far side of the planet after passing through it. The slant range to the ground point is the distance along the line, $\sqrt{x^2 + (3x)^2} = x\sqrt{10} \approx 423\,\mathrm{km}$. Had the line been shallow enough to miss Earth, the discriminant would have come out negative: no intersection, no ground point, which is exactly what the algebra should say.
:::

### Nearly parallel lines

Between "one solution" and "no solution" there is a grey zone that matters more in practice than either. When $D$ is small but not zero, the two lines cross at a shallow angle, and a tiny change in either equation slides the crossing a long way. Take $x + y = 2$ and $x + 1.001y = 2.001$: subtracting gives $0.001y = 0.001$, so $y = 1$, $x = 1$. Now nudge the second right-hand side to $2.002$, a change of one part in two thousand. The subtraction becomes $0.001y = 0.002$, so $y = 2$ and $x = 0$: the solution has moved by a whole unit. Such a system is called **ill-conditioned**. Measurements always carry small errors, so a navigation fix from two nearly parallel lines of position is nearly worthless even though the algebra "works". You will meet this again as the condition number of a matrix and as the geometry factor in satellite positioning; the picture to keep is two lines crossing at a grazing angle.

### Mixtures and budgets

A large class of practical systems has the form "the parts add to a total, and a weighted combination of the parts equals a target". To blend $1000\,\mathrm{L}$ of kerosene at $815\,\mathrm{kg/m^3}$ from batches at $800$ and $820\,\mathrm{kg/m^3}$: $V_1 + V_2 = 1000$ and $800V_1 + 820V_2 = 815 \times 1000$. Substituting $V_1 = 1000 - V_2$: $800\,000 - 800V_2 + 820V_2 = 815\,000$, so $20V_2 = 15\,000$, $V_2 = 750\,\mathrm{L}$ and $V_1 = 250\,\mathrm{L}$. Mass budgets, stage splits and sensor fusions all have this shape.

::: key Solving linear systems by hand
Substitution: isolate an unknown in one equation and substitute into the rest. Elimination: scale whole equations so an unknown cancels when they are added, then back-substitute, and check in an equation you did not use. For $a_1 x + b_1 y = c_1$, $a_2 x + b_2 y = c_2$, the determinant $D = a_1 b_2 - a_2 b_1$ is non-zero exactly when there is one solution; $D = 0$ means parallel lines (no solution) or the same line (infinitely many). Nonlinear systems: substitute the linear equation into the nonlinear one.
:::

::: note What the matrices will do
Write the $2 \times 2$ system as $\mathbf{A}\mathbf{x} = \mathbf{b}$ with $\mathbf{A} = \begin{pmatrix} a_1 & b_1 \\ a_2 & b_2 \end{pmatrix}$. The determinant above is $\det \mathbf{A}$, the elimination steps are row operations, and the formulas for $x$ and $y$ are Cramer's rule. Nothing in the linear algebra modules replaces the reasoning here; it organises it so that ten thousand unknowns are no harder in principle than two.
:::

## Check yourself

::: check
Solve $2x - y = 1$ and $x + 3y = 11$ by substitution, and check the answer in both equations.
:::

::: answer
From the first, $y = 2x - 1$. Substitute: $x + 3(2x - 1) = 11$, so $7x - 3 = 11$ and $x = 2$, then $y = 3$. Checks: $2(2) - 3 = 1$ and $2 + 9 = 11$.
:::

::: check
Without solving, classify the system $3x - 6y = 9$, $-x + 2y = -3$ as having one, none or infinitely many solutions.
:::

::: answer
$D = 3(2) - (-1)(-6) = 6 - 6 = 0$, so the lines are parallel or identical. Multiply the second equation by $-3$: $3x - 6y = 9$, which is the first equation. They are the same line: infinitely many solutions, every $(x, y)$ with $x = 2y + 3$.
:::

::: check
A hydrogen–oxygen stage carries $140\,\mathrm{t}$ of propellant at a mixture ratio of $6{:}1$. Set up and solve the system for the two masses.
:::

::: answer
$m_{ox} + m_{H_2} = 140$ and $m_{ox} = 6\,m_{H_2}$. Substituting, $7\,m_{H_2} = 140$, so $m_{H_2} = 20\,\mathrm{t}$ and $m_{ox} = 120\,\mathrm{t}$. Check: $120 + 20 = 140$ and $120 = 6 \times 20$.
:::

::: check
Solve $x + y + z = 6$, $x - y + z = 2$, $2x + y - z = 1$.
:::

::: answer
Subtract the second equation from the first: $2y = 4$, so $y = 2$. Then the first gives $x + z = 4$ and the third gives $2x - z = -1$. Adding those two: $3x = 3$, $x = 1$, and $z = 3$. Check the third original: $2 + 2 - 3 = 1$.
:::

::: check
Find all points where the parabola $y = x^2$ meets the line $y = x + 2$.
:::

::: answer
Set the $y$'s equal: $x^2 = x + 2$, so $x^2 - x - 2 = (x - 2)(x + 1) = 0$, giving $x = 2$ or $x = -1$. The points are $(2, 4)$ and $(-1, 1)$; both satisfy both equations. A line generally meets a parabola in two, one or zero points, according to the discriminant.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Solution of a system | values satisfying every equation at once; geometrically, the intersection |
| Substitution | isolate one unknown, substitute into the others |
| Elimination | scale whole equations, add to cancel an unknown, back-substitute |
| $2 \times 2$ formula | $x = \dfrac{c_1 b_2 - c_2 b_1}{D}$, $y = \dfrac{a_1 c_2 - a_2 c_1}{D}$, $D = a_1 b_2 - a_2 b_1$ |
| $D = 0$ | parallel lines (no solution) or the same line (infinitely many) |
| Three unknowns | eliminate one unknown to get a $2 \times 2$ system, then back-substitute |
| Curve fitting | data points give linear equations in the coefficients |
| Nonlinear | substitute the linear equation into the nonlinear one; discriminant counts intersections |
| Mixture pattern | parts sum to a total, weighted parts equal a target |

The next lesson steps back from equations to the rules that generate them: functions, their domains and ranges, how they compose, and when they can be inverted.
