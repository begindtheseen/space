---
id: l06-position-and-location
title: 'Location: position, concentricity and symmetry'
minutes: 22
covers:
  - 'Location: position, concentricity, symmetry'
---

Think of parking a car in a garage with a tennis ball hanging from the ceiling on a string. When the ball touches the windshield, you are in the right spot. You do not care whether you are a little left or a little forward — only whether you are *close enough* to the spot, in any direction. And the spot is defined from the garage walls, not from wherever the last car happened to stop.

That is the idea of **location**. Form asked about shape. Orientation asked about tilt. Location asks *where*: is this hole where the drawing says, measured from the datums? The main location control is **position**, and it is probably the most-used symbol in all of GD&T. Every bolted bracket on a spacecraft carries it.

This lesson has two halves. The first is position: its round zone, how it is measured, and how it converts to and from the old plus-or-minus boxes. The second is two older location controls, **concentricity** and **symmetry**. You will still meet them on drawings, but the current standard has retired them, and understanding why teaches you something about writing good requirements.

## Position: a cylinder at true position

The first lesson of this module showed the problem with plus-or-minus location: it makes a square zone, while a bolt in a hole cares only about straight-line distance. Position fixes that.

Start with the perfect location. **Basic dimensions** — boxed exact numbers — say where the hole's center belongs, measured from the datum reference frame. That exact spot is the **true position**. Now the feature control frame:

`| ⌖ | ⌀0.2 | A | B | C |`

Read it aloud: "Position, within a diameter of zero point two, relative to datum A primary, B secondary, C tertiary."

It permits this. Build the datum reference frame by seating the part on A, then B, then C. Go to the true position given by the basic dimensions. Stand a **[[cylinder|position-cylinder]]** there, $0.2\,\mathrm{mm}$ in diameter, running square to datum A through the whole depth of the hole. The hole's axis must stay inside that cylinder from top to bottom.

::: key Position ⌀0.2 to A, B, C
The feature axis must lie within a cylindrical zone of $0.2\,\mathrm{mm}$ diameter located exactly at the basic dimensions in the datum reference frame A primary, B secondary, C tertiary. (With an Ⓜ modifier the zone also grows as the feature departs from maximum material condition — that is next lesson.)
:::

Two things hide in that sentence.

- **The zone is round.** The axis may miss true position by up to half the diameter, $0.1\,\mathrm{mm}$, in any direction.
- **The zone is a tube, not a dot.** Because the axis must stay inside the cylinder all the way through, the hole cannot be drilled at a slant. So position quietly controls the hole's orientation too.

### Measuring a position error

An inspector — often using a **[[coordinate measuring machine|cmm-position]]** — finds the hole's actual center and subtracts true position. Call the miss $\Delta x$ ("delta x", the change in $x$) and $\Delta y$. The straight-line miss is $\sqrt{\Delta x^2 + \Delta y^2}$ by Pythagoras. Position is reported as the diameter of the smallest zone that holds the center, which is twice that:

$$
\text{position error} = 2\sqrt{\Delta x^2 + \Delta y^2}.
$$

The part passes if that is no bigger than the tolerance.

::: example Checking one hole
A hole's true position is $50$ from datum B and $30$ from datum C (basic dimensions). It carries position $\varnothing\,0.2$ to A, B, C. The CMM, after building the frame A then B then C, finds the hole center at $x = 50.07$, $y = 29.96\,\mathrm{mm}$.

**The misses.** $\Delta x = 50.07 - 50 = 0.07$. $\Delta y = 29.96 - 30 = -0.04$.

**Square and add.** $0.07^2 + (-0.04)^2 = 0.0049 + 0.0016 = 0.0065$. The minus sign disappears when squared, as it should: a miss downward is as bad as a miss upward.

**Square root.** $\sqrt{0.0065} = 0.0806\,\mathrm{mm}$. That is the straight-line miss.

**Double it.** $2 \times 0.0806 = 0.161\,\mathrm{mm}$.

**Compare.** $0.161 \le 0.2$. The hole passes.

**Sanity check.** The miss is dominated by the $0.07$ in $x$; with nothing in $y$ the answer would be $0.14$. A little more than that is right.
:::

::: warning Report the diameter, not the radius
The formula doubles the distance because the tolerance is a *diameter*. Comparing the straight-line miss, $0.081$, directly against $0.2$ lets through parts that are off by up to twice the allowance. Always double before you compare — or compare the miss against half the tolerance.
:::

### The tube also limits tilt

