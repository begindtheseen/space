---
id: l07-parametric-sketches
title: Parametric sketches and constraints
minutes: 21
covers:
  - 'Parametric feature-based modelling: sketches, constraints, fully defined sketches'
---

Imagine building a model house out of drinking straws and pipe cleaners. At first the straws flop around. Twist a pipe cleaner around two straw ends and they stay joined. Tape one straw flat to the table and it can no longer tip. Tie a string of exactly the right length from corner to corner and the shape can no longer lean. Every tie takes away one way the model could wobble. When nothing can wobble anymore, the shape is locked.

That is what a sketch in a 3D CAD program is: a flat drawing whose lines start out floppy, and which you lock into place with rules. The first six lessons of this module were about AutoCAD, where you place each line at exact coordinates and it stays there because you put it there. Mechanical CAD for flight hardware works differently. You draw roughly, then you *tell* the program what must be true — this line is horizontal, this circle sits in the middle, this edge is 60 mm long — and it moves the geometry until every rule holds. Change a rule and the shape follows.

This lesson teaches that way of working, which is called **parametric feature-based modelling** — building a solid from a list of steps (features), each driven by numbers and rules you can change later. It is how Siemens NX, CATIA, Creo, SolidWorks and Onshape all work. By the end you will be able to count exactly how much freedom a sketch has left, and say why a sketch with any freedom left is a defect.

## From drawing lines to stating rules

In AutoCAD a line from $(0,0)$ to $(60,0)$ is just that line. If the part gets longer, you erase and redraw, or stretch it by hand, and every related line has to be fixed by hand too.

A **parametric** model stores the *reasons* instead. A **parameter** is a number the model is built from and that you are allowed to change, like the width of a plate. The software keeps a small list of rules and parameters, and each time something changes it re-solves the whole shape. The part of the program that does the re-solving is called the **[[constraint solver|constraint-solver]]** — the maths engine that finds positions for every point so that all the rules are true at once.

The model is then built up as a series of **features** — single modelling steps like "push this sketch 6 mm up into a solid" or "cut this hole through". The next lesson covers the features themselves. This lesson is about what almost every feature starts from: the sketch.

## Sketches live on planes

A **sketch** is a flat, two-dimensional drawing made on a plane inside the 3D model. It is the outline a feature uses — the cookie-cutter shape before it is pushed into dough.

Every new part starts with an **origin** — the point $(0,0,0)$ — and three **default planes** through it, at right angles to each other. Onshape calls them Top, Front and Right. SolidWorks uses the same three names. NX calls them the XY, YZ and XZ datum planes. You pick a plane, open a sketch on it, and draw in 2D, with the origin shown as a point you can attach geometry to.

You can also sketch on a flat face of a solid you have already built, or on a new plane you create, such as a plane 20 mm above Top. Which one you choose matters a great deal for how the model behaves later. Lesson 9 is about exactly that choice.

## Two kinds of constraint

A **constraint** is a rule the sketch must obey. There are two families.

### Geometric constraints

A **geometric constraint** fixes a relationship — a shape fact with no number in it. These are the common ones, with the icon names you will see in Onshape and SolidWorks:

- **Coincident** — two points sit on top of each other, or a point lies on a line or curve. It is how the corners of a shape are joined.
- **Horizontal** and **vertical** — a line lies along the sketch's x axis or y axis. Also works on two points (they share a y or an x).
- **Parallel** — two lines point the same way.
- **Perpendicular** — two lines meet at a right angle ($90^\circ$).
- **Tangent** — a line and an arc (or two arcs) [[touch smoothly|tangent-corner]], with no corner, like a road that curves off a straight.
- **Concentric** — two circles or arcs share the same center.
- **Equal** — two lines have the same length, or two circles the same radius.
- **Symmetric** — two points (or lines) are mirror images across a chosen line.
- **Fix** — pin something where it is right now, so it cannot move at all.

### Dimensional constraints

A **dimensional constraint**, or **driving dimension**, is a rule with a number in it: this line is $60\,\mathrm{mm}$ long, this circle is $6.6\,\mathrm{mm}$ across, these two lines are $30^\circ$ apart, this hole center is $15\,\mathrm{mm}$ from the origin. Change the number and the geometry moves. That is the whole point: the dimension *drives* the shape.

