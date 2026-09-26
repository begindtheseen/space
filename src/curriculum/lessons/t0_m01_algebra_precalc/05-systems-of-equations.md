---
id: l05-systems-of-equations
title: Systems of equations
minutes: 22
covers:
  - systems of equations
---

Here is a puzzle. A burger and fries cost \$8 together, and the burger costs \$2 more than the fries. What does each one cost?

One clue on its own is not enough. "Together they cost \$8" could mean \$4 and \$4, or \$7 and \$1, or a hundred other splits. The second clue rules almost all of those out. Only one pair fits both clues at once: a \$5 burger and \$3 fries. Two unknowns need two clues.

Engineers meet this puzzle all day. A rocket's oxidizer and fuel must add up to the tank load *and* stand in a fixed ratio — two clues, two unknowns. A curve drawn through three test measurements has three unknown numbers in it, pinned down by three clues. The spot where a satellite's camera line hits the ground is the one point that lies on the line *and* on the planet's surface. Each clue is an equation, and all of them have to be true at the same time. That bundle is a **system of equations**.

This lesson teaches the two hand methods — **substitution** and **elimination** — plus the picture that tells you in advance whether a system has one answer, none or infinitely many. Then it stretches to three unknowns and to systems with curves in them. Later modules do all of this with matrices, on thousands of unknowns at once. The point now is to see what the matrices are doing, on systems small enough to solve with a pencil.

One habit, from the very first problem: check your answer in *every* equation of the system. A pair of numbers that fits one clue out of two is not a solution. It is only a guess that passed half the test.

## One clue, many answers

Start with a single equation that has two unknowns:

$$
x + y = 10 .
$$

The letters $x$ and $y$ are the **unknowns** — numbers we have not found yet. This one equation has lots of solutions: $x = 1, y = 9$; $x = 7, y = 3$; $x = 2.5, y = 7.5$; and so on forever.

Now draw them. Take a sheet of graph paper. Let $x$ count squares to the right and $y$ count squares up. Every pair of numbers is one dot, written $(x, y)$ — so $(7, 3)$ is seven across and three up. That flat grid is the **$x$–$y$ plane**. Plot every pair that makes $x + y = 10$ true, and the dots line up into a straight line. That is why an equation of the form $ax + by = c$ (with fixed numbers $a$, $b$, $c$) is called a **linear equation**: its picture is a line.

A second equation draws a second line. A solution of the **system** has to be on both lines at once — so it is the point where the lines **[[cross|crossing-point]]**.

Two straight lines on a flat sheet can only do three things:

1. **Cross once.** The system has exactly **one solution**.
2. **Never cross**, because they are parallel, like railroad tracks. **No solution.**
3. **Lie right on top of each other**, because they are secretly the same line. **Infinitely many** solutions — every point on the line works.

Keep this picture in your head. Every rule in this lesson is a way of finding the crossing point, or of noticing that there isn't one.

## Substitution: swap one clue into the other

Back to the burger. Call the burger's price $b$ and the fries' price $f$. The clues are

$$
b + f = 8, \qquad b = f + 2 .
$$

The second clue already tells you what $b$ is, in terms of $f$. So wherever the first clue says $b$, write $f + 2$ instead:

$$
(f + 2) + f = 8 .
$$

Now there is only one unknown. Collect the $f$'s: $2f + 2 = 8$. Take $2$ from both sides: $2f = 6$. Divide by $2$: $f = 3$. Then $b = 3 + 2 = 5$.

That is **substitution**: solve one equation for one unknown, then put ("substitute") that expression into the other equation. You are back to one equation in one unknown, which the last lesson taught you to solve.

The same steps with $x$ and $y$:

$$
x + y = 10, \qquad x - y = 4 .
$$

The second gives $x = y + 4$ (add $y$ to both sides). Substitute into the first: $(y + 4) + y = 10$, so $2y + 4 = 10$, then $2y = 6$ and $y = 3$. Back in $x = y + 4$: $x = 7$. Check in *both*: $7 + 3 = 10$ and $7 - 3 = 4$. Both true, so $(7, 3)$ is the crossing point.

Substitution is the natural method when one equation already has an unknown alone on one side. That happens a lot when the equation is a **ratio**. The propellant split from the first lesson is a system. The two masses must add up to the load, and the oxygen must be $2.3$ times the fuel:

