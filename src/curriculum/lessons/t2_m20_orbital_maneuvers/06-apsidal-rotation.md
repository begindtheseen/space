---
id: l06-apsidal-rotation
title: Apsidal rotation
minutes: 16
covers:
  - apsidal rotation
---

Picture an oval running track drawn around a lamppost that stands near one end, not in the middle. When you run close to the lamppost you are on the tight end of the oval; far from it you are on the long, lazy end. Now imagine picking up the whole track, keeping its size and shape, and spinning it around the lamppost so the tight end points a different way. Same track, new direction.

That is an **apsidal rotation**. An elliptical orbit has a near point, **periapsis**, and a far point, **apoapsis**. The straight line through both of them, passing through Earth's center, is the **[[line of apsides|apse-word]]**. This lesson turns that line to a new direction while keeping the orbit's size and shape exactly the same. In terms of orbital elements, it changes the **[[argument of periapsis|omega-reminder]]** $\omega$ ("omega") by some angle $\Delta\omega$ and leaves the semi-major axis $a$ and eccentricity $e$ alone.

The last lesson turned the orbit's *plane*. This one stays inside the plane and turns the ellipse within it.

## Why a mission would move its apse line

Where the apsides point decides where an orbit is low and fast, and where it is high and slow. An imaging satellite may want its low point over the region it photographs. A communications satellite on a long, stretched orbit wants its high, slow point — where it lingers for hours — over the people it serves. A later maneuver may need to happen at a particular apsis, over a particular spot.

A classic example is the Soviet **[[Molniya|molniya]]** communications orbit: a highly stretched 12-hour orbit whose apoapsis hangs over the northern hemisphere for most of each lap. The mission depends on that apoapsis staying where the ground stations need it.

Do not confuse the burn in this lesson with **apsidal precession**, the slow, steady turning of the apse line that Earth's bulging equator causes on its own. That natural drift is a perturbation, driven by the term called **[[J₂|j2-bridge]]**, and needs no propellant. It depends strongly on the orbit's tilt: at most inclinations the apse line creeps around continuously, but at the "critical" inclination of about $63.4^\circ$ the drift from $J_2$ vanishes. That is exactly why Molniya orbits fly at $63.4^\circ$ — so their apoapsis stays put without burning fuel. This lesson is about the other option: paying, on purpose, with a single quick burn, to move the apse line by a chosen angle right now.

## Where two orbits of the same shape cross

Start with two orbits that have the same $a$ and the same $e$. They are the same ellipse, sharing Earth at one focus, but one is turned by $\Delta\omega$ relative to the other. A single burn can only move a spacecraft from one to the other at a point where they touch or cross. So first we find the crossings.

Here is the key idea, a **[[symmetry|bisector-symmetry]]** argument. Draw the line that splits the angle between the two apse lines exactly in half. Now imagine folding the picture along that line, like folding a sheet of paper. Orbit 1's periapsis direction lands on orbit 2's, and orbit 2's lands on orbit 1's. Because the two ellipses are identical, the fold swaps them perfectly.

So the fold line is a line of symmetry for the pair, and it is natural to look for the crossings on it. A short calculation confirms they are there and nowhere else. Take a direction $\theta$ ("theta") measured from orbit 1's periapsis. Orbit 1 is at distance $p/(1+e\cos\theta)$ in that direction, and orbit 2, whose periapsis is at $\Delta\omega$, is at $p/(1+e\cos(\theta-\Delta\omega))$. They meet when the two are equal, which means $\cos\theta = \cos(\theta - \Delta\omega)$. Two angles have the same cosine only if they are equal or opposite, and they cannot be equal here, so $\theta = -(\theta - \Delta\omega)$, giving $\theta = \Delta\omega/2$ — or that direction plus $180^\circ$. Both lie on the fold line. The two orbits cross exactly twice: once on the periapsis side and once on the apoapsis side.

Now read off the angles. Put orbit 1's periapsis at direction $0$ and orbit 2's at direction $\Delta\omega$. The crossing on the periapsis side sits at direction $\Delta\omega/2$. Measured from each orbit's own periapsis, its **true anomaly** is

