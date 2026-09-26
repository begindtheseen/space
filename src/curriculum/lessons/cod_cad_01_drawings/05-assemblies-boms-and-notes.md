---
id: l05-assemblies-boms-and-notes
title: Assemblies, parts lists and the notes that go with them
minutes: 20
covers:
  - Bills of material, item balloons and find numbers
  - General notes and flag notes
---

Open the booklet that comes with a big LEGO set. The first page lists every piece in the box, with a small picture and a count: "2 ×" beside a red brick, "8 ×" beside a small grey plate. Each step then shows a picture of the model with arrows pointing at the pieces you add now. Somewhere there is also fine print: "Adult supervision required", "Press firmly until you hear a click."

An **assembly drawing** — a drawing of a unit made of several parts joined together — works the same way. It has a list of every part that goes in, with how many of each. It has numbered circles pointing at those parts in the views. And it has written instructions, some for the whole drawing and some for one spot only.

On a spacecraft, this is how a reaction-wheel mount, a star-tracker bracket or a propellant valve gets built by a technician who never spoke to the designer. This lesson covers those three pieces: the **bill of material**, the **item balloons** with their **find numbers**, and the **general notes** and **flag notes**.

## Detail drawings and assembly drawings

So far this module has looked at **detail drawings**: one drawing for one part, with every dimension needed to make it. A bracket, a spacer, a shaft.

An assembly drawing is different. It does not tell you how to machine the bracket. That is the bracket's own detail drawing. Instead, it tells you *which* parts go together, *where* each one goes, and *how* to join them: which screws, what torque, what adhesive. Its dimensions are only the ones that matter for putting things together, such as a gap to check after assembly.

Assemblies nest. A screw and a washer go into a wheel mount. Four wheel mounts go onto a panel. The panel goes into the spacecraft. Each level usually has its own assembly drawing, and the lower level appears on the higher one as a single item.

## The bill of material

A **bill of material** (BOM, said "bomb" or "B-O-M"), also called a **parts list**, is the table on an assembly drawing that lists every item in the assembly. It is the LEGO inventory page. A typical BOM has these columns:

| FIND NO. | QTY | PART NUMBER | DESCRIPTION | MATERIAL / SPEC |
| --- | --- | --- | --- | --- |
| 1 | 1 | 200-1180 | BRACKET, WHEEL MOUNT | ALUMINUM 6061-T6 |
| 2 | 1 | 300-0457 | REACTION WHEEL | (PURCHASED) |
| 3 | 6 | 400-5012 | SCREW, CAP, M5 X 16 | (STANDARD PART) |
| 4 | 6 | 400-7003 | WASHER, FLAT, M5 | (STANDARD PART) |
| 5 | AR | 500-0021 | ADHESIVE, THREADLOCKING | (PER SPEC) |

Each column earns its place:

- **Find number** (also called **item number**) — a short number that names this line within *this* drawing.
- **Quantity** — how many of that item go into *one* of this assembly.
- **Part number** — the item's unique name across the whole company. It points to that part's own drawing or its purchase specification.
- **Description** — the plain name, written noun first like titles are.
- **Material or specification** — for made parts, the material; for [[bought parts|purchased-parts]], the spec they are bought to.

Some quantities are not a count. **AR** means "as required": adhesive, lockwire, shims — things you use until the job is done. You may also see **REF**, "reference only", for an item shown for context but not supplied by this assembly.

### Levels and the indented BOM

Because assemblies nest, their BOMs nest too. When you list the whole tree at once, each level is pushed further right, like an outline. That is an **[[indented BOM|indented-bom]]**. The top of the tree is the finished unit; the bottom rows are single parts you can buy or machine.

The key rule for reading one: **quantities multiply down the tree**. The "6 screws" on the wheel mount means six per mount. If the next level up uses four mounts, that is twenty-four screws.

::: example How many screws for three spacecraft?
A wheel-array assembly has these items: find 1, one panel; find 2, four wheel-mount assemblies; find 3, sixteen M6 screws; find 4, sixteen M6 washers. Each wheel-mount assembly (the table above) holds six M5 screws and six M5 washers. The program is building three spacecraft, each with one wheel array. How many screws of both sizes must be ordered, before spares?

