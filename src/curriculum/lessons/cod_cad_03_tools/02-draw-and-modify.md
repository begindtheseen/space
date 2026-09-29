---
id: l02-draw-and-modify
title: Drawing and editing shapes
minutes: 21
covers:
  - 'Draw and modify: line, polyline, arc, offset, trim, extend, fillet, array, stretch'
---

Think about cutting out a paper snowflake. You do not draw every tiny notch separately. You fold the paper, make a few cuts, and unfold it — and the pattern repeats itself around the circle. A good drafter works the same way. They draw a few plain shapes, then copy, trim, round and repeat them until the part appears.

That is the rhythm of AutoCAD. A handful of **draw commands** make new geometry: lines, polylines, arcs, circles. A larger set of **modify commands** — commands that change geometry you already have — does most of the work: offset, trim, extend, fillet, array, stretch. Experienced drafters spend more time modifying than drawing. Fewer typed numbers means fewer chances to type one wrong.

Last lesson you learned to place exact points: absolute `x,y`, relative `@dx,dy`, polar `@d<angle`, and object snaps. This lesson turns points into parts. By the end you will draw a real flat part: a small mounting plate of the kind you would find bolted to a ground support frame or a test stand, holding a sensor box or a valve.

## Lines, polylines and arcs

**LINE** (alias `L`) draws straight segments, one after another, until you press Enter. Each segment is its own separate object. A rectangle drawn with LINE is four objects that happen to touch.

**PLINE** (alias `PL`) draws a **[[polyline|polyline-one-object]]** — a chain of straight and curved segments that AutoCAD treats as one single object. Click it and the whole outline lights up. That matters. You can offset a polyline in one step, ask for its area, or round all its corners at once. The RECTANG command draws a rectangle as one closed polyline, too.

A polyline can switch between straight and curved segments as you go. Type `A` at its prompt to start drawing arc segments, and `L` to go back to lines.

```text
Command: PL
Specify start point: 0,0
Specify next point or [Arc/Halfwidth/Length/Undo/Width]: @100,0
Specify next point or [Arc/Close/Halfwidth/Length/Undo/Width]: @0,60
Specify next point or [Arc/Close/Halfwidth/Length/Undo/Width]: @-100,0
Specify next point or [Arc/Close/Halfwidth/Length/Undo/Width]: C
```

To go the other way, EXPLODE breaks a polyline back into separate lines and arcs. JOIN glues touching lines and arcs into one polyline.

**ARC** (alias `A`) draws a piece of a circle. By default you give it three points: start, a point somewhere along the arc, and end. It also has options for building an arc from a start point, a center and an end point, or from an angle or a radius. Pick whichever matches the numbers on your sketch. One habit to know: AutoCAD draws arcs **[[counterclockwise|arc-direction]]** from the start point to the end point. Swap the two points and you get the other side of the circle.

::: key Line, polyline, arc
LINE makes separate segments. PLINE makes one object from many segments, straight or curved, which you can offset, fillet or measure as a whole. ARC draws counterclockwise from start to end by default.
:::

## Offset: a parallel copy at an exact distance

Picture tracing around a cookie cutter with a pencil held a finger's width away. You get the same shape, a little bigger, the same distance out everywhere. That is **OFFSET** (alias `O`): it makes a parallel copy of a line, arc, circle or polyline at an exact distance.

You type the distance, pick the object, then click the side you want the copy on. It repeats until you press Enter, so you can make many copies at the same distance. Offset is how you draw a wall thickness, the inside of a tube, a line of bolt holes a fixed distance from an edge, or the second edge of a slot. Offsetting a circle changes its radius by the distance; offsetting a line keeps its length.

```text
Command: O
Specify offset distance or [Through/Erase/Layer] <1.0000>: 12
Select object to offset or [Exit/Undo] <Exit>: (pick the line)
Specify point on side to offset or [Exit/Multiple/Undo] <Exit>: (click to its right)
```

