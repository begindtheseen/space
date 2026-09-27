---
id: l10-assemblies
title: Assemblies, mates and clash checks
minutes: 23
covers:
  - 'Assemblies: mates, sub-assemblies, in-context design and its dangers, interference detection'
---

Think about building a piece of flat-pack furniture. Every panel, dowel and screw is its own finished piece. The instruction sheet does not reshape any of them. It only says how they fit together: this dowel goes into that hole, this panel sits flush against that one, this shelf is 300 mm above the floor. Get the fitting rules right and the bookcase stands up. Get one wrong and a shelf slides out or two panels try to sit in the same place.

A CAD **assembly** is that instruction sheet, in 3D. It is a file that holds no geometry of its own. It points at part files and stores the rules that place each part relative to the others. The rules are called **mates** — "put this face against that face", "line up these two holes". Last lesson you built single parts with a feature tree and design intent. This lesson puts parts together.

On a real launch vehicle almost everything a GNC engineer touches lives in an assembly: the inertial measurement unit on its bracket on its shelf in the avionics bay; the engine on its gimbal on the thrust structure. The assembly is where the **[[bill of materials|bom]]** comes from, where clashes between parts are found before metal is cut, and — next lesson — where the mass, centre of gravity and inertia of the whole vehicle come from.

## Six ways to move

Put a tennis ball in the middle of an empty room. It can move in six independent ways. It can slide left–right, forward–back and up–down. That is three **translations**. It can also spin about each of those three directions. That is three **rotations**. Each independent way a body can move is a **degree of freedom**, often shortened to **DOF**. A free rigid body in 3D has **[[six degrees of freedom|six-freedoms]]**: three translations and three rotations.

When you drop a new part into an assembly, it floats with all six free. Each mate you add takes some of them away. Your job is to take away exactly the ones that should not move in real life, and leave the ones that should.

### The grounded part

Something has to stay put, or the whole assembly could drift through space as one lump. So one part is **fixed** (also called **grounded**): its six DOF are all removed, and it stays exactly where it was placed. Usually it is the first part you insert, and usually it is the biggest, most structural thing — the base plate, the frame, the thrust structure. Every other part is mated, directly or through a chain, back to the grounded one.

::: warning Do not fix parts to make problems go away
When a part will not sit where you want, it is tempting to right-click it and choose Fix. The part stops moving, the error disappears — and the assembly has lost its design intent. Move the mounting holes and the fixed part stays floating in the old place. Fix only the one part that truly defines the frame, and mate everything else.
:::

## The four mates you use every day

Each mate type is a small geometric rule. Here are the four you will use most, with how many DOF each removes when it is the first mate on a free part. The rules below are for the usual face-to-face and axis-to-axis cases.

- **Coincident** — two flat faces lie in the same plane, touching like a book lying on a table. The book can no longer move up or down, and it can no longer tilt either of two ways. That removes **3** DOF. It can still slide in two directions and spin about the table's normal (the direction straight out of the table), so 3 are left.
- **Concentric** — two round features share one axis, like a bolt in a hole or a wheel on an axle. The bolt cannot move sideways in either of two directions, and it cannot tilt either of two ways. That removes **4** DOF. It can still slide along the axis and spin about it, so 2 are left.
- **Distance** — two faces are parallel with a set gap between them, like a shelf 300 mm above the floor. It is a coincident mate with an offset, so it also removes **3**.
- **Angle** — two faces sit at a set angle to each other, like a hinged lid held open at 30°. It removes **1** rotation.

Other mates exist — parallel, tangent, gear, slot — each removing its own number of DOF.

::: key Mates remove degrees of freedom
A free part has 6 DOF: 3 translations and 3 rotations. The grounded (fixed) part has 0. Face-to-face coincident removes 3; concentric removes 4; distance between parallel faces removes 3; angle removes 1. A part is fully positioned when its free DOF reach 0, unless a remaining motion is intended.
:::

### Counting what is left

You can count what an assembly can still do. For each part that is not grounded, start from 6. Subtract what each mate removes, but only the DOF that were **still free** when that mate was added. Add up what is left over all the parts.

That last condition matters. Once a bolt is concentric with a hole, it can no longer tilt. If you then add a coincident mate between the bolt head and the flange face, the coincident mate would normally remove 3 — one slide and two tilts. But the two tilts are already gone. So it removes only the 1 slide along the axis.