$$
\nu_1 = +\frac{\Delta\omega}{2} \ \text{on orbit 1}, \qquad \nu_2 = -\frac{\Delta\omega}{2} \ \text{on orbit 2}.
$$

The other crossing, on the apoapsis side, sits at direction $180^\circ + \Delta\omega/2$, where $\nu_1 = 180^\circ + \Delta\omega/2$ and $\nu_2 = 180^\circ - \Delta\omega/2$.

### Same radius, same speed

At the periapsis-side crossing, both orbits are the same angle $\Delta\omega/2$ away from their own periapsis, but on opposite sides. The orbit equation, with $p = a(1-e^2)$ the semi-latus rectum, gives

$$
r = \frac{p}{1+e\cos(\Delta\omega/2)}
$$

for both, because cosine does not care about the sign of the angle: $\cos(+x) = \cos(-x)$.

By vis-viva, speed depends only on $r$ and $a$. Both are the same, so both orbits have the same speed there:

$$
v = \sqrt{\mu\left(\frac{2}{r}-\frac{1}{a}\right)}.
$$

### Opposite tilts

The directions are not the same. On orbit 1 the spacecraft has recently passed periapsis and is climbing. On orbit 2 it is heading toward periapsis and falling. Using the flight-path angle formula from lesson 4, the climb angle is

$$
\gamma = \arctan\!\left(\frac{e\sin(\Delta\omega/2)}{1+e\cos(\Delta\omega/2)}\right),
$$

tilted up ($+\gamma$) on orbit 1 and down ($-\gamma$) on orbit 2. The two velocities have the same length $v$ and are mirror images of each other across the **local horizontal** (the level direction). The angle between them is $2\gamma$.

### The burn

Two arrows of equal length $v$ with an angle $2\gamma$ between them: that is the same isosceles triangle as the pure plane change in lesson 5, with $2\gamma$ in place of $\Delta i$. So the same formula applies. (Another way to see it: the burn only **[[flips the climb rate|radial-transverse]]** and leaves the level motion alone.)

$$
\Delta v = 2v\sin\!\left(\frac{2\gamma}{2}\right) = 2v\sin\gamma .
$$

::: note Why it has to be true: the burn only flips the climb rate
Split each velocity into two parts, as in the last module: a **radial** part $v_r$ (straight away from Earth) and a **transverse** part $v_\perp$ (level, along the direction of travel). On any orbit,

$$
v_r = \sqrt{\frac{\mu}{p}}\;e\sin\nu, \qquad v_\perp = \sqrt{\frac{\mu}{p}}\,(1+e\cos\nu).
$$

At the periapsis-side crossing, orbit 1 has $\nu = +\Delta\omega/2$ and orbit 2 has $\nu = -\Delta\omega/2$. Both orbits share $p$ and $e$. So $v_\perp$ is identical (cosine ignores the sign), and $v_r$ is equal in size but opposite in sign (sine flips with the sign).

The burn therefore leaves the level part alone and flips the radial part from $+v_r$ to $-v_r$. Its size is

$$
\Delta v = 2|v_r| = 2\sqrt{\frac{\mu}{p}}\;e\sin\!\left(\frac{\Delta\omega}{2}\right).
$$

This matches $2v\sin\gamma$, because $v\sin\gamma$ is exactly the radial part of the velocity. It also settles the second crossing: there $\nu = 180^\circ \pm \Delta\omega/2$, and $|\sin(180^\circ \pm x)| = \sin x$, so the burn costs exactly the same. The spacecraft is slower there, but it is tilted more steeply, and the two effects cancel.
:::

::: key Apsidal rotation
At the crossing point of two same-shape orbits whose apse lines differ by $\Delta\omega$, both orbits have radius $r = p/(1+e\cos(\Delta\omega/2))$ and speed $v$ from vis-viva, with flight-path angles $\pm\gamma$, $\gamma = \arctan\!\big(e\sin(\Delta\omega/2)/(1+e\cos(\Delta\omega/2))\big)$. The rotation costs
$$
\Delta v = 2v\sin\gamma = 2\sqrt{\mu/p}\;e\sin(\Delta\omega/2).
$$
:::

