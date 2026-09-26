---
id: l05-law-of-sines-and-cosines
title: The law of sines and the law of cosines
minutes: 26
covers:
  - law of sines and law of cosines
---

Suppose you want to know how wide a river is, but you cannot cross it. Stand on your bank, pick a tree on the far side, walk a measured distance along the bank, and measure two angles. Three facts about a triangle — here one length and two angles — are enough to work out everything else about it.

A spacecraft engineer does the same thing with a bigger triangle. Draw a line from the center of the Earth to a ground station, another from the center to a satellite, and a third from the station to the satellite. That triangle holds everything a radio-link engineer cares about: the straight-line distance that sets how weak the signal gets, the angle above the horizon that decides whether the antenna can see the satellite at all, and the angle at Earth's center that fixes how long the pass lasts. None of its corners is a right angle. So the right-triangle ratios of lesson 2 do not apply to it directly, and neither does the Pythagorean theorem.

Two rules handle *every* triangle. The **law of cosines** is the Pythagorean theorem with a correction for a corner that is not square. The **law of sines** says each side of a triangle is in proportion to the sine of the angle across from it. Between them they solve any triangle from any three independent facts. They also turn up whenever two velocities or two positions are added or subtracted: the fuel cost of tilting an orbit, the ground speed of an airplane in a crosswind, and the distance between two spacecraft on the same orbit are each one triangle.

## Naming the parts

A triangle's three corners, called **vertices**, get capital letters $A$, $B$, $C$. The same letters stand for the angles at those corners. Each side gets the small letter of the corner it does *not* touch. So side $a$ is across from angle $A$, side $b$ across from $B$, and side $c$ across from $C$. This [[naming rule|triangle-labels]] is the whole trick to using both laws correctly: a side and its opposite angle always share a letter.

The three angles always [[add to a half turn|angle-sum]]:

$$
A + B + C = \pi \quad (\text{that is, } 180^\circ).
$$

So any two angles give you the third. A triangle has six parts in all — three sides and three angles. Three of them, including at least one side, are enough to work out the rest (with one catch, the "ambiguous case" below, where the same three facts fit two different triangles). Three angles alone are never enough: a small triangle and a big one can have the same angles.

This lesson is about flat triangles. The Earth's surface is not flat, and lesson 7 deals with triangles whose sides are arcs on a sphere. But the triangle made by Earth's center, a station and a satellite lies in one flat slice through the center, so the flat laws apply to it exactly.

## The law of cosines

Pick up a drawing compass, the kind with two legs and a hinge. Make both legs $10$ cm long. How far apart are the tips? That depends on how wide you open the hinge. Closed, the tips touch. Opened to $60^\circ$, the legs and the gap make an equilateral triangle, so the tips are $10$ cm apart. Opened to $90^\circ$, Pythagoras says $\sqrt{10^2 + 10^2} = 14.1$ cm. Opened flat to $180^\circ$, the tips are $20$ cm apart. The law of cosines is the one formula that covers every opening in between:

$$
c^2 = a^2 + b^2 - 2ab\cos C .
$$

Here $a$ and $b$ are the two sides that meet at the corner $C$, and $c$ is the side across from $C$. Check it on the compass. At $C = 90^\circ$, $\cos C = 0$ and it becomes the Pythagorean theorem: $c^2 = 100 + 100 = 200$, so $c = 14.1$ cm. At $C = 120^\circ$, $\cos C = -\tfrac{1}{2}$, so $c^2 = 100 + 100 + 100 = 300$ and $c = 17.3$ cm.

The last term, $-2ab\cos C$, is the correction for the corner not being square. Watch how it behaves:

- When $C$ is **acute** (less than $90^\circ$), $\cos C$ is positive, the correction subtracts, and $c$ is shorter than the right-angle value.
- When $C$ is **obtuse** (more than $90^\circ$), $\cos C < 0$, the correction adds, and $c$ is longer.
- At the extremes, $C = 0$ gives $c^2 = (a - b)^2$ and $C = 180^\circ$ gives $c^2 = (a + b)^2$. Those are the flattened "triangles" where all three sides lie along one line.

The same rule works with the letters swapped round: $a^2 = b^2 + c^2 - 2bc\cos A$, and so on. The one thing to keep straight is that the angle in the formula is the one *opposite* the side on the left.

::: key Law of cosines
$c^2 = a^2 + b^2 - 2ab\cos C$, where $C$ is the angle opposite side $c$. It reduces to the Pythagorean theorem at $C = 90^\circ$.
:::

