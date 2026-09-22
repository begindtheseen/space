---
id: l01-impulsive-approximation
title: Impulsive Δv and when the instantaneous-burn model holds
minutes: 20
covers:
  - the impulsive approximation and its validity limits
---

Every maneuver in this module is built on one deliberate simplification: that a rocket engine can change a spacecraft's velocity instantly, at a single point in space, without moving it. No real engine does this. A real burn takes seconds to hours, during which the vehicle keeps falling around its orbit, gravity keeps pulling, and the direction that was optimal at ignition drifts away from optimal by the time the engine cuts off. The impulsive model throws all of that away on purpose, because what is left – a clean vector addition at a point – is exactly rich enough to design a mission with, and exactly simple enough to compute by hand.

You will use the impulsive model to size every Δv budget you write for the rest of your career, from a back-of-envelope check in a design review to the first pass of a real trajectory. It is the right tool for that job. It is also, unavoidably, an approximation, and knowing when it stops being a good one is as much a part of using it correctly as the arithmetic is. This lesson defines the impulsive maneuver precisely, gives you the vector algebra you will use in every later lesson, and sets up a rough test for whether a real burn is "impulsive enough" – a test that lesson 8 makes exact.

## The impulsive maneuver

An impulsive maneuver is an instantaneous change in velocity at a fixed point: the position $\mathbf{r}$ is continuous across the burn, but the velocity jumps from $\mathbf{v}^-$ (just before) to $\mathbf{v}^+$ (just after). The maneuver is characterised entirely by the vector

$$
\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-.
$$

Before the burn the spacecraft is coasting on one Keplerian orbit; after it, on another, and the two orbits share exactly the point $\mathbf{r}$ where the burn happened. Everything in lessons 2 through 7 is a choice of where to place one or more of these instantaneous jumps and what $\Delta\mathbf{v}$ to give each one.

Physically, $\Delta\mathbf{v}$ stands in for a real burn's momentum change divided by the (roughly constant, over a short burn) vehicle mass. It carries units of speed, km/s or m/s, and its magnitude is what the rocket equation prices in propellant: $\Delta v = v_e \ln(m_0/m_f)$, with $v_e = I_{sp} g_0$ the effective exhaust velocity, derived in the rocket-equation module and used here without re-deriving it. A Δv budget is a propellant budget in a more convenient currency – speed instead of mass – because speed adds linearly along a trajectory while mass fractions multiply.

::: example A propellant fraction from a Δv budget
A small satellite carries a monopropellant thruster with $I_{sp} = 220\,\mathrm{s}$ and needs $\Delta v = 150\,\mathrm{m/s} = 0.150\,\mathrm{km/s}$ over its life for station-keeping and disposal. The exhaust velocity is $v_e = I_{sp} g_0 = 220 \times 9.80665\times10^{-3} = 2.1575\,\mathrm{km/s}$. The propellant mass fraction is
$$
1 - \frac{m_f}{m_0} = 1 - e^{-\Delta v/v_e} = 1 - e^{-0.150/2.1575} = 1 - 0.9328 = 0.0672,
$$
6.72 %. For a 200 kg spacecraft that is 13.4 kg of propellant – a number the systems engineer needs before the tank can be sized, and it came directly from a Δv that was never delivered as one continuous kick, but as dozens of short pulses over years. The rocket equation does not care; it only sees the total.
:::

## Combining velocity vectors

The one piece of vector algebra you will reach for constantly is this: given a velocity $\mathbf{v}^-$ before a burn and a target velocity $\mathbf{v}^+$ after it, possibly pointed in a different direction, what is $|\Delta\mathbf{v}|$? Writing $v^- = |\mathbf{v}^-|$, $v^+ = |\mathbf{v}^+|$, and $\theta$ for the angle between the two vectors, the law of cosines on the triangle they form with $\Delta\mathbf{v}$ gives

