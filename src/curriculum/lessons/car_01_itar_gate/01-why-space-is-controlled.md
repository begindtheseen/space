---
id: l01-why-space-is-controlled
title: "Why launch vehicles and spacecraft are export-controlled"
minutes: 17
covers:
  - why launch vehicles and spacecraft are ITAR-controlled under the US Munitions List
---

A rocket that lifts a satellite to orbit and a rocket that delivers a warhead to a target solve the same guidance, navigation and control problem: get a body of known mass from one point to another through a trajectory it does not naturally want to fly, using a limited amount of propellant, with an error budget measured in metres. The airframe looks different, the payload is different, and the intent is entirely different — but the mathematics of powered flight, the sensors that measure where the vehicle is, and the software that decides what to do about it do not care about intent. That overlap, not any particular company's business or any individual engineer's character, is the reason launch vehicle technology is treated as a controlled export under United States law. Before this module goes anywhere near who is eligible for a GNC role, it is worth thirty minutes understanding why the control exists at all, because the shape of the answer explains everything downstream: why the restriction cannot be waived by an employer, why it reaches an engineer who never touches a wrench, and why "I only write software" is not an escape from it.

This lesson stays narrowly on that question: what makes a launch vehicle or a spacecraft a controlled item, and what exactly is being controlled. Nothing here is legal advice, and nothing here should be read as a complete restatement of the regulation — the regulation itself, and the agency that administers it, are the sources of record, and this lesson tells you exactly where to find them. What it gives you is the vocabulary and the reasoning, in plain language, so that the rest of the module — and the export-control paragraph you will read in every posting from here on — makes sense on first reading instead of looking like boilerplate.

## The statute, the regulation, and the agency

Congress gave the executive branch authority to control exports of defense-related articles and services in the Arms Export Control Act (22 U.S.C. § 2751 et seq.). The implementing regulation is the International Traffic in Arms Regulations — ITAR — found at 22 CFR Parts 120 through 130. ITAR is administered by the Directorate of Defense Trade Controls (DDTC), an office inside the U.S. Department of State, which licenses exports, maintains the list of controlled items, and enforces the rules. When a SpaceX posting says a candidate must conform to "U.S. Government export regulations," this is the chain of authority behind that sentence: a law passed by Congress, a regulation written under it, and an agency that runs the licensing system.

The list of what counts as a controlled defense article lives in a single place: the United States Munitions List (USML), at 22 CFR § 121.1. It is organized into numbered categories — firearms, ammunition, launch vehicles, military electronics, spacecraft, and so on, twenty-one categories in total. Two of them matter directly to this module.

**Category IV** covers launch vehicles, guided missiles, ballistic missiles, rockets, and related articles. Its scope is not "anything that flies to space" — it is defined with real precision, and the headline threshold for an uncrewed launch vehicle is the ability to deliver a payload of at least 500 kilograms to a range of at least 300 kilometers. That number is not arbitrary: it is the same performance threshold used by the Missile Technology Control Regime (MTCR), the multinational arrangement that restricts missile-relevant technology, and it was chosen because a launch vehicle that clears it is, by simple substitution of payload, also a usable ballistic missile airframe. A Falcon 9 clears that threshold by a wide margin. A model rocket does not.

**Category XV** covers spacecraft and their associated equipment — satellites, spacecraft buses, and related hardware — with its own internal distinctions for defense-related, protected, or remote-sensing spacecraft. Not every spacecraft-related item sits here: over the past decade, a substantial amount of commercial satellite hardware that does not carry sensitive capability was moved to the Commerce Department's jurisdiction under the Export Administration Regulations (EAR), governed by a different list (the Commerce Control List) and a different, generally less restrictive, set of person-based rules. A component not described in Category XV is not automatically uncontrolled — it typically falls to a specific classification on the Commerce list instead, commonly cited as ECCN 9A515 for spacecraft-related items. The practical point for you is this: launch vehicles capable of the kind of performance SpaceX, and every other orbital launch provider, actually builds are squarely inside Category IV, without exception or ambiguity, and a great deal of spacecraft hardware sits inside Category XV as well. If your target role touches a launch vehicle in any way, ITAR is not a maybe.

## Technical data: the part that is easy to underestimate

Controlling a launch vehicle would be a fairly narrow rule if it only controlled the vehicle itself — the metal, the engines, the avionics boxes that could be crated and shipped. It reaches much further than that, because the regulation controls the knowledge as well as the hardware, under a defined term: **technical data**.

