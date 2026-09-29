---
id: l03-fermi-estimation-drills
title: Fermi estimation, worked at interview pace
minutes: 26
covers:
  - Fermi estimation drills with vehicle numbers you should already know
---

How many basketballs would fit in your classroom? You do not need to count. The room is maybe 10 meters by 8 by 3, so about 240 cubic meters. A basketball fills a box about a quarter of a meter on each side, so about 64 of them fit in one cubic meter. That makes roughly 15,000 basketballs. You will not be exactly right, but you will not be off by a factor of a hundred either — and you got there in thirty seconds, with no calculator.

That is a **[[Fermi question|fermi]]**: a question whose exact answer you cannot look up, answered to the right size by breaking it into pieces you can guess or know. In a GNC interview it sounds like "roughly how much torque would you need for that slew?", dropped into a conversation with no calculator and an answer expected within a couple of minutes. The interviewer is checking whether your physics is alive enough to produce a number on demand — and whether you are honest, out loud, about which parts you know and which you assumed. That is a trainable skill of its own, always the same four moves, in this order:

1. **State your assumptions before you start.** Then the listener can object to an assumption, not only to your arithmetic.
2. **Carry units through every step.** Units catch most mistakes before they reach the final number.
3. **Get an actual number**, not a shrug.
4. **Sanity-check the size** against something you already know, out loud, so the listener sees you distrust your own answer exactly as much as you should.

This lesson runs that script on four problems that really come up. Every number below was computed and checked against a public figure where one exists. In an interview, say when you are relying on a number you remember or were told rather than one you derived; that distinction is part of the honesty being tested.

## Problem 1: reaction-wheel torque and momentum for a slew

"Roughly what torque and momentum capacity would a reaction wheel set need to slew a few-hundred-kilogram spacecraft sixty degrees in a minute and a half?"

A **slew** is a turn of the whole spacecraft to point somewhere new. A **[[reaction wheel|reaction-wheel]]** is a heavy wheel inside the spacecraft; spin it up one way and the spacecraft turns the other way. **Torque** is a twisting push, measured in newton-meters ($\mathrm{N\,m}$). **Angular momentum** is the "amount of spin" stored, in newton-meter-seconds ($\mathrm{N\,m\,s}$). The wheel must twist hard enough (torque) and hold enough spin (momentum).

**Assumptions, stated first.** Treat the spacecraft as a uniform cube, 300 kg, about 1.2 m on a side — a fair stand-in for a mid-size small-satellite body. Assume a rest-to-rest **[[bang-bang|bang-bang]]** slew: constant angular acceleration for the first half of the turn, then constant deceleration for the second half. That is the standard shape for the fastest single-axis turn, and a sensible default when nothing more specific is given.

**Carry the physics.** The **moment of inertia**, $I$, is how hard something is to spin up — the turning version of mass. For a solid cube of mass $m$ and side $L$, spun about an axis through its center parallel to an edge, it is

$$
I = \frac{mL^2}{6}.
$$

(The note on the **[[one-sixth|cube-inertia]]** shows where the 6 comes from.)

Now the motion. Call the slew angle $\theta$ ("theta"), the total time $t$, and the angular acceleration $\alpha$ ("alpha"). Each half of the slew covers $\theta/2$ in time $t/2$, starting from rest, so the usual "distance equals half acceleration times time squared" rule gives

$$
\frac{\theta}{2} = \frac{1}{2}\alpha\left(\frac{t}{2}\right)^2 .
$$

Multiply both sides by 2 to get $\theta = \alpha t^2/4$, then solve for $\alpha$. The spin rate $\omega$ ("omega") peaks at the halfway point, after accelerating for $t/2$:

$$
\alpha = \frac{4\theta}{t^2}, \qquad \omega_{\text{peak}} = \alpha \cdot \frac{t}{2} = \frac{2\theta}{t}.
$$

Peak torque and peak momentum follow directly: $T = I\alpha$ and $H_{\text{peak}} = I\,\omega_{\text{peak}}$.

