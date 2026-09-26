---
id: l01-why-space-is-controlled
title: "Why launch vehicles and spacecraft are export-controlled"
minutes: 20
covers:
  - why launch vehicles and spacecraft are ITAR-controlled under the US Munitions List
---

A kitchen knife cuts bread. The same knife can hurt someone. Nothing about the steel changes between the two uses — only the intent. Some tools are like that. Engineers call them **[[dual-use|dual-use]]** — useful for peaceful work and for weapons at the same time.

A rocket is the biggest dual-use tool there is. A rocket that lifts a satellite to orbit and a missile that carries a warhead to a target solve the same problem. Both must steer a heavy body along a path it does not want to fly, with a limited tank of propellant, and arrive within a few meters of where they aimed. That problem is **guidance, navigation and control** — **GNC**, said "G-N-C" — and it is the job this whole course trains you for. The math of powered flight, the sensors that measure where the vehicle is, and the software that decides what to do next do not care what the payload is for.

That overlap is the reason United States law treats rocket and spacecraft technology as a controlled export. It is not about any one company, and not about any one engineer's character. This lesson explains why the control exists and exactly what it controls. Once you see that, three things later in the module make sense: why no employer can waive the rule, why it reaches an engineer who never touches a wrench, and why "I only write software" does not get you out of it.

Nothing here is legal advice, and nothing here replaces the regulation itself. The regulation, and the office that runs it, are the sources of record. What this lesson gives you is the vocabulary and the reasoning, in plain words, so that the export-control paragraph in every job posting reads as a real rule rather than fine print.

## A law, a rule book, and an office

Think of how a school works. The city passes a law saying students must be kept safe. The school writes a handbook that turns that law into specific rules. The principal's office applies the handbook and deals with anyone who breaks it. Export control has the same three layers.

**The law.** Congress passed the **Arms Export Control Act**, found at 22 U.S.C. § 2751 and the sections after it. "U.S.C." is the **United States Code** — the collection of laws Congress has passed. The "§" sign is read "section". This act gives the executive branch the power to control exports of defense-related items and services.

**The rule book.** Under that law sits the **International Traffic in Arms Regulations** — **ITAR**, said "eye-tar". It is found at [[22 CFR Parts 120 through 130|reading-citations]]. "CFR" is the **Code of Federal Regulations**, the collection of detailed rules that government agencies write to carry out the laws.

**The office.** ITAR is run by the **Directorate of Defense Trade Controls** — **DDTC**, said "D-D-T-C" — an office inside the [[U.S. Department of State|why-state]]. DDTC keeps the list of controlled items, grants licenses, and enforces the rules.

So when a SpaceX posting says a candidate must conform to "U.S. Government export regulations," this chain is what stands behind that sentence. A law passed by Congress. A regulation written under it. An office that runs the licensing system.

## The list: the United States Munitions List

A rule about "defense items" would be useless without saying which items. ITAR says exactly, in one place: the **United States Munitions List** — the **USML**, said "U-S-M-L" — at 22 CFR § 121.1. A **munition** is military equipment of any kind.

The USML is split into numbered categories, from Category I to Category XXI — twenty-one in total. They cover firearms, ammunition, launch vehicles, military electronics, spacecraft and more. Two of them matter directly to a GNC engineer.

### Category IV: launch vehicles

**Category IV** covers launch vehicles, guided missiles, ballistic missiles, rockets, and related items. It does not say "anything that flies to space." It is written precisely. Its headline line for an uncrewed launch vehicle is a performance threshold: the ability to deliver a payload of at least 500 kilograms to a range of at least 300 kilometers.

That number is not arbitrary. It is the same threshold used by the **[[Missile Technology Control Regime|mtcr]]** — **MTCR**, said "M-T-C-R" — an agreement among many countries to limit the spread of missile technology. The logic is direct. A vehicle that can throw 500 kg as far as 300 km could, with a different payload bolted on top, serve as the body of a usable ballistic missile. The threshold measures what the vehicle *can* do, not what it is carrying today.

A Falcon 9 clears this threshold by a wide margin — it lifts tens of tonnes to orbit. A hobby model rocket does not come close. Every orbital launch vehicle, from any company, sits inside Category IV.

