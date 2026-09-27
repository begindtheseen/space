---
id: l08-features
title: Features that turn sketches into parts
minutes: 20
covers:
  - 'Features: extrude, revolve, sweep, loft, fillet, shell, rib, draft, hole wizard, patterns, configurations'
---

Think about a lump of modelling clay and a kitchen drawer full of tools. Press the clay through a star-shaped nozzle and you get a long star-shaped rod. Spin a lump on a potter's wheel and shape one side, and you get a round vase. Scoop out the middle and it becomes a bowl. Smooth the sharp edges with your thumb. Poke a row of holes with a pencil. Every one of those moves takes the part you have and changes it in one clear way.

A 3D CAD part is made the same way, one move at a time. Each move is a **feature** — one modelling operation, like "extrude this sketch 6 mm" or "round these edges with a 2 mm radius", that adds material, removes it, or reshapes it. Last lesson you learned to make a fully defined sketch. This lesson turns sketches into solids.

There are only about a dozen features you will use every day. For each one you will see what it makes and where it shows up on real spacecraft hardware. At the end you will use the model to answer the question a GNC engineer actually asks the mechanical team: how much does it weigh?

## Adding and removing material

Almost every feature comes in two flavours. A **boss** (or "add") feature adds material to the part. A **cut** feature takes material away. Onshape asks the same thing with a choice of New, Add, Remove or Intersect at the top of each feature.

Under the hood, the program builds the new shape as its own solid and then combines it with the part you already have. Adding is joining the two solids; cutting is subtracting one from the other. These combinations are called **[[Boolean operations|boolean]]** — joining, subtracting and keeping only the overlap.

The features also come in a fixed order, one after another, in a list called the **feature tree**. The next lesson is all about that list. For now, notice that each feature works on the part as it stood *after* the feature before it.

## Extrude: push a sketch straight

**Extrude** takes a flat sketch and pushes it straight out into 3D, like dough through a cookie press. A rectangle becomes a block; a circle becomes a rod; an L-shaped profile becomes an L bracket.

You choose how far it goes, called the **end condition**:

- **Blind** — a set distance, such as $6\,\mathrm{mm}$.
- **Symmetric** (or mid-plane) — the same distance both ways from the sketch plane.
- **Through all** — for a cut, right through the whole part, whatever its size.
- **Up to** a face, plane or vertex — stop exactly where some other geometry is.

On spacecraft parts, extrude is everywhere: the base plate of an avionics bracket, a mounting flange, the pockets milled into a panel to take out weight. A cut-extrude with Through all is the usual way to make a plain hole that must go all the way through.

## Revolve: spin a profile around an axis

**Revolve** takes a sketch and spins it around a line — the **axis** — like a potter's wheel. Anything round in cross-section is a revolve. You sketch *half* the side view, draw the centerline, and revolve $360^\circ$ (or less, for a partial ring).

Where it shows up: a rocket engine's **[[bell nozzle|bell-nozzle]]**, the domed ends of propellant tanks, pressure vessels, fittings, washers and the bodies of valves. Anything turned on a lathe is naturally a revolve.

::: note Why the volume of a revolve is easy
A shape revolved around an axis has a volume given by a result called **Pappus's theorem**: the area $A$ of the sketch times the distance its center travels around, $2\pi \bar{r}$, where $\bar{r}$ (read "r bar") is how far the area's center point sits from the axis:

$$
V = 2\pi \bar{r} A.
$$

Check it on a tube. Revolve a $4\,\mathrm{mm} \times 20\,\mathrm{mm}$ rectangle whose center sits $30\,\mathrm{mm}$ from the axis. Pappus gives $2\pi \times 30 \times (4 \times 20) = 2\pi \times 30 \times 80 \approx 15\,080\,\mathrm{mm^3}$. The tube runs from radius $28$ to radius $32$ and is $20$ tall, so the direct way gives $\pi (32^2 - 28^2) \times 20 = \pi \times 240 \times 20 \approx 15\,080\,\mathrm{mm^3}$. Same answer. Why it works: slice the ring into thin wedges; each is almost a box whose length is the distance the center travels.
:::

## Sweep and loft: shapes that follow a path

**Sweep** moves a profile along a path, like squeezing toothpaste along a curved line. You need two sketches: the **profile** (a circle, say) and the **path** (a curve). The result is a tube or a bar that follows the curve.

On a spacecraft this is the propellant and pressurant **tubing** that snakes between tanks, valves and thrusters, wiring harness bundles, and springs (a circle swept along a **[[helix|helix]]**).

