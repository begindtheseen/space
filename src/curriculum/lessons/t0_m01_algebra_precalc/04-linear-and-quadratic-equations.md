---
id: l04-linear-and-quadratic-equations
title: Linear and quadratic equations
minutes: 22
covers:
  - linear and quadratic equations
---

In the morning you put on your socks, then your shoes. At night you undo it in the opposite order: shoes off first, then socks. Solving an equation works the same way. Something was done to the unknown number, step by step. To get it back on its own, you undo those steps in reverse order.

Most of the algebra a [[GNC engineer|gnc]] does in a day is not solving for a mystery $x$. It is taking a *formula* and getting one of its letters by itself: the burnout mass from the mass ratio, the size of an orbit from the time it takes to go around, the time to fall from a given height. The numbers come in at the end. So this lesson treats solving as what it is — undoing operations in reverse order, doing the same thing to both sides — and uses it on formulas full of letters as much as on equations with numbers.

The second half is about **quadratics**, equations where the unknown is squared. They appear the moment anything is squared, which in physics is constantly: distance travelled while speeding up, energy of motion, the distance to a point on a circle. You will derive the famous quadratic formula rather than memorise it. You will meet the **[[discriminant|discriminant-word]]**, which tells you how many answers there are before you work any of them out. And you will learn the one number trap hidden inside the formula, which has caught out real flight software.

Every answer in this lesson ends with a check: put it back into the original equation and see that both sides match. Make that a reflex now, while the equations are easy.

## What solving means

Picture an old-fashioned [[balance scale|balance-scale]] with two pans. An **equation** says the two pans weigh the same: whatever is on the left equals whatever is on the right. If you add a kilogram to one pan, you must add a kilogram to the other, or it tips. That is the whole idea of solving.

**Solving** an equation means finding every value of the unknown that makes it true — no more, no fewer. That collection of values is the **solution set**. Two equations are **equivalent** if they have exactly the same solution set. The legal moves are the ones that keep the solution set the same:

- add or subtract the same amount on both sides;
- multiply or divide both sides by the same amount, as long as it is *not zero*;
- do the same **one-to-one** operation to both sides. One-to-one means it never turns two different numbers into the same answer, so it can always be undone. Taking the cube root is one-to-one. So is taking the logarithm of positive numbers, which you will meet later in this module.

Squaring both sides is *not* on the list, because squaring is not one-to-one: $3$ and $-3$ both square to $9$. So squaring can sneak in extra "solutions". The equation $x = 3$ has one solution, but after squaring, $x^2 = 9$ also allows $x = -3$. When you must square, check every answer in the *original* equation afterwards and throw out the fakes. Dividing by something that might be zero is the other way to go wrong, and it gets its own warning below.

## Linear equations

A **linear equation** has the unknown only to the first power — no $x^2$, no $\sqrt{x}$. The plan: gather the unknown on one side, the plain numbers on the other, then divide.

$$
3x - 7 = 2x + 5 \;\Rightarrow\; 3x - 2x = 5 + 7 \;\Rightarrow\; x = 12 .
$$

(The arrow $\Rightarrow$ is read "which gives".) The first step subtracted $2x$ from both sides and added $7$ to both sides. Then $3x - 2x = x$ and $5 + 7 = 12$.

*Check:* $3(12) - 7 = 36 - 7 = 29$, and $2(12) + 5 = 24 + 5 = 29$. Both sides match.

**With fractions**, get rid of them first by multiplying every term by a common denominator. For thirds and quarters, that is $12$:

$$
\frac{x}{3} + \frac{x}{4} = 14 \;\Rightarrow\; 4x + 3x = 168 \;\Rightarrow\; 7x = 168 \;\Rightarrow\; x = 24 .
$$

($12 \times \frac{x}{3} = 4x$, $12 \times \frac{x}{4} = 3x$, and $12 \times 14 = 168$.) *Check:* $\frac{24}{3} + \frac{24}{4} = 8 + 6 = 14$.

**With brackets**, distribute first: $5(x - 2) = 3x + 8$ gives $5x - 10 = 3x + 8$. Subtract $3x$ and add $10$: $2x = 18$, so $x = 9$. *Check:* $5(7) = 35$ and $27 + 8 = 35$.

Two odd cases are worth recognising on sight.

- If the unknown cancels out and what is left is **true**, like $2(x + 1) = 2x + 2 \Rightarrow 2 = 2$, then *every* value of $x$ works. The equation is an **identity** — two ways of writing the same thing.
- If what is left is **false**, like $2x + 1 = 2x + 3 \Rightarrow 1 = 3$, there is **no solution** at all.

