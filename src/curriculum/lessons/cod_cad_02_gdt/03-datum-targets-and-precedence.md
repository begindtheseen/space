---
id: l03-datum-targets-and-precedence
title: Datum targets and datum precedence
minutes: 20
covers:
  - Datum targets and datum precedence
---

Try to set a loaf of homemade bread on a cutting board so it sits the same way every time. It is lumpy. Put it down twice and it rocks onto a different lump each time. But push three toothpicks into the board and rest the loaf on those, and it lands in the same place every time, because now *you* chose the three spots it touches.

That is a **datum target**: instead of letting a whole rough surface decide where it rests, the drawing names a few exact spots to touch. Last lesson, datum A was a nice machined face that rested on a surface plate. Plenty of real parts do not have one — a rough metal casting, a bent sheet, a huge thin panel. Datum targets are how GD&T handles them.

The second half of this lesson settles a question the last two lessons kept raising: does the *order* of the datums really matter? It does. You will seat the same part two ways, measure the same hole, and watch it pass one way and fail the other.

## When a whole surface cannot be a datum

A machined face is flat to a few hundredths of a millimeter. Rest it on a granite plate and it finds three high points that are all nearly at the same height. Which three it picks hardly matters.

Other surfaces are not like that:

- A **[[casting|casting]]** — a part made by pouring molten metal into a mold — comes out with a rough, wavy skin. Bumps of half a millimeter are normal.
- A **forging** — a part hammered or pressed into shape while hot — has similar rough, uneven surfaces before it is machined.
- A **[[thin sheet-metal part|thin-parts]]** or a large, light panel bends under a light push. Seat it on a plate and it takes whatever shape the plate and gravity give it.

Put any of these on a surface plate and the part rests on whichever bumps happen to stick out farthest. A different shop, a different day, a slightly different nudge, and it rests on different bumps. The datum plane moves, and every measurement taken from it moves too.

::: example One bump, two ways to rock
A casting's bottom face is $200\,\mathrm{mm}$ long (side view). It has a bump $0.5\,\mathrm{mm}$ high, $150\,\mathrm{mm}$ from the left end — so $50\,\mathrm{mm}$ from the right end. A boss (a raised round pad) sits $100\,\mathrm{mm}$ above the face. The part is set on a surface plate. [[See the two rocking positions|bump-rock]].

**Rocked onto the left end and the bump.** The face tilts by the bump height over the distance between the two contacts: $0.5 / 150 = 0.00333$. The boss, $100\,\mathrm{mm}$ up, swings sideways about $100 \times 0.00333 = 0.333\,\mathrm{mm}$.

**Rocked onto the right end and the bump.** Now the two contacts are only $50\,\mathrm{mm}$ apart: $0.5 / 50 = 0.01$. The boss swings $100 \times 0.01 = 1\,\mathrm{mm}$ — and in the *opposite* direction, because the part leans the other way.

**The spread.** From one rest to the other the boss moves $0.333 + 1 = 1.33\,\mathrm{mm}$.

**Sanity check.** The right-hand rest tilts three times as much ($150 / 50 = 3$), and $1 / 0.333 = 3$. A spread of well over a millimeter from a half-millimeter bump makes the setup useless for measuring anything toleranced in tenths.
:::

## Datum targets: points, lines and areas

The cure is to stop touching the whole surface. The drawing names a few specific places on it, and only those places touch the fixture. Each one is a **datum target**, and it comes in three kinds:

- A **point target** — contact at a single point. On the drawing it is an X.
- A **line target** — contact along a line, such as the edge of a thin plate. It is drawn as an X in the view that sees it end-on, and as a dashed-looking **phantom line** (long dash, two short dashes) in the view that sees it lying along the surface.
- An **area target** — contact over a small patch, often a circle a few millimeters across. It is drawn as a patch outlined with a phantom line and filled with thin slanted lines.

Each target is labeled with a **[[datum target symbol|target-symbol]]**: a circle split in half by a horizontal line. The bottom half names the target — A1, A2, A3 are the three targets that make datum A. The top half gives the size of an area target (for example ⌀8 for an $8\,\mathrm{mm}$ circle) and is left empty for a point or a line. A leader line runs from the symbol to the target. The target's location is given with basic dimensions — exact numbers in boxes, from last lesson — because the fixture must put its contact exactly there.

