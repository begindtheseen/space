---
id: l02-hohmann-transfer
title: The Hohmann transfer
minutes: 18
covers:
  - Hohmann transfer and its optimality
---

Imagine two circular running tracks, one inside the other, and you want to move from the inner one to the outer one. You could turn sharply and cut straight across. Or you could speed up, let your momentum carry you outward on a smooth curve, and arrive running in exactly the direction the outer track goes. The second way wastes nothing on turning.

That smooth curve is the **Hohmann transfer**, named after **[[Walter Hohmann|hohmann-history]]**, who described it in 1925, decades before anything flew on one. It is still the first maneuver a mission designer reaches for whenever two circular orbits in the same plane need connecting. It shows up in every Δv budget that raises or lowers an orbit: low Earth orbit to geostationary transfer orbit, that transfer orbit on to geostationary orbit itself, a constellation satellite climbing from its drop-off orbit to its working altitude. You will compute it more often than every other maneuver in this module combined.

The arithmetic is short once you have vis-viva. What makes it worth a whole lesson is the claim attached to it: of all two-burn transfers between two circular orbits in the same plane, this one costs the least propellant. Understanding why that is true is what lets you spot, in later lessons, when it stops being the right answer.

## Building the transfer

Start with two circular orbits around the same planet. The inner one has radius $r_1$ ("r one") and the outer one has radius $r_2$, with $r_1 < r_2$. They are **[[coplanar|coplanar]]** — they lie in the same flat plane.

### The transfer ellipse

Connect them with an ellipse that barely touches the inner circle at its closest point and barely touches the outer circle at its farthest point. The closest point of an orbit is its **periapsis**; the farthest is its **apoapsis**. So this ellipse has periapsis exactly at $r_1$ and apoapsis exactly at $r_2$.

An ellipse's **semi-major axis** $a$ is half its longest width. Here the longest width runs from periapsis to apoapsis, through the planet's center: $r_1 + r_2$. Half of that is

$$
a_t = \frac{r_1 + r_2}{2}.
$$

The little $t$ in $a_t$ ("a sub t") stands for "transfer".

### Why both burns are pure speed changes

At periapsis and apoapsis, every orbit moves exactly sideways — at right angles to the line to the planet. A circular orbit moves exactly sideways everywhere. So at $r_1$, the transfer ellipse and the inner circle point the same way. At $r_2$, the transfer ellipse and the outer circle point the same way. The ellipse is **[[tangent|tangent-picture]]** to both circles: it touches each one without crossing it.

That means neither burn has to turn the velocity. You point the engine straight along the direction of travel and change only the speed. In lesson 1's law of cosines, $\theta = 0$ at both burns, and each Δv is a plain difference of speeds. That is the whole reason the Hohmann transfer is cheap: every bit of both burns goes into changing speed, and none into turning.

### The first burn

The circular speed at radius $r$ is $\sqrt{\mu/r}$, where $\mu$ ("mew") is the planet's gravitational parameter, $3.986\times10^5\,\mathrm{km^3/s^2}$ for Earth. So on the inner circle the speed is $v_1 = \sqrt{\mu/r_1}$.

The speed on the transfer ellipse at periapsis comes from **vis-viva**, the speed–radius rule from the last module, $v = \sqrt{\mu(2/r - 1/a)}$:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_1} - \frac{1}{a_t}\right)}.
$$

Because $r_1$ is smaller than $a_t$, this is faster than the circular speed $v_1$ (the note below shows why). So the first burn is **prograde** — forward, along the direction of travel — and speeds the vehicle up:

$$
\Delta v_1 = v_p - v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1+r_2}} - 1\right).
$$

The second form comes from putting $a_t = (r_1+r_2)/2$ into vis-viva and pulling $\sqrt{\mu/r_1}$ out front.

### The second burn

At $r_2$ the mirror argument applies. The transfer ellipse's speed at apoapsis is

