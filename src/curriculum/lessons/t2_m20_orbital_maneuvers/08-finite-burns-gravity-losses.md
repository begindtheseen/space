---
id: l08-finite-burns-gravity-losses
title: Finite burns and gravity losses
minutes: 20
covers:
  - finite-burn and gravity losses
---

Lesson 1 estimated, roughly, when a real burn is short enough to treat as impulsive: compare its duration with the orbital period, and if the swept angle is a few degrees, the impulsive Δv is probably a fair approximation. This lesson replaces the estimate with an actual simulation, takes one of the transfers built earlier in this module, flies its first burn at a stated thrust-to-weight instead of instantaneously, and measures exactly what the impulsive approximation costs — in propellant, and in the orbit you actually end up on.

The physics behind the cost has an elegant piece hiding in it. You might expect a finite burn to simply "waste" energy fighting gravity, the way climbing a hill wastes some of a car's engine power. That is not quite what happens. For a burn that stays pointed along the instantaneous velocity vector — the efficient choice, and the one this lesson uses throughout — the orbit's specific energy grows at exactly the rate you would predict from the thrust alone, no loss at all. What falls short is the raw *speed*, and therefore the Δv the rocket equation promised. Understanding why those two statements are both true is most of the lesson.

## Why energy is exact but speed is not

Let thrust produce an acceleration of magnitude $a_T = T/m$, always pointed along the unit velocity vector $\hat{\mathbf{v}}$. The full acceleration is $\mathbf{a} = -\mu\mathbf{r}/r^3 + a_T\hat{\mathbf{v}}$. Specific energy is $\varepsilon = v^2/2 - \mu/r$, and its rate of change is $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a} + \mu\dot r/r^2$. The gravity term in $\mathbf{v}\cdot\mathbf{a}$ is $-\mu(\mathbf{v}\cdot\hat{\mathbf{r}})/r^2 = -\mu\dot r/r^2$ (since $\dot r = \mathbf{v}\cdot\hat{\mathbf{r}}$), which exactly cancels the added $\mu\dot r/r^2$ term. What remains is
$$
\dot\varepsilon = a_T\,v ,
$$
independent of position in the orbit. Thrust aligned with velocity converts every watt of it into orbital energy, with no geometric penalty anywhere.

Now do the same for the *speed* alone, using $v\,\dot v = \mathbf{v}\cdot\mathbf{a}$ (the general identity for the derivative of a vector's magnitude). Writing $\gamma$ for the flight-path angle (velocity's angle above the local horizontal, so $\mathbf{v}\cdot\hat{\mathbf{r}} = v\sin\gamma$), the gravity term contributes $-\mu\sin\gamma/r^2$ and the thrust term contributes $a_T$:
$$
\dot v = a_T - \frac{\mu}{r^2}\sin\gamma .
$$
At an apsis, $\gamma=0$ and speed grows at the full $a_T$ — no loss at that instant. Anywhere else, if the vehicle is climbing ($\gamma>0$), speed grows more slowly than $a_T$ alone would give. This is precisely the gravity-loss integral from the rocket-and-ascent-losses material earlier in the curriculum, $\int (\mu/r^2)\sin\gamma\,dt$, with the constant surface gravity $g$ replaced by the position-dependent $\mu/r^2$ and the ascent flight-path angle replaced by the orbital one. The energy books balance exactly; the *speed* books, which is what a Δv budget actually promises, do not — and the difference is what this lesson measures.

::: key Energy is exact, speed is not
For thrust aligned with the velocity vector, $\dot\varepsilon = a_T v$ exactly, at every point of the burn. But $\dot v = a_T - (\mu/r^2)\sin\gamma$, so speed — and therefore the delivered Δv — falls short of the "ideal" $a_T\,t_b$ by $\int(\mu/r^2)\sin\gamma\,dt$ wherever the burn spends time away from an apsis. This is the finite-burn gravity loss.
:::

## Setting up the experiment