Suppose the hole is $10\,\mathrm{mm}$ deep and the zone is $\varnothing\,0.2$. If the hole's axis enters at one side of the cylinder and leaves at the other, it has crossed $0.2\,\mathrm{mm}$ in $10\,\mathrm{mm}$ of depth. From last lesson, that tilt is about $0.2 / 10 = 0.02\,\mathrm{rad}$, or $1.15^\circ$. Any more lean and the axis pokes out of the tube. If the drawing needs the hole squarer than that, it adds a tighter perpendicularity control on top.

## Converting between the square and the circle

Engineers constantly translate between old drawings and GD&T. The conversion is Pythagoras, used both ways.

**From plus-or-minus to a position diameter.** A hole toleranced $\pm x$ in one direction and $\pm y$ in the other has a rectangular zone. Its farthest point is a corner, at distance $\sqrt{x^2 + y^2}$ from the center. The round zone that keeps every part the rectangle accepted is the circle through the corners:

$$
\varnothing = 2\sqrt{x^2 + y^2}.
$$

**From a position diameter to plus-or-minus.** Going back, the biggest square that fits *inside* a circle of diameter $\varnothing$ has its corners on the circle, so its half-width is $\varnothing / (2\sqrt{2})$.

::: key Square zone to cylindrical zone
A coordinate tolerance of $\pm x$ by $\pm y$ is circumscribed by a position zone of diameter $\varnothing = 2\sqrt{x^2 + y^2}$. For $\pm 0.1$ both ways that is $\varnothing\,0.283$. A round zone of diameter $\varnothing$ holds a square of only $\pm\varnothing/(2\sqrt{2})$: $\varnothing\,0.2$ holds $\pm 0.0707$.
:::

::: example Converting an old drawing
An old drawing locates a thruster mounting hole $\pm 0.05\,\mathrm{mm}$ left to right and $\pm 0.08\,\mathrm{mm}$ up and down. The team redraws it with position. What diameter keeps every part the old drawing accepted? [[Picture the rectangle in its circle|square-to-circle]].

**Corner distance.** $\sqrt{0.05^2 + 0.08^2} = \sqrt{0.0025 + 0.0064} = \sqrt{0.0089} = 0.0943\,\mathrm{mm}$.

**Diameter.** $2 \times 0.0943 = 0.189\,\mathrm{mm}$.

**Round sensibly.** A drawing would say $\varnothing\,0.18$ if it must stay at or under the old worst case, or $\varnothing\,0.19$ if every old part must still pass. That is a decision about function, made on purpose.

**Sanity check.** The answer, $0.189$, is bigger than both $2 \times 0.05 = 0.10$ and $2 \times 0.08 = 0.16$, because the corner is farther away than either edge. It is smaller than $0.10 + 0.16 = 0.26$, because the diagonal of a rectangle is shorter than going along two sides.
:::

## A pattern of holes, and a thruster that sits off-center

Real parts rarely have one hole. A bracket bolts down through a **[[pattern|hole-pattern]]** of four. Basic dimensions give each hole's true position, and one feature control frame, labeled "4X" (four times), applies to all four. Each hole gets its own cylinder at its own true position, and each must pass on its own.

::: example Inspecting a four-hole pattern
Four holes carry "4X position $\varnothing\,0.2$ to A, B, C". The CMM reports each center's miss from true position, in millimeters:

| Hole | $\Delta x$ | $\Delta y$ |
| --- | --- | --- |
| 1 | 0.03 | -0.05 |
| 2 | 0.08 | 0.02 |
| 3 | -0.04 | -0.07 |
| 4 | 0.06 | 0.09 |

**Hole 1.** $2\sqrt{0.03^2 + 0.05^2} = 2\sqrt{0.0034} = 2 \times 0.0583 = 0.117$. Pass.

**Hole 2.** $2\sqrt{0.08^2 + 0.02^2} = 2\sqrt{0.0068} = 2 \times 0.0825 = 0.165$. Pass.

**Hole 3.** $2\sqrt{0.04^2 + 0.07^2} = 2\sqrt{0.0065} = 2 \times 0.0806 = 0.161$. Pass.

**Hole 4.** $2\sqrt{0.06^2 + 0.09^2} = 2\sqrt{0.0117} = 2 \times 0.1082 = 0.216$. Fail, by $0.016$.

**Sanity check.** Hole 4 has the two biggest misses, $0.06$ and $0.09$. The rule of thumb "the diagonal is about the bigger miss plus a bit" says a little more than $2 \times 0.09 = 0.18$. It is.
:::

One failed hole rejects the part — unless the hole was drilled larger than its smallest size. Then extra clearance may rescue it. That is the **[[bonus tolerance|bonus-preview]]** of the next lesson, and it may well turn hole 4 into a pass.