**Get the number.** With $m = 300\,\mathrm{kg}$ and $L = 1.2\,\mathrm{m}$: $I = 300 \times 1.2^2 / 6 = 300 \times 1.44 / 6 = 72\,\mathrm{kg\,m^2}$. Angles must be in radians: $\theta = 60^\circ = 1.047\,\mathrm{rad}$, and $t = 90\,\mathrm{s}$. So $\alpha = 4 \times 1.047 / 90^2 = 5.17\times10^{-4}\,\mathrm{rad/s^2}$, and

$$
T = 72 \times 5.17\times10^{-4} \approx 0.037\,\mathrm{N\,m} = 37\,\mathrm{mN\,m}, \qquad H_{\text{peak}} = 72 \times \frac{2(1.047)}{90} \approx 1.68\,\mathrm{N\,m\,s}.
$$

(Check the units: $\mathrm{kg\,m^2} \times \mathrm{rad/s^2}$ is $\mathrm{kg\,m^2/s^2}$, which is a newton-meter. Radians have no units, so they drop out.)

A real design adds margin. Take roughly a factor of two on torque for control margin. Then another factor from the way the wheels are mounted: a **[[four-wheel pyramid|pyramid]]** loses about $1/\cos(35^\circ) \approx 1.22$ per axis because the wheels are tilted. Together, that pushes the per-wheel need toward $T \approx 90\,\mathrm{mN\,m}$ and $H \approx 4\,\mathrm{N\,m\,s}$.

**Sanity-check it.** A CubeSat-size wheel such as Blue Canyon's RWp100 stores about $0.1\,\mathrm{N\,m\,s}$ at about $7\,\mathrm{mN\,m}$ of torque. That is more than ten times too small for our spacecraft — the right direction, since this vehicle is far bigger than a CubeSat. Wheels built for satellites of a few hundred kilograms, sold by several makers, store a few to about ten newton-meter-seconds with torques around a tenth of a newton-meter. Our estimate with margin lands inside that class.

Agreement does not prove the estimate right. But an answer near the CubeSat wheel, or a hundred times past the small-satellite class, would mean a broken assumption — the moment to say so and go looking.

::: example Reaction-wheel Fermi, said the way you'd say it out loud
"I'll treat it as a uniform 300 kg cube, a meter and change on a side, and assume a bang-bang rest-to-rest slew — accelerate for the first half, decelerate for the second. That gives peak angular acceleration $4\theta/t^2$ and peak rate $2\theta/t$. Sixty degrees in ninety seconds, with $I$ around 70 kilogram-meters-squared, gives roughly 37 millinewton-meters of torque and under 2 newton-meter-seconds of momentum before margin. Call it 100 millinewton-meters and 4 newton-meter-seconds after a factor of two for control margin and the array geometry. That's much bigger than a CubeSat wheel and in the range of wheels built for few-hundred-kilogram satellites, which is the right ballpark for this vehicle."

**Sanity check on the arithmetic.** $90 \times 1.22 \approx 110$ and $2 \times 1.68 \times 1.22 \approx 4.1$, so "about 100 and about 4" is honest rounding.
:::

## Problem 2: a station-keeping delta-v budget

"Roughly what delta-v budget does station-keeping take for a geostationary satellite over a fifteen-year life?"

A **[[geostationary|geo]]** satellite (GEO) circles Earth once a day above the equator, so it seems to hang still over one spot. **Station-keeping** is the small engine burns that keep it there. **Delta-v**, written $\Delta v$ ("delta v"), is the total change in speed those burns must supply — the way propellant is budgeted.

**Assumptions, stated first.** This answer has a derived piece and a recalled piece; say so. The recalled piece: the pull of the Moon and Sun tips a geostationary orbit's plane out of the equator at a roughly steady rate, usually quoted as about $0.85^\circ$ per year. The tilt of an orbit's plane is its **inclination**. Know this **[[drift rate|inclination-drift]]** the way you know Earth's $\mu$. You cannot derive it at a whiteboard in two minutes; the theory of third-body pulls is far too long. What you *can* derive is the delta-v that fixing it costs.

**Carry the physics.** A geostationary orbit is circular, so its speed is $v = \sqrt{\mu/r}$, where $\mu$ ("mew") is Earth's gravity constant and $r$ the orbit radius. Fixing a small tilt $\Delta i$ ("delta i", in radians) costs about