$$
|\Delta\mathbf{v}|^2 = (v^-)^2 + (v^+)^2 - 2\,v^-v^+\cos\theta .
$$

When $\theta = 0$ (same direction, only speed changes) this collapses to $|\Delta\mathbf{v}| = |v^+ - v^-|$, the case you already used for every vis-viva calculation in the last module. When $\theta \neq 0$ it does not collapse, and the difference is not small. This single formula is the combined-burn law of cosines you will use for plane changes (lesson 5), apsidal rotation (lesson 6), and any maneuver that changes both speed and direction at once, so it is worth internalising now rather than re-deriving each time.

::: example Two nearby velocities that are not nearly as close as they look
A vehicle's velocity changes from $v^- = 7.50\,\mathrm{km/s}$ to $v^+ = 7.80\,\mathrm{km/s}$, with the new direction rotated $5^\circ$ from the old one. If you (incorrectly) ignored the rotation, you would guess $\Delta v \approx 7.80 - 7.50 = 0.300\,\mathrm{km/s}$. The law of cosines gives the true value:
$$
|\Delta\mathbf{v}| = \sqrt{7.50^2 + 7.80^2 - 2(7.50)(7.80)\cos 5^\circ} = \sqrt{0.5352} = 0.7316\,\mathrm{km/s}.
$$
A $5^\circ$ misalignment more than doubled the required Δv. This is the reason plane changes are expensive and the reason lesson 5 exists: rotating a velocity vector costs propellant even when its magnitude barely changes.
:::

::: key Δv is a vector difference
$$
\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-, \qquad
|\Delta\mathbf{v}| = \sqrt{(v^-)^2 + (v^+)^2 - 2v^-v^+\cos\theta}.
$$
Position is continuous across an impulsive burn; only velocity jumps. Never subtract speeds when the directions differ.
:::

## When is a real burn "impulsive enough"?

A real burn has a thrust $T$, a mass $m$, and therefore an acceleration $a = T/m$. To first order – ignoring for now that $m$ falls as propellant burns and that the optimal thrust direction itself rotates as the orbit moves – a burn that delivers $\Delta v$ takes roughly

$$
t_b \approx \frac{\Delta v}{a} = \frac{\Delta v \, m}{T}.
$$

During that time the vehicle does not sit still: it sweeps forward along its orbit at roughly its orbital speed $v$, covering a distance $\approx v\,t_b$ and an angle $\approx v\,t_b/r$ radians. The impulsive model is a good approximation exactly when this swept angle is small – a few degrees, not tens of degrees – because only then does "the burn happened at one point" remain close to true, and only then does the thrust direction, aimed once at ignition, stay close to the direction that would have been optimal throughout. Lesson 8 replaces this hand-wave with an actual integration of the burn and measures the resulting error directly; what you need for now is the order-of-magnitude question: given a real $T$ and $m$, is $t_b$ a small fraction of the orbital period, or not?

::: example Is this burn impulsive? Two engines, one Δv
Take the departure burn for a Hohmann transfer from a 6678 km circular orbit ($v = 7.7258\,\mathrm{km/s}$, period $T = 5431\,\mathrm{s} = 90.5\,\mathrm{min}$, both from the vis-viva and third-law formulas of the last module) with $\Delta v_1 = 2.4258\,\mathrm{km/s}$ – the LEO-to-GTO number this module derives properly in lesson 2.

A storable bipropellant stage with thrust-to-weight $T/W_0 = 1.0$ (referenced to standard gravity, so $a_0 = g_0 = 9.80665\times10^{-3}\,\mathrm{km/s^2}$) delivers this in about
$$
t_b \approx \frac{2.4258}{9.80665\times10^{-3}} = 247\,\mathrm{s} = 4.1\,\mathrm{min},
$$
about 4.6 % of the orbital period, sweeping roughly $v\,t_b/r = (7.7258)(247)/6678 = 0.286\,\mathrm{rad} \approx 16^\circ$. That is small enough that treating the burn as instantaneous is a reasonable first approximation – lesson 8 will find the actual gravity loss for a comparable burn to be on the order of one percent of Δv.

