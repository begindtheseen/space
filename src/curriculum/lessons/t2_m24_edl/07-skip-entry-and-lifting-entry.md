---
id: l07-skip-entry-and-lifting-entry
title: Skip entry and lifting entry
minutes: 16
covers:
  - skip entry
  - lifting entry and bank-angle modulation
---

Lesson 6 left the corridor narrowing toward nothing as entry speed climbed, with both walls squeezed by the same mechanism — centrifugal relief pushing back against a trajectory that gravity wants to steepen. Nothing in that lesson gave the vehicle a way to fight back; the corridor's shape there was fixed entirely by entry geometry and a stated pair of limits, with zero lift and one atmospheric pass. This lesson introduces two tools that change that: spreading the energy removal across more than one pass through the atmosphere, and generating aerodynamic lift the vehicle can point to relieve deceleration outright. Apollo used both, and every subsequent lifting return — Shuttle, Orion, Dragon — has used the second.

## Skip entry: spending entry energy in instalments

A vehicle that grazes the atmosphere close to, but on the wrong side of, lesson 6's overshoot boundary does not fail catastrophically — it skips, losing some energy on the way through and re-emerging on a sub-orbital arc that comes back down later. **Skip entry** turns that near-failure into a deliberate technique: fly close enough to the overshoot boundary that the first pass sheds only a controlled fraction of entry energy, accept the skip, and come back down for a second (or final) pass at a now-lower, safer energy.

::: example How much energy a single skip pass removes
At $v_E = 11{,}000\ \mathrm{m/s}$, $\beta = 200\ \mathrm{kg/m^2}$, with the overshoot boundary at $\gamma_E = -5.16^\circ$ (lesson 6, zero lift), sweep the entry angle from well inside the skip regime toward that boundary and track the speed at which the trajectory re-crosses $120\ \mathrm{km}$ on its way back out:

| $\gamma_E$ | speed lost during the pass | exit flight-path angle |
| --- | --- | --- |
| $-2.0^\circ$ | $4.0\ \mathrm{m/s}$ ($0.04\%$) | $+2.00^\circ$ |
| $-3.0^\circ$ | $18.0\ \mathrm{m/s}$ ($0.16\%$) | $+3.00^\circ$ |
| $-4.0^\circ$ | $129.8\ \mathrm{m/s}$ ($1.18\%$) | $+3.96^\circ$ |
| $-4.5^\circ$ | $430.4\ \mathrm{m/s}$ ($3.91\%$) | $+4.32^\circ$ |
| $-5.0^\circ$ | $1758.1\ \mathrm{m/s}$ ($15.98\%$) | $+3.88^\circ$ |

A pass at $-2^\circ$ removes almost nothing; a pass at $-5^\circ$, close to the boundary, removes nearly a sixth of the entry speed in one dip. The exit angle stays close to the mirror image of the entry angle when little energy is lost — a nearly elastic graze — and departs from that symmetry once the pass removes enough speed to noticeably change the vehicle's orbital energy.
:::

This is the entire logic of skip entry: choosing how close to the overshoot boundary to fly is choosing how much energy to remove per pass. A single steep dive removes everything at once, concentrated into one short, intense peak (lessons 2 through 4). A shallower first pass removes a controlled fraction at a much gentler peak, and whatever energy remains is shed on a second, now-slower pass — trading one hard peak for two gentler ones, at the cost of a longer, more complex trajectory and a demand for guidance precise enough to hit the intended re-entry angle on the second pass rather than skip again or undershoot it. Apollo's lunar-return entries used a version of this idea for downrange control as much as for heating management: a controlled skip lets the vehicle "float" over a longer downrange distance than a single dive would allow, widening how far past the nominal landing point the guided vehicle can still reach.

::: key Skip entry
Flying deliberately close to the overshoot boundary so a controlled fraction of entry energy is shed on a first atmospheric pass, allowing the vehicle to skip back to a sub-orbital arc and complete deceleration on a second, gentler pass. Trades one high-peak, short entry for two lower-peak passes at the cost of trajectory complexity and a longer total flight — the same rate-versus-duration trade lesson 4 introduced, now controlled deliberately rather than fixed by vehicle design.
:::

## Lift and what bank angle actually modulates