$$
\Delta v \approx v\,\Delta i .
$$

This is the standard small-angle **[[plane change|plane-change]]** rule. The velocity arrow must swing through the angle $\Delta i$. For a small angle, the gap between the old arrow tip and the new one is about the arrow's length times the angle, $v\,\Delta i$.

**Get the number.** With $\mu = 3.986\times10^{14}\,\mathrm{m^3/s^2}$ and $r_{\text{GEO}} = 42{,}164\,\mathrm{km} = 4.2164\times10^7\,\mathrm{m}$:

$$
v_{\text{GEO}} = \sqrt{\frac{3.986\times10^{14}}{4.2164\times10^7}} \approx 3075\,\mathrm{m/s} \approx 3.07\,\mathrm{km/s}.
$$

Convert the drift to radians: $\Delta i = 0.85 \times \pi/180 = 0.0148\,\mathrm{rad}$ per year. Then

$$
\Delta v \approx 3075 \times 0.0148 \approx 46\,\mathrm{m/s\ per\ year}.
$$

That is the **north–south** part. **East–west** station-keeping fights a much weaker push: Earth's equator is slightly oval (its **[[triaxiality|triaxiality]]**), which nudges the satellite's longitude rather than its plane. It costs only a couple of meters per second per year. So the total is about $46 + 2 \approx 48$, rounded up to about $50\,\mathrm{m/s}$ per year. Over a fifteen-year life:

$$
\Delta v_{15\,\text{yr}} \approx 15 \times 50\,\mathrm{m/s} \approx 750\,\mathrm{m/s} = 0.75\,\mathrm{km/s}.
$$

**Sanity-check it.** The commonly quoted figure for GEO station-keeping is about 45 to 50 m/s per year, almost all north–south — where the derivation landed. The small gap sits well inside the uncertainty of the $0.85^\circ$ per year figure itself, which varies over the Moon's 18.6-year cycle.

::: example Station-keeping Fermi, said the way you'd say it out loud
"Most of this is north–south. The Moon and Sun tip the orbital plane at around 0.85 degrees a year — that's a number I know rather than one I'd derive on the spot. From there, fixing a plane drift of $\Delta i$ costs about $v\,\Delta i$, and GEO speed is about 3.07 kilometers a second from $\sqrt{\mu/r}$. That gives about 46 meters a second a year, which matches the roughly 50 meters a second a year usually quoted for GEO station-keeping. East–west is much smaller, a couple of meters a second. So over a 15-year mission you're looking at around 750 meters a second in total, most of it north–south."
:::

## Problem 3: solar-array area for a power draw

"Roughly how big does the solar array need to be for a spacecraft that draws 400 watts on average?"

**Assumptions, stated first.**

- The **solar constant** — sunlight power per square meter at Earth's distance from the Sun — is $S = 1361\,\mathrm{W/m^2}$.
- The cells are **[[triple-junction|triple-junction]]** cells with **efficiency** $\eta = 28\%$ ($\eta$ is "eta": the fraction of sunlight turned into electricity).
- The **packing factor** is $f_{\text{pack}} = 0.85$: only 85% of the panel is cells; the rest is gaps, wiring and backing.
- The orbit is a low-to-mid-inclination low Earth orbit, sunlit about 60% of the time: $f_{\text{sun}} = 0.6$.
- The array does not always face the Sun squarely; allow about a 10% loss, $f_{\text{inc}} = 0.9$ ("inc" for incidence).
- Cells wear out in space; allow about 15% loss by end of life.

**Carry the physics.** Power per square meter of array at the start of life is

$$
P_{\text{spec}} = S \cdot \eta \cdot f_{\text{pack}} .
$$

The array only sees the Sun for the fraction $f_{\text{sun}}$ of each orbit, and not always face-on. So while it is sunlit, it must make more than the average draw $P_{\text{draw}}$, by about $1/(f_{\text{sun}} f_{\text{inc}})$. The area needed is

