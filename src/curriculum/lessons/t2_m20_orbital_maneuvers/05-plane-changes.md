---
id: l05-plane-changes
title: Plane changes and combined manoeuvres
minutes: 21
covers:
  - plane change and combined plane-change-plus-raise optimisation
---

Picture riding a bike fast down a straight road, and then trying to turn onto a side street without slowing down. The faster you go, the harder that turn is. You have to push sideways against all the speed you have built up. Walking, the same turn is effortless.

Spacecraft feel exactly this, only far more strongly. Every orbit lies in a flat sheet through Earth's center, called its **orbital plane**. Tilting that sheet to a new angle means turning the spacecraft's whole velocity — about $7.7\,\mathrm{km/s}$ in low orbit — to point a new way. That makes a **plane change** the most expensive routine thing you can ask an orbit to do.

It is so expensive that it shapes launch decisions. Ask a launch provider why a rocket flies the **[[azimuth|launch-azimuth]]** it does — the compass heading it takes off the pad — and the answer traces back to this lesson. Mission designers will accept a longer ascent, a worse launch site, or months of waiting rather than pay for a big plane change in orbit. This lesson works out exactly why, and where to pay if you must.

## Where a plane change can happen

Two different orbital planes both pass through Earth's center. So they cross each other along a straight line through the center, the way two pages of an open book meet along the spine. For a change of tilt, that line is the **[[line of nodes|node-line]]** — the line where the orbit crosses the equator.

A single quick burn can only move the spacecraft from one plane into the other at a point that lies in *both* planes. Those points are the two ends of the crossing line. So a plane-change burn always happens at one of those two spots. Everything else in this lesson is about how much that burn costs and how to spend it well.

## The cost of a pure plane change

Start with the cleanest case. The burn only turns the velocity through an angle $\Delta i$ ("delta i", the change in tilt). The speed $v$ stays the same.

Draw the velocity before and the velocity after as two arrows from one point. Both have length $v$, with the angle $\Delta i$ between them. The burn is the arrow that joins their tips. Two equal sides and an angle between them: that is an **isosceles triangle**, a triangle with two equal sides.

The law of cosines from lesson 1 gives the third side. With both speeds equal to $v$,

$$
\Delta v^2 = v^2 + v^2 - 2v^2\cos\Delta i = 2v^2(1-\cos\Delta i).
$$

Now use the **[[half-angle identity|half-angle]]** $1-\cos\Delta i = 2\sin^2(\Delta i/2)$:

$$
\Delta v^2 = 4v^2\sin^2\!\left(\frac{\Delta i}{2}\right) \quad\Longrightarrow\quad \Delta v = 2v\sin\!\left(\frac{\Delta i}{2}\right).
$$

Read this carefully, because it is the whole lesson in one line. The cost is **in direct proportion to the speed**. Double the speed at which you turn, and you exactly double the cost. There is no clever burn geometry that avoids this. It comes straight from the triangle. So the question that matters is *where* — which is the same as *how fast* — you do the turn.

::: example How much a 28.5° plane change costs, at four different speeds
**[[Kennedy Space Center|kennedy-latitude]]** sits at about $28.5^\circ$ north. A rocket launched due east from there goes into an orbit tilted $28.5^\circ$ to the equator. To reach an orbit over the equator, like geostationary orbit (GEO), that $28.5^\circ$ has to be removed somewhere.

The cost at each speed is $\Delta v = 2v\sin(28.5^\circ/2) = 2v\sin 14.25^\circ = 2v \times 0.24615 = 0.49231\,v$. Using the speeds from this module's running LEO-to-GEO transfer:

| Where | $v$ (km/s) | $\Delta v$ for $28.5^\circ$ |
| --- | --- | --- |
| LEO circular (6678 km) | 7.7258 | 3.8035 km/s |
| **[[GTO|gto-word]]** perigee | 10.1516 | 4.9977 km/s |
| GTO apogee | 1.6078 | 0.7915 km/s |
| GEO circular | 3.0747 | 1.5137 km/s |

