---
id: l02-hohmann-transfer
title: The Hohmann transfer
minutes: 19
covers:
  - Hohmann transfer and its optimality
---

Walter Hohmann described this transfer in 1925, two years after the founding papers of modern rocketry and decades before anything actually flew on one. It is still the first maneuver a mission designer reaches for whenever two circular, coplanar orbits need connecting, and it still shows up in every Δv budget that involves raising or lowering an orbit: LEO to GTO, GTO to GEO, a constellation satellite moving from its parking orbit to its operational shell. You will compute it more often than every other maneuver in this module combined.

The transfer itself is almost embarrassingly simple once you have vis-viva: coast on an ellipse tangent to both circles, touching the smaller one at periapsis and the larger one at apoapsis. What makes it worth a whole lesson is not the arithmetic but the claim attached to it – that of all two-impulse transfers between two circular coplanar orbits, this one costs the least propellant. That claim is not obvious, and understanding why it is true is what lets you recognise, in later lessons, the specific circumstances in which it stops being the right answer.

## Building the transfer

Two circular orbits, radii $r_1 < r_2$, coplanar. Connect them with an ellipse whose periapsis is exactly $r_1$ and whose apoapsis is exactly $r_2$:

$$
a_t = \frac{r_1 + r_2}{2}.
$$

This is the *unique* ellipse tangent to both circles – tangent meaning its velocity at $r_1$ and at $r_2$ is purely horizontal, matching the direction (though not the magnitude) of the circular velocities there. Because the directions already match, both burns are purely tangential: point the thrust along the velocity vector, change only its magnitude, and the law of cosines from lesson 1 collapses to a plain difference of speeds. That is the whole reason the Hohmann transfer is cheap – every bit of the two burns goes into changing speed, none of it into rotating a vector.

At $r_1$, the circular speed is $v_1 = \sqrt{\mu/r_1}$ and the transfer ellipse's periapsis speed, from vis-viva, is $v_p = \sqrt{\mu(2/r_1 - 1/a_t)}$. Since $r_1 < a_t$, vis-viva guarantees $v_p > v_1$ (an orbit is always faster than circular inside its own semi-major-axis radius, as the last module's vis-viva lesson showed), so the first burn is prograde:

$$
\Delta v_1 = v_p - v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1+r_2}} - 1\right).
$$

At $r_2$, by the mirror argument, the transfer ellipse's apoapsis speed $v_a = \sqrt{\mu(2/r_2 - 1/a_t)}$ is *slower* than the local circular speed $v_2 = \sqrt{\mu/r_2}$ (an orbit is always slower than circular outside its semi-major-axis radius), so the second burn is again prograde, speeding the vehicle up to circular:

$$
\Delta v_2 = v_2 - v_a = \sqrt{\frac{\mu}{r_2}}\left(1 - \sqrt{\frac{2r_1}{r_1+r_2}}\right).
$$

Both burns point the same way the vehicle is already moving; there is no rotation anywhere in the maneuver. The time of flight is exactly half the transfer ellipse's period, since the vehicle travels from periapsis to apoapsis:

$$
t_{\text{transfer}} = \pi\sqrt{\frac{a_t^3}{\mu}}.
$$

That time is fixed the moment you choose $r_1$ and $r_2$ – a Hohmann transfer has no free parameter left to adjust the arrival time, which is exactly the freedom the one-tangent transfers of lesson 4 trade extra Δv to get back.

::: example LEO to GEO
$r_1 = 6678\,\mathrm{km}$, $r_2 = 42\,164\,\mathrm{km}$, $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$. Circular speeds: $v_1 = \sqrt{\mu/r_1} = 7.7258\,\mathrm{km/s}$, $v_2 = \sqrt{\mu/r_2} = 3.0747\,\mathrm{km/s}$. Transfer semi-major axis $a_t = (6678+42\,164)/2 = 24\,421.0\,\mathrm{km}$. Transfer speeds: $v_p = \sqrt{\mu(2/r_1-1/a_t)} = 10.1516\,\mathrm{km/s}$, $v_a = \sqrt{\mu(2/r_2-1/a_t)} = 1.6078\,\mathrm{km/s}$. The two burns:
$$
\Delta v_1 = 10.1516 - 7.7258 = 2.4258\,\mathrm{km/s}, \qquad \Delta v_2 = 3.0747 - 1.6078 = 1.4668\,\mathrm{km/s},
$$
total $3.8926\,\mathrm{km/s}$. Time of flight: $t = \pi\sqrt{24\,421.0^3/398\,600.4418} = 18\,990\,\mathrm{s} = 5.275\,\mathrm{h}$. These are the numbers behind every "apogee kick" GEO mission ever flown from a low parking orbit, and they will reappear throughout this module.
:::

