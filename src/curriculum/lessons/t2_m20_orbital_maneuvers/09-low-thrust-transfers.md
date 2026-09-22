---
id: l09-low-thrust-transfers
title: 'Low-thrust transfers: Edelbaum, spirals, electric propulsion'
minutes: 22
covers:
  - 'low-thrust transfers: Edelbaum, spirals, electric propulsion'
---

The last lesson ended with a burn so weak that "Δv" stopped meaning what it meant everywhere else in this module: at $T/W_0=0.05$, the vehicle's net speed change came out negative even though its orbit had clearly grown. That was not a broken example — it is the ordinary operating condition of an electric thruster, which produces thrust measured in fractions of a newton and takes weeks, not minutes, to move a satellite between orbits. Almost every geostationary satellite launched in the last decade and every Starlink satellite ever deployed spends part of its life on exactly this kind of trajectory. This lesson builds the tool suited to it.

The key move is to stop asking "what is the velocity before and after this burn" — there is no single before-and-after when the burn spans hundreds of revolutions — and instead track the *orbit itself* evolving continuously, a slowly expanding (or contracting, or re-inclining) near-circular spiral, and ask how much total thrusting the whole spiral needs.

## The quasi-circular spiral

Suppose the thrust acceleration $a_T$ is small enough that the orbit stays very close to circular throughout the whole maneuver — the defining feature of electric propulsion, whose accelerations are typically $10^{-5}$ to $10^{-3}\,\mathrm{m/s^2}$, thousands of times weaker than a chemical engine. At each instant the orbit is essentially circular at its current radius $r$, with specific energy $\varepsilon(r) = -\mu/(2r)$ and circular speed $v(r) = \sqrt{\mu/r}$.

Lesson 8 derived a general identity for thrust held along the velocity vector: $\dot\varepsilon = a_T v$, exact regardless of where in the orbit the vehicle is. Combine it with $d\varepsilon/dr = \mu/(2r^2)$ (the derivative of the circular-orbit energy) via the chain rule:
$$
\frac{dr}{dt} = \frac{\dot\varepsilon}{d\varepsilon/dr} = \frac{a_T v}{\mu/(2r^2)} = \frac{2a_T r^2 v}{\mu}.
$$
Now track how the *local circular speed* itself changes as $r$ evolves:
$$
\frac{dv}{dt} = \frac{dv}{dr}\frac{dr}{dt} = \left(-\frac{1}{2}\sqrt{\frac{\mu}{r^3}}\right)\left(\frac{2a_T r^2 v}{\mu}\right) = -a_T ,
$$
using $v = \sqrt{\mu/r}$ to simplify. The result is exact and strikingly simple: the local circular speed falls at a rate of exactly $a_T$, whatever $r$ happens to be. Since raising the orbit only ever increases $r$ (monotonically, for a steady prograde spiral), $v(r)$ falls monotonically too, and integrating $a_T$ over the whole burn — which is exactly what the rocket equation charges as "Δv," the total accumulated $\int a_T\,dt$ — telescopes to
$$
\Delta v = \int a_T\,dt = \big|v(r_1) - v(r_0)\big| = |v_1 - v_0|.
$$
This is Edelbaum's coplanar result, and you have just derived it, not merely quoted it: the total propellant-equivalent Δv of a slow, tangentially-thrusted, quasi-circular spiral between two circular orbits is exactly the difference of their circular speeds — the same simple expression you might have naively guessed for an impulsive transfer, except here it is the *exact* cost of a maneuver that looks nothing like an impulsive one.

::: key Edelbaum's coplanar spiral
$$
\Delta v_{\text{spiral}} = |v_1 - v_0|, \qquad v = \sqrt{\mu/r}.
$$
Exact for a quasi-circular, continuously tangentially-thrusted transfer between two circular orbits, derived from $\dot\varepsilon=a_Tv$ exactly as in lesson 8.
:::