ITAR defines technical data, at 22 CFR § 120.33, as information required for the design, development, production, manufacture, assembly, operation, repair, testing, maintenance, or modification of a defense article. It explicitly includes information in the form of blueprints, drawings, photographs, plans, instructions, or documentation. It excludes information concerning general scientific, mathematical, or engineering principles commonly taught in schools, colleges, and universities, and it excludes information already in the public domain.

Read that list of covered activities again with a GNC job description next to it: design, development, testing, modification. A control law you derive for a specific vehicle's ascent phase is technical data. The simulation source code that models that vehicle's dynamics is technical data. A memo explaining why a filter's tuning was changed after a flight anomaly is technical data. A report on a Monte Carlo dispersion campaign is technical data. None of that is hardware. None of it can be dropped on a foot. All of it is squarely inside the definition, the moment it is tied to an actual Category IV or Category XV vehicle rather than to the general theory taught in a controls textbook.

This is the single most important idea in this lesson, and it is why the eligibility gate reaches a GNC engineer with the same force it reaches a technician torque-wrenching a valve: GNC work does not produce hardware. It produces technical data as its primary output — derivations, code, analysis, documentation — and that output is exactly what the regulation is built around. An engineer who works entirely in a simulation environment, who never sets foot on a factory floor, is not exempt because nothing physical crosses a border. The information itself is the controlled thing.

::: key
The Arms Export Control Act authorizes ITAR (22 CFR Parts 120–130); DDTC, part of the State Department, administers it; the United States Munitions List (22 CFR § 121.1) names the controlled items. Category IV covers launch vehicles and related articles; Category XV covers spacecraft.
:::

::: key
"Technical data" (22 CFR § 120.33) is information required for the design, development, production, testing, or modification of a defense article — including plans, instructions, and documentation, not only physical hardware. General principles taught in schools and information already in the public domain are excluded.
:::

::: key
Category IV's threshold for an uncrewed launch vehicle — able to deliver at least 500 kg to at least 300 km — is the same figure used by the Missile Technology Control Regime, because a launch vehicle that meets it is airframe-equivalent to a usable ballistic missile. That is the actual reason, not a guess at policy motive.
:::

::: warning "I only write software" is not an exemption
The temptation is to reason that export control is about hardware crossing a border, and that a role confined to algorithms, simulation, or analysis software must sit outside it. The definition of technical data does not distinguish by medium — a derivation on a whiteboard, a Git commit, and a PDF report are all covered once they concern the design or operation of a controlled vehicle. What matters is the content and the vehicle it describes, not whether you personally ever touched a part.
:::

::: example A GNC engineer's ordinary week, checked against the definition
Consider a guidance engineer on a launch vehicle program whose week produces four things: a derivation memo revising the powered-descent guidance law, a commit to the 6-DOF simulation that models the vehicle's aerodynamics, a slide deck presenting Monte Carlo landing-dispersion results to a review board, and a short design note explaining a sensor-fusion change to the navigation filter.

Checked one at a time against 22 CFR § 120.33: the derivation memo is technical data — it is required for the design of the guidance function. The simulation commit is technical data — it is required for testing the vehicle's behavior. The dispersion results are technical data — they document performance relevant to the vehicle's design and testing. The design note is technical data — it concerns modification of the navigation function. None of the four is hardware, a drawing of a physical part, or a photograph. All four meet the definition anyway, because the definition is about what the information is used for, not what form it takes. This is the ordinary output of the job, not an edge case.
:::

::: example Category IV versus a component that migrated to Commerce jurisdiction
A company builds a complete orbital-class launch vehicle capable of lifting more than 500 kg to more than 300 km — for instance, a Falcon 9-class rocket. Every technical detail of its guidance, propulsion, and structure sits inside USML Category IV without ambiguity; there is no threshold question to ask.

A different, hypothetical company builds a single component for a commercial communications satellite — a solar array deployment mechanism with no defense-related sensing or maneuvering capability, and no application beyond civil communications. Depending on its specific characteristics, that component may fall outside Category XV and instead be classified under the Commerce Control List, commonly as an ECCN in the 9A515 family, governed by the EAR rather than ITAR. The EAR is a materially different regime with its own restrictions — it is not "no restriction" — but its person-based rules are generally less restrictive than ITAR's.

The comparison illustrates the shape of the boundary, not a rule you can apply yourself: whether a specific item sits on the USML, the CCL, or neither is a jurisdiction-and-classification determination made by trained export-control staff and ultimately by DDTC or the Commerce Department, not something a job applicant or even most engineers determine informally. If your role touches a full launch vehicle, as almost every GNC role at an orbital launch company does, the classification question above does not need asking — Category IV already answers it.
:::