::: note Why it has to be true
Lay the triangle on a grid. Put corner $C$ at the origin and side $a$ along the positive $x$ axis, so $B = (a, 0)$. Corner $A$ is a distance $b$ from $C$, in the direction of angle $C$, so by lesson 1 its coordinates are $A = (b\cos C,\ b\sin C)$. Side $c$ is the [[distance between those two corners|cosines-on-a-grid]]:

$$
c^2 = (a - b\cos C)^2 + (b\sin C)^2 = a^2 - 2ab\cos C + b^2\cos^2 C + b^2\sin^2 C .
$$

The last two terms are $b^2(\cos^2 C + \sin^2 C)$, which is $b^2$ by the Pythagorean identity of lesson 4. What is left is $c^2 = a^2 + b^2 - 2ab\cos C$.
:::

### The vector form

Flight software meets this law as a statement about arrows. If two vectors $\mathbf{u}$ and $\mathbf{v}$ (bold letters mean vectors — arrows with a length and a direction) have lengths $a$ and $b$ and the angle between them is $C$, the arrow from the tip of $\mathbf{v}$ to the tip of $\mathbf{u}$ is $\mathbf{u} - \mathbf{v}$, and

$$
|\mathbf{u} - \mathbf{v}|^2 = a^2 + b^2 - 2ab\cos C .
$$

The bars $|\ |$ mean "length of". This is the relative position of two vehicles, or the change in a velocity.

### Finding an angle from three sides

Rearrange the law to get the angle out:

$$
\cos C = \frac{a^2 + b^2 - c^2}{2ab} .
$$

Every angle in a triangle lies between $0$ and $\pi$ — exactly the range the arccosine returns (lesson 2). So a triangle given by three sides has no ambiguity: apply this once per angle and you have all three. If the right-hand side comes out bigger than $1$ or smaller than $-1$, the three lengths cannot make a triangle — one side is longer than the other two put together — and the arccosine rightly refuses.

::: example Plane change: the velocity triangle
A spacecraft in a circular orbit moves at $v = 7.70\ \mathrm{km/s}$. It must tilt its orbit — rotate the flat plane the orbit lies in — by $\Delta i = 5^\circ$ ("delta i", the change in **[[inclination|plane-change]]**) without changing its speed. How big a push, $\Delta v$, does the engine have to give?

**The triangle.** The velocity before the burn and the velocity after both have length $v$, and they point $5^\circ$ apart. The engine's push is the arrow from one tip to the other: the third side. Use the law of cosines with $a = b = v$ and $C = \Delta i$:

$$
\Delta v^2 = v^2 + v^2 - 2v^2\cos\Delta i = 2v^2(1 - \cos\Delta i) .
$$

**Tidy it with lesson 4.** The half-angle identity $1 - \cos\Delta i = 2\sin^2(\Delta i/2)$ turns this into $\Delta v^2 = 4v^2\sin^2(\Delta i/2)$. Take the square root:

$$
\Delta v = 2v\sin\frac{\Delta i}{2} = 2 \times 7.70 \times \sin 2.5^\circ = 2 \times 7.70 \times 0.04362 = 0.672\ \mathrm{km/s} .
$$

**Does it make sense?** Five degrees of tilt costs $672$ m/s — almost a tenth of the whole orbital speed, for a turn you could barely see. That is why launch sites are chosen to avoid plane changes. For a small angle, $\sin(\Delta i/2) \approx \Delta i/2$, so $\Delta v \approx v\,\Delta i$ with $\Delta i$ in radians: $7.70 \times 0.08727 = 0.672$ km/s, the same to three figures. At $\Delta i = 60^\circ$ the triangle is equilateral and $\Delta v = v$: a full $7.7$ km/s.
:::

## The law of sines

Now the river. Two lighthouses stand on a straight coast. Each keeper measures the angle between the coast and a ship. The bigger the angle at one lighthouse, the farther the ship is from the *other* one. The law of sines turns that feeling into a rule: in any triangle, each side divided by the sine of its opposite angle gives the same number.

$$
\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} .
$$

A bigger angle sits across from a longer side, and the sine measures exactly how much longer.

::: note Why it has to be true
From corner $C$, drop a line straight down to side $c$, meeting it at a right angle. Call its length $h$ (the **height**, or altitude). It splits the triangle into two right triangles.

In the one containing angle $A$, $h$ is the side opposite $A$ and $b$ is the hypotenuse, so $h = b\sin A$. In the one containing angle $B$, $h$ is opposite $B$ and $a$ is the hypotenuse, so $h = a\sin B$. It is the same height, so

