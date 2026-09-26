---
id: l10-square-roots-and-pythagoras
title: Squares, square roots and Pythagoras
minutes: 22
covers:
  - squares, square roots and the Pythagorean theorem
---

Tile a square floor with $5$ tiles along each side and you use $5 \times 5 = 25$ tiles. That is a **square number**. Now go backwards: someone hands you $36$ tiles and asks for a square floor. How long is each side? That backwards question is a **square root**, and the answer here is $6$.

This lesson is about squares, their roots, and the most useful thing you can do with them: the **Pythagorean theorem**. It lets you find a distance you cannot measure directly — straight through, instead of around. A tracking station on the ground knows how high a rocket is and how far away along the ground it is. The theorem tells it the straight-line distance to point its antenna. A rocket's navigation computer knows how fast it is going sideways and how fast it is going up. The theorem gives its real speed. Two satellites know each other's position, and the theorem gives the gap between them.

Square roots also turn up on their own. The speed a satellite needs to stay in orbit comes out of a square root, as you will see at the end of the first section. By the end of this lesson you will have every tool that calculation needs.

## Squares and cubes

To **square** a number means to multiply it by itself. We write a small $2$ up and to the right: $5^2 = 5 \times 5 = 25$, read "five squared". The name comes from the floor: a square with sides of length $5$ has area $5^2$.

A whole number times itself gives a **perfect square**. Here are the first fifteen. They are worth knowing by heart, because they are the landmarks you estimate from:

| $n$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $n^2$ | 1 | 4 | 9 | 16 | 25 | 36 | 49 | 64 | 81 | 100 | 121 | 144 | 169 | 196 | 225 |

To **cube** a number means to multiply three copies of it: $2^3 = 2 \times 2 \times 2 = 8$, read "two cubed". A cube with edges of length $2$ is made of $8$ small cubes. The first few cubes are $1, 8, 27, 64, 125$, and $10^3 = 1000$.

Two things about squares surprise people:

- **Squaring a number between $0$ and $1$ makes it smaller.** $0.5^2 = 0.5 \times 0.5 = 0.25$. Half of a half is a quarter.
- **Squaring a negative number gives a positive one.** $(-3)^2 = (-3) \times (-3) = 9$, because negative times negative is positive. So a square is never negative.

::: key Squares and cubes
$n^2 = n \times n$ is the area of a square with side $n$. $n^3 = n \times n \times n$ is the volume of a cube with edge $n$. Perfect squares: $1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, \ldots$
:::

## Square roots: undoing a square

Squaring takes a side and gives an area. The **square root** goes the other way: it takes an area and gives the side. The square root of $49$ is the number that, multiplied by itself, makes $49$. That is $7$, and we write

$$
\sqrt{49} = 7.
$$

The tick-shaped symbol $\sqrt{\phantom{x}}$ is the **[[radical sign|radical-sign]]**; read $\sqrt{49}$ as "the square root of forty-nine". Check any square root by squaring the answer: $7 \times 7 = 49$.

You might notice that $(-7) \times (-7)$ is also $49$. By agreement, the $\sqrt{\phantom{x}}$ sign always means the answer that is zero or positive. That matches the picture: a side length is never negative.

Perfect squares have whole-number roots: $\sqrt{1} = 1$, $\sqrt{64} = 8$, $\sqrt{144} = 12$. Every other whole number has a root that is a decimal which goes on forever without repeating — mathematicians call such numbers **[[irrational|irrational]]**. You will use three of them so often that they are worth remembering:

$$
\sqrt{2} \approx 1.414, \qquad \sqrt{3} \approx 1.732, \qquad \sqrt{10} \approx 3.162.
$$

### Estimating between perfect squares

You can get close to any square root without a calculator by trapping it between two perfect squares. Take $\sqrt{50}$. Since $49 < 50 < 64$ ($50$ is bigger than $49$ but smaller than $64$), the root is between $\sqrt{49} = 7$ and $\sqrt{64} = 8$. And $50$ is much closer to $49$ than to $64$, so the root is only a little above $7$. (A calculator says $7.07$.)

::: example Estimating √20
**Trap it.** The perfect squares on either side of $20$ are $16$ and $25$. So $\sqrt{20}$ is between $4$ and $5$.

**Which end is it nearer?** $20$ is $4$ above $16$ and $5$ below $25$: a bit nearer $16$. So the root is a bit under halfway, a bit under $4.5$.

