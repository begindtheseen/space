---
id: l04-title-block-and-revisions
title: The title block, revisions and why the drawing is the law
minutes: 22
covers:
  - Title block, revision block, revision letters and change bars
  - The drawing as the legal definition of the part
---

Think about a recipe card that has been in a family for years. Somebody crossed out "1 cup sugar" and wrote "3/4 cup" next to it. Somebody else added "bake 5 minutes less in the new oven". If two cousins bake from two different copies of that card, they get two different cakes. Both will swear they followed the recipe.

Now think about a lease for an apartment. It has names, a date and signatures at the bottom. If the landlord and the tenant disagree later, nobody asks what either of them *remembers*. They pull out the signed paper, and the paper wins.

An engineering drawing is both of these things at once. It is a recipe that changes over time, so it needs a careful record of every change. And it is a signed agreement: the shop that makes a part, the buyer who pays for it and the inspector who accepts it are all bound by what the drawing says. This lesson is about the two boxes on the sheet that make that possible — the **title block**, a box of facts about the drawing itself, and the **revision block**, the drawing's change history — and about why a released drawing is the **legal definition of the part**: the one document everyone has agreed to hold the part to.

## The title block: the drawing's passport page

Open a passport and one page tells you who the holder is, when the document was issued and who issued it. The **title block** does the same job for a drawing. In US practice it sits in the [[lower right corner of the sheet|sheet-layout]], so it is the first thing you see when drawings are stacked or folded.

A typical title block holds these fields:

- **Part number** and **drawing number** — the unique names of the part and of this document. They are often the same string. The part number is what gets stamped or etched onto the part itself.
- **Title** (also called **nomenclature**) — a short plain name, written noun first: "BRACKET, STAR TRACKER" rather than "star tracker bracket", so that an alphabetical list groups all brackets together.
- **Size** and **sheet** — the paper size letter and "SHEET 2 OF 3", so you know if pages are missing.
- **Scale** — the ratio from the last lesson, such as 1:2.
- **The projection symbol** — the truncated cone that says third angle or first angle (lesson 1).
- **Units** — "DIMENSIONS ARE IN MILLIMETERS" or inches. Never assume.
- **The tolerance block** — the default tolerances that apply to every dimension that does not carry its own.
- **Material** and sometimes **finish**, or a pointer to where the notes give them.
- **Signatures and dates** — DRAWN, CHECKED, ENGINEER, and approvals from other groups such as quality or stress.
- **Company name and code** — often a **[[CAGE code|cage-code]]**, a five-character code that identifies the design owner to US government buyers.

The fields vary from company to company, but the purpose never does. Everything someone needs to know *about the document* — before reading a single dimension — lives in that box.

### The tolerance block

One field deserves a closer look now, because you will lean on it for the rest of this module. No real part is made to an exact size. So every dimension needs a **tolerance**, the amount it may vary. Writing a tolerance next to every number would clutter the sheet, so the title block carries a rule for the ones that have none. It usually reads "UNLESS OTHERWISE SPECIFIED" and then gives a tolerance for each number of decimal places. For example:

- X.X (one decimal place): $\pm 0.3$ mm
- X.XX (two decimal places): $\pm 0.1$ mm
- Angles: $\pm 0.5°$

Read $\pm$ aloud as "plus or minus". It means the real size may land anywhere from the written size minus that amount up to the written size plus it. Notice that the *number of decimal places* you write changes the tolerance. On this sheet, $42.5$ and $42.50$ are the same size, but they are two different promises.

::: example Reading a dimension through the tolerance block
A bracket's drawing shows a slot width of $42.5$ with no tolerance written next to it. The tolerance block says one-place decimals are $\pm 0.3$ mm. What sizes will the inspector accept?

The dimension has one decimal place, so the one-place rule applies: $\pm 0.3$ mm.

Smallest acceptable width: $42.5 - 0.3 = 42.2$ mm.

Largest acceptable width: $42.5 + 0.3 = 42.8$ mm.