The 3-2-1 rule still holds. Datum A (primary) usually has three targets, A1, A2 and A3. Datum B (secondary) has two, B1 and B2. Datum C (tertiary) has one, C1. The datum plane A passes through the three A targets; nothing else on that face matters.

In the fixture, each target becomes a small piece of hardware — a **[[target pin|target-pins]]**. A point target becomes a pin with a rounded tip. A line target becomes a pin with a knife edge or a round side. An area target becomes a pin with a small flat end of the stated size. The pins stick up, so the rest of the rough surface hangs in the air above the fixture and never touches it.

::: key Datum targets
When a whole surface is too rough, uneven or flexible to seat reliably (castings, forgings, thin parts), the drawing designates datum targets: points (shown as X), lines (X plus a phantom line) or small areas (hatched, with a size), located by basic dimensions and labeled A1, A2, A3 and so on. Only the targets touch the simulator.
:::

Back to the lumpy casting. With A1 near the left end and A2 near the right end (and A3 off to the side in three dimensions), the fixture pins hold the face up by the target spots. The bump in the middle hangs over empty space. Every shop puts the part on the same spots, so every shop builds the same datum plane.

::: warning Put targets where the surface stays put
A target must sit on a spot that exists on the finished part and is not about to be cut away, painted thickly or bent. Targets should also be spread far apart: three A targets bunched in one corner define a plane that wobbles with every tiny bump under them, exactly the short-base problem from last lesson.
:::

Targets are the usual way a raw casting gets its very [[first machining setup|first-op]]. The casting is held on its targets while the first faces and holes are machined. After that, those new machined faces are good enough to be datums themselves for the later operations and for inspection.

## Datum precedence: the order is part of the requirement

Now the second idea. A feature control frame lists datums in a fixed order: primary, secondary, tertiary. That order is called **datum precedence**. You already know what it means physically: the primary datum is seated first and gets three points of contact; the secondary is seated next and gets two; the tertiary gets one.

Here is why that matters. On a real part, the datum features are never exactly square to each other. So they cannot *all* get their full contact. Whichever surface goes first sits flat on its simulator. The second one then touches only where the first one allows it to. The first surface wins every argument.

Think of hanging a picture frame whose bottom edge is not quite square to its side. If you rest the bottom edge on a shelf first, the frame sits level and its side leans a little away from the wall. If you press the side flat against a wall first, the side is straight up and the bottom edge sits crooked on the shelf, touching at one corner. Same frame, two different poses. Which one you get depends only on which surface you pushed first.

::: example The same hole, measured two ways
A block's bottom face (datum feature A) is straight. Its left face (datum feature B) leans outward: the top of the left face, $50\,\mathrm{mm}$ up, sits $0.2\,\mathrm{mm}$ farther left than the bottom corner. The bottom face is $100\,\mathrm{mm}$ long. A hole is drilled exactly $40.00\,\mathrm{mm}$ to the right of the bottom corner and $30.00\,\mathrm{mm}$ up. Its basic location is $40$ from B and $30$ from A, and it carries position $\varnothing\,0.5$. [[See both setups|two-setups]].

**Setup 1: A primary, B secondary.** The bottom face sits flat on the table. A wall slides in from the left until it touches the left face's farthest-out point: the top corner, $0.2\,\mathrm{mm}$ left of the bottom corner.

- From the wall: $40.00 + 0.20 = 40.20\,\mathrm{mm}$. Up from the table: $30.00\,\mathrm{mm}$.
- Miss: $0.20$ across, $0$ up. As a zone diameter: $2 \times 0.20 = 0.40\,\mathrm{mm}$.
- $0.40 < 0.5$: **pass**.

**Setup 2: B primary, A secondary.** Now the left face goes flat against the wall first. To stand it straight up, the block must tip by the lean divided by the height: $0.2 / 50 = 0.004$. Tipping moves every point a little. For small tilts, a point at height $h$ slides right by about $h \times 0.004$, and a point $d$ along the bottom drops by about $d \times 0.004$.

