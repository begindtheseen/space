---
id: l03-fermi-estimation-drills
title: Fermi estimation, worked at interview pace
minutes: 25
covers:
  - Fermi estimation drills with vehicle numbers you should already know
---

A Fermi question in a GNC interview does not sound like a homework problem. It sounds like "roughly how much torque authority would you need for that slew" dropped into the middle of a conversation about a project, with no warm-up and no calculator, and an expectation of an answer inside a couple of minutes. The person asking is not checking whether you can multiply. They are checking whether your understanding of the physics is live enough to produce a number on demand, and whether you can be honest, out loud, about which parts of that number are known and which are assumed.

This is a skill separate from knowing the physics, and it is trainable separately. The structure is always the same four moves, said in this order: **state your assumptions before you start**, so the listener can object to an assumption rather than only to your arithmetic; **carry units through every step**, which catches most errors before they become a wrong final number; **get an actual number**, not a shrug; and **sanity-check the magnitude** against something you already know, out loud, so the listener sees you distrust your own answer exactly as much as you should.

This lesson runs that script on four problems of the kind that actually come up: reaction-wheel torque authority for a slew, a station-keeping delta-v budget, solar-array sizing for a power draw, and the control bandwidth a structural mode permits. Every number below has been computed, not guessed, and checked against a public real-world figure where one exists — say so yourself, in an interview, whenever you are relying on a number you were told or remember rather than one you derived, because that distinction is part of the honesty this skill is testing.

## Problem 1: reaction-wheel torque and momentum for a slew

"Roughly what torque and momentum capacity would a reaction wheel set need to slew a few-hundred-kilogram spacecraft sixty degrees in a minute and a half?"

**Assumptions, stated first.** Treat the spacecraft as a uniform cube, 300 kg, about 1.2 m on a side — a reasonable stand-in for a mid-size smallsat bus. Assume a rest-to-rest, bang-bang slew: constant angular acceleration for the first half of the manoeuvre, constant deceleration for the second half, which is the standard shape for a time-optimal single-axis reorientation and a reasonable default when nothing more specific is given.

**Carry the physics.** For a solid cube of mass $m$ and side $L$, the moment of inertia about a centroidal axis parallel to an edge is

$$
I = \frac{mL^2}{6}.
$$

For a bang-bang slew through angle $\theta$ in total time $t$, each half covers $\theta/2$ in time $t/2$ under constant angular acceleration $\alpha$, so $\theta/2 = \tfrac{1}{2}\alpha (t/2)^2$, giving

$$
\alpha = \frac{4\theta}{t^2}, \qquad \omega_{\text{peak}} = \alpha \cdot \frac{t}{2} = \frac{2\theta}{t}.
$$

Peak torque and peak momentum follow directly: $T = I\alpha$ and $H_{\text{peak}} = I\,\omega_{\text{peak}}$.

**Get the number.** With $m = 300\,\mathrm{kg}$, $L = 1.2\,\mathrm{m}$: $I = 300(1.2)^2/6 = 72\,\mathrm{kg\,m^2}$. With $\theta = 60^\circ = 1.047\,\mathrm{rad}$ and $t = 90\,\mathrm{s}$: $\alpha = 4(1.047)/90^2 = 5.17\times10^{-4}\,\mathrm{rad/s^2}$, so

$$
T = 72 \times 5.17\times10^{-4} \approx 0.037\,\mathrm{N\,m} = 37\,\mathrm{mN\,m}, \qquad H_{\text{peak}} = 72 \times \frac{2(1.047)}{90} \approx 1.68\,\mathrm{N\,m\,s}.
$$

A real design carries margin on top of this: roughly a factor of two on torque for control margin, and another from the wheel array geometry (a four-wheel pyramid loses about $1/\cos(35^\circ) \approx 1.22$ per axis to the skew angle), pushing the per-wheel requirement toward $T \approx 90\,\mathrm{mN\,m}$, $H \approx 4\,\mathrm{N\,m\,s}$.

