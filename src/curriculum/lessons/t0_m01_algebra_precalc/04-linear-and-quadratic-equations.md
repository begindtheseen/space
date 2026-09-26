---
id: l04-linear-and-quadratic-equations
title: Linear and quadratic equations
minutes: 22
covers:
  - linear and quadratic equations
---

In the morning you put on your socks, then your shoes. At night you undo it in the opposite order: shoes off first, then socks. Solving an equation works the same way. Something was done to the unknown number, step by step. To get it back on its own, you undo those steps in reverse order.

Most of the algebra a GNC engineer does in a day is not solving for a mystery $x$. It is taking a *formula* and getting one of its letters by itself: the burnout mass from the mass ratio, the size of an orbit from the time it takes to go around, the time to fall from a given height. The numbers come in at the end. So this lesson treats solving as what it is — undoing operations in reverse order, doing the same thing to both sides — and uses it on formulas full of letters as much as on equations with numbers.

The second half is about **quadratics**, equations where the unknown is squared. They appear the moment anything is squared, which in physics is constantly: distance travelled while speeding up, energy of motion, the distance to a point on a circle. You will derive the famous quadratic formula rather than memorise it. You will meet the **discriminant**, which tells you how many answers there are before you work any of them out. And you will learn the one number trap hidden inside the formula, which has caught out real flight software.

Every answer in this lesson ends with a check: put it back into the original equation and see that both sides match. Make that a reflex now, while the equations are easy.

## What solving means

Picture an old-fashioned balance scale with two pans. An **equation** says the two pans weigh the same: whatever is on the left equals whatever is on the right. If you add a kilogram to one pan, you must add a kilogram to the other, or it tips. That is the whole idea of solving.

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

**Newton's second law**, $F = ma$ (force equals mass times acceleration). Here $a$ was multiplied by $m$. Undo that by dividing both sides by $m$: $a = F/m$. An engine pushing with $F = 845\,\mathrm{kN}$ on a $25\,000\,\mathrm{kg}$ vehicle gives

$$
a = \frac{845\,000\,\mathrm{N}}{25\,000\,\mathrm{kg}} = 33.8\,\mathrm{m/s^2},
$$

about $3.4$ times $g$ (Earth's gravity, $9.81\,\mathrm{m/s^2}$).

**Speeding up steadily**, $v = v_0 + at$. The final speed $v$ is the starting speed $v_0$ ("v nought") plus acceleration $a$ times time $t$. The recipe for $t$ was: multiply by $a$, then add $v_0$. Undo in reverse: first subtract $v_0$, then divide by $a$:

$$
t = \frac{v - v_0}{a} .
$$

How long would it take to reach orbital speed, $7670\,\mathrm{m/s}$, from rest at a steady $3g$? Here $a = 3 \times 9.80665 = 29.42\,\mathrm{m/s^2}$, so $t = \frac{7670 - 0}{29.42} \approx 261\,\mathrm{s}$ — between four and five minutes.

**When the letter is inside a root**, square both sides. (Both sides here are positive, so squaring cannot create a fake answer.) A pendulum's swing time is $T = 2\pi\sqrt{L/g}$, where $L$ is its length. To solve for $g$, divide by $2\pi$, square, then flip both fractions over:

$$
\left(\frac{T}{2\pi}\right)^2 = \frac{L}{g} \;\Rightarrow\; g = \frac{4\pi^2 L}{T^2} .
$$

A one-metre pendulum that takes $T = 2.006\,\mathrm{s}$ per swing gives $g = \frac{39.48 \times 1}{2.006^2} = \frac{39.48}{4.024} \approx 9.81\,\mathrm{m/s^2}$. For two centuries, this is how gravity was measured.

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
A **geostationary** satellite goes around exactly once per day, so from the ground it seems to hang still in the sky — which is why TV dishes can point at one spot. How high is it?

The time for one circular orbit, the **period**, is $T = 2\pi\sqrt{r^3/\mu}$, where $r$ is the distance from Earth's centre and $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravitational parameter. The recipe for $T$ was: cube $r$, divide by $\mu$, take the square root, multiply by $2\pi$. Undo it in reverse: divide by $2\pi$, square, multiply by $\mu$, take the cube root.

$$
r^3 = \frac{\mu T^2}{4\pi^2}, \qquad r = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} .
$$

One turn of Earth relative to the stars (a **sidereal day**) is $T = 86\,164\,\mathrm{s}$, a few minutes shorter than $24$ hours. Now the arithmetic, one step at a time:

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

That is **completing the square**. In general, half the middle coefficient, squared, fills the corner: $(x + \tfrac{p}{2})^2 = x^2 + px + \tfrac{p^2}{4}$. Here it is solving an equation — whatever you add to one side, add to the other:

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

Picture the graph of $y = ax^2 + bx + c$. It is a U-shaped curve called a **parabola**. The solutions are where it crosses the line $y = 0$. It can cross twice, touch once, or miss entirely.

For $3x^2 + 2x + 5 = 0$: $\Delta = 2^2 - 4(3)(5) = 4 - 60 = -56$. Negative, so the parabola never reaches zero and there is no real solution. In physics, a negative discriminant usually means the thing you asked about cannot happen: a line of sight that misses the planet, or a speed that is never reached.

### Vieta's relations: a quick check on the roots

Two more facts fall out of the formula. Call the two roots $x_1$ and $x_2$ ("x one" and "x two"). Then

$$
x_1 + x_2 = -\frac{b}{a}, \qquad x_1 x_2 = \frac{c}{a} .
$$

These are **Vieta's relations**. Try them on $2x^2 - 7x + 3$, whose roots are $\tfrac{1}{2}$ and $3$. Sum: $\tfrac{1}{2} + 3 = 3.5$, and $-\frac{b}{a} = \frac{7}{2} = 3.5$. Product: $\tfrac{1}{2} \times 3 = 1.5$, and $\frac{c}{a} = \frac{3}{2} = 1.5$. They are the fastest check on a pair of roots — and the product one is about to earn its keep.

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

The quadratic formula can fall into exactly that trap. When $b^2$ is much bigger than $4ac$ (written $b^2 \gg 4ac$, read "much greater than"), the root $\sqrt{b^2 - 4ac}$ is very nearly the same size as $b$. For one of the two roots, the top of the formula, $-b \pm \sqrt{\Delta}$, is then the difference of two nearly equal numbers, and most of the **significant figures** — the digits that carry real information — cancel out. This is called **catastrophic cancellation**. It is not a textbook curiosity. It turns up whenever a quadratic has one large root and one tiny root — for example, in a system with one fast motion and one slow one.

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