Start at one wheel array.

M6 screws, straight from the top-level BOM: $16$.

M5 screws: $6$ per mount, times $4$ mounts: $6 \times 4 = 24$.

Screws in one array: $16 + 24 = 40$.

Three spacecraft each need one array: $40 \times 3 = 120$ screws.

Split by size: $16 \times 3 = 48$ M6 screws and $24 \times 3 = 72$ M5 screws. Check: $48 + 72 = 120$. The same numbers give $120$ washers, because every screw here has a washer. Sanity check: the M5 count is bigger even though the top level never mentions M5 at all — they are hiding one level down, which is exactly why you multiply through the tree.
:::

::: warning Quantity is per one parent
A BOM quantity is how many go into *one* of the assembly it sits on — never the total for the program. Forgetting to multiply by the parent's quantity is the classic ordering mistake. It shows up as an assembly line that stops because it is 18 screws short.
:::

## Item balloons and find numbers

A table of parts is not enough. The technician also needs to know *which* thing in the picture is find 3. That is the job of an **item balloon**: a small circle with the find number inside, connected by a thin line called a **leader** to the part it names.

The leader ends with an arrowhead if it touches an edge of the part, or with a small **[[dot|balloon-dot]]** if it lands inside a surface of the part. Balloons are usually lined up neatly in rows or columns around the view, so the eye can scan them.

Some rules of the road:

- **One balloon per item, not per piece.** Six identical screws get one balloon with "3" in it, pointed at one of them. The count lives in the BOM's quantity column, not in how many balloons you draw.
- **Every BOM line has a balloon** somewhere on the drawing, and every balloon has a BOM line. A checker verifies both directions.
- **The find number never changes meaning within a drawing.** If find 3 is deleted in a later revision, many companies retire the number rather than reuse it, so "find 3" never means two different things in the history.

Why a separate find number when every item already has a part number? Part numbers are long, and they can change — a supplier's screw is replaced by an equivalent from another supplier, and the part number in the row changes. The find number stays. The technician on the floor, the buyer in procurement and the inspector checking the build can all say "find 3" and mean the same row. It is the drawing's version of a **[[stable identifier|stable-id]]**.

::: key
Item balloons and find numbers tie each component in an assembly view to a line in the bill of material, so procurement, the shop floor and the inspector all refer to the same item. It is the drawing equivalent of a stable identifier.
:::

::: example Checking balloons against the BOM
A checker reviews the wheel-mount assembly drawing. The BOM has five lines, finds 1 to 5. On the views she finds balloons with the numbers 1, 2, 3, 3, 4. What is wrong?

List the find numbers that have at least one balloon: 1, 2, 3, 4. That is $4$ of the $5$ lines. Find 5, the threadlocking adhesive, has no balloon, so nobody reading the picture knows where the adhesive goes.

Find 3 has two balloons. That is allowed only if the screws appear in two different views; within one view, a second balloon for the same item is clutter.

So the drawing goes back with one required fix (add a balloon for find 5, usually pointing at the screw threads, often together with a note that says how to apply it) and one question (why two balloons for find 3?). Sanity check: a complete drawing has every one of the $5$ lines ballooned at least once, and $5 - 4 = 1$ line is missing here.
:::

::: warning The balloon is not the quantity
Seeing one balloon on six screws, beginners order one screw. Seeing three balloons for the same bracket in three views, they order three brackets. Always take the quantity from the BOM, never from counting balloons.
:::

### Why a GNC engineer cares

You will hear find numbers in real conversations. "The shim at find 12 on the tracker bracket assembly" is how a mechanical engineer tells you where an alignment adjustment lives. A **[[shim|shim]]** — a thin spacer sheet — is often listed AR, because its thickness is chosen during assembly after measuring the actual alignment. If you know how to read the BOM and follow the balloon, you can find it on the drawing yourself.

## General notes

