---
id: l04-blocks-and-xrefs
title: Blocks, attributes and external references
minutes: 24
covers:
  - Blocks, attributes, dynamic blocks and external references
---

Think about a rubber stamp. Somebody carves the picture once — a star, a school crest, a "PAID" sign. After that you can stamp it a hundred times, on any page, at any angle. And if the school ever changes its crest, you carve one new stamp, not a hundred new drawings.

Now picture a shared class photo that hangs in the hallway. Every classroom does not keep its own copy. Each room has a note that says "see the photo in the hallway". When the photo is replaced, every note points at the new one at once.

AutoCAD has both ideas. The rubber stamp is a **block**. The note that points at a shared picture is an **external reference**. On a launch site, one P&ID can hold dozens of identical valve symbols, and one site plan can sit underneath twenty different sheets. Last lesson you controlled things by category with layers. This lesson is about drawing a thing once and using it everywhere, so one change shows up everywhere too.

## Blocks: define once, insert many

A **block** is a named group of objects that AutoCAD stores once and treats as a single object. There are two parts to it, and keeping them apart is the whole trick.

- The **[[block definition|definition-and-reference]]** is the stamp itself: the lines, arcs and text, stored once inside the drawing file under a name like `VALVE-BALL`.
- A **block reference** is one stamp mark: an object that says "draw the definition called `VALVE-BALL` here, at this size, turned this way". It stores only an insertion point, a scale and a rotation.

You make a definition with the **BLOCK** command (alias B) and place references with **INSERT** (alias I). In recent versions INSERT opens a Blocks palette. Putting a hyphen in front, as in `-BLOCK` or `-INSERT`, runs the same command on the command line with no dialog box, which is the clearest way to see what it asks.

```text
Command: -BLOCK
Enter block name or [?]: VALVE-BALL
Specify insertion base point or [Annotative]: CEN
of  (click the valve circle)
Select objects: (pick the valve lines and circle)
Select objects: (Enter)
Command: -INSERT
Enter block name or [?]: VALVE-BALL
Specify insertion point or [Basepoint/Scale/X/Y/Z/Rotate]: 420,180
Enter X scale factor, specify opposite corner, or [Corner/XYZ] <1>: (Enter)
Enter Y scale factor <use X scale factor>: (Enter)
Specify rotation angle <0>: 90
```

A block reference selects, moves and deletes as one object. To change the stamp itself, open the **Block Editor** with **BEDIT** (alias BE), change the definition, and close it with **BCLOSE**. Every reference in the drawing redraws with the new shape.

A block made with BLOCK lives inside one drawing. **WBLOCK** (alias W, "write block") saves a block as its own drawing file, so others can insert it. A company's symbol library is usually a folder of these files.

::: key Blocks
A block is defined once (BLOCK) and inserted many times (INSERT). The definition holds the geometry; each reference holds only an insertion point, scale and rotation. Edit the definition (BEDIT) and every reference updates. WBLOCK writes a block out as its own drawing file.
:::

::: warning Exploding a block
**EXPLODE** (alias X) breaks a block reference back into loose lines. It is sometimes useful, but an exploded symbol is no longer connected to its definition. When the symbol is later updated, the exploded ones stay old, and nobody can tell by looking. If you need a slightly different symbol, make a new block or a dynamic block, not an exploded one.
:::

::: example Thirty-six valves on one P&ID
A propellant-loading P&ID shows 36 identical ball valves. The valve symbol is 14 objects: lines for the body, a circle for the ball, lines for the handle.

**Drawn as copies.** Each copy is 14 separate objects, so the drawing holds

$$
14 \times 36 = 504 \text{ objects}.
$$

**Drawn as a block.** The 14 objects are stored once in the definition, and there are 36 references. That is

$$
14 + 36 = 50 \text{ objects}.
$$

Now the handle must be drawn at a new angle. With copies you must find and fix all 36, and it is easy to miss one. With the block you open BEDIT, move one line, close it, and all 36 update.

**Sanity check.** The block version holds about a tenth as many objects, and the saving grows with every extra valve: each new copy would add 14 objects, each new reference adds 1.
:::

## The base point: where the stamp is held

When you insert a block, the cursor holds it by one spot. That spot is the **base point** — the point in the definition that lands exactly on the insertion point you give. In the transcript above, the base point was the center of the valve circle, so typing `420,180` put the valve's center at $(420, 180)$.

