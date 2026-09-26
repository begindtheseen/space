---
id: l03-bielliptic-transfer
title: The bi-elliptic transfer and the crossover ratio
minutes: 20
covers:
  - bi-elliptic transfer and the crossover ratio
---

Toss a ball straight up. Near the top of its flight it almost stops. If a friend on a balcony tapped it sideways at that moment, even a gentle tap would change where it lands by a lot — because the ball was barely moving, the tap was a big change *compared with* its speed. Tapping it that hard as it left your hand would hardly matter.

That is the idea behind this lesson. The last lesson showed that no two-burn transfer beats Hohmann between two circular orbits in the same plane. It did not show that no transfer at all beats it. Allow a third burn, and for a large enough radius ratio a strange-looking route wins: shoot far *past* the target orbit, coast out to some enormous distance, make a small adjustment up there where the vehicle is crawling, then fall back and settle into the target. This is the **bi-elliptic transfer** — "bi-elliptic" because it uses two half-ellipses.

The detour costs propellant of its own, so it only pays when the direct route is expensive enough. This lesson works out the three-burn cost, finds exactly where the trade turns in its favor, and is honest about what it costs in time — which is why it is almost never flown.

## Where a burn buys the most

Before building the transfer, here is the effect that makes it work.

A spacecraft's **specific energy** $\varepsilon$ (Greek "epsilon") is its orbital energy per kilogram, $\varepsilon = v^2/2 - \mu/r$, from the last module. The first part is energy of motion; the second is energy of height in the gravity well. A bigger orbit has a bigger (less negative) $\varepsilon$.

Suppose you add a speed $\Delta v$ in the direction you are already moving, at speed $v$. The height does not change during an instant burn, so only the motion part changes:

$$
\Delta\varepsilon = \frac{(v + \Delta v)^2}{2} - \frac{v^2}{2} = v\,\Delta v + \frac{\Delta v^2}{2}.
$$

Look at the first term, $v\,\Delta v$. The same $\Delta v$ buys *more* energy when $v$ is large. A burn made while moving fast — deep in the gravity well, near periapsis — is worth more energy than the same burn made while moving slowly. This is the **[[Oberth effect|oberth]]**.

::: key The Oberth effect
A given Δv applied at higher speed produces a larger change in specific energy:
$$
\Delta\varepsilon = v\,\Delta v + \frac{\Delta v^2}{2}.
$$
Burning deep in a gravity well, where the speed is highest, is therefore the most efficient way to gain energy — the reason for perigee kick burns and powered flybys.
:::

The flip side matters every bit as much for this lesson. Where the vehicle is slow — far out, at a high apoapsis — a small Δv makes a big change to the *shape* of the orbit, the way the tap on the slow ball did. The bi-elliptic transfer uses both sides: a big burn low down where it buys lots of energy, and the shape-changing work done high up where it is cheap.

## Building the bi-elliptic transfer

Start on a circular orbit of radius $r_1$. The target is a circular orbit of radius $r_2 > r_1$. Choose an **intermediate apoapsis** radius $r_b$ ("r sub b"), bigger than $r_2$. You pick it, and the choice matters. The three burns are all tangential, so each one is a plain change of speed.

**Burn 1, at $r_1$: stretch the orbit out to $r_b$.** The vehicle enters an ellipse with periapsis $r_1$ and apoapsis $r_b$, so its semi-major axis is $a_1 = (r_1 + r_b)/2$. This is exactly the first burn of a Hohmann transfer to $r_b$:

$$
\Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_b}{r_1+r_b}}-1\right).
$$

**Burn 2, at $r_b$: lift the low point from $r_1$ to $r_2$.** The vehicle coasts half an ellipse out to $r_b$, where it is moving slowly. A small forward burn there switches it to a second ellipse with the *same* apoapsis $r_b$ but a periapsis of $r_2$ instead of $r_1$. Its semi-major axis is $a_2 = (r_2 + r_b)/2$. The burn is the new speed at $r_b$ minus the old one, both from vis-viva:

$$
\Delta v_2 = \sqrt{\mu\left(\frac{2}{r_b}-\frac{1}{a_2}\right)} - \sqrt{\mu\left(\frac{2}{r_b}-\frac{1}{a_1}\right)}.
$$