### Category XV: spacecraft

**Category XV** covers spacecraft and their equipment — satellites, the main structure and systems of a satellite (called the **bus**), and related hardware. Inside it are finer splits, for example for spacecraft with defense uses or for certain remote-sensing satellites.

Not every piece of space hardware lives here. Over the last decade and a half, the government moved a large amount of ordinary commercial satellite hardware off the USML, in a policy effort known as [[Export Control Reform|export-control-reform]]. Those items went to the **Department of Commerce** instead. There they are governed by a different rule book, the **Export Administration Regulations** — the **EAR**, said like the body part "ear". The EAR has its own list, the **Commerce Control List** (**CCL**). Each item on it has a code called an **Export Control Classification Number**, or **ECCN**, said "E-C-C-N". Many spacecraft items carry an ECCN in the **9A515** family.

Two cautions. First, "moved to Commerce" does not mean "uncontrolled." The EAR is a real regime with real restrictions. Its rules about which *people* may see the technology are generally less strict than ITAR's, but they exist. Second, whether a given item sits on the USML, on the CCL, or on neither is decided by trained export-control staff and, in the end, by the government — not by a job applicant reading a summary.

For your purposes, the practical point is simple to state. Launch vehicles with orbital performance sit inside Category IV, with no ambiguity. A great deal of spacecraft hardware sits inside Category XV. If a role touches a launch vehicle at all, ITAR is not a maybe.

::: key
The Arms Export Control Act authorizes ITAR (22 CFR Parts 120–130); DDTC, part of the State Department, administers it; the United States Munitions List (22 CFR § 121.1) names the controlled items. Category IV covers launch vehicles and related articles; Category XV covers spacecraft.
:::

::: key
Category IV's threshold for an uncrewed launch vehicle — able to deliver at least 500 kg to at least 300 km — is the same figure used by the Missile Technology Control Regime, because a launch vehicle that meets it is airframe-equivalent to a usable ballistic missile. That is the actual reason, not a guess at policy motive.
:::

## Technical data: the part people underestimate

Picture a secret family recipe. Guarding the cake is not enough. If someone reads the recipe card, they can bake the cake themselves. So a careful family guards the card too.

ITAR works the same way. If it only controlled the physical rocket — the metal, the engines, the electronics boxes you could crate and ship — it would be a narrow rule. But it also controls the recipe card. The regulation's name for the recipe card is **technical data**.

ITAR defines technical data at 22 CFR § 120.33. In plain words, it is information needed to design, develop, produce, manufacture, assemble, operate, repair, test, maintain, or modify a defense item. The definition says outright that this includes blueprints, drawings, photographs, plans, instructions, and documentation.

It also names two things that are *not* technical data:

- general scientific, mathematical, and engineering principles commonly taught in schools, colleges, and universities;
- information already in the **[[public domain|public-domain]]** — published and freely available to anyone.

### Now hold a GNC job next to that definition

Read the list of activities again: design, development, testing, modification. Now think about what a GNC engineer makes in a normal week.

- A control law derived for one specific vehicle's climb to orbit is technical data.
- The simulation code that models that vehicle's motion is technical data.
- A memo explaining why a navigation filter was retuned after a flight problem is technical data.
- A report on a [[Monte Carlo|monte-carlo]] campaign — thousands of simulated flights with small random errors — is technical data.

None of that is hardware. You cannot drop any of it on your foot. All of it fits the definition the moment it is tied to a real Category IV or Category XV vehicle, rather than to the general theory in a controls textbook.

This is the most important idea in the lesson. GNC work does not produce hardware. Its main output *is* technical data — derivations, code, analysis, documents — and technical data is exactly what the regulation is built around. An engineer who works entirely in simulation, and never sets foot on a factory floor, is not exempt because nothing physical crosses a border. The information itself is the controlled thing.

::: key
"Technical data" (22 CFR § 120.33) is information required for the design, development, production, testing, or modification of a defense article — including plans, instructions, and documentation, not only physical hardware. General principles taught in schools and information already in the public domain are excluded.
:::