## Trim and extend: cutting and stretching to a boundary

**TRIM** (alias `TR`) cuts off the part of an object that runs past another object. **EXTEND** (alias `EX`) does the opposite: it lengthens an object until it meets another. The object that does the cutting or stopping is the **boundary**.

In recent versions of AutoCAD, TRIM and EXTEND start in **[[Quick mode|quick-trim]]**. Every object in the drawing counts as a boundary automatically. You click the piece you want gone, and AutoCAD cuts it back to the nearest crossing on each side. With EXTEND you click near the end you want lengthened. Hold Shift while picking inside TRIM and it extends instead; hold Shift inside EXTEND and it trims. The older **Standard mode**, where you first select the cutting edges and then the pieces, is still one option away.

::: warning Trim removes the piece you click, not the piece you keep
Beginners click the part they want to keep and are surprised when it vanishes. Click the part to throw away. If there is no crossing object on one side, Quick mode deletes the whole object, so watch what you pick. Undo (`U`) puts it back.
:::

## Fillet: rounding corners, and the radius 0 trick

A **fillet** is a rounded inside or outside corner. Metal parts need them: sharp inside corners crack under load, and a milling cutter is round, so it cannot cut a perfectly sharp inside corner anyway. The **FILLET** command (alias `F`) takes two objects and joins them with an arc of the radius you set. It trims or extends both objects so they meet the arc exactly.

Set the radius with the `R` option. Use `P` to fillet every corner of a polyline at once. Use `M` (Multiple) to keep filleting without restarting.

Now the trick every drafter uses. Set the radius to **0**. A zero-radius arc has no size, so FILLET trims or extends both lines until they meet in a **sharp, clean corner**. Two lines that stop short of each other, or cross and stick out, become a tidy corner in one step. You can get the same effect for a single pick, without changing your radius, by holding Shift while you pick the second object.

And one more surprise: fillet two **[[parallel lines|fillet-parallel]]** and AutoCAD joins their ends with a half circle whose diameter is the gap between them. The radius setting is ignored. That is a quick way to draw the round end of a slot.

::: key Fillet radius 0
FILLET joins two objects with an arc of the set radius, trimming or extending both to meet it. With radius 0 (or Shift held on the second pick) it makes a sharp corner instead: the fastest way to clean up two lines that overshoot or fall short.
:::

## Array: many copies in a pattern

Bolt holes rarely come alone. **ARRAY** (alias `AR`) makes many copies in a regular pattern, in three flavors:

- **Rectangular** (`ARRAYRECT`) — rows and columns, with a spacing between each. Four bolt holes at the corners of a plate is a 2 by 2 rectangular array.
- **Polar** (`ARRAYPOLAR`) — copies around a center point, spread evenly over a full circle or part of one. Holes on a flange go here.
- **Path** (`ARRAYPATH`) — copies spaced along a line, arc or polyline, like fence posts along a curved road or clamps along a cable run.

By default an array is **[[associative|associative-arrays]]**: the copies stay grouped as one object, and you can later change the count or spacing and they all update. That is powerful, but it also means the copies do not behave like separate objects. The `AS` option turns this off when you want plain, separate copies.

::: key Arrays
Rectangular: rows and columns at a spacing. Polar: copies around a center over a fill angle (360° by default). Path: copies along a line, arc or polyline. Associative arrays stay editable as one object.
:::

## Stretch: moving part of a shape

Suppose the plate needs to be 40 mm longer. You could redraw it. Or you could grab its right-hand end and slide it. **STRETCH** (alias `S`) does that. It moves the parts of objects that sit inside a selection box, and stretches the lines that cross the box's edge so they stay connected.

STRETCH only works with a **[[crossing selection|window-crossing]]** — a box dragged from right to left, which picks up everything it touches, not only what is entirely inside. The rules:

- An endpoint or vertex **inside** the box moves.
- An endpoint **outside** the box stays put.
- So a line with one end inside and one outside gets longer or shorter.
- A circle is never stretched into an oval. It moves if its center is inside the box, and stays put otherwise.

::: warning Stretch needs a crossing box
Drag the selection from left to right and you get a window selection instead, which only picks whole objects. STRETCH then moves those objects instead of stretching anything. Drag right to left, and make sure every vertex you want to move is inside the box — and every vertex you want to stay is outside it.
:::

## A worked drawing

Here is the whole toolkit on one part: a 100 by 60 mm mounting plate with rounded corners, four bolt holes and a slot cut down from the top edge. All sizes are in millimeters, drawn at full size.

::: example The plate, its corners and its holes
**Outline.** Draw the rectangle as a closed polyline, as in the PLINE transcript above. Its corners are $(0,0)$, $(100,0)$, $(100,60)$ and $(0,60)$.

**Corners.** Round all four at once:

```text
Command: F
Select first object or [Undo/Polyline/Radius/Trim/Multiple]: R
Specify fillet radius <0.0000>: 8
Select first object or [Undo/Polyline/Radius/Trim/Multiple]: P
Select 2D polyline: (pick the plate)
4 lines were filleted
```

**Check the outline length.** Each corner fillet removes 8 mm from each of the two edges it joins, so it removes $2 \times 8 = 16$ mm of straight edge. Four corners remove $4 \times 16 = 64$ mm. The four quarter-circles together make one full circle of radius 8, which adds $2\pi \times 8 = 50.27$ mm. So the perimeter is

$$
2(100 + 60) - 64 + 50.27 = 320 - 64 + 50.27 = 306.27\ \mathrm{mm}.
$$

That is a little less than the sharp rectangle's 320 mm, as it should be: a rounded corner is a shortcut across it.

**Holes.** Draw one clearance hole for an M6 bolt, 6.6 mm across, centered 12 mm in from the bottom-left corner: `CIRCLE`, center `12,12`, `D`, `6.6`. Then array it:

```text
Command: ARRAYRECT
Select objects: (pick the circle, then Enter)
Select grip to edit array or [ASsociative/Base point/COUnt/Spacing/COLumns/Rows/Levels/eXit]<eXit>: COL
Enter the number of columns or [Expression] <4>: 2
Specify the distance between columns or [Total/Expression]: 76
Select grip to edit array or [ASsociative/Base point/COUnt/Spacing/COLumns/Rows/Levels/eXit]<eXit>: R
Enter the number of rows or [Expression] <3>: 2
Specify the distance between rows or [Total/Expression]: 36
Specify the incrementing elevation between rows or [Expression] <0>: (Enter)
Select grip to edit array or [ASsociative/Base point/COUnt/Spacing/COLumns/Rows/Levels/eXit]<eXit>: AS
Create associative array [Yes/No] <Yes>: N
Select grip to edit array or [ASsociative/Base point/COUnt/Spacing/COLumns/Rows/Levels/eXit]<eXit>: (Enter)
```

The column spacing is $100 - 12 - 12 = 76$ mm, so the right-hand holes land at $x = 12 + 76 = 88$, which is 12 mm in from the right edge. The row spacing is $60 - 12 - 12 = 36$ mm, putting the top holes at $y = 48$. The four hole centers are $(12,12)$, $(88,12)$, $(12,48)$ and $(88,48)$. Every one is 12 mm from its two nearest edges, which is the symmetry we wanted.
:::

::: example Cutting a slot with offset, extend, fillet and trim
The plate needs a slot 12 mm wide, coming down from the middle of the top edge, with a round bottom.

**One side.** Draw the left side of the slot a little short on purpose: `LINE` from `44,35` to `@0,20`. It ends at $y = 55$, 5 mm below the top edge.

