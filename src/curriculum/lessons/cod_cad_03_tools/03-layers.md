---
id: l03-layers
title: Layers, the drafter's core discipline
minutes: 19
covers:
  - 'Layers as the core discipline: name, color, linetype, lineweight, plot state, freeze versus off'
---

Old anatomy books had a wonderful trick. The first page showed a skeleton. On top of it lay a clear plastic sheet printed with the muscles. On top of that, another sheet with the blood vessels, then one with the skin. Flip a sheet back and that system disappeared, leaving the rest in place. Every sheet lined up exactly with the others, so together they made one body.

AutoCAD works the same way. Every object in a drawing sits on a **[[layer|overlay-drafting]]** — a named group of objects that share settings, like one of those clear sheets. The walls sit on one layer, the pipes on another, the dimensions on a third. You can hide a layer, lock it, change its color or stop it from printing, all at once, without touching the objects themselves.

In the last two lessons you learned to place points and to draw and edit shapes. This lesson is about where those shapes live. It sounds like bookkeeping. It is the single habit that most clearly separates a professional drawing from an amateur one. A test-stand layout at a launch company might hold concrete, steel, propellant lines, electrical conduit, cameras and safety zones in one file. Layers are what let the plumbing engineer print only the plumbing, and the electrician see only the wiring.

## What a layer holds

Open the **Layer Properties Manager** by typing `LAYER` (alias `LA`). Each row is a layer, and each column is one of its settings:

- **Name** — what the layer is called, like `A-WALL` or `PIPE-LOX`. The name is how people and programs recognize the layer, so it matters more than it looks.
- **On / Off** — whether its objects are shown.
- **Freeze / Thaw** — a stronger kind of hiding, explained below.
- **Lock** — locked objects stay visible, and you can still snap to them, but they cannot be edited. Handy for a background plan you must trace over but never move.
- **Color** — the color its objects display in. AutoCAD's basic colors are numbered in the **[[AutoCAD Color Index|aci-colors]]**, such as 1 for red and 5 for blue.
- **Linetype** — the pattern of the line: solid (`Continuous`), dashed (`HIDDEN`), long-short dash (`CENTER`) and so on. Patterns other than solid must be **[[loaded|loading-linetypes]]** into the drawing before you can use them.
- **Lineweight** — how thick the line prints, in millimeters, such as 0.25 or 0.50.
- **Plot / No Plot** — whether the layer prints at all. A layer can be visible on screen and still be switched off for printing.

There is always one **current layer**. Every new object you draw goes onto it. Change the current layer before you draw, and the new objects land in the right place from the start.

Two layers are special. [[Layer 0|layer-zero]] exists in every drawing and cannot be renamed or deleted. And a layer called **Defpoints** appears the first time you add a dimension. It holds the little points dimensions attach to, and it never prints.

::: key What a layer controls
A layer has a name, a color, a linetype, a lineweight and a plot/no-plot setting, plus visibility (on/off, freeze/thaw) and lock. Objects set to ByLayer take their color, linetype and lineweight from the layer they are on. New objects go on the current layer.
:::

## ByLayer versus per-object overrides

Every object has its own color, linetype and lineweight settings. Out of the box, they are set to the value **ByLayer** — meaning "use whatever my layer says". Change the layer's color from red to green, and every ByLayer object on it turns green at once.

You *can* give a single object its own color instead, through the **Properties** palette. That is a **per-object override**: a setting on the object that ignores the layer. It is tempting. You want one line to stand out, so you make it yellow. Do that a few hundred times across a project and the drawing becomes unmanageable.

Here is why. The Layer Properties Manager shows you every layer's settings in one table. It shows you nothing about overrides. A line on a green layer that has been forced to yellow looks yellow on screen, but no table anywhere tells you it is an exception. Change the layer's color and that line does not follow. Send the file to another company whose system [[translates your layer names|layer-translation]] into their standard, and the overridden objects keep your private colors.

::: key Why layers, not per-object colors
Layers let you control visibility, plotting, linetype and lineweight for a whole category at once, and they survive being shared with another firm whose standards map by layer name. Per-object overrides are invisible in the layer manager and unmanageable at scale.
:::

AutoCAD has tools for cleaning up after someone else. `SETBYLAYER` resets chosen objects' color, linetype and lineweight back to ByLayer. `MATCHPROP` (alias `MA`) copies properties, including the layer, from one object to others. `LAYMCUR` makes the layer of an object you pick the current layer.

::: example What an override really costs
A ground support equipment drawing has 1,200 hidden-edge lines. The customer asks for hidden lines to print heavier: 0.35 mm instead of 0.25 mm.