Take the LEO departure burn from lesson 2: circular orbit at $r_1=6678\,\mathrm{km}$, $v_1=7.7258\,\mathrm{km/s}$, target impulsive $\Delta v_1 = 2.4258\,\mathrm{km/s}$ onto the transfer ellipse toward GEO. Model a real engine: constant thrust $T$, constant specific impulse $I_{sp}=320\,\mathrm{s}$ (a typical storable-bipropellant value), mass depleting by the rocket equation, $\dot m = -T/(I_{sp}g_0)$. The "ideal" Δv this propellant buys, $I_{sp}g_0\ln(m_0/m_f)$, is fixed at the same $2.4258\,\mathrm{km/s}$ across every case in this lesson, so every run spends the identical propellant fraction ($53.84\,\%$ of the initial mass) — burns differ only in how quickly they spend it, set by the initial thrust-to-weight ratio $T/W_0 = a_{T,0}/g_0$.

Integrating the resulting equations of motion (six states plus mass, thrust always along $\hat{\mathbf v}$) with an adaptive eighth-order integrator and checking the result against a substantially tighter tolerance confirms the numbers below are converged to well beyond the precision quoted — the loss and the final orbit stop changing at the sub-millimetre-per-second, sub-metre level once the tolerance is tightened further, so what follows is the physics, not integrator noise.

::: example A modest engine, $T/W_0 = 0.3$
Burn duration $574.3\,\mathrm{s}$ (9.57 min), sweeping $42.4^\circ$ of true anomaly — a sizeable arc, well beyond the "few degrees" comfort zone of lesson 1's rule of thumb. Delivered speed change: $2.1688\,\mathrm{km/s}$, against the ideal $2.4258\,\mathrm{km/s}$ — a gravity loss of $257.0\,\mathrm{m/s}$, or $10.6\,\%$ of the intended Δv. The resulting orbit's apoapsis comes out at $40\,957.3\,\mathrm{km}$, short of the impulsive target of $42\,164\,\mathrm{km}$ by $1206.7\,\mathrm{km}$ ($2.9\,\%$), and even the burnout point's radius has drifted to $6743.4\,\mathrm{km}$, $65\,\mathrm{km}$ beyond the intended $6678\,\mathrm{km}$ periapsis, because the vehicle is still climbing when the engine cuts off.
:::

::: example A stronger stage, $T/W_0 = 1.0$
Burn duration drops to $172.3\,\mathrm{s}$ (2.87 min), sweeping $13.0^\circ$. Delivered speed change: $2.4012\,\mathrm{km/s}$, a gravity loss of only $24.6\,\mathrm{m/s}$ — $1.01\,\%$ of the ideal Δv. Apoapsis comes out at $42\,050.7\,\mathrm{km}$, short by $113\,\mathrm{km}$ ($0.27\,\%$), and the burnout radius is within $6\,\mathrm{km}$ of the intended periapsis. This is a burn a mission designer can treat as impulsive with a clear conscience, and it costs three times the thrust-to-weight of the previous example to get there.
:::

## The trend, and where to draw the line

| $T/W_0$ | burn time | swept arc | gravity loss | apoapsis error |
| --- | --- | --- | --- | --- |
| 0.10 | 28.7 min | $113.4^\circ$ | 64.5 % | 17.7 % |
| 0.20 | 14.4 min | $62.2^\circ$ | 22.1 % | 6.0 % |
| 0.30 | 9.57 min | $42.4^\circ$ | 10.6 % | 2.9 % |
| 0.50 | 5.74 min | $25.8^\circ$ | 4.0 % | 1.1 % |
| 0.75 | 3.83 min | $17.3^\circ$ | 1.8 % | 0.48 % |
| 1.00 | 2.87 min | $13.0^\circ$ | 1.01 % | 0.27 % |
| 2.00 | 1.44 min | $6.5^\circ$ | 0.25 % | 0.06 % |
| 5.00 | 0.57 min | $2.6^\circ$ | 0.04 % | 0.01 % |