**Loft** blends between two or more profiles in different places. Put a circle on one plane and a square on another, and loft makes the smooth transition between them. Loft is how you make a duct that changes shape, a fairing section, or a blended transition between a round pipe and a rectangular port.

## Fillet: round the edges

A **fillet** rounds an edge to a set radius. Its cousin the **chamfer** cuts the edge off at a slant instead.

Fillets are not decoration. A sharp inside corner is where cracks start, because the load has to turn a hard corner and it bunches up there — a **[[stress concentration|stress-concentration]]**. Rounding the corner spreads that load out. Inside corners of machined pockets also need a fillet at least as big as the radius of the cutting tool, since a round tool cannot cut a sharp inside corner. So on a bracket you will see fillets where the upright meets the base, and in every pocket.

::: warning Fillets go near the end
Put fillets and chamfers late in the feature list. They create new small faces and edges, and anything built on those later is fragile: change the fillet and the faces it made change too. Lesson 9 shows exactly what breaks.
:::

## Shell and rib: thin walls and their stiffeners

**Shell** hollows a solid out, leaving walls of one thickness. You pick the faces to remove (usually the top, to make an open box) and the wall thickness. One click turns a solid block into a box.

Where it shows up: the **housing** of an avionics box, a reaction wheel's cover, the case of a star tracker — any electronics enclosure machined or cast as a thin-walled box.

A **rib** adds a thin stiffening wall from a single open line in a sketch. Draw one line from the upright of an L bracket down to its base, give the rib a thickness, and you have a triangular web — a **gusset** — that stops the upright from bending. Thin-walled parts get ribs where they need stiffness, because a rib adds far more stiffness than the same mass spread as thicker wall.

::: example Shelling an avionics housing
An avionics housing starts as a solid aluminum block $100 \times 80 \times 40\,\mathrm{mm}$. You shell it with a $2\,\mathrm{mm}$ wall, removing the top face so it is an open box. Aluminum alloy 6061 has density about $2700\,\mathrm{kg/m^3}$, which is $2.7\,\mathrm{g/cm^3}$.

**Solid block.** $100 \times 80 \times 40 = 320\,000\,\mathrm{mm^3}$.

**The hollow inside.** The wall comes in $2\,\mathrm{mm}$ on each of the four sides and $2\,\mathrm{mm}$ up from the bottom; the top is open, so the height only loses one wall:

$$
(100 - 2 \times 2)(80 - 2 \times 2)(40 - 2) = 96 \times 76 \times 38 = 277\,248\,\mathrm{mm^3}.
$$

**The shell.** $320\,000 - 277\,248 = 42\,752\,\mathrm{mm^3}$.

**Mass.** One cubic centimeter is $1000\,\mathrm{mm^3}$, so the shell is $42.752\,\mathrm{cm^3}$, and $42.752 \times 2.7 \approx 115\,\mathrm{g}$. The solid block would have been $320 \times 2.7 = 864\,\mathrm{g}$. The shell feature removed about $87\%$ of the mass.

**Sanity check.** Estimate the wall area and multiply by the thickness: bottom $100 \times 80 = 8000$, two long walls $2 \times 100 \times 40 = 8000$, two short walls $2 \times 80 \times 40 = 6400$; total $22\,400\,\mathrm{mm^2}$, times $2\,\mathrm{mm}$ gives $44\,800\,\mathrm{mm^3}$. That is about $5\%$ high, because the estimate counts the corners and edges twice. Close enough to trust the exact number.
:::

## Draft: a taper so the part lets go

Try pulling a straight-sided sandcastle out of a bucket and it sticks; a bucket that flares out lets the sand slide free. **Draft** tilts faces by a small angle so a part can come out of a mold.

Parts made by **casting** (pouring molten metal into a mold) or **molding** (pressing plastic into one) need draft on every face parallel to the direction the mold opens. Typical draft angles are $1^\circ$ to $3^\circ$. A machined part cut from solid bar usually needs none.

How much does a draft move a face? A wall of height $h$ tilted by angle $\theta$ (read "theta") moves its top edge in by

$$
\text{offset} = h \tan\theta.
$$

For a $40\,\mathrm{mm}$ wall at $2^\circ$: $40 \times \tan 2^\circ \approx 40 \times 0.0349 \approx 1.40\,\mathrm{mm}$. Small, but enough to change a fit if you forgot it.

On space hardware you see draft on cast housings, on molded connector bodies, and on the tools — the molds — used to lay up composite parts.

## Hole wizard: holes that know their fastener

