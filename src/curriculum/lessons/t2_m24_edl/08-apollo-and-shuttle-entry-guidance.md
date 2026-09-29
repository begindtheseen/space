---
id: l08-apollo-and-shuttle-entry-guidance
title: Apollo and Shuttle entry guidance
minutes: 23
covers:
  - Apollo entry guidance and its descendants
  - Shuttle drag-vs-energy entry guidance
---

Throw a paper airplane at a wastebasket across the room. Once it leaves your hand, you can only watch. A small wobble in your throw becomes a big miss at the far end. Now picture riding a bike to the same wastebasket. You steer the whole way, fixing each small drift as it appears, and you arrive right on it.

An unguided entry is the paper airplane. Lessons 5 and 6 showed how unforgiving that is. A $\pm5\%$ uncertainty in ballistic coefficient moves the landing point by kilometers (lesson 5). The entry angle is worse. In this module's truth model, a zero-lift capsule entering at $11{,}000\ \mathrm{m/s}$ and $\gamma_E = -5.5^\circ$ lands $1726\ \mathrm{km}$ downrange of the entry interface; enter at $-5.6^\circ$ instead and it lands at $1591\ \mathrm{km}$. A tenth of a degree — well within what navigation error alone can produce — moves the landing point by $135\ \mathrm{km}$. Then the real atmosphere, thicker or thinner than the model on the day, adds its own error on top.

Every crewed vehicle that has flown a controlled entry has solved this the same way: fly with some lift, and steer with the bank angle the whole way down, correcting errors as they show up instead of trying to remove them all before entry. That is the bike. This lesson works through the two guidance families that came out of that idea — Apollo's and the Shuttle's — and the reasoning behind each.

## What entry guidance can measure

Stand on a bathroom scale in an elevator. When the elevator starts up, the scale reads more. If the cable snapped and you fell freely, the scale would read zero — you and the scale fall together, and nothing presses on it.

An **accelerometer** is a very precise version of that scale. It measures **[[specific force|specific-force]]**: the non-gravitational force on the vehicle, per kilogram of the vehicle. Gravity alone produces no reading. A spacecraft coasting in orbit, or on its way down before it reaches the air, is in free fall, and its accelerometers read zero on every axis.

The moment the atmosphere starts to push, that changes. The accelerometer reads the drag and lift directly, as precisely as the instrument allows. Nothing else is pushing, so what it measures *is* the aerodynamic force.

That is why both guidance laws in this lesson are built around **measured deceleration**, not position alone. The vehicle's position has to be worked out by adding up motion from a starting point, so it is only as good as that starting point and the force model. Its sensed deceleration is a direct, live measurement of exactly the force entry guidance most needs to know.

::: key Entry guidance is drag-referenced because drag is measured, not modeled
An IMU reads zero under gravity alone; the moment the atmosphere begins to act, it reads the aerodynamic deceleration directly. Both Apollo-heritage and Shuttle-heritage guidance use this measured quantity as their primary real-time feedback, rather than relying only on a propagated position estimate that has no independent check until landing.
:::

(An **IMU**, inertial measurement unit, is the box of accelerometers and gyroscopes that does this measuring.)

## Apollo: a drag-referenced predictor-corrector

Think of driving to a friend's house with a note from the day before: "at the gas station, you should be doing 50; at the bridge, 40." Compare your speedometer with the note at each landmark, and you know whether you are ahead or behind, and by roughly how much.

Apollo's guidance carried a note like that, called a **reference trajectory**. It was worked out before flight: a table of the drag acceleration the capsule should feel at each speed on a nominal entry, written $\bar D(V)$ (read "D bar of V"), along with the matching sink rate. Speed $V$ plays the role of the landmarks.

In flight, the guidance runs a loop with two steps.

**The predictor.** It compares the measured drag $D$ with the reference $\bar D$ at the current speed. Drag *higher* than the reference means the capsule is in denser air, or on a steeper path, than planned, so it is slowing faster and will fall short. Using sensitivities computed from the reference trajectory, the predictor turns that difference into a predicted range to the landing point. In outline,

