---
id: l01-lamberts-problem-and-theorem
title: Lambert's problem and Lambert's theorem
minutes: 19
covers:
  - Lambert's problem statement and Lambert's theorem
---

Picture throwing a ball to a friend across a yard. You know where you are standing. You know where your friend is standing. You decide the ball should be in the air for exactly two seconds. Now there is one throw that does it: one speed and one direction. Throw it harder and flatter, and it arrives early. Throw it higher and softer, and it arrives late. Picking that throw from "here, there, and how long" is the whole idea of this module.

In the last module you always started from a **state** — a position and a velocity — and asked where the spacecraft would be later. Real mission planning usually runs the other way. You know where the spacecraft is now. You know where it needs to be: a meeting point with a space station, or where Mars will be on an arrival date. You know how long you have. What you do not know is the velocity that joins them. Finding that velocity is **Lambert's problem**.

It is probably the most-used calculation in mission design. A Dragon capsule chasing the International Space Station solves it to plan its burns. Every Earth–Mars launch window is mapped by solving it thousands of times. This lesson states the problem carefully, proves the surprising theorem that makes it solvable, and finds the lowest-energy transfer that bounds every answer. The next lesson builds the solver. This one explains why the solver looks the way it does.

## Stating the problem

Start with the pieces. The **focus** is the center of the body you orbit — the center of Earth for a rendezvous, the center of the Sun for a trip to Mars. You are given:

- two position vectors, $\mathbf{r}_1$ and $\mathbf{r}_2$ (read "r one" and "r two"), each an arrow drawn from the focus to a point in space;
- a **time of flight** $\Delta t$ ("delta t") — how long the trip must take;
- the gravitational parameter $\mu$ ("mu") of the central body, $3.986 \times 10^5\,\mathrm{km^3/s^2}$ for Earth.

Somewhere there is a two-body orbit — an ellipse, a parabola or a hyperbola — that passes through both points, and on which a spacecraft takes exactly $\Delta t$ to get from the first point to the second. Find it. In practice "find the orbit" means "find the velocity $\mathbf{v}_1$ you need at $\mathbf{r}_1$". Once you have $\mathbf{v}_1$, the arrival velocity $\mathbf{v}_2$ comes out of the Lagrange coefficients from the last module with no extra work.

::: key Lambert's problem
Given two position vectors $\mathbf{r}_1$ and $\mathbf{r}_2$, a time of flight $\Delta t$, and the transfer direction and revolution count, find the conic connecting them — equivalently, find $\mathbf{v}_1$ and $\mathbf{v}_2$.
:::

### Why the direction and the lap count are part of the question

The phrase "transfer direction and revolution count" is not decoration. Without it the question has more than one answer.

Think of the hands of a clock. To get the minute hand from 12 to 4, you can turn it forward a third of the way round, or backward two thirds of the way round. Both end at 4. They differ in which way you turned.

A spacecraft is the same. Two points and the focus fix a flat sheet — the **orbital plane**, the plane holding the focus, $\mathbf{r}_1$ and $\mathbf{r}_2$. They do not fix which way around that plane the spacecraft travels. The angle it sweeps from $\mathbf{r}_1$ to $\mathbf{r}_2$, measured at the focus, is the **[[transfer angle|short-long-picture]]** $\Delta\nu$ ("delta nu"). Pick one direction of travel and $\Delta\nu$ is the short angle, less than $180°$ — the **short way**. Pick the other direction and the spacecraft sweeps $360° - \Delta\nu$ around the far side — the **long way**. Once you choose the direction of travel, the transfer angle is settled. Both choices give real orbits through the same two points, with different flight times.

On top of that, a slow enough trip can loop all the way around the focus one or more extra times before it arrives. The number of whole extra loops is the **revolution count** $N$. Each value of $N$ is its own family of answers, as lesson 3 shows. So Lambert's problem is not finished until the direction and $N$ are chosen. A solver that never asks for them is choosing for you without saying so.

For the rest of this lesson, stay with the simplest case: one arc from $\mathbf{r}_1$ to $\mathbf{r}_2$, no extra loops.

## The space triangle

Three points — the focus, the tip of $\mathbf{r}_1$ and the tip of $\mathbf{r}_2$ — make a triangle. Its sides have names you will use constantly.

