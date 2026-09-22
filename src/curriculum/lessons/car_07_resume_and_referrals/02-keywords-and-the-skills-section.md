---
id: l02-keywords-and-the-skills-section
title: "Encoding the basic qualifications: keywords and the skills section"
minutes: 18
covers:
  - "encoding the basic qualifications so a keyword scan finds them: control systems, orbital mechanics, classical dynamics, aerodynamics, sensors and actuators, modeling and simulation, C++ and Python"
  - skills sections without proficiency bar graphics
---

A posting's basic qualifications are not atmosphere. They are a short, named list, usually seven or so items long, and a first-pass reader checks your resume against that exact list rather than forming a general impression of your promise. Lesson one established that this checklist pass happens fast and happens first. This lesson is about what has to be true of the page for that pass to succeed: the words the posting uses have to actually appear, attached to real evidence, in places a fast reader will look.

A recurring list of basic qualifications for a GNC posting reads something like this: control systems, orbital mechanics, classical dynamics, aerodynamics, sensors and actuators, modeling and simulation, and the languages C++ and Python. You likely have real, relevant work behind several of these already, from this curriculum or from projects of your own. The problem this lesson solves is narrower than "do you have the skill" — it is "does the word for that skill, attached to something checkable, actually sit on the page." A reader cannot credit knowledge she cannot see named.

## What "encoding" means

Encoding a qualification means using the field's own vocabulary — the same words the posting uses — attached to a specific, verifiable piece of your work, rather than a paraphrase you personally prefer or a general description that requires the reader to infer the connection. If you built a rigid-body attitude simulation and tuned a feedback law to stabilize it, that is control systems work, and it should be describable using that phrase somewhere on the page, not left implicit in a description of what the code does in domain-neutral language. The reader is not being asked to infer that your simulation involved control theory; she is scanning for the words "control systems," and if they never appear near anything you actually built, the connection has to happen in her head instead of on the page — which is exactly the extra step a fast first pass does not have time for.

This matters for all seven items, and they differ in how readily they show up in typical self-directed work. Orbital mechanics, classical dynamics, and modeling and simulation tend to appear naturally in a simulation-heavy portfolio project. Control systems and sensors and actuators show up when a project includes an estimator, a controller, or real hardware. Aerodynamics shows up specifically when atmospheric flight — ascent, entry, or an atmosphere model — is part of what you built. C++ and Python are not domains at all; they are the two languages the posting names directly, and they are encoded by being stated plainly and truthfully, ideally with evidence of which one did the heavy lifting in which project.

::: key
Encoding a basic qualification means the posting's own word for it appears on the page, attached to something specific you actually did — not implied by a description that requires the reader to make the connection herself.
:::

## Two places encoding happens

A single mention of a keyword does less work than two reinforcing mentions in different parts of the page, and the two places that matter most are the skills section and the project bullets. They do different jobs. A skills section is a claim: it tells a reader, in the most scannable form on the page, which named areas you consider yourself to have worked in. A project bullet is evidence: it shows a specific instance of that area, described with enough detail that a reader believes the claim rather than merely registers it.

A skills section with no supporting bullet anywhere on the page is an unverified list — plausible, but nothing a reader can weigh against another candidate's version of the same list. A set of strong bullets that never uses the posting's actual vocabulary risks the opposite failure: the evidence is real, but a reader scanning specifically for "control systems" or "orbital mechanics" may not reliably connect a well-written but domain-neutral sentence back to the term she is checking for, especially on a fast first pass. The strongest resumes for this reader do both for every basic qualification that has real evidence behind it: the skills line names it, and at least one bullet, elsewhere on the page, proves it with a concrete result.

## The skills section: categorized lists, not proficiency bars

A skills section works best as a small number of plain categories, each followed by a short, comma-separated list — something like "Languages," "Domains," and "Tools" — rather than as a single undifferentiated wall of words or, worse, a set of proficiency-bar graphics showing filled and unfilled dots or a percentage next to each skill.

