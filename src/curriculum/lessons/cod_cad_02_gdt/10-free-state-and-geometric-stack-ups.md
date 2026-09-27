---
id: l10-free-state-and-geometric-stack-ups
title: Free state, geometric stack-ups and the error budget
minutes: 24
covers:
  - 'Free-state variation for thin-wall aerospace parts'
  - 'Tolerance stack-up with geometric controls'
---

Pick up a hula hoop and hang it on a hook. It droops into an egg shape. Lay it flat on the floor and it is round again. Nothing about the hoop changed. Only the way it was held changed. Now imagine you had to write down "the hoop must be round within 2 mm". Round when? Hanging? Lying down? Pressed into the frame it will live in? Each answer gives a different number from the same hoop.

Rockets are full of hula hoops: fairing rings, tank skins, interstage barrels, big lightweight panels. They are stiff once bolted into the vehicle and floppy on their own. This lesson first teaches how GD&T says which state a tolerance applies in.

Then it zooms out. A GNC engineer does not think in zones. She thinks in angles and offsets in an **error budget** — a table that lists every source of pointing or knowledge error and adds them up against a requirement. So the second half turns zones into numbers you can add, and walks one budget line down to the feature control frames on a star tracker bracket.

## Free state: the shape nobody is holding

The **free state** of a part is the shape it takes when nothing holds it except gravity — no bolts, no clamps. The **restrained state** is the shape it takes when it is held the way a note on the drawing says, usually something close to how it is held in the assembly.

Two things make a thin part's free shape differ from its assembled shape.

- **Its own weight.** A thick block does not bend noticeably under its own weight. A **[[thin wall|why-thin-walls-sag]]** does. A 2-meter ring of 3-millimeter aluminum sags into an oval when it stands on edge.
- **Locked-in stress.** Metal that has been rolled, welded or heavily machined carries **[[residual stress|residual-stress]]** — forces trapped inside the material. Cut away most of a thick plate to leave a thin skin, and the remaining stresses pull the skin slightly out of shape the moment the machine's clamps let go.

Such parts are **nonrigid parts** — parts that change shape noticeably under their own weight or small forces. A tolerance on one is meaningless unless it says which state it applies in.

### The default and the two ways around it

The rule in Y14.5 is short. Unless the drawing says otherwise, every dimension and tolerance applies in the free state. For a rigid block that is right: free and assembled are the same shape. For a nonrigid part, the drawing uses two tools.

**The restraint note.** A **restraint note** is a note on the drawing that says exactly how the part must be held while it is inspected. A good one says what the part is held against, with how many fasteners or clamps, where, how hard, and which way it faces gravity. For example: "Unless otherwise specified, all tolerances apply with datum feature A bolted to a flat fixture using 24 M6 bolts torqued to 8 N·m, axis vertical." The note copies the assembly as closely as it can, so the inspector measures the shape the part will really have in the vehicle.

**The free-state symbol.** Some tolerances must still hold in the free state even when a restraint note exists — for instance, a ring must not be so floppy that the assembler cannot bolt it on at all. Those tolerances carry the **[[free-state symbol|free-state-symbol]]** Ⓕ — a capital F in a circle — placed after the tolerance value in the feature control frame:

`| ○ | 2.0 Ⓕ |`

Read that aloud as "circularity, two point zero, free state". The ring must be round within a 2.0 mm radial gap with nothing holding it. The other tolerances on the same drawing, without Ⓕ, apply with the restraint of the note.

Size on a floppy ring needs care too. A two-point diameter changes as the ring goes oval: long one way, short the other. So a ring's size is often specified as an **average diameter**, marked AVG — the mean of several diameters, or the circumference divided by $\pi$ (read "pi", about 3.1416). A **[[pi tape|pi-tape]]** wrapped around the ring reads it directly.

::: key Free-state variation
Thin-wall and large lightweight parts deform under their own weight, so their unrestrained shape differs from the assembled shape. The note specifies which condition the tolerance applies in, and what restraint is allowed during inspection. Tolerances apply in the free state unless a restraint note says otherwise; a tolerance that must hold unrestrained carries the free-state symbol Ⓕ.
:::