A plain cut-extrude can make a round hole. The **hole wizard** (SolidWorks' name; Onshape has a Hole feature, NX a Hole command) makes a *standard* hole from a table: you pick the fastener standard and size, and it builds the right diameter, depth and shape. The choices are:

- **Clearance** — a plain hole a bit bigger than the bolt, so the bolt passes through.
- **Tapped** — a hole with a thread cut in it, so the bolt screws in. The wizard picks the drill size for that thread.
- **Counterbore** — a flat-bottomed step at the top so a bolt head sits below the surface.
- **Countersink** — a cone at the top for a flat-head screw.

Aerospace aluminum parts often use **[[thread inserts|thread-insert]]** instead of tapping straight into the soft metal, and the hole wizard lists those too. Using the wizard instead of hand-drawn circles means the drawing callouts and the hole data are right from the start.

## Patterns: copy with a rule

A **pattern** copies a feature many times following a rule. A **linear pattern** copies along a line, or in rows and columns: set the spacing and the count. A **circular pattern** copies around an axis: set the count and the total angle. Its sibling, **mirror**, copies across a plane.

Where they show up: bolt circles on flanges and tank ports, the ring of holes on a reaction wheel mount, rows of cooling fins, and the triangular pockets milled out of a lightweight panel, a pattern called **[[isogrid|isogrid]]**.

A pattern stores the rule, not the copies. Change the count from 8 to 12 and the new holes appear, evenly spaced. For a circular pattern of $n$ holes over $360^\circ$ the spacing angle is $360^\circ / n$: eight holes sit $360 / 8 = 45^\circ$ apart. On a $100\,\mathrm{mm}$ bolt circle (radius $50\,\mathrm{mm}$), neighboring holes are $2 \times 50 \times \sin(22.5^\circ) \approx 38.3\,\mathrm{mm}$ apart in a straight line.

## Configurations: one model, several variants

A **configuration** is one version of a part inside the same file, with some dimensions or features changed. One bracket file can hold a $60\,\mathrm{mm}$, an $80\,\mathrm{mm}$ and a $100\,\mathrm{mm}$ version; one fastener file can hold every length in a family. SolidWorks drives them from a table (a **design table**); Onshape has configurations built in; NX uses part families.

The reason is not saving typing. It is keeping variants **in step**: fix a mistake in the base feature and every configuration gets the fix. Each configuration usually gets its own [[part number|dash-numbers]].

## How much does it weigh?

Every solid in CAD has an exact **volume**, the space it fills. Give the part a material, and the program multiplies by the **density** — mass per unit volume — to get the mass:

$$
m = \rho V,
$$

where $\rho$ ("rho") is the density. Watch the units: CAD usually reports volume in $\mathrm{mm^3}$, and $1\,\mathrm{m^3} = 10^9\,\mathrm{mm^3}$.

::: example Mass of an extruded bracket plate
A bracket base plate is extruded from an $80 \times 50\,\mathrm{mm}$ rectangle, $6\,\mathrm{mm}$ thick. Four clearance holes for M6 bolts, $6.6\,\mathrm{mm}$ in diameter, are cut through it. The material is aluminum 6061, $\rho = 2700\,\mathrm{kg/m^3}$.

**The plate.** $V_{plate} = 80 \times 50 \times 6 = 24\,000\,\mathrm{mm^3}$.

**One hole.** A hole is a cylinder: area of the circle times the depth. The radius is $6.6 / 2 = 3.3\,\mathrm{mm}$, so

$$
V_{hole} = \pi \times 3.3^2 \times 6 \approx 205.3\,\mathrm{mm^3}.
$$

**Four holes.** $4 \times 205.3 \approx 821.1\,\mathrm{mm^3}$.

**The part.** $V = 24\,000 - 821.1 = 23\,178.9\,\mathrm{mm^3}$.

**Mass.** Convert to cubic meters, $23\,178.9 \times 10^{-9}\,\mathrm{m^3}$, and multiply by the density: $23\,178.9 \times 10^{-9} \times 2700 \approx 0.0626\,\mathrm{kg}$, or about $62.6\,\mathrm{g}$.

**Sanity check.** The holes are only about $3.4\%$ of the plate's volume, so the answer should be a little under the solid plate's $24 \times 2.7 = 64.8\,\mathrm{g}$. It is. About the mass of a hen's egg for a palm-sized aluminum plate also feels right.
:::

::: warning The material is part of the model
A CAD mass is only as good as the material you assigned. Many programs quietly use a default density, or none, until you set one. A steel bolt modelled in "default" material, or a part left as generic plastic, gives a wrong mass that looks just as precise as a right one. Always check the material before you trust a number.
:::

These single-part numbers are the start of **[[mass properties|mass-properties-bridge]]**: mass, center of mass and how the mass is spread out. A GNC engineer needs all three for the whole vehicle.

## Check yourself

::: check
Name the feature you would reach for first for each: a rocket nozzle, a curved propellant line, an open-topped electronics box, and a ring of twelve bolt holes.
:::

::: answer
The nozzle is round in cross-section, so revolve its half-profile around the centerline. The propellant line follows a path, so sweep a circle (or a ring) along the tube's route. The electronics box is a solid block hollowed out with shell, removing the top face. The bolt holes: make one hole (with the hole wizard) and circular-pattern it with a count of 12 around the axis, which spaces them $360 / 12 = 30^\circ$ apart.
:::

::: check
Why does a machined bracket usually have no draft, while a cast version of the same bracket needs it?
:::

::: answer
Draft exists so a part can slide out of a mold. A cast part is poured into a mold, so faces along the direction the mold opens need a small taper, typically $1^\circ$ to $3^\circ$, or the part sticks. A machined part is cut out of solid material by a tool; nothing has to be pulled out of a mold, so it needs no draft.
:::

::: check
A solid titanium block $50 \times 40 \times 20\,\mathrm{mm}$ is shelled to a $1.5\,\mathrm{mm}$ wall with the top face removed. Titanium alloy is about $4430\,\mathrm{kg/m^3}$ ($4.43\,\mathrm{g/cm^3}$). What is the mass of the shell?
:::

::: answer
Solid: $50 \times 40 \times 20 = 40\,000\,\mathrm{mm^3}$. Inside: $(50 - 3)(40 - 3)(20 - 1.5) = 47 \times 37 \times 18.5 = 32\,171.5\,\mathrm{mm^3}$. Shell: $40\,000 - 32\,171.5 = 7828.5\,\mathrm{mm^3} = 7.8285\,\mathrm{cm^3}$. Mass: $7.8285 \times 4.43 \approx 34.7\,\mathrm{g}$. Check with the area estimate: bottom $50 \times 40 = 2000$, long walls $2 \times 50 \times 20 = 2000$, short walls $2 \times 40 \times 20 = 1600$, total $5600\,\mathrm{mm^2}$. Times $1.5$ that is $8400\,\mathrm{mm^3}$, a little high as expected, since it counts the corners twice.
:::

::: check
A molded plastic cover has side walls $25\,\mathrm{mm}$ tall with $1.5^\circ$ of draft. How far in does the top edge of a wall move compared with no draft?
:::

::: answer
Offset $= h \tan\theta = 25 \times \tan 1.5^\circ \approx 25 \times 0.02619 \approx 0.65\,\mathrm{mm}$. So the top of the cover is about $0.65\,\mathrm{mm}$ smaller on each side than the bottom — small, but it must be allowed for if something has to fit inside.
:::

::: check
Why use one file with three configurations for a bracket that comes in three lengths, instead of three separate files?
:::

::: answer
Because the three variants share all their other features. In one file, a change to a shared feature — a hole size, a fillet, a material — is made once and applies to all three. With three copies, someone has to remember to fix all three, and sooner or later one is missed and the variants quietly drift apart. Each configuration can still have its own part number.
:::

## Summary

| Feature | What it makes | Where it shows up |
|---|---|---|
| Extrude | Sketch pushed straight; blind, symmetric, through all, up to | Bracket plates, flanges, pockets |
| Revolve | Sketch spun about an axis | Nozzles, tank domes, fittings |
| Sweep | Profile along a path | Tubing, harnesses, springs |
| Loft | Blend between profiles | Ducts, transitions, fairings |
| Fillet, chamfer | Rounded or slanted edge | Inside corners, stress relief |
| Shell | Hollow with even walls | Avionics and sensor housings |
| Rib | Thin stiffening web | Gussets on brackets, walls |
| Draft | Tapered faces, 1 to 3 degrees | Castings, moldings, composite tools |
| Hole wizard | Standard clearance, tapped, counterbore, countersink holes | Every bolted joint |
| Pattern, mirror | Copies by rule | Bolt circles, isogrid pockets |
| Configuration | Variants in one file | Families of brackets, fasteners |
| Mass | Density times volume | Check the material first |

Features pile up in order, and later ones lean on earlier ones. The next lesson looks at that list — the feature tree — and at how to build it so a change of one dimension does not break everything after it.

::: context boolean Adding, subtracting and overlapping solids
The name comes from George Boole, a 19th-century mathematician who wrote down the algebra of "and", "or" and "not". For solids, "or" joins two shapes into one, "not" subtracts one from the other, and "and" keeps only the part they share.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="30" width="60" height="50" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="55" r="25" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="16" y="31" width="58" height="48" fill="#8fb8f0"/>
  <text x="60" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">add (join)</text>
  <path d="M135,30 H195 V30.5 A25,25 0 0,0 195,79.5 V80 H135 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="55" r="25" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="170" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">remove (cut)</text>
  <path d="M320,30 A25,25 0 0,0 320,80 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="260" y="30" width="60" height="50" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="320" cy="55" r="25" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="300" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">intersect (overlap)</text>
</svg>
```

The dashed outlines show the two starting shapes; blue is what survives.
:::

::: context bell-nozzle Why a nozzle is a revolve
A rocket nozzle is round at every station along its length, so one half-profile spun about the centerline describes it completely. The profile narrows to the **throat**, the smallest circle, then flares out in a curved bell that turns the hot gas's pressure into speed. Designers work in the half-profile: change a point on the curve, and the revolve rebuilds the whole bell.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="8 4 2 4"/>
  <text x="330" y="138" font-size="11" text-anchor="end" fill="#6c7a93">axis of revolution</text>
  <path d="M30,50 L90,50 Q120,50 130,95 Q140,100 160,98 Q250,80 330,30" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="138" y1="99" x2="138" y2="120" stroke="#b4232c" stroke-width="1.5"/>
  <text x="138" y="92" font-size="11" text-anchor="middle" fill="#b4232c">throat</text>
  <text x="55" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">chamber</text>
  <text x="290" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">bell</text>
</svg>
```

Only the top half is sketched; the revolve supplies the rest.
:::

::: context helix A curve that climbs as it turns
A helix is the shape of a spring or a screw thread: a curve that goes around a cylinder while rising at a steady rate. Its **pitch** is how far it climbs in one full turn. CAD programs make a helix from a circle, a pitch and a number of turns, and a sweep then runs a small circle along it to make a coil spring. Modelled threads are usually skipped on real parts — they make models slow — and the thread is shown by a note instead.
:::

::: context stress-concentration Why sharp inside corners crack
Picture water in a river turning a sharp bend: it bunches up on the inside of the turn. Load flowing through a part does something similar. At a sharp inside corner the stress can be several times higher than in the plain metal nearby, and parts that are shaken hard — every launch shakes them hard — grow cracks from those spots. A fillet gives the load a gentle curve to follow. The bigger the radius compared with the wall thickness, the smaller the peak.
:::

::: context thread-insert A steel thread inside soft aluminum
A thread cut straight into aluminum wears and strips if a bolt is put in and taken out many times, as happens during testing. A **thread insert** is a small steel coil or sleeve set into a slightly larger tapped hole; the bolt then screws into the hard insert. Helical coil inserts are the familiar kind. The hole wizard needs to know about the insert because the hole it cuts is sized for the insert, not the bolt.
:::

::: context isogrid A pattern of triangles that saves mass
An isogrid is a panel with a grid of triangular pockets milled out of one side, leaving thin ribs in a triangle pattern. Triangles make the panel equally stiff in every direction in its plane, and most of the metal is removed. Isogrid and its square cousin, orthogrid, appear in rocket tank walls, interstages and spacecraft panels.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="320" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1">
    <polygon points="30,95 70,25 110,95"/>
    <polygon points="80,25 160,25 120,95"/>
    <polygon points="130,95 170,25 210,95"/>
    <polygon points="180,25 260,25 220,95"/>
    <polygon points="230,95 270,25 310,95"/>
  </g>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">white = pockets cut away; blue = ribs left</text>
</svg>
```

In CAD it is one pocket and a pattern, or a sketch of the grid and one cut.
:::

::: context dash-numbers Variants get their own numbers
If two variants of a bracket are not interchangeable — different lengths, say — they must not share a part number, or the wrong one gets installed. A common scheme gives the family one base number and each variant a suffix, called a **dash number**: 12345-01, 12345-02. Lesson 14 of this module covers how part numbers, revisions and releases are controlled.
:::

::: context mass-properties-bridge From one bracket to the whole vehicle
One part's mass is a start. A GNC engineer needs the whole assembly: total mass, where the center of mass sits, and the inertia tensor that says how hard it is to spin about each axis. The CAD system computes all three from the same idea used here — density times volume, summed over every part. Lesson 11 builds that up and feeds it into a simulation.
:::