**Test a guess by squaring.** $4.5^2 = 20.25$, slightly too big. $4.4^2 = 19.36$, too small. So the root is between $4.4$ and $4.5$, closer to $4.5$ because $20.25$ is closer to $20$. Try $4.47$: $4.47^2 = 19.98$. Very close.

**Answer.** $\sqrt{20} \approx 4.47$. The calculator gives $4.4721\ldots$, so the pencil answer is right to three figures.
:::

### Numbers smaller than 1

Just as squaring shrinks a number between $0$ and $1$, taking the square root makes it bigger. $\sqrt{0.25} = 0.5$, because $0.5 \times 0.5 = 0.25$. And $\sqrt{0.01} = 0.1$. It feels backwards the first time. Check it by squaring and it always works out.

### On a calculator

Most calculators have a $\sqrt{\phantom{x}}$ key, and in computer code it is usually written `sqrt(...)`. The one danger is what goes under the sign. $\sqrt{9 + 16}$ means "add first, then take the root": $\sqrt{25} = 5$. If you type √, 9, +, 16 on many calculators, you get $\sqrt{9} + 16 = 19$. Use brackets — √(9 + 16) — whenever there is more than one number under the sign.

::: warning The root of a sum is not the sum of the roots
$\sqrt{9 + 16} = \sqrt{25} = 5$. But $\sqrt{9} + \sqrt{16} = 3 + 4 = 7$. They are not equal, and they almost never are. You cannot split a square root across a plus sign. You *can* split it across a times sign: $\sqrt{4 \times 9} = \sqrt{36} = 6$, and $\sqrt{4} \times \sqrt{9} = 2 \times 3 = 6$.
:::

The **cube root** undoes a cube: $\sqrt[3]{8} = 2$, because $2 \times 2 \times 2 = 8$. The small $3$ tucked into the sign says "cube root". You will meet it properly in the next module; for now it is enough to know it exists.

### A square root in orbit

A satellite circling $400\,\mathrm{km}$ above Earth is about $6\,771\,000\,\mathrm{m}$ from Earth's center. Physics (which you will meet in the algebra module) says its speed $v$ comes from dividing a fixed number for Earth, about $398\,600\,000\,000\,000$, by that distance, and taking the square root. The division gives about $58\,870\,000$. So

$$
v = \sqrt{58\,870\,000} \approx 7673\,\mathrm{m/s},
$$

which is about $7.7\,\mathrm{km/s}$. Check by squaring: $7673^2 \approx 58\,870\,000$. That one square root is the speed that keeps a satellite circling at that height: any slower, and its path would dip down toward the air.

## The Pythagorean theorem

Picture a rectangular park, $40\,\mathrm{m}$ one way and $30\,\mathrm{m}$ the other. You are at one corner and want to reach the opposite corner. You could walk along two edges: $40 + 30 = 70\,\mathrm{m}$. Or you could cut straight across the grass. The shortcut is shorter — but how much shorter?

The two edges and the shortcut make a **right triangle**: a triangle with one **right angle**, a square corner of $90^\circ$. The two sides that meet at the right angle are called the **legs**. The side across from the right angle is the longest side, and it is called the **[[hypotenuse|hypotenuse]]**.

Build a square on each side of a right triangle. The **Pythagorean theorem** says the two squares on the legs, together, have exactly the same area as the square on the hypotenuse. In symbols, with legs $a$ and $b$ and hypotenuse $c$:

$$
a^2 + b^2 = c^2.
$$

To find $c$ itself, take the square root of both sides:

$$
c = \sqrt{a^2 + b^2}.
$$

For the park: $a = 30$ and $b = 40$. Then $c^2 = 30^2 + 40^2 = 900 + 1600 = 2500$, and $c = \sqrt{2500} = 50\,\mathrm{m}$. The shortcut saves $20\,\mathrm{m}$.

The simplest whole-number example is the **3–4–5 triangle**: $3^2 + 4^2 = 9 + 16 = 25 = 5^2$. The park was a 3–4–5 triangle scaled up ten times. Other whole-number sets that fit are 5–12–13 and 8–15–17. Builders and carpenters still use [[the 3–4–5 trick|builders-trick]] to check that a corner is square.

::: key The Pythagorean theorem
In a right triangle with legs $a$ and $b$ and longest side (hypotenuse) $c$: $a^2 + b^2 = c^2$. So $c = \sqrt{a^2 + b^2}$; a 3–4–5 triangle is the classic example.
:::

