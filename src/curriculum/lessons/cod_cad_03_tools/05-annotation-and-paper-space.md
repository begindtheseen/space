---
id: l05-annotation-and-paper-space
title: Annotation, paper space and plotting
minutes: 22
covers:
  - 'Annotation: text styles, dimension styles, multileaders, annotative scaling'
  - Model space versus paper space; layouts, viewports and viewport scale; plot styles; sheet sets
---

Think about a model train set and a photo of it in a magazine. The train set is built at its own size on a big table. The magazine page is small and fixed. The photographer chooses how much of the table to show and how far to zoom. And the caption under the photo is printed at a normal reading size, no matter how far the camera zoomed out.

AutoCAD works exactly like that. You build the thing at full size on one enormous table. Then you lay out a sheet of paper, cut windows in it that look down onto the table at chosen zooms, and write the labels at a size that reads well on paper. The hard part — the part this lesson is about — is making the labels come out the right size on paper when each window is zoomed differently.

So far you have drawn geometry, put it on layers, and reused it with blocks and xrefs. None of that is a drawing yet. A drawing a technician can build from has words, dimensions, arrows and a title block, printed on a sheet at a known scale. On a launch site that is a test-stand general arrangement at 1:50 with a bolt-pattern detail at 1:5 on the same sheet, and every dimension on both printed at the same height.

## Text styles: a font plus rules

Every piece of text on a sheet should look like it belongs to the same company. A **text style** is a named set of rules for text: which font, what height, what width factor and slant. You create and edit them with the **STYLE** command (alias ST). The text commands then use the current style: **TEXT** (alias DT) for single lines like a label, **MTEXT** (alias T) for paragraphs like a notes block.

Most engineering offices use a plain, very readable font and only a few heights. A common set is 2.5 mm for general notes and dimensions, 3.5 mm for view titles and 5 or 7 mm for the drawing title. Those are **printed** heights — how tall the letters are on the finished paper. Keep that word in mind, because the rest of the lesson is about getting from the model to the paper.

## Dimension styles: every dimension alike

A dimension in AutoCAD is one object built from many parts: the **extension lines** (short lines from the part out to the dimension), the **dimension line** with its **arrowheads**, and the **dimension text** with the measured value. How big the arrows are, how far the extension lines stand off the part, how many decimal places the text shows, which text style it uses — all of that lives in a **dimension style**, managed with **DIMSTYLE** (alias D).

You draw dimensions with commands like **DIMLINEAR** (alias DLI) for horizontal and vertical distances, **DIMALIGNED** for slanted ones, **DIMRADIUS** and **DIMDIAMETER** for arcs and holes, or the all-purpose **DIM**, which guesses the type from what you pick. Snap to the real points, never type a value over the measurement. A dimension that shows the true distance updates if the geometry is stretched. A dimension with typed-over text keeps saying the old number while the part changes underneath — a classic way to ship a wrong drawing.

## Multileaders: a note with an arrow

A **leader** is an arrow from a note to the thing it describes: "4X M6 THRU", "WELD ALL AROUND", "SEE DETAIL A". AutoCAD's modern version is the **multileader**, drawn with **MLEADER** (alias MLD) and styled with **MLEADERSTYLE** (alias MLS). One multileader holds the arrow, the landing line and the text or a block (such as a **[[circled item number|item-balloons]]** for a parts list) as one object, so moving the note keeps the arrow attached. Several arrows can come from one note.

::: key Annotation styles
Text styles (STYLE) set font and height. Dimension styles (DIMSTYLE) set arrows, extension lines, text and precision. Multileader styles (MLEADERSTYLE) set the arrow-and-note objects made by MLEADER. Set them once in a template and every sheet matches.
:::

## Model space and paper space

Now the heart of the lesson. AutoCAD gives every drawing two kinds of space.

**Model space** is the big table. There you draw the geometry at **full size**, one drawing unit per millimeter: a 7.2 m test stand is 7200 units wide. There is only one model space in a file, and it has no edges.

**Paper space** is the sheet. Each sheet is a **layout** — a tab along the bottom of the screen, next to the Model tab, set up for one paper size such as A3 or A1. In paper space one unit is one millimeter of real paper. A layout holds the **[[border and title block|what-lives-in-paper-space]]**, general notes, and one or more windows into the model.