For example, at LEO: $0.49231 \times 7.7258 = 3.8035\,\mathrm{km/s}$.

The same $28.5^\circ$ turn costs $4.9977\,\mathrm{km/s}$ at GTO perigee and $0.7915\,\mathrm{km/s}$ at GTO apogee. That is a factor of $10.1516/1.6078 = 6.31$ — exactly the ratio of the two speeds, as the formula promised. Nobody flies the plane change at perigee when apogee is available.

**Sanity check.** At LEO the turn costs about half the orbital speed. For comparison, lesson 2's entire coplanar LEO-to-GEO transfer costs $3.89\,\mathrm{km/s}$. A $28.5^\circ$ turn done in low orbit would cost about as much as the whole trip to GEO.
:::

::: key Pure plane change
$$
\Delta v = 2v\sin\!\left(\frac{\Delta i}{2}\right).
$$
At LEO speed $7.73\,\mathrm{km/s}$ a $28.5^\circ$ change costs $3.80\,\mathrm{km/s}$; at GEO speed $3.07\,\mathrm{km/s}$ the same change costs $1.51\,\mathrm{km/s}$. Cost scales linearly with the speed at which the rotation is performed.
:::

::: key Where a plane change is cheapest
At the slowest point — apoapsis — because $\Delta v$ scales directly with the speed being rotated. This is why GTO missions carry the inclination change to apogee.
:::

## Combining the plane change with a speed change

A plane change is almost never the only job at a burn. On the way to GEO, the burn at GTO apogee already has to speed the spacecraft up, from the transfer orbit's apogee speed to GEO's circular speed. It would be wasteful to do the turn as a separate burn.

A **combined burn** changes speed and direction in one push. Call the speed before the burn $v_1$ and the speed after $v_2$. The triangle now has two *unequal* sides, $v_1$ and $v_2$, with the angle $\Delta i$ between them. The law of cosines gives

$$
\Delta v = \sqrt{v_1^2 + v_2^2 - 2v_1v_2\cos\Delta i}.
$$

(When the two speeds are equal, this goes back to the pure plane change. When $\Delta i = 0$, it goes back to $|v_2 - v_1|$, a plain speed change. Both are good checks.)

Here is the important fact: combining is never more expensive than doing the two jobs one after the other at the same spot, and it is almost always cheaper.

The reason is a picture. Put the tips of the velocity arrows on a sheet of paper. The "before" tip is a point $A$. The "after" tip is a point $B$. A single combined burn moves you from $A$ straight to $B$. Doing the jobs separately — say, turn first, then speed up — takes you from $A$ to some in-between point $C$, then from $C$ to $B$. That is a detour. And by the **[[triangle inequality|triangle-inequality]]**, a detour is never shorter than the straight line: $|AB| \le |AC| + |CB|$.

::: note Why the combined burn has to win
The in-between point $C$ is the velocity after the first of the two separate burns. If you turn first, $C$ has the old speed $v_1$ but the new direction. If you speed up first, $C$ has the new speed $v_2$ but the old direction. Either way $A$, $C$ and $B$ are three corners of a triangle, and in any triangle one side is shorter than the other two added together.

The two can be equal only if $C$ lies exactly on the straight segment from $A$ to $B$. For the turn-first path that happens only when there is nothing to combine: either $\Delta i = 0$ (no turn, so $A$, $C$ and $B$ all point the same way) or $v_1 = v_2$ (no speed change, so $C$ is $B$). Whenever the burn really does both jobs, the inequality is strict and combining saves Δv.
:::

::: example Combined burn versus doing it in two steps, at GTO apogee
At GTO apogee the speed is $v_1 = 1.6078\,\mathrm{km/s}$. GEO circular speed is $v_2 = 3.0747\,\mathrm{km/s}$. Take the full $\Delta i = 28.5^\circ$.

