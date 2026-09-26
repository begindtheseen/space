---
id: l03-lines-and-scales
title: The lines on a drawing, and its scale
minutes: 18
covers:
  - 'Line types: visible, hidden, centre, phantom, section; line weights'
  - Scales and their notation
---

Look at a road map. A thick red line is a highway. A thin gray line is a back road. A dashed line is a border you cannot see on the ground. A dotted blue line is a ferry route. Nobody writes "this is a highway" next to every road; the kind of line says it for you. And a small note in the corner — "1 cm = 10 km" — tells you how the map's size relates to the real world.

An engineering drawing works the same way. Every line on it is one of a small set of **line types**, and each type means something different: an edge you can see, an edge hidden behind material, an axis of symmetry, a neighboring part, a cut. The thickness of the line carries meaning too. And the **scale** in the title block tells you how the drawing's size relates to the part's.

Last lesson you met section views, hatching and cutting-plane lines. This lesson gives you the full set of lines, which drafters call the **[[alphabet of lines|line-alphabet]]**, and then the notation for scale. Reading lines correctly is not a detail. A dashed line mistaken for a solid one turns a hidden pocket into a visible step, and you picture a different part.

## Two thicknesses

Before the types, the thicknesses. A drawing uses mainly two **line weights** (line widths):

- **thick** lines, for the things you most need to see: the visible outline of the part, and cutting-plane lines;
- **thin** lines, for everything else: hidden edges, centerlines, phantom lines, hatching, and the dimension lines you will meet later.

The thick line is about twice as wide as the thin one. Under the ASME drawing standards, typical widths are about $0.6\,\mathrm{mm}$ thick and $0.3\,\mathrm{mm}$ thin. ISO drawings use a set of standard **[[pen widths|pen-widths]]**, and pick a thick and thin pair from it in the same $2{:}1$ ratio, such as $0.5$ and $0.25\,\mathrm{mm}$.

Why bother? Because contrast lets your eye find the part's shape at a glance. The thick outline pops out; the thin construction around it recedes. On a crowded sheet, the weights do half the reading for you.

## The line types

Each line type is a pattern of dashes, drawn in one of the two weights. Here they are, with what each one means.

### Visible lines

A **visible line** (also called an object line) is a **thick, continuous** line. It shows an edge or outline you can see from where you are looking. Most of any view is visible lines.

### Hidden lines

A **hidden line** is a **thin line of short, evenly spaced dashes**. It shows an edge you *cannot* see from this direction, because material is in the way: the far wall of a drilled hole, a pocket on the back face. On a hand drawing, the dashes are about $3\,\mathrm{mm}$ long with gaps of about $1\,\mathrm{mm}$; CAD software sets the pattern for you. Hidden lines are left out wherever they would only add clutter, and they are usually left out of section views, as you saw last lesson.

### Centerlines

A **centerline** (spelled "centre line" in British and ISO drawings) is a **thin line of long and short dashes, alternating: long, short, long**. It marks an axis or a line of symmetry: the axis of a hole, a shaft, a cylinder, or the middle of a symmetric part. It is not an edge. There is nothing there to touch.

On a round hole seen end-on, two centerlines cross at the center of the circle, and they cross at their short dashes, so the center is marked by a small cross. The centerlines run a little past the circle's edge. On a hand drawing, a long dash is about $20$ to $40\,\mathrm{mm}$, a short dash about $3\,\mathrm{mm}$, and the gaps about $1.5\,\mathrm{mm}$.

### Phantom lines

A **[[phantom line|phantom-uses]]** is a **thin line of one long dash followed by two short dashes: long, short, short, long**. It shows things that are not part of the object in its drawn position:

- **alternate positions** of a moving part, such as the other end of a lever's swing;
- **adjacent parts** that are not being defined on this drawing but help you see where the part goes;
- **repeated features**, where one is drawn in full and the rest are outlined.

The difference between a centerline and a phantom line is one extra short dash. Count them.

### Section lines and cutting-plane lines

**Section lines** — the hatching of last lesson — are **thin, continuous, parallel lines**, usually at $45^\circ$, evenly spaced, filling the solid material that a cutting plane passes through. Where two parts meet in the same section, their **[[hatching runs different ways|adjacent-hatching]]**, so the boundary between them is plain.

The **cutting-plane line** is **thick**, because it must stand out on top of the view it crosses. It is drawn with long dashes and pairs of short dashes, or with evenly spaced dashes, and it ends in arrows showing the direction of sight, with letters naming the section.