Location feeds physics too. Last lesson a tilted thruster seat made a torque. A thruster seat *shifted* sideways does the same: its thrust line passes beside the center of mass instead of through it. If position $\varnothing\,0.2$ lets the seat sit up to $0.1\,\mathrm{mm}$ off, a $22\,\mathrm{N}$ thruster gets a lever of $0.0001\,\mathrm{m}$ and a torque of $22 \times 0.0001 = 0.0022\,\mathrm{N \cdot m}$. That is small next to the tilt's $0.041$ — which tells the designer that tilt, not location, is where to spend the tight tolerance.

## Concentricity and symmetry: the median-point controls

Picture a wheel on an axle. You want the wheel's middle to be on the axle's line. **Concentricity** was written for exactly that wish: that a round feature be centered on a datum axis. **Symmetry** is the flat version: that a slot or tab be centered on a datum center plane.

The trouble is in *how* they define "centered". Neither uses the feature's axis or center plane. Both use **[[median points|median-points]]**.

- **Concentricity.** Take a cross-section. Pick a point on the surface. Go straight through the datum axis to the point directly opposite. Mark the point halfway between them — the **median point**. Do that for every pair of opposite points, in every cross-section. All those median points must lie inside a cylinder of diameter $t$ around the datum axis.
- **Symmetry.** For a slot, pair each point on one wall with the point straight across on the other wall. The halfway points must all lie between two parallel planes $t$ apart, centered on the datum center plane.

::: example Median points by hand
A shaft section is checked for concentricity $\varnothing\,0.05$ to datum axis A. Along four directions through the datum axis, the inspector measures the distance to the surface on each side, in millimeters:

| Direction | One side | Opposite side |
| --- | --- | --- |
| $0^\circ$ | 12.031 | 11.973 |
| $45^\circ$ | 12.010 | 11.990 |
| $90^\circ$ | 11.985 | 12.017 |
| $135^\circ$ | 12.004 | 11.998 |

**Median point along $0^\circ$.** Halfway between $+12.031$ and $-11.973$ is $\frac{12.031 - 11.973}{2} = 0.029\,\mathrm{mm}$ from the axis.

**The others.** $45^\circ$: $\frac{12.010 - 11.990}{2} = 0.010$. $90^\circ$: $\frac{11.985 - 12.017}{2} = -0.016$, so $0.016$ on the other side. $135^\circ$: $\frac{12.004 - 11.998}{2} = 0.003$.

**Smallest zone around the axis.** The farthest median point is $0.029$ out, so the zone must be $2 \times 0.029 = 0.058\,\mathrm{mm}$ across.

**Compare.** $0.058 > 0.05$. This section fails — and that is from only four pairs in one slice. A real check needs hundreds of pairs in many slices.

**Sanity check.** Each median is half the difference of two readings near $12$, so medians of a few hundredths are the right size.
:::

Notice what that took: pairs of points exactly opposite each other through an axis, over the whole surface, then arithmetic on every pair. A dial indicator cannot do it. A CMM must scan densely and then compute. That is **expensive to measure**.

Worse, it is **rarely the function**. Take an oval shaft whose long radius is $12.03$ and short radius $11.97$, centered perfectly. Every opposite pair is equal, so every median point sits exactly on the axis: concentricity reads zero, perfect. Yet in a bearing that shaft thumps up and down $0.06\,\mathrm{mm}$ every half turn. What the bearing cares about is how the *surface* wobbles as it spins — and a control called **[[runout|runout-preview]]** measures exactly that with a dial indicator against the spinning part, cheaply.

So the modern advice is: for a round feature that must run true, use runout; for a feature that must be located for assembly, use position; for a complex surface, use profile. All three are cheaper to check and closer to what the part does.

::: key Concentricity: why is it discouraged?
It controls the distribution of median points, which is expensive to measure and rarely the actual function. Runout or position usually expresses the real requirement and is far cheaper to inspect, which is why Y14.5-2018 removed the concentricity and symmetry symbols.
:::

The 2018 revision of **ASME Y14.5** did not just advise against them: it removed the concentricity and symmetry symbols from the standard altogether. They are **legacy controls**. You will still meet them — on older drawings made to earlier revisions, which stay valid for the parts they define, and in the **[[ISO|iso-still]]** standards, which keep similar symbols. When you do, read them as median-point controls, and when you get to redraw the part, replace them with runout, position or profile.

::: warning Concentricity is not "position of a round feature"
Position of a shaft to a datum axis controls the shaft's *axis*, found from its whole surface. Concentricity controls *median points*, pair by pair. The oval shaft above passes concentricity perfectly and could still fail runout. Do not treat the two as the same number with a different symbol.
:::