**Drawn on a layer, ByLayer.** Open the Layer Properties Manager, find the hidden-line layer, change its lineweight to 0.35. One edit. All 1,200 lines change.

**Drawn with per-object overrides.** Each line carries its own 0.25 setting. Selecting "every line with a 0.25 override" is not something the layer manager can do for you, so someone must hunt them down. Suppose it takes only 3 seconds per line. That is $1200 \times 3 = 3600$ seconds, which is $3600 \div 60 = 60$ minutes — an hour of clicking, with a real chance of missing some.

**Sanity check.** The layer route stays one edit whether the drawing has 12 lines or 12,000. The override route grows with every line. That difference is the whole argument for layers.
:::

::: warning The color on screen is not proof
Two lines can look identical on screen, one because its layer is red and one because it was overridden to red. Only the first will follow the layer. When you inherit a drawing, click a few objects and check the Properties palette. If Color says "ByLayer", good. If it says a color name, you have found an override.
:::

## Off versus freeze

Both **Off** and **Freeze** make a layer's objects disappear from the screen and from the printout. So why have two?

Picture your screen as a painting that AutoCAD repaints whenever you zoom or pan a long way. The deep version of that repaint, where AutoCAD recomputes every object's shape on screen, is called a **[[regeneration|regeneration]]** (the `REGEN` command forces one).

- A layer that is **off** is only hidden. AutoCAD still keeps its objects in the regeneration, doing the work, and then does not draw them. Its objects can still be caught by some selections: a Select All, as in `ERASE` then `ALL`, picks up objects on layers that are off. You can delete things you cannot see.
- A layer that is **frozen** is set aside. AutoCAD skips its objects in regeneration, so a huge drawing gets faster. Select All does not pick them up.

Freeze also works **[[per viewport|viewport-freeze]]**. When you lay out a printed sheet (a later lesson), you place several windows onto the drawing, called **viewports**. You can freeze a layer in one viewport and leave it thawed in another — show the electrical layer in the wiring view and hide it in the structural view. There is no per-viewport "off". That is the other big reason freeze exists.

One small rule: you cannot freeze the current layer, because new objects would be drawn onto a layer that is set aside. AutoCAD lets you turn the current layer off, with a warning, which is one more way to draw lines you cannot see.

::: key Freeze versus off
Off only hides a layer; its objects still regenerate and can still be selected by Select All. Freeze hides it and skips it in regeneration, which speeds up large drawings, and it can be applied per viewport. Neither prints. The current layer cannot be frozen.
:::

::: example Freezing to speed up a site plan
A launch-site facility drawing holds 180,000 objects. Of these, 120,000 are the surveyed ground contours and the neighboring buildings, which you do not need while you lay out a new propellant line.

**Turn those layers off.** They vanish from view, but every regeneration still processes all 180,000 objects. Nothing gets faster.

**Freeze them instead.** Regeneration now skips 120,000 objects. What is left is $180000 - 120000 = 60000$, so AutoCAD handles $60000 \div 180000 = 1/3$ of the objects — two thirds less work every time the screen regenerates.

**Sanity check.** The drawing on screen looks exactly the same either way. The difference is only in the work done behind it, and in whether a careless `ERASE ALL` can reach the hidden objects. Freeze wins on both counts.
:::

## Naming layers: a standard, not a mood

A drawing is read by many people and many programs. Some will be at your company. Some will be at an architecture firm, a steel fabricator, or a customer. Layer names are how all of them find things. So teams do not invent names on the day; they follow a written **layer standard**.

In the United States, building and facility drawings commonly follow the **[[US National CAD Standard|national-cad-standard]]**, which includes a layer-naming scheme descended from the American Institute of Architects (AIA) guidelines. Names are built from fields separated by dashes. The first field is a **discipline** letter (A for architectural, E for electrical, M for mechanical, and so on). The second is a **major group** that says what the objects are. So `A-WALL` holds architectural walls and `A-DOOR` holds doors. Further fields can narrow the group or say the status of the work. Many aerospace companies use a scheme like this for their facility drawings, and their own internal scheme for everything else.

Whatever the standard, the habits are the same:

- Name layers by **what the objects are**, not what they look like. `PIPE-LOX` stays right when its color changes; `RED-LINES` does not.
- Keep construction lines and notes-to-self on a layer set to **No Plot**, so they never reach the printed sheet.
- Draw on layers with color, linetype and lineweight all set **ByLayer**, and leave overrides for rare, deliberate exceptions.

::: example Setting up layers for a test-stand layout
You are starting a plan view of an engine test stand. Your company standard gives you this table, and you create each row in the Layer Properties Manager:

| Layer | Color | Linetype | Lineweight | Plot |
|---|---|---|---|---|
| S-STEL | 7 | Continuous | 0.50 mm | Yes |
| P-LOX | 5 | Continuous | 0.35 mm | Yes |
| E-COND | 1 | HIDDEN | 0.25 mm | Yes |
| G-CNTR | 3 | CENTER | 0.18 mm | Yes |
| G-CONS | 8 | Continuous | 0.13 mm | No |

**Step 1.** Load `HIDDEN` and `CENTER` into the drawing with the `LINETYPE` command, because only `Continuous` is there by default.

**Step 2.** Create the five layers and set each column. The steel frame prints heaviest at 0.50 mm. The oxygen line prints at 0.35. Buried conduit is dashed, because it is hidden under the slab. Center lines are the thinnest printed lines at 0.18. Construction geometry is set to No Plot.

**Step 3.** Make `G-CONS` current and sketch the construction grid. Then make `S-STEL` current and draw the frame over it, and so on.

**Check.** The heaviest printed line, 0.50 mm, is $0.50 \div 0.25 = 2$ times the hidden-line weight, matching the thick-to-thin pattern from the drawing-literacy module. When you print, `G-CONS` does not appear even though it is on screen, because its plot setting is off.
:::

## Check yourself

::: check
A colleague turned off the layer holding an old site survey. Later they ran `ERASE`, typed `ALL`, and pressed Enter to clear a sketch. What might have gone wrong, and what should they have done instead?
:::

::: answer
Select All picks up objects on layers that are off, so the hidden survey was erased along with the sketch. Had the survey layer been frozen (or locked), Select All would not have deleted it. Freeze layers you want set aside, and check what is selected before you erase.
:::

::: check
A line sits on layer `P-LOX`, which is blue. Its Properties palette shows Color = Red, Linetype = ByLayer. Someone changes `P-LOX` to green and to a dashed linetype. What does the line look like now?
:::

::: answer
Red and dashed. Its color is a per-object override, so it ignores the layer and stays red. Its linetype is ByLayer, so it follows the layer and becomes dashed. This half-and-half result is exactly the confusion overrides cause.
:::

::: check
On one printed sheet you want the electrical layer shown in the left view and hidden in the right view. Which layer setting can do that, and why can the other hiding setting not?
:::

::: answer
Freeze, applied in the right viewport only (viewport freeze). Freezing can be set separately per viewport. Off is a single switch for the whole drawing, so it would hide the electrical layer in both views.
:::

::: check
Give two reasons a team names a layer `E-COND` rather than `RED-DASHED`.
:::

::: answer
First, the name should say what the objects are, so it stays correct when the color or linetype changes. Second, other firms and programs map layers by name to their own standards; a name that follows a shared scheme, with a discipline letter and a major group, can be translated, while a name describing appearance tells them nothing.
:::

::: check
You want to hide the layer you are drawing on so you can see what is underneath. AutoCAD refuses to freeze it. Why, and what are your options?
:::

::: answer
The current layer cannot be frozen, because new objects are drawn onto it and a frozen layer is set aside entirely. Make a different layer current first and then freeze it. You could turn the current layer off instead, but then anything new you draw is invisible, which is a trap.
:::

## Summary

| Setting | What it does | Remember |
|---|---|---|
| Name | Identifies the category | Say what the objects are; follow a standard |
| Color, linetype, lineweight | Look on screen and on paper | Objects set to ByLayer follow the layer |
| Plot / No Plot | Whether the layer prints | Construction geometry goes on a no-plot layer |
| Off | Hidden, still regenerated, still caught by Select All | One switch for the whole drawing |
| Freeze | Hidden and skipped in regeneration | Faster; works per viewport; not the current layer |
| Lock | Visible but not editable | Protects backgrounds |
| Override | A setting on one object that ignores its layer | Invisible in the layer manager; avoid |

The next lesson builds on layers with blocks and external references: reusable symbols and whole drawings linked into yours, where the layer an object sits on decides how it behaves inside the block.

::: context overlay-drafting Layers before computers
Before CAD, big engineering and architecture offices drew on sheets of clear drafting film punched along one edge. A metal pin bar held every sheet in exact register, so the structure, the plumbing and the electrical could be drawn on separate sheets and combined in any mix when printed. CAD layers copied that idea and made it free: no film, no pins, and as many sheets as you like.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="60,130 220,130 280,100 120,100" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="60,95 220,95 280,65 120,65" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="60,60 220,60 280,30 120,30" fill="#f2b880" fill-opacity="0.35" stroke="#b4232c" stroke-width="1.5"/>
  <text x="290" y="120" font-size="11" fill="#1f2a44">S-STEL</text>
  <text x="290" y="85" font-size="11" fill="#1d6fd1">P-LOX</text>
  <text x="290" y="50" font-size="11" fill="#b4232c">E-COND</text>
  <text x="60" y="158" font-size="11" fill="#1f2a44">each layer a clear sheet, all in register</text>
