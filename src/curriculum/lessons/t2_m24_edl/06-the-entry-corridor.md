---
id: l06-the-entry-corridor
title: "The entry corridor: undershoot and overshoot"
minutes: 18
covers:
  - "the entry corridor: undershoot and overshoot boundaries"
---

Throw a flat stone at a pond. Throw it too flat and it skips off the surface and flies on. Throw it too steeply and it plunges straight in with a splash. Only in between does it do what you wanted. Coming home from space has the same two ways to go wrong, except that "skipping off" can mean drifting back into space and "plunging in" can mean crushing the crew or burning through the heat shield.

Every entry vehicle is aimed. Before it reaches the entry interface, mission design picks a target **flight-path angle**, and navigation works to deliver the vehicle within some tolerance of it. That tolerance cannot be loose, because there is a failure on each side.

- **Too shallow**, and the vehicle never slows enough to stay down. It **[[skips back out|skip-out]]** past the entry interface, on a path that may not bring it back for a very long time, if ever.
- **Too steep**, and the vehicle drives itself past the peak deceleration or peak heat rate its structure and heat shield can survive.

The band of angles between the two failures is the **entry corridor**. This lesson computes its width, in degrees, for a stated vehicle and a stated pair of limits. Then it shows that width shrinking toward nothing as the entry speed climbs.

## The two walls

### The overshoot wall: too shallow

The **overshoot boundary** is the shallowest entry angle for which the vehicle still gets **captured**. Captured means it loses enough energy on its first pass through the atmosphere that it does not climb back out above the $120\,\mathrm{km}$ interface.

Shallower than this, the vehicle skips. It dips into the air, loses some energy, and comes back out above the interface. The entry it was supposed to fly is delayed, or lost entirely.

What makes a vehicle skip? Recall lesson 3's equation for how the flight-path angle $\gamma$ changes:

$$
\dot\gamma = \cos\gamma\left(\frac{v}{r} - \frac{g}{v}\right).
$$

Read $\dot\gamma$ as "gamma-dot", the rate at which the path tips up or down. Gravity pulls the path downward; that is the $-g/v$ piece. But a vehicle moving fast around a curved planet has its path "held up" by its own speed; that is the $+v/r$ piece, called **[[centrifugal relief|centrifugal-relief]]**. When the relief term wins, $\dot\gamma$ turns positive and the path starts to curve back upward. If drag has not slowed the vehicle enough by then, it climbs back out.

This is why lesson 3's spherical, non-rotating numerical model is the right tool. A flat-planet model or the Allen-Eggers closed form has no $v/r$ term at all, so it cannot represent a skip.

### The undershoot wall: too steep

The **undershoot boundary** is the steepest entry angle before a stated structural or thermal limit is exceeded. This lesson uses two limits together, because either one can be the one that stops you, depending on the entry speed:

- a peak deceleration limit of **[[10 g₀|g-limit]]**, typical of a crewed vehicle's short-duration tolerance;
- a peak heat-rate limit of $300\,\mathrm{W/cm^2}$, typical of an ablative heat shield sized for that flux, in line with the numbers from lesson 4.

The limit reached at the *shallower* angle is the one that binds. Every angle between the overshoot and undershoot walls captures the vehicle without breaking either limit. Every angle outside fails one way or the other.

::: key The entry corridor
**Undershoot** (too steep): peak deceleration and peak heating exceed structural or crew limits. **Overshoot** (too shallow): not enough deceleration, so the vehicle skips back out of the atmosphere.

$$
\text{corridor width} = |\gamma_{\text{undershoot}}| - |\gamma_{\text{overshoot}}|.
$$

The corridor width is set by the available $L/D$ (lift-to-drag ratio): a ballistic vehicle ($L/D = 0$) gets only the narrow corridor computed in this lesson, and lift, pointed well, buys room back — lesson 7 puts numbers on it.
:::

## The demonstration vehicle

"Corridor width" only means something for a specific vehicle and specific limits. So every number in this lesson is for one stated case:

- ballistic coefficient $\beta = 200\,\mathrm{kg/m^2}$;
- nose radius $R_n = 0.5\,\mathrm{m}$;
- limits of $10\,g_0$ peak deceleration and $300\,\mathrm{W/cm^2}$ peak heat rate;
- no lift.

For each entry speed $v_E$, the walls are found like this.

- **Overshoot wall:** by **[[bisection|bisection]]**. Start with one angle that skips and one that is captured. Try the angle halfway between, keep whichever half still contains the switch, and repeat until the two angles agree to a tiny fraction of a degree.
- **Undershoot candidates:** by root-finding. Search for the angle where the numerically integrated peak deceleration is exactly $10\,g_0$, and separately for the angle where the peak heat rate is exactly $300\,\mathrm{W/cm^2}$.

This is the same machinery lesson 3 checked and lesson 5 used, now answering a new question.

## Corridor width shrinks as entry speed rises

| $v_E$ (m/s) | overshoot wall | $g$-limit angle | $q$-limit angle | binding limit | corridor width |
| --- | --- | --- | --- | --- | --- |
| $7800$ | none (below circular speed) | $-2.60^\circ$ | $-10.32^\circ$ | $g$-limit | open |
| $9000$ | $-3.30^\circ$ | $-4.40^\circ$ | $-5.82^\circ$ | $g$-limit | $1.10^\circ$ |
| $10{,}000$ | $-4.43^\circ$ | $-5.19^\circ$ | $-5.20^\circ$ | $g$-limit | $0.77^\circ$ |
| $11{,}000$ | $-5.16^\circ$ | $-5.71^\circ$ | $-5.25^\circ$ | $q$-limit | $0.086^\circ$ |

Let's read the width at $9000\,\mathrm{m/s}$ to see how the columns fit. The overshoot wall is at $-3.30^\circ$. The $g$-limit is reached at $-4.40^\circ$ and the $q$-limit only at $-5.82^\circ$. The $g$-limit comes first (it is shallower), so it binds. The width is $4.40 - 3.30 = 1.10^\circ$.

Each wall was cross-checked. At every $g$-limit angle the peak deceleration comes out at $10.00\,g_0$, and at every $q$-limit angle the peak heat rate comes out at $300.0\,\mathrm{W/cm^2}$. Tightening the integration and root-finding tolerances does not change the widths.

The trend down the table is the headline. The corridor collapses from a little over a degree at $9000\,\mathrm{m/s}$ to less than a tenth of a degree at $11{,}000\,\mathrm{m/s}$ — about the angle a coin $1.5\,\mathrm{cm}$ across makes when seen from $10\,\mathrm{m}$ away.

And the *reason* the steep wall stops you changes along the way. At $9000\,\mathrm{m/s}$ the deceleration limit binds. At $10{,}000\,\mathrm{m/s}$ the two limits are reached at almost the same angle, $-5.19^\circ$ against $-5.20^\circ$. By $11{,}000\,\mathrm{m/s}$ the heat-rate limit binds, by a wide margin. That switch happens because **[[heating grows with the cube of speed|walls-picture]]** while deceleration grows only with its square. A faster entry reaches the thermal limit at a shallower angle than the structural one.

### Why the 7800 m/s row has no overshoot wall

The **[[local circular speed|circular-speed]]** at the $120\,\mathrm{km}$ interface is

$$
v_{\text{circ}} = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{3.986\times10^{14}}{6.498\times10^{6}}} = 7832\ \mathrm{m/s},
$$

using Earth's $\mu$ (read "mu", the gravitational parameter) and the interface radius from lesson 1, $r = 6378.137 + 120 = 6498.137\,\mathrm{km}$.

At or below that speed, a grazing entry is already at the highest point its orbit can reach. Drag only ever removes energy, so it can never climb back above where it started. A steeper entry at that speed would, with no air at all, swing back up — but it dives deep into thick air on the way and loses far more energy. The numerical model confirms it: at $7832\,\mathrm{m/s}$ no angle skips, even one as shallow as $-0.01^\circ$. The first skips appear at about $7835$–$7838\,\mathrm{m/s}$, a few meters per second above circular speed.

