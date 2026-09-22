---
id: l03-bielliptic-transfer
title: The bi-elliptic transfer and the crossover ratio
minutes: 17
covers:
  - bi-elliptic transfer and the crossover ratio
---

The last lesson proved something strong: no two-impulse transfer beats Hohmann between two circular, coplanar orbits. It did not prove that no transfer beats it. Allow a third burn, and for a large enough radius ratio, a strange-looking route – shoot far past the target orbit, coast out to some enormous intermediate apoapsis, then come back down and settle into the target – actually costs less propellant than going there directly. This is the bi-elliptic transfer, and the reason it can win is worth understanding precisely, because the same reasoning explains why it is used so rarely despite sometimes winning.

The intuition is Oberth-flavoured: raising a periapsis is cheap when done slowly, far from the primary, where the orbital speed is already small. Sending the vehicle needlessly far out costs propellant of its own, of course, so this only pays off when the direct route's single large burn at a modest radius is expensive enough that even a wasteful-looking detour beats it. This lesson derives the three-burn cost, finds exactly where that trade turns favourable, and is honest about what it costs in time.

## Building the bi-elliptic transfer

Three impulses, three legs. Start on a circular orbit of radius $r_1$, target a circular orbit of radius $r_2 > r_1$, and choose an intermediate apoapsis radius $r_b > r_2$ – free to pick, and the choice matters, as you will see.

**Burn 1**, at $r_1$: raise apoapsis to $r_b$, entering an ellipse with periapsis $r_1$ and apoapsis $r_b$, $a_1 = (r_1+r_b)/2$. Both this burn and the ellipse itself are exactly the first half of a Hohmann transfer to $r_b$:
$$
\Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_b}{r_1+r_b}}-1\right).
$$

**Burn 2**, at $r_b$ (apoapsis of both ellipses): switch from the first ellipse to a second one with the *same* apoapsis $r_b$ but periapsis now $r_2$ instead of $r_1$, $a_2 = (r_2+r_b)/2$. This is a small, purely tangential correction at the slowest point of the whole trajectory:
$$
\Delta v_2 = \sqrt{\mu\left(\frac{2}{r_b}-\frac{1}{a_2}\right)} - \sqrt{\mu\left(\frac{2}{r_b}-\frac{1}{a_1}\right)}.
$$

**Burn 3**, at $r_2$ (periapsis of the second ellipse): circularise, exactly the second half of a Hohmann transfer from $r_b$ down to $r_2$:
$$
\Delta v_3 = \sqrt{\frac{\mu}{r_2}} - \sqrt{\mu\left(\frac{2}{r_2}-\frac{1}{a_2}\right)}.
$$

Total cost is $|\Delta v_1| + |\Delta v_2| + |\Delta v_3|$, and total time is the sum of the two transfer half-periods, $t = \pi\sqrt{a_1^3/\mu} + \pi\sqrt{a_2^3/\mu}$.

A useful sanity check before doing anything else: let $r_b \to r_2$ exactly. Then $a_2 \to r_2$ and burn 2's two terms become equal, so $\Delta v_2 \to 0$ – the second burn vanishes and burns 1 and 3 become exactly the two Hohmann burns from $r_1$ to $r_2$. The bi-elliptic transfer is a strict generalisation of Hohmann, not a different maneuver: Hohmann is the bi-elliptic transfer's own $r_b = r_2$ limit. Every bi-elliptic transfer you construct with $r_b > r_2$ is a genuine three-burn alternative to compare against it.

::: key Bi-elliptic transfer
Three tangential burns via an intermediate apoapsis $r_b > r_2$: raise apoapsis to $r_b$, raise periapsis from $r_1$ to $r_2$ while at $r_b$, circularise at $r_2$. It reduces exactly to the Hohmann transfer as $r_b \to r_2$.
:::

## Where the crossover actually is

Whether the extra burn helps depends on $R = r_2/r_1$ and on how large you let $r_b$ get. Sweeping both numerically (fixing $r_1$, varying $R$ and $r_b/r_2$, and comparing the bi-elliptic total against the Hohmann total for the same $r_1,r_2$) turns up three regimes, and the boundaries are worth finding precisely rather than trusting from memory.

Take the limit $r_b \to \infty$ first – the most generous possible intermediate apoapsis, so the best a bi-elliptic transfer can ever do for a given $R$. Compare that limiting cost against the Hohmann cost as $R$ varies, and the two cross at exactly one ratio: solving numerically gives $R = 11.9388$. Below this ratio, even an infinitely generous $r_b$ cannot make the bi-elliptic transfer cheaper – Hohmann wins outright, for every choice of $r_b$, no exceptions.

Now look at the *other* end of the $r_b$ range: $r_b$ only barely larger than $r_2$, an intermediate apoapsis you barely overshoot. Whether nudging $r_b$ up from $r_2$ helps or hurts, at the margin, is a question about the slope of the bi-elliptic cost right at the Hohmann limit. Solving numerically for the ratio at which that marginal nudge stops hurting and starts helping gives $R = 15.5817$. Above this ratio, *any* $r_b > r_2$, however modest, already beats Hohmann, and pushing $r_b$ further out only helps more.

