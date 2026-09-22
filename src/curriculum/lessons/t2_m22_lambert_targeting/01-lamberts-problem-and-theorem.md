---
id: l01-lamberts-problem-and-theorem
title: Lambert's problem and Lambert's theorem
minutes: 20
covers:
  - Lambert's problem statement and Lambert's theorem
---

Everything in the last module started from a state: a position and a velocity, propagated forward. Real mission design usually starts from the other end. You know where the spacecraft is now, you know where you need it to be — a rendezvous point, a planet's position on an arrival date, a target orbit — and you know how long you have to get there. What you do not know is the velocity that connects them. Finding it is Lambert's problem, and it is the single most-used calculation in mission design: every transfer orbit, every interplanetary launch window, every rendezvous burn traces back to solving it, usually thousands of times in a loop.

This lesson states the problem precisely, proves the remarkable theorem that makes it tractable — that the time of flight depends on the geometry through only three numbers, not through the full three-dimensional picture — and derives the minimum-energy transfer that bounds every solution. The next lesson builds the solver; this one builds the reasons the solver has the shape it does.

## Stating the problem

You are given two position vectors $\mathbf{r}_1$ and $\mathbf{r}_2$ measured from the focus (the attracting body), a time of flight $\Delta t$ between them, and the gravitational parameter $\mu$. Somewhere between $\mathbf{r}_1$ and $\mathbf{r}_2$ there is a two-body orbit — an ellipse, a parabola, or a hyperbola — that passes through both points such that a spacecraft on it takes exactly $\Delta t$ to go from the first to the second. Find that orbit; equivalently, find the velocity $\mathbf{v}_1$ at $\mathbf{r}_1$ (from which $\mathbf{v}_2$ follows for free, by the Lagrange coefficients of the previous module).

::: key Lambert's problem
Given two position vectors $\mathbf{r}_1$ and $\mathbf{r}_2$, a time of flight $\Delta t$, and the transfer direction and revolution count, find the conic connecting them — equivalently, find $\mathbf{v}_1$ and $\mathbf{v}_2$.
:::

That phrase "transfer direction and revolution count" is doing real work, and it is worth being explicit about why it has to be there before any algebra starts. Two points and a focus fix a *plane* — the plane containing $\mathbf{r}_1$, $\mathbf{r}_2$, and the origin — but they do not fix which way around that plane the spacecraft travels. Go from $\mathbf{r}_1$ to $\mathbf{r}_2$ the short way, sweeping a transfer angle $\Delta\nu$ less than $180°$, and you get one family of orbits. Go the long way, sweeping more than $180°$ around the far side, and you get a different family, with a different implied direction of orbital motion. Both are legitimate two-body orbits through the same two points; only the combination of $\Delta t$ and a choice of direction picks out one of them. On top of that, a transfer that takes long enough can wind around the focus one or more complete times before arriving — the *revolution count* $N$ — and each value of $N$ is, as the next lesson shows, its own family again. Lambert's problem is genuinely under-specified until direction and $N$ are pinned down; a solver that does not ask for them is silently choosing on your behalf.

For the rest of this lesson, restrict attention to the direct, zero-revolution case: a single arc from $\mathbf{r}_1$ to $\mathbf{r}_2$, transfer angle $\Delta\nu$ between $0°$ and $360°$, no extra winding. Write $r_1 = \lVert\mathbf{r}_1\rVert$, $r_2 = \lVert\mathbf{r}_2\rVert$, and the chord

$$
c = \lVert \mathbf{r}_2 - \mathbf{r}_1 \rVert = \sqrt{r_1^2 + r_2^2 - 2r_1r_2\cos\Delta\nu} .
$$

## Lambert's theorem

Here is the fact that makes the problem solvable in the first place, stated by Johann Heinrich Lambert in 1761, decades before anyone had a systematic method to exploit it. Define the semiperimeter of the triangle formed by $\mathbf{r}_1$, $\mathbf{r}_2$, and the chord:

$$
s = \frac{r_1 + r_2 + c}{2} .
$$

::: key Lambert's theorem
The transfer time depends only on the semi-major axis $a$, the chord length $c = \lVert\mathbf{r}_2 - \mathbf{r}_1\rVert$, and the sum $r_1 + r_2$ — not on any other detail of the geometry.
:::

This is not obvious. The time of flight along a conic arc, as you know from Kepler's equation, depends in general on where on the orbit the arc starts and ends — near periapsis a given angular sweep takes less time than the same sweep near apoapsis. Lambert's claim is that once you fix $a$, $c$, and $r_1+r_2$ (equivalently $a$, $c$, and $s$), the individual values of $r_1$ and $r_2$ no longer matter separately: any transfer with that $a$, that $c$, and that $r_1+r_2$ takes the same time, no matter how the chord is split between the two endpoints or how the whole triangle is oriented in space.

The clean way to see why is algebraic, and it uses exactly the Lagrange coefficients from the previous module, which is why this module opens with the theorem rather than the solver: the solver *is* the constructive proof, and this section derives the one piece of it that carries the content of the theorem.

Write the $\Delta\nu$-form of the Lagrange $g$ coefficient (previous module): $g = r_1 r_2 \sin\Delta\nu / h$, with $h = \sqrt{\mu p}$ the angular momentum for a transfer of semi-latus rectum $p$. A short manipulation — multiply and divide by $\sqrt{1-\cos\Delta\nu}$ and use $\sin^2\Delta\nu = (1-\cos\Delta\nu)(1+\cos\Delta\nu)$ — lets you write $g$ in terms of a single new quantity

$$
A \equiv \sin\Delta\nu\,\sqrt{\frac{r_1 r_2}{1-\cos\Delta\nu}} .
$$

Now use the law of cosines, $c^2 = r_1^2+r_2^2-2r_1r_2\cos\Delta\nu$, to write $2r_1r_2\cos\Delta\nu = r_1^2+r_2^2-c^2$. Then

$$
A^2 = r_1r_2(1+\cos\Delta\nu) = r_1r_2 + \frac{r_1^2+r_2^2-c^2}{2} = \frac{(r_1+r_2)^2-c^2}{2} = \frac{(r_1+r_2-c)(r_1+r_2+c)}{2} .
$$

Since $r_1+r_2-c = 2(s-c)$ and $r_1+r_2+c=2s$,

$$
A^2 = 2s(s-c) .
$$

Every trace of $r_1$ and $r_2$ *individually* has cancelled. $A$ — the quantity that carries the entire geometry into the time-of-flight equation, as the next lesson shows in full — depends on the two points only through $s$ and $c$, which is to say only through $r_1+r_2$ and $c$. Since the time of flight is built from $A$, $r_1+r_2$, and the semi-major axis $a$ (through the universal variable, as the next lesson derives), and $A$ itself reduces to a function of $s$ and $c$ alone, the whole time-of-flight relation collapses to a function of $a$, $c$, and $s$ only. That is Lambert's theorem, and equation $A^2 = 2s(s-c)$ is the load-bearing step: memorise the shape of that derivation, because the solver in the next lesson uses $A$ directly.