The loss falls off steeply and smoothly as $T/W_0$ rises — there is no sharp cliff, only a continuous curve, so "the burn duration at which the impulsive approximation starts to cost more than it is worth" is a threshold you choose, not one nature hands you. A reasonable line: once gravity loss is under about 1 %, it is competitive with (not dominant over) the other uncertainties in a real Δv budget — navigation errors, execution errors, mass-property uncertainty — and treating the burn as impulsive is defensible. Solving for that crossing precisely gives $T/W_0 \approx 1.01$, a burn of $171\,\mathrm{s}$, sweeping $12.9^\circ$ — about $3.2\,\%$ of the parking orbit's $90.5\,\mathrm{minute}$ period. A 2 % loss threshold pushes the requirement down to $T/W_0\approx0.71$, an $18^\circ$ arc. Either way, the rule of thumb from lesson 1 — swept angle of a few tens of degrees or fewer — turns out to be roughly right, and now you have the number behind it: keep thrust-to-weight at or above about 1, or equivalently keep the burn under a few percent of the local orbital period, and the impulsive Δv is a good working number; push much below that and the shortfall grows fast enough to matter.

::: key A practical threshold
For this burn, gravity loss reaches 1 % of the target Δv at about $T/W_0\approx1.0$ (burn $\approx3\,\%$ of the local orbital period, arc $\approx13^\circ$), and 2 % at about $T/W_0\approx0.7$ (arc $\approx18^\circ$). Below that, losses grow quickly; above it, they are a small, controllable correction.
:::

## Where the impulsive picture breaks down entirely

Push thrust-to-weight far lower still — $T/W_0=0.05$ or $0.02$ — and the burn no longer merely loses a percentage: it takes hours, wrapping most or all of the way around the orbit while the vehicle spends this whole time pointed wherever "along the velocity vector" currently means, which rotates continuously as the vehicle goes around. At $T/W_0=0.05$, the burn lasts $3446\,\mathrm{s}$ (0.96 h) and the vehicle's final *speed* is $6.965\,\mathrm{km/s}$ — *lower* than the $7.726\,\mathrm{km/s}$ it started with, a "delivered Δv" of $-760\,\mathrm{m/s}$, even though the semi-major axis has genuinely grown (from $6678$ to $17\,417\,\mathrm{km}$) and the specific-energy identity from the start of this lesson holds exactly throughout. Nothing is wrong with the physics or the integrator here; what has failed is the *concept* of quoting a single Δv for this burn at all. Once a "single burn" spans many orbital periods, there is no longer one point, one apsis, or one flight-path angle to reason about — the vehicle's orbit is continuously evolving underneath it. That regime needs a different tool altogether, which the next lesson builds.

::: warning A percentage loss needs a stated reference
"10.6 % gravity loss" in the first worked example means 10.6 % of the *impulsive Δv this burn was trying to deliver*, not 10.6 % of the mission's total Δv budget or of the vehicle's total capability. Always state what the percentage is relative to.
:::

::: warning Convergence is not optional
The numbers in this lesson were checked against a second run at a much tighter integrator tolerance before being written down, and agreed to far more precision than quoted. A single run at default tolerance, especially through a burn that changes the vehicle's speed by more than half over a few hundred seconds, is not something to trust without that check — integrators can converge to a plausible-looking wrong answer just as easily as an obviously wrong one.
:::

## Check yourself

::: check
Explain, without reproducing the full derivation, why a velocity-aligned finite burn loses no specific energy to gravity but can still deliver less speed than the rocket equation promises.
:::

::: answer
Specific energy's rate of change, $\dot\varepsilon = \mathbf{v}\cdot\mathbf{a}+\mu\dot r/r^2$, has the gravitational contribution to $\mathbf{v}\cdot\mathbf{a}$ cancel exactly against the $\mu\dot r/r^2$ term that comes from differentiating $-\mu/r$, leaving $\dot\varepsilon=a_Tv$ regardless of where in the orbit the vehicle is. Speed's rate of change has no such cancellation — $\dot v = a_T-(\mu/r^2)\sin\gamma$ — because differentiating $v$ directly does not bring in a term that offsets gravity's radial pull. Away from an apsis, gravity has a nonzero component along the velocity direction, so it actively opposes the speed gain (when climbing) even while contributing nothing against the energy gain.
:::

::: check
For the $T/W_0=0.3$ example, the burnout radius came out $65\,\mathrm{km}$ beyond the intended $6678\,\mathrm{km}$ periapsis. Explain, physically, why this happens even though the burn started exactly at periapsis.
:::

