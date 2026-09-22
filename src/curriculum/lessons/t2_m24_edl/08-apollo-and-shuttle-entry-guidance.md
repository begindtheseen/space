---
id: l08-apollo-and-shuttle-entry-guidance
title: Apollo and Shuttle entry guidance
minutes: 16
covers:
  - Apollo entry guidance and its descendants
  - Shuttle drag-vs-energy entry guidance
---

Lesson 5 quantified how sensitive an unguided ballistic entry is to a small error: a $0.1^\circ$ dispersion in entry flight-path angle, well within what navigation uncertainty alone can produce, shifted downrange distance by about $30\ \mathrm{km}$ for the lunar-return case worked there. No landing ellipse a mission plans around can absorb that from dispersion alone, on top of whatever the target itself demands. Every crewed vehicle that has flown a controlled entry has solved this the same fundamental way: fly with some lift, and close the loop on bank angle in real time to correct the errors as they show up rather than trying to eliminate them before flight. This lesson works through the two guidance families that came out of that requirement — Apollo's and the Shuttle's — and the reasoning that shaped each one.

## What entry guidance can measure

Before deriving either guidance law, notice something about the sensor an entry vehicle actually has available: an accelerometer measures **specific force** — the non-gravitational force per unit mass acting on the vehicle — and gravity itself produces no accelerometer reading at all, because a vehicle in free fall (in orbit, or coasting before atmospheric interface) reads zero on every axis. The instant aerodynamic forces appear, the accelerometer begins reading them directly: on a lifting entry at zero bank, the sensed acceleration *is* essentially the drag and lift the vehicle is producing, to the precision of the instrument. This is not a subtle point — it is the reason both guidance laws in this lesson are built around **measured deceleration**, not around inertial position alone. A vehicle's inertial position must be propagated and is only as good as its initial conditions and its model of the forces acting on it; its sensed deceleration is a direct, real-time measurement of exactly the force entry guidance most needs to know about.

::: key Entry guidance is drag-referenced because drag is measured, not modelled
An IMU reads zero under gravity alone; the moment the atmosphere begins to act, it reads the aerodynamic deceleration directly. Both Apollo-heritage and Shuttle-heritage guidance use this measured quantity as their primary real-time feedback, rather than relying only on a propagated position estimate that has no independent check until landing.
:::

## Apollo: a drag-referenced predictor-corrector

Apollo's entry guidance carries a **reference trajectory** computed before flight: a table (or fitted curve) of drag acceleration expected as a function of inertial velocity, $\bar D(V)$, for the nominal entry. In flight, the guidance measures actual drag $D(V)$ at the current velocity and compares it to the reference. A drag *higher* than reference at a given speed means the vehicle is flying through denser air, or a steeper effective path, than planned — which the guidance's **predictor** step turns into a predicted range error by propagating the consequences of that drag deficit or excess forward to the expected landing point, using a linearised sensitivity built from the reference trajectory. The **corrector** step then commands a bank angle — magnitude to adjust the vertical lift component and correct the predicted range error, sign to steer toward or away from the target in crossrange, with periodic reversals (lesson 7) to keep crossrange bounded. The cycle repeats every guidance update, continually re-predicting and re-correcting as new drag measurements arrive, which is what makes it a **closed-loop** scheme rather than a single, one-shot correction.

::: example What a bank-angle correction is actually buying
Using the equilibrium-glide range relation from t1_m18, $s = (L/D)\,(r/2)\ln\!\left[1/(1-v_E^2/v_c^2)\right]$, a vehicle entering at $v_E = 7.5\ \mathrm{km/s}$ with trim $L/D = 0.3$ and $v_c = \sqrt{\mu/R_\oplus} = 7.905\ \mathrm{km/s}$ has a full-lift ($\sigma = 0$) glide range of $2203.6\ \mathrm{km}$. Commanding a $30^\circ$ bank reduces the *effective* vertical lift-to-drag ratio to $(L/D)\cos30^\circ = 0.2598$, and the corresponding range falls to $1908.4\ \mathrm{km}$ — a reduction of $295.2\ \mathrm{km}$ from that one bank command alone. A $45^\circ$ bank reduces range by $645.4\ \mathrm{km}$. This is the lever Apollo's corrector step pulls: a predicted range error of a few hundred kilometres — entirely plausible from the kind of entry-angle dispersion lesson 5 quantified, compounded over an actual atmosphere's density variability — is well within what a bank angle in this range can correct, which is exactly why bank-angle modulation, not entry-angle targeting alone, is what makes a precision landing possible.
:::