$$
v_a = \sqrt{\mu\left(\frac{2}{r_2} - \frac{1}{a_t}\right)},
$$

and because $r_2$ is larger than $a_t$, this is *slower* than the circular speed $v_2 = \sqrt{\mu/r_2}$. The vehicle arrives at the outer circle too slow to stay on it. So the second burn is prograde too, speeding it up to circular:

$$
\Delta v_2 = v_2 - v_a = \sqrt{\frac{\mu}{r_2}}\left(1 - \sqrt{\frac{2r_1}{r_1+r_2}}\right).
$$

Both burns point the way the vehicle is already moving. There is no turning anywhere in the maneuver.

::: note Why it has to be true: faster inside $a$, slower outside
Compare the squared speed on any orbit with the squared circular speed at the same radius:

$$
v^2 - \frac{\mu}{r} = \mu\left(\frac{2}{r} - \frac{1}{a}\right) - \frac{\mu}{r} = \mu\left(\frac{1}{r} - \frac{1}{a}\right).
$$

If $r < a$, then $1/r > 1/a$, the right side is positive, and the orbit is faster than circular there. If $r > a$, the right side is negative, and the orbit is slower than circular. The transfer ellipse has $r_1 < a_t < r_2$, so it is faster than circular at $r_1$ and slower than circular at $r_2$ — both burns must add speed.
:::

### The time of flight

The vehicle travels from periapsis to apoapsis: exactly half of the ellipse. By Kepler's third law an ellipse's full period is $2\pi\sqrt{a^3/\mu}$, so half of it is

$$
t_{\text{transfer}} = \pi\sqrt{\frac{a_t^3}{\mu}}.
$$

That time is fixed the moment you choose $r_1$ and $r_2$. A Hohmann transfer has no free setting left to adjust when you arrive. The one-tangent transfers of lesson 4 spend extra Δv precisely to buy that freedom back.

::: example LEO to GEO
Move from a low orbit at $r_1 = 6678\,\mathrm{km}$ (about $300\,\mathrm{km}$ up) to **[[geostationary orbit|geostationary]]** at $r_2 = 42\,164\,\mathrm{km}$, with $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$.

**Step 1 — circular speeds.**
$v_1 = \sqrt{\mu/r_1} = \sqrt{398\,600.4418/6678} = 7.7258\,\mathrm{km/s}$ and $v_2 = \sqrt{\mu/r_2} = 3.0747\,\mathrm{km/s}$.

**Step 2 — transfer ellipse.** $a_t = (6678 + 42\,164)/2 = 24\,421.0\,\mathrm{km}$.

**Step 3 — transfer speeds, from vis-viva.**
$v_p = \sqrt{\mu(2/6678 - 1/24\,421.0)} = 10.1516\,\mathrm{km/s}$ at periapsis, and $v_a = \sqrt{\mu(2/42\,164 - 1/24\,421.0)} = 1.6078\,\mathrm{km/s}$ at apoapsis.

**Step 4 — the burns.**

$$
\Delta v_1 = 10.1516 - 7.7258 = 2.4258\,\mathrm{km/s}, \qquad \Delta v_2 = 3.0747 - 1.6078 = 1.4668\,\mathrm{km/s}.
$$

The total is $2.4258 + 1.4668 = 3.8926\,\mathrm{km/s}$.

**Step 5 — time of flight.**

$$
t = \pi\sqrt{\frac{24\,421.0^3}{398\,600.4418}} = 18\,990\,\mathrm{s} = 5.275\,\mathrm{h}.
$$

**Sanity check.** Both transfer speeds sit where they should: $v_p$ above the inner circular speed, $v_a$ below the outer one. And the trip takes about five hours — between the inner orbit's 1.5-hour period and the outer orbit's 24 hours.

These are the numbers behind every **[[apogee kick|apogee-kick]]** mission to GEO from a low parking orbit, and they come back throughout this module.
:::

