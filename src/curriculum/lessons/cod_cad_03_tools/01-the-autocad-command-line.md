---
id: l01-the-autocad-command-line
title: The AutoCAD command line and exact points
minutes: 21
covers:
  - 'AutoCAD: the command line as the real interface; absolute, relative and polar coordinate entry'
  - Object snaps, ortho and polar tracking
---

Think about giving a friend directions to your house. You could say "it's at 412 Oak Street" — an exact address that works from anywhere in town. You could say "from the school, go two blocks east and one block north" — directions that start from where they already are. Or you could say "walk 300 meters that way, toward the water tower" — a distance and a direction. All three get your friend to the same front door.

AutoCAD asks you for points all day long, and it accepts exactly those three kinds of directions. That is most of what this lesson is about. The other part is the place where you type them.

**AutoCAD** — Autodesk's drafting program, used for flat, two-dimensional drawings — has buttons and menus like any modern program. But experienced drafters barely touch them. They type. The strip of text at the bottom of the screen, the **command line**, is where the program asks its questions and where you answer. In the last module you learned to read engineering drawings and GD&T. This module teaches the tools that make them. At a launch company, AutoCAD is the tool for the flat drawings around the rocket, not the rocket itself: the test stand layout, the ground support equipment, the wiring schematics. Every line in those drawings starts with a point typed on this command line.

## The command line is a conversation

Picture a very literal assistant. You say "line". It says "Where does it start?" You tell it. It says "Where next?" You tell it again. It keeps asking until you say "done". That is how every AutoCAD command works: you start it, then it walks you through a series of questions called **prompts** — the program's requests for a point, a number, an object or a choice.

You start a command by typing its name and pressing Enter. LINE draws lines. CIRCLE draws circles. Most commands also have a short **alias** — a one- or two-letter abbreviation for the full name: L for LINE, C for CIRCLE, PL for PLINE, O for OFFSET, TR for TRIM. The aliases live in a small settings file you can edit, which is why a veteran drafter's fingers fly.

Here is a real exchange. What you type is after the colon on each line.

```text
Command: L
LINE
Specify first point: 0,0
Specify next point or [Undo]: 100,0
Specify next point or [Undo]: 100,50
Specify next point or [Close/Undo]: C
Command:
```

Read it slowly, because every piece means something.

- **Square brackets** list the **options** — other things you may answer instead of a point. The capital letter in each option is what you type to pick it. `C` picked Close, which drew the last side back to the first point and ended the command.
- **Angle brackets**, when they appear, like `<10.0000>`, show the **default** — what AutoCAD will use if you press Enter without typing anything.
- **Enter** finishes what you are typing. On the command line the **space bar** does the same job, so you can keep one hand on the mouse and the other thumb on the space bar.
- Pressing Enter or Space at an empty `Command:` prompt **repeats the last command**. Drew one line? Press Space and you are drawing the next.
- **Esc** cancels whatever command is running.

::: key The command line
Type a command name or alias, then Enter or Space. Read the prompt. Square brackets hold options (type the capital letter); angle brackets hold the default (press Enter to accept it). Enter or Space on an empty prompt repeats the last command. Esc cancels.
:::

Why is typing the "real" interface? Because a drawing is a set of exact numbers. Clicking roughly where a line should end puts it at 99.87 instead of 100. On a screen you would never see the difference. On a drawing a machinist or a pipefitter builds from, it is a wrong dimension. Typing puts the point exactly where you meant, and the prompts tell you what the program is waiting for.

::: warning Space is not a space
Because the space bar acts like Enter, you cannot type a space in the middle of an answer on the command line. `100, 50` is not `100,50`: AutoCAD stops reading at the space. Type coordinates with no spaces.
:::

## Absolute coordinates: the street address

AutoCAD's drawing area is a flat sheet with a **[[coordinate grid|world-coordinates]]** laid over it. The point $(0,0)$ is the **origin**. The $x$ axis runs to the right, and the $y$ axis runs up. A point is written $x,y$ — read "x comma y". So `100,50` means "100 units to the right of the origin and 50 up".

That is an **absolute coordinate**: a point measured from the origin, no matter where you are drawing now. It is the street address.

What is a unit? Whatever you decide. For mechanical and ground-support work in SI, one unit is one millimeter, and you draw everything at **full size** — a 2-meter frame is drawn 2000 units long. You choose the paper scale later, when you print. That is a big change from hand drafting, and it is why a CAD file can be measured directly.