**Sanity-check it.** A cubesat-class wheel like Blue Canyon's RWp100 stores about $0.10\,\mathrm{N\,m\,s}$ at roughly $7\,\mathrm{mN\,m}$ of torque — too small for this vehicle by more than an order of magnitude, the right direction since this bus is far bigger than a cubesat. A mid-size smallsat-class wheel (Ball's LeoStar bus, several-hundred-kilogram spacecraft) stores on the order of $5.4\,\mathrm{N\,m\,s}$ at about $0.14\,\mathrm{N\,m}$ of torque. Our estimate, with margin, sits comfortably between those two real products and close to the larger one. That agreement does not prove the estimate right, but a wheel requirement landing near the cubesat number, or two orders past the smallsat one, would mean a blown assumption somewhere — and this is the moment you would say so and go looking for it.

::: example Reaction-wheel Fermi, said the way you'd say it out loud
"I'll treat it as a uniform 300 kg cube, a metre and change on a side, and assume a bang-bang rest-to-rest slew — accelerate for the first half, decelerate for the second. That gives peak angular acceleration $4\theta/t^2$ and peak rate $2\theta/t$. Plugging in sixty degrees in ninety seconds with $I$ around 70 kilogram-metres-squared, I get roughly 37 millinewton-metres of torque and under 2 newton-metre-seconds of momentum, before margin — call it 100 millinewton-metres and 4 newton-metre-seconds after a factor of two for control margin and array geometry. That's bigger than a cubesat wheel and in the neighborhood of a several-hundred-kilogram-class smallsat wheel, which is the right ballpark for this vehicle."
:::

## Problem 2: a station-keeping delta-v budget

"Roughly what delta-v budget does station-keeping run to for a geostationary satellite over a fifteen-year life?"

**Assumptions, stated first.** This one has a first-principles piece and a recalled piece, and saying so explicitly is part of a good answer. The recalled piece: the Moon and Sun torque a geostationary orbit's plane out of the equator at a roughly constant rate, commonly cited at about $0.85^\circ$ per year — a number worth knowing the way you know Earth's $\mu$, because it is not something you derive at a whiteboard from Newtonian first principles in a couple of minutes; the underlying third-body perturbation theory is not whiteboard-length. What you *can* derive from there is the delta-v that correcting it costs.

**Carry the physics.** A geostationary orbit is circular, so its speed is $v = \sqrt{\mu/r}$. Correcting a small out-of-plane drift $\Delta i$ (in radians) costs approximately

$$
\Delta v \approx v\,\Delta i,
$$

which is the standard small-angle plane-change relation: the velocity vector must rotate by $\Delta i$ out of the old plane, and for small angles the chord length of that rotation is $v\,\Delta i$.

**Get the number.** With $\mu = 3.986\times10^{14}\,\mathrm{m^3/s^2}$ and $r_{\text{GEO}} = 42{,}164\,\mathrm{km}$:

$$
v_{\text{GEO}} = \sqrt{\frac{3.986\times10^{14}}{4.2164\times10^7}} \approx 3.075\,\mathrm{km/s}.
$$

With $\Delta i = 0.85^\circ = 0.0148\,\mathrm{rad}$ per year:

$$
\Delta v \approx 3075 \times 0.0148 \approx 46\,\mathrm{m/s\ per\ year}.
$$

East–west (longitude) station-keeping is driven by a much weaker perturbation — Earth's slight triaxiality nudges a geostationary satellite's longitude rather than its plane — and runs only a couple of metres per second per year, small enough to fold into a round total. Over a fifteen-year mission life:

$$
\Delta v_{15\,\text{yr}} \approx 15 \times 50\,\mathrm{m/s} \approx 750\,\mathrm{m/s} = 0.75\,\mathrm{km/s}.
$$

**Sanity-check it.** The commonly cited public figure for GEO station-keeping is about 45 to 50 metres per second per year, overwhelmingly dominated by the north–south correction, with east–west adding only a couple of metres per second — which is exactly what the derivation above landed on. The agreement is close enough to trust the reasoning, and the small gap (46 versus a commonly cited 45–50) is well inside the uncertainty on the $0.85^\circ$/year figure itself, which varies over the 18.6-year lunar nodal cycle.

::: example Station-keeping Fermi, said the way you'd say it out loud
"Most of this is north–south — the Moon and Sun torque the orbital plane at around 0.85 degrees a year, which I'd treat as a number I know rather than derive on the spot. From there, correcting a plane drift of $\Delta i$ costs about $v\,\Delta i$ at orbital speed, and GEO speed is about 3.07 kilometres a second from $\sqrt{\mu/r}$. That gives about 46 metres a second a year, which matches the roughly 50 metres a second a year commonly quoted for GEO stationkeeping. East–west is much smaller, a couple of metres a second, so over a 15-year mission you're looking at around 750 metres a second total, the large majority of it north–south."
:::