::: example Checking a fairing ring two ways
A thin aluminum ring for a payload adapter has an average diameter of $1200.0 \pm 0.6\,\mathrm{mm}$, a free-state circularity of $2.0\,\mathrm{mm}$ (marked Ⓕ), and a circularity of $0.3\,\mathrm{mm}$ that applies under the restraint note (bolted to a round fixture, axis vertical).

**Average diameter.** A pi tape around the ring reads a circumference of $3771.2\,\mathrm{mm}$. Divide by $\pi$: $3771.2 / 3.14159 \approx 1200.41\,\mathrm{mm}$. The limits are $1199.4$ to $1200.6$, so it passes, with $0.19\,\mathrm{mm}$ to spare.

**Free state.** Standing on edge in a cradle, the ring goes slightly oval. Its longest diameter measures $1201.6\,\mathrm{mm}$ and its shortest $1199.0\,\mathrm{mm}$. For an oval, the two concentric circles that just hold the outline have radii equal to the long and short half-diameters. So the radial gap is half the difference: $(1201.6 - 1199.0)/2 = 2.6/2 = 1.3\,\mathrm{mm}$. That is under $2.0$, so the Ⓕ tolerance passes.

**Restrained.** Bolted to the fixture as the note says, the CMM finds the ring's radius varies from $599.92$ to $600.14\,\mathrm{mm}$. The gap is $600.14 - 599.92 = 0.22\,\mathrm{mm}$, under $0.3$. It passes.

**Sanity check.** The oval diameters, $1201.6$ and $1199.0$, both fall outside the $\pm 0.6$ size limits. A plain two-point size would have rejected this good ring. Their average, $1200.3$, sits comfortably inside. That is why floppy rings get AVG sizes.
:::

::: warning Clamping can hide a bad part
If the inspector clamps harder, or in more places, than the note allows, almost any warped part can be forced into its zone — and it springs back when the clamps come off. The reverse slip is common too: with no restraint note on a big thin part, every tolerance applies free, and a good panel fails because it sagged on the inspection table. Read the note before measuring, and write one when you design a nonrigid part.
:::

## Turning zones into plus-or-minus numbers

In the drawings module you learned the **[[tolerance stack-up|stack-up-recap]]**: follow a chain of parts, list each part's plus-or-minus tolerance, and add them. **Worst case** adds them straight, assuming every part is at its limit at once: $T_{\mathrm{WC}} = \sum t_i$. **Root-sum-square** (RSS) squares them, adds the squares and takes the square root, $T_{\mathrm{RSS}} = \sqrt{\sum t_i^2}$, which is realistic only for many independent contributors. (Read $\sum$, the Greek capital sigma, as "the sum of".)

Those rules need plus-or-minus numbers. GD&T hands you zones, so first you translate.

### Position: half the diameter

Picture a position zone of $\varnothing 0.2$ — a circle $0.2\,\mathrm{mm}$ across, centered on the true position. The hole's axis may sit anywhere inside it. How far can the axis move left or right of true position? Only to the edge of the circle, which is half the diameter away: $0.1\,\mathrm{mm}$. The same is true in any single direction you pick.

So along any one line of the stack, a **[[position zone of diameter t contributes plus or minus t over 2|half-the-zone]]**:

$$
\varnothing t \;\longrightarrow\; \pm \frac{t}{2}.
$$

Read "$\varnothing t$" as "diameter tee". If the position carries an MMC modifier, use the zone the part can really reach at its worst: the stated tolerance plus the full bonus at LMC. A hole with MMC $6.0$, LMC $6.2$ and position $\varnothing 0.1$ at MMC can have a $\varnothing 0.3$ zone, so it contributes $\pm 0.15$.

The same halving works for any zone centered on the true location. A profile of $0.4$ spread equally about the true surface lets the surface sit $0.2$ out or $0.2$ in: $\pm 0.2$.

### Orientation: an angle, not an offset