$$
R_{\text{pred}} = R_{\text{ref}} + \frac{\partial R}{\partial D}\,(D - \bar D) + \frac{\partial R}{\partial \dot r}\,(\dot r - \bar{\dot r}),
$$

where $R_{\text{ref}}$ is the range the reference trajectory still has to fly from this speed, $\dot r$ ("r dot") is the sink rate, and the partial derivatives (read "the change in $R$ per unit change in $D$", and so on) are stored numbers. This is a **[[linearized|linearized]]** prediction: it assumes small differences from the reference change the range in proportion.

**The corrector.** It compares the predicted range with the range actually left to the target, and asks for more or less vertical lift to close the gap. More lift up stretches the range; less shortens it. The capsule's lift-to-drag ratio is fixed (lesson 7), so the only way to get a smaller *vertical* $L/D$ is to bank. The commanded bank angle follows from

$$
\cos\sigma = \frac{(L/D)_{\text{cmd}}}{L/D}.
$$

The bank's size sets the vertical lift. Its sign — left or right — steers crossrange, with bank reversals (lesson 7) keeping crossrange inside a deadband.

The loop repeats every guidance cycle, re-predicting and re-correcting as new drag measurements arrive. That is what makes it a **closed-loop** scheme, not one correction made once. The name for this shape is a **[[predictor-corrector|predictor-corrector]]**.

::: example What a bank-angle correction is actually buying
Use the equilibrium-glide range relation from t1_m18:

$$
s = \frac{L}{D}\,\frac{r}{2}\,\ln\frac{1}{1 - v_E^2/v_c^2}.
$$

Take a capsule entering at $v_E = 7.5\ \mathrm{km/s}$ with trim $L/D = 0.3$. The circular speed is $v_c = \sqrt{\mu/R_\oplus} = \sqrt{3.986 \times 10^{14} / 6.378 \times 10^{6}} = 7.905\ \mathrm{km/s}$.

**Step 1, the log factor.** $v_E^2/v_c^2 = (7.5/7.905)^2 = 0.900$, so $1 - 0.900 = 0.100$ and $\ln(1/0.100) = 2.303$.

**Step 2, full lift up.** With $r/2 = 6378/2 = 3189\ \mathrm{km}$, the range at $\sigma = 0$ is $0.3 \times 3189 \times 2.303 = 2203.6\ \mathrm{km}$.

**Step 3, bank $30^\circ$.** The vertical $L/D$ drops to $0.3\cos 30^\circ = 0.3 \times 0.866 = 0.2598$. Range scales in proportion to $L/D$, so it falls to $0.2598 \times 3189 \times 2.303 = 1908.4\ \mathrm{km}$. That one bank command took away $2203.6 - 1908.4 = 295.2\ \mathrm{km}$.

**Step 4, bank $45^\circ$.** Now $0.3\cos 45^\circ = 0.212$, the range is $1558.2\ \mathrm{km}$, and the reduction is $645.4\ \mathrm{km}$.

Sanity check: $295\ \mathrm{km}$ divided by $2204\ \mathrm{km}$ is $13.4\%$, which is exactly $1 - \cos 30^\circ$, as it must be when range is proportional to vertical $L/D$.

This is the **[[lever the corrector pulls|range-bars]]**. A range error of a hundred kilometers or more — easily produced by a tenth of a degree of entry-angle error plus a real atmosphere's density swings — sits well inside what bank angles in this range can correct. That is why bank-angle modulation, not entry-angle targeting alone, is what makes a precision landing possible.
:::

Two more features of Apollo's scheme matter.

First, the predictor uses the reference trajectory's stored sensitivities instead of solving the full nonlinear entry equations onboard. That kept it simple enough to run on the **[[1960s flight computer|agc]]** — a design limit as real as any aerodynamic one.

Second, for the highest-energy returns, the guidance had a long-range mode that used skip entry (lesson 7). For a landing point far downrange, it steered the capsule back *up* out of the dense atmosphere after the first dip — the "up-control" phase — let it coast on a ballistic arc — the "Kepler" phase — and then brought it back in for a final guided descent. This stretched the capsule's reach well past what one continuous descent could manage.