### The thin continuous lines

Several more thin, continuous lines carry the dimensions and notes, which later lessons explain in detail: **dimension lines** (with arrowheads, carrying a size), **extension lines** (carrying an edge out from the part so a dimension can reach it) and **leader lines** (pointing from a note to the feature it describes). They are thin so they never get confused with the part's outline. A last one, the **break line**, marks where a view is broken off or shortened: a thin freehand wavy line for short breaks, or a long thin line with zigzags for long ones.

::: key Hidden, centre and phantom lines
Hidden (dashed) shows edges behind the surface; centre (long-short-long) marks axes and symmetry; phantom (long-short-short-long) shows alternate positions, adjacent parts or repeat features. Reading them wrong changes what you think the geometry is.
:::

::: warning Count the short dashes
At a glance, centerlines and phantom lines look alike: both are thin long-and-short patterns. One short dash between the long ones is a centerline, an axis with no material. Two short dashes is a phantom line, often a whole neighboring part. Mistake a phantom outline for part of your object and you will picture a bracket with an extra flange that does not exist.
:::

## When lines land on top of each other

Often two kinds of line fall in the same place. A hidden edge may sit exactly behind a visible one; an axis may run exactly along a hidden edge. Only one line can be drawn there, so drafters follow an order of **[[precedence|line-precedence]]**:

1. a **visible** line wins over everything;
2. then a **hidden** line;
3. then a **centerline**.

(A cutting-plane line, which must stay readable, ranks with the important ones; on many drawings it comes between hidden lines and centerlines.)

For a reader, the lesson is this: the absence of a hidden line does not prove there is no hidden edge. It may be sitting under a visible line. When a feature seems to be missing from a view, look for a coincident visible line, and check the other views.

::: example Reading a drilled block
A block's front view shows a thick rectangle, $80\,\mathrm{mm}$ wide. Inside it, two thin dashed vertical lines sit $12\,\mathrm{mm}$ apart, symmetric about the middle, running from the top edge down $30\,\mathrm{mm}$ and then joined by a short dashed horizontal line. A thin long-short-long vertical line runs down the middle. What is going on?

Step 1, the dashed lines. Thin dashes are **hidden** edges: something inside the block, invisible from the front.

Step 2, their spacing. $12\,\mathrm{mm}$ apart, so a hole $12\,\mathrm{mm}$ across, entering from the top face.

Step 3, the bottom. The dashed horizontal line $30\,\mathrm{mm}$ down closes the hole off. So it stops inside the block: a **[[blind hole|blind-hole]]**, $12\,\mathrm{mm}$ across and $30\,\mathrm{mm}$ deep. (A drilled hole would really end in a cone-shaped tip; many drawings show it that way.)

Step 4, the long-short-long line. A **centerline**: the hole's axis, $80 \div 2 = 40\,\mathrm{mm}$ from each side.

Sanity check: in the top view, the same hole should appear as a solid **visible** circle, $12\,\mathrm{mm}$ across, with two crossing centerlines, because from above you look straight into it.
:::

## Scale: how big the drawing is compared with the part

A part is often too big to fit on the sheet, or too small to read at real size. So the drafter draws it bigger or smaller, by a fixed factor. That factor is the **scale**.

Scale is written as a ratio, **drawing size : real size**, read "drawing to real". Read the colon as "to".

- **1:1** — full size. $10\,\mathrm{mm}$ on the part is $10\,\mathrm{mm}$ on paper.
- **1:2** — half size. The drawing is half as big as the part. $1\,\mathrm{mm}$ on paper is $2\,\mathrm{mm}$ on the part.
- **1:5**, **1:10** — smaller still, for large parts.
- **2:1**, **5:1**, **10:1** — enlargements, for small parts and detail views.

The first number is always the drawing. So the small number first means a reduction, and the big number first means an enlargement. ISO lists a set of **preferred scales** built from $1$, $2$ and $5$ times powers of ten ($1{:}2$, $1{:}5$, $1{:}10$, $1{:}20$, $2{:}1$, $5{:}1$, $10{:}1$ and so on). On US mechanical drawings you may also see the scale written as a fraction, such as 1/2, meaning the same as 1:2, or in words such as FULL or HALF.

The sheet's main scale is written in the title block. A view drawn at a different scale — a detail view, say — carries its own scale label beside it, as you saw with DETAIL B, SCALE 4:1. A view or sketch that is not drawn to any scale may be marked **NTS**, "not to scale".

To go between drawing and real sizes:

$$
\text{real size} = \text{drawing size} \times \frac{\text{real}}{\text{drawing}}, \qquad
\text{drawing size} = \text{real size} \times \frac{\text{drawing}}{\text{real}} .
$$

At 1:2, a $30\,\mathrm{mm}$ line on paper is $30 \times \frac{2}{1} = 60\,\mathrm{mm}$ real. At 4:1, a $0.8\,\mathrm{mm}$ groove is drawn $0.8 \times \frac{4}{1} = 3.2\,\mathrm{mm}$.

::: example Choosing a scale for a long bracket
A bracket for an engine actuator is $640\,\mathrm{mm}$ long. It goes on an A3 sheet, $420\,\mathrm{mm}$ wide. After a $20\,\mathrm{mm}$ border on each side, the drawing area is $420 - 2 \times 20 = 380\,\mathrm{mm}$ wide. Which preferred scale should the drafter pick?

At 1:1 the view is $640\,\mathrm{mm}$ long. Too long: $640 > 380$.

At 1:2 the view is $640 \times \frac{1}{2} = 320\,\mathrm{mm}$. It fits, with $380 - 320 = 60\,\mathrm{mm}$ to spare for a side view or notes.

At 1:5 the view is $640 \times \frac{1}{5} = 128\,\mathrm{mm}$. It fits easily, but small features become hard to read.

So 1:2 is the sensible choice: the largest preferred scale that fits. Sanity check: 1:2 is a reduction, and the view ($320$) is indeed smaller than the part ($640$).
:::

## Never measure the drawing

Here is the rule that surprises beginners: **you never take a size by measuring the drawing with a ruler.** Sizes come only from the dimensions written on it. Many drawings say so outright with a general note: DO NOT SCALE DRAWING. ("Scaling" a drawing, in shop slang, means measuring it with a ruler.)

The dimensions always give **real sizes**, whatever the scale. A $60\,\mathrm{mm}$ hole spacing is written "60" on a full-size view, on a half-size view, and on a 4:1 detail. The scale only decides how big the picture is.

Why so strict? Paper stretches and shrinks with humidity. Printers resize pages without asking. A drafter may have drawn one feature slightly out of proportion to keep a view readable. And the written dimensions are what the supplier and the inspector are bound to, which lesson 4 explains. A ruler on the paper measures the picture, not the part.

::: example The printout that lied
A drawing was made on an A3 sheet at 1:5. Someone printed it on A4 paper with the printer set to "fit to page". A slot has no dimension, so a technician measures it with a ruler: $14\,\mathrm{mm}$ on the printout.

The naive reading: $14 \times 5 = 70\,\mathrm{mm}$.

But A4 is A3 shrunk. **[[A-series sheets|a-series]]** are designed so that each size is the one above it with every length multiplied by $\frac{1}{\sqrt{2}} \approx 0.707$. So the printout is $0.707$ times the true drawing.

Step 1, undo the printer: $14 \div 0.707 \approx 19.8\,\mathrm{mm}$ on the real A3 drawing.

Step 2, undo the drawing scale: $19.8 \times 5 \approx 99\,\mathrm{mm}$ on the part.

The ruler reading was off by about $29\,\mathrm{mm}$ — nearly a third. Sanity check: a shrunken printout makes everything look smaller, so the true size must be larger than the naive $70$. The fix is not better arithmetic. It is asking the designer to add the missing dimension.
:::

::: warning Dimensions are real sizes
Never multiply a written dimension by the scale. The number "25" on a 1:2 view means $25\,\mathrm{mm}$ on the part, not $50$. Scale converts only lengths you *measure* on paper — and you should not be measuring.
:::

## Why this matters to a GNC engineer

You will read drawings mostly to answer questions about **where things point and what touches what**. Where is the axis of the star tracker's mounting holes? That is a centerline. Which surface does the reaction wheel bolt against? That is a visible line in a section, next to hatching. How far can the engine gimbal swing before the nozzle hits the structure? That is often a phantom outline showing the nozzle at the end of its travel. Every one of those answers comes from reading a line type correctly.

## Check yourself

::: check
Describe each of these lines by weight and dash pattern, and say what it means: visible, hidden, centerline, phantom.
:::

::: answer
- **Visible**: thick, continuous. An edge you can see.
- **Hidden**: thin, short even dashes. An edge behind material, not visible from this direction.
- **Centerline**: thin, long-short-long. An axis or line of symmetry; not a physical edge.
- **Phantom**: thin, long-short-short-long. An alternate position, an adjacent part, or a repeated feature — something not part of the object in its drawn position.
:::