- The bottom face now slopes down to the right. Its far end drops $100 \times 0.004 = 0.4\,\mathrm{mm}$ below the corner. The table rises until it touches that lowest point.
- The hole slides right $30 \times 0.004 = 0.12\,\mathrm{mm}$, so it is $40.12\,\mathrm{mm}$ from the wall.
- The hole drops $40 \times 0.004 = 0.16\,\mathrm{mm}$, to $29.84\,\mathrm{mm}$ above the corner's height. The table is $0.40$ below the corner, so the hole is $29.84 + 0.40 = 30.24\,\mathrm{mm}$ above the table.
- Miss: $0.12$ across, $0.24$ up. Distance: $\sqrt{0.12^2 + 0.24^2} = \sqrt{0.072} = 0.268\,\mathrm{mm}$. As a zone diameter: $2 \times 0.268 = 0.537\,\mathrm{mm}$.
- $0.537 > 0.5$: **fail**.

**Sanity check.** Nothing about the part changed; only the order did. In setup 1 the whole lean shows up as a sideways miss. In setup 2 the lean is "used up" standing B upright, and it reappears as a tilt of A, and the hole is far from the low corner, so the tilt pushes it up. (An exact rotation, done by computer, gives $0.536$ instead of $0.537$ — the small-tilt shortcut is excellent here.)
:::

::: note Why tipping moves points by distance times tilt
Picture the block turning around its bottom-left corner, like a door on a hinge. A point far from the hinge travels farther than a point near it. For a small turn, the distance a point travels is its distance from the hinge times the tilt, when the tilt is written as a slope (millimeters of sideways shift per millimeter of distance). The tilt here is $0.2$ over $50$, a slope of $0.004$.

Which way does each point go? The turn swings the top of the block to the right, so points *above* the hinge go right. It also swings the right end of the block downward, so points *to the right* of the hinge go down. A point that is both up and to the right, like the hole, does both. That is the whole calculation. Later modules call this a small-angle rotation, and use it for tilted star trackers and wobbling thrusters.
:::

::: key Why datum precedence matters
It determines the order in which the part is seated, and therefore which surface dominates. Swapping primary and secondary changes the measured result on the same physical part, which is why the order is part of the specification.
:::

::: warning Do not swap datums because the setup is easier
An inspector who seats B first because the fixture happens to have a wall handy is not measuring the drawing's requirement. The same goes for a [[CMM program|cmm-order]] that fits the datum planes in the wrong order. Both can pass bad parts or fail good ones. If the order on the drawing looks wrong, ask the designer to change the drawing; do not quietly change the setup.
:::

How does a designer pick the order? The same way as last lesson: copy the assembly. The primary is the surface the part is clamped down on in the vehicle, because that is the surface that really sets its orientation. The secondary is whatever locates it next, usually a hole with a pin or an edge against a shoulder, and the tertiary stops the last spin. When the order matches how the part is really held, the measurement predicts how it will really behave.

## Check yourself

::: check
Give two kinds of part where a whole surface makes a poor datum, and say what goes wrong in each.
:::

::: answer
A casting or forging: its surface is rough and wavy, so on a plate it rests on whichever bumps stick out farthest, and that changes from setup to setup. A thin sheet-metal part or large light panel: it bends, so its shape on the plate depends on how it is pushed and supported. In both, the datum plane — and every measurement taken from it — moves around. Datum targets fix both by naming the exact spots that touch.
:::

::: check
A datum target symbol shows ⌀6 in its top half and B2 in its bottom half. What does it tell you?
:::

::: answer
It is the second target of datum B. The ⌀6 in the top half means it is an area target: a circular patch $6\,\mathrm{mm}$ across. In the fixture it becomes a pin with a flat $6\,\mathrm{mm}$ end, placed at the target's basic location. Since B is usually secondary, there should be a B1 as well, making two targets for two points of contact.
:::

::: check
How many targets would you expect for a primary, a secondary and a tertiary datum made entirely of targets, and why those numbers?
:::