Choose the base point where the symbol will be **[[attached|choosing-a-base-point]]** to the rest of the drawing: the center of a valve, the bottom-left corner of a title block. A good base point lets you snap straight to a pipe end. A bad one means every insertion lands offset.

Rotation and scale also happen about the base point, so it is the pivot too.

## Layer 0 and ByBlock: how a block takes on color

Blocks meet layers in a way that surprises almost everyone the first time. The rule depends on which layer each object was on when you made the definition.

- An object drawn on a **named layer**, like `PIPE`, stays on `PIPE` wherever the reference goes. Its color and linetype come from `PIPE`.
- An object drawn on **[[layer 0|layer-zero]]** — the one layer every drawing has and nobody can delete — takes on the layer of the reference. Insert the block on `VALVES-LOX` and those parts behave as if drawn on `VALVES-LOX`, with its color, linetype and lineweight.
- An object whose color (or linetype, or lineweight) is set to **ByBlock** takes that property from the reference itself, whatever it is set to on the reference.

The usual professional habit is to draw symbol geometry on layer 0 with its properties left **ByLayer** (take them from the layer). Then one valve block can be red on the oxygen layer and blue on the fuel layer, and the layer manager controls it like everything else from last lesson.

::: key Layer 0 inside a block
Geometry drawn on layer 0 inside a block takes on the layer of the block reference. Geometry on a named layer keeps that layer. A ByBlock property is taken from the reference. Draw reusable symbols on layer 0, ByLayer.
:::

::: warning Frozen versus off, again
Freezing the layer a block reference sits on hides the whole block. Turning that same layer off hides only the parts that were drawn on layer 0. Parts drawn on named layers stay on screen. If half a symbol refuses to disappear, this is why.
:::

## Attributes: blocks that carry data

A stamp that always says the same thing is limited. Often each copy needs its own words: this valve is `HV-104`, that one is `HV-105`. An **attribute** is a labeled text field inside a block whose value you fill in each time you insert it.

You make one with **ATTDEF** (alias ATT) before you make the block. It asks for three things:

- the **tag** — the field's name, with no spaces, like `PART_NO`;
- the **prompt** — the question asked at insertion, like "Part number?";
- the **default** — the value offered if you press Enter.

Include the attribute definitions in the objects you select for BLOCK. From then on, every INSERT asks the prompts and stores your answers in that reference. Double-clicking a placed block opens the **Enhanced Attribute Editor** (the command **EATTEDIT**) to change the values later.

Two uses cover most real drawings.

- **Title blocks.** The **[[title block|title-block-fields]]** you learned to read in the drawing-literacy module is almost always a block with attributes: `DWG_NO`, `TITLE`, `REV`, `DRAWN_BY`, `DATE`, `SCALE`.
- **Part and equipment tags.** A tooling layout tags each fixture with its part number, quantity and mass. A P&ID tags each valve with its identifier, size and type.

If you later add or change an attribute in the definition, existing references do not pick it up by themselves. The **ATTSYNC** command pushes the new attribute layout to them, and the **Block Attribute Manager** (**BATTMAN**) lets you edit, reorder and synchronize attribute definitions in one place.

### Pulling the data back out

Because the values are data, AutoCAD can collect them. **DATAEXTRACTION** walks you through picking which blocks and which attributes to read, then writes the result into an AutoCAD **table** on the sheet, into a spreadsheet file, or both. A tagged tooling layout becomes a parts list with no retyping.

::: key Attributes
An attribute (ATTDEF) is a named field in a block: tag, prompt, default. Each reference stores its own value. Title blocks and part tags are blocks with attributes. DATAEXTRACTION reads attribute values into a table or a spreadsheet.
:::

::: example A parts table from tags
A tooling layout for a stage-handling fixture has 12 tagged items. Each tag block carries `PART_NO`, `QTY` and `MASS_KG`. DATAEXTRACTION counts identical part numbers and builds this table:

| Part number | Quantity | Mass each (kg) | Total mass (kg) |
|---|---|---|---|
| TL-101 clamp | 4 | 0.85 | 3.40 |
| TL-205 locator pin | 6 | 0.12 | 0.72 |
| TL-310 base plate | 2 | 14.6 | 29.20 |

Work each row: quantity times mass each. $4 \times 0.85 = 3.40$ kg, $6 \times 0.12 = 0.72$ kg, $2 \times 14.6 = 29.20$ kg. Add the rows:

$$
3.40 + 0.72 + 29.20 = 33.32 \text{ kg}.
$$