A dimension can also be an equation. You can name the width `W` and set the hole spacing to `W - 20`. Onshape calls named numbers **variables**. SolidWorks calls them global variables and equations. NX calls them **[[expressions|expressions]]**.

::: warning Do not reach for Fix
Fix feels like a shortcut: the sketch looks right, so pin it. But Fix locks geometry to wherever it happened to land, which is usually a number like $41.37\,\mathrm{mm}$ that nobody chose. It records *no reason*. When the part changes, a fixed line stays put while everything around it moves. Tie geometry to the origin and to other geometry with real constraints and dimensions instead. Use Fix only on imported reference geometry you truly never want to move.
:::

## Counting degrees of freedom

Here is the idea that makes the whole topic precise. A **[[degree of freedom|dof-bridge]]** (DOF) is one independent way something can still move or change. Count them before any rules, subtract what each rule removes, and you know exactly how floppy the sketch is.

### How much freedom each shape has

In a flat sketch, a **point** has 2 DOF: it can slide left–right ($x$) and up–down ($y$).

A **line segment** has two endpoints, and each endpoint has 2 DOF, so a line segment has $2 + 2 = 4$ DOF. You could also describe it as: where it is ($x$ and $y$ of one end), which way it points (an angle), and how long it is. That is again 4 numbers — the count does not depend on how you describe it.

A **circle** has 3 DOF: the $x$ and $y$ of its center, and its radius.

An **arc** has 5 DOF: the center ($x$, $y$), the radius, and the angles where it starts and stops.

::: key Degrees of freedom in a sketch
In 2D: a point has 2 DOF, a line segment 4, a circle 3, an arc 5.
Remaining DOF = (total DOF of all the geometry) − (DOF removed by independent constraints).
:::

### How much each rule removes

Each constraint removes a fixed amount of freedom:

| Constraint | DOF removed |
|---|---|
| Coincident, point on point | 2 |
| Coincident, point on a line or curve | 1 |
| Horizontal or vertical (one line) | 1 |
| Parallel, perpendicular, tangent | 1 |
| Equal | 1 |
| Concentric | 2 |
| Symmetric (two points about a line) | 2 |
| Fix | all of that item's DOF |
| One driving dimension | 1 |

Why does point-on-point remove 2? Because it is really two equations: the $x$ values match *and* the $y$ values match. A point that only has to lie somewhere on a line can still slide along it, so only 1 is gone.

::: example A plate with one hole, counted
You sketch the outline of a small mounting plate: a rectangle $60\,\mathrm{mm}$ wide and $40\,\mathrm{mm}$ tall, with one hole $6.6\,\mathrm{mm}$ across. (A $6.6\,\mathrm{mm}$ hole is a common [[clearance hole|clearance-hole]] for an M6 bolt.) Count the freedom as you add rules.

**Start.** Four line segments and one circle: $4 \times 4 + 3 = 16 + 3 = 19$ DOF.

**Join the corners.** Four point-on-point coincidents, one at each corner, remove $4 \times 2 = 8$. The rectangle now has $16 - 8 = 8$ DOF — which makes sense: it is really four corner points, and $4 \times 2 = 8$.

**Square it up.** Two horizontal and two vertical constraints remove $4$. Now $8 - 4 = 4$ DOF are left. What are they? The rectangle can still slide left–right, slide up–down, get wider and get taller. Four.

**Size it.** A $60\,\mathrm{mm}$ width and a $40\,\mathrm{mm}$ height remove 2. Left: $4 - 2 = 2$ — it can still slide around.

**Anchor it.** Make the bottom-left corner coincident with the origin: $-2$. The rectangle has $2 - 2 = 0$ DOF.

**The hole.** Dimension its center $15\,\mathrm{mm}$ from the left edge and $20\,\mathrm{mm}$ from the bottom edge ($-2$), and give it a $6.6\,\mathrm{mm}$ diameter ($-1$). The circle's $3$ DOF are gone.