**The other side.** `OFFSET` it by 12 to the right. The copy runs from $(56,35)$ to $(56,55)$. Where does 44 come from? The slot is centered at $x = 50$, and half its width is $12 \div 2 = 6$, so its sides are at $50 - 6 = 44$ and $50 + 6 = 56$.

**Reach the edge.** `EXTEND`, then click near the top end of each line. Each grows 5 mm until it meets the top edge at $y = 60$.

**Round the bottom.** `FILLET`, and pick the two lines near their bottom ends. They are parallel, so AutoCAD joins them with a half circle. Its diameter is the 12 mm gap, so its radius is 6 and its center is at $(50, 35)$. The lowest point of the slot is $35 - 6 = 29$, so the slot is $60 - 29 = 31$ mm deep.

**Open the top.** `TRIM`, and click the short piece of the top edge between $x = 44$ and $x = 56$. It disappears, and the slot is open.

**Sanity check.** Nothing in the slot came from a number typed twice. The width came from one offset, the depth from one line, the round from the gap itself. Change the offset and the fillet follows.
:::

**Stretching it.** Now the plate must grow to 140 mm long, with the holes staying 12 mm from the ends. Run `STRETCH`. Drag a crossing box from right to left, from about $(110, 65)$ to $(70, -5)$. It contains the right edge, both right-hand corner arcs and the two right-hand holes. The slot, at $x = 44$ to $56$, is outside. Pick any base point and type `@40,0`.

The right edge moves to $x = 140$. The two right-hand holes move to $x = 88 + 40 = 128$, which is still 12 mm from the new edge. The top and bottom edges get longer, because one end of each moved and the other did not. The outer outline, measured as before without the slot, grows from 306.27 mm to $306.27 + 2 \times 40 = 386.27$ mm. The slot does not move at all, so its edges add the same length before and after. This is why the holes were made as separate circles: an associative array counts as one object, and stretching half of one does not work like moving two separate holes.

::: example A bolt circle with a polar array
A reaction wheel — a spinning flywheel a spacecraft uses to turn itself — mounts to a test fixture with 6 bolts on a 50 mm **[[pitch circle diameter|bolt-circle]]**, the circle the bolt centers sit on. The first hole is straight above the center.

**Draw one hole.** Put the fixture center at $(0,0)$. The pitch circle radius is $50 \div 2 = 25$, so the first hole's center is at $(0, 25)$.

**Array it.** `ARRAYPOLAR`, pick the hole, center point `0,0`, items 6, fill angle 360. The holes are spaced $360 \div 6 = 60^\circ$ apart, at $90^\circ, 150^\circ, 210^\circ, 270^\circ, 330^\circ$ and $30^\circ$.

**Where they land.** Each center is at $(25\cos\theta,\; 25\sin\theta)$. The one at $150^\circ$ is at $(25 \times (-0.8660),\; 25 \times 0.5) = (-21.65, 12.5)$. The one at $270^\circ$ is at $(0, -25)$, straight below. The full set is $(0, 25)$, $(-21.65, 12.5)$, $(-21.65, -12.5)$, $(0, -25)$, $(21.65, -12.5)$ and $(21.65, 12.5)$.

**Distance between neighbors.** Two holes $60^\circ$ apart on a circle of radius 25 are joined by a chord of length $2 \times 25 \times \sin 30^\circ = 2 \times 25 \times 0.5 = 25$ mm. Sanity check: six equal chords around a circle make a regular hexagon, and a hexagon's side always equals its radius. So 25 is right.
:::

::: note Why the hexagon side equals the radius
Join the center to two neighboring holes. The two lines from the center are both radii, so they are equal, and the angle between them is $60^\circ$. A triangle with two equal sides has equal base angles, and all three angles add to $180^\circ$, so each base angle is $(180 - 60) \div 2 = 60^\circ$. All three angles are $60^\circ$, so the triangle is equilateral, and the chord equals the radius. The general chord formula $2r\sin(\alpha/2)$, where $\alpha$ is the angle between the holes, gives the same thing: $2 \times 25 \times \sin 30^\circ = 25$.
:::