Write $r_1 = \lVert\mathbf{r}_1\rVert$ and $r_2 = \lVert\mathbf{r}_2\rVert$ for the lengths of the two arrows (the double bars mean "length of"). The third side is the straight line from one point to the other, the **[[chord|chord-triangle]]** $c$:

$$
c = \lVert \mathbf{r}_2 - \mathbf{r}_1 \rVert = \sqrt{r_1^2 + r_2^2 - 2r_1r_2\cos\Delta\nu} .
$$

The second form is the law of cosines from the trigonometry module, with $\Delta\nu$ as the angle between the two known sides.

Half the distance around the triangle is its **[[semiperimeter|semiperimeter-heron]]** $s$:

$$
s = \frac{r_1 + r_2 + c}{2} .
$$

These three numbers — $r_1 + r_2$, $c$ and $s$ — carry the whole story of this lesson.

## Lambert's theorem

Here is a puzzle. Kepler's equation from the last module says a trip's time depends on *where* on the orbit it happens. A $30°$ sweep near periapsis, where the spacecraft moves fast, is quick. The same $30°$ near apoapsis, where it crawls, is slow. So you would expect the flight time between two points to depend on every detail of the triangle.

It does not. In 1761 **[[Johann Heinrich Lambert|lambert-the-man]]** found that almost all of that detail drops out.

::: key Lambert's theorem
The transfer time depends only on the semi-major axis $a$, the chord length $c = \lVert\mathbf{r}_2 - \mathbf{r}_1\rVert$, and the sum $r_1 + r_2$ — not on any other detail of the geometry.
:::

Read it this way. Fix the size of the orbit ($a$), the straight-line gap between the two points ($c$), and the sum of their distances from the focus ($r_1 + r_2$). Then you may split that sum between $r_1$ and $r_2$ however you like, and tilt or turn the triangle however you like. The flight time does not change. Since $s = (r_1 + r_2 + c)/2$, the same statement reads "$\Delta t$ depends only on $a$, $c$ and $s$".

Why should that be? The flight time turns out to depend on the two points only through one combination of them, which we will call $A$:

$$
A = \sin\Delta\nu\,\sqrt{\frac{r_1 r_2}{1-\cos\Delta\nu}} .
$$

$A$ is a length, in kilometers. It is the quantity the next lesson's solver is built around. And $A$, it turns out, can be written using only $s$ and $c$:

$$
A^2 = 2s(s-c) .
$$

Every trace of $r_1$ and $r_2$ *separately* has vanished. That one line is the heart of the theorem.

::: note Why it has to be true: $A^2 = 2s(s-c)$
Start by squaring $A$:

$$
A^2 = \frac{r_1 r_2 \sin^2\Delta\nu}{1-\cos\Delta\nu} .
$$

Use $\sin^2\Delta\nu = 1 - \cos^2\Delta\nu = (1-\cos\Delta\nu)(1+\cos\Delta\nu)$. The factor $(1-\cos\Delta\nu)$ cancels top and bottom, leaving

$$
A^2 = r_1r_2(1+\cos\Delta\nu) = r_1r_2 + r_1r_2\cos\Delta\nu .
$$

Now bring in the law of cosines, $c^2 = r_1^2+r_2^2-2r_1r_2\cos\Delta\nu$. Rearranged, it says $r_1r_2\cos\Delta\nu = (r_1^2+r_2^2-c^2)/2$. Put that in:

$$
A^2 = r_1r_2 + \frac{r_1^2+r_2^2-c^2}{2} = \frac{r_1^2 + 2r_1r_2 + r_2^2 - c^2}{2} = \frac{(r_1+r_2)^2-c^2}{2} .
$$

The top is a difference of two squares, so it factors:

$$
A^2 = \frac{(r_1+r_2-c)(r_1+r_2+c)}{2} .
$$

Finally, $r_1+r_2+c = 2s$ and $r_1+r_2-c = 2s - 2c = 2(s-c)$. So $A^2 = \dfrac{2(s-c)\cdot 2s}{2} = 2s(s-c)$.

One detail: squaring threw away the sign. $A$ has the sign of $\sin\Delta\nu$ — positive for the short way, negative for the long way. So $A = \pm\sqrt{2s(s-c)}$, with the sign set by the direction you chose.
:::