**Total removed:** $8 + 4 + 2 + 2 + 3 = 19$. Remaining: $19 - 19 = 0$. The sketch is locked.

Sanity check: every number you would need to machine this plate — width, height, hole position, hole size — appears exactly once. Nothing is missing, nothing repeated.
:::

::: note Why a line has four and not two
You might think "a line is one thing, so maybe it has one freedom". Try it with a pencil on a desk. You can slide it sideways, slide it forward, spin it, and — if it were a stretchy line — change its length. Those are four separate moves; none of them can be made out of the others. The endpoint description gives the same count: each end is a point with its own $x$ and $y$, and $2 + 2 = 4$. Two honest descriptions giving the same number is a good sign the count is right.
:::

## Fully defined, under-defined, over-defined

Now the three words every CAD reviewer uses.

A sketch is **fully defined** when it has exactly 0 DOF left: every point's position follows from the rules. A sketch is **under-defined** when some DOF are left: part of it can still be dragged. A sketch is **over-defined** when you have added more rules than the geometry has freedom, so at least one rule is repeated or fights another.

The software tells you which you have. In SolidWorks and Onshape, under-defined sketch geometry is drawn in blue and fully defined geometry turns black. Over-defined or conflicting constraints are shown in red. SolidWorks writes the status in the bottom bar, and NX reports how many constraints the sketch still needs. The habit to build: drag a line. If it moves, the sketch is not done.

Why does this matter so much? Because an [[under-defined sketch|latent-defect]] still builds. The part looks perfect on screen today. The loose geometry only moves later — when someone changes an unrelated dimension and the solver picks a different answer, or when the file is reopened and re-solved.

::: key Why a sketch must be fully defined
An under-defined sketch has unconstrained degrees of freedom, so geometry can move when an unrelated dimension changes or when the file is reopened. It is a latent defect, and most companies treat it as a review failure.
:::

### What over-defined looks like

Take the rectangle from the example. It already has horizontal and vertical constraints on all four sides, so the top and bottom edges *must* be the same length. Now add a second $60\,\mathrm{mm}$ dimension on the top edge as well as the bottom. That dimension removes no freedom — there was none left for it to remove. The solver flags it as **redundant**.

If the two dimensions disagree — bottom $60$, top $62$ — no rectangle can satisfy both, and the solver flags a **conflict**. Either way the fix is the same: delete the extra rule. If you want to *see* a number without it driving anything, most programs let you turn a dimension into a **reference dimension** (also called driven): it reports the value but removes no freedom.

::: warning Zero left does not always mean done
The arithmetic "total minus removed" only counts **independent** constraints. If you added a redundant rule, the subtraction can reach zero while one real freedom is still loose, because the redundant rule removed nothing. Trust the software's status, drag-test the sketch, and look for red.
:::

::: example An L-shaped bracket profile
Here is a profile you will meet again: the side view of an L bracket. It has six straight edges, all horizontal or vertical. Its overall width is $80\,\mathrm{mm}$, its height $50\,\mathrm{mm}$, and each leg is $6\,\mathrm{mm}$ thick.

**Start.** Six lines: $6 \times 4 = 24$ DOF.

**Join the six corners.** $6 \times 2 = 12$ removed, leaving $24 - 12 = 12$. (Check: six corner points, $6 \times 2 = 12$.)

**Horizontal or vertical on each edge.** $6$ removed, leaving $12 - 6 = 6$.

**Four dimensions.** Overall width $80$, overall height $50$, horizontal leg thickness $6$, vertical leg thickness $6$: $4$ removed, leaving $6 - 4 = 2$.

**Anchor the outside corner to the origin.** $2$ removed, leaving $0$. Fully defined.

Now a tempting extra: dimension the *inside* of the horizontal leg too. Its length is already forced, $80 - 6 = 74\,\mathrm{mm}$, by the width and the thickness. Adding it makes the sketch over-defined. If the part must be $74\,\mathrm{mm}$ inside because something slides in there, dimension *that* and delete the overall width instead — and you have made a choice about what matters most, which is exactly the subject of lesson 9.
:::

## A good sketching routine

