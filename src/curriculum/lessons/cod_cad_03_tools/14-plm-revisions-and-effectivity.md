---
id: l14-plm-revisions-and-effectivity
title: Part numbers, revisions and which version is real
minutes: 20
covers:
  - 'PLM concepts: part numbers, revisions versus versions, effectivity, ECO and ECR, as-designed versus as-built versus as-flown'
---

Think about a group project at school. Four people share a folder. By the end of the week it holds `report.docx`, `report_v2.docx`, `report_final.docx`, `report_final_FIXED.docx` and `report_final_Jamie_edits.docx`. Which one did you hand in? Which one has the right chart? Nobody is quite sure, and two of you are arguing about a paragraph that was deleted three files ago.

For a school report, that is annoying. For a rocket, it is dangerous. A launch vehicle has tens of thousands of parts, each with a model and a drawing, each changed many times by many people over years. Some units were built months ago to older designs. The engineers need to answer, with no doubt at all: which design is the real one, which design was *this* serial number built to, and who approved each change?

The system that answers those questions is called **[[PLM|plm-pdm]]** — **product lifecycle management**, the software and rules that keep track of every part, its official versions and every change to it, from first idea to retirement. At SpaceX that system is Teamcenter, sitting on top of NX. This lesson builds the vocabulary one piece at a time, then shows exactly what Teamcenter does that NX does not. Your drawings module met some of these words already. Here they come together.

## Part numbers: one name, one interchangeable thing

A **part number** is the unique name of a design. Every bracket, bolt, harness and assembly gets one. The rule behind it is strict: every item with the same part number must be **interchangeable** — you can pick any one off the shelf, fit it, and the vehicle works the same. If two things are not interchangeable, they must not share a part number.

Assemblies have part numbers too. A reaction-wheel module has one; its bracket, its four bolts and its wheel each have their own. Variants of one design often share a base number with a **[[dash number|dash-number]]** on the end, such as `40017-01` and `40017-02` for a left-hand and a right-hand bracket.

### Significant and non-significant numbers

There are two schools of thought on what the number should look like.

A **significant** (or "intelligent") part number has meaning built into it. `BRK-AL-080-060` might mean "bracket, aluminum, 80 by 60 mm". You can read it without looking anything up. That feels helpful.

A **non-significant** (or "dumb") part number is only a counter: `4001783`. It means nothing by itself. Everything about the part — what it is, what it is made of — lives in the PLM system's record, called the part's **attributes**.

Many large aerospace companies lean toward non-significant numbers, for two reasons. First, designs change, and meaning goes stale. If `BRK-AL-080-060` is changed to titanium, either the number now lies or the part must be renumbered everywhere it is used. Second, meaningful fields run out, as the example shows.

::: example How long does a numbering scheme last?
A company creates about 50 new part numbers a day. Compare two schemes.

**Non-significant, 7 digits.** There are $10^7 = 10\,000\,000$ possible numbers. In a year the company uses $50 \times 365 = 18\,250$. Divide:
$$
\frac{10\,000\,000}{18\,250} \approx 548 \text{ years}.
$$

**Significant, a type code plus a 3-digit counter.** Each type code, such as `BRK` for brackets, has only $1000$ numbers, `000` to `999`. Suppose brackets alone use 50 new numbers a week during a busy design phase. Divide:
$$
\frac{1000}{50} = 20 \text{ weeks}.
$$
After five months the bracket field is full, and someone has to invent `BRK2` or break the scheme.

**Sanity check.** A 7-digit counter wastes no digits on meaning, so every digit adds a factor of 10 to the capacity. Spending digits on meaning splits the space into small boxes, and the busiest box fills first. That is the long-run problem significant numbers always hit.
:::

::: warning The part number does not change for every edit
Beginners often think every change needs a new part number. It does not. If the change keeps the part **[[interchangeable|fff]]** — same form, fit and function — the part keeps its number and gets a new **revision**. Only a change that breaks interchangeability needs a new part number.
:::

## Versions and revisions

Back to the school folder. Its problem was that every save looked equally "official". PLM fixes that by keeping two kinds of history apart.

A **version** is any saved state of a model or drawing while someone is working on it. Save ten times in an afternoon and you have ten versions. Versions are for the designer: they let you go back to this morning's state. Nobody outside the design team builds anything from them.