## Check yourself

::: check
A hole's true position is at $(20, 15)$ in the A, B, C frame. It is measured at $(19.94, 15.09)$. It carries position $\varnothing\,0.2$. Pass or fail?
:::

::: answer
$\Delta x = 19.94 - 20 = -0.06$, $\Delta y = 15.09 - 15 = 0.09$. Squares: $0.0036 + 0.0081 = 0.0117$. Root: $0.1082$. Doubled: $0.216\,\mathrm{mm}$. Since $0.216 > 0.2$, it fails. The misses of $0.06$ and $0.09$ each look small, but together they reach past the $0.1$ radius.
:::

::: check
An old drawing gives a pin $\pm 0.03$ in $x$ and $\pm 0.04$ in $y$. What position diameter circumscribes that zone? What plus-or-minus square fits inside that circle?
:::

::: answer
$\varnothing = 2\sqrt{0.03^2 + 0.04^2} = 2\sqrt{0.0025} = 2 \times 0.05 = 0.10\,\mathrm{mm}$ (a 3-4-5 triangle, scaled). The biggest square inside a $\varnothing\,0.10$ circle has half-width $0.10 / (2\sqrt{2}) = 0.0354$, so $\pm 0.035$. It is smaller than both original tolerances because a square inside a circle loses its corners.
:::

::: check
Why does a position tolerance on a hole also limit how slanted the hole can be drilled?
:::

::: answer
The zone is a cylinder running through the full depth of the hole, and the axis must stay inside it the whole way. A slanted axis drifts sideways as it goes down, and once the drift reaches the cylinder's diameter it pokes out. Over a depth $d$ the lean is limited to about $\varnothing / d$ radians.
:::

::: check
Explain, with the oval shaft, why a part can pass concentricity perfectly and still run badly in a bearing.
:::

::: answer
Concentricity uses median points of opposite pairs. On a centered oval, each radius equals the one opposite it, so every median point lands on the axis and concentricity reads zero. But the surface itself sweeps in and out by the difference between the long and short radii, $0.06\,\mathrm{mm}$, every half turn. The bearing feels that sweep. Runout measures it directly, which is why runout states the real requirement.
:::

::: check
You are handed a drawing made to an older revision with a symmetry control on a slot. What does the symmetry control ask for, and what would you likely use instead on a new drawing?
:::

::: answer
It asks that the halfway points between opposite points on the two walls of the slot all lie between two parallel planes $t$ apart, centered on the datum center plane. The 2018 standard removed the symbol. On a new drawing you would usually use position of the slot's center plane (a width zone with no ⌀) to the datum, or profile for the walls — cheaper to inspect and closer to what a mating tab needs.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Position | axis inside a cylinder at true position | zone ⌀$t$ at basic dimensions in A, B, C |
| Position error | diameter of zone that holds the axis | $2\sqrt{\Delta x^2 + \Delta y^2}$ |
| Square to circle | circumscribed round zone | $\varnothing = 2\sqrt{x^2 + y^2}$ |
| Circle to square | square inside the round zone | $\pm\varnothing/(2\sqrt{2})$ |
| Tube limits tilt | axis stays in zone through depth $d$ | lean $\lesssim \varnothing/d$ rad |
| Concentricity | median points within ⌀$t$ of datum axis | legacy; removed in Y14.5-2018 |
| Symmetry | median points within planes $t$ apart | legacy; removed in Y14.5-2018 |
| Instead use | runout, position or profile | cheaper, closer to function |

Next lesson adds the Ⓜ to the position frame: maximum material condition, and the bonus tolerance that lets a hole drilled a little large carry a bigger zone.

::: context position-cylinder The zone as a tube through the part
Side view of a plate with one hole. The position zone (blue) stands square to datum A through the plate's full thickness. The hole's real axis (red) may wander and lean, but it must stay inside the tube from top to bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="60" width="280" height="80" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="160" y="60" width="50" height="80" fill="#f2f5fa" stroke="#6c7a93" stroke-width="1"/>
  <rect x="172" y="46" width="26" height="108" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="175" y1="140" x2="194" y2="60" stroke="#b4232c" stroke-width="2"/>
  <line x1="185" y1="36" x2="185" y2="164" stroke="#1f2a44" stroke-width="1" stroke-dasharray="8 3 2 3"/>
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="3"/>
  <text x="300" y="158" font-size="12" fill="#1f2a44">datum A</text>
  <text x="222" y="42" font-size="11" fill="#1d6fd1">zone ⌀0.2</text>
  <text x="222" y="100" font-size="11" fill="#b4232c">real axis</text>
  <text x="50" y="30" font-size="11" fill="#1f2a44">true position (center line)</text>
  <line x1="120" y1="33" x2="183" y2="44" stroke="#6c7a93" stroke-width="1"/>