$$
A = \frac{P_{\text{draw}}}{f_{\text{sun}}\,f_{\text{inc}}\,P_{\text{spec}}}.
$$

**Get the number.** $P_{\text{spec}} = 1361 \times 0.28 \times 0.85 \approx 324\,\mathrm{W/m^2}$ at beginning of life (BOL). With $P_{\text{draw}} = 400\,\mathrm{W}$:

$$
A_{\text{BOL}} = \frac{400}{0.6 \times 0.9 \times 324} \approx 2.3\,\mathrm{m^2}.
$$

Allowing for about 15% wear by end of life (EOL) raises the sized area to about $2.3 / 0.85 \approx 2.7\,\mathrm{m^2}$.

**Sanity-check it.** Watts divided by watts per square meter leaves square meters. The $324\,\mathrm{W/m^2}$ figure is in line with what is usually quoted for 28% triple-junction arrays. And a couple of square meters matches the panels on several-hundred-watt small satellites — not a wing the size of a room, not a patch the size of a book.

::: example Solar-array Fermi, said the way you'd say it out loud
"Start from the solar constant, 1361 watts a square meter, times a triple-junction efficiency around 28 percent, times a packing factor of maybe 0.85 for gaps and wiring. That's about 320 watts a square meter at beginning of life. The bus draws 400 watts on average, but it's only sunlit about 60 percent of a low-Earth orbit and not always pointed straight at the Sun — say another 10 percent loss. So the array has to make more like 740 watts while it's lit. Divide through and that's a bit over two square meters at beginning of life, call it two and a half to three once you allow for wear over the mission. That's the right range for a several-hundred-watt small satellite."

**Sanity check on the arithmetic.** $400 / (0.6 \times 0.9) \approx 741\,\mathrm{W}$ while lit, and $741 / 324 \approx 2.3\,\mathrm{m^2}$ — the same answer by a second route.
:::

## Problem 4: control bandwidth against a structural mode

"The vehicle has a flexible appendage with a first bending mode around 2 hertz. Roughly what control bandwidth does that allow?"

Hold a ruler flat off the edge of a desk and flick it: it twangs at its own natural rate. That rate is its **bending mode** frequency, in **hertz** (Hz, wiggles per second). A solar array or a boom on a spacecraft twangs the same way. A controller's **[[bandwidth|bandwidth]]** is roughly how fast the controller responds — the highest frequency of motion it actively pushes against.

**Assumptions, stated first.** Take the first flexible mode as given: 2 Hz, a plausible number for a solar array or boom on a small satellite. Real structures vary widely, and this is exactly the kind of number an interviewer would tell you rather than expect you to derive.

The governing rule of thumb: keep the closed-loop bandwidth a factor of roughly three to ten *below* the first structural mode, so the controller's gain and phase near that frequency are too low to shake the structure into instability. Where you sit depends on how well **damped** the mode is (how fast the twang dies out) and how much you trust its frequency. A lightly damped mode that might shift during the mission — fuel slosh changing the stiffness, a boom never measured in orbit — calls for the careful factor of ten. A well-measured, well-damped mode can support something closer to three.

**Carry the physics.** With first mode frequency $f_{\text{struct}}$ and a separation factor between 3 and 10,

$$
f_{\text{bw}} \in \left[\frac{f_{\text{struct}}}{10}, \frac{f_{\text{struct}}}{3}\right].
$$

(Read "$\in$" as "lies in".)

**Get the number.** With $f_{\text{struct}} = 2\,\mathrm{Hz}$, the range is $2/10 = 0.2$ to $2/3 \approx 0.67$ Hz. To turn hertz into radians per second, multiply by $2\pi$, since one full cycle is $2\pi$ radians:

$$
f_{\text{bw}} \in [0.2, 0.67]\,\mathrm{Hz}, \qquad \omega_{\text{bw}} \in [1.3, 4.2]\,\mathrm{rad/s}.
$$

**Sanity-check it.** Here the check is "does this leave a usable controller?" A few tenths of a hertz is slow next to a launch vehicle's attitude loop, which crosses over somewhere from several to tens of radians per second, but not unreasonably slow for a large flexible spacecraft. A flexible structure is flexible because it is large and light.