::: example LEO to a GPS-like orbit
$r_1 = 6678\,\mathrm{km}$ again, $r_2 = 26\,578.1\,\mathrm{km}$ (about 20 200 km altitude, a GPS-class medium orbit). $v_1 = 7.7258\,\mathrm{km/s}$, $v_2 = \sqrt{\mu/r_2} = 3.8726\,\mathrm{km/s}$, $a_t = 16\,628.1\,\mathrm{km}$, $v_p = 9.7676\,\mathrm{km/s}$, $v_a = 2.4542\,\mathrm{km/s}$. So $\Delta v_1 = 9.7676-7.7258=2.0417\,\mathrm{km/s}$, $\Delta v_2 = 3.8726-2.4542=1.4184\,\mathrm{km/s}$, total $3.4602\,\mathrm{km/s}$, and $t = \pi\sqrt{16\,628.1^3/398\,600.4418} = 10\,670\,\mathrm{s} = 2.964\,\mathrm{h}$. Notice the total is *smaller* than the LEO-to-GEO case despite the target orbit being large – the cost depends on the ratio $r_2/r_1$, not on the absolute size of either radius, and $26\,578/6678 = 3.98$ is a smaller ratio than $42\,164/6678 = 6.31$.
:::

::: key The Hohmann transfer
$$
\Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1+r_2}}-1\right), \quad
\Delta v_2 = \sqrt{\frac{\mu}{r_2}}\left(1-\sqrt{\frac{2r_1}{r_1+r_2}}\right), \quad
t = \pi\sqrt{\frac{a_t^3}{\mu}},\ a_t=\frac{r_1+r_2}{2}.
$$
Both burns are tangential. The transfer time is fixed by $r_1,r_2$ alone.
:::

## Why it is optimal

Restrict attention first to transfers that are tangential at *both* ends – burns that only change speed, never direction, exactly like the two above. A tangential departure from $r_1$ fixes one apsis of the transfer ellipse at $r_1$; a tangential arrival at $r_2$ fixes the other apsis at $r_2$. There is only one ellipse with apsides at exactly $r_1$ and $r_2$ – the Hohmann ellipse. So within the tangent-tangent family there is nothing to optimise: it is not "the best of many options," it is the *only* option.

The real content of the optimality claim is stronger: Hohmann beats every two-impulse transfer, tangential or not. The physical reason traces straight back to lesson 1's law of cosines. Any departure burn that leaves the vehicle with a flight-path angle away from zero – moving partly radially, not purely tangentially – has "spent" some of its $\Delta v_1$ on a direction change that contributes nothing to reaching $r_2$ efficiently, in exactly the way the $5^\circ$ example in lesson 1 cost far more than the speed change alone. The same penalty applies at arrival. A full proof (first sketched by Hohmann, made rigorous decades later by other authors — see Prussing's short proof of global optimality for a complete argument) works through every possible transfer orbit and every possible pair of burn points and shows the tangent-tangent solution always wins. Lesson 4 gives you a numerical demonstration of a slice of that result: holding the departure tangential and sweeping the arrival point away from apoapsis, the total Δv only ever increases.

This optimality is scoped precisely, and the scope matters for the rest of the module. It is the minimum among *two-impulse* transfers. Allow a third impulse and, for a large enough ratio $r_2/r_1$, a cheaper route exists – the bi-elliptic transfer of lesson 3. It is optimal for a *fixed pair of circular, coplanar orbits* – add a plane change and the optimal split of that plane change across two burns is a genuinely different, separate optimisation, worked out in lesson 5. And it says nothing about *when* you arrive – lesson 4's one-tangent transfers spend extra Δv precisely to buy back control over the arrival time that the unique Hohmann ellipse does not give you.

::: warning Tangential does not mean "in the direction of travel around the orbit"
Both Hohmann burns are prograde in these examples because you are raising the orbit. A Hohmann transfer used to *lower* an orbit is exactly as tangential – both burns simply point retrograde instead, slowing the vehicle down at each apsis. The tangency (zero flight-path angle, thrust along the velocity vector) is the property that makes the transfer optimal; the sign of the burn depends only on whether you are climbing or descending.
:::

::: warning A larger target radius is not always more expensive
As the second worked example shows, total Δv tracks the *ratio* $r_2/r_1$, not the size of $r_2$ by itself. A transfer to a far larger but proportionally closer orbit can cost less than one to a smaller but proportionally more distant one.
:::

## Check yourself

::: check
Without computing anything, explain why both Hohmann burns are purely tangential and why that is the source of the transfer's efficiency.
:::

::: answer
The transfer ellipse is chosen to have its periapsis exactly at $r_1$ and its apoapsis exactly at $r_2$. At periapsis and apoapsis the velocity of any orbit is horizontal – purely tangential, zero flight-path angle – which matches the direction of the local circular velocity exactly. Because the directions already agree at both burn points, neither burn has to rotate the velocity vector; by the law of cosines, a burn that only changes magnitude (θ = 0) is always the cheapest way to achieve a given change in speed, so putting every burn where the orbit is already moving in the right direction minimises the total Δv.
:::