Below that threshold the corridor is one-sided: only the steep wall exists. That is part of why a routine return from low Earth orbit, entering near circular speed, has always been treated as a far more forgiving entry-angle problem than a lunar or Mars return.

::: example Reading one row of the table
Take $v_E = 9000\,\mathrm{m/s}$.

**The shallow side.** Fly shallower than $-3.30^\circ$ and the vehicle skips back out past $120\,\mathrm{km}$ instead of staying down.

**The steep side.** Fly steeper than $-4.40^\circ$ and peak deceleration goes over $10\,g_0$. Check it directly: at $\gamma_E = -4.40^\circ$ the numerical model gives a peak deceleration of $10.0\,g_0$. At that same angle the peak heat rate is only $225\,\mathrm{W/cm^2}$, well under the $300\,\mathrm{W/cm^2}$ limit. So the $g$-limit, not the heat-rate limit (which would not be reached until $-5.82^\circ$), is what binds here.

**The width.** $4.40 - 3.30 = 1.10^\circ$ of flyable angle.

**Spot checks inside.** Barely inside the shallow wall, at $-3.32^\circ$, the vehicle is captured with $8.4\,g_0$ and $111\,\mathrm{W/cm^2}$ — under both limits. At the middle of the corridor, $-3.85^\circ$, it sees $7.5\,g_0$ and $178\,\mathrm{W/cm^2}$, comfortably under both.

**Does it make sense?** Both spot checks land between the walls and under both limits, so the corridor is a real range of angles, not a knife edge.
:::

## Why the corridor narrows: centrifugal relief again

The Allen-Eggers closed form of lesson 2 says peak deceleration at a *fixed* entry angle grows with the square of entry speed: $a_{\max}\propto v_E^2$. So you would expect a faster vehicle at the same angle to decelerate harder. Near the corridor, that expectation is not only off in size, as lesson 3 found. It can point the wrong way.

::: example Faster entry, weaker peak deceleration, same angle
Hold $\gamma_E = -4.5^\circ$ fixed and raise the entry speed, using the numerical model.

- At $v_E = 9000\,\mathrm{m/s}$, peak deceleration is $10.53\,g_0$.
- At $v_E = 10{,}000\,\mathrm{m/s}$ — faster — it *falls* to $7.57\,g_0$.
- At $v_E = 11{,}000\,\mathrm{m/s}$ the vehicle is not captured at all. It skips.

**What the closed form would say.** Going from $9000$ to $10{,}000\,\mathrm{m/s}$ should multiply peak deceleration by

$$
\left(\frac{10{,}000}{9000}\right)^2 = 1.23.
$$

That predicts about $13\,g_0$, not $7.57\,g_0$. The closed form gets even the direction of the change wrong.
:::

The cause is the same pair of terms inside $\dot\gamma$. Compare their sizes by dividing one by the other:

$$
\frac{v/r}{g/v} = \frac{v^2}{g\,r}.
$$

This ratio grows as the *square* of the speed. At the interface it is exactly $1$ at circular speed, $7832\,\mathrm{m/s}$. It is $1.32$ at $9000\,\mathrm{m/s}$, $1.63$ at $10{,}000\,\mathrm{m/s}$, and $1.97$ at $11{,}000\,\mathrm{m/s}$. So at high speed the relief term overpowers gravity's pull much more strongly, and the path resists steepening.

Put in plain words: a $-4.5^\circ$ entry at $9000\,\mathrm{m/s}$ is a real dive. The same $-4.5^\circ$ at $10{,}000$ or $11{,}000\,\mathrm{m/s}$ is a much gentler cut compared with how much orbital energy the vehicle carries. Centrifugal relief holds it closer to a graze than a dive.

That is why the undershoot wall in the table gets *steeper*, not shallower, as $v_E$ rises. Reaching the same $10\,g_0$ at higher energy takes a steeper angle, because the vehicle is harder to make dig in. The overshoot wall steepens for the same reason, by a similar amount. The corridor shrinks because the two walls move in the same direction by *different* amounts — not because one wall stands still while the other moves.