::: check
A drawing is at 1:10. The written dimension on the overall length says $1250$. How long is the part, and how long is that line on the paper?
:::

::: answer
Written dimensions are real sizes, so the part is $1250\,\mathrm{mm}$ long. On paper it is drawn at one tenth of that: $1250 \times \frac{1}{10} = 125\,\mathrm{mm}$.
:::

::: check
In a front view, you expected to see a hidden line for the back edge of a slot, but there is none. Give one innocent reason it might be missing.
:::

::: answer
The hidden edge may lie exactly behind a visible edge. A visible line takes precedence over a hidden one, so only the visible line is drawn. Check the other views to confirm where the slot's back edge is.
:::

::: check
Which is an enlargement, 1:5 or 5:1? A detail view at 5:1 shows a feature $6\,\mathrm{mm}$ long on paper. How long is it really?
:::

::: answer
The first number is the drawing size, so **5:1** is the enlargement: the drawing is five times the real size. The real length is $6 \div 5 = 1.2\,\mathrm{mm}$ — though on a proper drawing that feature would carry a written dimension, and you would read that instead.
:::

::: check
In a section through a bolted joint, two plates are hatched in opposite directions. Why? And why are the hatching lines thin while the outline is thick?
:::

::: answer
Opposite hatching makes the boundary between the two parts visible; if both ran the same way, the two plates would look like one piece of metal. The hatching is thin and the outline thick so the part's shape stands out and the hatching reads as a fill, not as more edges.
:::

## Summary

| Line or idea | Looks like | Means |
| --- | --- | --- |
| Visible | thick, continuous | an edge you can see |
| Hidden | thin, short dashes | an edge behind material |
| Centerline | thin, long-short-long | an axis or line of symmetry |
| Phantom | thin, long-short-short-long | alternate position, adjacent part, repeated feature |
| Section lines | thin parallel lines, usually at $45^\circ$ | solid material cut by a section |
| Cutting-plane line | thick, dashed, with arrows and letters | where a section is taken, and the view direction |
| Dimension, extension, leader | thin, continuous | sizes and notes |
| Line weights | thick about twice thin (about 0.6 and 0.3 mm) | outline stands out |
| Precedence | visible, then hidden, then centerline | which line is drawn where two coincide |
| Scale | drawing : real; 1:2 half size, 2:1 double | title block, or beside a view |
| Dimensions | always real sizes | never measure the drawing |

Next lesson turns to the box in the corner of the sheet: the title block and revision block, what a revision letter means, and why the drawing — not the CAD model — is the legal definition of the part.

::: context line-alphabet The alphabet of lines
The main line types, as they look on a drawing. The dash patterns are what identify them: count the short dashes between the long ones. The visible line and the cutting-plane line are thick; the rest are thin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <pattern id="h45" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#1f2a44" stroke-width="1"/>
    </pattern>
  </defs>
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="24">Visible</text><text x="10" y="54">Hidden</text><text x="10" y="84">Center</text>
    <text x="10" y="114">Phantom</text><text x="10" y="144">Cutting plane</text><text x="10" y="180">Section lines</text>
  </g>
  <line x1="110" y1="20" x2="350" y2="20" stroke="#1f2a44" stroke-width="2.6"/>
  <line x1="110" y1="50" x2="350" y2="50" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="9 3"/>
  <line x1="110" y1="80" x2="350" y2="80" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="36 5 7 5"/>
  <line x1="110" y1="110" x2="350" y2="110" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="36 5 7 5 7 5"/>
  <line x1="118" y1="140" x2="342" y2="140" stroke="#b4232c" stroke-width="2.6" stroke-dasharray="30 5 7 5 7 5"/>
  <g stroke="#b4232c" stroke-width="2"><line x1="118" y1="140" x2="118" y2="130"/><line x1="342" y1="140" x2="342" y2="130"/></g>
  <g fill="#b4232c">
    <polygon points="118,122 113,132 123,132"/><polygon points="342,122 337,132 347,132"/>
  </g>
  <rect x="110" y="162" width="240" height="30" fill="url(#h45)" stroke="#1f2a44" stroke-width="2.6"/>
