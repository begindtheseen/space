---
id: l06-templates-formats-and-where-autocad-lives
title: Templates, file formats and where AutoCAD lives
minutes: 21
covers:
  - Templates, standards files, DWG versus DXF
  - 'Where AutoCAD genuinely lives in aerospace: facility and site layouts, ground support equipment, test-stand drawings, electrical and harness schematics, P&IDs, tooling layouts'
---

Think about a school worksheet. Somebody set up the page once: the school name at the top, a box for your name, the lines already ruled, the font already chosen. Every new worksheet starts from that page, so every one looks alike and nobody forgets the name box. Now think about a teacher with a red pen checking that every worksheet follows the rules. And finally, think about a recipe you want to send to a friend who uses a different app: you might send it as plain text, because every app can read that.

Those three pictures are this lesson. A **template** is the pre-set page. A **standards file** is the red pen. And **DXF** is the plain-text version of a drawing that any machine can read. After those, the lesson steps back and answers a question that matters in an interview as much as at a desk: where, in an aerospace company, is AutoCAD actually the right tool?

## Templates: every drawing starts the same way

Over the last three lessons you set up a lot of things: layers with names, colors, linetypes, lineweights and plot states; text, dimension and multileader styles; a title block with attributes; layouts with page setups and a plot style table. Doing all that by hand for every new drawing would take an hour and would come out slightly different each time.

A **template** is a drawing file saved as a starting point, with the extension **.dwt** (read "D-W-T"). It holds all of that setup and usually no geometry. When you start a new drawing from a template, AutoCAD makes a fresh, untitled copy of it, so the template itself is never changed by accident.

- **NEW** asks which template to start from.
- **QNEW** ("quick new") starts at once from a default template set in the options.
- To make a template, set up a drawing the way you want, then **SAVEAS** and pick the file type AutoCAD Drawing Template (.dwt).

AutoCAD ships with plain starter templates, including `acad.dwt` for inch drawings and **[[acadiso.dwt|imperial-and-metric]]** for metric ones. Companies replace these with their own. A launch company's template might carry its standard layer list, 2.5 mm annotative text, an A1 and an A3 layout with the company title block, and its own plot style table. The template also decides whether new drawings use color-dependent (CTB) or named (STB) plot styles, which you met last lesson.

::: key Templates
A template (.dwt) is a starting drawing holding units, layers, styles, title-block layouts, page setups and the plot style type. NEW or QNEW makes an untitled copy of it, so every new drawing starts to the company standard.
:::

## Standards files and the standards checker

A template makes new drawings start right. It does nothing about a drawing that drifts later, or a drawing that arrives from a contractor with its own layer names. For that there is the **standards file**, extension **.dws** ("D-W-S"). It is a drawing saved in a special format that holds the approved **named objects**: layers, text styles, dimension styles and linetypes.

You tie one or more .dws files to a drawing with the **STANDARDS** command. Then **CHECKSTANDARDS** compares the drawing against them and lists every problem it finds: a layer with the right name but the wrong color, a dimension style that does not exist in the standard, a text style using the wrong font. For each one it offers a fix, and you choose whether to apply it. Autodesk also ships a batch standards checker that runs the same checks across many files and writes a report.

When a contractor's drawing uses different layer names — `E-POWER` where your standard says `ELEC-POWER` — the **[[layer translator|layer-translator]]**, **LAYTRANS**, maps their names onto yours and can save that mapping to use again next time.

::: key Standards files
A standards file (.dws) holds the approved layers, text styles, dimension styles and linetypes. STANDARDS attaches it; CHECKSTANDARDS reports and fixes violations; LAYTRANS maps another firm's layer names onto yours.
:::

::: warning A template is not a standard
Starting from the company template does not make a drawing compliant forever. People copy layers in from other files, paste in blocks with their own styles, and override colors. Only a check against the standards file catches the drift. Run CHECKSTANDARDS before a drawing goes out for review, not after the checker sends it back.
:::

## DWG versus DXF

### DWG: the native file

**DWG** is AutoCAD's own file format, the ".dwg" on every drawing you save. It is a compact binary file — numbers packed in a way only software can read — designed by Autodesk. Other programs can read and write it too, but it is Autodesk's format and its details are Autodesk's to change.

