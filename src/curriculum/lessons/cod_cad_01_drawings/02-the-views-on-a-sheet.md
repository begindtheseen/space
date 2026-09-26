---
id: l02-the-views-on-a-sheet
title: The views on a sheet
minutes: 18
covers:
  - 'Views: front, top, right, auxiliary, section (full, half, offset, broken-out), detail, isometric'
---

Think about how a doctor looks at a broken arm. First an ordinary look from the outside. Then an X-ray, because the break is inside where eyes cannot reach. If the crack is tiny, the doctor zooms in on that one spot. And to explain it to you, the doctor might sketch the arm in 3D on a notepad. Four different pictures, each chosen because it shows something the others cannot.

An engineering drawing does the same thing with a part. Last lesson gave you the basic straight-on views — front, top and right — and the rule for where they sit. Real parts need more. A face that is tilted will not show its true shape in any of the three. A hollow part hides its insides behind its outside. A tiny groove is too small to read at the size of the whole part. So the drafter adds special views, each with a job.

This lesson is a tour of those views and how to recognize each one on a sheet. Your goal as a reader is simple to state: for every view on the drawing, say what it is and why it is there. That is the first step of reading any drawing cold, whether it is a bracket for a star tracker or the housing of a reaction wheel.

## The principal views, and picking the front

The glass box of last lesson gives six **principal views**: front, top, right side, left side, bottom and rear. Each one looks straight at the part along one of its three main directions.

A drawing almost never uses all six. It uses the fewest views that describe the part completely. For a flat plate, one view plus a thickness may do. For most brackets and blocks, three views do: front, top and right side. The others appear only when they show something new.

The drafter chooses which side of the part is the "front", and a good choice makes the whole drawing easier to read. The front view should be:

- the **most descriptive** view, the one that shows the most characteristic shape;
- the one with the **fewest [[hidden lines|hidden-preview]]**, the dashed lines that show edges behind a surface;
- and, where it makes sense, the part in its **natural position**, the way it sits when installed.

So when you open a drawing, start at the front view. It is usually the biggest and most important one on the sheet, and every other view is placed around it by the projection rule.

## Auxiliary views: looking square at a tilted face

Hold a coin flat in front of your face: you see a circle. Tilt it back and it squashes into an oval. Tilt it all the way and it becomes a thin line. The coin did not change. Your view of it did.

A tilted face on a part behaves the same way. If a face is sloped relative to all three principal views, none of them shows its true shape. Its length is shortened, a round hole in it looks like an oval, and you cannot measure it properly. This shortening is called **[[foreshortening|foreshortening-why]]**. A length $L$ on a face tilted by an angle $\theta$ (read "theta") away from the picture plane appears as

$$
L_{\text{seen}} = L \cos\theta .
$$

At $\theta = 0$ the face is square to your line of sight and you see it at full length, since $\cos 0 = 1$. At $\theta = 90^\circ$ it is edge-on and shrinks to a line, since $\cos 90^\circ = 0$.

The fix is an **auxiliary view** — an extra view looking straight at the tilted face, square to it. "Auxiliary" means "helping". The auxiliary view is projected from the view in which the tilted face appears as an edge (a sloping line), along lines at right angles to that edge. The result shows the tilted face at true size and true shape. Often it is a **partial auxiliary view**: only the tilted face is drawn, because the rest of the part would come out foreshortened and confusing.

You recognize an auxiliary view on a sheet because it sits at an angle to the others, lined up square to a sloping edge in a neighboring view, instead of straight above or beside the front view.

::: example A sloped sensor face
A wedge-shaped bracket has a flat mounting face for a sensor. The face is $60\,\mathrm{mm}$ long up its slope and is tilted $35^\circ$ from horizontal. A $20\,\mathrm{mm}$ hole is drilled square to the face. What does the top view show, and what does an auxiliary view show?

In the top view you look straight down, and the face is tilted $35^\circ$ from the horizontal picture plane, so $\theta = 35^\circ$.

Step 1, the length. $L_{\text{seen}} = 60 \cos 35^\circ = 60 \times 0.819 \approx 49.1\,\mathrm{mm}$. The face looks about $10.9\,\mathrm{mm}$ shorter than it really is.