Orientation zones — perpendicularity, angularity, parallelism — do not locate anything. They only limit tilt. A perpendicularity zone $t$ wide on a face of length $L$ lets one end of the face lean over by up to $t$ compared with the other end. The useful number is the angle:

$$
\theta \approx \frac{t}{L} \quad \text{(in radians)}.
$$

Read $\theta$ as "theta". This is the **[[small-angle rule|small-angle-bridge]]** from the drawings module: a small tilt, in radians, is the offset divided by the span. One radian is about $57.3^\circ$, and one degree is $3600$ arcseconds.

::: key Geometric zones in a stack-up
A position zone of diameter $t$ contributes $\pm t/2$ along any one direction (use the zone at LMC, with bonus, for a worst case). A zone of total width $t$ centered on true location, such as equal-bilateral profile, also contributes $\pm t/2$. An orientation zone of width $t$ across a span $L$ allows a tilt of about $t/L$ radians. Then add the contributions by worst case or by RSS, exactly as for plus-or-minus tolerances.
:::

::: warning Do not add the diameter
The most common geometric stack-up mistake is putting $0.2$ into the column when the frame says $\varnothing 0.2$. That doubles the contribution. Ask yourself, "How far can the axis move from true position in this one direction?" The answer is the radius of the zone, not its diameter.
:::

::: example Where does the tracker's optical center land?
A star tracker's side-to-side location on a spacecraft panel passes through four contributors. We want its possible offset along one direction, $x$.

- Panel inserts the bracket bolts to: position $\varnothing 0.20$ → $\pm 0.10\,\mathrm{mm}$.
- Bracket's mounting holes: position $\varnothing 0.10$ → $\pm 0.05\,\mathrm{mm}$.
- Tracker seat's dowel-pin holes: position $\varnothing 0.06$ → $\pm 0.03\,\mathrm{mm}$.
- Float of a $\varnothing 4.000$ [[dowel pin|dowel-pins]] in its $\varnothing 4.012$ hole: the gap is $0.012$, so the pin can shift half of it either way → $\pm 0.006\,\mathrm{mm}$.

**Worst case.** $0.10 + 0.05 + 0.03 + 0.006 = 0.186\,\mathrm{mm}$. So $\pm 0.19\,\mathrm{mm}$.

**RSS.** Square each: $0.0100$, $0.0025$, $0.0009$, $0.000036$. Sum: $0.013436$. Root: $\sqrt{0.013436} \approx 0.116\,\mathrm{mm}$.

**Sanity check.** RSS is smaller than worst case and larger than the biggest single term, $0.10$, as it must be. The panel inserts dominate, so tightening the tracker's own holes buys almost nothing. And a sideways shift this small does not matter for pointing at all: moving a camera sideways does not change which star it sees. Pointing cares about tilt.
:::

## How GD&T reaches a control loop

Most of this module has been about fit: will the parts assemble? For a GNC engineer the same controls have a second life. A tilted mounting face tilts a sensor's view or an actuator's push. Those errors land in the error budget, and from there in the control loop.

::: key How GD&T reaches a control loop
Through alignment error budgets. Perpendicularity of a thruster seat becomes a thrust-vector misalignment and a disturbance torque; angularity of a star-tracker mount becomes attitude-knowledge bias; position of a gimbal bearing becomes backlash and friction variation.
:::

A **thrust-vector misalignment** — the engine pushing slightly off the line it was meant to — sends part of the thrust sideways around the center of mass, a twist the controller never asked for. An **attitude-knowledge bias** — a fixed error in where the spacecraft thinks it points — is worse, because no filter can see it: the star tracker is the most accurate sensor on board, and if it is mounted crooked, everything agrees with the crooked answer. **Backlash** — slop in a mechanism that lets it move a little before it grips — makes a gimbal's response lag and wander.

So the direction of work runs top-down. Systems engineers set a pointing or knowledge requirement. The GNC engineer splits it into an **[[allocation|budget-allocation]]** for each contributor. Each mechanical allocation then has to become a feature control frame that a machinist can make and an inspector can check.