::: example Rotating a GTO's apse line
The GTO from earlier lessons has $a = 24\,421.0\,\mathrm{km}$, $e = 0.7265$ and $p = 11\,529.9\,\mathrm{km}$. It is very stretched, so it is moving fast near periapsis.

**Rotate by $\Delta\omega = 10^\circ$.** The half-angle is $5^\circ$.

- Radius: $\cos 5^\circ = 0.99619$, so $1 + 0.7265 \times 0.99619 = 1.72378$ and $r = 11\,529.9/1.72378 = 6688.7\,\mathrm{km}$. That is barely above the true periapsis of $6678\,\mathrm{km}$.
- Speed: $v = \sqrt{398\,600.4418 \times (2/6688.7 - 1/24\,421.0)} = \sqrt{102.864} = 10.1422\,\mathrm{km/s}$.
- Tilt: $e\sin 5^\circ = 0.7265 \times 0.08716 = 0.06332$. Divide by $1.72378$: $\tan\gamma = 0.036735$, so $\gamma = 2.104^\circ$.
- Burn: $\Delta v = 2 \times 10.1422 \times \sin 2.104^\circ = 2 \times 10.1422 \times 0.036710 = 0.7446\,\mathrm{km/s}$.

**Check with the shortcut.** $\sqrt{\mu/p} = \sqrt{398\,600.4418/11\,529.9} = 5.8797\,\mathrm{km/s}$, so $\Delta v = 2 \times 5.8797 \times 0.7265 \times 0.08716 = 0.7446\,\mathrm{km/s}$. The same.

**Rotate by $\Delta\omega = 30^\circ$.** The half-angle is $15^\circ$. Now $r = 6775.1\,\mathrm{km}$, $v = 10.0669\,\mathrm{km/s}$, $\gamma = 6.305^\circ$, and $\Delta v = 2 \times 10.0669 \times \sin 6.305^\circ = 2.2113\,\mathrm{km/s}$.

**Sanity check.** Tripling the angle from $10^\circ$ to $30^\circ$ multiplied the cost by $2.2113/0.7446 = 2.97$ — almost exactly three. The shortcut explains why: the cost follows $\sin(\Delta\omega/2)$, and for small angles the sine grows almost in step with the angle ($\sin 15^\circ/\sin 5^\circ = 2.97$). Turning a GTO's apse line even a little is expensive: $10^\circ$ costs about half of what the whole GTO-to-GEO apogee burn does.
:::

::: example The same rotation on a rounder orbit
Keep $\Delta\omega = 20^\circ$ fixed and change only the orbit's shape.

- **GTO** ($e = 0.7265$): crossing at $r = 6721.0\,\mathrm{km}$, $v = 10.114\,\mathrm{km/s}$, $\gamma = 4.206^\circ$, so $\Delta v = 1483.6\,\mathrm{m/s}$.
- **Moderately stretched** ($r_p = 20\,000$, $r_a = 40\,000\,\mathrm{km}$, so $a = 30\,000\,\mathrm{km}$ and $e = 0.333$): crossing at $r = 20\,076.3\,\mathrm{km}$, $v = 5.1402\,\mathrm{km/s}$, $\gamma = 2.495^\circ$, so $\Delta v = 447.6\,\mathrm{m/s}$.
- **Nearly circular, high** ($r_p = 38\,000$, $r_a = 44\,000\,\mathrm{km}$, so $a = 41\,000\,\mathrm{km}$ and $e = 0.073$): crossing at $r = 38\,039.4\,\mathrm{km}$, $v = 3.3519\,\mathrm{km/s}$, $\gamma = 0.679^\circ$, so $\Delta v = 79.4\,\mathrm{m/s}$.

The same $20^\circ$ turn costs $1483.6/79.4 = 18.7$ times less on the nearly circular orbit than on the GTO.

**Why.** The shortcut $2\sqrt{\mu/p}\,e\sin(\Delta\omega/2)$ has $e$ right in front. A rounder orbit has a smaller $e$, and also a larger $p$ here, which lowers $\sqrt{\mu/p}$. Both push the cost down. It is the plane-change lesson again, from a new angle: you pay in proportion to the part of the velocity you have to swing — here, the climb rate — and stretched orbits have big climb rates.
:::

