---
id: l06-the-entry-corridor
title: "The entry corridor: undershoot and overshoot"
minutes: 17
covers:
  - "the entry corridor: undershoot and overshoot boundaries"
---

Every entry vehicle is aimed. Before atmospheric interface, mission design chooses a target flight-path angle, and navigation works to deliver the vehicle within some tolerance of it. That tolerance cannot be arbitrarily loose, because entry angle has two failure modes on either side of it, and this module now has, for the first time, the tools to find exactly where they are. Too shallow, and the vehicle — as lesson 3's numerical model already hinted, through the same centrifugal-relief term that lets $\dot\gamma$ turn positive — never decelerates enough to stay down, and skips back out past the entry interface on a trajectory that may not return for a very long time, if ever. Too steep, and the vehicle drives itself past whatever peak deceleration or peak heat rate its structure and thermal protection system can survive. The band of angles between these two failures is the **entry corridor**, and this lesson computes its width, in degrees, for a stated vehicle and a stated pair of limits — and shows that width shrinking toward nothing as entry speed climbs.

## The two walls, defined precisely

The **overshoot boundary** is the shallowest entry angle for which the vehicle still gets captured — decelerates enough during its first pass through the atmosphere that it does not climb back out past the $120\ \mathrm{km}$ interface. Shallower than this, the vehicle skips: it dips into the atmosphere, loses some energy, and re-emerges on a trajectory that carries it back above the interface, deferring (or entirely losing) the entry it was supposed to fly. This module's spherical, non-rotating truth model (lesson 3) is exactly the right tool to find this boundary, because the skip mechanism it captures — the $v/r$ centrifugal-relief term in $\dot\gamma$ competing against the $g/v$ term that turns the flight path down — is precisely the physics a flat-planet or closed-form treatment cannot represent at all.