::: example LEO to a GPS-like orbit
Same start, $r_1 = 6678\,\mathrm{km}$. The target is $r_2 = 26\,578.1\,\mathrm{km}$, about $20\,200\,\mathrm{km}$ up — the height of the **[[GPS satellites|gps-orbit]]**.

**Circular speeds:** $v_1 = 7.7258\,\mathrm{km/s}$ as before, and $v_2 = \sqrt{\mu/26\,578.1} = 3.8726\,\mathrm{km/s}$.

**Transfer ellipse:** $a_t = (6678 + 26\,578.1)/2 = 16\,628.1\,\mathrm{km}$.

**Transfer speeds:** $v_p = 9.7676\,\mathrm{km/s}$ and $v_a = 2.4542\,\mathrm{km/s}$.

**Burns:** $\Delta v_1 = 9.7676 - 7.7258 = 2.0417\,\mathrm{km/s}$ and $\Delta v_2 = 3.8726 - 2.4542 = 1.4184\,\mathrm{km/s}$, for a total of $3.4602\,\mathrm{km/s}$.

**Time of flight:** $t = \pi\sqrt{16\,628.1^3/398\,600.4418} = 10\,670\,\mathrm{s} = 2.964\,\mathrm{h}$.

**Sanity check.** The target is lower than GEO, so the trip is shorter and cheaper than the last example. The ratios tell the same story: $26\,578/6678 = 3.98$ against $42\,164/6678 = 6.31$.
:::

::: key The Hohmann transfer
$$
\Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1+r_2}}-1\right), \quad
\Delta v_2 = \sqrt{\frac{\mu}{r_2}}\left(1-\sqrt{\frac{2r_1}{r_1+r_2}}\right), \quad
t = \pi\sqrt{\frac{a_t^3}{\mu}},\ a_t=\frac{r_1+r_2}{2}.
$$
Both burns are tangential. The transfer time is fixed by $r_1,r_2$ alone — half the period of the transfer ellipse. LEO ($6678\,\mathrm{km}$) to GEO: $\Delta v_1 \approx 2.43\,\mathrm{km/s}$, $\Delta v_2 \approx 1.47\,\mathrm{km/s}$, total $\approx 3.89\,\mathrm{km/s}$, about $5.3\,\mathrm{h}$.
:::

## What the cost depends on

Look at the two burn formulas again. If you divide both by $v_1 = \sqrt{\mu/r_1}$, what is left depends only on the **radius ratio** $R = r_2/r_1$:

$$
\frac{\Delta v_1 + \Delta v_2}{v_1} = \left(\sqrt{\frac{2R}{1+R}} - 1\right) + \frac{1}{\sqrt{R}}\left(1 - \sqrt{\frac{2}{1+R}}\right).
$$

So the total cost is "the starting circular speed, times a number that depends only on the ratio". Two consequences follow.

**The same ratio costs less farther out.** A transfer from GEO out to $6.31$ times GEO's radius (about $266\,000\,\mathrm{km}$) has the same ratio as LEO to GEO, so it costs the same multiple of its starting speed. But GEO's circular speed is only $3.0747\,\mathrm{km/s}$, not $7.7258$. The cost is $3.8926 \times 3.0747 / 7.7258 = 1.549\,\mathrm{km/s}$ — far less, for a much bigger orbit.

**For a fixed start, the cost does not keep rising forever.** With $r_1$ fixed, the total climbs as $R$ grows, reaches a peak of about $0.536\,v_1$ at $R \approx 15.58$, and then slowly *falls*. As $R$ goes to infinity it settles at $(\sqrt{2} - 1)\,v_1 \approx 0.414\,v_1$, which is the cost of escaping the planet completely. The **[[shape of that curve|hohmann-curve]]** is the doorway to the next lesson.