Both happen in real derivations. Usually they mean two conditions you thought were separate were really the same condition, or were contradicting each other.

## Literal equations: solving a formula for a symbol

A **literal equation** is a formula with several letters, and you want one particular letter on its own. The method is exactly the same. The only new skill is treating the other letters as if they were ordinary numbers. Read the formula as a recipe — what was done to your letter, and in what order — then undo the steps in reverse, like shoes before socks.

**[[Newton's second law|newton-merlin]]**, $F = ma$ (force equals mass times acceleration). Here $a$ was multiplied by $m$. Undo that by dividing both sides by $m$: $a = F/m$. An engine pushing with $F = 845\,\mathrm{kN}$ on a $25\,000\,\mathrm{kg}$ vehicle gives

$$
a = \frac{845\,000\,\mathrm{N}}{25\,000\,\mathrm{kg}} = 33.8\,\mathrm{m/s^2},
$$

about $3.4$ times $g$ (Earth's gravity, $9.81\,\mathrm{m/s^2}$).

**Speeding up steadily**, $v = v_0 + at$. The final speed $v$ is the starting speed $v_0$ ("v nought") plus acceleration $a$ times time $t$. The recipe for $t$ was: multiply by $a$, then add $v_0$. Undo in reverse: first subtract $v_0$, then divide by $a$:

$$
t = \frac{v - v_0}{a} .
$$

How long would it take to reach [[orbital speed|three-g]], $7670\,\mathrm{m/s}$, from rest at a steady $3g$? Here $a = 3 \times 9.80665 = 29.42\,\mathrm{m/s^2}$, so $t = \frac{7670 - 0}{29.42} \approx 261\,\mathrm{s}$ — between four and five minutes.

**When the letter is inside a root**, square both sides. (Both sides here are positive, so squaring cannot create a fake answer.) A pendulum's swing time is $T = 2\pi\sqrt{L/g}$, where $L$ is its length. To solve for $g$, divide by $2\pi$, square, then flip both fractions over:

$$
\left(\frac{T}{2\pi}\right)^2 = \frac{L}{g} \;\Rightarrow\; g = \frac{4\pi^2 L}{T^2} .
$$

A one-metre pendulum that takes $T = 2.006\,\mathrm{s}$ per swing gives $g = \frac{39.48 \times 1}{2.006^2} = \frac{39.48}{4.024} \approx 9.81\,\mathrm{m/s^2}$. [[For two centuries|pendulum]], this is how gravity was measured.

**When the letter appears more than once**, gather it together. Solve the propellant mass fraction $\zeta = \dfrac{m_p}{m_p + m_d}$ for $m_p$:

1. Multiply both sides by the bottom, $(m_p + m_d)$: $\zeta m_p + \zeta m_d = m_p$.
2. Gather the $m_p$ terms on one side: $\zeta m_d = m_p - \zeta m_p$.
3. Pull out the common factor: $\zeta m_d = m_p(1 - \zeta)$.
4. Divide by $(1 - \zeta)$, which is not zero because $\zeta$ is less than $1$:

$$
m_p = \frac{\zeta\, m_d}{1 - \zeta} .
$$

A stage with $\zeta = 0.949$ and dry mass $m_d = 22\,\mathrm{t}$ carries $m_p = \frac{0.949 \times 22}{0.051} \approx 409\,\mathrm{t}$ of propellant. That matches the $410\,\mathrm{t}$ that produced $\zeta$ in the first lesson; the small gap comes from rounding $\zeta$ to three figures.

::: example Geostationary radius from the period
A **[[geostationary|geostationary]]** satellite goes around exactly once per day, so from the ground it seems to hang still in the sky — which is why TV dishes can point at one spot. How high is it?

The time for one circular orbit, the **period**, is $T = 2\pi\sqrt{r^3/\mu}$, where $r$ is the distance from Earth's centre and $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravitational parameter. The recipe for $T$ was: cube $r$, divide by $\mu$, take the square root, multiply by $2\pi$. Undo it in reverse: divide by $2\pi$, square, multiply by $\mu$, take the cube root.

$$
r^3 = \frac{\mu T^2}{4\pi^2}, \qquad r = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} .
$$

One turn of Earth relative to the stars (a **[[sidereal day|sidereal-day]]**) is $T = 86\,164\,\mathrm{s}$, a few minutes shorter than $24$ hours. Now the arithmetic, one step at a time:

- Square the period: $T^2 = (8.6164 \times 10^4)^2 = 7.424 \times 10^9\,\mathrm{s^2}$.
- Multiply by $\mu$: $3.986 \times 10^{14} \times 7.424 \times 10^9 = 2.959 \times 10^{24}$.
- Divide by $4\pi^2 = 39.48$: $r^3 = 7.496 \times 10^{22}\,\mathrm{m^3}$.
- Take the cube root: $r \approx 4.216 \times 10^7\,\mathrm{m} = 42\,164\,\mathrm{km}$.

Subtract Earth's radius, $6371\,\mathrm{km}$, to get the famous geostationary altitude of about $35\,790\,\mathrm{km}$ — roughly three Earths stacked on top of each other.

*Units check:* $\mathrm{m^3/s^2} \times \mathrm{s^2} = \mathrm{m^3}$, and the cube root of cubic metres is metres.
:::

## Quadratic equations by factoring

A **quadratic equation** has the unknown squared. Its **standard form** is

$$
ax^2 + bx + c = 0, \qquad a \neq 0,
$$

with everything moved to one side and zero on the other. The letters $a$, $b$ and $c$ stand for fixed numbers. ($a$ cannot be zero, or there would be no $x^2$ and it would not be a quadratic.)

If the left side factors, the zero-product property from the last lesson finishes the job. If two things multiply to zero, one of them is zero:

$$
2x^2 - 7x + 3 = 0 \;\Rightarrow\; (2x - 1)(x - 3) = 0 \;\Rightarrow\; x = \tfrac{1}{2} \text{ or } x = 3 .
$$

A quadratic has at most two real solutions, and factoring finds both at once. *Check* $x = 3$: $2(9) - 21 + 3 = 0$.

::: warning Never divide by the unknown
Faced with $x^2 = 2x$, it is tempting to divide both sides by $x$ and get $x = 2$. But that throws away the answer $x = 0$. Dividing by $x$ is illegal when $x$ is zero — and zero is exactly one of the answers. Instead, move everything to one side and factor: $x^2 - 2x = x(x - 2) = 0$, so $x = 0$ or $x = 2$. The same slip loses the "nothing happens" solution of many physics equations.
:::

## Completing the square and the quadratic formula

Most quadratics do not factor into nice numbers. For those there is a trick with a picture behind it.

Think of $x^2 + 6x$ as an area: an $x$-by-$x$ square, plus a strip $6$ wide and $x$ long. Cut the strip in half lengthwise, into two strips $3$ wide, and stick one along the right side of the square and one along the bottom. Now you almost have a bigger square, $x + 3$ on each side — except for a $3$-by-$3$ corner that is missing. Add that corner, $9$, and the square is complete:

$$
x^2 + 6x + 9 = (x + 3)^2 .
$$

That is **[[completing the square|square-corner]]**. In general, half the middle coefficient, squared, fills the corner: $(x + \tfrac{p}{2})^2 = x^2 + px + \tfrac{p^2}{4}$. Here it is solving an equation — whatever you add to one side, add to the other:

$$
x^2 + 6x - 7 = 0 \;\Rightarrow\; x^2 + 6x + 9 = 7 + 9 \;\Rightarrow\; (x + 3)^2 = 16 \;\Rightarrow\; x + 3 = \pm 4 \;\Rightarrow\; x = 1 \text{ or } x = -7 .
$$

The first step moved the $-7$ across (as $+7$) and added the corner, $9$, to both sides. Then a number whose square is $16$ must be $4$ or $-4$. *Check* $x = -7$: $49 - 42 - 7 = 0$.

### The same thing with letters

Do this once with $a$, $b$ and $c$ instead of numbers, and you get a formula that solves every quadratic. Start from $ax^2 + bx + c = 0$.

1. Divide every term by $a$, so $x^2$ stands alone. Then move the constant to the right side:

$$
x^2 + \frac{b}{a}x = -\frac{c}{a} .
$$

2. The middle coefficient is $\frac{b}{a}$. Half of it is $\frac{b}{2a}$, and its square is $\frac{b^2}{4a^2}$. Add that corner to both sides:

$$
x^2 + \frac{b}{a}x + \frac{b^2}{4a^2} = \frac{b^2}{4a^2} - \frac{c}{a} .
$$

3. The left side is now a perfect square. On the right, write $\frac{c}{a}$ as $\frac{4ac}{4a^2}$ so both pieces share a bottom:

$$
\left(x + \frac{b}{2a}\right)^2 = \frac{b^2 - 4ac}{4a^2} .
$$

4. Take the square root of both sides, remembering the $\pm$. The square root of the bottom, $4a^2$, is $2a$. Then subtract $\frac{b}{2a}$ from both sides:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} .
$$

That is the **quadratic formula**. To use it, put the equation in standard form, read off $a$, $b$ and $c$ (with their signs!), and substitute.

### The discriminant: how many answers?

The part under the root, $b^2 - 4ac$, is called the **discriminant**, and it is often written $\Delta$. (Careful: this is the same Greek letter "delta" that meant "change in" back in the first lesson. Here it is only a name.) It tells you what kind of answer to expect before you work anything out:

- $\Delta > 0$: two different real solutions (the $+$ and the $-$ give different numbers).
- $\Delta = 0$: one repeated solution, $x = -\frac{b}{2a}$ (adding or subtracting zero changes nothing).
- $\Delta < 0$: no real solutions (no real number is the square root of a negative).

Picture the graph of $y = ax^2 + bx + c$. It is a U-shaped curve called a **[[parabola|parabola-crossings]]**. The solutions are where it crosses the line $y = 0$. It can cross twice, touch once, or miss entirely.

For $3x^2 + 2x + 5 = 0$: $\Delta = 2^2 - 4(3)(5) = 4 - 60 = -56$. Negative, so the parabola never reaches zero and there is no real solution. In physics, a negative discriminant usually means the thing you asked about cannot happen: a line of sight that misses the planet, or a speed that is never reached.

### Vieta's relations: a quick check on the roots

Two more facts fall out of the formula. Call the two roots $x_1$ and $x_2$ ("x one" and "x two"). Then

$$
x_1 + x_2 = -\frac{b}{a}, \qquad x_1 x_2 = \frac{c}{a} .
$$

These are **[[Vieta's relations|vieta]]**. Try them on $2x^2 - 7x + 3$, whose roots are $\tfrac{1}{2}$ and $3$. Sum: $\tfrac{1}{2} + 3 = 3.5$, and $-\frac{b}{a} = \frac{7}{2} = 3.5$. Product: $\tfrac{1}{2} \times 3 = 1.5$, and $\frac{c}{a} = \frac{3}{2} = 1.5$. They are the fastest check on a pair of roots — and the product one is about to earn its keep.

::: note Why it has to be true
Write $s = \sqrt{b^2 - 4ac}$, so the roots are $x_1 = \frac{-b + s}{2a}$ and $x_2 = \frac{-b - s}{2a}$.

*Adding* them, the $+s$ and $-s$ cancel: $x_1 + x_2 = \frac{-2b}{2a} = -\frac{b}{a}$.

*Multiplying* them uses the difference of squares, $(p + q)(p - q) = p^2 - q^2$, with $p = -b$ and $q = s$: $x_1 x_2 = \frac{b^2 - s^2}{4a^2} = \frac{b^2 - (b^2 - 4ac)}{4a^2} = \frac{4ac}{4a^2} = \frac{c}{a}$.
:::

::: example Time of flight of a thrown object
A ball is thrown straight up at $20\,\mathrm{m/s}$ from the top of a $100\,\mathrm{m}$ tower. Its height after $t$ seconds is

$$
h(t) = 100 + 20t - \tfrac{1}{2}gt^2 ,
$$

with $g = 9.80665\,\mathrm{m/s^2}$, so $\tfrac{1}{2}g = 4.903$. When does it hit the ground?

*Step 1: set the height to zero* and tidy into standard form. Multiplying every term by $-1$ makes the $t^2$ coefficient positive, which is easier to work with:

$$
4.903\,t^2 - 20t - 100 = 0, \qquad a = 4.903,\; b = -20,\; c = -100 .
$$

*Step 2: the discriminant.*

$$
\Delta = (-20)^2 - 4(4.903)(-100) = 400 + 1961.2 = 2361.2, \qquad \sqrt{\Delta} \approx 48.59 .
$$

(The two minus signs in $-4 \times (-100)$ made a plus.) It is positive, so expect two answers.

*Step 3: the formula.* Since $b = -20$, the $-b$ on top is $+20$. The bottom is $2a = 9.806$:

$$
t = \frac{20 \pm 48.59}{9.806} = 6.99\,\mathrm{s} \quad\text{or}\quad -2.92\,\mathrm{s} .
$$

*Step 4: make sense of it.* The negative answer is a time *before* the throw, when the same curve, traced backwards, would have passed ground level. It is correct maths but not part of this story, so the answer is $t \approx 6.99\,\mathrm{s}$. That seems reasonable: the ball goes up for about two seconds, then falls more than $100\,\mathrm{m}$.

*Check with Vieta:* the product of the roots should be $\frac{c}{a} = \frac{-100}{4.903} = -20.40$, and $6.99 \times (-2.92) = -20.4$. It matches.

Note that $-b$ came out *positive* because $b$ itself was negative. Missing that is the most common slip with the formula.
:::

## The numerically stable small root

Here is a puzzle. How do you find a truck driver's weight with a truck scale that reads only to the nearest $100\,\mathrm{kg}$? Weigh the truck with the driver, then without, and subtract? Both readings might be $15\,000\,\mathrm{kg}$, and the difference would say the driver weighs nothing. Subtracting two big, nearly equal numbers wipes out almost all the useful digits.

The quadratic formula can fall into exactly that trap. When $b^2$ is much bigger than $4ac$ (written $b^2 \gg 4ac$, read "much greater than"), the root $\sqrt{b^2 - 4ac}$ is very nearly the same size as $b$. For one of the two roots, the top of the formula, $-b \pm \sqrt{\Delta}$, is then the difference of two nearly equal numbers, and most of the **significant figures** — the digits that carry real information — cancel out. This is called **[[catastrophic cancellation|cancellation]]**. It is not a textbook curiosity. It turns up whenever a quadratic has one large root and one tiny root — for example, in a system with one fast motion and one slow one.

The fix uses Vieta's product. First compute the *large* root, choosing the sign so that $-b$ and the square root **add** instead of cancel. Then get the small root by dividing:

$$
x_{\text{large}} = \frac{-b - \operatorname{sign}(b)\sqrt{b^2 - 4ac}}{2a}, \qquad x_{\text{small}} = \frac{c}{a\,x_{\text{large}}} .
$$

Here $\operatorname{sign}(b)$ is $+1$ when $b$ is positive and $-1$ when $b$ is negative. It picks whichever of $\pm$ makes the two pieces on top have the same sign. The second formula is Vieta's $x_1 x_2 = \frac{c}{a}$, solved for the small root.

::: example Cancellation in a quadratic with one tiny root
Solve $x^2 - 2000x + 1 = 0$, keeping only four significant figures, as a cheap calculator or a hurried hand would. Here $a = 1$, $b = -2000$, $c = 1$.

The discriminant is $\Delta = 4\,000\,000 - 4 = 3\,999\,996$. To four figures, $\sqrt{\Delta} = 2000$. The formula gives

$$
x_{\text{large}} = \frac{2000 + 2000}{2} = 2000, \qquad x_{\text{small}} = \frac{2000 - 2000}{2} = 0 .
$$

The small root has come out as zero — a $100\%$ error — even though every step kept four figures. The truck scale strikes again.

The stable route: $x_{\text{small}} = \frac{c}{a\,x_{\text{large}}} = \frac{1}{2000} = 5.000 \times 10^{-4}$, correct to the precision you kept. (The true roots are $1999.9995$ and $5.000001 \times 10^{-4}$.)

Computers fall into the same trap, only further out. They keep about sixteen significant figures, so it takes a more lopsided quadratic. For $x^2 - 10^8 x + 1 = 0$, the plain formula returns a small root of $7.45 \times 10^{-9}$, but the correct value is $1.00 \times 10^{-8}$. That is a $25\%$ error from a formula that is perfectly correct algebra:

```python
import math

a, b, c = 1.0, -1e8, 1.0
d = math.sqrt(b * b - 4 * a * c)

naive_small = (-b - d) / (2 * a)               # subtracts two nearly equal numbers
large = (-b - math.copysign(d, b)) / (2 * a)   # -b and the root have the same sign: they add
stable_small = c / (a * large)                 # Vieta: x1 * x2 = c / a

print(naive_small)   # 7.450580596923828e-09
print(stable_small)  # 1e-08
```

Solving quadratics in flight software means using the stable form.
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
The first: distribute to get $3x - 3 + 2 = 3x + 4$, so $3x - 1 = 3x + 4$. Subtract $3x$ from both sides: $-1 = 4$, which is false. There is **no solution**. (Graph each side as a line: they have the same slope and never meet.)

The second: multiply both sides by $10$ (this is also called cross-multiplying): $2(2x - 1) = 5(x + 3)$, so $4x - 2 = 5x + 15$. Subtract $4x$ and $15$ from both sides: $x = -17$. *Check:* $\tfrac{2(-17) - 1}{5} = \tfrac{-35}{5} = -7$ and $\tfrac{-17 + 3}{2} = \tfrac{-14}{2} = -7$.
:::

::: check
Solve $E = \tfrac{1}{2}mv^2$ for $v$. Why is there only one physically meaningful answer even though the algebra gives two?
:::

::: answer
Undo in reverse: multiply by $2$, divide by $m$, then take the square root, remembering $\pm$: $v = \pm\sqrt{2E/m}$.

Kinetic energy depends on the speed squared, so $v$ and $-v$ give the same $E$. If $v$ stands for a speed (a size, never negative), only the positive root applies. For example, with $E = 2.94 \times 10^{10}\,\mathrm{J}$ and $m = 1000\,\mathrm{kg}$: $v = \sqrt{2 \times 2.94 \times 10^{10} / 1000} = \sqrt{5.88 \times 10^7} \approx 7670\,\mathrm{m/s}$ — orbital speed.
:::

::: check
Solve $3x^2 - 10x - 8 = 0$ with the quadratic formula and confirm the roots with Vieta's relations.
:::

::: answer
Read off $a = 3$, $b = -10$, $c = -8$. Then $\Delta = (-10)^2 - 4(3)(-8) = 100 + 96 = 196$, and $\sqrt{\Delta} = 14$. So $x = \dfrac{10 \pm 14}{6}$, giving $x = \frac{24}{6} = 4$ and $x = \frac{-4}{6} = -\tfrac{2}{3}$.

Vieta: the sum $4 - \tfrac{2}{3} = \tfrac{10}{3}$ equals $-b/a = \tfrac{10}{3}$, and the product $4 \times (-\tfrac{2}{3}) = -\tfrac{8}{3}$ equals $c/a = -\tfrac{8}{3}$. Both agree, and they match the factorisation $(3x + 2)(x - 4)$ from the previous lesson.
:::

::: check
For which values of $k$ does $x^2 + kx + 9 = 0$ have exactly one real solution, and what is it?
:::

::: answer
Exactly one solution needs the discriminant to be zero: $\Delta = k^2 - 4(1)(9) = k^2 - 36 = 0$, so $k^2 = 36$ and $k = \pm 6$.

The repeated root is $x = -\tfrac{b}{2a} = -\tfrac{k}{2}$. For $k = 6$ that is $x = -3$ (the equation is $(x + 3)^2 = 0$). For $k = -6$ it is $x = 3$ (the equation is $(x - 3)^2 = 0$).
:::

::: check
Find both roots of $x^2 - 5000x + 2 = 0$ in a way that keeps full precision for the small one.
:::

::: answer
Here $b = -5000$, so $-b = +5000$, and $\sqrt{\Delta} = \sqrt{25 \times 10^6 - 8} \approx 4999.9992$.

The large root is the one where the two pieces add: $x_{\text{large}} = \frac{5000 + 4999.9992}{2} \approx 4999.9996$.

The small root comes from Vieta: $x_{\text{small}} = \frac{c}{a\,x_{\text{large}}} = \frac{2}{4999.9996} \approx 4.0000003 \times 10^{-4}$.

The plain subtraction $\frac{5000 - 4999.9992}{2}$ would have kept only a couple of significant figures of that value. Sanity check: the two roots multiply to about $2$, which is $c/a$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Legal moves | same addition, non-zero multiplication, one-to-one operation on both sides; squaring can add fake roots |
| Linear | collect the unknown, divide; identity if something always true remains, no solution if something false remains |
| Literal equations | undo operations in reverse order; collect a repeated symbol before dividing |
| $\zeta$ inverted | $m_p = \zeta m_d / (1 - \zeta)$ |
| Period inverted | $r = \left(\mu T^2 / 4\pi^2\right)^{1/3}$; $T = 86\,164\,\mathrm{s}$ gives $42\,164\,\mathrm{km}$ |
| Zero product | factor, then set each factor $= 0$; never divide by the unknown |
| Completing the square | $x^2 + px = (x + p/2)^2 - p^2/4$ |
| Quadratic formula | $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ |
| Discriminant | $b^2 - 4ac > 0$: two roots; $= 0$: one; $< 0$: none real |
| Vieta | $x_1 + x_2 = -b/a$, $x_1 x_2 = c/a$ |
| Stable small root | $x_{\text{small}} = c / (a\,x_{\text{large}})$ when $b^2 \gg 4ac$ |

The next lesson has several unknowns at once: **systems of equations**, where the same legal moves are applied to two or three equations together.

::: context gnc What G, N and C stand for
GNC is **guidance, navigation and control** — the brain and reflexes of a flying vehicle.

- *Navigation* answers "where am I, and how fast am I going?"
- *Guidance* answers "where should I go, and what path gets me there?"
- *Control* answers "how do I point the engines and fins to follow that path?"

A Falcon 9 booster coming back to land on a ship at sea is all three working together, many times a second — and every one of those jobs is full of formulas solved for one letter.
:::

::: context discriminant-word The number that tells cases apart
To *discriminate* first meant simply "to tell apart", from the Latin *discriminare*, to separate. The discriminant tells the three kinds of quadratic apart — two answers, one answer, or none — before you do any of the work.

The English mathematician James Joseph Sylvester gave it this name in 1851.
:::

::: context balance-scale Keep the pans level
Here is a scale with $2x + 3$ on the left pan and $9$ on the right. It balances, so the two sides are equal. Take $3$ off *both* pans and it still balances: $2x = 6$. Halve what is on *both* pans and it still balances: $x = 3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="180,50 165,150 195,150" fill="#6c7a93"/>
  <rect x="140" y="150" width="80" height="8" fill="#6c7a93"/>
  <line x1="60" y1="50" x2="300" y2="50" stroke="#1f2a44" stroke-width="4"/>
  <circle cx="180" cy="50" r="5" fill="#1f2a44"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="70" y1="50" x2="45" y2="100"/><line x1="70" y1="50" x2="95" y2="100"/>
    <line x1="290" y1="50" x2="265" y2="100"/><line x1="290" y1="50" x2="315" y2="100"/>
  </g>
  <path d="M40,100 L100,100 L92,110 L48,110 Z" fill="#1f2a44"/>
  <path d="M260,100 L320,100 L312,110 L268,110 Z" fill="#1f2a44"/>
  <rect x="44" y="76" width="52" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="272" y="76" width="36" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="93" font-size="13" text-anchor="middle" fill="#1f2a44">2x + 3</text>
  <text x="290" y="93" font-size="13" text-anchor="middle" fill="#1f2a44">9</text>
  <text x="180" y="174" font-size="12" text-anchor="middle" fill="#1f2a44">level beam: 2x + 3 = 9</text>
</svg>
```

Take $3$ off only one pan and the scale tips: the equation is no longer true. Every legal move in this lesson is a way of changing both pans by the same amount.
:::

::: context newton-merlin Newton's law, a real engine
Isaac Newton set out his three laws of motion in 1687, in a book usually called the *Principia*. He wrote the second law in words, about "change of motion"; the tidy form $F = ma$ came later.

The force in the example is realistic: about $845\,\mathrm{kN}$ is the sea-level thrust of one Merlin engine, and nine of them lift a Falcon 9. The whole rocket weighs more than $500$ tonnes at lift-off, though, so its real starting acceleration is far gentler than $3.4g$.
:::

::: context three-g Why 3 g is a real number
Three times Earth's gravity is not a random choice. The Space Shuttle throttled its engines back near the end of its climb to keep the crew's acceleration at about $3g$ — three times their normal weight pressing them into their seats.

Real rockets do not hold $3g$ the whole way. They start much gentler, lose speed fighting gravity and air, and reach orbit after about eight or nine minutes rather than four and a half.
:::

::: context pendulum Richer's slow clock
In 1672 the French astronomer Jean Richer took a pendulum clock from Paris to Cayenne, in South America near the equator. There it lost about two and a half minutes a day. The pendulum swung more slowly because gravity is slightly weaker near the equator — partly because Earth spins, partly because it bulges there.

Turned around as $g = 4\pi^2 L / T^2$, careful swing times became the first maps of how gravity changes around the world.
:::

::: context geostationary Clarke's orbit
The writer Arthur C. Clarke described using satellites at this height to relay radio and television around the world in a magazine article in 1945 — twelve years before the first satellite of any kind was launched. Syncom 3 became the first geostationary satellite in 1964 and carried live TV of the Tokyo Olympics across the Pacific.

Today hundreds of communication and weather satellites share this one thin ring above the equator, which is why places in it are handed out by international agreement.
:::

::: context sidereal-day Why the star day is shorter
An ordinary day is measured by the Sun: noon to noon. But while Earth spins once, it also moves about $\frac{1}{365}$ of the way around the Sun, so it must turn a little extra to face the Sun again. Measured against the far-away stars, one turn takes only $86\,164\,\mathrm{s}$ — about $3$ minutes $56$ seconds less than $24$ hours.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <path d="M194.1,181.8 A170,170 0 0 0 194.1,38.2" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="40" cy="110" r="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">Sun</text>
  <circle cx="204.2" cy="154" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="204.2" cy="66" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="204.2" y1="154" x2="170" y2="144.8" stroke="#b4232c" stroke-width="2"/>
  <polygon points="165.6,143.6 174.4,141.8 172.3,149.6" fill="#b4232c"/>
  <line x1="204.2" y1="66" x2="170" y2="56.8" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <polygon points="165.6,55.6 174.3,53.8 172.3,61.6" fill="#6c7a93"/>
  <line x1="204.2" y1="66" x2="170" y2="75.2" stroke="#b4232c" stroke-width="2"/>
  <polygon points="165.6,76.4 172.3,70.4 174.3,78.2" fill="#b4232c"/>
  <path d="M177.2,58.75 A28,28 0 0 0 177.2,73.25" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="160" y="50" font-size="11" text-anchor="end" fill="#6c7a93">to a far star</text>
  <g font-size="11" fill="#1f2a44">
    <text x="226" y="150">day 1, noon:</text>
    <text x="226" y="165">Sun and star in line</text>
    <text x="226" y="46">one turn later:</text>
    <text x="226" y="60">faces the star again,</text>
    <text x="226" y="74" fill="#1d6fd1">must turn about 1°</text>
    <text x="226" y="88" fill="#1d6fd1">more to face the Sun</text>
  </g>
  <text x="180" y="210" font-size="11" text-anchor="middle" fill="#6c7a93">(Earth's move drawn far bigger than real)</text>
</svg>
```

A geostationary satellite has to keep pace with Earth's true spin, so its period is the star day, not the Sun day.
:::

::: context square-corner The missing corner
Here is the picture from the text. The $x$-by-$x$ square plus two strips $3$ wide make an almost-square, $x + 3$ on each side. Only the corner is missing, and it is $3 \times 3 = 9$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="20" width="100" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="20" width="30" height="100" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="120" width="100" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="120" width="30" height="30" fill="#fff" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <text x="90" y="75">x²</text><text x="155" y="75">3x</text><text x="90" y="140">3x</text>
    <text x="90" y="14">x</text><text x="155" y="14">3</text>
    <text x="28" y="74">x</text><text x="28" y="139">3</text>
  </g>
  <text x="155" y="140" font-size="13" text-anchor="middle" fill="#b4232c" font-weight="700">9</text>
  <g font-size="13" fill="#1f2a44">
    <text x="195" y="70">x² + 6x + 9</text>
    <text x="195" y="92">= (x + 3)²</text>
    <text x="195" y="140" fill="#b4232c" font-size="12">the corner you add</text>
  </g>
</svg>
```

With letters: for $x^2 + px$, each strip is $\frac{p}{2}$ wide, so the corner is $\left(\frac{p}{2}\right)^2$ — exactly the piece added in step 2 of the quadratic formula's derivation.
:::

::: context parabola-crossings Two, one or none
The solutions of $ax^2 + bx + c = 0$ are where the curve $y = ax^2 + bx + c$ meets the horizontal line $y = 0$. Slide the curve up or down (change $c$) and the number of meeting points changes. The discriminant tells you which picture you are in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="10" y1="80" x2="110" y2="80"/><line x1="130" y1="80" x2="230" y2="80"/><line x1="250" y1="80" x2="350" y2="80"/>
  </g>
  <g fill="none" stroke="#1d6fd1" stroke-width="2.5">
    <path d="M20,30 Q60,170 100,30"/>
    <path d="M140,20 Q180,140 220,20"/>
    <path d="M260,10 Q300,110 340,10"/>
  </g>
  <g fill="#b4232c">
    <circle cx="38.6" cy="80" r="4"/><circle cx="81.4" cy="80" r="4"/>
    <circle cx="180" cy="80" r="4"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="60" y="122">two roots</text><text x="180" y="122">one root</text><text x="300" y="122">no real roots</text>
    <text x="60" y="140">Δ &gt; 0</text><text x="180" y="140">Δ = 0</text><text x="300" y="140">Δ &lt; 0</text>
  </g>
</svg>
```

A thrown ball traces this same curve through the air (ignoring air drag), which is why the time-of-flight example below is a quadratic.
:::

::: context vieta The lawyer who used letters
François Viète was a French lawyer and adviser to kings in the late 1500s who did mathematics in his spare time. He was one of the first to use letters for numbers in general — vowels for unknowns, consonants for known quantities. That habit is what makes a formula like the quadratic formula possible at all: one line that covers every $a$, $b$ and $c$.

He also cracked coded Spanish letters for the French king, Henry IV.
:::

::: context cancellation Rounding is not a detail
A computer stores every number with a fixed number of digits, so every result is rounded. Usually that is harmless. It bites when you subtract nearly equal numbers, or let tiny errors pile up.

In 1991, during the Gulf War, a Patriot air-defence battery in Dhahran, Saudi Arabia, had been running for about $100$ hours. A tiny rounding error in the way it counted tenths of a second had grown to about a third of a second. It looked in the wrong place for an incoming missile, which struck a barracks and killed $28$ American soldiers. Not the same trap as this one, but the same family.
:::