$$
m_{ox} + m_{fuel} = 400\,\mathrm{t}, \qquad m_{ox} = 2.3\, m_{fuel} .
$$

($m_{ox}$ is read "m sub ox", the oxidizer mass. $1\,\mathrm{t}$ is a tonne, $1000\,\mathrm{kg}$.) Substitute the second into the first: $2.3\,m_{fuel} + m_{fuel} = 400$. That is $3.3\,m_{fuel} = 400$, so $m_{fuel} = 400 / 3.3 = 121.2\,\mathrm{t}$ and $m_{ox} = 2.3 \times 121.2 = 278.8\,\mathrm{t}$. These are the same numbers the "fractions of the whole" method gave in the first lesson — now with no fractions to reason about.

[[A chase|rendezvous]] is another one. A chaser drives along a road so that its position is $x = 2 + 1.5t$, and a target's position is $x = 10 + 0.5t$ ($x$ in kilometres, $t$ in hours). They meet when they are at the same place at the same time — when the two $x$'s are equal:

$$
2 + 1.5t = 10 + 0.5t .
$$

Take $0.5t$ from both sides: $2 + t = 10$, so $t = 8\,\mathrm{h}$. The meeting place is $x = 2 + 1.5 \times 8 = 14\,\mathrm{km}$. Check with the target's formula: $10 + 0.5 \times 8 = 14$. Same place, as it should be.

## Elimination: add the clues together

Sometimes neither equation has an unknown standing alone. Then there is a second trick.

Picture two shopping receipts. The first says: 2 burgers and 1 order of fries cost \$13. The second says: 1 burger and 1 order of fries cost \$8. Lay one receipt on top of the other and take the difference. The first bought exactly one extra burger and paid \$5 more. So a burger costs \$5 — and from the second receipt, the fries cost \$8 − \$5 = \$3. Subtracting the receipts made the fries disappear.

That is **[[elimination|elimination-history]]**: combine the equations so that one unknown cancels out. Often you first have to **scale** an equation — multiply the whole thing by a number — so that the cancelling works. Take

$$
3x + 2y = 16, \qquad 5x - 4y = 12 .
$$

The first has $+2y$ and the second has $-4y$. Double the first equation — every term, both sides — to get $6x + 4y = 32$. Now the $y$'s are $+4y$ and $-4y$, which cancel when you add:

$$
(6x + 4y) + (5x - 4y) = 32 + 12 \quad\Rightarrow\quad 11x = 44 \quad\Rightarrow\quad x = 4 .
$$

(The arrow $\Rightarrow$ is read "so" or "which gives".) Now put $x = 4$ back into either original equation — this is **back-substitution**. The first gives $12 + 2y = 16$, so $2y = 4$ and $y = 2$.

Check in the *other* equation: $5(4) - 4(2) = 20 - 8 = 12$. True. Checking in the equation you back-substituted into proves nothing, because you used that very equation to find $y$ — of course it fits.

::: warning Scale the whole equation
When you double $3x + 2y = 16$, the right-hand side doubles too: $6x + 4y = 32$, not $6x + 4y = 16$. Forgetting the right side is the single most common elimination mistake. It is like doubling every ingredient in a cookie recipe but writing down the old number of cookies. Write the multiplier beside the equation and apply it to every term before you add.
:::

### One formula for every two-by-two system

Do elimination once with letters instead of numbers and you get a formula that solves every system of two linear equations in two unknowns. Write the general system as

$$
a_1 x + b_1 y = c_1, \qquad a_2 x + b_2 y = c_2 .
$$

The little numbers are labels: $a_1$ ("a one") is the number in front of $x$ in the first equation, $a_2$ is the one in the second, and so on. The answer is

$$
x = \frac{c_1 b_2 - c_2 b_1}{a_1 b_2 - a_2 b_1}, \qquad
y = \frac{a_1 c_2 - a_2 c_1}{a_1 b_2 - a_2 b_1} .
$$

::: note Where the formula comes from
Multiply the first equation by $b_2$ and the second by $b_1$. Both now contain $b_1 b_2\, y$:

$$
a_1 b_2\, x + b_1 b_2\, y = c_1 b_2, \qquad a_2 b_1\, x + b_1 b_2\, y = c_2 b_1 .
$$

Subtract the second from the first. The $y$ terms cancel, leaving

$$
(a_1 b_2 - a_2 b_1)\,x = c_1 b_2 - c_2 b_1 ,
$$