**Burn 3, at $r_2$: circularize.** The vehicle falls half of the second ellipse back in to its periapsis at $r_2$. There it is moving *faster* than circular speed (it is at periapsis, inside its own semi-major axis), so this burn is retrograde — a brake:

$$
\Delta v_3 = \sqrt{\frac{\mu}{r_2}} - \sqrt{\mu\left(\frac{2}{r_2}-\frac{1}{a_2}\right)}.
$$

With this sign convention $\Delta v_3$ comes out negative, which is how you know it points backward. The **[[shape of the whole trip|bielliptic-picture]]** is two half-ellipses joined at $r_b$.

**Total cost** is the sum of the sizes, $|\Delta v_1| + |\Delta v_2| + |\Delta v_3|$. **Total time** is two half-periods, one for each ellipse:

$$
t = \pi\sqrt{\frac{a_1^3}{\mu}} + \pi\sqrt{\frac{a_2^3}{\mu}}.
$$

### Two sanity checks

**Let $r_b$ shrink down to $r_2$.** Then $a_2 = (r_2 + r_2)/2 = r_2$, and vis-viva at $r_2$ on that "ellipse" gives $\sqrt{\mu(2/r_2 - 1/r_2)} = \sqrt{\mu/r_2}$ — the circular speed. So the two terms in $\Delta v_3$ are equal and **burn 3 vanishes**: the second "ellipse" is the target circle itself. Meanwhile burn 1 becomes Hohmann's first burn, and burn 2 becomes circular speed at $r_2$ minus the transfer ellipse's apoapsis speed — exactly Hohmann's second burn. So Hohmann is the $r_b = r_2$ limit of the bi-elliptic transfer. Every bi-elliptic with $r_b > r_2$ is a genuine three-burn alternative to compare against it.

**Let $r_b$ grow without limit.** Then burn 1 approaches escape: $\Delta v_1 \to (\sqrt2 - 1)\sqrt{\mu/r_1}$. Burn 2 shrinks to nothing, because far enough out the vehicle is barely moving. Burn 3 brakes from escape speed at $r_2$ down to circular: $|\Delta v_3| \to (\sqrt2 - 1)\sqrt{\mu/r_2}$. The **[[limiting total|infinity-limit]]** is

$$
\Delta v_{\text{total}} \to (\sqrt{2} - 1)\left(\sqrt{\frac{\mu}{r_1}} + \sqrt{\frac{\mu}{r_2}}\right).
$$

That is the best a bi-elliptic can do when bigger $r_b$ keeps helping.

::: key Bi-elliptic transfer
Three tangential burns via an intermediate apoapsis $r_b > r_2$: raise apoapsis to $r_b$; at $r_b$, raise periapsis from $r_1$ to $r_2$; circularize (brake) at $r_2$. It reduces exactly to the Hohmann transfer as $r_b \to r_2$. Its cost and flight time both depend on the choice of $r_b$.
:::

## Where the crossover actually is

Whether the third burn helps depends on the radius ratio $R = r_2/r_1$ and on how big you let $r_b$ get. Sweeping both on a computer — fix $r_1$, vary $R$ and $r_b/r_2$, and compare each bi-elliptic total with the Hohmann total for the same $r_1$ and $r_2$ — turns up three regimes. The boundaries are worth finding precisely rather than trusting from memory.

### The lower threshold: 11.94

Start with the most generous choice, $r_b \to \infty$, using the limiting total above. Compare it with the Hohmann cost as $R$ changes. The two are equal at exactly one ratio, which a root-finder puts at $R = 11.9388$.

Below this ratio, even an infinitely large $r_b$ cannot make the bi-elliptic transfer cheaper. Hohmann wins outright, for every choice of $r_b$.

### The upper threshold: 15.58

Now look at the other end: $r_b$ only a little bigger than $r_2$, a tiny overshoot. At $r_b = r_2$ the two transfers are identical. The question is whether nudging $r_b$ outward from there makes the cost go up or down — the *slope* of the bi-elliptic cost at the Hohmann limit. Solving for the ratio where that slope changes sign gives $R = 15.5817$.

Above this ratio, *any* $r_b > r_2$, however small the overshoot, already beats Hohmann, and pushing $r_b$ farther out only helps more.