## Problem 3: solar-array area for a power draw

"Roughly how big does the solar array need to be for a spacecraft that draws 400 watts on average?"

**Assumptions, stated first.** Use the solar constant at 1 AU, $1361\,\mathrm{W/m^2}$, a triple-junction cell efficiency of 28%, and a packing factor of 0.85 to account for cell gaps, wiring, and substrate. Assume a low- to mid-inclination LEO orbit with roughly 60% of each orbit sunlit, and an average incidence loss of about 10% from the array not always facing the Sun squarely. Assume the array must still meet the power requirement after some end-of-life degradation, taken here as roughly 15% over the mission.

**Carry the physics.** Array specific power at beginning of life is

$$
P_{\text{spec}} = S \cdot \eta \cdot f_{\text{pack}},
$$

where $S$ is the solar constant, $\eta$ the cell efficiency, and $f_{\text{pack}}$ the packing factor. Because the array only sees the Sun for a fraction $f_{\text{sun}}$ of each orbit, and even then not always face-on (incidence factor $f_{\text{inc}}$), the instantaneous array power while sunlit must exceed the average draw $P_{\text{draw}}$ by roughly $1/(f_{\text{sun}} f_{\text{inc}})$, so the required area is

$$
A = \frac{P_{\text{draw}}}{f_{\text{sun}}\,f_{\text{inc}}\,P_{\text{spec}}}.
$$

**Get the number.** $P_{\text{spec}} = 1361 \times 0.28 \times 0.85 \approx 324\,\mathrm{W/m^2}$ at beginning of life. With $P_{\text{draw}} = 400\,\mathrm{W}$, $f_{\text{sun}} = 0.6$, $f_{\text{inc}} = 0.9$:

$$
A_{\text{BOL}} = \frac{400}{0.6 \times 0.9 \times 324} \approx 2.3\,\mathrm{m^2}.
$$

Derating for roughly 15% end-of-life degradation pushes the sized area to about $2.7\,\mathrm{m^2}$.

**Sanity-check it.** $324\,\mathrm{W/m^2}$ for a 28%-efficient triple-junction array is a figure that matches published data for thin triple-junction coupons at that efficiency almost exactly, so the specific-power assumption is on solid ground. A couple of square metres for a several-hundred-watt smallsat bus is also consistent with what deployed panels on spacecraft in this class actually look like — not a wing the size of a room, and not a patch the size of a book.

::: example Solar-array Fermi, said the way you'd say it out loud
"Start from the solar constant, 1361 watts a square metre, times a triple-junction efficiency around 28 percent, times a packing factor of maybe 0.85 for gaps and wiring — that's about 320 watts a square metre at beginning of life. If the bus draws 400 watts on average, and it's only sunlit maybe 60 percent of a low-Earth orbit, and not always pointed straight at the Sun, say another 10 percent loss there, the array needs to produce more like 700-plus watts while it is illuminated. Divide through and that's a bit over two square metres at beginning of life, call it two and a half to three once you derate for degradation over the mission — which is in the right range for a several-hundred-watt-class smallsat."
:::

## Problem 4: control bandwidth against a structural mode

"The vehicle has a flexible appendage with a first bending mode around 2 hertz. Roughly what control bandwidth does that permit?"

**Assumptions, stated first.** Take the first flexible mode as given — 2 Hz, a plausible number for a solar array or boom on a smallsat, though real structures range widely and this is exactly the kind of number an interviewer would tell you rather than expect you to derive. The governing constraint is a standard control-design rule of thumb: closed-loop bandwidth should sit a factor of roughly three to ten below the first structural mode, so that the controller's gain and phase near that frequency are low enough not to destabilize it. Which end of that range is appropriate depends on how well-damped the mode is and how much the frequency itself is trusted — a lightly-damped mode whose frequency might shift over the mission (fuel slosh changing effective stiffness, a boom that has not been measured on orbit) warrants the more conservative factor of ten; a well-characterized, well-damped structural mode can sometimes support something closer to a factor of three.