The quantities add to $4 + 6 + 2 = 12$, which matches the 12 tags on the sheet.

**Sanity check.** The two base plates make up almost all the mass, as heavy plates should. A tag copied without changing its `PART_NO` would show up here as a wrong count.
:::

## Dynamic blocks: one block, many shapes

Suppose you need strut channel in eight lengths, or a valve symbol in three types. A **dynamic block** is one block with built-in handles that change its shape or look, within rules you set.

You build it in the Block Editor with two kinds of pieces that work in pairs.

- A **parameter** says *what can change*: a length (linear parameter), an angle (rotation parameter), a mirror (flip parameter), a position (point or XY parameter).
- An **action** says *what happens to the geometry* when that parameter changes: stretch, move, scale, rotate, flip, array.

So a linear parameter along a channel, paired with a stretch action on its end, gives a channel you can drag longer or shorter with a **[[grip|grips]]**. You can add a **value set** so it only snaps to allowed lengths, such as 300, 600 and 900 mm.

A **visibility parameter** is the one that needs no action. It holds a list of **visibility states**, each a named choice of which pieces show. One `VALVE` block with states `BALL`, `GATE` and `CHECK` shows a small drop-down arrow when selected; pick a state and the symbol changes, while its attributes, layer and base point stay put.

::: key Dynamic blocks
A dynamic block pairs parameters (what can change) with actions (what the geometry does). A visibility parameter switches between named visibility states. One dynamic block replaces a family of nearly identical blocks.
:::

## External references: a live link to another file

Blocks live inside one drawing. An **external reference**, or **xref**, is a whole other drawing file shown inside yours, without being copied in. Your drawing stores only a pointer: the file's name, its path, and where to place it.

The classic case on a launch site is the **site plan**. One drawing holds the roads, the pads, the buildings and the property lines. Then twenty other sheets — the electrical layout, the propellant piping, the fence plan, the lightning protection — each xref that site plan as their background. Each discipline draws its own work on top, in its own file.

You attach one with **XATTACH** (alias XA), and you manage all of them in the **External References palette**, opened with **XREF** (alias XR). The palette lists each xref with its status: Loaded, Unloaded, Not Found, or Needs Reloading.

### The benefit: one change, every sheet

Because the link is live, when the civil engineer moves a road in the site plan and saves, every sheet that references it shows the new road when next opened or reloaded. Everyone draws on top of the current site.

The xref's layers come along too, with the file name in front, like `SITE-PLAN|ROADS`. You can freeze or recolor them in your drawing without touching the original file.

### Attach versus overlay

When you attach an xref you choose one of two types. The difference only matters when xrefs are **[[nested|attach-versus-overlay]]** — when your drawing is itself xref'd by somebody else.

- **Attach**: the xref travels along. If the piping plan attaches the site plan, and the master sheet then attaches the piping plan, the site plan shows up on the master sheet too.
- **Overlay**: the xref stays behind. If the piping plan overlays the site plan, anyone who references the piping plan sees only the piping.

Overlay is the safer choice for background you only look at. It stops the same site plan arriving twice by two routes, and it prevents circular references, where two drawings each contain the other.

### The danger: the broken path

The pointer is a file path. Move the site plan, rename it, or email your drawing without it, and the link breaks. The palette marks the xref **Not Found**, and the site plan is missing from your sheet. A sheet can even be plotted and sent out that way without anyone noticing.

AutoCAD can store the path three ways:

- a **full path**, such as `C:\Projects\Pad39\Site\SITE-PLAN.dwg`, which breaks when the project folder moves;
- a **relative path**, such as `..\Site\SITE-PLAN.dwg` ("go up one folder, then into Site"), which survives moving the whole project folder together;
- **no path**, which makes AutoCAD look in the host drawing's own folder and its search paths.

Relative paths are the usual office standard. To send drawings outside, use **ETRANSMIT**, which gathers the drawing, its xrefs, fonts and plot style files into one package. And when a set is finally issued, the xrefs are often **bound** — turned into ordinary blocks inside the drawing — so the issued sheet can never change underneath the signature.

::: key External references
An xref is another drawing shown live inside yours: one site plan referenced by many sheets, so a change in it appears on all of them. Attach nests (it travels when your drawing is referenced); overlay does not. A moved or renamed file breaks the path and the xref goes Not Found. Relative paths and ETRANSMIT protect against that.
:::

::: example One road moves
A site plan is xref'd by 9 sheets. The civil team moves an access road 3 m east.