DWG has **versions**. Autodesk changes the format every few releases, and each format is named after the release that introduced it: the 2004 format, the 2007 format, the 2010, 2013 and 2018 formats. An older AutoCAD cannot open a file saved in a newer format. So when a supplier says "we can't open your file", the usual fix is SAVEAS and pick an older DWG version from the file-type list. Newer software always opens older files.

### DXF: the plain-text exchange format

**DXF**, for Drawing Exchange Format, is Autodesk's published, documented exchange format. The common kind is plain text. Open a DXF in a text editor and you can read it: pairs of lines, each a **[[group code|dxf-inside]]** number followed by a value — "this is a LINE", "on layer CUT", "starting at x = 0, y = 0". Because the format is published, almost every CAD, CAM and graphics program can read and write it.

You make one with SAVEAS and a DXF file type, or with **DXFOUT**. You read one with OPEN or **DXFIN**. DXF has versions too, matching the DWG versions, and very old machine software may only read an old one, such as the R12 DXF, a format from the early 1990s that is still offered in the save list because so much equipment understands it.

The price of plain text is size and completeness. A DXF is usually several times larger than the same DWG, and some newer object types may be simplified when saved to an older DXF version.

::: key DWG versus DXF
DWG is AutoCAD's native binary format; DXF is Autodesk's published exchange format, usually plain text, readable by nearly every CAD and CAM program. Both are versioned: older software cannot read newer versions, so save down (SAVEAS) when sending out.
:::

### DXF at the cutting machine

Here is where DXF earns its place in an aerospace shop. **Laser cutters** and **waterjet cutters** cut flat parts — brackets, gussets, shims, mounting plates, gaskets — out of sheet or plate. The shop's **CAM** software (computer-aided manufacturing: the program that turns shapes into machine paths) imports a DXF of the flat outline and plans the cut. Nearly every shop, from a local job shop to a big supplier, accepts DXF.

A cut file is not a drawing. The machine cuts every line it is given. So a good cut DXF follows a short checklist:

- **Full size, 1:1, in millimeters**, and say the units in your email or file name. Some importers ask or assume the units, and a wrong guess is a disaster.
- **Only the geometry to be cut.** No dimensions, title block, centerlines, hatching or notes. Put anything else on its own layer and remove it before export.
- **Closed outlines.** Each outline and each hole is one **[[closed polyline|closed-outlines]]** or circle, with no gaps. **JOIN** (or PEDIT) joins touching lines into one polyline.
- **No duplicates.** Two lines on top of each other get cut twice. **OVERKILL** deletes duplicate and overlapping objects.
- **The nominal part size.** Draw the finished edge. The shop's software offsets the path for the width of the cut, called the **[[kerf|kerf]]**.

::: example When the units go wrong
You draw a plate 200 mm by 120 mm and send the DXF. The shop's importer assumes the numbers are inches.

**What they see.** Each number is multiplied by 25.4, the millimeters in an inch:

$$
200 \times 25.4 = 5080 \text{ mm}, \qquad 120 \times 25.4 = 3048 \text{ mm}.
$$

A plate over 5 m long. That one gets noticed.

**The other direction.** If you had drawn in inches and they read millimeters, a 200-inch plate would arrive as $200$ mm, which is $200 / 25.4 = 7.87$ inches — about 25 times too small, and small enough that someone might cut it before noticing.

**Sanity check.** The factor is always 25.4, one way or the other. When a cut part is about 25 times too big or too small, it is a units error, not a drawing error. The fix is the checklist's first line: full size, millimeters, units stated.
:::

::: example Pricing a waterjet plate
A mounting plate is a 200 mm by 120 mm rectangle with four holes of diameter 8.5 mm for bolts and one hole of diameter 40 mm for a connector. Shops price cutting mostly by **cut length** and **pierces** — the number of times the jet has to punch through to start a new outline.

**Cut length.** The rectangle's perimeter is $2 \times (200 + 120) = 640$ mm. A circle's circumference is $\pi d$ ("pi times d"). Four small holes: $4 \times \pi \times 8.5 = 106.81$ mm. The big hole: $\pi \times 40 = 125.66$ mm. Total:

$$
640 + 106.81 + 125.66 = 872.48 \text{ mm}.
$$

**Pierces.** One per closed outline: $1 + 4 + 1 = 6$.

**Time.** If this plate's material and thickness let the machine cut at 250 mm per minute, the cutting alone takes $872.48 / 250 = 3.49$ minutes, plus the pierces and handling.

**Sanity check.** Now suppose the DXF had a duplicate 200 mm top edge. The machine would cut $872.48 + 200 = 1072.48$ mm, about 23% more, and the extra pass would widen that edge. OVERKILL before export would have removed it.
:::

## Where AutoCAD genuinely lives in aerospace

Now the big picture. The module's summary said it plainly: SpaceX standardized on Siemens NX with Teamcenter for its vehicles, and other large aerospace companies use similar 3D systems. The later lessons of this module teach that kind of 3D, parametric modeling. The vehicle — its structures, engines, tanks and their thousands of parts — is designed in 3D.

But a launch company is much more than the vehicle. Around every rocket there are buildings, pads, cranes, pipes, wires and fixtures. Much of that is drawn flat, and flat drawing is exactly what AutoCAD is good at. Here are the places it lives.

- **Facility and site layouts.** Where the buildings, roads, pads, tank farms and fences go. Civil and architectural firms deliver these in DWG, and every other discipline xrefs them as a background, as you saw in the blocks-and-xrefs lesson.
- **Ground support equipment**, or **[[GSE|ground-support-equipment]]** — everything on the ground that handles, fuels, powers or tests the vehicle: stands, carts, work platforms, umbilical towers. Some GSE is modeled in 3D, but its layouts and many of its fabrication drawings are 2D.
- **Test-stand drawings.** Where the stand, the thrust structure, the propellant runs and the instrumentation sit, drawn at 1:50 or 1:20 in plan and elevation.
- **Electrical and harness schematics.** Wiring diagrams: which pin connects to which pin, through which connector, in which cable. A schematic shows connections, not physical shape, so it is 2D by nature. Autodesk also sells AutoCAD with an electrical toolset for this kind of work.
- **P&IDs** — piping and instrumentation diagrams, which show every **[[pipe, valve, sensor and regulator|reading-a-pid]]** in a fluid system and how they connect. The propellant-loading and pressurization systems of a test stand or launch pad are drawn this way, with valve blocks carrying tag attributes.
- **Tooling layouts.** The floor plan of a factory cell and the flat layout of fixtures, jigs and handling equipment used to build the vehicle.

::: key Where AutoCAD belongs
Two-dimensional work: facility and site layouts, ground support equipment, test-stand drawings, electrical and harness schematics, P&IDs and tooling layouts. It is not the tool the vehicle is designed in, and saying so correctly is itself a credibility signal.
:::

Why is that a credibility signal? Because it shows you know how the company is really organized. If you say "I'd design the vehicle in AutoCAD", an interviewer hears that you have not seen how flight hardware is made. If you say "flight hardware lives in NX and Teamcenter; the pad, the test stand and the schematics are where 2D drafting earns its keep", you sound like someone who has worked alongside mechanical and facilities teams.

::: warning Mixing up the two jobs
A 2D tool can draw anything flat, so it is tempting to say it can "do" a flight part. It can draw its outline, and AutoCAD even has some 3D solid tools. What it lacks is what flight hardware lives on: a parametric feature history, large-assembly handling, reliable mass properties for a GNC engineer, and a tight link to the product data management system that controls revisions. Those are the subject of the rest of this module.
:::

### Choosing the tool for a job

The module's first exercise asks you to explain which workflow you would use for a flight part, a test-stand layout and a harness schematic. A simple way to think about any job:

1. **Is it a physical part that flies?** Then it is a 3D parametric model with a controlled drawing or model-based definition — the next lessons.
2. **Is it a layout of big things in a building or on a site?** Then it is 2D plan and elevation drawings, usually on xref'd site backgrounds. That is AutoCAD's home.
3. **Is it connections, not shapes** — wires, pipes, signals? Then it is a schematic or P&ID, drawn in 2D with symbol blocks and attributes.