Those windows are **viewports**. You make them in a layout with **MVIEW** (alias MV). Double-click inside a viewport and you reach through it into model space to pan and zoom; double-click outside and you are back on the paper. The commands **MSPACE** (MS) and **PSPACE** (PS) do the same thing.

::: key Model space versus paper space
Model space holds the geometry at full scale; paper space is the sheet, holding viewports into the model at chosen scales plus the title block. Annotative scaling is what keeps a dimension the correct printed size in two viewports at different scales.
:::

### Viewport scale

A viewport's **scale** says how many millimeters of paper stand for how many millimeters of model. A 1:50 viewport (read "one to fifty") shows 50 mm of model in every 1 mm of paper. Its **viewport scale factor** is paper over model:

$$
\text{scale factor} = \frac{\text{paper length}}{\text{model length}} = \frac{1}{50} = 0.02.
$$

You set it in the viewport's properties, from the scale list on the status bar, or with a zoom typed inside the viewport, where `XP` means "[[times paper space|zoom-xp]]":

```text
Command: ZOOM
Specify corner of window, enter a scale factor (nX or nXP), or
[All/Center/Dynamic/Extents/Previous/Scale/Window/Object] <real time>: 1/50XP
```

Then **[[lock|viewport-housekeeping]]** the viewport (its Display Locked property set to Yes). A locked viewport keeps its scale when someone zooms, which stops the most common way a sheet quietly stops being to scale.

Pick scales from the **[[standard series|standard-scales]]**: 1:1, 1:2, 1:5, 1:10, 1:20, 1:50, 1:100, 1:200. A reader expects them, and scale rulers are made for them.

::: example A test stand on an A3 sheet
A test stand is 7200 mm wide and 4800 mm tall in model space. It goes in a 1:50 viewport on an A3 layout, which is 420 mm by 297 mm.

**Size on paper.** Multiply each model length by the scale factor $0.02$ (the same as dividing by 50):

$$
7200 \times 0.02 = 144 \text{ mm}, \qquad 4800 \times 0.02 = 96 \text{ mm}.
$$

A 144 mm by 96 mm view fits easily on a 420 mm by 297 mm sheet, with room for a detail view and the title block.

**How tall is 2.5 mm text in model space?** If the text is ordinary, **non-annotative** text placed in model space, it gets magnified by 50 along with everything else before it reaches paper. So to *print* 2.5 mm tall, it must be *drawn* 50 times taller:

$$
2.5 \times 50 = 125 \text{ mm}.
$$

Dimension text meant to print 3.5 mm would need $3.5 \times 50 = 175$ mm. For non-annotative dimensions, that factor of 50 is the dimension style's **overall scale**, the setting called DIMSCALE.

The same sum for every common scale, done in Python:

```python
printed_mm = 2.5          # text height wanted on paper
for n in (1, 5, 10, 20, 50, 100):
    factor = 1 / n        # viewport scale factor, paper mm per model mm
    model_mm = printed_mm / factor
    print(f"1:{n:<4} factor {factor:<6} model text {model_mm:g} mm")
# 1:1    factor 1.0    model text 2.5 mm
# 1:5    factor 0.2    model text 12.5 mm
# 1:10   factor 0.1    model text 25 mm
# 1:20   factor 0.05   model text 50 mm
# 1:50   factor 0.02   model text 125 mm
# 1:100  factor 0.01   model text 250 mm
```

**Sanity check.** A 125 mm letter is about the size of your hand. Next to a 7.2 m stand that looks right: small, but readable once shrunk 50 times to 2.5 mm.
:::

::: warning Scaling the geometry instead of the viewport
Beginners sometimes draw the stand at 144 mm wide "so it fits the paper". Now every dimension reads 144 instead of 7200, the xref'd site plan no longer lines up, and nobody can measure the file. Draw the model at full size, always. Scale belongs to the viewport, never to the geometry.
:::

## Annotative scaling: one label, many sizes

The example shows the trouble. Put that 125 mm note beside a 1:10 detail viewport of the same stand, and it prints at

$$
125 \times \frac{1}{10} = 12.5 \text{ mm},
$$

five times too big. Before annotative scaling, drafters kept two copies of every note, one at each height, on separate layers, and froze the wrong one in each viewport. It worked, but it was a lot to keep straight.

