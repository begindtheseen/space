---
id: l09-standards-mbd-and-export-control
title: Drawing standards, model-based definition and export control
minutes: 20
covers:
  - 'ASME Y14.100 drawing practices, Y14.24 drawing types, Y14.41 model-based definition'
  - 'Export-control markings on aerospace drawings'
---

Every sport has a rule book. A referee in Texas and a referee in Maine blow the whistle for the same foul, because they read the same rules. Without the book, every game would start with an argument about what counts.

Engineering drawings have rule books too. Every symbol you have learned in this module — the projection symbol, the line types, the revision block, the tolerance, the weld symbol — means one thing and not another because a published **standard** says so. A standard is a document, agreed across an industry, that fixes what the marks on a drawing mean. In the United States, the main family of drawing standards is published by **[[ASME|asme]]**, the American Society of Mechanical Engineers, under the label **Y14**.

This last lesson of the module covers three things. First, the standards that govern a drawing as a whole. Second, **model-based definition**, the shift from a flat drawing to an annotated 3D model as the official description of a part. Third, **export control**: the laws that make many aerospace drawings themselves controlled, so that who may look at them is a legal question, not a matter of manners. You will meet that last one on the first day of any job at a US launch or spacecraft company.

## The Y14 family: one grammar for drawings

Picture the Y14 standards as a family of rule books, each covering one part of the drawing. Among them:

- **ASME Y14.100** — *Engineering Drawing Practices*. The umbrella. It sets the general rules every drawing must follow: what a drawing must contain, how it is identified and numbered, how it points to other documents, and which other Y14 standards apply to which parts of it.
- **ASME Y14.24** — *Types and Applications of Engineering Drawings*. Which *kind* of drawing to make for which job.
- **ASME Y14.41** — *Digital Product Definition Data Practices*. How to define a part with an annotated 3D model instead of, or alongside, a 2D sheet.
- Others handle single topics: **Y14.5** for dimensioning and geometric tolerancing (the next module), and separate standards for line conventions, surface texture and revisions.

A drawing usually says which standards it follows, in a note or in the title block. Standards are revised over the years, and each edition carries its year after a dash — "Y14.5-2018", for example. The year matters: a symbol can change meaning between editions, so the drawing must name the edition it was made to.

::: key The drawing standards
ASME Y14.100 sets engineering drawing practices (the umbrella US drawing standard); Y14.24 defines the types of drawings and when each is used; Y14.41 covers model-based definition, where the annotated 3D model is the product definition.
:::

## Drawing types: the right document for the job

Y14.24 exists because not every drawing does the same job. You would not describe a bolt you buy from a catalogue the same way you describe a bracket your own shop machines. Here are the types a GNC engineer is most likely to meet.

- **Detail drawing** — defines one part completely: every dimension, tolerance, material and finish needed to make it. The star-tracker bracket is a detail drawing.
- **Assembly drawing** — shows how parts go together, with item balloons and a bill of material. It does not repeat the detail of each part; it points to each part's own drawing.
- **Installation drawing** — shows how an item is installed into a larger system: mounting holes, clearances, connectors, fastener torques.
- **[[Interface control drawing|icd]]** (ICD) — defines only the boundary between two items that different teams or companies design. It freezes the bolt pattern, the mounting face and its flatness, the connector locations — and leaves everything behind the boundary to each side.
- **Specification control drawing** — describes an item you buy from outside, such as an inertial measurement unit, by the performance and interface it must meet, so that any supplier who meets it qualifies.
- **Source control drawing** — like a specification control drawing, but it also names the only approved sources, because only they have passed the qualification tests.
- **Altered item drawing** and **selected item drawing** — for a purchased item you modify, or one you pick out of a supplier's normal production because only some units meet a tighter requirement.

::: example Which drawing type?
A spacecraft team buys a star tracker from an outside company and mounts it on a bracket its own shop machines. Which drawings are involved?

**The tracker's mounting interface.** Two organisations share one boundary: the tracker's base and the bracket's face. That is an **interface control drawing**. Suppose it fixes four M5 holes on an $80\,\mathrm{mm}$ square and a mounting-face flatness of $0.01\,\mathrm{mm}$. By the small-angle rule from the stack-up lesson, $0.01\,\mathrm{mm}$ across $80\,\mathrm{mm}$ is at most about $0.01/80 = 0.000125\,\mathrm{rad}$, roughly $26\,\mathrm{arcsec}$ of possible rock, so the ICD is where that alignment term gets pinned down.