::: example Spiral versus Hohmann, LEO to GEO
$v_0 = 7.7258\,\mathrm{km/s}$ (6678 km), $v_1 = 3.0747\,\mathrm{km/s}$ (GEO). Spiral: $\Delta v = |3.0747-7.7258| = 4.6512\,\mathrm{km/s}$. Hohmann (lesson 2): $3.8926\,\mathrm{km/s}$. The spiral needs $19.5\,\%$ *more* Δv than the two-impulse transfer for the identical radius change. This is not a contradiction of Hohmann's optimality — Hohmann is optimal among impulsive, two-burn transfers, and the spiral is a completely different kind of trajectory, paying continuously for every increment of circular-speed decrease with no equivalent of "coast for free between two efficient burns." Brute continuous accumulation loses to two well-placed impulses, for the same total radius change, every time.
:::

## Adding a plane change

Edelbaum's full 1961 result extends the spiral to include a simultaneous, continuously-steered plane change of total angle $\Delta i$, spread evenly over the whole spiral rather than concentrated at one point:
$$
\Delta v_{\text{spiral}} = \sqrt{v_0^2+v_1^2-2v_0v_1\cos\!\left(\frac{\pi}{2}\Delta i\right)}.
$$
The derivation of the $\pi/2$ factor needs the full optimal-steering calculus-of-variations argument, beyond this lesson's scope, but the formula is easy to check at its boundary: setting $\Delta i=0$ collapses $\cos(0)=1$ and the expression reduces to $\sqrt{v_0^2+v_1^2-2v_0v_1}=|v_1-v_0|$, exactly the coplanar result just derived. The factor $\pi/2$ (rather than $1$, as in the impulsive combined-burn law of cosines) is the mathematical signature of spreading the rotation continuously across the whole spiral instead of concentrating it at a single point — it makes the plane-change contribution costlier per degree than an impulsive rotation at the same instantaneous speed would be, because a continuously-steered thrust vector cannot stay perfectly tangential and rotate the plane at the same time; some of it is always doing one job at the expense of the other.

::: example Adding the LEO-to-GEO plane change
With $\Delta i=28.5^\circ$: $\Delta v_{\text{spiral}} = \sqrt{7.7258^2+3.0747^2-2(7.7258)(3.0747)\cos(14.25^\circ)} = 5.9508\,\mathrm{km/s}$. Compare with the best *impulsive* combination from lesson 5 — Hohmann plus the whole plane change combined into the apogee burn — at $4.2560\,\mathrm{km/s}$. The gap widens further once a plane change is added: $40\,\%$ more Δv for the spiral, against $19.5\,\%$ more for the coplanar case alone.
:::

## Why anyone flies this anyway

Every comparison so far says the spiral needs more Δv. Missions fly it regardless because the rocket equation does not care about Δv alone — it cares about Δv divided by exhaust velocity, and electric thrusters deliver an exhaust velocity four to five times higher than chemical ones. A Hall-effect thruster typically runs $I_{sp}\approx1500\,\mathrm{s}$; a storable bipropellant engine runs $I_{sp}\approx300\,\mathrm{s}$.

::: example Propellant mass, LEO to GEO, chemical Hohmann versus Hall spiral
Chemical, $\Delta v = 3.8926\,\mathrm{km/s}$, $I_{sp}=300\,\mathrm{s}$: propellant fraction $1-e^{-\Delta v/(I_{sp}g_0)} = 73.4\,\%$. Hall, $\Delta v=4.6512\,\mathrm{km/s}$, $I_{sp}=1500\,\mathrm{s}$: propellant fraction $27.1\,\%$ — despite needing *more* Δv, the Hall thruster spends barely a third of the propellant fraction. For a $1000\,\mathrm{kg}$ spacecraft, that is $734\,\mathrm{kg}$ of propellant for the chemical option, leaving $266\,\mathrm{kg}$ for everything else, against $271\,\mathrm{kg}$ of propellant for the Hall option, leaving $729\,\mathrm{kg}$ — nearly three times the mass available for structure and payload, from the same starting mass and a harder Δv requirement. This is the entire commercial case for electric orbit-raising in one comparison.
:::