</svg>
```

The zone is drawn far wider than life; a real ⌀0.2 tube is thinner than a pencil lead.
:::

::: context cmm-position How the machine finds a hole
A coordinate measuring machine touches a hole's wall with a small ruby-tipped probe at many points, at several depths. Software fits a circle to each ring of points and joins the centers into an axis. It then builds the datum reference frame from points probed on A, B and C, in that order, and reports how far the axis sits from true position at the top and bottom of the hole. The bigger of the two, as a diameter, is the position error. The last lesson of this module looks at how that fitting is done and where it goes wrong.
:::

::: context square-to-circle The rectangle and its circle
The old $\pm 0.05$ by $\pm 0.08$ zone (blue) and the circle through its corners (orange), $\varnothing\,0.189$. Scaled up about 700 times.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="66.04" fill="#fdf1e4" stroke="#f2b880" stroke-width="3"/>
  <rect x="75" y="44" width="70" height="112" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="110" y1="100" x2="145" y2="44" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="110" cy="100" r="3" fill="#1f2a44"/>
  <text x="200" y="60" font-size="12" fill="#1d6fd1">±0.05 across</text>
  <text x="200" y="78" font-size="12" fill="#1d6fd1">±0.08 up and down</text>
  <text x="200" y="110" font-size="12" fill="#1f2a44">corner: 0.0943 away</text>
  <text x="200" y="142" font-size="12" fill="#b4232c">circle ⌀ = 2 × 0.0943</text>
  <text x="200" y="158" font-size="12" fill="#b4232c">= 0.189</text>
</svg>
```

The dashed line from center to corner is the radius, $\sqrt{0.05^2 + 0.08^2}$.
:::

::: context hole-pattern Holes that work as a team
A bolt pattern exists to line up with a matching pattern on the mating part. What matters most is where the holes sit relative to each other, and where the whole group sits relative to the datums. Basic dimensions between the holes fix their spacing exactly, so tolerances do not pile up from hole to hole the way chained plus-or-minus dimensions do. A later lesson shows composite position, which lets the spacing inside the pattern be tighter than the pattern's location on the part.
:::

::: context bonus-preview Extra room from a bigger hole
If hole 4 was drilled a few hundredths larger than its smallest allowed size, the bolt has that much more clearance, so the hole can sit that much farther off and the bolt still fits. With an Ⓜ in the frame, the drawing allows exactly that: the zone grows by the amount the hole departs from its maximum material size. Next lesson puts numbers on it, and shows why a simple hard gauge can then check the whole pattern.
:::

::: context median-points Halfway between opposite points
One cross-section of an off-center round part. Each chord runs through the datum axis (blue cross). Its halfway point is a median point (red). Concentricity asks that every median point lie inside the small dashed circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="118" cy="96" r="60" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="100" r="12" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="58.13" y1="100" x2="177.87" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="36.54" x2="110" y2="155.46" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="104" y1="100" x2="116" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="110" y1="94" x2="110" y2="106" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="118" cy="100" r="3.5" fill="#b4232c"/>
  <circle cx="110" cy="96" r="3.5" fill="#b4232c"/>
  <text x="200" y="60" font-size="12" fill="#1d6fd1">cross: datum axis</text>
  <text x="200" y="84" font-size="12" fill="#1d6fd1">dashed: zone ⌀t</text>
  <text x="200" y="108" font-size="12" fill="#b4232c">dots: median points</text>
  <text x="200" y="132" font-size="12" fill="#6c7a93">grey: opposite pairs</text>
</svg>
```

A real check repeats this for hundreds of pairs in many slices.
:::

::: context runout-preview The dial indicator on a spinning part
Runout puts the part on its datum axis, spins it, and holds a dial indicator against the surface. The total swing of the needle in one turn is the runout. It catches off-center mounting, ovality and lobing together — everything that makes the surface move toward and away from a fixed point as it turns, which is what a bearing, a seal or a spinning wheel actually feels. A later lesson covers circular and total runout properly.
:::

::: context iso-still The other rulebook kept them
Outside the United States, many companies follow the ISO system of geometrical product specifications instead of ASME Y14.5. ISO still has symbols for coaxiality and concentricity and for symmetry, though its definitions differ in detail from the old ASME ones. So an engineer working with European suppliers will meet these symbols on current drawings. Always check which standard a drawing invokes before deciding what a symbol means.
:::