Between the two thresholds, the two behaviours coexist for the same $R$: a modest $r_b$ (just past $r_2$) still costs more than Hohmann, but a sufficiently generous $r_b$ eventually overtakes it. At $R = 13$, for instance, $r_b = 1.5\,r_2$ costs about $18\,\mathrm{m/s}$ more than Hohmann, but $r_b = 5\,r_2$ already costs about $8.5\,\mathrm{m/s}$ less; the crossover for this particular $R$ falls at $r_b \approx 3.76\,r_2$. This is the "it depends" band: no rule fixed by $R$ alone tells you which side you are on without also picking $r_b$.

::: key The three regimes
$$
R = \frac{r_2}{r_1}: \quad R < 11.94 \Rightarrow \text{Hohmann wins for every } r_b; \qquad
R > 15.58 \Rightarrow \text{bi-elliptic wins for every } r_b>r_2.
$$
Between 11.94 and 15.58, the winner depends on $r_b$: a modest overshoot can still lose, while a generous one wins.
:::

::: example Case A: below the crossover, $R=8$
$r_1 = 6678\,\mathrm{km}$, $r_2 = 8 r_1 = 53\,424\,\mathrm{km}$. Hohmann: $\Delta v_1 = 2.5753$, $\Delta v_2 = 1.4439$, total $4.0191\,\mathrm{km/s}$, $t = 7.20\,\mathrm{h}$. Now try a genuinely generous bi-elliptic, $r_b = 10\,r_2 = 534\,240\,\mathrm{km}$ – more than the distance to the Moon: $\Delta v_1 = 3.1325$, $\Delta v_2 = 0.2326$, $\Delta v_3 = -0.9517$ (a retrograde circularisation burn, since the vehicle arrives at $r_2$ moving faster than circular), total $4.3167\,\mathrm{km/s}$ – **7.4 % more** than Hohmann, for a transfer that now takes 17.3 days instead of 7.2 hours. Pushing $r_b$ out even further, to the mathematical limit $r_b \to \infty$, the bi-elliptic total only improves to $4.3316\,\mathrm{km/s}$, still 7.8 % worse than Hohmann. No choice of $r_b$ rescues this transfer, exactly as the $R<11.94$ rule predicts.
:::

::: example Case B: above the crossover, $R=25$
$r_1 = 6678\,\mathrm{km}$, $r_2 = 25 r_1 = 166\,950\,\mathrm{km}$. Hohmann: $\Delta v_1 = 2.9880$, $\Delta v_2 = 1.1166$, total $4.1046\,\mathrm{km/s}$, $t = 35.36\,\mathrm{h}$. A modest bi-elliptic with $r_b = 3\,r_2 = 500\,850\,\mathrm{km}$ gives $\Delta v_1 = 3.1280$, $\Delta v_2 = 0.4861$, $\Delta v_3 = -0.3473$, total $3.9614\,\mathrm{km/s}$ – a real saving of $143\,\mathrm{m/s}$, about 3.5 %, exactly as the $R>15.58$ rule guarantees. But the flight time is now 18.5 days, against a day and a half for Hohmann. Three and a half percent of propellant for twelve times the transit time is the entire bi-elliptic trade in one sentence.
:::

## The honest verdict

Every number above makes the same point twice. The Δv saving a bi-elliptic transfer can offer is real but small – a few percent, even far past the upper threshold, unless $r_b$ is pushed to genuinely extreme multiples of $r_2$, at which point the time cost becomes measured in years. The time cost, in contrast, is never small: a bi-elliptic transfer's two half-ellipses both have to reach out to $r_b$, and by Kepler's third law a large semi-major axis means a long period no matter how the burns are arranged. This is why the bi-elliptic transfer, despite being provably optimal-or-better in its regime, almost never appears in an actual mission design: a few percent of propellant is rarely worth weeks of additional transit time, extra tracking, extra radiation exposure for a crewed vehicle, or a launch window that has to stay open that much longer. It earns its place in this lesson because the reasoning – three tangential burns, Oberth-cheap raising of periapsis at high altitude – recurs constantly elsewhere in mission design (a lunar-gravity-assisted GEO insertion is close kin), even when the literal three-impulse maneuver is not flown.

::: warning $r_b$ is a design choice, not a given
Unlike the Hohmann transfer, which has no free parameter once $r_1,r_2$ are fixed, the bi-elliptic transfer's cost and time both depend on the intermediate apoapsis $r_b$, which you choose. Quoting a bi-elliptic Δv without stating $r_b$ is like quoting a Hohmann Δv without stating $r_2$ – it is not a complete answer.
:::

::: warning Retrograde burns are still burns
In case A and case B above, $\Delta v_3$ came out negative: the vehicle arrives at $r_2$ moving faster than the local circular speed and must brake. The *cost* is the magnitude, $|\Delta v_3|$, regardless of sign – a retrograde burn spends exactly as much propellant as a prograde one of the same size.
:::

## Check yourself

::: check
Explain why the bi-elliptic transfer reduces exactly to the Hohmann transfer when $r_b = r_2$, using the formulas for $\Delta v_2$.
:::

