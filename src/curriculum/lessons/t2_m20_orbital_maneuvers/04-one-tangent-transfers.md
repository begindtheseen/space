---
id: l04-one-tangent-transfers
title: One-tangent transfers
minutes: 18
covers:
  - one-tangent burns
---

The Hohmann transfer has no free parameters. Fix the departure and arrival radii and everything else – both burns, the time of flight – follows automatically. That rigidity is fine when nothing else constrains the mission, but real missions often do have another constraint: rendezvous with a target that is somewhere specific at a specific time, or a launch window that closes before a five-hour Hohmann coast would even reach apogee. A one-tangent transfer buys back control over the arrival time by giving up the second half of what made Hohmann cheap – tangency at arrival – and paying for that with extra Δv.

This lesson builds the one-tangent family, shows how the extra cost trades against the time saved, and along the way gives you a numerical check on the optimality claim from lesson 2: within this family, moving away from the tangent-tangent (Hohmann) endpoint only ever costs more.

## Building the one-tangent transfer

Keep the departure tangential – the burn at $r_1$ still points straight along the local circular velocity, so $r_1$ is still the periapsis of the transfer ellipse. What changes is the choice of transfer orbit: instead of picking the ellipse whose apoapsis lands exactly on $r_2$, choose an apoapsis $r_a > r_2$, and accept arrival at $r_2$ *before* the vehicle reaches that apoapsis, while it is still climbing and its velocity still has a radial component.

With $r_a$ chosen, the transfer ellipse is fixed:
$$
a_t = \frac{r_1+r_a}{2}, \qquad e = \frac{r_a-r_1}{r_a+r_1}, \qquad p = a_t(1-e^2).
$$
The departure burn is tangential exactly as in a Hohmann transfer, using vis-viva at periapsis:
$$
\Delta v_1 = \sqrt{\mu\left(\frac{2}{r_1}-\frac{1}{a_t}\right)} - \sqrt{\frac{\mu}{r_1}}.
$$

Finding the arrival point means solving the orbit equation for the true anomaly $\nu_2$ at which the ellipse first reaches $r_2$ (the crossing before apoapsis, where the vehicle is still climbing):
$$
r_2 = \frac{p}{1+e\cos\nu_2} \quad\Longrightarrow\quad \cos\nu_2 = \frac{p/r_2 - 1}{e}.
$$
At that point the transfer orbit's speed is $v_2 = \sqrt{\mu(2/r_2 - 1/a_t)}$ from vis-viva, but unlike at an apsis, the velocity is *not* purely tangential: it has a flight-path angle
$$
\gamma_2 = \arctan\!\left(\frac{e\sin\nu_2}{1+e\cos\nu_2}\right)
$$
above the local horizontal – the same relation used for apsidal rotation later in this module. The target circular orbit's velocity at $r_2$ is purely horizontal, so the arrival burn has to rotate the flight path by $\gamma_2$ as well as match speeds, which is exactly the combined-burn law of cosines from lesson 1:
$$
\Delta v_2 = \sqrt{v_2^2 + v_{2,\text{circ}}^2 - 2\,v_2\,v_{2,\text{circ}}\cos\gamma_2}, \qquad v_{2,\text{circ}} = \sqrt{\frac{\mu}{r_2}}.
$$

Time of flight uses the eccentric anomaly from the Kepler's-equation machinery of the last module: convert $\nu_2$ to $E_2$, then to mean anomaly $M_2 = E_2 - e\sin E_2$, and $t = M_2/n$ with $n = \sqrt{\mu/a_t^3}$.

::: example A modest one-tangent transfer, LEO to GEO
$r_1 = 6678\,\mathrm{km}$, $r_2 = 42\,164\,\mathrm{km}$, and choose $r_a = 1.05\,r_2 = 44\,272.2\,\mathrm{km}$ – overshooting the target radius by only 5 %. Then $a_t = 25\,475.1\,\mathrm{km}$, $e = 0.7379$, $p = 11\,605.4\,\mathrm{km}$. Departure speed $v_p = \sqrt{\mu(2/r_1-1/a_t)} = 10.1848\,\mathrm{km/s}$, so $\Delta v_1 = 10.1848 - 7.7258 = 2.4590\,\mathrm{km/s}$ – barely more than the Hohmann value of $2.4258$. Solving for the crossing gives $\nu_2 = 169.19^\circ$ (close to apoapsis, as expected for a small overshoot), where $v_2 = 1.8057\,\mathrm{km/s}$ and $\gamma_2 = 26.70^\circ$. The arrival burn is $\Delta v_2 = \sqrt{1.8057^2+3.0747^2-2(1.8057)(3.0747)\cos 26.70^\circ} = 1.6717\,\mathrm{km/s}$ – noticeably more than Hohmann's $1.4668$, because this burn has to rotate the flight path by nearly $27^\circ$ on top of changing speed. Total Δv is $4.1307\,\mathrm{km/s}$, 6.1 % more than Hohmann's $3.8926$. But the time of flight, from $M_2 = 133.15^\circ$ and $n=\sqrt{\mu/a_t^3}$, is $t = 14\,967\,\mathrm{s} = 4.157\,\mathrm{h}$ – over an hour faster than Hohmann's 5.275 hours, bought for about 24 m/s per minute saved.
:::