## Check yourself

::: check
You drew a rectangle with LINE and now want to offset its whole outline 5 mm inward in one pick. What goes wrong, and how do you fix it?
:::

::: answer
LINE made four separate objects, so OFFSET copies only the one side you pick. Either redraw the outline with PLINE or RECTANG, or glue the four lines into one polyline with JOIN. Then one pick offsets the whole outline.
:::

::: check
Two lines were meant to meet at a corner, but one stops 3 mm short and the other runs 4 mm past. Which single command and setting fixes both at once?
:::

::: answer
FILLET with radius 0 (or FILLET with Shift held on the second pick). A zero-radius fillet extends the short line and trims the long one until they meet at a sharp corner, in one step.
:::

::: check
Four holes are to sit on the corners of a 70 by 40 mm rectangle of centers, and eight more evenly around a flange. Which kind of array suits each, and what angle separates the flange holes?
:::

::: answer
The four corner holes are a rectangular array: 2 columns 70 mm apart and 2 rows 40 mm apart. The eight flange holes are a polar array around the flange center, spaced $360 \div 8 = 45^\circ$ apart.
:::

::: check
You STRETCH a plate by `@30,0` with a crossing box that contains the right edge and a hole whose center sits inside the box. What happens to the hole, and to a second hole whose outline the box touches but whose center is outside?
:::

::: answer
Circles are never stretched. The first hole's center is inside the box, so the hole moves 30 mm to the right, unchanged in size. The second hole's center is outside, so it stays exactly where it was, even though the box touched its edge.
:::

::: check
In Quick mode TRIM, you click the middle of a line that crosses no other object. What happens?
:::

::: answer
With no crossing object on either side to cut back to, the whole line is deleted. Quick mode removes the piece between the nearest crossings, and here that piece is the entire line.
:::

## Summary

| Command | Alias | What it does |
|---|---|---|
| LINE | L | Separate straight segments |
| PLINE | PL | One object of straight and arc segments |
| ARC | A | Part of a circle, counterclockwise by default |
| OFFSET | O | Parallel copy at an exact distance |
| TRIM, EXTEND | TR, EX | Cut back to, or lengthen to, a boundary; Shift swaps them |
| FILLET | F | Round a corner; radius 0 makes a sharp corner |
| ARRAY | AR | Rectangular, polar or path copies |
| STRETCH | S | Move vertices inside a crossing box; lines crossing it stretch |

Your drawings now have real shapes. But every object sits on the same pile, with the same color and line style. The next lesson brings order: layers, the one habit that separates a professional drawing from a mess.

::: context polyline-one-object Why one object beats many
A shape made of separate lines is only a shape to your eye. To AutoCAD it is a loose pile of pieces that happen to touch. A closed polyline knows it is closed, so AutoCAD can report its area and perimeter directly (the AREA and LIST commands), fill it with a hatch pattern, offset the whole outline, or fillet all its corners. When a drawing is exported for a laser cutter or waterjet, a closed polyline is also what the cutting software wants: one continuous path, with no tiny gaps where two lines nearly meet.
:::

::: context arc-direction Counterclockwise, like the angles
Arcs go counterclockwise for the same reason angles do: AutoCAD follows the mathematical convention from the last lesson, where angles grow counterclockwise from east. So an arc from the rightmost point of a circle to the topmost point is the short quarter on the upper right, while the same two points picked in the other order give the long three-quarter arc. If an arc comes out on the wrong side, swap the start and end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="75" r="50" fill="none" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M140,75 A50,50 0 0,0 90,25" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="140" cy="75" r="4" fill="#b4232c"/><circle cx="90" cy="25" r="4" fill="#1f2a44"/>
  <text x="146" y="80" font-size="11" fill="#b4232c">start</text>
  <text x="96" y="20" font-size="11" fill="#1f2a44">end</text>
  <text x="90" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">short quarter arc</text>
  <circle cx="260" cy="75" r="50" fill="none" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M260,25 A50,50 0 1,0 310,75" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="260" cy="25" r="4" fill="#b4232c"/><circle cx="310" cy="75" r="4" fill="#1f2a44"/>
  <text x="266" y="20" font-size="11" fill="#b4232c">start</text>
  <text x="316" y="80" font-size="11" fill="#1f2a44">end</text>
  <text x="260" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">same points, swapped</text>