**With the xref.** One person edits one file. When the 9 sheets are reopened or reloaded, all 9 show the road in its new place. Number of edits: 1.

**Without it** (the site plan copied into each sheet): the same 3 m move must be made in 9 files. Number of edits: 9, and 9 chances to get one wrong.

Now the danger. Someone renames the file to `SITE-PLAN-REV-C.dwg`. All 9 xrefs go Not Found at once, and all 9 sheets lose their background. The fix is to keep the file name fixed and track the revision inside the title block, or to repoint each xref in the palette.

**Sanity check.** The live link turned 9 edits into 1, and a careless rename turned 1 file problem into 9 broken sheets. Same mechanism, both directions.
:::

## Check yourself

::: check
A drawing has 120 references to a connector block whose definition has 22 objects. How many objects is that, and how many would 120 exploded copies be?
:::

::: answer
As a block: $22$ objects in the definition plus $120$ references, so $22 + 120 = 142$. As exploded copies: $22 \times 120 = 2640$ objects. And the exploded copies can no longer be updated from one definition.
:::

::: check
You insert a valve block on the layer `VALVES-FUEL`, which is blue. The valve body was drawn on layer 0, ByLayer, and its label was drawn on a layer called `TEXT`, which is white. What colors do they show?
:::

::: answer
The body, drawn on layer 0, takes on the reference's layer, `VALVES-FUEL`, so it shows blue. The label stays on its own named layer, `TEXT`, so it shows white. If you froze `VALVES-FUEL`, both would disappear; if you only turned it off, the body would disappear and the label would stay.
:::

::: check
Your title block has attributes for drawing number, title, revision and date. The standard changes and a new field, `CHECKED_BY`, is added to the definition in the Block Editor. The 40 sheets already issued do not show it. Why, and what fixes it?
:::

::: answer
Existing references keep the attributes they were inserted with; editing the definition does not add new attribute fields to them by itself. Running ATTSYNC on that block (or synchronizing from the Block Attribute Manager, BATTMAN) pushes the new attribute layout to every reference, after which each sheet can be given its `CHECKED_BY` value.
:::

::: check
What is the difference between a parameter and an action in a dynamic block? Give one pair.
:::

::: answer
A parameter defines what can change and gives the grip you drag, such as a length. An action defines what the geometry does when the parameter changes, such as stretching one end. A linear parameter paired with a stretch action makes a channel whose length you can drag. A visibility parameter is the exception that needs no action: it switches between named visibility states.
:::

::: check
The electrical plan attaches the site plan. A master sheet overlays the electrical plan. Does the site plan appear on the master sheet? What if the electrical plan had overlaid the site plan and the master sheet attached the electrical plan?
:::

::: answer
First case: yes. The electrical plan attached the site plan, so the site plan is nested inside it and travels along; how the master sheet brings in the electrical plan does not change that. Second case: no. The electrical plan only overlaid the site plan, and an overlay stays behind when its host is referenced, so the master sheet sees the electrical work without the site plan.
:::

## Summary

| Idea | Command | What to remember |
|---|---|---|
| Block definition | BLOCK, WBLOCK | Geometry stored once, under a name |
| Block reference | INSERT | Only an insertion point, scale and rotation |
| Edit a block | BEDIT, BCLOSE | Every reference updates |
| Base point | set in BLOCK | Where the block is held and pivots |
| Layer 0 in a block | — | Takes on the reference's layer; ByBlock takes the reference's property |
| Attribute | ATTDEF, EATTEDIT, ATTSYNC, BATTMAN | Tag, prompt, default; one value per reference |
| Extract attributes | DATAEXTRACTION | Values into a table or spreadsheet |
| Dynamic block | Block Editor | Parameter plus action; visibility states |
| External reference | XATTACH, XREF | Live link to another file; attach nests, overlay does not |
| Broken path | ETRANSMIT, relative paths | Moved or renamed file goes Not Found |

You can now draw a symbol once and reuse it, and share one site plan across a whole set. Next lesson puts words and dimensions on those drawings and sends them to paper: text and dimension styles, model space and paper space, viewports and scale.