**Combined.** The squares are $1.6078^2 = 2.5850$ and $3.0747^2 = 9.4538$. The cross term is $2 \times 1.6078 \times 3.0747 \times \cos 28.5^\circ = 8.6891$. So

$$
\Delta v = \sqrt{2.5850 + 9.4538 - 8.6891} = \sqrt{3.3497} = 1.8302\,\mathrm{km/s}.
$$

**Turn first, then speed up.** Turning at the slow $1.6078\,\mathrm{km/s}$ costs $0.7915\,\mathrm{km/s}$ (from the table). Then the speed-up costs $3.0747 - 1.6078 = 1.4669\,\mathrm{km/s}$. Total: $0.7915 + 1.4669 = 2.2584\,\mathrm{km/s}$. That is $23\%$ more than combining.

**Speed up first, then turn.** The speed-up is the same $1.4669\,\mathrm{km/s}$. But now the turn happens at the faster $3.0747\,\mathrm{km/s}$ and costs $1.5137\,\mathrm{km/s}$. Total: $1.4669 + 1.5137 = 2.9806\,\mathrm{km/s}$ — $63\%$ more.

**Sanity check.** The combined burn is bigger than the speed change alone ($1.4669$), as it must be, since it also turns. But it is much less than either two-step path. Combining wins outright, and of the two-step paths, turning while slow is the better one.

Add this apogee burn to the departure burn from lesson 2: $2.4258 + 1.8302 = 4.2560\,\mathrm{km/s}$. So a LEO-to-GEO mission that also removes the $28.5^\circ$ costs roughly $4.3\,\mathrm{km/s}$, against $3.89\,\mathrm{km/s}$ if no plane change were needed.
:::

::: key LEO to GEO, with and without the plane change
Coplanar LEO (6678 km) to GEO Hohmann: $\Delta v_1 \approx 2.43\,\mathrm{km/s}$, $\Delta v_2 \approx 1.47\,\mathrm{km/s}$, total $\approx 3.89\,\mathrm{km/s}$. Add a $28.5^\circ$ plane change at GEO (combined with the apogee burn) and the total rises to roughly $4.3\,\mathrm{km/s}$.
:::

::: key Combined burn
$$
\Delta v = \sqrt{v_1^2 + v_2^2 - 2v_1v_2\cos\Delta i}
$$
— the law of cosines on the velocity triangle. Always cheaper than doing the two separately. If burns must be sequential, do the rotation while the vehicle is slower.
:::

## Splitting a plane change between two burns

A full LEO-to-GEO trip has *two* burns: the departure at perigee and the arrival at apogee. The $28.5^\circ$ does not all have to be spent at one of them. You can split it.

Do a fraction $f$ of the turn together with the perigee burn, and the rest, $(1-f)$ of it, together with the apogee burn. Each burn is a combined burn with its own share of the angle:

$$
\Delta v(f) = \sqrt{v_{c1}^2+v_p^2-2v_{c1}v_p\cos(f\Delta i)} + \sqrt{v_a^2+v_{c2}^2-2v_av_{c2}\cos\big((1-f)\Delta i\big)}.
$$

The four speeds are lesson 2's Hohmann numbers: LEO circular speed $v_{c1} = 7.7258$, transfer perigee speed $v_p = 10.1516$, transfer apogee speed $v_a = 1.6078$, and GEO circular speed $v_{c2} = 3.0747\,\mathrm{km/s}$.

Try the two extremes first:

- All the turn at apogee ($f = 0$): $2.4258 + 1.8302 = 4.2560\,\mathrm{km/s}$.
- All the turn at perigee ($f = 1$): $6.4561\,\mathrm{km/s}$.

Now search every $f$ between $0$ and $1$ with a computer. The lowest total comes at $f^\star = 0.0772$ (read "f star", the best $f$). That puts only $2.20^\circ$ of the $28.5^\circ$ at perigee and the other $26.30^\circ$ at apogee. The total is $4.2314\,\mathrm{km/s}$, which saves $24.6\,\mathrm{m/s}$ compared with doing the whole turn at apogee.