::: answer
Three for the primary (A1, A2, A3), two for the secondary (B1, B2) and one for the tertiary (C1). It is the 3-2-1 rule again: three points fix a plane and remove three degrees of freedom, two points fix a line in that plane and remove two more, and one point removes the last one.
:::

::: check
In the two-setups example, what if the hole had been drilled at $5\,\mathrm{mm}$ up instead of $30$, still $40$ across? Work out the setup-2 miss with the small-tilt shortcut.
:::

::: answer
The tilt is still $0.004$. Across: the hole slides right $5 \times 0.004 = 0.02\,\mathrm{mm}$, so it is $40.02$ from the wall — a miss of $0.02$. Up: it drops $40 \times 0.004 = 0.16$ below the corner's height, landing at $4.84$, and the table is $0.40$ below the corner, so it is $4.84 + 0.40 = 5.24$ above the table — a miss of $0.24$. Distance: $\sqrt{0.02^2 + 0.24^2} = 0.241\,\mathrm{mm}$, zone diameter $0.482\,\mathrm{mm}$. That passes $\varnothing\,0.5$, but barely. A hole close to datum A barely slides sideways, but the tilted table still lifts it.
:::

::: check
A friend says: "Primary, secondary, tertiary is just the order the letters are written. The part is the same, so the measurement is the same." What would you tell them?
:::

::: answer
The order is how the part is physically seated. Real datum features are never exactly square to each other, so they cannot all get full contact at once. The first gets full contact and the later ones touch only where the first allows. Change the order and the part sits in a slightly different pose, so the same hole is measured from different planes — in the example, $0.40$ in one order and about $0.54$ in the other, a pass and a fail.
:::

## Summary

| Idea | Meaning | Fact to carry |
| --- | --- | --- |
| Datum target | named spot on a surface that touches the fixture | used on castings, forgings, thin parts |
| Point, line, area target | X; X plus phantom line; hatched patch with a size | located by basic dimensions |
| Target symbol | circle split in two | top: area size; bottom: letter and number, like A1 |
| Target counts | three, two, one | the 3-2-1 rule again |
| Datum precedence | the order datums are seated | primary gets full contact and dominates |
| Swapping primary and secondary | same part, different pose | a different measured result |
| Small-tilt shift | how far a point moves when the part tips | distance times tilt |

Next lesson starts on the controls themselves, with the four that need no datums at all: flatness, straightness, circularity and cylindricity.

::: context casting Made by pouring
In **casting**, liquid metal is poured into a mold shaped like the part and left to harden. Sand molds are cheap and good for big, complex shapes, but they leave a grainy surface. Molds also need gentle slopes, called draft, so the part or the pattern can be pulled out, so a cast "flat" face is often slightly slanted too. Rocket engines and pumps use castings and forgings for complicated housings. The important surfaces are machined afterwards; the rest stays rough.
:::

::: context thin-parts Parts that sag and spring
A thin sheet-metal bracket or a big lightweight panel is stiff enough in the vehicle, where it is bolted to other structure, but floppy on its own. Laid on a table it sags; pressed at one corner it springs. Datum targets on such parts often become a set of supports and clamps at exact places, so the part is held in a shape close to how it will be installed. Lesson 10 returns to this under the name free-state variation.
:::

::: context bump-rock One bump, two rests
Side view of the casting from the first example, with the bump drawn far bigger than half a millimeter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="80" x2="170" y2="80" stroke="#6c7a93" stroke-width="3"/>
  <polygon points="20,80 139,67 135,29 16,42" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="103,71 116,69 110,80" fill="#b4232c"/>
  <text x="90" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">on left end and bump</text>
  <text x="90" y="114" font-size="11" text-anchor="middle" fill="#1d6fd1">small tilt</text>
  <line x1="190" y1="80" x2="350" y2="80" stroke="#6c7a93" stroke-width="3"/>
  <polygon points="216,42 330,80 342,44 228,6" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="295,68 308,73 302,80" fill="#b4232c"/>
  <text x="270" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">on bump and right end</text>
  <text x="270" y="114" font-size="11" text-anchor="middle" fill="#b4232c">three times the tilt</text>
  <text x="180" y="150" font-size="11" text-anchor="middle" fill="#1f2a44">red: the same 0.5 mm bump, 150 mm from the left end</text>
  <text x="180" y="168" font-size="11" text-anchor="middle" fill="#6c7a93">tilt drawn exaggerated</text>