::: note Why it has to be true — a proof by picture
Take a big square with side $a + b$. Arrange four copies of the right triangle inside it, one in each corner, so that each side of the big square is made of one short leg $a$ and one long leg $b$. The empty space left in the middle is a tilted square whose sides are the hypotenuses, so its area is $c^2$.

Now slide the same four triangles into a different arrangement in an identical big square: pair them into two rectangles, $a$ by $b$, and push them into opposite corners. The empty space left is now two squares, one $a$ by $a$ and one $b$ by $b$, with total area $a^2 + b^2$.

Both big squares are the same size, and both contain the same four triangles. So the empty space must be the same in both: $c^2 = a^2 + b^2$. [[See both arrangements drawn|proof-picture]].
:::

::: warning Only right triangles, and c is the longest side
The rule works only when the triangle has a $90^\circ$ corner. And $c$ must be the side *opposite* that corner — always the longest side. If you get a hypotenuse shorter than a leg, something went wrong. Also notice the answer is not $a + b$: the straight line is always shorter than going around two sides.
:::

::: example How far is the rocket from the radar?
A tracking radar sits on the ground. A rocket is $12\,\mathrm{km}$ straight up above a point that is $5\,\mathrm{km}$ from the radar along the ground. How far must the radar's beam reach?

**Find the right triangle.** The ground ($5\,\mathrm{km}$) and the rocket's height ($12\,\mathrm{km}$) meet at a right angle, so they are the legs. The beam is the hypotenuse. Engineers call this straight-line distance the **[[slant range|slant-range]]**.

**Square the legs and add.** $5^2 + 12^2 = 25 + 144 = 169$.

**Take the root.** $c = \sqrt{169} = 13\,\mathrm{km}$.

**Sanity check.** $13$ is longer than either leg, as the hypotenuse must be. It is shorter than $5 + 12 = 17$, as a straight line must be.

**The same math for speed.** At one moment a rocket is moving $1200\,\mathrm{m/s}$ sideways and $900\,\mathrm{m/s}$ upward. Those two motions are at right angles too, so its actual speed is $\sqrt{1200^2 + 900^2} = \sqrt{1\,440\,000 + 810\,000} = \sqrt{2\,250\,000} = 1500\,\mathrm{m/s}$.
:::

## Finding a missing leg

Sometimes you know the hypotenuse and one leg, and need the other leg. Start from $a^2 + b^2 = c^2$ and take $b^2$ away from both sides:

$$
a^2 = c^2 - b^2, \qquad a = \sqrt{c^2 - b^2}.
$$

The only change is a minus sign instead of a plus. That makes sense: a leg is shorter than the hypotenuse, so we subtract.

::: example A drone's distance along the ground
A drone's radio says it is $2.6\,\mathrm{km}$ away in a straight line. Its altimeter says it is $1.0\,\mathrm{km}$ up. How far away is the spot on the ground directly under it?

**Label.** The straight-line distance is the hypotenuse, $c = 2.6$. The height is one leg, $b = 1.0$. We want the other leg $a$.

**Subtract the squares.** $c^2 - b^2 = 2.6^2 - 1.0^2 = 6.76 - 1 = 5.76$.

**Take the root.** $a = \sqrt{5.76} = 2.4\,\mathrm{km}$. (Check: $2.4 \times 2.4 = 5.76$.)

**Sanity check.** $2.4$ is shorter than $2.6$, as a leg must be. And a drone only $1\,\mathrm{km}$ up should be *nearly* as far away along the ground as in a straight line. It is.
:::

::: warning Add for the hypotenuse, subtract for a leg
When you want the longest side, add the squares. When you want a shorter side, subtract. Adding when you should subtract gives a "leg" longer than the hypotenuse — here it would be $\sqrt{6.76 + 1} \approx 2.79\,\mathrm{km}$, which is impossible.
:::

## The distance between two points

On a graph, every point has an address $(x, y)$: how far across, then how far up. To find the straight-line distance between two points, draw the right triangle hiding between them. Go across from one to the other — that is one leg. Go up — that is the other leg. The distance is the hypotenuse.

Label the points $(x_1, y_1)$ and $(x_2, y_2)$. The little numbers are labels, read "x one" and "x two" — they mean "the first point's $x$" and "the second point's $x$". The across leg is $x_2 - x_1$ and the up leg is $y_2 - y_1$, so

$$
d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}.
$$

Take the points $(-2, 1)$ and $(10, 6)$. Across: $10 - (-2) = 12$. Up: $6 - 1 = 5$. Distance: $\sqrt{12^2 + 5^2} = \sqrt{144 + 25} = \sqrt{169} = 13$.

