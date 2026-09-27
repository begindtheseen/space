---
id: l13-interchange-and-the-cad-landscape
title: Moving models between programs, and who uses what
minutes: 22
covers:
  - 'Interchange formats: STEP, IGES, Parasolid, JT, and translation fidelity'
  - 'The landscape: NX plus Teamcenter at SpaceX; CATIA at Boeing and Airbus; Creo in defence; SolidWorks at suppliers and startups; Onshape and Fusion as cloud-native newcomers'
---

Think about a cake again. You can hand a friend the finished cake, or you can hand them the recipe. With the cake they can eat it, measure it, even slice it and weigh a slice. But if they want the same cake 20% bigger, the cake itself will not tell them how. Only the recipe says "two cups of flour, bake 30 minutes", and only the recipe can be scaled up.

A CAD model is both at once inside its home program. The feature tree from lesson 9 is the recipe. The solid shape it produces is the cake. The moment the model leaves its home program for a different one, almost always only the cake travels.

This lesson is about that trip: the formats models travel in — STEP, IGES, Parasolid and JT — and what gets lost on the way. Then the map of which companies use which CAD system, because a supply chain almost always crosses from one system to another. Last, an honest answer to a fair question: how much of all this does a GNC engineer really need?

## Native files and neutral files

Every CAD program saves in its own **native format** — the program's private file type that keeps everything: sketches, constraints, the feature tree, mates, named expressions. NX saves `.prt` files. SolidWorks saves `.sldprt`. CATIA saves `.CATPart`. Each program reads its own native files perfectly, and generally cannot read the others' native files well, or at all.

So engineers need a common language. A **neutral format** is a file type that no single program owns, which many programs can write and read. Think plain English instead of private shorthand: everyone can read it, but the shorthand's extra meaning is gone.

What a neutral file carries is almost always the finished shape, stored as a **[[boundary representation|b-rep]]**, or **B-rep**. A B-rep describes a solid by its skin: the exact **faces** (flat, cylindrical or free-form surfaces), the **edges** where faces meet, and the **vertices** where edges meet. It is exact math, not an approximation. A hole is a true cylinder of radius 3.000 mm, not a ring of little flat patches.

What a neutral file does *not* carry is how that shape was made. There is no sketch, no "this hole stays concentric with that boss", no "wall = 2 mm". The receiving program gets a solid that is correct today and has no idea how it is meant to change. Engineers call this a **dumb solid** — a solid with geometry but no history or rules.

::: key
**STEP versus native format: what is lost.** STEP and IGES carry geometry but not the feature tree, the parametric relationships or (for older practice) the PMI, so the model becomes dumb solid. That is why a supplier working from STEP cannot make a parametric change the way the originator can.
:::

A dumb solid is not useless. You can measure it, clash-check it, compute its mass properties, machine from it, and even push its faces around with **direct editing** tools — tools that move a face with no feature tree behind it. But move one face by hand and nothing that "should" follow it will follow.

## The four formats you will meet

### STEP

**STEP** is the international standard for exchanging product data, published as **[[ISO 10303|iso-10303]]**. The name stands for *Standard for the Exchange of Product model data*. STEP files usually end in `.stp` or `.step`, and they are plain text you could open in a text editor (though you would not want to read one).

STEP is not one format but a family. Each member is an **application protocol**, or **AP** — a chapter of the standard that says which kinds of data a file may carry. Three matter:

- **AP203** — the original workhorse for mechanical parts and assemblies: exact solids plus the assembly structure (which part sits where).
- **AP214** — grew out of the car industry. It carries what AP203 does plus extras such as colors and layers.
- **AP242** — the modern one. It merges AP203 and AP214 and adds what model-based definition needs: **semantic PMI**, the machine-readable tolerances and datums from lesson 12, attached to the faces they control.

STEP is the default when two companies on different CAD systems swap a model. STEP also records its units inside the file, so a properly written and read STEP file arrives at the right size.

### IGES