## Tracing a budget line to a feature control frame

The attitude-knowledge budget allocates $0.03^\circ$, per axis, worst case, to "star tracker seat on its bracket". (The module's exercise asks you to repeat the trace for a tighter $0.02^\circ$. Keep that one for yourself.)

The bracket has this datum scheme. Datum A is the bracket's base face that bolts to the panel. Datum B is a dowel hole in the base, and datum C is a slot. Together A, B and C lock the bracket to the spacecraft body. The tracker seat is a separate flat face, tilted at a **basic** (exact, theoretical) $30^\circ$ to A. The tracker lands on it and is located by two dowel pins.

### Step 1: which errors move the boresight?

The tracker's line of sight is its **boresight**. Only rotations change where it points, so we need three angles:

- tilt of the seat about the two axes across the boresight;
- rotation, or **clocking**, of the tracker about the boresight itself.

Location errors of the seat do not rotate anything, so they do not enter this budget line. That tells us which controls to pick: orientation for the seat, position for the pins.

### Step 2: tilt, from angularity

Angularity of the seat to A and B puts the seat between two parallel planes $t$ apart, at exactly $30^\circ$ to A. Datum B fixes which way the seat faces around A's normal; with A alone, the seat could spin like a weathervane and still be at $30^\circ$. The tracker sits on the high points of the seat. If those points spread across the seat's span $L$, the plane they form can tilt by no more than $t/L$.

### Step 3: clocking, from pin position

The two dowel-pin holes sit a distance $S$ apart. If one hole's center moves $p/2$ one way and the other moves $p/2$ the opposite way, the line between them turns by $(p/2 + p/2)/S = p/S$. The pins' float in their holes turns it further, by the gap at each end, again in opposite directions.

### Step 4: flatness

Angularity already limits the seat's form, because every point must sit inside the same two planes. So flatness is not needed for the angle. It is a tighter **refinement**, so the tracker seats the same way every time and the joint does not bend the tracker's housing.

::: example A 0.03 degree allocation becomes three frames
The seat's contact points span $L = 80\,\mathrm{mm}$. The dowel pins are $S = 70\,\mathrm{mm}$ apart. The pins are $\varnothing 4.000$ in $\varnothing 4.012$ holes.

**The allocation in radians.** $0.03^\circ \times \pi/180 \approx 0.0005236\,\mathrm{rad}$. In arcseconds, $0.03 \times 3600 = 108\,\mathrm{arcsec}$.

**Tilt → angularity.** Solve $t/L \le 0.0005236$ for $t$: $t \le 0.0005236 \times 80 \approx 0.0419\,\mathrm{mm}$. Round down to a number a machinist can hold: $t = 0.04\,\mathrm{mm}$. Check: $0.04 / 80 = 0.0005\,\mathrm{rad}$, which is $0.0286^\circ$, about $103\,\mathrm{arcsec}$. Under $108$.

**Clocking → position.** The total allowed turn over the pin spacing is $0.0005236 \times 70 \approx 0.0367\,\mathrm{mm}$ of opposite motion at the two pins. The pin float uses $0.006$ at each end, $0.012$ in all. What remains for position is $0.0367 - 0.012 \approx 0.0247\,\mathrm{mm}$. Choose $p = \varnothing 0.02$. Check: $(0.02 + 0.012)/70 \approx 0.000457\,\mathrm{rad}$, which is $0.0262^\circ$, about $94\,\mathrm{arcsec}$. Under $108$.

**Flatness.** A refinement well inside the angularity: $0.01\,\mathrm{mm}$.

**The three frames.**

`| ∠ | 0.04 | A | B |` on the seat, with a basic $30^\circ$ to A.

`| ▱ | 0.01 |` on the seat.

`| ⌖ | ⌀0.02 | A | B | C |` on each dowel-pin hole, with no MMC modifier.

**Why no MMC on the pin holes.** A bonus would let a hole grow and its zone grow with it. Both extra amounts add straight into the clocking error, so here the modifier would spend budget we do not have.

**Sanity check.** Both angles came out under $108\,\mathrm{arcsec}$ with a little margin. The tolerances, $0.04$ and $0.02\,\mathrm{mm}$, are tight but ordinary for a precision-machined aluminum bracket — under half the thickness of a sheet of paper, and about a fifth of it.
:::

::: note Why the angle is the offset over the span
Put one end of a straight face at the bottom of a zone $t$ wide and the other end at the top, a distance $L$ along. The face is now the long side of a thin right triangle with legs $L$ and $t$. Its tilt $\theta$ satisfies $\tan\theta = t/L$. For small angles, $\tan\theta$ and $\theta$ in radians are almost equal. At $\theta = 0.0005\,\mathrm{rad}$ they differ by less than one part in ten million of the angle, far below anything a machine shop can make. So $\theta \approx t/L$.
:::

### Step 5: say what you assumed

A trace is only as honest as its assumptions, so write them next to the numbers:

- the contact points really span the seat (a narrow tripod of high spots tilts more);
- the bracket's A–B–C mounting is perfect, because its error is a different budget line;
- the tracker's own mounting face and pin holes are perfect, because they are the vendor's line;
- worst case, because two or three contributors are too few for RSS;
- the bracket is rigid and does not change shape with temperature.

Then say how it will be checked. The bracket's angularity, flatness and position are measured on a coordinate measuring machine, the subject of the next lesson. After the tracker is installed, its real alignment is measured optically, usually against a small mirrored **[[alignment cube|alignment-cube]]** on the tracker, and the measured value is loaded into the flight software. A measured alignment turns an unknown bias into a known correction.

::: warning Units, radians and the right span
Three slips spoil this trace. Using degrees in $\theta \approx t/L$ instead of radians gives an answer 57 times wrong. Mixing meters and millimeters in $t/L$ gives an answer 1,000 times wrong. And using the whole part's length instead of the seat's own span, or the pin spacing, credits the design with a lever arm it does not have.
:::

## Check yourself

::: check
A 1.5 m interstage ring's drawing carries a restraint note and one circularity tolerance marked Ⓕ. Under which condition does each of its tolerances apply?
:::

::: answer
Every tolerance without Ⓕ applies with the part held as the restraint note describes; the note overrides the default free-state rule. The circularity marked Ⓕ applies in the free state, held by nothing but gravity, so the ring cannot be too floppy to assemble.
:::

::: check
A hole's position is $\varnothing 0.08$ at MMC. The hole's MMC is $5.00$ and its LMC is $5.10$. What is its worst-case contribution to a one-direction stack-up?
:::

::: answer
At LMC the bonus is $5.10 - 5.00 = 0.10$, so the zone can reach $\varnothing(0.08 + 0.10) = \varnothing 0.18$. Along one direction the axis can move half of that: $\pm 0.09\,\mathrm{mm}$.
:::

::: check
Three contributors in a lateral stack are a position $\varnothing 0.12$, a position $\varnothing 0.05$ and an equal-bilateral profile of $0.10$. Give the worst-case and RSS stack-ups.
:::

::: answer
Convert each to plus-or-minus: $\pm 0.06$, $\pm 0.025$, $\pm 0.05$. Worst case: $0.06 + 0.025 + 0.05 = 0.135\,\mathrm{mm}$. RSS: $0.0036 + 0.000625 + 0.0025 = 0.006725$, and $\sqrt{0.006725} \approx 0.082\,\mathrm{mm}$. RSS sits between the largest term ($0.06$) and the worst case, as it must. With only three contributors, a careful engineer would still quote worst case.
:::

::: check
A thruster's mounting seat has a perpendicularity of $0.05\,\mathrm{mm}$ across a $50\,\mathrm{mm}$ span. What is the largest thrust-vector tilt it allows, in degrees, and what does that tilt do to the spacecraft?
:::

::: answer
$\theta \approx t/L = 0.05/50 = 0.001\,\mathrm{rad}$. In degrees, $0.001 \times 57.3 \approx 0.057^\circ$. Part of the thrust now pushes sideways around the center of mass: a thrust-vector misalignment, felt as a disturbance torque the controller must fight.
:::

::: check
A budget allocates $0.05^\circ$ of clocking to two dowel-pin holes $60\,\mathrm{mm}$ apart. The pins float $0.010\,\mathrm{mm}$ in total. What position tolerance can the holes carry?
:::

::: answer
$0.05^\circ$ is $0.05 \times \pi/180 \approx 0.000873\,\mathrm{rad}$. Over $60\,\mathrm{mm}$ that allows $0.000873 \times 60 \approx 0.0524\,\mathrm{mm}$ of opposite motion at the two pins. Subtract the float: $0.0524 - 0.010 = 0.0424$. Round down to $\varnothing 0.04$. Check: $(0.04 + 0.010)/60 \approx 0.000833\,\mathrm{rad} \approx 0.048^\circ$, under $0.05^\circ$.
:::

::: check
Why does the tracker trace use an orientation control on the seat instead of a position or profile control on its location?
:::

::: answer
Only rotations change where the boresight points; sliding the tracker sideways does not change which stars it sees. Angularity (or perpendicularity) limits tilt relative to the datums. A location control would spend effort on something this budget line ignores.
:::

## Summary

| Idea | Meaning | Fact or formula |
|---|---|---|
| Free state | Shape with only gravity holding the part | The default for every tolerance |
| Restraint note | How the part is held for inspection | Copies the assembly: what, how many, where, how hard |
| Free-state symbol Ⓕ | This tolerance applies unrestrained | Placed after the tolerance value |
| AVG diameter | Mean diameter of a floppy ring | Circumference divided by pi |
| Position zone in a stack | Axis can move to the zone edge | Diameter t gives plus or minus t/2 |
| Orientation zone as an angle | Tilt across a span | Theta about t/L, in radians |
| Error budget allocation | A contributor's share of a requirement | Becomes a feature control frame |

The trace ended with "measure it on a CMM". The next lesson opens that machine up: how it builds the datum reference frame from probed points, how each zone becomes a calculation, and how an annotated 3D model can hand the tolerances straight to the measuring program.

::: context why-thin-walls-sag Stiffness grows with thickness cubed
How hard a plate resists bending depends on its thickness cubed — thickness times thickness times thickness. Halve the thickness and the plate becomes eight times easier to bend, while it only loses half its weight. So a thin aerospace skin is light for its size but much floppier than its weight suggests. That is the whole trade: engineers thin walls to save mass, and pay for it in parts that change shape whenever they are picked up.
:::

::: context residual-stress Springs trapped in the metal
Rolling, forging, welding and heat treatment leave forces locked inside a metal part, pushing and pulling against each other in balance. Machining cuts some of that material away. The balance breaks, and the part moves to a new shape to find a new balance. A thin pocketed panel may be flat while clamped on the machine table and bowed by a millimeter once released. Shops fight it with stress-relieving heat treatment and by roughing, resting and then finishing the part.
:::

::: context free-state-symbol Reading the frame with its F
The Ⓕ goes inside the tolerance compartment, right after the number and any other modifier. It changes only the condition in which that one tolerance is checked.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="30" width="44" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="104" y="30" width="110" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="82" cy="50" r="11" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="140" y="56" font-size="16" text-anchor="middle" fill="#1f2a44">2.0</text>
  <circle cx="186" cy="50" r="11" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="186" y="55" font-size="13" text-anchor="middle" fill="#b4232c">F</text>
  <text x="82" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">circularity</text>
  <text x="140" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">radial gap</text>
  <text x="250" y="46" font-size="12" fill="#b4232c">free state:</text>
  <text x="250" y="62" font-size="12" fill="#b4232c">nothing holding it</text>
</svg>
```
:::

::: context pi-tape A tape measure that reads diameter
A pi tape is a thin steel tape whose markings are spaced $\pi$ times wider than normal. Wrap it once around a ring or a tank and the number it shows is the circumference divided by $\pi$ — the average diameter, read directly. Because it averages all the way around, an oval ring and a round ring with the same circumference read the same, which is exactly what an AVG size asks for.
:::

::: context stack-up-recap Where you met stack-ups
In the drawings module you followed a chain of parts in a gap, added their plus-or-minus tolerances, and compared worst case with root-sum-square. You also saw that RSS is a bet on many independent, bell-shaped contributors, and that safety-critical or few-part stacks should be quoted worst case. Everything there still holds. The only new step here is converting a geometric zone into a plus-or-minus number first.
:::

::: context half-the-zone The circle seen from one side
Look at a round position zone from the side, along one direction. The axis can sit anywhere inside the circle. Its farthest reach left or right is the circle's radius.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="80" r="55" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="170" y1="80" x2="190" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="70" x2="180" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="220" cy="62" r="4" fill="#b4232c"/>
  <text x="228" y="56" font-size="11" fill="#b4232c">real axis</text>
  <line x1="125" y1="148" x2="235" y2="148" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="125" y1="80" x2="125" y2="152" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="235" y1="80" x2="235" y2="152" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="80" x2="180" y2="152" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="152" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">−t/2</text>
  <text x="208" y="164" font-size="11" text-anchor="middle" fill="#1f2a44">+t/2</text>
  <text x="60" y="84" font-size="12" text-anchor="middle" fill="#1d6fd1">zone ⌀t</text>
  <text x="300" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">true position</text>
  <line x1="262" y1="104" x2="192" y2="84" stroke="#6c7a93" stroke-width="1"/>
</svg>
```
:::

::: context small-angle-bridge Radians make the division work
A radian is the angle at which the arc length equals the radius. Because of that definition, for a small tilt the sideways offset is almost exactly the angle times the span, so the angle is the offset divided by the span. In degrees there would be an extra factor of $57.3$ in every formula. That is why GNC work keeps angles in radians until the very end, and converts to degrees or arcseconds only to report.
:::

::: context dowel-pins Why precision mounts use pins
A bolt passes through a clearance hole, often half a millimeter bigger than the bolt, so it can slide around before it is tightened. That would ruin any alignment. A dowel pin is a hardened, precisely ground pin in a closely sized hole, with only a few thousandths of a millimeter of gap. Two dowel pins locate a part; the bolts only clamp it. That is why star trackers, gyros and optical benches sit on pins.
:::

::: context budget-allocation Splitting a requirement into shares
A pointing requirement might say the spacecraft must know its attitude within some small angle. The GNC engineer lists everything that can spoil it — sensor noise, sensor mounting, structural bending, thermal warping, software timing — and gives each a share, called an allocation. If every contributor meets its allocation, the total meets the requirement. When one share is too hard to meet, the engineer trades: tighten another line, or buy a better sensor, instead of forcing an impossible drawing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="12" width="120" height="30" rx="4" fill="#1d6fd1"/>
  <text x="180" y="32" font-size="12" text-anchor="middle" fill="#ffffff">knowledge requirement</text>
  <line x1="180" y1="42" x2="60" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="42" x2="180" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="42" x2="300" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="80" width="100" height="28" rx="4" fill="#8fb8f0"/>
  <text x="60" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">sensor noise</text>
  <rect x="130" y="80" width="100" height="28" rx="4" fill="#f2b880"/>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">tracker seat</text>
  <rect x="250" y="80" width="100" height="28" rx="4" fill="#8fb8f0"/>
  <text x="300" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">thermal warp</text>
  <line x1="180" y1="108" x2="180" y2="124" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="140" font-size="11" text-anchor="middle" fill="#b4232c">feature control frames</text>
</svg>
```
:::

::: context alignment-cube A mirror cube for measuring angles
An alignment cube is a small glass or metal cube with precisely flat, square, mirrored faces, fixed to a sensor so its faces line up with the sensor's axes. An engineer looks at the faces with a theodolite, a precise angle-measuring telescope, and measures which way each face points relative to cubes on the spacecraft body. The result is the sensor's real mounting angle, often good to arcseconds, which is then loaded into the flight software as a calibration.
:::