::: example A more aggressive one-tangent transfer
Push $r_a$ out to $1.30\,r_2 = 54\,813.2\,\mathrm{km}$. Now $a_t = 30\,745.6\,\mathrm{km}$, $e = 0.7828$, and the crossing moves further from apoapsis, to $\nu_2 = 156.46^\circ$, with $v_2 = 2.4378\,\mathrm{km/s}$ and a much steeper flight-path angle $\gamma_2 = 47.92^\circ$. Departure burn $\Delta v_1 = 2.5898\,\mathrm{km/s}$; arrival burn, now rotating the flight path by nearly $48^\circ$, jumps to $\Delta v_2 = 2.3129\,\mathrm{km/s}$. Total Δv is $4.9027\,\mathrm{km/s}$ – 26.0 % more than Hohmann – for a time of flight of $t = 11\,750\,\mathrm{s} = 3.264\,\mathrm{h}$, two hours faster than Hohmann. Compare the two examples: overshooting by 30 % rather than 5 % saved less than an extra hour of flight time but multiplied the Δv penalty by more than four. The cost of buying back arrival-time control rises steeply, not linearly.
:::

::: key One-tangent transfer
Departure stays tangential at $r_1$; the transfer orbit's apoapsis $r_a > r_2$ is a free design parameter. Arrival is non-tangential, at flight-path angle $\gamma_2 = \arctan\!\big(e\sin\nu_2/(1+e\cos\nu_2)\big)$, costing $\Delta v_2 = \sqrt{v_2^2+v_{2,\text{circ}}^2-2v_2v_{2,\text{circ}}\cos\gamma_2}$. As $r_a \to r_2$, $\gamma_2 \to 0$ and the transfer reduces to Hohmann.
:::

## Confirming optimality, numerically

Lesson 2 claimed Hohmann is Δv-minimal among *all* two-impulse coplanar circle-to-circle transfers, tangential or not, and promised a numerical check here. The one-tangent family gives you a controlled slice of that claim: hold departure tangential and sweep $r_a$ away from $r_2$. Every value tried above, $r_a = 1.05\,r_2$ and $r_a = 1.30\,r_2$, cost *more* total Δv than the $r_a = r_2$ (Hohmann) case, never less, and the trend continues – the further $r_a$ moves from $r_2$, the larger the penalty. This is consistent with (though narrower than) the full theorem: within the one-parameter family reachable by keeping the departure tangential, the Hohmann transfer sits at the Δv minimum, and every direction away from it – overshooting to arrive sooner – costs strictly more.

::: warning Overshoot only, in this lesson
The derivation above assumes $r_a > r_2$ and arrival *before* apoapsis, which is the common case for shortening the time of flight. A one-tangent transfer can also be built with $r_a < r_2$, arriving on the way *down* toward periapsis after passing apoapsis (useful when you want to arrive later than Hohmann, or your target orbit is reached on a descending leg) — the true anomaly of arrival then exceeds $180°$, but the same orbit-equation and flight-path-angle formulas apply unchanged.
:::

::: warning Non-tangential arrival is a real burn, not a bookkeeping detail
It is tempting to compute $\Delta v_2$ as if only the speed mismatch $v_{2,\text{circ}} - v_2$ mattered. The flight-path angle $\gamma_2$ is not optional: skipping it under-predicts the arrival burn by a wide margin whenever $\gamma_2$ is more than a few degrees, exactly as the vector-addition warning of lesson 1 first showed.
:::

## Check yourself

::: check
Explain, in one or two sentences, what a one-tangent transfer trades for control over the arrival time.
:::

::: answer
It gives up tangency at arrival. The departure burn is still tangential and as cheap as it can be, but the transfer ellipse is chosen with an apoapsis beyond the target radius, so the vehicle reaches the target radius while still climbing, with a nonzero flight-path angle. The arrival burn must then rotate the velocity vector as well as change its magnitude, which by the law of cosines costs strictly more than a purely tangential burn achieving the same net change — and in exchange, the time of flight is no longer pinned to the single value a Hohmann transfer would give.
:::