::: warning A larger target radius is not always more expensive
Total Δv tracks the *ratio* $r_2/r_1$ and scales with the starting speed $\sqrt{\mu/r_1}$. It does not track the size of $r_2$ by itself. A transfer to a far larger orbit can cost less than one to a smaller orbit, if it starts higher or its ratio is smaller.
:::

## Why it is optimal

### Among transfers that are tangent at both ends

First look only at transfers whose burns are tangential at both ends — burns that change speed, never direction, like the two above.

A tangential burn leaves the vehicle moving exactly sideways, so the burn point becomes an apsis (a periapsis or apoapsis) of the new orbit. A tangential departure from $r_1$ therefore puts one apsis of the transfer ellipse at $r_1$. A tangential arrival at $r_2$ puts the other apsis at $r_2$. Only one ellipse has its apsides at exactly $r_1$ and $r_2$: the Hohmann ellipse. So within this family there is nothing to choose. Hohmann is not "the best of many options" — it is the only option.

### Among all two-burn transfers

The real claim is stronger: Hohmann beats *every* two-burn transfer between the two circles, tangential or not.

The reason goes back to lesson 1's law of cosines. Suppose the departure burn leaves the vehicle moving partly outward, not purely sideways. Its **flight-path angle** — the tilt of the velocity away from sideways — is no longer zero. Then part of $\Delta v_1$ was spent turning the velocity, and that turning does nothing to help reach $r_2$ efficiently. It is exactly the $5^\circ$ example from lesson 1, which cost more than twice the plain speed change. The same penalty appears at arrival.

A full proof has to check every possible transfer orbit and every pair of burn points, and show that the tangent–tangent solution always wins. Such **[[proofs|optimality-proof]]** exist; Prussing's short proof of global optimality is a complete one. Lesson 4 gives you a numerical look at one slice of the result: keep the departure tangential, move the arrival point away from apoapsis, and the total Δv only ever goes up.

### What "optimal" does and does not cover

The claim has a precise scope, and the rest of the module lives at its edges.

- It is the minimum among **two-burn** transfers. Allow a third burn, and for a large enough ratio $r_2/r_1$ a cheaper route exists: the bi-elliptic transfer of lesson 3.
- It is for two **circular, coplanar** orbits. Add a change of orbit plane, and how best to split that change between the two burns is a separate problem, worked out in lesson 5.
- It says nothing about **when** you arrive. Lesson 4's one-tangent transfers spend extra Δv to buy back control of the arrival time.

::: key Hohmann optimality
Among all two-impulse transfers between two coplanar circular orbits, the Hohmann transfer has the minimum total Δv, for every radius ratio. It is beaten only by adding a third impulse (bi-elliptic, lesson 3); a plane change or a required arrival time are different problems.
:::

::: warning Tangential does not mean "forward"
Both burns are prograde in these examples because you are raising the orbit. A Hohmann transfer used to *lower* an orbit is exactly as tangential — both burns point **retrograde** (backward) instead, slowing the vehicle at each apsis. Tangency (thrust along the velocity line, zero flight-path angle) is what makes the transfer optimal. Whether each burn points forward or backward depends only on whether you are climbing or descending.
:::

## Check yourself

::: check
Without computing anything, explain why both Hohmann burns are purely tangential, and why that is the source of the transfer's efficiency.
:::

::: answer
The transfer ellipse is chosen with its periapsis exactly at $r_1$ and its apoapsis exactly at $r_2$. At periapsis and apoapsis, any orbit's velocity points exactly sideways — zero flight-path angle — which is the same direction as the circular velocity there.

Because the directions already agree at both burn points, neither burn has to turn the velocity vector. By the law of cosines, a burn that only changes the size of the velocity ($\theta = 0$) is always the cheapest way to get a given change in speed. Putting both burns where the orbit already points the right way keeps the total Δv as low as it can be.
:::