Now imagine the same reasoning had demanded 50 Hz of bandwidth against a 2 Hz mode. That would be a sign of an impossible design: the controller cannot act faster than the structure's mode without exciting it. The honest move is to say so and discuss fixes — stiffen the structure, add a **notch filter** (software that blanks out one narrow band of frequencies) to hide the mode from the controller, or move the sensor — rather than quietly report an impossible number.

::: example Bandwidth Fermi, said the way you'd say it out loud
"If the first bending mode is around 2 hertz, the standard rule of thumb is to keep closed-loop bandwidth a factor of three to ten below it, so you're not putting real gain or phase lag right at the resonance. That gives somewhere between about 0.2 and 0.7 hertz — call it 1 to 4 radians a second. Whether you're near the aggressive end or the careful end depends on how much you trust that 2 hertz number and how well damped the mode is. If it's a boom nobody has measured in orbit yet, I'd stay careful and design for the low end."
:::

::: key
The four-move script: state assumptions before computing, carry units through every step, produce an actual number, and sanity-check the magnitude against something known. Say out loud which parts of the answer are derived from physics and which are recalled or assumed — that distinction is itself part of what is being assessed.
:::

::: warning
Do not quietly swap a recalled number for a derived one, or the reverse. The GEO inclination drift ($0.85^\circ$ per year) is a fact you must know or be told; the delta-v that follows from it is a derivation. Presenting the whole answer as if every piece were derived overclaims your reasoning. Presenting a piece you really can derive (like the reaction-wheel torque) as if it were only remembered undersells it.
:::

## Check yourself

::: check
State the four-move Fermi script in order, and explain briefly why stating assumptions comes before computing rather than after.
:::

::: answer
Assumptions first, units carried throughout, an actual number, then a sanity check against something known.

Assumptions come first so the listener can object to the *premise*, not only the arithmetic. If the interviewer disagrees with the uniform 300 kg cube, they say so at once, and nobody wastes time checking arithmetic built on a premise nobody agreed to. Stated afterward, or not at all, the assumptions leave the number looking as if it came from nowhere.
:::

::: check
In the reaction-wheel problem, if the slew had to happen twice as fast — sixty degrees in forty-five seconds instead of ninety — how does the required peak torque change, and why?
:::

::: answer
Peak torque is $T = I\alpha = I \cdot 4\theta/t^2$, so it goes as one over $t^2$. Halve the time and $t^2$ becomes a quarter as big, so the torque becomes four times as big: $37\,\mathrm{mN\,m}$ becomes about $149\,\mathrm{mN\,m}$.

Four, not two — a common slip when you carry the scaling in your head. "How does the answer change if I change one input?" is a very common follow-up, and the fast answer comes from the power on that variable in the formula you already derived.
:::

::: check
Why is the station-keeping delta-v problem solved with a mix of "recall" and "derive," while the reaction-wheel torque problem is solved almost entirely by derivation? What does that distinction tell you about handling an unfamiliar Fermi question in general?
:::

::: answer
The reaction-wheel inputs — mass, size, slew angle, slew time — are things you would be given or could fairly assume, and the physics linking them to torque (rotation of a rigid body) is short enough to derive live.

The GEO problem's main driver — how fast the Moon and Sun tip the orbit plane — comes from third-body perturbation theory, which is not whiteboard-length. Deriving $0.85^\circ$ per year from Newton's laws in an interview is not realistic, so that piece has to be a remembered fact.

The general lesson: part of doing well on an unfamiliar Fermi question is sorting your inputs into "I can derive this from physics I know" and "I need to know this or be told it" — and saying which is which, rather than pretending the whole chain was derived.
:::

::: check
The interviewer changes the orbit for the solar-panel problem to a dawn–dusk sun-synchronous orbit, where the array is sunlit nearly all the time instead of 60% of each orbit. Qualitatively and then numerically, what happens to the required array area?
:::

::: answer
The array now makes power over nearly the whole orbit, so for the same average draw it needs less power while lit — and so less area. In this model, area goes as one over the sunlit fraction.