**IGES** (Initial Graphics Exchange Specification) is older, dating from the early 1980s. It was built mainly to swap curves and surfaces between the drafting and surfacing systems of that time. You still meet it, especially with old archives and surfacing work.

Its weakness is solids. An IGES file often arrives as a loose collection of surfaces, not a closed solid. The receiving program then has to **stitch** (or **sew**) them — find which edges belong together and join them into one watertight skin. When that fails, you get an **open shell**: a skin with holes in it, which encloses no volume. A shell with no volume has no mass, so its mass properties are meaningless. For most new work STEP has replaced IGES.

### Parasolid

**Parasolid** is different in kind. It is not a neutral standard but a **[[geometry kernel|kernel]]** — the math engine inside a CAD program that actually builds and stores the B-rep solids. Siemens owns Parasolid, and NX, SolidWorks and Onshape are among the many programs built on it. Its files end in `.x_t` (text) or `.x_b` (binary).

Here is why that matters. When two programs share the same kernel, a Parasolid file passes the solid across with no translation at all — the receiving program reads exactly the math the sending program wrote. So between NX, SolidWorks and Onshape, `.x_t` is often the cleanest route. It still carries no feature tree. It is the best possible dumb solid, but a dumb solid all the same.

### JT

**JT** is a lightweight format that Siemens owns and that is also published as an ISO standard. It is built for viewing big assemblies, not editing them. A JT file stores the product structure (the tree of assemblies and parts), a [[faceted version of each shape|tessellation]] — the surfaces approximated by many small triangles — often at several levels of detail, and optionally the exact B-rep and the PMI as well.

Why triangles? A graphics card draws them fast. A 25,000-part vehicle as exact B-rep is heavy; as triangles you can spin it on a laptop and walk through the avionics bay. JT is widely used in the car industry and for viewing large models in Teamcenter.

::: warning A picture is not a part
A triangle mesh is an approximation. A round hole becomes a many-sided polygon, so its diameter depends on where you measure. Fine for review; wrong for manufacturing or for mass properties. If you are handed JT or a mesh, ask whether it contains exact geometry before you trust any dimension you measure in it.
:::

| Format | Owner | Carries | Typical use |
|---|---|---|---|
| STEP AP203 / AP214 | ISO standard | Exact solids, assembly structure; AP214 adds colors and layers | Swapping models between different CAD systems |
| STEP AP242 | ISO standard | All of that plus semantic PMI | Model-based definition to suppliers |
| IGES | Older US standard | Curves and surfaces, often not closed solids | Legacy archives, surface work |
| Parasolid x_t | Siemens (a kernel) | Exact solids, no translation between Parasolid programs | NX, SolidWorks, Onshape exchange |
| JT | Siemens, ISO standard | Product structure, triangles, optional exact geometry and PMI | Viewing and reviewing large assemblies |

None of the five rows carries the feature tree. Only the native file does.

## Translation fidelity: what gets hurt on the way

**Translation fidelity** is how faithfully a model survives the trip from one program to another. Losing the feature tree is guaranteed and expected. The nastier losses are the ones nobody notices.

### Tolerance mismatch

Every kernel has a **modeling tolerance** — the distance below which two points count as "the same point". Real surfaces never meet perfectly: two faces sharing an edge may end a few thousandths of a millimeter apart. If the gap is smaller than the tolerance, the kernel calls the edge closed and the solid watertight.