It does not matter which point you call "first". If you swap them, the differences become $-12$ and $-5$, but squaring makes them positive again, and the distance is still $13$.

## Into three dimensions

A room has length, width *and* height. What is the longest straight rod that fits inside a box — from one bottom corner to the opposite top corner?

Use Pythagoras twice. First, across the floor: the floor's diagonal is $\sqrt{l^2 + w^2}$. Then stand that diagonal up against the height. The floor diagonal and the height meet at a right angle, so the [[space diagonal|box-diagonal]] is

$$
d = \sqrt{\left(\sqrt{l^2 + w^2}\right)^2 + h^2} = \sqrt{l^2 + w^2 + h^2}.
$$

(Squaring a square root undoes it, so the inner root disappears.) It is the same rule with one more square added.

A three-unit CubeSat is about $10 \times 10 \times 30\,\mathrm{cm}$. The longest antenna rod that fits inside is $\sqrt{10^2 + 10^2 + 30^2} = \sqrt{100 + 100 + 900} = \sqrt{1100} \approx 33.2\,\mathrm{cm}$ — a little longer than the box itself, as the corner-to-corner line should be.

::: example The gap between two satellites
A small inspection satellite is flying near a larger one. Measured from the large one, the small one is $2\,\mathrm{km}$ ahead, $3\,\mathrm{km}$ to the side and $6\,\mathrm{km}$ above. How far apart are they?

**Three legs at right angles.** Ahead, sideways and up are all at right angles to each other, so the distance is the space diagonal.

**Square and add.** $2^2 + 3^2 + 6^2 = 4 + 9 + 36 = 49$.

**Take the root.** $d = \sqrt{49} = 7\,\mathrm{km}$.

**Sanity check.** $7$ is longer than the biggest single leg, $6$, but shorter than $2 + 3 + 6 = 11$. Real rendezvous software does exactly this calculation, many times a second.
:::