Absolute coordinates are perfect for the first point of a part and for anything tied to a fixed reference, like a building grid. They are clumsy for everything else. To draw the next edge of a part you would have to work out its address first.

## Relative coordinates: "from where I am"

Most of the time you know how far the next corner is from the last one. A plate is 120 long, so the next corner is 120 to the right. A **relative coordinate** says exactly that. You put an **at sign** in front: `@120,0` means "120 in $x$ and 0 in $y$ from the last point".

Read `@dx,dy` as "at delta x, delta y". The Greek letter delta, $\Delta$, means "change in", so $\Delta x$ is how far you move sideways and $\Delta y$ how far you move up. Negative numbers go left or down: `@-40,0` is 40 to the left.

The rule behind it is plain addition. If the last point was $(x_0, y_0)$, then `@dx,dy` puts the new point at

$$
(x_1, y_1) = (x_0 + \Delta x,\; y_0 + \Delta y).
$$

## Polar coordinates: distance and direction

Sometimes you know a length and an angle, not the sideways and upward pieces. A strut is 150 mm long at 35 degrees. A chamfered edge runs 50 mm at 150 degrees. A **polar coordinate** gives exactly that: `@distance<angle`. The less-than sign here is not "less than"; read it as "at an angle of". So `@50<150` is "50 units, at 150 degrees, from the last point".

The angles follow a fixed **[[convention|angle-convention]]**: 0 degrees points to the right (east), and angles grow **counterclockwise**. So 90 is straight up, 180 is left and 270 is straight down. You can also write 270 as $-90$.

To find where a polar point lands, split the distance $d$ into its sideways and upward parts with trigonometry:

$$
\Delta x = d\cos\theta, \qquad \Delta y = d\sin\theta.
$$

Here $\theta$ ("theta") is the angle. AutoCAD does this sum for you. That is the whole point of polar entry: you type the numbers you know, and the program works out the ones you do not.

::: key Three ways to give a point
Absolute `x,y` — measured from the origin $(0,0)$. Relative `@dx,dy` — measured from the last point. Polar `@d<angle` — a distance and an angle from the last point, with 0° to the right (east) and angles counterclockwise.
:::

::: warning The at sign and Dynamic Input
Without `@`, a typed `x,y` or `d<angle` is measured from the origin, not from the last point. Forget the `@` on the second point and your line shoots off to the far corner of the drawing. There is one twist. Newer AutoCAD versions show a small input box beside the cursor, called **[[Dynamic Input|dynamic-input]]**. With it switched on, AutoCAD treats a typed second point as relative even without the `@`. To force an absolute point there, type `#` in front, as in `#100,50`. If your lines land in strange places, check which mode you are in.
:::

::: example Drawing a bracket outline with all three
A flat bracket is 120 mm long and 50 mm tall. Its right end is 25 mm tall, and a sloped edge runs from the top of that end, 50 mm long at 150°, up to the full 50 mm height. Then the top edge runs straight back to the left end. Draw it corner by corner and track every point.

```text
Command: L
Specify first point: 0,0
Specify next point or [Undo]: @120,0
Specify next point or [Undo]: @0,25
Specify next point or [Close/Undo]: @50<150
Specify next point or [Close/Undo]: 0,50
Specify next point or [Close/Undo]: C
```

**Point A**, typed absolute: $(0, 0)$.

**Point B**, relative `@120,0`: add 120 to $x$ and 0 to $y$. $B = (0 + 120,\; 0 + 0) = (120, 0)$.

**Point C**, relative `@0,25`: straight up 25. $C = (120 + 0,\; 0 + 25) = (120, 25)$.

**Point D**, polar `@50<150`. First split 50 at 150° into its parts:

$$
\Delta x = 50\cos 150^\circ = 50 \times (-0.8660) = -43.30, \qquad \Delta y = 50\sin 150^\circ = 50 \times 0.5 = 25.
$$

The minus sign on $\Delta x$ says the edge leans left, as an angle past 90° should. Add them to C: $D = (120 - 43.30,\; 25 + 25) = (76.70, 50)$. Notice you never had to type 76.70. Polar entry did the trigonometry.

**Point E**, absolute `0,50`: the top-left corner, straight above A. Typing its address is easier than working out that it is 76.70 to the left of D.

**Close** draws E back to A, a 50 mm edge.