::: note Why that proves the theorem
The next lesson derives the time-of-flight equation. It uses a single number $z$ to label every possible orbit through the two points, and it writes both the flight time and the semi-major axis as formulas in only three ingredients: $z$, the sum $r_1+r_2$, and $A$. Since $A$ depends only on $s$ and $c$ (plus the direction's sign), both formulas depend only on $z$, $s$ and $c$. So if two triangles share $s$ and $c$, the same $z$ gives them the same $a$ *and* the same $\Delta t$. That is Lambert's theorem.
:::

::: example Two different triangles, one flight time
Fix the chord at $c = 8000\,\mathrm{km}$ and the radius sum at $r_1+r_2 = 22\,000\,\mathrm{km}$.

**Step 1 — the semiperimeter.** $s = (22\,000+8000)/2 = 15\,000\,\mathrm{km}$.

**Step 2 — two triangles that share it.** Split the sum two ways: $r_1=9000$, $r_2=13\,000\,\mathrm{km}$, or $r_1=r_2=11\,000\,\mathrm{km}$.

**Step 3 — their transfer angles differ.** The law of cosines, turned around, gives $\cos\Delta\nu = (r_1^2+r_2^2-c^2)/(2r_1r_2)$. For the first split, $\cos\Delta\nu = (81 + 169 - 64)\times 10^6 / (234 \times 10^6) = 0.7949$, so $\Delta\nu = 37.36°$. For the second, $\cos\Delta\nu = (121+121-64)/242 = 0.7355$, so $\Delta\nu = 42.65°$. Different triangles.

**Step 4 — but the same $A$.** From $s$ and $c$ alone,
$$
A^2 = 2s(s-c) = 2(15\,000)(7000) = 2.1 \times 10^8\,\mathrm{km^2}, \qquad A = 14\,491.4\,\mathrm{km} .
$$
Working $A$ out the long way, from each triangle's own $r_1$, $r_2$ and $\Delta\nu$, gives $14\,491.4\,\mathrm{km}$ both times, agreeing to eleven significant figures.

**Step 5 — the same flight time.** Ask for orbits with $a = 12\,000\,\mathrm{km}$. Each triangle has two ellipses of that size through its two points (the minimum-energy section below explains why two). The faster one takes $1297.7\,\mathrm{s}$ for *both* triangles; the slower one takes $10\,818.6\,\mathrm{s}$ for both.

**Sanity check.** The two sets of orbits are genuinely different — different shapes, different tilts, different $\mathbf{v}_1$. Only the flight times agree, which is exactly what the theorem promised. Both times are shorter than one full period at $a = 12\,000\,\mathrm{km}$, which is $13\,082\,\mathrm{s}$, as a single arc must be.
:::

## The minimum-energy transfer

Lambert's theorem makes the flight time a function of $a$. So which values of $a$ are allowed? You cannot connect two far-apart points with a tiny ellipse. There must be a smallest one.

The picture that finds it is the "gardener's ellipse". Push two pins into a board, loop a string around them, pull the string tight with a pencil, and trace. You get an ellipse, and the pins are its two **foci**. For every point on it, the distances to the two pins add up to the same number, the length $2a$.

For an orbit, one pin is the focus, the center of Earth. The other pin, $F'$ ("F prime"), is the **[[empty focus|empty-focus]]** — a point with nothing at it. Call the distances from the two transfer points to the empty focus $r_1'$ and $r_2'$. The string rule says

$$
r_1 + r_1' = 2a, \qquad r_2 + r_2' = 2a .
$$

Add the two:

$$
r_1' + r_2' = 4a - (r_1+r_2) .
$$

Now look at the triangle made by $F'$ and the two transfer points. Going from $\mathbf{r}_1$ to $F'$ and on to $\mathbf{r}_2$ is a detour. It can never be shorter than going straight along the chord — this is the **triangle inequality**. So $r_1'+r_2' \ge c$, with equality only when $F'$ sits right on the chord. Substitute:

$$
4a - (r_1+r_2) \ge c \quad\Longrightarrow\quad 4a \ge r_1+r_2+c = 2s \quad\Longrightarrow\quad a \ge \frac{s}{2} .
$$

A smaller orbit also means a lower **[[specific energy|specific-energy]]** — energy per kilogram — which for any orbit is $\varepsilon = -\mu/2a$. So the smallest ellipse is also the cheapest one to be on.

::: key Minimum-energy transfer
$$
a_{\min} = \frac{s}{2}, \qquad s = \frac{r_1+r_2+c}{2} .
$$
It is the smallest semi-major axis for which any ellipse connects $\mathbf{r}_1$ and $\mathbf{r}_2$ at all, and so the lowest energy, since the specific energy is $\varepsilon = -\mu/2a$. It happens exactly when the empty focus lies on the chord.
:::

So below $a_{\min}$ no ellipse fits through the two points. At $a_{\min}$ exactly one does, because the empty focus has only [[one allowed spot|min-energy-picture]], on the chord. Above $a_{\min}$ the empty focus has room to sit on either side of the chord, so there are two ellipses of each size — that is why Step 5 above found two orbits for $a = 12\,000\,\mathrm{km}$. One of the pair flies faster than the minimum-energy transfer, the other slower. The flight time of the minimum-energy transfer is the dividing line between them.

::: example $a_{\min}$ for a real pair of points
Take $\mathbf{r}_1 = (5000,\ 10\,000,\ 2100)\,\mathrm{km}$ and $\mathbf{r}_2 = (-14\,600,\ 2500,\ 7000)\,\mathrm{km}$. This pair comes from Curtis's textbook, and the next lesson uses it to test its solver.

**Step 1 — the two lengths.** $r_1 = \sqrt{5000^2 + 10\,000^2 + 2100^2} = 11\,375.852\,\mathrm{km}$ and $r_2 = \sqrt{14\,600^2 + 2500^2 + 7000^2} = 16\,383.223\,\mathrm{km}$.

**Step 2 — the chord.** Subtract component by component, $\mathbf{r}_2 - \mathbf{r}_1 = (-19\,600,\ -7500,\ 4900)\,\mathrm{km}$, then take the length:
$$
c = \sqrt{19\,600^2+7500^2+4900^2} = 21\,550.406\,\mathrm{km} .
$$

**Step 3 — semiperimeter and $a_{\min}$.**
$$
s = \frac{11\,375.852+16\,383.223+21\,550.406}{2} = 24\,654.740\,\mathrm{km}, \qquad a_{\min} = \frac{s}{2} = 12\,327.370\,\mathrm{km} .
$$

**Step 4 — check the empty focus sits on the chord.** At $a=a_{\min}$, the string rule gives $r_1' = 2a_{\min}-r_1 = 24\,654.740-11\,375.852 = 13\,278.889\,\mathrm{km}$ and $r_2' = 24\,654.740-16\,383.223 = 8271.517\,\mathrm{km}$. Their sum is $21\,550.406\,\mathrm{km}$ — exactly $c$. The detour through $F'$ is no longer than the chord, so $F'$ is on it, as the derivation said.

**Sanity check.** No straight line inside an ellipse is longer than its long axis, $2a$. The chord runs between two points on the ellipse, so $2a \ge c$, or $a \ge 10\,775\,\mathrm{km}$. Our $a_{\min} = 12\,327\,\mathrm{km}$ passes.
:::

In the next lesson this pair is flown in one hour. That one-hour trip needs $a \approx 20\,000\,\mathrm{km}$, far above $a_{\min}$. A fast trip is a high-energy, expensive one. Trading flight time against propellant is the central bargain of mission design, and here it is in two numbers.

::: warning $a_{\min}$ limits the ellipse's size, not the trip's speed
The string argument used the ellipse's rule $r + r' = 2a$, which only holds when $a > 0$. A fast enough transfer is a hyperbola ($a < 0$), and no floor of this kind applies to it. You can make a hyperbolic transfer as fast as you like by making it more and more energetic, at a propellant cost that grows without limit.

Also, $a_{\min}$ is *not* the fastest or the slowest trip. It is the lowest-energy one. For the Curtis pair, going the short way, the minimum-energy transfer takes about $6680\,\mathrm{s}$. Ellipses faster than that and ellipses slower than that both exist; every one of them has a larger $a$.
:::

## Why the theorem matters for the solver

Lambert's theorem is not a curiosity. It is the reason a solver can exist as a search along *one* number instead of a hunt through every possible orbit shape.

Once $\mathbf{r}_1$, $\mathbf{r}_2$ and the direction are chosen, $c$ and $s$ are fixed. The flight time then depends on one thing: the size of the orbit. So solving Lambert's problem means finding the one value of $a$ — or, as the next lesson prefers, one better-behaved number built from it — that gives the flight time you asked for.

Every solution method in this module's reading list does exactly this. Gauss in 1809, the universal-variable method of Battin and of Bate, Mueller and White, and **[[Izzo|izzo-bridge]]** in 2015 all search the same one-dimensional curve. They differ in which variable they search along and how they steer toward the answer. They do not differ in what they are looking for — a single number, because Lambert showed that everything except $a$, $c$ and $s$ can be thrown away.

## Check yourself

::: check
A spacecraft could go from $\mathbf{r}_1$ to $\mathbf{r}_2$ sweeping $80°$, or sweeping $280°$. Are these the short-way and long-way transfers between the same two points? What is the same about them, and what is different?
:::

::: answer
Yes. The two angles add up to a full turn, $80° + 280° = 360°$. The $80°$ transfer travels one way around the plane, straight to $\mathbf{r}_2$. The $280°$ transfer travels the opposite way, around the far side.

Both start and end at the same two physical points, so $r_1$, $r_2$ and the chord $c$ are identical. What differs is $\Delta\nu$, and with it the sign of $A$ (positive for $80°$, negative for $280°$), the shape of the orbit, and the flight time for a given $a$.
:::

::: check
Why must the direction of travel be given as part of Lambert's problem? Why can't the two position vectors decide it on their own?
:::

::: answer
Two position vectors and the focus fix a plane, but not which way around that plane the spacecraft moves. Traveling one way sweeps $\Delta\nu$; traveling the other way sweeps $360° - \Delta\nu$. These are different transfers with different orbits and different flight times, and both pass through the same two points. So the vectors alone are consistent with more than one answer, and the direction has to be supplied.
:::

::: check
Using the empty-focus argument, explain in words why $a_{\min}$ happens exactly when the empty focus lies on the chord.
:::

::: answer
The string rule gives $r_1'+r_2' = 4a-(r_1+r_2)$. With $r_1$ and $r_2$ fixed, a smaller $a$ means a smaller $r_1'+r_2'$, so the smallest $a$ goes with the smallest possible $r_1'+r_2'$.

That sum is the length of the path from $\mathbf{r}_1$ to $F'$ to $\mathbf{r}_2$. By the triangle inequality it is never shorter than the straight chord $c$, and it equals $c$ only when the three points line up — when $F'$ sits on the chord. That equality case is the smallest possible sum, so it is $a_{\min}$.
:::

::: check
For the pair $\mathbf{r}_1=(5000,10\,000,2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,2500,7000)\,\mathrm{km}$, with $a_{\min}=12\,327.370\,\mathrm{km}$, what is the lowest possible specific energy of an elliptical transfer between them? Use $\mu=398\,600.4418\,\mathrm{km^3/s^2}$.
:::

::: answer
Specific energy is $\varepsilon = -\mu/(2a)$. It is most negative — the orbit is most tightly bound — when $a$ is smallest, at $a_{\min}$:
$$
\varepsilon_{\min} = -\frac{398\,600.4418}{2\times 12\,327.370} = -\frac{398\,600.4418}{24\,654.740} = -16.167\,\mathrm{km^2/s^2} .
$$
Every other elliptical transfer between these points has a larger $a$, so its energy is less negative — higher — than this.
:::

::: check
A transfer has $s=20\,000\,\mathrm{km}$ and $c=15\,000\,\mathrm{km}$. Find the size of $A$ from $A^2=2s(s-c)$. Then explain what it would mean if a calculation ever gave $c > s$.
:::

::: answer
$A^2 = 2 \times 20\,000 \times (20\,000-15\,000) = 2 \times 20\,000 \times 5000 = 2\times10^8\,\mathrm{km^2}$, so $\lvert A\rvert = 14\,142.1\,\mathrm{km}$.

If $c > s$, then $s - c$ is negative and $A^2$ would come out negative, which no real number can square to. It cannot happen for a real triangle. Since $2s = r_1 + r_2 + c$, the statement $c > s$ is the same as $c > r_1 + r_2$ — the chord longer than the other two sides put together. The triangle inequality forbids that. So a negative $A^2$ is a built-in alarm: something went wrong when computing $c$, $r_1$ or $r_2$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_1, \mathbf{r}_2, \Delta t$, direction, $N$ | What Lambert's problem needs; the direction and $N$ are not optional |
| $\Delta\nu$ | Transfer angle at the focus; short way below $180°$, long way $360°-\Delta\nu$ |
| $c = \lVert\mathbf{r}_2-\mathbf{r}_1\rVert$ | Chord: the straight line between the two points |
| $s = (r_1+r_2+c)/2$ | Semiperimeter of the space triangle |
| Lambert's theorem | $\Delta t$ depends only on $a$, $c$, $r_1+r_2$ (equivalently $a$, $c$, $s$) |
| $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ | Carries the geometry into the time equation; $A^2=2s(s-c)$, sign of $\sin\Delta\nu$ |
| $a_{\min} = s/2$ | Smallest ellipse through both points; empty focus on the chord |
| $\varepsilon = -\mu/2a$ | Specific energy; most negative at $a_{\min}$ |

The next lesson takes $A$ and builds the universal-variable time-of-flight equation from it. Solving that equation turns this lesson's geometry into the actual velocities $\mathbf{v}_1$ and $\mathbf{v}_2$ — and then proves them right by flying the answer forward to see that it lands on $\mathbf{r}_2$.

::: context short-long-picture Which way around
From the focus, the two points split the circle of directions into two arcs. Going one way sweeps the short angle; going the other way sweeps the rest of the full turn. Here the short way is $100°$ and the long way is $260°$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <path d="M 260.8 126.2 A 82 82 0 0 0 180.0 30.0" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M 260.8 126.2 A 82 82 0 1 1 180.0 30.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="215.8,38.0 227.0,38.7 222.0,47.3" fill="#1d6fd1"/>
  <polygon points="133.8,180.0 145.0,180.7 140.0,189.3" fill="#b4232c"/>
  <line x1="180" y1="112" x2="260.8" y2="126.2" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="112" x2="180" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="112" r="5" fill="#1f2a44"/>
  <circle cx="260.8" cy="126.2" r="4.5" fill="#1f2a44"/>
  <circle cx="180" cy="30" r="4.5" fill="#1f2a44"/>
  <text x="166" y="128" font-size="12" fill="#1f2a44" text-anchor="end">focus</text>
  <text x="272" y="140" font-size="13" fill="#1f2a44">r₁</text>
  <text x="188" y="22" font-size="13" fill="#1f2a44">r₂</text>
  <text x="250" y="44" font-size="12" fill="#1d6fd1">short way, 100°</text>
  <text x="56" y="204" font-size="12" fill="#b4232c" text-anchor="middle">long way, 260°</text>
</svg>
```
:::

::: context chord-triangle The space triangle
A **chord** is the straight line joining two points on a curve; the word comes from the Greek for a string, like a bowstring across a bow. Together with the two radius arrows it makes the triangle every Lambert calculation starts from. Drawn to scale for the Curtis pair used in this lesson: $r_1 = 11\,376\,\mathrm{km}$, $r_2 = 16\,383\,\mathrm{km}$, $\Delta\nu = 100.3°$, $c = 21\,550\,\mathrm{km}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="140" y1="172" x2="247" y2="157" stroke="#1f2a44" stroke-width="2"/>
  <line x1="140" y1="172" x2="91.1" y2="24.2" stroke="#1f2a44" stroke-width="2"/>
  <line x1="247" y1="157" x2="91.1" y2="24.2" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M 164.8 168.5 A 25 25 0 0 0 132.1 148.3" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="140" cy="172" r="5" fill="#1f2a44"/>
  <circle cx="247" cy="157" r="4.5" fill="#1f2a44"/>
  <circle cx="91.1" cy="24.2" r="4.5" fill="#1f2a44"/>
  <text x="130" y="190" font-size="12" fill="#1f2a44" text-anchor="end">focus</text>
  <text x="194" y="182" font-size="13" fill="#1f2a44">r₁</text>
  <text x="100" y="104" font-size="13" fill="#1f2a44" text-anchor="end">r₂</text>
  <text x="182" y="84" font-size="13" fill="#1d6fd1">chord c</text>
  <text x="158" y="150" font-size="12" fill="#b4232c">Δν</text>
</svg>
```
:::

::: context semiperimeter-heron An old friend of triangles
The semiperimeter — half the distance around a triangle — is not new to Lambert. About two thousand years ago Heron of Alexandria gave a formula for a triangle's area using it: area $= \sqrt{s(s-a)(s-b)(s-c)}$ for sides $a$, $b$, $c$. Whenever a formula about a triangle comes out symmetric and tidy, $s$ is often hiding inside it. In Lambert's problem $s$ and $s - c$ are the two lengths that survive all the canceling.
:::

::: context lambert-the-man Who Lambert was
Johann Heinrich Lambert (1728–1777) was a largely self-taught mathematician and scientist from Mulhouse, then allied with Switzerland. He published the theorem in 1761 in a book on the orbits of comets, where it helped estimate a comet's path from a few sightings. The same year he proved that $\pi$ is irrational — it cannot be written as a fraction. His theorem sat mostly unused until Gauss and later astronomers turned it into working methods; today it runs inside mission-planning software every day.
:::

::: context empty-focus Where the second pin sits
An ellipse has two foci. For an orbit, the planet fills one of them. The other is an empty point in space — nothing is there, and nothing pulls from it. It still matters, because the string rule "distance to one focus plus distance to the other equals $2a$" holds for every point on the ellipse. Moving the empty focus around is a way of listing every ellipse through two given points with the planet at the first focus.
:::

::: context specific-energy Energy per kilogram
**Specific** here means "per kilogram of spacecraft". The specific energy $\varepsilon$ is kinetic plus potential energy for each kilogram, in $\mathrm{km^2/s^2}$ (the same as $\mathrm{MJ/kg}$). For any orbit it equals $-\mu/2a$, so it depends only on the orbit's size. A negative value means the spacecraft is bound — it keeps coming back. Zero is the parabola, the escape boundary. Bigger orbits are less negative, so they cost more energy to reach, which is why $a_{\min}$ is also the minimum-energy transfer.
:::

::: context min-energy-picture The minimum-energy ellipse, to scale
For the Curtis pair, the smallest ellipse through both points has $a_{\min} = 12\,327\,\mathrm{km}$ and eccentricity $0.416$. Its empty focus $F'$ lands exactly on the chord. Any bigger ellipse through the two points would have its $F'$ off the chord, to one side or the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="200" cy="104" rx="88.8" ry="80.7" fill="none" stroke="#8fb8f0" stroke-width="2.5"/>
  <line x1="163.1" y1="104" x2="183.5" y2="183.3" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="163.1" y1="104" x2="270.2" y2="54.6" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="183.5" y1="183.3" x2="270.2" y2="54.6" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="163.1" cy="104" r="6" fill="#1f2a44"/>
  <circle cx="236.9" cy="104" r="5" fill="#ffffff" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="183.5" cy="183.3" r="4.5" fill="#1f2a44"/>
  <circle cx="270.2" cy="54.6" r="4.5" fill="#1f2a44"/>
  <text x="156" y="96" font-size="12" fill="#1f2a44" text-anchor="end">F</text>
  <text x="246" y="112" font-size="12" fill="#b4232c">F′</text>
  <text x="194" y="196" font-size="12" fill="#1f2a44">r₁</text>
  <text x="280" y="50" font-size="12" fill="#1f2a44">r₂</text>
  <text x="12" y="30" font-size="12" fill="#1f2a44">F = Earth</text>
  <text x="12" y="48" font-size="12" fill="#b4232c">F′ = empty focus</text>
  <text x="12" y="66" font-size="12" fill="#1d6fd1">chord</text>
  <text x="12" y="84" font-size="12" fill="#1f2a44">a = s/2</text>
</svg>
```
:::

::: context izzo-bridge Where the solvers come from
Gauss built his method while recovering the lost dwarf planet Ceres in 1801 and published it in 1809. Battin, and Bate, Mueller and White, wrote the universal-variable version used in the next lesson. Dario Izzo, at the European Space Agency, published a fast and robust modern form in 2015; it is the one many current software libraries use. The next lesson compares all three.
:::