::: key Apollo entry guidance
It flew a reference drag-vs-velocity profile with analytic predictors, commanding bank angle to null the predicted range error, with a skip-out phase for lunar-return energies. Its descendants still fly on crew capsules today.
:::

## Shuttle: tracking a reference profile against energy

The Shuttle's guidance chose a different yardstick. Instead of asking "what should my drag be at this *speed*?", it asked "what should my drag be at this *energy*?"

The energy it used is the **[[specific energy|specific-energy]]** — the total mechanical energy per kilogram, from t2_m19's orbital mechanics:

$$
E = \frac{v^2}{2} - \frac{\mu}{r}.
$$

The first term is kinetic energy per kilogram. The second is gravitational potential energy per kilogram (negative, and more negative closer to the planet). Units are joules per kilogram, which is the same as $\mathrm{m^2/s^2}$.

Here is the property that makes $E$ special during entry: it can only go down. Gravity trades kinetic and potential energy back and forth but never changes their sum. Lift is square to the velocity, so it does no work. Drag is the only force left, and it always takes energy away. So $E$ falls smoothly and steadily for the whole entry.

::: note Why it has to be true
Take the rate of change of $E$, using the chain rule and $d(-\mu/r)/dt = (\mu/r^2)\,\dot r$:

$$
\dot E = v\,\dot v + \frac{\mu}{r^2}\,\dot r.
$$

Put in the equations of motion from lessons 3 and 7, $\dot v = -D - g\sin\gamma$ and $\dot r = v\sin\gamma$, with $g = \mu/r^2$:

$$
\dot E = v(-D - g\sin\gamma) + g\,v\sin\gamma = -D\,v.
$$

The gravity terms cancel exactly. Drag $D$ and speed $v$ are both positive, so $\dot E$ is always negative. Lift does not appear at all.

One more step turns this into range. The ground distance flown changes at $\dot s = v\cos\gamma$, which is very nearly $v$ for the shallow angles of a lifting entry. Divide:

$$
\frac{dE}{ds} = \frac{-D\,v}{v\cos\gamma} \approx -D
\quad\Longrightarrow\quad
s_{\text{to go}} = \int_{E_{\text{target}}}^{E} \frac{dE}{D(E)}.
$$

Drag acceleration is energy lost per meter flown. So a drag-versus-energy profile tells you the range still to fly, by **[[one integral|range-integral]]**.
:::

Why is that better than speed or time? Speed does not always fall steadily — on a skip's coast arc, for example, the vehicle speeds up again as it falls. Time is worse. A denser atmosphere than planned stretches or squeezes *when* each bit of deceleration happens, without changing how much energy must be shed in total. A profile written against energy stays meaningful on any day.

::: example Range from a drag-versus-energy profile
The Shuttle flew one stretch of its entry at nearly constant drag. Take a simplified version of that: the vehicle holds $D = 10\ \mathrm{m/s^2}$ (about $1\,g_0$) while slowing from $6000\ \mathrm{m/s}$ at $70\ \mathrm{km}$ altitude to $3000\ \mathrm{m/s}$ at $50\ \mathrm{km}$. How far does it fly?

**Step 1, energy at the start.** $r_1 = 6378 + 70 = 6448\ \mathrm{km}$.

$$
E_1 = \frac{6000^2}{2} - \frac{3.986 \times 10^{14}}{6.448 \times 10^{6}} = 18.00 - 61.82 = -43.82\ \mathrm{MJ/kg}.
$$

**Step 2, energy at the end.** $r_2 = 6428\ \mathrm{km}$.

$$
E_2 = \frac{3000^2}{2} - \frac{3.986 \times 10^{14}}{6.428 \times 10^{6}} = 4.50 - 62.01 = -57.51\ \mathrm{MJ/kg}.
$$