::: check
Compute the two Hohmann burns and the time of flight from a $500\,\mathrm{km}$ circular orbit ($r_1 = 6878.137\,\mathrm{km}$) to a $1500\,\mathrm{km}$ circular orbit ($r_2 = 7878.137\,\mathrm{km}$).
:::

::: answer
**Circular speeds:** $v_1 = \sqrt{398\,600.4418/6878.137} = 7.6126\,\mathrm{km/s}$ and $v_2 = \sqrt{398\,600.4418/7878.137} = 7.1131\,\mathrm{km/s}$.

**Transfer ellipse:** $a_t = (6878.137 + 7878.137)/2 = 7378.137\,\mathrm{km}$.

**Transfer speeds:** $v_p = \sqrt{398\,600.4418\,(2/6878.137 - 1/7378.137)} = 7.8663\,\mathrm{km/s}$ and $v_a = \sqrt{398\,600.4418\,(2/7878.137 - 1/7378.137)} = 6.8678\,\mathrm{km/s}$.

**Burns:** $\Delta v_1 = 7.8663 - 7.6126 = 0.2537\,\mathrm{km/s}$ and $\Delta v_2 = 7.1131 - 6.8678 = 0.2452\,\mathrm{km/s}$, total $0.4989\,\mathrm{km/s}$.

**Time of flight:** $t = \pi\sqrt{7378.137^3/398\,600.4418} = 3153.6\,\mathrm{s} = 52.6\,\mathrm{min}$.

Sanity check: the two orbits are close together, so the two burns are small and nearly equal, and the trip is about half of a roughly 100-minute orbit.
:::

::: check
A colleague proposes a transfer between the same two circular orbits that burns non-tangentially at departure, arguing that a cleverly chosen transfer ellipse might reach $r_2$ more cheaply. What is wrong with the plan, in general?
:::

::: answer
It cannot beat the Hohmann transfer, and in general it will cost more. A non-tangential departure gives the transfer orbit a nonzero flight-path angle at $r_1$. So the departure burn had to turn the velocity as well as change its speed, and by the law of cosines that turning adds to $|\Delta\mathbf{v}|$.

The only way to come out ahead would be for the arrival burn to save more than the departure burn lost. The global optimality result rules that out for any two-burn transfer between circular, coplanar orbits. The total goes up, not down.
:::

::: check
Two transfers start from the same $r_1$. One has $r_2/r_1 = 4$, the other $r_2/r_1 = 6.31$ (the LEO-to-GEO ratio). Can you say which needs more total Δv without computing both? What would you need to check, and would the answer change if the two started from different radii?
:::

::: answer
Divide the total by $v_1 = \sqrt{\mu/r_1}$ and what is left depends only on the ratio $R = r_2/r_1$. Since both transfers start from the same $r_1$, they share the same $v_1$, so comparing them means comparing that ratio function at $R = 4$ and $R = 6.31$.

The ratio function rises with $R$ up to its peak at $R \approx 15.58$, then slowly falls. Both $4$ and $6.31$ are below the peak, so the transfer with ratio $6.31$ costs more. (The numbers agree: about $0.449\,v_1$ against $0.504\,v_1$.) What you have to check is which side of $15.58$ the ratios fall on — above it, a larger ratio would actually cost *less*.

If the two transfers started from different radii, the ratio alone would not settle it, because each total is multiplied by its own $v_1$. A transfer starting farther out has a smaller $v_1$ and can cost less even with a larger ratio.
:::

::: check
Why does the Hohmann transfer give you no control over the arrival time, and what does that cost you if you need one?
:::

::: answer
Once $r_1$ and $r_2$ are fixed, tangency at both ends picks out exactly one transfer ellipse. That fixes $a_t$, and so it fixes the time of flight $t = \pi\sqrt{a_t^3/\mu}$. There is no setting left to turn.