**Carry the physics.** With first mode frequency $f_{\text{struct}}$ and separation factor $k$ in the range 3 to 10,

$$
f_{\text{bw}} \in \left[\frac{f_{\text{struct}}}{10}, \frac{f_{\text{struct}}}{3}\right].
$$

**Get the number.** With $f_{\text{struct}} = 2\,\mathrm{Hz}$:

$$
f_{\text{bw}} \in [0.2, 0.67]\,\mathrm{Hz}, \qquad \omega_{\text{bw}} \in [1.3, 4.2]\,\mathrm{rad/s}.
$$

**Sanity-check it.** This is a case where the sanity check is less "does this match a known hardware number" and more "does this leave a usable controller." A bandwidth of a few tenths of a hertz is slow compared to, say, a launch-vehicle attitude loop crossing over in the range of several rad/s to tens of rad/s, but it is not unreasonably slow for a large flexible spacecraft bus, where the whole point of the structure being flexible in the first place is that it is large, light, and comparatively floppy. If the same reasoning had produced a required bandwidth of 50 Hz against a 2 Hz structural mode, that would be the sign of an infeasible design — the actuator and controller cannot deliver bandwidth above the structural mode without exciting it — and the honest move would be to say so and discuss redesign options (stiffening the structure, notch-filtering the mode, moving the sensor) rather than quietly reporting an impossible number.

::: example Bandwidth Fermi, said the way you'd say it out loud
"If the first bending mode is around 2 hertz, the standard rule of thumb is to keep closed-loop bandwidth a factor of three to ten below it, so you're not putting meaningful gain or phase lag right at the resonance. That gives somewhere between about 0.2 and 0.7 hertz, call it 1 to 4 radians a second. Whether you're near the aggressive end or the conservative end really depends on how well you trust that 2 hertz number and how well damped the mode is — if it's a boom you haven't characterized on orbit yet, I'd stay conservative and design for the low end."
:::

::: key
The four-move script: state assumptions before computing, carry units through every step, produce an actual number, and sanity-check the magnitude against something known. Say out loud which parts of the answer are derived from physics and which are recalled or assumed — that distinction is itself part of what is being assessed.
:::

::: warning
Do not silently swap a recalled number for a derived one, or the reverse. The GEO inclination-drift rate ($0.85^\circ$/year) is a fact you would need to know or be told; the delta-v that follows from it is a derivation. Presenting the whole answer as though every piece were derived from first principles overclaims your reasoning, and presenting a genuinely derivable piece (like the reaction-wheel torque) as though it were merely recalled undersells it.
:::

## Check yourself

::: check
State the four-move Fermi script in order, and explain briefly why stating assumptions comes before computing rather than after.
:::

::: answer
Assumptions first, units carried throughout, an actual number produced, then a sanity check against something known. Assumptions come first because they let the listener object to the *premise* of the estimate rather than only to the arithmetic — if the interviewer disagrees with treating the spacecraft as a uniform 300 kg cube, they can say so immediately and the conversation adjusts the assumption rather than wasting time validating arithmetic built on a premise nobody agreed to. Stating assumptions after the fact, or not at all, also makes it look as though the number came from nowhere, which is the opposite of what this exercise is meant to demonstrate.
:::

::: check
In the reaction-wheel problem, if the slew had to happen twice as fast — sixty degrees in forty-five seconds instead of ninety — how does the required peak torque change, and why?
:::

::: answer
Peak torque scales as $T = I\alpha = I \cdot 4\theta/t^2$, so it is inversely proportional to $t^2$. Halving the time quadruples the torque: $37\,\mathrm{mN\,m}$ becomes roughly $149\,\mathrm{mN\,m}$, a factor of four, not two — a common place to slip if you carry the scaling in your head rather than actually looking at where $t$ appears in the formula. This kind of "how does the answer scale if I change one input" follow-up is extremely common, and the fast way to answer it is to look at the exponent on the changed variable in the formula you already derived, rather than recomputing everything from scratch.
:::

::: check
Why is the station-keeping delta-v problem solved with a mix of "recall" and "derive," while the reaction-wheel torque problem is solved almost entirely by derivation? What does that distinction tell you about handling an unfamiliar Fermi question in general?
:::