::: example Verifying Lambert's theorem is not an accident of one triangle
Fix the chord at $c = 8000\,\mathrm{km}$ and the radius sum at $r_1+r_2 = 22\,000\,\mathrm{km}$, so $s = (22\,000+8000)/2 = 15\,000\,\mathrm{km}$. Two different triangles share these numbers: split the sum as $r_1=9000\,\mathrm{km}$, $r_2=13\,000\,\mathrm{km}$, or as $r_1=r_2=11\,000\,\mathrm{km}$. The law of cosines gives a different transfer angle for each — $\cos\Delta\nu = (r_1^2+r_2^2-c^2)/(2r_1r_2)$ gives $\Delta\nu=37.36°$ for the first split and $\Delta\nu=42.65°$ for the second — yet
$$
A^2 = 2s(s-c) = 2(15\,000)(15\,000-8000) = 2.1 \times 10^8\,\mathrm{km^2} \quad\Longrightarrow\quad A = 14\,491.4\,\mathrm{km}
$$
comes out identical for both, to eleven significant figures, when computed the long way from each triangle's own $r_1$, $r_2$, $\Delta\nu$. Solving for the semi-major axis that gives $A=14\,491.4\,\mathrm{km}$ (next lesson's method) and reading off the implied time of flight for each triangle at, say, $a=12\,000\,\mathrm{km}$ gives the same $\Delta t$ for both splits, even though the two triangles do not coincide, are not related by a rotation, and the spacecraft passes through different individual radii in each. The orbits are genuinely different — different eccentricity, different orientation, different $\mathbf{v}_1$ — but their flight times for a shared $a$, $c$, $s$ are exactly the same number.
:::

## The minimum-energy transfer

Lambert's theorem says the time of flight is a function of $a$, and every value of $a$ above some floor gives a valid transfer. That floor has a clean geometric origin. Consider any ellipse through $\mathbf{r}_1$ and $\mathbf{r}_2$ with one focus at the origin (the attracting body) and call the other, empty focus $F'$. By the defining property of an ellipse, the sum of the distances from any point on it to the two foci is $2a$:

$$
r_1 + r_1' = 2a, \qquad r_2 + r_2' = 2a ,
$$

where $r_1' = \lVert\mathbf{r}_1 - F'\rVert$ and $r_2'=\lVert\mathbf{r}_2-F'\rVert$ are the distances from the two transfer points to the vacant focus. Adding these,

$$
r_1' + r_2' = 4a - (r_1+r_2) .
$$

Now apply the triangle inequality to the triangle formed by $F'$, $\mathbf{r}_1$, and $\mathbf{r}_2$: the sum of two sides is at least the third, so $r_1'+r_2' \ge c$, with equality exactly when $F'$ lies on the chord between $\mathbf{r}_1$ and $\mathbf{r}_2$. Substituting,

$$
4a - (r_1+r_2) \ge c \quad\Longrightarrow\quad 4a \ge r_1+r_2+c = 2s \quad\Longrightarrow\quad a \ge \frac{s}{2} .
$$

::: key Minimum-energy transfer
$$
a_{\min} = \frac{s}{2}, \qquad s = \frac{r_1+r_2+c}{2} .
$$
It is the smallest semi-major axis — hence the lowest energy, since specific energy is $-\mu/2a$ — for which any ellipse connects $\mathbf{r}_1$ and $\mathbf{r}_2$ at all, and it is achieved exactly when the vacant focus lies on the chord.
:::

Below $a_{\min}$ no ellipse through the two points exists; at $a_{\min}$ there is exactly one (the minimum-energy transfer); above it there are, as a later lesson on branches shows directly, generally two.

::: example $a_{\min}$ for a concrete transfer
Take $\mathbf{r}_1 = (5000, 10\,000, 2100)\,\mathrm{km}$ and $\mathbf{r}_2 = (-14\,600, 2500, 7000)\,\mathrm{km}$ — the pair this module uses to validate its solver in the next lesson. Then $r_1 = 11\,375.852\,\mathrm{km}$, $r_2 = 16\,383.223\,\mathrm{km}$, and
$$
c = \lVert\mathbf{r}_2-\mathbf{r}_1\rVert = \sqrt{(-19\,600)^2+(-7500)^2+4900^2} = 21\,550.406\,\mathrm{km} ,
$$
so $s = (11\,375.852+16\,383.223+21\,550.406)/2 = 24\,654.740\,\mathrm{km}$ and
$$
a_{\min} = \frac{24\,654.740}{2} = 12\,327.370\,\mathrm{km} .
$$
Check the vacant-focus condition directly: at $a=a_{\min}$, $r_1' = 2a_{\min}-r_1 = 24\,654.740-11\,375.852=13\,278.889\,\mathrm{km}$ and $r_2'=24\,654.740-16\,383.223=8271.517\,\mathrm{km}$. Their sum is $21\,550.406\,\mathrm{km}$ — equal to $c$ to the last digit printed, confirming $F'$ sits exactly on the chord at the minimum-energy point, exactly as the derivation predicts.
:::