A ballistic vehicle's only control is when and where it enters — after that, gravity, drag, and (from lesson 3) centrifugal relief run the trajectory. A vehicle with lift has a genuine in-flight control: **lift-to-drag ratio** $L/D$, set by trim angle of attack, is close to fixed for a given shape, but the *direction* lift points is not. Rolling the vehicle about its velocity vector by a **bank angle** $\sigma$ splits the (fixed-magnitude) lift vector into a component $L\cos\sigma$ still acting in the vertical plane — relieving deceleration exactly as t1_m18's equilibrium-glide relations describe — and a component $L\sin\sigma$ acting horizontally, out of the entry plane, which steers **crossrange**. Flying bank-angle-zero (lift fully "up") gives the maximum vertical relief and the widest corridor; banking trades some of that vertical relief for lateral steering authority. Because crossrange from a sustained bank accumulates rather than staying bounded, real guidance commands periodic **bank reversals** — flipping the sign of $\sigma$ once accumulated crossrange nears its allowed limit — which keeps the vehicle's ground track inside a bounded corridor around the target while still using most of the available vertical lift throughout the entry. This is exactly the mechanism Apollo, Shuttle, and every capsule flown with a trimmed offset centre of gravity since have used to fly a fixed $L/D$ vehicle to a precise landing point.

::: key Bank angle splits lift, it does not create it
$L$ is fixed by trim angle of attack; bank angle $\sigma$ only redirects it. $L\cos\sigma$ acts vertically (deceleration relief, corridor width); $L\sin\sigma$ acts horizontally (crossrange). Reversing $\sigma$ periodically bounds the crossrange excursion without giving up the vertical benefit most of the time.
:::

## How much lift buys: peak load, quantified

Hold entry speed and angle fixed and add lift to the same equations of motion this module has used throughout — an extra term $L/(mv)$ in $\dot\gamma$, with $L = (L/D)\cdot D$ acting always perpendicular to the velocity, in the vertical plane (zero bank, for this comparison). At $v_E = 11{,}000\ \mathrm{m/s}$, $\gamma_E = -8^\circ$, $\beta = 200\ \mathrm{kg/m^2}$:

| $L/D$ | peak deceleration | peak heat rate |
| --- | --- | --- |
| $0.0$ | $31.33\,g_0$ | $620.0\ \mathrm{W/cm^2}$ |
| $0.1$ | $24.47\,g_0$ | $595.7\ \mathrm{W/cm^2}$ |
| $0.2$ | $19.69\,g_0$ | $572.9\ \mathrm{W/cm^2}$ |
| $0.3$ | $16.39\,g_0$ | $551.6\ \mathrm{W/cm^2}$ |

A modest $L/D = 0.3$ — an Apollo-class capsule's figure — cuts peak deceleration nearly in half relative to zero lift, at the same entry angle and speed. The mechanism is indirect: lift does not act along the velocity, so it does not remove energy the way drag does; instead it changes how $\gamma$ evolves, holding the trajectory shallower for longer and spreading the same total energy removal over a broader, gentler pass — the same qualitative effect a shallower ballistic entry angle would have, bought here without changing the entry angle at all.

::: example Sanity check against zero lift
Setting $L/D = 0$ in the lifting-entry equations of motion must reproduce lesson 3's ballistic results exactly, since a lifting vehicle with no lift is a ballistic one. Run at $v_E = 11{,}000\ \mathrm{m/s}$, $\gamma_E = -6.5^\circ$, $\beta = 200\ \mathrm{kg/m^2}$: the lifting-entry code gives peak deceleration $18.789\,g_0$ at $h = 47.918\ \mathrm{km}$, matching the ballistic (zero-lift) truth model of lesson 3 to six significant figures. This is not a new physical result — it is the check that must pass before any of the nonzero-$L/D$ numbers above can be trusted, since a code that gets the $L/D=0$ limit wrong cannot be trusted at any other $L/D$ either.
:::

## How much lift buys: corridor width, quantified

Apply the same corridor construction as lesson 6 — overshoot boundary by bisection on skip-versus-capture, undershoot boundary by the $10\,g_0$ limit — at $v_E = 11{,}000\ \mathrm{m/s}$, now with lift:

| $L/D$ | overshoot wall | $g$-limit wall | corridor width |
| --- | --- | --- | --- |
| $0.0$ | $-5.16^\circ$ | $-5.71^\circ$ | $0.545^\circ$ |
| $0.1$ | $-5.49^\circ$ | $-6.16^\circ$ | $0.669^\circ$ |

A modest $L/D = 0.1$ widens this corridor by about $23\ \mathrm{percent}$ — genuinely useful room for a navigation and guidance system to work with. Notice that lift moves *both* walls steeper, not just the undershoot one: the same vertical lift that reduces peak deceleration at a given angle also helps the vehicle "float" through a graze that would otherwise be a clean skip, so the overshoot wall itself retreats to a steeper angle too. The corridor still widens overall, because the undershoot wall retreats by more than the overshoot wall does at this $L/D$, but the widening is not simply "lift relieves the steep wall and leaves the shallow one alone" — both move, and the net gain is the difference between two shifting boundaries, exactly the kind of result that needs the numerical machinery of this module rather than a rule of thumb.

::: warning Lift is not free width
Every additional degree of usable corridor from lift comes with the L/D value it took to buy it, and a real vehicle's L/D is constrained by its shape, its centre-of-gravity offset, and its stability at hypersonic angle of attack — not chosen independently for corridor width alone. A vehicle already committed to a low-$L/D$ shape for other reasons (packaging, mass, aerodynamic stability) cannot claim this lesson's corridor-widening numbers without first confirming it can actually fly at the assumed $L/D$.
:::