Step 2, the hole. Across the slope, the hole keeps its full $20\,\mathrm{mm}$. Along the slope it shrinks to $20 \cos 35^\circ \approx 16.4\,\mathrm{mm}$. So the round hole is drawn as an oval (an ellipse), $20\,\mathrm{mm}$ by $16.4\,\mathrm{mm}$.

Step 3, the auxiliary view. Looking square to the face, $\theta = 0$. The face shows its true $60\,\mathrm{mm}$ length and the hole is a true $20\,\mathrm{mm}$ circle. That is the view an inspector would measure from, and the view that tells you exactly where the sensor sits on its face.

Sanity check: the seen length is less than the true length, as it must be, because $\cos\theta$ is never more than $1$.
:::

::: warning Do not measure a foreshortened face
A length on a tilted face, read from a principal view, is shorter than the real length. So is the diameter of a hole in it. If a drawing has an auxiliary view of a face, take that face's true sizes from the auxiliary view.
:::

## Section views: cutting the part open

Now the X-ray. Many parts are hollow: a housing around a bearing, a tube, a plate with a stepped hole. From the outside, all you see of the insides are dashed hidden lines, and a view full of dashes overlapping each other is hard to read.

A **section view** solves this. Imagine sawing the part in two along a flat plane, lifting away the piece nearest you, and looking straight at the cut. You see the inside shapes as crisp outlines. The surfaces where the saw went through solid material are filled with thin, evenly spaced slanted lines called **[[hatching|hatching-preview]]** (or section lining), so you can tell solid from empty at a glance.

How do you know where the cut was made? The view it came from shows a **[[cutting-plane line|cutting-plane]]**: a thick line, usually drawn with long and short dashes, running across the part where the saw went. Two things sit on it:

- **arrows** at its ends, which point in the direction you look at the cut. The arrows point *away* from the piece that was thrown away.
- **letters** at its ends, such as A and A. The section view is labelled to match, as SECTION A-A. A drawing with several cuts uses B-B, C-C and so on.

Some habits of section views, so they do not surprise you:

- Only material the plane actually cuts is hatched. Holes and empty spaces are left blank.
- Visible edges behind the cut are drawn, since you would see them looking at the cut face.
- Hidden lines are usually left out. The whole point was to get rid of them.

::: key What a section view is for
A cut through the part to show internal geometry, with the cut faces hatched. A broken-out section removes only a local region, which is how a drawing shows one internal feature without cutting the whole part.
:::

### Four kinds of section

Sections come in several shapes, depending on how much of the part the imaginary saw removes.

**Full section.** The cutting plane passes straight through the whole part, usually through its middle. The section view shows the entire inside along that plane. A full section often takes the place of an ordinary view: a front view becomes "SECTION A-A".

**Half section.** For a part that is symmetric, like a round cap or a pulley, you only need to see half the inside, because the other half is its mirror. So the imaginary saw removes only a quarter of the part. The resulting view shows the *outside* on one side of the centerline and the *inside* (hatched) on the other. You get both in one view. The two halves meet at a centerline, not a solid line, because there is no real edge there.

**Offset section.** Sometimes the features you want to show do not lie on one straight line — say, a small hole near one corner and a larger one near the middle. The cutting plane is then allowed to jog: it runs straight, turns a right angle, runs straight again, so that it passes through each feature. The cutting-plane line shows the jogs, but the section view is drawn as if the cut were one flat plane; the [[jogs themselves are not drawn|offset-jogs]] in the section.

**Broken-out section.** Often only one small internal feature needs showing, such as the depth of a threaded hole or a groove inside a bore. Cutting the whole part would be overkill. A **broken-out section** removes a small local piece, as if a chunk had been snapped off. It sits inside an ordinary view, bounded by an irregular freehand **[[break line|break-line]]**. Inside that boundary you see hatching and the internal feature; outside it, the normal exterior view carries on.

::: warning Section arrows show the view direction, not the cut
Read the arrows as "look this way". A section drawn in the wrong direction is the mirror of the right one, the same trap as last lesson's projection mix-up. When a section looks odd, stand where the arrows say and look again.
:::

## Detail views: the magnifying glass

Some features are too small to read at the size of the whole part. An O-ring groove, a small chamfer on an edge, a fine thread. Drawing the whole part bigger would need an enormous sheet.