</svg>
```
:::

::: context aci-colors Colors by number
The AutoCAD Color Index has 255 numbered colors. The first seven are the ones everyone memorizes: 1 red, 2 yellow, 3 green, 4 cyan, 5 blue, 6 magenta, and 7, which shows as white on a dark background and black on a light one. Why numbers instead of names? Partly history, and partly printing: for many years, companies mapped each color number to a pen thickness at print time, so the color a drafter picked also decided how thick the line printed. You will meet that system as plot styles in a later lesson.
:::

::: context loading-linetypes Patterns live in a library file
A new drawing knows only a few linetypes, including `Continuous`. The dashed and dotted patterns sit in a library file that ships with AutoCAD, and the `LINETYPE` command loads the ones you need into your drawing. Each pattern is a short list of dash and gap lengths. The `LTSCALE` setting stretches all of them at once, which is why a drawing sometimes shows hidden lines as solid: the dashes are so long, or so short, that you cannot see the gaps at your zoom. Adjusting the scale fixes it.
:::

::: context layer-zero The layer that belongs to no one
Layer 0 is special because of blocks, the reusable symbols of the next lesson. An object drawn on layer 0 inside a block takes on the layer the block is inserted on, with that layer's color, linetype and lineweight. That makes layer 0 the right place for the insides of a symbol, and the wrong place for ordinary drawing. A drawing with everything on layer 0 has, in effect, no layers at all.
:::

::: context layer-translation How firms swap drawings
When a contractor sends drawings to a customer with a different standard, someone maps each incoming layer name to a house name, for instance "the contractor's WALLS becomes our A-WALL". AutoCAD's `LAYTRANS` command does this in bulk and can save the mapping for next time, and standards files, which a later lesson covers, can check a drawing against the rules. Both work on layer names and layer settings. Neither can see a color someone forced onto a single object, which is why overrides survive the trip untouched and end up looking wrong.
:::

::: context regeneration Repainting versus recomputing
AutoCAD keeps two versions of your drawing. One is the exact geometry, stored with full precision. The other is a simplified picture for the screen, where each circle is really a many-sided polygon. A small zoom only repaints that picture. A regeneration rebuilds the picture from the exact geometry, object by object, which on a drawing with hundreds of thousands of objects is slow enough to notice. Freezing a layer takes its objects out of that rebuild.
:::

::: context viewport-freeze One layer, two views
On a printed sheet, each viewport is a window onto the same model. Viewport freeze lets each window keep its own list of frozen layers. Below, the electrical layer shows in the left viewport and is frozen in the right one. The model itself is untouched: both windows look at the same objects.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="150" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="25" y="25" width="150" height="105" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <rect x="185" y="25" width="150" height="105" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <rect x="50" y="45" width="100" height="65" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <polyline points="60,100 60,60 140,60 140,100" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <rect x="210" y="45" width="100" height="65" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="100" y="147" font-size="11" text-anchor="middle" fill="#1f2a44">E-COND thawed</text>
  <text x="260" y="147" font-size="11" text-anchor="middle" fill="#1f2a44">E-COND frozen here</text>
</svg>
```
:::

::: context national-cad-standard A shared vocabulary for buildings
The United States National CAD Standard is published by the National Institute of Building Sciences and brings together several documents, including the AIA CAD Layer Guidelines, that tell architects and engineers how to name layers, organize sheets and draw symbols. It is aimed at buildings, so it fits the facility side of aerospace — test stands, hangars, launch pads — rather than the vehicle. Treat it as one well-known example. Your employer's own CAD manual, which may borrow from it, is what you actually follow on the job.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="80" y="20" width="44" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="102" y="47" font-size="20" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="138" y="47" font-size="20" text-anchor="middle" fill="#1f2a44">-</text>
  <rect x="152" y="20" width="110" height="40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="207" y="47" font-size="20" text-anchor="middle" fill="#1f2a44">WALL</text>
  <text x="102" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">discipline</text>
  <text x="207" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">major group</text>
  <text x="180" y="108" font-size="11" text-anchor="middle" fill="#6c7a93">more fields may follow for detail or status</text>
</svg>
```
:::