Now send that solid to a program with a *tighter* tolerance. Gaps that were "closed" at home are now [[bigger than the receiver's tolerance|gap-tolerance]], so the receiver sees open edges. The solid turns into an open shell. Nothing is wrong with the design — the two programs disagree about what "touching" means.

::: example A solid that falls open on import
A bracket is modeled in a program whose tolerance is $0.01\,\mathrm{mm}$. Five edges have tiny gaps: $0.0004$, $0.002$, $0.006$, $0.0008$ and $0.009\,\mathrm{mm}$. It is sent as STEP to a program whose tolerance is $0.001\,\mathrm{mm}$.

**At home.** Compare each gap with $0.01$. All five are smaller, so every edge counts as closed. The bracket is a valid solid.

**At the receiver.** Compare each gap with $0.001$. The gaps $0.0004$ and $0.0008$ are smaller, so those two edges are fine. The gaps $0.002$, $0.006$ and $0.009$ are larger. That is **3 open edges**, so the bracket imports as an open shell with no volume.

**Healing.** The receiver's healing tool is told to sew with a tolerance of $0.01\,\mathrm{mm}$, the sender's value. All five gaps close. The largest distance any geometry had to move is $0.009\,\mathrm{mm}$.

**Checking the result.** The sender's report said the volume was $152\,340\,\mathrm{mm^3}$. The healed solid reports $152\,337\,\mathrm{mm^3}$. The difference is $3\,\mathrm{mm^3}$, which is
$$
\frac{3}{152\,340} \times 100\% \approx 0.002\%.
$$
In aluminum at $2700\,\mathrm{kg/m^3}$ that is $3 \times 10^{-9}\,\mathrm{m^3} \times 2700 \approx 8 \times 10^{-6}\,\mathrm{kg}$, about 8 milligrams.

**Sanity check.** The healing moved geometry by at most $0.009\,\mathrm{mm}$. A typical machined dimension might be held to $\pm 0.1\,\mathrm{mm}$, so the movement is less than a tenth of the tolerance a machinist works to. The healed bracket is the same part.
:::

**Healing** is the general name for the repair tools that close small gaps, sew surfaces into solids, and remove **sliver faces** — faces so thin they are just noise from the translation. It works when gaps are small. When a face is truly missing, healing cannot guess it; ask the sender for a better file.

### Other quiet losses

- **Units.** STEP records its units. Some other formats do not. The triangle format **[[STL|stl-units]]**, common in 3D printing, stores bare numbers with no units at all, so the receiver has to guess.
- **PMI.** Tolerances travel as semantic PMI only in AP242, and only if both programs support it. Otherwise they arrive as dumb graphics that look right but that an inspection program cannot read — or not at all.
- **Names, structure and tiny features.** Part names and sub-assembly grouping can be garbled, and very small fillets can be distorted.

::: example The bracket that weighed two tonnes
An aluminum bracket has a volume of $45\,000\,\mathrm{mm^3}$. Density $2700\,\mathrm{kg/m^3}$.

**True mass.** Convert the volume to cubic meters: $1\,\mathrm{mm^3} = 10^{-9}\,\mathrm{m^3}$, so $45\,000\,\mathrm{mm^3} = 4.5 \times 10^{-5}\,\mathrm{m^3}$. Multiply by density: $4.5 \times 10^{-5} \times 2700 = 0.1215\,\mathrm{kg}$, about 122 grams.

**The mistake.** The file came through a format with no units, and the receiver's software assumed inches. Every length is now read as 25.4 times too big. Volume depends on length cubed, so it grows by
$$
25.4^3 \approx 16\,387.
$$
The "mass" becomes $0.1215 \times 16\,387 \approx 1991\,\mathrm{kg}$ — about two tonnes.

**Inertia is worse.** A moment of inertia is mass times distance squared. Mass grew by $25.4^3$ and distance squared by $25.4^2$, so inertia grows by $25.4^5 \approx 1.06 \times 10^7$.

**Sanity check.** A hand-sized bracket cannot weigh as much as a car. The habit that catches this: after any import, measure one dimension you already know, such as the bracket's 80 mm width, before you trust anything else.
:::

::: warning Always check an import against the sender's numbers
Ask the sender for the volume (or mass), the center of gravity and one overall dimension from the native model, and compare after import. A tiny mismatch is healing noise. A big one is a broken or mis-scaled file — and a wrong inertia tensor.
:::

## The landscape: who uses what

Now the map. The big systems all work the same way at heart — sketches, features, a tree, assemblies. What differs is which companies chose which one, and that decides what format a supplier has to send.

### SpaceX: NX with Teamcenter

SpaceX's choice is documented in [[Siemens's published case study|case-study]] of the company. The account runs like this.