**The tracker itself.** The team does not design its insides. If any qualified supplier would do, it is a **specification control drawing**; if only this one company's tested unit is allowed, a **source control drawing**.

**The bracket.** Designed and made in-house: a **detail drawing**.

**The bracket with tracker installed on the spacecraft panel.** An **assembly** or **installation drawing**.

**Sanity check.** Each document answers a different question: what is the boundary, what do we buy, what do we make, how does it go together. No single drawing tries to do all four.
:::

## Model-based definition: the model becomes the drawing

For most of history, a part's official definition was a 2D drawing. The 3D CAD model was a helpful tool, but if the model and the released drawing disagreed, the drawing won. That is what it means for the drawing to be the **legal definition** of the part: it is the controlled document that inspection, purchasing and the supplier are bound to by contract.

**Model-based definition** (MBD) changes where that authority lives. Under ASME Y14.41, the 3D model itself carries all the information a drawing used to carry — dimensions, tolerances, datums, notes, surface finish, material. That information, attached to the model, is called **[[PMI|pmi]]**, for **product and manufacturing information**. The annotated model, released and revision-controlled like any drawing, is the official deliverable. There may be no 2D drawing at all, or only a reduced sheet that points back to the model.

::: key Why the drawing is the legal definition
The drawing is the controlled document that inspection, procurement and the supplier are contractually bound to. A CAD model that disagrees with the released drawing does not win; under model-based definition the annotated model becomes that controlled document instead.
:::

::: key Model-based definition (ASME Y14.41)
The annotated 3D model, carrying product and manufacturing information (PMI), is the authoritative deliverable rather than a 2D drawing. Aerospace is moving this way, and it is why PMI annotation appears in NX and SolidWorks workflows.
:::

### Why bother?

A 2D drawing is a copy of the model, made by a person, and copies drift. Someone changes a hole in the model and forgets the drawing. Someone on the shop floor re-measures a dimension off a printed sheet that was never updated. Every copy is a chance to disagree.

MBD removes the copy. The machining software reads the geometry and the tolerances straight from the model. So does the **[[coordinate measuring machine|cmm]]** (CMM) that inspects the finished part. The model is the single source, and everyone downstream reads the same thing. When PMI is stored as real data the software understands (engineers call this **semantic PMI**), rather than as a picture of text floating in 3D, the machines can use it without a person retyping it.

Two things become more important, not less. The model must be under the same **revision control** as a drawing — a released, lettered revision, stored where it cannot be changed quietly. And every feature needs a tolerance. On a 2D drawing, a dimension nobody wrote down simply is not there. In a model, every surface has an exact position, so MBD models usually carry a **general tolerance note** that covers every surface not otherwise toleranced.

::: example Reading a surface the drawing never dimensioned
An MBD bracket model carries the general note "all surfaces not otherwise toleranced: profile $0.2$ relative to datums A, B, C". Profile $0.2$ means the real surface must lie inside a band $0.2\,\mathrm{mm}$ wide, centred on the model's surface: up to $0.1\,\mathrm{mm}$ on either side. A CMM probes one point on a pocket floor that has no dimension of its own.

**The measurement.** At that point the model's surface is $12.000\,\mathrm{mm}$ above datum A. The probe finds the real surface at $12.070\,\mathrm{mm}$.

**Deviation.** $12.070 - 12.000 = 0.070\,\mathrm{mm}$ above the model.

**Verdict.** $0.070$ is less than the $0.1$ allowed on each side, so this point passes. A second point at $11.880\,\mathrm{mm}$ is $12.000 - 11.880 = 0.120\,\mathrm{mm}$ below, which is more than $0.1$, so that point fails and the part is rejected at inspection.

**Sanity check.** On an old 2D drawing, the pocket floor had no dimension, and the inspector would have had nothing to check it against. In MBD, the general note and the exact model make every surface checkable.
:::

::: warning When model and drawing disagree
Before trusting any number, find out which document is authoritative for *this* part. On a drawing-based program, a CAD model that disagrees with the released drawing is wrong, however new it looks. On an MBD program, a leftover 2D print is only a reference. A part made to the wrong one — say a hole at $25.0\,\mathrm{mm}$ from the model when the released drawing says $25.4 \pm 0.1\,\mathrm{mm}$ — fails inspection by $0.3\,\mathrm{mm}$ beyond its limit, no matter how carefully it was machined.
:::

Neutral file formats matter here too. When a model moves between companies using different CAD programs, a format such as **[[STEP AP242|step-ap242]]** can carry the geometry together with its semantic PMI, so the tolerances travel with the shape instead of being lost.