Now try a small electric thruster with $T/W_0 = 0.001$ – a thousand times weaker. The same estimate gives $t_b \approx 2.47\times10^{5}\,\mathrm{s} = 68.7\,\mathrm{hours}$, about 45 orbital periods, "sweeping" many complete revolutions. The very idea of a single point where the burn happened has broken down; there is no meaningful sense in which this is close to impulsive. This is not a finite-burn correction to the Hohmann transfer – it is a different kind of trajectory entirely, and lesson 9 builds the tool (the Edelbaum result) for exactly this regime.
:::

::: key Rule of thumb for validity
Estimate $t_b \approx \Delta v\,m/T$ and compare it with the orbital period, or equivalently compare the swept angle $v\,t_b/r$ with $360^\circ$. Burn time a small fraction of the period (a swept angle of a few degrees to a few tens of degrees) – impulsive is a good approximation. Burn time comparable to or larger than the period – it is not, and for burns many periods long the impulsive framework does not apply at all.
:::

::: warning Which mass?
$a = T/m$ uses the vehicle's *current* mass, which falls throughout the burn as propellant is spent. The estimate above uses the initial mass and so is conservative for $t_b$ (a real burn finishes a little sooner, since the same thrust accelerates a lighter vehicle faster toward the end). It is a first estimate, not the last word – lesson 8 integrates the burn properly, mass loss included, and shows exactly how much the naive estimate misses.
:::

::: warning Not every non-impulsive burn is a small correction
The gap between "burn takes 5 % of a period" and "burn takes 45 periods" is not a matter of degree. Below some thrust-to-weight, the whole premise of an instantaneous Δv at a point stops making sense, and the right model is not "a Hohmann transfer with losses" but a continuous low-thrust trajectory, covered in lesson 9. Recognising which regime you are in is the first decision in any real maneuver design.
:::

## Check yourself

::: check
A spacecraft's velocity changes from $6.90\,\mathrm{km/s}$ to $7.10\,\mathrm{km/s}$ with a $3^\circ$ rotation between the two directions. Compute $|\Delta\mathbf{v}|$ and compare it with the naive guess $|v^+ - v^-|$.
:::

::: answer
$|\Delta\mathbf{v}| = \sqrt{6.90^2 + 7.10^2 - 2(6.90)(7.10)\cos 3^\circ} = \sqrt{6.90^2+7.10^2-2(6.90)(7.10)(0.99863)}$. Computing: $6.90^2=47.61$, $7.10^2=50.41$, $2(6.90)(7.10)=97.98$, times $0.99863$ gives $97.845$, so the sum is $47.61+50.41-97.845=0.175$, and $|\Delta\mathbf{v}|=\sqrt{0.175}=0.418\,\mathrm{km/s}$. The naive guess is $7.10-6.90=0.200\,\mathrm{km/s}$ – more than a factor of two too small. Even a small angle matters when the speeds themselves are large.
:::

::: check
Explain, in terms of what stays continuous and what jumps, exactly what an impulsive maneuver assumes about a spacecraft's trajectory.
:::

::: answer
Position $\mathbf{r}$ is continuous across the maneuver – the spacecraft does not teleport. Velocity $\mathbf{v}$ jumps discontinuously from $\mathbf{v}^-$ to $\mathbf{v}^+$ at that one point, with the jump $\Delta\mathbf{v}=\mathbf{v}^+-\mathbf{v}^-$ delivered in zero elapsed time. Before the point the vehicle follows one Kepler orbit; after it, a different one; the two orbits are tangent to each other only in the trivial sense of sharing that single point and its position.
:::

::: check
A 1200 kg spacecraft has a thruster producing 300 N and needs to deliver $\Delta v = 0.80\,\mathrm{km/s}$. Estimate the burn duration and the swept angle if the burn happens at $r = 7000\,\mathrm{km}$ where the local orbital speed is about $7.55\,\mathrm{km/s}$. Is treating this as impulsive reasonable?
:::