If a mission must arrive at a particular time — to meet a moving target, hit a launch window, or line up for rendezvous — a plain Hohmann transfer cannot be tuned to do it. You have to give up tangency at one end and accept extra Δv. That is the one-tangent transfer of lesson 4.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $a_t = (r_1+r_2)/2$ | Semi-major axis of the only ellipse tangent to both circular orbits |
| $\Delta v_1 = \sqrt{\mu/r_1}\left(\sqrt{2r_2/(r_1+r_2)}-1\right)$ | Departure burn, tangential |
| $\Delta v_2 = \sqrt{\mu/r_2}\left(1-\sqrt{2r_1/(r_1+r_2)}\right)$ | Arrival burn, tangential |
| $t = \pi\sqrt{a_t^3/\mu}$ | Time of flight: half the transfer ellipse's period, no free setting |
| LEO ($6678\,\mathrm{km}$) $\to$ GEO | $\Delta v_1=2.4258$, $\Delta v_2=1.4668$, total $3.8926\,\mathrm{km/s}$, $t=5.275\,\mathrm{h}$ |
| Cost $= v_1 \times f(r_2/r_1)$ | Peaks near $r_2/r_1 \approx 15.58$, then falls toward $(\sqrt2-1)v_1$ |
| Optimality | Minimum-Δv two-impulse transfer between coplanar circular orbits, for every radius ratio |
| Scope | Beaten only by a third impulse (lesson 3); plane changes (lesson 5) and arrival-time control (lesson 4) are separate problems |

The next lesson asks the question this one set aside: if a third burn is allowed, can it ever beat Hohmann? Yes — but only past a particular radius ratio, and the saving is small next to the time it costs.

::: context hohmann-history An engineer who planned trips to the planets
Walter Hohmann was a German civil engineer who worked for the city of Essen and studied spaceflight as a hobby. In his 1925 book *Die Erreichbarkeit der Himmelskörper* ("The Attainability of the Celestial Bodies") he worked out, by hand, how a spacecraft could travel between planets on the least fuel.

No rocket had yet reached space, and none would for about two more decades. His transfer ellipse is still the first thing a mission designer draws today.
:::

::: context coplanar Same plane
**Coplanar** means "in the same plane". Picture two hula hoops lying flat on the same floor: coplanar. Tilt one of them and they are not.

Every orbit lies in a flat plane through the planet's center. Two orbits are coplanar when those planes are the same. Real launches often leave a satellite in a tilted plane — from Florida, typically about $28.5^\circ$ from the equator — and fixing that tilt costs extra Δv. Lesson 5 prices it.
:::

::: context tangent-picture The transfer, drawn to scale
The transfer ellipse kisses the inner circle at one point and the outer circle at the opposite point. At both points it runs exactly alongside the circle, so each burn only has to change speed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="240" cy="105" r="90" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="240" cy="105" r="30" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="240" cy="105" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M270,105 A60,51.96 0 0,0 150,105" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M150,105 A60,51.96 0 0,0 270,105" fill="none" stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="4 4"/>
  <circle cx="270" cy="105" r="5" fill="#b4232c"/>
  <circle cx="150" cy="105" r="5" fill="#b4232c"/>
  <text x="280" y="122" font-size="13" fill="#b4232c">Δv₁</text>
  <text x="128" y="125" font-size="13" fill="#b4232c">Δv₂</text>
  <text x="10" y="30" font-size="12" fill="#1f2a44">inner circle r₁</text>
  <text x="10" y="48" font-size="12" fill="#1f2a44">outer circle r₂ = 3r₁</text>
  <text x="10" y="66" font-size="12" fill="#1d6fd1">transfer: half an ellipse</text>
  <text x="10" y="190" font-size="12" fill="#1f2a44">both burns along the direction of travel</text>
