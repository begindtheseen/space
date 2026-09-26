---
id: l01-orthographic-projection
title: Looking at a part straight on
minutes: 17
covers:
  - Orthographic projection; third-angle (US) versus first-angle (ISO) and the symbol that identifies which
---

Pick up a cereal box and hold it at arm's length. Turn it so you look squarely at the big printed front. You see a rectangle. You cannot tell how thick the box is. Now tip it so you look straight down on the top. Another rectangle — this one shows how wide and how thick the box is, but not how tall. Turn it once more and look straight at the narrow side. A third rectangle: thick and tall.

Each of those looks told you two of the box's three sizes. Put the three looks side by side and you know everything about its shape. That is the whole trick behind an engineering drawing. A flat sheet of paper cannot hold a solid object, but a few straight-on looks, arranged by a strict rule, can describe it completely.

This module is about reading those sheets. You are training to be a guidance and control engineer, not a draftsperson, so you will rarely make a drawing. But you will read them. The bracket that holds a star tracker, the mount for a reaction wheel, the gimbal that swivels an engine — every one of them reaches you as a drawing from the structures team. If you cannot read it, you cannot check whether the part points your sensor where your software thinks it does. This first lesson is about the rule that places the views on the sheet, and the small symbol that tells you which of two rules the drawing uses.

## Looking straight on

When you take a photo of a railway track, the two rails seem to meet far away. That is **perspective**: things farther away look smaller. It is how eyes and cameras work, and it is great for art. It is terrible for measuring. On a photo, a bolt near the lens looks bigger than the same bolt at the back.

An engineering drawing throws perspective away. Imagine looking at the part from very, very far off, through a telescope, so that every line of sight is parallel to every other one. Now each line of sight hits a flat, see-through sheet — the **picture plane**, the flat surface the view is drawn on — at a right angle. Where each edge of the part lands on that sheet, you draw a line.

That way of drawing is called **[[orthographic projection|projection-words]]**: a view made with parallel lines of sight that meet the picture plane at right angles. "Ortho" means straight or right-angled, and "projection" means throwing an image onto a surface.

Two things follow, and both matter to you as a reader:

- **Faces parallel to the picture plane show at true size and true shape.** A square face seen straight on is drawn as a square of the same size (at the drawing's scale, the subject of lesson 3). Nothing shrinks because it is farther back.
- **Each view shows only two of the three sizes.** The third size runs along your line of sight, so it collapses to nothing.

We name the three sizes of a part the way you would name the sizes of a box: **width** (left to right), **height** (bottom to top) and **depth** (front to back).

::: key
An orthographic view uses parallel lines of sight, perpendicular to the picture plane. Faces parallel to the plane appear at true size; the dimension along the line of sight disappears. So every view shows exactly two of width, height and depth.
:::

## The three main views and how they line up

Most parts are described by three views:

- the **front view** — looking at the part from the front. It shows **width and height**. The drafter chooses which side counts as the "front": usually the side that shows the most about the shape.
- the **top view** — looking straight down. It shows **width and depth**.
- the **right-side view** — looking at the part from its right. It shows **depth and height**.

Notice that every pair of views shares one size. The front and top views share width. The front and right views share height. The drawing uses that. The top view sits exactly in line with the front view, so every corner of the part lines up vertically between them. The right view sits exactly in line with the front view, so every edge lines up horizontally. You can lay a ruler across the sheet and follow a feature from one view to the next. Readers do this all the time; it is called **projecting** between views.

::: example Laying out a mounting block
A solid mounting block is $120\,\mathrm{mm}$ wide, $45\,\mathrm{mm}$ high and $70\,\mathrm{mm}$ deep. What size is each view, drawn full size?

- Front view: width by height, $120 \times 45\,\mathrm{mm}$.
- Top view: width by depth, $120 \times 70\,\mathrm{mm}$.
- Right view: depth by height, $70 \times 45\,\mathrm{mm}$.

Now place them with a $20\,\mathrm{mm}$ gap between views. Going across, the front view and the right view sit side by side: $120 + 20 + 70 = 210\,\mathrm{mm}$ wide. Going up, the front view and the top view stack: $45 + 20 + 70 = 135\,\mathrm{mm}$ tall.

Does it fit on an A4 sheet (the standard metric paper size) turned sideways, $297 \times 210\,\mathrm{mm}$? Across: $297 - 210 = 87\,\mathrm{mm}$ to spare. Up: $210 - 135 = 75\,\mathrm{mm}$ to spare, which leaves room for the title block and notes. Sanity check: each view reuses a size from its neighbor — the top view is exactly as wide as the front view ($120$), and the right view is exactly as tall ($45$). If your numbers ever disagree there, you have mixed up a view.
:::

## The glass box, and two ways to unfold it

Here is the picture that makes the layout rule click. Put the part inside a **[[glass box|glass-box]]**, a see-through box with a flat window on every side. Look through each window, straight on, and trace what you see onto that window. Now you have six views traced on six panes: front, top, right, left, bottom and back.

To get those views onto one flat sheet, you unfold the box. Keep the front pane still. Swing the top pane up on its hinge, the right pane out to the right, and so on, until every pane lies flat beside the front one.

The question is: when you look down from the top, does the top view land *above* the front view or *below* it? That depends on where you pretend the window was. There are two answers in use in the world, and they are named after the **[[quadrants|four-quadrants]]** that two crossing planes make.

### Third-angle projection: the US way

In **third-angle projection**, the window sits *between you and the part*. You look through the glass at the object behind it, and trace on the glass. When you unfold the box, each pane swings out toward the side you were looking from.

So:

- the **top view goes above** the front view (you looked from above);
- the **right-side view goes to the right** of the front view (you looked from the right);
- the left view goes to the left, the bottom view goes below.

Each view sits on the side you looked from. That is why third angle feels natural to most people: it matches where you were standing. This is the convention of US practice and the one used under the ASME drawing standards. The [[picture of a third-angle layout|third-angle-layout]] shows a stepped block drawn this way.

### First-angle projection: the ISO way

In **first-angle projection**, the part sits *between you and the window*. You look at the object, and its shadow falls on a screen behind it. When you unfold the box, each view lands on the *opposite* side from where you looked.

So:

- the **top view goes below** the front view;
- the **right-side view goes to the left** of the front view;
- the left view goes to the right, the bottom view goes above.

Each view sits on the side you did *not* look from. This is the convention in much of Europe and in the ISO drawing standards. The [[same block in first angle|first-angle-layout]] shows it: the views are the same shapes, swapped across the front view.

::: key Third-angle versus first-angle projection
Third angle (US practice) places each view on the side of the object you look from; first angle (ISO/European) places it on the opposite side. The truncated-cone symbol in the title block tells you which, and misreading it mirrors your understanding of the part.
:::

::: note Why the views flip between the two conventions
Think about the hinge of each pane of the glass box. Every pane is hinged to the front pane along a shared edge. In third angle, the window is between you and the part, so the pane you looked through is on your side; unfolding it keeps it on that side. In first angle, the screen is behind the part, on the far side from you; unfolding it brings it round onto the far side of the front view. The shapes traced are identical — the same face, the same outline — only the position changes. That is why a reader who guesses wrong still sees sensible-looking views, and does not notice the mistake.
:::

## The edge nearest the front view

There is a second, sneakier difference, and it is the one that causes real mistakes.

Look at the top view in third angle. Which of its long edges is the front of the part? Picture the unfolding: the top pane swings up on a hinge along the top-front edge of the box. So the edge of the top view *nearest* the front view is the part's **front face**. The same holds for the right view: its edge nearest the front view is the front face too.

In first angle it is the other way round. The top view hangs below the front view, and the edge of the top view nearest the front view is the part's **back face**. Its front face is the edge farthest away.

Here is a handy way to hold both:

- **Third angle: near edges are near faces.** Where two views touch, both show the front.
- **First angle: near edges are far faces.** Where two views touch, the side view shows the back.

::: example A hole read the wrong way
A bracket from a European partner is $60\,\mathrm{mm}$ deep, front to back. In its top view, a bolt hole is drawn $15\,\mathrm{mm}$ from the edge nearest the front view. The drawing is in first angle. Where is the hole?

Step 1: in first angle, the edge nearest the front view is the **back** face. So the hole is $15\,\mathrm{mm}$ in front of the back face.

Step 2: measured from the front face, that is $60 - 15 = 45\,\mathrm{mm}$ back.

Now suppose a reader assumed third angle. They would take the near edge to be the front face and put the hole $15\,\mathrm{mm}$ behind the front. The two readings disagree by $45 - 15 = 30\,\mathrm{mm}$ — half the part's depth. A bracket machined that way has its hole on the wrong side. Sanity check: the two positions are mirror images across the middle of the part ($30\,\mathrm{mm}$ from the front), which is exactly what a projection mix-up does.
:::

::: warning The mistake looks right
A wrong-convention reading never looks broken. Every view is still a sensible outline, the dimensions still add up, and the part you picture could exist. It is the **[[mirror image|mirror-handedness]]** of the real part. Holes move to the other side, a left-hand bracket becomes a right-hand one. So never assume the convention from where you are, or from who sent the drawing. Find the symbol.
:::

## The symbol that tells you which

Because the two conventions look so alike, a drawing states which one it uses with a small symbol, usually in or beside the **title block** (the box of information in the lower-right corner of the sheet; lesson 4 covers it).

The symbol is a drawing of a **[[truncated cone|truncated-cone-symbol]]**: a cone with its tip sliced off, like a lampshade or a paper cup lying on its side. It shows two views of that cone:

- a side view, which is a **trapezoid** (a four-sided shape with one pair of parallel sides), tall at the wide end and short at the narrow end;
- an end view, which is **two circles, one inside the other**, sharing a center.

The two circles are drawn as solid lines, so they show the cone seen from its *narrow* end: you see the small flat end and, behind it, the sloping side flaring out to the big circle. (From the wide end, the big flat face would hide the small circle.)

Now apply the rules you already know. The symbol is usually drawn with the trapezoid on the left and the circles on the right.

- **Third angle:** the circles are a view from the right, placed on the right. So the narrow end of the cone faces right, toward the circles. **The trapezoid tapers toward the circles.**
- **First angle:** a view placed on the right was looked at from the left. So the narrow end faces left, away from the circles. **The wide end of the trapezoid faces the circles.**

You do not need to memorize a picture. Ask "which end of the cone gives two solid circles?" (the narrow end), then "which side did the view come from?" and apply the rule.

::: warning Some sheets are drawn the other way
A few drawings put the circles on the left. The reasoning still works: find the narrow end, see which side the circles sit on, and apply "same side" (third angle) or "opposite side" (first angle). Do not match the symbol by its overall look alone.
:::

## Why a control engineer reads the symbol first

On a real program, drawings cross borders. A launch vehicle may carry a payload built in Europe, a sensor from one supplier and a bracket from another. Each team uses its own convention, and suppliers who work for both kinds of customer switch back and forth. So the first thing a careful reader does, before looking at a single dimension, is find the symbol.

For you, the stakes are in **[[where your sensor points|sensor-axes]]**. Guidance software stores the direction each sensor faces, relative to the vehicle's body. If a mounting bracket is read mirrored, a sensor axis that should lean one way leans the other. The software is then confidently wrong, and no amount of clever filtering can tell.

## Check yourself

::: check
A block is $80\,\mathrm{mm}$ wide, $30\,\mathrm{mm}$ high and $50\,\mathrm{mm}$ deep. Give the size of the front, top and right-side views, and say which size is shared by the front and top views.
:::

::: answer
Front: width by height, $80 \times 30\,\mathrm{mm}$. Top: width by depth, $80 \times 50\,\mathrm{mm}$. Right: depth by height, $50 \times 30\,\mathrm{mm}$.

The front and top views share the **width**, $80\,\mathrm{mm}$. That is why the top view is placed exactly in line with the front view, above or below it, so its corners line up with the front view's corners.
:::

::: check
On a drawing, the top view sits *below* the front view. Which convention is this, and where would you expect to find the right-side view?
:::

::: answer
A top view below the front view means the view landed on the opposite side from where it was looked at. That is **first angle**. By the same rule, the right-side view (looked at from the right) sits to the **left** of the front view.

Before trusting this, confirm with the truncated-cone symbol in the title block.
:::

::: check
In your own words, why does a drawing need the projection symbol at all? Why can't a reader tell the convention from the views alone?
:::

::: answer
Because both conventions produce the same set of view shapes. Only their positions swap. A drawing read in the wrong convention still shows sensible outlines that could be a real part — the mirror image of the true one. Nothing looks broken, so the views alone cannot warn you. The symbol is the only definite statement of which rule the drafter used.
:::

::: check
You see a projection symbol with the trapezoid on the left and the circles on the right. The trapezoid's short side is on the right, next to the circles. Which convention is it? Explain using the narrow end of the cone.
:::

::: answer
Two solid circles means the cone is seen from its narrow end. The narrow end is on the right, and the end view is placed on the right. The view is on the same side it was looked from, so this is **third angle**. In short: the trapezoid tapers toward the circles.
:::

::: check
A plate is $40\,\mathrm{mm}$ deep. In the right-side view of a third-angle drawing, a slot's centerline is $12\,\mathrm{mm}$ from the edge nearest the front view. How far is it from the back face? What would someone reading it as first angle wrongly conclude?
:::

::: answer
In third angle the edge nearest the front view is the **front** face. So the slot is $12\,\mathrm{mm}$ behind the front face, which is $40 - 12 = 28\,\mathrm{mm}$ in front of the back face.

A first-angle reader would take that near edge to be the back face and place the slot $12\,\mathrm{mm}$ from the back, which is $28\,\mathrm{mm}$ from the front. The two readings differ by $28 - 12 = 16\,\mathrm{mm}$, mirrored about the middle of the plate.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Orthographic view | parallel lines of sight, square to the picture plane; no perspective |
| True size | faces parallel to the picture plane show at true size and shape |
| Front view | width and height |
| Top view | width and depth; lines up with the front view |
| Right-side view | depth and height; lines up with the front view |
| Third angle (US) | view on the side you look from: top above, right to the right |
| First angle (ISO) | view on the opposite side: top below, right to the left |
| Nearest edge | third angle: the front face; first angle: the back face |
| Projection symbol | truncated cone; third angle tapers toward the circles, first angle's wide end faces them |

Next lesson fills out the sheet: the other principal views, auxiliary views for slanted faces, section views that cut the part open, enlarged detail views, and the isometric picture that shows the whole part at a glance.

::: context projection-words Where the words come from
"Orthographic" joins two Greek pieces: *orthos*, straight or upright (as in orthodontist, who straightens teeth), and *graphein*, to draw or write. "Projection" comes from Latin for "thrown forward" — you throw each corner of the part forward, along a straight line, onto the picture plane. The whole method was set out as a system by the French mathematician Gaspard Monge in the late 1700s, as part of what he called descriptive geometry. Engineers have drawn this way ever since, and CAD programs still produce their drawing views exactly by his rules.
:::

::: context glass-box The glass box, in your hands
You can build one. Take a clear plastic food box, put a small toy block inside, and trace its outline on each face with a marker, looking straight through each face. Then cut the box along its edges, leaving each side panel hinged to the front one, and lay it flat. The tracings arrange themselves into a third-angle layout: top above front, right to the right. The unfolding is the rule. The six views it gives are the **principal views**; most drawings use only the two or three that are needed.
:::

::: context four-quadrants Why "first" and "third" angle
Stand a vertical plane up and lay a horizontal plane across it. Seen edge-on, they make a cross with four quarter-spaces, numbered as in the picture. First angle puts the part in quarter I: above the ground plane and in front of the wall, between you and both screens. Third angle puts it in quarter III: below and behind, so both screens (imagined as glass) sit between you and the part. Quarters II and IV are not used, because unfolding them would lay two views on top of each other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="170" y1="18" x2="170" y2="182" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="176" y="30" font-size="11" fill="#6c7a93">vertical plane</text>
  <text x="44" y="94" font-size="11" fill="#6c7a93">horizontal plane</text>
  <text x="240" y="40" font-size="14" fill="#1f2a44" font-weight="700">I</text>
  <text x="100" y="40" font-size="14" fill="#1f2a44" font-weight="700">II</text>
  <text x="100" y="170" font-size="14" fill="#1f2a44" font-weight="700">III</text>
  <text x="240" y="170" font-size="14" fill="#1f2a44" font-weight="700">IV</text>
  <rect x="200" y="56" width="34" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="192" y="76" font-size="11" fill="#1d6fd1" text-anchor="end">first</text>
  <rect x="112" y="114" width="34" height="30" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="104" y="134" font-size="11" fill="#b4232c" text-anchor="end">third</text>
  <line x1="340" y1="72" x2="300" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="300,72 308,68 308,76" fill="#1f2a44"/>
  <text x="338" y="62" font-size="11" fill="#1f2a44" text-anchor="end">you look</text>
  <text x="338" y="90" font-size="11" fill="#1f2a44" text-anchor="end">from the front</text>
  <text x="170" y="196" font-size="11" fill="#6c7a93" text-anchor="middle">side-on: front is to the right</text>
</svg>
```
:::

::: context third-angle-layout A stepped block in third angle
The block is tall on its left half and stepped down on its right half. The top view sits above the front view and shows the step as a line. The right-side view sits to the right and shows the step edge as a horizontal line halfway up. Thin grey lines show how corners project straight across from view to view. The small symbol, bottom right, tapers toward its circles: third angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1" stroke-dasharray="3 3">
    <line x1="60" y1="100" x2="60" y2="120"/><line x1="100" y1="100" x2="100" y2="120"/><line x1="150" y1="100" x2="150" y2="150"/>
    <line x1="100" y1="120" x2="170" y2="120"/><line x1="150" y1="150" x2="170" y2="150"/><line x1="150" y1="180" x2="170" y2="180"/>
  </g>
  <g fill="none" stroke="#1f2a44" stroke-width="2">
    <rect x="60" y="60" width="90" height="40"/>
    <line x1="100" y1="60" x2="100" y2="100"/>
    <polygon points="60,180 150,180 150,150 100,150 100,120 60,120"/>
    <rect x="170" y="120" width="40" height="60"/>
    <line x1="170" y1="150" x2="210" y2="150"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="105" y="52">TOP</text><text x="105" y="198">FRONT</text><text x="190" y="198">RIGHT</text>
  </g>
  <g fill="none" stroke="#1f2a44" stroke-width="1.5">
    <polygon points="262,160 290,166 290,178 262,184"/>
    <circle cx="318" cy="172" r="12"/><circle cx="318" cy="172" r="6"/>
  </g>
  <line x1="255" y1="172" x2="336" y2="172" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="8 2 2 2"/>
  <text x="298" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">third angle</text>
  <text x="250" y="70" font-size="11" fill="#1f2a44">top above front</text>
  <text x="250" y="88" font-size="11" fill="#1f2a44">right to the right</text>
</svg>
```
:::

::: context first-angle-layout The same block in first angle
The shapes are identical to the third-angle picture, but they swap sides of the front view. The top view hangs below the front view. The view seen from the right sits on the left. The symbol's wide end faces its circles: first angle. If you read this sheet as third angle, you would think the step was on the left of the part.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1" stroke-dasharray="3 3">
    <line x1="150" y1="100" x2="150" y2="120"/><line x1="190" y1="100" x2="190" y2="120"/><line x1="240" y1="100" x2="240" y2="120"/>
    <line x1="130" y1="40" x2="150" y2="40"/><line x1="130" y1="70" x2="190" y2="70"/><line x1="130" y1="100" x2="150" y2="100"/>
  </g>
  <g fill="none" stroke="#1f2a44" stroke-width="2">
    <polygon points="150,100 240,100 240,70 190,70 190,40 150,40"/>
    <rect x="150" y="120" width="90" height="40"/>
    <line x1="190" y1="120" x2="190" y2="160"/>
    <rect x="90" y="40" width="40" height="60"/>
    <line x1="90" y1="70" x2="130" y2="70"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="195" y="30">FRONT</text><text x="195" y="176">TOP</text><text x="110" y="30">RIGHT</text>
  </g>
  <g fill="none" stroke="#1f2a44" stroke-width="1.5">
    <polygon points="262,178 290,184 290,160 262,166"/>
    <circle cx="318" cy="172" r="12"/><circle cx="318" cy="172" r="6"/>
  </g>
  <line x1="255" y1="172" x2="336" y2="172" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="8 2 2 2"/>
  <text x="298" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">first angle</text>
  <text x="14" y="140" font-size="11" fill="#1f2a44">top below front</text>
  <text x="14" y="158" font-size="11" fill="#1f2a44">right to the left</text>
</svg>
```
:::

::: context mirror-handedness Left hands and right hands
Your two hands are mirror images: same shape, but no amount of turning will make a left glove fit a right hand. Many parts are the same. A bracket that bolts to the left wall of a spacecraft is often the mirror of one on the right wall, and drawings often label them as a pair. Misreading the projection convention silently swaps one for the other. A part made that way can look perfect on the bench and still refuse to bolt on, or bolt on facing the wrong way.
:::

::: context truncated-cone-symbol The two projection symbols
Both symbols show a cone with its tip cut off (a **frustum**, from Latin for "a piece broken off"), seen from the side and from its narrow end. Only the direction of the taper differs. On the left, third angle: the trapezoid narrows toward the circles. On the right, first angle: the trapezoid widens toward the circles. The thin long-and-short line is the cone's centerline, a line type you meet in lesson 3.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="10 3 3 3">
    <line x1="20" y1="70" x2="165" y2="70"/><line x1="130" y1="38" x2="130" y2="102"/>
    <line x1="200" y1="70" x2="345" y2="70"/><line x1="310" y1="38" x2="310" y2="102"/>
  </g>
  <g fill="none" stroke="#1f2a44" stroke-width="2">
    <polygon points="30,45 90,57 90,83 30,95"/>
    <circle cx="130" cy="70" r="25"/><circle cx="130" cy="70" r="13"/>
    <polygon points="210,57 270,45 270,95 210,83"/>
    <circle cx="310" cy="70" r="25"/><circle cx="310" cy="70" r="13"/>
  </g>
  <text x="90" y="126" font-size="12" fill="#1d6fd1" text-anchor="middle">Third angle (US)</text>
  <text x="90" y="142" font-size="11" fill="#6c7a93" text-anchor="middle">tapers toward the circles</text>
  <text x="270" y="126" font-size="12" fill="#b4232c" text-anchor="middle">First angle (ISO)</text>
  <text x="270" y="142" font-size="11" fill="#6c7a93" text-anchor="middle">wide end faces the circles</text>
</svg>
```
:::

::: context sensor-axes Where this comes back
Later in the course you will write each sensor's mounting as a rotation: a small table of numbers that turns a direction measured in the sensor's own frame into the vehicle's body frame. That table is read off the mechanical drawings. A mirrored reading does not produce a rotation at all — it flips the handedness of the axes, so one axis changes sign. Attitude software fed that table will steer confidently in a wrong direction. Checking the projection symbol is the first line of defense.
:::