Be honest about the size of that. $24.6\,\mathrm{m/s}$ is a small fine-tuning on top of the big decision — apogee, not perigee — which is worth $6.4561 - 4.2314 = 2.2247\,\mathrm{km/s}$, about ninety times more. The all-at-perigee choice is $53\%$ worse than the best split.

### Why a small share at perigee helps at all

The perigee burn already has a large speed change to make: $10.1516 - 7.7258 = 2.4258\,\mathrm{km/s}$. In the velocity triangle, that is a long side. Tilting a long side by a small angle barely changes the third side. So the first degree or two of turning, added to a burn that is already big, costs almost nothing.

Each extra degree added at perigee costs a bit more than the one before. Each degree removed from apogee saves a steady amount. The best split is where the **[[marginal cost|marginal-cost]]** — the cost of one more degree — is the same at both burns. Past $f^\star$, adding more turn to the fast perigee burn costs more than it saves at apogee, and the total starts to rise again.

::: example Checking the optimum by marginal cost
How fast does a combined burn's cost grow as you add turn? Take the derivative of the law of cosines with respect to the angle $\theta$:

$$
\frac{d(\Delta v)}{d\theta} = \frac{v_1 v_2 \sin\theta}{\Delta v}.
$$

**At perigee**, with $\theta = 2.20^\circ$: the burn is $\Delta v = 2.4495\,\mathrm{km/s}$, so the marginal cost is $7.7258 \times 10.1516 \times \sin 2.20^\circ / 2.4495 = 1.229\,\mathrm{km/s}$ per radian.

**At apogee**, with $\theta = 26.30^\circ$: the burn is $\Delta v = 1.7819\,\mathrm{km/s}$, so the marginal cost is $1.6078 \times 3.0747 \times \sin 26.30^\circ / 1.7819 = 1.229\,\mathrm{km/s}$ per radian.

They match: about $21\,\mathrm{m/s}$ per degree at each end. Moving one more degree either way would cost as much as it saves. That is what "the best split" means.

**Sanity check.** At $f = 0$ the perigee marginal cost is zero (because $\sin 0 = 0$) while the apogee one is $1.289\,\mathrm{km/s}$ per radian. So moving the first bit of turn to perigee is pure gain. That is why the optimum is not at $f = 0$.
:::

## A different idea: the Oberth effect

It is easy to mix up plane changes with a famous rule of thumb: "burns are more efficient deep in a gravity well, where you are fast." That rule is the **[[Oberth effect|oberth]]** from lesson 3, and it is true — for energy.

Recall the reason. Burn quickly at one point, so the distance $r$ from Earth does not change, and add $\Delta v$ straight along the motion. The specific energy $arepsilon = v^2/2 - \mu/r$ then changes by

$$
\Delta\varepsilon = \frac{(v+\Delta v)^2}{2} - \frac{v^2}{2} = v\,\Delta v + \frac{\Delta v^2}{2}.
$$

The first term grows with $v$. So the same $\Delta v$ buys more energy when you are already fast.

::: warning The Oberth effect and a plane change are different things
A pure turn does not change the speed at all, so it does not change the energy. The Oberth effect has nothing to offer it. For a turn, $2v\sin(\Delta i/2)$ says the opposite: pay slow, not fast. Oberth argues for perigee when you want to *raise* an orbit. It argues for nothing when you only want to *turn* one.
:::

::: warning A plane change is not only inclination
Everything here applies to turning an orbit's plane through any angle — including swinging it around Earth's axis (changing the **right ascension of the ascending node**, where the orbit crosses the equator going north) while the tilt stays the same. The formula $\Delta v = 2v\sin(\Delta i/2)$ still holds, but $\Delta i$ must be the true **[[angle between the two planes|plane-angle]]**, not the difference of the two inclinations. The two are the same only when the node stays put and only the tilt changes.
:::