A **revision** is a *released*, controlled configuration. It has been reviewed, checked and approved, and it gets a letter: A, B, C and so on (skipping letters such as I and O that look like numbers, as the drawings module showed). Manufacturing, suppliers and inspection work only from revisions. Between revision B and revision C there may be forty versions; only B and C count.

The PLM system enforces the difference with **[[lifecycle states|lifecycle-states]]**. A typical path is *in work* → *in review* → *released*, and much later *obsolete*. While a design is in work, anyone on the team with permission can save new versions. Once released, the revision is frozen: nobody can edit it. To change it, you start the next revision, which begins its own life in work.

In Teamcenter a part is called an **item**, and each revision an **item revision**. The words differ from system to system; the idea is the same everywhere.

## Effectivity

Here is a puzzle. Revision C of a bracket is released today. But yesterday the factory finished fourteen spacecraft with revision B brackets, and three more are half-built. Are those fourteen now wrong?

No. They were built correctly to the revision that applied when they were built. What the company needs is a rule that says *which revision applies to which unit*. That rule is **effectivity**.

- **Serial effectivity** says "revision C applies from serial number 015 onward". Units 001 to 014 stay on B.
- **Date effectivity** says "revision C applies to every unit built on or after 1 March".
- Some companies also use **lot effectivity**, for parts made in batches.

Effectivity is how a [[fleet of vehicles|fleet-mix]] can legitimately be different from one another. Two satellites launched on the same day may carry different revisions of a bracket, and both can be exactly right.

::: key
**Revision versus version, and effectivity.** A version is any saved state during development; a revision is a released, controlled configuration. Effectivity states from which serial number or date a revision applies, which is how a fleet can legitimately contain several configurations at once.
:::

::: example Counting a mixed fleet
A constellation build of 24 satellites, serials 001 to 024, uses reaction-wheel bracket `40017`. Revision B is effective for serials 001–014. Revision C, which enlarges a lightening hole (a hole cut only to save weight), is effective from serial 015.

**Planned split.** Serials 001 to 014 are $14$ units on B. Serials 015 to 024 are $24 - 14 = 10$ units on C. Check: $14 + 10 = 24$.

**What really happened.** During assembly of serial 009, its B bracket was scratched and scrapped. The shelf only held C brackets, and C is the same part number because it is interchangeable, so a C bracket was fitted. That swap was recorded against serial 009.

**The real split.** B: $14 - 1 = 13$ units. C: $10 + 1 = 11$ units. Check: $13 + 11 = 24$.

**Sanity check.** The plan and the real vehicles now differ by exactly one unit. The difference is small, it is recorded, and it is legal. But if a GNC engineer computes the inertia tensor for serial 009 from the effectivity plan alone, she uses the B bracket's mass — slightly wrong. The record of what was really built is what saves her.
:::

## Changing a released design: ECR, board, ECO

A released revision cannot be edited. So how does anything ever change? Through a formal, recorded process.

1. **Engineering change request (ECR)** — anyone who sees a problem or an improvement writes one: what is wrong, why it matters, what might fix it. A technician whose wrench cannot reach a bolt can raise an ECR. An ECR is a *question*; it changes nothing by itself.
2. **The [[change board|ccb]]** — a group from design, analysis, manufacturing, quality and often GNC or software reviews the request. They ask: is it worth doing, what else does it affect, what does it cost, and is it a new revision or a new part number?
3. **Engineering change order (ECO)** — if the board approves, an ECO is issued. It is the *order*: it lists every part, drawing and assembly that changes, the new revisions, the effectivity, and the **disposition** of existing stock — use as is, rework, or scrap.
4. **Implementation** — designers make the changes as new versions, the new revisions go through review, and they are released under the ECO.

::: key
An ECR asks for a change; an ECO authorizes and describes it. A change board sits between them. The ECO number is recorded against every revision it created, so any change can be traced back to who asked, why, and who approved it.
:::

::: warning Never "just fix it" in the released file
If you find an error in a released model, do not open it and correct it quietly, even if the system lets you. Hardware may already be built to it, suppliers may be cutting metal from it, and nobody would know the definition changed. Raise an ECR. The paperwork is what makes the fix visible to everyone who needs to know.
:::