**Annotative** objects fix this. A text style, dimension style or multileader style can be marked Annotative. You then give its height as the **paper height** — 2.5 mm — and the object carries a list of **annotation scales** it supports. Each viewport has an annotation scale that matches its viewport scale. The object shows itself only in viewports whose scale is on its list, and at each one it sizes itself automatically: 125 mm tall in model space for 1:50, 25 mm tall for 1:10. Both print at 2.5 mm.

You manage the list with **OBJECTSCALE**, and the current scale for new annotation is set on the status bar (the system variable is CANNOSCALE).

::: example One note in two viewports
A sheet has a 1:50 general view and a 1:10 detail of a mounting plate. A note must print 2.5 mm tall in both.

**Non-annotative.** The model height is printed height times the scale's second number. For the general view, $2.5 \times 50 = 125$ mm. For the detail, $2.5 \times 10 = 25$ mm. One piece of text cannot be both, so you need two copies, and the 125 mm copy would print $125 / 10 = 12.5$ mm tall if it showed in the detail.

**Annotative.** Make the note once, paper height 2.5 mm, with annotation scales 1:50 and 1:10. AutoCAD keeps a separate size for each scale: 125 mm when drawn for 1:50 and 25 mm when drawn for 1:10. In each viewport it prints

$$
125 \times 0.02 = 2.5 \text{ mm}, \qquad 25 \times 0.1 = 2.5 \text{ mm}.
$$

**Sanity check.** Same printed height in both views, from one object — which is exactly what the flashcard means by "keeps a dimension the correct printed size in two viewports at different scales".
:::

::: warning The note that vanishes
An annotative object only shows in viewports whose annotation scale is on its list. Add a 1:20 viewport and every annotative note without 1:20 on its list is invisible there. It is not deleted; it is not yet told to appear at that scale. Add the scale with OBJECTSCALE.
:::

## Plot styles: how colors become ink

Plotting is printing a layout, with **PLOT**. A **page setup** (made with **PAGESETUP**) stores the printer or PDF driver, paper size, what to plot (the layout), the plot scale (1:1 for a layout, since the viewports already carry the scale) and one more thing: the **plot style table**. A plot style table decides how each object is printed — its color, **[[lineweight|pens-and-colors]]** and shading — so a colorful screen becomes a clean black-and-white sheet.

There are two kinds, and a drawing uses one or the other.

- **Color-dependent** plot style tables, files ending **.ctb**. The print settings are tied to each object's color. Everything drawn in, say, color 1 (red) prints with the settings for color 1. The table has a row for each of the 255 AutoCAD color numbers. A popular one, `monochrome.ctb`, prints every color as black.
- **Named** plot style tables, files ending **.stb**. The settings are tied to a named style, like `Thick` or `Screened 50%`, assigned to layers or objects as a property of its own. Color is then free to mean only color.

CTB is older and still very common; its catch is that color now does two jobs, so you cannot make a red line print thin and another red line print thick. STB separates the two jobs. Which one a new drawing uses comes from its template, and **CONVERTPSTYLES** switches an existing drawing from one to the other.

::: key Plot styles
A CTB (color-dependent) plot style table sets print settings by object color. An STB (named) table sets them by a named plot style assigned to layers or objects. A page setup stores printer, paper, plot area, scale and plot style table.
:::

## Sheet sets: many layouts as one set

A test-stand package might be thirty sheets in a dozen drawing files. The **Sheet Set Manager** (command **SHEETSET**) organizes layouts from many files into one named **sheet set**, stored in a **.dst** file. From one panel you can open any sheet, number them in order, make new sheets from a standard layout, **[[fill each title block|sheet-set-fields]]** from the set's data (sheet number, sheet title, project name), build a sheet list table, and **PUBLISH** the whole set to PDF or to a printer in one go.

::: key Sheet sets
A sheet set (.dst, managed in the Sheet Set Manager) collects layouts from many drawings into one ordered set, feeds title-block data and publishes the whole set at once.
:::

::: example Choosing a scale for a pad plan
A concrete pad is 12 m by 8 m. It goes on an A1 sheet (841 mm by 594 mm). After the border and title block, the space left for the view is about 780 mm wide and 500 mm tall.

**The smallest ratio that fits.** Divide model length by available paper length:

$$
\frac{12000}{780} = 15.4, \qquad \frac{8000}{500} = 16.
$$

So the view must be shrunk at least 16 times. The next standard scale with a bigger second number is 1:20.

**Check it fits at 1:20.** $12000 / 20 = 600$ mm wide and $8000 / 20 = 400$ mm tall. Both are inside 780 mm by 500 mm.