Experienced modellers follow the same order every time.

1. **Pick the plane on purpose**, usually one of the default planes through the origin.
2. **Draw the rough shape**, roughly the right size, so the solver does not have to flip anything inside out.
3. **Add geometric constraints first** — coincident, horizontal, vertical, tangent, symmetric. They carry the shape rules.
4. **Tie the sketch to the origin** or to the default planes, with a coincident or a symmetric constraint about the origin.
5. **Add dimensions last**, one per real design number, biggest first so the sketch does not twist.
6. **Check it is fully defined**: the status says so, everything is black, and dragging moves nothing.

A small tip that matters: if the part is symmetric — a bracket with two matching holes, say — make it symmetric about the origin with a **symmetric** constraint, rather than dimensioning both sides separately. The rule "these holes are mirror images" is then written into the model, not just true by accident of the numbers.

## Practising in Onshape

You do not need an expensive licence to learn this. **[[Onshape|onshape]]** is a full parametric CAD program that runs in a web browser, with no install. It has a free plan for hobbyists and students, and its free Learning Center teaches the basics step by step. The one catch on the free plan is that your documents are public, which is fine for practice parts and not fine for anything real. The skills carry straight over to NX, SolidWorks and the rest: the menus differ, the constraint ideas are identical.

A first exercise: open a new Part Studio, sketch on the Top plane, draw a rectangle from the origin, add the $60$ by $40$ dimensions, add a circle and dimension it, and watch the geometry go from blue to black. Then change $60$ to $90$ and watch the whole thing obey.

## Check yourself

::: check
How many degrees of freedom does a sketch have before any constraints if it contains three line segments and two circles?
:::

::: answer
Each line segment has 4 DOF and each circle has 3. So $3 \times 4 + 2 \times 3 = 12 + 6 = 18$ DOF.
:::

::: check
A circle is made concentric with the origin point. How many DOF does it have left, and what one constraint would finish it?
:::

::: answer
A circle starts with 3 DOF: center $x$, center $y$ and radius. Concentric with a point removes 2 (both center coordinates), leaving $3 - 2 = 1$: the radius. A diameter (or radius) dimension removes that last one, and the circle is fully defined.
:::

::: check
Two line segments share one endpoint through a point-on-point coincident. One is horizontal and $30\,\mathrm{mm}$ long; the other is perpendicular to it and $20\,\mathrm{mm}$ long. How many DOF are left, and what are they?
:::

::: answer
Start: $2 \times 4 = 8$. Coincident removes 2, horizontal 1, perpendicular 1, and the two lengths 2 more: $2 + 1 + 1 + 2 = 6$. Left: $8 - 6 = 2$. Those are the $x$ and $y$ of the whole shape — it can still slide around the sketch as a rigid corner. Making the shared corner coincident with the origin would remove them.
:::

::: check
A colleague says, "My sketch is under-defined, but the part looks exactly right, so it doesn't matter." What would you tell them?
:::

::: answer
Looking right today is not the test. The free degrees of freedom mean the solver is choosing some positions on its own. When another dimension changes, or the file is re-solved on reopening, it can pick different positions, and the part changes without anyone deciding it should. That hidden risk is why a fully defined sketch is a review requirement, not a matter of taste.
:::

::: check
A rectangle already has coincident corners, two horizontal and two vertical constraints, a width, a height, and a corner on the origin. You add an equal constraint between the left and right sides. What happens, and why?
:::

::: answer
The sketch becomes over-defined. The horizontal and vertical constraints already force the left and right sides to be the same length, and the sketch already had 0 DOF. The equal constraint has no freedom left to remove, so the software flags it as redundant. Delete it.
:::

## Summary

| Idea | Meaning | Number to remember |
|---|---|---|
| Sketch | 2D profile on a plane or flat face | Starts every extrude, revolve, cut |
| Geometric constraint | A shape rule with no number | Coincident, horizontal, vertical, parallel, perpendicular, tangent, concentric, equal, symmetric, fix |
| Dimensional constraint | A rule with a number that drives the shape | Removes 1 DOF each |
| Point, line, circle, arc | Freedom before rules | 2, 4, 3, 5 DOF |
| Remaining DOF | Total DOF minus independent constraints | 0 means fully defined |
| Under-defined | Some geometry can still move | Latent defect, review failure |
| Over-defined | A rule is redundant or conflicting | Shown in red; delete the extra rule |
| Onshape | Free, browser-based parametric CAD | Free-plan documents are public |