</svg>
```

The picture is drawn to scale for $r_2 = 3r_1$. The solid half of the ellipse is the path actually flown; the dashed half is never used. For LEO to GEO the inner circle would be about six times smaller than the outer one.
:::

::: context geostationary Why 42,164 km
A satellite in **geostationary orbit** (GEO) circles once per sidereal day — about 23 hours 56 minutes, the time Earth takes to spin once relative to the stars. Over the equator it keeps pace with the ground below and seems to hang still in the sky, so a dish on your roof can point at it without moving.

Kepler's third law turns that period into a radius: about $42\,164\,\mathrm{km}$ from Earth's center, or about $35\,786\,\mathrm{km}$ above the equator.
:::

::: context apogee-kick Who does which burn
In a typical GEO launch the rocket's upper stage does the first burn and drops the satellite on the transfer ellipse, called a **geostationary transfer orbit** (GTO). The satellite does the second burn itself at apogee — the apoapsis of an Earth orbit — hence "apogee kick".

Older satellites carried a small solid rocket motor for this one job. Many modern ones use their own liquid engine over several apogee passes, or slow electric thrusters over months.
:::

::: context gps-orbit The GPS orbit
GPS satellites fly at about $20\,200\,\mathrm{km}$ altitude, on orbits tilted about $55^\circ$ to the equator. Each one circles Earth twice per sidereal day, so the pattern of satellites overhead repeats every day. That repeat made the system easier to plan and monitor when it was designed.

A real GPS launch also has to change plane, which this lesson's coplanar example leaves out.
:::

::: context hohmann-curve The cost curve has a hump
Total Hohmann Δv, divided by the starting circular speed $v_1$, plotted against the radius ratio $R = r_2/r_1$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="123.3" x2="340" y2="123.3" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="50" y1="76.7" x2="340" y2="76.7" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="50" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,170.0 52.4,127.6 54.7,103.6 57.1,88.4 59.5,78.1 61.9,70.7 64.2,65.3 66.6,61.2 69.0,58.0 73.7,53.5 83.2,48.6 92.7,46.4 102.2,45.4 111.7,44.9 121.2,44.9 130.7,45.0 140.2,45.2 149.7,45.5 159.2,45.9 168.6,46.2 178.1,46.6 187.6,46.9 197.1,47.3 206.6,47.6 216.1,48.0 225.6,48.3 235.1,48.7 244.6,49.0 254.1,49.3 263.6,49.6 273.1,49.9 282.5,50.1 292.0,50.4 301.5,50.7 311.0,50.9 320.5,51.2 330.0,51.4"/>
  <circle cx="119.2" cy="44.9" r="4" fill="#b4232c"/>
  <text x="124" y="66" font-size="12" fill="#b4232c">peak 0.536 at R ≈ 15.6</text>
  <circle cx="75.2" cy="52.4" r="3.5" fill="#1f2a44"/>
  <text x="80" y="100" font-size="12" fill="#1f2a44">LEO→GEO, R = 6.31</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="185">1</text><text x="140.2" y="185">20</text><text x="235.1" y="185">40</text><text x="330" y="185">60</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="127">0.2</text><text x="45" y="81">0.4</text><text x="45" y="34">0.6</text>
  </g>
  <text x="195" y="203" font-size="12" fill="#1f2a44" text-anchor="middle">radius ratio R = r₂ / r₁</text>
</svg>
```

The hump is gentle, but it is real. Past it, raising the target orbit makes a Hohmann transfer *cheaper*, because the arrival burn at the far end keeps shrinking. Something odd is going on out there, and lesson 3 exploits it.
:::

::: context optimality-proof Proving "nothing does better"
Showing that one transfer works is easy. Showing that no other two-burn transfer can ever do better is much harder, because there are infinitely many candidates: every possible transfer orbit and every pair of burn points.

Mathematicians attacked it with optimal-control theory, notably Derek Lawden's "primer vector" method, which gives conditions any fuel-optimal trajectory must satisfy. John Prussing later published a short proof, in 1992, that Hohmann is the global optimum among two-impulse transfers between circular coplanar orbits. The same primer-vector tools come back in advanced trajectory design.
:::