::: check
For the $r_a = 1.05\,r_2$ example, why is $\gamma_2$ as large as $26.7^\circ$ even though the transfer orbit's apoapsis is only 5 % beyond $r_2$?
:::

::: answer
Flight-path angle depends on how far around the ellipse (in true anomaly) the crossing point is, not directly on how far the apoapsis overshoots the target radius in absolute terms. Here the crossing happens at $\nu_2 = 169.2^\circ$, only about $11^\circ$ of true anomaly short of apoapsis — but the orbit equation $r = p/(1+e\cos\nu)$ is fairly flat near apoapsis for a highly eccentric ellipse ($e=0.738$ here), so a modest change in $\nu$ near apoapsis corresponds to only a small change in $r$, while the flight-path angle (which depends on $\sin\nu$ and $\cos\nu$ directly) can still be substantial. A small radial overshoot does not guarantee a small angular one.
:::

::: check
Sketch how you would use a one-tangent transfer, rather than a Hohmann transfer, to rendezvous with a target that will only be at the arrival radius at a specific future time that a Hohmann transfer's fixed time of flight cannot hit.
:::

::: answer
Compute the Hohmann time of flight and compare it with the time available before the target reaches the rendezvous point. If the target will arrive sooner than the Hohmann transfer, choose $r_a > r_2$ and increase it until the one-tangent transfer's time of flight matches the time available, accepting the resulting Δv penalty; if the target arrives later, you would instead choose a transfer that takes *longer* than Hohmann (for instance the $r_a < r_2$, arrival-after-apoapsis case). Either way, $r_a$ is the dial you turn until the time of flight matches the requirement, and the resulting extra Δv is simply read off from the formulas in this lesson once $r_a$ is fixed.
:::

::: check
Between the two worked examples, $r_a=1.05r_2$ saved about $1.12\,\mathrm{h}$ over Hohmann for a Δv penalty of about $238\,\mathrm{m/s}$, while $r_a=1.30r_2$ saved about $2.01\,\mathrm{h}$ for a penalty of about $1010\,\mathrm{m/s}$. What does this tell you about choosing $r_a$ in practice?
:::

::: answer
The exchange rate worsens sharply as $r_a$ grows: the first example buys roughly 210 m/s per hour saved, the second roughly 500 m/s per hour saved — more than twice as expensive per hour, for a smaller additional time saving than the first hour bought. In practice this means it is worth pushing $r_a$ out only as far as the mission timeline actually requires; choosing a far larger $r_a$ than needed "just in case" spends Δv at a rapidly worsening rate for schedule margin that may not be needed.
:::

::: check
A one-tangent transfer is proposed with $r_a$ chosen so that the arrival crossing happens exactly at $\nu_2 = 180^\circ$. What transfer does this reduce to, and why?
:::

::: answer
$\nu_2 = 180^\circ$ is apoapsis itself, so $r_2$ must equal $r_a$ — the transfer orbit's apoapsis lands exactly on the target radius, which is the Hohmann transfer. At $\nu_2=180^\circ$, $\sin\nu_2 = 0$ so $\gamma_2 = 0$: the arrival is tangential after all, consistent with Hohmann being the $r_a \to r_2$ limit of this family.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $r_a > r_2$ | Free parameter: transfer orbit's apoapsis, chosen beyond the target radius |
| $\cos\nu_2 = (p/r_2-1)/e$ | True anomaly where the transfer orbit crosses the target radius |
| $\gamma_2 = \arctan\!\big(e\sin\nu_2/(1+e\cos\nu_2)\big)$ | Flight-path angle at arrival; zero only in the Hohmann limit |
| $\Delta v_2 = \sqrt{v_2^2+v_{2,\text{circ}}^2-2v_2v_{2,\text{circ}}\cos\gamma_2}$ | Non-tangential arrival burn, law of cosines |
| $r_a=1.05r_2$ example | +6.1 % Δv, saves 1.12 h versus Hohmann |
| $r_a=1.30r_2$ example | +26.0 % Δv, saves 2.01 h versus Hohmann |
| Optimality check | Every $r_a \neq r_2$ tried costs more than Hohmann — consistent with lesson 2's global claim |

Lessons 2 through 4 have stayed entirely coplanar. The next lesson drops that restriction and asks the most operationally important question in this module: what does it cost to change the *plane* an orbit is in, and where in the orbit should you pay it.