The Δv penalty itself is also not fixed — it depends on how large a relative change in radius the spiral is making. For a small raise (a 350 km to 550 km LEO adjustment, say), $v_0=7.6970\,\mathrm{km/s}$ and $v_1=7.5851\,\mathrm{km/s}$ give a spiral $\Delta v$ of $111.911\,\mathrm{m/s}$, against a Hohmann total of $111.905\,\mathrm{m/s}$ — indistinguishable. The $19.5\,\%$ penalty seen for LEO-to-GEO is a large-ratio effect; for a modest altitude adjustment the two are essentially the same, and the Isp advantage then comes at almost no Δv cost at all.

Two further reasons, beyond propellant mass, that a constellation operator chooses a slow spiral over an impulsive raise: a satellite deployed at low altitude and spiralling up under its own thruster fails safe — if the thruster or the satellite dies early in the raise, the vehicle is left in a low orbit that decays and re-enters within a few years rather than becoming long-lived debris at the operational altitude. And the weeks the spiral takes are not wasted time: with each satellite in a slightly different orbit (raised on its own schedule), the natural period differences spread the constellation around the plane exactly as the phasing manoeuvres of lesson 7 do deliberately — the slow raise *is* the phasing manoeuvre, for free.

::: warning The spiral's Δv is a total, not a rate
$\Delta v_{\text{spiral}} = |v_1-v_0|$ is the *entire* propellant-equivalent cost of the whole multi-week maneuver, exactly like an impulsive Δv is the entire cost of an instantaneous one. It is not a per-day or per-orbit figure, and it is not the same quantity as the "delivered Δv" of lesson 8's finite-burn analysis, which measured a *shortfall* relative to an impulsive target. Here there is no impulsive target to fall short of — the spiral's own $|v_1-v_0|$ is the number, full stop.
:::

::: warning Quasi-circular is an assumption, not automatic
The derivation assumed the orbit stays essentially circular throughout, valid when $a_T$ is small enough that many orbits pass before the shape changes appreciably. A spiral flown with too much thrust for this assumption (defeating the purpose of using low-thrust hardware in the first place) would build up meaningful eccentricity, and the simple $|v_1-v_0|$ result would no longer be exact.
:::

## Check yourself

::: check
Starting from $\dot\varepsilon = a_T v$ and $\varepsilon(r) = -\mu/(2r)$ for a circular orbit, show that the local circular speed changes at exactly $-a_T$ per unit time, independent of $r$.
:::

::: answer
$d\varepsilon/dr = \mu/(2r^2)$, so $dr/dt = \dot\varepsilon/(d\varepsilon/dr) = a_Tv/(\mu/2r^2) = 2a_Tr^2v/\mu$. With $v=\sqrt{\mu/r}$, $dv/dr = -\tfrac12\sqrt{\mu/r^3} = -\tfrac12\sqrt{\mu}\,r^{-3/2}$, so $dv/dt = (dv/dr)(dr/dt) = \left(-\tfrac12\sqrt{\mu}\,r^{-3/2}\right)\left(2a_Tr^2v/\mu\right)$. Substitute $v=\sqrt{\mu/r}=\sqrt{\mu}\,r^{-1/2}$: the expression becomes $-\tfrac12\sqrt{\mu}\,r^{-3/2}\cdot2a_Tr^2\cdot\sqrt{\mu}\,r^{-1/2}/\mu = -a_T\,r^{-3/2+2-1/2} = -a_T\,r^0 = -a_T$. The $r$-dependence cancels completely.
:::

::: check
A coplanar spiral from a 400 km circular orbit ($r=6778.137\,\mathrm{km}$) to a 700 km circular orbit ($r=7078.137\,\mathrm{km}$) is planned. Compute the Edelbaum Δv and compare it with the Hohmann total for the same radii, and explain why the two are close.
:::

::: answer
$v_0=\sqrt{398\,600.4418/6778.137}=7.6686\,\mathrm{km/s}$, $v_1=\sqrt{398\,600.4418/7078.137}=7.5043\,\mathrm{km/s}$. Edelbaum: $\Delta v=|7.5043-7.6686|=0.1643\,\mathrm{km/s}=164.3\,\mathrm{m/s}$. This is a small relative radius change ($r_2/r_1=1.044$), and this lesson's 350–550 km example showed spiral and Hohmann costs converge for small relative changes — the large gap seen for LEO-to-GEO is specifically a large-radius-ratio effect, so for this modest raise the two should agree closely, unlike the dramatic 19.5% penalty at a 6.3:1 ratio.
:::