::: answer
$a = T/m = 300/1200 = 0.25\,\mathrm{m/s^2} = 2.5\times10^{-4}\,\mathrm{km/s^2}$. $t_b \approx \Delta v/a = 0.80/2.5\times10^{-4} = 3200\,\mathrm{s} = 53.3\,\mathrm{min}$. The orbital period at $r=7000\,\mathrm{km}$ is $T = 2\pi\sqrt{r^3/\mu} = 2\pi\sqrt{7000^3/398600.4418} \approx 5828\,\mathrm{s} = 97.1\,\mathrm{min}$, so the burn consumes about 55 % of an orbit – far too large a fraction to call impulsive. The swept angle is roughly $v\,t_b/r = (7.55)(3200)/7000 = 3.45\,\mathrm{rad} \approx 198^\circ$, more than half the orbit. This burn needs the finite-burn treatment of lesson 8, not a single Δv.
:::

::: check
Why does a very low thrust-to-weight ratio break the impulsive framework in a qualitatively different way than a moderately long burn does?
:::

::: answer
A moderately long burn still happens over an arc that is a recognisable fraction of one orbit, so it makes sense to ask "how much Δv, and how much orbit error, compared with an instantaneous burn at roughly this point" – that is exactly the finite-burn correction lesson 8 computes. A very low thrust-to-weight burn can take many orbital periods to deliver the same Δv: the vehicle circles many times while thrusting continuously, the thrust direction sweeps around with it, and there is no longer a single "point" the burn happened at or a single orbit it is a correction to. The right description becomes a continuously evolving orbit shape (a spiral), which needs the low-thrust formulation of lesson 9, not a loss term bolted onto the impulsive one.
:::

::: check
A mission Δv budget totals 4.2 km/s using a stage with $I_{sp} = 311\,\mathrm{s}$. What fraction of the initial mass must be propellant?
:::

::: answer
$v_e = I_{sp} g_0 = 311 \times 9.80665\times10^{-3} = 3.0498\,\mathrm{km/s}$. The propellant fraction is $1 - e^{-\Delta v/v_e} = 1 - e^{-4.2/3.0498} = 1 - e^{-1.3771} = 1 - 0.2523 = 0.7477$, about 74.8 % of the initial mass. Only a quarter of the vehicle at ignition is left as structure, engine and payload at burnout – a reminder of how steeply the rocket equation punishes a large Δv, and why every lesson from here on treats Δv as something to be spent carefully.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\Delta\mathbf{v} = \mathbf{v}^+ - \mathbf{v}^-$ | Impulsive maneuver: instantaneous velocity change, position continuous |
| $\lvert\Delta\mathbf{v}\rvert = \sqrt{(v^-)^2+(v^+)^2-2v^-v^+\cos\theta}$ | Law of cosines for a burn that changes direction as well as speed |
| $\Delta v = v_e\ln(m_0/m_f)$, $v_e = I_{sp}g_0$ | Rocket equation, prices a Δv budget in propellant mass |
| $t_b \approx \Delta v\, m/T$ | First-order burn duration estimate for constant thrust $T$, mass $m$ |
| Validity check | Compare $t_b$ (or swept angle $v t_b/r$) with the orbital period; small fraction $\Rightarrow$ impulsive is a good approximation |
| Breakdown regime | $t_b \gtrsim$ several periods $\Rightarrow$ not a correction to an impulsive burn; needs the low-thrust framework of lesson 9 |

Every remaining lesson through lesson 7 works entirely inside the impulsive idealisation you have just defined, starting with the single most useful result in the subject: the two-impulse Hohmann transfer. Lessons 8 and 9 then come back and ask how much the idealisation costs you, first for a moderately long burn and then for one so gentle it changes the whole shape of the problem.