## Check yourself

::: check
A satellite needs a $5^\circ$ inclination change at a circular speed of $4.50\,\mathrm{km/s}$. Find the Δv. Then find the speed at which the same turn would cost half as much.
:::

::: answer
$\Delta v = 2 \times 4.50 \times \sin 2.5^\circ = 9.00 \times 0.043619 = 0.3926\,\mathrm{km/s}$.

For a fixed angle, the cost is in direct proportion to the speed. So half the cost needs half the speed: $v = 2.25\,\mathrm{km/s}$. Check: $2 \times 2.25 \times \sin 2.5^\circ = 0.1963\,\mathrm{km/s}$, exactly half.
:::

::: check
Explain why the triangle-inequality argument guarantees combining is never worse than separate burns, but does not by itself say combining is *always* strictly better.
:::

::: answer
The triangle inequality $|AB| \le |AC| + |CB|$ allows equality. Equality happens exactly when the in-between point $C$ lies on the straight segment from $A$ to $B$.

For separate burns that only happens in the do-nothing cases. If $\Delta i = 0$, there is no turn, so all three points lie on one line. If $v_1 = v_2$, there is no speed change, so one of the two separate burns has zero size and $C$ coincides with an end point.

Whenever a burn really combines a nonzero turn with a real speed change, $C$ sits off the straight segment and the inequality is strict. That is why every example in this lesson shows a real gap rather than a tie.
:::

::: check
A mission has a $10^\circ$ plane change and an orbit raise to do, with only one burn point. The speed before the burn is $5.0\,\mathrm{km/s}$ and the speed needed after it is $5.8\,\mathrm{km/s}$. Find the combined Δv, and compare it with a pure $10^\circ$ turn alone at $5.0\,\mathrm{km/s}$.
:::

::: answer
**Combined.** $5.0^2 + 5.8^2 = 25 + 33.64 = 58.64$. The cross term is $2 \times 5.0 \times 5.8 \times \cos 10^\circ = 57.119$. So $\Delta v = \sqrt{58.64 - 57.119} = \sqrt{1.521} = 1.2334\,\mathrm{km/s}$.

**Pure turn alone.** $2 \times 5.0 \times \sin 5^\circ = 0.8716\,\mathrm{km/s}$.

The combined burn does *more* — the turn *and* the full $0.8\,\mathrm{km/s}$ speed-up — yet costs only about $362\,\mathrm{m/s}$ more than the turn alone. Doing the two separately would cost at least $0.8716 + 0.8 = 1.6716\,\mathrm{km/s}$. The difference is the saving from combining.
:::

::: check
Why does the best split put only about $2.2^\circ$ of the $28.5^\circ$ at perigee, rather than, say, half?
:::

::: answer
Perigee is the fast point of the transfer orbit — over $10\,\mathrm{km/s}$ here. By the $2v\sin(\Delta i/2)$ scaling, turning there is expensive per degree once you go past a small amount.

The perigee burn's cost is mostly its big speed change, $2.43\,\mathrm{km/s}$. A small turn added to that long side of the triangle is nearly free, but each extra degree costs more than the last. Apogee, meanwhile, is slow — about $1.6\,\mathrm{km/s}$ — so each degree removed from it saves a steady, fairly small amount.

The best split is where one more degree costs the same at both ends, about $21\,\mathrm{m/s}$ per degree. Because apogee is so much slower than perigee, that balance point comes after only a couple of degrees at perigee — nowhere near half.
:::

::: check
A student guesses: "If the transfer orbit were much less stretched, so perigee and apogee speeds were nearly equal, the best split would move toward half-and-half." Is that right? What actually controls the split?
:::

::: answer
Not in general. Two effects set the split, and they pull in different directions.

**Hiding a turn inside a speed change.** A burn that already changes speed a lot can absorb a small turn almost free. This effect wants to give each burn *some* turn.