$$
\text{free DOF} = \sum_{\text{parts not grounded}} \left(6 - \text{DOF removed by its mates}\right)
$$

Read the big sigma, $\sum$, as "add up over every part that is not grounded".

::: example Counting the DOF of a reaction-wheel mount
A **reaction wheel** is a heavy spinning disc a spacecraft uses to turn itself. It sits on a bracket that bolts to a panel. Three parts.

**The panel** is grounded: $0$ free DOF.

**The bracket** starts with $6$.
1. Coincident: bracket base against the panel face. It removes $3$ (one slide, two tilts). Left: $6 - 3 = 3$ — slide in two directions and spin on the panel.
2. Concentric: bracket hole A with panel hole A. The two tilts are already gone, so only the $2$ sideways slides are new. Left: $3 - 2 = 1$ — the bracket can still swing about hole A like a door on a hinge.
3. Concentric: bracket hole B with panel hole B. This removes the last $1$, the swing. Left: $0$.

**The wheel** starts with $6$.
1. Concentric: wheel shaft with the bracket bore. It removes $4$. Left: $2$ — slide along the shaft and spin about it.
2. Coincident: wheel hub face against the bracket shoulder. Only the slide is new, so it removes $1$. Left: $1$.

Total free DOF $= 0 + 0 + 1 = 1$. That one DOF is the wheel spinning on its shaft, which is exactly what a reaction wheel does. Leaving it free is design intent: you can drag the wheel round and watch for anything it hits.

Sanity check: the only thing that moves on the real hardware is the wheel's spin, and the count says one thing moves. It matches.
:::

### Too many mates

The second concentric mate on the bracket works only if the two holes in the bracket are exactly as far apart as the two holes in the panel. If the bracket holes are 80.0 mm apart and the panel holes are 80.2 mm apart, no position satisfies both mates. The solver reports the assembly as **over-defined** (sometimes shown in red). A mate that asks for something already fixed by other mates, even when the numbers agree, is **redundant**. A redundant mate that disagrees always fails — and that can be a real message: the parts, as drawn, do not fit.

::: warning Over-defined is not the same as fully defined
Fully defined means every unwanted DOF is removed exactly once. Over-defined means some DOF is removed twice, by **[[mates that fight|overconstrained]]**. Fix an over-defined assembly by deleting the extra mate or by finding the dimension that is wrong — never by suppressing mates at random until the red goes away.
:::

## Sub-assemblies

A vehicle with tens of thousands of parts cannot be one flat list. It is broken into **sub-assemblies**: assemblies that are themselves placed inside a bigger assembly as if they were one part. The avionics bay is a sub-assembly. Inside it, the flight computer box is a sub-assembly. Inside that, a circuit card is a sub-assembly.

Sub-assemblies do three jobs:

1. **They match how the thing is built.** The shop builds and tests the flight computer on a bench, then bolts it in as one unit. The tree, and so the bill of materials, should match.
2. **They let teams work in parallel.** Avionics owns the bay; propulsion owns the engine section.
3. **They keep the solver small.** Mates inside a sub-assembly are solved inside it. The top level only sees each sub-assembly as one block with 6 DOF, and needs just a few mates to place it.

By default a sub-assembly is **rigid**: at the top level it moves as one piece, even if something inside it could move. If you need to see inside motion at the top level — say, a gimbaled engine swinging while the rest of the vehicle holds still — you mark that sub-assembly as **flexible**, and its internal DOF show up in the parent.

## In-context design: fast, and dangerous

There are two ways to design parts that must fit together.

**Bottom-up** design makes each part on its own, with its own dimensions, and then mates it into the assembly. If the bracket's holes are 80 mm apart, that 80 lives in the bracket.

**Top-down** design, also called **in-context design**, makes one part while looking at another part inside the assembly. You sketch the bracket's holes by snapping to the panel's holes. The bracket now holds a link — an **external reference** — to the panel. Move the panel holes, and the bracket holes follow.

It captures real design intent: the bracket *should* match the panel. But it has sharp edges.