::: warning $\Delta\omega/2$, not $\Delta\omega$, drives the geometry
Both the crossing radius and the tilt use the *half*-angle $\Delta\omega/2$. Plugging the full $\Delta\omega$ into the tilt formula finds the wrong point entirely. For the $10^\circ$ GTO example, it would give $\gamma = 4.21^\circ$ — the tilt of a $20^\circ$ rotation — and roughly double the right cost.
:::

::: warning Two crossing points: same price, different places
The two orbits cross twice. One crossing is on the periapsis side, at true anomaly $\pm\Delta\omega/2$. The other is on the apoapsis side, at $180^\circ \pm \Delta\omega/2$ — not a mirror image of the first, but far out, where the spacecraft is slow and steeply tilted. For the $10^\circ$ GTO rotation that second crossing is at $r = 41\,742\,\mathrm{km}$, with $v = 1.666\,\mathrm{km/s}$ and $\gamma = -12.91^\circ$.

Both cost exactly the same Δv, as the note above shows. So choose between them on other grounds: which one comes up sooner in the mission timeline, and where the spacecraft can be tracked from the ground during the burn.
:::

## Burn now, or let nature do it?

A mission that needs its apse line moved has two ways to get there. It can burn, paying $2\sqrt{\mu/p}\,e\sin(\Delta\omega/2)$ in one go. Or, if its inclination is not the critical $63.4^\circ$, it can wait for $J_2$ to turn the apse line for free — but only at the rate and in the direction that $J_2$ chooses. The next module works out that rate.

Some missions do the opposite. They *choose* their orbit so that the natural drift is what they want, or cancels out, and keep a small burn budget for trimming. Designers weigh Δv against time in this choice, the same way the one-tangent transfer in lesson 4 weighed Δv against arrival time.

## Check yourself

::: check
Using only the fact that the two orbits share $a$ and $e$, explain why they cross at the same radius.
:::

::: answer
On a Kepler orbit the radius depends on true anomaly through $r = p/(1+e\cos\nu)$, and $p = a(1-e^2)$ depends only on $a$ and $e$. So both orbits use the same formula with the same $p$ and $e$.

The symmetry argument shows both orbits reach the crossing the same angle $\Delta\omega/2$ from their own periapsis, but on opposite sides: $\nu = +\Delta\omega/2$ on one and $-\Delta\omega/2$ on the other. Cosine ignores the sign, $\cos(+\Delta\omega/2) = \cos(-\Delta\omega/2)$, so both give exactly the same $r$, even though they approach from opposite sides of their periapses.
:::

::: check
Someone proposes an apsidal rotation on a circular orbit ($e = 0$). What does $\Delta v = 2v\sin\gamma$ predict, and does that make sense?
:::

::: answer
With $e = 0$, the tilt formula gives $\gamma = \arctan(0/1) = 0$ for any $\Delta\omega$, so $\Delta v = 2v\sin 0 = 0$.

That makes sense, but read it carefully. A circular orbit has no periapsis or apoapsis — every point is the same distance from Earth — so its **[[argument of periapsis is not even defined|circle-no-periapsis]]**. There is nothing to rotate. The zero is telling you the maneuver has no meaning, not that it is a free bargain.
:::

::: check
Find the Δv for a $15^\circ$ apsidal rotation on an orbit with $a = 15\,000\,\mathrm{km}$ and $e = 0.5$.
:::

::: answer
**Shape.** $p = a(1-e^2) = 15\,000 \times 0.75 = 11\,250\,\mathrm{km}$. The half-angle is $7.5^\circ$.

**Radius.** $\cos 7.5^\circ = 0.99144$, so $1 + 0.5 \times 0.99144 = 1.49572$ and $r = 11\,250/1.49572 = 7521.4\,\mathrm{km}$.

**Speed.** $2/r - 1/a = 2/7521.4 - 1/15\,000 = 1.9924 \times 10^{-4}\,\mathrm{km^{-1}}$. Multiply by $\mu$: $398\,600.4418 \times 1.9924 \times 10^{-4} = 79.42$. So $v = \sqrt{79.42} = 8.9116\,\mathrm{km/s}$.