So any slot from $42.2$ to $42.8$ mm passes. If the designer had written $42.50$ instead, the two-place rule would give $42.4$ to $42.6$ mm — a band one third as wide ($0.2$ mm instead of $0.6$ mm). Same size, very different machining job. Sanity check: $42.2$ and $42.8$ sit equally far either side of $42.5$, as a plus-or-minus tolerance should.
:::

::: warning Do not skip the title block
People who are new to drawings jump straight to the pretty views. Then they read a millimetre drawing as inches, or a first-angle drawing as third angle, or miss that a plain dimension carries a tolerance. Read the title block first, every time. It takes thirty seconds and it sets the meaning of everything else on the sheet.
:::

## The revision block: the drawing's change log

Back to the recipe card. The real problem was not that the recipe changed — recipes should improve. The problem was that nobody could tell *which* version a cousin was holding. The fix is a **revision**: a numbered, dated, approved version of the document.

The **revision block** is a table, usually in the upper right corner of the sheet. Each row records one release:

| REV | DESCRIPTION | DATE | APPROVED |
| --- | --- | --- | --- |
| A | INITIAL RELEASE | 2025-03-04 | JLM |
| B | HOLE DIA 6.0 WAS 5.5, PER ECO 1142 | 2025-06-19 | JLM |

A company's rules decide the details, but the pattern is always the same:

- **Revision letter** — the name of this version. The first release is often A. (Some companies mark the first release with a dash and start letters at the first change.)
- **Description** — what changed, often in "IS / WAS" form: what it is now and what it was before.
- **Change order number** — the paperwork that approved the change, often called an **[[engineering change order|eco]]** (ECO) or engineering change notice (ECN).
- **Date and approval** — who signed it off and when.

The current revision letter also appears in the title block, so a single glance tells you which version you hold.

### Revision letters

Letters go A, B, C and so on. But the US drawing practice skips letters that are easy to mistake for numbers or for each other — **I, O, Q, S, X and Z**. After H comes J. After R comes T. After Y the letters double up: AA, AB, and so on.

::: example Counting releases
A bracket drawing is at revision H. A new change is approved. What is the next letter, and how many releases will the drawing have had, counting the first one as A?

The next letter after H would be I, but I is skipped because it looks like the number 1. So the next revision is **J**.

List the releases: A, B, C, D, E, F, G, H, J. Count them: that is 9 releases, even though J is the 10th letter of the alphabet. The skipped I is the difference, $10 - 1 = 9$.

Sanity check: nine releases for a part that has been through testing and a few design fixes is ordinary. A flight bracket often collects several revisions before and after its first build.
:::

### Change bars and revision flags

A description in the revision block tells you *what* changed. You also want to see *where*. Drawings mark the spot in one of two ways:

- A **[[revision flag|revision-flag]]** — a small triangle with the revision letter inside, drawn next to the dimension, note or view that changed.
- A **change bar** — a thick vertical line in the margin beside a changed note or line of text, the same device used in manuals and specifications.

Both say "look here, this is different from last time". When you review a new revision, you check each flag against the description. If a flag has no matching description, or a description has no flag, something is wrong with the drawing, and a good checker sends it back.

### New revision or new part number?

Not every change gets a new letter. Some changes deserve a whole new part number. The test engineers use is **[[form, fit and function|form-fit-function]]**: can the new part replace the old one everywhere, with no other change?

- If yes, the parts are **interchangeable**. A fix to a drafting typo, or a slightly better finish that changes nothing about how the part fits or works, gets a new revision letter.
- If no — the bolt pattern moved, the part got heavier in a way that matters, the material changed its strength — the new part cannot be dropped into an old assembly. It gets a **new part number**, so nobody can mix up the two on a shelf.

::: key
A revision letter means a specific configuration was released and built. Hardware is traceable to a revision, so as-designed, as-built and as-flown can differ, and an anomaly investigation starts by establishing which revision actually flew.
:::

## As-designed, as-built, as-flown

Here is where revisions stop being paperwork and start being safety. A spacecraft is not built in one afternoon from one set of drawings. Parts are made over months. Drawings keep changing while parts sit in storage. So at any moment there are three different descriptions of the same vehicle:

- **As-designed** — what the latest released drawings say.
- **As-built** — what each actual part was really made to: its drawing revision, its serial number, and any approved departures from the drawing.
- **As-flown** — what actually left the ground, including any late swaps and repairs.