**Turning at the slower point.** Once a burn's "free" allowance is used up, each extra degree costs close to the pure-turn price, $2v\sin$, which is lowest where $v$ is lowest. And a pure turn is slightly cheaper done in one piece than split, because $\sin$ bends downward. This effect pushes the whole turn to the slower burn.

When the speeds are nearly equal, the speed changes are also small, so there is little room to hide a turn. The second effect wins and the optimum slides toward doing almost all of the turn at the (slightly) slower apogee. Numbers bear this out: from $7000$ to $7500\,\mathrm{km}$ with a $10^\circ$ change, $f^\star \approx 0.27$; from $7000$ to $7010\,\mathrm{km}$, $f^\star \approx 0.02$.

A near half-and-half split appears only when the turn is small compared with the speed changes — for example, $f^\star \approx 0.48$ for a $1^\circ$ change from $7000$ to $7100\,\mathrm{km}$. So the split depends on how big the turn is compared with each burn's speed change, not only on how stretched the orbit is.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta v = 2v\sin(\Delta i/2)$ | Pure plane change; in direct proportion to speed |
| $\Delta v=\sqrt{v_1^2+v_2^2-2v_1v_2\cos\Delta i}$ | Combined speed-and-plane-change burn |
| Combined $\le$ separate | Triangle inequality; equality only when $v_1=v_2$ or $\Delta i=0$ |
| $28.5^\circ$ at LEO vs GEO | $3.80\,\mathrm{km/s}$ versus $1.51\,\mathrm{km/s}$ |
| $28.5^\circ$ at GTO perigee vs apogee | $5.00\,\mathrm{km/s}$ versus $0.79\,\mathrm{km/s}$ — a factor of $6.3$ |
| GTO apogee: combined vs best two-step | $1.8302\,\mathrm{km/s}$ versus $2.2584\,\mathrm{km/s}$ |
| LEO to GEO with $28.5^\circ$ at apogee | $4.256\,\mathrm{km/s}$, roughly $4.3$ |
| Best split, LEO to GEO, $28.5^\circ$ | $f^\star=0.0772$ ($2.20^\circ$ at perigee), total $4.2314\,\mathrm{km/s}$, saves $24.6\,\mathrm{m/s}$ |
| All at perigee | $6.4561\,\mathrm{km/s}$ — $53\%$ worse than the best split |
| $\Delta\varepsilon = v\,\Delta v + \Delta v^2/2$ | Oberth effect: helps energy changes, not pure turns |

Plane changes turn the orbit's *plane*. The next lesson turns something that stays inside the plane: the long axis of the ellipse, the line of apsides. It uses the same law of cosines, but the price depends on where along the orbit you are forced to pay it.

::: context launch-azimuth How the launch site limits the tilt
A rocket's heading off the pad and its launch site's latitude together set the orbit's tilt. The rule is $\cos i = \cos\phi\,\sin A$, where $\phi$ ("phi") is the latitude and $A$ is the azimuth measured clockwise from north. Launching due east ($A = 90^\circ$, so $\sin A = 1$) gives $i = \phi$, the smallest tilt that site can reach directly.

So a site at $28.5^\circ$ north cannot launch straight into an equatorial orbit. Any other heading gives a *bigger* tilt. Getting below $28.5^\circ$ needs a plane change in orbit — which is why launch sites near the equator are prized for geostationary missions.
:::