::: check
Explain physically why Edelbaum's plane-change formula uses $\cos(\pi\Delta i/2)$ rather than $\cos(\Delta i)$, and confirm the formula still gives the right answer when $\Delta i=0$.
:::

::: answer
An impulsive plane change concentrates the entire rotation into one instant, so the full angle $\Delta i$ appears directly in the law of cosines. A continuously-steered low-thrust spiral spreads the same total rotation across the whole transfer, and at every instant the thrust vector has to split its effort between raising the orbit and rotating the plane, which is less efficient than doing either one at a time — the $\pi/2$ scaling captures that continuous, always-compromised steering. At $\Delta i=0$, $\cos(\pi\cdot0/2)=\cos(0)=1$, and $\sqrt{v_0^2+v_1^2-2v_0v_1}=|v_1-v_0|$, exactly the coplanar result — the formula correctly has no plane-change penalty left when there is no plane change to make.
:::

::: check
A satellite operator is choosing between a chemical apogee-kick motor and a Hall-thruster spiral for the same LEO-to-GEO mission, and a junior engineer argues the chemical option must be better because it needs less total Δv. What is missing from that argument?
:::

::: answer
Δv alone does not determine propellant mass — the rocket equation makes propellant fraction a function of $\Delta v/I_{sp}$, and Hall thrusters run roughly five times the specific impulse of a chemical engine. This lesson's worked comparison showed the chemical option, despite needing 16% less Δv, consumes nearly three times the propellant fraction of the Hall option, because the Isp advantage far outweighs the Δv penalty. The junior engineer's comparison is also incomplete operationally: it ignores the fail-safe low-altitude deployment and free constellation-phasing benefits of a slow raise.
:::

::: check
Why does the derivation of $\Delta v_{\text{spiral}}=|v_1-v_0|$ break down if the thrust is not kept tangential (aligned with the velocity vector) throughout the spiral?
:::

::: answer
The entire derivation rests on $\dot\varepsilon=a_Tv$, which lesson 8 showed holds only when thrust is aligned with the instantaneous velocity vector — any other direction leaves a nonzero gravitational contribution in the energy-rate equation, so $\dot\varepsilon$ would no longer equal $a_Tv$ exactly. Without that identity, the chain-rule argument connecting $dr/dt$, $\dot\varepsilon$, and $dv/dt$ no longer telescopes cleanly, and the simple result $|v_1-v_0|$ no longer holds exactly — a poorly-steered spiral would cost more than this lesson's formula predicts.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta v_{\text{spiral}} = \lvert v_1-v_0\rvert$ | Edelbaum coplanar spiral, exact for quasi-circular, tangentially-thrusted transfers |
| $\Delta v_{\text{spiral}} = \sqrt{v_0^2+v_1^2-2v_0v_1\cos(\pi\Delta i/2)}$ | With a simultaneous, continuously-steered plane change |
| LEO$\to$GEO coplanar | Spiral 4.6512 km/s vs Hohmann 3.8926 km/s — 19.5% more |
| LEO$\to$GEO with 28.5° | Spiral 5.9508 km/s vs best impulsive 4.2560 km/s — 40% more |
| Propellant mass, 1000 kg | Chemical (300 s): 734 kg; Hall (1500 s): 271 kg — despite more Δv needed |
| Small raise (350$\to$550 km) | Spiral and Hohmann Δv nearly identical — the penalty is a large-ratio effect |
| Non-Δv reasons for spiraling | Fail-safe low deployment altitude; the raise doubles as constellation phasing |

Lessons 8 and 9 both asked what happens when a burn cannot be treated as an instant. The remaining lessons turn to the operational side of the same question: keeping a satellite where it belongs once it has arrived, and the family of maneuvers — station-keeping, drift orbits, disposal — that never stop for the rest of a mission's life.