These can differ, and that is normal. What is not acceptable is not *knowing* how they differ. That is why a flight part is marked with its part number, revision and a **serial number**, a unique number for that one physical item. The build records tie every serial number to the revision it was built to. This bookkeeping is called **[[configuration management|config-mgmt]]** — keeping track of exactly which version of everything is in each unit.

::: example Which bracket flew?
A reaction-wheel bracket went from revision B to revision C on the day serial number 015 started machining. Rev C enlarged a lightening hole to save mass. Serial numbers 001 to 014 were built to rev B. The spacecraft that flew used serial number 012. After a vibration test anomaly on a later unit, the team asks: did the flight unit have the bigger hole?

Serial 012 is in the range 001 to 014, so it was built to rev B. The flight unit has the *old*, smaller hole. How many rev B units exist? Count 001 to 014: $14 - 1 + 1 = 14$ units.

So the anomaly on a rev C unit does not automatically apply to the flight hardware — but it also does not clear it. The engineers now know exactly which geometry to analyze. Without the revision record, they would be guessing. Sanity check: the "plus 1" in $14 - 1 + 1$ is there because both ends count; 001 through 014 is fourteen parts, not thirteen.
:::

::: warning "Latest" is not "what flew"
It is tempting to open the newest drawing and assume it describes the hardware. For anything already built, it may not. Always ask which revision the specific serial number was built to, and whether any approved departures apply to it.
:::

## Why the drawing is the law

Go back to the lease. Once it is signed, it is the thing both sides agreed to. A drawing becomes that kind of document at **release**: the moment it is signed through the company's configuration control and given a revision letter. Before release it is a draft that anyone can change. After release, it can only change through a new revision.

A released drawing is the legal definition of the part for three groups of people:

- **Procurement.** When a company buys a part from a supplier, the purchase order points to a part number and a revision. The supplier is contractually bound to make that part to that drawing — not to what an engineer said on the phone.
- **The supplier and the shop.** They make what the drawing says. If the drawing is ambiguous, they ask, and the answer comes back as a formal change.
- **Inspection.** The inspector measures the part against the drawing. Every dimension, note and tolerance is a pass or fail test.

So a part is **conforming** if it meets every requirement on its drawing revision, and **nonconforming** if it misses even one. A nonconforming part is not thrown away automatically. A group of engineers, often called a **[[material review board|mrb]]**, decides whether to use it as is, rework it, or scrap it. But that decision is formal and recorded, because the part no longer matches its legal definition.

### The CAD model does not win

Today most drawings are made from a 3D CAD model. It feels like the model is the "real" part and the drawing is only a picture of it. Legally, under a drawing-based process, it is the other way around. If the model says a hole is 6.0 mm and the released drawing says 6.4 mm, the part must be 6.4 mm. The model is a working file that anyone with access might have edited since; the released drawing is the controlled document everyone signed.

There is one important exception, and it is where the industry is heading. Under **model-based definition**, the annotated 3D model itself — with its tolerances and notes attached — is released and controlled, and it takes the drawing's place. Lesson 9 covers that. The principle does not change: whatever is released and controlled is the definition.

::: key
Why is the drawing the legal definition of the part? It is the controlled document that inspection, procurement and the supplier are contractually bound to. A CAD model that disagrees with the released drawing does not win; under model-based definition the annotated model becomes that controlled document instead.
:::

::: warning Uncontrolled copies
A printout from last month, a screenshot in a chat, a PDF on someone's laptop: none of these is the drawing. They are **uncontrolled copies** — snapshots that do not update when the drawing is revised. Many companies stamp printouts "UNCONTROLLED WHEN PRINTED" for this reason. Before you rely on a sheet, check its revision against the one currently released in the company's records system.
:::

### Why a GNC engineer should care