**Step 3, energy shed.** $E_1 - E_2 = 13.69\ \mathrm{MJ/kg}$. Most of it, $13.5\ \mathrm{MJ/kg}$, is kinetic; the $20\ \mathrm{km}$ drop in height adds $0.19\ \mathrm{MJ/kg}$.

**Step 4, range.** With constant drag the integral is a division:

$$
s = \frac{E_1 - E_2}{D} = \frac{13.69 \times 10^{6}\ \mathrm{J/kg}}{10\ \mathrm{m/s^2}} = 1.369 \times 10^{6}\ \mathrm{m} = 1369\ \mathrm{km}.
$$

Check the units: a joule per kilogram is $\mathrm{m^2/s^2}$, and dividing by $\mathrm{m/s^2}$ leaves meters. Good.

**A denser day.** Suppose the air is thicker than planned, and the drag at the planned altitudes comes out at $12\ \mathrm{m/s^2}$. Left alone, the vehicle sheds the same $13.69\ \mathrm{MJ/kg}$ in only $13.69 \times 10^6 / 12 = 1141\ \mathrm{km}$ — $228\ \mathrm{km}$ short. The guidance sees the measured drag above the profile and banks toward lift up. The vehicle floats a little higher, in thinner air, until drag is back to $10\ \mathrm{m/s^2}$. It then flies the planned $1369\ \mathrm{km}$, whatever the density turned out to be.
:::

The Shuttle's reference **drag-versus-energy** profile was shaped to respect the vehicle's heating, structural and control limits all at once, along the whole entry. That is like lesson 6's corridor, but stretched into a continuous band over the whole flight instead of one window of entry angles. (The real profile was built from **[[several joined segments|shuttle-segments]]**.)

To track it, the guidance commanded bank-angle **magnitude**. A steeper bank reduces the vertical lift, so the vehicle sinks into denser air and its drag rises. A shallower bank does the opposite. The bank-angle **sign** was flipped whenever the heading error toward the runway grew past a deadband — the reversal logic of lesson 7.

::: key Shuttle entry guidance
It tracked a reference drag-acceleration profile built in segments against velocity and energy rather than time, which made it robust to atmospheric dispersion, with bank reversals triggered by a crossrange deadband.
:::

Compare the two. Apollo *predicts* a miss distance and computes a correction to null it. The Shuttle *tracks* a pre-shaped reference at every instant, and because range-to-go follows from the profile, holding the profile is the same as flying the right range. That is a difference in guidance philosophy — predictor-corrector versus reference-tracking — more than in physics. Both modulate the same bank angle to add or remove vertical lift.

::: key Two guidance philosophies, one control authority
Apollo: predict range error from a measured drag deficit relative to a drag-versus-velocity reference, correct bank angle to null the prediction. Shuttle: track a pre-shaped drag-versus-*energy* reference directly, using energy because it decreases monotonically regardless of atmospheric dispersion in a way that time and even velocity do not. Both close the loop on measured (accelerometer-sensed) deceleration and both actuate through bank angle.
:::

::: example Why energy survives a dispersion that timing does not
Take two otherwise identical entries, one through slightly denser air than planned. The denser one decelerates harder at any given altitude. So at a fixed *time* after entry interface, the two vehicles have different speeds and energies. A guidance scheme indexed by time would compare the second vehicle with the wrong point on its reference almost at once.

Now index by energy. Drag is the only thing changing $E$ (the note above proved it). A denser atmosphere turns the same energy into heat sooner, but the total energy that must be shed to reach the target conditions is unchanged: in the previous example, $13.69\ \mathrm{MJ/kg}$ either way. Each vehicle moves along the same drag-versus-$E$ curve, one of them a little faster in time. The reference stays valid for both, and the range-to-go it implies, $\int dE/D$, is correct for both.

That is the concrete reason for choosing $E$, not time and not velocity alone, as the profile's independent variable.
:::

## Descendants

Both families are still flying.