::: note Where this comes back
- [Exponents, radicals and scaling laws](#/module/t0_m01_algebra_precalc?lesson=l02-exponents-and-radicals) gives square roots their full rules and derives the orbital speed $v = \sqrt{\mu / r}$ you met above.
- [Angles, radians and the unit circle](#/module/t0_m02_trigonometry?lesson=l01-angles-radians-unit-circle) uses $x^2 + y^2 = 1$ — Pythagoras on a circle of radius $1$ — as the root of every trigonometry identity.
- [Sine, cosine, tangent and their inverses](#/module/t0_m02_trigonometry?lesson=l02-sin-cos-tan-inverses) names the ratios between the sides of a right triangle, and finds missing sides with them.
- [Vectors, norms and the dot product](#/module/t0_m04_linear_algebra_1?lesson=l01-vectors-norms-dot-product) measures the length of a position or velocity as $\sqrt{x^2 + y^2 + z^2}$ — the space diagonal from this lesson.
:::

## Check yourself

::: check
Without a calculator, say which two whole numbers $\sqrt{130}$ lies between, and which one it is closer to. Then improve your estimate to one decimal place.
:::

::: answer
The perfect squares around $130$ are $121 = 11^2$ and $144 = 12^2$. So $\sqrt{130}$ is between $11$ and $12$. $130$ is $9$ above $121$ and $14$ below $144$, so the root is closer to $11$.

Test: $11.4^2 = 129.96$, slightly under $130$, and $11.5^2 = 132.25$, over. So $\sqrt{130} \approx 11.4$. (The calculator says $11.40$.)
:::

::: check
A triangle has sides $7$, $24$ and $25$. Is it a right triangle? If so, which side is the hypotenuse?
:::

::: answer
Test the two shorter sides against the longest: $7^2 + 24^2 = 49 + 576 = 625$, and $25^2 = 625$. They match, so yes, it is a right triangle. The hypotenuse is the longest side, $25$, and the right angle is between the sides of length $7$ and $24$.
:::

::: check
A small plane flies $100\,\mathrm{km}$ due east, then turns and flies $60\,\mathrm{km}$ due north. How far is it from where it started, in a straight line?
:::

::: answer
East and north are at right angles, so the legs are $100$ and $60$ and the distance is the hypotenuse:

$c = \sqrt{100^2 + 60^2} = \sqrt{10\,000 + 3600} = \sqrt{13\,600} \approx 116.6\,\mathrm{km}$.

Check: longer than $100$, shorter than $100 + 60 = 160$.
:::

::: check
A support cable $17\,\mathrm{m}$ long runs from the top of an antenna mast to a spike in the ground $8\,\mathrm{m}$ from the mast's base. The mast stands straight up. How tall is it?
:::

::: answer
The cable is the hypotenuse, $c = 17$. The ground distance is a leg, $b = 8$. Subtract the squares:

$a = \sqrt{17^2 - 8^2} = \sqrt{289 - 64} = \sqrt{225} = 15\,\mathrm{m}$.

Check: $8^2 + 15^2 = 64 + 225 = 289 = 17^2$. And $15 < 17$, as a leg must be.
:::

::: check
Find the distance between the points $(1, -3)$ and $(4, 1)$. Then find the corner-to-corner distance through a box that is $2\,\mathrm{m}$ by $3\,\mathrm{m}$ by $6\,\mathrm{m}$.
:::

::: answer
Points: across is $4 - 1 = 3$, up is $1 - (-3) = 4$. Distance $= \sqrt{3^2 + 4^2} = \sqrt{25} = 5$. A 3–4–5 triangle in disguise.

Box: $\sqrt{2^2 + 3^2 + 6^2} = \sqrt{4 + 9 + 36} = \sqrt{49} = 7\,\mathrm{m}$.
:::

::: check
A friend says $\sqrt{25 + 144} = 5 + 12 = 17$. Explain what went wrong and give the right answer.
:::

::: answer
They split the square root across a plus sign, which is not allowed. Add first: $25 + 144 = 169$, then $\sqrt{169} = 13$. (This is exactly Pythagoras for a triangle with legs $5$ and $12$: the hypotenuse is $13$, not the $17$ you get walking around the two legs.)
:::

## Summary

| Idea | In one line |
| --- | --- |
| Square, cube | $n^2 = n \times n$ (area), $n^3 = n \times n \times n$ (volume) |
| Square root | $\sqrt{x}$ is the number $\geq 0$ whose square is $x$; check by squaring |
| Estimating | trap between perfect squares, then test guesses by squaring |
| Worth knowing | $\sqrt{2} \approx 1.414$, $\sqrt{3} \approx 1.732$, $\sqrt{10} \approx 3.162$ |
| No splitting sums | $\sqrt{a + b} \neq \sqrt{a} + \sqrt{b}$; but $\sqrt{ab} = \sqrt{a}\sqrt{b}$ |
| Pythagoras | $a^2 + b^2 = c^2$ in a right triangle; $c = \sqrt{a^2 + b^2}$ |
| Missing leg | $a = \sqrt{c^2 - b^2}$ |
| Distance on a graph | $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ |
| Space diagonal | $d = \sqrt{l^2 + w^2 + h^2}$ |

Next, the units every one of these lengths, areas and speeds is measured in: the metric system, where changing from kilometres to metres is only a matter of moving the decimal point.

::: context radical-sign Where the √ sign comes from
The Latin word for "root" is *radix* — the same word that gives us "radish". A root was pictured as the thing a square "grows from". The tick-shaped sign first appeared in print in a German book in 1525, and is thought to have grown out of a quickly written small letter *r*. The bar over the top, which shows how far the root reaches, was added later.
:::

::: context irrational Numbers that never end
$\sqrt{2} = 1.41421356\ldots$ keeps going forever, and the digits never fall into a repeating pattern. That means it can never be written exactly as a fraction of two whole numbers. The ancient Greeks proved this, and it shocked them: they had believed every length could be written as a ratio of whole numbers. "Irrational" here means "not a ratio", not "unreasonable". In practice engineers round to as many digits as they need — three or four is usually plenty.
:::

::: context hypotenuse A word that means "stretching under"
"Hypotenuse" comes from a Greek phrase meaning "stretching under". Draw the right angle at the top and the long side stretches underneath it, from one leg's end to the other's. "Legs" is the everyday word for the other two sides; some books call them "catheti". Whatever the names, the hypotenuse is always the side opposite the square corner, and always the longest.
:::

::: context builders-trick The 3–4–5 trick
Want to check that a corner of a deck or a room is truly square? Measure $3$ units along one wall and $4$ along the other, and mark both spots. If the distance between the marks is exactly $5$ units, the corner is a right angle. If it is more than $5$, the corner is too wide; less, too narrow. The theorem works in reverse: if $a^2 + b^2 = c^2$, the angle between $a$ and $b$ must be $90^\circ$. The rule is ancient — a Babylonian clay tablet from about 1800 BC, called Plimpton 322, lists number sets that fit it, more than a thousand years before Pythagoras.
:::

::: context proof-picture Same four triangles, two ways
Both big squares have side $a + b$. Left: the four triangles leave a tilted square of area $c^2$. Right: the same triangles, paired into rectangles, leave $a^2$ and $b^2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="30" width="120" height="120" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1.5">
    <polygon points="20,30 65,30 20,105"/>
    <polygon points="65,30 140,30 140,75"/>
    <polygon points="140,75 140,150 95,150"/>
    <polygon points="95,150 20,150 20,105"/>
  </g>
  <text x="80" y="95" font-size="14" text-anchor="middle" fill="#1f2a44">c²</text>
  <text x="42" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="102" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <rect x="200" y="30" width="120" height="120" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="200" y="30" width="45" height="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="245" y="75" width="75" height="75" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1.5">
    <polygon points="245,30 320,30 245,75"/>
    <polygon points="320,30 320,75 245,75"/>
    <polygon points="200,75 245,75 200,150"/>
    <polygon points="245,75 245,150 200,150"/>
  </g>
  <text x="222" y="57" font-size="13" text-anchor="middle" fill="#1f2a44">a²</text>
  <text x="283" y="117" font-size="14" text-anchor="middle" fill="#1f2a44">b²</text>
  <text x="222" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="282" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="80" y="174" font-size="12" text-anchor="middle" fill="#1f2a44">4 triangles + c²</text>
  <text x="260" y="174" font-size="12" text-anchor="middle" fill="#1f2a44">4 triangles + a² + b²</text>
</svg>
```
:::

::: context slant-range Pointing the antenna
A ground station tracking a rocket or satellite needs the straight-line distance to it, called the slant range. Radio signals travel that straight line, so the slant range sets how long a signal takes to arrive and how strong it is when it gets there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="2"/>
  <line x1="100" y1="170" x2="160" y2="170" stroke="#1f2a44" stroke-width="3"/>
  <line x1="160" y1="170" x2="160" y2="26" stroke="#1f2a44" stroke-width="3"/>
  <line x1="100" y1="170" x2="160" y2="26" stroke="#b4232c" stroke-width="3"/>
  <polyline points="150,170 150,160 160,160" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="100" cy="170" r="6" fill="#1d6fd1"/>
  <polygon points="160,14 154,30 166,30" fill="#1d6fd1"/>
  <text x="130" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">5 km</text>
  <text x="168" y="102" font-size="12" fill="#1f2a44">12 km up</text>
  <text x="112" y="92" font-size="12" text-anchor="end" fill="#b4232c">13 km</text>
  <text x="96" y="160" font-size="11" text-anchor="end" fill="#1d6fd1">radar</text>
</svg>
```

The picture is to scale: the ground leg is $5$ units, the height $12$, and the red beam $13$.
:::

::: context box-diagonal Two right triangles in a box
The floor diagonal is the hypotenuse of a right triangle lying flat on the floor, with sides $l$ and $w$. That diagonal then becomes a leg of a second right triangle standing upright, whose other leg is the height $h$. Its hypotenuse is the space diagonal, from a bottom corner to the opposite top corner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#1f2a44" stroke-width="1.5">
    <rect x="90" y="60" width="150" height="90"/>
    <polyline points="90,60 140,25 290,25 240,60"/>
    <polyline points="290,25 290,115 240,150"/>
  </g>
  <g fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3">
    <line x1="90" y1="150" x2="140" y2="115"/><line x1="140" y1="115" x2="290" y2="115"/><line x1="140" y1="115" x2="140" y2="25"/>
  </g>
  <line x1="90" y1="150" x2="290" y2="115" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="150" x2="290" y2="25" stroke="#b4232c" stroke-width="2.5"/>
  <text x="165" y="168" font-size="12" text-anchor="middle" fill="#1f2a44">l</text>
  <text x="300" y="75" font-size="12" fill="#1f2a44">h</text>
  <text x="274" y="140" font-size="12" fill="#1f2a44">w</text>
  <text x="196" y="140" font-size="11" text-anchor="middle" fill="#1d6fd1">floor diagonal</text>
  <text x="170" y="90" font-size="11" text-anchor="middle" fill="#b4232c">space diagonal</text>
</svg>
```

Written out: $d^2 = (\text{floor diagonal})^2 + h^2 = l^2 + w^2 + h^2$.
:::