You might never make a drawing. But the numbers in your models come from hardware. A [[star tracker's mounting angle|tracker-angle]], a thruster's position, a reaction wheel's alignment — each is set by a dimension on some released drawing, at some revision. When a flight result looks strange, one of the first questions is whether the hardware that flew matched the geometry in your simulation. The revision record is how that question gets answered.

## Check yourself

::: check
A title block's tolerance block gives two-place decimals as $\pm 0.1$ mm. A hole on the drawing is labeled $8.25$ with no tolerance of its own. What range of diameters passes inspection?
:::

::: answer
The dimension has two decimal places, so the two-place rule applies: $\pm 0.1$ mm. Smallest: $8.25 - 0.1 = 8.15$ mm. Largest: $8.25 + 0.1 = 8.35$ mm. Any diameter from $8.15$ to $8.35$ mm passes.
:::

::: check
A drawing is at revision R. What is the next revision letter, and why?
:::

::: answer
The next letter would be S, but S is skipped because it is easy to confuse with the number 5. So the next revision is T.
:::

::: check
Your team changes a bracket's bolt pattern so that the new bracket no longer fits the old spacecraft panel. Should this be a new revision letter or a new part number? Explain.
:::

::: answer
A new part number. The new bracket fails the form, fit and function test: it cannot replace the old one without changing the panel too. Giving it the same part number with a new letter would let someone pull an old-pattern bracket off the shelf for a new-pattern panel, or the other way around. A new revision letter is for changes that keep the part interchangeable.
:::

::: check
A supplier's machinist builds a part from a CAD model an engineer emailed him. The model shows a hole at 12.0 mm. The released drawing, rev D, shows 12.5 mm. Inspection measures 12.0 mm. Is the part conforming?
:::

::: answer
No. The released drawing at the revision on the purchase order is the legal definition, and it says 12.5 mm. The emailed model is not controlled and does not win. The part is nonconforming and goes to a material review board, which will decide whether it can be used as is, reworked, or must be scrapped.
:::

::: check
Name the three configurations of a flight vehicle discussed in this lesson, and say in one sentence why they can differ.
:::

::: answer
As-designed (what the latest released drawings say), as-built (what each serial-numbered part was actually made to) and as-flown (what actually launched). They differ because drawings keep being revised while parts already made keep their original revision, and late swaps or repairs can happen right up to launch.
:::

## Summary

| Idea | Meaning | Where to find it |
| --- | --- | --- |
| Title block | Facts about the document: number, title, scale, units, projection, tolerances, signatures | Lower right corner |
| Tolerance block | Default tolerance for any dimension without its own, set by decimal places | Inside the title block |
| Revision block | Table of releases: letter, description, date, approval | Upper right corner |
| Revision letters | A, B, C, … skipping I, O, Q, S, X, Z; then AA, AB, … | Revision block and title block |
| Revision flag, change bar | Mark where on the sheet a change was made | Next to the changed item |
| Form, fit and function | Test for new revision versus new part number | Engineering judgment |
| As-designed, as-built, as-flown | Latest drawings, what each serial number was made to, what launched | Configuration records |
| Legal definition | The released, controlled drawing binds procurement, supplier and inspection | Release through configuration control |

Next lesson moves from single parts to assemblies: how a drawing lists every part that goes into a unit, points at each one with a numbered balloon, and gives instructions in general and flag notes.

::: context sheet-layout Where things sit on a sheet
On a US drawing, the two boxes you read first have fixed homes. The title block sits in the lower right corner and the revision block in the upper right. The views fill the middle, and general notes often sit to the left of the title block. Zone letters and numbers around the border work like map grid squares, so someone can say "the change is in zone C3".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="10" width="340" height="180" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="20" y="20" width="320" height="160" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <rect x="230" y="20" width="110" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="44" font-size="12" text-anchor="middle" fill="#1f2a44">revision block</text>
  <rect x="230" y="130" width="110" height="50" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="285" y="159" font-size="12" text-anchor="middle" fill="#1f2a44">title block</text>
  <rect x="120" y="130" width="100" height="50" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="170" y="159" font-size="11" text-anchor="middle" fill="#6c7a93">notes</text>
  <rect x="45" y="40" width="60" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="45" y="90" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="40" width="40" height="40" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">views</text>
</svg>
```
:::

::: context cage-code A code for who owns the design
CAGE stands for Commercial and Government Entity. It is a five-character code the US government assigns to companies and sites that do business with it. Putting it in the title block matters because part numbers are not unique across the world: two companies could both have a part called 100-2345. The pair "CAGE code plus part number" is unique. When a government program orders a spare, that pair is how it names exactly which company's design it means.
:::

::: context eco The paperwork behind a change
An engineering change order is a formal request that goes through review before a drawing can be revised. It says what will change, why, which parts and assemblies are affected, and what happens to parts already built or in stock — use them, rework them, or scrap them. Reviewers from design, stress, manufacturing and quality sign it. Only then does the drafter update the drawing and release the new letter. On the revision block, the ECO number is the thread you pull to find the full story of a change.
:::

::: context revision-flag What a revision flag looks like
A revision flag is a small triangle with the revision letter inside, placed next to whatever changed. Here, the hole diameter changed at revision B, so a "B" triangle sits beside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="170" height="90" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="115" cy="75" r="18" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="128" y1="62" x2="170" y2="20" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="128,62 131,52 137,58" fill="#1f2a44"/>
  <line x1="170" y1="20" x2="215" y2="20" stroke="#1f2a44" stroke-width="1"/>
  <text x="218" y="24" font-size="12" fill="#1f2a44">⌀6.0</text>
  <polygon points="275,32 262,10 288,10" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="275" y="24" font-size="12" text-anchor="middle" fill="#b4232c">B</text>
  <rect x="230" y="70" width="110" height="60" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <text x="240" y="88" font-size="11" fill="#1f2a44">REV B:</text>
  <text x="240" y="104" font-size="11" fill="#1f2a44">HOLE DIA 6.0</text>
  <text x="240" y="120" font-size="11" fill="#1f2a44">WAS 5.5</text>
</svg>
```

The small box stands for the matching row in the revision block. Flag and row must always agree.
:::

::: context form-fit-function Three questions in one phrase
Form is the part's shape, size and mass. Fit is its ability to join up with the parts around it: bolt patterns, mating surfaces, connectors. Function is what it does: carry a load, conduct heat, hold an alignment. If a changed part matches the old one in all three, anyone can swap one for the other without noticing, and a revision letter is enough. If it fails any one, a mechanic who grabbed the wrong one would build something that does not fit or does not work, so it earns a new part number.
:::

::: context config-mgmt A bookkeeping discipline, not a tool
Configuration management is the practice of knowing, for every unit, exactly which versions of which parts, drawings and software it contains, and controlling how those versions change. Aerospace companies run it through a product lifecycle management (PLM) system that stores released drawings, change orders and build records together. The CAD tools module comes back to this, including **effectivity**: the rule that says which serial numbers a given revision applies to.
:::

::: context mrb When a part misses the drawing
A material review board is a small group, usually from engineering and quality, that decides what to do with a part that does not meet its drawing. The choices are often called **use as is**, **rework** (fix it so it conforms), **repair** (fix it to an approved condition that still differs from the drawing) and **scrap**. "Use as is" needs an engineering reason, such as an analysis showing the part still carries its load. The decision is recorded against that serial number — which is part of what makes as-built differ from as-designed.
:::

::: context tracker-angle From a drawing tolerance to a pointing error
A star tracker reports where the stars are relative to its own boresight, its line of sight. The spacecraft needs attitude relative to its body. The mounting bracket's dimensions and tolerances set the angle between the two. If the bracket tilts the tracker by a small angle that nobody measures, the filter treats that tilt as truth, and the attitude estimate is off by that much.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="115" width="320" height="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="128" font-size="11" fill="#1f2a44">spacecraft body</text>
  <rect x="160" y="85" width="40" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="85" x2="180" y2="10" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="140" y="20" font-size="11" text-anchor="end" fill="#6c7a93">designed</text>
  <line x1="180" y1="85" x2="206" y2="12" stroke="#b4232c" stroke-width="2"/>
  <text x="212" y="20" font-size="11" fill="#b4232c">as built</text>
  <path d="M180,45 A40,40 0 0,1 193.5,47.4" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="196" y="60" font-size="12" fill="#1f2a44">tilt</text>
</svg>
```

The tilt is exaggerated here. Real ones are hundredths of a degree, and lesson 7 shows how to add them up.
:::