- **Orion's** entry guidance descends directly from Apollo's. It keeps Apollo's final-phase logic and adds a numerical predictor-corrector for the skip part of a lunar return, re-tuned for modern flight computers. That is what flew the Artemis I skip entry in 2022.
- **Mars Science Laboratory**, which landed the Curiosity rover in 2012, adapted Apollo's final-phase guidance for a robotic Mars entry. It banked to control range and crossrange through the thin Martian air before opening its parachute, and shrank the **[[landing ellipse|landing-ellipse]]** dramatically. Mars 2020 flew the same approach. Lesson 13 returns to what changes on Mars.
- Today's crew capsules, including Crew Dragon, are blunt bodies trimmed to a small $L/D$ by an offset center of mass, steered by rolling that lift vector.

Guidance laws have grown more sophisticated, and newer ones predict the whole remaining trajectory numerically on board. But the two ideas this lesson built up — measured deceleration as the feedback, and bank angle as the actuator — are still at the heart of nearly every guided entry flown, more than half a century after Apollo.

## Check yourself

::: check
Why is an accelerometer so useful for entry guidance, when it tells you almost nothing during an unpowered coast in orbit?
:::

::: answer
An accelerometer measures specific force — non-gravitational force per unit mass — and reads zero under gravity alone. During an unpowered orbital coast the vehicle is in free fall, so there is essentially nothing to measure.

During entry, drag and lift are real non-gravitational forces, and the accelerometer measures them directly and immediately. That gives the guidance a live, independent measurement of exactly the forces its reference trajectory was built to predict. There is no equivalent measurement during a coast.
:::

::: check
In Apollo's predictor-corrector, what does the predictor compute, and what does the corrector do with it?
:::

::: answer
The predictor compares the measured drag at the current velocity with the reference drag-versus-velocity profile. Using linearized sensitivities stored from the reference trajectory, it turns the difference (and the sink-rate difference) into a predicted range at the landing point, and so a predicted range error.

The corrector commands a bank angle. Its magnitude sets the vertical lift, chosen to null the predicted range error. Its sign, with periodic reversals, steers and bounds crossrange. The whole cycle repeats as new drag measurements arrive.
:::

::: check
Why does the Shuttle's guidance reference specific energy $E = v^2/2 - \mu/r$ instead of velocity or elapsed time?
:::

::: answer
Drag is the only force doing work on the vehicle during entry: gravity only trades kinetic and potential energy, and lift is square to the velocity. So $\dot E = -Dv$, and $E$ falls smoothly and steadily as energy is shed, however atmospheric density on the day stretches or squeezes the timing.

A reference written as drag versus $E$ therefore stays valid when a denser or thinner atmosphere shifts the entry's timing, because it depends only on how much energy has been removed so far, not on when or how fast. It also gives range-to-go directly, as $\int dE/D$. Velocity is weaker, because it does not fall steadily on every kind of trajectory (it rises again on a skip's coast arc), and time is weakest of all.
:::

::: check
This lesson showed a $30^\circ$ bank command cutting glide range by about $295\ \mathrm{km}$ for one vehicle and entry state. Why is that number specific to that case, not a figure every entry guidance law can assume?
:::

::: answer
The relation used, $s = (L/D)(r/2)\ln[1/(1-v_E^2/v_c^2)]$, depends on the vehicle's trim $L/D$ and on the entry speed $v_E$ relative to circular speed $v_c$. Change either and the range traded away by the same $30^\circ$ bank changes. For example, the log factor was $2.303$ at $7.5\ \mathrm{km/s}$; at a slower entry it would be smaller, and so would every range in the example. The number illustrates the mechanism; it is not a universal constant.
:::

::: check
Both Apollo-heritage and Shuttle-heritage guidance steer through bank angle rather than, say, direct control of angle of attack. Why does that make sense, given lesson 7?
:::

::: answer
Lesson 7 established that the trim angle of attack fixes the lift *magnitude* for a given shape. It is not a fast, continuously adjustable control during a hypersonic entry. Bank angle, on the other hand, can redirect that fixed lift quickly and freely between vertical (deceleration relief, range) and horizontal (crossrange).