::: key
**Which CAD system SpaceX uses, and why.** Siemens NX with Teamcenter for product data management, plus NX Nastran and Femap for analysis. They moved after roughly a year on a mid-range package whose Falcon 1 assemblies took over an hour to load; NX handles 25,000-plus part assemblies in five to ten minutes, and technicians use the models directly.
:::

Read that the way an engineer would. The reason was **scale**: a rocket is a huge assembly, and a tool that takes an hour to open it wastes everyone's day. Teamcenter manages the data — the next lesson is about what that means. **NX Nastran** is a finite-element solver (it computes stresses and vibration modes) and **Femap** sets up and displays those analyses. NX descends from a program called Unigraphics, so older engineers still say "UG".

### Boeing and Airbus: CATIA

**CATIA** is made by Dassault Systèmes, a French company. Boeing adopted CATIA in 1986, and the 787 Dreamliner was designed in it. Airbus uses CATIA too.

### Defence: Creo

**Creo** is made by PTC, and it is the descendant of Pro/ENGINEER, one of the first commercial parametric modelers. It is used heavily in the defence industry.

### Suppliers, startups and student teams: SolidWorks

**SolidWorks** is also made by Dassault Systèmes, but it is a mid-range desktop program: cheaper and quicker to learn. Machine shops, small suppliers, startups and university rocketry teams use it widely. So a big company on NX or CATIA often has suppliers on SolidWorks, with STEP or Parasolid as the bridge.

### Newcomers: Onshape and Fusion

**Onshape** (owned by PTC) and **Fusion** (made by Autodesk, long sold as Fusion 360) are [[cloud-native|cloud-native]]: the model lives on the company's servers and you work in a browser or a thin app. Several people can edit at once, and every change is recorded automatically.

::: key
**Who uses CATIA, NX, Creo and SolidWorks.** CATIA at Boeing (adopted 1986, the 787 was designed in it) and Airbus; NX at SpaceX and much of automotive and aerospace; Creo heavily in defence; SolidWorks at suppliers, startups and student teams; Onshape and Fusion as cloud-native newcomers.
:::

::: warning Say what is documented, not what you guess
Answer from a public source — a vendor case study, a job advert that names the tool, the company's own talks. "Siemens published a case study on their NX use" is strong. A confident wrong guess costs more than "I'd check their job postings".
:::

## The honest calibration: how much CAD does GNC need?

Here is the plain truth about this module. A GNC engineer does not design brackets for a living. Mechanical engineers do. What the GNC engineer needs is **[[cross-discipline literacy|literacy]]** — enough to work well next to the people who do.

That means three things:

1. **Read a drawing.** Know what a feature control frame on a star-tracker mount means, and what a revision letter says about the hardware.
2. **Get mass properties right.** Know where the inertia tensor comes from (lesson 11), what invalidates it, and how to check a model you were sent (this lesson).
3. **Talk to mechanical engineers.** Ask the right question: "Which revision of the assembly is this? Are the harness and propellant in it? Is this STEP or native?"

Nobody expects a GNC candidate to hold a professional CAD certification. Hours spent becoming an NX expert are better spent on C++, Python, controls and estimation.

::: key
**How CAD is actually tested in a GNC interview.** Almost never directly. It appears as: have you worked with mechanical teams, where did your inertia tensor come from, and can you read this drawing. One solid, specific answer is enough.
:::

A good specific answer sounds like: "On our student team I pulled the inertia tensor from the SolidWorks assembly, found the harness was missing, added it as a distributed mass, and the principal moments changed by several percent, so I rechecked the controller gains." One such story beats a list of software you have opened.

## Check yourself

::: check
A supplier on SolidWorks needs a part from a company on NX. Name two formats that would carry the exact solid, and say which one avoids translation entirely and why.
:::

::: answer
STEP (say AP242) and Parasolid `.x_t` both carry exact B-rep solids. Parasolid avoids translation, because NX and SolidWorks are both built on the Parasolid kernel, so the receiver reads exactly the math the sender wrote. Neither carries the feature tree.
:::