::: warning The Allen-Eggers closed form cannot size a corridor
Lesson 3 showed the closed form's error becomes large in exactly the shallow-entry range where corridor walls live. The fixed-angle example above shows it can get the *direction* of a trend wrong there, not only its size. Size corridors with the numerical model from the start. The closed form is still useful for the intuition it built in lessons 2 through 5, not for the final number here.
:::

## What is chosen and what is not

The limits here — $10\,g_0$ and $300\,\mathrm{W/cm^2}$ — are design points for this demonstration, not constants of nature. A different crew limit or a different heat shield material moves the undershoot wall, and so the width. The narrowing trend with entry speed does not depend on the particular numbers.

Two things are *not* free choices:

- where the overshoot wall starts to exist, at local circular speed, which comes from orbital mechanics, not from the vehicle;
- the direction in which the corridor narrows. Faster entries carry more energy to shed, and every mechanism in this module so far — deceleration, heating, and now centrifugal relief — responds to that extra energy by squeezing the range of angles that give both capture and survival.

## Check yourself

::: check
Define the overshoot boundary and the undershoot boundary of an entry corridor, one sentence each. What physical mechanism sets each one?
:::

::: answer
The **overshoot boundary** is the shallowest entry angle that still ends in capture instead of skipping back out past the entry interface. It is set by the contest between drag slowing the vehicle and the centrifugal-relief term $v/r$ in $\dot\gamma$, which resists the path steepening.

The **undershoot boundary** is the steepest entry angle before a stated structural limit (peak deceleration) or thermal limit (peak heat rate) is exceeded. It is set by whichever of those two limits is reached at the shallower angle for the entry speed in question.
:::

::: check
For the demonstration vehicle at $v_E = 11{,}000\,\mathrm{m/s}$, which limit binds the undershoot wall? Why is that different from $v_E = 9000\,\mathrm{m/s}$?
:::

::: answer
At $11{,}000\,\mathrm{m/s}$ the heat-rate limit binds: it is reached at $-5.25^\circ$, before peak deceleration reaches $10\,g_0$ (which would take $-5.71^\circ$).

At $9000\,\mathrm{m/s}$ the deceleration limit binds instead: $-4.40^\circ$ for the $g$-limit against $-5.82^\circ$ for the heat-rate limit.

The switch happens because peak heat rate grows roughly with the cube of entry speed while peak deceleration grows with its square. As speed rises, the thermal limit tightens faster than the structural one and eventually overtakes it. At $10{,}000\,\mathrm{m/s}$ the two are almost tied.
:::

::: check
Why does an entry at $7800\,\mathrm{m/s}$ have no overshoot wall at all in this model, while a lunar return at $11{,}000\,\mathrm{m/s}$ has a very real one?
:::

::: answer
Local circular speed at the $120\,\mathrm{km}$ interface is about $7832\,\mathrm{m/s}$. At $7800\,\mathrm{m/s}$, a grazing entry is already at the top of its orbit, and drag only removes energy, so it cannot climb back above the interface. Steeper entries dive into thick air and lose even more. No angle skips.

A lunar return arrives far above circular speed. It carries enough energy that a shallow, brief pass through the atmosphere can leave it on a path that climbs back out. That skip is exactly what defines a real overshoot wall.
:::

::: check
A fixed entry angle of $-4.5^\circ$ gives a *lower* peak deceleration at $10{,}000\,\mathrm{m/s}$ than at $9000\,\mathrm{m/s}$, although the closed form says peak deceleration grows as $v_E^2$. Explain why, without using the closed form.
:::

::: answer
The closed form assumes the flight-path angle stays frozen at its entry value, which lesson 3 showed fails badly for shallow entries.

In the full model, $\dot\gamma$ contains the centrifugal-relief term $v/r$, which competes with gravity's $g/v$. Their ratio, $v^2/(gr)$, grows as the square of the speed ($1.32$ at $9000\,\mathrm{m/s}$, $1.63$ at $10{,}000\,\mathrm{m/s}$). So at higher speed the path resists steepening more strongly.

The same nominal angle therefore behaves more like a graze than a dive. The vehicle stays in thinner air, and it decelerates less, not more.
:::