::: note Why it has to be true: the same 15.58 as lesson 2's hump
Lesson 2 found that, with $r_1$ fixed, the Hohmann cost rises with $R$ until $R \approx 15.58$ and then falls. That is the same number, and not by accident.

With $r_b$ barely past $r_2$, the bi-elliptic trip is "Hohmann out to $r_b$" with a tiny down-and-back tacked on at the far end. The extra piece is tiny, and to first order it adds nothing. So nudging $r_b$ outward changes the bi-elliptic cost at the same rate that moving the target from $r_2$ out to $r_b$ changes the Hohmann cost.

Below the hump, a Hohmann transfer to a slightly higher orbit costs more, so the nudge hurts. Past the hump it costs less, so the nudge helps. The sign of the slope flips exactly at the top of the hump.
:::

### In between: it depends

For $11.94 < R < 15.58$, both behaviors show up at the same $R$. A modest $r_b$ still costs more than Hohmann, but a large enough $r_b$ eventually wins.

Take $R = 13$ with $r_1 = 6678\,\mathrm{km}$. With $r_b = 1.5\,r_2$ the bi-elliptic costs about $18\,\mathrm{m/s}$ *more* than Hohmann. With $r_b = 5\,r_2$ it costs about $8.5\,\mathrm{m/s}$ *less*. The **[[break-even point|it-depends-curve]]** for this $R$ is at $r_b \approx 3.76\,r_2$. Inside this band, $R$ alone cannot tell you which transfer wins — you also have to say which $r_b$. Put together, the **[[three regimes|regimes-line]]** sit on the $R$ line as three bands.

::: key The three regimes
$$
R = \frac{r_2}{r_1}: \quad R < 11.94 \Rightarrow \text{Hohmann wins for every } r_b; \qquad
R > 15.58 \Rightarrow \text{bi-elliptic wins for every } r_b>r_2.
$$
Between 11.94 and 15.58, the winner depends on $r_b$: a modest overshoot can still lose, while a generous one wins.
:::

::: example Case A: below the crossover, $R=8$
$r_1 = 6678\,\mathrm{km}$ and $r_2 = 8\,r_1 = 53\,424\,\mathrm{km}$.

**Hohmann.** $\Delta v_1 = 2.5753\,\mathrm{km/s}$ and $\Delta v_2 = 1.4439\,\mathrm{km/s}$, total $4.0191\,\mathrm{km/s}$, with a flight time of $7.20\,\mathrm{h}$.

**Bi-elliptic with a generous $r_b = 10\,r_2 = 534\,240\,\mathrm{km}$** — [[farther out than the Moon|beyond-the-moon]].

- Burn 1: $\Delta v_1 = 3.1325\,\mathrm{km/s}$. Bigger than Hohmann's first burn, because it throws the vehicle ten times farther.
- Burn 2: $\Delta v_2 = 0.2326\,\mathrm{km/s}$. Small, as promised — the vehicle is crawling out at $r_b$.
- Burn 3: $\Delta v_3 = -0.9517\,\mathrm{km/s}$. Negative: a brake, since the vehicle falls back to $r_2$ faster than circular.

**Total:** add the three sizes, $3.1325$, $0.2326$ and $0.9517$, to get $4.3167\,\mathrm{km/s}$ (the last digit reflects the unrounded burns). That is $4.3167/4.0191 - 1 = 7.4\,\%$ **more** than Hohmann, and the trip now takes $17.3$ days instead of $7.2$ hours.

**Pushing $r_b$ to infinity.** The limiting formula gives $(\sqrt2 - 1)(7.7258 + 2.7315) = 4.3316\,\mathrm{km/s}$, which is $7.8\,\%$ worse than Hohmann — even worse than at $10\,r_2$. No choice of $r_b$ rescues this transfer, exactly as the $R < 11.94$ rule says.
:::

::: example Case B: above the crossover, $R=25$
$r_1 = 6678\,\mathrm{km}$ and $r_2 = 25\,r_1 = 166\,950\,\mathrm{km}$.

**Hohmann.** $\Delta v_1 = 2.9880\,\mathrm{km/s}$ and $\Delta v_2 = 1.1166\,\mathrm{km/s}$, total $4.1046\,\mathrm{km/s}$, with a flight time of $35.36\,\mathrm{h}$, about a day and a half.