The guidance problem is exactly a real-time trade between range control and crossrange control. Bank angle is the one control that touches both without asking the vehicle to change its aerodynamic trim.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Specific force | What an accelerometer measures; zero under gravity alone, nonzero once aerodynamic forces act — the basis of drag-referenced guidance |
| $\bar D(V)$ | Apollo's reference drag acceleration as a function of velocity |
| Apollo guidance | Predictor-corrector: measured drag vs. a drag-velocity reference predicts range error; bank angle nulls it; long-range skip mode (up-control, Kepler, final phase) |
| $\cos\sigma = (L/D)_{\text{cmd}}/(L/D)$ | How a commanded vertical $L/D$ becomes a bank angle |
| $s = (L/D)(r/2)\ln[1/(1-v_E^2/v_c^2)]$ | Equilibrium-glide range (t1_m18), the sensitivity Apollo-style bank commands act through |
| Bank $30^\circ$ example | $L/D=0.3\to0.2598$ effective; range falls from $2203.6$ to $1908.4\ \mathrm{km}$ |
| Specific energy $E = v^2/2 - \mu/r$ | Monotonically decreasing during entry, $\dot E = -Dv$; the Shuttle's reference-profile independent variable |
| $s_{\text{to go}} \approx \int dE/D$ | Range to go from a drag-versus-energy profile; $1369\ \mathrm{km}$ for $13.69\ \mathrm{MJ/kg}$ at $D = 10\ \mathrm{m/s^2}$ |
| Shuttle guidance | Tracks a pre-shaped drag-vs-energy reference directly; bank magnitude controls range, bank sign (with reversals) controls crossrange |
| Descendants | Orion (Apollo-heritage, with skip), Mars Science Laboratory and Mars 2020 (Apollo-heritage, robotic), today's crew capsules |

The next lesson turns from the guidance law to the air it steers through — hypersonic flow around a blunt vehicle, and what changes as the vehicle slows through the transonic regime on its way to a subsonic descent.

::: context specific-force Why "specific", and why gravity is invisible
In engineering, **specific** means "per unit mass": specific energy is energy per kilogram, specific force is force per kilogram. An accelerometer is, at heart, a small mass on a spring. Gravity pulls equally on the mass and on the case around it, so in free fall they fall together and the spring does not stretch. Only a push on the case — engine thrust, air, the ground — makes the case move relative to the mass. That is why astronauts in orbit float: they are not beyond gravity, they are falling with their spacecraft.
:::

::: context linearized What "linearized" means here
A **linearized** prediction assumes that small changes cause proportional effects: twice the drag error, twice the range error. Near a well-chosen reference trajectory, that is very nearly true, the same way a curved road looks straight for the next few meters. It fails when the vehicle strays far from the reference, which is one reason Apollo kept correcting continuously — each cycle kept the capsule close enough to the reference for the straight-line guess to stay good.
:::

::: context predictor-corrector Predict, then correct
A **predictor-corrector** does what an archer does in a crosswind: estimate where the arrow will land if nothing changes (predict), then adjust the aim by the miss (correct), and keep doing it. Apollo's predictor was a quick linear formula. Modern predictor-correctors, like Orion's skip guidance, predict by integrating the equations of motion forward on the flight computer, many times a minute — something Apollo's hardware could not afford.
:::

::: context range-bars The same capsule, three bank angles
Bars show the equilibrium-glide range from $7.5\ \mathrm{km/s}$ for a capsule with $L/D = 0.3$, drawn to scale. Banking does not change the lift; it tilts it, and the range shrinks with $\cos\sigma$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="20" x2="70" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="30" width="264.4" height="26" fill="#1d6fd1"/>
  <rect x="70" y="74" width="229.0" height="26" fill="#8fb8f0"/>
  <rect x="70" y="118" width="187.0" height="26" fill="#f2b880"/>
  <text x="62" y="47" font-size="12" text-anchor="end" fill="#1f2a44">σ = 0°</text>
  <text x="62" y="91" font-size="12" text-anchor="end" fill="#1f2a44">σ = 30°</text>
  <text x="62" y="135" font-size="12" text-anchor="end" fill="#1f2a44">σ = 45°</text>
  <text x="326" y="47" font-size="11" text-anchor="end" fill="#fff">2204 km</text>
  <text x="291" y="91" font-size="11" text-anchor="end" fill="#1f2a44">1908 km</text>
  <text x="249" y="135" font-size="11" text-anchor="end" fill="#1f2a44">1558 km</text>