Sometimes the hardware, not the design, is what departs. A part may be built slightly off-drawing and still be judged safe to use. That decision is recorded against that serial number as a **[[deviation or waiver|deviation-waiver]]**. The drawing does not change; the as-built record does.

## As-designed, as-built, as-flown

Put the pieces together and you get three different descriptions of any one vehicle.

- **As-designed** — what the released drawings and models specify for that unit, given its effectivity.
- **As-built** — what the shop actually produced: the real revisions fitted, the swaps, and every approved deviation.
- **As-flown** — what was in the vehicle at the moment of flight, including any last-minute replacements at the pad.

::: key
**As-designed, as-built, as-flown.** What the drawing specified, what the shop actually produced including approved deviations, and what was in the vehicle at the moment of flight. An anomaly investigation needs all three, and they are routinely different.
:::

This matters to GNC directly. The mass properties in your 6-DOF simulation come from the CAD assembly (lesson 11) — the as-designed state. After an anomaly, the question becomes: what was really in the vehicle? Which IMU serial number, on which revision of its bracket, mounted with which alignment shims, running which flight software build? Serial 009 in the example above is exactly this story in miniature. Engineers call this chain of records **[[traceability|traceability]]**.

## What Teamcenter does that NX does not

Now the payoff. NX is the tool that *makes* geometry: sketches, features, assemblies, drawings, PMI. On its own, NX saves files. It does not know which file is released, who approved it, or which spacecraft it went into.

Teamcenter is the governance layer on top. It does the things this lesson has described:

- **A vault with check-in and check-out** — models live in one controlled store, and only one person edits a file at a time.
- **Revision control and lifecycle states** — it knows which versions are work in progress and which revision is released and frozen.
- **Workflow and approvals** — it routes a design to reviewers and records their sign-offs.
- **Bills of material** — the structure of every assembly, including the engineering BOM (how it is designed) and the manufacturing BOM (how the factory builds it).
- **Effectivity** — which revision applies to which serial number or date.
- **Change objects** — ECRs and ECOs, linked to every item they touch.
- **Where-used** — ask "which assemblies use bracket 40017?" and get the answer in seconds, which is the first question any change board asks.
- **Traceability across disciplines** — the same system can hold analysis results, requirements, software builds and build records, all linked to the right revisions.

::: key
**What Teamcenter does that NX does not.** Product data and lifecycle management: revision control, workflow and approvals, bills of material, effectivity, change orders and traceability across every discipline. NX creates geometry; Teamcenter governs which version of it is real.
:::

The same split exists elsewhere: CATIA sits on Dassault's ENOVIA, Creo on PTC's Windchill. The names change; the division of labor between an authoring tool and a governing one does not.

## Check yourself

::: check
A designer saves a bracket model 30 times while fixing a clash, then the fix is reviewed and released. How many versions and how many new revisions came out of that work? Who is allowed to build hardware from the result?
:::

::: answer
Thirty versions (one per save), and one new revision — the released one, say C. Manufacturing, suppliers and inspection may build only from the released revision C. The thirty versions are the designer's working history and are never built from.
:::

::: check
Your company numbers parts like `VLV-SS-012` (valve, stainless steel, 12 mm). The valve body changes to titanium with the same form, fit and function. Explain the dilemma, and why a non-significant number avoids it.
:::

::: answer
The change keeps the valve interchangeable, so by the rules it should keep its part number and only get a new revision. But the number now says "SS" while the part is titanium, so the number lies. The alternative, renumbering, would force a change to every assembly that uses it, for no engineering reason. A non-significant number like `4001783` carries no meaning, so the material lives only in the PLM record's attributes, which update with the new revision. Nothing lies and nothing needs renumbering.
:::

::: check
A revision D of a harness clamp is released with date effectivity of 1 June. Spacecraft A finished assembly in May; spacecraft B starts assembly on 3 June. Which revision should each carry, and is spacecraft A now nonconforming?
:::

::: answer
Spacecraft A should carry the previous revision, C (the one effective when it was built), and spacecraft B should carry revision D. A is not nonconforming: it was built correctly to the revision effective at the time. Effectivity is exactly what lets both configurations be legitimate at once. If the change board had decided A must be upgraded, the ECO would have said so explicitly, for example by setting a retrofit disposition.
:::

::: check
A technician finds that a connector cannot be reached with a torque wrench. Put these in order and say what each one is: ECO, change board review, ECR, release of the new revision.
:::