Two features of this scheme matter beyond the mechanics. First, because the predictor uses the *reference trajectory's* sensitivity rather than trying to solve the full nonlinear entry dynamics onboard in real time, it is deliberately simple enough to run on 1960s flight computer hardware — a design constraint as real as any aerodynamic one. Second, for the highest-energy returns (direct lunar entry, well up the entry-speed axis lesson 6 showed narrowing fastest), Apollo's guidance included a skip phase (lesson 7): if the predicted range fell short even at maximum lift, the trajectory could graze the atmosphere, shed a controlled fraction of energy, and re-enter for a second, better-aimed pass, extending the guidance's effective range authority beyond what a single continuous descent could reach.

## Shuttle: tracking a reference profile against energy

The Shuttle's guidance took a different independent variable. Rather than referencing drag against *velocity*, it referenced a normalised drag acceleration against **specific energy**,

$$
E = \frac{v^2}{2} - \frac{\mu}{r},
$$

the same total mechanical energy per unit mass used throughout t2_m19's orbital mechanics. During entry, drag is the only non-conservative force acting (gravity is conservative and contributes nothing to a net change in $E$), so $E$ decreases smoothly and monotonically for as long as the vehicle is losing energy to the atmosphere — a property velocity alone does not share once winds, density dispersions, or a skip enter the picture, and time shares even less of, since atmospheric density on the day of flight can stretch or compress the *time* a given deceleration profile takes without changing how much *energy* has been shed. Scheduling the reference profile against energy instead makes the guidance considerably more robust to exactly the kind of atmospheric dispersion that a real entry, as opposed to a nominal one, always has.

The Shuttle's guidance tracked a reference *drag-acceleration-versus-energy* profile shaped to respect the vehicle's structural, thermal, and control-authority limits simultaneously along the whole entry — not unlike lesson 6's corridor, but expressed as a continuous bound over the whole trajectory rather than a single entry-angle window — and commanded bank-angle **magnitude** to track that profile (steeper effective bank reduces the vertical lift component and lets the vehicle descend faster relative to the reference, shallower bank does the opposite) while bank-angle **sign** was flipped whenever accumulated crossrange approached a deadband, exactly the reversal logic of lesson 7. Where Apollo's scheme explicitly predicts a miss distance and computes a correction to null it, the Shuttle's scheme more directly tracks a pre-shaped reference at every instant — a difference in guidance philosophy (predictor-corrector versus reference-tracking) more than in the underlying physics, since both ultimately modulate the same bank angle to relieve or increase vertical lift.

::: key Two guidance philosophies, one control authority
Apollo: predict range error from a measured drag deficit relative to a drag-versus-velocity reference, correct bank angle to null the prediction. Shuttle: track a pre-shaped drag-versus-*energy* reference directly, using energy because it decreases monotonically regardless of atmospheric dispersion in a way that time and even velocity do not. Both close the loop on measured (accelerometer-sensed) deceleration and both actuate through bank angle.
:::

::: example Why energy survives a dispersion that velocity's timing does not
Consider two otherwise identical entries, one through a slightly denser atmosphere than nominal. The denser one decelerates faster at any given altitude, so at a fixed *time* after entry interface, the two vehicles have different velocities — a time-referenced guidance scheme would find its reference profile out of step almost immediately. But because drag is the only mechanism changing $E$, and a denser atmosphere converts the same total kinetic-plus-potential energy to heat over a shorter time without changing how much total energy must ultimately be shed to reach the target conditions, a reference profile expressed as drag-versus-$E$ stays valid for both entries: each moves along it at a different rate. This is the concrete justification for choosing $E$, not time or velocity alone, as the profile's independent variable.
:::

## Descendants

Both families are still flying. Orion's entry guidance is a direct descendant of Apollo's predictor-corrector, extended and re-tuned for modern flight computers and a wider range of return trajectories, including skip entries for lunar-return-class missions. NASA's Mars Science Laboratory adapted Apollo-heritage entry guidance for a robotic Mars landing, closing the loop on bank angle to control range and crossrange through the Martian atmosphere before its parachute phase (lesson 13 returns to what changes for Mars). Commercial crew vehicles fly variants of the same predictor-corrector logic. No flown crewed or robotic guided entry vehicle has abandoned bank-angle modulation as the actuator, or measured deceleration as the primary feedback — the two ideas this lesson built up from first principles are, six decades on, still the foundation every entry guidance law stands on.