$$
b\sin A = a\sin B \quad\Longrightarrow\quad \frac{a}{\sin A} = \frac{b}{\sin B}
$$

(dividing both sides by $\sin A\sin B$). Dropping the height from a different corner brings in the third side, so all three ratios are equal.

If one angle is obtuse, the height from a neighboring corner lands outside the triangle. The right triangle it makes then contains $\pi - A$ in place of $A$. Since $\sin(\pi - A) = \sin A$ (lesson 1), nothing changes.
:::

The shared value of the three ratios is also the [[diameter of the circle through all three corners|circumcircle]] — a handy check you will rarely need.

The height gives you the **area** for free. Area is half the base times the height: $\tfrac{1}{2}c\,h = \tfrac{1}{2}bc\sin A$. With any other pair of sides and the angle between them it reads the same way, for instance $\tfrac{1}{2}ab\sin C$.

::: key Law of sines
$\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$: each side is proportional to the sine of the opposite angle. It comes from writing one altitude two ways.
:::

::: example Spotting a ship from two lighthouses
Lighthouses $P$ and $Q$ stand $10.0$ km apart on a straight coast. The keeper at $P$ sees a ship at $50^\circ$ from the coastline, and the keeper at $Q$ sees it at $60^\circ$. How far is the ship from each lighthouse, and from the shore?

**Third angle.** The angles add to $180^\circ$, so the angle at the ship is $180^\circ - 50^\circ - 60^\circ = 70^\circ$. The $10.0$ km coast is the side across from that angle.

**Law of sines.** The ratio for the known side is $10.0/\sin 70^\circ$. The distance from $P$ is across from the $60^\circ$ angle at $Q$:

$$
PS = \frac{10.0\,\sin 60^\circ}{\sin 70^\circ} = \frac{10.0 \times 0.8660}{0.9397} = 9.22\ \mathrm{km}.
$$

The distance from $Q$ is across from the $50^\circ$ angle at $P$: $QS = 10.0 \times 0.7660/0.9397 = 8.15$ km.

**Distance from shore.** That is the height of the triangle, from the ship straight down to the coast: $9.22\sin 50^\circ = 7.06$ km. Working from the other side, $8.15\sin 60^\circ = 7.06$ km as well — a good check. And the ship is closer to $Q$, the lighthouse with the bigger angle, as the picture promised.
:::

## Which law, and the ambiguous case

What you know decides which law to use. The letters describe the three facts you are given — **S** for a side, **A** for an angle — in order around the triangle.

- **Three sides (SSS).** Law of cosines for each angle.
- **Two sides and the angle between them (SAS).** Law of cosines for the third side, then either law for the other angles.
- **Two angles and any side (ASA or AAS).** The third angle is $\pi$ minus the other two; then the law of sines for the sides. The lighthouses were this case.
- **Two sides and an angle that is not between them (SSA).** Law of sines for the angle opposite the second side — and here the trouble starts.

In the first three cases only one triangle fits the facts. The fourth is different.

Picture a straight fence running away from a post at a known angle, and an arm of fixed length hinged above the fence. Swing the arm down and it may touch the fence at [[two different places|ambiguous-swing]]. Both are real triangles.

In the SSA case you compute $\sin B = b\sin A / a$ and take an arcsine. Lesson 2 showed the arcsine returns only the acute answer, while the obtuse angle $\pi - B$ has exactly the same sine. Take $a = 7$, $b = 10$ and $A = 40^\circ$:

$$
\sin B = \frac{10\sin 40^\circ}{7} = 0.9183, \qquad B = 66.7^\circ \ \text{ or } \ B = 180^\circ - 66.7^\circ = 113.3^\circ .
$$

Both leave a positive third angle ($C = 73.3^\circ$ or $26.7^\circ$), so both triangles exist, with third sides $c = 10.43$ and $c = 4.89$. The arm of length $7$, hinged at the end of the side of length $10$, crosses the fence twice.

There are three ways out:

1. **Look at which side is longer.** If the side across from the known angle is the longer of the two ($a > b$), then $B$ sits across from the shorter side, so it must be acute, and the arcsine is right.
2. **Use what the problem tells you.** If the geometry says an angle is obtuse — the angle inside the triangle at a ground station always is, as you will see next — use the supplement, $\pi - B$.
3. **Skip the arcsine.** Write the law of cosines for side $a$, the known side across from the known angle: $a^2 = b^2 + c^2 - 2bc\cos A$. That rearranges into a quadratic for the unknown side, $c^2 - (2b\cos A)c + (b^2 - a^2) = 0$. Its two roots are the two triangles ($10.43$ and $4.89$ here). If one root comes out negative, there is only one triangle.