::: warning "I only write software" is not an exemption
It is tempting to think export control is about boxes crossing a border, so a job made only of algorithms, simulation, or analysis must sit outside it. The definition of technical data does not care about the medium. A derivation on a whiteboard, a Git commit, and a PDF report are all covered once they concern the design or operation of a controlled vehicle. What matters is the content and the vehicle it describes — not whether you ever touched a part.
:::

::: example A GNC engineer's ordinary week, checked against the definition
A guidance engineer on a launch vehicle program produces four things this week:

1. a memo deriving a revised powered-descent guidance law — the steering rule for a landing burn;
2. a commit to the [[6-DOF simulation|six-dof]] that models the vehicle's aerodynamics;
3. a slide deck showing Monte Carlo landing-dispersion results — how widely the simulated landings scatter — to a review board;
4. a short design note explaining a change to how the navigation filter combines its sensors.

Check each one against 22 CFR § 120.33, asking "is this information needed to design, develop, test, or modify the vehicle?"

1. The derivation memo: yes — it is needed to design the guidance function. Technical data.
2. The simulation commit: yes — it is needed to test how the vehicle behaves. Technical data.
3. The dispersion results: yes — they document performance used in design and testing. Technical data.
4. The design note: yes — it describes a modification to the navigation function. Technical data.

Sanity check: is any of the four hardware, a drawing of a physical part, or a photograph? No. All four meet the definition anyway, because the definition asks what the information is *for*, not what form it takes. This is the ordinary output of the job, not an unusual case.
:::

::: example Category IV versus a component that moved to Commerce
**Company one** builds a complete orbital launch vehicle — say a Falcon 9-class rocket that can lift far more than 500 kg to far more than 300 km. Step one: does it meet the Category IV threshold? Yes, by a wide margin. Step two: so every technical detail of its guidance, propulsion, and structure sits inside USML Category IV. There is no threshold question left to ask.

**Company two** (hypothetical) builds a single part for a civil communications satellite: a mechanism that unfolds the solar panels. It has no defense sensing, no maneuvering ability, and no use beyond civil communications. Depending on its exact characteristics, it may fall outside Category XV. It would then be classified on the Commerce Control List — commonly with an ECCN in the 9A515 family — and governed by the EAR instead of ITAR. The EAR still restricts it. Its rules about people are generally lighter.

What the comparison shows is the *shape* of the boundary, not a rule you can apply yourself. Deciding whether a specific item is on the USML, the CCL, or neither is a formal classification made by trained export-control staff and, finally, by DDTC or the Commerce Department. For a GNC role on an orbital launch vehicle, though, you do not need that classification step at all: Category IV already answers the question.
:::

## What this lesson is not

This lesson explains the mechanism behind the paragraph you will read in postings. It does not replace the regulation, and it is not legal advice. The USML is amended from time to time: categories get rewritten and section numbers move. Classifying a specific item takes detailed facts and trained staff, not self-diagnosis from a study app.

When exact wording matters — and in export control it usually does — read it yourself. The current text of 22 CFR Parts 120 and 121 is in the electronic Code of Federal Regulations, the authoritative online version. DDTC also publishes its own public guidance. Both are listed in this module's resources.

## Check yourself

::: check
A friend argues that export control only applies to physical hardware, since "export" naturally means shipping something across a border. Using the definition of technical data, explain what is wrong with that argument.
:::

::: answer
Technical data (22 CFR § 120.33) is information required for the design, development, production, testing, maintenance, or modification of a defense article. The definition says outright that it includes non-physical forms: plans, instructions, and documentation. So the regulation controls the knowledge needed to build or operate a controlled item, not only the item itself. A derivation, a piece of source code, or a report can be controlled with nothing physical ever moving anywhere.
:::

::: check
Why is the 500 kg / 300 km threshold in USML Category IV specifically that number, rather than some other round figure?
:::

::: answer
It matches the Missile Technology Control Regime's performance threshold for controlled missile systems. A launch vehicle that can deliver at least 500 kg to at least 300 km could, by swapping the payload, serve as the airframe of a usable ballistic missile. The threshold measures what the airframe is capable of, not what it happens to carry. That is why a civilian orbital launch vehicle and a weapon can share a control category.
:::

::: check
A GNC engineer spends an entire career writing simulation code and never once visits a factory floor or handles flight hardware. Does that career sit outside ITAR's reach? Explain using the technical data definition rather than an intuition about what "export" means.
:::