The two points in this example are also the pair the next lesson solves for a one-hour transfer; you will see there that the semi-major axis the one-hour flight actually needs is nowhere near $a_{\min}$ — a fast transfer is an expensive, high-energy one, well above the minimum, which is the whole content of the trade a mission designer makes between flight time and propellant.

::: warning $a_{\min}$ bounds the ellipse, not the hyperbola
The vacant-focus argument used the ellipse's defining property, $r+r' = 2a$, which only holds for $a>0$. A fast enough transfer is hyperbolic ($a<0$), and no lower bound of this form applies to it — a hyperbolic transfer can be made arbitrarily fast (at arbitrarily large propellant cost) by driving $a$ toward $-\infty$, i.e. toward a straight-line, infinite-speed limit. $a_{\min}=s/2$ is specifically the floor on how *slow* an elliptical transfer between two given points can be made to go, not a floor on speed.
:::

## Why the theorem matters for the solver

Lambert's theorem is not a curiosity; it is the reason a solver can exist as a one-dimensional root-find rather than a search over some higher-dimensional space of orbit shapes. Because the time of flight is a function of $a$ alone (with $c$ and $s$ fixed once $\mathbf{r}_1$, $\mathbf{r}_2$, and the direction are chosen), solving Lambert's problem reduces to finding the one value of $a$ — or, as the next lesson will parametrise it, the one value of a numerically better-behaved variable built from $a$ — that reproduces the required $\Delta t$. Every solution method mentioned in the resources for this module, from Gauss's 1809 construction through Battin's and the universal-variable formulation to Izzo's 2015 reformulation, is a different way of searching that one-dimensional curve. They differ in what variable they search over and how they get the derivative of the search function, not in the underlying content of what they are searching: a single number, because Lambert proved eighteenth-century geometry could throw away everything except $a$, $c$, and $s$.

## Check yourself

::: check
Two transfers share the same $\mathbf{r}_1+\mathbf{r}_2$ direction sum in magnitude and the same chord $c$, but one has $\Delta\nu = 80°$ and the other $\Delta\nu = 280°$ for the identical pair of points $\mathbf{r}_1$, $\mathbf{r}_2$. Are these the "short way" and "long way" transfers between the same two points? Explain using the definition of $\Delta\nu$.
:::

::: answer
Yes. For a fixed direction of orbital motion (fixed sense of rotation), the transfer angle swept going from $\mathbf{r}_1$ to $\mathbf{r}_2$ can only take one of two values that are supplementary around the full circle: the "short way" (here $80°$, less than $180°$) or the "long way" (here $280°=360°-80°$, more than $180°$), depending on whether you go directly to $\mathbf{r}_2$ or continue past it around the far side of the plane. Both sweep between the same two physical points, so they share $r_1$, $r_2$, and $c$ exactly; what differs is $\Delta\nu$ itself, and therefore, in general, the transfer orbit's shape and the resulting $A$ and flight time.
:::

::: check
Why is it necessary to specify a transfer direction (short way vs. long way, or more generally the sense of motion) as part of Lambert's problem, rather than letting the two position vectors alone determine it?
:::

::: answer
Two position vectors and a focus fix a plane but not a direction of travel within that plane. Going from $\mathbf{r}_1$ to $\mathbf{r}_2$ clockwise or counter-clockwise within the same plane sweeps different transfer angles ($\Delta\nu$ and $360°-\Delta\nu$) and, generally, corresponds to different conics with different times of flight. Without specifying which sense of motion is intended, "the" transfer is genuinely ambiguous — the vectors alone are consistent with more than one valid two-body orbit connecting them.
:::