A drawing cannot say everything with lines and numbers. Some requirements are words: "remove all burrs", "mark with part number and revision", "torque screws to 5.0 N·m". Those go in **notes**.

**General notes** apply to the whole drawing, everywhere, unless something more specific says otherwise. They sit in a numbered list, usually near the title block or at the upper left of the first sheet, and are written in [[capital letters|all-caps]]. A set might look like this:

1. DIMENSIONS AND TOLERANCES PER ASME Y14.5.
2. ALL DIMENSIONS ARE IN MILLIMETERS.
3. MATERIAL: ALUMINUM 6061-T6.
4. BREAK ALL SHARP EDGES 0.2 TO 0.5.
5. MARK PART NUMBER AND REVISION IN AREA SHOWN, CHARACTERS 3 HIGH.

Notice two things. First, several notes point to outside documents — a standard or a company specification. The drawing does not repeat those documents; it [[pulls them in by name|flow-down]], and they become part of the definition as if printed on the sheet. Second, these are requirements, not advice. An inspector checks each one like a dimension.

The phrase **UNLESS OTHERWISE SPECIFIED** (often shortened to UOS) sets up the rule every note follows: a general note is the default, and a more specific instruction on the drawing overrides it.

## Flag notes

Sometimes a note applies to only a few places. You do not want it to apply to the whole part, and you do not want to write the same sentence next to five features. The answer is a **flag note**: a numbered note in the notes list that applies *only* where its **flag** appears. The **[[flag|flag-symbol]]** is a small symbol with the note's number inside, placed next to each feature the note governs, and repeated beside the note in the list.

The exact shape of the flag varies between companies. What matters is that it matches the one beside the note text, and that it cannot be confused with the revision-flag triangles from last lesson.

The order of authority runs from specific to general:

1. A dimension or callout written right at the feature.
2. A flag note, only at the features that carry its flag.
3. A general note, everywhere else.

::: key
General notes apply to the whole drawing unless otherwise specified; a flag note applies only at the features marked with its flag, and the more specific instruction wins.
:::

::: example Which note governs this edge?
A valve body's general note 4 says "BREAK ALL SHARP EDGES 0.2 TO 0.5". Flag note 7 says "EDGE MUST REMAIN SHARP, 0.1 MAX BREAK", and its flag appears at the two edges of a sealing groove, where a rounded edge would let the seal leak. The inspector measures a $0.3$ mm edge break at two places: an outside corner with no flag, and one of the flagged groove edges. Pass or fail?

Outside corner: no flag, so general note 4 governs. The allowed range is $0.2$ to $0.5$ mm. Is $0.3$ in range? $0.2 \le 0.3 \le 0.5$, yes. **Pass.**

Groove edge: flag 7 is there, so flag note 7 governs, not note 4. The limit is $0.1$ mm maximum. $0.3 > 0.1$, so the edge was rounded too much. **Fail.**

The same measurement passes in one spot and fails in another. Sanity check: the failing spot is the one with a functional reason to stay sharp — the seal. That is exactly what a flag note is for.
:::

::: warning Reading only the views
Many rejections at inspection come from notes, not dimensions: the wrong finish, a missing mark, a forgotten torque. Read every general note before you read a single view, and scan the field for flags before you decide a feature is "only" governed by the defaults.
:::

## Check yourself

::: check
What is the difference between a detail drawing and an assembly drawing?
:::

::: answer
A detail drawing defines one part completely, with every dimension needed to make it. An assembly drawing shows how several parts go together: it lists them in a bill of material, identifies each one with balloons, and gives joining instructions, but it does not repeat each part's full geometry — that lives on each part's own detail drawing.
:::

::: check
A star-tracker assembly uses 2 bracket subassemblies. Each bracket subassembly has 3 shims (find 6) and 4 screws (find 7). The program builds 5 spacecraft, each with one star-tracker assembly. How many screws, and how many shims, are needed before spares?
:::