The bar graphic fails for a reason that has nothing to do with formatting and everything to do with what it claims. A row of four filled dots out of five next to "Python" is a number with no defined scale attached to it — filled by whom, measured how, against what standard. A reader cannot weigh it the way she can weigh a bullet stating a measured result, because there is nothing behind the dots to check. It also invites the single hardest kind of interview question to answer well: what makes this a four and not a five. A categorized text list makes no such claim at all — it says you have worked with something, and leaves the proving to the bullets, which is exactly where the proving belongs.

There is a second, more mechanical reason to avoid the bar graphic, covered in full in the lesson on applicant tracking systems later in this module: a graphic is not text, and anything conveyed only through an image is invisible to software that reads a resume as a stream of characters. A plain categorized list is text through and through, which means it is legible to a human reader, to a keyword search, and to any automated system standing between the two — all at once, without extra effort.

::: key
A skills section works as a small number of categorized text lists — Languages, Domains, Tools — never as proficiency-bar graphics or percentage claims, which assert a number nothing on the page can back up and which are invisible to any system reading the document as text.
:::

::: warning A skills list with no bullet behind it is a claim, not evidence
Listing "orbital mechanics" under Domains costs nothing and proves nothing by itself. If nothing elsewhere on the page demonstrates it with a specific project and a specific result, a careful reader either discounts the line or, worse, asks about it in an interview and finds there is little to say. Only list a domain you can immediately back with one real bullet.
:::

## Keyword-matching software, and what you can honestly plan around

Some employers' application systems apply automated keyword matching or filtering to a submitted resume before any person opens it; others route every application straight to a human reader with no automated filtering step at all. Practice on this varies by employer and by system, it is not something this module can state as a fixed fact about any one company's process, and you have no reliable way to know in advance which kind of system, if any, stands between your submission and the first person who reads it for a given posting.

That uncertainty resolves itself more cleanly than it first appears to. The same plain, specific, field-standard vocabulary that helps a human reader confirm a basic qualification in a fast first pass is also exactly what a simple keyword match needs: the literal word, present in the document as text. There is no separate strategy for "writing for software" distinct from writing precisely and honestly for a person — write in the field's real terms, attach them to real evidence, keep the document as plain text rather than as graphics, and both a human reader and whatever automated step might exist ahead of her can find what they are each looking for.

::: example Encoding "control systems," weakly and strongly
Weak: a summary paragraph states an interest in "control theory and dynamical systems" as part of a sentence about career goals. No project bullet anywhere on the page describes a controller, a gain, or a stability result. A reader scanning for "control systems" may notice the phrase, but has nothing to weigh it against — the word appears, unattached to evidence, and the claim goes uncredited by any careful reader.

Strong: the Domains line under Skills reads "control systems (PID, LQR), orbital mechanics, classical dynamics." In Projects, one bullet reads: "Designed and tuned a PID attitude controller for a rigid-body 3-axis simulation; achieved settling time under 4 seconds for a 30-degree slew with steady-state pointing error held below 0.5 degrees." The term now appears twice, in two forms that reinforce each other: a named claim in Skills, and a specific, checkable instance of it in Projects with a controller type and a measured result attached.
:::

::: example A categorized skills section, and what it replaces
Before, as a proficiency-bar list: "Python ●●●●○ · C++ ●●●○○ · MATLAB ●●●○○ · Control Theory ●●○○○." Four unexplained scores, no category structure, and nothing a reader can independently check.

After, as a categorized text list:

- Languages: Python, C++
- Domains: control systems, orbital mechanics, classical dynamics, modeling and simulation
- Tools: NumPy, SciPy, CVXPY, Git

Nothing here claims a precision the candidate cannot defend. Each line groups genuinely related items, uses the posting's own vocabulary where it is accurate, and leaves the actual proving — how well she does control systems work, specifically — to the project bullets a reader will meet a few lines further down the page.
:::

## Check yourself