::: answer
The reaction-wheel problem's inputs — mass, geometry, slew angle, slew time — are all things you would reasonably be given or assume, and the physics connecting them to torque (rigid-body rotational kinematics) is short enough to derive live. The GEO delta-v problem's dominant physical driver — the lunisolar out-of-plane torque rate — comes from third-body perturbation theory that is not whiteboard-length; deriving $0.85^\circ$/year from Newtonian first principles in an interview is not realistic, so that piece has to be a recalled fact. The general lesson: part of doing well on an unfamiliar Fermi question is correctly sorting your inputs into "I can derive this from physics I know" and "I need to either know this or be given it," and saying which is which, rather than pretending the whole chain was derived when part of it was recalled.
:::

::: check
The interviewer changes the orbit for the solar-panel problem to a dawn–dusk sun-synchronous orbit, where the array is sunlit nearly all the time instead of 60% of each orbit. Qualitatively and then numerically, what happens to the required array area?
:::

::: answer
The array needs to produce power over a much larger fraction of each orbit, so for the same average draw it needs less instantaneous power while illuminated, and therefore less area — area is inversely proportional to sunlit fraction in this model. Moving $f_{\text{sun}}$ from 0.6 to essentially 1.0 scales the required area by $0.6/1.0 = 0.6$: the beginning-of-life area drops from about $2.3\,\mathrm{m^2}$ to about $1.4\,\mathrm{m^2}$. This is exactly why many Earth-observation smallsats fly dawn–dusk sun-synchronous orbits in the first place — smaller, lighter arrays for the same power budget is a real design driver, not an incidental fact.
:::

::: check
For the bandwidth problem, why would an interviewer accept an answer stated as a range ("one to four radians a second") rather than pushing you for a single number?
:::

::: answer
Because the separation factor between control bandwidth and a structural mode is a judgment call that genuinely depends on information a Fermi estimate does not have — how well damped the mode is, how confidently the frequency itself is known, how much margin the mission's risk posture demands — and stating it as a range that is explicit about what would move you toward either end is a more honest and more informative answer than manufacturing false precision. A single confident number with no stated basis for choosing it inside the plausible range is a worse answer than a bounded range with the reasoning for the bound attached, and a good interviewer is listening for exactly that judgment, not for a specific digit.
:::

::: check
You are asked a Fermi question with an input you were not given — say, the mass of the spacecraft in the reaction-wheel problem. What do you do?
:::

::: answer
State a reasonable assumption out loud, tied to something concrete — "I'll assume a few hundred kilograms, in the range of a typical ESPA-class smallsat bus" — rather than asking to be told or, worse, stalling. Naming the assumption does two things: it lets the estimate proceed, and it gives the interviewer an explicit hook to redirect you if the real number is very different, at which point you rescale rather than start over. Treat a missing input as an invitation to state an assumption, not as a missing piece of information that blocks the problem.
:::

## Summary

| Quantity | Result | Anchor or basis |
| --- | --- | --- |
| Reaction-wheel torque, 300 kg bus, 60° in 90 s | $\approx 37\,\mathrm{mN\,m}$ (before margin) | Between Blue Canyon RWp100 (7 mN·m) and a LeoStar-class wheel (140 mN·m) |
| Reaction-wheel momentum, same case | $\approx 1.7\,\mathrm{N\,m\,s}$ (before margin) | Near the LeoStar-class wheel figure (5.4 N·m·s) |
| GEO station-keeping | $\approx 46\,\mathrm{m/s}$/year, mostly north–south | Matches the commonly cited 45–50 m/s/year |
| Solar array, 400 W draw, LEO | $\approx 2.3\,\mathrm{m^2}$ BOL, $\approx 2.7\,\mathrm{m^2}$ EOL | 324 W/m² BOL matches published 28%-efficiency triple-junction data |
| Control bandwidth, 2 Hz structural mode | $\approx 0.2$–$0.7\,\mathrm{Hz}$ | Standard 3×–10× separation rule of thumb |

The next three lessons take the whiteboard derivations these estimates lean on — the rocket equation, the Kalman gain, proportional navigation, Euler's equations, the Clohessy-Wiltshire equations — and build each one cold, from momentum and geometry, the way you would have to reproduce it under the same time pressure.