Moving $f_{\text{sun}}$ from 0.6 to about 1.0 multiplies the area by $0.6/1.0 = 0.6$. The beginning-of-life area drops from about $2.3\,\mathrm{m^2}$ to about $1.4\,\mathrm{m^2}$. This is one real reason many Earth-observation small satellites fly dawn–dusk sun-synchronous orbits: smaller, lighter arrays for the same power is a genuine design driver, not a side fact.
:::

::: check
For the bandwidth problem, why would an interviewer accept an answer stated as a range ("one to four radians a second") rather than pushing you for a single number?
:::

::: answer
Because the separation factor between bandwidth and a structural mode is a judgment call. It depends on things a Fermi estimate does not know: how well damped the mode is, how sure you are of its frequency, how much margin the mission's attitude to risk demands.

A range, with a clear statement of what would move you toward either end, is more honest and more informative than invented precision. A good interviewer is listening for that judgment, not for a particular digit.
:::

::: check
You are asked a Fermi question with an input you were not given — say, the mass of the spacecraft in the reaction-wheel problem. What do you do?
:::

::: answer
State a reasonable assumption out loud, tied to something concrete: "I'll assume a few hundred kilograms, in the range of a typical **[[ESPA-class|espa]]** small-satellite bus." Do not stall, and do not only ask to be told.

Naming the assumption lets the estimate go ahead, and gives the interviewer a hook to redirect you if the real number is very different — then you rescale instead of starting over. A missing input is an invitation to state an assumption, not a block.
:::

## Summary

| Quantity | Result | Anchor or basis |
| --- | --- | --- |
| Reaction-wheel torque, 300 kg bus, 60° in 90 s | $\approx 37\,\mathrm{mN\,m}$ before margin, $\approx 90\,\mathrm{mN\,m}$ after | Far above a CubeSat wheel (RWp100, 7 mN·m); inside the class of wheels for few-hundred-kg satellites (about 0.1 N·m) |
| Reaction-wheel momentum, same case | $\approx 1.7\,\mathrm{N\,m\,s}$ before margin, $\approx 4\,\mathrm{N\,m\,s}$ after | Small-satellite wheels store a few to about ten N·m·s |
| Slew kinematics (bang-bang) | $\alpha = 4\theta/t^2$, $\omega_{\text{peak}} = 2\theta/t$ | Halving $t$ quadruples torque |
| GEO station-keeping | $\approx 46\,\mathrm{m/s}$ per year north–south, about 50 in all; about 750 m/s over 15 years | Matches the commonly quoted 45–50 m/s per year |
| Solar array, 400 W draw, LEO | $\approx 2.3\,\mathrm{m^2}$ BOL, $\approx 2.7\,\mathrm{m^2}$ EOL | 324 W/m² BOL from $S\,\eta\,f_{\text{pack}}$ |
| Control bandwidth, 2 Hz structural mode | $\approx 0.2$–$0.7\,\mathrm{Hz}$ ($1.3$–$4.2\,\mathrm{rad/s}$) | Standard 3× to 10× separation rule of thumb |

The next three lessons take the whiteboard derivations these estimates lean on — the rocket equation, the Kalman gain, proportional navigation, Euler's equations and the Clohessy–Wiltshire equations — and build each one cold, from momentum and geometry, the way you would have to reproduce it under the same time pressure.

::: context fermi The physicist who estimated a bomb with scraps of paper
Enrico Fermi, an Italian-born physicist who built the first nuclear reactor, was famous for these rough, fast estimates. At the Trinity test in July 1945 he dropped small pieces of paper as the blast wave passed, watched how far they were pushed, and estimated the explosion's energy as about 10 kilotons of TNT. Later analysis put it at around 20 — the same order of size, from paper scraps. He also liked to ask students how many piano tuners work in Chicago. The point was never the exact answer. It was that careful guesses, multiplied together, land near the truth, because the errors in different guesses partly cancel.
:::

::: context reaction-wheel Turning without pushing on anything
Sit on a spinning office chair holding a bicycle wheel. Spin the wheel one way and your chair turns the other way. Nothing pushed on you from outside: the total spin of you plus the wheel stays the same, so when the wheel gains spin, you gain the opposite. A reaction wheel does this inside a spacecraft, with no propellant used. The wheel's torque limit sets how fast the turn can start and stop; its momentum limit sets how fast the spacecraft can turn at its peak before the wheel runs out of speed. That is why the problem asks for both.
:::