A test-stand layout is question 2, a harness schematic is question 3, and a flight bracket is question 1. Some jobs mix: a flat bracket for the test stand may be modeled in 3D and then sent to the waterjet as a DXF of its flat outline.

## Check yourself

::: check
What is the practical difference between starting a new drawing from `COMPANY-A1.dwt` and opening an old finished drawing and deleting its contents?
:::

::: answer
The template is a clean, controlled starting point: NEW makes an untitled copy with exactly the approved layers, styles, layouts and plot style type, and the template file is not changed. The old drawing carries whatever drifted into it over its life — extra layers, stray styles, overridden colors, leftover block definitions — and it is easy to save over the original by accident. Templates exist to avoid both problems.
:::

::: check
A contractor's drawing uses the layer `E-LTG` for lighting, but your standard calls it `ELEC-LIGHTING` and makes it yellow. Which two tools would you use, and what does each do?
:::

::: answer
LAYTRANS, the layer translator, maps `E-LTG` onto `ELEC-LIGHTING` so the objects move to your standard layer, and the mapping can be saved for the next file from that contractor. CHECKSTANDARDS, with your .dws attached through STANDARDS, then checks that the layer has the right properties (yellow, the right linetype and lineweight) and flags or fixes anything else that does not match.
:::

::: check
Give two reasons a laser-cutting shop asks for DXF rather than DWG.
:::

::: answer
First, DXF is Autodesk's published exchange format, so nearly every CAM and nesting program can import it, whatever software the shop runs. Second, it can be saved in an old version, such as R12, that even older machine software reads. DWG is native to AutoCAD and newer DWG versions cannot be opened by older software.
:::

::: check
A DXF for a gusset has an outline made of six separate lines with a 0.05 mm gap at one corner, and a leftover dimension. What goes wrong at the machine, and how do you fix the file?
:::

::: answer
The CAM software may not recognize the outline as a closed shape, so it cannot tell inside from outside, may not apply the kerf offset, or may refuse to cut it. The dimension would be cut as if it were part of the shape. Close the gap (for example by fixing the corner so the lines meet), JOIN the six lines into one closed polyline, delete the dimension and anything else that is not cut geometry, and run OVERKILL to remove duplicates.
:::

::: check
An interviewer asks where AutoCAD fits at a launch company that designs its vehicle in NX. Answer in two or three sentences.
:::

::: answer
The vehicle and its flight hardware are designed in the 3D system, NX with Teamcenter managing the data. AutoCAD fits the two-dimensional work around the vehicle: facility and site layouts, ground support equipment, test-stand drawings, electrical and harness schematics, P&IDs and tooling layouts. Saying that cleanly shows you know how the organization really works.
:::

## Summary

| Idea | Command or file | What to remember |
|---|---|---|
| Template | .dwt, NEW, QNEW, SAVEAS | Starting drawing with layers, styles, layouts, plot style type |
| Standards file | .dws, STANDARDS, CHECKSTANDARDS | Approved layers and styles; reports and fixes violations |
| Layer translator | LAYTRANS | Maps another firm's layer names to yours |
| DWG | native, binary | Versioned; save down for older software |
| DXF | DXFOUT, DXFIN, SAVEAS | Published exchange format, usually plain text, readable by CAM |
| Cut file | JOIN, OVERKILL | 1:1 mm, only cut geometry, closed outlines, no duplicates |
| AutoCAD's home | — | Site and facility layouts, GSE, test stands, schematics, P&IDs, tooling |
| Not AutoCAD's home | — | The vehicle itself: 3D, parametric, under PLM |

That closes the 2D half of the module. The next lesson moves to the tools the vehicle is really designed in, starting with the parametric sketch: lines with constraints and dimensions that a 3D model is built on.

::: context imperial-and-metric Why "iso" means metric
The two starter templates differ in more than units. `acadiso.dwt` is set up for millimeters, with dimension and text defaults sized for metric drawings and hatch and linetype scales to match; `acad.dwt` is set up for inches. Starting a millimeter drawing from the inch template gives dimension text and linetype patterns sized for inches, which come out far too small at metric sizes. "ISO" is the International Organization for Standardization, whose drawing standards the metric template follows in spirit.
:::