::: answer
First the **ECR**: the technician's request, describing the access problem and maybe a suggested fix. It changes nothing yet. Then **change board review**: engineering, manufacturing, quality and other affected groups decide whether and how to change it. If approved, the **ECO** is issued: the order listing what changes, the new revisions, the effectivity and what to do with existing parts. Last, the designers make the change and the new revision is **released** under that ECO.
:::

::: check
After an attitude anomaly, a GNC engineer is told "use the inertia tensor from the CAD model". Why is that not enough, and what records should she ask for?
:::

::: answer
The CAD model is the as-designed state, possibly at a later revision than the vehicle carried. She needs the as-built records for that serial number (which revisions were really fitted, swaps, deviations) and the as-flown record (anything replaced before launch, the propellant load), and ideally the measured mass properties. PLM traceability is what links that serial number to all three.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Part number | Unique name of an interchangeable design | Same number means interchangeable |
| Significant vs non-significant | Meaning built into the number, or a plain counter | Meaning goes stale and fields run out; many large firms prefer counters |
| Version | Any saved state during development | For the designer; never built from |
| Revision | Released, controlled configuration | A, B, C…; frozen once released |
| Effectivity | Which serial number or date a revision applies from | Lets a fleet legitimately hold several configurations |
| ECR | Request for a change | Anyone can raise one; changes nothing alone |
| Change board | Cross-discipline review | Decides whether, how, and revision or new number |
| ECO | Order authorizing the change | Lists affected items, new revisions, effectivity, disposition |
| As-designed, as-built, as-flown | Specified, produced, flown | Routinely different; an investigation needs all three |
| Teamcenter vs NX | Governance vs authoring | NX creates geometry; Teamcenter governs which version is real |

That completes the CAD tools module: you can read a drawing, trust a mass model for the right reasons, and speak the language of the mechanical team. Next come the interview-preparation modules, starting with **[[Algorithmic Fluency|next-module]]** — the coding problems, complexity talk and engineering variants a GNC software screen really asks for.

::: context plm-pdm PDM and PLM
You will hear two acronyms. **PDM**, product data management, is the narrower one: a secure vault for CAD files with check-in, check-out and revisions. **PLM**, product lifecycle management, is the wider one: it adds change processes, bills of material, manufacturing, requirements and service records across the product's whole life. Descriptions of SpaceX's setup often say Teamcenter handles "product data management"; Siemens sells Teamcenter as a full PLM system. In practice people use the two words loosely, and the idea behind both is the same: one controlled source of truth.
:::

::: context dash-number One base, several variants
A dash number is a short suffix that separates closely related variants of one design, often drawn on the same drawing: a left-hand and right-hand bracket, or a bolt family in several lengths. Each dash number is its own part number for the rules of interchangeability — `40017-01` and `40017-02` cannot be swapped for each other — but the shared base keeps the family together on one drawing and in searches. Configurations in a CAD file (lesson 8) often map one-to-one to dash numbers.
:::

::: context fff The interchangeability test
Form is the shape, size and mass of a part. Fit is how it connects to its neighbors: hole positions, threads, mating faces. Function is what it does: carry a load, pass a current, hold an angle. If a changed part matches the old one in all three, any unit can take either one and nobody can tell the difference in service, so the part number stays and the revision letter moves. Change any one of the three in a way that matters and it becomes a new part number, because old and new stock must never be mixed up on the shelf.
:::

::: context lifecycle-states From draft to frozen
Every revision walks the same path. The arrow back from review is the reviewer saying "not yet".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="8" y="40" width="72" height="32" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="44" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">In work</text>
  <rect x="100" y="40" width="72" height="32" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="136" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">In review</text>
  <rect x="192" y="40" width="72" height="32" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="228" y="61" font-size="12" text-anchor="middle" fill="#1f2a44">Released</text>
  <rect x="284" y="40" width="68" height="32" rx="6" fill="#fff" stroke="#6c7a93" stroke-width="2"/>
  <text x="318" y="61" font-size="12" text-anchor="middle" fill="#6c7a93">Obsolete</text>
  <line x1="80" y1="56" x2="96" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="100,56 92,52 92,60" fill="#1f2a44"/>
  <line x1="172" y1="56" x2="188" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="192,56 184,52 184,60" fill="#1f2a44"/>
  <line x1="264" y1="56" x2="280" y2="56" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="284,56 276,52 276,60" fill="#1f2a44"/>
  <path d="M136 40 Q90 10 44 36" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="44,40 40,31 49,33" fill="#b4232c"/>
  <text x="90" y="16" font-size="11" text-anchor="middle" fill="#b4232c">rejected</text>
  <text x="44" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">many versions</text>
  <text x="228" y="94" font-size="11" text-anchor="middle" fill="#1d6fd1">frozen: Rev C</text>