</svg>
```
:::

::: context pen-widths Why the widths go up by the square root of two
The ISO line widths run $0.13$, $0.18$, $0.25$, $0.35$, $0.5$, $0.7$, $1$, $1.4$ and $2\,\mathrm{mm}$. Each is about $\sqrt{2} \approx 1.41$ times the one before. That matches the A-series paper sizes, where each sheet is $\sqrt{2}$ times the size of the next smaller one. So when a drawing is copied up from A4 to A3, every line grows by $\sqrt{2}$ and lands on the next standard width: a $0.35\,\mathrm{mm}$ line becomes about $0.5\,\mathrm{mm}$. The drawing stays standard at either size. The system dates from the days of technical pens, sold in exactly these widths.
:::

::: context phantom-uses Phantom lines in the wild
On a gimbal drawing, the engine nozzle is often shown twice: once in solid lines at its center position, and again in phantom lines tilted to the end of its travel. The gap between the phantom nozzle and the nearest structure is the clearance that limits how far your control system may command the gimbal. The picture shows a centerline crossing at a hole and a phantom outline of a lever at its other position.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="80" cy="85" r="30" fill="none" stroke="#1f2a44" stroke-width="2.6"/>
  <g stroke="#1f2a44" stroke-width="1" stroke-dasharray="20 3 5 3">
    <line x1="36" y1="85" x2="124" y2="85"/><line x1="80" y1="41" x2="80" y2="129"/>
  </g>
  <text x="80" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">centerlines cross at the center</text>
  <circle cx="220" cy="120" r="8" fill="none" stroke="#1f2a44" stroke-width="2.6"/>
  <polygon points="220,108 330,108 330,132 220,132" fill="none" stroke="#1f2a44" stroke-width="2.6"/>
  <g transform="rotate(-35 220 120)">
    <polygon points="220,108 330,108 330,132 220,132" fill="none" stroke="#1d6fd1" stroke-width="1.2" stroke-dasharray="20 3 5 3 5 3"/>
  </g>
  <text x="262" y="152" font-size="11" fill="#1f2a44" text-anchor="middle">lever (visible)</text>
  <text x="300" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">other position (phantom)</text>
</svg>
```
:::

::: context adjacent-hatching Telling parts apart in a cut
When a section passes through two parts that touch, each gets its own hatching direction, one at $45^\circ$ and the other at $135^\circ$. A third part might use a different spacing or angle. Solid round parts cut along their length — shafts, bolts, pins — are usually left unhatched, because hatching them adds nothing and hides the joint.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <defs>
    <pattern id="ha" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#1f2a44" stroke-width="1"/>
    </pattern>
    <pattern id="hb" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#1f2a44" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="60" y="30" width="240" height="30" fill="url(#ha)" stroke="#1f2a44" stroke-width="2.4"/>
  <rect x="60" y="60" width="240" height="30" fill="url(#hb)" stroke="#1f2a44" stroke-width="2.4"/>
  <rect x="170" y="18" width="20" height="84" fill="#ffffff" stroke="#1f2a44" stroke-width="2.4"/>
  <text x="310" y="49" font-size="11" fill="#1f2a44">plate 1</text>
  <text x="310" y="79" font-size="11" fill="#1f2a44">plate 2</text>
  <text x="180" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">bolt: not hatched</text>
</svg>
```
:::

::: context line-precedence Why visible wins
The order follows importance. A visible edge is the outline of the part, the first thing any reader needs, so it is never broken to make room for anything. A hidden edge still describes real geometry, so it beats a centerline, which marks only an idea (an axis). On older hand drawings the rule also saved ink and confusion: two lines drawn on top of each other look like one smudged line.
:::

::: context blind-hole Holes with a bottom
A **blind hole** stops inside the part; a **through hole** goes all the way. A twist drill leaves a cone-shaped bottom in a blind hole, because its tip is ground to a point — commonly $118^\circ$ included angle. Drawings often show that cone, and the hole's depth is measured to where the full diameter ends, not to the tip. Blind threaded holes are common on sensor brackets, where a screw must not poke out the far side into something delicate.
:::

::: context a-series How A-series paper works
An A0 sheet has an area of one square meter. Cut it in half across its long side and you get A1; halve that for A2, then A3, then A4. The trick is the shape: the long side is $\sqrt{2}$ times the short side, so every half has the same shape as the whole. A3 is $297 	imes 420\,\mathrm{mm}$ and A4 is $210 	imes 297\,\mathrm{mm}$. Going down one size multiplies every length by $1/\sqrt{2} pprox 0.707$. US drawings often use ANSI sizes instead (A is letter size, $8.5 	imes 11$ inches, then B, C, D, E), where the shape alternates rather than staying fixed.
:::