::: warning Arcsine silently drops the obtuse solution
Whenever you solve for an angle with the law of sines, ask whether the angle might be obtuse. If it can be, the arcsine has handed you the wrong triangle half of the time. Prefer the law of cosines and arccosine for any angle not known to be acute: the arccosine's range, $[0, \pi]$, covers every angle a triangle can have.
:::

## The ground-station triangle

Now the triangle from the start of the lesson. Call Earth's center $O$, a ground station $S$ on a round Earth of radius $R_E$ ("R sub E"), and a satellite $P$ at altitude $h$. So $OS = R_E$ and $OP = r = R_E + h$. The third side, $SP = D$, is the **slant range**: the straight-line distance from antenna to satellite. [[Three angles|ground-station-picture]] describe the geometry:

- the **central angle** $\lambda$ ("lambda") at $O$, between the lines from Earth's center to the station and to the satellite;
- the **nadir angle** $\eta$ ("eta") at $P$, between the satellite's line straight down to Earth's center and its line to the station ([[nadir|nadir-word]] means straight down);
- the **elevation angle** $\varepsilon$ ("epsilon") at $S$, measured from the station's horizon up to the satellite. The horizon is at right angles to $OS$, so the angle *inside* the triangle at $S$ is $90^\circ + \varepsilon$. It is always obtuse.

The angles add to $180^\circ$: $\lambda + \eta + (90^\circ + \varepsilon) = 180^\circ$. Take $90^\circ$ from both sides:

$$
\lambda + \eta + \varepsilon = 90^\circ .
$$

Suppose the station reports the elevation $\varepsilon$ and you want the slant range and the central angle. The side $R_E$ is across from $\eta$, and the side $r$ is across from the station's angle $90^\circ + \varepsilon$. The law of sines links them, and $\sin(90^\circ + \varepsilon) = \cos\varepsilon$:

$$
\frac{\sin\eta}{R_E} = \frac{\sin(90^\circ + \varepsilon)}{r} = \frac{\cos\varepsilon}{r} \quad\Longrightarrow\quad \sin\eta = \frac{R_E\cos\varepsilon}{r} .
$$

(Flipping every ratio upside down is fine: if $a/\sin A = b/\sin B$, then $\sin A/a = \sin B/b$.) The arcsine is safe here. The station's angle is obtuse, so it is the biggest angle, and the other two must both be acute. Then $\lambda = 90^\circ - \varepsilon - \eta$, and the slant range comes from the law of cosines with the two known sides and the angle $\lambda$ between them:

$$
D^2 = R_E^2 + r^2 - 2R_E\,r\cos\lambda ,
$$