::: context bang-bang Full push, then full brake
"Bang-bang" means the controller only ever uses full effort one way or full effort the other — like flooring the gas pedal to halfway, then braking hard to a stop. For this slew, the spin rate rises in a straight line for 45 s, then falls in a straight line for 45 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="40,130 175,40 310,130" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="175" y1="40" x2="175" y2="130" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="146">0</text><text x="175" y="146">45 s</text><text x="310" y="146">90 s</text>
    <text x="175" y="30">peak 0.0233 rad/s (1.33°/s)</text>
    <text x="175" y="105">area = 60° = 1.047 rad</text>
  </g>
  <text x="95" y="160" font-size="11" fill="#1d6fd1" text-anchor="middle">+ torque</text>
  <text x="255" y="160" font-size="11" fill="#b4232c" text-anchor="middle">− torque</text>
  <text x="30" y="75" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 30 75)">rate ω</text>
</svg>
```

The area under a rate-versus-time graph is the angle turned: $\tfrac{1}{2} \times 90 \times 0.0233 \approx 1.047\,\mathrm{rad}$, which is $60^\circ$. For a fixed time and angle, this triangle has the lowest possible peak torque.
:::

::: context cube-inertia Where the one-sixth comes from
Slice the cube into thin square slabs stacked along the spin axis. Each slab spins flat, like a record, about its own center. A bit of mass at $(x, y)$ in a slab sits at squared distance $x^2 + y^2$ from the axis, so the slab's inertia is the sum of two pieces: the average of $x^2$ across a width $L$ is $L^2/12$, and the same for $y^2$. That gives $m(L^2/12 + L^2/12) = mL^2/6$ for each slab, and adding up the slabs keeps the same $1/6$ for the whole cube. Check: 300 kg and 1.2 m give $300 \times 1.44 / 6 = 72\,\mathrm{kg\,m^2}$.
:::

::: context pyramid Why four wheels, tilted
Three wheels, one per axis, would do the job — until one fails. So many spacecraft carry four, arranged like the edges of a pyramid, with each wheel's spin axis tilted so that every wheel helps on every axis. Lose any one wheel and the remaining three can still turn the spacecraft in any direction. The cost of the tilt is that only part of each wheel's torque points along any one body axis — roughly $\cos(35^\circ) \approx 0.82$ of it for the angle used here — so each wheel must be a little stronger, about $1/0.82 \approx 1.22$ times.
:::

::: context geo Why 42,164 km
A satellite farther from Earth moves more slowly and takes longer to go around. At a radius of 42,164 km from Earth's center — about 35,786 km above the equator — one orbit takes 23 hours 56 minutes, exactly the time Earth takes to turn once relative to the stars. So a satellite there, above the equator, keeps pace with the ground below and seems to hang still. That is why TV dishes can stay pointed at one spot in the sky.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="80" r="66.1" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6,4"/>
  <circle cx="110" cy="80" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="176.1" cy="80" r="4" fill="#b4232c"/>
  <line x1="110" y1="80" x2="176.1" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <g font-size="12" fill="#1f2a44">
    <text x="200" y="60">Earth, radius 6,378 km</text>
    <text x="200" y="84" fill="#b4232c">GEO satellite</text>
    <text x="200" y="108" fill="#1d6fd1">orbit radius 42,164 km</text>
    <text x="200" y="132" fill="#6c7a93">drawn to scale: 6.6 Earth radii</text>
  </g>
</svg>
```

You can check the period: $2\pi\sqrt{r^3/\mu}$ with $r = 4.2164 \times 10^7\,\mathrm{m}$ gives about 86,164 s.
:::