::: check
A candidate's summary paragraph mentions "orbital mechanics" once, as part of a sentence about her interests, but no bullet anywhere on the page describes an orbits-related project. Has she encoded this basic qualification? Explain your reasoning.
:::

::: answer
Not fully. Encoding means the posting's vocabulary appears attached to real, checkable evidence, not merely mentioned. A single mention inside a general interest statement is a claim with nothing behind it — a careful reader either discounts it or, if she pursues it in an interview, finds there is little concrete to discuss. The word needs a bullet somewhere that demonstrates specific orbital-mechanics work with a result attached.
:::

::: check
Beyond the fact that a graphic cannot be read by parsing software, what is the core problem with a proficiency-bar skills list — the "four filled dots out of five" format?
:::

::: answer
The core problem is that the number has no defined scale behind it. Four out of five according to what measurement, set by whom, compared to what standard? A reader has nothing to check it against, unlike a bullet reporting a measured result, which states what was done and how it was verified. The bar graphic also invites the hardest kind of follow-up question to answer credibly — why a four and not a five — with no evidence on the page to answer it.
:::

::: check
A posting lists "aerodynamics" as a basic qualification. A candidate has a project involving atmospheric entry and a drag model, but her current bullet describes it only as "simulated a vehicle falling through the atmosphere," without using the word aerodynamics anywhere. What should she change, and why?
:::

::: answer
She should rewrite the bullet, and ideally add an entry under Skills, to use the field's actual term — aerodynamics, or a specific piece of it such as drag modeling or atmospheric flight — rather than a domain-neutral paraphrase like "falling through the atmosphere." The underlying work is unchanged; what changes is whether a fast reader scanning for the posting's own word can find it attached to real evidence without having to infer the connection herself.
:::

::: check
Explain why this lesson recommends encoding an important basic qualification in two separate places on the page — the skills section and a project bullet — rather than treating one as sufficient.
:::

::: answer
The two places do different jobs. The skills section is a scannable claim: it tells a reader quickly which named areas you consider yourself to have worked in. A project bullet is evidence: it shows one specific, verifiable instance with enough detail to be believed rather than merely noted. A claim with no evidence is easy to doubt; evidence a fast reader's eye skips past because the exact keyword never appears near it may not register on a first pass at all. Together, the claim tells her where to look and the evidence rewards her for looking.
:::

::: check
Why can a candidate not design her resume around the specific behavior of one company's keyword-matching software, and what should she do instead?
:::

::: answer
Practice on automated keyword matching varies by employer and by system, and a candidate has no reliable way to know in advance which kind of system, if any, stands between her submission and a human reader for a given posting — so designing around a guess about one specific system's behavior is designing around information she does not actually have. The resolution is that plain, specific, field-standard vocabulary attached to real evidence serves a human reader and any keyword system equally well, so there is no separate strategy needed for one versus the other.
:::

## Summary

| Basic qualification | What it typically looks like in self-directed work | Where it gets encoded |
| --- | --- | --- |
| Control systems | A controller or estimator gain tuned against a stability or performance target | Skills: Domains line; a controller/estimator bullet |
| Orbital mechanics | Two-body propagation, orbital elements, maneuver planning | Skills: Domains line; a propagation or maneuver bullet |
| Classical dynamics | Rigid-body kinematics and dynamics, often inside a 6-DOF simulation | Skills: Domains line; a simulation bullet |
| Aerodynamics | Atmosphere modeling, drag, ascent or entry flight | Skills: Domains line; an ascent/entry bullet |
| Sensors and actuators | IMU, star tracker, reaction wheels, thrusters, real or simulated | Skills: Tools/Domains line; a sensor-fusion or actuation bullet |
| Modeling and simulation | Any verified numerical model with a stated method of checking correctness | Skills: Domains line; nearly every project bullet |
| C++ and Python | The implementation languages, stated plainly and truthfully | Skills: Languages line; named per project in Projects |

The next lesson takes up the bullets themselves in full: the exact structure — problem, method, measured result — that turns a listed skill into evidence a reader believes, worked through several times against real anchor projects from this curriculum.