::: check
Using the vacant-focus argument, explain in words why $a_{\min}$ occurs exactly when the vacant focus lies on the chord, rather than at some other point.
:::

::: answer
The bound $a \ge s/2$ came from the triangle inequality $r_1'+r_2' \ge c$ applied to the vacant focus $F'$ and the two transfer points. The triangle inequality is an equality precisely when the three points are collinear — that is, when $F'$ lies on the straight segment between $\mathbf{r}_1$ and $\mathbf{r}_2$ (the chord) rather than off to one side of it. Since $a$ increases monotonically with $r_1'+r_2'$ for fixed $r_1$, $r_2$ (from $r_1'+r_2'=4a-(r_1+r_2)$), the smallest possible $a$ corresponds to the smallest possible $r_1'+r_2'$, which is the equality case.
:::

::: check
For the pair $\mathbf{r}_1=(5000,10\,000,2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,2500,7000)\,\mathrm{km}$, roughly what is the lowest possible specific energy (most negative, i.e. most tightly bound) among all elliptical transfers between them, using $a_{\min}=12\,327.370\,\mathrm{km}$ found above?
:::

::: answer
Specific orbital energy is $\varepsilon = -\mu/(2a)$, which becomes *most negative* (most tightly bound, lowest energy) at the *smallest* $a$, i.e. at $a=a_{\min}$. With $\mu=398\,600.4418\,\mathrm{km^3/s^2}$,
$$
\varepsilon_{\min} = -\frac{398\,600.4418}{2\times 12\,327.370} = -16.167\,\mathrm{km^2/s^2} .
$$
Every other elliptical transfer between these two points has $a>a_{\min}$ and therefore a less negative (higher) energy than this value; no ellipse through these two points can be more tightly bound than this.
:::

::: check
Suppose you are told a transfer has $s=20\,000\,\mathrm{km}$ and $c=15\,000\,\mathrm{km}$. Compute $A$ using $A^2=2s(s-c)$, and explain what would go wrong with this formula if someone mistakenly used $c > 2s$.
:::

::: answer
$A^2 = 2(20\,000)(20\,000-15\,000) = 2\times 20\,000\times 5000 = 2\times10^8\,\mathrm{km^2}$, so $A = 14\,142.1\,\mathrm{km}$. If $c>2s$, then $s-c$ would be negative, since $s=(r_1+r_2+c)/2$ means $2s-c=r_1+r_2 \ge c$ always holds for a genuine triangle (triangle inequality applied to $\mathbf{r}_1$, $\mathbf{r}_2$, and the chord itself) — so $c>2s$ is geometrically impossible for real position vectors and a real chord between them; it could only arise from an arithmetic error in computing $c$, $r_1$, or $r_2$, and $A^2$ turning up negative is a built-in check that catches exactly that mistake.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_1, \mathbf{r}_2, \Delta t$, direction, $N$ | The five inputs Lambert's problem needs; direction and $N$ are not optional |
| $c = \lVert\mathbf{r}_2-\mathbf{r}_1\rVert$ | Chord length |
| $s = (r_1+r_2+c)/2$ | Semiperimeter of the space triangle |
| Lambert's theorem | $\Delta t$ depends only on $a$, $c$, $r_1+r_2$ (equivalently $a$, $c$, $s$) |
| $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ | Carries the geometry into the time equation; $A^2=2s(s-c)$ |
| $a_{\min} = s/2$ | Smallest semi-major axis for which an elliptical transfer exists; vacant focus on the chord |
| $\varepsilon = -\mu/2a$ | Specific energy; most negative at $a_{\min}$ |

The next lesson uses $A$ directly to build the universal-variable time-of-flight equation and solve it — turning this lesson's geometry into the numbers $\mathbf{v}_1$ and $\mathbf{v}_2$, and proving the solver correct the only way that counts, by propagating the result back to $\mathbf{r}_2$.