**Sanity check.** D sits at $y = 50$, the full height, which is what the drawing said the sloped edge reaches. Adding up the sides gives $120 + 25 + 50 + 76.70 + 50 = 321.70$ mm of outline, and every number came either from the drawing or from one line of trigonometry.
:::

::: example Choosing the form that matches what you know
A support strut starts at $(20, 10)$ and must end at $(95, 70)$. Three answers reach the same point.

**Absolute.** Type `95,70`. Fine if you know the address.

**Relative.** Subtract: $\Delta x = 95 - 20 = 75$ and $\Delta y = 70 - 10 = 60$. Type `@75,60`.

**Polar.** The length is $\sqrt{75^2 + 60^2} = \sqrt{5625 + 3600} = \sqrt{9225} = 96.05$ mm. The angle is $\arctan(60/75) = \arctan(0.8) = 38.66^\circ$. Type `@96.05<38.66`.

All three give the same end point, but the polar one is rounded and so is a hair off. The lesson: use the form whose numbers are on the drawing. If the drawing gives a length and an angle, as in "150 mm at 35°", type `@150<35` and let AutoCAD compute $\Delta x = 150\cos 35^\circ = 122.87$ and $\Delta y = 150\sin 35^\circ = 86.04$ exactly. Rounding them yourself only adds error.
:::

## Object snaps: grabbing exact points on what is already there

Typed numbers get you exact points from nothing. But most points you need are on things you already drew: the end of a line, the middle of an edge, the center of a hole. Clicking near them is not good enough. You need the cursor to jump onto them.

That is an **object snap**, or **osnap** — a mode that locks the cursor onto an exact geometric point of an existing object. When you hover near one, AutoCAD shows a small **[[marker|osnap-markers]]** that tells you which kind of point it found. Click while the marker shows, and the point is exact to the full precision of the drawing.

The ones you will use every day:

- **Endpoint** — the end of a line or arc.
- **Midpoint** — the exact middle of a line or arc.
- **Center** — the center of a circle or arc.
- **Intersection** — where two objects cross.
- **Perpendicular** — the point on an object that makes a right angle with the line you are drawing.
- **Tangent** — the point on a circle or arc where your line just touches it.
- **Quadrant** — the four points at 0°, 90°, 180° and 270° around a circle: its right, top, left and bottom.
- **Nearest** — the closest point on an object to the cursor. It keeps the point on the object but does not pick any special place along it.

You can use snaps two ways. **Running object snaps** stay on all the time; you pick which ones in the settings (type `OSNAP`) and toggle them all with the **[[F3 key|function-keys]]**. Or, at any point prompt, type a snap's short name, such as `END`, `MID`, `CEN`, `INT`, `PER`, `TAN`, `QUA` or `NEA`, to use that one snap for one pick only. That one-time choice is called an **override**.

```text
Command: L
Specify first point: MID
of  (click near the middle of the bottom edge)
Specify next point or [Undo]: PER
to  (click on the sloped edge)
```

That draws a line from the exact middle of one edge, meeting another edge at exactly 90°. No numbers were typed, and both ends are exact.

::: warning Snapping to the wrong thing
With many running snaps on, the cursor may grab an endpoint when you wanted a midpoint, or a nearby object you did not mean. Always look at the marker before you click. If a crowded area keeps fooling you, zoom in or use a one-time override like `MID`. And never trust **Nearest** for a real corner: it lands on the line but not at its end.
:::

::: key Object snaps
Endpoint, midpoint, center, intersection, perpendicular, tangent, quadrant and nearest lock the cursor onto exact points of existing geometry. F3 toggles running snaps; typing `END`, `MID`, `CEN` and so on at a prompt overrides for one pick.
:::

## Ortho and polar tracking: keeping lines straight

Try to draw a perfectly level line by hand with a mouse. It will be off by a fraction of a degree. **Ortho mode** fixes that: it restricts the cursor to horizontal and vertical moves only. Toggle it with **F8**.

**Polar tracking** is the more flexible cousin. It shows a dotted guide line whenever the cursor comes close to a chosen set of angles, such as every 30° or every 45°, and snaps the direction to it. Toggle it with **F10**, and set the angle step in its settings. Ortho and polar tracking cannot both be on: switching one on switches the other off.

Both pair with **direct distance entry**: point the cursor in a direction, let ortho or the tracking line lock it, then type only a distance and press Enter. With ortho on and the cursor pointing right, typing `120` draws a line exactly 120 to the right. It is the same as `@120<0`, with fewer keystrokes.