## Check yourself

::: check
Explain what skip entry trades away in exchange for lower peak heating and deceleration on any single atmospheric pass.
:::

::: answer
Total flight duration and trajectory complexity. Splitting entry energy removal across two (or more) atmospheric passes lowers the peak reached on each individual pass, but the vehicle spends longer overall completing the entry, and guidance must target the second pass's entry angle precisely — an error there risks skipping again (removing too little energy) or undershooting the second pass's own limits (removing too much, too fast).
:::

::: check
A vehicle flies bank angle $\sigma = 90^\circ$ throughout its entry. What happens to its vertical lift relief and its crossrange authority, and is this a sustainable steady-state strategy?
:::

::: answer
At $\sigma = 90^\circ$, $L\cos\sigma = 0$: all lift acts horizontally, giving maximum crossrange authority but zero vertical relief — the vehicle flies exactly as if it had no lift at all for the purposes of deceleration and corridor width, while its ground track steers steadily off the entry plane. This is not sustainable as a steady-state strategy for reaching a fixed target, because the crossrange offset grows without bound the longer it is flown; real guidance uses bank angle values well short of $90^\circ$ and reverses sign periodically rather than committing to one direction indefinitely.
:::

::: check
Why must the $L/D = 0$ case of a lifting-entry model exactly reproduce the ballistic results of lesson 3, and what would it mean if it did not?
:::

::: answer
A lifting vehicle with zero lift-to-drag ratio has, by definition, no lift at all — its equations of motion should reduce identically to the ballistic (ballistic-only) equations of lesson 3 once $L = (L/D)\cdot D = 0$ is substituted in. If the two disagreed, it would mean the lifting-entry code contains an error unrelated to the lift term itself — a bug in the shared drag, gravity, or curvature terms — since those terms are supposed to be unchanged from the ballistic model. Checking this limit is therefore a necessary (if not sufficient) test of the whole extended model, not a statement about lift specifically.
:::

::: check
At fixed entry angle and speed, why does adding lift reduce peak deceleration even though lift, being perpendicular to velocity, does no work and removes no kinetic energy directly?
:::

::: answer
Lift changes how the flight-path angle evolves rather than removing energy directly — it holds $\gamma$ shallower for longer than a purely ballistic (ρ-driven) trajectory would, spreading the same total deceleration over a longer, gentler pass through the atmosphere instead of a short, sharp one. The energy removed is unchanged (drag still does that work), but the peak rate at which it is removed drops because the vehicle spends more time doing the removing, at lower density, before diving as deep as the zero-lift case would.
:::

::: check
Adding lift widens the corridor in the worked example, but this lesson also shows the overshoot wall itself getting steeper with lift, not staying fixed. Reconcile these two facts.
:::

::: answer
Both facts are true and not in tension: lift makes it *easier* to skip at a given entry angle (retreating the overshoot boundary to a steeper angle, since the same vertical lift that relieves deceleration also floats a near-skip trajectory back out more readily) while simultaneously relieving deceleration enough to retreat the undershoot boundary by a larger amount. The corridor width is the *difference* between the two walls, and it widens overall in this example only because the undershoot wall moves further than the overshoot wall does — not because the overshoot wall stays put.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Skip entry | Deliberately grazing near the overshoot boundary to shed entry energy across more than one atmospheric pass |
| Energy lost per pass (worked example) | $0.04\%$ at $\gamma_E=-2^\circ$ rising to $16.0\%$ at $\gamma_E=-5^\circ$ (near the $-5.16^\circ$ overshoot wall), $v_E=11{,}000\ \mathrm{m/s}$ |
| Bank angle $\sigma$ | Splits fixed-magnitude lift into vertical ($L\cos\sigma$, deceleration relief) and horizontal ($L\sin\sigma$, crossrange) components |
| Bank reversal | Periodic sign flip of $\sigma$ that bounds accumulated crossrange while retaining most vertical lift benefit |
| Peak deceleration vs. $L/D$ (worked example) | $31.3\,g_0$ ($L/D=0$) falling to $16.4\,g_0$ ($L/D=0.3$) at fixed $\gamma_E=-8^\circ$, $v_E=11{,}000\ \mathrm{m/s}$ |
| Corridor width vs. $L/D$ (worked example) | $0.545^\circ$ ($L/D=0$) to $0.669^\circ$ ($L/D=0.1$) at $v_E=11{,}000\ \mathrm{m/s}$ — both walls move, net corridor widens |

The next lesson looks at how real flown vehicles turn this lift and bank authority into a closed-loop guidance law — Apollo's and the Shuttle's, the two entry-guidance families every crewed vehicle since has descended from.