**Bi-elliptic with a modest $r_b = 3\,r_2 = 500\,850\,\mathrm{km}$.**

- Burn 1: $\Delta v_1 = 3.1280\,\mathrm{km/s}$.
- Burn 2: $\Delta v_2 = 0.4861\,\mathrm{km/s}$.
- Burn 3: $\Delta v_3 = -0.3473\,\mathrm{km/s}$ (a brake).

**Total:** $3.1280 + 0.4861 + 0.3473 = 3.9614\,\mathrm{km/s}$. The saving is $4.1046 - 3.9614 = 0.143\,\mathrm{km/s}$, or $143\,\mathrm{m/s}$ — about $3.5\,\%$, as the $R > 15.58$ rule guarantees.

**The time.** The flight now takes $18.5$ days against a day and a half for Hohmann — about $12.5$ times as long.

**Sanity check.** The saving is real but small, and the time penalty is large. Three and a half percent of Δv for twelve times the transit time is the whole bi-elliptic trade in one sentence.
:::

## The honest verdict

Every number above makes the same point twice.

The Δv saving is real but small: a few percent, even well past the upper threshold, unless $r_b$ is pushed to extreme multiples of $r_2$. By then the flight time is measured in months or years.

The time cost is never small. Both half-ellipses reach out to $r_b$, and by Kepler's third law a big semi-major axis means a long period, however the burns are arranged.

That is why the bi-elliptic transfer, though it really does win in its regime, almost never appears in an actual mission plan. A few percent of propellant is rarely worth weeks of extra transit, extra tracking, extra **[[radiation|radiation-belts]]** exposure for a crew, or a mission schedule that has to stretch to match. It earns its place here because its reasoning — do the big energy burn low, and do the shape-changing work high up where it is cheap — comes back again and again in real mission design, as in the **[[supersynchronous transfer orbits|supersynchronous]]** launchers fly to geostationary orbit today.

::: warning $r_b$ is a design choice, not a given
A Hohmann transfer has no free setting once $r_1$ and $r_2$ are fixed. A bi-elliptic transfer's cost and time both depend on the intermediate apoapsis $r_b$, which you choose. Quoting a bi-elliptic Δv without stating $r_b$ is like quoting a Hohmann Δv without stating $r_2$ — the answer is incomplete.
:::

::: warning Retrograde burns are still burns
In both cases above, $\Delta v_3$ came out negative: the vehicle reaches $r_2$ faster than the local circular speed and must brake. The *cost* is the size, $|\Delta v_3|$. A retrograde burn spends exactly as much propellant as a forward burn of the same size, so never let a minus sign cancel part of the total.
:::

## Check yourself

::: check
Using the burn formulas, show that the bi-elliptic transfer turns into the Hohmann transfer when $r_b = r_2$. Which burn disappears?
:::

::: answer
Put $r_b = r_2$. The second ellipse then has $a_2 = (r_2 + r_2)/2 = r_2$, so its speed at $r_2$ from vis-viva is $\sqrt{\mu(2/r_2 - 1/r_2)} = \sqrt{\mu/r_2}$ — the circular speed. The second ellipse *is* the target circle.