A close relative, **object snap tracking** (F11), lets you track from a snap point. Hover over the end of one line and the middle of another, and AutoCAD shows where guide lines from both would cross. It is how you find "level with this corner and straight above that hole" without drawing a helper line.

::: key Ortho and polar tracking
Ortho (F8) limits the cursor to horizontal and vertical. Polar tracking (F10) snaps direction to a chosen angle step, such as 30° or 45°. Only one is on at a time. Either one plus a typed distance gives an exact line with no coordinates.
:::

::: note Why polar entry is the same as relative entry
Any polar point can be rewritten as a relative one, and the reverse. Picture the move as a right triangle. The hypotenuse is the distance $d$. The side along $x$ is the adjacent side, so it is $d\cos\theta$. The side along $y$ is the opposite side, so it is $d\sin\theta$. Going the other way, Pythagoras gives $d = \sqrt{\Delta x^2 + \Delta y^2}$, and the angle comes from the inverse tangent of $\Delta y / \Delta x$ — taking care of which quarter of the circle you are in, which is why a left-pointing move gives an angle between 90° and 270°. AutoCAD stores every point as plain $x,y$ numbers. The `@` and `<` forms are only friendlier ways of typing them.
:::

## Where you can practice

The resources for this module point to Autodesk's own learning pages. Autodesk offers students a free education license of AutoCAD. If you want a free alternative for practice, [[LibreCAD|librecad]] is an open-source 2D drafting program with its own command line. Its commands and menus differ from AutoCAD's in places, so treat it as practice for the ideas — coordinates, snaps, layers — rather than for exact AutoCAD keystrokes.

## Check yourself

::: check
You are in the LINE command. The last point was $(40, 30)$. Where does each of these put the next point: `@25,-10`, `@20<90`, and `70,70` (with Dynamic Input off)?
:::

::: answer
`@25,-10` is relative: $(40 + 25,\; 30 - 10) = (65, 20)$. `@20<90` is polar, 20 units at 90°, which is straight up: $\Delta x = 20\cos 90^\circ = 0$ and $\Delta y = 20\sin 90^\circ = 20$, so $(40, 50)$. `70,70` has no `@`, so it is absolute: the point $(70, 70)$, wherever the last point was.
:::

::: check
What happens if you press the space bar at an empty `Command:` prompt right after finishing a CIRCLE?
:::

::: answer
The space bar acts like Enter, and Enter at an empty prompt repeats the last command. So CIRCLE starts again and asks for a center point. This is why drafters keep a thumb on the space bar.
:::

::: check
A prompt reads `Specify radius of circle or [Diameter] <12.0000>:`. What do the square and angle brackets mean, and what do you type to draw a circle 30 mm across?
:::

::: answer
The square brackets hold an option, Diameter, picked by typing its capital letter `D`. The angle brackets show the default, 12, which Enter would accept. To get 30 mm across you can type `D` then `30`, or answer the radius question directly with `15`.
:::

::: check
You want a line from the center of a hole to the point on a nearby edge that makes a right angle with that edge. Which two snaps do you use?
:::

::: answer
Center for the first point, so the line starts exactly at the hole's center, and Perpendicular for the second, so it meets the edge at exactly 90°. Typed as one-time overrides: `CEN` at the first prompt, `PER` at the second.
:::

::: check
Your lines keep landing 0.2 mm short of corners even though the snap marker seemed to show. The running snaps include Nearest. What is going on?
:::

::: answer
Nearest grabs the closest point on the line to the cursor, not the corner. When the cursor was a hair away from the end, Nearest won over Endpoint and put the point on the line but short of the end. Turn Nearest off in the running snaps, or use a one-time `END` override for corners.
:::

## Summary

| Idea | How you type it | What it means |
|---|---|---|
| Command or alias | `LINE` or `L`, then Enter or Space | Starts a command; the prompts follow |
| Options and default | `[Close/Undo]`, `<12.0000>` | Capital letter picks an option; Enter takes the default |
| Absolute point | `x,y` | Measured from the origin |
| Relative point | `@dx,dy` | Measured from the last point |
| Polar point | `@d<angle` | Distance and angle from the last point; 0° east, counterclockwise |
| Object snaps | F3, or `END`, `MID`, `CEN`, `INT`, `PER`, `TAN`, `QUA`, `NEA` | Lock onto exact points of existing objects |
| Ortho, polar tracking | F8, F10 | Lock direction to 90° steps or a chosen angle step |