A fully defined sketch is only a flat outline. The next lesson turns sketches into solids with features — extrude, revolve, sweep, loft, shell and the rest — and shows where each one appears on real spacecraft hardware.

::: context constraint-solver The maths engine under the sketch
Every rule you add turns into an equation. Horizontal says two $y$ values are equal. A $60\,\mathrm{mm}$ dimension says the distance between two points is $60$. Tangent and perpendicular become equations with angles in them. The solver collects them all and finds the $x$ and $y$ of every point that make them true at once, starting from where you roughly drew things.

Most commercial CAD programs do not write their own solver. Siemens sells a solver component that many of them license. That is part of why constraints behave so alike from one program to another.
:::

::: context tangent-corner Smooth join versus sharp corner
Tangent means the line and the arc point the same way at the spot where they meet, so a pencil tracing along never has to turn suddenly. Without tangent, the join is a kink.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M20,110 L100,110 A50,50 0 0,0 150,60" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="100" cy="110" r="4" fill="#1f2a44"/>
  <text x="85" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">tangent: smooth</text>
  <path d="M200,110 L280,110 L330,60" fill="none" stroke="#b4232c" stroke-width="3"/>
  <circle cx="280" cy="110" r="4" fill="#1f2a44"/>
  <text x="275" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">not tangent: a corner</text>
</svg>
```

On real parts, tangent joins avoid sharp corners where stress piles up and where cutters would leave a step.
:::

::: context expressions Numbers with names
Giving a dimension a name like `W` turns a drawing into a small program. If the hole spacing is written as `W - 20`, it can never drift out of step with the width, because it is computed from it. Large aerospace models in NX can hold hundreds of named expressions, some fed from spreadsheets, so one change to a key number — a tank diameter, say — flows to every part built from it.
:::

::: context dof-bridge Where "degree of freedom" comes back
The same counting runs through the whole course. A flat rigid shape in a sketch can slide two ways and spin one way: 3 DOF. A rigid body in space can move along three axes and rotate about three axes: 6 DOF. That is where the name of a "6-DOF simulation" comes from — it tracks all six for a vehicle. Later in this module, the mass properties from your CAD model feed exactly that kind of simulation.
:::

::: context clearance-hole Why the hole is bigger than the bolt
A clearance hole lets a bolt pass through without touching the sides, so the parts can be lined up even when the holes are a little out of place. For an M6 bolt (nominal diameter $6\,\mathrm{mm}$), the common hole sizes in the ISO table are $6.4\,\mathrm{mm}$ (fine), $6.6\,\mathrm{mm}$ (medium) and $7\,\mathrm{mm}$ (coarse). The gap is also what the position tolerances from the GD&T module have to fit inside.
:::

::: context latent-defect A defect that is waiting
"Latent" means present but not yet showing. An under-defined sketch is like a shelf held up by one screw and a lucky fit: it looks fine until someone leans on it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">today</text>
  <rect x="40" y="40" width="100" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="90" cy="70" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">hole looks centred</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">after width 100 → 140</text>
  <rect x="200" y="40" width="140" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="250" cy="70" r="8" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="125" font-size="11" text-anchor="middle" fill="#b4232c">loose hole did not follow</text>
</svg>
```

The hole's position was never tied to anything, so when the plate grew, the solver left it where it was. Nobody chose that; nobody noticed.
:::

::: context onshape A CAD program in a browser tab
Onshape was started by people who had earlier founded SolidWorks, and it is now owned by PTC, the company behind Creo. Everything runs on its servers: the model lives in the cloud, the browser only displays it, and several people can edit the same model at once, a bit like a shared online document. It also keeps a full history of every change automatically. Later in this module you will see it listed with Fusion as the cloud-native newcomers next to the long-established desktop programs.
:::