</svg>
```
:::

::: context quick-trim A change long-time users noticed
For most of AutoCAD's history, TRIM always asked you to pick the cutting edges first, and many drafters learned to press Enter at that step so every object counted. Autodesk made that the default behavior, calling it Quick mode, in AutoCAD 2021. Older tutorials and colleagues may describe the two-step way. Both still exist; the `O` option inside TRIM switches between them.
:::

::: context fillet-parallel A half circle for free
When two lines are parallel, no arc of an arbitrary radius can touch both and turn the corner, because there is no corner. The only arc that fits is the half circle whose diameter is the gap. AutoCAD draws exactly that, and trims or extends the second line so its end lines up with the first. That is why it ignores the radius you set.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="108" y1="20" x2="108" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="84" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">two parallel lines</text>
  <text x="180" y="65" font-size="18" text-anchor="middle" fill="#6c7a93">→</text>
  <line x1="240" y1="20" x2="240" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="288" y1="20" x2="288" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <path d="M240,100 A24,24 0 0,0 288,100" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="240" y1="40" x2="288" y2="40" stroke="#b4232c" stroke-width="1"/>
  <text x="264" y="35" font-size="11" text-anchor="middle" fill="#b4232c">gap</text>
  <text x="264" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">half circle, diameter = gap</text>
</svg>
```
:::

::: context associative-arrays Grouped copies that stay editable
An associative array remembers how it was made. Select it and grips appear that change the spacing or the count by dragging, and you can edit the source object once to update every copy. That is ideal for a row of 40 identical anchor bolts on a test pad. The cost is that the copies are one object: you cannot erase one of them or stretch half of them without first editing or exploding the array. Knowing which you want before you make it saves a lot of undoing.
:::

::: context window-crossing Which way you drag matters
AutoCAD reads the direction of a selection box. Drag from left to right and you get a **window**, drawn with a solid outline and blue fill: it picks only objects completely inside. Drag from right to left and you get a **crossing**, drawn dashed with green fill: it picks anything inside or touched by the edge. STRETCH relies on the crossing kind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="200" height="90" rx="10" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="54" cy="106" r="7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="206" cy="106" r="7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="54" cy="64" r="7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="206" cy="64" r="7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="170" y="28" width="80" height="114" fill="#8fb8f0" fill-opacity="0.25" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="240" y1="85" x2="320" y2="85" stroke="#b4232c" stroke-width="2"/>
  <polygon points="320,85 310,80 310,90" fill="#b4232c"/>
  <text x="280" y="78" font-size="11" text-anchor="middle" fill="#b4232c">@40,0</text>
  <text x="210" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">dashed crossing box, dragged right to left</text>
  <text x="30" y="22" font-size="11" fill="#1f2a44">inside moves · crossing lines stretch · outside stays</text>
</svg>
```
:::

::: context bolt-circle The circle you cannot see
A pitch circle, also called a bolt circle, is not a cut in the metal. It is an imaginary circle that the bolt hole centers sit on, and drawings dimension it with a diameter and a note like "6 holes equally spaced". On a spacecraft, reaction wheels, star trackers and thrusters all mount through bolt circles, and the fixtures that hold them during testing copy the same pattern. Getting it exact in the drawing is what lets the flight hardware and the test fixture bolt together.
:::