or from the law of sines, $D = R_E\sin\lambda/\sin\eta$. The distance along the ground from the station to the point directly under the satellite is the arc $R_E\lambda$, with $\lambda$ in radians (lesson 1's $s = r\theta$).

::: example ISS pass at 10 degrees elevation
The International Space Station orbits at $h = 420$ km. Take $R_E = 6378$ km, so $r = 6378 + 420 = 6798$ km. A station first picks up its signal at elevation $\varepsilon = 10^\circ$.

**Nadir angle.** $\sin\eta = 6378\cos 10^\circ/6798 = 6378 \times 0.9848/6798 = 0.9239$, so $\eta = 67.5^\circ$.

**Central angle.** $\lambda = 90^\circ - 10^\circ - 67.5^\circ = 12.5^\circ$, which is $0.2179$ rad.

**Slant range by the law of cosines.** $D^2 = 6378^2 + 6798^2 - 2 \times 6378 \times 6798\cos 12.5^\circ$, which gives $D = 1493$ km.

**Check with the law of sines.** $D = 6378\sin 12.5^\circ/\sin 67.5^\circ = 6378 \times 0.2162/0.9239 = 1493$ km.

**Ground distance.** The point directly under the satellite is $R_E\lambda = 6378 \times 0.2179 = 1390$ km from the station, measured along the ground.

**Compare the true horizon,** $\varepsilon = 0$: $\sin\eta = 6378/6798 = 0.9382$, so $\eta = 69.8^\circ$, $\lambda = 20.2^\circ$, $D = 2352$ km, and a ground distance of $2254$ km.

Raising the lowest tracking angle — the **[[elevation mask|elevation-mask]]** — from $0^\circ$ to $10^\circ$ cuts the longest slant range from $2352$ to $1493$ km. Signal strength falls with distance squared, so that is a gain of $20\log_{10}(2352/1493) = 3.9$ **[[decibels|decibel]]**. But the circle of ground the station can cover shrinks from $2254$ to $1390$ km radius, and every pass gets shorter. That trade is the whole business of choosing an elevation mask.
:::

## Adding velocities: the wind triangle

An airplane moves through the air, and the air itself moves over the ground. Its velocity over the ground is its velocity through the air plus the wind's velocity. Draw the two arrows tip to tail; the ground velocity is the arrow that closes the triangle.

The angle between the two arrows *as directions* is the difference of their compass headings. But the angle *inside the triangle*, at the corner where they meet tip to tail, is $180^\circ$ minus that.

::: example Ground speed and drift in a crosswind
An airplane flies at $120$ m/s through the air on **[[heading|heading-track]]** $040^\circ$ (compass directions are measured clockwise from north). The wind is $20$ m/s, blowing *toward* $120^\circ$.

**The angle.** The two directions differ by $120^\circ - 40^\circ = 80^\circ$. So the angle inside the triangle, between the airspeed side and the wind side, is $180^\circ - 80^\circ = 100^\circ$.

**Ground speed by the law of cosines.**

$$
V_g^2 = 120^2 + 20^2 - 2 \times 120 \times 20\cos 100^\circ = 14400 + 400 + 833.5 = 15633.5, \qquad V_g = 125.0\ \mathrm{m/s} .
$$

(The $\cos 100^\circ$ is negative, so the correction adds $833.5$.)

**Drift by the law of sines.** The drift angle $\delta$ ("delta"), between where the nose points and where the airplane actually goes, sits across from the wind side. So $\sin\delta = 20\sin 100^\circ/125.0 = 0.1575$ and $\delta = 9.06^\circ$. The arcsine is safe because the wind side is the shortest side, so its opposite angle must be acute. The **track** — the path over the ground — is $040^\circ + 9.06^\circ = 049.1^\circ$, to the right of the heading, which is the side the wind is pushing toward.

**Check by components** (east, north). Airspeed: $(120\sin 40^\circ, 120\cos 40^\circ) = (77.13, 91.93)$. Wind: $(20\sin 120^\circ, 20\cos 120^\circ) = (17.32, -10.00)$. Sum: $(94.45, 81.93)$. Its length is $125.0$ m/s and its compass direction is $\operatorname{atan2}(94.45, 81.93) = 49.06^\circ$. The component route is what code does; the triangle route is how you check the code by hand.
:::

::: note Which route to take in software
Programs should add vectors component by component and get lengths back with `hypot` (a [[careful square root|hypot]]) and angles with `atan2`. That is what the component check above did, and it never meets the ambiguous case. The laws of sines and cosines are for reasoning, hand checks and derivations — the plane-change formula, the elevation-to-range relation — where a neat formula is worth more than a loop.
:::

## Check yourself

::: check
A triangle has sides 5, 7 and 9. Find its largest angle and its area.
:::

::: answer
The largest angle is across from the longest side, $9$. Call it $C$:

$$
\cos C = \frac{5^2 + 7^2 - 9^2}{2 \times 5 \times 7} = \frac{25 + 49 - 81}{70} = \frac{-7}{70} = -0.1 .
$$

So $C = \arccos(-0.1) = 95.7^\circ$. It is obtuse, which the negative cosine told you before you even took the arccosine.

Area $= \tfrac{1}{2} \times 5 \times 7 \times \sin 95.7^\circ = 17.5 \times 0.9950 = 17.4$ square units.
:::

::: check
Two satellites share the same circular orbit of radius 7000 km, $30^\circ$ apart as seen from Earth's center. What is the straight-line distance between them? Do it two ways.
:::

::: answer
**Law of cosines** with $a = b = 7000$ km and $C = 30^\circ$: $d^2 = 2 \times 7000^2(1 - \cos 30^\circ) = 2 \times 4.9 \times 10^7 \times 0.1340$, so $d = 3623$ km.

**Half-angle form** (as in the plane-change example): $d = 2 \times 7000\sin 15^\circ = 14000 \times 0.2588 = 3623$ km.

The curved path along the orbit between them is $7000 \times 30\pi/180 = 3665$ km, only about $1.2\%$ longer than the straight line.
:::

::: check
In a triangle $a = 7$, $b = 10$ and $A = 40^\circ$. How many triangles fit these facts, and what are their third sides?
:::

::: answer
This is the SSA case, with the known angle across from the shorter of the two sides. $\sin B = 10\sin 40^\circ/7 = 0.9183$, giving $B = 66.7^\circ$ or $113.3^\circ$. Both leave a positive third angle, $C = 73.3^\circ$ or $26.7^\circ$, so there are two triangles.

Third sides from the law of sines, $c = a\sin C/\sin A$: $7\sin 73.3^\circ/\sin 40^\circ = 10.43$ and $7\sin 26.7^\circ/\sin 40^\circ = 4.89$. Had $a$ been the longer side there would have been only one triangle — which the next question tests.
:::

::: check
Now make the side across from the angle longer: $a = 12$, $b = 10$, $A = 40^\circ$. How many triangles fit?
:::

::: answer
$\sin B = 10\sin 40^\circ/12 = 0.5357$, so $B = 32.4^\circ$ or $147.6^\circ$. The second one fails: $40^\circ + 147.6^\circ = 187.6^\circ$, already more than $180^\circ$. So only one triangle fits, with $C = 180^\circ - 40^\circ - 32.4^\circ = 107.6^\circ$ and $c = 12\sin 107.6^\circ/\sin 40^\circ = 17.8$.

That matches the first way out: the side across from the known angle ($a = 12$) is the longer one, so $B$ had to be acute.
:::

::: check
A ground station sees a geostationary satellite ($h = 35786$ km, $R_E = 6378$ km) at elevation $5^\circ$. Find the nadir angle, the central angle and the slant range.
:::

::: answer
$r = 6378 + 35786 = 42164$ km.

$\sin\eta = 6378\cos 5^\circ/42164 = 0.1507$, so $\eta = 8.67^\circ$.

$\lambda = 90^\circ - 5^\circ - 8.67^\circ = 76.3^\circ$.

$D^2 = 6378^2 + 42164^2 - 2 \times 6378 \times 42164\cos 76.3^\circ$ gives $D = 41127$ km.

Seen from that high up, the whole Earth fills a nadir angle of only $\arcsin(6378/42164) = 8.70^\circ$. So a station at the edge of coverage sits very close to the visible edge of the planet.
:::

::: check
Two burns of 300 m/s and 200 m/s happen one right after the other, with $60^\circ$ between their thrust directions. How big is the total change in velocity?
:::

::: answer
The two pushes add tip to tail. The angle inside the triangle between them is $180^\circ - 60^\circ = 120^\circ$:

$$
|\Delta \mathbf{v}|^2 = 300^2 + 200^2 - 2 \times 300 \times 200\cos 120^\circ = 90000 + 40000 + 60000 = 190000,
$$

so $|\Delta\mathbf{v}| = 436$ m/s. Using the angle between the arrows directly gives the same thing with a plus sign: $|\mathbf{u} + \mathbf{v}|^2 = a^2 + b^2 + 2ab\cos 60^\circ = 190000$.

The fuel paid for $300 + 200 = 500$ m/s of pushing; only $436$ m/s of it is net change in velocity, because the two pushes partly worked against each other sideways.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Side $a$ opposite angle $A$ | Naming rule; $A + B + C = \pi$ |
| $c^2 = a^2 + b^2 - 2ab\cos C$ | Law of cosines; Pythagoras when $C = 90^\circ$ |
| $\cos C = \dfrac{a^2 + b^2 - c^2}{2ab}$ | Angle from three sides; arccosine is never ambiguous |
| $\lvert\mathbf{u} - \mathbf{v}\rvert^2 = a^2 + b^2 - 2ab\cos C$ | Vector form |
| $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$ | Law of sines |
| Area $= \tfrac{1}{2}ab\sin C$ | Two sides and the angle between them |
| SSS, SAS, ASA, AAS | One triangle each |
| SSA | Ambiguous case: $B$ and $\pi - B$ may both be valid |
| $\Delta v = 2v\sin(\Delta i/2)$ | Plane change at constant speed |
| $\sin\eta = R_E\cos\varepsilon/r$, $\lambda + \eta + \varepsilon = 90^\circ$ | Ground-station triangle |
| $D^2 = R_E^2 + r^2 - 2R_E r\cos\lambda$ | Slant range from the central angle |

Next lesson: small angles. Several results here already hinted at them — $\Delta v \approx v\,\Delta i$, the straight line between satellites nearly equal to the arc. The small-angle approximations say exactly how good those shortcuts are, and where they stop working.

::: context triangle-labels Every side faces its own angle
Each side takes the small letter of the corner across from it. Side $a$ never touches corner $A$; it faces it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="40,170 320,170 210,40" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="40" cy="170" r="4" fill="#1f2a44"/>
  <circle cx="320" cy="170" r="4" fill="#1f2a44"/>
  <circle cx="210" cy="40" r="4" fill="#1f2a44"/>
  <text x="26" y="186" font-size="15" font-weight="700" fill="#1f2a44">A</text>
  <text x="326" y="186" font-size="15" font-weight="700" fill="#1f2a44">B</text>
  <text x="204" y="30" font-size="15" font-weight="700" fill="#1f2a44">C</text>
  <text x="274" y="100" font-size="15" font-style="italic" fill="#1d6fd1">a</text>
  <text x="112" y="98" font-size="15" font-style="italic" fill="#b4232c">b</text>
  <text x="180" y="190" font-size="15" font-style="italic" fill="#1f2a44">c</text>
  <line x1="40" y1="170" x2="268" y2="104" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="320" y1="170" x2="125" y2="105" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 4"/>
</svg>
```

The dashed lines join each corner to the side it faces. The biggest angle always faces the longest side.
:::

::: context angle-sum Why a triangle's angles make 180 degrees
Draw a line through the top corner, parallel to the bottom side. The two bottom angles reappear up there, one on each side of the top angle, because a line crossing two parallel lines makes equal angles with both. Now the three angles sit side by side along a straight line — and a straight line is a half turn, $180^\circ$. You can see it with paper too: tear the three corners off a paper triangle and lay them point to point. They always make a straight edge.
:::

::: context cosines-on-a-grid The law of cosines on a grid
Put corner $C$ at the origin with side $a$ flat along the $x$ axis. Corner $A$ lands at $(b\cos C, b\sin C)$. Side $c$ is then a distance you can work out with Pythagoras on the dashed right triangle: across by $a - b\cos C$, up by $b\sin C$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="170" x2="300" y2="170" stroke="#6c7a93" stroke-width="1.2"/>
  <polygon points="40,170 240,170 126.04,47.13" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="126.04" y1="47.13" x2="126.04" y2="170" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="240" y1="170" x2="126.04" y2="47.13" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M62,170 A22,22 0 0,0 52.62,151.98" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="66" y="163" font-size="12" fill="#1f2a44">C</text>
  <text x="30" y="188" font-size="12" fill="#1f2a44">(0, 0)</text>
  <text x="222" y="188" font-size="12" fill="#1f2a44">B = (a, 0)</text>
  <text x="134" y="40" font-size="12" fill="#1f2a44">A = (b cos C, b sin C)</text>
  <text x="70" y="104" font-size="13" font-style="italic" fill="#1f2a44">b</text>
  <text x="190" y="104" font-size="13" font-style="italic" fill="#1d6fd1">c</text>
  <text x="130" y="120" font-size="11" fill="#b4232c">b sin C</text>
  <text x="150" y="162" font-size="11" fill="#1f2a44">a − b cos C</text>
</svg>
```
:::

::: context plane-change Why launch sites care about tilt
An orbit's **inclination** is how far its plane is tilted from the equator. A rocket launched due east lands in an orbit tilted by about the launch site's latitude. From Cape Canaveral, at about $28.5^\circ$ north, that means a $28.5^\circ$ tilt — and a satellite headed for a geostationary orbit over the equator must remove it later, which costs a lot of fuel. Launching from Kourou in French Guiana, only about $5^\circ$ from the equator, leaves far less tilt to remove. That is one big reason the site was chosen.
:::

::: context circumcircle The circle through three corners
Any triangle's three corners lie on exactly one circle. The law-of-sines ratio $a/\sin A$ equals that circle's diameter. You can see why with a special case: slide corner $A$ around the circle until side $BA$ passes through the center. Angles standing on the same arc of a circle are equal, so angle $A$ has not changed. But now the triangle has a right angle at $C$ (an angle drawn in a semicircle is always square), and the hypotenuse is the diameter. So $\sin A = a/\text{diameter}$.
:::

::: context ambiguous-swing Two triangles from the same facts
Here $A = 40^\circ$ and side $b = 10$ are fixed. Side $a = 7$ swings from corner $C$ like a gate arm. Its dashed circle crosses the bottom line in two places, $B$ and $B'$, so two different triangles fit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="180" x2="221.51" y2="19.30" stroke="#1f2a44" stroke-width="2"/>
  <path d="M152.23,180 A175,175 0 0,0 290.80,180" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="221.51" y1="19.30" x2="152.23" y2="180" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="221.51" y1="19.30" x2="290.80" y2="180" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M60,180 A30,30 0 0,0 52.98,160.72" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="64" y="172" font-size="12" fill="#1f2a44">40°</text>
  <text x="14" y="196" font-size="13" font-weight="700" fill="#1f2a44">A</text>
  <text x="228" y="22" font-size="13" font-weight="700" fill="#1f2a44">C</text>
  <text x="143" y="198" font-size="13" font-weight="700" fill="#b4232c">B′</text>
  <text x="284" y="198" font-size="13" font-weight="700" fill="#1d6fd1">B</text>
  <text x="104" y="88" font-size="12" fill="#1f2a44">b = 10</text>
  <text x="160" y="110" font-size="12" fill="#b4232c">a = 7</text>
  <text x="262" y="100" font-size="12" fill="#1d6fd1">a = 7</text>
</svg>
```

The blue triangle has $c = 10.43$ and $B = 66.7^\circ$; the red one has $c = 4.89$ and $B' = 113.3^\circ$. If $a$ were longer than $10$, the circle would cross the line only once to the right of $A$.
:::

::: context ground-station-picture The ground-station triangle
Earth's center $O$, the station $S$ and the satellite $P$. The horizon at $S$ is at right angles to $OS$. Here the satellite is drawn much higher than the ISS so the angles are easy to see; the angles obey the same rule, $\lambda + \eta + \varepsilon = 90^\circ$ (here $29.8^\circ + 40.2^\circ + 20^\circ$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <path d="M9.89,126.91 A110,110 0 0,1 190.11,126.91" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="80" x2="235" y2="80" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polygon points="100,190 100,80 179.41,51.10" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="100" cy="190" r="3.5" fill="#1f2a44"/>
  <circle cx="100" cy="80" r="3.5" fill="#1f2a44"/>
  <circle cx="179.41" cy="51.10" r="4" fill="#b4232c"/>
  <path d="M100,165 A25,25 0 0,1 112.41,168.30" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M122,80 A22,22 0 0,0 120.67,72.48" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="104" y="160" font-size="12" fill="#1f2a44">λ</text>
  <text x="126" y="77" font-size="12" fill="#1f2a44">ε</text>
  <text x="158" y="72" font-size="12" fill="#1f2a44">η</text>
  <text x="86" y="200" font-size="13" font-weight="700" fill="#1f2a44">O</text>
  <text x="84" y="76" font-size="13" font-weight="700" fill="#1f2a44">S</text>
  <text x="186" y="50" font-size="13" font-weight="700" fill="#b4232c">P</text>
  <text x="138" y="58" font-size="11" fill="#1f2a44">D</text>
  <text x="200" y="94" font-size="11" fill="#6c7a93">horizon</text>
  <text x="240" y="150" font-size="12" fill="#1f2a44">λ + η + ε = 90°</text>
</svg>
```
:::

::: context nadir-word Nadir and zenith
**Zenith** is the point straight above your head; **nadir** is the point straight below your feet, on the far side of the Earth. Both words reached English from Arabic astronomy — nadir from a word meaning "opposite", because it is opposite the zenith. A satellite "looking at nadir" is pointing straight down at the center of the Earth, so the nadir angle measures how far off straight-down it must tip its antenna to aim at the station.
:::

::: context elevation-mask Why not track right down to the horizon
Near the horizon, a radio signal has to cross much more air, and trees, hills and buildings get in the way. So stations set an **elevation mask**: they only count the satellite as visible once it climbs above some angle, often somewhere between $5^\circ$ and $10^\circ$. A higher mask means a cleaner, stronger signal, but shorter passes.
:::

::: context decibel What a decibel is
A **decibel** (dB) is a way of comparing two powers by counting powers of ten: $10\log_{10}$ of the ratio. Twice the power is about $3$ dB; ten times is $10$ dB. Signal power falls with the square of distance, so a distance ratio gets squared first, and $10\log_{10}(\text{ratio}^2) = 20\log_{10}(\text{ratio})$. That is where the $20$ in $20\log_{10}(2352/1493)$ comes from. Radio engineers like decibels because gains and losses along a link then add up.
:::

::: context heading-track Heading, track and drift
**Heading** is where the airplane's nose points. **Track** is the direction it actually moves over the ground. In a crosswind the two differ by the **drift angle** — the airplane crabs slightly sideways, like a swimmer crossing a river who must aim upstream to land straight across. Pilots write headings as three digits clockwise from north, so east is $090^\circ$ and $040^\circ$ is northeast-ish.
:::

::: context hypot What hypot does
`math.hypot(x, y)` returns $\sqrt{x^2 + y^2}$, the length of the arrow $(x, y)$ — the hypotenuse, hence the name. It is better than writing the square root yourself because it is careful with very large and very small numbers: squaring $10^{200}$ would overflow a computer's number range, but `hypot` rescales first and gets the right answer.
:::