You can now put a point exactly where you want it. The next lesson uses that to draw and edit real shapes: lines and polylines, arcs, offset, trim, extend, fillet, arrays and stretch.

::: context world-coordinates One grid under every drawing
The grid AutoCAD uses is the same one you met in a graphing class, named after the mathematician René Descartes, which is why these are called Cartesian coordinates. AutoCAD calls its fixed grid the World Coordinate System. You can lay a second, tilted or shifted grid on top, called a User Coordinate System, which is handy for drawing along a sloped wall. Every point is still stored against the world grid underneath, so moving your own grid never moves the drawing.
:::

::: context angle-convention Why zero points east
Measuring angles from the positive $x$ axis and turning counterclockwise is the standard mathematical convention, the same one your trigonometry lessons used for the unit circle. AutoCAD adopts it by default, so $\cos\theta$ and $\sin\theta$ give the right signs with no extra thought. Surveyors and navigators use a different habit — zero at north, turning clockwise — and AutoCAD can be switched to it, which is a classic source of confusion when a site plan arrives from a civil engineering firm.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="90" x2="300" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <text x="306" y="94" font-size="12" fill="#1f2a44">0°</text>
  <text x="172" y="15" font-size="12" fill="#1f2a44">90°</text>
  <text x="30" y="94" font-size="12" fill="#1f2a44">180°</text>
  <text x="168" y="175" font-size="12" fill="#1f2a44">270°</text>
  <line x1="180" y1="90" x2="249.28" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M220,90 A40,40 0 0,0 214.64,70" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="226" y="80" font-size="12" fill="#b4232c">30°</text>
  <text x="252" y="46" font-size="12" fill="#1d6fd1">@80&lt;30</text>
  <text x="60" y="140" font-size="11" fill="#1f2a44">angles grow counterclockwise</text>
</svg>
```
:::

::: context dynamic-input The box beside the cursor
Dynamic Input puts a small copy of the prompt right next to the cursor, so your eyes stay on the drawing. F12 turns it on and off. Its one surprise is the default for the second point: out of the box it assumes relative input, so `50,0` there means "50 to the right", while on the plain command line with Dynamic Input off the same text means the absolute point $(50,0)$. The `#` prefix forces absolute and `@` forces relative, whichever mode you are in. Many drafters leave it on and type `@` anyway, so their habit works everywhere.
:::

::: context osnap-markers Each snap draws its own sign
AutoCAD shows a different small shape for each kind of snap, so you can tell at a glance what you are about to click. Learn these shapes and you will stop grabbing the wrong point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <rect x="28" y="22" width="24" height="24"/>
    <polygon points="130,22 142,46 118,46"/>
    <circle cx="220" cy="34" r="12"/>
    <line x1="298" y1="22" x2="322" y2="46"/><line x1="322" y1="22" x2="298" y2="46"/>
    <polyline points="28,82 28,106 52,106"/><polyline points="28,94 40,94 40,106"/>
    <circle cx="130" cy="97" r="10"/><line x1="116" y1="85" x2="144" y2="85"/>
    <polygon points="220,82 232,94 220,106 208,94"/>
    <polygon points="298,82 322,82 298,106 322,106"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="62">endpoint</text>
    <text x="130" y="62">midpoint</text>
    <text x="220" y="62">center</text>
    <text x="310" y="62">intersection</text>
    <text x="40" y="124">perpendicular</text>
    <text x="130" y="124">tangent</text>
    <text x="220" y="124">quadrant</text>
    <text x="310" y="124">nearest</text>
  </g>
</svg>
```
:::

::: context function-keys The keys along the top
AutoCAD puts its drawing aids on the function keys, and the buttons on the status bar at the bottom of the screen show which are on. The ones worth memorizing: F3 object snaps, F8 ortho, F10 polar tracking, F11 object snap tracking, F12 Dynamic Input. When something behaves strangely — lines that will only go sideways, a cursor that will not reach a corner — a function key you pressed by accident is the first suspect.
:::

::: context librecad A free place to practice
LibreCAD is a free, open-source 2D drafting program that runs on Windows, Mac and Linux. It saves natively in DXF, an open drawing exchange format you will meet later in this module, and its command line accepts the same `@` and `<` style of coordinate. It is not AutoCAD, and a job listing that asks for AutoCAD means AutoCAD. But the habits this lesson teaches — typing exact points, snapping instead of eyeballing, drawing at full size — carry across every 2D drafting tool.
:::