::: check
At $v_E = 11{,}000\,\mathrm{m/s}$ the heat-rate limit binds. A mission asks whether a better heat shield — raising the limit from $300$ to $400\,\mathrm{W/cm^2}$ — would widen the corridor. Reason it out without recomputing the wall.
:::

::: answer
Raising the heat-rate limit lets the vehicle fly steeper before the (now higher) thermal limit is reached. That moves the undershoot wall steeper and widens the corridor on the steep side.

But it helps only until the *other* limit takes over. The $10\,g_0$ deceleration limit is reached at $-5.71^\circ$ at this speed (the $g$-limit column of the table). Once the heat-rate wall moves past that, the $g$-limit becomes the binding constraint, and a still-better heat shield buys nothing more.

So the most the better shield can do is widen the corridor from $5.25 - 5.16 = 0.09^\circ$ to at most $5.71 - 5.16 = 0.55^\circ$.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Overshoot boundary | Shallowest entry angle that is still captured; shallower skips back out past the interface |
| Undershoot boundary | Steepest entry angle before a stated $g$-limit or heat-rate limit is exceeded |
| Corridor width | $\lvert\gamma_{\text{undershoot}}\rvert - \lvert\gamma_{\text{overshoot}}\rvert$; set by the available $L/D$ |
| Demonstration vehicle | $\beta = 200\,\mathrm{kg/m^2}$, $R_n = 0.5\,\mathrm{m}$, no lift; limits $10\,g_0$ and $300\,\mathrm{W/cm^2}$ |
| Width at $9000$ / $10{,}000$ / $11{,}000\,\mathrm{m/s}$ | $1.10^\circ$ / $0.77^\circ$ / $0.086^\circ$ — shrinks sharply as entry speed rises |
| Binding limit shifts with speed | $g$-limit at lower speeds, heat-rate limit at higher, since heating grows as $v^3$ and deceleration as $v^2$ |
| Local circular speed at $120\,\mathrm{km}$ | $7832\,\mathrm{m/s}$ — at or below it, no overshoot wall exists at any angle |
| $\dot\gamma = \cos\gamma\,(v/r - g/v)$ | Centrifugal relief versus gravity; their ratio $v^2/(gr)$ grows as $v^2$ |
| Why the corridor narrows | Both walls steepen as entry speed rises, by different amounts, and close in on each other |

The next lesson gives the vehicle a way to fight this narrowing — lift — and shows, with the same numerical model, how much room a modest lift-to-drag ratio buys back. It also shows the other way to shed energy when the corridor is tight: skipping on purpose.