::: context node-line Two planes meet along a line
Here are two circular orbits of the same size, seen at a slant. One plane is tipped more than the other, so it looks like a fatter ellipse. They share only two points, marked in red — the ends of the dashed line through Earth. Those are the only places one burn can switch the spacecraft from one plane to the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="48" y1="90" x2="312" y2="90" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <ellipse cx="180" cy="90" rx="120" ry="22" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <ellipse cx="180" cy="90" rx="120" ry="62" fill="none" stroke="#1f2a44" stroke-width="2.2"/>
  <circle cx="180" cy="90" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="60" cy="90" r="5" fill="#b4232c"/>
  <circle cx="300" cy="90" r="5" fill="#b4232c"/>
  <text x="180" y="170" font-size="12" text-anchor="middle" fill="#1f2a44">orbit 2 (more tilted)</text>
  <text x="180" y="62" font-size="12" text-anchor="middle" fill="#1d6fd1">orbit 1</text>
  <text x="316" y="94" font-size="11" fill="#b4232c">burn</text>
  <text x="44" y="94" font-size="11" text-anchor="end" fill="#b4232c">or here</text>
</svg>
```

For a pure change of tilt, this crossing line is the line of nodes, where the orbit passes through the equator. That is why inclination-change burns happen as the spacecraft crosses the equator.
:::

::: context half-angle Seeing the half-angle formula
Split the isosceles velocity triangle down the middle. The dashed line cuts the angle $\Delta i$ in half and meets the far side at a right angle. Each half is a right triangle with a long side $v$ and an angle $\Delta i/2$, so its short side is $v\sin(\Delta i/2)$. Two halves make the full burn: $2v\sin(\Delta i/2)$. The drawing uses the real $28.5^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 40 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="233.8" y2="60.8" stroke="#1f2a44" stroke-width="2.2"/>
  <line x1="40" y1="110" x2="233.8" y2="159.2" stroke="#1d6fd1" stroke-width="2.2"/>
  <line x1="233.8" y1="60.8" x2="233.8" y2="159.2" stroke="#b4232c" stroke-width="2.6"/>
  <line x1="160" y1="110" x2="233.8" y2="110" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polyline points="225.8,110 225.8,102 233.8,102" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
  <path d="M 83.6 98.9 A 45 45 0 0 1 83.6 121.1" fill="none" stroke="#6c7a93" stroke-width="1.4"/>
  <text x="92" y="114" font-size="12" fill="#1f2a44">Δi = 28.5°</text>
  <text x="120" y="72" font-size="12" fill="#1f2a44">v before</text>
  <text x="120" y="160" font-size="12" fill="#1d6fd1">v after</text>
  <text x="242" y="106" font-size="12" fill="#b4232c">Δv = 2v sin(Δi/2)</text>
  <text x="242" y="124" font-size="12" fill="#b4232c">≈ 0.49 v</text>
</svg>
```

The identity $1 - \cos x = 2\sin^2(x/2)$ is the same fact written as algebra.
:::

::: context kennedy-latitude Why Florida, and why east
Launching east gets a free push from Earth's spin. The ground at the equator moves east at about $465\,\mathrm{m/s}$. At Kennedy's latitude it moves at about $465 \times \cos 28.5^\circ \approx 409\,\mathrm{m/s}$ — still a large gift toward the roughly $7.8\,\mathrm{km/s}$ needed for orbit.

The price of Florida's latitude shows up later, as the $28.5^\circ$ plane change every geostationary satellite launched from there must pay. Sites closer to the equator, such as the European spaceport at Kourou in French Guiana at about $5^\circ$ north, pay far less.
:::

::: context gto-word GTO, the geostationary transfer orbit
**GTO** is short for *geostationary transfer orbit*: the stretched ellipse from lesson 2 with its low point near the launch altitude and its high point at GEO height, $42\,164\,\mathrm{km}$ from Earth's center. The rocket drops the satellite off in GTO, and the satellite's own engine does the apogee burn.

Some launches go one step further and use a *supersynchronous* transfer orbit, with its high point well above GEO. The spacecraft is even slower up there, so the plane change costs even less, and a later burn lowers the high point back to GEO height.
:::