::: answer
No. The engineer's output — simulation code that models a controlled vehicle's motion, analysis reports, design memos — meets the definition of technical data whenever it is needed for the design, testing, or modification of a Category IV or Category XV article. Technical data is defined by what the information is for, not by whether the person also handles hardware. If anything, a pure-software GNC career on a launch vehicle program is *especially* inside this framework, because producing technical data is close to the whole job.
:::

::: check
Name the two USML categories most directly relevant to a GNC role, and state in one sentence what each covers.
:::

::: answer
Category IV covers launch vehicles, guided missiles, ballistic missiles, rockets, and closely related articles. Category XV covers spacecraft and their associated equipment. A launch-vehicle GNC role sits under Category IV. A satellite attitude-control or navigation role sits under Category XV — though some spacecraft hardware not described in Category XV falls under the Commerce Department's rules instead.
:::

::: check
Is all commercial space hardware ITAR-controlled? Give an accurate answer, including the qualification that makes it accurate.
:::

::: answer
No. Export Control Reform moved a substantial amount of commercial satellite and component hardware without sensitive capability from the USML to the Commerce Department's Export Administration Regulations. Those items are typically classified on the Commerce Control List — for example, ECCN 9A515 for many spacecraft-related items. That is a different, generally less restrictive regime; it does not mean unrestricted. Launch vehicles themselves, and higher-capability or defense-related spacecraft, stay on the USML. Whether a specific item is on the USML or the CCL is a classification decided by export-control specialists and the relevant agency — not a blanket rule you can apply from general knowledge.
:::

## Summary

| Term | Citation | What it means |
| --- | --- | --- |
| Arms Export Control Act | 22 U.S.C. § 2751 et seq. | The law that authorizes control of defense exports |
| ITAR ("eye-tar") | 22 CFR Parts 120–130 | The regulation written under that law |
| DDTC | — | State Department office that administers ITAR |
| United States Munitions List | 22 CFR § 121.1 | Lists controlled defense articles in 21 categories |
| USML Category IV | 22 CFR § 121.1 | Launch vehicles, guided missiles, rockets; ≥500 kg to ≥300 km for uncrewed launch vehicles (the MTCR figure) |
| USML Category XV | 22 CFR § 121.1 | Spacecraft and associated equipment |
| Technical data | 22 CFR § 120.33 | Information required for design, development, production, testing, or modification of a defense article; excludes general school-taught principles and public-domain information |
| EAR / CCL / ECCN 9A515 | — | Commerce Department's separate, generally less restrictive regime for many non-USML space items |

The next lesson turns from *what* is controlled to *who* may see it: the four statuses SpaceX and similar employers name in every posting, and the legal definitions behind them.

::: context dual-use One tool, two uses
"Dual-use" is the official term for goods and technology with both civilian and military uses. Rockets are the textbook case. The first large liquid-fuel rocket to reach space, Germany's V-2 in the 1940s, was a weapon. Early US and Soviet space launchers grew out of missile programs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="55" width="120" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">same rocket</text>
  <text x="80" y="87" font-size="11" text-anchor="middle" fill="#1f2a44">same GNC math</text>
  <line x1="140" y1="75" x2="200" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="75" x2="200" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="15" width="145" height="40" rx="6" fill="#fff" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="272" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">satellite to orbit</text>
  <rect x="200" y="95" width="145" height="40" rx="6" fill="#fff" stroke="#b4232c" stroke-width="1.5"/>
  <text x="272" y="120" font-size="12" text-anchor="middle" fill="#b4232c">warhead to a target</text>