The **undershoot boundary** is the steepest entry angle before some stated structural or thermal limit is exceeded. This lesson uses two limits together, since either can bind depending on entry speed: a peak deceleration limit of $10\,g_0$ (representative of a crewed vehicle's short-duration structural and physiological tolerance) and a peak heat-rate limit of $300\ \mathrm{W/cm^2}$ (representative of an ablative heat shield sized for that flux, consistent with the numbers lesson 4 worked out). Between the overshoot and undershoot walls lies the corridor: every angle in it captures the vehicle without exceeding either stated limit; every angle outside it fails one way or the other.

::: key The entry corridor
$$
\text{corridor width} = |\gamma_{\text{undershoot}}| - |\gamma_{\text{overshoot}}|,
$$
the gap between the steepest angle a stated $g$-limit or heat-rate limit allows and the shallowest angle that still avoids skipping back out of the atmosphere. Fly steeper than the undershoot wall and something breaks; fly shallower than the overshoot wall and the vehicle does not stay down.
:::

## The demonstration vehicle

Every number in this lesson is computed for one stated vehicle, so that "corridor width" means something specific rather than a vague generality: $\beta = 200\ \mathrm{kg/m^2}$, nose radius $R_n = 0.5\ \mathrm{m}$, limits of $10\,g_0$ peak deceleration and $300\ \mathrm{W/cm^2}$ peak heat rate. For each entry speed $v_E$, the overshoot boundary is found by bisecting on skip-versus-capture using the full numerically integrated trajectory, and the two undershoot candidates ($g$-limit and $q$-limit crossings) are each found by root-finding on the numerically integrated peak deceleration and peak heat rate as functions of $\gamma_E$ — the same machinery lesson 3 validated and lesson 5 exercised, applied here to answer a genuinely new question.

## Corridor width narrows as entry speed rises

| $v_E$ (m/s) | overshoot wall | undershoot wall | binding limit | corridor width |
| --- | --- | --- | --- | --- |
| $7800$ | none (sub-circular) | $-2.60^\circ$ | $g$-limit | open |
| $9000$ | $-3.30^\circ$ | $-4.40^\circ$ | $g$-limit | $1.10^\circ$ |
| $10{,}000$ | $-4.43^\circ$ | $-5.19^\circ$ | $g$-limit | $0.77^\circ$ |
| $11{,}000$ | $-5.16^\circ$ | $-5.25^\circ$ | $q$-limit | $0.086^\circ$ |

Every wall in this table was cross-checked: at each computed $g$-limit wall the peak deceleration comes out to $10.000\,g_0$ exactly, and at each $q$-limit wall the peak heat rate comes out to $300.00\ \mathrm{W/cm^2}$ exactly, and the corridor widths are unchanged to four significant figures under tighter integration tolerance and root-finder precision. The trend across the table is the headline result: the corridor collapses from just over a degree at $9000\ \mathrm{m/s}$ to less than a tenth of a degree at $11{,}000\ \mathrm{m/s}$, and the *reason* it is binding shifts along the way — from the deceleration limit to the heat-rate limit — because heating rises with the cube of speed while deceleration rises only with its square, so a faster entry reaches the thermal limit at a shallower angle than it reaches the structural one.

The $7800\ \mathrm{m/s}$ row deserves its own comment. Local circular speed at the $120\ \mathrm{km}$ interface is $\sqrt{\mu/r} = 7832\ \mathrm{m/s}$ (using Earth's $\mu$ and the interface radius from lesson 1); an entry arriving *below* that speed does not carry enough energy to skip back out no matter how shallow the angle, because even an undisturbed trajectory that grazes the atmosphere cannot climb back above where it started without adding energy, and drag only ever removes it. Sweeping the entry angle down to a few hundredths of a degree in this model never produces a skip below about $7850$–$7900\ \mathrm{m/s}$ — confirming the threshold sits almost exactly at the local circular speed. Below that threshold the corridor is genuinely one-sided: only the steep wall exists, and this is part of why a routine LEO cargo or crew return, entering near circular speed, has historically been treated as a far more forgiving entry-angle problem than a lunar or Mars return.

::: example Reading one row of the table
At $v_E = 9000\ \mathrm{m/s}$: fly shallower than $-3.30^\circ$ and the vehicle skips back out past $120\ \mathrm{km}$ instead of staying down. Fly steeper than $-4.40^\circ$ and peak deceleration exceeds $10\,g_0$ — confirmed directly: at $\gamma_E = -4.40^\circ$ the numerically integrated peak deceleration is $10.00\,g_0$, and at that same point peak heat rate is only $225\ \mathrm{W/cm^2}$, comfortably under the $300\ \mathrm{W/cm^2}$ limit, which is exactly why the $g$-limit — not the $q$-limit, reached only at $-5.82^\circ$ — is what actually binds here. The flyable band is $1.10^\circ$ wide, and a spot check just inside it, at $-3.32^\circ$, gives $8.4\,g_0$ and $111\ \mathrm{W/cm^2}$: comfortably under both limits, confirming the corridor interior is not a knife edge but a genuine range with margin at its centre.
:::

## Why the corridor narrows: a second look at centrifugal relief

The naive expectation, built from the Allen-Eggers closed form of lesson 2, is that peak deceleration at a *fixed* entry angle simply rises with the square of entry speed — a faster vehicle hitting the same angle should decelerate harder, straightforwardly. Near the corridor, at the entry-energy levels this lesson's undershoot wall lives at, that expectation is not just quantitatively wrong, as lesson 3 already found — it can be qualitatively backwards.

::: example Higher entry speed, weaker peak deceleration, same angle
Hold $\gamma_E = -4.5^\circ$ fixed and raise $v_E$: at $9000\ \mathrm{m/s}$ the numerically integrated peak deceleration is $10.53\,g_0$; at $10{,}000\ \mathrm{m/s}$, faster, it *falls* to $7.57\,g_0$; at $11{,}000\ \mathrm{m/s}$ the trajectory does not produce a peak at all in the capture sense — it skips. The closed form would predict the opposite direction entirely: $a_{\max}\propto v_E^2$ says the $10{,}000\ \mathrm{m/s}$ case should be $(10{,}000/9000)^2 = 1.23$ times *larger*, not smaller.
:::

The mechanism is the same $v/r - g/v$ term lesson 3 identified inside $\dot\gamma$. As $v_E$ rises toward and past local circular speed, that term grows quickly — $v/r$ scales with $v^2$ while $g/v$ falls with $v$ — so the flight path resists steepening far more strongly at high energy than at low energy, for the identical starting angle. Physically, a $-4.5^\circ$ entry at $9000\ \mathrm{m/s}$ is a meaningfully sub-orbital dive; the same $-4.5^\circ$ entry at $10{,}000$ or $11{,}000\ \mathrm{m/s}$ is a much shallower cut relative to how much orbital energy the vehicle actually carries, and centrifugal relief holds the trajectory closer to a graze than a dive. This is exactly why the undershoot wall in the table above gets *steeper*, not shallower, as $v_E$ rises: reaching the same $10\,g_0$ at higher energy requires a steeper angle, because the vehicle is progressively harder to make dig in. The overshoot wall steepens for the same reason and by a comparable amount, and it is the difference between two quantities both moving in the same direction, by similar but not identical amounts, that produces the shrinking corridor width — not one wall holding still while the other moves.

::: warning The Allen-Eggers closed form cannot be used to size a corridor
Lesson 3 already showed the closed form's error grows large in exactly the shallow-entry regime where corridor walls live, and this lesson's fixed-angle example shows the closed form can get the *direction* of a trend wrong there, not just its magnitude. Corridor sizing is a job for the numerically integrated model from the start; the closed form remains useful for the intuition it built in lessons 2 through 5, not for the final number here.
:::

## What sets the numbers used here

The specific limits chosen — $10\,g_0$ and $300\ \mathrm{W/cm^2}$ — are stated design points for this demonstration, not universal constants; a different crewed-vehicle structural limit or a different heat-shield material shifts the undershoot wall and therefore the width, though the qualitative narrowing trend with entry speed does not depend on the particular numbers chosen. What is not a free choice is the overshoot wall's location relative to local circular speed, which follows from orbital mechanics rather than from any vehicle property, and the direction in which the corridor narrows: faster entries always carry more specific energy to shed, and every mechanism this module has derived — deceleration, heating, and now centrifugal relief — responds to that extra energy by squeezing the range of angles that thread capture and survival at once.

## Check yourself

::: check
Define the overshoot boundary and the undershoot boundary of an entry corridor in one sentence each, and state which physical mechanism sets each one.
:::

::: answer
The overshoot boundary is the shallowest entry angle that still results in capture rather than skipping back out past the entry interface, set by the balance between drag-driven deceleration and the centrifugal-relief term in $\dot\gamma$ that resists the flight path steepening. The undershoot boundary is the steepest entry angle before a stated structural (peak deceleration) or thermal (peak heat rate) limit is exceeded, set by whichever of those two limits is reached at the shallower angle for the entry speed in question.
:::

::: check
For the stated demonstration vehicle at $v_E = 11{,}000\ \mathrm{m/s}$, which limit binds the undershoot wall, and why does that differ from the binding limit at $v_E = 9000\ \mathrm{m/s}$?
:::

::: answer
At $11{,}000\ \mathrm{m/s}$ the heat-rate limit binds (undershoot wall at $-5.25^\circ$, where peak heat rate reaches $300\ \mathrm{W/cm^2}$ before peak deceleration reaches $10\,g_0$); at $9000\ \mathrm{m/s}$ the deceleration limit binds instead (undershoot wall at $-4.40^\circ$). The switch happens because peak heat rate scales roughly with the cube of entry speed while peak deceleration scales with its square, so the thermal limit grows faster than the structural one as entry speed rises, eventually overtaking it as the tighter constraint.
:::

::: check
Why does a LEO-return entry at $7800\ \mathrm{m/s}$ have no overshoot wall at all in this model, while a lunar-return entry at $11{,}000\ \mathrm{m/s}$ has a very real one?
:::

::: answer
Local circular speed at the $120\ \mathrm{km}$ entry interface is about $7832\ \mathrm{m/s}$. An entry below that speed does not carry enough specific energy to climb back above the interface after dipping into the atmosphere and losing some energy to drag, no matter how shallow the entry angle — the trajectory simply cannot skip. A lunar-return entry arrives well above local circular speed, carrying enough energy that a sufficiently shallow, sufficiently brief pass through the atmosphere can still leave it on a trajectory that climbs back out, which is exactly the skip mechanism that defines a real overshoot wall.
:::

::: check
A fixed entry angle of $-4.5^\circ$ produces a lower peak deceleration at $10{,}000\ \mathrm{m/s}$ than at $9000\ \mathrm{m/s}$, contrary to the closed-form expectation that peak deceleration should scale as $v_E^2$. Explain why, without appealing to the closed form at all.
:::

::: answer
The closed form assumes the flight-path angle stays frozen at its entry value, which lesson 3 already showed fails badly in exactly this shallow-entry regime. In the full model, the $\dot\gamma$ equation contains a centrifugal-relief term that grows quickly with entry speed (scaling as $v^2/r$) and resists the flight path steepening; at higher entry speed, the same nominal angle corresponds to a trajectory that is effectively closer to a graze than a dive, decelerating less, not more, than the same angle would at a lower entry speed where that relief term is weaker.
:::

::: check
A mission is designing a heat shield and asks whether raising the peak heat-rate limit from $300$ to $400\ \mathrm{W/cm^2}$ (a better material) would help widen the corridor at $v_E = 11{,}000\ \mathrm{m/s}$, given that the $q$-limit is what binds there. Reason qualitatively about the effect, without recomputing the boundary.
:::

::: answer
Raising the heat-rate limit relaxes the undershoot wall, allowing a steeper entry angle before the (now higher) thermal limit is reached, which by itself widens the corridor on the steep side. But it only helps up to the point where the *other* limit, peak deceleration at $10\,g_0$, takes over as the binding constraint instead — beyond that point, a still-better heat shield buys no further widening, because the undershoot wall has become the $g$-limit wall, which at this vehicle and entry speed sits at $-5.71^\circ$ (from the table). The corridor cannot widen past whichever limit becomes binding once the other has been relaxed.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Overshoot boundary | Shallowest capturing entry angle; shallower skips back past the interface |
| Undershoot boundary | Steepest entry angle before a stated $g$-limit or heat-rate limit is exceeded |
| Demonstration vehicle | $\beta = 200\ \mathrm{kg/m^2}$, $R_n = 0.5\ \mathrm{m}$; limits $10\,g_0$, $300\ \mathrm{W/cm^2}$ |
| Corridor width at $9000/10{,}000/11{,}000\ \mathrm{m/s}$ | $1.10^\circ$ / $0.77^\circ$ / $0.086^\circ$ — narrows sharply as entry speed rises |
| Binding limit shifts with speed | $g$-limit at lower entry speeds; $q$-limit at higher, since heating grows faster ($\propto v^3$) than deceleration ($\propto v^2$) |
| Local circular speed at $120\ \mathrm{km}$ | $7832\ \mathrm{m/s}$ — below this, no overshoot wall exists at any angle |
| Why the corridor narrows | Both walls steepen with rising entry speed via centrifugal relief in $\dot\gamma$; they steepen at different rates and converge |

The next lesson introduces a second control the vehicle can use to fight this narrowing — lift — and shows, with the same numerical machinery, how much room a modest lift-to-drag ratio buys back.