::: check
Why would someone use JT instead of STEP to review a 20,000-part assembly on a laptop? What should they be careful about?
:::

::: answer
JT stores triangle versions of each part, often at several levels of detail, which graphics hardware draws fast, so a huge assembly opens and spins smoothly; exact STEP geometry is much heavier. The caution: triangles only approximate curved faces. Unless the JT file also carries exact B-rep, do not take manufacturing dimensions or mass properties from it.
:::

::: check
A model that was a valid solid in the sending program arrives as an open shell. Nothing is wrong with the design. Explain what most likely happened and one way to fix it.
:::

::: answer
Tolerance mismatch. The sending kernel's modeling tolerance was looser than the receiver's, so edge gaps small enough to count as closed at home are larger than the receiver's tolerance and show up as open edges. Fix: heal or sew with a tolerance matching the sender's, then compare the healed volume and center of gravity with the sender's numbers.
:::

::: check
An imported part's mass comes out about 16,000 times too large. What is the likely cause, and why is the factor about 16,000?
:::

::: answer
A unit mix-up: millimeter values read as inches. Every length is 25.4 times too big, and mass is density times volume, which goes as length cubed: $25.4^3 \approx 16\,387$. Measuring one known dimension right after import would have caught it.
:::

::: check
An interviewer asks which CAD system Boeing uses and which system the 787 was designed in. Answer, and say what a SolidWorks-based supplier to such a company would typically send.
:::

::: answer
Boeing uses CATIA, adopted in 1986, and the 787 was designed in it. A SolidWorks supplier would typically send STEP (AP242 if PMI is needed), since SolidWorks and CATIA share neither a native format nor a kernel.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Native format | The program's own file | The only file that keeps the feature tree and intent |
| B-rep, dumb solid | Exact faces, edges, vertices, no history | What neutral formats carry |
| STEP AP203, AP214, AP242 | ISO 10303 exchange protocols | AP242 adds semantic PMI; STEP stores units |
| IGES | Older surface-oriented format | Often arrives as surfaces that must be stitched |
| Parasolid x_t | Siemens kernel format | No translation between Parasolid-based programs |
| JT | Lightweight, faceted, product structure | For viewing big assemblies; triangles are approximate |
| Tolerance mismatch | Kernels disagree on what "touching" means | Heal, then check volume, CG and a known dimension |
| SpaceX | NX with Teamcenter, NX Nastran, Femap | Per Siemens's case study; large-assembly load time |
| Boeing, Airbus | CATIA | Boeing adopted 1986; 787 designed in it |
| Defence; suppliers; newcomers | Creo; SolidWorks; Onshape and Fusion | Cloud-native newcomers |
| CAD for GNC | Cross-discipline literacy | Read a drawing, get mass properties right, talk to mechanical teams |

The last lesson of this module is about the system that sits on top of the CAD tool: product lifecycle management, where part numbers, revisions, effectivity and change orders decide which version of a model is real.

::: context b-rep A solid described by its skin
Think of a cardboard box. You could describe it completely by listing its six flat panels, the twelve folds where panels meet, and the eight corners. You never need to describe the air inside: the skin fixes the inside. That is a boundary representation. Kernels store each face as an exact surface equation, trimmed by the edges around it, and keep a record of which faces touch across each edge. That "who touches whom" record is what makes the skin a closed, watertight solid rather than a pile of loose surfaces.
:::

::: context iso-10303 A standard in many parts
ISO is the International Organization for Standardization, the body behind thousands of standards, from screw threads to shipping containers. ISO 10303 is one of its biggest: it is split into many separately published parts, and the application protocols are some of them. That is why people say "STEP AP242" rather than a single edition number. The work began in the mid-1980s, when industry wanted one exchange format that could carry more than drawings and surfaces, which was the limit of IGES.
:::

::: context kernel The engine under the hood
A CAD program has two layers. The top layer is what you see: buttons, sketches, the feature tree. Underneath is the kernel, a library of math that does the hard geometry — intersecting two surfaces, rounding an edge, checking that a solid is closed. Many companies license a kernel rather than write their own, much as many car makers buy the same engine. Parasolid is the most widely licensed. CATIA runs on Dassault's own kernel and Creo on PTC's own, so a file from those programs must be translated to reach a Parasolid-based one. Kernel differences are the root of tolerance-mismatch trouble.
:::