**Tilt.** $0.5 \times \sin 7.5^\circ = 0.06526$. Divide by $1.49572$: $\tan\gamma = 0.04363$, so $\gamma = 2.498^\circ$.

**Burn.** $\Delta v = 2 \times 8.9116 \times \sin 2.498^\circ = 2 \times 8.9116 \times 0.043592 = 0.7769\,\mathrm{km/s}$.

**Check with the shortcut.** $\sqrt{\mu/p} = \sqrt{398\,600.4418/11\,250} = 5.9524\,\mathrm{km/s}$, and $2 \times 5.9524 \times 0.06526 = 0.7769\,\mathrm{km/s}$. The two methods agree.
:::

::: check
Two designers each need to turn an apse line by $20^\circ$. One has a Molniya-type orbit ($e \approx 0.74$); the other a nearly circular GPS-class orbit ($e \approx 0.01$). Without exact numbers, rank the costs and explain.
:::

::: answer
The Molniya-type orbit costs far more. The cost is $2\sqrt{\mu/p}\,e\sin(\Delta\omega/2)$, with the eccentricity $e$ right in front. Going from $e \approx 0.74$ to $e \approx 0.01$ cuts that factor by about seventy-four times, and the two orbits have similar sizes, so $\sqrt{\mu/p}$ does not make up the difference.

In words: a stretched orbit has a big climb rate at the crossing point, and the burn's whole job is to reverse that climb rate. A nearly circular orbit barely climbs at all, so there is almost nothing to reverse. This lesson's own comparison showed the same pattern: $1484\,\mathrm{m/s}$ at $e = 0.727$ against $79\,\mathrm{m/s}$ at $e = 0.073$. At $e = 0.01$ the cost falls further still, toward the $e = 0$ limit of zero. (For the record: roughly $1.48\,\mathrm{km/s}$ against about $13\,\mathrm{m/s}$ for typical sizes of these two orbits.)
:::

::: check
Why is it misleading to call the natural apsidal drift from Earth's oblateness "the same thing" as the maneuver in this lesson?
:::

::: answer
They reach the same end result — $\omega$ changes — by completely different means and on completely different terms.

The maneuver here is a single quick burn, paid for in Δv at a moment you choose, with its cost given by $2v\sin\gamma$.

Oblateness-driven apsidal precession is a steady perturbation. It acts at every moment whether you want it or not, turns the apse line slowly over many orbits, and costs no propellant at all. Its rate depends on the orbit's inclination, eccentricity and altitude through the $J_2$ physics of the next module — not on any burn geometry — and it vanishes at the critical inclination of about $63.4^\circ$.

A mission might let the natural drift do the work if it can wait. Or it might need a burn precisely to fight the drift, or to get somewhere faster than the drift would take it.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Line of apsides | The line from periapsis through Earth's center to apoapsis; its direction is set by $\omega$ |
| $\nu = \pm\Delta\omega/2$ | True anomaly of the periapsis-side crossing on the two orbits |
| $r = p/(1+e\cos(\Delta\omega/2))$ | Radius where two same-shape orbits with apse lines $\Delta\omega$ apart cross |
| $\gamma=\arctan\!\big(e\sin(\Delta\omega/2)/(1+e\cos(\Delta\omega/2))\big)$ | Flight-path angle at the crossing, equal and opposite on the two orbits |
| $\Delta v = 2v\sin\gamma = 2\sqrt{\mu/p}\,e\sin(\Delta\omega/2)$ | Apsidal rotation cost; the burn reverses the radial velocity |
| Second crossing, $\nu = 180^\circ \pm \Delta\omega/2$ | Same cost, far from Earth |
| GTO, $\Delta\omega=10^\circ \to 30^\circ$ | $\Delta v$ rises from $0.745$ to $2.211\,\mathrm{km/s}$ — about three times |
| Same $20^\circ$, $e=0.727 \to 0.073$ | $\Delta v$ falls from $1484$ to $79\,\mathrm{m/s}$ |
| $e=0$ | Cost and meaning both vanish — no apsis to rotate |
| Distinct from | $J_2$ apsidal precession (next module): steady, propellant-free, zero at $i \approx 63.4^\circ$ |