and dividing gives $x$. For $y$, multiply the first equation by $a_2$ and the second by $a_1$, then subtract the first from the second. The $x$ terms cancel and you get $(a_1 b_2 - a_2 b_1)\,y = a_1 c_2 - a_2 c_1$.
:::

Both answers share the same bottom number,

$$
D = a_1 b_2 - a_2 b_1 ,
$$

called the **[[determinant|determinant-slope]]** of the system. It decides everything:

- If $D \neq 0$ ("D is not zero"), you can divide by it, and there is exactly **one** solution.
- If $D = 0$, the two lines have the same steepness — they are parallel. Then there is **no** solution, unless the top numbers are zero as well. In that case the two equations are the same line in disguise, and every point on it is a solution: **infinitely many**.

Check the formula on the example $3x + 2y = 16$, $5x - 4y = 12$. Here $a_1 = 3$, $b_1 = 2$, $c_1 = 16$, $a_2 = 5$, $b_2 = -4$, $c_2 = 12$:

$$
D = 3(-4) - 5(2) = -12 - 10 = -22,
$$

$$
x = \frac{16(-4) - 12(2)}{-22} = \frac{-64 - 24}{-22} = \frac{-88}{-22} = 4, \qquad
y = \frac{3(12) - 5(16)}{-22} = \frac{36 - 80}{-22} = \frac{-44}{-22} = 2 .
$$

Same answer as before, as it must be.

Now a system where $D = 0$: $2x + 3y = 6$ and $4x + 6y = 8$. Here $D = 2(6) - 4(3) = 12 - 12 = 0$. Look closely. The left side of the second equation, $4x + 6y$, is exactly twice the left side of the first. But the right side, $8$, is not twice $6$. The first equation says $2x + 3y = 6$, so doubling it, $4x + 6y$ must be $12$. The second says $4x + 6y = 8$. Both cannot be true. No point satisfies both — parallel lines.

Change the $8$ to $12$ and the second equation *is* the first one doubled. It adds no new information. Infinitely many solutions.

Both situations show up in engineering. Someone writes down two conditions, but they were really one condition written twice (infinitely many answers), or two conditions that fight each other (no answer). The determinant catches both before you waste an afternoon.

## Three unknowns

With three unknowns you need three clues. The picture is no longer lines on a sheet. Each equation is a flat **plane** floating in three-dimensional space, like a tilted sheet of glass, and the solution is the one point where all three sheets meet.

The method is elimination in stages. Use one equation to remove one unknown from the other two. That leaves two equations in two unknowns — a system you already know how to solve. Solve it, then back-substitute to get the third unknown. There is more bookkeeping, but no new ideas.

::: example Fitting a thrust curve through three points
A test stand records an engine's push (its **thrust**, a force) at three moments: $800\,\mathrm{kN}$ at $t = 0$, $950\,\mathrm{kN}$ at $t = 10\,\mathrm{s}$ and $800\,\mathrm{kN}$ at $t = 40\,\mathrm{s}$. We want a [[smooth curve through all three|ceres]], of the form

$$
F(t) = a + bt + ct^2 .
$$

The unknowns are the three numbers $a$, $b$, $c$. Each data point is one clue. Put $t = 0$ and $F = 800$ into the formula, then $t = 10$ and $F = 950$ (so $t^2 = 100$), then $t = 40$ and $F = 800$ (so $t^2 = 1600$):

$$
\begin{aligned}
a &= 800, \\
a + 10b + 100c &= 950, \\
a + 40b + 1600c &= 800 .
\end{aligned}
$$

The first clue hands you $a = 800$ straight away. Substitute it into the other two and take $800$ from both sides of each:

$$
10b + 100c = 150, \qquad 40b + 1600c = 0 .
$$

The second of these says $40b = -1600c$, so $b = -40c$. Put that into the first: $10(-40c) + 100c = 150$, which is $-400c + 100c = -300c = 150$. Divide by $-300$: $c = -0.5$. Then $b = -40 \times (-0.5) = 20$.

The curve is $F(t) = 800 + 20t - 0.5t^2$ — the very polynomial you evaluated in the polynomials lesson. Check by putting $t = 40$ back into the finished curve: $F(40) = 800 + 20(40) - 0.5(1600) = 800 + 800 - 800 = 800$. It fits.