::: answer
Multiply down the tree. Screws per star-tracker assembly: $4 \times 2 = 8$. For five spacecraft: $8 \times 5 = 40$ screws. Shims per star-tracker assembly: $3 \times 2 = 6$. For five spacecraft: $6 \times 5 = 30$ shims. (If the shims were listed AR instead, you could not order an exact count from the BOM; you would order a stock of shim material.)
:::

::: check
Why does an assembly drawing use find numbers in its balloons instead of writing each part number in the balloon?
:::

::: answer
Part numbers are long and can change when an equivalent part replaces another; a find number is short and keeps pointing at the same BOM line. That gives everyone — procurement, the floor and inspection — one stable handle for "that item on this drawing".
:::

::: check
A general note says "ALL FILLET RADII 1.0". One fillet has flag 9 beside it, and flag note 9 says "FILLET RADIUS 3.0 MIN". What must that fillet be, and what must the others be?
:::

::: answer
The flagged fillet is governed by flag note 9, which is more specific, so its radius must be at least 3.0 mm. All other fillets, with no flag and no callout of their own, follow general note 1: radius 1.0 mm (within the drawing's default tolerance).
:::

::: check
A BOM line reads "QTY: AR, SHIM, 0.05 THK". What does AR mean, and why would a shim be listed that way?
:::

::: answer
AR means "as required". A shim is used to correct the alignment of the real, built parts, so how many you stack is only known during assembly after measuring. The drawing cannot give a fixed count, so it says to use as many as the procedure needs.
:::

## Summary

| Idea | Meaning | Key rule |
| --- | --- | --- |
| Assembly drawing | Shows which parts go together and how | Detail geometry stays on each part's own drawing |
| Bill of material (BOM) | Table of every item: find no., qty, part no., description, material | Quantity is per one parent; multiply down the tree |
| Indented BOM | The whole tree listed with levels | Each deeper level is one assembly down |
| AR, REF | As required; reference only | Not a fixed count |
| Item balloon | Circle with a find number, leader to the part | One per item per view, not per piece |
| Find number | The item's handle within this drawing | Stable; ties view to BOM line |
| General note | Applies to the whole drawing | Default, unless otherwise specified |
| Flag note | Applies only where its flag appears | More specific wins |

Next lesson takes the tolerance block you met in the title block and goes deep: every way a drawing writes a tolerance, and how the tolerances on a hole and a shaft decide whether the two slide, locate or lock together.

::: context purchased-parts Parts nobody at your company draws
Many items on an aerospace BOM are not designed in-house. A reaction wheel may be bought complete from a specialist maker, identified by that maker's part number and a purchase specification. Screws, washers and nuts are usually **standard parts** made to published industry or government standards, so every supplier's version is interchangeable. Lesson 8 shows how those fastener callouts are read. On the BOM, all of these still get a find number, a quantity and a part number like everything else.
:::

::: context indented-bom A BOM drawn as a tree
Each level of indent is one assembly down. The quantity on each row is per one of its parent, so to get a total you multiply along the path from the top.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="170" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="18" y="27" font-size="12" fill="#1f2a44">WHEEL ARRAY ASSY ×1</text>
  <line x1="24" y1="34" x2="24" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="24" y1="52" x2="44" y2="52" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="48" y="56" font-size="12" fill="#1f2a44">PANEL ×1</text>
  <line x1="24" y1="76" x2="44" y2="76" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="44" y="64" width="170" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="52" y="81" font-size="12" fill="#1f2a44">WHEEL MOUNT ASSY ×4</text>
  <line x1="58" y1="88" x2="58" y2="126" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="58" y1="106" x2="78" y2="106" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="82" y="110" font-size="12" fill="#1f2a44">BRACKET, WHEEL ×1 each</text>
  <line x1="58" y1="126" x2="78" y2="126" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="82" y="130" font-size="12" fill="#b4232c">SCREW M5 ×6 each → 24</text>
  <line x1="24" y1="150" x2="44" y2="150" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="48" y="154" font-size="12" fill="#1f2a44">SCREW M6 ×16</text>
</svg>
```

Washers are left out of the picture to keep it small; they follow the same rule.
:::

::: context balloon-dot Arrowhead or dot
A leader that ends with an arrowhead must touch the edge, or outline, of the part it names. A leader that ends inside the part, on one of its faces, ends with a small filled dot instead. The dot says "this surface belongs to the item", which is clearer when the part is small or crowded by others.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="60" width="120" height="50" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="200" y="60" width="120" height="50" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="25" r="13" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="30" font-size="13" text-anchor="middle" fill="#1f2a44">1</text>
  <line x1="68" y1="35" x2="90" y2="60" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="90,60 81,55 87,50" fill="#1f2a44"/>
  <text x="100" y="30" font-size="11" fill="#6c7a93">arrow on edge</text>
  <circle cx="230" cy="25" r="13" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="30" font-size="13" text-anchor="middle" fill="#1f2a44">2</text>
  <line x1="238" y1="35" x2="265" y2="85" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="265" cy="85" r="3" fill="#1f2a44"/>
  <text x="270" y="30" font-size="11" fill="#6c7a93">dot on face</text>
</svg>
```
:::

::: context stable-id Like a key in a database
If you have written any code that stores records, you have met this idea. A database gives each row a key that never changes, even when the row's other fields are edited. Other tables point to that key, not to the name, so edits do not break the links. A find number plays the same role on an assembly drawing: work instructions, inspection sheets and purchase orders point at "find 3", and a later change to the screw's supplier part number does not break any of them.
:::

::: context shim Thin sheets that fix alignment
A shim is a thin, precisely made sheet of metal slipped between two parts to adjust how they sit. Parts come off the machine slightly different every time, so a bracket may tilt a star tracker a few hundredths of a degree off. Instead of remaking the bracket, technicians measure the tilt and add shims under one side. Some shims are made of thin peelable layers, so the thickness can be adjusted layer by layer. The final stack is recorded in the as-built record for that serial number.
:::

::: context all-caps Why drawings shout
Drawing notes are written in capital letters by long tradition. When drawings were lettered by hand and copied many times, capitals stayed readable where lowercase letters blurred together. The habit stuck in CAD because it keeps notes uniform and easy to scan. It carries no extra meaning: a note in capitals is not more important than a dimension. It is the house style of engineering drawings.
:::

::: context flow-down A note can carry a whole book
A note like "PASSIVATE PER SPEC 123" makes that specification part of the drawing's requirements. The supplier must follow it as if it were printed on the sheet. This is called **flowing down** a requirement. It also means the specification's own revision matters: if the spec changes, the company must decide whether old drawings follow the new version. Reading a drawing properly sometimes means opening the documents its notes name.
:::

::: context flag-symbol A flag at the feature, a flag at the note
The same numbered symbol appears in two places: beside each feature it governs, and beside the note's text in the list. Here flag 7 marks two groove edges and nothing else.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,60 L90,60 L90,85 L120,85 L120,60 L190,60 L190,120 L20,120 Z" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="60" x2="70" y2="30" stroke="#1f2a44" stroke-width="1"/>
  <rect x="56" y="14" width="22" height="18" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="67" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">7</text>
  <line x1="120" y1="60" x2="140" y2="30" stroke="#1f2a44" stroke-width="1"/>
  <rect x="132" y="14" width="22" height="18" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="143" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">7</text>
  <text x="210" y="50" font-size="11" fill="#6c7a93">NOTES</text>
  <text x="210" y="70" font-size="11" fill="#1f2a44">4. BREAK ALL SHARP</text>
  <text x="222" y="84" font-size="11" fill="#1f2a44">EDGES 0.2 TO 0.5</text>
  <rect x="208" y="96" width="18" height="16" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="217" y="108" font-size="11" text-anchor="middle" fill="#1d6fd1">7</text>
  <text x="232" y="108" font-size="11" fill="#1f2a44">EDGE MUST REMAIN</text>
  <text x="232" y="122" font-size="11" fill="#1f2a44">SHARP, 0.1 MAX</text>
</svg>
```

Every other edge of the part still follows note 4.
:::