Lessons 2 through 6 have all been about one spacecraft changing its own orbit. The next lesson brings in a second spacecraft. Phasing maneuvers use the same period-and-speed tools to close a gap in *time* along an orbit, rather than in space.

::: context apse-word Where "apsis" comes from
*Apsis* comes from the Greek *hapsis*, meaning an arch or a loop — the same root as the "apse", the rounded end of a church. Its plural is *apsides* (say "AP-sih-deez"). The two apsides are the ends of the orbit's long axis, where it curves around most tightly or most gently.

You will see the prefix change with the body being orbited: *perigee* and *apogee* for Earth, *perihelion* and *aphelion* for the Sun, *periapsis* and *apoapsis* for anything at all.
:::

::: context omega-reminder The argument of periapsis
Of the six classical orbital elements from the last module, $\omega$ is the one that says where, within the orbit's plane, the periapsis sits. It is measured in the direction of travel, from the ascending node — where the orbit crosses the equator going north — to the periapsis.

Change only $\omega$ and the plane stays put, the ellipse keeps its size and shape, and only its orientation within the plane turns. That is exactly the maneuver in this lesson.
:::

::: context molniya The Molniya orbit
The Soviet Union launched its first Molniya ("lightning") communications satellite in 1965. Much of the country lies so far north that a geostationary satellite over the equator sits low on the horizon, or below it. The Molniya orbit solved this with a stretched ellipse — eccentricity about $0.74$, period about 12 hours — whose apoapsis is high over the northern hemisphere.

Near apoapsis the satellite moves slowly, so it hangs in the northern sky for about eight hours of each lap, then whips quickly around the southern low point. Three satellites spaced along the orbit give round-the-clock coverage. The orbit is still used today, and its name is used for any orbit of this design.
:::

::: context j2-bridge What J₂ is, and the magic inclination
Earth is not a perfect sphere. Its spin makes it bulge at the equator, about $21\,\mathrm{km}$ wider in radius than at the poles. $J_2$ is the number that measures that bulge in the gravity field. The next module shows that it turns the apse line at a rate proportional to $4 - 5\sin^2 i$:

$$
\dot\omega = \frac{3}{4}\,n\,J_2\left(\frac{R_E}{p}\right)^2\left(4 - 5\sin^2 i\right).
$$

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 174" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="110" x2="330" y2="110" stroke="#1f2a44" stroke-width="1.4"/>
  <line x1="50" y1="20" x2="50" y2="136" stroke="#1f2a44" stroke-width="1.4"/>
  <path d="M50.0,30.0 L59.0,30.3 L68.0,31.1 L77.0,32.4 L86.0,34.3 L95.0,36.7 L104.0,39.5 L113.0,42.8 L122.0,46.5 L131.0,50.6 L140.0,55.0 L149.0,59.7 L158.0,64.5 L167.0,69.6 L176.0,74.8 L185.0,80.0 L194.0,85.2 L203.0,90.4 L212.0,95.5 L221.0,100.3 L230.0,105.0 L239.0,109.4 L248.0,113.5 L257.0,117.2 L266.0,120.5 L275.0,123.3 L284.0,125.7 L293.0,127.6 L302.0,128.9 L311.0,129.7 L320.0,130.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="240.3" cy="110" r="4.5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44"><text x="50" y="150" text-anchor="middle">0°</text><text x="185" y="150" text-anchor="middle">45°</text><text x="320" y="150" text-anchor="middle">90°</text><text x="44" y="34" text-anchor="end">4</text><text x="44" y="114" text-anchor="end">0</text><text x="44" y="134" text-anchor="end">−1</text></g>
  <text x="250" y="72" font-size="12" fill="#b4232c">63.4°: no drift</text>
  <line x1="262" y1="76" x2="243" y2="105" stroke="#b4232c" stroke-width="1"/>
  <text x="120" y="24" font-size="11" fill="#6c7a93">4 − 5 sin² i</text>
  <text x="300" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">inclination i</text>