::: context skip-out Three ways to meet the air
The same vehicle, aimed three ways. Too shallow, and it dips into the atmosphere and bounces back out. Too steep, and it slams into dense air hard. In between, it is captured and comes down. (Not to scale; real angles are a few degrees.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="60" width="340" height="125" fill="#8fb8f0" fill-opacity="0.3"/>
  <line x1="10" y1="60" x2="350" y2="60" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="250" y="55" font-size="11" text-anchor="end" fill="#6c7a93">entry interface</text>
  <line x1="10" y1="185" x2="350" y2="185" stroke="#1f2a44" stroke-width="2"/>
  <path d="M20,30 Q170,170 330,20" fill="none" stroke="#6c7a93" stroke-width="2.5"/>
  <path d="M20,30 Q200,70 300,185" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M20,30 Q60,120 110,185" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="20" cy="30" r="5" fill="#1f2a44"/>
  <text x="345" y="100" font-size="11" text-anchor="end" fill="#6c7a93">too shallow: skips</text>
  <text x="150" y="150" font-size="11" fill="#1d6fd1">in the corridor</text>
  <text x="118" y="172" font-size="11" fill="#b4232c">too steep</text>
</svg>
```

A deliberate, controlled skip is a different thing: Orion used one on Artemis I in 2022 to stretch its landing range. Lesson 7 explains how.
:::

::: context centrifugal-relief Why speed holds the path up
Swing a ball on a string in a circle. The faster it goes, the harder it pulls outward. A vehicle racing around the Earth feels the same thing: its sideways speed tends to carry it "outward" away from the curving ground, while gravity pulls it in. At exactly circular speed the two balance, which is what an orbit is. Faster than that, the outward tendency wins and the path bends *up*, away from the planet. That is the relief. "Centrifugal" is the name for this outward tendency as felt from riding along; from outside, it is the vehicle's momentum trying to go straight while the ground curves away beneath it.
:::

::: context g-limit What 10 g means for people
At $10\,g_0$ everything in the cabin, including the crew, weighs ten times its normal weight: a $70\,\mathrm{kg}$ astronaut is pressed into the seat with about $6900\,\mathrm{N}$, the weight of about $700\,\mathrm{kg}$ on Earth. Trained crews lying on their backs can take that for a short time. Normal capsule returns from low Earth orbit keep crews to roughly $3$–$5\,g_0$. Soyuz capsules that have fallen back to an unguided ballistic entry have put crews through roughly $8\,g_0$ — survivable, but a reason to stay inside the corridor.
:::

::: context bisection Guessing by halves
Bisection is the "guess my number" game. Someone thinks of a number between 1 and 100; you guess 50, hear "lower", guess 25, and so on. Each guess halves the range that can hold the answer. Here the "answer" is the angle where skip switches to capture. Start with a $10^\circ$ range; after $20$ halvings the range is $10/2^{20}$, about ten millionths of a degree. It is slow compared with smarter methods, but it cannot miss, as long as one end skips and the other does not.
:::

::: context walls-picture The walls, drawn
Here are the three candidate walls for the demonstration vehicle, computed from $8500$ to $11{,}000\,\mathrm{m/s}$. Steeper angles are lower on the picture. The shaded band is the corridor: below the overshoot line and above whichever limit line comes first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polygon points="60.0,33.3 114.0,59.0 168.0,78.0 222.0,92.8 276.0,104.8 330.0,114.9 330.0,117.4 276.0,115.9 222.0,115.8 168.0,105.2 114.0,91.9 60.0,74.7" fill="#8fb8f0" fill-opacity="0.6"/>
  <line x1="60" y1="20" x2="60" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="24">−2°</text><text x="55" y="84">−4°</text><text x="55" y="144">−6°</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="185">8.5</text><text x="168" y="185">9.5</text><text x="276" y="185">10.5</text><text x="330" y="185">11</text>
  </g>
  <text x="200" y="205" font-size="11" text-anchor="middle" fill="#1f2a44">entry speed, km/s</text>
  <polyline points="60.0,33.3 114.0,59.0 168.0,78.0 222.0,92.8 276.0,104.8 330.0,114.9" fill="none" stroke="#6c7a93" stroke-width="2.5"/>
  <polyline points="60.0,74.7 114.0,91.9 168.0,105.2 222.0,115.8 276.0,124.3 330.0,131.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="60.0,167.4 114.0,134.6 168.0,120.3 222.0,115.9 276.0,115.9 330.0,117.4" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="150" y="58" font-size="11" fill="#6c7a93">overshoot (skip)</text>
  <text x="250" y="142" font-size="11" fill="#1d6fd1">10 g limit</text>
  <text x="120" y="150" font-size="11" fill="#b4232c">300 W/cm² limit</text>
</svg>
```

The blue $g$-limit line is shallower on the left, so it binds; the red heat-rate line crosses it near $10\,\mathrm{km/s}$ and binds from there on. By $11\,\mathrm{km/s}$ the band has pinched almost shut.
:::

::: context circular-speed The speed of a perfect circle
Circular speed is how fast you must go sideways at a given height for gravity to bend your path into a perfect circle around the planet. Setting the pull of gravity, $\mu/r^2$, equal to the acceleration needed to go around a circle, $v^2/r$, gives $v = \sqrt{\mu/r}$. At the $120\,\mathrm{km}$ interface that is $7832\,\mathrm{m/s}$. Returning from the International Space Station you arrive a little below it; returning from the Moon you arrive near $11\,\mathrm{km/s}$, close to escape speed, with nearly twice the kinetic energy per kilogram to get rid of.
:::