</svg>
```
:::

::: context agc The computer that flew Apollo
The Apollo Guidance Computer had 2048 words of erasable memory — about 4 kilobytes — and 36,864 words of fixed "rope" memory, woven by hand with wires threaded through or around tiny magnetic cores. Everything, from navigation to the entry guidance, had to fit. So the entry guidance was built from stored tables and short formulas, not from simulating the flight on board. A modern phone has millions of times more memory.
:::

::: context specific-energy Energy per kilogram
Kinetic energy is $\tfrac{1}{2}mv^2$ and gravitational potential energy is $-\mu m/r$. Divide both by the mass $m$ and you get the specific energy $E$. Dividing by mass makes it a property of the trajectory, not of the vehicle: a $100\ \mathrm{t}$ Shuttle and a $1\ \mathrm{kg}$ test body on the same path have the same $E$. For a low Earth orbit, $E$ is about $-30\ \mathrm{MJ/kg}$; entry has to bring that down to the value for sitting on the ground, about $-62.5\ \mathrm{MJ/kg}$.
:::

::: context range-integral Range to go is an area
Plot $1/D$ against energy. The range still to fly is the shaded area between the curve and the axis, from the target energy up to the vehicle's energy now. Higher drag means a lower curve, a smaller area, and less range. Hold the curve where the plan put it and you fly the planned range.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon fill="#8fb8f0" points="50,170 50,123.3 60,122.2 70,120.9 80,119.6 90,118.2 100,116.8 110,115.2 120,113.6 130,111.8 140,110.0 150,108.0 160,105.9 170,103.7 180,101.3 190,98.7 200,95.9 210,92.9 220,89.6 230,86.0 240,82.1 250,77.8 260,73.1 270,67.8 280,62.0 290,55.5 300,48.1 310,39.7 320,30.0 320,170"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,123.3 60,122.2 70,120.9 80,119.6 90,118.2 100,116.8 110,115.2 120,113.6 130,111.8 140,110.0 150,108.0 160,105.9 170,103.7 180,101.3 190,98.7 200,95.9 210,92.9 220,89.6 230,86.0 240,82.1 250,77.8 260,73.1 270,67.8 280,62.0 290,55.5 300,48.1 310,39.7 320,30.0"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="46" y="24" font-size="12" fill="#1f2a44">1 / D</text>
  <text x="50" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">E target</text>
  <text x="320" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">E now</text>
  <text x="185" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">energy E →</text>
  <text x="170" y="145" font-size="12" text-anchor="middle" fill="#1f2a44">area = range to go</text>
</svg>
```
:::

::: context shuttle-segments How the real Shuttle profile was built
The flown Shuttle reference was not one smooth formula. It was pieced together from segments, each shaped for the limit that mattered most at that point: early segments that kept the heat shield's temperature in bounds, an equilibrium-glide segment, a constant-drag segment, and a final transition segment leading to the landing approach. Several early segments were written in terms of velocity, the final one in terms of energy, and range-to-go was worked out analytically from the whole profile. The drag-versus-energy view is the idea that ties them together, and it is how modern descendants of the Shuttle scheme are usually written.
:::

::: context landing-ellipse How much guidance shrinks the target
A **landing ellipse** is the oval on the map inside which the lander will come down, allowing for all the errors. Earlier unguided Mars landers needed ellipses on the order of a hundred kilometers or more long, so they had to aim for wide, flat, dull places. Curiosity's guided entry shrank its ellipse to about $20\ \mathrm{km}$ by $7\ \mathrm{km}$ — small enough to land in Gale Crater, beside the mountain the scientists wanted to climb.
:::