::: check
Compute the two Hohmann burns and the time of flight for a transfer from a 500 km circular orbit ($r_1 = 6878.137\,\mathrm{km}$) to a 1500 km circular orbit ($r_2 = 7878.137\,\mathrm{km}$).
:::

::: answer
$v_1 = \sqrt{398\,600.4418/6878.137} = 7.6127\,\mathrm{km/s}$, $v_2=\sqrt{398\,600.4418/7878.137}=7.1148\,\mathrm{km/s}$. $a_t = (6878.137+7878.137)/2 = 7378.137\,\mathrm{km}$. $v_p = \sqrt{398\,600.4418(2/6878.137-1/7378.137)} = 7.7986\,\mathrm{km/s}$, $v_a=\sqrt{398\,600.4418(2/7878.137-1/7378.137)}=6.8144\,\mathrm{km/s}$. $\Delta v_1 = 7.7986-7.6127=0.1859\,\mathrm{km/s}$, $\Delta v_2=7.1148-6.8144=0.3004\,\mathrm{km/s}$, total $0.4863\,\mathrm{km/s}$. Time of flight: $t=\pi\sqrt{7378.137^3/398\,600.4418}=3181\,\mathrm{s}=53.0\,\mathrm{min}$.
:::

::: check
A colleague proposes a transfer between the same two circular orbits that burns non-tangentially at departure, arguing that a cleverly chosen transfer ellipse might reach $r_2$ more cheaply. What is wrong with the plan, in general?
:::

::: answer
It cannot beat the Hohmann transfer, and it will generically cost more. A non-tangential departure gives the transfer orbit a nonzero flight-path angle at $r_1$, which means the departure burn had to rotate the velocity vector as well as change its speed; by the law of cosines that rotation adds to $|\Delta\mathbf{v}|$ for the same net change in speed and direction achieved elsewhere. Unless the arrival burn is arranged to save more than the departure burn lost – which the global optimality result rules out for a two-impulse, circular-to-circular transfer – the total goes up, not down.
:::

::: check
Two transfers have the same $r_1$ but different $r_2$: one has $r_2/r_1 = 4$, the other $r_2/r_1 = 6.31$ (the LEO-to-GEO ratio). Without recomputing everything, explain qualitatively why you cannot conclude the transfer with the larger $r_2$ necessarily needs more total Δv, and what you would need to check.
:::

::: answer
Total Δv is a function of the ratio $r_2/r_1$ alone once you factor out $v_1=\sqrt{\mu/r_1}$ (both burns scale with $v_1$ and depend on $r_2$ only through that ratio), so comparing two transfers with different $r_1$ as well as different $r_2$ tells you nothing directly from the ratio alone unless $r_1$ is the same in both. Here $r_1$ is the same, so the comparison is valid: the transfer with the larger ratio, 6.31, does need more total Δv per unit of $v_1$ – total Δv (in units of $v_1$) increases monotonically with $r_2/r_1$ for a Hohmann transfer, as the LEO-to-GEO and LEO-to-GPS examples in this lesson confirm numerically.
:::

::: check
Why does the Hohmann transfer give you no control over the arrival time, and what does that cost you if you need one?
:::

::: answer
Once $r_1$ and $r_2$ are fixed, tangency at both ends fixes the transfer ellipse uniquely, which fixes $a_t$ and therefore the time of flight $t=\pi\sqrt{a_t^3/\mu}$ – there is no remaining free parameter to adjust. If a mission needs to arrive at a specific time (to rendezvous with a moving target, hit a launch window, or match a phasing requirement), a plain Hohmann transfer cannot be tuned to do it; you have to give up tangency at one end and accept extra Δv, which is exactly the one-tangent transfer of lesson 4.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $a_t = (r_1+r_2)/2$ | Semi-major axis of the unique ellipse tangent to both circular orbits |
| $\Delta v_1 = \sqrt{\mu/r_1}\left(\sqrt{2r_2/(r_1+r_2)}-1\right)$ | Departure burn, tangential |
| $\Delta v_2 = \sqrt{\mu/r_2}\left(1-\sqrt{2r_1/(r_1+r_2)}\right)$ | Arrival burn, tangential |
| $t = \pi\sqrt{a_t^3/\mu}$ | Time of flight, fixed by $r_1,r_2$ with no free parameter |
| LEO (6678 km) $\to$ GEO | $\Delta v_1=2.4258$, $\Delta v_2=1.4668$, total $3.8926\,\mathrm{km/s}$, $t=5.275\,\mathrm{h}$ |
| Optimality | Minimum-Δv two-impulse transfer between coplanar circular orbits, for every radius ratio |
| Scope | Beaten only by a third impulse (lesson 3), by adding a plane change (lesson 5), or by trading Δv for arrival-time control (lesson 4) |

The next lesson asks the question this one deliberately set aside: if a third burn is allowed, can it ever beat the number above? The answer is yes, but only past a specific radius ratio, and the saving turns out to be small next to the time it costs.