## What this lesson is not

This lesson explains the mechanism behind the paragraph you will read in a posting; it is not a substitute for the regulation, and it is not legal advice. The USML is amended periodically, categories are renumbered and rewritten, and the exact classification of a specific item is a fact-intensive determination that trained compliance staff make, not something to self-diagnose from a study app. Where the exact wording matters — and in export control, it usually does — read it yourself at the current 22 CFR Part 120 and Part 121 text (the electronic Code of Federal Regulations is the authoritative version) or at DDTC's own public guidance, both listed in this module's resources.

## Check yourself

::: check
A friend argues that export control only applies to physical hardware, since "export" naturally means shipping something across a border. Using the definition of technical data, explain what is wrong with that argument.
:::

::: answer
Technical data (22 CFR § 120.33) is information required for the design, development, production, testing, maintenance, or modification of a defense article, and it explicitly includes non-physical forms such as plans, instructions, and documentation. The regulation controls the knowledge needed to build or operate a controlled item, not only the item itself, so a derivation, a piece of source code, or a report can be controlled with nothing physical ever moving anywhere.
:::

::: check
Why is the 500 kg / 300 km threshold in USML Category IV specifically that number, rather than some other round figure?
:::

::: answer
It matches the Missile Technology Control Regime's performance threshold for controlled missile systems. A launch vehicle that can deliver at least 500 kg to at least 300 km has, by simple substitution of payload, the performance of a usable ballistic missile airframe. The threshold reflects the airframe's capability, not the payload actually carried, which is why a civilian orbital launch vehicle and a weapon can share a control category.
:::

::: check
A GNC engineer spends an entire career writing simulation code and never once visits a factory floor or handles flight hardware. Does that career sit outside ITAR's reach? Explain using the technical data definition rather than an intuition about what "export" means.
:::

::: answer
No. The engineer's output — simulation source code that models a controlled vehicle's dynamics, analysis reports, design memos — meets the definition of technical data whenever it is required for the design, testing, or modification of a Category IV or Category XV article. Technical data is defined by what the information does, not by whether the person handling it also handles hardware. A pure-software GNC career on a launch vehicle program is, if anything, especially exposed to this framework, because generating technical data is close to the entire job.
:::

::: check
Name the two USML categories most directly relevant to a GNC role, and state in one sentence what each covers.
:::

::: answer
Category IV covers launch vehicles, guided missiles, ballistic missiles, rockets, and closely related articles. Category XV covers spacecraft and their associated equipment. A launch-vehicle GNC role sits under Category IV; a satellite ADCS or navigation role sits under Category XV, with some spacecraft-related hardware instead falling under Commerce Department jurisdiction if it is not described in Category XV.
:::

::: check
Is all commercial space hardware ITAR-controlled? Give an accurate answer, including the qualification that makes it accurate.
:::

::: answer
No. Export Control Reform in the early 2010s moved a substantial amount of commercial satellite and component hardware that lacks sensitive capability from the USML to the Commerce Department's Export Administration Regulations, typically classified under the Commerce Control List (for example, ECCN 9A515 for many spacecraft-related items). That items falls under a different, generally less restrictive regime — it does not mean unrestricted. Launch vehicles themselves, and higher-capability or defense-related spacecraft, remain on the USML. Whether a specific item is on the USML or the CCL is a classification question decided by export-control specialists and the relevant agency, not a blanket rule a learner can apply from general knowledge.
:::

## Summary

| Term | Citation | What it means |
| --- | --- | --- |
| Arms Export Control Act | 22 U.S.C. § 2751 et seq. | Statutory authority for controlling defense exports |
| ITAR | 22 CFR Parts 120–130 | The implementing regulation |
| DDTC | — | State Department office that administers ITAR |
| United States Munitions List | 22 CFR § 121.1 | Enumerates controlled defense articles by category |
| USML Category IV | 22 CFR § 121.1 | Launch vehicles, guided missiles, rockets; ≥500 kg to ≥300 km for uncrewed launch vehicles |
| USML Category XV | 22 CFR § 121.1 | Spacecraft and associated equipment |
| Technical data | 22 CFR § 120.33 | Information required for design, development, production, testing, or modification of a defense article |
| EAR / CCL / ECCN 9A515 | — | Commerce Department's separate, generally less restrictive regime for many non-USML space items |

The next lesson turns from what is controlled to who is allowed to access it: the exact four statuses SpaceX and comparable employers name in every posting, and the statutory definitions behind them.