::: context layer-translator Every firm speaks its own layer language
A civil firm, an electrical contractor and your own company may each name the same thing differently. Some firms follow a published national layer naming standard, many invent their own. The layer translator is a dictionary between them: on the left the layers in the incoming drawing, on the right your standard layers, and lines drawn between matching pairs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="70" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">their layers</text>
  <text x="280" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">your standard</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="20" y="30" width="100" height="22" fill="#fff" stroke="#6c7a93"/><text x="30" y="45">E-POWER</text>
    <rect x="20" y="62" width="100" height="22" fill="#fff" stroke="#6c7a93"/><text x="30" y="77">E-LTG</text>
    <rect x="20" y="94" width="100" height="22" fill="#fff" stroke="#6c7a93"/><text x="30" y="109">A-WALL</text>
    <rect x="220" y="30" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="228" y="45">ELEC-POWER</text>
    <rect x="220" y="62" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="228" y="77">ELEC-LIGHTING</text>
    <rect x="220" y="94" width="120" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="228" y="109">ARCH-WALLS</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="120" y1="41" x2="220" y2="41"/><line x1="120" y1="73" x2="220" y2="73"/><line x1="120" y1="105" x2="220" y2="105"/>
  </g>
</svg>
```
:::

::: context dxf-inside What a DXF looks like inside
A plain-text DXF is a long column of lines that come in pairs. The first line of each pair is a number, the group code, that says what kind of value comes next; the second line is the value. Code 0 starts a new object and names its type, such as LINE or CIRCLE. Code 8 gives the layer. Codes 10 and 20 give the first point's x and y, and 11 and 21 give a line's end point. Code 40 carries a size such as a circle's radius. That simple, open layout is why so many programs, including small ones written by a machine-tool maker, can read DXF.
:::

::: context closed-outlines Why a tiny gap matters
To cut a hole, the machine's software needs to know which side of a line is scrap and which side is part. It can only tell if the outline closes on itself. A gap of a twentieth of a millimeter is invisible on screen but leaves the shape open, and the software may refuse it or cut the wrong side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="110" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="85" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">closed: inside is known</text>
  <polyline points="232,30 330,30 330,100 220,100 220,42" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="224" cy="34" r="9" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="240" y="22" font-size="11" fill="#b4232c">gap</text>
  <text x="275" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">open: inside is unknown</text>
</svg>
```
:::

::: context kerf The width of the cut
A cutting beam or jet has a width, so it removes a thin strip of material, the kerf. For a laser it is a fraction of a millimeter; for an abrasive waterjet it is typically wider, around a millimeter. If the machine followed your line exactly, the part would come out smaller by half a kerf all round. So the CAM software shifts the path half a kerf outward on outer edges and inward on holes. That is why you draw the finished size and let the shop, which knows its own kerf, do the offset.
:::

::: context ground-support-equipment Everything on the ground
Ground support equipment is the hardware that never flies but that the vehicle cannot fly without: transporter-erectors that carry a rocket to the pad and raise it, fueling and pressurization skids, umbilical arms that feed power and propellant until lift-off, work stands and access platforms, and the fixtures that hold stages in the factory. GSE is designed to industrial rather than flight standards, often by facilities or ground-systems teams, which is part of why 2D drafting remains common there.
:::

::: context reading-a-pid Symbols instead of shapes
A P&ID does not show where a pipe physically runs. It shows what is connected to what, with standard symbols: a bow-tie for a valve, a circle with a tag for an instrument such as a pressure transducer, arrows for flow. Each symbol is a block, and its tag — like PT-101 for a pressure transducer — is an attribute. In GNC work you meet P&IDs when a sensor you read in software has to be traced back to the physical transducer on the propellant system.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="330,64 342,70 330,76" fill="#1f2a44"/>
  <polygon points="100,56 130,70 100,84" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="160,56 130,70 160,84" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="130" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">HV-104</text>
  <line x1="240" y1="70" x2="240" y2="46" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="240" cy="30" r="16" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="240" y="34" font-size="11" text-anchor="middle" fill="#1d6fd1">PT</text>
  <text x="264" y="26" font-size="11" fill="#1d6fd1">PT-101</text>
  <text x="20" y="60" font-size="11" fill="#6c7a93">LOX in</text>
</svg>
```
:::