::: answer
The burn starts exactly at periapsis, with the flight-path angle at zero, but as soon as thrust raises the speed above the local circular value the orbit stops being circular and the vehicle begins climbing — its flight-path angle becomes positive and its radius starts increasing for the remainder of the burn. Because the burn takes over nine minutes and sweeps more than $40^\circ$, the vehicle has moved well past the point it started at by the time the engine cuts off, so "burnout" no longer coincides with the geometric periapsis it departed from.
:::

::: check
A different mission plans a burn with $T/W_0=2.0$. Using the table in this lesson, is the impulsive approximation good enough for a mission that can tolerate at most 0.5 % apoapsis error, and by how much margin?
:::

::: answer
At $T/W_0=2.0$, apoapsis error is $0.06\,\%$, comfortably under the $0.5\,\%$ tolerance — about eight times better than required. The mission has substantial margin and could likely tolerate a noticeably lower thrust-to-weight (the table shows $T/W_0=0.75$, with $0.48\,\%$ error, still just inside tolerance) if a lower-thrust engine were preferable for other reasons.
:::

::: check
Why does the extremely low thrust-to-weight case ($T/W_0=0.05$) deliver a *negative* net speed change even though the vehicle's orbit has clearly grown (semi-major axis rising from 6678 to over 17,000 km)?
:::

::: answer
The vehicle's specific energy has genuinely increased throughout, exactly as $\dot\varepsilon=a_Tv$ requires — that is what raised the semi-major axis. But specific energy is $v^2/2-\mu/r$, and once the vehicle has climbed to a much larger $r$, the $-\mu/r$ term has become much less negative even if $v$ itself has fallen; a lower $v$ at a much larger $r$ can have higher energy than a higher $v$ at the original, smaller $r$. Over a burn spanning hours and wrapping much of the way around the orbit, the vehicle spends long stretches climbing against gravity with thrust that is comparatively weak, so the speed-loss integral $\int(\mu/r^2)\sin\gamma\,dt$ can exceed the entire "ideal" speed gain $a_T t_b$, driving the net speed change negative while energy still rises throughout.
:::

::: check
A systems engineer proposes budgeting a flat 2 % margin on every impulsive Δv in a mission's budget, regardless of which engine performs each burn. Based on this lesson, when is that a reasonable simplification and when is it not?
:::

::: answer
It is reasonable when every burn in the mission is flown at a comparable thrust-to-weight, at or above roughly 0.7–1 (this lesson's 1–2 % loss band), since the actual loss for each burn will cluster near the flat margin regardless of the details. It breaks down for a mission that mixes burn types — a high-thrust chemical apogee kick alongside a much lower thrust-to-weight burn elsewhere — because the table in this lesson shows loss is a steep, nonlinear function of thrust-to-weight: a burn at $T/W_0=0.2$ loses over twenty times what a 2 % flat margin would cover, while a burn at $T/W_0=2$ needs almost none of it. A single flat number either strands the low-thrust burn or wastes margin on the high-thrust one.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot\varepsilon = a_T v$ | Specific energy grows at the full thrust power, no gravity loss, for velocity-aligned thrust |
| $\dot v = a_T - (\mu/r^2)\sin\gamma$ | Speed grows at less than $a_T$ whenever climbing ($\gamma>0$); this integral is the gravity loss |
| $T/W_0=0.3$ example | 10.6 % gravity loss, 2.9 % apoapsis error, $42^\circ$ swept arc |
| $T/W_0=1.0$ example | 1.01 % gravity loss, 0.27 % apoapsis error, $13^\circ$ swept arc |
| 1 % loss threshold | $T/W_0\approx1.0$: burn $\approx3\,\%$ of the local period |
| 2 % loss threshold | $T/W_0\approx0.7$ |
| Breakdown regime | $T/W_0\lesssim0.05$: burn spans hours, wraps around the orbit, net speed change can go negative |
| Practice | Verify integration results against a tighter tolerance before trusting a quoted loss number |

The breakdown case at the end of this lesson is not a curiosity — it is the everyday operating regime of electric propulsion, and it is exactly where the next lesson picks up: a framework built for burns that last many orbits, where "impulsive Δv" is not even the right question to ask.