Notice what happened. The unknowns were the *coefficients* — the numbers in front of the powers of $t$. The curve is a quadratic in $t$, but the equations were linear in $a$, $b$, $c$: no unknown was squared or multiplied by another unknown. Fitting a curve to data always gives a linear system like this, which is why the linear-algebra modules matter so much for working with data.
:::

## Systems with curves

What if one of the equations is not a line — a circle, a parabola, a product of unknowns? Then the system is **nonlinear**. Substitution still works. Solve the linear equation for one unknown, substitute into the curved one, and solve the single-unknown equation that comes out. It is usually a quadratic, which the last lesson taught you to solve with the quadratic formula.

The picture changes a little. A line can cross a circle twice, touch it once, or miss it entirely. So a nonlinear system can have two solutions, one, or none. The **discriminant** — the $b^2 - 4ac$ under the square root in the quadratic formula — tells you which. If it comes out negative, the square root does not exist, and the curves do not meet.

::: example Where a line of sight meets the ground
Picture a slice through the middle of the Earth. In that slice, the surface is a circle of radius $R = 6371\,\mathrm{km}$ centred at $(0, 0)$. A point $(x, y)$ is on the circle when its distance from the centre is $R$. By [[Pythagoras' theorem|pythagoras]], that distance squared is $x^2 + y^2$, so the circle is the equation

$$
x^2 + y^2 = R^2 .
$$

Work in kilometres. A satellite sits at $(0,\, 6771)$, which is $6771 - 6371 = 400\,\mathrm{km}$ above the surface. Its camera looks along the line $y = 6771 - 3x$: three kilometres down for every kilometre sideways. Where does the camera's centre line (its **[[boresight|boresight]]**) hit the ground?

**Substitute** the line into the circle — wherever the circle says $y$, write $6771 - 3x$:

$$
x^2 + (6771 - 3x)^2 = 6371^2 .
$$

**Expand the square** with $(p - q)^2 = p^2 - 2pq + q^2$: $(6771 - 3x)^2 = 6771^2 - 2(6771)(3x) + 9x^2 = 6771^2 - 40\,626\,x + 9x^2$. Add the $x^2$ in front and move $6371^2$ to the left side:

$$
10x^2 - 40\,626\,x + (6771^2 - 6371^2) = 0 .
$$

**Tidy the constant.** It is a difference of squares, $p^2 - q^2 = (p - q)(p + q)$, so it equals $(6771 - 6371)(6771 + 6371) = 400 \times 13\,142 = 5\,256\,800$.

**Quadratic formula**, with $a = 10$, $b = -40\,626$, $c = 5\,256\,800$. The discriminant (written $\Delta$, as in the last lesson) is

$$
\Delta = 40\,626^2 - 4(10)(5\,256\,800) = 1.4402 \times 10^9, \qquad \sqrt{\Delta} = 37\,950 ,
$$

so

$$
x = \frac{40\,626 \pm 37\,950}{20} = 133.8 \quad\text{or}\quad 3928.8\,\mathrm{km} .
$$

Two answers, because [[a line that enters a circle also leaves it|line-enters-leaves]]. The nearer one is the ground point: $x = 133.8$, $y = 6771 - 3(133.8) = 6771 - 401.4 = 6369.6\,\mathrm{km}$.

**Check it is on the circle:** $133.8^2 + 6369.6^2 = 17\,902 + 40\,571\,800 \approx 40\,589\,700$, and $6371^2 = 40\,589\,641$. Close enough, given the rounding. The far answer is where the line would come out the other side of the planet after passing through it.

**How far away is the ground point?** Along the line, $x$ goes $133.8$ across while $y$ drops $3 \times 133.8$. By Pythagoras again, the distance (the **slant range**) is $\sqrt{x^2 + (3x)^2} = x\sqrt{10} \approx 423\,\mathrm{km}$ — a bit more than the $400\,\mathrm{km}$ height, as it should be for a line that leans sideways.

Had the line been tilted so shallow that it missed the Earth, the discriminant would have come out negative: no intersection, no ground point. That is exactly what the algebra should say.
:::

## Nearly parallel lines

Between "one solution" and "no solution" there is a grey zone that matters more in real life than either.

Picture two roads that [[cross at a very shallow angle|shallow-angle]], almost side by side. Shift one road over by a hair and the crossing point slides a long way along them. When $D$ is small but not zero, the two lines of a system cross at such a shallow angle, and a tiny change in either equation moves the answer a long way.

Try it. Take $x + y = 2$ and $x + 1.001y = 2.001$. Subtract the first from the second: $0.001y = 0.001$, so $y = 1$ and then $x = 1$.

Now nudge the second right-hand side from $2.001$ to $2.002$ — a change of about one part in two thousand. The subtraction becomes $0.001y = 0.002$, so $y = 2$ and $x = 0$. A tiny nudge moved the solution by a whole unit.

A system like this is called **ill-conditioned**. Real measurements always carry small errors. So a navigation fix made from two nearly parallel lines of position is nearly worthless, even though the algebra "works". You will meet this again as the **condition number** of a matrix, and as the [[geometry factor in satellite positioning|gps-geometry]]. The picture to keep is two lines crossing at a grazing angle.

## Mixtures and budgets

A large family of practical systems has the same shape: *the parts add up to a total*, and *a weighted mix of the parts hits a target*. Think of mixing warm and cold water to fill a bath at exactly the right temperature. Mass budgets, stage splits and sensor blends all look like this.

::: example Blending two batches of kerosene
You need $1000\,\mathrm{L}$ of [[kerosene|kerosene]] with density $815\,\mathrm{kg/m^3}$. You have one batch at $800\,\mathrm{kg/m^3}$ and another at $820\,\mathrm{kg/m^3}$. How much of each?

Call the volumes $V_1$ and $V_2$, in litres. Clue one — the parts add up to the total:

$$
V_1 + V_2 = 1000 .
$$

Clue two — the mass of the blend equals the mass of its parts (each mass is density times volume):

$$
800V_1 + 820V_2 = 815 \times 1000 .
$$

From clue one, $V_1 = 1000 - V_2$. Substitute into clue two: $800(1000 - V_2) + 820V_2 = 815\,000$. Multiply out: $800\,000 - 800V_2 + 820V_2 = 815\,000$. Collect: $20V_2 = 15\,000$. Divide: $V_2 = 750\,\mathrm{L}$. Then $V_1 = 1000 - 750 = 250\,\mathrm{L}$.

Sanity check: the target $815$ is closer to $820$ than to $800$, so you should need more of the $820$ batch — and you do, three times as much. Check clue two: $800 \times 250 + 820 \times 750 = 200\,000 + 615\,000 = 815\,000$.
:::

::: key Solving linear systems by hand
Substitution: isolate an unknown in one equation and substitute into the rest. Elimination: scale whole equations so an unknown cancels when they are added, then back-substitute, and check in an equation you did not use. For $a_1 x + b_1 y = c_1$, $a_2 x + b_2 y = c_2$, the determinant $D = a_1 b_2 - a_2 b_1$ is non-zero exactly when there is one solution; $D = 0$ means parallel lines (no solution) or the same line (infinitely many). Nonlinear systems: substitute the linear equation into the nonlinear one.
:::

::: note What the matrices will do
Later you will write the $2 \times 2$ system as $\mathbf{A}\mathbf{x} = \mathbf{b}$, with the coefficients packed into a grid called a **matrix**, $\mathbf{A} = \begin{pmatrix} a_1 & b_1 \\ a_2 & b_2 \end{pmatrix}$. The determinant above is $\det \mathbf{A}$. The elimination steps are called row operations. The formulas for $x$ and $y$ are called Cramer's rule. Nothing in the linear algebra modules replaces the reasoning here. It organises it, so that ten thousand unknowns are no harder in principle than two.
:::

## Check yourself

::: check
Solve $2x - y = 1$ and $x + 3y = 11$ by substitution, and check the answer in both equations.
:::

::: answer
From the first, add $y$ and take $1$ from both sides: $y = 2x - 1$. Substitute into the second: $x + 3(2x - 1) = 11$. Multiply out: $x + 6x - 3 = 11$, so $7x - 3 = 11$, then $7x = 14$ and $x = 2$. Back in $y = 2x - 1$: $y = 3$.

Checks: $2(2) - 3 = 1$ and $2 + 3(3) = 2 + 9 = 11$. Both true.
:::

::: check
Without solving, decide whether the system $3x - 6y = 9$, $-x + 2y = -3$ has one solution, none or infinitely many.
:::

::: answer
Here $a_1 = 3$, $b_1 = -6$, $a_2 = -1$, $b_2 = 2$. So $D = 3(2) - (-1)(-6) = 6 - 6 = 0$: the lines are parallel or identical.

To tell which, multiply the second equation by $-3$: $3x - 6y = 9$. That is exactly the first equation. They are the same line, so there are infinitely many solutions — every $(x, y)$ with $x = 2y + 3$.
:::

::: check
A hydrogen–oxygen stage carries $140\,\mathrm{t}$ of propellant at a mixture ratio of $6{:}1$ (six parts oxygen to one part hydrogen, by mass). Set up and solve the system for the two masses.
:::

::: answer
Clue one: $m_{ox} + m_{H_2} = 140$. Clue two: $m_{ox} = 6\,m_{H_2}$. Substitute the second into the first: $6\,m_{H_2} + m_{H_2} = 7\,m_{H_2} = 140$, so $m_{H_2} = 20\,\mathrm{t}$ and $m_{ox} = 6 \times 20 = 120\,\mathrm{t}$.

Check: $120 + 20 = 140$ and $120 = 6 \times 20$.
:::

::: check
Solve $x + y + z = 6$, $x - y + z = 2$, $2x + y - z = 1$.
:::

::: answer
Subtract the second equation from the first. The $x$'s cancel and so do the $z$'s: $(x + y + z) - (x - y + z) = 2y$, and $6 - 2 = 4$. So $2y = 4$ and $y = 2$.

Put $y = 2$ into the first equation: $x + z = 4$. Put it into the third: $2x + 2 - z = 1$, so $2x - z = -1$. Add those two: the $z$'s cancel, $3x = 3$, so $x = 1$. Then $z = 4 - 1 = 3$.

Check the third original equation, which we have not fully used: $2(1) + 2 - 3 = 1$. True.
:::

::: check
Find all points where the parabola $y = x^2$ meets the line $y = x + 2$.
:::

::: answer
Both equations give $y$, so set them equal: $x^2 = x + 2$. Move everything to one side: $x^2 - x - 2 = 0$. This factors as $(x - 2)(x + 1) = 0$, so $x = 2$ or $x = -1$.

The $y$ values come from either equation: $(2, 4)$ and $(-1, 1)$. Check both in both: $4 = 2^2$ and $4 = 2 + 2$; $1 = (-1)^2$ and $1 = -1 + 2$. A line meets a parabola in two, one or zero points, depending on the discriminant.
:::

::: check
Two receipts: 3 pencils and 2 erasers cost \$1.30; 1 pencil and 2 erasers cost \$0.70. Find the price of each by elimination.
:::

::: answer
Subtract the second receipt from the first. The erasers cancel: 2 pencils cost \$1.30 − \$0.70 = \$0.60, so one pencil costs \$0.30. From the second receipt, 2 erasers cost \$0.70 − \$0.30 = \$0.40, so one eraser costs \$0.20.

Check in the first receipt: $3(0.30) + 2(0.20) = 0.90 + 0.40 = 1.30$. True.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Solution of a system | values satisfying every equation at once; in the picture, where the lines cross |
| Three possibilities | one solution (lines cross), none (parallel), infinitely many (same line) |
| Substitution | isolate one unknown, substitute into the others |
| Elimination | scale whole equations, add to cancel an unknown, back-substitute |
| $2 \times 2$ formula | $x = \dfrac{c_1 b_2 - c_2 b_1}{D}$, $y = \dfrac{a_1 c_2 - a_2 c_1}{D}$, $D = a_1 b_2 - a_2 b_1$ |
| $D = 0$ | parallel lines (no solution) or the same line (infinitely many) |
| Three unknowns | eliminate one unknown to get a $2 \times 2$ system, then back-substitute |
| Curve fitting | data points give linear equations in the coefficients |
| Nonlinear | substitute the linear equation into the nonlinear one; the discriminant counts crossings |
| Ill-conditioned | small $D$: lines cross at a grazing angle, and small errors move the answer a lot |
| Mixture pattern | parts sum to a total, weighted parts equal a target |

Next lesson: we step back from equations to the rules that produce them — **functions**. You will learn what a formula is allowed to take in (its domain), what it can give out (its range), how formulas chain together, and when one can be run backwards.

::: context crossing-point Two clues, one crossing
Here are the two clues $x + y = 10$ and $x - y = 4$ drawn as lines. Every point on the blue line fits the first clue. Every point on the red line fits the second. Only one point is on both: $(7, 3)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="0.8" stroke-opacity="0.6">
    <line x1="53" y1="45" x2="53" y2="175"/><line x1="40" y1="162" x2="170" y2="162"/><line x1="66" y1="45" x2="66" y2="175"/><line x1="40" y1="149" x2="170" y2="149"/><line x1="79" y1="45" x2="79" y2="175"/><line x1="40" y1="136" x2="170" y2="136"/><line x1="92" y1="45" x2="92" y2="175"/><line x1="40" y1="123" x2="170" y2="123"/><line x1="105" y1="45" x2="105" y2="175"/><line x1="40" y1="110" x2="170" y2="110"/><line x1="118" y1="45" x2="118" y2="175"/><line x1="40" y1="97" x2="170" y2="97"/><line x1="131" y1="45" x2="131" y2="175"/><line x1="40" y1="84" x2="170" y2="84"/><line x1="144" y1="45" x2="144" y2="175"/><line x1="40" y1="71" x2="170" y2="71"/><line x1="157" y1="45" x2="157" y2="175"/><line x1="40" y1="58" x2="170" y2="58"/><line x1="170" y1="45" x2="170" y2="175"/><line x1="40" y1="45" x2="170" y2="45"/>
  </g>
  <line x1="40" y1="175" x2="180" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="175" x2="40" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="190">0</text><text x="105" y="190">5</text><text x="170" y="190">10</text>
    <text x="28" y="114">5</text><text x="28" y="49">10</text>
    <text x="186" y="179">x</text><text x="40" y="28">y</text>
  </g>
  <line x1="40" y1="45" x2="170" y2="175" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="92" y1="175" x2="170" y2="97" stroke="#b4232c" stroke-width="3"/>
  <circle cx="131" cy="136" r="5" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44">
    <text x="210" y="70" fill="#1d6fd1">blue: x + y = 10</text>
    <text x="210" y="92" fill="#b4232c">red: x − y = 4</text>
    <text x="210" y="124">crossing: (7, 3)</text>
    <text x="210" y="142" font-size="11">on both lines at once</text>
  </g>
</svg>
```

Substitution and elimination are ways of finding that crossing without drawing — and more exactly than any pencil could.
:::

::: context rendezvous Chasing a space station
Every trip to the space station ends in a chase like this one. The visiting spacecraft starts in a slightly lower orbit, which goes around faster, so it gains on the station lap by lap. Then it raises its orbit to meet it. Working out *when* and *where* the two positions match is a system of equations.

The first crewed rendezvous was in December 1965, when Gemini 6A flew to within about $30$ centimetres of Gemini 7.
:::

::: context elimination-history Two thousand years of elimination
This method is ancient. A Chinese book called *The Nine Chapters on the Mathematical Art*, put together roughly two thousand years ago, solves systems of three or more equations by laying the numbers out in a grid of counting rods and combining the rows — the same scaling and subtracting you do here.

In the West it is called **Gaussian elimination**, after the German mathematician Carl Friedrich Gauss. It is still how computers solve large systems of equations.
:::

::: context determinant-slope Why D = 0 means parallel
Each line $ax + by = c$ has a steepness (its slope) of $-\frac{a}{b}$. Two lines are parallel when their slopes match:

$$
-\frac{a_1}{b_1} = -\frac{a_2}{b_2}.
$$

Multiply both sides by $-b_1 b_2$ and this becomes $a_1 b_2 = a_2 b_1$ — which is the same as $a_1 b_2 - a_2 b_1 = 0$. So "$D = 0$" is a tidy way of saying "same slope". Because it has no division in it, it even works for upright lines, where $b = 0$ and the slope has no value.
:::

::: context ceres Gauss and the lost dwarf planet
Three points fix a quadratic exactly. Real engineers usually have *more* measurements than unknowns — hundreds of radar readings to pin down the six numbers that describe an orbit — and the readings disagree slightly. Then they look for the curve that misses all of them by the least total amount, a method called **least squares**.

Gauss used it in 1801, aged 24, to predict where the newly found dwarf planet Ceres would reappear after it was lost in the Sun's glare. Astronomers found it close to where he said. Orbit determination still works this way.
:::

::: context pythagoras Older than Pythagoras
For a right-angled triangle with shorter sides $x$ and $y$ and longest side $d$, the rule is $x^2 + y^2 = d^2$. It carries the name of Pythagoras, a Greek thinker from about $2500$ years ago. But Babylonian clay tablets more than a thousand years older already list sets of whole numbers that fit it, such as $119$, $120$ and $169$.

Every straight-line distance a navigation computer works out, in two dimensions or three, uses this rule.
:::

::: context boresight Looking down the barrel
The word comes from guns. To line up a rifle's sight, you look straight down the inside of the barrel — its *bore* — and adjust the sight until it points where the bore points.

Engineers kept the word for the direction any instrument looks: a camera, a radar dish, a telescope, a star tracker. Knowing each boresight's direction to a tiny fraction of a degree is a big part of a GNC engineer's job, because a small pointing error becomes kilometres on the ground.
:::

::: context line-enters-leaves Drawn to scale
Here is the example drawn to scale: the Earth slice as a circle, the satellite $400\,\mathrm{km}$ above it, and the camera line going in and coming out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="110" r="90" fill="#8fb8f0" fill-opacity="0.45" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="150" y1="14.35" x2="151.9" y2="20" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="151.9" y1="20" x2="205.5" y2="180.85" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="205.5" y1="180.85" x2="213.6" y2="205.1" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <rect x="146" y="10.35" width="8" height="8" fill="#1d6fd1"/>
  <circle cx="151.9" cy="20" r="3.5" fill="#b4232c"/>
  <circle cx="205.5" cy="180.85" r="3.5" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="155" y1="22" x2="220" y2="40" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="162" y="15">satellite, 400 km up</text>
    <text x="224" y="44">near crossing:</text>
    <text x="224" y="58">the ground point</text>
    <text x="214" y="185">far crossing</text>
  </g>
  <text x="150" y="108" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="150" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">R = 6371 km</text>
</svg>
```

At this scale the satellite almost touches the planet: low orbit is very low. The near crossing, at $x = 133.8\,\mathrm{km}$, is the ground point. The far one, at $x = 3928.8\,\mathrm{km}$, is on the other side of the planet, where the line would come out.
:::

::: context shallow-angle Why a shallow crossing is fragile
Every measured line is a little uncertain, so think of it as a band rather than a hair-thin line. The answer could be anywhere the two bands overlap. A steep crossing leaves a small diamond. A shallow crossing leaves a long sliver.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke-width="14" stroke-opacity="0.4" stroke-linecap="butt">
    <line x1="45" y1="50" x2="135" y2="140" stroke="#1d6fd1"/>
    <line x1="45" y1="140" x2="135" y2="50" stroke="#b4232c"/>
    <line x1="180" y1="87.8" x2="340" y2="102.2" stroke="#1d6fd1"/>
    <line x1="180" y1="102.2" x2="340" y2="87.8" stroke="#b4232c"/>
  </g>
  <g stroke-width="1.5">
    <line x1="45" y1="50" x2="135" y2="140" stroke="#1d6fd1"/>
    <line x1="45" y1="140" x2="135" y2="50" stroke="#b4232c"/>
    <line x1="180" y1="87.8" x2="340" y2="102.2" stroke="#1d6fd1"/>
    <line x1="180" y1="102.2" x2="340" y2="87.8" stroke="#b4232c"/>
  </g>
  <circle cx="90" cy="95" r="3" fill="#1f2a44"/>
  <circle cx="260" cy="95" r="3" fill="#1f2a44"/>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="90" y="172">steep crossing:</text><text x="90" y="188">small overlap</text>
    <text x="260" y="172">shallow crossing:</text><text x="260" y="188">long sliver</text>
  </g>
</svg>
```

The bands are the same width in both — the same measuring errors — but the shallow pair smears the answer along a long stretch.
:::

::: context gps-geometry Satellites bunched in the sky
A GPS receiver finds where it is from its distances to several satellites. Each distance is one clue, and the receiver solves the system. If all the satellites it can see sit close together in one patch of sky, the clues are nearly parallel and the position fix is poor, however accurate each distance is.

Receivers report this as **dilution of precision** (DOP): a number that says how much the geometry magnifies the measuring errors. Satellites spread across the sky give a low DOP and a sharp fix.
:::

::: context kerosene Rocket kerosene
Many rockets, including Falcon 9, burn a very pure kerosene called **RP-1** ("Rocket Propellant-1"). It is refined more strictly than jet fuel so that it does not leave gummy deposits inside the engine.

Density matters because a tank holds a fixed *volume*, but the engine burns *mass*. SpaceX chills its RP-1 well below room temperature before loading it: colder fuel is denser, so the same tanks carry more of it. The weighted-average sum in this example tells you the density of any blend.
:::