- **Burn 3** is circular speed minus that same speed, so $\Delta v_3 = 0$. It disappears.
- **Burn 1** is now a burn from $r_1$ onto the ellipse with $a_1 = (r_1 + r_2)/2$ — exactly Hohmann's first burn.
- **Burn 2** is $\sqrt{\mu/r_2}$ (the new speed, circular) minus $\sqrt{\mu(2/r_2 - 1/a_1)}$ (the transfer ellipse's apoapsis speed) — exactly Hohmann's second burn.

Only two burns remain, and they are precisely the Hohmann departure and arrival burns from $r_1$ to $r_2$.
:::

::: check
A mission designer proposes $r_1 = 6678\,\mathrm{km}$, $r_2 = 60\,102\,\mathrm{km}$ ($R=9$) and a bi-elliptic transfer with $r_b = 200\,r_2$. Without computing the exact Δv, can this possibly beat Hohmann? Why?
:::

::: answer
No. $R = 9$ is below the lower threshold of $11.94$, and below that threshold Hohmann wins for *every* choice of $r_b$.

It is worth seeing why. As $r_b \to r_2$, the bi-elliptic transfer turns into Hohmann itself — burn 3 goes to zero and the cost is Hohmann's exactly. So the bi-elliptic family *contains* Hohmann, and the only question is which way the cost moves as $r_b$ is pushed outward. Below the threshold it moves the wrong way and keeps moving that way: at $R = 8$ it is already $7.4\,\%$ worse at $r_b = 10\,r_2$ and $7.8\,\%$ worse in the limit.

So below the threshold, the "best possible bi-elliptic" is a tie with Hohmann, reached by not doing a bi-elliptic at all. An enormous $r_b$ does not change which regime $R$ is in. It only adds a very long transit time for no benefit.
:::

::: check
For $R = 13$ (inside the "it depends" band), why does a modest $r_b$ barely past $r_2$ cost *more* than Hohmann, while a much larger $r_b$ costs less?
:::

::: answer
Moving $r_b$ outward does two things with opposite effects.

It makes burn 1 bigger (you throw the vehicle farther) and burn 3 bigger (it falls back faster and must brake harder). Those are extra costs.

It makes burn 2 cheaper, because the job of raising the low point from $r_1$ to $r_2$ is done at $r_b$, where the vehicle is moving more and more slowly. That is a saving.

Barely past $r_2$, the cost is behaving like a Hohmann transfer to a slightly higher orbit — and at $R = 13$, which is below lesson 2's hump at $15.58$, going slightly higher costs more. So a small overshoot loses. As $r_b$ keeps growing, burn 2 keeps shrinking toward zero while burns 1 and 3 level off at their escape-speed limits, and the saving eventually wins. Because the effects pull in opposite directions, the net cost first rises and then falls, crossing Hohmann's value once — at about $r_b = 3.76\,r_2$ for $R = 13$.
:::

::: check
A transfer with $R = 25$ using $r_b = 3\,r_2$ saves about $3.5\,\%$ of Δv over Hohmann but takes about twelve and a half times as long. When would that trade actually be worth taking?
:::

::: answer
When propellant mass is the tight constraint and time is nearly free. Examples: an uncrewed cargo or fuel delivery with no schedule pressure; a mission where the saved propellant turns directly into more payload or more margin elsewhere; or a case where the vehicle has to wait anyway (for a planetary alignment, say), so the extra coast costs nothing.

It is not worth it whenever something grows with time: schedule, crew radiation dose, propellant used to hold attitude while coasting, or mission risk. That covers most missions — which is exactly why the bi-elliptic transfer is a textbook staple and an operational rarity.
:::

::: check
If you did not already know the $R = 11.94$ threshold, how would you find it numerically?
:::

::: answer
Fix $r_1$. For a range of ratios $R$, compute the Hohmann total and the bi-elliptic total for a very large $r_b$ — large enough that making it bigger no longer changes the answer at the precision you need (checking that is itself a convergence test). The limiting formula $(\sqrt2-1)(\sqrt{\mu/r_1}+\sqrt{\mu/r_2})$ does this step exactly.

Then take the difference of the two totals as a function of $R$ and find where it changes sign. A **[[root-finder|root-finding]]** such as bisection or Brent's method, started on a bracket around that sign change, closes in on the threshold. That is exactly the calculation behind the $11.9388$ quoted in this lesson.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta\varepsilon = v\,\Delta v + \Delta v^2/2$ | Oberth effect: the same Δv buys more energy at higher speed |
| $\Delta v_1,\ \Delta v_3$ | Hohmann-style burns out to $r_b$ and (braking) back in at $r_2$ |
| $\Delta v_2$ | Small tangential burn at $r_b$, raising periapsis from $r_1$ to $r_2$ |
| $t = \pi\sqrt{a_1^3/\mu} + \pi\sqrt{a_2^3/\mu}$ | Flight time: two half-ellipses |
| $r_b \to r_2$ | Burn 3 vanishes; the transfer reduces exactly to Hohmann |
| $r_b \to \infty$ | Total $\to (\sqrt2-1)\left(\sqrt{\mu/r_1}+\sqrt{\mu/r_2}\right)$ |
| $R = r_2/r_1 < 11.94$ | Hohmann wins for every $r_b$ |
| $R > 15.58$ | Bi-elliptic wins for every $r_b > r_2$ |
| $11.94 < R < 15.58$ | Depends on $r_b$: small overshoot loses, generous overshoot can win |
| Case A ($R=8$) | No $r_b$ beats Hohmann's $4.0191\,\mathrm{km/s}$: $7.4\,\%$ worse at $10r_2$, $7.8\,\%$ in the limit |
| Case B ($R=25$, $r_b=3r_2$) | Saves $3.5\,\%$ of Δv, costs about $12.5\times$ the transit time |
| Verdict | Real but small Δv savings, large and unavoidable time cost |

The next lesson goes back to two burns but asks a different question: what if you keep the departure tangential but choose a transfer orbit that does *not* reach $r_2$ exactly at apoapsis? You pay more than Hohmann, on purpose, to control exactly when you arrive.

::: context oberth Named for a rocket pioneer
Hermann Oberth was a Transylvanian-born German physicist whose 1923 book *Die Rakete zu den Planetenräumen* ("The Rocket into Planetary Space") helped launch the modern study of spaceflight. Among much else, he pointed out that a rocket gets the most from its fuel by burning when it is moving fastest.

One way to see it: exhaust thrown backward from a fast-moving rocket is left with less kinetic energy of its own, so more of the fuel's chemical energy ends up in the vehicle. Mission designers use it every time they burn at perigee to leave Earth, and in powered flybys of planets.
:::

::: context bielliptic-picture The route, drawn to scale
Drawn for $r_2 = 4\,r_1$ and $r_b = 3\,r_2$. The first ellipse (top) swings from the inner circle out to $r_b$. The second (bottom) falls from $r_b$ back to the target circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="300" cy="105" r="48" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="300" cy="105" r="12" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="300" cy="105" r="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M312,105 A78,41.57 0 0,0 156,105" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M156,105 A96,83.14 0 0,0 348,105" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <circle cx="312" cy="105" r="4" fill="#b4232c"/>
  <circle cx="156" cy="105" r="4" fill="#b4232c"/>
  <circle cx="348" cy="105" r="4" fill="#b4232c"/>
  <text x="316" y="98" font-size="12" fill="#b4232c">1</text>
  <text x="142" y="100" font-size="12" fill="#b4232c">2</text>
  <text x="340" y="124" font-size="12" fill="#b4232c">3</text>
  <text x="10" y="30" font-size="12" fill="#1d6fd1">leg 1: r₁ out to r_b</text>
  <text x="10" y="48" font-size="12" fill="#1f2a44">burn 2 at r_b (slowest point)</text>
  <text x="10" y="190" font-size="12" fill="#1f2a44">leg 2: r_b back to r₂</text>
</svg>
```

The dots mark the three burns. Burn 3 is a brake.
:::

::: context infinity-limit The trip to infinity and back
As $r_b$ grows without limit, the first ellipse becomes a **parabola** — the path of something moving at exactly escape speed, $\sqrt{2}$ times the circular speed. The vehicle drifts out forever, arriving "at infinity" with zero speed. A zero-sized burn there turns it around, and it falls back on a second parabola, arriving at $r_2$ at escape speed and braking to circular.

No mission could wait that long, of course. The limit is useful because it gives the best a bi-elliptic can possibly do, in one line.
:::

::: context it-depends-curve The R = 13 cost curve
Bi-elliptic cost minus Hohmann cost, for $R = 13$ and $r_1 = 6678\,\mathrm{km}$, as the overshoot $r_b/r_2$ grows:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="30" x2="50" y2="198" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="114" x2="340" y2="114" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="58" x2="340" y2="58" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,114.0 53.2,94.3 56.4,81.2 59.7,72.7 62.9,67.5 66.1,64.6 69.3,63.3 72.6,63.3 75.8,64.2 79.0,65.7 82.2,67.6 90.3,73.7 98.3,80.7 106.4,87.8 114.4,94.8 122.5,101.5 130.6,107.8 138.6,113.7 146.7,119.3 154.7,124.4 162.8,129.2 170.8,133.7 178.9,137.9 186.9,141.8 195.0,145.5 203.1,148.9 211.1,152.2 219.2,155.2 227.2,158.0 235.3,160.7 243.3,163.3 251.4,165.7 259.4,167.9 267.5,170.1 275.6,172.1 283.6,174.1 291.7,175.9 299.7,177.7 307.8,179.3 315.8,180.9 323.9,182.5 331.9,183.9 340.0,185.3"/>
  <circle cx="139" cy="114" r="4" fill="#b4232c"/>
  <text x="145" y="106" font-size="12" fill="#b4232c">break-even 3.76</text>
  <text x="90" y="46" font-size="12" fill="#1f2a44">costs more than Hohmann</text>
  <text x="200" y="198" font-size="12" fill="#1f2a44">costs less</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="62">+20</text><text x="45" y="118">0</text><text x="45" y="174">−20</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="212">1</text><text x="146.7" y="212">4</text><text x="243.3" y="212">7</text><text x="340" y="212">10</text>
  </g>
  <text x="14" y="20" font-size="11" fill="#1f2a44">m/s</text>
  <text x="290" y="212" font-size="11" fill="#1f2a44" text-anchor="end">r_b / r₂</text>
</svg>
```

A small overshoot loses (worst, about $18\,\mathrm{m/s}$, near $1.7\,r_2$). Past $3.76\,r_2$ the bi-elliptic wins, by about $25\,\mathrm{m/s}$ at $10\,r_2$.
:::

::: context regimes-line Three bands on one line
Where the radius ratio $R = r_2/r_1$ falls decides the contest:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="178.5" height="24" fill="#8fb8f0"/>
  <rect x="208.5" y="40" width="59.4" height="24" fill="#f2b880"/>
  <rect x="267.9" y="40" width="72.1" height="24" fill="#b4232c" opacity="0.75"/>
  <line x1="30" y1="64" x2="340" y2="64" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="64" x2="30" y2="72"/><line x1="208.5" y1="64" x2="208.5" y2="72"/><line x1="267.9" y1="64" x2="267.9" y2="72"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="86">1</text><text x="208.5" y="86">11.94</text><text x="267.9" y="86">15.58</text>
  </g>
  <text x="119" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">Hohmann always</text>
  <text x="238" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">depends</text>
  <text x="304" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">bi-elliptic</text>
  <circle cx="116.6" cy="52" r="4" fill="#1f2a44"/>
  <text x="116.6" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">LEO→GEO, R = 6.31</text>
</svg>
```

The axis runs from $R = 1$ to $R = 20$. LEO to GEO sits deep in Hohmann territory, which is one more reason bi-elliptic transfers are rare around Earth.
:::

::: context beyond-the-moon Where two-body math runs out
$534\,240\,\mathrm{km}$ is about $1.4$ times the Moon's average distance of $384\,400\,\mathrm{km}$. A real spacecraft coasting out there would be tugged hard by the Moon and noticeably by the Sun, so the neat two-body ellipses of this lesson would only be a first guess.

Much farther out, past Earth's sphere of influence (roughly $924\,000\,\mathrm{km}$), the Sun's pull dominates and Earth's ellipse picture fails entirely. Lesson 11 shows how mission designers stitch those regions together.
:::

::: context radiation-belts Time is exposure
Earth is wrapped in the **Van Allen belts**, zones of fast charged particles trapped by the magnetic field, reaching from roughly $1000\,\mathrm{km}$ up to tens of thousands of kilometers. Any trip from low orbit to high orbit passes through them.

A fast transfer crosses them in hours. A slow one lingers, and radiation damage to crew, solar cells and electronics grows with the time spent inside. It is a real cost that never shows up in a Δv number.
:::

::: context supersynchronous The bi-elliptic idea on real launches
Many geostationary satellites launched today go first to a **supersynchronous transfer orbit**, whose apogee is well above GEO's $35\,786\,\mathrm{km}$ altitude. Out at that high apogee the satellite is moving slowly, so tilting its orbit plane and raising its perigee are cheaper there. Later it lowers the apogee back down to GEO.

That is the bi-elliptic idea at work: do the shape-changing jobs where the vehicle is slow. Lesson 5 prices the plane change that makes it worthwhile.
:::

::: context root-finding Finding where a curve crosses zero
A **root-finder** is a recipe for finding where a function equals zero. **Bisection** is the simplest: start with two values of $R$ where the difference has opposite signs, check the midpoint, keep whichever half still has the sign change, and repeat. Each step halves the interval, so about $30$ steps pin the answer to one part in a billion.

**Brent's method** mixes bisection with faster guesses and usually needs far fewer steps. The numerical methods module builds both.
:::