A **detail view** is a magnified copy of a small region. On the main view, the region is circled with a thin line and given a letter. Somewhere else on the sheet, the enlarged copy appears, labelled with the letter and its own scale, such as DETAIL B, SCALE 4:1. That scale means the detail is drawn four times real size. (Lesson 3 covers scale notation fully.)

The important thing: the **dimensions** written on a detail view are still real sizes. The magnification only makes them readable.

## Isometric views: the 3D sketch

The last kind of view is not orthographic at all. An **[[isometric view|isometric]]** is a picture of the part turned so that you see three faces at once — front, side and top — like a box in an assembly manual.

In an isometric view, the three edges that meet at a corner are drawn $120^\circ$ apart. In practice: vertical edges stay vertical, and the two horizontal directions are drawn at $30^\circ$ above the horizontal, one going right and one going left. "Isometric" means "equal measure": all three directions are foreshortened by exactly the same amount, so lengths along any of the three axes can be compared directly.

Circles become ellipses in isometric, because every face is seen at a slant.

On a production drawing, an isometric view is usually a small **reference** picture, placed in a corner so the reader grasps the whole shape at a glance. Dimensions and inspection come from the orthographic views. Treat the isometric as the picture on the box, not the instructions.

::: example Reading a detail view and an isometric
**The detail.** A shaft has a groove $0.8\,\mathrm{mm}$ wide. On the main view, drawn full size, $0.8\,\mathrm{mm}$ is barely more than the width of a pencil line. In DETAIL C at SCALE 4:1, the groove is drawn $0.8 \times 4 = 3.2\,\mathrm{mm}$ wide. Now it is easy to see and dimension, and the dimension still reads $0.8$.

**The isometric.** A cube with $50\,\mathrm{mm}$ edges is shown in an isometric view. In a true isometric *projection*, each edge is foreshortened by the factor $\sqrt{2/3} \approx 0.816$, so each edge on paper is $50 \times 0.816 \approx 40.8\,\mathrm{mm}$ (read $\sqrt{\ }$ as "the square root of"). Because all three edges shrink by the same factor, most drafters skip it and draw every edge at its full $50\,\mathrm{mm}$. That is called an isometric *drawing*: the same shape, a bit larger.

Sanity check: $0.816$ is less than $1$, and every edge in a tilted view must appear shorter than it really is.
:::

::: note Why the isometric factor is the square root of two thirds
Tilt a cube until you look straight down one of its long corner-to-corner diagonals. Now all three edges from the near corner are tilted by the same angle $\theta$ from the picture plane — that is what makes the view isometric. Each edge is seen as $L\cos\theta$. The three edges are at right angles to each other, and it is a fact of 3D geometry that for three mutually perpendicular directions, the squares of the cosines of their tilts add to $2$:

$$
3\cos^2\theta = 2 \quad\Rightarrow\quad \cos\theta = \sqrt{2/3} \approx 0.816, \qquad \theta \approx 35.3^\circ .
$$