## Export control: when the drawing itself is regulated

Some things may not leave a country without a government license. Weapons are the obvious example. Rockets are close cousins of missiles, and satellites carry technology with military uses, so the United States controls them. The surprise for many new engineers is that the control covers not only the hardware but the **technical data** that describes it — including drawings, models and specifications.

Two sets of US regulations do this.

- **ITAR**, the International Traffic in Arms Regulations, run by the State Department. It covers items on the **[[United States Munitions List|usml]]**, which includes launch vehicles and many spacecraft items.
- **EAR**, the Export Administration Regulations, run by the Commerce Department. It covers "dual-use" items — commercial things that could also serve a military purpose — listed on the Commerce Control List, each with a classification code. Many commercial satellite parts fall here.

An **export** is broader than shipping a crate abroad. Emailing a controlled model to someone overseas is an export. Letting a person who is not a **[[US person|us-person]]** see controlled data, even in an office in California, can count as an export to that person's country; this is called a **deemed export**. So the question "can I show this drawing to my colleague?" can have a legal answer.

### The markings

That is why aerospace drawings carry **export-control markings**: a legend, usually on every sheet or on the model's opening view, stating that the document contains technical data controlled under ITAR or the EAR, often with its classification, and warning that export without authorization is prohibited. Drawings may also carry a company **proprietary** notice and, on government work, a **distribution statement** that says who may receive the document.

The marking warns; it does not create the control. A drawing is controlled because of what it describes. An unmarked drawing of an ITAR-controlled part is still controlled, and forgetting the marking is a compliance failure in its own right. In an MBD world the same logic applies to the model: the marking goes into the model and its metadata, and the product data management system restricts who can open the file.

::: key Why aerospace drawings carry export-control markings
Launch-vehicle and satellite hardware is controlled under ITAR or EAR, so the drawing itself is controlled technical data. Handling, storage and who may view it are legal obligations, not company preference.
:::

::: warning Controlled data travels in small pieces too
A screenshot of a model, a photo of a drawing on a whiteboard, a CAD file on a personal laptop, a question pasted into a public forum or an online tool — each can be an export of controlled data. The safe habit: treat anything from a controlled program as controlled until the company's export-control office says otherwise, and ask them, not a colleague, when in doubt.
:::

For a GNC engineer, this is not someone else's problem. Your attitude-control design, your alignment budget and your star-tracker ICD are all technical data about a controlled vehicle. And it is why many US launch and spacecraft companies state in their job postings that roles require US-person status: the work cannot be done without seeing controlled data. The interview module later in the course comes back to this.

## Check yourself

::: check
What is the difference between ASME Y14.100, Y14.24 and Y14.41, in one line each?
:::

::: answer
Y14.100 is the umbrella of engineering drawing practices: the general rules every drawing follows and which other standards apply. Y14.24 defines the types of drawing (detail, assembly, installation, interface control, specification control, source control and so on) and when each is used. Y14.41 defines model-based definition: how an annotated 3D model with PMI serves as the product definition.
:::

::: check
Your team buys an inertial measurement unit from an outside company, but only one supplier's unit has passed your qualification tests. Which type of drawing controls the purchase, and why not the other close type?
:::

::: answer
A source control drawing, because it names the approved source or sources along with the required performance and interface. A specification control drawing would let any supplier who meets the specification qualify, which is not acceptable when only one supplier's unit has been qualified.
:::

::: check
On an MBD program, a supplier makes a part to an old PDF drawing that disagrees with the released model. Whose part is right, and what does that tell you about where the definition lives?
:::

::: answer
The released, revision-controlled model is the authoritative definition, so a part that matches the old PDF but not the model is nonconforming. Model-based definition moves the controlled definition from the 2D drawing into the annotated 3D model; a leftover drawing is only a reference.
:::

::: check
A colleague who is not a US person asks to look at your star-tracker alignment budget on your screen, in your office in the US. The document is marked as ITAR-controlled. Why is this not a simple yes?
:::

::: answer
Showing ITAR-controlled technical data to a foreign person inside the US can be a deemed export: legally, it is as if the data were sent to that person's country. Without an authorization it may be prohibited. The right move is to ask the company's export-control office, not to decide yourself.
:::

::: check
A drawing of a launch-vehicle bracket was released without its export-control legend. Is it now safe to share freely?
:::

::: answer
No. The control comes from what the drawing describes, not from the marking. The drawing is still controlled technical data; the missing legend is a compliance error that should be corrected, and the drawing must be handled as controlled in the meantime.
:::

