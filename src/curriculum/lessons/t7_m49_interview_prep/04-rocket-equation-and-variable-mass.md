---
id: l04-rocket-equation-and-variable-mass
title: The rocket equation and the variable-mass equations of motion, derived cold
minutes: 17
covers:
  - "Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations"
---

Almost every GNC panel asks for the rocket equation at some point, and almost every panel that asks for it also asks a second question immediately after: why does it contain no thrust term. That second question is the real one. It is not testing whether you memorized $\Delta v = v_e \ln(m_0/m_f)$ — a formula on a flashcard proves nothing about understanding — it is testing whether you can rebuild the argument that produces it, and whether you know precisely where a naive application of Newton's second law goes wrong for a body that is throwing away its own mass. That second failure is common enough, even among candidates who know the formula perfectly, that it functions as a real discriminator.

This lesson derives both: the rocket equation itself, from momentum conservation, with nothing assumed; and the full variable-mass equations of motion — translational and rotational — that generalize it to a real vehicle under thrust, gravity, and control moments. Do this one cold. It is the shortest of the six core derivations and the one most likely to open a dynamics round, which makes it the worst one to stumble on.

## The rocket equation, from momentum conservation

Set up the system precisely, because precision here is what separates a derivation from a recitation. At time $t$, a vehicle has mass $m$ and velocity $v$ (one dimension, no external forces, for now). In a short interval $dt$, it ejects a small mass $dm_p > 0$ of propellant backward, at speed $v_e$ *relative to the vehicle*. The vehicle's own mass therefore decreases by $dm_p$, and its velocity changes by $dv$.

The move that makes this derivable in one step: treat the **vehicle and the propellant it is about to eject as a single closed system** over the interval $dt$. Momentum is conserved for a closed system with no external force, full stop — that is Newton's second law applied to a fixed collection of particles, which is where it actually holds without qualification.

Momentum before: the whole system moving together at $v$,

$$
p(t) = m v.
$$