(Why $2$? Pick two perpendicular directions $u$ and $v$ lying in the picture plane. Take each edge one unit long. An edge's shadow has squared length equal to its squared part along $u$ plus its squared part along $v$. Add those up over the three perpendicular edges. Their parts along $u$ square-sum to the full squared length of $u$, which is $1$ — that is Pythagoras in 3D. The same goes for $v$. Total: $1 + 1 = 2$.)
:::

## Reading the whole sheet

Put it together. When you meet an unfamiliar drawing, go view by view and say what each one is:

1. Find the projection symbol, so you know where views should sit.
2. Find the front view, and the principal views placed around it.
3. Find any view sitting at an angle: an auxiliary view of a tilted face.
4. Find cutting-plane lines and their letters, then the matching SECTION views. Name each: full, half, offset or broken-out.
5. Find circled letters and the matching DETAIL views with their scales.
6. Glance at the isometric, if there is one, to check that your picture of the part matches.

For each view, ask "what is this here to show?" If you can answer for every view, you understand the part. If one view seems pointless, look again — a drafter adds a view only because something needed it.

## Check yourself

::: check
Name the view you would expect a drafter to use for each: (a) the true shape of a slanted mounting face; (b) the inside of a round, symmetric cap, while keeping its outside visible in the same view; (c) the depth of one blind threaded hole in a large block.
:::

::: answer
(a) An **auxiliary view**, looking square to the slanted face, so its sizes and hole shapes appear true.

(b) A **half section**. Only a quarter of the part is imagined removed, so one side of the centerline shows the outside and the other shows the hatched inside.

(c) A **broken-out section**. Only a small local region around the hole is imagined removed, bounded by a break line, so the rest of the view stays an ordinary outside view.
:::

::: check
On a cutting-plane line, both arrows point up the page. The ends are lettered D. What will the section view be called, and from which direction are you looking at the cut?
:::

::: answer
It will be labelled **SECTION D-D**. The arrows give the direction of sight: you look at the cut face in the direction the arrows point, up the page. The part of the object on the arrow-tail side of the line is the piece imagined thrown away.
:::

::: check
A $45\,\mathrm{mm}$ edge lies on a face tilted $60^\circ$ from the picture plane. How long does it appear in that view? Why would an inspector not measure it there?
:::

::: answer
$L_{\text{seen}} = 45 \cos 60^\circ = 45 \times 0.5 = 22.5\,\mathrm{mm}$. It looks half its true length. The view foreshortens it, so a measurement taken there would be wrong. An auxiliary view square to the face shows the true $45\,\mathrm{mm}$.
:::

::: check
In a section view, some regions are hatched and some are blank. What does each mean? Why are hidden lines usually left off a section view?
:::

::: answer
Hatched regions are solid material that the cutting plane passed through. Blank regions inside the outline are empty space (holes, bores, cavities) or surfaces behind the cut. Hidden lines are left off because the section already shows the internal shapes as visible outlines; adding dashes back would clutter the view that was made to remove them.
:::

::: check
A detail view is labelled SCALE 5:1 and shows a chamfer drawn $2.5\,\mathrm{mm}$ long on paper. How long is the real chamfer? What number should its dimension say?
:::

::: answer
At 5:1 the drawing is five times real size, so the real chamfer is $2.5 \div 5 = 0.5\,\mathrm{mm}$. The dimension on the drawing says $0.5$ — dimensions always give real sizes, whatever the scale of the view.
:::

## Summary

| View | What it shows | How to spot it |
| --- | --- | --- |
| Principal views | the part along its main directions; front is the most descriptive | placed by the projection rule around the front view |
| Auxiliary view | a tilted face at true size and shape | sits at an angle, square to a sloping edge |
| Full section | the whole inside along one plane | cutting-plane line through the whole part; SECTION A-A |
| Half section | outside and inside of a symmetric part in one view | half hatched, split at a centerline |
| Offset section | several features off a single line | cutting-plane line with right-angle jogs |
| Broken-out section | one local internal feature | hatching inside an irregular break line |
| Detail view | a small region enlarged | circled letter; DETAIL B, SCALE 4:1 |
| Isometric view | the whole part in 3D, for reference | three axes $120^\circ$ apart |
| Foreshortening | $L_{\text{seen}} = L\cos\theta$ | tilted faces look shorter |

Next lesson is about the lines themselves — solid, dashed, long-and-short — and what each kind means, plus how line weights and the scale of a drawing are written.

::: context hidden-preview Dashes mean "behind"
A **hidden line** is a line of short dashes. It marks an edge you could not see from where you stand, because solid material is in the way — the far side of a hole, a pocket on the back face. It lets a view show the inside without cutting the part. Lesson 3 treats hidden lines with all the other line types and their exact dash patterns.
:::

::: context foreshortening-why The shadow of a tilted stick
Hold a pencil in sunlight, square to the rays, and its shadow on a wall parallel to it is full length. Tilt it and the shadow shortens. The shadow's length is the pencil's length times the cosine of the tilt: that is what cosine measures, the "shadow fraction" of a slanted length. An orthographic view is a shadow cast by parallel rays, so every tilted length in it shrinks by exactly this factor.
:::

::: context hatching-preview Section lining
Hatching is drawn as thin parallel lines, usually at $45^\circ$. Where two different parts touch in a section, their hatching runs in different directions so you can see where one part ends. Lesson 3 covers the line weights and spacing. Some older drawings used different hatch patterns for different materials, but the material is always written in words elsewhere on the drawing, and that is what counts.
:::

::: context cutting-plane A cut and its section
The top view shows a plate with a stepped (counterbored) hole: a wide shallow hole over a narrow one. The thick dashed cutting-plane line runs through its center, the arrows say "look toward the back", and the letters name it A. Below, SECTION A-A shows the cut: hatched solid on both sides, the empty hole in the middle, and the step visible as a line across the far wall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#1f2a44" stroke-width="0.8"/>
    </pattern>
  </defs>
  <g fill="none" stroke="#1f2a44" stroke-width="2">
    <rect x="80" y="20" width="120" height="60"/>
    <circle cx="140" cy="50" r="20"/><circle cx="140" cy="50" r="10"/>
  </g>
  <line x1="62" y1="50" x2="218" y2="50" stroke="#b4232c" stroke-width="2.4" stroke-dasharray="16 3 3 3 3 3"/>
  <g stroke="#b4232c" stroke-width="2" fill="#b4232c">
    <line x1="62" y1="50" x2="62" y2="34"/><polygon points="62,28 57,38 67,38"/>
    <line x1="218" y1="50" x2="218" y2="34"/><polygon points="218,28 213,38 223,38"/>
  </g>
  <text x="48" y="36" font-size="13" fill="#b4232c">A</text>
  <text x="226" y="36" font-size="13" fill="#b4232c">A</text>
  <g fill="url(#hatch)" stroke="#1f2a44" stroke-width="2">
    <polygon points="80,120 120,120 120,132 130,132 130,150 80,150"/>
    <polygon points="160,120 200,120 200,150 150,150 150,132 160,132"/>
  </g>
  <line x1="130" y1="132" x2="150" y2="132" stroke="#1f2a44" stroke-width="2"/>
  <text x="140" y="172" font-size="12" fill="#1f2a44" text-anchor="middle">SECTION A-A</text>
  <text x="250" y="54" font-size="11" fill="#6c7a93">top view</text>
  <text x="250" y="140" font-size="11" fill="#6c7a93">the cut, seen</text>
  <text x="250" y="154" font-size="11" fill="#6c7a93">from the front</text>
</svg>
```
:::

::: context offset-jogs Why the jogs vanish
The jogs in an offset cutting plane are a trick to reach several features with one cut. If the section view drew them, you would see edges that do not exist on the real part — lines where the imaginary saw changed direction, not where the metal changes shape. So the section view is drawn as if all the cut faces had been flattened into one plane, and the jogs appear only on the cutting-plane line in the other view.
:::

::: context break-line Snapping off a corner
A **break line** marks where a view has been imaginarily broken rather than neatly cut. For a broken-out section it is a thin, wavy freehand line, like the edge of a torn piece of paper. A similar idea lets a drafter shorten a long, uniform part, such as a rod or tube: the middle is "broken out" and the two ends are drawn closer together, with the true overall length still written as a dimension.
:::

::: context isometric An isometric cube
In an isometric view, the vertical edges stay vertical and the other two directions run at $30^\circ$ above the horizontal. The three edges meeting at the nearest corner are $120^\circ$ apart, and each is drawn at the same length. That equal treatment of all three directions is what "iso-metric" (equal measure) means.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="2" stroke-linejoin="round">
    <polygon points="180,170 231.96,140 231.96,80 180,110" fill="#8fb8f0"/>
    <polygon points="180,170 128.04,140 128.04,80 180,110" fill="#ffffff"/>
    <polygon points="180,110 231.96,80 180,50 128.04,80" fill="#f2b880"/>
  </g>
  <line x1="180" y1="170" x2="290" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="170" x2="70" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M 225 170 A 45 45 0 0 0 218.97 147.5" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 135 170 A 45 45 0 0 1 141.03 147.5" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="252" y="162" font-size="12" fill="#b4232c">30°</text>
  <text x="90" y="162" font-size="12" fill="#b4232c">30°</text>
  <text x="186" y="130" font-size="12" fill="#1f2a44">120° between</text>
  <text x="186" y="144" font-size="12" fill="#1f2a44">each pair</text>
</svg>
```
:::

::: context section-in-practice Sections you will meet in GNC work
Actuators and sensors are mostly insides. A reaction wheel is a spinning mass on bearings inside a sealed housing; an engine gimbal is a pivot with bearings and seals; a gyro sits in a machined cavity. The drawings that matter to you are therefore full of sections. The bearing seat, the preload spacer and the shoulder that sets where the spin axis sits all appear only in a section view. Reading those views is how you find out which surfaces set your sensor's or actuator's alignment.
:::