**Text at 1:20.** Non-annotative 2.5 mm text needs $2.5 \times 20 = 50$ mm in model space; annotative text needs only its 2.5 mm paper height and the 1:20 scale on its list.

**Sanity check.** 1:10 would give 1200 mm by 800 mm, bigger than the sheet, so 1:20 is the largest standard scale that fits.
:::

## Check yourself

::: check
A viewport is set to 1:20. What is its scale factor, and what do you type at the ZOOM prompt inside it to set that scale?
:::

::: answer
The scale factor is paper over model, $1/20 = 0.05$. At the ZOOM prompt inside the viewport you type `1/20XP` (or `0.05XP`). Then lock the viewport so a later zoom does not change it.
:::

::: check
A non-annotative dimension style should print its text 3.5 mm tall in a 1:100 viewport. What overall scale (DIMSCALE) does it need, and how tall is the text in model space?
:::

::: answer
The overall scale matches the viewport's second number: 100. The model-space text height is $3.5 \times 100 = 350$ mm. Shrunk by the scale factor $0.01$ it prints $350 \times 0.01 = 3.5$ mm.
:::

::: check
Why does a layout normally plot at 1:1 even though the view on it is at 1:50?
:::

::: answer
A layout is drawn in paper millimeters, so the sheet itself is already at real paper size. The 1:50 is carried by the viewport, which shows the full-size model shrunk by 0.02. Plotting the layout at 1:1 puts each paper millimeter on one real millimeter, and the view inside comes out at 1:50.
:::

::: check
Your office uses a CTB table in which color 7 prints 0.35 mm thick. You need one centerline printed thin but it must stay color 7 like its neighbors. What is the problem, and what kind of plot style would avoid it?
:::

::: answer
In a color-dependent (CTB) setup, the color decides the printed lineweight, so every color-7 object prints 0.35 mm; you cannot have both. You would have to change the color, or override the lineweight another way. A named (STB) plot style separates the two: the centerline keeps color 7 and gets a named plot style such as a thin one.
:::

::: check
An annotative dimension shows in the 1:50 viewport but is missing from a new 1:5 detail viewport of the same area. What happened, and how is it fixed?
:::

::: answer
Annotative objects appear only in viewports whose annotation scale is on their own scale list. The dimension has 1:50 but not 1:5, so the 1:5 viewport does not show it. Adding the 1:5 scale to the dimension with OBJECTSCALE makes it appear there, sized to print at its paper height.
:::

## Summary

| Idea | Command or file | What to remember |
|---|---|---|
| Text style | STYLE, TEXT, MTEXT | Font and height; heights are printed heights |
| Dimension style | DIMSTYLE, DIMLINEAR, DIM | Arrows, extension lines, text, precision; DIMSCALE for non-annotative |
| Multileader | MLEADER, MLEADERSTYLE | Arrow and note as one object |
| Model space | Model tab | Geometry at full size, one unit per mm |
| Paper space | Layout tabs | The sheet: title block, notes, viewports |
| Viewport | MVIEW, ZOOM nXP | Scale factor = paper / model; 1:50 is 0.02; lock it |
| Non-annotative text | — | Model height = printed height times 50 at 1:50 (2.5 mm to 125 mm) |
| Annotative | OBJECTSCALE, CANNOSCALE | Paper height plus a list of scales; one object, right size in every viewport |
| Plot styles | .ctb, .stb, PAGESETUP, PLOT | Color-dependent versus named |
| Sheet set | SHEETSET, .dst, PUBLISH | Many layouts managed and published as one set |

Every style, layer, title block and plot style you set up here should not be rebuilt by hand for each new drawing. The next lesson packs them into templates and standards files, compares DWG with DXF, and places AutoCAD exactly where it belongs in an aerospace company.

::: context item-balloons Balloons that point at the parts list
In the drawing-literacy module you met the bill of materials and the item numbers that tie each part on an assembly drawing to a row in it. On a sheet those item numbers sit in small circles, often called balloons, at the end of a leader. A multileader style can use a block with an attribute as its content, so each balloon is a circle whose number you type as you place it. The same attributes can then be read out with data extraction, the way the last lesson built a parts table from tags.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="50" width="120" height="50" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">clamp</text>
  <polygon points="120,62 130,56 128,66" fill="#1f2a44"/>
  <line x1="126" y1="61" x2="220" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="220" y1="30" x2="240" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="254" cy="30" r="14" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="254" y="35" font-size="13" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="274" y="60" font-size="11" fill="#6c7a93">item 3 in the</text>
  <text x="274" y="75" font-size="11" fill="#6c7a93">parts list</text>