::: context definition-and-reference The stamp and its marks
The definition lives in a hidden list inside the drawing file called the block table. It holds the geometry once. Each reference on the sheet is small: a name, a point, a scale and a rotation. You can see the definitions in a drawing, even ones no longer used, with the PURGE command, which also deletes the unused ones to tidy the file.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="30" width="110" height="100" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="69" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">definition (once)</text>
  <polygon points="34,62 69,80 34,98" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="104,62 69,80 104,98" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="69" cy="80" r="3" fill="#b4232c"/>
  <text x="69" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">VALVE-BALL</text>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3">
    <line x1="124" y1="80" x2="190" y2="45"/><line x1="124" y1="80" x2="190" y2="80"/><line x1="124" y1="80" x2="190" y2="120"/>
  </g>
  <g fill="#1f2a44" font-size="11">
    <text x="196" y="49">reference: at 420,180, rot 90</text>
    <text x="196" y="84">reference: at 610,180, rot 0</text>
    <text x="196" y="124">reference: at 610,95, rot 0</text>
  </g>
  <text x="14" y="152" font-size="11" fill="#b4232c">red dot = base point</text>
</svg>
```
:::

::: context choosing-a-base-point Pick the spot you will snap to
Ask yourself: when I place this symbol, which of its points do I line up with something? For an inline valve, its center sits on the pipe. For a title block, its lower-left corner sits on the sheet's border corner. For a pump symbol, its inlet sits on the pipe end. Make that point the base point and every insertion is one snap. The mistake to avoid is leaving the base point at the drawing origin $(0,0)$ while the symbol was drawn far away: the block then arrives hanging off the cursor at a distance.
:::

::: context layer-zero Why layer 0 is special
Every AutoCAD drawing starts with layer 0, and it can be neither deleted nor renamed. Its special role in blocks is the reason experienced drafters say "never draw real work on layer 0": anything on it is meant to be a chameleon that takes its identity from wherever the block is placed. Drawing ordinary linework on 0 defeats that and makes layer control confusing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">on VALVES-LOX</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">on VALVES-FUEL</text>
  <polygon points="35,50 70,70 35,90" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="105,50 70,70 105,90" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="235,50 270,70 235,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="305,50 270,70 305,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="70" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">HV-104</text>
  <text x="270" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">HV-211</text>
  <text x="180" y="134" font-size="11" text-anchor="middle" fill="#6c7a93">same block; body drawn on layer 0, label on TEXT</text>
</svg>
```
:::

::: context title-block-fields The same title block on every sheet
In the drawing-literacy module the title block was the legal heart of a drawing: number, title, revision, approvals. In AutoCAD it is almost always one company block with attributes, inserted in paper space on every sheet. The attribute values can also be filled automatically from fields — small live codes that read the file name, the plot date or, in a sheet set, the sheet number — so the title block cannot quietly disagree with the file it sits in.
:::

::: context grips The little squares you drag
A grip is a small handle that appears on an object when you select it without a command running. On a plain line, grips sit at the ends and the middle, and dragging one stretches or moves the line. A dynamic block adds its own special grips — arrows for a length, a circle for a rotation, a triangle drop-down for visibility states — which is how the person using the block changes it without ever opening the Block Editor.
:::

::: context attach-versus-overlay Who carries whom
With attach, a reference brings its own references along, like a box packed inside a box. With overlay, a reference is only seen by the drawing that directly holds it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <rect x="20" y="20" width="90" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="65" y="38">SITE</text>
    <rect x="20" y="75" width="90" height="28" fill="#fff" stroke="#1f2a44"/><text x="65" y="93">ELECTRICAL</text>
    <rect x="20" y="130" width="90" height="28" fill="#fff" stroke="#1f2a44"/><text x="65" y="148">MASTER</text>
    <rect x="200" y="20" width="90" height="28" fill="#8fb8f0" stroke="#1f2a44"/><text x="245" y="38">SITE</text>
    <rect x="200" y="75" width="90" height="28" fill="#fff" stroke="#1f2a44"/><text x="245" y="93">ELECTRICAL</text>
    <rect x="200" y="130" width="90" height="28" fill="#fff" stroke="#1f2a44"/><text x="245" y="148">MASTER</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="65" y1="48" x2="65" y2="75"/><line x1="65" y1="103" x2="65" y2="130"/>
    <line x1="245" y1="48" x2="245" y2="75" stroke-dasharray="4 3"/><line x1="245" y1="103" x2="245" y2="130"/>
  </g>
  <g font-size="11">
    <text x="72" y="66" fill="#1d6fd1">attach</text>
    <text x="252" y="66" fill="#b4232c">overlay</text>
    <text x="120" y="148" fill="#1d6fd1">sees SITE</text>
    <text x="300" y="148" fill="#b4232c">no SITE</text>
  </g>
</svg>
```
:::