::: context triangle-inequality The straight line is the shortcut
This picture uses the real GTO-apogee numbers. The arrows are the velocities; the dots are their tips. Going straight from the "before" tip $A$ to the "after" tip $B$ is the combined burn. Going through $C$ — turn first, then speed up — is the two-step path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 28 360 182" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="185" x2="174.7" y2="185" stroke="#6c7a93" stroke-width="1.4"/>
  <line x1="30" y1="185" x2="273.2" y2="53.0" stroke="#6c7a93" stroke-width="1.4"/>
  <path d="M 70 185 A 40 40 0 0 0 65.2 165.9" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="76" y="178" font-size="11" fill="#6c7a93">28.5°</text>
  <line x1="174.7" y1="185" x2="273.2" y2="53.0" stroke="#b4232c" stroke-width="2.6"/>
  <line x1="174.7" y1="185" x2="157.2" y2="116.0" stroke="#1d6fd1" stroke-width="2.2" stroke-dasharray="6 3"/>
  <line x1="157.2" y1="116.0" x2="273.2" y2="53.0" stroke="#1d6fd1" stroke-width="2.2" stroke-dasharray="6 3"/>
  <circle cx="174.7" cy="185" r="4.5" fill="#1f2a44"/>
  <circle cx="273.2" cy="53.0" r="4.5" fill="#1f2a44"/>
  <circle cx="157.2" cy="116.0" r="4.5" fill="#1d6fd1"/>
  <text x="180" y="200" font-size="12" fill="#1f2a44">A (before, 1.61 km/s)</text>
  <text x="240" y="44" font-size="12" fill="#1f2a44">B (after, 3.07)</text>
  <text x="140" y="112" font-size="12" fill="#1d6fd1">C</text>
  <text x="230" y="132" font-size="12" fill="#b4232c">AB = 1.83</text>
  <text x="108" y="166" font-size="11" fill="#1d6fd1">AC = 0.79</text>
  <text x="140" y="88" font-size="11" fill="#1d6fd1">CB = 1.47</text>
</svg>
```

The detour $A \to C \to B$ adds up to $2.26\,\mathrm{km/s}$; the straight side is $1.83$.
:::

::: context marginal-cost Thinking "one more degree at a time"
Economists call the cost of one more unit the *marginal* cost. It is the right tool whenever you split a budget between two places. If one more degree is cheaper at perigee than at apogee, move it to perigee. Keep going until the two costs match; then no move can help.

This is the same idea that lets calculus find a minimum: at the lowest point of a smooth curve, the slope is zero. Here the slope of the total, $d\Delta v/df$, is the perigee marginal cost minus the apogee one. The exercise for this module asks you to find $f^\star$ numerically — this is the check that your answer is right.
:::

::: context oberth The Oberth effect in numbers
Add $100\,\mathrm{m/s}$ at GTO perigee, where the speed is $10\,152\,\mathrm{m/s}$: $\Delta\varepsilon = 10\,152 \times 100 + 5000 \approx 1.02 \times 10^6\,\mathrm{J/kg}$. Add the same $100\,\mathrm{m/s}$ at apogee, at $1608\,\mathrm{m/s}$: only about $1.66 \times 10^5\,\mathrm{J/kg}$ — about six times less.

So for *raising energy*, perigee wins by a factor of six. For *turning*, the table earlier in this lesson says apogee wins by a similar factor, $6.3$, the ratio of the two speeds. Same orbit, same two points, opposite answers — because one job changes energy and the other does not.
:::

::: context plane-angle Finding the true angle between two planes
Each orbital plane has a **normal** — an arrow sticking straight out of it, like a pencil standing on a table. The angle between two planes is the angle between their normals. With inclinations $i_1$, $i_2$ and a change $\Delta\Omega$ in the node,

$$
\cos\theta = \cos i_1\cos i_2 + \sin i_1\sin i_2\cos\Delta\Omega.
$$

If $\Delta\Omega = 0$, this gives $\cos\theta = \cos(i_1 - i_2)$, so $\theta$ is the plain difference of inclinations. If the node moves too, $\theta$ is something else, and it is $\theta$ that goes into $2v\sin(\theta/2)$.
:::