::: context tessellation Curves made of straight pieces
A mesh replaces each curved face with flat triangles. Around a circle, the flat pieces cut corners, and the worst gap between the true circle and a flat piece, called the **sag** or **chordal deviation**, is $R\left(1 - \cos\frac{\pi}{n}\right)$ for $n$ equal pieces. For a $50\,\mathrm{mm}$ radius cut into 24 pieces, that is about $0.43\,\mathrm{mm}$; with 96 pieces it drops to about $0.027\,\mathrm{mm}$. Finer meshes look smoother but make bigger files, which is why JT keeps several levels of detail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="80" r="60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="145.4,103.0 113.0,135.4 67.0,135.4 34.6,103.0 34.6,57.0 67.0,24.6 113.0,24.6 145.4,57.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="145.4" y1="80" x2="150" y2="80" stroke="#b4232c" stroke-width="3"/>
  <line x1="152" y1="80" x2="196" y2="80" stroke="#b4232c" stroke-width="1"/>
  <text x="200" y="84" font-size="12" fill="#b4232c">sag: the biggest gap</text>
  <text x="200" y="40" font-size="12" fill="#1d6fd1">true circle (exact B-rep)</text>
  <text x="200" y="128" font-size="12" fill="#1f2a44">8 flat pieces (mesh)</text>
</svg>
```
:::

::: context gap-tolerance Two programs, two rulers
Each kernel draws an invisible ball around every point, the size of its modeling tolerance. If two edges' ends sit inside the same ball, they count as joined. Change the ball size and the same gap flips from closed to open.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="95" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <line x1="105" y1="75" x2="170" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="100" cy="75" r="22" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="100" y="118" font-size="12" text-anchor="middle" fill="#1d6fd1">loose tolerance: closed</text>
  <line x1="190" y1="75" x2="265" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <line x1="275" y1="75" x2="340" y2="75" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="270" cy="75" r="3" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="118" font-size="12" text-anchor="middle" fill="#b4232c">tight tolerance: open</text>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">same gap between two edges</text>
</svg>
```

The gap in the drawing is hugely exaggerated; real ones are thousandths of a millimeter.
:::

::: context stl-units The format that forgot its units
STL describes a shape only as a list of triangles, each given by three corner points and a direction. It was created in the 1980s for early 3D printers, and it has no field for units at all: a number 80 could mean 80 millimeters or 80 inches. Slicer programs for 3D printers usually assume millimeters. That is why a part sometimes appears 25.4 times too small or too large on the build plate. STL also has no exact curves, so it is never used as a definition of a flight part.
:::

::: context case-study Reading a vendor case study
A customer case study is written and published by the software vendor, with the customer's agreement, to show its product in a good light. It is still a useful, public, citable source for *which* tool a company chose and the reasons given at the time. Treat its numbers as the account the two companies agreed to publish, not as an independent measurement. In an interview, "Siemens's case study on SpaceX says…" is exactly the right way to cite it: specific, sourced, and honest about where it comes from.
:::

::: context cloud-native Software born on a server
Older CAD programs were written for one person on one desktop computer, with files saved to a disk and emailed or checked into a data system. Cloud-native programs were designed from the start to run on the vendor's servers. There is no file to lose or overwrite, many people can work on the same model at once, and every change is kept in a history you can roll back. The trade-off is that your company's data lives on someone else's computers, which export-control rules (from the drawings module) can make a serious question for flight hardware.
:::

::: context literacy Where your hours should go
This module is one small corner of the course on purpose. The next part of the course, the interview preparation modules, is where the calibration pays off: algorithm practice, C++ and Python, and system design. Everything here is meant to make you the GNC engineer who can sit in a mechanical design review, ask one sharp question about the mass model, and be trusted with the answer — not the one who knows the most CAD shortcuts.
:::