</svg>
```

Contacts $150\,\mathrm{mm}$ apart on the left, only $50\,\mathrm{mm}$ apart on the right: three times the tilt.
:::

::: context target-symbol How targets look on a drawing
From left: the target symbol for area target A1 ($8\,\mathrm{mm}$ circle), the X of a point target, and the hatched patch of an area target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="70" cy="70" r="34" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="36" y1="70" x2="104" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="54" cy="52" r="6" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="47" y1="60" x2="61" y2="44" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="58" font-size="14" text-anchor="middle" fill="#1f2a44">8</text>
  <text x="70" y="92" font-size="15" text-anchor="middle" fill="#1f2a44">A1</text>
  <text x="70" y="126" font-size="11" text-anchor="middle" fill="#6c7a93">top: size</text>
  <text x="70" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">bottom: name</text>
  <line x1="165" y1="58" x2="189" y2="82" stroke="#b4232c" stroke-width="3"/>
  <line x1="189" y1="58" x2="165" y2="82" stroke="#b4232c" stroke-width="3"/>
  <text x="177" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">point target</text>
  <circle cx="285" cy="70" r="24" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="10 3 3 3"/>
  <line x1="268" y1="57" x2="281" y2="47" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="264" y1="69" x2="291" y2="47" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="265" y1="80" x2="301" y2="51" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="270" y1="88" x2="306" y2="59" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="279" y1="93" x2="308" y2="70" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="292" y1="93" x2="304" y2="83" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="285" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">area target</text>
</svg>
```

A leader line would run from the symbol to the X or the patch it names.
:::

::: context target-pins Pins that stand in for targets
A datum target fixture is a plate with hardened pins sticking up at the target locations, each built to match its target: a ball-shaped tip for a point, a sharp or rounded edge for a line, a flat end of the right diameter for an area. The pins stand tall enough that the rough surface between them never touches anything. Because the pins are placed by the same basic dimensions as the targets, the machine shop and the inspection lab can each build a fixture from the drawing alone, and still seat the part the same way.
:::

::: context first-op The first cut on a rough part
A raw casting has no good surfaces yet, so its first machining operation has to hold it by its rough skin. Clamping it on its datum targets makes that first setup repeatable. The first operation usually machines a flat face and a hole or two. From then on, those clean machined features become the datums for everything else, because they are far more accurate than the rough skin. Designers plan this chain on purpose.
:::

::: context two-setups Seat A first, or seat B first
The lean is drawn hugely exaggerated. Left: A flat on the table, the wall touches B only at its top corner. Right: B flat against the wall, the table touches A only at its far corner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="170" y2="150" stroke="#6c7a93" stroke-width="4"/>
  <line x1="22" y1="40" x2="22" y2="150" stroke="#6c7a93" stroke-width="4"/>
  <polygon points="40,148 160,148 160,58 24,58" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="88" cy="112" r="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="95" y="172" font-size="11" text-anchor="middle" fill="#1f2a44">A first: pass (0.40)</text>
  <line x1="200" y1="160" x2="350" y2="160" stroke="#6c7a93" stroke-width="4"/>
  <line x1="202" y1="40" x2="202" y2="160" stroke="#6c7a93" stroke-width="4"/>
  <polygon points="204,122 323,160 323,70 204,32" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="252" cy="101" r="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="275" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">B first: fail (0.54)</text>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">grey: table (A) and wall (B)</text>
</svg>
```

In each setup the first surface lies fully flat, and the second touches at a single corner.
:::

::: context cmm-order The order in software
A coordinate measuring machine probes many points on each datum feature and then builds the datum reference frame in software. The programmer tells it which feature is primary, secondary and tertiary, and it fits them in that order: the primary plane first, the secondary constrained to be perpendicular to it, and so on. Enter the order wrong and the software cheerfully reports numbers for a different requirement. Lesson 11 looks at how GD&T maps onto a CMM program.
:::