</svg>
```

Once released, the only way forward is a new revision, which starts again at "In work".
:::

::: context fleet-mix A fleet with two configurations
The 24 satellites of the example in this section, one square each. Light blue carries revision B, dark blue revision C. Serial 009, outlined in red, received a C bracket as a recorded swap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="100" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">Rev B effective: 001–014</text>
  <text x="276" y="36" font-size="12" text-anchor="middle" fill="#1d6fd1">Rev C effective: 015–024</text>
  <rect x="12" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="26" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="40" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="54" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="68" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="82" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="96" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="110" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="124" y="50" width="12" height="24" fill="#1d6fd1" stroke="#b4232c" stroke-width="3"/><rect x="138" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="152" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="166" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="180" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="194" y="50" width="12" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/><rect x="208" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="222" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="236" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="250" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="264" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="278" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="292" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="306" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="320" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/><rect x="334" y="50" width="12" height="24" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <text x="18" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">001</text>
  <text x="130" y="92" font-size="11" text-anchor="middle" fill="#b4232c">009</text>
  <text x="200" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">014</text>
  <text x="340" y="92" font-size="11" text-anchor="middle" fill="#1f2a44">024</text>
  <text x="180" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">as built: 13 on B, 11 on C</text>
</svg>
```
:::

::: context ccb Who sits on the board
It goes by several names: change board, change control board, configuration control board. Its members come from every group a change could hurt — design, stress, manufacturing, quality, procurement, and GNC or flight software when a change touches sensors, mass or alignment. On government programs, changes are often sorted into classes: a major class for anything that affects form, fit, function, cost or schedule enough that the customer must approve, and a minor class the contractor can approve itself. The board's real value is making the question "what else does this touch?" someone's job.
:::

::: context deviation-waiver Permission before, acceptance after
Two related words, used slightly differently from company to company. A **deviation** is usually permission granted *before* building to depart from the drawing for a stated number of units — "we are out of this alloy; build serials 5 to 8 from that one". A **waiver** is usually acceptance *after* the fact of a part already made off-drawing, after an engineer shows it is still fit to fly. Some organizations now call both a **variance**. Either way, the record is tied to specific serial numbers and becomes part of the as-built story.
:::

::: context traceability Following one thread back
Traceability means you can start from any piece of flight hardware and walk back through the records to how it came to be, or start from a requirement and walk forward to every unit that meets it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="6" y="36" width="76" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="44" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">Requirement</text>
  <rect x="96" y="36" width="76" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="134" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">Rev C, ECO</text>
  <rect x="186" y="36" width="76" height="36" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="224" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">Serial 009</text>
  <rect x="276" y="36" width="78" height="36" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="315" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">Flight</text>
  <line x1="82" y1="54" x2="92" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="96,54 89,50 89,58" fill="#1f2a44"/>
  <line x1="172" y1="54" x2="182" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="186,54 179,50 179,58" fill="#1f2a44"/>
  <line x1="262" y1="54" x2="272" y2="54" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="276,54 269,50 269,58" fill="#1f2a44"/>
  <text x="134" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">as-designed</text>
  <text x="224" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">as-built</text>
  <text x="315" y="92" font-size="11" text-anchor="middle" fill="#6c7a93">as-flown</text>
</svg>
```

A PLM system stores the links between the boxes; without them, each box is an island.
:::

::: context next-module Where the hours go now
The CAD modules were the cross-discipline literacy part of the course. The interview-preparation modules are where a GNC software candidate is really tested. Algorithmic Fluency begins with an honest calibration of what the screen asks — medium-level problems with real-world framing — then works through the high-yield patterns and the engineering variants such as decoding a binary telemetry stream or writing a ring buffer. You will find the traceability habit from this lesson useful there too: knowing exactly which version of your code produced which result.
:::