## Check yourself

::: check
Explain why an accelerometer is a uniquely useful sensor for entry guidance specifically, in a way it is not for guidance during an unpowered coast in orbit.
:::

::: answer
An accelerometer measures specific force — non-gravitational force per unit mass — and reads zero under gravity alone, so during an unpowered orbital coast it has essentially nothing to measure (the vehicle is in free fall). During atmospheric entry, aerodynamic drag and lift are real, non-gravitational forces, and the accelerometer measures them directly and immediately, giving entry guidance a real-time, independent measurement of exactly the forces its reference trajectory was built to predict — a measurement with no equivalent during an orbital coast.
:::

::: check
In Apollo's predictor-corrector scheme, what does the predictor step compute, and what does the corrector step do with it?
:::

::: answer
The predictor step compares measured drag at the current velocity to the reference drag-versus-velocity profile and propagates the resulting deficit or excess forward, using a linearised sensitivity, into a predicted range (miss-distance) error at the expected landing point. The corrector step commands a bank angle — magnitude to adjust the vertical lift component and null the predicted range error, sign (with periodic reversals) to steer and bound crossrange — and the whole cycle repeats as new drag measurements arrive.
:::

::: check
Why does the Shuttle's guidance reference specific energy $E = v^2/2 - \mu/r$ rather than velocity or elapsed time?
:::

::: answer
Drag is the only non-conservative force acting during entry, so $E$ decreases smoothly and monotonically as energy is shed to the atmosphere, regardless of how atmospheric density dispersions stretch or compress the relationship between time and velocity on a given day. A reference profile expressed as drag-versus-$E$ stays valid even when a denser or thinner atmosphere shifts the entry's timing, because the profile only depends on how much energy has been removed so far, not on when or how quickly it was removed.
:::

::: check
A $30^\circ$ bank command was shown in this lesson to reduce glide range by about $295\ \mathrm{km}$ for a specific vehicle and entry state. Why is this number vehicle- and state-specific rather than a general figure every entry guidance law can assume?
:::

::: answer
The relation used, $s = (L/D)(r/2)\ln[1/(1-v_E^2/v_c^2)]$, depends on the vehicle's trim $L/D$ and the entry speed $v_E$ relative to circular speed $v_c$; changing either changes how much range a given bank angle trades away. A vehicle with a different trim $L/D$, or an entry at a different speed relative to $v_c$, would see a different range sensitivity to the same $30^\circ$ bank command, so the number is a worked illustration of the mechanism, not a universal constant.
:::

::: check
Both Apollo-heritage and Shuttle-heritage guidance actuate through bank angle rather than through, say, direct control of angle of attack. Why does this make sense given what lesson 7 established about bank angle?
:::

::: answer
Lesson 7 established that trim angle of attack fixes the lift *magnitude* for a given vehicle shape — it is not a fast, continuously adjustable control during a hypersonic entry — while bank angle can redirect that fixed-magnitude lift vector freely and quickly between the vertical (deceleration-relief, range) and horizontal (crossrange) directions. Since the guidance problem is precisely about trading between range control and crossrange control in real time, bank angle is the one control variable available that touches both without requiring the vehicle to change its aerodynamic trim state.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Specific force | What an accelerometer measures; zero under gravity alone, nonzero once aerodynamic forces act — the basis of drag-referenced guidance |
| Apollo guidance | Predictor-corrector: measured drag vs. a drag-velocity reference predicts range error; bank angle nulls it |
| $s = (L/D)(r/2)\ln[1/(1-v_E^2/v_c^2)]$ | Equilibrium-glide range (t1_m18), the sensitivity Apollo-style bank commands act through |
| Bank $30^\circ$ example | $L/D=0.3\to0.2598$ effective; range falls from $2203.6$ to $1908.4\ \mathrm{km}$ |
| Specific energy $E = v^2/2 - \mu/r$ | Monotonically decreasing during entry (drag is the only non-conservative force); the Shuttle's reference-profile independent variable |
| Shuttle guidance | Tracks a pre-shaped drag-vs-energy reference directly; bank magnitude controls range, bank sign (with reversals) controls crossrange |
| Descendants | Orion (Apollo-heritage predictor-corrector), Mars Science Laboratory (Apollo-heritage, robotic), commercial crew vehicles |

The next lesson turns from the guidance law to the aerodynamics it is steering through — hypersonic flow around a blunt vehicle, and what changes as that vehicle decelerates through the transonic regime on its way to a subsonic descent.