</svg>
```

The factor is zero when $\sin^2 i = 4/5$, at $i = 63.43^\circ$. There the apse line stands still — which is why Molniya orbits are flown at that tilt.
:::

::: context bisector-symmetry The fold that swaps the orbits
Two identical ellipses sharing a focus, one turned $40^\circ$ from the other (drawn with $e = 0.5$ so the shapes are easy to see). The dashed line splits the $40^\circ$ in half. Fold along it and the ellipses trade places, so they can only cross on the fold line: once near periapsis, once near apoapsis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <ellipse cx="172.5" cy="100" rx="85" ry="73.61" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <ellipse cx="172.5" cy="100" rx="85" ry="73.61" fill="none" stroke="#1f2a44" stroke-width="2.2" transform="rotate(-40 215 100)"/>
  <line x1="74.0" y1="151.3" x2="327.8" y2="59.0" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <circle cx="215" cy="100" r="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="257.5" cy="100" r="3.5" fill="#1d6fd1"/>
  <circle cx="247.6" cy="72.7" r="3.5" fill="#1f2a44"/>
  <circle cx="255.8" cy="85.2" r="5" fill="#b4232c"/>
  <circle cx="102.0" cy="141.1" r="5" fill="#b4232c"/>
  <text x="270" y="114" font-size="11" fill="#1d6fd1">periapsis 1</text>
  <text x="254" y="58" font-size="11" fill="#1f2a44">periapsis 2</text>
  <text x="270" y="96" font-size="11" fill="#b4232c">crossing</text>
  <text x="12" y="160" font-size="11" fill="#b4232c">crossing</text>
  <text x="318" y="78" font-size="11" fill="#6c7a93">fold</text>
</svg>
```

Both crossings cost the same burn, even though one is near Earth and the other far away.
:::

::: context radial-transverse The burn only flips the climb
At the crossing, split each velocity into a level part and an up-or-down part. The level parts are identical. The up-down parts are equal and opposite. So the burn points straight down (or up), and its size is twice the climb rate. The drawing uses a tilt of $14^\circ$ so the parts are easy to see.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 32 360 136" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="100" x2="250" y2="100" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="50" y1="100" x2="250" y2="50" stroke="#1d6fd1" stroke-width="2.4"/>
  <polygon points="250.0,50.0 239.6,57.8 237.1,48.1" fill="#1d6fd1"/>
  <line x1="50" y1="100" x2="250" y2="150" stroke="#1f2a44" stroke-width="2.4"/>
  <polygon points="250.0,150.0 237.1,151.9 239.6,142.2" fill="#1f2a44"/>
  <line x1="262" y1="50" x2="262" y2="150" stroke="#b4232c" stroke-width="2.6"/>
  <polygon points="262,150 257,138 267,138" fill="#b4232c"/>
  <text x="70" y="56" font-size="12" fill="#1d6fd1">orbit 1: climbing</text>
  <text x="70" y="152" font-size="12" fill="#1f2a44">orbit 2: falling</text>
  <text x="272" y="96" font-size="12" fill="#b4232c">Δv = 2 v_r</text>
  <text x="272" y="112" font-size="11" fill="#b4232c">(points down)</text>
  <text x="130" y="96" font-size="11" fill="#6c7a93">same level part v⊥</text>
</svg>
```

This is why the shortcut $\Delta v = 2\sqrt{\mu/p}\,e\sin(\Delta\omega/2)$ works: $\sqrt{\mu/p}\,e\sin\nu$ is the radial speed.
:::

::: context circle-no-periapsis What engineers use when there is no periapsis
For a perfect circle, $\omega$ is undefined, and for a nearly circular orbit it jumps around wildly with tiny changes, because the "lowest point" is barely lower than anywhere else. Navigation software that used $\omega$ for such orbits would give jittery, useless numbers.

So for near-circular orbits engineers switch to the **argument of latitude**, $u = \omega + \nu$: the angle from the ascending node to the spacecraft itself. That is always well defined. Sets of elements built this way are called *nonsingular* elements, and you will meet them again in orbit-determination work.
:::