Momentum after: the lighter vehicle at $v + dv$, plus the ejected parcel, which leaves at inertial velocity $v - v_e$ (the vehicle's velocity, minus the exhaust speed relative to the vehicle, since the exhaust goes backward),

$$
p(t+dt) = (m - dm_p)(v + dv) + dm_p (v - v_e).
$$

Expand and conserve momentum, $p(t + dt) = p(t)$:

$$
(m - dm_p)(v+dv) + dm_p(v - v_e) = mv.
$$

$$
mv + m\,dv - dm_p\,v - dm_p\,dv + dm_p\,v - dm_p\,v_e = mv.
$$

The $-dm_p v$ and $+dm_p v$ cancel. The $dm_p\,dv$ term is a product of two small quantities and vanishes in the limit. What remains:

$$
m\,dv = v_e\,dm_p.
$$

Write $dm_p = -dm$ (propellant leaving means the vehicle's own mass $m$ is decreasing, so $dm < 0$), and this is

$$
m\,\frac{dv}{dt} = -v_e\,\frac{dm}{dt}.
$$

Separate and integrate from the initial state $(m_0, v_0)$ to the final state $(m_f, v_f)$, with $v_e$ constant:

$$
\int_{v_0}^{v_f} dv = -v_e \int_{m_0}^{m_f} \frac{dm}{m} = -v_e\left[\ln m_f - \ln m_0\right],
$$

$$
\Delta v = v_e \ln\frac{m_0}{m_f}.
$$

That is the whole derivation. Notice what never entered it: thrust, burn time, mass flow rate. The result is an integral over the *entire burn*, and it depends only on the ratio of masses at the two ends and the exhaust speed in between — not on how fast you got from one to the other. That is precisely why the rocket equation "contains no thrust term": thrust and mass flow rate govern how quickly you traverse the burn, which sets gravity losses, drag losses, and structural loads — all real, often dominant, effects on an actual flight — but they do not enter the *ideal* $\Delta v$ at all.

::: key
$\Delta v = v_e \ln(m_0/m_f) = I_{sp}\,g_0 \ln(m_0/m_f)$. It follows from momentum conservation on the closed system of vehicle-plus-about-to-be-ejected-propellant. No thrust term: thrust and mass flow rate set burn duration and therefore gravity and drag losses, not the ideal velocity change.
:::

## Why staging exists, and why reuse is expensive

Because $\Delta v$ depends on the mass ratio through a *logarithm*, each additional unit of mass ratio buys steadily less $\Delta v$ — and this single fact is the entire argument for staging. Check the demand directly: reaching low Earth orbit needs roughly $9.4\,\mathrm{km/s}$ of design $\Delta v$ (about $7.8\,\mathrm{km/s}$ of orbital speed plus roughly $1.5$–$1.6\,\mathrm{km/s}$ of gravity and drag losses). With $v_e = 3050\,\mathrm{m/s}$ (the $I_{sp} = 311\,\mathrm{s}$ figure from earlier in this curriculum), a single stage would need

$$
MR = e^{9400/3050} \approx 21.8,
$$

meaning over 95% of the vehicle's mass would have to be propellant, leaving under 5% for structure, engines, and payload combined — not achievable with real hardware. Split the same $\Delta v$ across two stages instead, each carrying half:

$$
MR_{\text{each}} = e^{4700/3050} \approx 4.67,
$$

a mass ratio well within what real tanks and structures deliver, because $\ln(MR_1 \cdot MR_2) = \ln MR_1 + \ln MR_2$: mass ratios multiply, but the $\Delta v$'s they buy add directly. Splitting the vehicle lets the second stage start with a fresh, small $m_0$ instead of dragging the first stage's spent tanks the rest of the way up.

The same logarithm is the honest reason reuse is hard. Recovery hardware — landing legs, grid fins, extra propellant reserve for the landing burn — is dry mass carried the entire way up, sitting inside the same logarithm as the payload. It does not cost you linearly; it costs you at the rate the logarithm charges near your operating mass ratio, which is real but survivable, which is exactly why reusable first stages are viable while a reusable *upper* stage — operating at a much less forgiving mass ratio for its mission — is a substantially harder problem.

::: example Two-stage split, checked
Total requirement $\Delta v = 9400\,\mathrm{m/s}$, $v_e = 3050\,\mathrm{m/s}$ throughout for simplicity. Single stage: $MR = e^{9400/3050} \approx 21.8$ — a propellant mass fraction over 95%, not buildable. Two equal stages: $MR_{\text{each}} = e^{4700/3050} \approx 4.67$ per stage, and $v_e \ln(4.67^2) = 3050 \times \ln(21.8) = 9400\,\mathrm{m/s}$ exactly recovers the total, confirming the product-of-ratios, sum-of-$\Delta v$'s relationship algebraically as well as physically.
:::

## Why $F = ma$ is wrong for a rocket

Here is the trap, and it is worth writing out explicitly because it is exactly the wrong turn a naive derivation takes. Someone reaching for Newton's second law on a rocket is tempted to write

$$
F = \frac{d(mv)}{dt} = m\frac{dv}{dt} + v\frac{dm}{dt},
$$

treat the whole right side as "force," and call the second term $v\,dm/dt$ the thrust.

This is wrong, and the clean way to see why is that it is **frame-dependent**. Thrust is a real, physical force produced by the engine — it must come out the same number regardless of which inertial frame you choose to describe the motion in. But $v$ in that formula is the vehicle's velocity in whatever frame you picked, so $v\,dm/dt$ changes if you switch to a frame moving at a different constant velocity, which no real force can do. A formula for a physical force that is not frame-independent cannot be correct, no matter how it was arrived at.

The derivation above never makes this mistake, because it never differentiates $m(t)v(t)$ as if the vehicle alone were a closed system — it is not; the vehicle continuously loses mass to the exhaust, so $m(t)v(t)$ is only part of a system whose momentum is actually conserved. The result derived there, restated in differential force form by allowing an external force $F_{\text{ext}}$ (gravity, aerodynamic drag) alongside propulsion, is

$$
m\,\frac{dv}{dt} = T + F_{\text{ext}}, \qquad T \equiv -v_e\,\frac{dm}{dt},
$$

where $T$ is the thrust — and because it is built from $v_e$, the exhaust speed *relative to the vehicle*, rather than from any inertial-frame velocity, it is properly frame-independent, exactly as a physical force must be. The trap and the fix differ by precisely this: the wrong version differentiates the vehicle's own momentum alone and mislabels a bookkeeping term as a force; the right version applies momentum conservation to the vehicle-plus-propellant system and finds the thrust as the real physical momentum flux carried by the exhaust.

::: warning
If asked to defend $m\,dv/dt = T + F_{\text{ext}}$ against the naive $d(mv)/dt$ version, the fastest correct answer is the frame-independence argument: a real force cannot depend on which inertial frame you chose to write the equations in, and $v\,dm/dt$ does, while $-v_e\,dm/dt$ does not, because $v_e$ is measured relative to the vehicle itself.
:::

## The rotational equations of motion under thrust

The same care about what is and is not a closed system carries over to rotation, with one added piece: a thrust vector that does not pass exactly through the center of mass produces a control moment. In body-frame form, with $\mathbf{I}$ the inertia tensor and $\boldsymbol{\omega}$ the body angular rate,

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega} \times (\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}_{\text{thrust}} + \mathbf{M}_{\text{ext}}, \qquad \mathbf{M}_{\text{thrust}} = \mathbf{r}_{\text{cg}\to\text{gimbal}} \times \mathbf{T},
$$

which is the rigid-body Euler equation (derived in full in a later lesson) with the thrust moment folded in as one contributor to $\mathbf{M}$. This is the working form used for thrust-vector-control authority: a gimbaled engine deflects the thrust vector by a small angle, and the resulting moment arm from the center of mass produces the control torque that steers the vehicle. The quasi-static assumption worth stating out loud is that $\mathbf{I}$ is evaluated at the instantaneous mass distribution — valid as long as propellant depletion is slow compared to the rotational dynamics you are analyzing, which is normally true away from very short, very aggressive maneuvers.

A fully rigorous treatment of a spinning, mass-ejecting body has one more piece worth naming even without deriving its exact size: the exhaust also carries away angular momentum about the vehicle's spin axis as it leaves, which produces a small additional moment — commonly called **jet damping** — that opposes the spin, built by the same control-volume logic as the translational thrust term but applied to angular momentum instead of linear momentum. It matters most for spin-stabilized vehicles and upper stages with a long coast or burn at nonzero spin rate; its magnitude depends on the mass-flow rate and the geometry of the nozzle exit flow, which is a modeling detail rather than a universal formula, and is worth naming to an interviewer as "the rotational analogue of the same momentum-flux argument" rather than presenting a specific number you have not derived.

::: example TVC control moment, worked
An engine producing $800\,\mathrm{kN}$ of thrust, gimbaled $5^\circ$ off the vehicle's longitudinal axis, mounted $2\,\mathrm{m}$ from the center of mass along that axis. The moment arm sees the *perpendicular* component of thrust, $T\sin(5^\circ)$:

$$
M = T \sin(5^\circ) \times r = 800{,}000 \times 0.0872 \times 2 \approx 1.39\times10^5\,\mathrm{N\,m} \approx 139\,\mathrm{kN\,m}.
$$

Sanity check: this is the number that has to overcome the vehicle's rotational inertia to produce useful angular acceleration within the attitude loop's required bandwidth — if $\mathbf{I}$ about that axis were, say, $5\times10^6\,\mathrm{kg\,m^2}$ for a large launch vehicle, the resulting angular acceleration would be on the order of $0.03\,\mathrm{rad/s^2}$, comfortably enough for ascent attitude control, which is the kind of quick cross-check worth doing out loud rather than leaving the moment as an unexamined number.
:::

## Check yourself

::: check
Derive, in one line each, why the $-dm_p\,v$ and $+dm_p\,v$ terms cancel in the momentum-conservation expansion, and why the $dm_p\,dv$ term is dropped.
:::

::: answer
They cancel because they are the same term with opposite signs, arising respectively from expanding $(m-dm_p)(v+dv)$ and from the ejected parcel's momentum $dm_p(v - v_e)$ — both carry a $dm_p v$ contribution, one negative (mass leaving the vehicle term) and one positive (that same mass appearing in the ejected-parcel term), and a closed system's total momentum accounting must include both, so they are required to cancel exactly rather than being dropped as an approximation. The $dm_p\,dv$ term is dropped because it is a product of two infinitesimals — in the limit $dt \to 0$, it vanishes faster than the first-order terms and contributes nothing to the derivative.
:::

::: check
Why does the rocket equation's $\Delta v$ not depend on how long the burn takes, even though a real flight's actual velocity gain very much depends on burn duration through gravity losses?
:::

::: answer
The derivation integrates $dv = -v_e\,dm/m$ over the whole burn, and that integral only cares about the mass at the start and the mass at the end — not the path or the rate at which the mass changed in between. Burn duration is set by mass flow rate (thrust divided by $v_e$), and a slower burn does spend more time fighting gravity along the way, which is a real, physically distinct loss (gravity loss, plus drag loss) that reduces the *actual* delta-v delivered to the vehicle's trajectory. But that is a separate loss term subtracted from the ideal $\Delta v$, not a modification of the ideal $\Delta v$ formula itself — the rocket equation describes the ideal case with no external forces, and gravity/drag losses are exactly the gap between that ideal and reality.
:::

::: check
An interviewer asks you to justify, without hand-waving, why $v\,dm/dt$ cannot be the thrust term. Give the argument in two sentences.
:::

::: answer
Thrust is a physical force produced entirely by the engine, so its value cannot depend on the observer's choice of inertial reference frame. $v\,dm/dt$ does depend on that choice, because $v$ is the vehicle's velocity in whatever frame was selected and changes if you boost to a different constant-velocity frame, while $-v_e\,dm/dt$ does not, because $v_e$ is defined relative to the vehicle itself — so only the second form can be a legitimate force.
:::

::: check
For the two-stage example in this lesson, why does splitting the required $\Delta v$ evenly between two stages reduce the needed mass ratio per stage from about 21.8 to about 4.7, rather than to about 10.9?
:::

::: answer
Mass ratio enters through a logarithm, not linearly: $\Delta v = v_e \ln(MR)$, so $MR = e^{\Delta v/v_e}$. Halving $\Delta v$ halves the *exponent*, and halving an exponent does not halve the result of an exponential — it takes its square root. $e^{9400/3050} \approx 21.8$, and $\sqrt{21.8} \approx 4.67 = e^{4700/3050}$, matching the two-stage figure exactly. This is the same reason staging is so effective: because the cost sits inside an exponential, a modest reduction in the $\Delta v$ demanded of any one stage produces a large reduction in the mass ratio that stage needs to deliver.
:::

::: check
Why is jet damping worth mentioning by name even if you cannot derive its exact magnitude on a whiteboard, rather than leaving the rotational equations of motion at $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$ with no further comment?
:::

::: answer
Naming it demonstrates that you recognize the rotational problem has the same structural subtlety as the translational one — a mass-ejecting body's rotational equations, derived with full rigor, pick up an extra term from angular momentum carried away by the exhaust, exactly parallel to how the translational thrust term came from linear momentum carried away by the exhaust. Stating this shows you understand *why* such a term should exist and where it would come from in a control-volume argument, which is a stronger answer than either omitting it (missing a real effect) or inventing a specific formula for it without having derived one (overclaiming precision you do not have).
:::

## Summary

| Idea | Statement |
| --- | --- |
| Rocket equation | $\Delta v = v_e \ln(m_0/m_f)$, from momentum conservation on the vehicle-plus-ejected-propellant system |
| No thrust term | The result is a whole-burn integral; thrust and mass flow set duration and therefore losses, not the ideal $\Delta v$ |
| Staging | Mass ratios multiply, $\Delta v$'s add — a modest cut in required $\Delta v$ per stage produces a large cut in required mass ratio |
| Why $F=ma$ fails | $d(mv)/dt$ mislabels a frame-dependent bookkeeping term as force; the correct thrust $-v_e\,dm/dt$ is frame-independent |
| Correct translational EOM | $m\,dv/dt = T + F_{\text{ext}}$, $T = -v_e\,dm/dt$ |
| Rotational EOM under thrust | $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}_{\text{thrust}} + \mathbf{M}_{\text{ext}}$, with $\mathbf{M}_{\text{thrust}}$ from the CG-to-gimbal moment arm, plus a smaller jet-damping term for a spinning body |

The next lesson takes the same cold-derivation treatment to the two formulas built on optimality arguments rather than momentum: the Kalman gain and the proportional-navigation guidance law.