- **Silent change.** Someone moves the panel holes for their own reasons. Your bracket changes too. Nobody told you. If the bracket was already released and being machined, the model and the drawing on the shop floor now disagree.
- **Circular dependencies.** The bracket references the panel; later someone makes a panel cut-out reference the bracket. Now each depends on the other. The rebuild order is ambiguous, and the result can depend on which file was opened first.
- **Broken links.** Rename, move or copy the panel file, and the bracket may lose its reference and fail to rebuild.

::: key In-context design
In-context design means modelling one part by referencing geometry of another in the assembly. It captures real intent but creates external references, so changing the parent silently changes the child and circular dependencies can make a rebuild non-deterministic.
:::

Teams that use top-down design keep it safe with a few habits. They reference one controlled **[[skeleton model|skeleton-model]]** — a part that holds only the interface points, planes and hole positions — instead of referencing each other's parts. They lock or break external references once a part is released. And they review the list of external references the way they review the feature tree.

::: warning A reference is a dependency on someone else's file
Before you snap to geometry in another part, ask: "If that part changes without telling me, do I want mine to change?" If the answer is not a firm yes, type the dimension in instead.
:::

## Interference and clearance detection

The worst furniture moment is two panels wanting the same space. CAD finds that before anything is built.

**Interference detection** checks every pair of solids and reports where they overlap, with the **interference volume** — how many cubic millimeters of one part sit inside the other. Two solid parts can never occupy the same space in reality, so every interference is either a design error or a modelling shortcut.

**Clearance detection** goes one step further. It reports any pair of parts closer than a gap you choose. A harness must stay 10 mm from a hot line; a moving part must clear its neighbours. Parts that do not touch can still be too close.

Three habits make these checks useful:

- **Expect false alarms from fasteners.** Threads are usually modelled as **[[plain cylinders|cosmetic-threads]]**, so a bolt shows up as overlapping its tapped hole. Most tools can ignore fastener-in-hole interference or list it separately.
- **Separate touching from overlapping.** A bracket sitting on a panel shares a face with it. That is contact, zero volume, and most tools report it as "coincident" rather than as a clash.
- **Check through the motion.** A part that clears in one position can hit in another. Drag the free DOF — or run a motion study — and repeat the check at the extremes, such as an engine at full gimbal.

::: example Two findings from one clash check
**A thread "clash".** An M6 bolt is modelled as a plain 6.0 mm cylinder. The tapped hole it screws into is modelled at the 5.0 mm tap-drill size, 12 mm deep. The overlap is a ring between those two diameters:

$$
V = \frac{\pi}{4}\left(6.0^2 - 5.0^2\right) \times 12 = \frac{\pi}{4} \times 11 \times 12 \approx 104\,\mathrm{mm^3}.
$$

The tool reports $104\,\mathrm{mm^3}$ of interference. It is not a real problem: the real bolt's threads cut into that ring by design. You mark it as a fastener interference and move on.

**A real clearance problem.** The reaction wheel from the first example is $300\,\mathrm{mm}$ across and spins inside a cover whose bore is $310\,\mathrm{mm}$ across. The nominal gap all the way round is half the difference:

$$
\frac{310 - 300}{2} = 5\,\mathrm{mm}.
$$

But the tolerances on the bracket and cover let the wheel axis sit up to $3\,\mathrm{mm}$ off the cover's axis. On the side it moves towards, the gap shrinks to $5 - 3 = 2\,\mathrm{mm}$. If the clearance rule for rotating parts is $3\,\mathrm{mm}$, the nominal model passes and the worst case fails. The check must be run with parts at their worst-case positions, not only where the model happens to put them.

Sanity check: the worst-case gap ($2\,\mathrm{mm}$) is smaller than the nominal ($5\,\mathrm{mm}$), which is what moving one part towards the other should do.
:::

## Large assemblies

A full launch vehicle assembly can have tens of thousands of parts. Opening every one with its full feature tree and exact geometry takes too long and too much memory. The module's case study makes the point: SpaceX reportedly moved to Siemens NX after Falcon 1 assemblies took over an hour to load in a mid-range package, and the Siemens account reports NX opening assemblies of more than 25,000 parts in five to ten minutes.

Every serious CAD tool has tricks to cope:

- **Lightweight loading.** Load only each part's display shape — a **[[mesh of small triangles|tessellation]]** — and the few faces that mates need. Load the full solid only when you edit or measure that part.
- **Simplified representations.** Swap a detailed sub-assembly for a stand-in: an **envelope** (a simple block the size of the real thing), or a copy with small holes, fillets and fasteners removed (**defeatured**).
- **Partial loading.** Open only the sub-assemblies you need, and leave the rest unloaded or shown as boxes.

::: warning Simplified geometry has the wrong mass
An envelope block is the right size but not the right shape, and a defeatured part is missing material. Fine for looking; not fine for mass properties or a final clash check. Switch back to the full representation first.
:::

A clash found on screen is the cheapest fix in the program, which is why aircraft and rocket makers build a complete **[[digital mock-up|digital-mockup]]** before cutting metal.

## Check yourself

::: check
A part is dropped into an assembly and given one concentric mate to a shaft, and nothing else. How many DOF does it have left, and what are they?
:::

::: answer
It started with 6. A concentric mate removes 4: the two sideways slides and the two tilts. That leaves $6 - 4 = 2$: sliding along the shaft and spinning about it — like a bead on a wire.
:::

::: check
A lid is hinged to a box with a concentric mate on the hinge pin and a coincident mate between the lid's edge face and the box's side face (which only removes the slide along the pin). The designer then adds an angle mate of 30° between the lid and the box top. How many DOF does the lid have after each step?
:::

::: answer
Start at 6. Concentric on the hinge pin removes 4, leaving 2 (slide along the pin and swing about it). The coincident mate removes the slide, leaving 1 — the lid swings open and shut. The angle mate removes that last rotation, leaving 0: the lid is held at 30°.
:::

::: check
Why is "just fix it" a bad way to position a part that keeps moving?
:::

::: answer
Fixing freezes the part where it happens to be instead of relating it to its neighbours. When a neighbour moves — new hole pattern, new plate thickness — the fixed part stays behind, floating or clashing. Fix only the one reference part; mate everything else.
:::

::: check
Your bracket was modelled in context, snapping its holes to the panel's holes. The panel designer moves two holes by 5 mm. Name two things that can go wrong, and one habit that would have prevented them.
:::

::: answer
First, your bracket changes silently: its holes move too, even if it was already released and being made from the old drawing, so the model, the drawing and the part now disagree. Second, if the panel also references your bracket anywhere, the two files depend on each other in a loop, and the rebuild can give different results depending on the order the files are opened. A preventive habit: reference a controlled skeleton model instead of the panel itself, or lock or break the external references when the bracket is released.
:::

::: check
An interference check lists 40 clashes, 36 of which are bolts in tapped holes. What do you do with the 36, and what should you do before you trust the check at all?
:::

::: answer
The bolt clashes are usually modelling artefacts: a plain full-diameter cylinder inside a hole modelled at the smaller tap-drill size. Mark them as fastener interference (or exclude fasteners) and look hard at the other 4. Before trusting the check, make sure every part is loaded as its full solid (not an envelope or defeatured stand-in), and that moving parts are checked at their extreme positions, not only where they happen to sit.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Degree of freedom | One independent way a body can move | A free body has 6: 3 translations, 3 rotations |
| Grounded part | The fixed reference | 0 DOF; fix only one part |
| Coincident | Two faces in one plane | Removes 3 |
| Concentric | Two round features on one axis | Removes 4 |
| Distance | Parallel faces with a gap | Removes 3 |
| Angle | Faces at a set angle | Removes 1 rotation |
| Over-defined | Mates that demand the same DOF twice | Delete the extra mate or fix the wrong dimension |
| Sub-assembly | Assembly placed as one unit | Rigid by default; flexible shows inner motion |
| In-context design | Part built from another part's geometry | External references; silent change; loops |
| Interference and clearance | Overlap volume and minimum gap | Check fasteners, contact and motion extremes |
| Lightweight and simplified | Faster loading | Wrong mass; never for mass properties |

Next lesson asks the assembly a number question: how heavy is it, where is its balance point, and how hard is it to spin — the mass, centre of gravity and inertia tensor that a 6-DOF simulation needs.

::: context bom The shopping list the assembly writes
A bill of materials, or BOM, is the list of everything needed to build something: part numbers, names and how many of each. An assembly tree already knows every part and how many times it appears, so CAD can write the BOM for you. A parts list on a drawing is a BOM, and so is the list a factory orders from. Because the BOM comes from the tree, a tree organised the way the thing is really built gives a BOM the shop can use directly.
:::