::: context inclination-drift The Moon's slow tug on the orbit plane
The Moon and Sun do not orbit in Earth's equatorial plane, so their gravity keeps trying to twist a geostationary orbit's plane toward their own. Left alone, a GEO satellite's inclination grows by roughly three quarters of a degree to about one degree per year, and it would keep growing for decades, to about $15^\circ$, before shrinking again. The rate changes because the Moon's own orbit plane slowly wobbles on an 18.6-year cycle. The usual quoted average, $0.85^\circ$ per year, is the number to carry into an interview.
:::

::: context plane-change Swinging the velocity arrow
To tilt an orbit's plane, you must swing the velocity arrow sideways without changing its length. The burn supplies the gap between the old arrow tip and the new one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="120" r="4" fill="#1f2a44"/>
  <line x1="40" y1="120" x2="310" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="320,120 306,113 306,127" fill="#1d6fd1"/>
  <line x1="40" y1="120" x2="300" y2="50" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="309,47 295,43 299,57" fill="#1d6fd1"/>
  <line x1="319" y1="118" x2="310" y2="52" stroke="#b4232c" stroke-width="3"/>
  <path d="M120,120 A80,80 0 0,0 117,99" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44">
    <text x="128" y="112">Δi</text>
    <text x="170" y="138">old velocity, length v</text>
    <text x="120" y="70">new velocity, length v</text>
  </g>
  <text x="326" y="90" font-size="12" fill="#b4232c">Δv</text>
</svg>
```

The angle is drawn much larger than $0.85^\circ$ so you can see it. For small angles the red gap is almost an arc of a circle of radius $v$, so its length is $v\,\Delta i$.
:::

::: context triaxiality Earth's slightly oval waist
Earth's equator is not a perfect circle; it is very slightly oval, bulging a little more at some longitudes than others. A geostationary satellite feels a tiny sideways pull toward the nearest "low spot" in this bumpy gravity field, and drifts east or west along the orbit. There are two stable resting longitudes, near 75° east and 105° west, where drifting satellites tend to gather. The push is gentle, which is why east–west station-keeping costs only a couple of meters per second per year.
:::

::: context triple-junction Three cells stacked in one
Sunlight is a mix of colors, and any single material turns only part of that mix into electricity well. A **triple-junction** cell stacks three thin layers, each tuned to a different band — one catches blue light, the next the middle of the spectrum, the bottom one the infrared. Together they convert about 28 to 32 percent of sunlight into electricity, against about 20 percent for a typical rooftop silicon panel. They cost far more, but on a spacecraft, every square meter and kilogram saved is worth it.
:::

::: context bandwidth How fast a controller acts, drawn on a frequency scale
On a scale of frequency, the controller's bandwidth must sit well to the left of the structure's twang. Each step in this scale is a factor of ten.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="62" x2="30" y2="78"/><line x1="180" y1="62" x2="180" y2="78"/><line x1="330" y1="62" x2="330" y2="78"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="94">0.1 Hz</text><text x="180" y="94">1 Hz</text><text x="330" y="94">10 Hz</text>
  </g>
  <rect x="75" y="58" width="79" height="24" fill="#8fb8f0" fill-opacity="0.8" stroke="#1d6fd1" stroke-width="2"/>
  <text x="114" y="46" font-size="12" fill="#1d6fd1" text-anchor="middle">bandwidth 0.2–0.67 Hz</text>
  <line x1="225" y1="50" x2="225" y2="90" stroke="#b4232c" stroke-width="3"/>
  <text x="225" y="40" font-size="12" fill="#b4232c" text-anchor="middle">mode 2 Hz</text>
  <text x="180" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">gap of 3× to 10× keeps the controller off the resonance</text>
</svg>
```

Hertz counts cycles per second; radians per second count angle per second. One cycle is $2\pi$ radians, so $\omega = 2\pi f$: 0.2 Hz is about 1.3 rad/s.
:::

::: context espa The ring that carries small satellites
**ESPA** stands for EELV Secondary Payload Adapter: a ring that sits between a large rocket's main payload and its upper stage, with ports around its side where small satellites bolt on. It gave "ESPA-class" its meaning as a size category. The original ring's ports carry satellites up to about 180 kg, and the larger ESPA Grande up to about 320 kg — so "a few hundred kilograms, ESPA-class" is a concrete, recognizable anchor for a spacecraft's mass.
:::