::: answer
When $r_b = r_2$, the second ellipse's semi-major axis $a_2 = (r_2+r_b)/2 = r_2 = r_b$, so evaluating vis-viva at $r_b$ on the second ellipse gives $v = \sqrt{\mu(2/r_b - 1/r_b)} = \sqrt{\mu/r_b}$, the local circular speed, which is exactly the vis-viva result on the *first* ellipse at its own apoapsis $r_b$ once $a_1$ also collapses appropriately — concretely, both bracket terms in $\Delta v_2$ become the speed at the shared apoapsis of two ellipses that have become the same ellipse, so their difference is zero. With $\Delta v_2 = 0$, only burns 1 and 3 remain, and they are precisely the Hohmann departure and arrival burns from $r_1$ to $r_2$.
:::

::: check
A mission designer proposes $r_1 = 6678\,\mathrm{km}$, $r_2 = 60\,102\,\mathrm{km}$ ($R=9$) and a bi-elliptic transfer with $r_b = 200\,r_2$. Without computing the exact Δv, say whether this can possibly beat Hohmann, and why.
:::

::: answer
No. $R = 9$ is below the lower threshold of $11.94$, and below that threshold Hohmann wins for *every* choice of $r_b$, including arbitrarily large ones – the best a bi-elliptic transfer can do as $r_b \to \infty$ still falls short. Proposing an enormous $r_b$ does not change which regime $R$ falls into; it only adds years to the transit time for no Δv benefit at this ratio.
:::

::: check
For $R = 13$ (inside the "it depends" band), why does a modest $r_b$ just past $r_2$ cost *more* than Hohmann, while a much larger $r_b$ costs less?
:::

::: answer
At $r_b$ just past $r_2$, burn 2 (the small correction at apoapsis) is doing almost no useful work — it is barely changing the ellipse's periapsis — while burns 1 and 3 have already paid the extra cost of reaching an apoapsis slightly beyond where Hohmann's single ellipse would naturally put it, so the total is pushed up. As $r_b$ grows, burns 1 and 3 increasingly resemble the cheap, nearly-tangential, low-speed maneuvers that make the bi-elliptic idea work in the first place, and eventually the saving from performing the periapsis raise at very low speed outweighs the extra cost of getting out to $r_b$ and back. Because these two effects have opposite trends in $r_b$, the net cost is non-monotonic for $R$ in this band, crossing Hohmann's value once on the way.
:::

::: check
A transfer with $R = 25$ using $r_b = 3r_2$ saves about 3.5 % of Δv over Hohmann but takes about twelve and a half times as long. Under what mission circumstances would that trade actually be worth taking?
:::

::: answer
It is worth taking when propellant mass is the binding constraint and time is nearly free — an uncrewed cargo or fuel-depot delivery with no schedule pressure, a mission where the saved propellant mass converts directly into more payload or more Δv margin elsewhere, or a case where the vehicle has no choice but to coast for other reasons (waiting for a planetary alignment, for instance) so the extra time costs nothing additional. It is not worth taking whenever schedule, crew radiation dose, station-keeping propellant burned while coasting, or program risk from a longer mission scale with time — which is most missions, and is exactly why the bi-elliptic transfer is a textbook staple and an operational rarity.
:::

::: check
Sketch, without recomputing, how you would numerically locate the $R = 11.94$ threshold if you did not already know it.
:::

::: answer
Fix $r_1$, and for a range of candidate ratios $R$, compute the Hohmann total Δv and the bi-elliptic total Δv in the limit of a very large $r_b$ (large enough that increasing it further no longer changes the answer to the precision you need — checking that is itself a convergence test). Subtract the two totals as a function of $R$ and find where the difference changes sign; a root-finder (bisection or Brent's method) bracketing that sign change converges on the threshold. This is exactly the calculation behind the $11.9388$ figure quoted in this lesson.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta v_1,\Delta v_3$ | Hohmann-style burns to and from the intermediate apoapsis $r_b$ |
| $\Delta v_2$ | Small tangential correction at $r_b$, raising periapsis from $r_1$ to $r_2$ |
| $r_b \to r_2$ | Bi-elliptic transfer reduces exactly to the Hohmann transfer |
| $R = r_2/r_1 < 11.94$ | Hohmann wins for every $r_b$ |
| $R > 15.58$ | Bi-elliptic wins for every $r_b > r_2$ |
| $11.94 < R < 15.58$ | Depends on $r_b$: small overshoot can lose, generous overshoot can win |
| Case A ($R=8$) | Best possible bi-elliptic still 7.8 % worse than Hohmann's 4.0191 km/s |
| Case B ($R=25$, $r_b=3r_2$) | Saves 3.5 % of Δv, costs about 12$\times$ the transit time |
| Verdict | Real but small Δv savings, large and unavoidable time cost |

The next lesson stays inside the two-impulse world but asks a different question: what if you keep the departure tangential but deliberately choose a transfer orbit that does *not* reach exactly $r_2$ at apoapsis? You will pay more than Hohmann, on purpose, to gain control over exactly when you arrive.