::: context six-freedoms Three slides and three spins
Pick three directions at right angles: x, y and z. A body can slide along each (three translations) and turn about each (three rotations). Any motion at all is some mix of these six. A mate is a rule that forbids some of them. The same six numbers — three for position, three for orientation — are exactly what a 6-DOF flight simulation tracks for a whole vehicle, which is where its name comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="70" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="90" x2="300" y2="90" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="300,90 290,85 290,95" fill="#1d6fd1"/>
  <text x="306" y="94" font-size="12" fill="#1f2a44">x</text>
  <line x1="170" y1="70" x2="170" y2="15" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="170,15 165,25 175,25" fill="#1d6fd1"/>
  <text x="176" y="20" font-size="12" fill="#1f2a44">z</text>
  <line x1="140" y1="110" x2="85" y2="150" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="85,150 91,140 97,148" fill="#1d6fd1"/>
  <text x="68" y="160" font-size="12" fill="#1f2a44">y</text>
  <path d="M 262 78 A 10 14 0 1 1 262 102" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 158 38 A 14 8 0 1 0 182 38" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 104 118 A 12 12 0 1 0 116 136" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="230" y="140" font-size="11" fill="#1d6fd1">blue: 3 slides</text>
  <text x="230" y="156" font-size="11" fill="#b4232c">red: 3 spins</text>
</svg>
```
:::

::: context overconstrained Two pins, two holes, one wrong gap
Picture a bracket with two holes 80.0 mm apart, and a panel with two holes 80.2 mm apart. Line up the first pair of holes and the second pair misses by 0.2 mm. The solver cannot satisfy both concentric mates, so it complains. On the shop floor the same parts would not go together either. Engineers often dimension one hole as a round hole and the other as a slot for exactly this reason: the slot takes up the small difference.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="280" height="50" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="90" cy="55" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="55" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="258" cy="55" r="12" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="90" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">holes line up</text>
  <text x="258" y="100" font-size="11" text-anchor="middle" fill="#b4232c">panel hole: 0.2 mm further</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">bracket holes 80.0 mm apart (gap drawn larger)</text>
</svg>
```
:::

::: context skeleton-model One shared layout instead of a web of links
A skeleton (or layout) model is a part that holds no real material — only the points, planes, axes and sketches that define where the interfaces are: hole centres, mounting planes, the engine's gimbal point. Every part that must match an interface references the skeleton, not its neighbour. Changes then flow one way, from one controlled file, and there are no loops. Siemens NX calls its linking of geometry between parts WAVE; other tools have their own names for the same idea.
:::

::: context cosmetic-threads Why threads are drawn as plain cylinders
Modelling every thread as a real helix would make each bolt a heavy, slow piece of geometry, and a vehicle has thousands of bolts. So CAD draws a "cosmetic" thread: a plain cylinder with a tag saying "M6 × 1.0". The drawing and the model-based definition show it correctly as a thread, but the solid itself is a smooth rod at the full diameter. That is exactly why interference checks flag bolts in tapped holes.
:::

::: context tessellation Curves made of flat triangles
A screen draws only flat triangles. To show a round hole, the software approximates the circle by a polygon with many short straight sides, and a curved surface by a mesh of triangles. This mesh is the tessellation. It is light and fast to draw, but it is not exact: measure a tessellated hole and you measure the polygon, not the true circle. Lightweight modes load this mesh and wait to load the exact solid until you need it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="60" r="45" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">exact circle</text>
  <polygon points="300,60 286.82,91.82 255,105 223.18,91.82 210,60 223.18,28.18 255,15 286.82,28.18" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="255" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">8-sided tessellation</text>
</svg>
```
:::

::: context digital-mockup Building it on screen first
A digital mock-up, or DMU, is a complete 3D assembly of a product used to check fit, clearance and assembly access before anything is built. Before full 3D, aircraft makers built physical wooden or metal mock-ups for the same job. The Boeing 777, designed in CATIA in the early 1990s, is widely cited as the first airliner designed and pre-assembled entirely on computer. Today a launch company runs clash checks on the full vehicle model as a routine part of design review.
:::