</svg>
```
:::

::: context what-lives-in-paper-space What goes on the paper, and what goes in the model
The rule of thumb: anything that describes the real object lives in model space at full size; anything that describes the sheet lives in paper space at paper size. The border, the title block, the revision table, general notes and the scale bar belong to the sheet. The geometry belongs to the model. Dimensions can live in either: many offices dimension in model space with annotative styles, while others dimension on the layout over the viewport, where they measure the model correctly anyway.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="150" height="130" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="85" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">model space, full size</text>
  <rect x="30" y="60" width="110" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="85" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">7200 x 4800 stand</text>
  <rect x="200" y="20" width="150" height="130" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="275" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">layout (paper)</text>
  <rect x="212" y="32" width="80" height="60" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="222" y="48" width="40" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="252" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">viewport 1:50</text>
  <rect x="290" y="118" width="54" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="317" y="135" font-size="11" text-anchor="middle" fill="#1f2a44">title</text>
  <line x1="160" y1="95" x2="212" y2="62" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context zoom-xp Zooming relative to the paper
A plain `ZOOM 2X` doubles whatever you see now; it has no memory of the paper. The `XP` form is different: it sets the zoom relative to paper-space units, so `1/50XP` means "one fiftieth of paper size", which is exactly a 1:50 scale no matter how the view was zoomed before. That is why it is the reliable way to set a viewport's scale by typing. In practice most people pick the scale from the viewport's list instead, which does the same thing.
:::

::: context viewport-housekeeping Two habits that keep a sheet to scale
First, lock every viewport once its scale is set. An unlocked viewport can be changed by one careless scroll of the mouse wheel while you are inside it, and the sheet still looks fine — only the scale label is now a lie. Second, put viewport borders on their own layer set not to plot, so the window frames do not print as boxes around each view. Many offices use a layer named for viewports with its plot state switched off, using the layer plot setting from the layers lesson.
:::

::: context standard-scales Why these particular scales
The standard series goes 1, 2, 5, 10, 20, 50 and so on, each step about two or two and a half times the last. That spacing means there is always a scale close to what you need, and every one is easy to do in your head, because dividing by 2, 5 or 10 is easy. International drawing standards list this series as the recommended one for technical drawings. Architects also use a few in-between scales such as 1:25, and US customary drawings use their own like 1/4 inch to the foot, which you will meet on older facility drawings.
:::

::: context pens-and-colors Why color decides the lineweight
Color-dependent plotting comes from the days of pen plotters: a machine that drew with real ink pens held in a carousel. Each pen slot was tied to a screen color, so "draw it in red" really meant "draw it with pen 1, the thick one". CTB tables keep that habit alive in software. Many offices still keep a fixed color-to-lineweight chart pinned by the monitor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">screen color</text>
  <text x="220" y="18" font-size="12" fill="#1f2a44">printed (monochrome)</text>
  <line x1="20" y1="40" x2="150" y2="40" stroke="#b4232c" stroke-width="3"/>
  <line x1="20" y1="70" x2="150" y2="70" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="20" y1="100" x2="150" y2="100" stroke="#f2b880" stroke-width="3"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="160" y1="40" x2="210" y2="40"/><line x1="160" y1="70" x2="210" y2="70"/><line x1="160" y1="100" x2="210" y2="100"/></g>
  <line x1="220" y1="40" x2="300" y2="40" stroke="#1f2a44" stroke-width="4"/>
  <line x1="220" y1="70" x2="300" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="220" y1="100" x2="300" y2="100" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44"><text x="306" y="44">thick</text><text x="306" y="74">medium</text><text x="306" y="104">thin</text></g>
</svg>
```
:::

::: context sheet-set-fields Title blocks that fill themselves
A field is a small piece of live text that reads a value from somewhere else: the file name, today's date, a sheet set property. Put fields in the title block's attributes and each sheet's number, title and project name come from the sheet set. Renumber the set and every title block follows. This matters on a big package, where a sheet numbered 12 on its title block but listed as 13 in the index is exactly the kind of error a checker is paid to catch, and fields make it impossible.
:::