</svg>
```

The difference sits in the payload and the intent, not in the steering problem. That is exactly why export law watches the steering.
:::

::: context reading-citations How to read a legal address
A citation is an address, like a street address for a rule. Read "22 CFR § 121.1" as "title twenty-two, part one-twenty-one, section one of the Code of Federal Regulations." The title is a broad subject area — Title 22 is Foreign Relations. The part is a chapter-sized chunk. The section is the specific rule.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="60" y="40" font-size="22" text-anchor="middle" fill="#1d6fd1">22</text>
  <text x="130" y="40" font-size="22" text-anchor="middle" fill="#1f2a44">CFR</text>
  <text x="205" y="40" font-size="22" text-anchor="middle" fill="#6c7a93">§</text>
  <text x="270" y="40" font-size="22" text-anchor="middle" fill="#b4232c">121.1</text>
  <text x="60" y="75" font-size="11" text-anchor="middle" fill="#1d6fd1">title</text>
  <text x="60" y="90" font-size="11" text-anchor="middle" fill="#1d6fd1">(foreign relations)</text>
  <text x="130" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">which code</text>
  <text x="205" y="75" font-size="11" text-anchor="middle" fill="#6c7a93">"section"</text>
  <text x="270" y="75" font-size="11" text-anchor="middle" fill="#b4232c">part 121,</text>
  <text x="270" y="90" font-size="11" text-anchor="middle" fill="#b4232c">section 1</text>
</svg>
```

"22 U.S.C. § 2751" works the same way, but points into the United States Code — the laws themselves — instead of the regulations.
:::

::: context why-state Why the State Department, not the Pentagon
You might expect weapons rules to be run by the Department of Defense. But ITAR is about what leaves the country and who abroad may receive it — which is a question of foreign policy. Foreign policy is the State Department's job. The Department of Defense still gives advice on many licensing decisions, and the Commerce Department runs the separate, lighter EAR system for items that are not on the USML.
:::

::: context mtcr A club of countries that agree not to spread missiles
The Missile Technology Control Regime was started in 1987 by seven large industrial countries and has since grown to about thirty-five members. It is not a treaty with penalties. It is a shared set of guidelines that each member writes into its own export laws.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="20" width="120" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="20" width="120" height="70" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="90" width="120" height="70" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="230" y="90" width="120" height="70" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="52" font-size="12" text-anchor="middle" fill="#fff">Category I</text>
  <text x="290" y="68" font-size="11" text-anchor="middle" fill="#fff">strictest</text>
  <text x="290" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">Category II</text>
  <text x="290" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">still controlled</text>
  <text x="170" y="58" font-size="11" text-anchor="middle" fill="#1f2a44">short range</text>
  <text x="170" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">short range</text>
  <text x="100" y="58" font-size="11" text-anchor="end" fill="#1f2a44">≥ 500 kg</text>
  <text x="100" y="128" font-size="11" text-anchor="end" fill="#1f2a44">&lt; 500 kg</text>
  <text x="170" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">&lt; 300 km</text>
  <text x="290" y="178" font-size="11" text-anchor="middle" fill="#1f2a44">≥ 300 km</text>
</svg>
```

Complete rockets that reach both 500 kg and 300 km are its strictest category. Rockets that reach 300 km with a smaller payload are still controlled, one step down.
:::

::: context export-control-reform Moving satellites to a lighter list
For years every satellite part, down to ordinary commercial ones, sat on the USML. US satellite makers argued this pushed foreign customers to buy from other countries. After Congress gave the President authority to move satellite items in 2013, the government shifted many of them to the Commerce Department's list, with the change taking effect in late 2014. Launch vehicles did not move: they stayed in USML Category IV.
:::

::: context public-domain Why this course is allowed to exist
"Public domain" here means information published and available to anyone — in libraries, open journals, textbooks, public websites. Newton's laws, the rocket equation, Kalman filters and orbital mechanics are taught at universities worldwide, so they are not technical data. That is why a course like this can teach them to anyone, anywhere. What turns general knowledge into technical data is applying it to the design of a specific controlled vehicle.
:::

::: context monte-carlo Named after a casino
A Monte Carlo analysis runs a simulation thousands of times, each time nudging the inputs by small random amounts — a slightly stronger wind, a slightly weaker engine, a sensor that reads a little high. The spread of the results shows how the real vehicle might behave. The name comes from the famous casino in Monaco, because the method runs on random chance, like a roulette wheel.
:::

::: context six-dof Six ways to move
"DOF" means **degrees of freedom** — the independent ways a body can move. A rigid vehicle has six: it can slide forward-back, left-right and up-down (three), and it can turn in pitch, yaw and roll (three). A 6-DOF simulation tracks all six at once, which is what a real guidance system has to control. You will build one later in the course.
:::