## Summary

| Idea | Meaning | Key fact |
| --- | --- | --- |
| ASME Y14.100 | Engineering drawing practices | The umbrella US drawing standard |
| ASME Y14.24 | Drawing types | Detail, assembly, installation, ICD, spec control, source control |
| ASME Y14.41 | Model-based definition | Annotated 3D model is the authoritative definition |
| PMI | Product and manufacturing information | Tolerances, datums, notes, finish, material in the model |
| General tolerance note | Covers unlabelled surfaces in MBD | Makes every surface inspectable |
| ITAR | State Department, Munitions List | Launch vehicles, many spacecraft items |
| EAR | Commerce Department, dual-use items | Many commercial satellite parts |
| Deemed export | Showing data to a foreign person in the US | Counts as an export |
| Export marking | Legend stating the data is controlled | Warns; the content is what is controlled |

That completes the drawing module. The next module, geometric dimensioning and tolerancing, turns the tolerances you have met into the full ASME Y14.5 language — the one in which a GNC alignment budget finally becomes a line on a drawing.

::: context asme Who writes the rules
ASME was founded in 1880 by engineers worried, among other things, about exploding steam boilers. Its boiler code made pressure vessels safe by making everyone build them the same way. The Y14 drawing standards apply the same idea to communication. Outside the US, ISO standards play the same role, and a drawing made to ISO conventions — first-angle projection, different weld symbols — can differ in small but important ways.
:::

::: context icd One page, two teams
An interface control drawing is a contract drawn as a picture. Each side agrees to meet the boundary and is then free to design everything behind it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="120" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="30" width="120" height="80" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="15" x2="180" y2="125" stroke="#b4232c" stroke-width="3"/>
  <text x="90" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">tracker maker</text>
  <text x="270" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">bracket team</text>
  <text x="180" y="142" font-size="12" text-anchor="middle" fill="#b4232c">ICD: holes, face, flatness, connector</text>
  <line x1="150" y1="70" x2="176" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="184" y1="70" x2="210" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```

Changing an ICD needs both sides to agree, which is exactly why they are guarded so carefully.
:::

::: context pmi What PMI looks like
In a CAD program, PMI appears as dimensions, tolerance frames and notes floating in 3D, attached to the faces they control. You rotate the model to read them, and **saved views** show useful groups of them from a set angle, like the views of a drawing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="60,120 200,120 260,80 120,80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="60,120 200,120 200,150 60,150" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="200,120 260,80 260,110 200,150" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="160" cy="100" rx="16" ry="7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="160" y1="100" x2="210" y2="40" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="210" y="26" width="120" height="24" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="270" y="43" font-size="12" text-anchor="middle" fill="#1d6fd1">⌀10.0 ±0.05</text>
  <line x1="100" y1="100" x2="60" y2="50" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="20" y="26" width="80" height="24" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="60" y="43" font-size="12" text-anchor="middle" fill="#1d6fd1">Ra 1.6</text>
</svg>
```

The annotations are attached to the hole and the top face themselves, so software knows which feature each one controls.
:::

::: context cmm A machine that measures in 3D
A coordinate measuring machine moves a probe in three directions and records the exact position of each point it touches on a part. Its software compares those points with the nominal model and reports how far each lies from where it should be. With semantic PMI, the software can read the tolerances from the model and build much of the inspection plan by itself. The GD&T module returns to this in detail.
:::

::: context step-ap242 A neutral language for models
STEP is an international standard file format for 3D product data, and AP242 is the part of it ("application protocol") aimed at model-based definition. It can carry the shape plus semantic PMI, so a supplier on a different CAD program still receives machine-readable tolerances. Older neutral formats often carried only the bare shape, and every tolerance had to travel on a separate drawing.
:::

::: context usml A list of controlled things
The US Munitions List is a list of categories of defence items — from firearms to spacecraft — that ITAR controls. Launch vehicles have their own category, and so do spacecraft and related items. Over the years, many commercial satellite items were moved off this list to the EAR's Commerce Control List, which is generally easier to license. Deciding which list an item falls under is called **classification**, and it is done by trained specialists, not by the engineer who drew the part.
:::

::: context us-person Who counts as a US person
Under these regulations, a **US person** is, broadly, a US citizen, a lawful permanent resident (a green-card holder), or someone granted certain protected status such as asylum. The test is about legal status, not where someone lives or works. A foreign national working in a US office is not a US person for this purpose, which is why deemed exports can happen without anything leaving the building.
:::
